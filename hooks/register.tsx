import { atom, read, update } from 'claude-code'
import type { ElementConstructor, ElementTable, EngineInterface, HookFailure, InputProps, ModelUsage, Register, RenderSurface, UiOpenResult } from 'claude-code'

import type {
  LearnAsk,
  LearnAskRun,
  LearnChange,
  LearnConcept,
  LearnDayActivity,
  LearnDayUsage,
  LearnDrill,
  LearnDrillRun,
  LearnLive,
  LearnNote,
  LearnQuizFirstTry,
  LearnQuizItem,
  LearnQuizMarks,
  LearnQuizRun,
  LearnSlip,
  LearnSubmit,
  LearnView,
  LearnWithheld,
} from '../types'
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
  markFor,
  markHelped,
  markPartial,
  markWrong,
  marksOf,
  bankQuestion,
  isWorkedNext,
  pickForRung,
  rungOf,
  RUNG_LABEL,
  WORKED_NEXT,
  regrade,
  type Mark,
  type QuizPick,
  checkPrompt,
  parseCheck,
  isBlankAnswer,
  SLIP_TEXT,
  slipTypeOf,
  cleanSlips,
  cutCells,
  fitSlips,
  nextSlip,
  openSlip,
  slipsToAsk,
  slipAt,
  slipChange,
  slipNotice,
  slipRecordOf,
  type SlipChange,
  type SlipNotice,
  keptNudge,
  secondVerdict,
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
  type TeamTerm,
  type TeamCode,
  type TeamWay,
  NO_TEAM_TERMS,
  TEAM_NUDGED_KEPT,
  cleanNudged,
  cleanTeamTerms,
  isTeamTerm,
  isTermDoc,
  teamAddedText,
  teamCodeHead,
  teamCodeLabel,
  teamLeftText,
  teamNudgeText,
  teamPracticeText,
  teamMetText,
  teamRecordLine,
  teamSlots,
  quizStartText,
  termBlurb,
  termKey,
  distinctTerms,
  termLines,
  termSource,
  unmetTerms,
  withTeamTerm,
  rootTag,
  isRootTag,
  isVcsPath,
  isTermSecretFile,
  redactLines,
  isConfigFile,
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
  knownMarks,
  recallMarks,
  recallSteps,
  stepMarks,
  storedConcept,
  storedConcepts,
  withKnownMarks,
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
  fixEscapedTicks,
  expandHome,
  fitHistory,
  filesFor,
  forHistory,
  isGitMove,
  isRequestOrigin,
  isAwayOrigin,
  failureText,
  type ModelFail,
  noteFailText,
  isResumable,
  isLeftWriting,
  LEFT_MS,
  quotaOver,
  quotaWhy,
  type QuotaKind,
  retryText,
  RETRY_JITTER_MS,
  RETRY_MS,
  type Transient,
  transientOf,
  transientFail,
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
  addFault,
  appName,
  checkLine,
  cleanFaults,
  diagText,
  type DiagInput,
  type Fault,
  type FaultArea,
  faultCode,
  faultWord,
  faultsOk,
  faultsOkSince,
  fileWhy,
  fitFaults,
  jsonBytes,
  mergeFaults,
  modelCode,
  saveFailText,
  storeFailText,
  BEHIND_STUCK,
  BEHIND_TAIL,
  STAMP_EVERY_MS,
  STORE_SCHEMA,
  cleanStamps,
  compareVersions,
  isSchemaAhead,
  logParts,
  newerBuild,
  newerText,
  otherStamps,
  shareText,
  withStamp,
  DRILL_EMPTY,
  DRILL_HEAD,
  DRILL_HINT,
  DRILL_KOREAN,
  DRILL_UNCHANGED,
  type Drill,
  drillOf,
  drillQuestion,
  drillSection,
  drillStateOf,
  drillTryHead,
  drillVerdictText,
  fitDrill,
  hideDrillAnswer,
  inlineCode,
  isDrillOver,
  isKoreanTyped,
  sameLine,
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
/**
 * The two lines in the quiz view while a question waits in its answer field, which takes the keys first: the answer
 * may be typed in either input mode, the buttons a Tab away still need the English one for their letter keys.
 */
const ANSWER_KEYS_HINT = 'ctrl+x tab: 답 칸으로 · 보기를 바꾸려면 그 뒤 Tab · 글자 키는 영문 상태에서'
const ANSWER_FOCUSED_HINT = 'Esc: 대화로 돌아가기 · 답은 한/영 상관없이, 버튼의 글자 키는 영문 상태에서'

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
const newerSaid = atom({ plugin: 'learn-notes', key: 'newerSaid' } as const, null)
const slips = atom({ plugin: 'learn-notes', key: 'slips' } as const, {})
const teamTerms = atom({ plugin: 'learn-notes', key: 'teamTerms' } as const, {})
const drillRun = atom({ plugin: 'learn-notes', key: 'drillRun' } as const, { open: null, checking: null, notice: null })

/**
 * `$.store` keys: notes per project for the next session (HISTORY_PER_PROJECT a project, HISTORY_MAX_BYTES in all;
 * since 1.7.0 a note may hold its practice's result, LearnDrill, 1KB at most), the concept index, merges and the last quiz.
 */
const HISTORY_KEY = 'history'
const CONCEPTS_KEY = 'concepts'
const ALIASES_KEY = 'aliases'
/**
 * The last /learn quiz, so its answers are there in the next session too. Since 1.7.0 a question may hold its first
 * try short of right (firstTry: the answer, feedback and question asked back, written cut to 1500, 600 and 300
 * characters), the slip it asks again (isRetry, slip, slipBefore) and, for a team term, its repository's tag, the
 * words its grade puts in the index (TERM_SEED_TEXT) and the lines it was asked from (teamCode: a path and a range,
 * never the code).
 */
const QUIZ_KEY = 'quiz'
/** What each merge folded away, so merging back splits the two again: merged-away key → its record. */
const MERGES_KEY = 'merges'
/**
 * Each day's notes and graded answers, for the run of days and the week's progress; since 1.7.0 also the practices
 * (t) graded that day (`drills`), counted with its answers but not in today's review share.
 */
const ACTIVITY_KEY = 'activity'
/** Every question a quiz asked (the newest 300), for /learn anki. */
const BANK_KEY = 'quizBank'
/** The Anki import file /learn anki writes, in the journal folder. */
const ANKI_FILE = 'learn-notes-anki.txt'
/** Each day's model calls and tokens (see LearnDayUsage), for the daily limit, /learn 기록 and /learn 보고서. */
const USAGE_KEY = 'usage'
/** The last day the daily limit's toast showed, in any session: it shows once a day. */
const LIMIT_TOAST_KEY = 'limitToast'
/**
 * The last day the toast that an automatic note yielded to the account's limit showed (1.7.0), in any session:
 * once a day, as the daily limit's. One `YYYY-MM-DD`.
 */
const QUOTA_TOAST_KEY = 'quotaToast'
/** Set once a new install's first session said hello (welcome), or one found notes or concepts there already. */
const WELCOMED_KEY = 'welcomed'
/**
 * The concepts' known marks by key (knownMarks), equal to the index's at every index write (written when they differ):
 * a 1.5 session still open writes the index without them.
 */
const KNOWN_KEY = 'known'
/**
 * When a session of 1.6.0 or later first started on this store: a quiz step
 * given before it (one a merge record or a graded question keeps) is 1.5's,
 * begun at the notes that met the concept (recallMarks), and the usage record
 * began then (uncountedDays). The index's own steps go by STEPS_KEY.
 */
const STEPS_FROM_KEY = 'stepsFrom'
/**
 * The steps past the first 1.6.0 gave, by key (stepMarks), equal to the
 * index's at every index write (written when they differ): any other step the
 * index holds is 1.5's, a 1.5 session still open having given it since the
 * update too (recallSteps).
 */
const STEPS_KEY = 'steps'
/**
 * What failed lately and how (FaultRecord: the last 7 days' faults as classification codes, 4KB at most),
 * for /learn 진단, and the day the session-start check line last showed. Written at most once a minute.
 */
const FAULTS_KEY = 'faults'
/**
 * Each session's build, by session id: `{ v, at }`, its version and when it last said so (SessionStamp), 8 at most
 * and a day old at most (cleanStamps), under 1KB. Written at session start and with the notes' history at most every
 * 10 minutes: a window still running an older build learns a newer one is open (newerBuild), and /learn 진단 names them.
 */
const SESSIONS_KEY = 'sessions'
/**
 * The store's layout number, a whole number (STORE_SCHEMA, 3 since 1.7.0), only ever raised: a session of an older
 * build that finds it newer leaves the concept index, its known marks and steps, the merges and the quiz bank alone
 * (isStoreAhead), so it never writes them back in a layout the newer build no longer reads.
 */
const SCHEMA_KEY = 'schema'
/**
 * What the learner got wrong in quizzes (1.7.0), by concept key (LearnSlip: the slip a typed answer showed, its kind,
 * the question and answer cut short and masked, when and how often, and when mended): SLIPS_KEPT at most and
 * SLIPS_MAX_BYTES of JSON (fitSlips), a mended one let go 60 days on (cleanSlips). Apart from the concept index, so a
 * 1.6 session that writes the index leaves it; read through the merges, and written after reading the store's again
 * (several sessions write it), never while the schema guard is on. Not in the journal, concepts.md, Anki, the report
 * or the learning record tool.
 */
const SLIPS_KEY = 'slips'
/**
 * The concepts that came in as a repository's team terms (1.7.0 D6), by concept key: the repositories' tags (rootTag,
 * 5 at most), whose quizzes ask the term by the team's code. TEAM_TERMS_KEPT keys and TEAM_TERMS_MAX_BYTES (24KB) of
 * JSON at most, the first written going first (fitTeamTerms). Apart from the concept index, so its shape stays 1.6's;
 * read through the merges, written after reading the store's again when a team term's grade puts it in the index,
 * never while the schema guard is on.
 */
const TEAM_TERMS_KEY = 'teamTerms'
/**
 * The repositories (rootTag) whose team-term toast showed (1.7.0 D6): once per repository, TEAM_NUDGED_KEPT (50) at
 * most, the latest last (cleanNudged). Written as the toast shows.
 */
const TEAM_NUDGED_KEY = 'teamNudged'
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
/** The day each once-a-day toast last showed here, by its store key (LIMIT_TOAST_KEY, QUOTA_TOAST_KEY): the store keeps it for every session. */
const toastDays = new Map<string, string>()
/**
 * The timer of each automatic note's one try again in this load (see LearnNote.retry): a w meanwhile cancels it,
 * and a reload cancels them all (that note is then taken up by the next load's session start, resumeNotes).
 */
const retryTimers = new Map<string, { cancel: () => void }>()
/**
 * Notes a reload left being written that this load writes again (resumeNotes), until that write is over: the pane
 * says so while its call runs, and not while the same note's try again runs later.
 */
const resuming = new Set<string>()
/**
 * The account's window past its mark (QUOTA_YIELD) as the last turn's end read it, or undefined: the live line
 * promises no note while it is set, as the turn's end will write none by itself.
 */
let quotaHeld: QuotaKind | undefined
/** The project's team file as last read (TEAM_FILE), with its stamp: read again only once that changes. */
let team: { path: string; mtimeMs: number; size: number; parsed: TeamFile } | null = null
/** True once this load's session start showed the welcome toast: the team-term toast then waits for another session (1.7.0 D6). */
let isWelcomedNow = false
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
/** This build's version, read from its plugin.json at session start (/learn 도움말, /learn 진단); undefined until then, or when unreadable. */
let myVersion: string | undefined
/** This session's id, read at session start: the key of its stamp (SESSIONS_KEY); undefined when it cannot be read. */
let mySessionId: string | undefined
/** True once the store's layout is newer than this build's (SCHEMA_KEY): the concepts are left alone until a reload (isStoreAhead). */
let isBehind = false
/** When this session last wrote its stamp (SESSIONS_KEY), and last read the others': each at most every STAMP_EVERY_MS. */
let stampedAt = Number.NEGATIVE_INFINITY
let lookedAt = Number.NEGATIVE_INFINITY
/**
 * The pane as last drawn, for /learn 진단: where the surface seated it and how wide. Kept in the module, since a
 * render hook may not write state.
 */
let lastDraw: { placement: 'dock' | 'inline'; columns: number } | undefined
/** The terminal as the spinner was last drawn on it: its width, and whether it is fullscreen. */
let lastViewport: { columns: number; isFullscreen: boolean } | undefined
/** This load's faults (see fault), the newest last: /learn 진단 reads them with the store's. */
let faults: readonly Fault[] = []
/**
 * When each area's work first went through in this load (faultOk): a fault the store kept from before then (an
 * earlier session's, or this one's before a reload) is marked gone through too, in the store and in /learn 진단.
 */
const okAt = new Map<string, number>()
/** True while the store lacks what this load knows: a fault, or that one went through. */
let isFaultsDirty = false
/** True while among it is a fault the store has not had yet: that one is written at once, unless a write was just made. */
let isFaultsUrgent = false
/** The pending write of the faults to the store. */
let faultTimer: { cancel: () => void } | undefined
/** Writes of the faults queued or under way: one that ends looks again for what came meanwhile. */
let faultFlushes = 0
/** When the store was last asked to take the faults: the next write waits until a minute after it. */
let faultsWrittenAt = Number.NEGATIVE_INFINITY
/**
 * The faults go to the store once a minute at most: a new fault at once if none went in the last minute (a reload,
 * which a toast's `/config의 saveDir를 바꿔 주세요` brings, ends the module and its timers with no word), what
 * follows it a minute after, and a mark that one went through a minute later at most.
 */
const FAULT_FLUSH_MS = 60_000
/** The causes whose toast showed this session (`save:EACCES`, `store:store-full`): each once. */
const warned = new Set<string>()
/** How long a journal write a file another program holds (EBUSY, EPERM) waits before its one quiet try again. */
const SAVE_RETRY_MS = 500
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

/** A line for the debug log alone; a handler answering in a hook's place may have no `$` to log with. */
function debugLog($: EngineInterface, text: string): void {
  try {
    $.ui.log(text, { to: 'debug' })
  } catch {
    // Nowhere to say it.
  }
}

/**
 * Keeps one failure for /learn 진단 (see Fault): where (`area`) and its classification code, never the error's
 * text or a path; the debug log gets `what` with the code. A fault of the same kind within ten minutes counts on
 * the last. Written to the store at once, or with those that follow it a minute after the last write (see
 * FAULT_FLUSH_MS), and at the session's end. Resolves once it is held; never rejects.
 */
async function fault($: EngineInterface, area: FaultArea, code: string, what: string): Promise<void> {
  const word = faultWord(code)
  debugLog($, `learn-notes: ${what} (${word})`)
  try {
    const at = await $.clock.now().catch(() => Date.now())
    faults = addFault(faults, area, word, at)
    isFaultsDirty = true
    isFaultsUrgent = true
    scheduleFaults($, at)
  } catch {
    // Kept or not, the work that failed goes on as it would.
  }
}

/**
 * The work of `area` went through: its faults still open are marked so (`다시 써서 됨` in /learn 진단), this
 * load's at once and, the first time in this load, those the store kept from before (okAt).
 */
function faultOk($: EngineInterface, area: FaultArea): void {
  const next = faultsOk(faults, area)
  const isFirst = !okAt.has(area)
  if (next === faults && !isFirst) return
  faults = next
  isFaultsDirty = true
  // Held until the time is read, so a second success meanwhile does not ask again.
  if (isFirst) okAt.set(area, Number.NEGATIVE_INFINITY)
  void $.clock.now().then(
    at => {
      if (isFirst) {
        okAt.set(area, at)
        // Asked again: a write that began meanwhile read okAt before it held this time.
        isFaultsDirty = true
      }
      scheduleFaults($, at)
    },
    () => undefined,
  )
}

/**
 * Writes the faults to the store: a new fault at once when no write was asked in the last FAULT_FLUSH_MS, else
 * when that minute is up; a mark that one went through FAULT_FLUSH_MS from now. Nothing while a write is queued:
 * it looks again for what came meanwhile once it is done.
 */
function scheduleFaults($: EngineInterface, now: number): void {
  if (faultFlushes > 0) return
  // A time that could not be read waits the whole minute, so a clock that fails never spins a write after a write.
  const wait = isFaultsUrgent && Number.isFinite(now) ? faultsWrittenAt + FAULT_FLUSH_MS - now : FAULT_FLUSH_MS
  if (wait <= 0) {
    faultTimer?.cancel()
    faultTimer = undefined
    void flushFaults($)
    return
  }
  if (faultTimer !== undefined) return
  try {
    faultTimer = $.clock.after(wait, () => {
      faultTimer = undefined
      void flushFaults($)
    })
  } catch {
    faultTimer = undefined
  }
}

/**
 * Merges this load's faults into the store's (FAULTS_KEY), after any store write still running, with the store's
 * own marked gone through where this load's same work went through after them (okAt); `noticeDay` keeps the day
 * the session-start check line showed. Nothing is written when the store holds that already. A store that refuses
 * it says so in the debug log alone: that failure is not kept as a fault, or it would ask for this write again.
 */
function flushFaults($: EngineInterface, noticeDay?: string): Promise<void> {
  faultFlushes += 1
  return enqueue('storing', async () => {
    let now = faultsWrittenAt
    try {
      if (!isFaultsDirty && noticeDay === undefined) return
      const mine = faults
      isFaultsDirty = false
      isFaultsUrgent = false
      try {
        now = await $.clock.now()
        const stored = cleanFaults(await $.store.get(FAULTS_KEY), now)
        const day = noticeDay ?? stored.noticeDay
        const record = fitFaults({ list: faultsOkSince(mergeFaults(stored.list, mine, now), okAt), ...(day !== undefined ? { noticeDay: day } : {}) })
        if (JSON.stringify(record) === JSON.stringify(stored)) return
        faultsWrittenAt = now
        await $.store.set(FAULTS_KEY, record)
      } catch (error) {
        // Tried all the same: the next try waits the minute.
        faultsWrittenAt = now
        isFaultsDirty = true
        debugLog($, `learn-notes: 진단 기록을 저장소에 남기지 못했습니다 (${faultCode(error, 'store')})`)
      }
    } finally {
      faultFlushes -= 1
      if (isFaultsDirty && faultFlushes === 0) scheduleFaults($, now)
    }
  })
}

/** A failure's toast, once a session for each cause (`key`): `text` names the cause in words the learner can act on. */
function warnOnce($: EngineInterface, key: string, text: string): void {
  if (warned.has(key)) return
  warned.add(key)
  $.ui.toast(text, { timeoutMs: 8000 })
}

/**
 * A hook that threw or ran out of time, as its `.catch` keeps it: a fault (`hook:<event>`, `:timeout` after it
 * past its budget) in `area`. Re-entry is no failure: the engine asked the handler in the hook's place.
 */
function hookFailed($: EngineInterface, failure: HookFailure, area: FaultArea, event: string): void {
  // Claude Code before 2.1.302 also named a re-entry this way; later ones never raise it.
  if ((failure.kind as string) === 're-entry') return
  void fault($, area, `hook:${event}${failure.kind === 'timeout' ? ':timeout' : ''}`, `${event} 훅이 멈췄습니다`)
}

/**
 * Writes this session's stamp (SESSIONS_KEY): its build's version, now, over its own from before a reload. Nothing
 * while the version or the session's id is unknown. Run in the storing lane; a store that refuses it is a fault.
 */
async function stampNow($: EngineInterface): Promise<void> {
  if (myVersion === undefined || mySessionId === undefined) return
  try {
    const now = await $.clock.now()
    // Held before the write: a store that refuses it is not asked again at every save.
    stampedAt = now
    await $.store.set(SESSIONS_KEY, withStamp(await $.store.get(SESSIONS_KEY), mySessionId, myVersion, now))
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '버전 도장을 남기지 못했습니다')
  }
}

/**
 * At session start, in the storing lane: the store's layout number (SCHEMA_KEY) read, the schema guard turned on
 * when it is newer than this build's, else raised to this build's. Never lowered, nor written over a value it does
 * not know.
 */
async function keepSchema($: EngineInterface): Promise<void> {
  try {
    const raw = await $.store.get(SCHEMA_KEY)
    if (isSchemaAhead(raw)) isBehind = true
    else if (raw === undefined || (typeof raw === 'number' && raw < STORE_SCHEMA)) await $.store.set(SCHEMA_KEY, STORE_SCHEMA)
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '저장 구조 번호를 남기지 못했습니다')
  }
}

/**
 * The schema guard, asked before the concept index, its known marks and steps, the merges or the quiz bank are
 * written: true once the store's layout is newer than this build's. Read again each time until then (a newer build
 * may have started since), its notice said the moment it turns on. A store that cannot be read guards nothing: the
 * write that follows fails on its own.
 */
async function isStoreAhead($: EngineInterface): Promise<boolean> {
  if (isBehind) return true
  if (!isSchemaAhead(await $.store.get(SCHEMA_KEY).catch(() => undefined))) return false
  isBehind = true
  await sayNewer($)
  return true
}

/**
 * Reads the other sessions' stamps and the store's layout at most every STAMP_EVERY_MS (session start, /learn, a
 * turn's end), and says what changed (sayNewer). Never fails the caller.
 */
async function lookNewer($: EngineInterface): Promise<void> {
  try {
    const now = await $.clock.now()
    if (now - lookedAt < STAMP_EVERY_MS) return
    lookedAt = now
    if (!isBehind && isSchemaAhead(await $.store.get(SCHEMA_KEY))) isBehind = true
    await sayNewer($, now)
  } catch {
    // Looked at again in ten minutes.
  }
}

/**
 * Says in an older window, as a dim transcript line (never sent to the model) and a toast, that a newer build was
 * stamped in another window within STAMP_LIVE_MS, and that the schema guard is on (newerText). Each thing once a
 * session (newerSaid, which a reload keeps): a build newer than any said before, the guard the first time it is on.
 * A window that goes quiet and comes back, or an older build seen once the newest went quiet, is not news. None in
 * a -p run, nor while this build's version is unknown and the guard is off. Never fails the caller.
 */
async function sayNewer($: EngineInterface, at?: number): Promise<void> {
  if (!isInteractive) return
  try {
    const now = at ?? (await $.clock.now())
    const stamps = cleanStamps(await $.store.get(SESSIONS_KEY), now)
    const newer = myVersion === undefined ? undefined : newerBuild(stamps, mySessionId, myVersion, now)
    const said = await read($, newerSaid)
    // A value of another shape (a build before this one kept a string) counts as nothing said.
    const before = isRecord(said) ? said : null
    const newest = typeof before?.newest === 'string' ? before.newest : undefined
    const isNewer = newer !== undefined && (newest === undefined || compareVersions(newer, newest) > 0)
    const isGuardNew = isBehind && before?.isBehind !== true
    if (!isNewer && !isGuardNew) return
    const text = newerText(newer, myVersion, isBehind)
    if (text === undefined) return
    await update($, newerSaid, () => ({ newest: isNewer ? newer : (newest ?? null), isBehind: isBehind || before?.isBehind === true }))
    $.ui.log(text)
    $.ui.toast(text, { timeoutMs: 10_000 })
  } catch {
    // Said the next time it is looked at.
  }
}

/** What a command that would change the concept index answers while the schema guard is on, and the way on if a reload does not help. */
const BEHIND_TEXT = `learn-notes가 다른 창에서 더 새 버전으로 학습 기록을 썼습니다 · ${BEHIND_TAIL} · /reload-plugins로 바꿉니다 · ${BEHIND_STUCK}`

/**
 * A stored note read back by a newer build: the fields it may lack filled in, an unfinished one failed, one a w was
 * writing again read as it was before (its `previous`, 1.7.0).
 */
