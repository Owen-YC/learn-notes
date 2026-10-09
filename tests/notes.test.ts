import type { LearnConcept } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  FILES_PER_NOTE,
  beforeAfter,
  changeOf,
  clean,
  closeTicks,
  isMissed,
  listItem,
  markMissed,
  markReviewed,
  parseQuiz,
  quizPick,
  baseNames,
  conceptsMarkdown,
  filesFor,
  recapPrompt,
  recapRange,
  applyHunks,
  isGitMove,
  isRequestOrigin,
  rememberSubmit,
  turnRequest,
  dayBefore,
  journalFileOf,
  rootTag,
  journalEntries,
  journalIndex,
  mergeConcepts,
  noteEntry,
  noteLine,
  recapAgain,
  parseMerge,
  resolveKey,
  searchNotes,
  closeConceptBold,
  conceptKey,
  conceptsOf,
  revealNext,
  countConcepts,
  cleanConcepts,
  fitHistory,
  forHistory,
  jsonBytes,
  progressOf,
  reviewQueue,
  parseCheck,
  checkPrompt,
  isSystemFolder,
  diffHunks,
  joinPath,
  shellTargets,
  deletionHunk,
  isDue,
  addToBank,
  ankiHtml,
  ankiText,
  BANK_KEPT,
  cleanBank,
  dueText,
  dueAt,
  stepOf,
  REVIEW_DAYS,
  creationHunk,
  expandHome,
  failureText,
  fenceFor,
  focus,
  hunksToDiff,
  journalPath,
  journalSection,
  merge,
  notePrompt,
  parseDiff,
  relative,
  summaryOf,
  askPrompt,
  codeFor,
  markPartial,
  marksOf,
  quizPrompt,
  regrade,
  isSameRequest,
  changeSection,
  sideBySide,
  wordDiff,
  PAIRS_WEIGHED,
  BOLD,
  SYSTEM,
  ASK_SYSTEM,
  RECAP_SYSTEM,
  QUIZ_SYSTEM,
  CHECK_SYSTEM,
  REDACTED,
  isGeneratedFile,
  isSecretFile,
  matchesPattern,
  redactLines,
  redactText,
  withheldOf,
  withheldText,
  ACTIVITY_DAYS,
  addUsage,
  cleanUsage,
  isFormatOnly,
  parseTeamFile,
  teamSection,
  teamText,
  tokenText,
  usageLine,
  TEAM_BUDGET,
  type Hunk,
} from '../hooks/notes'

const HUNK: Hunk = {
  oldStart: 3,
  oldLines: 3,
  newStart: 3,
  newLines: 3,
  lines: [' const a = 1', '-let b = 2', '+const b = 2', ' export { a, b }'],
}

describe('diff text', () => {
  test('whole hunks round-trip through the text', () => {
    const { diff, isCut } = hunksToDiff([HUNK])
    expect(isCut).toBe(false)
    expect(diff.startsWith('@@ -3,3 +3,3 @@\n')).toBe(true)
    expect(parseDiff(diff)).toEqual([HUNK])
  })

  test('a hunk too long alone keeps its head and a recounted header', () => {
    const lines = Array.from({ length: 200 }, (_, i) => (i % 2 === 0 ? `+added line ${i}` : ` kept line ${i}`))
    const big: Hunk = { oldStart: 1, oldLines: 100, newStart: 1, newLines: 200, lines }
    const { diff, isCut } = hunksToDiff([big], 600)
    expect(isCut).toBe(true)
    expect(diff.length).toBeLessThanOrEqual(600)
    const [back] = parseDiff(diff)
    const added = back!.lines.filter(line => line.startsWith('+')).length
    const context = back!.lines.filter(line => line.startsWith(' ')).length
    expect(back!.newLines).toBe(added + context)
    expect(back!.oldLines).toBe(context)
  })

  test('a big replacement keeps both its removals and its additions', () => {
    const lines = [
      ...Array.from({ length: 150 }, (_, i) => `-old line number ${i}`),
      ...Array.from({ length: 150 }, (_, i) => `+new line number ${i}`),
    ]
    const { diff, isCut } = hunksToDiff([{ oldStart: 1, oldLines: 150, newStart: 1, newLines: 150, lines }])
    expect(isCut).toBe(true)
    const [back] = parseDiff(diff)
    const { before, after } = beforeAfter(back!)
    expect(before).toContain('old line number 0')
    expect(after).toContain('new line number 0')
    expect(back!.oldLines).toBe(back!.lines.filter(line => line.startsWith('-')).length)
    expect(back!.newLines).toBe(back!.lines.filter(line => line.startsWith('+')).length)
  })

  test('one line longer than the budget still leaves a diff', () => {
    const long = `+${'x'.repeat(9000)}`
    const { diff, isCut } = hunksToDiff([{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 1, lines: [long] }])
    expect(isCut).toBe(true)
    expect(diff.length).toBeLessThan(4100)
    expect(parseDiff(diff)[0]!.newLines).toBe(1)
  })

  test('later hunks that do not fit are dropped whole', () => {
    const { diff, isCut } = hunksToDiff([HUNK, { ...HUNK, oldStart: 40, newStart: 40 }], 80)
    expect(isCut).toBe(true)
    expect(parseDiff(diff)).toHaveLength(1)
  })

  test('control characters and carriage returns are dropped', () => {
    expect(clean('a\r\nb\u0007c\td')).toBe('a\nbc\td')
  })

  test('before and after come apart from one hunk', () => {
    expect(beforeAfter(HUNK)).toEqual({
      before: 'const a = 1\nlet b = 2\nexport { a, b }',
      after: 'const a = 1\nconst b = 2\nexport { a, b }',
    })
  })

  test('focus keeps the change and one line around it, renumbered', () => {
    const h: Hunk = {
      oldStart: 10,
      oldLines: 7,
      newStart: 10,
      newLines: 7,
      lines: [' a', ' b', ' c', '-d', '+D', ' e', ' f', ' g'],
    }
    expect(focus(h)).toEqual({ oldStart: 12, oldLines: 3, newStart: 12, newLines: 3, lines: [' c', '-d', '+D', ' e'] })
  })

  test('a fence is longer than any backtick run in the diff', () => {
    expect(fenceFor('plain')).toBe('```')
    expect(fenceFor(' ```\n+````js')).toBe('`````')
  })

  test('a journal section keeps a diff with fences inside its own fence', () => {
    const md = changeOf({
      path: '/proj/README.md',
      root: '/proj',
      tool: 'Edit',
      kind: 'update',
      hunks: [{ oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: [' ```', '-old', '+new'] }],
    })
    const section = journalSection({
      id: 'n',
      turnId: 't',
      at: 0,
      prompt: '',
      answer: '',
      changes: [md],
      moreFiles: 0,
      status: 'ready',
      text: 'note',
      savedAs: null,
      isPast: false,
      concepts: [],
      root: '/proj',
      updatedAt: 0,
    })
    expect(section).toContain('````diff\n')
  })

  test('a new file is one all-added hunk', () => {
    const h = creationHunk('one\ntwo\n')
    expect(h).toEqual({ oldStart: 0, oldLines: 0, newStart: 1, newLines: 2, lines: ['+one', '+two'] })
  })
})

describe('changes', () => {
  const change = (path: string) =>
    changeOf({ path, root: '/proj', tool: 'Edit', kind: 'update', hunks: [HUNK] })

  test('paths inside the project read relative', () => {
    expect(change('/proj/src/a.ts').file).toBe('src/a.ts')
    expect(change('/elsewhere/b.ts').file).toBe('/elsewhere/b.ts')
    expect(change('/proj/src/a.ts')).toMatchObject({ added: 1, removed: 1 })
  })

  test('windows paths read relative too', () => {
    expect(relative('C:\\proj\\src\\a.ts', 'C:\\proj')).toBe('src/a.ts')
    expect(relative('/proj2/a.ts', '/proj')).toBe('/proj2/a.ts')
  })

  test('a tool with no diff makes a change marked as cut', () => {
    const none = changeOf({ path: '/proj/big.ts', root: '/proj', tool: 'Write', kind: 'update', hunks: [] })
    expect(none).toMatchObject({ diff: '', isCut: true, added: 0, removed: 0 })
  })

  test('a second edit of a file joins its first', () => {
    const first = merge([], change('/proj/a.ts')).changes
    const { changes } = merge(first, change('/proj/a.ts'))
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ added: 2, removed: 2 })
    expect(parseDiff(changes[0]!.diff)).toHaveLength(2)
  })

  test('files past the limit are counted, not kept', () => {
    let list = merge([], change('/proj/0.ts')).changes
    for (let i = 1; i < FILES_PER_NOTE; i += 1) list = merge(list, change(`/proj/${i}.ts`)).changes
    const over = merge(list, change('/proj/over.ts'))
    expect(over.dropped).toBe('/proj/over.ts')
    expect(over.changes).toHaveLength(FILES_PER_NOTE)
  })
})

describe('the note', () => {
  test('the prompt carries the request, the diff and the five headings', () => {
    const text = notePrompt(
      {
        prompt: '버튼 색을 바꿔줘',
        answer: '색을 바꿨습니다',
        changes: [changeOf({ path: '/proj/a.ts', root: '/proj', tool: 'Edit', kind: 'update', hunks: [HUNK] })],
        moreFiles: 2,
      },
      'beginner',
    )
    expect(text).toContain('버튼 색을 바꿔줘')
    expect(text).toContain('+const b = 2')
    expect(text).toContain('### a.ts (수정, +1 −1)')
    expect(text).toContain('파일 2개가 더')
    for (const heading of ['한 줄 요약', '무엇이 바뀌었나', '왜 이렇게 바꿨을까', '배울 개념', '직접 확인해 볼 것']) {
      expect(text).toContain(`### ${heading}`)
    }
  })

  test('the summary is the first line under its heading', () => {
    expect(summaryOf('### 한 줄 요약\n\n- 상태를 한 곳으로 모았다\n### 무엇이 바뀌었나\n...')).toBe('상태를 한 곳으로 모았다')
    expect(summaryOf('')).toBe('')
  })

  test('the journal is one file per day and project', () => {
    const path = journalPath('/home/u/.claude/learning-notes/', Date.UTC(2026, 9, 3, 3), '/work/my app')
    expect(path).toMatch(/^\/home\/u\/\.claude\/learning-notes\/2026-10-0[23]_my_app_[0-9a-z]{5}\.md$/)
    expect(journalPath('/n', Date.UTC(2026, 9, 3, 3), 'C:\\Users\\me\\proj', 2)).toMatch(/^\/n\/2026-10-0[23]_proj_[0-9a-z]{5}~2\.md$/)
  })

  test('a save folder under ~ reads as the home folder', () => {
    expect(expandHome('~/notes', '/home/u')).toBe('/home/u/notes')
    expect(expandHome('~', '/home/u/')).toBe('/home/u')
    expect(expandHome('/abs/~x', '/home/u')).toBe('/abs/~x')
    expect(expandHome('~/notes', undefined)).toBe('~/notes')
  })

  test('a blurb cut inside inline code gets the code closed', () => {
    expect(closeTicks('`a` and `b')).toBe('`a` and `b`')
    expect(closeTicks('`a` and `b…')).toBe('`a` and `b`…')
    expect(closeTicks('`a` done')).toBe('`a` done')
  })

  test('failures read as what to do next', () => {
    expect(failureText({ reason: 'api-error', status: 429, error: 'rate_limit' })).toBe('요청 한도에 걸렸습니다. 잠시 뒤 다시 해 보세요')
    expect(failureText({ reason: 'api-error', status: 500, error: 'server_error' })).toBe('API 오류 500. 잠시 뒤 다시 해 보세요')
    expect(failureText({ reason: 'api-error', status: 401, error: 'authentication_failed' })).toBe('로그인이 필요합니다 (/login)')
    expect(failureText({ reason: 'aborted' })).toContain('멈췄습니다')
  })

  test('the prompt says which diffs were cut and leans on the request and answer', () => {
    const big = changeOf({
      path: '/proj/big.ts',
      root: '/proj',
      tool: 'Write',
      kind: 'create',
      hunks: [creationHunk(Array.from({ length: 400 }, (_, i) => `const value${i} = compute(${i}) // a longer line`).join('\n'))],
    })
    const text = notePrompt({ prompt: 'p', answer: 'a', changes: [big], moreFiles: 0 }, 'beginner')
    expect(text).toContain('길어서 앞부분만 실음')
  })
})

