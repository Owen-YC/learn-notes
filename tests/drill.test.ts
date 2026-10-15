import { describe, expect, test } from 'claude-code/testing'

import type { LearnChange, LearnNote } from '../types'
import {
  DRILL_LINE_MAX,
  DRILL_MAX_BYTES,
  addActivity,
  askPrompt,
  checkPrompt,
  cleanActivity,
  drillOf,
  drillQuestion,
  drillSection,
  drillStateOf,
  drillTryHead,
  drillVerdictText,
  fitDrill,
  forHistory,
  hideDrillAnswer,
  inlineCode,
  isDrillOver,
  isKoreanTyped,
  jsonBytes,
  normalizeCode,
  notePrompt,
  quizPrompt,
  sameCode,
  todayReview,
} from '../hooks/notes'

const AT = Date.UTC(2026, 9, 3, 1)
const KEY = 'sk-ant-api03-AAAAAAAAAAAAAAAAAAAA'

/** hello.js from its line 10: a comment, the function, the line the note's practice changes (12), the brace. */
const HELLO_DIFF = [
  '@@ -10,4 +10,4 @@',
  ' // 인사',
  ' function greet(name) {',
  '-  return `안녕, ${name}`',
  '+  return `안녕하세요, ${name}님!`',
  ' }',
].join('\n')

function change(diff = HELLO_DIFF, file = 'src/hello.js'): LearnChange {
  return { file, path: `/proj/${file}`, tool: 'Edit', kind: 'update', added: 1, removed: 1, diff, isCut: false }
}

const PRACTICE = [
  '### 직접 해 보기',
  '- 할 일: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요',
  '- 고칠 줄: `` return `안녕하세요, ${name}님!` ``',
  '- 확인: `greet("")` → "안녕하세요, 손님!"',
  '- 예시 답: `` return `안녕하세요, ${name || "손"}님!` ``',
]

const NOTE = [
  '### 한 줄 요약',
  '인사에 "님"을 붙였습니다',
  '### 무엇이 바뀌었나',
  '- 전: "안녕, 철수"라고 인사했습니다',
  '- 후: "안녕하세요, 철수님!"이라고 인사합니다',
  '### 왜 이렇게 바꿨을까',
  '더 공손하게 인사하려고 바꿨습니다.',
  '### 배울 개념',
  '- **템플릿 리터럴**: 문자열 안에 값을 넣습니다 — `${name}`',
  ...PRACTICE,
].join('\n')

