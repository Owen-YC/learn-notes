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
  /** How many secrets (a key, a password) the diff had masked as «가림»; absent when none. */
  redacted?: number
}

/**
 * A changed file whose content stays out of the note, the journal and every model call:
 * `secret` a file that may hold secrets (.env, a private key), `generated` a lock or build output,
 * `excluded` one the excludePaths setting names, `policy` one the permission rules forbid reading.
 */
export type LearnWithheld = { file: string; why: 'secret' | 'generated' | 'excluded' | 'policy' }

/** Changes collected while a turn runs, before its note exists. */
export type LearnLive = {
  turnId: string
  prompt: string
  changes: LearnChange[]
  /** Files left out once the turn passed the per-note limit, each once. */
  dropped: string[]
  /** Files a shell command changed beyond the ones it listed. */
  unlisted: number
  /** Changed files left out of the note for what they may hold, each once (see LearnWithheld). */
  withheld: LearnWithheld[]
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
  /** True while the journal refused its latest writing (or, before 1.6.0, autoSave was off): the next save that works writes it too. */
  isUnsaved?: boolean
  /** The latest questions asked about this note (the pane's question field, /learn ask) with their answers. */
  asks?: LearnAsk[]
  /** Changed files whose content the note left out; absent when none (and on notes before 1.6.0). */
  withheld?: LearnWithheld[]
  /**
   * Why a turn's note was not written by itself (status `off`): `format` its files changed only in spaces and
   * line breaks, `limit` the day's automatic notes (dailyAutoNotes) were used up. w writes it all the same.
   */
  skip?: 'format' | 'limit'
}

/** One question about a note and the model's answer. */
export type LearnAsk = { question: string; answer: string; at: number }

/** A note's question in the pane: whether its answer is being written, and why the last one failed. */
export type LearnAskRun = {
  isAsking: boolean
  error: string | null
  /** A question whose answer did not come back, put back in the field to send again. */
  draft: string | null
}

/** A concept's spaced-review marks (see LearnConcept), as they were before a quiz grade; a grade at the last step can mark it known. */
export type LearnQuizMarks = Pick<LearnConcept, 'reviewedAt' | 'missedAt' | 'step' | 'knownAt'>

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
   * Its spaced-review step once quizzed: due again 1, 3, 7, 14, 30 or 60 days after it was last quizzed (first met,
   * while never quizzed). A right answer moves it a step on (once a day at most), one after a hint or the answer keeps
   * it, a partly right one a step back, a wrong one back to 0; absent, 0 for a concept met once and 1 for one met again.
   */
  step?: number
  /**
   * Milliseconds since the epoch when it was marked known: right again at the last step, or /learn 안다. A known
   * concept is left out of reviews, quizzes and the concepts list, and the next notes do not teach it again;
   * /learn 모른다 or a wrong answer takes the mark off.
   */
  knownAt?: number
}

/** One quiz question about a concept; its answer stays hidden until /learn quiz 정답 (one question at a time), or a in the pane's quiz. */
export type LearnQuizItem = {
  key: string
  name: string
  question: string
  answer: string
  /** A nudge toward the answer that does not give it away, asked for with the question; absent on quizzes made before 1.4.0. */
  hint?: string
  /** True once the learner looked at the hint (h in the pane, /learn quiz 힌트). */
  isHinted?: boolean
  /** True once its answer was shown: a in the pane, /learn quiz 정답 (this question), or a grade. */
  isShown?: boolean
  /** How the learner graded their own answer: o and x in the pane, or /learn quiz 정답 · 틀림. */
  result?: 'right' | 'wrong'
  /** Milliseconds since the epoch when it was graded: a later 틀림 moves that day's count. */
  gradedAt?: number
  /** The learner's own answer, when they typed one and had Claude grade it. */
  mine?: string
  /** Claude's grade of `mine`: right, partly right (counted wrong, so it comes back soon), or wrong. */
  verdict?: 'right' | 'partial' | 'wrong'
  /** Claude's one or two sentences on `mine`: what was right, what was missing. */
  feedback?: string
  /** Its concept's marks from before this grade, so turning the grade the other way (f) starts from there. */
  before?: LearnQuizMarks
  /** True once the learner set the grade themselves over Claude's (f, /learn quiz 맞음 · 틀림): fully right or fully wrong. */
  isLearnerGraded?: boolean
  /**
   * What the question asks (T1 in the model's reply): the output or value of some code (예측), why a line is
   * there or what changes without it (왜), or how to change the code to do something else (바꿔 보기);
   * absent on quizzes made before 1.6.0, or when the model named none.
   */
  kind?: 'predict' | 'why' | 'modify'
  /** The note that taught its concept, whose code the question was made from (a note quiz's own note, else the latest that did); absent when no note held it. */
  noteId?: string
}

/** One day's learning: notes written, and quiz answers the learner graded right and wrong. */
export type LearnDayActivity = { notes: number; right: number; wrong: number }

/**
 * One day's model calls this plugin made (notes, quizzes, grades, questions, recaps): how many, how many of
 * them were notes written by themselves at a turn's end, and the tokens read (cached ones too) and written.
 */
export type LearnDayUsage = { calls: number; auto: number; input: number; output: number }

/** A quiz the pane is asking the model for, and why the last try failed. */
export type LearnQuizRun = {
  isMaking: boolean
  error: string | null
  /** The question whose typed answer Claude is grading now, if any. */
  checking?: number | null
  /** A typed answer whose grading failed, put back in its question's field to send again. */
  draft?: { at: number; i: number; text: string } | null
}

/** What the pane shows: the selected note or its code before and after, every concept, or the quiz. */
export type LearnView = 'note' | 'split' | 'concepts' | 'quiz'

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
      /**
       * The last quiz: its questions, whether every answer was shown (/learn quiz 정답 before 1.6.0; now written
       * false), and `from: 'note'` for a note's own quiz (t under a note).
       */
      quiz: { at: number; items: LearnQuizItem[]; isRevealed: boolean; from?: 'note' } | null
      /** The pane's quiz request: whether one is out, and the last failure to show. */
      quizRun: LearnQuizRun
      /** The pane's questions about notes, by note id: whose answer is being written, and the last failure to show. */
      askRun: Record<string, LearnAskRun>
      /** Each day's notes and graded quiz answers (YYYY-MM-DD → counts), mirrored from the plugin's store for drawing. */
      activity: Record<string, LearnDayActivity>
      /** The latest prompts that entered and the last real request: read when a turn starts, kept here so a reload keeps them. */
      submitted: { list: LearnSubmit[]; lastRequest: string | null }
    }
  }
}
