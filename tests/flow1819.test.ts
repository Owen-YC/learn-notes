// The tests of builds 1.8.0 and 1.9.0: a window as a person runs it (the kit, flowkit.ts).
import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { LearnNote } from '../types'
import {
  BASE_LEAD,
  DRILL_RULE_AFTER,
  IS_BASE_ASKED,
  IS_RULE_DRILL,
  IS_THINK_ASKED,
  ASK_SYSTEM,
  CHECK_SYSTEM,
  QUIZ_SYSTEM,
  RECAP_SYSTEM,
  RULE_DRILL_SYSTEM,
  RULE_DRILL_TOKENS,
  SYSTEM,
  THINK_ASK,
  THINK_SYSTEM,
  WORKED_BASE_NEXT,
  WORKED_NEXT,
  RUNG_CHANGED_STEP,
  RUNG_NEW_STEP,
  STAMP_KEPT_MS,
  SWITCH_KINDS,
  MODEL_SWITCHES,
  WORKED_AFTER_TIMES,
  WORKED_CODE_ASK,
  WORKED_PLAIN_ASK,
  WORKED_PLAN_LINE,
  WORKED_TURN_ASK,
  WRITER_MARK,
  checkPrompt,
  cleanConcepts,
  cleanMarkedConcepts,
  conceptKey,
  indexPrint,
  parseTeamFile,
  ruleDrillPrompt,
  ruleNamesOf,
  screenNote,
  journalPath,
  knownMarks,
  markedConcepts,
  recallSteps,
  recapRange,
  reportMarkdown,
  rootTag,
  stamp,
  stepMarks,
  storedConcepts,
  switchKeys,
  traceQuestion,
  withKnownMarks,
  type Switches,
} from '../hooks/notes'
import { COEXIST_CASES, COEXIST_MIXED, type CoexistStore } from './fixtures/coexist19'
import { ROUTE19_CALLS, ROUTE19_DIAG } from './fixtures/route19'
import { INPUT_RULE19, OUTPUT_RULE19 } from './fixtures/rule19'
import { CHANGED_QUIZ_OFF, CHANGED_QUIZ_ON } from './fixtures/changed110'
import { CHECK_19, CHECK_FIRSTS_110, CHECK_ITEM_110, CHECK_MINE_110, NEW_EXACT_110 } from './fixtures/check110'
import { THINK19_R, THINK19_SYSTEM, THINK19_TYPED } from './fixtures/think19'
import {
  CONCEPT_NOTE,
  COUNTER_QUOTE,
  EDIT_A,
  EDIT_FLOW,
  JOURNAL,
  NOTE_TEXT,
  NOW,
  PANE_PROPS,
  QUOTED_NOTE,
  type Reply,
  USAGE,
  WORKED_BOTH,
  type World,
  cells,
  finish,
  focusesOf,
  indexIn,
  learn,
  metInCode,
  mineKey,
  ownSteps,
  pane,
  start,
  turn,
  withFiller,
  world,
} from './flowkit'


describe('1.8.0: the store\'s own words for a full store, and the known and step copies written when they differ (E1)', () => {
  const DAY = 86_400_000
  /** Claude Code 2.1.302's refusal of a store write past its limit. */
  const STORE_FULL = 'learn-notes: $.store.set: the store would be 4194400 characters, over the 4194304 limit'
  const diag = async ($: Engine) => (await learn($, '진단')).text ?? ''
  const KNOWN = { name: '클로저', count: 2, firstAt: NOW - 9 * DAY, lastAt: NOW - 9 * DAY, blurb: '바깥 변수를 기억한다', files: [], knownAt: NOW - 5 * DAY }
  const STEPPED = { name: 'map', count: 3, firstAt: NOW - 30 * DAY, lastAt: NOW - 20 * DAY, blurb: '새 배열', files: [], step: 3, reviewedAt: NOW - DAY }
  /** A 1.6 or later store whose known and step copies match its index already. */
  const matched = () =>
    new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', { [conceptKey('클로저')]: KNOWN, [conceptKey('map')]: STEPPED }],
      ['known', { [conceptKey('클로저')]: KNOWN.knownAt }],
      ['steps', { [conceptKey('map')]: [STEPPED.step, STEPPED.reviewedAt] }],
    ])
  /** The index as a 1.6 session reads it: cleanConcepts, then the copies put back. */
  const as16 = (store: Map<string, unknown>) => recallSteps(withKnownMarks(cleanConcepts(store.get('concepts')), store.get('known')), store.get('steps'))

  test('a store refusing the notes in its own words: the toast, the next start\'s check line and /learn 진단 name the full store', async ($, on) => {
    let isFull = true
    on('store.set', { key: 'history' }, async (_$, e, next) => (isFull ? { deny: STORE_FULL } : next(e)))
    const w = world(on)
    await start($)
    await turn($, () => $.tool.call(EDIT_A), 't1')
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(w.toasts.filter(text => text.includes('이력을 저장하지 못했습니다'))).toEqual([
      '학습 노트 이력을 저장하지 못했습니다: 저장소가 4MB를 넘었습니다 · 다음 세션에 지난 노트가 빠질 수 있습니다 (일지 파일은 그대로) · /learn 진단',
    ])
    // Each note is stored as soon as it exists and again once written: four refusals, one line.
    expect(await diag($)).toMatch(/^ {2}- \d{2}-\d{2} \d{2}:\d{2} 저장소 · 저장소 4MB 넘음 ×4$/m)
    // Kept with the faults, it is the next start's check line, with its cause (1.7.0 said 저장소가 받지 않음).
    await w.clock.advance(61_000)
    await w.clock.settle()
    w.transcript.length = 0
    await start($)
    await w.clock.settle()
    expect(w.transcript.filter(line => line.startsWith('learn-notes 점검'))).toEqual(['learn-notes 점검: 저장소에 쓰지 못한 기록이 있음 (저장소 4MB 넘음) · /learn 진단'])
    isFull = false
  })

  test('a journal past the engine\'s 4MB: /learn 진단 says 4MB 넘음, the toast is 1.7.0\'s', async ($, on) => {
    const w = world(on)
    w.writeFails = true
    w.writeError = `learn-notes: $.fs.write: ${JOURNAL} refused: 4200000 bytes is over the 4194304-byte limit`
    await start($)
    await turn($, () => $.tool.call(EDIT_A), 't1')
    await finish(w)
    expect(w.toasts.filter(text => text.startsWith('학습 노트를 파일에 쓰지 못했습니다'))).toEqual(['학습 노트를 파일에 쓰지 못했습니다 · 다음 노트 때 다시 씁니다 · /learn 진단'])
    const reply = await diag($)
    expect(reply).toMatch(/ 일지 저장 · 4MB 넘음$/m)
    expect(reply).not.toContain('알 수 없는 오류')
  })

  test('a note teaching a new concept writes the index alone when the known and step copies match it already', async ($, on) => {
    const store = matched()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.sets.length = 0
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.sets).toContain('concepts')
    expect(w.sets).not.toContain('known')
    expect(w.sets).not.toContain('steps')
    // Read as a 1.6 session reads it, every mark is where it was, the new concept beside them.
    const read = as16(store)
    expect(read[conceptKey('for...of 반복문')]).toMatchObject({ name: 'for...of 반복문', count: 1 })
    expect(read[conceptKey('클로저')]!.knownAt).toBe(KNOWN.knownAt)
    expect(read[conceptKey('map')]).toMatchObject({ step: 3, reviewedAt: STEPPED.reviewedAt })
  })

  test('a known mark taken off is written off its copy: a 1.6 session reading the store does not put it back', async ($, on) => {
    const store = new Map<string, unknown>([['concepts', { [conceptKey('클로저')]: { ...KNOWN, knownAt: undefined } }]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await learn($, '안다 클로저')
    expect(store.get('known')).toEqual({ [conceptKey('클로저')]: NOW })
    expect(as16(store)[conceptKey('클로저')]!.knownAt).toBe(NOW)
    w.sets.length = 0
    expect((await learn($, '모른다 클로저')).text).toBe('아는 개념 표시를 지웠습니다: 클로저. 다시 복습과 퀴즈에 나옵니다.')
    expect(w.sets).toContain('known')
    expect(store.get('known')).toEqual({})
    // No step changed: its copy is left as it is.
    expect(w.sets).not.toContain('steps')
    expect(as16(store)[conceptKey('클로저')]!.knownAt).toBeUndefined()
    // A 1.5 session writing the index without the field changes nothing either.
    store.set('concepts', { [conceptKey('클로저')]: { ...KNOWN, knownAt: undefined } })
    expect(as16(store)[conceptKey('클로저')]!.knownAt).toBeUndefined()
  })

  test('a right answer that steps a concept past the first writes its step copy, as the index has it, and leaves the known copy', async ($, on) => {
    const due = { ...STEPPED, step: 1, reviewedAt: NOW - 3 * DAY }
    const store = new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', { [conceptKey('map')]: due }],
      ['known', {}],
      ['steps', {}],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = 'Q1: 문제 하나\nA1: 답 하나'
    await learn($, 'quiz')
    await w.clock.settle()
    w.sets.length = 0
    w.answer = '판정: 맞음\n피드백: 정확합니다.'
    await learn($, 'quiz 1 새 배열을 만들어요')
    await w.clock.settle()
    const stored = (store.get('concepts') as Record<string, { step?: number; reviewedAt?: number }>)[conceptKey('map')]!
    expect(stored.step).toBe(2)
    expect(w.sets).toContain('steps')
    expect(w.sets).not.toContain('known')
    expect(store.get('steps')).toEqual({ [conceptKey('map')]: [2, stored.reviewedAt] })
    // Read as a 1.6 session reads it: the step is its own, not one a 1.5 session gave.
    expect(as16(store)[conceptKey('map')]).toMatchObject({ step: 2, reviewedAt: stored.reviewedAt })
  })

  test('a 1.5 store with no known or step copies gets both at its first index write', async ($, on) => {
    const store = new Map<string, unknown>([['concepts', { [conceptKey('map')]: { ...STEPPED, step: 1, reviewedAt: NOW - DAY } }]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.sets).toEqual(expect.arrayContaining(['known', 'steps', 'concepts']))
    expect(store.get('known')).toEqual({})
    expect(store.get('steps')).toEqual({})
  })

  test('a copy that cannot be read again just before its write is written all the same', async ($, on) => {
    // The note's count reads the known copy twice: with the index (indexOf), then again just before writing it.
    let reads = 0
    let failing = 0
    on('store.get', { key: 'known' }, async (_$, e, next) => {
      reads += 1
      return reads === failing ? { deny: 'unreadable' } : next(e)
    })
    const store = matched()
    const w = world(on, 'ok', null, true, store)
    await start($)
    reads = 0
    failing = 2
    w.sets.length = 0
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(reads).toBeGreaterThanOrEqual(2)
    expect(w.sets).toEqual(expect.arrayContaining(['known', 'concepts']))
    expect(w.sets).not.toContain('steps')
    expect(store.get('known')).toEqual({ [conceptKey('클로저')]: KNOWN.knownAt })
    expect(as16(store)[conceptKey('for...of 반복문')]).toMatchObject({ count: 1 })
  })

  /**
   * A store whose one concept, `map`, is at `step` since `reviewedAt` and due, its step copy matching:
   * a grade then changes the copy's value under the same key, which a key-only comparison would not write.
   */
  const stepped = (step: number, reviewedAt: number) =>
    new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', { [conceptKey('map')]: { ...STEPPED, step, reviewedAt } }],
      ['known', {}],
      ['steps', { [conceptKey('map')]: [step, reviewedAt] }],
    ])
  /** Quizzes `map` and grades the answer with the model's `verdict` word; the concept as the index then holds it. */
  const graded = async ($: Engine, w: ReturnType<typeof world>, store: Map<string, unknown>, verdict: string) => {
    w.answer = 'Q1: 문제 하나\nA1: 답 하나'
    await learn($, 'quiz')
    await w.clock.settle()
    w.sets.length = 0
    w.answer = `판정: ${verdict}\n피드백: 정확합니다.`
    await learn($, 'quiz 1 새 배열을 만들어요')
    await w.clock.settle()
    return (store.get('concepts') as Record<string, { step: number; reviewedAt: number }>)[conceptKey('map')]!
  }
  /**
   * A later note teaching another concept, whose count reads the index from the store again as this version does
   * (indexOf, the step copy followed) and writes it back: `map` as the store then holds it, and `/learn 기록`.
   */
  const afterNote = async ($: Engine, w: ReturnType<typeof world>, store: Map<string, unknown>) => {
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const one = (store.get('concepts') as Record<string, { step: number }>)[conceptKey('map')]!
    return { step: one.step, record: (await learn($, '기록')).text ?? '' }
  }

  test('a right answer from step 2 rewrites its step copy, the same key with new values: every read keeps step 3', async ($, on) => {
    const before = NOW - 8 * DAY
    const store = stepped(2, before)
    const w = world(on, 'ok', null, true, store)
    await start($)
    const one = await graded($, w, store, '맞음')
    expect(one.step).toBe(3)
    expect(one.reviewedAt).toBeGreaterThan(before)
    expect(w.sets).toContain('steps')
    expect(w.sets).not.toContain('known')
    expect(store.get('steps')).toEqual({ [conceptKey('map')]: [3, one.reviewedAt] })
    // Read as a 1.6 session reads it, and as this one does at the next note's count: step 3, 14 days on (1.5's step 1 says 3).
    expect(as16(store)[conceptKey('map')]).toMatchObject({ step: 3, reviewedAt: one.reviewedAt })
    const later = await afterNote($, w, store)
    expect(later.step).toBe(3)
    expect(later.record).toContain('- **map** ×3 · 최근 ')
    expect(later.record).toContain('· 다음 복습 14일 뒤: 새 배열')
  })

  test('a partly right answer from step 3 rewrites its step copy too, a step back under the same key: every read keeps step 2', async ($, on) => {
    const before = NOW - 15 * DAY
    const store = stepped(3, before)
    const w = world(on, 'ok', null, true, store)
    await start($)
    const one = await graded($, w, store, '거의')
    expect(one.step).toBe(2)
    expect(one.reviewedAt).toBeGreaterThan(before)
    expect(w.sets).toContain('steps')
    expect(w.sets).not.toContain('known')
    expect(store.get('steps')).toEqual({ [conceptKey('map')]: [2, one.reviewedAt] })
    expect(as16(store)[conceptKey('map')]).toMatchObject({ step: 2, reviewedAt: one.reviewedAt })
    const later = await afterNote($, w, store)
    expect(later.step).toBe(2)
    expect(later.record).toContain('· 다음 복습 7일 뒤: 새 배열')
  })
})