describe('1.7.0: a note\'s practice, 직접 해 보기 (D8)', () => {
  test('the note is asked for 직접 해 보기 in four lines, in place of 직접 확인해 볼 것: still five headings', () => {
    const text = notePrompt({ prompt: '인사를 바꿔 줘', answer: '바꿨습니다', changes: [change()], moreFiles: 0 }, 'beginner')
    expect(text).toContain('아래 다섯 제목을 이 순서 그대로 쓰고')
    expect(text).toContain('### 배울 개념')
    expect(text).toContain('### 직접 해 보기\n(학습자가 바뀐 뒤 코드의 한 줄을 직접 고쳐 보는 연습이다. 정확히 아래 네 줄만 쓴다)')
    expect(text).toContain('- 할 일: 배울 개념의 첫째를 써서')
    expect(text).toContain(`- 고칠 줄: 위 diff에서 바뀐 뒤 코드의 한 줄을 글자 그대로 백틱으로 (${DRILL_LINE_MAX}자 이하.`)
    expect(text).toContain('- 확인: `호출이나 입력` → 고친 뒤의 결과')
    expect(text).toContain('- 예시 답: 고친 그 줄 전체를 백틱으로')
    expect(text).toContain('"- 할 일: 없음" 한 줄만 쓴다')
    expect(text).not.toContain('직접 확인해 볼 것')
  })

  test('drillOf: the line found in the changed code, its file, its number counted from its hunk, the lines around it', () => {
    expect(drillOf(NOTE, [change()])).toEqual({
      task: '이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요',
      check: '`greet("")` → "안녕하세요, 손님!"',
      line: 'return `안녕하세요, ${name}님!`',
      indent: '  ',
      example: 'return `안녕하세요, ${name || "손"}님!`',
      file: 'src/hello.js',
      path: '/proj/src/hello.js',
      n: 12,
      above: 'function greet(name) {',
      below: '}',
    })
    // A new file's lines count from 1; its first line has none above.
    const created = change(['@@ -0,0 +1,2 @@', '+const total = 0', '+export default total'].join('\n'), 'src/total.js')
    const first = drillOf(NOTE.replace(/고칠 줄: .*$/m, '고칠 줄: `const total = 0`'), [created])
    expect(first).toMatchObject({ line: 'const total = 0', indent: '', n: 1, below: 'export default total', file: 'src/total.js' })
    expect(first?.above).toBeUndefined()
  })

  test('drillOf: no practice where the line is not in the code, is longer than 40 characters, or holds a masked secret', () => {
    expect(drillOf(NOTE.replace(/고칠 줄: .*$/m, '고칠 줄: `return name`'), [change()])).toBeUndefined()
    // The line the code had before the change is no line to change.
    expect(drillOf(NOTE.replace(/고칠 줄: .*$/m, '고칠 줄: `` return `안녕, ${name}` ``'), [change()])).toBeUndefined()
    const long = `const message = "${'가'.repeat(DRILL_LINE_MAX)}"`
    const longDiff = ['@@ -1,1 +1,1 @@', '-const message = ""', `+${long}`].join('\n')
    expect(drillOf(NOTE.replace(/고칠 줄: .*$/m, `고칠 줄: \`${long}\``), [change(longDiff)])).toBeUndefined()
    const masked = ['@@ -1,1 +1,1 @@', '-const key = ""', '+const key = "«가림»"'].join('\n')
    expect(drillOf(NOTE.replace(/고칠 줄: .*$/m, '고칠 줄: `const key = "«가림»"`'), [change(masked)])).toBeUndefined()
    // No line, or no example, quoted.
    expect(drillOf(NOTE.replace(/^- 예시 답: .*$/m, ''), [change()])).toBeUndefined()
    expect(drillOf(NOTE.replace(/^- 고칠 줄: .*$/m, '- 고칠 줄: 둘째 줄'), [change()])).toBeUndefined()
  })

  test('drillOf: a note before 1.7.0, or one whose change has no line to change (할 일: 없음), has none', () => {
    const old = NOTE.replace(/### 직접 해 보기[\s\S]*$/, '### 직접 확인해 볼 것\n- 이름 없이 불러 보기')
    expect(drillOf(old, [change()])).toBeUndefined()
    expect(hideDrillAnswer(old, 'hello.js')).toBe(old)
    const none = NOTE.replace(/### 직접 해 보기[\s\S]*$/, '### 직접 해 보기\n- 할 일: 없음')
    expect(drillOf(none, [change()])).toBeUndefined()
    // Nothing to practise is said nowhere: the section goes.
    expect(hideDrillAnswer(none)).toBe(NOTE.replace(/\n### 직접 해 보기[\s\S]*$/, ''))
  })

  test('drillOf: the indent stays out of the field, fixed; an added line before an unchanged one; labels bold or not', () => {
    const python = ['@@ -3,3 +3,3 @@', '     for x in xs:', '-        total = x', '+        total += x', '     return total'].join('\n')
    const text = NOTE.replace(/고칠 줄: .*$/m, '고칠 줄: `total += x`')
    expect(drillOf(text, [change(python, 'sum.py')])).toMatchObject({ line: 'total += x', indent: '        ', n: 4, above: '    for x in xs:', below: '    return total' })
    // The same line unchanged in one hunk and added in another: the added one.
    const twice = ['@@ -1,2 +1,2 @@', ' x = 1', ' y = 2', '@@ -8,1 +8,2 @@', ' z = 3', '+x = 1'].join('\n')
    expect(drillOf(NOTE.replace(/고칠 줄: .*$/m, '고칠 줄: `x = 1`'), [change(twice, 'a.py')])).toMatchObject({ n: 9, above: 'z = 3' })
    // Without the added one, the unchanged one; spaces and a ; at its end aside.
    expect(drillOf(NOTE.replace(/고칠 줄: .*$/m, '고칠 줄: `y=2;`'), [change(twice, 'a.py')])).toMatchObject({ line: 'y = 2', n: 2 })
    const bold = NOTE.replace(/- 할 일: /, '- **할 일:** ').replace(/- 고칠 줄: /, '**고칠 줄**: ').replace(/- 예시 답: /, '- **예시 답**：')
    expect(drillOf(bold, [change()])).toMatchObject({ n: 12, task: '이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요' })
  })

  test('the line to change and the example answer are hidden wherever the note is read but the journal; the heading names the file', () => {
    const shown = hideDrillAnswer(NOTE, 'hello.js')
    expect(shown.split('\n').slice(-3)).toEqual(['### 직접 해 보기 · hello.js', '- 할 일: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요', '- 확인: `greet("")` → "안녕하세요, 손님!"'])
    expect(shown).not.toContain('${name || "손"}')
    expect(shown).not.toContain('고칠 줄')
    expect(hideDrillAnswer(NOTE)).toContain('### 직접 해 보기\n- 할 일:')
    // A bold heading, an example run on in a code block, and a section after it.
    const block = ['**직접 해 보기**', '- 할 일: 바꿔 보기', '- 예시 답:', '  ```js', '  return 1', '  ```', '- 확인: `f()` → 1', '', '**참고**', '끝'].join('\n')
    expect(hideDrillAnswer(block, 'a.js')).toBe(['**직접 해 보기 · a.js**', '- 할 일: 바꿔 보기', '- 확인: `f()` → 1', '', '**참고**', '끝'].join('\n'))
    // What the model is asked a question with (e's plainer words, r, a question): no answer to give away.
    const asked = askPrompt({ prompt: '인사', text: NOTE, status: 'ready', changes: [change()], moreFiles: 0 }, '더 쉽게', 'beginner')
    expect(asked).toContain('- 할 일: 이름이 비어 있으면')
    expect(asked).not.toContain('예시 답')
  })

  test('a line is the same code with other spaces, no ; at its end, or the other quotes; what a string holds is not', () => {
    expect(sameCode('return x;', 'return x')).toBe(true)
    expect(sameCode('a+b', 'a + b')).toBe(true)
    expect(sameCode("x = 'a'", 'x = "a"')).toBe(true)
    expect(sameCode('  if (a)   return  b ', 'if(a) return b')).toBe(true)
    expect(sameCode('return x', 'returnx')).toBe(false)
    expect(sameCode('"a  b"', '"a b"')).toBe(false)
    expect(sameCode('`a`', '"a"')).toBe(false)
    expect(sameCode('return `안녕하세요, ${name || "손"}님!`', "return `안녕하세요, ${name || \"손\"}님!`;")).toBe(true)
    expect(normalizeCode("const s = 'it\\'s' ;")).toBe('const s="it\\\'s"')
    // A template's text as written, its ${…} as code.
    expect(sameCode("`안녕, ${name||'손'}님`", '`안녕, ${ name || "손" }님`')).toBe(true)
    expect(sameCode('`a  ${x}`', '`a ${x}`')).toBe(false)
    expect(normalizeCode('`${a ? `${b}` : c}`')).toBe('`${a?`${b}`:c}`')
  })

  test('a line typed in a Korean input mode is told so: a jamo the line did not hold, or Hangul where it had letters', () => {
    expect(isKoreanTyped('ㄱㄷ셔구 ㅜ믇', 'return name')).toBe(true)
    expect(isKoreanTyped('return name || "ㅅ"', 'return name')).toBe(true)
    expect(isKoreanTyped('ㄱㄷ셔구', 'return name')).toBe(true)
    expect(isKoreanTyped('return name || "손님"', 'return name')).toBe(false)
    expect(isKoreanTyped('const 이름 = "영희"', 'const 이름 = "철수"')).toBe(false)
    // A line with no letters to begin with (all Hangul) may be typed so.
    expect(isKoreanTyped('"안녕하세요"', '"안녕"')).toBe(false)
  })

  test('what Claude checks a line by: what to do, the check, the line and the lines around it', () => {
    const drill = drillOf(NOTE, [change()])!
    const question = drillQuestion(drill)
    expect(question).toBe(
      [
        '할 일: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요',
        '확인: `greet("")` → "안녕하세요, 손님!"',
        '학습자가 고칠 줄 (hello.js 12행): `` return `안녕하세요, ${name}님!` ``',
        '그 둘레 코드 (학습자는 고칠 줄 하나만 바꾼다):',
        '```',
        'function greet(name) {',
        '  return `안녕하세요, ${name}님!`',
        '}',
        '```',
      ].join('\n'),
    )
    const prompt = checkPrompt({ name: '템플릿 리터럴', question, answer: drill.example, kind: 'modify' }, '  return `안녕하세요, ${name ?? "손"}님!`', 'beginner')
    expect(prompt).toContain('바꿔 보기 문제다. 학습자가 고친 코드가 모범 답과 달라도 바라는 대로 동작하면 맞음이다.')
    expect(prompt).toContain('## 모범 답\nreturn `안녕하세요, ${name || "손"}님!`')
    expect(prompt).toContain('## 학습자의 답\nreturn `안녕하세요, ${name ?? "손"}님!`')
    expect(inlineCode('a')).toBe('`a`')
    expect(inlineCode('`a`')).toBe('`` `a` ``')
  })

  test('the heads a practice shows, and its journal section: the note, what to do, the line and its grade', () => {
    expect(drillTryHead({ mine: 'return x', verdict: 'partial' })).toBe('△ 아직입니다 · 방향은 맞습니다')
    expect(drillTryHead({ mine: 'return x', verdict: 'wrong' })).toBe('✗ 아직입니다 · 한 번 더 고쳐 보세요')
    expect(drillTryHead({ mine: '모르겠어요', verdict: 'wrong' })).toBe('힌트를 보고 한 번 더 고쳐 보세요')
    expect(drillVerdictText({ verdict: 'right' })).toBe('✓ 해냈습니다')
    expect(drillVerdictText({ verdict: 'right', isRetried: true })).toBe('✓ 해냈습니다 · 되짚어 맞힘')
    expect(drillVerdictText({ verdict: 'partial' })).toBe('△ 거의 맞음')
    expect(drillVerdictText({ verdict: 'wrong', isAnswerSeen: true })).toBe('✗ 틀림 · 예시 답 봄')
    const section = drillSection({ at: AT, prompt: '인사를\n바꿔 줘' }, { task: '손님에게 인사하기' }, { mine: 'return `${x}`', verdict: 'right', feedback: '잘 했습니다.\n좋아요.', at: AT + 60_000 }, AT + 60_000)
    expect(section).toMatch(/^## \d{4}-\d{2}-\d{2} 직접 해 보기 \(\d\d:\d\d\)\n\n\*\*노트\*\*: \d{4}-\d{2}-\d{2} \d\d:\d\d · 인사를 바꿔 줘\n\n/)
    expect(section).toContain('**할 일**: 손님에게 인사하기\n\n**내 줄**: `` return `${x}` ``\n\n**판정**: ✓ 해냈습니다 — 잘 했습니다. 좋아요.\n\n---\n')
  })

  test('a practice\'s state is 1KB of JSON at most, its line masked; read back from the store, a bad one is none', () => {
    const long = '가'.repeat(400)
    const big = fitDrill({ firstTry: { mine: `const k = "${KEY}"`, verdict: 'wrong', feedback: long, nudge: long, at: AT, slip: long, slipType: 'other' }, at: AT })
    expect(jsonBytes(big)).toBeLessThanOrEqual(DRILL_MAX_BYTES)
    expect(big.firstTry!.mine).toBe('const k = "«가림»"')
    expect(big.firstTry!.nudge.length).toBeGreaterThan(20)
    const over = fitDrill({ mine: 'x'.repeat(500), verdict: 'wrong', feedback: long, at: AT })
    expect(jsonBytes(over)).toBeLessThanOrEqual(DRILL_MAX_BYTES)
    expect(over.mine).toHaveLength(160)
    // Read back: a grade drops a first try; a first try needs its question asked back.
    expect(drillStateOf({ verdict: 'right', mine: 'a', feedback: '', isRetried: true, at: AT, firstTry: { mine: 'b', verdict: 'wrong', nudge: '왜?', at: AT, feedback: '' } })).toEqual({ verdict: 'right', mine: 'a', feedback: '', isRetried: true, at: AT })
    expect(drillStateOf({ firstTry: { mine: 'b', verdict: 'partial', nudge: '왜?', at: AT, feedback: '거의' }, at: AT })).toEqual({ firstTry: { mine: 'b', verdict: 'partial', nudge: '왜?', at: AT, feedback: '거의' }, at: AT })
    expect(drillStateOf({ firstTry: { mine: 'b', verdict: 'partial', nudge: '', at: AT }, at: AT })).toEqual({ at: AT })
    expect(drillStateOf({ verdict: 'wrong', isRetried: true, isAnswerSeen: true, at: AT })).toEqual({ verdict: 'wrong', isAnswerSeen: true, at: AT })
    for (const bad of [undefined, null, 'x', [], { verdict: 'right' }, { at: Number.NaN }]) expect(drillStateOf(bad)).toBeUndefined()
    expect(isDrillOver(undefined)).toBe(false)
    expect(isDrillOver({ at: AT, firstTry: { mine: 'a', verdict: 'wrong', feedback: '', nudge: '?', at: AT } })).toBe(false)
    expect(isDrillOver({ at: AT, verdict: 'wrong' })).toBe(true)
    expect(isDrillOver({ at: AT, isAnswerSeen: true })).toBe(true)
  })

  test('a practice counts right or wrong on its day, but not toward the day\'s review of ten', () => {
    const day = '2026-10-03'
    let record = addActivity({}, day, { right: 1, drills: 1 })
    expect(record[day]).toEqual({ notes: 0, right: 1, wrong: 0, drills: 1 })
    record = addActivity(record, day, { wrong: 1 })
    expect(record[day]).toEqual({ notes: 0, right: 1, wrong: 1, drills: 1 })
    // No practice: no field, as a 1.6 record has it.
    expect(addActivity({}, day, { right: 1 })[day]).toEqual({ notes: 0, right: 1, wrong: 0 })
    expect(cleanActivity({ [day]: { notes: 0, right: 1, wrong: 0, drills: 5 } })[day]).toEqual({ notes: 0, right: 1, wrong: 0, drills: 1 })
    expect(cleanActivity({ [day]: { notes: 2, right: 1, wrong: 0, drills: -1 } })[day]).toEqual({ notes: 2, right: 1, wrong: 0 })
    const due = Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`c:d${i}`, { name: `d${i}`, count: 1, firstAt: AT - 30 * 86_400_000, lastAt: AT - 30 * 86_400_000, blurb: '', files: [] }]),
    )
    expect(todayReview(due, { [day]: { notes: 0, right: 3, wrong: 1 } }, AT).left).toBe(6)
    expect(todayReview(due, { [day]: { notes: 0, right: 3, wrong: 1, drills: 2 } }, AT).left).toBe(8)
  })

  test('a note kept for a later session keeps the hunks up to its practice\'s line, so t finds it there', () => {
    const filler = (from: number) => [`@@ -${from},2 +${from},2 @@`, ` // ${'설명 '.repeat(100)}`, `-let v${from} = ${from}`, `+const v${from} = ${from}`].join('\n')
    const diff = [filler(1), filler(40), filler(80), HELLO_DIFF.replace('@@ -10,4 +10,4 @@', '@@ -120,4 +120,4 @@')].join('\n')
    const note: LearnNote = {
      id: 'n1', turnId: 't1', at: AT, prompt: '', answer: '', changes: [change(diff)], moreFiles: 0, status: 'ready', text: NOTE,
      savedAs: 'ready', isPast: false, root: '/proj', updatedAt: AT, concepts: [],
    }
    expect(diff.length).toBeGreaterThan(800)
    const kept = forHistory(note)
    expect(kept.changes[0]!.isCut).toBe(false)
    expect(drillOf(kept.text, kept.changes)).toMatchObject({ n: 122 })
    // A note with no practice is cut as before.
    const plain = forHistory({ ...note, text: NOTE.replace(/### 직접 해 보기[\s\S]*$/, '') })
    expect(plain.changes[0]!.isCut).toBe(true)
    expect(plain.changes[0]!.diff.length).toBeLessThanOrEqual(800)
  })

  test('a quiz has no note\'s own kind any more: every quiz asks with every kind', () => {
    const prompt = quizPrompt([{ name: '클로저', count: 1, firstAt: AT, lastAt: AT, blurb: '바깥 변수를 기억한다', files: [] }], 'beginner')
    expect(prompt).toContain('T1: (예측 · 왜 · 바꿔 보기 중 하나)')
    expect(prompt).not.toContain('예측과 바꿔 보기만')
  })
})
