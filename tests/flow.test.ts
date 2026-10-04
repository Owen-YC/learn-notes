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
  writes: { path: string; text: string }[]
  logs: string[]
  store: Map<string, unknown>
  answer: string
  root: string
  storeFails: boolean
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
    writes: [],
    logs: [],
    store,
    answer: NOTE_TEXT,
    root: '/proj',
    storeFails: false,
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
    if (model === 'reject') return { deny: 'model blocked by policy' }
    if (model === 'hold') await held
    return model === 'error'
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
  on('tool.call', { tool: 'Bash' }, (_$, e) => ({
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
  }))
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
  expect((await learn($, 'last')).text).toContain('서버가 붐빕니다 · 잠시 뒤 [다시 쓰기]')
  expect(w.toasts).toHaveLength(0)
  expect(w.writes[0]!.text).toContain('노트를 쓰지 못했다: 서버가 붐빕니다')

  const ui = await pane($)
  expect(await ui.find({ type: 'Button', text: '노트 쓰기' })).toBeDefined()
  await ui.unmount()
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
  expect(await ui.find({ type: 'Text', text: /파일이 커서 diff를 만들지 못했습니다/ })).toBeDefined()
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

test('the pane walks note → before/after → diff', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await pane($, surface)
    expect(await ui.find({ type: 'Text', text: /노트 1\/1/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: '전/후 보기' })).toBeDefined()

    await ui.press({ key: 'view' })
    expect(await ui.find({ type: 'Text', text: /− 전 · 1~2행/ })).toBeDefined()
    expect(await ui.find({ type: 'Code', text: 'const a = 1\nlet b = 2' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\+ 후 · 1~2행/ })).toBeDefined()
    expect(await ui.find({ type: 'Code', text: 'const a = 1\nconst b = 2' })).toBeDefined()

    await ui.press({ key: 'view' })
    const code = await ui.find({ type: 'Code' })
    expect(code?.props.format).toBe('diff')
    expect(code?.text).toContain('+const b = 2')

    await ui.press({ key: 'view' })
    expect(await ui.find({ type: 'Text', text: /아직 모인 개념이 없습니다/ })).toBeDefined()

    await ui.press({ key: 'view' })
    expect(await ui.find({ type: 'Text', text: /아직 모인 개념이 없어 퀴즈를 낼 수 없습니다/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'quiz-new' })).toBeUndefined()

    await ui.press({ key: 'view' })
    expect(await ui.find({ type: 'Markdown' })).toBeDefined()
    await ui.unmount()
  }
})

test('an unfocused terminal pane says how to reach its keys', async ($, on) => {
  const w = world(on)
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: false })
  expect(await ui.find({ type: 'Text', text: /ctrl\+x tab으로 패널을 고르면/ })).toBeDefined()
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
  expect((await learn($, 'what')).text).toContain('/learn save')

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
  expect(shown.text).toContain('no surface places panes')
  expect(shown.text).toContain('let을 const로')
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
  expect(await ui.find({ type: 'Text', text: /복습한 개념 for\.\.\.of 반복문 ×2$/ })).toBeDefined()
  for (let i = 0; i < 3; i += 1) await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /지금까지 배운 개념 3개/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /for\.\.\.of 반복문 ×2/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /요청:/ })).toBeUndefined()
  expect(await ui.find({ type: 'Button', key: 'prev' })).toBeUndefined()

  // The first note, seen now, still says it taught for...of first (concepts → quiz → note).
  for (let i = 0; i < 2; i += 1) await ui.press({ key: 'view' })
  await ui.press({ key: 'prev' })
  expect(await ui.find({ type: 'Text', text: /새로 배운 개념 for\.\.\.of 반복문 · 기본 매개변수$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /복습한 개념/ })).toBeUndefined()
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
  for (let i = 0; i < 3; i += 1) await ui.press({ key: 'view' })
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
  for (let i = 0; i < 3; i += 1) await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /지금까지 배운 개념 3개/ })).toBeDefined()
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
  for (let i = 0; i < 3; i += 1) await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /최근 7일 새 개념 1개 · 복습 0개/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /복습할 개념 1개/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /클로저 · 31일 지남/ })).toBeDefined()
  // Learned just now: due tomorrow.
  expect(await ui.find({ type: 'Text', text: /for\.\.\.of 반복문 ×1 · .* · 다음 복습 내일/ })).toBeDefined()
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
  for (const word of ['last', 'concepts', 'find', 'days', 'day', 'merge', 'save', 'clear']) expect(help.text).toContain(`/learn ${word}`)
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