describe('1.8.0: the question ladder, 비슷한 코드 and 풀이 보고 풀기 (E3)', () => {
  const DAY = 86_400_000
  const WHAT = '함수가 끝나면 바깥 변수도 사라진다고 봄'
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const missed = (what = WHAT, type = '변수 범위') => `판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${what}\n유형: ${type}`
  const ASKED_BACK = ['판정: 틀림', '피드백: 그 값은 바깥 변수가 아닙니다.', '되묻기: 안쪽 함수가 다시 불릴 때 c는 어디에 남아 있을까요?', `헷갈린 점: ${WHAT}`, '유형: 변수 범위'].join('\n')
  /** A worked example for question `n`, its example first and the question after 이제 풀어 보세요. */
  const worked = (n: number) =>
    [
      `T${n}: 예측`,
      `Q${n}: 풀이: \`let n = 0; const up = () => ++n; up(); up()\` 뒤 n은 2입니다. 바깥 변수는 함수가 끝나도 남기 때문입니다.`,
      '이제 풀어 보세요: 아래 코드는 무엇을 찍을까요?',
      '```js',
      'let c = 10',
      'const add = () => ++c',
      'add()',
      'console.log(c)',
      '```',
      `H${n}: 바깥 c가 어떻게 되는지 떠올려 보세요`,
      `A${n}: 11`,
    ].join('\n')
  /** A plain question for question `n`. */
  const plainQ = (n: number, text = '문제') => [`T${n}: 예측`, `Q${n}: ${text} ${n}`, `A${n}: 답 ${n}`].join('\n')
  const slipsOf = (store: Map<string, unknown>) => (store.get('slips') ?? {}) as Record<string, LearnSlipRow>
  type LearnSlipRow = { what: string; type: string; question: string; mine: string; at: number; times: number; fixedAt?: number; isRight?: true }
  const conceptOf = (store: Map<string, unknown>, name: string) => (store.get('concepts') as Record<string, { step?: number; reviewedAt?: number; missedAt?: number }>)[conceptKey(name)]!
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
  /** Concepts by name, each at `step` since `ago` before now (missed then when `isMissed`), with their step copies. */
  const storeOf = (names: string[], step: number, ago: number, isMissed: boolean, slips: Record<string, Partial<LearnSlipRow>> = {}) => {
    const concepts = Object.fromEntries(
      names.map(name => [
        conceptKey(name),
        { name, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step, reviewedAt: NOW - ago, ...(isMissed ? { missedAt: NOW - ago } : {}) },
      ]),
    )
    const rows = Object.fromEntries(
      Object.entries(slips).map(([name, row]) => [conceptKey(name), { what: WHAT, type: 'scope', question: '지난 문제의 코드', mine: '전역 변수', at: NOW - ago, times: 1, ...row }]),
    )
    return new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)], ['slips', rows]])
  }
  async function quizIn($: Engine, w: World, reply: string) {
    w.answer = reply
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    return ui
  }
  async function answer(ui: Awaited<ReturnType<typeof pane>>, w: World, key: string, text: string, reply: string) {
    w.answer = reply
    await ui.input({ key, text })
    await w.clock.settle()
  }

  test('a concept at its third step is asked in its code changed: 비슷한 코드 in the pane\'s title and in the conversation', async ($, on) => {
    const name = 'for...of 반복문'
    const store = storeOf([name], 2, 8 * DAY, false)
    // Two concepts met in no note and not due for weeks fill the quiz to three picks after it: code changed is asked
    // only in a quiz of three with no team term (1.10.0 G2, D33), the shape its sample measures.
    const concepts = store.get('concepts') as Record<string, unknown>
    for (const filler of ['채움 하나', '채움 둘']) concepts[conceptKey(filler)] = { name: filler, count: 1, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${filler} 설명`, files: [], step: 3, reviewedAt: NOW }
    store.set('steps', ownSteps(concepts as never))
    const w = world(on, 'ok', null, true, store)
    // On as 1.8.0 shipped it, whatever its constant (1.9.0 F4 turned it off by its sample): a harness's step.
    w.harness = { rungChangedStep: 2 }
    await start($)
    w.answer = CONCEPT_NOTE([name])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(conceptOf(store, name).step).toBe(2)
    const changed = ['T1: 예측', 'Q1: 아래 코드는 b를 무엇으로 찍을까요?', '```', 'const a = 10', 'const b = a * 2', 'console.log(b)', '```', 'H1: a를 먼저 보세요', 'A1: 20'].join('\n')
    const ui = await quizIn($, w, changed)
    const prompt = w.models.at(-1)!
    expect(prompt).toContain('\n   칸: 비슷한 코드\n   학습자가 만든 코드 (a.ts):\n```\nconst a = 1\nconst b = 2\n```\n2. 채움 하나 — 채움 하나 설명\n3. 채움 둘 — 채움 둘 설명\n')
    // 1.10.0 (G2): its sentence asks a prediction in one block that runs alone, traced on an R line; room for the trace.
    expect(prompt).toContain('비슷한 코드: 학습자 코드에서 값·조건·순서 중 한 곳을 바꾼 코드를 코드 블록 하나로 보여 주고, 그 코드가 찍는 것을 예측으로 묻는다.')
    expect(prompt).toContain('\nH1: (힌트 한 문장)\nR1: (칸이 "비슷한 코드"인 문제만: 보인 코드를 한 줄씩 따라간 과정)\nA1:')
    expect(prompt).not.toContain('내 코드:')
    expect(prompt).not.toContain("'처음 보는 코드'·'풀이 보고 풀기' 칸은")
    expect(w.budgets.at(-1)).toBe(4600)
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 비슷한 코드 · 예측$/ })).toBeDefined()
    expect(quizItems(store)[0]).toMatchObject({ rung: 'changed' })
    expect((await learn($, '퀴즈')).text).toContain('\n1. (비슷한 코드) 아래 코드는 b를 무엇으로 찍을까요?')
    await ui.unmount()

    // The model showed the learner's code as it was: no tag, as 1.7 drew it.
    await w.clock.advance(60_000)
    w.answer = ['T1: 예측', 'Q1: 아래 코드의 b는?', '```', 'const a = 1', 'const b = 2', '```', 'A1: 2'].join('\n')
    const listed = (await learn($, '퀴즈 새로')).text
    expect(listed).toContain('\n1. 아래 코드의 b는?')
    expect(quizItems(store)[0]!.rung).toBeUndefined()
    // The pane opens on the quiz it was left on.
    const again = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    expect(await again.find({ type: 'Text', text: /^문제 1\/1 · 예측$/ })).toBeDefined()
    await again.unmount()

    // A line of it alone, in backticks and with a `;`, is the learner's code as it was too (교차 검토 5); a value
    // changed in that line is not.
    await w.clock.advance(60_000)
    w.answer = ['T1: 바꿔 보기', 'Q1: `const b = 2;`를 `let`으로 바꿔 쓰면?', 'A1: let b = 2'].join('\n')
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. `const b = 2;`를 `let`으로 바꿔 쓰면?')
    expect(quizItems(store)[0]!.rung).toBeUndefined()
    const line = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    expect(await line.find({ type: 'Text', text: /^문제 1\/1 · 바꿔 보기$/ })).toBeDefined()
    await line.unmount()
    await w.clock.advance(60_000)
    w.answer = ['T1: 예측', 'Q1: `const b = 3;` 다음 줄에서 b는?', 'A1: 3'].join('\n')
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (비슷한 코드) `const b = 3;` 다음 줄에서 b는?')
    expect(quizItems(store)[0]).toMatchObject({ rung: 'changed' })
    // The line as it was beside the value it is said to become, though the code holds that value elsewhere, is the
    // code changed (교차 검토 6).
    await w.clock.advance(60_000)
    w.answer = ['T1: 예측', 'Q1: `const b = 2`에서 `2`를 `1`로 바꾸면 b는?', 'A1: 1'].join('\n')
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (비슷한 코드) `const b = 2`에서 `2`를 `1`로 바꾸면 b는?')
    expect(quizItems(store)[0]).toMatchObject({ rung: 'changed' })
    const told = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    expect(await told.find({ type: 'Text', text: /^문제 1\/1 · 비슷한 코드 · 예측$/ })).toBeDefined()
    await told.unmount()
  })

  test('a concept met once is asked in the learner\'s own code with no tag, as in 1.7; the rung is kept on the question', async ($, on) => {
    const w = world(on, 'ok', null, true)
    await start($)
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await quizIn($, w, ['T1: 예측', 'Q1: 아래 코드의 b는?', '```', 'const a = 1', 'const b = 2', '```', 'A1: 2'].join('\n'))
    expect(w.models.at(-1)).toContain('\n   칸: 내 코드\n   학습자가 만든 코드 (a.ts):')
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 예측$/ })).toBeDefined()
    expect(quizItems(w.store)[0]).toMatchObject({ rung: 'mine' })
    expect((await learn($, '퀴즈')).text).toContain('\n1. 아래 코드의 b는?')
    await ui.unmount()
  })

  test('missed again where it was asked again: the line says the next review quiz shows a worked example first, which it does', async ($, on) => {
    const store = new Map<string, unknown>([
      ['slips', {
        'c:클로저': { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 1 },
        'c:map': { what: '원래 배열을 바꾼다고 봄', type: 'state', question: '지난 문제', mine: '원본이 바뀜', at: NOW - 2 * DAY, times: 1 },
      }],
    ])
    const w = world(on, 'ok', null, true, store)
    // Worked examples on as 1.8.0 shipped them, whatever their constant (교차 검토 2 turned them off by its sample): the
    // code branch alone (1.10.0 G1), these concepts met in a.ts with their words' quote on a line of it.
    w.harness = WORKED_BOTH
    await start($)
    w.answer = QUOTED_NOTE(['클로저', 'map'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await quizIn($, w, [plainQ(1), plainQ(2)].join('\n'))
    expect(await ui.find({ type: 'Text', text: /^문제 1\/2 · 다시 도전 · 예측$/ })).toBeDefined()
    expect(w.budgets.at(-1)).toBe(3400)
    // In the pane, where the note that taught it is: n there, and what comes next.
    await answer(ui, w, mineKey(store, 0), '전역에 남아요', missed())
    expect(await ui.find({ type: 'Text', text: /^같은 곳을 또 헷갈렸습니다 · n: 이 개념을 배운 노트 · 다음 복습 퀴즈는 풀이부터 보여 줍니다$/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'quiz-note' })).toBeDefined()
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2 })
    // In the conversation: the same, then where the note is (a minute on, so the next quiz asks 클로저 first).
    await w.clock.advance(60_000)
    w.answer = missed('원래 배열을 바꾼다고 봄', '상태가 바뀌는 때')
    const reply = (await learn($, '퀴즈 2 원래 배열이 바뀝니다')).text
    expect(reply).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다 · 이 개념을 배운 노트: /learn 찾기 map\n')
    await ui.unmount()

    // The next review quiz: a worked example for the first, in the language of the learner's code, not the code itself;
    // the second asked again in its code (1.10.0 G1, 4/7 검토: one worked example a quiz, the shape its samples measured).
    w.answer = [worked(1), plainQ(2)].join('\n')
    const listed = (await learn($, '퀴즈 새로')).text
    const prompt = w.models.at(-1)!
    expect(prompt).toContain(`\n1. 클로저 — 클로저에 대한 설명 — \`const b = 2\`\n   지난번 문제 '문제 1' · 학습자 답 '전역에 남아요' · 헷갈린 점: ${WHAT}\n   칸: 풀이 보고 풀기 (ts로)\n2. map`)
    expect(prompt.split('칸: 풀이 보고 풀기').length - 1).toBe(1)
    expect(prompt).toContain('풀이 보고 풀기: 문제를 "풀이:"로 시작해')
    expect(prompt).toContain("'처음 보는 코드'·'풀이 보고 풀기' 칸은 그 개념을 쓰는 짧은 코드를 새로 쓴다. 그 밖에는 주어진 설명과 코드 안에서만 묻는다.")
    expect(prompt).toContain('\n2. map — map에 대한 설명 — `const b = 2`\n   지난번 문제 \'문제 2\' · 학습자 답 \'원래 배열이 바뀝니다\' · 헷갈린 점: 원래 배열을 바꾼다고 봄\n   학습자가 만든 코드 (a.ts):\n')
    expect(prompt).toContain('헷갈린 점을 문제나 힌트에 쓰지 않는다')
    // 1.10.0 (G1): what its question asks and how its code runs, after 풀이 보고 풀기's own line; a P line in the format.
    expect(prompt).toContain(`풀이의 결과와 문제의 답이 같지 않게 한다. 힌트에서 풀이를 되풀이하지 않는다.\n${WORKED_TURN_ASK}\n${WORKED_CODE_ASK}\n'처음 보는 코드'·'풀이 보고 풀기' 칸은`)
    expect(prompt).not.toContain(WORKED_PLAIN_ASK)
    expect(prompt).toContain(`\nT1: (예측 · 왜 · 바꿔 보기 중 하나)\n${WORKED_PLAN_LINE}\nQ1: (문제 한두 문장)\n`)
    // One budget for every quiz that writes code of its own or a trace (1.10.0 G2, D12; 3600 in 1.9.0).
    expect(w.budgets.at(-1)).toBe(4600)
    expect(listed).toContain('\n1. (풀이 보고 풀기) 풀이: `let n = 0;')
    expect(listed).toContain('\n2. (다시 도전) 문제 2')
    expect(quizItems(store).map(one => [one.rung, one.isRetry])).toEqual([['worked', undefined], [undefined, true]])
    const next = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    expect(await next.find({ type: 'Text', text: /^문제 1\/2 · 풀이 보고 풀기 · 예측$/ })).toBeDefined()
    expect(await next.find({ type: 'Markdown', text: /^풀이: `let n = 0;[\s\S]*이제 풀어 보세요: 아래 코드는/ })).toBeDefined()
    await next.unmount()
  })

  test('right after the worked example: its step kept and copied as it is, · 풀이 봄, the slip still open; the review then asks it again with none, and right mends it', async ($, on) => {
    const store = withFiller(storeOf(['클로저'], 2, 8 * DAY, false, { 클로저: { times: 2 } }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    const ui = await quizIn($, w, worked(1))
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 풀이 보고 풀기 · 예측$/ })).toBeDefined()
    // No code met it in a note: no language said.
    expect(w.models.at(-1)).toContain('\n   칸: 풀이 보고 풀기\n')
    w.sets.length = 0
    await answer(ui, w, mineKey(store, 0), '11', RIGHT)
    // Not a question asked again: the grade is told no slip to name mended.
    expect(w.models.at(-1)).not.toContain('지난번에 헷갈린 점')
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저 · 풀이 봄 · 방금 채점$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /바로잡았습니다|바로 고쳤습니다|바로 다시 맞혔습니다/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /1문제 중 1개 맞혔습니다 · 힌트·풀이·되묻기·정답을 보고 맞힌 개념은 같은 간격 뒤 다시 나옵니다/ })).toBeDefined()
    const one = conceptOf(store, '클로저')
    expect(one).toMatchObject({ step: 2, reviewedAt: NOW })
    // The step copy holds the new review under the same key (1.8.0 E1: written when it differs).
    expect(w.sets).toContain('steps')
    expect(store.get('steps')).toEqual({ 'c:클로저': [2, NOW], [conceptKey('채움')]: [5, NOW] })
    expect(recallSteps(withKnownMarks(cleanConcepts(store.get('concepts')), store.get('known')), store.get('steps'))['c:클로저']).toMatchObject({ step: 2, reviewedAt: NOW })
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2 })
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()
    await ui.unmount()

    // Gone over today, it waits for its review (a week on), and is asked again then with no example (다시 도전).
    expect(store.get('quizBank')).toBeDefined()
    await w.clock.advance(7 * DAY)
    w.answer = plainQ(1)
    const listed = (await learn($, '퀴즈 새로')).text
    expect(w.models.at(-1)).toContain(`1. 클로저 — 클로저 설명\n   지난번 문제 '지난 문제의 코드'`)
    expect(w.models.at(-1)).not.toContain('칸: 풀이 보고 풀기')
    expect(listed).toContain('\n1. (다시 도전) 문제 1')
    w.answer = RIGHT
    const reply = (await learn($, '퀴즈 1 안쪽 함수가 바깥 c를 기억해 11이 됩니다')).text
    expect(reply).toContain('✓ 지난번 헷갈린 점을 바로잡았습니다')
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBe(w.clock.now())
  })

  test('right only after the question asked back: asked again next with no example; missed again: a worked example again', async ($, on) => {
    const store = storeOf(['클로저', 'map'], 0, DAY, true, { 클로저: { times: 2 }, map: { what: '원래 배열을 바꾼다고 봄', type: 'state', times: 2 } })
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    const ui = await quizIn($, w, [worked(1), worked(2)].join('\n'))
    await answer(ui, w, mineKey(store, 0), '10이요', ASKED_BACK)
    await answer(ui, w, `${mineKey(store, 0)}-again`, '11이요', RIGHT)
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 3, isRight: true })
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저 · 풀이 봄 · 되짚어 맞힘 · 방금 채점$/ })).toBeDefined()
    // A minute on, so the next quiz asks 클로저 first.
    await w.clock.advance(60_000)
    await answer(ui, w, mineKey(store, 1), '10이요', missed('원래 배열을 바꾼다고 봄', '상태가 바뀌는 때'))
    expect(slipsOf(store)['c:map']).toMatchObject({ times: 3 })
    // A worked example missed is a question asked again missed again; no note in this pane taught it.
    expect(await ui.find({ type: 'Text', text: /^같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다$/ })).toBeDefined()
    await ui.unmount()

    await w.clock.advance(DAY)
    w.answer = [plainQ(1), worked(2)].join('\n')
    const listed = (await learn($, '퀴즈 새로')).text
    const prompt = w.models.at(-1)!
    expect(prompt).toMatch(/\n1\. 클로저 — 클로저 설명\n {3}지난번 문제 [^\n]+\n2\. map — map 설명\n {3}지난번 문제 [^\n]+\n {3}칸: 풀이 보고 풀기\n\n/)
    expect(prompt).toContain('풀이 보고 풀기: 문제를 "풀이:"로 시작해')
    expect(prompt).toContain('"지난번" 줄이 붙은 개념 가운데 칸이 "풀이 보고 풀기"가 아닌 것은 같은 헷갈림이 드러나는 다른 코드나 값으로 묻는다.')
    expect(listed).toContain('\n1. (다시 도전) 문제 1')
    expect(listed).toContain('\n2. (풀이 보고 풀기) 풀이:')
  })

  test('"모르겠어요" twice running on one concept: the next review quiz shows a worked example of its plain use', async ($, on) => {
    const store = withFiller(storeOf(['클로저'], 2, 8 * DAY, false))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = plainQ(1)
    await learn($, '퀴즈 새로')
    expect((await learn($, '퀴즈 1 모르겠어요')).text).toContain('\n떠오르지 않았습니다 · 다음 퀴즈에서 다시 풉니다\n')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ type: 'blank', times: 1 })
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    const reply = (await learn($, '퀴즈 1 모르겠어요')).text
    expect(reply).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다\n')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ type: 'blank', times: 2 })
    w.answer = worked(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (풀이 보고 풀기) 풀이:')
    expect(w.models.at(-1)).toContain("학습자 답 '모르겠어요' · 답을 떠올리지 못했다\n   칸: 풀이 보고 풀기\n")
    expect(w.models.at(-1)).toContain('헷갈린 점이 없으면(떠올리지 못함) 그 개념의 기본 쓰임을 풀이로 보인다.')
  })

  test('a miss of another kind on a question asked again is a slip of its own, once: the next quiz asks it again as in 1.7', async ($, on) => {
    const store = storeOf(['클로저'], 0, 2 * DAY, true, { 클로저: {} })
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    w.answer = missed('복사된다고 봄', '값과 참조')
    expect((await learn($, '퀴즈 1 복사본이 생겨요')).text).toContain('\n헷갈린 점: 복사된다고 봄 · 다음 퀴즈에서 다른 코드로 다시 묻습니다\n')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ type: 'reference', times: 1 })
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    expect(w.models.at(-1)).not.toContain('칸:')
  })

  test('f turns a worked example\'s miss right: its step as before the grade, as after help; the slip it was asked over stays open', async ($, on) => {
    const store = withFiller(storeOf(['클로저'], 2, 8 * DAY, false, { 클로저: { times: 2 } }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    const ui = await quizIn($, w, worked(1))
    await answer(ui, w, mineKey(store, 0), '10', missed())
    expect(conceptOf(store, '클로저').step).toBe(0)
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 3 })
    await ui.press({ key: 'quiz-flip' })
    await w.clock.settle()
    // Right after the example: due, but its step kept (a step on would be 3).
    expect(conceptOf(store, '클로저')).toMatchObject({ step: 2, reviewedAt: NOW })
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2 })
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저 · 풀이 봄 · 방금 채점$/ })).toBeDefined()
    await ui.unmount()
  })

  test('a worked example graded wrong once its answer is seen keeps no new miss: no worked example is promised, and the next quiz asks it again with none', async ($, on) => {
    const store = withFiller(storeOf(['클로저'], 2, 8 * DAY, false, { 클로저: { times: 2 } }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = worked(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (풀이 보고 풀기) 풀이:')
    await learn($, '퀴즈 정답 1')
    // No typed answer, no slip read: the slip stays as it was, and the next quiz goes over it as one asked again (1.7).
    const reply = (await learn($, '퀴즈 틀림 1')).text
    expect(reply).toBe('틀린 것으로 적었습니다: 1. 클로저. 복습할 개념 맨 앞에 올라 다음 퀴즈에 먼저 나옵니다.\n같은 곳을 또 헷갈렸습니다')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2, at: NOW - 8 * DAY })
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    expect(w.models.at(-1)).not.toContain('칸: 풀이 보고 풀기')
  })

  test('a worked example turned wrong with f, or graded wrong with no slip read: the pane promises no worked example, and the next quiz shows none', async ($, on) => {
    const store = storeOf(['클로저', 'map'], 2, 8 * DAY, false, { 클로저: { times: 2 }, map: { what: '원래 배열을 바꾼다고 봄', type: 'state', times: 2 } })
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w, [worked(1), worked(2)].join('\n'))
    await answer(ui, w, mineKey(store, 0), '안쪽 함수가 바깥 c를 기억해서 11을 찍습니다', RIGHT)
    await ui.press({ key: 'quiz-flip' })
    await w.clock.settle()
    // The slip as it was before the grade (nothing read from a right answer), gone over by it: asked again as in 1.7.
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2, at: NOW - 8 * DAY })
    expect(await ui.find({ type: 'Text', text: /^같은 곳을 또 헷갈렸습니다$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터/ })).toBeUndefined()
    await answer(ui, w, mineKey(store, 1), '10이요', '판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: 없음')
    expect(slipsOf(store)['c:map']).toMatchObject({ times: 2, at: NOW - 8 * DAY })
    expect(await ui.find({ type: 'Text', text: /^같은 곳을 또 헷갈렸습니다$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터/ })).toBeUndefined()
    await ui.unmount()
    await w.clock.advance(60_000)
    w.answer = [plainQ(1), plainQ(2)].join('\n')
    const listed = (await learn($, '퀴즈 새로')).text
    expect(w.models.at(-1)).not.toContain('칸: 풀이 보고 풀기')
    expect(listed).toContain('\n1. (다시 도전) 문제 1')
    expect(listed).toContain('\n2. (다시 도전) 문제 2')
  })

  test('/learn 안키: a worked example whose question after its example is not marked makes no card, its example kept off the front', async ($, on) => {
    const store = storeOf(['클로저', 'map'], 0, DAY, true, { 클로저: { times: 2 } })
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    // The example shown (풀이:, so the rung stays) but no 이제 풀어 보세요 before its question.
    const unmarked = ['T1: 예측', `Q1: 풀이: 흔히 ${WHAT}. 하지만 바깥 변수는 남습니다. 아래 코드는 무엇을 찍을까요? \`let c = 1; (() => ++c)(); console.log(c)\``, 'A1: 2'].join('\n')
    w.answer = [unmarked, plainQ(2)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]).toMatchObject({ rung: 'worked' })
    const bank = store.get('quizBank') as { name: string; question: string }[]
    expect(bank.map(one => one.name)).toEqual(['map'])
    await learn($, '안키')
    const file = w.files.get('/home/u/.claude/learning-notes/learn-notes-anki.txt')!
    expect(file).toContain('문제 2')
    expect(file).not.toContain('풀이:')
    expect(file).not.toContain(WHAT)
  })

  test('/learn 퀴즈 맞음 over a worked example\'s first try: right, its step kept, and the reply says the interval stays', async ($, on) => {
    const store = withFiller(storeOf(['클로저'], 2, 8 * DAY, false, { 클로저: { times: 2 } }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = worked(1)
    await learn($, '퀴즈 새로')
    w.answer = ASKED_BACK
    expect((await learn($, '퀴즈 1 10')).text).toContain('되묻기: 안쪽 함수가 다시 불릴 때 c는 어디에 남아 있을까요?')
    // The help was the example (and the question asked back), not the answer: named so, as the quiz's last sentence names it.
    expect((await learn($, '퀴즈 맞음 1')).text).toBe('맞힌 것으로 적었습니다: 1. 클로저. 풀이·정답을 보고 맞혀 복습 간격은 그대로입니다.')
    expect(conceptOf(store, '클로저')).toMatchObject({ step: 2, reviewedAt: NOW })
  })

  test('/learn 퀴즈 맞음 over a worked example and a typed miss: the reply names the example among the help of the ones whose interval stays', async ($, on) => {
    const store = storeOf(['클로저', 'map'], 2, 8 * DAY, false, { 클로저: { times: 2 } })
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = [worked(1), plainQ(2)].join('\n')
    await learn($, '퀴즈 새로')
    w.answer = ASKED_BACK
    await learn($, '퀴즈 1 10')
    w.answer = missed('원래 배열을 바꾼다고 봄', '상태가 바뀌는 때')
    await learn($, '퀴즈 2 원래 배열이 바뀝니다')
    expect((await learn($, '퀴즈 맞음 1 2')).text).toBe('맞힌 것으로 적었습니다: 1. 클로저 · 2. map. 직접 맞힌 문제는 간격이 늘고, 풀이·정답을 보고 맞힌 문제는 그대로입니다.')
    // With no worked example among them, the words of 1.7.
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    await learn($, '퀴즈 새로')
    await learn($, '퀴즈 정답 1')
    expect((await learn($, '퀴즈 맞음 1')).text).toBe('맞힌 것으로 적었습니다: 1. 클로저. 정답을 보고 맞혀 복습 간격은 그대로입니다.')
  })

  test('a quiz read back from the store keeps its rungs, drops one it does not know, and reads a 1.7 quiz as before', async ($, on) => {
    const store = storeOf(['클로저', 'map', '구조 분해'], 2, 8 * DAY, false, { 클로저: { times: 2 } })
    store.set('quiz', {
      at: NOW - 60_000,
      isRevealed: false,
      items: [
        { key: 'c:클로저', name: '클로저', question: '풀이: 예\n이제 풀어 보세요: 문제', answer: '답', rung: 'worked' },
        { key: 'c:map', name: 'map', question: '바뀐 코드 문제', answer: '답', rung: 'changed', kind: 'predict' },
        { key: conceptKey('구조 분해'), name: '구조 분해', question: '옛 문제', answer: '답', rung: 'hard' },
      ],
    })
    const w = world(on, 'ok', null, true, store)
    await start($)
    const listed = (await learn($, '퀴즈')).text
    expect(listed).toContain('\n1. (풀이 보고 풀기) 풀이: 예')
    expect(listed).toContain('\n2. (비슷한 코드) 바뀐 코드 문제')
    expect(listed).toContain('\n3. 옛 문제')
    // A grade written back keeps each rung known, and drops the one it did not know.
    w.answer = RIGHT
    await learn($, '퀴즈 2 답')
    expect(quizItems(store).map(one => one.rung)).toEqual(['worked', 'changed', undefined])
  })

  test('a question in code never seen (1.8.x, off in 1.8.0) turned wrong steps its concept back one, as a miss graded so does', async ($, on) => {
    const store = storeOf(['클로저', 'map'], 4, 31 * DAY, false)
    // A quiz a window of a later build wrote, with the rung 1.8.0 keeps but never asks.
    const at = NOW - 60_000
    store.set('quiz', {
      at,
      isRevealed: false,
      items: [
        { key: 'c:클로저', name: '클로저', question: '처음 보는 코드 문제', answer: '11', rung: 'new', kind: 'predict' },
        { key: 'c:map', name: 'map', question: '처음 보는 코드 문제 2', answer: '[2, 4]', rung: 'new', kind: 'predict' },
      ],
    })
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = RIGHT
    await learn($, '퀴즈 1 11')
    expect(conceptOf(store, '클로저').step).toBe(5)
    // The learner's own word turns it wrong: one step back from where it stood before the grade, not to the first.
    expect((await learn($, '퀴즈 틀림 1')).text).toContain('틀린 것으로 적었습니다: 1. 클로저.')
    expect(conceptOf(store, '클로저')).toMatchObject({ step: 3, reviewedAt: NOW })
    // Graded wrong at once: the same.
    w.answer = missed()
    await learn($, '퀴즈 2 [1, 2]')
    expect(conceptOf(store, 'map')).toMatchObject({ step: 3, reviewedAt: NOW })
    // Turned right in the conversation and back: a step on from where it stood, then one back again.
    await learn($, '퀴즈 맞음 2')
    expect(conceptOf(store, 'map').step).toBe(5)
    await learn($, '퀴즈 틀림 2')
    expect(conceptOf(store, 'map').step).toBe(3)
  })

  test('a window of an older build that wrote a worked example back without its rung: right on another day mends nothing', async ($, on) => {
    const store = storeOf(['클로저'], 2, 8 * DAY, false, { 클로저: { times: 2 } })
    // 1.7 writes the quiz back with the fields it knows: no rung, and (1.8.0 kept none) no isRetry.
    store.set('quiz', { at: NOW - 60_000, isRevealed: false, items: [{ key: 'c:클로저', name: '클로저', question: '풀이: 예\n이제 풀어 보세요: 문제', answer: '11' }] })
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = RIGHT
    const reply = (await learn($, '퀴즈 1 11')).text
    expect(reply).not.toContain('바로잡았습니다')
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()
    // A question as any other: a step on, as 1.7 grades it.
    expect(conceptOf(store, '클로저').step).toBe(3)
  })

  test('/learn 안키: a worked example\'s card asks only the question after its example', async ($, on) => {
    const store = withFiller(storeOf(['클로저'], 0, DAY, true, { 클로저: { times: 2 } }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = worked(1)
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]).toMatchObject({ rung: 'worked' })
    const bank = store.get('quizBank') as { question: string }[]
    expect(bank.map(one => one.question)).toEqual(['아래 코드는 무엇을 찍을까요?\n```js\nlet c = 10\nconst add = () => ++c\nadd()\nconsole.log(c)\n```'])
    // Right in the conversation: · 풀이 봄, and the quiz's last sentence names the example among the help, ending in a full stop.
    w.answer = RIGHT
    const reply = (await learn($, '퀴즈 1 11')).text
    expect(reply).toContain('1번 ✓ 맞힘 · 풀이 봄 · ')
    expect(reply).toContain('다 풀었습니다: 1문제 중 1개 맞힘. 힌트·풀이·되묻기·정답을 보고 맞힌 개념은 같은 간격 뒤 다시 나옵니다.')
    await learn($, '안키')
    const file = w.files.get('/home/u/.claude/learning-notes/learn-notes-anki.txt')!
    expect(file).toContain('아래 코드는 무엇을 찍을까요?')
    expect(file).not.toContain('풀이:')
    expect(file).not.toContain('let n = 0')
  })

  test('a slip set right before and missed once more on a plain question opens again from one: asked again in other code, no worked example yet (교차 검토)', async ($, on) => {
    // As a try again right on another day leaves it, or a 1.7 window did: set right, its count kept.
    const store = withFiller(storeOf(['클로저'], 2, 8 * DAY, false, { 클로저: { times: 1, at: NOW - 20 * DAY, fixedAt: NOW - 15 * DAY } }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    const ui = await quizIn($, w, plainQ(1))
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 예측$/ })).toBeDefined()
    await answer(ui, w, mineKey(store, 0), '전역에 남아요', missed())
    // One miss since it was set right is no second one running: the words of 1.7.
    expect(await ui.find({ type: 'Text', text: `헷갈린 점: ${WHAT} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터/ })).toBeUndefined()
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 1, at: NOW })
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()
    await ui.unmount()
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    const listed = (await learn($, '퀴즈 새로')).text
    expect(w.models.at(-1)).toContain(`1. 클로저 — 클로저 설명\n   지난번 문제 '문제 1' · 학습자 답 '전역에 남아요'`)
    expect(w.models.at(-1)).not.toContain('칸:')
    expect(listed).toContain('\n1. (다시 도전) 문제 1')
    // Missed there again: twice running now, and the worked example is promised and comes.
    w.answer = missed()
    expect((await learn($, '퀴즈 1 전역에 남아요')).text).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2 })
    await w.clock.advance(60_000)
    w.answer = worked(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (풀이 보고 풀기) 풀이:')
  })

  test('a worked example with only code after 이제 풀어 보세요 asks what it prints: in the pane, the conversation, the card and the grade (교차 검토 2)', async ($, on) => {
    const store = withFiller(storeOf(['클로저'], 0, DAY, true, { 클로저: { times: 2 } }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    const code = ['```js', 'let c = 10', 'const add = () => ++c', 'add()', 'console.log(c)', '```']
    // As haiku wrote one in four of its worked examples with code: no words after the marker, and a T line naming the rung alone.
    const bare = ['T1: 풀이 보고 풀기', 'Q1: 풀이: `let n = 0; const up = () => ++n; up(); up()` 뒤 n은 2입니다. 바깥 변수는 함수가 끝나도 남기 때문입니다.', '이제 풀어 보세요:', ...code, 'A1: 11'].join('\n')
    const ui = await quizIn($, w, bare)
    expect(quizItems(store)[0]).toMatchObject({ rung: 'worked', kind: 'predict' })
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 풀이 보고 풀기 · 예측$/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /이제 풀어 보세요:\n이 코드를 실행하면 무엇이 출력될까요\?\n```js\nlet c = 10\n/ })).toBeDefined()
    expect((await learn($, '퀴즈')).text).toContain('남기 때문입니다.\n   이제 풀어 보세요:\n   이 코드를 실행하면 무엇이 출력될까요?\n   ```js\n   let c = 10\n')
    const bank = store.get('quizBank') as { question: string }[]
    expect(bank.map(one => one.question)).toEqual([['이 코드를 실행하면 무엇이 출력될까요?', ...code].join('\n')])
    // Graded with the question as it is shown.
    await answer(ui, w, mineKey(store, 0), '11', RIGHT)
    expect(w.models.at(-1)).toContain('이제 풀어 보세요:\n이 코드를 실행하면 무엇이 출력될까요?\n```js')
    await ui.unmount()
  })

  test('a quiz replaced the same day over a first try asked back, the second miss running there: the new quiz is the worked example (교차 검토 2)', async ($, on) => {
    const store = withFiller(storeOf(['클로저'], 0, 2 * DAY, true, { 클로저: {} }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    // Asked back: the first try waits for its try again, the slip counted once still.
    w.answer = ASKED_BACK
    await learn($, '퀴즈 1 10이요')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 1 })
    await w.clock.advance(60_000)
    w.answer = worked(1)
    const listed = (await learn($, '퀴즈 새로')).text
    // The first try graded as Claude graded it when the quiz was replaced: the second miss running, and this quiz shows the example.
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2, question: '문제 1', mine: '10이요', at: NOW })
    expect(listed).toContain('\n1. (풀이 보고 풀기) 풀이:')
    const prompt = w.models.at(-1)!
    expect(prompt).toContain('칸: 풀이 보고 풀기')
    // What the quiz is told of the last try is the store's as the quiz was made, as in 1.7 ('a first try left waiting when a new quiz is made').
    expect(prompt).toContain("지난번 문제 '지난 문제의 코드' · 학습자 답 '전역 변수'")
    // One budget for every quiz that writes code of its own or a trace (1.10.0 G2, D12; 3600 in 1.9.0).
    expect(w.budgets.at(-1)).toBe(4600)
    expect(quizItems(store).map(one => [one.rung, one.isRetry])).toEqual([['worked', undefined]])
  })

  test('the same in the pane: asked back, then s twice the same day; the new quiz is the worked example (교차 검토 2)', async ($, on) => {
    const store = withFiller(storeOf(['클로저'], 0, 2 * DAY, true, { 클로저: {} }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    const ui = await quizIn($, w, plainQ(1))
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 다시 도전 · 예측$/ })).toBeDefined()
    await answer(ui, w, mineKey(store, 0), '10이요', ASKED_BACK)
    expect(quizItems(store)[0]!.firstTry).toBeDefined()
    await w.clock.advance(60_000)
    const calls = w.models.length
    w.answer = worked(1)
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(w.models.length).toBe(calls + 1)
    expect(w.models.at(-1)).toContain('칸: 풀이 보고 풀기')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2, mine: '10이요' })
    expect(quizItems(store).map(one => [one.rung, one.isRetry])).toEqual([['worked', undefined]])
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 풀이 보고 풀기 · 예측$/ })).toBeDefined()
    await ui.unmount()
  })

  /** This repository's team file, with one term (1.7.0 D6). */
  const TEAM_PATH = '/proj/.claude/learn-notes.md'
  const TEAM_TERMS = ['## 용어', '- **fetcher**: 우리 팀의 API 호출 함수입니다', ''].join('\n')
  const fetcher = (more: Record<string, unknown>) => ({ name: 'fetcher', count: 2, firstAt: NOW - 30 * DAY, lastAt: NOW - 30 * DAY, blurb: '우리 팀의 API 호출 함수입니다', files: [], ...more })

  test('a team term of this repository met and missed twice running is asked again by the team\'s words, with no worked example (1.7, 교차 검토)', async ($, on) => {
    const store = new Map<string, unknown>([
      ['welcomed', true],
      ['stepsFrom', 0],
      ['concepts', { 'c:fetcher': fetcher({ step: 0, reviewedAt: NOW - 3 * DAY, missedAt: NOW - 3 * DAY }) }],
      ['teamTerms', { 'c:fetcher': [rootTag('/proj')] }],
      ['slips', { 'c:fetcher': { what: 'fetcher가 오류를 삼킨다고 봄', type: 'other', question: '지난 문제', mine: '삼켜요', at: NOW - 2 * DAY, times: 2 } }],
    ])
    const w = world(on, 'ok', null, true, store)
    w.files.set(TEAM_PATH, TEAM_TERMS)
    await start($)
    // Even a reply shaped as a worked example keeps no rung: none was asked for.
    const ui = await quizIn($, w, ['T1: 예측', 'Q1: 풀이: 예입니다. 이제 풀어 보세요: 문제', 'A1: 답'].join('\n'))
    const prompt = w.models.at(-1)!
    expect(prompt).toContain('(팀 용어) fetcher')
    expect(prompt).toContain("지난번 문제 '지난 문제'")
    expect(prompt).not.toContain('칸:')
    expect(quizItems(store)[0]!.rung).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 다시 도전 · 팀 용어 · 예측$/ })).toBeDefined()
    await ui.unmount()
  })

  test('a team term of this repository at its third step, with a note\'s code, is asked by the team\'s words: no 비슷한 코드 (1.7, 교차 검토)', async ($, on) => {
    const concepts = { 'c:fetcher': fetcher({ step: 2, reviewedAt: NOW - 8 * DAY }) }
    const store = new Map<string, unknown>([
      ['welcomed', true],
      ['stepsFrom', 0],
      ['concepts', concepts],
      ['steps', ownSteps(concepts as never)],
      ['teamTerms', { 'c:fetcher': [rootTag('/proj')] }],
    ])
    const w = world(on, 'ok', null, true, store)
    w.files.set(TEAM_PATH, TEAM_TERMS)
    await start($)
    w.answer = CONCEPT_NOTE(['fetcher'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await quizIn($, w, ['T1: 예측', 'Q1: 아래 코드는 b를 무엇으로 찍을까요?', '```', 'const a = 10', 'const b = a * 2', 'console.log(b)', '```', 'A1: 20'].join('\n'))
    const prompt = w.models.at(-1)!
    expect(prompt).toContain('(팀 용어) fetcher')
    expect(prompt).not.toContain('칸:')
    expect(quizItems(store)[0]!.rung).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 팀 용어 · 예측$/ })).toBeDefined()
    expect((await learn($, '퀴즈')).text).not.toContain('(비슷한 코드)')
    await ui.unmount()
  })
})

