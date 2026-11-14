import { describe, expect, test } from 'claude-code/testing'

import {
  isLikeMine,
  isNewInScope,
  isSameValue,
  isStringShape,
  answerShown,
  NEW_LEAD_LINES,
  NEW_NOT_SAID,
  newRead,
  newValueLines,
  checkPrompt,
  localRight,
  NEW_ASK,
  NEW_HINT_PLAIN,
  NEW_LEAD,
  NEW_SCENES,
  newItem,
  newOutput,
  newPrints,
  newScenes,
  parseCheck,
  parseQuiz,
  quizPrompt,
  rungOf,
  valuesVerdict,
  withScenes,
  type QuizPick,
} from '../hooks/notes'

const pick = (over: Partial<QuizPick> = {}): QuizPick =>
  ({ key: 'k1', name: '개념', count: 3, firstAt: 0, lastAt: 0, blurb: '설명입니다.', files: [], lang: 'js', rung: 'new', ...over }) as QuizPick
const parts = (k: string, a: string, l = '') => new Map<string, string[]>([['K1', ['', ...k.split('\n')]], ['A1', ['', ...a.split('\n')]], ['L1', [l]]])
const js = (code: string) => '```js\n' + code + '\n```'
const py = (code: string) => '```python\n' + code + '\n```'

describe('1.12.0 G3 synthesis: which concepts are asked in code never seen', () => {
  test('ts, type-level and run-order concepts and a concept this window missed never become new', () => {
    expect(isNewInScope('a.js', '배열 map입니다.', 'const a = [1].map(x => x)')).toBe(true)
    expect(isNewInScope('a.py', '리스트 컴프리헨션입니다.', 'a = [x * 2 for x in [1, 2]]')).toBe(true)
    expect(isNewInScope('a.ts', '문자열 padStart입니다.', 'const s: string = "7".padStart(3, "0")')).toBe(false)
    expect(isNewInScope('a.py', '타입 힌트는 함수 인자에 붙인 설명입니다.', 'def f(x: int) -> int: return x')).toBe(false)
    expect(isNewInScope('a.py', '함수 인자 설명 — `def split(total: int, people: int) -> float:`', 'def split(total: int, people: int) -> float:')).toBe(false)
    expect(isNewInScope('a.js', 'setTimeout 0초라도 나중에 실행됩니다.', 'setTimeout(() => console.log(1), 0)')).toBe(false)
    expect(isNewInScope('a.js', '알림 순서입니다.', 'Promise.resolve().then(() => 1)')).toBe(false)
    expect(isNewInScope('a.py', '코루틴입니다.', 'import asyncio')).toBe(false)
    expect(isNewInScope('a.js', 'typeof는 값의 종류를 문자열로 줍니다.', 'typeof 3')).toBe(true)
    expect(isNewInScope('a.js', '배열 map입니다.', 'x', true)).toBe(false)
  })

  test('rungOf keeps 1.10.0 conditions and adds the scope (new only at step 4, due, in scope, not missed)', () => {
    const one = { key: 'k', name: 'n', count: 3, firstAt: 0, lastAt: 0, blurb: '배열 map입니다.', files: ['a.js'], step: 4 }
    const how = { code: { file: 'a.js', text: 'const a = [1].map(x => x * 2)\nconsole.log(a[0])' }, isAsking: false, isTeam: false, isDue: true }
    expect(rungOf(one, how, 4)).toBe('new')
    expect(rungOf(one, { ...how, isNewMissed: true }, 4)).toBe('mine')
    expect(rungOf(one, { ...how, code: { file: 'a.ts', text: how.code.text } }, 4)).toBe('mine')
    expect(rungOf(one, how, Infinity)).toBe('mine')
  })
})

