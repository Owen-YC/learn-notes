import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import { journalPath } from '../hooks/notes'

const NOW = Date.UTC(2026, 9, 3, 1)
const NOTES_DIR = '/home/u/.claude/learning-notes'
/** This project's journal for the mocked day, as the mod names it. */
const JOURNAL = journalPath(NOTES_DIR, NOW, '/proj')

const PANE_PROPS = {
  title: '학습 노트',
  isFocused: true,
  bodyColumns: 60,
  placement: 'dock' as 'dock' | 'inline',
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}

const NOTE_TEXT = [
  '### 한 줄 요약',
  'let을 const로 바꿔 값이 다시 바뀌지 않게 했다',
  '### 무엇이 바뀌었나',
  '- `src/a.ts`: `let b` → `const b`',
].join('\n')

const USAGE = { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

type Model = 'ok' | 'error' | 'reject' | 'hold'

type World = {
  /** How the model answers from now on. */
  model: Model
  writes: { path: string; text: string }[]
  logs: string[]
  store: Map<string, unknown>
  answer: string
  root: string
  storeFails: boolean
  /** True while every disk write fails (a folder that cannot be written). */
  writeFails: boolean
  journal: () => { path: string; text: string }[]
  toasts: string[]
  statuses: (string | undefined)[]
  models: string[]
  opened: string[]
  files: Map<string, string>
  release: () => void
  clock: ReturnType<typeof mock.clock>
}

/** The engine beneath the plugin: a project at /proj, a home, a disk in memory, a model. */
function world(
  on: On,
  model: Model = 'ok',
  panes: { isShown: boolean } | null = null,
  isPlaced = true,
  store: Map<string, unknown> = new Map(),
  env: Record<string, string> = {},
): World {
  let release = () => {}
  const held = new Promise<void>(resolve => {
    release = resolve
  })
  const w: World = {
    model,
    writes: [],
    logs: [],
    store,
    answer: NOTE_TEXT,
    root: '/proj',
    storeFails: false,
    writeFails: false,
    journal: () => w.writes.filter(write => !write.path.endsWith('/concepts.md')),
    toasts: [],
    statuses: [],
    models: [],
    opened: [],
    files: new Map(),
    release: () => release(),
    clock: mock.clock(on, { now: Date.UTC(2026, 9, 3, 1) }),
  }
  mock.env(on, { HOME: '/home/u', ...env })
  on('session.root', () => ({ value: w.root }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  // The store as JSON, as the host keeps it: what goes in comes back a copy.
  on('store.get', (_$, e) => ({ value: w.store.has(e.key) ? JSON.parse(JSON.stringify(w.store.get(e.key))) : undefined }))
  on('store.set', (_$, e) => {
    if (w.storeFails) throw new Error('store over 4 MiB')
    w.store.set(e.key, JSON.parse(JSON.stringify(e.value)))
    return { value: undefined }
  })
  on('ui.log', (_$, e) => {
    w.logs.push(e.text)
    return { value: undefined }
  })
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  // A hook beneath that stops prompts holding a secret, as a secret scanner would.
  on('prompt.submit', (_$, e) => (e.text.includes('SECRET') ? { drop: 'blocked: contains a secret' } : { text: e.text }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('ui.render', { component: 'Spinner' }, ($, e) => $.ui.resolve(e).Text({ children: e.props.word }))
  on('fs.exists', (_$, e) => ({ value: w.files.has(e.path) }))
  on('fs.stat', (_$, e) => ({
    value: { kind: 'file' as const, size: (w.files.get(e.path) ?? '').length, mtimeMs: 0, isLink: false },
  }))
  on('fs.read', (_$, e) => ({ value: w.files.get(e.path) ?? '' }))
  on('fs.list', (_$, e) => ({
    value: [...w.files.keys()]
      .filter(path => path.startsWith(`${e.path}/`) && !path.slice(e.path.length + 1).includes('/'))
      .map(path => ({ name: path.slice(e.path.length + 1), kind: 'file' as const, size: 1, mtimeMs: 0, isLink: false })),
  }))
  on('fs.write', (_$, e) => {
    if (w.writeFails) throw new Error('EACCES: permission denied')
    w.writes.push({ path: e.path, text: e.text })
    w.files.set(e.path, e.text)
    return { value: undefined }
  })
  on('ui.toast', (_$, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.status', (_$, e) => {
    w.statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.panes', () => ({
    value: panes ? [{ id: 'learn-notes', title: '학습 노트', isShown: panes.isShown, isFocused: false, isPlaced: true }] : [],
  }))
  on('ui.open', (_$, e) => {
    w.opened.push(e.id)
    return { value: isPlaced ? { isPlaced: true } : { isPlaced: false, reason: 'no surface places panes' } }
  })
  on('model.complete', async (_$, e) => {
    w.models.push(e.prompt)
    if (w.model === 'reject') return { deny: 'model blocked by policy' }
    if (w.model === 'hold') await held
    return w.model === 'error'
      ? { value: { isAnswered: false, reason: 'api-error', status: 529, error: 'overloaded', usage: USAGE } }
      : { value: { isAnswered: true, text: w.answer, usage: USAGE } }
  })
  on('tool.call', { tool: 'Edit' }, (_$, e) => {
    if (e.file_path.endsWith('broken.ts')) return { isError: true, result: 'boom', text: 'boom' }
    return {
      result: {
        filePath: e.file_path,
        oldString: e.old_string,
        newString: e.new_string,
        originalFile: 'const a = 1\nlet b = 2\n',
        structuredPatch: [
          { oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: [' const a = 1', '-let b = 2', '+const b = 2'] },
        ],
        userModified: false,
        replaceAll: false,
      },
    }
  })
  on('tool.call', { tool: 'Write' }, (_$, e) =>
    e.file_path.endsWith('a.ts')
      ? {
          result: {
            type: 'update',
            filePath: e.file_path,
            content: e.content,
            originalFile: 'const a = 1\nconst b = 2\n',
            structuredPatch: [{ oldStart: 2, oldLines: 1, newStart: 2, newLines: 2, lines: [' const b = 2', '+const c = 3'] }],
          },
        }
      : e.file_path.endsWith('big.ts')
      ? { result: { type: 'update', filePath: e.file_path, content: e.content, structuredPatch: [], originalFile: null } }
      : { result: { type: 'create', filePath: e.file_path, content: e.content, structuredPatch: [], originalFile: null } },
  )
  on('tool.call', { tool: 'Bash' }, (_$, e) => {
    if (e.command.includes('nodiff')) {
      // A run the engine could not diff (Git Bash on Windows, a folder outside git): it wrote a file all the same.
      w.files.set('/proj/notes.txt', '첫 줄\n둘째 줄\n')
      return { result: { stdout: '', stderr: '', interrupted: false } }
    }
    return {
    result: {
      stdout: '',
      stderr: '',
      interrupted: false,
      bashEditDiff: {
        files: [
          {
            filePath: '/proj/src/style.css',
            hunks: [{ oldStart: 4, oldLines: 1, newStart: 4, newLines: 1, lines: ['-  color: red;', '+  color: blue;'] }],
          },
        ],
        moreFiles: e.command.includes('many') ? 3 : 0,
      },
    },
    }
  })
  return w
}

async function turn($: Engine, edits: () => Promise<unknown>, id = 't1', text = 'b를 상수로 바꾸고 새 파일도 만들어줘') {
  await $.turn.start({ text, turnId: id })
  await edits()
  await $.turn.complete({ answer: '바꿨습니다', durationMs: 5, isAborted: false, turnId: id, reason: 'answer' })
}

async function finish(w: World) {
  await w.clock.advance(5)
  await w.clock.settle()
}

function learn($: Engine, args: string) {
  return $.command.run({
    command: 'learn',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 160 },
  })
}

function pane($: Engine, surface: 'terminal' | 'desktop' = 'terminal', props = PANE_PROPS) {
  return $.ui.mount({ plugin: 'learn-notes', surface, component: 'Pane', requestId: 'learn-notes', props })
}

/**
 * Where the plugin asked the pane to scroll, in order. Nothing beneath answers $.ui.scroll in this kit and a
 * test's on('ui.scroll') is not asked either, so each request shows as the debug line saying why it did not move.
 */
function scrollsOf(w: World): { key: string; block: string; site: string }[] {
  return w.logs.flatMap(line => {
    const m = /^learn-notes: (\S+) \((\w+), (\S+)\)로 스크롤하지/.exec(line)
    return m ? [{ key: m[1]!, block: m[2]!, site: m[3]! }] : []
  })
}

/** Draws the spinner as the fullscreen terminal does, which tells the plugin a pane would dock. */
async function fullscreen($: Engine, isFullscreen = true) {
  const ui = await $.ui.mount({
    plugin: 'learn-notes',
    surface: 'terminal',
    component: 'Spinner',
    props: { word: 'Thinking', message: null, suffix: '', mode: 'thinking' },
    viewport: { columns: 200, rows: 50, isFullscreen },
  })
  await ui.unmount()
}

const EDIT_A = { tool: 'Edit', tool_use_id: 'u1', file_path: '/proj/src/a.ts', old_string: 'let', new_string: 'const' } as const

test('a turn that edits files becomes a written, saved note', async ($, on) => {
  const w = world(on)
  await turn($, async () => {
    await $.tool.call(EDIT_A)
    await $.tool.call({ tool: 'Edit', tool_use_id: 'u2', file_path: '/proj/src/broken.ts', old_string: 'x', new_string: 'y' })
    await $.tool.call({ tool: 'Write', tool_use_id: 'u3', file_path: '/proj/src/new.ts', content: 'export const n = 1\n' })
  })
  await finish(w)

  expect(w.models).toHaveLength(1)
  expect(w.models[0]).toContain('상수로')
  expect(w.models[0]).toContain('+const b = 2')
  expect(w.models[0]).toContain('### src/new.ts (새 파일, +1 −0)')
  expect(w.models[0]).not.toContain('broken.ts')

  expect(w.writes).toHaveLength(1)
  expect(w.writes[0]!.path).toBe(JOURNAL)
  expect(JOURNAL).toMatch(/^\/home\/u\/\.claude\/learning-notes\/2026-10-0[23]_proj_[0-9a-z]{5}\.md$/)
  expect(w.writes[0]!.text).toContain('# 학습 노트')
  expect(w.writes[0]!.text).toContain('let을 const로')
  expect(w.writes[0]!.text).toContain('`src/a.ts` (수정, +1 −1)')
  expect(w.toasts[0]).toBe('학습 노트: let을 const로 바꿔 값이 다시 바뀌지 않게 했다 · /learn으로 보기')
  expect(w.logs).toEqual([])

  const last = await learn($, 'last')
  expect(last.text).toContain('src/a.ts (+1 −1), src/new.ts (+1 −0)')
  expect(last.text).toContain('let을 const로')

  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /노트 1\/1/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /파일 2개 · \+2 −1/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /작업 중/ })).toBeUndefined()
  await ui.unmount()
})

test('edits show live in the pane while the turn runs', async ($, on) => {
  world(on)
  await $.turn.start({ text: '고쳐줘', turnId: 't1' })
  await $.tool.call(EDIT_A)
  const docked = await pane($)
  expect(await docked.find({ type: 'Text', text: /● 작업 중: 파일 1개 · 턴이 끝나면 노트를 씁니다/ })).toBeDefined()
  expect(await docked.find({ type: 'Text', text: /src\/a\.ts \+1 −1/ })).toBeDefined()
  await docked.unmount()

  const inline = await pane($, 'terminal', { ...PANE_PROPS, placement: 'inline' })
  expect(await inline.find({ type: 'Text', text: /● 작업 중: 파일 1개 \(a\.ts\)/ })).toBeDefined()
  await inline.unmount()
})

test('a turn with no edits leaves no note', async ($, on) => {
  const w = world(on)
  await turn($, async () => {})
  await finish(w)
  expect(w.models).toHaveLength(0)
  expect(w.writes).toHaveLength(0)
  expect((await learn($, 'last')).text).toContain('아직 학습 노트가 없습니다')
})

test('a subagent turn ending does not close the main turn', async ($, on) => {
  const w = world(on)
  await $.turn.start({ text: '고쳐줘', turnId: 't1' })
  await $.tool.call(EDIT_A)
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 'sub', agentId: 'a1', reason: 'answer' })
  await finish(w)
  expect(w.models).toHaveLength(0)
  await $.turn.complete({ answer: '끝', durationMs: 5, isAborted: false, turnId: 't1', reason: 'answer' })
  await finish(w)
  expect(w.models).toHaveLength(1)
})

test('an API error leaves a failed note that says what to do', async ($, on) => {
  const w = world(on, 'error')
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect((await learn($, 'last')).text).toContain('서버가 붐빕니다. 잠시 뒤 다시 해 보세요 · w로 다시 쓰기')
  expect(w.toasts).toHaveLength(0)
  expect(w.writes[0]!.text).toContain('노트를 쓰지 못했다: 서버가 붐빕니다')

  const ui = await pane($)
  expect(await ui.find({ type: 'Button', key: 'write', text: '다시 쓰기' })).toBeDefined()
  await ui.unmount()
})

test('a rewrite that fails leaves the written note as it was, in the pane, the store and the journal (review)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const before = w.journal().length
  w.model = 'error'
  const ui = await pane($)
  await ui.press({ key: 'write' })
  await w.clock.settle()
  expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
  expect(w.toasts.at(-1)).toContain('노트를 다시 쓰지 못했습니다: 서버가 붐빕니다')
  expect(w.toasts.at(-1)).toContain('원래 노트는 그대로입니다')
  await ui.unmount()
  expect((await learn($, 'last')).text).toContain('let을 const로')
  expect((store.get('history') as Record<string, { notes: { status: string }[] }>)['/proj']!.notes[0]).toMatchObject({ status: 'ready' })
  expect(w.journal().length).toBe(before)
})

test('a model the engine refuses to call fails the note instead of leaving it writing', async ($, on) => {
  const w = world(on, 'reject')
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const last = await learn($, 'last')
  expect(last.text).toContain("'haiku' 모델을 부를 수 없습니다")
  expect(last.text).not.toContain('쓰는 중')
  expect(w.writes).toHaveLength(1)
})

test('a note cleared while it is being written still reaches the journal', async ($, on) => {
  const w = world(on, 'hold')
  await turn($, () => $.tool.call(EDIT_A))
  await w.clock.advance(5)
  expect(w.models).toHaveLength(1)
  await learn($, 'clear')
  w.release()
  await w.clock.settle()
  expect(w.writes).toHaveLength(1)
  expect(w.writes[0]!.text).toContain('let을 const로')
})