describe('concepts', () => {
  const names = (text: string) => conceptsOf(text).map(one => one.name)

  test('one concept keeps one key across spellings, glosses and dashes', () => {
    expect(conceptKey('구조 분해 할당 (Destructuring)')).toBe(conceptKey('구조 분해 할당'))
    expect(conceptKey('for...of 반복문')).toBe(conceptKey('for-of 반복문'))
    expect(conceptKey('for…of 반복문')).toBe(conceptKey('for...of 반복문'))
    expect(conceptKey('AND 연산자 (&&)')).toBe('c:and연산자')
    expect(conceptKey('constructor')).toBe('c:constructor')
  })

  test('the section is found under the headings models write', () => {
    for (const heading of ['### 배울 개념', '## 배울 개념', '### 4. 배울 개념', '### 📚 배울 개념', '**배울 개념**', '##### 배울 개념들']) {
      expect(names(`${heading}\n- **클로저**: 설명`)).toEqual(['클로저'])
    }
  })

  test('names come out clean of review marks and trailing colons', () => {
    const text = [
      '### 배울 개념',
      '- **(복습) 클로저**: a',
      '- **화살표 함수 [복습]**: b',
      '- **구조 분해 할당:** c',
      '- **useState** *(복습)*: d',
      '1. **for...of 반복문 (복습)**: e',
      '+ **템플릿 리터럴**: f',
    ].join('\n')
    const found = conceptsOf(text)
    expect(found.map(one => one.name)).toEqual(['클로저', '화살표 함수', '구조 분해 할당', 'useState', 'for...of 반복문', '템플릿 리터럴'])
    expect(found[3]!.blurb).toBe('d')
  })

  test('sub-bullets, code blocks and the next section are not concepts', () => {
    const text = [
      '### 배울 개념',
      '- **클로저**: 함수가 바깥 변수를 기억한다',
      '  - **예시**: 카운터',
      '  - **주의할 점**: 메모리',
      '```js',
      '- **코드 안**: 아님',
      '```',
      '직접 확인해 볼 것:',
      '- **실행**: 아님',
    ].join('\n')
    expect(names(text)).toEqual(['클로저'])
  })

  test('a bold label line ends the section too', () => {
    expect(names('### 배울 개념\n- **A**: a\n**직접 확인해 볼 것**\n- **B**: b')).toEqual(['A'])
  })

  // haiku's own note (Windows Terminal run, 1.4.0): the second name opened in bold and never closed.
  const OPEN_BOLD_NOTE = [
    '### 배울 개념',
    '- **선택적 속성 (복습)**: `quantity?`처럼 물음표를 붙여 있어도 되고 없어도 되는 속성을 표시합니다 — ``@param {Array<{price: number, quantity?: number}>}``',
    '- **널 병합 연산자 (??): 왼쪽 값이 `null`이나 `undefined`이면 오른쪽 값을 쓰는 연산자로, 기본값을 편하게 정할 수 있습니다 — ``const quantity = item?.quantity ?? 1;``',
    '- **누적 계산 (복습)**: `reduce()`로 배열의 모든 항목을 하나씩 처리하면서 결과를 누적합니다 — ``items.reduce((total, item, i) => { ... }, 0)``',
    '',
    '### 직접 확인해 볼 것',
    '- `getCartTotal([{ price: 1000 }])`를 실행해 보세요.',
  ].join('\n')

  test('a name the model opened in bold and never closed runs to its colon, not out of the concepts (1.5.1)', () => {
    const found = conceptsOf(OPEN_BOLD_NOTE)
    expect(found.map(one => one.name)).toEqual(['선택적 속성', '널 병합 연산자 (??)', '누적 계산'])
    expect(found[1]!.key).toBe(conceptKey('널 병합 연산자'))
    expect(found[1]!.blurb.startsWith('왼쪽 값이 `null`이나')).toBe(true)
  })

  test('an open bold that is no concept line stays out (1.5.1)', () => {
    // No colon to end the name at; a colon inside the name; a sub-bullet; no bullet at all.
    expect(names('### 배울 개념\n- **클로저 — 바깥 변수를 기억한다')).toEqual([])
    expect(names('### 배울 개념\n- **std::move 이동 의미론: 값을 옮긴다')).toEqual([])
    expect(names('### 배울 개념\n- **CSS :hover 선택자: 마우스가 올라간 요소')).toEqual([])
    expect(names('### 배울 개념\n- **A**: a\n  - **예시: 카운터')).toEqual(['A'])
    expect(names('### 배울 개념\n**참고: 아래 예시는 브라우저에서만 돈다\n- **A**: a')).toEqual(['A'])
    // A section label left open, nothing after its colon: at the end of the line, before a trailing space, full-width.
    for (const label of ['- **직접 확인해 볼 것:', '- **직접 확인해 볼 것: ', '- **직접 확인해 볼 것：']) {
      expect(names(`### 배울 개념\n${label}\n- **A**: a`)).toEqual(['A'])
    }
    // A name of no words is none, and is not closed into four stars.
    expect(names('### 배울 개념\n- ** : 설명')).toEqual([])
    expect(closeConceptBold('### 배울 개념\n- ** : 설명')).toBe('### 배울 개념\n- ** : 설명')
    // Full-width colon and a numbered entry read as the others do.
    expect(names('### 배울 개념\n- **전각 콜론：설명\n2. **번호 항목: 설명')).toEqual(['전각 콜론', '번호 항목'])
  })

  test('the note keeps its words, the open bold closed at its colon, and reads back the same (1.5.1)', () => {
    const closed = closeConceptBold(OPEN_BOLD_NOTE)
    const lines = closed.split('\n')
    expect(lines[2]).toBe('- **널 병합 연산자 (??)**: 왼쪽 값이 `null`이나 `undefined`이면 오른쪽 값을 쓰는 연산자로, 기본값을 편하게 정할 수 있습니다 — ``const quantity = item?.quantity ?? 1;``')
    // Every other line as it was, and the closed note gives the same concepts as the open one.
    expect(lines.filter((_line, i) => i !== 2)).toEqual(OPEN_BOLD_NOTE.split('\n').filter((_line, i) => i !== 2))
    expect(conceptsOf(closed)).toEqual(conceptsOf(OPEN_BOLD_NOTE))
    // Outside the concepts, an open bold is the model's own and is left; so is a line whose bold is closed already.
    const elsewhere = '### 한 줄 요약\n- **요약: 그대로\n### 배울 개념\n- **A**: a\n- **클로저: 바깥 변수를 기억하는 함수**\n```\n- **코드: 그대로\n```'
    expect(closeConceptBold(elsewhere)).toBe(elsewhere)
  })

  test('a scroll to a row just put in the tree is tried again while it is not drawn, and only then (1.5.1)', () => {
    // The engine's own reasons (claude.exe 2.1.289).
    expect(revealNext(undefined, 3)).toBe('done')
    expect(revealNext('no element of its own is drawn under that key', 3)).toBe('again')
    expect(revealNext('no element of its own is drawn under that key', 0)).toBe('stop')
    expect(revealNext("not this plugin's site", 3)).toBe('stop')
    expect(revealNext('no such site', 3)).toBe('stop')
    expect(revealNext('the window moved meanwhile', 3)).toBe('stop')
  })

  test('rewriting an older note moves neither date the wrong way', () => {
    const later = Date.UTC(2026, 9, 2)
    const earlier = Date.UTC(2026, 8, 1)
    const index = countConcepts({}, [{ key: 'c:x', name: 'X', blurb: 'new' }], [], later, [])
    const again = countConcepts(index, [{ key: 'c:x', name: 'X', blurb: 'old' }], [], earlier, [])
    expect(again['c:x']).toMatchObject({ count: 2, firstAt: earlier, lastAt: later, blurb: 'new' })
  })

  test('a stored index from an older build or a bad write is cleaned', () => {
    const cleaned = cleanConcepts({
      'for...of반복문': { name: 'for...of 반복문', count: 2, firstAt: 1, lastAt: 5, blurb: 'b', files: ['a.ts'] },
      'c:forof반복문': { name: 'for-of 반복문', count: 1, firstAt: 3, lastAt: 9, blurb: '', files: [] },
      constructor: { name: undefined, count: null },
      bad: 'x',
    })
    expect(Object.keys(cleaned)).toEqual(['c:forof반복문'])
    expect(cleaned['c:forof반복문']).toMatchObject({ name: 'for...of 반복문', count: 3, firstAt: 1, lastAt: 9 })
  })

  test('progress counts the last week, and the review queue holds what is due, the longest overdue first', () => {
    const now = Date.UTC(2026, 9, 3)
    const day = 86_400_000
    const index = {
      'c:a': { name: 'A', count: 1, firstAt: now - day, lastAt: now - day, blurb: '', files: [] },
      'c:b': { name: 'B', count: 3, firstAt: now - 30 * day, lastAt: now - 2 * day, blurb: '', files: [] },
      'c:c': { name: 'C', count: 1, firstAt: now - 20 * day, lastAt: now - 20 * day, blurb: '', files: [] },
      'c:d': { name: 'D', count: 1, firstAt: now - 9 * day, lastAt: now - 9 * day, blurb: '', files: [] },
    }
    expect(progressOf(index, now)).toEqual({ fresh: 1, again: 1 })
    const twice = { ...index, 'c:e': { name: 'E', count: 2, firstAt: now - 2 * day, lastAt: now - day, blurb: '', files: [] } }
    expect(progressOf(twice, now)).toEqual({ fresh: 2, again: 2 })
    // Met once: due a day after. Met three times: step 2, due a week after (B, five days from now).
    expect(reviewQueue(index, now).map(one => one.name)).toEqual(['C', 'D', 'A'])
  })
})

describe('history', () => {
  test('a stored note keeps a short text and short diffs', () => {
    const long = Array.from({ length: 300 }, (_, i) => `+line ${i} with some code in it`)
    const note = {
      id: 'n', turnId: 't', at: 0, prompt: 'p'.repeat(2000), answer: '', moreFiles: 0, status: 'ready' as const,
      text: '가'.repeat(9000), savedAs: null, isPast: false, concepts: [], root: '/proj', updatedAt: 0,
      changes: [changeOf({ path: '/proj/a.ts', root: '/proj', tool: 'Write', kind: 'create', hunks: [{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 300, lines: long }] })],
    }
    const kept = forHistory(note)
    expect(kept.text.length).toBeLessThanOrEqual(3000)
    expect(kept.prompt.length).toBeLessThanOrEqual(600)
    expect(kept.changes[0]!.diff.length).toBeLessThanOrEqual(800)
    expect(kept.changes[0]!.isCut).toBe(true)
  })

  test('fitting the budget drops the least recent other project, then the oldest own notes', () => {
    const note = (id: string) => ({ id, at: 1, text: 'x'.repeat(1000) }) as never
    const history = {
      '/a': { at: 1, notes: [note('a1')] },
      '/b': { at: 2, notes: [note('b1')] },
      '/me': { at: 3, notes: [note('m1'), note('m2'), note('m3')] },
    }
    const one = fitHistory(history, '/me', jsonBytes(history) - 10)
    expect(Object.keys(one)).toEqual(['/b', '/me'])
    const tight = fitHistory(history, '/me', 2200)
    expect(Object.keys(tight)).toEqual(['/me'])
    expect(tight['/me']!.notes.map((n: { id: string }) => n.id)).toEqual(['m2', 'm3'])
  })
})

describe('finding and merging', () => {
  const note = (id: string, at: number, extra: Partial<Parameters<typeof noteLine>[0]> = {}) => ({
    id, turnId: id, at, prompt: '', answer: '', moreFiles: 0, status: 'ready' as const, text: '',
    savedAs: null, isPast: false, concepts: [] as string[], root: '/home/me/shop', updatedAt: at,
    changes: [changeOf({ path: '/home/me/shop/src/cart.js', root: '/home/me/shop', tool: 'Edit', kind: 'update', hunks: [HUNK] })],
    ...extra,
  })

  test('search matches request, text, file and concept, the newest first, ignoring case', () => {
    const list = [
      note('a', 1, { prompt: 'Login 버튼 고쳐줘' }),
      note('b', 2, { text: '### 한 줄 요약\nlogin 처리를 바꿨다' }),
      note('c', 3, { concepts: ['c:forof반복문'] }),
    ]
    expect(searchNotes(list, 'LOGIN').map(n => n.id)).toEqual(['b', 'a'])
    expect(searchNotes(list, 'for-of 반복문').map(n => n.id)).toEqual(['c'])
    expect(searchNotes(list, 'cart.js')).toHaveLength(3)
    expect(searchNotes(list, '  ')).toEqual([])
  })

  test('a note line says when, which project, the file and the summary', () => {
    const now = Date.UTC(2026, 9, 3, 5)
    const line = noteLine(note('a', now, { text: '### 한 줄 요약\n합계를 고쳤다', moreFiles: 2 }), now)
    expect(line).toMatch(/^\d\d:\d\d · shop · src\/cart\.js 외 2개 — 합계를 고쳤다$/)
    expect(noteLine(note('b', now, { status: 'failed', prompt: '요청\n두 줄' }), now)).toMatch(/— 요청 두 줄$/)
  })

  test('a journal day reads back as time, request and summary', () => {
    const md = [
      '# 학습 노트 · 2026-10-03 · /proj',
      '',
      '## 2026-10-03 05:12',
      '',
      '**요청**: 첫 요청',
      '',
      '### 한 줄 요약',
      '첫 요약',
      '',
      '## 2026-10-03 06:40 (다시 쓴 노트)',
      '',
      '**요청**: 둘째 요청',
      '',
      '_노트 없이 전후 코드만 남겼다._',
    ].join('\n')
    expect(journalIndex(md)).toEqual([
      { time: '05:12', request: '첫 요청', summary: '첫 요약', isRewrite: false },
      { time: '06:40', request: '둘째 요청', summary: '', isRewrite: true },
    ])
  })

  test('merge arguments split on the usual arrows and bars', () => {
    expect(parseMerge('Destructuring = 구조 분해 할당')).toEqual({ from: 'Destructuring', into: '구조 분해 할당' })
    for (const sep of ['=>', '->', '→', '|']) expect(parseMerge(`a ${sep} b`)).toEqual({ from: 'a', into: 'b' })
    expect(parseMerge('하나만')).toBeUndefined()
    expect(parseMerge('a = b = c')).toBeUndefined()
    expect(parseMerge(' = b')).toBeUndefined()
  })

  test('aliases follow a chain and stop on a loop', () => {
    expect(resolveKey({ 'c:a': 'c:b', 'c:b': 'c:c' }, 'c:a')).toBe('c:c')
    expect(resolveKey({ 'c:a': 'c:b', 'c:b': 'c:a' }, 'c:a')).toMatch(/^c:[ab]$/)
    expect(resolveKey({}, 'c:x')).toBe('c:x')
  })

  test('merging adds counts and keeps the widest dates; merging into a new name renames', () => {
    const index = {
      'c:a': { name: 'A', count: 2, firstAt: 5, lastAt: 9, blurb: 'a', files: ['x.ts'] },
      'c:b': { name: 'B', count: 1, firstAt: 1, lastAt: 7, blurb: 'b', files: ['y.ts'] },
    }
    expect(mergeConcepts(index, 'c:a', 'c:b', 'B')).toEqual({
      'c:b': { name: 'B', count: 3, firstAt: 1, lastAt: 9, blurb: 'a', files: ['y.ts', 'x.ts'] },
    })
    expect(mergeConcepts(index, 'c:a', 'c:new', '새 이름')['c:new']).toMatchObject({ name: '새 이름', count: 2 })
    expect(mergeConcepts(index, 'c:none', 'c:b', 'B')).toEqual(index)
  })
})