describe('1.12.0 G3 synthesis: settings', () => {
  test('24 scenes of ASCII names, none a forbidden word; deterministic per key and day; no two picks share one; none the learner holds', () => {
    expect(NEW_SCENES.length).toBe(24)
    for (const s of NEW_SCENES) for (const n of s.names) expect(/^[a-z]+$/.test(n) && !['time', 'open', 'set', 'id', 'hash', 'input', 'os', 'sys', 'random', 'fs', 'window', 'document', 'process', 'prompt', 'alert'].includes(n)).toBe(true)
    const picks = [{ key: 'a', rung: 'new' as const, seen: '' }, { key: 'a', rung: 'new' as const, seen: '' }, { key: 'b', rung: 'mine' as const }]
    const one = newScenes(picks, '2026-11-13')
    expect(one).toEqual(newScenes(picks, '2026-11-13'))
    expect(one[0]).not.toBe(one[1])
    expect(one[2]).toBeUndefined()
    const all = NEW_SCENES.flatMap(s => s.names).join(' ')
    expect(newScenes([{ key: 'a', rung: 'new', seen: all }], 'd')).toEqual([null])
    const at = newScenes([{ key: 'a', rung: 'new', seen: '' }], 'd')[0]!
    const avoid = NEW_SCENES[at]!.names[0]
    expect(newScenes([{ key: 'a', rung: 'new', seen: `const ${avoid} = 1` }], 'd')[0]).not.toBe(at)
    expect(newScenes([{ key: 'a', rung: 'new', seen: `const x${avoid}y = 1` }], 'd')[0]).toBe(at)
  })

  test('withScenes turns a new pick with no scene left into mine', () => {
    const all = NEW_SCENES.flatMap(s => s.names).join(' ')
    const laid = [{ key: 'a', blurb: all, code: { file: 'a.js', text: 'x' } }]
    expect(withScenes(laid, ['new'], 'd').asIs).toEqual(['mine'])
  })
})

describe('1.12.0 G3 synthesis: the prompt', () => {
  test('no written trace wording in any ON prompt; K · L · A format; a scene line; all-new quiz says no kinds', () => {
    const p = (rung: 'new' | 'mine', i: number, lang = 'js') => pick({ key: `k${i}`, name: `n${i}`, rung, lang, scene: rung === 'new' ? i : undefined, ...(rung === 'mine' ? { code: { file: 'a.js', text: 'let a = 1\nconsole.log(a)' } } : {}) })
    for (const picks of [[p('new', 1), p('new', 2), p('mine', 3)], [p('new', 1, 'py'), p('new', 2), p('new', 3)], [pick({ key: 'z', name: 'z', slip: { what: 'w', question: 'q', mine: 'm' } }), p('new', 2), p('new', 3)]]) {
      for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
        const text = quizPrompt(picks as never, level)
        for (const word of ['한 줄씩', '따라', '과정', 'R1:', 'R2:', '코드 없이 왜로']) expect(text.includes(word)).toBe(false)
        expect(text.includes('K2:')).toBe(true)
        expect(text.includes('상황: ')).toBe(true)
      }
    }
    expect(quizPrompt([p('new', 1), p('new', 2), p('new', 3)] as never, 'beginner').includes('문제 유형:')).toBe(false)
    expect(NEW_ASK.includes('맨 바깥')).toBe(true)
  })
})