describe('1.8.0: slipped concepts shown by name under a note, on /learn 기록 and counted on /learn 진단 (E2)', () => {
  const DAY = 86_400_000
  const TOOL = 'mcp__learn-notes__notes'
  const WHAT = '함수가 끝나면 바깥 변수도 사라진다고 봄'
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const missed = (what = WHAT, type = '변수 범위') => `판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${what}\n유형: ${type}`
  const LINE = (name: string) => `지난번 헷갈린 개념 ${name} · 복습 퀴즈에서 다시 묻습니다`
  const diag = async ($: Engine) => (await learn($, '진단')).text ?? ''
  type Ui = Awaited<ReturnType<typeof pane>>
  const slipLine = (ui: Ui) => ui.find({ type: 'Text', text: /^지난번 헷갈린 개념/ })
  /** A concept first met long ago, so a note now meets it again; `more` over it. */
  const old = (name: string, more: Record<string, unknown> = {}) => ({ name, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], ...more })
  /** A slip with words kept `ago` before now, `more` over it. */
  const slipRow = (ago: number, more: Record<string, unknown> = {}) => ({ what: WHAT, type: 'scope', question: '지난 문제의 코드', mine: '전역 변수', at: NOW - ago, times: 1, ...more })
  /** A store of these concepts, with their step copies, and these slips by concept name. */
  const storeOf = (list: Record<string, unknown>[], slips: Record<string, Record<string, unknown>> = {}, more: [string, unknown][] = []) => {
    const index = Object.fromEntries(list.map(one => [conceptKey(one.name as string), one]))
    return new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', index],
      ['steps', ownSteps(index as never)],
      ['slips', Object.fromEntries(Object.entries(slips).map(([name, row]) => [conceptKey(name), row]))],
      ...more,
    ])
  }
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: { name: string }[] }).items
  /** A note meeting these concepts written now. */
  async function noteOn($: Engine, w: World, names: string[], id = 't1') {
    w.answer = CONCEPT_NOTE(names)
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: `u-${id}` }), id)
    await finish(w)
  }

  test('missed in a quiz and met again by the next note: the name under it, label yellow and the rest dim, never the words; not under the older note', async ($, on) => {
    const w = world(on, 'ok', null, true, storeOf([old('클로저')]))
    await start($)
    await noteOn($, w, ['클로저'], 't1')
    const ui = await pane($)
    // A note meeting it again before any slip: no line.
    expect(await ui.find({ type: 'Text', text: /^다시 만난 개념 클로저 ×3$/ })).toBeDefined()
    expect(await slipLine(ui)).toBeUndefined()
    await ui.press({ key: 'view-quiz' })
    w.answer = 'Q1: 문제 하나\nA1: 답 하나'
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    w.answer = missed()
    await ui.input({ key: mineKey(w.store, 0), text: '전역에 남아요' })
    await w.clock.settle()
    expect(Object.keys(w.store.get('slips') as object)).toEqual([conceptKey('클로저')])

    await w.clock.advance(60_000)
    await noteOn($, w, ['클로저', 'map'], 't2')
    await ui.press({ key: 'view-note' })
    const line = await ui.find({ type: 'Text', text: LINE('클로저') })
    expect(line?.props.wrap).toBe('wrap')
    expect((await ui.find({ type: 'Text', text: /^지난번 헷갈린 개념$/ }))?.props.color).toBe('yellow')
    expect((await ui.find({ type: 'Text', text: /^ ?클로저 · 복습 퀴즈에서 다시 묻습니다$/ }))?.props.dimColor).toBe(true)
    // Under the concepts' two lines, and its words nowhere: the next try again would read its answer there.
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn.indexOf('새로 배운 개념')).toBeGreaterThan(-1)
    expect(drawn.indexOf('다시 만난 개념')).toBeLessThan(drawn.indexOf('지난번 헷갈린 개념'))
    expect(drawn.indexOf('새로 배운 개념')).toBeLessThan(drawn.indexOf('지난번 헷갈린 개념'))
    expect(drawn).not.toContain('사라진다고')

    // Drawn only: the note copied (c, /learn 공유), its text kept, the journal, concepts.md and the prompts hold none of it.
    await ui.press({ key: 'share' })
    expect(w.copied).toHaveLength(1)
    await learn($, '공유')
    expect(w.copied).toHaveLength(2)
    for (const text of [...w.copied, ...w.writes.map(write => write.text), JSON.stringify(w.store.get('history')), ...w.models]) {
      expect(text).not.toContain('지난번 헷갈린 개념')
      expect(text).not.toContain('사라진다고')
    }
    expect(w.writes.some(write => write.path.endsWith('/concepts.md'))).toBe(true)
    expect(w.journal().length).toBeGreaterThan(0)

    // The older note met it again too, but before the slip: none there.
    await ui.press({ key: 'prev' })
    expect(await ui.find({ type: 'Text', text: /^다시 만난 개념 클로저 ×4$/ })).toBeDefined()
    expect(await slipLine(ui)).toBeUndefined()
    await ui.unmount()
  })

  test('a slip a note\'s practice kept (t) shows the same line under the next note that meets its concept', async ($, on) => {
    const HELLO = ['// 인사', 'function greet(name) {', '  return `안녕하세요, ${name}님!`', '}', ''].join('\n')
    const PRACTICE = [
      '### 한 줄 요약',
      '이름을 받아 인사하는 함수를 만들었습니다',
      '### 배울 개념',
      '- **템플릿 리터럴**: 문자열 안에 값을 넣습니다 — `${name}`',
      '### 직접 해 보기',
      '- 할 일: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요',
      '- 고칠 줄: `` return `안녕하세요, ${name}님!` ``',
      '- 확인: `greet("")` → "안녕하세요, 손님!"',
      '- 예시 답: `` return `안녕하세요, ${name || "손"}님!` ``',
    ].join('\n')
    const w = world(on)
    await start($)
    w.answer = PRACTICE
    await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'h1', file_path: '/proj/src/hello.js', content: HELLO }))
    await finish(w)
    const id = (w.store.get('history') as Record<string, { notes: { id: string }[] }>)['/proj']!.notes.at(-1)!.id
    const ui = await pane($)
    await ui.press({ key: 'note-drill' })
    w.answer = ['판정: 틀림', '피드백: 그대로면 "안녕하세요, 님!"이 됩니다.', '되묻기: name이 빈 문자열이면 무엇이 찍힐까요?', '헷갈린 점: 빈 문자열도 이름이 있는 것으로 봄', '유형: 없는 값'].join('\n')
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name}님!!`' })
    await w.clock.settle()
    w.answer = '판정: 틀림\n피드백: 아직 아닙니다.'
    await ui.input({ key: `drill-${id}-again`, text: 'return `안녕하세요, ${name}님?`' })
    await w.clock.settle()
    expect(Object.values(w.store.get('slips') as Record<string, { type: string }>)).toEqual([expect.objectContaining({ type: 'nullish' })])

    await w.clock.advance(60_000)
    await noteOn($, w, ['템플릿 리터럴'], 't2')
    expect(await ui.find({ type: 'Text', text: LINE('템플릿 리터럴') })).toBeDefined()
    expect(JSON.stringify(await ui.drawn())).not.toContain('빈 문자열도')
    await ui.unmount()
  })

  test('none for a slip with no words, nor once a try again on another day mended it', async ($, on) => {
    const store = storeOf([old('클로저', { step: 0, reviewedAt: NOW - 2 * DAY, missedAt: NOW - 2 * DAY }), old('map')], {
      클로저: slipRow(2 * DAY),
      map: slipRow(3 * DAY, { what: '', type: 'blank', mine: '모르겠어요' }),
    })
    const w = world(on, 'ok', null, true, store)
    await start($)
    await noteOn($, w, ['map'], 't1')
    const ui = await pane($)
    // map's slip has no words ("모르겠어요"): nothing to name.
    expect(await ui.find({ type: 'Text', text: /^다시 만난 개념 map ×3$/ })).toBeDefined()
    expect(await slipLine(ui)).toBeUndefined()
    await w.clock.advance(60_000)
    await noteOn($, w, ['클로저', 'map'], 't2')
    expect(await ui.find({ type: 'Text', text: LINE('클로저') })).toBeDefined()

    // Asked again two days after the miss, right with no hint: mended, and the line goes.
    await ui.press({ key: 'view-quiz' })
    w.answer = 'Q1: 문제 하나\nA1: 답 하나\nQ2: 문제 둘\nA2: 답 둘'
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    // Both asked again (map's "모르겠어요" too), the one missed longest ago first: each right in turn.
    expect(quizItems(store).map(item => item.name)).toEqual(['map', '클로저'])
    for (const i of [0, 1]) {
      w.answer = RIGHT
      await ui.input({ key: mineKey(store, i), text: '안쪽 함수가 바깥 변수를 기억합니다' })
      await w.clock.settle()
    }
    expect((store.get('slips') as Record<string, { fixedAt?: number }>)[conceptKey('클로저')]!.fixedAt).toBeGreaterThan(NOW)
    await ui.press({ key: 'view-note' })
    expect(await ui.find({ type: 'Text', text: /^다시 만난 개념 클로저 ×3 · map ×4$/ })).toBeDefined()
    expect(await slipLine(ui)).toBeUndefined()
    await ui.unmount()
  })

  test('none once /learn 안다 marks it known', async ($, on) => {
    const store = storeOf([old('클로저')], { 클로저: slipRow(2 * DAY) })
    const w = world(on, 'ok', null, true, store)
    await start($)
    await noteOn($, w, ['클로저'])
    const ui = await pane($)
    expect(await ui.find({ type: 'Text', text: LINE('클로저') })).toBeDefined()
    await learn($, '안다 클로저')
    expect(await slipLine(ui)).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^다시 만난 개념 클로저 ×3$/ })).toBeDefined()
    await ui.unmount()
  })

  test('none for a concept a 1.6 window marked known, its slip left open there', async ($, on) => {
    // 1.6's /learn 안다 and graduating set knownAt alone (and the known copy), never the slip's fixedAt.
    const store = storeOf([old('클로저', { knownAt: NOW - DAY })], { 클로저: slipRow(2 * DAY) }, [['known', { [conceptKey('클로저')]: NOW - DAY }]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await noteOn($, w, ['클로저'])
    const ui = await pane($)
    expect(await ui.find({ type: 'Text', text: /^다시 만난 개념 클로저 ×3$/ })).toBeDefined()
    expect(await slipLine(ui)).toBeUndefined()
    await ui.unmount()
  })

  test('another window mends a slip, or keeps a new one, after this one started: the next note\'s line goes by the store', async ($, on) => {
    const store = storeOf([old('클로저'), old('map')], { 클로저: slipRow(2 * DAY) })
    const w = world(on, 'ok', null, true, store)
    await start($)
    await noteOn($, w, ['클로저'], 't1')
    const ui = await pane($)
    expect(await ui.find({ type: 'Text', text: LINE('클로저') })).toBeDefined()
    // Another window's try again, on another day, right with no hint: mended in the store, not in this pane's copy.
    store.set('slips', { [conceptKey('클로저')]: { ...slipRow(2 * DAY), fixedAt: NOW } })
    await w.clock.advance(60_000)
    w.sets.length = 0
    await noteOn($, w, ['클로저'], 't2')
    // The next quiz asks it with no slip (the store's), so no line promises a try again.
    expect(await ui.find({ type: 'Text', text: /^다시 만난 개념 클로저 ×4$/ })).toBeDefined()
    expect(await slipLine(ui)).toBeUndefined()
    // Another window keeps a slip on map: the next note meeting map names it.
    store.set('slips', { ...(store.get('slips') as object), [conceptKey('map')]: slipRow(60_000, { what: '원래 배열을 바꾼다고 봄', type: 'other' }) })
    await w.clock.advance(60_000)
    await noteOn($, w, ['map'], 't3')
    expect(await ui.find({ type: 'Text', text: LINE('map') })).toBeDefined()
    // Read, never written: the store's slips are as the other window left them.
    expect(w.sets).not.toContain('slips')
    expect(w.models.filter(text => text.includes('바깥 변수'))).toEqual([])
    await ui.unmount()
  })

  test('after /learn 합치기 in this very window, the line names the concept it went into', async ($, on) => {
    const store = storeOf([old('Closure'), old('클로저')], { Closure: slipRow(2 * DAY) })
    const w = world(on, 'ok', null, true, store)
    await start($)
    await noteOn($, w, ['Closure'])
    const ui = await pane($)
    expect(await ui.find({ type: 'Text', text: LINE('Closure') })).toBeDefined()
    expect((await learn($, '합치기 Closure = 클로저')).text).toContain('합쳤습니다')
    // The slips' mirror keeps the key it was stored under; the note keeps its own: both are read through the merge.
    expect(await ui.find({ type: 'Text', text: LINE('클로저') })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: LINE('Closure') })).toBeUndefined()
    await ui.unmount()
  })

  test('/learn 기록: three concepts of one kind in 30 days make a line under 복습할 개념; a slip 31 days old is left out; the record\'s tool has none', async ($, on) => {
    const reference = (ago: number) => slipRow(ago, { what: '복사된다고 봄', type: 'reference' })
    const store = storeOf([old('const 선언'), old('배열 복사'), old('객체 비교'), old('얕은 비교')], {
      '객체 비교': reference(3 * DAY),
      'const 선언': reference(DAY),
      '얕은 비교': reference(31 * DAY),
    })
    const w = world(on, 'ok', null, true, store)
    await start($)
    // Two of the kind in 30 days: no line yet.
    expect((await learn($, '기록')).text).not.toContain('같은 종류로')
    // The third kept by another window since this one started: read from the store, not this pane's copy.
    store.set('slips', { ...(store.get('slips') as object), [conceptKey('배열 복사')]: reference(2 * DAY) })
    const lines = ((await learn($, '기록')).text ?? '').split('\n')
    const review = lines.findIndex(line => line.startsWith('- 복습할 개념'))
    expect(review).toBeGreaterThan(-1)
    expect(lines[review + 1]).toBe('- 최근 30일 같은 종류로 헷갈린 개념 3개: const 선언, 배열 복사, 객체 비교 · 값과 참조(복사본인지, 같은 것을 가리키는지)')
    expect(lines.join('\n')).not.toContain('복사된다고')
    // Asked in chat ("내가 뭘 배웠지?"): the tool's answer has no such line.
    const told = String((await $.tool.call({ tool: TOOL, action: 'concepts' })).result)
    expect(told).toContain('배열 복사')
    expect(told).not.toContain('같은 종류로')
    expect(w.models).toHaveLength(0)

    // 28 days on, 객체 비교's slip is 31 days old: two concepts of the kind are left, and no line.
    await w.clock.advance(28 * DAY)
    expect((await learn($, '기록')).text).not.toContain('같은 종류로')
  })

  test('/learn 진단: the slips counted under the journal\'s line, its head saying no concept name and no slip\'s words are in it', async ($, on) => {
    let isUnread = false
    on('store.get', { key: 'slips' }, (_$, e, next) => (isUnread ? { deny: 'learn-notes: $.store.get: the store could not be read' } : next(e)))
    // 클로저: missed on the try again, then right when asked back (still open, missed twice). Closure was merged into
    // it (/learn 합치기), each with a slip kept before the merge: one concept, one slip counted.
    const store = storeOf([old('클로저'), old('map'), old('구조 분해'), old('비동기')], {
      클로저: slipRow(DAY, { times: 2, isRight: true }),
      Closure: slipRow(3 * DAY, { what: '바깥 변수를 복사해 둔다고 봄', times: 2 }),
      map: slipRow(DAY, { what: '원래 배열을 바꾼다고 봄', type: 'other' }),
      '구조 분해': slipRow(DAY, { what: '', type: 'blank', mine: '모르겠어요' }),
      비동기: slipRow(5 * DAY, { what: 'await 없이도 기다린다고 봄', type: 'order', fixedAt: NOW - DAY }),
    }, [['aliases', { [conceptKey('Closure')]: conceptKey('클로저') }]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    const reply = await diag($)
    const lines = reply.split('\n')
    expect(lines[1]).toBe('코드 · 요청 · 파일 이름 · 경로 · 개념 이름 · 헷갈린 점 문장은 들어 있지 않습니다 (오답 노트는 개수만)')
    const journal = lines.findIndex(line => line.startsWith('- 일지: '))
    expect(lines[journal + 1]).toBe('- 오답 노트 4개 (열림 3 · 바로잡음 1) · 유형 기타 1 · 문장 없음 1 · 열린 채 두 번 이상 1')
    for (const word of ['클로저', 'Closure', 'closure', 'map', '구조', '비동기', '사라진다고', '복사해', '배열', 'await', '전역 변수', '지난 문제', '모르겠어요']) expect(reply).not.toContain(word)
    expect(w.copied.at(-1)).toContain('\n- 오답 노트 4개 (열림 3 · ')
    isUnread = true
    expect((await diag($)).split('\n')).toContain('- 오답 노트: 읽지 못함')
    isUnread = false
    store.delete('slips')
    expect((await diag($)).split('\n')).toContain('- 오답 노트: 아직 없습니다')
    expect(w.models).toHaveLength(0)
  })

  test('a 1.7.0 store, its concepts as a 1.5 window rewrote them (the known copy kept apart): the three screens write nothing and ask no model', async ($, on) => {
    // 클로저 was marked known: a 1.5 window wrote the index without its mark, kept in the known copy.
    const note = {
      id: 'n1', turnId: 't', at: NOW - 1000, prompt: '반복문을 바꿔 줘', answer: '바꿨습니다', moreFiles: 0, status: 'ready', text: CONCEPT_NOTE(['클로저', 'map']),
      savedAs: 'ready', isPast: false, root: '/proj', updatedAt: NOW - 1000, concepts: [conceptKey('클로저'), conceptKey('map')], changes: [],
    }
    const reference = (ago: number) => slipRow(ago, { what: '복사된다고 봄', type: 'reference' })
    const store = storeOf([old('클로저'), old('map'), old('배열 복사'), old('객체 비교')], {
      클로저: reference(DAY),
      map: reference(2 * DAY),
      '배열 복사': reference(3 * DAY),
      '객체 비교': reference(4 * DAY),
    }, [
      ['schema', 3],
      ['known', { [conceptKey('클로저')]: NOW - 5 * DAY }],
      ['history', { '/proj': { at: NOW - 1000, notes: [note] } }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.settle()
    const keys = [...store.keys()].sort()
    w.sets.length = 0
    const ui = await pane($)
    // 클로저 slipped last, but known: map is named.
    expect(await ui.find({ type: 'Text', text: LINE('map') })).toBeDefined()
    await ui.unmount()
    const record = (await learn($, '기록')).text ?? ''
    expect(record).toContain('\n- 최근 30일 같은 종류로 헷갈린 개념 3개: map, 배열 복사, 객체 비교 · 값과 참조(복사본인지, 같은 것을 가리키는지)\n')
    expect(await diag($)).toContain('\n- 오답 노트 4개 (열림 4 · 바로잡음 0) · 유형 기타 0 · 문장 없음 0 · 열린 채 두 번 이상 0\n')
    expect(w.sets).toEqual([])
    expect([...store.keys()].sort()).toEqual(keys)
    expect(w.models).toHaveLength(0)
  })
})

describe('1.8.0: 생각해 보기 at the end of r\'s walk-through, answered in the question field (E4)', () => {
  const MIN = 60_000
  const THOUGHT = '`b`를 3으로 바꾸면 마지막에 `b`는 얼마일까요?'
  const TRACED = ['1. `const a = 1`: `a`는 1입니다.', '2. `const b = 2`: `b`는 2입니다.', '', `**생각해 보기:** ${THOUGHT}`].join('\n')
  const HINT = {
    focused: 'i(영문 상태): 질문 칸에 답 적기 · 넘어가도 됩니다',
    keys: 'ctrl+x tab 뒤 i: 질문 칸에 답 적기 · 넘어가도 됩니다',
    click: '질문 칸을 눌러 답을 적어 보세요 · 넘어가도 됩니다',
    elsewhere: '답해 보려면 /learn 질문 뒤에 내 생각을 적습니다 (예: /learn 질문 0이 나와요) · 넘어가도 됩니다',
  }
  const OPEN = '답이나 궁금한 점 적고 Enter'
  const SHUT = '궁금한 것을 적고 Enter'
  const SECTION = "## 바로 앞 '예시로 따라가기'의 답과, 그 끝에 학습자에게 던진 생각해 보기"
  type Ui = Awaited<ReturnType<typeof pane>>
  /** Which of the four dim lines the pane draws, if any (each one, so a second never hides behind the first). */
  const hintsOf = async (ui: Pick<Ui, 'findAll'>) => (await ui.findAll({ type: 'Text' })).filter(one => Object.values(HINT).includes(one.text)).map(one => one.text)
  const fieldOf = async (ui: Pick<Ui, 'find'>) => (await ui.find({ type: 'Input' }))!
  const asksOf = (store: Map<string, unknown>) => (store.get('history') as Record<string, { notes: { asks?: Record<string, unknown>[] }[] }>)['/proj']!.notes[0]!.asks ?? []

  /** A written note, nothing asked under it yet. */
  async function noted($: Engine, on: On, store = new Map<string, unknown>()) {
    const w = world(on, 'ok', null, true, store)
    await start($)
    await turn($, () => $.tool.call(EDIT_A), 't1', 'b를 상수로 바꿔줘')
    await finish(w)
    return w
  }
  /** r pressed under it, the walk-through `answer`. */
  async function trace(ui: Pick<Ui, 'press'>, w: World, answer = TRACED) {
    w.answer = answer
    await ui.press({ key: 'trace' })
    await w.clock.settle()
  }

  test('in the terminal with the keys in the pane: the dim line under the walk-through, the field\'s other placeholder, the focus left where it is', async ($, on) => {
    const w = await noted($, on)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    const field = await fieldOf(ui)
    expect(field.props.placeholder).toBe(SHUT)
    expect(await hintsOf(ui)).toEqual([])
    const keys = [...w.store.keys()].sort()
    const index = JSON.stringify(w.store.get('concepts'))
    await trace(ui, w)
    expect(await ui.find({ type: 'Markdown', text: TRACED })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([HINT.focused])
    expect((await ui.find({ type: 'Text', text: HINT.focused }))?.props.dimColor).toBe(true)
    // Right under the walk-through it ends, in the same block as its head.
    const block = (await ui.findAll({ type: 'Box' })).filter(one => one.text.includes('▶ 예시로 따라가기')).at(-1)!
    expect(block.text.endsWith(HINT.focused)).toBe(true)
    expect((await fieldOf(ui)).props).toMatchObject({ key: field.props.key, label: '질문', placeholder: OPEN, submitLabel: '묻기', value: '' })
    // No move of the focus: i is still the way to the field, named `ask-<id>`.
    expect(focusesOf(w)).toEqual([])
    expect(await ui.find({ type: 'Button', key: 'ask-type' })).toMatchObject({ props: { hotkey: 'i' } })
    expect(String(field.props.key)).toMatch(/^ask-/)
    // The line names the input mode i needs itself: the pane's own line saying so is drawn above the note, and r's
    // answer is scrolled to the top (revealInPane 'start'), so a long note has that line out of sight by now.
    expect(HINT.focused).toContain('영문 상태')
    const texts = (await ui.findAll({ type: 'Text' })).map(one => one.text)
    expect(texts.indexOf('Esc: 대화로 돌아가기 · 글자 키는 영문 상태에서')).toBeLessThan(texts.indexOf('▶ 예시로 따라가기'))
    expect(cells(HINT.focused)).toBeLessThanOrEqual(49)
    // Nothing graded or counted: the walk-through and its line ask nothing more of the model, the store holds no new key.
    expect(w.models).toHaveLength(2)
    // (faults aside: nothing in this kit answers the scroll to r's answer, kept as the pane's.)
    expect([...w.store.keys()].filter(k => k !== 'faults').sort()).toEqual(keys)
    expect(JSON.stringify(w.store.get('concepts'))).toBe(index)
    await ui.unmount()
  })

  test('with the keys in the prompt, ctrl+x tab first; the desktop app\'s click; the mobile app\'s /learn 질문, which sends the walk-through too', async ($, on) => {
    const w = await noted($, on)
    const idle = await pane($, 'terminal', { ...PANE_PROPS, isFocused: false })
    await trace(idle, w)
    expect(await hintsOf(idle)).toEqual([HINT.keys])
    expect((await fieldOf(idle)).props.placeholder).toBe(OPEN)
    await idle.unmount()

    const desktop = await pane($, 'desktop', { ...PANE_PROPS, isFocused: false })
    expect(await hintsOf(desktop)).toEqual([HINT.click])
    expect((await fieldOf(desktop)).props.placeholder).toBe(OPEN)
    await desktop.unmount()

    const phone = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    expect(await hintsOf(phone)).toEqual([HINT.elsewhere])
    expect(await phone.find({ type: 'Input' })).toBeUndefined()
    await phone.unmount()

    w.answer = '맞습니다. `b`가 3이면 마지막에 3입니다.'
    const asked = (await learn($, '질문 3이 나와요')).text ?? ''
    expect(asked).toContain('맞습니다.')
    const prompt = w.models.at(-1)!
    expect(prompt).toContain(`## 학습자의 질문\n3이 나와요\n\n${SECTION}\n${TRACED}\n\n생각해 보기: ${THOUGHT}\n`)
    expect(prompt).not.toContain('- 질문: 예시로 따라가기')
    expect(w.files.get(JOURNAL)).toContain('**물음** (생각해 보기 뒤): 3이 나와요')
    // Answered, the line is gone everywhere.
    const after = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    expect(await hintsOf(after)).toEqual([])
    expect(await after.find({ type: 'Text', text: '이어서 · 3이 나와요' })).toBeDefined()
    await after.unmount()
  })

  test('an answer typed in the field: sent with the walk-through in full and its question, headed 이어서, the line and placeholder gone, one call', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = await noted($, on, store)
    const ui = await pane($)
    const key = String((await fieldOf(ui)).props.key)
    // One question before it, to show it stays among the questions before.
    w.answer = '`const`는 다시 대입할 수 없습니다.'
    await ui.input({ key, text: '왜 const야?' })
    await w.clock.settle()
    await trace(ui, w)
    const calls = w.models.length
    await w.clock.advance(5 * MIN)
    // The reply ends on a 생각해 보기 of its own, against the rule: no line opens for it, as it is no walk-through.
    w.answer = '거의 맞습니다. `b`는 3이 됩니다.\n\n**생각해 보기:** 그럼 `a`를 0으로 바꾸면요?'
    await ui.input({ key, text: '0이요' })
    await w.clock.settle()
    expect(w.models).toHaveLength(calls + 1)
    expect(w.budgets.at(-1)).toBe(900)
    const prompt = w.models.at(-1)!
    expect(prompt).toContain(`## 학습자의 질문\n0이요\n\n${SECTION}\n${TRACED}\n\n생각해 보기: ${THOUGHT}\n`)
    expect(prompt).toContain('어느 쪽이든 생각해 보기를 새로 쓰지 않는다.')
    expect(prompt).toContain('## 앞서 이 노트에 대해 나눈 질문과 답 (이어지는 질문일 수 있다)\n- 질문: 왜 const야?\n')
    expect(prompt).not.toContain('- 질문: 예시로 따라가기')
    expect(await ui.find({ type: 'Text', text: '이어서 · 0이요' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '질문 · 0이요' })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /거의 맞습니다/ })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([])
    expect((await fieldOf(ui)).props).toMatchObject({ placeholder: SHUT, value: '' })
    // The walk-through above it keeps its head; the journal marks the question that followed it, its head as before.
    expect(await ui.find({ type: 'Text', text: '▶ 예시로 따라가기' })).toBeDefined()
    const journal = w.files.get(JOURNAL) ?? ''
    expect(journal).toContain('**물음** (생각해 보기 뒤): 0이요')
    expect(journal).toContain('**물음**: 왜 const야?')
    expect(journal).toContain('**물음**: 예시로 따라가기')
    expect(journal.match(/^## \d{4}-\d{2}-\d{2} 질문 \(\d{2}:\d{2}\)$/gm)).toHaveLength(3)
    // A question after that answer is a question again, sent with no walk-through.
    w.answer = '네.'
    await ui.input({ key, text: '그럼 let은?' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: '질문 · 그럼 let은?' })).toBeDefined()
    // The answer before it keeps its head: a question follows the walk-through by its place, not by being the last (교차 검토 3).
    expect(await ui.find({ type: 'Text', text: '이어서 · 0이요' })).toBeDefined()
    expect(w.models.at(-1)).not.toContain(SECTION)
    await ui.unmount()
    // Kept as 1.7.0 keeps a question: the same three fields, nothing graded, no new store key.
    for (const one of asksOf(store)) expect(Object.keys(one).sort()).toEqual(['answer', 'at', 'question'])
    expect(asksOf(store).map(one => one.question)).toEqual(['예시로 따라가기', '0이요', '그럼 let은?'])
    expect([...store.keys()].filter(k => /think/i.test(k))).toEqual([])
    expect(store.get('slips')).toBeUndefined()
    const day = (store.get('activity') as Record<string, Record<string, number>> | undefined)?.['2026-10-03'] ?? {}
    expect([day.right ?? 0, day.wrong ?? 0, day.drills ?? 0]).toEqual([0, 0, 0])
  })

  test('the line goes while an answer is written; one that did not come back stays in the field, the line and the placeholder with it', async ($, on) => {
    const w = await noted($, on)
    const ui = await pane($)
    const key = String((await fieldOf(ui)).props.key)
    await trace(ui, w)
    // While it is being answered, the line goes with the field.
    w.model = 'hold'
    await ui.input({ key, text: '0이요' })
    expect(await ui.find({ type: 'Text', text: '답을 쓰는 중입니다…' })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([])
    expect(await ui.find({ type: 'Input' })).toBeUndefined()
    w.model = 'error'
    w.release()
    await w.clock.settle()
    await ui.input({ key, text: '0이요' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: /답하지 못했습니다: 서버가 붐빕니다/ })).toBeDefined()
    expect((await fieldOf(ui)).props).toMatchObject({ value: '0이요', placeholder: OPEN })
    expect(await hintsOf(ui)).toEqual([HINT.focused])
    expect(w.models.at(-1)).toContain(SECTION)
    // Sent again once the model answers: still the walk-through's answer.
    w.model = 'ok'
    w.answer = '맞습니다.'
    await ui.input({ key, text: '0이요' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: '이어서 · 0이요' })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([])
    await ui.unmount()
  })

  test('half an hour on, all of it is 1.7.0\'s again: no line, the first placeholder, 질문, nothing more sent', async ($, on) => {
    const w = await noted($, on)
    const ui = await pane($)
    const key = String((await fieldOf(ui)).props.key)
    await trace(ui, w)
    await w.clock.advance(30 * MIN)
    await ui.redraw()
    expect(await hintsOf(ui)).toEqual([HINT.focused])
    expect((await fieldOf(ui)).props.placeholder).toBe(OPEN)
    // A pane left as it is: drawn again as it closes, with nothing else drawing it.
    await w.clock.advance(MIN)
    await w.clock.settle()
    expect(await hintsOf(ui)).toEqual([])
    expect((await fieldOf(ui)).props.placeholder).toBe(SHUT)
    w.answer = '네.'
    await ui.input({ key, text: '0이요' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: '질문 · 0이요' })).toBeDefined()
    const prompt = w.models.at(-1)!
    expect(prompt).not.toContain(SECTION)
    expect(prompt).toContain('- 질문: 예시로 따라가기')
    expect(w.files.get(JOURNAL)).toContain('**물음**: 0이요')
    expect(w.files.get(JOURNAL)).not.toContain('(생각해 보기 뒤)')
    await ui.unmount()
  })

  test('a walk-through with no question, or one giving its answer, opens nothing; e after r closes it, r again opens the new one', async ($, on) => {
    const w = await noted($, on)
    const ui = await pane($)
    const key = String((await fieldOf(ui)).props.key)
    // 1.7.0's walk-through, and one whose question says its answer: both drawn as written, nothing under them.
    for (const answer of ['1. a는 1입니다.', `1. a는 1입니다.\n**생각해 보기:** ${THOUGHT} (답: 3)`]) {
      await trace(ui, w, answer)
      expect(await ui.find({ type: 'Markdown', text: answer })).toBeDefined()
      expect(await hintsOf(ui)).toEqual([])
      expect((await fieldOf(ui)).props.placeholder).toBe(SHUT)
    }
    w.answer = '네.'
    await ui.input({ key, text: '2단계를 더 자세히' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: '질문 · 2단계를 더 자세히' })).toBeDefined()
    expect(w.models.at(-1)).not.toContain(SECTION)

    // r, then e: e's prompt has no walk-through section, and its answer closes the line.
    await trace(ui, w)
    expect(await hintsOf(ui)).toEqual([HINT.focused])
    w.answer = `쉽게 말하면 상자에 이름표를 붙입니다.\n\n**생각해 보기:** ${THOUGHT}`
    await ui.press({ key: 'easier' })
    await w.clock.settle()
    expect(w.models.at(-1)).toContain('이 노트를 더 쉬운 말로')
    expect(w.models.at(-1)).not.toContain(SECTION)
    expect(await ui.find({ type: 'Text', text: '▶ 더 쉽게' })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([])
    expect((await fieldOf(ui)).props.placeholder).toBe(SHUT)

    // r again: its own new question is the one an answer goes with; r's own prompt never carries a walk-through, nor
    // (IS_THINK_ASKED off in 1.8.0) asks for the line: a reply that ends on one by itself is read all the same.
    const next = '`a`를 5로 바꾸면 `a`는 얼마일까요?'
    await trace(ui, w, `1. a는 1입니다.\n\n**생각해 보기:** ${next}`)
    expect(w.models.at(-1)).toContain('구체적인 예시 입력 하나로 한 단계씩 따라가')
    expect(w.models.at(-1)).toContain('화면이나 동작에서 어떻게 보이는지 설명해 주세요.\n\n')
    expect(w.models.at(-1)).not.toContain('`**생각해 보기:**`로 시작하는 질문 한 문장')
    expect(w.models.at(-1)).not.toContain(SECTION)
    expect(await hintsOf(ui)).toEqual([HINT.focused])
    w.answer = '맞습니다.'
    await ui.input({ key, text: '5요' })
    await w.clock.settle()
    expect(w.models.at(-1)).toContain(`생각해 보기: ${next}\n`)
    // e's answer, its own 생각해 보기 line with it, stays among the questions before: never sent as the open one.
    expect(w.models.at(-1)).not.toContain(`생각해 보기: ${THOUGHT}`)
    expect(w.models.at(-1)).toContain('- 질문: 더 쉽게\n')
    expect(await ui.find({ type: 'Text', text: '이어서 · 5요' })).toBeDefined()
    await ui.unmount()
  })

  test('a walk-through cut inside its 생각해 보기 (the r call\'s token cap) is drawn as written and opens nothing', async ($, on) => {
    const w = await noted($, on)
    const ui = await pane($)
    const key = String((await fieldOf(ui)).props.key)
    // The reply's text so far, answered: $.model.complete says nothing of maxTokens reached.
    const cutOff = '1. `const a = 1`: `a`는 1입니다.\n2. `const b = 2`: `b`는 2입니다.\n\n**생각해 보기:** `b`를 3으로 바꾸면 마지막에'
    await trace(ui, w, cutOff)
    expect(await ui.find({ type: 'Markdown', text: cutOff })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([])
    expect((await fieldOf(ui)).props.placeholder).toBe(SHUT)
    w.answer = '네.'
    await ui.input({ key, text: '3이요' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: '질문 · 3이요' })).toBeDefined()
    expect(w.models.at(-1)).not.toContain(SECTION)
    expect(w.files.get(JOURNAL)).not.toContain('(생각해 보기 뒤)')
    await ui.unmount()
  })

  test('a walk-through first drawn after it came (a window opened again) closes at its own half hour in a pane left as it is', async ($, on) => {
    const note = {
      id: 'kept',
      turnId: 'kept',
      at: NOW - 20 * MIN,
      prompt: '요청',
      answer: '',
      changes: [{ file: 'src/a.ts', path: '/proj/src/a.ts', tool: 'Edit', kind: 'update', added: 1, removed: 1, diff: '@@ -1,1 +1,1 @@\n-a\n+b', isCut: false }],
      moreFiles: 0,
      status: 'ready',
      text: NOTE_TEXT,
      savedAs: 'ready',
      asks: [{ question: '예시로 따라가기', answer: TRACED, at: NOW - 10 * MIN }],
    }
    const w = world(on, 'ok', null, true, new Map<string, unknown>([['history', { '/proj': { at: NOW, notes: [note] } }]]))
    await start($)
    const ui = await pane($)
    expect(await hintsOf(ui)).toEqual([HINT.focused])
    // Its half hour ends 20 minutes on (less what start took), not 30 minutes after this first drawing.
    const shut = NOW - 10 * MIN + 30 * MIN + 1
    await w.clock.advance(shut - 1 - w.clock.now())
    await w.clock.settle()
    expect(await hintsOf(ui)).toEqual([HINT.focused])
    await w.clock.advance(1)
    await w.clock.settle()
    expect(await hintsOf(ui)).toEqual([])
    expect((await fieldOf(ui)).props.placeholder).toBe(SHUT)
    await ui.unmount()
  })

  test('a store 1.7.0 or 1.6 wrote loads as it is: a walk-through kept there opens while young, a note with no questions draws as before', async ($, on) => {
    const note = (id: string, at: number, asks?: { question: string; answer: string; at: number }[]) => ({
      id,
      turnId: id,
      at,
      prompt: `요청 ${id}`,
      answer: '',
      changes: [{ file: 'src/a.ts', path: '/proj/src/a.ts', tool: 'Edit', kind: 'update', added: 1, removed: 1, diff: '@@ -1,1 +1,1 @@\n-a\n+b', isCut: false }],
      moreFiles: 0,
      status: 'ready',
      text: NOTE_TEXT,
      savedAs: 'ready',
      ...(asks ? { asks } : {}),
    })
    const store = new Map<string, unknown>([
      ['history', { '/proj': { at: NOW, notes: [note('old', NOW - 86_400_000), note('kept', NOW - 20 * MIN, [{ question: '예시로 따라가기', answer: TRACED, at: NOW - 10 * MIN }])] } }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await pane($)
    expect(await ui.find({ type: 'Markdown', text: TRACED })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([HINT.focused])
    const key = String((await fieldOf(ui)).props.key)
    w.answer = '맞습니다.'
    await ui.input({ key, text: '3이요' })
    await w.clock.settle()
    expect(w.models.at(-1)).toContain(`${SECTION}\n${TRACED}\n`)
    expect(await ui.find({ type: 'Text', text: '이어서 · 3이요' })).toBeDefined()
    // The note before, with no questions at all, as 1.6 kept it.
    await ui.press({ key: 'prev' })
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([])
    expect((await fieldOf(ui)).props.placeholder).toBe(SHUT)
    await ui.unmount()
  })
})

describe('1.8.0: /learn 보고서 모으기, a team map of the reports gathered in one file (E5)', () => {
  const DAY = 86_400_000
  const FILE = '/proj/팀.md'
  const TEAM_PATH = '/proj/.claude/learn-notes.md'
  const COPIED = '팀 학습 지도를 클립보드에 복사했습니다 · 보고서 3개 · 팀 채널에 붙이기 전에 한 번 읽어 보세요'
  const LEFT = '같은 보고서 1개는 한 번만 셌습니다 · 형식이 맞지 않는 보고서 1개는 뺐습니다 · 기간이 겹치지 않는 보고서 1개는 뺐습니다'
  const HERE = '팀 학습 지도입니다 · 이 화면에서는 클립보드에 복사할 수 없어 여기에 적습니다. 붙이기 전에 한 번 읽어 보세요'
  const USAGE =
    '쓰는 법: /learn 보고서 모으기 파일 · 팀원이 보내 준 /learn 보고서를 .md나 .txt 파일 하나에 모아 저장한 곳을 적습니다 (예: /learn 보고서 모으기 ~/Downloads/팀보고서.txt) · 보고서가 3개 이상이어야 합니다'
  /** No file there (교차 검토): the names Explorer and Finder show, and how to copy the real path. */
  const MISSING =
    '그 파일을 찾지 못했습니다 · 탐색기·Finder에 보이는 이름(다운로드·문서 폴더, 숨겨진 .txt)은 실제 경로와 다를 수 있습니다 · Shift를 누른 채 파일을 오른쪽 클릭해 경로로 복사(macOS는 오른쪽 클릭 뒤 Option을 누르고 경로 이름으로 복사)한 뒤 붙여 넣어 주세요'

  /** A teammate's /learn 보고서 of the last seven days to `at`, as reportMarkdown writes it. */
  function report(fresh: string[], missed: string[] = [], at = NOW, notes = 3, team?: { total: number; met: string[] }): string {
    const index: Record<string, unknown> = {}
    fresh.forEach((name, i) => {
      index[conceptKey(name)] = { name, count: 1, firstAt: at - DAY + i, lastAt: at - DAY + i, blurb: '', files: [] }
    })
    missed.forEach((name, i) => {
      index[conceptKey(name)] = { name, count: 2, firstAt: at - 40 * DAY, lastAt: at - 40 * DAY, blurb: '', files: [], missedAt: at - DAY + i, reviewedAt: at - DAY + i, step: 0 }
    })
    const day = stamp(at - DAY).day
    return reportMarkdown({
      range: recapRange('최근 7일', at)!,
      activity: { [day]: { notes, right: 2, wrong: 1 } },
      index: index as Parameters<typeof reportMarkdown>[0]['index'],
      now: at,
      usage: { [day]: { calls: 20, auto: 12, input: 46_000, output: 10_000 } },
      since: at - 100 * DAY,
      ...(team ? { team } : {}),
    })
  }
  /** `text` with the learner's own words written under its last heading. */
  const own = (text: string, words: string) => text.replace('## 이번 기간에 배운 것을 내 말로 한 줄\n\n- ', `## 이번 기간에 배운 것을 내 말로 한 줄\n\n- ${words}`)
  /** Three teammates' reports as a leader saves them: one sent twice, a block cut short, one of another week. */
  const GATHERED = [
    '김철수  오후 3:12',
    own(report(['클로저', 'async/await'], ['Promise 체이닝']), '홍길동 대리님 덕분에 이해했습니다'),
    own(report(['클로저'], ['Promise 체이닝'], NOW, 4), '어려웠다'),
    report(['클로저', 'async/await'], ['Promise 체이닝'], NOW, 5),
    report(['클로저'], ['Promise 체이닝'], NOW, 4),
    report(['맵 함수'], [], NOW, 6).replace(/^- 학습 노트 6개\n/m, ''),
    report(['클로저'], [], NOW - 14 * DAY, 2),
  ].join('\n\n')

  test('a file of reports becomes a map on the clipboard: what was left out said, no model call, no store write, no file', async ($, on) => {
    const w = world(on)
    await start($)
    w.files.set(FILE, GATHERED)
    const before = { models: w.models.length, sets: w.sets.length, writes: w.writes.length }
    const reply = (await learn($, '보고서 모으기 /proj/팀.md')).text
    expect(reply).toBe(`${COPIED}\n${LEFT}`)
    expect(w.copied).toHaveLength(1)
    const map = w.copied[0]!
    expect(map.split('\n')[0]).toBe(`# 팀 학습 지도 · ${stamp(NOW - 6 * DAY).day} ~ ${stamp(NOW).day} · 보고서 3개`)
    expect(map).toContain('\n- 학습 노트 12개 · 보고서마다 평균 1일 학습\n- 퀴즈 9문제 중 6개 맞힘 (67%)\n')
    expect(map).toContain('\n- 여럿이 새로 배운 개념: 클로저 (3)\n- 여럿이 다시 볼 개념(퀴즈에서 틀림): Promise 체이닝 (3)\n')
    // async/await, in two reports.
    expect(map).toContain('\n- 보고서 3개 미만에 나온 개념 1개는 이름을 적지 않았습니다\n')
    expect(map).toContain('\n- 모델 호출 60번 (자동 노트 36) · 입력 약 14만 · 출력 약 3만 토큰 · 보고서마다 평균 20번\n')
    // With no team file here: where to make one.
    expect(map).toContain('\n## 팀 파일 후보\n\n여럿이 퀴즈에서 틀린 개념입니다. 저장소에 `.claude/learn-notes.md`를 만들고 ')
    expect(map).toContain('\n- **Promise 체이닝**: \n')
    expect(map).not.toContain('팀 용어')
    for (const leak of ['홍길동', '대리님', '김철수', '오후', '어려웠다', '맵 함수', 'async/await', '/proj', '팀.md']) expect(map).not.toContain(leak)
    expect(w.models).toHaveLength(before.models)
    expect(w.sets).toHaveLength(before.sets)
    expect(w.writes).toHaveLength(before.writes)
  })

  test('collect is the same word; a path with spaces, in quotes or as macOS drops it; a folder, another kind or past 2MB is not read', async ($, on) => {
    const w = world(on)
    await start($)
    const spaced = '/home/u/Downloads/팀 보고서 (1).txt'
    w.files.set(spaced, GATHERED)
    expect((await learn($, 'report collect "~/Downloads/팀 보고서 (1).txt"')).text).toBe(`${COPIED}\n${LEFT}`)
    expect((await learn($, '보고서 모으기 /home/u/Downloads/팀\\ 보고서\\ \\(1\\).txt')).text).toBe(`${COPIED}\n${LEFT}`)
    expect((await learn($, '보고 COLLECT ~/Downloads/팀 보고서 (1).txt')).text).toBe(`${COPIED}\n${LEFT}`)
    expect(w.copied).toHaveLength(3)
    w.dirs = new Set(['/home/u/빈 폴더'])
    expect((await learn($, '보고서 모으기 ~/빈 폴더')).text).toBe('폴더가 아니라 보고서를 모은 파일 하나를 적습니다')
    expect((await learn($, '보고서 모으기 ~/Downloads')).text).toBe('폴더가 아니라 보고서를 모은 파일 하나를 적습니다')
    w.files.set('/proj/팀.png', GATHERED)
    expect((await learn($, '보고서 모으기 팀.png')).text).toBe('md나 txt 파일만, 2MB까지 읽습니다')
    w.files.set(FILE, GATHERED)
    w.sizes = new Map([[FILE, 2_000_001]])
    expect((await learn($, '보고서 모으기 팀.md')).text).toBe('md나 txt 파일만, 2MB까지 읽습니다')
    w.sizes = new Map([[FILE, 2_000_000]])
    expect((await learn($, '보고서 모으기 팀.md')).text).toBe(`${COPIED}\n${LEFT}`)
    // An .md past what a read takes since: the same words.
    w.readFails = new Map([[FILE, 'over the 4194304-byte limit']])
    expect((await learn($, '보고서 모으기 팀.md')).text).toBe('md나 txt 파일만, 2MB까지 읽습니다')
  })

  test('each refusal in one line that never says the path again, with no fault kept and nothing read where the rules forbid it', async ($, on) => {
    const reads: string[] = []
    on('fs.read', { path: /\.(?:md|txt)$/ }, (_$, e, next) => {
      reads.push(e.path)
      return next(e)
    })
    const w = world(on)
    on('tool.check', { tool: 'Read' }, (_$, e) => ({ decision: /비밀|secret/.test(String((e.input as { file_path?: string }).file_path)) ? 'deny' : 'allow' }))
    await start($)
    const faults = JSON.stringify(w.store.get('faults') ?? null)
    const logs = w.logs.length
    const read = reads.length
    const said: string[] = []
    const ask = async (args: string) => {
      const text = (await learn($, args)).text ?? ''
      said.push(text)
      return text
    }
    expect(await ask('보고서 모으기')).toBe(USAGE)
    expect(await ask('보고서 모으기 ""')).toBe(USAGE)
    w.statFails = new Map([['/proj/없음.md', 'ENOENT']])
    expect(await ask('보고서 모으기 없음.md')).toBe(MISSING)
    expect(await ask('보고서 모으기 \\\\server\\share\\팀.md')).toBe('네트워크 위치는 읽지 않습니다 · 보고서를 내 컴퓨터 폴더에 저장한 뒤 다시 해 주세요')
    expect(await ask('보고서 모으기 //server/share/팀.md')).toBe('네트워크 위치는 읽지 않습니다 · 보고서를 내 컴퓨터 폴더에 저장한 뒤 다시 해 주세요')
    // A share mounted as a folder (a mapped drive): the engine's refusal says so.
    w.statFails = new Map([['/mnt/팀공유/보고서.md', 'network']])
    expect(await ask('보고서 모으기 /mnt/팀공유/보고서.md')).toBe('네트워크 위치는 읽지 않습니다 · 보고서를 내 컴퓨터 폴더에 저장한 뒤 다시 해 주세요')
    w.files.set(FILE, GATHERED)
    w.readFails = new Map([[FILE, 'EACCES']])
    expect(await ask('보고서 모으기 팀.md')).toBe('그 파일을 읽지 못했습니다: 이 파일을 읽을 권한이 없습니다')
    w.readFails = new Map([[FILE, 'EBUSY']])
    expect(await ask('보고서 모으기 팀.md')).toBe('그 파일을 읽지 못했습니다: 다른 프로그램이 파일을 잡고 있습니다')
    w.statFails = new Map([[FILE, 'EIO']])
    expect(await ask('보고서 모으기 팀.md')).toBe('그 파일을 읽지 못했습니다')
    w.statFails = new Map()
    w.readFails = new Map()
    // Forbidden by the permission rules, or a link to a file they forbid: never read.
    w.files.set('/proj/비밀.md', GATHERED)
    expect(await ask('보고서 모으기 비밀.md')).toBe('권한 설정이 이 파일 읽기를 막습니다')
    w.links.set('/proj/링크.md', '/home/u/secret/팀.md')
    w.files.set('/proj/링크.md', GATHERED)
    expect(await ask('보고서 모으기 링크.md')).toBe('권한 설정이 이 파일 읽기를 막습니다')
    expect(reads.slice(read)).toEqual(['/proj/팀.md', '/proj/팀.md'])
    // Too few reports, or none.
    w.files.set('/proj/둘.md', [report(['클로저']), report(['클로저'], [], NOW, 4), report(['클로저'], [], NOW, 4)].join('\n'))
    expect(await ask('보고서 모으기 둘.md')).toBe('보고서가 3개 이상 있어야 팀 학습 지도를 만듭니다 · 지금 센 보고서 2개\n같은 보고서 1개는 한 번만 셌습니다')
    w.files.set('/proj/메모.txt', '이번 주 회의 메모\n- 학습 노트 3개\n')
    expect(await ask('보고서 모으기 메모.txt')).toBe("learn-notes 보고서를 찾지 못했습니다 · '# 학습 보고 ·'로 시작하는 글을 .md나 .txt(UTF-8)로 저장해 주세요")
    // Heads whose notes line a chat dropped: none read, and the second line says why (교차 검토 3).
    const cut = report(['클로저']).replace(/^- 학습 노트 3개\n/m, '')
    w.files.set('/proj/잘린.md', [cut, cut].join('\n\n'))
    expect(await ask('보고서 모으기 잘린.md')).toBe(
      "learn-notes 보고서를 찾지 못했습니다 · '# 학습 보고 ·'로 시작하는 글을 .md나 .txt(UTF-8)로 저장해 주세요\n형식이 맞지 않는 보고서 2개는 뺐습니다",
    )
    expect(w.copied).toEqual([])
    // A path mistyped is no fault of the plugin's: nothing for /learn 진단, no debug line.
    expect(JSON.stringify(w.store.get('faults') ?? null)).toBe(faults)
    expect(w.logs.slice(logs).filter(line => line.startsWith('learn-notes: '))).toEqual([])
    for (const text of said) for (const typed of ['없음.md', 'server', '팀.md', '팀공유', '비밀', '링크', '둘.md', '메모', '잘린']) expect(text).not.toContain(typed)
  })

  test('a path typed as Explorer or Finder shows it (a Korean folder name, no .txt, no folder) finds nothing: the line says why and how to copy the real one (교차 검토)', async ($, on) => {
    const w = world(on)
    await start($)
    w.files.set('/home/u/Downloads/팀보고서.txt', GATHERED)
    w.statFails = new Map(['/home/u/다운로드/팀보고서.txt', '/home/u/Downloads/팀보고서', '/proj/팀보고서.txt'].map(path => [path, 'ENOENT']))
    for (const typed of ['~/다운로드/팀보고서.txt', '~/Downloads/팀보고서', '팀보고서.txt']) {
      const text = (await learn($, `보고서 모으기 ${typed}`)).text
      expect(text).toBe(MISSING)
      expect(text).not.toContain('\n')
    }
    // The path Explorer's 경로로 복사 gives, in its quotes: read.
    expect((await learn($, '보고서 모으기 "/home/u/Downloads/팀보고서.txt"')).text).toBe(`${COPIED}\n${LEFT}`)
    expect((await learn($, '보고서 모으기 ~/Downloads/팀보고서.txt')).text).toBe(`${COPIED}\n${LEFT}`)
  })

  test('the help\'s word for the file typed as it reads is how it is used; an @ mention of the composer\'s file picker is the file', async ($, on) => {
    const w = world(on)
    await start($)
    w.files.set(FILE, GATHERED)
    w.files.set('/proj/팀 보고서.md', GATHERED)
    w.statFails = new Map(['/proj/파일', '/proj/file', '/proj/FILE', '/proj/@팀.md', '/proj/@"팀 보고서.md"'].map(path => [path, 'ENOENT']))
    for (const args of ['보고서 모으기 파일', '보고서 모으기 "파일"', 'report collect file', '보고서 collect FILE']) expect((await learn($, args)).text).toBe(USAGE)
    expect((await learn($, '보고서 모으기 @팀.md')).text).toBe(`${COPIED}\n${LEFT}`)
    expect((await learn($, '보고서 모으기 @"팀 보고서.md"')).text).toBe(`${COPIED}\n${LEFT}`)
    expect(w.copied).toHaveLength(2)
  })

  test('the help\'s word for the file typed before the path: where nothing is at the whole, the path after it is read, its rules asked again (교차 검토 3)', async ($, on) => {
    const reads: string[] = []
    const checks: string[] = []
    on('fs.read', { path: /\.(?:md|txt)$/ }, (_$, e, next) => {
      reads.push(e.path)
      return next(e)
    })
    const w = world(on)
    on('tool.check', { tool: 'Read' }, (_$, e) => {
      const path = String((e.input as { file_path?: string }).file_path)
      checks.push(path)
      return { decision: path.startsWith('/home/u/secret/') ? 'deny' : 'allow' }
    })
    await start($)
    w.files.set(FILE, GATHERED)
    w.files.set('/home/u/Downloads/팀보고서.txt', GATHERED)
    w.files.set('/home/u/secret/팀.md', GATHERED)
    // On a disk, the whole as typed leads nowhere: the folder `파일 ` is not there.
    const typed = {
      '보고서 모으기 파일 /proj/팀.md': '/proj/파일 /proj/팀.md',
      '보고서 모으기 파일 팀.md': '/proj/파일 팀.md',
      '보고서 모으기 파일 ~/Downloads/팀보고서.txt': '/proj/파일 ~/Downloads/팀보고서.txt',
      'report collect File ~/Downloads/팀보고서.txt': '/proj/File ~/Downloads/팀보고서.txt',
      '보고서 모으기 파일 "~/Downloads/팀보고서.txt"': '/proj/파일 "~/Downloads/팀보고서.txt"',
      '보고서 모으기 파일 /home/u/secret/팀.md': '/proj/파일 /home/u/secret/팀.md',
    }
    w.statFails = new Map(Object.values(typed).map(path => [path, 'ENOENT']))
    const read = reads.length
    for (const args of Object.keys(typed).slice(0, 5)) expect((await learn($, args)).text).toBe(`${COPIED}\n${LEFT}`)
    expect(w.copied).toHaveLength(5)
    expect(reads.slice(read)).toEqual([FILE, FILE, '/home/u/Downloads/팀보고서.txt', '/home/u/Downloads/팀보고서.txt', '/home/u/Downloads/팀보고서.txt'])
    // The path after the word is asked of the permission rules as any is, and not read where they forbid it.
    expect((await learn($, '보고서 모으기 파일 /home/u/secret/팀.md')).text).toBe('권한 설정이 이 파일 읽기를 막습니다')
    expect(checks).toContain('/home/u/secret/팀.md')
    expect(reads.slice(read)).not.toContain('/home/u/secret/팀.md')
    // A folder of that name in the project is read as typed.
    w.files.set('/proj/파일 모음/팀.md', GATHERED)
    expect((await learn($, '보고서 모으기 파일 모음/팀.md')).text).toBe(`${COPIED}\n${LEFT}`)
    expect(reads.at(-1)).toBe('/proj/파일 모음/팀.md')
    // No such name (Windows, where the drive's `:` lands mid-path) is nothing there too.
    w.statFails = new Map([['/proj/파일 팀.md', 'EINVAL']])
    expect((await learn($, '보고서 모으기 파일 팀.md')).text).toBe(`${COPIED}\n${LEFT}`)
    // Another cause at the whole is said as before.
    w.statFails = new Map([['/proj/파일 팀.md', 'EACCES']])
    expect((await learn($, '보고서 모으기 파일 팀.md')).text).toBe('그 파일을 읽지 못했습니다: 이 파일을 읽을 권한이 없습니다')
    // Nothing at the path after it either: nothing found, the path never said.
    w.statFails = new Map([['/proj/파일 없음.md', 'ENOENT'], ['/proj/없음.md', 'ENOENT']])
    expect((await learn($, '보고서 모으기 파일 없음.md')).text).toBe(MISSING)
    expect(w.copied).toHaveLength(7)
  })

  test('where the path lands is judged too: a file in a linked folder, a landing withheld; a pipe and a link to nowhere are not read', async ($, on) => {
    const reads: string[] = []
    const checks: string[] = []
    on('fs.read', { path: /\.(?:md|txt)$/ }, (_$, e, next) => {
      reads.push(e.path)
      return next(e)
    })
    const size = GATHERED.length
    // /proj/공유 is a link to /home/u/secret: the file is no link, its folder is.
    on('fs.stat', { path: '/proj/공유/팀.md' }, (_$, e) => ({ value: { kind: 'file' as const, size, mtimeMs: 0, isLink: false, ...(e.resolve ? { realPath: '/home/u/secret/팀.md' } : {}) } }))
    // A link whose landing a hook above withheld: a guard denies without it.
    on('fs.stat', { path: '/proj/가린.md' }, () => ({ value: { kind: 'file' as const, size, mtimeMs: 0, isLink: true } }))
    // A named pipe, and a link that leads nowhere (no landing, `other`).
    on('fs.stat', { path: '/proj/파이프.md' }, (_$, e) => ({ value: { kind: 'other' as const, size: 0, mtimeMs: 0, isLink: false, ...(e.resolve ? { realPath: e.path } : {}) } }))
    on('fs.stat', { path: '/proj/끊긴.md' }, () => ({ value: { kind: 'other' as const, size: 0, mtimeMs: 0, isLink: true } }))
    const w = world(on)
    on('tool.check', { tool: 'Read' }, (_$, e) => {
      const path = String((e.input as { file_path?: string }).file_path)
      checks.push(path)
      return { decision: /secret/.test(path) ? 'deny' : 'allow' }
    })
    await start($)
    for (const path of ['/proj/공유/팀.md', '/proj/가린.md', '/proj/파이프.md', '/proj/끊긴.md', FILE]) w.files.set(path, GATHERED)
    const read = reads.length
    expect((await learn($, '보고서 모으기 공유/팀.md')).text).toBe('권한 설정이 이 파일 읽기를 막습니다')
    expect(checks).toContain('/home/u/secret/팀.md')
    expect((await learn($, '보고서 모으기 가린.md')).text).toBe('권한 설정이 이 파일 읽기를 막습니다')
    expect((await learn($, '보고서 모으기 파이프.md')).text).toBe('md나 txt 파일만, 2MB까지 읽습니다')
    expect((await learn($, '보고서 모으기 끊긴.md')).text).toBe(MISSING)
    expect(reads.slice(read)).toEqual([])
    expect(w.copied).toEqual([])
    // A path that lands where it says is asked about once.
    checks.length = 0
    expect((await learn($, '보고서 모으기 팀.md')).text).toBe(`${COPIED}\n${LEFT}`)
    expect(checks.filter(path => path.endsWith('팀.md'))).toEqual([FILE])
  })

  test('past 300 reports: the ones holding the day most hold, this week\'s of a file added to each week; past 300 of those, said', async ($, on) => {
    const w = world(on)
    await start($)
    // Ten weeks of thirty-one teammates' reports, each week's added at the end.
    const weeks = Array.from({ length: 10 }, (_, k) => Array.from({ length: 31 }, (_, i) => report(['클로저'], [], NOW - (9 - k) * 7 * DAY, i + 1)).join('\n\n'))
    w.files.set(FILE, weeks.join('\n\n'))
    expect((await learn($, '보고서 모으기 팀.md')).text).toBe(
      '팀 학습 지도를 클립보드에 복사했습니다 · 보고서 31개 · 팀 채널에 붙이기 전에 한 번 읽어 보세요\n기간이 겹치지 않는 보고서 279개는 뺐습니다',
    )
    expect(w.copied.at(-1)!.split('\n')[0]).toBe(`# 팀 학습 지도 · ${stamp(NOW - 6 * DAY).day} ~ ${stamp(NOW).day} · 보고서 31개`)
    // 305 of one week: the file's first 300 counted, the rest said.
    w.files.set(FILE, Array.from({ length: 305 }, (_, i) => report(['클로저'], [], NOW, i + 1)).join('\n\n'))
    expect((await learn($, '보고서 모으기 팀.md')).text).toBe('팀 학습 지도를 클립보드에 복사했습니다 · 보고서 300개 · 팀 채널에 붙이기 전에 한 번 읽어 보세요\n300개를 넘는 보고서 5개는 뺐습니다')
    expect(w.copied.at(-1)).toContain('\n- 학습 노트 45150개 · ')
  })

  test('a cloud session says it cannot read this computer\'s files', async ($, on) => {
    const w = world(on, 'ok', null, true, new Map(), { CLAUDE_CODE_REMOTE: 'true' })
    await start($)
    w.files.set(FILE, GATHERED)
    expect((await learn($, '보고서 모으기 팀.md')).text).toBe('이 세션은 클라우드 컴퓨터에서 돌아 내 컴퓨터의 파일을 읽을 수 없습니다')
    expect(w.copied).toEqual([])
  })

  test('where nothing can be copied (away from this screen, an app with no clipboard), the map is the reply', async ($, on) => {
    const w = world(on)
    await start($)
    w.files.set(FILE, GATHERED)
    for (const origin of [{ kind: 'bridge' as const }, { kind: 'channel' as const, server: 'slack' }]) {
      const reply = (await $.command.run({ command: 'learn', args: '보고서 모으기 팀.md', origin, presentation: { isFullscreen: true, columns: 160 } })).text ?? ''
      expect(reply.split('\n').slice(0, 3)).toEqual([HERE, LEFT, ''])
      expect(reply).toContain(`\n\n# 팀 학습 지도 · ${stamp(NOW - 6 * DAY).day} ~ ${stamp(NOW).day} · 보고서 3개\n`)
      expect(reply).toContain('\n- 여럿이 새로 배운 개념: 클로저 (3)\n')
    }
    expect(w.copied).toEqual([])
    w.surfaces = ['desktop']
    w.copyFails = true
    const reply = (await learn($, '보고서 모으기 팀.md')).text ?? ''
    expect(reply.split('\n')[0]).toBe(HERE)
    expect(reply).toContain('\n- **Promise 체이닝**: \n')
  })

  test('the team terms of this repository\'s team file, its merges followed, and its candidates sentence', async ($, on) => {
    const store = new Map<string, unknown>([['aliases', { [conceptKey('Promise chaining')]: conceptKey('Promise 체이닝') }]])
    const w = world(on, 'ok', null, true, store)
    w.files.set(TEAM_PATH, ['## 용어', '- **fetcher**: 우리 팀의 API 호출 함수입니다', '- **캐시 키**: 요청마다 캐시를 나누는 이름입니다', '- **페이지 커서**: 다음 쪽을 가리키는 값입니다', ''].join('\n'))
    await start($)
    const team = (met: string[]) => ({ total: 3, met })
    w.files.set(
      FILE,
      [
        report(['클로저'], ['Promise chaining'], NOW, 3, team(['fetcher'])),
        report(['클로저'], ['Promise 체이닝'], NOW, 4, team(['fetcher', '캐시 키'])),
        report(['클로저'], ['Promise 체이닝'], NOW, 5, team(['fetcher'])),
        // Made in another repository, whose team file had four terms: not in the count.
        report(['클로저'], [], NOW, 6, { total: 4, met: ['캐시 키'] }),
      ].join('\n\n'),
    )
    expect((await learn($, '보고서 모으기 팀.md')).text).toBe('팀 학습 지도를 클립보드에 복사했습니다 · 보고서 4개 · 팀 채널에 붙이기 전에 한 번 읽어 보세요')
    const map = w.copied.at(-1)!
    expect(map).toContain('\n- 여럿이 새로 배운 개념: 클로저 (4)\n- 여럿이 다시 볼 개념(퀴즈에서 틀림): Promise 체이닝 (3)\n')
    expect(map).toContain('\n- 팀 용어 3개 · 이 저장소 팀 용어 줄이 있는 보고서 3개\n  - 여럿이 만남: fetcher (3)\n  - 덜 만남(보고서 3개 미만): 캐시 키 · 페이지 커서\n')
    expect(map).toContain('\n여럿이 퀴즈에서 틀렸지만 팀 용어에 없는 개념입니다. `.claude/learn-notes.md`의 `## 용어`에 ')
    expect(map).toContain('\n- **Promise 체이닝**: \n')
  })

  test('/learn 보고서 with no word or a period is 1.7\'s, and the help names the team map', async ($, on) => {
    const w = world(on)
    await start($)
    expect((await learn($, '보고서')).text).toStartWith('학습 보고서를 클립보드에 복사했습니다 · PR 설명이나 팀 채널에 붙이기 전에 한 번 읽어 보세요')
    expect(w.copied.at(-1)).toStartWith(`# 학습 보고 · ${stamp(NOW - 6 * DAY).day} ~ ${stamp(NOW).day} (최근 7일)`)
    expect((await learn($, '보고서 이번주')).text).toStartWith('학습 보고서를 클립보드에 복사했습니다')
    expect(w.copied.at(-1)).toContain(' (이번 주)\n')
    // Glued to a word, 모으기 is no command: the report's usage.
    expect((await learn($, '보고서 모으기팀.md')).text).toBe('쓰는 법: /learn 보고서 (최근 7일 · 이번주 · 어제 · 오늘 · 2026-10-03) · 팀 학습 지도: /learn 보고서 모으기 파일')
    const help = (await learn($, '도움말')).text ?? ''
    expect(help.split('\n')).toContain('- `/learn 보고서`: 코드 없는 학습 보고서를 클립보드와 파일로 (최근 7일 · `이번주` · `어제`도 됩니다) · 리더는 `/learn 보고서 모으기 파일`로 팀 학습 지도')
  })
})

describe('1.9.0: the writer\'s mark, the known and step copies unread under it, oldWrites and /learn 진단 (F1)', () => {
  const DAY = 86_400_000
  const HOUR = 3_600_000
  const KNOWN = { name: '클로저', count: 2, firstAt: NOW - 9 * DAY, lastAt: NOW - 9 * DAY, blurb: '바깥 변수를 기억한다', files: [], knownAt: NOW - 5 * DAY }
  /** At step 2 since eight days ago: due (seven days a step 2). */
  const DUE = { name: 'map', count: 3, firstAt: NOW - 30 * DAY, lastAt: NOW - 20 * DAY, blurb: '새 배열', files: [], step: 2, reviewedAt: NOW - 8 * DAY }
  /** When 1.9.0 first marked the index of the stores below. */
  const SINCE = NOW - 10 * DAY
  /** A store 1.9.0 wrote last, at `at`: the copies, then the index with the writer's mark; oldWrites kept since SINCE. */
  const marked = (rows: Record<string, unknown>[] = [KNOWN, DUE], at = NOW - DAY) => {
    const index = cleanConcepts(Object.fromEntries(rows.map(one => [conceptKey(one.name as string), one])))
    return new Map<string, unknown>([
      ['stepsFrom', 0],
      ['known', knownMarks(index)],
      ['steps', stepMarks(index)],
      ['concepts', markedConcepts(index, at)],
      ['oldWrites', { since: SINCE, n: 0 }],
    ])
  }
  /** A window of a build before 1.9.0 writes the index back as it read it: every one's cleanConcepts passes over the mark. */
  const oldWrite = (store: Map<string, unknown>) => store.set('concepts', indexIn(store))
  /** The store's reads of the known and step copies. */
  const copies = (w: World) => w.gets.filter(key => key === 'known' || key === 'steps')
  const markOf = (store: Map<string, unknown>) => (store.get('concepts') as Record<string, unknown>)[WRITER_MARK]
  const conceptIn = (store: Map<string, unknown>, name: string) => (store.get('concepts') as Record<string, { step?: number; reviewedAt?: number; knownAt?: number; count: number }>)[conceptKey(name)]!
  /** The index as a 1.6 to 1.8 window reads it: cleanConcepts, then the copies put back. */
  const as16 = (store: Map<string, unknown>) => recallSteps(withKnownMarks(cleanConcepts(store.get('concepts')), store.get('known')), store.get('steps'))
  const storeLine = async ($: Engine) => ((await learn($, '진단')).text ?? '').split('\n').find(line => line.startsWith('- 저장소:'))!

  test('a store 1.9.0 wrote is read with no read of its copies: a quiz made, a grade, /learn 모른다 and 안다, a note\'s count; each write marks the index when it was written, a copy only when it changes', async ($, on) => {
    const store = marked()
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.settle()
    // The start read the index (loadHistory) alone.
    expect(w.gets).toContain('concepts')
    expect(copies(w)).toEqual([])
    // A quiz made reads no copy, and writes no index.
    w.gets.length = 0
    w.sets.length = 0
    w.answer = 'Q1: 문제 하나\nA1: 답 하나'
    await learn($, 'quiz')
    await w.clock.settle()
    expect(copies(w)).toEqual([])
    expect(w.sets).not.toContain('concepts')
    // A grade: read alone, each copy read once just before its write (1.8.0 E1), and the known one again just before
    // the index's (another window's mark written meanwhile kept), the step's written, the known one not.
    await w.clock.advance(HOUR)
    w.gets.length = 0
    w.sets.length = 0
    w.answer = '판정: 맞음\n피드백: 정확합니다.'
    await learn($, 'quiz 1 새 배열을 만들어요')
    await w.clock.settle()
    expect(copies(w)).toEqual(['known', 'steps', 'known'])
    expect(w.sets).toEqual(expect.arrayContaining(['steps', 'concepts']))
    expect(w.sets).not.toContain('known')
    const graded = conceptIn(store, 'map')
    expect(graded.step).toBe(3)
    expect(store.get('steps')).toEqual({ [conceptKey('map')]: [3, graded.reviewedAt] })
    expect(markOf(store)).toBe(w.clock.now())
    // /learn 모른다 and 안다: the known copy written, the step's not.
    for (const [word, reply] of [
      ['모른다', '아는 개념 표시를 지웠습니다: 클로저. 다시 복습과 퀴즈에 나옵니다.'],
      ['안다', '아는 개념으로 표시했습니다: 클로저.'],
    ] as const) {
      await w.clock.advance(HOUR)
      w.gets.length = 0
      w.sets.length = 0
      expect((await learn($, `${word} 클로저`)).text).toStartWith(reply)
      expect(copies(w)).toEqual(['known', 'steps', 'known'])
      expect(w.sets).toEqual(expect.arrayContaining(['known', 'concepts']))
      expect(w.sets).not.toContain('steps')
      expect(markOf(store)).toBe(w.clock.now())
    }
    expect(store.get('known')).toEqual({ [conceptKey('클로저')]: conceptIn(store, '클로저').knownAt })
    // A note's count: both copies the same, neither written.
    const before = markOf(store) as number
    w.gets.length = 0
    w.sets.length = 0
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(copies(w)).toEqual(['known', 'steps', 'known'])
    expect(w.sets).toContain('concepts')
    expect(w.sets).not.toContain('known')
    expect(w.sets).not.toContain('steps')
    expect(markOf(store)).toBeGreaterThan(before)
    expect(conceptIn(store, 'for...of 반복문').count).toBe(1)
    // Read through the copies as a 1.6 to 1.8 window reads it: what this one holds.
    expect(as16(store)).toEqual(cleanMarkedConcepts(store.get('concepts')))
  })

  test('a store with no mark (a build before 1.9.0 wrote it last) is read as 1.8.0 reads it: a mark a 1.5 window dropped put back, a step a 1.5 quiz gave read as 1', async ($, on) => {
    const store = new Map<string, unknown>([
      ['stepsFrom', 0],
      // 1.5 wrote the index: 클로저's mark dropped, map at the step its quiz counted from the notes met.
      ['concepts', { [conceptKey('클로저')]: { ...KNOWN, knownAt: undefined }, [conceptKey('map')]: { ...DUE, step: 4, reviewedAt: NOW - 20 * DAY } }],
      ['known', { [conceptKey('클로저')]: KNOWN.knownAt }],
      ['steps', {}],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.settle()
    expect(copies(w)).toEqual(expect.arrayContaining(['known', 'steps']))
    w.gets.length = 0
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // Read with the index, then again just before its copy's write and the index's.
    expect(copies(w).filter(key => key === 'known')).toHaveLength(3)
    expect(typeof markOf(store)).toBe('number')
    expect(conceptIn(store, '클로저').knownAt).toBe(KNOWN.knownAt)
    expect(conceptIn(store, 'map').step).toBe(1)
    // No 1.9.0 wrote the index here before: nothing counted, the first write keeps when it marked it.
    expect(store.get('oldWrites')).toEqual({ since: markOf(store), n: 0 })
  })

  test('the copies written but the index refused: 1.9.0 reads the index it wrote before, no step lowered, as a 1.8.0 window lowers it', async ($, on) => {
    let isRefused = false
    on('store.set', { key: 'concepts' }, async (_$, e, next) => (isRefused ? { deny: 'refused' } : next(e)))
    const store = marked([DUE])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = 'Q1: 문제 하나\nA1: 답 하나'
    await learn($, 'quiz')
    await w.clock.settle()
    isRefused = true
    w.answer = '판정: 맞음\n피드백: 정확합니다.'
    await learn($, 'quiz 1 새 배열을 만들어요')
    await w.clock.settle()
    isRefused = false
    // The step copy holds the grade's step 3; the index, refused, the step before.
    expect((store.get('steps') as Record<string, [number, number]>)[conceptKey('map')]![0]).toBe(3)
    expect(conceptIn(store, 'map')).toMatchObject({ step: 2, reviewedAt: DUE.reviewedAt })
    // A 1.6 to 1.8 window reads it through the copies: the step not its own, the first, as 1.8.0 itself read it.
    expect(as16(store)[conceptKey('map')]!.step).toBe(1)
    // This one reads the marked index alone: step 2 as it was, written back so with its copy at the next note's count.
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(conceptIn(store, 'map')).toMatchObject({ step: 2, reviewedAt: DUE.reviewedAt })
    expect(store.get('steps')).toEqual({ [conceptKey('map')]: [2, DUE.reviewedAt] })
    expect(as16(store)[conceptKey('map')]).toMatchObject({ step: 2, reviewedAt: DUE.reviewedAt })
  })

  test('oldWrites: the first index write keeps since when, once a load; an old build\'s write read after it counts once, until a marked index is read again', async ($, on) => {
    const store = new Map<string, unknown>([['stepsFrom', 0]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    expect(store.has('oldWrites')).toBe(false)
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A), 't1')
    await finish(w)
    const since = markOf(store) as number
    expect(store.get('oldWrites')).toEqual({ since, n: 0 })
    // Kept once a load: the next index write leaves it.
    w.sets.length = 0
    w.answer = CONCEPT_NOTE(['화살표 함수'])
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(w.sets).toContain('concepts')
    expect(w.sets).not.toContain('oldWrites')
    // Read once a load, at its first index write.
    expect(w.gets.filter(key => key === 'oldWrites')).toEqual(['oldWrites'])
    // A 1.8.0 window writes the index: the mark is gone. This one's next read counts it, with the write's print.
    await w.clock.advance(HOUR)
    oldWrite(store)
    const seenAt = w.clock.now()
    const print = indexPrint(store.get('concepts'))
    await learn($, '보고서')
    await w.clock.settle()
    expect(store.get('oldWrites')).toEqual({ since, last: seenAt, n: 1, w: print })
    // Read again with no marked index between: the same write, counted once.
    await w.clock.advance(HOUR)
    await start($)
    await learn($, '보고서')
    await w.clock.settle()
    expect(store.get('oldWrites')).toEqual({ since, last: seenAt, n: 1, w: print })
    // Another 1.9.0 window writes the index, read here marked; then an old window's write again: twice, though it
    // holds what the first did (the mark seen since tells the two apart).
    await w.clock.advance(HOUR)
    store.set('concepts', markedConcepts(cleanConcepts(store.get('concepts')), w.clock.now()))
    await learn($, '보고서')
    await w.clock.settle()
    expect(store.get('oldWrites')).toEqual({ since, last: seenAt, n: 1, w: print })
    await w.clock.advance(HOUR)
    oldWrite(store)
    const againAt = w.clock.now()
    await learn($, '보고서')
    await w.clock.settle()
    expect(store.get('oldWrites')).toEqual({ since, last: againAt, n: 2, w: print })
    // Nothing of a concept in it.
    expect(JSON.stringify(store.get('oldWrites'))).not.toMatch(/c:|for|화살표|구조/)
  })

  test('oldWrites: an old window writing between each of this one\'s writes is counted each time, its last time moving on', async ($, on) => {
    const store = new Map<string, unknown>([['stepsFrom', 0]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A), 't1')
    await finish(w)
    const since = markOf(store) as number
    let last = since
    for (const [n, name] of [
      [1, '화살표 함수'],
      [2, '구조 분해 할당'],
    ] as const) {
      // A 1.8.0 window writes the index; this one's next note counts concepts over it, reading it with no mark, and writes it marked.
      await w.clock.advance(HOUR)
      oldWrite(store)
      w.answer = CONCEPT_NOTE([name])
      await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: `u${n}` }), `t${n + 1}`)
      await finish(w)
      expect(typeof markOf(store)).toBe('number')
      const seen = store.get('oldWrites') as { since: number; last: number; n: number }
      expect(seen).toMatchObject({ since, n })
      expect(seen.last).toBeGreaterThan(last)
      expect(seen.last).toBeLessThanOrEqual(w.clock.now())
      last = seen.last
    }
  })

  test('oldWrites: a first 1.9.0 session reading an index with no mark counts nothing, nor one with the schema guard on', async ($, on) => {
    const store = new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', { [conceptKey('map')]: DUE }],
      ['steps', { [conceptKey('map')]: [DUE.step, DUE.reviewedAt] }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await learn($, '보고서')
    await w.clock.settle()
    expect(store.has('oldWrites')).toBe(false)
    // Its first count reads the index with no mark and writes it marked, at the same time: not counted either.
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(store.get('oldWrites')).toEqual({ since: markOf(store), n: 0 })
    expect(conceptIn(store, 'map').step).toBe(2)
  })

  test('oldWrites: never written while the schema guard is on', async ($, on) => {
    const store = new Map<string, unknown>([
      ['stepsFrom', 0],
      ['schema', 4],
      ['concepts', { [conceptKey('map')]: DUE }],
      ['oldWrites', { since: SINCE, n: 0 }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await learn($, '보고서')
    await w.clock.settle()
    expect(w.sets).not.toContain('oldWrites')
    expect(store.get('oldWrites')).toEqual({ since: SINCE, n: 0 })
  })

  test('oldWrites unreadable: the index is read and written all the same, and /learn 진단 says it was not read', async ($, on) => {
    on('store.get', { key: 'oldWrites' }, () => ({ deny: 'unreadable' }))
    const store = new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', { [conceptKey('클로저')]: { ...KNOWN, knownAt: undefined } }],
      ['known', { [conceptKey('클로저')]: KNOWN.knownAt }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(conceptIn(store, 'for...of 반복문').count).toBe(1)
    expect(conceptIn(store, '클로저').knownAt).toBe(KNOWN.knownAt)
    expect(typeof markOf(store)).toBe('number')
    expect(store.has('oldWrites')).toBe(false)
    expect(await storeLine($)).toEndWith(' · 옛 판 창의 개념 모음 쓰기: 읽지 못함')
    // No failure of the count: none recorded, and what comes after the index write ran (concepts.md).
    expect((await learn($, '진단')).text ?? '').toContain('- 최근 7일 문제: 없습니다')
    expect(w.files.get('/home/u/.claude/learning-notes/concepts.md') ?? '').toContain('for...of 반복문')
  })

  test('oldWrites refused: the index is written all the same, no failure recorded, concepts.md written (cross-review 1)', async ($, on) => {
    on('store.set', { key: 'oldWrites' }, () => ({ deny: 'refused' }))
    const store = new Map<string, unknown>([['stepsFrom', 0]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(conceptIn(store, 'for...of 반복문').count).toBe(1)
    expect(typeof markOf(store)).toBe('number')
    expect(store.has('oldWrites')).toBe(false)
    expect((await learn($, '진단')).text ?? '').toContain('- 최근 7일 문제: 없습니다')
    expect(w.files.get('/home/u/.claude/learning-notes/concepts.md') ?? '').toContain('for...of 반복문')
  })

  test('a marked index\'s write whose known copy cannot be read again just before it is written all the same, with no failure recorded (cross-review 1)', async ($, on) => {
    // A marked index is read with no read of the copy: the write reads it before its own write, then again.
    let reads = 0
    let failing = 0
    on('store.get', { key: 'known' }, async (_$, e, next) => {
      reads += 1
      return reads === failing ? { deny: 'unreadable' } : next(e)
    })
    const store = marked()
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.settle()
    reads = 0
    failing = 2
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(reads).toBe(2)
    expect(conceptIn(store, 'for...of 반복문').count).toBe(1)
    expect(store.get('known')).toEqual({ [conceptKey('클로저')]: KNOWN.knownAt })
    expect((await learn($, '진단')).text ?? '').toContain('- 최근 7일 문제: 없습니다')
  })

  test('oldWrites: a later load reading the old build\'s write an earlier load counted counts it no more; its last time and count stay (review of 1/5)', async ($, on) => {
    const index = { [conceptKey('map')]: DUE }
    const counted = { since: SINCE, last: NOW - 2 * DAY, n: 1, w: indexPrint(index) }
    const store = new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', index],
      ['steps', { [conceptKey('map')]: [DUE.step, DUE.reviewedAt] }],
      ['oldWrites', counted],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.settle()
    await learn($, '보고서')
    await w.clock.settle()
    expect(w.sets).not.toContain('oldWrites')
    expect(store.get('oldWrites')).toEqual(counted)
    const last = stamp(NOW - 2 * DAY)
    expect(await storeLine($)).toEndWith(` · 옛 판 창의 개념 모음 쓰기: 마지막 ${last.day.slice(5)} ${last.time} (${stamp(SINCE).day.slice(5)}부터 1번)`)
    // The old window writes again: a write of its own, counted.
    await w.clock.advance(HOUR)
    store.set('concepts', { [conceptKey('map')]: { ...DUE, count: DUE.count + 1 } })
    const seenAt = w.clock.now()
    await learn($, '보고서')
    await w.clock.settle()
    expect(store.get('oldWrites')).toEqual({ since: SINCE, last: seenAt, n: 2, w: indexPrint(store.get('concepts')) })
  })

  test('oldWrites: an old build\'s write another 1.9.0 window counted first is not counted again here (review of 1/5)', async ($, on) => {
    const store = marked([DUE])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.settle()
    await w.clock.advance(HOUR)
    oldWrite(store)
    // Another 1.9.0 window read it first, and counted it.
    const counted = { since: SINCE, last: w.clock.now(), n: 1, w: indexPrint(store.get('concepts')) }
    store.set('oldWrites', counted)
    await w.clock.advance(HOUR)
    await learn($, '보고서')
    await w.clock.settle()
    expect(store.get('oldWrites')).toEqual(counted)
  })

  test('oldWrites: a later load\'s first index write leaves the record it finds (review of 1/5)', async ($, on) => {
    const store = marked()
    const held = { since: NOW - 30 * DAY, last: NOW - 2 * DAY, n: 3, w: 'abc12' }
    store.set('oldWrites', held)
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.sets).toContain('concepts')
    expect(w.sets).not.toContain('oldWrites')
    expect(store.get('oldWrites')).toEqual(held)
  })

  test('oldWrites: kept once the marked index is written: a first index write refused keeps none, the next keeps it (review of 1/5)', async ($, on) => {
    let isRefused = true
    on('store.set', { key: 'concepts' }, async (_$, e, next) => (isRefused ? { deny: 'refused' } : next(e)))
    const store = new Map<string, unknown>([['stepsFrom', 0]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A), 't1')
    await finish(w)
    expect(store.has('concepts')).toBe(false)
    expect(store.has('oldWrites')).toBe(false)
    isRefused = false
    await w.clock.advance(HOUR)
    w.answer = CONCEPT_NOTE(['화살표 함수'])
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(store.get('oldWrites')).toEqual({ since: markOf(store), n: 0 })
  })

  test('a 1.8.0 window\'s /learn 안다 landing inside this one\'s index write, after its known copy: the mark kept, as 1.8.0 kept it (review of 1/5)', async ($, on) => {
    const KAT = NOW - HOUR
    let isArmed = false
    let hasLanded = false
    on('store.get', { key: 'steps' }, async (_$, e, next) => {
      if (isArmed) {
        isArmed = false
        hasLanded = true
        // A 1.8.0 window's /learn 안다 클로저, read through the copies: its three writes, the index last with no mark.
        const read = as16(store)
        const next18 = { ...read, [conceptKey('클로저')]: { ...read[conceptKey('클로저')]!, knownAt: KAT } }
        store.set('known', JSON.parse(JSON.stringify(knownMarks(next18))))
        store.set('steps', JSON.parse(JSON.stringify(stepMarks(next18))))
        store.set('concepts', JSON.parse(JSON.stringify(storedConcepts(next18))))
      }
      return next(e)
    })
    const store = marked([{ ...KNOWN, knownAt: undefined }, DUE])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.settle()
    // This one's next note: its index read marked, the step copy read for its write after the known one.
    isArmed = true
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(hasLanded).toBe(true)
    // This one wrote last, the other window's mark in it.
    expect(typeof markOf(store)).toBe('number')
    expect(conceptIn(store, 'for...of 반복문').count).toBe(1)
    expect(cleanMarkedConcepts(store.get('concepts'))[conceptKey('클로저')]!.knownAt).toBe(KAT)
    // Kept at this one's next write, read either way.
    w.answer = CONCEPT_NOTE(['화살표 함수'])
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(store.get('known')).toEqual({ [conceptKey('클로저')]: KAT })
    expect(cleanMarkedConcepts(store.get('concepts'))[conceptKey('클로저')]!.knownAt).toBe(KAT)
    expect(as16(store)[conceptKey('클로저')]!.knownAt).toBe(KAT)
    // The step 1.8.0 would have lowered (its copy not its own) stays.
    expect(conceptIn(store, 'map')).toMatchObject({ step: 2, reviewedAt: DUE.reviewedAt })
  })

  // Another window's /learn 안다 클로저 over a store this one marked: its known and step copies written just before this
  // one reads the index (`copyAt` concepts) or after that, just before this one reads the copy for its write (known);
  // its index as this one reads the step copy for its write, after this one read the index and before it writes its
  // own. A window of 1.8.0 writes the index with no mark, one of 1.9.0 with its own. Read marked, the index says
  // nothing of the mark: the copy, read for the write, does. This one's write: a note's count, a grade, /learn 안다 map.
  for (const [isMarked, copyAt, act] of [
    [false, 'concepts', 'note'],
    [true, 'concepts', 'note'],
    [false, 'known', 'note'],
    [true, 'known', 'note'],
    [false, 'concepts', 'grade'],
    [true, 'known', '안다'],
    [false, 'known', 'merge'],
  ] as const) {
    const what = act === 'note' ? 'note\'s count' : act === 'grade' ? 'grade' : act === '안다' ? '/learn 안다 map' : 'merge of map into a new name'
    test(`a ${isMarked ? '1.9.0' : '1.8.0'} window's /learn 안다 whose copy lands before this one reads the ${copyAt === 'concepts' ? 'index' : 'copy'} and whose index lands inside this one's ${what}: the mark kept, as 1.8.0 kept it (cross-review 1)`, async ($, on) => {
      const KAT = NOW - HOUR
      let phase = 0
      let other: ReturnType<typeof as16> = {}
      on('store.get', { key: copyAt }, async (_$, e, next) => {
        if (phase === 1) {
          phase = 2
          const read = as16(store)
          other = { ...read, [conceptKey('클로저')]: { ...read[conceptKey('클로저')]!, knownAt: KAT } }
          store.set('known', JSON.parse(JSON.stringify(knownMarks(other))))
          store.set('steps', JSON.parse(JSON.stringify(stepMarks(other))))
        }
        return next(e)
      })
      on('store.get', { key: 'steps' }, async (_$, e, next) => {
        if (phase === 2) {
          phase = 3
          store.set('concepts', JSON.parse(JSON.stringify(isMarked ? markedConcepts(other, KAT) : storedConcepts(other))))
        }
        return next(e)
      })
      const store = marked([{ ...KNOWN, knownAt: undefined }, DUE])
      const w = world(on, 'ok', null, true, store)
      await start($)
      await w.clock.settle()
      if (act === 'grade') {
        w.answer = 'Q1: 문제 하나\nA1: 답 하나'
        await learn($, 'quiz')
        await w.clock.settle()
      }
      phase = 1
      if (act === 'note') {
        w.answer = CONCEPT_NOTE(['for...of 반복문'])
        await turn($, () => $.tool.call(EDIT_A))
        await finish(w)
      } else if (act === 'grade') {
        w.answer = '판정: 맞음\n피드백: 정확합니다.'
        await learn($, 'quiz 1 새 배열을 만들어요')
      } else if (act === '안다') {
        expect((await learn($, '안다 map')).text).toStartWith('아는 개념으로 표시했습니다: map.')
      } else {
        await learn($, 'merge map = 배열 맵')
        expect(conceptIn(store, '배열 맵').count).toBe(DUE.count)
      }
      await w.clock.settle()
      expect(phase).toBe(3)
      // This one wrote last, the other window's mark in the index and in the copy, read either way; its own too.
      expect(typeof markOf(store)).toBe('number')
      expect(cleanMarkedConcepts(store.get('concepts'))[conceptKey('클로저')]!.knownAt).toBe(KAT)
      expect(as16(store)[conceptKey('클로저')]!.knownAt).toBe(KAT)
      const mapAt = act === 'merge' ? undefined : conceptIn(store, 'map').knownAt
      expect(store.get('known')).toEqual({ [conceptKey('클로저')]: KAT, ...(act === '안다' ? { [conceptKey('map')]: mapAt } : {}) })
      if (act === '안다') expect(mapAt).toBe(w.clock.now())
      if (act === 'note') {
        expect(conceptIn(store, 'for...of 반복문').count).toBe(1)
        expect(conceptIn(store, 'map')).toMatchObject({ step: 2, reviewedAt: DUE.reviewedAt })
      }
      if (act === 'grade') expect(conceptIn(store, 'map').step).toBe(3)
    })
  }

  test('a /learn 안다 whose known copy was written and its index refused, by an old window or this one: the next index write puts the mark on, as 1.8.0\'s next read did (cross-review 1)', async ($, on) => {
    let isRefused = false
    on('store.set', { key: 'concepts' }, async (_$, e, next) => (isRefused ? { deny: 'refused' } : next(e)))
    const KAT = NOW - HOUR
    const store = marked([{ ...KNOWN, knownAt: undefined }, DUE])
    // A 1.6 to 1.8 window's /learn 안다 클로저: its copy written, its index refused. It reads the mark through its
    // copy (another 안다 there says it is known already); this one reads the marked index alone.
    store.set('known', { [conceptKey('클로저')]: KAT })
    expect(as16(store)[conceptKey('클로저')]!.knownAt).toBe(KAT)
    expect(cleanMarkedConcepts(store.get('concepts'))[conceptKey('클로저')]!.knownAt).toBeUndefined()
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.settle()
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A), 't1')
    await finish(w)
    expect(store.get('known')).toEqual({ [conceptKey('클로저')]: KAT })
    expect(cleanMarkedConcepts(store.get('concepts'))[conceptKey('클로저')]!.knownAt).toBe(KAT)
    expect(as16(store)[conceptKey('클로저')]!.knownAt).toBe(KAT)
    // This one's own, its index refused: said so, read with no mark until the next write, which puts it on.
    await w.clock.advance(HOUR)
    isRefused = true
    expect((await learn($, '안다 map')).text).toStartWith('아는 개념 표시를 남기지 못했습니다')
    isRefused = false
    const mapAt = (store.get('known') as Record<string, number>)[conceptKey('map')]
    expect(mapAt).toBe(w.clock.now())
    expect(cleanMarkedConcepts(store.get('concepts'))[conceptKey('map')]!.knownAt).toBeUndefined()
    w.answer = CONCEPT_NOTE(['화살표 함수'])
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(cleanMarkedConcepts(store.get('concepts'))[conceptKey('map')]!.knownAt).toBe(mapAt)
    expect(as16(store)[conceptKey('map')]!.knownAt).toBe(mapAt)
  })

  test('a known mark the copy holds on a concept the index read has not (a 1.5 window dropped it) stays off when a note counts the concept again, as 1.8.0 wrote the copy over it (cross-review 1)', async ($, on) => {
    const store = new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', { [conceptKey('map')]: DUE }],
      ['known', { [conceptKey('for...of 반복문')]: NOW - 5 * DAY }],
      ['steps', { [conceptKey('map')]: [DUE.step, DUE.reviewedAt] }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.settle()
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(conceptIn(store, 'for...of 반복문').count).toBe(1)
    expect(conceptIn(store, 'for...of 반복문').knownAt).toBeUndefined()
    expect(store.get('known')).toEqual({})
  })

  test('/learn 진단\'s store line: nothing before 1.9.0 marked the index here, then none seen since when, then the last seen and how often', async ($, on) => {
    const store = new Map<string, unknown>([['stepsFrom', 0]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    expect(await storeLine($)).not.toContain('옛 판')
    w.answer = CONCEPT_NOTE(['for...of 반복문'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const since = stamp(markOf(store) as number).day.slice(5)
    expect(await storeLine($)).toEndWith(` · 옛 판 창의 개념 모음 쓰기: 없음 (${since}부터)`)
    await w.clock.advance(2 * DAY)
    oldWrite(store)
    const seen = stamp(w.clock.now())
    await learn($, '보고서')
    await w.clock.settle()
    expect(await storeLine($)).toEndWith(` · 옛 판 창의 개념 모음 쓰기: 마지막 ${seen.day.slice(5)} ${seen.time} (${since}부터 1번)`)
  })

  /** The stores the four old builds left over one 1.9.0 wrote (tests/fixtures/coexist19.ts), and 1.8.0's read of each. */
  const left: { what: string; store: CoexistStore; aliases: Record<string, string>; since: number; read18: Record<string, unknown> }[] = [
    ...COEXIST_CASES.map(one => ({ what: one.what, store: one.after, aliases: one.aliases, since: one.at, read18: one.read18 })),
    ...Object.entries(COEXIST_MIXED.rewrites).map(([v, after]) => ({ what: `(마) ${v} 창이 다시 씀`, store: after, aliases: COEXIST_MIXED.aliases, since: COEXIST_MIXED.at, read18: COEXIST_MIXED.rereads18[v]! })),
  ]
  for (const one of left) {
    test(`coexist19 ${one.what}: read through its copies as 1.8.0 read it, counted as an old build's write, and written back marked`, async ($, on) => {
      const store = new Map<string, unknown>(Object.entries(JSON.parse(JSON.stringify(one.store)) as Record<string, unknown>))
      const w = world(on, 'ok', null, true, store)
      await start($)
      await w.clock.settle()
      expect(copies(w)).toEqual(expect.arrayContaining(['known', 'steps']))
      expect(store.get('oldWrites')).toEqual({ since: one.since, last: NOW, n: 1, w: indexPrint(one.store.concepts) })
      w.answer = CONCEPT_NOTE(['옵셔널 체이닝'])
      await turn($, () => $.tool.call(EDIT_A))
      await finish(w)
      expect(typeof markOf(store)).toBe('number')
      const read = JSON.parse(JSON.stringify(cleanMarkedConcepts(store.get('concepts'), one.aliases))) as Record<string, unknown>
      expect(read[conceptKey('옵셔널 체이닝')]).toMatchObject({ count: 1 })
      delete read[conceptKey('옵셔널 체이닝')]
      expect(read).toEqual(one.read18)
      // As a 1.6 to 1.8 window reads it now: the same.
      const old = JSON.parse(JSON.stringify(recallSteps(withKnownMarks(cleanConcepts(store.get('concepts'), one.aliases), store.get('known'), one.aliases), store.get('steps'), one.aliases))) as Record<string, unknown>
      delete old[conceptKey('옵셔널 체이닝')]
      expect(old).toEqual(one.read18)
    })
  }
})

describe('1.9.0: 팀 규칙을 내 코드로 바꿔 보기, a team-rule practice on t (F2)', () => {
  const DAY = 86_400_000
  const TOOL = 'mcp__learn-notes__notes'
  const TEAM_FILE = ['# 팀', '', '## 규칙', '- API 호출은 `fetch`를 바로 쓰지 말고 `fetcher`를 쓴다', '- 로그는 `logger.info`로 남긴다', ''].join('\n')
  const API = ["import { fetcher } from './fetcher.js'", '', 'export async function getUser(id) {', '  const res = await fetch(`/u/${id}`)', '  return res.json()', '}', ''].join('\n')
  const WRITE_API = { tool: 'Write', tool_use_id: 'a1', file_path: '/proj/src/api.js', content: API } as const
  const RULE_SAID = 'API 호출은 `fetcher`로 하라는 규칙과 달리 `fetch`를 바로 씁니다'
  const RULE_LINE = `팀 규칙과 다를 수 있음: ${RULE_SAID}`
  const TASK = 'API 호출을 팀 규칙대로 fetcher로 바꿔 보세요'
  const LINE = 'const res = await fetch(`/u/${id}`)'
  const EXAMPLE = 'const res = await fetcher(`/u/${id}`)'
  const RULE_NOTE = [
    '### 한 줄 요약',
    '사용자 정보를 가져오는 함수를 만들었습니다',
    '### 무엇이 바뀌었나',
    '- 전: 없음',
    '- 후: `getUser(1)`이 1번 사용자 정보를 돌려줍니다',
    '### 왜 이렇게 바꿨을까',
    '화면에서 사용자 정보를 보이려고 만들었습니다.',
    RULE_LINE,
    '### 배울 개념',
    '- **async/await**: 응답을 기다렸다 씁니다 — `return res.json()`',
    '### 직접 해 보기',
    `- 할 일 (팀 규칙): ${TASK}`,
    `- 고칠 줄: \`\` ${LINE} \`\``,
    '- 확인: `getUser(1)` → 같은 사용자 정보가 나옵니다',
    `- 예시 답: \`\` ${EXAMPLE} \`\``,
  ].join('\n')
  const RULE_ASK = '- 할 일 (팀 규칙): 그 규칙대로 고치는 일 한 문장'
  /** What the team rule's practice's own call answers (1.10.0 G6): the four lines, RULE_NOTE's practice. */
  const RULE_REPLY = [`- 할 일 (팀 규칙): ${TASK}`, `- 고칠 줄: \`\` ${LINE} \`\``, '- 확인: `getUser(1)` → 같은 사용자 정보가 나옵니다', `- 예시 답: \`\` ${EXAMPLE} \`\``].join('\n')
  /** RULE_NOTE as the note's own call writes it (1.10.0 G6: its prompt 1.9.0's off one): a practice of its concept. */
  const OWN_NOTE = RULE_NOTE.replace(
    RULE_REPLY,
    ['- 할 일: 응답을 기다리지 않고 Promise 그대로 돌려주게 바꿔 보세요', '- 고칠 줄: `return res.json()`', '- 확인: `getUser(1)` → Promise가 나옵니다', '- 예시 답: `return res`'].join('\n'),
  )
  const RULE_CHECK = '팀 규칙 연습이다. 판정보다 먼저 고친 줄이 위 팀 규칙을 지키는지 본다.'
  const SHOWN = /### 직접 해 보기 · api\.js\n- 할 일 \(팀 규칙\): API 호출을 팀 규칙대로 fetcher로 바꿔 보세요\n- 확인: `getUser\(1\)` → 같은 사용자 정보가 나옵니다/
  type Kept = { id: string; text: string; drill?: Record<string, unknown> }
  const noteOf = (store: Map<string, unknown>) => (store.get('history') as Record<string, { notes: Kept[] }>)['/proj']!.notes.at(-1)!
  const concept = (store: Map<string, unknown>) => Object.values(indexIn(store) as Record<string, { name: string; reviewedAt?: number }>).find(one => one.name === 'async/await')!

  /**
   * A world whose build runs with the switch `isOn` (the harness in the plugin.json it serves, read at session start),
   * a team file with rules, and the note `text` written for a new api.js; its id. On, a note with a rule line has its
   * team rule's practice asked by a call of its own (1.10.0 G6), answered `drill` (RULE_REPLY: RULE_NOTE's practice).
   */
  async function written($: Engine, on: On, isOn: boolean, store = new Map<string, unknown>(), text = OWN_NOTE, isPlaced = true, drill = RULE_REPLY, extra: Record<string, unknown> = {}) {
    const w = world(on, 'ok', null, isPlaced, store)
    w.harness = { isRuleDrill: isOn, ...extra }
    w.files.set('/proj/.claude/learn-notes.md', TEAM_FILE)
    await start($)
    w.answer = text
    w.texts = [text, drill]
    await turn($, () => $.tool.call(WRITE_API))
    await finish(w)
    w.texts = []
    return { w, id: noteOf(store).id }
  }

  /** As `written` with the switch on, and the terminal's pane on the note. */
  async function practiced($: Engine, on: On, store = new Map<string, unknown>()) {
    const { w, id } = await written($, on, true, store)
    return { w, id, ui: await pane($) }
  }

  for (const isOn of [true, false]) {
    test(`the note's prompt is 1.9.0's off one either way; a rule practice is a call of its own exactly while the build's switch is on (${isOn ? 'on' : 'off'}, 1.10.0 G6)`, async ($, on) => {
      expect(OWN_NOTE).not.toBe(RULE_NOTE)
      const store = new Map<string, unknown>()
      const { w } = await written($, on, isOn, store)
      expect(w.models[0]).not.toContain(RULE_ASK)
      expect(w.models[0]).not.toContain('(팀 규칙)')
      expect(w.systems).toEqual(isOn ? [SYSTEM, RULE_DRILL_SYSTEM] : [SYSTEM])
      expect(w.budgets).toEqual(isOn ? [3500, RULE_DRILL_TOKENS] : [3500])
      expect(noteOf(store).text).toBe(isOn ? RULE_NOTE : OWN_NOTE)
    })
  }

  test('with no harness the switch is the constant the release ships; a team file with terms alone asks for nothing new', async ($, on) => {
    const w = world(on, 'ok', null, true, new Map())
    w.files.set('/proj/.claude/learn-notes.md', TEAM_FILE)
    await start($)
    await turn($, () => $.tool.call(WRITE_API))
    await finish(w)
    expect(w.models.at(-1)!.includes(RULE_ASK)).toBe(false)
    expect(w.systems.includes(RULE_DRILL_SYSTEM)).toBe(IS_RULE_DRILL)
    w.harness = { isRuleDrill: true }
    w.files.set('/proj/.claude/learn-notes.md', '## 용어\n- **주문서**: 결제 직전에 굳힌 장바구니\n')
    await start($)
    await turn($, () => $.tool.call({ ...WRITE_API, tool_use_id: 'a2' }), 't2')
    await finish(w)
    expect(w.models.at(-1)).not.toContain('(팀 규칙)')
    expect(w.models.at(-1)).toContain('주문서')
    // No rules: no rule practice's call though the note says the change may differ from one.
    expect(w.systems.at(-1)).toBe(SYSTEM)
  })

  test('on: the task and check show under a heading naming the file, never the line or the example; t opens the line in a field with no call', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    expect(w.models).toHaveLength(2)
    expect(await ui.find({ type: 'Markdown', text: SHOWN })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /고칠 줄|예시 답|await fetcher\(/ })).toBeUndefined()
    expect((await ui.find({ type: 'Button', key: 'note-drill' }))?.props).toMatchObject({ hotkey: 't', label: '직접 해 보기' })
    await ui.press({ key: 'note-drill' })
    expect(w.models).toHaveLength(2)
    expect(await ui.find({ type: 'Text', text: '✎ 연습입니다 · 파일은 바뀌지 않습니다' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Enter: 확인 · 코드는 영문 상태에서 · Tab: 버튼으로 (1~4 보기)' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '3  export async function getUser(id) {' })).toBeDefined()
    expect((await ui.find({ type: 'Input', key: `drill-${id}` }))?.props).toMatchObject({ label: '4', value: LINE, autoFocus: true })
    expect(focusesOf(w).at(-1)).toBe(`drill-${id}`)
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeUndefined()
    await ui.unmount()
  })

  test('off: a practice the model marked by itself has no t, and is left out of the pane, the copy, /learn 공유 and /learn; the journal keeps it', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w } = await written($, on, false, store, RULE_NOTE, false)
    expect(w.models[0]).not.toContain(RULE_ASK)
    const ui = await pane($)
    expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /직접 해 보기/ })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /팀 규칙과 다를 수 있음/ })).toBeDefined()
    await ui.press({ key: 'share' })
    expect(w.copied.at(-1)).not.toContain('직접 해 보기')
    await ui.unmount()
    await learn($, '공유')
    expect(w.copied.at(-1)).not.toContain('직접 해 보기')
    const shown = (await learn($, '')).text ?? ''
    expect(shown).toContain(RULE_LINE)
    expect(shown).not.toContain('직접 해 보기')
    expect(String((await $.tool.call({ tool: TOOL, action: 'note' })).result)).not.toContain('직접 해 보기')
    const journal = w.journal().find(one => one.text.includes(TASK))!.text
    expect(journal).toContain(`- 할 일 (팀 규칙): ${TASK}`)
    expect(journal).toContain(`- 예시 답: \`\` ${EXAMPLE} \`\``)
  })

  test('on: the example\'s own line is done with no call: no step, no known mark, no slip; the day counts it; the line under it; the journal names a team rule\'s task', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    const before = JSON.stringify(concept(store))
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: 'const res = await fetcher(`/u/${id}`);' })
    await w.clock.settle()
    expect(w.models).toHaveLength(2)
    expect((await ui.find({ type: 'Text', text: '✓ 해냈습니다' }))?.props.color).toBe('green')
    expect(JSON.stringify(concept(store))).toBe(before)
    expect(concept(store).reviewedAt).toBeUndefined()
    expect(store.get('slips')).toBeUndefined()
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 1, wrong: 0, drills: 1 } })
    // Last, dim, nothing to press; one row of a pane 42 cells wide.
    const after = await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })
    expect(after?.props).toMatchObject({ dimColor: true })
    expect(cells(DRILL_RULE_AFTER)).toBeLessThanOrEqual(42)
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn.lastIndexOf(DRILL_RULE_AFTER)).toBeGreaterThan(drawn.lastIndexOf('✓ 해냈습니다'))
    expect(focusesOf(w).at(-1)).toBe('note-drill')
    const journal = w.journal().at(-1)!.text
    expect(journal).toMatch(/## \d{4}-\d{2}-\d{2} 직접 해 보기 \(\d\d:\d\d\)/)
    expect(journal).toContain(`**할 일 (팀 규칙)**: ${TASK}`)
    expect(store.get('quiz')).toBeUndefined()
    await ui.unmount()
  })

  test('on: a line of the learner\'s own goes to Claude once against the rule the note named; one that breaks it is never right', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    const before = JSON.stringify(concept(store))
    await ui.press({ key: 'note-drill' })
    w.answer = '규칙: 안 지킴\n판정: 맞음\n피드백: 결과는 같지만 fetch를 바로 부릅니다.'
    await ui.input({ key: `drill-${id}`, text: 'const res = await fetch(`/u/${id}`, {})' })
    await w.clock.settle()
    expect(w.models).toHaveLength(3)
    const asked = w.models[2]!
    expect(asked).toContain('## 개념\n팀 규칙\n## 문제\n할 일: API 호출을 팀 규칙대로 fetcher로 바꿔 보세요\n')
    expect(asked).toContain(`## 모범 답\n${EXAMPLE}\n## 노트가 짚은 팀 규칙 (노트가 팀 규칙 파일을 보고 쓴 줄이다.`)
    expect(asked).toContain(`\n${RULE_SAID}\n`)
    expect(asked).toContain(RULE_CHECK)
    expect(asked).toContain('\n규칙: (지킴 · 안 지킴 중 하나)\n판정: ')
    expect(asked).not.toContain('헷갈린 점:')
    expect(w.budgets.at(-1)).toBe(480)
    expect((await ui.find({ type: 'Text', text: '△ 거의 맞음' }))?.props.color).toBe('yellow')
    expect(await ui.find({ type: 'Markdown', text: '결과는 같지만 fetch를 바로 부릅니다.' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeDefined()
    expect(JSON.stringify(concept(store))).toBe(before)
    expect(store.get('slips')).toBeUndefined()
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 1, drills: 1 } })
    await ui.unmount()
  })

  test('on: wrong, asked back, then wrong again: no step, no slip though the reply names one; over, the line under it', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    const before = JSON.stringify(concept(store))
    await ui.press({ key: 'note-drill' })
    w.answer = '규칙: 안 지킴\n판정: 틀림\n피드백: 아직 fetch를 바로 부릅니다.\n되묻기: 팀이 쓰라는 함수는 무엇일까요?\n헷갈린 점: fetch와 fetcher가 같다고 봄\n유형: 기타'
    await ui.input({ key: `drill-${id}`, text: 'const res = await window.fetch(`/u/${id}`)' })
    await w.clock.settle()
    expect((await ui.find({ type: 'Text', text: '✗ 아직입니다 · 한 번 더 고쳐 보세요' }))?.props.color).toBe('red')
    expect(await ui.find({ type: 'Markdown', text: '**되묻기:** 팀이 쓰라는 함수는 무엇일까요?' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeUndefined()
    expect(noteOf(store).drill).toMatchObject({ firstTry: { verdict: 'wrong' } })
    expect((noteOf(store).drill!.firstTry as Record<string, unknown>).slip).toBeUndefined()
    w.answer = '규칙: 안 지킴\n판정: 틀림\n피드백: 그대로 fetch입니다.'
    await ui.input({ key: `drill-${id}-again`, text: 'const res = await self.fetch(`/u/${id}`)' })
    await w.clock.settle()
    expect(w.models).toHaveLength(4)
    expect(w.models[3]).toContain('마지막 시도다. 되묻기는 쓰지 않는다.')
    expect(w.models[3]).toContain('## 개념\n팀 규칙\n')
    expect(await ui.find({ type: 'Text', text: '✗ 틀림' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeDefined()
    expect(JSON.stringify(concept(store))).toBe(before)
    expect(store.get('slips')).toBeUndefined()
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 1, drills: 1 } })
    await ui.unmount()
  })

  test('on: "모르겠어요" is the note\'s rule line for a hint with no call; twice, over with no call: a for the example, the line under it', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    const before = JSON.stringify(concept(store))
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: '모르겠어요' })
    expect(w.models).toHaveLength(2)
    expect(await ui.find({ type: 'Text', text: '힌트를 보고 한 번 더 고쳐 보세요' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: `**힌트:** ${RULE_LINE} · 이 줄에서 바꿀 곳 한 군데를 찾아보세요` })).toBeDefined()
    await ui.input({ key: `drill-${id}-again`, text: '몰라요' })
    expect(w.models).toHaveLength(2)
    expect(await ui.find({ type: 'Text', text: '✗ 틀림' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: 'a로 예시 답을 읽어 보세요.' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeDefined()
    await ui.press({ key: 'note-drill-answer' })
    expect(await ui.find({ type: 'Text', text: '✗ 틀림 · 예시 답 봄' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: `**예시 답:** \`\` ${EXAMPLE} \`\`` })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeDefined()
    expect(JSON.stringify(concept(store))).toBe(before)
    expect(store.get('slips')).toBeUndefined()
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 1, drills: 1 } })
    await ui.unmount()
  })

  test('on, where no field is drawn (the mobile app): the task, the check and a; a shows the example and the line under it, nothing graded', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, id } = await written($, on, true, store)
    const before = JSON.stringify(concept(store))
    const phone = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    expect(await phone.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
    expect(await phone.find({ type: 'Markdown', text: SHOWN })).toBeDefined()
    expect(await phone.find({ type: 'Input', key: `drill-${id}` })).toBeUndefined()
    await phone.press({ key: 'note-drill-answer' })
    expect(await phone.find({ type: 'Markdown', text: `**예시 답:** \`\` ${EXAMPLE} \`\`` })).toBeDefined()
    expect(await phone.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeDefined()
    expect(w.models).toHaveLength(2)
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 0 } })
    expect(JSON.stringify(concept(store))).toBe(before)
    expect(noteOf(store).drill).toMatchObject({ isAnswerSeen: true })
    await phone.unmount()
  })

  test('on: a first try a past day left waiting is ended at the next session start: the concepts and slips as they were, the day it was tried counted', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = '규칙: 안 지킴\n판정: 틀림\n피드백: 아직 fetch입니다.\n되묻기: 팀이 쓰라는 함수는 무엇일까요?'
    await ui.input({ key: `drill-${id}`, text: 'const res = await window.fetch(`/u/${id}`)' })
    await w.clock.settle()
    await ui.unmount()
    const concepts = JSON.stringify(indexIn(store))
    await w.clock.advance(DAY)
    await start($)
    await w.clock.settle()
    expect(noteOf(store).drill).toMatchObject({ verdict: 'wrong' })
    expect(JSON.stringify(indexIn(store))).toBe(concepts)
    expect(store.get('slips')).toBeUndefined()
    expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 0, wrong: 1, drills: 1 } })
    expect(w.journal().at(-1)!.text).toContain(`**할 일 (팀 규칙)**: ${TASK}`)
  })

  test('a mark in another shape is kept in the one shape, in the store and the journal; a mark with no rule line over it has no practice anywhere but the journal', async ($, on) => {
    const store = new Map<string, unknown>()
    const loose = RULE_NOTE.replace(`- 할 일 (팀 규칙): ${TASK}`, `- 할 일: (팀 규칙) ${TASK}`)
    // On, its own call's reply says there is none (1.10.0 G6): the note keeps its own practice, the mark kept so.
    const { w } = await written($, on, true, store, loose, false, '- 할 일: 없음')
    expect(w.systems).toEqual([SYSTEM, RULE_DRILL_SYSTEM])
    expect(noteOf(store).text).toBe(RULE_NOTE)
    expect(w.journal().at(-1)!.text).toContain(`- 할 일 (팀 규칙): ${TASK}\n`)
    expect(w.journal().at(-1)!.text).not.toContain('(팀 규칙) API')
    // No "다를 수 있음" line over it: no practice, and none shown.
    w.answer = RULE_NOTE.replace(`${RULE_LINE}\n`, '')
    await turn($, () => $.tool.call({ ...WRITE_API, tool_use_id: 'a2' }), 't2')
    await finish(w)
    const ui = await pane($)
    expect(await ui.find({ type: 'Text', text: /^노트 2\/2/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /직접 해 보기/ })).toBeUndefined()
    await ui.press({ key: 'share' })
    expect(w.copied.at(-1)).not.toContain('직접 해 보기')
    await ui.unmount()
    await learn($, '공유')
    expect(w.copied.at(-1)).not.toContain('직접 해 보기')
    const shown = (await learn($, '')).text ?? ''
    expect(shown).not.toContain('직접 해 보기')
    expect(w.journal().filter(one => one.text.includes(`- 할 일 (팀 규칙): ${TASK}`)).length).toBeGreaterThanOrEqual(1)
    expect(w.journal().at(-1)!.text.split('## ').at(-1)).toContain(`- 할 일 (팀 규칙): ${TASK}`)
  })

  test('on: a practice of a concept under a rule line is 1.8.0\'s: over, its concept marked and no line under it for a team rule', async ($, on) => {
    const store = new Map<string, unknown>()
    const plain = RULE_NOTE.replace(`- 할 일 (팀 규칙): ${TASK}`, '- 할 일: API 호출을 fetcher로 바꿔 보세요')
    // The rule practice's own call answers none, and isRuleWide is off (1.10.0 G6; the harness turns off the wider label
    // the shipped row has on): the note's own practice stays its concept's.
    const { w, id } = await written($, on, true, store, plain, true, '- 할 일: 없음', { isRuleWide: false })
    expect(noteOf(store).text).toBe(plain)
    const ui = await pane($)
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: EXAMPLE })
    await w.clock.settle()
    expect(w.models).toHaveLength(2)
    expect(await ui.find({ type: 'Text', text: '✓ 해냈습니다' })).toBeDefined()
    expect(concept(store).reviewedAt).toBeGreaterThanOrEqual(NOW)
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeUndefined()
    await ui.unmount()
  })

  test('on: c and /learn 공유 carry the rule practice as the pane shows it, its task and check, never its line or example; e\'s question leaves it out (1.10.0 G6, D31)', async ($, on) => {
    const { w, ui } = await practiced($, on)
    await ui.press({ key: 'share' })
    await w.clock.settle()
    expect(w.copied.at(-1)).toContain(`- 할 일 (팀 규칙): ${TASK}`)
    expect(w.copied.at(-1)).not.toContain('await fetcher(')
    w.answer = '쉬운 말로 다시 쓴 답'
    await ui.press({ key: 'easier' })
    await w.clock.settle()
    expect(w.models).toHaveLength(3)
    expect(w.models.at(-1)).not.toContain('직접 해 보기')
    expect(w.models.at(-1)).not.toContain(TASK)
    expect(w.models.at(-1)).toContain(RULE_LINE)
    expect(w.models.at(-1)).not.toContain('await fetcher(')
    await ui.unmount()
    await learn($, '공유')
    expect(w.copied.at(-1)).toContain(`- 할 일 (팀 규칙): ${TASK}`)
    expect(w.copied.at(-1)).not.toContain('await fetcher(')
  })

  test('/learn 진단 names a switch the build runs the other way from its constant (a test harness\'s plugin.json); with none, nothing', async ($, on) => {
    const w = world(on, 'ok', null, true, new Map())
    await start($)
    const plain = ((await learn($, '진단')).text ?? '').split('\n').find(line => line.startsWith('- 버전: '))!
    expect(plain).not.toContain('시험 스위치')
    w.harness = { isRuleDrill: !IS_RULE_DRILL }
    await start($)
    const switched = ((await learn($, '진단')).text ?? '').split('\n').find(line => line.startsWith('- 버전: '))!
    expect(switched).toBe(`${plain} · 시험 스위치: 팀 규칙 연습 ${IS_RULE_DRILL ? '끔' : '켬'}`)
    w.harness = { isRuleDrill: IS_RULE_DRILL }
    await start($)
    expect(((await learn($, '진단')).text ?? '').split('\n').find(line => line.startsWith('- 버전: '))).toBe(plain)
  })

  test('on: the record Claude reads leaves the rule practice out; /learn where no pane shows keeps its task and how to do it', async ($, on) => {
    const store = new Map<string, unknown>()
    await written($, on, true, store, RULE_NOTE, false)
    const told = String((await $.tool.call({ tool: TOOL, action: 'note' })).result)
    expect(told).toContain(RULE_LINE)
    expect(told).not.toContain('할 일 (팀 규칙)')
    expect(told).not.toContain('직접 해 보기')
    const shown = (await learn($, '')).text ?? ''
    expect(shown).toContain(`- 할 일 (팀 규칙): ${TASK}`)
    expect(shown).toContain('\n\n직접 해 보기: 패널에서 t로 고쳐 확인합니다')
    expect(shown).not.toContain('await fetcher(')
  })
})


