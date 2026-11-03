// The engine beneath the plugin for the flow tests (tests/flow*.test.ts): the world, its helpers and the shared
// texts, moved out of tests/flow.test.ts unchanged so its tests run as four files (1.10.0 cross-review: one file
// near half of the runner's per-file time limit). Not a test file: the runner runs *.test.ts alone.

import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On, SettingsSource } from 'claude-code'
import type { LearnNote } from '../types'
import {
  BASE_LEAD,
  DRILL_RULE_AFTER,
  IS_BASE_ASKED,
  IS_RULE_DRILL,
  IS_THINK_ASKED,
  ASK_SYSTEM,
  CHECK_SYSTEM,
  QUIZ_SYSTEM,
  RECAP_SYSTEM,
  RULE_DRILL_SYSTEM,
  RULE_DRILL_TOKENS,
  SYSTEM,
  THINK_ASK,
  THINK_SYSTEM,
  WORKED_BASE_NEXT,
  WORKED_NEXT,
  RUNG_CHANGED_STEP,
  RUNG_NEW_STEP,
  STAMP_KEPT_MS,
  SWITCH_KINDS,
  MODEL_SWITCHES,
  WORKED_AFTER_TIMES,
  WORKED_CODE_ASK,
  WORKED_PLAIN_ASK,
  WORKED_PLAN_LINE,
  WORKED_TURN_ASK,
  WRITER_MARK,
  checkPrompt,
  cleanConcepts,
  cleanMarkedConcepts,
  conceptKey,
  indexPrint,
  parseTeamFile,
  ruleDrillPrompt,
  ruleNamesOf,
  screenNote,
  journalPath,
  knownMarks,
  markedConcepts,
  recallSteps,
  recapRange,
  reportMarkdown,
  rootTag,
  stamp,
  stepMarks,
  storedConcepts,
  switchKeys,
  traceQuestion,
  withKnownMarks,
  type Switches,
} from '../hooks/notes'
import { COEXIST_CASES, COEXIST_MIXED, type CoexistStore } from './fixtures/coexist19'
import { ROUTE19_CALLS, ROUTE19_DIAG } from './fixtures/route19'
import { INPUT_RULE19, OUTPUT_RULE19 } from './fixtures/rule19'
import { CHANGED_QUIZ_OFF, CHANGED_QUIZ_ON } from './fixtures/changed110'
import { CHECK_19, CHECK_FIRSTS_110, CHECK_ITEM_110, CHECK_MINE_110, NEW_EXACT_110 } from './fixtures/check110'
import { THINK19_R, THINK19_SYSTEM, THINK19_TYPED } from './fixtures/think19'


export const NOW = Date.UTC(2026, 9, 3, 1)
export const NOTES_DIR = '/home/u/.claude/learning-notes'
/** This project's journal for the mocked day, as the mod names it. */
export const JOURNAL = journalPath(NOTES_DIR, NOW, '/proj')

export const PANE_PROPS = {
  title: '학습 노트',
  isFocused: true,
  bodyColumns: 60,
  placement: 'dock' as 'dock' | 'inline',
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}

/**
 * The concepts the store's index holds, the writer's mark (1.9.0 F1: WRITER_MARK, beside them) left out: what the
 * tests written before it read off the store.
 */
export function indexIn(store: Map<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(store.get('concepts') as Record<string, unknown>).filter(([key]) => key !== WRITER_MARK))
}

export const NOTE_TEXT = [
  '### 한 줄 요약',
  'let을 const로 바꿔 값이 다시 바뀌지 않게 했다',
  '### 무엇이 바뀌었나',
  '- `src/a.ts`: `let b` → `const b`',
].join('\n')

