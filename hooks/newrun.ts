// The device-run evaluator of 비슷한 코드's run route (1.13.0 G2, the plan's module layout): a module of its own, so that
// hooks/notes.ts stays under the engine's 1,048,576-byte module limit and this engine's top-level names never meet
// another's. hooks/notes.ts imports newRun by name (no `export *`); tests import its internals from here. Pure: no `$`,
// no Node, no network, no clock, no randomness. This whole file is G2's evaluator block (its sha256 is the one B14 keeps):
// any edit to it is a new design, and the run route's pre-call differential gate runs again.

// ═══════════════════ 1.13.0 G2 (G2-RUN): the evaluator copied unchanged from the 1.13.0 G3 prototype (newrun.ts sha256 743c2e5c…), plus printArgs ═══════════════════
// ───────────────────────────── 1.13.0 G3 (G3-VERIFY prototype, design phase) ─────────────────────────────
// An exact evaluator for a closed subset of JavaScript and Python, used as a VERIFIER of a question in code never seen:
// the plugin runs the code the model wrote and keeps the question only when the lines it prints are exactly the model's
// answer (newItem). Anything outside the subset, any error, any print that is not one primitive value and any run past
// its limits is a refusal, never a guess: an evaluator gap can only drop a question, never show a wrong answer, unless
// the model made the very same mistake. Pure: no eval, no Function, no Node, no network, no clock, no randomness.
// Only operations whose result the language specification fixes to the bit are delegated to the host engine (number to
// text, + - * / %, string methods on ASCII or Hangul text, toFixed); everything an engine may do its own way (pow, sort
// order of an inconsistent comparator, locale, Unicode case tables) is computed here or refused.


/** Why a run was refused: outside the subset, a runtime error or a limit, a print that is not one primitive value. */
export type NewRunRefusal = 'grammar' | 'run' | 'print-value'
export type NewRunResult = { lines: string[] } | { refuse: NewRunRefusal; why: string }

/** Limits of one run: steps (statements, calls, loop turns), call depth, and the size of any string or collection. */
export const NEW_RUN_STEPS = 20_000
export const NEW_RUN_DEPTH = 40
export const NEW_RUN_SIZE = 1_000

class Refuse extends Error {
  constructor(
    readonly kind: NewRunRefusal,
    readonly why: string,
  ) {
    super(why)
  }
}
const no = (why: string): never => {
  throw new Refuse('grammar', why)
}
const fail = (why: string): never => {
  throw new Refuse('run', why)
}

/** Text a run may hold: no astral characters (a Python string counts code points, a JavaScript one UTF-16 units). */
function textOk(s: string): string {
  if (s.length > NEW_RUN_SIZE) fail('size')
  if (/[\uD800-\uDFFF]/.test(s)) no('astral')
  return s
}

/**
 * Runs `code` (a question's whole program, comments allowed) as `family` and returns the lines it prints, or why not.
 * Deterministic and bounded (NEW_RUN_STEPS, NEW_RUN_DEPTH, NEW_RUN_SIZE).
 */
export function newRun(code: string, family: 'js' | 'py', opts: NewRunOpts = {}): NewRunResult {
  printArgs = opts.printArgs === true
  try {
    const out: string[] = []
    if (family === 'js') jsRun(jsParse(code), out)
    else pyRun(pyParse(code), out)
    const lines = out.join('').replace(/\n$/, '').split('\n')
    return { lines: out.length === 0 ? [] : lines }
  } catch (e) {
    if (e instanceof Refuse) return { refuse: e.kind, why: e.why }
    // A host error (a stack overflow, a size error) is a refusal like any other.
    return { refuse: 'run', why: `host: ${e instanceof Error ? e.name : 'error'}` }
  } finally {
    printArgs = false
  }
}

/**
 * How a run reads a print (1.13.0 G2, opt-in): with `printArgs`, a print of one to four primitive values is one line, the
 * values' texts joined by one space (console.log with a first string holding `%`, which node reads as a format, and a
 * Python print with a keyword are refused); a container stays a refusal ('print-value'). Off by default: G3's reading.
 */
export type NewRunOpts = { printArgs?: boolean }
let printArgs = false

// ═════════════════════════════════════════ JavaScript ═════════════════════════════════════════

type JTok = { t: 'num' | 'str' | 'tpl' | 'name' | 'op' | 'eof'; v: any; nl: boolean; at: number }

const J_OPS = [
  '>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>',
  '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~', '?', ':', '=', '.',
]

function jsEscape(src: string, i: number): [string, number] {
  const c = src[i]
  const simple: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', '0': '\0', '\\': '\\', "'": "'", '"': '"', '`': '`', $: '$' }
  if (c === undefined) no('escape')
  if (c === '0' && /[0-9]/.test(src[i + 1] ?? '')) no('octal escape')
  if (c! in simple) return [simple[c!]!, i + 1]
  if (c === 'x') {
    const h = src.slice(i + 1, i + 3)
    if (!/^[0-9a-fA-F]{2}$/.test(h)) no('escape')
    return [String.fromCharCode(parseInt(h, 16)), i + 3]
  }
  if (c === 'u') {
    const h = src.slice(i + 1, i + 5)
    if (!/^[0-9a-fA-F]{4}$/.test(h)) no('escape')
    return [String.fromCharCode(parseInt(h, 16)), i + 5]
  }
  if (c === '\n') return ['', i + 1]
  if (/[1-9]/.test(c!)) no('escape')
  return [c!, i + 1]
}

/** Where an embedded `${…}` ends: the index of its closing brace (strings and templates inside it skipped). */
function jsSkipBraces(src: string, i: number): number {
  let depth = 0
  while (i < src.length) {
    const c = src[i]!
    if (c === '"' || c === "'") {
      i += 1
      while (i < src.length && src[i] !== c) i += src[i] === '\\' ? 2 : 1
      i += 1
      continue
    }
    if (c === '`') {
      i = jsSkipTemplate(src, i + 1)
      continue
    }
    if (c === '{') depth += 1
    if (c === '}') {
      if (depth === 0) return i
      depth -= 1
    }
    i += 1
  }
  return no('template')
}
function jsSkipTemplate(src: string, i: number): number {
  while (i < src.length) {
    if (src[i] === '\\') i += 2
    else if (src[i] === '`') return i + 1
    else if (src.startsWith('${', i)) i = jsSkipBraces(src, i + 2) + 1
    else i += 1
  }
  return no('template')
}

function jsTokens(src: string): JTok[] {
  const toks: JTok[] = []
  let i = 0
  let nl = false
  while (i < src.length) {
    const c = src[i]!
    if (c === '\n') {
      nl = true
      i += 1
      continue
    }
    if (/\s/.test(c)) {
      i += 1
      continue
    }
    if (src.startsWith('//', i)) {
      while (i < src.length && src[i] !== '\n') i += 1
      continue
    }
    if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2)
      if (end === -1) no('comment')
      if (src.slice(i, end).includes('\n')) nl = true
      i = end + 2
      continue
    }
    const at = i
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = /^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/.exec(src.slice(i))!
      const rest = src[i + m[0].length] ?? ''
      if (/[\w$]/.test(rest)) no('number')
      if (/^0\d/.test(m[0])) no('legacy octal')
      toks.push({ t: 'num', v: Number(m[0]), nl, at })
      i += m[0].length
    } else if (c === '"' || c === "'") {
      let s = ''
      i += 1
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\n') no('string')
        if (src[i] === '\\') {
          const [e, j] = jsEscape(src, i + 1)
          s += e
          i = j
        } else s += src[i++]
      }
      if (i >= src.length) no('string')
      i += 1
      toks.push({ t: 'str', v: textOk(s), nl, at })
    } else if (c === '`') {
      const quasis: string[] = []
      const exprs: any[] = []
      let s = ''
      i += 1
      for (;;) {
        if (i >= src.length) no('template')
        if (src[i] === '`') {
          i += 1
          break
        }
        if (src[i] === '\\') {
          const [e, j] = jsEscape(src, i + 1)
          s += e
          i = j
        } else if (src.startsWith('${', i)) {
          const end = jsSkipBraces(src, i + 2)
          quasis.push(textOk(s))
          s = ''
          exprs.push(jsParseExprText(src.slice(i + 2, end)))
          i = end + 1
        } else s += src[i++]
      }
      quasis.push(textOk(s))
      toks.push({ t: 'tpl', v: { quasis, exprs }, nl, at })
    } else if (/[A-Za-z_$]/.test(c)) {
      const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i))!
      if (/[^\x00-\x7f]/.test(src[i + m[0].length] ?? '')) no('name')
      toks.push({ t: 'name', v: m[0], nl, at })
      i += m[0].length
    } else {
      const op = J_OPS.find(o => src.startsWith(o, i))
      if (!op) no(`sign ${c}`)
      // `?.` before a digit is a conditional and a number (`a?.5:1`).
      if (op === '?.' && /[0-9]/.test(src[i + 2] ?? '')) {
        toks.push({ t: 'op', v: '?', nl, at })
        i += 1
      } else {
        toks.push({ t: 'op', v: op, nl, at })
        i += op!.length
      }
    }
    nl = false
  }
  toks.push({ t: 'eof', v: null, nl: true, at: src.length })
  return toks
}

