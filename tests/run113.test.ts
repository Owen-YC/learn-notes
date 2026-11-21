// 1.13.0 (G2-RUN) design: code changed the plugin ran itself (the run route, IS_CHANGED_RUN). Haiku's route untouched.
import { describe, expect, test } from 'claude-code/testing'
import {
  CHANGED_HINT,
  CHANGED_LEAD,
  CHANGED_RUN_ASK,
  CHANGED_RUN_MS,
  CHANGED_RUN_TRIES,
  IS_CHANGED_RUN,
  MODEL_SWITCHES,
  SWITCHES_OFF,
  changeOf,
  changeSites,
  changedItem,
  changedRunFor,
  changedRunItem,
  codeFor,
  creationHunk,
  isCertified,
  isWholeShown,
  parseQuiz,
  quizPrompt,
  rungOf,
  type QuizPick,
} from '../hooks/notes'
import { newRun } from '../hooks/newrun'

const CODE = [
  'const scores = [72, 85, 91]',
  'let total = 0',
  'for (const s of scores) {',
  '  if (s >= 80) total += s',
  '}',
  'const avg = Math.round(total / 2)',
  "console.log('합계:', total)",
  "console.log('평균 ' + avg)",
].join('\n')
const BLURB = '80점 이상만 더합니다 — `if (s >= 80) total += s`'
const created = (text: string, file = 'a.js') => changeOf({ path: `/proj/${file}`, root: '/proj', tool: 'Write', kind: 'create', hunks: [creationHunk(`${text}\n`)] })
const pickOf = (text = CODE, file = 'a.js', blurb = BLURB, isRun = true): QuizPick => {
  const change = created(text, file)
  const shown = codeFor(change, blurb)!
  const isWhole = isWholeShown(change, shown)
  const run = isRun && isWhole ? changedRunFor(shown, file, blurb) : undefined
  return { key: 'c:k', name: 'k', count: 3, firstAt: 0, lastAt: 0, blurb, files: [], step: 2, noteId: 'n1', code: { file, text: shown, ...(isWhole ? { isWhole: true as const } : {}), ...(run ? { run } : {}) } } as QuizPick
}
const rung = (p: QuizPick, changedRun: boolean) => rungOf(p, { code: p.code!, isAsking: false, isTeam: false, isDue: true }, Infinity, { changedStep: 2, workedAfter: Infinity, workedPlainAfter: Infinity, changedRun })
const parts = (o: Record<string, string>) => new Map(Object.entries(o).map(([k, v]) => [k, v.split('\n')]))