export const USAGE = { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

export type Model = 'ok' | 'error' | 'reject' | 'hold'

/**
 * One model call's answer, from the queue `replies` holds (1.7.0 D3): the note's text, an API error (`status` null
 * for a connection that dropped before any response), `timeout` (the call runs out its own time limit, then is cut),
 * or `cut` (cut at once, as a reload cuts it).
 */
export type Reply = 'ok' | 'timeout' | 'cut' | { status: number | null; error: string }

export const ZERO_USAGE = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

/**
 * Whose settings each layer of a read holds, lowest precedence first, as the engine folds them (index.d.ts
 * `$.settings.read`, SettingsLayerSource): the enabled plugins' base beneath `user` (~/.claude/settings.json), then
 * `project` (.claude/settings.json), `local` (.claude/settings.local.json), `flag` (`--settings`) and `policy` (the
 * managed settings, every managed tier merged).
 */
export const SETTINGS_LAYERS = ['plugin', 'user', 'project', 'local', 'flag', 'policy'] as const satisfies readonly ('plugin' | SettingsSource)[]

/** What each source of settings holds, as its file loads (a source with no file left out). */
export type SettingsLayers = { [source in (typeof SETTINGS_LAYERS)[number]]?: Record<string, unknown> }

/**
 * The settings merged over the layers given, lowest precedence first, as the engine merges them with no hook
 * (index.d.ts `$.settings.read`): a scalar from the last layer that has it, lists joined, objects merged. The layers
 * are left as they were.
 */
export function mergeSettings(layers: readonly (Record<string, unknown> | undefined)[]): Record<string, unknown> {
  const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
  const merge = (into: Record<string, unknown>, from: Record<string, unknown>): Record<string, unknown> => {
    for (const [key, value] of Object.entries(from)) {
      const was = into[key]
      into[key] = Array.isArray(was) && Array.isArray(value) ? [...was, ...value] : isObject(was) && isObject(value) ? merge({ ...was }, value) : value
    }
    return into
  }
  return layers.reduce<Record<string, unknown>>((into, layer) => (layer === undefined ? into : merge(into, layer)), {})
}

export type World = {
  /** How the model answers from now on. */
  model: Model
  /** The next calls' answers, the first taken by each call while any is left (before `model`). */
  replies: Reply[]
  /**
   * The next answered calls' texts, the first taken by each call answered while any is left (before `answer`): a
   * note's and then its team rule's practice's own call (1.10.0 G6), each its reply.
   */
  texts: string[]
  /** The account's rate-limit windows as `$.session.usage()` gives them (empty: an API key's session). */
  limits: { kind: string; percentUsed: number }[]
  writes: { path: string; text: string }[]
  logs: string[]
  store: Map<string, unknown>
  answer: string
  root: string
  storeFails: boolean
  /** True while every disk write fails (a folder that cannot be written), refused with `writeError`. */
  writeFails: boolean
  /** What a refused disk write says, an OS refusal with its errno and the path, as the engine passes it on. */
  writeError: string
  /** How many of the next disk writes are refused with `writeError`, the ones after them taken. */
  failNextWrites: number
  /** True while the session's root cannot be read: a hook that needs it throws. */
  rootFails: boolean
  /** The surfaces attached, as `$.session.surfaces()` says (1.7.1: the desktop app seats a pane a moment late). */
  surfaces: ('terminal' | 'desktop' | 'vscode' | 'mobile')[]
  /** Why an undrawn open waits, as the engine says it (`no-surface …` while none is attached). */
  openReason: string
  /** While set, a write of the notes (the store's `history`) waits for it: a slow disk under the store. */
  historyHold: Promise<void> | null
  /** The settings an administrator locked, as /config lists them (`learn-notes.dailyAutoNotes`). */
  locked: string[]
  /** The version the plugin's own plugin.json gives; null when it cannot be read. */
  version: string | null
  /**
   * The switches of the model-gated items the plugin.json served gives the build (1.9.0: `isRuleDrill`), read at its
   * session start; undefined for none, as a release's plugin.json has: each is then its constant in notes.ts.
   */
  harness?: Record<string, unknown>
  /**
   * What each source of settings holds (1.10.0 cross-review: a window whose route turns a switch on reads
   * `modelOverrides` there), answered as the engine answers `$.settings.read`: a read naming a source (`{ source }`)
   * gets that source's alone, `{}` when it holds none; a read naming none gets every layer merged (mergeSettings).
   * Undefined: no source holds any.
   */
  settings?: SettingsLayers
  /** True while each settings read is refused. */
  settingsFails?: boolean
  /** How many times the settings were read (a read of one key is the object's, projected: one event, no key named). */
  settingsReads: number
  /** This session's id, as `$.session.id()` answers it. */
  sessionId: string
  /** The key of each store write that went in, in order. */
  sets: string[]
  /** The key of each store read, in order (1.9.0: a marked index is read with no copy). */
  gets: string[]
  journal: () => { path: string; text: string }[]
  toasts: string[]
  statuses: (string | undefined)[]
  models: string[]
  opened: string[]
  /** For each ui.open, whether it asked for the keys (`focus`). */
  focused: boolean[]
  files: Map<string, string>
  /** Each file's modified time as fs.stat gives it (0 when not set). */
  mtimes: Map<string, number>
  /** Paths that are links, with where each leads (fs.stat's isLink and realPath). */
  links: Map<string, string>
  /** Paths fs.stat refuses (1.8.0), with the errno it says (`ENOENT`) or `network` for a network location. */
  statFails?: Map<string, string>
  /** Paths fs.stat calls a folder though no file lies under them. */
  dirs?: Set<string>
  /** Paths fs.read refuses, with the errno it says or `network`. */
  readFails?: Map<string, string>
  /** Each file's size as fs.stat gives it, where it is not the text's length. */
  sizes?: Map<string, number>
  /** Each text put on the clipboard. */
  copied: string[]
  /** True while the surface has no clipboard to copy on (a remote one). */
  copyFails: boolean
  /** The surface each copy that went in was asked for (undefined: left to the engine), as `copied`. */
  copiedOn: (string | undefined)[]
  /** Surfaces whose app does not answer a copy (`no-clipboard` there), as a remote app may not yet. */
  clipless: string[]
  /** The lines put in the transcript (a dim row the person sees), as against the debug log alone. */
  transcript: string[]
  /** The tools the plugin registered for the model, by short name. */
  tools: string[]
  /** True while no tool can be registered (an engine with no tools for plugins). */
  toolFails: boolean
  /** The tokens each model call reports from now on. */
  usage: typeof USAGE
  /** The model setting each model call asked for, in order. */
  modelsAsked: string[]
  /** The output budget (maxTokens) each model call asked for, in order. */
  budgets: (number | undefined)[]
  /** The system prompt each model call sent, in order (1.9.0 F6: a guess's check has its own). */
  systems: (string | undefined)[]
  /** Each slash command the plugin registered, as it described it. */
  commands: { name: string; description: string | undefined; argumentHint: string | undefined }[]
  release: () => void
  clock: ReturnType<typeof mock.clock>
}

/** The engine beneath the plugin: a project at /proj, a home, a disk in memory, a model. */
export function world(
  on: On,
  model: Model = 'ok',
  panes: { isShown: boolean; isPlaced?: boolean; isFocused?: boolean } | null = null,
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
    replies: [],
    texts: [],
    limits: [],
    writes: [],
    logs: [],
    store,
    answer: NOTE_TEXT,
    root: '/proj',
    storeFails: false,
    writeFails: false,
    writeError: "EACCES: permission denied, open '/home/u/.claude/learning-notes/2026-10-03_proj.md'",
    rootFails: false,
    surfaces: ['terminal'],
    openReason: 'no surface places panes',
    historyHold: null,
    failNextWrites: 0,
    locked: [],
    version: '1.7.0',
    sessionId: 'session-mine',
    settingsReads: 0,
    sets: [],
    gets: [],
    journal: () => w.writes.filter(write => !write.path.endsWith('/concepts.md')),
    toasts: [],
    statuses: [],
    models: [],
    opened: [],
    focused: [],
    files: new Map(),
    mtimes: new Map(),
    links: new Map(),
    copied: [],
    copyFails: false,
    copiedOn: [],
    clipless: [],
    transcript: [],
    tools: [],
    toolFails: false,
    usage: USAGE,
    modelsAsked: [],
    budgets: [],
    systems: [],
    commands: [],
    release: () => release(),
    clock: mock.clock(on, { now: Date.UTC(2026, 9, 3, 1) }),
  }
  mock.env(on, { HOME: '/home/u', ...env })
  on('session.root', () => {
    if (w.rootFails) throw new Error('root unreadable')
    return { value: w.root }
  })
  on('session.version', () => ({ value: { version: '2.1.296', base: '2.1.296' } }))
  on('session.id', () => ({ value: w.sessionId }))
  on('session.surfaces', () => ({ value: [...w.surfaces] }))
  on('session.usage', () => ({ value: { startedAt: NOW, context: { window: 200_000 }, rateLimits: w.limits } }))
  on('config.list', () => ({
    value: ['autoNote', 'model', 'dailyAutoNotes', 'level', 'autoSave', 'saveDir'].map(field => ({
      key: `learn-notes.${field}`,
      label: field,
      kind: 'text' as const,
      value: '',
      provider: { plugin: 'learn-notes', tier: 'user' as const },
      isLocked: w.locked.includes(`learn-notes.${field}`),
    })),
  }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('session.end', (_$, e) => ({ sessionId: e.sessionId }))
  on('command.register', (_$, e) => {
    w.commands.push({ name: e.name, description: e.description, argumentHint: e.argumentHint })
    return { value: { command: e.name } }
  })
  on('tool.register', (_$, e) => {
    if (w.toolFails) throw new Error('no tools for plugins here')
    w.tools.push(e.name)
    return { value: { tool: `mcp__learn-notes__${e.name}` } }
  })
  // The store as JSON, as the host keeps it: what goes in comes back a copy.
  on('store.get', (_$, e) => {
    w.gets.push(e.key)
    return { value: w.store.has(e.key) ? JSON.parse(JSON.stringify(w.store.get(e.key))) : undefined }
  })
  on('store.set', async (_$, e) => {
    if (e.key === 'history' && w.historyHold) await w.historyHold
    // Refused in Claude Code 2.1.302's own words for a store past its limit (1.8.0: 1.7's harness said `store over 4 MiB`).
    if (w.storeFails) return { deny: 'learn-notes: $.store.set: the store would be 4194400 characters, over the 4194304 limit' }
    w.sets.push(e.key)
    w.store.set(e.key, JSON.parse(JSON.stringify(e.value)))
    return { value: undefined }
  })
  on('store.keys', () => ({ value: [...w.store.keys()] }))
  // The settings as the engine answers a read: the one source the read names (`e.source`) as loaded, else every layer
  // merged; a snapshot in plain data each read (a key's read is the object's, projected, its source on `e` the same).
  on('settings.read', (_$, e) => {
    w.settingsReads += 1
    if (w.settingsFails) return { deny: 'refused by policy' }
    const layers = w.settings ?? {}
    const value = e.source !== undefined ? (layers[e.source] ?? {}) : mergeSettings(SETTINGS_LAYERS.map(source => layers[source]))
    return { value: JSON.parse(JSON.stringify(value)) as Record<string, unknown> }
  })
  on('ui.log', (_$, e) => {
    w.logs.push(e.text)
    if (e.to !== 'debug') w.transcript.push(e.text)
    return { value: undefined }
  })
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  // A hook beneath that stops prompts holding a secret, as a secret scanner would.
  on('prompt.submit', (_$, e) => (e.text.includes('SECRET') ? { drop: 'blocked: contains a secret' } : { text: e.text }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('ui.render', { component: 'Spinner' }, ($, e) => $.ui.resolve(e).Text({ children: e.props.word }))
  on('fs.exists', (_$, e) => ({ value: w.files.has(e.path) }))
  /** A refusal in the engine's words: an OS refusal with its errno and the path, or a network location. */
  const refusal = (call: string, path: string, code: string) =>
    code === 'network' ? `$.fs.${call}: a network location is not reached from here` : `${code}: refused, ${call} '${path}'`
  on('fs.stat', (_$, e) => {
    const failed = w.statFails?.get(e.path)
    if (failed !== undefined) return { deny: refusal('stat', e.path, failed) }
    return {
      value: {
        // A path some file lies under is a folder (the journal folder once a journal is in it).
        kind: w.dirs?.has(e.path) || [...w.files.keys()].some(path => path.startsWith(`${e.path}/`)) ? ('dir' as const) : ('file' as const),
        size: w.sizes?.get(e.path) ?? (w.files.get(e.path) ?? '').length,
        mtimeMs: w.mtimes.get(e.path) ?? 0,
        isLink: w.links.has(e.path),
        ...(e.resolve ? { realPath: w.links.get(e.path) ?? e.path } : {}),
      },
    }
  })
  // The plugin's own manifest, as a release ships it: what /learn 도움말 and /learn 진단 name.
  on('fs.read', (_$, e) => {
    const failed = w.readFails?.get(e.path)
    if (failed !== undefined) return { deny: refusal('read', e.path, failed) }
    return {
      value:
        w.files.get(e.path) ??
        (e.path.endsWith('/.claude-plugin/plugin.json') && w.version !== null
          ? JSON.stringify({ name: 'learn-notes', version: w.version, ...(w.harness ? { harness: w.harness } : {}) })
          : ''),
    }
  })
  on('fs.list', (_$, e) => ({
    value: [...w.files.keys()]
      .filter(path => path.startsWith(`${e.path}/`) && !path.slice(e.path.length + 1).includes('/'))
      .map(path => ({ name: path.slice(e.path.length + 1), kind: 'file' as const, size: 1, mtimeMs: 0, isLink: false })),
  }))
  on('fs.write', (_$, e) => {
    if (w.writeFails) return { deny: w.writeError }
    if (w.failNextWrites > 0) {
      w.failNextWrites -= 1
      return { deny: w.writeError }
    }
    w.writes.push({ path: e.path, text: e.text })
    w.files.set(e.path, e.text)
    return { value: undefined }
  })
  on('ui.toast', (_$, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.copy', (_$, e) => {
    if (w.copyFails || (e.surface !== undefined && w.clipless.includes(e.surface))) return { value: { isCopied: false as const, reason: 'no-clipboard' as const } }
    w.copied.push(e.text)
    w.copiedOn.push(e.surface)
    return { value: { isCopied: true as const } }
  })
  on('ui.status', (_$, e) => {
    w.statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.panes', () => ({
    value: panes ? [{ id: 'learn-notes', title: '학습 노트', isShown: panes.isShown, isFocused: panes.isFocused === true, isPlaced: panes.isPlaced ?? true }] : [],
  }))
  on('ui.open', (_$, e) => {
    w.opened.push(e.id)
    w.focused.push(e.focus === true)
    return { value: isPlaced ? { isPlaced: true } : { isPlaced: false, reason: w.openReason } }
  })
  on('model.complete', async (_$, e) => {
    w.models.push(e.prompt)
    w.modelsAsked.push(e.model)
    w.budgets.push(e.maxTokens)
    w.systems.push(e.system)
    const queued = w.replies.shift()
    if (queued === 'ok') return { value: { isAnswered: true as const, text: w.texts.shift() ?? w.answer, usage: w.usage } }
    if (queued === 'timeout') await w.clock.sleep(e.timeoutMs ?? 0)
    if (queued === 'timeout' || queued === 'cut') return { value: { isAnswered: false as const, reason: 'aborted' as const, usage: ZERO_USAGE } }
    if (queued !== undefined) return { value: { isAnswered: false as const, reason: 'api-error' as const, status: queued.status, error: queued.error as 'unknown', usage: ZERO_USAGE } }
    if (w.model === 'reject') return { deny: 'model blocked by policy' }
    if (w.model === 'hold') await held
    return w.model === 'error'
      ? { value: { isAnswered: false, reason: 'api-error', status: 529, error: 'overloaded', usage: w.usage } }
      : { value: { isAnswered: true, text: w.texts.shift() ?? w.answer, usage: w.usage } }
  })
  on('tool.call', { tool: 'Edit' }, (_$, e) => {
    if (e.file_path.endsWith('broken.ts')) return { isError: true, result: 'boom', text: 'boom' }
    // An edit that only indents a line further.
    if (e.file_path.endsWith('fmt.ts')) {
      return {
        result: {
          filePath: e.file_path,
          oldString: e.old_string,
          newString: e.new_string,
          originalFile: 'function f(a) {\n  return a\n}\n',
          structuredPatch: [{ oldStart: 2, oldLines: 1, newStart: 2, newLines: 1, lines: ['-  return a', '+    return a'] }],
          userModified: false,
          replaceAll: false,
        },
      }
    }
    // An edit that moves a call after the next one, each line as it was.
    if (e.file_path.endsWith('moved.ts')) {
      return {
        result: {
          filePath: e.file_path,
          oldString: e.old_string,
          newString: e.new_string,
          originalFile: 'init()\nrun()\n',
          structuredPatch: [{ oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: ['-init()', ' run()', '+init()'] }],
          userModified: false,
          replaceAll: false,
        },
      }
    }
    // An edit far down a file (1.9.0 F3): the library it uses was imported at its top, above the hunk.
    if (e.file_path.endsWith('posts.js')) {
      return {
        result: {
          filePath: e.file_path,
          oldString: e.old_string,
          newString: e.new_string,
          originalFile: '',
          structuredPatch: [
            {
              oldStart: 18,
              oldLines: 4,
              newStart: 18,
              newLines: 5,
              lines: ['   try {', '-    const res = await fetch("/api/posts")', '+    const res = await axios.get("/api/posts", { params: { page: 1 } })', '+    return res.data', '   } catch (err) {', '     return []'],
            },
          ],
          userModified: false,
          replaceAll: false,
        },
      }
    }
    // An edit with a run to follow (1.10.0 G5, isThinkCode): `b` made from `a`, where a.ts's own makes it a constant.
    if (e.file_path.endsWith('sum.ts')) {
      return {
        result: {
          filePath: e.file_path,
          oldString: e.old_string,
          newString: e.new_string,
          originalFile: 'const a = 1\nlet b = 2\n',
          structuredPatch: [{ oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: [' const a = 1', '-let b = 2', '+const b = a + 1'] }],
          userModified: false,
          replaceAll: false,
        },
      }
    }
    // A file whose one new line is what the edit wrote: a line holding a secret, say.
    if (e.file_path.endsWith('db.ts')) {
      return {
        result: {
          filePath: e.file_path,
          oldString: e.old_string,
          newString: e.new_string,
          originalFile: 'export {}\n',
          structuredPatch: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 2, lines: [' export {}', `+${e.new_string}`] }],
          userModified: false,
          replaceAll: false,
        },
      }
    }
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
          // An install rewrites the lock file too.
          ...(e.command.includes('npm install')
            ? [
                {
                  filePath: '/proj/package-lock.json',
                  hunks: [{ oldStart: 9, oldLines: 1, newStart: 9, newLines: 1, lines: ['-      "version": "1.0.0",', '+      "version": "1.0.1",'] }],
                },
              ]
            : []),
        ],
        moreFiles: e.command.includes('many') ? 3 : 0,
      },
    },
    }
  })
  return w
}

