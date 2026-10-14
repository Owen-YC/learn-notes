import { describe, expect, test } from 'claude-code/testing'

import type { LearnChange, LearnNote } from '../types'
import { logParts, shareText, withoutPaths } from '../hooks/notes'

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

  test('(검토) the project however a Windows shell spells it (Git Bash, WSL, Cygwin, either slash, any case) goes on from there', () => {
    const root = 'C:\\Users\\kimminsu\\projects\\shop'
    expect(withoutPaths('/c/Users/kimminsu/projects/shop/src/api/fetcher.ts를 고쳤습니다', root)).toBe('src/api/fetcher.ts를 고쳤습니다')
    expect(withoutPaths('`/mnt/c/Users/kimminsu/projects/shop/src/a.ts` · C:/Users/kimminsu/projects/shop/b.ts · /cygdrive/c/Users/kimminsu/projects/shop/c.ts', root)).toBe('`src/a.ts` · b.ts · c.ts')
    expect(withoutPaths('c:\\users\\KIMMINSU\\Projects\\shop\\src\\a.ts · `C:\\\\Users\\\\kimminsu\\\\projects\\\\shop` 에서', root)).toBe('src\\a.ts · `shop` 에서')
    // A project WSL opened on the Windows drive: its Windows spelling is the same folder.
    expect(withoutPaths('C:\\Users\\kim\\proj\\a.ts · /mnt/c/Users/kim/proj/b.ts', '/mnt/c/Users/kim/proj')).toBe('a.ts · b.ts')
  })

  test('(검토) a local path outside the project in any of those spellings, a file URL, /var/home and /Volumes keep only their last name', () => {
    const text = '/mnt/c/Users/kim/other/x.py · /c/Users/kim/other/y.py · /cygdrive/d/work/z.py · /mnt/d/work/q.py · /var/home/kim/w.py · /Volumes/Work/kim/v.py · file:///home/kim/other/u.html · file:///C:/Users/kim/t.html'
    expect(withoutPaths(text, '/mnt/c/Users/kim/proj')).toBe('x.py · y.py · z.py · q.py · w.py · v.py · u.html · t.html')
    expect(withoutPaths('/c/Users/kim · /mnt/c/Users/kim/ 아래 · file:///home/kim')).toBe('~ · ~ 아래 · ~')
  })

  test("(검토) a project at the home folder is ~, never its owner's name; a user name with a space goes whole", () => {
    expect(withoutPaths('`C:\\Users\\kimminsu` 에서 · C:\\Users\\kimminsu 폴더에 hello.py를 · C:\\Users\\kimminsu\\hello.py', 'C:\\Users\\kimminsu')).toBe('`~` 에서 · ~ 폴더에 hello.py를 · hello.py')
    expect(withoutPaths('/Users/kimminsu 에서 · /Users/kimminsu/hello.py', '/Users/kimminsu/')).toBe('~ 에서 · hello.py')
    // The owner's home, known from the project's folder, goes whole however the sentence goes on.
    const root = 'C:\\Users\\Kim Min\\proj'
    expect(withoutPaths('C:\\Users\\Kim Min\\other\\x.py · `C:\\Users\\Kim Min` · C:\\Users\\Kim Min 폴더에 · C:\\Users\\Kim Min\\proj\\a.ts', root)).toBe('x.py · `~` · ~ 폴더에 · a.ts')
    // Someone else's, with no project to tell: a space in it is taken up to the separator or quote that ends it.
    expect(withoutPaths('C:\\Users\\Lee Joon\\other\\x.py · `C:\\Users\\Lee Joon` · C:\\Users\\lee 폴더에서', '/proj')).toBe('x.py · `~` · ~ 폴더에서')
  })

  test('(검토) code that only looks like a drive or a network share is left as written', () => {
    const kept = '- **객체**: — `const rules = {a:/^x$/}` · `re.compile("\\\\d+\\\\.\\\\d+")` · `name.split("\\\\")[-1]` · `"a\\\\b"`'
    expect(withoutPaths(kept, '/proj')).toBe(kept)
    // A real one in a string literal, its backslashes doubled, still goes.
    expect(withoutPaths('`open("C:\\\\Users\\\\kim\\\\secret.txt")` · `"\\\\\\\\server\\\\share\\\\a.txt"`', '/proj')).toBe('`open("secret.txt")` · `"a.txt"`')
  })

  test('(검토) a dim line too long for a terminal is cut at a paragraph, else a line, else anywhere but inside a character', () => {
    expect(logParts('짧은 글')).toEqual(['짧은 글'])
    expect(logParts('aaaa\n\nbbbb\ncccc', 10)).toEqual(['aaaa', 'bbbb\ncccc'])
    expect(logParts('aaaa\nbbbb\ncccc', 10)).toEqual(['aaaa\nbbbb', 'cccc'])
    expect(logParts('a'.repeat(9) + '😀b', 10)).toEqual(['a'.repeat(9), '😀b'])
    const long = Array.from({ length: 300 }, (_, i) => `${i}번째 줄입니다`).join('\n')
    const parts = logParts(long)
    expect(parts.every(part => part.length <= 2000)).toBe(true)
    expect(parts.join('\n')).toBe(long)
  })

  test('(검토) a file left out from outside the project goes by its name alone', () => {
    const text = shareText(note({ withheld: [{ file: '/opt/keys/prod.env', why: 'secret' }, { file: 'D:\\vault\\id_rsa', why: 'secret' }, { file: 'config/.env', why: 'secret' }] }), [])
    expect(text).toContain('노트에서 뺀 파일: prod.env (비밀값이 들 수 있는 파일) · id_rsa (비밀값이 들 수 있는 파일) · config/.env (비밀값이 들 수 있는 파일)')
    expect(text).not.toContain('/opt/keys')
    expect(text).not.toContain('vault')
  })
})