describe('1.12.0 G3 synthesis: the reader', () => {
  test('prints: top level, one argument, counted', () => {
    expect(newPrints(['let a = 1', 'console.log(a)', 'console.log(a + 1);'], 'js')).toEqual({ count: 2, place: false, form: false })
    expect(newPrints(['for (const x of [1]) {', '  console.log(x)', '}'], 'js').place).toBe(true)
    expect(newPrints(['if (a) console.log(1)'], 'js').place).toBe(true)
    expect(newPrints(['if (a)', 'console.log(1)'], 'js').place).toBe(true)
    expect(newPrints(['[1].forEach(x => console.log(x))'], 'js').place).toBe(true)
    expect(newPrints(['function f() {', 'console.log(1)', '}'], 'js').place).toBe(true)
    expect(newPrints(['console.log(a, b)'], 'js').form).toBe(true)
    expect(newPrints(['console.log(f(a, b))'], 'js').form).toBe(false)
    expect(newPrints(['console.error(a)'], 'js').form).toBe(true)
    expect(newPrints(["console.log('a\\nb')"], 'js').form).toBe(true)
    expect(newPrints(['for x in a:', '    print(x)'], 'py').place).toBe(true)
    expect(newPrints(['def f():', '    print(1)'], 'py').place).toBe(true)
    expect(newPrints(['if a: print(1)'], 'py').place).toBe(true)
    expect(newPrints(["print(a, end='')"], 'py').form).toBe(true)
    expect(newPrints(['print(a)', 'print(b)'], 'py')).toEqual({ count: 2, place: false, form: false })
  })

  test('output form: closed values only; joined, prose, quoted, bracketed, error and made-up words refused', () => {
    expect(newOutput('70\n85\n2', 'console.log(70)\nconsole.log(85)\nconsole.log(2)', 'js')).toEqual(['70', '85', '2'])
    expect(newOutput('70 / 85 / 2', 'console.log(70)', 'js')).toBeUndefined()
    expect(newOutput("'abc'", "console.log('abc')", 'js')).toBeUndefined()
    expect(newOutput('첫 줄은 5입니다', 'console.log(5)', 'js')).toBeUndefined()
    expect(newOutput('[1, 2]', 'print([1, 2])', 'py')).toBeUndefined()
    expect(newOutput('[***]', "s = '[' + '*' * 3 + ']'\nprint(s)", 'py')).toEqual(['[***]'])
    expect(newOutput('TypeError', 'console.log(a.b.c)', 'js')).toBeUndefined()
    expect(newOutput('xx42', "console.log(String(42).padStart(4, 'x'))", 'js')).toEqual(['xx42'])
    expect(newOutput('elop', "s = 'pool'\nprint(s[::-1])", 'py')).toBeUndefined()
    expect(newOutput('True', 'print(1 == 1)', 'py')).toEqual(['True'])
    expect(newOutput('합격', "r = '합격'\nprint(r)", 'py')).toEqual(['합격'])
  })

  test('newItem composes the question, fence, hint and answer; refuses count mismatch, mine, comments, sets, long code', () => {
    const code = 'const cup = [3, 1, 2]\nconst order = cup.sort()\nconsole.log(order[0])'
    const ok = newItem(parts(js(code), '1', 'const order = cup.sort()'), 1, pick())
    expect('item' in ok && ok.item).toEqual({ key: 'k1', name: '개념', question: `${NEW_LEAD}\n\`\`\`js\n${code}\n\`\`\``, hint: '`const order = cup.sort()` 줄에서 무슨 일이 일어나는지부터 보세요.', answer: '1', kind: 'predict', rung: 'new' })
    const plain = newItem(parts(js(code), '1', 'console.log(order[0])'), 1, pick())
    expect('item' in plain && plain.item.hint).toBe(NEW_HINT_PLAIN)
    expect(newItem(parts(js(code), '1\n2'), 1, pick())).toEqual({ reason: 'count' })
    expect(newItem(parts(js(code + ' // first'), '1'), 1, pick())).toMatchObject({ item: { answer: '1' } })
    expect(newItem(parts(js('/* x */\n' + code), '1'), 1, pick())).toEqual({ reason: 'comment' })
    expect(newItem(parts(py('a = {1, 2}\nprint(len(a))'), '2'), 1, pick({ lang: 'py' }))).toEqual({ reason: 'forbidden' })
    expect(newItem(parts(py('a = {1: 2}\nprint(len(a))'), '1'), 1, pick({ lang: 'py' }))).toMatchObject({ item: { answer: '1' } })
    expect(newItem(parts(js(Array.from({ length: 8 }, (_, i) => `const a${i} = ${i}`).join('\n') + '\nconsole.log(a1)'), '1'), 1, pick())).toEqual({ reason: 'long' })
    expect(newItem(parts(js(code), '1'), 1, pick({ seen: code }))).toEqual({ reason: 'mine' })
    expect(newItem(parts(js('const t = Date.now()\nconsole.log(1)'), '1'), 1, pick())).toEqual({ reason: 'forbidden' })
  })

  test('parseQuiz reads K · L · A last-wins for a new slot, and A only up to a blank line', () => {
    const p1 = pick({ key: 'a', name: 'a' })
    const text = `K1:\n${js('const x = 1\nconsole.log(x)')}\nL1: const x = 1\nA1:\n2\n\n고쳐 씁니다.\nK1:\n${js('const x = 2\nconsole.log(x)')}\nL1: const x = 2\nA1:\n2\n\n(메모)`
    expect(parseQuiz(text, [p1])).toMatchObject([{ key: 'a', answer: '2', rung: 'new', kind: 'predict' }])
  })

  test('isLikeMine: (가) same text, (나) half the lines, (다) renamed or one literal different', () => {
    const mine = 'const fns = []\nfor (var i = 0; i < 3; i++) fns.push(() => i * 10)\nconsole.log(fns[0]())'
    expect(isLikeMine(mine.replace(/ /g, ''), mine, 'js')).toBe(true)
    expect(isLikeMine('const fns = []\nconsole.log(fns.length)', mine, 'js')).toBe(true)
    expect(isLikeMine(mine.replace(/fns/g, 'arr'), mine, 'js')).toBe(true)
    expect(isLikeMine(mine.replace('10', '20'), mine, 'js')).toBe(true)
    expect(isLikeMine('const bus = [1, 2]\nconsole.log(bus.length)', mine, 'js')).toBe(false)
  })
})