function fromHistory(raw: unknown, root: string): LearnNote | undefined {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !Array.isArray(raw.changes) || typeof raw.at !== 'number') return undefined
  const note = raw as unknown as LearnNote
  const isUnfinished = note.status === 'writing'
  const before = isUnfinished && isRecord(raw.previous) && raw.previous.status === 'ready' && typeof raw.previous.text === 'string' ? raw.previous.text : undefined
  return {
    ...note,
    prompt: typeof note.prompt === 'string' ? note.prompt : '',
    answer: typeof note.answer === 'string' ? note.answer : '',
    moreFiles: typeof note.moreFiles === 'number' ? note.moreFiles : 0,
    text: before ?? (isUnfinished ? '세션이 끝나 노트를 다 쓰지 못했습니다 · w로 다시 쓰기' : String(note.text ?? '')),
    status: before !== undefined ? 'ready' : isUnfinished ? 'failed' : note.status,
    previous: undefined,
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
    skip: raw.skip === 'format' || raw.skip === 'limit' || raw.skip === 'quota' ? raw.skip : undefined,
    quota: raw.skip === 'quota' && (raw.quota === 'five_hour' || raw.quota === 'seven_day') ? raw.quota : undefined,
    // What a load's own timers stood for (a try again, a reload's take-up): the write they waited on is over.
    retry: undefined,
    resumed: undefined,
    // Its practice as the learner left it (1.7.0); anything but one is dropped.
    drill: drillStateOf(raw.drill),
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

/** This build's version as its plugin.json (under `$.plugin.root`) gives it; undefined when it cannot be read. */
async function readVersion($: EngineInterface): Promise<string | undefined> {
  try {
    const raw: unknown = JSON.parse(String(await $.fs.read(`${$.plugin.root.replace(/[\\/]+$/, '')}/.claude-plugin/plugin.json`)))
    return isRecord(raw) && typeof raw.version === 'string' && /^\d+\.\d+\.\d+[0-9A-Za-z.+-]*$/.test(raw.version) ? raw.version : undefined
  } catch {
    return undefined
  }
}

/** True in a cloud session (Claude Code on the web, an app's cloud session): its own terminal is drawn for no one. */
async function isCloudSession($: EngineInterface): Promise<boolean> {
  return (await $.env.get('CLAUDE_CODE_REMOTE')) === 'true'
}

/** The surfaces the session draws on now, as `$.session.surfaces()` lists them; none where they cannot be read. */
async function surfacesNow($: EngineInterface): Promise<readonly RenderSurface[]> {
  return $.session.surfaces().catch(() => [] as RenderSurface[])
}

/**
 * Whether the pane `$.ui.open` answered for is drawn, waiting a moment where it may yet be seated (1.7.1): the
 * desktop app draws an asked pane just after the open resolves undrawn, so that first answer is no reason to say no
 * pane can show. So too with no surface attached yet (`no-surface`): a remote client joins the roster with its first
 * drawing. The desktop app is a host with no terminal, as a `-p` run is (`isInteractive` false for both), so that
 * wait is a `-p` run's too. The terminal answers at once.
 */
async function isPlacedSoon($: EngineInterface, opened: UiOpenResult): Promise<boolean> {
  if (opened.isPlaced) return true
  const surfaces = await surfacesNow($)
  const mayAttach = surfaces.length === 0 && opened.reason.startsWith('no-surface')
  if (!mayAttach && !surfaces.some(one => one !== 'terminal')) return false
  for (let waited = 0; waited < PLACE_WAIT_MS; waited += PLACE_STEP_MS) {
    try {
      await $.clock.sleep(PLACE_STEP_MS)
    } catch {
      return false
    }
    if ((await $.ui.panes().catch(() => [])).some(pane => pane.id === PANE && pane.isPlaced)) return true
  }
  return false
}
const PLACE_WAIT_MS = 1500
const PLACE_STEP_MS = 250

/**
 * Opens the pane for `/learn` and `/learn 복습` and says whether it is drawn (isPlacedSoon). Seated late, the keys
 * asked for (`focus`) are asked again of the drawn pane: the first ask found only an undrawn one to give them to.
 */
async function openPane($: EngineInterface, focus: boolean): Promise<boolean> {
  const args = { id: PANE, title: TITLE, ...(focus ? { focus: true as const } : {}) }
  const opened = await $.ui.open(args)
  if (opened.isPlaced) return true
  if (!(await isPlacedSoon($, opened))) return false
  if (focus) await $.ui.open(args).catch(() => undefined)
  return true
}

/**
 * The first line of `/learn` where no pane was drawn, saying what to do there (1.7.1: no terminal advice off the
 * terminal). The desktop app may seat it later still, in a cloud session too; a cloud session's notes are on the
 * cloud computer, so its commands are the way there. No surface attached even after the wait is the desktop app
 * attaching later still or a host that draws none (VS Code's extension): which, nothing says, so both are told.
 */
function noPaneText(surfaces: readonly RenderSurface[], isCloud: boolean): string {
  if (surfaces.includes('desktop')) return DESKTOP_WAIT_TEXT
  if (isCloud) {
    return `${NO_PANE_TEXT} 이 세션은 클라우드 컴퓨터에서 돌아 지금 보는 화면에는 패널이 없습니다 · 여기서는 /learn 복습 · /learn 퀴즈 1 내 답 · /learn 질문으로 대화창에서 배웁니다.`
  }
  if (surfaces.length === 0) return NO_SURFACE_TEXT
  return NO_PANE_TEXT
}
const NO_PANE_TEXT = '이 화면에는 패널을 띄울 수 없어 마지막 노트를 여기에 적습니다.'
const DESKTOP_WAIT_TEXT = '학습 노트 패널을 여는 중입니다 · 잠시 뒤 오른쪽에 뜹니다. 뜨지 않으면 /learn을 한 번 더 칩니다. 마지막 노트를 여기에도 적습니다.'
const NO_SURFACE_TEXT =
  '패널을 그리는 화면이 아직 붙지 않아 마지막 노트를 여기에 적습니다. 데스크톱 앱이면 잠시 뒤 오른쪽에 뜹니다(뜨지 않으면 /learn을 한 번 더) · VS Code 확장처럼 패널을 그리지 않는 화면이면 같은 폴더의 터미널에서 claude를 켜거나 데스크톱 앱에서 이 폴더를 연 뒤 /learn을 칩니다.'

/**
 * How the keys reach the open pane, as `/learn` says it: `ctrl+x tab` is the person's own terminal's (a cloud
 * computer's is nobody's, and one asked from afar, a phone over Remote Control, is read away from it), a click the
 * desktop app's; a phone has no keys to hand over.
 */
function paneKeysText(surfaces: readonly RenderSurface[], isCloud: boolean, isAway: boolean): string {
  if (surfaces.includes('terminal') && !isCloud && !isAway) return ' · 패널의 키를 쓰려면 ctrl+x tab(또는 패널 클릭)'
  if (surfaces.includes('desktop')) return ' · 패널을 클릭하면 키가 패널로 갑니다'
  return ''
}

/**
 * A pane a surface may still seat when `/learn` answered (the desktop app's, DESKTOP_WAIT_TEXT; any but the
 * terminal's; one before any surface attached) is a fault of the pane only if it is still undrawn a while after:
 * one seated late is no failure for /learn 진단 to show.
 */
async function faultIfStillUnplaced($: EngineInterface): Promise<void> {
  try {
    await $.clock.sleep(PLACE_LATE_MS)
  } catch {
    return
  }
  const mine = (await $.ui.panes().catch(() => [])).find(pane => pane.id === PANE)
  if (mine && !mine.isPlaced) void fault($, 'pane', 'unplaced', '패널을 열지 못했습니다')
}
const PLACE_LATE_MS = 10_000

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
 * A failure is a fault and a toast naming its cause (once a session for each),
 * never a broken turn; the note stays unsaved, and the next save that works
 * writes it too (flushUnsaved). A file another program holds (EBUSY, EPERM:
 * an antivirus scan, a sync client) is tried once more, quietly, half a second later;
 * the note's failure is kept once all the same, gone through or not.
 */
async function saveNow($: EngineInterface, cfg: Config, note: LearnNote, isRewrite: boolean): Promise<string | undefined> {
  // The first refusal of a held file, kept once the try again has told how it went.
  let held: string | undefined
  for (let tries = 1; ; tries += 1) {
    try {
      // Into the journal of the note's own project, even after a /cd.
      const root = note.root || (await $.session.root())
      const path = await appendJournal($, cfg, root, note.at, journalSection(await screened($, cfg, note), isRewrite, isStoreCut(note)))
      await setNote($, note.id, { savedAs: note.status, isUnsaved: false })
      if (held !== undefined) await fault($, 'save', held, '노트를 파일에 쓰지 못했습니다')
      faultOk($, 'save')
      // The folder takes writes again: the notes it refused before go in after this one.
      void flushUnsaved($, cfg, note.id)
      return path
    } catch (error) {
      const code = faultCode(error)
      if (tries === 1 && (code === 'EBUSY' || code === 'EPERM') && (await $.clock.sleep(SAVE_RETRY_MS).then(() => true, () => false))) {
        held = code
        continue
      }
      await fault($, 'save', code, '노트를 파일에 쓰지 못했습니다')
      await setNote($, note.id, { isUnsaved: true }).catch(() => undefined)
      warnOnce($, `save:${code}`, saveFailText(code))
      return undefined
    }
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
 * True where the pane cannot show: a cloud session with no pane another
 * surface than its own terminal seats (that screen is drawn for no one; the
 * desktop app opening the session seats one, 1.7.1), or no pane placed on a
 * screen that seats none (the terminal not fullscreen, as the spinner last
 * said; unknown counts as none). A toast there is gone in seconds with
 * nothing to open, so a written note says so in the transcript instead.
 */
async function isPaneless($: EngineInterface): Promise<boolean> {
  const isPlaced = async () => (await $.ui.panes()).some(pane => pane.id === PANE && pane.isPlaced)
  if (await isCloudSession($)) return !(await surfacesNow($)).some(one => one !== 'terminal') || !(await isPlaced())
  if (await isPlaced()) return false
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
      void fault($, 'save', faultCode(error), '질문과 답을 파일에 쓰지 못했습니다')
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
      void fault($, 'save', faultCode(error), '정리를 파일에 쓰지 못했습니다')
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
    faultOk($, 'store')
    // This session's stamp goes with the notes, at most every ten minutes: a window that writes notes is open.
    if (now - stampedAt >= STAMP_EVERY_MS) await stampNow($)
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
    const code = faultCode(error, 'store')
    void fault($, 'store', code, '노트 이력을 저장하지 못했습니다')
    warnOnce($, `store:${code}`, storeFailText(code))
  }
}

/** The notes the store keeps for `root`, past its last clear. */
async function storedNotes($: EngineInterface, root: string): Promise<LearnNote[]> {
  return notesIn(await $.store.get(HISTORY_KEY), root)
}

/** The notes the store's history `raw` (as read under HISTORY_KEY) keeps for `root`, past its last clear. */
function notesIn(raw: unknown, root: string): LearnNote[] {
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
 * Keeps when this store first had a session of 1.6.0 or later
 * (STEPS_FROM_KEY), at the first one's start; never fails the start.
 */
async function keepStepsFrom($: EngineInterface): Promise<void> {
  try {
    if (typeof (await $.store.get(STEPS_FROM_KEY)) !== 'number') await $.store.set(STEPS_FROM_KEY, await $.clock.now())
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '1.6.0을 처음 쓴 때를 남기지 못했습니다')
  }
}

/** STEPS_FROM_KEY as kept; never kept yet (a store that took no write), every step so far is 1.5's. */
async function stepsFrom($: EngineInterface): Promise<number> {
  const raw = await $.store.get(STEPS_FROM_KEY)
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : Number.POSITIVE_INFINITY
}

/**
 * The concept index read back from what the store holds under CONCEPTS_KEY
 * (`raw`), for 1.6.0: a known mark a 1.5 session dropped put back
 * (KNOWN_KEY), a step a 1.5 quiz gave read as 1 at most (STEPS_KEY).
 */
async function indexOf($: EngineInterface, raw: unknown, map: Readonly<Record<string, string>>): Promise<Record<string, LearnConcept>> {
  return recallSteps(withKnownMarks(cleanConcepts(raw, map), await $.store.get(KNOWN_KEY), map), await $.store.get(STEPS_KEY), map)
}

/** The concept index as the store has it now (indexOf). */
async function storedIndex($: EngineInterface, map: Readonly<Record<string, string>>): Promise<Record<string, LearnConcept>> {
  return indexOf($, await $.store.get(CONCEPTS_KEY), map)
}

/**
 * Writes the concept index: its known marks and steps first, apart
 * (KNOWN_KEY, STEPS_KEY), each written only when the store does not hold
 * the same already (setChanged), then the index with each name as it was
 * stored (storedConcepts), every time. Every caller asks the schema guard
 * (isStoreAhead) first.
 */
async function storeIndex($: EngineInterface, index: Readonly<Record<string, LearnConcept>>): Promise<void> {
  await setChanged($, KNOWN_KEY, knownMarks(index))
  await setChanged($, STEPS_KEY, stepMarks(index))
  await $.store.set(CONCEPTS_KEY, storedConcepts(index))
}

/**
 * `value` under `key` unless the store holds the same JSON already, read again just before: no wider a gap to
 * another window's write than writing it each time. A read that fails writes.
 */
async function setChanged($: EngineInterface, key: string, value: unknown): Promise<void> {
  const held = await $.store.get(key).then(
    raw => (raw === undefined ? undefined : JSON.stringify(raw)),
    () => undefined,
  )
  if (held !== JSON.stringify(value)) await $.store.set(key, value)
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
    if (isNew) {
      $.ui.toast(WELCOME, { timeoutMs: 8000 })
      isWelcomedNow = true
    }
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '첫 세션 안내를 남기지 못했습니다')
  }
}

/**
 * Once a day, at an interactive session's start, a dim transcript line (never sent to the model) while a problem
 * remains: this project's notes the journal has not taken yet, with the cause the last failed save gave, or a
 * store that refused a write in the last day (checkLine). The day it showed is kept with the faults. `history`: the
 * store's notes as the session start read them for this and journalLeft (one read of up to 2MB, not two); read
 * here when not given.
 */
async function checkAtStart($: EngineInterface, cfg: Config, history?: { raw: unknown }): Promise<void> {
  if (!isInteractive) return
  try {
    const now = await $.clock.now()
    const day = stamp(now).day
    const record = cleanFaults(await $.store.get(FAULTS_KEY), now)
    if (record.noticeDay === day) return
    const raw = cfg.isAutoSave ? (history ? history.raw : await $.store.get(HISTORY_KEY)) : undefined
    const unsaved = cfg.isAutoSave ? notesIn(raw, await $.session.root()).filter(one => one.isUnsaved === true).length : 0
    const open = (area: FaultArea, within: number) => record.list.filter(one => one.area === area && one.ok !== true && now - one.last < within).at(-1)?.code
    const line = checkLine(unsaved, open('save', Number.POSITIVE_INFINITY), open('store', 86_400_000))
    if (line === undefined) return
    $.ui.log(line)
    await flushFaults($, day)
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '시작 점검을 하지 못했습니다')
  }
}

/** Fills an empty pane with the notes earlier sessions left for this project, and the concept index. */
async function loadHistory($: EngineInterface): Promise<void> {
  try {
    const merged = cleanAliases(await $.store.get(ALIASES_KEY))
    if (Object.keys(merged).length > 0 && Object.keys(await read($, aliases)).length === 0) {
      await update($, aliases, () => merged)
    }
    await keepStepsFrom($)
    const index = await storedIndex($, merged)
    if (Object.keys(index).length > 0 && Object.keys(await read($, concepts)).length === 0) {
      await update($, concepts, () => index)
    }
    // The store's slips, every window's: the mirror is only ever written with what the store took.
    const kept = cleanSlips(await $.store.get(SLIPS_KEY), merged, await $.clock.now())
    if (JSON.stringify(kept) !== JSON.stringify(await read($, slips))) await update($, slips, () => kept)
    // The concepts that came in as team terms (1.7.0 D6), the same way.
    const marks = cleanTeamTerms(await $.store.get(TEAM_TERMS_KEY), merged)
    if (JSON.stringify(marks) !== JSON.stringify(await read($, teamTerms))) await update($, teamTerms, () => marks)
    const root = await $.session.root()
    const isEmpty = (await read($, notes)).length === 0
    if ((await read($, paneRoot)) === null || isEmpty) await update($, paneRoot, () => root)
    if (!isEmpty) return
    const past = await storedNotes($, root)
    if (past.length > 0) await update($, notes, list => (list.length > 0 ? list : past.slice(-NOTES_KEPT)))
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '지난 노트를 불러오지 못했습니다')
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
 * pane's mirror); a rewrite counts only what changed. Returns the note's keys,
 * counting nothing while the schema guard is on (isStoreAhead).
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
  // A newer build's index is left as it is: the note keeps its keys, the counts are that build's to make.
  if (await isStoreAhead($)) return keys
  try {
    const raw = await $.store.get(CONCEPTS_KEY)
    const index = countConcepts(
      isRecord(raw) ? await indexOf($, raw, map) : await read($, concepts),
      taught.map(({ line, ...one }) => ({ ...one, files: filesFor(line, note.changes) })),
      untaught,
      note.at,
      note.changes.map(change => change.file),
    )
    await storeIndex($, index)
    await update($, concepts, () => index)
    await remind($, cfg)
    if (cfg.isAutoSave) await saveConcepts($, cfg, index)
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '개념을 모으지 못했습니다')
  }
  return keys
}

