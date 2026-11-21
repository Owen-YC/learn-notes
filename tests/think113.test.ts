import { describe, expect, test } from 'claude-code/testing'

import {
  TRACE_LABEL,
  canonOf,
  changeOf,
  creationHunk,
  isThinkFollow,
  namedFits,
  openThink,
  parseThinkCall,
  thinkCalcKept,
  thinkCalcPlan,
  thinkCalcReply,
  thinkCalcScope,
  thinkOf,
  thinkPick,
  thinkTextOf,
  traceCalcQuestion,
  valueThinkLine,
  valueThinkOf,
  answerKept,
  SLOT_UNREAD,
  type ThinkFacts,
} from '../hooks/notes'
// calc's own names come from its module (1.13.0 module layout).
import { calcCall, calcEqual, calcExpr, calcLiteral, calcModule, isSafeRegex } from '../hooks/calc'
import { CALC113 } from './fixtures/calc113'

const made = (file: string, content: string) => changeOf({ path: `/p/${file}`, root: '/p', tool: 'Write', kind: 'create', hunks: [creationHunk(content)] })
const edit = (file: string, newStart: number, lines: string[]) =>
  changeOf({
    path: `/p/${file}`,
    root: '/p',
    tool: 'Edit',
    kind: 'update',
    hunks: [{ oldStart: newStart, oldLines: lines.filter(l => !l.startsWith('+')).length, newStart, newLines: lines.filter(l => !l.startsWith('-')).length, lines }],
  })
const names = (changes: Parameters<typeof thinkCalcScope>[0]) => thinkCalcScope(changes).callees.map(one => `${one.name}${one.anchor ? `@${one.anchor}` : ''}`)

describe('1.13.0 G5e calc: every frozen expression calc does not refuse is what node and python3 showed', () => {
  for (const lang of ['js', 'py'] as const) {
    test(`${lang}: ${CALC113[lang].length} expressions, 0 disagree, most answered`, () => {
      const mod = calcModule([[]], lang)
      let answered = 0
      const bad: string[] = []
      for (const { expr, truth } of CALC113[lang]) {
        const r = calcExpr(mod, expr)
        if (r.kind === 'unknown') continue
        answered++
        const got = r.kind === 'error' ? `ERROR ${r.name}` : `RETURN ${r.show.replace(/\n/g, '\\n')}`
        if (got !== truth) bad.push(`${expr}: ${got} vs ${truth}`)
      }
      expect(bad).toEqual([])
      expect(answered).toBeGreaterThan(CALC113[lang].length * 0.8)
    })
  }
  test('python rounding and fixed formats are half-even on the exact double; js rounding is the engine\'s own', () => {
    const py = calcModule([[]], 'py')
    const js = calcModule([[]], 'js')
    const show = (mod: typeof py, e: string) => {
      const r = calcExpr(mod, e)
      return r.kind === 'value' ? r.show : r.kind
    }
    expect(['round(2.5)', 'round(3.5)', 'round(2.675, 2)', 'round(0.125, 2)', "f'{2.675:.2f}'", "f'{1234567.891:,.2f}'"].map(e => show(py, e))).toEqual(['2', '4', '2.67', '0.12', "'2.67'", "'1,234,567.89'"])
    expect(['Math.round(2.5)', 'Math.round(-2.5)', '(2.675).toFixed(2)', '(1.005).toFixed(2)'].map(e => show(js, e))).toEqual(['3', '-2', '"2.67"', '"1.00"'])
  })
  test('unknown, never a claim: NaN, infinity, a set\'s order, py re, printing, random, astral text, past the step budget', () => {
    const py = calcModule([['import random', 'def loop(n):', '    while True:', '        n += 1', '    return n']], 'py')
    const js = calcModule([['function f(x) { console.log(x); return x }']], 'js')
    for (const e of ['0 / 0', '1 / 0', '"a" * 2']) expect(calcExpr(calcModule([[]], 'js'), e).kind === 'unknown' || e === '"a" * 2').toBe(true)
    expect(calcExpr(py, 'list({3, 1, 2})').kind).toBe('unknown')
    expect(calcExpr(py, 'sorted({3, 1, 2})').kind).toBe('value')
    expect(calcExpr(py, 'print(1)').kind).toBe('unknown')
    expect(calcExpr(py, 'random.random()').kind).toBe('unknown')
    expect(calcExpr(py, "'😀'").kind).toBe('unknown')
    expect(calcCall(py, 'loop(1)').kind).toBe('unknown')
    expect(calcCall(js, 'f(1)').kind).toBe('unknown')
  })
  test('errors by their exact names: python\'s and the engine\'s', () => {
    const py = calcModule([['def first(xs):', '    return xs[0]', 'def per(a, b):', '    return a // b', "def val(t):", "    return int(t)", 'def look(d, k):', '    return d[k]']], 'py')
    const js = calcModule([['function len(x) { return x.length }', 'function bad(n) { if (n < 0) throw new RangeError("음수"); return n }']], 'js')
    const err = (r: ReturnType<typeof calcCall>) => (r.kind === 'error' ? r.name : r.kind)
    expect([err(calcCall(py, 'first([])')), err(calcCall(py, 'per(1, 0)')), err(calcCall(py, "val('3.5')")), err(calcCall(py, "look({'a': 1}, 'b')"))]).toEqual(['IndexError', 'ZeroDivisionError', 'ValueError', 'KeyError'])
    expect([err(calcCall(js, 'len(null)')), err(calcCall(js, 'bad(-1)'))]).toEqual(['TypeError', 'RangeError'])
  })
  test('equality as the stance reads it: 7 is not "7", a py int is not a py float, a tuple is not a list, None is null, dicts and objects as maps', () => {
    const lit = (t: string, lang: 'js' | 'py') => calcLiteral(t, lang)!.value
    expect(calcEqual(lit('7', 'py'), lit('7.0', 'py'))).toBe(false)
    expect(calcEqual(lit('97.5', 'py'), lit('97.50', 'py'))).toBe(true)
    expect(calcEqual(lit('7', 'js'), lit('7.0', 'js'))).toBe(true)
    expect(calcEqual(lit('7', 'py'), lit("'7'", 'py'))).toBe(false)
    expect(calcEqual(lit('(1, 2)', 'py'), lit('[1, 2]', 'py'))).toBe(false)
    expect(calcEqual(lit('None', 'py'), lit('null', 'js'))).toBe(true)
    expect(calcEqual(lit('undefined', 'js'), lit('null', 'js'))).toBe(false)
    expect(calcEqual(lit("{'b': 2, 'a': 1}", 'py'), lit("{'a': 1, 'b': 2}", 'py'))).toBe(true)
    expect(calcEqual(lit('{b: 2, a: 1}', 'js'), lit('{a: 1, b: 2}', 'js'))).toBe(true)
  })
})