export async function turn($: Engine, edits: () => Promise<unknown>, id = 't1', text = 'b를 상수로 바꾸고 새 파일도 만들어줘') {
  await $.turn.start({ text, turnId: id })
  await edits()
  await $.turn.complete({ answer: '바꿨습니다', durationMs: 5, isAborted: false, turnId: id, reason: 'answer' })
}

export async function finish(w: World) {
  await w.clock.advance(5)
  await w.clock.settle()
}

export function learn($: Engine, args: string) {
  return $.command.run({
    command: 'learn',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 160 },
  })
}

export function pane($: Engine, surface: 'terminal' | 'desktop' | 'vscode' = 'terminal', props = PANE_PROPS) {
  return $.ui.mount({ plugin: 'learn-notes', surface, component: 'Pane', requestId: 'learn-notes', props })
}

/**
 * Where the plugin asked the pane to scroll, in order. Nothing beneath answers $.ui.scroll in this kit and a
 * test's on('ui.scroll') is not asked either, so each request shows as the debug line saying why it did not move.
 */
export function scrollsOf(w: World): { key: string; block: string; site: string }[] {
  return w.logs.flatMap(line => {
    const m = /^learn-notes: (\S+) \((\w+), (\S+)\)로 스크롤하지/.exec(line)
    return m ? [{ key: m[1]!, block: m[2]!, site: m[3]! }] : []
  })
}

