// Pure helpers: hunks to diff text and back, the prompt for a note, the
// journal's markdown. No `$` here, so tests reach every branch directly.

import type { LearnChange, LearnConcept, LearnDayActivity, LearnNote, LearnQuizItem, LearnSubmit } from '../types'

export type Hunk = {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: string[]
}

/** Characters one change's diff may hold (a Code element takes 10000). */
export const DIFF_BUDGET = 4000
/** Files one note keeps; the rest are counted, not kept. */
export const FILES_PER_NOTE = 12
/** Notes the pane keeps; the journal file keeps every one. */
export const NOTES_KEPT = 40
/** Characters of diff the model reads for one note. */
export const PROMPT_DIFF_BUDGET = 14000
/** A journal past this many bytes rolls over to `-2.md`, `-3.md`: a read takes at most 4 MiB. */
export const JOURNAL_MAX_BYTES = 3_000_000
/** Notes the store keeps per project, and projects it keeps, for the next session's pane. */
export const HISTORY_PER_PROJECT = 30
export const HISTORY_PROJECTS = 12
/** Characters of each diff, and of the note's text, a stored note keeps. */
export const HISTORY_DIFF_BUDGET = 800
export const HISTORY_TEXT_BUDGET = 3000
/** Bytes of JSON the history may take in the store (its limit is 4 MiB for every key together). */
export const HISTORY_MAX_BYTES = 2_000_000
/** Concepts the index keeps; the least recent go first. */
export const CONCEPTS_KEPT = 400
/** Concept names the model is shown so it reuses them. */
export const KNOWN_IN_PROMPT = 120

const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g

/** Drops what a Code or Markdown element refuses: every control but tab and newline. */
export function clean(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(CONTROL, '')
}

export function cut(text: string, max: number): string {
  const flat = clean(text).trim()
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`
}

function header(h: Hunk): string {
  return `@@ -${h.oldStart},${h.oldLines} +${h.newStart},${h.newLines} @@`
}

function counts(lines: readonly string[]): { oldLines: number; newLines: number } {
  let oldLines = 0
  let newLines = 0
  for (const line of lines) {
    if (line.startsWith('+')) newLines += 1
    else if (line.startsWith('-')) oldLines += 1
    else if (line.startsWith('\\')) continue
    else {
      oldLines += 1
      newLines += 1
    }
  }
  return { oldLines, newLines }
}

/** Lines added and removed across hunks. */
export function tally(hunks: readonly Hunk[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const h of hunks) {
    for (const line of h.lines) {
      if (line.startsWith('+')) added += 1
      else if (line.startsWith('-')) removed += 1
    }
  }
  return { added, removed }
}

/** A hunk whose lines lack a marker (a context line that lost its space) gets one. */
function normalise(h: Hunk): Hunk {
  const lines = h.lines.map(line => {
    const flat = clean(line)
    return /^[ +\-\\]/.test(flat) ? flat : ` ${flat}`
  })
  return { ...h, lines }
}

/**
 * The head of a hunk too long to keep whole, the budget split between the
 * old side and the new: a replacement lists every `-` line before its `+`
 * lines, so a plain head would keep the removals and none of the additions.
 * A side out of room skips its lines; the first context line after a skip
 * ends the head, so every line kept still sits where its header says.
 */
function headOf(h: Hunk, budget: number): string[] {
  const room = Math.max(0, budget - 60)
  let oldRoom = room / 2
  let newRoom = room / 2
  // Once a side skips a line it keeps no later one, so its numbering holds.
  let isOldDone = false
  let isNewDone = false
  const kept: string[] = []
  for (const line of h.lines) {
    const size = line.length + 1
    if (line.startsWith('-')) {
      if (!isOldDone && size <= oldRoom) {
        kept.push(line)
        oldRoom -= size
      } else isOldDone = true
    } else if (line.startsWith('+')) {
      if (!isNewDone && size <= newRoom) {
        kept.push(line)
        newRoom -= size
      } else isNewDone = true
    } else if (line.startsWith('\\')) {
      continue
    } else {
      if (isOldDone || isNewDone || size > Math.min(oldRoom, newRoom)) break
      kept.push(line)
      oldRoom -= size
      newRoom -= size
    }
  }
  if (kept.length === 0 && h.lines.length > 0) {
    // One line longer than the budget (minified code): keep its start.
    const first = h.lines[0]!
    kept.push(`${first.slice(0, Math.max(10, room))}…`)
  }
  return kept
}

/**
 * Unified-diff text of `hunks` within `budget` characters: whole hunks while
 * they fit; a first hunk too long alone keeps a head of both sides, its
 * header recounted so the text still parses as a hunk.
 */
export function hunksToDiff(hunks: readonly Hunk[], budget = DIFF_BUDGET): { diff: string; isCut: boolean } {
  const parts: string[] = []
  let used = 0
  let isCut = false
  for (const raw of hunks) {
    const h = normalise(raw)
    const text = `${header(h)}\n${h.lines.join('\n')}`
    if (used + text.length + 1 <= budget) {
      parts.push(text)
      used += text.length + 1
      continue
    }
    isCut = true
    if (parts.length > 0) break
    const kept = headOf(h, budget)
    if (kept.length > 0) {
      const { oldLines, newLines } = counts(kept)
      parts.push(`${header({ ...h, oldLines, newLines })}\n${kept.join('\n')}`)
    }
    break
  }
  return { diff: parts.join('\n'), isCut }
}

/** Hunks read back from diff text (what `hunksToDiff` wrote). */
export function parseDiff(diff: string): Hunk[] {
  const hunks: Hunk[] = []
  let current: Hunk | undefined
  for (const line of diff.split('\n')) {
    const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line)
    if (m) {
      current = {
        oldStart: Number(m[1]),
        oldLines: m[2] === undefined ? 1 : Number(m[2]),
        newStart: Number(m[3]),
        newLines: m[4] === undefined ? 1 : Number(m[4]),
        lines: [],
      }
      hunks.push(current)
    } else if (current && line !== '') {
      current.lines.push(line)
    }
  }
  return hunks
}

/**
 * The hunk narrowed to its changed lines and `context` lines around them,
 * its starts moved to match: what the before/after view shows.
 */
export function focus(h: Hunk, context = 1): Hunk {
  const isChange = (line: string) => line.startsWith('+') || line.startsWith('-')
  const first = h.lines.findIndex(isChange)
  if (first === -1) return h
  let last = first
  h.lines.forEach((line, i) => {
    if (isChange(line)) last = i
  })
  const from = Math.max(0, first - context)
  const to = Math.min(h.lines.length, last + context + 1)
  const dropped = h.lines.slice(0, from)
  const { oldLines: oldSkip, newLines: newSkip } = counts(dropped)
  const lines = h.lines.slice(from, to)
  const { oldLines, newLines } = counts(lines)
  return { oldStart: h.oldStart + oldSkip, oldLines, newStart: h.newStart + newSkip, newLines, lines }
}

/** A hunk as two code blocks: the lines before the change and after it. */
export function beforeAfter(h: Hunk): { before: string; after: string } {
  const before: string[] = []
  const after: string[] = []
  for (const line of h.lines) {
    const body = line.slice(1)
    if (line.startsWith('+')) after.push(body)
    else if (line.startsWith('-')) before.push(body)
    else if (line.startsWith('\\')) continue
    else {
      before.push(body)
      after.push(body)
    }
  }
  return { before: before.join('\n'), after: after.join('\n') }
}

/** A new file's whole text as one all-added hunk. */
export function creationHunk(content: string): Hunk {
  const body = clean(content).replace(/\n$/, '')
  const lines = body === '' ? [] : body.split('\n').map(line => `+${line}`)
  return { oldStart: 0, oldLines: 0, newStart: 1, newLines: lines.length, lines }
}

function slashed(path: string): string {
  return path.replace(/\\/g, '/')
}

/** `path` relative to `root` when it lies inside it; either separator. */
export function relative(path: string, root: string | undefined): string {
  if (!root) return path
  const p = slashed(path)
  const r = slashed(root).replace(/\/+$/, '')
  return p.startsWith(`${r}/`) ? p.slice(r.length + 1) : path
}

/** True for a path under `dir` (either separator). */
export function isUnder(path: string, dir: string): boolean {
  const d = slashed(dir).replace(/\/+$/, '')
  return d !== '' && slashed(path).startsWith(`${d}/`)
}

/** A change from one tool's hunks; no hunks means the tool could not diff it. */
export function changeOf(args: {
  path: string
  root: string | undefined
  tool: LearnChange['tool']
  kind: LearnChange['kind']
  hunks: readonly Hunk[]
}): LearnChange {
  const { diff, isCut } = hunksToDiff(args.hunks)
  const { added, removed } = tally(args.hunks)
  return {
    file: relative(args.path, args.root),
    path: args.path,
    tool: args.tool,
    kind: args.kind,
    added,
    removed,
    diff,
    isCut: isCut || args.hunks.length === 0,
  }
}

/**
 * `changes` with `next` folded in: a file already there gains its hunks
 * (the diff re-cut to the budget), a new file joins while there is room;
 * one past the room is named in `dropped`.
 */
export function merge(
  changes: readonly LearnChange[],
  next: LearnChange,
): { changes: LearnChange[]; dropped?: string } {
  const at = changes.findIndex(one => one.path === next.path)
  if (at === -1) {
    if (changes.length >= FILES_PER_NOTE) return { changes: [...changes], dropped: next.path }
    return { changes: [...changes, next] }
  }
  const prior = changes[at]!
  // A file made this turn and changed again is still a new file: one hunk of what it holds now.
  if (prior.kind === 'create' && next.kind !== 'delete' && !prior.isCut && !next.isCut) {
    const content = parseDiff(prior.diff).flatMap(h => h.lines.filter(line => line.startsWith('+')).map(line => line.slice(1)))
    const now = applyHunks(content, parseDiff(next.diff))
    if (now) {
      const { diff, isCut } = hunksToDiff([creationHunk(now.join('\n'))])
      const made: LearnChange = { ...prior, tool: next.tool, kind: 'create', added: now.length, removed: 0, diff, isCut }
      return { changes: changes.map((one, i) => (i === at ? made : one)) }
    }
  }
  const hunks = [...parseDiff(prior.diff), ...parseDiff(next.diff)]
  const { diff, isCut } = hunksToDiff(hunks)
  const kind = prior.kind === 'create' && next.kind !== 'delete' ? 'create' : next.kind
  const joined: LearnChange = {
    ...prior,
    tool: next.tool,
    kind,
    added: prior.added + next.added,
    removed: prior.removed + next.removed,
    diff,
    isCut: prior.isCut || next.isCut || isCut,
  }
  return { changes: changes.map((one, i) => (i === at ? joined : one)) }
}

/** `lines` with unified-diff hunks applied, or undefined when a hunk's old lines are not where it says. */
export function applyHunks(lines: readonly string[], hunks: readonly Hunk[]): string[] | undefined {
  const out: string[] = []
  let at = 0
  for (const h of [...hunks].sort((a, b) => a.oldStart - b.oldStart)) {
    // A hunk that only adds says "after line oldStart"; any other starts at that line.
    const start = h.oldLines === 0 ? h.oldStart : h.oldStart - 1
    if (start < at || start > lines.length) return undefined
    out.push(...lines.slice(at, start))
    at = start
    for (const row of h.lines) {
      if (row.startsWith('\\')) continue
      const text = row.slice(1)
      if (row[0] === '+') {
        out.push(text)
      } else if (row[0] === ' ' || row[0] === '-') {
        if (lines[at] !== text) return undefined
        if (row[0] === ' ') out.push(text)
        at += 1
      } else {
        return undefined
      }
    }
  }
  return [...out, ...lines.slice(at)]
}

/**
 * True for a git command that moves content in or back (a stash, a checkout,
 * a pull): what it changes on disk is not an edit anyone made this turn.
 */
export function isGitMove(command: string): boolean {
  return /(?:^|[\s;&|(])git(?:\s+-[Cc]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+(?:stash|checkout|restore|reset|switch|pull|merge|rebase|cherry-pick|revert|am)\b/.test(command)
}

export type Level = 'beginner' | 'intermediate' | 'advanced'

const LEVEL_TEXT: Record<Level, string> = {
  beginner:
    '읽는 사람은 코딩을 막 배우는 입문자다. 전문 용어는 처음 나올 때 괄호 안에 쉬운 말로 풀어 쓰고, 비유를 하나쯤 써도 좋다.',
  intermediate: '읽는 사람은 기본 문법은 아는 중급자다. 개념과 패턴의 이름을 정확히 짚고, 왜 그 방식인지에 무게를 둔다.',
  advanced: '읽는 사람은 숙련자다. 설계 선택, 대안, 트레이드오프, 놓치기 쉬운 위험에 무게를 둔다.',
}

export const SYSTEM = [
  '너는 바이브코딩(AI 코딩 도우미에게 코드를 맡기면서 배우는 방식)을 하는 사람의 코딩 튜터다.',
  '방금 AI 도우미가 한 턴 동안 바꾼 코드의 전후(unified diff)를 보고 학습 노트를 한국어 마크다운으로 쓴다.',
  '근거는 diff, 사용자의 요청, 도우미의 설명 셋뿐이다. 셋 어디에도 없는 의도만 "아마 ~일 것이다"처럼 추측임을 밝힌다.',
  '도우미의 설명이 diff와 맞지 않으면 diff를 믿는다. 일부만 실린 파일은 보이는 부분만 말한다.',
  '코드 줄을 인용할 때는 짧게, 백틱으로 감싼다. 코드 안에 백틱이 들어 있으면 그 인용은 백틱 두 개(`` … ``)로 감싼다. 인사말이나 맺음말은 쓰지 않는다.',
].join(' ')

/** A backtick fence longer than any backtick run in `text`, so the text cannot close it. */
export function fenceFor(text: string): string {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map(run => run.length))
  return '`'.repeat(Math.max(3, longest + 1))
}

