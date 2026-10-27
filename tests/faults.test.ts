import type { LearnSlip } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  DIAG_FAULTS,
  FAULT_DAYS,
  FAULT_FOLD_MS,
  FAULT_MAX_BYTES,
  FAULTS_KEPT,
  addFault,
  appName,
  checkLine,
  cleanFaults,
  diagText,
  type DiagInput,
  type Fault,
  faultCode,
  faultLabel,
  faultLine,
  faultWord,
  faultsOk,
  faultsOkSince,
  fileWhy,
  fitFaults,
  jsonBytes,
  mergeFaults,
  modelCode,
  saveFailText,
  sizeText,
  slipCounts,
  storeFailText,
} from '../hooks/notes'

const DAY = 86_400_000
const HOUR = 3_600_000
const MINUTE = 60_000
const AT = new Date(2026, 9, 13, 13, 57).getTime()

/** A diagnosis input with nothing wrong, as a terminal session in Windows Terminal would give it. */
function input(over: Partial<DiagInput> = {}): DiagInput {
  return {
    now: new Date(2026, 9, 14, 9, 30).getTime(),
    version: '1.7.0',
    engine: '2.1.296',
    surfaces: ['terminal'],
    pane: { placement: 'dock', columns: 56 },
    isPaneFocused: false,
    terminal: { columns: 132, isFullscreen: true },
    apps: ['Windows Terminal'],
    settings: {
      isAutoNote: true,
      model: 'haiku',
      dailyAutoNotes: 40,
      level: 'beginner',
      isAutoSave: true,
      isAutoOpen: true,
      saveDir: 'default',
      hasFolder: true,
      excluded: 0,
      locked: ['dailyAutoNotes'],
    },
    today: { notes: 3, calls: 7 },
    store: { bytes: 2_411_725, keys: [{ key: 'history', bytes: 1_258_291 }] },
    unsaved: 0,
    faults: [],
    ...over,
  }
}

