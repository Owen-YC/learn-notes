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
  /** The latest questions asked about this note (the pane's question field, r, e since 1.6.0, /learn ask) with their answers. */
  asks?: LearnAsk[]
  /** Changed files whose content the note left out; absent when none (and on notes before 1.6.0). */
  withheld?: LearnWithheld[]
  /**
   * Why a turn's note was not written by itself (status `off`): `format` its files changed only in spaces and
   * line breaks, `limit` the day's automatic notes (dailyAutoNotes) were used up, `quota` (1.7.0) the account's
   * five-hour or seven-day window was nearly used up (see `quota`). w writes it all the same.
   */
  skip?: 'format' | 'limit' | 'quota'
  /** With skip `quota`: which window was past its mark (QUOTA_YIELD). */
  quota?: 'five_hour' | 'seven_day'
  /**
   * While an automatic note's call that failed for a while (a busy server, a server error, a dropped connection,
   * its time limit) waits for its one try again (1.7.0), and while that try's call runs: when it is due, the token
   * its timer holds (a w meanwhile clears it, so the timer writes nothing), and why the first failed. Status
   * `writing` the while. A reload that cuts the try takes it up as that try, never a third call.
   */
  retry?: { at: number; token: string; why: 'overloaded' | 'server' | 'network' | 'timeout' }
  /**
   * True once a reload's session start took this note, left being written, up again by itself (1.7.0): never twice,
   * its own try again included. A w starts the note over and clears it.
   */
  resumed?: true
  /**
   * While a ready note is written again (w): the note as it was, put back if the new version fails, and by the next
   * load's session start if a reload cuts the call (resumeNotes), or read back so from the store (1.7.0).
   */
  previous?: { status: 'ready'; text: string }
  /** How the learner did at the note's practice (`### 직접 해 보기`, t under it, 1.7.0); absent while never tried. */
  drill?: LearnDrill
}

/**
 * A note's practice as the learner left it (1.7.0, LearnNote.drill; 1KB of JSON at most): a first try short of right
 * that Claude asked back on, waiting for its one try again; or the last grade (`verdict`), with the line it graded
 * (`mine`, its secrets masked), Claude's feedback ('' for a grade made with no call) and `isRetried` when it came
 * right on the try again; and `isAnswerSeen` once the example answer was shown (a), a grade or none (where no field
 * is drawn, the example is shown with no try). The project's file is never changed.
 */
export type LearnDrill = {
  mine?: string
  verdict?: 'right' | 'partial' | 'wrong'
  feedback?: string
  firstTry?: LearnQuizFirstTry
  isRetried?: true
  isAnswerSeen?: true
  /** Milliseconds since the epoch of its last change. */
  at: number
}

/**
 * The pane's practice under a note (1.7.0, t): the note whose practice is open, the one whose line Claude is checking
 * now, and what the last Enter there said when it checked nothing (no change, a Korean input mode) or could not check.
 */
export type LearnDrillRun = {
  open: string | null
  checking: string | null
  notice: { id: string; text: string; isError?: boolean } | null
}

/** One question about a note and the model's answer; a key's (r, e) is kept as its label (`예시로 따라가기`, `더 쉽게`). */
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
  /** The name as a note first wrote it (a plain-words gloss on its end left off since 1.6.0, see fullName). */
  name: string
  /**
   * The name as it was stored, a gloss and all, where `name` shows it shorter. Never stored itself: the store keeps
   * it as the name, as it was written (a 1.5 session reads it there). The front of its Anki card, so a card imported
   * before is the same card. A rename (/learn merge to a new name) drops it.
   */
  fullName?: string
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
   * A step a quiz gave before this store first ran 1.6.0 is read as 1 at most: 1.5 began it at the notes that met it.
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
  /** The note that taught its concept, whose code the question was made from (the latest that did; a note's own quiz before 1.7.0, that note); absent when no note held it. */
  noteId?: string
  /**
   * A typed answer's first try short of right, kept while the question waits for one try again (1.7.0): absent on
   * quizzes made before, and on questions answered right at once or graded with no try again. It stays once the
   * question is graded, so a right second try keeps its concept's step (recalled with help).
   */
  firstTry?: LearnQuizFirstTry
  /**
   * True for a question asked again about a concept whose slip (LearnSlip) was still open when the quiz was made
   * (1.7.0, 다시 도전): asked in other code, its slip never in the question. Absent when the question gave the slip
   * away: then a right answer does not mend it.
   */
  isRetry?: true
  /**
   * Which code the question asks in (1.8.0, the question ladder): the learner's own (`mine`), that code with one thing
   * changed (`changed`, 비슷한 코드: off from 1.9.0), code never seen (`new`, 처음 보는 코드: off in 1.8.0 and 1.9.0), or
   * a worked example first and a like question after it (`worked`, 풀이 보고 풀기), once its concept was missed twice
   * running. Absent on quizzes made before, and where the model did not keep to it. A 1.7 window knows no such field
   * and drops it when it writes the quiz back: the question is then one as any other, a right answer a step on,
   * mending no slip.
   */
  rung?: 'worked' | 'mine' | 'changed' | 'new'
  /** The wrong idea Claude read in the typed answer this grade went by (1.7.0), and its kind; absent when none was named. */
  slip?: string
  slipType?: LearnSlipType
  /**
   * The concept's slip as it was before this grade changed it (null for none), so turning the grade the other way
   * (f) starts from there; absent when the grade left it as it was.
   */
  slipBefore?: LearnSlip | null
  /**
   * True for a team term of the repository the quiz was made in (1.7.0): one of its team file's `## 용어`, asked by
   * the team's words and code. Graded, it goes in the concept index if it is not there yet (its `before` then absent),
   * and is marked a team term (the store's `teamTerms`).
   */
  team?: true
  /** Where the team's lines it was asked from are (1.7.0): the file's name and the lines, `isDoc` for a team doc (팀 노트). */
  teamCode?: { file: string; from: number; to: number; isDoc?: true }
  /**
   * A team term's repository (1.7.0): the tag of the one the quiz was made in, which its grade marks it a team term of
   * wherever the grade comes (a quiz is every window's); and the words that grade puts in the concept index (160
   * characters at most, its path taken out and its secrets masked).
   */
  teamTag?: string
  teamBlurb?: string
}