test('with autoNote off no model is called, the diff is saved and w writes the note', { options: { autoNote: false } }, async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.models).toHaveLength(0)
  expect(w.writes[0]!.text).toContain('+const b = 2')
  expect((await learn($, 'last')).text).toContain('자동 노트가 꺼져 있습니다')

  const ui = await pane($)
  await ui.press({ key: 'write' })
  await w.clock.settle()
  expect(w.models).toHaveLength(1)
  expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
  expect(w.writes.at(-1)!.text).toContain('(다시 쓴 노트)')
  await ui.unmount()
})

test('with autoSave off nothing is written until /learn save, and only once', { options: { autoSave: false } }, async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.models).toHaveLength(1)
  expect(w.writes).toHaveLength(0)

  expect((await learn($, 'save')).text).toContain('노트 1개를 저장했습니다: /home/u/.claude/learning-notes/')
  expect(w.journal()).toHaveLength(1)
  expect((await learn($, 'save')).text).toContain('저장할 새 노트가 없습니다')
  expect(w.journal()).toHaveLength(1)
  expect(w.files.has('/home/u/.claude/learning-notes/concepts.md')).toBe(true)
})

test('/learn save with autoSave on has nothing new to write', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect((await learn($, 'save')).text).toContain('저장할 새 노트가 없습니다')
  expect(w.journal()).toHaveLength(1)
})

test('a saveDir under ~ lands in the home folder', { options: { saveDir: '~/notes' } }, async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.writes[0]!.path).toBe(journalPath('/home/u/notes', NOW, '/proj'))
})

test('a journal near the read limit rolls over to the next part', async ($, on) => {
  const w = world(on)
  w.files.set(JOURNAL, 'x'.repeat(3_000_001))
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.writes[0]!.path).toBe(journalPath(NOTES_DIR, NOW, '/proj', 2))
  expect(w.writes[0]!.path).toMatch(/~2\.md$/)
  expect(w.writes[0]!.text.startsWith('# 학습 노트')).toBe(true)
})

test('shell commands that change files are collected, and their unlisted files counted', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'sed -i s/red/blue/ many files' }))
  await finish(w)
  expect(w.models[0]).toContain('### src/style.css (수정, +1 −1)')
  expect(w.models[0]).toContain('그 밖에 파일 3개')
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /파일 4개/ })).toBeDefined()
  await ui.unmount()
})

test('a large Write with no diff still shows, marked as having none', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/big.ts', content: 'big\n' }))
  await finish(w)
  expect(w.models[0]).toContain('### src/big.ts (수정, +0 −0, 파일이 커서 diff를 만들지 못함)')
  const ui = await pane($)
  await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /파일이 커서 바뀐 곳을 만들지 못했습니다/ })).toBeDefined()
  await ui.unmount()
})

test('plan files Claude writes under ~/.claude are not learning material', async ($, on) => {
  const w = world(on)
  await turn($, () =>
    $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/home/u/.claude/plans/plan.md', content: '# plan\n' }),
  )
  await finish(w)
  expect(w.models).toHaveLength(0)
})

test('the pane opens itself once, and only where it docks', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.opened).toEqual([])

  await fullscreen($)
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u3' }), 't3')
  await finish(w)
  expect(w.opened).toEqual(['learn-notes'])
})

test('the main-screen terminal never opens the pane unasked', async ($, on) => {
  const w = world(on)
  await fullscreen($, false)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.opened).toEqual([])
})

test('no toast while the pane is on screen', async ($, on) => {
  const w = world(on, 'ok', { isShown: true })
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.toasts).toHaveLength(0)
})

test('the pane walks note → before/after → concepts, the changed line marked and its changed word in bold', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await pane($, surface)
    expect(await ui.find({ type: 'Text', text: /노트 1\/1/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'view', text: '전/후' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'quiz', text: '퀴즈' })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: 'diff' })).toBeUndefined()

    await ui.press({ key: 'view' })
    expect(await ui.find({ type: 'Text', text: /바뀐 줄은 −·\+로, 그 줄에서 바뀐 낱말은 굵게/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /− 전 · 1~2행/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\+ 후 · 1~2행/ })).toBeDefined()
    // The unchanged line is dim on both sides; the changed one is marked, only the word that changed in bold.
    const same = await ui.findAll({ type: 'Text', text: 'const a = 1' })
    expect(same.filter(one => one.props.dimColor === true)).toHaveLength(2)
    expect(await ui.find({ type: 'Text', text: /^−$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^\+$/ })).toBeDefined()
    const removed = await ui.find({ type: 'Text', text: /^let$/ })
    expect(removed?.props).toMatchObject({ color: 'red', bold: true })
    const added = await ui.find({ type: 'Text', text: /^const$/ })
    expect(added?.props).toMatchObject({ color: 'green', bold: true })
    expect(await ui.find({ type: 'Text', text: 'let b = 2' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'const b = 2' })).toBeDefined()

    await ui.press({ key: 'view' })
    expect(await ui.find({ type: 'Text', text: /아직 모인 개념이 없습니다/ })).toBeDefined()

    await ui.press({ key: 'view' })
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()

    // The quiz is q's from any view, and v goes back to the note.
    await ui.press({ key: 'quiz' })
    expect(await ui.find({ type: 'Text', text: /아직 모인 개념이 없어 퀴즈를 낼 수 없습니다/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'quiz-new' })).toBeUndefined()
    await ui.press({ key: 'view' })
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    // A click on a view's name goes straight there.
    await ui.press({ key: 'view-concepts' })
    expect(await ui.find({ type: 'Text', text: /아직 모인 개념이 없습니다/ })).toBeDefined()
    await ui.press({ key: 'view-split' })
    expect(await ui.find({ type: 'Text', text: /− 전 · 1~2행/ })).toBeDefined()
    await ui.press({ key: 'view-note' })
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    await ui.unmount()
  }
})

test('an unfocused terminal pane says how to reach its keys', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: false })
  expect(await ui.find({ type: 'Text', text: /단축키는 ctrl\+x tab으로 패널을 고른 뒤 누릅니다/ })).toBeDefined()
  await ui.unmount()
})

test('prev and next walk between notes, and the newest is followed', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A), 't1', '요청 t1')
  await finish(w)

  const ui = await pane($)
  await ui.press({ key: 'prev' })
  expect(await ui.find({ type: 'Text', text: /노트 1\/1/ })).toBeDefined()

  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2', '요청 t2')
  await finish(w)
  await ui.redraw()
  expect(await ui.find({ type: 'Text', text: /노트 2\/2/ })).toBeDefined()

  await ui.press({ key: 'prev' })
  expect(await ui.find({ type: 'Text', text: /노트 1\/2/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /요청 t1/ })).toBeDefined()
  await ui.press({ key: 'prev' })
  expect(await ui.find({ type: 'Text', text: /노트 1\/2/ })).toBeDefined()
  await ui.press({ key: 'next' })
  expect(await ui.find({ type: 'Text', text: /노트 2\/2/ })).toBeDefined()
  await ui.unmount()
})

test('the pane before any note says what it will do', async ($, on) => {
  world(on)
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /아직 학습 노트가 없습니다/ })).toBeDefined()
  await ui.unmount()
})

test('/learn opens the pane, prints usage for unknown words and clear empties it', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)

  expect((await learn($, '')).text).toContain('열었습니다')
  expect(w.opened).toEqual(['learn-notes'])
  expect((await learn($, 'what')).text).toContain("모르는 하위 명령입니다: 'what'")
  expect((await learn($, 'what')).text).toContain('/learn help')
  // Korean words work as the subcommands do.
  expect((await learn($, '도움말')).text).toContain('learn-notes 명령')
  expect((await learn($, '마지막')).text).toContain('let을 const로')

  await learn($, 'clear')
  expect((await learn($, 'last')).text).toContain('아직 학습 노트가 없습니다')
})

test('two notes finishing together both reach the journal', async ($, on) => {
  const w = world(on, 'hold')
  await turn($, () => $.tool.call(EDIT_A), 't1', '첫 요청')
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2', '둘째 요청')
  await w.clock.advance(5)
  expect(w.models).toHaveLength(2)
  w.release()
  await w.clock.settle()
  const journal = [...w.files.values()].join('')
  expect(journal).toContain('첫 요청')
  expect(journal).toContain('둘째 요청')
  expect(w.files.size).toBe(1)
})

test('/learn prints the last note where no pane can be placed', async ($, on) => {
  const w = world(on, 'ok', null, false)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const shown = await learn($, '')
  expect(shown.text).toContain('이 화면에는 패널을 띄울 수 없어')
  expect(shown.text).toContain('let을 const로')
  expect(w.logs.join('\n')).toContain('no surface places panes')
})

test('with autoOpen off the pane never opens itself', { options: { autoOpen: false } }, async ($, on) => {
  const w = world(on)
  await fullscreen($)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.opened).toEqual([])
})

test('an Edit then a Write of one file make one change', async ($, on) => {
  const w = world(on)
  await turn($, async () => {
    await $.tool.call(EDIT_A)
    await $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/a.ts', content: 'const a = 1\nconst b = 2\nconst c = 3\n' })
  })
  await finish(w)
  expect(w.models[0]).toContain('### src/a.ts (수정, +2 −1)')
  expect(w.models[0]).toContain('+const c = 3')
  expect(w.models[0]!.match(/### src\/a\.ts/g)).toHaveLength(1)
})

test('pressing w twice while a note is written calls the model once', { options: { autoNote: false } }, async ($, on) => {
  const w = world(on, 'hold')
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const ui = await pane($)
  const first = ui.press({ key: 'write' })
  const second = ui.press({ key: 'write' })
  w.release()
  await Promise.all([first, second])
  await w.clock.settle()
  expect(w.models).toHaveLength(1)
  await ui.unmount()
})

const CONCEPT_NOTE = (names: string[]) =>
  [
    '### 한 줄 요약',
    '반복문을 바꿨다',
    '### 배울 개념',
    ...names.map(name => `- **${name}**: ${name}에 대한 설명 — \`for (const item of items)\``),
    '### 직접 확인해 볼 것',
    '- 실행해 보기',
  ].join('\n')

function start($: Engine) {
  return $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
}

test('each note is stored for the next session as soon as it exists, and again once written', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'hold', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', '첫 세션의 요청')
  const early = store.get('history') as Record<string, { notes: { status: string }[] }>
  expect(early['/proj']!.notes.map(n => n.status)).toEqual(['writing'])

  await w.clock.advance(5)
  w.release()
  await w.clock.settle()
  const later = store.get('history') as Record<string, { notes: { status: string; prompt: string; isPast: boolean }[] }>
  expect(later['/proj']!.notes[0]).toMatchObject({ status: 'ready', prompt: '첫 세션의 요청', isPast: false })
})

test('a new session loads the stored notes into the pane', async ($, on) => {
  const store = new Map<string, unknown>()
  const now = Date.UTC(2026, 9, 3, 1)
  const stored = (id: string, status: string, at: number) => ({
    id,
    turnId: id,
    at,
    prompt: `요청 ${id}`,
    answer: '',
    changes: [{ file: 'src/a.ts', path: '/proj/src/a.ts', tool: 'Edit', kind: 'update', added: 1, removed: 1, diff: '@@ -1,1 +1,1 @@\n-a\n+b', isCut: false }],
    moreFiles: 0,
    status,
    text: status === 'ready' ? NOTE_TEXT : '',
    savedAs: 'ready',
  })
  store.set('history', { '/proj': { at: now, notes: [stored('old', 'ready', now - 86_400_000), stored('cut', 'writing', now - 3_600_000)] } })
  const w = world(on, 'ok', null, true, store)
  await start($)

  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /노트 2\/2 · 지난 세션 · /})).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /세션이 끝나 노트를 다 쓰지 못했습니다/ })).toBeDefined()
  await ui.press({ key: 'prev' })
  expect(await ui.find({ type: 'Text', text: /지난 세션 · 10-0[12] / })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
  await ui.unmount()

  await turn($, () => $.tool.call(EDIT_A), 't9', '새 세션의 요청')
  await finish(w)
  const history = store.get('history') as Record<string, { notes: { id: string; isPast: boolean }[] }>
  expect(history['/proj']!.notes.map(n => n.id).slice(0, 2)).toEqual(['old', 'cut'])
  expect(history['/proj']!.notes).toHaveLength(3)
  expect(w.logs).toEqual([])
})

test('/learn clear forgets this project in the store too', async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('history', { '/other': { at: 1, notes: [] } })
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(Object.keys(store.get('history') as object).sort()).toEqual(['/other', '/proj'])
  await learn($, 'clear')
  const history = store.get('history') as Record<string, { notes: unknown[]; clearedAt?: number }>
  expect(history['/proj']!.notes).toEqual([])
  expect(history['/proj']!.clearedAt).toBeGreaterThan(0)
  expect(Object.keys(history).sort()).toEqual(['/other', '/proj'])
})

test('a note another session stored before a clear does not come back', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  const before = (store.get('history') as Record<string, { notes: { id: string }[] }>)['/proj']!.notes[0]!
  await w.clock.advance(1000)
  await learn($, 'clear')
  // A session that loaded the note earlier writes it back.
  const history = store.get('history') as Record<string, { at: number; notes: unknown[]; clearedAt: number }>
  history['/proj']!.notes.push({ ...before, id: 'stale' })
  store.set('history', history)
  await w.clock.advance(1000)
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
  await finish(w)
  const ids = (store.get('history') as Record<string, { notes: { id: string }[] }>)['/proj']!.notes.map(n => n.id)
  expect(ids).not.toContain('stale')
  expect(ids).toHaveLength(1)
})

test('concepts add up across notes, reach the model and the pane, and land in concepts.md', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문', '기본 매개변수'])
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  expect(w.models[0]).not.toContain('이미 배운 개념')

  w.answer = CONCEPT_NOTE(['for...of 반복문 (복습)', '복합 할당'])
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
  await finish(w)
  expect(w.models[1]).toContain('## 이미 배운 개념')
  expect(w.models[1]).toContain('for...of 반복문')

  const index = store.get('concepts') as Record<string, { name: string; count: number }>
  expect(index['c:forof반복문']).toMatchObject({ name: 'for...of 반복문', count: 2 })
  expect(index['c:기본매개변수']!.count).toBe(1)
  expect(index['c:복합할당']!.count).toBe(1)

  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /새로 배운 개념 복합 할당$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /다시 만난 개념 for\.\.\.of 반복문 ×2$/ })).toBeDefined()
  for (let i = 0; i < 2; i += 1) await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /^배운 개념 3개 · 최근 7일 새로 \d · 다시 만남 \d$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /for\.\.\.of 반복문 ×2/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /요청:/ })).toBeUndefined()
  expect(await ui.find({ type: 'Button', key: 'prev' })).toBeUndefined()

  // The first note, seen now, still says it taught for...of first (concepts → note).
  await ui.press({ key: 'view' })
  await ui.press({ key: 'prev' })
  expect(await ui.find({ type: 'Text', text: /새로 배운 개념 for\.\.\.of 반복문 · 기본 매개변수$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /다시 만난 개념/ })).toBeUndefined()
  await ui.unmount()

  const md = w.files.get('/home/u/.claude/learning-notes/concepts.md') ?? ''
  expect(md).toContain('| for...of 반복문 | 2 |')
  expect(md.indexOf('for...of 반복문')).toBeLessThan(md.indexOf('기본 매개변수'))

  const listed = await learn($, 'concepts')
  expect(listed.text).toContain('지금까지 배운 개념 3개')
  expect(listed.text).toContain('**for...of 반복문** ×2')
})

