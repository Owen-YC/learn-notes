import { describe, expect, test } from 'claude-code/testing'

import {
  TRACE_LABEL,
  TRACE_QUESTION,
  changeOf,
  creationHunk,
  isThinkCallSaid,
  isThinkFollow,
  isThinkShape,
  openThink,
  thinkCallKept,
  thinkCallLine,
  thinkCallees,
  thinkOf,
  thinkSlotReply,
  traceCallQuestion,
  traceQuestion,
  withoutWork,
  slotFallback,
  SLOT_UNREAD,
  THINK_VARIANT,
  thinkVariantOf,
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
  const callees = thinkCallees([made('a.js', 'function sumOdd(xs) {\n  let t = 0\n  for (const x of xs) if (x % 2) t += x\n  return t\n}\n')])
  const walk = ['예시 호출: `sumOdd([1, 2, 3])`', '', '1. `t`는 0입니다.', '2. 결과는 `4`입니다.', '']
  test('the request fits askPrompt cut; out of scope it is 1.7.0 to the byte', () => {
    expect(traceCallQuestion(callees).length).toBeLessThan(1000)
    expect(traceQuestion(false)).toBe(TRACE_QUESTION)
  })
  test('a bare call, a sentence with one call, a parameter swap and a value swap each settle to code\'s own line', () => {
    const line = thinkCallLine('sumOdd([5, 7])')
    expect(thinkCallKept([...walk, '**생각해 보기:** `sumOdd([5, 7])`'].join('\n'), callees, '', []).endsWith(line)).toBe(true)
    expect(thinkCallKept([...walk, '**생각해 보기:** `sumOdd([5, 7])`를 부르면 결과는?'].join('\n'), callees, '', []).endsWith(line)).toBe(true)
    expect(thinkCallKept([...walk, '**생각해 보기:** `xs`를 `[5, 7]`로 바꾸면 최종 결과는 무엇이 될까요?'].join('\n'), callees, '', []).endsWith(thinkCallLine('sumOdd([5, 7])'))).toBe(true)
    expect(thinkCallKept([...walk, '**생각해 보기:** `[1, 2, 3]`을 `[5, 7]`로 바꾸면 최종 결과는 무엇이 될까요?'].join('\n'), callees, '', []).endsWith(thinkCallLine('sumOdd([5, 7])'))).toBe(true)
    expect(isThinkShape(line.replace('**생각해 보기:** ', ''))).toBe(true)
    expect(thinkOf(`x\n\n${line}`)).toBe('`sumOdd([5, 7])`를 실행하면 최종 결과는 무엇이 될까요?')
  })
  test('no line: the walked call itself, a call shown in the note or the diff, an unknown name, Korean outside quotes, no walked call', () => {
    const bare = walk.join('\n').trimEnd()
    expect(thinkCallKept([...walk, '**생각해 보기:** `sumOdd([1, 2, 3])`'].join('\n'), callees, '', [])).toBe(bare)
    expect(thinkCallKept([...walk, '**생각해 보기:** `sumOdd([5, 7])`'].join('\n'), callees, '- 예: `sumOdd([5,7])` → 12', [])).toBe(bare)
    expect(thinkCallKept([...walk, '**생각해 보기:** `other([5, 7])`'].join('\n'), callees, '', [])).toBe(bare)
    expect(thinkCallKept([...walk, '**생각해 보기:** `sumOdd(숫자들)`'].join('\n'), callees, '', [])).toBe(bare)
    expect(thinkCallKept(['1. 결과는 4입니다.', '', '**생각해 보기:** `sumOdd([5, 7])`'].join('\n'), callees, '', [])).toBe('1. 결과는 4입니다.')
  })
  test('only code\'s own line opens while on, whatever the note\'s changes; off, 1.9.0\'s reading', () => {
    const answer = `${walk.join('\n')}\n\n${thinkCallLine('sumOdd([5, 7])')}`
    const asks = [{ question: TRACE_LABEL, answer, at: 1000 }]
    expect(openThink(asks, 2000, true, true)?.question).toBe('`sumOdd([5, 7])`를 실행하면 최종 결과는 무엇이 될까요?')
    const old = [{ question: TRACE_LABEL, answer: `${walk.join('\n')}\n\n**생각해 보기:** \`xs\`를 \`[5]\`로 바꾸면 최종 결과는 무엇이 될까요?`, at: 1000 }]
    expect(openThink(old, 2000, true, true)).toBeUndefined()
    expect(openThink(old, 2000, false, false)?.question).toBe('`xs`를 `[5]`로 바꾸면 최종 결과는 무엇이 될까요?')
    expect(isThinkCallSaid('`sumOdd`를 `[5]`로 바꾸면 최종 결과는 무엇이 될까요?')).toBe(false)
    expect(isThinkCallSaid('`sumOdd(xs)`를 실행하면 최종 결과는 무엇이 될까요?')).toBe(false)
    expect(isThinkCallSaid('`sum_odd([5, 7])`를 실행하면 최종 결과는 무엇이 될까요?')).toBe(true)
  })
})

