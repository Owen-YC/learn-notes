import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { LearnNote } from '../types'
import {
  balanceOf,
  definesName,
  drillOf,
  hideDrillAnswer,
  isMadeRuleDrill,
  keptNoteText,
  NOT_APP_PATH,
  parseRuleFix,
  parseTeamFile,
  RULE_DRILL_SYSTEM,
  RULE_FIX_TASK,
  renamedLine,
  RULE_FIX_LINES_MAX,
  ruleDrillPrompt,
  ruleFixCheck,
  ruleFixFault,
  ruleFixLines,
  ruleFixMade,
  ruleFixPlan,
  rulePairsOf,
  ruleSidesOf,
  saidRules,
  screenNote,
} from '../hooks/notes'
import { RULE_DRILL_IN } from './fixtures/ruledrill110'
import { RULE_DRILL_PROMPT_112 } from './fixtures/ruledrill112'
import { finish, start, turn, world } from './flowkit'

const TEAM_MD = [
  '# 팀',
  '',
  '## 규칙',
  '- 서버 요청은 `fetch`(파이썬은 `requests`)를 바로 쓰지 말고 `apiRequest`(파이썬은 `api_request`)를 쓴다. 같은 인자를 받고 같은 응답을 돌려주며, 인증 헤더와 재시도를 더한다',
  '- 기록은 `console.log`(파이썬은 `print`) 대신 `log.info`로 남긴다',
  '- 날짜를 글자로 보일 때는 직접 만들지 말고 `toDateText`(파이썬은 `to_date_text`)를 쓴다. 결과는 `2026-10-22` 꼴(UTC)이다',
  '- 설정 값은 `process.env`(파이썬은 `os.environ`)를 바로 읽지 말고 `config`에서 같은 이름으로 읽는다 (`config.API_URL`)',
  '',
].join('\n')
const RULES = parseTeamFile(TEAM_MD).rules
const SIDES = RULES.map(ruleSidesOf)
const AVOIDS = SIDES.flatMap(side => side.avoid)
const change = (file: string, added: string[], kind: 'create' | 'update' = 'create') => ({
  file,
  path: `/proj/${file}`,
  tool: 'Write' as const,
  kind,
  added: added.length,
  removed: 0,
  diff: [`@@ -0,0 +1,${added.length} @@`, ...added.map(line => `+${line}`)].join('\n'),
  isCut: false,
})
const SAID_FETCH = '서버 요청은 `apiRequest`로 하라는 규칙과 달리 `fetch`를 바로 씁니다'