describe('1.9.0: 처음 보는 코드 behind its switch, and the ladder\'s rungs as their constants or a harness set them (F3 · F4)', () => {
  const DAY = 86_400_000
  const NAME = 'for...of 반복문'
  const OTHER = '구조 분해'
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const WRONG = '판정: 틀림\n피드백: 아닙니다.'
  const PARTLY = '판정: 거의\n피드백: 조금 모자랍니다.'
  const NEW_MISS = '처음 보는 코드는 틀려도 한 단계만 내려갑니다'
  /** A question in code never seen for question `n`: its code, a hint, the trace on its R line and the answer. */
  const fresh = (n: number) =>
    [`T${n}: 예측`, `Q${n}: 아래 코드는 무엇을 찍을까요?`, '```ts', 'const xs = [3, 4]', 'let s = 0', 'for (const x of xs) s += x', 'console.log(s)', '```', `H${n}: 하나씩 더해 보세요`, `R${n}: s는 3, 다시 7이 됩니다`, `A${n}: 7`].join('\n')
  const plainQ = (n: number) => [`T${n}: 예측`, `Q${n}: 문제 ${n}`, `A${n}: 답 ${n}`].join('\n')
  const conceptOf = (store: Map<string, unknown>, name: string) =>
    (store.get('concepts') as Record<string, { step?: number; reviewedAt?: number; missedAt?: number; knownAt?: number }>)[conceptKey(name)]!
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
  const indexOf = (store: Map<string, unknown>, name: string) => quizItems(store).findIndex(one => one.name === name)
  /**
   * Two concepts met in no note and not due for weeks (FILLERS), which fill a quiz to three picks after the ones the
   * test is about: code never seen and code changed are asked only in a quiz of three with no team term (1.10.0 G2,
   * D33 · ladderMixed), the shape their samples measured; in a smaller one, in the learner's own code.
   */
  const FILLERS = ['채움 하나', '채움 둘']
  /** Concepts by name at their steps, each reviewed `ago` before now, their blurbs quoting code, with their step copies; and FILLERS. */
  const storeOf = (steps: Record<string, number>, ago: number) => {
    const concepts = Object.fromEntries([
      ...Object.entries(steps).map(([name, step]) => [
        conceptKey(name),
        { name, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명 — \`for (const n of nums)\``, files: [], step, reviewedAt: NOW - ago },
      ]),
      ...FILLERS.map(name => [conceptKey(name), { name, count: 1, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step: 3, reviewedAt: NOW }]),
    ])
    return new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)]])
  }
  /** A world whose build runs with the ladder's switches `harness` (code never seen at 4 by default), its concepts met in a.ts. */
  async function opened($: Engine, on: On, store: Map<string, unknown>, names: string[], harness: Record<string, unknown> | null = { rungNewStep: 4 }, note = CONCEPT_NOTE) {
    const w = world(on, 'ok', null, true, store)
    if (harness) w.harness = harness
    await start($)
    w.answer = note(names)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    return w
  }
  async function quizIn($: Engine, w: World, reply: string) {
    w.answer = reply
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    return ui
  }
  async function answer(ui: Awaited<ReturnType<typeof pane>>, w: World, key: string, text: string, reply: string) {
    w.answer = reply
    await ui.input({ key, text })
    await w.clock.settle()
  }

  test('on: a concept due at its fifth step met in a .ts file is asked in code never seen; its title, the conversation, the room for it, and no code of the learner\'s or quote sent', async ($, on) => {
    const store = storeOf({ [NAME]: 4 }, 31 * DAY)
    const w = await opened($, on, store, [NAME])
    expect(conceptOf(store, NAME).step).toBe(4)
    const ui = await quizIn($, w, fresh(1))
    const prompt = w.models.at(-1)!
    expect(prompt).toContain(`\n   칸: 처음 보는 코드 (ts로)\n2. 채움 하나 — 채움 하나 설명\n3. 채움 둘 — 채움 둘 설명\n\n개념마다 문제 하나씩`)
    expect(prompt).toContain('처음 보는 코드: 학습자 코드와 다른 상황(다른 이름·값·쓰임)에서')
    expect(prompt).toContain('\nH1: (힌트 한 문장)\nR1: (칸이 "처음 보는 코드"인 문제만: 코드를 한 줄씩 따라간 과정)\nA1:')
    expect(prompt).not.toContain('학습자가 만든 코드')
    expect(prompt).not.toContain('const a = 1')
    expect(prompt).not.toContain('for (const n of nums)')
    expect(prompt).not.toContain('for (const item of items)')
    // One budget for every quiz that writes code of its own or a trace (1.10.0 G2, D12; 3600 in 1.9.0).
    expect(w.budgets.at(-1)).toBe(4600)
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 처음 보는 코드 · 예측$/ })).toBeDefined()
    expect(quizItems(store)[0]).toMatchObject({ rung: 'new', kind: 'predict', hint: '하나씩 더해 보세요', answer: '7' })
    // The trace is dropped: in no window's quiz, the hint and the answer neither.
    expect(JSON.stringify(store.get('quiz'))).not.toContain('다시 7이')
    expect((await learn($, '퀴즈')).text).toContain('\n1. (처음 보는 코드) 아래 코드는 무엇을 찍을까요?')
    await ui.unmount()
    // A new session reads the rung back from the store.
    await start($)
    const again = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    expect(await again.find({ type: 'Text', text: /^문제 1\/1 · 처음 보는 코드 · 예측$/ })).toBeDefined()
    await again.unmount()
  })

  test('off while a window before 1.10.0 (1.8.0 in 1.9.0) stamped within the day: asked in its code changed, the sentence for code never seen not sent; past the half hour still (3/5 검토), past the day in code never seen', async ($, on) => {
    const store = storeOf({ [NAME]: 4 }, 31 * DAY)
    // The newer window a 1.10.0 one (1.10.0 G3: 1.8.0 here in 1.9.0, a window that now keeps it off as well).
    store.set('sessions', { 'session-old': { v: '1.7.1', at: NOW - 20 * 60_000 }, 'session-new': { v: '1.10.0', at: NOW - 60_000 } })
    const w = await opened($, on, store, [NAME], { rungNewStep: 4, rungChangedStep: 2 })
    const changed = ['T1: 예측', 'Q1: 아래 코드는 b를 무엇으로 찍을까요?', '```', 'const a = 10', 'const b = a * 2', 'console.log(b)', '```', 'A1: 20'].join('\n')
    const ui = await quizIn($, w, changed)
    expect(w.models.at(-1)).toContain('\n   칸: 비슷한 코드\n   학습자가 만든 코드 (a.ts):')
    expect(w.models.at(-1)).not.toContain('처음 보는 코드:')
    // Code changed's own R line and room (1.10.0 G2), none of code never seen's.
    expect(w.models.at(-1)).not.toContain('"처음 보는 코드"인 문제만')
    expect(w.models.at(-1)).toContain('\nR1: (칸이 "비슷한 코드"인 문제만: 보인 코드를 한 줄씩 따라간 과정)\n')
    expect(w.budgets.at(-1)).toBe(4600)
    expect(quizItems(store)[0]).toMatchObject({ rung: 'changed' })
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 비슷한 코드 · 예측$/ })).toBeDefined()
    await ui.unmount()
    // Past the half hour (3/5 검토): a 1.7 window stamps only as it starts and as it keeps a note, so one left open
    // grading this quiz may have written none since. Still in its code changed.
    await w.clock.advance(11 * 60_000)
    w.answer = changed
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain('\n   칸: 비슷한 코드\n')
    expect(w.models.at(-1)).not.toContain('처음 보는 코드:')
    // Past the day its stamp is gone: the next quiz asks it in code never seen.
    await w.clock.advance(STAMP_KEPT_MS - 31 * 60_000 + 60_000)
    w.answer = fresh(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (처음 보는 코드) 아래 코드는')
    expect(w.models.at(-1)).toContain('   칸: 처음 보는 코드 (ts로)')
  })

  test('with no harness the build\'s constants decide, as a release runs: code never seen and 비슷한 코드 each by its own', async ($, on) => {
    const store = storeOf({ [NAME]: 4, [OTHER]: 2 }, 31 * DAY)
    const w = await opened($, on, store, [NAME, OTHER], null)
    w.answer = [fresh(1), fresh(2)].join('\n')
    await learn($, '퀴즈 새로')
    const prompt = w.models.at(-1)!
    const rungAt = (step: number) => (step >= RUNG_NEW_STEP ? 'new' : step >= RUNG_CHANGED_STEP ? 'changed' : 'mine')
    const rungs = [rungAt(4), rungAt(2)]
    expect(prompt.includes('   칸: 처음 보는 코드 (ts로)')).toBe(RUNG_NEW_STEP <= 4)
    expect(prompt.includes('처음 보는 코드:')).toBe(RUNG_NEW_STEP <= 4)
    expect(prompt.includes('\n   칸: 비슷한 코드\n')).toBe(rungs.includes('changed'))
    expect(prompt.includes('비슷한 코드: 학습자 코드에서')).toBe(rungs.includes('changed'))
    expect(prompt.includes('\n   칸: 내 코드\n')).toBe(rungs.includes('mine'))
    expect(w.budgets.at(-1)).toBe(rungs.some(rung => rung === 'new' || rung === 'changed') ? 4600 : 3400)
    expect(quizItems(store).map(one => one.rung).sort()).toEqual([...rungs].sort())
  })

  test('a miss in code never seen steps the concept back one, not missed; the pane says so in place of the sentence for misses', async ($, on) => {
    const store = storeOf({ [NAME]: 4 }, 31 * DAY)
    const w = await opened($, on, store, [NAME])
    const ui = await quizIn($, w, fresh(1))
    await answer(ui, w, mineKey(store, 0), '9요', WRONG)
    expect(conceptOf(store, NAME).step).toBe(3)
    expect(conceptOf(store, NAME).reviewedAt).toBeGreaterThan(NOW - DAY)
    expect(conceptOf(store, NAME).missedAt).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: new RegExp(`^1문제 중 0개 맞혔습니다 · ${NEW_MISS} · 오늘 복습을 마쳤습니다$`) })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /틀린 개념은 다음 퀴즈에 먼저 나옵니다/ })).toBeUndefined()
    await ui.unmount()
  })

  test('beside a miss in the learner\'s own code, both sentences in the pane', async ($, on) => {
    const store = storeOf({ [NAME]: 4, [OTHER]: 0 }, 31 * DAY)
    const w = await opened($, on, store, [NAME, OTHER])
    // Both questions show code, so each keeps its pick's rung whichever place the quiz gave it.
    const ui = await quizIn($, w, [fresh(1), fresh(2)].join('\n'))
    const at = { new: indexOf(store, NAME), mine: indexOf(store, OTHER) }
    expect([quizItems(store)[at.new]!.rung, quizItems(store)[at.mine]!.rung]).toEqual(['new', 'mine'])
    await answer(ui, w, mineKey(store, 0), '9요', WRONG)
    await answer(ui, w, mineKey(store, 1), '몰라서 아무거나', WRONG)
    expect(await ui.find({ type: 'Text', text: new RegExp(`^2문제 중 0개 맞혔습니다 · 틀린 개념은 다음 퀴즈에 먼저 나옵니다 · ${NEW_MISS} · `) })).toBeDefined()
    expect(conceptOf(store, OTHER).missedAt).toBeDefined()
    expect(conceptOf(store, NAME).missedAt).toBeUndefined()
    await ui.unmount()
  })

  test('beside one almost right, that one\'s sentence then this; the conversation\'s ends each with a period', async ($, on) => {
    const store = storeOf({ [NAME]: 4, [OTHER]: 0 }, 31 * DAY)
    const w = await opened($, on, store, [NAME, OTHER])
    w.answer = [fresh(1), fresh(2)].join('\n')
    await learn($, '퀴즈 새로')
    const next = { new: indexOf(store, NAME) + 1, mine: indexOf(store, OTHER) + 1 }
    expect(quizItems(store)[next.new - 1]!.rung).toBe('new')
    w.answer = PARTLY
    await learn($, `퀴즈 ${next.mine} 거의 맞는 답`)
    w.answer = WRONG
    expect((await learn($, `퀴즈 ${next.new} 9요`)).text).toContain(`다 풀었습니다: 2문제 중 0개 맞힘. 거의 맞힌 개념은 조금 일찍 다시 나옵니다. ${NEW_MISS}.`)
  })

  test('in the conversation, a miss in code never seen alone ends on its sentence and a period, with none for misses', async ($, on) => {
    const store = storeOf({ [NAME]: 4 }, 31 * DAY)
    const w = await opened($, on, store, [NAME])
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    w.answer = WRONG
    const text = (await learn($, '퀴즈 1 9요')).text ?? ''
    expect(text).toContain(`다 풀었습니다: 1문제 중 0개 맞힘. ${NEW_MISS}.`)
    expect(text).not.toContain('틀린 개념은 다음 퀴즈에 먼저 나옵니다')
    expect(conceptOf(store, NAME).step).toBe(3)
  })

  test('in the conversation, beside a plain miss: that one\'s sentence, then this', async ($, on) => {
    const store = storeOf({ [NAME]: 4, [OTHER]: 0 }, 31 * DAY)
    const w = await opened($, on, store, [NAME, OTHER])
    w.answer = [fresh(1), fresh(2)].join('\n')
    await learn($, '퀴즈 새로')
    w.answer = WRONG
    await learn($, `퀴즈 ${indexOf(store, OTHER) + 1} 몰라서 아무거나`)
    expect((await learn($, `퀴즈 ${indexOf(store, NAME) + 1} 9요`)).text).toContain(`다 풀었습니다: 2문제 중 0개 맞힘. 틀린 개념은 다음 퀴즈에 먼저 나옵니다. ${NEW_MISS}.`)
  })

  test('/learn 퀴즈 틀림 on code never seen alone says it steps back one', async ($, on) => {
    const store = storeOf({ [NAME]: 4, [OTHER]: 0 }, 31 * DAY)
    const w = await opened($, on, store, [NAME, OTHER])
    w.answer = [fresh(1), fresh(2)].join('\n')
    await learn($, '퀴즈 새로')
    const n = indexOf(store, NAME) + 1
    expect(quizItems(store)[n - 1]!.rung).toBe('new')
    await learn($, `퀴즈 정답 ${n}`)
    expect((await learn($, `퀴즈 틀림 ${n}`)).text).toBe(`틀린 것으로 적었습니다: ${n}. ${NAME}. ${NEW_MISS}.`)
    expect(conceptOf(store, NAME).step).toBe(3)
    expect(conceptOf(store, NAME).missedAt).toBeUndefined()
  })

  test('/learn 퀴즈 틀림 on code never seen and another question: the sentence for that one, then this', async ($, on) => {
    const store = storeOf({ [NAME]: 4, [OTHER]: 0 }, 31 * DAY)
    const w = await opened($, on, store, [NAME, OTHER])
    w.answer = [fresh(1), fresh(2)].join('\n')
    await learn($, '퀴즈 새로')
    await learn($, '퀴즈 정답 1')
    await learn($, '퀴즈 정답 2')
    const names = quizItems(store).map(one => `${quizItems(store).indexOf(one) + 1}. ${String(one.name)}`)
    const reply = (await learn($, '퀴즈 틀림 1 2')).text ?? ''
    expect(reply.startsWith(`틀린 것으로 적었습니다: ${names.join(' · ')}. 복습할 개념 맨 앞에 올라 다음 퀴즈에 먼저 나옵니다. ${NEW_MISS}.`)).toBe(true)
    expect(conceptOf(store, OTHER).missedAt).toBeDefined()
  })

  test('right at the last step graduates the concept', async ($, on) => {
    const store = storeOf({ [NAME]: 5 }, 61 * DAY)
    const w = await opened($, on, store, [NAME])
    const ui = await quizIn($, w, fresh(1))
    expect(quizItems(store)[0]).toMatchObject({ rung: 'new' })
    await answer(ui, w, mineKey(store, 0), '7', RIGHT)
    expect(conceptOf(store, NAME).knownAt).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^졸업: for\.\.\.of 반복문/ })).toBeDefined()
    await ui.unmount()
  })

  test('a miss turned right with f is a step on from where it was; right after the hint keeps the step', async ($, on) => {
    const store = storeOf({ [NAME]: 4, [OTHER]: 4 }, 31 * DAY)
    const w = await opened($, on, store, [NAME, OTHER])
    const ui = await quizIn($, w, [fresh(1), fresh(2)].join('\n'))
    const [first, second] = quizItems(store).map(one => String(one.name))
    expect(quizItems(store).map(one => one.rung)).toEqual(['new', 'new'])
    await answer(ui, w, mineKey(store, 0), '7이요 아마', WRONG)
    expect(conceptOf(store, first!).step).toBe(3)
    await ui.press({ key: 'quiz-flip' })
    await w.clock.settle()
    expect(conceptOf(store, first!).step).toBe(5)
    await ui.press({ key: 'quiz-hint' })
    await answer(ui, w, mineKey(store, 1), '7', RIGHT)
    expect(quizItems(store)[1]).toMatchObject({ result: 'right', isHinted: true, rung: 'new' })
    expect(conceptOf(store, second!).step).toBe(4)
    expect(indexOf(store, second!)).toBe(1)
    await ui.unmount()
  })

  test('비슷한 코드 off (a harness\'s null, F4): the third step is asked in its own code, untagged', async ($, on) => {
    const store = storeOf({ [NAME]: 2 }, 8 * DAY)
    const w = await opened($, on, store, [NAME], { rungNewStep: null, rungChangedStep: null })
    const ui = await quizIn($, w, ['T1: 예측', 'Q1: 아래 코드의 b는?', '```', 'const a = 1', 'const b = 2', '```', 'A1: 2'].join('\n'))
    expect(w.models.at(-1)).toContain('\n   칸: 내 코드\n   학습자가 만든 코드 (a.ts):')
    expect(w.models.at(-1)).not.toContain('비슷한 코드')
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 예측$/ })).toBeDefined()
    expect(quizItems(store)[0]).toMatchObject({ rung: 'mine' })
    await ui.unmount()
  })

  test('풀이 보고 풀기 off (a harness\'s null, F4): missed twice, 다시 도전 with no line for a worked example, and asked again as 1.7 did', async ($, on) => {
    const WHAT = '함수가 끝나면 바깥 변수도 사라진다고 봄'
    const store = storeOf({ 클로저: 0 }, DAY)
    store.set('slips', { [conceptKey('클로저')]: { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - DAY, times: 1 } })
    const w = await opened($, on, store, ['클로저'], { workedAfterTimes: null })
    const ui = await quizIn($, w, plainQ(1))
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 다시 도전 · 예측$/ })).toBeDefined()
    await answer(ui, w, mineKey(store, 0), '전역에 남아요', `판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${WHAT}\n유형: 변수 범위`)
    expect((store.get('slips') as Record<string, { times: number }>)[conceptKey('클로저')]).toMatchObject({ times: 2 })
    expect(await ui.find({ type: 'Text', text: /^같은 곳을 또 헷갈렸습니다/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터 보여 줍니다/ })).toBeUndefined()
    await ui.unmount()
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    expect(w.models.at(-1)).not.toContain('풀이 보고 풀기')
  })

  test('(1.9.0 마무리 검토) with no harness worked examples ship off for a concept met in code too: missed twice running, 다시 도전 with no line for a worked example, and asked again as 1.7 did', async ($, on) => {
    // The samples' rule, counted the way it was set, gives off (docs/qa/견본.md, '출력 상한을 올린 뒤 다시 잼').
    const WHAT = '함수가 끝나면 바깥 변수도 사라진다고 봄'
    const store = storeOf({ 클로저: 0 }, DAY)
    store.set('slips', { [conceptKey('클로저')]: { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - DAY, times: 1 } })
    // Its words quote a line of a.ts (QUOTED_NOTE): the code branch of 1.10.0 G1, the one a harness's workedAfterTimes turns.
    const w = await opened($, on, store, ['클로저'], null, QUOTED_NOTE)
    const ui = await quizIn($, w, plainQ(1))
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 다시 도전 · 예측$/ })).toBeDefined()
    await answer(ui, w, mineKey(store, 0), '전역에 남아요', `판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${WHAT}\n유형: 변수 범위`)
    expect((store.get('slips') as Record<string, { times: number }>)[conceptKey('클로저')]).toMatchObject({ times: 2 })
    expect(await ui.find({ type: 'Text', text: /^같은 곳을 또 헷갈렸습니다/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터 보여 줍니다/ })).toBeUndefined()
    await ui.unmount()
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    expect(w.models.at(-1)).not.toContain('풀이 보고 풀기')
    expect(quizItems(store)[0]).toMatchObject({ isRetry: true })
    expect(quizItems(store)[0]!.rung).toBeUndefined()
    // Met in code all along (a.ts): a harness turning worked examples on, as a sample run would, asks it by one.
    w.harness = { workedAfterTimes: 2 }
    await start($)
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain('\n   칸: 풀이 보고 풀기 (ts로)\n')
  })

  test('(1.10.0 G1) a concept no code met, missed twice running: with no harness, or the code branch alone, asked again as 1.7 did; the plain branch on, a worked example told how (WORKED_PLAIN_ASK), 1.9.0\'s line nowhere', async ($, on) => {
    const GIT = 'git push'
    const store = storeOf({ [GIT]: 0 }, DAY)
    store.set('slips', { [conceptKey(GIT)]: { what: '커밋하지 않은 수정도 올라간다고 봄', type: 'other', question: '지난 문제', mine: '올라가요', at: NOW - DAY, times: 2 } })
    const w = world(on, 'ok', null, true, store)
    await start($)
    for (const harness of [undefined, { workedAfterTimes: 2 }]) {
      if (harness) {
        w.harness = harness
        await start($)
        await w.clock.advance(60_000)
      }
      w.answer = plainQ(1)
      const listed = (await learn($, '퀴즈 새로')).text ?? ''
      const prompt = w.models.at(-1)!
      expect(prompt).not.toContain('풀이 보고 풀기')
      expect(prompt).not.toContain('칸 뒤에 언어가')
      expect(prompt).not.toContain('P1:')
      expect(listed).toContain('\n1. (다시 도전) 문제 1')
      expect(w.budgets.at(-1)).toBe(3400)
    }
    // The plain branch on (a harness's workedPlainAfterTimes, as a sample run would): what its question asks, then how
    // its steps are shown, each once, after 풀이 보고 풀기's own line; a P line in the format; 4600.
    w.harness = { workedPlainAfterTimes: 2 }
    await start($)
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    await learn($, '퀴즈 새로')
    const prompt = w.models.at(-1)!
    expect(prompt).toContain(`1. ${GIT} — ${GIT} 설명`)
    expect(prompt).toContain('\n   칸: 풀이 보고 풀기\n')
    expect(prompt).toContain(`힌트에서 풀이를 되풀이하지 않는다.\n${WORKED_TURN_ASK}\n${WORKED_PLAIN_ASK}\n'처음 보는 코드'·'풀이 보고 풀기' 칸은`)
    expect(prompt.split(WORKED_PLAIN_ASK).length).toBe(2)
    expect(prompt).not.toContain(WORKED_CODE_ASK)
    expect(prompt).not.toContain('풀이의 결과는 예의 모든 줄을 차례로 따라가')
    expect(prompt).toContain(`\nT1: (예측 · 왜 · 바꿔 보기 중 하나)\n${WORKED_PLAN_LINE}\nQ1: (문제 한두 문장)\n`)
    expect(w.budgets.at(-1)).toBe(4600)
  })

  test('풀이 보고 풀기 off: a second miss on a question not asked again says no worked example, in the conversation and the pane', async ($, on) => {
    const WHAT = '함수가 끝나면 바깥 변수도 사라진다고 봄'
    const store = storeOf({ 클로저: 0 }, DAY)
    const w = await opened($, on, store, ['클로저'], { workedAfterTimes: null })
    w.answer = plainQ(1)
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]!.isRetry).toBeUndefined()
    // A practice in another window opened a slip on it after the quiz was made: this miss is its second.
    store.set('slips', { [conceptKey('클로저')]: { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW, times: 1 } })
    w.answer = `판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${WHAT}\n유형: 변수 범위`
    const text = (await learn($, '퀴즈 1 전역에 남아요')).text ?? ''
    expect((store.get('slips') as Record<string, { times: number }>)[conceptKey('클로저')]).toMatchObject({ times: 2 })
    expect(text).toContain(`\n헷갈린 점: ${WHAT} · 다음 퀴즈에서 다른 코드로 다시 묻습니다`)
    expect(text).not.toContain('풀이부터 보여 줍니다')
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: new RegExp(`^헷갈린 점: ${WHAT} · 다음 퀴즈에서 다른 코드로 다시 묻습니다`) })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터 보여 줍니다/ })).toBeUndefined()
    await ui.unmount()
  })

  test('(3/5 검토) an edit far down a file that imports a library at its top: the file read for its imports, asked in its own code (1.10.0 G2: code changed only for code that runs alone); with none, code never seen; the file gone, its own code', async ($, on) => {
    const AXIOS = 'axios 응답'
    const POSTS = '/proj/src/api/posts.js'
    const store = storeOf({ [AXIOS]: 4 }, 31 * DAY)
    const w = world(on, 'ok', null, true, store)
    w.harness = { rungNewStep: 4, rungChangedStep: 2 }
    w.files.set(POSTS, 'import axios from "axios"\n\nexport async function fetchPosts() {\n  try {\n    const res = await axios.get("/api/posts")\n    return res.data\n  } catch (err) {\n    return []\n  }\n}\n')
    await start($)
    w.answer = CONCEPT_NOTE([AXIOS])
    await turn($, () => $.tool.call({ tool: 'Edit', tool_use_id: 'u9', file_path: POSTS, old_string: 'fetch(', new_string: 'axios.get(' }))
    await finish(w)
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    // The lines a question quotes have no import: the file's own top says axios.
    expect(w.models.at(-1)).toContain('\n   칸: 내 코드\n   학습자가 만든 코드 (posts.js):')
    expect(w.models.at(-1)).toContain('axios.get("/api/posts", { params: { page: 1 } })')
    expect(w.models.at(-1)).not.toContain('import axios')
    expect(w.models.at(-1)).not.toContain('처음 보는 코드:')
    expect(w.models.at(-1)).not.toContain('비슷한 코드')
    expect(quizItems(store)[0]!.rung).toBe('mine')
    // The same edit in a file that imports nothing from a package: code never seen.
    w.files.set(POSTS, "import { axios } from './http.js'\n\nexport async function fetchPosts() {}\n")
    await w.clock.advance(60_000)
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain('   칸: 처음 보는 코드 (js로)')
    expect(quizItems(store)[0]!.rung).toBe('new')
    // The file gone (or kept from Read): its imports unknown, so its own code, never code never seen nor changed.
    w.statFails = new Map([[POSTS, 'ENOENT']])
    await w.clock.advance(60_000)
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain('\n   칸: 내 코드\n')
    expect(w.models.at(-1)).not.toContain('처음 보는 코드:')
  })

  test('(3/5 검토) with code never seen and code changed off (the release\'s constants) no file is read for its imports; either on (1.10.0 G2: code changed too), once a quiz', async ($, on) => {
    const AXIOS = 'axios 응답'
    const POSTS = '/proj/src/api/posts.js'
    let reads = 0
    on('fs.stat', { path: POSTS }, (_$, e, next) => {
      reads += 1
      return next(e)
    })
    const store = storeOf({ [AXIOS]: 4 }, 31 * DAY)
    const w = world(on, 'ok', null, true, store)
    w.harness = { rungNewStep: null, rungChangedStep: null }
    w.files.set(POSTS, 'import axios from "axios"\n')
    await start($)
    w.answer = CONCEPT_NOTE([AXIOS])
    await turn($, () => $.tool.call({ tool: 'Edit', tool_use_id: 'u9', file_path: POSTS, old_string: 'fetch(', new_string: 'axios.get(' }))
    await finish(w)
    const before = reads
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]!.rung).toBe('mine')
    expect(reads).toBe(before)
    // Code changed on (1.10.0 G2), code never seen off: read once a quiz for its imports; a library, so its own code.
    w.harness = { rungNewStep: null, rungChangedStep: 2 }
    await start($)
    await w.clock.advance(60_000)
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(reads).toBe(before + 1)
    expect(quizItems(store)[0]!.rung).toBe('mine')
    // Both on: still once a quiz.
    w.harness = { rungNewStep: 4, rungChangedStep: 2 }
    await start($)
    await w.clock.advance(60_000)
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(reads).toBe(before + 2)
    expect(quizItems(store)[0]!.rung).toBe('mine')
  })

  test('(3/5 검토) a note that wrote a React file whole: its import in the code sent, asked in its own code, never code never seen nor (1.10.0 G2) code changed', async ($, on) => {
    const HOOK = 'useState 함수형 업데이트'
    const store = storeOf({ [HOOK]: 4 }, 31 * DAY)
    const w = world(on, 'ok', null, true, store)
    w.harness = { rungNewStep: 4, rungChangedStep: 2 }
    await start($)
    w.answer = CONCEPT_NOTE([HOOK])
    const content = "import { useState } from 'react'\n\nexport function Like() {\n  const [n, setN] = useState(0)\n  return n\n}\n"
    await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'u9', file_path: '/proj/src/Like.js', content }))
    await finish(w)
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain('\n   칸: 내 코드\n   학습자가 만든 코드 (Like.js):')
    expect(w.models.at(-1)).not.toContain('처음 보는 코드:')
    expect(w.models.at(-1)).not.toContain('비슷한 코드')
    expect(quizItems(store)[0]!.rung).toBe('mine')
    // A file the note made whole is not read again: its diff has every line from the top.
    expect(w.files.has('/proj/src/Like.js')).toBe(false)
  })

  /**
   * (교차 검토 2) A concept due at its fifth step, met by an edit to POSTS, whose file imports nothing from a package as
   * it stands: asked in code never seen unless the file is kept from its import check. `setup` runs before the build
   * starts; `harness` the ladder's switches. The reads of POSTS a test counts start after this returns.
   */
  const POSTS = '/proj/src/api/posts.js'
  async function postsWorld($: Engine, on: On, setup: (w: World) => void = () => {}, harness: Record<string, unknown> = { rungNewStep: 4, rungChangedStep: 2 }) {
    const AXIOS = 'axios 응답'
    const store = storeOf({ [AXIOS]: 4 }, 31 * DAY)
    const w = world(on, 'ok', null, true, store)
    w.harness = harness
    w.files.set(POSTS, "import { axios } from './http.js'\n\nexport async function fetchPosts() {}\n")
    setup(w)
    await start($)
    w.answer = CONCEPT_NOTE([AXIOS])
    await turn($, () => $.tool.call({ tool: 'Edit', tool_use_id: 'u9', file_path: POSTS, old_string: 'fetch(', new_string: 'axios.get(' }))
    await finish(w)
    return { w, store }
  }
  /** Counts the reads of POSTS from when `arm` is called: hooked before the world's own, so every read passes it. */
  function postsReads(on: On) {
    const count = { reads: 0, isArmed: false }
    on('fs.read', { path: POSTS }, (_$, e, next) => {
      if (count.isArmed) count.reads += 1
      return next(e)
    })
    return count
  }

  test('(교차 검토 2) the file as the tests below start from: read once for its imports, none from a package, asked in code never seen', async ($, on) => {
    const count = postsReads(on)
    const { w, store } = await postsWorld($, on)
    count.isArmed = true
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(count.reads).toBe(1)
    expect(w.models.at(-1)).toContain('   칸: 처음 보는 코드 (js로)')
    expect(quizItems(store)[0]!.rung).toBe('new')
  })

  test('(교차 검토 2) the file read for its imports as it stands: one past 1,000,000 bytes is not read, its imports unknown, asked in its own code (1.10.0 G2; 1.9.0 asked it changed)', async ($, on) => {
    const count = postsReads(on)
    const { w, store } = await postsWorld($, on, w => {
      w.sizes = new Map([[POSTS, 1_000_001]])
    })
    count.isArmed = true
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(count.reads).toBe(0)
    expect(w.models.at(-1)).not.toContain('처음 보는 코드:')
    expect(quizItems(store)[0]!.rung).toBe('mine')
  })

  test('(교차 검토 2) the file read for its imports holds a NUL: not text, its imports unknown, asked in its own code (1.10.0 G2; 1.9.0 asked it changed)', async ($, on) => {
    const { w, store } = await postsWorld($, on, w => {
      w.files.set(POSTS, "import { axios } from './http.js'\u0000\n\nexport async function fetchPosts() {}\n")
    })
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).not.toContain('처음 보는 코드:')
    expect(quizItems(store)[0]!.rung).toBe('mine')
  })

  test('(교차 검토 2) the file read for its imports is a link to one the permission rules keep from Read: never read, asked in its own code (1.10.0 G2; 1.9.0 asked it changed)', async ($, on) => {
    on('tool.check', { tool: 'Read' }, (_$, e) => ({ decision: String((e.input as { file_path?: string }).file_path).includes('/secret/') ? 'deny' : 'allow' }))
    const count = postsReads(on)
    const { w, store } = await postsWorld($, on, w => {
      w.links.set(POSTS, '/proj/secret/posts.js')
    })
    count.isArmed = true
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(count.reads).toBe(0)
    expect(w.models.at(-1)).not.toContain('처음 보는 코드:')
    expect(quizItems(store)[0]!.rung).toBe('mine')
  })

  test('(교차 검토 2) with code never seen off, a quiz reads no stamps for it: the sessions read as often as before the quiz', async ($, on) => {
    // The file with no line bringing code in (1.10.0 G2's 3/7 review: one importing a path is asked in its own code), so
    // the rung on is code changed.
    const { w, store } = await postsWorld($, on, w => w.files.set(POSTS, 'export async function fetchPosts() {}\n'), { rungNewStep: null, rungChangedStep: 2 })
    const before = w.gets.filter(key => key === 'sessions').length
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]!.rung).toBe('changed')
    expect(w.gets.filter(key => key === 'sessions').length).toBe(before)
  })

  test('(3/5 검토) the stamps unreadable: code never seen off for that quiz, as for a window before 1.8.0; readable again, on', async ($, on) => {
    let isUnread = false
    on('store.get', { key: 'sessions' }, (_$, e, next) => (isUnread ? { deny: 'learn-notes: $.store.get: the store could not be read' } : next(e)))
    const store = storeOf({ [NAME]: 4 }, 31 * DAY)
    const w = await opened($, on, store, [NAME], { rungNewStep: 4, rungChangedStep: 2 })
    isUnread = true
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain('\n   칸: 비슷한 코드\n   학습자가 만든 코드 (a.ts):')
    expect(w.models.at(-1)).not.toContain('처음 보는 코드:')
    isUnread = false
    await w.clock.advance(60_000)
    w.answer = fresh(1)
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain('   칸: 처음 보는 코드 (ts로)')
  })

  test('(3/5 검토) /learn 퀴즈 틀림 while another window\'s quiz takes this one\'s place: the sentence for misses as 1.8.0 said it, none for code never seen', async ($, on) => {
    // Once the concept is marked (armed below), another window's quiz of one question is the one every window shows.
    let isArmed = false
    let isMoved = false
    const store = storeOf({ [NAME]: 0, [OTHER]: 0 }, 31 * DAY)
    on('store.set', { key: 'concepts' }, async (_$, e, next) => {
      const result = await next(e)
      if (isArmed && !isMoved) {
        isMoved = true
        store.set('quiz', { at: NOW + 5 * 60_000, items: [{ key: conceptKey(NAME), name: NAME, question: '다른 창의 문제', answer: '1' }], isRevealed: false })
      }
      return result
    })
    on('state.get', { plugin: 'learn-notes', key: 'quiz' }, (_$, e, next) => (isMoved ? { value: { value: null, version: 0 } } : next(e)))
    const w = await opened($, on, store, [NAME, OTHER])
    w.answer = [fresh(1), fresh(2)].join('\n')
    await learn($, '퀴즈 새로')
    // The second question, past the one question of the quiz that takes this one's place: no grade there to read back.
    const second = quizItems(store)[1]!
    expect(second.rung).toBe('mine')
    await learn($, '퀴즈 정답 2')
    isArmed = true
    const text = (await learn($, '퀴즈 틀림 2')).text ?? ''
    expect(isMoved).toBe(true)
    expect(text).toBe(`틀린 것으로 적었습니다: 2. ${String(second.name)}. 복습할 개념 맨 앞에 올라 다음 퀴즈에 먼저 나옵니다.`)
    expect(text).not.toContain(NEW_MISS)
  })

  test('/learn 진단 names a ladder switch the build runs the other way from its constant; null is off, and no step a whole number leaves the constant', async ($, on) => {
    const w = world(on, 'ok', null, true, new Map())
    await start($)
    const versionLine = async () => ((await learn($, '진단')).text ?? '').split('\n').find(line => line.startsWith('- 버전: '))!
    const plain = await versionLine()
    w.harness = { rungNewStep: RUNG_NEW_STEP === 4 ? null : 4, workedAfterTimes: WORKED_AFTER_TIMES === 2 ? null : 2 }
    await start($)
    expect(await versionLine()).toBe(`${plain} · 시험 스위치: 처음 보는 코드 단계 ${RUNG_NEW_STEP === 4 ? '끔' : '4'} · 풀이 보고 풀기 오답 수 (코드 개념) ${WORKED_AFTER_TIMES === 2 ? '끔' : '2'}`)
    w.harness = { rungNewStep: -1, rungChangedStep: 'two', workedAfterTimes: 1.5 }
    await start($)
    expect(await versionLine()).toBe(plain)
  })
})