test('rewriting a note counts only the concepts that changed', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문', '기본 매개변수'])
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)

  w.answer = CONCEPT_NOTE(['for...of 반복문', '화살표 함수'])
  const ui = await pane($)
  await ui.press({ key: 'write' })
  await w.clock.settle()
  await ui.unmount()

  const index = store.get('concepts') as Record<string, { count: number }>
  expect(index['c:forof반복문']!.count).toBe(1)
  expect(index['c:기본매개변수']).toBeUndefined()
  expect(index['c:화살표함수']!.count).toBe(1)
})

test('concepts from earlier sessions show even before this project has a note', async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('concepts', { 'for...of반복문': { name: 'for...of 반복문', count: 4, firstAt: 1, lastAt: 2, blurb: '배열을 돈다', files: [] } })
  world(on, 'ok', null, true, store)
  await start($)
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /지금까지 배운 개념 1개가 있습니다/ })).toBeDefined()
  await ui.unmount()
  expect((await learn($, 'concepts')).text).toContain('**for...of 반복문** ×4')
})

test('two sessions in one project keep each other\'s notes in the store', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', '이 세션의 요청')
  await finish(w)
  // Meanwhile another session in the same project stored a note of its own.
  const history = store.get('history') as Record<string, { at: number; notes: { id: string; at: number }[] }>
  const mine = history['/proj']!.notes[0]!
  history['/proj']!.notes.push({ ...mine, id: 'other-session', at: mine.at + 1 })
  store.set('history', history)

  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2', '이 세션의 둘째 요청')
  await finish(w)
  const ids = (store.get('history') as typeof history)['/proj']!.notes.map(n => n.id)
  expect(ids).toContain('other-session')
  expect(ids).toHaveLength(3)
})

test('a concept leads to the notes that taught it', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문'])
  await turn($, () => $.tool.call(EDIT_A), 't1', '첫 요청')
  await finish(w)
  w.answer = CONCEPT_NOTE(['for...of 반복문 (복습)', '화살표 함수'])
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2', file_path: '/proj/src/b.ts' }), 't2', '둘째 요청')
  await finish(w)

  const ui = await pane($)
  for (let i = 0; i < 2; i += 1) await ui.press({ key: 'view' })
  const links = await ui.findAll({ type: 'Button', text: /a\.ts|b\.ts/ })
  expect(links.map(link => link.text)).toEqual(['09:00 a.ts', '09:00 b.ts', '09:00 b.ts'].map(t => expect.stringContaining(t.slice(-4))))
  await ui.press({ key: links[0]!.key! })
  expect(await ui.find({ type: 'Text', text: /노트 1\/2/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /요청: 첫 요청/ })).toBeDefined()
  await ui.unmount()
})

test('of two copies of one note, the newer stays, and the pane takes it', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  const stored = (status: string, text: string, updatedAt: number) => ({
    id: 'n1', turnId: 'n1', at: 100, prompt: '공유 노트', answer: '',
    changes: [{ file: 'src/a.ts', path: '/proj/src/a.ts', tool: 'Edit', kind: 'update', added: 1, removed: 1, diff: '@@ -1,1 +1,1 @@\n-a\n+b', isCut: false }],
    moreFiles: 0, status, text, savedAs: null, isPast: false, concepts: [], root: '/proj', updatedAt,
  })
  store.set('history', { '/proj': { at: 100, notes: [stored('writing', '', 100)] } })
  await start($)
  // The other session finishes the note after this one loaded it as failed.
  store.set('history', { '/proj': { at: 200, notes: [stored('ready', NOTE_TEXT, 200)] } })
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  const kept = (store.get('history') as Record<string, { notes: { id: string; status: string }[] }>)['/proj']!.notes
  expect(kept.find(n => n.id === 'n1')!.status).toBe('ready')
  const ui = await pane($)
  await ui.press({ key: 'prev' })
  expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
  await ui.unmount()
})

test('a history past its byte budget drops other projects first and keeps working', async ($, on) => {
  const store = new Map<string, unknown>()
  const big = 'x'.repeat(200_000)
  const filler = (root: string, at: number) => ({ at, notes: [{ id: `${root}-1`, at, changes: [], text: big, status: 'ready', prompt: '', answer: '', moreFiles: 0, turnId: 't', savedAs: null }] })
  const others: Record<string, unknown> = {}
  for (let i = 0; i < 11; i += 1) others[`/old${i}`] = filler(`/old${i}`, 1000 + i)
  store.set('history', others)
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  const history = store.get('history') as Record<string, unknown>
  expect(new TextEncoder().encode(JSON.stringify(history)).length).toBeLessThanOrEqual(2_000_000)
  expect(Object.keys(history)).toContain('/proj')
  expect(Object.keys(history)).not.toContain('/old0')
  expect(Object.keys(history)).toContain('/old10')
})

test('a store that refuses writes says so once, and the journal still gets the note', async ($, on) => {
  const w = world(on)
  w.storeFails = true
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
  await finish(w)
  expect(w.toasts.filter(t => t.includes('이력을 저장하지 못했습니다'))).toHaveLength(1)
  expect(w.journal().length).toBeGreaterThanOrEqual(1)
})

test('concepts named like object built-ins are ordinary concepts', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['constructor', '__proto__', 'toString'])
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const index = store.get('concepts') as Record<string, { name: string; count: number }>
  expect(Object.values(index).map(one => [one.name, one.count])).toEqual([
    ['constructor', 1],
    ['__proto__', 1],
    ['toString', 1],
  ])
  expect(w.files.get('/home/u/.claude/learning-notes/concepts.md')).toContain('| constructor | 1 |')
  const ui = await pane($)
  for (let i = 0; i < 2; i += 1) await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /^배운 개념 3개 · 최근 7일 새로 \d · 다시 만남 \d$/ })).toBeDefined()
  await ui.unmount()
})

test('moving to another project swaps the pane and keeps each note under its own project', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', 'proj 요청')
  await finish(w)
  w.root = '/other'
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2', file_path: '/other/x.ts' }), 't2', 'other 요청')
  await finish(w)
  const history = store.get('history') as Record<string, { notes: { prompt: string }[] }>
  expect(history['/proj']!.notes.map(n => n.prompt)).toEqual(['proj 요청'])
  expect(history['/other']!.notes.map(n => n.prompt)).toEqual(['other 요청'])
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /노트 1\/1/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /요청: other 요청/ })).toBeDefined()
  await ui.unmount()
})

test('a -p run writes its note before the turn ends, as its process exits right after (real run)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
  await turn($, () => $.tool.call(EDIT_A), 't1')
  // No clock moves: by the time the turn is over, the note is written, stored and in the journal.
  const notes = (store.get('history') as Record<string, { notes: { status: string }[] }>)['/proj']!.notes
  expect(notes.map(n => n.status)).toEqual(['ready'])
  expect(w.journal()[0]!.text).toContain('let을 const로 바꿔')
  expect(w.models).toHaveLength(1)
})

test('a concept met once and not since comes back for review, and the reminder says how many are due', async ($, on) => {
  const store = new Map<string, unknown>()
  const longAgo = Date.UTC(2026, 8, 1)
  store.set('concepts', {
    'c:클로저': { name: '클로저', count: 1, firstAt: longAgo, lastAt: longAgo, blurb: '함수가 바깥 변수를 기억한다', files: [] },
  })
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문'])
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const ui = await pane($)
  for (let i = 0; i < 2; i += 1) await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /최근 7일 새로 1 · 다시 만남 0/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /복습할 개념 1개/ })).toBeDefined()
  // q goes to the quiz from here too, as the reminder says; v goes on to the note.
  expect(await ui.find({ type: 'Button', key: 'quiz', text: '퀴즈' })).toBeDefined()
  expect(await ui.find({ type: 'Button', key: 'view', text: '노트' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /클로저 · 31일 지남/ })).toBeDefined()
  // Learned just now: due tomorrow.
  expect(await ui.find({ type: 'Text', text: /for\.\.\.of 반복문 ×1 · 최근 .* · 다음 복습 내일/ })).toBeDefined()
  await ui.unmount()
  expect((await learn($, 'concepts')).text).toContain('복습할 개념 1개: 클로저')
  expect(w.statuses.at(-1)).toBe('학습 노트 · 복습할 개념 1개 · /learn 패널에서 q')
})

test('/learn find looks through every project, and puts this project\'s newest hit in the pane', async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('history', {
    '/elsewhere/shop': {
      at: 50,
      notes: [{
        id: 'far', turnId: 'far', at: Date.UTC(2026, 8, 20, 3), prompt: '장바구니 합계 고쳐줘', answer: '',
        changes: [{ file: 'cart.js', path: '/elsewhere/shop/cart.js', tool: 'Edit', kind: 'update', added: 1, removed: 1, diff: '', isCut: true }],
        moreFiles: 0, status: 'ready', text: '### 한 줄 요약\n합계를 고쳤다\n### 배울 개념\n- **for...of 반복문**: x', savedAs: 'ready', concepts: ['c:forof반복문'],
      }],
    },
  })
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문'])
  await turn($, () => $.tool.call(EDIT_A), 't1', '첫 요청')
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2', file_path: '/proj/src/other.ts' }), 't2', '둘째 요청')
  await finish(w)

  const byConcept = await learn($, 'find for-of 반복문')
  expect(byConcept.text).toContain("'for-of 반복문' 노트 3개")
  expect(byConcept.text).toContain('09-20 03:00 · shop · cart.js — 합계를 고쳤다')
  expect(byConcept.text).toContain('· proj · src/a.ts — 반복문을 바꿨다')

  const byFile = await learn($, 'find a.ts')
  expect(byFile.text).toContain("'a.ts' 노트 1개")
  expect(byFile.text).toContain('패널에서 골라 두었습니다')
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /노트 1\/2/ })).toBeDefined()
  await ui.unmount()

  expect((await learn($, 'find 없는말')).text).toContain("'없는말'에 맞는 노트가 없습니다")
  expect((await learn($, 'find')).text).toContain('쓰는 법')
})

test('/learn merge folds one concept into another, and later notes count under the kept name', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['Destructuring'])
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  w.answer = CONCEPT_NOTE(['구조 분해 할당'])
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
  await finish(w)

  const merged = await learn($, 'merge Destructuring = 구조 분해 할당')
  expect(merged.text).toContain("합쳤습니다: 'Destructuring' ×1 → '구조 분해 할당' ×2")
  const index = store.get('concepts') as Record<string, { name: string; count: number }>
  expect(Object.keys(index)).toEqual(['c:구조분해할당'])
  expect(store.get('aliases')).toEqual({ 'c:destructuring': 'c:구조분해할당' })

  w.answer = CONCEPT_NOTE(['Destructuring (복습)'])
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u3' }), 't3')
  await finish(w)
  expect((store.get('concepts') as typeof index)['c:구조분해할당']!.count).toBe(3)

  const ui = await pane($)
  await ui.press({ key: 'prev' })
  await ui.press({ key: 'prev' })
  expect(await ui.find({ type: 'Text', text: /새로 배운 개념 구조 분해 할당$/ })).toBeDefined()
  await ui.unmount()
  expect(w.files.get('/home/u/.claude/learning-notes/concepts.md')).toContain('| 구조 분해 할당 | 3 |')

  expect((await learn($, 'merge 없는개념 = 구조 분해 할당')).text).toContain("없는 개념입니다: '없는개념'")
  expect((await learn($, 'merge 구조 분해 할당 = 구조분해 할당')).text).toContain('이미 같은 개념')
  expect((await learn($, 'merge 하나만')).text).toContain('쓰는 법')
})

test('/learn days and /learn day read the journal back as a contents list', async ($, on) => {
  const w = world(on)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', '첫 요청')
  await finish(w)
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2', '둘째 요청')
  await finish(w)
  w.files.set(journalPath(NOTES_DIR, Date.UTC(2026, 8, 30, 12), '/proj'), '# old')
  w.files.set(journalPath(NOTES_DIR, Date.UTC(2026, 8, 30, 12), '/elsewhere/proj'), '# same folder name, other project')
  w.files.set(journalPath(NOTES_DIR, Date.UTC(2026, 8, 30, 12), '/proj-2'), '# a project named proj-2')
  const days = await learn($, 'days')
  expect(days.text).toMatch(/이 프로젝트의 일지 2일/)
  expect(days.text).toMatch(/- 2026-10-0[23]\n- 2026-09-30/)
  expect(days.text).not.toContain('other')

  const today = await learn($, 'day 오늘')
  expect(today.text).toMatch(/노트 2개/)
  expect(today.text).toMatch(/- \d\d:\d\d · 첫 요청 — let을 const로 바꿔 값이 다시 바뀌지 않게 했다/)
  expect(today.text).toMatch(/- \d\d:\d\d · 둘째 요청 — /)

  expect((await learn($, 'day 2020-01-01')).text).toContain('일지가 없습니다')
  expect((await learn($, 'day 내일')).text).toContain('쓰는 법')
})

test('/learn help lists every subcommand, and an unknown one shows it', async ($, on) => {
  world(on)
  const help = await learn($, 'help')
  for (const word of ['quiz', 'ask', 'recap', 'last', 'concepts', 'stats', 'find', 'day', 'days', 'anki', 'merge', 'save', 'clear']) expect(help.text).toContain(`/learn ${word}`)
  // The panel's keys, the walk-through among them, and no diff view any more.
  expect(help.text).toContain('`r` 예시로 따라가기')
  expect(help.text).toContain('노트 → 전/후 → 개념 모음')
  expect(help.text).not.toContain('diff')
  expect((await learn($, 'what')).text).toContain('모르는 하위 명령입니다')
})