describe('second review', () => {
  test('journal names keep projects apart: shop vs shop-2, two folders named alike, Korean folders (R5)', () => {
    const at = Date.UTC(2026, 9, 3, 3)
    const shop = journalPath('/n', at, '/w/shop')
    const shop2 = journalPath('/n', at, '/w/shop-2')
    expect(shop).not.toBe(journalPath('/n', at, '/w/shop-2', 1))
    expect(journalPath('/n', at, '/w/shop', 2)).not.toBe(shop2)
    expect(journalFileOf(shop2.split('/').at(-1)!, '/w/shop')).toBeUndefined()
    expect(journalFileOf(journalPath('/n', at, '/other/shop').split('/').at(-1)!, '/w/shop')).toBeUndefined()
    expect(journalFileOf(journalPath('/n', at, '/w/shop', 3).split('/').at(-1)!, '/w/shop')).toMatchObject({ part: 3 })
    expect(journalPath('/n', at, '/w/쇼핑몰')).toContain('_쇼핑몰_')
    expect(journalPath('/n', at, '/w/쇼핑몰')).not.toBe(journalPath('/n', at, '/w/연습'))
    expect(rootTag('/w/shop')).toBe(rootTag('/w/shop/'))
    expect(rootTag('/w/shop')).toMatch(/^[0-9a-z]{5}$/)
  })

  test('a model heading of ## inside a note does not split the day (R15)', () => {
    const md = '## 2026-10-03 05:12\n\n**요청**: 요청\n\n## 한 줄 요약\n요약이다\n'
    expect(journalIndex(md)).toEqual([{ time: '05:12', request: '요청', summary: '요약이다', isRewrite: false }])
  })

  test('the day before is the calendar day before (R14)', () => {
    expect(dayBefore(new Date(2026, 9, 3, 0, 30).getTime())).toBe('2026-10-02')
    expect(dayBefore(new Date(2026, 2, 9, 0, 30).getTime())).toBe('2026-03-08')
  })

  test('merge arguments keep operator names whole when spaced (R12)', () => {
    expect(parseMerge('화살표 함수 (=>) = Arrow function')).toEqual({ from: '화살표 함수 (=>)', into: 'Arrow function' })
    expect(parseMerge('논리 OR (||) -> 논리합')).toEqual({ from: '논리 OR (||)', into: '논리합' })
  })

  test('find skips the placeholder words of failed notes (R16)', () => {
    const base = {
      turnId: 't', at: 1, prompt: '', answer: '', moreFiles: 0, savedAs: null, isPast: false, concepts: [],
      root: '/p', updatedAt: 1, changes: [],
    }
    const list = [
      { ...base, id: 'f', status: 'failed' as const, text: '세션이 끝나 노트를 다 쓰지 못했습니다 · w로 다시 쓰기' },
      { ...base, id: 'r', status: 'ready' as const, text: '다시 렌더링한다' },
    ]
    expect(searchNotes(list, '다시').map(n => n.id)).toEqual(['r'])
  })

  test('an index whose merge target fell out is one row again once aliases are applied (R2)', () => {
    const raw = {
      'c:destructuring': { name: 'Destructuring', count: 2, firstAt: 1, lastAt: 5, blurb: '', files: [] },
      'c:구조분해할당': { name: 'Destructuring', count: 1, firstAt: 6, lastAt: 9, blurb: '', files: [] },
    }
    const cleaned = cleanConcepts(raw, { 'c:destructuring': 'c:구조분해할당' })
    expect(Object.keys(cleaned)).toEqual(['c:구조분해할당'])
    expect(cleaned['c:구조분해할당']!.count).toBe(3)
  })
})

describe('who asked', () => {
  test('a request comes from a person, a schedule or a coordinating session; notifications and peers carry on', () => {
    for (const kind of ['composer', 'bridge', 'sdk', 'channel', 'slack-ping', 'scheduled-trigger', 'coordinator', 'projects-relay'])
      expect(isRequestOrigin({ kind })).toBe(true)
    for (const kind of ['task-notification', 'peer', 'peer-send-message', 'plugin', 'observer', 'auto-continuation', 'unclassified'])
      expect(isRequestOrigin({ kind })).toBe(false)
    expect(isRequestOrigin({ kind: 'plugin', asUser: true })).toBe(true)
    expect(isRequestOrigin(undefined)).toBe(true)
  })

  test('a turn started by something else carries on the last request', () => {
    expect(turnRequest('고쳐줘', [{ text: '고쳐줘', isRequest: true }], '고쳐줘')).toBe('고쳐줘')
    expect(turnRequest('<agent-message>보고</agent-message>', [{ text: '<agent-message>보고</agent-message>', isRequest: false }], '계속 해줘')).toBe(
      '(이어서) 계속 해줘',
    )
    expect(turnRequest('알림', [{ text: '알림', isRequest: false }], undefined)).toBe('(알림으로 시작한 턴)')
    // A turn whose prompt was never seen entering (an older engine) is taken as a request.
    expect(turnRequest('직접 입력', [], undefined)).toBe('직접 입력')
    expect(turnRequest('새 글', [{ text: '다른 글', isRequest: false }], 'x')).toBe('새 글')
    // Two notifications queued before either turn starts: each turn finds its own.
    const queued = [{ text: '하나', isRequest: false }, { text: '둘', isRequest: false }]
    expect(turnRequest('하나', queued, '고쳐줘')).toBe('(이어서) 고쳐줘')
    // The same text typed later by the person counts as theirs.
    expect(turnRequest('하나', [...queued, { text: '하나', isRequest: true }], '고쳐줘')).toBe('하나')
  })

  test('the remembered prompts keep the newest ten, each text once', () => {
    let list = [] as { text: string; isRequest: boolean }[]
    for (let i = 0; i < 12; i++) list = rememberSubmit(list, { text: `t${i}`, isRequest: false })
    expect(list.map(one => one.text)).toEqual(['t2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11'])
    list = rememberSubmit(list, { text: 't5', isRequest: true })
    expect(list.at(-1)).toEqual({ text: 't5', isRequest: true })
    expect(list.filter(one => one.text === 't5')).toHaveLength(1)
  })
})

describe('concept files and recaps', () => {
  const change = (path: string, lines: string[]) =>
    changeOf({ path: `/p/${path}`, root: '/p', tool: 'Edit', kind: 'update', hunks: [{ oldStart: 1, oldLines: 0, newStart: 1, newLines: lines.length, lines }] })
  const changes = [change('src/a.ts', ['+const total = items.reduce((s, x) => s + x, 0)']), change('src/b.ts', ['+for (const order of orders) {'])]

  test('a concept is seen in the file whose diff holds the code it quotes', () => {
    expect(filesFor('반복문 — `for (const order of orders)`', changes)).toEqual(['src/b.ts'])
    expect(filesFor('줄이기 — `items.reduce((s,x)=>s+x,0)`', changes)).toEqual(['src/a.ts'])
    expect(filesFor('코드 인용 없음', changes)).toEqual(['src/a.ts'])
    expect(filesFor('다른 코드 — `while (true)`', changes)).toEqual(['src/a.ts'])
  })

  test('concepts.md lists file names, not paths', () => {
    expect(baseNames(['src/a.ts', 'lib/a.ts', 'src/b.ts'])).toEqual(['a.ts', 'b.ts'])
    const md = conceptsMarkdown({ 'c:x': { name: 'X', count: 1, firstAt: 0, lastAt: 0, blurb: 'b', files: ['.claude/mods/x/hooks/notes.ts'] } })
    expect(md).toContain('| notes.ts |')
  })

  test('recap ranges cover today, yesterday, this week from Monday, the last seven days or one date', () => {
    const now = new Date(2026, 9, 3, 15, 0).getTime()
    expect(recapRange('', now)).toMatchObject({ label: '오늘', days: ['2026-10-03'] })
    expect(recapRange('어제', now)).toMatchObject({ label: '어제', days: ['2026-10-02'] })
    // 2026-10-03 is a Saturday: this week began on Monday the 28th.
    expect(recapRange('이번주', now)).toMatchObject({ label: '이번 주', days: ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'] })
    expect(recapRange('이번 주', now)!.from).toBe(new Date(2026, 8, 28).getTime())
    const monday = new Date(2026, 8, 28, 9).getTime()
    expect(recapRange('이번주', monday)!.days).toEqual(['2026-09-28'])
    expect(recapRange('최근 7일', now)!.days).toEqual(['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'])
    expect(recapRange('2026-09-30', now)).toMatchObject({ label: '2026-09-30', days: ['2026-09-30'] })
    expect(recapRange('2026-02-30', now)).toBeUndefined()
    expect(recapRange('내일', now)).toBeUndefined()
  })

  test('the recap prompt lists each note with its request, summary, files and concepts', () => {
    const now = new Date(2026, 9, 3, 15, 0).getTime()
    const range = recapRange('', now)!
    const note = {
      id: 'n', turnId: 't', at: now - 3_600_000, prompt: '버튼 고쳐줘', answer: '', moreFiles: 0, status: 'ready' as const,
      text: '### 한 줄 요약\n버튼을 고쳤다', savedAs: null, isPast: false, concepts: ['c:old'], root: '/p', updatedAt: 0, changes,
    }
    const index = {
      'c:new': { name: '이벤트 핸들러', count: 3, firstAt: now - 30 * 86_400_000, lastAt: now - 3_600_000, blurb: '', files: [] },
    }
    const text = recapPrompt(range, [noteEntry(note, index, { 'c:old': 'c:new' })], index, { 'c:old': 'c:new' }, 'beginner')
    expect(text).toContain('요청: 버튼 고쳐줘 · 요약: 버튼을 고쳤다 · 파일: a.ts, b.ts · 개념: 이벤트 핸들러')
    expect(text).toContain('## 이 기간에 다시 만난 개념 (예전에 배운 것)\n이벤트 핸들러 ×3')
    for (const heading of ['한 일', '핵심 개념', '헷갈리기 쉬운 것', '다음에 해 볼 것']) expect(text).toContain(`### ${heading}`)
  })
})

describe('quiz', () => {
  const now = Date.UTC(2026, 9, 3)
  const day = 86_400_000
  const index = {
    'c:old': { name: '클로저', count: 1, firstAt: now - 20 * day, lastAt: now - 20 * day, blurb: 'a', files: [] },
    'c:older': { name: '호이스팅', count: 1, firstAt: now - 30 * day, lastAt: now - 30 * day, blurb: 'b', files: [] },
    'c:often': { name: 'for...of', count: 4, firstAt: now - 40 * day, lastAt: now - 10 * day, blurb: 'c', files: [] },
    'c:new': { name: '화살표 함수', count: 1, firstAt: now - day, lastAt: now - day, blurb: 'd', files: [] },
  }

  test('a quiz picks what is due first, the longest overdue first, then what falls due soonest', () => {
    expect(quizPick(index, now).map(one => one.name)).toEqual(['호이스팅', '클로저', '화살표 함수'])
    expect(quizPick(index, now, 4).map(one => one.name)).toEqual(['호이스팅', '클로저', '화살표 함수', 'for...of'])
    expect(quizPick({}, now)).toEqual([])
  })

  test('going over a concept in a quiz takes it off the review queue', () => {
    const reviewed = markReviewed(index, ['c:older', 'c:none'], now)
    expect(reviewed['c:older']!.reviewedAt).toBe(now)
    expect(reviewed['c:older']!.step).toBe(1)
    expect(dueText(reviewed['c:older']!, now)).toBe('3일 뒤')
    expect(reviewQueue(reviewed, now).map(one => one.name)).toEqual(['클로저', '화살표 함수'])
    expect(quizPick(reviewed, now)[0]!.name).toBe('클로저')
  })

  test('questions and answers are read in the forms models write them', () => {
    const picks = quizPick(index, now)
    const text = [
      '**Q1:** 다음 코드에서 함수를 선언 전에 부를 수 있는 이유는?',
      '**A1:** 선언이 위로 끌어올려지기 때문이다.',
      'Q2. 바깥 변수를 기억하는 함수를 뭐라 할까?',
      'A2) 클로저',
      'Q3：배열을 하나씩 도는 문법은?',
    ].join('\n')
    expect(parseQuiz(text, picks)).toEqual([
      { key: 'c:older', name: '호이스팅', question: '다음 코드에서 함수를 선언 전에 부를 수 있는 이유는?', answer: '선언이 위로 끌어올려지기 때문이다.' },
      { key: 'c:old', name: '클로저', question: '바깥 변수를 기억하는 함수를 뭐라 할까?', answer: '클로저' },
    ])
    expect(parseQuiz('그냥 글', picks)).toEqual([])
  })
})

test('a quiz question keeps the code block under its first line (real haiku output)', () => {
  const now = Date.UTC(2026, 9, 3)
  const picks = quizPick({ 'c:t': { name: '템플릿 리터럴', count: 1, firstAt: 0, lastAt: 0, blurb: '', files: [] } }, now)
  const text = [
    'Q1: 다음 코드는 어떤 결과를 출력할까요?',
    '```',
    'const fruit = "딸기";',
    'console.log(`나는 ${fruit}를 좋아합니다`);',
    '```',
    '',
    'A1: "나는 딸기를 좋아합니다"를 출력합니다.',
  ].join('\n')
  expect(parseQuiz(text, picks)).toEqual([
    {
      key: 'c:t',
      name: '템플릿 리터럴',
      question: '다음 코드는 어떤 결과를 출력할까요?\n```\nconst fruit = "딸기";\nconsole.log(`나는 ${fruit}를 좋아합니다`);\n```',
      answer: '"나는 딸기를 좋아합니다"를 출력합니다.',
    },
  ])
})

test('a numbered entry keeps its code block inside the entry', () => {
  expect(listItem(1, '출력은?\n```\nconsole.log(1)\n```')).toBe('1. 출력은?\n   ```\n   console.log(1)\n   ```')
  expect(listItem(12, '가\n\n나')).toBe('12. 가\n\n    나')
  expect(listItem(2, '한 줄')).toBe('2. 한 줄')
})

test('a quiz question cut inside its code block gets the closing fence', () => {
  const picks = quizPick({ 'c:t': { name: '반복문', count: 1, firstAt: 0, lastAt: 0, blurb: '', files: [] } }, Date.UTC(2026, 9, 3))
  const long = Array.from({ length: 200 }, (_, i) => `console.log(${i})`).join('\n')
  const [item] = parseQuiz(`Q1: 출력은?\n\`\`\`\n${long}\n\`\`\`\nA1: 0부터 199까지`, picks)
  expect(item!.question.length).toBeLessThan(1210)
  expect(item!.question.endsWith('…\n```')).toBe(true)
})

test('a missed concept leads the review queue until a quiz goes over it, and merging keeps only a miss newer than the review', () => {
  const now = Date.UTC(2026, 9, 3)
  const index = {
    'c:a': { name: 'A', count: 5, firstAt: now - 1, lastAt: now - 1, blurb: '', files: [] },
    'c:b': { name: 'B', count: 1, firstAt: now - 30 * 86_400_000, lastAt: now - 30 * 86_400_000, blurb: '', files: [] },
  }
  expect(reviewQueue(index, now).map(one => one.name)).toEqual(['B'])
  const missed = markMissed(index, ['c:a'], now)
  expect(isMissed(missed['c:a']!)).toBe(true)
  expect(reviewQueue(missed, now).map(one => one.name)).toEqual(['A', 'B'])
  expect(quizPick(missed, now, 1).map(one => one.name)).toEqual(['A'])
  const reviewed = markReviewed(missed, ['c:a'], now + 1)
  expect(reviewed['c:a']!.missedAt).toBeUndefined()
  expect(reviewQueue(reviewed, now + 1).map(one => one.name)).toEqual(['B'])

  // Two copies of one concept: a miss older than the other copy's review is gone.
  const stale = { a: { name: 'X', count: 1, firstAt: 1, lastAt: 1, blurb: '', files: [], missedAt: 5 }, b: { name: 'x', count: 1, firstAt: 2, lastAt: 2, blurb: '', files: [], reviewedAt: 9 } }
  expect(cleanConcepts(stale)['c:x']).toEqual({ name: 'X', count: 2, firstAt: 1, lastAt: 2, blurb: '', files: [], reviewedAt: 9 })
  const fresh = { a: { ...stale.a, missedAt: 10 }, b: stale.b }
  expect(cleanConcepts(fresh)['c:x']!.missedAt).toBe(10)
  const merged = mergeConcepts({ 'c:x': stale.a, 'c:y': { ...stale.b, name: 'Y' } }, 'c:x', 'c:y', 'Y')
  expect(merged['c:y']).toEqual({ name: 'Y', count: 2, firstAt: 1, lastAt: 2, blurb: '', files: [], reviewedAt: 9 })
})

describe('recap sources', () => {
  const journal = [
    '# 학습 노트 · proj',
    '',
    '## 2026-10-02 09:00',
    '',
    '**요청**: 버튼 고쳐줘',
    '',
    '**바뀐 파일**: `src/a.ts` (수정, +1 −1) · `lib/b.ts` (새 파일, +3 −0)',
    '',
    '### 한 줄 요약',
    '첫 요약',
    '### 배울 개념',
    '- **클로저**: 바깥 변수를 기억한다',
    '',
    '<details><summary>src/a.ts</summary>',
    '',
    '```diff',
    '### 배울 개념',
    '- **diff 안의 가짜 개념**: x',
    '```',
    '',
    '</details>',
    '',
    '## 2026-10-02 정리 · 오늘 (18:00)',
    '',
    '### 한 일',
    '정리 글',
    '',
    '## 2026-10-02 09:00 (다시 쓴 노트)',
    '',
    '**요청**: 버튼 고쳐줘',
    '',
    '**바뀐 파일**: `src/a.ts` (수정, +1 −1)',
    '',
    '### 한 줄 요약',
    '다시 쓴 요약',
    '### 배울 개념',
    '- **이벤트 핸들러**: 클릭을 받는다',
    '',
    '## 2026-10-02 10:30',
    '',
    '**요청**: 목록 정렬',
    '',
    '**바뀐 파일**: `src/list.ts` (수정, +2 −0)',
    '',
    '_노트 없이 전후 코드만 남겼다._',
  ].join('\n')

  test('a journal reads back as notes: a rewrite replaces its note, a recap section is not one, diffs are not read', () => {
    expect(journalEntries(journal)).toEqual([
      { day: '2026-10-02', time: '09:00', request: '버튼 고쳐줘', summary: '다시 쓴 요약', files: ['a.ts'], concepts: [{ key: 'c:이벤트핸들러', name: '이벤트 핸들러' }] },
      { day: '2026-10-02', time: '10:30', request: '목록 정렬', summary: '', files: ['list.ts'], concepts: [] },
    ])
  })

  test('what came back is only what these notes taught and was first met before the range', () => {
    const from = Date.UTC(2026, 9, 2)
    const index = {
      'c:클로저': { name: '클로저', count: 3, firstAt: from - 9 * 86_400_000, lastAt: from + 1, blurb: '', files: [] },
      'c:새것': { name: '새것', count: 1, firstAt: from + 1, lastAt: from + 1, blurb: '', files: [] },
      'c:sql조인': { name: 'SQL 조인', count: 3, firstAt: from - 9 * 86_400_000, lastAt: from + 1, blurb: '', files: [] },
    }
    const entries = [{ day: '2026-10-02', time: '09:00', request: '', summary: '', files: [], concepts: [{ key: 'c:클로저', name: '클로저' }, { key: 'c:새것', name: '새것' }] }]
    expect(recapAgain(entries, index, {}, from).map(one => one.name)).toEqual(['클로저'])
  })
})

describe('concept files', () => {
  const change = (file: string, lines: string[]) =>
    changeOf({ path: `/p/${file}`, root: '/p', tool: 'Edit', kind: 'update', hunks: [{ oldStart: 1, oldLines: 9, newStart: 1, newLines: 9, lines }] })!
  const a = change('src/a.ts', [' const total = items.reduce((sum, item) => {', '-  return sum + item.price', '+  return sum + item.price * item.qty', ' }, 0)'])
  const b = change('src/b.ts', [' import { x } from "./x"', '-let count = 0', '+const count = 0', ' export const label = "합계"'])
  const both = [b, a]

  test('a quote across a context line and an added line matches though a removed line sits between them (review R3 M4)', () => {
    expect(filesFor('`items.reduce((sum, item) => { return sum + item.price * item.qty }`', both)).toEqual(['src/a.ts'])
  })
  test('a quote cut with ... or … matches piece by piece in order', () => {
    expect(filesFor('`items.reduce((sum, item) => { ... }, 0)`', both)).toEqual(['src/a.ts'])
    expect(filesFor('`items.reduce(…)`', both)).toEqual(['src/a.ts'])
    // Out of order, the pieces do not make that code: the note's first file stands in.
    expect(filesFor('`item.qty … items.reduce`', both)).toEqual(['src/b.ts'])
  })
  test('old code counts as well as new, and short quotes say nothing', () => {
    expect(filesFor('`let count = 0` 대신 `const`', both)).toEqual(['src/b.ts'])
    expect(filesFor('`if`와 `x`', both)).toEqual(['src/b.ts'])
    expect(filesFor('`const` 선언', both)).toEqual(['src/b.ts', 'src/a.ts'])
    expect(filesFor('``const t = `a` `` 처럼', [a, b])).toEqual(['src/a.ts'])
  })
})

describe('real-run edges', () => {
  test('a file made this turn and changed again stays a new file holding its latest content', () => {
    const made = changeOf({ path: '/p/t.mjs', root: '/p', tool: 'Write', kind: 'create', hunks: [creationHunk('// run: node --test playground/\nimport a from "a"\n')] })!
    const fixed = changeOf({ path: '/p/t.mjs', root: '/p', tool: 'Bash', kind: 'update', hunks: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: ['-// run: node --test playground/', '+// run: node --test playground/t.mjs'] }] })!
    const [one] = merge([made], fixed).changes
    expect(one).toMatchObject({ kind: 'create', added: 2, removed: 0, tool: 'Bash' })
    expect(one!.diff).toBe('@@ -0,0 +1,2 @@\n+// run: node --test playground/t.mjs\n+import a from "a"')
  })

  test('hunks apply in place, and a hunk whose old lines are elsewhere refuses', () => {
    expect(applyHunks(['a', 'b', 'c'], [{ oldStart: 2, oldLines: 1, newStart: 2, newLines: 2, lines: ['-b', '+B', '+B2'] }])).toEqual(['a', 'B', 'B2', 'c'])
    expect(applyHunks(['a', 'b'], [{ oldStart: 2, oldLines: 0, newStart: 3, newLines: 1, lines: ['+c'] }])).toEqual(['a', 'b', 'c'])
    expect(applyHunks(['a', 'b'], [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: ['-x', '+y'] }])).toBeUndefined()
  })

  test('git commands that move content in are told from ones that do not', () => {
    for (const command of ['git stash', 'git stash pop', 'cd /p && git checkout -- a.ts', 'git -C /p restore .', 'git pull --rebase origin main', 'git reset --hard HEAD~1', 'git --no-pager switch dev'])
      expect(isGitMove(command)).toBe(true)
    for (const command of ['git commit -m "merge stuff"', 'git status', 'git diff HEAD', 'git log --oneline', 'sed -i s/a/b/ x && git add x', 'echo digit stash'])
      expect(isGitMove(command)).toBe(false)
  })
})