test('/learn quiz asks about concepts due for review, and 정답 shows answers and marks them reviewed', async ($, on) => {
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
  expect(shown.text).toContain('복습으로 표시했습니다: 클로저')
  const index = store.get('concepts') as Record<string, { reviewedAt?: number }>
  expect(index['c:클로저']!.reviewedAt).toBe(NOW)
  expect((await learn($, 'concepts')).text).not.toContain('다시 볼 개념')

  // No note in this project: the pane still opens the concepts with v.
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /지금까지 배운 개념 1개가 있습니다 · v로 보기/ })).toBeDefined()
  await ui.press({ key: 'view' })
  expect(await ui.find({ type: 'Text', text: /클로저/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /복습 \d\d:\d\d/ })).toBeDefined()
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
  expect((await learn($, 'quiz 틀림 2')).text).toContain('먼저 /learn quiz 정답으로')
  expect((await learn($, 'quiz 정답')).text).toContain('/learn quiz 틀림 2처럼')
  expect((await learn($, 'quiz 틀림 9')).text).toContain('1~3 사이로')
  // The second question's concept: the one listed second in the prompt the model got.
  const second = /\n2\. (.+?) —/.exec(first)![1]!
  expect((await learn($, 'quiz 틀림 2번')).text).toBe(`복습할 개념 맨 앞에 올렸습니다: ${second}. 다음 퀴즈에 먼저 나옵니다.`)
  // Seeing the answers again does not clear the miss just marked.
  expect((await learn($, 'quiz 정답')).text).not.toContain('복습으로 표시했습니다')
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
  await learn($, 'quiz 정답')
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
  expect(shown.text).toContain('복습으로 표시했습니다: 클로저')
  expect((store.get('quiz') as { isRevealed: boolean }).isRevealed).toBe(true)
  expect((await learn($, 'quiz 틀림 1')).text).toContain('복습할 개념 맨 앞에 올렸습니다: 클로저')
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
  // /learn quiz 정답 afterwards keeps the grades given in the pane: the miss stays.
  expect((await learn($, 'quiz 정답')).text).not.toContain('복습으로 표시했습니다')
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

test('a quiz from /learn quiz is in the pane, and 정답 and 틀림 there show in it', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = THREE_QUESTIONS
  expect((await learn($, 'quiz')).text).toContain('퀴즈 보기(q)')
  const ui = await pane($)
  await ui.press({ key: 'quiz' })
  expect(await ui.find({ type: 'Button', key: 'quiz-answer' })).toBeDefined()
  await learn($, 'quiz 정답')
  expect(await ui.find({ type: 'Markdown', text: '답 하나' })).toBeDefined()
  expect(await ui.find({ type: 'Button', key: 'quiz-right' })).toBeDefined()
  await learn($, 'quiz 틀림 1')
  expect(await ui.find({ type: 'Text', text: /^✗ 틀림 1\. / })).toBeDefined()
  expect(await ui.find({ type: 'Markdown', text: '답 둘' })).toBeDefined()
  await ui.unmount()

  // The next session's pane has it too.
  await start($)
  const again = await pane($)
  expect(await again.find({ type: 'Text', text: /3문제 중 1개 채점/ })).toBeDefined()
  await again.unmount()
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
  expect(w.statuses).toEqual([])
})

test('t in the note view quizzes on that note\'s concepts only', async ($, on) => {
  const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
  const w = world(on, 'ok', null, true, store)
  await start($)
  w.answer = CONCEPT_NOTE(['for...of 반복문', '기본 매개변수'])
  await turn($, () => $.tool.call(EDIT_A))
  await finish(w)
  const ui = await pane($)
  expect(await ui.find({ type: 'Button', text: '이 노트 퀴즈' })).toBeDefined()
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
