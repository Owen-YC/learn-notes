import { atom, read, update } from 'claude-code'
import type { ElementTable, EngineInterface, ModelUsage, Register } from 'claude-code'

import type { LearnAsk, LearnAskRun, LearnChange, LearnConcept, LearnDayActivity, LearnDayUsage, LearnLive, LearnNote, LearnQuizItem, LearnQuizMarks, LearnQuizRun, LearnSubmit, LearnView, LearnWithheld } from '../types'
import {
  HISTORY_PER_PROJECT,
  HISTORY_PROJECTS,
  type HistoryEntry,
  JOURNAL_MAX_BYTES,
  NOTES_KEPT,
  SYSTEM,
  ASK_SYSTEM,
  ASKS_KEPT,
  CHECK_SYSTEM,
  codeFor,
  markHelped,
  markPartial,
  marksOf,
  regrade,
  type Mark,
  type QuizPick,
  checkPrompt,
  parseCheck,
  activityFromNotes,
  addActivity,
  addUsage,
  cleanUsage,
  usageLine,
  baseName,
  isFormatOnly,
  parseTeamFile,
  teamText,
  TEAM_FILE,
  type TeamFile,
  addToBank,
  ankiText,
  cleanBank,
  cleanActivity,
  progressParts,
  statsOf,
  type LearnStats,
  askPrompt,
  askSection,
  changeOf,
  changeSection,
  type ChangeItem,
  cleanConcepts,
  conceptAt,
  conceptKey,
  conceptsMarkdown,
  closeConceptBold,
  conceptsOf,
  redactText,
  screenNote,
  isStoreCut,
  revealNext,
  withheldOf,
  withheldText,
  countConcepts,
  creationHunk,
  deletionHunk,
  diffHunks,
  shellTargets,
  cut,
  expandHome,
  fitHistory,
  filesFor,
  forHistory,
  isGitMove,
  isRequestOrigin,
  isAwayOrigin,
  failureText,
  focus,
  isUnder,
  isSystemFolder,
  systemFolderHint,
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
  isDue,
  isKnown,
  DAILY_REVIEW,
  todayReview,
  dueAt,
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
  KIND_LABEL,
  spreadPicks,
  noteEntry,
  noteLine,
  notePrompt,
  parseMerge,
  RECAP_SYSTEM,
  recapPrompt,
  rememberSubmit,
  recapRange,
  recapSection,
  reportMarkdown,
  type RecapEntry,
  type RecapRange,
  parseDiff,
  progressOf,
  rankConcepts,
  resolveKey,
  searchNotes,
  sideBySide,
  type ShownLine,
  TRACE_LABEL,
  TRACE_QUESTION,
  EASIER_LABEL,
  EASIER_QUESTION,
  KEYED_LABELS,
  type RankedConcept,
  shortPath,
  stamp,
  summaryOf,
  turnRequest,
  when,
  type Hunk,
  type Level,
} from './notes'

const PANE = 'learn-notes'
const TITLE = '학습 노트'
/**
 * How the pane's keys are reached while it does not hold them. A Korean input mode sends `ㅂ` for `q`, which no
 * letter hotkey matches, so the English one is named; a digit is the same in both.
 */
const KEYS_HINT = 'ctrl+x tab: 패널 고르기 · 숫자 키는 한/영 상관없이, 글자 키는 영문 상태에서'
/** The same line while the pane holds the keys: how to give them back, and the input mode the letter keys need. */
const FOCUSED_HINT = 'Esc: 대화로 돌아가기 · 글자 키는 영문 상태에서'
/** The two lines in the quiz view while a question waits in its answer field, which takes the keys first. */
const ANSWER_KEYS_HINT = 'ctrl+x tab: 답 칸으로 · 보기를 바꾸려면 그 뒤 Tab'
const ANSWER_FOCUSED_HINT = 'Esc: 대화로 돌아가기 · 답은 한글로 적어도 됩니다'

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
const askRun = atom({ plugin: 'learn-notes', key: 'askRun' } as const, {})
const activity = atom({ plugin: 'learn-notes', key: 'activity' } as const, {})
const submitted = atom({ plugin: 'learn-notes', key: 'submitted' } as const, { list: [], lastRequest: null })

/** `$.store` keys: notes per project for the next session, the concept index, merges and the last quiz. */
const HISTORY_KEY = 'history'
const CONCEPTS_KEY = 'concepts'
const ALIASES_KEY = 'aliases'
/** The last /learn quiz, so its answers are there in the next session too. */
const QUIZ_KEY = 'quiz'
/** What each merge folded away, so merging back splits the two again: merged-away key → its record. */
const MERGES_KEY = 'merges'
/** Each day's notes and graded answers, for the run of days and the week's progress. */
const ACTIVITY_KEY = 'activity'
/** Every question a quiz asked (the newest 300), for /learn anki. */
const BANK_KEY = 'quizBank'
/** The Anki import file /learn anki writes, in the journal folder. */
const ANKI_FILE = 'learn-notes-anki.txt'
/** Each day's model calls and tokens (see LearnDayUsage), for the daily limit, /learn 기록 and /learn 보고서. */
const USAGE_KEY = 'usage'
/** The last day the daily limit's toast showed, in any session: it shows once a day. */
const LIMIT_TOAST_KEY = 'limitToast'
/** Set once a new install's first session said hello (welcome), or one found notes or concepts there already. */
const WELCOMED_KEY = 'welcomed'
const WELCOME = 'learn-notes가 켜졌습니다 · 파일을 고치는 요청을 하면 노트가 생깁니다 · /learn으로 패널'

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

// The note first, then its code before and after, then every concept so far, then a quiz on them: keys 1 to 4.
const VIEWS: readonly LearnView[] = ['note', 'split', 'concepts', 'quiz']
const VIEW_LABEL: Record<LearnView, string> = { note: '노트', split: '전/후', concepts: '개념 모음', quiz: '퀴즈' }
/** The view held in state as one of today's: 1.4.0's diff view is the before/after view now. */
const viewOf = (raw: string): LearnView => ((VIEWS as readonly string[]).includes(raw) ? (raw as LearnView) : raw === 'diff' ? 'split' : 'note')
/** Views about every note at once, not the selected one. */
const isWhole = (mode: LearnView) => mode === 'concepts' || mode === 'quiz'
/** Where the pane stands in the notes: the chosen one, else the newest (the pane follows). */
function shownAt(list: readonly LearnNote[], wanted: string | null): number {
  const found = wanted === null ? -1 : list.findIndex(one => one.id === wanted)
  return found === -1 ? list.length - 1 : found
}

/**
 * The `i`th question kept under a note, by when it was asked (and its place
 * among any asked the same moment): asked at different times, its key stays
 * its own as more are asked.
 */
function askedKey(id: string, asks: readonly LearnAsk[], i: number): string {
  const at = asks[i]?.at ?? 0
  const before = asks.slice(0, i).filter(one => one.at === at).length
  return `asked-${id}-${at}${before === 0 ? '' : `-${before}`}`
}
/** Why a note's question has no answer, in red under its field. */
const askErrorKey = (id: string) => `ask-error-${id}`
/** How often, and how far apart, a row the pane is about to draw is looked for before it is scrolled to. */
const REVEAL_TRIES = 10
const REVEAL_RETRY_MS = 50

type Config = {
  isAutoNote: boolean
  isAutoOpen: boolean
  isAutoSave: boolean
  isReviewReminder: boolean
  model: string
  level: Level
  saveDir: string
  /** Path patterns (excludePaths) whose files stay out of every note. */
  excludePaths: string[]
  /** Notes a day written by themselves at a turn's end (dailyAutoNotes); 0 for no limit. */
  dailyAutoNotes: number
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
    excludePaths: patternsOf(options.excludePaths),
    dailyAutoNotes: wholeOf(options.dailyAutoNotes),
  }
}

/** A number setting as a whole number of at least 0 (a typed one may come as text); anything else is 0. */
function wholeOf(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : Number.NaN
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/** The excludePaths setting as patterns: comma- or line-separated words (a list, as managed settings may give it). */
function patternsOf(raw: unknown): string[] {
  const all = typeof raw === 'string' ? raw.split(/[,\n]/) : Array.isArray(raw) ? raw.filter((one): one is string => typeof one === 'string') : []
  return all.map(one => one.trim()).filter(one => one !== '')
}

function emptyLive(turnId: string, prompt: string): LearnLive {
  return { turnId, prompt, changes: [], dropped: [], unlisted: 0, withheld: [] }
}

/** Files left out that a note lists by name; past it they go unnamed. */
const WITHHELD_KEPT = 12

// The module's own memory; a reload starts it over.
/** Whether an unasked pane would sit beside the transcript, read off the spinner's surface. */
let canDock: boolean | undefined
/** Notes whose model call runs in this environment. */
const inFlight = new Set<string>()
/** True while the pane asks the model for a quiz: one at a time. */
let isQuizMaking = false
/** True while the model grades a typed answer: one at a time. */
let isQuizChecking = false
/** Notes whose question asked in the pane the model is answering now: one at a time per note. */
const asking = new Set<string>()
/** How often the person has moved the pane's window themselves (wheel, scroll keys): a move after a question is theirs to keep. */
let personScrolls = 0
/** The status line this plugin last pinned, so an unchanged count is not pinned again; null until the first look since this load. */
let shownReminder: string | undefined | null = null
/** Quiz questions being graded now (quiz time and number), so a second press while the first is written does nothing. */
const grading = new Set<string>()
/**
 * Whether the permission rules forbid reading a path, asked once a turn (see isReadDenied); cleared when the
 * next turn starts, so the note a turn's end writes and saves (screened) asks nothing again.
 */
const readDenied = new Map<string, boolean>()
/** Notes a turn's end set to write by themselves whose model call is not in the usage record yet: they count toward the day's limit meanwhile. */
const autoPending = new Set<string>()
/**
 * A day's notes written by themselves, as the usage record last read or
 * written here (session start, a turn's end, each model call): what the live
 * line goes by to say whether the turn's end will write one.
 */
let autoDone: { day: string; auto: number } | undefined
/** The day the daily limit's toast last showed here (the store keeps it for every session, LIMIT_TOAST_KEY). */
let limitToastDay: string | undefined
/** The project's team file as last read (TEAM_FILE), with its stamp: read again only once that changes. */
let team: { path: string; mtimeMs: number; size: number; parsed: TeamFile } | null = null
/**
 * Work that must not interleave runs one after another in its lane: journal
 * saves (each reads a journal and writes it whole) and store writes (each
 * reads a whole value and writes it back). One that fails never stops the next.
 */
const lanes: Record<'saving' | 'storing', Promise<unknown>> = { saving: Promise.resolve(), storing: Promise.resolve() }

function enqueue<T>(lane: keyof typeof lanes, work: () => Promise<T>): Promise<T> {
  const run = lanes[lane].catch(() => undefined).then(work)
  lanes[lane] = run
  return run
}
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
    asks: Array.isArray(raw.asks)
      ? raw.asks.filter(
          (one): one is LearnAsk => isRecord(one) && typeof one.question === 'string' && typeof one.answer === 'string' && typeof one.at === 'number',
        )
      : [],
    // Anything but a list of them is dropped, not kept from the spread above: such a note left nothing out.
    withheld: Array.isArray(raw.withheld) ? raw.withheld.filter(isWithheld) : undefined,
    skip: raw.skip === 'format' || raw.skip === 'limit' ? raw.skip : undefined,
  }
}

const WITHHELD_WHY: readonly string[] = ['secret', 'generated', 'excluded', 'policy']

function isWithheld(one: unknown): one is LearnWithheld {
  return isRecord(one) && typeof one.file === 'string' && typeof one.why === 'string' && WITHHELD_WHY.includes(one.why)
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
  // Started in a system folder, Claude Code writes the learner's code in its scratchpad: that is the work, not bookkeeping.
  if (isSystemFolder(root)) return false
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
  return enqueue('saving', () => saveNow($, cfg, note, isRewrite))
}

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

/**
 * A failure is a toast once and a debug line, never a broken turn; the note
 * stays unsaved, and the next save that works writes it too (flushUnsaved).
 */
async function saveNow($: EngineInterface, cfg: Config, note: LearnNote, isRewrite: boolean): Promise<string | undefined> {
  try {
    // Into the journal of the note's own project, even after a /cd.
    const root = note.root || (await $.session.root())
    const path = await appendJournal($, cfg, root, note.at, journalSection(await screened($, cfg, note), isRewrite, isStoreCut(note)))
    await setNote($, note.id, { savedAs: note.status, isUnsaved: false })
    // The folder takes writes again: the notes it refused before go in after this one.
    void flushUnsaved($, cfg, note.id)
    return path
  } catch (error) {
    await setNote($, note.id, { isUnsaved: true }).catch(() => undefined)
    $.ui.log(`learn-notes: 노트를 파일에 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
    if (!hasWarnedSave) {
      hasWarnedSave = true
      $.ui.toast('학습 노트를 파일에 쓰지 못했습니다 · /config의 saveDir를 확인하면 다음 노트 때 함께 저장됩니다', { timeoutMs: 8000 })
    }
    return undefined
  }
}

/** Notes queued for another try at the journal, so none is queued twice while its try waits. */
const retrying = new Set<string>()

/**
 * Queues another try at the journal for each note in the pane a failed save
 * left unsaved (an autoSave left off before 1.6.0 did too), but the one just
 * saved and any being written (or rewritten: its own save follows). Called
 * from inside the saving lane, so it never waits on that lane: the tries run
 * after the save that called it.
 */
async function flushUnsaved($: EngineInterface, cfg: Config, savedId: string): Promise<void> {
  // A note being written saves itself when done.
  const isFree = (one: LearnNote) => one.status !== 'writing' && !inFlight.has(one.id)
  const pending = (await read($, notes)).filter(one => one.isUnsaved === true && isFree(one) && one.id !== savedId && !retrying.has(one.id))
  for (const { id } of pending) {
    retrying.add(id)
    void enqueue('saving', async () => {
      try {
        // As the note is when its turn comes: a rewrite meanwhile is what goes in.
        const pane = (await read($, notes)).find(one => one.id === id)
        if (!pane || pane.isUnsaved !== true || !isFree(pane)) return
        // Another session in this project may have written it since (its try came first): its newer copy in the store says so.
        const stored = (await storedNotes($, pane.root || (await $.session.root())).catch(() => [])).find(one => one.id === id)
        const note = stored && stored.updatedAt > pane.updatedAt ? { ...stored, isPast: pane.isPast } : pane
        if (note !== pane) await update($, notes, list => list.map(one => (one.id === id ? note : one)))
        if (note.isUnsaved !== true || !isFree(note)) return
        // Stored as saved, so the next session does not write it again; not awaited: a store write may wait on this lane.
        if (await saveNow($, cfg, note, note.savedAs !== null)) void persist($)
      } finally {
        retrying.delete(id)
      }
    })
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

/**
 * True where the pane cannot show: a cloud session (its screen is drawn for
 * no one), or no pane placed on a screen that seats none (the terminal not
 * fullscreen, as the spinner last said; unknown counts as none). A toast there
 * is gone in seconds with nothing to open, so a written note says so in the
 * transcript instead.
 */
async function isPaneless($: EngineInterface): Promise<boolean> {
  if (await isCloudSession($)) return true
  if ((await $.ui.panes()).some(pane => pane.id === PANE && pane.isPlaced)) return false
  return canDock !== true
}

/**
 * Says a note is ready where the pane is not in sight: a dim transcript line
 * (never sent to the model) where no pane can show, a toast where it is hidden
 * or closed.
 */
async function announceNote($: EngineInterface, note: LearnNote): Promise<void> {
  const line = summaryOf(note.text)
  const about = line === '' ? '준비됐습니다' : line
  if (await isPaneless($)) $.ui.log(`학습 노트 · ${about} · /learn으로 보기`)
  else if (!(await isPaneVisible($))) $.ui.toast(`학습 노트: ${about} · /learn으로 보기`, { timeoutMs: 6000 })
}

/** Appends a /learn ask question and answer to the journal the note is in, after any save still running. */
function saveAsk($: EngineInterface, cfg: Config, note: LearnNote, question: string, answer: string, at: number): Promise<string | undefined> {
  return enqueue('saving', async () => {
    try {
      // Into the journal of the note's own day: asking never makes a journal day with no notes.
      return await appendJournal($, cfg, note.root || (await $.session.root()), note.at, askSection(note, question, answer, at))
    } catch (error) {
      $.ui.log(`learn-notes: 질문과 답을 파일에 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
      return undefined
    }
  })
}