/**
 * Where the plugin asked the pane's focus ring to go, in order. As with scrolling, nothing beneath answers
 * $.ui.focus in this kit, so each request shows as the debug line saying why it did not move.
 */
export function focusesOf(w: World): string[] {
  return w.logs.flatMap(line => {
    const m = /^learn-notes: (\S+)로 초점을 옮기지 않았습니다/.exec(line)
    return m ? [m[1]!] : []
  })
}

/** Draws the spinner as the fullscreen terminal does, which tells the plugin a pane would dock. */
export async function fullscreen($: Engine, isFullscreen = true) {
  const ui = await $.ui.mount({
    plugin: 'learn-notes',
    surface: 'terminal',
    component: 'Spinner',
    props: { word: 'Thinking', message: null, suffix: '', mode: 'thinking' },
    viewport: { columns: 200, rows: 50, isFullscreen },
  })
  await ui.unmount()
}

export const EDIT_A = { tool: 'Edit', tool_use_id: 'u1', file_path: '/proj/src/a.ts', old_string: 'let', new_string: 'const' } as const
/** EDIT_A's like, its change with a run to follow (1.10.0 G5: the one kind r asks 생각해 보기 of while it is on). */
export const EDIT_FLOW = { tool: 'Edit', tool_use_id: 'u1', file_path: '/proj/src/sum.ts', old_string: 'let', new_string: 'const' } as const

