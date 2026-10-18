import type { LearnConcept, LearnSlip } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  RUNG_CHANGED_STEP,
  RUNG_NEW_STEP,
  WORKED_AFTER_TIMES,
  WORKED_NEXT,
  addToBank,
  bankQuestion,
  extOf,
  isWorkedNext,
  markFor,
  markHelped,
  markPartial,
  markReviewed,
  markWrong,
  parseQuiz,
  pickForRung,
  quizPrompt,
  rungOf,
  slipNotice,
  type QuizPick,
} from '../hooks/notes'

const NOW = Date.UTC(2026, 9, 3, 1)
const DAY = 86_400_000

/** A concept at `step`, its code in `file` when given. */
const at = (step: number): LearnConcept => ({ name: 'A', count: 2, firstAt: 0, lastAt: 0, blurb: '', files: [], step })
const CODE = { file: 'src/cart.js', text: 'let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)' }
const plain = { isAsking: false, isTeam: false, isDue: true }
const SLIP: LearnSlip = { what: '반복이 끝나면 total이 0으로 돌아간다고 봄', type: 'state', question: '`total`은?', mine: '0', at: NOW, times: 1 }
const pick = (name: string, more: Partial<QuizPick> = {}): QuizPick => ({ key: `c:${name}`, name, count: 1, firstAt: 0, lastAt: 0, blurb: `${name} 설명`, files: [], ...more })

describe('1.8.0: the question ladder, which code a question asks in (E3)', () => {
  test('the rung goes by the review step: own code for the first two, changed code from the third; code never seen is off', () => {
    expect(RUNG_CHANGED_STEP).toBe(2)
    expect(RUNG_NEW_STEP).toBe(Infinity)
    expect(WORKED_AFTER_TIMES).toBe(2)
    expect(rungOf(at(0), { ...plain, code: CODE })).toBe('mine')
    expect(rungOf(at(1), { ...plain, code: CODE })).toBe('mine')
    expect(rungOf(at(2), { ...plain, code: CODE })).toBe('changed')
    expect(rungOf(at(3), { ...plain, code: CODE })).toBe('changed')
    // Off by default: step 5 in code a sample could run is asked in its code changed.
    expect(rungOf(at(5), { ...plain, code: CODE })).toBe('changed')
    // Switched on (1.8.x, 4): due, in a language a sample ran.
    expect(rungOf(at(4), { ...plain, code: CODE }, 4)).toBe('new')
    expect(rungOf(at(4), { ...plain, code: { file: 'app.css' } }, 4)).toBe('changed')
    expect(rungOf(at(4), plain, 4)).toBeUndefined()
    // A concept filling the quiz before it is due is no gate to graduate by: its code changed.
    expect(rungOf(at(4), { ...plain, isDue: false, code: CODE }, 4)).toBe('changed')
    // A team term of this repository is asked by the team's words and lines, as in 1.7; one of another (isTeamMarked) as any concept.
    expect(rungOf(at(2), { ...plain, isTeam: true, code: CODE })).toBeUndefined()
    expect(rungOf({ ...at(2), name: '다른 저장소 팀 용어' }, { ...plain, code: CODE })).toBe('changed')
  })

  test('an open slip asked again: 다시 도전 (no rung) at first; missed twice running, a worked example, with or without code', () => {
    const asking = { ...plain, isAsking: true }
    expect(rungOf(at(2), { ...asking, code: CODE, slip: { times: 1 } })).toBeUndefined()
    expect(rungOf(at(2), { ...asking, code: CODE, slip: { times: 2 } })).toBe('worked')
    expect(rungOf(at(0), { ...asking, slip: { times: 3 } })).toBe('worked')
    // Set right on the try again (isRight): asked again with no example, another day.
    expect(rungOf(at(2), { ...asking, code: CODE, slip: { times: 2, isRight: true } })).toBeUndefined()
    // Not one the review asks again now (a quiz went over it since): 다시 도전 when it is due.
    expect(rungOf(at(2), { ...plain, code: CODE, slip: { times: 2 } })).toBeUndefined()
    expect(rungOf(at(2), { ...asking, isTeam: true, slip: { times: 2 } })).toBeUndefined()
  })

  test('an extension in lower case from the last part of a path; none for no dot, a dot file, or one too long', () => {
    expect(extOf('src/A.JS')).toBe('js')
    expect(extOf('x.test.ts')).toBe('ts')
    expect(extOf('C:\\work\\main.PY')).toBe('py')
    expect(extOf('Makefile')).toBeUndefined()
    expect(extOf('.env')).toBeUndefined()
    expect(extOf('src.d/file')).toBeUndefined()
    expect(extOf('a.verylongext')).toBeUndefined()
  })

  test('a question in code of the quiz\'s own making is sent the language, not the code; code never seen, the words without their quoted line', () => {
    const one = pick('for...of', { blurb: '배열을 하나씩 돈다 — `for (const n of nums)`', code: CODE, noteId: 'n1' })
    const worked = pickForRung(one, 'worked')
    expect(worked.code).toBeUndefined()
    expect(worked).toMatchObject({ rung: 'worked', lang: 'js', noteId: 'n1', blurb: one.blurb })
    const fresh = pickForRung(one, 'new')
    expect(fresh.code).toBeUndefined()
    expect(fresh).toMatchObject({ rung: 'new', lang: 'js', blurb: '배열을 하나씩 돈다' })
    expect(fresh.blurb).not.toContain('`')
    expect(pickForRung(one, 'changed')).toMatchObject({ rung: 'changed', code: CODE })
    expect(pickForRung(one, 'mine')).toMatchObject({ rung: 'mine', code: CODE })
    expect(pickForRung(one, undefined)).toBe(one)
    // No code to take a language from: none said.
    expect(pickForRung(pick('B'), 'worked').lang).toBeUndefined()
  })
})

