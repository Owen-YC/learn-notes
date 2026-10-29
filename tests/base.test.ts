import type { LearnConcept, LearnQuizItem, LearnSlip } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  BASE_AUDIT_RETRY,
  BASE_CANDIDATES,
  BASE_LABEL,
  BASE_LEAD,
  IS_BASE_ASKED,
  SLIP_AGAIN,
  WORKED_AFTER_TIMES,
  WORKED_BASE_NEXT,
  WORKED_NEXT,
  auditedBase,
  baseAfterFor,
  baseAuditOf,
  baseCandidates,
  baseFor,
  baseOf,
  checkPrompt,
  isBaseKept,
  isBaseKey,
  isWorkedNext,
  ladderMixed,
  nextSlip,
  parseCheck,
  parseQuiz,
  quizPrompt,
  slipChange,
  slipCounts,
  slipFrom,
  slipNotice,
  slipRecordOf,
  withBase,
  workedAfterFor,
  workedNextText,
  type QuizPick,
} from '../hooks/notes'
import { INPUT_18, OUTPUT_18 } from './fixtures/prompts18'

const NOW = Date.UTC(2026, 9, 3, 1)
const DAY = 86_400_000

/** A concept first met `daysAgo` days before NOW, in `files`. */
const concept = (name: string, daysAgo: number, more: Partial<LearnConcept> = {}): LearnConcept => ({
  name,
  count: 1,
  firstAt: NOW - daysAgo * DAY,
  lastAt: NOW - daysAgo * DAY,
  blurb: `${name} 설명`,
  files: [],
  ...more,
})
const k = (name: string) => `c:${name.toLowerCase().replace(/[\s()（）"'`.…\-–—_·]+/g, '')}`

/** 1.10.0 G4's sentence and format lines as its design wrote them (plan110 G4 how 1 · 2), to the byte. */
const G4_CHECK =
  '바탕 점검 · 바탕 근거 · 바탕은 판정이 거의나 틀림일 때만 쓴다. 바탕 점검에는 위 목록의 번호마다 틀림 · 바름 · 없음 중 하나를 쓴다. 틀림은 이번 답의 잘못된 생각을, 이번 문제의 개념은 쓰지 않고 그 개념만 쓰는 짧은 코드에 옮겨도 틀린 답이 나올 때다. 헷갈림이 이번 문제의 개념이 하는 일에 대한 것이면, 목록의 개념 이름이나 유형의 갈래와 닮았어도 틀림이 아니다. 틀림이 아니고 답이 그 개념을 바르게 말하거나 바르게 썼으면 바름, 답에 그 개념이 드러나지 않으면 없음이다. 바탕에는 점검에서 틀림인 번호 하나를 쓰고, 바탕 근거에는 그 개념만 쓰는 짧은 코드 하나와 답의 생각대로면 나올 결과 → 실제 결과를 쓴다. 틀림인 번호가 없으면 바탕 근거는 없음, 바탕은 0이라고 쓴다.'
const G4_FORMAT = [
  '바탕 점검: (위 번호마다 번호 다음에 틀림·바름·없음 중 하나를 써서 쉼표로 잇는다)',
  '바탕 근거: (점검에서 틀림인 개념만 쓰는 짧은 코드 하나와, 답의 생각대로면 나올 결과 → 실제 결과. 없으면 없음)',
  '바탕: (점검에서 틀림인 번호 하나, 없으면 0)',
]

/** What 1.8.0 (3690021) kept of a slip it read back, word for word: no base (a 1.8 window writes the slips back so). */
function slipRecordOf18(raw: unknown): LearnSlip | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const r = raw as Record<string, unknown>
  if (typeof r.what !== 'string' || typeof r.type !== 'string' || typeof r.at !== 'number' || !Number.isFinite(r.at)) return undefined
  return {
    what: r.what,
    type: r.type as LearnSlip['type'],
    question: typeof r.question === 'string' ? r.question : '',
    mine: typeof r.mine === 'string' ? r.mine : '',
    at: r.at,
    times: typeof r.times === 'number' && Number.isFinite(r.times) && r.times >= 1 ? Math.floor(r.times) : 1,
    ...(typeof r.fixedAt === 'number' && Number.isFinite(r.fixedAt) ? { fixedAt: r.fixedAt } : {}),
    ...(r.isRight === true ? { isRight: true as const } : {}),
  }
}

describe('1.9.0: a base concept picked when a question asked again is graded (F5, pure parts)', () => {
  test('the switch and its words: off unless its sample passed, the title\'s place, the dim line and the line after a second miss', () => {
    expect([false, true]).toContain(IS_BASE_ASKED)
    // 8 in the plan, 5 since its first sample's mend (docs/qa/견본.md).
    expect(BASE_CANDIDATES).toBe(5)
    expect(BASE_LABEL).toBe('바탕 개념')
    expect(BASE_LEAD).toBe('다음 문제의 바탕이 되는 개념을 먼저 확인합니다')
    expect(WORKED_BASE_NEXT).toBe('다음 복습 퀴즈는 바탕 개념과 풀이부터 보여 줍니다')
    // No concept's name in either (the concept map 1.7 dropped).
    expect(workedNextText({ base: 'c:변수범위', times: 2 }, true, 2)).toBe(WORKED_BASE_NEXT)
    expect(workedNextText({ times: 2 }, true, 2)).toBe(WORKED_NEXT)
    expect(workedNextText(undefined, true, 2)).toBe(WORKED_NEXT)
    expect(workedNextText({ base: 'c:변수범위', times: 2 }, false, 2)).toBe(WORKED_NEXT)
    // Only the miss that makes it a worked example `workedAfter` times running, the one baseFor asks a base before: a
    // third miss (after one set right on its try again) is asked as a worked example with no base, and said so (4/5 검토).
    expect(workedNextText({ base: 'c:변수범위', times: 3 }, true, 2)).toBe(WORKED_NEXT)
    expect(workedNextText({ base: 'c:변수범위', times: 1 }, true, 2)).toBe(WORKED_NEXT)
    expect(workedNextText({ base: 'c:변수범위', times: 2 }, true, Infinity)).toBe(WORKED_NEXT)
  })

  test('baseCandidates: met before it, not known, not itself, no team term, near it (a file shared, or named in its words); most files shared first, 5 at most', () => {
    const index: Record<string, LearnConcept> = {
      [k('클로저')]: concept('클로저', 5, { files: ['a.js', 'b.js'], count: 2, blurb: '`for 반복` 안에서 만든 함수가 바깥 값을 기억합니다' }),
      [k('변수 범위')]: concept('변수 범위', 9, { files: ['a.js'], count: 3 }),
      [k('화살표 함수')]: concept('화살표 함수', 8, { files: ['b.js', 'a.js'], count: 1 }),
      [k('let과 const')]: concept('let과 const', 20, { files: ['c.js'], count: 5 }),
      [k('for 반복')]: concept('for 반복', 30, { files: [], count: 5, lastAt: NOW - DAY }),
      [k('아는 개념')]: concept('아는 개념', 40, { files: ['a.js', 'b.js'], count: 9, knownAt: NOW - DAY }),
      [k('나중 개념')]: concept('나중 개념', 1, { files: ['a.js', 'b.js'], count: 9 }),
      [k('같은 날')]: concept('같은 날', 5, { files: ['a.js', 'b.js'], count: 9 }),
      [k('주문서')]: concept('주문서', 30, { files: ['a.js', 'b.js'], count: 9 }),
    }
    const marks = { [k('주문서')]: ['abc123def456'] }
    // let과 const shares no file and is not named: not near it.
    expect(baseCandidates(index, k('클로저'), marks)).toEqual([
      { key: k('화살표 함수'), name: '화살표 함수' },
      { key: k('변수 범위'), name: '변수 범위' },
      { key: k('for 반복'), name: 'for 반복' },
    ])
    const far = { ...index, [k('클로저')]: { ...index[k('클로저')]!, blurb: '클로저 설명' } }
    expect(baseCandidates(far, k('클로저'), marks).map(one => one.name)).toEqual(['화살표 함수', '변수 범위'])
    expect(baseCandidates({ ...far, [k('클로저')]: { ...far[k('클로저')]!, files: ['z.js'] } }, k('클로저'), marks)).toEqual([])
    // A team term of any repository is never one: its name stays out of the grade, as its words are the team's.
    expect(baseCandidates(index, k('클로저')).map(one => one.name)).toContain('주문서')
    // None for the concept learned first, or one the index does not hold.
    expect(baseCandidates(index, k('아는 개념'), marks)).toEqual([])
    expect(baseCandidates(index, 'c:없음', marks)).toEqual([])
    expect(baseCandidates({}, k('클로저'))).toEqual([])
    // Five at most.
    // As many files shared: the most met first, whichever was met last (4/5 검토).
    const tie: Record<string, LearnConcept> = {
      [k('클로저')]: concept('클로저', 5, { files: ['a.js', 'b.js'] }),
      [k('적게')]: concept('적게', 9, { files: ['a.js'], count: 1, lastAt: NOW - DAY }),
      [k('많이')]: concept('많이', 8, { files: ['b.js'], count: 4, lastAt: NOW - 7 * DAY }),
      [k('둘 다')]: concept('둘 다', 7, { files: ['a.js', 'b.js'], count: 1, lastAt: NOW - 7 * DAY }),
    }
    expect(baseCandidates(tie, k('클로저')).map(one => one.name)).toEqual(['둘 다', '많이', '적게'])
    const many: Record<string, LearnConcept> = { [k('클로저')]: concept('클로저', 5, { files: ['x.js'] }) }
    for (let i = 0; i < 12; i += 1) many[`c:개념${i}`] = concept(`개념${i}`, 10 + i, { files: ['x.js'] })
    expect(baseCandidates(many, k('클로저'))).toHaveLength(BASE_CANDIDATES)
  })

  test('checkPrompt: the bases numbered after the slip open, the sentence after the kind\'s, the 바탕 점검, 바탕 근거 and 바탕 lines between the slip\'s and the kind\'s (1.10.0 G4\'s, in the place of F5\'s never sent)', () => {
    const i = INPUT_18
    const bases = ['변수 범위', '화살표 함수']
    const prompt = checkPrompt(i.item, i.mine, 'beginner', undefined, i.past, { bases })
    const block = '## 학습자가 전에 배운 개념\n1. 변수 범위\n2. 화살표 함수\n'
    const sentence = `${G4_CHECK}\n`
    const line = `${G4_FORMAT.join('\n')}\n`
    expect(prompt).toContain(`## 이 학습자가 지난번에 헷갈린 점\n${i.past.what}\n${block}## 학습자의 답\n`)
    expect(prompt).toContain(`기타 중 하나를 그대로 쓴다.\n${sentence}정확히 아래 형식만 쓴다.`)
    expect(prompt).toContain(`헷갈린 점: (거의·틀림일 때만 한 문장. 맞음이면 이 줄을 쓰지 않는다)\n${line}유형: (거의·틀림일 때만 위 갈래 중 하나)`)
    // Taken out again, 1.8.0's prompt to the byte: nothing else moved.
    expect(prompt.replace(block, '').replace(sentence, '').replace(line, '')).toBe(checkPrompt(i.item, i.mine, 'beginner', undefined, i.past))
    expect(checkPrompt(i.item, i.mine, 'intermediate', undefined, i.past, { bases }).replace(block, '').replace(sentence, '').replace(line, '')).toBe(OUTPUT_18.checkPast)
    // After "모르겠어요", before the first try's lines (the grade asks for the slip there too).
    const blank = checkPrompt(i.item, i.mine, 'beginner', i.blank, undefined, { bases })
    expect(blank).toContain(`## 모범 답\n${i.item.answer}\n${block}## 학습자의 첫 답과 받은 되묻기\n첫 답: (모르겠다고 했다)`)
    expect(blank.replace(block, '').replace(sentence, '').replace(line, '')).toBe(OUTPUT_18.checkBlank)
    // No base to list, the try again after a question asked back (no slip asked for), no extra, a team rule's: 1.8.0's.
    for (const extra of [undefined, {}, { bases: [] }]) {
      expect(checkPrompt(i.item, i.mine, 'beginner', undefined, undefined, extra)).toBe(OUTPUT_18.checkFirst)
      expect(checkPrompt(i.item, i.mine, 'beginner', i.blank, undefined, extra)).toBe(OUTPUT_18.checkBlank)
      expect(checkPrompt(i.item, i.mine, 'intermediate', undefined, i.past, extra)).toBe(OUTPUT_18.checkPast)
    }
    expect(checkPrompt(i.item, i.mine, 'beginner', i.first, undefined, { bases })).toBe(OUTPUT_18.checkAgain)
    const ruled = checkPrompt(i.item, i.mine, 'beginner', undefined, undefined, { rule: '`fetcher`를 쓴다', bases })
    expect(ruled).not.toContain('바탕')
    expect(ruled).not.toContain('전에 배운 개념')
  })

  test('parseCheck · baseOf: the 바탕 line read as the concept its number names (or its name), under a 바탕 근거 that names the answer\'s words; none otherwise', () => {
    const shown = [
      { key: 'c:변수범위', name: '변수 범위' },
      { key: 'c:화살표함수', name: '화살표 함수' },
      { key: 'c:arraymap', name: 'Array.map (배열 메서드)' },
    ]
    const reply = (said: string, verdict = '틀림', why = '바탕 근거: "반복마다 i가 하나"') =>
      ['판정: ' + verdict, '피드백: 적은 대로면 3이 세 번 나옵니다.', '되묻기: i는 몇 개일까요?', '헷갈린 점: 반복마다 i가 하나라고 봄', why, said, '유형: 변수 범위'].join('\n')
    const read = (said: string, verdict?: string, why?: string) => baseOf(parseCheck(reply(said, verdict, why), { base: true })?.base, shown)
    for (const said of ['바탕: 1', '**바탕**: 1', '바탕: `1`', '바탕: **1**', '바탕: 1.', '바탕: 1번', '바탕: 1. 변수 범위', '**바탕:** 1', '바탕: 변수 범위', '바탕: `변수 범위`', '바탕: 변수범위', '바탕: 변수 범위 (scope)', '바탕: (변수 범위)', '바탕: (1)', '바탕: [1]', '바탕: （1）', '바탕: (1번)', '바탕: **(1)**', '바탕: (1) 변수 범위', '바탕: [1]. 변수 범위']) {
      expect(read(said)).toBe('c:변수범위')
    }
    expect(read('바탕: 3')).toBe('c:arraymap')
    expect(read('바탕: Array.map')).toBe('c:arraymap')
    // None said, no line, a number past the list or 0, a name it was not shown, a right grade: none.
    for (const said of ['바탕: 0', '바탕: (0)', '바탕: [4]', '바탕: 4', '바탕: 없음', '바탕: (없음)', '바탕: 해당 없음', '바탕: -', '바탕: 클로저', '바탕: 변수 범위와 화살표 함수', '']) expect(read(said)).toBeUndefined()
    expect(read('바탕: 1', '맞음')).toBeUndefined()
    expect(parseCheck(reply('바탕: 1', '맞음'), { base: true })?.base).toBeUndefined()
    // No words of the answer said for it (바탕 근거 없음, or no such line): no base, whatever number follows.
    for (const why of ['바탕 근거: 없음', '바탕 근거: -', '**바탕 근거:** (없음)', '']) expect(read('바탕: 1', '틀림', why)).toBeUndefined()
    // Asked for, the lines are their own: they run neither into the slip nor into its kind.
    const graded = parseCheck(reply('바탕: 1'), { base: true })!
    expect(graded).toEqual({
      verdict: 'wrong',
      feedback: '적은 대로면 3이 세 번 나옵니다.',
      nudge: 'i는 몇 개일까요?',
      slip: '반복마다 i가 하나라고 봄',
      slipType: 'scope',
      base: '1',
      baseWhy: '"반복마다 i가 하나"',
    })
    expect(baseOf(parseCheck('{"verdict": "거의", "feedback": "가까워요.", "바탕 근거": "x => { x * 2 }", "바탕": "2"}', { base: true })?.base, shown)).toBe('c:화살표함수')
    expect(parseCheck('{"verdict": "거의", "feedback": "가까워요.", "바탕": "2"}', { base: true })?.base).toBeUndefined()
    expect(baseOf(undefined, shown)).toBeUndefined()
    // Not asked: the 바탕 lines are the feedback's or the slip's, as in 1.8.0.
    expect(parseCheck(INPUT_18.checkReply)).toEqual(OUTPUT_18.parsed)
    expect(parseCheck('판정: 거의\n피드백: 좋습니다.\n바탕: 1')).toEqual({ verdict: 'partial', feedback: '좋습니다.\n바탕: 1' })
    expect(parseCheck(reply('바탕: 1'))?.base).toBeUndefined()
    expect(parseCheck('{"verdict": "틀림", "feedback": "아닙니다.", "바탕 근거": "x => { x * 2 }", "바탕": "1"}')).toEqual({ verdict: 'wrong', feedback: '아닙니다.' })
    expect(parseCheck(reply('바탕: 1'))?.slip).toBe('반복마다 i가 하나라고 봄 바탕 근거: "반복마다 i가 하나" 바탕: 1')
  })

  test('slipFrom · slipChange carry the base the grade picked: the first try\'s after a question asked back, else the answer\'s own; none for "모르겠어요"', () => {
    const first = { mine: '3 3 3', verdict: 'wrong' as const, feedback: 'f', nudge: 'n', at: NOW, slip: 'i가 하나라고 봄', slipType: 'scope' as const, slipBase: 'c:변수범위' }
    expect(slipFrom({ mine: '0 1 2', firstTry: first })).toEqual({ what: 'i가 하나라고 봄', type: 'scope', mine: '3 3 3', base: 'c:변수범위' })
    expect(slipFrom({ mine: '3 3 3', slip: 'i가 하나라고 봄', slipType: 'scope', slipBase: 'c:변수범위' })).toMatchObject({ base: 'c:변수범위' })
    // After "모르겠어요" the answer after the hint is the one graded, its base its own.
    const blank = { mine: '모르겠어요', verdict: 'wrong' as const, feedback: '', nudge: 'h', at: NOW }
    expect(slipFrom({ mine: '3 3 3', slip: 'i가 하나라고 봄', slipType: 'scope', slipBase: 'c:화살표함수', firstTry: blank })).toMatchObject({ base: 'c:화살표함수' })
    expect(slipFrom({ mine: '모르겠어요', slipBase: 'c:변수범위' })).toEqual({ what: '', type: 'blank', mine: '모르겠어요' })
    expect(slipFrom({ mine: '3 3 3', slip: 'i가 하나라고 봄', slipType: 'scope' })).not.toHaveProperty('base')
    const item: LearnQuizItem = { key: 'c:클로저', name: '클로저', question: 'Q', answer: '0 1 2', mine: '3 3 3', slip: 'i가 하나라고 봄', slipType: 'scope', slipBase: 'c:변수범위', result: 'wrong' }
    expect(slipChange(item, { isHelped: false, isGraduated: false })).toMatchObject({ kind: 'missed', base: 'c:변수범위' })
  })

  test('nextSlip · slipRecordOf: a miss keeps its grade\'s base (none drops the one before), never one still counted right nor "모르겠어요"', () => {
    const open: LearnSlip = { what: 'i가 하나라고 봄', type: 'scope', question: 'Q1', mine: '3 3 3', at: NOW - DAY, times: 1 }
    const missed = (more: object = {}) => ({ kind: 'missed' as const, question: 'Q2', what: 'i가 하나라고 봄', type: 'scope' as const, mine: '3 3 3', ...more })
    const twice = nextSlip(open, missed({ base: 'c:변수범위' }), NOW)!
    expect(twice).toMatchObject({ times: 2, base: 'c:변수범위', at: NOW })
    // Missed the same way again with none picked: the base before goes.
    expect(nextSlip(twice, missed(), NOW + DAY)).not.toHaveProperty('base')
    // Right after being asked back: no base, the one before gone too.
    const right = nextSlip(twice, missed({ base: 'c:화살표함수', isRight: true }), NOW + DAY)!
    expect(right.isRight).toBe(true)
    expect(right).not.toHaveProperty('base')
    expect(nextSlip(undefined, missed({ base: 'c:변수범위', isRight: true }), NOW)).not.toHaveProperty('base')
    // "모르겠어요" on an open slip with words: that slip's words as they were, counted once more, but no base: no grade
    // read this answer for one, and the plan asks none after it (4/5 검토; 1.9.0's first build kept the one before).
    const forgot = { kind: 'missed' as const, question: 'Q3', what: '', type: 'blank' as const, mine: '모르겠어요' }
    const blank = nextSlip(twice, forgot, NOW + DAY)!
    expect(blank).toMatchObject({ what: 'i가 하나라고 봄', times: 3 })
    expect(blank).not.toHaveProperty('base')
    // Another kind takes its place, with its own base or none; "모르겠어요" after it makes its second miss no base's either.
    const other = nextSlip(twice, missed({ type: 'order', base: 'c:화살표함수' }), NOW + DAY)!
    expect(other).toMatchObject({ type: 'order', times: 1, base: 'c:화살표함수' })
    const second = nextSlip(other, forgot, NOW + 3 * DAY)!
    expect(second).toMatchObject({ type: 'order', times: 2 })
    expect(second).not.toHaveProperty('base')
    expect(nextSlip(twice, missed({ type: 'order' }), NOW + DAY)).not.toHaveProperty('base')
    // A right answer mends or keeps: the base stays with the slip (turned back with f from slipBefore, as it was).
    expect(nextSlip(twice, { kind: 'mended' }, NOW + DAY)).toMatchObject({ base: 'c:변수범위', fixedAt: NOW + DAY })
    // Read back: kept when a concept key of 200 characters at most, else dropped; 1.7 and 1.8 records as they were.
    expect(slipRecordOf(JSON.parse(JSON.stringify(twice)))).toEqual(twice)
    for (const base of ['변수범위', 'c:', `c:${'가'.repeat(199)}`, 3, null, ['c:x']]) expect(slipRecordOf({ ...twice, base })).not.toHaveProperty('base')
    expect(slipRecordOf({ ...twice, base: `c:${'가'.repeat(198)}` })?.base).toBe(`c:${'가'.repeat(198)}`)
    expect(isBaseKey('c:변수범위')).toBe(true)
    const { base, ...old } = twice
    expect(slipRecordOf(old)).toEqual(old)
    // A 1.8 window that writes the slips back drops it: the next quiz is then 1.8.0's.
    expect(slipRecordOf(slipRecordOf18(twice))).toEqual(old)
    expect(base).toBe('c:변수범위')
  })

  test('slipCounts: the open slips with a base a quiz would ask before its worked example, by count alone', () => {
    const slip = (more: Partial<LearnSlip>): LearnSlip => ({ what: 'w', type: 'scope', question: 'q', mine: 'm', at: NOW, times: 2, ...more })
    expect(slipCounts({ a: slip({ base: 'c:x' }), b: slip({ base: 'c:y', fixedAt: NOW }), c: slip({}) }, 2).based).toBe(1)
    expect(slipCounts({}).based).toBe(0)
    // Missed once or three times running, or set right on its try again: a base no quiz asks is not counted (4/5 검토).
    expect(slipCounts({ a: slip({ base: 'c:x', times: 3 }), b: slip({ base: 'c:y', times: 1 }), c: slip({ base: 'c:z', isRight: true }) }, 2).based).toBe(0)
    expect(slipCounts({ a: slip({ base: 'c:x' }) }, Infinity).based).toBe(0)
    expect(slipCounts({ a: slip({ base: 'c:x', times: 2 }) }).based).toBe(2 === WORKED_AFTER_TIMES ? 1 : 0)
  })

  test('slipNotice: a second miss that makes the next quiz a worked example says the base comes first, only with one and bases asked', () => {
    const item = { result: 'wrong' as const, gradedAt: NOW, mine: '3 3 3', slip: 'i가 하나라고 봄', slipType: 'scope' as const }
    const record: LearnSlip = { what: 'i가 하나라고 봄', type: 'scope', question: 'Q', mine: '3 3 3', at: NOW, times: 2, base: 'c:변수범위' }
    expect(slipNotice(item, record, false, 2, true)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_BASE_NEXT}`)
    expect(slipNotice(item, record, false, 2, false)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_NEXT}`)
    const { base, ...none } = record
    expect(slipNotice(item, none, false, 2, true)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_NEXT}`)
    // "모르겠어요" asks no base (4/5 검토): 1.8.0's line, whatever the record holds.
    expect(slipNotice({ ...item, mine: '모르겠어요' }, record, false, 2, true)?.text).toBe(`떠오르지 않았습니다 · ${WORKED_NEXT}`)
    // Missed a third time running: a worked example with no base before it (baseFor), and said so.
    expect(slipNotice(item, { ...record, times: 3 }, false, 2, true)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_NEXT}`)
    // Missed once: no worked example, no base said.
    expect(slipNotice(item, { ...record, times: 1 }, false, 2, true)?.text).toBe('헷갈린 점: i가 하나라고 봄 · 다음 퀴즈에서 다른 코드로 다시 묻습니다')
    // A question asked again: the callers add workedNextText after SLIP_AGAIN.
    expect(slipNotice({ ...item, isRetry: true }, record, false, 2, true)).toEqual({ kind: 'again', text: SLIP_AGAIN })
    expect(base).toBe('c:변수범위')
  })
})