describe('1.13.0 G5e scope: wider in code, calc the second gate', () => {
  test('rounding, a py tuple target, js destructuring, a py call with a named argument and a module literal are in', () => {
    expect(names([made('a.py', 'def song_seconds(text):\n    mins, secs = text.split(":")\n    return int(mins) * 60 + int(secs)\n')])).toEqual(['song_seconds'])
    expect(names([made('b.py', 'def beans(cups, extra_shots=0):\n    return round((cups * 18 + extra_shots * 9) / 7, 1)\n\nprint(beans(4, extra_shots=2))\n')])).toEqual(['beans@beans(4, extra_shots=2)'])
    expect(names([made('c.js', 'function unit(won, grams) {\n  return Math.round((won / grams) * 100)\n}\n')])).toEqual(['unit'])
    expect(names([made('d.js', 'function pair(p) {\n  let a, b\n  ;[a, b] = p\n  return a + b\n}\n')])).toEqual(['pair'])
    expect(names([made('e.py', 'PRICES = {\n    "a": 1000,\n    "b": 2500,\n}\n\ndef cost(k, n):\n    return PRICES[k] * n\n')])).toEqual(['cost'])
  })
  test('out: a module list mutated anywhere shown, a name from another file, a partly shown body, printing, a class', () => {
    expect(names([made('f.js', 'const items = []\nfunction add(x) {\n  items.push(x)\n  return items.length\n}\n')])).toEqual([])
    expect(names([made('g.py', 'from helpers import half\n\ndef twice(n):\n    return half(n) * 4\n')])).toEqual([])
    expect(names([edit('h.js', 1, [' function f(a) {', '-  return a', '+  return a + 1'])])).toEqual([])
    expect(names([made('i.py', 'def show(n):\n    print(n)\n    return n\n')])).toEqual([])
    expect(names([made('j.ts', 'class Bank {\n  total(n: number) {\n    return n\n  }\n}\n')])).toEqual([])
  })
  test('named arguments fit by the parameters, and two spellings of one call compare alike', () => {
    const callee = { name: 'beans', file: 'b.py', isPy: true, params: ['cups', 'extra_shots'], min: 1, max: 2 }
    const a = parseThinkCall('beans(4, 2)', true)!
    const b = parseThinkCall('beans(4, extra_shots=2)', true)!
    const c = parseThinkCall('beans(extra_shots=2, cups=4)', true)!
    expect([namedFits(a, callee), namedFits(b, callee), namedFits(c, callee)]).toEqual([true, true, true])
    expect(namedFits(parseThinkCall('beans(4, sugar=2)', true)!, callee)).toBe(false)
    expect(namedFits(parseThinkCall('beans(4, cups=2)', true)!, callee)).toBe(false)
    expect(namedFits(parseThinkCall('beans(extra_shots=2)', true)!, callee)).toBe(false)
    expect(new Set([canonOf(a, callee), canonOf(b, callee), canonOf(c, callee)]).size).toBe(1)
  })
})