describe('1.9.0: 바탕 개념, a base concept asked right before the worked example of one missed twice running (F5)', () => {
  const DAY = 86_400_000
  const WHAT = '함수가 끝나면 바깥 변수도 사라진다고 봄'
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const X = '클로저'
  const B = '변수 범위'
  const D = '비동기'
  const F = '배열'
  /** The words of the answer a grade says its base came from (바탕 근거). */
  const WHY = '바탕 근거: "함수가 끝나면 다 사라지니까"'
  /** The lines a grade that lists bases asks for after the slip's (1.10.0 G4's BASE_FORMAT, to the byte). */
  const G4_LINES = [
    '바탕 점검: (위 번호마다 번호 다음에 틀림·바름·없음 중 하나를 써서 쉼표로 잇는다)',
    '바탕 근거: (점검에서 틀림인 개념만 쓰는 짧은 코드 하나와, 답의 생각대로면 나올 결과 → 실제 결과. 없으면 없음)',
    '바탕: (점검에서 틀림인 번호 하나, 없으면 0)',
  ].join('\n')
  /** Its marks of the concepts listed (1.10.0 G4, 바탕 점검): 변수 범위, the third, 틀림. */
  const MARKS = '바탕 점검: 1 없음, 2 없음, 3 틀림'
  /**
   * A grade of a question asked again short of right that asks back, its slip read as coming from the concept numbered
   * `said` in the list (변수 범위 is the third: 비동기 · 배열 · 변수 범위, each sharing counter.js with 클로저 and named by
   * its words, the latest met first), each marked first (`marks`, 1.10.0 G4).
   */
  const based = (said = '3', why = WHY, marks = MARKS) =>
    ['판정: 틀림', '피드백: 그 값은 바깥 변수가 아닙니다.', '되묻기: 안쪽 함수가 다시 불릴 때 c는 어디에 남아 있을까요?', `헷갈린 점: ${WHAT}`, marks, why, `바탕: ${said}`, '유형: 변수 범위'].join('\n')
  /** The same graded at once: no question asked back. */
  const atOnce = (said = '3', why = WHY, marks = MARKS) => ['판정: 틀림', '피드백: 아닙니다.', `헷갈린 점: ${WHAT}`, marks, why, `바탕: ${said}`, '유형: 변수 범위'].join('\n')
  const AGAIN_WRONG = '판정: 틀림\n피드백: 아직 아닙니다.'
  const worked = (n: number) =>
    [`T${n}: 예측`, `Q${n}: 풀이: \`let n = 0; const up = () => ++n; up()\` 뒤 n은 1입니다.`, '이제 풀어 보세요: `let c = 10; const add = () => ++c; add()` 뒤 c는?', `H${n}: 바깥 c`, `A${n}: 11`].join('\n')
  const plainQ = (n: number, text = '문제') => [`T${n}: 예측`, `Q${n}: ${text} ${n}`, `A${n}: 답 ${n}`].join('\n')
  type Row = { what: string; type: string; question: string; mine: string; at: number; times: number; fixedAt?: number; isRight?: true; base?: string }
  const slipsOf = (store: Map<string, unknown>) => (store.get('slips') ?? {}) as Record<string, Row>
  const conceptOf = (store: Map<string, unknown>, name: string) => (store.get('concepts') as Record<string, { step?: number; reviewedAt?: number }>)[conceptKey(name)]!
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
  /**
   * X met after B, D and F; X gone over three days ago and its slip kept two days ago (asked again: 다시 도전), D due,
   * F due in six days and B in nine (so F fills the quiz before B), each with its step copy; `more` adds concepts.
   * All met in counter.js, X by a note that wrote it, its words naming B, D and F and quoting a line of it
   * (metInCode): a worked example of the code branch (1.10.0 G1), the one a base is asked before (1.10.0 G4; in
   * 1.9.0's tests X was met in no file, the plain branch's since G1, and G4 asks no base there).
   */
  const X_WORDS = `${X} 설명 — ${D} · ${F} · ${B}와 함께 씁니다 — \`${COUNTER_QUOTE}\``
  const storeOf = (slip: Partial<Row> = {}, more: Record<string, { step: number; ago: number; first: number }> = {}) => {
    const rows: Record<string, { step: number; ago: number; first: number }> = {
      [X]: { step: 1, ago: 3, first: 30 },
      [B]: { step: 3, ago: 5, first: 60 },
      [D]: { step: 0, ago: 2, first: 40 },
      [F]: { step: 2, ago: 1, first: 50 },
      ...more,
    }
    const concepts = Object.fromEntries(
      Object.entries(rows).map(([name, one]) => [
        conceptKey(name),
        { name, count: 2, firstAt: NOW - one.first * DAY, lastAt: NOW - one.first * DAY, blurb: name === X ? `${X} 설명 — ${D} · ${F} · ${B}와 함께 씁니다` : `${name} 설명`, files: ['counter.js'], step: one.step, reviewedAt: NOW - one.ago * DAY },
      ]),
    )
    const slips = { [conceptKey(X)]: { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 1, ...slip } }
    return metInCode(new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)], ['slips', slips]]), X)
  }
  /**
   * A world whose build asks bases or not (a harness's), started: with worked examples on as 1.8.0 shipped them unless
   * the harness says otherwise (교차 검토 2 turned them off by its sample), as a base is asked only before one.
   */
  async function opened($: Engine, on: On, store: Map<string, unknown>, harness: Record<string, unknown> = { isBaseAsked: true }) {
    const w = world(on, 'ok', null, true, store)
    w.harness = { ...WORKED_BOTH, ...harness }
    await start($)
    return w
  }
  async function quizIn($: Engine, w: World, reply: string) {
    w.answer = reply
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    return ui
  }
  /** The pane on the quiz this window shows, no new one asked for. */
  async function quizPane($: Engine) {
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    return ui
  }
  async function answer(ui: Awaited<ReturnType<typeof pane>>, w: World, key: string, text: string, reply: string) {
    w.answer = reply
    await ui.input({ key, text })
    await w.clock.settle()
  }

  test('missed again on its try again, asked again: the grade is shown the concepts learned before, the base kept on the first try, then on the slip', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store)
    const ui = await quizIn($, w, [plainQ(1), plainQ(2), plainQ(3)].join('\n'))
    expect(quizItems(store).map(one => one.name)).toEqual([X, D, F])
    expect(await ui.find({ type: 'Text', text: /^문제 1\/3 · 다시 도전 · 예측$/ })).toBeDefined()
    await answer(ui, w, mineKey(store, 0), '전역에 남아요', based())
    // The first grade lists the concepts met before 클로저 (each named by its words: the latest met first).
    const first = w.models.at(-1)!
    expect(first).toContain(`## 이 학습자가 지난번에 헷갈린 점\n${WHAT}\n## 학습자가 전에 배운 개념\n1. ${D}\n2. ${F}\n3. ${B}\n## 학습자의 답\n`)
    // Each listed concept marked first (1.10.0 G4), with room for it (BASE_GRADE_TOKENS).
    expect(first).toContain(`헷갈린 점: (거의·틀림일 때만 한 문장. 맞음이면 이 줄을 쓰지 않는다)\n${G4_LINES}\n유형:`)
    expect(w.budgets.at(-1)).toBe(880)
    expect(quizItems(store)[0]).toMatchObject({ firstTry: { slip: WHAT, slipType: 'scope', slipBase: conceptKey(B) } })
    expect(slipsOf(store)[conceptKey(X)]).not.toHaveProperty('base')
    // The try again asks for no slip, nor a base: the first try's is kept.
    await answer(ui, w, `${mineKey(store, 0)}-again`, '함수 안쪽 어딘가', AGAIN_WRONG)
    expect(w.models.at(-1)).not.toContain('전에 배운 개념')
    expect(w.models.at(-1)).not.toContain('바탕')
    expect(w.budgets.at(-1)).toBe(480)
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 2, base: conceptKey(B), at: NOW })
    // Under the grade, no name: the base comes first in the next review quiz (after where the note is, n).
    expect(await ui.find({ type: 'Text', text: `같은 곳을 또 헷갈렸습니다 · n: 이 개념을 배운 노트 · ${WORKED_BASE_NEXT}` })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: new RegExp(B) })).toBeUndefined()
    await ui.unmount()

    // The next review quiz: 변수 범위 right before 클로저's worked example, in the place 배열 (a filler) had.
    await w.clock.advance(60_000)
    w.answer = [plainQ(1, '바탕'), worked(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    const next = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    expect(quizItems(store).map(one => [one.name, one.isBase, one.rung])).toEqual([
      [B, true, undefined],
      [X, undefined, 'worked'],
      [D, undefined, undefined],
    ])
    // The quiz prompt is told nothing of it: asked as any concept is.
    const asked = w.models.at(-1)!
    expect(asked).toContain(`\n1. ${B} — ${B} 설명\n2. ${X} — ${X_WORDS}\n   지난번 문제 '문제 1'`)
    expect(asked).not.toContain('바탕')
    expect(await next.find({ type: 'Text', text: /^문제 1\/3 · 바탕 개념 · 예측$/ })).toBeDefined()
    const lead = await next.find({ type: 'Text', text: BASE_LEAD })
    expect(lead?.props.dimColor).toBe(true)
    expect((await learn($, '퀴즈')).text).toContain('\n1. (바탕 개념) 바탕 1')
    // Graded as any question: right before it is due, its step kept (as a filler's), gone over now; no base asked of it.
    await answer(next, w, mineKey(store, 0), '함수 안에서만 보여요', RIGHT)
    expect(w.models.at(-1)).not.toContain('전에 배운 개념')
    expect(conceptOf(store, B)).toMatchObject({ step: 3, reviewedAt: NOW + 60_000 })
    expect(await next.find({ type: 'Text', text: /^문제 2\/3 · 풀이 보고 풀기 · 예측$/ })).toBeDefined()
    expect(await next.find({ type: 'Text', text: BASE_LEAD })).toBeUndefined()
    await next.unmount()
  })

  test('graded at once with no question asked back: the same base on the slip; turned right it goes with the slip before, turned wrong it is back', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    w.answer = atOnce()
    const reply = (await learn($, '퀴즈 1 전역에 남아요')).text ?? ''
    expect(reply).toContain(`\n같은 곳을 또 헷갈렸습니다 · ${WORKED_BASE_NEXT}`)
    expect(reply).not.toContain(B)
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 2, base: conceptKey(B) })
    expect(quizItems(store)[0]).toMatchObject({ slipBase: conceptKey(B), slipBefore: { times: 1 } })
    await learn($, '퀴즈 맞음 1')
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 1 })
    expect(slipsOf(store)[conceptKey(X)]).not.toHaveProperty('base')
    await learn($, '퀴즈 틀림 1')
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 2, base: conceptKey(B) })
  })

  for (const [said, why] of [['0', WHY], ['7', WHY], ['클로저', WHY], ['3', '바탕 근거: 없음']]) {
    test(`a base not among the concepts shown, or with no words of the answer (바탕: ${said}, ${why}): none kept, the line as 1.8.0 wrote it`, async ($, on) => {
      const store = storeOf()
      const w = await opened($, on, store)
      w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
      await learn($, '퀴즈 새로')
      w.answer = atOnce(said, why)
      expect((await learn($, '퀴즈 1 전역에 남아요')).text).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다')
      expect(slipsOf(store)[conceptKey(X)]).not.toHaveProperty('base')
      expect(quizItems(store)[0]).not.toHaveProperty('slipBase')
    })
  }

  test('only a question asked again is graded with the list: not one asked the first time, nor an answer of two characters', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isRetry])).toEqual([[X, true], [D, undefined], [F, undefined]])
    // 비동기, asked the first time: 1.8.0's grade, no base kept though the reply names one.
    w.answer = atOnce()
    await learn($, '퀴즈 2 바로 찍혀요')
    expect(w.models.at(-1)).not.toContain('전에 배운 개념')
    expect(w.models.at(-1)).not.toContain('바탕')
    expect(quizItems(store)[1]).not.toHaveProperty('slipBase')
    expect(slipsOf(store)[conceptKey(D)]).not.toHaveProperty('base')
    // On the one asked again, two characters say too little to read a slip from: no list, no base.
    const calls = w.models.length
    w.answer = atOnce()
    await learn($, '퀴즈 1 10')
    expect(w.models).toHaveLength(calls + 1)
    expect(w.models.at(-1)).toContain("## 이 학습자가 지난번에 헷갈린 점")
    expect(w.models.at(-1)).not.toContain('전에 배운 개념')
    expect(slipsOf(store)[conceptKey(X)]).not.toHaveProperty('base')
  })

  test('off (the default\'s bytes): no list in the grade, no base kept though a reply names one, the next quiz as 1.8.0 made it', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store, { isBaseAsked: false })
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    w.answer = atOnce()
    expect((await learn($, '퀴즈 1 전역에 남아요')).text).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다')
    expect(w.models.at(-1)).not.toContain('전에 배운 개념')
    expect(w.models.at(-1)).not.toContain('바탕:')
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 2 })
    expect(slipsOf(store)[conceptKey(X)]).not.toHaveProperty('base')
    expect(quizItems(store)[0]).not.toHaveProperty('slipBase')
    await w.clock.advance(60_000)
    w.answer = [worked(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => one.name)).toEqual([X, D, F])
    expect(quizItems(store).some(one => 'isBase' in one)).toBe(false)
  })

  test('with no harness the build runs as its constant says; a slip with a base from another window is asked so only while it is on', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) })
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = [plainQ(1), worked(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]!.name).toBe(IS_BASE_ASKED ? B : X)
  })

  test('풀이 보고 풀기 off (F4\'s null): asked again as 1.7 did, no base before it', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) })
    const w = await opened($, on, store, { isBaseAsked: true, workedAfterTimes: null, workedPlainAfterTimes: null })
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isRetry])).toEqual([[X, true], [D, undefined], [F, undefined]])
  })

  test('its base gone over since the slip was kept: asked once for that slip, not again', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) }, { [B]: { step: 3, ago: 1, first: 60 } })
    const w = await opened($, on, store)
    w.answer = [worked(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => one.name)).toEqual([X, D, F])
  })

  test('its base\'s own slip open: asked again as its own (다시 도전), its title not taken over', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) })
    // Kept after its last review (five days ago), so the next quiz asks it again: first, its slip the older.
    store.set('slips', { ...slipsOf(store), [conceptKey(B)]: { what: '안에서 만든 변수가 밖에서도 보인다고 봄', type: 'scope', question: '지난 문제', mine: '보여요', at: NOW - 4 * DAY, times: 1 } })
    const w = await opened($, on, store)
    const ui = await quizIn($, w, [plainQ(1), worked(2), plainQ(3)].join('\n'))
    expect(quizItems(store).map(one => [one.name, one.isBase, one.isRetry])).toEqual([[B, undefined, true], [X, undefined, undefined], [D, undefined, undefined]])
    expect(await ui.find({ type: 'Text', text: /^문제 1\/3 · 다시 도전 · 예측$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: BASE_LEAD })).toBeUndefined()
    await ui.unmount()
  })

  test('/learn 퀴즈 팀 asks the team\'s terms alone: no base', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) })
    const w = world(on, 'ok', null, true, store)
    w.harness = { isBaseAsked: true }
    w.files.set('/proj/.claude/learn-notes.md', '# 팀\n\n## 용어\n- **주문서**: 결제 직전에 굳힌 장바구니\n')
    await start($)
    w.answer = plainQ(1)
    await learn($, '퀴즈 팀')
    expect(quizItems(store).map(one => one.name)).toEqual(['주문서'])
    expect(quizItems(store).some(one => 'isBase' in one)).toBe(false)
  })

  test('its base past the concepts a quiz looks through is found in the index, its code as any pick\'s; a worked example unread drops the mark', async ($, on) => {
    // Five fillers due before 변수 범위: the quiz looks through six, 변수 범위 not among them.
    const more = Object.fromEntries(['문자열', '조건문', '반복문', '객체', '함수'].map((name, i) => [name, { step: 2, ago: 1, first: 50 + i }]))
    const store = storeOf({ times: 2, base: conceptKey(B) }, more)
    const w = await opened($, on, store)
    w.answer = [plainQ(1, '바탕'), worked(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isBase])).toEqual([[B, true], [X, undefined], [D, undefined]])
    // The model's reply wrote no question for 클로저: 변수 범위 is a question as any other, no tag and no dim line.
    await w.clock.advance(60_000)
    w.answer = [plainQ(1, '바탕'), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    const ui = await quizPane($)
    expect(quizItems(store).map(one => one.name)).toEqual([B, D])
    expect(quizItems(store)[0]).not.toHaveProperty('isBase')
    expect(await ui.find({ type: 'Text', text: /^문제 1\/2 · 예측$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: BASE_LEAD })).toBeUndefined()
    await ui.unmount()
  })

  test('a 1.8 window that writes the quiz and the slips back: the base a question as any other, the next quiz 1.8.0\'s', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) })
    const w = await opened($, on, store)
    w.answer = [plainQ(1, '바탕'), worked(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]).toMatchObject({ isBase: true })
    // 1.8.0's quizItemOf keeps no isBase, slipBase or firstTry.slipBase; its slipRecordOf no base.
    const quiz = store.get('quiz') as { items: Record<string, unknown>[] }
    store.set('quiz', { ...quiz, items: quiz.items.map(({ isBase, slipBase, ...rest }) => rest) })
    store.set('slips', Object.fromEntries(Object.entries(slipsOf(store)).map(([key, { base, ...rest }]) => [key, rest])))
    // Graded on the quiz the store holds, every window's: as any question, right before it is due its step kept.
    w.answer = RIGHT
    await learn($, '퀴즈 1 함수 안에서만 보여요')
    expect(conceptOf(store, B)).toMatchObject({ step: 3, reviewedAt: NOW })
    expect(quizItems(store)[0]).toMatchObject({ result: 'right' })
    expect(quizItems(store)[0]).not.toHaveProperty('isBase')
    // This window shows the quiz as the store has it from then on.
    expect((await learn($, '퀴즈')).text).not.toContain('(바탕 개념)')
    const ui = await quizPane($)
    expect(await ui.find({ type: 'Text', text: /^문제 2\/3 · 풀이 보고 풀기 · 예측$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: BASE_LEAD })).toBeUndefined()
    await ui.unmount()
    // The slip the 1.8 window wrote back has no base: the next quiz is the worked example with no base before it.
    await w.clock.advance(60_000)
    w.answer = [worked(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.rung])).toEqual([[X, 'worked'], [D, undefined], [F, undefined]])
  })

  test('/learn 진단 counts the open slips with a base while bases are asked, no name; the version line names a switch turned', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) })
    const w = await opened($, on, store)
    const text = (await learn($, '진단')).text ?? ''
    expect(text).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 1\n')
    expect(text).not.toContain(B)
    if (!IS_BASE_ASKED) expect(text).toMatch(/· 시험 스위치: (?:[^\n]* · )?바탕 개념 켬/)
    w.harness = { ...WORKED_BOTH, isBaseAsked: false }
    await start($)
    const off = (await learn($, '진단')).text ?? ''
    expect(off).toContain('· 열린 채 두 번 이상 1\n')
    expect(off).not.toContain('바탕 개념')
  })

  test('set right after being asked back, then missed with a base on its try again (its third miss running): the worked example comes with no base, and the line says so (4/5 검토)', async ($, on) => {
    const store = storeOf({ times: 2, isRight: true })
    const w = await opened($, on, store)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isRetry, one.rung])).toEqual([[X, true, undefined], [D, undefined, undefined], [F, undefined, undefined]])
    w.answer = atOnce()
    const reply = (await learn($, '퀴즈 1 전역에 남아요')).text ?? ''
    expect(reply).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다')
    expect(reply).not.toContain(WORKED_BASE_NEXT)
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 3 })
    // /learn 진단 counts no base a quiz will not ask.
    expect((await learn($, '진단')).text).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 0\n')
    await w.clock.advance(60_000)
    w.answer = [worked(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isBase, one.rung])).toEqual([
      [X, undefined, 'worked'],
      [D, undefined, undefined],
      [F, undefined, undefined],
    ])
  })

  test('the worked example after its base answered too short to read a slip from: no base kept nor promised, none before it next time (4/5 검토)', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) })
    const w = await opened($, on, store)
    const ui = await quizIn($, w, [plainQ(1, '바탕'), worked(2), plainQ(3)].join('\n'))
    expect(quizItems(store).map(one => [one.name, one.isBase, one.rung])).toEqual([[B, true, undefined], [X, undefined, 'worked'], [D, undefined, undefined]])
    await answer(ui, w, mineKey(store, 0), '함수 안에서만 보여요', RIGHT)
    await answer(ui, w, mineKey(store, 1), '10', AGAIN_WRONG)
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 3 })
    expect(slipsOf(store)[conceptKey(X)]).not.toHaveProperty('base')
    expect(await ui.find({ type: 'Text', text: '같은 곳을 또 헷갈렸습니다 · n: 이 개념을 배운 노트 · 다음 복습 퀴즈는 풀이부터 보여 줍니다' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: new RegExp(WORKED_BASE_NEXT) })).toBeUndefined()
    await ui.unmount()
    await w.clock.advance(60_000)
    w.answer = [worked(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]).toMatchObject({ name: X, rung: 'worked' })
    expect(quizItems(store).some(one => 'isBase' in one)).toBe(false)
  })

  test('"모르겠어요" the second miss running, after a miss of another kind kept a base: no model call and no base, 1.8.0\'s line and quiz (4/5 검토)', async ($, on) => {
    const store = storeOf({ type: 'reference' })
    const w = await opened($, on, store)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    w.answer = atOnce()
    expect((await learn($, '퀴즈 1 전역에 남아요')).text).toContain(`\n헷갈린 점: ${WHAT} · 다음 퀴즈에서 다른 코드로 다시 묻습니다`)
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ type: 'scope', times: 1, base: conceptKey(B) })
    await w.clock.advance(2 * DAY)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]).toMatchObject({ name: X, isRetry: true })
    const calls = w.models.length
    const reply = (await learn($, '퀴즈 1 모르겠어요')).text ?? ''
    expect(w.models).toHaveLength(calls)
    expect(reply).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다')
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ type: 'scope', times: 2 })
    expect(slipsOf(store)[conceptKey(X)]).not.toHaveProperty('base')
    await w.clock.advance(60_000)
    w.answer = [worked(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store)[0]).toMatchObject({ name: X, rung: 'worked' })
    expect(quizItems(store).some(one => 'isBase' in one)).toBe(false)
  })

  test('a team term asked again is graded with no list and keeps no base (계획: 팀 용어 문제이면 안 생김, 4/5 검토)', async ($, on) => {
    const store = storeOf()
    // fetcher: this repository's team term, met after the others and in their file, its slip open since two days ago.
    const concepts = store.get('concepts') as Record<string, unknown>
    concepts[conceptKey('fetcher')] = { name: 'fetcher', count: 2, firstAt: NOW - 20 * DAY, lastAt: NOW - 20 * DAY, blurb: '우리 팀의 API 호출 함수입니다', files: ['counter.js'], step: 0, reviewedAt: NOW - 3 * DAY }
    store.set('teamTerms', { [conceptKey('fetcher')]: [rootTag('/proj')] })
    store.set('slips', { ...slipsOf(store), [conceptKey('fetcher')]: { what: 'fetcher가 오류를 삼킨다고 봄', type: 'scope', question: '지난 문제', mine: '삼켜요', at: NOW - 2 * DAY, times: 1 } })
    // Met in code by a note, with the code branch on (1.10.0 G4 asks bases only there, 5/7 검토): only its being a team
    // term keeps the list off (the question's own team, and the store's mark aftersNow reads).
    metInCode(store, 'fetcher')
    const w = world(on, 'ok', null, true, store)
    w.harness = { workedAfterTimes: 2, isBaseAsked: true }
    w.files.set('/proj/.claude/learn-notes.md', '# 팀\n\n## 용어\n- **fetcher**: 우리 팀의 API 호출 함수입니다\n')
    await start($)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    const at = quizItems(store).findIndex(one => one.name === 'fetcher')
    expect(quizItems(store)[at]).toMatchObject({ team: true, isRetry: true })
    w.answer = atOnce('1')
    await learn($, `퀴즈 ${at + 1} 오류를 삼켜요`)
    const graded = w.models.at(-1)!
    expect(graded).toContain('## 이 학습자가 지난번에 헷갈린 점\nfetcher가 오류를 삼킨다고 봄\n')
    expect(graded).not.toContain('전에 배운 개념')
    expect(graded).not.toContain('바탕')
    expect(quizItems(store)[at]).not.toHaveProperty('slipBase')
    expect(slipsOf(store)[conceptKey('fetcher')]).toMatchObject({ times: 2 })
    expect(slipsOf(store)[conceptKey('fetcher')]).not.toHaveProperty('base')
  })

  test('a first try with its base left waiting when the next quiz is made: settled with its base, which that quiz asks before the worked example (4/5 검토)', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    w.answer = based()
    await learn($, '퀴즈 1 전역에 남아요')
    expect(quizItems(store)[0]).toMatchObject({ firstTry: { slipBase: conceptKey(B) } })
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 1 })
    await w.clock.advance(60_000)
    w.answer = [plainQ(1, '바탕'), worked(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 2, base: conceptKey(B) })
    expect(quizItems(store).map(one => [one.name, one.isBase, one.rung])).toEqual([
      [B, true, undefined],
      [X, undefined, 'worked'],
      [D, undefined, undefined],
    ])
  })

  test('the base question\'s mark read back from the store: after another question is graded on the quiz the store holds, its title and dim line stay (4/5 검토)', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) })
    const w = await opened($, on, store)
    w.answer = [plainQ(1, '바탕'), worked(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    w.answer = RIGHT
    await learn($, '퀴즈 3 답 3')
    expect(quizItems(store)[2]).toMatchObject({ result: 'right' })
    expect(quizItems(store)[0]).toMatchObject({ isBase: true })
    expect((await learn($, '퀴즈')).text).toContain('\n1. (바탕 개념) 바탕 1')
    const ui = await quizPane($)
    expect(await ui.find({ type: 'Text', text: /^문제 1\/3 · 바탕 개념 · 예측$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: BASE_LEAD })).toBeDefined()
    await ui.unmount()
  })

  test('a harness\'s 풀이 보고 풀기 after three misses running: the base promised and asked at the third, /learn 진단 counting by the same step (4/5 검토)', async ($, on) => {
    const store = storeOf({ times: 2 })
    const w = await opened($, on, store, { isBaseAsked: true, workedAfterTimes: 3, workedPlainAfterTimes: 3 })
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isRetry, one.rung])).toEqual([[X, true, undefined], [D, undefined, undefined], [F, undefined, undefined]])
    w.answer = atOnce()
    expect((await learn($, '퀴즈 1 전역에 남아요')).text).toContain(`\n같은 곳을 또 헷갈렸습니다 · ${WORKED_BASE_NEXT}`)
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 3, base: conceptKey(B) })
    const ui = await quizPane($)
    expect(await ui.find({ type: 'Text', text: `같은 곳을 또 헷갈렸습니다 · n: 이 개념을 배운 노트 · ${WORKED_BASE_NEXT}` })).toBeDefined()
    await ui.unmount()
    expect((await learn($, '진단')).text).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 1\n')
    await w.clock.advance(60_000)
    w.answer = [plainQ(1, '바탕'), worked(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isBase, one.rung])).toEqual([
      [B, true, undefined],
      [X, undefined, 'worked'],
      [D, undefined, undefined],
    ])
  })
})

