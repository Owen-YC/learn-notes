import { describe, expect, test } from 'claude-code/testing'

import {
  TRACE_LABEL,
  changeOf,
  creationHunk,
  isThinkFollow,
  isThinkShape,
  openThink,
  thinkCallees,
  thinkOf,
  THINK_VARIANT,
  thinkVariantOf,
  valueThinkLine,
} from '../hooks/notes'

/** A change as the hooks keep it: a file made whole (Write) or an edit's hunk. */
const made = (file: string, content: string) => changeOf({ path: `/p/${file}`, root: '/p', tool: 'Write', kind: 'create', hunks: [creationHunk(content)] })
const edit = (file: string, newStart: number, lines: string[]) =>
  changeOf({
    path: `/p/${file}`,
    root: '/p',
    tool: 'Edit',
    kind: 'update',
    hunks: [{ oldStart: newStart, oldLines: lines.filter(l => !l.startsWith('+')).length, newStart, newLines: lines.filter(l => !l.startsWith('-')).length, lines }],
  })
/** 1.12.0's own line for a call, as a 1.12.0 store keeps it (its maker thinkCallLine went with the G5c ON path in 1.13.0). */
const OLD_LINE = (call: string) => `**생각해 보기:** \`${call}\`를 실행하면 최종 결과는 무엇이 될까요?`
const names = (changes: Parameters<typeof thinkCallees>[0]) => thinkCallees(changes).map(one => `${one.name}${one.anchor ? `@${one.anchor}` : ''}`)