describe('spaced review', () => {
  const now = Date.UTC(2026, 9, 3, 3)
  const day = 86_400_000
  const one: LearnConcept = { name: '클로저', count: 1, firstAt: now, lastAt: now, blurb: '', files: [] }

  test('right answers space it out 1 → 3 → 7 → 14 → 30 → 60 days, a step a day at most', () => {
    expect(REVIEW_DAYS).toEqual([1, 3, 7, 14, 30, 60])
    let index: Record<string, LearnConcept> = { 'c:클로저': one }
    expect(dueText(index['c:클로저']!, now)).toBe('내일')
    let at = now + day
    const seen: number[] = []
    for (let i = 0; i < 7; i += 1) {
      index = markReviewed(index, ['c:클로저'], at)
      seen.push(stepOf(index['c:클로저']!))
      at = dueAt(index['c:클로저']!)
    }
    expect(seen).toEqual([1, 2, 3, 4, 5, 5, 5])
    // Going over it before it is due keeps its step (a note's own quiz, a quiz filled out with what is not due).
    const early = markReviewed({ 'c:클로저': one }, ['c:클로저'], now + day / 2 + 1)
    expect(stepOf(early['c:클로저']!)).toBe(0)
    expect(dueAt(early['c:클로저']!)).toBe(now + day / 2 + 1 + day)
    // Going over it again the same day (or a second press) does not move it on.
    const once = markReviewed({ 'c:클로저': one }, ['c:클로저'], now + day)
    const twice = markReviewed(once, ['c:클로저'], now + day + 60_000)
    expect(stepOf(twice['c:클로저']!)).toBe(1)
    expect(dueAt(twice['c:클로저']!)).toBe(now + day + 60_000 + 3 * day)
  })

  test('a wrong answer sends it back to the first step and makes it due now; met again in notes counts as steps', () => {
    const reviewed = markReviewed(markReviewed({ 'c:클로저': one }, ['c:클로저'], now + day), ['c:클로저'], now + 5 * day)
    expect(stepOf(reviewed['c:클로저']!)).toBe(2)
    const missed = markMissed(reviewed, ['c:클로저'], now + 6 * day)
    expect(stepOf(missed['c:클로저']!)).toBe(0)
    expect(dueAt(missed['c:클로저']!)).toBe(now + 6 * day)
    expect(reviewQueue(missed, now + 6 * day).map(c => c.name)).toEqual(['클로저'])
    // Right the next day: one step on from the first.
    const back = markReviewed(missed, ['c:클로저'], now + 7 * day)
    expect(stepOf(back['c:클로저']!)).toBe(1)
    expect(back['c:클로저']!.missedAt).toBeUndefined()
    // Never quizzed, but three notes met it: step 2, due a week after the last.
    expect(dueText({ ...one, count: 3 }, now + 2 * day)).toBe('5일 뒤')
    expect(dueText({ ...one, count: 3 }, now + 9 * day)).toBe('2일 지남')
    // Reviews go by the day: due later today is due now, and the queue and "오늘" agree.
    const laterToday = { ...one, lastAt: now - day + 3_600_000 }
    expect(dueAt(laterToday)).toBeGreaterThan(now)
    expect(isDue(laterToday, now)).toBe(true)
    expect(dueText(laterToday, now)).toBe('오늘')
    expect(reviewQueue({ 'c:클로저': laterToday }, now)).toHaveLength(1)
  })

  test('the step survives the store and a merge with an older copy', () => {
    const stepped = markReviewed({ 'c:클로저': one }, ['c:클로저'], now + day)
    expect(cleanConcepts(JSON.parse(JSON.stringify(stepped)))['c:클로저']!.step).toBe(1)
    expect(cleanConcepts({ x: { ...one, step: 99 } })['c:클로저']!.step).toBe(5)
    const merged = mergeConcepts({ 'c:a': { ...one, name: 'A' }, ...{ 'c:클로저': stepped['c:클로저']! } }, 'c:a', 'c:클로저', '클로저')
    expect(merged['c:클로저']!.step).toBe(1)
  })
})

describe('anki', () => {
  test('markdown becomes one line of HTML: code blocks, inline code, bold, no tabs or newlines', () => {
    const text = ankiHtml('**왜** `a < b`일까?\n```js\nif (a\t< b) {\n  go()\n}\n```\n끝')
    expect(text).toBe('<b>왜</b> <code>a &lt; b</code>일까?<br><pre><code>if (a  &lt; b) {<br>  go()<br>}</code></pre><br>끝')
    expect(text).not.toMatch(/[\t\n]/)
  })

  test('the bank keeps each question once, the newest copy, and at most BANK_KEPT', () => {
    const one = { key: 'c:a', name: 'A', question: 'Q?', answer: '답' }
    let bank = addToBank([], [one, { ...one, answer: '' }], 1)
    expect(bank).toEqual([{ ...one, at: 1 }])
    bank = addToBank(bank, [{ ...one, answer: '새 답' }], 2)
    expect(bank).toEqual([{ ...one, answer: '새 답', at: 2 }])
    const many = addToBank([], Array.from({ length: BANK_KEPT + 5 }, (_, i) => ({ ...one, question: `Q${i}` })), 3)
    expect(many).toHaveLength(BANK_KEPT)
    expect(many[0]!.question).toBe('Q5')
    expect(cleanBank([{ bad: 1 }, { ...one, at: 4 }, 'x'])).toEqual([{ ...one, at: 4 }])
  })

  test('the file has Anki\'s header, a card per question, then a card per explained concept', () => {
    const bank = [{ key: 'c:a', name: '클로저', question: '`count`는 왜 남을까?', answer: '바깥 변수를 기억해서다.', at: 1 }]
    const index = {
      'c:a': { name: '클로저', count: 2, firstAt: 1, lastAt: 2, blurb: '함수가 바깥 변수를 기억한다 — `count += 1`', files: ['src/counter.js'] },
      'c:b': { name: '빈 설명', count: 1, firstAt: 1, lastAt: 1, blurb: '', files: [] },
    }
    const out = ankiText(bank, index)
    expect(out).toMatchObject({ questions: 1, concepts: 1 })
    const lines = out.text.split('\n')
    expect(lines.slice(0, 4)).toEqual(['#separator:tab', '#html:true', '#deck:learn-notes', '#tags column:3'])
    expect(lines[4]).toBe('<code>count</code>는 왜 남을까?\t바깥 변수를 기억해서다.<br><br><small>개념: 클로저</small>\tlearn-notes 퀴즈')
    expect(lines[5]).toBe('<b>클로저</b><br>무엇이고, 어디에 썼나요?\t함수가 바깥 변수를 기억한다 — <code>count += 1</code><br><br><small>파일: counter.js</small>\tlearn-notes 개념')
    expect(lines.slice(4).every(line => line === '' || line.split('\t').length === 3)).toBe(true)
    // A leading # (a comment line to Anki) and a " (a quoted field) never reach the file as they are.
    const odd = ankiText([{ key: 'c:x', name: 'x', question: '#id 선택자는?', answer: '"use strict"를 쓴다', at: 1 }], {}).text.split('\n')[4]!
    expect(odd).toBe('&#35;id 선택자는?\t&quot;use strict&quot;를 쓴다<br><br><small>개념: x</small>\tlearn-notes 퀴즈')
  })
})