test('rewriting an old note after a merge counts its concept once (review R1/R13)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['Destructuring'])
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  w.answer = CONCEPT_NOTE(['구조 분해 할당'])
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
  await finish(w)
  // Merged in another session: this pane's first note still holds the old key.
  store.set('aliases', { 'c:destructuring': 'c:구조분해할당' })
  store.set('concepts', { 'c:구조분해할당': { name: '구조 분해 할당', count: 2, firstAt: NOW, lastAt: NOW, blurb: '', files: [] } })

  w.answer = CONCEPT_NOTE(['Destructuring'])
  const ui = await pane($)
  await ui.press({ key: 'prev' })
  await ui.press({ key: 'write' })
  await w.clock.settle()
  await ui.unmount()
  const index = store.get('concepts') as Record<string, { count: number }>
  expect(Object.keys(index)).toEqual(['c:구조분해할당'])
  expect(index['c:구조분해할당']!.count).toBe(2)
})

test('a merge done in another session is followed by the next note here (review R7)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  store.set('aliases', { 'c:destructuring': 'c:구조분해할당' })
  store.set('concepts', { 'c:구조분해할당': { name: '구조 분해 할당', count: 1, firstAt: NOW - 1000, lastAt: NOW - 1000, blurb: '', files: [] } })
  w.answer = CONCEPT_NOTE(['Destructuring'])
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  const index = store.get('concepts') as Record<string, { count: number }>
  expect(Object.keys(index)).toEqual(['c:구조분해할당'])
  expect(index['c:구조분해할당']!.count).toBe(2)
})

test('one note that taught both names counts once after a merge (review R9)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['Destructuring', '구조 분해 할당'])
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  const merged = await learn($, 'merge Destructuring = 구조 분해 할당')
  expect(merged.text).toContain("→ '구조 분해 할당' ×1")
})

test('merging back the other way undoes a rename (review R10)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['Destructuring'])
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  expect((await learn($, 'merge Destructuring = 구조분해')).text).toContain("→ '구조분해' ×1")
  const back = await learn($, 'merge 구조분해 = Destructuring')
  expect(back.text).toContain("합쳤습니다: '구조분해' ×1 → 'Destructuring' ×1")
  expect(Object.keys(store.get('concepts') as object)).toEqual(['c:destructuring'])
  expect(store.get('aliases')).toEqual({ 'c:구조분해': 'c:destructuring' })
})

test('merging two concepts back the other way splits them as they were (real run)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['할인 공식'])
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  w.answer = CONCEPT_NOTE(['누적 변수'])
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
  await finish(w)
  expect((await learn($, 'merge 할인 공식 = 누적 변수')).text).toContain("합쳤습니다: '할인 공식' ×1 → '누적 변수' ×2")
  const back = await learn($, 'merge 누적 변수 = 할인 공식')
  expect(back.text).toBe("되돌렸습니다. 다시 따로 셉니다: '할인 공식' ×1 · '누적 변수' ×1")
  const index = store.get('concepts') as Record<string, { name: string; count: number }>
  expect(Object.values(index).map(one => `${one.name} ×${one.count}`).sort()).toEqual(['누적 변수 ×1', '할인 공식 ×1'])
  expect(store.get('aliases')).toEqual({})
  expect(store.get('merges')).toEqual({})
  // Merged again, then once more the other way: the same split.
  await learn($, 'merge 할인 공식 = 누적 변수')
  expect((await learn($, 'merge 누적 변수 = 할인 공식')).text).toContain('다시 따로 셉니다')
})

test('a store that refuses a merge answers in words instead of failing the command (review R8)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['Destructuring'])
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  w.storeFails = true
  const out = await learn($, 'merge Destructuring = 구조 분해 할당')
  expect(out.text).toContain('개념을 합치지 못했습니다')
})

test('find by a merged-away name still finds notes stored under it (review R6)', async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('history', {
    '/elsewhere': {
      at: 50,
      notes: [{
        id: 'far', turnId: 'far', at: NOW - 86_400_000, prompt: '다른 프로젝트', answer: '', changes: [], moreFiles: 0,
        status: 'ready', text: '### 한 줄 요약\n분해했다', savedAs: 'ready', concepts: ['c:destructuring'],
      }],
    },
  })
  store.set('aliases', { 'c:destructuring': 'c:구조분해할당' })
  world(on, 'ok', null, true, store)
  await start($)
  expect((await learn($, 'find 구조 분해 할당')).text).toContain("'구조 분해 할당' 노트 1개")
})

test('find after /cd picks nothing in a pane that still holds the old project (review R11)', async ($, on) => {
  const w = world(on)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', '옛 프로젝트 요청')
  await finish(w)
  w.root = '/other'
  const out = await learn($, 'find 옛 프로젝트')
  expect(out.text).toContain('노트 1개')
  expect(out.text).not.toContain('골라 두었습니다')
})

test('/learn day reads parts in order, counts a rewrite once and stops at 40 lines (review R3/R4/R12)', async ($, on) => {
  const w = world(on)
  await start($)
  const day = Date.UTC(2026, 8, 30, 12)
  const section = (time: string, request: string, isRewrite = false) =>
    `## 2026-09-30 ${time}${isRewrite ? ' (다시 쓴 노트)' : ''}\n\n**요청**: ${request}\n\n### 한 줄 요약\n${request} 요약\n\n---\n\n`
  w.files.set(journalPath(NOTES_DIR, day, '/proj'), '# 학습 노트\n\n' + section('09:00', '첫') + section('09:00', '첫', true))
  w.files.set(journalPath(NOTES_DIR, day, '/proj', 2), '# 학습 노트\n\n' + section('12:00', '둘'))
  w.files.set(journalPath(NOTES_DIR, day, '/proj', 10), '# 학습 노트\n\n' + Array.from({ length: 45 }, (_, i) => section(`23:${String(i).padStart(2, '0')}`, `열 ${i}`)).join(''))
  const out = (await learn($, 'day 2026-09-30')).text ?? ''
  expect(out).toContain('노트 47개')
  const lines = out.split('\n').filter(line => line.startsWith('- '))
  expect(lines).toHaveLength(40)
  expect(lines[0]).toBe('- 09:00 · 첫 — 첫 요약 (다시 씀)')
  expect(lines[1]).toBe('- 12:00 · 둘 — 둘 요약')
  expect(out).toContain('그 밖에 7개는 일지 파일에 있습니다')
})

test('a turn a notification started shows no notification text as the request (real run)', async ($, on) => {
  const w = world(on)
  await start($)
  const notice = '<task-notification>\n<task-id>b6y</task-id>\n<status>completed</status>\n</task-notification>'
  await $.prompt.submit({ text: notice, origin: { kind: 'task-notification' }, wait: false })
  await turn($, () => $.tool.call(EDIT_A), 't1', notice)
  await finish(w)
  expect(w.models[0]).toContain('(알림으로 시작한 턴)')
  expect(w.models[0]).not.toContain('task-notification')
  expect(w.journal()[0]!.text).toContain('**요청**: (알림으로 시작한 턴)')

  // After the person asks, a turn another session's message starts carries on that request.
  await $.prompt.submit({ text: '계속 이어서 해줘', origin: { kind: 'composer' }, wait: false })
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2', '계속 이어서 해줘')
  const report = '<agent-message from="x">보고</agent-message>'
  await $.prompt.submit({ text: report, origin: { kind: 'peer' }, wait: false })
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u3' }), 't3', report)
  await finish(w)
  expect(w.models[1]).toContain('## 사용자의 요청\n계속 이어서 해줘')
  expect(w.models[2]).toContain('## 사용자의 요청\n(이어서) 계속 이어서 해줘')
  expect(w.models[2]).not.toContain('agent-message')
})

test("a prompt a hook dropped never becomes a later note's request (review R3-2)", async ($, on) => {
  const w = world(on)
  await start($)
  await $.prompt.submit({ text: '먼저 이거 고쳐줘', origin: { kind: 'composer' }, wait: false })
  await $.prompt.submit({ text: 'my token is SECRET-123', origin: { kind: 'composer' }, wait: false })
  const notice = '<task-notification><status>completed</status></task-notification>'
  await $.prompt.submit({ text: notice, origin: { kind: 'task-notification' }, wait: false })
  await turn($, () => $.tool.call(EDIT_A), 't1', notice)
  await finish(w)
  expect(w.models[0]).toContain('## 사용자의 요청\n(이어서) 먼저 이거 고쳐줘')
  expect(w.models[0]).not.toContain('SECRET')
  expect(w.journal()[0]!.text).not.toContain('SECRET')
})

test('two notifications queued before their turns each carry on the request (review R3-4)', async ($, on) => {
  const w = world(on)
  await start($)
  await $.prompt.submit({ text: '고쳐줘', origin: { kind: 'composer' }, wait: false })
  const n1 = '<task-notification>one</task-notification>'
  const n2 = '<agent-message from="peer">two</agent-message>'
  await $.prompt.submit({ text: n1, origin: { kind: 'task-notification' }, wait: false })
  await $.prompt.submit({ text: n2, origin: { kind: 'peer' }, wait: false })
  await turn($, () => $.tool.call(EDIT_A), 't2', n1)
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't3', n2)
  await finish(w)
  expect(w.models[0]).toContain('## 사용자의 요청\n(이어서) 고쳐줘')
  expect(w.models[1]).toContain('## 사용자의 요청\n(이어서) 고쳐줘')
  expect(w.models.join('\n')).not.toContain('task-notification')
})

test("a routine's stored prompt is the request of the turn it starts", async ($, on) => {
  const w = world(on)
  await start($)
  await $.prompt.submit({ text: '매일 아침 의존성 올려줘', origin: { kind: 'scheduled-trigger' }, wait: false })
  await turn($, () => $.tool.call(EDIT_A), 't1', '매일 아침 의존성 올려줘')
  await finish(w)
  expect(w.models[0]).toContain('## 사용자의 요청\n매일 아침 의존성 올려줘')
})

test('what a git stash or checkout put on disk is not noted as an edit (real run)', async ($, on) => {
  const w = world(on)
  await start($)
  await turn($, () => $.tool.call({ tool: 'Bash', tool_use_id: 'g1', command: 'cd /proj && git stash push -m wip' }))
  await turn($, () => $.tool.call({ tool: 'Bash', tool_use_id: 'g2', command: 'git -C /proj checkout -- src/style.css' }), 't2')
  await finish(w)
  expect(w.models).toHaveLength(0)
  // A commit is not a move: the same edit through sed is still noted.
  await turn($, () => $.tool.call({ tool: 'Bash', tool_use_id: 'g3', command: 'sed -i s/red/blue/ src/style.css && git commit -am "merge colors"' }), 't3')
  await finish(w)
  expect(w.models).toHaveLength(1)
})

test("Claude's scratch files outside the project are not noted (real run)", async ($, on) => {
  const w = world(on, 'ok', null, true, new Map(), { TMPDIR: '/var/scratch' })
  await start($)
  await turn($, async () => {
    await $.tool.call({ tool: 'Write', tool_use_id: 's1', file_path: '/tmp/claude-0/x/scratchpad/render.py', content: 'print(1)\n' })
    await $.tool.call({ tool: 'Write', tool_use_id: 's2', file_path: '/var/scratch/probe.mjs', content: 'x\n' })
  })
  await finish(w)
  expect(w.models).toHaveLength(0)
  await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 's3', file_path: '/proj/playground/cart.mjs', content: 'export const a = 1\n' }), 't2')
  await finish(w)
  expect(w.models).toHaveLength(1)
  expect(w.models[0]).toContain('playground/cart.mjs')
})

test('in a cloud session /learn says the pane may not show and puts the last note in the reply (real run)', async ($, on) => {
  const w = world(on, 'ok', null, true, new Map(), { CLAUDE_CODE_REMOTE: 'true' })
  await start($)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const out = await learn($, '')
  expect(out.text).toContain('클라우드 컴퓨터에서 돌아')
  expect(out.text).toContain('let을 const로 바꿔')
  expect(out.text).not.toContain('패널을 열었습니다')
})

test('/learn recap sums up today in this project and leaves it in the journal', async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('history', {
    '/elsewhere': {
      at: 1,
      notes: [{ id: 'far', turnId: 'far', at: NOW, prompt: '다른 프로젝트 요청', answer: '', changes: [], moreFiles: 0, status: 'ready', text: '', savedAs: 'ready', concepts: [] }],
    },
  })
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문'])
  await turn($, () => $.tool.call(EDIT_A), 't1', '첫 요청')
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2', '둘째 요청')
  await finish(w)

  w.answer = '### 한 일\n반복문을 두 번 고쳤다\n### 핵심 개념\n- for...of'
  const out = await learn($, 'recap')
  expect(out.text).toContain('오늘 정리 · 노트 2개 · 일지에 남김')
  expect(out.text).toContain('반복문을 두 번 고쳤다')
  const prompt = w.models.at(-1)!
  expect(prompt).toContain('요청: 첫 요청')
  expect(prompt).toContain('요청: 둘째 요청')
  expect(prompt).not.toContain('다른 프로젝트 요청')
  expect(w.files.get(JOURNAL)).toMatch(/## \d{4}-\d{2}-\d{2} 정리 · 오늘 \(\d\d:\d\d\)\n\n### 한 일\n반복문을 두 번 고쳤다/)

  // The recap is not a note: the day's contents still count two.
  expect((await learn($, 'day 오늘')).text).toContain('노트 2개')
  expect((await learn($, 'recap 어제')).text).toContain('어제의 노트가 이 프로젝트에 없습니다')
  expect((await learn($, 'recap 내일')).text).toContain('쓰는 법')
})

test('/learn recap reads every note of the day from the journal, past the notes kept for the pane (review R3-1)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  for (let i = 0; i < 35; i += 1) {
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: `a${i}` }), `d1-${i}`, `어제 요청 ${i}`)
    await finish(w)
  }
  await w.clock.advance(86_400_000)
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'b0' }), 'd2-0', '오늘 요청')
  await finish(w)
  w.answer = '### 한 일\n정리'
  expect((await learn($, 'recap 어제')).text).toContain('어제 정리 · 노트 35개')
  const prompt = w.models.at(-1)!
  expect(prompt).toContain('요청: 어제 요청 0 ')
  expect(prompt).toContain('요청: 어제 요청 34 ')
  expect(prompt).not.toContain('오늘 요청')
})

test('a week recap run before today\'s first note goes under the last noted day, making no empty day (review R3-5)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', '어제 한 일')
  await finish(w)
  const yesterday = JOURNAL
  await w.clock.advance(86_400_000)
  w.answer = '### 한 일\n주간 정리'
  expect((await learn($, 'recap 최근 7일')).text).toContain('최근 7일 정리 · 노트 1개 · 일지에 남김')
  expect(w.files.get(yesterday)).toContain('정리 · 최근 7일')
  expect([...w.files.keys()].filter(path => path.endsWith('.md') && !path.endsWith('concepts.md'))).toEqual([yesterday])
  expect((await learn($, 'days')).text).toContain('이 프로젝트의 일지 1일')
  expect((await learn($, 'recap 2026-01-01')).text).toBe('2026-01-01의 노트가 이 프로젝트에 없습니다.')
})

