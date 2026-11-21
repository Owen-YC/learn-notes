// 1.13.0 (G2-RUN) design: the run route through the real plugin path (harness models.sonnet), and its off bytes.
import { describe, expect, test } from 'claude-code/testing'
import { CHANGED_LEAD, changedRunFor, conceptKey } from '../hooks/notes'
import { NOW, finish, learn, ownSteps, routeCalls, start, turn, world } from './flowkit'

const DAY = 86_400_000
const HOUR = 3_600_000
const CODE = ['const scores = [72, 85, 91]', 'let total = 0', 'for (const s of scores) {', '  if (s >= 80) total += s', '}', 'const avg = Math.round(total / 2)', "console.log('합계:', total)", "console.log('평균 ' + avg)"].join('\n')
const NAME = '조건문'
const BLURB = '80점 이상만 더합니다 — `if (s >= 80) total += s`'

/** A reply for three slots: each its C (read for a changed pick alone; an N after it is never read) and its T · Q · H · A (read for any other). */
const reply3 = (n: string) => [1, 2, 3].map(k => [`C${k}: ${k}d <`, `N${k}:`, n, `T${k}: 예측`, `Q${k}: x`, `H${k}: y`, `A${k}: z`].join('\n')).join('\n')

/** A sonnet window (or another harness) with NAME met at code changed's step in a.js, ready for its quiz. */
async function ready($: any, on: any, harness: Record<string, unknown> | undefined) {
  const calls = routeCalls(on)
  // Three concepts met in a.js (a quiz of fewer keeps every pick its own code, ladderMixed): one at code changed's step.
  const steps: Record<string, number> = { [NAME]: 2, 배열: 1, 반복문: 1 }
  const concepts = Object.fromEntries(Object.entries(steps).map(([name, step], i) => [conceptKey(name), { name, count: 3, firstAt: NOW - 60 * DAY, lastAt: NOW - 60 * DAY, blurb: name === NAME ? BLURB : `${name} 설명`, files: [], step, reviewedAt: NOW - 31 * DAY - (10 - i) * HOUR }]))
  const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)]])
  const w = world(on, 'ok', null, true, store)
  if (harness) w.harness = harness
  await start($)
  w.answer = ['### 한 줄 요약', '만들었습니다', '### 배울 개념', `- **${NAME}**: ${BLURB}`, '- **배열**: 배열 설명', '- **반복문**: 반복문 설명', '### 직접 확인해 볼 것', '- 실행해 보기'].join('\n')
  await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'u1', file_path: '/proj/a.js', content: `${CODE}\n` }), 't1')
  w.files.set('/proj/a.js', `${CODE}\n`)
  await finish(w)
  return { w, store, calls }
}

type Kept = { name: string; answer: string; question: string; hint?: string; rung?: string; kind: string }
const keptItems = (store: Map<string, unknown>) => ((store.get('quiz') ?? {}) as { items?: Kept[] }).items ?? []

async function quizOnce($: any, on: any, harness: Record<string, unknown> | undefined, reply: string) {
  const { w, store, calls } = await ready($, on, harness)
  const before = calls.length
  w.answer = reply
  await learn($, '퀴즈 새로')
  return { got: calls.slice(before), items: keptItems(store).filter(one => one.name === NAME), w, store }
}