describe('1.9.0: 생각해 보기 behind its switch: a guess checked by a call of its own, a question answered as before (F6)', () => {
  const MIN = 60_000
  const THOUGHT = '`b`를 3으로 바꾸면 마지막에 `b`는 얼마일까요?'
  const TRACED = ['1. `const a = 1`: `a`는 1입니다.', '2. `const b = 2`: `b`는 2입니다.', '', `**생각해 보기:** ${THOUGHT}`].join('\n')
  const HINT = 'i(영문 상태): 질문 칸에 답 적기 · 넘어가도 됩니다'
  const OPEN = '답이나 궁금한 점 적고 Enter'
  const SHUT = '궁금한 것을 적고 Enter'
  const SECTION = "## 바로 앞 '예시로 따라가기'의 답과, 그 끝에 학습자에게 던진 생각해 보기"
  const GUESSED = '## 학습자의 짐작'
  /** What the check is answered with: its three lines. */
  const checked = (verdict: string, feedback = '`b`에 3을 넣으면 마지막 줄도 3을 읽습니다.', result = '3') => `바른 결과: ${result}\n판정: ${verdict}\n피드백: ${feedback}`
  type Ui = Awaited<ReturnType<typeof pane>>
  const hintsOf = async (ui: Pick<Ui, 'findAll'>) => (await ui.findAll({ type: 'Text' })).filter(one => one.text === HINT).map(one => one.text)
  const fieldOf = async (ui: Pick<Ui, 'find'>) => (await ui.find({ type: 'Input' }))!
  const asksOf = (store: Map<string, unknown>) => (store.get('history') as Record<string, { notes: { asks?: Record<string, unknown>[] }[] }>)['/proj']!.notes[0]!.asks ?? []

  /**
   * A written note, nothing asked under it yet, the build's 생각해 보기 as `harness` sets it. Its change has a run to
   * follow (EDIT_FLOW): since 1.10.0 G5 the only kind r asks the line of, and keeps it under, while it is on.
   */
  async function noted($: Engine, on: On, harness: Record<string, unknown> | null = { isThinkAsked: true }, store = new Map<string, unknown>()) {
    const w = world(on, 'ok', null, true, store)
    if (harness) w.harness = harness
    await start($)
    await turn($, () => $.tool.call(EDIT_FLOW), 't1', 'b를 상수로 바꿔줘')
    await finish(w)
    return w
  }
  /** r pressed under it, the walk-through `answer`. */
  async function trace(ui: Pick<Ui, 'press'>, w: World, answer = TRACED) {
    w.answer = answer
    await ui.press({ key: 'trace' })
    await w.clock.settle()
  }
  /** Words typed in the note's field, answered with `reply`. */
  async function typed(ui: Ui, w: World, text: string, reply: string) {
    w.answer = reply
    await ui.input({ key: String((await fieldOf(ui)).props.key), text })
    await w.clock.settle()
  }

  test('on, in the terminal with the keys in the pane: r asks for the line; a guess goes to a check of its own (THINK_SYSTEM, 900 since 1.10.0 G5), headed 맞혔습니다, the line gone, nothing graded', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = await noted($, on, { isThinkAsked: true }, store)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    const index = JSON.stringify(store.get('concepts'))
    await trace(ui, w)
    // r's own call: its walk-through and, now, the line it ends on (1.10.0 G5's words).
    expect(w.models.at(-1)).toContain(`화면이나 동작에서 어떻게 보이는지 설명해 주세요. ${THINK_ASK}\n\n`)
    expect(w.systems.at(-1)).toBe(ASK_SYSTEM)
    expect(w.budgets.at(-1)).toBe(900)
    expect(await hintsOf(ui)).toEqual([HINT])
    expect((await fieldOf(ui)).props.placeholder).toBe(OPEN)
    const calls = w.models.length
    await w.clock.advance(5 * MIN)
    await typed(ui, w, '3이요', checked('맞음'))
    expect(w.models).toHaveLength(calls + 1)
    expect(w.systems.at(-1)).toBe(THINK_SYSTEM)
    expect(w.budgets.at(-1)).toBe(900)
    const prompt = w.models.at(-1)!
    expect(prompt).toContain(`## 생각해 보기 물음\n${THOUGHT}\n\n## 그 물음이 붙은 '예시로 따라가기'\n${TRACED}\n\n${GUESSED}\n3이요\n`)
    expect(prompt).not.toContain('## 학습자의 질문')
    expect(prompt).not.toContain(SECTION)
    expect(await ui.find({ type: 'Text', text: '이어서 · 3이요' })).toBeDefined()
    const shown = '**맞혔습니다.** `b`에 3을 넣으면 마지막 줄도 3을 읽습니다.'
    expect(await ui.find({ type: 'Markdown', text: shown })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([])
    expect((await fieldOf(ui)).props).toMatchObject({ placeholder: SHUT, value: '' })
    const journal = w.files.get(JOURNAL) ?? ''
    expect(journal).toContain(`**물음** (생각해 보기 뒤): 3이요\n`)
    expect(journal).toContain(shown)
    await ui.unmount()
    // Kept as 1.8.0 keeps a question: the same three fields, nothing graded or stepped, no new store key.
    for (const one of asksOf(store)) expect(Object.keys(one).sort()).toEqual(['answer', 'at', 'question'])
    expect(asksOf(store).map(one => [one.question, one.answer])).toEqual([['예시로 따라가기', TRACED], ['3이요', shown]])
    expect(store.get('slips')).toBeUndefined()
    const day = (store.get('activity') as Record<string, Record<string, number>> | undefined)?.['2026-10-03'] ?? {}
    expect([day.right ?? 0, day.wrong ?? 0, day.drills ?? 0]).toEqual([0, 0, 0])
    expect(JSON.stringify(store.get('concepts'))).toBe(index)
  })

  test('on: wrong and nearly under their heads with the right result; 모르겠어요 with no verdict; 판정: 질문 its answer alone; a reply out of form as it came; a failed check leaves all as it was', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = await noted($, on, { isThinkAsked: true }, store)
    const ui = await pane($)
    const last = () => String(asksOf(store).at(-1)!.answer)
    await trace(ui, w)
    await typed(ui, w, '2요', checked('틀림', '마지막 줄은 바뀐 `b`를 읽습니다.'))
    expect(last()).toBe('**아쉽지만 틀렸습니다.** 마지막 줄은 바뀐 `b`를 읽습니다.\n\n바른 결과: 3')
    await trace(ui, w)
    await typed(ui, w, '3 근처요', checked('거의', '값이 정확히 3입니다.'))
    expect(last()).toBe('**거의 맞았습니다.** 값이 정확히 3입니다.\n\n바른 결과: 3')
    await trace(ui, w)
    await typed(ui, w, '모르겠어요', checked('틀림', '`b`에 넣은 3을 마지막 줄이 그대로 읽습니다.'))
    expect(w.systems.at(-1)).toBe(THINK_SYSTEM)
    expect(w.models.at(-1)).toContain(`${GUESSED}\n(모르겠다고 했다)\n`)
    expect(last()).toBe('바른 결과: 3\n\n`b`에 넣은 3을 마지막 줄이 그대로 읽습니다.')
    expect(last()).not.toContain('틀렸습니다')
    // A verdict alone, nothing to show under it (5/5 검토): the reply as it came, never an empty answer.
    await trace(ui, w)
    await typed(ui, w, '모르겠어요', '판정: 틀림\n피드백:')
    expect(last()).toBe('판정: 틀림\n피드백:')
    await trace(ui, w)
    await typed(ui, w, '상수로 바꿔도 돼요', checked('질문', '`const`로 바꿔도 다시 대입하지 않으면 됩니다.', '해당 없음'))
    expect(last()).toBe('`const`로 바꿔도 다시 대입하지 않으면 됩니다.')
    await trace(ui, w)
    await typed(ui, w, '3이요', 'b는 3입니다.')
    expect(last()).toBe('b는 3입니다.')
    expect(await ui.find({ type: 'Text', text: '이어서 · 3이요' })).toBeDefined()
    // A check that did not come back: the words, the line and the placeholder stay.
    await trace(ui, w)
    const asked = asksOf(store).length
    w.model = 'error'
    await typed(ui, w, '3이요', checked('맞음'))
    expect(w.systems.at(-1)).toBe(THINK_SYSTEM)
    expect(await ui.find({ type: 'Text', text: /답하지 못했습니다: 서버가 붐빕니다/ })).toBeDefined()
    expect((await fieldOf(ui)).props).toMatchObject({ value: '3이요', placeholder: OPEN })
    expect(await hintsOf(ui)).toEqual([HINT])
    expect(asksOf(store)).toHaveLength(asked)
    await ui.unmount()
  })

  test('on: a question goes as a question (ASK_SYSTEM, 900), its rule saying the learner ran nothing, no head; the mobile app\'s /learn 질문 with a guess is checked, its head 1.8.0\'s', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = await noted($, on, { isThinkAsked: true }, store)
    const ui = await pane($)
    // A bare value with a question mark ('3 나오나요?', a question here in 1.9.0) is a guess since 1.10.0 G5: checked.
    await trace(ui, w)
    await typed(ui, w, '3 나오나요?', checked('맞음'))
    expect(w.systems.at(-1)).toBe(THINK_SYSTEM)
    expect(asksOf(store).at(-1)!.answer).toBe('**맞혔습니다.** `b`에 3을 넣으면 마지막 줄도 3을 읽습니다.')
    for (const question of ['꼭 3이어야 해요?', '뭐가 달라요']) {
      await trace(ui, w)
      await typed(ui, w, question, '네, 3이 나옵니다.')
      expect(w.systems.at(-1)).toBe(ASK_SYSTEM)
      expect(w.budgets.at(-1)).toBe(900)
      const prompt = w.models.at(-1)!
      expect(prompt).toContain(`## 학습자의 질문\n${question}\n\n${SECTION}\n${TRACED}\n\n생각해 보기: ${THOUGHT}\n학습자의 질문 칸 글은 이 생각해 보기 뒤에 적은 질문이다. 학습자는 이 코드를 실행하지 않았다.`)
      expect(prompt).not.toContain('답일 수도, 새 질문일 수도')
      expect(prompt).not.toContain(GUESSED)
      expect(asksOf(store).at(-1)!.answer).toBe('네, 3이 나옵니다.')
      expect(await ui.find({ type: 'Text', text: `이어서 · ${question}` })).toBeDefined()
    }
    // A bare question word with its ending on it is a question too (5/5 검토), and a question's answer is never read as
    // a check's: one that happens to say 판정: 맞음 stays as it came, with no head.
    await trace(ui, w)
    await typed(ui, w, '왜요', checked('맞음'))
    expect(w.systems.at(-1)).toBe(ASK_SYSTEM)
    expect(w.budgets.at(-1)).toBe(900)
    expect(asksOf(store).at(-1)!.answer).toBe(checked('맞음'))
    expect(await ui.find({ type: 'Markdown', text: checked('맞음') })).toBeDefined()
    await trace(ui, w)
    await ui.unmount()
    const phone = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    await phone.unmount()
    w.answer = checked('맞음')
    const told = (await learn($, '질문 3이요')).text ?? ''
    expect(w.systems.at(-1)).toBe(THINK_SYSTEM)
    expect(told).toBe('01:00 노트 (b를 상수로 바꿔줘)에 대한 답 · 일지에 남김 · 패널의 노트 아래에도 남습니다\n\n**맞혔습니다.** `b`에 3을 넣으면 마지막 줄도 3을 읽습니다.')
    expect(w.files.get(JOURNAL)).toContain('**물음** (생각해 보기 뒤): 3이요')
  })

  test('off (a harness, as the constant may ship): r\'s prompt 1.7.0\'s, and a guess goes as 1.8.0 sends it, THINK_RULE and 900, no check', async ($, on) => {
    const w = await noted($, on, { isThinkAsked: false })
    const ui = await pane($)
    await trace(ui, w)
    expect(w.models.at(-1)).toContain('화면이나 동작에서 어떻게 보이는지 설명해 주세요.\n\n')
    expect(w.models.at(-1)).not.toContain('생각해 보기')
    // A reply that ends on a question by itself still opens it (flow above, 1.8.0): answered as 1.8.0 answers.
    expect(await hintsOf(ui)).toEqual([HINT])
    await typed(ui, w, '2000이요', '맞습니다.')
    expect(w.systems.at(-1)).toBe(ASK_SYSTEM)
    expect(w.budgets.at(-1)).toBe(900)
    const prompt = w.models.at(-1)!
    expect(prompt).toContain(`${SECTION}\n${TRACED}\n\n생각해 보기: ${THOUGHT}\n학습자의 질문 칸 글은 이 물음에 대한 답일 수도, 새 질문일 수도 있다.`)
    expect(prompt).not.toContain(GUESSED)
    expect(prompt).not.toContain('실행하지 않았다')
    expect(w.systems).not.toContain(THINK_SYSTEM)
    expect(await ui.find({ type: 'Markdown', text: '맞습니다.' })).toBeDefined()
    await ui.unmount()
  })

  test('on: half an hour and a millisecond on, a guess is a question again; a walk-through ending on no `?` opens nothing; e closes it and r again opens the new one', async ($, on) => {
    const w = await noted($, on)
    const ui = await pane($)
    await trace(ui, w)
    await w.clock.advance(30 * MIN + 1)
    await w.clock.settle()
    await typed(ui, w, '3이요', '네.')
    expect(await ui.find({ type: 'Text', text: '질문 · 3이요' })).toBeDefined()
    expect(w.systems.at(-1)).toBe(ASK_SYSTEM)
    expect(w.models.at(-1)).not.toContain(SECTION)
    // `…따져 보세요.`: out of the closed form since 1.10.0 G5, so not kept (thinkKept), nothing under it, a guess
    // typed after it a plain question.
    const told = '1. a는 1입니다.\n\n**생각해 보기:** `b`를 3으로 바꿔 결과를 따져 보세요.'
    await trace(ui, w, told)
    expect(await ui.find({ type: 'Markdown', text: '1. a는 1입니다.' })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([])
    expect((await fieldOf(ui)).props.placeholder).toBe(SHUT)
    await typed(ui, w, '3이요', '네.')
    expect(w.models.at(-1)).not.toContain(SECTION)
    expect(w.systems.at(-1)).toBe(ASK_SYSTEM)
    expect(w.files.get(JOURNAL)).not.toContain('(생각해 보기 뒤)')
    // r, then e: closed; r again: its new question is the one a guess is checked against.
    await trace(ui, w)
    w.answer = '쉽게 말하면 상자에 이름표를 붙입니다.'
    await ui.press({ key: 'easier' })
    await w.clock.settle()
    expect(await hintsOf(ui)).toEqual([])
    const next = '`a`를 5로 바꾸면 `a`는 얼마일까요?'
    await trace(ui, w, `1. a는 1입니다.\n\n**생각해 보기:** ${next}`)
    await typed(ui, w, '5요', checked('맞음', '`a`는 5입니다.', '5'))
    expect(w.systems.at(-1)).toBe(THINK_SYSTEM)
    expect(w.models.at(-1)).toContain(`## 생각해 보기 물음\n${next}\n`)
    expect(w.models.at(-1)).not.toContain(THOUGHT)
    expect(await ui.find({ type: 'Text', text: '이어서 · 5요' })).toBeDefined()
    await ui.unmount()
  })

  test('the help names r\'s 생각해 보기 as the build runs; /learn 진단 names the harness\'s switch', async ($, on) => {
    const helpOf = async () => ((await learn($, '도움말')).text ?? '').split('\n').find(line => line.startsWith('- 노트 아래: '))!
    const w = world(on, 'ok', null, true, new Map())
    for (const isOn of [true, false]) {
      w.harness = { isThinkAsked: isOn }
      await start($)
      expect(await helpOf()).toBe(`- 노트 아래: \`t\` 직접 해 보기(한 번 고친 뒤 \`a\` 예시 답) · \`e\` 더 쉽게 · \`r\` 예시로 따라가기${isOn ? '(끝의 생각해 보기는 `i`로 답하기)' : ''} · \`i\` 질문하기 · \`c\` 복사`)
      const version = ((await learn($, '진단')).text ?? '').split('\n').find(line => line.startsWith('- 버전: '))!
      if (isOn === IS_THINK_ASKED) expect(version).not.toContain('생각해 보기')
      else expect(version).toContain(`시험 스위치: 생각해 보기 ${isOn ? '켬' : '끔'}`)
    }
  })

  test('on: a store 1.8.0, 1.7.0 or 1.6 wrote loads its asks as they are, a walk-through kept young open to a guess', async ($, on) => {
    // A store with a walk-through kept young, one note before it with a question and its answer (1.7.0, 1.8.0), one with none (1.6).
    const note = (id: string, at: number, asks?: { question: string; answer: string; at: number }[]) => ({
      id,
      turnId: id,
      at,
      prompt: `요청 ${id}`,
      answer: '',
      changes: [{ file: 'src/a.ts', path: '/proj/src/a.ts', tool: 'Edit', kind: 'update', added: 1, removed: 1, diff: '@@ -1,1 +1,1 @@\n-a\n+b', isCut: false }],
      moreFiles: 0,
      status: 'ready',
      text: NOTE_TEXT,
      savedAs: 'ready',
      ...(asks ? { asks } : {}),
    })
    const kept = [{ question: '왜 const야?', answer: '다시 대입하지 않아서입니다.', at: NOW - 15 * MIN }, { question: '예시로 따라가기', answer: TRACED, at: NOW - 10 * MIN }]
    const store = new Map<string, unknown>([['history', { '/proj': { at: NOW, notes: [note('old', NOW - 86_400_000), note('kept', NOW - 20 * MIN, kept)] } }]])
    const v = world(on, 'ok', null, true, store)
    v.harness = { isThinkAsked: true }
    await start($)
    const ui = await pane($)
    expect(await ui.find({ type: 'Markdown', text: TRACED })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([HINT])
    await typed(ui, v, '3이요', checked('맞음'))
    expect(v.systems.at(-1)).toBe(THINK_SYSTEM)
    const keptAsks = (store.get('history') as Record<string, { notes: { id: string; asks?: unknown[] }[] }>)['/proj']!.notes.find(one => one.id === 'kept')!.asks!
    expect(keptAsks.slice(0, 2)).toEqual(kept)
    expect(keptAsks).toHaveLength(3)
    await ui.press({ key: 'prev' })
    expect(await hintsOf(ui)).toEqual([])
    expect((await fieldOf(ui)).props.placeholder).toBe(SHUT)
    await ui.unmount()
  })
})

