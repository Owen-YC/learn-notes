import { describe, expect, test } from 'claude-code/testing'
import {
  capKnownNames,
  nameCode,
  GIVEN_NAMES,
  RULE_CAP_BRACKETS,
  RULE_CAP_NUDGE,
  ruleAvoidsOf,
  ruleCapText,
  ruleFixCheck,
  ruleFixUse,
  ruleGradeCap,
  usedNames,
} from '../hooks/notes'

/** A made practice's parts (1.13.0 G6): the line, the example, the lines around it. */
const FETCH = { line: 'const res = await fetch(url, opts);', example: 'const res = await apiRequest(url, opts);', above: '  const url = BASE + `/items/${id}`;', below: '  const data = await res.json();' }
const FILE_JS = ["import { apiRequest } from './api/apiRequest.js';", "const BASE = 'https://api.example.test';", 'const opts = { headers: { accept: "json" } };', 'export async function load(id, extra) {', '  const url = BASE + `/items/${id}`;', '  const res = await fetch(url, opts);', '  const data = await res.json();', '  return data;', '}', ''].join('\n')
const DIFF_JS = ['@@ -0,0 +1,9 @@', ...FILE_JS.split('\n').slice(0, -1).map(line => `+${line}`)].join('\n')
const KNOWN_JS = capKnownNames([DIFF_JS])
/** The four team rules the measured samples are written against (1.12.0 G6 team file). */
const RULES = [
  '서버 요청은 `fetch`(파이썬은 `requests`)를 바로 쓰지 말고 `apiRequest`(파이썬은 `api_request`)를 쓴다. 같은 인자를 받고 같은 응답을 돌려주며, 인증 헤더와 재시도를 더한다',
  '기록은 `console.log`(파이썬은 `print`) 대신 `log.info`로 남긴다',
  '날짜를 글자로 보일 때는 직접 만들지 말고 `toDateText`(파이썬은 `to_date_text`)를 쓴다. 결과는 `2026-10-22` 꼴(UTC)이다',
  '설정 값은 `process.env`(파이썬은 `os.environ`)를 바로 읽지 말고 `config`에서 같은 이름으로 읽는다 (`config.API_URL`)',
]
const cap = (mine: string, known = KNOWN_JS, drill: Parameters<typeof ruleGradeCap>[0] = FETCH, use = 'apiRequest', lang: 'js' | 'py' = 'js', file = '') =>
  ruleGradeCap(drill, use, mine, known, lang, file, ruleAvoidsOf(RULES, use))