/** Rewrites concepts.md beside the journals, after any journal save still running. */
function saveConcepts($: EngineInterface, cfg: Config, index: Record<string, LearnConcept>): Promise<unknown> {
  return enqueue('saving', async () => {
    try {
      await $.fs.write(`${(await journalDir($, cfg)).replace(/[\\/]+$/, '')}/concepts.md`, conceptsMarkdown(index))
      faultOk($, 'concepts')
    } catch (error) {
      void fault($, 'concepts', faultCode(error), '개념 모음을 파일에 쓰지 못했습니다')
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
 * nothing met since; a rename is renamed back. Refused while the schema guard
 * is on (isStoreAhead): the merges are a newer build's to keep then.
 */
function mergeConceptStored($: EngineInterface, cfg: Config, fromName: string, intoName: string): Promise<MergeResult> {
  return enqueue('storing', async (): Promise<MergeResult> => {
    try {
      if (await isStoreAhead($)) return { isDone: false, text: BEHIND_TEXT }
      const map = cleanAliases(await $.store.get(ALIASES_KEY))
      const index = await storedIndex($, map)
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
        // A record a 1.5 merge kept holds its step as 1.5 counted it: read as the index is (recallMarks).
        folded = { ...index, [named]: recallMarks(record.concept, await stepsFrom($)) }
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
        if (!isUndo && conceptAt(index, into)) nextMerges[from] = { concept: storedConcept(gone), into, both }
        folded = mergeConcepts(index, from, into, intoName)
        const kept = folded[into]!
        folded[into] = { ...kept, count: Math.max(1, kept.count - both) }
      }
      await storeIndex($, folded)
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
      void fault($, 'store', faultCode(error, 'store'), '개념을 합치지 못했습니다')
      return { isDone: false, text: '개념을 합치지 못했습니다(저장소에 쓰지 못함). 잠시 뒤 다시 해 보세요.' }
    }
  })
}

type KnownResult = { done: string[]; already: string[]; missing: string[] } | { error: string }

/**
 * /learn 안다 · 모른다: marks the named concepts known (`toKnown`) or takes
 * the mark off, against the store as it is now; a name merged away counts as
 * the concept it went into. No model call. Refused while the schema guard is on.
 */
function markKnownStored($: EngineInterface, cfg: Config, names: readonly string[], toKnown: boolean): Promise<KnownResult> {
  return enqueue('storing', async (): Promise<KnownResult> => {
    try {
      if (await isStoreAhead($)) return { error: BEHIND_TEXT }
      const map = cleanAliases(await $.store.get(ALIASES_KEY))
      const index = await storedIndex($, map)
      const at = await $.clock.now()
      const next: Record<string, LearnConcept> = { ...index }
      const result = { done: [] as string[], already: [] as string[], missing: [] as string[] }
      const doneKeys: string[] = []
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
        doneKeys.push(key)
      }
      if (result.done.length > 0) {
        await storeIndex($, next)
        // Known now: a slip still open on it is mended with it (1.7.0), and never asked again.
        if (toKnown) await changeSlipsNow($, doneKeys, before => nextSlip(before, { kind: 'mended' }, at))
        await update($, concepts, () => next)
        await remind($, cfg)
        if (cfg.isAutoSave) await saveConcepts($, cfg, next)
      }
      return result
    } catch (error) {
      void fault($, 'store', faultCode(error, 'store'), '아는 개념 표시를 남기지 못했습니다')
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

/** Adds a new quiz's questions to the bank /learn anki exports, unless the schema guard is on; never fails the caller. */
function bankQuestions($: EngineInterface, items: readonly LearnQuizItem[], at: number): Promise<void> {
  return enqueue('storing', async () => {
    try {
      if (await isStoreAhead($)) return
      // A worked example's card asks only the question after its example (1.8.0); one with no such question is left out.
      const cards = items.flatMap(({ key, name, answer, ...item }) => {
        const question = bankQuestion(item)
        return question === undefined ? [] : [{ key, name, question, answer }]
      })
      const bank = addToBank(cleanBank(await $.store.get(BANK_KEY)), cards, at)
      await $.store.set(BANK_KEY, bank)
    } catch (error) {
      void fault($, 'store', faultCode(error, 'store'), '퀴즈 문제를 모아 두지 못했습니다')
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
      void fault($, 'store', faultCode(error, 'store'), '학습 기록을 읽지 못했습니다')
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
      void fault($, 'store', faultCode(error, 'store'), '학습 기록을 남기지 못했습니다')
    }
  })
}

/**
 * Counts one model call on today's usage record, with the tokens it read
 * (cached ones too) and wrote; never fails the caller. `kind` `auto` counts
 * toward the day's limit too; an automatic note's try again (`retry`) does not.
 */
function recordUsage($: EngineInterface, usage: ModelUsage | undefined, kind: CallKind): Promise<void> {
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
      void fault($, 'store', faultCode(error, 'store'), '모델 호출 수를 남기지 못했습니다')
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
      void fault($, 'store', faultCode(error, 'store'), '모델 호출 수를 읽지 못했습니다')
    }
  })
}

/**
 * True the first time on `day` the toast kept under `key` (the daily limit's,
 * LIMIT_TOAST_KEY; the account limit's, QUOTA_TOAST_KEY) is to show, in this
 * session or any other: the store keeps the day it last showed. A store that
 * cannot keep it only lets it show again.
 */
function isFirstToastOn($: EngineInterface, key: string, day: string): Promise<boolean> {
  if (toastDays.get(key) === day) return Promise.resolve(false)
  toastDays.set(key, day)
  return enqueue('storing', async () => {
    try {
      if ((await $.store.get(key)) === day) return false
      await $.store.set(key, day)
    } catch (error) {
      void fault($, 'store', faultCode(error, 'store'), '한도 알림을 띄운 날을 남기지 못했습니다')
    }
    return true
  })
}

/**
 * The account's rate-limit window past its mark (QUOTA_YIELD) as the status line has it now, for a turn's end to
 * yield its automatic note to the work; undefined off a subscription (no window read), or where it cannot be read.
 */
async function quotaNow($: EngineInterface): Promise<QuotaKind | undefined> {
  try {
    return quotaOver((await $.session.usage()).rateLimits)
  } catch {
    return undefined
  }
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
 * could not be written. While the schema guard is on (isStoreAhead), nothing is
 * marked: the marks before come back all the same, so the grade stands. `seed`
 * (1.7.0 D6), a team term's name and words: the first key's concept, when the
 * index does not hold it, goes in first as a note's concept does (met once,
 * now), then is marked; its marks before are none (undefined).
 */
function markConcepts(
  $: EngineInterface,
  cfg: Config,
  mark: Mark,
  keys: readonly string[],
  at: number,
  seed?: { name: string; blurb: string },
): Promise<(LearnQuizMarks | undefined)[] | undefined> {
  return enqueue('storing', async () => {
    try {
      const map = cleanAliases(await $.store.get(ALIASES_KEY))
      const prior = await storedIndex($, map)
      const resolved = keys.map(key => resolveKey(map, key))
      const before = resolved.map(key => {
        const one = conceptAt(prior, key)
        return one ? marksOf(one) : undefined
      })
      // Graded all the same, its concept's step left as a newer build's index has it.
      if (await isStoreAhead($)) return before
      // Never with a count of 0: a 1.6 session's index drops such a concept (cleanConcepts).
      const first = resolved[0]
      const base = seed && first !== undefined && !conceptAt(prior, first) ? countConcepts(prior, [{ key: first, name: seed.name, blurb: seed.blurb, files: [] }], [], at, []) : prior
      const index = mark(base, resolved, at)
      await storeIndex($, index)
      await update($, concepts, () => index)
      await remind($, cfg)
      if (cfg.isAutoSave) await saveConcepts($, cfg, index)
      return before
    } catch (error) {
      void fault($, 'store', faultCode(error, 'store'), '복습을 기록하지 못했습니다')
      return undefined
    }
  })
}

/**
 * Changes the slip of each concept in `keys` (a key merged away counts as the one it went into) against the store
 * as it is now, read again first: another session may have written it since. Nothing while the schema guard is on.
 * Each concept's slip from before, null for none, by the key given, for the ones it changed; undefined when nothing
 * changed or the store could not be written. Run in the storing lane: call it from work already queued there.
 */
async function changeSlipsNow(
  $: EngineInterface,
  keys: readonly string[],
  change: (before: LearnSlip | undefined, key: string) => LearnSlip | undefined,
): Promise<Map<string, LearnSlip | null> | undefined> {
  try {
    if (await isStoreAhead($)) return undefined
    const map = cleanAliases(await $.store.get(ALIASES_KEY))
    const now = await $.clock.now()
    const all: Record<string, LearnSlip> = cleanSlips(await $.store.get(SLIPS_KEY), map, now)
    const changed = new Map<string, LearnSlip | null>()
    for (const key of keys) {
      const at = resolveKey(map, key)
      const before = slipAt(all, at)
      const after = change(before, key)
      if (JSON.stringify(after) === JSON.stringify(before)) continue
      changed.set(key, before ?? null)
      if (after === undefined) delete all[at]
      else all[at] = after
    }
    if (changed.size === 0) return undefined
    const next = fitSlips(all)
    await $.store.set(SLIPS_KEY, next)
    await update($, slips, () => next)
    return changed
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '헷갈린 점을 남기지 못했습니다')
    return undefined
  }
}

/**
 * A grade's change to its concept's slip (slipChange), after any store write still running; `from` the slip to go
 * from in the store's place (a grade turned the other way starts from where its first grade found it). The slip from
 * before, null for none, when it changed.
 */
function recordSlip($: EngineInterface, key: string, change: SlipChange, at: number, from?: LearnSlip | null): Promise<LearnSlip | null | undefined> {
  if (change.kind === 'none' && from === undefined) return Promise.resolve(undefined)
  return enqueue('storing', async () => {
    const changed = await changeSlipsNow($, [key], before => nextSlip(from === undefined ? before : (from ?? undefined), change, at))
    return changed?.get(key)
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

/**
 * A quiz as kept: `isRevealed` (every answer shown) is read from quizzes kept before 1.6.0 and written false. A note's
 * own quiz kept before 1.7.0 (`from: 'note'`, t under a note) reads as a review quiz.
 */
type Quiz = { at: number; items: LearnQuizItem[]; isRevealed: boolean }

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

/** A question's first try read back from the store (LearnQuizItem.firstTry); undefined when it is not one. */
function firstTryOf(raw: unknown): LearnQuizFirstTry | undefined {
  if (!isRecord(raw)) return undefined
  const { mine, verdict, feedback, nudge, at, slip } = raw
  if (typeof mine !== 'string' || (verdict !== 'partial' && verdict !== 'wrong') || typeof nudge !== 'string' || nudge === '' || typeof at !== 'number') return undefined
  return { mine, verdict, feedback: typeof feedback === 'string' ? feedback : '', nudge, at, ...slipOfItem(slip, raw.slipType) }
}

/** A question's (or its first try's) slip and kind read back from the store: none unless it has words. */
function slipOfItem(slip: unknown, type: unknown): Pick<LearnQuizItem, 'slip' | 'slipType'> {
  if (typeof slip !== 'string' || slip.trim() === '') return {}
  return { slip: cut(slip, SLIP_TEXT), slipType: slipTypeOf(type) }
}

/** One quiz question read back from the store; undefined when it is not one. */
function quizItemOf(one: unknown): LearnQuizItem | undefined {
  if (!isRecord(one)) return undefined
  const { key, name, question, answer, hint, isHinted, isShown, result, gradedAt, mine, verdict, feedback, kind, noteId } = one
  if (typeof key !== 'string' || typeof name !== 'string' || typeof question !== 'string' || typeof answer !== 'string') return undefined
  const before = marksFrom(one.before)
  const firstTry = firstTryOf(one.firstTry)
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
    // The learner's own grade over Claude's: a grade turned stays fully right or wrong once read back (as every write is).
    ...(one.isLearnerGraded === true ? { isLearnerGraded: true } : {}),
    ...(kind === 'predict' || kind === 'why' || kind === 'modify' ? { kind } : {}),
    ...(typeof noteId === 'string' && noteId !== '' ? { noteId } : {}),
    ...(firstTry ? { firstTry } : {}),
    ...(one.isRetry === true ? { isRetry: true as const } : {}),
    ...(one.rung === 'worked' || one.rung === 'mine' || one.rung === 'changed' || one.rung === 'new' ? { rung: one.rung } : {}),
    ...slipOfItem(one.slip, one.slipType),
    ...(one.slipBefore === null ? { slipBefore: null } : slipRecordOf(one.slipBefore) ? { slipBefore: slipRecordOf(one.slipBefore)! } : {}),
    ...(one.team === true ? { team: true as const } : {}),
    ...teamCodeOf(one.teamCode),
    ...(one.team === true && isRootTag(one.teamTag) ? { teamTag: one.teamTag } : {}),
    ...(one.team === true && typeof one.teamBlurb === 'string' ? { teamBlurb: cut(one.teamBlurb, TERM_SEED_TEXT) } : {}),
  }
}

/** Where a team term's question was asked from, read back off a stored quiz question (1.7.0 D6); none unless it is one. */
function teamCodeOf(raw: unknown): Pick<LearnQuizItem, 'teamCode'> {
  if (!isRecord(raw) || typeof raw.file !== 'string' || raw.file === '') return {}
  const { from, to } = raw
  if (typeof from !== 'number' || typeof to !== 'number' || !Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) return {}
  return { teamCode: { file: cut(raw.file, 120), from, to, ...(raw.isDoc === true ? { isDoc: true as const } : {}) } }
}

/** This session's last quiz, else the one a past session left in the store. */
async function lastQuiz($: EngineInterface): Promise<Quiz | null> {
  const here = await read($, quiz)
  if (here) return here
  return (await storedQuiz($)) ?? null
}

/**
 * The quiz the store holds, the one every window shares (this session's may be behind it): null when it holds
 * none, undefined when the store could not be read.
 */
async function storedQuiz($: EngineInterface): Promise<Quiz | null | undefined> {
  let raw: unknown
  try {
    raw = await $.store.get(QUIZ_KEY)
  } catch {
    return undefined
  }
  if (!isRecord(raw) || typeof raw.at !== 'number' || !Array.isArray(raw.items)) return null
  const items = raw.items.map(quizItemOf).filter(one => one !== undefined)
  return items.length > 0 ? { at: raw.at, items, isRevealed: raw.isRevealed === true } : null
}

/**
 * The quiz a change is made on and written back over (1.7.0): the one the store holds, every window's, so what
 * another window kept on it meanwhile (a first try waiting for its try again, a hint seen, a grade) stays. This
 * window's own when the store holds none, or an older one (this window's write of a newer quiz failed, or a window
 * of an older build wrote its quiz back), or cannot be read.
 */
async function sharedQuiz($: EngineInterface): Promise<Quiz | null> {
  const here = await read($, quiz)
  const stored = await storedQuiz($)
  if (!stored || (here !== null && here.at > stored.at)) return here
  return stored
}

/** This window shows the quiz every window shares from now on: another window replaced this window's, or changed it. */
async function showShared($: EngineInterface, shared: Quiz): Promise<void> {
  if ((await read($, quiz)) !== shared) await update($, quiz, () => shared)
}

/** Whether the learner has seen a question's answer: shown in the pane or by /learn quiz 정답, or all of them in a quiz kept before 1.6.0. */
function isAnswerShown(current: Quiz, item: LearnQuizItem): boolean {
  return current.isRevealed || item.isShown === true
}

/** True for a question still to answer: not graded, its answer not seen. */
function isOpen(current: Quiz, item: LearnQuizItem): boolean {
  return item.result === undefined && !isAnswerShown(current, item)
}

/**
 * True for a question the quiz still waits on, which q and /learn 복습 keep
 * rather than start today's review over it: one still to answer (a first try
 * waiting for its try again among them), or one of today's quiz whose answer
 * was seen (a where no field is drawn, /learn quiz 정답) and waits for o or x.
 * One seen in a quiz of another day, or in a quiz kept before 1.6.0 that
 * showed every answer at once (/learn quiz 정답), waits no more.
 */
function isAwaited(current: Quiz, item: LearnQuizItem, now: number): boolean {
  if (item.result !== undefined) return false
  return isOpen(current, item) || (item.isShown === true && !current.isRevealed && stamp(current.at).day === stamp(now).day)
}

/** The pane's answer field for question `i` of the quiz asked at `at`: a new quiz's fields are new elements. */
const quizFieldKey = (at: number, i: number) => `quiz-mine-${at}-${i}`

/** True when the quiz run's draft (an answer that did not go in) is question `i`'s, of the quiz asked at `at`. */
function isDraftOf(run: LearnQuizRun, at: number, i: number): boolean {
  return run.draft != null && run.draft.at === at && run.draft.i === i
}

/** The field question `i` takes its answer in now: after a first try, the try again's own (a new element, so it is drawn empty). */
function answerKey(current: Quiz, i: number): string {
  return `${quizFieldKey(current.at, i)}${current.items[i]?.firstTry !== undefined ? '-again' : ''}`
}

/**
 * True when a graded question's answer leaned on help: its hint was seen, it
 * was right only on a try again (after the question asked back), or the
 * learner graded it themselves, which they do only once its answer is seen;
 * or it came after a worked example (1.8.0, 풀이 보고 풀기).
 */
function isHelpedGrade(item: LearnQuizItem): boolean {
  // A first try stays on a question only once a try again graded it (one graded with none drops it).
  return item.isHinted === true || item.mine === undefined || item.firstTry !== undefined || item.rung === 'worked'
}

/**
 * A graded question's help, after its mark: · 힌트 봄, · 풀이 봄 for one right after a worked example (1.8.0),
 * · 되짚어 맞힘 for one right on a try again after the question asked back, and · 정답 봄 for one graded right
 * after seeing its answer.
 */
function helpText(item: LearnQuizItem): string {
  const isRetried = item.result === 'right' && item.firstTry !== undefined && !isBlankAnswer(item.firstTry.mine)
  const isWorked = item.result === 'right' && item.rung === 'worked'
  return `${item.isHinted === true ? ' · 힌트 봄' : ''}${isWorked ? ' · 풀이 봄' : ''}${isRetried ? ' · 되짚어 맞힘' : ''}${item.result === 'right' && item.mine === undefined ? ' · 정답 봄' : ''}`
}

/**
 * What stands over a question waiting for its try again: how far the first try got (partly, or not yet), or, after
 * "모르겠어요", to try again with the hint.
 */
function firstTryHead(first: LearnQuizFirstTry): string {
  if (isBlankAnswer(first.mine)) return '힌트를 보고 한 번 더 떠올려 보세요'
  return first.verdict === 'partial' ? '△ 아직입니다 · 방향은 맞습니다' : '✗ 아직입니다 · 한 번 더 떠올려 보세요'
}

/** What the try again is asked under: the question Claude asked back (되묻기), or the hint after "모르겠어요". */
function nudgeLabel(first: LearnQuizFirstTry): string {
  return isBlankAnswer(first.mine) ? '힌트' : '되묻기'
}

/**
 * A first try as a grade gives it: its answer, Claude's grade (partly right or wrong) and feedback, and the slip it
 * showed; "모르겠어요" with a word in the feedback's place.
 */
function firstGrade(first: LearnQuizFirstTry): Pick<LearnQuizItem, 'mine' | 'verdict' | 'feedback' | 'slip' | 'slipType'> {
  return {
    mine: first.mine,
    verdict: first.verdict,
    feedback: first.feedback !== '' ? first.feedback : BLANK_FEEDBACK,
    ...(first.slip !== undefined ? { slip: first.slip, slipType: first.slipType ?? 'other' } : {}),
  }
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
  // A note's practice (1.7.0) is no review.
  return today && today.right + today.wrong - (today.drills ?? 0) > 0 ? '오늘 복습을 마쳤습니다' : undefined
}

/** Claude's grade of a typed answer, as the pane and /learn quiz say it. */
const VERDICT_TEXT: Record<'right' | 'partial' | 'wrong', string> = { right: '맞혔습니다.', partial: '거의 맞았습니다.', wrong: '아쉽지만 틀렸습니다.' }

/** True for a question Claude graded partly right, its grade still standing: counted wrong, its concept a step back. */
function isPartly(item: LearnQuizItem): boolean {
  return item.result === 'wrong' && item.verdict === 'partial' && item.isLearnerGraded !== true
}

/** True for a quiz of team terms alone (1.7.0 D6): /learn 퀴즈 팀's, or one made with no concept learned yet. */
function isTeamOnlyQuiz(items: readonly LearnQuizItem[]): boolean {
  return items.length > 0 && items.every(item => item.team === true)
}

/** True for a question graded wrong, not partly right: its concept comes first in the next quiz. */
function isFullMiss(item: LearnQuizItem): boolean {
  return item.result === 'wrong' && !isPartly(item)
}

/**
 * True for a team term (1.7.0 D6) whose grade put it in the concept index: graded with no marks from before (its
 * concept was not there), and there now. None while the schema guard kept the grade from the index.
 */
function isTeamAdded(item: LearnQuizItem, index: Readonly<Record<string, LearnConcept>>, map: Readonly<Record<string, string>>): boolean {
  return item.team === true && item.result !== undefined && item.before === undefined && conceptAt(index, resolveKey(map, item.key)) !== undefined
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
 * time, the partly right a little sooner), and to the ones right after a hint,
 * a question asked back or the answer (back after as long again).
 */
function missesText(items: readonly LearnQuizItem[], separator = ' · '): string {
  const parts: string[] = []
  if (items.some(item => item.result === 'wrong' && !isPartly(item))) parts.push('틀린 개념은 다음 퀴즈에 먼저 나옵니다')
  else if (items.some(isPartly)) parts.push('거의 맞힌 개념은 조금 일찍 다시 나옵니다')
  if (items.some(item => item.result === 'right' && isHelpedGrade(item))) {
    // A worked example (1.8.0) is named among the help only when a question right after one is there.
    const isWorked = items.some(item => item.result === 'right' && item.rung === 'worked')
    parts.push(`힌트·${isWorked ? '풀이·' : ''}되묻기·정답을 보고 맞힌 개념은 같은 간격 뒤 다시 나옵니다`)
  }
  return parts.join(separator)
}

const NO_CONCEPTS_FOR_QUIZ = '아직 모인 개념이 없어 퀴즈를 낼 수 없습니다. 노트가 쓰이면 "배울 개념"이 쌓입니다.'
const ALL_KNOWN_TEXT = '모든 개념이 아는 개념이라 퀴즈에 낼 개념이 없습니다. 되돌리려면 /learn 모른다 개념 이름.'
const CHECKING_TEXT = '답을 채점하고 있습니다. 채점이 끝난 뒤 새 문제를 받으세요.'
/** An answer entered in the pane while a new quiz is made (checkAnswer): kept in its field, not graded. */
const MAKING_TEXT = '새 문제를 만들고 있습니다. 문제가 나온 뒤 답하세요.'
const MOVED_TEXT = '그사이 새 퀴즈가 나와 이 답은 채점하지 않았습니다.'
/** An answer to a question another window took a first try at meanwhile (1.7.0): this window now shows that try's question asked back. */
const TRIED_ELSEWHERE = '이 문제는 그사이 다른 창에서 먼저 답했습니다. 한 번 더 적어 보세요.'
/** /learn quiz 힌트 or 정답 once another window's new quiz took the place of the one this window had. */
const NEW_QUIZ_ELSEWHERE = '그사이 다른 창에서 새 퀴즈가 나왔습니다. 지금 문제: /learn 퀴즈'
const GRADE_NOT_KEPT = '채점을 적지 못했습니다(저장소에 쓰지 못함). 잠시 뒤 다시 해 보세요.'
/** The feedback kept on a question graded wrong for "모르겠어요" with no model call (its hint seen, or none to see). */
const BLANK_FEEDBACK = '정답을 읽어 보고, 다음에 이 개념이 나오면 다시 떠올려 보세요.'

/** What to say when the model in /config cannot be called (an organization's policy, a name this build does not know). */
function noModelText(cfg: Config): string {
  return `'${cfg.model}' 모델을 부를 수 없습니다 · /config에서 다른 모델을 골라 보세요`
}

/**
 * Who made a model call, for the usage record: a turn's end by itself (`auto`, counted toward the day's limit),
 * the learner (`manual`), or an automatic note's one try again after a failure that clears on its own (`retry`).
 */
type CallKind = 'auto' | 'manual' | 'retry'

/** How long a model call may take unless its caller says otherwise. */
const MODEL_TIMEOUT_MS = 90_000
/** An `aborted` call that ran this close to its whole time limit was cut by that limit, not by a reload. */
const TIMEOUT_SLACK_MS = 1_000

/**
 * One model call for the learner: its text, or why there is none in words they
 * can act on (`error`), with the failure as askModel saw it (`fail`; absent
 * where the engine refused to make the call) and, for one that may clear on its
 * own, which (`transient`). The prompt's secrets are masked once more on the
 * way out: a note stored or a journal written before 1.6.0, or a typed quiz
 * answer, was never masked. Every call that reached the model is counted in the
 * usage record, answered or not (`kind`, see CallKind). A call with no answer
 * is a fault of `area` (its code, never its text); one answered marks the
 * area's faults gone through.
 */
async function askModel(
  $: EngineInterface,
  cfg: Config,
  area: 'note' | 'quiz' | 'grade' | 'ask' | 'recap',
  call: { system: string; prompt: string; maxTokens: number; timeoutMs?: number },
  kind: CallKind = 'manual',
): Promise<{ text: string } | { error: string; fail?: ModelFail; transient?: Transient }> {
  const timeoutMs = call.timeoutMs ?? MODEL_TIMEOUT_MS
  // When it began, to tell its own time limit from a reload that cut it (both resolve `aborted`).
  const startedAt = await $.clock.now().catch(() => undefined)
  let reply
  try {
    reply = await $.model.complete({ model: cfg.model, effort: 'low', ...call, timeoutMs, prompt: redactText(call.prompt).text })
  } catch {
    void fault($, area, 'blocked', '모델을 부르지 못했습니다')
    return { error: noModelText(cfg) }
  }
  await recordUsage($, reply.usage, kind)
  if (reply.isAnswered) {
    faultOk($, area)
    return { text: fixEscapedTicks(reply.text) }
  }
  const endedAt = reply.reason === 'aborted' && startedAt !== undefined ? await $.clock.now().catch(() => undefined) : undefined
  const isTimeout = startedAt !== undefined && endedAt !== undefined && endedAt - startedAt >= timeoutMs - TIMEOUT_SLACK_MS
  const fail: ModelFail =
    reply.reason === 'api-error' ? { reason: reply.reason, status: reply.status, error: reply.error } : { reason: reply.reason, ...(isTimeout ? { isTimeout: true } : {}) }
  void fault($, area, modelCode(fail), '모델이 답하지 않았습니다')
  const transient = transientOf(fail)
  return { error: failureText(fail, cfg.model), fail, ...(transient !== undefined ? { transient } : {}) }
}

/**
 * Each concept with the note it is asked from, while a note still holds it: that note's id, and the learner's
 * code from it. That note is the latest that taught the concept. Its code is screened first (a note kept before
 * 1.6.0 may hold a .env), so a file left out is never quoted.
 */
async function withCode($: EngineInterface, cfg: Config, picks: readonly RankedConcept[], map: Readonly<Record<string, string>>): Promise<QuizPick[]> {
  const written = (await allNotes($)).filter(note => note.status === 'ready').sort((a, b) => b.at - a.at)
  const found: QuizPick[] = []
  for (const one of picks) {
    const teaches = (each: LearnNote) => each.concepts.some(key => resolveKey(map, key) === one.key)
    const note = written.find(teaches)
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

/** What /learn 퀴즈 팀 answers when every team term of the repository is a concept marked known. */
const TEAM_ALL_KNOWN = '이 저장소의 팀 용어는 모두 아는 개념이라 퀴즈에 낼 것이 없습니다. 되돌리려면 /learn 모른다 개념 이름.'

/**
 * The team terms met already (1.7.0 D6) a team quiz goes on to once none is left to meet: the concepts the terms
 * came to, none marked known, the ones due first (as dueConcepts ranks them), then the ones due soonest.
 */
function metTeamConcepts(
  terms: readonly TeamTerm[],
  index: Readonly<Record<string, LearnConcept>>,
  map: Readonly<Record<string, string>>,
  now: number,
): RankedConcept[] {
  const keys = new Set(terms.map(term => termKey(term, map)))
  const due = dueConcepts(index, now).filter(one => keys.has(one.key))
  const rest = rankConcepts(index)
    .filter(one => keys.has(one.key) && !isKnown(one) && !due.some(other => other.key === one.key))
    .sort((a, b) => dueAt(a) - dueAt(b))
  return [...due, ...rest]
}

/**
 * Asks the model for a new quiz and keeps it; or says why there is none. The
 * concepts due first, taken from different notes where it can (a wrong one
 * always), never one marked known,
 * each asked about the code the learner made with it where a note still holds it,
 * and one whose slip is still open asked again in other code (1.7.0, 다시 도전).
 * In a repository whose team file has terms (1.7.0 D6), the places the concepts
 * due leave free go to the terms not met yet, in the file's order, each asked by
 * the team's words and the lines its words name (readTermCode); a concept marked
 * a team term of this repository is asked by those lines too. `mode` 'team'
 * (/learn 퀴즈 팀) asks the team terms alone: the ones not met first, then the
 * ones met, due first.
 */
async function makeQuiz(
  $: EngineInterface,
  cfg: Config,
  now: number,
  mode: 'review' | 'team' = 'review',
): Promise<{ items: LearnQuizItem[]; at: number } | { error: string }> {
  const index = await read($, concepts)
  const map = await read($, aliases)
  const isTeamQuiz = mode === 'team'
  // This repository's team terms (1.7.0 D6), the team file read again if it changed.
  const file = await teamOf($, '')
  const terms = file?.practice ?? []
  // A concept whose slip is still open is asked again (다시 도전): told its last question, answer and slip. One whose
  // slip no quiz has gone over since its grade kept it is in the next review quiz whether due or not, as the line
  // under that grade said (slipsToAsk: 거의 marks no miss, so its review may be days off).
  const open = await storedSlips($, map, now)
  const asking = new Set(isTeamQuiz ? [] : slipsToAsk(index, open, now))
  // A concept the learner knows is asked about in no quiz.
  const chosen = isTeamQuiz ? metTeamConcepts(terms, index, map, now).slice(0, QUIZ_CANDIDATES) : quizPick(index, now, QUIZ_CANDIDATES, [...asking])
  // The places the concepts due leave free (all three in a team quiz) go to the team terms not met yet, in the file's order.
  const dueCount = chosen.filter(one => asking.has(one.key) || isDue(one, now)).length
  const free = isTeamQuiz ? 3 : 3 - Math.min(3, dueCount)
  const fresh: QuizPick[] = unmetTerms(terms, index, map)
    .slice(0, free)
    .map(term => ({ key: termKey(term, map), name: term.name, count: 0, firstAt: now, lastAt: now, blurb: termBlurb(term.blurb, TERM_ASK_TEXT), files: [], team: true as const }))
  if (chosen.length === 0 && fresh.length === 0) {
    if (isTeamQuiz) return { error: terms.length > 0 ? TEAM_ALL_KNOWN : NO_TEAM_TERMS }
    return { error: Object.keys(index).length > 0 ? ALL_KNOWN_TEXT : NO_CONCEPTS_FOR_QUIZ }
  }
  // A review quiz goes over more than one note where it can (three concepts from one note make one lesson
  // again), the slips to ask again and the concepts due before any other, then the team terms not met yet.
  const found = await withCode($, cfg, chosen, map)
  // A concept that came in as a team term: of this repository (any of its terms, in a team quiz) asked as one, by the
  // team's words; of another, its words are the team's all the same.
  const marks = await storedTeamTerms($, map)
  const root = await $.session.root()
  const termOf = new Map<string, TeamTerm>()
  for (const term of terms) if (!termOf.has(termKey(term, map))) termOf.set(termKey(term, map), term)
  const marked: QuizPick[] = found.map(one => {
    const term = termOf.get(one.key)
    if (term && (isTeamQuiz || isTeamTerm(marks, one.key, rootTag(root)))) return { ...one, team: true as const, blurb: termBlurb(term.blurb, TERM_ASK_TEXT) }
    return isTeamTerm(marks, one.key) ? { ...one, isTeamMarked: true as const } : one
  })
  const isFresh = new Set(fresh.map(one => one.key))
  const isAsking = (one: QuizPick) => asking.has(one.key)
  const isFirst = (one: QuizPick) => isTeamQuiz || isAsking(one) || isDue(one, now) || isFresh.has(one.key)
  // In the quiz's order: the concepts due, then the team terms not met, then the rest (a team quiz: the terms not met first).
  const candidates = isTeamQuiz ? [...fresh, ...marked] : [...marked.filter(isFirst), ...fresh, ...marked.filter(one => !isFirst(one))]
  const spread = spreadPicks(candidates, 3, isFirst, isAsking)
  // Each team term asked by the lines its words name (three files read at most), over the learner's code; then its slip.
  // It keeps this repository and the words its grade puts in the concept index: a quiz may be graded in any window.
  const picks: QuizPick[] = []
  for (const one of spread) {
    const term = one.team ? termOf.get(one.key) : undefined
    const teamCode = term && file ? await readTermCode($, cfg, file, term) : undefined
    const origin = term && root ? { teamTag: rootTag(root), teamBlurb: termBlurb(term.blurb, TERM_SEED_TEXT) } : {}
    const slip = openSlip(open, one.key)
    // Which code it is asked in (1.8.0, the question ladder): by its review step, or by a worked example first once
    // its slip, asked again, was missed twice running.
    const rung = rungOf(one, {
      ...(one.code ? { code: one.code } : {}),
      ...(slip ? { slip } : {}),
      isAsking: asking.has(one.key),
      isTeam: one.team === true,
      isDue: isDue(one, now),
    })
    picks.push(
      pickForRung({ ...one, ...(teamCode ? { teamCode } : {}), ...origin, ...(slip ? { slip: { what: slip.what, question: slip.question, mine: slip.mine } } : {}) }, rung),
    )
  }
  // A worked example (and code never seen) writes code of its own: room for it, spent only as far as it is used.
  const isLong = picks.some(one => one.rung === 'worked' || one.rung === 'new')
  const asked = await askModel($, cfg, 'quiz', { system: QUIZ_SYSTEM, prompt: quizPrompt(picks, cfg.level), maxTokens: isLong ? 1600 : 1400 })
  if ('error' in asked) return { error: `퀴즈를 내지 못했습니다: ${asked.error}` }
  const items = parseQuiz(asked.text, picks)
  if (items.length === 0) {
    void fault($, 'quiz', 'unreadable', '모델의 답을 문제로 읽지 못했습니다')
    return { error: '퀴즈를 내지 못했습니다: 모델의 답을 문제로 읽지 못했습니다. 다시 해 보세요.' }
  }
  // The quiz it replaces: a first try still waiting for its try again is graded as Claude graded it.
  await settleFirstTries($, cfg, now, true)
  await keepQuiz($, { at: now, items, isRevealed: false })
  await update($, quizRun, run => ({ ...run, error: null }))
  await bankQuestions($, items, now)
  return { items, at: now }
}

/**
 * The pane's s (q for today's review): a new quiz, the pane saying "making"
 * until it is there or failed, and then the first question's answer field
 * holding the keys.
 */
async function startQuiz($: EngineInterface, cfg: Config): Promise<void> {
  if (isQuizMaking) return
  if (isQuizChecking) {
    await update($, quizRun, run => ({ ...run, error: CHECKING_TEXT }))
    return
  }
  isQuizMaking = true
  try {
    await update($, quizRun, () => ({ isMaking: true, error: null }))
    const made = await makeQuiz($, cfg, await $.clock.now())
    await update($, quizRun, () => ({ isMaking: false, error: 'error' in made ? made.error : null }))
    // A surface with no text field (the mobile app) draws none to focus: the engine says no, and nothing else happens.
    if (!('error' in made)) focusInPane($, quizFieldKey(made.at, 0))
  } catch (error) {
    void fault($, 'quiz', faultCode(error), '퀴즈를 내지 못했습니다')
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
  if (current) await keepHint($, current, i)
}

/**
 * Question `i`'s hint marked seen, on the quiz every window shares (sharedQuiz): 'moved' once another window's
 * new quiz took `current`'s place, 'busy' once the question is graded (or it has no hint); this window then shows
 * the shared quiz.
 */
async function keepHint($: EngineInterface, current: Quiz, i: number): Promise<'kept' | 'busy' | 'moved'> {
  const shared = (await sharedQuiz($)) ?? current
  const item = shared.items[i]
  if (shared.at !== current.at || !item?.hint || item.result !== undefined) {
    await showShared($, shared)
    return shared.at !== current.at ? 'moved' : 'busy'
  }
  if (item.isHinted !== true) await keepQuiz($, { ...shared, items: shared.items.map((one, j) => (j === i ? { ...one, isHinted: true } : one)) })
  else await showShared($, shared)
  return 'kept'
}

/**
 * The pane's a, and /learn quiz 정답: one question's answer. After a first try
 * the answer is its grade too, the first try's as Claude graded it (partly
 * right or wrong), with no o or x; before one (where no field is drawn, after
 * a grade that did not come back, or asked for in the conversation) the answer
 * shows for the learner to grade with o or x.
 */
async function showAnswer($: EngineInterface, cfg: Config, i: number): Promise<'graded' | undefined> {
  await disarm($)
  const here = await lastQuiz($)
  if (!here) return undefined
  // On the quiz every window shares: another window's first try at it is graded by this answer, its quiz kept.
  const current = (await sharedQuiz($)) ?? here
  const item = current.items[i]
  if (current.at !== here.at || !item || isAnswerShown(current, item)) {
    await showShared($, current)
    return undefined
  }
  if (item.firstTry !== undefined && item.result === undefined) {
    const kept = await gradeFirstTry($, cfg, current, i, 'wrong')
    if (kept === 'failed') await update($, quizRun, run => ({ ...run, error: GRADE_NOT_KEPT }))
    return kept === 'kept' ? 'graded' : undefined
  }
  await keepQuiz($, { ...current, items: current.items.map((one, j) => (j === i ? { ...one, isShown: true } : one)) })
  return undefined
}

/** The pane's a: the answer, and once that graded a first try, the keys on to the next question, as after o or x. */
async function answerInPane($: EngineInterface, cfg: Config, i: number): Promise<void> {
  if ((await showAnswer($, cfg, i)) === 'graded') await focusNextQuestion($)
}

/** The pane's o and x: the learner's own grade for one question whose answer they saw. */
async function gradeQuiz($: EngineInterface, cfg: Config, i: number, result: 'right' | 'wrong'): Promise<void> {
  await disarm($)
  const current = await lastQuiz($)
  const item = current?.items[i]
  if (!current || !item || item.result !== undefined || !isAnswerShown(current, item)) return
  if ((await applyGrade($, cfg, current, i, result, {})) === 'failed') {
    await update($, quizRun, run => ({ ...run, error: GRADE_NOT_KEPT }))
    return
  }
  // As after a typed answer: the next question's field, so the answers go on with Enter.
  await focusNextQuestion($)
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
  extra: Pick<LearnQuizItem, 'mine' | 'verdict' | 'feedback' | 'isLearnerGraded' | 'slip' | 'slipType'>,
  how: { at?: number; isFirstDropped?: boolean } = {},
): Promise<'kept' | 'busy' | 'moved' | 'failed'> {
  const mark = `${current.at}:${i}`
  if (grading.has(mark)) return 'busy'
  grading.add(mark)
  try {
    // As it stands now in every window (sharedQuiz): a new quiz may have replaced this one, or the question been
    // graded meanwhile, or tried in another window where this grade knows of no first try. This window then shows it.
    const fresh = (await sharedQuiz($)) ?? current
    const kept = fresh.items[i]
    const ours = current.items[i]?.firstTry
    if (fresh.at !== current.at || !kept || kept.result !== undefined || (kept.firstTry !== undefined && ours === undefined)) {
      await showShared($, fresh)
      return fresh.at !== current.at ? 'moved' : 'busy'
    }
    // A first try this window kept that a window of an older build wrote the quiz back without is still this question's.
    const withOurs = (one: LearnQuizItem): LearnQuizItem => (one.firstTry === undefined && ours !== undefined ? { ...one, firstTry: ours } : one)
    const item = withOurs(kept)
    // A first try graded when it was tried (a quiz left behind), else now.
    const now = how.at ?? (await $.clock.now())
    // A first try graded with no try again is kept as a typed answer graded at once: no first try then.
    const graded = (one: LearnQuizItem): LearnQuizItem => {
      const next: LearnQuizItem = { ...one, ...extra }
      if (how.isFirstDropped) delete next.firstTry
      return next
    }
    // Right after its hint or a try again, or graded by the learner once its answer showed: recalled with help, so its step stays.
    const isHelped = isHelpedGrade(graded(item))
    // A team term not met yet goes in the concept index with its grade (1.7.0 D6).
    const seed = item.team ? await teamSeed($, item) : undefined
    // The learner's own word is fully right or fully wrong, never "partly", whatever Claude's verdict was.
    const before = await markConcepts($, cfg, markFor(result, extra.isLearnerGraded === true ? undefined : extra.verdict, isHelped, item.rung), [item.key], now, seed)
    if (!before) return 'failed'
    // A team term graded is one of its repository's from now on (the one the quiz was made in, wherever it is graded):
    // its quizzes there ask it by the team's code.
    if (item.team && conceptAt(await read($, concepts), resolveKey(await read($, aliases), item.key))) await markTeamTerm($, item.key, item.teamTag)
    // Its slip (1.7.0): what a miss showed, kept for the next quiz to ask again; one asked again mended by a right answer.
    const isGraduated = conceptAt(await read($, concepts), resolveKey(await read($, aliases), item.key))?.knownAt === now
    const slipBefore = await recordSlip($, item.key, slipChange({ ...graded(item), result }, { isHelped, isGraduated }), now)
    // Read again: the quiz may have moved on while the concepts were written.
    const latest = (await sharedQuiz($)) ?? fresh
    if (latest.at !== current.at) return 'kept'
    const prior = before[0]
    await keepQuiz($, {
      ...latest,
      items: latest.items.map((one, j) =>
        j === i ? { ...graded(withOurs(one)), isShown: true, result, gradedAt: now, ...(prior ? { before: prior } : {}), ...(slipBefore !== undefined ? { slipBefore } : {}) } : one,
      ),
    })
    // Graded (from the conversation too): an answer a failed grade left in its field is not sent again.
    await update($, quizRun, run => ({ ...run, error: null, ...(isDraftOf(run, current.at, i) ? { draft: null } : {}) }))
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
    // As every window has it (sharedQuiz): a new quiz, or this grade turned already, shows here instead.
    const fresh = (await sharedQuiz($)) ?? current
    const item = fresh.items[i]
    if (fresh.at !== current.at || !item || item.result === undefined || (item.result === result && !isPartly(item))) {
      await showShared($, fresh)
      return fresh.at !== current.at ? 'moved' : 'busy'
    }
    const at = item.gradedAt ?? (await $.clock.now())
    // The learner's own word: fully right or fully wrong, never "partly"; right after help keeps the step.
    const right = isHelpedGrade(item) ? markHelped : markReviewed
    // Marks a 1.5 grade kept are read as the index is: its step begun at the notes met is 1 at most.
    const before = item.before && recallMarks(item.before, await stepsFrom($))
    const mark: Mark = (index, keys) => regrade(index, keys[0]!, before, at, result === 'right' ? right : markWrong)
    if (!(await markConcepts($, cfg, mark, [item.key], at))) return 'failed'
    // Its slip as if graded this way then: from the slip before the first grade, turned right as if right at once.
    const turned: LearnQuizItem = { ...item, result, isLearnerGraded: true }
    const isGraduated = conceptAt(await read($, concepts), resolveKey(await read($, aliases), item.key))?.knownAt === at
    const change = slipChange(turned, { isHelped: isHelpedGrade(item), isGraduated, isTurned: true })
    const slipBefore = await recordSlip($, item.key, change, at, item.slipBefore)
    const latest = (await sharedQuiz($)) ?? fresh
    if (latest.at === current.at) {
      const kept = item.slipBefore !== undefined ? {} : slipBefore !== undefined ? { slipBefore } : {}
      await keepQuiz($, { ...latest, items: latest.items.map((one, j) => (j === i ? { ...one, result, isLearnerGraded: true, ...kept } : one)) })
    }
    // Partly right was counted wrong already: only a right one moves between the counts.
    if (item.result !== result) await recordActivity($, stamp(at).day, result === 'right' ? { right: 1, wrong: -1 } : { right: -1, wrong: 1 })
    return 'kept'
  } finally {
    grading.delete(guard)
  }
}

/**
 * The pane's f: the learner turns Claude's grade of their typed answer the
 * other way; under a first try (맞았는데요), the first try graded right, as
 * if Claude had graded it so.
 */
async function flipGrade($: EngineInterface, cfg: Config, i: number): Promise<void> {
  await disarm($)
  const current = await lastQuiz($)
  const item = current?.items[i]
  if (current && item?.firstTry !== undefined && item.result === undefined) {
    // "모르겠어요" was no answer to turn right.
    if (isBlankAnswer(item.firstTry.mine)) return
    const kept = await gradeFirstTry($, cfg, current, i, 'right')
    if (kept === 'failed') await update($, quizRun, run => ({ ...run, error: GRADE_NOT_KEPT }))
    else if (kept === 'kept') await focusNextQuestion($)
    return
  }
  if (!current || !item || item.result === undefined || item.verdict === undefined) return
  if ((await regradeQuiz($, cfg, current, i, item.result === 'right' ? 'wrong' : 'right')) === 'failed') {
    await update($, quizRun, run => ({ ...run, error: GRADE_NOT_KEPT }))
  }
}

/**
 * Claude grades a typed answer to question `i` against its answer and the
 * grade is kept: the question as graded, or why there is no grade. A first try
 * short of right that Claude asks a question back on is not graded yet: it is
 * kept for one try again (`isFirstTry`), and the try again carries it to the
 * grade, which is then final. "모르겠어요" calls no model: the hint in the
 * question's place the first time, the answer (graded wrong) once it is seen.
 */
async function gradeTyped(
  $: EngineInterface,
  cfg: Config,
  current: Quiz,
  i: number,
  mine: string,
): Promise<{ item: LearnQuizItem; isFirstTry?: true } | { error: string }> {
  const item = current.items[i]
  if (!item) return { error: '없는 문제입니다.' }
  const first = item.firstTry
  const said = cut(mine, 1500)
  if (isBlankAnswer(mine)) {
    if (first === undefined && item.hint !== undefined && item.isHinted !== true) {
      return keepFirstTry($, current, i, { mine: said, verdict: 'wrong', feedback: '', nudge: item.hint, at: await $.clock.now() })
    }
    return keptGrade($, cfg, current, i, 'wrong', { mine: said, verdict: 'wrong', feedback: BLANK_FEEDBACK })
  }
  // The concept's slip still open (1.7.0), on a question asked again (다시 도전): the grade is told it, to name it in
  // the feedback once it is mended. Only there can a right answer mend it (nextSlip): elsewhere (the question said
  // the slip, or the slip was kept after the quiz was made) the feedback would name a mend no line follows.
  const past = item.isRetry ? await pastSlip($, item.key) : undefined
  const prompt = checkPrompt(item, mine, cfg.level, first, past ? { what: past.what, mine: past.mine } : undefined)
  const asked = await askModel($, cfg, 'grade', { system: CHECK_SYSTEM, prompt, maxTokens: 480, timeoutMs: 60_000 })
  if ('error' in asked) return { error: `채점하지 못했습니다: ${asked.error}` }
  const graded = parseCheck(asked.text)
  if (!graded) {
    void fault($, 'grade', 'unreadable', '채점 결과를 읽지 못했습니다')
    return { error: '채점 결과를 읽지 못했습니다. 다시 보내 보세요.' }
  }
  // The slip this answer showed, asked for on its first grade only (after "모르겠어요" too: no answer came before).
  const slip = (first === undefined || isBlankAnswer(first.mine)) && graded.slip !== undefined ? { slip: graded.slip, slipType: graded.slipType ?? ('other' as const) } : {}
  // Short of right the first time, with a question asked back that does not give the answer away: one try again.
  const nudge = first === undefined && graded.verdict !== 'right' ? keptNudge(graded.nudge, item.answer) : undefined
  if (nudge !== undefined && graded.verdict !== 'right') {
    return keepFirstTry($, current, i, { mine: said, verdict: graded.verdict, feedback: graded.feedback, nudge, at: await $.clock.now(), ...slip })
  }
  // Almost right is not right yet: counted wrong, its concept a step back (after a try again, only when both tries were).
  // After "모르겠어요" there was no first answer to grade: the one after the hint is graded as it is, as one after h.
  const verdict = first && !isBlankAnswer(first.mine) ? secondVerdict(first.verdict, graded.verdict) : graded.verdict
  return keptGrade($, cfg, current, i, verdict === 'right' ? 'right' : 'wrong', { mine: said, verdict, feedback: graded.feedback, ...slip })
}

/** The slips as the store has them now (merges followed), else as the pane's mirror last had them. */
async function storedSlips($: EngineInterface, map: Readonly<Record<string, string>>, now: number): Promise<Record<string, LearnSlip>> {
  try {
    return cleanSlips(await $.store.get(SLIPS_KEY), map, now)
  } catch {
    return read($, slips)
  }
}

/** The slip still open for the concept under `key` (merges followed), as the store has it; none when the store cannot be read. */
async function pastSlip($: EngineInterface, key: string): Promise<LearnSlip | undefined> {
  try {
    const map = await read($, aliases)
    return openSlip(cleanSlips(await $.store.get(SLIPS_KEY), map, await $.clock.now()), resolveKey(map, key))
  } catch {
    return undefined
  }
}

/** applyGrade for a typed answer: the question as graded, or why there is no grade. */
async function keptGrade(
  $: EngineInterface,
  cfg: Config,
  current: Quiz,
  i: number,
  result: 'right' | 'wrong',
  extra: Pick<LearnQuizItem, 'mine' | 'verdict' | 'feedback' | 'slip' | 'slipType'>,
): Promise<{ item: LearnQuizItem } | { error: string }> {
  const kept = await applyGrade($, cfg, current, i, result, extra)
  if (kept === 'failed') return { error: GRADE_NOT_KEPT }
  if (kept === 'busy') {
    // Tried in another window meanwhile (a first try this answer knew nothing of): its try again shows here now.
    const shown = await lastQuiz($)
    const there = shown?.at === current.at ? shown.items[i] : undefined
    return { error: there && isTryWaiting(there) && current.items[i]?.firstTry === undefined ? TRIED_ELSEWHERE : '이 문제는 그사이 이미 채점했습니다.' }
  }
  const latest = (await lastQuiz($)) ?? current
  if (kept === 'moved' || latest.at !== current.at) return { error: MOVED_TEXT }
  return { item: latest.items[i] ?? { ...current.items[i]!, ...extra, result } }
}

/**
 * Keeps a first try on question `i`, its concept not marked and nothing
 * counted: the question stays open for one try again (in a field of its own),
 * the try's hint marked seen when the hint is what it is asked under.
 */
async function keepFirstTry($: EngineInterface, current: Quiz, i: number, first: LearnQuizFirstTry): Promise<{ item: LearnQuizItem; isFirstTry: true } | { error: string }> {
  const mark = `${current.at}:${i}`
  if (grading.has(mark)) return { error: '이 문제는 그사이 이미 채점했습니다.' }
  grading.add(mark)
  try {
    // On the quiz every window shares (sharedQuiz): one another window replaced, graded or tried meanwhile shows here instead.
    const latest = (await sharedQuiz($)) ?? current
    const item = latest.items[i]
    if (latest.at !== current.at || !item || item.result !== undefined || item.firstTry !== undefined) {
      await showShared($, latest)
      if (latest.at !== current.at) return { error: MOVED_TEXT }
      return { error: item && isTryWaiting(item) ? TRIED_ELSEWHERE : '이 문제는 그사이 이미 채점했습니다.' }
    }
    const isHint = isBlankAnswer(first.mine)
    const tried: LearnQuizItem = { ...item, firstTry: first, ...(isHint ? { isHinted: true } : {}) }
    await keepQuiz($, { ...latest, items: latest.items.map((one, j) => (j === i ? tried : one)) })
    // The answer a failed grade left in the field went in (sent from the conversation too): the try again's field is drawn empty.
    await update($, quizRun, run => ({ ...run, error: null, ...(isDraftOf(run, current.at, i) ? { draft: null } : {}) }))
    return { item: tried, isFirstTry: true }
  } finally {
    grading.delete(mark)
  }
}

/**
 * A first try graded with no try again, graded then as a typed answer graded
 * at once is (no first try kept, so a later f turns it as such). `wrong`
 * grades it as Claude did, partly right or wrong (the answer seen; a quiz left
 * behind, on the day it was tried: `at`), or, said by the learner
 * (`isLearner`: /learn quiz 틀림), fully wrong as their own word always is.
 * `right` is the learner's own grade over Claude's (f 맞았는데요, /learn quiz
 * 맞음): right the first time.
 */
function gradeFirstTry(
  $: EngineInterface,
  cfg: Config,
  current: Quiz,
  i: number,
  result: 'right' | 'wrong',
  how: { isLearner?: boolean; at?: number } = {},
): Promise<'kept' | 'busy' | 'moved' | 'failed'> {
  const first = current.items[i]?.firstTry
  if (first === undefined) return Promise.resolve('busy')
  if (result === 'right') return applyGrade($, cfg, current, i, 'right', { ...firstGrade(first), isLearnerGraded: true }, { isFirstDropped: true })
  const extra = { ...firstGrade(first), ...(how.isLearner ? { isLearnerGraded: true } : {}) }
  return applyGrade($, cfg, current, i, 'wrong', extra, { isFirstDropped: true, ...(how.at !== undefined ? { at: how.at } : {}) })
}

/** A question whose first try waits for its try again. */
function isTryWaiting(item: LearnQuizItem): boolean {
  return item.firstTry !== undefined && item.result === undefined
}

/**
 * Every first try still waiting for its try again, graded as Claude graded
 * it, on the day it was tried: once a new quiz replaces its quiz
 * (`isReplaced`), or a later day has come. A miss is never lost by leaving it.
 * The quiz is the one every window shares (sharedQuiz: the store's, this
 * window's own when the store holds none or an older one, or cannot be read):
 * a window open since a past day grades nothing another window graded or
 * replaced, and the try again it still shows gives way to the store's quiz.
 * Never while Claude grades an answer: a try again being graded is the
 * learner's own, and stands. What it graded: each question's number and mark.
 */
async function settleFirstTries($: EngineInterface, cfg: Config, now: number, isReplaced: boolean): Promise<{ n: number; mark: string }[]> {
  if (isQuizChecking) return []
  const here = await read($, quiz)
  const shared = await sharedQuiz($)
  if (!shared) return []
  const due = shared.items.flatMap((item, i) => (isTryWaiting(item) && (isReplaced || stamp(item.firstTry!.at).day !== stamp(now).day) ? [i] : []))
  // A try again this window shows that the store waits on no more (graded, or its quiz replaced, in another window).
  const isBehind = here !== null && here !== shared && here.items.some((item, i) => isTryWaiting(item) && (shared.at !== here.at || shared.items[i]?.result !== undefined))
  // Graded on the store's quiz, which this window shows from now on (the grades below read it back from here).
  if (here !== shared && (due.length > 0 || isBehind)) await update($, quiz, () => shared)
  const settled: { n: number; mark: string }[] = []
  for (const i of due) {
    const latest = (await lastQuiz($)) ?? shared
    const item = latest.items[i]
    if (latest.at !== shared.at) break
    if (!item || !isTryWaiting(item)) continue
    if ((await gradeFirstTry($, cfg, latest, i, 'wrong', { at: item.firstTry!.at })) !== 'kept') continue
    const graded = (await lastQuiz($))?.items[i]
    if (graded?.result !== undefined) settled.push({ n: i + 1, mark: resultMark(graded) })
  }
  return settled
}

/**
 * What the conversation is told before its reply once a day gone by graded first tries left waiting (settleFirstTries),
 * and the transcript once a session start graded them.
 */
function settledText(settled: readonly { n: number; mark: string }[]): string {
  return `날이 바뀌어 한 번 더를 기다리던 ${settled.map(one => `${one.n}번 (${one.mark})`).join(' · ')}은 첫 답의 판정대로 매겼습니다.`
}

/** What the pane says on Enter in a try again that another window graded meanwhile (tryGoneText). */
const GRADED_ELSEWHERE = '이 문제는 다른 창에서 이미 채점했습니다.'

/**
 * Before Claude grades a try again this window shows (its first try kept here): whether the quiz every window shares
 * (sharedQuiz) waits on it no more, another window having graded it (at its session start too: a past day's first
 * try, as Claude graded it, settleFirstTries) or replaced its quiz. That quiz is drawn here then, and what to say is
 * returned: Claude is not asked, and nothing is counted again. Undefined while the try again still waits.
 */
async function tryGoneText($: EngineInterface, current: Quiz, i: number): Promise<string | undefined> {
  if (current.items[i]?.firstTry === undefined) return undefined
  const shared = await sharedQuiz($)
  if (!shared) return undefined
  const isMoved = shared.at !== current.at
  if (!isMoved && shared.items[i]?.result === undefined) return undefined
  await showShared($, shared)
  return isMoved ? MOVED_TEXT : GRADED_ELSEWHERE
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
  // A new quiz being made replaces this one, and grades every first try still waiting as Claude graded it
  // (settleFirstTries), which it could not while this answer was graded: turned away as one sent by /learn 퀴즈 is,
  // and kept in its field.
  if (isQuizMaking) {
    await update($, quizRun, run => ({ ...run, error: MAKING_TEXT, draft: { at: current.at, i, text: mine } }))
    return
  }
  // A window open since a past day: its try again may have been graded in another window meanwhile (or its quiz
  // replaced there), which this window's quiz does not know. The store's quiz is drawn then, and Claude is not asked.
  const gone = await tryGoneText($, current, i)
  if (gone !== undefined) {
    await update($, quizRun, run => ({ ...run, error: gone, ...(isDraftOf(run, current.at, i) ? { draft: null } : {}) }))
    await focusNextQuestion($)
    return
  }
  if (mine === '') {
    // Recalling first, even wrongly, is what makes it stay: "모르겠어요" is the way out, the hint before the answer.
    const isHintLeft = item.hint !== undefined && item.isHinted !== true && item.firstTry === undefined
    await update($, quizRun, run => ({ ...run, error: `모르겠으면 '모르겠어요'라고 적고 Enter${isHintLeft ? ' · 막히면 h로 힌트' : ''}` }))
    return
  }
  isQuizChecking = true
  let error: string | null = null
  let isFirstTry = false
  try {
    await update($, quizRun, run => ({ ...run, checking: i, error: null, armedNew: null }))
    const graded = await gradeTyped($, cfg, current, i, mine)
    if ('error' in graded) error = graded.error
    else isFirstTry = graded.isFirstTry === true
  } catch (thrown) {
    void fault($, 'grade', faultCode(thrown), '답을 채점하지 못했습니다')
    error = '채점하지 못했습니다. 잠시 뒤 다시 해 보세요.'
  } finally {
    isQuizChecking = false
    // A grade that did not come back leaves the answer in that question's field to send again.
    await update($, quizRun, run => ({ ...run, checking: null, error: error ?? run.error, draft: error !== null ? { at: current.at, i, text: mine, isFailed: true } : null }))
  }
  if (error !== null) return
  // One try again: its own field, drawn empty, takes the keys (in the input mode the first answer was typed in).
  if (isFirstTry) focusInPane($, `${quizFieldKey(current.at, i)}-again`)
  else await focusNextQuestion($)
}

/** After a grade, the keys to the question the pane shows next: the first not graded, or s once all are. One whose answer was seen has no field; the ring stays put. */
async function focusNextQuestion($: EngineInterface): Promise<void> {
  const latest = await lastQuiz($)
  if (!latest) return
  const next = latest.items.findIndex(one => one.result === undefined)
  if (next === -1) focusInPane($, 'quiz-new')
  else if (isOpen(latest, latest.items[next]!)) focusInPane($, answerKey(latest, next))
}

/** The quiz as it stands now, in the session and the store. */
async function keepQuiz($: EngineInterface, next: Quiz): Promise<void> {
  await update($, quiz, () => next)
  try {
    await $.store.set(QUIZ_KEY, next)
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '퀴즈를 저장소에 남기지 못했습니다')
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
  const asked = await askModel($, cfg, 'ask', { system: ASK_SYSTEM, prompt: askPrompt(shown, masked, level, rules), maxTokens: 900 })
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
  const said = () => void fault($, 'focus', 'scroll', `${key} (${block}, ${PANE})로 스크롤하지 않았습니다`)
  const attempt = (left: number) => {
    if (personScrolls !== since) return
    void $.ui.scroll({ to: { key }, in: PANE, block }).then(
      result => {
        const next = revealNext(result.deny, left)
        if (next === 'again') $.clock.after(REVEAL_RETRY_MS, () => attempt(left - 1))
        else if (next === 'stop') said()
      },
      () => said(),
    )
  }
  attempt(REVEAL_TRIES)
}

/**
 * Moves the pane's focus ring onto an element it is about to draw: the next
 * answer field, or the button for a new quiz. Only while the pane holds the
 * keys: otherwise the engine says no, kept as a fault of the pane's focus once
 * every try was refused. Not awaited: the engine waits for the element's drawing, bounded.
 */
function focusInPane($: EngineInterface, key: string): void {
  const said = (tries: number) => {
    const what = `${key}로 초점을 옮기지 않았습니다 · ${tries}/${FOCUS_TRIES}`
    // A refusal the next try may still win (the usual first one after grading in a real terminal) is the debug log's alone.
    if (tries < FOCUS_TRIES) debugLog($, `learn-notes: ${what} (focus)`)
    else void fault($, 'focus', 'focus', what)
  }
  void (async () => {
    // The drawing that brings the field can also move the ring itself (onto the button left where the last field was):
    // asked again a moment later, the field wins. Each refusal is logged with its try.
    for (let tries = 0; tries < FOCUS_TRIES; tries += 1) {
      try {
        const result = await $.ui.focus({ requestId: PANE, key })
        if (result.deny === undefined) {
          faultOk($, 'focus')
          return
        }
        said(tries + 1)
      } catch {
        said(tries + 1)
      }
      if (tries + 1 === FOCUS_TRIES) return
      // A wait cut short (the module unloaded, the session ended) ends the tries.
      try {
        await $.clock.sleep(FOCUS_RETRY_MS)
      } catch {
        return
      }
    }
  })()
}

/** How often, and how far apart, a field is asked for the keys before giving up. */
const FOCUS_TRIES = 3
const FOCUS_RETRY_MS = 150

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
    void fault($, 'ask', faultCode(thrown), '질문에 답하지 못했습니다')
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

/** What is typed in each practice field, by its key (onInput): a redraw gives the field what was typed, not its first line. */
const drillDrafts = new Map<string, string>()
/** The note whose practice line Claude is checking now: one at a time. */
let drillChecking: string | null = null
/** The notes whose practice's example a is showing now: a second a before the first lands is dropped (교차 검토 6). */
const drillShowing = new Set<string>()
/** The feedback of a practice ended by a second "모르겠어요": what to do next, with no model call. */
const DRILL_BLANK_FEEDBACK = 'a로 예시 답을 읽어 보고, 다음에 이 개념이 나오면 다시 고쳐 보세요.'
/** Under a first try waiting for its try again where no field is drawn (the mobile app): where it goes, and a here. */
const DRILL_AGAIN_ELSEWHERE = '한 번 더는 터미널·데스크톱 패널에서 고칩니다 · a: 예시 답'
/** After the line under a practice's field while the terminal's pane does not hold the keys: they go to the field first, as a quiz's. */
const DRILL_KEYS_TAIL = ' · ctrl+x tab: 고칠 줄 칸으로'

/** A note's practice field: the first try's, and the try again's (a new element, holding the first try's line). */
function drillFieldKey(id: string, isAgain = false): string {
  return `drill-${id}${isAgain ? '-again' : ''}`
}

/** Drops what was typed in a note's practice fields: its try is over, or the note was written again. */
function dropDrillDrafts(id: string): void {
  drillDrafts.delete(drillFieldKey(id))
  drillDrafts.delete(drillFieldKey(id, true))
}

/** Where the keys go in a note's practice: its field while one is drawn, else a (its example) while it is to see, else t. */
function drillFocusKey(note: LearnNote): string {
  const state = note.drill
  if (!isDrillOver(state)) return drillFieldKey(note.id, state?.firstTry !== undefined)
  return state!.verdict !== undefined && state!.verdict !== 'right' && state!.isAnswerSeen !== true ? 'note-drill-answer' : 'note-drill'
}

/**
 * The pane's t under a note (1.7.0): its practice opened under the row of keys with no model call, the keys in its
 * field (once it is over, on a or t). Never touches a quiz: one still being answered stays as it is.
 */
async function openDrill($: EngineInterface, id: string): Promise<void> {
  await update($, drillRun, run => ({ ...run, open: id, notice: run.notice?.id === id ? run.notice : null }))
  const note = (await read($, notes)).find(one => one.id === id)
  if (note) focusInPane($, drillFocusKey(note))
}

/** The concept a note's practice goes over: the first the note taught (its 할 일 is asked of it), as the index has it now. */
async function drillConcept($: EngineInterface, note: LearnNote): Promise<{ key: string; one: LearnConcept } | undefined> {
  const first = note.concepts[0]
  if (first === undefined) return undefined
  const key = resolveKey(await read($, aliases), first)
  const one = conceptAt(await read($, concepts), key)
  return one ? { key, one } : undefined
}

/**
 * Enter in a note's practice field (1.7.0): the line checked. Empty, unchanged, or typed in a Korean input mode, it is
 * only said so, with no model call; any other goes to gradeDrill, the field giving way to "checking" meanwhile.
 * Checked, the keys go on: to the try again's field, or once it is over to a or t.
 */
async function checkDrill($: EngineInterface, cfg: Config, id: string, text: string): Promise<void> {
  const note = (await read($, notes)).find(one => one.id === id)
  if (!note || note.status !== 'ready') return
  const drill = drillOf(note.text, note.changes)
  const state = note.drill
  if (!drill || isDrillOver(state)) return
  const first = state?.firstTry
  drillDrafts.set(drillFieldKey(id, first !== undefined), text)
  const say = async (said: string, isError = false): Promise<void> => {
    await update($, drillRun, run => ({ ...run, open: id, notice: { id, text: said, ...(isError ? { isError: true as const } : {}) } }))
  }
  if (drillChecking !== null) return say('다른 줄을 확인하고 있습니다 · 잠시 뒤 다시 Enter', true)
  // A window open since a past day: another window may have ended this practice meanwhile (its session start). Its
  // grade is taken here then, and the try again is not checked nor counted a second time.
  const ended = await endedDrill($, note)
  if (ended) {
    await setNote($, id, { drill: ended })
    dropDrillDrafts(id)
    void persist($)
    await say(DRILL_ENDED_ELSEWHERE)
    const latest = (await read($, notes)).find(one => one.id === id)
    if (latest) focusInPane($, drillFocusKey(latest))
    return
  }
  const mine = text.trim()
  if (mine === '') return say(DRILL_EMPTY)
  if (!isBlankAnswer(mine)) {
    // The line as it was, or as the first try left it: nothing changed to check.
    if (sameLine(drill, mine, drill.line) || (first !== undefined && !isBlankAnswer(first.mine) && sameLine(drill, mine, first.mine))) return say(DRILL_UNCHANGED)
    if (isKoreanTyped(mine, `${drill.indent}${drill.line}`)) return say(DRILL_KOREAN)
  }
  drillChecking = id
  let error: string | undefined
  try {
    await update($, drillRun, run => ({ ...run, open: id, checking: id, notice: null }))
    const graded = await gradeDrill($, cfg, note, drill, mine)
    if ('error' in graded) error = graded.error
  } catch (thrown) {
    void fault($, 'grade', faultCode(thrown), '직접 해 보기를 확인하지 못했습니다')
    error = '확인하지 못했습니다. 잠시 뒤 다시 해 보세요.'
  } finally {
    drillChecking = null
    // A reload meanwhile ended this load: its word is refused, and the next load's session start draws the field again.
    await update($, drillRun, run => ({ ...run, checking: null, ...(error !== undefined ? { notice: { id, text: error, isError: true as const } } : {}) })).catch(() => undefined)
  }
  if (error !== undefined) return
  const latest = (await read($, notes).catch(() => [])).find(one => one.id === id)
  if (latest) focusInPane($, drillFocusKey(latest))
}

/**
 * A practice line graded (1.7.0), as a quiz's typed answer is: "모르겠어요" with no call (the hint the first time, then
 * over); the example's own line right with no call; any other checked by Claude once against what to do, the check
 * and the example, the lines around it sent with it (the note screened first). Short of right the first time, with a
 * question asked back, it waits for one try again; else it is over (finishDrill).
 */
async function gradeDrill($: EngineInterface, cfg: Config, note: LearnNote, drill: Drill, mine: string): Promise<{ isFirstTry?: true } | { error: string }> {
  const first = note.drill?.firstTry
  const now = await $.clock.now()
  const line = cut(mine, 1500)
  if (isBlankAnswer(mine)) {
    if (first === undefined) return keepDrillTry($, note.id, { mine: line, verdict: 'wrong', feedback: '', nudge: DRILL_HINT, at: now })
    return finishDrill($, cfg, note, drill, { mine: line, verdict: 'wrong', feedback: DRILL_BLANK_FEEDBACK }, { first, at: now })
  }
  if (sameLine(drill, mine, drill.example)) return finishDrill($, cfg, note, drill, { mine: line, verdict: 'right', feedback: '' }, { first, at: now })
  // The code as it may go to a model: a file the settings or the team file leave out now is not sent.
  const shown = await screened($, cfg, note)
  const sent = drillOf(shown.text, shown.changes)
  if (!sent) return { error: '이 줄은 지금 노트에서 빼는 파일에 있어 확인하지 않았습니다' }
  const name = (await drillConcept($, note))?.one.name ?? '직접 해 보기'
  const prompt = checkPrompt({ name, question: drillQuestion(sent), answer: sent.example, kind: 'modify' }, `${sent.indent}${mine}`, cfg.level, first)
  const asked = await askModel($, cfg, 'grade', { system: CHECK_SYSTEM, prompt, maxTokens: 480, timeoutMs: 60_000 })
  if ('error' in asked) return { error: `확인하지 못했습니다: ${asked.error}` }
  const graded = parseCheck(asked.text)
  if (!graded) {
    void fault($, 'grade', 'unreadable', '직접 해 보기의 확인 결과를 읽지 못했습니다')
    return { error: '확인 결과를 읽지 못했습니다. 다시 Enter를 눌러 보세요.' }
  }
  // The note written again meanwhile (w): its practice is another, and this line's grade is not kept on it.
  const latest = (await read($, notes)).find(one => one.id === note.id)
  if (!latest || latest.text !== note.text || isDrillOver(latest.drill)) return { error: '그사이 노트를 다시 써서 이 줄은 확인하지 않았습니다' }
  // The slip this line showed, asked for on its first grade only (after "모르겠어요" too), as a quiz's.
  const slip = (first === undefined || isBlankAnswer(first.mine)) && graded.slip !== undefined ? { slip: graded.slip, slipType: graded.slipType ?? ('other' as const) } : {}
  const nudge = first === undefined && graded.verdict !== 'right' ? keptNudge(graded.nudge, sent.example) : undefined
  if (nudge !== undefined && graded.verdict !== 'right') {
    return keepDrillTry($, note.id, { mine: line, verdict: graded.verdict, feedback: graded.feedback, nudge, at: now, ...slip })
  }
  const verdict = first && !isBlankAnswer(first.mine) ? secondVerdict(first.verdict, graded.verdict) : graded.verdict
  return finishDrill($, cfg, note, drill, { mine: line, verdict, feedback: graded.feedback, ...slip }, { first, at: now })
}

/** What a practice's try again says when another window ended the practice meanwhile (endedDrill). */
const DRILL_ENDED_ELSEWHERE = '이 연습은 다른 창에서 이미 매겼습니다'

/**
 * A practice this window shows waiting for its try again that the store holds over (1.7.0): another window ended it
 * meanwhile, at its session start too (settleDrillTries). The store's state then, for this window to take, so its try
 * again is not checked, nor its example's a counted, a second time. Undefined while the store agrees or cannot be read.
 */
async function endedDrill($: EngineInterface, note: LearnNote): Promise<LearnDrill | undefined> {
  if (note.drill?.firstTry === undefined || isDrillOver(note.drill)) return undefined
  try {
    const stored = (await storedNotes($, note.root || (await $.session.root()))).find(one => one.id === note.id)
    return stored && isDrillOver(stored.drill) ? stored.drill : undefined
  } catch {
    return undefined
  }
}

/** Keeps a practice's first try short of right on its note, for one try again: nothing marked or counted yet. */
async function keepDrillTry($: EngineInterface, id: string, first: LearnQuizFirstTry): Promise<{ isFirstTry: true }> {
  await setNote($, id, { drill: fitDrill({ firstTry: first, at: first.at }) })
  void persist($)
  return { isFirstTry: true }
}

/**
 * At a session start: each practice a past day left waiting for its try again ended as Claude graded its first try,
 * on the day it was tried (finishDrill: its concept marked, its miss kept as a slip, the day's count), as a quiz's
 * first try is (settleFirstTries). A miss is never lost by leaving it. One the store holds over already (another
 * window ended it) or whose line is being checked, or whose example is being shown (a), now is left; so is one whose
 * note no longer has its practice.
 */
async function settleDrillTries($: EngineInterface, cfg: Config, now: number): Promise<void> {
  const today = stamp(now).day
  const waiting = (await read($, notes)).filter(note => {
    const first = note.drill?.firstTry
    return first !== undefined && !isDrillOver(note.drill) && stamp(first.at).day !== today && drillChecking !== note.id && !drillShowing.has(note.id)
  })
  if (waiting.length === 0) return
  try {
    const root = await $.session.root()
    const stored = new Map<string, LearnNote>()
    for (const where of new Set(waiting.map(note => note.root || root))) for (const one of await storedNotes($, where)) stored.set(one.id, one)
    for (const note of waiting) {
      const first = note.drill!.firstTry!
      const drill = note.status === 'ready' ? drillOf(note.text, note.changes) : undefined
      if (!drill || isDrillOver(stored.get(note.id)?.drill)) continue
      const grade = { mine: first.mine, verdict: first.verdict, feedback: first.feedback, ...(first.slip !== undefined ? { slip: first.slip, slipType: first.slipType } : {}) }
      await finishDrill($, cfg, note, drill, grade, { at: first.at })
    }
  } catch (error) {
    void fault($, 'grade', faultCode(error), '지난 직접 해 보기를 매기지 못했습니다')
  }
}

/**
 * A practice over (1.7.0): its grade kept on the note, and as a quiz's grade counts, its concept (the first the note
 * taught, unless marked known) marked: right a step on (when due), right after a question asked back or the hint, or
 * once the example was seen (`isSeen`), its step kept; partly right a step back; wrong back to the first, and first in
 * the next quiz. A miss keeps its slip, the line as the answer. The day counts it right or wrong, as a practice (not
 * toward the day's review); no quiz is touched. The journal gets a section for it.
 */
async function finishDrill(
  $: EngineInterface,
  cfg: Config,
  note: LearnNote,
  drill: Drill,
  grade: Pick<LearnQuizItem, 'mine' | 'feedback' | 'slip' | 'slipType'> & { verdict: 'right' | 'partial' | 'wrong' },
  how: { first?: LearnQuizFirstTry; at: number; isSeen?: boolean },
): Promise<Record<string, never>> {
  const { first, at } = how
  const isRight = grade.verdict === 'right'
  const isHelped = first !== undefined || how.isSeen === true
  const state = fitDrill({
    mine: grade.mine ?? '',
    verdict: grade.verdict,
    feedback: grade.feedback ?? '',
    at,
    ...(isRight && first !== undefined && !isBlankAnswer(first.mine) ? { isRetried: true as const } : {}),
    ...(how.isSeen ? { isAnswerSeen: true as const } : {}),
  })
  await setNote($, note.id, { drill: state })
  dropDrillDrafts(note.id)
  void persist($)
  const found = await drillConcept($, note)
  if (found && !isKnown(found.one)) {
    const mark: Mark = how.isSeen || (isRight && isHelped) ? markHelped : isRight ? markReviewed : grade.verdict === 'partial' ? markPartial : markWrong
    if (await markConcepts($, cfg, mark, [found.key], at)) {
      const item: LearnQuizItem = {
        key: found.key,
        name: found.one.name,
        question: `직접 해 보기: ${drill.task}`,
        answer: drill.example,
        kind: 'modify',
        mine: grade.mine ?? '',
        verdict: grade.verdict,
        feedback: grade.feedback ?? '',
        result: isRight ? 'right' : 'wrong',
        ...(first !== undefined && !how.isSeen ? { firstTry: first } : {}),
        ...(grade.slip !== undefined ? { slip: grade.slip, slipType: grade.slipType ?? 'other' } : {}),
      }
      const isGraduated = conceptAt(await read($, concepts), found.key)?.knownAt === at
      await recordSlip($, found.key, slipChange(item, { isHelped, isGraduated }), at)
    }
  }
  await recordActivity($, stamp(at).day, isRight ? { right: 1, drills: 1 } : { wrong: 1, drills: 1 })
  if (cfg.isAutoSave) void saveDrill($, cfg, note, drill, state)
  return {}
}

/**
 * The pane's a under a note's practice (1.7.0): its example answer shown. Once tried and waiting for its try again,
 * that ends it as its first try was graded, the example seen (finishDrill), unless another window ended it meanwhile
 * (endedDrill: its grade taken, only shown); once graded, only shown. With no try, only where no field is drawn (the
 * mobile app): shown, nothing graded. A second a before the first lands is dropped (drillShowing), as a quiz's
 * second grading is: both would read the note before its example was seen, and end it twice.
 */
async function showDrillAnswer($: EngineInterface, cfg: Config, id: string, surface?: RenderSurface): Promise<void> {
  if (drillShowing.has(id)) return
  drillShowing.add(id)
  try {
    await showDrillAnswerOnce($, cfg, id, surface)
  } finally {
    drillShowing.delete(id)
  }
}

/** showDrillAnswer's work, one at a time for a note. */
async function showDrillAnswerOnce($: EngineInterface, cfg: Config, id: string, surface?: RenderSurface): Promise<void> {
  const note = (await read($, notes)).find(one => one.id === id)
  const drill = note && note.status === 'ready' ? drillOf(note.text, note.changes) : undefined
  if (!note || !drill || drillChecking === id) return
  const state = note.drill
  if (state?.isAnswerSeen === true) return
  const now = await $.clock.now()
  if (state?.verdict !== undefined) await setNote($, id, { drill: { ...state, isAnswerSeen: true } })
  else if (state?.firstTry !== undefined) {
    // Ended in another window meanwhile (endedDrill): its grade taken and the example shown, nothing counted again.
    const ended = await endedDrill($, note)
    if (ended) {
      await setNote($, id, { drill: { ...ended, isAnswerSeen: true } })
      dropDrillDrafts(id)
      await update($, drillRun, run => ({ ...run, open: id, notice: run.notice?.id === id ? null : run.notice }))
      void persist($)
      if (surface !== 'mobile') focusInPane($, 'note-drill')
      return
    }
    const first = state.firstTry
    const grade = { mine: first.mine, verdict: first.verdict, feedback: first.feedback, ...(first.slip !== undefined ? { slip: first.slip, slipType: first.slipType } : {}) }
    await finishDrill($, cfg, note, drill, grade, { at: now, isSeen: true })
  } else if (surface === 'mobile') await setNote($, id, { drill: { isAnswerSeen: true, at: now } })
  else return
  await update($, drillRun, run => ({ ...run, open: id, notice: run.notice?.id === id ? null : run.notice }))
  void persist($)
  if (surface !== 'mobile') focusInPane($, 'note-drill')
}

/** Appends a practice's grade to the journal its note is in, after any save still running; the note's request and words screened first. */
function saveDrill($: EngineInterface, cfg: Config, note: LearnNote, drill: Drill, state: LearnDrill): Promise<string | undefined> {
  return enqueue('saving', async () => {
    try {
      const shown = await screened($, cfg, note)
      const section = drillSection(shown, { task: redactText(drill.task).text }, state, state.at)
      // Into the journal of the note's own day: a practice never makes a journal day with no notes.
      return await appendJournal($, cfg, note.root || (await $.session.root()), note.at, section)
    } catch (error) {
      void fault($, 'save', faultCode(error), '직접 해 보기를 파일에 쓰지 못했습니다')
      return undefined
    }
  })
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
 * for it, not the learner (it counts toward dailyAutoNotes); `isRetry`: the
 * one try again of such a note (armRetry, or resumeNotes for one that waited
 * for it), counted as a call but not toward the limit, and never tried again
 * itself; `isResume`: a reload's session start took it up (resumeNotes);
 * `copy`: the note as the store holds it, for a try again whose note a /cd
 * took from the pane (retryNote). An automatic note whose call failed in a
 * way that clears on its own waits for one try again instead of failing. A
 * rewrite that fails leaves the note as it was and says why in a toast.
 * Never rejects.
 */
async function writeNote(
  $: EngineInterface,
  cfg: Config,
  id: string,
  how: { isRewrite?: boolean; isAuto?: boolean; isRetry?: boolean; isResume?: boolean; copy?: LearnNote } = {},
): Promise<void> {
  const { isRewrite = false, isAuto = false, isRetry = false, isResume = false, copy } = how
  if (inFlight.has(id)) {
    // Being written already (a w just before): a reload's take-up has nothing left to do.
    if (isResume) resuming.delete(id)
    return
  }
  inFlight.add(id)
  // Written now (a w while it waits, or the try again itself): its timer has nothing left to do.
  retryTimers.get(id)?.cancel()
  retryTimers.delete(id)
  // A take-up is drawn as one until its call is over (noteBody); any other write ends one still to start.
  if (!isResume) resuming.delete(id)
  try {
    const prior = copy ?? (await read($, notes)).find(one => one.id === id)
    if (!prior) return
    // A note counts toward the day's learning the first time it is written, never on a rewrite.
    const isCounted = prior.isCounted === true || prior.status === 'ready'
    // The note it replaces: one being written again still that a reload cut and nothing put back holds it as `previous`.
    const good: LearnNote['previous'] = prior.status === 'ready' ? { status: 'ready', text: prior.text } : prior.previous
    // Written now, it is no longer one a turn's end passed over. Its try again keeps its mark while the call runs,
    // so a reload that cuts it takes it up as that try, never a third call (resumeNotes); a reload's take-up stays
    // marked through its own try again. A w starts the note over: no try again waits any more, and a reload may
    // take it up once. A ready note keeps what it was while it is written again (`previous`): a reload that cuts the
    // call, which leaves this load nothing it may write, has the next load put it back (resumeNotes).
    const start: Partial<LearnNote> = {
      status: 'writing',
      text: '',
      skip: undefined,
      quota: undefined,
      retry: isRetry ? prior.retry : undefined,
      resumed: isResume || (isAuto && prior.resumed === true) ? true : undefined,
      previous: good,
    }
    const note = (await setNote($, id, start)) ?? (copy ? { ...copy, ...start } : undefined)
    if (!note) return
    const rules = await teamOf($, note.root)
    const asked = await askModel(
      $,
      cfg,
      'note',
      {
        system: SYSTEM,
        // A note kept before 1.6.0, written again, was never screened.
        prompt: notePrompt(await screened($, cfg, note), cfg.level, knownNames(await read($, concepts)), rules),
        maxTokens: 1500,
      },
      isRetry ? 'retry' : isAuto ? 'auto' : 'manual',
    )
    // Counted in the usage record now (or never made): no longer one being written.
    autoPending.delete(id)
    if ('error' in asked && good) {
      // Only the new version failed: the note it was to replace stays, in the pane, the store and the journal.
      const kept = (await setNote($, id, { ...good, previous: undefined })) ?? { ...note, ...good, previous: undefined }
      // A store write meanwhile (another turn, a question) may hold it as being written: store it as it is again.
      await persist($, false, [kept])
      $.ui.toast(`노트를 다시 쓰지 못했습니다: ${asked.error} · 원래 노트는 그대로입니다`, { timeoutMs: 8000 })
      return
    }
    // Cut short, and not by its own time limit: the plugin's environment is going, a reload's or the session's
    // end. The note stays as being written, nothing saved or stored from here: the next load takes it up, or says it
    // stopped and journals it (resumeNotes); after a session's end the next session journals it (journalLeft).
    if ('error' in asked && asked.fail?.reason === 'aborted' && asked.fail.isTimeout !== true && isInteractive) return
    // A busy server, a server error, a dropped connection or the call's own time limit clears on its own: a note a
    // turn's end asked for tries once more by itself, half a minute on (and a little more, so windows do not all ask
    // at once). Not in a -p run, whose process ends with its turn; never a try again's own failure.
    if ('error' in asked && asked.transient !== undefined && isAuto && isInteractive && !isRetry) {
      const now = await $.clock.now()
      const wait = RETRY_MS + Math.floor(Math.random() * RETRY_JITTER_MS)
      const token = `${id}:${now}`
      // Armed first: the pane drawn from the write below shows the wait, not the call this write still counts as.
      if (armRetry($, cfg, id, token, wait, note.root)) {
        const patch: Partial<LearnNote> = { status: 'writing', text: '', retry: { at: now + wait, token, why: asked.transient }, previous: undefined }
        // Not unsaved: nothing refused it. A session that ends while it waits leaves it to the next (journalLeft).
        // One a /cd took from the pane meanwhile waits in the store, under its own project (retryNote finds it there).
        const waiting = (await setNote($, id, patch)) ?? { ...note, ...patch, updatedAt: Math.max(now, note.updatedAt + 1) }
        await persist($, false, [waiting])
        return
      }
    }
    const patch: Partial<LearnNote> =
      'error' in asked
        ? { status: 'failed', text: asked.fail ? noteFailText(asked.fail, cfg.model) : `${asked.error} · w로 다시 쓰기`, retry: undefined, previous: undefined }
        : { status: 'ready', text: closeConceptBold(cut(asked.text, 9000)), retry: undefined, drill: undefined, previous: undefined }
    // A note cleared from the pane meanwhile, or left behind by a /cd, is still saved and stored from this copy.
    let done = (await setNote($, id, patch)) ?? { ...note, ...patch }
    // Written again, its practice is a new one: what was typed for the old one goes.
    if (done.status === 'ready') dropDrillDrafts(id)
    if (done.status === 'ready') {
      try {
        const keys = await learnConcepts($, cfg, done)
        done = (await setNote($, id, { concepts: keys })) ?? { ...done, concepts: keys }
        if (!isCounted) await recordActivity($, stamp(done.at).day, { notes: 1 })
        if (!done.isCounted) done = (await setNote($, id, { isCounted: true })) ?? { ...done, isCounted: true }
      } catch (error) {
        void fault($, 'note', faultCode(error), '노트의 개념을 세지 못했습니다')
      }
    }
    // autoSave off means no journal, nothing more: the note stays in the pane and the store.
    if (cfg.isAutoSave) {
      const path = await save($, cfg, done, isRewrite)
      // The pane's copy says so already (saveNow); one a /cd took from the pane is stored saying so too.
      done = { ...done, ...(path ? { savedAs: done.status, isUnsaved: false } : { isUnsaved: true }) }
    }
    await persist($, false, [done])
    if (done.status === 'ready') await announceNote($, done)
  } catch (error) {
    void fault($, 'note', faultCode(error), '노트를 쓰지 못했습니다')
  } finally {
    inFlight.delete(id)
    autoPending.delete(id)
    resuming.delete(id)
  }
}

/**
 * Arms an automatic note's one try again, `wait` from now (see LearnNote.retry), for the note of project `root`;
 * false when no timer could be had. A reload cancels it with the rest of this load: the next load's session start
 * takes the note up (resumeNotes).
 */
function armRetry($: EngineInterface, cfg: Config, id: string, token: string, wait: number, root: string): boolean {
  retryTimers.get(id)?.cancel()
  try {
    retryTimers.set(
      id,
      $.clock.after(wait, () => {
        retryTimers.delete(id)
        void retryNote($, cfg, id, token, root)
      }),
    )
    return true
  } catch {
    retryTimers.delete(id)
    return false
  }
}

/**
 * The try again armRetry set: made only while the note still waits with `token` and is not being written. Where
 * the pane no longer holds it so (a /cd took it away, or brought it back read from the store), the store's copy
 * under `root` says whether it still waits; a /learn 비우기 left none. A w meanwhile cancelled the timer. Never rejects.
 */
async function retryNote($: EngineInterface, cfg: Config, id: string, token: string, root: string): Promise<void> {
  try {
    if (inFlight.has(id)) return
    const one = (await read($, notes)).find(note => note.id === id)
    if (one?.status === 'writing' && one.retry?.token === token) {
      await writeNote($, cfg, id, { isRewrite: one.savedAs !== null, isAuto: true, isRetry: true })
      return
    }
    const copy = await waitingCopy($, root, id, token)
    if (copy) await writeNote($, cfg, id, { isRewrite: copy.savedAs !== null, isAuto: true, isRetry: true, copy })
  } catch (error) {
    void fault($, 'note', faultCode(error), '노트를 다시 쓰지 못했습니다')
  }
}

/** The store's copy of note `id` of project `root` while it still waits for its try again with `token` (LearnNote.retry). */
async function waitingCopy($: EngineInterface, root: string, id: string, token: string): Promise<LearnNote | undefined> {
  const raw = await $.store.get(HISTORY_KEY)
  const entry = isRecord(raw) ? raw[root] : undefined
  if (!isRecord(entry) || !Array.isArray(entry.notes)) return undefined
  const clearedAt = typeof entry.clearedAt === 'number' ? entry.clearedAt : 0
  const one: unknown = entry.notes.find(note => isRecord(note) && note.id === id)
  if (!isRecord(one) || one.status !== 'writing' || !isRecord(one.retry) || one.retry.token !== token) return undefined
  const read = fromHistory(one, root)
  // As this session left it: being written, waiting (fromHistory reads it back as a past session's failed one).
  return read && read.at > clearedAt ? { ...read, status: 'writing', text: '', isPast: false, retry: one.retry as LearnNote['retry'] } : undefined
}

/** What a reload's session start says when it put back a ready note whose rewrite (w) the reload cut (resumeNotes). */
const REWRITE_CUT_TEXT = '다시 불러오는 사이 노트 다시 쓰기가 끊겼습니다 · 원래 노트는 그대로입니다 · w로 다시 쓰기'

/**
 * At a session start that is a reload (`/reload-plugins`, a /config change): each note the last load left being
 * written (its call cut, or the timer of its try again cancelled) whose turn ended within RESUME_MS is written
 * again by itself, once (isResumable): one that waited for its try again, or whose try again the reload cut, as
 * that try (outside the day's limit), any other as a turn's end would (within it). Only with automatic notes on,
 * in an interactive session. Any other such note stopped for good: it fails, saying it was cut (w writes it), and
 * the journal gets it now if it never had it. A ready note the learner was writing again (w, `previous`) is put back
 * as it was, never failed or written by itself: a toast says the rewrite was cut, for the next w. A first session
 * start finds none: the notes it brings back from the store read as failed, or as they were before a w (fromHistory),
 * and those a session left are journalLeft's.
 */
async function resumeNotes($: EngineInterface, cfg: Config): Promise<void> {
  try {
    const now = await $.clock.now()
    const day = stamp(now).day
    const stopped: LearnNote[] = []
    const restored: LearnNote[] = []
    for (const one of await read($, notes)) {
      if (one.status !== 'writing' || inFlight.has(one.id) || resuming.has(one.id)) continue
      if (one.previous) {
        const back = await setNote($, one.id, { ...one.previous, previous: undefined, retry: undefined })
        if (back) restored.push(back)
        continue
      }
      const isRetry = one.retry !== undefined
      if (cfg.isAutoNote && isInteractive && isResumable(one, now) && (isRetry || !isLimitReached(cfg, day))) {
        resuming.add(one.id)
        if (!(await setNote($, one.id, { resumed: true }))) {
          resuming.delete(one.id)
          continue
        }
        // Counted toward the day's limit from now, as a turn's end counts its note.
        if (!isRetry) autoPending.add(one.id)
        $.clock.after(1, () => void writeNote($, cfg, one.id, { isRewrite: one.savedAs !== null, isAuto: true, isRetry, isResume: true }))
        continue
      }
      // Its try again still to come in this load (a session start of the same load): left to it.
      if (retryTimers.has(one.id)) continue
      const done = await setNote($, one.id, { status: 'failed', text: noteFailText({ reason: 'aborted' }, cfg.model), retry: undefined })
      if (done) stopped.push(done)
    }
    if (stopped.length === 0 && restored.length === 0) return
    if (cfg.isAutoSave) {
      for (const one of stopped) if (one.savedAs === null) await save($, cfg, one, false)
    }
    await persist($)
    if (restored.length > 0) $.ui.toast(REWRITE_CUT_TEXT, { timeoutMs: 8000 })
  } catch (error) {
    void fault($, 'note', faultCode(error), '다시 불러온 뒤 노트를 이어 쓰지 못했습니다')
  }
}

/**
 * At a session start, the notes the store holds for project `root` that a session left being written (it ended
 * mid-call, or while one waited for its try again) and the journal never took (isLeftWriting): each goes into the
 * journal as this session reads it back (failed, w writes it) and is stored so, quietly, as nothing refused it.
 * One whose copy changed within LEFT_MS may be another window's still, being written: looked at again once that
 * has passed (`seen`, its copy's time then), and journaled only if no window changed it meanwhile. This load's own
 * notes are resumeNotes'. `history`: the store's notes as the session start read them (shared with checkAtStart),
 * for the first look; a later look reads them anew. Never rejects.
 */
async function journalLeft(
  $: EngineInterface,
  cfg: Config,
  root?: string,
  seen?: ReadonlyMap<string, number>,
  history?: { raw: unknown },
): Promise<void> {
  if (!cfg.isAutoSave) return
  try {
    const where = root ?? (await $.session.root())
    const now = await $.clock.now()
    const raw = seen === undefined && history ? history.raw : await $.store.get(HISTORY_KEY)
    const entry = isRecord(raw) ? raw[where] : undefined
    if (!isRecord(entry) || !Array.isArray(entry.notes)) return
    const clearedAt = typeof entry.clearedAt === 'number' ? entry.clearedAt : 0
    const pane = await read($, notes)
    const later = new Map<string, number>()
    const left: LearnNote[] = []
    for (const one of entry.notes as unknown[]) {
      const read = fromHistory(one, where)
      if (!read || read.at <= clearedAt || read.savedAs !== null) continue
      // First look: left being written. A later one: the same copy as then (this session may have stored it read back).
      if (seen ? seen.get(read.id) !== read.updatedAt : !isLeftWriting(one, now)) continue
      const mine = pane.find(note => note.id === read.id)
      if (mine?.status === 'writing' || inFlight.has(read.id) || resuming.has(read.id) || retryTimers.has(read.id)) continue
      if (now - read.updatedAt < LEFT_MS) later.set(read.id, read.updatedAt)
      else left.push(mine ?? read)
    }
    for (const note of left) {
      const path = await save($, cfg, note, false)
      // Stored as saved (or as unsaved, the journal having refused it): the pane's copy where it has one, else this.
      await persist($, false, [{ ...note, savedAs: path ? note.status : null, isUnsaved: path ? false : true, updatedAt: Math.max(now, note.updatedAt + 1) }])
    }
    if (later.size > 0) {
      const due = Math.max(...[...later.values()].map(at => at + LEFT_MS - now))
      $.clock.after(due, () => void journalLeft($, cfg, where, later))
    }
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '지난 세션이 쓰다 둔 노트를 일지에 남기지 못했습니다')
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
    void fault($, 'capture', faultCode(error), '명령이 바꿀 파일을 미리 읽지 못했습니다')
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
    void fault($, 'capture', faultCode(error), `${tool} 명령의 변경을 잡지 못했습니다`)
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
    void fault($, 'team', faultCode(error), '팀 규칙 파일을 읽지 못했습니다')
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

/** Bytes past which a team term's file is not read (1.7.0 D6): a question shows QUIZ_CODE_BUDGET characters of it at most. */
const TERM_READ_MAX = 200_000
/** Characters of a team term's words a quiz asks it by; what the concept index keeps of them once it is met. */
const TERM_ASK_TEXT = 300
const TERM_SEED_TEXT = 160

/**
 * The lines of the repository file a team term's words name (termSource), as a quiz carries them (1.7.0 D6): read
 * only when the file, every link followed, lies inside the repository, is a file of TERM_READ_MAX bytes at most,
 * neither excludePaths nor the team file's `## 빼기` leave it out (nor where a link leads), it is no secret, lock or
 * generated file nor a local settings file (isTermSecretFile), and the permission rules let it be read; then cut
 * (termLines) and its secrets masked. Undefined when any of that fails or the lines hold nothing to ask from: the term
 * is asked from its words alone. Never rejects.
 */
async function readTermCode($: EngineInterface, cfg: Config, file: TeamFile, term: TeamTerm): Promise<TeamCode | undefined> {
  const source = termSource(term.blurb)
  if (!source) return undefined
  try {
    const root = await $.session.root()
    if (!root) return undefined
    const top = (await $.fs.stat(root, { resolve: true })).realPath
    const path = `${root.replace(/[\\/]+$/, '')}/${source.path}`
    if (top === undefined || !(await $.fs.exists(path))) return undefined
    const stat = await $.fs.stat(path, { resolve: true })
    const real = stat.realPath
    if (real === undefined || !isUnder(real, top) || stat.kind !== 'file' || stat.size > TERM_READ_MAX) return undefined
    const patterns = [...cfg.excludePaths, ...file.exclude]
    // A link inside the repository is judged by where it leads too: a `.env` under another name stays out.
    const inner = real.replace(/\\/g, '/').slice(top.replace(/\\/g, '/').replace(/\/+$/, '').length + 1)
    // Nor where it leads into the repository's own record (.git): a link's name says nothing of that.
    if (isVcsPath(inner) || withheldOf(source.path, path, patterns) !== undefined || withheldOf(inner, real, patterns) !== undefined) return undefined
    // Nor a local settings file (wp-config.php, appsettings.json): its passwords are written in forms no rule masks.
    if (isTermSecretFile(source.path) || isTermSecretFile(inner)) return undefined
    if ((await isReadDenied($, path)) || (real !== path && (await isReadDenied($, real)))) return undefined
    const text = String(await $.fs.read(path))
    // Not text: nothing a question could quote.
    if (text.includes('\u0000')) return undefined
    const isDoc = isTermDoc(source.path)
    const lines = termLines(text, term.name, source, isDoc)
    if (!lines) return undefined
    const masked = redactLines(lines.text.split('\n'), isConfigFile(source.path)).lines.join('\n')
    return { file: baseName(source.path), from: lines.from, to: lines.to, text: masked, ...(isDoc ? { isDoc: true as const } : {}) }
  } catch (error) {
    void fault($, 'team', faultCode(error), '팀 용어의 코드를 읽지 못했습니다')
    return undefined
  }
}

/** The concepts that came in as team terms, as the store has them now (merges followed), else as the pane's mirror has them. */
async function storedTeamTerms($: EngineInterface, map: Readonly<Record<string, string>>): Promise<Record<string, string[]>> {
  try {
    return cleanTeamTerms(await $.store.get(TEAM_TERMS_KEY), map)
  } catch {
    return cleanTeamTerms(await read($, teamTerms), map)
  }
}

/**
 * Marks the concept under `key` a team term of the repository `tag` (1.7.0 D6; this one's when none is given), in the
 * store and the pane's mirror, after any store write still running: its quizzes there then ask it by the team's code,
 * and its line says `· 팀 용어`. Nothing while the schema guard is on, or once it is marked so; never fails the caller.
 */
function markTeamTerm($: EngineInterface, key: string, given?: string): Promise<void> {
  return enqueue('storing', async () => {
    try {
      if (await isStoreAhead($)) return
      const root = given === undefined ? await $.session.root() : undefined
      const tag = given ?? (root ? rootTag(root) : undefined)
      if (tag === undefined) return
      const map = cleanAliases(await $.store.get(ALIASES_KEY))
      const at = resolveKey(map, key)
      const stored = cleanTeamTerms(await $.store.get(TEAM_TERMS_KEY), map)
      const next = isTeamTerm(stored, at, tag) ? stored : withTeamTerm(stored, at, tag)
      if (next !== stored) await $.store.set(TEAM_TERMS_KEY, next)
      if (JSON.stringify(next) !== JSON.stringify(await read($, teamTerms))) await update($, teamTerms, () => next)
    } catch (error) {
      void fault($, 'store', faultCode(error, 'store'), '팀 용어 표시를 남기지 못했습니다')
    }
  })
}

/**
 * What a team term's first grade puts in the concept index (1.7.0 D6): its name, and the team's words without the
 * path, short and masked, as the quiz kept them when it was made; for a question kept without them, the team file's
 * here, unless the quiz was made in another repository.
 */
async function teamSeed($: EngineInterface, item: LearnQuizItem): Promise<{ name: string; blurb: string }> {
  if (item.teamBlurb !== undefined) return { name: item.name, blurb: item.teamBlurb }
  const root = await $.session.root()
  const isHere = item.teamTag === undefined || (Boolean(root) && rootTag(root) === item.teamTag)
  const map = await read($, aliases)
  const term = isHere ? (await teamHere($))?.practice.find(one => termKey(one, map) === resolveKey(map, item.key)) : undefined
  return { name: item.name, blurb: term ? termBlurb(term.blurb, TERM_SEED_TEXT) : '' }
}

/** This repository's team terms not met yet (1.7.0 D6), the team file read again if it changed. */
async function teamTermsLeft($: EngineInterface): Promise<number> {
  const file = await teamOf($, '')
  return file ? unmetTerms(file.practice, await read($, concepts), await read($, aliases)).length : 0
}

/**
 * The places of a new review quiz its review fills before any team term, as makeQuiz counts them: the concepts due
 * and the slips to ask again (`open` the slips still open), each once.
 */
function reviewFilled(index: Readonly<Record<string, LearnConcept>>, open: Readonly<Record<string, LearnSlip>>, now: number): number {
  return new Set([...dueConcepts(index, now).map(one => one.key), ...slipsToAsk(index, open, now)]).size
}

/**
 * Where the pane sends the learner to practise this repository's team terms: s in the quiz view, unless the review
 * alone fills a quiz (`filled`, reviewFilled).
 */
function teamWay(filled: number): TeamWay {
  return filled >= 3 ? '/learn 퀴즈 팀' : '4에서 s'
}

/**
 * Once per repository (1.7.0 D6), at an interactive session's start: a toast that its team file's terms not met yet
 * can be practised, and where: /learn 퀴즈 while its new quiz has room for them, else (the review fills it, or a quiz
 * still open would be shown first) the team's own quiz. None in the session the welcome toast showed in (nor is the
 * repository marked then, so the next session says it), in a cloud session, or with every term met. Marked first, as
 * the welcome is: a store that takes no writes never shows it again and again. Never fails the start.
 */
async function nudgeTeam($: EngineInterface): Promise<void> {
  if (!isInteractive || isWelcomedNow || (await isCloudSession($))) return
  try {
    const file = await teamHere($)
    const index = await read($, concepts)
    const unmet = file ? unmetTerms(file.practice, index, await read($, aliases)).length : 0
    const root = await $.session.root()
    if (unmet === 0 || !root) return
    const tag = rootTag(root)
    const nudged = cleanNudged(await $.store.get(TEAM_NUDGED_KEY))
    if (nudged.includes(tag)) return
    await $.store.set(TEAM_NUDGED_KEY, [...nudged, tag].slice(-TEAM_NUDGED_KEPT))
    // Three concepts due (or slips to ask again) fill a quiz by themselves, and /learn 퀴즈 shows an open quiz first:
    // then the team's own quiz is where the terms are.
    const now = await $.clock.now()
    const last = await lastQuiz($)
    const isOpenQuiz = last !== null && last.items.some(item => isOpen(last, item))
    const room = teamWay(reviewFilled(index, await storedSlips($, await read($, aliases), now), now)) === '4에서 s'
    const way = room && !isOpenQuiz ? '/learn 퀴즈' : '/learn 퀴즈 팀'
    $.ui.toast(teamNudgeText(unmet, way), { timeoutMs: 8000 })
  } catch (error) {
    void fault($, 'store', faultCode(error, 'store'), '팀 용어 안내를 남기지 못했습니다')
  }
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

/** What a question in a /learn quiz list says before itself: its grade (and help), Claude grading it now, a try again waiting, or its answer seen. */
function quizItemState(current: Quiz, item: LearnQuizItem, isChecking: boolean): string {
  if (item.result !== undefined) return `${resultMark(item)}${helpText(item)} · `
  if (isChecking) return '채점 중 · '
  if (item.firstTry !== undefined) return '한 번 더 · '
  return isAnswerShown(current, item) ? '정답 봄 · ' : ''
}

/**
 * The one place a question's title gives to how it is asked, after its number: a worked example first (1.8.0, 풀이
 * 보고 풀기), a slip still open asked again (1.7.0, 다시 도전), or its code changed (비슷한 코드) or never seen (처음
 * 보는 코드); none for the learner's own code, as in 1.7. Its slip is not said before an answer.
 */
function rungName(item: LearnQuizItem): string | undefined {
  if (item.rung === 'worked') return RUNG_LABEL.worked
  if (item.isRetry) return '다시 도전'
  return item.rung === 'changed' || item.rung === 'new' ? RUNG_LABEL[item.rung] : undefined
}

/** What stands before a question in the conversation for how it is asked (rungName). */
function rungMark(item: LearnQuizItem): string {
  const name = rungName(item)
  return name ? `(${name}) ` : ''
}

/** What stands before a team term's question in the conversation (1.7.0 D6): that it is one, and where its lines are. */
function teamMark(item: LearnQuizItem): string {
  if (!item.team) return ''
  return item.teamCode ? `(팀 용어 · ${item.teamCode.isDoc ? '팀 노트' : '팀 코드'} ${teamCodeLabel(item.teamCode)}) ` : '(팀 용어) '
}

/**
 * A graded question's line about its concept's slip (slipNotice) as the conversation says it: where the pane
 * offers n for the note that taught it, the note is found by its name. Only while a note did (the quiz found it in
 * one): a team term no note taught (1.7.0 D6), or a concept whose notes are gone, has none to find.
 */
async function slipLineText($: EngineInterface, item: LearnQuizItem): Promise<string | undefined> {
  const record = slipAt(await read($, slips), resolveKey(await read($, aliases), item.key))
  const notice: SlipNotice | undefined = slipNotice(item, record, isHelpedGrade(item))
  if (!notice) return undefined
  if (notice.kind !== 'again') return notice.text
  const taught = item.noteId !== undefined ? ` · 이 개념을 배운 노트: /learn 찾기 ${item.name}` : ''
  // Missed twice running (1.8.0): the next review quiz shows a worked example first, said before where the note is.
  return `${notice.text}${isWorkedNext(record, item) ? ` · ${WORKED_NEXT}` : ''}${taught}`
}

/**
 * A graded team term's line (1.7.0 D6) as the conversation says it, when its grade put it in the concept index: a
 * miss's place in the next quiz unless a line above says it already (`isSaid`).
 */
async function teamLineText($: EngineInterface, item: LearnQuizItem, isSaid: boolean): Promise<string | undefined> {
  if (!isTeamAdded(item, await read($, concepts), await read($, aliases))) return undefined
  return teamAddedText(isFullMiss(item) && !isSaid)
}

/** How a try again is sent in the conversation, and the answer asked for instead. */
function againText(n: number): string {
  return `한 번 더: /learn 퀴즈 ${n} 새 답 · 정답: /learn 퀴즈 정답 ${n}`
}

/**
 * How to go on to question `i` in the conversation: its try again when a first try waits there, else an answer
 * to type (and its hint while unseen, when `withHint`).
 */
function nextText(current: Quiz, i: number, withHint = false): string {
  const item = current.items[i]!
  if (item.firstTry !== undefined) return againText(i + 1)
  return `다음 문제: /learn 퀴즈 ${i + 1} 내 답${withHint && item.hint !== undefined && item.isHinted !== true ? ' · 막히면 /learn 퀴즈 힌트' : ''}`
}

/**
 * A question in a /learn quiz list, with what its try again is asked under when one waits: the answer typed
 * first and the question asked back (or, after "모르겠어요", the hint), seen again where no pane shows them.
 */
function listedQuestion(current: Quiz, item: LearnQuizItem, isChecking: boolean): string {
  const head = `${quizItemState(current, item, isChecking)}${rungMark(item)}${teamMark(item)}${item.question}`
  const first = item.firstTry
  if (first === undefined || item.result !== undefined || isChecking) return head
  const mine = isBlankAnswer(first.mine) ? [] : [`내 답: ${cut(first.mine.replace(/\s+/g, ' '), 80)}`]
  return [head, ...mine, `${nudgeLabel(first)}: ${first.nudge}`].join('\n')
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
  const lines = current.items.map((item, i) => listItem(i + 1, listedQuestion(current, item, i === checking)))
  const open = firstOpen(current, checking)
  const seen = current.items.flatMap((item, i) => (item.result === undefined && i !== checking && isAnswerShown(current, item) ? [i + 1] : []))
  const next =
    open === -1 ? '모두 채점했거나 정답을 봤습니다' : current.items[open]!.firstTry !== undefined ? againText(open + 1) : `답을 적어 채점받기: /learn 퀴즈 ${open + 1} 내 답`
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
    // Short of right the first time: where it went, the question asked back (or the hint), and how to try again.
    const first = graded.isFirstTry ? graded.item.firstTry : undefined
    if (first !== undefined) {
      return [
        ...(lead ? [lead, ''] : []),
        `${n}번 ${firstTryHead(first)}${first.feedback !== '' ? ` · ${first.feedback}` : ''}`,
        `${nudgeLabel(first)}: ${first.nudge}`,
        againText(n),
      ].join('\n')
    }
    const after = (await lastQuiz($)) ?? current
    const next = after.items.findIndex(one => isOpen(after, one))
    const right = after.items.filter(one => one.result === 'right').length
    const index = await read($, concepts)
    const days = await read($, activity)
    const at = await $.clock.now()
    const finished = reviewDoneText(todayReview(index, days, at), days, at)
    const tail =
      next !== -1
        ? nextText(after, next, true)
        : after.items.every(one => one.result !== undefined)
          ? `다 풀었습니다: ${after.items.length}문제 중 ${right}개 맞힘.${missesText(after.items) ? ` ${missesText(after.items, '. ')}.` : ''}${finished ? ` ${finished}.` : ''}`
          : ''
    const done = graded.item
    const graduated = graduatedIn([done], index, await read($, aliases))
    const slipLine = await slipLineText($, done)
    const teamLine = await teamLineText($, done, slipLine !== undefined)
    return [
      ...(lead ? [lead, ''] : []),
      `${n}번 ${resultMark(done)}${helpText(done)} · ${VERDICT_TEXT[done.verdict ?? 'wrong']} ${done.feedback ?? ''}`.trim(),
      ...(teamLine ? [teamLine] : []),
      ...(slipLine ? [slipLine] : []),
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
async function answerText($: EngineInterface, cfg: Config, current: Quiz, said: number | undefined): Promise<string> {
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
  // After a first try, seeing the answer grades it (as Claude graded the first try): no grade left to give.
  if (item.result === undefined) await showAnswer($, cfg, n - 1)
  const after = (await lastQuiz($)) ?? current
  // Another window's new quiz took this one's place: its question n is another, graded by none of the words below.
  if (after.at !== current.at) return NEW_QUIZ_ELSEWHERE
  const shown = after.at === current.at ? (after.items[n - 1] ?? item) : item
  const next = firstOpen(after, checking)
  const steps = [
    ...(shown.result === undefined ? [`스스로 채점: /learn 퀴즈 맞음 ${n} · /learn 퀴즈 틀림 ${n}`] : []),
    ...(next !== -1 ? [nextText(after, next)] : []),
  ]
  const mark = shown.result !== undefined ? ` · ${resultMark(shown)}` : ''
  // A first try graded so: what it showed wrong is kept for the next quiz, as after any grade.
  const isGradedNow = shown.result !== undefined && item.result === undefined
  const slipLine = isGradedNow ? await slipLineText($, shown) : undefined
  const teamLine = isGradedNow ? await teamLineText($, shown, slipLine !== undefined) : undefined
  const below = [teamLine, slipLine].filter(line => line !== undefined).map(line => `\n${line}`).join('')
  return `${n}번 정답\n\n${item.answer}\n(개념: ${item.name}${mark})${below}${steps.length > 0 ? `\n\n${steps.join(' · ')}` : ''}`
}

/**
 * Words that start a /learn quiz command, not an answer: one misspelled is not graded as the learner's answer.
 * The replies' own "새 문제" and "다음 문제", and help, are among them: graded, they would be a miss.
 */
const QUIZ_WORD =
  /^(힌트|정답|문제|새로|새\s*(?:문제|퀴즈)|다음\s*문제|맞|틀|오답|도움말|답\s*적기|적기|채점|팀(?=$|\s|으로|용어|퀴즈|문제|만)|(?:hints?|answers?|questions?|right|correct|wrong|missed?|help|team|new\s+(?:quiz|questions?))\b)/i
/** The quiz asked for in other words (시작 · 보기 · 계속 …): the quiz being answered, or a new one when none is, as /learn 퀴즈 alone. */
const QUIZ_SHOW = /^(?:시작|보기|풀기|계속|이어서|다시|열기|start|show|open|continue|resume)(?:\s*(?:하기|해\s*줘|할래))?$/i
/** What may follow /learn 복습 as a plain request (/learn 복습 해 줘): the review itself. */
const REVIEW_PLEASE = /^(?:하기|해\s*(?:줘|주세요|줄래)|할래|좀|please)$/i
/** A new quiz asked for: 새로 · 새 · new, or 새 문제 (받기) · 새 퀴즈 as the replies and the pane's s say it. */
const QUIZ_NEW = /^(?:새로|새|new)(?:\s*(?:문제|퀴즈|quiz|questions?))?(?:\s*받기)?$/i
/** The quiz being answered asked for again: 문제, or 다음 (문제) · 목록 as the replies' "다음 문제: …" may be read. */
const QUIZ_LIST = /^(?:문제|questions?|다음|다음\s*문제|목록|next|list)$/i
/** How /learn quiz is used asked for, the replies' own "내 답" and "새 답" placeholders among it: nothing to grade. */
const QUIZ_HELP = /^(?:help|도움말|도움|쓰는\s*법|사용법|usage|[내새]\s*답|\?)$/i
/**
 * A quiz of this repository's team terms alone asked for (1.7.0 D6): 팀, 팀 용어, 팀 퀴즈, team, and as a learner may
 * say it (팀으로, 팀 용어만, 팀 용어 퀴즈 해 줘). Other words after 팀 are no answer either (QUIZ_WORD).
 */
const QUIZ_TEAM =
  /^(?:팀|team)(?:으로|만)?(?:\s*(?:용어|퀴즈|문제|terms?|quiz|questions?)(?:으로|로|만)?){0,2}(?:\s*(?:해\s*(?:줘요?|주세요|줄래요?)|내\s*(?:줘요?|주세요)|주세요|부탁해요?|please))?$/i

/**
 * /learn quiz and what may follow it: the quiz being answered (a new one when
 * none is), `새로` for a new one; `1 내 답`, or an answer with no number for
 * the first open question, a typed answer Claude grades; `힌트`; `정답`, the
 * answer of the question being answered (`정답 2`, that one's); `맞음 1` ·
 * `틀림 2`, the learner's own grade once the answer is seen (or turning a
 * grade around). A first try of a day gone by waits no more: graded first,
 * and said before the reply.
 */
async function quizCommand($: EngineInterface, cfg: Config, said: string): Promise<string> {
  const now = await $.clock.now()
  const settled = await settleFirstTries($, cfg, now, false)
  const reply = await quizReply($, cfg, said, now)
  return settled.length > 0 ? `${settledText(settled)}\n\n${reply}` : reply
}

/** quizCommand's reply, once first tries of a day gone by are graded. */
async function quizReply($: EngineInterface, cfg: Config, said: string, now: number): Promise<string> {
  const current = await lastQuiz($)
  // The number first (1 힌트 · 2 정답) is the same ask as after: not an answer to grade.
  const flipped = /^(\d+)\s*번?\s+(힌트|hints?|정답|answers?)(?:\s*보기)?$/i.exec(said)
  const showWord = QUIZ_SHOW.test(said) ? said.trim() : undefined
  const rest = showWord !== undefined ? '' : flipped ? `${flipped[2]} ${flipped[1]}` : said
  const isNew = QUIZ_NEW.test(rest)
  if (QUIZ_HELP.test(rest)) return QUIZ_USAGE
  // The team terms alone (1.7.0 D6): a new quiz of them, as 새로 makes one, the ones not met first.
  if (QUIZ_TEAM.test(rest)) {
    const file = await teamOf($, '')
    if (!file || file.practice.length === 0) return NO_TEAM_TERMS
    if (isQuizMaking) return '패널에서 문제를 만들고 있습니다. 잠시 뒤 /learn 퀴즈로 보세요.'
    if (isQuizChecking) return CHECKING_TEXT
    return freshQuiz($, cfg, now, 'team')
  }
  // 보기 after it as the pane's a says it: 정답 보기, 정답 2 보기.
  const answer = /^(정답|답|answer|answers)\s*(?:(\d+)\s*번?)?(?:\s*보기)?$/i.exec(rest)
  if (answer) {
    if (!current) return NO_QUIZ
    return answerText($, cfg, current, answer[2] === undefined ? undefined : Number(answer[2]))
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
    // Marked seen on the quiz every window shares, what another window kept on it meanwhile kept too.
    const kept = await keepHint($, current, n - 1)
    if (kept === 'moved') return NEW_QUIZ_ELSEWHERE
    if (kept === 'busy') return `${n}번은 이미 채점했거나 정답을 봤습니다. 지금 문제: /learn 퀴즈`
    return `${n}번 힌트\n\n${item.hint}\n\n답을 적어 채점받기: /learn 퀴즈 ${n} 내 답 · 정답 보기: /learn 퀴즈 정답 ${n}`
  }
  // Only numbers may follow the word (said plainly or politely: 맞았어요): "틀린 것 같은데…" is no grade.
  const grade = /^(맞음|맞았어요?|맞혔어요?|맞아요|맞힘|right|correct|틀림|틀렸어요?|틀렸음|틀려요|틀린|오답|miss|missed|wrong)\s*([\d\s,번]*)$/i.exec(rest)
  if (grade) {
    if (!current) return NO_QUIZ
    const result = /^(맞|right|correct)/i.test(grade[1]!) ? 'right' : 'wrong'
    const word = result === 'right' ? '맞음' : '틀림'
    const said = [...new Set((grade[2]!.match(/\d+/g) ?? []).map(Number))]
    // A first try (not "모르겠어요") was answered: 맞음 grades it right as the learner says, 틀림 as Claude graded it.
    const isTried = (item: LearnQuizItem) => item.result === undefined && item.firstTry !== undefined && !isBlankAnswer(item.firstTry.mine)
    // No number: the one question there is, or the one whose answer was just seen (or tried) and not graded.
    const seen = current.items.flatMap((item, i) => (item.result === undefined && (isAnswerShown(current, item) || isTried(item)) ? [i + 1] : []))
    const numbers = said.length > 0 ? said : current.items.length === 1 ? [1] : seen.length === 1 ? seen : []
    if (numbers.length === 0 || numbers.some(n => current.items[n - 1] === undefined)) {
      return `문제 번호를 1~${current.items.length} 사이로 알려 주세요. 예: /learn 퀴즈 ${word} ${current.items.length}`
    }
    const checking = (await read($, quizRun)).checking
    if (typeof checking === 'number' && numbers.includes(checking + 1)) return `${checking + 1}번은 지금 Claude가 채점하고 있습니다. 채점이 끝난 뒤 다시 알려 주세요.`
    const unseen = numbers.filter(n => isOpen(current, current.items[n - 1]!) && !isTried(current.items[n - 1]!))
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
      const tried = isTried(item)
      const done = tried
        ? await gradeFirstTry($, cfg, latest, n - 1, result, { isLearner: true })
        : item.result === undefined
          ? await applyGrade($, cfg, latest, n - 1, result, {})
          : await regradeQuiz($, cfg, latest, n - 1, result)
      if (done === 'failed') return GRADE_NOT_KEPT
      if (done === 'moved') return MOVED_TEXT
      if (done === 'kept') {
        changed.push(`${n}. ${item.name}`)
        changedAt.push(n - 1)
        // Right over a first try, as the learner says it was: recalled by themselves unless its hint was seen, or it
        // came after a worked example (1.8.0), whose step stays all the same.
        if (tried ? item.isHinted === true || item.rung === 'worked' : isHelpedGrade(item)) helped += 1
      }
    }
    if (changed.length === 0) return `이미 ${word}으로 적혀 있습니다.`
    // What each grade did with its concept's slip (1.7.0), as the pane says it under the feedback: a first try graded
    // so keeps what it showed wrong, for the next quiz to ask again.
    const graded = ((await lastQuiz($))?.items ?? []).flatMap((item, i) => (changedAt.includes(i) ? [{ item, n: i + 1 }] : []))
    // A team term a grade put in the concept index says so (1.7.0 D6): a miss's place is said by the reply already.
    const slipLines = (
      await Promise.all(graded.map(async ({ item, n }) => ({ n, lines: [await teamLineText($, item, true), await slipLineText($, item)] })))
    ).flatMap(({ n, lines }) => lines.flatMap(line => (line === undefined ? [] : [graded.length > 1 ? `${n}번: ${line}` : line])))
    const slipped = slipLines.length > 0 ? `\n${slipLines.join('\n')}` : ''
    if (result === 'wrong') return `틀린 것으로 적었습니다: ${changed.join(' · ')}. 복습할 개념 맨 앞에 올라 다음 퀴즈에 먼저 나옵니다.${slipped}`
    // Graded after the answer showed: recalled with help, so the interval stays (a typed answer turned right moves on).
    const spacing =
      helped === changed.length
        ? '정답을 보고 맞혀 복습 간격은 그대로입니다.'
        : helped === 0
          ? '다음 복습까지 간격이 늘어납니다.'
          : '직접 맞힌 문제는 간격이 늘고, 정답을 보고 맞힌 문제는 그대로입니다.'
    const graduated = graduatedIn(
      graded.map(({ item }) => item),
      await read($, concepts),
      await read($, aliases),
    )
    return `맞힌 것으로 적었습니다: ${changed.join(' · ')}. ${spacing}${slipped}${graduated.length > 0 ? `\n\n${graduatedText(graduated)}` : ''}`
  }
  const typed = /^(\d+)\s*번?\s*[.):]?\s+([\s\S]+)$/.exec(rest)
  if (typed) {
    if (!current) return NO_QUIZ
    // The replies' own "내 답" · "새 답", sent as they stand: what goes there, not an answer to grade.
    const placeholder = /^[내새]\s*답$/.exec(typed[2]!.trim())?.[0]
    if (placeholder !== undefined) return `'${placeholder}' 자리에 떠올린 답을 적어 보내 주세요: /learn 퀴즈 ${typed[1]} (떠올린 답)`
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
    // "모르겠어요" is taken with no grade asked for (its hint, or the answer).
    return typedAnswer($, cfg, current, open + 1, rest.trim(), `${open + 1}번 답으로 ${isBlankAnswer(rest) ? '받았습니다' : '채점했습니다'}`)
  }
  if (isQuizMaking) return '패널에서 문제를 만들고 있습니다. 잠시 뒤 /learn 퀴즈로 보세요.'
  // The quiz being answered first: a new one only once none is left open, or when asked for (새로).
  if (!isNew && current && current.items.some(item => isOpen(current, item))) {
    const listed = quizListText(current, now, '· 새 문제: /learn 퀴즈 새로', (await read($, quizRun)).checking)
    // 시작 · 계속 may be the answer itself (a program that prints 시작): how to send it as one.
    const open = firstOpen(current)
    return showWord !== undefined && open !== -1 ? `${listed}\n\n답으로 적은 말이면 번호를 붙여 보내 주세요: /learn 퀴즈 ${open + 1} ${showWord}` : listed
  }
  if (isQuizChecking) return CHECKING_TEXT
  return freshQuiz($, cfg, now)
}

/** A new quiz made in the conversation (`mode` 'team': of the team terms alone), listed with how to answer it; or why there is none. */
async function freshQuiz($: EngineInterface, cfg: Config, now: number, mode: 'review' | 'team' = 'review'): Promise<string> {
  isQuizMaking = true
  let made
  try {
    made = await makeQuiz($, cfg, now, mode)
  } finally {
    isQuizMaking = false
    // The pane's word to an answer entered meanwhile holds no more, made or not (its answer stays in its field).
    await update($, quizRun, run => (run.error === MAKING_TEXT ? { ...run, error: null } : run))
  }
  if ('error' in made) return made.error
  return [
    `${isTeamOnlyQuiz(made.items) ? '팀 용어 퀴즈' : '복습 퀴즈'} · ${made.items.length}문제`,
    '',
    made.items.map((item, i) => listItem(i + 1, `${rungMark(item)}${teamMark(item)}${item.question}`)).join('\n\n'),
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
      argumentHint: '[복습|퀴즈|정리|질문|기록|보고서|공유|진단|도움말]',
      immediate: true,
    })
    // An engine without tools for plugins, or one that refuses this one, leaves /learn as it was.
    try {
      await $.tool.register(TOOL_SPEC)
      hasTool = true
    } catch {
      hasTool = false
      void fault($, 'tool', 'unregistered', '학습 기록 도구를 등록하지 못했습니다')
    }
    isInteractive = e.isInteractive
    myVersion = await readVersion($)
    mySessionId = await $.session.id().catch(() => undefined)
    // The guard first, before anything writes the concepts; then this session's stamp for the other windows.
    await enqueue('storing', () => keepSchema($))
    await enqueue('storing', () => stampNow($))
    await loadHistory($)
    await loadTeam($)
    await seedActivity($)
    await seedUsage($)
    // After a reload: a note it cut mid-write goes on by itself (the day's limit read just above), or says it stopped.
    await resumeNotes($, cfg)
    // The store's notes (up to 2MB) read once for the two looks at them below: every reload and /config change
    // starts here too. Read after resumeNotes, which may have stored what it did.
    const history = cfg.isAutoSave ? await $.store.get(HISTORY_KEY).then(raw => ({ raw }), () => undefined) : undefined
    // A note a session that ended left being written goes into the journal, quietly; not waited for, as it writes files.
    void journalLeft($, cfg, undefined, undefined, history)
    await remind($, cfg)
    await welcome($)
    // A repository whose team file has terms to practise says so once (1.7.0 D6), never in the welcome's session.
    await nudgeTeam($)
    await checkAtStart($, cfg, history)
    // A newer build open in another window, or a store it wrote in a newer layout: said once a session.
    await lookNewer($)
    // A quiz request a reload cut off is not coming back; the last quiz is there for the pane to draw.
    if (!isQuizMaking && !isQuizChecking) await update($, quizRun, () => ({ isMaking: false, error: null, checking: null }))
    // A question a reload cut off is not coming back: its field is there again.
    await update($, askRun, all => Object.fromEntries(Object.entries(all).filter(([id]) => !asking.has(id)).map(([id, one]) => [id, { ...one, isAsking: false }])))
    // Nor a practice's line a reload cut off mid-check (1.7.0): its field is there again.
    if (drillChecking === null && (await read($, drillRun)).checking !== null) await update($, drillRun, run => ({ ...run, checking: null }))
    if ((await read($, quiz)) === null) {
      const last = await lastQuiz($)
      if (last) await update($, quiz, () => last)
    }
    // A first try a past day left waiting for its try again is graded as Claude graded it, on that day; a practice's too.
    // Said once, a dim line in the transcript (never sent to the model): neither the pane nor a try again sent later
    // says why it was graded so.
    const settled = await settleFirstTries($, cfg, await $.clock.now(), false)
    if (settled.length > 0 && isInteractive) $.ui.log(settledText(settled))
    await settleDrillTries($, cfg, await $.clock.now())
    return next(e)
  })

  // The learning record tool (TOOL_SPEC): read-only, answered here with no model call.
  on('tool.call', { tool: TOOL_NAME }, async ($, e) => {
    const action = typeof e.action === 'string' ? e.action.trim() : ''
    const query = typeof e.query === 'string' ? e.query.trim() : ''
    try {
      return { result: await toolText($, cfg, action, query) }
    } catch (error) {
      void fault($, 'tool', faultCode(error), '학습 기록 도구가 답하지 못했습니다')
      return { result: TOOL_FAILED }
    }
  }).catch(($, e, next) => {
    hookFailed($, next.error, 'tool', 'tool.call')
    return { result: TOOL_FAILED }
  })

  // It only reads the learner's own record: no permission dialog where only the mode would ask.
  // A deny, or an ask a settings rule or a hook made (an organization wanting a dialog for it), still holds.
  on('tool.check', { tool: TOOL_NAME }, async ($, e, next) => {
    const verdict = await next(e).catch(() => undefined)
    if (verdict?.decision === 'deny') return verdict
    if (verdict?.decision === 'ask' && (verdict.rule !== undefined || verdict.hook !== undefined)) return verdict
    return { decision: 'allow' as const, reason: 'learn-notes의 읽기 전용 학습 기록' }
  }).catch(($, e, next) => {
    // The engine's own verdict, the dialog where it would ask: never an allow this hook could not judge.
    hookFailed($, next.error, 'tool', 'tool.check')
    return next(e)
  })

  // Only reads where the spinner is drawn, to know whether a pane would dock (and, for /learn 진단, the terminal's width).
  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    canDock = e.surface === 'desktop' || (e.surface === 'terminal' && e.viewport?.isFullscreen === true)
    if (e.surface === 'terminal' && e.viewport) lastViewport = { columns: e.viewport.columns, isFullscreen: e.viewport.isFullscreen === true }
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
  }).catch(($, e, next) => {
    hookFailed($, next.error, 'hook', 'prompt.submit')
    return next(e)
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

  // A change that cannot be caught (the session's root unreadable, a state write refused) fails the hook: its
  // .catch keeps the fault and hands on what the tool did, as this hook would have.
  on('tool.call', { tool: ['Edit', 'Write'] }, async ($, e, next) => {
    const ran = await next(e)
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
    return ran
  }).catch(($, e, next) => {
    hookFailed($, next.error, 'capture', 'tool.call')
    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    // A command that may write gets the files it names read first, for when the engine gives no diff of its own.
    const before = WRITES.test(e.command) && !isGitMove(e.command) ? await readTargets($, e.command) : undefined
    const ran = await next(e)
    await collectShell($, cfg, 'Bash', e.command, ran, before)
    return ran
  }).catch(($, e, next) => {
    hookFailed($, next.error, 'capture', 'tool.call')
    return next(e)
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
  }).catch(($, e, next) => {
    hookFailed($, next.error, 'capture', 'tool.call')
    return next(e)
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
      // No model call by itself for spaces and line breaks alone, past the day's limit, nor while the account's
      // five-hour or seven-day window is nearly used up (the note yields to the work): w writes it all the same.
      const isFormat = turn.changes.every(isFormatOnly)
      const isLimit = !isFormat && cfg.isAutoNote && (await isOverLimit($, cfg, day))
      const quota = !isFormat && !isLimit && cfg.isAutoNote ? await quotaNow($) : undefined
      if (!isFormat && !isLimit) quotaHeld = quota
      const skip = isFormat ? 'format' : isLimit ? 'limit' : quota !== undefined ? 'quota' : undefined
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
        ...(skip === 'quota' ? { quota } : {}),
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
      if (skip === 'limit' && (await isFirstToastOn($, LIMIT_TOAST_KEY, day))) {
        $.ui.toast(`학습 노트: 오늘 자동 노트 한도(${cfg.dailyAutoNotes}개)에 닿았습니다 · 패널에서 w를 누르면 씁니다`, { timeoutMs: 8000 })
      }
      if (skip === 'quota' && (await isFirstToastOn($, QUOTA_TOAST_KEY, day))) {
        $.ui.toast(`학습 노트: ${quotaWhy(quota)} · 패널에서 w를 누르면 씁니다`, { timeoutMs: 8000 })
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
    await lookNewer($)
    return next(e)
  })

  // Every reply goes into the conversation the model reads: masked as the record tool's answers are (see toolText),
  // since a note, a concept or a quiz kept before 1.6.0 was never masked. Registered first, so it holds the reply
  // of the hook below; masking twice changes nothing.
  on('command.run', { command: 'learn' }, async ($, e, next) => {
    const out = await next(e)
    return out.text === undefined ? out : { ...out, text: redactText(out.text).text }
  }).catch(async ($, e, next) => {
    hookFailed($, next.error, 'hook', 'command.run')
    // The engine asks this handler, the first registered, for the whole chain of this plugin's /learn hooks: when the
    // reply below threw or ran out of time, `called` is false (that hook never calls next) and nothing beneath has a
    // reply of its own (its own `.catch` is not asked). Said so, rather than the engine's error.
    if (!next.called) return { text: COMMAND_FAILED }
    // What could not be masked is not shown: the reply goes into the conversation the model reads.
    try {
      const out = await next(e)
      return out.text === undefined ? out : { ...out, text: redactText(out.text).text }
    } catch {
      return { text: COMMAND_FAILED }
    }
  })

  on('command.run', { command: 'learn' }, async ($, e) => {
    await lookNewer($)
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
      // With no concept yet, team terms not met (1.7.0 D6) are nothing due: no quiz of them is made unasked, as below.
      const isTeamOnly = Object.keys(index).length === 0 && (await teamTermsLeft($)) > 0
      if (ask !== '' || (Object.keys(index).length === 0 && !isTeamOnly)) return { text: await quizCommand($, cfg, ask) }
      // Asked from Remote Control or a chat channel, the pane is on a screen nobody there sees: the quiz comes in the reply.
      const isAway = isAwayOrigin(e.origin) || (await isCloudSession($))
      const now = await $.clock.now()
      // A first try a day gone by left waiting is graded first, and said before the reply (as /learn 퀴즈 says it).
      const settled = await settleFirstTries($, cfg, now, false)
      const told = (text: string) => ({ text: settled.length > 0 ? `${settledText(settled)}\n\n${text}` : text })
      const current = await lastQuiz($)
      const today = todayReview(index, await read($, activity), now)
      // Nothing due (or today's share done) and nothing left to answer: no new quiz asked unbidden, wherever it was asked.
      if (today.left === 0 && !(current?.items.some(item => isAwaited(current, item, now)) ?? false)) {
        const why = today.due > 0 ? `오늘 몫(하루 ${DAILY_REVIEW}문제)을 마쳤습니다 · 남은 개념은 내일 나옵니다` : '지금 복습할 개념이 없습니다'
        if (isAway) return told(`${why} · 더 풀려면 /learn 퀴즈 새로`)
        await update($, autoOpened, () => true)
        await update($, view, () => 'quiz')
        // The desktop app seats an asked pane a moment after the open answers undrawn (1.7.1).
        return told(`${why} · 더 풀려면 ${(await openPane($, false)) ? '패널에서 s, 또는 ' : ''}/learn 퀴즈 새로`)
      }
      if (isAway) return told(await quizCommand($, cfg, ''))
      await update($, autoOpened, () => true)
      if (!(await openPane($, true))) return told(await quizCommand($, cfg, ''))
      await reviewNow($, cfg)
      return told('학습 노트 패널에서 오늘 복습을 엽니다 · 답을 적고 Enter로 채점받고, Esc로 대화로 돌아갑니다.')
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
        faultOk($, 'anki')
      } catch (error) {
        const code = faultCode(error)
        void fault($, 'anki', code, 'Anki 파일을 쓰지 못했습니다')
        const why = fileWhy(code)
        return { text: `Anki 파일을 쓰지 못했습니다${why ? `: ${why}` : ''} (${path}). 폴더에 쓸 수 있는지 확인하거나 /config에서 저장 폴더(saveDir)를 바꾸세요.` }
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
    if (arg === 'doctor') return { text: await diagCommand($, cfg, isAwayOrigin(e.origin)) }
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
      // What the range's quizzes found the learner got wrong (1.7.0): its 헷갈리기 쉬운 것 says those, not a guess.
      const slipped = await storedSlips($, map, now)
      const asked = await askModel($, cfg, 'recap', { system: RECAP_SYSTEM, prompt: recapPrompt(range, chosen, index, map, cfg.level, isPartial, slipped), maxTokens: 1200 })
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
    // The note picked in the pane (else the last) copied as c copies it; 마지막 · last, its names before 1.7.0, too.
    if (arg === 'share' || arg === 'last') {
      const wanted = await read($, selectedId)
      const note = list.find(one => one.id === wanted) ?? list.at(-1)
      if (!note) return { text: EMPTY_TEXT }
      if (note.status !== 'ready') return { text: `이 노트는 아직 복사할 글이 없습니다 · ${noteState(note)}` }
      const text = await shareOf($, cfg, note)
      if (await deliver($, text, isAwayOrigin(e.origin))) return { text: SHARE_REPLY }
      // A chat channel, a Slack ping or a -p run reads the reply alone: the note goes there, as /learn 보고서 does.
      if (!isInteractive || e.origin.kind === 'channel' || e.origin.kind === 'slack-ping') return { text: `${SHARE_REPLY_HERE}\n\n${text}` }
      // Elsewhere (Remote Control's phone, a cloud session, a copy refused) the dim lines c leaves: the model never reads them.
      logShare($, text, e.origin.kind === 'bridge' ? SHARE_HERE : SHARE_HERE_MOUSE)
      return { text: SHARE_LOGGED }
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
      // A note waiting for its try again (1.7.0 D3) is in no journal yet, and its timer would find it cleared: it
      // goes in now as the failed note it was before 1.7.0, with no call, as one cleared mid-write still does.
      for (const one of list) {
        const timer = retryTimers.get(one.id)
        if (one.status !== 'writing' || one.retry === undefined || !timer) continue
        timer.cancel()
        retryTimers.delete(one.id)
        if (cfg.isAutoSave && one.savedAs === null) {
          await save($, cfg, { ...one, status: 'failed', text: noteFailText(transientFail(one.retry.why), cfg.model), retry: undefined }, false)
        }
      }
      await update($, notes, () => [])
      await update($, selectedId, () => null)
      await persist($, true)
      return { text: '이 프로젝트의 학습 노트를 비웠습니다. 다음 세션에도 다시 나오지 않습니다. 일지 파일과 배운 개념 모음은 그대로입니다.' }
    }
    // Retired in 1.6.0 (a note is saved by itself), with no reply of its own since 1.7.0: the old name still answers, with the few most used.
    if (arg === 'save') return { text: `${SAVE_RETIRED}\n\n${SHORT_HELP}` }
    if (arg !== '') return { text: `모르는 하위 명령입니다: '${said}'.\n\n${SHORT_HELP}` }
    await update($, autoOpened, () => true)
    // The keys stay in the prompt: what is typed next is a request, never one of the pane's keys (w · e · r call the model).
    // ctrl+x tab or a click hands them to the pane; /learn 복습 opens it holding them.
    const hasKeys = list.length > 0 || Object.keys(await read($, concepts)).length > 0 || (await teamTermsLeft($)) > 0
    // The desktop app seats an asked pane a moment after the open answers undrawn (1.7.1).
    const isPlaced = await openPane($, false)
    const last = list.at(-1)
    const surfaces = await surfacesNow($)
    const isCloud = await isCloudSession($)
    if (isPlaced && isCloud && !surfaces.some(one => one !== 'terminal')) {
      // Placed on the cloud computer's own terminal, which nobody sees: say so, and show the note here.
      return {
        text: `이 세션은 클라우드 컴퓨터에서 돌아, 패널이 지금 보는 화면에 뜨지 않을 수 있습니다. 마지막 노트를 여기에 적습니다 (/learn으로 언제든 다시 봅니다).\n\n${last ? lastNoteText(last, true) : EMPTY_TEXT}`,
      }
    }
    const root = await $.session.root()
    const hint = isSystemFolder(root) ? `\n\n${systemFolderHint(root)}` : ''
    if (isPlaced && !hasKeys) return { text: `학습 노트 패널을 열었습니다 · Claude에게 파일을 만들거나 고쳐 달라고 하면, 턴이 끝난 뒤 여기에 노트가 생깁니다.${hint}` }
    if (isPlaced) {
      const left = todayReview(await read($, concepts), await read($, activity), await $.clock.now()).left
      const review = left > 0 ? ` · 오늘 복습 ${left}개: /learn 복습` : ''
      return { text: `학습 노트 패널을 열었습니다${paneKeysText(surfaces, isCloud, isAwayOrigin(e.origin))}${review}${hint}` }
    }
    // A surface isPlacedSoon waited for (or one not attached yet) may seat it later still: kept as a fault only if
    // it never does (1.7.1).
    if (surfaces.length === 0 || surfaces.some(one => one !== 'terminal')) void faultIfStillUnplaced($)
    else void fault($, 'pane', 'unplaced', '패널을 열지 못했습니다')
    return {
      text: `${noPaneText(surfaces, isCloud)}\n\n${last ? lastNoteText(last, isCloud) : EMPTY_TEXT}`,
    }
  }).catch(($, e, next) => {
    // Not asked while the masking hook above holds this chain (its handler answers for it); kept for an engine that asks each.
    hookFailed($, next.error, 'hook', 'command.run')
    return { text: COMMAND_FAILED }
  })

  // The person's own moves of the pane's window, counted so an answer arriving later does not pull them away (revealInPane).
  on('ui.scroll', { requestId: PANE }, ($, e, next) => {
    if (e.origin.kind === 'person') personScrolls += 1
    return next(e)
  }).catch(($, e, next) => {
    hookFailed($, next.error, 'pane', 'ui.scroll')
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    lastDraw = { placement: e.props.placement, columns: e.props.bodyColumns }
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
    const slipRecord = await read($, slips)
    const slipOf = (key: string) => slipAt(slipRecord, resolveKey(map, key))
    // This repository's team terms (1.7.0 D6), as last read: the ones not met yet make a quiz with no concept learned.
    const teamFile = await teamHere($)
    const termsHere = distinctTerms(teamFile?.practice ?? [], map)
    const unmet = unmetTerms(termsHere, index, map)
    const filled = reviewFilled(index, cleanSlips(slipRecord, map, now), now)
    const team: TeamProgress | undefined = termsHere.length > 0 ? { total: termsHere.length, unmet, way: teamWay(filled) } : undefined
    // Merges followed: one made in this session moves a team term's mark to the concept it went into.
    const marks = cleanTeamTerms(await read($, teamTerms), map)
    const canQuiz = hasConcepts || unmet.length > 0
    // What s asks before a quiz's first, as makeQuiz fills it: the places the review leaves free go to the terms not met.
    const quizStart = quizStartText(teamSlots(unmet.length, filled), Object.values(index).filter(one => !isKnown(one)).length)
    const isAdded = (item: LearnQuizItem) => isTeamAdded(item, index, map)

    const at = shownAt(list, wanted)
    const note = list[at]
    // Before the first note, a note's own view (전/후) shows the note view's welcome.
    const shown: LearnView = note || isWhole(mode) ? mode : 'note'

    // Past today's limit (dailyAutoNotes), or with the account's window nearly used up as the last turn's end read
    // it, the turn's end writes no note: the live line promises none.
    const willWrite = cfg.isAutoNote && !isLimitReached(cfg, stamp(now).day) && quotaHeld === undefined
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
    const isAnswering = shown === 'quiz' && current !== null && asked !== -1 && isOpen(current, current.items[asked]!) && fieldOf(el, e.surface) !== undefined && run.checking !== asked
    const keysHint =
      e.surface === 'terminal' ? (
        <Text dimColor wrap="wrap">
          {isAnswering ? (e.props.isFocused ? ANSWER_FOCUSED_HINT : ANSWER_KEYS_HINT) : e.props.isFocused ? FOCUSED_HINT : KEYS_HINT}
        </Text>
      ) : null
    // q is for the review not on show: the quiz view offers it too once its quiz is all graded (as the status line's
    // view /learn opens on, kept from before), not while a question waits for its answer or a quiz is made.
    const isReviewOn = shown === 'quiz' && (run.isMaking || (current?.items.some(item => isAwaited(current, item, now)) ?? false))
    const strip = viewStrip($, cfg, shown, note !== undefined, isReviewOn ? 0 : review.left, el)

    if (!note) {
      // The team file read for this project, if any: its notes will follow its rules and terms.
      const rules = teamFile
      // No note in this project yet: concepts learned elsewhere, and a quiz on them, are still one key away; so are the
      // team's terms (1.7.0 D6), its rules read said only when it has none to practise (or nothing was read at all).
      const welcome = (
        <Box flexDirection="column" marginTop={canQuiz ? 1 : 0}>
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
              {team ? teamPracticeText(team.total, team.unmet.length, team.way) : teamText(rules)}
            </Text>
          )}
        </Box>
      )
      return (
        <Box flexDirection="column">
          {systemHint}
          {liveBlock}
          {canQuiz && strip}
          {canQuiz && keysHint}
          {canQuiz && shown !== 'note' ? (
            <Box marginTop={1} flexDirection="column">
              {shown === 'quiz'
                ? quizView($, cfg, current, run, canQuiz, now, review, list, isTerminalFocus, el, e.surface, slipOf, quizStart, isAdded)
                : conceptsView($, index, map, list, now, cfg.isAutoSave, stats, review.left, el, slipRecord, team, marks)}
            </Box>
          ) : (
            welcome
          )}
        </Box>
      )
    }

    const isBusy = isWriting(note.id)
    const totalAdded = note.changes.reduce((sum, c) => sum + c.added, 0)
    const totalRemoved = note.changes.reduce((sum, c) => sum + c.removed, 0)
    const fileCount = note.changes.length + note.moreFiles
    const withheld = note.withheld ?? []
    const redacted = note.changes.reduce((sum, c) => sum + (c.redacted ?? 0), 0)
    // A note waiting for its try again is drawn so before its write lets go (noteBody): no call is being made.
    const writeLabel = isRetryArmed(note) ? '바로 쓰기' : isBusy ? '쓰는 중…' : note.status === 'off' ? '노트 쓰기' : '다시 쓰기'
    // Above the code, the note's own words on what the change does differently.
    const summary = note.status === 'ready' ? changeSection(note.text) : undefined
    // Its practice (1.7.0): a line of its code to change, t under it.
    const drill = note.status === 'ready' ? drillOf(note.text, note.changes) : undefined
    const practice = await read($, drillRun)

    const body =
      shown === 'quiz' ? (
        quizView($, cfg, current, run, canQuiz, now, review, list, isTerminalFocus, el, e.surface, slipOf, quizStart, isAdded)
      ) : shown === 'concepts' ? (
        conceptsView($, index, map, list, now, cfg.isAutoSave, stats, review.left, el, slipRecord, team, marks)
      ) : shown === 'note' ? (
        <Box flexDirection="column">
          {noteBody(note, isBusy, offText(note, cfg, now), el, drill)}
          {note.status === 'ready' && note.concepts.length > 0 && conceptLine(note, index, map, el)}
          {note.status === 'ready' &&
            noteTools($, cfg, note, writeLabel, asks[note.id] ?? { isAsking: false, error: null, draft: null }, el, e.surface, drill, practice, isTerminalFocus)}
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
  }).catch(($, e, next) => {
    // Two lines in place of an empty pane: what to send, and what still works in the conversation.
    if ((next.error.kind as string) !== 're-entry') void fault($, 'pane', 'render', '패널을 그리지 못했습니다')
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text color="yellow" wrap="wrap">
          {RENDER_FAILED}
        </Text>
        <Text dimColor wrap="wrap">
          {RENDER_STILL}
        </Text>
      </Box>
    )
  })

  // At the session's end, the faults not yet in the store go in, within the exit's one short bound.
  on('session.end', async ($, e, next) => {
    faultTimer?.cancel()
    faultTimer = undefined
    const room = Math.min(next.budget.remainingMs - 200, 2_000)
    if (isFaultsDirty && room > 0) {
      await Promise.race([flushFaults($), $.clock.sleep(room, { signal: next.signal }).catch(() => undefined)])
    }
    return next(e)
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
        ? () => showQuiz($, cfg)
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
  const now = await $.clock.now()
  // A first try of a day gone by waits no more: graded as Claude graded it, before today's review is asked for.
  await settleFirstTries($, cfg, now, false)
  const current = await lastQuiz($)
  // A question whose answer was seen today still waits for o or x: kept, as s keeps it.
  if (!current || !current.items.some(item => isAwaited(current, item, now))) {
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
async function showQuiz($: EngineInterface, cfg: Config): Promise<void> {
  await update($, view, () => 'quiz')
  await settleFirstTries($, cfg, await $.clock.now(), false)
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
  if (at !== -1 && isOpen(current, current.items[at]!)) focusInPane($, answerKey(current, at))
}

/**
 * The text field `el` draws, or undefined on a surface that draws none (the mobile app, where a question goes
 * through /learn ask and a quiz through a, o and x). The engine completes every surface's table with every
 * element, one the surface lacks drawing a fragment, so `'Input' in el` alone cannot tell (it held on mobile too).
 */
function fieldOf(el: ElementTable, surface: RenderSurface): ElementConstructor<InputProps> | undefined {
  return surface !== 'mobile' && 'Input' in el ? el.Input : undefined
}

/**
 * Under a written note, what to do with it: its practice (t, 1.7.0: a line of
 * its code changed in a field below, the file left as it is; where no field is
 * drawn, a shows its example), the note explained again in plainer words under
 * it, the note kept (e), its code followed step by step on one example (r), a
 * question about it (i, the field below), and last and dim the note copied for
 * a mentor (c) and written again (w); then the latest questions and their
 * answers, the question field, and last the practice once opened or tried (its
 * field the ring's last stop, see drillView's Tab line). A note with no
 * practice (one before 1.7.0, a change with no line to change) has no t: q
 * goes over its concepts with the rest.
 */
function noteTools(
  $: EngineInterface,
  cfg: Config,
  note: LearnNote,
  writeLabel: string,
  ask: LearnAskRun,
  el: ElementTable,
  surface: RenderSurface,
  drill: Drill | undefined,
  practice: LearnDrillRun,
  isFocused: boolean,
) {
  const { Box, Text, Button, Markdown } = el
  // The mobile app draws no text field yet: there a question goes through /learn ask.
  const Input = fieldOf(el, surface)
  const fieldKey = `ask-${note.id}`
  const isPractice = drill !== undefined && (practice.open === note.id || note.drill !== undefined)
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexWrap="wrap" columnGap={2}>
        <Text dimColor>이 노트로</Text>
        {drill && Input && <Button key="note-drill" hotkey="t" plain label="직접 해 보기" onPress={() => void openDrill($, note.id)} />}
        {/* Where no field is drawn, a before the practice is over; once graded, a stands under its grade (drillView). */}
        {drill && !Input && !isDrillOver(note.drill) && (
          <Button key="note-drill-answer" hotkey="a" plain label="예시 답" onPress={press => void showDrillAnswer($, cfg, note.id, press.surface)} />
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
        <Button key="share" hotkey="c" plain dimColor label="복사" onPress={press => void shareNote($, cfg, note.id, press.surface)} />
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
      {/* Last, so Tab from its field goes where its line says: before a try back round to the row of keys (p, n,
          1~4), after one to a, never into the question field, where a number typed would be a question. */}
      {isPractice && drillView($, cfg, note, drill, practice, isFocused, el, surface)}
    </Box>
  )
}

/**
 * A note's practice under its row of keys (1.7.0, t): over its field, that it is practice and the file stays as it is;
 * a first try short of right with Claude's feedback and the question asked back; the line to change in a field of its
 * own between the lines above and below it, numbered as the file is (the field's label its number: the terminal puts
 * `: ` after it; the line's indent stays out of the field, fixed, and goes back on when it is checked); then a
 * (the example) once tried, and how to send it. Over, the grade: done (the example beside a line of the learner's
 * own), or not, with its feedback and the example on a. Where no field is drawn (the mobile app), a first try's
 * feedback with where its try again goes (DRILL_AGAIN_ELSEWHERE), the grade, and the example once a showed it.
 */
function drillView($: EngineInterface, cfg: Config, note: LearnNote, drill: Drill, run: LearnDrillRun, isFocused: boolean, el: ElementTable, surface: RenderSurface) {
  const { Box, Text, Markdown, Button } = el
  const Input = fieldOf(el, surface)
  const state = note.drill
  const isOver = isDrillOver(state)
  const first = isOver ? undefined : state?.firstTry
  const isChecking = run.checking === note.id
  const notice = run.notice?.id === note.id ? run.notice : null
  const width = String(drill.n + 1).length
  const num = (n: number) => String(n).padStart(width)
  const fieldKey = drillFieldKey(note.id, first !== undefined)
  const answer = (
    <Button key="note-drill-answer" hotkey="a" plain label="예시 답" onPress={press => void showDrillAnswer($, cfg, note.id, press.surface)} />
  )
  const example = <Markdown text={`**예시 답:** ${inlineCode(drill.example)}`} />
  return (
    <Box key={`drill-${note.id}`} flexDirection="column" marginTop={1}>
      {Input && !isOver && <Text dimColor>{DRILL_HEAD}</Text>}
      {first && (
        <Box flexDirection="column">
          <Text color={first.verdict === 'partial' || isBlankAnswer(first.mine) ? 'yellow' : 'red'} wrap="wrap">
            {drillTryHead(first)}
          </Text>
          {first.feedback !== '' && <Markdown text={first.feedback} />}
          <Markdown text={`**${isBlankAnswer(first.mine) ? '힌트' : '되묻기'}:** ${first.nudge}`} />
          {/* Tried in the terminal, read on the phone: no field here, so where the try again goes, and a over the row. */}
          {!Input && (
            <Text dimColor wrap="wrap">
              {DRILL_AGAIN_ELSEWHERE}
            </Text>
          )}
        </Box>
      )}
      {/* Over the field, not under it (1.7.1): the pane scrolls to the field that holds the keys, so a line under a field
          on its bottom row is cut off, and these say what Enter did and which input mode the code needs. */}
      {notice && (
        <Text color={notice.isError ? 'red' : 'yellow'} wrap="wrap">
          {notice.text}
        </Text>
      )}
      {Input && !isOver && !isChecking && (
        <Text dimColor wrap="wrap">
          {/* While the field holds the keys every letter and number is typed into it: how to reach the buttons. Not
              holding them, the terminal's pane says how the keys get to the field (it takes them first, autoFocus). */}
          {`${first ? 'Enter: 다시 확인' : 'Enter: 확인'} · 코드는 영문 상태에서${isFocused ? ` · Tab: 버튼으로 (${first ? 'a 예시 답' : '1~4 보기'})` : surface === 'terminal' ? DRILL_KEYS_TAIL : ''}`}
        </Text>
      )}
      {Input && !isOver && isChecking && <Text color="cyan">확인하는 중입니다…</Text>}
      {Input && !isOver && !isChecking && (
        <Box flexDirection="column">
          {drill.above !== undefined && (
            <Text dimColor wrap="truncate-end">
              {num(drill.n - 1)}
              {'  '}
              {shownText(drill.above)}
            </Text>
          )}
          {/* The keys go to the field first whenever the pane takes them (ctrl+x tab, a click, the next session), as a
              quiz's answer field: a line typed in the English input mode presses none of the note's letter keys. */}
          <Input
            key={fieldKey}
            autoFocus
            label={num(drill.n)}
            placeholder="고친 줄"
            submitLabel="확인"
            value={drillDrafts.get(fieldKey) ?? (first !== undefined && !isBlankAnswer(first.mine) ? first.mine : drill.line)}
            onInput={value => void drillDrafts.set(fieldKey, value)}
            onSubmit={value => void checkDrill($, cfg, note.id, value)}
          />
          {drill.below !== undefined && (
            <Text dimColor wrap="truncate-end">
              {num(drill.n + 1)}
              {'  '}
              {shownText(drill.below)}
            </Text>
          )}
          {first && <Box>{answer}</Box>}
        </Box>
      )}
      {isOver && state!.verdict === undefined && example}
      {isOver && state!.verdict !== undefined && (
        <Box flexDirection="column">
          <Text color={state!.verdict === 'right' ? 'green' : state!.verdict === 'partial' ? 'yellow' : 'red'} wrap="wrap">
            {drillVerdictText(state!)}
          </Text>
          {state!.verdict === 'right' && state!.mine !== undefined && !sameLine(drill, state!.mine, drill.example) && (
            <Markdown text={`예시 답과 견주기: ${inlineCode(drill.example)}`} />
          )}
          {(state!.feedback ?? '') !== '' && <Markdown text={state!.feedback!} />}
          {state!.mine !== undefined && state!.mine !== '' && !isBlankAnswer(state!.mine) && (
            <Text dimColor wrap="wrap">
              내 줄: {state!.mine}
            </Text>
          )}
          {state!.verdict !== 'right' && (state!.isAnswerSeen ? example : <Box>{answer}</Box>)}
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
 * before/after view's colours when the note has them in that shape, and its
 * practice (1.7.0) with no line to change and no example answer (hideDrillAnswer;
 * t under the note shows the line, a its example once tried), its heading naming
 * the file the line is in.
 */
function noteBody(note: LearnNote, isBusy: boolean, off: string, el: ElementTable, drill?: Drill) {
  const { Box, Text, Markdown } = el
  if (note.status === 'ready') {
    // Wherever the practice stands in the note, before or after the change section.
    const text = hideDrillAnswer(note.text, drill ? baseName(drill.file) : undefined)
    const section = changeSection(text)
    if (!section) return <Markdown text={text} />
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
  // The wait first: the write that set it, still under way while the pane redraws, is no call being made.
  if (note.status === 'writing' && isRetryArmed(note)) {
    return (
      <Text color="yellow" wrap="wrap">
        {retryText(note.retry!.why)}
      </Text>
    )
  }
  if (note.status === 'writing' && isBusy && resuming.has(note.id)) return <Text color="cyan">다시 불러온 뒤 이어서 씁니다…</Text>
  if (note.status === 'writing' && isBusy) return <Text color="cyan">노트를 쓰는 중입니다…</Text>
  if (note.status === 'writing') return <Text color="yellow">노트를 쓰다 멈췄습니다 · w로 다시 쓰기</Text>
  if (note.status === 'failed') return <Text color="red">노트를 쓰지 못했습니다: {note.text}</Text>
  if (note.skip === 'limit' || note.skip === 'quota') return <Text color="yellow" wrap="wrap">{off}</Text>
  return (
    <Text dimColor wrap="wrap">
      {off}
    </Text>
  )
}

/** True while this load writes the note, or is about to: its call made, a turn's end or a reload's take-up about to make it. */
function isWriting(id: string): boolean {
  return inFlight.has(id) || resuming.has(id) || autoPending.has(id)
}

/**
 * True while the note waits for its automatic try again, its timer armed in this load (a reload's cancelled one does
 * not count, nor a try again under way: its call took the timer).
 */
function isRetryArmed(note: LearnNote): boolean {
  return note.status === 'writing' && note.retry !== undefined && retryTimers.has(note.id)
}

/**
 * Why a note was not written by itself, as the pane says it: only spaces and
 * line breaks changed, the day's limit was reached (today's limit named), the
 * account's window was nearly used up (which), or automatic notes are off.
 */
function offText(note: LearnNote, cfg: Config, now: number): string {
  if (note.skip === 'format') return '띄어쓰기·줄바꿈만 바뀌어 노트를 쓰지 않았습니다 · w로 쓰기'
  if (note.skip === 'quota') return `${quotaWhy(note.quota)} · w를 누르면 씁니다`
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
  else void fault($, 'pane', 'note-gone', '이 개념을 배운 노트가 패널에 없어 열지 않았습니다')
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
      ? `- 복습할 개념 ${due.length}개: ${queue.map(one => (isMissed(one) ? `${one.name} (퀴즈 틀림 ${dayWhen(one.missedAt ?? now, now)})` : one.name)).join(', ')}${due.length > queue.length ? ' …' : ''} · ${todayText(today)} · ${reviewWay(today.left)}`
      : '- 복습할 개념: 지금은 없습니다'
  // Today first, as the run of days counts back.
  const week = [...stats.days].reverse().map(({ weekday, one }) => `${weekday} ${one.notes}`)
  // This repository's team terms (1.7.0 D6): met of all, and the quiz of the ones left.
  const terms = distinctTerms((await teamOf($, ''))?.practice ?? [], await read($, aliases))
  const teamLine = terms.length > 0 ? [teamRecordLine(terms.length, unmetTerms(terms, index, await read($, aliases)).length)] : []
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
    ...teamLine,
    '',
    ...learned,
    '',
    usageLine(cleanUsage(await $.store.get(USAGE_KEY).catch(() => undefined)), now, record, await stepsFrom($)),
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
  const map = await currentAliases($)
  const index = await storedIndex($, map)
  // This repository's team terms (1.7.0 D6), the ones met by the team file's names: the same in every teammate's report.
  const terms = distinctTerms((await teamOf($, ''))?.practice ?? [], map)
  const unmet = new Set(unmetTerms(terms, index, map))
  const text = reportMarkdown({
    range,
    activity: await storedActivity($),
    index,
    now,
    usage: cleanUsage(await $.store.get(USAGE_KEY).catch(() => undefined)),
    since: await stepsFrom($),
    ...(terms.length > 0 ? { team: { total: terms.length, met: terms.filter(term => !unmet.has(term)).map(term => term.name) } } : {}),
  })
  let path: string | undefined
  if (cfg.isAutoSave) {
    const target = `${(await journalDir($, cfg)).replace(/[\\/]+$/, '')}/report-${range.days[0]}_${range.days.at(-1)}.md`
    try {
      await $.fs.write(target, text)
      faultOk($, 'report')
      path = target
    } catch (error) {
      void fault($, 'report', faultCode(error), '학습 보고서를 파일에 쓰지 못했습니다')
    }
  }
  const home = await homeDir($)
  const file = path === undefined ? undefined : `파일: ${home !== undefined && isUnder(path, home) ? `~${path.slice(home.replace(/[\\/]+$/, '').length)}` : path}`
  if (await deliver($, text, isAway)) return ['학습 보고서를 클립보드에 복사했습니다 · PR 설명이나 팀 채널에 붙이기 전에 한 번 읽어 보세요', ...(file ? [file] : [])].join('\n')
  return [`학습 보고서입니다 · 이 화면에서는 클립보드에 복사할 수 없어 여기에 적습니다. 붙이기 전에 한 번 읽어 보세요${file ? ` · ${file}` : ''}`, '', text].join('\n')
}

/** What c and /learn 공유 say once the note is on the clipboard. */
const SHARE_COPIED = '노트를 복사했습니다 · 요청과 질문은 빼고 비밀값은 가렸습니다 · 붙이기 전에 읽어 보세요'
const SHARE_REPLY = '노트를 클립보드에 복사했습니다 · 붙이기 전에 한 번 읽어 보세요'
/** The line over the note where it could not be copied: on a touch screen (the mobile app, Remote Control), or with a mouse. */
const SHARE_HERE = '복사할 수 없어 여기에 적습니다 · 길게 눌러 복사하세요'
const SHARE_HERE_MOUSE = '복사할 수 없어 여기에 적습니다 · 마우스로 끌어 골라 복사하세요'
/** What /learn 공유 answers once the note went in the transcript instead (the reply goes to the model, the note does not). */
const SHARE_LOGGED = '복사할 수 없어 노트를 흐린 줄로 적었습니다 · 그 줄은 Claude에게 가지 않습니다'
/** The line over the note in /learn 공유's reply, where the reply is all the person reads (a chat channel, a -p run). */
const SHARE_REPLY_HERE = '복사할 수 없어 여기에 적습니다 · 붙이기 전에 한 번 읽어 보세요'

/**
 * A written note as c and /learn 공유 copy it (shareText), screened as a journal section is: each concept it taught
 * by the name the index has for it now (a merge followed), else as the note wrote it (one the index never counted:
 * the schema guard was on, or it has since left the index).
 */
async function shareOf($: EngineInterface, cfg: Config, note: LearnNote): Promise<string> {
  const index = await read($, concepts)
  const map = await read($, aliases)
  const written = conceptsOf(note.text)
  const keys = note.concepts.length > 0 ? note.concepts : written.map(one => one.key)
  const names = keys
    .flatMap(key => conceptAt(index, resolveKey(map, key))?.name ?? written.find(one => one.key === key)?.name ?? [])
    .filter((name, i, all) => all.indexOf(name) === i)
  return shareText(await screened($, cfg, note), names)
}

/**
 * The note for a mentor where it could not be copied: dim transcript lines (never sent to the model) under `head`,
 * each within what a terminal draws of one (logParts), so the blank to ask in is there too.
 */
function logShare($: EngineInterface, text: string, head: string): void {
  for (const part of logParts(`${head}\n\n${text}`)) $.ui.log(part)
}

/**
 * The pane's c under a written note: the note copied for a mentor (shareOf) on the clipboard of the surface the
 * press came from, and a toast saying what was left out. Where nothing can be copied (an app that takes no copy yet,
 * a cloud session, a copy refused) the same text goes in the transcript as dim lines, never sent to the model, under
 * a line for a touch screen (the mobile app) or a mouse. Nothing is stored.
 */
async function shareNote($: EngineInterface, cfg: Config, id: string, surface?: RenderSurface): Promise<void> {
  try {
    const note = (await read($, notes)).find(one => one.id === id)
    if (!note || note.status !== 'ready') return
    const text = await shareOf($, cfg, note)
    if (await deliver($, text, false, surface)) {
      $.ui.toast(SHARE_COPIED, { timeoutMs: 6000 })
      return
    }
    logShare($, text, surface === 'mobile' ? SHARE_HERE : SHARE_HERE_MOUSE)
  } catch (error) {
    void fault($, 'copy', faultCode(error), '노트를 복사하지 못했습니다')
  }
}

/** /learn 진단's first two lines: where the text went, and what it does not hold. */
const DIAG_COPIED = '진단 내용을 클립보드에 복사했습니다 · 팀 채널이나 담당자에게 그대로 붙여 주세요'
const DIAG_HERE = '이 화면에서는 클립보드에 복사할 수 없어 여기에 적습니다'
const DIAG_PRIVATE = '코드 · 요청 · 파일 이름 · 경로 · 개념 이름은 들어 있지 않습니다'
/** Store keys /learn 진단 names with their size, the biggest first. */
const DIAG_KEYS = 3
/** The settings /learn 진단 says an administrator locked, by their userConfig field. */
const SETTING_FIELDS = ['autoNote', 'model', 'dailyAutoNotes', 'level', 'autoSave', 'saveDir', 'autoOpen', 'excludePaths'] as const

/**
 * /learn 진단: a page to paste to whoever looks after the plugin, made with no model call (diagText): the
 * versions, the screen, the settings and which an administrator locked, today's counts, the store's size, notes
 * the journal has not taken, the last week's faults. Copied as /learn 보고서 is (deliver), and always in the reply
 * too. Each piece that cannot be read is left out or said unknown: it is what is asked for when things fail.
 */
async function diagCommand($: EngineInterface, cfg: Config, isAway: boolean): Promise<string> {
  const now = await $.clock.now().catch(() => Date.now())
  const day = stamp(now).day
  const quiet = <T,>(work: Promise<T>, fallback: T) => work.catch(() => fallback)
  const version = myVersion ?? (await readVersion($))
  const engine = (await quiet($.session.version(), undefined))?.version
  const surfaces = await quiet($.session.surfaces(), [] as const)
  const mine = (await quiet($.ui.panes(), [] as const)).find(one => one.id === PANE)
  const pane: DiagInput['pane'] = !mine ? 'closed' : !mine.isPlaced ? 'unplaced' : (lastDraw ?? 'open')
  const apps = [
    (await $.env.get('WT_SESSION').catch(() => undefined)) ? 'Windows Terminal' : undefined,
    (await $.env.get('TMUX').catch(() => undefined)) ? 'tmux' : undefined,
    appName(await $.env.get('TERM_PROGRAM').catch(() => undefined)),
  ].filter((one, i, all): one is string => one !== undefined && all.indexOf(one) === i)
  const rows = await quiet($.config.list(), [])
  const locked = SETTING_FIELDS.filter(field => rows.some(row => row.key === `learn-notes.${field}` && row.isLocked))
  const stored = cleanFaults(await quiet($.store.get(FAULTS_KEY), undefined), now)
  const list = faultsOkSince(mergeFaults(stored.list, faults, now), okAt)
  // The other windows' builds, and the store's layout while it is newer than this build's.
  const others = await $.store.get(SESSIONS_KEY).then(
    raw => otherStamps(cleanStamps(raw, now), mySessionId),
    () => undefined,
  )
  const layout = await quiet($.store.get(SCHEMA_KEY), undefined)
  // The folder as set now: a share by its name, or one this load's journal writes still find out of reach. A network
  // failure kept from before (a saveDir since changed, a reload since) stays in the faults' list alone.
  const lastSave = faults.filter(one => one.area === 'save').sort((a, b) => a.last - b.last).at(-1)
  const isShare = /^(?:\\\\|\/\/)/.test(cfg.saveDir) || (lastSave?.code === 'network' && lastSave.ok !== true)
  const saveDir = isShare ? 'network' : cfg.saveDir === '' ? 'default' : 'custom'
  const dir = await quiet(journalDir($, cfg), undefined)
  const hasFolder = saveDir === 'network' || dir === undefined ? undefined : await $.fs.stat(dir).then(stat => stat.kind === 'dir', () => false)
  let store: DiagInput['store']
  try {
    const sizes: { key: string; bytes: number }[] = []
    for (const key of await $.store.keys()) sizes.push({ key, bytes: jsonBytes((await $.store.get(key)) ?? null) })
    sizes.sort((a, b) => b.bytes - a.bytes)
    store = { bytes: sizes.reduce((sum, one) => sum + one.bytes, 0), keys: sizes.slice(0, DIAG_KEYS) }
  } catch {
    store = undefined
  }
  const activityToday = cleanActivity(await quiet($.store.get(ACTIVITY_KEY), undefined))
  const usageToday = cleanUsage(await quiet($.store.get(USAGE_KEY), undefined))
  const has = (record: object) => Object.prototype.hasOwnProperty.call(record, day)
  const root = (await read($, paneRoot)) ?? (await quiet($.session.root(), undefined))
  const unsaved = root === undefined ? undefined : (await quiet(allNotes($), [])).filter(note => (note.root || root) === root && note.isUnsaved === true).length
  const text = diagText({
    now,
    ...(version !== undefined ? { version } : {}),
    ...(engine !== undefined ? { engine } : {}),
    ...(others !== undefined ? { others } : {}),
    ...(isSchemaAhead(layout) ? { schema: { stored: layout as number, mine: STORE_SCHEMA } } : {}),
    surfaces,
    pane,
    isPaneFocused: mine?.isFocused === true,
    ...(lastViewport ? { terminal: lastViewport } : {}),
    apps,
    settings: {
      isAutoNote: cfg.isAutoNote,
      model: cfg.model.replace(/[^\w.[\]-]+/g, '').slice(0, 40) || '?',
      dailyAutoNotes: cfg.dailyAutoNotes,
      level: cfg.level,
      isAutoSave: cfg.isAutoSave,
      isAutoOpen: cfg.isAutoOpen,
      saveDir,
      ...(hasFolder !== undefined ? { hasFolder } : {}),
      excluded: cfg.excludePaths.length,
      locked,
    },
    today: { notes: has(activityToday) ? activityToday[day]!.notes : 0, calls: has(usageToday) ? usageToday[day]!.calls : 0 },
    ...(store ? { store } : {}),
    ...(unsaved !== undefined ? { unsaved } : {}),
    faults: list,
  })
  const isCopied = await deliver($, text, isAway)
  return [isCopied ? DIAG_COPIED : DIAG_HERE, DIAG_PRIVATE, '', text].join('\n')
}

/**
 * Puts `text` on the clipboard of the screen the command came from (or `surface`, the one a press came from), for
 * /learn 보고서, /learn 진단, /learn 공유 and the pane's c: true once copied. Nothing is copied for a person away from
 * this session's screens (`isAway`: a phone through Remote Control, a chat channel; the clipboard would be the
 * terminal's, not theirs) or in a cloud session (a computer nobody sees): the caller then gives the text where it
 * can be read, as it does when the copy fails (a fault of its own). A remote app that takes no copy yet (Claude
 * Code Desktop, VS Code, the mobile app answer `no-clipboard`) is no fault: nothing broke.
 */
async function deliver($: EngineInterface, text: string, isAway: boolean, surface?: RenderSurface): Promise<boolean> {
  if (isAway || (await isCloudSession($).catch(() => false))) return false
  try {
    const copied = await $.ui.copy({ text, ...(surface !== undefined ? { surface } : {}) })
    if (copied.isCopied) {
      faultOk($, 'copy')
      return true
    }
    // Left out, the surface is the session's first, as the engine copies on it.
    const target = surface ?? (await $.session.surfaces().catch(() => []))[0]
    if (copied.reason === 'no-clipboard' && target !== undefined && target !== 'terminal') return false
    void fault($, 'copy', `copy:${copied.reason}`, '클립보드에 복사하지 못했습니다')
  } catch (error) {
    void fault($, 'copy', faultCode(error), '클립보드에 복사하지 못했습니다')
  }
  return false
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

/** Cells a row of the concepts to review takes with its slip, cut at its end past them. */
const DUE_SLIP_CELLS = 56

/** This repository's team terms as the pane shows them (1.7.0 D6): how many, the ones not met yet, and where to practise them. */
type TeamProgress = { total: number; unmet: readonly TeamTerm[]; way: TeamWay }

/**
 * Every concept the notes have taught: one head line of how many and this
 * week's progress, this repository's team terms met of all (`team`, 1.7.0 D6),
 * the ones worth a second look (q while today's review has questions `left`),
 * then all of them but the ones known, the most met first, each with the notes
 * in the pane that taught it (`· 팀 용어` right after the count on one that
 * came in as a team term, `marks`); the known ones folded into a line.
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
  slipRecord: Readonly<Record<string, LearnSlip>> = {},
  team?: TeamProgress,
  marks: Readonly<Record<string, readonly string[]>> = {},
) {
  const { Box, Text, Markdown, Button } = el
  const total = Object.keys(index).length
  // How far the team terms are, under the head line: met of all and where to practise, the first few still to meet dim under it.
  const teamLines = team && (
    <Box flexDirection="column">
      <Text wrap="truncate-end" dimColor={team.unmet.length === 0}>
        {teamMetText(team.total, team.unmet.length)}
        {team.unmet.length > 0 && <Text dimColor> · {team.way}</Text>}
      </Text>
      {team.unmet.length > 0 && (
        <Text dimColor wrap="truncate-end">
          {teamLeftText(team.unmet)}
        </Text>
      )}
    </Box>
  )
  if (total === 0) {
    return (
      <Box flexDirection="column">
        {teamLines}
        <Box marginTop={teamLines ? 1 : 0}>
          <Text dimColor>아직 모인 개념이 없습니다. 노트가 쓰이면 "배울 개념"이 여기에 쌓입니다.</Text>
        </Box>
      </Box>
    )
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
            ×{one.count}
            {/* Right after the count (1.7.0 D6), as the review is: a narrow pane cuts the dates at the end first. */}
            {isTeamTerm(marks, one.key) ? ' · 팀 용어' : ''} · {reviewText(one, now)} · 최근 {dayWhen(one.lastAt, now)}
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
      {teamLines}
      {queue.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow" wrap="wrap">
            복습할 개념 {due.length}개{' '}
            <Text dimColor>· 틀린 것 먼저, 잊을 때쯤 다시 나옵니다 · {left > 0 ? 'q로 복습' : '오늘 몫은 마쳤습니다 · 4로 퀴즈'}</Text>
          </Text>
          {queue.map(one => {
            // What the learner got wrong on it, where a quiz found a slip still open (1.7.0); its date is in /learn 기록.
            const slip = openSlip(slipRecord, one.key)
            return (
              <Text key={`due-${one.key}`} dimColor wrap="truncate-end">
                {'  '}
                {slip && slip.what !== ''
                  ? cutCells(`${one.name} · 헷갈린 점: ${slip.what}`, DUE_SLIP_CELLS)
                  : `${one.name} · ${isMissed(one) ? `퀴즈 틀림 ${when(one.missedAt ?? now, now)}` : dueText(one, now)}`}
              </Text>
            )
          })}
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
 * 바꿔 보기): the learner types an answer for Claude to grade (i, Enter),
 * after a hint (h) if they like. A first try short of right gets a question
 * asked back and a field for one try again, the answer (a, graded as the first
 * try was) and f (맞았는데요) under it. Where no field is drawn (the mobile
 * app), or a grade did not come back, the answer (a) shows for the learner to
 * grade themselves (o, x). A wrong one comes first next time. The questions
 * already graded stay above as one line each, the last one Claude graded
 * opened up (unless a try again is on show), with the note that taught its
 * concept (n) when it was wrong and the pane holds that note. `start`: what
 * s says it asks before a quiz's first (quizStartText, 1.7.0 D6: the team
 * terms not met yet in the places the review leaves free).
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
  surface: RenderSurface,
  slipOf: (key: string) => LearnSlip | undefined = () => undefined,
  start = quizStartText(0, 0),
  isAdded: (item: LearnQuizItem) => boolean = () => false,
) {
  const { Box, Text, Markdown, Button } = el
  // The mobile app draws no text field yet: there the answer is shown and graded by hand.
  const Input = fieldOf(el, surface)
  const items = current?.items ?? []
  const graded = items.filter(item => item.result !== undefined)
  const right = graded.filter(item => item.result === 'right').length
  const at = items.findIndex(item => item.result === undefined)
  // The answer graded last, when Claude graded it, stays open with its feedback until the next one is graded,
  // or a try again is on show (its f is the try's own).
  const lastAt = graded.length === 0 ? -1 : items.indexOf(graded.reduce((a, b) => ((b.gradedAt ?? 0) >= (a.gradedAt ?? 0) ? b : a)))
  const opened = lastAt !== -1 && items[lastAt]?.verdict !== undefined && items[at]?.firstTry === undefined ? lastAt : -1
  const fieldKey = (i: number) => quizFieldKey(current?.at ?? 0, i)
  // The note that taught a concept answered wrong, where this pane has it: n there, once Tab has left the next field.
  const taughtOf = (item: LearnQuizItem) => (item.result === 'wrong' && item.noteId !== undefined && list.some(note => note.id === item.noteId) ? item.noteId : undefined)
  const isTaughtOpen = opened !== -1 && taughtOf(items[opened]!) !== undefined
  return (
    <Box flexDirection="column">
      <Text bold wrap="truncate-end">
        {isTeamOnlyQuiz(items) ? '팀 용어 퀴즈' : '복습 퀴즈'}
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
      {current && run.armedNew === current.at && items.length > graded.length && !run.isMaking && (
        <Text color="yellow" wrap="wrap">
          풀던 문제 {items.length - graded.length}개가 남았습니다 · s를 한 번 더 누르면 새 문제를 받습니다
        </Text>
      )}
      {!hasConcepts && <Text dimColor>{NO_CONCEPTS_FOR_QUIZ}</Text>}
      {hasConcepts && items.length === 0 && !run.isMaking && (
        <Text dimColor wrap="wrap">
          {start} · 먼저 떠올려 적어 보세요. 틀린 답을 바로잡을 때 더 오래 남습니다
          {Input ? " · 모르면 '모르겠어요'라고 적고 Enter" : ''}
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
          const taught = taughtOf(item)
          const isElsewhere = item.result === 'wrong' && item.noteId !== undefined && taught === undefined
          // What the grade did with its concept's slip (1.7.0), dim under the feedback; green once one asked again is mended.
          const record = slipOf(item.key)
          const notice = slipNotice(item, record, isHelpedGrade(item))
          // A team term this grade put in the concept index (1.7.0 D6); a miss's place in the next quiz unless the notice says it.
          const added = isAdded(item) ? teamAddedText(isFullMiss(item) && !notice) : undefined
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
              {added && (
                <Text dimColor wrap="wrap">
                  {added}
                </Text>
              )}
              {notice && (
                <Text color={notice.kind === 'fixed' ? 'green' : undefined} dimColor={notice.kind !== 'fixed'} wrap="wrap">
                  {notice.kind === 'again' && isWorkedNext(record, item)
                    ? `${notice.text}${taught ? ' · n: 이 개념을 배운 노트' : ''} · ${WORKED_NEXT}`
                    : notice.kind === 'again' && taught
                      ? `${notice.text} · n: 이 개념을 배운 노트 · 거기서 r로 따라가기`
                      : notice.text}
                </Text>
              )}
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
        const first = item.firstTry
        // An answer that did not go in stays in the field; one whose grade did not come back may have its answer seen and graded by hand.
        const draft = isDraftOf(run, current.at, i) ? run.draft!.text : ''
        const isUngraded = isDraftOf(run, current.at, i) && run.draft!.isFailed === true
        return (
          <Box key={`quiz-${i}`} flexDirection="column" marginTop={1}>
            <Text bold>
              문제 {i + 1}/{items.length}
              {rungName(item) ? ` · ${rungName(item)}` : ''}
              {item.team ? ' · 팀 용어' : ''}
              {item.kind !== undefined ? ` · ${KIND_LABEL[item.kind]}` : ''}
            </Text>
            {item.teamCode && (
              <Text dimColor wrap="truncate-end">
                {teamCodeHead(item.teamCode)}
              </Text>
            )}
            <Markdown text={item.question} />
            {item.hint !== undefined && item.isHinted === true && first?.nudge !== item.hint && (
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
            ) : first !== undefined ? (
              <Box flexDirection="column" marginTop={1}>
                <Text color={first.verdict === 'partial' || isBlankAnswer(first.mine) ? 'yellow' : 'red'} wrap="wrap">
                  {firstTryHead(first)}
                </Text>
                {!isBlankAnswer(first.mine) && (
                  <Text dimColor wrap="wrap">
                    내 답: {first.mine}
                  </Text>
                )}
                {first.feedback !== '' && <Markdown text={first.feedback} />}
                <Markdown text={`**${nudgeLabel(first)}:** ${first.nudge}`} />
                {Input && (
                  <Input
                    key={`${fieldKey(i)}-again`}
                    autoFocus
                    label="내 답 (한 번 더)"
                    placeholder="고쳐 적기"
                    submitLabel="다시 채점"
                    value={draft}
                    onSubmit={value => void checkAnswer($, cfg, i, value)}
                  />
                )}
                <Box flexWrap="wrap" columnGap={2}>
                  {Input && (
                    <Button key="quiz-type" hotkey="i" plain label="답 적기" onPress={() => void $.ui.focus({ requestId: PANE, key: `${fieldKey(i)}-again` }).catch(() => undefined)} />
                  )}
                  <Button key="quiz-answer" hotkey="a" plain label="정답 보기" onPress={() => answerInPane($, cfg, i)} />
                  {!isBlankAnswer(first.mine) && <Button key="quiz-flip" hotkey="f" plain dimColor label="맞았는데요" onPress={() => flipGrade($, cfg, i)} />}
                  {!Input && <Text dimColor>한 번 더: /learn 퀴즈 {i + 1} 새 답</Text>}
                </Box>
                {Input && isFocused && (
                  <Text dimColor wrap="wrap">
                    Enter: 다시 채점 · Tab: 버튼으로 ({['a 정답', ...(isBlankAnswer(first.mine) ? [] : ['f 맞았는데요'])].join(' · ')})
                  </Text>
                )}
              </Box>
            ) : (
              <Box flexDirection="column" marginTop={1}>
                {Input && (
                  <Input
                    key={fieldKey(i)}
                    autoFocus
                    label="내 답"
                    placeholder="답을 적고 Enter"
                    submitLabel="채점받기"
                    value={draft}
                    onSubmit={value => void checkAnswer($, cfg, i, value)}
                  />
                )}
                <Box flexWrap="wrap" columnGap={2}>
                  {Input && (
                    <Button key="quiz-type" hotkey="i" plain label="답 적기" onPress={() => void $.ui.focus({ requestId: PANE, key: fieldKey(i) }).catch(() => undefined)} />
                  )}
                  {item.hint !== undefined && item.isHinted !== true && <Button key="quiz-hint" hotkey="h" plain label="힌트" onPress={() => showHint($, i)} />}
                  {/* Before one try the answer is only for grading by hand: where no field is drawn, or a grade did not come back. */}
                  {(!Input || isUngraded) && <Button key="quiz-answer" hotkey="a" plain label="정답 보기" onPress={() => answerInPane($, cfg, i)} />}
                  {!Input && <Text dimColor>먼저 스스로 답해 보세요</Text>}
                </Box>
                {/* While the field holds the keys every letter is typed into it: how to reach the buttons. */}
                {Input && isFocused && (
                  <Text dimColor wrap="wrap">
                    답 칸에서 Enter: 채점 · 모르면 '모르겠어요' · Tab: 버튼으로 (
                    {[
                      ...(item.hint !== undefined && item.isHinted !== true ? ['h 힌트'] : []),
                      ...(isUngraded ? ['a 정답'] : []),
                      ...(isTaughtOpen ? ['n 배운 노트'] : []),
                      '1~4 보기',
                    ].join(' · ')}
                    )
                  </Text>
                )}
                {/* Where no Tab line is drawn (the desktop app, VS Code, a pane without the keys), the way out still is. */}
                {Input && !isFocused && (
                  <Text dimColor wrap="wrap">
                    모르면 '모르겠어요'라고 적고 Enter
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

/**
 * /learn 도움말 (commandHelp): as many lines as 1.6.1's. Every command and every key of the pane is named; the rare
 * commands share the 가끔 line, and the names kept out of it are listed at COMMAND_WORDS.
 */
const HELP = [
  'learn-notes 명령',
  '',
  '- `/learn`: 패널 열기 · 패널의 키를 쓰려면 터미널은 `ctrl+x tab`(또는 패널 클릭), 데스크톱 앱은 패널 클릭, Esc로 대화로 돌아갑니다 (숫자 키는 한/영 상관없이, 글자 키는 영문 상태에서. 한글 상태면 `q`가 `ㅂ`으로 들어갑니다)',
  '- `/learn 복습`: 오늘 복습을 패널 퀴즈로 바로 시작 · 답 칸에 바로 적고 Enter (패널이 없는 화면에서는 대화창에 문제를 냅니다)',
  '- 패널: `1` 노트 · `2` 전/후 · `3` 개념 모음 · `4` 퀴즈 · `q` 오늘 복습 바로 시작 · `p`·`n` 이전·다음 노트 · `w` 노트 쓰기, 다시 쓰기',
  '- 노트 아래: `t` 직접 해 보기(한 번 고친 뒤 `a` 예시 답) · `e` 더 쉽게 · `r` 예시로 따라가기 · `i` 질문하기 · `c` 복사',
  '- 퀴즈(`4`): 답을 적고 Enter로 채점 · 틀리면 되묻기를 보고 한 번 더 (모르면 `모르겠어요`) · Tab으로 버튼에 가서 `h` 힌트 · `i` 답 적기 · `a` 정답(한 번 적은 뒤 · 첫 판정대로 매김) · `f` 채점 바꾸기 · `s` 새 문제(남은 문제가 있으면 두 번) · `n` 틀린 개념을 배운 노트 · 정답을 채점 전에 봤으면(입력칸이 없는 화면 · 채점 실패 · `/learn 퀴즈 정답`) `o`·`x`로 채점',
  '- `/learn 퀴즈`: 대화창에서 풀기 · 풀던 퀴즈, 없으면 복습할 개념으로 새 퀴즈 · `/learn 퀴즈 내 답`: Claude에게 채점받기 · `새로` · `힌트`(`힌트 2`) · `정답`',
  '- `/learn 정리`: 오늘 배운 것 정리 (`어제` · `이번주` · `최근 7일` · `2026-10-03`도 됩니다)',
  '- `/learn 질문 …`: 패널에서 고른 노트(없으면 마지막 노트)에 대해 묻기',
  '- `/learn 기록`: 연속 학습일 · 정답률 · 복습할 개념 · 배운 개념 · 모델 호출 수',
  '- `/learn 보고서`: 코드 없는 학습 보고서를 클립보드와 파일로 (최근 7일 · `이번주` · `어제`도 됩니다)',
  '- `/learn 공유`: 고른 노트를 요청·경로 없이 복사해 멘토에게 묻기(`c`와 같음) · `/learn 퀴즈 팀`: 이 저장소의 팀 용어만으로 퀴즈',
  '- 가끔: `/learn 찾기 말` 노트 찾기 · `/learn 일지` 오늘 노트 목차(`어제` · `목록`도) · `/learn 합치기 A = B` 개념 합치기 · `/learn 안다 이름` 복습에서 빼기 · `/learn 모른다 이름` 되돌리기 · `/learn 안키` Anki 카드 · `/learn 비우기` 패널 비우기 · `/learn 진단` 막히면 담당자에게',
].join('\n')
/** The pane's two lines when drawing it failed (the Pane render's .catch). */
const RENDER_FAILED = '패널을 그리지 못했습니다 · /learn 진단을 복사해 팀에 보내 주세요'
const RENDER_STILL = '대화창의 /learn 퀴즈 · /learn 기록은 그대로 됩니다'
/** /learn's reply when its hook failed (its .catch). */
const COMMAND_FAILED = '이 명령을 마치지 못했습니다 · /learn 진단으로 무엇이 막혔는지 볼 수 있습니다'
/** The learning record tool's answer when it could not read the record. */
const TOOL_FAILED = '학습 기록을 읽지 못했습니다. 잠시 뒤 다시 해 보세요.'
/** Said at the top of the help while the learning record tool is there (hasTool): the record answers a plain question. */
const CHAT_HINT = '대화창에 그냥 물어봐도 됩니다: "오늘 배운 거 알려 줘"'

/** /learn 도움말: HELP, its title naming this build's version once read, with CHAT_HINT under it while the tool is registered. */
function commandHelp(): string {
  const [title = '', ...rest] = HELP.split('\n')
  const head = myVersion === undefined ? title : title.replace('learn-notes', `learn-notes ${myVersion}`)
  return [head, ...(hasTool ? [CHAT_HINT] : []), ...rest].join('\n')
}
/** What an unknown subcommand gets: the few most used, and where the rest are. */
const SHORT_HELP = '자주 쓰는 것: `/learn` 패널 · `/learn 복습` · `/learn 퀴즈` · `/learn 정리` · `/learn 질문 …` · `/learn 기록` · 전체는 `/learn 도움말`'
/**
 * Korean words for the subcommands, so `/learn 퀴즈` works as `/learn quiz` does. The help names one word each; kept
 * out of it are the other words for the same (도움, 문제, 요약, 보고, 묻기, 검색), 날짜 (days, as 일지 목록), 개념
 * and 통계 (the record, as 기록), 마지막 (share, its name before 1.7.0, as `last` is) and 저장 (save, retired in
 * 1.6.0: it answers with the few most used, SHORT_HELP).
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
  공유: 'share',
  마지막: 'share',
  합치기: 'merge',
  안다: 'know',
  모른다: 'unknow',
  저장: 'save',
  비우기: 'clear',
  안키: 'anki',
  진단: 'doctor',
}
/** What /learn save (저장), retired in 1.6.0, says above SHORT_HELP. */
const SAVE_RETIRED = '노트는 저절로 저장됩니다.'
/** Lines /learn day prints at most: the reply goes into the conversation the model reads. */
const DAY_LINES = 40
const QUIZ_USAGE = '쓰는 법: /learn 퀴즈 (풀던 문제 · 없으면 새 문제) · /learn 퀴즈 내 답 (또는 2 내 답) · 힌트 (힌트 2) · 정답 · 새로 · 맞음 1 · 틀림 2 · 팀 (팀 용어만)'
const ASK_USAGE = '쓰는 법: /learn 질문 물을 말 (예: /learn 질문 왜 let 대신 const를 썼어?) · 패널에서 고른 노트(없으면 마지막 노트)에 대해 답합니다'
const NO_QUIZ = '아직 낸 퀴즈가 없습니다. /learn 퀴즈로 먼저 문제를 받으세요.'
const KNOW_USAGE =
  '쓰는 법: /learn 안다 개념 이름 (쉼표로 여럿, 예: /learn 안다 const 선언, 화살표 함수) · 되돌리기: /learn 모른다 개념 이름 · 아는 개념은 복습과 퀴즈에서 빠집니다'
const MERGE_USAGE =
  '쓰는 법: /learn 합치기 합칠 개념 = 남길 개념  (예: /learn 합치기 Destructuring = 구조 분해 할당 · = 대신 => -> → | 도 됩니다 · 거꾸로 하면 되돌립니다)'
const EMPTY_TEXT = '아직 학습 노트가 없습니다. Claude가 파일을 고친 턴이 끝나면 생깁니다.'

/** Why a note has no text to read yet: being written (or waiting to try again), failed (with why), or not written by itself (and why). */
function noteState(note: LearnNote): string {
  if (isRetryArmed(note)) return retryText(note.retry!.why, '패널에서 w로 바로 쓰기')
  if (note.status === 'writing') return isWriting(note.id) ? '노트를 쓰는 중입니다' : '노트를 쓰다 멈췄습니다 · 패널에서 w로 다시 쓰기'
  if (note.status === 'failed') return `노트를 쓰지 못했습니다: ${note.text}`
  if (note.skip === 'format') return '띄어쓰기·줄바꿈만 바뀌어 노트를 쓰지 않았습니다 · 패널에서 w로 쓰기'
  if (note.skip === 'limit') return '하루 자동 노트 한도에 닿아 노트를 쓰지 않았습니다 · 패널에서 w로 쓰기'
  if (note.skip === 'quota') return `${quotaWhy(note.quota)} · 패널에서 w로 쓰기`
  return '자동 노트가 꺼져 있습니다'
}

/** A note as /learn says it where no pane can show: its time and files (each with its whole path), then its text. */
function noteAsText(note: LearnNote): string {
  const files = note.changes.map(c => `${c.file} (+${c.added} −${c.removed})`).join(', ')
  const more = note.moreFiles > 0 ? ` 외 ${note.moreFiles}개` : ''
  // Its practice with no line to change and no example answer (1.7.0): those are shown once tried, in the pane.
  const body = note.status === 'ready' ? hideDrillAnswer(note.text) : `(${noteState(note)})`
  const withheld = (note.withheld ?? []).length > 0 ? `\n\n노트에서 뺀 파일: ${withheldText(note.withheld ?? [])}` : ''
  return `**${stamp(note.at).time} · ${files}${more}**${withheld}\n\n${body}`
}

/**
 * The last note as /learn writes it where no pane shows it (noteAsText), and under a practice (1.7.0) how it is done
 * and, once the note is in its journal file, where its example is: neither t nor a is here. In a cloud session
 * (`isCloud`) its pane and journal are on the cloud computer, which nobody may see: the pane where one sees it, and no
 * file. The record tool has no such line.
 */
function lastNoteText(note: LearnNote, isCloud = false): string {
  if (note.status !== 'ready' || !drillOf(note.text, note.changes)) return noteAsText(note)
  const tail = isCloud
    ? '직접 해 보기: 데스크톱 앱에서 이 세션을 열면 패널에서 t로 고쳐 확인합니다'
    : `직접 해 보기: 패널에서 t로 고쳐 확인합니다${note.savedAs === 'ready' ? ' · 예시 답은 일지 파일에 있습니다' : ''}`
  return `${noteAsText(note)}\n\n${tail}`
}
