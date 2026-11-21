// The calc engine of 생각해 보기 (1.13.0 G5e, the plan's module layout): a module of its own, so that hooks/notes.ts
// stays under the engine's 1,048,576-byte module limit and its top-level names never meet hooks/newrun.ts's (G2's
// evaluator, whose names it shares). hooks/notes.ts imports what it uses by name (no `export *`); tests import calc's
// own names from here. Pure: no `$`, no Node, no network. This whole file is G5's engine (its sha256 is the one
// d26Procedure.g5Sonnet keeps).

// ---------------------------------------------------------------------------------------------------------------
// calc (1.13.0 G5e): a closed evaluator for the short js/ts/py functions a 생각해 보기 calls. Pure: no eval, no
// Function, no Node, no network. A js value is the host's own and its builtins run through an allowlist (so js
// arithmetic, parseInt, toFixed, Math.round are the engine's own); python is emulated (ints BigInt, floats IEEE
// doubles, repr, round and f-format ported from a port checked against python3). Anything outside its grammar or
// its budget is 'unknown', and an unknown makes no claim.
// ---------------------------------------------------------------------------------------------------------------

/** Steps one run may take (a statement, a call, a loop turn each), and one pick's runs together. */
export const CALC_STEP_MAX = 20000
export const CALC_PICK_STEPS = 400000
/** A safety net only (steps and sizes bound every run first): one run gives up after this many ms, one pick after CALC_PICK_MS. */
export const CALC_RUN_MS = 250
export const CALC_PICK_MS = 1500
/** The longest string a regex may run over (with isSafeRegex, no run over it can take long). */
const CALC_REGEX_SUBJECT_MAX = 1000
/** A value calc renders at most (its strings' characters and its items together): a larger one is unknown. */
const CALC_SHOW_MAX = 20000
/** Calls deep, items one value may hold, digits a python int may grow to: past any, the run is unknown. */
const CALC_DEPTH_MAX = 64
const CALC_SIZE_MAX = 10000
const CALC_PY_DIGITS = 30

export type CalcLang = 'js' | 'py'
/** One condition met on a run: its source span and what it came to. */
export type CalcCond = { s: number; e: number; v: boolean }
/** What a run left to explain it: its conditions in order, its loops' turns, its last return and what it read. */
export type CalcTrace = { conds: CalcCond[]; loops: { s: number; e: number; n: number }[]; ret?: { s: number; e: number; names: [string, string][] }; err?: { s: number; e: number }; steps?: number }
export type CalcResult =
  | { kind: 'value'; value: unknown; show: string; trace: CalcTrace }
  | { kind: 'error'; name: string; trace: CalcTrace }
  | { kind: 'unknown'; why: string }

class CalcUnknown {
  constructor(readonly why: string) {}
}
class CalcThrow {
  constructor(
    readonly name: string,
    readonly value?: unknown,
  ) {}
}
function calcNo(why: string): never {
  throw new CalcUnknown(why)
}

type CTok = { t: 'id' | 'num' | 'str' | 'tmpl' | 're' | 'op' | 'nl' | 'in' | 'de' | 'eof'; v: string; s: number; e: number; nl: boolean; x?: any }
type CNode = { k: string; s: number; e: number; [key: string]: any }

const ASTRAL = /[\uD800-\uDFFF]/

// ------------------------------------------------------------------ js tokens

const JS_PUNCT = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '??=', '&&=', '||=', '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '**', '<<', '>>', '&=', '|=', '^=']
const JS_ONE = '{}()[];,<>+-*/%&|^!~?:=.@#'
const JS_NUM = /(?:0[xX][\da-fA-F](?:_?[\da-fA-F])*|0[bB][01](?:_?[01])*|0[oO][0-7](?:_?[0-7])*|(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?)(n?)/y
const JS_ID = /[A-Za-z_$][\w$]*/y
/** Words after which a `/` opens a regex, not a division. */
const JS_RE_AFTER = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do', 'instanceof', 'yield', 'await'])

function jsEscape(src: string, i: number): [string, number] {
  const c = src[i]
  const simple: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', '\n': '' }
  if (c === undefined) calcNo('escape')
  if (c in simple) return [simple[c]!, i + 1]
  if (c === '0' && !/\d/.test(src[i + 1] ?? '')) return ['\0', i + 1]
  if (/\d/.test(c)) calcNo('octal escape')
  if (c === 'x') {
    const h = /^[\da-fA-F]{2}/.exec(src.slice(i + 1, i + 3))
    if (!h) calcNo('escape')
    return [String.fromCharCode(parseInt(h[0], 16)), i + 3]
  }
  if (c === 'u') {
    const braced = /^\{([\da-fA-F]{1,6})\}/.exec(src.slice(i + 1, i + 9))
    if (braced) {
      const code = parseInt(braced[1]!, 16)
      if (code > 0xffff) calcNo('astral')
      return [String.fromCharCode(code), i + 1 + braced[0].length]
    }
    const h = /^[\da-fA-F]{4}/.exec(src.slice(i + 1, i + 5))
    if (!h) calcNo('escape')
    return [String.fromCharCode(parseInt(h[0], 16)), i + 5]
  }
  return [c, i + 1]
}

function jsQuoted(src: string, i: number, to: number): [string, number] {
  const q = src[i]
  let out = ''
  i++
  while (i < to) {
    const c = src[i]!
    if (c === q) return [out, i + 1]
    if (c === '\n') calcNo('string')
    if (c === '\\') {
      const [v, n] = jsEscape(src, i + 1)
      out += v
      i = n
      continue
    }
    out += c
    i++
  }
  return calcNo('string')
}

/** A template literal from its backtick: cooked strings and each `${…}` as its source span. */
function jsTemplate(src: string, i: number, to: number): [{ strs: string[]; exprs: [number, number][] }, number] {
  const strs: string[] = []
  const exprs: [number, number][] = []
  let cur = ''
  i++
  while (i < to) {
    const c = src[i]!
    if (c === '`') {
      strs.push(cur)
      return [{ strs, exprs }, i + 1]
    }
    if (c === '\\') {
      const [v, n] = jsEscape(src, i + 1)
      cur += v
      i = n
      continue
    }
    if (c === '$' && src[i + 1] === '{') {
      strs.push(cur)
      cur = ''
      const from = i + 2
      let depth = 0
      let k = from
      for (; k < to; k++) {
        const d = src[k]!
        if (d === "'" || d === '"') k = jsQuoted(src, k, to)[1] - 1
        else if (d === '`') k = jsTemplate(src, k, to)[1] - 1
        else if (d === '{') depth++
        else if (d === '}') {
          if (depth === 0) break
          depth--
        }
      }
      if (k >= to) calcNo('template')
      exprs.push([from, k])
      i = k + 1
      continue
    }
    cur += c
    i++
  }
  return calcNo('template')
}

function jsTokens(src: string, from: number, to: number): CTok[] {
  const out: CTok[] = []
  let i = from
  let nl = false
  const push = (t: CTok['t'], v: string, s: number, x?: unknown) => {
    out.push({ t, v, s, e: i, nl, x })
    nl = false
  }
  while (i < to) {
    const c = src[i]!
    if (c === '\n') {
      nl = true
      i++
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === '\u00a0' || c === '\ufeff') {
      i++
      continue
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < to && src[i] !== '\n') i++
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2)
      if (end === -1 || end >= to) calcNo('comment')
      if (src.slice(i, end).includes('\n')) nl = true
      i = end + 2
      continue
    }
    const s = i
    JS_ID.lastIndex = i
    const id = JS_ID.exec(src)
    if (id) {
      i += id[0].length
      push('id', id[0], s)
      continue
    }
    if (/\d/.test(c) || (c === '.' && /\d/.test(src[i + 1] ?? ''))) {
      JS_NUM.lastIndex = i
      const num = JS_NUM.exec(src)
      if (!num) calcNo('number')
      if (num[1] === 'n' || /^0\d/.test(num[0])) calcNo('number kind')
      i += num[0].length
      push('num', num[0], s, Number(num[0].replace(/_/g, '')))
      continue
    }
    if (c === '"' || c === "'") {
      const [v, n] = jsQuoted(src, i, to)
      i = n
      push('str', v, s)
      continue
    }
    if (c === '`') {
      const [v, n] = jsTemplate(src, i, to)
      i = n
      push('tmpl', '`', s, v)
      continue
    }
    const prev = out.at(-1)
    if (c === '/' && (prev === undefined || (prev.t === 'op' && !')]}'.includes(prev.v)) || (prev.t === 'id' && JS_RE_AFTER.has(prev.v)))) {
      let k = i + 1
      let isClass = false
      for (; k < to; k++) {
        const d = src[k]!
        if (d === '\n') calcNo('regex')
        if (d === '\\') k++
        else if (d === '[') isClass = true
        else if (d === ']') isClass = false
        else if (d === '/' && !isClass) break
      }
      const flags = /^[a-z]*/.exec(src.slice(k + 1, to))![0]
      if (!/^[gimsu]*$/.test(flags)) calcNo('regex flags')
      const source = src.slice(i + 1, k)
      if (!isSafeRegex(source)) calcNo('regex shape')
      try {
        new RegExp(source, flags)
      } catch {
        calcNo('regex')
      }
      i = k + 1 + flags.length
      push('re', source, s, flags)
      continue
    }
    const p = JS_PUNCT.find(one => src.startsWith(one, i))
    if (p) {
      i += p.length
      push('op', p, s)
      continue
    }
    if (JS_ONE.includes(c)) {
      i++
      push('op', c, s)
      continue
    }
    calcNo(`char ${c}`)
  }
  out.push({ t: 'eof', v: '', s: to, e: to, nl: true })
  return out
}

// ------------------------------------------------------------------ js parser

const JS_BIN: Record<string, number> = { '??': 1, '||': 2, '&&': 3, '|': 4, '^': 5, '&': 6, '==': 7, '!=': 7, '===': 7, '!==': 7, '<': 8, '>': 8, '<=': 8, '>=': 8, instanceof: 8, in: 8, '<<': 9, '>>': 9, '>>>': 9, '+': 10, '-': 10, '*': 11, '/': 11, '%': 11, '**': 12 }
const JS_ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=', '||=', '??='])

class JsParser {
  i = 0
  constructor(
    readonly src: string,
    readonly toks: CTok[],
  ) {}
  get p(): CTok {
    return this.toks[this.i]!
  }
  at(n: number): CTok {
    return this.toks[Math.min(this.i + n, this.toks.length - 1)]!
  }
  is(v: string, t?: CTok['t']): boolean {
    const p = this.p
    return p.v === v && (t ? p.t === t : p.t === 'op' || p.t === 'id')
  }
  eat(v: string): boolean {
    if (!this.is(v)) return false
    this.i++
    return true
  }
  want(v: string): void {
    if (!this.eat(v)) calcNo(`expected ${v}`)
  }
  name(): string {
    const p = this.p
    if (p.t !== 'id') calcNo('expected name')
    this.i++
    return p.v
  }
  node(k: string, s: number, more: Record<string, unknown>): CNode {
    return { k, s, e: this.toks[this.i - 1]?.e ?? s, ...more }
  }
  semi(): void {
    if (this.eat(';')) return
    if (this.p.t === 'eof' || this.is('}') || this.p.nl) return
    calcNo('statement end')
  }
  program(): CNode[] {
    const out: CNode[] = []
    while (this.p.t !== 'eof') out.push(this.statement())
    return out
  }
  /** A ts type, skipped: up to a token at depth 0 that cannot go on with it. */
  skipType(stops: string[]): void {
    let depth = 0
    let isExpect = true
    for (;;) {
      const p = this.p
      if (p.t === 'eof') calcNo('type')
      if (depth === 0 && !isExpect && p.t === 'op' && stops.includes(p.v)) return
      if (depth === 0 && p.t === 'op' && p.v === '=>' && !stops.includes('=>')) {
        this.i++
        isExpect = true
        continue
      }
      if (p.t === 'op' && '([{<'.includes(p.v)) depth++
      else if (p.t === 'op' && ')]}>'.includes(p.v)) {
        if (depth === 0) return
        depth--
      } else if (p.t === 'op' && p.v === '>>') depth -= 2
      this.i++
      isExpect = depth > 0 || (p.t === 'op' && ['|', '&', ',', ':', '=>', '?', 'keyof', '.'].includes(p.v)) || (p.t === 'id' && ['keyof', 'typeof', 'readonly'].includes(p.v))
    }
  }
  skipBraces(): void {
    while (!this.is('{')) {
      if (this.p.t === 'eof') calcNo('braces')
      this.i++
    }
    let depth = 0
    do {
      if (this.is('{')) depth++
      else if (this.is('}')) depth--
      this.i++
    } while (depth > 0 && this.p.t !== 'eof')
  }
  block(): CNode {
    const s = this.p.s
    this.want('{')
    const body: CNode[] = []
    while (!this.is('}')) {
      if (this.p.t === 'eof') calcNo('block')
      body.push(this.statement())
    }
    this.want('}')
    return this.node('block', s, { body })
  }
  statement(): CNode {
    const p = this.p
    const s = p.s
    if (p.t === 'op' && p.v === '{') return this.block()
    if (p.t === 'op' && p.v === ';') {
      this.i++
      return this.node('empty', s, {})
    }
    if (p.t === 'id') {
      switch (p.v) {
        case 'export':
          this.i++
          this.eat('default')
          return this.statement()
        case 'import':
          while (!this.p.nl || this.p === p) {
            if (this.p.t === 'eof' || this.is(';')) break
            this.i++
          }
          this.eat(';')
          return this.node('empty', s, {})
        case 'type':
        case 'interface':
          if (this.at(1).t === 'id') {
            this.i += 2
            if (p.v === 'interface') this.skipBraces()
            else {
              if (this.is('<')) this.skipType(['='])
              this.want('=')
              this.skipType([';'])
              this.semi()
            }
            return this.node('empty', s, {})
          }
          break
        case 'const':
        case 'let':
        case 'var':
          if (this.at(1).t === 'id' || this.at(1).v === '[' || this.at(1).v === '{') {
            const d = this.declaration()
            this.semi()
            return d
          }
          break
        case 'function': {
          this.i++
          if (this.is('*')) calcNo('generator')
          const name = this.name()
          return this.node('fdecl', s, { name, fn: this.functionRest(s, name) })
        }
        case 'async':
        case 'class':
        case 'enum':
        case 'namespace':
        case 'declare':
        case 'abstract':
        case 'with':
        case 'label':
          if (p.v !== 'async' || this.at(1).v === 'function' || this.at(1).v === '(' || this.at(1).t === 'id') calcNo(p.v)
          break
        case 'if': {
          this.i++
          this.want('(')
          const test = this.expression()
          this.want(')')
          const then = this.statement()
          const other = this.eat('else') ? this.statement() : undefined
          return this.node('if', s, { test, then, other })
        }
        case 'for':
          return this.forStatement()
        case 'while': {
          this.i++
          this.want('(')
          const test = this.expression()
          this.want(')')
          return this.node('while', s, { test, body: this.statement() })
        }
        case 'do': {
          this.i++
          const body = this.statement()
          this.want('while')
          this.want('(')
          const test = this.expression()
          this.want(')')
          this.eat(';')
          return this.node('dowhile', s, { test, body })
        }
        case 'return': {
          this.i++
          const arg = this.p.t === 'eof' || this.is(';') || this.is('}') || this.p.nl ? undefined : this.expression()
          this.semi()
          return this.node('return', s, { arg })
        }
        case 'break':
        case 'continue':
          this.i++
          if (this.p.t === 'id' && !this.p.nl) calcNo('label')
          this.semi()
          return this.node(p.v, s, {})
        case 'throw': {
          this.i++
          const arg = this.expression()
          this.semi()
          return this.node('throw', s, { arg })
        }
        case 'try': {
          this.i++
          const body = this.block()
          let param: CNode | undefined
          let handler: CNode | undefined
          let finalizer: CNode | undefined
          if (this.eat('catch')) {
            if (this.eat('(')) {
              param = this.pattern()
              if (this.eat(':')) this.skipType([')'])
              this.want(')')
            }
            handler = this.block()
          }
          if (this.eat('finally')) finalizer = this.block()
          if (!handler && !finalizer) calcNo('try')
          return this.node('try', s, { body, param, handler, finalizer })
        }
        case 'switch': {
          this.i++
          this.want('(')
          const disc = this.expression()
          this.want(')')
          this.want('{')
          const cases: { test?: CNode; body: CNode[] }[] = []
          while (!this.eat('}')) {
            let test: CNode | undefined
            if (this.eat('case')) test = this.expression()
            else this.want('default')
            this.want(':')
            const body: CNode[] = []
            while (!this.is('case') && !this.is('default') && !this.is('}')) {
              if (this.p.t === 'eof') calcNo('switch')
              body.push(this.statement())
            }
            cases.push({ test, body })
          }
          return this.node('switch', s, { disc, cases })
        }
      }
      if (this.at(1).t === 'op' && this.at(1).v === ':' && !['default', 'case'].includes(p.v)) calcNo('label')
    }
    const expr = this.expression()
    this.semi()
    return this.node('expr', s, { expr })
  }
  forStatement(): CNode {
    const s = this.p.s
    this.want('for')
    if (this.is('await')) calcNo('for await')
    this.want('(')
    let init: CNode | undefined
    if ((this.is('const') || this.is('let') || this.is('var')) && (this.at(1).t === 'id' || this.at(1).v === '[' || this.at(1).v === '{')) {
      const kind = this.p.v
      const save = this.i
      this.i++
      const target = this.pattern()
      if (this.is('of') || this.is('in')) {
        const isOf = this.p.v === 'of'
        this.i++
        const right = isOf ? this.assign() : this.expression()
        this.want(')')
        return this.node(isOf ? 'forof' : 'forin', s, { kind, target, right, body: this.statement() })
      }
      this.i = save
      init = this.declaration()
    } else if (!this.is(';')) {
      const save = this.i
      const left = this.unary()
      if (this.is('of') || this.is('in')) {
        const isOf = this.p.v === 'of'
        this.i++
        const right = isOf ? this.assign() : this.expression()
        this.want(')')
        return this.node(isOf ? 'forof' : 'forin', s, { kind: '', target: left, right, body: this.statement() })
      }
      this.i = save
      init = this.node('expr', this.p.s, { expr: this.expression() })
    }
    this.want(';')
    const test = this.is(';') ? undefined : this.expression()
    this.want(';')
    const update = this.is(')') ? undefined : this.expression()
    this.want(')')
    return this.node('for', s, { init, test, update, body: this.statement() })
  }
  declaration(): CNode {
    const s = this.p.s
    const kind = this.name()
    const decls: { target: CNode; init?: CNode }[] = []
    do {
      const target = this.pattern()
      if (this.is('!')) this.i++
      if (this.eat(':')) this.skipType(['=', ',', ';', ')'])
      const init = this.eat('=') ? this.assign() : undefined
      decls.push({ target, init })
    } while (this.eat(','))
    return this.node('var', s, { kind, decls })
  }
  pattern(): CNode {
    const s = this.p.s
    if (this.eat('[')) {
      const items: (CNode | null)[] = []
      while (!this.eat(']')) {
        if (this.is(',')) {
          this.i++
          items.push(null)
          continue
        }
        if (this.eat('...')) items.push(this.node('rest', s, { arg: this.pattern() }))
        else items.push(this.patternDefault())
        if (!this.is(']')) this.want(',')
      }
      return this.node('parr', s, { items })
    }
    if (this.eat('{')) {
      const props: { key: string; value: CNode }[] = []
      while (!this.eat('}')) {
        if (this.is('...')) calcNo('object rest')
        const ks = this.p.s
        const key = this.p.t === 'str' ? (this.i++, this.toks[this.i - 1]!.v) : this.name()
        const value = this.eat(':') ? this.patternDefault() : this.withDefault(this.node('name', ks, { name: key }))
        props.push({ key, value })
        if (!this.is('}')) this.want(',')
      }
      return this.node('pobj', s, { props })
    }
    return this.node('name', s, { name: this.name() })
  }
  patternDefault(): CNode {
    return this.withDefault(this.pattern())
  }
  withDefault(target: CNode): CNode {
    if (!this.eat('=')) return target
    return this.node('pdef', target.s, { target, init: this.assign() })
  }
  params(): CNode[] {
    this.want('(')
    const out: CNode[] = []
    while (!this.eat(')')) {
      if (this.is('...')) calcNo('rest parameter')
      if (this.is('this')) calcNo('this parameter')
      const target = this.pattern()
      this.eat('?')
      if (this.eat(':')) this.skipType([',', ')', '='])
      out.push(this.withDefault(target))
      if (!this.is(')')) this.want(',')
    }
    return out
  }
  functionRest(s: number, name: string): CNode {
    if (this.is('<')) this.skipType(['('])
    const params = this.params()
    if (this.eat(':')) this.skipType(['{'])
    const body = this.block()
    return this.node('func', s, { name, params, body, isExpr: false })
  }
  expression(): CNode {
    const s = this.p.s
    const first = this.assign()
    if (!this.is(',')) return first
    const list = [first]
    while (this.eat(',')) list.push(this.assign())
    return this.node('seq', s, { list })
  }
  /** Whether an arrow function starts here: `x =>` or `( … ) =>` (a return type allowed). */
  isArrow(): boolean {
    if (this.p.t === 'id' && this.at(1).v === '=>' && this.at(1).t === 'op') return true
    if (!this.is('(')) return false
    let depth = 0
    for (let k = this.i; k < this.toks.length; k++) {
      const t = this.toks[k]!
      if (t.t === 'eof') return false
      if (t.t === 'op' && '([{'.includes(t.v)) depth++
      else if (t.t === 'op' && ')]}'.includes(t.v)) {
        depth--
        if (depth === 0) {
          const next = this.toks[k + 1]!
          if (next.t === 'op' && next.v === '=>') return true
          if (next.t === 'op' && next.v === ':') {
            for (let m = k + 2; m < this.toks.length && m < k + 40; m++) {
              const u = this.toks[m]!
              if (u.t === 'op' && u.v === '=>') return true
              if (u.t === 'eof' || (u.t === 'op' && [';', '{', '}'].includes(u.v) && this.toks[m - 1]!.v !== ':')) return false
            }
          }
          return false
        }
      }
    }
    return false
  }
  arrow(): CNode {
    const s = this.p.s
    let params: CNode[]
    if (this.p.t === 'id') params = [this.node('name', s, { name: this.name() })]
    else {
      params = this.params()
      if (this.eat(':')) this.skipType(['=>'])
    }
    this.want('=>')
    if (this.is('{')) return this.node('func', s, { name: '', params, body: this.block(), isExpr: false, isArrow: true })
    return this.node('func', s, { name: '', params, body: this.assign(), isExpr: true, isArrow: true })
  }
  assign(): CNode {
    if (this.is('async') && (this.at(1).v === '(' || this.at(1).t === 'id' || this.at(1).v === 'function')) calcNo('async')
    if (this.is('yield')) calcNo('yield')
    if (this.isArrow()) return this.arrow()
    const s = this.p.s
    const left = this.conditional()
    if (this.p.t === 'op' && JS_ASSIGN.has(this.p.v)) {
      const op = this.p.v
      this.i++
      const right = this.assign()
      const target = op === '=' && (left.k === 'arr' || left.k === 'obj') ? this.toPattern(left) : left
      if (!['name', 'member', 'index', 'parr', 'pobj'].includes(target.k)) calcNo('assignment target')
      return this.node('assign', s, { op, target, right })
    }
    return left
  }
  toPattern(node: CNode): CNode {
    if (node.k === 'name' || node.k === 'member' || node.k === 'index') return node
    if (node.k === 'arr') return { ...node, k: 'parr', items: node.items.map((one: CNode | null) => (one === null ? null : one.k === 'spread' ? { ...one, k: 'rest', arg: this.toPattern(one.arg) } : this.toPattern(one))) }
    if (node.k === 'assign' && node.op === '=') return { ...node, k: 'pdef', target: this.toPattern(node.target), init: node.right }
    if (node.k === 'obj') return { ...node, k: 'pobj', props: node.props.map((one: { key: string | CNode; value: CNode; kind: string }) => (typeof one.key !== 'string' || one.kind !== 'init' ? calcNo('pattern') : { key: one.key, value: this.toPattern(one.value) })) }
    return calcNo('pattern')
  }
  conditional(): CNode {
    const s = this.p.s
    const test = this.binary(0)
    if (!this.eat('?')) return test
    const then = this.assign()
    this.want(':')
    const other = this.assign()
    return this.node('cond', s, { test, then, other })
  }
  binary(min: number): CNode {
    const s = this.p.s
    let left = this.unary()
    for (;;) {
      const p = this.p
      if (p.t === 'id' && p.v === 'as') {
        this.i++
        if (this.eat('const')) continue
        this.typeAtom()
        continue
      }
      if (p.t === 'id' && p.v === 'satisfies') calcNo('satisfies')
      const prec = (p.t === 'op' || (p.t === 'id' && (p.v === 'in' || p.v === 'instanceof'))) && Object.hasOwn(JS_BIN, p.v) ? JS_BIN[p.v]! : -1
      if (prec < 0 || prec <= min) break
      this.i++
      const right = p.v === '**' ? this.binary(prec - 1) : this.binary(prec)
      const k = p.v === '&&' || p.v === '||' || p.v === '??' ? 'logic' : 'bin'
      left = this.node(k, s, { op: p.v, left, right })
    }
    return left
  }
  typeAtom(): void {
    if (this.is('(')) {
      this.skipType([])
      return
    }
    this.name()
    while (this.eat('.')) this.name()
    if (this.is('<')) {
      let depth = 0
      do {
        if (this.is('<')) depth++
        else if (this.is('>')) depth--
        else if (this.is('>>')) depth -= 2
        this.i++
      } while (depth > 0 && this.p.t !== 'eof')
    }
    while (this.is('[') && this.at(1).v === ']') this.i += 2
  }
  unary(): CNode {
    const p = this.p
    const s = p.s
    if (p.t === 'op' && ['!', '-', '+', '~'].includes(p.v)) {
      this.i++
      return this.node('unary', s, { op: p.v, arg: this.unary() })
    }
    if (p.t === 'op' && (p.v === '++' || p.v === '--')) {
      this.i++
      const arg = this.unary()
      if (!['name', 'member', 'index'].includes(arg.k)) calcNo('update target')
      return this.node('update', s, { op: p.v, arg, prefix: true })
    }
    if (p.t === 'id' && p.v === 'typeof') {
      this.i++
      return this.node('unary', s, { op: 'typeof', arg: this.unary() })
    }
    if (p.t === 'id' && ['void', 'delete', 'await'].includes(p.v)) calcNo(p.v)
    if (p.t === 'op' && p.v === '<') calcNo('type cast')
    const arg = this.postfix()
    if (this.p.t === 'op' && (this.p.v === '++' || this.p.v === '--') && !this.p.nl) {
      if (!['name', 'member', 'index'].includes(arg.k)) calcNo('update target')
      this.i++
      return this.node('update', s, { op: this.toks[this.i - 1]!.v, arg, prefix: false })
    }
    return arg
  }
  args(): CNode[] {
    this.want('(')
    const out: CNode[] = []
    while (!this.eat(')')) {
      const s = this.p.s
      out.push(this.eat('...') ? this.node('spread', s, { arg: this.assign() }) : this.assign())
      if (!this.is(')')) this.want(',')
    }
    return out
  }
  postfix(): CNode {
    const s = this.p.s
    let e: CNode
    if (this.eat('new')) {
      const callee = this.primary()
      let target = callee
      while (this.eat('.')) target = this.node('member', s, { obj: target, prop: this.name(), opt: false })
      const args = this.is('(') ? this.args() : []
      e = this.node('new', s, { callee: target, args })
    } else e = this.primary()
    for (;;) {
      if (this.eat('.')) {
        if (this.is('#')) calcNo('private')
        e = this.node('member', s, { obj: e, prop: this.name(), opt: false })
      } else if (this.eat('?.')) {
        if (this.is('(')) e = this.node('call', s, { callee: e, args: this.args(), opt: true })
        else if (this.eat('[')) {
          const prop = this.expression()
          this.want(']')
          e = this.node('index', s, { obj: e, prop, opt: true })
        } else e = this.node('member', s, { obj: e, prop: this.name(), opt: true })
      } else if (this.is('[')) {
        this.i++
        const prop = this.expression()
        this.want(']')
        e = this.node('index', s, { obj: e, prop, opt: false })
      } else if (this.is('(')) e = this.node('call', s, { callee: e, args: this.args(), opt: false })
      else if (this.p.t === 'tmpl') calcNo('tagged template')
      else if (this.is('!') && !this.p.nl && (this.at(1).t === 'op' ? ['.', ')', ';', ',', ']', '?.', '['].includes(this.at(1).v) || this.at(1).v === '}' : this.at(1).nl || this.at(1).t === 'eof')) this.i++
      else break
    }
    return e
  }
  primary(): CNode {
    const p = this.p
    const s = p.s
    this.i++
    if (p.t === 'num') return this.node('lit', s, { value: p.x })
    if (p.t === 'str') return this.node('lit', s, { value: p.v })
    if (p.t === 're') return this.node('re', s, { source: p.v, flags: p.x })
    if (p.t === 'tmpl') {
      const x = p.x as { strs: string[]; exprs: [number, number][] }
      const exprs = x.exprs.map(([a, b]) => {
        const sub = new JsParser(this.src, jsTokens(this.src, a, b))
        const one = sub.expression()
        if (sub.p.t !== 'eof') calcNo('template expression')
        return one
      })
      return this.node('tmpl', s, { strs: x.strs, exprs })
    }
    if (p.t === 'id') {
      switch (p.v) {
        case 'true':
          return this.node('lit', s, { value: true })
        case 'false':
          return this.node('lit', s, { value: false })
        case 'null':
          return this.node('lit', s, { value: null })
        case 'undefined':
          return this.node('lit', s, { value: undefined })
        case 'function': {
          if (this.is('*')) calcNo('generator')
          const name = this.p.t === 'id' ? this.name() : ''
          return this.functionRest(s, name)
        }
        case 'this':
        case 'super':
        case 'class':
        case 'arguments':
        case 'import':
          calcNo(p.v)
      }
      return this.node('name', s, { name: p.v })
    }
    if (p.t === 'op' && p.v === '(') {
      const e = this.expression()
      this.want(')')
      return e
    }
    if (p.t === 'op' && p.v === '[') {
      const items: (CNode | null)[] = []
      while (!this.eat(']')) {
        if (this.is(',')) {
          this.i++
          items.push(null)
          continue
        }
        const es = this.p.s
        items.push(this.eat('...') ? this.node('spread', es, { arg: this.assign() }) : this.assign())
        if (!this.is(']')) this.want(',')
      }
      return this.node('arr', s, { items })
    }
    if (p.t === 'op' && p.v === '{') {
      const props: { key: string | CNode; value: CNode; kind: string }[] = []
      while (!this.eat('}')) {
        const ks = this.p.s
        if (this.eat('...')) props.push({ key: '', value: this.assign(), kind: 'spread' })
        else {
          let key: string | CNode
          if (this.p.t === 'id') key = this.name()
          else if (this.p.t === 'str') key = (this.i++, this.toks[this.i - 1]!.v)
          else if (this.p.t === 'num') key = (this.i++, String(this.toks[this.i - 1]!.x))
          else if (this.eat('[')) {
            key = this.assign()
            this.want(']')
          } else return calcNo('object key')
          if ((key === 'get' || key === 'set' || key === 'async') && this.p.t === 'id') calcNo('accessor')
          if (this.is('(')) {
            const fn = this.node('func', ks, { name: typeof key === 'string' ? key : '', params: this.params(), body: undefined, isExpr: false })
            if (this.eat(':')) this.skipType(['{'])
            fn.body = this.block()
            props.push({ key, value: fn, kind: 'init' })
          } else if (this.eat(':')) props.push({ key, value: this.assign(), kind: 'init' })
          else if (typeof key === 'string') {
            const name = this.node('name', ks, { name: key })
            props.push({ key, value: this.is('=') ? (this.i++, this.node('assign', ks, { op: '=', target: name, right: this.assign() })) : name, kind: 'init' })
          } else calcNo('object')
        }
        if (!this.is('}')) this.want(',')
      }
      return this.node('obj', s, { props })
    }
    return calcNo(`unexpected ${p.v}`)
  }
}

