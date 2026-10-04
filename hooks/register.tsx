import { atom, read, update } from 'claude-code'
import type { ElementTable, EngineInterface, Register } from 'claude-code'

import type { LearnChange, LearnConcept, LearnLive, LearnNote, LearnQuizItem, LearnQuizRun, LearnSubmit, LearnView } from '../types'
import {
  HISTORY_PER_PROJECT,
  HISTORY_PROJECTS,
  type HistoryEntry,
  JOURNAL_MAX_BYTES,
  NOTES_KEPT,
  SYSTEM,
  ASK_SYSTEM,
  askPrompt,
  askSection,
  beforeAfter,
  changeOf,
  cleanConcepts,
  conceptAt,
  conceptKey,
  conceptsMarkdown,
  conceptsOf,
  countConcepts,
  creationHunk,
  cut,
  expandHome,
  fitHistory,
  filesFor,
  forHistory,
  isGitMove,
  isRequestOrigin,
  failureText,
  focus,
  isUnder,
  journalHeader,
  dayBefore,
  dayNoon,
  journalFileOf,
  journalEntries,
  journalIndex,
  journalPath,
  journalSection,
  kindText,
  knownNames,
  listItem,
  isMissed,
  dueConcepts,
  dueText,
  markMissed,
  markReviewed,
  merge,
  mergeConcepts,
  parseQuiz,
  QUIZ_SYSTEM,
  quizPick,
  quizPrompt,
  noteEntry,
  noteLine,
  notePrompt,
  parseMerge,
  RECAP_SYSTEM,
  recapPrompt,
  rememberSubmit,
  recapRange,
  recapSection,
  type RecapEntry,
  type RecapRange,
  parseDiff,
  progressOf,
  rankConcepts,
  resolveKey,
  searchNotes,
  type RankedConcept,
  stamp,
  summaryOf,
  turnRequest,
  when,
  type Hunk,
  type Level,
} from './notes'

const PANE = 'learn-notes'
const TITLE = '학습 노트'

const notes = atom({ plugin: 'learn-notes', key: 'notes' } as const, [])
const live = atom({ plugin: 'learn-notes', key: 'live' } as const, null)
const selectedId = atom({ plugin: 'learn-notes', key: 'selectedId' } as const, null)
const view = atom({ plugin: 'learn-notes', key: 'view' } as const, 'note')
const autoOpened = atom({ plugin: 'learn-notes', key: 'autoOpened' } as const, false)
const concepts = atom({ plugin: 'learn-notes', key: 'concepts' } as const, {})
const paneRoot = atom({ plugin: 'learn-notes', key: 'root' } as const, null)
const aliases = atom({ plugin: 'learn-notes', key: 'aliases' } as const, {})
const quiz = atom({ plugin: 'learn-notes', key: 'quiz' } as const, null)
const quizRun = atom({ plugin: 'learn-notes', key: 'quizRun' } as const, { isMaking: false, error: null })
const submitted = atom({ plugin: 'learn-notes', key: 'submitted' } as const, { list: [], lastRequest: null })

/** `$.store` keys: notes per project for the next session, the concept index, merges and the last quiz. */
const HISTORY_KEY = 'history'
const CONCEPTS_KEY = 'concepts'
const ALIASES_KEY = 'aliases'
/** The last /learn quiz, so its answers are there in the next session too. */
const QUIZ_KEY = 'quiz'
/** What each merge folded away, so merging back splits the two again: merged-away key → its record. */
const MERGES_KEY = 'merges'

type MergeRecord = { concept: LearnConcept; into: string; both: number }

function cleanMerges(raw: unknown): Record<string, MergeRecord> {
  const out: Record<string, MergeRecord> = {}
  if (!isRecord(raw)) return out
  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value) || typeof value.into !== 'string' || typeof value.both !== 'number') continue
    const [concept] = Object.values(cleanConcepts({ one: value.concept }))
    if (concept) out[key] = { concept, into: value.into, both: value.both }
  }
  return out
}

/** Merges read back from the store: only concept keys pointing at concept keys. */
function cleanAliases(raw: unknown): Record<string, string> {
  const map: Record<string, string> = {}
  if (!isRecord(raw)) return map
  for (const [from, into] of Object.entries(raw)) {
    if (from.startsWith('c:') && typeof into === 'string' && into.startsWith('c:') && from !== into) map[from] = into
  }
  return map
}
type History = Record<string, HistoryEntry>

// The friendly view first: the note, then before/after, then the raw diff, then every concept so far, then a quiz on them.
const VIEWS: readonly LearnView[] = ['note', 'split', 'diff', 'concepts', 'quiz']
const VIEW_NEXT: Record<LearnView, LearnView> = { note: 'split', split: 'diff', diff: 'concepts', concepts: 'quiz', quiz: 'note' }
const VIEW_LABEL: Record<LearnView, string> = { note: '노트', split: '전/후', diff: 'diff', concepts: '개념 모음', quiz: '퀴즈' }
/** Views about every note at once, not the selected one. */
const isWhole = (mode: LearnView) => mode === 'concepts' || mode === 'quiz'

type Config = {
  isAutoNote: boolean
  isAutoOpen: boolean
  isAutoSave: boolean
  isReviewReminder: boolean
  model: string
  level: Level
  saveDir: string
}

function configOf(options: Readonly<Record<string, unknown>>): Config {
  return {
    isAutoNote: options.autoNote !== false,
    isAutoOpen: options.autoOpen !== false,
    isAutoSave: options.autoSave !== false,
    isReviewReminder: options.reviewReminder !== false,
    model: typeof options.model === 'string' && options.model !== '' ? options.model : 'haiku',
    level: options.level === 'intermediate' || options.level === 'advanced' ? options.level : 'beginner',
    saveDir: typeof options.saveDir === 'string' ? options.saveDir.trim() : '',
  }
}

function emptyLive(turnId: string, prompt: string): LearnLive {
  return { turnId, prompt, changes: [], dropped: [], unlisted: 0 }
}

// The module's own memory; a reload starts it over.
/** Whether an unasked pane would sit beside the transcript, read off the spinner's surface. */
let canDock: boolean | undefined
/** Notes whose model call runs in this environment. */
const inFlight = new Set<string>()
/** True while the pane asks the model for a quiz: one at a time. */
let isQuizMaking = false
/** The status line this plugin last pinned, so an unchanged count is not pinned again. */
let shownReminder: string | undefined
/** Saves run one after another: each reads the journal and writes it whole. */
let saving: Promise<unknown> = Promise.resolve()
/** Store writes likewise: each reads a whole value and writes it back. */
let storing: Promise<unknown> = Promise.resolve()
let hasWarnedSave = false
let hasWarnedStore = false
/** False for a `-p` run or an SDK host: there a note is stored only once written, since the process may end first. */
let isInteractive = true
/**
 * The latest prompts that entered and the last real request, as this module
 * load saw them: a turn starting right after a submit reads them before any
 * await. The `submitted` atom keeps a copy for after a reload.
 */
let recentSubmits: LearnSubmit[] = []
let lastRequestText: string | undefined

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** A stored note read back by a newer build: the fields it may lack filled in, an unfinished one failed. */
function fromHistory(raw: unknown, root: string): LearnNote | undefined {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !Array.isArray(raw.changes) || typeof raw.at !== 'number') return undefined
  const note = raw as unknown as LearnNote
  const isUnfinished = note.status === 'writing'
  return {
    ...note,
    prompt: typeof note.prompt === 'string' ? note.prompt : '',
    answer: typeof note.answer === 'string' ? note.answer : '',
    moreFiles: typeof note.moreFiles === 'number' ? note.moreFiles : 0,
    text: isUnfinished ? '세션이 끝나 노트를 다 쓰지 못했습니다 · w로 다시 쓰기' : String(note.text ?? ''),
    status: isUnfinished ? 'failed' : note.status,
    savedAs: note.savedAs ?? null,
    isPast: true,
    concepts: Array.isArray(note.concepts) ? note.concepts.filter(key => typeof key === 'string') : [],
    root: typeof note.root === 'string' && note.root !== '' ? note.root : root,
    updatedAt: typeof note.updatedAt === 'number' ? note.updatedAt : note.at,
  }
}

async function homeDir($: EngineInterface): Promise<string | undefined> {
  return (await $.env.get('HOME')) ?? (await $.env.get('USERPROFILE'))
}

/** Claude's own bookkeeping (plans, memory) and scratch files outside the project are not code the learner wrote. */
async function isBookkeeping($: EngineInterface, path: string): Promise<boolean> {
  const home = await homeDir($)
  if (home !== undefined && (isUnder(path, `${home}/.claude/plans`) || isUnder(path, `${home}/.claude/projects`))) return true
  const root = await $.session.root()
  if (root && isUnder(path, root)) return false
  const temps = ['/tmp', '/private/tmp', '/var/tmp', '/var/folders', await $.env.get('TMPDIR'), await $.env.get('TEMP'), await $.env.get('TMP')]
  return temps.some(dir => dir !== undefined && dir !== '' && isUnder(path, dir))
}

/** True in a cloud session (Claude Code on the web, an app's cloud session): its own terminal is drawn for no one. */
async function isCloudSession($: EngineInterface): Promise<boolean> {
  return (await $.env.get('CLAUDE_CODE_REMOTE')) === 'true'
}

async function journalDir($: EngineInterface, cfg: Config): Promise<string> {
  const home = await homeDir($)
  if (cfg.saveDir !== '') return expandHome(cfg.saveDir, home)
  return home ? `${home}/.claude/learning-notes` : `${await $.session.root()}/.claude/learning-notes`
}

/** Appends one note to the day's journal, after any save still running. */
function save($: EngineInterface, cfg: Config, note: LearnNote, isRewrite: boolean): Promise<string | undefined> {
  const run = saving.then(() => saveNow($, cfg, note, isRewrite))
  saving = run
  return run
}

/** A failure is a toast once and a debug line, never a broken turn. */
/** Appends `section` to `root`'s journal for the day of `at`, rolling over to the next part past the read limit. */
async function appendJournal($: EngineInterface, cfg: Config, root: string, at: number, section: string): Promise<string> {
  const dir = await journalDir($, cfg)
  let part = 1
  let path = journalPath(dir, at, root, part)
  while (part < 100 && (await $.fs.exists(path)) && (await $.fs.stat(path)).size > JOURNAL_MAX_BYTES) {
    part += 1
    path = journalPath(dir, at, root, part)
  }
  const prior = (await $.fs.exists(path)) ? await $.fs.read(path) : journalHeader(root, stamp(at).day)
  await $.fs.write(path, prior + section)
  return path
}