/** /learn save (저장), retired in 1.6.0, as 1.7.0 answers it: a note is saved by itself, and the few most used. */
export const SAVE_REPLY =
  '노트는 저절로 저장됩니다.\n\n자주 쓰는 것: `/learn` 패널 · `/learn 복습` · `/learn 퀴즈` · `/learn 정리` · `/learn 질문 …` · `/learn 기록` · 전체는 `/learn 도움말`'

export const CONCEPT_NOTE = (names: string[]) =>
  [
    '### 한 줄 요약',
    '반복문을 바꿨다',
    '### 배울 개념',
    ...names.map(name => `- **${name}**: ${name}에 대한 설명 — \`for (const item of items)\``),
    '### 직접 확인해 볼 것',
    '- 실행해 보기',
  ].join('\n')

/**
 * Worked examples after two misses running in both branches (1.10.0 G1): a harness's steps as 1.8.0 shipped them, for
 * every concept, met in code or not. `{ workedAfterTimes: 2 }` alone turns the code branch on alone.
 */
export const WORKED_BOTH = { workedAfterTimes: 2, workedPlainAfterTimes: 2 } as const

/**
 * CONCEPT_NOTE with each concept's words quoting a line EDIT_A leaves in a.ts (`const b = 2`): a concept a worked
 * example's code branch asks (1.10.0 G1, workedBranch: its quote on a line of its code, in ts).
 */
export const QUOTED_NOTE = (names: string[]) => CONCEPT_NOTE(names).replaceAll('`for (const item of items)`', '`const b = 2`')

/**
 * `store` with one more concept met in no note and not due for two months (its step copy kept): a worked example is
 * asked only in a quiz of two picks or three (1.10.0 G1, D33 (3)), the shapes its samples measure, so a quiz of one
 * concept takes this one as its second, after it.
 */
export function withFiller(store: Map<string, unknown>, name = '채움'): Map<string, unknown> {
  const concepts = (store.get('concepts') ?? {}) as Record<string, unknown>
  const at = Date.UTC(2026, 9, 3, 1)
  store.set('concepts', { ...concepts, [conceptKey(name)]: { name, count: 1, firstAt: at - 300 * 86_400_000, lastAt: at - 300 * 86_400_000, blurb: `${name} 설명`, files: [], step: 5, reviewedAt: at } })
  store.set('steps', { ...((store.get('steps') ?? {}) as Record<string, unknown>), [conceptKey(name)]: [5, at] })
  return store
}

/** The code metInCode's note wrote (counter.js), and the line of it a concept's words quote. */
export const COUNTER_CODE = ['let c = 10', 'const add = () => ++c', 'console.log(add())']
export const COUNTER_QUOTE = 'const add = () => ++c'

