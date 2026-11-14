// D34 (1.12.0 G3): the requests the plugin sends equal, to the byte, the prompts the design pilot's tools wrote
// (tests/fixtures/d34g3.ts, from impl112/design/G3/final/gen-d34.mjs): a quiz with a pick in code never seen, and the
// three grade paths of one prediction in it (first try, after 모르겠어요 and its hint, after a question back).
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
import { CHECK_SYSTEM, QUIZ_SYSTEM, conceptKey } from '../hooks/notes'
import { D34_G3 } from './fixtures/d34g3'
import { CONCEPT_NOTE, NOW, finish, learn, ownSteps, routeCalls, start, turn, world } from './flowkit'

const DAY = 86_400_000
const ON_ROW = { models: { haiku: { rungNewStep: 4 } } }
const NAME = 'for...of 반복문'
const FILE = ['const items = [3, 4]', 'let total = 0', 'for (const item of items) total += item', 'console.log(total)', ''].join('\n')

async function storedGrade($: Engine, on: On) {
  const calls = routeCalls(on)
  const item = { ...D34_G3.item }
  const concepts = { [item.key]: { name: item.name, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${item.name} 설명`, files: ['a.py'], step: 4, reviewedAt: NOW - 31 * DAY } }
  const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)], ['quiz', { at: NOW - 60_000, isRevealed: false, items: [item] }]])
  const w = world(on, 'ok', null, true, store)
  w.harness = ON_ROW
  await start($)
  return { w, calls }
}

describe('1.12.0 G3 D34: the pilot tools\' prompts are the plugin\'s requests', () => {
  test('the quiz: one pick in code never seen and two with no code, at 4600 with QUIZ_SYSTEM', { options: { model: 'haiku' } }, async ($, on) => {
    const calls = routeCalls(on)
    const concepts = Object.fromEntries([
      [conceptKey(NAME), { name: NAME, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${NAME}에 대한 설명 — \`for (const item of items)\``, files: [], step: 4, reviewedAt: NOW - 31 * DAY }],
      ...['채움 하나', '채움 둘'].map(name => [conceptKey(name), { name, count: 1, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step: 3, reviewedAt: NOW }]),
    ])
    const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)]])
    const w = world(on, 'ok', null, true, store)
    w.harness = ON_ROW
    await start($)
    w.answer = CONCEPT_NOTE([NAME])
    await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/a.js', content: FILE }))
    await finish(w)
    w.answer = 'T1: 왜\nQ1: q\nH1: h\nA1: a'
    await learn($, '퀴즈 새로')
    const asked = calls.filter(call => call.system === QUIZ_SYSTEM).at(-1)!
    expect(asked).toEqual({ model: 'haiku', effort: 'low', system: QUIZ_SYSTEM, prompt: D34_G3.quiz.prompt, maxTokens: D34_G3.quiz.maxTokens, timeoutMs: 90_000 })
  })

  test('the first try', { options: { model: 'haiku' } }, async ($, on) => {
    const { w, calls } = await storedGrade($, on)
    w.answer = D34_G3.first.reply
    await learn($, `퀴즈 1 ${D34_G3.first.mine}`)
    expect(calls.at(-1)).toEqual({ model: 'haiku', effort: 'low', system: CHECK_SYSTEM, prompt: D34_G3.first.prompt, maxTokens: 480, timeoutMs: 60_000 })
  })

  test('after 모르겠어요 and its hint', { options: { model: 'haiku' } }, async ($, on) => {
    const { w, calls } = await storedGrade($, on)
    await learn($, '퀴즈 1 모르겠어요')
    w.answer = '값 1: 16\n피드백: f'
    await learn($, `퀴즈 1 ${D34_G3.hint.mine}`)
    expect(calls.at(-1)).toEqual({ model: 'haiku', effort: 'low', system: CHECK_SYSTEM, prompt: D34_G3.hint.prompt, maxTokens: 480, timeoutMs: 60_000 })
  })

  test('after a question back', { options: { model: 'haiku' } }, async ($, on) => {
    const { w, calls } = await storedGrade($, on)
    w.answer = D34_G3.first.reply
    await learn($, `퀴즈 1 ${D34_G3.first.mine}`)
    w.answer = '값 1: 16\n피드백: f'
    await learn($, `퀴즈 1 ${D34_G3.nudge.mine}`)
    expect(calls.at(-1)).toEqual({ model: 'haiku', effort: 'low', system: CHECK_SYSTEM, prompt: D34_G3.nudge.prompt, maxTokens: 480, timeoutMs: 60_000 })
  })
})