function changeLabel(change: LearnChange): string {
  const cutNote = change.diff === '' ? ', 파일이 커서 diff를 만들지 못함' : change.isCut ? ', 길어서 앞부분만 실음' : ''
  return `${kindText(change.kind)}, +${change.added} −${change.removed}${cutNote}`
}

/** Each changed file as a heading and its diff, as many as fit in `budget`, then what was left out. */
function diffBlocks(note: Pick<LearnNote, 'changes' | 'moreFiles'>, budget: number): string[] {
  const files: string[] = []
  const skipped: string[] = []
  let used = 0
  for (const change of note.changes) {
    const fence = fenceFor(change.diff)
    const body = change.diff === '' ? '(diff 없음)' : `${fence}diff\n${change.diff}\n${fence}`
    const block = `### ${change.file} (${changeLabel(change)})\n${body}`
    if (used + block.length > budget) {
      skipped.push(change.file)
      continue
    }
    files.push(block)
    used += block.length
  }
  return [
    ...files,
    ...(skipped.length > 0 ? [`(diff를 싣지 못한 파일: ${skipped.join(', ')})`] : []),
    ...(note.moreFiles > 0 ? [`(그 밖에 파일 ${note.moreFiles}개가 더 바뀌었지만 여기엔 싣지 않았다)`] : []),
  ]
}

/** For a note asked to be easier (e in the pane): the words a learner who got lost needs. */
const EASIER_TEXT =
  '이번에는 앞서 쓴 노트가 어려웠다는 요청이다. 문장을 짧게 끊고, 전문 용어는 하나도 빼지 말고 일상어로 풀어 쓰고, 배울 개념마다 일상의 비유를 하나씩 들어라. 코드 인용은 그대로 둔다.'

/** The one user message the model reads for a note; `isEasier` asks for the plainest words and an everyday comparison per concept. */
export function notePrompt(
  note: Pick<LearnNote, 'prompt' | 'answer' | 'changes' | 'moreFiles'>,
  level: Level,
  known: readonly string[] = [],
  isEasier = false,
): string {
  return [
    LEVEL_TEXT[level],
    ...(isEasier ? [EASIER_TEXT] : []),
    '',
    '## 사용자의 요청',
    note.prompt === '' ? '(요청 문장 없음)' : cut(note.prompt, 1500),
    '',
    '## 도우미의 마지막 설명',
    note.answer === '' ? '(설명 없음)' : cut(note.answer, 1500),
    '',
    '## 바뀐 코드',
    ...diffBlocks(note, PROMPT_DIFF_BUDGET),
    '',
    ...(known.length > 0
      ? [
          '## 이미 배운 개념 (지난 노트들에서)',
          known.join(', '),
          '이번 diff의 개념이 위 목록에 있으면 이름을 글자 그대로 쓰고 이름 뒤에 (복습)을 붙여라. 목록에 없는 개념만 새 이름을 지어라.',
          '',
        ]
      : []),
    '아래 다섯 제목을 이 순서 그대로 쓰고, 다 합쳐 350단어를 넘기지 마라.',
    '### 한 줄 요약',
    '### 무엇이 바뀌었나',
    '(파일별로 "전 → 후"를 한두 줄씩)',
    '### 왜 이렇게 바꿨을까',
    '### 배울 개념',
    '(1~3개. "- **개념 이름**: 설명 — 그 개념이 쓰인 코드 한 줄을 백틱으로 인용". 줄 번호는 쓰지 마라)',
    '### 직접 확인해 볼 것',
    '(실행하거나 바꿔 보며 확인할 수 있는 것 1~2개)',
  ].join('\n')
}