describe('1.9.0: the note and quiz calls\' output caps, raised by their sample (docs/qa/견본.md, 출력 상한)', () => {
  const DAY = 86_400_000
  const BUSY: Reply = { status: 529, error: 'overloaded' }
  /**
   * The budgets the plugin asks for (register.tsx NOTE_TOKENS, QUIZ_TOKENS, QUIZ_TRACE_TOKENS), the engine's 2048 for
   * thinking aside. 1.10.0 (G2, D12): one budget, 4600, for every quiz with code changed, code never seen or a worked
   * example in it, where 1.9.0 asked 3600 for the last two; every switch off, every quiz asks 3400 as in 1.9.0.
   */
  const NOTE = 3500
  const QUIZ = 3400
  const QUIZ_TRACE = 4600
  /** Two concepts met in no note and not due for weeks: they fill a quiz to the three picks its rungs are asked in (1.10.0 G2, D33). */
  const FILLERS = { '채움 하나': 3, '채움 둘': 3 }
  const TEAM_PATH = '/proj/.claude/learn-notes.md'
  const TERMS = ['## 용어', '- **캐시 키**: 요청마다 캐시를 나누는 이름입니다', '- **페이지네이션 커서**: 다음 쪽을 가리키는 값입니다', ''].join('\n')
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const plainQ = (n: number) => [`T${n}: 예측`, `Q${n}: 문제 ${n}`, `A${n}: 답 ${n}`].join('\n')
  const worked = (n: number) =>
    [`T${n}: 예측`, `Q${n}: 풀이: \`let n = 0; const up = () => ++n; up()\` 뒤 n은 1입니다.`, '이제 풀어 보세요: `let c = 10; const add = () => ++c; add()` 뒤 c는?', `H${n}: 바깥 c`, `A${n}: 11`].join('\n')
  const fresh = (n: number) =>
    [`T${n}: 예측`, `Q${n}: 아래 코드는 무엇을 찍을까요?`, '```ts', 'const xs = [3, 4]', 'let s = 0', 'for (const x of xs) s += x', 'console.log(s)', '```', `H${n}: 하나씩 더해 보세요`, `R${n}: s는 3, 다시 7이 됩니다`, `A${n}: 7`].join('\n')
  /** Each model call's budget with the system prompt it went with, in order. */
  const callsOf = (w: World) => w.budgets.map((budget, i) => ({ budget, system: w.systems[i] }))
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
  /** Concepts by name at their steps, each met 30 days ago and gone over `ago` days ago, with their step copies, and `slips`. */
  const storeOf = (steps: Record<string, number>, ago: number, slips: Record<string, unknown> = {}) => {
    const concepts = Object.fromEntries(
      Object.entries(steps).map(([name, step]) => [
        conceptKey(name),
        { name, count: 2, firstAt: NOW - 30 * DAY, lastAt: NOW - 30 * DAY, blurb: `${name} 설명`, files: [], step, reviewedAt: NOW - ago * DAY },
      ]),
    )
    return new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)], ['slips', slips]])
  }

  test('every call that sends a note\'s prompt asks for 3500: a turn\'s end, its one try again, w, and a reload\'s take-up', async ($, on) => {
    const w = world(on)
    await start($)
    // A turn's end with the server busy, then its try again half a minute on.
    w.replies = [BUSY, 'ok']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    await w.clock.advance(35_000)
    expect(w.models).toHaveLength(2)
    expect(w.models[1]).toBe(w.models[0])
    // w: the note written again.
    const ui = await pane($)
    await ui.press({ key: 'write' })
    await w.clock.settle()
    await ui.unmount()
    // Another turn's note cut short as a reload cuts it, taken up by the next load.
    w.replies = ['cut']
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    await start($)
    await w.clock.advance(5)
    expect(w.models).toHaveLength(5)
    expect(w.models[4]).toBe(w.models[3])
    expect(callsOf(w)).toEqual(Array.from({ length: 5 }, () => ({ budget: NOTE, system: SYSTEM })))
  })

  test('a quiz asks for 3400, in the pane, in the conversation and of the team\'s terms; its grade 480, r and e 900, a recap 1200, as before', async ($, on) => {
    const w = world(on)
    w.files.set(TEAM_PATH, TERMS)
    await start($)
    w.answer = CONCEPT_NOTE(['클로저'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    // r and e under the note.
    w.answer = '1. `const a = 1`: `a`는 1입니다.'
    await ui.press({ key: 'trace' })
    await w.clock.settle()
    w.answer = '`const`는 한 번 정한 값을 다시 바꾸지 못하게 합니다.'
    await ui.press({ key: 'easier' })
    await w.clock.settle()
    // The pane's quiz, then its grade.
    w.answer = plainQ(1)
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(quizItems(w.store)).toHaveLength(1)
    w.answer = RIGHT
    await ui.input({ key: mineKey(w.store, 0), text: '답 1' })
    await w.clock.settle()
    expect(quizItems(w.store)[0]).toMatchObject({ result: 'right' })
    await ui.unmount()
    // In the conversation: a new quiz, a team quiz, a recap.
    w.answer = plainQ(1)
    await learn($, '퀴즈 새로')
    w.answer = [plainQ(1), plainQ(2)].join('\n')
    await learn($, '퀴즈 팀')
    expect(quizItems(w.store).map(one => one.name).sort()).toEqual(['캐시 키', '페이지네이션 커서'])
    w.answer = '### 한 일\n반복문을 바꿨다'
    expect((await learn($, '정리')).text).toContain('오늘 정리')
    expect(callsOf(w)).toEqual([
      { budget: NOTE, system: SYSTEM },
      { budget: 900, system: ASK_SYSTEM },
      { budget: 900, system: ASK_SYSTEM },
      { budget: QUIZ, system: QUIZ_SYSTEM },
      { budget: 480, system: CHECK_SYSTEM },
      { budget: QUIZ, system: QUIZ_SYSTEM },
      { budget: QUIZ, system: QUIZ_SYSTEM },
      { budget: 1200, system: RECAP_SYSTEM },
    ])
  })

  test('a quiz with a worked example in it (on by a harness) asks for 4600; its grade 480 as before', async ($, on) => {
    // A worked example: 클로저 missed twice running where it was asked again.
    const slip = { what: '함수가 끝나면 바깥 변수도 사라진다고 봄', type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 2 }
    // Met in no code: the plain branch on too (1.10.0 G1), and a second concept so the quiz is of two (D33 (3)).
    const store = withFiller(storeOf({ 클로저: 1 }, 3, { [conceptKey('클로저')]: slip }))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = worked(1)
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => one.rung)).toEqual(['worked'])
    expect(callsOf(w)).toEqual([{ budget: QUIZ_TRACE, system: QUIZ_SYSTEM }])
    // Its grade: 480 as before.
    w.answer = RIGHT
    await learn($, '퀴즈 1 11')
    expect(callsOf(w).at(-1)).toEqual({ budget: 480, system: CHECK_SYSTEM })
  })

  test('(1.10.0 G4) a grade that lists the concepts learned before for a base (on by a harness) asks for 880; the grade of a question not asked again 480 as before', async ($, on) => {
    // 클로저 met in counter.js by a note (the code branch), its slip kept once two days ago; 변수 범위 met before it there.
    const slip = { what: '함수가 끝나면 바깥 변수도 사라진다고 봄', type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 1 }
    const store = storeOf({ 클로저: 1, '변수 범위': 3 }, 3, { [conceptKey('클로저')]: slip })
    Object.assign((store.get('concepts') as Record<string, Record<string, unknown>>)[conceptKey('변수 범위')]!, { firstAt: NOW - 60 * DAY, files: ['counter.js'] })
    metInCode(store, '클로저')
    const w = world(on, 'ok', null, true, store)
    w.harness = { workedAfterTimes: 2, isBaseAsked: true }
    await start($)
    w.answer = [plainQ(1), plainQ(2)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isRetry])).toEqual([['클로저', true], ['변수 범위', undefined]])
    w.answer = ['판정: 틀림', '피드백: 아닙니다.', '헷갈린 점: 함수가 끝나면 바깥 변수도 사라진다고 봄', '바탕 점검: 1 틀림', '바탕 근거: 없음', '바탕: 0', '유형: 변수 범위'].join('\n')
    await learn($, '퀴즈 1 전역에 남아요')
    expect(w.models.at(-1)).toContain('## 학습자가 전에 배운 개념\n1. 변수 범위\n')
    expect(callsOf(w).at(-1)).toEqual({ budget: 880, system: CHECK_SYSTEM })
    w.answer = RIGHT
    await learn($, '퀴즈 2 답 2')
    expect(callsOf(w).at(-1)).toEqual({ budget: 480, system: CHECK_SYSTEM })
  })

  for (const isOn of [true, false]) {
    test(`code never seen ${isOn ? 'on (a harness\'s step 4): 4600' : 'off: the same concept asked in its own code, 3400'}`, async ($, on) => {
      const store = storeOf({ 'for...of 반복문': 4 }, 31)
      // Filled to three picks, the quiz its rung is asked in (1.10.0 G2, D33); their days set so they are not due.
      for (const [name, step] of Object.entries(FILLERS)) (store.get('concepts') as Record<string, unknown>)[conceptKey(name)] = { name, count: 1, firstAt: NOW - 30 * DAY, lastAt: NOW - 30 * DAY, blurb: `${name} 설명`, files: [], step, reviewedAt: NOW }
      store.set('steps', ownSteps(store.get('concepts') as never))
      const w = world(on, 'ok', null, true, store)
      w.harness = { rungNewStep: isOn ? 4 : null, rungChangedStep: null }
      await start($)
      w.answer = CONCEPT_NOTE(['for...of 반복문'])
      await turn($, () => $.tool.call(EDIT_A))
      await finish(w)
      w.answer = isOn ? fresh(1) : plainQ(1)
      await learn($, '퀴즈 새로')
      expect(quizItems(store).map(one => one.rung)).toEqual([isOn ? 'new' : 'mine'])
      expect(callsOf(w)).toEqual([{ budget: NOTE, system: SYSTEM }, { budget: isOn ? QUIZ_TRACE : QUIZ, system: QUIZ_SYSTEM }])
    })
  }

  for (const step of [2, null] as const) {
    test(`(1.10.0 G2) code changed ${step === 2 ? 'on (a harness\'s step 2): 4600' : 'off (a harness\'s null): the same concept in its own code, 3400'}; a quiz with neither, 3400`, async ($, on) => {
      const store = storeOf({ 'for...of 반복문': 2, ...FILLERS }, 8)
      for (const name of Object.keys(FILLERS)) Object.assign((store.get('concepts') as Record<string, Record<string, unknown>>)[conceptKey(name)]!, { reviewedAt: NOW })
      store.set('steps', ownSteps(store.get('concepts') as never))
      const w = world(on, 'ok', null, true, store)
      w.harness = { rungNewStep: null, rungChangedStep: step }
      await start($)
      w.answer = CONCEPT_NOTE(['for...of 반복문'])
      await turn($, () => $.tool.call(EDIT_A))
      await finish(w)
      w.answer = ['T1: 예측', 'Q1: 아래 코드의 b는?', '```ts', 'const a = 5', 'const b = a * 2', 'console.log(b)', '```', 'H1: a부터', 'R1: a는 5, b는 10', 'A1: 10'].join('\n')
      await learn($, '퀴즈 새로')
      expect(quizItems(store).map(one => one.rung)).toEqual([step === 2 ? 'changed' : 'mine'])
      expect(callsOf(w)).toEqual([{ budget: NOTE, system: SYSTEM }, { budget: step === 2 ? QUIZ_TRACE : QUIZ, system: QUIZ_SYSTEM }])
      // The trace is dropped with code changed on; with it off, the R line is the hint's as in 1.9.0.
      expect(quizItems(store)[0]!.hint).toBe(step === 2 ? 'a부터' : 'a부터\nR1: a는 5, b는 10')
    })
  }
})