describe('1.13.0 G5e: r\'s request, code\'s pick and code\'s line', () => {
  const change = made('song.py', 'def song_seconds(text):\n    mins, secs = text.split(":")\n    if int(secs) >= 60:\n        return -1\n    return int(mins) * 60 + int(secs)\n\nprint(song_seconds("3:25"))\n')
  const scope = thinkCalcScope([change])
  const walk = ['1. `song_seconds("3:25")`에서 `mins`는 `"3"`, `secs`는 `"25"`입니다.', '2. 결과는 `3 * 60 + 25`입니다.', '', '결과: `205`', '', '바뀌기 전에는 …']
  test('the anchor is walked; the request asks for a 결과 line and no 생각해 보기; py names its named arguments', () => {
    expect(scope.callees.map(one => one.anchor)).toEqual(['song_seconds("3:25")'])
    const q = traceCalcQuestion(scope.callees)
    expect(q).toContain('`song_seconds("3:25")` 그대로')
    expect(q).toContain('결과:')
    expect(q).toContain('생각해 보기 물음은 쓰지 않습니다.')
    expect(q).toContain('이름 붙은 인자')
  })
  test('code picks a call, deterministic, never one shown, never one whose result the walk-through or the note shows', () => {
    const kept = thinkCalcKept(walk.join('\n'), scope, '', [change.diff])
    expect(thinkCalcKept(walk.join('\n'), scope, '', [change.diff])).toBe(kept)
    const call = valueThinkOf(kept)!
    expect(call).toMatch(/^song_seconds\(/)
    expect(call).not.toBe('song_seconds("3:25")')
    const r = calcCall(scope.mods.get(change.file)!, call)
    expect(r.kind === 'value' ? r.show : r.kind).not.toBe('205')
    // The same pick refused once its result is written in the note.
    const shown = r.kind === 'value' ? r.show : ''
    const again = valueThinkOf(thinkCalcKept(walk.join('\n'), scope, `- 예: \`${shown}\``, [change.diff]))
    expect(again).not.toBe(call)
  })
  test('a walk whose 결과 line calc contradicts gets code\'s one sentence; one with no walked call gets no line', () => {
    const wrong = walk.map(line => (line.startsWith('결과:') ? '결과: `215`' : line)).join('\n')
    expect(thinkCalcKept(wrong, scope, '', [change.diff])).toContain('플러그인이 직접 계산해 보니 `song_seconds("3:25")`의 결과는 `205`입니다.')
    const none = thinkCalcScope([made('x.py', 'def song_seconds(text):\n    mins, secs = text.split(":")\n    return int(mins) * 60 + int(secs)\n')])
    expect(valueThinkOf(thinkCalcKept('1. 따라가 봅니다.\n\n결과: `0`', none, '', []))).toBeUndefined()
  })
  test('code\'s line opens only while on, ends on no question mark, and no 1.8–1.12 reading of thinkOf opens it', () => {
    const line = valueThinkLine('song_seconds("4:25")')
    expect(line).toBe('**생각해 보기:** `song_seconds("4:25")`를 실행한 결과를 값 하나로 적어 보세요 (오류면 `오류`)')
    const asks = [{ question: TRACE_LABEL, answer: `1. a\n\n${line}`, at: 1000 }]
    expect(openThink(asks, 2000, true, true)).toEqual({ question: '`song_seconds("4:25")`를 실행한 결과를 값 하나로 적어 보세요 (오류면 `오류`)', trace: `1. a\n\n${line}`, call: 'song_seconds("4:25")' })
    expect(openThink(asks, 2000)).toBeUndefined()
    expect(thinkOf(`1. a\n\n${line}`, false)).toBeUndefined()
    expect(thinkOf(`1. a\n\n${line}`, true)).toBeUndefined()
    expect(isThinkFollow([...asks, { question: '265', answer: 'x', at: 3000 }], 1, true, true)).toBe(true)
    expect(isThinkFollow([...asks, { question: '265', answer: 'x', at: 3000 }], 1)).toBe(false)
    expect(openThink([{ question: TRACE_LABEL, answer: '1. a\n\n**생각해 보기:** `xs`를 `[5]`로 바꾸면 최종 결과는 무엇이 될까요?', at: 1000 }], 2000, true, true)).toBeUndefined()
  })
  test('thinkPick: never the walked call or a spelling of it; nothing when every candidate shows its result', () => {
    const mod = scope.mods.get(change.file)!
    const callee = scope.callees[0]!
    const walked = { call: parseThinkCall('song_seconds("3:25")', true)!, callee }
    const run = calcCall(mod, 'song_seconds("3:25")')
    const pick = thinkPick(walked, run, mod, walk.join('\n'), '', [change.diff])!
    expect(pick).not.toBe('song_seconds("3:25")')
    expect(thinkPick(walked, run, mod, walk.join('\n'), '', [change.diff])).toBe(pick)
  })
})

describe('1.13.0 G5e: a typed text read by code first, else one check, and the reply code builds', () => {
  const change = made('song.py', 'def song_seconds(text):\n    mins, secs = text.split(":")\n    if int(secs) >= 60:\n        return -1\n    return int(mins) * 60 + int(secs)\n\nprint(song_seconds("3:25"))\n')
  const line = valueThinkLine('song_seconds("4:25")')
  const trace = `1. \`song_seconds("3:25")\`에서 \`mins\`는 \`"3"\`입니다.\n\n결과: \`205\`\n\n${line}`
  const note = { prompt: '', text: '노트', status: 'ready' as const, changes: [change], moreFiles: 0 }
  const think = { question: line.replace(/^\*\*생각해 보기:\*\* /, ''), trace, call: 'song_seconds("4:25")' }
  const plan = (mine: string) => thinkCalcPlan(note, think, mine, 'beginner', 'trace')
  test('membership: a blank, an error, a value in its forms; no question is a member', () => {
    const names = new Set(['mins', 'secs', 'text'])
    expect(thinkTextOf('모르겠어요', 'py', names)).toEqual({ kind: 'blank' })
    expect(thinkTextOf('에러 날 것 같아요', 'py', names)).toEqual({ kind: 'error', name: undefined })
    expect(thinkTextOf('ValueError요', 'py', names)).toEqual({ kind: 'error', name: 'ValueError' })
    expect(thinkTextOf('265초요', 'py', names)).toEqual({ kind: 'value', value: 265n, said: '265초', isPlain: false })
    expect(thinkTextOf('14,000원이요', 'py', names)).toEqual({ kind: 'value', value: 14000n, said: '14,000원', isPlain: false })
    expect(thinkTextOf("'4:25'", 'py', names)).toEqual({ kind: 'value', value: '4:25', said: "'4:25'", isPlain: true })
    for (const q of ['왜 int를 써요?', '"5:00" 넣으면 어떻게 돼요?', 'mins', '265 나오는 이유가 뭐예요?', '에러 안 나요?', '헷갈려요']) expect(thinkTextOf(q, 'py', names)).toBeUndefined()
  })
  test('code path: a blank, a value and an error guessed are answered with no call, the head the plugin\'s', () => {
    expect(plan('265초요')).toEqual({ kind: 'code', text: expect.stringMatching(/^\*\*맞혔습니다\.\*\* /) })
    const wrong = plan('245')
    expect(wrong.kind === 'code' && wrong.text).toMatch(/^\*\*아쉽지만 틀렸습니다\.\*\* [\s\S]*\n\n바른 결과: `265`$/)
    const blank = plan('모르겠어요')
    expect(blank.kind === 'code' && blank.text).toMatch(/^바른 결과: `265`\n\n/)
    const err = plan('오류가 날 것 같아요')
    expect(err.kind === 'code' && err.text).toMatch(/^\*\*아쉽지만 틀렸습니다\.\*\*/)
  })
  test('a call calc cannot run against the note as it now is falls back to 1.9.0\'s question', () => {
    expect(thinkCalcPlan({ ...note, changes: [made('song.py', 'print(1)\n')] }, think, '왜요?', 'beginner', 'trace')).toEqual({ kind: 'fallback' })
    expect(thinkCalcPlan(note, { ...think, call: undefined }, '왜요?', 'beginner', 'trace')).toEqual({ kind: 'fallback' })
  })
  test('the check: facts in the prompt; a guessed value read by code; another input computed; a concept answer kept from what calc confirms', () => {
    const p = plan('265쯤 되지 않을까 싶어요')
    expect(p.kind).toBe('check')
    if (p.kind !== 'check') return
    expect(p.prompt).toContain('- `song_seconds("4:25")`의 결과: `265`')
    expect(p.prompt).toContain('- 따라간 호출 `song_seconds("3:25")`의 결과: `205`')
    const facts: ThinkFacts = p.facts
    const reply = (text: string, mine: string) => thinkCalcReply(text, facts, mine, `${trace}\n${change.diff}`)
    expect(reply('종류: 짐작\n짐작값: 265\n다른 호출: 없음\n식: 없음\n식: 없음\n답: 없음\n판정: 없음', '265쯤 되지 않을까 싶어요')).toMatch(/^\*\*맞혔습니다\.\*\*/)
    expect(reply('종류: 짐작\n짐작값: 기타\n다른 호출: 없음\n식: 없음\n식: 없음\n답: 없음\n판정: 틀림', '265쯤?')).toMatch(/^\*\*아쉽지만 틀렸습니다\.\*\*[\s\S]*바른 결과: `265`$/)
    expect(reply('종류: 질문\n짐작값: 없음\n다른 호출: `song_seconds("5:00")`\n식: 없음\n식: 없음\n답: 없음\n판정: 없음', '"5:00" 넣으면 어떻게 돼요?')).toMatch(/^`song_seconds\("5:00"\)`를 실행하면 결과는 `300`입니다\./)
    expect(reply('종류: 질문\n짐작값: 300\n다른 호출: `song_seconds("5:00")`\n식: 없음\n식: 없음\n답: 없음\n판정: 없음', '"5:00" 넣으면 300 나와요?')).toMatch(/^\*\*네\.\*\* `song_seconds\("5:00"\)`/)
    // Without an input of its own, a 다른 호출 is not taken: the text goes back to the line's call.
    expect(reply('종류: 짐작\n짐작값: 300\n다른 호출: `song_seconds("5:00")`\n식: 없음\n식: 없음\n답: 없음\n판정: 없음', '300일까요')).toMatch(/^\*\*아쉽지만 틀렸습니다\.\*\*/)
    expect(reply('종류: 질문\n짐작값: 없음\n다른 호출: 없음\n식: `int("4") + int("25")`\n식: 없음\n답: `int`는 글자를 정수로 바꿉니다. 그래서 더하기가 숫자 더하기가 됩니다.\n판정: 없음', 'int는 왜 써요?')).toBe('`int`는 글자를 정수로 바꿉니다. 그래서 더하기가 숫자 더하기가 됩니다.\n- `int("4") + int("25")`의 값: `29`')
    expect(reply('아무 말', 'x')).toBe(SLOT_UNREAD)
  })
  test('answerKept drops a value seen nowhere, an expression calc contradicts, a failure claim calc ran cleanly; never the line\'s own call', () => {
    const p = plan('왜 그래요?')
    if (p.kind !== 'check') throw new Error('check')
    const seen = `${trace}\n${change.diff}`
    expect(answerKept('결과는 999가 됩니다. 나누기는 없습니다.', [], p.facts, seen)).toBe('나누기는 없습니다.')
    expect(answerKept('`int("25")`는 `24`입니다. 정수로 바뀝니다.', [], p.facts, seen)).toBe('정수로 바뀝니다.')
    expect(answerKept('`int("25")`는 오류가 납니다. 정수로 바뀝니다.', [], p.facts, seen)).toBe('정수로 바뀝니다.')
    expect(answerKept('정수로 바뀝니다.', ['song_seconds("4:25")'], p.facts, seen)).toBe('정수로 바뀝니다.')
    expect(answerKept('정수로 바뀝니까?', [], p.facts, seen)).not.toContain('?')
  })
})

describe('1.13.0 G5e (pilot refinement 1): the pick and the reading, each by a general rule', () => {
  const song = made('song.py', 'def song_seconds(text):\n    mins, secs = text.split(":")\n    if int(secs) >= 60:\n        return -1\n    return int(mins) * 60 + int(secs)\n\nprint(song_seconds("3:25"))\n')
  const line = valueThinkLine('song_seconds("4:25")')
  const trace = `1. \`song_seconds("3:25")\`에서 \`mins\`는 \`"3"\`입니다.\n\n결과: \`205\`\n\n${line}`
  const note = { prompt: '', text: '노트', status: 'ready' as const, changes: [song], moreFiles: 0 }
  const think = { question: line.replace(/^\*\*생각해 보기:\*\* /, ''), trace, call: 'song_seconds("4:25")' }
  const factsOf = (mine: string) => {
    const p = thinkCalcPlan(note, think, mine, 'beginner', 'trace')
    if (p.kind !== 'check') throw new Error(`not a check: ${mine}`)
    return p.facts
  }
  const reply = (raw: string, mine: string) => thinkCalcReply(raw, factsOf(mine), mine, `${trace}\n${song.diff}`)
  const slots = (kind: string, guess: string, answer = '없음', verdict = '없음') => `종류: ${kind}\n짐작값: ${guess}\n다른 호출: 없음\n식: 없음\n식: 없음\n답: ${answer}\n판정: ${verdict}`
  test('멈춤 is an error guessed (stance [같음]), read by code with no call', () => {
    expect(thinkTextOf('멈추나요?', 'py', new Set())).toEqual({ kind: 'error', name: undefined })
    expect(thinkCalcPlan(note, think, '멈출 것 같아요', 'beginner', 'trace').kind).toBe('code')
  })
  test('the learner\'s own literal wins over the model\'s copy; a slot sentence gives its last literal; an empty slot the learner\'s one literal', () => {
    expect(reply(slots('짐작', '265'), '글자니까 "265"가 나올 것 같아요')).toMatch(/^\*\*아쉽지만 틀렸습니다\.\*\*/)
    expect(reply(slots('짐작', "265를 코드의 값으로 옮기면 '265'입니다."), '아마 "265"쯤')).toMatch(/^\*\*아쉽지만 틀렸습니다\.\*\*/)
    // Whichever side has the quotes: the learner's unquoted number stands over the model's quoted copy.
    expect(reply(slots('짐작', "265를 코드의 값으로 옮기면 '265'입니다."), '아마 265쯤')).toMatch(/^\*\*맞혔습니다\.\*\*/)
    expect(reply(slots('짐작', '없음'), '아마 265쯤 될 듯')).toMatch(/^\*\*맞혔습니다\.\*\*/)
  })
  test('code\'s verdict over the model\'s: a value guessed is told right or wrong by calcEqual whatever 판정 says', () => {
    expect(reply(slots('짐작', '999', '없음', '맞음'), '아마 999 정도')).toMatch(/^\*\*아쉽지만 틀렸습니다\.\*\*[\s\S]*바른 결과: `265`$/)
    expect(reply(slots('짐작', '265', '없음', '틀림'), '아마 265 정도')).toMatch(/^\*\*맞혔습니다\.\*\*/)
  })
  test('a question-shaped text never gets a verdict unless it says the value guessed; it is answered', () => {
    expect(reply(slots('짐작', '265', '초로 바꾼 값을 돌려줍니다.'), '같은 걸 두 번 넣으면 합쳐지나요?')).toBe('초로 바꾼 값을 돌려줍니다.')
    expect(reply(slots('짐작', '265'), '265 정도 나오지 않나요?')).toMatch(/^\*\*맞혔습니다\.\*\*/)
  })
  test('answerKept: a contradiction only where the sentence says the expression is the value; no sentence about the plugin or a 식 line', () => {
    const f = factsOf('왜요?')
    const seen = `${trace}\n${song.diff}`
    expect(answerKept('`text`에 `"4:25"`처럼 글자를 넣습니다.', [], f, seen)).toBe('`text`에 `"4:25"`처럼 글자를 넣습니다.')
    expect(answerKept('`int("25")`는 `24`입니다.', [], f, seen)).not.toContain('24')
    expect(answerKept('정수로 바꿉니다. 값은 식 줄에서 플러그인이 알려 줍니다.', [], f, seen)).toBe('정수로 바꿉니다.')
  })
  test('the pick: a value before any error; no long float; a walked call naming a module literal read with it; an example input is no result', () => {
    const js = made('fuel.js', 'function fuelCost(trip) {\n  const { distance, kmPerLiter } = trip\n  if (kmPerLiter <= 0) throw new Error("연비")\n  return distance / kmPerLiter\n}\n\nconst myTrip = { distance: 240, kmPerLiter: 12 }\nconsole.log(fuelCost(myTrip))\n')
    const scope = thinkCalcScope([js])
    const kept = thinkCalcKept('예시 호출: `fuelCost(myTrip)`\n\n1. 240을 12로 나눕니다.\n\n결과: `20`', scope, '- 예: `fuelCost({ distance: 240, kmPerLiter: 12 })` → 20', [js.diff])
    const call = valueThinkOf(kept)!
    expect(call).toMatch(/^fuelCost\(\{/)
    const r = calcCall(scope.mods.get(js.file)!, call)
    expect(r.kind).toBe('value')
    expect(r.kind === 'value' && /\d\.\d{4,}/.test(r.show)).toBe(false)
  })
})

describe('1.13.0 G5e (pilot refinement 2): counts and ranges in a concept answer are no claimed values', () => {
  test('a sentence with 0~3 and small counts is kept; a big value seen nowhere still drops it', () => {
    const song = made('song.py', 'def song_seconds(text):\n    mins, secs = text.split(":")\n    return int(mins) * 60 + int(secs)\n\nprint(song_seconds("3:25"))\n')
    const line = valueThinkLine('song_seconds("4:25")')
    const trace = `1. \`song_seconds("3:25")\`\n\n결과: \`205\`\n\n${line}`
    const p = thinkCalcPlan({ prompt: '', text: '노트', status: 'ready', changes: [song], moreFiles: 0 }, { question: line.replace(/^\*\*생각해 보기:\*\* /, ''), trace, call: 'song_seconds("4:25")' }, '왜요?', 'beginner', 'trace')
    if (p.kind !== 'check') throw new Error('check')
    const seen = `${trace}\n${song.diff}`
    expect(answerKept('0~3초는 그대로이고 4번째 조각부터 셉니다.', [], p.facts, seen)).toBe('0~3초는 그대로이고 4번째 조각부터 셉니다.')
    expect(answerKept('그러면 결과는 9999가 됩니다.', [], p.facts, seen)).not.toContain('9999')
  })
})

describe('1.13.0 G5e (final, after the critique): units, one-word questions, host regex and size, a dropped answer, the other call, the pick', () => {
  const planOf = (file: string, content: string, walked: string, walkedShown: string, asked: string) => {
    const change = made(file, content)
    const line = valueThinkLine(asked)
    const trace = `1. \`${walked}\`를 따라갑니다.\n\n결과: \`${walkedShown}\`\n\n${line}`
    const note = { prompt: '', text: '노트', status: 'ready' as const, changes: [change], moreFiles: 0 }
    const think = { question: line.replace(/^\*\*생각해 보기:\*\* /, ''), trace, call: asked }
    return { change, trace, plan: (mine: string) => thinkCalcPlan(note, think, mine, 'beginner', 'trace') }
  }
  const head = (p: ReturnType<typeof thinkCalcPlan>) => (p.kind === 'code' ? /^\*\*([^*]+)\*\*/.exec(p.text)?.[1] : p.kind)
  test('a string result is matched against the learner\'s own words with their unit; a plain number is no string; a py int is no py float', () => {
    const label = planOf('a.py', 'def label(n):\n    return f"{n}개"\n\nprint(label(3))\n', 'label(3)', "'3개'", 'label(5)').plan
    expect(head(label('5개'))).toBe('맞혔습니다.')
    expect(head(label('5 개요'))).toBe('맞혔습니다.')
    expect(head(label("'5개'"))).toBe('맞혔습니다.')
    expect(head(label('5'))).toBe('아쉽지만 틀렸습니다.')
    expect(head(label('6개'))).toBe('아쉽지만 틀렸습니다.')
    const pct = planOf('b.py', 'def pct(a, b):\n    return f"{round(a / b * 100)}%"\n\nprint(pct(1, 2))\n', 'pct(1, 2)', "'50%'", 'pct(1, 4)').plan
    expect(head(pct('25%'))).toBe('맞혔습니다.')
    expect(head(pct('25'))).toBe('아쉽지만 틀렸습니다.')
    const total = planOf('c.py', 'def total(n):\n    return n * 300\n\nprint(total(2))\n', 'total(2)', '600', 'total(5)').plan
    expect(head(total('1,500원이요'))).toBe('맞혔습니다.')
    expect(head(total('1500.0'))).toBe('아쉽지만 틀렸습니다.')
    const half = planOf('d.py', 'def half(n):\n    return n / 2\n\nprint(half(6))\n', 'half(6)', '3.0', 'half(8)').plan
    expect(head(half('4'))).toBe('아쉽지만 틀렸습니다.')
    expect(head(half('4.0이요'))).toBe('맞혔습니다.')
  })
  test('a one-word question goes to the check; a bare word is a guess only for a string result and when no code uses it', () => {
    const grade = planOf('g.js', 'function grade(s) {\n  return s >= 90 ? "A" : "B"\n}\nconsole.log(grade(95))\n', 'grade(95)', '"A"', 'grade(80)').plan
    expect(head(grade('B'))).toBe('맞혔습니다.')
    expect(head(grade('A요'))).toBe('아쉽지만 틀렸습니다.')
    for (const q of ['B?', 'grade?', 's?', 'split?', 'lambda?']) expect(grade(q).kind).toBe('check')
    const total = planOf('c.py', 'def total(n):\n    return n * 300\n\nprint(total(2))\n', 'total(2)', '600', 'total(5)').plan
    expect(total('abc').kind).toBe('check')
    expect(thinkTextOf('split?', 'py', new Set())).toBeUndefined()
    expect(thinkTextOf('None?', 'py', new Set())).toMatchObject({ kind: 'value', value: null })
  })
  test('host regex: only a safe shape over a short subject; a catastrophic one is unknown at once', () => {
    for (const r of ['\\s+', '^\\d{3}-\\d{4}$', '(ab)+', '(\\d{1,3})(?=(\\d{3})+$)', '[aeiou]']) expect(isSafeRegex(r)).toBe(true)
    for (const r of ['^(a+)+$', '^(\\w+\\s?)*$', '(a|ab)*', '^(\\d{1,3})+$', '(\\d)\\1']) expect(isSafeRegex(r)).toBe(false)
    const js = calcModule([['function ok(s) {', '  return /^(a+)+$/.test(s)', '}', 'function words(s) {', '  return s.split(/\\s+/).length', '}']], 'js')
    const t = Date.now()
    expect(calcCall(js, `ok("${'a'.repeat(40)}b")`).kind).toBe('unknown')
    expect(Date.now() - t).toBeLessThan(500)
    expect(calcCall(js, 'words("a b  c")')).toMatchObject({ kind: 'value', show: '3' })
    expect(calcCall(js, `words("${'a '.repeat(600)}")`).kind).toBe('unknown')
  })
  test('size: a value too large to render is unknown, and a trace name is never rendered whole', () => {
    const py = calcModule([['def big(n):', '    s = "ab" * n', '    t = [s for _ in range(n)]', '    return len(t)', 'def whole(n):', '    s = "ab" * n', '    return [s for _ in range(n)]']], 'py')
    const t = Date.now()
    expect(calcCall(py, 'big(4999)')).toMatchObject({ kind: 'value', show: '4999' })
    expect(calcCall(py, 'whole(4999)')).toMatchObject({ kind: 'unknown' })
    expect(Date.now() - t).toBeLessThan(3000)
  })
  test('answerKept: nothing left is SLOT_UNREAD (never the line\'s reason); no claimed result calc and the code do not hold; never the line\'s own result', () => {
    const { change, trace, plan } = planOf('song.py', 'def song_seconds(text):\n    mins, secs = text.split(":")\n    if int(secs) >= 60:\n        return -1\n    return int(mins) * 60 + int(secs)\n\nprint(song_seconds("3:25"))\n', 'song_seconds("3:25")', '205', 'song_seconds("4:25")')
    const p = plan('int()는 왜 써요?')
    if (p.kind !== 'check') throw new Error('check')
    const seen = `${trace}\n${change.diff}`
    expect(answerKept('결과는 9999입니다.', [], p.facts, seen)).toBe(SLOT_UNREAD)
    expect(answerKept('이 호출의 결과는 7이 됩니다.', [], p.facts, seen)).toBe(SLOT_UNREAD)
    expect(answerKept('결과는 265가 됩니다.', [], p.facts, seen)).toBe(SLOT_UNREAD)
    expect(answerKept('`secs`가 60 이상이면 -1을 돌려줍니다.', [], p.facts, seen)).toBe('`secs`가 60 이상이면 -1을 돌려줍니다.')
    expect(answerKept('분을 초로 바꾸려고 60을 곱합니다. 그래서 0~3초는 그대로 2가 됩니다.', [], p.facts, seen)).toBe('분을 초로 바꾸려고 60을 곱합니다. 그래서 0~3초는 그대로 2가 됩니다.')
    expect(answerKept('글자를 정수로 바꿉니다.', ['int(mins) * 60 + int(secs)', 'int("4") * 60'], p.facts, seen)).toBe('글자를 정수로 바꿉니다.\n- `int("4") * 60`의 값: `240`')
  })
  test('the other call: the learner\'s own literal call first; the model\'s only when every changed argument is the learner\'s; never the line\'s own call', () => {
    const { change, trace, plan } = planOf('song.py', 'def song_seconds(text):\n    mins, secs = text.split(":")\n    if int(secs) >= 60:\n        return -1\n    return int(mins) * 60 + int(secs)\n\nprint(song_seconds("3:25"))\n', 'song_seconds("3:25")', '205', 'song_seconds("4:25")')
    const seen = `${trace}\n${change.diff}`
    const slots = (other: string, answer = '없음') => `종류: 질문\n짐작값: 없음\n다른 호출: ${other}\n식: 없음\n식: 없음\n답: ${answer}\n판정: 없음`
    const run = (mine: string, raw: string) => {
      const p = plan(mine)
      if (p.kind !== 'check') throw new Error('check')
      return thinkCalcReply(raw, p.facts, mine, seen)
    }
    expect(run('song_seconds("4:99")를 넣으면 어떻게 돼요?', slots('없음'))).toMatch(/^`song_seconds\("4:99"\)`를 실행하면 결과는 `-1`입니다\./)
    expect(run('"5:00"을 넣으면 어떻게 돼요?', slots('song_seconds("5:00")'))).toMatch(/^`song_seconds\("5:00"\)`를 실행하면 결과는 `300`입니다\./)
    expect(run('"5:00"을 넣으면 어떻게 돼요?', slots('song_seconds("6:00")'))).not.toMatch(/실행하면/)
    expect(run('다른 걸 넣으면 어떻게 돼요?', slots('song_seconds("4:25")'))).not.toMatch(/실행하면/)
  })
  test('the other call keeps the line\'s arguments the learner did not name, moves a value put on the wrong named argument, and keeps out one the learner left out', () => {
    const { change, trace, plan } = planOf('h.js', 'function heightAfterDays(startCm, cmPerDay, days) {\n  return Math.round(startCm + cmPerDay * days)\n}\nconsole.log(heightAfterDays(12, 0.7, 9))\n', 'heightAfterDays(12, 0.7, 9)', '18', 'heightAfterDays(13, 0.7, 9)')
    const seen = `${trace}\n${change.diff}`
    const slots = (other: string) => `종류: 질문\n짐작값: 없음\n다른 호출: ${other}\n식: 없음\n식: 없음\n답: 없음\n판정: 없음`
    const run = (mine: string, raw: string) => {
      const p = plan(mine)
      if (p.kind !== 'check') throw new Error('check')
      return thinkCalcReply(raw, p.facts, mine, seen)
    }
    expect(run('days에 0을 넣으면 어떻게 돼요?', slots('heightAfterDays(12, 0.7, 0)'))).toMatch(/^`heightAfterDays\(13, 0\.7, 0\)`를 실행하면 결과는 `13`입니다\./)
    expect(run('days에 0을 넣으면 어떻게 돼요?', slots('heightAfterDays(0, 0.7, 9)'))).toMatch(/^`heightAfterDays\(13, 0\.7, 0\)`를 실행하면 결과는 `13`입니다\./)
    const water = planOf('w.py', 'def water_ml(cups, ml_per_cup=180, brown=False):\n    ml = cups * ml_per_cup\n    if brown:\n        ml = ml * 1.2\n    return round(ml)\n\nprint(water_ml(2, ml_per_cup=200))\n', 'water_ml(2, ml_per_cup=200)', '400', 'water_ml(3, ml_per_cup=200)')
    const p = water.plan('ml_per_cup를 안 쓰고 brown=True만 주면 어떻게 돼요?')
    if (p.kind !== 'check') throw new Error('check')
    expect(thinkCalcReply(slots('water_ml(2, brown=True)'), p.facts, 'ml_per_cup를 안 쓰고 brown=True만 주면 어떻게 돼요?', `${water.trace}\n${water.change.diff}`)).toMatch(/^`water_ml\(3, brown=True\)`를 실행하면 결과는 `648`입니다\./)
    const q = water.plan('brown은 왜 써요?')
    if (q.kind !== 'check') throw new Error('check')
    expect(answerKept('현미면 물을 더 넣습니다.', ['water_ml(2, brown=True)', '180 * 1.2'], q.facts, water.trace)).toBe('현미면 물을 더 넣습니다.\n- `180 * 1.2`의 값: `216.0`')
  })
  test('the pick: within one rank a middle input before an empty one', () => {
    const s = made('s.js', 'function shout(s) {\n  return s.toUpperCase() + "!"\n}\nconsole.log(shout("hi"))\n')
    const kept = thinkCalcKept('1. 따라갑니다.\n\n결과: `"HI!"`', thinkCalcScope([s]), '노트', [s.diff])
    expect(valueThinkOf(kept)).toBe('shout("h")')
  })
})