describe('1.12.0: 팀 규칙 연습 (G6): code makes the task, the check and, where the rule\'s words give it, the fix', () => {
  test('ruleSidesOf and rulePairsOf read use and avoid names from the rule\'s own words; a rule written otherwise gives no avoid names and no pair', () => {
    expect(SIDES.map(side => [side.use, side.avoid])).toEqual([
      [['apiRequest', 'api_request'], ['fetch', 'requests']],
      [['log.info'], ['console.log', 'print']],
      [['toDateText', 'to_date_text'], []],
      [['config', 'config.API_URL'], ['process.env', 'os.environ']],
    ])
    expect(SIDES[3]!.objects).toEqual(['config'])
    expect(SIDES.every(side => side.isRead)).toBe(true)
    expect(rulePairsOf(RULES).map(p => `${p.lang}:${p.away}>${p.use}${p.isObject ? ':object' : ''}`)).toEqual([
      'js:fetch>apiRequest',
      'py:requests>api_request',
      'js:console.log>log.info',
      'py:print>log.info',
      'js:process.env>config:object',
      'py:os.environ>config:object',
    ])
    expect(ruleSidesOf('`apiRequest`를 쓰고 `fetch`는 쓰지 마라')).toMatchObject({ use: ['apiRequest'], avoid: ['fetch'] })
    expect(ruleSidesOf('`var` 금지, `const`를 쓴다')).toMatchObject({ use: ['const'], avoid: ['var'] })
    expect(ruleSidesOf('`print` 말고 `log.info`를 씁니다')).toMatchObject({ use: ['log.info'], avoid: ['print'] })
    expect(ruleSidesOf('API 호출은 src/lib/fetcher.ts의 fetcher로 감쌉니다')).toMatchObject({ use: [], avoid: [], isRead: false })
    expect(rulePairsOf(['API 호출은 `fetcher`로 한다'])).toEqual([])
    expect(saidRules(SIDES, SAID_FETCH)).toEqual([0])
    // A line that names no rule points at none (no practice), never at every rule.
    expect(saidRules(SIDES, '팀 규칙과 다를 수 있습니다')).toEqual([])
  })

  test('ruleSidesOf fails closed: a rule its cues do not read whole gives no names, so no forbidden name is ever taken for the one asked for (crit 3)', () => {
    // Read, the right way round: the cues it knows, the not-to-use ones it added.
    for (const [rule, use, avoid] of [
      ['`console.log`를 쓰면 안 됩니다. `log.info`를 쓰세요', ['log.info'], ['console.log']],
      ['`fetch`는 피하고 `apiRequest`를 씁니다', ['apiRequest'], ['fetch']],
      ['`print` 사용은 지양하고 `log.info`를 사용합니다', ['log.info'], ['print']],
      ['`apiRequest`를 쓰고 `fetch`는 쓰지 마라', ['apiRequest'], ['fetch']],
      ['`var` 금지, `const`를 쓴다', ['const'], ['var']],
      ['날짜는 `toDateText`로 보인다', ['toDateText'], []],
    ] as const) expect(ruleSidesOf(rule)).toMatchObject({ use, avoid, isRead: true })
    // Not read: English, no cue for one of two names, a name avoided then allowed, a mark it does not know.
    for (const rule of [
      'Use `apiRequest` instead of `fetch` for server calls',
      '`fetch` 대신 `apiRequest`를 쓰되, 테스트에서는 `fetch`를 써도 된다',
      '서버 요청은 `apiRequest`로만 합니다 (`fetch` X)',
      '`apiRequest`와 `fetch`가 있다',
    ]) {
      expect(ruleSidesOf(rule)).toEqual({ use: [], avoid: [], py: [], objects: [], isRead: false })
      expect(rulePairsOf([rule])).toEqual([])
      expect(saidRules([ruleSidesOf(rule)], '`apiRequest` 대신 `fetch`를 씁니다')).toEqual([])
    }
    // The reversal the critique found is no practice: the rule is pointed at by no line.
    const english = ['Use `apiRequest` instead of `fetch` for server calls']
    const note = { changes: [change('src/a.js', ['const r = await apiRequest(url)'])] }
    expect(ruleFixPlan(note, english, '`apiRequest` 대신 `fetch`를 쓰라는 규칙과 다릅니다')).toEqual({ skip: 'no-rule' })
  })

  test('renamedLine swaps one call of one argument or one object read, outside strings and comments, and nothing else', () => {
    const js = rulePairsOf(RULES).filter(p => p.lang === 'js')
    const py = rulePairsOf(RULES).filter(p => p.lang === 'py')
    const one = (pairs: typeof js, line: string) => pairs.map(p => renamedLine(line, p, AVOIDS)).filter(x => x !== undefined)
    expect(one(js, 'console.log(`total ${total}`)')).toEqual(['log.info(`total ${total}`)'])
    expect(one(js, 'const res = await fetch(url)')).toEqual(['const res = await apiRequest(url)'])
    expect(one(js, 'const base = process.env.API_URL')).toEqual(['const base = config.API_URL'])
    expect(one(py, 'print(f"saved {n}")')).toEqual(['log.info(f"saved {n}")'])
    for (const line of ["await fetch(url, { method: 'POST' })", '// console.log(x)', 'console.log(a); console.log(b)', 'const s = "fetch(x)"', 'window.fetch(url)', 'const k = process.env.get("x")', 'console.log(process.env.X)', 'console.log()', 'console.log(...args)']) {
      expect(one(js, line)).toEqual([])
    }
    for (const line of ['r = requests.get(url)', 'key = os.environ["API_KEY"]', 'key = os.environ.get("K")', 'print("a", b)', 'print()', 'print(*rows)']) expect(one(py, line)).toEqual([])
  })

  test('renamedLine swaps a name only where the line\'s code calls or reads it: never in a comment at its end, a definition, a write or delete of a member, or JSX text (review 1.12.0)', () => {
    const js = rulePairsOf(RULES).filter(p => p.lang === 'js')
    const py = rulePairsOf(RULES).filter(p => p.lang === 'py')
    const one = (pairs: typeof js, line: string) => pairs.map(p => renamedLine(line, p, AVOIDS)).filter(x => x !== undefined)
    for (const line of [
      'const s = 1 // console.log(s)',
      'const res = load(url) // was fetch(url)',
      'const n = 1 /* console.log(n) */',
      'async function fetch(url) {',
      'function fetch(url) {',
      'export default function fetch(url) {',
      'fetch(url) {',
      'async fetch(url) {',
      'static fetch(url): Promise<Res> {',
      'fetch(url) { return get(url) },',
      'process.env.API_URL = base',
      'process.env.API_URL ??= base',
      'process.env.COUNT++',
      'delete process.env.API_URL',
      '<p>Use fetch(url) here</p>',
      '<li key={id}>Then console.log(x)</li>',
    ]) expect(one(js, line)).toEqual([])
    for (const line of ['s = sum(rows)  # print(s)', 'def print(msg):', 'async def print(msg):', 'del os.environ.API_URL']) expect(one(py, line)).toEqual([])
    // The code before a comment, a call in an arrow or in JSX's braces, a compared read, a private field and Python's
    // floor division are still the line's code.
    expect(one(js, 'console.log(s) // show it')).toEqual(['log.info(s) // show it'])
    expect(one(js, 'const get = () => fetch(url)')).toEqual(['const get = () => apiRequest(url)'])
    expect(one(js, 'return <p>{fetch(url)}</p>')).toEqual(['return <p>{apiRequest(url)}</p>'])
    expect(one(js, 'const on = process.env.DEBUG === "1"')).toEqual(['const on = config.DEBUG === "1"'])
    expect(one(js, 'this.#n = fetch(url)')).toEqual(['this.#n = apiRequest(url)'])
    expect(one(py, 'n = rows // 2; print(n)')).toEqual(['n = rows // 2; log.info(n)'])
  })

  test('a rule\'s name in a comment at a line\'s end is no hint and no fix: no practice made by code, no call, no reply taken that changes the comment (review 1.12.0)', () => {
    const saidLog = '기록은 `log.info`로 남기라는 규칙과 달리 `console.log`가 남아 있습니다'
    const saidPrint = '기록은 `log.info`로 남기라는 규칙과 달리 `print`가 보입니다'
    expect(ruleFixPlan({ changes: [change('src/a.js', ['const s = 1 // console.log(s)'])] }, RULES, saidLog)).toEqual({ skip: 'no-line' })
    expect(ruleFixPlan({ changes: [change('app/a.py', ['def total(rows):', '    s = 1  # print(s)', '    return s'])] }, RULES, saidPrint)).toEqual({ skip: 'no-line' })
    expect(ruleFixPlan({ changes: [change('src/a.js', ['f(a, b) // console.log(a, b)'])] }, RULES, saidLog)).toEqual({ skip: 'no-line' })
    expect(ruleFixPlan({ changes: [change('src/a.js', ['console.log(s) // show it'])] }, RULES, saidLog)).toMatchObject({ fix: { example: 'log.info(s) // show it' } })
    // A reply that changes the comment only, whatever lines it was given, is not taken.
    const fault = (file: string, rule: number, text: string, example: string, hint?: number, isAnchored = false) => {
      const got = ruleFixFault({ rule, line: 0, example }, [{ change: 0, file, text, ...(hint !== undefined ? { hint } : {}), isAnchored }], SIDES, [0, 1, 2, 3])
      return 'fault' in got ? got.fault : `fix:${got.fix.use}`
    }
    expect(fault('src/a.js', 1, 'f(a, b) // console.log(a, b)', 'f(a, b) // log.info(a, b)', 1)).toBe('line-keeps-rule')
    expect(fault('app/a.py', 1, 's = 1  # print(s)', 's = 1  # log.info(s)', 1)).toBe('line-keeps-rule')
    expect(fault('src/a.js', 2, 'const s = fmt(d) // d', 'const s = fmt(d) // toDateText(d)', undefined, true)).toBe('no-use-name')
    expect(fault('src/a.js', 1, 'console.log(a, b) // keep', 'log.info(a, b) // keep', 1)).toBe('fix:log.info')
  })

  test('ruleFixLines: a line another change holds first is not listed; at most RULE_FIX_LINES_MAX, hint lines first; a rule\'s name quoted alone anchors no line (review 1.12.0)', () => {
    const twice = { changes: [change('tests/a.test.js', ['const res = await fetch(url)']), change('src/a.js', ['const res = await fetch(url)'])] }
    expect(ruleFixLines(twice, RULES, SAID_FETCH).cands).toEqual([])
    expect(ruleFixPlan(twice, RULES, SAID_FETCH)).toEqual({ skip: 'no-line' })
    const many = ['const a = 1', 'const b = 2', ...Array.from({ length: 13 }, (_, i) => `console.log(v${i}, w)`)]
    const said = '기록은 `log.info`로 남기고 날짜는 `toDateText`로 보이라는 규칙과 달리 직접 씁니다'
    const { cands } = ruleFixLines({ changes: [change('src/a.js', many)] }, RULES, said)
    expect(cands.length).toBe(RULE_FIX_LINES_MAX)
    expect(cands.map(one => one.text)).toEqual(many.slice(2, 2 + RULE_FIX_LINES_MAX))
    const date = { changes: [change('src/a.js', ['const s = toDateText(a) + b.toJSON()'])] }
    const saidName = '날짜는 `toDateText`로 보이라는 규칙과 달리 직접 만듭니다'
    expect(ruleFixLines(date, RULES, saidName).cands.map(one => one.isAnchored)).toEqual([false])
    expect(ruleFixPlan(date, RULES, saidName)).toEqual({ skip: 'no-hint' })
  })

  test('ruleFixLines lists app lines only: no test, rule module (by name or by what it defines), build or config file, long line, comment, import or masked line, each once', () => {
    const note = {
      changes: [
        change('tests/user.test.js', ['await fetch(url)']),
        change('src/api/apiRequest.js', ['return fetch(url)']),
        change('src/utils/format.js', ['export function toDateText(d) {', '  return d.toISOString().slice(0, 10)', '}']),
        change('scripts/printVersion.js', ['console.log(process.env.VERSION)']),
        change('webpack.config.js', ['const mode = process.env.NODE_ENV']),
        change('src/user.js', [
          "import { apiRequest } from './api/apiRequest.js'",
          '// fetch(url) once',
          '  const res = await fetch(url)',
          '  const res = await fetch(url)',
          '  const t = await fetch(`${base}/a/very/long/path/that/goes/on/${id}`)',
          '  const key = «가림»',
          '  return res.json()',
        ]),
      ],
    }
    const { cands, pointed } = ruleFixLines(note, RULES, SAID_FETCH)
    expect(pointed).toEqual([0])
    expect(cands.map(one => `${one.file}:${one.text}`)).toEqual(['src/user.js:const res = await fetch(url)'])
    expect(definesName(note.changes[2]!.diff, 'toDateText', 'src/utils/format.js')).toBe(true)
    expect(definesName(note.changes[5]!.diff, 'apiRequest', 'src/user.js')).toBe(false)
    // Made for other files: exported, or Python's top level; a local `const config` is app code (crit 10).
    const one = (file: string, lines: string[], name: string) => definesName(change(file, lines).diff, name, file)
    for (const [file, lines] of [
      ['src/a.js', ['export const config = { a: 1 }']],
      ['src/a.js', ['const config = {}', 'export default config']],
      ['src/a.js', ['const config = {}', 'module.exports = { config }']],
      ['src/a.js', ['exports.config = {}']],
      ['src/a.js', ['const config = {}', 'export { config }']],
      ['app/settings.py', ['config = load()']],
      ['app/settings.py', ['def config():', '    return {}']],
    ] as const) expect(one(file, [...lines], 'config')).toBe(true)
    for (const [file, lines] of [
      ['src/a.js', ['const config = { retries: 3 }', 'const base = process.env.API_URL']],
      ['src/a.js', ['function load() {', '  const config = {}', '}']],
      ['app/run.py', ['def main():', '    config = load()']],
      ['app/run.py', ['if config == 1:']],
    ] as const) expect(one(file, [...lines], 'config')).toBe(false)
    expect(ruleFixPlan({ changes: [change('src/app.js', ['const config = { retries: 3 }', 'const base = process.env.API_URL'])] }, RULES, '설정은 `config`에서 읽으라는 규칙과 달리 `process.env`를 바로 읽습니다')).toMatchObject({ fix: { example: 'const base = config.API_URL' } })
    for (const file of ['scripts/a.js', 'build/x.js', 'tools/a.py', 'webpack.config.js', 'vite.config.ts', 'app/manage.py', 'Makefile', '.github/workflows/ci.js']) expect(NOT_APP_PATH.test(file)).toBe(true)
    for (const file of ['src/app.js', 'app/orders.py', 'src/scriptsList.js']) expect(NOT_APP_PATH.test(file)).toBe(false)
  })

  test('a rule with no avoid names lists every short added line, hint and quoted lines first; tier 2 only when one is quoted', () => {
    const note = { changes: [change('src/badge.js', ['const n = items.length', "const s = d.toISOString().slice(0, 10)", 'return { n, s }'])] }
    const said = '날짜는 `toDateText`로 보이라는 규칙과 달리 직접 만듭니다'
    expect(ruleFixLines(note, RULES, said).cands.map(one => one.isAnchored)).toEqual([false, false, false])
    expect(ruleFixPlan(note, RULES, said)).toEqual({ skip: 'no-hint' })
    const quoted = '날짜는 `toDateText`로 보이라는 규칙과 달리 `d.toISOString().slice(0, 10)`로 직접 만듭니다'
    const plan = ruleFixPlan(note, RULES, quoted)
    expect('cands' in plan && plan.cands.map(one => one.text)).toEqual(["const s = d.toISOString().slice(0, 10)", 'const n = items.length', 'return { n, s }'])
  })

  test('ruleFixPlan: tier 1 for a one-name rename, tier 2 for a hint line it cannot rename, none for no line', () => {
    expect(ruleFixPlan({ changes: [change('src/a.js', ['const res = await fetch(url)'])] }, RULES, SAID_FETCH)).toMatchObject({ fix: { rule: 0, example: 'const res = await apiRequest(url)', use: 'apiRequest' } })
    expect(ruleFixPlan({ changes: [change('src/a.js', ["await fetch(u, { method: 'PUT' })"])] }, RULES, SAID_FETCH)).toMatchObject({ cands: [{ text: "await fetch(u, { method: 'PUT' })", hint: 0 }] })
    expect(ruleFixPlan({ changes: [change('src/a.rb', ['res = fetch(url)'])] }, RULES, SAID_FETCH)).toMatchObject({ cands: [{ hint: 0 }] })
    expect(ruleFixPlan({ changes: [change('scripts/a.js', ['const res = await fetch(url)'])] }, RULES, SAID_FETCH)).toEqual({ skip: 'no-line' })
  })

  test('parseRuleFix reads the three lines in the shapes a model writes; a quoted line and a missing rule are repaired from what code holds; anything else is no reply', () => {
    const cands = [{ change: 0, file: 'src/a.js', text: "await fetch(u, { method: 'POST' })", hint: 0, isAnchored: false }]
    const ex = "await apiRequest(u, { method: 'POST' })"
    expect(parseRuleFix(`- 규칙: 1\n- 줄: 1\n- 예시 답: \`${ex}\``, cands, SIDES, [0])).toEqual({ rule: 0, line: 0, example: ex })
    expect(parseRuleFix(`**규칙**: 1번\n**줄**: (1)\n**예시 답**: \`${ex}\``, cands, SIDES, [0])).toEqual({ rule: 0, line: 0, example: ex })
    expect(parseRuleFix(`- 줄: \`${cands[0]!.text}\`\n- 예시 답: \`${ex}\``, cands, SIDES, [0])).toEqual({ rule: 0, line: 0, example: ex })
    expect(parseRuleFix(`- 줄: 1\n- 예시 답: \`${ex}\``, cands, SIDES, [0, 1])).toEqual({ rule: 0, line: 0, example: ex })
    expect(parseRuleFix('- 줄: 없음', cands, SIDES, [0])).toBe('none')
    expect(parseRuleFix(`- 규칙: 1\n- 규칙: 2\n- 줄: 1\n- 예시 답: \`${ex}\``, cands, SIDES, [0])).toBeUndefined()
    expect(parseRuleFix('- 규칙: 1\n- 줄: 1', cands, SIDES, [0])).toBeUndefined()
  })

  test('ruleFixFault: each check names its fault; a fix that passes them all is taken with its shortest use name', () => {
    const c = (text: string, hint?: number, isAnchored = false) => [{ change: 0, file: 'src/a.js', text, ...(hint !== undefined ? { hint } : {}), isAnchored }]
    const fault = (rule: number, text: string, example: string, hint?: number, isAnchored = false) => {
      const got = ruleFixFault({ rule, line: 0, example }, c(text, hint, isAnchored), SIDES, [0, 1, 2, 3])
      return 'fault' in got ? got.fault : `fix:${got.fix.use}`
    }
    expect(ruleFixFault({ rule: 0, line: 3, example: 'x' }, c('a'), SIDES, [0])).toEqual({ fault: 'line-number' })
    expect(ruleFixFault({ rule: 9, line: 0, example: 'x' }, c('a'), SIDES, [0])).toEqual({ fault: 'rule-number' })
    expect(ruleFixFault({ rule: 1, line: 0, example: 'x' }, c('a'), SIDES, [0])).toEqual({ fault: 'rule-not-pointed' })
    expect(fault(1, 'return total', 'log.info(total)')).toBe('line-keeps-rule')
    expect(fault(2, 'const n = items.length', 'const n = toDateText(items)')).toBe('not-anchored')
    expect(fault(1, "console.log('a', b)", "console.log('a', b)", 1)).toBe('same-as-line')
    expect(fault(1, "console.log('a', b)", "console.info('a', b)", 1)).toBe('no-use-name')
    expect(fault(1, "console.log('a', b)", "log.info('a', b); console.log('a', b)", 1)).toBe('avoid-left')
    // Not the line changed in one place into a call of the rule's name (isOneSpanFix): wrapped, kept beside, another
    // value brought in, another line (crit 2: every shape the critique found, the old ones too).
    for (const [line, example] of [
      ['const s = d.toISOString().slice(0, 10)', 'const s = toDateText(d.toISOString().slice(0, 10))'],
      ['const s = d.toJSON().slice(0, 10)', 'const s = toDateText(d.toJSON())'],
      ['const s = d.toISOString().slice(0, 10)', 'const s = toDateText(d) || d.toISOString()'],
      ['const s = d.toISOString().slice(0, 10)', 'const s = d.getFullYear() && toDateText(d)'],
      ['const y = d.getFullYear() + tail', 'const y = toDateText(d.toJSON())'],
      ['const y = d.getFullYear() + tail', 'const y = toDateText(new Date(d.getTime()))'],
      ['const t = d.toLocaleDateString()', 'const t = toDateText(Date.now())'],
      ['const t = d.toLocaleDateString()', 'const t = toDateText(e)'],
    ] as const) expect(fault(2, line, example, undefined, true)).toBe('not-one-span')
    expect(ruleFixFault({ rule: 2, line: 0, example: 'day = to_date_text(sent) if sent else sent.isoformat()' }, [{ change: 0, file: 'app/a.py', text: 'day = sent.strftime("%Y-%m-%d")', isAnchored: true }], SIDES, [2])).toEqual({ fault: 'not-one-span' })
    expect(fault(1, "console.log('a', b)", "log.info('other text')", 1)).toBe('not-one-span')
    expect(fault(3, 'const k = process.env.KEY', 'const k = config.OTHER', 3)).toBe('not-one-span')
    // The rest of the line kept as it was, byte for byte: nothing added beside the new call, nothing renamed around it.
    expect(fault(1, 'console.log(a)', 'log.info(a); alert(a)', 1)).toBe('not-one-span')
    expect(fault(0, 'const x = await fetch(u)', 'const y = await apiRequest(u)', 0)).toBe('not-one-span')
    expect(fault(1, "console.log('a', b)", "log.info('a', b", 1)).toBe('brackets')
    expect(fault(3, 'const k = process.env.API_KEY', 'const k = config.API_KEY', 3)).toBe('fix:config')
    expect(fault(2, 'const s = new Date(t).toISOString().slice(0, 10)', 'const s = toDateText(new Date(t))', undefined, true)).toBe('fix:toDateText')
    expect(fault(1, 'console.log(items.map(x => x.id))', 'log.info(items.map(x => x.id))', 1)).toBe('fix:log.info')
    expect(fault(0, "await fetch(u, { method: 'PUT' })", "await apiRequest(u, { method: 'PUT' })", 0)).toBe('fix:apiRequest')
    expect(fault(3, 'const p = Number(process.env.PORT)', 'const p = Number(config.PORT)', 3)).toBe('fix:config')
    expect(fault(2, 'const s = d.toISOString().slice(0, 10)', 'const s = toDateText(d)', undefined, true)).toBe('fix:toDateText')
    expect(ruleFixFault({ rule: 2, line: 0, example: 'day = to_date_text(sent)' }, [{ change: 0, file: 'app/a.py', text: 'day = sent.strftime("%Y-%m-%d")', isAnchored: true }], SIDES, [2])).toMatchObject({ fix: { use: 'to_date_text' } })
    expect(balanceOf("f('(', x)")).toBe('0,0,0,')
  })

  test('ruleDrillPrompt: the screened note\'s code, the rules numbered, the note\'s line and the lines code listed, three lines asked (tests/fixtures/ruledrill112.ts); RULE_DRILL_SYSTEM as 1.10.0', () => {
    const team = parseTeamFile(RULE_DRILL_IN.teamMd)
    const shown = screenNote({ ...RULE_DRILL_IN.note, withheld: [] })
    const { cands } = ruleFixLines(shown, team.rules, RULE_DRILL_IN.said)
    expect(ruleDrillPrompt(shown, team.rules, RULE_DRILL_IN.said, cands)).toBe(RULE_DRILL_PROMPT_112)
    expect(RULE_DRILL_SYSTEM).toContain('연습 하나를 만든다')
  })

  test('the made section: drillOf and hideDrillAnswer read it on, never off; a team rule\'s practice code did not make is none on, as off', () => {
    const changes = [change('src/a.js', ['const res = await fetch(url)', 'return res.json()'])]
    const head = ['### 왜 이렇게 바꿨을까', `팀 규칙과 다를 수 있음: ${SAID_FETCH}`]
    const plan = ruleFixPlan({ changes }, RULES, SAID_FETCH)
    if (!('fix' in plan)) throw new Error('no tier 1')
    const made = ruleFixMade(head.join('\n'), plan.fix, changes)!
    expect(made.split('\n').slice(2)).toEqual([
      '',
      '### 직접 해 보기',
      `- 할 일 (팀 규칙): ${RULE_FIX_TASK}`,
      '- 고칠 줄: `const res = await fetch(url)`',
      '- 확인: 고친 줄이 돌 때 `apiRequest` 쪽을 거칩니다',
      '- 예시 답: `const res = await apiRequest(url)`',
    ])
    expect(drillOf(made, changes, true)).toMatchObject({ line: 'const res = await fetch(url)', example: 'const res = await apiRequest(url)', rule: SAID_FETCH })
    expect(drillOf(made, changes, false)).toBeUndefined()
    expect(hideDrillAnswer(made, undefined, { isRuleDrill: true })).toContain(ruleFixCheck('apiRequest'))
    expect(hideDrillAnswer(made, undefined, { isRuleDrill: true })).not.toContain('고칠 줄')
    expect(hideDrillAnswer(made, undefined, { isRuleDrill: false })).not.toContain('직접 해 보기')
    const theirs = made.replace(RULE_FIX_TASK, '팀 규칙대로 서버 요청 함수를 바꿔 보세요')
    expect(drillOf(theirs, changes, true)).toBeUndefined()
    expect(hideDrillAnswer(theirs, undefined, { isRuleDrill: true })).not.toContain('직접 해 보기')
    // The task's bytes are frozen once shipped (isMadeRuleDrill reads stored practices by them), one 56-column line.
    expect(RULE_FIX_TASK).toBe('바뀐 한 줄을 규칙대로 고쳐 보세요.')
    expect(isMadeRuleDrill(RULE_FIX_TASK, ruleFixCheck('apiRequest'), 'fetch(u)', 'apiRequest(u)')).toBe(true)
    expect(isMadeRuleDrill(RULE_FIX_TASK, ruleFixCheck('apiRequest'), 'apiRequest(u)', 'apiRequest(v)')).toBe(false)
    // A W2-marked section of the note's own call keeps its text in the journal; no window reads it as a practice on.
    const marked = keptNoteText([...head, '### 직접 해 보기', '- 할 일: 인증이 붙는 함수로 바꿔 보세요', '- 고칠 줄: `const res = await fetch(url)`', '- 확인: 같습니다', '- 예시 답: `const res = await apiRequest(url)`'].join('\n'), ['apiRequest', 'fetch'])
    expect(marked).toContain('- 할 일 (팀 규칙): 인증이 붙는 함수로 바꿔 보세요')
    expect(drillOf(marked, changes, true)).toBeUndefined()
  })
})