describe('1.12.0 G5 생각해 보기 (호출 하나): which functions a line may call', () => {
  test('a short pure function whole in its hunk or file; its anchor when one literal call of it stands at the top level', () => {
    expect(names([edit('a.js', 1, [' function sumOdd(xs) {', '   let t = 0;', '-  for (const x of xs) t += x;', '+  for (const x of xs) if (x % 2) t += x;', '   return t;', ' }', ' console.log(sumOdd([1, 2, 3]));'])])).toEqual(['sumOdd@sumOdd([1, 2, 3])'])
    expect(names([made('b.py', 'def half(n):\n    if n < 0:\n        return None\n    return n // 2\n')])).toEqual(['half'])
    expect(names([made('c.ts', 'export const twice = (n: number): number => n * 2\n')])).toEqual(['twice'])
    // An edit's hunk may stop inside a python body, unless its last shown line is a return at the body's own indent.
    expect(names([edit('q.py', 1, [' def steps(f, n):', '-    c = f', '+    c = f - 1', '     t = c * n', '     return t', ' '])])).toEqual(['steps'])
    expect(names([edit('r.py', 1, [' def steps(f, n):', '-    c = f', '+    c = f - 1', '     for i in range(n):', '         c += i', ' '])])).toEqual([])
  })
  test('out: DOM, jsx/tsx, async, rounding, an unshown name, a cut body, a name defined twice, another language', () => {
    expect(names([made('d.js', 'function onClick(e) {\n  document.title = e.target.value\n}\n')])).toEqual([])
    expect(names([made('E.jsx', 'export function E(p) {\n  return p.n + 1\n}\n')])).toEqual([])
    expect(names([made('f.js', 'async function f(x) {\n  return x\n}\n')])).toEqual([])
    expect(names([made('g.ts', 'export function g(x: number) {\n  return Math.round(x * 10) / 10\n}\n')])).toEqual([])
    expect(names([made('h.py', 'def h(x):\n    return round(x, 1)\n')])).toEqual([])
    expect(names([edit('i.js', 40, ['   const fee = base * RATE;', '-  return fee;', '+  return fee + 1;', ' }'])])).toEqual([])
    expect(names([made('j.js', 'function j(x) {\n  return x * RATE\n}\n')])).toEqual([])
    expect(names([made('k.js', 'const RATE = 3\nfunction k(x) {\n  return x * RATE\n}\n')])).toEqual(['k'])
    expect(names([made('l.js', 'function l(x) {\n  return x\n}\n'), made('m.js', 'function l(y) {\n  return y\n}\n')])).toEqual([])
    expect(names([made('n.js', 'function n(x) {\n  return x\n}\n'), made('o.go', 'package main\n')])).toEqual([])
    expect(names([made('p.js', 'function p(...xs) {\n  return xs.length\n}\n')])).toEqual([])
  })
  test('out (1.12.0 final): a head naming what is not shown, a name from another file, module state, printing, no value returned', () => {
    expect(names([made('a.js', 'const f = (a) => a * RATE;\nconsole.log(f(2))\n')])).toEqual([])
    expect(names([made('a.js', 'function f(a) { return a * RATE }\n')])).toEqual([])
    expect(names([made('a.js', 'function f(a, b = LIMIT) {\n  return a + b\n}\n')])).toEqual([])
    expect(names([made('a.py', 'def f(x): return x * RATE\n')])).toEqual([])
    expect(names([made('a.py', 'RATE = 2\n'), made('b.py', 'def f(x):\n    return x * RATE\n')])).toEqual([])
    expect(names([made('a.js', 'function helper(x) {\n  return x + 1\n}\n'), made('b.js', 'function f(x) {\n  return helper(x) * 2\n}\n')])).toEqual(['helper'])
    expect(names([made('a.js', 'let count = 0\nfunction inc(x) {\n  count += x\n  return count\n}\n')])).toEqual([])
    expect(names([made('a.py', 'items = []\ndef add(x):\n    items.append(x)\n    return len(items)\n')])).toEqual([])
    expect(names([made('a.py', 'def show(n):\n    for i in range(n):\n        print(i)\n')])).toEqual([])
    expect(names([made('a.js', 'function show(n) {\n  for (let i = 0; i < n; i++) console.log(i)\n  return n\n}\n')])).toEqual([])
    expect(names([made('a.js', 'function add(list, x) {\n  list.push(x)\n}\n')])).toEqual([])
    // Still in: a same-file constant of one primitive, a same-file helper, an arrow's expression body.
    expect(names([made('b.ts', 'type Book = { id: number; title: string };\n\nexport function titleById(books: Book[], id: number): string | null {\n  for (const book of books) {\n    if (book.id === id) return book.title;\n  }\n  return null;\n}\n')])).toEqual(['titleById'])
    // A ts type is gone at run time: an annotation naming a type the note does not show is not read; a value is.
    expect(names([made('c.ts', 'export function titleOf(book: Book): string {\n  return book.title\n}\n')])).toEqual(['titleOf'])
    expect(names([made('d.ts', 'export function f(xs: Item[], n: number = LIMIT): number {\n  return xs.length + n\n}\n')])).toEqual([])
    expect(names([made('e.ts', 'export const g = (xs: Item[]): Item[] => xs.filter((x: Item) => x.on)\n')])).toEqual(['g'])
    expect(names([made('h.ts', 'export function h(xs: string[]): number {\n  const n: Count = xs.length as Count\n  return n\n}\n')])).toEqual(['h'])
    expect(names([made('a.py', 'RATE = 2  # 배율\ndef f(x):\n    return x * RATE\n')])).toEqual(['f'])
    expect(names([made('a.js', 'const RATE = 2;\nfunction g(x) {\n  return x + 1\n}\nconst f = (x) => g(x) * RATE\n')])).toEqual(['g', 'f'])
  })
})

describe('1.12.0 G5: r asks for one call; code settles it and writes the line', () => {
  const walk = ['예시 호출: `sumOdd([1, 2, 3])`', '', '1. `t`는 0입니다.', '2. 결과는 `4`입니다.', '']
  test('only code\'s own line opens while on, whatever the note\'s changes; off, 1.9.0\'s reading', () => {
    // 1.13.0 G5e (re-pinned on purpose): while on only code's 1.13.0 line opens (valueThinkLine); 1.12.0's sentence no longer does.
    const answer = `${walk.join('\n')}\n\n${OLD_LINE('sumOdd([5, 7])')}`
    const asks = [{ question: TRACE_LABEL, answer, at: 1000 }]
    expect(openThink(asks, 2000, true, true)).toBeUndefined()
    expect(openThink([{ question: TRACE_LABEL, answer: `${walk.join('\n')}\n\n${valueThinkLine('sumOdd([5, 7])')}`, at: 1000 }], 2000, true, true)?.call).toBe('sumOdd([5, 7])')
    const old = [{ question: TRACE_LABEL, answer: `${walk.join('\n')}\n\n**생각해 보기:** \`xs\`를 \`[5]\`로 바꾸면 최종 결과는 무엇이 될까요?`, at: 1000 }]
    expect(openThink(old, 2000, true, true)).toBeUndefined()
    expect(openThink(old, 2000, false, false)?.question).toBe('`xs`를 `[5]`로 바꾸면 최종 결과는 무엇이 될까요?')
  })
})