describe('1.12.0 G3 synthesis: grading', () => {
  test('localRight takes the common right shapes and never a value different, missing, added or reordered', () => {
    expect(localRight('3, 5', '3\n5')).toBe(true)
    expect(localRight('3\n5', '3\n5')).toBe(true)
    expect(localRight('3 나오고 다음 줄에 5', '3\n5')).toBe(true)
    expect(localRight('첫 줄 3 둘째 줄 5', '3\n5')).toBe(true)
    expect(localRight('True요', 'True')).toBe(true)
    expect(localRight("'abc'", 'abc')).toBe(true)
    expect(localRight('true', 'True')).toBe(false)
    expect(localRight('3이 아니고 5', '5')).toBe(false)
    expect(localRight('3?', '3')).toBe(false)
    expect(localRight('모르겠어요', '3')).toBe(false)
    const answers = ['3\n5\n7', 'True\nFalse', 'abc\n10', '007\nxx42']
    for (const answer of answers) {
      const want = answer.split('\n')
      const wrongs = [
        ...want.map((_, i) => want.map((w, j) => (j === i ? `${w}0` : w))),
        [...want].reverse(),
        want.slice(1),
        [...want, '9'],
      ].filter(w => w.join('\n') !== answer)
      for (const w of wrongs) for (const shape of [w.join(', '), w.join('\n'), w.join(' 나오고 '), w.join(' 그리고 ')]) expect(localRight(shape, answer)).toBe(false)
    }
  })

  test('valuesVerdict and parseCheck exact: copied values decide; 값 더 or 없음 means wrong; a missing 값 line is unreadable', () => {
    expect(valuesVerdict(new Map([[1, '3'], [2, '5']]), undefined, '3\n5')).toBe('right')
    expect(valuesVerdict(new Map([[1, '3'], [2, '5']]), '7', '3\n5')).toBe('wrong')
    expect(valuesVerdict(new Map([[1, '3'], [2, '5']]), '없음', '3\n5')).toBe('right')
    expect(valuesVerdict(new Map([[1, '3'], [2, NEW_NOT_SAID]]), undefined, '3\n5')).toBe('wrong')
    expect(valuesVerdict(new Map([[1, '3'], [2, '없음']]), undefined, '3\n5')).toBe('wrong')
    expect(valuesVerdict(new Map([[1, '3']]), undefined, '3\n5')).toBeUndefined()
    expect(parseCheck('값 1: 3\n값 2: 6\n피드백: f\n되묻기: n', { exact: '3\n5' })).toMatchObject({ verdict: 'wrong', feedback: 'f', nudge: 'n' })
    expect(parseCheck('판정: 맞음\n피드백: f', { exact: '3\n5' })).toBeUndefined()
    expect(parseCheck('값 1: 3\n값 2: 5\n값 더: 9\n피드백: f', { exact: '3\n5' })!.verdict).toBe('wrong')
  })
})

