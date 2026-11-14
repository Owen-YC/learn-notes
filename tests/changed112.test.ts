// 1.12.0 (G2) design pilot: the plugin changes one place, the model picks it and says the outputs (C · O · N).
import { describe, expect, test } from 'claude-code/testing'
import {
  answerShown,
  CHANGED_HINT,
  CHANGED_LEAD,
  changeOf,
  changeSites,
  changedItem,
  codeFor,
  creationHunk,
  isChangedShaped,
  isWholeShown,
  outputLines,
  parseQuiz,
  quizPrompt,
  rungOf,
  type QuizPick,
} from '../hooks/notes'

const CODE = [
  'const prices = [1200, 800, 3000]',
  'const limit = 1000',
  'let count = 0',
  'for (const p of prices) {',
  '  if (p > limit) count += 1',
  '}',
  "console.log('비싼 것', count)",
  'console.log(prices.some(p => p < 900))',
].join('\n')
const BLURB = '조건에 맞는 개수를 셉니다 — `if (p > limit) count += 1`'
const created = (text: string, file = 'a.js') => changeOf({ path: `/proj/${file}`, root: '/proj', tool: 'Write', kind: 'create', hunks: [creationHunk(`${text}\n`)] })
const pickOf = (text = CODE, file = 'a.js', blurb = BLURB): QuizPick => {
  const change = created(text, file)
  const shown = codeFor(change, blurb)!
  return { key: 'c:k', name: 'k', count: 3, firstAt: 0, lastAt: 0, blurb, files: [], step: 2, noteId: 'n1', code: { file, text: shown, ...(isWholeShown(change, shown) ? { isWhole: true as const } : {}) } } as QuizPick
}
const rung = (p: QuizPick) => rungOf(p, { code: p.code!, isAsking: false, isTeam: false, isDue: true }, Infinity, { changedStep: 2, workedAfter: Infinity, workedPlainAfter: Infinity })
const parts = (o: Record<string, string>) => new Map(Object.entries(o).map(([k, v]) => [k, v.split('\n')]))
const GOOD = { C1: '1c 3000\nconst limit = 3000', O1: '비싼 것 2\ntrue', N1: '비싼 것 0\ntrue' }