describe('1.8.0: the quiz prompt names each rung and says what the quiz has of them (E3)', () => {
  const SLIP_17 = '"지난번" 줄이 붙은 개념은 같은 헷갈림이 드러나는 다른 코드나 값으로 묻는다. 지난 문제를 되풀이하지 않는다. 헷갈린 점을 문제나 힌트에 쓰지 않는다.'
  const NARROW = '"지난번" 줄이 붙은 개념 가운데 칸이 "풀이 보고 풀기"가 아닌 것은 같은 헷갈림이 드러나는 다른 코드나 값으로 묻는다.'
  const WRITES = "'처음 보는 코드'·'풀이 보고 풀기' 칸은 그 개념을 쓰는 짧은 코드를 새로 쓴다. 그 밖에는 주어진 설명과 코드 안에서만 묻는다."
  const slip = { what: SLIP.what, question: SLIP.question, mine: SLIP.mine }

  test('the rung under the concept\'s head, the asks of the rungs there only, in order; the 1.7 sentence on own code is gone', () => {
    const prompt = quizPrompt([pickForRung(pick('A', { code: CODE }), 'changed'), pickForRung(pick('B', { code: CODE }), 'mine'), pick('C')], 'beginner')
    expect(prompt).toContain('1. A — A 설명\n   칸: 비슷한 코드\n   학습자가 만든 코드 (src/cart.js):\n```\nlet total = 0')
    expect(prompt).toContain('2. B — B 설명\n   칸: 내 코드\n   학습자가 만든 코드')
    expect(prompt).toContain('3. C — C 설명\n\n')
    const mine = prompt.indexOf('내 코드: 학습자가 만든 코드를 그대로 보여 주고 묻는다.')
    const changed = prompt.indexOf('비슷한 코드: 학습자 코드에서 값·조건·순서 중 한 곳을 바꾼 코드를 보여 주고 묻는다. 원래 코드의 답으로는 맞힐 수 없게 바꾼다.')
    expect(mine).toBeGreaterThan(-1)
    expect(changed).toBeGreaterThan(mine)
    expect(prompt).not.toContain('풀이 보고 풀기:')
    expect(prompt).not.toContain('처음 보는 코드:')
    expect(prompt).not.toContain(WRITES)
    expect(prompt).not.toContain('그대로, 또는 조금 바꿔')
    expect(prompt).toContain('코드가 붙었거나 칸이 붙은 개념은 예측(코드만으로 출력이나 값이 하나로 정해질 때만) 또는 바꿔 보기로, 칸도 코드도 없는 개념은 왜로 낸다.')
    expect(prompt).toContain('T1: (예측 · 왜 · 바꿔 보기 중 하나)\nQ1: (문제 한두 문장)')
    // No rung at all (a quiz of 1.7's picks): no 칸 line, no rung's ask.
    const none = quizPrompt([pick('A', { code: CODE }), pick('B')], 'beginner')
    expect(none).not.toContain('칸:')
    expect(none).not.toContain('내 코드:')
  })

  test('a worked example alone: its language and no code of the learner\'s, the sentence that lets it write code, no sentence keeping the slip unsaid', () => {
    const worked = pickForRung(pick('A', { code: CODE, slip }), 'worked')
    const prompt = quizPrompt([worked], 'beginner')
    expect(prompt).toContain(`1. A — A 설명\n   지난번 문제 '\`total\`은?' · 학습자 답 '0' · 헷갈린 점: ${SLIP.what}\n   칸: 풀이 보고 풀기 (js로)\n\n`)
    expect(prompt).not.toContain('학습자가 만든 코드')
    expect(prompt).not.toContain('let total = 0')
    expect(prompt).toContain('풀이 보고 풀기: 문제를 "풀이:"로 시작해, "지난번" 줄의 헷갈림이 드러나는 4줄 이하 예와 그 결과, 까닭 한 문장을 먼저 보인다.')
    expect(prompt).toContain('이어서 "이제 풀어 보세요:" 뒤에 같은 원리를 다른 값으로 묻는다.')
    expect(prompt).toContain(WRITES)
    expect(prompt).not.toContain('헷갈린 점을 문제나 힌트에 쓰지 않는다')
    expect(prompt).not.toContain('"지난번" 줄이 붙은 개념은')
  })

  test('a worked example beside a slip asked again narrows the sentence to the others; 다시 도전 alone keeps 1.7\'s word for word', () => {
    const mixed = quizPrompt([pickForRung(pick('A', { slip }), 'worked'), pick('B', { slip })], 'beginner')
    expect(mixed).toContain(`${NARROW} 지난 문제를 되풀이하지 않는다. 헷갈린 점을 문제나 힌트에 쓰지 않는다.`)
    expect(mixed).not.toContain(SLIP_17)
    const again = quizPrompt([pick('A', { slip }), pick('B')], 'beginner')
    expect(again).toContain(SLIP_17)
    expect(again).not.toContain(WRITES)
    // Code never seen (on in 1.8.x) is a rung that writes code too.
    expect(quizPrompt([pickForRung(pick('A', { code: CODE }), 'new')], 'beginner')).toContain(`${WRITES}`)
    expect(quizPrompt([pickForRung(pick('A', { code: CODE }), 'new')], 'beginner')).toContain('   칸: 처음 보는 코드 (js로)')
  })
})

