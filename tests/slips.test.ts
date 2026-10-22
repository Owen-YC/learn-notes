import type { LearnConcept, LearnQuizItem, LearnSlip } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  ACTIVITY_DAYS,
  BANK_KEPT,
  CONCEPTS_KEPT,
  FAULTS_KEPT,
  HISTORY_MAX_BYTES,
  HISTORY_PER_PROJECT,
  HISTORY_PROJECTS,
  OLD_WRITES_MAX,
  SLIPS_KEPT,
  SLIPS_MAX_BYTES,
  STAMPS_KEPT,
  TEAM_NUDGED_KEPT,
  TEAM_TERMS_KEPT,
  TEAM_TERMS_MAX_BYTES,
  addActivity,
  addFault,
  addToBank,
  addUsage,
  checkPrompt,
  cleanSlips,
  conceptKey,
  cutCells,
  cellWidth,
  fitFaults,
  fitDrill,
  fitHistory,
  fitSlips,
  forHistory,
  isForgotten,
  isSlipSaid,
  jsonBytes,
  knownMarks,
  markedConcepts,
  nextSlip,
  parseCheck,
  parseQuiz,
  quizPick,
  quizPrompt,
  recapPrompt,
  rootTag,
  recapSlips,
  slipChange,
  slipFrom,
  slipNotice,
  slipRecordOf,
  slipTypeOf,
  slipsToAsk,
  spreadPicks,
  stamp,
  stepMarks,
  storedConcepts,
  withStamp,
  withTeamTerm,
  type QuizPick,
  type RecapRange,
} from '../hooks/notes'

const NOW = Date.UTC(2026, 9, 3, 1)
const DAY = 86_400_000
const ITEM = { name: '반복문 조건', question: '`for (let i = 0; i < 3; i++) console.log(i)`는 무엇을 찍을까요?', answer: '0 1 2', kind: 'predict' as const }
const SLIP: LearnSlip = { what: 'const면 배열 안도 못 바꾼다고 봄', type: 'reference', question: '`const a = [1]; a.push(2)`의 a는?', mine: '오류가 납니다', at: NOW, times: 1 }

describe('1.7.0: what a grade reads of a slip (D5)', () => {
  test('a grade short of right reads 헷갈린 점 and 유형 as their own lines; a reply without them grades as in 1.6.1', () => {
    const reply = ['판정: 틀림', '피드백: 적은 대로라면 push에서 오류가 나야 합니다.', '되묻기: const가 막는 것은 무엇일까요?', '헷갈린 점: const면 배열 안도 못 바꾼다고 봄', '유형: 값과 참조'].join('\n')
    expect(parseCheck(reply)).toEqual({
      verdict: 'wrong',
      feedback: '적은 대로라면 push에서 오류가 나야 합니다.',
      nudge: 'const가 막는 것은 무엇일까요?',
      slip: 'const면 배열 안도 못 바꾼다고 봄',
      slipType: 'reference',
    })
    // Bold labels, the slip before the question asked back, and a kind none of the nine: 기타.
    const bold = ['**판정:** 거의', '**피드백:** 가까워요.', '**헷갈린 점:** 끝 값을 넣는다고 봄', '**유형:** 반복 횟수', '**되묻기:** i가 3이면요?'].join('\n')
    expect(parseCheck(bold)).toEqual({ verdict: 'partial', feedback: '가까워요.', nudge: 'i가 3이면요?', slip: '끝 값을 넣는다고 봄', slipType: 'other' })
    // No such lines, "없음", or a right grade: none, as before.
    expect(parseCheck('판정: 틀림\n피드백: 아닙니다.')).toEqual({ verdict: 'wrong', feedback: '아닙니다.' })
    for (const none of ['없음', '(없음)', '-', '해당 없음', '']) expect(parseCheck(`판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${none}\n유형: 기타`)).toEqual({ verdict: 'wrong', feedback: '아닙니다.' })
    expect(parseCheck('판정: 맞음\n피드백: 정확합니다.\n헷갈린 점: 없음\n유형: 기타')).toEqual({ verdict: 'right', feedback: '정확합니다.' })
    // A slip with no kind is 기타; a slip on two lines is one; a long one is cut short.
    expect(parseCheck('판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: 첫 줄\n둘째 줄')).toMatchObject({ slip: '첫 줄 둘째 줄', slipType: 'other' })
    expect(parseCheck(`판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${'가'.repeat(200)}`)!.slip).toHaveLength(80)
    // As a JSON object too.
    expect(parseCheck('{"verdict": "partial", "feedback": "가까워요", "slip": "i가 3까지 찍힌다고 봄", "slipType": "경계와 조건"}')).toMatchObject({ slip: 'i가 3까지 찍힌다고 봄', slipType: 'boundary' })
  })

  test('a kind is one of the nine, read on its words, a part of them, or its code; else 기타', () => {
    expect(slipTypeOf('실행 순서·비동기')).toBe('order')
    expect(slipTypeOf('비동기')).toBe('order')
    expect(slipTypeOf('**값과 참조**')).toBe('reference')
    expect(slipTypeOf('변수 범위.')).toBe('scope')
    expect(slipTypeOf('형 변환')).toBe('coercion')
    expect(slipTypeOf('경계와 조건 (끝 값)')).toBe('boundary')
    expect(slipTypeOf('없는 값')).toBe('nullish')
    expect(slipTypeOf('반환과 출력')).toBe('output')
    expect(slipTypeOf('상태가 바뀌는 때')).toBe('state')
    expect(slipTypeOf('scope')).toBe('scope')
    expect(slipTypeOf('기타')).toBe('other')
    expect(slipTypeOf('문법')).toBe('other')
    expect(slipTypeOf(undefined)).toBe('other')
  })

  test('the first grade asks for the slip and its kind; a try again after an answer does not, one after "모르겠어요" does; a slip open is said', () => {
    const first = checkPrompt(ITEM, '0 1 2 3', 'beginner')
    expect(first).toContain('헷갈린 점은 판정이 거의나 틀림일 때만 쓴다. 학습자의 답에 드러난 잘못된 생각을 "~라고 봄"처럼 40자 안팎 한 문장으로 쓴다. 답에서 근거를 찾을 수 없으면 없음이라고 쓴다.')
    expect(first).toContain('유형은 그 헷갈린 점의 갈래다. 실행 순서·비동기, 값과 참조, 변수 범위, 자료형·형 변환, 경계와 조건, 없는 값, 반환과 출력, 상태가 바뀌는 때, 기타 중 하나를 그대로 쓴다.')
    expect(first).toMatch(/\n되묻기: \(거의·틀림일 때만 질문 한 문장\. 맞음이면 이 줄을 쓰지 않는다\)\n헷갈린 점: \(거의·틀림일 때만 한 문장\. 맞음이면 이 줄을 쓰지 않는다\)\n유형: \(거의·틀림일 때만 위 갈래 중 하나\)$/)
    expect(first).not.toContain('지난번에 헷갈린 점')

    const again = checkPrompt(ITEM, '0 1 2', 'beginner', { mine: '0 1 2 3', verdict: 'partial', feedback: '아쉬워요.', nudge: 'i가 3이면요?' })
    expect(again).not.toContain('헷갈린 점')
    expect(again).not.toContain('유형')
    const hinted = checkPrompt(ITEM, '0 1 2 3', 'beginner', { mine: '모르겠어요', verdict: 'wrong', feedback: '', nudge: '조건을 보세요' })
    expect(hinted).toMatch(/\n헷갈린 점: \(거의·틀림일 때만 한 문장\. 맞음이면 이 줄을 쓰지 않는다\)\n유형: \(거의·틀림일 때만 위 갈래 중 하나\)$/)

    // The slip still open, said after the model answer, and how to name it once mended.
    const past = checkPrompt(ITEM, '0 1 2', 'beginner', undefined, { what: '끝 값까지 찍힌다고 봄', mine: '0 1 2 3' })
    expect(past).toContain('## 모범 답\n0 1 2\n## 이 학습자가 지난번에 헷갈린 점\n끝 값까지 찍힌다고 봄\n## 학습자의 답\n0 1 2')
    expect(past).toContain('이번 답이 지난번에 헷갈린 점을 바로잡았으면 피드백에서 한 마디로 짚는다.')
    expect(checkPrompt(ITEM, '0 1 2', 'beginner', undefined, { what: '', mine: '모르겠어요' })).toContain('## 이 학습자가 지난번에 헷갈린 점\n(지난번에는 답을 떠올리지 못했다)\n')
    // A blank one from a real answer too short to read ("10"): said so, not as nothing recalled (review fix).
    const short = checkPrompt(ITEM, '0 1 2', 'beginner', undefined, { what: '', mine: '10' })
    expect(short).toContain('## 이 학습자가 지난번에 헷갈린 점\n(지난번 답이 짧아 헷갈린 점을 알 수 없다)\n')
    expect(short).not.toContain('떠올리지 못했다')
  })
})