describe('1.7.0: faults kept as codes, and /learn 진단 made of them', () => {
  test('an OS refusal is kept as its errno alone: the path and the words in its message are not', () => {
    expect(faultCode(new Error("HooksError: learn-notes: $.fs.write: ENOSPC: no space left on device, open '/home/u/.claude/learning-notes/x.md'"))).toBe('ENOSPC')
    expect(faultCode({ code: 'EBUSY', message: 'resource busy or locked' })).toBe('EBUSY')
    expect(faultCode('EPERM: operation not permitted, open C:\\Users\\u\\notes.md')).toBe('EPERM')
    expect(faultCode(new Error('$.fs.write: a network location is not reached from here'))).toBe('network')
    // A word in capitals that is no errno is not taken for one.
    expect(faultCode(new Error('ERROR: EVERYTHING failed'))).toBe('error')
    expect(faultCode(new Error('read over 4 MiB'))).toBe('too-big')
    expect(faultCode(new Error('store over 4 MiB'), 'store')).toBe('store-full')
    expect(faultCode(new Error('refused'), 'store')).toBe('store-reject')
    expect(faultCode(new Error('EACCES: permission denied'), 'store')).toBe('EACCES')
  })

  test('a model call that brought no answer is kept as its kind and status, never its text', () => {
    expect(modelCode({ reason: 'api-error', status: 529, error: 'overloaded' })).toBe('api-error:overloaded:529')
    expect(modelCode({ reason: 'api-error', status: null, error: 'unknown' })).toBe('api-error:unknown:none')
    expect(modelCode({ reason: 'empty-reply' })).toBe('empty')
    expect(modelCode({ reason: 'aborted' })).toBe('aborted')
  })

  test('each code reads in words, its errno or status after it', () => {
    expect(faultLabel('api-error:overloaded:529')).toBe('서버 붐빔(529)')
    expect(faultLabel('api-error:rate_limit:429')).toBe('요청 한도(429)')
    expect(faultLabel('api-error:unknown:none')).toBe('연결 끊김(unknown)')
    expect(faultLabel('api-error:something_new:418')).toBe('API 오류 something_new(418)')
    expect(faultLabel('EACCES')).toBe('쓸 권한 없음(EACCES)')
    expect(faultLabel('ENOSPC')).toBe('디스크 가득 참(ENOSPC)')
    expect(faultLabel('EMFILE')).toBe('파일 오류(EMFILE)')
    expect(faultLabel('network')).toBe('네트워크 위치')
    expect(faultLabel('hook:tool.call')).toBe('tool.call 훅 멈춤')
    expect(faultLabel('hook:command.run:timeout')).toBe('command.run 훅 시간 초과')
    expect(faultLabel('copy:no-clipboard')).toBe('복사 안 됨(no-clipboard)')
    expect(faultLabel('store-full')).toBe('저장소 4MB 넘음')
  })

  test('a fault again within ten minutes counts on the last; later, or once gone through, it is its own', () => {
    let list = addFault([], 'note', 'api-error:overloaded:529', AT)
    list = addFault(list, 'note', 'api-error:overloaded:529', AT + 5 * MINUTE)
    expect(list).toEqual([{ at: AT, last: AT + 5 * MINUTE, area: 'note', code: 'api-error:overloaded:529', n: 2 }])
    // Ten minutes after the last one: a new entry.
    list = addFault(list, 'note', 'api-error:overloaded:529', AT + 5 * MINUTE + FAULT_FOLD_MS)
    expect(list.map(one => one.n)).toEqual([2, 1])
    // Another area or code is another entry.
    list = addFault(list, 'save', 'api-error:overloaded:529', AT + 16 * MINUTE)
    expect(list).toHaveLength(3)
    const done = faultsOk(list, 'note')
    expect(done.filter(one => one.ok === true).map(one => one.area)).toEqual(['note', 'note'])
    // Nothing open: the same list, so no write is asked for.
    expect(faultsOk(done, 'note')).toBe(done)
    expect(addFault(done, 'note', 'api-error:overloaded:529', AT + 17 * MINUTE)).toHaveLength(4)
  })

  test('a load keeps the newest faults only', () => {
    let list: Fault[] = []
    for (let i = 0; i < FAULTS_KEPT + 10; i += 1) list = addFault(list, 'save', `E${i}`, AT + i * FAULT_FOLD_MS)
    expect(list).toHaveLength(FAULTS_KEPT)
    expect(list[0]!.code).toBe('E10')
  })

  test('the pane\'s refused focus goes first when faults are cut: a week of quizzes never pushes out a journal that failed', () => {
    // A journal refusal, then pane focus refused at each of many quizzes, each gone through before the next.
    let list = addFault([], 'save', 'EACCES', AT)
    for (let i = 1; i <= FAULTS_KEPT + 5; i += 1) list = [...faultsOk(addFault(list, 'focus', 'focus', AT + i * 2 * MINUTE), 'focus')]
    expect(list).toHaveLength(FAULTS_KEPT)
    expect(list[0]).toEqual({ at: AT, last: AT, area: 'save', code: 'EACCES', n: 1 })
    // Five days of them in the store: the journal's fault is still there, and the record is within its bytes.
    let record = cleanFaults(undefined, AT)
    for (let day = 0; day < 5; day += 1) {
      for (let i = 0; i < 10; i += 1) list = [...faultsOk(addFault(list, 'focus', 'focus', AT + day * DAY + i * 2 * MINUTE + MINUTE), 'focus')]
      record = fitFaults({ list: mergeFaults(record.list, list, AT + day * DAY + DAY / 2) })
    }
    expect(jsonBytes(record)).toBeLessThanOrEqual(FAULT_MAX_BYTES)
    expect(record.list.filter(one => one.area === 'save')).toEqual([{ at: AT, last: AT, area: 'save', code: 'EACCES', n: 1 }])
    // With no refused focus to drop, the oldest fault goes.
    const full: Fault[] = Array.from({ length: FAULTS_KEPT * 2 + 1 }, (_, i) => ({ at: AT + i, last: AT + i, area: 'quiz', code: 'empty', n: 1 }))
    const fitted = fitFaults({ list: full }).list
    expect(fitted.length).toBeLessThanOrEqual(FAULTS_KEPT * 2)
    expect(fitted.map(one => one.at)).toEqual(full.slice(-fitted.length).map(one => one.at))
  })

  test('a fault the store kept from before is marked gone through once the same work went through after it', () => {
    const stored: Fault[] = [
      { at: AT, last: AT + MINUTE, area: 'save', code: 'EACCES', n: 2 },
      { at: AT, last: AT, area: 'store', code: 'store-reject', n: 1 },
      { at: AT + DAY, last: AT + DAY, area: 'save', code: 'ENOSPC', n: 1 },
    ]
    const okAt = new Map([['save', AT + HOUR]])
    expect(faultsOkSince(stored, okAt)).toEqual([
      { ...stored[0]!, ok: true },
      // Another area's work is not this one's.
      stored[1]!,
      // A fault after the success (another window's, say) stays open.
      stored[2]!,
    ])
    expect(faultsOkSince(stored, new Map())).toEqual(stored)
  })

  test('after a hundred faults the record is 4KB at most, and no fault holds a path separator', () => {
    let list: Fault[] = []
    let record = cleanFaults(undefined, AT)
    const codes = ["ENOSPC: open '/home/u/x'", 'C:\\Users\\u\\notes.md', '../../etc/passwd', 'api-error:overloaded:529', 'focus', '//server/share']
    for (let i = 0; i < 100; i += 1) {
      const at = AT + i * FAULT_FOLD_MS
      list = addFault(list, i % 2 === 0 ? 'save' : 'note', faultWord(codes[i % codes.length]!), at)
      record = fitFaults({ list: mergeFaults(record.list, list, at) })
    }
    expect(jsonBytes(record)).toBeLessThanOrEqual(FAULT_MAX_BYTES)
    expect(record.list.length).toBeGreaterThan(10)
    for (const one of record.list) expect(`${one.area}${one.code}`).not.toMatch(/[\\/]/)
    // A record a store holds, however written, reads back the same way.
    const read = cleanFaults({ list: [{ at: AT, last: AT, area: 'save/x', code: 'C:\\x', n: 1 }] }, AT)
    expect(read.list[0]).toEqual({ at: AT, last: AT, area: 'save_x', code: 'C:_x', n: 1 })
  })

  test('the store keeps a fault seven days after its last time; what is not a fault is dropped', () => {
    const now = AT + FAULT_DAYS * DAY
    const record = cleanFaults(
      {
        list: [
          { at: AT, last: AT, area: 'save', code: 'EACCES', n: 1 },
          { at: AT, last: AT + DAY, area: 'note', code: 'empty', n: 2.7, ok: true },
          { at: 'x', last: AT, area: 'save', code: 'EACCES', n: 1 },
          null,
        ],
        noticeDay: '2026-10-13',
      },
      now,
    )
    expect(record).toEqual({ list: [{ at: AT, last: AT + DAY, area: 'note', code: 'empty', n: 2, ok: true }], noticeDay: '2026-10-13' })
    expect(cleanFaults({ list: 'no', noticeDay: '../x' }, now)).toEqual({ list: [] })
    expect(cleanFaults([1, 2], now)).toEqual({ list: [] })
  })

  test('the store\'s faults and this load\'s merge one entry each, this load\'s copy kept', () => {
    const stored: Fault[] = [
      { at: AT, last: AT, area: 'note', code: 'empty', n: 1 },
      { at: AT + 1, last: AT + 1, area: 'save', code: 'EACCES', n: 1 },
    ]
    const mine: Fault[] = [{ at: AT, last: AT + MINUTE, area: 'note', code: 'empty', n: 3, ok: true }]
    expect(mergeFaults(stored, mine, AT + DAY)).toEqual([mine[0]!, stored[1]!])
  })

  test('a fault reads as one line: when, where, what, how often, and whether it went through after', () => {
    expect(faultLine({ at: AT, last: AT + MINUTE, area: 'note', code: 'api-error:overloaded:529', n: 2, ok: true })).toBe(
      '10-13 13:57 노트 쓰기 · 서버 붐빔(529) ×2 · 다시 써서 됨',
    )
    expect(faultLine({ at: AT, last: AT, area: 'store', code: 'store-full', n: 1, ok: true })).toBe('10-13 13:57 저장소 · 저장소 4MB 넘음 · 그 뒤 됨')
    expect(faultLine({ at: AT, last: AT, area: 'save', code: 'EACCES', n: 1 })).toBe('10-13 13:57 일지 저장 · 쓸 권한 없음(EACCES)')
  })

  test('a journal that refused a note says why, and what to do where the next try would meet the same', () => {
    expect(saveFailText('ENOSPC')).toBe('학습 노트를 파일에 쓰지 못했습니다: 디스크가 가득 찼습니다 · 다음 노트 때 다시 씁니다 · /learn 진단')
    expect(saveFailText('EACCES')).toContain("Windows의 '제어된 폴더 액세스'나 보안 프로그램")
    expect(saveFailText('EPERM')).toBe(saveFailText('EACCES'))
    expect(saveFailText('EBUSY')).toBe('학습 노트를 파일에 쓰지 못했습니다: 다른 프로그램이 파일을 잡고 있습니다 · 다음 노트 때 다시 씁니다 · /learn 진단')
    expect(saveFailText('EROFS')).toBe('학습 노트를 파일에 쓰지 못했습니다: 읽기 전용 위치입니다 · /config의 saveDir를 쓸 수 있는 폴더로 바꿔 주세요 · /learn 진단')
    expect(saveFailText('network')).toBe('학습 노트를 파일에 쓰지 못했습니다: 네트워크 위치입니다 · /config의 saveDir를 내 컴퓨터 폴더로 바꿔 주세요 · /learn 진단')
    expect(saveFailText('ENOENT')).toBe('학습 노트를 파일에 쓰지 못했습니다: 저장 폴더가 없습니다 · /config의 saveDir를 확인해 주세요 · /learn 진단')
    expect(saveFailText('error')).toBe('학습 노트를 파일에 쓰지 못했습니다 · 다음 노트 때 다시 씁니다 · /learn 진단')
    expect(storeFailText('store-full')).toBe('학습 노트 이력을 저장하지 못했습니다: 저장소가 4MB를 넘었습니다 · 다음 세션에 지난 노트가 빠질 수 있습니다 (일지 파일은 그대로) · /learn 진단')
    expect(storeFailText('store-reject')).toBe('학습 노트 이력을 저장하지 못했습니다 · 다음 세션에 지난 노트가 빠질 수 있습니다 (일지 파일은 그대로) · /learn 진단')
    expect(fileWhy('ENOSPC')).toBe('디스크가 가득 찼습니다')
    expect(fileWhy('error')).toBeUndefined()
  })

  test('the session-start check line names what remains, and nothing when nothing does', () => {
    expect(checkLine(3, 'EACCES')).toBe('learn-notes 점검: 일지에 아직 못 쓴 노트 3개 (폴더에 쓸 권한 없음) · /learn 진단')
    expect(checkLine(1)).toBe('learn-notes 점검: 일지에 아직 못 쓴 노트 1개 · /learn 진단')
    expect(checkLine(0, undefined, 'store-full')).toBe('learn-notes 점검: 저장소에 쓰지 못한 기록이 있음 (저장소 4MB 넘음) · /learn 진단')
    expect(checkLine(0, 'EACCES')).toBeUndefined()
  })

  test('sizes and a terminal program\'s name as the diagnosis writes them', () => {
    expect(sizeText(2_411_725)).toBe('2.3MB')
    expect(sizeText(624_640)).toBe('610KB')
    expect(sizeText(10)).toBe('1KB')
    expect(sizeText(0)).toBe('0KB')
    expect(appName('iTerm.app')).toBe('iTerm.app')
    expect(appName('vscode\n/home/u/x')).toBe('vscodehomeux')
    expect(appName('')).toBeUndefined()
    expect(appName(undefined)).toBeUndefined()
  })

  test('the diagnosis: versions, screen, settings with their locks, today, the store, the journal, the week\'s faults', () => {
    const text = diagText(
      input({
        faults: [
          { at: AT, last: AT + MINUTE, area: 'note', code: 'api-error:overloaded:529', n: 2, ok: true },
          { at: AT + DAY - 6 * 60 * MINUTE, last: AT + DAY - 6 * 60 * MINUTE, area: 'focus', code: 'focus', n: 9 },
          { at: AT + DAY - 5 * 60 * MINUTE, last: AT + DAY - 5 * 60 * MINUTE, area: 'save', code: 'EACCES', n: 2 },
        ],
        unsaved: 2,
      }),
    )
    expect(text.split('\n')).toEqual([
      'learn-notes 진단 · 2026-10-14 09:30',
      '- 버전: learn-notes 1.7.0 · Claude Code 2.1.296',
      '- 화면: terminal · 패널 오른쪽 56칸 · 터미널 132칸 · 키는 대화에 · Windows Terminal',
      '- 설정: 자동 노트 켬 · haiku · 하루 한도 40(관리자 잠금) · 일지 켬(기본 폴더) · 패널 자동 열기 켬 · 설명 수준 beginner',
      // The pane's refused focus is no failure: two saves today, not eleven.
      '- 오늘: 노트 3개 · 모델 호출 7번 · 실패 2번',
      '- 저장소: 2.3MB / 4MB (history 1.2MB)',
      '- 일지: 아직 못 쓴 노트 2개',
      '- 최근 7일 문제 2건 (최근 것부터)',
      '  - 10-14 08:57 일지 저장 · 쓸 권한 없음(EACCES) ×2',
      '  - 10-13 13:57 노트 쓰기 · 서버 붐빔(529) ×2 · 다시 써서 됨',
      // Nor among the problems listed: summed on a line of its own.
      '- 패널 초점(최근 7일): 초점 거절 ×9 · 마지막 10-14 07:57',
    ])
  })

  test('the diagnosis of a session with nothing known yet says so, and lists the newest faults only', () => {
    const many: Fault[] = Array.from({ length: DIAG_FAULTS + 3 }, (_, i) => ({ at: AT + i * MINUTE, last: AT + i * MINUTE, area: 'quiz', code: 'empty', n: 1 }))
    const text = diagText(
      input({
        version: undefined,
        engine: undefined,
        surfaces: [],
        pane: 'closed',
        terminal: undefined,
        apps: [],
        settings: { ...input().settings, isAutoNote: false, dailyAutoNotes: 0, isAutoSave: false, saveDir: 'network', excluded: 2, locked: [] },
        store: undefined,
        faults: many,
      }),
    )
    expect(text).toContain('- 버전: learn-notes 알 수 없음 · Claude Code 알 수 없음')
    expect(text).toContain('- 화면: 그리는 화면 없음 · 패널 닫힘 · 키는 대화에')
    expect(text).toContain('- 설정: 자동 노트 끔 · haiku · 하루 한도 없음 · 일지 끔 · 패널 자동 열기 켬 · 설명 수준 beginner · 뺄 파일 규칙 2개')
    expect(text).toContain('- 저장소: 읽지 못함')
    expect(text).toContain('- 일지: 저장 꺼짐')
    expect(text.split('\n').filter(line => line.startsWith('  - 10-13'))).toHaveLength(DIAG_FAULTS)
    expect(text).toContain('  - 그 밖에 3건')
    expect(diagText(input())).toContain('- 최근 7일 문제: 없습니다')
    expect(diagText(input({ pane: 'unplaced', terminal: { columns: 90, isFullscreen: false } }))).toContain('패널 자리 없음 · 터미널 90칸(전체 화면 아님)')
    expect(diagText(input({ pane: { placement: 'inline', columns: 80 }, isPaneFocused: true }))).toContain('패널 프롬프트 위 80칸 · 터미널 132칸 · 키는 패널에')
    expect(diagText(input({ settings: { ...input().settings, saveDir: 'custom', hasFolder: false } }))).toContain('일지 켬(바꾼 폴더, 아직 없음)')
    // A project that could not be read: how many notes wait is not known.
    expect(diagText(input({ unsaved: undefined }))).toContain('- 일지: 못 쓴 노트 수를 알 수 없음')
  })

  test('the pane\'s refused focus never pushes a failure off the listed lines: its kinds are summed apart', () => {
    const refusals: Fault[] = Array.from({ length: DIAG_FAULTS + 2 }, (_, i) => ({ at: AT + (i + 1) * 11 * MINUTE, last: AT + (i + 1) * 11 * MINUTE, area: 'focus', code: 'focus', n: 3 }))
    const text = diagText(
      input({
        faults: [
          { at: AT, last: AT, area: 'save', code: 'EACCES', n: 1 },
          ...refusals,
          { at: AT + HOUR, last: AT + HOUR, area: 'focus', code: 'scroll', n: 1, ok: true },
        ],
        unsaved: 1,
      }),
    )
    const lines = text.split('\n')
    expect(lines.slice(-3)).toEqual([
      '- 최근 7일 문제 1건 (최근 것부터)',
      '  - 10-13 13:57 일지 저장 · 쓸 권한 없음(EACCES)',
      `- 패널 초점(최근 7일): 초점 거절 ×${3 * (DIAG_FAULTS + 2)} · 스크롤 거절 ×1 · 마지막 10-13 15:47`,
    ])
    // Refused focus alone is no problem listed.
    expect(diagText(input({ faults: refusals.slice(0, 1) })).split('\n').slice(-2)).toEqual(['- 최근 7일 문제: 없습니다', '- 패널 초점(최근 7일): 초점 거절 ×3 · 마지막 10-13 14:08'])
  })

  test('the other windows\' builds go under the version, the newest first, with the store\'s layout while it is newer (1.7.0 D2)', () => {
    const now = input().now
    const lines = (over: Partial<DiagInput>) => diagText(input(over)).split('\n').slice(1, 3)
    expect(lines({ others: [{ v: '1.7.1', at: now - 3 * MINUTE }] })).toEqual(['- 버전: learn-notes 1.7.0 · Claude Code 2.1.296', '- 다른 창: 1.7.1 (3분 전)'])
    const four = [0, 1, 2, 3].map(i => ({ v: '1.7.0', at: now - (i + 1) * HOUR }))
    expect(lines({ others: four })[1]).toBe('- 다른 창: 1.7.0 (1시간 전) · 1.7.0 (2시간 전) · 1.7.0 (3시간 전) 외 1개')
    expect(lines({ others: [] })[1]).toBe('- 다른 창: 없음')
    expect(lines({ others: [{ v: '1.8.0', at: now - 20_000 }], schema: { stored: 4, mine: 3 } })[1]).toBe(
      '- 다른 창: 1.8.0 (방금) · 저장소가 새 구조(4, 이 창 3)라 개념 모음과 복습 단계를 고치지 않음',
    )
    expect(lines({ schema: { stored: 4, mine: 3 } })[1]).toBe('- 다른 창: 알 수 없음 · 저장소가 새 구조(4, 이 창 3)라 개념 모음과 복습 단계를 고치지 않음')
    // Unread and nothing to say: no line.
    expect(lines({})[1]).toMatch(/^- 화면: /)
  })
})

