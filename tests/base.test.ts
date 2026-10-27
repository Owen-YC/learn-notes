import type { LearnConcept, LearnQuizItem, LearnSlip } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  BASE_CANDIDATES,
  BASE_LABEL,
  BASE_LEAD,
  IS_BASE_ASKED,
  SLIP_AGAIN,
  WORKED_AFTER_TIMES,
  WORKED_BASE_NEXT,
  WORKED_NEXT,
  baseCandidates,
  baseFor,
  baseOf,
  checkPrompt,
  isBaseKey,
  isWorkedNext,
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
/** The code a note met a concept in (1.9.0: a worked example, and the base asked before it, only for one met in code). */
const CODE = { file: 'a.js', text: 'for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))' }

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

  test('checkPrompt: the bases numbered after the slip open, the sentence after the kind\'s, the 바탕 근거 and 바탕 lines between the slip\'s and the kind\'s', () => {
    const i = INPUT_18
    const bases = ['변수 범위', '화살표 함수']
    const prompt = checkPrompt(i.item, i.mine, 'beginner', undefined, i.past, { bases })
    const block = '## 학습자가 전에 배운 개념\n1. 변수 범위\n2. 화살표 함수\n'
    const sentence =
      '바탕은 판정이 거의나 틀림일 때만 쓴다. 이번 답의 헷갈림이 위 목록에 있는 개념 하나를 잘못 알아서 생겼다는 근거가 답에 있으면, 바탕 근거에 답의 그 말을 짧게 쓰고 바탕에 그 개념의 번호 하나를 쓴다. 근거가 없거나 이 개념 안에서 생긴 헷갈림이면 바탕 근거는 없음, 바탕은 0이라고 쓴다.\n'
    const line = '바탕 근거: (답의 어느 말이 위 개념을 잘못 안 것인지 짧게, 없으면 없음)\n바탕: (위 번호 하나, 없으면 0)\n'
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
    // Each concept met in code (1.9.0: a worked example, and its base, only then).
    const inCode = () => CODE
    expect(slipCounts({ a: slip({ base: 'c:x' }), b: slip({ base: 'c:y', fixedAt: NOW }), c: slip({}) }, 2, inCode).based).toBe(1)
    expect(slipCounts({}).based).toBe(0)
    // Missed once or three times running, or set right on its try again: a base no quiz asks is not counted (4/5 검토).
    expect(slipCounts({ a: slip({ base: 'c:x', times: 3 }), b: slip({ base: 'c:y', times: 1 }), c: slip({ base: 'c:z', isRight: true }) }, 2, inCode).based).toBe(0)
    expect(slipCounts({ a: slip({ base: 'c:x' }) }, Infinity, inCode).based).toBe(0)
    expect(slipCounts({ a: slip({ base: 'c:x', times: 2 }) }, undefined, inCode).based).toBe(2 === WORKED_AFTER_TIMES ? 1 : 0)
  })

  test('slipNotice: a second miss that makes the next quiz a worked example says the base comes first, only with one and bases asked', () => {
    const item = { result: 'wrong' as const, gradedAt: NOW, mine: '3 3 3', slip: 'i가 하나라고 봄', slipType: 'scope' as const }
    const record: LearnSlip = { what: 'i가 하나라고 봄', type: 'scope', question: 'Q', mine: '3 3 3', at: NOW, times: 2, base: 'c:변수범위' }
    expect(slipNotice(item, record, false, 2, true, CODE)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_BASE_NEXT}`)
    expect(slipNotice(item, record, false, 2, false, CODE)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_NEXT}`)
    const { base, ...none } = record
    expect(slipNotice(item, none, false, 2, true, CODE)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_NEXT}`)
    // "모르겠어요" asks no base (4/5 검토): 1.8.0's line, whatever the record holds.
    expect(slipNotice({ ...item, mine: '모르겠어요' }, record, false, 2, true, CODE)?.text).toBe(`떠오르지 않았습니다 · ${WORKED_NEXT}`)
    // Missed a third time running: a worked example with no base before it (baseFor), and said so.
    expect(slipNotice(item, { ...record, times: 3 }, false, 2, true, CODE)?.text).toBe(`헷갈린 점: i가 하나라고 봄 · ${WORKED_NEXT}`)
    // Missed once: no worked example, no base said.
    expect(slipNotice(item, { ...record, times: 1 }, false, 2, true, CODE)?.text).toBe('헷갈린 점: i가 하나라고 봄 · 다음 퀴즈에서 다른 코드로 다시 묻습니다')
    // A concept no code met (1.9.0): no worked example, so no base either, as in 1.7.
    expect(slipNotice(item, record, false, 2, true)?.text).toBe('헷갈린 점: i가 하나라고 봄 · 다음 퀴즈에서 다른 코드로 다시 묻습니다')
    // A question asked again: the callers add workedNextText after SLIP_AGAIN.
    expect(slipNotice({ ...item, isRetry: true }, record, false, 2, true, CODE)).toEqual({ kind: 'again', text: SLIP_AGAIN })
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
  const find = (picks: QuizPick[], x: LearnSlip = slip(), more: Record<string, LearnSlip> = {}, asking = [k('클로저')], how: Parameters<typeof baseFor>[6] = {}) => {
    const open = slips(x, more)
    return baseFor(index, key => open[key], picks, new Set(asking), {}, open, { workedAfter: 2, ...how })
  }
  // X met in code (1.9.0: a worked example, and its base, only then).
  const X = pick('클로저', { slip: { what: 'i가 하나라고 봄', question: 'Q', mine: '3 3 3' }, code: CODE })
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
    expect(baseFor(index, key => open[key], [X, D, F], new Set([k('클로저')]), { 'c:scope': k('변수 범위') }, open, { workedAfter: 2 })?.key).toBe(k('변수 범위'))
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
    // X met in no code (1.9.0): asked again, not by a worked example, and no base before it.
    const { code, ...bare } = X
    expect(find([bare, D, F])).toBeUndefined()
    expect(code).toEqual(CODE)
  })

  test('the line under a miss promises the base just where baseFor asks one: missed workedAfter times running, not set right (4/5 검토), met in code (1.9.0)', () => {
    const { code, ...bare } = X
    for (const times of [1, 2, 3, 4]) {
      for (const isRight of [false, true]) {
        for (const x of [X, bare] as QuizPick[]) {
          const one = slip({ times, at: NOW, ...(isRight ? { isRight: true as const } : {}) })
          const said = isWorkedNext(one, { gradedAt: NOW }, 2, x.code) && workedNextText(one, true, 2) === WORKED_BASE_NEXT
          expect([times, isRight, x.code !== undefined, said]).toEqual([times, isRight, x.code !== undefined, find([x, D, F], one) !== undefined])
        }
      }
    }
    expect(code).toEqual(CODE)
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