describe('1.12.0 G5: the check\'s wording per model is a frozen table, not a switch', () => {
  test('haiku keeps 1.11.0\'s walk-through line, sonnet one deciding expression; any other setting haiku\'s', () => {
    expect(THINK_VARIANT).toEqual({ haiku: 'trace', sonnet: 'basis' })
    expect(Object.isFrozen(THINK_VARIANT)).toBe(true)
    expect([thinkVariantOf('haiku'), thinkVariantOf('sonnet'), thinkVariantOf('some-model-1')]).toEqual(['trace', 'basis', 'trace'])
  })
})

describe('1.12.0 G5 (build): the scope table, every hole the critique named', () => {
  test('an anchor only for one top-level statement that calls the function with literals, its arity, no named argument, 60 characters at most', () => {
    const fn = 'function f(s, n) {\n  return s.length + n\n}\n'
    expect(names([made('a.js', `${fn}f("ab", 1);\n`)])).toEqual(['f@f("ab", 1)'])
    expect(names([made('a.js', `${fn}console.log(f("ab", 1))\n`)])).toEqual(['f@f("ab", 1)'])
    expect(names([made('a.py', 'def f(s, n):\n    return len(s) + n\n\nprint(f("ab", 1))\n')])).toEqual(['f@f("ab", 1)'])
    // Two such statements, a call of the wrong arity, a named argument, a variable, one too long: no anchor, still in.
    expect(names([made('a.js', `${fn}f("ab", 1)\nf("cd", 2)\n`)])).toEqual(['f'])
    expect(names([made('a.js', `${fn}f("ab")\n`)])).toEqual(['f'])
    expect(names([made('a.py', 'def f(s, n=1):\n    return len(s) + n\n\nprint(f("ab", n=2))\n')])).toEqual(['f'])
    expect(names([made('a.js', `${fn}const s = "ab"\nf(s, 1)\n`)])).toEqual(['f'])
    expect(names([made('a.js', `${fn}f("${'a'.repeat(60)}", 1)\n`)])).toEqual(['f'])
    // An indented call is no top-level statement.
    expect(names([made('a.js', `${fn}if (true) {\n  f("ab", 1)\n}\n`)])).toEqual(['f'])
  })
  test('a python body to the end of a file made whole is whole; an edit\'s hunk is whole only with a return at the body\'s own indent', () => {
    const body = ['def f(x):', '    if x > 0:', '        return 1', '    else:', '        return 2']
    expect(names([made('w.py', `${body.join('\n')}\n`)])).toEqual(['f'])
    expect(names([edit('w.py', 10, [` ${body[0]}`, '-    if x >= 0:', `+${body[1]}`, ` ${body[2]}`, ` ${body[3]}`, ` ${body[4]}`])])).toEqual([])
    // The same edit with a return at the body's own indent last: nothing after it can run.
    expect(names([edit('w.py', 10, [' def f(x):', '-    if x >= 0:', '+    if x > 0:', '         return 1', '     return 2'])])).toEqual(['f'])
  })
  test('out: a change cut, left out of the prompt by its budget, a tool\'s setup, a jsx file beside, no changed line in the body, a body past 40 lines', () => {
    const fn = 'function f(x) {\n  return x + 1\n}\n'
    expect(names([{ ...made('a.js', fn), isCut: true }])).toEqual([])
    const big = { file: 'big.json', kind: 'update' as const, diff: `@@ -1,1 +1,3000 @@\n${'+"k": 1,\n'.repeat(3000)}`, isCut: false, added: 3000, removed: 0 }
    expect(names([big, made('a.js', fn)])).toEqual([])
    expect(names([made('a.js', fn), big])).toEqual([])
    expect(names([made('vite.config.js', fn)])).toEqual([])
    expect(names([made('a.js', fn), made('B.jsx', 'export const B = () => null\n')])).toEqual([])
    expect(names([made('a.js', fn), made('README.md', '# 앱\n'), made('s.css', '.a { color: red }\n')])).toEqual(['f'])
    expect(names([edit('a.js', 1, [' function f(x) {', '   return x + 1', ' }', ' ', '-const y = 1', '+const y = 2'])])).toEqual([])
    expect(names([made('a.js', `function f(x) {\n${'  x += 1\n'.repeat(40)}  return x\n}\n`)])).toEqual([])
    expect(names([made('a.js', `function f(x) {\n${'  x += 1\n'.repeat(38)}  return x\n}\n`)])).toEqual(['f'])
    // A deleted file alone, or nothing but data and docs: no function to call.
    expect(names([changeOf({ path: '/p/a.js', root: '/p', tool: 'Bash', kind: 'delete', hunks: [] })])).toEqual([])
    expect(names([made('README.md', '# 앱\n')])).toEqual([])
  })
  test('a helper dropped drops its callers; a name the note defines twice in any form is out', () => {
    expect(names([made('a.js', 'function helper(x) {\n  return x * RATE\n}\nfunction f(x) {\n  return helper(x) + 1\n}\n')])).toEqual([])
    expect(names([made('a.js', 'function f(x) {\n  return x + 1\n}\nconst f2 = 1\nclass f {}\n')])).toEqual([])
  })
})