describe('1.8.0: a question keeps its rung as the model kept to it (E3)', () => {
  const slip = { what: SLIP.what, question: SLIP.question, mine: SLIP.mine }

  test('each question takes its pick\'s rung; a worked example with no example shown keeps none, and is 다시 도전 as in 1.7', () => {
    const picks = [pickForRung(pick('A', { slip }), 'worked'), pickForRung(pick('B', { code: CODE }), 'mine'), pick('C')]
    const text = ['Q1: 풀이: `let x = 1; x += 1` → 2. 이제 풀어 보세요: `let y = 5; y += 1`의 y는?', 'A1: 6', 'Q2: 아래 코드는?', 'A2: 3', 'Q3: 왜?', 'A3: 그래서'].join('\n')
    const items = parseQuiz(text, picks)
    expect(items.map(one => one.rung)).toEqual(['worked', 'mine', undefined])
    expect(items[0]!.isRetry).toBeUndefined()
    expect(parseQuiz(text.replace('풀이:', '**풀이**:'), picks)[0]!.rung).toBe('worked')
    const bare = parseQuiz(text.replace('풀이: ', '').replace('이제 풀어 보세요: ', ''), picks)
    expect(bare[0]!.rung).toBeUndefined()
    expect(bare[0]!.isRetry).toBe(true)
  })

  test('a worked example that says the slip itself stays one, and no retry: the example is meant to show it', () => {
    const items = parseQuiz(`Q1: **풀이:** 흔히 ${SLIP.what}. 하지만 \`total\`은 남습니다.\n이제 풀어 보세요: 다음 값은?\nA1: 3`, [pickForRung(pick('A', { slip }), 'worked')])
    expect(items[0]).toMatchObject({ rung: 'worked' })
    expect(items[0]!.isRetry).toBeUndefined()
  })

  test('code meant changed shown as it was keeps no rung (spaces aside); changed code keeps it', () => {
    const changed = [pickForRung(pick('A', { code: CODE }), 'changed')]
    const same = parseQuiz(`Q1: 아래 코드는 무엇을 찍을까요?\n\`\`\`js\nlet total  = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)\n\`\`\`\nA1: 3`, changed)
    expect(same[0]!.rung).toBeUndefined()
    const other = parseQuiz(`Q1: 아래 코드는 무엇을 찍을까요?\n\`\`\`js\nlet total = 10\nfor (const n of [1, 2]) total += n\nconsole.log(total)\n\`\`\`\nA1: 13`, changed)
    expect(other[0]!.rung).toBe('changed')
    // One line shown in backticks, as it was.
    const line = [pickForRung(pick('A', { code: { file: 'a.ts', text: 'const b = 2' } }), 'changed')]
    expect(parseQuiz('Q1: `const b = 2` 다음 줄에서 b = 3이면?\nA1: 오류', line)[0]!.rung).toBeUndefined()
    expect(parseQuiz('Q1: `const b = 5` 다음 줄에서 b = 3이면?\nA1: 오류', line)[0]!.rung).toBe('changed')
  })
})