/**
 * The first try at a question (LearnQuizItem.firstTry): the learner's answer, Claude's grade of it (partly right or
 * wrong) and its feedback, and the question asked back (되묻기) for one try again; or, for an answer that only said
 * "모르겠어요" (isBlankAnswer), the question's hint in the nudge's place, with no grade asked for (`feedback` empty).
 */
export type LearnQuizFirstTry = {
  mine: string
  verdict: 'partial' | 'wrong'
  feedback: string
  nudge: string
  at: number
  /** The wrong idea Claude read in this answer, and its kind (1.7.0); absent when it named none, or for "모르겠어요". */
  slip?: string
  slipType?: LearnSlipType
}

/**
 * A slip's kind (1.7.0): one of the nine a grade names (유형: 실행 순서·비동기, 값과 참조, 변수 범위, 자료형·형 변환,
 * 경계와 조건, 없는 값, 반환과 출력, 상태가 바뀌는 때, 기타), or `blank` for an answer with nothing to read one from
 * ("모르겠어요", two characters or fewer). Shown since 1.8.0 only on /learn 기록's line for a kind slipped on often.
 */
export type LearnSlipType = 'order' | 'reference' | 'scope' | 'coercion' | 'boundary' | 'nullish' | 'output' | 'state' | 'other' | 'blank'

/**
 * What a learner got wrong about one concept in a quiz (1.7.0, the store's `slips`, by concept key): the wrong idea
 * their typed answer showed (`what`, one short sentence; '' for `blank`), its kind, the question and their answer
 * (cut short, secrets masked), when it was last missed and how many times running (from 1 again on one mended, 1.8.0),
 * and when a later quiz showed it mended, or the concept was marked known (`fixedAt`). The next quiz on an open one
 * asks it again in other code (다시 도전).
 * `isRight` marks one the grade that kept it still counted right, on the try again after the question asked back
 * (헷갈린 점을 바로 고쳤습니다): that one is asked again on another day, by no quiz the same day.
 */
export type LearnSlip = { what: string; type: LearnSlipType; question: string; mine: string; at: number; times: number; fixedAt?: number; isRight?: true }

/**
 * One day's learning: notes written, and quiz answers the learner graded right and wrong. `drills` (1.7.0): how many of
 * those answers were a note's practice (t), which count right and wrong but not toward the day's review; absent for none.
 */
export type LearnDayActivity = { notes: number; right: number; wrong: number; drills?: number }

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
  /**
   * A typed answer that did not go in, put back in its question's field to send again: its grade failed
   * (`isFailed`, the answer may then be seen and graded by hand), or another answer was being graded.
   */
  draft?: { at: number; i: number; text: string; isFailed?: boolean } | null
  /** The quiz (by when it was asked) whose s was pressed once with questions still to grade: the next s makes a new one. */
  armedNew?: number | null
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
       * The last quiz: its questions, and whether every answer was shown (/learn quiz 정답 before 1.6.0; now written
       * false). A note's own quiz (t before 1.7.0, `from: 'note'` in the store) reads as a review quiz.
       */
      quiz: { at: number; items: LearnQuizItem[]; isRevealed: boolean } | null
      /** The pane's quiz request: whether one is out, and the last failure to show. */
      quizRun: LearnQuizRun
      /** The pane's questions about notes, by note id: whose answer is being written, and the last failure to show. */
      askRun: Record<string, LearnAskRun>
      /** Each day's notes and graded quiz answers (YYYY-MM-DD → counts), mirrored from the plugin's store for drawing. */
      activity: Record<string, LearnDayActivity>
      /** The latest prompts that entered and the last real request: read when a turn starts, kept here so a reload keeps them. */
      submitted: { list: LearnSubmit[]; lastRequest: string | null }
      /**
       * What the notice that a newer build is open has said this session: the newest version it named, and whether it
       * said the store was newer. Only ever raised; kept here, so a reload of an old window does not say it again.
       */
      newerSaid: { newest: string | null; isBehind: boolean } | null
      /** The slips by concept key (see LearnSlip), mirrored from the plugin's store for drawing. */
      slips: Record<string, LearnSlip>
      /**
       * The concepts that came in as a repository's team terms (1.7.0), by concept key, each with the repositories'
       * tags (rootTag), mirrored from the plugin's store for drawing (`· 팀 용어` on the concept's line).
       */
      teamTerms: Record<string, string[]>
      /** The pane's practice under a note (1.7.0, t): which is open, which is being checked, the last word said. */
      drillRun: LearnDrillRun
    }
  }
}