test('a note finished after /cd still goes into its own project\'s journal', async ($, on) => {
  const w = world(on, 'hold')
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', '옛 프로젝트 요청')
  await w.clock.advance(5)
  w.root = '/other'
  w.release()
  await w.clock.settle()
  expect(w.journal().map(write => write.path)).toEqual([JOURNAL])
})

test('a concept keeps only the file whose diff holds the code it quotes', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = ['### 한 줄 요약', '상수를 내보냈다', '### 배울 개념', '- **export**: 모듈 밖으로 내보낸다 — `export const n = 1`'].join('\n')
  await turn($, async () => {
    await $.tool.call(EDIT_A)
    await $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/new.ts', content: 'export const n = 1\n' })
  })
  await finish(w)
  const index = store.get('concepts') as Record<string, { files: string[] }>
  expect(index['c:export']!.files).toEqual(['src/new.ts'])
  expect(w.files.get('/home/u/.claude/learning-notes/concepts.md')).toContain('| new.ts |')
})

test('/learn quiz asks about concepts due for review; 정답 shows the answers and grades nothing, 맞음 does', async ($, on) => {
  const store = new Map<string, unknown>()
  const longAgo = NOW - 20 * 86_400_000
  store.set('concepts', {
    'c:클로저': { name: '클로저', count: 1, firstAt: longAgo, lastAt: longAgo, blurb: '함수가 바깥 변수를 기억한다', files: [] },
  })
  const w = world(on, 'ok', null, true, store)
  await start($)
  expect((await learn($, 'quiz 정답')).text).toContain('아직 낸 퀴즈가 없습니다')

  w.answer = 'Q1: 아래 counter()가 매번 1씩 커지는 까닭은?\nA1: 안쪽 함수가 바깥의 count 변수를 기억하기 때문이다.'
  const asked = await learn($, 'quiz')
  expect(asked.text).toContain('복습 퀴즈 · 1문제')
  expect(asked.text).toContain('1. 아래 counter()가 매번 1씩 커지는 까닭은?')
  expect(asked.text).not.toContain('기억하기 때문이다')
  expect(w.models.at(-1)).toContain('1. 클로저 — 함수가 바깥 변수를 기억한다')

  const shown = await learn($, 'quiz 정답')
  expect(shown.text).toContain('1. 안쪽 함수가 바깥의 count 변수를 기억하기 때문이다.')
  expect(shown.text).toContain('맞힌 문제는 /learn quiz 맞음 1')
  // Seeing the answers grades nothing: only what the learner says counts.
  const reviewedAt = () => (store.get('concepts') as Record<string, { reviewedAt?: number }>)['c:클로저']!.reviewedAt
  expect(reviewedAt()).toBeUndefined()
  expect(store.get('activity')).toEqual({})
  expect((await learn($, 'quiz 맞음 1')).text).toBe('맞힌 것으로 적었습니다: 1. 클로저. 다음 복습까지 간격이 늘어납니다.')
  expect(reviewedAt()).toBe(NOW)
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 1, wrong: 0 } })
  expect((await learn($, 'quiz 맞음 1')).text).toBe('이미 맞음으로 적혀 있습니다.')

  // No note in this project: the pane still opens the concepts with v.
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /지금까지 배운 개념 1개가 있습니다 · v로 보기/ })).toBeDefined()
  await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /클로저/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /퀴즈 \d\d:\d\d/ })).toBeDefined()
  await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /아직 학습 노트가 없습니다/ })).toBeDefined()
  await ui.unmount()
})

test('/learn quiz 틀림 puts the missed concept first in the next quiz, and seeing its answer again clears it', async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('concepts', {
    'c:클로저': { name: '클로저', count: 3, firstAt: NOW - 1, lastAt: NOW - 1, blurb: '함수가 바깥 변수를 기억한다', files: [] },
    'c:구조분해': { name: '구조 분해', count: 2, firstAt: NOW - 2, lastAt: NOW - 2, blurb: '배열이나 객체에서 값을 꺼내 이름 붙이기', files: [] },
    'c:map': { name: 'map', count: 4, firstAt: NOW - 3, lastAt: NOW - 3, blurb: '배열의 각 항목을 바꾼 새 배열', files: [] },
  })
  const w = world(on, 'ok', null, true, store)
  await start($)
  expect((await learn($, 'quiz 틀림 1')).text).toContain('아직 낸 퀴즈가 없습니다')
  w.answer = ['Q1: 문제 하나', 'A1: 답 하나', 'Q2: 문제 둘', 'A2: 답 둘', 'Q3: 문제 셋', 'A3: 답 셋'].join('\n')
  await learn($, 'quiz')
  const first = w.models.at(-1)!
  expect((await learn($, 'quiz 틀림 2')).text).toContain('2번은 아직 정답을 보지 않았습니다')
  expect((await learn($, 'quiz 정답')).text).toContain('틀린 문제는 /learn quiz 틀림 1')
  expect((await learn($, 'quiz 틀림 9')).text).toContain('1~3 사이로')
  // The second question's concept: the one listed second in the prompt the model got.
  const second = /\n2\. (.+?) —/.exec(first)![1]!
  expect((await learn($, 'quiz 틀림 2번')).text).toBe(`틀린 것으로 적었습니다: 2. ${second}. 복습할 개념 맨 앞에 올라 다음 퀴즈에 먼저 나옵니다.`)
  // Seeing the answers again does not clear the miss just marked.
  await learn($, 'quiz 정답')
  const missed = Object.values(store.get('concepts') as Record<string, { name: string; missedAt?: number }>).filter(one => one.missedAt !== undefined)
  expect(missed.map(one => one.name)).toEqual([second])
  expect((await learn($, 'concepts')).text).toContain(`복습할 개념 1개: ${second} (퀴즈 틀림)`)
  const ui = await pane($)
  await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: new RegExp(`${second} · 퀴즈 틀림`) })).toBeDefined()
  await ui.unmount()

  await w.clock.advance(60_000)
  await learn($, 'quiz')
  expect(w.models.at(-1)).toContain(`1. ${second} —`)
  // Right this time: the miss is gone.
  await learn($, 'quiz 정답')
  await learn($, 'quiz 맞음 1 2 3')
  const after = Object.values(store.get('concepts') as Record<string, { missedAt?: number }>)
  expect(after.every(one => one.missedAt === undefined)).toBe(true)
  expect((await learn($, 'concepts')).text).not.toContain('퀴즈 틀림')
})

test('a quiz from a past session still shows its answers and takes misses (real run)', async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('concepts', { 'c:클로저': { name: '클로저', count: 1, firstAt: 1, lastAt: 1, blurb: '함수가 바깥 변수를 기억한다', files: [] } })
  store.set('quiz', { at: 1, isRevealed: false, items: [{ key: 'c:클로저', name: '클로저', question: 'counter()가 왜 커질까?', answer: '바깥 변수를 기억해서다.' }] })
  const w = world(on, 'ok', null, true, store)
  await start($)
  const shown = await learn($, 'quiz 정답')
  expect(shown.text).toContain('1. 바깥 변수를 기억해서다.')
  expect((store.get('quiz') as { isRevealed: boolean }).isRevealed).toBe(true)
  expect((await learn($, 'quiz 틀림 1')).text).toContain('틀린 것으로 적었습니다: 1. 클로저')
  // A new quiz is kept in the store for the next session.
  w.answer = 'Q1: 새 문제\nA1: 새 답'
  await learn($, 'quiz')
  expect(store.get('quiz')).toMatchObject({ isRevealed: false, items: [{ question: '새 문제', answer: '새 답' }] })
  expect(w.models).toHaveLength(1)
})

test('/learn quiz says so when there is nothing to ask or the reply is not a quiz', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  expect((await learn($, 'quiz')).text).toContain('아직 모인 개념이 없어')
  store.set('concepts', { 'c:x': { name: 'X', count: 1, firstAt: 1, lastAt: 1, blurb: '', files: [] } })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  w.answer = '문제를 못 만들겠어요'
  expect((await learn($, 'quiz')).text).toContain('모델의 답을 문제로 읽지 못했습니다')
  expect((await learn($, 'quiz 아무말')).text).toContain('쓰는 법')
})

const THREE_CONCEPTS = {
  'c:클로저': { name: '클로저', count: 3, firstAt: NOW - 1, lastAt: NOW - 1, blurb: '함수가 바깥 변수를 기억한다', files: [] },
  'c:구조분해': { name: '구조 분해', count: 2, firstAt: NOW - 2, lastAt: NOW - 2, blurb: '배열이나 객체에서 값을 꺼내 이름 붙이기', files: [] },
  'c:map': { name: 'map', count: 4, firstAt: NOW - 3, lastAt: NOW - 3, blurb: '배열의 각 항목을 바꾼 새 배열', files: [] },
}
const THREE_QUESTIONS = ['Q1: 문제 하나', 'A1: 답 하나', 'Q2: 문제 둘', 'A2: 답 둘', 'Q3: 문제 셋', 'A3: 답 셋'].join('\n')

test('the pane quiz: q opens it, s asks, a shows one answer, o and x grade it, and the wrong one leads the next quiz', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /q로 퀴즈/ })).toBeDefined()
  await ui.press({ key: 'quiz' })
  expect(await ui.find({ type: 'Button', text: '퀴즈 시작' })).toBeDefined()

  w.answer = THREE_QUESTIONS
  await ui.press({ key: 'quiz-new' })
  await w.clock.settle()
  expect(w.models).toHaveLength(1)
  // The concept of each question: the one listed in that place in the prompt the model got.
  const [first, second] = [1, 2].map(n => new RegExp(`\\n${n}\\. (.+?) —`).exec(w.models[0]!)![1]!) as [string, string]
  expect(await ui.find({ type: 'Text', text: /3문제 중 0개 채점/ })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '문제 하나' })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '답 하나' })).toBeUndefined()
  expect(await ui.find({ type: 'Button', key: 'quiz-right' })).toBeUndefined()

  await ui.press({ key: 'quiz-answer' })
  expect(await ui.find({ type: 'Markdown', text: '답 하나' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: `개념: ${first}` })).toBeDefined()
  await ui.press({ key: 'quiz-wrong' })
  expect(await ui.find({ type: 'Text', text: `✗ 틀림 1. ${first}` })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '문제 둘' })).toBeDefined()
  for (let i = 0; i < 2; i += 1) {
    await ui.press({ key: 'quiz-answer' })
    await ui.press({ key: 'quiz-right' })
  }
  expect(await ui.find({ type: 'Text', text: /3문제 중 2개 맞혔습니다 · 틀린 개념은 다음 퀴즈에 먼저 나옵니다/ })).toBeDefined()
  expect(await ui.find({ type: 'Button', text: '새 문제 받기' })).toBeDefined()

  const byName = () => Object.fromEntries(Object.values(store.get('concepts') as Record<string, { name: string; reviewedAt?: number; missedAt?: number }>).map(one => [one.name, one]))
  expect(byName()[first]).toMatchObject({ reviewedAt: NOW, missedAt: NOW })
  expect(byName()[second]!.reviewedAt).toBe(NOW)
  expect(byName()[second]!.missedAt).toBeUndefined()
  // Kept for the next session, grades and all.
  expect(store.get('quiz')).toMatchObject({ items: [{ result: 'wrong', isShown: true }, { result: 'right' }, { result: 'right' }] })
  // /learn quiz 정답 afterwards keeps the grades given in the pane: the miss stays, nothing is left to grade.
  expect((await learn($, 'quiz 정답')).text).not.toContain('스스로 채점해')
  expect(byName()[first]!.missedAt).toBe(NOW)

  await w.clock.advance(60_000)
  await ui.press({ key: 'quiz-new' })
  await w.clock.settle()
  expect(w.models[1]).toContain(`1. ${first} —`)
  expect(await ui.find({ type: 'Text', text: /3문제 중 0개 채점/ })).toBeDefined()
  await ui.unmount()
})

test('the pane quiz asks once while the model answers, and says why when it could not ask', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'hold', null, true, store)
  await start($)
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  w.answer = THREE_QUESTIONS
  await ui.press({ key: 'quiz-new' })
  expect(await ui.find({ type: 'Text', text: '문제를 만드는 중입니다…' })).toBeDefined()
  expect(await ui.find({ type: 'Button', key: 'quiz-new' })).toBeUndefined()
  // A new session start meanwhile (no reload) still shows the request going.
  await start($)
  expect(await ui.find({ type: 'Text', text: '문제를 만드는 중입니다…' })).toBeDefined()
  w.release()
  await w.clock.settle()
  expect(w.models).toHaveLength(1)
  expect(await ui.find({ type: 'Markdown', text: '문제 하나' })).toBeDefined()

  // A reply that is not a quiz: said in red, the last quiz stays, and s is there to try again.
  w.answer = '문제를 못 만들겠어요'
  await ui.press({ key: 'quiz-new' })
  await w.clock.settle()
  expect(await ui.find({ type: 'Text', text: /모델의 답을 문제로 읽지 못했습니다/ })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '문제 하나' })).toBeDefined()
  expect(await ui.find({ type: 'Button', key: 'quiz-new' })).toBeDefined()
  await ui.unmount()
})

test('a quiz from /learn quiz is in the pane: 맞음 grades the rest, 틀림 turns one wrong and 맞음 back from where it was', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = THREE_QUESTIONS
  expect((await learn($, 'quiz')).text).toContain('퀴즈 보기(q)')
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  // One graded in the pane first: 정답 leaves it as it is.
  await ui.press({ key: 'quiz-answer' })
  await ui.press({ key: 'quiz-wrong' })
  expect((await learn($, 'quiz 정답')).text).toContain('맞힌 문제는 /learn quiz 맞음 2 3')
  expect((await learn($, 'quiz 맞음 2 3')).text).toContain('맞힌 것으로 적었습니다: 2. ')
  expect(await ui.find({ type: 'Text', text: /^✗ 틀림 1\. / })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 2\. / })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /3문제 중 2개 맞혔습니다/ })).toBeDefined()
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 2, wrong: 1 } })
  const third = (store.get('quiz') as { items: { key: string }[] }).items[2]!.key
  const stepOfThird = () => (store.get('concepts') as Record<string, { step?: number; missedAt?: number }>)[third]!
  const rightStep = stepOfThird().step
  await learn($, 'quiz 틀림 3')
  expect(await ui.find({ type: 'Text', text: /^✗ 틀림 3\. / })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /3문제 중 1개 맞혔습니다/ })).toBeDefined()
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 1, wrong: 2 } })
  expect(stepOfThird()).toMatchObject({ step: 0, missedAt: NOW })
  // Turned back to right: as if graded right in the first place, step and all.
  await learn($, 'quiz 맞음 3')
  expect(stepOfThird().step).toBe(rightStep)
  expect(stepOfThird().missedAt).toBeUndefined()
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 2, wrong: 1 } })
  await learn($, 'quiz 틀림 3')
  await ui.unmount()

  // The next session's pane has it too.
  await start($)
  const again = await pane($)
  expect(await again.find({ type: 'Text', text: /3문제 중 3개 채점/ })).toBeDefined()
  await again.unmount()
})