describe('1.8.0: a worked example\'s flash card, its next quiz said, and how its grade marks the concept (E3)', () => {
  test('a worked example\'s card asks only what follows 이제 풀어 보세요, whole within the bank\'s 400 characters; none with no such question', () => {
    const example = `풀이: ${'예'.repeat(380)}\n결과: 2`
    const asked = `\`\`\`js\nlet y = 5\ny += 1\nconsole.log(y)\n\`\`\`\n${'무엇을 찍을까요'.repeat(20)}`
    const item = { question: `${example}\n\n**이제 풀어 보세요:** ${asked}`, rung: 'worked' as const }
    expect(bankQuestion(item)).toBe(asked)
    const [card] = addToBank([], [{ key: 'c:a', name: 'A', question: bankQuestion(item)!, answer: '6' }], NOW)
    expect(card!.question).toBe(asked)
    expect(card!.question).not.toContain('풀이:')
    expect(bankQuestion({ question: example, rung: 'worked' })).toBeUndefined()
    expect(bankQuestion({ question: '풀이: 예. 이제 풀어 보세요:  ', rung: 'worked' })).toBeUndefined()
    // The markers in bold, the colon inside or outside it.
    expect(bankQuestion({ question: '**풀이**: 예\n**이제 풀어 보세요**: y는?', rung: 'worked' })).toBe('y는?')
    expect(bankQuestion({ question: '풀이: 그대로', rung: 'changed' })).toBe('풀이: 그대로')
    expect(bankQuestion({ question: '문제' })).toBe('문제')
  })

  test('a worked example missed is missed again; missed twice running, the line says the next quiz shows a worked example', () => {
    const graded = NOW + DAY
    const wrong = { result: 'wrong' as const, gradedAt: graded }
    const twice = { ...SLIP, at: graded, times: 2 }
    expect(slipNotice({ ...wrong, rung: 'worked' }, twice, true)).toEqual({ kind: 'again', text: '같은 곳을 또 헷갈렸습니다' })
    // Another kind in its place: a slip of its own, once.
    expect(slipNotice({ ...wrong, rung: 'worked' }, { ...SLIP, what: '다른 것', at: graded }, true)?.kind).toBe('slip')
    // The rare second miss on no question asked again (a practice, then a quiz made before it): the slip's line says it.
    expect(slipNotice(wrong, twice, false)).toEqual({ kind: 'slip', text: `헷갈린 점: ${SLIP.what} · ${WORKED_NEXT}` })
    expect(slipNotice({ ...wrong, mine: '모르겠어요' }, twice, false)).toEqual({ kind: 'blank', text: `떠오르지 않았습니다 · ${WORKED_NEXT}` })
    // A team term's is said as in 1.7.
    expect(slipNotice({ ...wrong, team: true }, twice, false)).toEqual({ kind: 'slip', text: `헷갈린 점: ${SLIP.what} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })
    expect(WORKED_NEXT).toBe('다음 복습 퀴즈는 풀이부터 보여 줍니다')
  })

  test('the next quiz is a worked example only with the slip open, twice or more, not set right, and no team term\'s', () => {
    const item = {}
    expect(isWorkedNext({ ...SLIP, times: 2 }, item)).toBe(true)
    expect(isWorkedNext({ ...SLIP, times: 5 }, item)).toBe(true)
    expect(isWorkedNext({ ...SLIP, times: 1 }, item)).toBe(false)
    expect(isWorkedNext({ ...SLIP, times: 2, isRight: true }, item)).toBe(false)
    expect(isWorkedNext({ ...SLIP, times: 2, fixedAt: NOW }, item)).toBe(false)
    expect(isWorkedNext({ ...SLIP, times: 2 }, { team: true })).toBe(false)
    expect(isWorkedNext(undefined, item)).toBe(false)
  })

  test('a grade marks its concept as in 1.7, but a miss in code never seen steps back one, not to the first', () => {
    expect(markFor('right', 'right', false)).toBe(markReviewed)
    expect(markFor('right', 'right', true, 'worked')).toBe(markHelped)
    expect(markFor('wrong', 'partial', false)).toBe(markPartial)
    expect(markFor('wrong', 'wrong', false)).toBe(markWrong)
    expect(markFor('wrong', 'wrong', true, 'worked')).toBe(markWrong)
    expect(markFor('wrong', 'wrong', false, 'new')).toBe(markPartial)
    const one: LearnConcept = { name: 'A', count: 2, firstAt: 0, lastAt: 0, blurb: '', files: [], step: 5, reviewedAt: NOW - 60 * DAY }
    expect(markFor('wrong', 'wrong', false, 'new')({ 'c:a': one }, ['c:a'], NOW)['c:a']!.step).toBe(4)
    expect(markFor('wrong', 'wrong', false, 'changed')({ 'c:a': one }, ['c:a'], NOW)['c:a']!.step).toBe(0)
  })
})
