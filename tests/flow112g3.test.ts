// The tests of the 1.12.0 G3 design (처음 보는 코드, K · L · A): a window as a person runs it (the kit, flowkit.ts).
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
import {
  CHECK_SYSTEM,
  NEW_HINT_PLAIN,
  NEW_LEAD,
  NEW_LOCAL_RIGHT,
  NEW_NONE_TEXT,
  QUIZ_SYSTEM,
  checkPrompt,
  conceptKey,
} from '../hooks/notes'
import { CONCEPT_NOTE, NOW, finish, learn, ownSteps, routeCalls, start, turn, world } from './flowkit'

const DAY = 86_400_000
const NAME = 'for...of 반복문'
const CODE = ['const cup = [3, 4]', 'let price = 0', 'for (const x of cup) price += x', 'console.log(price)', 'console.log(cup.length)'].join('\n')
const ITEM = { key: conceptKey(NAME), name: NAME, question: `${NEW_LEAD}\n\`\`\`js\n${CODE}\n\`\`\``, hint: NEW_HINT_PLAIN, answer: '7\n2', kind: 'predict' as const, rung: 'new' as const }
const itemsOf = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
const ON_ROW = { models: { haiku: { rungNewStep: 4 } } }
const OVERRIDDEN = { user: { modelOverrides: { 'some-model-1': 'override-target-x' } } }

