import type { LearnConcept, LearnSlip } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  CHANGED_TRACE_LINE,
  QUIZ_SYSTEM,
  RUNG_CHANGED_STEP,
  RUNG_NEW_STEP,
  STAMP_KEPT_MS,
  STAMP_LIVE_MS,
  WORKED_AFTER_TIMES,
  WORKED_DEFAULT_ASK,
  WORKED_NEXT,
  addToBank,
  bankQuestion,
  cleanStamps,
  codeFor,
  extOf,
  isChangedAskable,
  isChangedRunnable,
  isNewAskable,
  isOldGraderOpen,
  isUnrunnableChange,
  isUnrunnableCode,
  isWorkedNext,
  ladderMixed,
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
import { QUIZ_CASES_18, QUIZ_NOW_18, QUIZ_REPLIES_18 } from './fixtures/quiz18'
import { QUIZ_OUTPUT_110_ON, QUIZ_OUTPUT_19_OFF } from './fixtures/quiz19'

const NOW = Date.UTC(2026, 9, 3, 1)
const DAY = 86_400_000

/** A concept at `step`, its code in `file` when given. */
const at = (step: number): LearnConcept => ({ name: 'A', count: 2, firstAt: 0, lastAt: 0, blurb: '', files: [], step })
const CODE = { file: 'src/cart.js', text: 'let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)' }
const plain = { isAsking: false, isTeam: false, isDue: true }
const SLIP: LearnSlip = { what: '반복이 끝나면 total이 0으로 돌아간다고 봄', type: 'state', question: '`total`은?', mine: '0', at: NOW, times: 1 }
const pick = (name: string, more: Partial<QuizPick> = {}): QuizPick => ({ key: `c:${name}`, name, count: 1, firstAt: 0, lastAt: 0, blurb: `${name} 설명`, files: [], ...more })
/** The ladder's two rungs from 1.8.0 on, whatever their constants ship as (1.9.0 F4: each may be turned off). */
const ON = { changedStep: 2, workedAfter: 2 }