describe('shell edits read off the files (PowerShell, Bash without a diff)', () => {
  test('a line diff gives the changed lines with three around them, removals first, CRLF read as LF', () => {
    const before = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].join('\r\n') + '\r\n'
    const after = ['a', 'b', 'c', 'd', 'E', 'f', 'g', 'h', 'i', 'j'].join('\n') + '\n'
    expect(diffHunks(before, after)).toEqual([{ oldStart: 2, oldLines: 7, newStart: 2, newLines: 7, lines: [' b', ' c', ' d', '-e', '+E', ' f', ' g', ' h'] }])
    expect(diffHunks('x\r\ny\r\n', 'x\ny\n')).toEqual([])
    expect(diffHunks('1\n2\n3\n', '0\n1\n3\n4\n', 1)).toEqual([{ oldStart: 1, oldLines: 3, newStart: 1, newLines: 4, lines: ['+0', ' 1', '-2', ' 3', '+4'] }])
    // Changes far apart are two hunks.
    const long = Array.from({ length: 30 }, (_, i) => `line ${i}`)
    const changed = long.map((line, i) => (i === 2 || i === 25 ? `${line}!` : line))
    expect(diffHunks(long.join('\n'), changed.join('\n')).map(h => [h.oldStart, h.oldLines])).toEqual([[1, 6], [23, 7]])
    expect(deletionHunk('a\nb\n')).toEqual({ oldStart: 1, oldLines: 2, newStart: 0, newLines: 0, lines: ['-a', '-b'] })
  })

  test('paths join in the folder\'s own separator, with . .. ~ and $env:USERPROFILE read', () => {
    expect(joinPath('C:\\Windows\\System32', '..\\..\\Users\\Owen\\Desktop\\cart.js')).toBe('C:\\Users\\Owen\\Desktop\\cart.js')
    expect(joinPath('C:\\Windows\\System32', '~\\Desktop\\a.js', 'C:\\Users\\Owen')).toBe('C:\\Users\\Owen\\Desktop\\a.js')
    expect(joinPath('C:\\x', '$env:USERPROFILE\\Desktop\\a.js', 'C:\\Users\\Owen')).toBe('C:\\Users\\Owen\\Desktop\\a.js')
    expect(joinPath('/home/u/proj', './src/../a.ts')).toBe('/home/u/proj/a.ts')
    expect(joinPath('/home/u/proj', 'D:/work/b.py')).toBe('D:\\work\\b.py')
  })

  test('a PowerShell command names its files, read against the folder it moved to; script bodies and URLs are not files', () => {
    const ps = [
      'New-Item -ItemType Directory -Force -Path "C:\\Users\\Owen\\Desktop\\cart-total" | Out-Null',
      'Set-Location C:\\Users\\Owen\\Desktop\\cart-total',
      "Set-Content -Path cart.js -Value @'",
      'function cartTotal(items) { return items.reduce((s, i) => s + i.price * i.quantity, 0) }',
      'module.exports = { cartTotal }',
      "'@",
      'node --test cart.test.js; Invoke-WebRequest https://example.com/x.js',
    ].join('\n')
    expect(shellTargets(ps, 'C:\\Windows\\System32')).toEqual(['C:\\Users\\Owen\\Desktop\\cart-total\\cart.js', 'C:\\Users\\Owen\\Desktop\\cart-total\\cart.test.js'])
    expect(shellTargets(`cd src && sed -i 's/a/b/' util.ts > ../out.txt; cat > "my file.md" <<EOF`, '/home/u/proj')).toEqual([
      '/home/u/proj/src/util.ts',
      '/home/u/proj/out.txt',
      '/home/u/proj/src/my file.md',
    ])
    expect(shellTargets('ls *.js; echo $name.txt', '/p')).toEqual([])
    expect(shellTargets(Array.from({ length: 50 }, (_, i) => `f${i}.js`).join(' '), '/p')).toHaveLength(40)
  })
})

test('a system folder is a drive or file-system root, or Windows\' own folders; a home or a project is not', () => {
  for (const root of ['C:\\Windows\\System32', 'c:\\windows', 'C:\\', 'C:', 'C:\\Program Files\\Git', 'C:\\Program Files (x86)', '/', '/usr/local', '/System/Library']) {
    expect(isSystemFolder(root)).toBe(true)
  }
  for (const root of ['C:\\Users\\Owen\\practice', 'C:\\Users\\Owen', 'D:\\work\\shop', '/home/u/proj', '/Users/owen/code', undefined, '']) {
    expect(isSystemFolder(root)).toBe(false)
  }
})

test('a typed answer\'s grade is read from the two lines asked for, bold or JSON too', () => {
  expect(parseCheck('판정: 맞음\n피드백: 핵심을 짚었어요. `left`를 썼다는 점도 좋아요.')).toEqual({ verdict: 'right', feedback: '핵심을 짚었어요. `left`를 썼다는 점도 좋아요.' })
  expect(parseCheck('**판정:** 거의\n**피드백:** 순서 이야기가 빠졌어요.')).toEqual({ verdict: 'partial', feedback: '순서 이야기가 빠졌어요.' })
  expect(parseCheck('판정：틀림 (관계없는 답)\n피드백: 아쉬워요.')?.verdict).toBe('wrong')
  expect(parseCheck('```json\n{"verdict": "partial", "feedback": "거의요"}\n```')).toEqual({ verdict: 'partial', feedback: '거의요' })
  expect(parseCheck('잘 모르겠어요')).toBeUndefined()
  expect(parseCheck('판정: 아마도\n피드백: ...')).toBeUndefined()
  const prompt = checkPrompt({ name: '클로저', question: '왜 커질까?', answer: '바깥 변수를 기억해서다.' }, '변수를 기억해서', 'beginner')
  expect(prompt).toContain('## 모범 답\n바깥 변수를 기억해서다.\n## 학습자의 답\n변수를 기억해서')
  expect(prompt).toContain('판정: (맞음 · 거의 · 틀림 중 하나)')
})

describe('1.4.0', () => {
  const picks = quizPick({ 'c:a': { name: 'A', count: 1, firstAt: 0, lastAt: 0, blurb: '', files: [] }, 'c:b': { name: 'B', count: 1, firstAt: 1, lastAt: 1, blurb: '', files: [] } }, Date.UTC(2026, 9, 3))

  test('a hint comes with its question; one that only repeats the answer is dropped', () => {
    const items = parseQuiz(['Q1: 첫 문제', 'H1: 바깥을 떠올려 보세요', 'A1: 첫 답', 'Q2: 둘째 문제', 'H2: 둘째  답', 'A2: 둘째 답'].join('\n'), picks)
    expect(items.map(one => one.hint)).toEqual(['바깥을 떠올려 보세요', undefined])
    expect(items[1]!.answer).toBe('둘째 답')
    // A quiz without hints (before 1.4.0, or a model that left them out) still reads.
    expect(parseQuiz('Q1: 문제\nA1: 답', picks)[0]!.hint).toBeUndefined()
  })

  test('code inside a question is its code, even where a line looks like a marker (review)', () => {
    const text = ['Q1: 아래 코드는 무엇을 보여 줄까요?', '```', "h1.textContent = '안녕'", 'a1. 주석 아님', 'Q2: 가짜', '```', 'H1: 제목 태그', 'A1: 안녕', 'Q2: 진짜 둘째', 'A2: 둘'].join('\n')
    const [first, second] = parseQuiz(text, picks)
    expect(first!.question).toContain("h1.textContent = '안녕'")
    expect(first!.question).toContain('a1. 주석 아님')
    expect(first!.question).toContain('Q2: 가짜')
    expect(second!.question).toBe('진짜 둘째')
    // Lowercase is never a marker.
    expect(parseQuiz('Q1: 문제\nh1: 아님\nA1: 답', picks)[0]).toMatchObject({ question: '문제\nh1: 아님', answer: '답' })
  })

  test('the code a concept was met in: the new side around the quoted line', () => {
    const change = { diff: '@@ -1,4 +1,5 @@\n const a = 1\n-let b = 2\n+const b = 2\n+for (const item of items) {}\n x()\n y()' }
    expect(codeFor(change, '반복 — `for (const item of items)`')).toBe('const a = 1\nconst b = 2\nfor (const item of items) {}\nx()\ny()')
    expect(codeFor({ diff: '@@ -1,2 +0,0 @@\n-a\n-b' }, '')).toBeUndefined()
    const long = { diff: `@@ -1,1 +1,40 @@\n${Array.from({ length: 40 }, (_, i) => `+line${i}`).join('\n')}` }
    expect(codeFor(long, '`line30`')!.split('\n')[0]).toBe('line25')
    expect(codeFor(long, '')!.split('\n')).toHaveLength(16)
  })

  test('the quiz prompt shows the learner their own code and asks for a hint', () => {
    const prompt = quizPrompt([{ ...picks[0]!, code: { file: 'cart.js', text: 'const total = 0' } }, picks[1]!], 'beginner')
    expect(prompt).toContain('1. A — (설명 없음)\n   학습자가 만든 코드 (cart.js):\n```\nconst total = 0\n```\n2. B')
    expect(prompt).toContain('그 코드를 그대로, 또는 조금 바꿔')
    expect(prompt).toContain('H1: (힌트 한 문장)')
    expect(quizPrompt(picks, 'beginner')).not.toContain('학습자가 만든 코드')
  })

  test('a partly right answer steps a concept back one, never below the first, and does not mark it missed', () => {
    const at = Date.UTC(2026, 9, 3)
    const one: LearnConcept = { name: 'A', count: 1, firstAt: 0, lastAt: 0, blurb: '', files: [], step: 3, missedAt: 5 }
    expect(markPartial({ 'c:a': one }, ['c:a'], at)['c:a']).toMatchObject({ step: 2, reviewedAt: at })
    expect(markPartial({ 'c:a': one }, ['c:a'], at)['c:a']!.missedAt).toBeUndefined()
    expect(markPartial({ 'c:a': { ...one, step: 0 } }, ['c:a'], at)['c:a']!.step).toBe(0)
  })

  test('a grade turned around starts from the marks before it, unless something went over the concept since', () => {
    const day = 86_400_000
    const at = Date.UTC(2026, 9, 3)
    const one: LearnConcept = { name: 'A', count: 1, firstAt: at - 10 * day, lastAt: at - 10 * day, blurb: '', files: [], step: 2, reviewedAt: at - 8 * day }
    const before = marksOf(one)
    const wrong = markMissed(markReviewed({ 'c:a': one }, ['c:a'], at), ['c:a'], at)
    expect(wrong['c:a']).toMatchObject({ step: 0, missedAt: at })
    // Right after all: a step on from 2, as if graded right then.
    const right = regrade(wrong, 'c:a', before, at, markReviewed)
    expect(right['c:a']).toMatchObject({ step: 3, reviewedAt: at })
    expect(right['c:a']!.missedAt).toBeUndefined()
    // Gone over since (another quiz the next day): only the new grade is applied.
    const later = markReviewed(wrong, ['c:a'], at + day)
    expect(regrade(later, 'c:a', before, at, markReviewed)['c:a']!.reviewedAt).toBe(at + day)
  })

  test('a follow-up question reads the last two questions and answers about the note', () => {
    const note = { prompt: '요청', text: '노트', status: 'ready' as const, changes: [], moreFiles: 0 }
    expect(askPrompt(note, '왜?', 'beginner')).not.toContain('앞서 이 노트에 대해')
    const asks = [1, 2, 3].map(n => ({ question: `질문 ${n}`, answer: `답 ${n}`, at: n }))
    const prompt = askPrompt({ ...note, asks }, '그럼?', 'beginner')
    expect(prompt).toContain('- 질문: 질문 2\n  답: 답 2\n- 질문: 질문 3\n  답: 답 3')
    expect(prompt).not.toContain('질문 1')
  })

  test('a CRLF line keeps its \\r out of the diff: no blank lines, a header that still counts right (review)', () => {
    const { diff } = hunksToDiff([{ oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: [' a\r', '-b\r', '+B\r'] }])
    expect(diff).toBe('@@ -1,2 +1,2 @@\n a\n-b\n+B')
  })

  test('the journal keeps a request on one line, so a pasted code block cannot swallow the section (review)', () => {
    const note = {
      id: 'n', turnId: 't', at: Date.UTC(2026, 9, 3, 1), prompt: '이 코드 고쳐줘\n```js\nconst a = `x\n```', answer: '', changes: [], moreFiles: 0,
      status: 'ready' as const, text: '### 한 줄 요약\n고쳤다', savedAs: null, isPast: false, concepts: [], root: '/p', updatedAt: 0,
    }
    const section = journalSection(note)
    expect(section).toContain('**요청**: 이 코드 고쳐줘 ```js const a = `x ```')
    expect(journalEntries(`# 일지\n\n${section}`)[0]!.request).toContain('이 코드 고쳐줘')
  })

  test('a stored note keeps its last three questions, each cut short', () => {
    const asks = [1, 2, 3, 4].map(n => ({ question: `질문 ${n}`, answer: 'x'.repeat(3000), at: n }))
    const note = {
      id: 'n', turnId: 't', at: 1, prompt: '', answer: '', changes: [], moreFiles: 0,
      status: 'ready' as const, text: '', savedAs: null, isPast: false, concepts: [], root: '/p', updatedAt: 0, asks,
    }
    const kept = forHistory(note).asks!
    expect(kept.map(one => one.question)).toEqual(['질문 2', '질문 3', '질문 4'])
    expect(kept[0]!.answer.length).toBeLessThanOrEqual(1500)
  })
})

describe('1.4.0 second review', () => {
  const picks = quizPick({ 'c:a': { name: 'A', count: 1, firstAt: 0, lastAt: 0, blurb: '', files: [] }, 'c:b': { name: 'B', count: 1, firstAt: 1, lastAt: 1, blurb: '', files: [] } }, Date.UTC(2026, 9, 3))

  test('a fence opened and closed on one line, or left open, does not hide the markers after it', () => {
    const oneLine = ['Q1: 결과는?', '```const a = [1,2].map(x => x*2)```', 'H1: map을 떠올리세요', 'A1: [2,4]', 'Q2: 둘', 'A2: 답'].join('\n')
    expect(parseQuiz(oneLine, picks).map(one => one.answer)).toEqual(['[2,4]', '답'])
    const open = ['Q1: 결과는?', '```js', 'console.log(1)', 'A1: 1', 'Q2: 둘', 'A2: 답'].join('\n')
    expect(parseQuiz(open, picks)).toHaveLength(2)
    const fenced = ['Q1: 다음은?', '```js', 'h1.textContent = 1', '```', 'A1: 1', 'Q2: 둘', 'A2: 답'].join('\n')
    expect(parseQuiz(fenced, picks)[0]!.question).toContain('h1.textContent = 1')
  })

  test('a rewritten note is one entry though an older build wrote its request on several lines', () => {
    const older = ['## 2026-10-03 10:00', '', '**요청**: 이 코드 고쳐줘', '```js', 'a()', '```', '', '### 한 줄 요약', '옛 노트', '', '---', ''].join('\n')
    const newer = ['## 2026-10-03 10:00 (다시 쓴 노트)', '', '**요청**: 이 코드 고쳐줘 ```js a() ```', '', '### 한 줄 요약', '새 노트', '', '---', ''].join('\n')
    expect(journalIndex(older + newer)).toEqual([{ time: '10:00', request: '이 코드 고쳐줘 ```js a() ```', summary: '새 노트', isRewrite: true }])
    expect(journalEntries(older + newer)).toHaveLength(1)
    expect(isSameRequest('같은 요청 앞부분…', '같은 요청 앞부분과 뒷부분')).toBe(true)
    expect(isSameRequest('다른 요청', '같은 요청')).toBe(false)
  })
})