describe('1.7.0: a slip kept, asked again and mended (D5)', () => {
  const graded = (over: Partial<LearnQuizItem>): LearnQuizItem => ({ key: 'c:const선언', name: 'const 선언', question: '문제', answer: '답', ...over })

  test('an answer with nothing to read a slip from is blank, whatever Claude named: "모르겠어요", or two characters or fewer', () => {
    // "??" and 오류 are answers to grade (isBlankAnswer), but too short to read a slip from.
    for (const blank of ['모르겠어요', '?', '3', '10', ' 1 0 ', '몰라', '??', '오류']) expect(isForgotten(blank)).toBe(true)
    for (const answer of ['0 1 2', 'abc', '오류남', '모르겠어요 아마 3']) expect(isForgotten(answer)).toBe(false)
    expect(slipFrom(graded({ mine: '3', slip: '끝 값을 넣는다고 봄', slipType: 'boundary' }))).toEqual({ what: '', type: 'blank', mine: '3' })
    expect(slipFrom(graded({ mine: '모르겠어요' }))).toEqual({ what: '', type: 'blank', mine: '모르겠어요' })
  })

  test('the slip comes from the first try when the question was asked back over one, else from the answer; none with nothing typed or named', () => {
    const first = { mine: '오류가 납니다', verdict: 'wrong' as const, feedback: '', nudge: '?', at: NOW, slip: SLIP.what, slipType: 'reference' as const }
    expect(slipFrom(graded({ mine: '여전히 오류', firstTry: first }))).toEqual({ what: SLIP.what, type: 'reference', mine: '오류가 납니다' })
    // After "모르겠어요" the answer after the hint was the first one graded: its own slip.
    expect(slipFrom(graded({ mine: 'a가 바뀌지 않음', slip: '바뀌지 않는다고 봄', slipType: 'state', firstTry: { ...first, mine: '모르겠어요', slip: undefined } }))).toEqual({
      what: '바뀌지 않는다고 봄',
      type: 'state',
      mine: 'a가 바뀌지 않음',
    })
    expect(slipFrom(graded({ mine: '긴 답이지만 근거는 없음' }))).toBeUndefined()
    expect(slipFrom(graded({}))).toBeUndefined()
  })

  test('how a grade changes a slip: a miss keeps it, right after a question asked back too, unless turned right by the learner', () => {
    const how = { isHelped: false, isGraduated: false }
    const missed = graded({ result: 'wrong', mine: '오류가 납니다', slip: SLIP.what, slipType: 'reference' })
    expect(slipChange(missed, how)).toEqual({ kind: 'missed', question: '문제', what: SLIP.what, type: 'reference', mine: '오류가 납니다' })
    expect(slipChange(graded({ result: 'wrong', mine: '긴 답이지만 근거는 없음' }), how)).toEqual({ kind: 'none' })
    expect(slipChange(graded({ result: 'wrong' }), how)).toEqual({ kind: 'none' })
    const first = { mine: '오류가 납니다', verdict: 'wrong' as const, feedback: '', nudge: '?', at: NOW, slip: SLIP.what, slipType: 'reference' as const }
    const mended = graded({ result: 'right', mine: '[1, 2]', firstTry: first, isRetry: true })
    expect(slipChange(mended, { isHelped: true, isGraduated: false })).toMatchObject({ kind: 'missed', what: SLIP.what, isRight: true })
    expect(slipChange(mended, { isHelped: true, isGraduated: false, isTurned: true })).toEqual({ kind: 'right', isRetry: true, isHelped: true, isGraduated: false })
    expect(slipChange(graded({ result: 'right', mine: '[1, 2]', isRetry: true }), how)).toEqual({ kind: 'right', isRetry: true, isHelped: false, isGraduated: false })
  })

  test('a miss of the same kind counts again on an open slip, opens a mended one from one; another kind takes its place; what is kept is masked and cut', () => {
    const made = nextSlip(undefined, { kind: 'missed', question: '문제\n  둘째 줄', what: SLIP.what, type: 'reference', mine: `키는 sk-ant-api03-${'A'.repeat(20)} 입니다` }, NOW)
    expect(made).toEqual({ what: SLIP.what, type: 'reference', question: '문제 둘째 줄', mine: '키는 «가림» 입니다', at: NOW, times: 1 })
    // Open: counted once more on it, the latest question and answer kept.
    const twice = nextSlip(made, { kind: 'missed', question: '새 문제', what: '다른 말', type: 'reference', mine: '또 오류' }, NOW + DAY)
    expect(twice).toEqual({ what: SLIP.what, type: 'reference', question: '새 문제', mine: '또 오류', at: NOW + DAY, times: 2 })
    // Mended (1.8.0, 교차 검토: times counts misses running, for 풀이 보고 풀기): opened again from one, its words kept.
    const again = nextSlip({ ...made!, times: 3, fixedAt: NOW }, { kind: 'missed', question: '새 문제', what: '다른 말', type: 'reference', mine: '또 오류' }, NOW + DAY)
    expect(again).toEqual({ what: SLIP.what, type: 'reference', question: '새 문제', mine: '또 오류', at: NOW + DAY, times: 1 })
    // Nothing recalled where a slip with words is open (review fix): counted on it, its words and the answer that showed them kept.
    const blank = { kind: 'missed' as const, question: 'q', what: '', type: 'blank' as const, mine: '몰라' }
    expect(nextSlip(again, blank, NOW + 2 * DAY)).toEqual({ ...again, at: NOW + 2 * DAY, times: 2 })
    // Over one mended, or one with no words, the blank one is kept as it is.
    expect(nextSlip({ ...again!, fixedAt: NOW + DAY }, blank, NOW + 2 * DAY)).toEqual({ what: '', type: 'blank', question: 'q', mine: '몰라', at: NOW + 2 * DAY, times: 1 })
    const blanks = nextSlip(undefined, blank, NOW)!
    expect(nextSlip(blanks, { ...blank, question: 'q2', mine: '3' }, NOW + DAY)).toEqual({ what: '', type: 'blank', question: 'q2', mine: '3', at: NOW + DAY, times: 2 })
    // A blank one mended, then nothing recalled again: from one too.
    expect(nextSlip({ ...blanks, times: 2, fixedAt: NOW }, { ...blank, question: 'q2', mine: '3' }, NOW + DAY)).toEqual({ what: '', type: 'blank', question: 'q2', mine: '3', at: NOW + DAY, times: 1 })
    const long = nextSlip(undefined, { kind: 'missed', question: '문'.repeat(500), what: '가'.repeat(200), type: 'other', mine: '답'.repeat(500) }, NOW)!
    expect([long.what.length, long.question.length, long.mine.length]).toEqual([80, 240, 160])
  })

  test('a slip kept by a grade still right after the question asked back says so (isRight), until a miss counts on it; the store keeps it', () => {
    const right = nextSlip(undefined, { kind: 'missed', question: '문제', what: SLIP.what, type: 'reference', mine: '오류가 납니다', isRight: true }, NOW)!
    expect(right).toEqual({ ...SLIP, question: '문제', isRight: true })
    expect(nextSlip(right, { kind: 'missed', question: '문제', what: SLIP.what, type: 'reference', mine: '또 오류' }, NOW + DAY)).toEqual({ ...SLIP, question: '문제', mine: '또 오류', at: NOW + DAY, times: 2 })
    expect(nextSlip(right, { kind: 'missed', question: 'q', what: '', type: 'blank', mine: '몰라' }, NOW + DAY)).toEqual({ ...SLIP, question: '문제', at: NOW + DAY, times: 2 })
    expect(slipRecordOf(JSON.parse(JSON.stringify(right)))).toEqual(right)
    expect(slipRecordOf({ ...SLIP, isRight: 'yes' })).toEqual(SLIP)
  })

  test('the next quiz asks again each slip open and not gone over since its grade, due or not, the oldest first; one right after the question asked back waits a day', () => {
    const concept = (over: Partial<LearnConcept> = {}): LearnConcept => ({ name: 'x', count: 1, firstAt: NOW - 9 * DAY, lastAt: NOW - 9 * DAY, blurb: '', files: [], step: 3, reviewedAt: NOW, ...over })
    const index: Record<string, LearnConcept> = {
      'c:partial': concept({ name: 'partial' }),
      'c:older': concept({ name: 'older', reviewedAt: NOW - DAY }),
      'c:gone-over': concept({ name: 'gone-over', reviewedAt: NOW + 60_000 }),
      'c:known': concept({ name: 'known', knownAt: NOW }),
      'c:mended': concept({ name: 'mended' }),
      'c:right': concept({ name: 'right' }),
    }
    const slips: Record<string, LearnSlip> = {
      'c:partial': SLIP,
      'c:older': { ...SLIP, at: NOW - DAY },
      'c:gone-over': SLIP,
      'c:known': SLIP,
      'c:mended': { ...SLIP, fixedAt: NOW },
      'c:right': { ...SLIP, isRight: true },
      'c:gone': SLIP,
    }
    expect(slipsToAsk(index, slips, NOW + 60_000)).toEqual(['c:older', 'c:partial'])
    expect(slipsToAsk(index, slips, NOW + DAY)).toEqual(['c:older', 'c:partial', 'c:right'])
    // Taken first, due or not, before the ones due; one marked known never.
    const picked = quizPick(index, NOW + DAY, 3, ['c:known', 'c:right', 'c:partial'])
    expect(picked.map(one => one.key).slice(0, 2)).toEqual(['c:right', 'c:partial'])
    expect(quizPick(index, NOW + DAY, 3).map(one => one.key)).toEqual(quizPick(index, NOW + DAY, 3, []).map(one => one.key))
    // Spread over the notes as a miss is: a slip to ask again never waits for another note.
    const one = (key: string, noteId: string) => ({ ...concept(), key, noteId }) as QuizPick
    const candidates = [one('c:a', 'n1'), one('c:b', 'n1'), one('c:c', 'n2'), one('c:d', 'n3')]
    expect(spreadPicks(candidates, 3).map(pick => pick.key)).toEqual(['c:a', 'c:c', 'c:d'])
    expect(spreadPicks(candidates, 3, () => true, pick => pick.key === 'c:b').map(pick => pick.key)).toEqual(['c:a', 'c:b', 'c:c'])
  })

  test('right on a question asked again mends it on another day only, with no hint or question asked back; graduating and 안다 always do', () => {
    const right = { kind: 'right' as const, isRetry: true, isHelped: false, isGraduated: false }
    expect(nextSlip(SLIP, right, NOW + DAY)).toEqual({ ...SLIP, fixedAt: NOW + DAY })
    expect(nextSlip(SLIP, right, NOW + 60_000)).toEqual(SLIP)
    expect(nextSlip(SLIP, { ...right, isHelped: true }, NOW + DAY)).toEqual(SLIP)
    expect(nextSlip(SLIP, { ...right, isRetry: false }, NOW + DAY)).toEqual(SLIP)
    expect(nextSlip(SLIP, { ...right, isRetry: false, isGraduated: true }, NOW + 60_000)).toEqual({ ...SLIP, fixedAt: NOW + 60_000 })
    expect(nextSlip(SLIP, { kind: 'mended' }, NOW + 5)).toEqual({ ...SLIP, fixedAt: NOW + 5 })
    // One mended stays as it was mended; none stays none.
    expect(nextSlip({ ...SLIP, fixedAt: NOW }, { kind: 'mended' }, NOW + DAY)).toEqual({ ...SLIP, fixedAt: NOW })
    expect(nextSlip(undefined, right, NOW + DAY)).toBeUndefined()
    expect(nextSlip(SLIP, { kind: 'none' }, NOW + DAY)).toBe(SLIP)
  })

  test('the slips read back: bad ones dropped, merges followed (the latest miss kept), a mended one let go 60 days on', () => {
    const raw = {
      'c:const선언': SLIP,
      'c:old': { ...SLIP, what: '옛 이름의 것', at: NOW - DAY },
      'c:merged-new': { ...SLIP, what: '합친 뒤의 것', at: NOW + 1 },
      'c:mended-long-ago': { ...SLIP, fixedAt: NOW - 61 * DAY },
      'c:mended-lately': { ...SLIP, fixedAt: NOW - 59 * DAY },
      'c:bad-type': { ...SLIP, type: 'syntax' },
      'c:no-at': { what: 'x', type: 'other' },
      'not-a-key': SLIP,
      'c:times': { ...SLIP, times: 0, question: 3 },
    }
    const out = cleanSlips(raw, { 'c:old': 'c:const선언', 'c:merged-new': 'c:const선언' }, NOW)
    expect(Object.keys(out).sort()).toEqual(['c:const선언', 'c:mended-lately', 'c:times'])
    expect(out['c:const선언']!.what).toBe('합친 뒤의 것')
    expect(out['c:times']).toEqual({ ...SLIP, times: 1, question: '' })
    expect(cleanSlips([SLIP], {}, NOW)).toEqual({})
    expect(cleanSlips(undefined, {}, NOW)).toEqual({})
  })

  test('past SLIPS_KEPT the mended go first, the longest mended first, then the open missed longest ago; and never past SLIPS_MAX_BYTES', () => {
    const many: Record<string, LearnSlip> = {}
    for (let i = 0; i < SLIPS_KEPT + 5; i += 1) many[`c:open${i}`] = { ...SLIP, at: NOW + i }
    for (let i = 0; i < 3; i += 1) many[`c:mended${i}`] = { ...SLIP, at: NOW - DAY, fixedAt: NOW + i }
    const kept = fitSlips(many)
    expect(Object.keys(kept)).toHaveLength(SLIPS_KEPT)
    expect(Object.keys(kept).some(key => key.startsWith('c:mended'))).toBe(false)
    expect(kept['c:open7']).toBeDefined()
    expect(kept['c:open4']).toBeUndefined()
    // Hangul at every cap: the bytes bound the count first.
    const wide: Record<string, LearnSlip> = {}
    for (let i = 0; i < SLIPS_KEPT; i += 1) wide[`c:${'개'.repeat(40)}${i}`] = { what: '헷'.repeat(80), type: 'reference', question: '문'.repeat(240), mine: '답'.repeat(160), at: NOW + i, times: 9 }
    const fitted = fitSlips(wide)
    expect(jsonBytes(fitted)).toBeLessThanOrEqual(SLIPS_MAX_BYTES)
    expect(Object.keys(fitted).length).toBeGreaterThan(50)
    expect(fitted[`c:${'개'.repeat(40)}${SLIPS_KEPT - 1}`]).toBeDefined()
  })

  test('the line under a grade: the slip kept, an answer with nothing in it, mended right after a question asked back, asked again and missed again, mended, right again the same day', () => {
    const at = NOW + DAY
    const wrong = { result: 'wrong' as const, gradedAt: at }
    expect(slipNotice(wrong, { ...SLIP, at }, false)).toEqual({ kind: 'slip', text: `헷갈린 점: ${SLIP.what} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })
    expect(slipNotice(wrong, { ...SLIP, what: '', type: 'blank', mine: '모르겠어요', at }, false)).toEqual({ kind: 'blank', text: '떠오르지 않았습니다 · 다음 퀴즈에서 다시 풉니다' })
    // A real answer too short to read a slip from ("10") is not "not recalled" (review fix).
    const short = { kind: 'blank', text: '답이 짧아 헷갈린 점은 적지 않았습니다 · 다음 퀴즈에서 다시 풉니다' }
    expect(slipNotice({ ...wrong, mine: '7', firstTry: { mine: '10', verdict: 'wrong', feedback: '', nudge: '?', at, slip: '곱셈을 덧셈으로 봄', slipType: 'other' } }, { ...SLIP, what: '', type: 'blank', mine: '10', at }, false)).toEqual(short)
    expect(slipNotice(wrong, { ...SLIP, what: '', type: 'blank', mine: '[]', at }, false)).toEqual(short)
    // "모르겠어요" where a slip with words stays open (not asked again): said as nothing recalled, its words kept for the next quiz.
    // Counted twice on it by now: 1.8.0 (E3) says the next review quiz shows a worked example first.
    expect(slipNotice({ ...wrong, mine: '모르겠어요' }, { ...SLIP, at, times: 2 }, false)).toEqual({ kind: 'blank', text: '떠오르지 않았습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다' })
    expect(slipNotice({ ...wrong, mine: '모르겠어요', isRetry: true }, { ...SLIP, at, times: 2 }, false)).toEqual({ kind: 'again', text: '같은 곳을 또 헷갈렸습니다' })
    // Kept by no grade (the schema guard on, a store that refused it): nothing promised.
    expect(slipNotice(wrong, SLIP, false)).toBeUndefined()
    expect(slipNotice(wrong, undefined, false)).toBeUndefined()
    // Asked again: missed again, the same kind counted again or kept by no grade; another kind in its place is said as such.
    expect(slipNotice({ ...wrong, isRetry: true }, { ...SLIP, at, times: 2 }, false)).toEqual({ kind: 'again', text: '같은 곳을 또 헷갈렸습니다' })
    expect(slipNotice({ ...wrong, isRetry: true }, SLIP, false)?.kind).toBe('again')
    expect(slipNotice({ ...wrong, isRetry: true }, { ...SLIP, what: '다른 것', type: 'scope', at }, false)?.kind).toBe('slip')
    const right = { result: 'right' as const, gradedAt: at }
    expect(slipNotice(right, { ...SLIP, at }, true)).toEqual({ kind: 'mended', text: '헷갈린 점을 바로 고쳤습니다 · 다른 날 다른 코드로 한 번 더 확인합니다' })
    expect(slipNotice({ ...right, isRetry: true }, { ...SLIP, fixedAt: at }, false)).toEqual({ kind: 'fixed', text: '✓ 지난번 헷갈린 점을 바로잡았습니다' })
    expect(slipNotice({ result: 'right', gradedAt: NOW + 60_000, isRetry: true }, SLIP, false)).toEqual({ kind: 'soon', text: '바로 다시 맞혔습니다 · 다음 복습에서 한 번 더 확인합니다' })
    expect(slipNotice({ result: 'right', gradedAt: NOW + 60_000, isRetry: true }, SLIP, true)).toBeUndefined()
    // Graduated with no question asked again: the graduation says it.
    expect(slipNotice(right, { ...SLIP, fixedAt: at }, false)).toBeUndefined()
    expect(slipNotice({ gradedAt: at }, SLIP, false)).toBeUndefined()
  })
})

describe('1.7.0: asked again in other code (다시 도전, D5)', () => {
  const pick = (name: string, slip?: QuizPick['slip']): QuizPick & LearnConcept => ({
    key: conceptKey(name),
    name,
    count: 1,
    firstAt: NOW,
    lastAt: NOW,
    blurb: `${name} 설명`,
    files: [],
    ...(slip ? { slip } : {}),
  })

  test('a quiz tells the model the last question, answer and slip of a concept still open, and how to ask again; with none it is 1.6.1\'s', () => {
    const plain = quizPrompt([pick('const 선언'), pick('map')], 'beginner')
    expect(plain).not.toContain('지난번')
    const asked = quizPrompt([pick('const 선언', { what: SLIP.what, question: '`const a = [1]`\n`a.push(2)`의 a는?', mine: '오류가\n납니다' }), pick('map')], 'beginner')
    expect(asked).toContain(`1. const 선언 — const 선언 설명\n   지난번 문제 '\`const a = [1]\` \`a.push(2)\`의 a는?' · 학습자 답 '오류가 납니다' · 헷갈린 점: ${SLIP.what}\n2. map — map 설명`)
    expect(asked).toContain('"지난번" 줄이 붙은 개념은 같은 헷갈림이 드러나는 다른 코드나 값으로 묻는다. 지난 문제를 되풀이하지 않는다. 헷갈린 점을 문제나 힌트에 쓰지 않는다.')
    const blank = quizPrompt([pick('map', { what: '', question: '문제', mine: '모르겠어요' })], 'beginner')
    expect(blank).toContain("   지난번 문제 '문제' · 학습자 답 '모르겠어요' · 답을 떠올리지 못했다\n")
    const short = quizPrompt([pick('map', { what: '', question: '문제', mine: '10' })], 'beginner')
    expect(short).toContain("   지난번 문제 '문제' · 학습자 답 '10' · 답이 짧아 헷갈린 점을 알 수 없다\n")
    expect(short).not.toContain('떠올리지 못했다')
    // A long one stays within 400 characters.
    const long = quizPrompt([pick('map', { what: '헷'.repeat(80), question: '문'.repeat(240), mine: '답'.repeat(160) })], 'beginner')
    const line = long.split('\n').find(one => one.includes('지난번 문제'))!
    expect(line.trim().length).toBeLessThanOrEqual(400)
  })

  test('the question asked over an open slip is a retry; one that says the slip itself is not', () => {
    const picks = [pick('const 선언', { what: SLIP.what, question: '문제', mine: '오류' }), pick('map', { what: '콜백이 원래 배열을 바꾼다고 봄', question: '문제', mine: 'x' }), pick('클로저')]
    const reply = [
      'Q1: `const b = {n: 1}; b.n = 2` 뒤 b.n은?',
      'A1: 2',
      'Q2: 흔히 콜백이 원래 배열을 바꾼다고 봄. `[1,2].map(x => x * 2)` 뒤 원래 배열은?',
      'A2: [1, 2]',
      'Q3: 문제 셋',
      'A3: 답 셋',
    ].join('\n')
    const items = parseQuiz(reply, picks)
    expect(items.map(one => one.isRetry)).toEqual([true, undefined, undefined])
    expect(isSlipSaid('그대로: const면 배열 안도 못 바꾼다고 봄!', SLIP.what)).toBe(true)
    expect(isSlipSaid('const로 만든 배열에 push하면?', SLIP.what)).toBe(false)
    expect(isSlipSaid('아무 문제', '봄')).toBe(false)
  })

  test('a recap says the slips its days found, by concept, and writes 헷갈리기 쉬운 것 from them alone; with none, as before', () => {
    const range: RecapRange = { label: '오늘', from: NOW - DAY / 2, to: NOW + DAY / 2, days: [stamp(NOW).day] }
    const index: Record<string, LearnConcept> = {
      'c:클로저': { name: '클로저', count: 2, firstAt: NOW - DAY, lastAt: NOW, blurb: '', files: [], missedAt: NOW },
      'c:const선언': { name: 'const 선언', count: 1, firstAt: NOW - DAY, lastAt: NOW, blurb: '', files: [], reviewedAt: NOW },
      'c:map': { name: 'map', count: 1, firstAt: NOW - DAY, lastAt: NOW, blurb: '', files: [], knownAt: NOW },
    }
    const slips: Record<string, LearnSlip> = {
      'c:클로저': { ...SLIP, what: '반복문 변수 i를 하나로 공유하는 것을 놓침' },
      'c:const선언': { ...SLIP, fixedAt: NOW },
      'c:map': { ...SLIP, what: '아는 개념이 된 것' },
      'c:old': { ...SLIP, what: '기간 밖', at: NOW - 3 * DAY },
    }
    expect(recapSlips(slips, index, {}, range)).toEqual([
      { name: '클로저', what: '반복문 변수 i를 하나로 공유하는 것을 놓침' },
      { name: 'const 선언', what: SLIP.what },
    ])
    const entries = [{ day: stamp(NOW).day, time: '10:00', request: '고쳐 줘', summary: '고쳤다', files: [], concepts: [] }]
    const prompt = recapPrompt(range, entries, index, {}, 'beginner', false, slips)
    expect(prompt).toContain('## 이 기간에 퀴즈에서 틀린 개념 (아직 다시 맞히지 못한 것)\n클로저 (헷갈린 점: 반복문 변수 i를 하나로 공유하는 것을 놓침)\n\n')
    expect(prompt).toContain(`## 이 기간에 퀴즈에서 헷갈렸다가 그 뒤 맞힌 개념\nconst 선언 (헷갈린 점: ${SLIP.what})\n`)
    expect(prompt).toContain('### 헷갈리기 쉬운 것\n(위에 적힌 학습자의 헷갈린 점만 1~2개, "개념: 헷갈린 점" 꼴로 한 줄씩. 노트만 보고 짐작한 것은 쓰지 않는다)')
    expect(prompt).not.toContain('헷갈리기 쉬운 것은 이 목록부터 쓴다.')
    expect(prompt).not.toContain('아는 개념이 된 것')
    // No slip in its days: 1.6.1's prompt, word for word.
    expect(recapPrompt(range, entries, index, {}, 'beginner', false, { 'c:old': slips['c:old']! })).toBe(recapPrompt(range, entries, index, {}, 'beginner'))
    expect(recapPrompt(range, entries, index, {}, 'beginner')).toContain('클로저\n헷갈리기 쉬운 것은 이 목록부터 쓴다.')
  })

  test('a row is cut to its cells, Hangul two each, with … in the last', () => {
    expect(cellWidth('const 선언')).toBe(10)
    expect(cutCells('짧은 줄', 56)).toBe('짧은 줄')
    const cut = cutCells(`const 선언 · 헷갈린 점: ${'배열 안도 못 바꾼다고 봄 '.repeat(4)}`, 56)
    expect(cellWidth(cut)).toBeLessThanOrEqual(56)
    expect(cut.endsWith('…')).toBe(true)
  })
})

/**
 * The store's whole worst case, tracked here as each release adds keys (a new key joins the fixture below): every key
 * at its caps with every text in Hangul (three bytes a character, the main audience's language), and 40 merges. As of
 * 1.7.0 (7/8, a day's practices counted in the activity record, a practice's state on each note inside the history's
 * cap) it comes to 3,671,247 bytes: past the plan's 3.5MB budget by 1.6's keys alone (history 2MB, quizBank 0.81MB,
 * concepts 0.43MB, which this release does not cut); 1.7.0's own keys (slips, faults, sessions, schema, quotaToast,
 * and D6's teamTerms and teamNudged) take about 0.18MB of it. The store refuses a write that would take it past
 * 4,194,304 in all (4 MiB): Claude Code counts the UTF-16 characters of its compact JSON, never more than the UTF-8
 * bytes counted here, so this byte test is the stricter one. About 0.52MB is left, and STORE_WORST holds the line so
 * no key grows into it unseen. 1.9.0 (F1) adds the writer's mark in the concept index and oldWrites, 72 bytes in all:
 * 3,671,370 bytes.
 */
const STORE_LIMIT = 4 * 1024 * 1024
const STORE_WORST = 3_672_000

describe('1.7.0: the store at its worst, in Hangul, stays clear of its 4 MiB (D5, the storage budget test brought forward)', () => {
  test('notes 12 projects × 30, concepts 400, questions 300, slips 300, team terms 150, merges 40: every key at its caps, every text Hangul', { timeoutMs: 30_000 }, () => {
    // Every text in Hangul, three bytes a character: code with Korean in it is the worst any key holds.
    const hangul = (n: number, seed = 0) => Array.from({ length: n }, (_, i) => String.fromCharCode(0xac00 + ((i + seed) % 400))).join('')
    const mixed = hangul
    const history: Record<string, { at: number; notes: ReturnType<typeof forHistory>[] }> = {}
    for (let p = 0; p < HISTORY_PROJECTS; p += 1) {
      const notes = Array.from({ length: HISTORY_PER_PROJECT }, (_, i) =>
        forHistory({
          id: `n${p}-${i}`,
          turnId: `t${i}`,
          at: NOW - i,
          prompt: hangul(2000, i),
          answer: hangul(2000, i),
          changes: Array.from({ length: 12 }, (_, f) => ({
            file: `src/feature/${f}.ts`,
            path: `/proj${p}/src/feature/${f}.ts`,
            tool: 'Edit' as const,
            kind: 'update' as const,
            added: 20,
            removed: 20,
            diff: `@@ -1,20 +1,20 @@\n${Array.from({ length: 20 }, () => `+${mixed(60)}`).join('\n')}`,
            isCut: false,
          })),
          moreFiles: 0,
          status: 'ready',
          text: mixed(6000, i),
          savedAs: 'ready',
          isPast: true,
          root: `/proj${p}`,
          updatedAt: NOW,
          concepts: [],
          asks: Array.from({ length: 3 }, () => ({ question: hangul(1000), answer: mixed(4000), at: NOW })),
          // A practice tried (1.7.0 D8): 1KB at most on its note, inside the history's cap.
          drill: fitDrill({ mine: mixed(500), verdict: 'partial', feedback: hangul(600), isAnswerSeen: true, at: NOW }),
        }),
      )
      history[`/proj${p}`] = { at: NOW - p, notes }
    }
    const fitted = fitHistory(history, '/proj0')
    expect(jsonBytes(fitted)).toBeLessThanOrEqual(HISTORY_MAX_BYTES)

    const index: Record<string, LearnConcept> = {}
    for (let i = 0; i < CONCEPTS_KEPT; i += 1) {
      const name = `${hangul(36, i)}${String(i).padStart(4, '0')}`
      index[conceptKey(name)] = { name, count: 99, firstAt: NOW, lastAt: NOW, blurb: mixed(160, i), files: Array.from({ length: 5 }, (_, f) => `src/components/feature-area/${f}/index.tsx`), reviewedAt: NOW, step: 4, knownAt: NOW }
    }
    const bank = addToBank([], Array.from({ length: BANK_KEPT }, (_, i) => ({ key: `c:${hangul(40, i)}`, name: hangul(40, i), question: `${mixed(396, i)}${i}`, answer: mixed(400, i), at: NOW + i })), NOW)
    const item: LearnQuizItem = {
      key: `c:${hangul(40)}`,
      name: hangul(40),
      question: mixed(1200),
      answer: mixed(1200),
      hint: hangul(300),
      isHinted: true,
      isShown: true,
      result: 'wrong',
      gradedAt: NOW,
      mine: mixed(1500),
      verdict: 'partial',
      feedback: hangul(600),
      before: { reviewedAt: NOW, missedAt: NOW, step: 5, knownAt: NOW },
      isLearnerGraded: true,
      kind: 'predict',
      noteId: 'n'.repeat(30),
      firstTry: { mine: mixed(1500), verdict: 'wrong', feedback: hangul(600), nudge: hangul(300), at: NOW, slip: hangul(80), slipType: 'reference' },
      isRetry: true,
      // Its rung (1.8.0, E3): the longest of the four names.
      rung: 'changed',
      slip: hangul(80),
      slipType: 'reference',
      slipBefore: { what: hangul(80), type: 'reference', question: mixed(240), mine: mixed(160), at: NOW, times: 99, fixedAt: NOW },
      // A team term (1.7.0 D6): where its lines are, its repository, and the words its grade puts in the concept index.
      team: true,
      teamCode: { file: hangul(120), from: 999_999, to: 999_999, isDoc: true },
      teamTag: 'z'.repeat(12),
      teamBlurb: mixed(160),
    }
    let activity = {}
    let usage = {}
    for (let d = 0; d < ACTIVITY_DAYS + 10; d += 1) {
      const day = stamp(NOW - d * DAY).day
      activity = addActivity(activity, day, { notes: 999, right: 999, wrong: 999, drills: 999 })
      usage = addUsage(usage, day, { calls: 9999, auto: 999, input: 999_999_999, output: 99_999_999 })
    }
    let faults: ReturnType<typeof addFault> = []
    for (let i = 0; i < FAULTS_KEPT * 3; i += 1) faults = addFault(faults, 'store', `code-${i}`, NOW + i * 3_600_000)
    let sessions = {}
    for (let i = 0; i < STAMPS_KEPT + 4; i += 1) sessions = withStamp(sessions, `session-${'s'.repeat(30)}-${i}`, '1.7.0', NOW + i)
    const slips: Record<string, LearnSlip> = {}
    for (let i = 0; i < SLIPS_KEPT; i += 1) slips[`c:${hangul(36, i)}${i}`] = { what: hangul(80, i), type: 'reference', question: mixed(240, i), mine: mixed(160, i), at: NOW + i, times: 99 }
    // Team terms (1.7.0 D6): a name of 40 characters at most, each marked in five repositories; as many repositories toasted.
    let teamTerms: Record<string, string[]> = {}
    for (let i = 0; i < TEAM_TERMS_KEPT + 20; i += 1) for (let r = 0; r < 5; r += 1) teamTerms = withTeamTerm(teamTerms, conceptKey(`${hangul(36, i)}${String(i).padStart(4, '0')}`), rootTag(`/proj${r}`))
    const teamNudged = Array.from({ length: TEAM_NUDGED_KEPT }, (_, i) => rootTag(`/proj${i}`))

    // Merges are the learner's own (/learn 합치기), one by one, so no cap: 40 is a lot of them.
    const merged = Array.from({ length: 40 }, (_, i) => `c:${hangul(36, 1000 + i)}${i}`)
    const aliases = Object.fromEntries(merged.map((key, i) => [key, Object.keys(index)[i]!]))
    const merges = Object.fromEntries(merged.map((key, i) => [key, { concept: storedConcepts({ [key]: index[Object.keys(index)[i]!]! })[key], into: Object.keys(index)[i]!, both: 3 }]))

    const store: Record<string, unknown> = {
      // At its cap whatever the fixture came to: the history is cut to it (fitHistory).
      history: HISTORY_MAX_BYTES,
      // With the writer's mark 1.9.0 puts beside the concepts (F1).
      concepts: markedConcepts(index, NOW),
      aliases,
      merges,
      known: knownMarks(index),
      steps: stepMarks(index),
      quizBank: bank,
      quiz: { at: NOW, isRevealed: false, items: [item, item, item] },
      activity,
      usage,
      faults: fitFaults({ list: faults, noticeDay: '2026-10-03' }),
      sessions,
      slips: cleanSlips(slips, {}, NOW + DAY),
      teamTerms,
      teamNudged,
      schema: 3,
      stepsFrom: NOW,
      welcomed: true,
      limitToast: '2026-10-03',
      quotaToast: '2026-10-03',
      // 1.9.0's one new key (F1), at its longest.
      oldWrites: { since: NOW, last: NOW, n: OLD_WRITES_MAX },
    }
    const sizes = Object.fromEntries(Object.entries(store).map(([key, value]) => [key, key === 'history' ? HISTORY_MAX_BYTES : jsonBytes(value)]))
    const total = Object.values(sizes).reduce((sum, n) => sum + n, 0)
    expect(sizes.slips!).toBeLessThanOrEqual(SLIPS_MAX_BYTES)
    expect(sizes.teamTerms!).toBeLessThanOrEqual(TEAM_TERMS_MAX_BYTES)
    expect(sizes.teamNudged!).toBeLessThanOrEqual(500)
    // 1.7.0's own keys, within what they were planned to take.
    const added = ['slips', 'faults', 'sessions', 'schema', 'quotaToast', 'teamTerms', 'teamNudged'].reduce((sum, key) => sum + sizes[key]!, 0)
    expect(added).toBeLessThanOrEqual(190_000)
    // 1.9.0's (F1): the writer's mark in the index, and its one new key, under 100 bytes.
    expect(sizes.oldWrites!).toBeLessThan(100)
    expect(jsonBytes(markedConcepts(index, NOW)) - jsonBytes(storedConcepts(index))).toBeLessThanOrEqual(20)
    // The whole: no key may grow unseen past this, and the store's limit stays well clear.
    expect(total).toBeLessThanOrEqual(STORE_WORST)
    expect(STORE_LIMIT - total).toBeGreaterThanOrEqual(500_000)
  })
})