async function saveNow($: EngineInterface, cfg: Config, note: LearnNote, isRewrite: boolean): Promise<string | undefined> {
  try {
    // Into the journal of the note's own project, even after a /cd.
    const root = note.root || (await $.session.root())
    const path = await appendJournal($, cfg, root, note.at, journalSection(note, isRewrite))
    await setNote($, note.id, { savedAs: note.status })
    return path
  } catch (error) {
    $.ui.log(`learn-notes: 노트를 파일에 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
    if (!hasWarnedSave) {
      hasWarnedSave = true
      $.ui.toast('학습 노트를 파일에 저장하지 못했습니다 · /config에서 저장 폴더를 확인하세요', { timeoutMs: 8000 })
    }
    return undefined
  }
}

/** Changes one note in the pane and marks it newer than any copy made before. */
async function setNote($: EngineInterface, id: string, patch: Partial<LearnNote>): Promise<LearnNote | undefined> {
  const now = await $.clock.now()
  let found: LearnNote | undefined
  await update($, notes, list =>
    list.map(one => {
      if (one.id !== id) return one
      found = { ...one, ...patch, updatedAt: Math.max(now, one.updatedAt + 1) }
      return found
    }),
  )
  return found
}

async function isPaneVisible($: EngineInterface): Promise<boolean> {
  return (await $.ui.panes()).some(pane => pane.id === PANE && pane.isPlaced && pane.isShown)
}

/** Appends a /learn ask question and answer to today's journal of the note's project, after any save still running. */
function saveAsk($: EngineInterface, cfg: Config, note: LearnNote, question: string, answer: string, at: number): Promise<string | undefined> {
  const run = saving.then(async () => {
    try {
      return await appendJournal($, cfg, note.root || (await $.session.root()), at, askSection(note, question, answer, at))
    } catch (error) {
      $.ui.log(`learn-notes: 질문과 답을 파일에 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
      return undefined
    }
  })
  saving = run
  return run
}