const J_RESERVED = new Set([
  'this', 'new', 'class', 'super', 'yield', 'await', 'async', 'import', 'export', 'try', 'catch', 'finally', 'throw', 'with', 'void',
  'instanceof', 'debugger', 'enum', 'arguments', 'eval', 'extends',
])
const J_KEYWORDS = new Set(['var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'switch', 'case', 'default', 'typeof', 'delete', 'in', 'of', 'true', 'false', 'null'])

class JParser {
  i = 0
  constructor(readonly toks: JTok[]) {}
  get p(): { t: string; v: any; nl: boolean } {
    return this.toks[this.i]!
  }
  peek(k = 1): JTok {
    return this.toks[Math.min(this.i + k, this.toks.length - 1)]!
  }
  is(v: string): boolean {
    const t = this.p
    return (t.t === 'op' || t.t === 'name') && t.v === v
  }
  eat(v: string): boolean {
    if (!this.is(v)) return false
    this.i += 1
    return true
  }
  want(v: string): void {
    if (!this.eat(v)) no(`want ${v}`)
  }
  name(): string {
    const t = this.p
    if (t.t !== 'name' || J_KEYWORDS.has(t.v) || J_RESERVED.has(t.v)) no(`name ${t.v}`)
    this.i += 1
    return t.v
  }
  /** Statement end: `;`, a line break before the next token, `}` or the end (automatic semicolon insertion). */
  end(): void {
    if (this.eat(';')) return
    if (this.p.nl || this.is('}') || this.p.t === 'eof') return
    no('statement end')
  }
  program(): any[] {
    const body: any[] = []
    while (this.p.t !== 'eof') body.push(this.statement(true))
    return body
  }
  block(isFnBody = false): any {
    this.want('{')
    const body: any[] = []
    while (!this.is('}')) {
      if (this.p.t === 'eof') no('block')
      body.push(this.statement(isFnBody))
    }
    this.want('}')
    return { k: 'block', body }
  }
  statement(isTop: boolean): any {
    const t = this.p
    if (t.t === 'name' && J_RESERVED.has(t.v)) no(`reserved ${t.v}`)
    if (this.eat(';')) return { k: 'empty' }
    if (this.is('{')) return this.block()
    if (this.is('var') || this.is('let') || this.is('const')) {
      const d = this.decl()
      this.end()
      return d
    }
    if (this.is('function')) {
      if (!isTop) no('function in a block')
      this.i += 1
      if (this.is('*')) no('generator')
      const name = this.name()
      return { k: 'fundecl', name, fn: this.funcRest(name) }
    }
    if (this.eat('return')) {
      if (this.p.nl || this.is(';') || this.is('}') || this.p.t === 'eof') {
        this.eat(';')
        return { k: 'return' }
      }
      const arg = this.expr()
      this.end()
      return { k: 'return', arg }
    }
    if (this.eat('if')) {
      this.want('(')
      const test = this.expr()
      this.want(')')
      const then = this.sub()
      const other = this.eat('else') ? this.sub() : undefined
      return { k: 'if', test, then, other }
    }
    if (this.eat('while')) {
      this.want('(')
      const test = this.expr()
      this.want(')')
      return { k: 'while', test, body: this.sub() }
    }
    if (this.eat('do')) {
      const body = this.sub()
      this.want('while')
      this.want('(')
      const test = this.expr()
      this.want(')')
      this.eat(';')
      return { k: 'dowhile', test, body }
    }
    if (this.eat('for')) return this.forRest()
    if (this.eat('break')) {
      if (this.p.t === 'name' && !this.p.nl) no('label')
      this.end()
      return { k: 'break' }
    }
    if (this.eat('continue')) {
      if (this.p.t === 'name' && !this.p.nl) no('label')
      this.end()
      return { k: 'continue' }
    }
    if (this.eat('switch')) {
      this.want('(')
      const disc = this.expr()
      this.want(')')
      this.want('{')
      const cases: any[] = []
      while (!this.eat('}')) {
        let test: any
        if (this.eat('default')) test = undefined
        else {
          this.want('case')
          test = this.expr()
        }
        this.want(':')
        const body: any[] = []
        while (!this.is('case') && !this.is('default') && !this.is('}')) {
          if (this.p.t === 'eof') no('switch')
          body.push(this.statement(false))
        }
        cases.push({ test, body })
      }
      return { k: 'switch', disc, cases }
    }
    if (t.t === 'name' && this.peek().t === 'op' && this.peek().v === ':' && !J_KEYWORDS.has(t.v)) no('label')
    const e = this.expr()
    this.end()
    return { k: 'expr', e }
  }
  /** The body of if/for/while: a statement that is not a declaration. */
  sub(): any {
    if (this.is('let') || this.is('const') || this.is('function') || this.is('var')) no('declaration as a body')
    return this.statement(false)
  }
  decl(noIn = false): any {
    const kind = this.p.v
    this.i += 1
    const list: any[] = []
    do {
      const target = this.pattern()
      let init: any
      if (this.eat('=')) init = this.assign(noIn)
      else if (kind === 'const' && !noIn) no('const without a value')
      else if (target.k !== 'id' && !noIn) no('pattern without a value')
      list.push({ target, init })
    } while (this.eat(','))
    return { k: 'decl', kind, list }
  }
  pattern(): any {
    if (this.eat('[')) {
      const elems: any[] = []
      let rest: any
      while (!this.eat(']')) {
        if (this.is(',')) no('hole')
        if (this.eat('...')) {
          rest = this.pattern()
          this.eat(',')
          this.want(']')
          break
        }
        elems.push(this.withDefault(this.pattern()))
        if (!this.is(']')) this.want(',')
      }
      return { k: 'arrpat', elems, rest }
    }
    if (this.eat('{')) {
      const props: any[] = []
      let rest: any
      while (!this.eat('}')) {
        if (this.eat('...')) {
          rest = this.name()
          this.eat(',')
          this.want('}')
          break
        }
        const t = this.p
        let key: string
        if (t.t === 'name') {
          key = t.v
          this.i += 1
        } else if (t.t === 'str' || t.t === 'num') {
          key = String(t.v)
          this.i += 1
        } else return no('pattern key')
        let value: any
        if (this.eat(':')) value = this.withDefault(this.pattern())
        else {
          if (J_KEYWORDS.has(key) || J_RESERVED.has(key)) no('pattern name')
          value = this.withDefault({ k: 'id', name: key })
        }
        props.push({ key, value })
        if (!this.is('}')) this.want(',')
      }
      return { k: 'objpat', props, rest }
    }
    return { k: 'id', name: this.name() }
  }
  withDefault(target: any): any {
    return this.eat('=') ? { k: 'defpat', target, def: this.assign() } : target
  }
  forRest(): any {
    this.want('(')
    if (this.is('var') || this.is('let') || this.is('const')) {
      const kind = this.p.v
      const save = this.i
      this.i += 1
      const target = this.pattern()
      if (this.is('of') || this.is('in')) {
        const how = this.p.v
        this.i += 1
        const right = how === 'of' ? this.assign() : this.expr()
        this.want(')')
        return { k: how === 'of' ? 'forof' : 'forin', kind, target, right, body: this.sub() }
      }
      this.i = save
      const init = this.decl(true)
      for (const d of init.list) if (d.init === undefined && (kind === 'const' || d.target.k !== 'id')) no('declaration without a value')
      return this.forTail(init)
    }
    if (this.p.t === 'name' && (this.peek().v === 'of' || this.peek().v === 'in') && this.peek().t === 'name') {
      const target = { k: 'id', name: this.name() }
      const how = this.p.v
      this.i += 1
      const right = how === 'of' ? this.assign() : this.expr()
      this.want(')')
      return { k: how === 'of' ? 'forof' : 'forin', kind: undefined, target, right, body: this.sub() }
    }
    const init = this.is(';') ? undefined : { k: 'expr', e: this.expr(true) }
    return this.forTail(init)
  }
  forTail(init: any): any {
    this.want(';')
    const test = this.is(';') ? undefined : this.expr()
    this.want(';')
    const update = this.is(')') ? undefined : this.expr()
    this.want(')')
    return { k: 'for', init, test, update, body: this.sub() }
  }
  expr(noIn = false): any {
    const first = this.assign(noIn)
    if (!this.is(',')) return first
    const list = [first]
    while (this.eat(',')) list.push(this.assign(noIn))
    return { k: 'seq', list }
  }
  isArrowAhead(): boolean {
    // `name =>` or `( … ) =>` with balanced brackets.
    if (this.p.t === 'name' && this.peek().v === '=>' && this.peek().t === 'op') return true
    if (!this.is('(')) return false
    let depth = 0
    for (let j = this.i; j < this.toks.length; j += 1) {
      const t = this.toks[j]!
      if (t.t === 'op' && (t.v === '(' || t.v === '[' || t.v === '{')) depth += 1
      if (t.t === 'op' && (t.v === ')' || t.v === ']' || t.v === '}')) {
        depth -= 1
        if (depth === 0) {
          const next = this.toks[j + 1]!
          return next.t === 'op' && next.v === '=>' && !next.nl
        }
      }
      if (t.t === 'eof') return false
    }
    return false
  }
  assign(noIn = false): any {
    if (this.is('async')) no('async')
    if (this.isArrowAhead()) return this.arrow()
    const left = this.cond(noIn)
    const t = this.p
    if (t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=', '||=', '??='].includes(t.v)) {
      this.i += 1
      let target = left
      if (t.v === '=' && (left.k === 'arr' || left.k === 'obj')) target = this.toPattern(left)
      else if (left.k !== 'id' && left.k !== 'member') no('assignment target')
      if (left.k === 'member' && left.optional) no('assignment to ?.')
      return { k: 'assign', op: t.v, target, value: this.assign(noIn) }
    }
    return left
  }
  toPattern(e: any): any {
    if (e.k === 'id') return e
    if (e.k === 'arr') return { k: 'arrpat', elems: e.elems.map((x: any) => (x.k === 'spread' ? no('rest in assignment') : this.toPattern(x))), rest: undefined }
    if (e.k === 'assign' && e.op === '=') return { k: 'defpat', target: this.toPattern(e.target), def: e.value }
    return no('assignment pattern')
  }
  arrow(): any {
    let params: any[]
    if (this.p.t === 'name') params = [{ target: { k: 'id', name: this.name() } }]
    else params = this.params()
    this.want('=>')
    if (this.is('{')) return { k: 'fn', params, body: this.block(true).body, arrow: true }
    return { k: 'fn', params, expr: this.assign(), arrow: true }
  }
  params(): any[] {
    this.want('(')
    const params: any[] = []
    while (!this.eat(')')) {
      if (this.eat('...')) {
        params.push({ target: { k: 'id', name: this.name() }, rest: true })
        this.want(')')
        break
      }
      params.push({ target: this.withDefault(this.pattern()) })
      if (!this.is(')')) this.want(',')
    }
    const names = params.map(p => (p.target.k === 'defpat' ? p.target.target : p.target)).filter(t => t.k === 'id').map(t => t.name)
    if (new Set(names).size !== names.length) no('duplicate parameter')
    return params
  }
  funcRest(name?: string): any {
    const params = this.params()
    const body = this.block(true).body
    return { k: 'fn', params, body, arrow: false, name }
  }
  cond(noIn: boolean): any {
    const test = this.binary(0, noIn)
    if (!this.eat('?')) return test
    const then = this.assign()
    this.want(':')
    return { k: 'cond', test, then, other: this.assign(noIn) }
  }
  binary(min: number, noIn: boolean): any {
    const PREC: Record<string, number> = {
      '??': 1, '||': 2, '&&': 3, '|': 4, '^': 5, '&': 6, '==': 7, '!=': 7, '===': 7, '!==': 7,
      '<': 8, '>': 8, '<=': 8, '>=': 8, in: 8, '<<': 9, '>>': 9, '>>>': 9, '+': 10, '-': 10, '*': 11, '/': 11, '%': 11, '**': 12,
    }
    let left = this.unary()
    for (;;) {
      const t = this.p
      const op = (t.t === 'op' || (t.t === 'name' && t.v === 'in')) ? t.v : undefined
      const prec = op !== undefined ? PREC[op] : undefined
      if (prec === undefined || prec < min || (noIn && op === 'in')) break
      if (t.t === 'name' && t.v === 'instanceof') no('instanceof')
      this.i += 1
      if (op === '**') {
        if (left.k === 'unary') no('unary before **')
        left = { k: 'bin', op, l: left, r: this.binary(prec, noIn) }
        continue
      }
      const right = this.binary(prec + 1, noIn)
      if ((op === '??' && (right.k === 'logic' && right.op !== '??')) || (op === '??' && left.k === 'logic' && left.op !== '??' && !left.paren)) no('?? beside && or ||')
      if ((op === '||' || op === '&&') && ((left.k === 'logic' && left.op === '??' && !left.paren) || (right.k === 'logic' && right.op === '??' && !right.paren))) no('?? beside && or ||')
      left = op === '&&' || op === '||' || op === '??' ? { k: 'logic', op, l: left, r: right } : { k: 'bin', op, l: left, r: right }
    }
    return left
  }
  unary(): any {
    const t = this.p
    if (t.t === 'op' && ['!', '-', '+', '~'].includes(t.v)) {
      this.i += 1
      return { k: 'unary', op: t.v, arg: this.unary() }
    }
    if (t.t === 'name' && (t.v === 'typeof' || t.v === 'delete')) {
      this.i += 1
      return { k: 'unary', op: t.v, arg: this.unary() }
    }
    if (t.t === 'op' && (t.v === '++' || t.v === '--')) {
      this.i += 1
      const arg = this.unary()
      if (arg.k !== 'id' && arg.k !== 'member') no('update target')
      return { k: 'update', op: t.v, prefix: true, arg }
    }
    const e = this.postfix()
    const n = this.p
    if (n.t === 'op' && (n.v === '++' || n.v === '--') && !n.nl) {
      this.i += 1
      if (e.k !== 'id' && e.k !== 'member') no('update target')
      return { k: 'update', op: n.v, prefix: false, arg: e }
    }
    return e
  }
  postfix(): any {
    let e = this.primary()
    let chain = false
    for (;;) {
      if (this.eat('.')) {
        const t = this.p
        if (t.t !== 'name') no('property')
        this.i += 1
        e = { k: 'member', obj: e, prop: t.v, optional: false, chain }
      } else if (this.is('?.')) {
        this.i += 1
        chain = true
        if (this.is('(')) e = { k: 'call', callee: e, args: this.args(), optional: true, chain }
        else if (this.eat('[')) {
          const prop = this.expr()
          this.want(']')
          e = { k: 'member', obj: e, computed: prop, optional: true, chain }
        } else {
          const t = this.p
          if (t.t !== 'name') no('property')
          this.i += 1
          e = { k: 'member', obj: e, prop: t.v, optional: true, chain }
        }
      } else if (this.eat('[')) {
        const prop = this.expr()
        this.want(']')
        e = { k: 'member', obj: e, computed: prop, optional: false, chain }
      } else if (this.is('(')) {
        e = { k: 'call', callee: e, args: this.args(), optional: false, chain }
      } else if (this.p.t === 'tpl') no('tagged template')
      else break
    }
    return chain ? { k: 'chain', e } : e
  }
  args(): any[] {
    this.want('(')
    const args: any[] = []
    while (!this.eat(')')) {
      if (this.eat('...')) args.push({ k: 'spread', e: this.assign() })
      else args.push(this.assign())
      if (!this.is(')')) this.want(',')
    }
    return args
  }
  primary(): any {
    const t = this.p
    if (t.t === 'num') {
      this.i += 1
      return { k: 'lit', v: t.v }
    }
    if (t.t === 'str') {
      this.i += 1
      return { k: 'lit', v: t.v }
    }
    if (t.t === 'tpl') {
      this.i += 1
      return { k: 'tpl', quasis: t.v.quasis, exprs: t.v.exprs }
    }
    if (t.t === 'name') {
      if (t.v === 'true' || t.v === 'false') {
        this.i += 1
        return { k: 'lit', v: t.v === 'true' }
      }
      if (t.v === 'null') {
        this.i += 1
        return { k: 'lit', v: null }
      }
      if (t.v === 'function') {
        this.i += 1
        if (this.is('*')) no('generator')
        const name = this.p.t === 'name' && !this.is('(') ? this.name() : undefined
        return { ...this.funcRest(name), named: name }
      }
      return { k: 'id', name: this.name() }
    }
    if (this.eat('(')) {
      const e = this.expr()
      this.want(')')
      return { ...e, paren: true }
    }
    if (this.eat('[')) {
      const elems: any[] = []
      while (!this.eat(']')) {
        if (this.is(',')) no('hole')
        if (this.eat('...')) elems.push({ k: 'spread', e: this.assign() })
        else elems.push(this.assign())
        if (!this.is(']')) this.want(',')
      }
      return { k: 'arr', elems }
    }
    if (this.eat('{')) {
      const props: any[] = []
      while (!this.eat('}')) {
        if (this.eat('...')) props.push({ spread: this.assign() })
        else {
          const k = this.p
          let key: any
          let computed: any
          if (k.t === 'name') key = k.v
          else if (k.t === 'str') key = k.v
          else if (k.t === 'num') key = String(k.v)
          else if (k.t === 'op' && k.v === '[') {
            this.i += 1
            computed = this.assign()
            this.want(']')
          } else no('object key')
          if (computed === undefined) this.i += 1
          if (key === '__proto__') no('__proto__')
          if (this.is('(')) {
            if (k.t === 'name' && (k.v === 'get' || k.v === 'set' || k.v === 'async')) no('accessor')
            props.push({ key, computed, value: this.funcRest(key) })
          } else if (this.eat(':')) props.push({ key, computed, value: this.assign() })
          else {
            if (k.t !== 'name' || J_KEYWORDS.has(key) || J_RESERVED.has(key)) no('shorthand')
            props.push({ key, value: { k: 'id', name: key } })
          }
        }
        if (!this.is('}')) this.want(',')
      }
      return { k: 'obj', props }
    }
    return no(`token ${t.v}`)
  }
}

function jsParseExprText(src: string): any {
  const p = new JParser(jsTokens(src))
  const e = p.expr()
  if (p.p.t !== 'eof') no('template expression')
  return e
}

/** The program's statements (newParse for JavaScript). */
export function jsParse(src: string): any[] {
  return new JParser(jsTokens(src)).program()
}

// ── JavaScript run ──

type JBind = { v: any; init: boolean; kind: string }
class JScope {
  vars = new Map<string, JBind>()
  constructor(
    readonly parent: JScope | undefined,
    readonly isFn: boolean,
    readonly pure: number,
  ) {}
  find(name: string): JBind | undefined {
    for (let s: JScope | undefined = this; s; s = s.parent) {
      const b = s.vars.get(name)
      if (b) return b
    }
    return undefined
  }
  owner(name: string): JScope | undefined {
    for (let s: JScope | undefined = this; s; s = s.parent) if (s.vars.has(name)) return s
    return undefined
  }
  fn(): JScope {
    let s: JScope = this
    while (!s.isFn && s.parent) s = s.parent
    return s
  }
}

const BREAK = { k: 'break' }
const CONTINUE = { k: 'continue' }
class JReturn {
  constructor(readonly v: any) {}
}

/** The user functions of a run (host functions wrapping the interpreter), told apart from the host's own. */
type JCtx = { steps: number; depth: number; out: string[]; fns: WeakSet<object>; pure: number; arrays: WeakSet<object>; objs: WeakSet<object> }

const J_STRING_METHODS = new Set([
  'toUpperCase', 'toLowerCase', 'trim', 'trimStart', 'trimEnd', 'split', 'slice', 'indexOf', 'lastIndexOf', 'includes', 'startsWith', 'endsWith',
  'replace', 'replaceAll', 'repeat', 'at', 'concat', 'charAt', 'padStart', 'padEnd', 'substring', 'charCodeAt', 'toString',
])
const J_ARRAY_METHODS = new Set([
  'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat', 'join', 'indexOf', 'lastIndexOf', 'includes', 'map', 'filter', 'reduce',
  'reduceRight', 'forEach', 'find', 'findIndex', 'findLast', 'findLastIndex', 'some', 'every', 'sort', 'reverse', 'at', 'fill', 'flat', 'toString',
])
const J_MUTATING = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill'])
const J_CALLBACK = new Set(['map', 'filter', 'reduce', 'reduceRight', 'forEach', 'find', 'findIndex', 'findLast', 'findLastIndex', 'some', 'every'])

/** Host statics a run may call (each exact by the specification for the arguments the run passes). */
const J_GLOBALS: Record<string, any> = {
  undefined: undefined,
  NaN: NaN,
  Infinity: Infinity,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  Number: Object.assign((x: any) => Number(x), { __ns: 'Number' }),
  String: Object.assign((x: any) => String(x), { __ns: 'String' }),
  Boolean: Object.assign((x: any) => Boolean(x), { __ns: 'Boolean' }),
  Math: { __ns: 'Math' },
  Object: { __ns: 'Object' },
  Array: { __ns: 'Array' },
  console: { __ns: 'console' },
}
const J_NS: Record<string, Set<string>> = {
  Math: new Set(['max', 'min', 'floor', 'ceil', 'round', 'abs', 'trunc', 'sqrt', 'sign', 'pow', 'PI']),
  Number: new Set(['isInteger', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'MAX_SAFE_INTEGER']),
  Object: new Set(['keys', 'values', 'entries', 'assign']),
  Array: new Set(['isArray', 'from', 'of']),
  String: new Set([]),
  Boolean: new Set([]),
  console: new Set(['log']),
}

function jsSize(v: any): any {
  if (typeof v === 'string') textOk(v)
  else if (Array.isArray(v) && v.length > NEW_RUN_SIZE) fail('size')
  return v
}

/** Exact x ** y: only an integer to a non-negative integer power whose result is a safe integer; else refused. */
function jsPow(x: any, y: any): number {
  if (typeof x !== 'number' || typeof y !== 'number') no('** of a non-number')
  if (Number.isInteger(x) && Number.isInteger(y) && y >= 0 && y <= 64) {
    let r = 1
    for (let k = 0; k < y; k += 1) {
      r *= x
      if (!Number.isSafeInteger(r)) no('** past exact')
    }
    return r
  }
  if (y === 0.5 && x >= 0) return Math.sqrt(x)
  return no('** inexact')
}

function jsPrint(v: any, ctx: JCtx): void {
  if (ctx.pure > 0) no('print in a comparator')
  ctx.out.push(textOk(jsPrintText(v)) + '\n')
}
function jsPrintText(v: any): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v)
  if (typeof v === 'boolean' || v === null || v === undefined) return String(v)
  throw new Refuse('print-value', 'print of an object')
}
/** console.log of two to four primitive values (printArgs): joined by one space, as node's format does with no `%`. */
function jsPrintMany(args: any[], ctx: JCtx): void {
  if (ctx.pure > 0) no('print in a comparator')
  if (args.length < 2 || args.length > 4) throw new Refuse('print-value', 'print of several values')
  if (typeof args[0] === 'string' && args[0].includes('%')) throw new Refuse('print-value', 'print of a format')
  ctx.out.push(textOk(args.map(jsPrintText).join(' ')) + '\n')
}

function jsRun(body: any[], out: string[]): void {
  const ctx: JCtx = { steps: 0, depth: 0, out, fns: new WeakSet(), pure: 0, arrays: new WeakSet(), objs: new WeakSet() }
  const global = new JScope(undefined, true, 0)
  jsHoist(body, global, ctx, true)
  try {
    jsBlockBody(body, global, ctx)
  } catch (e) {
    if (e instanceof JReturn) no('return outside a function')
    if (e === BREAK || e === CONTINUE) no('break outside a loop')
    throw e
  }
}

function jsStep(ctx: JCtx): void {
  ctx.steps += 1
  if (ctx.steps > NEW_RUN_STEPS) fail('steps')
}

/** var names (any depth, not inside functions) and function declarations (this level) of a function body. */
function jsHoist(body: any[], scope: JScope, ctx: JCtx, isFnBody: boolean): void {
  const vars = (st: any): void => {
    if (!st || typeof st !== 'object') return
    if (st.k === 'decl' && st.kind === 'var') for (const d of st.list) for (const n of patNames(d.target)) if (!scope.vars.has(n)) scope.vars.set(n, { v: undefined, init: true, kind: 'var' })
    if ((st.k === 'for' || st.k === 'forof' || st.k === 'forin') && st.kind === 'var') for (const n of patNames(st.target)) if (!scope.vars.has(n)) scope.vars.set(n, { v: undefined, init: true, kind: 'var' })
    for (const key of ['body', 'then', 'other', 'init']) {
      const x = st[key]
      if (Array.isArray(x)) x.forEach(vars)
      else if (x && typeof x === 'object' && x.k) vars(x)
    }
    if (st.k === 'switch') for (const c of st.cases) c.body.forEach(vars)
  }
  if (isFnBody) body.forEach(vars)
  jsDeclareLexical(body, scope, ctx)
}

function patNames(p: any): string[] {
  if (!p) return []
  if (p.k === 'id') return [p.name]
  if (p.k === 'defpat') return patNames(p.target)
  if (p.k === 'arrpat') return [...p.elems.flatMap(patNames), ...patNames(p.rest)]
  if (p.k === 'objpat') return [...p.props.flatMap((q: any) => patNames(q.value)), ...(p.rest ? [p.rest] : [])]
  return []
}

/** let/const of a block in their dead zone, and its function declarations made at once (hoisted). */
function jsDeclareLexical(body: any[], scope: JScope, ctx: JCtx): void {
  for (const st of body) {
    if (st.k === 'decl' && st.kind !== 'var')
      for (const d of st.list)
        for (const n of patNames(d.target)) {
          if (scope.vars.has(n)) no('declared twice')
          scope.vars.set(n, { v: undefined, init: false, kind: st.kind })
        }
  }
  for (const st of body) {
    if (st.k === 'fundecl') {
      const b = scope.vars.get(st.name)
      if (b && b.kind !== 'var' && b.kind !== 'fn') no('declared twice')
      scope.vars.set(st.name, { v: jsMakeFn(st.fn, scope, ctx), init: true, kind: 'fn' })
    }
  }
}

function jsBlockBody(body: any[], scope: JScope, ctx: JCtx): void {
  for (const st of body) jsExec(st, scope, ctx)
}

function jsExec(st: any, scope: JScope, ctx: JCtx): void {
  jsStep(ctx)
  switch (st.k) {
    case 'empty':
    case 'fundecl':
      return
    case 'expr':
      jsEval(st.e, scope, ctx)
      return
    case 'decl':
      for (const d of st.list) {
        if (st.kind === 'var') {
          if (d.init !== undefined) jsBindPattern(d.target, jsEval(d.init, scope, ctx), scope, ctx, 'assign')
        } else jsBindPattern(d.target, d.init === undefined ? undefined : jsEval(d.init, scope, ctx), scope, ctx, 'init')
      }
      return
    case 'block': {
      const inner = new JScope(scope, false, ctx.pure)
      jsDeclareLexical(st.body, inner, ctx)
      jsBlockBody(st.body, inner, ctx)
      return
    }
    case 'return':
      throw new JReturn(st.arg === undefined ? undefined : jsEval(st.arg, scope, ctx))
    case 'if':
      if (jsEval(st.test, scope, ctx)) jsExec(st.then, scope, ctx)
      else if (st.other) jsExec(st.other, scope, ctx)
      return
    case 'while':
      while (jsEval(st.test, scope, ctx)) {
        jsStep(ctx)
        if (jsLoopBody(st.body, scope, ctx)) break
      }
      return
    case 'dowhile':
      do {
        jsStep(ctx)
        if (jsLoopBody(st.body, scope, ctx)) break
      } while (jsEval(st.test, scope, ctx))
      return
    case 'for': {
      const isLet = st.init?.k === 'decl' && st.init.kind !== 'var'
      let iter = new JScope(scope, false, ctx.pure)
      if (st.init?.k === 'decl') {
        if (isLet) jsDeclareLexical([st.init], iter, ctx)
        jsExec(st.init, iter, ctx)
      } else if (st.init) jsEval(st.init.e, iter, ctx)
      const copy = (from: JScope): JScope => {
        if (!isLet) return from
        const next = new JScope(scope, false, ctx.pure)
        for (const [n, b] of from.vars) next.vars.set(n, { ...b })
        return next
      }
      iter = copy(iter)
      for (;;) {
        jsStep(ctx)
        if (st.test && !jsEval(st.test, iter, ctx)) break
        if (jsLoopBody(st.body, iter, ctx)) break
        iter = copy(iter)
        if (st.update) jsEval(st.update, iter, ctx)
      }
      return
    }
    case 'forof':
    case 'forin': {
      const right = jsEval(st.right, scope, ctx)
      let items: any[]
      if (st.k === 'forof') {
        if (typeof right === 'string') items = [...right]
        else if (Array.isArray(right)) items = right
        else return void fail('for of over a non-array')
      } else {
        if (right === null || right === undefined) items = []
        else if (typeof right === 'object' && (ctx.objs.has(right) || ctx.arrays.has(right) || Array.isArray(right))) items = Object.keys(right)
        else if (typeof right === 'string') items = Object.keys(right)
        else return void no('for in over this')
      }
      // An array is read live by index (a for…of over an array pushed to inside runs on); keys are taken first.
      for (let k = 0; st.k === 'forof' && Array.isArray(right) ? k < right.length : k < items.length; k += 1) {
        jsStep(ctx)
        const value = st.k === 'forof' && Array.isArray(right) ? right[k] : items[k]
        const inner = new JScope(scope, false, ctx.pure)
        if (st.kind === 'let' || st.kind === 'const') {
          for (const n of patNames(st.target)) inner.vars.set(n, { v: undefined, init: false, kind: st.kind })
          jsBindPattern(st.target, value, inner, ctx, 'init')
        } else jsBindPattern(st.target, value, scope, ctx, 'assign')
        if (jsLoopBody(st.body, inner, ctx)) break
      }
      return
    }
    case 'break':
      throw BREAK
    case 'continue':
      throw CONTINUE
    case 'switch': {
      const d = jsEval(st.disc, scope, ctx)
      const inner = new JScope(scope, false, ctx.pure)
      jsDeclareLexical(
        st.cases.flatMap((c: any) => c.body),
        inner,
        ctx,
      )
      let at = -1
      for (let k = 0; k < st.cases.length && at === -1; k += 1) if (st.cases[k].test !== undefined && jsEval(st.cases[k].test, inner, ctx) === d) at = k
      if (at === -1) at = st.cases.findIndex((c: any) => c.test === undefined)
      if (at === -1) return
      try {
        for (let k = at; k < st.cases.length; k += 1) jsBlockBody(st.cases[k].body, inner, ctx)
      } catch (e) {
        if (e === BREAK) return
        throw e
      }
      return
    }
  }
  no(`statement ${st.k}`)
}