describe('1.8.0: a refusal for size in Claude Code\'s own words (E1)', () => {
  // Claude Code 2.1.302's words, as its `$.store.set`, `$.fs.read` and `$.fs.write` refuse a size past the limit.
  const STORE_FULL = 'learn-notes: $.store.set: the store would be 4194400 characters, over the 4194304 limit'
  const VALUE_FULL = 'learn-notes: $.store.set: the value is 4194400 characters, over the 4194304 limit'
  const READ_BIG = 'learn-notes: $.fs.read: C:\\x refused: the file is over the 4194304-byte limit'
  const WRITE_BIG = 'learn-notes: $.fs.write: C:\\x refused: 4200000 bytes is over the 4194304-byte limit'

  test('the store past its limit is full, in either of its words; a file past it is too big', () => {
    expect(faultCode(new Error(STORE_FULL), 'store')).toBe('store-full')
    expect(faultCode(new Error(VALUE_FULL), 'store')).toBe('store-full')
    expect(faultCode(new Error(READ_BIG))).toBe('too-big')
    expect(faultCode(new Error(WRITE_BIG))).toBe('too-big')
    expect(faultCode(new Error(READ_BIG), 'fs')).toBe('too-big')
    // As a hook's refusal reaches the plugin: the words alone, no Error.
    expect(faultCode(STORE_FULL, 'store')).toBe('store-full')
    // A key too long reads as full too: every key the plugin writes is a constant.
    expect(faultCode(new Error('learn-notes: $.store.set: the key is 300 characters, over the 256 limit'), 'store')).toBe('store-full')
  })

  test('no other limit is taken for 4MB, the words before the engine\'s still are, and an errno goes first', () => {
    // A model call's input limit is no file and no store.
    expect(faultCode(new Error('request over the 32 MiB limit'))).toBe('error')
    expect(faultCode(new Error('request over the 32 MiB limit'), 'store')).toBe('store-reject')
    expect(faultCode(new Error('store over 4 MiB'), 'store')).toBe('store-full')
    expect(faultCode(new Error('read over 4 MiB'))).toBe('too-big')
    expect(faultCode(new Error('EACCES: permission denied'), 'store')).toBe('EACCES')
    expect(faultCode(new Error('learn-notes: $.fs.write: /home/u/x.md refused: a network location is not reached from here'))).toBe('network')
    expect(faultCode(new Error('refused'), 'store')).toBe('store-reject')
  })

  test('what the person reads for it: the toast, the start\'s check line and /learn 진단 name the cause', () => {
    const code = faultCode(new Error(STORE_FULL), 'store')
    expect(storeFailText(code)).toBe('학습 노트 이력을 저장하지 못했습니다: 저장소가 4MB를 넘었습니다 · 다음 세션에 지난 노트가 빠질 수 있습니다 (일지 파일은 그대로) · /learn 진단')
    expect(checkLine(0, undefined, code)).toBe('learn-notes 점검: 저장소에 쓰지 못한 기록이 있음 (저장소 4MB 넘음) · /learn 진단')
    expect(faultLine({ at: AT, last: AT, area: 'store', code, n: 2 })).toBe('10-13 13:57 저장소 · 저장소 4MB 넘음 ×2')
    // A journal past the limit: /learn 진단 says so; its toast is 1.7.0's, with no cause to name.
    const big = faultCode(new Error(WRITE_BIG))
    expect(faultLine({ at: AT, last: AT, area: 'save', code: big, n: 1 })).toBe('10-13 13:57 일지 저장 · 4MB 넘음')
    expect(saveFailText(big)).toBe('학습 노트를 파일에 쓰지 못했습니다 · 다음 노트 때 다시 씁니다 · /learn 진단')
  })
})