/** Appends a recap to the journal of the last day it covers a note of, after any save still running. */
function saveRecap($: EngineInterface, cfg: Config, root: string, range: RecapRange, text: string, at: number, day: string): Promise<string | undefined> {
  const run = saving.then(async () => {
    try {
      // Under the day of the last note it covers, so a recap never makes a journal day with no notes.
      return await appendJournal($, cfg, root, dayNoon(day), recapSection(range, text, at, day))
    } catch (error) {
      $.ui.log(`learn-notes: 정리를 파일에 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
      return undefined
    }
  })
  saving = run
  return run
}

/**
 * Keeps this project's latest notes in the store for the next session, after
 * any store write still running. Notes merge by id with what is stored, so
 * two sessions in one project keep each other's notes; `forget` drops the
 * project instead (/learn clear).
 */
function persist($: EngineInterface, forget = false): Promise<void> {
  const run = storing.then(() => persistNow($, forget))
  storing = run
  return run
}

async function persistNow($: EngineInterface, forget: boolean): Promise<void> {
  try {
    const root = await $.session.root()
    const now = await $.clock.now()
    const list = await read($, notes)
    const raw = await $.store.get(HISTORY_KEY)
    const history: History = {}
    if (isRecord(raw)) {
      for (const [key, entry] of Object.entries(raw)) {
        if (isRecord(entry) && typeof entry.at === 'number' && Array.isArray(entry.notes)) history[key] = entry as HistoryEntry
      }
    }
    const fresher: LearnNote[] = []
    // Each note goes back under its own project, so a pane that moved projects mixes none.
    for (const where of new Set([root, ...list.map(one => one.root || root)])) {
      const prior = history[where]
      const clearedAt = forget && where === root ? now : (prior?.clearedAt ?? 0)
      const byId = new Map<string, LearnNote>()
      for (const one of prior?.notes ?? []) {
        if (isRecord(one) && typeof one.id === 'string' && typeof one.at === 'number') byId.set(one.id, one)
      }
      for (const one of list.filter(note => (note.root || root) === where)) {
        const stored = byId.get(one.id)
        // Of two copies of one note (another session changed it since), the newer stays.
        if (stored && typeof stored.updatedAt === 'number' && stored.updatedAt > one.updatedAt) {
          fresher.push(stored)
          continue
        }
        byId.set(one.id, forHistory(one))
      }
      const merged = [...byId.values()]
        .filter(one => one.at > clearedAt)
        .sort((a, b) => a.at - b.at)
        .slice(-HISTORY_PER_PROJECT)
      if (merged.length === 0 && clearedAt === 0) delete history[where]
      else history[where] = { at: now, notes: merged, ...(clearedAt > 0 ? { clearedAt } : {}) }
    }
    const recent = Object.fromEntries(
      Object.entries(history)
        .sort((a, b) => b[1].at - a[1].at)
        .slice(0, HISTORY_PROJECTS),
    )
    await $.store.set(HISTORY_KEY, fitHistory(recent, root))
    if (fresher.length > 0) {
      await update($, notes, current =>
        current.map(one => {
          const newer = fresher.find(copy => copy.id === one.id)
          const read = newer ? fromHistory(newer, one.root) : undefined
          return read ? { ...read, isPast: one.isPast } : one
        }),
      )
    }
  } catch (error) {
    $.ui.log(`learn-notes: 노트 이력을 저장하지 못했습니다 (${String(error)})`, { to: 'debug' })
    if (!hasWarnedStore) {
      hasWarnedStore = true
      $.ui.toast('학습 노트 이력을 저장하지 못했습니다 · 다음 세션에 지난 노트가 빠질 수 있습니다 (일지 파일은 그대로)', {
        timeoutMs: 8000,
      })
    }
  }
}

/** The notes the store keeps for `root`, past its last clear. */
async function storedNotes($: EngineInterface, root: string): Promise<LearnNote[]> {
  const raw = await $.store.get(HISTORY_KEY)
  const entry = isRecord(raw) ? raw[root] : undefined
  if (!isRecord(entry) || !Array.isArray(entry.notes)) return []
  const clearedAt = typeof entry.clearedAt === 'number' ? entry.clearedAt : 0
  return entry.notes
    .map(one => fromHistory(one, root))
    .filter(one => one !== undefined && one.at > clearedAt) as LearnNote[]
}

/** The merges as the store has them now (another session may have merged since), mirrored for drawing. */
async function currentAliases($: EngineInterface): Promise<Record<string, string>> {
  const map = cleanAliases(await $.store.get(ALIASES_KEY))
  if (JSON.stringify(map) !== JSON.stringify(await read($, aliases))) await update($, aliases, () => map)
  return map
}

/** Fills an empty pane with the notes earlier sessions left for this project, and the concept index. */
async function loadHistory($: EngineInterface): Promise<void> {
  try {
    const merged = cleanAliases(await $.store.get(ALIASES_KEY))
    if (Object.keys(merged).length > 0 && Object.keys(await read($, aliases)).length === 0) {
      await update($, aliases, () => merged)
    }
    const index = cleanConcepts(await $.store.get(CONCEPTS_KEY), merged)
    if (Object.keys(index).length > 0 && Object.keys(await read($, concepts)).length === 0) {
      await update($, concepts, () => index)
    }
    const root = await $.session.root()
    const isEmpty = (await read($, notes)).length === 0
    if ((await read($, paneRoot)) === null || isEmpty) await update($, paneRoot, () => root)
    if (!isEmpty) return
    const past = await storedNotes($, root)
    if (past.length > 0) await update($, notes, list => (list.length > 0 ? list : past.slice(-NOTES_KEPT)))
  } catch (error) {
    $.ui.log(`learn-notes: 지난 노트를 불러오지 못했습니다 (${String(error)})`, { to: 'debug' })
  }
}

/** After /cd or a worktree move: the old project's notes go to the store, the new one's come up. */
async function followRoot($: EngineInterface): Promise<void> {
  const root = await $.session.root()
  const loadedFor = await read($, paneRoot)
  if (loadedFor === null || loadedFor === root) return
  await persist($)
  const past = await storedNotes($, root)
  await update($, notes, () => past.slice(-NOTES_KEPT))
  await update($, selectedId, () => null)
  await update($, paneRoot, () => root)
}

/**
 * Counts a finished note's concepts into the index (store first, then the
 * pane's mirror); a rewrite counts only what changed. Returns the note's keys.
 */
function learnConcepts($: EngineInterface, cfg: Config, note: LearnNote): Promise<string[]> {
  const run = storing.then(() => learnConceptsNow($, cfg, note))
  storing = run
  return run
}

async function learnConceptsNow($: EngineInterface, cfg: Config, note: LearnNote): Promise<string[]> {
  // A name merged away (/learn merge, here or in another session) counts under the concept it went into;
  // the note's own keys from before a merge are read the same way, so a rewrite never counts one twice.
  const map = await currentAliases($)
  // Files are matched on the whole explanation line: a cut one can lose the code it quotes.
  const lines = new Map(conceptsOf(note.text, Number.POSITIVE_INFINITY).map(one => [one.key, one.blurb]))
  const found = conceptsOf(note.text)
    .map(one => ({ ...one, line: lines.get(one.key) ?? one.blurb, key: resolveKey(map, one.key) }))
    .filter((one, i, all) => all.findIndex(other => other.key === one.key) === i)
  const keys = found.map(one => one.key)
  const had = note.concepts.map(key => resolveKey(map, key)).filter((key, i, all) => all.indexOf(key) === i)
  const taught = found.filter(one => !had.includes(one.key))
  const untaught = had.filter(key => !keys.includes(key))
  if (taught.length === 0 && untaught.length === 0) return keys
  try {
    const raw = await $.store.get(CONCEPTS_KEY)
    const index = countConcepts(
      isRecord(raw) ? cleanConcepts(raw, map) : await read($, concepts),
      taught.map(({ line, ...one }) => ({ ...one, files: filesFor(line, note.changes) })),
      untaught,
      note.at,
      note.changes.map(change => change.file),
    )
    await $.store.set(CONCEPTS_KEY, index)
    await update($, concepts, () => index)
    await remind($, cfg)
    if (cfg.isAutoSave) await saveConcepts($, cfg, index)
  } catch (error) {
    $.ui.log(`learn-notes: 개념을 모으지 못했습니다 (${String(error)})`, { to: 'debug' })
  }
  return keys
}

/** Rewrites concepts.md beside the journals, after any journal save still running. */
function saveConcepts($: EngineInterface, cfg: Config, index: Record<string, LearnConcept>): Promise<unknown> {
  const run = saving.then(async () => {
    try {
      await $.fs.write(`${(await journalDir($, cfg)).replace(/[\\/]+$/, '')}/concepts.md`, conceptsMarkdown(index))
    } catch (error) {
      $.ui.log(`learn-notes: 개념 모음을 파일에 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
  })
  saving = run
  return run
}

/** Every note there is: the pane's, then every project's in the store (the pane's copy of one note wins). */
async function allNotes($: EngineInterface): Promise<LearnNote[]> {
  const byId = new Map<string, LearnNote>()
  for (const note of await read($, notes)) byId.set(note.id, note)
  const raw = await $.store.get(HISTORY_KEY)
  if (isRecord(raw)) {
    for (const [root, entry] of Object.entries(raw)) {
      if (!isRecord(entry) || !Array.isArray(entry.notes)) continue
      const clearedAt = typeof entry.clearedAt === 'number' ? entry.clearedAt : 0
      for (const one of entry.notes) {
        const note = fromHistory(one, root)
        if (note && note.at > clearedAt && !byId.has(note.id)) byId.set(note.id, note)
      }
    }
  }
  return [...byId.values()]
}

type MergeResult = { isDone: true; gone: LearnConcept; kept: LearnConcept; isSplit: boolean } | { isDone: false; text: string }

/**
 * Folds the concept named `fromName` into the one named `intoName`, against
 * the store as it is now (another session may have merged since): counts
 * added less the notes that taught both, the alias kept for later notes, the
 * pane's notes re-keyed. Naming a concept that was merged away as the target
 * undoes that merge: two concepts merged are split again as they were, less
 * nothing met since; a rename is renamed back.
 */
function mergeConceptStored($: EngineInterface, cfg: Config, fromName: string, intoName: string): Promise<MergeResult> {
  const run = storing.then(async (): Promise<MergeResult> => {
    try {
      const map = cleanAliases(await $.store.get(ALIASES_KEY))
      const index = cleanConcepts(await $.store.get(CONCEPTS_KEY), map)
      const from = resolveKey(map, conceptKey(fromName))
      const named = conceptKey(intoName)
      // 'merge X = Y' where Y was merged into X before: take Y back out under its own name.
      const isUndo = named !== from && resolveKey(map, named) === from
      const into = isUndo ? named : resolveKey(map, named)
      const gone = conceptAt(index, from)
      if (!gone) return { isDone: false, text: `없는 개념입니다: '${fromName}'. /learn concepts로 이름을 확인하세요.\n\n${MERGE_USAGE}` }
      if (from === into) return { isDone: false, text: `'${fromName}' · '${intoName}': 이미 같은 개념으로 셉니다.` }
      const merges = cleanMerges(await $.store.get(MERGES_KEY))
      const record = isUndo ? merges[named] : undefined
      const nextMap: Record<string, string> = {}
      for (const [key, target] of Object.entries(map)) if (!(isUndo && key === named)) nextMap[key] = target
      const nextMerges: Record<string, MergeRecord> = { ...merges }
      delete nextMerges[named]
      let folded: Record<string, LearnConcept>
      let isSplit = false
      if (record && record.into === from) {
        // Two concepts merged before: each gets its own back; what the merged one met since stays with it.
        folded = { ...index, [named]: record.concept }
        folded[from] = { ...gone, count: Math.max(1, gone.count - (record.concept.count - record.both)) }
        isSplit = true
      } else {
        nextMap[from] = into
        // One note that taught both names counts once; merging back a rename has nothing to take off.
        const both = isUndo
          ? 0
          : (await allNotes($)).filter(note => {
              const keys = note.concepts.map(key => resolveKey(map, key))
              return keys.includes(from) && keys.includes(resolveKey(map, into))
            }).length
        if (!isUndo && conceptAt(index, into)) nextMerges[from] = { concept: gone, into, both }
        folded = mergeConcepts(index, from, into, intoName)
        const kept = folded[into]!
        folded[into] = { ...kept, count: Math.max(1, kept.count - both) }
      }
      await $.store.set(CONCEPTS_KEY, folded)
      await $.store.set(ALIASES_KEY, nextMap)
      await $.store.set(MERGES_KEY, nextMerges)
      await update($, concepts, () => folded)
      await remind($, cfg)
      await update($, aliases, () => nextMap)
      const now = await $.clock.now()
      await update($, notes, list =>
        list.map(note =>
          !isSplit && note.concepts.includes(from)
            ? {
                ...note,
                concepts: note.concepts.map(key => (key === from ? into : key)).filter((key, i, all) => all.indexOf(key) === i),
                updatedAt: Math.max(now, note.updatedAt + 1),
              }
            : note,
        ),
      )
      if (cfg.isAutoSave) await saveConcepts($, cfg, folded)
      return isSplit ? { isDone: true, gone: folded[named]!, kept: folded[from]!, isSplit } : { isDone: true, gone, kept: folded[into]!, isSplit }
    } catch (error) {
      $.ui.log(`learn-notes: 개념을 합치지 못했습니다 (${String(error)})`, { to: 'debug' })
      return { isDone: false, text: '개념을 합치지 못했습니다(저장소에 쓰지 못함). 잠시 뒤 다시 해 보세요.' }
    }
  })
  storing = run
  return run
}

/**
 * Pins "복습할 개념 n개" under the prompt while any concept is due for review,
 * and takes it down when none is (or the reminder is off in /config).
 */
async function remind($: EngineInterface, cfg: Config): Promise<void> {
  const due = cfg.isReviewReminder ? dueConcepts(await read($, concepts), await $.clock.now()).length : 0
  const text = due > 0 ? `학습 노트 · 복습할 개념 ${due}개 · /learn 패널에서 q` : undefined
  if (text === shownReminder) return
  shownReminder = text
  $.ui.status(text)
}

/** Marks concepts after a quiz (gone over, or got wrong), in the store and the pane's mirror. */
function markConcepts($: EngineInterface, cfg: Config, mark: typeof markReviewed, keys: readonly string[], at: number): Promise<boolean> {
  const run = storing.then(async () => {
    try {
      const map = cleanAliases(await $.store.get(ALIASES_KEY))
      const index = mark(cleanConcepts(await $.store.get(CONCEPTS_KEY), map), keys.map(key => resolveKey(map, key)), at)
      await $.store.set(CONCEPTS_KEY, index)
      await update($, concepts, () => index)
      await remind($, cfg)
      if (cfg.isAutoSave) await saveConcepts($, cfg, index)
      return true
    } catch (error) {
      $.ui.log(`learn-notes: 복습을 기록하지 못했습니다 (${String(error)})`, { to: 'debug' })
      return false
    }
  })
  storing = run
  return run
}

/** Every note the journal holds for these days in this project, part by part. */
async function journalEntriesFor($: EngineInterface, cfg: Config, days: readonly string[]): Promise<RecapEntry[]> {
  const wanted = new Set(days)
  const found: RecapEntry[] = []
  for (const one of await journalDays($, cfg)) {
    if (!wanted.has(one.day)) continue
    for (const path of one.parts) {
      const text = await $.fs.read(path).catch(() => '')
      found.push(...journalEntries(String(text)))
    }
  }
  return found
}

type Quiz = { at: number; items: LearnQuizItem[]; isRevealed: boolean }

/** One quiz question read back from the store; undefined when it is not one. */
function quizItemOf(one: unknown): LearnQuizItem | undefined {
  if (!isRecord(one)) return undefined
  const { key, name, question, answer, isShown, result } = one
  if (typeof key !== 'string' || typeof name !== 'string' || typeof question !== 'string' || typeof answer !== 'string') return undefined
  return {
    key,
    name,
    question,
    answer,
    ...(isShown === true ? { isShown } : {}),
    ...(result === 'right' || result === 'wrong' ? { result } : {}),
  }
}

/** This session's last quiz, else the one a past session left in the store. */
async function lastQuiz($: EngineInterface): Promise<Quiz | null> {
  const here = await read($, quiz)
  if (here) return here
  const raw = await $.store.get(QUIZ_KEY).catch(() => undefined)
  if (!isRecord(raw) || typeof raw.at !== 'number' || !Array.isArray(raw.items)) return null
  const items = raw.items.map(quizItemOf).filter(one => one !== undefined)
  return items.length > 0 ? { at: raw.at, items, isRevealed: raw.isRevealed === true } : null
}

/** Whether the learner has seen a question's answer: shown in the pane, or all of them by /learn quiz 정답. */
function isAnswerShown(current: Quiz, item: LearnQuizItem): boolean {
  return current.isRevealed || item.isShown === true
}

/** A wrong answer: gone over now, and first in the next quiz. */
const markWrong: typeof markReviewed = (index, keys, at) => markMissed(markReviewed(index, keys, at), keys, at)

const NO_CONCEPTS_FOR_QUIZ = '아직 모인 개념이 없어 퀴즈를 낼 수 없습니다. 노트가 쓰이면 "배울 개념"이 쌓입니다.'

/**
 * Asks the model for a new quiz and keeps it; or says why there is none. The
 * concepts due first, or `only` these (a note's, for t in the pane).
 */
async function makeQuiz(
  $: EngineInterface,
  cfg: Config,
  now: number,
  only?: readonly string[],
): Promise<{ items: LearnQuizItem[] } | { error: string }> {
  const index = await read($, concepts)
  const map = await read($, aliases)
  const picks = only
    ? only
        .map(key => resolveKey(map, key))
        .filter((key, i, all) => all.indexOf(key) === i)
        .flatMap(key => {
          const one = conceptAt(index, key)
          return one ? [{ ...one, key }] : []
        })
        .slice(0, 3)
    : quizPick(index, now)
  if (picks.length === 0) return { error: only ? '이 노트에는 배울 개념이 없어 퀴즈를 낼 수 없습니다.' : NO_CONCEPTS_FOR_QUIZ }
  let reply
  try {
    reply = await $.model.complete({ model: cfg.model, system: QUIZ_SYSTEM, prompt: quizPrompt(picks, cfg.level), maxTokens: 900, effort: 'low', timeoutMs: 90_000 })
  } catch {
    return { error: `'${cfg.model}' 모델을 부를 수 없습니다 · /config에서 다른 모델을 골라 보세요` }
  }
  if (!reply.isAnswered) return { error: `퀴즈를 내지 못했습니다: ${failureText(reply).replace(/ · .*$/, '')}` }
  const items = parseQuiz(reply.text, picks)
  if (items.length === 0) return { error: '퀴즈를 내지 못했습니다: 모델의 답을 문제로 읽지 못했습니다. 다시 해 보세요.' }
  await keepQuiz($, { at: now, items, isRevealed: false })
  await update($, quizRun, run => ({ ...run, error: null }))
  return { items }
}

/** The pane's s (or t, on `only` a note's concepts): a new quiz, the pane saying "making" until it is there or failed. */
async function startQuiz($: EngineInterface, cfg: Config, only?: readonly string[]): Promise<void> {
  if (isQuizMaking) return
  isQuizMaking = true
  try {
    await update($, quizRun, () => ({ isMaking: true, error: null }))
    const made = await makeQuiz($, cfg, await $.clock.now(), only)
    await update($, quizRun, () => ({ isMaking: false, error: 'error' in made ? made.error : null }))
  } catch (error) {
    $.ui.log(`learn-notes: 퀴즈를 내지 못했습니다 (${String(error)})`, { to: 'debug' })
    await update($, quizRun, () => ({ isMaking: false, error: '퀴즈를 내지 못했습니다. 잠시 뒤 다시 해 보세요.' }))
  } finally {
    isQuizMaking = false
  }
}

/** The pane's a: one question's answer. */
async function showAnswer($: EngineInterface, i: number): Promise<void> {
  const current = await lastQuiz($)
  const item = current?.items[i]
  if (!current || !item || isAnswerShown(current, item)) return
  await keepQuiz($, { ...current, items: current.items.map((one, j) => (j === i ? { ...one, isShown: true } : one)) })
}

/** The pane's o and x: the learner's own grade for one question, kept on its concept for the next quiz. */
async function gradeQuiz($: EngineInterface, cfg: Config, i: number, result: 'right' | 'wrong'): Promise<void> {
  const current = await lastQuiz($)
  const item = current?.items[i]
  if (!current || !item || item.result !== undefined || !isAnswerShown(current, item)) return
  const now = await $.clock.now()
  if (!(await markConcepts($, cfg, result === 'right' ? markReviewed : markWrong, [item.key], now))) {
    await update($, quizRun, run => ({ ...run, error: '채점을 적지 못했습니다(저장소에 쓰지 못함). 잠시 뒤 다시 해 보세요.' }))
    return
  }
  // Read again: the quiz may have moved on while the concepts were written.
  const latest = (await lastQuiz($)) ?? current
  if (latest.at !== current.at) return
  await keepQuiz($, { ...latest, items: latest.items.map((one, j) => (j === i ? { ...one, isShown: true, result } : one)) })
  await update($, quizRun, run => ({ ...run, error: null }))
}

/** The quiz as it stands now, in the session and the store. */
async function keepQuiz($: EngineInterface, next: Quiz): Promise<void> {
  await update($, quiz, () => next)
  try {
    await $.store.set(QUIZ_KEY, next)
  } catch (error) {
    $.ui.log(`learn-notes: 퀴즈를 저장소에 남기지 못했습니다 (${String(error)})`, { to: 'debug' })
  }
}

/** The days this project has journal files for, the newest first, each with its parts in order. */
async function journalDays($: EngineInterface, cfg: Config): Promise<{ day: string; parts: string[] }[]> {
  const dir = (await journalDir($, cfg)).replace(/[\\/]+$/, '')
  const root = await $.session.root()
  const days = new Map<string, { part: number; path: string }[]>()
  for (const entry of await $.fs.list(dir).catch(() => [])) {
    const file = entry.kind === 'file' ? journalFileOf(entry.name, root) : undefined
    if (!file) continue
    days.set(file.day, [...(days.get(file.day) ?? []), { part: file.part, path: `${dir}/${entry.name}` }])
  }
  return [...days.entries()]
    .map(([day, parts]) => ({ day, parts: parts.sort((a, b) => a.part - b.part).map(one => one.path) }))
    .sort((a, b) => (a.day < b.day ? 1 : -1))
}

/** Writes the note for `id` with the model; the pane redraws as its status moves. `isEasier`: in the plainest words (e). */
async function writeNote($: EngineInterface, cfg: Config, id: string, isRewrite: boolean, isEasier = false): Promise<void> {
  if (inFlight.has(id)) return
  inFlight.add(id)
  try {
    const note = await setNote($, id, { status: 'writing', text: '' })
    if (!note) return
    let patch: Partial<LearnNote>
    try {
      const reply = await $.model.complete({
        model: cfg.model,
        system: SYSTEM,
        prompt: notePrompt(note, isEasier ? 'beginner' : cfg.level, knownNames(await read($, concepts)), isEasier),
        maxTokens: 1500,
        effort: 'low',
        timeoutMs: 90_000,
      })
      patch = reply.isAnswered
        ? { status: 'ready', text: cut(reply.text, 9000) }
        : { status: 'failed', text: failureText(reply) }
    } catch {
      patch = { status: 'failed', text: `'${cfg.model}' 모델을 부를 수 없습니다 · /config에서 다른 모델을 골라 보세요` }
    }
    // A note cleared from the pane meanwhile is still saved from this copy.
    let done = (await setNote($, id, patch)) ?? { ...note, ...patch }
    if (done.status === 'ready') {
      const keys = await learnConcepts($, cfg, done)
      done = (await setNote($, id, { concepts: keys })) ?? { ...done, concepts: keys }
    }
    if (cfg.isAutoSave) await save($, cfg, done, isRewrite)
    await persist($)
    if (done.status === 'ready' && !(await isPaneVisible($))) {
      const line = summaryOf(done.text)
      $.ui.toast(`학습 노트: ${line === '' ? '준비됐습니다' : line} · /learn으로 보기`, { timeoutMs: 6000 })
    }
  } finally {
    inFlight.delete(id)
  }
}

/** Folds one tool's change into the running turn. */
async function collect($: EngineInterface, change: LearnChange): Promise<void> {
  await update($, live, prior => {
    const base = prior ?? emptyLive('', '')
    const { changes, dropped } = merge(base.changes, change)
    const isNew = dropped !== undefined && !base.dropped.includes(dropped)
    return { ...base, changes, dropped: isNew ? [...base.dropped, dropped] : base.dropped }
  })
}

async function countUnlisted($: EngineInterface, count: number): Promise<void> {
  await update($, live, prior => {
    const base = prior ?? emptyLive('', '')
    return { ...base, unlisted: base.unlisted + count }
  })
}

/** Moves the selection by `delta` from where it stands now; the newest note means "follow". */
async function stepNote($: EngineInterface, delta: number): Promise<void> {
  const list = await read($, notes)
  await update($, selectedId, current => {
    const found = current === null ? -1 : list.findIndex(one => one.id === current)
    const at = found === -1 ? list.length - 1 : found
    const to = Math.max(0, Math.min(list.length - 1, at + delta))
    return to >= list.length - 1 ? null : (list[to]?.id ?? null)
  })
}

export const register: Register = (on, options) => {
  const cfg = configOf(options)

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'learn',
      description: '학습 노트 패널을 연다 (/learn help: 하위 명령)',
      argumentHint: '[last|concepts|recap|quiz|ask|stats|anki|find|day|days|merge|save|clear|help]',
      immediate: true,
    })
    isInteractive = e.isInteractive
    await loadHistory($)
    await remind($, cfg)
    // A quiz request a reload cut off is not coming back; the last quiz is there for the pane to draw.
    if (!isQuizMaking) await update($, quizRun, () => ({ isMaking: false, error: null }))
    if ((await read($, quiz)) === null) {
      const last = await lastQuiz($)
      if (last) await update($, quiz, () => last)
    }
    return next(e)
  })

  // Only reads where the spinner is drawn, to know whether a pane would dock.
  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    canDock = e.surface === 'desktop' || (e.surface === 'terminal' && e.viewport?.isFullscreen === true)
    return next(e)
  })

  // Who sent each prompt: a turn a notification or another session starts is not the person's request.
  on('prompt.submit', async ($, e, next) => {
    const result = await next(e)
    // A prompt a hook stopped never entered: it must not turn up in a later note.
    if (result.drop !== undefined) return result
    const text = typeof result.text === 'string' ? result.text : e.text
    const isRequest = isRequestOrigin(e.origin)
    recentSubmits = rememberSubmit(recentSubmits, { text, isRequest })
    if (isRequest) lastRequestText = cut(text, 2000)
    const kept = { list: recentSubmits, lastRequest: lastRequestText ?? null }
    await update($, submitted, prior => ({
      list: [...prior.list, ...kept.list].reduce<LearnSubmit[]>(rememberSubmit, []),
      lastRequest: kept.lastRequest ?? prior.lastRequest,
    }))
    return result
  })

  on('turn.start', async ($, e, next) => {
    const seen = { list: recentSubmits, lastRequest: lastRequestText }
    await followRoot($)
    const kept = await read($, submitted)
    const list = [...kept.list, ...seen.list]
    const request = turnRequest(e.text, list, seen.lastRequest ?? kept.lastRequest ?? undefined)
    // Changes left by a turn whose end never arrived ride into this one rather than vanish.
    await update($, live, prior => ({
      ...(prior ?? emptyLive('', '')),
      turnId: e.turnId,
      prompt: e.text !== '' ? request : (prior?.prompt ?? ''),
    }))
    return next(e)
  })

  on('tool.call', { tool: ['Edit', 'Write'] }, async ($, e, next) => {
    const ran = await next(e)
    try {
      if (ran.deny !== undefined || ran.isError || !ran.result) return ran
      const root = await $.session.root()
      if (e.tool === 'Edit' && 'oldString' in ran.result) {
        const r = ran.result
        if (r.staged || (await isBookkeeping($, r.filePath))) return ran
        await collect($, changeOf({ path: r.filePath, root, tool: 'Edit', kind: 'update', hunks: r.structuredPatch }))
      } else if (e.tool === 'Write' && 'content' in ran.result) {
        const r = ran.result
        if (r.staged || (await isBookkeeping($, r.filePath))) return ran
        const kind = r.type === 'create' ? 'create' : 'update'
        if (kind === 'update' && r.structuredPatch.length === 0 && r.originalFile === r.content) return ran
        // An update with no patch (too large, or the diff timed out) still shows, marked as having no diff.
        const hunks: Hunk[] =
          r.structuredPatch.length > 0 ? r.structuredPatch : kind === 'create' ? [creationHunk(r.content)] : []
        await collect($, changeOf({ path: r.filePath, root, tool: 'Write', kind, hunks }))
      }
    } catch (error) {
      $.ui.log(`learn-notes: 바뀐 코드를 잡지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
    return ran
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    try {
      if (ran.deny !== undefined || ran.isError || !ran.result || !('stdout' in ran.result)) return ran
      const edits = ran.result.bashEditDiff
      // What a stash, checkout or pull put on disk is not an edit made this turn.
      if (!edits || isGitMove(e.command)) return ran
      const root = await $.session.root()
      for (const file of edits.files) {
        if (file.hunks.length === 0 || (await isBookkeeping($, file.filePath))) continue
        const kind = file.created ? 'create' : file.deleted ? 'delete' : 'update'
        await collect($, changeOf({ path: file.filePath, root, tool: 'Bash', kind, hunks: file.hunks }))
      }
      if (edits.moreFiles > 0) await countUnlisted($, edits.moreFiles)
    } catch (error) {
      $.ui.log(`learn-notes: 셸 명령의 변경을 잡지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    // Take the turn's changes and clear them in one write, so an edit landing now is not lost.
    const box: { turn: LearnLive | null } = { turn: null }
    await update($, live, prior => {
      box.turn = prior
      return null
    })
    const turn = box.turn
    if (turn && turn.changes.length > 0) {
      const at = await $.clock.now()
      const note: LearnNote = {
        id: `${e.turnId}-${at}`,
        turnId: e.turnId,
        at,
        prompt: turn.prompt,
        answer: cut(e.answer, 2000),
        changes: turn.changes,
        moreFiles: turn.dropped.length + turn.unlisted,
        status: cfg.isAutoNote ? 'writing' : 'off',
        text: '',
        savedAs: null,
        isPast: false,
        concepts: [],
        root: await $.session.root(),
        updatedAt: at,
      }
      await update($, notes, list => [...list, note].slice(-NOTES_KEPT))
      if (cfg.isAutoNote && isInteractive) {
        $.clock.after(1, () => void writeNote($, cfg, note.id, false))
      } else if (cfg.isAutoNote) {
        // A -p run's process ends with its turn: the note is written before the turn is handed on,
        // or it never lands. The model call does not count against this hook's time.
        await writeNote($, cfg, note.id, false)
      } else if (cfg.isAutoSave) {
        await save($, cfg, note, false)
      }
      // Stored at once, so a session that ends mid-note still leaves it for the next one.
      if (isInteractive || note.status !== 'writing') await persist($)
      // Opened unasked only where it docks beside the transcript, and once a session.
      if (cfg.isAutoOpen && canDock === true && !(await read($, autoOpened))) {
        await update($, autoOpened, () => true)
        if (!(await isPaneVisible($))) void $.ui.open({ id: PANE, title: TITLE })
      }
    }
    // Concepts fall due as time passes: each turn's end looks again.
    await remind($, cfg)
    return next(e)
  })

  on('command.run', { command: 'learn' }, async ($, e) => {
    const words = e.args.trim()
    const arg = (words.split(/\s+/)[0] ?? '').toLowerCase()
    const rest = words.slice(arg.length).trim()
    const list = await read($, notes)
    if (arg === 'help') return { text: HELP }
    if (arg === 'find') {
      if (rest === '') return { text: '쓰는 법: /learn find 찾을 말 (요청 · 노트 내용 · 파일 이름 · 개념 이름에서 찾습니다)' }
      const now = await $.clock.now()
      const found = searchNotes(await allNotes($), rest, await currentAliases($))
      if (found.length === 0) return { text: `'${rest}'에 맞는 노트가 없습니다.` }
      // Picked in the pane only while the pane holds this project (a /cd not yet followed holds the old one).
      const isPaneHere = (await read($, paneRoot)) === (await $.session.root())
      const inPane = isPaneHere ? found.find(note => list.some(one => one.id === note.id)) : undefined
      if (inPane) {
        await update($, selectedId, () => (list.at(-1)?.id === inPane.id ? null : inPane.id))
        await update($, view, () => 'note')
      }
      const lines = found.slice(0, 15).map(note => `- ${noteLine(note, now)}`)
      const more = found.length > 15 ? `\n\n그 밖에 ${found.length - 15}개` : ''
      const shown = inPane ? '\n\n이 프로젝트의 가장 최근 결과를 패널에서 골라 두었습니다 (/learn으로 열기).' : ''
      return { text: `'${rest}' 노트 ${found.length}개\n\n${lines.join('\n')}${more}${shown}` }
    }
    if (arg === 'merge') {
      const pair = parseMerge(rest)
      if (!pair) return { text: MERGE_USAGE }
      const result = await mergeConceptStored($, cfg, pair.from, pair.into)
      if (!result.isDone) return { text: result.text }
      await persist($)
      const { gone, kept } = result
      if (result.isSplit) {
        return { text: `되돌렸습니다. 다시 따로 셉니다: '${gone.name}' ×${gone.count} · '${kept.name}' ×${kept.count}` }
      }
      return {
        text: `합쳤습니다: '${gone.name}' ×${gone.count} → '${kept.name}' ×${kept.count}. 앞으로 노트의 '${gone.name}'도 '${kept.name}' 개념으로 셉니다.`,
      }
    }
    if (arg === 'quiz') {
      const now = await $.clock.now()
      const current = await lastQuiz($)
      if (/^(정답|답|answer|answers)$/i.test(rest)) {
        if (!current || current.items.length === 0) return { text: NO_QUIZ }
        // Seeing the answers again keeps the misses marked since the first time, and the grades given in the pane.
        const ungraded = current.items.filter(item => item.result === undefined)
        const isMarked =
          !current.isRevealed && ungraded.length > 0 && (await markConcepts($, cfg, markReviewed, ungraded.map(item => item.key), now))
        await keepQuiz($, { ...current, isRevealed: true })
        const lines = current.items.map((item, i) => listItem(i + 1, `${item.answer}\n(개념: ${item.name})`))
        const marked = isMarked ? `\n\n복습으로 표시했습니다: ${ungraded.map(item => item.name).join(' · ')}` : ''
        const hint = `\n\n틀린 문제는 /learn quiz 틀림 ${current.items.length > 1 ? '2' : '1'}처럼 번호로 알려 주면 다음 퀴즈에 먼저 나옵니다.`
        return { text: `정답\n\n${lines.join('\n\n')}${marked}${hint}` }
      }
      const miss = /^(?:틀림|틀렸어|틀렸음|틀린|오답|miss|missed|wrong)\s*(.*)$/i.exec(rest)
      if (miss) {
        if (!current || current.items.length === 0) return { text: NO_QUIZ }
        if (!current.isRevealed) return { text: '먼저 /learn quiz 정답으로 답을 맞춰 본 뒤, 틀린 문제 번호를 알려 주세요.' }
        const said = [...new Set((miss[1]!.match(/\d+/g) ?? []).map(Number))]
        const numbers = said.length === 0 && current.items.length === 1 ? [1] : said
        const items = numbers.map(n => current.items[n - 1]).filter(item => item !== undefined)
        if (items.length === 0 || items.length !== numbers.length) {
          return { text: `틀린 문제 번호를 1~${current.items.length} 사이로 알려 주세요. 예: /learn quiz 틀림 ${current.items.length}` }
        }
        if (!(await markConcepts($, cfg, markMissed, items.map(item => item.key), now))) {
          return { text: '틀린 문제를 적지 못했습니다(저장소에 쓰지 못함). 잠시 뒤 다시 해 보세요.' }
        }
        // The pane's quiz shows them graded too.
        await keepQuiz($, { ...current, items: current.items.map((item, i) => (numbers.includes(i + 1) ? { ...item, result: 'wrong' as const } : item)) })
        return { text: `복습할 개념 맨 앞에 올렸습니다: ${items.map(item => item.name).join(' · ')}. 다음 퀴즈에 먼저 나옵니다.` }
      }
      if (rest !== '') return { text: QUIZ_USAGE }
      const made = await makeQuiz($, cfg, now)
      if ('error' in made) return { text: made.error }
      const lines = made.items.map((item, i) => listItem(i + 1, item.question))
      return {
        text: `복습 퀴즈 · ${made.items.length}문제\n\n${lines.join('\n\n')}\n\n먼저 스스로 답해 보고, /learn quiz 정답으로 확인하세요. 패널(/learn)의 퀴즈 보기(q)에서는 한 문제씩 답을 보고 맞음·틀림을 고를 수 있습니다.`,
      }
    }
    if (arg === 'ask') {
      if (rest === '') return { text: ASK_USAGE }
      const wanted = await read($, selectedId)
      const note = list.find(one => one.id === wanted) ?? list.at(-1)
      if (!note) return { text: '물어볼 노트가 없습니다. 코딩을 요청해 노트가 생기면 /learn ask 질문으로 물어보세요.' }
      let reply
      try {
        reply = await $.model.complete({ model: cfg.model, system: ASK_SYSTEM, prompt: askPrompt(note, rest, cfg.level), maxTokens: 900, effort: 'low', timeoutMs: 90_000 })
      } catch {
        return { text: `'${cfg.model}' 모델을 부를 수 없습니다 · /config에서 다른 모델을 골라 보세요` }
      }
      if (!reply.isAnswered) return { text: `답하지 못했습니다: ${failureText(reply).replace(/ · .*$/, '')}` }
      const answer = cut(reply.text, 4000)
      const now = await $.clock.now()
      const path = cfg.isAutoSave ? await saveAsk($, cfg, note, rest, answer, now) : undefined
      const which = `${when(note.at, now)} 노트${note.prompt === '' ? '' : ` (${cut(note.prompt.replace(/\s+/g, ' '), 40)})`}`
      return { text: `${which}에 대한 답${path ? ' · 일지에 남김' : ''}\n\n${answer}` }
    }
    if (arg === 'recap') {
      const now = await $.clock.now()
      const range = recapRange(rest, now)
      if (!range) return { text: '쓰는 법: /learn recap (오늘 · 어제 · 이번주 · 최근 7일 · 2026-10-03)' }
      const root = await $.session.root()
      const index = await read($, concepts)
      const map = await currentAliases($)
      // The journal holds every note of those days; the pane and the store keep only the latest few.
      const written = await journalEntriesFor($, cfg, range.days)
      const keyOf = (day: string, time: string, request: string) => `${day} ${time} ${request.split('\n')[0]!.trim().slice(0, 40)}`
      const seen = new Set(written.map(entry => keyOf(entry.day, entry.time, entry.request)))
      const kept = (await allNotes($)).filter(note => (note.root || root) === root)
      const unwritten = kept
        .filter(note => note.at >= range.from && note.at < range.to)
        .filter(note => !seen.has(keyOf(stamp(note.at).day, stamp(note.at).time, note.prompt === '' ? '(없음)' : note.prompt)))
        .map(note => noteEntry(note, index, map))
      const chosen = [...written, ...unwritten]
      if (chosen.length === 0) return { text: `${range.label}의 노트가 이 프로젝트에 없습니다.` }
      const isPartial = written.length === 0 && kept.length >= HISTORY_PER_PROJECT && Math.min(...kept.map(note => note.at)) > range.from
      const lastDay = chosen.map(entry => entry.day).sort().at(-1)!
      let reply
      try {
        reply = await $.model.complete({
          model: cfg.model,
          system: RECAP_SYSTEM,
          prompt: recapPrompt(range, chosen, index, map, cfg.level, isPartial),
          maxTokens: 1200,
          effort: 'low',
          timeoutMs: 90_000,
        })
      } catch {
        return { text: `'${cfg.model}' 모델을 부를 수 없습니다 · /config에서 다른 모델을 골라 보세요` }
      }
      if (!reply.isAnswered) return { text: `정리를 쓰지 못했습니다: ${failureText(reply).replace(/ · .*$/, '')}` }
      const text = cut(reply.text, 6000)
      const path = cfg.isAutoSave ? await saveRecap($, cfg, root, range, text, now, lastDay) : undefined
      const partial = isPartial ? ' · 일지가 없어 남아 있는 최근 노트만 봤습니다' : ''
      return { text: `${range.label} 정리 · 노트 ${chosen.length}개${partial}${path ? ' · 일지에 남김' : ''}\n\n${text}` }
    }
    if (arg === 'days') {
      const days = await journalDays($, cfg)
      if (days.length === 0) return { text: `이 프로젝트의 일지가 아직 없습니다 (${await journalDir($, cfg)}).` }
      const shown = days.slice(0, 14).map(one => `- ${one.day}${one.parts.length > 1 ? ` (파일 ${one.parts.length}개)` : ''}`)
      return { text: `이 프로젝트의 일지 ${days.length}일 · 최근 순\n\n${shown.join('\n')}\n\n/learn day 날짜로 그날의 목차를 봅니다.` }
    }
    if (arg === 'day') {
      const now = await $.clock.now()
      const day =
        rest === '' || rest === '오늘' || rest.toLowerCase() === 'today'
          ? stamp(now).day
          : rest === '어제' || rest.toLowerCase() === 'yesterday'
            ? dayBefore(now)
            : rest
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { text: '쓰는 법: /learn day 2026-10-03 (또는 오늘 · 어제)' }
      const found = (await journalDays($, cfg)).find(one => one.day === day)
      if (!found) return { text: `${day}의 일지가 없습니다. /learn days로 있는 날짜를 봅니다.` }
      const index = []
      for (const path of found.parts) index.push(...journalIndex(await $.fs.read(path).catch(() => '')))
      const lines = index
        .slice(0, DAY_LINES)
        .map(one => `- ${one.time} · ${one.request || '(요청 없음)'}${one.summary ? ` — ${one.summary}` : ''}${one.isRewrite ? ' (다시 씀)' : ''}`)
      const more = index.length > DAY_LINES ? `\n\n그 밖에 ${index.length - DAY_LINES}개는 일지 파일에 있습니다.` : ''
      return { text: `${day} 노트 ${index.length}개 (${found.parts.join(', ')})\n\n${lines.join('\n')}${more}` }
    }
    if (arg === 'last') {
      const last = list.at(-1)
      return { text: last ? noteAsText(last) : EMPTY_TEXT }
    }
    if (arg === 'concepts') {
      const ranked = rankConcepts(await read($, concepts))
      if (ranked.length === 0) return { text: '아직 모인 개념이 없습니다. 노트가 쓰이면 "배울 개념"이 여기에 쌓입니다.' }
      const now = await $.clock.now()
      const { fresh, again } = progressOf(await read($, concepts), now)
      const due = dueConcepts(await read($, concepts), now)
      const queue = due.slice(0, 5)
      const lines = ranked.slice(0, 30).map(one => `- **${one.name}** ×${one.count} · ${stamp(one.lastAt).day} · 다음 복습 ${dueText(one, now)}: ${one.blurb}`)
      const review =
        queue.length > 0
          ? `\n\n복습할 개념 ${due.length}개: ${queue.map(one => (isMissed(one) ? `${one.name} (퀴즈 틀림)` : one.name)).join(', ')}${due.length > queue.length ? ' …' : ''} · 패널에서 q, 또는 /learn quiz`
          : ''
      const more = ranked.length > 30 ? `\n\n${moreConceptsText(ranked.length - 30, cfg.isAutoSave)}.` : ''
      return {
        text: `지금까지 배운 개념 ${ranked.length}개 · 최근 7일 새 개념 ${fresh}개 · 복습 ${again}개${review}\n\n${lines.join('\n')}${more}`,
      }
    }
    if (arg === 'clear') {
      await update($, notes, () => [])
      await update($, selectedId, () => null)
      await persist($, true)
      return { text: '이 프로젝트의 학습 노트를 비웠습니다. 다음 세션에도 다시 나오지 않습니다. 일지 파일과 배운 개념 모음은 그대로입니다.' }
    }
    if (arg === 'save') {
      if (list.length === 0) return { text: EMPTY_TEXT }
      const pending = list.filter(one => one.status !== 'writing' && one.savedAs !== one.status)
      const writing = list.filter(one => one.status === 'writing').length
      const later = writing > 0 ? ` 쓰는 중인 노트 ${writing}개는 다 쓰이면 ${cfg.isAutoSave ? '저절로 저장됩니다' : '/learn save로 저장하세요'}.` : ''
      if (pending.length === 0) {
        await saveConcepts($, cfg, await read($, concepts))
        return { text: `저장할 새 노트가 없습니다. 모두 ${await journalDir($, cfg)}에 있습니다.${later}` }
      }
      const paths = new Set<string>()
      for (const note of pending) {
        const path = await save($, cfg, note, note.savedAs !== null)
        if (path) paths.add(path)
      }
      await persist($)
      await saveConcepts($, cfg, await read($, concepts))
      if (paths.size === 0) return { text: '파일에 쓰지 못했습니다. claude --debug 로그를 보세요.' }
      return { text: `노트 ${pending.length}개를 저장했습니다: ${[...paths].join(', ')}${later}` }
    }
    if (arg !== '') return { text: USAGE }
    await update($, autoOpened, () => true)
    const opened = await $.ui.open({ id: PANE, title: TITLE })
    const last = list.at(-1)
    if (opened.isPlaced && (await isCloudSession($))) {
      // Placed on the cloud computer's own terminal, which nobody sees: say so, and show the note here.
      return {
        text: `이 세션은 클라우드 컴퓨터에서 돌아, 패널이 지금 보는 화면에 뜨지 않을 수 있습니다. 마지막 노트를 여기에 적습니다 (/learn last 로 언제든 다시 봅니다).\n\n${last ? noteAsText(last) : EMPTY_TEXT}`,
      }
    }
    if (opened.isPlaced) return { text: '학습 노트 패널을 열었습니다.' }
    return {
      text: `패널을 그릴 화면이 없습니다 (${opened.reason}). 마지막 노트를 여기에 적습니다.\n\n${last ? noteAsText(last) : EMPTY_TEXT}`,
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const el = $.ui.resolve(e)
    const { Box, Text, Button } = el
    const list = await read($, notes)
    const running = await read($, live)
    const wanted = await read($, selectedId)
    const mode = await read($, view)
    const index = await read($, concepts)
    const map = await read($, aliases)
    const now = await $.clock.now()
    const isDock = e.props.placement === 'dock'
    const hasConcepts = Object.keys(index).length > 0
    const current = await read($, quiz)
    const run = await read($, quizRun)
    const quizBody = mode === 'quiz' ? quizView($, cfg, current, run, hasConcepts, now, el) : null
    const quizButtons =
      mode === 'quiz' ? (
        quizNewButton($, cfg, current !== null, run.isMaking, hasConcepts, el)
      ) : (
        <Button key="quiz" hotkey="q" plain label="퀴즈" onPress={() => update($, view, () => 'quiz')} />
      )

    const found = wanted === null ? -1 : list.findIndex(one => one.id === wanted)
    const at = found === -1 ? list.length - 1 : found
    const note = list[at]

    const liveBlock = running && running.changes.length > 0 ? liveView(running, isDock, cfg.isAutoNote, el) : null

    if (!note) {
      // No note in this project yet: concepts learned elsewhere, and a quiz on them, are still one key away.
      const isConcepts = mode === 'concepts' && hasConcepts
      const isQuiz = mode === 'quiz' && hasConcepts
      return (
        <Box flexDirection="column">
          {liveBlock}
          {hasConcepts && (
            <Box flexWrap="wrap" columnGap={2}>
              <Button
                key="view"
                hotkey="v"
                plain
                label={isConcepts || isQuiz ? '노트 보기' : '개념 모음 보기'}
                onPress={() => update($, view, () => (isConcepts || isQuiz ? 'note' : 'concepts'))}
              />
              {quizButtons}
            </Box>
          )}
          {isConcepts || isQuiz ? (
            <Box marginTop={1} flexDirection="column">
              {isQuiz ? quizBody : conceptsView($, index, map, list, now, cfg.isAutoSave, el)}
            </Box>
          ) : (
            <Box flexDirection="column">
              <Text bold>아직 학습 노트가 없습니다</Text>
              <Text dimColor>
                Claude가 파일을 고치면 바뀌기 전과 후를 모았다가, 턴이 끝날 때 무엇이 왜 바뀌었고 무엇을 배울 수 있는지
                노트로 정리해 여기에 보여 줍니다.
              </Text>
              {hasConcepts && <Text dimColor>지금까지 배운 개념 {Object.keys(index).length}개가 있습니다 · v로 보기 · q로 퀴즈</Text>}
            </Box>
          )}
        </Box>
      )
    }

    const isBusy = inFlight.has(note.id)
    const totalAdded = note.changes.reduce((sum, c) => sum + c.added, 0)
    const totalRemoved = note.changes.reduce((sum, c) => sum + c.removed, 0)
    const fileCount = note.changes.length + note.moreFiles
    const writeLabel = isBusy ? '쓰는 중…' : note.status === 'ready' ? '다시 쓰기' : '노트 쓰기'

    const body =
      mode === 'quiz' ? (
        quizBody
      ) : mode === 'concepts' ? (
        conceptsView($, index, map, list, now, cfg.isAutoSave, el)
      ) : mode === 'note' ? (
        <Box flexDirection="column">
          {noteBody(note, isBusy, el)}
          {note.status === 'ready' && note.concepts.length > 0 && conceptLine(note, index, map, el)}
        </Box>
      ) : (
        <Box flexDirection="column">
          {note.changes.map(change => (
            <Box key={`file-${change.path}`} flexDirection="column" marginBottom={1}>
              <Text bold wrap="truncate-start">
                {change.file}
              </Text>
              <Text dimColor>
                {kindText(change.kind)} · +{change.added} −{change.removed}
                {change.isCut && change.diff !== '' ? ' · 길어서 앞부분만' : ''}
              </Text>
              {change.diff === '' ? (
                <Text dimColor>(파일이 커서 diff를 만들지 못했습니다)</Text>
              ) : mode === 'diff' ? (
                diffView(change, el)
              ) : (
                splitView(change, el)
              )}
            </Box>
          ))}
          {note.moreFiles > 0 && <Text dimColor>그 밖에 파일 {note.moreFiles}개 (너무 많아 생략)</Text>}
        </Box>
      )

    return (
      <Box flexDirection="column">
        {liveBlock}
        {!isWhole(mode) && (
          <Text wrap="truncate-end">
          <Text bold>
            노트 {at + 1}/{list.length}
          </Text>
          <Text dimColor>
            {' '}
            · {note.isPast ? '지난 세션 · ' : ''}
            {when(note.at, now)} · 파일 {fileCount}개 · +{totalAdded} −{totalRemoved}
          </Text>
          </Text>
        )}
        <Box flexWrap="wrap" columnGap={2}>
          {!isWhole(mode) && <Button key="prev" hotkey="p" plain label="◀ 이전" onPress={() => stepNote($, -1)} />}
          {!isWhole(mode) && <Button key="next" hotkey="n" plain label="다음 ▶" onPress={() => stepNote($, 1)} />}
          <Button
            key="view"
            hotkey="v"
            plain
            label={`${VIEW_LABEL[VIEW_NEXT[mode]]} 보기`}
            onPress={() => update($, view, current => VIEW_NEXT[current])}
          />
          {!isWhole(mode) && (
          <Button
            key="write"
            hotkey="w"
            plain
            dimColor={isBusy}
            label={writeLabel}
            onPress={() => void writeNote($, cfg, note.id, note.savedAs !== null)}
          />
          )}
          {quizButtons}
          {mode === 'note' && note.status === 'ready' && note.concepts.length > 0 && (
            <Button
              key="note-quiz"
              hotkey="t"
              plain
              label="이 노트 퀴즈"
              onPress={async () => {
                await update($, view, () => 'quiz')
                void startQuiz($, cfg, note.concepts)
              }}
            />
          )}
          {mode === 'note' && note.status === 'ready' && (
            <Button key="easier" hotkey="e" plain dimColor={isBusy} label="더 쉽게" onPress={() => void writeNote($, cfg, note.id, note.savedAs !== null, true)} />
          )}
        </Box>
        {e.surface === 'terminal' && !e.props.isFocused && (
          <Text dimColor wrap="truncate-end">
            ctrl+x tab으로 패널을 고르면 {mode === 'quiz' ? 'v·s·a·o·x' : mode === 'concepts' ? 'v·q' : mode === 'note' && note.status === 'ready' ? 'p·n·v·w·q·t·e' : 'p·n·v·w·q'} 키를 쓸 수 있습니다
          </Text>
        )}
        {!isWhole(mode) && (
          <Text dimColor wrap="truncate-end">
            요청: {note.prompt === '' ? '(없음)' : note.prompt.replace(/\s+/g, ' ')}
          </Text>
        )}
        <Text>
          {VIEWS.flatMap((one, i) => [
            ...(i > 0 ? [<Text dimColor>{' · '}</Text>] : []),
            <Text bold={one === mode} underline={one === mode} dimColor={one !== mode}>
              {VIEW_LABEL[one]}
            </Text>,
          ])}
        </Text>
        <Box marginTop={1} flexDirection="column">
          {body}
        </Box>
      </Box>
    )
  })
}

/** What the running turn has changed so far: a list where the pane is docked, one line inline. */
function liveView(running: LearnLive, isDock: boolean, isAutoNote: boolean, el: ElementTable) {
  const { Box, Text } = el
  const count = running.changes.length + running.dropped.length + running.unlisted
  const tail = isAutoNote ? ' · 턴이 끝나면 노트를 씁니다' : ''
  if (!isDock) {
    const names = running.changes.slice(0, 3).map(change => change.file.split('/').at(-1) ?? change.file)
    return (
      <Text color="yellow" wrap="truncate-end">
        ● 작업 중: 파일 {count}개 ({names.join(', ')}
        {count > 3 ? ' …' : ''}){tail}
      </Text>
    )
  }
  return (
    <Box key="live" flexDirection="column" marginBottom={1}>
      <Text color="yellow">
        ● 작업 중: 파일 {count}개{tail}
      </Text>
      {running.changes.slice(0, 4).map(change => (
        <Text dimColor wrap="truncate-start">
          {'  '}
          {change.file} +{change.added} −{change.removed}
        </Text>
      ))}
    </Box>
  )
}

function noteBody(note: LearnNote, isBusy: boolean, el: ElementTable) {
  const { Text, Markdown } = el
  if (note.status === 'ready') return <Markdown text={note.text} />
  if (note.status === 'writing' && isBusy) return <Text color="cyan">노트를 쓰는 중입니다…</Text>
  if (note.status === 'writing') return <Text color="yellow">노트 쓰기가 멈췄습니다 (모드를 다시 불러왔을 수 있습니다) · w로 다시 쓰기</Text>
  if (note.status === 'failed') return <Text color="red">노트를 쓰지 못했습니다: {note.text}</Text>
  return <Text dimColor>자동 노트가 꺼져 있습니다. w로 노트를 쓰거나 v로 전후 코드를 보세요.</Text>
}

function diffView(change: LearnChange, el: ElementTable) {
  const { Code } = el
  return <Code source={change.diff} format="diff" path={change.path} />
}

function lineRange(start: number, count: number): string {
  if (count <= 0) return '없음'
  return count === 1 ? `${start}행` : `${start}~${start + count - 1}행`
}

/** Each changed spot as "전" then "후": the changed lines and one line around them, numbered as in the file. */
function splitView(change: LearnChange, el: ElementTable) {
  const { Box, Text, Code } = el
  const hunks = parseDiff(change.diff)
  const shown = hunks.slice(0, 4)
  return (
    <Box flexDirection="column">
      {shown.map((whole, i) => {
        const hunk = focus(whole, 1)
        const { before, after } = beforeAfter(hunk)
        return (
          <Box key={`hunk-${i}`} flexDirection="column" marginBottom={i < shown.length - 1 ? 1 : 0}>
            <Text color="red">− 전 · {lineRange(hunk.oldStart, hunk.oldLines)}</Text>
            {before === '' ? (
              <Text dimColor>  (없음: 새로 추가된 부분)</Text>
            ) : (
              <Code source={before} path={change.path} startLine={hunk.oldStart} />
            )}
            <Text color="green">+ 후 · {lineRange(hunk.newStart, hunk.newLines)}</Text>
            {after === '' ? (
              <Text dimColor>  (없음: 지워진 부분)</Text>
            ) : (
              <Code source={after} path={change.path} startLine={hunk.newStart} />
            )}
          </Box>
        )
      })}
      {hunks.length > shown.length && <Text dimColor>바뀐 곳 {hunks.length - shown.length}군데 더 · diff 보기에서</Text>}
    </Box>
  )
}

/**
 * Under a note: its concepts split into the ones it taught first and the ones
 * it went over again (met before this note), with how often they have come up so far.
 */
function conceptLine(
  note: LearnNote,
  index: Readonly<Record<string, LearnConcept>>,
  map: Readonly<Record<string, string>>,
  el: ElementTable,
) {
  const { Box, Text } = el
  const met = note.concepts
    .map(key => resolveKey(map, key))
    .filter((key, i, all) => all.indexOf(key) === i)
    .map(key => conceptAt(index, key))
    .filter(one => one !== undefined)
  const fresh = met.filter(one => one.firstAt >= note.at)
  const again = met.filter(one => one.firstAt < note.at)
  if (met.length === 0) return null
  return (
    <Box flexDirection="column" marginTop={1}>
      {fresh.length > 0 && (
        <Text wrap="wrap">
          <Text color="green">새로 배운 개념</Text>
          <Text dimColor> {fresh.map(one => one.name).join(' · ')}</Text>
        </Text>
      )}
      {again.length > 0 && (
        <Text wrap="wrap">
          <Text color="cyan">복습한 개념</Text>
          <Text dimColor> {again.map(one => `${one.name} ×${one.count}`).join(' · ')}</Text>
        </Text>
      )}
    </Box>
  )
}

/** Every concept the notes have taught, the most met first. */
/** Shows one note in the note view; the newest means "follow". */
async function openNote($: EngineInterface, id: string): Promise<void> {
  const list = await read($, notes)
  await update($, selectedId, () => (list.at(-1)?.id === id ? null : id))
  await update($, view, () => 'note')
}

/** Where the concepts beyond the list are: concepts.md when it is kept, else how to make it. */
function moreConceptsText(count: number, isAutoSave: boolean): string {
  return isAutoSave ? `그 밖에 ${count}개는 일지 폴더의 concepts.md에 있습니다` : `그 밖에 ${count}개 · /learn save로 concepts.md에 모두 저장`
}

/**
 * Every concept the notes have taught: this week's progress, the ones worth a
 * second look, then all of them, the most met first, each with the notes in
 * the pane that taught it.
 */
function conceptsView(
  $: EngineInterface,
  index: Readonly<Record<string, LearnConcept>>,
  map: Readonly<Record<string, string>>,
  list: readonly LearnNote[],
  now: number,
  isAutoSave: boolean,
  el: ElementTable,
) {
  const { Box, Text, Markdown, Button } = el
  const ranked = rankConcepts(index)
  if (ranked.length === 0) {
    return <Text dimColor>아직 모인 개념이 없습니다. 노트가 쓰이면 "배울 개념"이 여기에 쌓입니다.</Text>
  }
  const { fresh, again } = progressOf(index, now)
  const due = dueConcepts(index, now)
  const queue = due.slice(0, 5)
  const shown = ranked.slice(0, 30)
  const row = (one: RankedConcept) => {
    const taught = taughtBy(list, map, one.key)
    return (
      <Box key={`concept-${one.key}`} flexDirection="column" marginTop={1}>
        <Text wrap="truncate-end">
          <Text bold color={one.count > 1 ? 'green' : undefined}>
            {one.name}
          </Text>
          <Text dimColor>
            {' '}
            ×{one.count} · {when(one.lastAt, now)}
            {one.reviewedAt !== undefined ? ` · 복습 ${when(one.reviewedAt, now)}` : ''}
            {isMissed(one) ? ' · 퀴즈 틀림' : ` · 다음 복습 ${dueText(one, now)}`}
          </Text>
        </Text>
        {one.blurb !== '' && <Markdown text={one.blurb} dimColor />}
        {taught.length > 0 && (
          <Box flexWrap="wrap" columnGap={2}>
            <Text dimColor>노트:</Text>
            {taught.map(note => (
              <Button
                key={`open-${note.id}`}
                plain
                dimColor
                label={`${when(note.at, now)} ${note.changes[0]?.file.split('/').at(-1) ?? ''}`.trim()}
                onPress={() => openNote($, note.id)}
              />
            ))}
          </Box>
        )}
      </Box>
    )
  }
  return (
    <Box flexDirection="column">
      <Text bold>
        지금까지 배운 개념 {ranked.length}개 <Text dimColor>· 최근 7일 새 개념 {fresh}개 · 복습 {again}개</Text>
      </Text>
      {queue.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow" wrap="wrap">
            복습할 개념 {due.length}개 <Text dimColor>· 틀린 것 먼저, 잊을 때쯤 다시 나옵니다 · q로 퀴즈</Text>
          </Text>
          {queue.map(one => (
            <Text key={`due-${one.key}`} dimColor wrap="truncate-end">
              {'  '}
              {one.name} · {isMissed(one) ? `퀴즈 틀림 ${when(one.missedAt ?? now, now)}` : dueText(one, now)}
            </Text>
          ))}
          {due.length > queue.length && <Text dimColor>{'  '}그 밖에 {due.length - queue.length}개</Text>}
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>여러 번 만난 순</Text>
      </Box>
      {shown.map(row)}
      {ranked.length > shown.length && <Text dimColor>{moreConceptsText(ranked.length - shown.length, isAutoSave)}</Text>}
    </Box>
  )
}

/** The quiz view's s: the first quiz, or the next one; nothing while one is being made or there is nothing to ask. */
function quizNewButton($: EngineInterface, cfg: Config, hasQuiz: boolean, isMaking: boolean, hasConcepts: boolean, el: ElementTable) {
  const { Button } = el
  if (!hasConcepts || isMaking) return null
  return <Button key="quiz-new" hotkey="s" plain label={hasQuiz ? '새 문제 받기' : '퀴즈 시작'} onPress={() => void startQuiz($, cfg)} />
}

/**
 * The quiz, one question at a time: the learner answers in their head, a shows
 * the answer, o or x says how it went, and a wrong one comes first next time.
 * The questions already graded stay above as one line each.
 */
function quizView(
  $: EngineInterface,
  cfg: Config,
  current: Quiz | null,
  run: LearnQuizRun,
  hasConcepts: boolean,
  now: number,
  el: ElementTable,
) {
  const { Box, Text, Markdown, Button } = el
  const items = current?.items ?? []
  const graded = items.filter(item => item.result !== undefined)
  const right = graded.filter(item => item.result === 'right').length
  const at = items.findIndex(item => item.result === undefined)
  return (
    <Box flexDirection="column">
      <Text bold wrap="truncate-end">
        복습 퀴즈
        {current && items.length > 0 && (
          <Text dimColor>
            {' '}
            · {when(current.at, now)} · {items.length}문제 중 {graded.length}개 채점
          </Text>
        )}
      </Text>
      {!hasConcepts && <Text dimColor>{NO_CONCEPTS_FOR_QUIZ}</Text>}
      {hasConcepts && items.length === 0 && !run.isMaking && (
        <Text dimColor>틀렸던 개념과 오래 안 본 개념으로 문제를 냅니다. s로 시작해서, 먼저 스스로 답해 보고 a로 정답을 본 뒤 o(맞힘)·x(틀림)를 고르세요.</Text>
      )}
      {run.isMaking && <Text color="cyan">문제를 만드는 중입니다…</Text>}
      {run.error !== null && <Text color="red">{run.error}</Text>}
      {items.map((item, i) => {
        if (item.result !== undefined) {
          return (
            <Text key={`quiz-${i}`} wrap="truncate-end">
              <Text color={item.result === 'right' ? 'green' : 'red'}>{item.result === 'right' ? '✓ 맞힘' : '✗ 틀림'}</Text>
              <Text dimColor>
                {' '}
                {i + 1}. {item.name}
              </Text>
            </Text>
          )
        }
        if (i !== at || !current) return null
        return (
          <Box key={`quiz-${i}`} flexDirection="column" marginTop={1}>
            <Text bold>
              문제 {i + 1}/{items.length}
            </Text>
            <Markdown text={item.question} />
            {isAnswerShown(current, item) ? (
              <Box flexDirection="column" marginTop={1}>
                <Text color="green">정답</Text>
                <Markdown text={item.answer} />
                <Text dimColor>개념: {item.name}</Text>
                <Box flexWrap="wrap" columnGap={2} marginTop={1}>
                  <Button key="quiz-right" hotkey="o" plain label="맞혔어요" onPress={() => gradeQuiz($, cfg, i, 'right')} />
                  <Button key="quiz-wrong" hotkey="x" plain label="틀렸어요" onPress={() => gradeQuiz($, cfg, i, 'wrong')} />
                </Box>
              </Box>
            ) : (
              <Box flexWrap="wrap" columnGap={2} marginTop={1}>
                <Button key="quiz-answer" hotkey="a" plain label="정답 보기" onPress={() => showAnswer($, i)} />
                <Text dimColor>먼저 스스로 답해 보세요</Text>
              </Box>
            )}
          </Box>
        )
      })}
      {items.length > 0 && at === -1 && (
        <Box marginTop={1}>
          <Text bold>
            {items.length}문제 중 {right}개 맞혔습니다
            <Text dimColor>{right < items.length ? ' · 틀린 개념은 다음 퀴즈에 먼저 나옵니다' : ''} · s로 새 문제</Text>
          </Text>
        </Box>
      )}
    </Box>
  )
}

/** The latest notes in the pane (at most three) that taught the concept under `key`, merged names included. */
function taughtBy(list: readonly LearnNote[], map: Readonly<Record<string, string>>, key: string): LearnNote[] {
  return list.filter(note => note.concepts.some(one => resolveKey(map, one) === key)).slice(-3)
}

const HELP = [
  '/learn 하위 명령',
  '',
  '- `/learn`: 학습 노트 패널 열기',
  '- `/learn last`: 마지막 노트',
  '- `/learn concepts`: 지금까지 배운 개념 (진도 · 복습할 개념 · 다음 복습 날짜)',
  '- `/learn recap`: 오늘 배운 것 정리 (어제 · 이번주 · 최근 7일 · 2026-10-03도 됩니다) · 일지에 남김',
  '- `/learn quiz`: 복습할 개념으로 문제 · `/learn quiz 정답`으로 답을 보고 복습으로 표시 · `/learn quiz 틀림 2`로 틀린 문제를 다음 퀴즈에 다시',
  '- 패널의 퀴즈 보기(q): s로 문제 받기 · a로 정답 보기 · o 맞힘 · x 틀림 (틀린 개념은 다음 퀴즈에 먼저)',
  '- `/learn ask 질문`: 패널에서 고른 노트(없으면 마지막 노트)에 대해 묻기 · 답은 일지에도 남음',
  '- 패널의 노트 보기: t로 이 노트의 개념만 퀴즈 · e로 더 쉽게(비유를 넣어) 다시 쓰기',
  '- `/learn find 말`: 모든 프로젝트의 노트에서 찾기 (요청 · 내용 · 파일 · 개념)',
  '- `/learn days`: 이 프로젝트의 일지 날짜',
  '- `/learn day 2026-10-03`: 그날 노트 목차 (오늘 · 어제도 됩니다)',
  '- `/learn merge 합칠 개념 = 남길 개념`: 같은 개념인데 이름이 갈라진 것 합치기',
  '- `/learn save`: 아직 저장 안 된 노트와 개념 모음을 파일로',
  '- `/learn clear`: 이 프로젝트의 노트 비우기',
].join('\n')
/** Lines /learn day prints at most: the reply goes into the conversation the model reads. */
const DAY_LINES = 40
const QUIZ_USAGE = '쓰는 법: /learn quiz (문제 받기) · /learn quiz 정답 (답 보기 · 복습으로 표시) · /learn quiz 틀림 2 (틀린 문제를 다음 퀴즈에 다시)'
const ASK_USAGE = '쓰는 법: /learn ask 질문 (예: /learn ask 왜 let 대신 const를 썼어?) · 패널에서 고른 노트(없으면 마지막 노트)에 대해 답합니다'
const NO_QUIZ = '아직 낸 퀴즈가 없습니다. /learn quiz로 먼저 문제를 받으세요.'
const MERGE_USAGE =
  '쓰는 법: /learn merge 합칠 개념 = 남길 개념  (예: /learn merge Destructuring = 구조 분해 할당 · = 대신 => -> → | 도 됩니다 · 거꾸로 하면 되돌립니다)'
const USAGE = `모르는 하위 명령입니다.\n\n${HELP}`
const EMPTY_TEXT = '아직 학습 노트가 없습니다. Claude가 파일을 고친 턴이 끝나면 생깁니다.'

function noteAsText(note: LearnNote): string {
  const files = note.changes.map(c => `${c.file} (+${c.added} −${c.removed})`).join(', ')
  const more = note.moreFiles > 0 ? ` 외 ${note.moreFiles}개` : ''
  const body =
    note.status === 'ready'
      ? note.text
      : note.status === 'writing'
        ? '(노트를 쓰는 중입니다)'
        : note.status === 'failed'
          ? `(노트를 쓰지 못했습니다: ${note.text})`
          : '(자동 노트가 꺼져 있습니다)'
  return `**${stamp(note.at).time} · ${files}${more}**\n\n${body}`
}