/**
 * `store` with the concept `name` (in its index already) met in code a worked example's code branch asks (1.10.0 G1 ·
 * G4, workedBranch): a ready note of this project, a month old, that wrote counter.js (COUNTER_CODE), the concept's
 * words quoting a line of it (COUNTER_QUOTE), counter.js among its files. Its base (1.10.0 G4) is asked only so.
 * `file` another name for that file (one in a language the code branch does not ask, say).
 */
export function metInCode(store: Map<string, unknown>, name: string, file = 'counter.js'): Map<string, unknown> {
  const at = Date.UTC(2026, 9, 3, 1) - 30 * 86_400_000
  const key = conceptKey(name)
  const one = (store.get('concepts') as Record<string, { blurb: string; files: string[] }>)[key]!
  one.blurb = `${one.blurb} — \`${COUNTER_QUOTE}\``
  if (!one.files.includes(file)) one.files = [...one.files, file]
  const note = {
    id: `code-${key}`,
    turnId: `t-${key}`,
    at,
    prompt: '세는 함수를 만들어 줘',
    answer: '',
    changes: [
      {
        file,
        path: `/proj/${file}`,
        tool: 'Write',
        kind: 'create',
        added: COUNTER_CODE.length,
        removed: 0,
        diff: [`@@ -0,0 +1,${COUNTER_CODE.length} @@`, ...COUNTER_CODE.map(line => `+${line}`)].join('\n'),
        isCut: false,
      },
    ],
    moreFiles: 0,
    status: 'ready',
    text: ['### 한 줄 요약', '세는 함수를 만들었다', '### 배울 개념', `- **${name}**: ${one.blurb}`].join('\n'),
    savedAs: 'ready',
    isPast: true,
    root: '/proj',
    updatedAt: at,
    concepts: [key],
  }
  const history = (store.get('history') ?? {}) as Record<string, { at: number; notes: unknown[] }>
  store.set('history', { ...history, '/proj': { at, notes: [...(history['/proj']?.notes ?? []), note] } })
  return store
}

export function start($: Engine) {
  return $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
}

export const THREE_CONCEPTS = {
  'c:클로저': { name: '클로저', count: 3, firstAt: NOW - 1, lastAt: NOW - 1, blurb: '함수가 바깥 변수를 기억한다', files: [] },
  'c:구조분해': { name: '구조 분해', count: 2, firstAt: NOW - 2, lastAt: NOW - 2, blurb: '배열이나 객체에서 값을 꺼내 이름 붙이기', files: [] },
  'c:map': { name: 'map', count: 4, firstAt: NOW - 3, lastAt: NOW - 3, blurb: '배열의 각 항목을 바꾼 새 배열', files: [] },
}
export const THREE_QUESTIONS = ['Q1: 문제 하나', 'A1: 답 하나', 'Q2: 문제 둘', 'A2: 답 둘', 'Q3: 문제 셋', 'A3: 답 셋'].join('\n')

// The engine under test runs on POSIX, so its fs reads a drive path as relative: the folder is a POSIX one here,
// and Windows paths are covered where shellTargets is tested.
export const DESK = '/home/u/Desktop/cart-total'

/** The PowerShell tool as Claude Code on Windows runs it: here it writes what the command would on the mocked disk. */
export function powershell(on: On, w: World, write: (command: string) => void) {
  on('tool.call', (_$, e) => {
    if ((e.tool as string) !== 'PowerShell') return { result: '' }
    write(String((e as unknown as { command: string }).command))
    return { result: { stdout: '', stderr: '', interrupted: false } }
  })
  return w
}

/**
 * The steps past the first of `index` as 1.6.0 keeps them apart when it writes the index (the store's `steps`), for
 * a fixture whose steps 1.6.0 gave: any other step past the first is read as 1.5's, the first.
 */
export function ownSteps(index: Record<string, { name: string; step?: number; reviewedAt?: number }>): Record<string, [number, number]> {
  return Object.fromEntries(
    Object.values(index).flatMap(one => (one.step !== undefined && one.step > 1 && one.reviewedAt !== undefined ? [[conceptKey(one.name), [one.step, one.reviewedAt]]] : [])),
  )
}

/** The answer field of question `i` in the pane's quiz, keyed by the quiz it belongs to. */
export function mineKey(store: Map<string, unknown>, i: number) {
  return `quiz-mine-${(store.get('quiz') as { at: number }).at}-${i}`
}

/**
 * The answer of the question on show seen before any try, which the pane's a did before 1.7.0 on a surface with a
 * field: now asked for in the conversation, after which the pane offers o and x as it did (1.7.0 D4).
 */
export function seeAnswer($: Engine) {
  return learn($, 'quiz 정답')
}

/** Cells a terminal gives `text`: two for Hangul and the other wide letters, one for the rest. */
export function cells(text: string): number {
  return [...text].reduce((sum, ch) => sum + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u.test(ch) ? 2 : 1), 0)
}

/** Under the pane docked in a 120-column terminal (about 49 cells), with room for a narrower dock. */
export const FIELD_CELLS = 40

export const HINTED_QUESTIONS = ['Q1: 문제 하나', 'H1: 바깥을 떠올려 보세요', 'A1: 답 하나', 'Q2: 문제 둘', 'H2: 둘째 힌트', 'A2: 답 둘'].join('\n')

export const BEFORE_AFTER_NOTE = [
  '### 한 줄 요약',
  'let을 const로 바꿔 값이 다시 바뀌지 않게 했습니다.',
  '### 무엇이 바뀌었나',
  '- 전: `b`에 나중에 다른 값을 넣을 수 있었습니다.',
  '- 후: `b`는 처음 값 그대로입니다.',
  '- 예: `b = 3` → 전: 됨 / 후: 오류',
  '### 배울 개념',
  '- **const**: 다시 대입할 수 없는 변수 — `const b = 2`',
].join('\n')