/** A window on a store holding a quiz with ITEM (as an ON window composed it), `answer` in place of its answer. */
async function opened($: Engine, on: On, harness: Record<string, unknown> | null, answer = ITEM.answer) {
  const calls = routeCalls(on)
  const concepts = { [conceptKey(NAME)]: { name: NAME, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${NAME} 설명`, files: ['a.js'], step: 4, reviewedAt: NOW - 31 * DAY } }
  const quiz = { at: NOW - 60_000, isRevealed: false, items: [{ ...ITEM, answer }] }
  const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)], ['quiz', quiz]])
  const w = world(on, 'ok', null, true, store)
  if (harness) w.harness = harness
  await start($)
  return { w, store, calls }
}

describe('1.12.0 G3: the grade of a prediction in code never seen (K · L · A)', () => {
  test('on: a right answer in a common shape is graded right by the plugin alone, no model call; its feedback NEW_LOCAL_RIGHT', { options: { model: 'haiku' } }, async ($, on) => {
    const { store, calls } = await opened($, on, ON_ROW)
    const count = calls.length
    expect((await learn($, '퀴즈 1 7, 2요')).text).toContain(NEW_LOCAL_RIGHT)
    expect(calls).toHaveLength(count)
    expect(itemsOf(store)[0]).toMatchObject({ result: 'right', rung: 'new' })
  })

  test('on: anything else is graded by values at 480 and 60000 (the request to the byte), its verdict the plugin\'s from the 값 lines; the try again right by the plugin alone', { options: { model: 'haiku' } }, async ($, on) => {
    const { w, store, calls } = await opened($, on, ON_ROW)
    w.answer = ['값 1: 7', '값 2: 3', '피드백: 둘째 줄이 3이라면 무엇을 셌을까요.', '되묻기: 둘째 줄은 무엇의 길이일까요?', '헷갈린 점: 길이를 마지막 값으로 봄', '유형: 경계값'].join('\n')
    await learn($, '퀴즈 1 7이랑 3')
    expect(calls.at(-1)).toEqual({ model: 'haiku', effort: 'low', system: CHECK_SYSTEM, prompt: checkPrompt(ITEM, '7이랑 3', 'beginner', undefined, undefined, { exact: true }), maxTokens: 480, timeoutMs: 60_000 })
    expect(itemsOf(store)[0]!.firstTry).toMatchObject({ mine: '7이랑 3', verdict: 'wrong' })
    const count = calls.length
    await learn($, '퀴즈 1 7, 2')
    expect(calls).toHaveLength(count)
    expect(itemsOf(store)[0]).toMatchObject({ result: 'right', rung: 'new' })
  })

  test('on: a grade that copies the model answer\'s value where the learner wrote another is wrong (the value is not in the answer)', { options: { model: 'haiku' } }, async ($, on) => {
    const { w, store } = await opened($, on, ON_ROW)
    w.answer = ['값 1: 7', '값 2: 2', '피드백: f', '되묻기: n'].join('\n')
    await learn($, '퀴즈 1 7 그리고 4개요')
    expect(itemsOf(store)[0]!.firstTry).toMatchObject({ verdict: 'wrong' })
  })

  test('on, then remapped after the window started (modelOverrides set): the grade asks the alias again and is 1.9.0\'s, no local grade', { options: { model: 'haiku' } }, async ($, on) => {
    const { w, store, calls } = await opened($, on, ON_ROW)
    w.settings = OVERRIDDEN
    const count = calls.length
    w.answer = '판정: 맞음\n피드백: 정확합니다.'
    await learn($, '퀴즈 1 7, 2요')
    expect(calls).toHaveLength(count + 1)
    expect(calls.at(-1)).toEqual({ model: 'haiku', effort: 'low', system: CHECK_SYSTEM, prompt: checkPrompt(ITEM, '7, 2요', 'beginner'), maxTokens: 480, timeoutMs: 60_000 })
    expect(itemsOf(store)[0]).toMatchObject({ result: 'right' })
  })

  test('off (haiku as shipped): a stored K · L · A item is graded as 1.9.0 to the byte, 거의 kept as 거의; shown with its answer in a block', { options: { model: 'haiku' } }, async ($, on) => {
    const { w, store, calls } = await opened($, on, null, '****\n2')
    w.answer = '판정: 거의\n피드백: 거의 맞았습니다.\n되묻기: 첫 줄을 다시 보세요.'
    await learn($, '퀴즈 1 ***, 2')
    expect(calls.at(-1)!.prompt).toBe(checkPrompt({ ...ITEM, answer: '****\n2' }, '***, 2', 'beginner'))
    expect(itemsOf(store)[0]!.firstTry).toMatchObject({ verdict: 'partial' })
    expect((await learn($, '퀴즈 정답 1')).text).toContain('```text\n****\n2\n```')
  })
})

describe('1.12.0 G3: the quiz (K · L · A, scenes, the session\'s missed list)', () => {
  const FILE = ['const items = [3, 4]', 'let total = 0', 'for (const item of items) total += item', 'console.log(total)', ''].join('\n')
  /** `names` due at their fifth step, met in a.js written whole; `fillers` not due. The quiz this world sends with `reply`. */
  async function quizOf($: Engine, on: On, names: string[], fillers: string[], reply: string) {
    const calls = routeCalls(on)
    const concepts = Object.fromEntries([
      ...names.map(name => [conceptKey(name), { name, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명 — \`for (const item of items)\``, files: [], step: 4, reviewedAt: NOW - 31 * DAY }]),
      ...fillers.map(name => [conceptKey(name), { name, count: 1, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step: 3, reviewedAt: NOW }]),
    ])
    const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)]])
    const w = world(on, 'ok', null, true, store)
    w.harness = ON_ROW
    w.files.set('/proj/src/a.js', FILE)
    await start($)
    w.answer = CONCEPT_NOTE(names)
    await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/a.js', content: FILE }))
    await finish(w)
    w.answer = reply
    const said = await learn($, '퀴즈 새로')
    return { w, store, calls, said }
  }
  const BAD_K = (n: number) => [`K${n}:`, '```js', 'const cup = [1, 2]', 'for (const x of cup) {', '  console.log(x)', '}', '```', `L${n}: const cup = [1, 2]`, `A${n}:`, '1', '2'].join('\n')
  const WHY = (n: number) => [`T${n}: 왜`, `Q${n}: 이 개념은 왜 쓸까요?`, `H${n}: 쓰임을 떠올려 보세요`, `A${n}: 값을 하나씩 꺼내 쓰려고 씁니다.`].join('\n')

  test('a new pick: its K · L · A prompt at 4600 with a scene, no trace wording; refused (a print in a loop): no item, and the next quiz asks it in its own code', { options: { model: 'haiku' } }, async ($, on) => {
    const { w, store, calls } = await quizOf($, on, [NAME], ['채움 하나', '채움 둘'], [BAD_K(1), WHY(2), WHY(3)].join('\n'))
    const asked = calls.filter(call => call.system === QUIZ_SYSTEM).at(-1)!
    expect(asked.maxTokens).toBe(4600)
    expect(asked.prompt).toContain('   칸: 처음 보는 코드 (js로)\n   상황: ')
    expect(asked.prompt).toContain('K1:\n```js\n(코드)\n```')
    expect(asked.prompt).not.toMatch(/한 줄씩|따라간|과정|R1:|학습자가 만든 코드 \(a\.js\)/)
    expect(itemsOf(store).map(one => one.name)).not.toContain(NAME)
    await w.clock.advance(60_000)
    w.answer = [WHY(1), WHY(2), WHY(3)].join('\n')
    await learn($, '퀴즈 새로')
    const again = calls.filter(call => call.system === QUIZ_SYSTEM).at(-1)!
    expect(again.prompt).not.toContain('처음 보는 코드')
    // haiku's shipped row turns 비슷한 코드 on (1.12.0 G2, re-pinned on purpose with the switch): its own code, a file
    // written whole, is asked as code changed (1.12.0 G3 build: 내 코드 while that cell was off).
    expect(again.prompt).toContain('   칸: 비슷한 코드\n   학습자가 만든 코드 (a.js):')
  })

  test('on, then remapped after the window started (modelOverrides set): the quiz asks the alias again first and is made with code never seen off (its own code, 3400)', { options: { model: 'haiku' } }, async ($, on) => {
    // 1.12.0 build (joint G2 · G3): makeQuiz's recheckRemap runs where either quiz rung is on, this one alone here.
    const calls = routeCalls(on)
    const concepts = {
      [conceptKey(NAME)]: { name: NAME, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${NAME} 설명 — \`for (const item of items)\``, files: [], step: 4, reviewedAt: NOW - 31 * DAY },
      ...Object.fromEntries(['채움 하나', '채움 둘'].map(name => [conceptKey(name), { name, count: 1, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step: 3, reviewedAt: NOW }])),
    }
    const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)]])
    const w = world(on, 'ok', null, true, store)
    w.harness = ON_ROW
    w.files.set('/proj/src/a.js', FILE)
    await start($)
    w.answer = CONCEPT_NOTE([NAME])
    await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/a.js', content: FILE }))
    await finish(w)
    w.settings = OVERRIDDEN
    w.answer = [WHY(1), WHY(2), WHY(3)].join('\n')
    await learn($, '퀴즈 새로')
    const asked = calls.filter(call => call.system === QUIZ_SYSTEM).at(-1)!
    expect(asked.prompt).not.toContain('처음 보는 코드')
    expect(asked.prompt).toContain('   칸: 내 코드\n   학습자가 만든 코드 (a.js):')
    expect(asked.maxTokens).toBe(3400)
  })

  test('every pick new and none checked: NEW_NONE_TEXT, a fault counted (no concept named); none of them asked new again', { options: { model: 'haiku' } }, async ($, on) => {
    const names = [NAME, '배열 합', '누적 변수']
    const { w, store, said, calls } = await quizOf($, on, names, [], [BAD_K(1), BAD_K(2), BAD_K(3)].join('\n'))
    expect(said.text).toContain(NEW_NONE_TEXT)
    expect(w.logs).toContain('learn-notes: 처음 보는 코드 문제를 확인하지 못했습니다 (new-unchecked)')
    await w.clock.advance(60_000)
    const faults = JSON.stringify(store.get('faults') ?? null)
    expect(faults).toContain('new-unchecked')
    for (const name of names) expect(faults).not.toContain(name)
    await w.clock.advance(60_000)
    w.answer = [WHY(1), WHY(2), WHY(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(calls.filter(call => call.system === QUIZ_SYSTEM).at(-1)!.prompt).not.toContain('처음 보는 코드')
  })
})