describe('1.8.0: /learn 진단 counts the slips, with no name and no words (E2)', () => {
  test('one line under the journal\'s: all, open and mended, 기타, no words, open after two misses; none yet; unread', () => {
    const slip = (what: string, type: LearnSlip['type'], more: Partial<LearnSlip> = {}): LearnSlip => ({ what, type, question: '클로저 문제', mine: '전역 변수', at: AT, times: 1, ...more })
    const slips = {
      'c:클로저': slip('함수가 끝나면 바깥 변수도 사라진다고 봄', 'scope', { times: 2 }),
      'c:map': slip('원래 배열을 바꾼다고 봄', 'other'),
      'c:구조분해': slip('', 'blank'),
      'c:비동기': slip('await 없이도 기다린다고 봄', 'order', { fixedAt: AT + DAY }),
    }
    const text = diagText(input({ slips: slipCounts(slips) }))
    const lines = text.split('\n')
    expect(lines[lines.indexOf('- 일지: 못 쓴 노트 없음') + 1]).toBe('- 오답 노트 4개 (열림 3 · 바로잡음 1) · 유형 기타 1 · 문장 없음 1 · 열린 채 두 번 이상 1')
    // Nothing of a concept's name, a slip's words, its question or answer.
    for (const word of ['클로저', 'map', '구조', '비동기', '사라진다고', '배열', 'await', '전역']) expect(text).not.toContain(word)
    expect(diagText(input({ slips: slipCounts({}) }))).toContain('\n- 일지: 못 쓴 노트 없음\n- 오답 노트: 아직 없습니다\n')
    expect(diagText(input({ slips: 'unread' }))).toContain('\n- 일지: 못 쓴 노트 없음\n- 오답 노트: 읽지 못함\n')
    // Not given (as before 1.8.0): no line.
    expect(diagText(input())).not.toContain('오답 노트')
    // While bases are asked (1.9.0 F5): the open ones with a base counted, no name; off, 1.8.0's line to the byte. A base
    // is asked before a worked example only: counted with worked examples after two misses (a harness's; 교차 검토 2
    // turned them off in the release), none with them off.
    const based = { ...slips, 'c:클로저': { ...slips['c:클로저']!, base: 'c:변수범위' }, 'c:비동기': { ...slips['c:비동기']!, base: 'c:promise' } }
    expect(diagText(input({ slips: slipCounts(based, 2), isBaseAsked: true }))).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 1\n')
    expect(diagText(input({ slips: slipCounts(based, Infinity), isBaseAsked: true }))).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 0\n')
    expect(diagText(input({ slips: slipCounts(based) }))).toBe(text)
    expect(diagText(input({ slips: slipCounts(based), isBaseAsked: false }))).toBe(text)
    expect(diagText(input({ slips: slipCounts(based, 2), isBaseAsked: true }))).not.toContain('변수범위')
  })
})

