/** One file's change inside a turn, kept as unified-diff hunks. */
export type LearnChange = {
  /** The file as shown: relative to the project root when it lies inside. */
  file: string
  /** The absolute path the tool wrote. */
  path: string
  /** Which tool made it. */
  tool: 'Edit' | 'Write' | 'Bash' | 'PowerShell'
  kind: 'create' | 'update' | 'delete'
  added: number
  removed: number
  /** Unified-diff hunks (`@@ -a,b +c,d @@` and their lines), cut to fit; '' when the tool had no diff. */
  diff: string
  /** True when hunks or lines were dropped to fit, or there was no diff to keep. */
  isCut: boolean
}

/** Changes collected while a turn runs, before its note exists. */
export type LearnLive = {
  turnId: string
  prompt: string
  changes: LearnChange[]
  /** Files left out once the turn passed the per-note limit, each once. */
  dropped: string[]
  /** Files a shell command changed beyond the ones it listed. */
  unlisted: number
}

export type LearnNoteStatus = 'writing' | 'ready' | 'failed' | 'off'

/** One learning note: a turn's request, its changes and what to learn from them. */
export type LearnNote = {
  id: string
  turnId: string
  /** Milliseconds since the epoch when the turn ended. */
  at: number
  prompt: string
  /** Claude's own closing words for the turn, cut short. */
  answer: string
  changes: LearnChange[]
  moreFiles: number
  status: LearnNoteStatus
  /** The note as markdown when ready; the reason when failed. */
  text: string
  /** The status the journal last saved it with; null while never saved. */
  savedAs: LearnNoteStatus | null
  /** True for a note an earlier session wrote, loaded from the plugin's store. */
  isPast: boolean
  /** The project root the note belongs to; history is kept per root. */
  root: string
  /** Milliseconds since the epoch of its last change: of two copies, the newer wins. */
  updatedAt: number
  /**
   * Keys of the concepts this note added to the concept index (see LearnConcept).
   * A key from before a /learn merge stays as written: read it through the alias map (resolveKey).
   */
  concepts: string[]
  /** True once the day's learning record counted it (the first time it was written), so a rewrite does not count it again. */
  isCounted?: boolean
}

/** One concept the notes taught, kept across sessions and projects. */
export type LearnConcept = {
  /** The name as a note first wrote it. */
  name: string
  /** How many notes taught it. */
  count: number
  /** Milliseconds since the epoch: the first and the latest note that taught it. */
  firstAt: number
  lastAt: number
  /** The latest note's one-line explanation. */
  blurb: string
  /** The latest files it was seen in (at most five). */
  files: string[]
  /** Milliseconds since the epoch when a /learn quiz last went over it; absent while never quizzed. */
  reviewedAt?: number
  /** Milliseconds since the epoch when the learner said they got its quiz question wrong (/learn quiz 틀림); cleared when a later quiz goes over it. */
  missedAt?: number
  /**
   * Its spaced-review step once quizzed: due again 1, 3, 7, 14, 30 or 60 days after it was last met.
   * A right answer moves it a step on (once a day at most), a wrong one back to 0; absent, the notes that met it again count.
   */
  step?: number
}

/** One quiz question about a concept; the answer stays hidden until /learn quiz 정답, or a in the pane's quiz. */
export type LearnQuizItem = {
  key: string
  name: string
  question: string
  answer: string
  /** True once the pane showed its answer (a). */
  isShown?: boolean
  /** How the learner graded their own answer: o and x in the pane, or /learn quiz 정답 · 틀림. */
  result?: 'right' | 'wrong'
  /** Milliseconds since the epoch when it was graded: a later 틀림 moves that day's count. */
  gradedAt?: number
}

/** One day's learning: notes written, and quiz answers the learner graded right and wrong. */
export type LearnDayActivity = { notes: number; right: number; wrong: number }

/** A quiz the pane is asking the model for, and why the last try failed. */
export type LearnQuizRun = { isMaking: boolean; error: string | null }

/** What the pane shows for the selected note. */
export type LearnView = 'note' | 'split' | 'diff' | 'concepts' | 'quiz'

/** A prompt as it entered, and whether its text is a request of its own (a person's, a schedule's) rather than a notification. */
export type LearnSubmit = { text: string; isRequest: boolean }

declare module 'claude-code' {
  interface PluginState {
    'learn-notes': {
      notes: LearnNote[]
      live: LearnLive | null
      /** The note on screen; null follows the newest. */
      selectedId: string | null
      view: LearnView
      /** True once the pane opened by itself this session. */
      autoOpened: boolean
      /** The concept index by key, mirrored from the plugin's store for drawing. */
      concepts: Record<string, LearnConcept>
      /** The project root the pane's notes were loaded for; null before the first load. */
      root: string | null
      /** Concept keys merged into others (/learn merge): old key → the key it counts under now. */
      aliases: Record<string, string>
      /** The last /learn quiz: its questions, and whether the answers were shown. */
      quiz: { at: number; items: LearnQuizItem[]; isRevealed: boolean } | null
      /** The pane's quiz request: whether one is out, and the last failure to show. */
      quizRun: LearnQuizRun
      /** Each day's notes and graded quiz answers (YYYY-MM-DD → counts), mirrored from the plugin's store for drawing. */
      activity: Record<string, LearnDayActivity>
      /** The latest prompts that entered and the last real request: read when a turn starts, kept here so a reload keeps them. */
      submitted: { list: LearnSubmit[]; lastRequest: string | null }
    }
  }
}