/**
 * 1.10.0 G7: every kind of model call a window makes, sent by the plugin as it stands, and /learn 진단's text. Run on
 * fca5988 (1.9.0) by a maintainer's capture outside CI (tests/fixtures/route19.ts), and here with every route off.
 */
export const ROUTE_DAY = 86_400_000
export const ROUTE_TEAM = ['# 팀', '', '## 규칙', '- API 호출은 `fetch`를 바로 쓰지 말고 `fetcher`를 쓴다', '', '## 용어', '- **캐시 키**: 요청마다 캐시를 나누는 이름입니다', '- **페이지네이션 커서**: 다음 쪽을 가리키는 값입니다', ''].join('\n')
export const ROUTE_HELLO = ['// 인사', 'function greet(name) {', '  return `안녕하세요, ${name}님!`', '}', ''].join('\n')
export const ROUTE_EXAMPLE = 'return `안녕하세요, ${name || "손"}님!`'
export const ROUTE_NOTE = [
  '### 한 줄 요약',
  '이름을 받아 인사하는 함수를 만들었습니다',
  '### 무엇이 바뀌었나',
  '- 전: 없음',
  '- 후: 이름을 넣어 인사합니다',
  '### 왜 이렇게 바꿨을까',
  '이름마다 인사를 다르게 하려고 만들었습니다.',
  '### 배울 개념',
  '- **템플릿 리터럴**: 문자열 안에 값을 넣습니다 — `${name}`',
  '### 직접 해 보기',
  '- 할 일: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요',
  '- 고칠 줄: `` return `안녕하세요, ${name}님!` ``',
  '- 확인: `greet("")` → "안녕하세요, 손님!"',
  `- 예시 답: \`\` ${ROUTE_EXAMPLE} \`\``,
].join('\n')
export const ROUTE_NUDGED = ['판정: 틀림', '피드백: 그 값은 바깥 변수가 아닙니다.', '되묻기: 안쪽 함수가 다시 불릴 때 count는 어디에 남아 있을까요?', '헷갈린 점: 함수가 끝나면 바깥 변수도 사라진다고 봄', '유형: 변수 범위'].join('\n')
export const ROUTE_RIGHT = '판정: 맞음\n피드백: 정확합니다.'
export const routeQ = (n: number) => [`T${n}: 예측`, `Q${n}: 문제 ${n}`, `A${n}: 답 ${n}`].join('\n')

/**
 * The store the window opens on: 클로저 missed twice running, its base 변수 범위 (a worked example and a base are
 * asked while those are on), 변수 범위 due, for...of 반복문 at step 4 a month on (code never seen's while it is on).
 */
export function routeStore(): Map<string, unknown> {
  const rows: Record<string, { step: number; ago: number; files: string[] }> = {
    클로저: { step: 1, ago: 3, files: ['counter.js'] },
    '변수 범위': { step: 2, ago: 5, files: ['counter.js'] },
    'for...of 반복문': { step: 4, ago: 31, files: ['a.ts'] },
  }
  const concepts = Object.fromEntries(
    Object.entries(rows).map(([name, one]) => [
      conceptKey(name),
      { name, count: 2, firstAt: NOW - 60 * ROUTE_DAY, lastAt: NOW - 60 * ROUTE_DAY, blurb: `${name} 설명`, files: one.files, step: one.step, reviewedAt: NOW - one.ago * ROUTE_DAY },
    ]),
  )
  const slips = {
    [conceptKey('클로저')]: { what: '함수가 끝나면 바깥 변수도 사라진다고 봄', type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * ROUTE_DAY, times: 2, base: conceptKey('변수 범위') },
  }
  return new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)], ['slips', slips]])
}

/** One model call as the plugin asked for it. */
export type RouteCall = { model: string; effort: string | undefined; system: string | undefined; prompt: string; maxTokens: number | undefined; timeoutMs: number | undefined }

/** Each model call's request, in order, caught above the world's answer (any prompt: the world answers model.complete too). Register before `world`. */
export function routeCalls(on: On): RouteCall[] {
  const calls: RouteCall[] = []
  on('model.complete', { prompt: /[\s\S]/ }, async (_$, e, next) => {
    calls.push({ model: e.model, effort: e.effort, system: e.system, prompt: e.prompt, maxTokens: e.maxTokens, timeoutMs: e.timeoutMs })
    return next(e)
  })
  return calls
}

/**
 * A window's day with every kind of call: a note with a team file and a practice, r and e under it, the practice
 * missed and tried again, a question, a review quiz (a try again among its grades), the team's terms, a recap; then
 * /learn 진단. Its calls and the diagnosis. `setup` (a harness, say) and `env` are the world's before it starts.
 */
export async function routeDay($: Engine, on: On, setup: (w: World) => void = () => {}, env: Record<string, string> = {}): Promise<{ calls: RouteCall[]; diag: string; w: World }> {
  const calls = routeCalls(on)
  const store = routeStore()
  const w = world(on, 'ok', null, true, store, env)
  w.files.set('/proj/.claude/learn-notes.md', ROUTE_TEAM)
  setup(w)
  await start($)
  w.answer = ROUTE_NOTE
  await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'h1', file_path: '/proj/src/hello.js', content: ROUTE_HELLO }))
  await finish(w)
  const id = (store.get('history') as Record<string, { notes: { id: string }[] }>)['/proj']!.notes.at(-1)!.id
  const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
  w.answer = '1. `greet("철수")`: "안녕하세요, 철수님!"을 돌려줍니다.'
  await ui.press({ key: 'trace' })
  await w.clock.settle()
  w.answer = '템플릿 리터럴은 글자 사이에 값을 끼워 넣습니다.'
  await ui.press({ key: 'easier' })
  await w.clock.settle()
  await ui.press({ key: 'note-drill' })
  w.answer = ROUTE_NUDGED
  await ui.input({ key: `drill-${id}`, text: 'return 1' })
  await w.clock.settle()
  w.answer = ROUTE_RIGHT
  await ui.input({ key: `drill-${id}-again`, text: 'return `안녕하세요, ${name ? name : "손"}님!`' })
  await w.clock.settle()
  await ui.unmount()
  w.answer = '값을 글자 안에 바로 넣을 수 있어서입니다.'
  await learn($, '질문 왜 템플릿 리터럴을 써요?')
  w.answer = [routeQ(1), routeQ(2), routeQ(3)].join('\n')
  await learn($, '퀴즈 새로')
  w.answer = ROUTE_NUDGED
  await learn($, '퀴즈 1 전역 변수')
  w.answer = ROUTE_RIGHT
  await learn($, '퀴즈 1 안쪽 함수가 count를 기억합니다')
  await learn($, '퀴즈 2 답 2')
  w.answer = [routeQ(1), routeQ(2)].join('\n')
  await learn($, '퀴즈 팀')
  w.answer = '### 한 일\n인사 함수를 만들었다'
  await learn($, '정리')
  const diag = (await learn($, '진단')).text ?? ''
  return { calls, diag, w }
}