/** Appends a recap to the journal of the last day it covers a note of, after any save still running. */
function saveRecap($: EngineInterface, cfg: Config, root: string, range: RecapRange, text: string, at: number, day: string): Promise<string | undefined> {
  return enqueue('saving', async () => {
    try {
      // Under the day of the last note it covers, so a recap never makes a journal day with no notes.
      return await appendJournal($, cfg, root, dayNoon(day), recapSection(range, text, at, day))
    } catch (error) {
      $.ui.log(`learn-notes: 정리를 파일에 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
      return undefined
    }
  })
}

/**
 * Keeps this project's latest notes in the store for the next session, after
 * any store write still running. Notes merge by id with what is stored, so
 * two sessions in one project keep each other's notes; `forget` drops the
 * project instead (/learn clear).
 */
function persist($: EngineInterface, forget = false, extra: readonly LearnNote[] = []): Promise<void> {
  return enqueue('storing', () => persistNow($, forget, extra))
}

/** See persist; `extra`: notes to store though the pane no longer holds them (one finished after a /cd). */
async function persistNow($: EngineInterface, forget: boolean, extra: readonly LearnNote[]): Promise<void> {
  try {
    const root = await $.session.root()
    const now = await $.clock.now()
    const pane = await read($, notes)
    const list = [...pane, ...extra.filter(one => !pane.some(other => other.id === one.id))]
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

/**
 * One toast for a brand-new install: the first interactive session with no
 * notes and no concepts kept says what makes a note. Marked first, so a store
 * that takes no writes never shows it again and again; one with notes already
 * is marked too, and never looked at again. None in a cloud session: its screen
 * is drawn for no one, and its store goes with the machine. Never fails the start.
 */
async function welcome($: EngineInterface): Promise<void> {
  if (!isInteractive || (await isCloudSession($))) return
  try {
    if ((await $.store.get(WELCOMED_KEY)) !== undefined) return
    const hasAny = (raw: unknown) => isRecord(raw) && Object.keys(raw).length > 0
    const isNew = !hasAny(await $.store.get(HISTORY_KEY)) && !hasAny(await $.store.get(CONCEPTS_KEY))
    await $.store.set(WELCOMED_KEY, true)
    if (isNew) $.ui.toast(WELCOME, { timeoutMs: 8000 })
  } catch (error) {
    $.ui.log(`learn-notes: 첫 세션 안내를 남기지 못했습니다 (${String(error)})`, { to: 'debug' })
  }
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
  return enqueue('storing', () => learnConceptsNow($, cfg, note))
}

async function learnConceptsNow($: EngineInterface, cfg: Config, note: LearnNote): Promise<string[]> {
  // A name merged away (/learn merge, here or in another session) counts under the concept it went into;
  // the note's own keys from before a merge are read the same way, so a rewrite never counts one twice.
  const map = await currentAliases($).catch(() => read($, aliases))
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
  return enqueue('saving', async () => {
    try {
      await $.fs.write(`${(await journalDir($, cfg)).replace(/[\\/]+$/, '')}/concepts.md`, conceptsMarkdown(index))
    } catch (error) {
      $.ui.log(`learn-notes: 개념 모음을 파일에 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
  })
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
 * added less the notes that taught both, the alias kept for every note's old
 * key and for later notes. Naming a concept that was merged away as the target
 * undoes that merge: two concepts merged are split again as they were, less
 * nothing met since; a rename is renamed back.
 */
function mergeConceptStored($: EngineInterface, cfg: Config, fromName: string, intoName: string): Promise<MergeResult> {
  return enqueue('storing', async (): Promise<MergeResult> => {
    try {
      const map = cleanAliases(await $.store.get(ALIASES_KEY))
      const index = cleanConcepts(await $.store.get(CONCEPTS_KEY), map)
      const from = resolveKey(map, conceptKey(fromName))
      const named = conceptKey(intoName)
      // 'merge X = Y' where Y was merged into X before: take Y back out under its own name.
      const isUndo = named !== from && resolveKey(map, named) === from
      const into = isUndo ? named : resolveKey(map, named)
      const gone = conceptAt(index, from)
      if (!gone) return { isDone: false, text: `없는 개념입니다: '${fromName}'. /learn 기록으로 이름을 확인하세요.\n\n${MERGE_USAGE}` }
      if (from === into) return { isDone: false, text: `'${fromName}' · '${intoName}': 이미 같은 개념으로 셉니다.` }
      const merges = cleanMerges(await $.store.get(MERGES_KEY))
      const record = isUndo ? merges[named] : undefined
      const nextMap: Record<string, string> = {}
      for (const [key, target] of Object.entries(map)) if (!(isUndo && key === named)) nextMap[key] = target
      const nextMerges: Record<string, MergeRecord> = { ...merges }
      // Only an undo spends its record: a later merge into the same name must not lose an earlier one's.
      if (isUndo) delete nextMerges[named]
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
      // The notes keep the keys they were written with: every reader follows the aliases, so undoing a merge
      // finds each note's concept where it was.
      await update($, aliases, () => nextMap)
      if (cfg.isAutoSave) await saveConcepts($, cfg, folded)
      return isSplit ? { isDone: true, gone: folded[named]!, kept: folded[from]!, isSplit } : { isDone: true, gone, kept: folded[into]!, isSplit }
    } catch (error) {
      $.ui.log(`learn-notes: 개념을 합치지 못했습니다 (${String(error)})`, { to: 'debug' })
      return { isDone: false, text: '개념을 합치지 못했습니다(저장소에 쓰지 못함). 잠시 뒤 다시 해 보세요.' }
    }
  })
}

type KnownResult = { done: string[]; already: string[]; missing: string[] } | { error: string }

/**
 * /learn 안다 · 모른다: marks the named concepts known (`toKnown`) or takes
 * the mark off, against the store as it is now; a name merged away counts as
 * the concept it went into. No model call.
 */
function markKnownStored($: EngineInterface, cfg: Config, names: readonly string[], toKnown: boolean): Promise<KnownResult> {
  return enqueue('storing', async (): Promise<KnownResult> => {
    try {
      const map = cleanAliases(await $.store.get(ALIASES_KEY))
      const index = cleanConcepts(await $.store.get(CONCEPTS_KEY), map)
      const at = await $.clock.now()
      const next: Record<string, LearnConcept> = { ...index }
      const result = { done: [] as string[], already: [] as string[], missing: [] as string[] }
      const seen = new Set<string>()
      for (const name of names) {
        const key = resolveKey(map, conceptKey(name))
        const one = conceptAt(next, key)
        if (!one) {
          result.missing.push(name)
          continue
        }
        if (seen.has(key)) continue
        seen.add(key)
        if ((one.knownAt !== undefined) === toKnown) {
          result.already.push(one.name)
          continue
        }
        const marked = { ...one }
        if (toKnown) marked.knownAt = at
        else delete marked.knownAt
        next[key] = marked
        result.done.push(one.name)
      }
      if (result.done.length > 0) {
        await $.store.set(CONCEPTS_KEY, next)
        await update($, concepts, () => next)
        await remind($, cfg)
        if (cfg.isAutoSave) await saveConcepts($, cfg, next)
      }
      return result
    } catch (error) {
      $.ui.log(`learn-notes: 아는 개념 표시를 남기지 못했습니다 (${String(error)})`, { to: 'debug' })
      return { error: '아는 개념 표시를 남기지 못했습니다(저장소에 쓰지 못함). 잠시 뒤 다시 해 보세요.' }
    }
  })
}

/** What /learn 안다 · 모른다 answer: what was marked, what already was, and the names no concept has. */
function knownReply(result: KnownResult, toKnown: boolean): string {
  if ('error' in result) return result.error
  const lines: string[] = []
  if (result.done.length > 0) {
    lines.push(
      toKnown
        ? `아는 개념으로 표시했습니다: ${result.done.join(' · ')}. 복습과 퀴즈에서 빠지고, 다음 노트부터 배울 개념에 넣지 않습니다. 되돌리기: /learn 모른다 ${result.done[0]}`
        : `아는 개념 표시를 지웠습니다: ${result.done.join(' · ')}. 다시 복습과 퀴즈에 나옵니다.`,
    )
  }
  if (result.already.length > 0) lines.push(`${toKnown ? '이미 아는 개념입니다' : '아는 개념으로 표시하지 않은 개념입니다'}: ${result.already.join(' · ')}`)
  if (result.missing.length > 0) lines.push(`없는 개념입니다: ${result.missing.map(name => `'${name}'`).join(', ')}. /learn 기록으로 이름을 확인하세요.`)
  return lines.join('\n')
}

/** The activity record as the store has it; a first one is made from the notes still kept. */
async function storedActivity($: EngineInterface): Promise<Record<string, LearnDayActivity>> {
  const raw = await $.store.get(ACTIVITY_KEY)
  return raw === undefined ? activityFromNotes(await allNotes($)) : cleanActivity(raw)
}

/** Adds a new quiz's questions to the bank /learn anki exports; never fails the caller. */
function bankQuestions($: EngineInterface, items: readonly LearnQuizItem[], at: number): Promise<void> {
  return enqueue('storing', async () => {
    try {
      const bank = addToBank(cleanBank(await $.store.get(BANK_KEY)), items.map(({ key, name, question, answer }) => ({ key, name, question, answer })), at)
      await $.store.set(BANK_KEY, bank)
    } catch (error) {
      $.ui.log(`learn-notes: 퀴즈 문제를 모아 두지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
  })
}

/**
 * Mirrors the activity record for drawing; the first time ever, makes it from
 * the notes still kept and stores it, so the counts that follow add to it
 * instead of to a record that already holds them.
 */
function seedActivity($: EngineInterface): Promise<void> {
  return enqueue('storing', async () => {
    try {
      const raw = await $.store.get(ACTIVITY_KEY)
      const record = raw === undefined ? activityFromNotes(await allNotes($)) : cleanActivity(raw)
      if (raw === undefined) await $.store.set(ACTIVITY_KEY, record)
      await update($, activity, () => record)
    } catch (error) {
      $.ui.log(`learn-notes: 학습 기록을 읽지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
  })
}

/** Counts a written note or graded answers on `day`, in the store and the pane's mirror; never fails the caller. */
function recordActivity($: EngineInterface, day: string, delta: Partial<LearnDayActivity>): Promise<void> {
  return enqueue('storing', async () => {
    try {
      const next = addActivity(cleanActivity(await $.store.get(ACTIVITY_KEY)), day, delta)
      await $.store.set(ACTIVITY_KEY, next)
      await update($, activity, () => next)
    } catch (error) {
      $.ui.log(`learn-notes: 학습 기록을 남기지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
  })
}

/**
 * Counts one model call on today's usage record, with the tokens it read
 * (cached ones too) and wrote; never fails the caller.
 */
function recordUsage($: EngineInterface, usage: ModelUsage | undefined, kind: 'auto' | 'manual'): Promise<void> {
  return enqueue('storing', async () => {
    try {
      const tokens = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0)
      const input = tokens(usage?.input_tokens) + tokens(usage?.cache_read_input_tokens) + tokens(usage?.cache_creation_input_tokens)
      const delta = { calls: 1, auto: kind === 'auto' ? 1 : 0, input, output: tokens(usage?.output_tokens) }
      const day = stamp(await $.clock.now()).day
      const next = addUsage(cleanUsage(await $.store.get(USAGE_KEY)), day, delta)
      await $.store.set(USAGE_KEY, next)
      autoDone = { day, auto: autoOn(next, day) }
    } catch (error) {
      $.ui.log(`learn-notes: 모델 호출 수를 남기지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
  })
}

/** `day`'s notes written by themselves in a usage record. */
function autoOn(record: Readonly<Record<string, LearnDayUsage>>, day: string): number {
  return Object.prototype.hasOwnProperty.call(record, day) ? record[day]!.auto : 0
}

/**
 * True once `day`'s notes written by themselves reach dailyAutoNotes, as last
 * read (autoDone) with the ones still being written (autoPending).
 */
function isLimitReached(cfg: Config, day: string): boolean {
  if (cfg.dailyAutoNotes <= 0) return false
  const done = autoDone?.day === day ? autoDone.auto : 0
  return done + autoPending.size >= cfg.dailyAutoNotes
}

/**
 * isLimitReached on the usage record as it stands, read after any store
 * write still running; one that cannot be read limits nothing.
 */
function isOverLimit($: EngineInterface, cfg: Config, day: string): Promise<boolean> {
  if (cfg.dailyAutoNotes <= 0) return Promise.resolve(false)
  return enqueue('storing', async () => {
    try {
      autoDone = { day, auto: autoOn(cleanUsage(await $.store.get(USAGE_KEY)), day) }
      return isLimitReached(cfg, day)
    } catch {
      return false
    }
  })
}

/** Today's notes written by themselves, read once a session: a session started past the limit says so before its first turn ends. */
function seedUsage($: EngineInterface): Promise<void> {
  return enqueue('storing', async () => {
    try {
      const day = stamp(await $.clock.now()).day
      autoDone = { day, auto: autoOn(cleanUsage(await $.store.get(USAGE_KEY)), day) }
    } catch (error) {
      $.ui.log(`learn-notes: 모델 호출 수를 읽지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
  })
}

/**
 * True the first time on `day` the daily limit's toast is to show, in this
 * session or any other: the store keeps the day it last showed. A store that
 * cannot keep it only lets it show again.
 */
function isFirstLimitToast($: EngineInterface, day: string): Promise<boolean> {
  if (limitToastDay === day) return Promise.resolve(false)
  limitToastDay = day
  return enqueue('storing', async () => {
    try {
      if ((await $.store.get(LIMIT_TOAST_KEY)) === day) return false
      await $.store.set(LIMIT_TOAST_KEY, day)
    } catch (error) {
      $.ui.log(`learn-notes: 한도 알림을 띄운 날을 남기지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
    return true
  })
}

/**
 * Pins "오늘 복습 n개" under the prompt while today's review has questions
 * left (DAILY_REVIEW a day at most, see todayReview), and takes it down when
 * none are (or the reminder is off in /config).
 */
async function remind($: EngineInterface, cfg: Config): Promise<void> {
  const left = cfg.isReviewReminder ? todayReview(await read($, concepts), await read($, activity), await $.clock.now()).left : 0
  const text = left > 0 ? `학습 노트 · 오늘 복습 ${left}개 · /learn 복습` : undefined
  if (text === shownReminder) return
  shownReminder = text
  $.ui.status(text)
}

/**
 * Marks concepts after a quiz grade, in the store and the pane's mirror: the
 * marks each had before (in the order of `keys`), or undefined when the store
 * could not be written.
 */
function markConcepts(
  $: EngineInterface,
  cfg: Config,
  mark: Mark,
  keys: readonly string[],
  at: number,
): Promise<(LearnQuizMarks | undefined)[] | undefined> {
  return enqueue('storing', async () => {
    try {
      const map = cleanAliases(await $.store.get(ALIASES_KEY))
      const prior = cleanConcepts(await $.store.get(CONCEPTS_KEY), map)
      const resolved = keys.map(key => resolveKey(map, key))
      const before = resolved.map(key => {
        const one = conceptAt(prior, key)
        return one ? marksOf(one) : undefined
      })
      const index = mark(prior, resolved, at)
      await $.store.set(CONCEPTS_KEY, index)
      await update($, concepts, () => index)
      await remind($, cfg)
      if (cfg.isAutoSave) await saveConcepts($, cfg, index)
      return before
    } catch (error) {
      $.ui.log(`learn-notes: 복습을 기록하지 못했습니다 (${String(error)})`, { to: 'debug' })
      return undefined
    }
  })
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

/** A quiz as kept: `isRevealed` (every answer shown) is read from quizzes kept before 1.6.0 and written false; `from` marks a note's own quiz. */
type Quiz = { at: number; items: LearnQuizItem[]; isRevealed: boolean; from?: 'note' }

/** A concept's marks read back off a stored quiz question. */
function marksFrom(raw: unknown): LearnQuizMarks | undefined {
  if (!isRecord(raw)) return undefined
  return {
    ...(typeof raw.reviewedAt === 'number' ? { reviewedAt: raw.reviewedAt } : {}),
    ...(typeof raw.missedAt === 'number' ? { missedAt: raw.missedAt } : {}),
    ...(typeof raw.step === 'number' ? { step: raw.step } : {}),
    ...(typeof raw.knownAt === 'number' ? { knownAt: raw.knownAt } : {}),
  }
}

/** One quiz question read back from the store; undefined when it is not one. */
function quizItemOf(one: unknown): LearnQuizItem | undefined {
  if (!isRecord(one)) return undefined
  const { key, name, question, answer, hint, isHinted, isShown, result, gradedAt, mine, verdict, feedback, kind, noteId } = one
  if (typeof key !== 'string' || typeof name !== 'string' || typeof question !== 'string' || typeof answer !== 'string') return undefined
  const before = marksFrom(one.before)
  return {
    key,
    name,
    question,
    answer,
    ...(typeof hint === 'string' && hint !== '' ? { hint } : {}),
    ...(isHinted === true ? { isHinted } : {}),
    ...(isShown === true ? { isShown } : {}),
    ...(result === 'right' || result === 'wrong' ? { result } : {}),
    ...(typeof gradedAt === 'number' ? { gradedAt } : {}),
    ...(typeof mine === 'string' ? { mine } : {}),
    ...(verdict === 'right' || verdict === 'partial' || verdict === 'wrong' ? { verdict } : {}),
    ...(typeof feedback === 'string' ? { feedback } : {}),
    ...(before ? { before } : {}),
    ...(kind === 'predict' || kind === 'why' || kind === 'modify' ? { kind } : {}),
    ...(typeof noteId === 'string' && noteId !== '' ? { noteId } : {}),
  }
}

/** This session's last quiz, else the one a past session left in the store. */
async function lastQuiz($: EngineInterface): Promise<Quiz | null> {
  const here = await read($, quiz)
  if (here) return here
  const raw = await $.store.get(QUIZ_KEY).catch(() => undefined)
  if (!isRecord(raw) || typeof raw.at !== 'number' || !Array.isArray(raw.items)) return null
  const items = raw.items.map(quizItemOf).filter(one => one !== undefined)
  return items.length > 0 ? { at: raw.at, items, isRevealed: raw.isRevealed === true, ...(raw.from === 'note' ? { from: 'note' as const } : {}) } : null
}

/** Whether the learner has seen a question's answer: shown in the pane or by /learn quiz 정답, or all of them in a quiz kept before 1.6.0. */
function isAnswerShown(current: Quiz, item: LearnQuizItem): boolean {
  return current.isRevealed || item.isShown === true
}

/** True for a question still to answer: not graded, its answer not seen. */
function isOpen(current: Quiz, item: LearnQuizItem): boolean {
  return item.result === undefined && !isAnswerShown(current, item)
}

/** The pane's answer field for question `i` of the quiz asked at `at`: a new quiz's fields are new elements. */
const quizFieldKey = (at: number, i: number) => `quiz-mine-${at}-${i}`

/** A wrong answer: gone over now, back to the first step, and first in the next quiz. */
const markWrong: Mark = (index, keys, at) => markMissed(markReviewed(index, keys, at), keys, at)

/**
 * How a grade marks its concept: right a step on (after a hint or the answer
 * seen, the step kept), partly right a step back, wrong back to the first.
 */
function markFor(result: 'right' | 'wrong', verdict: LearnQuizItem['verdict'], isHelped: boolean): Mark {
  if (result === 'right') return isHelped ? markHelped : markReviewed
  return verdict === 'partial' ? markPartial : markWrong
}

/**
 * True when a graded question's answer leaned on help: its hint was seen, or
 * the learner graded it themselves, which they do only once its answer is seen.
 */
function isHelpedGrade(item: LearnQuizItem): boolean {
  return item.isHinted === true || item.mine === undefined
}

/** A graded question's help, after its mark: · 힌트 봄, and · 정답 봄 for one graded right after seeing its answer. */
function helpText(item: LearnQuizItem): string {
  return `${item.isHinted === true ? ' · 힌트 봄' : ''}${item.result === 'right' && item.mine === undefined ? ' · 정답 봄' : ''}`
}

/**
 * The concepts a quiz's right answers marked known (right again at the last
 * step), as the index has them now: a mark taken off since is not shown.
 */
function graduatedIn(items: readonly LearnQuizItem[], index: Readonly<Record<string, LearnConcept>>, map: Readonly<Record<string, string>>): string[] {
  return items.flatMap(item => {
    if (item.result !== 'right' || item.gradedAt === undefined) return []
    const one = conceptAt(index, resolveKey(map, item.key))
    return one && one.knownAt === item.gradedAt ? [one.name] : []
  })
}

/** What a quiz says of the concepts it graduated, and how to take one back. */
function graduatedText(names: readonly string[]): string {
  return `졸업: ${names.join(' · ')} · 아는 개념으로 옮겨 복습과 퀴즈에서 뺍니다 (되돌리기: /learn 모른다 ${names[0]})`
}

/** Today's share of the review, for where every concept due is counted: `오늘 n개`, or that today's is done. */
function todayText(review: { due: number; left: number }): string {
  return review.left > 0 ? `오늘 ${review.left}개 (하루 ${DAILY_REVIEW}개까지)` : '오늘 몫은 마쳤습니다'
}

/** Where a reply sends the learner for the review: /learn 복습 while today's has questions left, else the quiz. */
function reviewWay(left: number): string {
  return left > 0 ? '/learn 복습 (패널에서는 q)' : '/learn 퀴즈 (패널에서는 4)'
}

/** What a finished quiz says of today's review once it is done: undefined while questions are left for today, or nothing was due and none answered today. */
function reviewDoneText(review: { due: number; left: number }, days: Readonly<Record<string, LearnDayActivity>>, now: number): string | undefined {
  if (review.left > 0) return undefined
  if (review.due > 0) return '오늘 복습을 마쳤습니다 · 남은 개념은 내일 나옵니다'
  // Nothing due: a review done only once an answer was graded today, not a quiz finished on another day.
  const today = Object.prototype.hasOwnProperty.call(days, stamp(now).day) ? days[stamp(now).day] : undefined
  return today && today.right + today.wrong > 0 ? '오늘 복습을 마쳤습니다' : undefined
}

/** Claude's grade of a typed answer, as the pane and /learn quiz say it. */
const VERDICT_TEXT: Record<'right' | 'partial' | 'wrong', string> = { right: '맞혔습니다.', partial: '거의 맞았습니다.', wrong: '아쉽지만 틀렸습니다.' }

/** True for a question Claude graded partly right, its grade still standing: counted wrong, its concept a step back. */
function isPartly(item: LearnQuizItem): boolean {
  return item.result === 'wrong' && item.verdict === 'partial' && item.isLearnerGraded !== true
}

/** True for a typed answer whose grade the learner set otherwise than Claude's verdict. */
function isTurned(item: LearnQuizItem): boolean {
  if (item.verdict === undefined || item.result === undefined || item.isLearnerGraded !== true) return false
  return item.verdict !== (item.result === 'right' ? 'right' : 'wrong')
}

/** A graded question's mark: ✓ 맞힘, △ 거의 맞음 (partly right, counted not yet right) or ✗ 틀림. */
function resultMark(item: LearnQuizItem): string {
  return item.result === 'right' ? '✓ 맞힘' : isPartly(item) ? '△ 거의 맞음' : '✗ 틀림'
}

/**
 * What happens to the concepts a finished quiz missed (the wrong first next
 * time, the partly right a little sooner), and to the ones right after a hint
 * or the answer (back after as long again).
 */
function missesText(items: readonly LearnQuizItem[], separator = ' · '): string {
  const parts: string[] = []
  if (items.some(item => item.result === 'wrong' && !isPartly(item))) parts.push('틀린 개념은 다음 퀴즈에 먼저 나옵니다')
  else if (items.some(isPartly)) parts.push('거의 맞힌 개념은 조금 일찍 다시 나옵니다')
  if (items.some(item => item.result === 'right' && isHelpedGrade(item))) parts.push('힌트나 정답을 보고 맞힌 개념은 같은 간격 뒤 다시 나옵니다')
  return parts.join(separator)
}

const NO_CONCEPTS_FOR_QUIZ = '아직 모인 개념이 없어 퀴즈를 낼 수 없습니다. 노트가 쓰이면 "배울 개념"이 쌓입니다.'
const ALL_KNOWN_TEXT = '모든 개념이 아는 개념이라 퀴즈에 낼 개념이 없습니다. 되돌리려면 /learn 모른다 개념 이름.'
const CHECKING_TEXT = '답을 채점하고 있습니다. 채점이 끝난 뒤 새 문제를 받으세요.'
const MOVED_TEXT = '그사이 새 퀴즈가 나와 이 답은 채점하지 않았습니다.'
const GRADE_NOT_KEPT = '채점을 적지 못했습니다(저장소에 쓰지 못함). 잠시 뒤 다시 해 보세요.'

/** What to say when the model in /config cannot be called (an organization's policy, a name this build does not know). */
function noModelText(cfg: Config): string {
  return `'${cfg.model}' 모델을 부를 수 없습니다 · /config에서 다른 모델을 골라 보세요`
}

/**
 * One model call for the learner: its text, or why there is none in words they
 * can act on. The prompt's secrets are masked once more on the way out: a note
 * stored or a journal written before 1.6.0, or a typed quiz answer, was never masked.
 * Every call that reached the model is counted in the usage record, answered or
 * not; `kind` says whether a turn's end made it by itself (an automatic note).
 */
async function askModel(
  $: EngineInterface,
  cfg: Config,
  call: { system: string; prompt: string; maxTokens: number; timeoutMs?: number },
  kind: 'auto' | 'manual' = 'manual',
): Promise<{ text: string } | { error: string }> {
  let reply
  try {
    reply = await $.model.complete({ model: cfg.model, effort: 'low', timeoutMs: 90_000, ...call, prompt: redactText(call.prompt).text })
  } catch {
    return { error: noModelText(cfg) }
  }
  await recordUsage($, reply.usage, kind)
  return reply.isAnswered ? { text: reply.text } : { error: failureText(reply) }
}

/**
 * Each concept with the note it is asked from, while a note still holds it: that note's id, and the learner's
 * code from it. That note is `from` when it taught the concept (a note's own quiz asks about the code of the
 * note it was asked under), else the latest that did. Its code is screened first (a note kept before 1.6.0
 * may hold a .env), so a file left out is never quoted.
 */
async function withCode(
  $: EngineInterface,
  cfg: Config,
  picks: readonly RankedConcept[],
  map: Readonly<Record<string, string>>,
  from?: string,
): Promise<QuizPick[]> {
  const written = (await allNotes($)).filter(note => note.status === 'ready').sort((a, b) => b.at - a.at)
  const found: QuizPick[] = []
  for (const one of picks) {
    const teaches = (each: LearnNote) => each.concepts.some(key => resolveKey(map, key) === one.key)
    const note = written.find(each => each.id === from && teaches(each)) ?? written.find(teaches)
    if (!note) {
      found.push(one)
      continue
    }
    // The files the concept's explanation quotes first.
    const changes = [...(await screened($, cfg, note)).changes].sort((a, b) => Number(one.files.includes(b.file)) - Number(one.files.includes(a.file)))
    let code: QuizPick['code']
    for (const change of changes) {
      const text = codeFor(change, one.blurb)
      if (text) {
        code = { file: baseName(change.file), text }
        break
      }
    }
    found.push({ ...one, noteId: note.id, ...(code ? { code } : {}) })
  }
  return found
}

/** Concepts a review quiz looks through: twice the questions it asks, so it can take them from different notes. */
const QUIZ_CANDIDATES = 6

/**
 * Asks the model for a new quiz and keeps it; or says why there is none. The
 * concepts due first, taken from different notes where it can (a wrong one
 * always), or `only` this note's (t in the pane: a note quiz that asks to
 * predict and to modify, about that note's code), never one marked known,
 * each asked about the code the learner made with it where a note still holds it.
 */
async function makeQuiz(
  $: EngineInterface,
  cfg: Config,
  now: number,
  only?: Pick<LearnNote, 'id' | 'concepts'>,
): Promise<{ items: LearnQuizItem[]; at: number } | { error: string }> {
  const index = await read($, concepts)
  const map = await read($, aliases)
  const taught = (only?.concepts ?? [])
    .map(key => resolveKey(map, key))
    .filter((key, i, all) => all.indexOf(key) === i)
    .flatMap(key => {
      const one = conceptAt(index, key)
      return one ? [{ ...one, key }] : []
    })
  // A concept the learner knows is asked about in no quiz, a note's own neither.
  const chosen = only ? taught.filter(one => !isKnown(one)).slice(0, 3) : quizPick(index, now, QUIZ_CANDIDATES)
  if (chosen.length === 0) {
    if (only) return { error: taught.length > 0 ? '이 노트의 개념은 모두 아는 개념이라 퀴즈를 낼 수 없습니다. 되돌리려면 /learn 모른다 개념 이름.' : '이 노트에는 배울 개념이 없어 퀴즈를 낼 수 없습니다.' }
    return { error: Object.keys(index).length > 0 ? ALL_KNOWN_TEXT : NO_CONCEPTS_FOR_QUIZ }
  }
  // A review quiz goes over more than one note where it can (three concepts from one note make one lesson
  // again), the concepts due before any other.
  const found = await withCode($, cfg, chosen, map, only?.id)
  const picks = only ? found : spreadPicks(found, 3, one => isDue(one, now))
  const asked = await askModel($, cfg, { system: QUIZ_SYSTEM, prompt: quizPrompt(picks, cfg.level, only ? 'note' : 'review'), maxTokens: 1400 })
  if ('error' in asked) return { error: `퀴즈를 내지 못했습니다: ${asked.error}` }
  const items = parseQuiz(asked.text, picks)
  if (items.length === 0) return { error: '퀴즈를 내지 못했습니다: 모델의 답을 문제로 읽지 못했습니다. 다시 해 보세요.' }
  await keepQuiz($, { at: now, items, isRevealed: false, ...(only ? { from: 'note' as const } : {}) })
  await update($, quizRun, run => ({ ...run, error: null }))
  await bankQuestions($, items, now)
  return { items, at: now }
}

/**
 * The pane's s (or t, on `only` this note's concepts; q for today's review): a
 * new quiz, the pane saying "making" until it is there or failed, and then the
 * first question's answer field holding the keys.
 */
async function startQuiz($: EngineInterface, cfg: Config, only?: Pick<LearnNote, 'id' | 'concepts'>): Promise<void> {
  if (isQuizMaking) return
  if (isQuizChecking) {
    await update($, quizRun, run => ({ ...run, error: CHECKING_TEXT }))
    return
  }
  isQuizMaking = true
  try {
    await update($, quizRun, () => ({ isMaking: true, error: null }))
    const made = await makeQuiz($, cfg, await $.clock.now(), only)
    await update($, quizRun, () => ({ isMaking: false, error: 'error' in made ? made.error : null }))
    // A surface with no text field (the mobile app) draws none to focus: the engine says no, and nothing else happens.
    if (!('error' in made)) focusInPane($, quizFieldKey(made.at, 0))
  } catch (error) {
    $.ui.log(`learn-notes: 퀴즈를 내지 못했습니다 (${String(error)})`, { to: 'debug' })
    await update($, quizRun, () => ({ isMaking: false, error: '퀴즈를 내지 못했습니다. 잠시 뒤 다시 해 보세요.' }))
  } finally {
    isQuizMaking = false
  }
}

/** Any other move in the quiz takes back a first s: the next s asks again before a new quiz drops what is left. */
async function disarm($: EngineInterface): Promise<void> {
  if ((await read($, quizRun)).armedNew != null) await update($, quizRun, run => ({ ...run, armedNew: null }))
}

/** The pane's h: one question's hint. */
async function showHint($: EngineInterface, i: number): Promise<void> {
  await disarm($)
  const current = await lastQuiz($)
  const item = current?.items[i]
  if (!current || !item?.hint || item.isHinted || item.result !== undefined) return
  await keepQuiz($, { ...current, items: current.items.map((one, j) => (j === i ? { ...one, isHinted: true } : one)) })
}

/** The pane's a: one question's answer. */
async function showAnswer($: EngineInterface, i: number): Promise<void> {
  await disarm($)
  const current = await lastQuiz($)
  const item = current?.items[i]
  if (!current || !item || isAnswerShown(current, item)) return
  await keepQuiz($, { ...current, items: current.items.map((one, j) => (j === i ? { ...one, isShown: true } : one)) })
}

/** The pane's o and x: the learner's own grade for one question whose answer they saw. */
async function gradeQuiz($: EngineInterface, cfg: Config, i: number, result: 'right' | 'wrong'): Promise<void> {
  await disarm($)
  const current = await lastQuiz($)
  const item = current?.items[i]
  if (!current || !item || item.result !== undefined || !isAnswerShown(current, item)) return
  if ((await applyGrade($, cfg, current, i, result, {})) === 'failed') await update($, quizRun, run => ({ ...run, error: GRADE_NOT_KEPT }))
}

/**
 * One question's first grade, kept: its concept marked (a step on, kept for a
 * right answer after its hint or answer, a step back for a partly right typed
 * answer, or back to the first), its marks from
 * before kept on the question for turning the grade around, the quiz saved,
 * the day's count added. `extra` is what a graded typed answer brings.
 */
async function applyGrade(
  $: EngineInterface,
  cfg: Config,
  current: Quiz,
  i: number,
  result: 'right' | 'wrong',
  extra: Pick<LearnQuizItem, 'mine' | 'verdict' | 'feedback'>,
): Promise<'kept' | 'busy' | 'moved' | 'failed'> {
  const mark = `${current.at}:${i}`
  if (grading.has(mark)) return 'busy'
  grading.add(mark)
  try {
    // As it stands now: a new quiz may have replaced this one, or the question been graded meanwhile.
    const fresh = (await lastQuiz($)) ?? current
    if (fresh.at !== current.at) return 'moved'
    const item = fresh.items[i]
    if (!item || item.result !== undefined) return 'busy'
    const now = await $.clock.now()
    // Right after its hint, or graded by the learner once its answer showed: recalled with help, so its step stays.
    const isHelped = isHelpedGrade({ ...item, ...extra })
    const before = await markConcepts($, cfg, markFor(result, extra.verdict, isHelped), [item.key], now)
    if (!before) return 'failed'
    // Read again: the quiz may have moved on while the concepts were written.
    const latest = (await lastQuiz($)) ?? fresh
    if (latest.at !== current.at) return 'kept'
    const prior = before[0]
    await keepQuiz($, {
      ...latest,
      items: latest.items.map((one, j) => (j === i ? { ...one, ...extra, isShown: true, result, gradedAt: now, ...(prior ? { before: prior } : {}) } : one)),
    })
    await update($, quizRun, run => ({ ...run, error: null }))
    await recordActivity($, stamp(now).day, result === 'right' ? { right: 1 } : { wrong: 1 })
    // One more answer today: the day's review may be done.
    await remind($, cfg)
    return 'kept'
  } finally {
    grading.delete(mark)
  }
}

/**
 * Turns a graded question the other way (the pane's f; /learn quiz 맞음 · 틀림
 * on one already graded): its concept graded again from its marks before the
 * first grade, as if graded this way then, and the answer moved between the
 * counts of the day it was graded. False when the store could not be written.
 */
async function regradeQuiz($: EngineInterface, cfg: Config, current: Quiz, i: number, result: 'right' | 'wrong'): Promise<'kept' | 'busy' | 'moved' | 'failed'> {
  const guard = `${current.at}:${i}`
  // A second press while the first is written does nothing: the grade is turned once.
  if (grading.has(guard)) return 'busy'
  grading.add(guard)
  try {
    const fresh = (await lastQuiz($)) ?? current
    if (fresh.at !== current.at) return 'moved'
    const item = fresh.items[i]
    if (!item || item.result === undefined || (item.result === result && !isPartly(item))) return 'busy'
    const at = item.gradedAt ?? (await $.clock.now())
    // The learner's own word: fully right or fully wrong, never "partly"; right after help keeps the step.
    const right = isHelpedGrade(item) ? markHelped : markReviewed
    const mark: Mark = (index, keys) => regrade(index, keys[0]!, item.before, at, result === 'right' ? right : markWrong)
    if (!(await markConcepts($, cfg, mark, [item.key], at))) return 'failed'
    const latest = (await lastQuiz($)) ?? fresh
    if (latest.at === current.at) {
      await keepQuiz($, { ...latest, items: latest.items.map((one, j) => (j === i ? { ...one, result, isLearnerGraded: true } : one)) })
    }
    // Partly right was counted wrong already: only a right one moves between the counts.
    if (item.result !== result) await recordActivity($, stamp(at).day, result === 'right' ? { right: 1, wrong: -1 } : { right: -1, wrong: 1 })
    return 'kept'
  } finally {
    grading.delete(guard)
  }
}

/** The pane's f: the learner turns Claude's grade of their typed answer the other way. */
async function flipGrade($: EngineInterface, cfg: Config, i: number): Promise<void> {
  await disarm($)
  const current = await lastQuiz($)
  const item = current?.items[i]
  if (!current || !item || item.result === undefined || item.verdict === undefined) return
  if ((await regradeQuiz($, cfg, current, i, item.result === 'right' ? 'wrong' : 'right')) === 'failed') {
    await update($, quizRun, run => ({ ...run, error: GRADE_NOT_KEPT }))
  }
}

/** Claude grades a typed answer to question `i` against its answer and the grade is kept: the question as graded, or why there is no grade. */
async function gradeTyped($: EngineInterface, cfg: Config, current: Quiz, i: number, mine: string): Promise<{ item: LearnQuizItem } | { error: string }> {
  const item = current.items[i]
  if (!item) return { error: '없는 문제입니다.' }
  const asked = await askModel($, cfg, { system: CHECK_SYSTEM, prompt: checkPrompt(item, mine, cfg.level), maxTokens: 400, timeoutMs: 60_000 })
  if ('error' in asked) return { error: `채점하지 못했습니다: ${asked.error}` }
  const graded = parseCheck(asked.text)
  if (!graded) return { error: '채점 결과를 읽지 못했습니다. 다시 보내 보세요.' }
  // Almost right is not right yet: counted wrong, its concept a step back.
  const kept = await applyGrade($, cfg, current, i, graded.verdict === 'right' ? 'right' : 'wrong', { mine: cut(mine, 1500), ...graded })
  if (kept === 'failed') return { error: GRADE_NOT_KEPT }
  if (kept === 'busy') return { error: '이 문제는 그사이 이미 채점했습니다.' }
  const latest = (await lastQuiz($)) ?? current
  if (kept === 'moved' || latest.at !== current.at) return { error: MOVED_TEXT }
  return { item: latest.items[i] ?? { ...item, mine, ...graded } }
}

/**
 * Enter in the quiz's answer field: Claude grades the learner's own answer, the
 * pane saying so meanwhile; graded, the keys move on to the next question's
 * field, or after the last to the button for a new quiz.
 */
async function checkAnswer($: EngineInterface, cfg: Config, i: number, text: string): Promise<void> {
  const mine = text.trim()
  const current = await lastQuiz($)
  const item = current?.items[i]
  if (!current || !item || !isOpen(current, item)) return
  if (isQuizChecking) {
    await update($, quizRun, run => ({ ...run, error: '다른 답을 채점하고 있습니다. 잠시 뒤 다시 Enter를 누르세요.', draft: { at: current.at, i, text: mine } }))
    return
  }
  if (mine === '') {
    // Recalling first, even wrongly, is what makes it stay: the answer is the last way out, not one of two.
    const stuck = item.hint !== undefined && item.isHinted !== true ? '막히면 h로 힌트를 봅니다.' : '정말 떠오르지 않으면 a로 정답을 봅니다.'
    await update($, quizRun, run => ({ ...run, error: `답을 적은 뒤 Enter를 누르세요. 틀려도 괜찮으니 먼저 떠올려 적어 보세요 · ${stuck}` }))
    return
  }
  isQuizChecking = true
  let error: string | null = null
  try {
    await update($, quizRun, run => ({ ...run, checking: i, error: null, armedNew: null }))
    const graded = await gradeTyped($, cfg, current, i, mine)
    if ('error' in graded) error = graded.error
  } catch (thrown) {
    $.ui.log(`learn-notes: 답을 채점하지 못했습니다 (${String(thrown)})`, { to: 'debug' })
    error = '채점하지 못했습니다. 잠시 뒤 다시 해 보세요.'
  } finally {
    isQuizChecking = false
    // A grade that did not come back leaves the answer in that question's field to send again.
    await update($, quizRun, run => ({ ...run, checking: null, error: error ?? run.error, draft: error !== null ? { at: current.at, i, text: mine } : null }))
  }
  if (error !== null) return
  const latest = await lastQuiz($)
  if (!latest) return
  // The question the pane shows next: the first not graded. One whose answer was seen has no field; the ring stays put.
  const next = latest.items.findIndex(one => one.result === undefined)
  if (next === -1) focusInPane($, 'quiz-new')
  else if (isOpen(latest, latest.items[next]!)) focusInPane($, quizFieldKey(latest.at, next))
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

/**
 * Asks the model about a note and keeps the question and answer on it (and in
 * the journal): the answer, or why there is none. `label` is the words kept and
 * shown for a question the model is asked in other words (r's walk-through, e's
 * plainer words); `level` the reader it answers for, the setting's unless given.
 */
async function askNote(
  $: EngineInterface,
  cfg: Config,
  id: string,
  question: string,
  label = question,
  level: Level = cfg.level,
): Promise<{ answer: string; note: LearnNote; path: string | undefined; at: number } | { error: string }> {
  const note = (await read($, notes)).find(one => one.id === id)
  if (!note) return { error: '그 노트가 패널에 없습니다.' }
  // A key pasted into a question is masked before the model, the store or the journal sees it.
  const masked = redactText(question).text
  const kept = label === question ? masked : redactText(label).text
  const rules = await teamOf($, note.root)
  // A note kept before 1.6.0 may hold a .env diff or a key: neither goes to the model or the journal.
  const shown = await screened($, cfg, note)
  const asked = await askModel($, cfg, { system: ASK_SYSTEM, prompt: askPrompt(shown, masked, level, rules), maxTokens: 900 })
  if ('error' in asked) return { error: `답하지 못했습니다: ${asked.error}` }
  const answer = cut(asked.text, 4000)
  const now = await $.clock.now()
  const latest = (await read($, notes)).find(one => one.id === id) ?? note
  await setNote($, id, { asks: [...(latest.asks ?? []), { question: cut(kept, 1000), answer, at: now }].slice(-ASKS_KEPT) })
  await persist($)
  const path = cfg.isAutoSave ? await saveAsk($, cfg, shown, kept, answer, now) : undefined
  return { answer, note, path, at: now }
}

/** True while the pane shows this note's own view, where its questions and answers are drawn. */
async function isNoteShown($: EngineInterface, id: string): Promise<boolean> {
  const list = await read($, notes)
  return viewOf(await read($, view)) === 'note' && list[shownAt(list, await read($, selectedId))]?.id === id
}

/**
 * Scrolls the pane to a row it is about to draw under a note (an answer, or
 * why there is none): the field the person typed in gives way to it, so
 * nothing else brings it into view. The engine scrolls only to a key it has
 * drawn, so the row is looked for again for a moment. The engine moves the
 * window for a plugin whatever the person did, so a move of theirs since
 * `since` (personScrolls then) leaves the window where they put it.
 */
function revealInPane($: EngineInterface, key: string, block: 'start' | 'nearest', since: number): void {
  const said = (why: string) => $.ui.log(`learn-notes: ${key} (${block}, ${PANE})로 스크롤하지 않았습니다 (${why})`, { to: 'debug' })
  const attempt = (left: number) => {
    if (personScrolls !== since) return
    void $.ui.scroll({ to: { key }, in: PANE, block }).then(
      result => {
        const next = revealNext(result.deny, left)
        if (next === 'again') $.clock.after(REVEAL_RETRY_MS, () => attempt(left - 1))
        else if (next === 'stop') said(result.deny ?? '')
      },
      (thrown: unknown) => said(String(thrown)),
    )
  }
  attempt(REVEAL_TRIES)
}

/**
 * Moves the pane's focus ring onto an element it is about to draw: the next
 * answer field, or the button for a new quiz. Only while the pane holds the
 * keys: otherwise the engine says no, and the reason goes to the debug log.
 * Not awaited: the engine waits for the element's drawing, bounded.
 */
function focusInPane($: EngineInterface, key: string): void {
  const said = (why: string) => $.ui.log(`learn-notes: ${key}로 초점을 옮기지 않았습니다 (${why})`, { to: 'debug' })
  void $.ui.focus({ requestId: PANE, key }).then(
    result => {
      if (result.deny !== undefined) said(result.deny)
    },
    (thrown: unknown) => said(String(thrown)),
  )
}

/**
 * Enter in a note's question field, or r and e (its walk-through, its plainer
 * words: `label` the words kept for it, `level` the reader answered for): the
 * answer shows under the note, the pane saying so meanwhile.
 */
async function askInPane($: EngineInterface, cfg: Config, id: string, text: string, label?: string, level?: Level): Promise<void> {
  const question = text.trim()
  const set = (state: LearnAskRun) => update($, askRun, all => ({ ...all, [id]: state }))
  // r leaves the field as it was: a question typed there, or one put back after a failure, stays.
  const kept = label === undefined ? null : ((await read($, askRun))[id]?.draft ?? null)
  if (asking.has(id)) {
    if (label === undefined) await set({ isAsking: true, error: null, draft: question })
    return
  }
  const since = personScrolls
  if (question === '') {
    await set({ isAsking: false, error: '물어볼 것을 적은 뒤 Enter를 누르세요.', draft: null })
    if (await isNoteShown($, id)) revealInPane($, askErrorKey(id), 'nearest', since)
    return
  }
  asking.add(id)
  let error: string | null = null
  let answeredAt: number | undefined
  try {
    await set({ isAsking: true, error: null, draft: kept })
    const asked = await askNote($, cfg, id, question, label, level)
    if ('error' in asked) error = asked.error
    else answeredAt = asked.at
  } catch (thrown) {
    $.ui.log(`learn-notes: 질문에 답하지 못했습니다 (${String(thrown)})`, { to: 'debug' })
    error = '답하지 못했습니다. 잠시 뒤 다시 해 보세요.'
  } finally {
    asking.delete(id)
    // A question whose answer did not come back stays in the field to send again (r's is one key away).
    await set({ isAsking: false, error, draft: label !== undefined ? kept : error !== null ? question : null })
  }
  // The answer lands below the bottom of a long note: its question goes to the top of the pane, as much of it showing as fits.
  if (!(await isNoteShown($, id))) return
  if (answeredAt !== undefined) {
    const asks = (await read($, notes)).find(one => one.id === id)?.asks ?? []
    const i = asks.map(one => one.at).lastIndexOf(answeredAt)
    if (i !== -1) revealInPane($, askedKey(id, asks, i), 'start', since)
  } else if (error !== null) revealInPane($, askErrorKey(id), 'nearest', since)
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

/**
 * Writes the note for `id` with the model; the pane redraws as its status
 * moves. `isRewrite`: the journal has it already; `isAuto`: a turn's end asked
 * for it, not the learner (it counts toward dailyAutoNotes). A rewrite that
 * fails leaves the note as it was and says why in a toast. Never rejects.
 */
async function writeNote(
  $: EngineInterface,
  cfg: Config,
  id: string,
  how: { isRewrite?: boolean; isAuto?: boolean } = {},
): Promise<void> {
  const { isRewrite = false, isAuto = false } = how
  if (inFlight.has(id)) return
  inFlight.add(id)
  try {
    const prior = (await read($, notes)).find(one => one.id === id)
    if (!prior) return
    // A note counts toward the day's learning the first time it is written, never on a rewrite.
    const isCounted = prior.isCounted === true || prior.status === 'ready'
    const good = prior.status === 'ready' ? { status: prior.status, text: prior.text } : undefined
    // Written now, it is no longer one a turn's end passed over.
    const note = await setNote($, id, { status: 'writing', text: '', skip: undefined })
    if (!note) return
    const rules = await teamOf($, note.root)
    const asked = await askModel(
      $,
      cfg,
      {
        system: SYSTEM,
        // A note kept before 1.6.0, written again, was never screened.
        prompt: notePrompt(await screened($, cfg, note), cfg.level, knownNames(await read($, concepts)), rules),
        maxTokens: 1500,
      },
      isAuto ? 'auto' : 'manual',
    )
    // Counted in the usage record now (or never made): no longer one being written.
    autoPending.delete(id)
    if ('error' in asked && good) {
      // Only the new version failed: the note it was to replace stays, in the pane, the store and the journal.
      const kept = (await setNote($, id, good)) ?? { ...note, ...good }
      // A store write meanwhile (another turn, a question) may hold it as being written: store it as it is again.
      await persist($, false, [kept])
      $.ui.toast(`노트를 다시 쓰지 못했습니다: ${asked.error} · 원래 노트는 그대로입니다`, { timeoutMs: 8000 })
      return
    }
    const patch: Partial<LearnNote> =
      'error' in asked ? { status: 'failed', text: `${asked.error} · w로 다시 쓰기` } : { status: 'ready', text: closeConceptBold(cut(asked.text, 9000)) }
    // A note cleared from the pane meanwhile, or left behind by a /cd, is still saved and stored from this copy.
    let done = (await setNote($, id, patch)) ?? { ...note, ...patch }
    if (done.status === 'ready') {
      try {
        const keys = await learnConcepts($, cfg, done)
        done = (await setNote($, id, { concepts: keys })) ?? { ...done, concepts: keys }
        if (!isCounted) await recordActivity($, stamp(done.at).day, { notes: 1 })
        if (!done.isCounted) done = (await setNote($, id, { isCounted: true })) ?? { ...done, isCounted: true }
      } catch (error) {
        $.ui.log(`learn-notes: 노트의 개념을 세지 못했습니다 (${String(error)})`, { to: 'debug' })
      }
    }
    // autoSave off means no journal, nothing more: the note stays in the pane and the store.
    if (cfg.isAutoSave) await save($, cfg, done, isRewrite)
    await persist($, false, [done])
    if (done.status === 'ready') await announceNote($, done)
  } catch (error) {
    $.ui.log(`learn-notes: 노트를 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
  } finally {
    inFlight.delete(id)
    autoPending.delete(id)
  }
}

/** Shell commands that may write files: the ones whose named files are read before they run. */
const WRITES = />|\btee\b|\bsed\s+-i|\b(?:cp|mv|rm|touch|install|python3?|node|perl|ruby|dd|patch|unzip|tar)\b|Set-Content|Out-File|Add-Content|New-Item|Copy-Item|Move-Item|Remove-Item|Rename-Item|WriteAll|Expand-Archive/i

/** A shell command's per-file diff as the engine gives it, when it gave a usable one. */
type ShellEdits = { files: { filePath: string; hunks: Hunk[]; created?: true; deleted?: true }[]; moreFiles: number }

/** The engine's own diff out of a shell result of any tool (`bashEditDiff`), or undefined when it gave none it could make. */
function shellEdits(raw: unknown): ShellEdits | undefined {
  if (!isRecord(raw) || !Array.isArray(raw.files) || raw.unavailable === true || raw.skipped === true) return undefined
  const files = raw.files.filter(
    (file): file is ShellEdits['files'][number] => isRecord(file) && typeof file.filePath === 'string' && Array.isArray(file.hunks),
  )
  return { files, moreFiles: typeof raw.moreFiles === 'number' ? raw.moreFiles : 0 }
}

/** Folds a shell command's engine-made diff into the running turn. */
async function collectEdits($: EngineInterface, cfg: Config, tool: 'Bash' | 'PowerShell', edits: ShellEdits): Promise<void> {
  const root = await $.session.root()
  for (const file of edits.files) {
    if (file.hunks.length === 0 || (await isBookkeeping($, file.filePath))) continue
    const kind = file.created ? 'create' : file.deleted ? 'delete' : 'update'
    await collect($, cfg, changeOf({ path: file.filePath, root, tool, kind, hunks: file.hunks }))
  }
  if (edits.moreFiles > 0) await countUnlisted($, edits.moreFiles)
}

/** Bytes past which a file is not read to diff it. */
const DIFF_READ_MAX = 300_000

/** A file's text for diffing: null while it does not exist, undefined when it cannot be read (a folder, too big, refused). */
async function readForDiff($: EngineInterface, path: string): Promise<string | null | undefined> {
  try {
    if (!(await $.fs.exists(path))) return null
    const stat = await $.fs.stat(path)
    if (stat.kind !== 'file' || stat.size > DIFF_READ_MAX) return undefined
    return String(await $.fs.read(path))
  } catch {
    return undefined
  }
}

/** The files a shell command names, each read as it is before the command runs (see shellTargets). */
async function readTargets($: EngineInterface, command: string): Promise<Map<string, string | null | undefined> | undefined> {
  try {
    const root = await $.session.root()
    const cwd = await $.session.cwd().catch(() => root)
    const before = new Map<string, string | null | undefined>()
    for (const path of shellTargets(command, cwd || root, await homeDir($))) before.set(path, await readForDiff($, path))
    return before
  } catch (error) {
    $.ui.log(`learn-notes: 명령이 바꿀 파일을 미리 읽지 못했습니다 (${String(error)})`, { to: 'debug' })
    return undefined
  }
}

/** What a shell command changed among the files it named, read off the files themselves after it ran. */
async function collectShellChanges($: EngineInterface, cfg: Config, tool: 'Bash' | 'PowerShell', before: Map<string, string | null | undefined>): Promise<void> {
  const root = await $.session.root()
  for (const [path, old] of before) {
    if (old === undefined) continue
    const now = await readForDiff($, path)
    if (now === undefined || now === old || (await isBookkeeping($, path))) continue
    const kind = old === null ? 'create' : now === null ? 'delete' : 'update'
    const hunks = old === null ? [creationHunk(now ?? '')] : now === null ? [deletionHunk(old)] : diffHunks(old, now)
    // Only line ends changed (CRLF ↔ LF): nothing a learner would read as an edit.
    if (kind === 'update' && hunks.length === 0) continue
    await collect($, cfg, changeOf({ path, root, tool, kind, hunks }))
  }
}

/**
 * A shell command's edits folded into the running turn, after it ran: the
 * engine's own diff when it gave one, else the named files read again and
 * compared with `before`. Never fails the command.
 */
async function collectShell(
  $: EngineInterface,
  cfg: Config,
  tool: 'Bash' | 'PowerShell',
  command: string,
  ran: { deny?: unknown; isError?: boolean; result?: unknown },
  before: Map<string, string | null | undefined> | undefined,
): Promise<void> {
  try {
    // What a stash, checkout or pull put on disk is not an edit made this turn.
    if (ran.deny !== undefined || isGitMove(command)) return
    const result = ran.result
    const edits = isRecord(result) ? shellEdits(result.bashEditDiff) : undefined
    if (edits) {
      if (!ran.isError) await collectEdits($, cfg, tool, edits)
    } else if (before) {
      await collectShellChanges($, cfg, tool, before)
    }
  } catch (error) {
    $.ui.log(`learn-notes: ${tool} 명령의 변경을 잡지 못했습니다 (${String(error)})`, { to: 'debug' })
  }
}

/**
 * True when the permission rules (permissions.deny's Read rules, the
 * organization's managed ones too) forbid reading `path`: the engine's verdict
 * for a Read of it, which runs nothing and opens no dialog. Asked once a turn
 * per path; a failure to ask counts as allowed.
 */
async function isReadDenied($: EngineInterface, path: string): Promise<boolean> {
  const known = readDenied.get(path)
  if (known !== undefined) return known
  let isDenied = false
  try {
    isDenied = (await $.tool.check({ tool: 'Read', input: { file_path: path } })).decision === 'deny'
  } catch {
    // A host that cannot answer has no rule to keep: the file goes in as before.
  }
  readDenied.set(path, isDenied)
  return isDenied
}

/** Bytes past which a team file is not read: rules and terms are cut to TEAM_BUDGET anyway. */
const TEAM_READ_MAX = 200_000

/** Where `root`'s team file is. */
function teamPath(root: string): string {
  return `${root.replace(/[\\/]+$/, '')}/${TEAM_FILE}`
}

/**
 * This project's team file (TEAM_FILE), read again only when its stamp
 * (modified time, size) changed since the last read; undefined while there is
 * none, it is too big, or the permission rules forbid reading it (or, for a
 * link in its place, what it leads to). Never rejects.
 */
async function loadTeam($: EngineInterface): Promise<TeamFile | undefined> {
  try {
    const root = await $.session.root()
    const path = root ? teamPath(root) : ''
    if (path === '' || !(await $.fs.exists(path)) || (await isReadDenied($, path))) {
      team = null
      return undefined
    }
    const stat = await $.fs.stat(path)
    // A repository may commit a link there: the file it leads to must be one the rules let be read, too.
    const real = stat.isLink ? (await $.fs.stat(path, { resolve: true })).realPath : path
    if (stat.kind !== 'file' || stat.size > TEAM_READ_MAX || real === undefined || (real !== path && (await isReadDenied($, real)))) {
      team = null
      return undefined
    }
    if (team?.path === path && team.mtimeMs === stat.mtimeMs && team.size === stat.size) return team.parsed
    const parsed = parseTeamFile(String(await $.fs.read(path)))
    team = { path, mtimeMs: stat.mtimeMs, size: stat.size, parsed }
    return parsed
  } catch (error) {
    $.ui.log(`learn-notes: 팀 규칙 파일을 읽지 못했습니다 (${String(error)})`, { to: 'debug' })
    team = null
    return undefined
  }
}

/** The team file for a note of `root`: this project's (read again if it changed), none for a note of another project. */
async function teamOf($: EngineInterface, root: string): Promise<TeamFile | undefined> {
  const here = await $.session.root()
  return root === '' || root === here ? loadTeam($) : undefined
}

/** The team file read for this project last, without reading it again (the pane, the patterns `collect` leaves out). */
async function teamHere($: EngineInterface): Promise<TeamFile | undefined> {
  const root = await $.session.root()
  return root && team?.path === teamPath(root) ? team.parsed : undefined
}

/**
 * Folds one tool's change into the running turn; a file that may hold secrets,
 * a lock or generated file, one excludePaths or the team file's `## 빼기`
 * names, or one the permission rules forbid reading is only named, its
 * content left out.
 */
async function collect($: EngineInterface, cfg: Config, change: LearnChange): Promise<void> {
  const patterns = [...cfg.excludePaths, ...((await teamHere($))?.exclude ?? [])]
  const why: LearnWithheld['why'] | undefined =
    withheldOf(change.file, change.path, patterns) ?? ((await isReadDenied($, change.path)) ? 'policy' : undefined)
  if (why !== undefined) {
    await update($, live, prior => {
      const base = prior ?? emptyLive('', '')
      const withheld = base.withheld ?? []
      if (withheld.some(one => one.file === change.file) || withheld.length >= WITHHELD_KEPT) return { ...base, withheld }
      return { ...base, withheld: [...withheld, { file: change.file, why }] }
    })
    return
  }
  await update($, live, prior => {
    const base = prior ?? emptyLive('', '')
    const { changes, dropped } = merge(base.changes, change)
    const isNew = dropped !== undefined && !base.dropped.includes(dropped)
    return { ...base, changes, dropped: isNew ? [...base.dropped, dropped] : base.dropped }
  })
}

/**
 * `note` as it may go to a model or into the journal (see screenNote): the
 * files collect leaves out now (excludePaths, the note's project's team file,
 * the permission rules) named instead of shown, the rest's secrets masked. A
 * note kept before 1.6.0, or by an older build, was never screened; the store
 * keeps it as it is.
 */
async function screened<T extends LearnNote>($: EngineInterface, cfg: Config, note: T): Promise<T> {
  const rules = await teamOf($, note.root)
  const denied = new Set<string>()
  for (const change of note.changes) if (await isReadDenied($, change.path)) denied.add(change.path)
  return screenNote(note, [...cfg.excludePaths, ...(rules?.exclude ?? [])], path => denied.has(path))
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
    const at = shownAt(list, current)
    const to = Math.max(0, Math.min(list.length - 1, at + delta))
    return to >= list.length - 1 ? null : (list[to]?.id ?? null)
  })
}

/** What a question in a /learn quiz list says before itself: its grade (and help), Claude grading it now, or its answer seen. */
function quizItemState(current: Quiz, item: LearnQuizItem, isChecking: boolean): string {
  if (item.result !== undefined) return `${resultMark(item)}${helpText(item)} · `
  if (isChecking) return '채점 중 · '
  return isAnswerShown(current, item) ? '정답 봄 · ' : ''
}

/** The first question still to answer, past the one Claude is grading now: its index, or -1. */
function firstOpen(current: Quiz, checking?: number | null): number {
  return current.items.findIndex((item, i) => i !== checking && isOpen(current, item))
}

/**
 * The quiz there is, as /learn quiz shows it again (no model call): each
 * question with its grade, then how to go on, `tail` after it.
 */
function quizListText(current: Quiz, now: number, tail: string, checking?: number | null): string {
  const graded = current.items.filter(item => item.result !== undefined).length
  const lines = current.items.map((item, i) => listItem(i + 1, `${quizItemState(current, item, i === checking)}${item.question}`))
  const open = firstOpen(current, checking)
  const seen = current.items.flatMap((item, i) => (item.result === undefined && i !== checking && isAnswerShown(current, item) ? [i + 1] : []))
  const next = open === -1 ? '모두 채점했거나 정답을 봤습니다' : `답을 적어 채점받기: /learn 퀴즈 ${open + 1} 내 답`
  return [
    `풀던 퀴즈 · ${current.items.length}문제 중 ${graded}개 채점 (${when(current.at, now)})`,
    '',
    lines.join('\n\n'),
    '',
    ...(seen.length > 0 ? [`정답을 본 문제는 스스로 채점: /learn 퀴즈 맞음 ${seen[0]} · /learn 퀴즈 틀림 ${seen[0]}`] : []),
    `${next} ${tail}`,
  ].join('\n')
}

/**
 * Claude grades a typed answer to question `n` in the conversation: the grade,
 * the answer and what comes next (`lead` before them), or why it was not graded.
 */
async function typedAnswer($: EngineInterface, cfg: Config, current: Quiz, n: number, mine: string, lead = ''): Promise<string> {
  const item = current.items[n - 1]
  if (!item) return `문제 번호를 1~${current.items.length} 사이로 적어 주세요. 예: /learn 퀴즈 1 내 답`
  if (item.result !== undefined) return `${n}번은 이미 채점했습니다 (${resultMark(item)}). 새 문제: /learn 퀴즈 새로`
  if (isAnswerShown(current, item)) return `${n}번은 정답을 이미 봤습니다. 스스로 채점해 알려 주세요: /learn 퀴즈 맞음 ${n} · /learn 퀴즈 틀림 ${n}`
  if (isQuizChecking) return '다른 답을 채점하고 있습니다. 잠시 뒤 다시 보내 주세요.'
  if (isQuizMaking) return '새 문제를 만들고 있습니다. 문제가 나온 뒤 /learn 퀴즈로 보고 답하세요.'
  isQuizChecking = true
  try {
    await update($, quizRun, run => ({ ...run, checking: n - 1, error: null }))
    const graded = await gradeTyped($, cfg, current, n - 1, mine)
    if ('error' in graded) return graded.error
    const after = (await lastQuiz($)) ?? current
    const next = after.items.findIndex(one => isOpen(after, one))
    const right = after.items.filter(one => one.result === 'right').length
    const index = await read($, concepts)
    const days = await read($, activity)
    const at = await $.clock.now()
    const finished = reviewDoneText(todayReview(index, days, at), days, at)
    const tail =
      next !== -1
        ? `다음 문제: /learn 퀴즈 ${next + 1} 내 답${after.items[next]!.hint && !after.items[next]!.isHinted ? ' · 막히면 /learn 퀴즈 힌트' : ''}`
        : after.items.every(one => one.result !== undefined)
          ? `다 풀었습니다: ${after.items.length}문제 중 ${right}개 맞힘.${missesText(after.items) ? ` ${missesText(after.items, '. ')}.` : ''}${finished ? ` ${finished}.` : ''}`
          : ''
    const done = graded.item
    const graduated = graduatedIn([done], index, await read($, aliases))
    return [
      ...(lead ? [lead, ''] : []),
      `${n}번 ${resultMark(done)}${helpText(done)} · ${VERDICT_TEXT[done.verdict ?? 'wrong']} ${done.feedback ?? ''}`.trim(),
      '',
      '정답',
      done.answer,
      '',
      `채점이 이상하면 바꾸세요: /learn 퀴즈 ${done.result === 'right' ? '틀림' : '맞음'} ${n}`,
      ...(graduated.length > 0 ? ['', graduatedText(graduated)] : []),
      ...(tail ? ['', tail] : []),
    ].join('\n')
  } finally {
    isQuizChecking = false
    await update($, quizRun, run => ({ ...run, checking: null }))
  }
}

/**
 * /learn quiz 정답: the answer of the question being answered (the first one
 * open, or number `said`), seen now so a grade the learner gives it keeps its
 * step; every answer once no question is left open.
 */
async function answerText($: EngineInterface, current: Quiz, said: number | undefined): Promise<string> {
  const checking = (await read($, quizRun)).checking
  const n = said ?? firstOpen(current, checking) + 1
  if (said === undefined && n === 0) {
    // Nothing left to recall: every answer at once, and how to grade the ones seen and not graded.
    const lines = current.items.map((item, i) => listItem(i + 1, `${item.answer}\n(개념: ${item.name}${item.result !== undefined ? ` · ${resultMark(item)}` : ''})`))
    const seen = current.items.flatMap((item, i) => (item.result === undefined && i !== checking ? [i + 1] : []))
    // Seeing the answers grades nothing: only what the learner says counts toward the record and the review steps.
    const how =
      seen.length > 0
        ? `\n\n스스로 채점해 번호로 알려 주세요: 맞힌 문제는 /learn 퀴즈 맞음 ${seen.join(' ')} · 틀린 문제는 /learn 퀴즈 틀림 ${seen[0]}\n채점한 문제만 학습 기록과 복습 간격에 들어갑니다.`
        : ''
    return `정답\n\n${lines.join('\n\n')}${how}`
  }
  const item = current.items[n - 1]
  if (!item) return `문제 번호를 1~${current.items.length} 사이로 알려 주세요. 예: /learn 퀴즈 정답 ${current.items.length}`
  if (checking === n - 1) return `${n}번은 지금 Claude가 채점하고 있습니다. 채점이 끝나면 정답도 함께 보입니다.`
  if (item.result === undefined) await showAnswer($, n - 1)
  const after = (await lastQuiz($)) ?? current
  const next = firstOpen(after, checking)
  const steps = [
    ...(item.result === undefined ? [`스스로 채점: /learn 퀴즈 맞음 ${n} · /learn 퀴즈 틀림 ${n}`] : []),
    ...(next !== -1 ? [`다음 문제: /learn 퀴즈 ${next + 1} 내 답`] : []),
  ]
  const mark = item.result !== undefined ? ` · ${resultMark(item)}` : ''
  return `${n}번 정답\n\n${item.answer}\n(개념: ${item.name}${mark})${steps.length > 0 ? `\n\n${steps.join(' · ')}` : ''}`
}

/**
 * Words that start a /learn quiz command, not an answer: one misspelled is not graded as the learner's answer.
 * The replies' own "새 문제" and "다음 문제", and help, are among them: graded, they would be a miss.
 */
const QUIZ_WORD =
  /^(힌트|정답|문제|새로|새\s*(?:문제|퀴즈)|다음\s*문제|맞|틀|오답|도움말|답\s*적기|적기|채점|(?:hints?|answers?|questions?|right|correct|wrong|missed?|help|new\s+(?:quiz|questions?))\b)/i
/** The quiz asked for in other words (시작 · 보기 · 계속 …): the quiz being answered, or a new one when none is, as /learn 퀴즈 alone. */
const QUIZ_SHOW = /^(?:시작|보기|풀기|계속|이어서|다시|열기|start|show|open|continue|resume)(?:\s*(?:하기|해\s*줘|할래))?$/i
/** What may follow /learn 복습 as a plain request (/learn 복습 해 줘): the review itself. */
const REVIEW_PLEASE = /^(?:하기|해\s*(?:줘|주세요|줄래)|할래|좀|please)$/i
/** A new quiz asked for: 새로 · 새 · new, or 새 문제 (받기) · 새 퀴즈 as the replies and the pane's s say it. */
const QUIZ_NEW = /^(?:새로|새|new)(?:\s*(?:문제|퀴즈|quiz|questions?))?(?:\s*받기)?$/i
/** The quiz being answered asked for again: 문제, or 다음 (문제) · 목록 as the replies' "다음 문제: …" may be read. */
const QUIZ_LIST = /^(?:문제|questions?|다음|다음\s*문제|목록|next|list)$/i
/** How /learn quiz is used asked for, the replies' own "내 답" placeholder among it: nothing to grade. */
const QUIZ_HELP = /^(?:help|도움말|도움|쓰는\s*법|사용법|usage|내\s*답|\?)$/i

/**
 * /learn quiz and what may follow it: the quiz being answered (a new one when
 * none is), `새로` for a new one; `1 내 답`, or an answer with no number for
 * the first open question, a typed answer Claude grades; `힌트`; `정답`, the
 * answer of the question being answered (`정답 2`, that one's); `맞음 1` ·
 * `틀림 2`, the learner's own grade once the answer is seen (or turning a
 * grade around).
 */
async function quizCommand($: EngineInterface, cfg: Config, said: string): Promise<string> {
  const now = await $.clock.now()
  const current = await lastQuiz($)
  // The number first (1 힌트 · 2 정답) is the same ask as after: not an answer to grade.
  const flipped = /^(\d+)\s*번?\s+(힌트|hints?|정답|answers?)(?:\s*보기)?$/i.exec(said)
  const showWord = QUIZ_SHOW.test(said) ? said.trim() : undefined
  const rest = showWord !== undefined ? '' : flipped ? `${flipped[2]} ${flipped[1]}` : said
  const isNew = QUIZ_NEW.test(rest)
  if (QUIZ_HELP.test(rest)) return QUIZ_USAGE
  // 보기 after it as the pane's a says it: 정답 보기, 정답 2 보기.
  const answer = /^(정답|답|answer|answers)\s*(?:(\d+)\s*번?)?(?:\s*보기)?$/i.exec(rest)
  if (answer) {
    if (!current) return NO_QUIZ
    return answerText($, current, answer[2] === undefined ? undefined : Number(answer[2]))
  }
  if (QUIZ_LIST.test(rest)) {
    if (!current) return NO_QUIZ
    return quizListText(current, now, '· 새 문제: /learn 퀴즈 새로', (await read($, quizRun)).checking)
  }
  // One question's hint, as the pane's h: the one being answered (the first open, not the one Claude is grading), or 힌트 2.
  const hintAsk = /^(?:힌트|hints?)\s*(?:(\d+)\s*번?)?(?:\s*보기)?$/i.exec(rest)
  if (hintAsk) {
    if (!current) return NO_QUIZ
    const checking = (await read($, quizRun)).checking
    const n = hintAsk[1] !== undefined ? Number(hintAsk[1]) : current.items.findIndex((item, i) => i !== checking && isOpen(current, item)) + 1
    const item = current.items[n - 1]
    if (hintAsk[1] === undefined && !item) {
      if (typeof checking === 'number' && current.items[checking] && isOpen(current, current.items[checking]!)) return `${checking + 1}번은 지금 Claude가 채점하고 있습니다. 채점이 끝난 뒤 다시 보세요.`
      return '힌트를 볼 문제가 없습니다 (모두 채점했거나 정답을 봤습니다). 새 문제: /learn 퀴즈 새로'
    }
    if (!item) return `문제 번호를 1~${current.items.length} 사이로 알려 주세요. 예: /learn 퀴즈 힌트 1`
    if (checking === n - 1) return `${n}번은 지금 Claude가 채점하고 있습니다. 채점이 끝난 뒤 다시 보세요.`
    if (!isOpen(current, item)) return `${n}번은 이미 채점했거나 정답을 봤습니다. 지금 문제: /learn 퀴즈`
    if (item.hint === undefined) return `${n}번에는 힌트가 없습니다. 정답 보기: /learn 퀴즈 정답 ${n}`
    if (item.isHinted !== true) await keepQuiz($, { ...current, items: current.items.map((one, i) => (i === n - 1 ? { ...one, isHinted: true } : one)) })
    return `${n}번 힌트\n\n${item.hint}\n\n답을 적어 채점받기: /learn 퀴즈 ${n} 내 답 · 정답 보기: /learn 퀴즈 정답 ${n}`
  }
  // Only numbers may follow the word (said plainly or politely: 맞았어요): "틀린 것 같은데…" is no grade.
  const grade = /^(맞음|맞았어요?|맞혔어요?|맞아요|맞힘|right|correct|틀림|틀렸어요?|틀렸음|틀려요|틀린|오답|miss|missed|wrong)\s*([\d\s,번]*)$/i.exec(rest)
  if (grade) {
    if (!current) return NO_QUIZ
    const result = /^(맞|right|correct)/i.test(grade[1]!) ? 'right' : 'wrong'
    const word = result === 'right' ? '맞음' : '틀림'
    const said = [...new Set((grade[2]!.match(/\d+/g) ?? []).map(Number))]
    // No number: the one question there is, or the one whose answer was just seen and not graded.
    const seen = current.items.flatMap((item, i) => (item.result === undefined && isAnswerShown(current, item) ? [i + 1] : []))
    const numbers = said.length > 0 ? said : current.items.length === 1 ? [1] : seen.length === 1 ? seen : []
    if (numbers.length === 0 || numbers.some(n => current.items[n - 1] === undefined)) {
      return `문제 번호를 1~${current.items.length} 사이로 알려 주세요. 예: /learn 퀴즈 ${word} ${current.items.length}`
    }
    const checking = (await read($, quizRun)).checking
    if (typeof checking === 'number' && numbers.includes(checking + 1)) return `${checking + 1}번은 지금 Claude가 채점하고 있습니다. 채점이 끝난 뒤 다시 알려 주세요.`
    const unseen = numbers.filter(n => isOpen(current, current.items[n - 1]!))
    if (unseen.length > 0) {
      return `${unseen.join(', ')}번은 아직 정답을 보지 않았습니다. 답을 적어 채점받기: /learn 퀴즈 ${unseen[0]} 내 답 · 정답 보기: /learn 퀴즈 정답 ${unseen[0]}`
    }
    const changed: string[] = []
    const changedAt: number[] = []
    let helped = 0
    for (const n of numbers) {
      const latest = (await lastQuiz($)) ?? current
      if (latest.at !== current.at) return MOVED_TEXT
      const item = latest.items[n - 1]!
      if (item.result === result && !isPartly(item)) continue
      const done = item.result === undefined ? await applyGrade($, cfg, latest, n - 1, result, {}) : await regradeQuiz($, cfg, latest, n - 1, result)
      if (done === 'failed') return GRADE_NOT_KEPT
      if (done === 'moved') return MOVED_TEXT
      if (done === 'kept') {
        changed.push(`${n}. ${item.name}`)
        changedAt.push(n - 1)
        if (isHelpedGrade(item)) helped += 1
      }
    }
    if (changed.length === 0) return `이미 ${word}으로 적혀 있습니다.`
    if (result === 'wrong') return `틀린 것으로 적었습니다: ${changed.join(' · ')}. 복습할 개념 맨 앞에 올라 다음 퀴즈에 먼저 나옵니다.`
    // Graded after the answer showed: recalled with help, so the interval stays (a typed answer turned right moves on).
    const spacing =
      helped === changed.length
        ? '정답을 보고 맞혀 복습 간격은 그대로입니다.'
        : helped === 0
          ? '다음 복습까지 간격이 늘어납니다.'
          : '직접 맞힌 문제는 간격이 늘고, 정답을 보고 맞힌 문제는 그대로입니다.'
    const items = ((await lastQuiz($))?.items ?? []).filter((_, i) => changedAt.includes(i))
    const graduated = graduatedIn(items, await read($, concepts), await read($, aliases))
    return `맞힌 것으로 적었습니다: ${changed.join(' · ')}. ${spacing}${graduated.length > 0 ? `\n\n${graduatedText(graduated)}` : ''}`
  }
  const typed = /^(\d+)\s*번?\s*[.):]?\s+([\s\S]+)$/.exec(rest)
  if (typed) {
    if (!current) return NO_QUIZ
    return typedAnswer($, cfg, current, Number(typed[1]), typed[2]!.trim())
  }
  if (rest !== '' && !isNew) {
    // An answer with no number: the first question still open.
    const open = current ? firstOpen(current) : -1
    if (!current || open === -1) return QUIZ_USAGE
    const numbered = /^(\d+)\s*번$/.exec(rest)
    if (numbered) {
      const n = Number(numbered[1])
      if (!current.items[n - 1]) return `문제 번호를 1~${current.items.length} 사이로 적어 주세요. 예: /learn 퀴즈 1 내 답`
      return `${n}번에 답하려면 번호 뒤에 답을 적어 주세요: /learn 퀴즈 ${n} 내 답 · 정답 보기: /learn 퀴즈 정답 ${n}`
    }
    if (/^\d+$/.test(rest)) return `숫자만 적으면 문제 번호인지 답인지 알 수 없습니다. ${open + 1}번의 답이 ${rest}이면: /learn 퀴즈 ${open + 1} ${rest}`
    // A command word misspelled, or an answer that starts with one ("정답은 3이에요"): neither read nor graded, and said so.
    const isShort = [...rest.trim()].length < 2
    if (isShort) return `한 글자뿐이라 답으로 채점하지 않았습니다. ${open + 1}번의 답이면 번호를 붙여 보내 주세요: /learn 퀴즈 ${open + 1} ${rest}\n\n${QUIZ_USAGE}`
    // A command word is not offered back with a number: that would be graded as the answer.
    if (QUIZ_WORD.test(rest)) {
      return `명령 낱말(힌트 · 정답 · 맞음 · 틀림 · 새 문제 등)로 시작해 답으로 채점하지 않았습니다. ${open + 1}번의 답이면 번호 뒤에 적어 주세요: /learn 퀴즈 ${open + 1} 내 답\n\n${QUIZ_USAGE}`
    }
    // Said only once it is graded: an answer turned away (another being graded, the model failing) was not.
    return typedAnswer($, cfg, current, open + 1, rest.trim(), `${open + 1}번 답으로 채점했습니다`)
  }
  if (isQuizMaking) return '패널에서 문제를 만들고 있습니다. 잠시 뒤 /learn 퀴즈로 보세요.'
  // The quiz being answered first: a new one only once none is left open, or when asked for (새로).
  if (!isNew && current && current.items.some(item => isOpen(current, item))) {
    const listed = quizListText(current, now, '· 새 문제: /learn 퀴즈 새로', (await read($, quizRun)).checking)
    // 시작 · 계속 may be the answer itself (a program that prints 시작): how to send it as one.
    const open = firstOpen(current)
    return showWord !== undefined && open !== -1 ? `${listed}\n\n답으로 적은 말이면 번호를 붙여 보내 주세요: /learn 퀴즈 ${open + 1} ${showWord}` : listed
  }
  if (isQuizChecking) return '답을 채점하고 있습니다. 채점이 끝난 뒤 새 문제를 받으세요.'
  isQuizMaking = true
  let made
  try {
    made = await makeQuiz($, cfg, now)
  } finally {
    isQuizMaking = false
  }
  if ('error' in made) return made.error
  return [
    `복습 퀴즈 · ${made.items.length}문제`,
    '',
    made.items.map((item, i) => listItem(i + 1, item.question)).join('\n\n'),
    '',
    '먼저 스스로 답해 보세요.',
    '- 답을 적어 채점받기: /learn 퀴즈 1 내 답 (번호 없이 적으면 1번부터)',
    ...(made.items.some(item => item.hint !== undefined) ? ['- 막히면 힌트: /learn 퀴즈 힌트'] : []),
    '- 정답 보기: /learn 퀴즈 정답 (지금 문제 하나 · 그 뒤 맞음·틀림을 번호로 알려 주세요)',
    '',
    '패널(/learn)의 퀴즈 보기(4)에서도 같은 문제를 이어서 풉니다.',
  ].join('\n')
}

export const register: Register = (on, options) => {
  const cfg = configOf(options)

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'learn',
      description: '학습 노트 패널을 엽니다 · /learn 도움말로 명령 목록',
      argumentHint: '[복습|퀴즈|정리|질문|기록|보고서|찾기|일지|도움말]',
      immediate: true,
    })
    // An engine without tools for plugins, or one that refuses this one, leaves /learn as it was.
    try {
      await $.tool.register(TOOL_SPEC)
      hasTool = true
    } catch (error) {
      hasTool = false
      $.ui.log(`learn-notes: 학습 기록 도구를 등록하지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
    isInteractive = e.isInteractive
    await loadHistory($)
    await loadTeam($)
    await seedActivity($)
    await seedUsage($)
    await remind($, cfg)
    await welcome($)
    // A quiz request a reload cut off is not coming back; the last quiz is there for the pane to draw.
    if (!isQuizMaking && !isQuizChecking) await update($, quizRun, () => ({ isMaking: false, error: null, checking: null }))
    // A question a reload cut off is not coming back: its field is there again.
    await update($, askRun, all => Object.fromEntries(Object.entries(all).filter(([id]) => !asking.has(id)).map(([id, one]) => [id, { ...one, isAsking: false }])))
    if ((await read($, quiz)) === null) {
      const last = await lastQuiz($)
      if (last) await update($, quiz, () => last)
    }
    return next(e)
  })

  // The learning record tool (TOOL_SPEC): read-only, answered here with no model call.
  on('tool.call', { tool: TOOL_NAME }, async ($, e) => {
    const action = typeof e.action === 'string' ? e.action.trim() : ''
    const query = typeof e.query === 'string' ? e.query.trim() : ''
    try {
      return { result: await toolText($, cfg, action, query) }
    } catch (error) {
      $.ui.log(`learn-notes: 학습 기록 도구가 답하지 못했습니다 (${String(error)})`, { to: 'debug' })
      return { result: '학습 기록을 읽지 못했습니다. 잠시 뒤 다시 해 보세요.' }
    }
  })

  // It only reads the learner's own record: no permission dialog where only the mode would ask.
  // A deny, or an ask a settings rule or a hook made (an organization wanting a dialog for it), still holds.
  on('tool.check', { tool: TOOL_NAME }, async ($, e, next) => {
    const verdict = await next(e).catch(() => undefined)
    if (verdict?.decision === 'deny') return verdict
    if (verdict?.decision === 'ask' && (verdict.rule !== undefined || verdict.hook !== undefined)) return verdict
    return { decision: 'allow' as const, reason: 'learn-notes의 읽기 전용 학습 기록' }
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
    // A file's read permission is asked again this turn: the rules may have changed since the last.
    readDenied.clear()
    await followRoot($)
    // The team file (TEAM_FILE) of the project the turn works in, so its `## 빼기` holds for every edit; read again only if it changed.
    await loadTeam($)
    const kept = await read($, submitted)
    const list = [...kept.list, ...seen.list]
    const request = turnRequest(e.text, list, seen.lastRequest ?? kept.lastRequest ?? undefined)
    // Changes left by a turn whose end never arrived ride into this one rather than vanish.
    // A key pasted into the request is masked before it reaches a note (the remembered prompts stay as they entered, to match turns by).
    await update($, live, prior => ({
      ...(prior ?? emptyLive('', '')),
      turnId: e.turnId,
      prompt: e.text !== '' ? redactText(request).text : (prior?.prompt ?? ''),
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
        await collect($, cfg, changeOf({ path: r.filePath, root, tool: 'Edit', kind: 'update', hunks: r.structuredPatch }))
      } else if (e.tool === 'Write' && 'content' in ran.result) {
        const r = ran.result
        if (r.staged || (await isBookkeeping($, r.filePath))) return ran
        const kind = r.type === 'create' ? 'create' : 'update'
        if (kind === 'update' && r.structuredPatch.length === 0 && r.originalFile === r.content) return ran
        // An update with no patch (too large, or the diff timed out) still shows, marked as having no diff.
        const hunks: Hunk[] =
          r.structuredPatch.length > 0 ? r.structuredPatch : kind === 'create' ? [creationHunk(r.content)] : []
        await collect($, cfg, changeOf({ path: r.filePath, root, tool: 'Write', kind, hunks }))
      }
    } catch (error) {
      $.ui.log(`learn-notes: 바뀐 코드를 잡지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
    return ran
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    // A command that may write gets the files it names read first, for when the engine gives no diff of its own.
    const before = WRITES.test(e.command) && !isGitMove(e.command) ? await readTargets($, e.command) : undefined
    const ran = await next(e)
    await collectShell($, cfg, 'Bash', e.command, ran, before)
    return ran
  })

  // Claude Code on Windows runs commands with its PowerShell tool (always without Git Bash). Not every
  // build names it, so it is matched by name here. Its many ways to write a file (aliases, .NET calls)
  // are not worth guessing at: every command gets the files it names read first.
  on('tool.call', async ($, e, next) => {
    if ((e.tool as string) !== 'PowerShell') return next(e)
    const input: unknown = e
    const command = isRecord(input) && typeof input.command === 'string' ? input.command : ''
    const before = command !== '' && !isGitMove(command) ? await readTargets($, command) : undefined
    const ran = await next(e)
    await collectShell($, cfg, 'PowerShell', command, ran, before)
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
    // A turn that changed only files left out (a .env, a lock file) makes no note.
    if (turn && turn.changes.length > 0) {
      const at = await $.clock.now()
      const day = stamp(at).day
      const withheld = turn.withheld ?? []
      // No model call by itself for spaces and line breaks alone, nor past the day's limit: w writes the note all the same.
      const skip = turn.changes.every(isFormatOnly) ? 'format' : cfg.isAutoNote && (await isOverLimit($, cfg, day)) ? 'limit' : undefined
      const isAuto = cfg.isAutoNote && skip === undefined
      const note: LearnNote = {
        id: `${e.turnId}-${at}`,
        turnId: e.turnId,
        at,
        prompt: turn.prompt,
        answer: cut(redactText(e.answer).text, 2000),
        changes: turn.changes,
        moreFiles: turn.dropped.length + turn.unlisted,
        ...(withheld.length > 0 ? { withheld } : {}),
        status: isAuto ? 'writing' : 'off',
        ...(skip ? { skip } : {}),
        text: '',
        savedAs: null,
        isPast: false,
        concepts: [],
        root: await $.session.root(),
        updatedAt: at,
      }
      await update($, notes, list => [...list, note].slice(-NOTES_KEPT))
      // Counted toward the day's limit from now, before its call is made.
      if (isAuto) autoPending.add(note.id)
      if (isAuto && isInteractive) {
        $.clock.after(1, () => void writeNote($, cfg, note.id, { isAuto: true }))
      } else if (isAuto) {
        // A -p run's process ends with its turn: the note is written before the turn is handed on,
        // or it never lands. The model call does not count against this hook's time.
        await writeNote($, cfg, note.id, { isAuto: true })
      } else if (cfg.isAutoSave) {
        await save($, cfg, note, false)
      }
      if (skip === 'limit' && (await isFirstLimitToast($, day))) {
        $.ui.toast(`학습 노트: 오늘 자동 노트 한도(${cfg.dailyAutoNotes}개)에 닿았습니다 · 패널에서 w를 누르면 씁니다`, { timeoutMs: 8000 })
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

  // Every reply goes into the conversation the model reads: masked as the record tool's answers are (see toolText),
  // since a note, a concept or a quiz kept before 1.6.0 was never masked. Registered first, so it holds the reply
  // of the hook below; masking twice changes nothing.
  on('command.run', { command: 'learn' }, async ($, e, next) => {
    const out = await next(e)
    return out.text === undefined ? out : { ...out, text: redactText(out.text).text }
  })

  on('command.run', { command: 'learn' }, async ($, e) => {
    const words = e.args.trim()
    const said = (words.split(/\s+/)[0] ?? '').toLowerCase()
    const arg = COMMAND_WORDS[said] ?? said
    const rest = words.slice(said.length).trim()
    const list = await read($, notes)
    if (arg === 'help') return { text: commandHelp() }
    if (arg === 'find') {
      if (rest === '') return { text: '쓰는 법: /learn 찾기 찾을 말 (요청 · 노트 내용 · 파일 이름 · 개념 이름에서 찾습니다)' }
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
    if (arg === 'quiz') return { text: await quizCommand($, cfg, rest) }
    // Today's review at once: the pane opens on the quiz holding the keys (its answer field), as the pane's q.
    if (arg === 'review') {
      // 시작 · 계속 · 해 줘 after it ask for the same review: never an answer to grade.
      const ask = QUIZ_SHOW.test(rest) || REVIEW_PLEASE.test(rest) ? '' : rest
      const index = await read($, concepts)
      // Asked from Remote Control or a chat channel, the pane is on a screen nobody there sees: the quiz comes in the reply.
      if (ask !== '' || Object.keys(index).length === 0 || isAwayOrigin(e.origin) || (await isCloudSession($))) return { text: await quizCommand($, cfg, ask) }
      const current = await lastQuiz($)
      const today = todayReview(index, await read($, activity), await $.clock.now())
      // Nothing due (or today's share done) and nothing left to answer: the quiz view, with no new quiz asked unbidden.
      if (today.left === 0 && !(current?.items.some(item => item.result === undefined) ?? false)) {
        await update($, autoOpened, () => true)
        await update($, view, () => 'quiz')
        const shown = await $.ui.open({ id: PANE, title: TITLE })
        const why = today.due > 0 ? `오늘 몫(하루 ${DAILY_REVIEW}문제)을 마쳤습니다 · 남은 개념은 내일 나옵니다` : '지금 복습할 개념이 없습니다'
        return { text: `${why} · 더 풀려면 ${shown.isPlaced ? '패널에서 s, 또는 ' : ''}/learn 퀴즈 새로` }
      }
      await update($, autoOpened, () => true)
      const opened = await $.ui.open({ id: PANE, title: TITLE, focus: true })
      if (!opened.isPlaced) return { text: await quizCommand($, cfg, '') }
      await reviewNow($, cfg)
      return { text: '학습 노트 패널에서 오늘 복습을 엽니다 · 답을 적고 Enter로 채점받고, Esc로 대화로 돌아갑니다.' }
    }
    if (arg === 'know' || arg === 'unknow') {
      const toKnown = arg === 'know'
      // Names may hold spaces: one concept per comma.
      const names = rest
        .split(/[,，、]/)
        .map(name => name.trim())
        .filter(name => name !== '')
      if (names.length === 0) return { text: KNOW_USAGE }
      return { text: knownReply(await markKnownStored($, cfg, names, toKnown), toKnown) }
    }
    if (arg === 'anki') {
      const bank = cleanBank(await $.store.get(BANK_KEY).catch(() => undefined))
      const out = ankiText(bank, await read($, concepts))
      if (out.questions + out.concepts === 0) return { text: '내보낼 카드가 없습니다. 노트가 쓰여 개념이 쌓이거나 퀴즈를 받으면 카드가 생깁니다.' }
      const path = `${(await journalDir($, cfg)).replace(/[\\/]+$/, '')}/${ANKI_FILE}`
      try {
        await $.fs.write(path, out.text)
      } catch (error) {
        $.ui.log(`learn-notes: Anki 파일을 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
        return { text: `Anki 파일을 쓰지 못했습니다 (${path}). 폴더에 쓸 수 있는지 확인하거나 /config에서 저장 폴더(saveDir)를 바꾸세요.` }
      }
      return {
        text: [
          `Anki 카드 ${out.questions + out.concepts}장을 썼습니다 (퀴즈 문제 ${out.questions} · 개념 ${out.concepts}): ${path}`,
          '',
          'Anki(데스크톱)에서 파일 → 가져오기로 이 파일을 고르면 learn-notes 덱에 들어갑니다. 휴대폰 AnkiDroid·AnkiMobile은 동기화하면 같이 보입니다.',
          '다시 내보내 가져와도 앞면(문제·개념 이름)이 같은 카드는 새로 늘지 않고 고쳐집니다.',
        ].join('\n'),
      }
    }
    // One record since 1.6.0: the run of days and the concepts learned together (stats · concepts · 기록 · 개념 · 통계).
    if (arg === 'stats' || arg === 'concepts') return { text: await recordText($, cfg) }
    if (arg === 'report') return { text: await reportCommand($, cfg, rest, isAwayOrigin(e.origin)) }
    if (arg === 'ask') {
      if (rest === '') return { text: ASK_USAGE }
      const wanted = await read($, selectedId)
      const note = list.find(one => one.id === wanted) ?? list.at(-1)
      if (!note) return { text: '물어볼 노트가 없습니다. 코딩을 요청해 노트가 생기면 /learn 질문 뒤에 물을 말을 적어 물어보세요.' }
      const asked = await askNote($, cfg, note.id, rest)
      if ('error' in asked) return { text: asked.error }
      const now = await $.clock.now()
      const which = `${when(note.at, now)} 노트${note.prompt === '' ? '' : ` (${cut(note.prompt.replace(/\s+/g, ' '), 40)})`}`
      const where = note.status === 'ready' ? ' · 패널의 노트 아래에도 남습니다' : ''
      return { text: `${which}에 대한 답${asked.path ? ' · 일지에 남김' : ''}${where}\n\n${asked.answer}` }
    }
    if (arg === 'recap') {
      const now = await $.clock.now()
      const range = recapRange(rest, now)
      if (!range) return { text: '쓰는 법: /learn 정리 (오늘 · 어제 · 이번주 · 최근 7일 · 2026-10-03)' }
      const root = await $.session.root()
      const index = await read($, concepts)
      const map = await currentAliases($)
      // The journal holds every note of those days; the pane and the store keep only the latest few.
      const written = await journalEntriesFor($, cfg, range.days)
      // A journal written before 1.4.0 holds a request's first line only, a newer one the whole request on one line.
      const flat = (request: string) => request.replace(/\s+/g, ' ').trim().slice(0, 40)
      const isWritten = (note: LearnNote) => {
        const { day, time } = stamp(note.at)
        const mine = flat(note.prompt === '' ? '(없음)' : note.prompt)
        return written.some(entry => entry.day === day && entry.time === time && (mine.startsWith(flat(entry.request)) || flat(entry.request).startsWith(mine)))
      }
      const kept = (await allNotes($)).filter(note => (note.root || root) === root)
      const unwritten = kept
        .filter(note => note.at >= range.from && note.at < range.to)
        .filter(note => !isWritten(note))
        .map(note => noteEntry(note, index, map))
      const chosen = [...written, ...unwritten]
      if (chosen.length === 0) return { text: `${range.label}의 노트가 이 프로젝트에 없습니다.` }
      const isPartial = written.length === 0 && kept.length >= HISTORY_PER_PROJECT && Math.min(...kept.map(note => note.at)) > range.from
      const lastDay = chosen.map(entry => entry.day).sort().at(-1)!
      const asked = await askModel($, cfg, { system: RECAP_SYSTEM, prompt: recapPrompt(range, chosen, index, map, cfg.level, isPartial), maxTokens: 1200 })
      if ('error' in asked) return { text: `정리를 쓰지 못했습니다: ${asked.error}` }
      const text = cut(asked.text, 6000)
      const path = cfg.isAutoSave ? await saveRecap($, cfg, root, range, text, now, lastDay) : undefined
      const partial = isPartial ? ' · 일지가 없어 남아 있는 최근 노트만 봤습니다' : ''
      return { text: `${range.label} 정리 · 노트 ${chosen.length}개${partial}${path ? ' · 일지에 남김' : ''}\n\n${text}` }
    }
    if (arg === 'day' || arg === 'days') {
      const days = await journalDays($, cfg)
      const dir = await journalDir($, cfg)
      const listed = () =>
        days.length === 0
          ? `이 프로젝트의 일지가 아직 없습니다 (${dir}). 노트가 쓰이면 날짜별로 쌓입니다.`
          : `이 프로젝트의 일지 ${days.length}일 · 최근 순\n\n${days
              .slice(0, 14)
              .map(one => `- ${one.day}${one.parts.length > 1 ? ` (파일 ${one.parts.length}개)` : ''}`)
              .join('\n')}\n\n/learn 일지 날짜로 그날의 목차를 봅니다.`
      if (arg === 'days' || /^(목록|list)$/i.test(rest)) return { text: listed() }
      const now = await $.clock.now()
      const year = stamp(now).day.slice(0, 4)
      const isToday = rest === '' || rest === '오늘' || rest.toLowerCase() === 'today'
      let day = isToday ? stamp(now).day : rest === '어제' || rest.toLowerCase() === 'yesterday' ? dayBefore(now) : rest
      // A month and day alone (10-02, as the other days' line names them): the latest such day with a journal, else this year's.
      const md = /^(\d{1,2})-(\d{1,2})$/.exec(day)
      if (md) {
        const tail = `${md[1]!.padStart(2, '0')}-${md[2]!.padStart(2, '0')}`
        day = days.find(one => one.day.slice(5) === tail)?.day ?? `${year}-${tail}`
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { text: '쓰는 법: /learn 일지 2026-10-03 (또는 오늘 · 어제 · 10-03) · /learn 일지 목록: 일지가 있는 날짜' }
      const found = days.find(one => one.day === day)
      // No journal today yet: the days there are, rather than a dead end.
      if (!found) return { text: rest === '' ? `오늘 일지는 아직 없습니다.\n\n${listed()}` : `${day}의 일지가 없습니다. /learn 일지 목록으로 있는 날짜를 봅니다.` }
      const index = []
      for (const path of found.parts) index.push(...journalIndex(await $.fs.read(path).catch(() => '')))
      const lines = index
        .slice(0, DAY_LINES)
        .map(one => `- ${one.time} · ${one.request || '(요청 없음)'}${one.summary ? ` — ${one.summary}` : ''}${one.isRewrite ? ' (다시 씀)' : ''}`)
      const more = index.length > DAY_LINES ? `\n\n그 밖에 ${index.length - DAY_LINES}개는 일지 파일에 있습니다.` : ''
      // The latest few other days, this year's by month and day: the way to the next one is in the reply.
      const short = (one: string) => (one.slice(0, 4) === year ? one.slice(5) : one)
      const others = days
        .slice(0, 6)
        .filter(one => one.day !== day)
        .slice(0, 5)
        .map(one => short(one.day))
      const elsewhere = others.length > 0 ? `\n\n다른 날: ${others.join(' · ')} · /learn 일지 ${others[0]}` : ''
      const files = found.parts.length > 1 ? ` (일지 파일 ${found.parts.length}개)` : ''
      return { text: `${day} 노트 ${index.length}개${files}\n\n${lines.join('\n')}${more}${elsewhere}` }
    }
    if (arg === 'last') {
      const last = list.at(-1)
      return { text: last ? noteAsText(last) : EMPTY_TEXT }
    }
    if (arg === 'clear') {
      // Asked once more first: the pane's notes do not come back.
      if (!/^(확인|yes|y)$/i.test(rest)) {
        return {
          text:
            list.length === 0
              ? '패널에 비울 노트가 없습니다.'
              : `이 프로젝트의 노트 ${list.length}개를 패널에서 비웁니다(일지 파일과 개념 모음은 그대로). 정말 비우려면 /learn 비우기 확인`,
        }
      }
      await update($, notes, () => [])
      await update($, selectedId, () => null)
      await persist($, true)
      return { text: '이 프로젝트의 학습 노트를 비웠습니다. 다음 세션에도 다시 나오지 않습니다. 일지 파일과 배운 개념 모음은 그대로입니다.' }
    }
    // Retired in 1.6.0: a note is saved by itself, and one the journal refused goes in with the next that works.
    if (arg === 'save') {
      return {
        text: cfg.isAutoSave
          ? `노트는 저절로 저장됩니다: ${await journalDir($, cfg)}. 파일에 쓰지 못한 노트는 다음 노트를 저장할 때 함께 저장됩니다.`
          : SAVE_OFF,
      }
    }
    if (arg !== '') return { text: `모르는 하위 명령입니다: '${said}'.\n\n${SHORT_HELP}` }
    await update($, autoOpened, () => true)
    // The keys stay in the prompt: what is typed next is a request, never one of the pane's keys (w · e · r call the model).
    // ctrl+x tab or a click hands them to the pane; /learn 복습 opens it holding them.
    const hasKeys = list.length > 0 || Object.keys(await read($, concepts)).length > 0
    const opened = await $.ui.open({ id: PANE, title: TITLE })
    const last = list.at(-1)
    if (opened.isPlaced && (await isCloudSession($))) {
      // Placed on the cloud computer's own terminal, which nobody sees: say so, and show the note here.
      return {
        text: `이 세션은 클라우드 컴퓨터에서 돌아, 패널이 지금 보는 화면에 뜨지 않을 수 있습니다. 마지막 노트를 여기에 적습니다 (/learn 마지막으로 언제든 다시 봅니다).\n\n${last ? noteAsText(last) : EMPTY_TEXT}`,
      }
    }
    const root = await $.session.root()
    const hint = isSystemFolder(root) ? `\n\n${systemFolderHint(root)}` : ''
    if (opened.isPlaced && !hasKeys) return { text: `학습 노트 패널을 열었습니다 · Claude에게 파일을 만들거나 고쳐 달라고 하면, 턴이 끝난 뒤 여기에 노트가 생깁니다.${hint}` }
    if (opened.isPlaced) {
      const left = todayReview(await read($, concepts), await read($, activity), await $.clock.now()).left
      const review = left > 0 ? ` · 오늘 복습 ${left}개: /learn 복습` : ''
      return { text: `학습 노트 패널을 열었습니다 · 패널의 키를 쓰려면 ctrl+x tab(또는 패널 클릭)${review}${hint}` }
    }
    $.ui.log(`learn-notes: 패널을 열지 못했습니다 (${opened.reason})`, { to: 'debug' })
    return {
      text: `이 화면에는 패널을 띄울 수 없어 마지막 노트를 여기에 적습니다. 터미널을 전체 화면(/tui fullscreen)으로 쓰면 오른쪽에 패널이 붙습니다.\n\n${last ? noteAsText(last) : EMPTY_TEXT}`,
    }
  })

  // The person's own moves of the pane's window, counted so an answer arriving later does not pull them away (revealInPane).
  on('ui.scroll', { requestId: PANE }, ($, e, next) => {
    if (e.origin.kind === 'person') personScrolls += 1
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const el = $.ui.resolve(e)
    const { Box, Text, Button } = el
    const list = await read($, notes)
    const running = await read($, live)
    const wanted = await read($, selectedId)
    const mode = viewOf(await read($, view))
    const index = await read($, concepts)
    const map = await read($, aliases)
    const now = await $.clock.now()
    const isDock = e.props.placement === 'dock'
    const hasConcepts = Object.keys(index).length > 0
    const days = await read($, activity)
    const stats = statsOf(days, now)
    const current = await read($, quiz)
    // Today's review, and the concepts the quiz on show graduated.
    const today = todayReview(index, days, now)
    const review = { ...today, graduated: graduatedIn(current?.items ?? [], index, map), done: reviewDoneText(today, days, now) }
    const run = await read($, quizRun)
    const asks = await read($, askRun)

    const at = shownAt(list, wanted)
    const note = list[at]
    // Before the first note, a note's own view (전/후) shows the note view's welcome.
    const shown: LearnView = note || isWhole(mode) ? mode : 'note'

    // Past today's limit (dailyAutoNotes) the turn's end writes no note: the live line promises none.
    const willWrite = cfg.isAutoNote && !isLimitReached(cfg, stamp(now).day)
    const liveBlock = running && running.changes.length > 0 ? liveView(running, isDock, willWrite, el) : null
    const root = await $.session.root()
    const systemHint = isSystemFolder(root) ? (
      <Text color="yellow" wrap="wrap">
        {systemFolderHint(root)}
      </Text>
    ) : null
    // The terminal's pane takes the keys from /learn 복습, a click or ctrl+x tab; Esc gives them back to the prompt.
    const isTerminalFocus = e.surface === 'terminal' && e.props.isFocused === true
    // The quiz view with an answer field to type in: the keys go there first (autoFocus), in either input mode.
    const asked = current ? current.items.findIndex(item => item.result === undefined) : -1
    const isAnswering = shown === 'quiz' && current !== null && asked !== -1 && isOpen(current, current.items[asked]!) && 'Input' in el && run.checking !== asked
    const keysHint =
      e.surface === 'terminal' ? (
        <Text dimColor wrap="wrap">
          {isAnswering ? (e.props.isFocused ? ANSWER_FOCUSED_HINT : ANSWER_KEYS_HINT) : e.props.isFocused ? FOCUSED_HINT : KEYS_HINT}
        </Text>
      ) : null
    // q is for the review not on show: the quiz view offers it too once its quiz is all graded (as the status line's
    // view /learn opens on, kept from before), not while a question waits for its answer or a quiz is made.
    const isReviewOn = shown === 'quiz' && (run.isMaking || (current?.items.some(item => item.result === undefined) ?? false))
    const strip = viewStrip($, cfg, shown, note !== undefined, isReviewOn ? 0 : review.left, el)

    if (!note) {
      // The team file read for this project, if any: its notes will follow its rules and terms.
      const rules = await teamHere($)
      // No note in this project yet: concepts learned elsewhere, and a quiz on them, are still one key away.
      const welcome = (
        <Box flexDirection="column" marginTop={hasConcepts ? 1 : 0}>
          <Text bold>아직 학습 노트가 없습니다</Text>
          <Text wrap="wrap">
            Claude에게 파일을 만들거나 고쳐 달라고 요청해 보세요. 턴이 끝나면 무엇이 왜 바뀌었고 무엇을 배울 수 있는지 노트로 정리해
            여기에 보여 줍니다.
          </Text>
          <Text dimColor wrap="wrap">
            예: "hello.js에 이름을 받아 인사하는 함수를 만들어 줘"
          </Text>
          {hasConcepts && (
            <Text dimColor wrap="wrap">
              지금까지 배운 개념 {Object.keys(index).length}개가 있습니다 · 3으로 보기 · 4로 퀴즈
            </Text>
          )}
          {rules && (
            <Text dimColor wrap="wrap">
              {teamText(rules)}
            </Text>
          )}
        </Box>
      )
      return (
        <Box flexDirection="column">
          {systemHint}
          {liveBlock}
          {hasConcepts && strip}
          {hasConcepts && keysHint}
          {hasConcepts && shown !== 'note' ? (
            <Box marginTop={1} flexDirection="column">
              {shown === 'quiz' ? quizView($, cfg, current, run, hasConcepts, now, review, list, isTerminalFocus, el) : conceptsView($, index, map, list, now, cfg.isAutoSave, stats, review.left, el)}
            </Box>
          ) : (
            welcome
          )}
        </Box>
      )
    }

    const isBusy = inFlight.has(note.id)
    const totalAdded = note.changes.reduce((sum, c) => sum + c.added, 0)
    const totalRemoved = note.changes.reduce((sum, c) => sum + c.removed, 0)
    const fileCount = note.changes.length + note.moreFiles
    const withheld = note.withheld ?? []
    const redacted = note.changes.reduce((sum, c) => sum + (c.redacted ?? 0), 0)
    const writeLabel = isBusy ? '쓰는 중…' : note.status === 'off' ? '노트 쓰기' : '다시 쓰기'
    // Above the code, the note's own words on what the change does differently.
    const summary = note.status === 'ready' ? changeSection(note.text) : undefined

    const body =
      shown === 'quiz' ? (
        quizView($, cfg, current, run, hasConcepts, now, review, list, isTerminalFocus, el)
      ) : shown === 'concepts' ? (
        conceptsView($, index, map, list, now, cfg.isAutoSave, stats, review.left, el)
      ) : shown === 'note' ? (
        <Box flexDirection="column">
          {noteBody(note, isBusy, offText(note, cfg, now), el)}
          {note.status === 'ready' && note.concepts.length > 0 && conceptLine(note, index, map, el)}
          {note.status === 'ready' && noteTools($, cfg, note, writeLabel, asks[note.id] ?? { isAsking: false, error: null, draft: null }, el)}
        </Box>
      ) : (
        <Box flexDirection="column">
          {summary && (
            <Box flexDirection="column" marginBottom={1}>
              {changeItems(summary.items, el)}
            </Box>
          )}
          <Text dimColor wrap="wrap">
            바뀐 줄은 −·+로, 그 줄에서 바뀐 낱말은 굵게 표시합니다
          </Text>
          {note.changes.map(change => (
            <Box key={`file-${change.path}`} flexDirection="column" marginTop={1}>
              <Text bold wrap="truncate-start">
                {change.file}
              </Text>
              <Text dimColor>
                {kindText(change.kind)} · +{change.added} −{change.removed}
                {change.isCut && change.diff !== '' ? ' · 길어서 앞부분만' : ''}
              </Text>
              {change.diff === '' ? <Text dimColor>(파일이 커서 바뀐 곳을 만들지 못했습니다)</Text> : splitView(change, el)}
            </Box>
          ))}
          {note.moreFiles > 0 && (
            <Box marginTop={1}>
              <Text dimColor>그 밖에 파일 {note.moreFiles}개 (너무 많아 생략)</Text>
            </Box>
          )}
          {withheld.length > 0 && (
            <Box marginTop={1}>
              <Text dimColor wrap="wrap">
                노트에서 뺀 파일: {withheldText(withheld)}
              </Text>
            </Box>
          )}
        </Box>
      )

    return (
      <Box flexDirection="column">
        {systemHint}
        {liveBlock}
        {!isWhole(shown) && (
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
        {/* On a line of its own: the header's end is cut in a narrow pane, and this is what keeps code out of the note. */}
        {!isWhole(shown) && (withheld.length > 0 || redacted > 0) && (
          <Text dimColor wrap="wrap">
            {[withheld.length > 0 ? `노트에서 뺀 파일 ${withheld.length}개` : '', redacted > 0 ? `비밀값 ${redacted}곳 가림` : ''].filter(part => part !== '').join(' · ')}
          </Text>
        )}
        {!isWhole(shown) && (
          <Box flexWrap="wrap" columnGap={2}>
            <Button key="prev" hotkey="p" plain label="◀ 이전" onPress={() => stepNote($, -1)} />
            <Button key="next" hotkey="n" plain label="다음 ▶" onPress={() => stepNote($, 1)} />
            {/* A written note is rewritten from the row under it, dim: up here w is for a note still to write. */}
            {note.status !== 'ready' && (
              <Button
                key="write"
                hotkey="w"
                plain
                dimColor={isBusy}
                label={writeLabel}
                onPress={() => void writeNote($, cfg, note.id, { isRewrite: note.savedAs !== null })}
              />
            )}
          </Box>
        )}
        {!isWhole(shown) && (
          <Text dimColor wrap="truncate-end">
            요청: {note.prompt === '' ? '(없음)' : note.prompt.replace(/\s+/g, ' ')}
          </Text>
        )}
        {strip}
        {keysHint}
        <Box marginTop={1} flexDirection="column">
          {body}
        </Box>
      </Box>
    )
  })
}

/**
 * The views in one row on keys 1 to 4 (a digit is the same in a Korean input
 * mode), the one shown in bold and underlined: 노트 · 전/후 · 개념 모음 · 퀴즈,
 * or before the first note 노트 · 개념 모음 · 퀴즈 on the same numbers. While
 * today's review has questions `left` (0 while a quiz is answered or made in
 * the quiz view), q starts it. 4 puts the keys in the answer field shown.
 */
function viewStrip($: EngineInterface, cfg: Config, mode: LearnView, hasNote: boolean, left: number, el: ElementTable) {
  const { Box, Text, Button } = el
  const order: readonly LearnView[] = hasNote ? VIEWS : ['note', 'concepts', 'quiz']
  const items = order.map(one => {
    const n = String(VIEWS.indexOf(one) + 1)
    if (one === mode) {
      return (
        <Text key={`at-${one}`} bold underline>
          {n}: {VIEW_LABEL[one]}
        </Text>
      )
    }
    const go =
      one === 'quiz'
        ? () => showQuiz($)
        : async () => {
            await disarm($)
            await update($, view, () => one)
          }
    return <Button key={`view-${one}`} hotkey={n} plain label={VIEW_LABEL[one]} onPress={go} />
  })
  const joined = items.flatMap((item, i) =>
    i > 0
      ? [
          <Text key={`sep-${i}`} dimColor>
            ·
          </Text>,
          item,
        ]
      : [item],
  )
  return (
    <Box flexWrap="wrap" columnGap={1}>
      {joined}
      {/* A Button draws no colour of its own: the yellow mark beside it says the review is waiting. */}
      {left > 0 && (
        <Text key="review-mark" color="yellow">
          ●
        </Text>
      )}
      {left > 0 && <Button key="review" hotkey="q" plain label={`복습 ${left}개`} onPress={() => reviewNow($, cfg)} />}
    </Box>
  )
}

/**
 * The pane's q: today's review at once. The quiz view, and a new quiz on the
 * concepts due unless one is still being answered, whose next question's
 * field then holds the keys.
 */
async function reviewNow($: EngineInterface, cfg: Config): Promise<void> {
  await update($, view, () => 'quiz')
  const current = await lastQuiz($)
  // A question whose answer was seen still waits for o or x: kept, as s keeps it.
  if (!current || !current.items.some(item => item.result === undefined)) {
    void startQuiz($, cfg)
    return
  }
  focusShown($, current)
}

/**
 * The pane's 4: the quiz view, and as after q the keys in the answer field of
 * the question it shows, so the answer is typed at once (in either input mode)
 * and no letter of it presses one of the quiz's buttons.
 */
async function showQuiz($: EngineInterface): Promise<void> {
  await update($, view, () => 'quiz')
  const current = await lastQuiz($)
  if (current) focusShown($, current)
}

/**
 * The quiz view's s: a new quiz. While questions of the one on show are still
 * to grade, the first press only asks (the notice under the button), and the
 * second makes it: one s typed by mistake drops no question.
 */
async function pressNew($: EngineInterface, cfg: Config): Promise<void> {
  const current = await lastQuiz($)
  const isLeft = current?.items.some(item => item.result === undefined) ?? false
  if (current && isLeft && (await read($, quizRun)).armedNew !== current.at) {
    await update($, quizRun, run => ({ ...run, armedNew: current.at }))
    return
  }
  await startQuiz($, cfg)
}

/** The keys to the answer field of the question the quiz view shows (the first not graded), while it is still to answer. */
function focusShown($: EngineInterface, current: Quiz): void {
  const at = current.items.findIndex(item => item.result === undefined)
  if (at !== -1 && isOpen(current, current.items[at]!)) focusInPane($, quizFieldKey(current.at, at))
}

/**
 * Under a written note, what to do with it: a quiz on its concepts (t), the
 * note explained again in plainer words under it, the note kept (e), its code
 * followed step by step on one example (r), a question about it (i, the field
 * below), and last and dim the note written again (w), with the latest
 * questions and their answers.
 */
function noteTools($: EngineInterface, cfg: Config, note: LearnNote, writeLabel: string, ask: LearnAskRun, el: ElementTable) {
  const { Box, Text, Button, Markdown } = el
  // The mobile app draws no text field yet: there a question goes through /learn ask.
  const Input = 'Input' in el ? el.Input : undefined
  const fieldKey = `ask-${note.id}`
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexWrap="wrap" columnGap={2}>
        <Text dimColor>이 노트로</Text>
        {note.concepts.length > 0 && (
          <Button
            key="note-quiz"
            hotkey="t"
            plain
            label="이 노트 퀴즈"
            onPress={async () => {
              await update($, view, () => 'quiz')
              void startQuiz($, cfg, note)
            }}
          />
        )}
        <Button
          key="easier"
          hotkey="e"
          plain
          dimColor={ask.isAsking}
          label={EASIER_LABEL}
          onPress={() => void askInPane($, cfg, note.id, EASIER_QUESTION, EASIER_LABEL, 'beginner')}
        />
        <Button key="trace" hotkey="r" plain dimColor={ask.isAsking} label={TRACE_LABEL} onPress={() => void askInPane($, cfg, note.id, TRACE_QUESTION, TRACE_LABEL)} />
        {Input && (
          <Button key="ask-type" hotkey="i" plain label="질문하기" onPress={() => void $.ui.focus({ requestId: PANE, key: fieldKey }).catch(() => undefined)} />
        )}
        <Button key="write" hotkey="w" plain dimColor label={writeLabel} onPress={() => void writeNote($, cfg, note.id, { isRewrite: note.savedAs !== null })} />
      </Box>
      {(note.asks ?? []).map((one, i, all) => ({ one, key: askedKey(note.id, all, i) })).slice(-2).map(({ one, key }) => (
        <Box key={key} flexDirection="column" marginTop={1}>
          <Text color="cyan" wrap="wrap">
            {KEYED_LABELS.includes(one.question) ? `▶ ${one.question}` : `질문 · ${one.question}`}
          </Text>
          <Markdown text={one.answer} />
        </Box>
      ))}
      {ask.isAsking ? (
        <Text color="cyan">답을 쓰는 중입니다…</Text>
      ) : Input ? (
        <Input
          key={fieldKey}
          label="질문"
          placeholder="궁금한 것을 적고 Enter"
          submitLabel="묻기"
          value={ask.draft ?? ''}
          onSubmit={value => void askInPane($, cfg, note.id, value)}
        />
      ) : null}
      {ask.error !== null && (
        <Box key={askErrorKey(note.id)}>
          <Text color="red" wrap="wrap">
            {ask.error}
          </Text>
        </Box>
      )}
    </Box>
  )
}

/** What the running turn has changed so far: a list where the pane is docked, one line inline. */
function liveView(running: LearnLive, isDock: boolean, isAutoNote: boolean, el: ElementTable) {
  const { Box, Text } = el
  const count = running.changes.length + running.dropped.length + running.unlisted
  const tail = isAutoNote ? ' · 턴이 끝나면 노트를 씁니다' : ''
  if (!isDock) {
    const names = running.changes.slice(0, 3).map(change => baseName(change.file))
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
          {shortPath(change.file)} +{change.added} −{change.removed}
        </Text>
      ))}
    </Box>
  )
}

/**
 * A note as written, its "무엇이 바뀌었나" drawn as 전 / 후 / 예 lines in the
 * before/after view's colours when the note has them in that shape.
 */
function noteBody(note: LearnNote, isBusy: boolean, off: string, el: ElementTable) {
  const { Box, Text, Markdown } = el
  if (note.status === 'ready') {
    const section = changeSection(note.text)
    if (!section) return <Markdown text={note.text} />
    return (
      <Box flexDirection="column">
        {section.head !== '' && <Markdown text={section.head} />}
        <Box flexDirection="column" marginTop={section.head !== '' ? 1 : 0}>
          <Text bold>무엇이 바뀌었나</Text>
          {changeItems(section.items, el)}
        </Box>
        {section.tail !== '' && (
          <Box marginTop={1}>
            <Markdown text={section.tail} />
          </Box>
        )}
      </Box>
    )
  }
  if (note.status === 'writing' && isBusy) return <Text color="cyan">노트를 쓰는 중입니다…</Text>
  if (note.status === 'writing') return <Text color="yellow">노트를 쓰다 멈췄습니다 · w로 다시 쓰기</Text>
  if (note.status === 'failed') return <Text color="red">노트를 쓰지 못했습니다: {note.text}</Text>
  if (note.skip === 'limit') return <Text color="yellow" wrap="wrap">{off}</Text>
  return (
    <Text dimColor wrap="wrap">
      {off}
    </Text>
  )
}

/**
 * Why a note was not written by itself, as the pane says it: only spaces and
 * line breaks changed, the day's limit was reached (today's limit named), or
 * automatic notes are off.
 */
function offText(note: LearnNote, cfg: Config, now: number): string {
  if (note.skip === 'format') return '띄어쓰기·줄바꿈만 바뀌어 노트를 쓰지 않았습니다 · w로 쓰기'
  if (note.skip === 'limit') {
    if (stamp(note.at).day !== stamp(now).day) return '그날 자동 노트 한도에 닿아 노트를 쓰지 않았습니다 · w를 누르면 씁니다'
    return `오늘 자동 노트 한도${cfg.dailyAutoNotes > 0 ? `(${cfg.dailyAutoNotes}개)` : ''}에 닿았습니다 · w를 누르면 씁니다`
  }
  return '자동 노트가 꺼져 있습니다. w로 노트를 쓰거나 2로 전/후 코드를 보세요.'
}

const ITEM_MARK: Record<ChangeItem['kind'], { mark: string; color?: string }> = {
  before: { mark: '− 전', color: 'red' },
  after: { mark: '+ 후', color: 'green' },
  example: { mark: '→ 예', color: 'cyan' },
  file: { mark: '' },
  text: { mark: '' },
}

/** A note's 전 / 후 / 예 lines, each label in the before/after view's colour, a file name over the lines about it. */
function changeItems(items: readonly ChangeItem[], el: ElementTable) {
  const { Box, Text, Markdown } = el
  return items.map((item, i) => {
    if (item.kind === 'file') {
      return (
        <Box key={`item-${i}`} marginTop={i > 0 ? 1 : 0}>
          <Text bold wrap="truncate-start">
            {item.text}
          </Text>
        </Box>
      )
    }
    if (item.kind === 'text') return <Markdown key={`item-${i}`} text={item.text} />
    const { mark, color } = ITEM_MARK[item.kind]
    return (
      <Box key={`item-${i}`} flexDirection="row">
        <Box flexShrink={0}>
          <Text color={color}>{mark} </Text>
        </Box>
        <Box flexGrow={1} flexShrink={1}>
          <Markdown text={item.text} />
        </Box>
      </Box>
    )
  })
}

function lineRange(start: number, count: number): string {
  if (count <= 0) return '없음'
  return count === 1 ? `${start}행` : `${start}~${start + count - 1}행`
}

type Spot = { hunk: Hunk } & ReturnType<typeof sideBySide>

/** A change's spots as the before/after view draws them, by diff text: worked out once, not on every redraw. */
const spotsByDiff = new Map<string, Spot[]>()
const SPOTS_KEPT = 64

function spotsOf(diff: string): Spot[] {
  const known = spotsByDiff.get(diff)
  if (known) return known
  const spots = parseDiff(diff).map(whole => {
    const hunk = focus(whole, 1)
    return { hunk, ...sideBySide(hunk) }
  })
  if (spotsByDiff.size >= SPOTS_KEPT) spotsByDiff.delete(spotsByDiff.keys().next().value!)
  spotsByDiff.set(diff, spots)
  return spots
}

/** Each changed spot as "전" then "후", with one line around it, numbered as in the file. */
function splitView(change: LearnChange, el: ElementTable) {
  const { Box, Text } = el
  const spots = spotsOf(change.diff)
  const last = Math.max(0, ...spots.flatMap(({ before, after }) => [...before, ...after].map(line => line.n)))
  const width = String(last).length
  return (
    <Box flexDirection="column">
      {spots.map(({ hunk, before, after }, i) => (
        <Box key={`hunk-${i}`} flexDirection="column" marginTop={i > 0 ? 1 : 0}>
          <Text color="red">− 전 · {lineRange(hunk.oldStart, hunk.oldLines)}</Text>
          {before.length === 0 ? <Text dimColor>  (없음: 새로 추가된 부분)</Text> : sideLines(change, before, 'red', width, el)}
          <Text color="green">+ 후 · {lineRange(hunk.newStart, hunk.newLines)}</Text>
          {after.length === 0 ? <Text dimColor>  (없음: 지워진 부분)</Text> : sideLines(change, after, 'green', width, el)}
        </Box>
      ))}
    </Box>
  )
}

/** Code shown as text: a tab as two spaces, so the columns hold. */
const shownText = (text: string) => text.replace(/\t/g, '  ')

/**
 * One side of a changed spot. All of it new or all of it gone (a file made or
 * deleted) is plain highlighted code; otherwise line by line, the unchanged
 * lines dim, a changed one marked − or + and the words that differ in bold.
 */
function sideLines(change: LearnChange, lines: readonly ShownLine[], color: 'red' | 'green', width: number, el: ElementTable) {
  const { Box, Text, Code } = el
  if (lines.every(line => line.kind === 'whole')) {
    return <Code source={lines.map(line => line.parts.map(part => part.text).join('')).join('\n')} path={change.path} startLine={lines[0]!.n} />
  }
  return lines.map((line, k) => (
    <Box key={`${color === 'red' ? 'before' : 'after'}-${k}`} flexDirection="row">
      <Box flexShrink={0}>
        <Text dimColor>{String(line.n).padStart(width)} </Text>
        {line.kind === 'same' ? <Text> </Text> : <Text color={color}>{color === 'red' ? '−' : '+'}</Text>}
        <Text> </Text>
      </Box>
      <Box flexGrow={1} flexShrink={1}>
        {line.kind === 'same' ? (
          <Text dimColor wrap="wrap">
            {shownText(line.parts.map(part => part.text).join(''))}
          </Text>
        ) : line.kind === 'whole' ? (
          <Text color={color} wrap="wrap">
            {shownText(line.parts.map(part => part.text).join(''))}
          </Text>
        ) : (
          <Text wrap="wrap">
            {line.parts.map((part, p) =>
              part.isChanged ? (
                <Text key={`part-${p}`} color={color} bold>
                  {shownText(part.text)}
                </Text>
              ) : (
                shownText(part.text)
              ),
            )}
          </Text>
        )}
      </Box>
    </Box>
  ))
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
          <Text color="cyan">다시 만난 개념</Text>
          <Text dimColor> {again.map(one => `${one.name} ×${one.count}`).join(' · ')}</Text>
        </Text>
      )}
    </Box>
  )
}

/** Shows one note in the note view; the newest means "follow". */
async function openNote($: EngineInterface, id: string): Promise<void> {
  const list = await read($, notes)
  await update($, selectedId, () => (list.at(-1)?.id === id ? null : id))
  await update($, view, () => 'note')
}

/** The quiz's n under a question answered wrong: the note that taught its concept, while the pane holds it. */
async function openTaughtNote($: EngineInterface, id: string): Promise<void> {
  if ((await read($, notes)).some(note => note.id === id)) await openNote($, id)
  else $.ui.log(`learn-notes: 이 개념을 배운 노트(${id})가 패널에 없어 열지 않았습니다`, { to: 'debug' })
}

/** Where the concepts beyond the list are: concepts.md when it is kept, else how to have it kept. */
function moreConceptsText(count: number, isAutoSave: boolean): string {
  return isAutoSave ? `그 밖에 ${count}개는 일지 폴더의 concepts.md에 있습니다` : `그 밖에 ${count}개 · /config에서 autoSave를 켜면 concepts.md에 모두 저장됩니다`
}

/** Concepts /learn 기록 lists at most: its reply goes into the conversation the model reads. */
const RECORD_CONCEPTS = 20

/**
 * /learn 기록 (stats and concepts in one): the run of days, the last seven
 * days, the month's quiz answers, the concepts due (the missed ones said so),
 * the week's notes day by day on one line, then the concepts learned but the
 * known ones (the most met first), those folded into a line, and what the
 * plugin's model calls came to. `isForTool`: for the record's tool, the
 * concepts without what they are (see conceptForTool).
 */
async function recordText($: EngineInterface, cfg: Config, isForTool = false): Promise<string> {
  const now = await $.clock.now()
  const record = await storedActivity($)
  const stats = statsOf(record, now)
  const index = await read($, concepts)
  const { fresh, again } = progressOf(index, now)
  const due = dueConcepts(index, now)
  const today = todayReview(index, record, now)
  const graded = stats.month.right + stats.month.wrong
  const queue = due.slice(0, 5)
  const review =
    due.length > 0
      ? `- 복습할 개념 ${due.length}개: ${queue.map(one => (isMissed(one) ? `${one.name} (퀴즈 틀림)` : one.name)).join(', ')}${due.length > queue.length ? ' …' : ''} · ${todayText(today)} · ${reviewWay(today.left)}`
      : '- 복습할 개념: 지금은 없습니다'
  // Today first, as the run of days counts back.
  const week = [...stats.days].reverse().map(({ weekday, one }) => `${weekday} ${one.notes}`)
  const total = Object.keys(index).length
  const ranked = rankConcepts(index).filter(one => !isKnown(one))
  const known = knownLine(index)
  const learned =
    total === 0
      ? ['아직 모인 개념이 없습니다. 노트가 쓰이면 "배울 개념"이 여기에 쌓입니다.']
      : [
          `지금까지 배운 개념 ${total}개 · 많이 만난 순`,
          ...ranked
            .slice(0, RECORD_CONCEPTS)
            .map(one => `- **${one.name}** ×${one.count} · 최근 ${stamp(one.lastAt).day} · ${reviewText(one, now)}${isForTool ? '' : `: ${one.blurb}`}`),
          ...(ranked.length > RECORD_CONCEPTS ? ['', `${moreConceptsText(ranked.length - RECORD_CONCEPTS, cfg.isAutoSave)}.`] : []),
          ...(known ? ['', `${known} · 되돌리기: /learn 모른다 이름`] : []),
        ]
  return [
    `학습 기록 · ${stats.streak > 0 ? `연속 ${stats.streak}일째` : '오늘 시작해 보세요'}${stats.best > stats.streak ? ` (가장 길게 ${stats.best}일)` : ''}${stats.streak > 0 && !stats.isTodayActive ? ' · 오늘도 하면 이어집니다' : ''}`,
    '',
    `- 최근 7일: 노트 ${stats.week.notes}개 · 새 개념 ${fresh}개 · 다시 만난 개념 ${again}개${stats.week.right + stats.week.wrong > 0 ? ` · 퀴즈 ${stats.week.right}/${stats.week.right + stats.week.wrong} 맞힘` : ''}`,
    `- 최근 30일 퀴즈 정답률: ${graded > 0 ? `${Math.round((stats.month.right / graded) * 100)}% (${stats.month.right}/${graded})` : '아직 채점한 문제가 없습니다'}`,
    review,
    `- 최근 7일 노트: ${week.join(' · ')}`,
    '',
    ...learned,
    '',
    usageLine(cleanUsage(await $.store.get(USAGE_KEY).catch(() => undefined)), now),
  ].join('\n')
}

/**
 * The read-only tool the main Claude calls when the learner asks what they
 * learned (registered at session.start, so a chat question needs no command):
 * this project's notes, every project's concepts, no model call of this
 * plugin's. Its full name is `mcp__<plugin>__<name>`.
 */
const TOOL = 'notes'
const TOOL_NAME = 'mcp__learn-notes__notes'
/** Characters one answer of the tool holds at most: it goes into the conversation. */
const TOOL_BUDGET = 4000
const TOOL_ACTIONS = ['search', 'concepts', 'due', 'recent', 'note'] as const
const TOOL_SPEC = {
  name: TOOL,
  description:
    '이 학습자의 learn-notes 학습 기록(노트·배운 개념·복습할 개념·퀴즈 결과)을 읽는다. 학습자가 자기가 배운 것을 물을 때만 쓴다. Read-only.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        enum: [...TOOL_ACTIONS],
        description:
          'search: query가 든 이 프로젝트의 노트와 모든 프로젝트의 개념 · concepts: 학습 기록(연속 학습일·퀴즈 정답률·복습할 개념·배운 개념) · due: 지금 복습할 개념 · recent: 한 기간의 이 프로젝트 노트와 그 개념 · note: 노트 하나의 전문과 그 아래 질문과 답',
      },
      query: {
        type: 'string',
        description: 'search: 찾을 말 · recent: 오늘, 어제, 이번주, 최근 7일(기본), YYYY-MM-DD · note: 찾을 말(없으면 패널에서 고른 노트, 그것도 없으면 마지막 노트)',
      },
    },
    required: ['action'],
  },
}
const TOOL_USAGE = `action은 ${TOOL_ACTIONS.join(' · ')} 중 하나입니다.`
/** Notes the tool gives in full at most in one answer; the rest go as one line each. */
const TOOL_FULL_NOTES = 2
/** True once this load registered the tool: the help says a question in the chat works only then. */
let hasTool = false

/**
 * A concept as the tool lists it: its name, how often met and where its review
 * stands. What it is stays out: a note's model wrote that from a repository's
 * team file too, and the concepts of every project go to the main Claude here
 * with no dialog; this project's notes say it in full (search, recent, note).
 */
function conceptForTool(one: LearnConcept, now: number): string {
  const state = isKnown(one) ? '아는 개념' : reviewText(one, now)
  return `- **${one.name}** ×${one.count} · ${state}`
}

/** A note as the tool gives it in full: when, the request, the note, then the questions asked under it. */
function noteForTool(note: LearnNote, now: number): string {
  const request = note.prompt === '' ? '(없음)' : cut(note.prompt.replace(/\s+/g, ' '), 300)
  const asks = (note.asks ?? []).map(one => `- ${KEYED_LABELS.includes(one.question) ? one.question : `질문 · ${one.question}`}\n  답: ${cut(one.answer.replace(/\s+/g, ' '), 600)}`)
  return [`## ${when(note.at, now)} 노트`, `요청: ${request}`, '', noteAsText(note), ...(asks.length > 0 ? ['', '노트 아래에서 나눈 질문과 답', ...asks] : [])].join('\n')
}

/**
 * The tool's answer to one call (see TOOL_SPEC): plain text, TOOL_BUDGET
 * characters at most, whole lists first and notes in full last, so a cut
 * takes the end of a note and never a line of the lists. Its secrets are
 * masked before the cut (so no piece of one is left), as on every way to a
 * model: a note, a question or a concept kept before 1.6.0 was never masked.
 */
async function toolText($: EngineInterface, cfg: Config, action: string, query: string): Promise<string> {
  const now = await $.clock.now()
  const root = (await read($, paneRoot)) ?? (await $.session.root())
  // Notes of the project in use only (a note in the pane may carry no root); concepts cross projects.
  const mine = (await allNotes($)).filter(note => (note.root || root) === root).sort((a, b) => b.at - a.at)
  const index = await read($, concepts)
  const aliases = await currentAliases($)
  const full = (list: readonly LearnNote[]) => (list.length > 0 ? ['', ...list.slice(0, TOOL_FULL_NOTES).map(note => noteForTool(note, now))] : [])
  const noteLines = (list: readonly LearnNote[], most: number) => [
    ...list.slice(0, most).map(note => `- ${noteLine(note, now)}`),
    ...(list.length > most ? [`- 그 밖에 ${list.length - most}개`] : []),
  ]
  let lines: string[]
  if (action === 'search') {
    if (query === '') return '찾을 말을 query에 주세요. 요청 · 노트 내용 · 파일 이름 · 개념 이름에서 찾습니다.'
    const found = searchNotes(mine, query, aliases)
    const needle = query.toLowerCase()
    const key = resolveKey(aliases, conceptKey(query))
    const matched = rankConcepts(index).filter(one => one.key === key || one.name.toLowerCase().includes(needle) || one.blurb.toLowerCase().includes(needle))
    lines = [
      found.length > 0 ? `'${query}' · 이 프로젝트의 노트 ${found.length}개 (최근 것부터)` : `'${query}'에 맞는 노트가 이 프로젝트에 없습니다.`,
      ...noteLines(found, 10),
      ...(matched.length > 0 ? ['', `'${query}'에 맞는 개념 ${matched.length}개 (모든 프로젝트)`, ...matched.slice(0, 10).map(one => conceptForTool(one, now))] : []),
      ...full(found),
    ]
  } else if (action === 'concepts') {
    lines = [await recordText($, cfg, true)]
  } else if (action === 'due') {
    const due = dueConcepts(index, now)
    const today = todayReview(index, await storedActivity($), now)
    if (due.length === 0) {
      const next = rankConcepts(index)
        .filter(one => !isKnown(one))
        .sort((a, b) => dueAt(a) - dueAt(b))[0]
      lines = [`지금 복습할 개념이 없습니다.${next ? ` 다음 복습: ${next.name} (${dueText(next, now)})` : ''}`]
    } else {
      lines = [
        `복습할 개념 ${due.length}개 (퀴즈에서 틀린 것부터) · ${todayText(today)} · 복습하는 곳: ${reviewWay(today.left)}`,
        ...due.slice(0, RECORD_CONCEPTS).map(one => conceptForTool(one, now)),
        ...(due.length > RECORD_CONCEPTS ? [`- 그 밖에 ${due.length - RECORD_CONCEPTS}개`] : []),
      ]
    }
  } else if (action === 'recent') {
    const asked = recapRange(query === '' ? '최근 7일' : query, now)
    const range = asked ?? recapRange('최근 7일', now)!
    const within = mine.filter(note => note.at >= range.from && note.at < range.to)
    const keys = new Set(within.flatMap(note => note.concepts.map(one => resolveKey(aliases, one))))
    const taught = rankConcepts(index).filter(one => keys.has(one.key))
    lines = [
      ...(asked ? [] : [`'${query}'는 기간으로 읽지 못해 최근 7일로 봅니다.`]),
      `${range.label} · 이 프로젝트의 노트 ${within.length}개 (최근 것부터)`,
      ...noteLines(within, 15),
      ...(taught.length > 0
        ? ['', `이 노트들의 개념 ${taught.length}개`, ...taught.slice(0, 15).map(one => `${conceptForTool(one, now)}${one.firstAt >= range.from ? ' (이 기간에 처음 배움)' : ''}`)]
        : []),
      ...full(within),
    ]
  } else if (action === 'note') {
    const picked = (await read($, selectedId)) ?? undefined
    const note = query === '' ? (mine.find(one => one.id === picked) ?? mine[0]) : searchNotes(mine, query, aliases)[0]
    if (!note) return query === '' ? '이 프로젝트에는 아직 노트가 없습니다.' : `'${query}'에 맞는 노트가 이 프로젝트에 없습니다.`
    lines = [noteForTool(note, now)]
  } else {
    return TOOL_USAGE
  }
  return cut(redactText(lines.join('\n')).text, TOOL_BUDGET)
}

const REPORT_USAGE = '쓰는 법: /learn 보고서 (최근 7일 · 이번주 · 어제 · 오늘 · 2026-10-03)'

/**
 * /learn 보고서: the learning report with no code in it (reportMarkdown) for
 * the days asked, the last seven by default, with no model call. It goes on
 * the clipboard and, with autoSave on, into a file beside the journals; the
 * reply only says so. Where nothing could be copied, in a cloud session
 * (whose clipboard is a computer nobody sees) or for a person away from this
 * session's screens (`isAway`: a phone through Remote Control, a chat channel;
 * the clipboard would be the terminal's, not theirs), the reply is the report.
 */
async function reportCommand($: EngineInterface, cfg: Config, rest: string, isAway: boolean): Promise<string> {
  const now = await $.clock.now()
  const range = recapRange(rest === '' ? '최근 7일' : rest, now)
  if (!range) return REPORT_USAGE
  const text = reportMarkdown({
    range,
    activity: await storedActivity($),
    index: cleanConcepts(await $.store.get(CONCEPTS_KEY), await currentAliases($)),
    level: cfg.level,
    now,
    usage: cleanUsage(await $.store.get(USAGE_KEY).catch(() => undefined)),
  })
  let path: string | undefined
  if (cfg.isAutoSave) {
    const target = `${(await journalDir($, cfg)).replace(/[\\/]+$/, '')}/report-${range.days[0]}_${range.days.at(-1)}.md`
    try {
      await $.fs.write(target, text)
      path = target
    } catch (error) {
      $.ui.log(`learn-notes: 학습 보고서를 파일에 쓰지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
  }
  const home = await homeDir($)
  const file = path === undefined ? undefined : `파일: ${home !== undefined && isUnder(path, home) ? `~${path.slice(home.replace(/[\\/]+$/, '').length)}` : path}`
  let isCopied = false
  if (!isAway && !(await isCloudSession($))) {
    try {
      isCopied = (await $.ui.copy({ text })).isCopied
    } catch (error) {
      $.ui.log(`learn-notes: 학습 보고서를 클립보드에 복사하지 못했습니다 (${String(error)})`, { to: 'debug' })
    }
  }
  if (isCopied) return ['학습 보고서를 클립보드에 복사했습니다 · PR 설명이나 팀 채널에 붙이기 전에 한 번 읽어 보세요', ...(file ? [file] : [])].join('\n')
  return [`학습 보고서입니다 · 이 화면에서는 클립보드에 복사할 수 없어 여기에 적습니다. 붙이기 전에 한 번 읽어 보세요${file ? ` · ${file}` : ''}`, '', text].join('\n')
}

/** When a concept comes back, as a concepts list says it: never quizzed, missed, or the next review. */
function reviewText(one: LearnConcept, now: number): string {
  if (isMissed(one)) return '퀴즈 틀림'
  return one.reviewedAt === undefined ? '아직 떠올려 본 적 없음' : `다음 복습 ${dueText(one, now)}`
}

/** A day as a narrow row says it: 오늘, or the date with no time. */
function dayWhen(at: number, now: number): string {
  const a = stamp(at).day
  const n = stamp(now).day
  if (a === n) return '오늘'
  return a.slice(0, 4) === n.slice(0, 4) ? a.slice(5) : a
}

/** Names the known concepts' line shows at most: /learn 기록's reply goes into the conversation. */
const KNOWN_SHOWN = 30

/** The concepts marked known, folded into one line under a concepts list: how many, the most recently met first. */
function knownLine(index: Readonly<Record<string, LearnConcept>>): string | undefined {
  const known = Object.values(index).filter(isKnown).sort((a, b) => b.lastAt - a.lastAt)
  if (known.length === 0) return undefined
  const names = known.slice(0, KNOWN_SHOWN).map(one => one.name).join(', ')
  return `아는 개념 ${known.length}개 · ${names}${known.length > KNOWN_SHOWN ? ` 외 ${known.length - KNOWN_SHOWN}개` : ''}`
}

/**
 * Every concept the notes have taught: one head line of how many and this
 * week's progress, the ones worth a second look (q while today's review has
 * questions `left`), then all of them but the ones known, the most met first,
 * each with the notes in the pane that taught it; the known ones folded into a line.
 */
function conceptsView(
  $: EngineInterface,
  index: Readonly<Record<string, LearnConcept>>,
  map: Readonly<Record<string, string>>,
  list: readonly LearnNote[],
  now: number,
  isAutoSave: boolean,
  stats: LearnStats,
  left: number,
  el: ElementTable,
) {
  const { Box, Text, Markdown, Button } = el
  const total = Object.keys(index).length
  if (total === 0) {
    return <Text dimColor>아직 모인 개념이 없습니다. 노트가 쓰이면 "배울 개념"이 여기에 쌓입니다.</Text>
  }
  const ranked = rankConcepts(index).filter(one => !isKnown(one))
  const known = knownLine(index)
  const { fresh } = progressOf(index, now)
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
            ×{one.count} · {reviewText(one, now)} · 최근 {dayWhen(one.lastAt, now)}
            {one.reviewedAt !== undefined ? ` · 퀴즈 ${dayWhen(one.reviewedAt, now)}` : ''}
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
                label={`${when(note.at, now)} ${baseName(note.changes[0]?.file ?? '')}`.trim()}
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
      <Text wrap="wrap">
        <Text bold>배운 개념 {total}개</Text>
        <Text dimColor> · {[`최근 7일 새로 ${fresh}`, ...progressParts(stats)].join(' · ')}</Text>
      </Text>
      {queue.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow" wrap="wrap">
            복습할 개념 {due.length}개{' '}
            <Text dimColor>· 틀린 것 먼저, 잊을 때쯤 다시 나옵니다 · {left > 0 ? 'q로 복습' : '오늘 몫은 마쳤습니다 · 4로 퀴즈'}</Text>
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
      {ranked.length > 0 && (
        <Box marginTop={1}>
          <Text dimColor>모든 개념 · 여러 번 만난 순</Text>
        </Box>
      )}
      {shown.map(row)}
      {ranked.length > shown.length && <Text dimColor>{moreConceptsText(ranked.length - shown.length, isAutoSave)}</Text>}
      {known && (
        <Box marginTop={1}>
          <Text dimColor wrap="truncate-end">
            {known}
          </Text>
        </Box>
      )}
    </Box>
  )
}

/**
 * The quiz, one question at a time, each titled with its kind (예측 · 왜 ·
 * 바꿔 보기): the learner types an answer for Claude to grade (i, Enter), or
 * looks at a hint (h) or the answer (a) and grades it themselves (o, x); a
 * wrong one comes first next time. The questions already graded stay above as
 * one line each, the last one Claude graded opened up, with the note that
 * taught its concept (n) when it was wrong and the pane holds that note.
 */
function quizView(
  $: EngineInterface,
  cfg: Config,
  current: Quiz | null,
  run: LearnQuizRun,
  hasConcepts: boolean,
  now: number,
  review: { due: number; left: number; graduated: readonly string[]; done: string | undefined },
  list: readonly LearnNote[],
  isFocused: boolean,
  el: ElementTable,
) {
  const { Box, Text, Markdown, Button } = el
  // The mobile app draws no text field yet: there the answer is shown and graded by hand.
  const Input = 'Input' in el ? el.Input : undefined
  const items = current?.items ?? []
  const graded = items.filter(item => item.result !== undefined)
  const right = graded.filter(item => item.result === 'right').length
  const at = items.findIndex(item => item.result === undefined)
  // The answer graded last, when Claude graded it, stays open with its feedback until the next one is graded.
  const lastAt = graded.length === 0 ? -1 : items.indexOf(graded.reduce((a, b) => ((b.gradedAt ?? 0) >= (a.gradedAt ?? 0) ? b : a)))
  const opened = lastAt !== -1 && items[lastAt]?.verdict !== undefined ? lastAt : -1
  const fieldKey = (i: number) => quizFieldKey(current?.at ?? 0, i)
  return (
    <Box flexDirection="column">
      <Text bold wrap="truncate-end">
        {current?.from === 'note' ? '이 노트 퀴즈' : '복습 퀴즈'}
        {current && items.length > 0 && (
          <Text dimColor>
            {' '}
            · {when(current.at, now)} · {items.length}문제 중 {graded.length}개 채점
          </Text>
        )}
      </Text>
      {hasConcepts && !run.isMaking && (run.checking ?? null) === null && (
        <Box>
          <Button key="quiz-new" hotkey="s" plain label={current ? '새 문제 받기' : '퀴즈 시작'} onPress={() => void pressNew($, cfg)} />
        </Box>
      )}
      {current && run.armedNew === current.at && items.length > graded.length && !run.isMaking && (run.checking ?? null) === null && (
        <Text color="yellow" wrap="wrap">
          풀던 문제 {items.length - graded.length}개가 남았습니다 · s를 한 번 더 누르면 새 문제를 받습니다
        </Text>
      )}
      {!hasConcepts && <Text dimColor>{NO_CONCEPTS_FOR_QUIZ}</Text>}
      {hasConcepts && items.length === 0 && !run.isMaking && (
        <Text dimColor wrap="wrap">
          s를 누르면 복습할 개념으로 내 코드에서 3문제를 냅니다 · 먼저 떠올려 적어 보세요. 틀린 답을 바로잡을 때 더 오래 남습니다
        </Text>
      )}
      {run.isMaking && <Text color="cyan">문제를 만드는 중입니다…</Text>}
      {run.error !== null && (
        <Text color="red" wrap="wrap">
          {run.error}
        </Text>
      )}
      {items.map((item, i) => {
        if (item.result !== undefined) {
          const mark = <Text color={item.result === 'right' ? 'green' : item.verdict === 'partial' ? 'yellow' : 'red'}>{resultMark(item)}</Text>
          if (i !== opened) {
            return (
              <Text key={`quiz-${i}`} wrap="truncate-end">
                {mark}
                <Text dimColor>
                  {' '}
                  {i + 1}. {item.name}
                  {helpText(item)}
                </Text>
              </Text>
            )
          }
          // Answered wrong (or partly right): back to the note that taught it, where r walks its code through.
          const wrongFrom = item.result === 'wrong' ? item.noteId : undefined
          const taught = wrongFrom !== undefined && list.some(note => note.id === wrongFrom) ? wrongFrom : undefined
          const isElsewhere = wrongFrom !== undefined && taught === undefined
          return (
            <Box key={`quiz-${i}`} flexDirection="column" marginTop={1}>
              <Text wrap="truncate-end">
                {mark}
                <Text dimColor>
                  {' '}
                  {i + 1}. {item.name}
                  {helpText(item)} · 방금 채점
                </Text>
              </Text>
              <Markdown text={`**${VERDICT_TEXT[item.verdict ?? 'wrong']}** ${item.feedback ?? ''}${isTurned(item) ? ` _(내가 ${item.result === 'right' ? '맞힘' : '틀림'}으로 바꿈)_` : ''}`} />
              {item.mine !== undefined && (
                <Text dimColor wrap="wrap">
                  내 답: {item.mine}
                </Text>
              )}
              <Text color="green">정답</Text>
              <Markdown text={item.answer} />
              <Box flexWrap="wrap" columnGap={2}>
                {taught && <Button key="quiz-note" hotkey="n" plain label="이 개념을 배운 노트" onPress={() => openTaughtNote($, taught)} />}
                <Button
                  key="quiz-flip"
                  hotkey="f"
                  plain
                  dimColor
                  label={`채점 바꾸기 (${item.result === 'right' ? '틀림으로' : '맞힘으로'})`}
                  onPress={() => flipGrade($, cfg, i)}
                />
              </Box>
              {isElsewhere && (
                <Text dimColor wrap="wrap">
                  이 개념을 배운 노트는 이 패널에 없습니다 · /learn 찾기 {item.name}
                </Text>
              )}
            </Box>
          )
        }
        if (i !== at || !current) return null
        return (
          <Box key={`quiz-${i}`} flexDirection="column" marginTop={1}>
            <Text bold>
              문제 {i + 1}/{items.length}
              {item.kind !== undefined ? ` · ${KIND_LABEL[item.kind]}` : ''}
            </Text>
            <Markdown text={item.question} />
            {item.hint !== undefined && item.isHinted === true && (
              <Box flexDirection="column">
                <Text color="yellow">힌트</Text>
                <Markdown text={item.hint} />
              </Box>
            )}
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
            ) : run.checking === i ? (
              <Text color="cyan">채점하는 중입니다…</Text>
            ) : (
              <Box flexDirection="column" marginTop={1}>
                {Input && (
                  <Input
                    key={fieldKey(i)}
                    autoFocus
                    label="내 답"
                    placeholder="답을 적고 Enter"
                    submitLabel="채점받기"
                    value={run.draft && run.draft.at === current.at && run.draft.i === i ? run.draft.text : ''}
                    onSubmit={value => void checkAnswer($, cfg, i, value)}
                  />
                )}
                <Box flexWrap="wrap" columnGap={2}>
                  {Input && (
                    <Button key="quiz-type" hotkey="i" plain label="답 적기" onPress={() => void $.ui.focus({ requestId: PANE, key: fieldKey(i) }).catch(() => undefined)} />
                  )}
                  {item.hint !== undefined && item.isHinted !== true && <Button key="quiz-hint" hotkey="h" plain label="힌트" onPress={() => showHint($, i)} />}
                  <Button key="quiz-answer" hotkey="a" plain label={Input ? '정답만 보기' : '정답 보기'} onPress={() => showAnswer($, i)} />
                  {!Input && <Text dimColor>먼저 스스로 답해 보세요</Text>}
                </Box>
                {/* While the field holds the keys every letter is typed into it: how to reach the buttons. */}
                {Input && isFocused && (
                  <Text dimColor wrap="wrap">
                    답 칸에서 Enter: 채점 · Tab: 버튼으로 ({[...(item.hint !== undefined && item.isHinted !== true ? ['h 힌트'] : []), 'a 정답', '1~4 보기'].join(' · ')})
                  </Text>
                )}
              </Box>
            )}
          </Box>
        )
      })}
      {items.length > 0 && at === -1 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold wrap="wrap">
            {items.length}문제 중 {right}개 맞혔습니다
            <Text dimColor>
              {missesText(items) ? ` · ${missesText(items)}` : ''} · {review.done ?? 's로 새 문제'}
            </Text>
          </Text>
          {review.graduated.length > 0 && (
            <Text color="green" wrap="wrap">
              졸업: {review.graduated.join(' · ')}
              <Text dimColor> · 아는 개념으로 옮겨 복습에서 뺍니다</Text>
            </Text>
          )}
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
  'learn-notes 명령',
  '',
  '- `/learn`: 패널 열기 · 패널의 키를 쓰려면 `ctrl+x tab`(또는 패널 클릭), Esc로 대화로 돌아갑니다 (숫자 키는 한/영 상관없이, 글자 키는 영문 상태에서. 한글 상태면 `q`가 `ㅂ`으로 들어갑니다)',
  '- `/learn 복습`: 오늘 복습을 패널 퀴즈로 바로 시작 · 답 칸에 바로 적고 Enter (패널이 없는 화면에서는 대화창에 문제를 냅니다)',
  '- 패널: `1` 노트 · `2` 전/후 · `3` 개념 모음 · `4` 퀴즈 · `q` 오늘 복습 바로 시작 · `p`·`n` 이전·다음 노트 · `w` 노트 쓰기, 다시 쓰기',
  '- 노트 아래: `t` 이 노트 퀴즈 · `e` 더 쉽게 · `r` 예시로 따라가기 · `i` 질문하기',
  '- 퀴즈(`4`): 답을 적고 Enter로 채점 · 답 칸에서 Tab으로 버튼에 가서 `h` 힌트 · `a` 정답 보기 · `o`·`x` 맞힘·틀림 · `f` 채점 바꾸기 · `s` 새 문제(풀던 문제가 남았으면 두 번) · `n` 틀린 개념을 배운 노트',
  '- `/learn 퀴즈`: 대화창에서 풀기 · 풀던 퀴즈, 없으면 복습할 개념으로 새 퀴즈 (내 코드의 결과를 맞히거나 바꿔 봅니다) · `/learn 퀴즈 내 답`: Claude에게 채점받기 · `새로` · `힌트`(`힌트 2`) · `정답`',
  '- `/learn 정리`: 오늘 배운 것 정리 (`어제` · `이번주` · `최근 7일` · `2026-10-03`도 됩니다)',
  '- `/learn 질문 …`: 패널에서 고른 노트(없으면 마지막 노트)에 대해 묻기',
  '- `/learn 기록`: 연속 학습일 · 정답률 · 복습할 개념 · 배운 개념 · 모델 호출 수',
  '- `/learn 보고서`: 코드 없는 학습 보고서를 클립보드와 파일로 (최근 7일 · `이번주` · `어제`도 됩니다)',
  '- `/learn 찾기 말`: 지난 노트 찾기 · `/learn 일지`: 오늘 노트 목차 (`어제` · `2026-10-03` · `목록`도 됩니다)',
  '- 가끔: `/learn 마지막` 마지막 노트 · `/learn 합치기 A = B` 개념 합치기 · `/learn 안다 이름` 복습에서 빼기 · `/learn 모른다 이름` 되돌리기 · `/learn 안키` Anki 카드 · `/learn 비우기` 패널 비우기',
].join('\n')
/** Said at the top of the help while the learning record tool is there (hasTool): the record answers a plain question. */
const CHAT_HINT = '대화창에 그냥 물어봐도 됩니다: "오늘 배운 거 알려 줘"'

/** /learn 도움말: HELP, with CHAT_HINT under its title while the tool is registered. */
function commandHelp(): string {
  if (!hasTool) return HELP
  const [title, ...rest] = HELP.split('\n')
  return [title, CHAT_HINT, ...rest].join('\n')
}
/** What an unknown subcommand gets: the few most used, and where the rest are. */
const SHORT_HELP = '자주 쓰는 것: `/learn` 패널 · `/learn 복습` · `/learn 퀴즈` · `/learn 정리` · `/learn 질문 …` · `/learn 기록` · 전체는 `/learn 도움말`'
/**
 * Korean words for the subcommands, so `/learn 퀴즈` works as `/learn quiz` does. Some are kept
 * out of the help: 날짜 (days), 저장 (save, retired), 개념 and 통계 (the record, as 기록).
 */
const COMMAND_WORDS: Record<string, string> = {
  도움말: 'help',
  도움: 'help',
  퀴즈: 'quiz',
  복습: 'review',
  문제: 'quiz',
  개념: 'stats',
  정리: 'recap',
  요약: 'recap',
  기록: 'stats',
  통계: 'stats',
  보고서: 'report',
  보고: 'report',
  질문: 'ask',
  묻기: 'ask',
  찾기: 'find',
  검색: 'find',
  일지: 'day',
  날짜: 'days',
  마지막: 'last',
  합치기: 'merge',
  안다: 'know',
  모른다: 'unknow',
  저장: 'save',
  비우기: 'clear',
  안키: 'anki',
}
/** What /learn save answers with autoSave off, now that a note is saved by itself. */
const SAVE_OFF = '노트는 저절로 저장됩니다. 파일로 남기려면 /config에서 learn-notes.autoSave(노트를 마크다운 파일로 자동 저장)를 켜세요.'
/** Lines /learn day prints at most: the reply goes into the conversation the model reads. */
const DAY_LINES = 40
const QUIZ_USAGE = '쓰는 법: /learn 퀴즈 (풀던 문제 · 없으면 새 문제) · /learn 퀴즈 내 답 (또는 2 내 답) · 힌트 (힌트 2) · 정답 · 새로 · 맞음 1 · 틀림 2'
const ASK_USAGE = '쓰는 법: /learn 질문 물을 말 (예: /learn 질문 왜 let 대신 const를 썼어?) · 패널에서 고른 노트(없으면 마지막 노트)에 대해 답합니다'
const NO_QUIZ = '아직 낸 퀴즈가 없습니다. /learn 퀴즈로 먼저 문제를 받으세요.'
const KNOW_USAGE =
  '쓰는 법: /learn 안다 개념 이름 (쉼표로 여럿, 예: /learn 안다 const 선언, 화살표 함수) · 되돌리기: /learn 모른다 개념 이름 · 아는 개념은 복습과 퀴즈에서 빠집니다'
const MERGE_USAGE =
  '쓰는 법: /learn 합치기 합칠 개념 = 남길 개념  (예: /learn 합치기 Destructuring = 구조 분해 할당 · = 대신 => -> → | 도 됩니다 · 거꾸로 하면 되돌립니다)'
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
          : note.skip === 'format'
            ? '(띄어쓰기·줄바꿈만 바뀌어 노트를 쓰지 않았습니다 · 패널에서 w로 쓰기)'
            : note.skip === 'limit'
              ? '(하루 자동 노트 한도에 닿아 노트를 쓰지 않았습니다 · 패널에서 w로 쓰기)'
              : '(자동 노트가 꺼져 있습니다)'
  const withheld = (note.withheld ?? []).length > 0 ? `\n\n노트에서 뺀 파일: ${withheldText(note.withheld ?? [])}` : ''
  return `**${stamp(note.at).time} · ${files}${more}**${withheld}\n\n${body}`
}