describe('1.12.0: 팀 규칙 연습 (G6) in writeNote: one call for tier 1 or none made, two for tier 2, the note\'s own text whenever none is made', () => {
  const HEAD = ['### 한 줄 요약', '사용자를 읽어 옵니다.', '### 왜 이렇게 바꿨을까', '아마 화면에 쓰려는 것입니다.']
  const OWN_PRACTICE = ['### 직접 해 보기', '- 할 일: 응답을 그대로 돌려주게 바꿔 보세요', '- 고칠 줄: `return res.json()`', '- 확인: `loadUser(1)` → 응답 객체', '- 예시 답: `return res`']
  const noteText = (said?: string) => [...HEAD, ...(said !== undefined ? [`팀 규칙과 다를 수 있음: ${said}`] : []), ...OWN_PRACTICE].join('\n')
  const notesIn = (store: Map<string, unknown>) => (store.get('history') as Record<string, { notes: LearnNote[] }>)['/proj']!.notes
  const fileWith = (line: string) => ["import { apiRequest } from './api/apiRequest.js'", '', 'export async function loadUser(id, url) {', `  ${line}`, '  return res.json()', '}', ''].join('\n')

  async function wrote($: Engine, on: On, line: string, texts: string[], harness: Record<string, unknown> | null = { models: { haiku: { isRuleDrill: true } } }) {
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    w.files.set('/proj/.claude/learn-notes.md', TEAM_MD)
    w.harness = harness ?? undefined
    await start($)
    w.texts = [...texts]
    await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/user.js', content: fileWith(line) }))
    await finish(w)
    return { w, note: notesIn(store).at(-1)! }
  }

  test('tier 1: a fetch of one argument is renamed by code, no second call; the stored practice is the made one', { options: { model: 'haiku', level: 'beginner' } }, async ($, on) => {
    const { w, note } = await wrote($, on, 'const res = await fetch(`/users/${id}`)', [noteText(SAID_FETCH)])
    expect(w.systems).toHaveLength(1)
    expect(note.text).toContain('- 확인: 고친 줄이 돌 때 `apiRequest` 쪽을 거칩니다')
    expect(note.text).toContain('- 예시 답: `` const res = await apiRequest(`/users/${id}`) ``')
    expect(note.text).not.toContain('응답을 그대로 돌려주게')
  })

  test('tier 2: a fetch of two arguments is asked of a call of its own (the prompt ruleDrillPrompt of the screened note); a taken reply is the practice', { options: { model: 'haiku', level: 'beginner' } }, async ($, on) => {
    const line = "await fetch(u, { method: 'PUT' })"
    const { w, note } = await wrote($, on, line, [noteText(SAID_FETCH), "- 규칙: 1\n- 줄: 1\n- 예시 답: `await apiRequest(u, { method: 'PUT' })`"])
    expect(w.systems).toHaveLength(2)
    expect(w.systems[1]).toBe(RULE_DRILL_SYSTEM)
    expect(w.budgets[1]).toBe(3500)
    const shown = screenNote(note)
    expect(w.models[1]).toBe(ruleDrillPrompt(shown, RULES, SAID_FETCH, ruleFixLines(shown, RULES, SAID_FETCH).cands))
    expect(note.text).toContain("- 예시 답: `await apiRequest(u, { method: 'PUT' })`")
    expect(note.text).toContain(`- 할 일 (팀 규칙): ${RULE_FIX_TASK}`)
  })

  test('tier 2 reply not taken (the old name kept): the note is its own, byte for byte what isRuleWide alone keeps', { options: { model: 'haiku', level: 'beginner' } }, async ($, on) => {
    const line = "await fetch(u, { method: 'PUT' })"
    const { w, note } = await wrote($, on, line, [noteText(SAID_FETCH), "- 규칙: 1\n- 줄: 1\n- 예시 답: `await apiRequest(u, { method: 'PUT' }) || fetch(u)`"])
    expect(w.systems).toHaveLength(2)
    expect(note.text).toBe(keptNoteText(noteText(SAID_FETCH), ['fetch', 'requests', 'apiRequest', 'api_request', 'console.log', 'print', 'log.info', 'toDateText', 'to_date_text', 'process.env', 'os.environ', 'config', 'config.API_URL']))
  })

  test('none made (a date rule named, no line quoted): one call, the note its own', { options: { model: 'haiku', level: 'beginner' } }, async ($, on) => {
    const said = '날짜는 `toDateText`로 보이라는 규칙과 다를 수 있습니다'
    const { w, note } = await wrote($, on, 'const res = await load(id)', [noteText(said)])
    expect(w.systems).toHaveLength(1)
    expect(note.text).toContain('응답을 그대로 돌려주게')
  })

  test('an O note (no "다를 수 있음" line) and the shipped row (no harness): one call, the same text', { options: { model: 'haiku', level: 'beginner' } }, async ($, on) => {
    const { w, note } = await wrote($, on, 'const res = await fetch(url)', [noteText()])
    expect(w.systems).toHaveLength(1)
    expect(note.text).toBe(noteText())
  })

  // An alias turned in the session (the settings' modelOverrides here; recheckRemap reads env and settings alike):
  // asked before a practice is made and again once the call is back, the note is then the one every switch off keeps.
  const OVERRIDDEN = { user: { modelOverrides: { 'some-model-1': 'override-target-x' } } }
  const OFF_TEXT = (said: string) => keptNoteText(noteText(said))

  for (const [what, line, texts] of [
    ['tier 1', 'const res = await fetch(`/users/${id}`)', [noteText(SAID_FETCH)]],
    ['tier 2', "await fetch(u, { method: 'PUT' })", [noteText(SAID_FETCH), "- 규칙: 1\n- 줄: 1\n- 예시 답: `await apiRequest(u, { method: 'PUT' })`"]],
  ] as const) {
    test(`alias turned before the note is written (${what}): no practice made by code, no second call, the text every switch off keeps (crit 1)`, { options: { model: 'haiku', level: 'beginner' } }, async ($, on) => {
      const store = new Map<string, unknown>()
      const w = world(on, 'ok', null, true, store)
      w.files.set('/proj/.claude/learn-notes.md', TEAM_MD)
      w.harness = { models: { haiku: { isRuleDrill: true } } }
      await start($)
      w.settings = OVERRIDDEN
      w.texts = [...texts]
      await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/user.js', content: fileWith(line) }))
      await finish(w)
      const note = notesIn(store).at(-1)!
      expect(w.systems).toHaveLength(1)
      expect(note.text).toBe(OFF_TEXT(SAID_FETCH))
      expect(note.text).not.toContain(RULE_FIX_TASK)
    })
  }

  test('alias turned while the practice\'s call is out: its reply is not taken, the text every switch off keeps (crit 1)', { options: { model: 'haiku', level: 'beginner' } }, async ($, on) => {
    let w: ReturnType<typeof world> | undefined
    on('model.complete', { prompt: /## 고쳐 볼 수 있는 줄/ }, async (_$, e, next) => {
      w!.settings = OVERRIDDEN
      return next(e)
    })
    const store = new Map<string, unknown>()
    w = world(on, 'ok', null, true, store)
    w.files.set('/proj/.claude/learn-notes.md', TEAM_MD)
    w.harness = { models: { haiku: { isRuleDrill: true } } }
    await start($)
    w.texts = [noteText(SAID_FETCH), "- 규칙: 1\n- 줄: 1\n- 예시 답: `await apiRequest(u, { method: 'PUT' })`"]
    await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/user.js', content: fileWith("await fetch(u, { method: 'PUT' })") }))
    await finish(w)
    const note = notesIn(store).at(-1)!
    expect(w.systems).toHaveLength(2)
    expect(note.text).toBe(OFF_TEXT(SAID_FETCH))
  })

  test('a "다를 수 있음" line naming no rule: no practice, one call (crit 9)', { options: { model: 'haiku', level: 'beginner' } }, async ($, on) => {
    const { w, note } = await wrote($, on, 'const res = await fetch(`/users/${id}`)', [noteText('날짜를 글자로 직접 만들어 팀 규칙과 다를 수 있습니다')])
    expect(w.systems).toHaveLength(1)
    expect(note.text).not.toContain(RULE_FIX_TASK)
  })

  test('shipped haiku row (isRuleDrill off): one call even with a "다를 수 있음" line', { options: { model: 'haiku', level: 'beginner' } }, async ($, on) => {
    const { w, note } = await wrote($, on, 'const res = await fetch(url)', [noteText(SAID_FETCH)], null)
    expect(w.systems).toHaveLength(1)
    expect(note.text).toContain('응답을 그대로 돌려주게')
  })
})