/**
 * One change under a note, as a store keeps it, for r's prompt by kind (1.10.0 G5, tests/fixtures/think19.ts): a
 * stylesheet, a document, a data file, a language r asks no 생각해 보기 of, a deletion, a className changed, a
 * constant's value, a Python value, a tool's setup, and code with a run to follow.
 */
export const THINK_CHANGES: Readonly<Record<string, { file: string; kind: 'create' | 'update' | 'delete'; diff: string }>> = {
  css: { file: 'src/styles/main.css', kind: 'update', diff: '@@ -1,3 +1,3 @@\n .btn {\n-  color: blue;\n+  color: red;\n }' },
  md: { file: 'README.md', kind: 'update', diff: '@@ -1,2 +1,2 @@\n-# 앱\n+# 할 일 앱\n 설명입니다.' },
  json: { file: 'package.json', kind: 'update', diff: '@@ -1,4 +1,4 @@\n {\n   "name": "app",\n-  "version": "1.0.0"\n+  "version": "1.1.0"\n }' },
  go: { file: 'main.go', kind: 'update', diff: '@@ -1,3 +1,6 @@\n func total(n int) int {\n+\tif n < 0 {\n+\t\treturn 0\n+\t}\n \treturn n * 2\n }' },
  deleted: { file: 'src/old.js', kind: 'delete', diff: '@@ -1,3 +0,0 @@\n-function add(a, b) {\n-  return a + b\n-}' },
  className: { file: 'src/Button.jsx', kind: 'update', diff: '@@ -2,3 +2,3 @@\n   return (\n-    <button className="bg-blue-500 px-4">저장</button>\n+    <button className="bg-red-500 px-4">저장</button>\n   )' },
  constant: { file: 'src/limits.js', kind: 'update', diff: '@@ -1,2 +1,2 @@\n-export const MAX_ITEMS = 10\n+export const MAX_ITEMS = 20\n export const MIN_ITEMS = 1' },
  pyValue: { file: 'app/flags.py', kind: 'update', diff: "@@ -1,2 +1,3 @@\n-DEBUG = True\n+DEBUG = False\n+ALLOWED = ['a.com', 'b.com']\n PORT = 8000" },
  setup: { file: 'vite.config.ts', kind: 'update', diff: '@@ -1,3 +1,3 @@\n export default defineConfig({\n-  plugins: [],\n+  plugins: [react()],\n })' },
  code: { file: 'src/cart.js', kind: 'update', diff: "@@ -1,3 +1,6 @@\n function itemTotal(price, qty) {\n+  if (qty < 0) {\n+    throw new Error('수량은 0 이상이어야 합니다')\n+  }\n   return price * qty\n }" },
}

/** A store holding one written note with THINK_CHANGES' change `kind` (and `asks` under it), as any version keeps it. */
export function thinkStore(kind: string, asks?: { question: string; answer: string; at: number }[]): Map<string, unknown> {
  const one = THINK_CHANGES[kind]!
  const lines = one.diff.split('\n')
  const change = {
    file: one.file,
    path: `/proj/${one.file}`,
    tool: one.kind === 'delete' ? 'Bash' : one.kind === 'create' ? 'Write' : 'Edit',
    kind: one.kind,
    added: lines.filter(line => line.startsWith('+')).length,
    removed: lines.filter(line => line.startsWith('-')).length,
    diff: one.diff,
    isCut: false,
  }
  const note = { id: `think-${kind}`, turnId: `think-${kind}`, at: NOW - 60_000, prompt: '수량 검사를 넣어 줘', answer: '', changes: [change], moreFiles: 0, status: 'ready', text: NOTE_TEXT, savedAs: 'ready', ...(asks ? { asks } : {}) }
  return new Map<string, unknown>([['history', { '/proj': { at: NOW, notes: [note] } }]])
}

/**
 * The request r's key sends under THINK_CHANGES' note `kind` (or, with `typed`, the words typed in its question field),
 * the build's switches as `harness` sets them: its system, prompt and output budget.
 */
export async function thinkAsked($: Engine, on: On, kind: string, harness?: Record<string, unknown>, typed?: string): Promise<{ system: string | undefined; prompt: string; maxTokens: number | undefined }> {
  const w = world(on, 'ok', null, true, thinkStore(kind))
  if (harness) w.harness = harness
  await start($)
  const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
  w.answer = '1. `itemTotal(1000, 2)`를 부르면 2000을 돌려줍니다.'
  if (typed === undefined) await ui.press({ key: 'trace' })
  else await ui.input({ key: `ask-think-${kind}`, text: typed })
  await w.clock.settle()
  await ui.unmount()
  return { system: w.systems.at(-1), prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1) }
}