describe('1.5.0: what changed, at a glance', () => {
  const text = (parts: readonly { text: string; isChanged: boolean }[]) => parts.map(p => (p.isChanged ? `[${p.text}]` : p.text)).join('')

  test('two versions of a line are compared word by word, only the words that differ marked', () => {
    const d = wordDiff('  var n = 0', '  let n = 0')!
    expect(text(d.before)).toBe('  [var] n = 0')
    expect(text(d.after)).toBe('  [let] n = 0')
    // An added argument is one marked run, the spaces inside it included.
    const call = wordDiff('function countPaid(orders) {', 'function countPaid(orders, minAmount = 0) {')!
    expect(text(call.before)).toBe('function countPaid(orders) {')
    expect(text(call.after)).toBe('function countPaid(orders[, minAmount = 0]) {')
    // Korean words count as words.
    expect(text(wordDiff('// 주문 수를 센다', '// 결제된 주문 수를 센다')!.after)).toBe("// [결제된] 주문 수를 센다")
  })

  test('lines too unlike are not one line edited', () => {
    expect(wordDiff('if (orders[i].paid) n = n + 1', 'return total')).toBeUndefined()
    expect(wordDiff('', 'x')).toBeUndefined()
    expect(wordDiff('a '.repeat(400), 'a '.repeat(400) + 'b')).toBeUndefined()
  })

  test('a hunk splits into its two sides, numbered as in the file, each changed line paired with its new version', () => {
    const [hunk] = parseDiff(
      [
        '@@ -3,6 +3,6 @@',
        ' // 결제 완료된 주문 수를 센다',
        '-function countPaid(orders) {',
        '-  var n = 0',
        '-  for (var i = 0; i < orders.length; i++) {',
        '-    if (orders[i].paid) n = n + 1',
        '+function countPaid(orders, minAmount = 0) {',
        '+  let n = 0',
        '+  for (const order of orders) {',
        '+    if (order.paid && order.amount >= minAmount) n += 1',
        '   }',
      ].join('\n'),
    )
    const { before, after } = sideBySide(hunk!)
    // The condition rewritten past recognition reads as one line out and another in.
    expect(before.map(line => [line.n, line.kind])).toEqual([[3, 'same'], [4, 'edited'], [5, 'edited'], [6, 'edited'], [7, 'whole'], [8, 'same']])
    expect(after.map(line => [line.n, line.kind])).toEqual([[3, 'same'], [4, 'edited'], [5, 'edited'], [6, 'edited'], [7, 'whole'], [8, 'same']])
    expect(text(after[1]!.parts)).toBe('function countPaid(orders[, minAmount = 0]) {')
    expect(text(before[2]!.parts)).toBe('  [var] n = 0')
    expect(text(after[3]!.parts)).toBe('  for ([const order of] orders) {')
  })

  test('a line with no new version is changed whole, and an insertion has nothing before it', () => {
    const [hunk] = parseDiff(['@@ -1,3 +1,4 @@', ' const a = 1', '-console.log(a)', '+export function total(items) {', '+  return items.length', '+}', ' const b = 2'].join('\n'))
    const { before, after } = sideBySide(hunk!)
    expect(before.map(line => line.kind)).toEqual(['same', 'whole', 'same'])
    expect(after.map(line => line.kind)).toEqual(['same', 'whole', 'whole', 'whole', 'same'])
    expect(after.map(line => line.n)).toEqual([1, 2, 3, 4, 5])
    const [insert] = parseDiff(['@@ -2,0 +3,1 @@', '+// 새 줄'].join('\n'))
    const sides = sideBySide(insert!)
    expect(sides.before).toEqual([])
    expect(sides.after).toEqual([{ n: 3, kind: 'whole', parts: [{ text: '// 새 줄', isChanged: true }] }])
  })

  test('the note asks for what the code does before and after, and an example', () => {
    const prompt = notePrompt({ prompt: '요청', answer: '', changes: [], moreFiles: 0 }, 'beginner')
    expect(prompt).toContain('- 전: 바뀌기 전 코드가 하던 일')
    expect(prompt).toContain('- 후: 이제 하는 일')
    expect(prompt).toContain('- 예: 차이가 드러나는 입력 하나와 결과')
    expect(prompt).toContain('위의 예와 겹치지 않게')
  })

  test('a note\'s 무엇이 바뀌었나 reads as 전 / 후 / 예 lines, with the note around it kept', () => {
    const note = [
      '### 한 줄 요약',
      '최소 금액 조건을 더했습니다.',
      '',
      '### 무엇이 바뀌었나',
      '- **전**: 결제된 주문을 모두 셉니다.',
      '- 후: 결제됐고 `minAmount` 이상인 주문만 셉니다.',
      '- 예시: `countPaid(orders, 75)` → 전: 2 / 후: 1',
      '',
      '### 왜 이렇게 바꿨을까',
      '요청이 그랬습니다.',
    ].join('\n')
    const section = changeSection(note)!
    expect(section.head).toBe('### 한 줄 요약\n최소 금액 조건을 더했습니다.')
    expect(section.items).toEqual([
      { kind: 'before', text: '결제된 주문을 모두 셉니다.' },
      { kind: 'after', text: '결제됐고 `minAmount` 이상인 주문만 셉니다.' },
      { kind: 'example', text: '`countPaid(orders, 75)` → 전: 2 / 후: 1' },
    ])
    expect(section.tail).toBe('### 왜 이렇게 바꿨을까\n요청이 그랬습니다.')
    // Several files: each name heads its own lines; other words stay as words.
    const many = changeSection(['### 무엇이 바뀌었나', '**src/cart.js**', '- 전: 없음', '- 후: 합계를 구합니다', '`src/view.js`:', '- 전: 0을 보입니다', '- 후: 합계를 보입니다', '두 파일이 함께 바뀌었습니다.'].join('\n'))!
    expect(many.items.map(item => item.kind)).toEqual(['file', 'before', 'after', 'file', 'before', 'after', 'text'])
    expect(many.items[3]).toEqual({ kind: 'file', text: 'src/view.js' })
    expect(many.tail).toBe('')
  })

  test('a note without 전 / 후 lines (written before 1.5.0) is left as written', () => {
    expect(changeSection('### 한 줄 요약\n요약\n### 무엇이 바뀌었나\n- `src/a.ts`: `let b` → `const b`')).toBeUndefined()
    expect(changeSection('### 한 줄 요약\n요약')).toBeUndefined()
    // 전체 or 예를 들어 at the start of a sentence is not a label.
    expect(changeSection('### 무엇이 바뀌었나\n전체 흐름은 같습니다.\n예를 들어 0을 넣으면 0입니다.')).toBeUndefined()
  })
})

describe('1.5.0 review', () => {
  const text = (parts: readonly { text: string; isChanged: boolean }[]) => parts.map(p => (p.isChanged ? `[${p.text}]` : p.text)).join('')

  test('a label\'s words that start in bold keep their bold', () => {
    const items = changeSection(['### 무엇이 바뀌었나', '- 후: **최소 금액** 이상인 주문만 셉니다', '- **예**: **75** → 전: 2 / 후: 1', '- **전:** 모두 셉니다'].join('\n'))!.items
    expect(items).toEqual([
      { kind: 'after', text: '**최소 금액** 이상인 주문만 셉니다' },
      { kind: 'example', text: '**75** → 전: 2 / 후: 1' },
      { kind: 'before', text: '모두 셉니다' },
    ])
  })

  test('a section holding a code block shows as written, and a line indented under a label goes on with it', () => {
    const fenced = ['### 무엇이 바뀌었나', '- 전: 없음', '- 예:', '```python', '# 평균', 'avg([1, 2])', '```', '### 왜 이렇게 바꿨을까', '이유'].join('\n')
    expect(changeSection(fenced)).toBeUndefined()
    const wrapped = changeSection(['### 무엇이 바뀌었나', '- 전: 결제된 주문을', '  모두 셉니다', '- 후: 금액 조건이 붙습니다', '###왜 이렇게 바꿨을까', '이유'].join('\n'))!
    expect(wrapped.items).toEqual([
      { kind: 'before', text: '결제된 주문을 모두 셉니다' },
      { kind: 'after', text: '금액 조건이 붙습니다' },
    ])
    // A heading with no space after its marks still ends the section.
    expect(wrapped.tail).toBe('###왜 이렇게 바꿨을까\n이유')
  })

  test('a sentence in bold is words, not a file name', () => {
    const items = changeSection(['### 무엇이 바뀌었나', '**두 파일이 함께 바뀌었습니다**', '- 전: 0', '- 후: 1'].join('\n'))!.items
    expect(items[0]).toEqual({ kind: 'text', text: '**두 파일이 함께 바뀌었습니다**' })
  })

  test('lines alike only in their brackets are not one line edited', () => {
    expect(wordDiff('foo(a, b);', 'bar(c, d);')).toBeUndefined()
    expect(wordDiff('})', '}')).toBeUndefined()
    // The marks still count where the words make the pair.
    expect(text(wordDiff('total(items)', 'total(items, 0.1)')!.after)).toBe('total(items[, 0.1])')
  })

  test('past the pairs it weighs, the nth removed line goes with the nth added one', () => {
    const removed = Array.from({ length: 51 }, (_, i) => `-  const value${i} = old(${i})`)
    const added = Array.from({ length: 50 }, (_, i) => `+  const value${i} = fresh(${i})`)
    expect(removed.length * added.length).toBeGreaterThan(PAIRS_WEIGHED)
    const [hunk] = parseDiff(['@@ -1,51 +1,50 @@', ...removed, ...added].join('\n'))
    const { before, after } = sideBySide(hunk!)
    expect(before.slice(0, 50).every(line => line.kind === 'edited')).toBe(true)
    expect(before[50]!.kind).toBe('whole')
    expect(text(after[4]!.parts)).toBe('  const value4 = [fresh](4)')
  })

  test('a pair that could be alike by its words but is not in order stays unpaired', () => {
    // The same words in another order: alike as a bag, too unlike word by word.
    const [hunk] = parseDiff(['@@ -1,1 +1,1 @@', '-alpha beta gamma delta epsilon', '+epsilon delta gamma beta alpha'].join('\n'))
    const { before, after } = sideBySide(hunk!)
    expect(before[0]!.kind).toBe('whole')
    expect(after[0]!.kind).toBe('whole')
  })
})

describe('1.5.1: bold the pane can close', () => {
  test('every prompt whose answer the pane draws as Markdown asks for bold that a particle does not hold open', () => {
    const prompts = { SYSTEM, ASK_SYSTEM, RECAP_SYSTEM, QUIZ_SYSTEM, CHECK_SYSTEM }
    for (const [name, prompt] of Object.entries(prompts)) expect([name, prompt.includes(BOLD)]).toEqual([name, true])
    // The case CommonMark cannot close, written out, and what still closes: a concept line's `- **이름 (X)**: 설명`.
    expect(BOLD).toContain('"**누적(쌓아올리기)**하는"이 아니라 "**누적**(쌓아올리기)하는"')
    expect(BOLD).toContain('쌍점')
  })
})