describe('1.8.0: the question ladder, which code a question asks in (E3)', () => {
  test('the rung goes by the review step: own code for the first two, changed code from the third, code never seen from the fifth when on', () => {
    // Each its constant as the release's samples set it (docs/qa/견본.md): a step, or Infinity for the rung off.
    expect([2, Infinity]).toContain(RUNG_CHANGED_STEP)
    expect([4, Infinity]).toContain(RUNG_NEW_STEP)
    expect([2, Infinity]).toContain(WORKED_AFTER_TIMES)
    const byDefault = (step: number) => (step >= RUNG_NEW_STEP ? 'new' : step >= RUNG_CHANGED_STEP ? 'changed' : 'mine')
    for (const step of [0, 1, 2, 3, 4, 5]) expect(rungOf(at(step), { ...plain, code: CODE })).toBe(byDefault(step))
    expect(rungOf(at(0), { ...plain, code: CODE }, Infinity, ON)).toBe('mine')
    expect(rungOf(at(1), { ...plain, code: CODE }, Infinity, ON)).toBe('mine')
    expect(rungOf(at(2), { ...plain, code: CODE }, Infinity, ON)).toBe('changed')
    expect(rungOf(at(3), { ...plain, code: CODE }, Infinity, ON)).toBe('changed')
    // Code never seen off: step 5 in code a sample could run is asked in its code changed.
    expect(rungOf(at(5), { ...plain, code: CODE }, Infinity, ON)).toBe('changed')
    // Switched on (4): due, in a language a sample ran.
    expect(rungOf(at(4), { ...plain, code: CODE }, 4, ON)).toBe('new')
    // 1.10.0 (G2): code changed only in a language its samples ran: a stylesheet is asked in its own code.
    expect(rungOf(at(4), { ...plain, code: { file: 'app.css' } }, 4, ON)).toBe('mine')
    expect(rungOf(at(4), plain, 4, ON)).toBeUndefined()
    // A concept filling the quiz before it is due is no gate to graduate by: its code changed.
    expect(rungOf(at(4), { ...plain, isDue: false, code: CODE }, 4, ON)).toBe('changed')
    // A team term of this repository is asked by the team's words and lines, as in 1.7; one of another (isTeamMarked) as any concept.
    expect(rungOf(at(2), { ...plain, isTeam: true, code: CODE }, Infinity, ON)).toBeUndefined()
    expect(rungOf({ ...at(2), name: '다른 저장소 팀 용어' }, { ...plain, code: CODE }, Infinity, ON)).toBe('changed')
  })

  test('an open slip asked again: 다시 도전 (no rung) at first; missed twice running, a worked example, with or without code', () => {
    const asking = { ...plain, isAsking: true }
    expect(rungOf(at(2), { ...asking, code: CODE, slip: { times: 1 } }, Infinity, ON)).toBeUndefined()
    expect(rungOf(at(2), { ...asking, code: CODE, slip: { times: 2 } }, Infinity, ON)).toBe('worked')
    expect(rungOf(at(0), { ...asking, slip: { times: 3 } }, Infinity, ON)).toBe('worked')
    expect(rungOf(at(2), { ...asking, code: CODE, slip: { times: 2 } })).toBe(2 >= WORKED_AFTER_TIMES ? 'worked' : undefined)
    // Set right on the try again (isRight): asked again with no example, another day.
    expect(rungOf(at(2), { ...asking, code: CODE, slip: { times: 2, isRight: true } }, Infinity, ON)).toBeUndefined()
    // Not one the review asks again now (a quiz went over it since): 다시 도전 when it is due.
    expect(rungOf(at(2), { ...plain, code: CODE, slip: { times: 2 } }, Infinity, ON)).toBeUndefined()
    expect(rungOf(at(2), { ...asking, isTeam: true, slip: { times: 2 } }, Infinity, ON)).toBeUndefined()
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
    // 1.10.0 (G2): its sentence asks a prediction in one block of code.
    const changed = prompt.indexOf('비슷한 코드: 학습자 코드에서 값·조건·순서 중 한 곳을 바꾼 코드를 코드 블록 하나로 보여 주고, 그 코드가 찍는 것을 예측으로 묻는다.')
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

  test('code meant changed shown as a part of it, its return left off, or with `;`, other quotes or fewer lines, keeps no rung; one changed number, operator or order keeps it (교차 검토 5)', () => {
    const cart = { file: 'cartView.js', text: '// 장바구니 화면에 보여 줄 상품만 고른다\nfunction visibleItems(items) {\n  return items.filter(item => item.qty > 0)\n}' }
    const changed = [pickForRung(pick('화살표 함수', { code: cart }), 'changed')]
    const rung = (question: string, picks = changed) => parseQuiz(`T1: 바꿔 보기\nQ1: ${question}\nA1: 답`, picks)[0]!.rung
    // What haiku wrote for a concept at its third step: the line of the learner's code, its return left off.
    expect(rung('아래 화살표 함수를 `function` 키워드를 쓴 일반 함수 형태로 바꾸면 어떻게 써야 할까요? 같은 동작을 해야 합니다. `items.filter(item => item.qty > 0)`')).toBeUndefined()
    expect(rung('`item => item.qty > 0`을 `return`이 있는 함수로 바꿔 쓰면?')).toBeUndefined()
    const arrow = [pickForRung(pick('화살표 함수', { code: { file: 'a.js', text: 'const shown = items.filter(item => item.qty > 0)' } }), 'changed')]
    expect(rung('`item => item.qty > 0`을 `function`으로 바꿔 쓰면?', arrow)).toBeUndefined()
    // The whole of it with `;` at its lines' ends, or on fewer lines, its comment left out; or with a call that runs it.
    expect(rung('아래 코드는?\n```js\nfunction visibleItems(items) {\n    return items.filter(item => item.qty > 0);\n};\n```')).toBeUndefined()
    expect(rung('아래 코드는?\n```js\nfunction visibleItems(items) { return items.filter(item => item.qty > 0) }\n```')).toBeUndefined()
    expect(rung('아래 코드는?\n```js\nfunction visibleItems(items) {\n  return items.filter(item => item.qty > 0)\n}\nconsole.log(visibleItems([{ qty: 0 }]).length)\n```')).toBeUndefined()
    // A string's quotes made one kind only where the language reads them so (quotesAlike).
    const unit = (file: string) => [pickForRung(pick('A', { code: { file, text: "unit = '원'\nprint(unit)" } }), 'changed')]
    expect(rung('```\nunit = "원";\nprint(unit)\n```', unit('a.py'))).toBeUndefined()
    expect(rung('```\nunit = "원"\nprint(unit)\n```', unit('a.rb'))).toBe('changed')
    // One place changed: a number, an operator, the order, a return taken out; or said changed beside the part it was.
    expect(rung('`items.filter(item => item.qty > 10)`의 결과는?')).toBe('changed')
    expect(rung('`items.filter(item => item.qty >= 0)`의 결과는?')).toBe('changed')
    expect(rung('`item.qty > 0`을 `item.qty >= 2`로 바꾸면 무엇이 남을까요?')).toBe('changed')
    expect(rung('원래 코드:\n```js\nfunction visibleItems(items) {\n  return items.filter(item => item.qty > 0)\n}\n```\n바꾼 코드:\n```js\nfunction visibleItems(items) {\n  return items.filter(item => item.qty > 1)\n}\n```')).toBe('changed')
    expect(rung('```js\nlet total = 0\nconsole.log(total)\nfor (const n of [1, 2]) total += n\n```', [pickForRung(pick('A', { code: CODE }), 'changed')])).toBe('changed')
    const callback = [pickForRung(pick('A', { code: { file: 'a.js', text: 'items.filter(function (item) {\n  return item.qty > 0\n})' } }), 'changed')]
    expect(rung('```js\nitems.filter(function (item) {\n  item.qty > 0\n})\n```', callback)).toBe('changed')
    // A number cut short is another number, either way round: 10 is not 1.
    const code = (text: string) => [pickForRung(pick('A', { code: { file: 'a.js', text } }), 'changed')]
    expect(rung('`const limit = 1` 뒤 limit은?', code('const limit = 10'))).toBe('changed')
    expect(rung('`const limit = 10` 뒤 limit은?', code('const limit = 1'))).toBe('changed')
    expect(rung('`const a = 2` 뒤 a는?', code('const a = 1\nconst b = 2'))).toBe('changed')
    // Names alone in backticks show no code as it was: the code changed, as in 1.8.0. A question with no code at all
    // keeps no rung (1.10.0 G2): a why with no code is no 비슷한 코드.
    expect(rung('`filter`와 `return`을 써서 다시 쓰면?')).toBe('changed')
    expect(rung('조건을 반대로 바꾸면 무엇이 남을까요?')).toBeUndefined()
  })

  test('a sign, number or name the code is said to become keeps the rung though it reads as a part of the code; a line with more on it, cut short, or lines beside it doing more are not the code as it was (교차 검토 6)', () => {
    const code = (text: string, file = 'a.js') => [pickForRung(pick('A', { code: { file, text } }), 'changed')]
    const rung = (question: string, picks: QuizPick[]) => parseQuiz(`T1: 바꿔 보기\nQ1: ${question}\nA1: 답`, picks)[0]!.rung
    // A sign that is a part of the sign it stands for is another sign: `>` is not in `>=`, nor `==` in `===`.
    const qty = code('items.filter(item => item.qty >= 0)')
    expect(rung('`>=`를 `>`로 바꾸면 무엇이 남을까요?', qty)).toBe('changed')
    expect(rung('`items.filter(item => item.qty >= 0)`에서 `>=`를 `>`로 바꾸면 무엇이 남을까요?', qty)).toBe('changed')
    expect(rung('아래 코드에서 `>=`를 `>`로 바꾸면?\n```js\nitems.filter(item => item.qty >= 0)\n```', qty)).toBe('changed')
    expect(rung('`items.filter(item => item.qty >= 0)`에서 `>=`는 무엇을 뜻할까요?', qty)).toBeUndefined()
    expect(rung('`===` 대신 `==`를 쓰면 출력은?', code('if (a === b) console.log("same")'))).toBe('changed')
    expect(rung('`!==`를 `!=`로 바꾸면 `x`가 `undefined`일 때는?', code('if (x !== null) use(x)'))).toBe('changed')
    expect(rung('`if (x !== null)`에서 `!==`를 `!=`로 바꾸면?', code('if (x !== null) use(x)'))).toBe('changed')
    expect(rung('`+=`를 `=`로 바꾸면 출력은?', [pickForRung(pick('A', { code: CODE }), 'changed')])).toBe('changed')
    expect(rung('`**`를 `*`로 바꾸면 출력은?', code('print(3 ** 2)', 'a.py'))).toBe('changed')
    // A number is read with its decimal point and its sign: 1 is not in 1.5, nor 5 in -5.
    const price = code('const total = price * 1.5')
    expect(rung('`const total = price * 1` 이면 total은?', price)).toBe('changed')
    expect(rung('`price * 1.5`는 무엇을 계산할까요?', price)).toBeUndefined()
    expect(rung('`const limit = 1.5` 뒤 limit은?', code('const limit = 1'))).toBe('changed')
    expect(rung('`price = 2.5`를 `price = 2`로 바꾸면 출력은?', code('price = 2.5\nprint(price * 2)', 'a.py'))).toBe('changed')
    expect(rung('`-5`를 `5`로 바꾸면 출력은?', code('const x = -5\nconsole.log(Math.abs(x))'))).toBe('changed')
    expect(rung('`const total = price * 1.5`에서 배율이 `1`일 때 total은?', price)).toBe('changed')
    expect(rung('`const x = -5`에서 `x`가 `5`일 때 출력은?', code('const x = -5\nconsole.log(Math.abs(x))'))).toBe('changed')
    // A name, or a value the code holds elsewhere, said to be what a part becomes is the code changed.
    const filter = code('items.filter(item => item.qty > 0)')
    expect(rung('`item.qty > 0`에서 `qty`를 `price`로 바꾸면 무엇이 남을까요?', filter)).toBe('changed')
    expect(rung('`0`을 `limit`으로 바꾸면 무엇이 남을까요?', filter)).toBe('changed')
    expect(rung('`let total = 0`에서 `0`을 `1`로 바꾸면 출력은?', [pickForRung(pick('A', { code: CODE }), 'changed')])).toBe('changed')
    expect(rung('`items.filter(item => item.qty > 0)`에서 `item`은 무엇을 가리킬까요?', filter)).toBeUndefined()
    expect(rung('`items.filter(item => item.qty > 0)`에서 `item.qty`가 0이면?', filter)).toBeUndefined()
    // The code with more on its line, or a line of it cut short, is another line; so are lines beside it doing more
    // than call a function it defines (a line that runs it, kept as it was by 교차 검토 5's test above).
    expect(rung('`const b = 2 * 3` 다음 줄에서 b는?', code('const b = 2'))).toBe('changed')
    expect(rung('`const name = user.name.toUpperCase()` 뒤 name은?', code('const name = user.name'))).toBe('changed')
    expect(rung('`const b = 2` 다음 줄에서 b는?', code('const b = 2 * 3'))).toBe('changed')
    expect(rung('`const total = price`이면 total은?', code('const total = price * qty'))).toBe('changed')
    expect(rung('`item => item.qty`를 넘기면?', filter)).toBe('changed')
    expect(rung('아래 코드는?\n```js\nconst b = 2\nconsole.log(b)\n```', code('const b = 2'))).toBe('changed')
    const shout = code('const shout = text => text.toUpperCase()')
    expect(rung('아래 코드는?\n```js\nconst shout = text => text.toUpperCase()\nconsole.log(shout("hi"))\n```', shout)).toBeUndefined()
    expect(rung('```js\nreturn items.filter(item => item.qty > 0);\n```\n결과는?', filter)).toBeUndefined()
    expect(rung('`console.log(items.filter(item => item.qty > 0))`의 출력은?', filter)).toBeUndefined()
    expect(rung('`items.filter(item => item.qty > 0) + 1`은?', filter)).toBe('changed')
    expect(rung('`items.filter(item => item.qty > 0).length`는?', filter)).toBe('changed')
    // A member named as a keyword is a value (`map.delete`); a keyword the code is said to become is the code changed.
    expect(rung('`map.delete("a")`는 무엇을 돌려줄까요?', code('const isGone = map.delete("a") && map.size === 0'))).toBeUndefined()
    expect(rung('`if i == 2:` 아래 `break`를 `continue`로 바꾸면 출력은?', code('for i in range(5):\n    if i == 2:\n        break\n    print(i)', 'a.py'))).toBe('changed')
    // A comment at a line's end is left out as a whole-line one is; `//` in Python and `#` in a string are code.
    expect(rung('```python\ntotal = 1 + 2  # 더하기\nprint(total)\n```', code('# 합\ntotal = 1 + 2\nprint(total)', 'a.py'))).toBeUndefined()
    expect(rung('`const total = 1 + 2`의 total은?', code('const total = 1 + 2 // 합'))).toBeUndefined()
    expect(rung('`print(7 // 3)`의 출력은?', code('print(7 // 2)', 'a.py'))).toBe('changed')
    expect(rung('`print("# 2")`의 출력은?', code('print("# 1")', 'a.py'))).toBe('changed')
    // What haiku wrote (docs/qa/견본.md, r1): the code as it was beside braces named in words keeps none; the code with
    // two lines more that change what it prints keeps the rung, as 0183a13 and the hand count had them.
    const block = code('let x = 1\nif (true) {\n  let x = 2\n}\nconsole.log(x)')
    expect(rung('아래 코드에서 마지막 `console.log(x)`가 2를 출력하게 하려면 안쪽 블록(중괄호 `{ }`로 묶은 부분)의 어느 줄을 어떻게 바꿔야 할까요?\n```\nlet x = 1\nif (true) {\n  let x = 2\n}\nconsole.log(x)\n```', block)).toBeUndefined()
    const order = code("console.log('A')\nPromise.resolve().then(() => console.log('B'))\nconsole.log('C')")
    expect(rung("아래 코드를 실행하면 출력되는 글자가 어떤 순서로 나올까요? 순서대로 한 줄에 쓰면 됩니다.\n```\nconsole.log('A')\nPromise.resolve().then(() => console.log('B'))\nconsole.log('C')\nPromise.resolve().then(() => console.log('D'))\nconsole.log('E')\n```", order)).toBe('changed')
    expect(rung('`{ }`를 `[ ]`로 바꾸면?', block)).toBe('changed')
  })

  test('a T line that names the rung before the kind is read for its kind; one naming the rung alone has none, as in 1.7', () => {
    const picks = [pickForRung(pick('A', { slip }), 'worked')]
    const kind = (t: string) => parseQuiz(`T1: ${t}\nQ1: 풀이: 예. 이제 풀어 보세요: y는?\nA1: 6`, picks)[0]!.kind
    expect(kind('풀이 보고 풀기 · 예측')).toBe('predict')
    expect(kind('(비슷한 코드) 바꿔 보기')).toBe('modify')
    expect(kind('**내 코드**: 왜')).toBe('why')
    expect(kind('다시 도전 · 팀 용어 · predict')).toBe('predict')
    expect(kind('풀이보고풀기 - 예측')).toBe('predict')
    expect(kind('예측')).toBe('predict')
    expect(kind('풀이 보고 풀기')).toBeUndefined()
    expect(kind('내 코드로')).toBeUndefined()
  })

  test('a worked example with only code after 이제 풀어 보세요 asks what it prints, on the line after the marker: a 예측 when its T line names no kind (교차 검토 2)', () => {
    const picks = [pickForRung(pick('A', { slip }), 'worked')]
    const example = '풀이: `[1, 2].filter(n => n > 1)`은 `[2]`입니다. filter는 조건이 참인 것만 남깁니다.'
    const code = '```js\nconst ages = [12, 25, 8]\nconsole.log(ages.filter(a => a >= 18))\n```'
    expect(WORKED_DEFAULT_ASK).toBe('이 코드를 실행하면 무엇이 출력될까요?')
    // The haiku sample's B4: the T line names the rung alone, and nothing but the code follows the marker.
    const [only] = parseQuiz(`T1: 풀이 보고 풀기\nQ1: ${example}\n이제 풀어 보세요:\n${code}\nH1: 18 이상만\nA1: [ 25 ]`, picks)
    expect(only).toMatchObject({ rung: 'worked', kind: 'predict', question: `${example}\n이제 풀어 보세요:\n${WORKED_DEFAULT_ASK}\n${code}` })
    // The card's front, what the pane and the conversation show, and what the grade reads: the ask, then the code.
    expect(bankQuestion(only!)).toBe(`${WORKED_DEFAULT_ASK}\n${code}`)
    // The marker in bold, a blank line after it, and two blocks: the ask on the line after the marker all the same; a T line's kind stays.
    const [bold] = parseQuiz(`T1: 왜\nQ1: ${example}\n**이제 풀어 보세요:**\n\n${code}\n\n${code}\nA1: [ 25 ]`, picks)
    expect(bold!.question).toBe(`${example}\n**이제 풀어 보세요:**\n${WORKED_DEFAULT_ASK}\n${code}\n\n${code}`)
    expect(bold!.kind).toBe('why')
    // A block left open is closed first (closeFence), and is code alone too.
    const [open] = parseQuiz(`Q1: ${example}\n이제 풀어 보세요:\n\`\`\`py\nprint(sum(range(3, 7)))\nA1: 18`, picks)
    expect(bankQuestion(open!)!.startsWith(`${WORKED_DEFAULT_ASK}\n\`\`\`py\nprint(sum(range(3, 7)))\n`)).toBe(true)
    expect(open!.kind).toBe('predict')
  })

  test('a worked example that asks in words after its marker, before or after its code, is kept as written; so is any question not a worked example (교차 검토 2)', () => {
    const picks = [pickForRung(pick('A', { slip }), 'worked')]
    const code = '```js\nlet c = 10\nconsole.log(++c)\n```'
    // Code in backticks is words of the question here: only a fenced block is code alone.
    for (const asks of [`아래 코드는 무엇을 찍을까요?\n${code}`, `${code}\nc는?`, '`let y = 5; y += 1`의 y는?', `${code}\n이 줄을 바꾸면 c는 몇이 될까요?`, '`console.log(typeof null)`', '']) {
      const question = `풀이: \`let n = 0; n += 1\` 뒤 n은 1입니다.\n이제 풀어 보세요:${asks === '' ? '' : `\n${asks}`}`
      const [item] = parseQuiz(`T1: 풀이 보고 풀기\nQ1: ${question}\nA1: 11`, picks)
      expect(item!.question).toBe(question)
      expect(item!.question).not.toContain(WORKED_DEFAULT_ASK)
      expect(item!.kind).toBeUndefined()
    }
    // No example shown (no rung kept), no marker, or no worked example at all: code alone stays code alone.
    expect(parseQuiz(`Q1: 이제 풀어 보세요:\n${code}\nA1: 11`, picks)[0]!.question).toBe(`이제 풀어 보세요:\n${code}`)
    expect(parseQuiz(`Q1: 풀이: 예.\n${code}\nA1: 11`, picks)[0]!.question).toBe(`풀이: 예.\n${code}`)
    for (const rung of ['mine', 'changed'] as const) {
      const [item] = parseQuiz(`Q1: 이제 풀어 보세요:\n${code}\nA1: 11`, [pickForRung(pick('B', { code: CODE }), rung)])
      expect(item!.question).toBe(`이제 풀어 보세요:\n${code}`)
      expect(item!.kind).toBeUndefined()
    }
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
    expect(slipNotice({ ...wrong, rung: 'worked' }, twice, true, ON.workedAfter)).toEqual({ kind: 'again', text: '같은 곳을 또 헷갈렸습니다' })
    // Another kind in its place: a slip of its own, once.
    expect(slipNotice({ ...wrong, rung: 'worked' }, { ...SLIP, what: '다른 것', at: graded }, true, ON.workedAfter)?.kind).toBe('slip')
    // The rare second miss on no question asked again (a practice, then a quiz made before it): the slip's line says it.
    expect(slipNotice(wrong, twice, false, ON.workedAfter)).toEqual({ kind: 'slip', text: `헷갈린 점: ${SLIP.what} · ${WORKED_NEXT}` })
    expect(slipNotice({ ...wrong, mine: '모르겠어요' }, twice, false, ON.workedAfter)).toEqual({ kind: 'blank', text: `떠오르지 않았습니다 · ${WORKED_NEXT}` })
    // A team term's is said as in 1.7.
    expect(slipNotice({ ...wrong, team: true }, twice, false, ON.workedAfter)).toEqual({ kind: 'slip', text: `헷갈린 점: ${SLIP.what} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })
    expect(WORKED_NEXT).toBe('다음 복습 퀴즈는 풀이부터 보여 줍니다')
  })

  test('the next quiz is a worked example only with the slip open, kept by this grade, twice or more, not set right, and no team term\'s', () => {
    const item = { gradedAt: NOW }
    expect(isWorkedNext({ ...SLIP, times: 2 }, item, ON.workedAfter)).toBe(true)
    expect(isWorkedNext({ ...SLIP, times: 5 }, item, ON.workedAfter)).toBe(true)
    expect(isWorkedNext({ ...SLIP, times: 1 }, item, ON.workedAfter)).toBe(false)
    expect(isWorkedNext({ ...SLIP, times: 2, isRight: true }, item, ON.workedAfter)).toBe(false)
    expect(isWorkedNext({ ...SLIP, times: 2, fixedAt: NOW }, item, ON.workedAfter)).toBe(false)
    expect(isWorkedNext({ ...SLIP, times: 2 }, { team: true, gradedAt: NOW }, ON.workedAfter)).toBe(false)
    expect(isWorkedNext(undefined, item, ON.workedAfter)).toBe(false)
    // As the build ships it (WORKED_AFTER_TIMES), and with worked examples off (1.9.0 F4): never.
    expect(isWorkedNext({ ...SLIP, times: 2 }, item)).toBe(2 >= WORKED_AFTER_TIMES)
    expect(isWorkedNext({ ...SLIP, times: 5 }, item, Infinity)).toBe(false)
    expect(slipNotice({ result: 'wrong', gradedAt: NOW }, { ...SLIP, times: 2, at: NOW }, false, Infinity)).toEqual({ kind: 'slip', text: `헷갈린 점: ${SLIP.what} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })
    // A grade that kept no miss (wrong once the answer is seen, f with no slip read): the slip is the one before, gone
    // over by this grade, so the next quiz does not ask it again first, and no worked example is said.
    expect(isWorkedNext({ ...SLIP, times: 2, at: NOW - 8 * DAY }, item, ON.workedAfter)).toBe(false)
    expect(slipNotice({ result: 'wrong', gradedAt: NOW, rung: 'worked' }, { ...SLIP, times: 2, at: NOW - 8 * DAY }, true, ON.workedAfter)).toEqual({ kind: 'again', text: '같은 곳을 또 헷갈렸습니다' })
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

describe('1.9.0: 처음 보는 코드 from the fifth step, for concepts due met in code that runs on its own (F3)', () => {
  const PY = { file: 'app/evens.py', text: 'nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])' }
  const asking = { ...plain, isAsking: true }
  const NEW_ASK =
    '처음 보는 코드: 학습자 코드와 다른 상황(다른 이름·값·쓰임)에서 그 개념을 쓰는 8줄 이하 코드를 괄호 안 언어로 새로 써서 예측으로 묻는다. 다른 문제와 유형이 겹쳐도 이 칸은 예측으로 낸다. 그 언어에 기본으로 든 기능만 쓰고, 라이브러리의 동작을 흉내 낸 코드는 쓰지 않는다. 파일·네트워크·입력·시간·난수, 브라우저 화면(document·window·localStorage·alert)과 Node 모듈(fs·process)은 쓰지 않고 console.log나 print로만 찍는다. 출력은 3줄 이하로, 줄마다 숫자·문자열·참거짓·undefined·null·None 하나를 40자 이하로 찍는다(배열·객체를 통째로 찍지 않는다). A 바로 앞에 같은 번호의 R 줄(예: R2:)을 두어 코드를 한 줄씩 따라간 과정을 쓰고, A에는 찍히는 글자만 줄마다 그대로 쓴다(설명을 붙이지 않는다). 문제(Q)에는 출력값이나 따라간 과정을 쓰지 않는다. 그 개념이 라이브러리나 프레임워크가 있어야 보일 수 있는 것이면 코드 없이 왜로 묻는다.'
  const WRITES = "'처음 보는 코드'·'풀이 보고 풀기' 칸은 그 개념을 쓰는 짧은 코드를 새로 쓴다. 그 밖에는 주어진 설명과 코드 안에서만 묻는다."
  const TRACE = 'R1: (칸이 "처음 보는 코드"인 문제만: 코드를 한 줄씩 따라간 과정)'

  test('switched on at 4: due steps 4 and 5 in js, mjs, cjs, ts or py; not due, other languages, no code, step 3, slips and team terms as before', () => {
    expect(rungOf(at(4), { ...plain, code: CODE }, 4, ON)).toBe('new')
    expect(rungOf(at(5), { ...plain, code: PY }, 4, ON)).toBe('new')
    for (const file of ['a.mjs', 'a.cjs', 'src/A.TS']) expect(rungOf(at(5), { ...plain, code: { file, text: 'console.log(1)' } }, 4, ON)).toBe('new')
    expect(rungOf(at(4), { ...plain, isDue: false, code: CODE }, 4, ON)).toBe('changed')
    // Not in a language a sample ran: its own code (1.10.0 G2; 1.9.0 asked it changed).
    for (const file of ['app.css', 'App.tsx', 'App.jsx', 'main.go']) expect(rungOf(at(4), { ...plain, code: { file, text: 'x' } }, 4, ON)).toBe('mine')
    expect(rungOf(at(4), plain, 4, ON)).toBeUndefined()
    expect(rungOf(at(3), { ...plain, code: CODE }, 4, ON)).toBe('changed')
    expect(rungOf(at(5), { ...asking, code: CODE, slip: { times: 1 } }, 4, ON)).toBeUndefined()
    expect(rungOf(at(5), { ...asking, code: CODE, slip: { times: 2 } }, 4, ON)).toBe('worked')
    expect(rungOf(at(5), { ...plain, isTeam: true, code: CODE }, 4, ON)).toBeUndefined()
    // Off (Infinity), as 1.8.0 shipped it: the same concept in its code changed; with 비슷한 코드 off too, its own.
    expect(rungOf(at(5), { ...plain, code: PY }, Infinity, ON)).toBe('changed')
    expect(rungOf(at(5), { ...plain, code: PY }, Infinity, { changedStep: Infinity })).toBe('mine')
    expect(rungOf(at(4), { ...plain, code: PY }, 4, { changedStep: Infinity })).toBe('new')
  })

  test('code a library, a framework or a browser runs is caught; code with a path, `node:`, a comparison or a format is not; a caught one is asked as before', () => {
    const caught = [
      "import { useState } from 'react'",
      "const app = require('express')",
      '<Button onClick={() => save()}>저장</Button>',
      'useEffect(() => { load() }, [])',
      "app.get('/', (req, res) => res.send('ok'))",
      "document.querySelector('#a')",
      "localStorage.setItem('k', '1')",
      'import pandas as pd',
      'from flask import Flask',
      "import debounce from 'lodash/debounce'",
      "const { data } = await import('axios')",
      "window.location.href = '/'",
      "btn.addEventListener('click', go)",
      "alert('done')",
      'const [n, setN] = React.useState<number>(0)',
      'import json',
    ]
    for (const text of caught) expect([text, isUnrunnableCode(text)]).toEqual([text, true])
    const runs = [
      "import { sum } from './math'",
      "const fs = require('node:fs')",
      "import { add } from '../lib/add.js'",
      'const xs = [1, 2].map(x => x * 2)',
      'if (a < B) console.log(a)',
      "print(f'{x:.2f}')",
      'from .models import User',
      "const chars = Array.from('abc')",
      'const ids: Array<Item> = []',
      'function pick<T>(xs: T[]): T { return xs[0] }',
      'const reuse = (x) => x',
      "console.log('import x from y')",
    ]
    for (const text of runs) expect([text, isUnrunnableCode(text)]).toEqual([text, false])
    // Caught at step 4 and due: never in code never seen; from 1.10.0 (G2) never in code changed either, its own.
    const react = { file: 'src/Like.js', text: "import { useState } from 'react'\nconst [n, setN] = useState(0)\nsetN(c => c + 1)" }
    expect(rungOf(at(4), { ...plain, code: react }, 4, ON)).toBe('mine')
    expect(rungOf(at(4), { ...plain, code: { file: 'app/report.py', text: 'import pandas as pd\nprint(pd.DataFrame().shape)' } }, 4, ON)).toBe('mine')
    // A pick with no text known (an older caller) goes by its file alone, as 1.8.0 did.
    expect(rungOf(at(4), { ...plain, code: { file: 'a.js' } }, 4, ON)).toBe('new')
  })

  test('the quiz prompt for code never seen: the whole sentence, its language under the head, the sentence that lets it write code and the R line; none of the learner\'s code or quotes', () => {
    const one = pickForRung(pick('리스트 컴프리헨션', { blurb: '조건에 맞는 것만 골라 새 리스트를 만듭니다 — `[n for n in nums if n % 2 == 0]`', code: PY }), 'new')
    const prompt = quizPrompt([one, pickForRung(pick('B', { code: CODE }), 'mine')], 'beginner')
    expect(prompt).toContain('1. 리스트 컴프리헨션 — 조건에 맞는 것만 골라 새 리스트를 만듭니다\n   칸: 처음 보는 코드 (py로)\n2. B — B 설명\n   칸: 내 코드\n   학습자가 만든 코드 (src/cart.js):')
    expect(prompt).toContain(`\n${NEW_ASK}\n${WRITES}\n`)
    expect(prompt).toContain(`\nH1: (힌트 한 문장)\n${TRACE}\nA1: (답 한두 문장)\n`)
    expect(prompt).not.toContain('nums = [1, 2, 3, 4]')
    expect(prompt).not.toContain('n % 2 == 0')
    expect(prompt).not.toContain('app/evens.py')
    // A quiz with none of it says none of it: code changed has an R line of its own (1.10.0 G2), a quiz of its own code none.
    const none = quizPrompt([pickForRung(pick('A', { code: CODE }), 'changed'), pickForRung(pick('B', { code: CODE }), 'mine')], 'beginner')
    expect(none).not.toContain('처음 보는 코드:')
    expect(none).not.toContain(WRITES)
    expect(none).not.toContain(TRACE)
    expect(none).toContain('\nH1: (힌트 한 문장)\nR1: (칸이 "비슷한 코드"인 문제만: 보인 코드를 한 줄씩 따라간 과정)\nA1: (답 한두 문장)\n')
    const own = quizPrompt([pickForRung(pick('A', { code: CODE }), 'mine'), pickForRung(pick('B', { code: CODE }), 'mine')], 'beginner')
    expect(own).not.toContain('R1:')
    expect(own).toContain('\nH1: (힌트 한 문장)\nA1: (답 한두 문장)\n')
    expect(QUIZ_SYSTEM).not.toContain('처음 보는 코드')
  })

  test('a question in code never seen keeps its rung when it shows code, of whatever kind; one with none is a why as in 1.7; its R line is dropped', () => {
    const picks = [pickForRung(pick('A', { code: CODE }), 'new'), pickForRung(pick('B', { code: CODE }), 'changed'), pick('C')]
    const code = '```js\nconst xs = [3, 4]\nlet s = 0\nfor (const x of xs) s += x\nconsole.log(s)\n```'
    const text = [
      'T1: 예측',
      `Q1: 아래 코드는 무엇을 찍을까요?\n${code}`,
      'H1: 하나씩 더해 보세요',
      'R1: s는 0에서 3, 다시 7이 된다',
      'A1: 7',
      'T2: 예측',
      'Q2: `let total = 5`이면?',
      'A2: 8',
      'T3: 왜',
      'Q3: 왜 그렇게 썼을까요?',
      'A3: 그래서',
    ].join('\n')
    const items = parseQuiz(text, picks)
    expect(items.map(one => [one.rung, one.kind])).toEqual([['new', 'predict'], ['changed', 'predict'], [undefined, 'why']])
    expect(items[0]).toMatchObject({ question: `아래 코드는 무엇을 찍을까요?\n${code}`, hint: '하나씩 더해 보세요', answer: '7' })
    expect(JSON.stringify(items)).not.toContain('0에서 3')
    // Shown code asked why or how to change it keeps the rung, so a miss steps it back one only (markFor).
    const why = parseQuiz(`T1: 왜\nQ1: 아래 코드에서 let을 빼면?\n${code}\nA1: 오류`, picks.slice(0, 1))[0]!
    expect(why).toMatchObject({ rung: 'new', kind: 'why' })
    expect(markFor('wrong', 'wrong', false, why.rung)).toBe(markPartial)
    // No code at all (the model found a library needed): no rung, a why marked as in 1.7, its title `· 왜`.
    const bare = parseQuiz('T1: 왜\nQ1: 화면을 다시 그리는 까닭은?\nH1: 실마리\nA1: 값이 바뀌어서', picks.slice(0, 1))[0]!
    expect(bare.rung).toBeUndefined()
    expect(markFor('wrong', 'wrong', false, bare.rung)).toBe(markWrong)
    expect(parseQuiz('T1: 왜\nQ1: 무엇이 다를까요?\n```js\n```\nA1: 없음', picks.slice(0, 1))[0]!.rung).toBeUndefined()
    // The R line a quiz with no code never seen gets is the line it was in 1.8.0: part of the hint before it.
    const plainPicks = [pickForRung(pick('B', { code: CODE }), 'mine')]
    expect(parseQuiz('Q1: 문제\nH1: 실마리\nR1: 따라가기\nA1: 답', plainPicks)[0]!.hint).toBe('실마리\nR1: 따라가기')
  })

  test('a window of a build before 1.8.0 stamped within the day keeps code never seen off; 1.8.0 and later, this session\'s own, or a stamp a day old do not', () => {
    const now = NOW
    const at = (v: string, ago: number) => ({ v, at: now - ago })
    const open = (stamps: Record<string, { v: string; at: number }>) => isOldGraderOpen(cleanStamps(stamps, now), 'mine', now)
    expect(open({ other: at('1.7.1', 29 * 60_000) })).toBe(true)
    expect(open({ other: at('1.7.0', STAMP_LIVE_MS) })).toBe(true)
    // (3/5 검토) Past the half hour too: a 1.7 window stamps only as it starts and keeps a note, so one left open
    // grading the shared quiz writes no stamp for hours.
    expect(open({ other: at('1.7.1', 31 * 60_000) })).toBe(true)
    expect(open({ other: at('1.7.1', 2 * 60 * 60_000) })).toBe(true)
    expect(open({ other: at('1.6.0', STAMP_KEPT_MS - 60_000) })).toBe(true)
    expect(open({ other: at('1.7.1', STAMP_KEPT_MS) })).toBe(false)
    expect(isOldGraderOpen({ other: at('1.7.1', STAMP_KEPT_MS) }, 'mine', now)).toBe(false)
    expect(open({ other: at('1.8.0', 60_000), third: at('1.9.0', 60_000) })).toBe(false)
    expect(open({ mine: at('1.7.1', 60_000) })).toBe(false)
    expect(open({})).toBe(false)
    expect(isOldGraderOpen({ other: at('1.7.1', 60_000) }, undefined, now)).toBe(true)
  })

  test('(3/5 검토) the code check reads a change wider than the lines a question quotes: every hunk after it, and an edit\'s file for its imports alone', () => {
    // An edit at line 18 of a file whose `import axios` stands on line 1: the lines quoted (codeFor) do not show it.
    const axiosEdit = {
      kind: 'update' as const,
      diff: [
        '@@ -18,4 +18,5 @@ export async function fetchPosts() {',
        '   try {',
        '-    const res = await fetch("/api/posts")',
        '+    const res = await axios.get("/api/posts", { params: { page: 1 } })',
        '+    return res.data',
        '   } catch (err) {',
        '     return []',
      ].join('\n'),
    }
    const quoted = codeFor(axiosEdit, 'axios 응답의 내용은 data에 있습니다 — `return res.data`')!
    expect(quoted).toContain('axios.get(')
    expect(isUnrunnableCode(quoted)).toBe(false)
    const head = 'import axios from "axios"\n\nexport async function fetchPosts() {\n  try {\n'
    expect(isUnrunnableChange(axiosEdit, head)).toBe(true)
    expect(isUnrunnableChange(axiosEdit, "import { get } from './http.js'\nconst fs = require('node:fs')\n")).toBe(false)
    // Its file not read (gone, too big, kept from Read): unknown, so never code never seen.
    expect(isUnrunnableChange(axiosEdit, undefined)).toBe(true)
    // A Python file's import line, the standard library's too.
    const pandasEdit = { kind: 'update' as const, diff: '@@ -30,2 +30,3 @@ def summary(df):\n     rows = df[df["score"] > 0]\n-    return rows\n+    by_team = rows.groupby("team")["score"].mean()\n+    print(by_team["a"])' }
    expect(isUnrunnableCode(codeFor(pandasEdit, '그룹별 평균 — `groupby("team")`')!)).toBe(false)
    expect(isUnrunnableChange(pandasEdit, 'import pandas as pd\n\n\ndef summary(df):\n')).toBe(true)
    expect(isUnrunnableChange(pandasEdit, 'def summary(df):\n    pass\n')).toBe(false)
    // The file is read for its imports alone: a page touched elsewhere in it is not this code's.
    expect(isUnrunnableChange(pandasEdit, "const el = document.querySelector('#a')\nel.addEventListener('click', go)")).toBe(false)
    // Every hunk, not only the one quoted: a hook called in another hunk of the change.
    const twoHunks = {
      kind: 'update' as const,
      diff: '@@ -1,2 +1,2 @@\n-const step = 1\n+const step = 2\n console.log(step)\n@@ -40,1 +40,2 @@\n const [n, setN] = useState(0)\n+setN(c => c + step)',
    }
    expect(codeFor(twoHunks, '`const step = 2`')).toContain('const step = 2')
    expect(isUnrunnableChange(twoHunks, '')).toBe(true)
    // A file the change made whole: its diff has every line from the top, so no file is needed.
    expect(isUnrunnableChange({ kind: 'create', diff: '@@ -0,0 +1,2 @@\n+const xs = [1, 2].map(x => x * 2)\n+console.log(xs[1])' }, undefined)).toBe(false)
    expect(isUnrunnableChange({ kind: 'create', diff: "@@ -0,0 +1,2 @@\n+import { useState } from 'react'\n+const [n, setN] = useState(0)" }, undefined)).toBe(true)
  })

  test('(3/5 검토) a change read as needing a library keeps code never seen off whatever its lines; isNewAskable is rungOf\'s test before the code', () => {
    const library = { ...CODE, isLibrary: true }
    // Nor in code changed (1.10.0 G2): its own code.
    expect(rungOf(at(4), { ...plain, code: library }, 4, ON)).toBe('mine')
    expect(rungOf(at(5), { ...plain, code: library }, 4, { changedStep: Infinity })).toBe('mine')
    expect(rungOf(at(4), { ...plain, code: { ...CODE, isLibrary: false } }, 4, ON)).toBe('new')
    expect(isNewAskable(at(4), 'src/cart.js', true, 4)).toBe(true)
    expect(isNewAskable(at(5), 'app/evens.py', true, 4)).toBe(true)
    expect(isNewAskable(at(3), 'src/cart.js', true, 4)).toBe(false)
    expect(isNewAskable(at(4), 'src/cart.js', false, 4)).toBe(false)
    expect(isNewAskable(at(4), 'src/App.tsx', true, 4)).toBe(false)
    expect(isNewAskable(at(5), 'src/cart.js', true, Infinity)).toBe(false)
    expect(isNewAskable(at(5), 'src/cart.js', true)).toBe(RUNG_NEW_STEP <= 5)
  })

  test('(3/5 검토) a reply whose first fence the model left open is read again markers and all: the R line is a marker there too, its trace in no hint', () => {
    const picks = [pickForRung(pick('A', { code: CODE }), 'new'), pickForRung(pick('B', { code: CODE }), 'new')]
    const text = [
      'T1: 예측',
      'Q1: 아래 코드는 무엇을 찍을까요?',
      '```js',
      'const xs = [3, 4]',
      'let s = 0',
      'for (const x of xs) s += x',
      'console.log(s)',
      'H1: 하나씩 더해 보세요',
      'R1: s는 0에서 3, 다시 7이 된다',
      'A1: 7',
      'T2: 왜',
      'Q2: 왜 let으로 썼을까요?',
      'H2: 바뀌는 값',
      'R2: s가 두 번 바뀐다',
      'A2: 다시 대입하므로',
    ].join('\n')
    const items = parseQuiz(text, picks)
    expect(items.map(one => [one.name, one.hint, one.answer])).toEqual([
      ['A', '하나씩 더해 보세요', '7'],
      ['B', '바뀌는 값', '다시 대입하므로'],
    ])
    expect(items[0]!.question).toBe('아래 코드는 무엇을 찍을까요?\n```js\nconst xs = [3, 4]\nlet s = 0\nfor (const x of xs) s += x\nconsole.log(s)\n```')
    expect(JSON.stringify(items)).not.toContain('0에서 3')
    expect(JSON.stringify(items)).not.toContain('두 번 바뀐다')
  })
})

/** The line said after the worked example's own for one of a concept no code met (교차 검토 2, WORKED_PLAIN_ASK). */
const WORKED_PLAIN =
  '칸 뒤에 언어가 없는 풀이 보고 풀기(코드 없이 만난 개념)도 문제를 "풀이:"로 시작하고 "이제 풀어 보세요:" 뒤에 묻는다. 풀이와 문제 모두 그 개념이 쓰이는 명령·주소·설정·상황으로 쓰고, 다른 개념의 예로 바꾸지 않는다. 풀이의 결과는 예의 모든 줄을 차례로 따라가, 그 도구의 기본 설정에서 실제로 나오는 것만 쓴다. 문제의 답은 풀이 결과의 어느 줄이나 개수와도 같지 않게 한다.'

describe('1.9.0 (교차 검토 2): a worked example of a concept no code met is told more of how; one in code is told as in 1.8.0', () => {
  const GIT = { what: '커밋하지 않은 수정도 push로 올라간다고 봄', question: '커밋하지 않고 `git push`를 하면?', mine: '올라갑니다' }
  const plainWorked = pickForRung(pick('git push', { slip: GIT }), rungOf(at(0), { ...plain, slip: { times: 2 }, isAsking: true }, Infinity, ON))
  const codeWorked = pickForRung(pick('합계', { code: CODE, slip: SLIP }), rungOf(at(0), { ...plain, code: CODE, slip: { times: 2 }, isAsking: true }, Infinity, ON))
  const retry = pickForRung(pick('git pull', { slip: GIT }), rungOf(at(0), { ...plain, slip: { times: 1 }, isAsking: true }, Infinity, ON))

  test('the line comes right after the worked example\'s own, once, when one of the quiz\'s worked examples has no language', () => {
    expect([plainWorked.rung, plainWorked.lang, codeWorked.rung, codeWorked.lang, retry.rung]).toEqual(['worked', undefined, 'worked', 'js', undefined])
    const alone = quizPrompt([plainWorked], 'beginner')
    expect(alone).toContain('\n   칸: 풀이 보고 풀기\n\n')
    expect(alone).toContain(`힌트에서 풀이를 되풀이하지 않는다.\n${WORKED_PLAIN}\n'처음 보는 코드'·'풀이 보고 풀기' 칸은`)
    const both = quizPrompt([codeWorked, plainWorked], 'beginner')
    expect(both.split(WORKED_PLAIN).length).toBe(2)
    // Two of them in one quiz: still once.
    const two = quizPrompt([plainWorked, { ...plainWorked, key: 'c:git pull', name: 'git pull' }], 'beginner')
    expect(two.split(WORKED_PLAIN).length).toBe(2)
  })

  test('none for a worked example in code, nor for a quiz with no worked example: those prompts are as before', () => {
    const inCode = quizPrompt([codeWorked], 'beginner')
    expect(inCode).toContain('\n   칸: 풀이 보고 풀기 (js로)\n')
    expect(inCode).not.toContain('칸 뒤에 언어가 없는')
    expect(quizPrompt([codeWorked, retry], 'beginner')).not.toContain('칸 뒤에 언어가 없는')
    expect(quizPrompt([retry], 'beginner')).not.toContain('칸 뒤에 언어가 없는')
    // With worked examples off (the release's constant, or a harness's Infinity), a concept missed twice is asked again.
    const off = pickForRung(pick('git push', { slip: GIT }), rungOf(at(0), { ...plain, slip: { times: 2 }, isAsking: true }, Infinity, { changedStep: 2, workedAfter: Infinity }))
    expect(off.rung).toBeUndefined()
    expect(quizPrompt([off], 'beginner')).not.toContain('풀이 보고 풀기')
  })
})

/** A quiz of quiz18.ts as makeQuiz builds it: each pick's rung (rungOf), the rungs as the quiz asks them (ladderMixed), each pick for its rung. */
function quizOf(one: (typeof QUIZ_CASES_18)[number], newStep: number, steps: { changedStep: number; workedAfter: number }): QuizPick[] {
  const bases = one.picks.map(p => {
    const base: QuizPick = {
      ...p.one,
      ...(p.how.code ? { code: p.how.code } : {}),
      ...(p.slip ? { slip: p.slip } : {}),
      ...(p.team ? { team: true as const } : {}),
      ...(p.isTeamMarked ? { isTeamMarked: true as const } : {}),
    }
    return base
  })
  const rungs = one.picks.map(p =>
    rungOf(p.one, { ...(p.how.code ? { code: p.how.code } : {}), ...(p.how.slip ? { slip: p.how.slip } : {}), isAsking: p.how.isAsking ?? false, isTeam: p.how.isTeam ?? false, isDue: p.how.isDue }, newStep, steps),
  )
  const asked = ladderMixed(rungs, bases)
  return bases.map((base, i) => pickForRung(base, asked[i]))
}
/** A fixture's key for a quiz of quiz18.ts: its id, then code never seen's step and worked examples' misses, `off` for Infinity. */
const keyOf = (id: string, newStep: number, workedAfter: number) => `${id} ${newStep === Infinity ? 'off' : newStep} ${workedAfter === Infinity ? 'off' : workedAfter}`
const CHANGED_18 = '비슷한 코드: 학습자 코드에서 값·조건·순서 중 한 곳을 바꾼 코드를 보여 주고 묻는다. 원래 코드의 답으로는 맞힐 수 없게 바꾼다.'
/** 1.9.0's sentence for 비슷한 코드 (F3), gone from 1.10.0 (G2). */
const CHANGED_19 = `${CHANGED_18} 바꿔 보기로 낼 때도 학습자 코드를 그대로 보이거나 몇 줄만 떼어 보이지 않고, 한 곳을 바꾼 코드에서 묻는다.`
/** 1.10.0's sentence for 비슷한 코드 (G2), as its design wrote it (458 characters). */
const CHANGED_110 =
  '비슷한 코드: 학습자 코드에서 값·조건·순서 중 한 곳을 바꾼 코드를 코드 블록 하나로 보여 주고, 그 코드가 찍는 것을 예측으로 묻는다. 다른 문제와 유형이 겹쳐도 이 칸은 예측으로 낸다. 원래 코드의 답으로는 맞힐 수 없게 바꾼다. 그 블록만 따로 돌려도 그대로 실행되게 쓴다: 쓰는 변수·함수·클래스는 모두 블록 안에서 정의하고(학습자 코드에 정의가 보이지 않으면 짧게 새로 쓴다), 찍는 줄이 없으면 결과를 console.log나 print로 찍는 줄을 더한다. 출력은 3줄 이하로 둔다. A 바로 앞에 같은 번호의 R 줄(예: R2:)을 두어 그 코드를 한 줄씩 따라간 과정을 쓰고, A에는 찍히는 글자만 줄마다 그대로 쓴다(설명을 붙이지 않는다). 오류로 멈추는 코드면 A에 그 앞까지 찍힌 글자와 오류 이름(예: TypeError)을 쓴다. 문제(Q)와 힌트(H)에는 출력값이나 따라간 과정을 쓰지 않는다.'
const CHANGED_TRACE = 'R1: (칸이 "비슷한 코드"인 문제만: 보인 코드를 한 줄씩 따라간 과정)'
const NEW_TRACE = 'R1: (칸이 "처음 보는 코드"인 문제만: 코드를 한 줄씩 따라간 과정)'

describe('1.10.0 (G2): with 비슷한 코드 off, every quiz of quiz18.ts is 1.9.0\'s (fca5988) to the byte, code never seen and worked examples off or on', () => {
  for (const one of QUIZ_CASES_18) {
    test(`${one.id}: the rungs, the prompt and the questions read back`, () => {
      // Off: the release's constant (D1) and a harness's null alike.
      expect(RUNG_CHANGED_STEP).toBe(Infinity)
      for (const newStep of [Infinity, 4]) {
        for (const workedAfter of [Infinity, 2]) {
          const want = QUIZ_OUTPUT_19_OFF[keyOf(one.id, newStep, workedAfter)]!
          const picks = quizOf(one, newStep, { changedStep: Infinity, workedAfter })
          expect(picks.map(p => p.rung ?? null)).toEqual(want.rungs)
          expect(quizPrompt(picks, one.level)).toBe(want.prompt)
          expect(JSON.parse(JSON.stringify(parseQuiz(QUIZ_REPLIES_18[one.id]!, picks)))).toEqual(JSON.parse(JSON.stringify(want.items)))
        }
      }
      expect(QUIZ_NOW_18).toBeGreaterThan(0)
    })
  }
})

describe('1.10.0 (G2): 비슷한 코드 on (a harness\'s 2): a prediction in one block that runs alone, its trace on an R line, only in a quiz of the shape its samples measured', () => {
  const ON2 = { changedStep: 2, workedAfter: Infinity }
  const PY = { file: 'app/evens.py', text: 'nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])' }

  test('every quiz of quiz18.ts: as the design\'s preview made it where code changed is left in a quiz of three with no team term; as with it off elsewhere', () => {
    const kept: string[] = []
    for (const one of QUIZ_CASES_18) {
      for (const newStep of [Infinity, 4]) {
        for (const workedAfter of [Infinity, 2]) {
          const key = keyOf(one.id, newStep, workedAfter)
          const want = QUIZ_OUTPUT_110_ON[key] ?? QUIZ_OUTPUT_19_OFF[key]!
          if (QUIZ_OUTPUT_110_ON[key]) kept.push(key)
          const picks = quizOf(one, newStep, { changedStep: 2, workedAfter })
          expect([key, picks.map(p => p.rung ?? null)]).toEqual([key, want.rungs])
          expect(quizPrompt(picks, one.level)).toBe(want.prompt)
          expect(JSON.parse(JSON.stringify(parseQuiz(QUIZ_REPLIES_18[one.id]!, picks)))).toEqual(JSON.parse(JSON.stringify(want.items)))
        }
      }
    }
    // A worked example in the quiz (worked, its slip missed twice), two picks (retry) or a team term (blank) take it off.
    expect(kept).toEqual(['mixed off off', 'mixed off 2', 'mixed 4 off', 'mixed 4 2', 'worked off off', 'worked 4 off'])
  })

  test('its sentence is the design\'s, 458 characters, and 1.9.0\'s is nowhere; a quiz of it alone is not told it may write code', () => {
    expect(CHANGED_110.length).toBe(458)
    const prompt = quizPrompt([pickForRung(pick('A', { code: CODE }), 'changed'), pickForRung(pick('B', { code: PY }), 'changed'), pickForRung(pick('C', { code: CODE }), 'mine')], 'beginner')
    expect(prompt.split('\n').filter(line => line.startsWith('비슷한 코드:'))).toEqual([CHANGED_110])
    expect(prompt).toContain(`\n내 코드: 학습자가 만든 코드를 그대로 보여 주고 묻는다.\n${CHANGED_110}\n`)
    expect(prompt).not.toContain(CHANGED_19)
    expect(prompt).not.toContain(CHANGED_18)
    expect(prompt).not.toContain("'처음 보는 코드'·'풀이 보고 풀기' 칸은")
    expect(prompt).toContain('1. A — A 설명\n   칸: 비슷한 코드\n   학습자가 만든 코드 (src/cart.js):\n```\nlet total = 0')
    expect(prompt).toContain('2. B — B 설명\n   칸: 비슷한 코드\n   학습자가 만든 코드 (app/evens.py):\n```\nnums = [1, 2, 3, 4]')
    for (const one of Object.values(QUIZ_OUTPUT_110_ON)) {
      expect(one.prompt).toContain(`\n${CHANGED_110}\n`)
      expect(one.prompt).not.toContain(CHANGED_19)
    }
    for (const one of Object.values(QUIZ_OUTPUT_19_OFF)) expect(one.prompt).not.toContain(CHANGED_110)
  })

  test('its R line stands right after H1 and right before A1 in a quiz with code changed; a quiz with code never seen has its own alone; a quiz with neither, none', () => {
    const changed = quizPrompt([pickForRung(pick('A', { code: CODE }), 'changed'), pick('B'), pick('C')], 'beginner')
    expect(CHANGED_TRACE_LINE).toBe(CHANGED_TRACE)
    expect(changed).toContain(`\nT1: (예측 · 왜 · 바꿔 보기 중 하나)\nQ1: (문제 한두 문장)\nH1: (힌트 한 문장)\n${CHANGED_TRACE}\nA1: (답 한두 문장)\nT2: …`)
    expect(changed).not.toContain(NEW_TRACE)
    const fresh = quizPrompt([pickForRung(pick('A', { code: CODE }), 'new'), pickForRung(pick('B', { code: CODE }), 'mine'), pick('C')], 'beginner')
    expect(fresh).toContain(`\nH1: (힌트 한 문장)\n${NEW_TRACE}\nA1: (답 한두 문장)\n`)
    expect(fresh).not.toContain(CHANGED_TRACE)
    // Both (never sent: ladderMixed asks code changed in its own code beside code never seen): code never seen's alone.
    const both = quizPrompt([pickForRung(pick('A', { code: CODE }), 'new'), pickForRung(pick('B', { code: CODE }), 'changed'), pick('C')], 'beginner')
    expect(both.split('\nR1:').length).toBe(2)
    expect(both).toContain(NEW_TRACE)
    const own = quizPrompt([pickForRung(pick('A', { code: CODE }), 'mine'), pick('B'), pick('C')], 'beginner')
    expect(own).toContain('\nH1: (힌트 한 문장)\nA1: (답 한두 문장)\n')
    expect(own).not.toContain('R1:')
  })

  test('its scope: code that runs alone in js, mjs, cjs, ts or py whose run settles one output, from its step; any other, its own code', () => {
    const rung = (file: string, text: string, step = 2, more: { isLibrary?: boolean } = {}) => rungOf(at(step), { ...plain, code: { file, text, ...more } }, Infinity, ON2)
    const plainCode = 'let a = 1\nconsole.log(a + 1)'
    for (const file of ['a.js', 'a.mjs', 'a.cjs', 'src/a.ts', 'A.JS']) expect([file, rung(file, plainCode)]).toEqual([file, 'changed'])
    expect(rung('app/a.py', 'a = 1\nprint(a + 1)')).toBe('changed')
    for (const file of ['a.jsx', 'a.tsx', 'a.css', 'Makefile', 'main.go', 'a.rb']) expect([file, rung(file, plainCode)]).toEqual([file, 'mine'])
    const unsettled: [string, string][] = [
      ['a.js', 'const r = await fetch(url)'],
      ['a.js', 'const x = new XMLHttpRequest()'],
      ['a.js', 'console.log(Math.random())'],
      ['a.js', 'const t = Date.now()'],
      ['a.js', 'const d = new Date()'],
      ['a.js', 'console.log(process.env.HOME)'],
      ['a.js', 'console.log(process.argv[2])'],
      ['a.js', "import fs from 'node:fs'"],
      ['a.js', "const fs = require('node:fs')"],
      ['a.py', 'name = input()'],
      ['a.py', 'f = open("a.txt")'],
      ['a.js', 'const id = crypto.randomUUID()'],
      ['a.js', 'const t = performance.now()'],
      ['a.js', 'console.log(n.toLocaleString())'],
      ['a.js', "console.log(d.toLocaleDateString('ko'))"],
      ['a.js', 'new Intl.NumberFormat("ko").format(n)'],
      ['a.py', 'import math\nprint(math.pi)'],
      ['a.py', 'from collections import Counter'],
      ['a.js', "import { sum } from 'lodash'"],
      ['a.js', 'return <Button />'],
      ['a.js', 'const [a, setA] = useState(0)'],
      ['a.js', "document.querySelector('#a')"],
      ['a.py', 'print(id(x))'],
      ['a.py', 'print(hash("a"))'],
    ]
    for (const [file, text] of unsettled) expect([text, rung(file, text)]).toEqual([text, 'mine'])
    // A change read as needing a library (withCode's isLibrary): its own code.
    expect(rung('a.js', plainCode, 2, { isLibrary: true })).toBe('mine')
    // hash( only in Python (a salted hash): a function of the learner's in JavaScript is code like any other.
    expect(rung('a.js', 'const h = hash(pw)\nconsole.log(h)')).toBe('changed')
    for (const text of ['const total = items.reduce((a, b) => a + b, 0)', 'const { id } = user', 'const fetched = 1', 'el.open = true', "import { sum } from './math'"]) {
      expect([text, rung('a.js', text)]).toEqual([text, 'changed'])
    }
    expect(rung('a.py', 'valid = is_valid(x)\nprint(valid)')).toBe('changed')
    // Before its step: its own code; with it off: its own code at every step.
    expect(rung('a.js', plainCode, 1)).toBe('mine')
    expect(rungOf(at(5), { ...plain, code: { file: 'a.js', text: plainCode } }, Infinity, { changedStep: Infinity })).toBe('mine')
    // Fallen from code never seen for a library: not code changed either.
    expect(rungOf(at(4), { ...plain, code: { file: 'a.js', text: plainCode, isLibrary: true } }, 4, ON2)).toBe('mine')
    expect(rungOf(at(4), { ...plain, code: { file: 'a.js', text: "import { useState } from 'react'" } }, 4, ON2)).toBe('mine')
    // isChangedRunnable: the language and the settled run alone; a pick whose text is not known goes by its file.
    expect(isChangedRunnable({ file: 'a.ts' })).toBe(true)
    expect(isChangedRunnable({ file: 'a.tsx' })).toBe(false)
    expect(isChangedRunnable({ file: 'a.py', text: 'print(hash(1))' })).toBe(false)
    expect(isChangedRunnable({ file: 'a.js', text: 'print(hash(1))' })).toBe(true)
  })

  test('isChangedAskable, which reads a change wider: from its step, in a language its samples ran, due or not; never with it off', () => {
    expect(isChangedAskable(at(2), 'src/cart.js', 2)).toBe(true)
    expect(isChangedAskable(at(5), 'app/evens.py', 2)).toBe(true)
    expect(isChangedAskable(at(1), 'src/cart.js', 2)).toBe(false)
    expect(isChangedAskable(at(2), 'src/App.tsx', 2)).toBe(false)
    expect(isChangedAskable(at(2), 'Makefile', 2)).toBe(false)
    expect(isChangedAskable(at(5), 'src/cart.js', Infinity)).toBe(false)
    expect(isChangedAskable(at(5), 'src/cart.js')).toBe(RUNG_CHANGED_STEP <= 5)
  })

  test('ladderMixed: code changed beside code never seen or a worked example, and code changed or never seen in a quiz of fewer than three or with a team term, are asked in their own code; the rest as they are, in order', () => {
    const none = [{}, {}, {}]
    expect(ladderMixed(['changed', 'mine', undefined], none)).toEqual(['changed', 'mine', undefined])
    expect(ladderMixed(['changed', 'changed', 'changed'], none)).toEqual(['changed', 'changed', 'changed'])
    expect(ladderMixed(['changed', 'new', 'mine'], none)).toEqual(['mine', 'new', 'mine'])
    expect(ladderMixed(['mine', 'changed', 'worked'], none)).toEqual(['mine', 'mine', 'worked'])
    expect(ladderMixed([undefined, 'worked', 'changed'], none)).toEqual([undefined, 'worked', 'mine'])
    expect(ladderMixed(['new', 'mine', undefined], none)).toEqual(['new', 'mine', undefined])
    expect(ladderMixed(['worked', 'mine', undefined], none)).toEqual(['worked', 'mine', undefined])
    // D33 (1): a team term of this repository or of another anywhere in the quiz.
    expect(ladderMixed(['changed', 'mine', undefined], [{}, {}, { team: true }])).toEqual(['mine', 'mine', undefined])
    expect(ladderMixed(['changed', 'new', 'mine'], [{ isTeamMarked: true }, {}, {}])).toEqual(['mine', 'mine', 'mine'])
    expect(ladderMixed(['new', 'mine', 'mine'], [{}, {}, { isTeamMarked: true }])).toEqual(['mine', 'mine', 'mine'])
    expect(ladderMixed(['worked', 'mine', undefined], [{}, {}, { team: true }])).toEqual(['worked', 'mine', undefined])
    // D33 (2): fewer than three picks.
    expect(ladderMixed(['changed', 'changed'], [{}, {}])).toEqual(['mine', 'mine'])
    expect(ladderMixed(['new'], [{}])).toEqual(['mine'])
    expect(ladderMixed(['changed', undefined], [{}, {}])).toEqual(['mine', undefined])
    expect(ladderMixed(['worked', 'mine'], [{}, {}])).toEqual(['worked', 'mine'])
    expect(ladderMixed([], [])).toEqual([])
    // More than three (a base concept beside its worked example, 1.9.0 F5) is measured as three.
    expect(ladderMixed(['changed', 'mine', 'mine', undefined], [{}, {}, {}, {}])).toEqual(['changed', 'mine', 'mine', undefined])
    // The pick of a rung lowered keeps its code: asked in its own code.
    const lowered = pickForRung(pick('A', { code: CODE }), ladderMixed(['changed', 'new'], [{}, {}])[0])
    expect(lowered).toMatchObject({ rung: 'mine', code: CODE })
  })

  test('its R line is a marker, dropped: none of it in the question, the hint or the answer; an R1: line in a code block is the code\'s own', () => {
    const picks = [pickForRung(pick('A', { code: CODE }), 'changed'), pickForRung(pick('B', { code: CODE }), 'mine'), pick('C')]
    const code = '```js\nlet total = 10\nfor (const n of [1, 2]) total += n\nconsole.log(total)\n```'
    const text = [
      'T1: 예측',
      `Q1: 아래 코드는 무엇을 찍을까요?\n${code}`,
      'H1: 처음 값을 보세요',
      'R1: total은 10에서 11, 다시 13이 된다',
      'A1: 13',
      'T2: 왜',
      'Q2: 아래 코드에서 let을 const로 바꾸면?\n```js\nlet total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)\n```',
      'H2: 다시 대입',
      'A2: 오류',
      'T3: 왜',
      'Q3: 왜 그렇게 썼을까요?',
      'A3: 그래서',
    ].join('\n')
    const items = parseQuiz(text, picks)
    expect(items.map(one => [one.rung, one.kind])).toEqual([['changed', 'predict'], ['mine', 'why'], [undefined, 'why']])
    expect(items[0]).toMatchObject({ question: `아래 코드는 무엇을 찍을까요?\n${code}`, hint: '처음 값을 보세요', answer: '13' })
    expect(JSON.stringify(items)).not.toContain('10에서 11')
    expect(JSON.stringify(items)).not.toContain('R1')
    // An R1: line inside the code shown is the code's line, not a marker.
    const inCode = parseQuiz(['T1: 예측', 'Q1: 아래 코드는?', '```py', 'R1: int = 3', 'print(R1 + 1)', '```', 'H1: 더하기', 'R1: 3에 1을 더한다', 'A1: 4'].join('\n'), picks.slice(0, 1))[0]!
    expect(inCode.question).toBe('아래 코드는?\n```py\nR1: int = 3\nprint(R1 + 1)\n```')
    expect(inCode).toMatchObject({ hint: '더하기', answer: '4', rung: 'changed' })
    // With it off (no pick on the rung), an R line is the hint's, as in 1.9.0.
    const off = parseQuiz('Q1: 문제\nH1: 실마리\nR1: 따라가기\nA1: 답', [pickForRung(pick('A', { code: CODE }), 'mine')])[0]!
    expect(off.hint).toBe('실마리\nR1: 따라가기')
  })

  test('a question with no code shown keeps no rung, nor one showing the learner\'s code as it was; code changed in its block, or said changed beside it, keeps it', () => {
    const picks = [pickForRung(pick('A', { code: { file: 'a.js', text: 'const limit = 3\nconsole.log(limit * 2)' } }), 'changed')]
    const rung = (question: string) => parseQuiz(`T1: 예측\nQ1: ${question}\nA1: 답`, picks)[0]!.rung
    expect(rung('제한을 늘리면 무엇이 달라질까요?')).toBeUndefined()
    expect(rung('아래 코드는?\n```js\n```')).toBeUndefined()
    expect(rung('아래 코드는?\n```js\nconst limit = 3\nconsole.log(limit * 2)\n```')).toBeUndefined()
    expect(rung('아래 코드는?\n```js\nconst limit = 5\nconsole.log(limit * 2)\n```')).toBe('changed')
    // The block as it was with the change said in words (1.8.0's way): still code changed.
    expect(rung('아래 코드에서 `3`을 `4`로 바꾸면 무엇이 찍힐까요?\n```js\nconst limit = 3\nconsole.log(limit * 2)\n```')).toBe('changed')
    // The grade marks it as 1.8.0 did: wrong to the first step, 거의 one step back.
    expect(markFor('wrong', undefined, false, 'changed')).toBe(markWrong)
    expect(markFor('wrong', 'partial', false, 'changed')).toBe(markPartial)
  })
})

describe('1.9.0 마무리 검토: 풀이 보고 풀기 ships off, as the samples\' rule gives counted the way it was set', () => {
  test('the constant is off, and a concept missed twice running is asked again with no worked example, met in code or not', () => {
    // docs/qa/견본.md, '출력 상한을 올린 뒤 다시 잼': its questions run as shown (the bar's own way), the branch in code
    // got A right on 18 of 20 against a bar of 19, so the rule gives off whatever the branch with no code got. Only a
    // new sample, its bar and stance set before it, turns it on.
    expect(WORKED_AFTER_TIMES).toBe(Infinity)
    const asking = { ...plain, isAsking: true }
    expect(rungOf(at(2), { ...asking, code: CODE, slip: { times: 2 } })).toBeUndefined()
    expect(rungOf(at(2), { ...asking, code: { file: 'Makefile', text: 'all:\n\techo hi' }, slip: { times: 3 } })).toBeUndefined()
    expect(rungOf(at(0), { ...asking, slip: { times: 2 } })).toBeUndefined()
    // The grade's line promises none: a second miss on no question asked again is told the next quiz's other code.
    expect(slipNotice({ result: 'wrong', gradedAt: NOW }, { ...SLIP, times: 2, at: NOW }, false)).toEqual({ kind: 'slip', text: `헷갈린 점: ${SLIP.what} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })
  })
})