test('the day\'s notes and answers make the run of days, shown in the concepts view and /learn stats', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  // Two days before, nothing yesterday: today starts a new run of one.
  store.set('activity', { '2026-10-01': { notes: 2, right: 0, wrong: 0 }, '2026-09-30': { notes: 1, right: 1, wrong: 0 }, bad: 1 })
  const w = world(on, 'ok', null, true, store)
  await start($)
  expect((await learn($, 'stats')).text).toContain('학습 기록 · 오늘 시작해 보세요 (가장 길게 2일)')
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  // A rewrite is not a second note.
  const ui = await pane($)
  await ui.press({ key: 'write' })
  await w.clock.settle()
  expect((store.get('activity') as Record<string, unknown>)['2026-10-03']).toEqual({ notes: 1, right: 0, wrong: 0 })
  for (let i = 0; i < 2; i += 1) await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: '연속 1일째 · 최근 7일 노트 4개' })).toBeDefined()
  await ui.unmount()
  const stats = (await learn($, 'stats')).text
  expect(stats).toContain('학습 기록 · 연속 1일째 (가장 길게 2일)')
  expect(stats).toContain('- 최근 7일: 노트 4개')
  expect(stats).toContain('- 최근 30일 퀴즈 정답률: 100% (1/1)')
  expect(stats).toContain('- 10-03 토 ■ 노트 1')
  expect(stats).toContain('- 10-02 금 · 노트 0')
})

test('a first record is made from the notes earlier sessions kept', async ($, on) => {
  const store = new Map<string, unknown>()
  const yesterday = NOW - 86_400_000
  store.set('history', { '/proj': { at: yesterday, notes: [{ id: 'old', turnId: 'old', at: yesterday, prompt: '어제 요청', answer: '', changes: [], moreFiles: 0, status: 'ready', text: NOTE_TEXT, savedAs: 'ready', isPast: false, concepts: [], updatedAt: yesterday }] } })
  world(on, 'ok', null, true, store)
  await start($)
  expect((await learn($, 'stats')).text).toContain('연속 1일째')
  expect((await learn($, 'stats')).text).toContain('오늘도 하면 이어집니다')
})

test('the review reminder goes away once nothing is due, and stays off when turned off', async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('concepts', { 'c:클로저': { name: '클로저', count: 1, firstAt: NOW - 3 * 86_400_000, lastAt: NOW - 3 * 86_400_000, blurb: '함수가 바깥 변수를 기억한다', files: [] } })
  const w = world(on, 'ok', null, true, store)
  await start($)
  expect(w.statuses).toEqual(['학습 노트 · 복습할 개념 1개 · /learn 패널에서 q'])
  w.answer = 'Q1: counter()가 왜 커질까?\nA1: 바깥 변수를 기억해서다.'
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  await ui.press({ key: 'quiz-new' })
  await w.clock.settle()
  await ui.press({ key: 'quiz-answer' })
  await ui.press({ key: 'quiz-right' })
  expect(w.statuses.at(-1)).toBeUndefined()
  // Three days on it is due again.
  await w.clock.advance(3 * 86_400_000)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.statuses.at(-1)).toBe('학습 노트 · 복습할 개념 1개 · /learn 패널에서 q')
  await ui.unmount()
})

test('with the review reminder off nothing is pinned', { options: { reviewReminder: false } }, async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('concepts', { 'c:클로저': { name: '클로저', count: 1, firstAt: 1, lastAt: 1, blurb: '', files: [] } })
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  // Only ever cleared: a line an earlier load pinned does not linger.
  expect(w.statuses).toEqual([undefined])
})

test('t in the note view quizzes on that note\'s concepts only', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문', '기본 매개변수'])
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const ui = await pane($)
  expect(await ui.find({ type: 'Button', key: 'note-quiz', text: '퀴즈' })).toBeDefined()
  w.answer = 'Q1: 문제 하나\nA1: 답 하나\nQ2: 문제 둘\nA2: 답 둘'
  await ui.press({ key: 'note-quiz' })
  await w.clock.settle()
  const asked = w.models.at(-1)!
  expect(asked).toContain('1. for...of 반복문 —')
  expect(asked).toContain('2. 기본 매개변수 —')
  expect(asked).not.toContain('클로저')
  expect(await ui.find({ type: 'Text', text: /2문제 중 0개 채점/ })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '문제 하나' })).toBeDefined()
  await ui.unmount()
})

test('e rewrites the note in plainer words with an everyday comparison', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const ui = await pane($)
  expect(w.models[0]).not.toContain('일상의 비유')
  w.answer = NOTE_TEXT.replace('let을 const로 바꿔', '값을 한 번 정하면 못 바꾸게(상자에 자물쇠) 해서')
  await ui.press({ key: 'easier' })
  await w.clock.settle()
  expect(w.models).toHaveLength(2)
  expect(w.models[1]).toContain('일상의 비유')
  expect(w.models[1]).toContain('입문자')
  expect(await ui.find({ type: 'Markdown', text: /상자에 자물쇠/ })).toBeDefined()
  expect(w.journal().at(-1)!.text).toContain('(다시 쓴 노트)')
  await ui.unmount()
})

test('/learn ask answers about the chosen note, and keeps the question out of the day\'s notes', async ($, on) => {
  const w = world(on)
  await start($)
  expect((await learn($, 'ask')).text).toContain('쓰는 법: /learn ask 질문')
  expect((await learn($, 'ask 왜 const야?')).text).toContain('물어볼 노트가 없습니다')
  await turn($, () => $.tool.call(EDIT_A), 't1', 'b를 상수로 바꿔줘')
  await finish(w)
  w.answer = '`const`는 다시 대입할 수 없어서, 실수로 값을 바꾸는 일을 막아 줍니다.'
  const reply = await learn($, 'ask 왜 let 대신 const를 썼어?')
  expect(reply.text).toContain('노트 (b를 상수로 바꿔줘)에 대한 답 · 일지에 남김')
  expect(reply.text).toContain('실수로 값을 바꾸는 일을 막아 줍니다')
  const asked = w.models.at(-1)!
  expect(asked).toContain('## 학습자의 질문\n왜 let 대신 const를 썼어?')
  expect(asked).toContain('let을 const로 바꿔')
  expect(asked).toContain('+const b = 2')
  const journal = w.files.get(JOURNAL) ?? ''
  expect(journal).toMatch(/## 2026-10-03 질문 \(\d\d:\d\d\)/)
  expect(journal).toContain('**물음**: 왜 let 대신 const를 썼어?')
  // The day's contents still count one note.
  expect((await learn($, 'day 오늘')).text).not.toContain('질문')
})

test('/learn anki writes every question asked and every explained concept as Anki cards', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = THREE_QUESTIONS
  await learn($, 'quiz')
  w.answer = ['Q1: 문제 하나', 'A1: 고친 답', 'Q2: 새 문제', 'A2: 새 답'].join('\n')
  await w.clock.advance(60_000)
  await learn($, 'quiz')
  expect(store.get('quizBank')).toHaveLength(4)
  const reply = await learn($, 'anki')
  const path = '/home/u/.claude/learning-notes/learn-notes-anki.txt'
  expect(reply.text).toContain(`Anki 카드 7장을 썼습니다 (퀴즈 문제 4 · 개념 3): ${path}`)
  const file = w.files.get(path)!
  expect(file.startsWith('#separator:tab\n#html:true\n')).toBe(true)
  expect(file).toContain('문제 하나\t고친 답<br><br><small>개념:')
  expect(file).not.toContain('답 하나')
})

test('/learn anki says so when there is nothing to export', async ($, on) => {
  world(on)
  await start($)
  expect((await learn($, 'anki')).text).toContain('내보낼 카드가 없습니다')
})

test('the first activity record is made once at start, so the first note written after it counts once', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  expect(store.get('activity')).toEqual({})
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 0 } })
  expect((store.get('history') as Record<string, { notes: { isCounted?: boolean }[] }>)['/proj']!.notes[0]!.isCounted).toBe(true)
})

test('pressing o twice while the first is written counts one answer', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = THREE_QUESTIONS
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  await ui.press({ key: 'quiz-new' })
  await w.clock.settle()
  await ui.press({ key: 'quiz-answer' })
  await Promise.all([ui.press({ key: 'quiz-right' }), ui.press({ key: 'quiz-right' })])
  await w.clock.settle()
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 1, wrong: 0 } })
  await ui.unmount()
})

test('틀림 the day after 맞음 moves the count on the day it was answered', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = THREE_QUESTIONS
  await learn($, 'quiz')
  await learn($, 'quiz 정답')
  await learn($, 'quiz 맞음 1 2 3')
  await w.clock.advance(86_400_000)
  await learn($, 'quiz 틀림 2')
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 2, wrong: 1 } })
})

// The engine under test runs on POSIX, so its fs reads a drive path as relative: the folder is a POSIX one here,
// and Windows paths are covered where shellTargets is tested.
const DESK = '/home/u/Desktop/cart-total'

/** The PowerShell tool as Claude Code on Windows runs it: here it writes what the command would on the mocked disk. */
function powershell(on: On, w: World, write: (command: string) => void) {
  on('tool.call', (_$, e) => {
    if ((e.tool as string) !== 'PowerShell') return { result: '' }
    write(String((e as unknown as { command: string }).command))
    return { result: { stdout: '', stderr: '', interrupted: false } }
  })
  return w
}

test('files made and changed with the PowerShell tool become a note (Windows without Git Bash)', async ($, on) => {
  const w = world(on)
  powershell(on, w, command => {
    if (command.includes('Set-Content -Path cart.js')) {
      w.files.set(`${DESK}/cart.js`, 'function cartTotal(items) {\r\n  return items.reduce((s, i) => s + i.price * i.quantity, 0)\r\n}\r\n')
      w.files.set(`${DESK}/cart.test.js`, "const { cartTotal } = require('./cart')\r\n")
    }
  })
  await start($)
  await turn($, () =>
    $.tool.call({
      tool: 'PowerShell',
      tool_use_id: 'p1',
      command: `New-Item -ItemType Directory -Force -Path "${DESK}" | Out-Null; Set-Location ${DESK}; Set-Content -Path cart.js -Value @'\nfunction cartTotal(items) { ... }\n'@; Set-Content -Path cart.test.js -Value "..."; node --test cart.test.js`,
    } as never),
  )
  await finish(w)
  const note = (await learn($, 'last')).text
  expect(note).toContain('/home/u/Desktop/cart-total/cart.js (+3 −0)')
  expect(note).toContain('cart.test.js (+1 −0)')
  expect(w.models[0]).toContain('+  return items.reduce((s, i) => s + i.price * i.quantity, 0)')
  expect(w.models[0]).not.toContain('\r')
})

test('a PowerShell edit of an existing file shows its changed lines only', async ($, on) => {
  const w = world(on)
  w.files.set(`${DESK}/cart.js`, 'a\r\nb\r\nc\r\nd\r\n')
  powershell(on, w, () => w.files.set(`${DESK}/cart.js`, 'a\r\nB\r\nc\r\nd\r\n'))
  await start($)
  await turn($, () =>
    $.tool.call({ tool: 'PowerShell', tool_use_id: 'p2', command: `(Get-Content ${DESK}/cart.js) -replace 'b', 'B' | Set-Content ${DESK}/cart.js` } as never),
  )
  await finish(w)
  expect(w.models[0]).toContain('cart.js (수정, +1 −1)')
  expect(w.models[0]).toContain('@@ -1,4 +1,4 @@\n a\n-b\n+B\n c\n d')
  // A command that names no file it changed, or only reads, makes no note.
  await turn($, () => $.tool.call({ tool: 'PowerShell', tool_use_id: 'p3', command: `Get-Content ${DESK}/cart.js` } as never), 't2')
  await finish(w)
  expect(w.models).toHaveLength(1)
})

test('a Bash run the engine gave no diff for is read off the files it names', async ($, on) => {
  const w = world(on)
  await start($)
  await turn($, () => $.tool.call({ tool: 'Bash', tool_use_id: 'b9', command: "printf '첫 줄\\n둘째 줄\\n' > /proj/notes.txt # nodiff" }))
  await finish(w)
  expect(w.models[0]).toContain('### notes.txt (새 파일, +2 −0)')
})

test('started in a system folder, the code Claude puts in its scratchpad is noted, and the pane says where to start instead', async ($, on) => {
  const w = world(on)
  w.root = '/'
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await turn($, () => $.tool.call({ ...EDIT_A, file_path: '/tmp/claude-0/scratchpad/cart.mjs' }))
  await finish(w)
  expect(w.models).toHaveLength(1)
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /Claude Code가 시스템 폴더\(\/\)에서 켜져 있습니다/ })).toBeDefined()
  await ui.unmount()
  expect((await learn($, '')).text).toContain('cd ~/practice 뒤 claude')

  // In a project, its scratch files stay out of the notes, and there is no hint.
  w.root = '/proj'
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u9', file_path: '/tmp/claude-0/scratchpad/try.mjs' }), 't2')
  await finish(w)
  expect(w.models).toHaveLength(1)
  expect((await learn($, '')).text).toBe('학습 노트 패널을 열었습니다. 단축키는 ctrl+x tab으로 패널을 고른 뒤 누릅니다.')
})

/** The answer field of question `i` in the pane's quiz, keyed by the quiz it belongs to. */
function mineKey(store: Map<string, unknown>, i: number) {
  return `quiz-mine-${(store.get('quiz') as { at: number }).at}-${i}`
}