describe('1.9.0: /learn 진단\'s store line ends with the index writes of builds before 1.9.0 (F1)', () => {
  test('seen: the last and since when, how often; none seen; unread; nothing while no 1.9.0 wrote the index here', () => {
    const since = new Date(2026, 9, 2, 8, 15).getTime()
    const last = new Date(2026, 9, 13, 14, 2).getTime()
    const storeLine = (over: Partial<DiagInput>) => diagText(input(over)).split('\n').find(line => line.startsWith('- 저장소:'))
    expect(storeLine({ oldWrites: { since, last, n: 3 } })).toBe('- 저장소: 2.3MB / 4MB (history 1.2MB) · 옛 판 창의 개념 모음 쓰기: 마지막 10-13 14:02 (10-02부터 3번)')
    expect(storeLine({ oldWrites: { since, n: 0 } })).toBe('- 저장소: 2.3MB / 4MB (history 1.2MB) · 옛 판 창의 개념 모음 쓰기: 없음 (10-02부터)')
    expect(storeLine({ oldWrites: 'unread' })).toBe('- 저장소: 2.3MB / 4MB (history 1.2MB) · 옛 판 창의 개념 모음 쓰기: 읽지 못함')
    // No 1.9.0 wrote the index here yet: the line is 1.8.0's.
    expect(storeLine({})).toBe('- 저장소: 2.3MB / 4MB (history 1.2MB)')
    // The store's size unread, the record read: both said.
    expect(storeLine({ store: undefined, oldWrites: { since, n: 0 } })).toBe('- 저장소: 읽지 못함 · 옛 판 창의 개념 모음 쓰기: 없음 (10-02부터)')
    // The rest of the page is as it was.
    const with3 = diagText(input({ oldWrites: { since, last, n: 3 } })).split('\n')
    const without = diagText(input()).split('\n')
    expect(with3.filter(line => !line.startsWith('- 저장소:'))).toEqual(without.filter(line => !line.startsWith('- 저장소:')))
  })
})