/** Runs a loop body; true when it broke out. */
function jsLoopBody(body: any, scope: JScope, ctx: JCtx): boolean {
  try {
    jsExec(body, scope, ctx)
  } catch (e) {
    if (e === BREAK) return true
    if (e === CONTINUE) return false
    throw e
  }
  return false
}

function jsBindPattern(p: any, v: any, scope: JScope, ctx: JCtx, how: 'init' | 'assign' | 'param'): void {
  if (p.k === 'id') {
    if (how === 'init') {
      const b = scope.vars.get(p.name)
      if (!b) no('binding')
      b!.v = v
      b!.init = true
    } else if (how === 'param') scope.vars.set(p.name, { v, init: true, kind: 'let' })
    else jsSetName(p.name, v, scope, ctx)
    return
  }
  if (p.k === 'defpat') {
    jsBindPattern(p.target, v === undefined ? jsEval(p.def, scope, ctx) : v, scope, ctx, how)
    return
  }
  if (p.k === 'arrpat') {
    if (typeof v === 'string') v = [...v]
    if (!Array.isArray(v)) fail('destructuring a non-array')
    p.elems.forEach((e: any, k: number) => jsBindPattern(e, v[k], scope, ctx, how))
    if (p.rest) jsBindPattern(p.rest, jsArr(v.slice(p.elems.length), ctx), scope, ctx, how)
    return
  }
  if (p.k === 'objpat') {
    if (v === null || v === undefined) fail('destructuring null')
    for (const q of p.props) jsBindPattern(q.value, jsGetProp(v, q.key, ctx), scope, ctx, how)
    if (p.rest) {
      if (!ctx.objs.has(v)) no('rest of a non-object')
      const rest = jsObj(ctx)
      for (const key of Object.keys(v)) if (!p.props.some((q: any) => q.key === key)) rest[key] = v[key]
      jsBindPattern({ k: 'id', name: p.rest }, rest, scope, ctx, how)
    }
    return
  }
  no('pattern')
}

function jsArr(a: any[], ctx: JCtx): any[] {
  ctx.arrays.add(a)
  return jsSize(a)
}
function jsObj(ctx: JCtx): any {
  const o: any = {}
  ctx.objs.add(o)
  return o
}

function jsGetName(name: string, scope: JScope): any {
  const b = scope.find(name)
  if (b) {
    if (!b.init) fail(`dead zone ${name}`)
    return b.v
  }
  if (name in J_GLOBALS) return J_GLOBALS[name]
  return fail(`not defined ${name}`)
}

function jsSetName(name: string, v: any, scope: JScope, ctx: JCtx): void {
  const owner = scope.owner(name)
  if (!owner) return void no(`assigning an undeclared ${name}`)
  const b = owner.vars.get(name)!
  if (!b.init) fail(`dead zone ${name}`)
  if (b.kind === 'const') fail(`const ${name}`)
  if (ctx.pure > 0 && owner.pure < ctx.pure) no('comparator writes outside')
  b.v = v
}

function jsMakeFn(fn: any, closure: JScope, ctx: JCtx): any {
  const f = function (...args: any[]) {
    return jsCall(fn, closure, args, ctx, f)
  }
  Object.defineProperty(f, 'toString', {
    value: () => {
      throw new Refuse('run', 'a function as text')
    },
  })
  Object.defineProperty(f, Symbol.toPrimitive, {
    value: () => {
      throw new Refuse('run', 'a function as text')
    },
  })
  ctx.fns.add(f)
  return f
}

function jsCall(fn: any, closure: JScope, args: any[], ctx: JCtx, self: any): any {
  jsStep(ctx)
  ctx.depth += 1
  if (ctx.depth > NEW_RUN_DEPTH) fail('depth')
  try {
    const scope = new JScope(closure, true, ctx.pure)
    if (fn.named !== undefined) scope.vars.set(fn.named, { v: self, init: true, kind: 'const-fn' })
    fn.params.forEach((p: any, k: number) => {
      if (p.rest) jsBindPattern(p.target, jsArr(args.slice(k), ctx), scope, ctx, 'param')
      else {
        for (const n of patNames(p.target)) scope.vars.set(n, { v: undefined, init: true, kind: 'let' })
        jsBindPattern(p.target, args[k], scope, ctx, 'param')
      }
    })
    if (fn.expr !== undefined) return jsEval(fn.expr, scope, ctx)
    jsHoist(fn.body, scope, ctx, true)
    try {
      jsBlockBody(fn.body, scope, ctx)
    } catch (e) {
      if (e instanceof JReturn) return e.v
      if (e === BREAK || e === CONTINUE) no('break outside a loop')
      throw e
    }
    return undefined
  } finally {
    ctx.depth -= 1
  }
}

function jsEval(e: any, scope: JScope, ctx: JCtx): any {
  switch (e.k) {
    case 'lit':
      return e.v
    case 'tpl': {
      let s = e.quasis[0]
      e.exprs.forEach((x: any, k: number) => {
        s += String(jsPrimForText(jsEval(x, scope, ctx), ctx)) + e.quasis[k + 1]
        textOk(s)
      })
      return textOk(s)
    }
    case 'id':
      return jsGetName(e.name, scope)
    case 'arr': {
      const a: any[] = []
      for (const x of e.elems) {
        if (x.k === 'spread') {
          const v = jsEval(x.e, scope, ctx)
          if (typeof v === 'string') a.push(...v)
          else if (Array.isArray(v)) a.push(...v)
          else fail('spread of a non-array')
        } else a.push(jsEval(x, scope, ctx))
        jsSize(a)
      }
      return jsArr(a, ctx)
    }
    case 'obj': {
      const o = jsObj(ctx)
      for (const p of e.props) {
        if (p.spread !== undefined) {
          const v = jsEval(p.spread, scope, ctx)
          if (v === null || v === undefined) continue
          if (!ctx.objs.has(v) && !Array.isArray(v)) no('spread of this')
          Object.assign(o, v)
          continue
        }
        const key = p.computed !== undefined ? jsKey(jsEval(p.computed, scope, ctx)) : p.key
        if (key === '__proto__' || (key in Object.prototype && !Object.prototype.hasOwnProperty.call(o, key))) no('object key from the prototype')
        o[key] = p.value.k === 'fn' ? jsMakeFn(p.value, scope, ctx) : jsEval(p.value, scope, ctx)
      }
      if (Object.keys(o).length > NEW_RUN_SIZE) fail('size')
      return o
    }
    case 'fn':
      return jsMakeFn(e, scope, ctx)
    case 'unary': {
      if (e.op === 'typeof') {
        if (e.arg.k === 'id' && !scope.find(e.arg.name) && !(e.arg.name in J_GLOBALS)) return 'undefined'
        return typeof jsEval(e.arg, scope, ctx)
      }
      if (e.op === 'delete') {
        if (e.arg.k !== 'member') no('delete')
        const obj = jsEval(e.arg.obj, scope, ctx)
        const key = e.arg.computed !== undefined ? jsKey(jsEval(e.arg.computed, scope, ctx)) : e.arg.prop
        if (!ctx.objs.has(obj)) no('delete from this')
        if (ctx.pure > 0) no('comparator writes')
        return delete obj[key]
      }
      const v = jsPrim(jsEval(e.arg, scope, ctx), ctx)
      if (e.op === '!') return !v
      if (e.op === '-') return -v
      if (e.op === '+') return +v
      if (e.op === '~') return ~v
      return no('unary')
    }
    case 'update': {
      const old = jsPrim(jsEval(e.arg, scope, ctx), ctx)
      const num = typeof old === 'number' ? old : Number(old)
      const next = e.op === '++' ? num + 1 : num - 1
      jsAssignTo(e.arg, next, scope, ctx)
      return e.prefix ? next : num
    }
    case 'bin': {
      const l = jsEval(e.l, scope, ctx)
      const r = jsEval(e.r, scope, ctx)
      return jsBinary(e.op, l, r, ctx)
    }
    case 'logic': {
      const l = jsEval(e.l, scope, ctx)
      if (e.op === '&&') return l ? jsEval(e.r, scope, ctx) : l
      if (e.op === '||') return l ? l : jsEval(e.r, scope, ctx)
      return l === null || l === undefined ? jsEval(e.r, scope, ctx) : l
    }
    case 'cond':
      return jsEval(e.test, scope, ctx) ? jsEval(e.then, scope, ctx) : jsEval(e.other, scope, ctx)
    case 'seq': {
      let v: any
      for (const x of e.list) v = jsEval(x, scope, ctx)
      return v
    }
    case 'assign': {
      if (e.op === '=') {
        const v = jsEval(e.value, scope, ctx)
        if (e.target.k === 'arrpat' || e.target.k === 'objpat') {
          jsBindPattern(e.target, v, scope, ctx, 'assign')
          return v
        }
        if (e.target.k === 'id') {
          jsSetName(e.target.name, v, scope, ctx)
          return v
        }
        const obj = jsEval(e.target.obj, scope, ctx)
        const key = e.target.computed !== undefined ? jsEval(e.target.computed, scope, ctx) : e.target.prop
        jsSetProp(obj, key, v, ctx)
        return v
      }
      if (e.op === '&&=' || e.op === '||=' || e.op === '??=') {
        const cur = jsEval(e.target, scope, ctx)
        const go = e.op === '&&=' ? !!cur : e.op === '||=' ? !cur : cur === null || cur === undefined
        if (!go) return cur
        const v = jsEval(e.value, scope, ctx)
        jsAssignTo(e.target, v, scope, ctx)
        return v
      }
      // Compound: the target's place read once.
      if (e.target.k === 'id') {
        const v = jsBinary(e.op.slice(0, -1), jsGetName(e.target.name, scope), jsEval(e.value, scope, ctx), ctx)
        jsSetName(e.target.name, v, scope, ctx)
        return v
      }
      const obj = jsEval(e.target.obj, scope, ctx)
      const key = e.target.computed !== undefined ? jsEval(e.target.computed, scope, ctx) : e.target.prop
      const v = jsBinary(e.op.slice(0, -1), jsGetProp(obj, key, ctx), jsEval(e.value, scope, ctx), ctx)
      jsSetProp(obj, key, v, ctx)
      return v
    }
    case 'chain':
      try {
        return jsEval(e.e, scope, ctx)
      } catch (x) {
        if (x === SHORT) return undefined
        throw x
      }
    case 'member': {
      const obj = jsEval(e.obj, scope, ctx)
      if (e.optional && (obj === null || obj === undefined)) throw SHORT
      const key = e.computed !== undefined ? jsEval(e.computed, scope, ctx) : e.prop
      return jsGetProp(obj, key, ctx)
    }
    case 'call':
      return jsEvalCall(e, scope, ctx)
    case 'spread':
      return no('spread here')
  }
  return no(`expression ${e.k}`)
}

const SHORT = { short: true }

function jsKey(k: any): string {
  if (typeof k === 'string') return k
  if (typeof k === 'number') return String(k)
  if (typeof k === 'boolean' || k === null || k === undefined) return String(k)
  return no('key of this kind')
}

/** A value made primitive for an operator: a run's arrays and objects by the host's own rules (join, [object Object]). */
function jsPrim(v: any, ctx: JCtx): any {
  if (v === null || typeof v !== 'object') {
    if (typeof v === 'function') fail('a function as a value')
    return v
  }
  if (v.__ns) no('a namespace as a value')
  if (!ctx.arrays.has(v) && !ctx.objs.has(v)) no('a host object as a value')
  return v
}
function jsPrimForText(v: any, ctx: JCtx): any {
  const p = jsPrim(v, ctx)
  if (typeof p === 'object' && p !== null) {
    // String(array) joins its items by String; nested functions refuse through their own toString.
    const s = String(p)
    return textOk(s)
  }
  return p
}

function jsBinary(op: string, l: any, r: any, ctx: JCtx): any {
  if (op === '===' || op === '!==') {
    const same = l === r
    return op === '===' ? same : !same
  }
  if (op === 'in') {
    if (r === null || typeof r !== 'object' || (!ctx.objs.has(r) && !ctx.arrays.has(r))) fail('in over a non-object')
    const key = jsKey(jsPrim(l, ctx))
    if (key in Object.prototype && !Object.prototype.hasOwnProperty.call(r, key)) no('in for a prototype key')
    return key in r
  }
  const a = jsPrim(l, ctx)
  const b = jsPrim(r, ctx)
  switch (op) {
    case '+':
      return jsSize(a + b)
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return a / b
    case '%':
      return a % b
    case '**':
      return jsPow(typeof a === 'number' ? a : Number(a), typeof b === 'number' ? b : Number(b))
    case '==':
      return a == b
    case '!=':
      return a != b
    case '<':
      return a < b
    case '>':
      return a > b
    case '<=':
      return a <= b
    case '>=':
      return a >= b
    case '&':
      return a & b
    case '|':
      return a | b
    case '^':
      return a ^ b
    case '<<':
      return a << b
    case '>>':
      return a >> b
    case '>>>':
      return a >>> b
  }
  return no(`operator ${op}`)
}

function jsGetProp(obj: any, key: any, ctx: JCtx): any {
  if (obj === null || obj === undefined) fail('property of null')
  if (typeof key !== 'string') key = jsKey(key)
  if (typeof obj === 'string') {
    if (key === 'length') return obj.length
    if (/^(?:0|[1-9]\d*)$/.test(key)) return obj[Number(key)]
    return no(`string property ${key}`)
  }
  if (Array.isArray(obj)) {
    if (key === 'length') return obj.length
    if (/^(?:0|[1-9]\d*)$/.test(key)) return obj[Number(key)]
    if (key in Array.prototype) no(`array property ${key}`)
    return undefined
  }
  if (typeof obj === 'object' && obj.__ns) {
    if (obj.__ns === 'Math' && key === 'PI') return Math.PI
    if (obj.__ns === 'Number' && key === 'MAX_SAFE_INTEGER') return Number.MAX_SAFE_INTEGER
    return no(`static ${obj.__ns}.${key}`)
  }
  if (typeof obj === 'function' && obj.__ns) {
    if (obj.__ns === 'Number' && key === 'MAX_SAFE_INTEGER') return Number.MAX_SAFE_INTEGER
    return no(`static ${obj.__ns}.${key}`)
  }
  if (typeof obj === 'object' && ctx.objs.has(obj)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key]
    if (key in Object.prototype || key === '__proto__') no(`object prototype ${key}`)
    return undefined
  }
  return no(`property ${key} of a ${typeof obj}`)
}

function jsSetProp(obj: any, key: any, v: any, ctx: JCtx): void {
  if (obj === null || obj === undefined) fail('property of null')
  if (ctx.pure > 0) no('comparator writes')
  const k = jsKey(key)
  if (Array.isArray(obj) && ctx.arrays.has(obj)) {
    if (k === 'length') {
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > obj.length) no('length past the end')
      obj.length = v
      return
    }
    if (!/^(?:0|[1-9]\d*)$/.test(k)) no('array key')
    if (Number(k) > obj.length) no('writing past the length')
    obj[Number(k)] = v
    jsSize(obj)
    return
  }
  if (typeof obj === 'object' && ctx.objs.has(obj)) {
    if (k === '__proto__' || (k in Object.prototype && !Object.prototype.hasOwnProperty.call(obj, k))) no('prototype key')
    obj[k] = v
    if (Object.keys(obj).length > NEW_RUN_SIZE) fail('size')
    return
  }
  no('setting a property of this')
}

function jsAssignTo(target: any, v: any, scope: JScope, ctx: JCtx): void {
  if (target.k === 'id') return jsSetName(target.name, v, scope, ctx)
  const obj = jsEval(target.obj, scope, ctx)
  const key = target.computed !== undefined ? jsEval(target.computed, scope, ctx) : target.prop
  jsSetProp(obj, key, v, ctx)
}

function jsArgs(list: any[], scope: JScope, ctx: JCtx): any[] {
  const out: any[] = []
  for (const a of list) {
    if (a.k === 'spread') {
      const v = jsEval(a.e, scope, ctx)
      if (typeof v === 'string') out.push(...v)
      else if (Array.isArray(v)) out.push(...v)
      else fail('spread of a non-array')
    } else out.push(jsEval(a, scope, ctx))
  }
  return out
}

function jsEvalCall(e: any, scope: JScope, ctx: JCtx): any {
  const c = e.callee
  if (c.k === 'member') {
    const obj = jsEval(c.obj, scope, ctx)
    if (c.optional && (obj === null || obj === undefined)) throw SHORT
    const name = c.computed !== undefined ? jsKey(jsEval(c.computed, scope, ctx)) : c.prop
    if (e.optional) {
      // a?.b?.() : the method missing gives undefined.
      const f = obj !== null && obj !== undefined && ctx.objs.has(obj) ? obj[name] : 0
      if (f === null || f === undefined) throw SHORT
    }
    const args = jsArgs(e.args, scope, ctx)
    return jsMethod(obj, name, args, ctx)
  }
  const f = jsEval(c, scope, ctx)
  if (e.optional && (f === null || f === undefined)) throw SHORT
  const args = jsArgs(e.args, scope, ctx)
  if (typeof f !== 'function') fail('calling a non-function')
  if (ctx.fns.has(f)) return f(...args)
  return jsHostCall(f, args, ctx)
}

function jsNum(v: any): void {
  if (typeof v !== 'number') no('a non-number argument')
}

function jsHostCall(f: any, args: any[], ctx: JCtx): any {
  args.forEach(a => {
    if (typeof a === 'object' && a !== null && !ctx.arrays.has(a) && !ctx.objs.has(a)) no('host argument')
  })
  if (f === parseInt) return parseInt(jsPrimForText(args[0], ctx), jsPrim(args[1], ctx))
  if (f === parseFloat) return parseFloat(jsPrimForText(args[0], ctx))
  if (f === isNaN) return isNaN(jsPrim(args[0], ctx))
  if (f === isFinite) return isFinite(jsPrim(args[0], ctx))
  if (f === J_GLOBALS.Number) return args.length === 0 ? 0 : Number(jsPrim(args[0], ctx))
  if (f === J_GLOBALS.String) return args.length === 0 ? '' : textOk(String(jsPrimForText(args[0], ctx)))
  if (f === J_GLOBALS.Boolean) return Boolean(args[0])
  return no('host call')
}

function jsCallback(f: any, ctx: JCtx): void {
  if (typeof f !== 'function' || (!ctx.fns.has(f) && f !== parseInt && f !== parseFloat && f !== J_GLOBALS.Number && f !== J_GLOBALS.String && f !== J_GLOBALS.Boolean)) no('callback')
}
/** A host function passed as a callback, called the way the host's method would call it (item, index, array). */
function jsWrapCallback(f: any, ctx: JCtx): any {
  if (ctx.fns.has(f)) return f
  return (...a: any[]) => jsHostCall(f, a, ctx)
}

/** Sorts `a` in place by a stable merge sort; with `cmp`, every compared pair is checked for a consistent order. */
function jsSort(a: any[], cmp: any, ctx: JCtx): void {
  const und = a.filter(x => x === undefined)
  const vals = a.filter(x => x !== undefined)
  let compare: (x: any, y: any) => number
  if (cmp === undefined) {
    const text = vals.map(x => textOk(String(jsPrimForText(x, ctx))))
    const idx = vals.map((_, k) => k)
    const sorted = mergeSort(idx, (i, j) => (text[i]! < text[j]! ? -1 : text[i]! > text[j]! ? 1 : 0))
    const out = sorted.map(k => vals[k])
    a.length = 0
    a.push(...out, ...und)
    return
  }
  jsCallback(cmp, ctx)
  ctx.pure += 1
  try {
    compare = (x, y) => {
      const r = cmp(x, y)
      const back = cmp(y, x)
      if (typeof r !== 'number' || typeof back !== 'number' || Number.isNaN(r) || Number.isNaN(back)) no('comparator result')
      if (Math.sign(r) !== -Math.sign(back) && !(r === 0 && back === 0)) no('inconsistent comparator')
      return r
    }
    const out = mergeSort(vals, compare)
    // Transitivity over neighbours of the result (a consistent comparator orders them).
    for (let k = 0; k + 1 < out.length; k += 1) if (compare(out[k], out[k + 1]) > 0) no('inconsistent comparator')
    a.length = 0
    a.push(...out, ...und)
  } finally {
    ctx.pure -= 1
  }
}