test('a typed answer is graded by the model: the grade, feedback and model answer stay open, and the next question follows', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = THREE_QUESTIONS
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  await ui.press({ key: 'quiz-new' })
  await w.clock.settle()
  expect(await ui.find({ type: 'Input', key: mineKey(store, 0) })).toBeDefined()
  expect(await ui.find({ type: 'Button', text: '정답만 보기' })).toBeDefined()

  // Enter with nothing typed says what to do.
  await ui.input({ key: mineKey(store, 0), text: '   ' })
  expect(await ui.find({ type: 'Text', text: /답을 적은 뒤 Enter를 누르세요/ })).toBeDefined()

  w.answer = '판정: 맞음\n피드백: 핵심을 짚었어요.'
  await ui.input({ key: mineKey(store, 0), text: '바깥 변수를 기억해서' })
  await w.clock.settle()
  const asked = w.models.at(-1)!
  expect(asked).toContain('## 문제\n문제 하나')
  expect(asked).toContain('## 모범 답\n답 하나')
  expect(asked).toContain('## 학습자의 답\n바깥 변수를 기억해서')
  expect(await ui.find({ type: 'Text', text: /✓ 맞힘 1\. .* · 방금 채점/ })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '**맞혔습니다.** 핵심을 짚었어요.' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '내 답: 바깥 변수를 기억해서' })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '답 하나' })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '문제 둘' })).toBeDefined()
  expect(store.get('quiz')).toMatchObject({ items: [{ result: 'right', verdict: 'right', mine: '바깥 변수를 기억해서', feedback: '핵심을 짚었어요.' }, {}, {}] })
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 1, wrong: 0 } })

  // Almost right counts wrong, shown as such, and steps its concept back one (not to the first, not missed);
  // f turns it right, as if graded right in the first place.
  const second = (store.get('quiz') as { items: { name: string }[] }).items[1]!.name
  const concept = () => Object.values(store.get('concepts') as Record<string, { name: string; missedAt?: number; step?: number }>).find(one => one.name === second)!
  w.answer = '판정: 거의\n피드백: 순서 이야기가 빠졌어요.'
  await ui.input({ key: mineKey(store, 1), text: '대충 순서대로' })
  await w.clock.settle()
  expect(await ui.find({ type: 'Text', text: /△ 거의 맞음 2\. .* · 방금 채점/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /✓ 맞힘 1\./ })).toBeDefined()
  expect(concept().missedAt).toBeUndefined()
  // Never quizzed and met three times in notes (클로저, second as it falls due second): step 2; partly right steps it back to 1.
  expect(second).toBe('클로저')
  expect(concept().step).toBe(1)
  await Promise.all([ui.press({ key: 'quiz-flip' }), ui.press({ key: 'quiz-flip' })])
  await w.clock.settle()
  expect(await ui.find({ type: 'Text', text: /✓ 맞힘 2\. .* · 방금 채점/ })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: /\(내가 맞힘으로 바꿈\)/ })).toBeDefined()
  expect(concept().step).toBe(2)
  // Two quick presses turn it once.
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 2, wrong: 0 } })

  // A reply that is no grade: said, and the answer stays in the field to send again.
  w.answer = '음, 글쎄요'
  await ui.input({ key: mineKey(store, 2), text: '모르겠어요' })
  await w.clock.settle()
  expect(await ui.find({ type: 'Text', text: /채점 결과를 읽지 못했습니다/ })).toBeDefined()
  expect((await ui.find({ type: 'Input', key: mineKey(store, 2) }))?.props.value).toBe('모르겠어요')
  await ui.unmount()
})

test('an answer that did not come back stays in its own question, not the next one (review)', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = THREE_QUESTIONS
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  await ui.press({ key: 'quiz-new' })
  await w.clock.settle()
  w.answer = '음, 글쎄요'
  await ui.input({ key: mineKey(store, 0), text: '첫 문제 답' })
  await w.clock.settle()
  expect((await ui.find({ type: 'Input', key: mineKey(store, 0) }))?.props.value).toBe('첫 문제 답')
  await ui.press({ key: 'quiz-answer' })
  await ui.press({ key: 'quiz-right' })
  expect((await ui.find({ type: 'Input', key: mineKey(store, 1) }))?.props.value).toBe('')
  await ui.unmount()
})

const HINTED_QUESTIONS = ['Q1: 문제 하나', 'H1: 바깥을 떠올려 보세요', 'A1: 답 하나', 'Q2: 문제 둘', 'H2: 둘째 힌트', 'A2: 답 둘'].join('\n')

test('/learn quiz 1 내 답: Claude grades a typed answer in the conversation, with hints and what comes next', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  expect((await learn($, 'quiz 1 아무거나')).text).toContain('아직 낸 퀴즈가 없습니다')
  w.answer = HINTED_QUESTIONS
  const asked = await learn($, 'quiz')
  expect(asked.text).toContain('- 답을 적어 채점받기: /learn quiz 1 내 답')
  expect(asked.text).toContain('- 막히면 힌트: /learn quiz 힌트')
  expect(asked.text).not.toContain('바깥을 떠올려')
  expect(w.models.at(-1)).toContain('H1: (힌트 한 문장)')

  const hints = await learn($, 'quiz 힌트')
  expect(hints.text).toContain('1. 바깥을 떠올려 보세요')
  expect(hints.text).toContain('2. 둘째 힌트')
  expect(store.get('quiz')).toMatchObject({ items: [{ isHinted: true }, { isHinted: true }] })

  w.answer = '판정: 맞음\n피드백: 정확합니다.'
  const graded = await learn($, 'quiz 1 바깥 변수를 기억해서')
  expect(graded.text).toContain('1번 ✓ 맞힘 · 맞혔습니다. 정확합니다.')
  expect(graded.text).toContain('정답\n답 하나')
  expect(graded.text).toContain('채점이 이상하면 바꾸세요: /learn quiz 틀림 1')
  expect(graded.text).toContain('다음 문제: /learn quiz 2 내 답')
  expect(w.models.at(-1)).toContain('## 학습자의 답\n바깥 변수를 기억해서')
  expect((await learn($, 'quiz 1 다시')).text).toContain('1번은 이미 채점했습니다 (✓ 맞힘)')
  expect((await learn($, 'quiz 5 아무거나')).text).toContain('1~2 사이로')

  w.answer = '판정: 틀림\n피드백: 아닙니다.'
  const last = await learn($, 'quiz 2번 모르겠어요')
  expect(last.text).toContain('2번 ✗ 틀림 · 아쉽지만 틀렸습니다. 아닙니다.')
  expect(last.text).toContain('다 풀었습니다: 2문제 중 1개 맞힘. 틀린 개념은 다음 퀴즈에 먼저 나옵니다.')
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 1, wrong: 1 } })
  expect((await learn($, 'quiz 힌트')).text).toContain('힌트를 볼 문제가 없습니다')
})

test('h shows a question\'s hint in the pane, and a hint that only repeats the answer is not offered', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = ['Q1: 문제 하나', 'H1: 바깥을 떠올려 보세요', 'A1: 답 하나', 'Q2: 문제 둘', 'H2: 답 둘', 'A2: 답 둘'].join('\n')
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  await ui.press({ key: 'quiz-new' })
  await w.clock.settle()
  expect(await ui.find({ type: 'Markdown', text: '바깥을 떠올려 보세요' })).toBeUndefined()
  await ui.press({ key: 'quiz-hint' })
  expect(await ui.find({ type: 'Text', text: '힌트' })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '바깥을 떠올려 보세요' })).toBeDefined()
  expect(await ui.find({ type: 'Button', key: 'quiz-hint' })).toBeUndefined()
  await ui.press({ key: 'quiz-answer' })
  await ui.press({ key: 'quiz-right' })
  expect(await ui.find({ type: 'Text', text: /✓ 맞힘 1\. .* · 힌트 봄/ })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '문제 둘' })).toBeDefined()
  expect(await ui.find({ type: 'Button', key: 'quiz-hint' })).toBeUndefined()
  await ui.unmount()
})

test('a quiz asks about the code the learner made, from the note that taught the concept', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문'])
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  w.answer = 'Q1: 문제\nH1: 힌트\nA1: 답'
  await learn($, 'quiz')
  const asked = w.models.at(-1)!
  expect(asked).toContain('1. for...of 반복문 —')
  expect(asked).toContain('   학습자가 만든 코드 (a.ts):\n```\nconst a = 1\nconst b = 2\n```')
  expect(asked).toContain('그 코드를 그대로, 또는 조금 바꿔 보여 주고 묻는다')
})

test('a question typed under a note is answered there and kept with it, and a follow-up reads the last answer', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', 'b를 상수로 바꿔줘')
  await finish(w)
  const ui = await pane($)
  expect(await ui.find({ type: 'Button', key: 'ask-type', text: '질문하기' })).toBeDefined()
  const key = String((await ui.find({ type: 'Input' }))!.props.key)
  await ui.input({ key, text: '  ' })
  expect(await ui.find({ type: 'Text', text: '물어볼 것을 적은 뒤 Enter를 누르세요.' })).toBeDefined()

  w.answer = '`const`는 다시 대입할 수 없습니다.'
  await ui.input({ key, text: '왜 const야?' })
  await w.clock.settle()
  expect(await ui.find({ type: 'Text', text: '질문 · 왜 const야?' })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '`const`는 다시 대입할 수 없습니다.' })).toBeDefined()
  expect(w.models.at(-1)).not.toContain('앞서 이 노트에 대해 나눈')

  w.answer = '네, `let`은 다시 대입할 수 있습니다.'
  await ui.input({ key, text: '그럼 let은?' })
  await w.clock.settle()
  expect(w.models.at(-1)).toContain('## 앞서 이 노트에 대해 나눈 질문과 답')
  expect(w.models.at(-1)).toContain('- 질문: 왜 const야?')
  expect(await ui.find({ type: 'Text', text: '질문 · 그럼 let은?' })).toBeDefined()
  await ui.unmount()
  const asks = () => (store.get('history') as Record<string, { notes: { asks?: unknown[] }[] }>)['/proj']!.notes[0]!.asks ?? []
  expect(asks()).toHaveLength(2)
  expect(w.files.get(JOURNAL)).toContain('**물음**: 그럼 let은?')

  // /learn ask adds to the same list.
  expect((await learn($, 'ask 셋째 질문')).text).toContain('패널의 노트 아래에도 남습니다')
  expect(asks()).toHaveLength(3)

  // An answer that did not come back: said, and the question stays in the field.
  w.model = 'error'
  const again = await pane($)
  await again.input({ key, text: '넷째 질문' })
  await w.clock.settle()
  expect(await again.find({ type: 'Text', text: /답하지 못했습니다: 서버가 붐빕니다/ })).toBeDefined()
  expect((await again.find({ type: 'Input', key }))?.props.value).toBe('넷째 질문')
  await again.unmount()
})

test('the pane goes down to each answer under the note on show, or to why there is none (1.5.1)', async ($, on) => {
  const w = world(on)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', 'b를 상수로 바꿔줘')
  await finish(w)
  const ui = await pane($)
  const key = String((await ui.find({ type: 'Input' }))!.props.key)
  const ask = async (text: string) => {
    await ui.input({ key, text })
    await w.clock.settle()
    return scrollsOf(w).at(-1)!
  }
  const shown = async (to: { key: string }) => (await ui.find({ type: 'Box', key: to.key }))?.text ?? ''

  // Nothing typed: the red line under the field.
  const blank = await ask('  ')
  expect(blank).toMatchObject({ block: 'nearest', site: 'learn-notes' })
  expect(await shown(blank)).toContain('물어볼 것을 적은 뒤 Enter를 누르세요.')

  // Each answer: its question goes to the top of the pane. Two asked the same moment, then two more past
  // the two drawn and the three kept: the row gone to is always the question just answered.
  for (const [i, word] of ['첫째', '둘째', '셋째', '넷째'].entries()) {
    if (i === 2) await w.clock.advance(7)
    w.answer = `${word} 답입니다.`
    const to = await ask(`${word} 질문`)
    expect(to).toMatchObject({ block: 'start', site: 'learn-notes' })
    expect(await shown(to)).toContain(`질문 · ${word} 질문`)
    expect(scrollsOf(w)).toHaveLength(i + 2)
  }

  // An answer that did not come back: the red reason under the field, scrolled to where it shows.
  w.model = 'error'
  const failed = await ask('다섯째 질문')
  expect(failed).toMatchObject({ block: 'nearest', site: 'learn-notes' })
  expect(await shown(failed)).toContain('답하지 못했습니다: 서버가 붐빕니다')
  await ui.unmount()
})

test('a concept the model left in open bold is closed in the note, and counted like the others (1.5.1)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  w.answer = [
    '### 한 줄 요약',
    '수량이 없으면 1로 셌다',
    '### 배울 개념',
    '- **널 병합 연산자 (??): 왼쪽 값이 없으면 오른쪽 값을 쓴다 — ``item.quantity ?? 1``',
    '- **for...of 반복문**: 배열을 하나씩 돈다 — ``for (const item of items)``',
    '### 직접 확인해 볼 것',
    '- 수량을 빼고 실행해 보기',
  ].join('\n')
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  const note = (store.get('history') as Record<string, { notes: { text: string; concepts: string[] }[] }>)['/proj']!.notes[0]!
  expect(note.text).toContain('- **널 병합 연산자 (??)**: 왼쪽 값이 없으면')
  expect(note.concepts).toEqual(['c:널병합연산자', 'c:forof반복문'])
  const names = Object.values(store.get('concepts') as Record<string, { name: string }>).map(one => one.name)
  expect(names).toContain('널 병합 연산자 (??)')
  const ui = await pane($)
  expect(await ui.find({ type: 'Markdown', text: '**널 병합 연산자 (??)**: 왼쪽 값이 없으면' })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '- **널 병합 연산자 (??): 왼쪽' })).toBeUndefined()
  await ui.unmount()
})

test('undoing a merge leaves every note counting under its own name again (review)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['구조 분해'])
  await turn($, () => $.tool.call(EDIT_A), 't1')
  await finish(w)
  w.answer = CONCEPT_NOTE(['Destructuring'])
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2', file_path: '/proj/src/b.ts' }), 't2')
  await finish(w)
  expect((await learn($, 'merge Destructuring = 구조 분해')).text).toContain("→ '구조 분해' ×2")
  expect((await learn($, 'merge 구조 분해 = Destructuring')).text).toContain('되돌렸습니다')
  // Rewriting the second note teaches what it taught before: nothing moves.
  const ui = await pane($)
  await ui.press({ key: 'write' })
  await w.clock.settle()
  await ui.unmount()
  const index = store.get('concepts') as Record<string, { name: string; count: number }>
  expect(Object.values(index).map(one => `${one.name} ×${one.count}`).sort()).toEqual(['Destructuring ×1', '구조 분해 ×1'])
})