describe('1.13.0 (G2-RUN): the run route in a sonnet window', () => {
  test('on (rungChangedStep 2 and isChangedRun): the request shows the output and the certified places; the item kept holds the plugin\'s own run', { options: { model: 'sonnet', level: 'beginner' }, timeoutMs: 30000 }, async ($, on) => {
    const { got, items } = await quizOnce($, on, { models: { sonnet: { rungChangedStep: 2, isChangedRun: true } } }, reply3('합계: 72\n평균 36'))
    expect(got.length).toBe(1)
    expect(got[0]!.prompt).toContain('   지금 찍히는 글자:\n```\n합계: 176\n평균 88\n```')
    expect(got[0]!.prompt).toContain('(고른 곳 이름, 한 칸 띄우고 새 값만. 예: ')
    expect(got[0]!.maxTokens).toBe(4600)
    expect(items.length).toBe(1)
    expect(items[0]!.rung).toBe('changed')
    expect(items[0]!.kind).toBe('predict')
    expect(items[0]!.answer).toBe('합계: 72\n평균 36')
    expect(items[0]!.question.startsWith(`${CHANGED_LEAD}\n\`\`\`js\n`)).toBe(true)
    expect(items[0]!.question).toContain('  if (s < 80) total += s')
  })

  test('on, an N line in the reply is never read: the item kept holds the plugin\'s own run of the model\'s change', { options: { model: 'sonnet', level: 'beginner' }, timeoutMs: 30000 }, async ($, on) => {
    const { items } = await quizOnce($, on, { models: { sonnet: { rungChangedStep: 2, isChangedRun: true } } }, reply3('합계: 72\n평균 37'))
    expect(items.map(one => one.answer)).toEqual(['합계: 72\n평균 36'])
  })

  test('isChangedRun with code changed off: the request is the off request to the byte (no run, no file read)', { options: { model: 'sonnet', level: 'beginner' }, timeoutMs: 30000 }, async ($, on) => {
    const reply = 'T1: 예측\nQ1: x\nH1: y\nA1: z'
    const a = await quizOnce($, on, { models: { sonnet: { isChangedRun: true } } }, reply)
    expect(a.got.length).toBe(1)
    expect(a.got[0]!.prompt).not.toContain('지금 찍히는 글자')
    expect(a.got[0]!.prompt).not.toContain('바꿀 곳')
    expect(a.got[0]!.maxTokens).toBe(3400)
    ;(globalThis as any).console.log('RUNOFFREQ ' + JSON.stringify(a.got))
  })

  test('the off request, for the byte comparison with the test above', { options: { model: 'sonnet', level: 'beginner' }, timeoutMs: 30000 }, async ($, on) => {
    const reply = 'T1: 예측\nQ1: x\nH1: y\nA1: z'
    const b = await quizOnce($, on, undefined, reply)
    ;(globalThis as any).console.log('OFFREQ ' + JSON.stringify(b.got))
    expect(b.got[0]!.maxTokens).toBe(3400)
  })

  const RUN_ON = { models: { sonnet: { rungChangedStep: 2, isChangedRun: true } } }
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const stepOf = (store: Map<string, unknown>) => ((store.get('concepts') as Record<string, { step?: number }>)[conceptKey(NAME)] ?? {}).step

  test('(build) on, a value the run route cannot use: the place\'s own certified change stands in (isOwn false); the item is kept and graded like any other', { options: { model: 'sonnet', level: 'beginner' }, timeoutMs: 30000 }, async ($, on) => {
    // Every slot's C names place a, the number 72, with 99999: past that place's bound (numberBound), so no value of the
    // model's own; the place's certified change (72 → 144) is the question. Only the changed pick reads its C.
    const { items, w, store } = await quizOnce($, on, RUN_ON, reply3('x').replace(/C(\d): \d+d </g, 'C$1: $1a 99999'))
    const cert = changedRunFor(CODE, 'a.js', BLURB)!.certs[0]!
    expect([cert.site.token, cert.value]).toEqual(['72', '144'])
    expect(items.length).toBe(1)
    expect(items[0]!.answer).toBe(cert.lines.join('\n'))
    expect(items[0]!.question).toBe(`${CHANGED_LEAD}\n\`\`\`js\n${cert.changed}\n\`\`\``)
    expect(items[0]!).toMatchObject({ rung: 'changed', kind: 'predict' })
    // Graded as any question: the learner's answer and the item's own answer go to the one grading call; right, a step on.
    const n = keptItems(store).findIndex(one => one.name === NAME) + 1
    const asked = w.models.length
    w.answer = RIGHT
    await learn($, `퀴즈 ${n} ${cert.lines[0]}`)
    expect(w.models.length).toBe(asked + 1)
    expect(w.models.at(-1)).toContain(cert.lines.join('\n'))
    expect(stepOf(store)).toBe(3)
  })

  for (const failure of ['empty', 'timeout'] as const) {
    test(`(build) on, a run-route quiz whose call came back ${failure === 'empty' ? 'empty (as a refusal arrives)' : 'past its time limit'}: the next quiz asks that concept in its own code (quizRun.changedMissed, written before the quiz returns)`, { options: { model: 'sonnet', level: 'beginner' }, timeoutMs: 30000 }, async ($, on) => {
      const { w, store } = await ready($, on, RUN_ON)
      w.replies.push(failure)
      const asking = learn($, '퀴즈 새로')
      if (failure === 'timeout') {
        await w.clock.settle()
        await w.clock.advance(90_000)
      }
      expect((await asking).text ?? '').toContain('퀴즈를 내지 못했습니다')
      expect(w.models.at(-1)).toContain('   지금 찍히는 글자:')
      expect(store.get('quiz')).toBeUndefined()
      await w.clock.advance(60_000)
      w.answer = [1, 2, 3].map(k => [`T${k}: 예측`, `Q${k}: x`, `H${k}: y`, `A${k}: z`].join('\n')).join('\n')
      await learn($, '퀴즈 새로')
      expect(w.models.at(-1)).not.toContain('지금 찍히는 글자')
      expect(w.models.at(-1)).toContain('   칸: 내 코드\n   학습자가 만든 코드 (a.js):')
    })
  }
})