describe('1.6.0: secrets masked, secret and generated files left out', () => {
  const A = 'A'.repeat(36)
  /** One line per key format, each in a diff line, and the part of it that must go. */
  const CASES: [string, string][] = [
    ['+const key = "sk-ant-api03-AAAAAAAAAAAAAAAAAAAA"', 'sk-ant-api03-AAAAAAAAAAAAAAAAAAAA'],
    ["+openai = 'sk-proj-abc123def456ghi789jkl0'", 'sk-proj-abc123def456ghi789jkl0'],
    ['-aws_access_key_id = AKIAIOSFODNN7EXAMPLE', 'AKIAIOSFODNN7EXAMPLE'],
    [`+  auth: ghp_${A}`, `ghp_${A}`],
    [`+GH=github_pat_11${A}`, `github_pat_11${A}`],
    ['+slack: xoxb-1234567890-abcdefghij', 'xoxb-1234567890-abcdefghij'],
    [`+const maps = 'AIza${'B'.repeat(35)}'`, `AIza${'B'.repeat(35)}`],
    ['+stripe(sk_live_51Habcdefghijklmn)', 'sk_live_51Habcdefghijklmn'],
    ['+gitlab glpat-abcdefghij0123456789', 'glpat-abcdefghij0123456789'],
    ['+headers.auth = eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U', 'eyJhbGciOiJIUzI1NiJ9'],
    ['+const url = "postgres://u:hunter2@h/db"', 'hunter2'],
    ['+  password: "correct-horse"', 'correct-horse'],
    ["+db.secret = 's3cr3t-value'", 's3cr3t-value'],
    ['+  "api_key": "abcd1234"', 'abcd1234'],
    ['+OPENAI_API_KEY=plainvalue123', 'plainvalue123'],
    ['+export STRIPE_SECRET="quoted value"', 'quoted value'],
    ['+DB_PASSWORD=hunter3', 'hunter3'],
  ]

  test('each common key format is masked, the line and its +/− marker kept', () => {
    for (const [line, secret] of CASES) {
      const { lines, hits } = redactLines([line])
      expect([line, lines[0]!.includes(secret)]).toEqual([line, false])
      expect([line, lines[0]!.includes(REDACTED)]).toEqual([line, true])
      expect([line, lines[0]![0]]).toEqual([line, line[0]])
      expect([line, hits]).toEqual([line, 1])
    }
    const all = redactLines(CASES.map(([line]) => line))
    expect(all.lines).toHaveLength(CASES.length)
    expect(all.hits).toBe(CASES.length)
  })

  test('only the secret goes: the name, the user and the host stay', () => {
    expect(redactLines(['+const url = "postgres://u:hunter2@h/db"']).lines).toEqual([`+const url = "postgres://u:${REDACTED}@h/db"`])
    expect(redactLines(['+OPENAI_API_KEY=sk-ant-api03-AAAAAAAAAAAAAAAAAAAA']).lines).toEqual([`+OPENAI_API_KEY=${REDACTED}`])
    expect(redactLines([' password: "x1y2z3"']).lines).toEqual([` password: "${REDACTED}"`])
  })

  test('masking twice changes nothing more', () => {
    const lines = [...CASES.map(([line]) => line), '+-----BEGIN RSA PRIVATE KEY-----', `+${'M'.repeat(64)}`, '+abc==', '+-----END RSA PRIVATE KEY-----']
    const once = redactLines(lines)
    const twice = redactLines(once.lines)
    expect(twice.lines).toEqual(once.lines)
    expect(twice.hits).toBe(0)
  })

  test('code that only names a secret, and values that are no secret, stay as written', () => {
    const plain = [
      '+const apiKey = process.env.API_KEY',
      '+SUPABASE_URL=https://x.supabase.co',
      '+NODE_ENV=production',
      '+KEYBOARD_LAYOUT=us',
      '+MONKEY=banana',
      '+  tokenizer: "cl100k"',
      '+API_KEY=${API_KEY}',
      '+  password: "Password must be 8 characters"',
      '+  passwordLabel: "secret123"',
      '+if (token === "abc") return',
      '+const className = "sk-loading-spinner-container"',
      '+fetch("https://example.com:8080/a@b")',
      '+const url = `postgres://${user}:${password}@db/app`',
      '+  password: "${DB_PASSWORD}"',
      '+API_TOKEN=<your-token>',
      `+${'='.repeat(72)}`,
      `+${'/'.repeat(72)}`,
      ' const a = 1',
    ]
    expect(redactLines(plain)).toEqual({ lines: plain, hits: 0 })
  })

  test('a private key is masked whole, its BEGIN and END lines kept', () => {
    const lines = [
      ' const pem = `',
      '+-----BEGIN PRIVATE KEY-----',
      '+MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7',
      '+abcDEF==',
      '+-----END PRIVATE KEY-----',
      ' `',
    ]
    const { lines: out, hits } = redactLines(lines)
    expect(out).toEqual([' const pem = `', '+-----BEGIN PRIVATE KEY-----', `+${REDACTED}`, `+${REDACTED}`, '+-----END PRIVATE KEY-----', ' `'])
    expect(hits).toBe(1)
    // One on a single line (an escaped string), and a body whose BEGIN fell outside the hunk.
    expect(redactLines(['+"key": "-----BEGIN PRIVATE KEY-----\\nMIIEvQ\\n-----END PRIVATE KEY-----\\n"']).lines[0]).toBe(
      `+"key": "-----BEGIN PRIVATE KEY-----${REDACTED}-----END PRIVATE KEY-----\\n"`,
    )
    expect(redactLines([` ${'Qk9'.repeat(22)}`, `+${'R2x'.repeat(22)}`, ' -----END PRIVATE KEY-----'])).toEqual({
      lines: [` ${REDACTED}`, `+${REDACTED}`, ' -----END PRIVATE KEY-----'],
      hits: 1,
    })
  })

  test('code that mentions a key header is not a key: the lines after it stay', () => {
    const lines = ["+if (pem.startsWith('-----BEGIN PRIVATE KEY-----')) {", '+  return parse(pem)', '+}']
    expect(redactLines(lines)).toEqual({ lines, hits: 0 })
    const named = ["+const begin = '-----BEGIN PRIVATE KEY-----'; const n = begin.length", "+const end = pem.indexOf('-----END PRIVATE KEY-----')"]
    expect(redactLines(named)).toEqual({ lines: named, hits: 0 })
  })

  test('key material on the BEGIN or END line itself is masked too, as one key', () => {
    const body = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7abcdefghijk'
    // A dotenv-style value whose quote closes lines later: the key's first lines ride on the BEGIN line.
    const env = redactLines([`+PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\n${body}\\n${body}`, `+${body}\\nlastBit==\\n-----END RSA PRIVATE KEY-----"`])
    expect(env).toEqual({
      lines: [`+PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\n${REDACTED}\\n${REDACTED}`, `+${REDACTED}\\n${REDACTED}\\n-----END RSA PRIVATE KEY-----"`],
      hits: 1,
    })
    // Strings joined with +, the first piece beside BEGIN and the last beside END.
    const joined = redactLines([`+k = "-----BEGIN PRIVATE KEY-----\\n${body}\\n" +`, `+  "${body}\\n" +`, '+  "tail==\\n-----END PRIVATE KEY-----\\n"'])
    expect(joined).toEqual({
      lines: [`+k = "-----BEGIN PRIVATE KEY-----\\n${REDACTED}\\n" +`, `+${REDACTED}`, `+  "${REDACTED}\\n-----END PRIVATE KEY-----\\n"`],
      hits: 1,
    })
    // On one line with spaces for line breaks, as some hosts flatten it.
    expect(redactLines([`+-----BEGIN PRIVATE KEY----- ${body} ${body}`])).toEqual({ lines: [`+-----BEGIN PRIVATE KEY----- ${REDACTED} ${REDACTED}`], hits: 1 })
    for (const once of [env, joined]) expect(redactLines(once.lines)).toEqual({ lines: once.lines, hits: 0 })
    for (const line of [...env.lines, ...joined.lines]) expect(line).not.toContain('MIIE')
  })

  test('a connection string with no user still has its password masked', () => {
    expect(redactLines(['+REDIS_URL=redis://:p4ssw0rd@localhost:6379', '+const r = "rediss://:p4ssw0rd@cache:6380/0"'])).toEqual({
      lines: [`+REDIS_URL=redis://:${REDACTED}@localhost:6379`, `+const r = "rediss://:${REDACTED}@cache:6380/0"`],
      hits: 2,
    })
    const plain = ['+fetch("http://[::1]:8080/a")', '+const u = `redis://:${process.env.REDIS_PASSWORD}@h`']
    expect(redactLines(plain)).toEqual({ lines: plain, hits: 0 })
  })

  test('a very long line (minified code) is looked over once, not word against word', () => {
    const lines = ['a.'.repeat(150_000), '"a":"b",'.repeat(40_000), 'x://a:'.repeat(50_000), 'ABC_'.repeat(75_000)].map(line => `+${line}`)
    const started = Date.now()
    expect(redactLines(lines)).toEqual({ lines, hits: 0 })
    expect(Date.now() - started).toBeLessThan(5000)
  })

  test('plain text is masked line by line', () => {
    const { text, hits } = redactText('이 키로 해 줘\nsk-ant-api03-AAAAAAAAAAAAAAAAAAAA\n고마워')
    expect(text).toBe(`이 키로 해 줘\n${REDACTED}\n고마워`)
    expect(hits).toBe(1)
  })

  test('a change counts what was masked, and merging two edits adds them up', () => {
    const hunk = (line: string): Hunk => ({ oldStart: 1, oldLines: 0, newStart: 1, newLines: 1, lines: [line] })
    const one = changeOf({ path: '/proj/db.ts', root: '/proj', tool: 'Edit', kind: 'update', hunks: [hunk('+const url = "postgres://u:hunter2@h/db"')] })
    expect(one.redacted).toBe(1)
    expect(one.diff).not.toContain('hunter2')
    expect(one).toMatchObject({ added: 1, removed: 0 })
    const two = changeOf({ path: '/proj/db.ts', root: '/proj', tool: 'Edit', kind: 'update', hunks: [hunk('+DB_PASSWORD=abc123'), hunk('+const n = 1')] })
    expect(merge([one], two).changes[0]!.redacted).toBe(2)
    const clean = changeOf({ path: '/proj/a.ts', root: '/proj', tool: 'Edit', kind: 'update', hunks: [HUNK] })
    expect('redacted' in clean).toBe(false)
    expect(merge([clean], clean).changes[0]!.redacted).toBeUndefined()
    // A file made this turn and edited again counts what its re-made creation hunk holds:
    // the key the edit's context line repeats is still one key.
    const made = changeOf({ path: '/proj/n.ts', root: '/proj', tool: 'Write', kind: 'create', hunks: [creationHunk('const t = "sk-ant-api03-AAAAAAAAAAAAAAAAAAAA"\nlet n = 1\n')] })
    expect(made.redacted).toBe(1)
    const edit = changeOf({
      path: '/proj/n.ts',
      root: '/proj',
      tool: 'Edit',
      kind: 'update',
      hunks: [{ oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: [' const t = "sk-ant-api03-AAAAAAAAAAAAAAAAAAAA"', '-let n = 1', '+const n = 1'] }],
    })
    expect(edit.redacted).toBe(1)
    const [joined] = merge([made], edit).changes
    expect(joined).toMatchObject({ kind: 'create', added: 2, removed: 0, redacted: 1 })
    expect(joined!.diff).not.toContain('sk-ant')
    // The edit replaced the key line itself (− and + both masked): still one key in the file.
    const swap = changeOf({
      path: '/proj/n.ts',
      root: '/proj',
      tool: 'Edit',
      kind: 'update',
      hunks: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: ['-const t = "sk-ant-api03-AAAAAAAAAAAAAAAAAAAA"', '+const t = "sk-ant-api03-BBBBBBBBBBBBBBBBBBB1"'] }],
    })
    expect(merge([made], swap).changes[0]).toMatchObject({ kind: 'create', redacted: 1 })
    // An edit that took the key out leaves nothing counted.
    const out = changeOf({
      path: '/proj/n.ts',
      root: '/proj',
      tool: 'Edit',
      kind: 'update',
      hunks: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: ['-const t = "sk-ant-api03-AAAAAAAAAAAAAAAAAAAA"', '+const t = process.env.T'] }],
    })
    expect('redacted' in merge([made], out).changes[0]!).toBe(false)
    // A key block in a new file is one, its BEGIN and END lines and an encrypted key's blank line aside.
    const pem = changeOf({
      path: '/proj/k.ts',
      root: '/proj',
      tool: 'Write',
      kind: 'create',
      hunks: [creationHunk(`const k = \`-----BEGIN RSA PRIVATE KEY-----\nProc-Type: 4,ENCRYPTED\n\n${'Q'.repeat(30)}1\nabc==\n-----END RSA PRIVATE KEY-----\`\nconst p = "postgres://u:pw1@h/db"\nlet n = 1\n`)],
    })
    expect(pem.redacted).toBe(2)
    const tweak = changeOf({
      path: '/proj/k.ts',
      root: '/proj',
      tool: 'Edit',
      kind: 'update',
      hunks: [{ oldStart: 7, oldLines: 2, newStart: 7, newLines: 2, lines: [' const p = "postgres://u:pw1@h/db"', '-let n = 1', '+let n = 2'] }],
    })
    expect(merge([pem], tweak).changes[0]).toMatchObject({ kind: 'create', redacted: 2 })
  })

  test('files that may hold secrets', () => {
    for (const path of ['C:\\proj\\.env', '/proj/.env.local', '/proj/.env.production', 'certs/server.pem', 'tls.key', 'a.p12', 'b.pfx', 'prod.tfvars', '/home/u/.ssh/id_rsa', 'id_ed25519.pub', '.npmrc', '.pypirc', '.netrc', '.git-credentials', 'gcp-credentials.json', 'my-service-account.json', 'config/secrets.yml']) {
      expect([path, isSecretFile(path)]).toEqual([path, true])
    }
    for (const path of ['.env.example', '/proj/.env.sample', '.env.template', '.env.dist', 'src/key.ts', 'src/env.ts', 'keys.json', 'secret-santa.ts']) {
      expect([path, isSecretFile(path)]).toEqual([path, false])
    }
  })

  test('lock files and generated output', () => {
    for (const file of ['frontend/package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'Cargo.lock', 'go.sum', 'dist/app.js', 'build/index.html', '.next/server/page.js', 'coverage/lcov.info', 'packages/a/node_modules/x/index.js', 'src/__snapshots__/a.test.ts.snap', 'public/app.min.js', 'app.css.map', '/elsewhere/yarn.lock']) {
      expect([file, isGeneratedFile(file)]).toEqual([file, true])
    }
    // A build folder counts at the project's top only; a file outside the project by its name only.
    for (const file of ['src/build/index.ts', 'src/out.ts', 'docs/dist.md', '/home/u/dist/app.js', 'src/app.js']) {
      expect([file, isGeneratedFile(file)]).toEqual([file, false])
    }
  })

  test('excludePaths patterns, as in .gitignore', () => {
    expect(matchesPattern('legacy/a/b.ts', ['legacy/**'])).toBe(true)
    expect(matchesPattern('src/x.generated.ts', ['*.generated.ts'])).toBe(true)
    expect(matchesPattern('src/legacy/a.ts', ['legacy/**'])).toBe(false)
    expect(matchesPattern('src/legacy/a.ts', ['legacy'])).toBe(true)
    expect(matchesPattern('src/legacy/a.ts', ['legacy/'])).toBe(true)
    expect(matchesPattern('src/legacy', ['legacy/'])).toBe(false)
    expect(matchesPattern('src/gen/a.ts', ['/src/gen'])).toBe(true)
    expect(matchesPattern('src/gen/a/b.ts', ['src/**/b.ts'])).toBe(true)
    expect(matchesPattern('src/b.ts', ['src/**/b.ts'])).toBe(true)
    expect(matchesPattern('src/a.ts', ['src/?.ts'])).toBe(true)
    expect(matchesPattern('src\\Legacy\\a.ts', ['legacy/**', ' '])).toBe(false)
    expect(matchesPattern('Legacy\\a.ts', ['legacy/**'])).toBe(true)
    expect(matchesPattern('src/a.ts', [])).toBe(false)
    expect(matchesPattern('src/a.ts', ['', '  '])).toBe(false)
  })

  test('why a file is left out: the setting first, then secrets, then generated files', () => {
    expect(withheldOf('.env', '/proj/.env', ['.env'])).toBe('excluded')
    expect(withheldOf('.env', '/proj/.env', [])).toBe('secret')
    expect(withheldOf('dist/a.js', '/proj/dist/a.js', [])).toBe('generated')
    expect(withheldOf('src/a.ts', '/proj/src/a.ts', ['legacy/**'])).toBeUndefined()
    expect(withheldText([{ file: '.env', why: 'secret' }, { file: 'package-lock.json', why: 'generated' }])).toBe('.env (비밀값이 들 수 있는 파일) · package-lock.json (잠금·생성 파일)')
  })

  test('the note prompt names the files left out, the journal too, and the model is told not to guess', () => {
    const change = changeOf({ path: '/proj/a.ts', root: '/proj', tool: 'Edit', kind: 'update', hunks: [HUNK] })
    const withheld = [{ file: '.env', why: 'secret' as const }, { file: 'package-lock.json', why: 'generated' as const }]
    const prompt = notePrompt({ prompt: '키 설정', answer: '', changes: [change], moreFiles: 0, withheld }, 'beginner')
    expect(prompt).toContain('(노트에서 뺀 파일: .env — 비밀값이 들 수 있어 내용을 싣지 않음 · package-lock.json — 잠금·생성 파일)')
    expect(notePrompt({ prompt: '', answer: '', changes: [change], moreFiles: 0 }, 'beginner')).not.toContain('노트에서 뺀 파일')
    for (const system of [SYSTEM, ASK_SYSTEM]) {
      expect(system).toContain('값을 짐작하지 말고 이름으로만 말한다')
      expect(system).toContain(`${REDACTED}은 비밀값을 가린 자리다`)
    }
    const note = {
      id: 'n', turnId: 't', at: Date.UTC(2026, 9, 3, 1), prompt: '키 설정', answer: '', changes: [change], moreFiles: 0,
      status: 'off' as const, text: '', savedAs: null, isPast: false, root: '/proj', updatedAt: 0, concepts: [], withheld,
    }
    expect(journalSection(note)).toContain('**뺀 파일**: .env (비밀값이 들 수 있는 파일) · package-lock.json (잠금·생성 파일)')
    expect(journalSection({ ...note, withheld: undefined })).not.toContain('뺀 파일')
  })
})