describe('1.12.0 G5: the check\'s wording per model is a frozen table, not a switch', () => {
  test('haiku keeps 1.11.0\'s walk-through line, sonnet one deciding expression; any other setting haiku\'s', () => {
    expect(THINK_VARIANT).toEqual({ haiku: 'trace', sonnet: 'basis' })
    expect(Object.isFrozen(THINK_VARIANT)).toBe(true)
    expect([thinkVariantOf('haiku'), thinkVariantOf('sonnet'), thinkVariantOf('some-model-1')]).toEqual(['trace', 'basis', 'trace'])
  })
})

describe('1.12.0 G5: the check\'s reply as shown', () => {
  const reply = (kind: string, result: string, verdict: string, why = '까닭입니다.', answer = '없음') => `종류: ${kind}\n따라가기: 한 줄\n바른 결과: ${result}\n판정: ${verdict}\n까닭: ${why}\n답: ${answer}`
  test('the plugin\'s head is the only word on the guess; a conceding sentence under 틀림 goes; work lines never show', () => {
    expect(thinkSlotReply(reply('짐작', '`4`', '맞음'), '4')).toBe('**맞혔습니다.** 까닭입니다.')
    expect(thinkSlotReply(reply('짐작', '`4`', '틀림', '3은 맞지만 아닙니다. 4가 나옵니다.'), '오류가 날 것 같아요')).toBe('**아쉽지만 틀렸습니다.** 4가 나옵니다.\n\n바른 결과: `4`')
    expect(thinkSlotReply(reply('모름', '`4`', '없음'), '모르겠어요')).toBe('바른 결과: `4`\n\n까닭입니다.')
    expect(thinkSlotReply(reply('질문', '`4`', '없음', '없음', '`%`는 나머지입니다.'), '%가 뭐예요?')).toBe('`%`는 나머지입니다.')
    expect(withoutWork(reply('짐작', '`4`', '없음'))).not.toContain('따라가기')
  })
  test('code settles a value guessed only where no reading differs: the same as written, or two plain numbers', () => {
    expect(thinkSlotReply(reply('모름', '`0`', '없음'), '0')).toBe('**맞혔습니다.**')
    expect(thinkSlotReply(reply('질문', '`null`', '없음', '없음', 'null입니다.'), 'null?')).toBe('**맞혔습니다.**')
    expect(thinkSlotReply(reply('짐작', '`3.0`을 돌려준다', '틀림'), '3')).toBe('**맞혔습니다.**')
    expect(thinkSlotReply(reply('짐작', '`5`를 돌려준다', '맞음'), '3')).toBe('**아쉽지만 틀렸습니다.**\n\n바른 결과: `5`를 돌려준다')
    // Left to the model: quotes, spaces, case, commas, lists and words are its verdict as it gave it.
    // A word typed without quotes against one quoted string: its content exactly; a plain number against a literal word differs.
    expect(thinkSlotReply(reply('짐작', '"nice"', '틀림'), 'nice')).toBe('**맞혔습니다.**')
    expect(thinkSlotReply(reply('짐작', "`'-----'`", '맞음'), '----')).toBe("**아쉽지만 틀렸습니다.**\n\n바른 결과: `'-----'`")
    expect(thinkSlotReply(reply('짐작', '`"Kim Minsu"`', '맞음'), 'KimMinsu')).toBe('**아쉽지만 틀렸습니다.**\n\n바른 결과: `"Kim Minsu"`')
    expect(thinkSlotReply(reply('짐작', '`null`', '맞음'), '0')).toBe('**아쉽지만 틀렸습니다.**\n\n바른 결과: `null`')
    expect(thinkSlotReply(reply('짐작', '`1`', '없음'), 'null')).toBe('**아쉽지만 틀렸습니다.**\n\n바른 결과: `1`')
    for (const [result, mine] of [['`"KimMinsu"`', '"Kim Minsu"'], ['`"a-b"`', "'a - b'"], ['`"3"`', '3'], ['`True`', 'true'], ['`[1,000]`', '[1000]'], ['`1000`', '1,000'], ['`"True"`', 'True']] as const) {
      expect(thinkSlotReply(reply('짐작', result, '틀림'), mine)).toBe(`**아쉽지만 틀렸습니다.** 까닭입니다.\n\n바른 결과: ${result}`)
      expect(thinkSlotReply(reply('짐작', result, '맞음'), mine)).toBe('**맞혔습니다.** 까닭입니다.')
    }
  })
  test('a reply it cannot read shows its parts, never a label, a verdict word or an empty part; reason two sentences, answer three', () => {
    expect(thinkSlotReply(reply('짐작', '`8`을 돌려준다', '맞음', '하나. 둘. 셋.'), '8')).toBe('**맞혔습니다.** 하나. 둘.')
    expect(thinkSlotReply(reply('질문', '`8`', '없음', '없음', '첫째. 둘째. 셋째. 넷째.'), '왜요?')).toBe('첫째. 둘째. 셋째.')
    const noVerdict = reply('짐작', '`8`을 돌려준다', '없음', '더합니다.')
    expect(thinkSlotReply(noVerdict, '에러 날 것 같아요')).toBeUndefined()
    expect(slotFallback(noVerdict)).toBe('바른 결과: `8`을 돌려준다\n\n더합니다.')
    expect(slotFallback(reply('모름', '없음', '없음', '없음', '없음'))).toBe(SLOT_UNREAD)
    expect(slotFallback('판정은 맞음입니다. 결과는 8입니다.')).toBe(SLOT_UNREAD)
    for (const text of [noVerdict, reply('모름', '없음', '없음', '없음', '없음')]) expect(slotFallback(text)).not.toMatch(/종류|따라가기|근거|판정|답:|없음/)
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

describe('1.12.0 G5 (build): r\'s request and code\'s line', () => {
  const callees = thinkCallees([made('a.js', 'function sumOdd(xs) {\n  let t = 0\n  for (const x of xs) if (x % 2) t += x\n  return t\n}\nconsole.log(sumOdd([1, 2, 3]))\n')])
  const walk = ['1. `t`는 0입니다.', '2. 결과는 `4`입니다.', '']
  test('with an anchor r is told the call to follow, else asked to name one on its first line; under askPrompt\'s 1000 for many functions', () => {
    expect(traceCallQuestion(callees).startsWith('바뀐 코드를 코드에 있는 호출 `sumOdd([1, 2, 3])` 그대로 한 단계씩 따라가 주세요. ')).toBe(true)
    const many = thinkCallees([made('a.js', Array.from({ length: 12 }, (_, i) => `function longFunctionName${i}(x) {\n  return x + ${i}\n}`).join('\n'))])
    expect(many).toHaveLength(12)
    expect(traceCallQuestion(many).length).toBeLessThan(1000)
    expect(traceQuestion(false)).not.toContain('생각해 보기')
  })
  test('the anchor is the walked call when the walk-through names none; one reject per rule', () => {
    const kept = (line: string, note = '', diffs: string[] = [], above = walk) => thinkCallKept([...above, `**생각해 보기:** ${line}`].join('\n'), callees, note, diffs)
    const bare = walk.join('\n').trimEnd()
    expect(kept('`sumOdd([5, 7])`')).toBe(`${bare}\n\n${thinkCallLine('sumOdd([5, 7])')}`)
    expect(kept('`[1, 2, 3]`을 `[9]`로 바꾸면 최종 결과는 무엇이 될까요?')).toBe(`${bare}\n\n${thinkCallLine('sumOdd([9])')}`)
    // The walked call itself (written another way), a call the note's 확인 line or a diff shows, one the walk-through wrote.
    expect(kept('`sumOdd([1,2,3])`')).toBe(bare)
    expect(kept('`sumOdd([5, 7])`', '- 확인: `sumOdd([5, 7])`는 12')).toBe(bare)
    expect(kept('`sumOdd([5, 7])`', '', ['+console.log(sumOdd([5,7]))'])).toBe(bare)
    expect(kept('`sumOdd([5, 7])`', '', [], ['1. `sumOdd([5, 7])`도 12입니다.', ''])).toBe('1. `sumOdd([5, 7])`도 12입니다.')
    // Too long, a comment outside quotes, the wrong arity, two calls, a line not last.
    expect(kept(`\`sumOdd([${Array.from({ length: 30 }, (_, i) => i).join(', ')}])\``)).toBe(bare)
    expect(kept('`sumOdd([5, 7]) // 12`')).toBe(bare)
    expect(kept('`sumOdd([5], [7])`')).toBe(bare)
    expect(kept('`sumOdd([5])` 또는 `sumOdd([7])`')).toBe(bare)
    expect(thinkCallKept([...walk, '**생각해 보기:** `sumOdd([5, 7])`', '', '끝.'].join('\n'), callees, '', [])).toBe([...walk, '', '끝.'].join('\n'))
  })
  test('a python named argument is no line; a py call with py literals is', () => {
    const py = thinkCallees([made('a.py', 'def half(n, floor=True):\n    return n // 2 if floor else n / 2\n')])
    const walked = ['예시 호출: `half(8)`', '', '1. 8 // 2는 4입니다.', '']
    expect(thinkCallKept([...walked, '**생각해 보기:** `half(9, floor=False)`'].join('\n'), py, '', [])).toBe(walked.join('\n').trimEnd())
    expect(thinkCallKept([...walked, '**생각해 보기:** `half(9, False)`'].join('\n'), py, '', [])).toBe(`${walked.join('\n').trimEnd()}\n\n${thinkCallLine('half(9, False)')}`)
  })
})

describe('1.12.0 G5 (build): which lines open while on, and the older windows\' reading of code\'s line', () => {
  const line = thinkCallLine('sumOdd([5, 7])')
  const said = '`sumOdd([5, 7])`를 실행하면 최종 결과는 무엇이 될까요?'
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
    const asks = [...asked(`1. a\n\n${line}`), { question: '12요', answer: '네.', at: 2000 }]
    expect(openThink(asks.slice(0, 1), 2000, true, true)).toEqual({ question: said, trace: `1. a\n\n${line}` })
    expect(isThinkFollow(asks, 1, true, true)).toBe(true)
    // Off, 1.9.0's reading: the free line opens and follows.
    const free = [...asked('1. a\n\n**생각해 보기:** 홀수만 더하면 어떻게 될까요?'), { question: '12요', answer: '네.', at: 2000 }]
    expect(openThink(free.slice(0, 1), 2000)?.question).toBe('홀수만 더하면 어떻게 될까요?')
    expect(isThinkFollow(free, 1)).toBe(true)
  })
})

describe('1.12.0 G5 (build): the check\'s reply by kind and model wording', () => {
  const reply = (work: string, kind: string, result: string, verdict: string, why = '까닭 하나. 까닭 둘. 까닭 셋.', answer = '없음') =>
    `종류: ${kind}\n${work}\n바른 결과: ${result}\n판정: ${verdict}\n까닭: ${why}\n답: ${answer}`
  test('haiku\'s 따라가기 and sonnet\'s 근거 read the same; the reason cut to two sentences, an answer to three; nothing of the work line shown', () => {
    for (const work of ['따라가기: t는 0, 5, 12', '근거: `5 + 7`', '**근거:** `5 + 7`']) {
      expect(thinkSlotReply(reply(work, '짐작', '`12`', '맞음'), '12요')).toBe('**맞혔습니다.** 까닭 하나. 까닭 둘.')
      expect(thinkSlotReply(reply(work, '짐작', '`12`', '틀림'), '에러가 날 것 같아요')).toBe('**아쉽지만 틀렸습니다.** 까닭 하나. 까닭 둘.\n\n바른 결과: `12`')
      expect(thinkSlotReply(reply(work, '모름', '`12`', '없음'), '모르겠어요')).toBe('바른 결과: `12`\n\n까닭 하나. 까닭 둘.')
      expect(thinkSlotReply(reply(work, '질문', '`12`', '없음', '없음', '하나. 둘. 셋. 넷.'), '왜요?')).toBe('하나. 둘. 셋.')
      for (const text of ['12요', '에러가 날 것 같아요', '모르겠어요', '왜요?']) expect(thinkSlotReply(reply(work, '짐작', '`12`', '맞음'), text) ?? '').not.toMatch(/따라가기|근거|종류|판정/)
    }
  })
  test('under 틀림 every conceding sentence goes; under 맞음 the reason stays as written', () => {
    for (const word of ['맞지만', '맞았지만', '맞긴', '맞으나', '맞는데', '일부 맞', '짐작하신 대로', '짐작대로']) {
      expect(thinkSlotReply(reply('근거: x', '짐작', '`12`', '틀림', `${word} 다릅니다. 12입니다.`), '에러가 나요')).toBe('**아쉽지만 틀렸습니다.** 12입니다.\n\n바른 결과: `12`')
    }
    expect(thinkSlotReply(reply('근거: x', '짐작', '`12`', '맞음', '5와 7은 맞지만 더 봅니다. 12입니다.'), '12')).toBe('**맞혔습니다.** 5와 7은 맞지만 더 봅니다. 12입니다.')
  })
  test('code\'s verdict for a value guessed: numerals by value, a numeral against a literal word wrong, a bare word against one quoted string by its content; a code verdict that overrides drops the reason', () => {
    expect(thinkSlotReply(reply('근거: x', '짐작', '`12.0`', '틀림'), '12요')).toBe('**맞혔습니다.**')
    expect(thinkSlotReply(reply('근거: x', '짐작', '`12`', '맞음'), '13이요')).toBe('**아쉽지만 틀렸습니다.**\n\n바른 결과: `12`')
    expect(thinkSlotReply(reply('근거: x', '짐작', '`None`', '맞음'), '0')).toBe('**아쉽지만 틀렸습니다.**\n\n바른 결과: `None`')
    expect(thinkSlotReply(reply('근거: x', '짐작', '`"odd"`', '틀림'), 'odd')).toBe('**맞혔습니다.**')
    expect(thinkSlotReply(reply('근거: x', '짐작', '`"odd"`', '맞음'), 'even')).toBe('**아쉽지만 틀렸습니다.**\n\n바른 결과: `"odd"`')
    // Agreeing with the model keeps its reason.
    expect(thinkSlotReply(reply('근거: x', '짐작', '`12`', '맞음'), '12')).toBe('**맞혔습니다.** 까닭 하나. 까닭 둘.')
    // Left to the model: two results in the line, a list, case.
    expect(thinkSlotReply(reply('근거: x', '짐작', '`12` 또는 `13`', '맞음'), '13')).toBe('**맞혔습니다.** 까닭 하나. 까닭 둘.')
    expect(thinkSlotReply(reply('근거: x', '짐작', '`[1, 3]`', '틀림'), '[1,3]')).toBe('**아쉽지만 틀렸습니다.** 까닭 하나. 까닭 둘.\n\n바른 결과: `[1, 3]`')
    expect(thinkSlotReply(reply('근거: x', '짐작', '`TRUE`', '맞음'), 'true')).toBe('**맞혔습니다.** 까닭 하나. 까닭 둘.')
  })
  test('the fallback is built from parts alone: never a label, a verdict word or an empty part, prose with no part one fixed line', () => {
    for (const text of ['', '그냥 글입니다.', '종류: 짐작\n근거: `5 + 7`\n판정: 맞음', '판정: 없음\n까닭: 없음\n답: 없음', '1. `t`는 0입니다.\n2. 12를 돌려줍니다.']) {
      expect(slotFallback(text)).toBe(SLOT_UNREAD)
    }
    expect(slotFallback('바른 결과: `12`\n판정: 맞음\n까닭: 없음')).toBe('바른 결과: `12`')
    expect(slotFallback('종류: 질문\n답: 첫째. 둘째. 셋째. 넷째.')).toBe('첫째. 둘째. 셋째.')
    expect(SLOT_UNREAD).toBe('답을 제대로 읽지 못했습니다. 질문을 한 번 더 적어 주세요.')
  })
})