// ------------------------------------------------------------------ py tokens

const PY_PUNCT = ['**=', '//=', '>>=', '<<=', '...', '->', ':=', '**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '@=']
const PY_ONE = '()[]{},:.;@=+-*/%&|^~<>'
const PY_NUM = /(?:0[xX](?:_?[\da-fA-F])+|0[oO](?:_?[0-7])+|0[bB](?:_?[01])+|(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?)([jJ]?)/y
const PY_ID = /[A-Za-z_À-￿][\wÀ-￿]*/y
const PY_STR = /([rRbBfFuU]{0,2})('''|"""|'|")/y

type PyStrPart = { lit: string } | { expr: [number, number]; conv?: string; spec?: string }

function pyEscape(src: string, i: number): [string, number] {
  const c = src[i]
  const simple: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', a: '\x07', '\\': '\\', "'": "'", '"': '"', '\n': '' }
  if (c === undefined) calcNo('escape')
  if (c in simple) return [simple[c]!, i + 1]
  if (/[0-7]/.test(c)) {
    const o = /^[0-7]{1,3}/.exec(src.slice(i, i + 3))![0]
    return [String.fromCharCode(parseInt(o, 8)), i + o.length]
  }
  if (c === 'x' || c === 'u') {
    const n = c === 'x' ? 2 : 4
    const h = new RegExp(`^[\\da-fA-F]{${n}}`).exec(src.slice(i + 1, i + 1 + n))
    if (!h) calcNo('escape')
    return [String.fromCharCode(parseInt(h[0], 16)), i + 1 + n]
  }
  if (c === 'U' || c === 'N') calcNo('escape')
  return ['\\' + c, i + 1]
}

function pyTokens(src: string, from: number, to: number): CTok[] {
  const out: CTok[] = []
  const indents = [0]
  let depth = 0
  let i = from
  let isLineStart = true
  const push = (t: CTok['t'], v: string, s: number, x?: unknown) => out.push({ t, v, s, e: i, nl: false, x })
  while (i < to) {
    if (isLineStart && depth === 0) {
      let k = i
      let width = 0
      while (k < to && (src[k] === ' ' || src[k] === '\t')) {
        if (src[k] === '\t') calcNo('tab indent')
        width++
        k++
      }
      if (k >= to || src[k] === '\n' || src[k] === '#' || src[k] === '\r') {
        while (k < to && src[k] !== '\n') k++
        i = k + 1
        continue
      }
      i = k
      isLineStart = false
      if (width > indents.at(-1)!) {
        indents.push(width)
        push('in', '', i)
      } else
        while (width < indents.at(-1)!) {
          indents.pop()
          push('de', '', i)
          if (width > indents.at(-1)!) calcNo('dedent')
        }
      continue
    }
    const c = src[i]!
    if (c === '\n') {
      i++
      if (depth === 0) {
        if (out.length > 0 && out.at(-1)!.t !== 'nl') push('nl', '', i - 1)
        isLineStart = true
      }
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f') {
      i++
      continue
    }
    if (c === '\\' && src[i + 1] === '\n') {
      i += 2
      continue
    }
    if (c === '#') {
      while (i < to && src[i] !== '\n') i++
      continue
    }
    const s = i
    PY_STR.lastIndex = i
    const sm = PY_STR.exec(src)
    if (sm && (sm[1] === '' || /^[rRbBfFuU]{1,2}$/.test(sm[1]!))) {
      const prefix = sm[1]!.toLowerCase()
      if (prefix.includes('b')) calcNo('bytes')
      const q = sm[2]!
      const isRaw = prefix.includes('r')
      const isF = prefix.includes('f')
      let k = i + sm[0].length
      const body0 = k
      for (;;) {
        if (k >= to) calcNo('string')
        if (src[k] === '\\') {
          k += 2
          continue
        }
        if (q.length === 1 && src[k] === '\n') calcNo('string')
        if (src.startsWith(q, k)) break
        k++
      }
      const body: [number, number] = [body0, k]
      i = k + q.length
      push('str', '', s, { isF, isRaw, body })
      continue
    }
    if (/\d/.test(c) || (c === '.' && /\d/.test(src[i + 1] ?? ''))) {
      PY_NUM.lastIndex = i
      const num = PY_NUM.exec(src)
      if (!num) calcNo('number')
      if (num[1]) calcNo('complex')
      const text = num[0].replace(/_/g, '')
      i += num[0].length
      if (/^0[xob]/i.test(text)) push('num', text, s, BigInt(text))
      else if (/[.eE]/.test(text)) push('num', text, s, Number(text))
      else {
        if (/^0\d/.test(text) && !/^0+$/.test(text)) calcNo('number')
        push('num', text, s, BigInt(text))
      }
      continue
    }
    PY_ID.lastIndex = i
    const id = PY_ID.exec(src)
    if (id) {
      i += id[0].length
      push('id', id[0], s)
      continue
    }
    const p = PY_PUNCT.find(one => src.startsWith(one, i))
    if (p) {
      i += p.length
      push('op', p, s)
      continue
    }
    if (PY_ONE.includes(c)) {
      i++
      if ('([{'.includes(c)) depth++
      else if (')]}'.includes(c)) depth = Math.max(0, depth - 1)
      push('op', c, s)
      continue
    }
    calcNo(`char ${c}`)
  }
  if (out.length > 0 && out.at(-1)!.t !== 'nl') push('nl', '', i)
  while (indents.length > 1) {
    indents.pop()
    push('de', '', i)
  }
  out.push({ t: 'eof', v: '', s: to, e: to, nl: true })
  return out
}

/** A python string literal's pieces: cooked text, and an f-string's fields as source spans. */
function pyStrParts(src: string, tok: CTok): PyStrPart[] {
  const { isF, isRaw, body } = tok.x as { isF: boolean; isRaw: boolean; body: [number, number] }
  const parts: PyStrPart[] = []
  let cur = ''
  let i = body[0]
  const to = body[1]
  while (i < to) {
    const c = src[i]!
    if (c === '\\' && !isRaw) {
      const [v, n] = pyEscape(src, i + 1)
      cur += v
      i = n
      continue
    }
    if (isF && c === '{') {
      if (src[i + 1] === '{') {
        cur += '{'
        i += 2
        continue
      }
      if (cur) parts.push({ lit: cur })
      cur = ''
      let depth = 0
      let k = i + 1
      let end = -1
      let colon = -1
      let bang = -1
      for (; k < to; k++) {
        const d = src[k]!
        if (d === "'" || d === '"') {
          const close = src.indexOf(d, k + 1)
          if (close === -1 || close >= to) calcNo('f-string')
          k = close
        } else if ('([{'.includes(d)) depth++
        else if (')]'.includes(d)) depth--
        else if (d === '}') {
          if (depth === 0) {
            end = k
            break
          }
          depth--
        } else if (depth === 0 && d === '!' && src[k + 1] !== '=' && colon === -1) bang = k
        else if (depth === 0 && d === ':' && colon === -1) colon = k
      }
      if (end === -1) calcNo('f-string')
      const exprEnd = bang !== -1 ? bang : colon !== -1 ? colon : end
      const spec = colon !== -1 ? src.slice(colon + 1, end) : undefined
      if (spec !== undefined && /[{}]/.test(spec)) calcNo('nested spec')
      const conv = bang !== -1 ? src.slice(bang + 1, colon !== -1 ? colon : end) : undefined
      if (conv !== undefined && conv !== 'r' && conv !== 's') calcNo('conversion')
      if (/=\s*$/.test(src.slice(i + 1, exprEnd)) && !/[=!<>]=\s*$/.test(src.slice(i + 1, exprEnd))) calcNo('f-string =')
      parts.push({ expr: [i + 1, exprEnd], conv, spec })
      i = end + 1
      continue
    }
    if (isF && c === '}') {
      if (src[i + 1] !== '}') calcNo('f-string')
      cur += '}'
      i += 2
      continue
    }
    cur += c
    i++
  }
  if (cur || parts.length === 0) parts.push({ lit: cur })
  return parts
}

// ------------------------------------------------------------------ py parser

const PY_AUG = new Set(['+=', '-=', '*=', '/=', '//=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>='])
const PY_KEYWORDS = new Set(['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'])

class PyParser {
  i = 0
  constructor(
    readonly src: string,
    readonly toks: CTok[],
  ) {}
  get p(): CTok {
    return this.toks[this.i]!
  }
  at(n: number): CTok {
    return this.toks[Math.min(this.i + n, this.toks.length - 1)]!
  }
  is(v: string): boolean {
    const p = this.p
    return p.v === v && (p.t === 'op' || p.t === 'id')
  }
  eat(v: string): boolean {
    if (!this.is(v)) return false
    this.i++
    return true
  }
  want(v: string): void {
    if (!this.eat(v)) calcNo(`expected ${v}`)
  }
  name(): string {
    const p = this.p
    if (p.t !== 'id' || PY_KEYWORDS.has(p.v)) calcNo('expected name')
    this.i++
    return p.v
  }
  node(k: string, s: number, more: Record<string, unknown>): CNode {
    return { k, s, e: this.toks[this.i - 1]?.e ?? s, ...more }
  }
  program(): CNode[] {
    const out: CNode[] = []
    while (this.p.t !== 'eof') {
      if (this.p.t === 'nl') {
        this.i++
        continue
      }
      out.push(...this.statement())
    }
    return out
  }
  endLine(): void {
    if (this.p.t === 'nl') this.i++
    else if (this.p.t !== 'eof' && this.p.t !== 'de') calcNo('line end')
  }
  suite(): CNode[] {
    this.want(':')
    if (this.p.t !== 'nl') return this.simpleLine()
    this.i++
    if (this.at(0).t !== 'in') calcNo('indent')
    this.i++
    const out: CNode[] = []
    while (this.at(0).t !== 'de') {
      if (this.at(0).t === 'eof') calcNo('suite')
      if (this.at(0).t === 'nl') {
        this.i++
        continue
      }
      out.push(...this.statement())
    }
    this.i++
    return out
  }
  simpleLine(): CNode[] {
    const out = [this.simple()]
    while (this.eat(';')) {
      if (this.p.t === 'nl' || this.p.t === 'eof') break
      out.push(this.simple())
    }
    this.endLine()
    return out
  }
  statement(): CNode[] {
    const p = this.p
    const s = p.s
    if (p.t === 'id')
      switch (p.v) {
        case 'def':
          return [this.def()]
        case 'if': {
          this.i++
          const test = this.test()
          const then = this.suite()
          const branches = [{ test, body: then }]
          let other: CNode[] | undefined
          for (;;) {
            if (this.eat('elif')) {
              const t = this.test()
              branches.push({ test: t, body: this.suite() })
            } else if (this.eat('else')) {
              other = this.suite()
              break
            } else break
          }
          return [this.node('if', s, { branches, other })]
        }
        case 'for': {
          this.i++
          const target = this.targetList()
          this.want('in')
          const iter = this.testList()
          const body = this.suite()
          if (this.is('else')) calcNo('for else')
          return [this.node('for', s, { target, iter, body })]
        }
        case 'while': {
          this.i++
          const test = this.test()
          const body = this.suite()
          if (this.is('else')) calcNo('while else')
          return [this.node('while', s, { test, body })]
        }
        case 'try': {
          this.i++
          const body = this.suite()
          const handlers: { type?: CNode; name?: string; body: CNode[] }[] = []
          let other: CNode[] | undefined
          let finalizer: CNode[] | undefined
          while (this.eat('except')) {
            let type: CNode | undefined
            let name: string | undefined
            if (!this.is(':')) {
              type = this.test()
              if (this.eat('as')) name = this.name()
            }
            handlers.push({ type, name, body: this.suite() })
          }
          if (this.eat('else')) other = this.suite()
          if (this.eat('finally')) finalizer = this.suite()
          if (handlers.length === 0 && !finalizer) calcNo('try')
          return [this.node('try', s, { body, handlers, other, finalizer })]
        }
        case 'class':
        case 'with':
        case 'async':
          calcNo(p.v)
      }
    if (p.t === 'op' && p.v === '@') calcNo('decorator')
    return this.simpleLine()
  }
  def(): CNode {
    const s = this.p.s
    this.want('def')
    const name = this.name()
    this.want('(')
    const params: { name: string; def?: CNode }[] = []
    while (!this.eat(')')) {
      if (this.is('*') || this.is('**') || this.is('/')) calcNo('special parameter')
      const pname = this.name()
      if (this.eat(':')) this.test()
      const def = this.eat('=') ? this.test() : undefined
      params.push({ name: pname, def })
      if (!this.is(')')) this.want(',')
    }
    if (this.eat('->')) this.test()
    const body = this.suite()
    const locals = new Set<string>(params.map(one => one.name))
    pyLocalsOf(body, locals)
    return this.node('def', s, { name, params, body, locals: [...locals] })
  }
  simple(): CNode {
    const p = this.p
    const s = p.s
    if (p.t === 'id')
      switch (p.v) {
        case 'pass':
          this.i++
          return this.node('pass', s, {})
        case 'break':
        case 'continue':
          this.i++
          return this.node(p.v, s, {})
        case 'return': {
          this.i++
          const arg = this.p.t === 'nl' || this.p.t === 'eof' || this.is(';') ? undefined : this.testList()
          return this.node('return', s, { arg })
        }
        case 'raise': {
          this.i++
          const arg = this.p.t === 'nl' || this.p.t === 'eof' ? undefined : this.test()
          if (this.eat('from')) this.test()
          return this.node('raise', s, { arg })
        }
        case 'assert': {
          this.i++
          const test = this.test()
          const msg = this.eat(',') ? this.test() : undefined
          return this.node('assert', s, { test, msg })
        }
        case 'import': {
          this.i++
          const names: string[] = []
          do {
            let full = this.name()
            while (this.eat('.')) full += '.' + this.name()
            if (this.eat('as')) calcNo('import as')
            names.push(full)
          } while (this.eat(','))
          return this.node('import', s, { names })
        }
        case 'from': {
          this.i++
          let mod = this.name()
          while (this.eat('.')) mod += '.' + this.name()
          this.want('import')
          const isParen = this.eat('(')
          const names: string[] = []
          do {
            if (this.is(')')) break
            names.push(this.name())
            if (this.eat('as')) calcNo('import as')
          } while (this.eat(','))
          if (isParen) this.want(')')
          return this.node('from', s, { mod, names })
        }
        case 'global':
        case 'nonlocal':
        case 'del':
        case 'yield':
        case 'await':
          calcNo(p.v)
      }
    const first = this.testListStar()
    if (this.is('=')) {
      const targets = [first]
      let value: CNode = first
      while (this.eat('=')) {
        value = this.p.t === 'id' && this.p.v === 'yield' ? calcNo('yield') : this.testListStar()
        targets.push(value)
      }
      targets.pop()
      for (const one of targets) pyCheckTarget(one)
      return this.node('assign', s, { targets, value })
    }
    if (this.p.t === 'op' && PY_AUG.has(this.p.v)) {
      const op = this.p.v.slice(0, -1)
      this.i++
      if (!['name', 'index', 'attr'].includes(first.k)) calcNo('augmented target')
      return this.node('aug', s, { op, target: first, value: this.testList() })
    }
    if (this.is(':') && first.k === 'name') {
      this.i++
      this.test()
      if (this.eat('=')) return this.node('assign', s, { targets: [first], value: this.testList() })
      return this.node('pass', s, {})
    }
    if (this.is(':=')) calcNo('walrus')
    return this.node('expr', s, { expr: first })
  }
  targetList(): CNode {
    const s = this.p.s
    const items: CNode[] = []
    let isTuple = false
    do {
      if (this.is('in')) break
      items.push(this.is('*') ? (this.i++, this.node('star', this.p.s, { arg: this.bitOr() })) : this.bitOr())
      if (this.is(',')) isTuple = true
    } while (this.eat(','))
    const target = isTuple ? this.node('tuple', s, { items }) : items[0]!
    pyCheckTarget(target)
    return target
  }
  testListStar(): CNode {
    const s = this.p.s
    const items: CNode[] = []
    let isTuple = false
    for (;;) {
      items.push(this.is('*') ? (this.i++, this.node('star', s, { arg: this.bitOr() })) : this.test())
      if (!this.is(',')) break
      this.i++
      isTuple = true
      if (this.p.t === 'nl' || this.p.t === 'eof' || this.is('=') || this.is(')') || this.is(';') || (this.p.t === 'op' && PY_AUG.has(this.p.v))) break
    }
    return isTuple ? this.node('tuple', s, { items }) : items[0]!
  }
  testList(): CNode {
    return this.testListStar()
  }
  test(): CNode {
    const s = this.p.s
    if (this.is('lambda')) {
      this.i++
      const params: { name: string; def?: CNode }[] = []
      while (!this.is(':')) {
        if (this.is('*') || this.is('**')) calcNo('lambda star')
        const pname = this.name()
        params.push({ name: pname, def: this.eat('=') ? this.test() : undefined })
        if (!this.is(':')) this.want(',')
      }
      this.want(':')
      const body = this.test()
      return this.node('lambda', s, { params, body })
    }
    const e = this.or()
    if (this.is('if') && this.at(1).v !== 'else') {
      const save = this.i
      this.i++
      const test = this.or()
      if (!this.eat('else')) {
        this.i = save
        return e
      }
      const other = this.test()
      return this.node('cond', s, { test, then: e, other })
    }
    return e
  }
  or(): CNode {
    const s = this.p.s
    let e = this.and()
    while (this.eat('or')) e = this.node('logic', s, { op: 'or', left: e, right: this.and() })
    return e
  }
  and(): CNode {
    const s = this.p.s
    let e = this.not()
    while (this.eat('and')) e = this.node('logic', s, { op: 'and', left: e, right: this.not() })
    return e
  }
  not(): CNode {
    const s = this.p.s
    if (this.eat('not')) return this.node('unary', s, { op: 'not', arg: this.not() })
    return this.comparison()
  }
  comparison(): CNode {
    const s = this.p.s
    const first = this.bitOr()
    const ops: string[] = []
    const rest: CNode[] = []
    for (;;) {
      let op: string | undefined
      const p = this.p
      if (p.t === 'op' && ['<', '>', '==', '>=', '<=', '!='].includes(p.v)) op = p.v
      else if (p.t === 'id' && p.v === 'in') op = 'in'
      else if (p.t === 'id' && p.v === 'not' && this.at(1).v === 'in') {
        op = 'not in'
        this.i++
      } else if (p.t === 'id' && p.v === 'is') {
        op = this.at(1).v === 'not' ? (this.i++, 'is not') : 'is'
      }
      if (!op) break
      this.i++
      ops.push(op)
      rest.push(this.bitOr())
    }
    return ops.length === 0 ? first : this.node('cmp', s, { first, ops, rest })
  }
  binLevel(ops: string[], next: () => CNode): CNode {
    const s = this.p.s
    let e = next()
    while (this.p.t === 'op' && ops.includes(this.p.v)) {
      const op = this.p.v
      this.i++
      e = this.node('bin', s, { op, left: e, right: next() })
    }
    return e
  }
  bitOr(): CNode {
    return this.binLevel(['|'], () => this.binLevel(['^'], () => this.binLevel(['&'], () => this.binLevel(['<<', '>>'], () => this.arith()))))
  }
  arith(): CNode {
    return this.binLevel(['+', '-'], () => this.term())
  }
  term(): CNode {
    return this.binLevel(['*', '/', '//', '%', '@'], () => this.factor())
  }
  factor(): CNode {
    const s = this.p.s
    if (this.p.t === 'op' && ['+', '-', '~'].includes(this.p.v)) {
      const op = this.p.v
      this.i++
      return this.node('unary', s, { op, arg: this.factor() })
    }
    const base = this.atomExpr()
    if (this.eat('**')) return this.node('bin', s, { op: '**', left: base, right: this.factor() })
    return base
  }
  atomExpr(): CNode {
    const s = this.p.s
    if (this.is('await')) calcNo('await')
    let e = this.atom()
    for (;;) {
      if (this.eat('.')) e = this.node('attr', s, { obj: e, name: this.name() })
      else if (this.is('(')) {
        this.i++
        const args: CNode[] = []
        const kwargs: { name: string; value: CNode }[] = []
        while (!this.eat(')')) {
          if (this.is('*') || this.is('**')) calcNo('star argument')
          if (this.p.t === 'id' && this.at(1).v === '=' && this.at(1).t === 'op') {
            const name = this.name()
            this.i++
            kwargs.push({ name, value: this.test() })
          } else {
            if (kwargs.length > 0) calcNo('positional after keyword')
            const a = this.test()
            if (this.is('for')) {
              args.push(this.comprehension('genexp', a, ')'))
              continue
            }
            args.push(a)
          }
          if (!this.is(')')) this.want(',')
        }
        e = this.node('call', s, { callee: e, args, kwargs })
      } else if (this.is('[')) {
        this.i++
        const items: CNode[] = []
        let isTuple = false
        do {
          if (this.is(']')) break
          items.push(this.subscript())
          if (this.is(',')) isTuple = true
        } while (this.eat(','))
        this.want(']')
        const index = isTuple ? this.node('tuple', s, { items }) : items[0]
        if (!index) calcNo('subscript')
        e = this.node('index', s, { obj: e, index })
      } else break
    }
    return e
  }
  subscript(): CNode {
    const s = this.p.s
    const part = () => (this.is(':') || this.is(']') || this.is(',') ? undefined : this.test())
    const lower = part()
    if (!this.eat(':')) return lower ?? calcNo('subscript')
    const upper = part()
    const step = this.eat(':') ? part() : undefined
    return this.node('slice', s, { lower, upper, step })
  }
  comprehension(kind: string, elt: CNode, close: string, value?: CNode): CNode {
    const s = elt.s
    const clauses: { target?: CNode; iter?: CNode; test?: CNode }[] = []
    while (this.is('for') || this.is('if')) {
      if (this.eat('for')) {
        const target = this.targetList()
        this.want('in')
        clauses.push({ target, iter: this.or() })
      } else {
        this.i++
        clauses.push({ test: this.or() })
      }
    }
    this.want(close)
    return this.node(kind, s, { elt, value, clauses })
  }
  atom(): CNode {
    const p = this.p
    const s = p.s
    if (p.t === 'num') {
      this.i++
      return this.node('lit', s, { value: p.x })
    }
    if (p.t === 'str') {
      const parts: PyStrPart[] = []
      let isF = false
      while (this.p.t === 'str') {
        const t = this.p
        isF ||= (t.x as { isF: boolean }).isF
        parts.push(...pyStrParts(this.src, t))
        this.i++
      }
      if (!isF) return this.node('lit', s, { value: parts.map(one => ('lit' in one ? one.lit : '')).join('') })
      const exprs = parts.map(one => {
        if ('lit' in one) return one
        const sub = new PyParser(this.src, pyTokens(this.src, one.expr[0], one.expr[1]).filter(t => t.t !== 'nl' && t.t !== 'in' && t.t !== 'de'))
        const expr = sub.testList()
        if (sub.p.t !== 'eof') calcNo('f-string expression')
        return { expr, conv: one.conv, spec: one.spec }
      })
      return this.node('fstr', s, { parts: exprs })
    }
    if (p.t === 'id') {
      this.i++
      if (p.v === 'True') return this.node('lit', s, { value: true })
      if (p.v === 'False') return this.node('lit', s, { value: false })
      if (p.v === 'None') return this.node('lit', s, { value: null })
      if (PY_KEYWORDS.has(p.v)) calcNo(`keyword ${p.v}`)
      return this.node('name', s, { name: p.v })
    }
    if (p.t === 'op' && p.v === '(') {
      this.i++
      if (this.eat(')')) return this.node('tuple', s, { items: [] })
      if (this.is('yield')) calcNo('yield')
      const first = this.is('*') ? (this.i++, this.node('star', s, { arg: this.bitOr() })) : this.test()
      if (this.is('for')) return this.comprehension('genexp', first, ')')
      if (this.eat(')')) return first.k === 'tuple' ? { ...first, paren: true } : first
      const items = [first]
      while (this.eat(',')) {
        if (this.is(')')) break
        items.push(this.is('*') ? (this.i++, this.node('star', s, { arg: this.bitOr() })) : this.test())
      }
      this.want(')')
      return this.node('tuple', s, { items })
    }
    if (p.t === 'op' && p.v === '[') {
      this.i++
      if (this.eat(']')) return this.node('list', s, { items: [] })
      const first = this.is('*') ? (this.i++, this.node('star', s, { arg: this.bitOr() })) : this.test()
      if (this.is('for')) return this.comprehension('listcomp', first, ']')
      const items = [first]
      while (this.eat(',')) {
        if (this.is(']')) break
        items.push(this.is('*') ? (this.i++, this.node('star', s, { arg: this.bitOr() })) : this.test())
      }
      this.want(']')
      return this.node('list', s, { items })
    }
    if (p.t === 'op' && p.v === '{') {
      this.i++
      if (this.eat('}')) return this.node('dict', s, { keys: [], values: [] })
      if (this.is('**') || this.is('*')) calcNo('star in braces')
      const first = this.test()
      if (this.eat(':')) {
        const value = this.test()
        if (this.is('for')) return this.comprehension('dictcomp', first, '}', value)
        const keys = [first]
        const values = [value]
        while (this.eat(',')) {
          if (this.is('}')) break
          if (this.is('**')) calcNo('dict unpack')
          keys.push(this.test())
          this.want(':')
          values.push(this.test())
        }
        this.want('}')
        return this.node('dict', s, { keys, values })
      }
      if (this.is('for')) return this.comprehension('setcomp', first, '}')
      const items = [first]
      while (this.eat(',')) {
        if (this.is('}')) break
        items.push(this.test())
      }
      this.want('}')
      return this.node('set', s, { items })
    }
    return calcNo(`unexpected ${p.v || p.t}`)
  }
}

function pyCheckTarget(node: CNode): void {
  if (node.k === 'name' || node.k === 'index') return
  if (node.k === 'attr') calcNo('attribute target')
  if ((node.k === 'tuple' || node.k === 'list') && node.items.filter((one: CNode) => one.k === 'star').length <= 1) {
    node.items.forEach((one: CNode) => pyCheckTarget(one.k === 'star' ? one.arg : one))
    return
  }
  calcNo('target')
}

/** The names a python body binds (its locals): assigned, looped over, defined, imported, caught; not in nested defs. */
function pyLocalsOf(body: readonly CNode[], out: Set<string>): void {
  const target = (t: CNode) => {
    if (t.k === 'name') out.add(t.name)
    else if (t.k === 'tuple' || t.k === 'list') t.items.forEach((one: CNode) => target(one.k === 'star' ? one.arg : one))
  }
  for (const st of body) {
    if (st.k === 'assign') st.targets.forEach(target)
    else if (st.k === 'aug') target(st.target)
    else if (st.k === 'for') {
      target(st.target)
      pyLocalsOf(st.body, out)
    } else if (st.k === 'while') pyLocalsOf(st.body, out)
    else if (st.k === 'if') {
      st.branches.forEach((b: { body: CNode[] }) => pyLocalsOf(b.body, out))
      if (st.other) pyLocalsOf(st.other, out)
    } else if (st.k === 'try') {
      pyLocalsOf(st.body, out)
      st.handlers.forEach((h: { name?: string; body: CNode[] }) => {
        if (h.name) out.add(h.name)
        pyLocalsOf(h.body, out)
      })
      if (st.other) pyLocalsOf(st.other, out)
      if (st.finalizer) pyLocalsOf(st.finalizer, out)
    } else if (st.k === 'def') out.add(st.name)
    else if (st.k === 'import' || st.k === 'from') calcNo('import in body')
  }
}
// ------------------------------------------------------------------ runtime, shared

const UNBOUND = Symbol('unbound')
const MISSING = Symbol('missing')
const OPT_SHORT = Symbol('optional chain')

class CEnv {
  readonly vars = new Map<string, { v: unknown; c: boolean }>()
  constructor(readonly up?: CEnv) {}
  find(name: string): { v: unknown; c: boolean } | undefined {
    for (let e: CEnv | undefined = this; e; e = e.up) {
      const got = e.vars.get(name)
      if (got) return got
    }
    return undefined
  }
  def(name: string, v: unknown, c = false): void {
    this.vars.set(name, { v, c })
  }
}

class CalcFn {
  constructor(
    readonly lang: CalcLang,
    readonly node: CNode,
    readonly env: CEnv,
    readonly defaults: unknown[] = [],
  ) {}
}

type CCtx = { lang: CalcLang; src: string; steps: number; max: number; depth: number; isTraced: boolean; trace: CalcTrace; loops: Map<number, { s: number; e: number; n: number }>; until: number }

class CRet {
  constructor(readonly v: unknown) {}
}
const CBRK = { brk: true }
const CCONT = { cont: true }

function calcStep(ctx: CCtx): void {
  if (++ctx.steps > ctx.max) calcNo('steps')
  if ((ctx.steps & 63) === 0 && Date.now() > ctx.until) calcNo('time')
}
/**
 * Whether a value is larger than `limit` to render (each string's characters, each item and key counted), walked
 * no further than the limit: a list holding one long string many times renders huge though it is small in memory.
 */
function calcSizeOver(v: unknown, limit: number): boolean {
  let left = limit
  const walk = (x: unknown, depth: number): boolean => {
    if (--left < 0 || depth > CALC_DEPTH_MAX) return true
    if (typeof x === 'string') return (left -= x.length) < 0
    if (Array.isArray(x)) return x.some(one => walk(one, depth + 1))
    if (x instanceof PyTuple) return x.items.some(one => walk(one, depth + 1))
    if (x instanceof PyDict) return [...x.m.values()].some(([k, one]) => walk(k, depth + 1) || walk(one, depth + 1))
    if (x instanceof PySet) return [...x.m.values()].some(one => walk(one, depth + 1))
    if (x instanceof Map) return [...x.entries()].some(([k, one]) => walk(k, depth + 1) || walk(one, depth + 1))
    if (x instanceof Set) return [...x.values()].some(one => walk(one, depth + 1))
    if (jsIsPlain(x)) return Object.entries(x).some(([k, one]) => walk(k, depth + 1) || walk(one, depth + 1))
    return false
  }
  return walk(v, 0)
}
/**
 * Whether a regex source can only run in time on a short subject (no catastrophic backtracking): no backreference,
 * no group repeated a varying number of times that holds a choice of its own (a quantifier other than an exact count,
 * or an alternation: `(a+)+`, `(\\w+\\s?)*`, `(a|ab)*`, `(\\d{1,3})+`), and at most three unbounded quantifiers in all.
 * Anything else is unknown to calc.
 */
export function isSafeRegex(source: string): boolean {
  if (/\\[1-9]|\\k</.test(source)) return false
  const stack: { q: boolean; alt: boolean }[] = [{ q: false, alt: false }]
  let unbounded = 0
  for (let i = 0; i < source.length; i++) {
    const c = source[i]!
    const top = stack.at(-1)!
    if (c === '\\') {
      i++
      continue
    }
    if (c === '[') {
      for (i++; i < source.length && source[i] !== ']'; i++) if (source[i] === '\\') i++
      continue
    }
    if (c === '(') {
      stack.push({ q: false, alt: false })
      if (source[i + 1] === '?') i += source[i + 2] === '<' && /[=!]/.test(source[i + 3] ?? '') ? 3 : source[i + 2] === '<' ? 2 : 2
      continue
    }
    if (c === '|') {
      top.alt = true
      continue
    }
    if (c === ')') {
      if (stack.length === 1) return false
      const g = stack.pop()!
      // A group repeated a varying number of times (`*` · `+` · `{n,}` · `{n,m}`) must not hold a choice of its own.
      const next = source[i + 1] ?? ''
      const after = /^\{(\d+)(?:,(\d*))?\}/.exec(source.slice(i + 1))
      const isRepeated = next === '*' || next === '+' || (after !== null && after[2] !== undefined && (after[2] === '' || Number(after[2]) > Number(after[1])))
      if (isRepeated && (g.q || g.alt)) return false
      if (g.q) stack.at(-1)!.q = true
      continue
    }
    const brace = c === '{' ? /^\{(\d+)(,(\d*))?\}/.exec(source.slice(i)) : null
    if (c === '*' || c === '+' || c === '?' || brace) {
      // An exact count (`{3}`) gives no choice; every other quantifier does.
      if (!(brace && brace[2] === undefined)) top.q = true
      if (c === '*' || c === '+' || (brace && brace[2] !== undefined && brace[3] === '')) unbounded++
      if (brace) i += brace[0].length - 1
      if (source[i + 1] === '?') i++
    }
  }
  return stack.length === 1 && unbounded <= 3
}
function calcCond(ctx: CCtx, node: CNode, v: boolean): void {
  if (ctx.isTraced && ctx.trace.conds.length < 300) ctx.trace.conds.push({ s: node.s, e: node.e, v })
}
function calcLoop(ctx: CCtx, node: CNode): void {
  if (!ctx.isTraced) return
  const one = ctx.loops.get(node.s) ?? { s: node.s, e: node.e, n: 0 }
  one.n++
  ctx.loops.set(node.s, one)
}
/** Names a returned expression reads, with their values shown short (the reason's last template). */
function calcNamesIn(node: CNode | undefined, out: Set<string>): void {
  if (!node || typeof node !== 'object') return
  if (node.k === 'name') out.add(node.name)
  if (node.k === 'func' || node.k === 'lambda') return
  for (const [key, value] of Object.entries(node)) {
    if (key === 'callee' && (value as CNode)?.k === 'name') continue
    if (Array.isArray(value)) value.forEach(one => one && typeof one === 'object' && ('k' in one ? calcNamesIn(one, out) : Object.values(one).forEach(v => v && typeof v === 'object' && 'k' in (v as object) && calcNamesIn(v as CNode, out))))
    else if (value && typeof value === 'object' && 'k' in (value as object)) calcNamesIn(value as CNode, out)
  }
}
function calcNoteReturn(ctx: CCtx, node: CNode, arg: CNode | undefined, env: CEnv): void {
  if (!ctx.isTraced || ctx.depth !== 1 || !arg) return
  const names = new Set<string>()
  calcNamesIn(arg, names)
  const shown: [string, string][] = []
  for (const name of names) {
    const got = env.find(name)
    if (!got || got.v === UNBOUND || got.v === MISSING || got.v instanceof CalcFn || calcSizeOver(got.v, 64)) continue
    const show = calcShowSafe(got.v, ctx.lang)
    if (show !== undefined && show.length <= 40) shown.push([name, show])
  }
  ctx.trace.ret = { s: arg.s, e: arg.e, names: shown }
}
export function calcShowSafe(v: unknown, lang: CalcLang): string | undefined {
  try {
    return lang === 'py' ? pyRepr(v) : jsShow(v)
  } catch {
    return undefined
  }
}

// ------------------------------------------------------------------ js runtime

class HostNs {
  constructor(
    readonly name: string,
    readonly members: Record<string, unknown>,
    readonly call?: (...args: unknown[]) => unknown,
  ) {}
}
class HostMethod {
  constructor(
    readonly fn: (...args: unknown[]) => unknown,
    readonly self: unknown,
  ) {}
}
/** Errors calc made itself (a TypeError on undefined): their message is not V8's, so reading it is unknown. */
const CALC_OWN_ERRORS = new WeakSet<object>()

const JS_STR_METHODS = new Set(['at', 'charAt', 'charCodeAt', 'codePointAt', 'concat', 'endsWith', 'includes', 'indexOf', 'lastIndexOf', 'match', 'padEnd', 'padStart', 'repeat', 'replace', 'replaceAll', 'search', 'slice', 'split', 'startsWith', 'substring', 'substr', 'toLowerCase', 'toUpperCase', 'trim', 'trimEnd', 'trimStart', 'toString', 'valueOf'])
const JS_ARR_METHODS = new Set(['at', 'concat', 'every', 'fill', 'filter', 'find', 'findIndex', 'findLast', 'findLastIndex', 'flat', 'flatMap', 'forEach', 'includes', 'indexOf', 'join', 'lastIndexOf', 'map', 'pop', 'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'some', 'sort', 'splice', 'unshift', 'toString', 'toReversed', 'toSorted', 'toSpliced', 'with'])
const JS_NUM_METHODS = new Set(['toFixed', 'toPrecision', 'toString', 'valueOf'])
const JS_SET_METHODS = new Set(['has', 'add', 'delete', 'clear', 'get', 'set', 'forEach'])
const JS_CASED = new Set(['toLowerCase', 'toUpperCase'])

const JS_MATH: Record<string, unknown> = {}
for (const key of Object.getOwnPropertyNames(Math)) if (key !== 'random') JS_MATH[key] = (Math as unknown as Record<string, unknown>)[key]
function jsErrorMaker(Ctor: ErrorConstructor): HostNs {
  return new HostNs(Ctor.name, {}, (...args: unknown[]) => new Ctor(args.length > 0 && args[0] !== undefined ? jsStr(args[0]) : undefined))
}
const JS_GLOBALS: Record<string, unknown> = {
  Math: new HostNs('Math', JS_MATH),
  Number: new HostNs('Number', { isInteger: Number.isInteger, isFinite: Number.isFinite, isNaN: Number.isNaN, isSafeInteger: Number.isSafeInteger, parseFloat: Number.parseFloat, parseInt: Number.parseInt, MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER, MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER, EPSILON: Number.EPSILON, MAX_VALUE: Number.MAX_VALUE, MIN_VALUE: Number.MIN_VALUE }, (v?: unknown) => Number(v)),
  String: new HostNs('String', { fromCharCode: String.fromCharCode }, (...a: unknown[]) => (a.length === 0 ? '' : jsStr(a[0]))),
  Boolean: new HostNs('Boolean', {}, (v?: unknown) => Boolean(v)),
  Array: new HostNs('Array', { isArray: Array.isArray, from: Array.from, of: Array.of }),
  Object: new HostNs('Object', { keys: Object.keys, values: Object.values, entries: Object.entries, assign: Object.assign, fromEntries: Object.fromEntries, freeze: Object.freeze }),
  JSON: new HostNs('JSON', { stringify: (...a: unknown[]) => (a.length > 1 || !jsIsData(a[0]) ? calcNo('JSON.stringify') : JSON.stringify(a[0])), parse: JSON.parse }),
  console: new HostNs('console', {}),
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  Infinity,
  NaN,
  Error: jsErrorMaker(Error),
  TypeError: jsErrorMaker(TypeError),
  RangeError: jsErrorMaker(RangeError),
  SyntaxError: jsErrorMaker(SyntaxError),
  ReferenceError: jsErrorMaker(ReferenceError),
}

export function jsIsPlain(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== 'object') return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}
/** Whether a value is data JSON shows as node shows it: no function, host object, NaN, infinity or -0 anywhere. */
function jsIsData(v: unknown, seen = new Set<unknown>()): boolean {
  if (v === null || typeof v === 'string' || typeof v === 'boolean' || v === undefined) return true
  if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0)
  if (typeof v !== 'object' || seen.has(v)) return false
  seen.add(v)
  if (Array.isArray(v)) return Object.getPrototypeOf(v) === Array.prototype && v.every(one => jsIsData(one, seen))
  return jsIsPlain(v) && Object.values(v).every(one => jsIsData(one, seen))
}
function jsShow(v: unknown): string {
  if (typeof v === 'function' || v instanceof CalcFn || v instanceof HostNs || v instanceof HostMethod) return calcNo('function result')
  if (!jsIsData(v)) return calcNo('not data')
  return JSON.stringify(v) ?? String(v)
}
function jsStr(v: unknown): string {
  if (v instanceof CalcFn || v instanceof HostNs || v instanceof HostMethod || typeof v === 'function') return calcNo('function as text')
  if (typeof v === 'symbol') return calcNo('symbol')
  return String(v)
}
function jsThrow(name: string): never {
  const Ctor = ({ TypeError, RangeError, ReferenceError, SyntaxError } as Record<string, ErrorConstructor>)[name] ?? Error
  const err = new Ctor()
  CALC_OWN_ERRORS.add(err)
  throw new CalcThrow(name, err)
}
function jsTruthy(v: unknown): boolean {
  return v instanceof CalcFn || v instanceof HostNs || v instanceof HostMethod ? true : Boolean(v)
}
function jsGuardOperand(v: unknown): unknown {
  if (v instanceof CalcFn || v instanceof HostNs || v instanceof HostMethod || typeof v === 'function') calcNo('function operand')
  if (v !== null && typeof v === 'object' && !Array.isArray(v) && !jsIsPlain(v) && !(v instanceof Error)) calcNo('host operand')
  return v
}

function jsHostArg(v: unknown, ctx: CCtx): unknown {
  if (v instanceof CalcFn) {
    const fn = v
    return function (this: unknown, ...args: unknown[]) {
      return jsInvoke(fn, args, ctx)
    }
  }
  if (v instanceof HostNs) return v.call ?? calcNo('namespace as value')
  if (v instanceof HostMethod) return calcNo('method as value')
  return v
}
function jsCheckSize(v: unknown): unknown {
  if (typeof v === 'string' && v.length > CALC_SIZE_MAX * 10) calcNo('size')
  if (Array.isArray(v) && v.length > CALC_SIZE_MAX) calcNo('size')
  return v
}
function jsHostCall(fn: (...args: unknown[]) => unknown, self: unknown, args: unknown[], ctx: CCtx): unknown {
  calcStep(ctx)
  // A regex runs on the host engine with no step count: only over a short subject.
  if ((self instanceof RegExp || args.some(one => one instanceof RegExp)) && [self, ...args].some(one => typeof one === 'string' && one.length > CALC_REGEX_SUBJECT_MAX)) calcNo('regex size')
  try {
    return jsCheckSize(Reflect.apply(fn, self, args.map(one => jsHostArg(one, ctx))))
  } catch (x) {
    if (x instanceof CalcUnknown || x instanceof CalcThrow || x instanceof CRet) throw x
    if (x instanceof Error) throw new CalcThrow(x.name, x)
    throw x
  }
}

function jsGet(obj: unknown, key: unknown, ctx: CCtx): unknown {
  if (obj === null || obj === undefined) jsThrow('TypeError')
  if (obj instanceof CalcFn || typeof obj === 'function' || obj instanceof HostMethod) return calcNo('function property')
  const k = typeof key === 'number' ? key : jsStr(key)
  const isIndex = typeof k === 'number' ? Number.isInteger(k) && k >= 0 : /^(?:0|[1-9]\d*)$/.test(k)
  if (obj instanceof HostNs) {
    if (typeof k === 'string' && Object.hasOwn(obj.members, k)) {
      const m = obj.members[k]
      return typeof m === 'function' ? new HostMethod(m as (...args: unknown[]) => unknown, undefined) : m
    }
    return calcNo(`${obj.name}.${String(k)}`)
  }
  if (typeof obj === 'string') {
    if (k === 'length') return obj.length
    if (isIndex) return obj[Number(k)]
    if (typeof k === 'string' && JS_STR_METHODS.has(k)) {
      if (JS_CASED.has(k) && /[^\x00-\x7f]/.test(obj)) calcNo('non-ASCII case')
      return new HostMethod((String.prototype as unknown as Record<string, (...args: unknown[]) => unknown>)[k]!, obj)
    }
    if (typeof k === 'string' && k in String.prototype) return calcNo(`string ${k}`)
    return undefined
  }
  if (typeof obj === 'number') {
    if (typeof k === 'string' && JS_NUM_METHODS.has(k)) return new HostMethod((Number.prototype as unknown as Record<string, (...args: unknown[]) => unknown>)[k]!, obj)
    if (typeof k === 'string' && k in Number.prototype) return calcNo(`number ${k}`)
    return undefined
  }
  if (typeof obj === 'boolean') return k === 'toString' ? new HostMethod(Boolean.prototype.toString as (...args: unknown[]) => unknown, obj) : calcNo('boolean property')
  if (Array.isArray(obj)) {
    if (k === 'length') return obj.length
    if (isIndex) return obj[Number(k)]
    if (typeof k === 'string' && JS_ARR_METHODS.has(k)) return new HostMethod((Array.prototype as unknown as Record<string, (...args: unknown[]) => unknown>)[k]!, obj)
    if (typeof k === 'string' && Object.hasOwn(obj, k)) return (obj as unknown as Record<string, unknown>)[k]
    if (typeof k === 'string' && (k in Array.prototype || k in Object.prototype)) return calcNo(`array ${k}`)
    return undefined
  }
  if (obj instanceof Set || obj instanceof Map) {
    if (k === 'size') return obj.size
    if (typeof k === 'string' && JS_SET_METHODS.has(k) && k in obj) return new HostMethod((obj as unknown as Record<string, (...args: unknown[]) => unknown>)[k]!, obj)
    return calcNo('collection property')
  }
  if (obj instanceof RegExp) {
    if (k === 'test' || k === 'exec') return new HostMethod(RegExp.prototype[k] as (...args: unknown[]) => unknown, obj)
    if (k === 'source' || k === 'flags' || k === 'global' || k === 'lastIndex') return (obj as unknown as Record<string, unknown>)[k]
    return calcNo('regex property')
  }
  if (obj instanceof Error) {
    if (k === 'name') return obj.name
    if (k === 'message') return CALC_OWN_ERRORS.has(obj) ? calcNo('own error message') : obj.message
    return calcNo('error property')
  }
  if (jsIsPlain(obj)) {
    if (typeof k === 'string' || typeof k === 'number') {
      const key2 = String(k)
      if (Object.hasOwn(obj, key2)) return obj[key2]
      if (key2 in Object.prototype) return calcNo(`object ${key2}`)
    }
    return undefined
  }
  return calcNo('property')
}

function jsSet(obj: unknown, key: unknown, v: unknown): void {
  if (obj === null || obj === undefined) jsThrow('TypeError')
  if (Array.isArray(obj)) {
    if (key === 'length') {
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > CALC_SIZE_MAX) calcNo('length')
      obj.length = v
      return
    }
    const n = typeof key === 'number' ? key : Number(jsStr(key))
    if (!Number.isInteger(n) || n < 0 || n > CALC_SIZE_MAX) calcNo('array key')
    obj[n] = v
    return
  }
  if (jsIsPlain(obj)) {
    const k = jsStr(key)
    if (k === '__proto__' || (v instanceof CalcFn && ['toString', 'valueOf', 'toJSON'].includes(k))) calcNo('special key')
    obj[k] = v
    return
  }
  calcNo('set property')
}

function jsLookup(name: string, env: CEnv): unknown {
  const got = env.find(name)
  if (got) {
    if (got.v === MISSING) calcNo(`missing ${name}`)
    if (got.v === UNBOUND) jsThrow('ReferenceError')
    return got.v
  }
  if (Object.hasOwn(JS_GLOBALS, name)) return JS_GLOBALS[name]
  return calcNo(`name ${name}`)
}

function jsIterList(v: unknown): unknown[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    if (ASTRAL.test(v)) calcNo('astral')
    return [...v]
  }
  if (v instanceof Set) return [...v]
  if (v instanceof Map) return [...v.entries()].map(([a, b]) => [a, b])
  return jsThrow('TypeError')
}

function jsBind(target: CNode, value: unknown, env: CEnv, kind: string, ctx: CCtx): void {
  if (target.k === 'name') {
    if (kind === '') {
      jsAssignName(target.name, value, env)
      return
    }
    env.def(target.name, value, kind === 'const')
    return
  }
  if (target.k === 'pdef') {
    jsBind(target.target, value === undefined ? jsEval(target.init, env, ctx) : value, env, kind, ctx)
    return
  }
  if (target.k === 'member' || target.k === 'index') {
    if (kind !== '') calcNo('declare member')
    jsAssignTo(target, value, env, ctx)
    return
  }
  if (target.k === 'parr') {
    if (value === null || value === undefined) jsThrow('TypeError')
    const list = jsIterList(value)
    target.items.forEach((one: CNode | null, i: number) => {
      if (one === null) return
      if (one.k === 'rest') jsBind(one.arg, list.slice(i), env, kind, ctx)
      else jsBind(one, list[i], env, kind, ctx)
    })
    return
  }
  if (target.k === 'pobj') {
    if (value === null || value === undefined) jsThrow('TypeError')
    for (const prop of target.props as { key: string; value: CNode }[]) jsBind(prop.value, jsGet(value, prop.key, ctx), env, kind, ctx)
    return
  }
  calcNo('binding')
}
function jsAssignName(name: string, v: unknown, env: CEnv): void {
  const got = env.find(name)
  if (!got) calcNo(`assign undeclared ${name}`)
  if (got.c) jsThrow('TypeError')
  if (got.v === MISSING) calcNo('assign missing')
  got.v = v
}
function jsAssignTo(target: CNode, v: unknown, env: CEnv, ctx: CCtx): void {
  if (target.k === 'name') jsAssignName(target.name, v, env)
  else if (target.k === 'member') jsSet(jsEval(target.obj, env, ctx), target.prop, v)
  else if (target.k === 'index') {
    const obj = jsEval(target.obj, env, ctx)
    jsSet(obj, jsEval(target.prop, env, ctx), v)
  } else jsBind(target, v, env, '', ctx)
}

function jsInvoke(fn: CalcFn, args: unknown[], ctx: CCtx): unknown {
  calcStep(ctx)
  if (ctx.depth >= CALC_DEPTH_MAX) calcNo('depth')
  ctx.depth++
  try {
    const node = fn.node
    const env = new CEnv(fn.env)
    if (node.name && !node.isArrow && !env.find(node.name)) env.def(node.name, fn)
    node.params.forEach((p: CNode, i: number) => jsBind(p, args[i], env, 'let', ctx))
    if (node.isExpr) return jsEval(node.body, env, ctx)
    try {
      jsExecList(node.body.body, env, ctx)
    } catch (x) {
      if (x instanceof CRet) return x.v
      throw x
    }
    return undefined
  } finally {
    ctx.depth--
  }
}

function jsCall(fn: unknown, self: unknown, args: unknown[], ctx: CCtx): unknown {
  if (fn instanceof CalcFn) return jsInvoke(fn, args, ctx)
  if (fn instanceof HostMethod) return jsHostCall(fn.fn, fn.self, args, ctx)
  if (fn instanceof HostNs) return fn.call ? jsHostCall(fn.call, undefined, args, ctx) : calcNo(`call ${fn.name}`)
  if (typeof fn === 'function' && Object.values(JS_GLOBALS).includes(fn)) return jsHostCall(fn as (...args: unknown[]) => unknown, self, args, ctx)
  if (typeof fn === 'function') return jsHostCall(fn as (...args: unknown[]) => unknown, self, args, ctx)
  return jsThrow('TypeError')
}

function jsExecList(list: CNode[], env: CEnv, ctx: CCtx): void {
  for (const st of list) if (st.k === 'fdecl') env.def(st.name, new CalcFn('js', st.fn, env))
  for (const st of list) jsExec(st, env, ctx)
}

function jsLoopBody(body: CNode, env: CEnv, ctx: CCtx): 'break' | 'continue' | undefined {
  try {
    jsExec(body, env, ctx)
  } catch (x) {
    if (x === CBRK) return 'break'
    if (x === CCONT) return 'continue'
    throw x
  }
  return undefined
}

function jsExec(st: CNode, env: CEnv, ctx: CCtx): void {
  calcStep(ctx)
  try {
    jsExecOne(st, env, ctx)
  } catch (x) {
    if (x instanceof CalcThrow && ctx.isTraced && !ctx.trace.err) ctx.trace.err = { s: st.s, e: st.e }
    throw x
  }
}

function jsExecOne(st: CNode, env: CEnv, ctx: CCtx): void {
  switch (st.k) {
    case 'empty':
    case 'fdecl':
      return
    case 'expr':
      jsEval(st.expr, env, ctx)
      return
    case 'var':
      for (const d of st.decls) jsBind(d.target, d.init ? jsEval(d.init, env, ctx) : undefined, env, st.kind, ctx)
      return
    case 'block':
      jsExecList(st.body, new CEnv(env), ctx)
      return
    case 'if': {
      const t = jsTruthy(jsEval(st.test, env, ctx))
      calcCond(ctx, st.test, t)
      if (t) jsExec(st.then, new CEnv(env), ctx)
      else if (st.other) jsExec(st.other, new CEnv(env), ctx)
      return
    }
    case 'while':
    case 'dowhile': {
      let isFirst = st.k === 'dowhile'
      for (;;) {
        calcStep(ctx)
        if (!isFirst) {
          const t = jsTruthy(jsEval(st.test, env, ctx))
          calcCond(ctx, st.test, t)
          if (!t) return
        }
        isFirst = false
        calcLoop(ctx, st)
        if (jsLoopBody(st.body, new CEnv(env), ctx) === 'break') return
      }
    }
    case 'for': {
      let loopEnv = new CEnv(env)
      if (st.init) jsExec(st.init, loopEnv, ctx)
      for (;;) {
        calcStep(ctx)
        if (st.test) {
          const t = jsTruthy(jsEval(st.test, loopEnv, ctx))
          calcCond(ctx, st.test, t)
          if (!t) return
        }
        calcLoop(ctx, st)
        if (jsLoopBody(st.body, new CEnv(loopEnv), ctx) === 'break') return
        const next = new CEnv(env)
        for (const [name, one] of loopEnv.vars) next.vars.set(name, { ...one })
        loopEnv = next
        if (st.update) jsEval(st.update, loopEnv, ctx)
      }
    }
    case 'forof': {
      const right = jsEval(st.right, env, ctx)
      if (right === null || right === undefined) jsThrow('TypeError')
      const isLive = Array.isArray(right)
      const list = isLive ? (right as unknown[]) : jsIterList(right)
      for (let i = 0; i < list.length; i++) {
        calcStep(ctx)
        const iter = new CEnv(env)
        jsBind(st.target, list[i], iter, st.kind, ctx)
        calcLoop(ctx, st)
        if (jsLoopBody(st.body, iter, ctx) === 'break') return
      }
      return
    }
    case 'forin': {
      const right = jsEval(st.right, env, ctx)
      if (right === null || right === undefined) return
      if (!(Array.isArray(right) || jsIsPlain(right) || typeof right === 'string')) calcNo('for in')
      for (const key of Object.keys(right)) {
        calcStep(ctx)
        const iter = new CEnv(env)
        jsBind(st.target, key, iter, st.kind, ctx)
        calcLoop(ctx, st)
        if (jsLoopBody(st.body, iter, ctx) === 'break') return
      }
      return
    }
    case 'return': {
      calcNoteReturn(ctx, st, st.arg, env)
      throw new CRet(st.arg ? jsEval(st.arg, env, ctx) : undefined)
    }
    case 'break':
      throw CBRK
    case 'continue':
      throw CCONT
    case 'throw': {
      const v = jsEval(st.arg, env, ctx)
      let name = 'Error'
      if (v !== null && typeof v === 'object') {
        const n = v instanceof Error ? v.name : jsIsPlain(v) ? v.name : undefined
        if (typeof n === 'string' && n !== '') name = n
        else if (n !== undefined && n !== null && n !== '' && n !== 0 && n !== false) calcNo('error name')
      }
      throw new CalcThrow(name, v)
    }
    case 'try': {
      try {
        jsExec(st.body, env, ctx)
      } catch (x) {
        if (!(x instanceof CalcThrow) || !st.handler) throw x
        ctx.trace.err = undefined
        const catchEnv = new CEnv(env)
        if (st.param) jsBind(st.param, x.value, catchEnv, 'let', ctx)
        jsExec(st.handler, catchEnv, ctx)
      } finally {
        if (st.finalizer) jsExec(st.finalizer, env, ctx)
      }
      return
    }
    case 'switch': {
      const v = jsEval(st.disc, env, ctx)
      let at = -1
      for (let i = 0; i < st.cases.length; i++) {
        const c = st.cases[i]
        if (c.test && jsEval(c.test, env, ctx) === v) {
          at = i
          break
        }
      }
      if (at === -1) at = st.cases.findIndex((c: { test?: CNode }) => !c.test)
      calcCond(ctx, st.disc, at !== -1)
      if (at === -1) return
      const block = new CEnv(env)
      try {
        for (let i = at; i < st.cases.length; i++) jsExecList(st.cases[i].body, block, ctx)
      } catch (x) {
        if (x === CBRK) return
        throw x
      }
      return
    }
  }
  calcNo(`statement ${st.k}`)
}

function jsSpread(items: (CNode | null)[], env: CEnv, ctx: CCtx): unknown[] {
  const out: unknown[] = []
  for (const one of items) {
    if (one === null) calcNo('hole')
    if (one.k === 'spread') {
      const v = jsEval(one.arg, env, ctx)
      if (v === null || v === undefined) jsThrow('TypeError')
      out.push(...jsIterList(v))
    } else out.push(jsEval(one, env, ctx))
    if (out.length > CALC_SIZE_MAX) calcNo('size')
  }
  return out
}

function jsBinop(op: string, a: unknown, b: unknown): unknown {
  if (op === '===') return a === b
  if (op === '!==') return a !== b
  const l = jsGuardOperand(a) as any
  const r = jsGuardOperand(b) as any
  switch (op) {
    case '+':
      return jsCheckSize(l + r)
    case '-':
      return l - r
    case '*':
      return l * r
    case '/':
      return l / r
    case '%':
      return l % r
    case '**':
      return l ** r
    case '==':
      return l == r
    case '!=':
      return l != r
    case '<':
      return l < r
    case '>':
      return l > r
    case '<=':
      return l <= r
    case '>=':
      return l >= r
    case '&':
      return l & r
    case '|':
      return l | r
    case '^':
      return l ^ r
    case '<<':
      return l << r
    case '>>':
      return l >> r
    case '>>>':
      return l >>> r
    case 'in':
      if (r === null || typeof r !== 'object') jsThrow('TypeError')
      return jsStr(l) in r
  }
  return calcNo(`operator ${op}`)
}

function jsChain(node: CNode, env: CEnv, ctx: CCtx): { value: unknown; self: unknown } {
  const sub = (n: CNode) => (n.k === 'member' || n.k === 'index' || n.k === 'call' ? jsChain(n, env, ctx).value : jsEval(n, env, ctx))
  if (node.k === 'member' || node.k === 'index') {
    const obj = sub(node.obj)
    if (node.opt && (obj === null || obj === undefined)) throw OPT_SHORT
    const key = node.k === 'member' ? node.prop : jsEval(node.prop, env, ctx)
    return { value: jsGet(obj, key, ctx), self: obj }
  }
  if (node.k === 'call') {
    let fn: unknown
    let self: unknown
    if (node.callee.k === 'member' || node.callee.k === 'index') {
      const got = jsChain(node.callee, env, ctx)
      fn = got.value
      self = got.self
    } else fn = sub(node.callee)
    if (node.opt && (fn === null || fn === undefined)) throw OPT_SHORT
    const args = jsSpread(node.args, env, ctx)
    return { value: jsCall(fn, self, args, ctx), self: undefined }
  }
  return { value: jsEval(node, env, ctx), self: undefined }
}

function jsEval(node: CNode, env: CEnv, ctx: CCtx): unknown {
  switch (node.k) {
    case 'lit':
      return node.value
    case 're':
      return new RegExp(node.source, node.flags)
    case 'tmpl': {
      let out = node.strs[0]
      node.exprs.forEach((one: CNode, i: number) => {
        out += jsStr(jsGuardOperand(jsEval(one, env, ctx))) + node.strs[i + 1]
      })
      return jsCheckSize(out)
    }
    case 'name':
      return jsLookup(node.name, env)
    case 'arr':
      return jsSpread(node.items, env, ctx)
    case 'obj': {
      const out: Record<string, unknown> = {}
      for (const prop of node.props) {
        if (prop.kind === 'spread') {
          const v = jsEval(prop.value, env, ctx)
          if (v === null || v === undefined) continue
          if (!(jsIsPlain(v) || Array.isArray(v) || typeof v === 'string')) calcNo('spread object')
          Object.assign(out, v)
          continue
        }
        const key = typeof prop.key === 'string' ? prop.key : jsStr(jsGuardOperand(jsEval(prop.key, env, ctx)))
        jsSet(out, key, prop.value.k === 'func' ? new CalcFn('js', prop.value, env) : jsEval(prop.value, env, ctx))
      }
      return out
    }
    case 'func':
      return new CalcFn('js', node, env)
    case 'unary': {
      if (node.op === 'typeof') {
        if (node.arg.k === 'name' && !env.find(node.arg.name) && !Object.hasOwn(JS_GLOBALS, node.arg.name)) calcNo('typeof undeclared')
        const v = jsEval(node.arg, env, ctx)
        return v instanceof CalcFn || v instanceof HostMethod || typeof v === 'function' || (v instanceof HostNs && v.call) ? 'function' : v instanceof HostNs ? 'object' : typeof v
      }
      const v = jsEval(node.arg, env, ctx)
      if (node.op === '!') return !jsTruthy(v)
      const a = jsGuardOperand(v) as any
      return node.op === '-' ? -a : node.op === '+' ? +a : ~a
    }
    case 'bin':
      return jsBinop(node.op, jsEval(node.left, env, ctx), jsEval(node.right, env, ctx))
    case 'logic': {
      const l = jsEval(node.left, env, ctx)
      if (node.op === '&&') return jsTruthy(l) ? jsEval(node.right, env, ctx) : l
      if (node.op === '||') return jsTruthy(l) ? l : jsEval(node.right, env, ctx)
      return l === null || l === undefined ? jsEval(node.right, env, ctx) : l
    }
    case 'cond': {
      const t = jsTruthy(jsEval(node.test, env, ctx))
      calcCond(ctx, node.test, t)
      return t ? jsEval(node.then, env, ctx) : jsEval(node.other, env, ctx)
    }
    case 'seq': {
      let v: unknown
      for (const one of node.list) v = jsEval(one, env, ctx)
      return v
    }
    case 'assign': {
      const { op, target } = node
      if (op === '=') {
        const v = jsEval(node.right, env, ctx)
        jsAssignTo(target, v, env, ctx)
        return v
      }
      let obj: unknown
      let key: unknown
      let cur: unknown
      if (target.k === 'name') cur = jsLookup(target.name, env)
      else {
        obj = jsEval(target.obj, env, ctx)
        key = target.k === 'member' ? target.prop : jsEval(target.prop, env, ctx)
        cur = jsGet(obj, key, ctx)
      }
      let v: unknown
      if (op === '&&=' || op === '||=' || op === '??=') {
        const isKept = op === '&&=' ? !jsTruthy(cur) : op === '||=' ? jsTruthy(cur) : cur !== null && cur !== undefined
        if (isKept) return cur
        v = jsEval(node.right, env, ctx)
      } else v = jsBinop(op.slice(0, -1), cur, jsEval(node.right, env, ctx))
      if (target.k === 'name') jsAssignName(target.name, v, env)
      else jsSet(obj, key, v)
      return v
    }
    case 'update': {
      const { arg } = node
      let obj: unknown
      let key: unknown
      let cur: unknown
      if (arg.k === 'name') cur = jsLookup(arg.name, env)
      else {
        obj = jsEval(arg.obj, env, ctx)
        key = arg.k === 'member' ? arg.prop : jsEval(arg.prop, env, ctx)
        cur = jsGet(obj, key, ctx)
      }
      const old = +(jsGuardOperand(cur) as any)
      const v = node.op === '++' ? old + 1 : old - 1
      if (arg.k === 'name') jsAssignName(arg.name, v, env)
      else jsSet(obj, key, v)
      return node.prefix ? v : old
    }
    case 'member':
    case 'index':
    case 'call':
      try {
        return jsChain(node, env, ctx).value
      } catch (x) {
        if (x === OPT_SHORT) return undefined
        throw x
      }
    case 'new': {
      if (node.callee.k !== 'name') calcNo('new')
      const args = jsSpread(node.args, env, ctx)
      if ((node.callee.name === 'Set' || node.callee.name === 'Map') && !env.find(node.callee.name)) {
        const src = args[0]
        const items = src === undefined || src === null ? [] : jsIterList(src)
        return node.callee.name === 'Set' ? new Set(items) : new Map(items.map(one => (Array.isArray(one) ? [one[0], one[1]] : jsThrow('TypeError'))) as [unknown, unknown][])
      }
      const callee = jsLookup(node.callee.name, env)
      if (callee instanceof HostNs) {
        if (['Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError'].includes(callee.name)) return callee.call!(...args)
        if (callee.name === 'Array') {
          if (args.length === 1 && typeof args[0] === 'number' && args[0] > CALC_SIZE_MAX) calcNo('size')
          return jsHostCall((...a: unknown[]) => new Array(...(a as [number])), undefined, args, ctx)
        }
      }
      return calcNo('new')
    }
    case 'spread':
      return calcNo('spread')
  }
  return calcNo(`expression ${node.k}`)
}
// ------------------------------------------------------------------ py runtime

export class PyTuple {
  constructor(readonly items: unknown[]) {}
}
export class PyDict {
  readonly m = new Map<string, [unknown, unknown]>()
}
export class PySet {
  readonly m = new Map<string, unknown>()
}
class PyRange {
  constructor(
    readonly start: bigint,
    readonly stop: bigint,
    readonly step: bigint,
  ) {}
}
class PyView {
  constructor(
    readonly kind: 'keys' | 'values' | 'items',
    readonly d: PyDict,
  ) {}
}
class PyIter {
  constructor(readonly gen: Generator<unknown>) {}
}
class PyExc {
  constructor(
    readonly name: string,
    readonly args: unknown[] | undefined,
  ) {}
}
class PyType {
  constructor(readonly name: string) {}
}
class PyBuiltin {
  constructor(
    readonly name: string,
    readonly fn: (args: unknown[], kw: Map<string, unknown>, ctx: CCtx) => unknown,
  ) {}
}
class PyBound {
  constructor(
    readonly self: unknown,
    readonly name: string,
  ) {}
}
class PyMod {
  constructor(
    readonly name: string,
    readonly members: Record<string, unknown>,
  ) {}
}
class PySlice {
  constructor(
    readonly lower: unknown,
    readonly upper: unknown,
    readonly step: unknown,
  ) {}
}

const PY_EXC_PARENT: Record<string, string> = {
  ZeroDivisionError: 'ArithmeticError',
  OverflowError: 'ArithmeticError',
  ArithmeticError: 'Exception',
  KeyError: 'LookupError',
  IndexError: 'LookupError',
  LookupError: 'Exception',
  ValueError: 'Exception',
  TypeError: 'Exception',
  AttributeError: 'Exception',
  NameError: 'Exception',
  UnboundLocalError: 'NameError',
  AssertionError: 'Exception',
  RuntimeError: 'Exception',
  RecursionError: 'RuntimeError',
  StopIteration: 'Exception',
  NotImplementedError: 'RuntimeError',
  Exception: 'BaseException',
}

function pyThrow(name: string): never {
  throw new CalcThrow(name, new PyExc(name, undefined))
}
const isPyInt = (v: unknown): v is bigint | boolean => typeof v === 'bigint' || typeof v === 'boolean'
const isPyNum = (v: unknown): v is bigint | boolean | number => isPyInt(v) || typeof v === 'number'
const pyBig = (v: bigint | boolean): bigint => (typeof v === 'boolean' ? (v ? 1n : 0n) : v)
const BIG_SAFE = 2n ** 53n
function pyF(v: bigint | boolean | number): number {
  if (typeof v === 'number') return v
  const n = Number(pyBig(v))
  if (!Number.isFinite(n)) calcNo('float overflow')
  return n
}
function pyCheckBig(v: bigint): bigint {
  if ((v < 0n ? -v : v).toString().length > CALC_PY_DIGITS) calcNo('big int')
  return v
}
function pyCheckFloat(v: number): number {
  if (!Number.isFinite(v)) calcNo('float special')
  return v
}
function pyCheckSize<T>(v: T): T {
  if (typeof v === 'string' && v.length > CALC_SIZE_MAX * 10) calcNo('size')
  if (Array.isArray(v) && v.length > CALC_SIZE_MAX) calcNo('size')
  return v
}

// --- float repr, round, fixed format (feas/pyfloat.mjs: 0 wrong in 377,187 comparisons with python3 3.11)

export function pyFloatRepr(x: number): string {
  if (!Number.isFinite(x)) return calcNo('float special')
  if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0'
  const sign = x < 0 ? '-' : ''
  const [mant, expS] = Math.abs(x).toExponential().split('e') as [string, string]
  const digits = mant.replace('.', '')
  const exp = Number(expS)
  if (exp < -4 || exp >= 16) {
    const m = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits
    const es = Math.abs(exp) < 10 ? `0${Math.abs(exp)}` : `${Math.abs(exp)}`
    return `${sign}${m}e${exp < 0 ? '-' : '+'}${es}`
  }
  if (exp >= digits.length - 1) return `${sign}${digits}${'0'.repeat(exp - digits.length + 1)}.0`
  if (exp >= 0) return `${sign}${digits.slice(0, exp + 1)}.${digits.slice(exp + 1)}`
  return `${sign}0.${'0'.repeat(-exp - 1)}${digits}`
}
function pyHalfEven(x: number, n: number): string {
  if (Math.abs(x) >= 1e21 || n > 100 || n < 0) return calcNo('round range')
  const full = Math.abs(x).toFixed(100)
  const [ip, fp] = full.split('.') as [string, string]
  const tail = fp.slice(n)
  if (/[1-9]/.test(tail.slice(70))) calcNo('round digits')
  const isTie = tail[0] === '5' && /^0*$/.test(tail.slice(1))
  if (!isTie) return Math.abs(x).toFixed(n)
  const kept = n === 0 ? ip : `${ip}.${fp.slice(0, n)}`
  if (Number(kept.replace('.', '').at(-1)) % 2 === 0) return kept
  return Math.abs(x).toFixed(n)
}
export function pyRoundFloat(x: number, n?: number): bigint | number {
  pyCheckFloat(x)
  if (n === undefined) {
    const s = pyHalfEven(x, 0)
    return BigInt(`${x < 0 && s !== '0' ? '-' : ''}${s}`)
  }
  return (x < 0 ? -1 : 1) * Number(pyHalfEven(x, n))
}
export function pyFmtFixed(x: number, n: number): string {
  pyCheckFloat(x)
  const s = pyHalfEven(x, n)
  return `${x < 0 || Object.is(x, -0) ? '-' : ''}${s}`
}

// --- repr, str, truth, equality, order, hash

function pyStrRepr(s: string): string {
  if (ASTRAL.test(s)) calcNo('astral')
  const q = s.includes("'") && !s.includes('"') ? '"' : "'"
  let out = q
  for (const c of s) {
    const code = c.charCodeAt(0)
    if (c === '\\') out += '\\\\'
    else if (c === q) out += '\\' + q
    else if (c === '\n') out += '\\n'
    else if (c === '\r') out += '\\r'
    else if (c === '\t') out += '\\t'
    else if (code < 0x20 || code === 0x7f || (code >= 0x80 && code < 0xa0)) out += `\\x${code.toString(16).padStart(2, '0')}`
    else if (code >= 0xa0 && /[\p{C}\p{Z}]/u.test(c)) calcNo('unprintable')
    else out += c
  }
  return out + q
}
function pyRepr(v: unknown, depth = 0): string {
  if (depth > 20) calcNo('deep')
  if (v === null) return 'None'
  if (v === true) return 'True'
  if (v === false) return 'False'
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'number') return pyFloatRepr(v)
  if (typeof v === 'string') return pyStrRepr(v)
  if (Array.isArray(v)) return `[${v.map(one => pyRepr(one, depth + 1)).join(', ')}]`
  if (v instanceof PyTuple) return v.items.length === 1 ? `(${pyRepr(v.items[0], depth + 1)},)` : `(${v.items.map(one => pyRepr(one, depth + 1)).join(', ')})`
  if (v instanceof PyDict) return `{${[...v.m.values()].map(([k, x]) => `${pyRepr(k, depth + 1)}: ${pyRepr(x, depth + 1)}`).join(', ')}}`
  if (v instanceof PySet) return v.m.size === 0 ? 'set()' : v.m.size === 1 ? `{${pyRepr([...v.m.values()][0], depth + 1)}}` : calcNo('set order')
  if (v instanceof PyRange) return v.step === 1n ? `range(${v.start}, ${v.stop})` : `range(${v.start}, ${v.stop}, ${v.step})`
  if (v instanceof PyView) {
    const items = v.kind === 'keys' ? [...v.d.m.values()].map(([k]) => k) : v.kind === 'values' ? [...v.d.m.values()].map(([, x]) => x) : [...v.d.m.values()].map(([k, x]) => new PyTuple([k, x]))
    return `dict_${v.kind}(${pyRepr(items, depth + 1)})`
  }
  return calcNo('repr')
}
function pyStr(v: unknown): string {
  if (typeof v === 'string') return v
  if (v instanceof PyExc) return v.args === undefined ? calcNo('own error text') : v.args.length === 0 ? '' : v.args.length === 1 ? pyStr(v.args[0]) : pyRepr(new PyTuple(v.args))
  return pyRepr(v)
}
function pyTruthy(v: unknown): boolean {
  if (v === null) return false
  if (typeof v === 'boolean') return v
  if (typeof v === 'bigint') return v !== 0n
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v.length > 0
  if (Array.isArray(v)) return v.length > 0
  if (v instanceof PyTuple) return v.items.length > 0
  if (v instanceof PyDict || v instanceof PySet) return v.m.size > 0
  if (v instanceof PyRange) return pyRangeLen(v) > 0n
  if (v instanceof PyView) return v.d.m.size > 0
  return true
}
function pyNumEq(a: bigint | boolean | number, b: bigint | boolean | number): boolean {
  if (isPyInt(a) && isPyInt(b)) return pyBig(a) === pyBig(b)
  const big = isPyInt(a) ? pyBig(a) : isPyInt(b) ? pyBig(b) : 0n
  if (big > BIG_SAFE || big < -BIG_SAFE) calcNo('big compare')
  return pyF(a) === pyF(b)
}
function pyEq(a: unknown, b: unknown): boolean {
  if (isPyNum(a) && isPyNum(b)) return pyNumEq(a, b)
  if (typeof a === 'string' || typeof b === 'string') return a === b
  if (a === null || b === null) return a === b
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((one, i) => pyEq(one, b[i]))
  if (a instanceof PyTuple && b instanceof PyTuple) return a.items.length === b.items.length && a.items.every((one, i) => pyEq(one, b.items[i]))
  if (a instanceof PyDict && b instanceof PyDict) return a.m.size === b.m.size && [...a.m].every(([k, [, x]]) => b.m.has(k) && pyEq(x, b.m.get(k)![1]))
  if (a instanceof PySet && b instanceof PySet) return a.m.size === b.m.size && [...a.m.keys()].every(k => b.m.has(k))
  if (a instanceof PyRange || b instanceof PyRange) calcNo('range compare')
  return a === b
}
function pyCompare(op: string, a: unknown, b: unknown): boolean {
  switch (op) {
    case '==':
      return pyEq(a, b)
    case '!=':
      return !pyEq(a, b)
    case 'in':
      return pyContains(b, a)
    case 'not in':
      return !pyContains(b, a)
    case 'is':
    case 'is not': {
      let same: boolean
      if (a === null || b === null || typeof a === 'boolean' || typeof b === 'boolean') same = a === b
      else if (typeof a === 'object' && typeof b === 'object') same = a === b
      else return calcNo('is on values')
      return op === 'is' ? same : !same
    }
  }
  if (isPyNum(a) && isPyNum(b)) {
    if (isPyInt(a) && isPyInt(b)) {
      const x = pyBig(a)
      const y = pyBig(b)
      return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y
    }
    const big = isPyInt(a) ? pyBig(a) : isPyInt(b) ? pyBig(b) : 0n
    if (big > BIG_SAFE || big < -BIG_SAFE) calcNo('big compare')
    const x = pyF(a)
    const y = pyF(b)
    return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y
  }
  if (typeof a === 'string' && typeof b === 'string') return op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b
  const seq = (v: unknown) => (Array.isArray(v) ? v : v instanceof PyTuple ? v.items : undefined)
  const x = seq(a)
  const y = seq(b)
  if (x && y && Array.isArray(a) === Array.isArray(b)) {
    for (let i = 0; i < Math.min(x.length, y.length); i++) if (!pyEq(x[i], y[i])) return pyCompare(op, x[i], y[i])
    const [m, n] = [x.length, y.length]
    return op === '<' ? m < n : op === '>' ? m > n : op === '<=' ? m <= n : m >= n
  }
  if (a instanceof PySet || b instanceof PySet) calcNo('set order compare')
  return pyThrow('TypeError')
}
function pyKey(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'i:1' : 'i:0'
  if (typeof v === 'bigint') return `i:${v}`
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) calcNo('float key')
    return Number.isInteger(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER ? `i:${BigInt(v)}` : `f:${v}`
  }
  if (typeof v === 'string') return `s:${v}`
  if (v === null) return 'n'
  if (v instanceof PyTuple) return `t:(${v.items.map(pyKey).join(',')})`
  if (Array.isArray(v) || v instanceof PyDict || v instanceof PySet) pyThrow('TypeError')
  return calcNo('hash')
}
function pyContains(container: unknown, item: unknown): boolean {
  if (typeof container === 'string') {
    if (typeof item !== 'string') pyThrow('TypeError')
    return container.includes(item)
  }
  if (Array.isArray(container)) return container.some(one => pyEq(one, item))
  if (container instanceof PyTuple) return container.items.some(one => pyEq(one, item))
  if (container instanceof PyDict) return container.m.has(pyKey(item))
  if (container instanceof PySet) return container.m.has(pyKey(item))
  if (container instanceof PyView) return container.kind === 'keys' ? container.d.m.has(pyKey(item)) : [...pyGen(container)].some(one => pyEq(one, item))
  if (container instanceof PyRange) {
    if (!isPyInt(item)) return [...pyGen(container)].some(one => pyEq(one, item))
    const x = pyBig(item)
    const { start, stop, step } = container
    const isIn = step > 0n ? x >= start && x < stop : x <= start && x > stop
    return isIn && (x - start) % step === 0n
  }
  return pyThrow('TypeError')
}

function pyRangeLen(r: PyRange): bigint {
  const { start, stop, step } = r
  if (step > 0n) return stop > start ? (stop - start + step - 1n) / step : 0n
  return start > stop ? (start - stop - step - 1n) / -step : 0n
}

function* pyGen(v: unknown): Generator<unknown> {
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) yield v[i]
    return
  }
  if (v instanceof PyTuple) {
    yield* v.items
    return
  }
  if (typeof v === 'string') {
    if (ASTRAL.test(v)) calcNo('astral')
    yield* v
    return
  }
  if (v instanceof PyDict) {
    yield* [...v.m.values()].map(([k]) => k)
    return
  }
  if (v instanceof PyView) {
    const list = [...v.d.m.values()]
    if (v.kind === 'keys') yield* list.map(([k]) => k)
    else if (v.kind === 'values') yield* list.map(([, x]) => x)
    else yield* list.map(([k, x]) => new PyTuple([k, x]))
    return
  }
  if (v instanceof PySet) {
    if (v.m.size > 1) calcNo('set order')
    yield* v.m.values()
    return
  }
  if (v instanceof PyRange) {
    if (pyRangeLen(v) > BigInt(CALC_SIZE_MAX)) calcNo('size')
    for (let x = v.start; v.step > 0n ? x < v.stop : x > v.stop; x += v.step) yield x
    return
  }
  if (v instanceof PyIter) {
    for (;;) {
      const got = v.gen.next()
      if (got.done) return
      yield got.value
    }
  }
  pyThrow('TypeError')
}
function pyList(v: unknown, ctx: CCtx): unknown[] {
  const out: unknown[] = []
  for (const one of pyGen(v)) {
    calcStep(ctx)
    out.push(one)
    if (out.length > CALC_SIZE_MAX) calcNo('size')
  }
  return out
}

// --- arithmetic

function pyFloatPow(x: number, y: number): number {
  if (y === 0) return 1
  if (y === 1) return x
  if (y === 2) return pyCheckFloat(x * x)
  if (y === -1) return x === 0 ? pyThrow('ZeroDivisionError') : pyCheckFloat(1 / x)
  if (y === 0.5 && x >= 0) return Math.sqrt(x)
  return calcNo('float power')
}
function pyNumOp(op: string, a: bigint | boolean | number, b: bigint | boolean | number): unknown {
  if (isPyInt(a) && isPyInt(b)) {
    const x = pyBig(a)
    const y = pyBig(b)
    switch (op) {
      case '+':
        return pyCheckBig(x + y)
      case '-':
        return pyCheckBig(x - y)
      case '*':
        return pyCheckBig(x * y)
      case '/':
        if (y === 0n) pyThrow('ZeroDivisionError')
        if (x > BIG_SAFE || x < -BIG_SAFE || y > BIG_SAFE || y < -BIG_SAFE) calcNo('big division')
        return pyCheckFloat(Number(x) / Number(y))
      case '//': {
        if (y === 0n) pyThrow('ZeroDivisionError')
        let q = x / y
        if (x % y !== 0n && x < 0n !== y < 0n) q -= 1n
        return q
      }
      case '%': {
        if (y === 0n) pyThrow('ZeroDivisionError')
        let r = x % y
        if (r !== 0n && r < 0n !== y < 0n) r += y
        return r
      }
      case '**':
        if (y < 0n) return x === 0n ? pyThrow('ZeroDivisionError') : pyFloatPow(pyF(x), pyF(y))
        if (y > 200n) calcNo('big power')
        return pyCheckBig(x ** y)
      case '&':
      case '|':
      case '^': {
        const r = op === '&' ? x & y : op === '|' ? x | y : x ^ y
        return typeof a === 'boolean' && typeof b === 'boolean' ? r !== 0n : r
      }
      case '<<':
        if (y < 0n) pyThrow('ValueError')
        if (y > 64n) calcNo('shift')
        return pyCheckBig(x << y)
      case '>>':
        if (y < 0n) pyThrow('ValueError')
        return x >> y
    }
    return calcNo(`int ${op}`)
  }
  const x = pyF(a)
  const y = pyF(b)
  switch (op) {
    case '+':
      return pyCheckFloat(x + y)
    case '-':
      return pyCheckFloat(x - y)
    case '*':
      return pyCheckFloat(x * y)
    case '/':
      if (y === 0) pyThrow('ZeroDivisionError')
      return pyCheckFloat(x / y)
    case '//':
    case '%': {
      if (y === 0) pyThrow('ZeroDivisionError')
      let mod = x % y
      let div = (x - mod) / y
      if (mod) {
        if (y < 0 !== mod < 0) {
          mod += y
          div -= 1
        }
      } else mod = y < 0 ? -0 : 0
      if (op === '%') return mod
      let floordiv: number
      if (div) {
        floordiv = Math.floor(div)
        if (div - floordiv > 0.5) floordiv += 1
      } else floordiv = x / y < 0 || Object.is(x / y, -0) ? -0 : 0
      return pyCheckFloat(floordiv)
    }
    case '**':
      return pyFloatPow(x, y)
  }
  return calcNo(`float ${op}`)
}
function pyBinop(op: string, a: unknown, b: unknown, ctx: CCtx): unknown {
  if (isPyNum(a) && isPyNum(b)) return pyNumOp(op, a, b)
  if (op === '+') {
    if (typeof a === 'string' && typeof b === 'string') return pyCheckSize(a + b)
    if (Array.isArray(a) && Array.isArray(b)) return pyCheckSize([...a, ...b])
    if (a instanceof PyTuple && b instanceof PyTuple) return new PyTuple(pyCheckSize([...a.items, ...b.items]))
    return pyThrow('TypeError')
  }
  if (op === '*') {
    const [seq, n] = isPyInt(b) ? [a, pyBig(b)] : isPyInt(a) ? [b, pyBig(a)] : [undefined, 0n]
    if (seq === undefined) return pyThrow('TypeError')
    const times = n < 0n ? 0 : Number(n)
    if (typeof seq === 'string') {
      if (seq.length * times > CALC_SIZE_MAX * 10) calcNo('size')
      return seq.repeat(times)
    }
    const items = Array.isArray(seq) ? seq : seq instanceof PyTuple ? seq.items : pyThrow('TypeError')
    if (items.length * times > CALC_SIZE_MAX) calcNo('size')
    const out: unknown[] = []
    for (let k = 0; k < times; k++) out.push(...items)
    return Array.isArray(seq) ? out : new PyTuple(out)
  }
  if (op === '%' && typeof a === 'string') return calcNo('percent format')
  if ((op === '|' || op === '&' || op === '-' || op === '^') && (a instanceof PySet || a instanceof PyDict)) return calcNo('set operator')
  void ctx
  return pyThrow('TypeError')
}

// --- format

function pyGroup(digits: string, sep: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}
function pyFormatSpec(v: unknown, spec: string): string {
  const m = /^(?:([^{}])?([<>^=]))?([+\- ])?(z)?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/.exec(spec)
  if (!m) return calcNo('format spec')
  const [, fill0, align0, sign = '-', z, alt, zero, width0, group, prec0, type] = m
  if (z || alt) calcNo('format flag')
  let fill = fill0 ?? ' '
  let align = align0
  if (zero && !align0) {
    fill = '0'
    align = '='
  }
  const width = width0 ? Number(width0) : 0
  const prec = prec0 === undefined ? undefined : Number(prec0)
  let head = ''
  let body: string
  if (typeof v === 'string') {
    if ((type && type !== 's') || group || sign !== '-' || align === '=') calcNo('string format')
    body = prec === undefined ? v : v.slice(0, prec)
    align ??= '<'
  } else if (isPyNum(v)) {
    if (typeof v === 'boolean') calcNo('bool format')
    let neg: boolean
    if (type === 'd' || (type === undefined && typeof v === 'bigint')) {
      if (typeof v !== 'bigint' || prec !== undefined) calcNo('int format')
      neg = v < 0n
      body = (neg ? -v : v).toString()
      if (group) {
        if (zero) calcNo('zero group')
        body = pyGroup(body, group)
      }
    } else if (type === 'f' || type === 'F' || type === '%') {
      let x = pyF(v)
      if (type === '%') x = pyCheckFloat(x * 100)
      const text = pyFmtFixed(x, prec ?? 6)
      neg = text.startsWith('-')
      body = neg ? text.slice(1) : text
      if (group) {
        if (zero) calcNo('zero group')
        const [ip, fp] = body.split('.') as [string, string | undefined]
        body = pyGroup(ip, group) + (fp !== undefined ? `.${fp}` : '')
      }
      if (type === '%') body += '%'
    } else if (type === undefined && typeof v === 'number' && prec === undefined && !group) {
      const text = pyFloatRepr(v)
      neg = text.startsWith('-')
      body = neg ? text.slice(1) : text
    } else return calcNo('number format')
    head = neg ? '-' : sign === '+' ? '+' : sign === ' ' ? ' ' : ''
    align ??= '>'
  } else return calcNo('format value')
  const total = head.length + body.length
  if (total >= width) return head + body
  const pad = width - total
  if (align === '<') return head + body + fill.repeat(pad)
  if (align === '>') return fill.repeat(pad) + head + body
  if (align === '=') return head + fill.repeat(pad) + body
  const left = Math.floor(pad / 2)
  return fill.repeat(left) + head + body + fill.repeat(pad - left)
}
function pyFormat(v: unknown, conv: string | undefined, spec: string | undefined): string {
  const base = conv === 'r' ? pyRepr(v) : conv === 's' ? pyStr(v) : v
  if (spec === undefined || spec === '') return typeof base === 'string' ? base : pyStr(base)
  return pyFormatSpec(base, spec)
}

// --- builtins

const PY_WS = ' \t\n\r\x0b\x0c\x1c\x1d\x1e\x1f'
function pyAscii(s: string): string {
  if (/[^\x00-\x7f]/.test(s)) calcNo('non-ASCII')
  return s
}
function pyIndex(i: unknown, n: number): number {
  if (!isPyInt(i)) pyThrow('TypeError')
  let k = Number(pyBig(i))
  if (k < 0) k += n
  if (k < 0 || k >= n) pyThrow('IndexError')
  return k
}
function pySliceRange(n: number, s: PySlice): number[] {
  const num = (v: unknown, name: string) => (v === null || v === undefined ? undefined : isPyInt(v) ? Number(pyBig(v)) : pyThrow(name))
  const step = num(s.step, 'TypeError') ?? 1
  if (step === 0) pyThrow('ValueError')
  let start = num(s.lower, 'TypeError')
  let stop = num(s.upper, 'TypeError')
  if (start === undefined) start = step < 0 ? n - 1 : 0
  else {
    if (start < 0) start += n
    if (start < 0) start = step < 0 ? -1 : 0
    else if (start >= n) start = step < 0 ? n - 1 : n
  }
  if (stop === undefined) stop = step < 0 ? -1 : n
  else {
    if (stop < 0) stop += n
    if (stop < 0) stop = step < 0 ? -1 : 0
    else if (stop >= n) stop = step < 0 ? n - 1 : n
  }
  const out: number[] = []
  for (let k = start; step > 0 ? k < stop : k > stop; k += step) out.push(k)
  return out
}
function pyGetItem(obj: unknown, idx: unknown): unknown {
  if (obj instanceof PyDict) {
    const got = obj.m.get(pyKey(idx))
    if (!got) pyThrow('KeyError')
    return got[1]
  }
  const seq = typeof obj === 'string' ? obj : Array.isArray(obj) ? obj : obj instanceof PyTuple ? obj.items : undefined
  if (seq === undefined) {
    if (obj instanceof PyRange) {
      const len = Number(pyRangeLen(obj))
      return obj.start + BigInt(pyIndex(idx, len)) * obj.step
    }
    return pyThrow('TypeError')
  }
  if (idx instanceof PySlice) {
    const picks = pySliceRange(seq.length, idx)
    if (typeof seq === 'string') return picks.map(k => seq[k]).join('')
    const items = picks.map(k => seq[k])
    return obj instanceof PyTuple ? new PyTuple(items) : items
  }
  return seq[pyIndex(idx, seq.length)]
}
function pySetItem(obj: unknown, idx: unknown, v: unknown): void {
  if (obj instanceof PyDict) {
    obj.m.set(pyKey(idx), [obj.m.get(pyKey(idx))?.[0] ?? idx, v])
    return
  }
  if (Array.isArray(obj)) {
    if (idx instanceof PySlice) calcNo('slice assignment')
    obj[pyIndex(idx, obj.length)] = v
    return
  }
  pyThrow('TypeError')
}

function pyArgs(args: unknown[], kw: Map<string, unknown>, min: number, max: number, names: string[] = []): unknown[] {
  const out = [...args]
  for (const [k, v] of kw) {
    const at = names.indexOf(k)
    if (at === -1 || at < out.length) pyThrow('TypeError')
    while (out.length < at) out.push(undefined)
    out[at] = v
  }
  if (out.length < min || out.length > max || out.slice(0, min).some(one => one === undefined)) pyThrow('TypeError')
  return out
}
function pyMakeDict(pairs: Iterable<unknown>, ctx: CCtx): PyDict {
  const d = new PyDict()
  for (const one of pairs) {
    calcStep(ctx)
    const pair = pyList(one, ctx)
    if (pair.length !== 2) pyThrow('ValueError')
    d.m.set(pyKey(pair[0]), [pair[0], pair[1]])
  }
  return d
}
function pyMakeSet(items: Iterable<unknown>): PySet {
  const s = new PySet()
  for (const one of items) {
    const k = pyKey(one)
    if (!s.m.has(k)) s.m.set(k, one)
  }
  return s
}
function pySortList(items: unknown[], key: unknown, reverse: unknown, ctx: CCtx): unknown[] {
  const keys = key === null || key === undefined ? items : items.map(one => pyCall(key, [one], new Map(), ctx))
  const order = items.map((_, i) => i)
  const isRev = pyTruthy(reverse ?? false)
  order.sort((i, j) => {
    calcStep(ctx)
    const [a, b] = isRev ? [keys[j], keys[i]] : [keys[i], keys[j]]
    return pyCompare('<', a, b) ? -1 : pyCompare('<', b, a) ? 1 : 0
  })
  return order.map(i => items[i])
}
function pyMinMax(isMax: boolean, args: unknown[], kw: Map<string, unknown>, ctx: CCtx): unknown {
  for (const k of kw.keys()) if (k !== 'key' && k !== 'default') pyThrow('TypeError')
  const key = kw.get('key') ?? null
  const items = args.length === 1 ? pyList(args[0], ctx) : args.length > 1 ? args : pyThrow('TypeError')
  if (args.length === 1 && items.length > 1 && args[0] instanceof PySet) calcNo('set order')
  if (items.length === 0) return kw.has('default') ? kw.get('default') : pyThrow('ValueError')
  let best = items[0]
  let bestKey = key === null ? best : pyCall(key, [best], new Map(), ctx)
  for (const one of items.slice(1)) {
    calcStep(ctx)
    const k = key === null ? one : pyCall(key, [one], new Map(), ctx)
    if (isMax ? pyCompare('<', bestKey, k) : pyCompare('<', k, bestKey)) {
      best = one
      bestKey = k
    }
  }
  return best
}
function pyIntOf(v: unknown, base?: unknown): bigint {
  if (base !== undefined) {
    if (typeof v !== 'string' || !isPyInt(base)) pyThrow('TypeError')
    const b = Number(pyBig(base))
    const text = v.trim().replace(/_/g, '')
    const digits = b === 2 ? /^[+-]?(?:0[bB])?[01]+$/ : b === 8 ? /^[+-]?(?:0[oO])?[0-7]+$/ : b === 16 ? /^[+-]?(?:0[xX])?[\da-fA-F]+$/ : b === 10 ? /^[+-]?\d+$/ : calcNo('int base')
    if (!digits.test(text)) pyThrow('ValueError')
    const neg = text.startsWith('-')
    const bare = text.replace(/^[+-]/, '').replace(/^0[bBoOxX]/, '')
    const prefix = b === 2 ? '0b' : b === 8 ? '0o' : b === 16 ? '0x' : ''
    const n = BigInt(prefix + bare)
    return pyCheckBig(neg ? -n : n)
  }
  if (isPyInt(v)) return pyBig(v)
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) calcNo('int of special')
    return pyCheckBig(BigInt(Math.trunc(v)))
  }
  if (typeof v === 'string') {
    if (/[^\x00-\x7f]/.test(v)) calcNo('non-ASCII int')
    const text = v.replace(new RegExp(`^[${PY_WS}]+|[${PY_WS}]+$`, 'g'), '')
    if (!/^[+-]?\d(?:_?\d)*$/.test(text)) pyThrow('ValueError')
    return pyCheckBig(BigInt(text.replace(/_/g, '')))
  }
  return pyThrow('TypeError')
}
function pyFloatOf(v: unknown): number {
  if (isPyNum(v)) return pyF(v)
  if (typeof v === 'string') {
    if (/[^\x00-\x7f]/.test(v)) calcNo('non-ASCII float')
    const text = v.replace(new RegExp(`^[${PY_WS}]+|[${PY_WS}]+$`, 'g'), '')
    if (/^[+-]?(?:inf|infinity|nan)$/i.test(text)) calcNo('float special')
    if (!/^[+-]?(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?$/.test(text)) pyThrow('ValueError')
    return pyCheckFloat(Number(text.replace(/_/g, '')))
  }
  return pyThrow('TypeError')
}
function pyIsInstance(v: unknown, t: unknown): boolean {
  if (t instanceof PyTuple) return t.items.some(one => pyIsInstance(v, one))
  if (!(t instanceof PyType)) return pyThrow('TypeError')
  switch (t.name) {
    case 'int':
      return isPyInt(v)
    case 'float':
      return typeof v === 'number'
    case 'str':
      return typeof v === 'string'
    case 'bool':
      return typeof v === 'boolean'
    case 'list':
      return Array.isArray(v)
    case 'tuple':
      return v instanceof PyTuple
    case 'dict':
      return v instanceof PyDict
    case 'set':
      return v instanceof PySet
  }
  if (v instanceof PyExc) return pyExcMatches(v.name, t)
  return calcNo('isinstance')
}
function pyExcMatches(name: string, t: unknown): boolean {
  if (t instanceof PyTuple) return t.items.some(one => pyExcMatches(name, one))
  if (!(t instanceof PyType)) return pyThrow('TypeError')
  for (let n: string | undefined = name; n; n = PY_EXC_PARENT[n]) if (n === t.name) return true
  return t.name === 'BaseException'
}

function pyConstruct(name: string, args: unknown[], kw: Map<string, unknown>, ctx: CCtx): unknown {
  if (Object.hasOwn(PY_EXC_PARENT, name)) {
    if (kw.size > 0) pyThrow('TypeError')
    return new PyExc(name, args)
  }
  switch (name) {
    case 'int': {
      const [v, base] = pyArgs(args, kw, 0, 2, ['x', 'base'])
      return v === undefined ? 0n : pyIntOf(v, base)
    }
    case 'float': {
      const [v] = pyArgs(args, kw, 0, 1)
      return v === undefined ? 0 : pyFloatOf(v)
    }
    case 'str': {
      const [v] = pyArgs(args, kw, 0, 1)
      return v === undefined ? '' : pyStr(v)
    }
    case 'bool': {
      const [v] = pyArgs(args, kw, 0, 1)
      return v === undefined ? false : pyTruthy(v)
    }
    case 'list': {
      const [v] = pyArgs(args, kw, 0, 1)
      if (v instanceof PySet && v.m.size > 1) calcNo('set order')
      return v === undefined ? [] : pyList(v, ctx)
    }
    case 'tuple': {
      const [v] = pyArgs(args, kw, 0, 1)
      if (v instanceof PySet && v.m.size > 1) calcNo('set order')
      return new PyTuple(v === undefined ? [] : pyList(v, ctx))
    }
    case 'set': {
      const [v] = pyArgs(args, kw, 0, 1)
      return pyMakeSet(v === undefined ? [] : pyList(v, ctx))
    }
    case 'dict': {
      if (args.length > 1) pyThrow('TypeError')
      const d = args.length === 0 ? new PyDict() : args[0] instanceof PyDict ? pyMakeDict([...args[0].m.values()].map(([k, x]) => new PyTuple([k, x])), ctx) : pyMakeDict(pyList(args[0], ctx), ctx)
      for (const [k, v] of kw) d.m.set(pyKey(k), [k, v])
      return d
    }
  }
  return calcNo(`construct ${name}`)
}

function pyBuiltin(name: string, fn: (args: unknown[], kw: Map<string, unknown>, ctx: CCtx) => unknown): PyBuiltin {
  return new PyBuiltin(name, fn)
}
const PY_TYPES = ['int', 'float', 'str', 'bool', 'list', 'tuple', 'dict', 'set', ...Object.keys(PY_EXC_PARENT), 'BaseException']
const PY_BUILTINS: Record<string, unknown> = Object.fromEntries(PY_TYPES.map(name => [name, new PyType(name)]))
Object.assign(PY_BUILTINS, {
  len: pyBuiltin('len', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (typeof v === 'string') return BigInt(v.length)
    if (Array.isArray(v)) return BigInt(v.length)
    if (v instanceof PyTuple) return BigInt(v.items.length)
    if (v instanceof PyDict || v instanceof PySet) return BigInt(v.m.size)
    if (v instanceof PyView) return BigInt(v.d.m.size)
    if (v instanceof PyRange) return pyRangeLen(v)
    return pyThrow('TypeError')
  }),
  range: pyBuiltin('range', (a, kw) => {
    if (kw.size > 0 || a.length < 1 || a.length > 3) pyThrow('TypeError')
    if (!a.every(isPyInt)) pyThrow('TypeError')
    const n = a.map(one => pyBig(one as bigint | boolean))
    const [start, stop, step] = n.length === 1 ? [0n, n[0]!, 1n] : [n[0]!, n[1]!, n[2] ?? 1n]
    if (step === 0n) pyThrow('ValueError')
    return new PyRange(start, stop, step)
  }),
  sum: pyBuiltin('sum', (a, kw, ctx) => {
    const [it, start] = pyArgs(a, kw, 1, 2, ['iterable', 'start'])
    if (it instanceof PySet && it.m.size > 1 && [...it.m.values()].some(one => typeof one === 'number')) calcNo('set order')
    let total: unknown = start === undefined ? 0n : start
    if (typeof total === 'string') pyThrow('TypeError')
    const items = it instanceof PySet ? [...it.m.values()] : pyList(it, ctx)
    for (const one of items) {
      calcStep(ctx)
      total = pyBinop('+', total, one, ctx)
    }
    return total
  }),
  min: pyBuiltin('min', (a, kw, ctx) => pyMinMax(false, a[0] instanceof PySet && a.length === 1 ? [[...a[0].m.values()]] : a, kw, ctx)),
  max: pyBuiltin('max', (a, kw, ctx) => pyMinMax(true, a[0] instanceof PySet && a.length === 1 ? [[...a[0].m.values()]] : a, kw, ctx)),
  sorted: pyBuiltin('sorted', (a, kw, ctx) => {
    if (a.length !== 1) pyThrow('TypeError')
    for (const k of kw.keys()) if (k !== 'key' && k !== 'reverse') pyThrow('TypeError')
    const items = a[0] instanceof PySet ? [...a[0].m.values()] : pyList(a[0], ctx)
    return pySortList(items, kw.get('key'), kw.get('reverse'), ctx)
  }),
  abs: pyBuiltin('abs', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (isPyInt(v)) {
      const n = pyBig(v)
      return n < 0n ? -n : n
    }
    if (typeof v === 'number') return Math.abs(v)
    return pyThrow('TypeError')
  }),
  round: pyBuiltin('round', (a, kw) => {
    const [v, nd] = pyArgs(a, kw, 1, 2, ['number', 'ndigits'])
    if (nd !== undefined && nd !== null && !isPyInt(nd)) pyThrow('TypeError')
    const n = nd === undefined || nd === null ? undefined : Number(pyBig(nd as bigint))
    if (isPyInt(v)) {
      if (n !== undefined && n < 0) calcNo('round int negative')
      return pyBig(v)
    }
    if (typeof v !== 'number') return pyThrow('TypeError')
    if (n !== undefined && n < 0) calcNo('round negative digits')
    return pyRoundFloat(v, n)
  }),
  repr: pyBuiltin('repr', (a, kw) => pyRepr(pyArgs(a, kw, 1, 1)[0])),
  enumerate: pyBuiltin('enumerate', (a, kw) => {
    const [it, start] = pyArgs(a, kw, 1, 2, ['iterable', 'start'])
    let i = start === undefined ? 0n : isPyInt(start) ? pyBig(start) : pyThrow('TypeError')
    const src = pyGen(it)
    return new PyIter(
      (function* () {
        for (const one of src) yield new PyTuple([i++, one])
      })(),
    )
  }),
  zip: pyBuiltin('zip', a => {
    const gens = a.map(one => pyGen(one))
    return new PyIter(
      (function* () {
        if (gens.length === 0) return
        for (;;) {
          const row: unknown[] = []
          for (const g of gens) {
            const got = g.next()
            if (got.done) return
            row.push(got.value)
          }
          yield new PyTuple(row)
        }
      })(),
    )
  }),
  map: pyBuiltin('map', (a, kw, ctx) => {
    if (a.length < 2 || kw.size > 0) pyThrow('TypeError')
    const fn = a[0]
    const gens = a.slice(1).map(one => pyGen(one))
    return new PyIter(
      (function* () {
        for (;;) {
          const row: unknown[] = []
          for (const g of gens) {
            const got = g.next()
            if (got.done) return
            row.push(got.value)
          }
          yield pyCall(fn, row, new Map(), ctx)
        }
      })(),
    )
  }),
  filter: pyBuiltin('filter', (a, kw, ctx) => {
    if (a.length !== 2 || kw.size > 0) pyThrow('TypeError')
    const [fn, it] = a
    const src = pyGen(it)
    return new PyIter(
      (function* () {
        for (const one of src) if (pyTruthy(fn === null ? one : pyCall(fn, [one], new Map(), ctx))) yield one
      })(),
    )
  }),
  reversed: pyBuiltin('reversed', (a, kw, ctx) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (!(Array.isArray(v) || v instanceof PyTuple || typeof v === 'string' || v instanceof PyRange)) pyThrow('TypeError')
    return new PyIter(pyList(v, ctx).reverse()[Symbol.iterator]() as Generator<unknown>)
  }),
  any: pyBuiltin('any', (a, kw, ctx) => {
    const [v] = pyArgs(a, kw, 1, 1)
    for (const one of pyGen(v)) {
      calcStep(ctx)
      if (pyTruthy(one)) return true
    }
    return false
  }),
  all: pyBuiltin('all', (a, kw, ctx) => {
    const [v] = pyArgs(a, kw, 1, 1)
    for (const one of pyGen(v)) {
      calcStep(ctx)
      if (!pyTruthy(one)) return false
    }
    return true
  }),
  isinstance: pyBuiltin('isinstance', (a, kw) => {
    const [v, t] = pyArgs(a, kw, 2, 2)
    return pyIsInstance(v, t)
  }),
  divmod: pyBuiltin('divmod', (a, kw, ctx) => {
    const [x, y] = pyArgs(a, kw, 2, 2)
    if (!isPyNum(x) || !isPyNum(y)) pyThrow('TypeError')
    return new PyTuple([pyBinop('//', x, y, ctx), pyBinop('%', x, y, ctx)])
  }),
  pow: pyBuiltin('pow', (a, kw, ctx) => {
    const [x, y, m] = pyArgs(a, kw, 2, 3, ['base', 'exp', 'mod'])
    if (m !== undefined && m !== null) calcNo('pow mod')
    return pyBinop('**', x, y, ctx)
  }),
  ord: pyBuiltin('ord', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (typeof v !== 'string') pyThrow('TypeError')
    if (v.length !== 1) pyThrow('TypeError')
    return BigInt(v.charCodeAt(0))
  }),
  chr: pyBuiltin('chr', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (!isPyInt(v)) pyThrow('TypeError')
    const n = Number(pyBig(v))
    if (n < 0 || n > 0x10ffff) pyThrow('ValueError')
    if (n > 0xffff || (n >= 0xd800 && n <= 0xdfff)) calcNo('astral')
    return String.fromCharCode(n)
  }),
})

const PY_MATH = new PyMod('math', {
  pi: Math.PI,
  e: Math.E,
  floor: pyBuiltin('floor', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (isPyInt(v)) return pyBig(v)
    if (typeof v !== 'number') return pyThrow('TypeError')
    return pyCheckBig(BigInt(Math.floor(pyCheckFloat(v))))
  }),
  ceil: pyBuiltin('ceil', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (isPyInt(v)) return pyBig(v)
    if (typeof v !== 'number') return pyThrow('TypeError')
    return pyCheckBig(BigInt(Math.ceil(pyCheckFloat(v))))
  }),
  trunc: pyBuiltin('trunc', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (isPyInt(v)) return pyBig(v)
    if (typeof v !== 'number') return pyThrow('TypeError')
    return pyCheckBig(BigInt(Math.trunc(pyCheckFloat(v))))
  }),
  sqrt: pyBuiltin('sqrt', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (!isPyNum(v)) pyThrow('TypeError')
    const x = pyF(v)
    if (x < 0) pyThrow('ValueError')
    return Math.sqrt(x)
  }),
  fabs: pyBuiltin('fabs', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (!isPyNum(v)) pyThrow('TypeError')
    return Math.abs(pyF(v))
  }),
  isqrt: pyBuiltin('isqrt', (a, kw) => {
    const [v] = pyArgs(a, kw, 1, 1)
    if (!isPyInt(v)) pyThrow('TypeError')
    const n = pyBig(v)
    if (n < 0n) pyThrow('ValueError')
    if (n > BIG_SAFE) calcNo('isqrt')
    let r = BigInt(Math.floor(Math.sqrt(Number(n))))
    while (r * r > n) r -= 1n
    while ((r + 1n) * (r + 1n) <= n) r += 1n
    return r
  }),
  gcd: pyBuiltin('gcd', a => {
    let g = 0n
    for (const one of a) {
      if (!isPyInt(one)) pyThrow('TypeError')
      let x = pyBig(one)
      if (x < 0n) x = -x
      let y = g
      while (y) [x, y] = [y, x % y]
      g = x
    }
    return g
  }),
})
const PY_REAL_MATH = /^(?:acos|acosh|asin|asinh|atan|atan2|atanh|cbrt|comb|copysign|cos|cosh|degrees|dist|erf|erfc|exp|exp2|expm1|factorial|fmod|frexp|fsum|gamma|hypot|inf|isclose|isfinite|isinf|isnan|lcm|ldexp|lgamma|log|log10|log1p|log2|modf|nan|nextafter|perm|pow|prod|radians|remainder|sin|sinh|tan|tanh|tau|ulp)$/

// --- methods

const PY_METHODS: Record<string, string> = {
  str: 'upper lower strip lstrip rstrip split rsplit join replace startswith endswith find rfind index rindex count isdigit isalpha isalnum isspace isupper islower isnumeric isdecimal title capitalize zfill center ljust rjust partition rpartition removeprefix removesuffix swapcase',
  list: 'append extend insert pop remove index count sort reverse copy clear',
  dict: 'get keys values items setdefault update pop copy clear',
  set: 'add remove discard union intersection difference issubset issuperset copy clear',
  tuple: 'count index',
}
const PY_REAL: Record<string, string> = {
  str: 'casefold encode expandtabs format format_map isascii isidentifier isprintable istitle maketrans splitlines translate',
  list: '',
  dict: 'fromkeys popitem',
  set: 'isdisjoint pop symmetric_difference symmetric_difference_update update intersection_update difference_update',
  tuple: '',
  int: 'bit_length bit_count to_bytes from_bytes as_integer_ratio conjugate real imag numerator denominator',
  float: 'is_integer hex fromhex as_integer_ratio conjugate real imag',
}
function pyTypeOf(v: unknown): string | undefined {
  return typeof v === 'string' ? 'str' : Array.isArray(v) ? 'list' : v instanceof PyDict ? 'dict' : v instanceof PySet ? 'set' : v instanceof PyTuple ? 'tuple' : isPyInt(v) ? 'int' : typeof v === 'number' ? 'float' : undefined
}
function pyGetAttr(obj: unknown, name: string): unknown {
  if (obj instanceof PyMod) {
    if (Object.hasOwn(obj.members, name)) return obj.members[name]
    if (obj.name === 'math' && PY_REAL_MATH.test(name)) return calcNo(`math.${name}`)
    return pyThrow('AttributeError')
  }
  if (obj instanceof PyExc) return calcNo('exception attribute')
  const type = pyTypeOf(obj)
  if (type === undefined) return calcNo('attribute')
  if ((PY_METHODS[type] ?? '').split(' ').includes(name)) return new PyBound(obj, name)
  if ((PY_REAL[type] ?? '').split(' ').includes(name) || name.startsWith('__')) return calcNo(`${type}.${name}`)
  return pyThrow('AttributeError')
}
function pyStrArg(v: unknown): string {
  return typeof v === 'string' ? v : pyThrow('TypeError')
}
function pyStripSet(chars: unknown): string {
  return chars === undefined || chars === null ? PY_WS : pyStrArg(chars)
}
function pyStrip(s: string, chars: unknown, left: boolean, right: boolean): string {
  const set = pyStripSet(chars)
  if (chars === undefined || chars === null) {
    const ends = (left ? s.slice(0, 1) : '') + (right ? s.slice(-1) : '')
    if (/[^\x00-\x7f]/.test(ends) && /[\s\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/u.test(ends)) calcNo('unicode space')
  }
  let a = 0
  let b = s.length
  if (left) while (a < b && set.includes(s[a]!)) a++
  if (right) while (b > a && set.includes(s[b - 1]!)) b--
  return s.slice(a, b)
}
function pySplit(s: string, sep: unknown, maxsplit: unknown): string[] {
  const max = maxsplit === undefined || maxsplit === null ? -1 : isPyInt(maxsplit) ? Number(pyBig(maxsplit)) : pyThrow('TypeError')
  if (sep === undefined || sep === null) {
    if (/[^\x00-\x7f]/.test(s) && /[\s\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/u.test(s.replace(/[ -~\t\n\r\x0b\x0c]/g, ''))) calcNo('unicode space')
    const out: string[] = []
    let i = 0
    const isWs = (c: string) => PY_WS.includes(c)
    while (i < s.length) {
      while (i < s.length && isWs(s[i]!)) i++
      if (i >= s.length) break
      if (max >= 0 && out.length === max) {
        let rest = s.slice(i)
        let e = rest.length
        while (e > 0 && isWs(rest[e - 1]!)) e--
        rest = rest.slice(0, e)
        out.push(rest)
        return out
      }
      let j = i
      while (j < s.length && !isWs(s[j]!)) j++
      out.push(s.slice(i, j))
      i = j
    }
    return out
  }
  const d = pyStrArg(sep)
  if (d === '') pyThrow('ValueError')
  const parts = s.split(d)
  if (max < 0 || parts.length - 1 <= max) return parts
  return [...parts.slice(0, max), parts.slice(max).join(d)]
}
function pyFindRange(s: string, start: unknown, end: unknown): [number, number] {
  const n = s.length
  const norm = (v: unknown, dflt: number) => {
    if (v === undefined || v === null) return dflt
    if (!isPyInt(v)) pyThrow('TypeError')
    let k = Number(pyBig(v))
    if (k < 0) k = Math.max(0, k + n)
    return Math.min(k, n)
  }
  return [norm(start, 0), norm(end, n)]
}
function pyCount(s: string, sub: string, a: number, b: number): number {
  const part = s.slice(a, b)
  if (a > s.length) return 0
  if (sub === '') return part.length + 1
  return part.split(sub).length - 1
}
function pyMethod(self: unknown, name: string, args: unknown[], kw: Map<string, unknown>, ctx: CCtx): unknown {
  calcStep(ctx)
  if (typeof self === 'string') {
    const s = self
    const one = (min = 0, max = 1, names: string[] = []) => pyArgs(args, kw, min, max, names)
    switch (name) {
      case 'upper':
        one(0, 0)
        return pyAscii(s).toUpperCase()
      case 'lower':
        one(0, 0)
        return pyAscii(s).toLowerCase()
      case 'swapcase':
        one(0, 0)
        return [...pyAscii(s)].map(c => (c >= 'a' && c <= 'z' ? c.toUpperCase() : c >= 'A' && c <= 'Z' ? c.toLowerCase() : c)).join('')
      case 'strip':
      case 'lstrip':
      case 'rstrip': {
        const [chars] = one()
        return pyStrip(s, chars, name !== 'rstrip', name !== 'lstrip')
      }
      case 'split':
      case 'rsplit': {
        const [sep, max] = one(0, 2, ['sep', 'maxsplit'])
        if (name === 'rsplit' && max !== undefined && max !== null && !(isPyInt(max) && pyBig(max) < 0n)) calcNo('rsplit max')
        return pySplit(s, sep, max)
      }
      case 'join': {
        const [it] = one(1, 1)
        const items = pyList(it, ctx)
        if (!items.every(x => typeof x === 'string')) pyThrow('TypeError')
        return pyCheckSize(items.join(s))
      }
      case 'replace': {
        const [a, b, count] = one(2, 3)
        const old = pyStrArg(a)
        const neu = pyStrArg(b)
        const c = count === undefined ? -1 : isPyInt(count) ? Number(pyBig(count)) : pyThrow('TypeError')
        if (c < 0) return pyCheckSize(s.split(old).join(neu))
        if (old === '') calcNo('replace empty count')
        const parts = s.split(old)
        return pyCheckSize(parts.slice(0, c + 1).join(neu) + (parts.length > c + 1 ? old + parts.slice(c + 1).join(old) : ''))
      }
      case 'startswith':
      case 'endswith': {
        const [p, st, en] = one(1, 3)
        if (st !== undefined || en !== undefined) calcNo('startswith range')
        const list = p instanceof PyTuple ? p.items.map(pyStrArg) : [pyStrArg(p)]
        return list.some(x => (name === 'startswith' ? s.startsWith(x) : s.endsWith(x)))
      }
      case 'find':
      case 'rfind':
      case 'index':
      case 'rindex':
      case 'count': {
        const [subV, st, en] = one(1, 3)
        const sub = pyStrArg(subV)
        const [a, b] = pyFindRange(s, st, en)
        if (name === 'count') return BigInt(pyCount(s, sub, a, b))
        let at: number
        if (a > s.length || b - a < sub.length) at = -1
        else if (name === 'find' || name === 'index') {
          at = s.indexOf(sub, a)
          if (at !== -1 && at + sub.length > b) at = -1
        } else {
          at = s.lastIndexOf(sub, b - sub.length)
          if (at !== -1 && at < a) at = -1
        }
        if (at === -1 && (name === 'index' || name === 'rindex')) pyThrow('ValueError')
        return BigInt(at)
      }
      case 'isdigit':
      case 'isnumeric':
      case 'isdecimal':
        one(0, 0)
        return /^[0-9]+$/.test(pyAscii(s))
      case 'isalpha':
        one(0, 0)
        return /^[A-Za-z]+$/.test(pyAscii(s))
      case 'isalnum':
        one(0, 0)
        return /^[A-Za-z0-9]+$/.test(pyAscii(s))
      case 'isspace':
        one(0, 0)
        return s.length > 0 && [...pyAscii(s)].every(c => PY_WS.includes(c))
      case 'isupper':
        one(0, 0)
        return /[A-Z]/.test(pyAscii(s)) && !/[a-z]/.test(s)
      case 'islower':
        one(0, 0)
        return /[a-z]/.test(pyAscii(s)) && !/[A-Z]/.test(s)
      case 'title': {
        one(0, 0)
        let prev = false
        return [...pyAscii(s)]
          .map(c => {
            const isL = /[A-Za-z]/.test(c)
            const out = isL ? (prev ? c.toLowerCase() : c.toUpperCase()) : c
            prev = isL
            return out
          })
          .join('')
      }
      case 'capitalize':
        one(0, 0)
        pyAscii(s)
        return s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase()
      case 'zfill': {
        const [w] = one(1, 1)
        if (!isPyInt(w)) pyThrow('TypeError')
        const width = Number(pyBig(w))
        if (s.length >= width) return s
        const signed = s.startsWith('-') || s.startsWith('+')
        return signed ? s[0] + '0'.repeat(width - s.length) + s.slice(1) : '0'.repeat(width - s.length) + s
      }
      case 'center':
      case 'ljust':
      case 'rjust': {
        const [w, f] = one(1, 2)
        if (!isPyInt(w)) pyThrow('TypeError')
        const fill = f === undefined ? ' ' : pyStrArg(f)
        if (fill.length !== 1) pyThrow('TypeError')
        const width = Number(pyBig(w))
        if (width > CALC_SIZE_MAX) calcNo('size')
        const marg = width - s.length
        if (marg <= 0) return s
        if (name === 'ljust') return s + fill.repeat(marg)
        if (name === 'rjust') return fill.repeat(marg) + s
        const left = Math.floor(marg / 2) + (marg & width & 1)
        return fill.repeat(left) + s + fill.repeat(marg - left)
      }
      case 'partition':
      case 'rpartition': {
        const [sepV] = one(1, 1)
        const sep = pyStrArg(sepV)
        if (sep === '') pyThrow('ValueError')
        const at = name === 'partition' ? s.indexOf(sep) : s.lastIndexOf(sep)
        if (at === -1) return name === 'partition' ? new PyTuple([s, '', '']) : new PyTuple(['', '', s])
        return new PyTuple([s.slice(0, at), sep, s.slice(at + sep.length)])
      }
      case 'removeprefix':
      case 'removesuffix': {
        const [x] = one(1, 1)
        const p = pyStrArg(x)
        if (p === '') return s
        if (name === 'removeprefix') return s.startsWith(p) ? s.slice(p.length) : s
        return s.endsWith(p) ? s.slice(0, s.length - p.length) : s
      }
    }
  }
  if (Array.isArray(self)) {
    const list = self
    const one = (min = 0, max = 1, names: string[] = []) => pyArgs(args, kw, min, max, names)
    switch (name) {
      case 'append':
        list.push(one(1, 1)[0])
        pyCheckSize(list)
        return null
      case 'extend': {
        const items = pyList(one(1, 1)[0], ctx)
        list.push(...items)
        pyCheckSize(list)
        return null
      }
      case 'insert': {
        const [i, x] = one(2, 2)
        if (!isPyInt(i)) pyThrow('TypeError')
        let k = Number(pyBig(i))
        if (k < 0) k = Math.max(0, k + list.length)
        list.splice(Math.min(k, list.length), 0, x)
        return null
      }
      case 'pop': {
        const [i] = one(0, 1)
        if (list.length === 0) pyThrow('IndexError')
        const k = i === undefined ? list.length - 1 : pyIndex(i, list.length)
        return list.splice(k, 1)[0]
      }
      case 'remove': {
        const [x] = one(1, 1)
        const k = list.findIndex(y => pyEq(y, x))
        if (k === -1) pyThrow('ValueError')
        list.splice(k, 1)
        return null
      }
      case 'index': {
        const [x] = one(1, 1)
        const k = list.findIndex(y => pyEq(y, x))
        if (k === -1) pyThrow('ValueError')
        return BigInt(k)
      }
      case 'count': {
        const [x] = one(1, 1)
        return BigInt(list.filter(y => pyEq(y, x)).length)
      }
      case 'sort': {
        if (args.length > 0) pyThrow('TypeError')
        for (const k of kw.keys()) if (k !== 'key' && k !== 'reverse') pyThrow('TypeError')
        const sorted = pySortList([...list], kw.get('key'), kw.get('reverse'), ctx)
        list.splice(0, list.length, ...sorted)
        return null
      }
      case 'reverse':
        one(0, 0)
        list.reverse()
        return null
      case 'copy':
        one(0, 0)
        return [...list]
      case 'clear':
        one(0, 0)
        list.length = 0
        return null
    }
  }
  if (self instanceof PyDict) {
    const d = self
    const one = (min = 0, max = 1) => pyArgs(args, kw, min, max)
    switch (name) {
      case 'get': {
        const [k, dflt] = one(1, 2)
        const got = d.m.get(pyKey(k))
        return got ? got[1] : dflt === undefined ? null : dflt
      }
      case 'keys':
      case 'values':
      case 'items':
        one(0, 0)
        return new PyView(name, d)
      case 'setdefault': {
        const [k, dflt] = one(1, 2)
        const key = pyKey(k)
        if (!d.m.has(key)) d.m.set(key, [k, dflt === undefined ? null : dflt])
        return d.m.get(key)![1]
      }
      case 'update': {
        if (args.length > 1) pyThrow('TypeError')
        if (args.length === 1) {
          const src = args[0] instanceof PyDict ? [...args[0].m.values()] : pyList(args[0], ctx).map(one => pyList(one, ctx))
          for (const pair of src) {
            if (pair.length !== 2) pyThrow('ValueError')
            d.m.set(pyKey(pair[0]), [d.m.get(pyKey(pair[0]))?.[0] ?? pair[0], pair[1]])
          }
        }
        for (const [k, v] of kw) d.m.set(pyKey(k), [k, v])
        return null
      }
      case 'pop': {
        const [k, dflt] = one(1, 2)
        const key = pyKey(k)
        const got = d.m.get(key)
        if (!got) return args.length > 1 ? dflt : pyThrow('KeyError')
        d.m.delete(key)
        return got[1]
      }
      case 'copy': {
        one(0, 0)
        const c = new PyDict()
        for (const [k, v] of d.m) c.m.set(k, [...v] as [unknown, unknown])
        return c
      }
      case 'clear':
        one(0, 0)
        d.m.clear()
        return null
    }
  }
  if (self instanceof PySet) {
    const s = self
    const one = (min = 0, max = 1) => pyArgs(args, kw, min, max)
    switch (name) {
      case 'add': {
        const [x] = one(1, 1)
        const k = pyKey(x)
        if (!s.m.has(k)) s.m.set(k, x)
        return null
      }
      case 'remove':
      case 'discard': {
        const [x] = one(1, 1)
        const k = pyKey(x)
        if (!s.m.has(k) && name === 'remove') pyThrow('KeyError')
        s.m.delete(k)
        return null
      }
      case 'union':
      case 'intersection':
      case 'difference':
      case 'issubset':
      case 'issuperset': {
        const [x] = one(1, 1)
        const other = pyMakeSet(x instanceof PySet ? [...x.m.values()] : pyList(x, ctx))
        if (name === 'issubset') return [...s.m.keys()].every(k => other.m.has(k))
        if (name === 'issuperset') return [...other.m.keys()].every(k => s.m.has(k))
        const out = new PySet()
        if (name === 'union') {
          for (const [k, v] of s.m) out.m.set(k, v)
          for (const [k, v] of other.m) if (!out.m.has(k)) out.m.set(k, v)
        } else for (const [k, v] of s.m) if (other.m.has(k) === (name === 'intersection')) out.m.set(k, v)
        return out
      }
      case 'copy':
        one(0, 0)
        return pyMakeSet(s.m.values())
      case 'clear':
        one(0, 0)
        s.m.clear()
        return null
    }
  }
  if (self instanceof PyTuple) {
    const [x] = pyArgs(args, kw, 1, 1)
    if (name === 'count') return BigInt(self.items.filter(y => pyEq(y, x)).length)
    if (name === 'index') {
      const k = self.items.findIndex(y => pyEq(y, x))
      if (k === -1) pyThrow('ValueError')
      return BigInt(k)
    }
  }
  return calcNo(`method ${name}`)
}

// --- calls, statements, expressions

function pyCall(f: unknown, args: unknown[], kw: Map<string, unknown>, ctx: CCtx): unknown {
  calcStep(ctx)
  if (f instanceof CalcFn) return pyInvoke(f, args, kw, ctx)
  if (f instanceof PyBuiltin) return f.fn(args, kw, ctx)
  if (f instanceof PyBound) return pyMethod(f.self, f.name, args, kw, ctx)
  if (f instanceof PyType) return pyConstruct(f.name, args, kw, ctx)
  if (f === MISSING) return calcNo('missing callee')
  return pyThrow('TypeError')
}

function pyInvoke(fn: CalcFn, args: unknown[], kw: Map<string, unknown>, ctx: CCtx): unknown {
  if (ctx.depth >= CALC_DEPTH_MAX) calcNo('depth')
  const node = fn.node
  const params: { name: string }[] = node.params
  if (args.length > params.length) pyThrow('TypeError')
  const env = new CEnv(fn.env)
  for (const name of (node.locals as string[] | undefined) ?? []) env.def(name, UNBOUND)
  const bound: unknown[] = params.map((_, i) => (i < args.length ? args[i] : UNBOUND))
  for (const [k, v] of kw) {
    const at = params.findIndex(p => p.name === k)
    if (at === -1 || bound[at] !== UNBOUND) pyThrow('TypeError')
    bound[at] = v
  }
  params.forEach((p, i) => {
    if (bound[i] === UNBOUND) {
      const d = fn.defaults[i]
      if (d === UNBOUND || d === undefined) pyThrow('TypeError')
      bound[i] = d
    }
    env.def(p.name, bound[i])
  })
  ctx.depth++
  try {
    if (node.k === 'lambda') return pyEval(node.body, env, ctx)
    try {
      pyExecList(node.body, env, ctx)
    } catch (x) {
      if (x instanceof CRet) return x.v
      throw x
    }
    return null
  } finally {
    ctx.depth--
  }
}

function pyLookup(name: string, env: CEnv): unknown {
  const got = env.find(name)
  if (got) {
    if (got.v === UNBOUND) pyThrow('UnboundLocalError')
    if (got.v === MISSING) calcNo(`missing ${name}`)
    return got.v
  }
  if (Object.hasOwn(PY_BUILTINS, name)) return PY_BUILTINS[name]
  if (['print', 'input', 'open', 'type', 'id', 'hash', 'iter', 'next', 'getattr', 'setattr', 'hasattr', 'vars', 'globals', 'locals', 'eval', 'exec', 'format', 'bin', 'hex', 'oct', 'callable', 'frozenset', 'bytes', 'bytearray', 'complex', 'object', 'super', 'property', 'staticmethod', 'classmethod', 'slice', 'memoryview', 'ascii', 'compile', 'dir', 'help', 'issubclass', 'max', 'min', 'exit', 'quit'].includes(name)) calcNo(`builtin ${name}`)
  return calcNo(`name ${name}`)
}
function pyAssignName(name: string, v: unknown, env: CEnv): void {
  for (let e: CEnv | undefined = env; e; e = e.up) {
    const got = e.vars.get(name)
    if (got) {
      got.v = v
      return
    }
  }
  env.def(name, v)
}
function pyAssign(target: CNode, v: unknown, env: CEnv, ctx: CCtx): void {
  if (target.k === 'name') {
    pyAssignName(target.name, v, env)
    return
  }
  if (target.k === 'index') {
    const obj = pyEval(target.obj, env, ctx)
    pySetItem(obj, pyIndexOf(target.index, env, ctx), v)
    return
  }
  if (target.k === 'tuple' || target.k === 'list') {
    if (v instanceof PySet && v.m.size > 1) calcNo('set order')
    const items = pyList(v, ctx)
    const star = target.items.findIndex((one: CNode) => one.k === 'star')
    if (star === -1) {
      if (items.length !== target.items.length) pyThrow('ValueError')
      target.items.forEach((one: CNode, i: number) => pyAssign(one, items[i], env, ctx))
      return
    }
    const after = target.items.length - star - 1
    if (items.length < target.items.length - 1) pyThrow('ValueError')
    target.items.forEach((one: CNode, i: number) => {
      if (i < star) pyAssign(one, items[i], env, ctx)
      else if (i === star) pyAssign(one.arg, items.slice(star, items.length - after), env, ctx)
      else pyAssign(one, items[items.length - (target.items.length - i)], env, ctx)
    })
    return
  }
  calcNo('assign target')
}
function pyIndexOf(node: CNode, env: CEnv, ctx: CCtx): unknown {
  if (node.k === 'slice') return new PySlice(node.lower ? pyEval(node.lower, env, ctx) : null, node.upper ? pyEval(node.upper, env, ctx) : null, node.step ? pyEval(node.step, env, ctx) : null)
  return pyEval(node, env, ctx)
}

function pyExecList(list: readonly CNode[], env: CEnv, ctx: CCtx): void {
  for (const st of list) pyExec(st, env, ctx)
}
function pyLoopBody(body: readonly CNode[], env: CEnv, ctx: CCtx): 'break' | undefined {
  try {
    pyExecList(body, env, ctx)
  } catch (x) {
    if (x === CBRK) return 'break'
    if (x === CCONT) return undefined
    throw x
  }
  return undefined
}
function pyExec(st: CNode, env: CEnv, ctx: CCtx): void {
  calcStep(ctx)
  try {
    pyExecOne(st, env, ctx)
  } catch (x) {
    if (x instanceof CalcThrow && ctx.isTraced && !ctx.trace.err) ctx.trace.err = { s: st.s, e: st.e }
    throw x
  }
}
function pyDefaults(params: { def?: CNode }[], env: CEnv, ctx: CCtx): unknown[] {
  return params.map(p => (p.def ? pyEval(p.def, env, ctx) : UNBOUND))
}
function pyExecOne(st: CNode, env: CEnv, ctx: CCtx): void {
  switch (st.k) {
    case 'pass':
      return
    case 'expr':
      pyEval(st.expr, env, ctx)
      return
    case 'assign': {
      const v = pyEval(st.value, env, ctx)
      for (const t of st.targets) pyAssign(t, v, env, ctx)
      return
    }
    case 'aug': {
      const rhs = pyEval(st.value, env, ctx)
      const t = st.target
      const op = (cur: unknown) => (st.op === '+' && Array.isArray(cur) ? (cur.push(...pyList(rhs, ctx)), pyCheckSize(cur)) : pyBinop(st.op, cur, rhs, ctx))
      if (t.k === 'name') {
        pyAssignName(t.name, op(pyLookup(t.name, env)), env)
        return
      }
      const obj = pyEval(t.obj, env, ctx)
      const key = pyIndexOf(t.index, env, ctx)
      pySetItem(obj, key, op(pyGetItem(obj, key)))
      return
    }
    case 'if': {
      for (const b of st.branches) {
        const v = pyTruthy(pyEval(b.test, env, ctx))
        calcCond(ctx, b.test, v)
        if (v) {
          pyExecList(b.body, env, ctx)
          return
        }
      }
      if (st.other) pyExecList(st.other, env, ctx)
      return
    }
    case 'while':
      for (;;) {
        calcStep(ctx)
        const v = pyTruthy(pyEval(st.test, env, ctx))
        calcCond(ctx, st.test, v)
        if (!v) return
        calcLoop(ctx, st)
        if (pyLoopBody(st.body, env, ctx) === 'break') return
      }
    case 'for': {
      const it = pyEval(st.iter, env, ctx)
      for (const one of pyGen(it)) {
        calcStep(ctx)
        pyAssign(st.target, one, env, ctx)
        calcLoop(ctx, st)
        if (pyLoopBody(st.body, env, ctx) === 'break') return
      }
      return
    }
    case 'break':
      throw CBRK
    case 'continue':
      throw CCONT
    case 'return':
      calcNoteReturn(ctx, st, st.arg, env)
      throw new CRet(st.arg ? pyEval(st.arg, env, ctx) : null)
    case 'raise': {
      if (!st.arg) return calcNo('bare raise')
      const v = pyEval(st.arg, env, ctx)
      if (v instanceof PyType && (Object.hasOwn(PY_EXC_PARENT, v.name) || v.name === 'BaseException')) throw new CalcThrow(v.name, new PyExc(v.name, []))
      if (v instanceof PyExc) throw new CalcThrow(v.name, v)
      return pyThrow('TypeError')
    }
    case 'assert':
      if (!pyTruthy(pyEval(st.test, env, ctx))) pyThrow('AssertionError')
      return
    case 'try': {
      let isRaised = false
      try {
        try {
          pyExecList(st.body, env, ctx)
        } catch (x) {
          if (!(x instanceof CalcThrow)) throw x
          isRaised = true
          let isHandled = false
          for (const h of st.handlers) {
            if (h.type && !pyExcMatches(x.name, pyEval(h.type, env, ctx))) continue
            ctx.trace.err = undefined
            if (h.name) pyAssignName(h.name, x.value instanceof PyExc ? x.value : new PyExc(x.name, undefined), env)
            pyExecList(h.body, env, ctx)
            isHandled = true
            break
          }
          if (!isHandled) throw x
        }
        if (!isRaised && st.other) pyExecList(st.other, env, ctx)
      } finally {
        if (st.finalizer) pyExecList(st.finalizer, env, ctx)
      }
      return
    }
    case 'def':
      pyAssignName(st.name, new CalcFn('py', st, env, pyDefaults(st.params, env, ctx)), env)
      return
  }
  calcNo(`statement ${st.k}`)
}

function pyItems(items: CNode[], env: CEnv, ctx: CCtx): unknown[] {
  const out: unknown[] = []
  for (const one of items) {
    if (one.k === 'star') {
      const v = pyEval(one.arg, env, ctx)
      if (v instanceof PySet && v.m.size > 1) calcNo('set order')
      out.push(...pyList(v, ctx))
    } else out.push(pyEval(one, env, ctx))
    if (out.length > CALC_SIZE_MAX) calcNo('size')
  }
  return out
}
function* pyComp(node: CNode, env: CEnv, ctx: CCtx): Generator<CEnv> {
  const scope = new CEnv(env)
  const names = new Set<string>()
  const collect = (t: CNode) => {
    if (t.k === 'name') names.add(t.name)
    else if (t.k === 'tuple' || t.k === 'list') t.items.forEach((one: CNode) => collect(one.k === 'star' ? one.arg : one))
  }
  for (const c of node.clauses) if (c.target) collect(c.target)
  for (const name of names) scope.def(name, UNBOUND)
  const first = pyEval(node.clauses[0].iter, env, ctx)
  function* walk(i: number): Generator<CEnv> {
    if (i === node.clauses.length) {
      yield scope
      return
    }
    const c = node.clauses[i]
    if (c.iter) {
      const it = i === 0 ? first : pyEval(c.iter, scope, ctx)
      for (const one of pyGen(it)) {
        calcStep(ctx)
        pyAssign(c.target, one, scope, ctx)
        yield* walk(i + 1)
      }
    } else if (pyTruthy(pyEval(c.test, scope, ctx))) yield* walk(i + 1)
  }
  yield* walk(0)
}

function pyEval(node: CNode, env: CEnv, ctx: CCtx): unknown {
  switch (node.k) {
    case 'lit':
      return node.value
    case 'fstr':
      return pyCheckSize(node.parts.map((p: { lit?: string; expr?: CNode; conv?: string; spec?: string }) => (p.lit !== undefined ? p.lit : pyFormat(pyEval(p.expr!, env, ctx), p.conv, p.spec))).join(''))
    case 'name':
      return pyLookup(node.name, env)
    case 'tuple':
      return new PyTuple(pyItems(node.items, env, ctx))
    case 'list':
      return pyItems(node.items, env, ctx)
    case 'set':
      return pyMakeSet(pyItems(node.items, env, ctx))
    case 'dict': {
      const d = new PyDict()
      node.keys.forEach((k: CNode, i: number) => {
        const key = pyEval(k, env, ctx)
        const v = pyEval(node.values[i], env, ctx)
        const hk = pyKey(key)
        d.m.set(hk, [d.m.get(hk)?.[0] ?? key, v])
      })
      return d
    }
    case 'listcomp':
    case 'setcomp':
    case 'genexp': {
      const gen = pyComp(node, env, ctx)
      if (node.k === 'genexp') {
        return new PyIter(
          (function* () {
            for (const scope of gen) yield pyEval(node.elt, scope, ctx)
          })(),
        )
      }
      const out: unknown[] = []
      for (const scope of gen) {
        out.push(pyEval(node.elt, scope, ctx))
        if (out.length > CALC_SIZE_MAX) calcNo('size')
      }
      return node.k === 'setcomp' ? pyMakeSet(out) : out
    }
    case 'dictcomp': {
      const d = new PyDict()
      for (const scope of pyComp(node, env, ctx)) {
        const k = pyEval(node.elt, scope, ctx)
        const v = pyEval(node.value, scope, ctx)
        d.m.set(pyKey(k), [d.m.get(pyKey(k))?.[0] ?? k, v])
      }
      return d
    }
    case 'lambda':
      return new CalcFn('py', node, env, pyDefaults(node.params, env, ctx))
    case 'unary': {
      const v = pyEval(node.arg, env, ctx)
      if (node.op === 'not') return !pyTruthy(v)
      if (node.op === '-') {
        if (isPyInt(v)) return -pyBig(v)
        if (typeof v === 'number') return -v
        return pyThrow('TypeError')
      }
      if (node.op === '+') return isPyInt(v) ? pyBig(v) : typeof v === 'number' ? v : pyThrow('TypeError')
      return isPyInt(v) ? ~pyBig(v) : pyThrow('TypeError')
    }
    case 'bin':
      return pyBinop(node.op, pyEval(node.left, env, ctx), pyEval(node.right, env, ctx), ctx)
    case 'logic': {
      const l = pyEval(node.left, env, ctx)
      if (node.op === 'and') return pyTruthy(l) ? pyEval(node.right, env, ctx) : l
      return pyTruthy(l) ? l : pyEval(node.right, env, ctx)
    }
    case 'cmp': {
      let left = pyEval(node.first, env, ctx)
      for (let i = 0; i < node.ops.length; i++) {
        const right = pyEval(node.rest[i], env, ctx)
        if (!pyCompare(node.ops[i], left, right)) return false
        left = right
      }
      return true
    }
    case 'cond': {
      const t = pyTruthy(pyEval(node.test, env, ctx))
      calcCond(ctx, node.test, t)
      return t ? pyEval(node.then, env, ctx) : pyEval(node.other, env, ctx)
    }
    case 'call': {
      const f = node.callee.k === 'attr' ? pyGetAttr(pyEval(node.callee.obj, env, ctx), node.callee.name) : pyEval(node.callee, env, ctx)
      const args: unknown[] = []
      for (const a of node.args) args.push(pyEval(a, env, ctx))
      const kw = new Map<string, unknown>()
      for (const k of node.kwargs) {
        if (kw.has(k.name)) pyThrow('TypeError')
        kw.set(k.name, pyEval(k.value, env, ctx))
      }
      return pyCall(f, args, kw, ctx)
    }
    case 'attr':
      return pyGetAttr(pyEval(node.obj, env, ctx), node.name)
    case 'index':
      return pyGetItem(pyEval(node.obj, env, ctx), pyIndexOf(node.index, env, ctx))
  }
  return calcNo(`expression ${node.k}`)
}
// ------------------------------------------------------------------ calc's face: modules, runs, literals, equality

/** One file's shown code made ready to run: its functions and the top-level names it binds, read from its pieces. */
export type CalcModule = { lang: CalcLang; src: string; env: CEnv; fns: Set<string> }

function calcCtx(lang: CalcLang, src: string, max: number, isTraced: boolean): CCtx {
  return { lang, src, steps: 0, max, depth: 0, isTraced, trace: { conds: [], loops: [] }, loops: new Map(), until: Date.now() + CALC_RUN_MS }
}

/**
 * A file's shown lines (each hunk's after-side, the hunks apart) cut into top-level pieces: a piece starts on a line
 * at column 0 once every bracket before it closed (py: and the line before does not go on with a backslash).
 */
function calcPieces(hunks: readonly string[][], lang: CalcLang): { src: string; pieces: [number, number][] } {
  let src = ''
  const pieces: [number, number][] = []
  for (const lines of hunks) {
    let depth = 0
    let from = -1
    let isGoingOn = false
    for (const line of lines) {
      const at = src.length
      const isTop = line !== '' && !/^\s/.test(line) && depth <= 0 && !isGoingOn && !(lang === 'js' && /^[)\]}.]/.test(line))
      if (isTop) {
        if (from !== -1) pieces.push([from, at])
        from = at
        depth = 0
      }
      src += line + '\n'
      const code = lang === 'py' ? line.replace(/#.*$|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '""') : line.replace(/\/\/.*$|`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '""')
      for (const c of code) {
        if ('([{'.includes(c)) depth++
        else if (')]}'.includes(c)) depth--
      }
      isGoingOn = lang === 'py' && /\\$/.test(line)
    }
    if (from !== -1) pieces.push([from, src.length])
    src += '\n'
  }
  return { src, pieces }
}

/** A python import calc knows: `math` (its exact members) and nothing else. */
function pyModuleOf(name: string): unknown {
  return name === 'math' ? PY_MATH : MISSING
}

/**
 * The module calc runs one file's calls in: every piece parsed alone (one that does not parse is left out, so a name
 * only it binds is unknown), js functions hoisted, then in order the top-level bindings (js const/let/var, py
 * assignments, py defs with their defaults, `import math`); nothing else at the top level runs.
 */
export function calcModule(hunks: readonly string[][], lang: CalcLang): CalcModule {
  const { src, pieces } = calcPieces(hunks, lang)
  const env = new CEnv()
  const fns = new Set<string>()
  const parsed: CNode[] = []
  for (const [a, b] of pieces) {
    try {
      const list = lang === 'py' ? new PyParser(src, pyTokens(src, a, b)).program() : new JsParser(src, jsTokens(src, a, b)).program()
      parsed.push(...list)
    } catch (x) {
      if (!(x instanceof CalcUnknown)) throw x
      // A piece calc cannot read: the names it would bind become unknown.
      const name = (lang === 'py' ? /^(?:def\s+|class\s+)?([A-Za-z_]\w*)/ : /^(?:export\s+)?(?:(?:async\s+)?function\s*\*?\s*|const\s+|let\s+|var\s+|class\s+)([A-Za-z_$][\w$]*)/).exec(src.slice(a, b))?.[1]
      if (name) env.def(name, MISSING)
    }
  }
  if (lang === 'js') {
    for (const st of parsed) if (st.k === 'fdecl') {
      env.def(st.name, new CalcFn('js', st.fn, env))
      fns.add(st.name)
    }
    for (const st of parsed) {
      if (st.k !== 'var') continue
      for (const d of st.decls) {
        const names = new Set<string>()
        calcNamesIn(d.target, names)
        try {
          const ctx = calcCtx('js', src, CALC_STEP_MAX, false)
          const v = d.init ? jsEval(d.init, env, ctx) : undefined
          jsBind(d.target, v, env, st.kind, ctx)
          if (v instanceof CalcFn && d.target.k === 'name') fns.add(d.target.name)
        } catch (x) {
          if (!(x instanceof CalcUnknown || x instanceof CalcThrow)) throw x
          for (const name of names) env.def(name, MISSING)
        }
      }
    }
  } else {
    for (const st of parsed) {
      try {
        const ctx = calcCtx('py', src, CALC_STEP_MAX, false)
        if (st.k === 'def') {
          env.def(st.name, new CalcFn('py', st, env, pyDefaults(st.params, env, ctx)))
          fns.add(st.name)
        } else if (st.k === 'assign') {
          const v = pyEval(st.value, env, ctx)
          for (const t of st.targets) pyAssign(t, v, env, ctx)
        } else if (st.k === 'import') for (const name of st.names) env.def(name, pyModuleOf(name))
        else if (st.k === 'from') {
          const mod = pyModuleOf(st.mod)
          for (const name of st.names) env.def(name, mod instanceof PyMod && Object.hasOwn(mod.members, name) ? mod.members[name] : MISSING)
        }
      } catch (x) {
        if (!(x instanceof CalcUnknown || x instanceof CalcThrow)) throw x
        const names = new Set<string>()
        if (st.k === 'def') names.add(st.name)
        if (st.k === 'assign') st.targets.forEach((t: CNode) => calcNamesIn(t, names))
        for (const name of names) env.def(name, MISSING)
      }
    }
  }
  return { lang, src, env, fns }
}

function calcParseExpr(text: string, lang: CalcLang): CNode {
  if (ASTRAL.test(text)) calcNo('astral')
  if (lang === 'py') {
    const p = new PyParser(text, pyTokens(text, 0, text.length).filter(t => t.t !== 'nl' && t.t !== 'in' && t.t !== 'de'))
    const e = p.testList()
    if (p.p.t !== 'eof') calcNo('trailing')
    return e
  }
  const p = new JsParser(text, jsTokens(text, 0, text.length))
  const e = p.expression()
  if (p.p.t !== 'eof') calcNo('trailing')
  return e
}

function calcSettle(lang: CalcLang, ctx: CCtx, run: () => unknown): CalcResult {
  const done = () => {
    ctx.trace.loops = [...ctx.loops.values()]
    ctx.trace.steps = ctx.steps
    return ctx.trace
  }
  try {
    const value = run()
    if (calcSizeOver(value, CALC_SHOW_MAX)) calcNo('size')
    const show = lang === 'py' ? pyRepr(value) : jsShow(value)
    return { kind: 'value', value, show, trace: done() }
  } catch (x) {
    if (x instanceof CalcThrow) return { kind: 'error', name: x.name, trace: done() }
    if (x instanceof CalcUnknown) return { kind: 'unknown', why: x.why }
    if (x instanceof CRet || x === CBRK || x === CCONT || x === OPT_SHORT) return { kind: 'unknown', why: 'control' }
    if (x instanceof RangeError) return { kind: 'unknown', why: 'host range' }
    throw x
  }
}

/** The run of one call written in a module's language (`f(3, "a")`), within `max` steps; its trace on the module's source. */
export function calcCall(mod: CalcModule, call: string, max = CALC_STEP_MAX): CalcResult {
  let node: CNode
  try {
    node = calcParseExpr(call, mod.lang)
  } catch (x) {
    if (x instanceof CalcUnknown) return { kind: 'unknown', why: x.why }
    throw x
  }
  if (node.k !== 'call' || node.callee.k !== 'name' || !mod.fns.has(node.callee.name)) return { kind: 'unknown', why: 'not a call of a function' }
  const ctx = calcCtx(mod.lang, mod.src, max, true)
  return calcSettle(mod.lang, ctx, () => {
    const fn = mod.env.find(node.callee.name)?.v
    if (!(fn instanceof CalcFn)) calcNo('callee')
    const argEnv = new CEnv()
    if (mod.lang === 'py') {
      const args = node.args.map((a: CNode) => pyEval(a, argEnv, ctx))
      const kw = new Map<string, unknown>(node.kwargs.map((k: { name: string; value: CNode }) => [k.name, pyEval(k.value, argEnv, ctx)]))
      return pyInvoke(fn, args, kw, ctx)
    }
    return jsInvoke(fn, jsSpread(node.args, argEnv, ctx), ctx)
  })
}

/** The value of an expression in a module, its free names bound first (`bind`, the asked call's parameters); no trace. */
export function calcExpr(mod: CalcModule, text: string, bind: ReadonlyMap<string, unknown> = new Map()): CalcResult {
  let node: CNode
  try {
    node = calcParseExpr(text, mod.lang)
  } catch (x) {
    if (x instanceof CalcUnknown) return { kind: 'unknown', why: x.why }
    throw x
  }
  const ctx = calcCtx(mod.lang, text, CALC_STEP_MAX, false)
  const env = new CEnv(mod.env)
  for (const [k, v] of bind) env.def(k, v)
  return calcSettle(mod.lang, ctx, () => (mod.lang === 'py' ? pyEval(node, env, ctx) : jsEval(node, env, ctx)))
}

/** The parameters a call binds, by name (positional then named), for 식 evaluated against the asked call. */
export function calcBindings(mod: CalcModule, call: string): Map<string, unknown> {
  const out = new Map<string, unknown>()
  try {
    const node = calcParseExpr(call, mod.lang)
    const fn = node.k === 'call' && node.callee.k === 'name' ? mod.env.find(node.callee.name)?.v : undefined
    if (!(fn instanceof CalcFn)) return out
    const ctx = calcCtx(mod.lang, call, 1000, false)
    const params: CNode[] | { name: string }[] = fn.node.params
    const names = params.map((p: CNode | { name: string }) => ('k' in p ? (p.k === 'name' ? p.name : p.k === 'pdef' && p.target.k === 'name' ? p.target.name : undefined) : p.name))
    node.args.forEach((a: CNode, i: number) => {
      const name = names[i]
      if (name) out.set(name, mod.lang === 'py' ? pyEval(a, new CEnv(), ctx) : jsEval(a, new CEnv(), ctx))
    })
    for (const k of node.kwargs ?? []) out.set(k.name, pyEval(k.value, new CEnv(), ctx))
  } catch (x) {
    if (!(x instanceof CalcUnknown || x instanceof CalcThrow)) throw x
  }
  return out
}

/** Whether a node is a literal alone: numbers (signed), strings, literal words, lists, tuples, objects/dicts of them. */
function isLiteralNode(node: CNode): boolean {
  switch (node.k) {
    case 'lit':
      return true
    case 'unary':
      return (node.op === '-' || node.op === '+') && node.arg.k === 'lit' && (typeof node.arg.value === 'number' || typeof node.arg.value === 'bigint')
    case 'arr':
      return node.items.every((one: CNode | null) => one !== null && isLiteralNode(one))
    case 'list':
    case 'tuple':
    case 'set':
      return node.items.every(isLiteralNode)
    case 'obj':
      return node.props.every((p: { key: unknown; value: CNode; kind: string }) => p.kind === 'init' && typeof p.key === 'string' && isLiteralNode(p.value))
    case 'dict':
      return node.keys.every(isLiteralNode) && node.values.every(isLiteralNode)
  }
  return false
}

/** A literal written in a language (`[1, 2]`, `'a'`, `(1, 2)`, `None`), as calc's value, or undefined. */
export function calcLiteral(text: string, lang: CalcLang): { value: unknown } | undefined {
  try {
    const node = calcParseExpr(text.trim(), lang)
    if (!isLiteralNode(node)) return undefined
    const ctx = calcCtx(lang, text, 1000, false)
    return { value: lang === 'py' ? pyEval(node, new CEnv(), ctx) : jsEval(node, new CEnv(), ctx) }
  } catch (x) {
    if (x instanceof CalcUnknown || x instanceof CalcThrow) return undefined
    throw x
  }
}

/** A value as the runner shows it (js JSON.stringify, py repr), or undefined when calc cannot be sure. */
export function calcShow(value: unknown, lang: CalcLang): string | undefined {
  return calcShowSafe(value, lang)
}

/**
 * Whether two values are one result (stance [같음], S13, S18): numbers by value (7 is not "7"), strings exactly,
 * booleans with booleans, null with null (py None), undefined only with undefined, lists with lists and tuples with
 * tuples item by item (a tuple is not a list), objects and dicts as maps (key order aside). A py int (bigint) is never
 * a py float (number), even of the same value (S18: `600` is not `600.0`, `4.0` is not `4`); js has one number kind.
 */
export function calcEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'bigint' || typeof b === 'bigint') return typeof a === typeof b && a === b
  if (typeof a === 'number' && typeof b === 'number') return a === b
  if (typeof a === 'boolean' || typeof b === 'boolean' || typeof a === 'string' || typeof b === 'string') return a === b
  if (a === null || b === null || a === undefined || b === undefined) return a === b
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((one, i) => calcEqual(one, b[i]))
  if (a instanceof PyTuple && b instanceof PyTuple) return a.items.length === b.items.length && a.items.every((one, i) => calcEqual(one, b.items[i]))
  if (a instanceof PyDict && b instanceof PyDict) return a.m.size === b.m.size && [...a.m].every(([k, [, x]]) => b.m.has(k) && calcEqual(x, b.m.get(k)![1]))
  if (a instanceof PySet && b instanceof PySet) return a.m.size === b.m.size && [...a.m.keys()].every(k => b.m.has(k))
  if (jsIsPlain(a) && jsIsPlain(b)) {
    const ka = Object.keys(a)
    return ka.length === Object.keys(b).length && ka.every(k => Object.hasOwn(b, k) && calcEqual(a[k], b[k]))
  }
  if (jsIsPlain(a) && b instanceof PyDict) return calcEqual(b, a)
  if (a instanceof PyDict && jsIsPlain(b)) {
    const keys = Object.keys(b)
    return a.m.size === keys.length && keys.every(k => a.m.has(`s:${k}`) && calcEqual(a.m.get(`s:${k}`)![1], b[k]))
  }
  return false
}