describe('1.6.0: cost guardrails', () => {
  const edit = (path: string, lines: string[], kind: 'update' | 'create' = 'update') =>
    changeOf({ path, root: '/proj', tool: 'Edit', kind, hunks: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines }] })

  test('a change of spaces and line breaks alone, in a file where they change nothing, is told apart', () => {
    expect(isFormatOnly(edit('/proj/src/a.ts', ['-  return a', '+    return a']))).toBe(true)
    // Lines joined or split, spaces around punctuation, a blank line gone.
    expect(isFormatOnly(edit('/proj/src/a.ts', ['-foo(a,b)', '+foo(', '+  a,', '+  b', '+)']))).toBe(true)
    expect(isFormatOnly(edit('/proj/src/a.css', ['-a{color:red}', '+a {', '+  color: red', '+}']))).toBe(true)
    expect(isFormatOnly(edit('/proj/src/a.json', [' {', '-', '-  "a": 1', '+    "a": 1']))).toBe(true)
    // In a stylesheet the space before a selector part picks other elements; around a declaration it does not.
    expect(isFormatOnly(edit('/proj/src/a.css', ['-a .b{margin:0 .5em}', '+a .b {', '+  margin: 0 .5em', '+}']))).toBe(true)
    expect(isFormatOnly(edit('/proj/src/a.scss', ['-a .b {}', '+a.b {}']))).toBe(false)
    expect(isFormatOnly(edit('/proj/src/a.scss', ['-&:hover {}', '+& :hover {}']))).toBe(false)
    expect(isFormatOnly(edit('/proj/src/a.ts', ['-a .b', '+a.b']))).toBe(true)
    expect(isFormatOnly(edit('/proj/src/a.ts', ['-var x = 1', '+let x = 1']))).toBe(false)
    // A line moved past an unchanged one changes what runs first, though its '-' and '+' lines read alike.
    expect(isFormatOnly(edit('/proj/src/a.ts', ['-  init()', '   run()', '+  init()']))).toBe(false)
    expect(isFormatOnly(edit('/proj/src/a.ts', [' function f() {', '-  cleanup()', '   return x', '+  cleanup()', ' }']))).toBe(false)
    // Unchanged lines around a re-indented one change nothing.
    expect(isFormatOnly(edit('/proj/src/a.ts', [' function f(a) {', '-  return a', '+    return a', ' }']))).toBe(true)
    expect(isFormatOnly(edit('/proj/src/a.ts', ['-foo(a,b)', '+foo(a,b,)']))).toBe(false)
    // A space taken out between two words (in a string, too) is a change.
    expect(isFormatOnly(edit('/proj/src/a.ts', ["-say('Hello world')", "+say('Helloworld')"]))).toBe(false)
    expect(isFormatOnly(edit('/proj/src/a.ts', ["-say('안녕 하세요')", "+say('안녕하세요')"]))).toBe(false)
    // Python and YAML: indentation is meaning there.
    expect(isFormatOnly(edit('/proj/app.py', ['-  return a', '+    return a']))).toBe(false)
    expect(isFormatOnly(edit('/proj/ci.yaml', ['-  run: x', '+    run: x']))).toBe(false)
    // A new file, a diff cut short or a masked secret is never taken for one.
    expect(isFormatOnly(edit('/proj/src/a.ts', ['+  return a'], 'create'))).toBe(false)
    expect(isFormatOnly({ ...edit('/proj/src/a.ts', ['-  return a', '+    return a']), isCut: true })).toBe(false)
    expect(isFormatOnly(edit('/proj/src/a.ts', ['-const k = "sk-ant-api03-AAAAAAAAAAAAAAAAAAAA"', '+const k = "sk-ant-api03-BBBBBBBBBBBBBBBBBBBB"']))).toBe(false)
    expect(isFormatOnly({ kind: 'update', path: '/proj/a.ts', diff: '', isCut: false })).toBe(false)
  })

  test('the usage record adds up a day, keeps the newest days and reads back only what it can', () => {
    let record = addUsage({}, '2026-10-03', { calls: 1, auto: 1, input: 1200, output: 300 })
    record = addUsage(record, '2026-10-03', { calls: 1, input: 800, output: 100 })
    expect(record['2026-10-03']).toEqual({ calls: 2, auto: 1, input: 2000, output: 400 })
    const days: Record<string, { calls: number; auto: number; input: number; output: number }> = {}
    for (let i = 0; i < ACTIVITY_DAYS + 5; i += 1) days[new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)] = { calls: 1, auto: 0, input: 1, output: 1 }
    const kept = addUsage(days, '2026-12-31', { calls: 1 })
    expect(Object.keys(kept)).toHaveLength(ACTIVITY_DAYS)
    expect(kept['2026-01-01']).toBeUndefined()
    expect(kept['2026-12-31']).toEqual({ calls: 1, auto: 0, input: 0, output: 0 })
    expect(cleanUsage({ '2026-10-03': { calls: 2, auto: 'x', input: -5, output: 3.7 }, nope: { calls: 1 }, '2026-10-04': 7 })).toEqual({
      '2026-10-03': { calls: 2, auto: 0, input: 0, output: 3 },
    })
    expect(cleanUsage(undefined)).toEqual({})
    expect(cleanUsage([1])).toEqual({})
  })

  test('the usage line names today\'s calls, the week\'s and its tokens, never a price', () => {
    const now = new Date(2026, 9, 9, 12).getTime()
    const day = (back: number) => {
      const d = new Date(2026, 9, 9 - back, 12)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    const record = {
      [day(0)]: { calls: 12, auto: 9, input: 40_000, output: 6_000 },
      [day(3)]: { calls: 49, auto: 30, input: 140_000, output: 24_000 },
      [day(9)]: { calls: 100, auto: 100, input: 9_000_000, output: 9_000_000 },
    }
    expect(usageLine(record, now)).toBe('학습 노트의 모델 호출: 오늘 12번 (자동 노트 9) · 최근 7일 61번 · 입력 약 18만 · 출력 약 3만 토큰')
    expect(usageLine({ [day(1)]: { calls: 2, auto: 0, input: 900, output: 50 } }, now)).toBe('학습 노트의 모델 호출: 오늘 0번 · 최근 7일 2번 · 입력 900 · 출력 50 토큰')
    expect(usageLine({}, now)).toBe('학습 노트의 모델 호출: 최근 7일 동안 없습니다')
    expect([0, 999, 1000, 2600, 9600, 12_345, 99_960, 180_000, 123_456_789].map(tokenText)).toEqual([
      '0', '999', '약 1천', '약 3천', '약 1만', '약 1.2만', '약 10만', '약 18만', '약 1.2억',
    ])
  })

  test('a note a turn\'s end passed over says why in the journal', () => {
    const change = edit('/proj/src/a.ts', ['-  return a', '+    return a'])
    const note = {
      id: 'n', turnId: 't', at: Date.UTC(2026, 9, 3, 1), prompt: '정리', answer: '', changes: [change], moreFiles: 0,
      status: 'off' as const, text: '', savedAs: null, isPast: false, root: '/proj', updatedAt: 0, concepts: [],
    }
    expect(journalSection({ ...note, skip: 'format' })).toContain('_띄어쓰기·줄바꿈만 바뀌어 노트 없이 전후 코드만 남겼다._')
    expect(journalSection({ ...note, skip: 'limit' })).toContain('_하루 자동 노트 한도에 닿아 노트 없이 전후 코드만 남겼다._')
    expect(journalSection(note)).toContain('_노트 없이 전후 코드만 남겼다._')
  })
})

describe('1.6.0: the team file', () => {
  const FILE = [
    '# 우리 팀의 학습 노트 파일',
    '이 줄은 어느 절에도 없어 읽지 않습니다.',
    '',
    '## 규칙',
    '- API 호출은 fetcher로 감쌉니다',
    '* 상태는 zustand로 둡니다',
    '1. 바뀌지 않는 값은 const로 선언한다',
    '<!-- 이 주석은 읽지 않습니다 -->',
    '```ts',
    'const example = 1',
    '```',
    '',
    '## 용어',
    '- **정산**: 하루 매출을 마감하는 일',
    '- **불변 바인딩 (const)**: const로 묶은 이름',
    '- **출고: 창고에서 물건이 나가는 일',
    '- 굵게 없는 줄은 용어가 아닙니다',
    '',
    '## 노트에서 빼기',
    '- `legacy/**`',
    '- *.gen.ts, fixtures/',
    '- old-build/ (옛 빌드라 배울 것이 없음)',
    '- `my docs/**` 띄어쓰기가 든 경로',
    '```',
    '# 이 줄은 주석',
    'vendor/',
    '```',
    '## 그 밖',
    '- 여기는 아무것도 아닙니다',
  ].join('\n')

  test('rules, terms and patterns are read from under their headings', () => {
    const team = parseTeamFile(FILE)
    expect(team.rules).toEqual(['API 호출은 fetcher로 감쌉니다', '상태는 zustand로 둡니다', '바뀌지 않는 값은 const로 선언한다'])
    expect(team.terms).toEqual([
      { name: '정산', blurb: '하루 매출을 마감하는 일' },
      { name: '불변 바인딩 (const)', blurb: 'const로 묶은 이름' },
      // Its bold never closed: read as a note's concept line is, to its colon.
      { name: '출고', blurb: '창고에서 물건이 나가는 일' },
    ])
    expect(team.exclude).toEqual(['legacy/**', '*.gen.ts', 'fixtures/', 'old-build/', 'my docs/**', 'vendor/'])
    expect(team.isCut).toBe(false)
    expect(parseTeamFile(FILE.replace(/\n/g, '\r\n'))).toEqual(team)
  })

  test('a file with no such heading reads as empty, and the pane says what to write', () => {
    const team = parseTeamFile('- API 호출은 fetcher로 감쌉니다\n- **정산**: 하루 매출 마감\n')
    expect(team).toEqual({ rules: [], terms: [], exclude: [], isCut: false })
    expect(teamSection(team)).toEqual([])
    expect(teamText(team)).toContain('읽은 것이 없습니다 · 제목을 ## 규칙 · ## 용어 · ## 빼기로 씁니다')
    expect(teamText(parseTeamFile(FILE))).toBe('이 저장소의 팀 규칙 파일을 읽었습니다 (규칙 3 · 용어 3 · 빼기 6)')
  })

  test('rules and terms are kept to 3,000 characters together, the rules first', () => {
    const long = ['## 규칙', ...Array.from({ length: 20 }, (_, i) => `- 규칙 ${i} ${'가'.repeat(200)}`), '## 용어', '- **정산**: 하루 매출 마감'].join('\n')
    const team = parseTeamFile(long)
    const size = team.rules.join('').length + team.terms.reduce((sum, one) => sum + one.name.length + one.blurb.length, 0)
    expect(size).toBeLessThanOrEqual(TEAM_BUDGET)
    expect(team.rules.length).toBeLessThan(20)
    expect(team.terms).toEqual([])
    expect(team.isCut).toBe(true)
    expect(teamText(team)).toContain('· 규칙과 용어는 앞 3,000자만')
    // A short file is whole.
    const short = parseTeamFile('## 용어\n- **정산**: 하루 매출 마감\n')
    expect(short.terms).toEqual([{ name: '정산', blurb: '하루 매출 마감' }])
    expect(short.isCut).toBe(false)
  })

  test('a path pattern from the team file cannot make matching run for ever, and globs read as before', () => {
    const crafted = `a/${'**x'.repeat(12)}y`
    const started = Date.now()
    expect(matchesPattern(`a/${'x'.repeat(60)}.ts`, [crafted])).toBe(false)
    expect(Date.now() - started).toBeLessThan(1000)
    expect(matchesPattern(`a/${'x'.repeat(12)}y`, [crafted])).toBe(true)
    expect(matchesPattern(`a/${'x'.repeat(11)}y`, [crafted])).toBe(false)
    expect(matchesPattern('fixtures/a.json', ['**/fixtures/*.json'])).toBe(true)
    expect(matchesPattern('src/fixtures/a.json', ['**/fixtures/*.json'])).toBe(true)
    expect(matchesPattern('src/fixtures/b/a.json', ['**/fixtures/*.json'])).toBe(false)
    expect(matchesPattern('src/a/b.ts', ['src/*.ts'])).toBe(false)
    expect(matchesPattern('src/a/b.ts', ['src/**'])).toBe(true)
    expect(matchesPattern('src/a/b.ts', ['src/a?b.ts'])).toBe(false)
    expect(matchesPattern('SRC/Gen/A.TS', ['src/gen/*.ts'])).toBe(true)
    expect(matchesPattern('src/a+b(1).ts', ['src/a+b(1).ts'])).toBe(true)
  })

  test('the note prompt carries the rules and terms before the concepts already learned', () => {
    const team = parseTeamFile(FILE)
    const change = changeOf({ path: '/proj/a.ts', root: '/proj', tool: 'Edit', kind: 'update', hunks: [HUNK] })
    const prompt = notePrompt({ prompt: 'b를 상수로', answer: '', changes: [change], moreFiles: 0 }, 'beginner', ['정산', '클로저'], false, team)
    expect(prompt).toContain('## 이 저장소의 팀 규칙과 용어 (팀이 정한 참고 자료다.')
    expect(prompt).toContain('"팀 규칙:" 또는 "팀 규칙과 다를 수 있음:" 한 줄로 짚는다')
    expect(prompt).toContain('- 바뀌지 않는 값은 const로 선언한다')
    expect(prompt).toContain('- **불변 바인딩 (const)**: const로 묶은 이름')
    expect(prompt.indexOf('## 이 저장소의 팀 규칙과 용어')).toBeLessThan(prompt.indexOf('## 이미 배운 개념'))
    expect(prompt).toContain('## 이미 배운 개념 (지난 노트들에서)\n정산, 클로저\n')
    expect(prompt).toContain('(팀 규칙과 직접 닿으면 이 절 끝에')
    const plain = notePrompt({ prompt: 'b를 상수로', answer: '', changes: [change], moreFiles: 0 }, 'beginner', ['정산'])
    expect(plain).not.toContain('팀 규칙')
    expect(plain).toContain('## 이미 배운 개념 (지난 노트들에서)\n정산\n')
    const note = { prompt: 'b를 상수로', text: '노트', status: 'ready' as const, changes: [change], moreFiles: 0 }
    const asked = askPrompt(note, '왜 fetcher를 써요?', 'beginner', team)
    expect(asked).toContain('질문이 이 규칙이나 용어와 닿으면 근거로 삼아 답한다')
    expect(asked).toContain('- API 호출은 fetcher로 감쌉니다')
    expect(askPrompt(note, '왜?', 'beginner')).not.toContain('팀 규칙')
  })
})