describe('1.13.0 (G2-RUN): code changed the plugin ran itself', () => {
  test('off everywhere it ships: the constant, every row, SWITCHES_OFF', () => {
    expect(IS_CHANGED_RUN).toBe(false)
    expect(SWITCHES_OFF.isChangedRun).toBe(false)
    expect(MODEL_SWITCHES.haiku.isChangedRun).toBe(false)
    expect(MODEL_SWITCHES.sonnet.isChangedRun).toBe(false)
  })

  test('printArgs: off by default (G3 exactly); on, one to four primitive values joined by a space, a format or a container refused', () => {
    expect(newRun('console.log("a", 1)', 'js')).toEqual({ refuse: 'print-value', why: 'print of several values' })
    expect(newRun('console.log("a", 1, -0, null)', 'js', { printArgs: true })).toEqual({ lines: ['a 1 -0 null'] })
    expect(newRun('console.log("%d개", 1)', 'js', { printArgs: true })).toMatchObject({ refuse: 'print-value' })
    expect(newRun('console.log("a", [1])', 'js', { printArgs: true })).toMatchObject({ refuse: 'print-value' })
    expect(newRun('console.log(1, 2, 3, 4, 5)', 'js', { printArgs: true })).toMatchObject({ refuse: 'print-value' })
    expect(newRun('print("x", 1.0, True, None)', 'py', { printArgs: true })).toEqual({ lines: ['x 1.0 True None'] })
    expect(newRun('print("x", [1])', 'py', { printArgs: true })).toMatchObject({ refuse: 'print-value' })
    expect(newRun('print("x", 1, sep="")', 'py', { printArgs: true })).toMatchObject({ refuse: 'grammar' })
    // The flag does not leak into the next run.
    expect(newRun('print("x", 1)', 'py')).toMatchObject({ refuse: 'print-value' })
  })

  test('isCertified: the stance\'s 8 (a) (b) (c) under clause 6 and a looser reading; 1-4 lines, none blank', () => {
    const O = ['합계: 176', '평균 88']
    expect(isCertified(['합계: 177', '평균 89'], O)).toBe(true)
    expect(isCertified(['합계: 176', '평균 88'], O)).toBe(false)
    expect(isCertified(['평균 88'], O)).toBe(false)
    expect(isCertified(['합계:176'], O)).toBe(false)
    expect(isCertified(["'합계: 176'", '평균 0'], O)).toBe(true)
    expect(isCertified(['합계: 176', '평균 88', 'x'], O)).toBe(true)
    expect(isCertified(['TRUE'], ['true', '1'])).toBe(false)
    // The looser reading too: case, spaces and quotes alone do not make a line new (outputSame keeps these apart).
    expect(isCertified(['helloworld'], ['Hello World'])).toBe(false)
    expect(isCertified(["'합계'176"], ['합계 176'])).toBe(false)
    expect(isCertified([], O)).toBe(false)
    expect(isCertified(['a', '', 'b'], O)).toBe(false)
    expect(isCertified(['1', '2', '3', '4', '5'], O)).toBe(false)
  })

  test('changedRunFor: the learner\'s run, then each place with its fixed values in order; six at most in the code\'s order; a throwing change never listed', () => {
    const run = changedRunFor(CODE, 'a.js', BLURB)!
    expect(run.out).toEqual(['합계: 176', '평균 88'])
    expect(run.certs.length).toBe(6)
    expect(run.certs.map(c => [c.site.token, c.value])).toEqual([['72', '144'], ['85', '86'], ['0', '1'], ['>=', '<'], ['80', '160'], ['2', '3']])
    for (const c of run.certs) expect(newRun(c.changed, 'js', { printArgs: true })).toEqual({ lines: c.lines })
    expect([...run.certs].sort((a, b) => a.site.line - b.site.line || a.site.at - b.site.at)).toEqual(run.certs)
    const throws = 'const n = 3\nconst stars = "*".repeat(n - 3)\nconsole.log(n)\nconsole.log(stars.length)'
    const t = changedRunFor(throws, 'b.js', '— `"*".repeat(n - 3)`')!
    for (const c of t.certs) expect('lines' in newRun(c.changed, 'js', { printArgs: true })).toBe(true)
    expect(changedRunFor('const a = {x: 1}\nconsole.log(a)', 'c.js', '— `a`')).toBeUndefined()
    expect(changedRunFor('const f = 1.5\nconsole.log(f * 2)\nconsole.log(f > 1)', 'd.js', '— `f`')!.certs.every(c => c.site.token !== '1.5')).toBe(true)
  })

  test('changedRunFor: a safety net over the whole run (1.13.0 cross-review 1): past CHANGED_RUN_TRIES newRun calls it stops with the places certified so far; under it, the same places as with none', () => {
    expect([CHANGED_RUN_TRIES, CHANGED_RUN_MS]).toEqual([80, 600])
    // Four unused arrays nearest the quoted line: each number's values run and print the same (never certified), so the
    // one place that changes the output, `let t = 0`, comes after 40 · 4 · 4 tries with 40 numbers an array; with 5, first.
    const arr = (k: number, per: number) => `const d${k} = [${Array.from({ length: per }, (_, i) => (i % 7) + 1).join(', ')}]`
    const code = (per: number) => [arr(0, per), arr(1, per), arr(2, per), arr(3, per), 'let t = 0', 'for (let i = 0; i < 10; i++) { t += 1 }', "console.log('합계:', t)"].join('\n')
    const blurb = (per: number) => `배열 — \`${arr(0, per).slice(0, 12)}\``
    expect(code(40).length).toBeLessThanOrEqual(700)
    const capped = changedRunFor(code(40), 'a.js', blurb(40))!
    expect(capped).toEqual({ out: ['합계: 10'], certs: [] })
    const under = changedRunFor(code(5), 'a.js', blurb(5))!
    expect(under.out).toEqual(['합계: 10'])
    expect(under.certs.map(c => [c.site.token, c.value])).toEqual([['0', '1']])
  })

  test('rungOf: off, the 1.12.0 branch byte for byte; on, two certified changes at least, else 내 코드', () => {
    const p = pickOf()
    expect(rung(p, false)).toBe('changed')
    expect(rung(p, true)).toBe('changed')
    const none = pickOf(CODE, 'a.js', BLURB, false)
    expect(rung(none, false)).toBe('changed')
    expect(rung(none, true)).toBe('mine')
    const one = { ...p, code: { ...p.code!, run: { ...p.code!.run!, certs: p.code!.run!.certs.slice(0, 1) } } } as QuizPick
    expect(rung(one, true)).toBe('mine')
  })

  test('prompt: a pick with a run gets its output, its certified places with what each may become and C only; no trace words; without a run the 1.12.0 prompt', () => {
    const p = { ...pickOf(), rung: 'changed' as const }
    const prompt = quizPrompt([p], 'beginner')
    expect(prompt).toContain(CHANGED_RUN_ASK)
    expect(prompt).toContain('   지금 찍히는 글자:\n```\n합계: 176\n평균 88\n```')
    expect(prompt).toContain('   1d: 4번째 줄의 `>=` (< <= > == != === !== 가운데 하나로)')
    expect(prompt).toContain('   1c: 2번째 줄의 `0` (0부터 10 사이의 다른 정수로)')
    expect(prompt).toContain('C1: (고른 곳 이름, 한 칸 띄우고 새 값만. 예: 1b 20)')
    expect(prompt).not.toContain('N1:')
    expect(prompt).not.toContain('O1:')
    for (const word of ['R1', '한 줄씩', '따라', '과정']) expect(prompt).not.toContain(word)
    const plain = { ...pickOf(CODE, 'a.js', BLURB, false), rung: 'changed' as const }
    const old = quizPrompt([plain], 'beginner')
    expect(old).not.toContain(CHANGED_RUN_ASK)
    expect(old).not.toContain('지금 찍히는 글자')
    expect(old).toContain('   바꿀 수 있는 곳 (줄은 위 코드의 첫 줄을 1로 셈):')
  })

  test('changedRunItem: the model names a place and a value; the plugin runs it and its run is the answer; a value that does not run or may not be asked falls back to the place\'s certified change (isOwn false); a bad number or letter, no C are no item', () => {
    const p = { ...pickOf(), rung: 'changed' as const }
    const changedLine = '  if (s < 80) total += s'
    const changed = CODE.split('\n').map((l, i) => (i === 3 ? changedLine : l)).join('\n')
    const want = { item: { key: 'c:k', name: 'k', question: `${CHANGED_LEAD}\n\`\`\`js\n${changed}\n\`\`\``, hint: CHANGED_HINT(4, changedLine), answer: '합계: 72\n평균 36', kind: 'predict', noteId: 'n1', rung: 'changed' }, isOwn: true }
    expect(changedRunItem(parts({ C1: ' `1d` <' }), 1, p)).toEqual(want)
    // Whatever N the model writes is not read: the answer is the plugin's run.
    expect(changedRunItem(parts({ C1: '1d <', N1: '합계: 0\n평균 0' }), 1, p)).toEqual(want)
    // A value the model chose that no fixed value had: 80 -> 90 (91 alone).
    expect(changedRunItem(parts({ C1: '1e 90' }), 1, p)).toMatchObject({ item: { answer: '합계: 91\n평균 46' }, isOwn: true })
    // The same lines as now (81), a value off the list (80.5, 401, =>) or none: the place's certified change (80 -> 160).
    const e = p.code!.run!.certs[4]!
    expect(e.site.token).toBe('80')
    for (const c of ['1e 81', '1e 80.5', '1e 85.5', '1e -5', '1e 401', '1e', '1e: ', '1e 80']) expect(changedRunItem(parts({ C1: c }), 1, p)).toMatchObject({ item: { answer: e.lines.join('\n'), hint: CHANGED_HINT(4, e.changedLine) }, isOwn: false })
    expect(changedRunItem(parts({ C1: '1d =>' }), 1, p)).toMatchObject({ item: { answer: p.code!.run!.certs[3]!.lines.join('\n') }, isOwn: false })
    // The model's value equal to the certified one is the model's own.
    expect(changedRunItem(parts({ C1: `1e ${e.value}` }), 1, p)).toMatchObject({ item: { answer: e.lines.join('\n') }, isOwn: true })
    expect(changedRunItem(parts({ C1: '2d <' }), 1, p)).toEqual({ reason: 'other-slot' })
    expect(changedRunItem(parts({ C1: '1g <' }), 1, p)).toEqual({ reason: 'grammar' })
    expect(changedRunItem(parts({ C1: '1dd <' }), 1, p)).toEqual({ reason: 'grammar' })
    expect(changedRunItem(parts({ C1: 'd <' }), 1, p)).toEqual({ reason: 'grammar' })
    expect(changedRunItem(parts({ N1: '합계: 72' }), 1, p)).toEqual({ reason: 'missing' })
    // A change whose run throws is never kept: the place's certified change stands in.
    const th = { ...pickOf('const n = 3\nconst k = 2\nconst s = "*".repeat(n - k)\nconsole.log(s)\nconsole.log(n + k)', 'b.js', '— `"*".repeat(n - k)`'), rung: 'changed' as const }
    const kAt = th.code!.run!.certs.findIndex(c => c.site.token === '2')
    expect(kAt).toBeGreaterThanOrEqual(0)
    expect(changedRunItem(parts({ C1: `1${'abcdef'[kAt]} 5` }), 1, th)).toMatchObject({ item: { answer: th.code!.run!.certs[kAt]!.lines.join('\n') }, isOwn: false })
    // The C written again counts by its last text (quizParts' lastWins).
    const again = new Map([...parts({ C1: '1a 1' }), ['~C1', ['1d <']]])
    expect(changedRunItem(again, 1, p)).toEqual(want)
  })


  test('the duplicate composer gives changedItem\'s item for the same code, line, change and answer', () => {
    const p = { ...pickOf(), rung: 'changed' as const }
    const cert = p.code!.run!.certs[2]!
    const sites = changeSites(p.code!.text, 'a.js', BLURB)
    const letter = 'abcdef'[sites.findIndex(s => s.line === cert.site.line && s.at === cert.site.at)]
    const old = changedItem(parts({ C1: `1${letter} ${cert.value}\n${cert.changedLine.trim()}`, O1: '합계: 176\n평균 88', N1: cert.lines.join('\n') }), 1, { ...p, code: { ...p.code!, run: undefined } } as QuizPick)
    const run = changedRunItem(parts({ C1: `1${'abcdef'[p.code!.run!.certs.indexOf(cert)]} ${cert.value}` }), 1, p)
    expect('item' in old).toBe(true)
    expect(run).toEqual({ ...old, isOwn: true })
  })

  test('parseQuiz routes a changed pick with a run to changedRunItem, one without to changedItem', () => {
    const p = { ...pickOf(), rung: 'changed' as const }
    const items = parseQuiz('C1: 1f 3', [p])
    expect(items.map(i => i.answer)).toEqual(['합계: 176\n평균 59'])
    const plain = { ...pickOf(CODE, 'a.js', BLURB, false), rung: 'changed' as const }
    expect(parseQuiz('C1: 1f 3', [plain])).toEqual([])
  })
})