export const ASK_SYSTEM = [
  '너는 바이브코딩(AI 코딩 도우미에게 코드를 맡기면서 배우는 방식)을 하는 사람의 코딩 튜터다.',
  '학습자가 학습 노트를 읽다가 질문했다. 노트와 그 노트의 코드 전후(diff)를 근거로 한국어로 답한다.',
  '질문에 바로 답하고, 필요하면 짧은 예시 코드를 하나 보인다. 노트와 diff에 없는 것은 일반론이라고 밝힌다. 200단어를 넘기지 않는다.',
  '코드는 백틱으로 감싸고, 코드 안에 백틱이 들어 있으면 그 인용은 백틱 두 개(`` … ``)로 감싼다. 인사말이나 맺음말은 쓰지 않는다.',
].join(' ')

/** The one user message the model reads for /learn ask: the question, then the note and its code. */
export function askPrompt(note: Pick<LearnNote, 'prompt' | 'text' | 'status' | 'changes' | 'moreFiles'>, question: string, level: Level): string {
  return [
    LEVEL_TEXT[level],
    '',
    '## 학습자의 질문',
    cut(question, 1000),
    '',
    '## 그 노트의 요청',
    note.prompt === '' ? '(요청 문장 없음)' : cut(note.prompt, 1000),
    '',
    '## 학습 노트',
    note.status === 'ready' ? cut(note.text, 4000) : '(노트가 아직 없다. 코드 전후만 보고 답한다)',
    '',
    '## 바뀐 코드',
    ...diffBlocks(note, PROMPT_DIFF_BUDGET),
  ].join('\n')
}

/** A /learn ask question and its answer as a journal section; not a note, so day contents and recaps pass over it. */
export function askSection(note: Pick<LearnNote, 'at' | 'prompt'>, question: string, answer: string, at: number): string {
  return [
    `## ${stamp(at).day} 질문 (${stamp(at).time})`,
    '',
    `**노트**: ${stamp(note.at).day} ${stamp(note.at).time} · ${note.prompt === '' ? '(요청 없음)' : cut(note.prompt.replace(/\s+/g, ' '), 120)}`,
    '',
    `**물음**: ${cut(question.replace(/\s+/g, ' '), 400)}`,
    '',
    answer,
    '',
    '---',
    '',
  ].join('\n')
}

export function kindText(kind: LearnChange['kind']): string {
  return kind === 'create' ? '새 파일' : kind === 'delete' ? '삭제' : '수정'
}