test('a later merge into a merged name keeps the record that undoes the earlier merge (review)', async ($, on) => {
  const store = new Map<string, unknown>()
  store.set('concepts', {
    'c:x': { name: 'X', count: 2, firstAt: 1, lastAt: 1, blurb: '', files: [] },
    'c:y': { name: 'Y', count: 1, firstAt: 1, lastAt: 1, blurb: '', files: [] },
    'c:z': { name: 'Z', count: 3, firstAt: 1, lastAt: 1, blurb: '', files: [] },
  })
  world(on, 'ok', null, true, store)
  await start($)
  await learn($, 'merge X = Z')
  await learn($, 'merge Y = X')
  expect((await learn($, 'merge Z = X')).text).toContain("되돌렸습니다. 다시 따로 셉니다: 'X' ×2 · 'Z' ×4")
  const index = store.get('concepts') as Record<string, { name: string; count: number }>
  expect(Object.values(index).map(one => `${one.name} ×${one.count}`).sort()).toEqual(['X ×2', 'Z ×4'])
})

test('with autoSave off, a note rewritten after /learn save is saved again by the next one (review)', { options: { autoSave: false } }, async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect((await learn($, 'save')).text).toContain('노트 1개를 저장했습니다')
  const saved = w.journal().length
  w.answer = NOTE_TEXT.replace('let을 const로 바꿔', '다시 쓴 노트: let을 const로 바꿔')
  const ui = await pane($)
  await ui.press({ key: 'write' })
  await w.clock.settle()
  await ui.unmount()
  expect(w.journal().length).toBe(saved)
  expect((await learn($, 'save')).text).toContain('노트 1개를 저장했습니다')
  expect(w.files.get(JOURNAL)).toContain('(다시 쓴 노트)')
  expect(w.files.get(JOURNAL)).toContain('다시 쓴 노트: let을')
  expect((await learn($, 'save')).text).toContain('저장할 새 노트가 없습니다')
})

test('a note finished after /cd moved the pane is stored as written, not as still writing (review)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'hold', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', '옛 프로젝트 요청')
  await w.clock.advance(5)
  w.root = '/other'
  await $.turn.start({ text: '다른 프로젝트에서', turnId: 't2' })
  w.release()
  await w.clock.settle()
  const stored = (store.get('history') as Record<string, { notes: { status: string; concepts: string[] }[] }>)['/proj']!.notes
  expect(stored[0]!.status).toBe('ready')
})

test('/learn day with no journal today lists the days there are', async ($, on) => {
  const w = world(on)
  await start($)
  w.files.set(journalPath(NOTES_DIR, NOW - 2 * 86_400_000, '/proj'), '# 학습 노트\n\n## 2026-10-01 10:00\n\n**요청**: 예전 요청\n\n---\n')
  const reply = await learn($, 'day')
  expect(reply.text).toContain('오늘 일지는 아직 없습니다')
  expect(reply.text).toContain('- 2026-10-01')
  expect((await learn($, '일지 2026-10-01')).text).toContain('예전 요청')
})

test('no new quiz while an answer is graded, and the answer cannot be graded twice by command (review)', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문'])
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  w.answer = THREE_QUESTIONS
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  await ui.press({ key: 'quiz-new' })
  await w.clock.settle()
  const models = w.models.length
  w.model = 'hold'
  w.answer = '판정: 틀림\n피드백: 아닙니다.'
  void ui.input({ key: mineKey(store, 0), text: '내 답' })
  await w.clock.advance(1)
  expect(await ui.find({ type: 'Text', text: '채점하는 중입니다…' })).toBeDefined()
  expect(await ui.find({ type: 'Button', key: 'quiz-new' })).toBeUndefined()
  // t from the note: refused, said in the quiz view.
  await ui.press({ key: 'view' })
  await ui.press({ key: 'note-quiz' })
  expect(await ui.find({ type: 'Text', text: /답을 채점하고 있습니다/ })).toBeDefined()
  // The command can neither make a new quiz nor grade the question being graded.
  expect((await learn($, 'quiz')).text).toContain('답을 채점하고 있습니다')
  expect((await learn($, 'quiz 2 둘째 답')).text).toContain('다른 답을 채점하고 있습니다')
  await learn($, 'quiz 정답')
  expect((await learn($, 'quiz 맞음 1')).text).toContain('1번은 지금 Claude가 채점하고 있습니다')
  w.release()
  await w.clock.settle()
  expect(w.models.length).toBe(models + 1)
  expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 0, wrong: 1 } })
  expect((store.get('quiz') as { items: { result?: string }[] }).items[0]!.result).toBe('wrong')
  await ui.unmount()
})

test('/learn quiz 문제 shows the quiz there is, without asking for a new one', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  expect((await learn($, 'quiz 문제')).text).toContain('아직 낸 퀴즈가 없습니다')
  w.answer = THREE_QUESTIONS
  await learn($, 'quiz')
  w.answer = '판정: 맞음\n피드백: 좋습니다.'
  await learn($, 'quiz 1 답')
  const models = w.models.length
  const shown = await learn($, 'quiz 문제')
  expect(w.models).toHaveLength(models)
  expect(shown.text).toContain('1. ✓ 맞힘 · 문제 하나')
  expect(shown.text).toContain('2. 문제 둘')
  expect(shown.text).toContain('답을 적어 채점받기: /learn quiz 2 내 답')
})

test('partly right comes back a little sooner; the learner\'s own 틀림 makes it a full miss (review)', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = 'Q1: 문제 하나\nA1: 답 하나'
  await learn($, 'quiz')
  w.answer = '판정: 거의\n피드백: 반만 맞았습니다.'
  const graded = await learn($, 'quiz 1 반쯤')
  expect(graded.text).toContain('1번 △ 거의 맞음')
  expect(graded.text).toContain('거의 맞힌 개념은 조금 일찍 다시 나옵니다')
  expect(graded.text).not.toContain('먼저 나옵니다')
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  expect(await ui.find({ type: 'Text', text: /1문제 중 0개 맞혔습니다 · 거의 맞힌 개념은 조금 일찍 다시 나옵니다/ })).toBeDefined()
  const key = (store.get('quiz') as { items: { key: string }[] }).items[0]!.key
  expect((store.get('concepts') as Record<string, { missedAt?: number }>)[key]!.missedAt).toBeUndefined()
  expect((await learn($, 'quiz 틀림 1')).text).toContain('틀린 것으로 적었습니다: 1. ')
  expect((store.get('concepts') as Record<string, { missedAt?: number; step?: number }>)[key]).toMatchObject({ missedAt: NOW, step: 0 })
  expect(await ui.find({ type: 'Text', text: /^✗ 틀림 1\. / })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: /\(내가 틀림으로 바꿈\)/ })).toBeDefined()
  // Still one wrong answer on the day: partly right was counted wrong already.
  expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 1 } })
  await ui.unmount()
})

test('questions under two notes are answered each in its own place (review)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', '첫 요청')
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2', file_path: '/proj/src/b.ts' }), 't2', '둘째 요청')
  await finish(w)
  const ui = await pane($)
  w.model = 'hold'
  w.answer = '답입니다.'
  const second = String((await ui.find({ type: 'Input' }))!.props.key)
  void ui.input({ key: second, text: '둘째 노트 질문' })
  await w.clock.advance(1)
  await ui.press({ key: 'prev' })
  const first = String((await ui.find({ type: 'Input' }))!.props.key)
  expect(first).not.toBe(second)
  void ui.input({ key: first, text: '첫 노트 질문' })
  await w.clock.advance(1)
  expect(await ui.find({ type: 'Text', text: '답을 쓰는 중입니다…' })).toBeDefined()
  w.release()
  await w.clock.settle()
  expect(await ui.find({ type: 'Text', text: '질문 · 첫 노트 질문' })).toBeDefined()
  // Only the note on show is scrolled to: the second note's answer came while the first one was shown.
  const scrolled = scrollsOf(w)
  expect(scrolled).toHaveLength(1)
  expect((await ui.find({ type: 'Box', key: scrolled[0]!.key }))?.text).toContain('질문 · 첫 노트 질문')
  await ui.press({ key: 'next' })
  expect(await ui.find({ type: 'Text', text: '질문 · 둘째 노트 질문' })).toBeDefined()
  await ui.unmount()
})

test('a failed rewrite is stored back as it was, though a store write meanwhile held it as being written (review)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', '첫 요청')
  await finish(w)
  w.model = 'hold'
  const ui = await pane($)
  await ui.press({ key: 'write' })
  await w.clock.advance(1)
  // Another turn ends meanwhile and stores the pane as it is.
  await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2', file_path: '/proj/src/b.ts' }), 't2', '둘째 요청')
  w.model = 'error'
  w.release()
  await w.clock.settle()
  await ui.unmount()
  const stored = (store.get('history') as Record<string, { notes: { prompt: string; status: string }[] }>)['/proj']!.notes
  expect(stored.find(one => one.prompt === '첫 요청')).toMatchObject({ status: 'ready' })
})

test('a note the journal could not take is written by the next /learn save (review)', async ($, on) => {
  const w = world(on)
  w.writeFails = true
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  expect(w.toasts.some(t => t.includes('파일에 저장하지 못했습니다'))).toBe(true)
  w.writeFails = false
  expect((await learn($, 'save')).text).toContain('노트 1개를 저장했습니다')
  expect(w.files.get(JOURNAL)).toContain('let을 const로')
})

const BEFORE_AFTER_NOTE = [
  '### 한 줄 요약',
  'let을 const로 바꿔 값이 다시 바뀌지 않게 했습니다.',
  '### 무엇이 바뀌었나',
  '- 전: `b`에 나중에 다른 값을 넣을 수 있었습니다.',
  '- 후: `b`는 처음 값 그대로입니다.',
  '- 예: `b = 3` → 전: 됨 / 후: 오류',
  '### 배울 개념',
  '- **const**: 다시 대입할 수 없는 변수 — `const b = 2`',
].join('\n')

test('a note says what the code did before and does now in the before/after colours, above the code too (1.5.0)', async ($, on) => {
  const w = world(on)
  w.answer = BEFORE_AFTER_NOTE
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const ui = await pane($)
  expect(await ui.find({ type: 'Markdown', text: /let을 const로 바꿔/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '무엇이 바뀌었나' })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: '− 전 ' }))?.props.color).toBe('red')
  expect((await ui.find({ type: 'Text', text: '+ 후 ' }))?.props.color).toBe('green')
  expect((await ui.find({ type: 'Text', text: '→ 예 ' }))?.props.color).toBe('cyan')
  expect(await ui.find({ type: 'Markdown', text: '`b`는 처음 값 그대로입니다.' })).toBeDefined()
  // The rest of the note is as written, its concepts read as before.
  expect(await ui.find({ type: 'Markdown', text: /### 배울 개념/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /새로 배운 개념 const/ })).toBeDefined()
  // The same lines head the before/after view.
  await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Markdown', text: '`b = 3` → 전: 됨 / 후: 오류' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /− 전 · 1~2행/ })).toBeDefined()
  await ui.press({ key: 'view' })
  await ui.press({ key: 'view' })
  await ui.unmount()
})

test('r follows the note\'s code on one example, kept under the note by its name (1.5.0)', async ($, on) => {
  const store = new Map<string, unknown>()
  const w = world(on, 'ok', null, true, store)
  await start($)
  await turn($, () => $.tool.call(EDIT_A), 't1', 'b를 상수로 바꿔줘')
  await finish(w)
  const ui = await pane($)
  expect(await ui.find({ type: 'Button', key: 'trace', text: '예시로 따라가기' })).toBeDefined()
  w.answer = '1. `const a = 1`: a는 1입니다.\n2. `const b = 2`: b는 2입니다.'
  await ui.press({ key: 'trace' })
  await w.clock.settle()
  expect(w.models.at(-1)).toContain('구체적인 예시 입력 하나로 한 단계씩 따라가')
  expect(w.models.at(-1)).toContain('+const b = 2')
  expect(await ui.find({ type: 'Text', text: '▶ 예시로 따라가기' })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: /b는 2입니다/ })).toBeDefined()
  // Nothing is left in the question field for r's walk-through.
  expect((await ui.find({ type: 'Input' }))?.props.value).toBe('')
  await ui.unmount()
  const asks = (store.get('history') as Record<string, { notes: { asks?: { question: string }[] }[] }>)['/proj']!.notes[0]!.asks ?? []
  expect(asks.map(one => one.question)).toEqual(['예시로 따라가기'])
  expect(w.files.get(JOURNAL)).toContain('**물음**: 예시로 따라가기')

  // A follow-up question reads the walk-through by its name.
  const again = await pane($)
  const key = String((await again.find({ type: 'Input' }))!.props.key)
  await again.input({ key, text: '2단계를 더 자세히' })
  await w.clock.settle()
  expect(w.models.at(-1)).toContain('- 질문: 예시로 따라가기')
  await again.unmount()
})

test('a new file shows as highlighted code on the after side, nothing before it (1.5.0)', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/new.ts', content: 'export const x = 1\nexport const y = 2\n' }))
  await finish(w)
  const ui = await pane($)
  await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /(없음: 새로 추가된 부분)/ })).toBeDefined()
  const code = await ui.find({ type: 'Code' })
  expect(code?.text).toBe('export const x = 1\nexport const y = 2')
  expect(code?.props.startLine).toBe(1)
  await ui.press({ key: 'view' })
  await ui.press({ key: 'view' })
  await ui.unmount()
})


test('r leaves the question field as it was, and does nothing while another answer is written (review)', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A), 't1', 'b를 상수로 바꿔줘')
  await finish(w)
  const ui = await pane($)
  const key = String((await ui.find({ type: 'Input' }))!.props.key)
  // A question whose answer did not come back is put back in the field.
  w.model = 'error'
  await ui.input({ key, text: '왜 const야?' })
  await w.clock.settle()
  expect((await ui.find({ type: 'Input', key }))?.props.value).toBe('왜 const야?')
  // r, failing or not, keeps it there.
  await ui.press({ key: 'trace' })
  await w.clock.settle()
  expect((await ui.find({ type: 'Input', key }))?.props.value).toBe('왜 const야?')
  w.model = 'ok'
  w.answer = '1. a는 1입니다.'
  await ui.press({ key: 'trace' })
  await w.clock.settle()
  expect(await ui.find({ type: 'Text', text: '▶ 예시로 따라가기' })).toBeDefined()
  expect((await ui.find({ type: 'Input', key }))?.props.value).toBe('왜 const야?')
  // While a question is answered, r asks nothing more and leaves no walk-through in the field.
  w.model = 'hold'
  await ui.input({ key, text: '그럼 let은?' })
  const calls = w.models.length
  await ui.press({ key: 'trace' })
  expect(w.models.length).toBe(calls)
  expect(await ui.find({ type: 'Text', text: '답을 쓰는 중입니다…' })).toBeDefined()
  w.release()
  await w.clock.settle()
  await ui.unmount()
})