describe('1.9.0: where a quiz asks the base concept (F5, baseFor · withBase · parseQuiz)', () => {
  const index: Record<string, LearnConcept> = {
    [k('클로저')]: concept('클로저', 10, { step: 1, reviewedAt: NOW - 3 * DAY }),
    [k('변수 범위')]: concept('변수 범위', 30, { step: 3, reviewedAt: NOW - 4 * DAY }),
    [k('비동기')]: concept('비동기', 20, { step: 0 }),
    [k('채우기')]: concept('채우기', 15, { step: 2, reviewedAt: NOW - DAY }),
    [k('틀린 것')]: concept('틀린 것', 16, { step: 0, missedAt: NOW - DAY }),
    [k('다른 도전')]: concept('다른 도전', 17, { step: 0 }),
    [k('아는 것')]: concept('아는 것', 40, { knownAt: NOW - DAY }),
  }
  const pick = (name: string, more: Partial<QuizPick> = {}): QuizPick => ({ ...index[k(name)]!, key: k(name), ...more })
  const slip = (more: Partial<LearnSlip> = {}): LearnSlip => ({ what: 'i가 하나라고 봄', type: 'scope', question: 'Q', mine: '3 3 3', at: NOW - 2 * DAY, times: 2, base: k('변수 범위'), ...more })
  const slips = (x: LearnSlip, more: Record<string, LearnSlip> = {}) => ({ [k('클로저')]: x, ...more })
  /** Worked examples after two misses running in both branches (1.10.0 G1), as 1.8.0 shipped them for every concept. */
  const BOTH = { workedAfter: 2, workedPlainAfter: 2 }
  /** The code branch's count (1.10.0 G4: a base is asked before a worked example of it alone). */
  const CODE = { workedAfter: 2 }
  const find = (picks: QuizPick[], x: LearnSlip = slip(), more: Record<string, LearnSlip> = {}, asking = [k('클로저')], how: Parameters<typeof baseFor>[6] = {}) => {
    const open = slips(x, more)
    return baseFor(index, key => open[key], picks, new Set(asking), {}, open, { ...CODE, ...how })
  }
  /** X met in js code that holds the line its words quote: a worked example's code branch (1.10.0 G1 · G4). */
  const QUOTED = { file: 'src/a.js', text: 'let total = 0\nfor (const n of [1, 2]) total += n' }
  const X = pick('클로저', { blurb: '클로저 설명 — `total += n`', code: QUOTED, slip: { what: 'i가 하나라고 봄', question: 'Q', mine: '3 3 3' } })
  /** X met in no code (1.10.0 G1's branch 'plain'): no base before its worked example (1.10.0 G4). */
  const PLAIN_X = pick('클로저', { slip: { what: 'i가 하나라고 봄', question: 'Q', mine: '3 3 3' } })
  const D = pick('비동기')
  const F = pick('채우기')
  const B = pick('변수 범위')

  test('the base takes the last place no slip asked again holds (a filler, then a team term not met, then a concept due), right before X', () => {
    const found = find([X, D, F])
    expect(found).toEqual({ key: k('변수 범위'), before: k('클로저'), slot: 2 })
    const asked = withBase([X, D, F], found!, B)
    expect(asked.map(one => one.name)).toEqual(['변수 범위', '클로저', '비동기'])
    expect(asked.map(one => one.isBase === true)).toEqual([true, false, false])
    // A team term not met yet in the last place, or a concept due: the same.
    const fresh: QuizPick = { key: 'c:주문서', name: '주문서', count: 0, firstAt: NOW, lastAt: NOW, blurb: '팀 용어', files: [], team: true }
    expect(find([X, D, fresh])?.slot).toBe(2)
    expect(find([D, X, pick('다른 도전')])?.slot).toBe(2)
    expect(withBase([D, X, F], find([D, X, F])!, B).map(one => one.name)).toEqual(['비동기', '변수 범위', '클로저'])
    // A quiz of two: added, three then.
    const added = find([X, D])!
    expect(added.slot).toBe(-1)
    expect(withBase([X, D], added, B).map(one => one.name)).toEqual(['변수 범위', '클로저', '비동기'])
    // A base merged into another is asked as the concept it counts under now.
    const open = slips(slip({ base: 'c:scope' }))
    expect(baseFor(index, key => open[key], [X, D, F], new Set([k('클로저')]), { 'c:scope': k('변수 범위') }, open, CODE)?.key).toBe(k('변수 범위'))
  })

  test('no base: no place but slips asked again and a concept answered wrong, or a base known, gone, in the quiz, gone over, open, or a team term', () => {
    const Y = pick('다른 도전', { slip: { what: 'w', question: 'q', mine: 'm' } })
    const Z = pick('비동기', { slip: { what: 'w', question: 'q', mine: 'm' } })
    // Every place a slip asked again, or the last a concept answered wrong (kept: o·x or /learn 퀴즈 틀림).
    expect(find([X, Y, Z], slip(), {}, [k('클로저'), k('다른 도전'), k('비동기')])).toBeUndefined()
    expect(find([X, Y, pick('틀린 것')], slip(), {}, [k('클로저'), k('다른 도전')])).toBeUndefined()
    expect(find([X, D, pick('틀린 것')])?.slot).toBe(1)
    // The base known, not in the index, in the quiz already, gone over since the slip was kept, its own slip open.
    expect(find([X, D, F], slip({ base: k('아는 것') }))).toBeUndefined()
    expect(find([X, D, F], slip({ base: 'c:없는개념' }))).toBeUndefined()
    expect(find([X, B, F])).toBeUndefined()
    expect(find([X, D, F], slip({ at: NOW - 5 * DAY }))).toBeUndefined()
    expect(find([X, D, F], slip(), { [k('변수 범위')]: slip({ base: undefined, times: 1 }) })).toBeUndefined()
    // A mended slip of its own is no slip open: asked as the base.
    expect(find([X, D, F], slip(), { [k('변수 범위')]: slip({ base: undefined, fixedAt: NOW - DAY }) })?.key).toBe(k('변수 범위'))
    // Its base a team term of any repository, or X itself.
    expect(find([X, D, F], slip(), {}, [k('클로저')], { teamMarks: { [k('변수 범위')]: ['abc123def456'] } })).toBeUndefined()
    expect(find([X, D, F], slip({ base: k('클로저') }))).toBeUndefined()
    // X no worked example: missed three times, set right after being asked back, no base, not asked again, a team term.
    expect(find([X, D, F], slip({ times: 3 }))).toBeUndefined()
    expect(find([X, D, F], slip({ times: 1 }))).toBeUndefined()
    expect(find([X, D, F], slip({ isRight: true }))).toBeUndefined()
    expect(find([X, D, F], slip({ base: undefined }))).toBeUndefined()
    expect(find([X, D, F], slip(), {}, [])).toBeUndefined()
    expect(find([{ ...X, team: true }, D, F])).toBeUndefined()
    // 풀이 보고 풀기 off (F4's Infinity): no worked example, no base.
    expect(find([X, D, F], slip(), {}, [k('클로저')], { workedAfter: Infinity })).toBeUndefined()
  })

  test('1.10.0 (G4): X a worked example of the code branch alone (baseAfterFor on its pick\'s code and words); met in no code, no base whatever the plain branch\'s count', () => {
    // X met in js code that holds its quote: the code branch's count.
    expect(find([X, D, F], slip(), {}, [k('클로저')], { workedAfter: 2 })?.key).toBe(k('변수 범위'))
    expect(find([X, D, F], slip(), {}, [k('클로저')], { workedAfter: Infinity })).toBeUndefined()
    // Three misses running with the code branch at 3: the base then, not at two.
    expect(find([X, D, F], slip({ times: 3 }), {}, [k('클로저')], { workedAfter: 3 })?.key).toBe(k('변수 범위'))
    expect(find([X, D, F], slip(), {}, [k('클로저')], { workedAfter: 3 })).toBeUndefined()
    // X met in no code: a worked example of the plain branch (1.10.0 G1) and no base before it (G4), its count looked
    // at nowhere (1.9.0's baseFor, and 1.10.0 G1's, asked one).
    expect(workedAfterFor(PLAIN_X.code, PLAIN_X.blurb, PLAIN_X.files, BOTH)).toBe(2)
    expect(baseAfterFor(PLAIN_X.code, PLAIN_X.blurb, PLAIN_X.files, BOTH)).toBe(Infinity)
    expect(find([PLAIN_X, D, F])).toBeUndefined()
    // Code with no quote of its words, in jsx, or a library's: neither branch, no worked example and no base.
    for (const code of [{ file: 'src/a.js', text: 'console.log(1)' }, { file: 'src/A.jsx', text: QUOTED.text }, { file: 'src/a.js', text: `import _ from 'lodash'\n${QUOTED.text}` }]) {
      expect(find([{ ...X, code }, D, F])).toBeUndefined()
      expect(workedAfterFor(code, X.blurb, [], BOTH)).toBe(Infinity)
      expect(baseAfterFor(code, X.blurb, [], BOTH)).toBe(Infinity)
    }
    // baseAfterFor: the code branch's count for code that holds its quote, in js, ts or py; the default the constant's (off).
    for (const file of ['src/a.js', 'src/a.ts', 'app/a.py']) expect(baseAfterFor({ file, text: QUOTED.text }, X.blurb, [file], { workedAfter: 2 })).toBe(2)
    expect(baseAfterFor(QUOTED, X.blurb, [])).toBe(WORKED_AFTER_TIMES)
    // The default counts are the constants' (off).
    expect(baseFor(index, () => slip(), [X, D, F], new Set([k('클로저')]), {}, {})).toBeUndefined()
  })

  test('1.10.0 (G4, D33 (4)): no base where the quiz with it would hold a team term, or X would be its one concept beside it; a team term in the place it takes goes with that place', () => {
    const fresh: QuizPick = { key: 'c:주문서', name: '주문서', count: 0, firstAt: NOW, lastAt: NOW, blurb: '팀 용어', files: [], team: true }
    const marked = pick('비동기', { isTeamMarked: true })
    // A team term not met yet in the place the base takes: gone with it, the base asked.
    expect(find([X, D, fresh])).toEqual({ key: k('변수 범위'), before: k('클로저'), slot: 2 })
    // A team term left beside it (one not met yet, or a concept of another repository's team): none.
    expect(find([X, fresh, F])).toBeUndefined()
    expect(find([X, marked, F])).toBeUndefined()
    expect(find([X, marked])).toBeUndefined()
    // X itself a team term of another repository: none.
    expect(find([{ ...X, isTeamMarked: true }, D, F])).toBeUndefined()
    // X alone: none; X with one beside it: three with the base.
    expect(find([X])).toBeUndefined()
    expect(find([X, D])).toEqual({ key: k('변수 범위'), before: k('클로저'), slot: -1 })
  })

  test('isBaseKept (1.10.0 G4, D33 (4)): a base only while the pick after it is asked by its worked example as ladderMixed keeps the rungs', () => {
    const picks = withBase([X, D, F], find([X, D, F])!, B)
    expect(picks.map(one => [one.name, one.isBase === true])).toEqual([['변수 범위', true], ['클로저', false], ['비동기', false]])
    expect(isBaseKept(ladderMixed([undefined, 'worked', undefined], picks), picks)).toBe(true)
    expect(isBaseKept([undefined, undefined, undefined], picks)).toBe(false)
    expect(isBaseKept(['mine', 'mine', 'mine'], picks)).toBe(false)
    // No base in the quiz: kept as it is.
    expect(isBaseKept([undefined, undefined, undefined], [X, D, F])).toBe(true)
    // A worked example before it in the quiz: ladderMixed keeps that one's alone, X is asked again, the base goes.
    const Y = pick('다른 도전')
    const before = [Y, ...picks.slice(0, 2)]
    const asIs = ladderMixed(['worked', undefined, 'worked'], before)
    expect(asIs).toEqual(['worked', undefined, undefined])
    expect(isBaseKept(asIs, before)).toBe(false)
    // A team term beside it, or X alone but for it: ladderMixed asks X again, the base goes.
    expect(isBaseKept(ladderMixed([undefined, 'worked', undefined], [picks[0]!, picks[1]!, { ...D, isTeamMarked: true }]), picks)).toBe(false)
    expect(isBaseKept(ladderMixed([undefined, 'worked'], picks.slice(0, 2)), picks.slice(0, 2))).toBe(false)
  })

  test('the line under a miss promises the base just where baseFor asks one: missed workedAfter times running, not set right (4/5 검토)', () => {
    for (const times of [1, 2, 3, 4]) {
      for (const isRight of [false, true]) {
        const x = slip({ times, at: NOW, ...(isRight ? { isRight: true as const } : {}) })
        const said = isWorkedNext(x, { gradedAt: NOW }, 2) && workedNextText(x, true, baseAfterFor(X.code, X.blurb, X.files, CODE)) === WORKED_BASE_NEXT
        expect([times, isRight, said]).toEqual([times, isRight, find([X, D, F], x) !== undefined])
      }
    }
  })

  test('parseQuiz keeps the base\'s mark only while X\'s question follows it; the quiz prompt is the same with the mark or without', () => {
    const picks = withBase([X, D, F], find([X, D, F])!, B)
    const reply = ['T1: 예측', 'Q1: `let a = 1`의 a는?', 'H1: 값', 'A1: 1', 'T2: 예측', 'Q2: 풀이: 예\n이제 풀어 보세요: 무엇이 찍힐까요?', 'H2: i', 'A2: 0 1 2', 'T3: 왜', 'Q3: 왜 await를 썼을까요?', 'H3: 기다림', 'A3: 값을 기다리려고'].join('\n')
    const items = parseQuiz(reply, picks)
    expect(items.map(item => item.isBase === true)).toEqual([true, false, false])
    // X's question unread: B is a question as any other, no title tag and no dim line.
    const noX = reply.replace(/Q2: [\s\S]*?A2: 0 1 2\n/, '')
    const read = parseQuiz(noX, picks)
    expect(read.map(item => item.name)).toEqual(['변수 범위', '비동기'])
    expect(read[0]).not.toHaveProperty('isBase')
    expect(parseQuiz(reply.replace('Q1: `let a = 1`의 a는?\n', ''), picks).some(item => item.isBase)).toBe(false)
    // quizPrompt is not told: the base is asked as any concept is.
    const plain = picks.map(({ isBase, ...rest }) => rest)
    expect(quizPrompt(picks, 'beginner')).toBe(quizPrompt(plain, 'beginner'))
  })
})