function mergeSort<T>(a: readonly T[], cmp: (x: T, y: T) => number): T[] {
  if (a.length <= 1) return [...a]
  const mid = a.length >> 1
  const l = mergeSort(a.slice(0, mid), cmp)
  const r = mergeSort(a.slice(mid), cmp)
  const out: T[] = []
  let i = 0
  let j = 0
  while (i < l.length && j < r.length) out.push(cmp(r[j]!, l[i]!) < 0 ? r[j++]! : l[i++]!)
  return [...out, ...l.slice(i), ...r.slice(j)]
}

/** Text whose case or spaces the specification maps the same in every engine: ASCII, Hangul, digits and marks. */
function jsPlainText(s: string): void {
  if (/[^\x00-\x7f가-힣ㄱ-ㆎ]/.test(s)) no('text outside ASCII and Hangul')
}

function jsMethod(obj: any, name: string, args: any[], ctx: JCtx): any {
  if (obj === null || obj === undefined) fail('method of null')
  if (typeof obj === 'object' && obj.__ns !== undefined && !Array.isArray(obj)) return jsStatic(obj.__ns, name, args, ctx)
  if (typeof obj === 'function' && obj.__ns !== undefined) return jsStatic(obj.__ns, name, args, ctx)
  if (typeof obj === 'string') return jsStringMethod(obj, name, args, ctx)
  if (typeof obj === 'number') {
    if (name === 'toFixed') {
      const d = args[0] === undefined ? 0 : args[0]
      jsNum(d)
      if (!Number.isInteger(d) || d < 0 || d > 20 || Math.abs(obj) >= 1e21) no('toFixed range')
      return obj.toFixed(d)
    }
    if (name === 'toString' && args.length === 0) return String(obj)
    return no(`number method ${name}`)
  }
  if (typeof obj === 'boolean' && name === 'toString' && args.length === 0) return String(obj)
  if (Array.isArray(obj)) {
    if (!ctx.arrays.has(obj)) no('host array')
    // An element called (`fns[0]()`): the function stored at that index.
    if (/^(?:0|[1-9]\d*)$/.test(name)) {
      const f = Number(name) < obj.length ? obj[Number(name)] : undefined
      if (typeof f !== 'function') fail('calling a non-function')
      if (!ctx.fns.has(f)) return jsHostCall(f, args, ctx)
      return f(...args)
    }
    return jsArrayMethod(obj, name, args, ctx)
  }
  if (typeof obj === 'object' && ctx.objs.has(obj)) {
    if (Object.prototype.hasOwnProperty.call(obj, name)) {
      const f = obj[name]
      if (typeof f !== 'function') fail('calling a non-function')
      if (!ctx.fns.has(f)) return jsHostCall(f, args, ctx)
      return f(...args)
    }
    if (name === 'hasOwnProperty') return Object.prototype.hasOwnProperty.call(obj, jsKey(args[0]))
    return name in Object.prototype ? no(`object method ${name}`) : fail('calling undefined')
  }
  return no(`method ${name}`)
}

function jsStatic(ns: string, name: string, args: any[], ctx: JCtx): any {
  if (!J_NS[ns]?.has(name)) no(`static ${ns}.${name}`)
  if (ns === 'console') {
    if (args.length !== 1 && printArgs) {
      jsPrintMany(args, ctx)
      return undefined
    }
    if (args.length !== 1) throw new Refuse('print-value', 'print of several values')
    jsPrint(args[0], ctx)
    return undefined
  }
  if (ns === 'Math') {
    const nums = args.map(a => jsPrim(a, ctx))
    if (name === 'pow') return jsPow(Number(nums[0]), Number(nums[1]))
    if (name === 'PI') no('PI call')
    return (Math as any)[name](...nums)
  }
  if (ns === 'Number') {
    if (name === 'isInteger') return Number.isInteger(args[0])
    if (name === 'isNaN') return Number.isNaN(args[0])
    if (name === 'isFinite') return Number.isFinite(args[0])
    if (name === 'parseInt') return jsHostCall(parseInt, args, ctx)
    if (name === 'parseFloat') return jsHostCall(parseFloat, args, ctx)
  }
  if (ns === 'Object') {
    const o = args[0]
    if (name === 'assign') {
      if (!ctx.objs.has(o)) no('assign target')
      if (ctx.pure > 0) no('comparator writes')
      for (const src of args.slice(1)) {
        if (src === null || src === undefined) continue
        if (!ctx.objs.has(src) && !ctx.arrays.has(src)) no('assign source')
        Object.assign(o, src)
      }
      return o
    }
    if (typeof o === 'string') {
      if (name === 'keys') return jsArr(Object.keys(o), ctx)
      if (name === 'values') return jsArr(Object.values(o), ctx)
      return no('entries of a string')
    }
    if (!ctx.objs.has(o) && !ctx.arrays.has(o)) fail('Object.keys of this')
    if (name === 'keys') return jsArr(Object.keys(o), ctx)
    if (name === 'values') return jsArr(Object.values(o), ctx)
    if (name === 'entries') return jsArr(Object.entries(o).map(p => jsArr(p, ctx)), ctx)
  }
  if (ns === 'Array') {
    if (name === 'isArray') return Array.isArray(args[0])
    if (name === 'of') return jsArr([...args], ctx)
    if (name === 'from') {
      const src = args[0]
      let a: any[]
      if (typeof src === 'string') a = [...src]
      else if (Array.isArray(src)) a = [...src]
      else if (ctx.objs.has(src) && Object.keys(src).length === 1 && typeof src.length === 'number') {
        if (!Number.isInteger(src.length) || src.length < 0 || src.length > NEW_RUN_SIZE) fail('size')
        a = Array.from({ length: src.length }, () => undefined)
      } else return no('Array.from of this')
      if (args[1] !== undefined) {
        jsCallback(args[1], ctx)
        const f = jsWrapCallback(args[1], ctx)
        a = a.map((x, k) => f(x, k))
      }
      return jsArr(a, ctx)
    }
  }
  return no(`static ${ns}.${name}`)
}

function jsStringMethod(s: string, name: string, args: any[], ctx: JCtx): any {
  if (!J_STRING_METHODS.has(name)) no(`string method ${name}`)
  for (const a of args) if (typeof a === 'function' || (typeof a === 'object' && a !== null)) no('string method argument')
  if (name === 'toUpperCase' || name === 'toLowerCase') {
    jsPlainText(s)
    return (s as any)[name]()
  }
  if (name === 'trim' || name === 'trimStart' || name === 'trimEnd') {
    if (/[^\S \t\n\r]/.test(s)) no('unusual spaces')
    return (s as any)[name]()
  }
  if (name === 'repeat') {
    const n = args[0]
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) no('repeat count')
    if (s.length * n > NEW_RUN_SIZE) fail('size')
    return s.repeat(n)
  }
  if (name === 'padStart' || name === 'padEnd') {
    const n = args[0]
    if (typeof n !== 'number' || n > NEW_RUN_SIZE) no('pad size')
    return (s as any)[name](...args)
  }
  if (name === 'split') {
    if (args.length > 2) no('split arguments')
    if (args[0] === undefined) return jsArr([s], ctx)
    if (typeof args[0] !== 'string') no('split by a non-string')
    return jsArr(s.split(args[0], args[1]), ctx)
  }
  if (name === 'replace' || name === 'replaceAll') {
    if (typeof args[0] !== 'string' || typeof args[1] !== 'string') no('replace arguments')
    if (/\$/.test(args[1])) no('replace pattern')
    return textOk((s as any)[name](args[0], args[1]))
  }
  if (name === 'concat') return textOk(s.concat(...args.map(a => String(a))))
  return jsSize((s as any)[name](...args))
}

function jsArrayMethod(a: any[], name: string, args: any[], ctx: JCtx): any {
  if (!J_ARRAY_METHODS.has(name)) no(`array method ${name}`)
  if (J_MUTATING.has(name) && ctx.pure > 0) no('comparator writes')
  if (J_CALLBACK.has(name)) {
    jsCallback(args[0], ctx)
    if (args.length > (name === 'reduce' || name === 'reduceRight' ? 2 : 1)) no('callback this argument')
    if ((name === 'reduce' || name === 'reduceRight') && args.length < 2 && a.length === 0) fail('reduce of an empty array')
    const f = jsWrapCallback(args[0], ctx)
    const r = (a as any)[name](f, ...args.slice(1))
    return Array.isArray(r) ? jsArr(r, ctx) : r
  }
  switch (name) {
    case 'push':
    case 'unshift': {
      const r = (a as any)[name](...args)
      jsSize(a)
      return r
    }
    case 'sort':
      if (args.length > 1) no('sort arguments')
      jsSort(a, args[0], ctx)
      return a
    case 'join': {
      const sep = args[0] === undefined ? ',' : args[0]
      if (typeof sep !== 'string') no('join separator')
      return textOk(a.map(x => (x === null || x === undefined ? '' : String(jsPrimForText(x, ctx)))).join(sep))
    }
    case 'toString':
      return textOk(a.map(x => (x === null || x === undefined ? '' : String(jsPrimForText(x, ctx)))).join(','))
    case 'fill': {
      return jsSize((a as any).fill(...args))
    }
    case 'flat': {
      const d = args[0] === undefined ? 1 : args[0]
      if (typeof d !== 'number' || d > 10) no('flat depth')
      return jsArr(a.flat(d), ctx)
    }
    case 'concat':
      for (const x of args) if (typeof x === 'object' && x !== null && !Array.isArray(x) && !ctx.objs.has(x)) no('concat argument')
      return jsArr(a.concat(...args), ctx)
    case 'splice':
    case 'slice': {
      const r = (a as any)[name](...args)
      return jsArr(r, ctx)
    }
  }
  const r = (a as any)[name](...args)
  return Array.isArray(r) ? jsArr(r, ctx) : r
}

// ═════════════════════════════════════════ Python ═════════════════════════════════════════

type PTok = { t: 'num' | 'str' | 'fstr' | 'name' | 'op' | 'nl' | 'indent' | 'dedent' | 'eof'; v: any; isFloat?: boolean }

const P_OPS = ['**=', '//=', '>>=', '<<=', '->', '**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', ':=',
  '(', ')', '[', ']', '{', '}', ',', ':', '.', ';', '+', '-', '*', '/', '%', '<', '>', '=', '&', '|', '^', '~', '@']

function pyEscape(src: string, i: number): [string, number] {
  const c = src[i]
  const simple: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v', '0': '\0' }
  if (c === undefined) no('escape')
  if (c === '0' && /[0-7]/.test(src[i + 1] ?? '')) no('octal escape')
  if (c! in simple) return [simple[c!]!, i + 1]
  if (c === 'x') {
    const h = src.slice(i + 1, i + 3)
    if (!/^[0-9a-fA-F]{2}$/.test(h)) no('escape')
    return [String.fromCharCode(parseInt(h, 16)), i + 3]
  }
  if (c === 'u') {
    const h = src.slice(i + 1, i + 5)
    if (!/^[0-9a-fA-F]{4}$/.test(h)) no('escape')
    return [String.fromCharCode(parseInt(h, 16)), i + 5]
  }
  if (c === '\n') return ['', i + 1]
  // An unknown escape keeps its backslash in Python.
  return ['\\' + c, i + 1]
}