/** The note's one-line summary: the first line under its first heading. */
export function summaryOf(text: string): string {
  const lines = text.split('\n').map(line => line.trim())
  const at = lines.findIndex(line => /^#{1,4}\s*한 줄 요약/.test(line))
  const pool = at === -1 ? lines : lines.slice(at + 1)
  const first = pool.find(line => line !== '' && !line.startsWith('#'))
  return first === undefined ? '' : cut(first.replace(/^[-*]\s*/, ''), 120)
}

const API_ERROR_TEXT: Record<string, string> = {
  overloaded: '서버가 붐빕니다',
  rate_limit: '요청 한도에 걸렸습니다',
  authentication_failed: '로그인이 필요합니다',
}

/** Why a note could not be written, in words a learner can act on. */
export function failureText(reply: { reason: string; status?: number | null; error?: string }): string {
  if (reply.reason === 'api-error') {
    const known = reply.error === undefined ? undefined : API_ERROR_TEXT[reply.error]
    return `${known ?? `API 오류${reply.status ? ` ${reply.status}` : ''}`} · 잠시 뒤 [다시 쓰기]`
  }
  if (reply.reason === 'empty-reply') return '모델이 빈 답을 보냈습니다 · [다시 쓰기]'
  if (reply.reason === 'aborted') return '중단됐습니다 (시간 초과 또는 모드 다시 불러오기) · [다시 쓰기]'
  return reply.reason
}

/** `ms` as local `YYYY-MM-DD` and `HH:MM`. */
export function stamp(ms: number): { day: string; time: string } {
  const d = new Date(ms)
  const two = (n: number) => String(n).padStart(2, '0')
  return {
    day: `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`,
    time: `${two(d.getHours())}:${two(d.getMinutes())}`,
  }
}

/** `dir` with a leading `~` read as `home`. */
export function expandHome(dir: string, home: string | undefined): string {
  if (home === undefined || !/^~(?=$|[\\/])/.test(dir)) return dir
  return `${home.replace(/[\\/]+$/, '')}${dir.slice(1)}`
}

/** The project's part of a journal file name: the root's last folder, made file-safe (letters of any script kept). */
export function journalProject(root: string): string {
  return (root.split(/[\\/]/).filter(Boolean).at(-1) ?? 'project').replace(/[^\p{L}\p{N}_.-]+/gu, '_')
}

/** A short tag of the whole root (FNV-1a), so two projects with one folder name never share a journal. */
export function rootTag(root: string): string {
  let hash = 0x811c9dc5
  for (const char of root.replace(/\\/g, '/').replace(/\/+$/, '')) {
    hash ^= char.codePointAt(0)!
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(36).padStart(7, '0').slice(-5)
}

/** The journal file for a day and project: `<dir>/<day>_<project>_<tag>[~n].md`. */
export function journalPath(dir: string, ms: number, root: string, part = 1): string {
  const base = dir.replace(/[\\/]+$/, '')
  return `${base}/${stamp(ms).day}_${journalProject(root)}_${rootTag(root)}${part > 1 ? `~${part}` : ''}.md`
}

/** A journal file name of `root`, read back: its day and part, or undefined for another project's file. */
export function journalFileOf(name: string, root: string): { day: string; part: number } | undefined {
  const head = `_${journalProject(root)}_${rootTag(root)}`
  const m = /^(\d{4}-\d{2}-\d{2})(.*?)(?:~(\d+))?\.md$/.exec(name)
  if (!m || m[2] !== head) return undefined
  return { day: m[1]!, part: m[3] === undefined ? 1 : Number(m[3]) }
}

/** The calendar day before `now`'s, as `YYYY-MM-DD` (a daylight-saving day is not 24 hours). */
export function dayBefore(now: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  return stamp(d.getTime()).day
}

/** One note as a journal section. */
export function journalSection(note: LearnNote, isRewrite = false): string {
  const { day, time } = stamp(note.at)
  const files = note.changes.map(c => `\`${c.file}\` (${kindText(c.kind)}, +${c.added} −${c.removed})`)
  const more = note.moreFiles > 0 ? [`그 밖에 파일 ${note.moreFiles}개`] : []
  const body =
    note.status === 'ready'
      ? note.text
      : note.status === 'failed'
        ? `_노트를 쓰지 못했다: ${note.text}_`
        : '_노트 없이 전후 코드만 남겼다._'
  const diffs = note.changes.map(c => {
    if (c.diff === '') return `<details><summary>${c.file}</summary>\n\n_파일이 커서 diff를 만들지 못했다._\n\n</details>`
    const fence = fenceFor(c.diff)
    return `<details><summary>${c.file}${c.isCut ? ' (앞부분만)' : ''}</summary>\n\n${fence}diff\n${c.diff}\n${fence}\n\n</details>`
  })
  return [
    `## ${day} ${time}${isRewrite ? ' (다시 쓴 노트)' : ''}`,
    '',
    `**요청**: ${note.prompt === '' ? '(없음)' : cut(note.prompt, 400)}`,
    '',
    `**바뀐 파일**: ${[...files, ...more].join(' · ')}`,
    '',
    body,
    '',
    ...diffs,
    '',
    '---',
    '',
  ].join('\n')
}

export function journalHeader(root: string, day: string): string {
  return `# 학습 노트 · ${day} · ${root}\n\nClaude Code의 learn-notes 모드가 턴마다 쓴 노트다.\n\n`
}

/** Text cut mid-code gets its inline code closed, so markdown does not run on. */
export function closeTicks(text: string): string {
  const ticks = (text.match(/`/g) ?? []).length
  if (ticks % 2 === 0) return text
  return text.endsWith('…') ? `${text.slice(0, -1)}\`…` : `${text}\``
}

/** The key a concept is counted under: its name without a trailing gloss in parentheses, case, spaces, quotes, dots or dashes. */
export function conceptKey(name: string): string {
  const base = name.replace(/\s*[(（][^()（）]*[)）]\s*$/, '').trim() || name
  return `c:${base.toLowerCase().replace(/[\s()（）"'`.…\-–—_·]+/g, '')}`
}

/** True for a concept-section heading: `### 배울 개념`, `### 4. 배울 개념`, `### 📚 배울 개념`, `**배울 개념**`. */
function isConceptHeading(line: string): boolean {
  return /^(?:#{1,6}\s*|\*\*\s*)(?:\d+[.)]\s*)?[^\p{L}\p{N}]*배울\s*개념/u.test(line)
}

/** True for a line that starts the next section: a heading, a bold-only line, or a bare label ending in a colon. */
function isSectionStart(line: string): boolean {
  return /^#{1,6}\s/.test(line) || /^\*\*[^*]+\*\*[:：]?$/.test(line) || /^[^-*+•\d\s`|>][^:：]{0,30}[:：]$/.test(line)
}

const REVIEW_MARK = /[(\[（［]\s*(?:복습|다시)\s*[)\]）］]/g

/**
 * The concepts a note teaches: the bold names on the top-level lines under its
 * '배울 개념' heading, each with its line. Sub-bullets, code blocks and the
 * next section are not concepts; '(복습)' marks and a trailing colon leave the name.
 */
export function conceptsOf(text: string, max = 160): { key: string; name: string; blurb: string }[] {
  const lines = text.split('\n')
  const start = lines.findIndex(line => isConceptHeading(line.trim()))
  if (start === -1) return []
  const found: { key: string; name: string; blurb: string }[] = []
  let isInCode = false
  for (const raw of lines.slice(start + 1)) {
    const line = raw.trim()
    if (line.startsWith('```') || line.startsWith('~~~')) {
      isInCode = !isInCode
      continue
    }
    if (isInCode || line === '') continue
    if (isSectionStart(line)) break
    // Top level only: a sub-bullet is indented two spaces or more.
    const m = /^ ?(?:[-*+•]|\d+[.)])?\s*\*\*(.+?)\*\*\s*(.*)$/.exec(raw)
    if (!m) continue
    const name = cut(
      m[1]!
        .replace(/[`*]/g, '')
        .replace(REVIEW_MARK, '')
        .replace(/[\s:：.,·—–-]+$/, '')
        .trim(),
      40,
    )
    const key = conceptKey(name)
    if (name === '' || key === 'c:' || found.some(one => one.key === key)) continue
    const blurb = m[2]!
      .replace(/^[*_]*\s*[(\[（［]\s*(?:복습|다시)\s*[)\]）］]\s*[*_]*\s*/, '')
      .replace(/^[:：]\s*/, '')
      .replace(/^[—–-]\s*/, '')
    found.push({ key, name, blurb: closeTicks(cut(blurb, max)) })
  }
  return found
}

function own(index: Readonly<Record<string, LearnConcept>>, key: string): LearnConcept | undefined {
  return Object.prototype.hasOwnProperty.call(index, key) ? index[key] : undefined
}

/** The concept under `key`, only if the index itself holds it (never an inherited property). */
export function conceptAt(index: Readonly<Record<string, LearnConcept>>, key: string): LearnConcept | undefined {
  return own(index, key)
}

/** A concept index read back from the store: bad entries dropped, keys from an older build re-made. */
export function cleanConcepts(raw: unknown, aliases: Readonly<Record<string, string>> = {}): Record<string, LearnConcept> {
  const index: Record<string, LearnConcept> = {}
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return index
  for (const value of Object.values(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue
    const one = value as Partial<LearnConcept>
    if (typeof one.name !== 'string' || one.name === '' || typeof one.count !== 'number' || !(one.count > 0)) continue
    // Under the key its name counts under now, merges followed, so one concept is never two rows.
    const key = resolveKey(aliases, conceptKey(one.name))
    const firstAt = typeof one.firstAt === 'number' ? one.firstAt : 0
    const lastAt = typeof one.lastAt === 'number' ? one.lastAt : firstAt
    const files = Array.isArray(one.files) ? one.files.filter(file => typeof file === 'string').slice(0, 5) : []
    const prior = own(index, key)
    const marks = quizMarks(prior ?? {}, {
      ...(typeof one.reviewedAt === 'number' ? { reviewedAt: one.reviewedAt } : {}),
      ...(typeof one.missedAt === 'number' ? { missedAt: one.missedAt } : {}),
      ...(typeof one.step === 'number' && Number.isFinite(one.step) ? { step: Math.max(0, Math.min(REVIEW_DAYS.length - 1, Math.floor(one.step))) } : {}),
    })
    index[key] = prior
      ? { ...unmarked(prior), count: prior.count + one.count, firstAt: Math.min(prior.firstAt, firstAt), lastAt: Math.max(prior.lastAt, lastAt), ...marks }
      : { name: one.name, count: Math.floor(one.count), firstAt, lastAt, blurb: typeof one.blurb === 'string' ? one.blurb : '', files, ...marks }
  }
  return index
}

/**
 * The index with one note's concepts counted: `taught` adds one each, `untaught`
 * (keys a rewrite of the note no longer names) takes one away. A note older
 * than what the index knows moves neither date forward. The least recent fall
 * out past CONCEPTS_KEPT.
 */
export function countConcepts(
  index: Readonly<Record<string, LearnConcept>>,
  taught: readonly { key: string; name: string; blurb: string; files?: readonly string[] }[],
  untaught: readonly string[],
  at: number,
  files: readonly string[],
): Record<string, LearnConcept> {
  const next: Record<string, LearnConcept> = { ...index }
  for (const key of untaught) {
    const prior = own(next, key)
    if (!prior) continue
    if (prior.count <= 1) delete next[key]
    else next[key] = { ...prior, count: prior.count - 1 }
  }
  for (const one of taught) {
    const prior = own(next, one.key)
    const seen = [...(one.files ?? files), ...(prior?.files ?? [])].filter((file, i, all) => all.indexOf(file) === i).slice(0, 5)
    next[one.key] = prior
      ? {
          ...prior,
          count: prior.count + 1,
          firstAt: Math.min(prior.firstAt, at),
          lastAt: Math.max(prior.lastAt, at),
          blurb: at >= prior.lastAt && one.blurb ? one.blurb : prior.blurb || one.blurb,
          files: seen,
        }
      : { name: one.name, count: 1, firstAt: at, lastAt: at, blurb: one.blurb, files: seen }
  }
  const keys = Object.keys(next)
  if (keys.length > CONCEPTS_KEPT) {
    const order = keys.sort((a, b) => next[a]!.lastAt - next[b]!.lastAt)
    for (const key of order.slice(0, keys.length - CONCEPTS_KEPT)) delete next[key]
  }
  return next
}

export type RankedConcept = LearnConcept & { key: string }

/** Concepts for showing, each with its key: most met first, then the most recent. */
export function rankConcepts(index: Readonly<Record<string, LearnConcept>>): RankedConcept[] {
  return Object.entries(index)
    .map(([key, one]) => ({ ...one, key }))
    .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
}

/** The names the model should reuse: the most recently met first. */
export function knownNames(index: Readonly<Record<string, LearnConcept>>): string[] {
  return Object.values(index)
    .sort((a, b) => b.lastAt - a.lastAt)
    .slice(0, KNOWN_IN_PROMPT)
    .map(one => one.name)
}

const WEEK = 7 * 86_400_000

/**
 * The last seven days: concepts met for the first time in them, and concepts
 * met again in them (a later note taught one already known). One learned on
 * Monday and met again on Tuesday counts in both.
 */
export function progressOf(index: Readonly<Record<string, LearnConcept>>, now: number): { fresh: number; again: number } {
  let fresh = 0
  let again = 0
  for (const one of Object.values(index)) {
    if (one.lastAt < now - WEEK) continue
    if (one.firstAt >= now - WEEK) fresh += 1
    if (one.count > 1 && one.lastAt > one.firstAt) again += 1
  }
  return { fresh, again }
}

/** Days until a concept comes back for review, by its step: a right answer moves it a step on, a wrong one back to the first. */
export const REVIEW_DAYS: readonly number[] = [1, 3, 7, 14, 30, 60]
const DAY = 86_400_000
const TOP_STEP = REVIEW_DAYS.length - 1

/** A concept's review step: the one quizzes gave it, else one more for each time a note met it again. */
export function stepOf(one: LearnConcept): number {
  if (typeof one.step === 'number') return Math.max(0, Math.min(TOP_STEP, Math.floor(one.step)))
  return Math.max(0, Math.min(TOP_STEP, one.count - 1))
}

/** When a concept is due for review: right away after a wrong answer, else its step's days after it was last met. */
export function dueAt(one: LearnConcept): number {
  if (isMissed(one)) return one.missedAt ?? 0
  return lastSeen(one) + REVIEW_DAYS[stepOf(one)]! * DAY
}

/** Every concept due for review now: wrong answers first (the oldest miss first), then the longest overdue. */
export function dueConcepts(index: Readonly<Record<string, LearnConcept>>, now: number): RankedConcept[] {
  const due = rankConcepts(index).filter(one => dueAt(one) <= now)
  const missed = due.filter(isMissed).sort((a, b) => (a.missedAt ?? 0) - (b.missedAt ?? 0))
  const rest = due.filter(one => !isMissed(one)).sort((a, b) => dueAt(a) - dueAt(b))
  return [...missed, ...rest]
}

/** The first few concepts due for review (see dueConcepts). */
export function reviewQueue(index: Readonly<Record<string, LearnConcept>>, now: number, size = 5): RankedConcept[] {
  return dueConcepts(index, now).slice(0, size)
}

/** "오늘", "내일", "3일 뒤", or "2일 지남": when a concept comes up for review, said from `now`. */
export function dueText(one: LearnConcept, now: number): string {
  const days = Math.round((startOfDay(dueAt(one)) - startOfDay(now)) / DAY)
  if (days === 0) return '오늘'
  if (days === 1) return '내일'
  return days > 0 ? `${days}일 뒤` : `${-days}일 지남`
}

function startOfDay(ms: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** True while the learner's last answer to its quiz question was wrong: a later quiz that goes over it clears this. */
export function isMissed(one: LearnConcept): boolean {
  return typeof one.missedAt === 'number'
}

/** When the learner last met a concept: in a note, or going over it in a quiz. */
export function lastSeen(one: LearnConcept): number {
  return Math.max(one.lastAt, one.reviewedAt ?? 0)
}

/** A note as the store keeps it for later sessions: text and diffs cut down. */
export function forHistory(note: LearnNote): LearnNote {
  return {
    ...note,
    prompt: cut(note.prompt, 600),
    answer: cut(note.answer, 600),
    text: note.status === 'ready' ? closeTicks(cut(note.text, HISTORY_TEXT_BUDGET)) : note.text,
    changes: note.changes.map(change => {
      if (change.diff.length <= HISTORY_DIFF_BUDGET) return change
      const { diff } = hunksToDiff(parseDiff(change.diff), HISTORY_DIFF_BUDGET)
      return { ...change, diff, isCut: true }
    }),
  }
}

/** UTF-8 bytes of a value as JSON, the measure the store's limit is kept under here. */
export function jsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

export type HistoryEntry = { at: number; notes: LearnNote[]; clearedAt?: number }

/**
 * History cut to `budget` bytes: other projects go first, the least recent
 * first; then the oldest notes of `keep` (the project in use).
 */
export function fitHistory(history: Record<string, HistoryEntry>, keep: string, budget = HISTORY_MAX_BYTES): Record<string, HistoryEntry> {
  const next: Record<string, HistoryEntry> = { ...history }
  for (let guard = 0; guard < 1000 && jsonBytes(next) > budget; guard += 1) {
    const others = Object.entries(next)
      .filter(([root]) => root !== keep)
      .sort((a, b) => a[1].at - b[1].at)
    if (others.length > 0) {
      delete next[others[0]![0]]
      continue
    }
    const mine = next[keep]
    if (!mine || mine.notes.length === 0) break
    next[keep] = { ...mine, notes: mine.notes.slice(1) }
  }
  return next
}

/** `at` as "HH:MM" today, "MM-DD HH:MM" another day of this year, else the whole date. */
export function when(at: number, now: number): string {
  const a = stamp(at)
  const n = stamp(now)
  if (a.day === n.day) return a.time
  return a.day.slice(0, 4) === n.day.slice(0, 4) ? `${a.day.slice(5)} ${a.time}` : `${a.day} ${a.time}`
}

function cell(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim()
}

/** The concept index as a markdown table, the most met first. */
export function conceptsMarkdown(index: Readonly<Record<string, LearnConcept>>): string {
  const rows = rankConcepts(index).map(
    one =>
      `| ${cell(one.name)} | ${one.count} | ${stamp(one.firstAt).day} | ${stamp(one.lastAt).day} | ${cell(one.blurb)} | ${cell(baseNames(one.files).join(', '))} |`,
  )
  return [
    '# 내가 배운 개념',
    '',
    'Claude Code의 learn-notes 모드가 학습 노트에서 모은 개념이다. 여러 번 만난 개념이 위에 온다.',
    '',
    '| 개념 | 만난 횟수 | 처음 | 마지막 | 설명 | 최근 파일 |',
    '| --- | ---: | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
}

/** Notes that mention `query` in the request, the note, a file or a concept, the newest first. */
export function searchNotes(
  list: readonly LearnNote[],
  query: string,
  aliases: Readonly<Record<string, string>> = {},
): LearnNote[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []
  const key = resolveKey(aliases, conceptKey(query))
  return list
    .filter(
      note =>
        note.prompt.toLowerCase().includes(needle) ||
        (note.status === 'ready' && note.text.toLowerCase().includes(needle)) ||
        note.changes.some(change => change.file.toLowerCase().includes(needle)) ||
        note.concepts.some(one => resolveKey(aliases, one) === key),
    )
    .sort((a, b) => b.at - a.at)
}

/** One note as a line: when, which project, the first file, and its summary (or request). */
export function noteLine(note: LearnNote, now: number): string {
  const project = note.root.split(/[\\/]/).filter(Boolean).at(-1) ?? note.root
  const file = note.changes[0]?.file ?? ''
  const more = note.changes.length + note.moreFiles > 1 ? ` 외 ${note.changes.length + note.moreFiles - 1}개` : ''
  const about = (note.status === 'ready' ? summaryOf(note.text) : '') || cut(note.prompt.replace(/\s+/g, ' '), 80)
  return `${when(note.at, now)} · ${project} · ${file}${more} — ${about}`
}

/**
 * A journal day read back as a contents list: each note's time, request and
 * one-line summary. A rewritten note's later section replaces its earlier one
 * and says so; only note headings split the day (a note's own `##` does not).
 */
export function journalIndex(markdown: string): { time: string; request: string; summary: string; isRewrite: boolean }[] {
  const found: { time: string; request: string; summary: string; isRewrite: boolean }[] = []
  const sections = markdown.split(/^## (?=\d{4}-\d{2}-\d{2} \d{2}:\d{2})/m).slice(1)
  for (const section of sections) {
    const head = /^\d{4}-\d{2}-\d{2} (\d{2}:\d{2})(.*)$/m.exec(section)
    if (!head) continue
    const request = cut(/^\*\*요청\*\*:\s*(.*)$/m.exec(section)?.[1]?.trim() ?? '', 80)
    const summary = /^#{1,4}\s*한 줄 요약/m.test(section) ? summaryOf(section) : ''
    const entry = { time: head[1]!, request, summary, isRewrite: head[2]!.includes('다시 쓴 노트') }
    const same = found.findIndex(one => one.time === entry.time && one.request === entry.request)
    if (same !== -1 && entry.isRewrite) found[same] = entry
    else found.push(entry)
  }
  return found
}

/** `/learn merge` arguments: two concept names around `=`, `=>`, `->`, `→` or `|`. */
export function parseMerge(args: string): { from: string; into: string } | undefined {
  // A separator with spaces around it first, so a name like '화살표 함수 (=>)' keeps its own arrow.
  const spaced = args.split(/\s+(?:=>|->|→|=|\|)\s+/)
  const parts = spaced.length === 2 ? spaced : args.split(/\s*(?:=>|->|→|=|\|)\s*/)
  if (parts.length !== 2) return undefined
  const [from, into] = parts.map(part => part.trim())
  return from && into ? { from, into } : undefined
}

/** The key `key` now counts under, following merges (a chain at most 20 long). */
export function resolveKey(aliases: Readonly<Record<string, string>>, key: string): string {
  let at = key
  for (let i = 0; i < 20 && Object.prototype.hasOwnProperty.call(aliases, at); i += 1) at = aliases[at]!
  return at
}

/**
 * The index with concept `from` folded into `into`: counts added, the earliest
 * first date and the latest last date kept, files joined; `into` keeps its
 * name, or takes `name` when it did not exist yet (a rename).
 */
export function mergeConcepts(
  index: Readonly<Record<string, LearnConcept>>,
  from: string,
  into: string,
  name: string,
): Record<string, LearnConcept> {
  const next: Record<string, LearnConcept> = { ...index }
  const a = conceptAt(next, from)
  if (!a || from === into) return next
  const b = conceptAt(next, into)
  delete next[from]
  next[into] = b
    ? {
        ...unmarked(b),
        count: a.count + b.count,
        firstAt: Math.min(a.firstAt, b.firstAt),
        lastAt: Math.max(a.lastAt, b.lastAt),
        blurb: b.lastAt >= a.lastAt ? b.blurb || a.blurb : a.blurb || b.blurb,
        files: [...b.files, ...a.files].filter((file, i, all) => all.indexOf(file) === i).slice(0, 5),
        ...quizMarks(a, b),
      }
    : { ...a, name }
  return next
}

/**
 * Origins whose text is a request of its own: a person at the terminal, over
 * Remote Control, a chat channel or Slack, the SDK host's own turn, a
 * schedule's stored prompt, or a coordinating session's hand-off to a worker.
 */
const REQUEST_ORIGINS = new Set(['composer', 'bridge', 'sdk', 'channel', 'slack-ping', 'scheduled-trigger', 'coordinator', 'projects-relay'])

/** True when a prompt from this origin is a request, not a notification or a peer's report; no origin is the person's own. */
export function isRequestOrigin(origin: { kind: string; asUser?: boolean } | undefined): boolean {
  if (!origin) return true
  return REQUEST_ORIGINS.has(origin.kind) || (origin.kind === 'plugin' && origin.asUser === true)
}

/** How many entered prompts are remembered for the turns they start. */
export const SUBMITS_KEPT = 10

/** The remembered prompts with one more: the newest last, each text once. */
export function rememberSubmit(list: readonly LearnSubmit[], one: LearnSubmit): LearnSubmit[] {
  return [...list.filter(other => other.text !== one.text), one].slice(-SUBMITS_KEPT)
}

/**
 * The request a turn's note shows. A turn a notification or another session
 * started has no request of its own: it carries on the last real one. A turn
 * whose prompt was never seen entering is taken as a request.
 */
export function turnRequest(text: string, submitted: readonly LearnSubmit[], lastRequest: string | undefined): string {
  const seen = submitted.findLast(one => one.text === text)
  if (!seen || seen.isRequest) return cut(text, 2000)
  return lastRequest ? `(이어서) ${cut(lastRequest, 2000)}` : '(알림으로 시작한 턴)'
}

function squash(text: string): string {
  return text.replace(/\s+/g, '')
}

/** File names without their folders, each once. */
export function baseNames(files: readonly string[]): string[] {
  return files.map(file => file.split(/[\\/]/).at(-1) ?? file).filter((name, i, all) => all.indexOf(name) === i)
}

/**
 * The files a concept was seen in: those whose code before or after the
 * change holds code its explanation quotes, spaces ignored and a quote cut at
 * `...` or `…` matched piece by piece in order; else the note's first file.
 * Pieces under four characters (`x`, `if`) say nothing about where they are.
 */
export function filesFor(line: string, changes: readonly LearnChange[]): string[] {
  const quotes = [...line.matchAll(/``(.+?)``|`([^`]+)`/g)]
    .map(m => (m[1] ?? m[2]!).split(/\.\.\.|…/).map(squash).filter(piece => piece.length >= 4))
    .filter(pieces => pieces.length > 0)
  const holds = (code: string, pieces: readonly string[]) => {
    let at = 0
    for (const piece of pieces) {
      const found = code.indexOf(piece, at)
      if (found === -1) return false
      at = found + piece.length
    }
    return true
  }
  const sides = changes.map(change => {
    const lines = change.diff.split('\n').filter(row => !row.startsWith('@@') && !row.startsWith('\\'))
    const side = (mark: string) => squash(lines.filter(row => row[0] === ' ' || row[0] === mark).map(row => row.slice(1)).join('\n'))
    return [side('-'), side('+')]
  })
  const matches = quotes.map(pieces => changes.filter((_, i) => sides[i]!.some(code => holds(code, pieces))))
  // A quote every changed file holds (`const`) tells nothing when another quote narrows it down.
  const telling = matches.filter(found => found.length > 0 && (changes.length === 1 || found.length < changes.length))
  const chosen = telling.length > 0 ? telling : matches.filter(found => found.length > 0)
  const hits = changes.filter(change => chosen.some(found => found.includes(change)))
  return (hits.length > 0 ? hits : changes.slice(0, 1)).map(change => change.file)
}

export type RecapRange = { label: string; from: number; to: number; days: string[] }

/** One note as a recap reads it: from the journal, or from a note not in the journal yet. */
export type RecapEntry = {
  day: string
  time: string
  request: string
  summary: string
  files: string[]
  concepts: { key: string; name: string }[]
}

/**
 * The days `/learn recap` covers: 오늘 (default) · 어제 · 이번 주 (Monday to
 * today) · 최근 7일 · a YYYY-MM-DD. Every day boundary goes back through the
 * day's start, so a day whose midnight a clock change skips still starts
 * where that day starts.
 */
export function recapRange(arg: string, now: number): RecapRange | undefined {
  const word = arg.trim().toLowerCase().replace(/\s+/g, '')
  const startOf = (ms: number) => {
    const d = new Date(ms)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  const shift = (ms: number, days: number) => {
    const d = new Date(ms)
    d.setDate(d.getDate() + days)
    return startOf(d.getTime())
  }
  const span = (label: string, from: number, to: number): RecapRange => {
    const days: string[] = []
    for (let at = from; at < to; at = shift(at, 1)) days.push(stamp(at).day)
    return { label, from, to, days }
  }
  const today = startOf(now)
  if (word === '' || word === '오늘' || word === 'today') return span('오늘', today, shift(today, 1))
  if (word === '어제' || word === 'yesterday') return span('어제', shift(today, -1), today)
  if (word === '이번주' || word === 'week' || word === 'thisweek') {
    return span('이번 주', shift(today, -((new Date(today).getDay() + 6) % 7)), shift(today, 1))
  }
  if (word === '최근7일' || word === '7일' || word === '일주일' || word === 'last7days') return span('최근 7일', shift(today, -6), shift(today, 1))
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(word)
  if (!m) return undefined
  const from = startOf(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12).getTime())
  if (stamp(from).day !== word) return undefined
  return span(word, from, shift(from, 1))
}

/** Noon of a YYYY-MM-DD day in local time: a moment surely inside that day. */
export function dayNoon(day: string): number {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y!, m! - 1, d!, 12).getTime()
}

/**
 * The notes a journal file holds, as a recap reads them, in file order; a
 * rewrite replaces the note it rewrote, and a recap section is not a note.
 */
export function journalEntries(markdown: string): RecapEntry[] {
  const found: { entry: RecapEntry; isRewrite: boolean }[] = []
  for (const section of markdown.split(/^## (?=\d{4}-\d{2}-\d{2} )/m).slice(1)) {
    const head = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(.*)/.exec(section)
    if (!head) continue
    const body = section.split(/^<details>/m)[0]!
    const fileLine = /^\*\*바뀐 파일\*\*:\s*(.*)$/m.exec(body)?.[1] ?? ''
    const entry: RecapEntry = {
      day: head[1]!,
      time: head[2]!,
      request: cut(/^\*\*요청\*\*:\s*(.*)$/m.exec(body)?.[1]?.trim() ?? '', 160),
      summary: /^#{1,4}\s*한 줄 요약/m.test(body) ? summaryOf(body) : '',
      files: baseNames([...fileLine.matchAll(/`([^`]+)`/g)].map(m => m[1]!)),
      concepts: conceptsOf(body).map(one => ({ key: one.key, name: one.name })),
    }
    const isRewrite = head[3]!.includes('다시 쓴 노트')
    const same = found.findIndex(one => one.entry.day === entry.day && one.entry.time === entry.time && one.entry.request === entry.request)
    if (same !== -1 && isRewrite) found[same] = { entry, isRewrite }
    else found.push({ entry, isRewrite })
  }
  return found.map(one => one.entry)
}

/** A note still in memory as a recap reads it. */
export function noteEntry(note: LearnNote, index: Readonly<Record<string, LearnConcept>>, aliases: Readonly<Record<string, string>>): RecapEntry {
  const { day, time } = stamp(note.at)
  return {
    day,
    time,
    request: cut(note.prompt.replace(/\s+/g, ' '), 160),
    summary: note.status === 'ready' ? summaryOf(note.text) : '',
    files: baseNames(note.changes.map(change => change.file)),
    concepts: note.concepts
      .map(key => resolveKey(aliases, key))
      .map(key => ({ key, name: conceptAt(index, key)?.name ?? '' }))
      .filter(one => one.name !== ''),
  }
}

/** Concepts the recapped notes taught that the learner had met before the range: what came back. */
export function recapAgain(
  entries: readonly RecapEntry[],
  index: Readonly<Record<string, LearnConcept>>,
  aliases: Readonly<Record<string, string>>,
  from: number,
): LearnConcept[] {
  const keys = new Set(entries.flatMap(entry => entry.concepts.map(one => resolveKey(aliases, one.key))))
  return [...keys].map(key => conceptAt(index, key)).filter((one): one is LearnConcept => one !== undefined && one.firstAt < from)
}

export const RECAP_SYSTEM = [
  '너는 바이브코딩(AI 코딩 도우미에게 코드를 맡기면서 배우는 방식)을 하는 사람의 코딩 튜터다.',
  '그 사람이 정해진 기간에 받은 학습 노트들의 요약을 보고, 기간 전체를 돌아보는 정리를 한국어 마크다운으로 쓴다.',
  '노트에 있는 것만 말한다. 인사말이나 맺음말은 쓰지 않는다.',
  '코드는 백틱(`)으로 감싸고, 코드 안에 백틱이 들어 있으면 그 인용은 백틱 두 개(`` … ``)로 감싼다.',
].join(' ')

/** The one user message the model reads for a recap. */
export function recapPrompt(
  range: RecapRange,
  entries: readonly RecapEntry[],
  index: Readonly<Record<string, LearnConcept>>,
  aliases: Readonly<Record<string, string>>,
  level: Level,
  isPartial = false,
): string {
  const lines = [...entries]
    .sort((a, b) => (`${a.day} ${a.time}` < `${b.day} ${b.time}` ? -1 : `${a.day} ${a.time}` > `${b.day} ${b.time}` ? 1 : 0))
    .map(entry => {
      const names = [...new Set(entry.concepts.map(one => conceptAt(index, resolveKey(aliases, one.key))?.name ?? one.name))]
      return `- ${entry.day} ${entry.time} · 요청: ${entry.request || '(없음)'} · 요약: ${entry.summary || '(노트 없음)'} · 파일: ${entry.files.slice(0, 4).join(', ') || '-'}${names.length > 0 ? ` · 개념: ${names.join(', ')}` : ''}`
    })
  const again = recapAgain(entries, index, aliases, range.from)
  return [
    LEVEL_TEXT[level],
    '',
    `## 기간: ${range.label} (${range.days[0]}${range.days.length > 1 ? ` ~ ${range.days.at(-1)}` : ''})`,
    '',
    `## 노트 ${lines.length}개`,
    ...(isPartial ? ['(일지를 쓰지 않아 이 기간의 앞쪽 노트 일부는 빠졌다)'] : []),
    ...lines.slice(-60),
    ...(lines.length > 60 ? [`(앞의 ${lines.length - 60}개는 줄였다)`] : []),
    '',
    ...(again.length > 0 ? ['## 이 기간에 다시 만난 개념 (예전에 배운 것)', again.map(one => `${one.name} ×${one.count}`).join(', '), ''] : []),
    '아래 네 제목을 이 순서 그대로 쓰고, 다 합쳐 300단어를 넘기지 마라.',
    '### 한 일',
    '(무엇을 만들고 고쳤는지 2~4줄)',
    '### 핵심 개념',
    '(이 기간에 가장 중요했던 개념 3개 이내, 각각 한 줄)',
    '### 헷갈리기 쉬운 것',
    '(노트로 보아 놓치기 쉬운 점 1~2개)',
    '### 다음에 해 볼 것',
    '(직접 손으로 해 보면 좋은 것 1~2개)',
  ].join('\n')
}

/** A recap as a journal section, under the day of the last note it covers. */
export function recapSection(range: RecapRange, text: string, at: number, day: string): string {
  return [`## ${day} 정리 · ${range.label} (${stamp(at).time})`, '', text, '', '---', ''].join('\n')
}

/** Concepts for a quiz: the ones due for a second look first, then the longest unseen; at most `size`. */
export function quizPick(index: Readonly<Record<string, LearnConcept>>, now: number, size = 3): RankedConcept[] {
  const due = reviewQueue(index, now, size)
  const rest = rankConcepts(index)
    .filter(one => !due.some(other => other.key === one.key))
    .sort((a, b) => dueAt(a) - dueAt(b))
  return [...due, ...rest].slice(0, size)
}

export const QUIZ_SYSTEM = [
  '너는 바이브코딩(AI 코딩 도우미에게 코드를 맡기면서 배우는 방식)을 하는 사람의 코딩 튜터다.',
  '그 사람이 전에 배운 개념을 스스로 떠올려 보게 하는 짧은 문제를 한국어로 낸다.',
  '주어진 설명과 코드 안에서만 묻는다. 정답이 하나로 정해지는 문제를 낸다.',
  '코드는 백틱(`)으로 감싸고, 코드 안에 백틱이 들어 있으면 그 인용은 백틱 두 개(`` … ``)로 감싼다.',
].join(' ')

/** The one user message the model reads for a quiz: each concept with what the notes said about it. */
export function quizPrompt(picks: readonly LearnConcept[], level: Level): string {
  return [
    LEVEL_TEXT[level],
    '',
    '## 개념',
    ...picks.map((one, i) => `${i + 1}. ${one.name} — ${one.blurb || '(설명 없음)'}`),
    '',
    `개념마다 문제 하나씩, 위 순서대로 ${picks.length}개를 낸다. 문제에 개념 이름을 그대로 쓰지 말고, 코드나 상황을 보여 주고 묻는다.`,
    '정확히 아래 형식만 쓴다. 다른 말은 쓰지 않는다.',
    'Q1: (문제 한두 문장)',
    'A1: (답 한두 문장)',
    'Q2: …',
    'A2: …',
  ].join('\n')
}

/** Text cut inside a code block gets its closing fence, so it does not swallow what follows. */
function closeFence(text: string): string {
  const fences = text.split('\n').filter(line => /^\s*```/.test(line)).length
  return fences % 2 === 0 ? text : `${text}\n\`\`\``
}

/** One numbered list entry; lines after the first are indented under the number so a code block stays in the entry. */
export function listItem(n: number, text: string): string {
  const pad = ' '.repeat(String(n).length + 2)
  return `${n}. ${text.split('\n').map((line, i) => (i === 0 || line === '' ? line : pad + line)).join('\n')}`
}

/**
 * Questions and answers read back from the model's reply, paired by number
 * with the concepts asked about. A question or answer runs on over the lines
 * after its marker (a code block in it included) until the next marker.
 */
export function parseQuiz(text: string, picks: readonly RankedConcept[]): LearnQuizItem[] {
  const parts = new Map<string, string[]>()
  let current: string[] | undefined
  for (const raw of text.split('\n')) {
    const m = /^\s*(?:\*\*)?([QA])\s*(\d+)\s*(?:\*\*)?\s*[:.)：]\s*(?:\*\*)?\s*(.*)$/i.exec(raw)
    if (m) {
      current = [m[3]!.replace(/\*\*$/, '')]
      parts.set(`${m[1]!.toUpperCase()}${Number(m[2])}`, current)
    } else if (current) {
      current.push(raw)
    }
  }
  const read = (key: string) => {
    const lines = parts.get(key)
    return lines ? closeFence(cut(lines.join('\n').replace(/\n{3,}/g, '\n\n'), 1200)) : ''
  }
  const items: LearnQuizItem[] = []
  picks.forEach((one, i) => {
    const question = read(`Q${i + 1}`)
    const answer = read(`A${i + 1}`)
    if (question && answer) items.push({ key: one.key, name: one.name, question, answer })
  })
  return items
}

/** The index with the quizzed concepts marked as gone over at `at`. */
export function markReviewed(index: Readonly<Record<string, LearnConcept>>, keys: readonly string[], at: number): Record<string, LearnConcept> {
  const next: Record<string, LearnConcept> = { ...index }
  for (const key of keys) {
    const one = conceptAt(next, key)
    if (!one) continue
    // A step a day at most: going over it again the same day (or pressing twice) does not move it on.
    const isSameDay = one.reviewedAt !== undefined && at - one.reviewedAt < DAY / 2
    const step = isSameDay ? stepOf(one) : Math.min(stepOf(one) + 1, TOP_STEP)
    next[key] = { ...unmarked(one), reviewedAt: Math.max(one.reviewedAt ?? 0, at), step }
  }
  return next
}

/** The index with the learner's wrong quiz answers marked, so those concepts come first in the next quiz. */
export function markMissed(index: Readonly<Record<string, LearnConcept>>, keys: readonly string[], at: number): Record<string, LearnConcept> {
  const next: Record<string, LearnConcept> = { ...index }
  for (const key of keys) {
    const one = conceptAt(next, key)
    if (one) next[key] = { ...one, missedAt: at, step: 0 }
  }
  return next
}

/** A concept without its quiz marks, for putting the right ones back. */
function unmarked(one: LearnConcept): LearnConcept {
  const rest = { ...one }
  delete rest.reviewedAt
  delete rest.missedAt
  delete rest.step
  return rest
}

/**
 * One concept's quiz marks out of two copies of it: the later review with its
 * step, and a miss only if it came after that review (its step then the first).
 */
function quizMarks(a: Partial<LearnConcept>, b: Partial<LearnConcept>): Pick<LearnConcept, 'reviewedAt' | 'missedAt' | 'step'> {
  const reviewedAt = Math.max(a.reviewedAt ?? -1, b.reviewedAt ?? -1)
  const missedAt = Math.max(a.missedAt ?? -1, b.missedAt ?? -1)
  const isMiss = missedAt >= 0 && missedAt >= reviewedAt
  // The step goes with the latest review; a miss that review came after took its own step 0 with it.
  const ra = a.reviewedAt ?? -1
  const rb = b.reviewedAt ?? -1
  const later = ra > rb ? a : rb > ra ? b : typeof a.step === 'number' ? a : b
  const step = isMiss ? 0 : later.step
  return {
    ...(reviewedAt >= 0 ? { reviewedAt } : {}),
    ...(isMiss ? { missedAt } : {}),
    ...(typeof step === 'number' ? { step } : {}),
  }
}

/** One day's learning (see LearnDayActivity). */
export type DayActivity = LearnDayActivity

/** Days of activity the store keeps, the newest. */
export const ACTIVITY_DAYS = 120

const isDay = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day)
const count = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0)

/** The newest ACTIVITY_DAYS days of a record. */
function keepLatest(record: Record<string, DayActivity>): Record<string, DayActivity> {
  const days = Object.keys(record).sort().slice(-ACTIVITY_DAYS)
  return Object.fromEntries(days.map(day => [day, record[day]!]))
}

/** The activity record read back from the store: bad days dropped, the newest ACTIVITY_DAYS kept. */
export function cleanActivity(raw: unknown): Record<string, DayActivity> {
  const record: Record<string, DayActivity> = {}
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return record
  for (const [day, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isDay(day) || typeof value !== 'object' || value === null) continue
    const one = value as Partial<DayActivity>
    record[day] = { notes: count(one.notes), right: count(one.right), wrong: count(one.wrong) }
  }
  return keepLatest(record)
}

/** The record with `delta` added on `day`; no count goes below zero. */
export function addActivity(record: Readonly<Record<string, DayActivity>>, day: string, delta: Partial<DayActivity>): Record<string, DayActivity> {
  const prior = Object.prototype.hasOwnProperty.call(record, day) ? record[day]! : { notes: 0, right: 0, wrong: 0 }
  const next = {
    notes: Math.max(0, prior.notes + (delta.notes ?? 0)),
    right: Math.max(0, prior.right + (delta.right ?? 0)),
    wrong: Math.max(0, prior.wrong + (delta.wrong ?? 0)),
  }
  return keepLatest({ ...record, [day]: next })
}

/** A first record made from the notes still kept: each written note on its day. */
export function activityFromNotes(list: readonly Pick<LearnNote, 'at' | 'status'>[]): Record<string, DayActivity> {
  let record: Record<string, DayActivity> = {}
  for (const note of list) if (note.status === 'ready') record = addActivity(record, stamp(note.at).day, { notes: 1 })
  return record
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** `now`'s day and the `n - 1` days before it, the newest first, as `YYYY-MM-DD` with the weekday. */
export function daysBack(now: number, n: number): { day: string; weekday: string }[] {
  const out: { day: string; weekday: string }[] = []
  const d = new Date(now)
  for (let i = 0; i < n; i += 1) {
    out.push({ day: stamp(d.getTime()).day, weekday: WEEKDAYS[d.getDay()]! })
    d.setDate(d.getDate() - 1)
  }
  return out
}

export type LearnStats = {
  /** Days in a row with a note or a graded answer, up to today (or yesterday, while today has none yet). */
  streak: number
  /** The longest such run the record holds. */
  best: number
  isTodayActive: boolean
  /** The last seven days, today included. */
  week: DayActivity
  /** Graded answers in the last thirty days. */
  month: { right: number; wrong: number }
  /** The last seven days, the oldest first. */
  days: { day: string; weekday: string; one: DayActivity }[]
}

const isActive = (one: DayActivity | undefined) => one !== undefined && one.notes + one.right + one.wrong > 0

export function statsOf(record: Readonly<Record<string, DayActivity>>, now: number): LearnStats {
  const at = (day: string) => (Object.prototype.hasOwnProperty.call(record, day) ? record[day] : undefined)
  const back = daysBack(now, ACTIVITY_DAYS + 1)
  const isTodayActive = isActive(at(back[0]!.day))
  let streak = 0
  for (const { day } of back.slice(isTodayActive ? 0 : 1)) {
    if (!isActive(at(day))) break
    streak += 1
  }
  let best = 0
  let run = 0
  for (const { day } of [...back].reverse()) {
    run = isActive(at(day)) ? run + 1 : 0
    best = Math.max(best, run)
  }
  const sum = (days: readonly { day: string }[]) =>
    days.reduce(
      (total, { day }) => {
        const one = at(day)
        return one ? { notes: total.notes + one.notes, right: total.right + one.right, wrong: total.wrong + one.wrong } : total
      },
      { notes: 0, right: 0, wrong: 0 },
    )
  const week = sum(back.slice(0, 7))
  const month = sum(back.slice(0, 30))
  return {
    streak,
    best,
    isTodayActive,
    week,
    month: { right: month.right, wrong: month.wrong },
    days: back
      .slice(0, 7)
      .reverse()
      .map(({ day, weekday }) => ({ day, weekday, one: at(day) ?? { notes: 0, right: 0, wrong: 0 } })),
  }
}

/** One line of the learner's progress: the run of days, the week's notes, the week's quiz answers. */
export function statsLine(stats: LearnStats): string {
  const parts = [
    stats.streak > 0 ? `연속 ${stats.streak}일째${stats.isTodayActive ? '' : ' (오늘도 하면 이어짐)'}` : '오늘 시작해 보세요',
    `최근 7일 노트 ${stats.week.notes}개`,
  ]
  const graded = stats.week.right + stats.week.wrong
  if (graded > 0) parts.push(`퀴즈 ${stats.week.right}/${graded} 맞힘`)
  return parts.join(' · ')
}