describe('1.10.0: 바탕 개념 (G4): each concept listed marked first, a base kept only where its mark says 틀림 (pure parts)', () => {
  const listed = [
    { key: 'c:a', name: '함수' },
    { key: 'c:b', name: '화살표 함수' },
    { key: 'c:c', name: '변수 범위' },
    { key: 'c:d', name: '배열·리스트' },
  ]
  const audit = (raw: string | undefined, candidates = listed) => Object.fromEntries(baseAuditOf(raw, candidates))
  /** A grade short of right that asked for a base: its 바탕 점검 `marks`, its 바탕 근거 `why`, its 바탕 `said`. */
  const reply = (marks: string, said = '바탕: 3', why = '바탕 근거: `let i = 0; i += 1` → 0 → 1', verdict = '틀림') =>
    [`판정: ${verdict}`, '피드백: 적은 대로면 3이 세 번 나옵니다.', '되묻기: i는 몇 개일까요?', '헷갈린 점: 반복마다 i가 하나라고 봄', marks, why, said, '유형: 변수 범위'].join('\n')

  test('the sentence and the three lines as the design wrote them: the lines with no mark shown as an example; BASE_AUDIT_RETRY\'s bytes fixed before any call, sent nowhere', () => {
    const i = INPUT_18
    const prompt = checkPrompt(i.item, i.mine, 'beginner', undefined, i.past, { bases: ['함수', '화살표 함수', '변수 범위'] })
    expect(prompt).toContain(`기타 중 하나를 그대로 쓴다.\n${G4_CHECK}\n정확히 아래 형식만 쓴다.`)
    expect(prompt).toContain(`헷갈린 점: (거의·틀림일 때만 한 문장. 맞음이면 이 줄을 쓰지 않는다)\n${G4_FORMAT.join('\n')}\n유형: (거의·틀림일 때만 위 갈래 중 하나)`)
    // No mark written out as an example in the format lines: copied word for word, every true base would go.
    for (const line of G4_FORMAT) expect(line).not.toMatch(/\d\s*(?:틀림|바름|없음)|"|처럼/)
    expect(BASE_AUDIT_RETRY).toBe('바탕 점검: (번호마다 "번호 표시" 꼴로 쉼표로 잇는다. 표시는 틀림·바름·없음 중 하나이고, 위 목록의 번호를 하나도 빼지 않는다)')
    expect(prompt).not.toContain(BASE_AUDIT_RETRY)
    // The order: the slip's line, then 바탕 점검, 바탕 근거, 바탕, then its kind's.
    const at = (text: string) => prompt.indexOf(text)
    expect([at('헷갈린 점: ('), at('바탕 점검: ('), at('바탕 근거: ('), at('바탕: ('), at('유형: (')]).toEqual([...[at('헷갈린 점: ('), at('바탕 점검: ('), at('바탕 근거: ('), at('바탕: ('), at('유형: (')]].sort((a, b) => a - b))
  })

  test('parseCheck { base: true }: the 바탕 점검 line read as baseAudit (bold, no space, 점검 alone, over lines, JSON keys), kept with no base picked, none on a right grade; never in the slip nor its kind', () => {
    for (const marks of ['바탕 점검: 1 없음, 2 바름, 3 틀림', '**바탕 점검**: 1 없음, 2 바름, 3 틀림', '**바탕 점검:** 1 없음, 2 바름, 3 틀림', '바탕점검: 1 없음, 2 바름, 3 틀림', '점검: 1 없음, 2 바름, 3 틀림', '바탕 점검：1 없음, 2 바름, 3 틀림']) {
      expect(parseCheck(reply(marks), { base: true })).toEqual({
        verdict: 'wrong',
        feedback: '적은 대로면 3이 세 번 나옵니다.',
        nudge: 'i는 몇 개일까요?',
        slip: '반복마다 i가 하나라고 봄',
        slipType: 'scope',
        base: '3',
        baseWhy: '`let i = 0; i += 1` → 0 → 1',
        baseAudit: '1 없음, 2 바름, 3 틀림',
      })
    }
    expect(parseCheck(reply('바탕 점검:\n1번 없음\n2번 바름\n3번 틀림'), { base: true })?.baseAudit).toBe('1번 없음\n2번 바름\n3번 틀림')
    // No base picked (바탕 0, or 바탕 근거 없음): the marks kept all the same, no base.
    for (const [said, why] of [['바탕: 0', '바탕 근거: 없음'], ['바탕: 3', '바탕 근거: 없음'], ['바탕: 0', '바탕 근거: `x` → 1 → 2']]) {
      const graded = parseCheck(reply('바탕 점검: 1 바름, 2 없음, 3 없음', said, why), { base: true })!
      expect(graded.baseAudit).toBe('1 바름, 2 없음, 3 없음')
      expect(auditedBase(graded, listed)).toBeUndefined()
    }
    // A right grade keeps none; an empty line or none at all, none.
    expect(parseCheck(reply('바탕 점검: 3 틀림', '바탕: 3', '바탕 근거: x → 1 → 2', '맞음'), { base: true })).not.toHaveProperty('baseAudit')
    expect(parseCheck(reply('바탕 점검:'), { base: true })).not.toHaveProperty('baseAudit')
    expect(parseCheck(reply(''), { base: true })).not.toHaveProperty('baseAudit')
    // JSON: its own key or the Korean ones.
    for (const key of ['baseAudit', '바탕 점검', '바탕점검']) {
      const graded = parseCheck(`{"verdict": "거의", "feedback": "가까워요.", "${key}": "1 없음, 2 틀림", "바탕 근거": "x => { x * 2 } → 2 → undefined", "바탕": "2"}`, { base: true })
      expect(graded).toMatchObject({ baseAudit: '1 없음, 2 틀림', base: '2' })
      expect(auditedBase(graded!, listed)).toBe('c:b')
    }
    // Not asked: the line is the slip's, as 1.8.0 read it; never a mark kept.
    const plain = parseCheck(reply('바탕 점검: 1 없음, 2 바름, 3 틀림'))!
    expect(plain).not.toHaveProperty('baseAudit')
    expect(plain.slip).toBe('반복마다 i가 하나라고 봄 바탕 점검: 1 없음, 2 바름, 3 틀림 바탕 근거: `let i = 0; i += 1` → 0 → 1 바탕: 3')
    expect(parseCheck('판정: 거의\n피드백: 좋습니다.\n점검: 1 틀림')).toEqual({ verdict: 'partial', feedback: '좋습니다.\n점검: 1 틀림' })
    expect(parseCheck('판정: 거의\n피드백: 좋습니다.\n바탕 점검: 1 틀림', { rule: true })).toEqual({ verdict: 'partial', feedback: '좋습니다.\n바탕 점검: 1 틀림' })
  })

  test('baseAuditOf: by number (bare, a colon, 번, in brackets) or by the longest name a part holds; a part per comma, line, \' / \' or \' · \'; the first mark after it counts', () => {
    expect(audit('1 없음, 2 바름')).toEqual({ 'c:a': 'none', 'c:b': 'right' })
    expect(audit('1: 틀림 / 2: 없음')).toEqual({ 'c:a': 'wrong', 'c:b': 'none' })
    expect(audit('1번 틀림\n2번 없음\n3번 바름')).toEqual({ 'c:a': 'wrong', 'c:b': 'none', 'c:c': 'right' })
    expect(audit('(1) 틀림; [2] 바름；（3） 없음')).toEqual({ 'c:a': 'wrong', 'c:b': 'right', 'c:c': 'none' })
    expect(audit('1 없음 · 2 틀림 · 3 바름 · 4 없음')).toEqual({ 'c:a': 'none', 'c:b': 'wrong', 'c:c': 'right', 'c:d': 'none' })
    expect(audit('1. 함수: 바름, 3. 변수 범위 - 틀림')).toEqual({ 'c:a': 'right', 'c:c': 'wrong' })
    // By name: the longest the part holds (화살표 함수 over 함수), spaces and case aside; · inside a name is no break.
    expect(audit('화살표 함수 틀림, 함수 없음')).toEqual({ 'c:b': 'wrong', 'c:a': 'none' })
    expect(audit('화살표 함수 없음, 함수 틀림')).toEqual({ 'c:b': 'none', 'c:a': 'wrong' })
    expect(audit('화살표함수: 틀림')).toEqual({ 'c:b': 'wrong' })
    expect(audit('배열·리스트 틀림')).toEqual({ 'c:d': 'wrong' })
    expect(audit('- 변수 범위: 틀림\n- 함수: 바름')).toEqual({ 'c:c': 'wrong', 'c:a': 'right' })
    // Two names as long in one part: none of them read.
    expect(audit('배열과 객체 틀림', [{ key: 'c:x', name: '배열' }, { key: 'c:y', name: '객체' }])).toEqual({})
    // The first mark wins over words after it.
    expect(audit('3 틀림 (바르게 말한 곳 없음), 1 없음')).toEqual({ 'c:c': 'wrong', 'c:a': 'none' })
    expect(audit('3 바름 (다른 곳은 틀렸지만), 1 없음')).toEqual({ 'c:c': 'right', 'c:a': 'none' })
    // The marks' like: 틀렸 · 잘못 앎, 바르게 말함 · 맞음, 해당 없음 · a dash.
    expect(audit('1 잘못 앎, 2 바르게 말함, 3 해당 없음, 4 -')).toEqual({ 'c:a': 'wrong', 'c:b': 'right', 'c:c': 'none', 'c:d': 'none' })
    expect(audit('1 틀렸음, 2 맞음')).toEqual({ 'c:a': 'wrong', 'c:b': 'right' })
    expect(audit('1 `틀림`, 2 **바름**')).toEqual({ 'c:a': 'wrong', 'c:b': 'right' })
    // Left out: no mark, a number past the list or 0, a name not listed, a concept read already; none for nothing.
    expect(audit('1 ○, 2 ?')).toEqual({})
    expect(audit('5 틀림, 0 틀림')).toEqual({})
    expect(audit('클로저 틀림')).toEqual({})
    expect(audit('1 틀림, 1 바름, 함수 없음')).toEqual({ 'c:a': 'wrong' })
    expect(audit('')).toEqual({})
    expect(audit(undefined)).toEqual({})
  })

  test('baseAuditOf (5/7 검토): a name that starts with a number (2차원 배열 · 3항 연산자) read by its name, never as that number; a number only where it stands alone (then a space, 번, a bracket, a stop, a colon, a mark, a dash, 은 · 는 · 이 · 가, or nothing)', () => {
    const led = [
      { key: 'c:2d', name: '2차원 배열' },
      { key: 'c:loop', name: '반복문' },
      { key: 'c:scope', name: '변수 범위' },
    ]
    expect(audit('2차원 배열 틀림, 반복문 바름, 변수 범위 없음', led)).toEqual({ 'c:2d': 'wrong', 'c:loop': 'right', 'c:scope': 'none' })
    expect(audit('반복문 바름, 2차원 배열 없음, 변수 범위 틀림', led)).toEqual({ 'c:loop': 'right', 'c:2d': 'none', 'c:scope': 'wrong' })
    expect(audit('(2차원 배열) 틀림 · **2차원배열**: 바름', led)).toEqual({ 'c:2d': 'wrong' })
    expect(audit('3항 연산자 바름', [...led, { key: 'c:if3', name: '3항 연산자' }])).toEqual({ 'c:if3': 'right' })
    // A name not listed that starts with a number is no number's mark either.
    expect(audit('3항 연산자 바름, 10진수 틀림', led)).toEqual({})
    // Numbers as before, with a mark, a dash, a particle or nothing right after them too.
    expect(audit('1 틀림, 2: 바름, 3번 없음', led)).toEqual({ 'c:2d': 'wrong', 'c:loop': 'right', 'c:scope': 'none' })
    expect(audit('1틀림, 2바름, 3-', led)).toEqual({ 'c:2d': 'wrong', 'c:loop': 'right', 'c:scope': 'none' })
    expect(audit('1은 틀림, 2는 바름, 3이 없음', led)).toEqual({ 'c:2d': 'wrong', 'c:loop': 'right', 'c:scope': 'none' })
    expect(audit('2 틀림 (2차원 배열과 헷갈림)', led)).toEqual({ 'c:loop': 'wrong' })
    // auditedBase on it: the base its own mark says 틀림 kept (by number or by name), none for the one it says 바름.
    const marks = '바탕 점검: 2차원 배열 틀림, 반복문 바름, 변수 범위 없음'
    expect(auditedBase(parseCheck(reply(marks, '바탕: 1'), { base: true })!, led)).toBe('c:2d')
    expect(auditedBase(parseCheck(reply(marks, '바탕: 2차원 배열'), { base: true })!, led)).toBe('c:2d')
    expect(auditedBase(parseCheck(reply(marks, '바탕: 2'), { base: true })!, led)).toBeUndefined()
  })

  test('auditedBase: the base its 바탕 line names, only where its own mark says 틀림; none for 바름 · 없음, no audit, one that does not read, another\'s 틀림, 바탕 0 or 바탕 근거 없음', () => {
    const read = (marks: string, said = '바탕: 3', why?: string) => auditedBase(parseCheck(reply(marks, said, why), { base: true })!, listed)
    expect(read('바탕 점검: 1 없음, 2 바름, 3 틀림')).toBe('c:c')
    expect(read('바탕 점검: 1 없음, 2 바름, 3 틀림', '바탕: 변수 범위')).toBe('c:c')
    expect(read('바탕 점검: 변수 범위 틀림', '바탕: (3)')).toBe('c:c')
    expect(read('바탕 점검: 1 없음, 2 바름, 3 바름')).toBeUndefined()
    expect(read('바탕 점검: 1 없음, 2 바름, 3 없음')).toBeUndefined()
    expect(read('')).toBeUndefined()
    expect(read('바탕 점검: 잘 모르겠음')).toBeUndefined()
    expect(read('바탕 점검: 1 틀림, 2 없음, 3 없음')).toBeUndefined()
    expect(read('바탕 점검: 1 없음, 2 없음, 3 틀림', '바탕: 0')).toBeUndefined()
    expect(read('바탕 점검: 1 없음, 2 없음, 3 틀림', '바탕: 3', '바탕 근거: 없음')).toBeUndefined()
    expect(read('바탕 점검: 1 없음, 2 없음, 3 틀림', '바탕: 1, 3')).toBeUndefined()
    // baseOf as 1.9.0 read it, under it: the same key for the line as written.
    expect(auditedBase({ base: '3', baseAudit: '3 틀림' }, listed)).toBe(baseOf('3', listed))
    expect(auditedBase({ base: '3' }, listed)).toBeUndefined()
    expect(auditedBase({ baseAudit: '3 틀림' }, listed)).toBeUndefined()
  })

  test('slipNotice · workedNextText: the base promised at the count it is asked at (baseAfter: the code branch\'s alone), the worked example at its own', () => {
    const item = { result: 'wrong' as const, gradedAt: NOW, mine: '3 3 3', slip: 'i가 하나라고 봄', slipType: 'scope' as const }
    const record: LearnSlip = { what: 'i가 하나라고 봄', type: 'scope', question: 'Q', mine: '3 3 3', at: NOW, times: 2, base: 'c:변수범위' }
    expect(slipNotice(item, record, false, 2, true, 2)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_BASE_NEXT}`)
    // A concept met in no code (the plain branch's worked example): no base promised.
    expect(slipNotice(item, record, false, 2, true, Infinity)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_NEXT}`)
    expect(workedNextText(record, true, Infinity)).toBe(WORKED_NEXT)
    expect(workedNextText(record, true, 2)).toBe(WORKED_BASE_NEXT)
    // Not given, the worked example's own (1.9.0's).
    expect(slipNotice(item, record, false, 2, true)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_BASE_NEXT}`)
  })
})