describe('1.13.0: 팀 규칙 연습 (G6) grade cap: code holds a made practice\'s right to what the note\'s code shows', () => {
  test('each reason, in order: the rule\'s name missing, the old way left, a name the code never shows, brackets, another place changed', () => {
    expect(cap('const res = await request(url, opts);')).toEqual({ why: 'rule-use', name: 'apiRequest' })
    expect(cap('const res = await apiRequest(url, opts) || await fetch(url);')).toEqual({ why: 'rule-old', name: 'fetch' })
    expect(cap('const res = await apiRequest(url, options);')).toEqual({ why: 'name', name: 'options' })
    expect(cap('const res = await apiRequest(url, { ...options });')).toEqual({ why: 'name', name: 'options' })
    expect(cap('const res = await apiRequest(url, opts;')).toEqual({ why: 'brackets' })
    expect(cap('const res = await apiRequest(BASE, opts);')).toEqual({ why: 'swap', from: 'url', to: 'BASE' })
    expect(cap('const res = await apiRequest(url, opts);')).toBeUndefined()
    expect(ruleCapText({ why: 'name', name: 'options' })).toBe('이 노트의 코드에 없는 이름입니다: `options`')
    expect(ruleCapText({ why: 'rule-use', name: 'log.info' })).toBe('규칙이 쓰라는 `log.info` 없이 고쳤습니다')
    expect(ruleCapText({ why: 'rule-old', name: 'process' })).toBe('고친 줄에 원래 방식이 남아 있습니다: `process`')
    expect(ruleCapText({ why: 'swap', from: 'url', to: 'BASE' })).toBe('규칙 밖에서 바뀐 곳이 있습니다: `url` → `BASE`')
    expect(ruleCapText({ why: 'brackets' })).toBe(RULE_CAP_BRACKETS)
  })

  test('the example\'s own names in another order are no swap inside one { a, b } list only; in a call\'s arguments or an operation they are; a name or value of the line\'s own is', () => {
    const CONFIG = { line: 'const { API_URL, CDN } = process.env;', example: 'const { API_URL, CDN } = config;', above: "import { config } from './config.js';", below: 'export const page = (id) => `${API_URL}/p/${id}`;' }
    const known = capKnownNames(['@@ -1,3 +1,3 @@', "+import { config } from './config.js';", '+const { API_URL, CDN } = process.env;', '+export const page = (id) => `${API_URL}/p/${id}`;'].join('\n').split('\n\n'))
    expect(cap('const { CDN, API_URL } = config;', known, CONFIG, 'config')).toBeUndefined()
    expect(cap('let { CDN, API_URL } = config;', known, CONFIG, 'config')).toBeUndefined()
    expect(cap('const { API_URL, API_URL } = config;', known, CONFIG, 'config')).toEqual({ why: 'swap', from: 'CDN', to: 'API_URL' })
    expect(cap('const res = await apiRequest(opts, opts);')).toEqual({ why: 'swap', from: 'url', to: 'opts' })
    expect(cap('const res = await apiRequest(url, url);')).toEqual({ why: 'swap', from: 'opts', to: 'url' })
    const THREE = { line: 'print(a, b, c)', example: 'log.info(a, b, c)', above: 'a, b, c = 1, 2, 3', below: '' }
    const abc = capKnownNames(['@@ -1,2 +1,2 @@\n+a, b, c = 1, 2, 3\n+print(a, b, c)'])
    expect(cap('log.info(b, a, a)', abc, THREE, 'log.info', 'py')).toEqual({ why: 'swap', from: 'a', to: 'b' })
    expect(cap('log.info(c, b, a)', abc, THREE, 'log.info', 'py')).toEqual({ why: 'swap', from: 'a', to: 'c' })
    expect(cap('const res = await apiRequest(opts, url);')).toEqual({ why: 'swap', from: 'url', to: 'opts' })
    const SHORT = { line: 'const res = await fetch(url, { headers, body });', example: 'const res = await apiRequest(url, { headers, body });' }
    const hb = capKnownNames(['@@ -1,2 +1,2 @@\n+const headers = {}, body = "", url = "u";\n+const res = await fetch(url, { headers, body });'])
    expect(cap('const res = await apiRequest(url, { body, headers });', hb, SHORT)).toBeUndefined()
    const KEYS = { line: 'const res = await fetch(url, { a: x, b: y });', example: 'const res = await apiRequest(url, { a: x, b: y });' }
    const xy = capKnownNames(['@@ -1,2 +1,2 @@\n+const x = 1, y = 2, url = "u";\n+const res = await fetch(url, { a: x, b: y });'])
    expect(cap('const res = await apiRequest(url, { a: y, b: x });', xy, KEYS)).toEqual({ why: 'swap', from: 'x', to: 'y' })
    expect(cap('const res = await apiRequest(url, { b: y, a: x });', xy, KEYS)).toBeUndefined()
    // A spread's place decides which value wins: `{ ...base, ...opts }` and `{ ...opts, ...base }` differ.
    const SPREAD = { line: 'const res = await fetch(url, { ...base, ...opts });', example: 'const res = await apiRequest(url, { ...base, ...opts });' }
    const sx = capKnownNames(['@@ -1,2 +1,2 @@\n+const opts = {}, base = {}, url = "u";\n+const res = await fetch(url, { ...base, ...opts });'])
    expect(cap('const res = await apiRequest(url, { ...opts, ...base });', sx, SPREAD)).toEqual({ why: 'swap', from: 'base', to: 'opts' })
    const KW = { line: 'hot = requests.get(HOT_API, params=opts, headers=hdrs)', example: 'hot = api_request(HOT_API, params=opts, headers=hdrs)' }
    const kw = capKnownNames(['@@ -1,2 +1,2 @@\n+HOT_API = "u"; opts = {}; hdrs = {}\n+hot = requests.get(HOT_API, params=opts, headers=hdrs)'])
    expect(cap('hot = api_request(HOT_API, headers=hdrs, params=opts)', kw, KW, 'api_request', 'py')).toBeUndefined()
    expect(cap('hot = api_request(HOT_API, params=hdrs, headers=opts)', kw, KW, 'api_request', 'py')).toEqual({ why: 'swap', from: 'opts', to: 'hdrs' })
    const POS = { line: 'hot = requests.get(HOT_API, opts)', example: 'hot = api_request(HOT_API, opts)' }
    expect(cap('hot = api_request(opts, HOT_API)', kw, POS, 'api_request', 'py')).toEqual({ why: 'swap', from: 'HOT_API', to: 'opts' })
    const MINUS = { line: "console.log('left', total - used);", example: "log.info('left', total - used);" }
    const tu = capKnownNames(['@@ -1,2 +1,2 @@\n+const total = 3, used = 1;\n+console.log(\'left\', total - used);'])
    expect(cap("log.info('left', used - total);", tu, MINUS, 'log.info')).toEqual({ why: 'swap', from: 'total', to: 'used' })
  })

  test('the old way left is a name the rule says not to use, only: a value the example builds otherwise (new Date, str, String) is no old way, and a rule with nothing to avoid has none', () => {
    expect(ruleAvoidsOf(RULES, 'apiRequest')).toEqual(['fetch', 'requests'])
    expect(ruleAvoidsOf(RULES, 'log.info')).toEqual(['console.log', 'print'])
    expect(ruleAvoidsOf(RULES, 'toDateText')).toEqual([])
    expect(ruleAvoidsOf(RULES, 'config')).toEqual(['process.env', 'os.environ'])
    expect(ruleAvoidsOf(['기록은 `console.log` 대신 `log.info`로 남긴다. `console.log`는 테스트에서 써도 된다'], 'log.info')).toEqual([])
    const DATE = { line: "  const label = new Date(at).toLocaleDateString('ko-KR');", example: '  const label = toDateText(at);' }
    const dk = capKnownNames([], "import { toDateText } from './date.js';\nexport function label(at) {\n  const label = new Date(at).toLocaleDateString('ko-KR');\n  return label;\n}\n")
    for (const mine of ['const label = toDateText(new Date(at));', 'const label = toDateText(new Date(at).getTime());', 'const label = toDateText(at);'])
      expect([mine, cap(mine, dk, DATE, 'toDateText')]).toEqual([mine, undefined])
    const PYD = { line: 'day = ends_at.date().isoformat()', example: 'day = to_date_text(ends_at)' }
    const pk = capKnownNames([], 'from datetime import datetime\nfrom dates import to_date_text\nday = ends_at.date().isoformat()\n')
    expect(cap('day = to_date_text(datetime.fromisoformat(str(ends_at)))', pk, PYD, 'to_date_text', 'py')).toBeUndefined()
    const STR = { line: "    print('total: ' + str(total))", example: "    log.info('total: %s', total)" }
    const sk = capKnownNames([], "from log import log\ndef report(total):\n    print('total: ' + str(total))\n")
    expect(cap("log.info('total: ' + str(total))", sk, STR, 'log.info', 'py')).toBeUndefined()
    expect(cap("log.info('total: ' + str(total)); print(total)", sk, STR, 'log.info', 'py')).toEqual({ why: 'rule-old', name: 'print' })
    // With no rule read (no team file at grading), nothing is held as the old way: the other checks still are.
    expect(ruleGradeCap(FETCH, 'apiRequest', 'const res = await apiRequest(url, opts) || await fetch(url);', KNOWN_JS, 'js', '', [])).toBeUndefined()
  })

  test('strings compare by what they hold (escapes read, quote kind aside); a cap shows what the line wrote, cut at 16 characters', () => {
    const ESC = { line: "console.log('it\\'s done');", example: "log.info('it\\'s done');" }
    const ek = capKnownNames([], "import { log } from './log.js';\nconsole.log('it\\'s done');\n")
    expect(cap('log.info("it\'s done");', ek, ESC, 'log.info')).toBeUndefined()
    expect(cap('log.info(`it\'s done`);', ek, ESC, 'log.info')).toBeUndefined()
    expect(cap('log.info("it is done");', ek, ESC, 'log.info')).toEqual({ why: 'swap', from: "'it\\'s done'", to: '"it is done"' })
    const NUM = { line: "console.log('w', 5000);", example: "log.info('w', 5000);" }
    expect(cap("log.info('w', 5e3);", ek, NUM, 'log.info')).toBeUndefined()
    expect(cap("log.info('w', 5_001);", ek, NUM, 'log.info')).toEqual({ why: 'swap', from: '5000', to: '5_001' })
    expect(ruleCapText({ why: 'swap', from: "'expired holds:'", to: "'expired:'" })).toBe("규칙 밖에서 바뀐 곳이 있습니다: `'expired holds:'` → `'expired:'`")
    expect(ruleCapText({ why: 'name', name: 'config.FREE_SHIPPING_THRESHOLD' })).toBe('이 노트의 코드에 없는 이름입니다: `config.FREE_SHI…`')
    expect(RULE_CAP_NUDGE).toBe('고칠 줄과 견주어 규칙 말고 바뀐 곳을 찾아보세요')
  })

  test('the languages\' own names are never held against a line: Python builtins and exceptions, browser and Node globals, TS lib types; a function\'s parameters are the line\'s own; a project word is not given', () => {
    for (const name of ['ascii', 'repr', 'NotImplementedError', 'TimeoutError', 'PermissionError', 'memoryview', 'breakpoint']) expect([name, GIVEN_NAMES.py.has(name)]).toEqual([name, true])
    for (const name of ['innerWidth', 'requestAnimationFrame', 'Event', 'FileReader', 'ReadonlyArray', 'PropertyKey', 'structuredClone', 'WebAssembly']) expect([name, GIVEN_NAMES.js.has(name)]).toEqual([name, true])
    for (const name of ['name', 'status', 'path', 'fs', 'os', 'url', 'options', 'data', 'config']) expect([name, GIVEN_NAMES.js.has(name) || GIVEN_NAMES.py.has(name)]).toEqual([name, false])
    const LOG = { line: "console.log('w', width);", example: "log.info('w', width);" }
    const lk = capKnownNames([], "import { log } from './log.js';\nconsole.log('w', width);\n")
    expect(cap("log.info('w', width ?? innerWidth);", lk, LOG, 'log.info')).toBeUndefined()
    const IDS = { line: "console.log('ids', rows.map(r => r.id));", example: "log.info('ids', rows.map(r => r.id));" }
    const ik = capKnownNames([], "import { log } from './log.js';\nconsole.log('ids', rows.map(r => r.id));\n")
    expect(cap("log.info('ids', rows.map(function (it) { return it.id; }));", ik, IDS, 'log.info')).toBeUndefined()
    expect(cap("log.info('ids', rows.map(function (it) { return item.id; }));", ik, IDS, 'log.info')).toEqual({ why: 'name', name: 'item' })
    const PYB = { line: "    print('bad', x)", example: "    log.info('bad', x)" }
    const bk = capKnownNames([], "from log import log\ndef f(x):\n    print('bad', x)\n")
    expect(cap("log.info('bad', ascii(x))", bk, PYB, 'log.info', 'py')).toBeUndefined()
  })

  test('a right line in another shape is never capped: spread, keys, a template, a name only in the file, a global, a regular expression, TS types, String()', () => {
    const known = capKnownNames([DIFF_JS], `${FILE_JS}\nconst fallback = { retry: 2 };\n`)
    for (const mine of [
      'const res = await apiRequest(url, { ...opts });',
      'const res = await apiRequest(url, { ...opts, headers: opts.headers });',
      'const res = await apiRequest(`${BASE}/items/${id}`, opts);',
      'const res = await apiRequest(url, opts ?? fallback);',
      'const res = await apiRequest(url, opts) as Response;',
      'const res: Response = await apiRequest(url, opts);',
      'const res = await apiRequest<Record<string, unknown>>(url, opts);',
      'const res = await apiRequest(String(url), opts);',
      'const res = await apiRequest(url.replace(/\\/+$/g, ""), opts);',
      'const res = await apiRequest(url, JSON.parse(JSON.stringify(opts)));',
      "const res = await apiRequest(url, opts); // 규칙대로 바꿈",
      'const res = await apiRequest(url, Object.assign({}, opts));',
      'const res = await apiRequest(url, opts).catch((e) => { throw e; });',
    ]) expect([mine, cap(mine, known)]).toEqual([mine, undefined])
  })

  test('Python: keyword arguments, an f-string with a format spec, a lambda, a comprehension and a name bound by the line are names of their own', () => {
    const file = ['from api import api_request', 'from log import log', 'BASE = "https://api.example.test"', 'def total(items, rate):', '    rows = [i for i in items]', '    print(f"total {sum(rows):.2f} at {rate}")', '    return rows', ''].join('\n')
    const diff = ['@@ -0,0 +1,7 @@', ...file.split('\n').slice(0, -1).map(line => `+${line}`)].join('\n')
    const known = capKnownNames([diff], file)
    const drill = { line: 'print(f"total {sum(rows):.2f} at {rate}")', example: 'log.info(f"total {sum(rows):.2f} at {rate}")' }
    for (const mine of [
      "log.info(f'total {sum(rows):.2f} at {rate}')",
      'log.info(f"total {sum(r for r in rows):.2f} at {rate}")',
      'log.info(f"total {sum(map(lambda r: r, rows)):.2f} at {rate}")',
      'log.info(f"total {sum(rows):.2f} at {rate!r}")',
      'log.info("total %.2f at %s", sum(rows), rate)',
      'log.info(f"total {round(sum(rows), ndigits=2)} at {rate}")',
    ]) expect([mine, ruleGradeCap(drill, 'log.info', mine, known, 'py', file)]).toEqual([mine, undefined])
    expect(ruleGradeCap(drill, 'log.info', 'log.info(f"total {sum(row):.2f} at {rate}")', known, 'py', file)).toEqual({ why: 'name', name: 'row' })
    expect(ruleGradeCap(drill, 'log.info', 'print(f"total {sum(rows):.2f}")', known, 'py', file)).toEqual({ why: 'rule-use', name: 'log.info' })
    expect(ruleGradeCap(drill, 'log.info', 'log.info(f"total {sum(rows):.2f} at {rate}"); print(rows)', known, 'py', file, ruleAvoidsOf(RULES, 'log.info'))).toEqual({ why: 'rule-old', name: 'print' })
    // A file that imports every name of a module reads no name as unknown.
    expect(ruleGradeCap(drill, 'log.info', 'log.info(f"total {sum(row):.2f} at {rate}")', known, 'py', `from helpers import *\n${file}`)).toBeUndefined()
  })

  test('a member of the rule\'s object the note\'s code never shows is a name it does not have; one the code shows is right', () => {
    const drill = { line: 'const goal = Number(process.env.FREE_SHIP_AT);', example: 'const goal = Number(config.FREE_SHIP_AT);' }
    const known = capKnownNames(['@@ -0,0 +1,2 @@\n+import { config } from "./config.js";\n+const goal = Number(process.env.FREE_SHIP_AT);'])
    expect(ruleGradeCap(drill, 'config', 'const goal = Number(config.FREE_SHIP);', known, 'js')).toEqual({ why: 'name', name: 'config.FREE_SHIP' })
    expect(ruleGradeCap(drill, 'config', 'const goal = Number(config.FREE_SHIP_AT);', known, 'js')).toBeUndefined()
    expect(ruleGradeCap(drill, 'config', 'const goal = +config.FREE_SHIP_AT;', known, 'js')).toBeUndefined()
    expect(ruleGradeCap(drill, 'config', 'const goal = Number(process.env.FREE_SHIP_AT ?? config.FREE_SHIP_AT);', known, 'js', '', ruleAvoidsOf(RULES, 'config'))).toEqual({ why: 'rule-old', name: 'process' })
  })

  test('nameCode and usedNames: strings, comments and regular expressions are no names; a template\'s and an f-string\'s code is', () => {
    expect(nameCode('log.info(`n ${count} of ${total}`) // done', 'js').replace(/\s+/g, ' ').trim()).toBe('log.info( count total )')
    expect(usedNames("send(`/a/${id}`, { retry: n }, 'x y')", 'js')).toEqual(['send', 'id', 'n'])
    expect(usedNames('f(rows, key=lambda r: r[0], reverse=True)', 'py')).toEqual(['f', 'rows', 'lambda', 'True'])
    expect(usedNames('const [a, b] = pair.split(sep).map((s) => s.trim())', 'js')).toEqual(['const', 'pair', 'sep'])
    expect(usedNames('a, b = split(text)', 'py')).toEqual(['split', 'text'])
    expect(usedNames('const n = 1e5 + 0x1f', 'js')).toEqual(['const'])
  })

  test('ruleFixUse reads the use name a made practice\'s check names, nothing else', () => {
    expect(ruleFixUse(ruleFixCheck('log.info'))).toBe('log.info')
    expect(ruleFixUse('`fetchUser(1)` → 사용자')).toBeUndefined()
  })
})