describe('1.12.0 G3 final: the design review\'s fixes', () => {
  const m = (o: Record<number, string>) => new Map(Object.entries(o).map(([k, v]) => [Number(k), v]))

  test('a printed 없음, - or None is a value like any: copied and said, right; not said (NEW_NOT_SAID or never written), wrong', () => {
    expect(valuesVerdict(m({ 1: '없음' }), undefined, '없음', '없음이 나와요')).toBe('right')
    expect(valuesVerdict(m({ 1: '없음', 2: '3' }), undefined, '없음\n3', '없음, 3 키가 없어서요')).toBe('right')
    expect(valuesVerdict(m({ 1: '-' }), undefined, '-', '-요')).toBe('right')
    expect(newOutput('-\ntrue', "const mark = '-'\nconsole.log(mark)\nconsole.log(true)", 'js')).toBeUndefined()
    expect(newOutput('---\ntrue', "const mark = '-'.repeat(3)\nconsole.log(mark)\nconsole.log(true)", 'js')).toEqual(['---', 'true'])
    expect(valuesVerdict(m({ 1: 'None' }), undefined, 'None', 'None')).toBe('right')
    expect(valuesVerdict(m({ 1: NEW_NOT_SAID, 2: '3' }), undefined, '없음\n3', '3')).toBe('wrong')
    expect(valuesVerdict(m({ 1: '없음', 2: '3' }), undefined, '없음\n3', '3 나와요')).toBe('wrong')
    expect(newOutput(NEW_NOT_SAID, `print('${NEW_NOT_SAID}')`, 'py')).toBeUndefined()
    expect(newRead(2)).toContain(NEW_NOT_SAID)
    expect(newValueLines(2).join('\n')).toContain(NEW_NOT_SAID)
    expect(newRead(2)).not.toMatch(/없음이라고/)
  })

  test('a copied value counts only where the learner wrote it, each at a place of its own: the model answer copied in is wrong', () => {
    expect(valuesVerdict(m({ 1: '40', 2: '40' }), undefined, '40\n40', '10, 40')).toBe('wrong')
    expect(valuesVerdict(m({ 1: '0' }), undefined, '0', '10')).toBe('wrong')
    expect(valuesVerdict(m({ 1: '3' }), undefined, '3', '3.5요')).toBe('wrong')
    expect(valuesVerdict(m({ 1: '4', 2: '40' }), undefined, '4\n40', '4, 40')).toBe('right')
    expect(valuesVerdict(m({ 1: '`40`' }), undefined, '40', '40이요')).toBe('right')
    expect(parseCheck('값 1: 40\n값 2: 40\n피드백: f', { exact: '40\n40', mine: '10이랑 40' })!.verdict).toBe('wrong')
    expect(parseCheck('값 1: 10\n값 2: 40\n피드백: f', { exact: '10\n40', mine: '10이랑 40' })!.verdict).toBe('right')
  })

  test('quotes: a pair around the learner\'s value is dropped only where the printed line has none; quote kinds alike', () => {
    expect(isSameValue('"abc"', 'abc')).toBe(true)
    expect(isSameValue('abc', "'abc'")).toBe(false)
    expect(isSameValue('"abc"', "'abc'")).toBe(true)
    expect(localRight('abc', "'abc'")).toBe(false)
    expect(localRight("'Kim' 나와요", "'Kim'")).toBe(true)
    expect(valuesVerdict(m({ 1: 'abc' }), undefined, "'abc'", 'abc')).toBe('wrong')
    expect(valuesVerdict(m({ 1: '"abc"' }), undefined, 'abc', '"abc"')).toBe('right')
  })

  test('string letters and spaces: slicing, reversing and padding concepts are not asked new; spaced output refused', () => {
    expect(isStringShape('문자열 뒤집기입니다.', undefined)).toBe(true)
    expect(isNewInScope('a.py', '앞 세 글자만 잘라 쓰기 — `name[:3]`', undefined)).toBe(false)
    expect(isNewInScope('a.py', '간격을 음수로 주면 거꾸로 셉니다. — `for floor in range(10, 0, -4):`', 'for floor in range(10, 0, -4):\n    print(floor)')).toBe(true)
    expect(isNewInScope('a.js', '배열 reverse는 원본도 바꿉니다. — `const back = nums.reverse()`', 'const back = nums.reverse()')).toBe(true)
    expect(isNewInScope('a.js', '자릿수 맞추기', 'String(n).padStart(3, "0")')).toBe(false)
    expect(isNewInScope('a.py', '오른쪽 정렬', 'print(s.rjust(5))')).toBe(false)
    expect(isNewInScope('a.js', '배열 map입니다.', 'const a = [1].map(x => x)')).toBe(true)
    // Hangul is read by syllable (a check of form): a reversed Hangul word is kept out by the scope, not the reader.
    expect(isNewInScope('a.py', '문자열 거꾸로 — `print(s[::-1])`', undefined)).toBe(false)
    expect(newOutput('사코기', "zoo = ['사자', '코끼리', '기린']\nprint(zoo[0][0] + zoo[1][0] + zoo[2][0])", 'py')).toEqual(['사코기'])
    expect(newItem(parts(py("lap = '  km  '\nprint(len(lap.strip()))"), '2'), 1, pick({ lang: 'py' }))).toMatchObject({ item: { answer: '2' } })
    expect(newItem(parts(py("lap = 'a  b'\nprint(lap)"), 'a  b'), 1, pick({ lang: 'py' }))).toEqual({ reason: 'spacing' })
    expect(newOutput('민수님', "name = '민수'\nprint(name + '님')", 'py')).toEqual(['민수님'])
    expect(newOutput('hahaha', "print('ha' * 3)", 'py')).toEqual(['hahaha'])
    expect(newOutput('a  b', "print('a' + '  ' + 'b')", 'py')).toBeUndefined()
    expect(newItem(parts(py("cup = '5'\nprint(cup.rjust(4))"), '5'), 1, pick({ lang: 'py' }))).toEqual({ reason: 'spacing' })
    expect(newItem(parts(py("cup = 5\nprint(f'{cup:>4}')"), '5'), 1, pick({ lang: 'py' }))).toEqual({ reason: 'spacing' })
    expect(newItem(parts(py("cup = 5\nprint(' ' * 3 + str(cup))"), '5'), 1, pick({ lang: 'py' }))).toEqual({ reason: 'spacing' })
    expect(newItem(parts(py("cup = 2.5\nprint(f'{cup:.1f}')"), '2.5'), 1, pick({ lang: 'py' }))).toMatchObject({ item: { answer: '2.5' } })
    expect(newItem(parts(py("cup = ['a', 'b']\nprint(', '.join(cup))"), 'a, b'), 1, pick({ lang: 'py' }))).toMatchObject({ item: { answer: 'a, b' } })
  })

  test('a keyword argument or a spread in a print is one call printing past one value; a same-line body above a print is no body of it', () => {
    expect(newPrints(["print(end='x')", 'print(3)'], 'py').form).toBe(true)
    expect(newPrints(['print(*xs)'], 'py').form).toBe(true)
    expect(newPrints(['console.log(...a)'], 'js').form).toBe(true)
    expect(newPrints(['print(a == b)', 'print(a <= b)'], 'py').form).toBe(false)
    expect(newPrints(['console.log(a !== b)', 'console.log(xs.map(x => x * 2).length)'], 'js').form).toBe(false)
    expect(newPrints(['let s = 0', 'for (const x of [1, 2]) s += x', 'console.log(s)'], 'js')).toEqual({ count: 1, place: false, form: false })
    expect(newPrints(['if x: y = 1', 'print(y)'], 'py').place).toBe(false)
    expect(newPrints(['} else if (a)', 'console.log(1)'], 'js').place).toBe(true)
  })

  test('the hint quotes a line where something happens, short enough for the pane; a plain value line gets the plain hint', () => {
    const code = 'const level = 0\nconst score = [3, 1].map(x => x * 2)\nconsole.log(level)\nconsole.log(score[0])'
    const plain = newItem(parts(js(code), '0\n6', 'const level = 0'), 1, pick())
    expect('item' in plain && plain.item.hint).toBe(NEW_HINT_PLAIN)
    const acts = newItem(parts(js(code), '0\n6', 'const score = [3, 1].map(x => x * 2)'), 1, pick())
    expect('item' in acts && acts.item.hint).toBe('`const score = [3, 1].map(x => x * 2)` 줄에서 무슨 일이 일어나는지부터 보세요.')
    const longLine = 'const score = [3, 1, 4, 1, 5, 9, 2, 6].map(x => x * 2 + 1)'
    const long = newItem(parts(js(`${longLine}\nconsole.log(score[0])`), '7', longLine), 1, pick())
    expect('item' in long && long.item.hint).toBe(NEW_HINT_PLAIN)
  })

  test('a printed line with a comma: the question does not offer joining lines with commas; the answer shows in a block either way', () => {
    const made = newItem(parts(py("cup = ['a', 'b']\nprint(', '.join(cup))\nprint(len(cup))"), 'a, b\n2'), 1, pick({ lang: 'py' }))
    expect('item' in made && made.item.question.startsWith(NEW_LEAD_LINES)).toBe(true)
    expect('item' in made && answerShown(made.item)).toBe('```text\na, b\n2\n```')
    expect(NEW_LEAD_LINES).not.toContain('쉼표')
    const plain = newItem(parts(js('const a = 1\nconsole.log(a)'), '1'), 1, pick())
    expect('item' in plain && plain.item.question.startsWith(NEW_LEAD)).toBe(true)
  })

  test('the exact grade prompt: value lines with NEW_NOT_SAID, quotes kept as written; no verdict line, no 거의; the first try\'s values not shown', () => {
    const item = { key: 'k', name: '개념', question: `${NEW_LEAD}\n\`\`\`js\nconsole.log(1)\n\`\`\``, hint: NEW_HINT_PLAIN, answer: '1', kind: 'predict' as const, rung: 'new' as const }
    const first = checkPrompt(item, '2', 'beginner', undefined, undefined, { exact: true })
    expect(first).toContain(`값 1: (학습자가 1줄에 찍힌다고 말한 값만. 말하지 않았으면 ${NEW_NOT_SAID})`)
    expect(first).toContain('값을 감싼 따옴표는 학습자가 쓴 대로 둔다')
    expect(first).not.toMatch(/판정:|거의/)
    const again = checkPrompt(item, '1', 'beginner', { mine: '2', verdict: 'wrong', feedback: '2라면…', nudge: '다시 보세요' }, undefined, { exact: true })
    expect(again).toContain('첫 답: (틀렸다. 이번 답의 값을 옮길 때 보지 않는다)')
    expect(again).not.toContain('2라면')
    for (const text of [first, again]) expect(text).not.toMatch(/한 줄씩|따라간|과정|R1:/)
  })
})