describe('1.12.0 (G2): 비슷한 코드 made by the plugin', () => {
  test('scope: a js or py file written whole, 1-4 prints, no export, no while, three places one not a string; else 내 코드', () => {
    expect(rung(pickOf())).toBe('changed')
    expect(rung(pickOf(CODE.replace('const limit = 1000', 'let limit = 1000\nwhile (limit > 5000) limit -= 1')))).toBe('mine')
    expect(rung(pickOf(CODE, 'a.ts'))).toBe('mine')
    expect(rung(pickOf(`${CODE}\nexport const x = 1`))).toBe('mine')
    expect(rung(pickOf(CODE.replace(/console\.log/g, 'void')))).toBe('mine')
    expect(rung(pickOf("const names = ['a', 'b', 'c']\nconsole.log(names.length)"))).toBe('mine')
    const edit = { ...pickOf(), code: { ...pickOf().code!, isWhole: undefined } } as unknown as QuizPick
    expect(rung(edit)).toBe('mine')
    expect(isChangedShaped({ file: 'a.js', text: CODE, isWhole: true }, BLURB)).toBe(true)
  })

  test('places: never on a print call (its lines to its close), a comment or a for (;;) header; at most six in the code order', () => {
    const text = 'let n = 2\nfor (let i = 0; i < 3; i++) {\n  n += 1 // 1\n}\nconsole.log(\n  n > 4,\n  5\n)'
    const sites = changeSites(text, 'b.js', '— `n += 1`')
    expect(sites.map(s => s.line)).toEqual([0, 2])
    expect(sites.every(s => s.line !== 5 && s.line !== 6)).toBe(true)
    const many = changeSites(CODE, 'a.js', BLURB)
    expect(many.length).toBe(6)
    expect([...many].sort((a, b) => a.line - b.line || a.at - b.at)).toEqual(many)
  })

  test('changedItem: the plugin\'s question over the changed code, its hint by line, N as the answer; C and O kept nowhere', () => {
    const made = changedItem(parts(GOOD), 1, pickOf())
    expect('item' in made && made.item).toMatchObject({ kind: 'predict', rung: 'changed', answer: '비싼 것 0\ntrue', hint: CHANGED_HINT(2, 'const limit = 3000') })
    const item = (made as { item: { question: string } }).item
    expect(item.question.startsWith(`${CHANGED_LEAD}\n\`\`\`js\n`)).toBe(true)
    expect(item.question).toContain('const limit = 3000')
    expect(JSON.stringify(item)).not.toContain('1b')
  })

  test('changedItem refuses: missing, grammar, other slot, value, echo, O/N form, count, same', () => {
    const p = pickOf()
    const why = (o: Record<string, string>) => {
      const r = changedItem(parts(o), 1, p)
      return 'reason' in r ? r.reason : 'ok'
    }
    expect(why({ C1: GOOD.C1, O1: GOOD.O1 })).toBe('missing')
    expect(why({ ...GOOD, C1: '바꿀 곳: 없음' })).toBe('grammar')
    expect(why({ ...GOOD, C1: '2c 3000\nconst limit = 3000' })).toBe('other-slot')
    expect(why({ ...GOOD, C1: '1c abc\nconst limit = abc' })).toBe('value')
    expect(why({ ...GOOD, C1: '1c 3000\nconst limit = 2000' })).toBe('echo')
    expect(why({ ...GOOD, O1: '0개가 출력됩니다.' })).toBe('O-form')
    expect(why({ ...GOOD, N1: 'Wait, this choice is not allowed\n비싼 것 0' })).toBe('N-form')
    expect(why({ ...GOOD, N1: '비싼 것 0' })).toBe('count')
    expect(why({ ...GOOD, N1: GOOD.O1 })).toBe('same')
    // The letter names another place than the line echoed: read by the line.
    expect(why({ ...GOOD, C1: '1a 3000\nconst limit = 3000' })).toBe('ok')
    expect(why({ ...GOOD, C1: "1b의 1000을 3000으로\nlimit = 3000;" })).toBe('ok')
  })

  test('outputs: an error only last and by its name; words only from the code', () => {
    expect(outputLines('비싼 것 0\nTypeError: x is not a function', CODE, 'js')).toEqual(['비싼 것 0', 'TypeError'])
    expect(outputLines('TypeError\n비싼 것 0', CODE, 'js')).toBeUndefined()
    expect(outputLines('비싼 것 0\nKeyError', CODE, 'js')).toBeUndefined()
    expect(outputLines('Traceback (most recent call last):\nKeyError', CODE, 'py')).toBeUndefined()
    expect(outputLines('안녕하세요, 민지님', 'console.log("안녕하세요, " + n + "님")\nconst n = "민지"', 'js')).toEqual(['안녕하세요, 민지님'])
  })

  test('parseQuiz: a C, O or N written again is read by its last text; the quiz prompt has no R line and its format per number', () => {
    const p = { ...pickOf(), rung: 'changed' as const }
    const reply = `C1: 1b 2000\nconst limit = 2000\nO1:\n비싼 것 2\ntrue\nN1:\n비싼 것 2\ntrue\n\nC1: 1c 3000\nconst limit = 3000\nO1:\n비싼 것 2\ntrue\nN1:\n비싼 것 0\ntrue`
    expect(parseQuiz(reply, [p])[0]).toMatchObject({ answer: '비싼 것 0\ntrue', rung: 'changed' })
    const prompt = quizPrompt([p], 'beginner')
    expect(prompt).not.toContain('R1:')
    expect(prompt).toContain('   바꿀 수 있는 곳 (줄은 위 코드의 첫 줄을 1로 셈):\n   1a: ')
    expect(prompt).toContain('\nC1: (고른 곳 이름, 한 칸 띄우고 새 값만. 예: 1b 20)\n(그 값으로 바꾼 줄 통째로)\nO1:\n(원래 코드가 찍는 줄들)\nN1:\n(바꾼 코드가 찍는 줄들)')
    expect(prompt).not.toContain('T1:')
  })

  test('the echo names one place: two lines alike give no place; the named place\'s line as it was names it', () => {
    const code = "def grade(score):\n    if score >= 90:\n        return 'A'\n    if score >= 80:\n        return 'B'\n    return 'C'\n\nfor s in [95, 82, 71]:\n    print(s, grade(s))"
    const p = pickOf(code, 'g.py', '점수로 등급을 냅니다 — `if score >= 90:`')
    const sites = changeSites(p.code!.text, 'g.py', p.blurb)
    // 90 → 70 and 80 → 70 echo the same line: neither number is a place; the two signs read apart are.
    expect(sites.some(s => s.token === '90' || s.token === '80')).toBe(false)
    const cmp = 'abcdef'[sites.findIndex(s => s.token === '>=')]
    const r = (c: string, nOut: string) => changedItem(parts({ C1: c, O1: '95 A\n82 B\n71 C', N1: nOut }), 1, p)
    expect(r(`1${cmp} >\n    if score > 90:`, '95 A\n82 B\n71 C')).toEqual({ reason: 'same' })
    expect('item' in r(`1${cmp} <\n    if score < 90:`, '95 B\n82 A\n71 A')).toBe(true)
  })

  test('review fixes: N not lines of O in a row, at most four lines; numbers bounded, strings not empty', () => {
    const p = pickOf()
    const why = (o: Record<string, string>) => {
      const r = changedItem(parts({ ...GOOD, ...o }), 1, p)
      return 'reason' in r ? r.reason : 'ok'
    }
    const loop = pickOf("const xs = [3, 8, 12]\nfor (const x of xs) {\n  if (x > 5) console.log('큰 수', x)\n}", 'l.js', '— `if (x > 5) console.log')
    const loopWhy = (c: string, o: string, n: string) => {
      const r = changedItem(parts({ C1: c, O1: o, N1: n }), 1, loop)
      return 'reason' in r ? r.reason : 'ok'
    }
    const five = 'abcdef'[changeSites(loop.code!.text, 'l.js', loop.blurb).findIndex(s => s.token === '5')]
    expect(loopWhy(`1${five} 10\nif (x > 10) console.log('큰 수', x)`, '큰 수 8\n큰 수 12', '큰 수 12')).toBe('subset')
    expect(loopWhy(`1${five} 0\nif (x > 0) console.log('큰 수', x)`, '큰 수 8\n큰 수 12', '큰 수 3\n큰 수 8\n큰 수 12')).toBe('ok')
    expect(loopWhy(`1${five} 0\nif (x > 0) console.log('큰 수', x)`, '큰 수 8\n큰 수 12', '큰 수 3\n큰 수 8\n큰 수 12\n큰 수 12\n큰 수 12')).toBe('N-lines')
    expect(loopWhy(`1${five} 11\nif (x > 11) console.log('큰 수', x)`, '큰 수 8\n큰 수 12', '큰 수 12')).toBe('subset')
    expect(loopWhy(`1${five} 99\nif (x > 99) console.log('큰 수', x)`, '큰 수 8\n큰 수 12', '(빈 줄)')).toBe('value')
    // A string becomes another of one character at least: an empty one prints what an answer line cannot show.
    const word = 'abcdef'[changeSites(loop.code!.text, 'l.js', loop.blurb).findIndex(s => s.token === "'큰 수'")]
    expect(loopWhy(`1${word} ''\nif (x > 5) console.log('', x)`, '큰 수 8\n큰 수 12', '8\n12')).toBe('value')
    expect(loopWhy(`1${word} '수'\nif (x > 5) console.log('수', x)`, '큰 수 8\n큰 수 12', '수 8\n수 12')).toBe('ok')
    expect(why({ C1: "1c 3000\nconst limit = 3000", N1: '비싼 것 0\ntrue.' })).toBe('ok')
  })

  test('review fixes: scope out a counted for, a loop over a list it grows, an empty print, an escape, a Python set; two lines alike', () => {
    const base = "const xs = [1, 2, 3]\nconst limit = 2\nlet n = 0\n"
    expect(rung(pickOf(`${base}for (let i = 0; i < xs.length; i += 1) n += xs[i] > limit ? 1 : 0\nconsole.log(n)`))).toBe('mine')
    expect(rung(pickOf(`${base}for (const x of xs) {\n  if (x > limit) xs.push(x)\n}\nconsole.log(xs.length > 3)`))).toBe('mine')
    expect(rung(pickOf(`${base}for (const x of xs) {\n  if (x > limit) n += 1\n}\nconsole.log()\nconsole.log(n === 1)`))).toBe('mine')
    expect(rung(pickOf(`${base}for (const x of xs) {\n  if (x > limit) n += 1\n}\nconsole.log('a\\tb', n === 1)`))).toBe('mine')
    expect(rung(pickOf(`${base}for (const x of xs) {\n  if (x > limit) n += 1\n}\nconsole.log(n === 1)`))).toBe('changed')
    const py = "items = [1, 2, 3]\nlimit = 2\nfor x in items:\n    if x > limit:\n        items.append(x)\nprint(len(items) > 3)"
    expect(rung(pickOf(py, 'p.py', '— `if x > limit:`'))).toBe('mine')
    expect(rung(pickOf("tags = {'a', 'b'}\nlimit = 2\nok = len(tags) >= limit\nprint(ok, 'b' in tags)", 'p.py', '— `ok = len(tags) >= limit`'))).toBe('mine')
    expect(rung(pickOf("ages = {'a': 3, 'b': 5}\nlimit = 2\nok = len(ages) >= limit\nprint(ok, ages['b'] > 4)", 'p.py', '— `ok = len(ages) >= limit`'))).toBe('changed')
  })

  test('review fixes: outputs node spreads over lines, typeof and type words; the answer shown in a code block', () => {
    expect(outputLines('[ 1, 2, 3, 4, 5, 6, 7 ]', 'const xs = [1, 2, 3, 4, 5, 6, 7]\nconsole.log(xs)', 'js')).toBeUndefined()
    expect(outputLines('[ 1, 2, 3 ]', 'const xs = [1, 2, 3]\nconsole.log(xs)', 'js')).toEqual(['[ 1, 2, 3 ]'])
    expect(outputLines('number', 'console.log(typeof 5)', 'js')).toEqual(['number'])
    expect(outputLines("<class 'int'>", 'print(type(5))', 'py')).toEqual(["<class 'int'>"])
    const item = { question: `${CHANGED_LEAD}\n\`\`\`js\nx\n\`\`\``, answer: '***', rung: 'changed' as const, kind: 'predict' as const }
    expect(answerShown(item)).toBe('\`\`\`\n***\n\`\`\`')
    expect(answerShown({ ...item, rung: 'mine' })).toBe('***')
    expect(CHANGED_HINT(4, '  if (x > 10) n += 1')).toBe('바뀐 곳은 4번째 줄 \`if (x > 10) n += 1\`입니다. 그 줄 때문에 달라지는 값부터 보세요.')
  })
})