describe('1.12.0 G5 (build): which lines open while on, and the older windows\' reading of code\'s line', () => {
  const line = OLD_LINE('sumOdd([5, 7])')
  const said = '`sumOdd([5, 7])`를 실행하면 최종 결과는 무엇이 될까요?'
  // 1.13.0 G5e (re-pinned on purpose): the line that opens while on is valueThinkLine's.
  const valueLine = valueThinkLine('sumOdd([5, 7])')
  const valueSaid = '`sumOdd([5, 7])`를 실행한 결과를 값 하나로 적어 보세요 (오류면 `오류`)'
  const asked = (answer: string) => [{ question: TRACE_LABEL, answer, at: 1000 }]
  test('code\'s sentence fits 1.11.0\'s closed form and 1.8.0\'s free reading, so every older window opens it', () => {
    expect(thinkOf(`x\n\n${line}`, true)).toBe(said)
    expect(thinkOf(`x\n\n${line}`, false)).toBe(said)
    expect(isThinkShape(said)).toBe(true)
  })
  test('on, only code\'s sentence opens and follows: never a free line, never a 1.10/1.11 closed line, the same in the pane and the ask', () => {
    for (const other of ['`xs`를 `[5]`로 바꾸면 최종 결과는 무엇이 될까요?', '홀수만 더하면 어떻게 될까요?', '`sumOdd(xs)`를 실행하면 최종 결과는 무엇이 될까요?']) {
      const asks = [...asked(`1. a\n\n**생각해 보기:** ${other}`), { question: '12요', answer: '네.', at: 2000 }]
      expect(openThink(asks.slice(0, 1), 2000, true, true)).toBeUndefined()
      expect(isThinkFollow(asks, 1, true, true)).toBe(false)
    }
    const asks = [...asked(`1. a\n\n${valueLine}`), { question: '12요', answer: '네.', at: 2000 }]
    expect(openThink(asks.slice(0, 1), 2000, true, true)).toEqual({ question: valueSaid, trace: `1. a\n\n${valueLine}`, call: 'sumOdd([5, 7])' })
    expect(isThinkFollow(asks, 1, true, true)).toBe(true)
    const old = [...asked(`1. a\n\n${line}`), { question: '12요', answer: '네.', at: 2000 }]
    expect(openThink(old.slice(0, 1), 2000, true, true)).toBeUndefined()
    expect(isThinkFollow(old, 1, true, true)).toBe(false)
    // Off, 1.9.0's reading: the free line opens and follows.
    const free = [...asked('1. a\n\n**생각해 보기:** 홀수만 더하면 어떻게 될까요?'), { question: '12요', answer: '네.', at: 2000 }]
    expect(openThink(free.slice(0, 1), 2000)?.question).toBe('홀수만 더하면 어떻게 될까요?')
    expect(isThinkFollow(free, 1)).toBe(true)
  })
})