function pyTokens(src: string): PTok[] {
  const toks: PTok[] = []
  const indents = [0]
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  let depth = 0
  let li = 0
  while (li < lines.length) {
    const line = lines[li]!
    li += 1
    if (depth === 0) {
      if (/^\s*(#.*)?$/.test(line)) continue
      if (/\t/.test(line.slice(0, line.length - line.trimStart().length))) no('tab indent')
      const ind = line.length - line.trimStart().length
      if (ind > indents.at(-1)!) {
        indents.push(ind)
        toks.push({ t: 'indent', v: null })
      } else {
        while (ind < indents.at(-1)!) {
          indents.pop()
          toks.push({ t: 'dedent', v: null })
        }
        if (ind !== indents.at(-1)) no('indent')
      }
    }
    let i = 0
    while (i < line.length) {
      const c = line[i]!
      if (c === ' ' || c === '\t') {
        i += 1
        continue
      }
      if (c === '#') break
      if (c === '\\' && i === line.length - 1) no('line continuation')
      const pre = /^([fFrRbBuU]{0,2})(['"])/.exec(line.slice(i))
      if (pre && (pre[1] === '' || /^[a-zA-Z]+$/.test(pre[1]!))) {
        const prefix = pre[1]!.toLowerCase()
        if (prefix !== '' && prefix !== 'f') no(`string prefix ${prefix}`)
        const q = pre[2]!
        let j = i + pre[1]!.length
        if (line.startsWith(q.repeat(3), j)) no('triple-quoted string')
        j += 1
        let s = ''
        let raw = ''
        while (j < line.length && line[j] !== q) {
          if (line[j] === '\\') {
            if (prefix === 'f') {
              raw += line.slice(j, j + 2)
              j += 2
              continue
            }
            const [e, k] = pyEscape(line, j + 1)
            s += e
            j = k
          } else {
            if (prefix === 'f') raw += line[j]
            else s += line[j]
            j += 1
          }
        }
        if (j >= line.length) no('string')
        j += 1
        if (prefix === 'f') toks.push({ t: 'fstr', v: pyFString(raw) })
        else toks.push({ t: 'str', v: textOk(s) })
        i = j
        continue
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(line[i + 1] ?? ''))) {
        const m = /^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/.exec(line.slice(i))!
        const rest = line[i + m[0].length] ?? ''
        if (/[\w]/.test(rest)) no('number')
        const text = m[0]
        if (/^0[0-9]/.test(text) && !/^0+$/.test(text) && !/[.eE]/.test(text)) no('leading zero')
        const isFloat = /[.eE]/.test(text) && !/^0[xXbBoO]/.test(text)
        if (isFloat) toks.push({ t: 'num', v: Number(text), isFloat: true })
        else toks.push({ t: 'num', v: BigInt(text) })
        i += text.length
        continue
      }
      if (/[A-Za-z_]/.test(c)) {
        const m = /^[A-Za-z_]\w*/.exec(line.slice(i))!
        if (/[^\x00-\x7f]/.test(line[i + m[0].length] ?? '')) no('name')
        toks.push({ t: 'name', v: m[0] })
        i += m[0].length
        continue
      }
      const op = P_OPS.find(o => line.startsWith(o, i))
      if (!op) no(`sign ${c}`)
      if (op === '(' || op === '[' || op === '{') depth += 1
      if (op === ')' || op === ']' || op === '}') depth -= 1
      if (depth < 0) no('brackets')
      toks.push({ t: 'op', v: op })
      i += op!.length
    }
    if (depth === 0) toks.push({ t: 'nl', v: null })
  }
  if (depth !== 0) no('brackets')
  while (indents.length > 1) {
    indents.pop()
    toks.push({ t: 'dedent', v: null })
  }
  toks.push({ t: 'eof', v: null })
  return toks
}

/** An f-string's pieces: text, and expressions with their conversion and format spec. */
function pyFString(raw: string): any[] {
  const parts: any[] = []
  let s = ''
  let i = 0
  while (i < raw.length) {
    const c = raw[i]!
    if (c === '\\') {
      const [e, k] = pyEscape(raw, i + 1)
      s += e
      i = k
      continue
    }
    if (c === '{' && raw[i + 1] === '{') {
      s += '{'
      i += 2
      continue
    }
    if (c === '}' && raw[i + 1] === '}') {
      s += '}'
      i += 2
      continue
    }
    if (c === '}') no('f-string brace')
    if (c === '{') {
      if (s) parts.push(textOk(s))
      s = ''
      let depth = 0
      let j = i + 1
      let quote = ''
      for (; j < raw.length; j += 1) {
        const d = raw[j]!
        if (quote) {
          if (d === quote) quote = ''
          continue
        }
        if (d === '"' || d === "'") quote = d
        else if (d === '(' || d === '[' || d === '{') depth += 1
        else if (d === ')' || d === ']' || d === '}') {
          if (depth === 0) break
          depth -= 1
        } else if ((d === ':' || d === '!') && depth === 0 && raw[j + 1] !== '=') break
      }
      const exprSrc = raw.slice(i + 1, j)
      // f"{expr=}" (Python 3.8): the expression's text as written, '=' and the spaces after it included, then the value,
      // by repr unless a conversion or a format spec is given.
      const isSelf = /=\s*$/.test(exprSrc) && !/[=!<>]=\s*$/.test(exprSrc)
      let conv = ''
      let spec = ''
      if (raw[j] === '!') {
        conv = raw[j + 1] ?? ''
        if (conv !== 'r' && conv !== 's') no('f-string conversion')
        j += 2
      }
      if (raw[j] === ':') {
        const end = raw.indexOf('}', j)
        if (end === -1) no('f-string')
        spec = raw.slice(j + 1, end)
        if (spec.includes('{')) no('nested spec')
        j = end
      }
      if (raw[j] !== '}') no('f-string')
      if (exprSrc.includes('\\')) no('backslash in f-string expression')
      if (isSelf) {
        parts.push(textOk(exprSrc))
        parts.push({ expr: pyParseExprText(exprSrc.replace(/=\s*$/, '')), conv: conv || (spec ? '' : 'r'), spec })
      } else parts.push({ expr: pyParseExprText(exprSrc), conv, spec })
      i = j + 1
      continue
    }
    s += c
    i += 1
  }
  if (s) parts.push(textOk(s))
  return parts
}

const P_KEYWORDS = new Set(['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'])
const P_REFUSED = new Set(['assert', 'async', 'await', 'class', 'except', 'finally', 'from', 'import', 'raise', 'try', 'with', 'yield'])

class PParser {
  i = 0
  constructor(readonly toks: PTok[]) {}
  get p(): { t: string; v: any } {
    return this.toks[this.i]!
  }
  kind(): string {
    return this.toks[this.i]!.t
  }
  is(v: string): boolean {
    const t = this.p
    return (t.t === 'op' || t.t === 'name') && t.v === v
  }
  eat(v: string): boolean {
    if (!this.is(v)) return false
    this.i += 1
    return true
  }
  want(v: string): void {
    if (!this.eat(v)) no(`want ${v}`)
  }
  name(): string {
    const t = this.p
    if (t.t !== 'name' || P_KEYWORDS.has(t.v)) no(`name ${t.v}`)
    this.i += 1
    return t.v
  }
  program(): any[] {
    const body: any[] = []
    while (this.p.t !== 'eof') {
      if (this.p.t === 'nl') {
        this.i += 1
        continue
      }
      body.push(...this.statement())
    }
    return body
  }
  suite(): any[] {
    if (this.p.t !== 'nl') {
      const body = this.simpleLine()
      return body
    }
    this.i += 1
    if (this.kind() !== 'indent') no('indented block')
    this.i += 1
    const body: any[] = []
    while (this.kind() !== 'dedent') {
      if (this.kind() === 'eof') no('block')
      if (this.p.t === 'nl') {
        this.i += 1
        continue
      }
      body.push(...this.statement())
    }
    this.i += 1
    return body
  }
  statement(): any[] {
    const t = this.p
    if (t.t === 'indent') no('unexpected indent')
    if (t.t === 'name' && P_REFUSED.has(t.v)) no(`keyword ${t.v}`)
    if (t.t === 'op' && t.v === '@') no('decorator')
    if (this.eat('if')) {
      const test = this.test()
      this.want(':')
      const then = this.suite()
      const node: any = { k: 'if', test, then, other: [] }
      let at = node
      for (;;) {
        if (this.eat('elif')) {
          const t2 = this.test()
          this.want(':')
          const n2: any = { k: 'if', test: t2, then: this.suite(), other: [] }
          at.other = [n2]
          at = n2
        } else if (this.eat('else')) {
          this.want(':')
          at.other = this.suite()
          break
        } else break
      }
      return [node]
    }
    if (this.eat('while')) {
      const test = this.test()
      this.want(':')
      const body = this.suite()
      const other = this.eat('else') ? (this.want(':'), this.suite()) : undefined
      return [{ k: 'while', test, body, other }]
    }
    if (this.eat('for')) {
      const target = this.targetList()
      this.want('in')
      const iter = this.testList()
      this.want(':')
      const body = this.suite()
      const other = this.eat('else') ? (this.want(':'), this.suite()) : undefined
      return [{ k: 'for', target, iter, body, other }]
    }
    if (this.eat('def')) {
      const name = this.name()
      const params = this.params(')')
      if (this.eat('->')) no('annotation')
      this.want(':')
      const body = this.suite()
      return [{ k: 'def', name, params, body }]
    }
    return this.simpleLine()
  }
  simpleLine(): any[] {
    const list = [this.simple()]
    while (this.eat(';')) {
      if (this.p.t === 'nl' || this.p.t === 'eof') break
      list.push(this.simple())
    }
    if (this.p.t !== 'nl' && this.p.t !== 'eof' && this.p.t !== 'dedent') no('statement end')
    if (this.p.t === 'nl') this.i += 1
    return list
  }
  simple(): any {
    const t = this.p
    if (t.t === 'name' && P_REFUSED.has(t.v)) no(`keyword ${t.v}`)
    if (this.eat('pass')) return { k: 'pass' }
    if (this.eat('break')) return { k: 'break' }
    if (this.eat('continue')) return { k: 'continue' }
    if (this.eat('return')) {
      if (this.p.t === 'nl' || this.p.t === 'eof' || this.is(';') || this.p.t === 'dedent') return { k: 'return' }
      return { k: 'return', arg: this.testList() }
    }
    if (this.eat('global')) {
      const names = [this.name()]
      while (this.eat(',')) names.push(this.name())
      return { k: 'global', names }
    }
    if (this.eat('nonlocal')) {
      const names = [this.name()]
      while (this.eat(',')) names.push(this.name())
      return { k: 'nonlocal', names }
    }
    if (this.eat('del')) {
      const targets = [this.test()]
      while (this.eat(',')) targets.push(this.test())
      for (const x of targets) if (x.k !== 'sub' && x.k !== 'name') no('del target')
      return { k: 'del', targets }
    }
    const first = this.testList(true)
    const ops = ['+=', '-=', '*=', '/=', '//=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>=']
    if (this.p.t === 'op' && ops.includes(this.p.v)) {
      const op = this.p.v.slice(0, -1)
      this.i += 1
      if (first.k !== 'name' && first.k !== 'sub' && first.k !== 'attr') no('augmented target')
      return { k: 'aug', op, target: first, value: this.testList() }
    }
    if (this.is(':')) no('annotation')
    if (this.is('=')) {
      const targets = [first]
      let value: any
      while (this.eat('=')) {
        value = this.testList(true)
        targets.push(value)
      }
      targets.pop()
      for (const x of targets) this.checkTarget(x)
      return { k: 'assign', targets, value }
    }
    return { k: 'expr', e: first }
  }
  checkTarget(x: any): void {
    if (x.k === 'name' || x.k === 'sub' || x.k === 'attr') return
    if ((x.k === 'tuple' || x.k === 'list') && x.items.filter((y: any) => y.k === 'star').length > 1) no('two starred targets')
    if (x.k === 'star' && x.e.k === 'name') return
    if ((x.k === 'tuple' || x.k === 'list') && !x.paren2) {
      x.items.forEach((y: any) => this.checkTarget(y))
      return
    }
    if (x.k === 'tuple' || x.k === 'list') {
      x.items.forEach((y: any) => this.checkTarget(y))
      return
    }
    no('assignment target')
  }
  targetList(): any {
    const first = this.orExpr()
    if (!this.is(',')) {
      this.checkTarget(first)
      return first
    }
    const items = [first]
    while (this.eat(',')) {
      if (this.is('in')) break
      items.push(this.orExpr())
    }
    const t = { k: 'tuple', items }
    this.checkTarget(t)
    return t
  }
  params(close: string): any[] {
    if (close === ')') this.want('(')
    const params: any[] = []
    let seenDefault = false
    while (!this.is(close)) {
      if (this.is('*') || this.is('**') || this.is('/')) no('star parameter')
      const name = this.name()
      if (this.is(':') && close === ')') no('annotation')
      let def: any
      if (this.eat('=')) {
        def = this.test()
        seenDefault = true
      } else if (seenDefault) no('default before plain')
      params.push({ name, def })
      if (!this.is(close)) this.want(',')
    }
    this.want(close)
    if (new Set(params.map(p => p.name)).size !== params.length) no('duplicate parameter')
    return params
  }
  testList(isStmt = false): any {
    const first = this.test(isStmt)
    if (!this.is(',')) return first
    const items = [first]
    while (this.eat(',')) {
      if (this.p.t === 'nl' || this.p.t === 'eof' || this.is('=') || this.is(')') || this.is(':') || this.is(';') || this.p.t === 'dedent') break
      if (this.p.t === 'op' && ['+=', '-=', '*=', '/=', '//=', '%=', '**='].includes(this.p.v)) break
      items.push(this.test(isStmt))
    }
    return { k: 'tuple', items }
  }
  test(_isStmt = false): any {
    if (this.eat('lambda')) {
      const params = this.params(':')
      return { k: 'lambda', params, body: this.test() }
    }
    const e = this.orTest()
    if (this.eat('if')) {
      const test = this.orTest()
      this.want('else')
      return { k: 'ifexp', test, then: e, other: this.test() }
    }
    if (this.is(':=')) no('walrus')
    return e
  }
  orTest(): any {
    let l = this.andTest()
    while (this.eat('or')) l = { k: 'bool', op: 'or', l, r: this.andTest() }
    return l
  }
  andTest(): any {
    let l = this.notTest()
    while (this.eat('and')) l = { k: 'bool', op: 'and', l, r: this.notTest() }
    return l
  }
  notTest(): any {
    if (this.eat('not')) return { k: 'not', arg: this.notTest() }
    return this.comparison()
  }
  comparison(): any {
    const first = this.orExpr()
    const ops: string[] = []
    const rest: any[] = []
    for (;;) {
      const t = this.p
      let op: string | undefined
      if (t.t === 'op' && ['<', '>', '==', '>=', '<=', '!='].includes(t.v)) op = t.v
      else if (this.is('in')) op = 'in'
      else if (this.is('not') && this.toks[this.i + 1]?.v === 'in') {
        this.i += 1
        op = 'not in'
      } else if (this.is('is')) {
        if (this.toks[this.i + 1]?.v === 'not') {
          this.i += 1
          op = 'is not'
        } else op = 'is'
      }
      if (op === undefined) break
      this.i += 1
      ops.push(op)
      rest.push(this.orExpr())
    }
    return ops.length === 0 ? first : { k: 'cmp', first, ops, rest }
  }
  orExpr(): any {
    return this.bin(0)
  }
  bin(level: number): any {
    const LEVELS = [['|'], ['^'], ['&'], ['<<', '>>'], ['+', '-'], ['*', '/', '//', '%', '@']]
    if (level >= LEVELS.length) return this.factor()
    let l = this.bin(level + 1)
    for (;;) {
      const t = this.p
      if (t.t !== 'op' || !LEVELS[level]!.includes(t.v)) break
      if (t.v === '@') no('@')
      this.i += 1
      l = { k: 'bin', op: t.v, l, r: this.bin(level + 1) }
    }
    return l
  }
  factor(): any {
    const t = this.p
    if (t.t === 'op' && (t.v === '-' || t.v === '+' || t.v === '~')) {
      this.i += 1
      return { k: 'unary', op: t.v, arg: this.factor() }
    }
    return this.power()
  }
  power(): any {
    const base = this.postfix()
    if (this.eat('**')) return { k: 'bin', op: '**', l: base, r: this.factor() }
    return base
  }
  postfix(): any {
    let e = this.atom()
    for (;;) {
      if (this.eat('.')) {
        e = { k: 'attr', obj: e, name: this.anyName() }
      } else if (this.is('(')) {
        e = { k: 'call', fn: e, ...this.callArgs() }
      } else if (this.eat('[')) {
        e = { k: 'sub', obj: e, index: this.subscript() }
        this.want(']')
      } else break
    }
    return e
  }
  anyName(): string {
    const t = this.p
    if (t.t !== 'name') no('attribute')
    this.i += 1
    return t.v
  }
  subscript(): any {
    const part = (): any => (this.is(':') || this.is(']') ? undefined : this.test())
    const a = part()
    if (!this.is(':')) {
      if (this.is(',')) no('tuple index')
      return a
    }
    this.i += 1
    const b = part()
    let c: any
    if (this.eat(':')) c = part()
    return { k: 'slice', a, b, c }
  }
  callArgs(): any {
    this.want('(')
    const args: any[] = []
    const kw: any[] = []
    while (!this.eat(')')) {
      if (this.is('*') || this.is('**')) no('star argument')
      if (this.p.t === 'name' && this.toks[this.i + 1]?.v === '=' && this.toks[this.i + 1]?.t === 'op') {
        const name = this.name()
        this.want('=')
        kw.push({ name, value: this.test() })
      } else {
        if (kw.length > 0) no('positional after keyword')
        const e = this.test()
        if (this.is('for')) {
          args.push(this.comp('gen', e))
        } else args.push(e)
      }
      if (!this.is(')')) this.want(',')
    }
    return { args, kw }
  }
  comp(kind: string, elt: any, value?: any): any {
    const fors: any[] = []
    while (this.eat('for')) {
      const target = this.targetList()
      this.want('in')
      const iter = this.orTest()
      const ifs: any[] = []
      while (this.eat('if')) ifs.push(this.orTestNoCond())
      fors.push({ target, iter, ifs })
    }
    if (this.is('async')) no('async')
    return { k: 'comp', kind, elt, value, fors }
  }
  orTestNoCond(): any {
    return this.orTest()
  }
  atom(): any {
    const t = this.p
    // `*rest` in an unpacking target (`first, *rest = xs`); anywhere else it is refused when evaluated or checked.
    if (t.t === 'op' && t.v === '*' && this.toks[this.i + 1]?.t === 'name') {
      this.i += 1
      return { k: 'star', e: this.atom() }
    }
    if (t.t === 'num') {
      this.i += 1
      return { k: 'lit', v: t.v }
    }
    if (t.t === 'str' || t.t === 'fstr') {
      const parts: any[] = []
      while (this.p.t === 'str' || this.p.t === 'fstr') {
        if (this.p.t === 'str') parts.push(this.p.v)
        else parts.push(...this.p.v)
        this.i += 1
      }
      if (parts.every(x => typeof x === 'string')) return { k: 'lit', v: textOk(parts.join('')) }
      return { k: 'fstr', parts }
    }
    if (t.t === 'name') {
      if (t.v === 'True' || t.v === 'False') {
        this.i += 1
        return { k: 'lit', v: t.v === 'True' }
      }
      if (t.v === 'None') {
        this.i += 1
        return { k: 'lit', v: PNONE }
      }
      return { k: 'name', name: this.name() }
    }
    if (this.eat('(')) {
      if (this.eat(')')) return { k: 'tuple', items: [], paren: true }
      const first = this.test()
      if (this.is('for')) {
        const c = this.comp('gen', first)
        this.want(')')
        return c
      }
      if (this.eat(')')) return { ...first, paren: true }
      const items = [first]
      while (this.eat(',')) {
        if (this.is(')')) break
        items.push(this.test())
      }
      this.want(')')
      return { k: 'tuple', items, paren: true }
    }
    if (this.eat('[')) {
      if (this.eat(']')) return { k: 'list', items: [] }
      const first = this.test()
      if (this.is('for')) {
        const c = this.comp('list', first)
        this.want(']')
        return c
      }
      const items = [first]
      while (this.eat(',')) {
        if (this.is(']')) break
        items.push(this.test())
      }
      this.want(']')
      return { k: 'list', items }
    }
    if (this.eat('{')) {
      if (this.eat('}')) return { k: 'dict', keys: [], values: [] }
      if (this.is('**')) no('dict unpacking')
      const k1 = this.test()
      if (!this.eat(':')) no('set')
      const v1 = this.test()
      if (this.is('for')) {
        const c = this.comp('dict', k1, v1)
        this.want('}')
        return c
      }
      const keys = [k1]
      const values = [v1]
      while (this.eat(',')) {
        if (this.is('}')) break
        if (this.is('**')) no('dict unpacking')
        keys.push(this.test())
        this.want(':')
        values.push(this.test())
      }
      this.want('}')
      return { k: 'dict', keys, values }
    }
    return no(`token ${t.v}`)
  }
}

function pyParseExprText(src: string): any {
  if (/\n/.test(src)) no('f-string newline')
  const toks = pyTokens(src.trim()).filter(t => t.t !== 'nl')
  const p = new PParser(toks)
  const e = p.testList()
  if (p.p.t !== 'eof') no('f-string expression')
  return e
}

/** The program's statements (newParse for Python). */
export function pyParse(src: string): any[] {
  return new PParser(pyTokens(src)).program()
}

// ── Python values ──

const PNONE = { none: true } as const
class PList {
  constructor(public items: any[]) {}
}
class PTuple {
  constructor(readonly items: any[]) {}
}
class PDict {
  map = new Map<string, [any, any]>()
}
class PRange {
  constructor(
    readonly start: bigint,
    readonly stop: bigint,
    readonly step: bigint,
  ) {}
  get length(): number {
    const { start, stop, step } = this
    if (step > 0n) return stop > start ? Number((stop - start + step - 1n) / step) : 0
    return start > stop ? Number((start - stop - step - 1n) / -step) : 0
  }
  at(k: number): bigint {
    return this.start + this.step * BigInt(k)
  }
}
class PFunc {
  constructor(
    readonly name: string,
    readonly params: any[],
    readonly defaults: any[],
    readonly body: any,
    readonly closure: PScope,
    readonly isLambda: boolean,
    readonly locals: Set<string>,
    readonly globals: Set<string>,
    readonly nonlocals: Set<string>,
  ) {}
}
class PBuiltin {
  constructor(
    readonly name: string,
    readonly self?: any,
  ) {}
}
class PType {
  constructor(readonly name: string) {}
}
class PIter {
  constructor(readonly next: () => { done: boolean; v?: any }) {}
}
class PView {
  constructor(
    readonly dict: PDict,
    readonly kind: 'keys' | 'values' | 'items',
  ) {}
}

class PScope {
  vars = new Map<string, any>()
  constructor(
    readonly parent: PScope | undefined,
    readonly fn: PFunc | undefined,
    readonly isComp = false,
  ) {}
}

type PCtx = { steps: number; depth: number; out: string[]; global: PScope }
class PReturn {
  constructor(readonly v: any) {}
}
const PBREAK = { k: 'break' }
const PCONTINUE = { k: 'continue' }
const UNBOUND = Symbol('unbound')

const P_BUILTINS = new Set(['print', 'len', 'range', 'str', 'int', 'float', 'bool', 'list', 'tuple', 'dict', 'abs', 'round', 'min', 'max', 'sum', 'sorted', 'reversed', 'enumerate', 'zip', 'any', 'all', 'map', 'filter', 'chr', 'ord', 'divmod', 'pow', 'isinstance'])
const P_TYPES = new Set(['int', 'float', 'str', 'bool', 'list', 'tuple', 'dict'])

function pyIsInt(v: any): boolean {
  return typeof v === 'bigint' || typeof v === 'boolean'
}
function pyIsNum(v: any): boolean {
  return typeof v === 'bigint' || typeof v === 'boolean' || typeof v === 'number'
}
function pyBig(v: any): bigint {
  return typeof v === 'boolean' ? (v ? 1n : 0n) : (v as bigint)
}
const BIG_LIMIT = 10n ** 30n
function pyIntOk(v: bigint): bigint {
  if (v > BIG_LIMIT || v < -BIG_LIMIT) no('int too big')
  return v
}
function pyToFloat(v: any): number {
  if (typeof v === 'number') return v
  const b = pyBig(v)
  if (b > 2n ** 53n || b < -(2n ** 53n)) no('int to float past exact')
  return Number(b)
}
function pyTypeName(v: any): string {
  if (typeof v === 'boolean') return 'bool'
  if (typeof v === 'bigint') return 'int'
  if (typeof v === 'number') return 'float'
  if (typeof v === 'string') return 'str'
  if (v === PNONE) return 'NoneType'
  if (v instanceof PList) return 'list'
  if (v instanceof PTuple) return 'tuple'
  if (v instanceof PDict) return 'dict'
  if (v instanceof PRange) return 'range'
  return 'object'
}

/** Python's repr of a float (shortest round-trip digits, its own exponent rule). */
export function pyFloatRepr(x: number): string {
  if (Number.isNaN(x)) return 'nan'
  if (!Number.isFinite(x)) return x > 0 ? 'inf' : '-inf'
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

/** |x| rounded half-even at n fractional digits as decimal text, from its exact expansion; undefined at a tie when ties refuse. */
function pyHalfEven(x: number, n: number, refuseTie: boolean): string {
  if (!Number.isFinite(x) || Math.abs(x) >= 1e21 || n > 20 || n < 0) no('rounding range')
  const full = Math.abs(x).toFixed(100)
  const [ip, fp] = full.split('.') as [string, string]
  const tail = fp.slice(n)
  if (/[1-9]/.test(tail.slice(80))) no('rounding expansion')
  const isTie = tail[0] === '5' && /^0*$/.test(tail.slice(1))
  if (!isTie) return Math.abs(x).toFixed(n)
  if (refuseTie) no('rounding tie')
  const kept = n === 0 ? ip : `${ip}.${fp.slice(0, n)}`
  const last = Number(kept.replace('.', '').at(-1))
  if (last % 2 === 0) return kept
  return Math.abs(x).toFixed(n)
}

function pyStrRepr(s: string): string {
  if (/[^\x20-\x7e가-힣ㄱ-ㆎ\n\t\r\\]/.test(s)) no('repr of unusual text')
  const q = s.includes("'") && !s.includes('"') ? '"' : "'"
  let out = q
  for (const ch of s) {
    if (ch === '\\') out += '\\\\'
    else if (ch === q) out += '\\' + q
    else if (ch === '\n') out += '\\n'
    else if (ch === '\t') out += '\\t'
    else if (ch === '\r') out += '\\r'
    else out += ch
  }
  return out + q
}

function pyRepr(v: any, depth = 0): string {
  if (depth > 20) no('repr depth')
  if (typeof v === 'string') return pyStrRepr(v)
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'number') return pyFloatRepr(v)
  if (v === PNONE) return 'None'
  if (v instanceof PList) return textOk('[' + v.items.map(x => (x === v ? no('self') : pyRepr(x, depth + 1))).join(', ') + ']')
  if (v instanceof PTuple) return textOk('(' + v.items.map(x => pyRepr(x, depth + 1)).join(', ') + (v.items.length === 1 ? ',' : '') + ')')
  if (v instanceof PDict) return textOk('{' + [...v.map.values()].map(([k, x]) => `${pyRepr(k, depth + 1)}: ${pyRepr(x, depth + 1)}`).join(', ') + '}')
  if (v instanceof PRange) return `range(${v.start}, ${v.stop}${v.step !== 1n ? `, ${v.step}` : ''})`
  return no('repr of this')
}
function pyStr(v: any): string {
  return typeof v === 'string' ? v : pyRepr(v)
}

function pyHashKey(v: any): string {
  if (typeof v === 'boolean') return v ? 'n:1' : 'n:0'
  if (typeof v === 'bigint') return 'n:' + v.toString()
  if (typeof v === 'number') {
    if (Number.isNaN(v)) no('nan key')
    if (Number.isInteger(v) && Math.abs(v) < 2 ** 53) return 'n:' + BigInt(v).toString()
    return 'f:' + String(v)
  }
  if (typeof v === 'string') return 's:' + v
  if (v === PNONE) return 'N'
  if (v instanceof PTuple) return 't:(' + v.items.map(pyHashKey).join(',') + ')'
  return fail('unhashable')
}

function pyTruth(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'bigint') return v !== 0n
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v.length > 0
  if (v === PNONE) return false
  if (v instanceof PList || v instanceof PTuple) return v.items.length > 0
  if (v instanceof PDict) return v.map.size > 0
  if (v instanceof PRange) return v.length > 0
  if (v instanceof PFunc || v instanceof PBuiltin || v instanceof PType) return true
  return no('truth of this')
}

function pyEq(a: any, b: any, depth = 0): boolean {
  if (depth > 20) no('compare depth')
  if (pyIsNum(a) && pyIsNum(b)) {
    if (typeof a === 'number' || typeof b === 'number') return pyToFloat(a) === pyToFloat(b)
    return pyBig(a) === pyBig(b)
  }
  if (typeof a === 'string' || typeof b === 'string') return a === b
  if (a === PNONE || b === PNONE) return a === b
  if (a instanceof PList && b instanceof PList) return a.items.length === b.items.length && a.items.every((x, k) => pyEq(x, b.items[k], depth + 1))
  if (a instanceof PTuple && b instanceof PTuple) return a.items.length === b.items.length && a.items.every((x, k) => pyEq(x, b.items[k], depth + 1))
  if (a instanceof PDict && b instanceof PDict) {
    if (a.map.size !== b.map.size) return false
    for (const [k, [, v]] of a.map) {
      const o = b.map.get(k)
      if (!o || !pyEq(v, o[1], depth + 1)) return false
    }
    return true
  }
  if (a instanceof PRange && b instanceof PRange) no('range equality')
  if ((a instanceof PList || a instanceof PTuple || a instanceof PDict) && (b instanceof PList || b instanceof PTuple || b instanceof PDict)) return false
  if (a instanceof PFunc || b instanceof PFunc || a instanceof PBuiltin || b instanceof PBuiltin || a instanceof PType || b instanceof PType) return a === b
  if (pyIsNum(a) !== pyIsNum(b)) return false
  return no('equality of these')
}

/** a < b (-1), = (0), > (1) for an order comparison; TypeError (refused) across kinds. */
function pyCmp(a: any, b: any, depth = 0): number {
  if (depth > 20) no('compare depth')
  if (pyIsNum(a) && pyIsNum(b)) {
    if (typeof a === 'number' || typeof b === 'number') {
      const x = pyToFloat(a)
      const y = pyToFloat(b)
      if (Number.isNaN(x) || Number.isNaN(y)) no('nan order')
      return x < y ? -1 : x > y ? 1 : 0
    }
    const x = pyBig(a)
    const y = pyBig(b)
    return x < y ? -1 : x > y ? 1 : 0
  }
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0
  if ((a instanceof PList && b instanceof PList) || (a instanceof PTuple && b instanceof PTuple)) {
    const n = Math.min(a.items.length, b.items.length)
    for (let k = 0; k < n; k += 1) {
      if (!pyEq(a.items[k], b.items[k], depth + 1)) return pyCmp(a.items[k], b.items[k], depth + 1)
    }
    return a.items.length < b.items.length ? -1 : a.items.length > b.items.length ? 1 : 0
  }
  return fail('order across kinds')
}

function pyFloorDivFloat(x: number, y: number): [number, number] {
  if (y === 0) fail('ZeroDivisionError')
  let mod = x % y
  let div = (x - mod) / y
  if (mod) {
    if (y < 0 !== mod < 0) {
      mod += y
      div -= 1.0
    }
  } else mod = y < 0 ? -0 : 0
  let floordiv: number
  if (div) {
    floordiv = Math.floor(div)
    if (div - floordiv > 0.5) floordiv += 1.0
  } else floordiv = x / y < 0 || Object.is(x / y, -0) ? -0 : 0
  return [floordiv, mod]
}
function pyFloorDivInt(x: bigint, y: bigint): [bigint, bigint] {
  if (y === 0n) fail('ZeroDivisionError')
  let q = x / y
  let r = x % y
  if (r !== 0n && r < 0n !== y < 0n) {
    q -= 1n
    r += y
  }
  return [q, r]
}

function pyFloatOk(x: number): number {
  if (!Number.isFinite(x)) fail('float overflow')
  return x
}

function pyBinary(op: string, a: any, b: any): any {
  if (pyIsNum(a) && pyIsNum(b)) {
    const isInt = pyIsInt(a) && pyIsInt(b)
    if (op === '/') {
      const y = pyToFloat(b)
      if (y === 0) fail('ZeroDivisionError')
      return pyFloatOk(pyToFloat(a) / y)
    }
    if (isInt) {
      const x = pyBig(a)
      const y = pyBig(b)
      switch (op) {
        case '+':
          return pyIntOk(x + y)
        case '-':
          return pyIntOk(x - y)
        case '*':
          return pyIntOk(x * y)
        case '//':
          return pyFloorDivInt(x, y)[0]
        case '%':
          return pyFloorDivInt(x, y)[1]
        case '**':
          if (y < 0n) {
            if (x === 0n) fail('ZeroDivisionError')
            const r = 1 / pyToFloat(pyIntOk(x ** -y))
            if (x ** -y > 2n ** 53n) no('negative power past exact')
            return r
          }
          if (y > 200n) no('power too big')
          return pyIntOk(x ** y)
        case '&':
          return x & y
        case '|':
          return x | y
        case '^':
          return x ^ y
        case '<<':
          if (y < 0n) fail('negative shift')
          if (y > 100n) no('shift')
          return pyIntOk(x << y)
        case '>>':
          if (y < 0n) fail('negative shift')
          return x >> y
      }
      return no(`int operator ${op}`)
    }
    const x = pyToFloat(a)
    const y = pyToFloat(b)
    switch (op) {
      case '+':
        return pyFloatOk(x + y)
      case '-':
        return pyFloatOk(x - y)
      case '*':
        return pyFloatOk(x * y)
      case '//':
        return pyFloorDivFloat(x, y)[0]
      case '%':
        return pyFloorDivFloat(x, y)[1]
      case '**': {
        if (Number.isInteger(x) && Number.isInteger(y) && y >= 0 && y <= 64) {
          let r = 1
          for (let k = 0; k < y; k += 1) {
            r *= x
            if (!Number.isSafeInteger(r)) no('float power past exact')
          }
          return r
        }
        if (y === 0.5 && x >= 0) return Math.sqrt(x)
        return no('float power inexact')
      }
    }
    return no(`float operator ${op}`)
  }
  if (op === '+') {
    if (typeof a === 'string' && typeof b === 'string') return textOk(a + b)
    if (a instanceof PList && b instanceof PList) return pySized(new PList([...a.items, ...b.items]))
    if (a instanceof PTuple && b instanceof PTuple) return pySized(new PTuple([...a.items, ...b.items]))
    return fail('TypeError +')
  }
  if (op === '*') {
    const [seq, n] = pyIsInt(a) ? [b, a] : [a, b]
    if (!pyIsInt(n)) return fail('TypeError *')
    const k = Number(pyBig(n) < 0n ? 0n : pyBig(n))
    if (typeof seq === 'string') {
      if (seq.length * k > NEW_RUN_SIZE) fail('size')
      return seq.repeat(k)
    }
    if (seq instanceof PList || seq instanceof PTuple) {
      if (seq.items.length * k > NEW_RUN_SIZE) fail('size')
      const items: any[] = []
      for (let r = 0; r < k; r += 1) items.push(...seq.items)
      return seq instanceof PList ? new PList(items) : new PTuple(items)
    }
    return fail('TypeError *')
  }
  if (op === '%' && typeof a === 'string') return no('%-format')
  return fail(`TypeError ${op}`)
}

function pySized<T extends PList | PTuple>(v: T): T {
  if (v.items.length > NEW_RUN_SIZE) fail('size')
  return v
}

/** The items of an iterable, read once (a list by index, live: a removal while iterating skips, as in Python). */
function pyIterate(v: any, ctx: PCtx, each: (x: any) => boolean | void): void {
  if (v instanceof PList) {
    for (let k = 0; k < v.items.length; k += 1) {
      pyStep(ctx)
      if (each(v.items[k]) === true) return
    }
    return
  }
  if (v instanceof PTuple) {
    for (const x of v.items) {
      pyStep(ctx)
      if (each(x) === true) return
    }
    return
  }
  if (typeof v === 'string') {
    for (const ch of v) {
      pyStep(ctx)
      if (each(ch) === true) return
    }
    return
  }
  if (v instanceof PRange) {
    const n = v.length
    for (let k = 0; k < n; k += 1) {
      pyStep(ctx)
      if (each(v.at(k)) === true) return
    }
    return
  }
  if (v instanceof PDict || v instanceof PView) {
    const d = v instanceof PDict ? v : v.dict
    const kind = v instanceof PDict ? 'keys' : v.kind
    const size = d.map.size
    const entries = [...d.map.values()]
    for (const [k, x] of entries) {
      pyStep(ctx)
      if (d.map.size !== size) fail('dict changed size during iteration')
      if (each(kind === 'keys' ? k : kind === 'values' ? x : new PTuple([k, x])) === true) return
    }
    if (d.map.size !== size) fail('dict changed size during iteration')
    return
  }
  if (v instanceof PIter) {
    for (;;) {
      pyStep(ctx)
      const r = v.next()
      if (r.done) return
      if (each(r.v) === true) return
    }
  }
  fail('not iterable')
}
function pyItems(v: any, ctx: PCtx): any[] {
  const out: any[] = []
  pyIterate(v, ctx, x => {
    out.push(x)
    if (out.length > NEW_RUN_SIZE) fail('size')
  })
  return out
}
function pyIterOf(v: any, ctx: PCtx): PIter {
  if (v instanceof PIter) return v
  if (v instanceof PList) {
    let k = 0
    return new PIter(() => (k < v.items.length ? { done: false, v: v.items[k++] } : { done: true }))
  }
  const items = pyItems(v, ctx)
  let k = 0
  return new PIter(() => (k < items.length ? { done: false, v: items[k++] } : { done: true }))
}

function pyStep(ctx: PCtx): void {
  ctx.steps += 1
  if (ctx.steps > NEW_RUN_STEPS) fail('steps')
}

/** Names a function body binds (assignments, for targets, defs, augmented; not inside nested defs, lambdas or comprehensions). */
function pyBound(body: any[]): { locals: Set<string>; globals: Set<string>; nonlocals: Set<string> } {
  const locals = new Set<string>()
  const globals = new Set<string>()
  const nonlocals = new Set<string>()
  const target = (t: any): void => {
    if (t.k === 'name') locals.add(t.name)
    else if (t.k === 'tuple' || t.k === 'list') t.items.forEach(target)
  }
  const walk = (st: any): void => {
    switch (st.k) {
      case 'assign':
        st.targets.forEach(target)
        break
      case 'aug':
        target(st.target)
        break
      case 'for':
        target(st.target)
        st.body.forEach(walk)
        st.other?.forEach(walk)
        break
      case 'while':
        st.body.forEach(walk)
        st.other?.forEach(walk)
        break
      case 'if':
        st.then.forEach(walk)
        st.other.forEach(walk)
        break
      case 'def':
        locals.add(st.name)
        break
      case 'del':
        st.targets.forEach((t: any) => t.k === 'name' && locals.add(t.name))
        break
      case 'global':
        st.names.forEach((n: string) => globals.add(n))
        break
      case 'nonlocal':
        st.names.forEach((n: string) => nonlocals.add(n))
        break
    }
  }
  body.forEach(walk)
  for (const n of globals) locals.delete(n)
  for (const n of nonlocals) locals.delete(n)
  return { locals, globals, nonlocals }
}

function pyRun(body: any[], out: string[]): void {
  const global = new PScope(undefined, undefined)
  const ctx: PCtx = { steps: 0, depth: 0, out, global }
  try {
    pyBlock(body, global, ctx)
  } catch (e) {
    if (e instanceof PReturn) no('return outside a function')
    if (e === PBREAK || e === PCONTINUE) no('break outside a loop')
    throw e
  }
}

function pyBlock(body: any[], scope: PScope, ctx: PCtx): void {
  for (const st of body) pyExec(st, scope, ctx)
}

function pyLookup(name: string, scope: PScope, ctx: PCtx): any {
  // Local to a function: its own scope only (UnboundLocalError before assignment).
  let s: PScope | undefined = scope
  while (s) {
    if (s.fn && !s.isComp) {
      if (s.fn.globals.has(name)) return pyGlobal(name, ctx)
      if (s.fn.locals.has(name)) {
        const v = s.vars.get(name)
        if (v === undefined || v === UNBOUND) fail(`UnboundLocalError ${name}`)
        return v
      }
    } else if (s.isComp && s.vars.has(name)) return s.vars.get(name)
    else if (!s.fn && !s.isComp) return pyGlobal(name, ctx)
    s = s.parent
  }
  return pyGlobal(name, ctx)
}
function pyGlobal(name: string, ctx: PCtx): any {
  const v = ctx.global.vars.get(name)
  if (v !== undefined && v !== UNBOUND) return v
  if (P_BUILTINS.has(name)) return P_TYPES.has(name) ? new PType(name) : new PBuiltin(name)
  return fail(`NameError ${name}`)
}

function pyAssignName(name: string, v: any, scope: PScope, ctx: PCtx): void {
  if (scope.isComp) {
    scope.vars.set(name, v)
    return
  }
  if (scope.fn) {
    if (scope.fn.globals.has(name)) {
      ctx.global.vars.set(name, v)
      return
    }
    if (scope.fn.nonlocals.has(name)) {
      let s = scope.parent
      while (s && !(s.fn && !s.isComp && s.fn.locals.has(name))) s = s.parent
      if (!s) no('nonlocal target')
      s!.vars.set(name, v)
      return
    }
  }
  scope.vars.set(name, v)
}

function pyAssign(t: any, v: any, scope: PScope, ctx: PCtx): void {
  if (t.k === 'name') return pyAssignName(t.name, v, scope, ctx)
  if (t.k === 'tuple' || t.k === 'list') {
    const items = pyItems(v, ctx)
    const star = t.items.findIndex((x: any) => x.k === 'star')
    if (star === -1) {
      if (items.length !== t.items.length) fail('ValueError unpack')
      t.items.forEach((x: any, k: number) => pyAssign(x, items[k], scope, ctx))
      return
    }
    const after = t.items.length - star - 1
    if (items.length < t.items.length - 1) fail('ValueError unpack')
    t.items.forEach((x: any, k: number) => {
      if (k < star) pyAssign(x, items[k], scope, ctx)
      else if (k === star) pyAssign(x.e, pySized(new PList(items.slice(star, items.length - after))), scope, ctx)
      else pyAssign(x, items[items.length - (t.items.length - k)], scope, ctx)
    })
    return
  }
  if (t.k === 'sub') {
    const obj = pyEval(t.obj, scope, ctx)
    if (t.index?.k === 'slice') no('slice assignment')
    const key = pyEval(t.index, scope, ctx)
    pySetItem(obj, key, v)
    return
  }
  no('assignment target')
}

function pyIndex(n: number, key: any): number {
  if (!pyIsInt(key)) fail('TypeError index')
  let k = Number(pyBig(key))
  if (k < 0) k += n
  if (k < 0 || k >= n) fail('IndexError')
  return k
}

function pySetItem(obj: any, key: any, v: any): void {
  if (obj instanceof PList) {
    obj.items[pyIndex(obj.items.length, key)] = v
    return
  }
  if (obj instanceof PDict) {
    const h = pyHashKey(key)
    const had = obj.map.get(h)
    obj.map.set(h, [had ? had[0] : key, v])
    if (obj.map.size > NEW_RUN_SIZE) fail('size')
    return
  }
  fail('item assignment')
}

function pySliceIdx(n: number, a: any, b: any, c: any): number[] {
  const step = c === undefined || c === PNONE ? 1 : Number(pyBig(c))
  if (c !== undefined && c !== PNONE && !pyIsInt(c)) fail('slice step')
  if (step === 0) fail('slice step zero')
  const conv = (x: any, def: number, lo: number, hi: number): number => {
    if (x === undefined || x === PNONE) return def
    if (!pyIsInt(x)) fail('slice index')
    let k = Number(pyBig(x))
    if (k < 0) {
      k += n
      if (k < lo) k = lo
    } else if (k > hi) k = hi
    return k
  }
  const out: number[] = []
  if (step > 0) {
    const start = conv(a, 0, 0, n)
    const stop = conv(b, n, 0, n)
    for (let k = start; k < stop; k += step) out.push(k)
  } else {
    const start = conv(a, n - 1, -1, n - 1)
    const stop = conv(b, -1, -1, n - 1)
    for (let k = start; k > stop; k += step) out.push(k)
  }
  return out
}

function pyGetItem(obj: any, key: any): any {
  if (key && key.k === 'sliceval') {
    const n = typeof obj === 'string' ? obj.length : obj instanceof PList || obj instanceof PTuple ? obj.items.length : obj instanceof PRange ? obj.length : -1
    if (n < 0) fail('slice of this')
    const idx = pySliceIdx(n, key.a, key.b, key.c)
    if (typeof obj === 'string') return idx.map(k => obj[k]).join('')
    if (obj instanceof PList) return new PList(idx.map(k => obj.items[k]))
    if (obj instanceof PTuple) return new PTuple(idx.map(k => obj.items[k]))
    return no('range slice')
  }
  if (typeof obj === 'string') return obj[pyIndex(obj.length, key)]
  if (obj instanceof PList || obj instanceof PTuple) return obj.items[pyIndex(obj.items.length, key)]
  if (obj instanceof PRange) return obj.at(pyIndex(obj.length, key))
  if (obj instanceof PDict) {
    const got = obj.map.get(pyHashKey(key))
    if (!got) fail('KeyError')
    return got![1]
  }
  return fail('not subscriptable')
}

function pyExec(st: any, scope: PScope, ctx: PCtx): void {
  pyStep(ctx)
  switch (st.k) {
    case 'pass':
      return
    case 'expr':
      pyEval(st.e, scope, ctx)
      return
    case 'assign': {
      const v = pyEval(st.value, scope, ctx)
      for (const t of st.targets) pyAssign(t, v, scope, ctx)
      return
    }
    case 'aug': {
      const t = st.target
      if (t.k === 'name') {
        const cur = pyLookup(t.name, scope, ctx)
        const rhs = pyEval(st.value, scope, ctx)
        pyAssignName(t.name, pyAugValue(st.op, cur, rhs, ctx), scope, ctx)
        return
      }
      if (t.k === 'sub') {
        const obj = pyEval(t.obj, scope, ctx)
        if (t.index?.k === 'slice') no('slice augmented')
        const key = pyEval(t.index, scope, ctx)
        const cur = pyGetItem(obj, key)
        const rhs = pyEval(st.value, scope, ctx)
        pySetItem(obj, key, pyAugValue(st.op, cur, rhs, ctx))
        return
      }
      no('augmented target')
      return
    }
    case 'if':
      if (pyTruth(pyEval(st.test, scope, ctx))) pyBlock(st.then, scope, ctx)
      else pyBlock(st.other, scope, ctx)
      return
    case 'while': {
      let broke = false
      while (pyTruth(pyEval(st.test, scope, ctx))) {
        pyStep(ctx)
        if (pyLoopBody(st.body, scope, ctx)) {
          broke = true
          break
        }
      }
      if (!broke && st.other) pyBlock(st.other, scope, ctx)
      return
    }
    case 'for': {
      const it = pyEval(st.iter, scope, ctx)
      let broke = false
      pyIterate(it, ctx, x => {
        pyAssign(st.target, x, scope, ctx)
        if (pyLoopBody(st.body, scope, ctx)) {
          broke = true
          return true
        }
        return false
      })
      if (!broke && st.other) pyBlock(st.other, scope, ctx)
      return
    }
    case 'break':
      throw PBREAK
    case 'continue':
      throw PCONTINUE
    case 'return':
      if (!scope.fn) no('return outside a function')
      throw new PReturn(st.arg === undefined ? PNONE : pyEval(st.arg, scope, ctx))
    case 'def': {
      const defaults = st.params.map((p: any) => (p.def === undefined ? undefined : pyEval(p.def, scope, ctx)))
      const bound = pyBound(st.body)
      for (const p of st.params) bound.locals.add(p.name)
      pyAssignName(st.name, new PFunc(st.name, st.params, defaults, st.body, scope, false, bound.locals, bound.globals, bound.nonlocals), scope, ctx)
      return
    }
    case 'global':
    case 'nonlocal':
      if (!scope.fn) {
        if (st.k === 'nonlocal') no('nonlocal at module level')
        return
      }
      return
    case 'del':
      for (const t of st.targets) {
        if (t.k === 'name') {
          pyLookup(t.name, scope, ctx)
          if (scope.fn && !scope.fn.globals.has(t.name)) scope.vars.set(t.name, UNBOUND)
          else ctx.global.vars.delete(t.name)
        } else {
          const obj = pyEval(t.obj, scope, ctx)
          if (t.index?.k === 'slice') no('del slice')
          const key = pyEval(t.index, scope, ctx)
          if (obj instanceof PList) obj.items.splice(pyIndex(obj.items.length, key), 1)
          else if (obj instanceof PDict) {
            if (!obj.map.delete(pyHashKey(key))) fail('KeyError')
          } else fail('del of this')
        }
      }
      return
  }
  no(`statement ${st.k}`)
}

function pyAugValue(op: string, cur: any, rhs: any, ctx: PCtx): any {
  // A list += any iterable extends it in place (the same list everywhere it is named).
  if (op === '+' && cur instanceof PList) {
    cur.items.push(...pyItems(rhs, ctx))
    pySized(cur)
    return cur
  }
  if (op === '*' && cur instanceof PList) {
    if (!pyIsInt(rhs)) fail('TypeError *=')
    const k = Number(pyBig(rhs) < 0n ? 0n : pyBig(rhs))
    if (cur.items.length * k > NEW_RUN_SIZE) fail('size')
    const items = [...cur.items]
    cur.items.length = 0
    for (let r = 0; r < k; r += 1) cur.items.push(...items)
    return cur
  }
  return pyBinary(op, cur, rhs)
}

function pyLoopBody(body: any[], scope: PScope, ctx: PCtx): boolean {
  try {
    pyBlock(body, scope, ctx)
  } catch (e) {
    if (e === PBREAK) return true
    if (e === PCONTINUE) return false
    throw e
  }
  return false
}

function pyEval(e: any, scope: PScope, ctx: PCtx): any {
  switch (e.k) {
    case 'lit':
      return e.v
    case 'fstr': {
      let s = ''
      for (const part of e.parts) {
        if (typeof part === 'string') s += part
        else {
          const v = pyEval(part.expr, scope, ctx)
          s += pyFormat(part.conv === 'r' ? pyRepr(v) : v, part.spec)
        }
        textOk(s)
      }
      return s
    }
    case 'name':
      return pyLookup(e.name, scope, ctx)
    case 'tuple':
      return pySized(new PTuple(e.items.map((x: any) => pyEval(x, scope, ctx))))
    case 'list':
      return pySized(new PList(e.items.map((x: any) => pyEval(x, scope, ctx))))
    case 'dict': {
      const d = new PDict()
      e.keys.forEach((k: any, j: number) => {
        const key = pyEval(k, scope, ctx)
        const v = pyEval(e.values[j], scope, ctx)
        pySetItem(d, key, v)
      })
      return d
    }
    case 'bool': {
      const l = pyEval(e.l, scope, ctx)
      if (e.op === 'and') return pyTruth(l) ? pyEval(e.r, scope, ctx) : l
      return pyTruth(l) ? l : pyEval(e.r, scope, ctx)
    }
    case 'not':
      return !pyTruth(pyEval(e.arg, scope, ctx))
    case 'ifexp':
      return pyTruth(pyEval(e.test, scope, ctx)) ? pyEval(e.then, scope, ctx) : pyEval(e.other, scope, ctx)
    case 'cmp': {
      let left = pyEval(e.first, scope, ctx)
      for (let k = 0; k < e.ops.length; k += 1) {
        const right = pyEval(e.rest[k], scope, ctx)
        if (!pyCompare(e.ops[k], left, right, ctx)) return false
        left = right
      }
      return true
    }
    case 'bin':
      return pyBinary(e.op, pyEval(e.l, scope, ctx), pyEval(e.r, scope, ctx))
    case 'unary': {
      const v = pyEval(e.arg, scope, ctx)
      if (!pyIsNum(v)) fail('TypeError unary')
      if (e.op === '-') return typeof v === 'number' ? -v : pyIntOk(-pyBig(v))
      if (e.op === '+') return typeof v === 'number' ? v : pyBig(v)
      if (typeof v === 'number') fail('TypeError ~')
      return ~pyBig(v)
    }
    case 'lambda': {
      const locals = new Set<string>(e.params.map((p: any) => p.name))
      const defaults = e.params.map((p: any) => (p.def === undefined ? undefined : pyEval(p.def, scope, ctx)))
      return new PFunc('<lambda>', e.params, defaults, e.body, scope, true, locals, new Set(), new Set())
    }
    case 'attr':
      return pyAttr(pyEval(e.obj, scope, ctx), e.name)
    case 'sub': {
      const obj = pyEval(e.obj, scope, ctx)
      if (e.index?.k === 'slice') {
        const f = (x: any) => (x === undefined ? undefined : pyEval(x, scope, ctx))
        return pyGetItem(obj, { k: 'sliceval', a: f(e.index.a), b: f(e.index.b), c: f(e.index.c) })
      }
      return pyGetItem(obj, pyEval(e.index, scope, ctx))
    }
    case 'call': {
      const fn = pyEval(e.fn, scope, ctx)
      const args = e.args.map((a: any) => pyEval(a, scope, ctx))
      const kw: [string, any][] = e.kw.map((a: any) => [a.name, pyEval(a.value, scope, ctx)])
      return pyCall(fn, args, kw, ctx)
    }
    case 'comp':
      return pyComp(e, scope, ctx)
    case 'slice':
      return no('slice here')
  }
  return no(`expression ${e.k}`)
}

function pyCompare(op: string, a: any, b: any, ctx: PCtx): boolean {
  switch (op) {
    case '==':
      return pyEq(a, b)
    case '!=':
      return !pyEq(a, b)
    case '<':
      return pyCmp(a, b) < 0
    case '>':
      return pyCmp(a, b) > 0
    case '<=':
      return pyCmp(a, b) <= 0
    case '>=':
      return pyCmp(a, b) >= 0
    case 'in':
    case 'not in': {
      let has: boolean
      if (typeof b === 'string') {
        if (typeof a !== 'string') fail('TypeError in')
        has = b.includes(a)
      } else if (b instanceof PDict) has = b.map.has(pyHashKey(a))
      else if (b instanceof PView) {
        if (b.kind === 'keys') has = b.dict.map.has(pyHashKey(a))
        else has = pyItems(b, ctx).some(x => pyEq(x, a))
      } else if (b instanceof PRange) {
        if (!pyIsInt(a)) has = pyItems(b, ctx).some(x => pyEq(x, a))
        else {
          const x = pyBig(a)
          const { start, stop, step } = b
          has = step > 0n ? x >= start && x < stop && (x - start) % step === 0n : x <= start && x > stop && (start - x) % -step === 0n
        }
      } else if (b instanceof PList || b instanceof PTuple) has = b.items.some(x => x === a || pyEq(x, a))
      else return fail('TypeError in')
      return op === 'in' ? has : !has
    }
    case 'is':
    case 'is not': {
      const ok = (v: any) => v === PNONE || typeof v === 'boolean' || v instanceof PList || v instanceof PDict
      if (!ok(a) && !ok(b)) no('is between values')
      const same = a === b
      return op === 'is' ? same : !same
    }
  }
  return no(`compare ${op}`)
}

function pyComp(e: any, scope: PScope, ctx: PCtx): any {
  // The first iterable in the enclosing scope; the rest in the comprehension's own scope.
  const inner = new PScope(scope, scope.fn, true)
  const firstIter = pyEval(e.fors[0].iter, scope, ctx)
  if (e.kind === 'gen') {
    // Lazy: values made as they are asked for.
    const gen = compGen(e, 0, inner, ctx, firstIter)
    return new PIter(() => {
      const r = gen.next()
      return r.done ? { done: true } : { done: false, v: r.value }
    })
  }
  if (e.kind === 'dict') {
    const d = new PDict()
    for (const [k, v] of compGen(e, 0, inner, ctx, firstIter)) pySetItem(d, k, v)
    return d
  }
  const items: any[] = []
  for (const v of compGen(e, 0, inner, ctx, firstIter)) {
    items.push(v)
    if (items.length > NEW_RUN_SIZE) fail('size')
  }
  return new PList(items)
}

function* compGen(e: any, level: number, inner: PScope, ctx: PCtx, firstIter: any): Generator<any> {
  const f = e.fors[level]
  const iterable = level === 0 ? firstIter : pyEval(f.iter, inner, ctx)
  const it = pyIterOf(iterable, ctx)
  for (;;) {
    pyStep(ctx)
    const r = it.next()
    if (r.done) return
    pyAssign(f.target, r.v, inner, ctx)
    if (!f.ifs.every((c: any) => pyTruth(pyEval(c, inner, ctx)))) continue
    if (level + 1 < e.fors.length) yield* compGen(e, level + 1, inner, ctx, undefined)
    else if (e.kind === 'dict') yield [pyEval(e.elt, inner, ctx), pyEval(e.value, inner, ctx)]
    else yield pyEval(e.elt, inner, ctx)
  }
}

function pyFormat(v: any, spec: string): string {
  if (spec === '') return pyStr(v)
  const m = /^(,)?(?:\.(\d+)([f%]))?(d)?$/.exec(spec)
  if (!m) return no(`format spec ${spec}`)
  const [, comma, digits, type, d] = m
  if (d) {
    if (!pyIsInt(v) || digits) fail('format d')
    const s = pyBig(v).toString()
    return comma ? pyGroup(s) : s
  }
  if (type === 'f' || type === '%') {
    if (!pyIsNum(v)) fail('format f')
    let x = pyToFloat(v)
    if (type === '%') {
      x = x * 100
      if (!Number.isInteger(x)) no('percent of an inexact value')
    }
    const n = Number(digits)
    const body = pyHalfEven(x, n, true)
    const neg = x < 0 || Object.is(x, -0)
    const s = (neg ? '-' : '') + (comma ? pyGroup(body) : body)
    return type === '%' ? s + '%' : s
  }
  if (comma) {
    if (pyIsInt(v)) return pyGroup(pyBig(v).toString())
    return no('comma format of a float')
  }
  return no(`format spec ${spec}`)
}
function pyGroup(s: string): string {
  const neg = s.startsWith('-')
  const body = neg ? s.slice(1) : s
  const [ip, fp] = body.split('.') as [string, string | undefined]
  const grouped = ip.replace(/\B(?=(\d{3})+$)/g, ',')
  return (neg ? '-' : '') + grouped + (fp !== undefined ? '.' + fp : '')
}

const P_STR_METHODS = new Set(['upper', 'lower', 'strip', 'lstrip', 'rstrip', 'split', 'join', 'replace', 'startswith', 'endswith', 'find', 'count', 'isdigit', 'isalpha', 'isupper', 'islower', 'title', 'capitalize', 'format', 'index'])
const P_LIST_METHODS = new Set(['append', 'extend', 'insert', 'pop', 'remove', 'index', 'count', 'sort', 'reverse', 'copy', 'clear'])
const P_DICT_METHODS = new Set(['get', 'keys', 'values', 'items', 'pop', 'setdefault', 'update', 'copy'])

function pyAttr(obj: any, name: string): any {
  if (typeof obj === 'string' && P_STR_METHODS.has(name)) return new PBuiltin('str.' + name, obj)
  // An unbound method (`key=str.lower`): called with its receiver as the first argument.
  if (obj instanceof PType && obj.name === 'str' && P_STR_METHODS.has(name)) return new PBuiltin('unbound.str.' + name)
  if (obj instanceof PList && P_LIST_METHODS.has(name)) return new PBuiltin('list.' + name, obj)
  if (obj instanceof PDict && P_DICT_METHODS.has(name)) return new PBuiltin('dict.' + name, obj)
  return no(`attribute ${name} of ${pyTypeName(obj)}`)
}

function pyArgs(name: string, args: any[], kw: [string, any][], min: number, max: number, kwNames: string[] = []): Record<string, any> {
  if (args.length < min || args.length > max) fail(`TypeError ${name} arguments`)
  const out: Record<string, any> = {}
  for (const [k, v] of kw) {
    if (!kwNames.includes(k)) no(`keyword ${k} of ${name}`)
    out[k] = v
  }
  return out
}

function pyPlainText(s: string): void {
  if (/[^\x00-\x7f가-힣ㄱ-ㆎ]/.test(s)) no('text outside ASCII and Hangul')
}
const PY_SPACE = /^[ \t\n\r\x0b\x0c]*$/

function pyCall(fn: any, args: any[], kw: [string, any][], ctx: PCtx): any {
  pyStep(ctx)
  if (fn instanceof PFunc) return pyCallFunc(fn, args, kw, ctx)
  if (fn instanceof PType) return pyCallType(fn.name, args, kw, ctx)
  if (!(fn instanceof PBuiltin)) return fail('not callable')
  const self = fn.self
  const nm = fn.name
  if (nm.startsWith('unbound.str.')) {
    if (args.length < 1 || typeof args[0] !== 'string') fail('TypeError unbound str method')
    return pyStrMethod(args[0], nm.slice(12), args.slice(1), kw, ctx)
  }
  if (nm.startsWith('str.')) return pyStrMethod(self, nm.slice(4), args, kw, ctx)
  if (nm.startsWith('list.')) return pyListMethod(self, nm.slice(5), args, kw, ctx)
  if (nm.startsWith('dict.')) return pyDictMethod(self, nm.slice(5), args, kw, ctx)
  switch (nm) {
    case 'print': {
      if (kw.length > 0) no('print keywords')
      if (args.length !== 1 && printArgs && args.length >= 2 && args.length <= 4) {
        if (!args.every(a => typeof a === 'string' || pyIsNum(a) || a === PNONE)) throw new Refuse('print-value', 'print of a collection')
        ctx.out.push(textOk(args.map(pyStr).join(' ')) + '\n')
        return PNONE
      }
      if (args.length !== 1) throw new Refuse('print-value', 'print of several values')
      const v = args[0]
      if (!(typeof v === 'string' || pyIsNum(v) || v === PNONE)) throw new Refuse('print-value', 'print of a collection')
      ctx.out.push(textOk(pyStr(v)) + '\n')
      return PNONE
    }
    case 'len': {
      pyArgs(nm, args, kw, 1, 1)
      const v = args[0]
      if (typeof v === 'string') return BigInt(v.length)
      if (v instanceof PList || v instanceof PTuple) return BigInt(v.items.length)
      if (v instanceof PDict) return BigInt(v.map.size)
      if (v instanceof PView) return BigInt(v.dict.map.size)
      if (v instanceof PRange) return BigInt(v.length)
      return fail('TypeError len')
    }
    case 'range': {
      pyArgs(nm, args, kw, 1, 3)
      if (!args.every(pyIsInt)) fail('TypeError range')
      const b = args.map(pyBig)
      const r = b.length === 1 ? new PRange(0n, b[0]!, 1n) : new PRange(b[0]!, b[1]!, b[2] ?? 1n)
      if (r.step === 0n) fail('range step zero')
      return r
    }
    case 'abs': {
      pyArgs(nm, args, kw, 1, 1)
      const v = args[0]
      if (typeof v === 'number') return Math.abs(v)
      if (pyIsInt(v)) {
        const b = pyBig(v)
        return b < 0n ? -b : b
      }
      return fail('TypeError abs')
    }
    case 'round': {
      pyArgs(nm, args, kw, 1, 2)
      const v = args[0]
      const nd = args[1]
      if (pyIsInt(v)) {
        if (nd === undefined || nd === PNONE) return pyBig(v)
        if (!pyIsInt(nd)) fail('TypeError round')
        const n = pyBig(nd)
        if (n >= 0n) return pyBig(v)
        const p = 10n ** -n
        const [q, r] = pyFloorDivInt(pyBig(v), p)
        const twice = 2n * r
        let qq = q
        if (twice > p || (twice === p && q % 2n !== 0n)) qq += 1n
        return qq * p
      }
      if (typeof v !== 'number') return fail('TypeError round')
      if (!Number.isFinite(v)) fail('round of inf')
      if (nd === undefined || nd === PNONE) {
        const s = pyHalfEven(v, 0, false)
        const b = BigInt(s)
        return v < 0 ? -b : b
      }
      if (!pyIsInt(nd)) fail('TypeError round')
      const n = Number(pyBig(nd))
      if (n < 0) no('round to tens of a float')
      const s = pyHalfEven(v, n, false)
      const r = Number(s)
      return v < 0 || Object.is(v, -0) ? -r : r
    }
    case 'min':
    case 'max': {
      const opts = pyArgs(nm, args, kw, 1, 20, ['key', 'default'])
      const items = args.length === 1 ? pyItems(args[0], ctx) : args
      if (items.length === 0) {
        if ('default' in opts) return opts.default
        fail('ValueError empty')
      }
      const keyOf = (x: any) => (opts.key !== undefined && opts.key !== PNONE ? pyCall(opts.key, [x], [], ctx) : x)
      let best = items[0]
      let bestKey = keyOf(best)
      for (const x of items.slice(1)) {
        const k = keyOf(x)
        const c = pyCmp(k, bestKey)
        if (nm === 'max' ? c > 0 : c < 0) {
          best = x
          bestKey = k
        }
      }
      return best
    }
    case 'sum': {
      pyArgs(nm, args, kw, 1, 2)
      const items = pyItems(args[0], ctx)
      let acc: any = args[1] ?? 0n
      if (typeof acc === 'string') fail('TypeError sum of strings')
      // Python 3.12 sums floats with compensation, 3.11 does not: refused where the two would differ.
      let naive = 0
      let hi = 0
      let lo = 0
      let isFloat = typeof acc === 'number'
      for (const x of items) {
        acc = pyBinary('+', acc, x)
        if (typeof x === 'number') isFloat = true
      }
      if (isFloat) {
        const all = [args[1] ?? 0n, ...items].map(pyToFloat)
        for (const x of all) {
          naive += x
          const t = hi + x
          lo += Math.abs(hi) >= Math.abs(x) ? hi - t + x : x - t + hi
          hi = t
        }
        if (naive !== hi + lo && Number.isFinite(naive)) no('float sum differs by version')
      }
      return acc
    }
    case 'sorted': {
      const opts = pyArgs(nm, args, kw, 1, 1, ['key', 'reverse'])
      const items = pyItems(args[0], ctx)
      return new PList(pySortItems(items, opts, ctx))
    }
    case 'reversed': {
      pyArgs(nm, args, kw, 1, 1)
      const v = args[0]
      if (!(v instanceof PList || v instanceof PTuple || typeof v === 'string' || v instanceof PRange)) fail('TypeError reversed')
      const items = pyItems(v, ctx).reverse()
      let k = 0
      return new PIter(() => (k < items.length ? { done: false, v: items[k++] } : { done: true }))
    }
    case 'enumerate': {
      const opts = pyArgs(nm, args, kw, 1, 2, ['start'])
      const start = args[1] ?? opts.start ?? 0n
      if (!pyIsInt(start)) fail('TypeError enumerate')
      const it = pyIterOf(args[0], ctx)
      let k = pyBig(start)
      return new PIter(() => {
        const r = it.next()
        if (r.done) return { done: true }
        const out = new PTuple([k, r.v])
        k += 1n
        return { done: false, v: out }
      })
    }
    case 'zip': {
      pyArgs(nm, args, kw, 1, 5)
      const its = args.map(a => pyIterOf(a, ctx))
      return new PIter(() => {
        const vals: any[] = []
        for (const it of its) {
          const r = it.next()
          if (r.done) return { done: true }
          vals.push(r.v)
        }
        return { done: false, v: new PTuple(vals) }
      })
    }
    case 'map': {
      pyArgs(nm, args, kw, 2, 2)
      const f = args[0]
      const it = pyIterOf(args[1], ctx)
      return new PIter(() => {
        const r = it.next()
        return r.done ? { done: true } : { done: false, v: pyCall(f, [r.v], [], ctx) }
      })
    }
    case 'filter': {
      pyArgs(nm, args, kw, 2, 2)
      const f = args[0]
      const it = pyIterOf(args[1], ctx)
      return new PIter(() => {
        for (;;) {
          pyStep(ctx)
          const r = it.next()
          if (r.done) return { done: true }
          if (pyTruth(f === PNONE ? r.v : pyCall(f, [r.v], [], ctx))) return { done: false, v: r.v }
        }
      })
    }
    case 'any':
    case 'all': {
      pyArgs(nm, args, kw, 1, 1)
      let result = nm === 'all'
      pyIterate(args[0], ctx, x => {
        if (pyTruth(x) === (nm === 'any')) {
          result = nm === 'any'
          return true
        }
        return false
      })
      return result
    }
    case 'chr': {
      pyArgs(nm, args, kw, 1, 1)
      if (!pyIsInt(args[0])) fail('TypeError chr')
      const n = Number(pyBig(args[0]))
      if (n < 0 || n > 0xffff || (n >= 0xd800 && n <= 0xdfff)) no('chr range')
      return String.fromCharCode(n)
    }
    case 'ord': {
      pyArgs(nm, args, kw, 1, 1)
      if (typeof args[0] !== 'string' || args[0].length !== 1) fail('TypeError ord')
      return BigInt(args[0].charCodeAt(0))
    }
    case 'divmod': {
      pyArgs(nm, args, kw, 2, 2)
      return new PTuple([pyBinary('//', args[0], args[1]), pyBinary('%', args[0], args[1])])
    }
    case 'pow': {
      pyArgs(nm, args, kw, 2, 2)
      return pyBinary('**', args[0], args[1])
    }
    case 'isinstance': {
      pyArgs(nm, args, kw, 2, 2)
      const t = args[1]
      const types = t instanceof PTuple ? t.items : [t]
      if (!types.every(x => x instanceof PType)) no('isinstance of this')
      const name = pyTypeName(args[0])
      return types.some((x: PType) => x.name === name || (x.name === 'int' && name === 'bool'))
    }
  }
  return no(`builtin ${nm}`)
}

function pySortItems(items: any[], opts: Record<string, any>, ctx: PCtx): any[] {
  const keys = opts.key !== undefined && opts.key !== PNONE ? items.map(x => pyCall(opts.key, [x], [], ctx)) : items
  const rev = opts.reverse !== undefined && pyTruth(opts.reverse)
  const idx = items.map((_, k) => k)
  const sorted = mergeSort(idx, (i, j) => {
    const c = pyCmp(keys[i], keys[j])
    return rev ? -c : c
  })
  return sorted.map(k => items[k])
}

function pyCallType(name: string, args: any[], kw: [string, any][], ctx: PCtx): any {
  if (name === 'dict') {
    const d = new PDict()
    if (args.length > 1) fail('TypeError dict')
    if (args.length === 1) {
      const src = args[0]
      if (src instanceof PDict) for (const [h, kv] of src.map) d.map.set(h, [...kv] as [any, any])
      else
        for (const pair of pyItems(src, ctx)) {
          const kv = pyItems(pair, ctx)
          if (kv.length !== 2) fail('ValueError dict')
          pySetItem(d, kv[0], kv[1])
        }
    }
    for (const [k, v] of kw) pySetItem(d, k, v)
    return d
  }
  if (kw.length > 0) no(`keywords of ${name}`)
  if (args.length > 1 && name !== 'int') fail(`TypeError ${name}`)
  const v = args[0]
  switch (name) {
    case 'int': {
      if (args.length === 0) return 0n
      if (args.length > 1) no('int base')
      if (typeof v === 'boolean') return v ? 1n : 0n
      if (typeof v === 'bigint') return v
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) fail('int of inf')
        return pyIntOk(BigInt(Math.trunc(v)))
      }
      if (typeof v === 'string') {
        if (!/^[ \t]*[+-]?\d+[ \t]*$/.test(v)) fail('ValueError int')
        return pyIntOk(BigInt(v.trim()))
      }
      return fail('TypeError int')
    }
    case 'float': {
      if (args.length === 0) return 0
      if (typeof v === 'number') return v
      if (pyIsInt(v)) return pyToFloat(v)
      if (typeof v === 'string') {
        if (!/^[ \t]*[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[ \t]*$/.test(v)) {
          if (/^[ \t]*[+-]?(inf|nan|infinity)[ \t]*$/i.test(v)) no('float of inf')
          fail('ValueError float')
        }
        return pyFloatOk(Number(v.trim()))
      }
      return fail('TypeError float')
    }
    case 'str':
      return args.length === 0 ? '' : textOk(pyStr(v))
    case 'bool':
      return args.length === 0 ? false : pyTruth(v)
    case 'list':
      return new PList(args.length === 0 ? [] : pyItems(v, ctx))
    case 'tuple':
      return new PTuple(args.length === 0 ? [] : pyItems(v, ctx))
  }
  return no(`type ${name}`)
}

function pyCallFunc(fn: PFunc, args: any[], kw: [string, any][], ctx: PCtx): any {
  ctx.depth += 1
  if (ctx.depth > NEW_RUN_DEPTH) fail('RecursionError')
  try {
    const scope = new PScope(fn.closure, fn)
    if (args.length > fn.params.length) fail('TypeError too many arguments')
    fn.params.forEach((p: any, k: number) => {
      if (k < args.length) scope.vars.set(p.name, args[k])
    })
    for (const [name, v] of kw) {
      if (!fn.params.some(p => p.name === name)) fail('TypeError keyword')
      if (scope.vars.has(name)) fail('TypeError multiple values')
      scope.vars.set(name, v)
    }
    fn.params.forEach((p: any, k: number) => {
      if (!scope.vars.has(p.name)) {
        if (fn.defaults[k] === undefined) fail('TypeError missing argument')
        scope.vars.set(p.name, fn.defaults[k])
      }
    })
    if (fn.isLambda) return pyEval(fn.body, scope, ctx)
    try {
      pyBlock(fn.body, scope, ctx)
    } catch (e) {
      if (e instanceof PReturn) return e.v
      if (e === PBREAK || e === PCONTINUE) no('break outside a loop')
      throw e
    }
    return PNONE
  } finally {
    ctx.depth -= 1
  }
}

function pyStrMethod(s: string, m: string, args: any[], kw: [string, any][], ctx: PCtx): any {
  const strArg = (v: any) => (typeof v === 'string' ? v : fail('TypeError str argument'))
  switch (m) {
    case 'upper':
    case 'lower':
    case 'title':
    case 'capitalize': {
      pyArgs(m, args, kw, 0, 0)
      pyPlainText(s)
      if (m === 'upper') return s.toUpperCase()
      if (m === 'lower') return s.toLowerCase()
      if (m === 'capitalize') return s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase()
      return s.toLowerCase().replace(/(^|[^A-Za-z])([a-z])/g, (_x, a: string, b: string) => a + b.toUpperCase())
    }
    case 'strip':
    case 'lstrip':
    case 'rstrip': {
      pyArgs(m, args, kw, 0, 1)
      const chars = args[0] === undefined || args[0] === PNONE ? undefined : strArg(args[0])
      if (chars === undefined && /[^\S \t\n\r]/.test(s)) no('unusual spaces')
      const isStrip = (ch: string) => (chars === undefined ? PY_SPACE.test(ch) : chars.includes(ch))
      let a = 0
      let b = s.length
      if (m !== 'rstrip') while (a < b && isStrip(s[a]!)) a += 1
      if (m !== 'lstrip') while (b > a && isStrip(s[b - 1]!)) b -= 1
      return s.slice(a, b)
    }
    case 'split': {
      const opts = pyArgs(m, args, kw, 0, 2, ['sep', 'maxsplit'])
      const sep = args[0] ?? opts.sep
      const max = args[1] ?? opts.maxsplit
      if (max !== undefined) no('maxsplit')
      if (sep === undefined || sep === PNONE) {
        if (/[^\S \t\n\r]/.test(s)) no('unusual spaces')
        return new PList(s.split(/[ \t\n\r\x0b\x0c]+/).filter(x => x !== ''))
      }
      if (strArg(sep) === '') fail('ValueError empty separator')
      return new PList(s.split(sep))
    }
    case 'join': {
      pyArgs(m, args, kw, 1, 1)
      const items = pyItems(args[0], ctx)
      if (!items.every(x => typeof x === 'string')) fail('TypeError join')
      return textOk(items.join(s))
    }
    case 'replace': {
      pyArgs(m, args, kw, 2, 3)
      if (args.length === 3) no('replace count')
      const a = strArg(args[0])
      const b = strArg(args[1])
      if (a === '') no('replace empty')
      return textOk(s.split(a).join(b))
    }
    case 'startswith':
    case 'endswith': {
      pyArgs(m, args, kw, 1, 1)
      const a = args[0]
      const list = a instanceof PTuple ? a.items.map(strArg) : [strArg(a)]
      return list.some(x => (m === 'startswith' ? s.startsWith(x) : s.endsWith(x)))
    }
    case 'find':
    case 'index': {
      pyArgs(m, args, kw, 1, 1)
      const k = s.indexOf(strArg(args[0]))
      if (k === -1 && m === 'index') fail('ValueError substring')
      return BigInt(k)
    }
    case 'count': {
      pyArgs(m, args, kw, 1, 1)
      const a = strArg(args[0])
      if (a === '') return BigInt(s.length + 1)
      return BigInt(s.split(a).length - 1)
    }
    case 'isdigit':
      pyArgs(m, args, kw, 0, 0)
      if (/[^\x00-\x7f가-힣]/.test(s)) no('isdigit of unusual text')
      return /^[0-9]+$/.test(s)
    case 'isalpha':
      pyArgs(m, args, kw, 0, 0)
      pyPlainText(s)
      return /^[A-Za-z가-힣ㄱ-ㆎ]+$/.test(s)
    case 'isupper':
    case 'islower': {
      pyArgs(m, args, kw, 0, 0)
      pyPlainText(s)
      const cased = /[A-Za-z]/.test(s)
      return cased && (m === 'isupper' ? !/[a-z]/.test(s) : !/[A-Z]/.test(s))
    }
    case 'format': {
      if (kw.length > 0) no('format keywords')
      let k = 0
      const out = s.replace(/\{\{|\}\}|\{([^{}]*)\}/g, (all, inner: string | undefined) => {
        if (all === '{{') return '{'
        if (all === '}}') return '}'
        const mm = /^(\d*)(?::(.*))?$/.exec(inner ?? '')
        if (!mm) no('format field')
        const at = mm![1] === '' ? k++ : Number(mm![1])
        if (at >= args.length) fail('IndexError format')
        return pyFormat(args[at], mm![2] ?? '')
      })
      return textOk(out)
    }
  }
  return no(`str.${m}`)
}

function pyListMethod(l: PList, m: string, args: any[], kw: [string, any][], ctx: PCtx): any {
  switch (m) {
    case 'append':
      pyArgs(m, args, kw, 1, 1)
      l.items.push(args[0])
      pySized(l)
      return PNONE
    case 'extend':
      pyArgs(m, args, kw, 1, 1)
      l.items.push(...pyItems(args[0], ctx))
      pySized(l)
      return PNONE
    case 'insert': {
      pyArgs(m, args, kw, 2, 2)
      if (!pyIsInt(args[0])) fail('TypeError insert')
      let k = Number(pyBig(args[0]))
      const n = l.items.length
      if (k < 0) k = Math.max(0, k + n)
      if (k > n) k = n
      l.items.splice(k, 0, args[1])
      pySized(l)
      return PNONE
    }
    case 'pop': {
      pyArgs(m, args, kw, 0, 1)
      if (l.items.length === 0) fail('IndexError pop')
      const k = args.length === 0 ? l.items.length - 1 : pyIndex(l.items.length, args[0])
      return l.items.splice(k, 1)[0]
    }
    case 'remove': {
      pyArgs(m, args, kw, 1, 1)
      const k = l.items.findIndex(x => pyEq(x, args[0]))
      if (k === -1) fail('ValueError remove')
      l.items.splice(k, 1)
      return PNONE
    }
    case 'index': {
      pyArgs(m, args, kw, 1, 1)
      const k = l.items.findIndex(x => pyEq(x, args[0]))
      if (k === -1) fail('ValueError index')
      return BigInt(k)
    }
    case 'count':
      pyArgs(m, args, kw, 1, 1)
      return BigInt(l.items.filter(x => pyEq(x, args[0])).length)
    case 'sort': {
      const opts = pyArgs(m, args, kw, 0, 0, ['key', 'reverse'])
      const sorted = pySortItems([...l.items], opts, ctx)
      l.items.length = 0
      l.items.push(...sorted)
      return PNONE
    }
    case 'reverse':
      pyArgs(m, args, kw, 0, 0)
      l.items.reverse()
      return PNONE
    case 'copy':
      pyArgs(m, args, kw, 0, 0)
      return new PList([...l.items])
    case 'clear':
      pyArgs(m, args, kw, 0, 0)
      l.items.length = 0
      return PNONE
  }
  return no(`list.${m}`)
}

function pyDictMethod(d: PDict, m: string, args: any[], kw: [string, any][], ctx: PCtx): any {
  switch (m) {
    case 'get': {
      pyArgs(m, args, kw, 1, 2)
      const got = d.map.get(pyHashKey(args[0]))
      return got ? got[1] : args.length > 1 ? args[1] : PNONE
    }
    case 'keys':
    case 'values':
    case 'items':
      pyArgs(m, args, kw, 0, 0)
      return new PView(d, m)
    case 'pop': {
      pyArgs(m, args, kw, 1, 2)
      const h = pyHashKey(args[0])
      const got = d.map.get(h)
      if (!got) {
        if (args.length > 1) return args[1]
        fail('KeyError')
      }
      d.map.delete(h)
      return got![1]
    }
    case 'setdefault': {
      pyArgs(m, args, kw, 1, 2)
      const h = pyHashKey(args[0])
      const got = d.map.get(h)
      if (got) return got[1]
      const v = args.length > 1 ? args[1] : PNONE
      d.map.set(h, [args[0], v])
      return v
    }
    case 'update': {
      pyArgs(m, args, kw, 0, 1)
      if (args.length === 1) {
        const src = pyCallType('dict', [args[0]], [], ctx) as PDict
        for (const [, [k, v]] of src.map) pySetItem(d, k, v)
      }
      for (const [k, v] of kw) pySetItem(d, k, v)
      return PNONE
    }
    case 'copy': {
      pyArgs(m, args, kw, 0, 0)
      const c = new PDict()
      for (const [h, kv] of d.map) c.map.set(h, [...kv] as [any, any])
      return c
    }
  }
  return no(`dict.${m}`)
}

// ═════════════════════════════════════════ Reach ═════════════════════════════════════════

/** Built-in method and function names each language has (to tell a method named in a concept's words from a plain word). */
const J_KNOWN = new Set([
  ...'at charAt charCodeAt codePointAt concat endsWith includes indexOf isWellFormed lastIndexOf localeCompare match matchAll normalize padEnd padStart repeat replace replaceAll search slice split startsWith substring substr toLocaleLowerCase toLocaleUpperCase toLowerCase toString toUpperCase toWellFormed trim trimEnd trimStart trimLeft trimRight valueOf'.split(' '),
  ...'copyWithin entries every fill filter find findIndex findLast findLastIndex flat flatMap forEach join keys map pop push reduce reduceRight reverse shift some sort splice toLocaleString toReversed toSorted toSpliced unshift values with'.split(' '),
  ...'toExponential toFixed toPrecision EPSILON MAX_SAFE_INTEGER MIN_SAFE_INTEGER MAX_VALUE MIN_VALUE isFinite isInteger isNaN isSafeInteger parseFloat parseInt'.split(' '),
  ...'acos acosh asin asinh atan atan2 atanh cbrt ceil clz32 cos cosh exp expm1 floor fround hypot imul log10 log1p log2 random round sign sin sinh sqrt tan tanh trunc'.split(' '),
  ...'assign create defineProperty defineProperties freeze fromEntries getOwnPropertyDescriptor getOwnPropertyNames getPrototypeOf groupBy hasOwn isExtensible isFrozen isSealed preventExtensions seal setPrototypeOf isArray from fromAsync fromCharCode fromCodePoint raw'.split(' '),
  ...'encodeURIComponent decodeURIComponent encodeURI decodeURI escape unescape structuredClone BigInt Symbol Reflect Proxy Intl WeakMap WeakSet WeakRef ArrayBuffer DataView Uint8Array Int32Array Float64Array TextEncoder TextDecoder Buffer'.split(' '),
])
const P_KNOWN = new Set([
  ...'capitalize casefold center count encode endswith expandtabs find format format_map index isalnum isalpha isascii isdecimal isdigit isidentifier islower isnumeric isprintable isspace istitle isupper join ljust lower lstrip maketrans partition removeprefix removesuffix replace rfind rindex rjust rpartition rsplit rstrip split splitlines startswith strip swapcase title translate upper zfill'.split(' '),
  ...'append clear copy extend insert pop remove reverse sort fromkeys get items keys popitem setdefault update values'.split(' '),
  ...'abs all any ascii bin bool bytearray bytes callable chr classmethod compile complex delattr dict dir divmod enumerate eval exec filter float format frozenset getattr globals hasattr hash help hex id input int isinstance issubclass iter len list locals map max memoryview min next object oct open ord pow print property range repr reversed round set setattr slice sorted staticmethod str sum super tuple type vars zip'.split(' '),
])
const J_SUPPORTED = new Set([...J_STRING_METHODS, ...J_ARRAY_METHODS, 'toFixed', 'toString', 'hasOwnProperty', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', ...Object.values(J_NS).flatMap(s => [...s])])
const P_SUPPORTED = new Set([...P_STR_METHODS, ...P_LIST_METHODS, ...P_DICT_METHODS, ...P_BUILTINS])

/**
 * What a concept's words or code name that newRun does not run (1.13.0 G3, for rungOf's scope: a question about it could
 * only be refused), or undefined. In code (`isCode`): a call of a built-in method or function the evaluator lacks, a
 * namespace it lacks (Intl, Reflect, BigInt, ...), a member of a namespace it has but not that member (Math.cbrt,
 * Object.is), a literal form it lacks (12n, 1_000, an emoji or other astral character), an escape in a string (a printed
 * line break or tab, which a question may not print), a %-format or a width in a format spec. In words: a built-in method
 * or function name the language has and the evaluator lacks (toExponential, swapcase, oct).
 */
export function newOutside(text: string, family: 'js' | 'py', isCode: boolean): string | undefined {
  const known = family === 'js' ? J_KNOWN : P_KNOWN
  const supported = family === 'js' ? J_SUPPORTED : P_SUPPORTED
  if (!isCode) {
    for (const w of text.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []) if (known.has(w) && !supported.has(w)) return `word ${w}`
    return undefined
  }
  if (/[\uD800-\uDFFF]/.test(text)) return 'astral'
  if (/(?<![\w.])\d[\d_]*_\d|(?<![\w.])\d+n\b/.test(text)) return 'number form'
  if (/\\[ntrvfbux0]/.test(text)) return 'escape'
  if (family === 'py' && (/['"]\s*%\s*[\w(]/.test(text) || /\{[^{}:]*:(?:.?[<>^=])?[+\- ]?#?0?[1-9]/.test(text))) return 'format'
  for (const m of text.matchAll(/(?:\b([A-Za-z_$][\w$]*)\s*)?\.\s*([A-Za-z_$][\w$]*)\s*(\()?/g)) {
    const [, owner, name, call] = m
    if (family === 'js' && owner !== undefined && J_NS[owner] !== undefined) {
      if (!J_NS[owner]!.has(name!) && name !== 'log') return `${owner}.${name}`
      continue
    }
    if (call && known.has(name!) && !supported.has(name!)) return `.${name}`
  }
  for (const m of text.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = m[1]!
    if (known.has(name) && !supported.has(name) && !/^(?:function|def)\s/.test(text.slice(Math.max(0, m.index! - 9), m.index))) return `${name}(`
  }
  for (const m of text.matchAll(/(?<![\w$.])([A-Z][\w$]*)\b/g)) if (family === 'js' && known.has(m[1]!) && !supported.has(m[1]!)) return m[1]
  return undefined
}
