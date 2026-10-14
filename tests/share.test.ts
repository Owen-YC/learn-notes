import { describe, expect, test } from 'claude-code/testing'

import type { LearnChange, LearnNote } from '../types'
import { shareText, withoutPaths } from '../hooks/notes'

const AT = new Date(2026, 9, 13, 14, 5).getTime()
const KEY = 'sk-ant-api03-AAAAAAAAAAAAAAAAAAAA'

function change(file: string, path = `/home/u/work/billing/${file}`): LearnChange {
  return { file, path, tool: 'Edit', kind: 'update', added: 3, removed: 1, diff: '@@ -1,1 +1,3 @@\n-  return res\n+  return retry(res)', isCut: false }
}

const TEXT = [
  '### 한 줄 요약',
  '응답이 401이면 토큰을 새로 받아 다시 부릅니다',
  '### 무엇이 바뀌었나',
  '- 전: 401이면 그대로 실패했습니다',
  '- 후: 토큰을 새로 받아 한 번 더 부릅니다',
  '- 예: `fetchUser()` → 전: 오류 / 후: 사용자 정보',
  '### 왜 이렇게 바꿨을까',
  '토큰이 만료되면 /home/u/work/billing/src/api/fetcher.ts의 요청이 실패하기 때문입니다.',
  '```diff',
  '-  return res',
  '+  return retry(res)',
  '```',
  '### 배울 개념',
  '- **async/await**: 기다리는 함수 — `const res = await fetch(url)`',
  '- **try/catch**: 오류 잡기 — `try { await refresh() } catch (e) {}`',
  '### 직접 확인해 볼 것',
  '- 토큰을 일부러 지워 보기',
].join('\n')

/** A written note whose request, questions and diff must never reach the copy. */
function note(over: Partial<LearnNote> = {}): LearnNote {
  return {
    id: 'n1',
    turnId: 't1',
    at: AT,
    prompt: '/home/u/work/billing 에서 토큰 갱신을 붙여 줘 (비밀 요청 문장)',
    answer: '바꿨습니다',
    changes: [change('src/api/fetcher.ts'), change('src/api/token.ts')],
    moreFiles: 0,
    status: 'ready',
    text: TEXT,
    savedAs: 'ready',
    isPast: false,
    root: '/home/u/work/billing',
    updatedAt: AT,
    concepts: ['c:async/await', 'c:try/catch'],
    asks: [{ question: '노트 아래에서 물은 질문', answer: '노트 아래의 답', at: AT + 1 }],
    withheld: [{ file: '.env', why: 'secret' }],
    ...over,
  }
}

describe('1.7.0: a note copied for a mentor (c, /learn 공유)', () => {
  test('the copy: a bold title, the day, files and concepts, the note in sections, what was left out, and a blank to ask in', () => {
    expect(shareText(note(), ['async/await', 'try/catch']).split('\n')).toEqual([
      '**[학습 노트] 응답이 401이면 토큰을 새로 받아 다시 부릅니다**',
      '10-13 · 파일 2개 · 개념: async/await · try/catch',
      '',
      '**무엇이 바뀌었나**',
      '- 전: 401이면 그대로 실패했습니다',
      '- 후: 토큰을 새로 받아 한 번 더 부릅니다',
      '- 예: `fetchUser()` → 전: 오류 / 후: 사용자 정보',
      '',
      '**왜 이렇게 바꿨을까**',
      // Where the project lies on this computer stays here: the file as the project names it.
      '토큰이 만료되면 src/api/fetcher.ts의 요청이 실패하기 때문입니다.',
      '',
      '**배울 개념**',
      // The one-line quotes of the concepts stay (the owner's decision); the diff block does not.
      '- **async/await**: 기다리는 함수 — `const res = await fetch(url)`',
      '- **try/catch**: 오류 잡기 — `try { await refresh() } catch (e) {}`',
      '',
      '**직접 확인해 볼 것**',
      '- 토큰을 일부러 지워 보기',
      '',
      '노트에서 뺀 파일: .env (비밀값이 들 수 있는 파일)',
      '',
      '**묻고 싶은 것**: ',
    ])
  })

  test('no request, no question asked under the note, no diff and no path go in; a secret the note quoted is masked', () => {
    const text = shareText(note({ text: TEXT.replace('`const res = await fetch(url)`', `\`const key = "${KEY}"\``) }), ['async/await'])
    expect(text).not.toContain('비밀 요청 문장')
    expect(text).not.toContain('노트 아래에서 물은 질문')
    expect(text).not.toContain('노트 아래의 답')
    expect(text).not.toContain('return retry(res)')
    expect(text).not.toContain('```')
    expect(text).not.toContain('/home/u')
    expect(text).not.toContain('billing')
    expect(text).not.toContain(KEY)
    expect(text).toContain('`const key = "«가림»"`')
  })

  test('a note with no concepts, no summary heading, or a code block left open still reads, and nothing past the open fence goes in', () => {
    const plain = shareText(note({ text: '로그인 버튼을 고쳤습니다\n\n```js\nconst token = read()\n', withheld: undefined, changes: [change('a.ts')], moreFiles: 2 }), [])
    expect(plain.split('\n')).toEqual(['**[학습 노트] 로그인 버튼을 고쳤습니다**', '10-13 · 파일 3개', '', '로그인 버튼을 고쳤습니다', '', '**묻고 싶은 것**: '])
    expect(shareText(note({ text: '' }), []).split('\n').slice(0, 2)).toEqual(['**[학습 노트]**', '10-13 · 파일 2개'])
  })

  test('a path under the project goes on from there; any other local path keeps its last name, a home folder is ~', () => {
    expect(withoutPaths('/home/u/shop/src/a.ts · `/home/u/shop` · /home/u/shopping/b.ts', '/home/u/shop')).toBe('src/a.ts · `shop` · b.ts')
    expect(withoutPaths('C:\\Users\\kim\\shop\\src\\a.ts', 'C:\\Users\\kim\\shop')).toBe('src\\a.ts')
    expect(withoutPaths('`/home/u/proj/src/a.ts` · C:\\Users\\kim\\proj\\b.ts · D:/work/c.ts · ~/proj/d.ts · \\\\server\\share\\e.ts · /Users/kim/f.ts')).toBe('`a.ts` · b.ts · c.ts · d.ts · e.ts · f.ts')
    expect(withoutPaths('/home/kim 아래 · C:\\Users\\kim\\ 아래')).toBe('~ 아래 · ~ 아래')
  })

  test('a relative path, a route in code, a URL and a pair of words with a slash stay', () => {
    const kept = "src/api/fetcher.ts · src\\api\\x.ts · `fetch('/api/users/1')` · https://example.com/home/a · async/await · 전 / 후 · /learn 진단 · 10/13/2026 · src/proj/a.ts"
    expect(withoutPaths(kept, '/proj')).toBe(kept)
  })
})
