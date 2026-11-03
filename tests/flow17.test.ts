// The tests of builds 1.7.0 and 1.7.1: a window as a person runs it (the kit, flowkit.ts).
import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
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
import {
  CONCEPT_NOTE,
  EDIT_A,
  FIELD_CELLS,
  JOURNAL,
  NOTES_DIR,
  NOTE_TEXT,
  NOW,
  PANE_PROPS,
  QUOTED_NOTE,
  type Reply,
  THREE_CONCEPTS,
  THREE_QUESTIONS,
  WORKED_BOTH,
  type World,
  cells,
  finish,
  focusesOf,
  fullscreen,
  learn,
  mineKey,
  ownSteps,
  pane,
  seeAnswer,
  start,
  turn,
  withFiller,
  world,
} from './flowkit'



describe('1.7.0: /learn 진단, and failures that say their cause', () => {
  const DIAG_COPIED = '진단 내용을 클립보드에 복사했습니다 · 팀 채널이나 담당자에게 그대로 붙여 주세요'
  const DIAG_HERE = '이 화면에서는 클립보드에 복사할 수 없어 여기에 적습니다'
  // 1.8.0 (E2): the slips are counted in it too, so it says no slip's words are.
  const DIAG_PRIVATE = '코드 · 요청 · 파일 이름 · 경로 · 개념 이름 · 헷갈린 점 문장은 들어 있지 않습니다 (오답 노트는 개수만)'
  const FULL_DISK = "HooksError: ENOSPC: no space left on device, open '/home/u/.claude/learning-notes/2026-10-03_proj_abcde.md'"
  const FULL_DISK_TOAST = '학습 노트를 파일에 쓰지 못했습니다: 디스크가 가득 찼습니다 · 다음 노트 때 다시 씁니다 · /learn 진단'
  const diag = async ($: Engine) => (await learn($, '진단')).text ?? ''
  const end = ($: Engine) => $.session.end({ reason: 'prompt_input_exit', sessionId: 's1', resume: { id: 's1' } })

  test('/learn 진단 is copied and written in the reply, with no model call: versions, screen, settings, today, store, journal', { options: { dailyAutoNotes: 40 } }, async ($, on) => {
    const w = world(on, 'ok', { isShown: true }, true, new Map(), { WT_SESSION: '{a1b2}', TMUX: '/tmp/tmux-1000/default,1,0', TERM_PROGRAM: 'vscode' })
    w.locked = ['learn-notes.dailyAutoNotes']
    await start($)
    await fullscreen($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await pane($)
    await ui.unmount()
    const reply = await diag($)
    const lines = reply.split('\n')
    expect(lines.slice(0, 3)).toEqual([DIAG_COPIED, DIAG_PRIVATE, ''])
    expect(w.copied).toEqual([lines.slice(3).join('\n')])
    expect(lines[3]).toMatch(/^learn-notes 진단 · 2026-10-0[23] \d\d:\d\d$/)
    expect(lines).toContain('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
    expect(lines).toContain('- 화면: terminal · 패널 오른쪽 60칸 · 터미널 200칸 · 키는 대화에 · Windows Terminal · tmux · vscode')
    // The table as shipped turns 팀 규칙 표지 넓힘 on for haiku (1.10.0 G6): the settings line names it.
    expect(reply).toContain('- 설정: 자동 노트 켬 · haiku(이 모델에서 켠 기능: 팀 규칙 표지 넓힘) · 하루 한도 40(관리자 잠금) · 일지 켬(기본 폴더) · 패널 자동 열기 켬 · 설명 수준 beginner')
    expect(lines).toContain('- 오늘: 노트 1개 · 모델 호출 1번 · 실패 0번')
    expect(reply).toMatch(/\n- 저장소: \d+KB \/ 4MB \(history \d+KB · /)
    expect(lines).toContain('- 일지: 못 쓴 노트 없음')
    expect(lines).toContain('- 최근 7일 문제: 없습니다')
    expect(lines.length).toBeLessThanOrEqual(18)
    // The note's call alone: the diagnosis asks the model nothing.
    expect(w.models).toHaveLength(1)
    expect((await learn($, 'doctor')).text?.split('\n').slice(0, 2)).toEqual([DIAG_COPIED, DIAG_PRIVATE])
  })

  test('the diagnosis holds no request, path, file name, code or concept name, whatever failed', async ($, on) => {
    const w = world(on)
    await start($)
    w.answer = CONCEPT_NOTE(['클로저 캡처'])
    w.writeFails = true
    await turn($, () => $.tool.call(EDIT_A), 't1', '아주 은밀한 요청 문장으로 b를 고쳐줘')
    await finish(w)
    const reply = await diag($)
    for (const kept of ['은밀한', '/proj', 'a.ts', 'src', '/home/u', 'learning-notes/', '클로저', 'const b', 'let b', 'items']) expect(reply).not.toContain(kept)
    expect(reply).toContain('일지 저장 · 쓸 권한 없음(EACCES)')
  })

  test('a full disk: its toast says so once, and the diagnosis keeps ENOSPC alone, never the path its message held', async ($, on) => {
    const w = world(on)
    await start($)
    w.writeFails = true
    w.writeError = FULL_DISK
    await turn($, () => $.tool.call(EDIT_A), 't1')
    await finish(w)
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(w.toasts.filter(text => text.includes('파일에 쓰지 못했습니다'))).toEqual([FULL_DISK_TOAST])
    const reply = await diag($)
    expect(reply).toContain('일지 저장 · 디스크 가득 참(ENOSPC) ×2')
    expect(reply).toContain('- 일지: 아직 못 쓴 노트 2개')
    expect(reply).toContain('실패 2번')
    expect(reply).not.toContain('/home/u')
    // The debug log has the code too, not the message.
    expect(w.logs).toContain('learn-notes: 노트를 파일에 쓰지 못했습니다 (ENOSPC)')
    expect(w.logs.some(line => line.includes('2026-10-03_proj_abcde'))).toBe(false)
    // The store has the first at once, as a code (a reload a minute later would not lose it); the one after it within
    // the minute goes in when that minute is up.
    expect(JSON.stringify(w.store.get('faults'))).toContain('"code":"ENOSPC","n":1}')
    await w.clock.advance(60_000)
    const kept = JSON.stringify(w.store.get('faults'))
    expect(kept).toContain('"code":"ENOSPC","n":2}')
    expect(kept).not.toMatch(/[\\/]/)
    // Another cause has a toast of its own, with what to do.
    w.writeError = '$.fs.write: a network location is not reached from here'
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u3' }), 't3')
    await finish(w)
    expect(w.toasts.filter(text => text.includes('파일에 쓰지 못했습니다'))).toEqual([
      FULL_DISK_TOAST,
      '학습 노트를 파일에 쓰지 못했습니다: 네트워크 위치입니다 · /config의 saveDir를 내 컴퓨터 폴더로 바꿔 주세요 · /learn 진단',
    ])
    expect(await diag($)).toContain('일지 켬(네트워크 폴더)')
  })

  test('a journal file another program holds is written half a second later, quietly', async ($, on) => {
    const w = world(on)
    await start($)
    w.failNextWrites = 1
    w.writeError = "EBUSY: resource busy or locked, open 'C:\\Users\\u\\.claude\\learning-notes\\x.md'"
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.journal()).toHaveLength(0)
    await w.clock.advance(500)
    expect(w.journal()).toHaveLength(1)
    expect(w.toasts.filter(text => text.includes('파일에 쓰지 못했습니다'))).toEqual([])
    const reply = await diag($)
    expect(reply).toContain('일지 저장 · 다른 프로그램이 파일을 잡고 있음(EBUSY) · 다시 써서 됨')
    expect(reply).toContain('- 일지: 못 쓴 노트 없음')
  })

  test('a busy server is named with its status, and a note written after it says it went through', async ($, on) => {
    const w = world(on, 'error')
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(await diag($)).toMatch(/ 노트 쓰기 · 서버 붐빔\(529\)$/m)
    w.model = 'ok'
    const ui = await pane($)
    await ui.press({ key: 'write' })
    await finish(w)
    await ui.unmount()
    expect(await diag($)).toContain('노트 쓰기 · 서버 붐빔(529) · 다시 써서 됨')
  })

  test('away from this screen, or where the copy fails, the whole diagnosis is in the reply', async ($, on) => {
    const w = world(on)
    await start($)
    for (const origin of [{ kind: 'bridge' as const }, { kind: 'channel' as const, server: 'slack' }]) {
      const reply = (await $.command.run({ command: 'learn', args: '진단', origin, presentation: { isFullscreen: true, columns: 160 } })).text ?? ''
      expect(reply.split('\n').slice(0, 3)).toEqual([DIAG_HERE, DIAG_PRIVATE, ''])
      expect(reply).toContain('\n- 버전: learn-notes 1.7.0 · Claude Code 2.1.296\n')
    }
    expect(w.copied).toEqual([])
    w.copyFails = true
    const reply = await diag($)
    expect(reply.split('\n')[0]).toBe(DIAG_HERE)
    expect(reply).toContain('\n- 최근 7일 문제: 없습니다')
    // The refused copy is kept: the next diagnosis names it.
    expect(await diag($)).toContain('클립보드 복사 · 복사 안 됨(no-clipboard)')
  })

  test('a pane that fails to draw shows two lines instead of nothing', async ($, on) => {
    const w = world(on, 'ok', { isShown: true })
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    w.rootFails = true
    const ui = await pane($)
    expect(await ui.find({ type: 'Text', text: '패널을 그리지 못했습니다 · /learn 진단을 복사해 팀에 보내 주세요' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '대화창의 /learn 퀴즈 · /learn 기록은 그대로 됩니다' })).toBeDefined()
    await ui.unmount()
    w.rootFails = false
    expect(await diag($)).toContain('패널 · 그리기 실패')
  })

  test('a tool.call hook that throws hands on what the tool did, and says so in the diagnosis', async ($, on) => {
    const w = world(on)
    await start($)
    await $.turn.start({ text: '고쳐줘', turnId: 't1' })
    w.rootFails = true
    const ran = await $.tool.call(EDIT_A)
    w.rootFails = false
    expect(ran).toMatchObject({ result: { filePath: '/proj/src/a.ts', newString: 'const' } })
    await $.turn.complete({ answer: '바꿨습니다', durationMs: 5, isAborted: false, turnId: 't1', reason: 'answer' })
    await finish(w)
    // Nothing was caught: no note, no model call.
    expect(w.models).toHaveLength(0)
    expect(await diag($)).toContain('바뀐 코드 잡기 · tool.call 훅 멈춤')
  })

  test('faults go to the store at the session\'s end too; a hundred stay within 4KB, none with a path', async ($, on) => {
    const w = world(on)
    await start($)
    w.writeFails = true
    w.writeError = FULL_DISK
    await learn($, '보고서')
    expect(JSON.stringify(w.store.get('faults'))).toContain('"area":"report","code":"ENOSPC"')
    // One more within the minute waits for it, unless the session ends first.
    w.copyFails = true
    await learn($, '보고서')
    expect(JSON.stringify(w.store.get('faults'))).not.toContain('"area":"copy"')
    await end($)
    expect(JSON.stringify(w.store.get('faults'))).toContain('"area":"copy","code":"copy:no-clipboard"')
    const errors = [
      FULL_DISK,
      "EACCES: permission denied, open 'C:\\Users\\u\\notes\\report.md'",
      "EROFS: read-only file system, open '/Volumes/disk/x.md'",
      "ENOENT: no such file or directory, open '//server/share/x.md'",
      '$.fs.write: a network location is not reached from here',
      'something else at /home/u/secret/path',
    ]
    for (let i = 0; i < 100; i += 1) {
      w.writeError = errors[i % errors.length]!
      await learn($, '보고서')
      await w.clock.advance(11 * 60_000)
    }
    const kept = w.store.get('faults') as { list: { area: string; code: string }[] }
    expect(new TextEncoder().encode(JSON.stringify(kept)).length).toBeLessThanOrEqual(4096)
    expect(kept.list.length).toBeGreaterThan(10)
    for (const one of kept.list) expect(`${one.area} ${one.code}`).not.toMatch(/[\\/]/)
    expect(new Set(kept.list.map(one => one.code))).toEqual(new Set(['ENOSPC', 'EACCES', 'EROFS', 'ENOENT', 'network', 'error', 'copy:no-clipboard']))
  })

  test('a session\'s start says once a day what is still wrong: notes the journal has not taken, and why', async ($, on) => {
    const unsaved = { id: 'old', turnId: 'old', at: NOW - 3_600_000, prompt: '예전 요청', answer: '', changes: [], moreFiles: 0, status: 'ready', text: NOTE_TEXT, savedAs: null, isUnsaved: true, concepts: [], updatedAt: NOW }
    const store = new Map<string, unknown>([
      ['history', { '/proj': { at: NOW, notes: [unsaved, { ...unsaved, id: 'old2' }] } }],
      ['faults', { list: [{ at: NOW - 3_600_000, last: NOW - 3_600_000, area: 'save', code: 'EACCES', n: 2 }] }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    expect(w.transcript).toEqual(['learn-notes 점검: 일지에 아직 못 쓴 노트 2개 (폴더에 쓸 권한 없음) · /learn 진단'])
    expect((store.get('faults') as { noticeDay?: string }).noticeDay).toBe(stamp(NOW).day)
  })

  test('the check line shows once a day, and not at all while nothing is wrong', async ($, on) => {
    const unsaved = { id: 'old', turnId: 'old', at: NOW - 3_600_000, prompt: '예전 요청', answer: '', changes: [], moreFiles: 0, status: 'ready', text: NOTE_TEXT, savedAs: null, isUnsaved: true, concepts: [], updatedAt: NOW }
    const store = new Map<string, unknown>([
      ['history', { '/proj': { at: NOW, notes: [unsaved] } }],
      ['faults', { list: [], noticeDay: stamp(NOW).day }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    expect(w.transcript).toEqual([])
    // A store that refused a write in the last day is a problem too, said with its cause.
    store.set('faults', { list: [{ at: NOW - 60_000, last: NOW - 60_000, area: 'store', code: 'store-full', n: 1 }] })
    store.set('history', {})
    await start($)
    expect(w.transcript).toEqual(['learn-notes 점검: 저장소에 쓰지 못한 기록이 있음 (저장소 4MB 넘음) · /learn 진단'])
  })

  test('(교차 검토 6) a reload reads the notes\' store (up to 2MB) once for the start check and the journal\'s look, not once each', async ($, on) => {
    let reads = 0
    on('store.get', { key: 'history' }, async (_$, e, next) => {
      reads += 1
      return next(e)
    })
    const w = world(on)
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // A reload (or a /config change) on a day nothing was wrong: the pane holds the notes, the check line is unsaid.
    reads = 0
    await start($)
    await w.clock.settle()
    expect(reads).toBe(1)
    expect(w.transcript.filter(line => line.startsWith('learn-notes 점검'))).toEqual([])
    // What that one read holds still makes the check line: a note the journal refused is counted at the next start.
    w.writeFails = true
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    w.writeFails = false
    reads = 0
    await start($)
    await w.clock.settle()
    expect(reads).toBe(1)
    expect(w.transcript.filter(line => line.startsWith('learn-notes 점검'))).toEqual([
      expect.stringContaining('learn-notes 점검: 일지에 아직 못 쓴 노트 1개'),
    ])
  })

  test('a store that refuses the history names its cause, once', async ($, on) => {
    const w = world(on)
    w.storeFails = true
    await start($)
    await turn($, () => $.tool.call(EDIT_A), 't1')
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(w.toasts.filter(text => text.includes('이력을 저장하지 못했습니다'))).toEqual([
      '학습 노트 이력을 저장하지 못했습니다: 저장소가 4MB를 넘었습니다 · 다음 세션에 지난 노트가 빠질 수 있습니다 (일지 파일은 그대로) · /learn 진단',
    ])
    expect(await diag($)).toContain('저장소 · 저장소 4MB 넘음')
  })

  test('a fault an earlier session left is marked gone through once the same work goes through: the next morning says nothing', async ($, on) => {
    const store = new Map<string, unknown>([
      [
        'faults',
        {
          list: [
            { at: NOW - 60_000, last: NOW - 60_000, area: 'store', code: 'store-reject', n: 1 },
            { at: NOW - 50_000, last: NOW - 50_000, area: 'save', code: 'EACCES', n: 2 },
          ],
          noticeDay: stamp(NOW).day,
        },
      ],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.journal()).toHaveLength(1)
    const reply = await diag($)
    expect(reply).toMatch(/ 일지 저장 · 쓸 권한 없음\(EACCES\) ×2 · 다시 써서 됨$/m)
    expect(reply).toMatch(/ 저장소 · 저장소가 받지 않음 · 그 뒤 됨$/m)
    // The store has it too, a minute later at most.
    await w.clock.advance(60_000)
    const kept = (store.get('faults') as { list: { code: string; ok?: true }[] }).list
    expect(kept.map(one => [one.code, one.ok])).toEqual([
      ['store-reject', true],
      ['EACCES', true],
    ])
    // The next morning, within a day of the store's refusal: nothing is wrong any more, so no check line.
    await end($)
    await w.clock.advance(23 * 3_600_000)
    w.transcript.length = 0
    await start($)
    expect(w.transcript).toEqual([])
  })

  test('the diagnosis names the journal folder as set now: a network failure kept from before stays in the list alone', { options: { saveDir: '~/notes' } }, async ($, on) => {
    const store = new Map<string, unknown>([
      ['faults', { list: [{ at: NOW - 2 * 86_400_000, last: NOW - 2 * 86_400_000, area: 'save', code: 'network', n: 2 }], noticeDay: stamp(NOW).day }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    expect(await diag($)).toContain('일지 켬(바꾼 폴더, 아직 없음)')
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const reply = await diag($)
    expect(reply).toContain('일지 켬(바꾼 폴더)')
    expect(reply).toContain('일지 저장 · 네트워크 위치 ×2 · 다시 써서 됨')
  })

  test('the pane\'s refused focus is kept once a move, apart from the failures: a journal that failed stays in view', async ($, on) => {
    const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.writeFails = true
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    w.writeFails = false
    const ui = await pane($)
    await ui.press({ key: 'view-quiz' })
    for (let i = 0; i < 9; i += 1) {
      w.answer = THREE_QUESTIONS
      await ui.press({ key: 'quiz-new' })
      await ui.press({ key: 'quiz-new' })
      await w.clock.settle()
      await w.clock.advance(11 * 60_000)
    }
    await ui.unmount()
    const reply = await diag($)
    expect(reply).toContain('- 일지: 아직 못 쓴 노트 1개')
    expect(reply).toContain('- 최근 7일 문제 1건 (최근 것부터)')
    expect(reply).toMatch(/ 일지 저장 · 쓸 권한 없음\(EACCES\)$/m)
    // Each move asked three times (the kit never gives the pane the keys) is one refusal, not three.
    expect(reply).toMatch(/^- 패널 초점\(최근 7일\): 초점 거절 ×9 · 마지막 /m)
    expect(reply).toContain('실패 1번')
  })

  test('a journal file held with EPERM: written half a second later, or kept once when it stays held', async ($, on) => {
    const w = world(on)
    await start($)
    w.failNextWrites = 1
    w.writeError = "EPERM: operation not permitted, open 'C:\\Users\\u\\Documents\\notes\\x.md'"
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.journal()).toHaveLength(0)
    await w.clock.advance(500)
    expect(w.journal()).toHaveLength(1)
    expect(w.toasts.filter(text => text.includes('파일에 쓰지 못했습니다'))).toEqual([])
    expect(await diag($)).toMatch(/ 일지 저장 · 쓸 권한 없음\(EPERM\) · 다시 써서 됨$/m)
    // A folder that stays refused (Windows' controlled folder access): one note is one failure, not two.
    w.writeFails = true
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    await w.clock.advance(600)
    const reply = await diag($)
    expect(reply).toMatch(/ 일지 저장 · 쓸 권한 없음\(EPERM\)$/m)
    expect(reply).toContain('실패 2번')
    expect(w.toasts.filter(text => text.includes('파일에 쓰지 못했습니다'))).toHaveLength(1)
  })

  test('a /learn reply that fails says so, and /learn 진단 answers with no project or home to read', async ($, on) => {
    const COMMAND_FAILED = '이 명령을 마치지 못했습니다 · /learn 진단으로 무엇이 막혔는지 볼 수 있습니다'
    const w = world(on, 'ok', null, true, new Map(), { HOME: '' })
    w.rootFails = true
    await start($)
    // Neither the project nor the journal folder (under the project with no home) can be read: said unknown.
    const first = await diag($)
    expect(first.split('\n').slice(0, 2)).toEqual([DIAG_COPIED, DIAG_PRIVATE])
    expect(first).toContain('- 일지: 못 쓴 노트 수를 알 수 없음')
    expect(first).toContain('일지 켬(기본 폴더) ·')
    w.rootFails = false
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // The session's root cannot be read now: the reply below the masking hook throws, and says so.
    w.rootFails = true
    expect((await learn($, '찾기 const')).text).toBe(COMMAND_FAILED)
    expect(await diag($)).toContain('훅 · command.run 훅 멈춤')
  })

  /** A note the journal has not taken yet, as an earlier session left it in the store. */
  const UNSAVED_NOTE = (id: string) => ({ id, turnId: id, at: NOW - 3_600_000, prompt: '예전 요청', answer: '', changes: [], moreFiles: 0, status: 'ready', text: NOTE_TEXT, savedAs: null, isUnsaved: true, concepts: [], updatedAt: NOW })

  test('(교차 검토 8) the screen line says the keys are in the pane while the pane holds them', async ($, on) => {
    world(on, 'ok', { isShown: true, isFocused: true })
    await start($)
    const reply = await diag($)
    expect(reply).toContain(' · 키는 패널에')
    expect(reply).not.toContain('키는 대화에')
  })

  test('(교차 검토 8) a saveDir on a share (\\\\server\\share) is named a network folder before any write fails there', { options: { saveDir: '\\\\server\\share\\notes' } }, async ($, on) => {
    world(on)
    await start($)
    expect(await diag($)).toContain('일지 켬(네트워크 폴더)')
  })

  test('(교차 검토 8) the journal line counts this project\'s unsaved notes alone, never another project\'s', async ($, on) => {
    const store = new Map<string, unknown>([['history', { '/other': { at: NOW, notes: [UNSAVED_NOTE('o1'), UNSAVED_NOTE('o2')] } }]])
    world(on, 'ok', null, true, store)
    await start($)
    expect((await diag($)).split('\n')).toContain('- 일지: 못 쓴 노트 없음')
  })

  test('(교차 검토 8) /learn anki that cannot write its file says why', async ($, on) => {
    const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.writeFails = true
    const reply = (await learn($, 'anki')).text ?? ''
    expect(reply).toContain("Anki 파일을 쓰지 못했습니다: 폴더에 쓸 권한이 없습니다(Windows의 '제어된 폴더 액세스'")
  })

  test('(교차 검토 8) a -p or SDK run says no check line and leaves the day\'s line to the interactive window', async ($, on) => {
    const store = new Map<string, unknown>([
      ['history', { '/proj': { at: NOW, notes: [UNSAVED_NOTE('u1')] } }],
      ['faults', { list: [{ at: NOW - 3_600_000, last: NOW - 3_600_000, area: 'save', code: 'EACCES', n: 1 }] }],
    ])
    const w = world(on, 'ok', null, true, store)
    await $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
    await w.clock.settle()
    expect(w.transcript.filter(line => line.startsWith('learn-notes 점검'))).toEqual([])
    expect((store.get('faults') as { noticeDay?: string }).noticeDay).toBeUndefined()
    // The interactive window that day still has it.
    await start($)
    expect(w.transcript.filter(line => line.startsWith('learn-notes 점검'))).toEqual(['learn-notes 점검: 일지에 아직 못 쓴 노트 1개 (폴더에 쓸 권한 없음) · /learn 진단'])
  })

  test('(교차 검토 8) a store refusal over a day old says no check line', async ($, on) => {
    const store = new Map<string, unknown>([['faults', { list: [{ at: NOW - 25 * 3_600_000, last: NOW - 25 * 3_600_000, area: 'store', code: 'store-full', n: 1 }] }]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    expect(w.transcript.filter(line => line.startsWith('learn-notes 점검'))).toEqual([])
  })
})

describe('1.7.0: the version stamp, and the schema guard', () => {
  const MINUTE = 60_000
  const NOTICE = 'learn-notes 새 버전(1.7.1)이 다른 창에서 쓰이고 있습니다 · 이 창은 1.7.0입니다 · /reload-plugins로 바꿉니다'
  const TAIL = '다시 불러올 때까지 이 창은 개념 모음과 복습 단계를 고치지 않습니다(노트와 일지는 그대로)'
  // A reload may not end the guard (a newer build rolled back): the way on after it (교차 검토 4).
  const STUCK = '다시 불러와도 계속되면 /learn 진단을 담당자에게 보내 주세요'
  const BEHIND_TEXT = `learn-notes가 다른 창에서 더 새 버전으로 학습 기록을 썼습니다 · ${TAIL} · /reload-plugins로 바꿉니다 · ${STUCK}`
  const said = (lines: readonly string[]) => lines.filter(line => line.includes('/reload-plugins'))
  const stamps = (others: Record<string, { v: string; at: number }>, more: [string, unknown][] = []) => new Map<string, unknown>([['sessions', others], ...more])

  test('a window still on an older build says once, in the transcript and a toast, that a newer one is open in another', async ($, on) => {
    const w = world(on, 'ok', null, true, stamps({ 'session-new': { v: '1.7.1', at: NOW - 3 * MINUTE } }))
    await start($)
    expect(said(w.transcript)).toEqual([NOTICE])
    expect(said(w.toasts)).toEqual([NOTICE])
    // Its own stamp beside the other's, and the store's layout number.
    expect(w.store.get('sessions')).toEqual({ 'session-mine': { v: '1.7.0', at: NOW }, 'session-new': { v: '1.7.1', at: NOW - 3 * MINUTE } })
    expect(w.store.get('schema')).toBe(3)
    // Ten minutes on, a turn's end and /learn look again: said once a session all the same.
    await w.clock.advance(11 * MINUTE)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    await learn($, '')
    expect(said(w.transcript)).toHaveLength(1)
    expect(said(w.toasts)).toHaveLength(1)
    // The note's save stamped this window again, ten minutes on.
    expect((w.store.get('sessions') as Record<string, { at: number }>)['session-mine']!.at).toBeGreaterThanOrEqual(NOW + 11 * MINUTE)
    // Notes go on as ever, and the diagnosis names the other window.
    expect(w.journal()).toHaveLength(1)
    expect((await learn($, '진단')).text).toContain('\n- 다른 창: 1.7.1 (14분 전)\n')
  })

  test('a window stamps itself at start, then with the notes it saves only once ten minutes have passed', async ($, on) => {
    const w = world(on)
    await start($)
    const stamped = () => w.sets.filter(key => key === 'sessions').length
    expect(stamped()).toBe(1)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(stamped()).toBe(1)
    await w.clock.advance(10 * MINUTE)
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(stamped()).toBe(2)
    const mine = (w.store.get('sessions') as Record<string, { v: string; at: number }>)['session-mine']!
    expect(mine.v).toBe('1.7.0')
    expect(mine.at).toBeGreaterThanOrEqual(NOW + 10 * MINUTE)
  })

  test('the newer window says nothing of an older one, and stamps its own build', async ($, on) => {
    const w = world(on, 'ok', null, true, stamps({ 'session-old': { v: '1.7.0', at: NOW - MINUTE } }))
    w.version = '1.7.1'
    await start($)
    expect(said(w.transcript)).toEqual([])
    expect(said(w.toasts)).toEqual([])
    expect((w.store.get('sessions') as Record<string, unknown>)['session-mine']).toEqual({ v: '1.7.1', at: NOW })
    expect((await learn($, '진단')).text).toContain('\n- 다른 창: 1.7.0 (1분 전)\n')
  })

  test('a newer build stamped two hours ago says nothing', async ($, on) => {
    const w = world(on, 'ok', null, true, stamps({ 'session-new': { v: '1.7.1', at: NOW - 120 * MINUTE } }))
    await start($)
    await learn($, '')
    expect(said(w.transcript)).toEqual([])
    expect(said(w.toasts)).toEqual([])
  })

  test('a plugin.json that cannot be read compares nothing and stamps nothing', async ($, on) => {
    const w = world(on, 'ok', null, true, stamps({ 'session-new': { v: '1.7.1', at: NOW - 3 * MINUTE } }))
    w.version = null
    await start($)
    expect(said(w.transcript)).toEqual([])
    expect(said(w.toasts)).toEqual([])
    expect(Object.keys(w.store.get('sessions') as object)).toEqual(['session-new'])
  })

  test('a store a newer build wrote in a newer layout: the concepts, their marks and steps, the merges and the quiz bank are left alone; notes, the journal and the quiz go on', async ($, on) => {
    const store = new Map<string, unknown>([['schema', 4], ['concepts', THREE_CONCEPTS]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    // No newer window stamped: said all the same, since the concepts stop changing here; with the way on should a
    // reload change nothing (a newer build rolled back).
    expect(said(w.transcript)).toEqual([`learn-notes 새 버전이 다른 창에서 학습 기록을 새 구조로 썼습니다 · 이 창은 1.7.0입니다 · /reload-plugins로 바꿉니다 · ${TAIL} · ${STUCK}`])
    expect(said(w.toasts)).toHaveLength(1)
    w.answer = CONCEPT_NOTE(['클로저', '새 개념'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await pane($)
    await ui.press({ key: 'view-quiz' })
    w.answer = THREE_QUESTIONS
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    await seeAnswer($)
    await ui.press({ key: 'quiz-right' })
    // Graded all the same: only its concept's step stays as the newer build left it.
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘/ })).toBeDefined()
    // A typed answer that shows a slip (1.7.0 D5): graded, its slip neither kept nor promised.
    w.answer = '판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: 꺼내면 복사된다고 봄\n유형: 값과 참조'
    await ui.input({ key: mineKey(store, 1), text: '복사본이 생겨요' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: /^✗ 틀림 2\./ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /헷갈린 점/ })).toBeUndefined()
    await ui.unmount()
    expect((await learn($, '안다 클로저')).text).toBe(BEHIND_TEXT)
    expect((await learn($, '합치기 map = 클로저')).text).toBe(BEHIND_TEXT)
    for (const key of ['concepts', 'known', 'steps', 'quizBank', 'aliases', 'merges', 'schema', 'slips', 'teamTerms']) expect(w.sets).not.toContain(key)
    expect(store.get('concepts')).toEqual(THREE_CONCEPTS)
    expect(store.get('schema')).toBe(4)
    expect(w.sets).toEqual(expect.arrayContaining(['history', 'quiz', 'activity']))
    expect(w.journal()).toHaveLength(1)
    expect(w.writes.some(write => write.path.endsWith('/concepts.md'))).toBe(false)
    expect((await learn($, '진단')).text).toContain('\n- 다른 창: 없음 · 저장소가 새 구조(4, 이 창 3)라 개념 모음과 복습 단계를 고치지 않음\n')
    // Said once, however often the guard held a write back.
    expect(said(w.transcript)).toHaveLength(1)
  })

  test('a newer layout written while this window is open turns the guard on at the next concept write, and says so with the newer build', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    await start($)
    expect(store.get('schema')).toBe(3)
    // A newer build starts in another window.
    store.set('schema', 4)
    store.set('sessions', { ...(store.get('sessions') as object), 'session-new': { v: '1.8.0', at: NOW } })
    w.answer = CONCEPT_NOTE(['클로저'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(store.get('concepts')).toBeUndefined()
    expect(said(w.transcript)).toEqual([`learn-notes 새 버전(1.8.0)이 다른 창에서 쓰이고 있습니다 · 이 창은 1.7.0입니다 · /reload-plugins로 바꿉니다 · ${TAIL}`])
    // The note itself is written and kept as ever.
    expect(w.journal()[0]!.text).toContain('반복문을 바꿨다')
  })

  test('(검토) each newer build is said once: not again when its window goes quiet and comes back, nor for an older one when the newest goes quiet', async ($, on) => {
    const store = stamps({ 'session-new': { v: '1.7.1', at: NOW - MINUTE } }, [['schema', 4]])
    const w = world(on, 'ok', null, true, store)
    const stampOther = (id: string, v: string, at: number) => store.set('sessions', { ...(store.get('sessions') as object), [id]: { v, at } })
    await start($)
    expect(said(w.transcript)).toEqual([`${NOTICE} · ${TAIL}`])
    // The newer window goes quiet (a meeting): 31 minutes on, a turn here ends.
    await w.clock.advance(31 * MINUTE)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // It writes a note again: its stamp is fresh once more.
    stampOther('session-new', '1.7.1', NOW + 31 * MINUTE)
    await w.clock.advance(11 * MINUTE)
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(said(w.transcript)).toHaveLength(1)
    expect(said(w.toasts)).toHaveLength(1)
    // A still newer build opens in a third window: that is news.
    stampOther('session-newest', '1.8.0', NOW + 42 * MINUTE)
    await w.clock.advance(11 * MINUTE)
    await learn($, '')
    expect(said(w.transcript)).toHaveLength(2)
    expect(said(w.transcript)[1]).toStartWith('learn-notes 새 버전(1.8.0)이 다른 창에서 쓰이고 있습니다')
    // It goes quiet while 1.7.1 writes on: nothing more to say.
    await w.clock.advance(31 * MINUTE)
    stampOther('session-new', '1.7.1', NOW + 84 * MINUTE)
    await learn($, '')
    expect(said(w.transcript)).toHaveLength(2)
    expect(said(w.toasts)).toHaveLength(2)
  })

  test('(검토) a -p run says nothing of a newer build, nor of a newer layout', async ($, on) => {
    const w = world(on, 'ok', null, true, stamps({ 'session-new': { v: '1.7.1', at: NOW - 3 * MINUTE } }, [['schema', 4]]))
    await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: false })
    w.answer = CONCEPT_NOTE(['클로저'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(said(w.transcript)).toEqual([])
    expect(said(w.toasts)).toEqual([])
    expect(w.sets).not.toContain('concepts')
  })

  test('(교차 검토 3) a window open before the update hears of it at a turn\'s end, with no /learn', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    await start($)
    // The newer build opens in another window once this one has been open a while.
    await w.clock.advance(11 * MINUTE)
    store.set('sessions', { ...(store.get('sessions') as object), 'session-new': { v: '1.7.1', at: NOW + 11 * MINUTE } })
    await turn($, async () => {})
    await finish(w)
    expect(said(w.transcript)).toEqual([NOTICE])
    expect(said(w.toasts)).toEqual([NOTICE])
  })

  test('(교차 검토 3) a turn\'s end reads the other windows\' stamps at most every ten minutes', async ($, on) => {
    let reads = 0
    const store = new (class extends Map<string, unknown> {
      override get(key: string) {
        if (key === 'sessions') reads += 1
        return super.get(key)
      }
    })()
    const w = world(on, 'ok', null, true, store)
    await start($)
    await w.clock.advance(MINUTE)
    store.set('sessions', { ...(store.get('sessions') as object), 'session-new': { v: '1.7.1', at: NOW + MINUTE } })
    // A minute after the start's look: not read again, nothing said.
    const before = reads
    await turn($, async () => {})
    await finish(w)
    expect(reads).toBe(before)
    expect(said(w.transcript)).toEqual([])
    // Ten minutes on: read, and said.
    await w.clock.advance(10 * MINUTE)
    await turn($, async () => {}, 't2')
    await finish(w)
    expect(reads).toBeGreaterThan(before)
    expect(said(w.transcript)).toEqual([NOTICE])
    expect(said(w.toasts)).toEqual([NOTICE])
  })
})

describe('1.7.0: a note copied for a mentor: c and /learn 공유', () => {
  const COPIED = '노트를 복사했습니다 · 요청과 질문은 빼고 비밀값은 가렸습니다 · 붙이기 전에 읽어 보세요'
  const REPLY = '노트를 클립보드에 복사했습니다 · 붙이기 전에 한 번 읽어 보세요'
  const HERE = '복사할 수 없어 여기에 적습니다 · 길게 눌러 복사하세요'
  // With a mouse (the terminal, Claude Code Desktop, VS Code) there is nothing to press long (검토).
  const HERE_MOUSE = '복사할 수 없어 여기에 적습니다 · 마우스로 끌어 골라 복사하세요'
  // What /learn 공유 answers when the note went in the transcript instead; a chat channel or a -p run reads the note in the reply.
  const LOGGED = '복사할 수 없어 노트를 흐린 줄로 적었습니다 · 그 줄은 Claude에게 가지 않습니다'
  const HERE_REPLY = '복사할 수 없어 여기에 적습니다 · 붙이기 전에 한 번 읽어 보세요'
  const REQUEST = '/home/u/work/shop/src/a.ts의 b를 상수로 바꿔 줘'

  async function written($: Engine, w: World) {
    await start($)
    w.answer = CONCEPT_NOTE(['반복문'])
    await turn($, () => $.tool.call(EDIT_A), 't1', REQUEST)
    await finish(w)
  }

  /** What a copy for a mentor never holds: the request, a question asked under the note, the diff, where the project lies. */
  function expectShareable(text: string) {
    expect(text).not.toContain('상수로 바꿔 줘')
    expect(text).not.toContain('/home/u')
    expect(text).not.toContain('/proj')
    expect(text).not.toContain('+const b = 2')
    expect(text).not.toContain('쉬운 말로 다시 쓴 답')
  }

  test('c under a written note copies it with no request, question, path or diff, and a toast says what was left out; no model call', async ($, on) => {
    const w = world(on)
    await written($, w)
    const ui = await pane($)
    // A question asked under the note stays out of the copy.
    w.answer = '쉬운 말로 다시 쓴 답'
    await ui.press({ key: 'easier' })
    await w.clock.settle()
    const calls = w.models.length
    const share = await ui.find({ type: 'Button', key: 'share', text: '복사' })
    expect(share?.props).toMatchObject({ hotkey: 'c', dimColor: true })
    await ui.press({ key: 'share' })
    await w.clock.settle()
    expect(w.toasts.at(-1)).toBe(COPIED)
    expect(w.copied).toHaveLength(1)
    const text = w.copied[0]!
    expect(text.split('\n').slice(0, 2)).toEqual(['**[학습 노트] 반복문을 바꿨다**', `${stamp(NOW).day.slice(5)} · 파일 1개 · 개념: 반복문`])
    expect(text).toContain('**배울 개념**\n- **반복문**: 반복문에 대한 설명 — `for (const item of items)`')
    expect(text.endsWith('\n\n**묻고 싶은 것**: ')).toBe(true)
    expectShareable(text)
    expect(w.models).toHaveLength(calls)
    await ui.unmount()
  })

  test('where nothing can be copied, c leaves the same text in the transcript as a dim line, never sent to the model', async ($, on) => {
    const w = world(on)
    await written($, w)
    w.copyFails = true
    const ui = await pane($)
    await ui.press({ key: 'share' })
    await w.clock.settle()
    expect(w.copied).toEqual([])
    expect(w.toasts).not.toContain(COPIED)
    const line = w.transcript.at(-1) ?? ''
    expect(line.split('\n').slice(0, 3)).toEqual([HERE_MOUSE, '', '**[학습 노트] 반복문을 바꿨다**'])
    expectShareable(line)
    await ui.unmount()
    // A terminal that refused the copy is a fault the diagnosis names.
    w.copyFails = false
    expect((await learn($, '진단')).text).toContain('클립보드 복사 · 복사 안 됨(no-clipboard)')
  })

  test('a cloud session has no clipboard to write: c, and /learn 공유, write the note in the transcript there', async ($, on) => {
    const w = world(on, 'ok', null, true, new Map(), { CLAUDE_CODE_REMOTE: 'true' })
    await written($, w)
    const ui = await pane($)
    await ui.press({ key: 'share' })
    await w.clock.settle()
    expect(w.copied).toEqual([])
    expect(w.transcript.at(-1)).toMatch(new RegExp(`^${HERE_MOUSE}\\n\\n\\*\\*\\[학습 노트\\] 반복문을 바꿨다\\*\\*`))
    await ui.unmount()
    // /learn 공유 there leaves the same dim line, and answers in one line: the note never goes to the model (검토).
    const lines = w.transcript.length
    const reply = (await learn($, '공유')).text ?? ''
    expect(reply).toBe(LOGGED)
    expect(w.transcript.slice(lines)).toHaveLength(1)
    expect(w.transcript.at(-1)?.split('\n').slice(0, 3)).toEqual([HERE_MOUSE, '', '**[학습 노트] 반복문을 바꿨다**'])
    expectShareable(w.transcript.at(-1) ?? '')
    expect(w.copied).toEqual([])
  })

  test('a press from the mobile app is copied there when its app takes copies, else leaves the note in the transcript; no fault either way', async ($, on) => {
    const w = world(on)
    await written($, w)
    const ui = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    await ui.press({ key: 'share' })
    await w.clock.settle()
    expect(w.copiedOn).toEqual(['mobile'])
    expect(w.toasts.at(-1)).toBe(COPIED)
    // An app that does not answer a copy yet.
    w.clipless = ['mobile']
    await ui.press({ key: 'share' })
    await w.clock.settle()
    expect(w.copied).toHaveLength(1)
    expect(w.transcript.at(-1)?.split('\n')[0]).toBe(HERE)
    await ui.unmount()
    expect((await learn($, '진단')).text).not.toContain('클립보드 복사')
  })

  test('/learn 공유 copies the note picked in the pane, else the last; 마지막 and last are the same; the reply is one line', async ($, on) => {
    const w = world(on)
    await written($, w)
    w.answer = NOTE_TEXT
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2', '둘째 요청')
    await finish(w)
    for (const words of ['공유', 'share', '마지막', 'last']) {
      expect((await learn($, words)).text).toBe(REPLY)
      expect(w.copied.at(-1)).toContain('**[학습 노트] let을 const로 바꿔 값이 다시 바뀌지 않게 했다**')
    }
    const ui = await pane($)
    await ui.press({ key: 'prev' })
    await ui.unmount()
    expect((await learn($, '공유')).text).toBe(REPLY)
    expect(w.copied.at(-1)).toContain('**[학습 노트] 반복문을 바꿨다**')
    expectShareable(w.copied.at(-1) ?? '')
    expect(w.copied).toHaveLength(5)
  })

  test('/learn 공유 from Remote Control leaves the note in the transcript, a chat channel reads it in the reply; a note with no text yet, or none, says so', async ($, on) => {
    const w = world(on, 'error')
    await start($)
    expect((await learn($, '공유')).text).toBe('아직 학습 노트가 없습니다. Claude가 파일을 고친 턴이 끝나면 생깁니다.')
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // While it waits for its try again (1.7.0), and once that failed too.
    expect((await learn($, '공유')).text).toBe('이 노트는 아직 복사할 글이 없습니다 · 서버가 붐벼 30초 뒤 한 번 더 씁니다… · 패널에서 w로 바로 쓰기')
    await w.clock.advance(40_000)
    expect((await learn($, '공유')).text).toBe('이 노트는 아직 복사할 글이 없습니다 · 노트를 쓰지 못했습니다: 서버가 붐빕니다 · w로 다시 쓰기')
    w.model = 'ok'
    w.answer = CONCEPT_NOTE(['반복문'])
    const ui = await pane($)
    await ui.press({ key: 'write' })
    await w.clock.settle()
    await ui.unmount()
    const away = (origin: { kind: 'bridge' } | { kind: 'channel'; server: string } | { kind: 'slack-ping' }) => $.command.run({ command: 'learn', args: '공유', origin, presentation: { isFullscreen: true, columns: 160 } })
    // Remote Control draws the transcript on the phone: a dim line there, never the model's to read (검토).
    expect((await away({ kind: 'bridge' })).text).toBe(LOGGED)
    expect(w.transcript.at(-1)?.split('\n').slice(0, 3)).toEqual([HERE, '', '**[학습 노트] 반복문을 바꿨다**'])
    // A chat channel or a Slack ping sees the reply alone: the note goes there.
    for (const origin of [{ kind: 'channel' as const, server: 'slack' }, { kind: 'slack-ping' as const }]) {
      expect((await away(origin)).text?.split('\n').slice(0, 3)).toEqual([HERE_REPLY, '', '**[학습 노트] 반복문을 바꿨다**'])
    }
    expect(w.copied).toEqual([])
  })

  test('(검토) /learn 공유 at a terminal that refused the copy leaves the note as a dim line for the mouse; a -p run reads it in the reply', async ($, on) => {
    const w = world(on)
    await written($, w)
    w.copyFails = true
    expect((await learn($, '공유')).text).toBe(LOGGED)
    expect(w.transcript.at(-1)?.split('\n').slice(0, 3)).toEqual([HERE_MOUSE, '', '**[학습 노트] 반복문을 바꿨다**'])
    await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: false })
    const lines = w.transcript.length
    const reply = (await $.command.run({ command: 'learn', args: '공유', origin: { kind: 'sdk' }, presentation: { isFullscreen: false, columns: 80 } })).text ?? ''
    expect(reply.split('\n').slice(0, 3)).toEqual([HERE_REPLY, '', '**[학습 노트] 반복문을 바꿨다**'])
    expectShareable(reply)
    expect(w.transcript).toHaveLength(lines)
  })

  test('(검토) c copies on the surface the press came from; Claude Code Desktop or VS Code that takes no copy leaves a dim line, and no fault', async ($, on) => {
    const w = world(on)
    await written($, w)
    for (const surface of ['desktop', 'terminal'] as const) {
      const ui = await pane($, surface)
      await ui.press({ key: 'share' })
      await w.clock.settle()
      await ui.unmount()
    }
    expect(w.copiedOn).toEqual(['desktop', 'terminal'])
    w.clipless = ['desktop', 'vscode']
    for (const surface of ['desktop', 'vscode'] as const) {
      const ui = await $.ui.mount({ plugin: 'learn-notes', surface, component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
      await ui.press({ key: 'share' })
      await w.clock.settle()
      expect(w.transcript.at(-1)?.split('\n')[0]).toBe(HERE_MOUSE)
      await ui.unmount()
    }
    expect(w.copied).toHaveLength(2)
    expect((await learn($, '진단')).text).not.toContain('클립보드 복사')
  })

  test('(검토) a note longer than a terminal draws of one line goes in as several, each drawn whole, the blank to ask in last', async ($, on) => {
    const w = world(on)
    await start($)
    const reasons = Array.from({ length: 60 }, (_, i) => `- ${i + 1}번째 이유를 길게 적은 줄입니다 · 같은 말을 되풀이해 노트의 길이를 채웁니다`)
    w.answer = ['### 한 줄 요약', '긴 노트를 썼다', '### 왜 이렇게 바꿨을까', ...reasons, '### 배울 개념', '- **반복문**: 반복문에 대한 설명 — `for (const item of items)`'].join('\n')
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect((await learn($, '공유')).text).toBe(REPLY)
    const whole = w.copied.at(-1) ?? ''
    expect(whole.length).toBeGreaterThan(2000)
    w.copyFails = true
    const ui = await pane($)
    const lines = w.transcript.length
    await ui.press({ key: 'share' })
    await w.clock.settle()
    await ui.unmount()
    const parts = w.transcript.slice(lines)
    expect(parts.length).toBeGreaterThan(1)
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(2000)
    expect(parts[0]!.split('\n')[0]).toBe(HERE_MOUSE)
    expect(parts.at(-1)!.endsWith('**묻고 싶은 것**: ')).toBe(true)
    expect(parts.join('').replace(/\s+/g, '')).toBe(`${HERE_MOUSE}${whole}`.replace(/\s+/g, ''))
  })

  test("(검토) the second line names each concept the note taught, one the index never counted (the guard was on) by the note's own name", async ($, on) => {
    const w = world(on, 'ok', null, true, new Map<string, unknown>([['schema', 4], ['concepts', THREE_CONCEPTS]]))
    await start($)
    w.answer = CONCEPT_NOTE(['클로저', '새 개념'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect((await learn($, '공유')).text).toBe(REPLY)
    expect(w.copied.at(-1)?.split('\n')[1]).toBe(`${stamp(NOW).day.slice(5)} · 파일 1개 · 개념: 클로저 · 새 개념`)
  })
})

describe('1.7.0: notes that do not get lost: one try again, a reload taken up, the account limit yielded to', () => {
  const BUSY: Reply = { status: 529, error: 'overloaded' }
  const WAITING = '서버가 붐벼 30초 뒤 한 번 더 씁니다… · w로 바로 쓰기'
  const NO_TEXT = '이 노트는 아직 복사할 글이 없습니다 · '
  const usageOf = (w: World) => Object.values(w.store.get('usage') as Record<string, { calls: number; auto: number }>)[0]
  const storedNotes = (w: World) => (w.store.get('history') as Record<string, { notes: Record<string, unknown>[] }>)['/proj']!.notes
  const diag = async ($: Engine) => (await learn($, '진단')).text ?? ''

  test('a busy server: the note waits half a minute in yellow, then writes itself; two calls, one toward the day\'s limit', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = [BUSY, 'ok']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.models).toHaveLength(1)
    const ui = await pane($)
    expect((await ui.find({ type: 'Text', text: WAITING }))?.props.color).toBe('yellow')
    expect(await ui.find({ type: 'Button', key: 'write', text: '바로 쓰기' })).toBeDefined()
    // The journal waits for the try again; the store holds the note as being written (a session ending meanwhile
    // leaves it to the next, journalLeft), never as one the journal refused.
    expect(w.journal()).toHaveLength(0)
    expect(storedNotes(w)[0]).toMatchObject({ status: 'writing' })
    expect(storedNotes(w)[0]!.isUnsaved).toBeUndefined()
    await w.clock.advance(35_000)
    expect(w.models).toHaveLength(2)
    expect(w.models[1]).toBe(w.models[0])
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    await ui.unmount()
    expect(w.journal()).toHaveLength(1)
    expect(w.journal()[0]!.text).toContain('let을 const로')
    expect(w.journal()[0]!.text).not.toContain('다시 쓴 노트')
    expect(storedNotes(w)[0]).toMatchObject({ status: 'ready', isUnsaved: false })
    expect(storedNotes(w)[0]!.retry).toBeUndefined()
    expect(usageOf(w)).toMatchObject({ calls: 2, auto: 1 })
    expect(await diag($)).toContain('노트 쓰기 · 서버 붐빔(529) · 다시 써서 됨')
  })

  test('busy again on the try again: the red line as before, and exactly two calls however long it waits', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = [BUSY, BUSY]
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    await w.clock.advance(10 * 60_000)
    expect(w.models).toHaveLength(2)
    const ui = await pane($)
    expect((await ui.find({ type: 'Text', text: /^노트를 쓰지 못했습니다: 서버가 붐빕니다 · w로 다시 쓰기$/ }))?.props.color).toBe('red')
    expect(await ui.find({ type: 'Button', key: 'write', text: '다시 쓰기' })).toBeDefined()
    await ui.unmount()
    expect(w.journal()[0]!.text).toContain('_노트를 쓰지 못했다: 서버가 붐빕니다 · w로 다시 쓰기_')
    expect(await diag($)).toContain('노트 쓰기 · 서버 붐빔(529) ×2')
  })

  test('(교차 검토) a note cleared while it waits for its try again reaches the journal, failed as before 1.7.0, with no more calls', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = [BUSY, 'ok']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.journal()).toHaveLength(0)
    expect((await learn($, 'clear 확인')).text).toContain('일지 파일과 배운 개념 모음은 그대로입니다')
    expect(w.journal()).toHaveLength(1)
    expect(w.journal()[0]!.text).toContain('+const b = 2')
    expect(w.journal()[0]!.text).toContain('_노트를 쓰지 못했다: 서버가 붐빕니다 · w로 다시 쓰기_')
    // Its timer went with it: no try again for a note no pane shows, and the journal has it once.
    await w.clock.advance(40_000)
    expect(w.models).toHaveLength(1)
    await $.session.end({ reason: 'prompt_input_exit', sessionId: 's1', resume: { id: 's1' } })
    await start($)
    await w.clock.advance(10 * 60_000)
    expect(w.models).toHaveLength(1)
    expect(w.journal()).toHaveLength(1)
    expect((await learn($, 'clear')).text).toBe('패널에 비울 노트가 없습니다.')
  })

  test('a server error, a dropped connection and the time limit wait too, each saying why; a second drop asks for the connection', async ($, on) => {
    const w = world(on)
    await start($)
    const cases: { first: Reply; wait: string; failed: string }[] = [
      { first: { status: 502, error: 'server_error' }, wait: '서버 오류로 30초 뒤 한 번 더 씁니다… · w로 바로 쓰기', failed: '서버 오류입니다 (502) · w로 다시 쓰기' },
      { first: { status: null, error: 'unknown' }, wait: '연결이 끊겨 30초 뒤 한 번 더 씁니다… · w로 바로 쓰기', failed: '인터넷 연결을 확인하세요 · 연결되면 w로 다시 쓰기' },
      { first: 'timeout', wait: '시간이 너무 걸려 30초 뒤 한 번 더 씁니다… · w로 바로 쓰기', failed: '시간이 너무 걸려 멈췄습니다 · w로 다시 쓰기' },
    ]
    for (const [i, one] of cases.entries()) {
      const isSlow = one.first === 'timeout'
      w.replies = [one.first, one.first]
      await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: `u${i}` }), `t${i}`)
      await finish(w)
      // The call runs out its own 90 seconds first.
      if (isSlow) await w.clock.advance(90_000)
      const ui = await pane($)
      expect(await ui.find({ type: 'Text', text: one.wait })).toBeDefined()
      await ui.unmount()
      await w.clock.advance(isSlow ? 130_000 : 40_000)
      expect(w.models).toHaveLength(2 * (i + 1))
      expect((await learn($, '공유')).text).toBe(`${NO_TEXT}노트를 쓰지 못했습니다: ${one.failed}`)
    }
    expect(await diag($)).toContain('노트 쓰기 · 시간 초과 ×2')
  })

  test('not tried again, each saying what to do: the shared request limit, a login, a bill, a model this account lacks', { options: { model: 'sonnet' } }, async ($, on) => {
    const w = world(on)
    await start($)
    const cases: [Reply, string][] = [
      [{ status: 429, error: 'rate_limit' }, '요청 한도에 걸렸습니다 · 잠시 뒤 w로 다시 쓰기'],
      [{ status: 401, error: 'authentication_failed' }, '로그인이 필요합니다 (/login) · 로그인 뒤 w로 다시 쓰기'],
      [{ status: 402, error: 'billing_error' }, '계정의 사용 한도나 결제 문제입니다 · 관리자에게 알려 주세요'],
      [{ status: 404, error: 'model_not_found' }, "이 계정에서 'sonnet' 모델을 쓸 수 없습니다 · /config에서 haiku를 골라 보세요"],
    ]
    for (const [i, [reply, text]] of cases.entries()) {
      w.replies = [reply]
      await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: `u${i}` }), `t${i}`)
      await finish(w)
      await w.clock.advance(60_000)
      // One call each: a try again would have found the model answering.
      expect(w.models).toHaveLength(i + 1)
      expect((await learn($, '공유')).text).toBe(`${NO_TEXT}노트를 쓰지 못했습니다: ${text}`)
    }
    const reply = await diag($)
    for (const label of ['요청 한도(429)', '로그인 필요(401)', '결제 문제(402)', '모델 없음(404)']) expect(reply).toContain(label)
  })

  test('a call cut short (a reload unloading the plugin) is not tried again: the note stays as being written for the next load to take up', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = ['cut']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(1)
    // Nothing saved from the cut write: the next load writes the note and saves it once.
    expect(w.journal()).toHaveLength(0)
    expect((await learn($, '공유')).text).toBe(`${NO_TEXT}노트를 쓰다 멈췄습니다 · 패널에서 w로 다시 쓰기`)
    const ui = await pane($)
    expect((await ui.find({ type: 'Text', text: '노트를 쓰다 멈췄습니다 · w로 다시 쓰기' }))?.props.color).toBe('yellow')
    await ui.unmount()
    expect(await diag($)).toContain('노트 쓰기 · 시간 초과·끊김')
    // The reload's session start.
    await start($)
    await w.clock.advance(5)
    expect(w.models).toHaveLength(2)
    expect(w.journal()).toHaveLength(1)
    expect(w.journal()[0]!.text).toContain('let을 const로')
    expect(usageOf(w)).toMatchObject({ calls: 2 })
  })

  test('(교차 검토 7) a reload more than ten minutes after the turn ended takes up nothing: the cut note fails as cut', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = ['cut']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.models).toHaveLength(1)
    // Only a note being written up to ten minutes ago is taken up (isResumable with the reload's now).
    await w.clock.advance(11 * 60_000)
    await start($)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(1)
    expect((await learn($, '공유')).text).toBe(`${NO_TEXT}노트를 쓰지 못했습니다: 중간에 끊겨 멈췄습니다 · w로 다시 쓰기`)
    expect(w.journal()).toHaveLength(1)
    expect(w.journal()[0]!.text).toContain('_노트를 쓰지 못했다: 중간에 끊겨 멈췄습니다 · w로 다시 쓰기_')
  })

  test('a reload takes up a note only while the day has room: it is written as a turn\'s end would write it', { options: { dailyAutoNotes: 1 } }, async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = ['cut']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // The cut call counted toward the day's one: the reload leaves the note for w, saying it was cut, and journals its code.
    await start($)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(1)
    expect((await learn($, '공유')).text).toBe(`${NO_TEXT}노트를 쓰지 못했습니다: 중간에 끊겨 멈췄습니다 · w로 다시 쓰기`)
    expect(w.journal()).toHaveLength(1)
    expect(w.journal()[0]!.text).toContain('_노트를 쓰지 못했다: 중간에 끊겨 멈췄습니다 · w로 다시 쓰기_')
  })

  test('with automatic notes off a reload takes up nothing: a w the reload cut says it was cut, for the next w', { options: { autoNote: false } }, async ($, on) => {
    const w = world(on)
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    w.replies = ['cut']
    const ui = await pane($)
    await ui.press({ key: 'write' })
    await w.clock.settle()
    await ui.unmount()
    await start($)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(1)
    expect((await learn($, '공유')).text).toBe(`${NO_TEXT}노트를 쓰지 못했습니다: 중간에 끊겨 멈췄습니다 · w로 다시 쓰기`)
    // The journal had the note's code already (as one not written by itself): not again.
    expect(w.journal()).toHaveLength(1)
  })

  test('a -p run tries no note again: its process ends with its turn', async ($, on) => {
    const w = world(on)
    await $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
    w.replies = [BUSY]
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(1)
    expect((await learn($, '공유')).text).toContain('노트를 쓰지 못했습니다: 서버가 붐빕니다 · w로 다시 쓰기')
    expect(w.journal()[0]!.text).toContain('_노트를 쓰지 못했다: 서버가 붐빕니다')
  })

  test('w while it waits writes the note at once, and the timer makes no second call; the learner\'s call is not the day\'s', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = [BUSY]
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await pane($)
    await w.clock.advance(5_000)
    await ui.press({ key: 'write' })
    await w.clock.settle()
    expect(w.models).toHaveLength(2)
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(2)
    await ui.unmount()
    expect(usageOf(w)).toMatchObject({ calls: 2, auto: 1 })
  })

  test('a reload while it waits takes the note up by itself, the pane saying so; once, past the day\'s limit (it is the try again)', { options: { dailyAutoNotes: 1 } }, async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = [BUSY]
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(w.models).toHaveLength(1)
    // A reload (/reload-plugins, a /config change) starts the session again with the pane's notes as they were.
    w.model = 'hold'
    await start($)
    await w.clock.advance(1)
    expect(w.models).toHaveLength(2)
    const ui = await pane($)
    expect((await ui.find({ type: 'Text', text: '다시 불러온 뒤 이어서 씁니다…' }))?.props.color).toBe('cyan')
    expect(await ui.find({ type: 'Button', key: 'write', text: '쓰는 중…' })).toBeDefined()
    w.release()
    await w.clock.settle()
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    await ui.unmount()
    // The old timer finds it written; a later reload takes up nothing.
    await w.clock.advance(60_000)
    await start($)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(2)
    expect(usageOf(w)).toMatchObject({ calls: 2, auto: 1 })
  })

  test('past 90% of the five-hour window a turn\'s end yields its note: no call, a yellow line, a toast once a day; w writes it', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const LINE = 'Claude 사용 한도(5시간)를 90% 넘게 써서 자동 노트를 미뤘습니다'
    w.limits = [{ kind: 'five_hour', percentUsed: 93 }, { kind: 'seven_day', percentUsed: 40 }]
    for (const id of ['t1', 't2']) {
      await turn($, () => $.tool.call(EDIT_A), id)
      await finish(w)
    }
    expect(w.models).toHaveLength(0)
    expect(w.toasts.filter(text => text.includes('사용 한도'))).toEqual([`학습 노트: ${LINE} · 패널에서 w를 누르면 씁니다`])
    expect(store.get('quotaToast')).toBe(stamp(NOW).day)
    expect(storedNotes(w).map(note => [note.status, note.skip, note.quota])).toEqual([
      ['off', 'quota', 'five_hour'],
      ['off', 'quota', 'five_hour'],
    ])
    expect(w.journal().at(-1)!.text).toContain('_Claude 사용 한도를 거의 다 써서 노트 없이 전후 코드만 남겼다._')
    // The next turn's live line promises no note.
    await $.turn.start({ text: '또 고쳐줘', turnId: 't3' })
    await $.tool.call(EDIT_A)
    const live = await pane($)
    expect(await live.find({ type: 'Text', text: /● 작업 중: 파일 1개/ })).toBeDefined()
    expect(await live.find({ type: 'Text', text: /턴이 끝나면 노트를 씁니다/ })).toBeUndefined()
    await live.unmount()
    await $.turn.complete({ answer: '바꿨습니다', durationMs: 5, isAborted: false, turnId: 't3', reason: 'answer' })
    await finish(w)
    const ui = await pane($)
    expect((await ui.find({ type: 'Text', text: `${LINE} · w를 누르면 씁니다` }))?.props.color).toBe('yellow')
    await ui.press({ key: 'write' })
    await w.clock.settle()
    expect(w.models).toHaveLength(1)
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    await ui.unmount()
    expect(storedNotes(w).at(-1)!.skip).toBeUndefined()
    expect(storedNotes(w).at(-1)!.quota).toBeUndefined()
    // With room again the turn's end writes its note.
    w.limits = [{ kind: 'five_hour', percentUsed: 20 }]
    await turn($, () => $.tool.call(EDIT_A), 't4')
    await finish(w)
    expect(w.models).toHaveLength(2)
  })

  test('past 95% of the seven-day window it yields too, naming that window; 94%, or an API key\'s session (no windows), writes', async ($, on) => {
    const w = world(on)
    await start($)
    w.limits = [{ kind: 'seven_day', percentUsed: 96 }]
    await turn($, () => $.tool.call(EDIT_A), 't1')
    await finish(w)
    expect(w.models).toHaveLength(0)
    expect((await learn($, '공유')).text).toBe(`${NO_TEXT}Claude 사용 한도(7일)를 95% 넘게 써서 자동 노트를 미뤘습니다 · 패널에서 w로 쓰기`)
    w.limits = [{ kind: 'seven_day', percentUsed: 94 }]
    await turn($, () => $.tool.call(EDIT_A), 't2')
    await finish(w)
    expect(w.models).toHaveLength(1)
    w.limits = []
    await turn($, () => $.tool.call(EDIT_A), 't3')
    await finish(w)
    expect(w.models).toHaveLength(2)
  })

  test('with automatic notes off nothing yields: the note reads as off, and no toast names the account\'s limit', { options: { autoNote: false } }, async ($, on) => {
    const w = world(on)
    await start($)
    w.limits = [{ kind: 'five_hour', percentUsed: 99 }]
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect((await learn($, '공유')).text).toBe(`${NO_TEXT}자동 노트가 꺼져 있습니다`)
    expect(w.toasts.filter(text => text.includes('사용 한도'))).toEqual([])
  })

  test('the next session keeps why a note yielded; one left waiting for its try again reads as failed and is never taken up there', async ($, on) => {
    const stored = (id: string, at: number, extra: Record<string, unknown>) => ({
      id, turnId: id, at, prompt: '요청', answer: '', changes: [], moreFiles: 0, text: '', savedAs: 'off', isPast: false, root: '/proj', updatedAt: at, concepts: [], ...extra,
    })
    const history = {
      '/proj': {
        at: NOW,
        notes: [
          stored('n1', NOW - 3000, { status: 'off', skip: 'quota', quota: 'seven_day' }),
          stored('n2', NOW - 2000, { status: 'off', skip: 'quota', quota: 'month' }),
          stored('n3', NOW - 1000, { status: 'writing', retry: { at: NOW, token: 'x', why: 'overloaded' }, resumed: true }),
        ],
      },
    }
    const w = world(on, 'ok', null, true, new Map<string, unknown>([['history', history]]))
    await start($)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(0)
    const ui = await pane($)
    expect(await ui.find({ type: 'Text', text: /세션이 끝나 노트를 다 쓰지 못했습니다 · w로 다시 쓰기/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'write', text: '다시 쓰기' })).toBeDefined()
    await ui.press({ key: 'prev' })
    // A window this build does not know reads as the five-hour one.
    expect(await ui.find({ type: 'Text', text: 'Claude 사용 한도(5시간)를 90% 넘게 써서 자동 노트를 미뤘습니다 · w를 누르면 씁니다' })).toBeDefined()
    await ui.press({ key: 'prev' })
    expect(await ui.find({ type: 'Text', text: 'Claude 사용 한도(7일)를 95% 넘게 써서 자동 노트를 미뤘습니다 · w를 누르면 씁니다' })).toBeDefined()
    await ui.unmount()
  })

  test('(검토) a pane open all along shows the wait in yellow however slow the store is, then the note', async ($, on) => {
    const w = world(on)
    await start($)
    const ui = await pane($)
    w.replies = [BUSY, 'ok']
    await turn($, () => $.tool.call(EDIT_A))
    // The store takes its time with the waiting note: the pane is drawn again while that write is still on.
    let letGo = () => {}
    w.historyHold = new Promise<void>(resolve => {
      letGo = resolve
    })
    await w.clock.advance(5)
    w.historyHold = null
    letGo()
    await w.clock.settle()
    await w.clock.advance(5_000)
    expect((await ui.find({ type: 'Text', text: WAITING }))?.props.color).toBe('yellow')
    expect(await ui.find({ type: 'Text', text: '노트를 쓰는 중입니다…' })).toBeUndefined()
    expect(await ui.find({ type: 'Button', key: 'write', text: '바로 쓰기' })).toBeDefined()
    await w.clock.advance(35_000)
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    await ui.unmount()
  })

  test('(검토) a note waiting for its try again is no note the journal refused: a reload meanwhile says nothing, 진단 counts none', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = [BUSY, 'ok']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(storedNotes(w)[0]!.isUnsaved).toBeUndefined()
    expect(await diag($)).toContain('- 일지: 못 쓴 노트 없음')
    const checks = () => w.transcript.filter(line => line.startsWith('learn-notes 점검'))
    await start($)
    await w.clock.advance(5)
    expect(checks()).toEqual([])
    expect(w.journal()).toHaveLength(1)
    // The day's one check line is still there for a save the journal really refuses.
    w.writeFails = true
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    w.writeFails = false
    await start($)
    await w.clock.settle()
    expect(checks()).toHaveLength(1)
    expect(checks()[0]).toContain('일지에 아직 못 쓴 노트 1개')
  })

  test('(검토) the next session journals a note a session left being written: quietly, once, as one not written; never one another window may still write', async ($, on) => {
    const change = { file: 'src/a.ts', path: '/proj/src/a.ts', tool: 'Edit', kind: 'update', added: 1, removed: 1, diff: '@@ -1,1 +1,1 @@\n-let b = 2\n+const b = 2', isCut: false }
    const stored = (id: string, at: number, extra: Record<string, unknown> = {}) => ({
      id, turnId: id, at, prompt: `요청 ${id}`, answer: '', changes: [change], moreFiles: 0, status: 'writing', text: '', savedAs: null, isPast: false, root: '/proj', updatedAt: at, concepts: [], ...extra,
    })
    const history = {
      '/proj': {
        at: NOW,
        notes: [
          // Older than a day: as it was (no notes of before 1.7.0 go into old journals).
          stored('old', NOW - 3 * 86_400_000),
          // A rewrite: the journal has the note already.
          stored('rewrite', NOW - 40 * 60_000, { savedAs: 'ready' }),
          // The session ended while it waited for its try again, half an hour ago.
          stored('waited', NOW - 30 * 60_000, { retry: { at: NOW - 29 * 60_000, token: 'x', why: 'overloaded' } }),
          // Left a minute ago: another window may still be writing these.
          stored('fresh', NOW - 60_000),
          stored('other', NOW - 30_000),
        ],
      },
    }
    const w = world(on, 'ok', null, true, new Map<string, unknown>([['history', history]]))
    await start($)
    await w.clock.settle()
    const asked = () =>
      [...w.files.entries()]
        .filter(([path]) => path.startsWith(`${NOTES_DIR}/`) && !path.endsWith('/concepts.md'))
        .flatMap(([, text]) => text.split('\n').filter(line => line.startsWith('**요청**')))
        .sort()
    expect(asked()).toEqual(['**요청**: 요청 waited'])
    // The other window writes its note meanwhile (that window keeps no journal): its newer copy says so, and the
    // note stays that window's to journal or not.
    const live = (w.store.get('history') as Record<string, { notes: Record<string, unknown>[] }>)['/proj']!.notes.find(note => note.id === 'other')!
    Object.assign(live, { status: 'ready', text: NOTE_TEXT, updatedAt: NOW + 1000 })
    await w.clock.advance(15 * 60_000)
    expect(asked()).toEqual(['**요청**: 요청 fresh', '**요청**: 요청 waited'])
    const text = [...w.files.values()].join('\n')
    expect(text).toContain('_노트를 쓰지 못했다: 세션이 끝나 노트를 다 쓰지 못했습니다 · w로 다시 쓰기_')
    expect(text).toContain('+const b = 2')
    expect(w.transcript.filter(line => line.startsWith('learn-notes 점검'))).toEqual([])
    expect(await diag($)).toContain('- 일지: 못 쓴 노트 없음')
    const notes = storedNotes(w)
    expect(notes.find(note => note.id === 'waited')).toMatchObject({ status: 'failed', savedAs: 'failed' })
    expect(notes.find(note => note.id === 'fresh')).toMatchObject({ status: 'failed', savedAs: 'failed' })
    expect(notes.find(note => note.id === 'other')).toMatchObject({ status: 'ready', savedAs: null })
    // Once: a later start journals none again.
    await start($)
    await w.clock.advance(10 * 60_000)
    expect(asked()).toEqual(['**요청**: 요청 fresh', '**요청**: 요청 waited'])
  })

  test('(검토) a note a reload leaves and does not take up fails as cut, and the journal keeps its code now', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = ['cut', 'cut']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // The first reload takes it up, and a second cuts that call too: never taken up twice.
    await start($)
    await w.clock.advance(5)
    expect(w.models).toHaveLength(2)
    await start($)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(2)
    expect((await learn($, '공유')).text).toBe(`${NO_TEXT}노트를 쓰지 못했습니다: 중간에 끊겨 멈췄습니다 · w로 다시 쓰기`)
    expect(w.journal()).toHaveLength(1)
    expect(w.journal()[0]!.text).toContain('_노트를 쓰지 못했다: 중간에 끊겨 멈췄습니다 · w로 다시 쓰기_')
    expect(w.journal()[0]!.text).toContain('+const b = 2')
    expect(storedNotes(w)[0]).toMatchObject({ status: 'failed', savedAs: 'failed' })
  })

  test('(검토) a reload that cuts the try again takes it up as that try: one more call, outside the day\'s limit, never a third try', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = [BUSY, 'cut', BUSY, BUSY]
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    await w.clock.advance(36_000)
    expect(w.models).toHaveLength(2)
    await start($)
    await w.clock.advance(5)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(3)
    expect(usageOf(w)).toMatchObject({ calls: 3, auto: 1 })
    expect((await learn($, '공유')).text).toBe(`${NO_TEXT}노트를 쓰지 못했습니다: 서버가 붐빕니다 · w로 다시 쓰기`)
  })

  test('(검토) a note a reload took up keeps that mark through its try again: a second reload does not take it up again', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = ['cut', BUSY, 'cut', BUSY, 'ok']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    await start($)
    await w.clock.advance(5)
    expect(w.models).toHaveLength(2)
    // Its try again says it is written again, not taken up after a reload.
    w.model = 'hold'
    const ui = await pane($)
    await w.clock.advance(36_000)
    expect(w.models).toHaveLength(3)
    await ui.unmount()
    await start($)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(3)
    expect(usageOf(w)).toMatchObject({ calls: 3, auto: 2 })
    expect((await learn($, '공유')).text).toBe(`${NO_TEXT}노트를 쓰지 못했습니다: 중간에 끊겨 멈췄습니다 · w로 다시 쓰기`)
  })

  test('(검토) a /cd while it waits: the try again still comes, into its own project\'s journal and store', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = [BUSY, 'ok']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    w.root = '/other'
    await turn($, async () => {}, 't2', '다른 프로젝트에서 질문')
    await w.clock.advance(40_000)
    expect(w.models).toHaveLength(2)
    expect(w.journal()).toHaveLength(1)
    expect(w.journal()[0]!.path).toBe(JOURNAL)
    expect(w.journal()[0]!.text).toContain('let을 const로')
    expect(storedNotes(w)[0]).toMatchObject({ status: 'ready', savedAs: 'ready' })
    w.root = '/proj'
    await turn($, async () => {}, 't3', '돌아왔어')
    const ui = await pane($)
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    await ui.unmount()
  })

  test('(검토) a /cd away and back while it waits: the try again writes the note in the pane it is back in', async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = [BUSY, 'ok']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    w.root = '/other'
    await turn($, async () => {}, 't2', '다른 프로젝트에서 질문')
    w.root = '/proj'
    await turn($, async () => {}, 't3', '돌아왔어')
    await w.clock.advance(40_000)
    expect(w.models).toHaveLength(2)
    const ui = await pane($)
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    await ui.unmount()
    expect(w.journal()).toHaveLength(1)
  })

  test('(검토) the learner\'s own w that meets a busy server is not tried again by itself: one call, the red line stays', { options: { autoNote: false } }, async ($, on) => {
    const w = world(on)
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    w.replies = [BUSY]
    const ui = await pane($)
    await ui.press({ key: 'write' })
    await w.clock.settle()
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(1)
    expect((await ui.find({ type: 'Text', text: /^노트를 쓰지 못했습니다: 서버가 붐빕니다 · w로 다시 쓰기$/ }))?.props.color).toBe('red')
    await ui.unmount()
  })

  test('(검토) a note a reload takes up counts toward the day\'s limit while its call runs', { options: { dailyAutoNotes: 2 } }, async ($, on) => {
    const w = world(on)
    await start($)
    w.replies = ['cut']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    w.model = 'hold'
    await start($)
    await w.clock.advance(5)
    expect(w.models).toHaveLength(2)
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(w.models).toHaveLength(2)
    expect(storedNotes(w).at(-1)).toMatchObject({ status: 'off', skip: 'limit' })
    w.release()
    await w.clock.settle()
  })

  /** The journal files written: none at all with autoSave off (a company may turn it off to keep requests and diffs off the disk). */
  const journalFiles = (w: World) => [...w.files.keys()].filter(path => path.startsWith(`${NOTES_DIR}/`))

  test('(교차 검토) with autoSave off a note a session left being written goes in no journal, at the first look or the second', { options: { autoSave: false } }, async ($, on) => {
    const change = { file: 'src/a.ts', path: '/proj/src/a.ts', tool: 'Edit', kind: 'update', added: 1, removed: 1, diff: '@@ -1,1 +1,1 @@\n-let b = 2\n+const b = 2', isCut: false }
    const left = (id: string, at: number) => ({
      id, turnId: id, at, prompt: `요청 ${id}`, answer: '', changes: [change], moreFiles: 0, status: 'writing', text: '', savedAs: null, isPast: false, root: '/proj', updatedAt: at, concepts: [],
    })
    // Half an hour ago (the first look), and a minute ago (looked at again once LEFT_MS has passed).
    const history = { '/proj': { at: NOW, notes: [left('waited', NOW - 30 * 60_000), left('fresh', NOW - 60_000)] } }
    const w = world(on, 'ok', null, true, new Map<string, unknown>([['history', history]]))
    await start($)
    await w.clock.advance(15 * 60_000)
    expect(journalFiles(w)).toEqual([])
    expect(w.writes).toEqual([])
  })

  test('(교차 검토) with autoSave off a note a reload cut and does not take up fails as cut, in no journal', { options: { autoSave: false, autoNote: false } }, async ($, on) => {
    const w = world(on)
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    w.replies = ['cut']
    const ui = await pane($)
    await ui.press({ key: 'write' })
    await w.clock.settle()
    await ui.unmount()
    await start($)
    await w.clock.advance(60_000)
    // resumeNotes went through it: failed as cut, as with autoSave on, but kept in the store alone.
    expect(storedNotes(w)[0]).toMatchObject({ status: 'failed' })
    expect(journalFiles(w)).toEqual([])
    expect(w.writes).toEqual([])
  })

  const REWRITE_CUT = '다시 불러오는 사이 노트 다시 쓰기가 끊겼습니다 · 원래 노트는 그대로입니다 · w로 다시 쓰기'

  /**
   * The load a reload ends (교차 검토 6): once the call after `cutsNext` is set comes back, the host refuses that
   * load's every word on the pane's notes, as it refuses an unloaded environment's ops. The kit's start($) keeps the
   * module, whose rewrite would otherwise put the note back itself; `isGone` cleared stands for the next load.
   */
  function reloadCuts(on: On) {
    const load = { isGone: false, cutsNext: false }
    on('model.complete', { prompt: /[\s\S]/ }, async (_$, e, next) => {
      const result = await next(e)
      if (load.cutsNext) {
        load.cutsNext = false
        load.isGone = true
      }
      return result
    })
    on('state.set', { plugin: 'learn-notes', key: 'notes' }, async (_$, e, next) => (load.isGone ? { deny: 'this load is gone' } : next(e)))
    return load
  }

  test('(교차 검토 6) a w on a ready note that a reload cuts: the next load puts the note back as it was, in the pane and the store, with no call', { options: { autoNote: false } }, async ($, on) => {
    const load = reloadCuts(on)
    const w = world(on)
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await pane($)
    await ui.press({ key: 'write' })
    await w.clock.settle()
    expect(storedNotes(w)[0]).toMatchObject({ status: 'ready', savedAs: 'ready' })
    const text = storedNotes(w)[0]!.text as string
    expect(text).toContain('let을 const로')
    const journaled = w.journal().length
    // w again; a reload cuts its call, and the load it ends writes nothing more.
    w.replies = ['cut']
    load.cutsNext = true
    await ui.press({ key: 'write' })
    await w.clock.settle()
    load.isGone = false
    expect(w.models).toHaveLength(2)
    // The reload's session start: the note as it was, never failed as cut, nor written again by itself.
    await start($)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(2)
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /노트를 쓰지 못했습니다|노트를 쓰다 멈췄습니다/ })).toBeUndefined()
    expect(storedNotes(w)[0]).toMatchObject({ status: 'ready', text, savedAs: 'ready' })
    expect(storedNotes(w)[0]!.previous).toBeUndefined()
    expect(w.toasts.filter(one => one === REWRITE_CUT)).toHaveLength(1)
    expect(w.journal()).toHaveLength(journaled)
    // w writes it again as any rewrite does.
    await ui.press({ key: 'write' })
    await w.clock.settle()
    expect(w.models).toHaveLength(3)
    await ui.unmount()
  })

  test('(교차 검토 6) the same within RESUME_MS with automatic notes on: the learner\'s w is put back, never written again as a turn\'s end would', async ($, on) => {
    const load = reloadCuts(on)
    const w = world(on)
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(usageOf(w)).toMatchObject({ calls: 1, auto: 1 })
    w.replies = ['cut']
    load.cutsNext = true
    const ui = await pane($)
    await ui.press({ key: 'write' })
    await w.clock.settle()
    load.isGone = false
    await ui.unmount()
    await start($)
    await w.clock.advance(60_000)
    expect(w.models).toHaveLength(2)
    expect(usageOf(w)).toMatchObject({ calls: 2, auto: 1 })
    expect(storedNotes(w)[0]).toMatchObject({ status: 'ready', savedAs: 'ready' })
    expect(storedNotes(w)[0]!.text).toContain('let을 const로')
    expect((await learn($, '공유')).text).not.toContain('노트를 쓰지 못했습니다')
    expect(w.toasts).toContain(REWRITE_CUT)
  })

  test('(교차 검토 6) a store write while w writes a note again keeps the note as it was, and a later session reads it back so', { options: { autoNote: false } }, async ($, on) => {
    const w = world(on)
    await start($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await pane($)
    await ui.press({ key: 'write' })
    await w.clock.settle()
    const text = storedNotes(w)[0]!.text as string
    w.model = 'hold'
    await ui.press({ key: 'write' })
    // Another turn's end stores the pane meanwhile: the note being written, with what it was.
    await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't2')
    await finish(w)
    expect(storedNotes(w)[0]).toMatchObject({ status: 'writing', text: '', previous: { status: 'ready', text } })
    w.release()
    await w.clock.settle()
    expect(storedNotes(w)[0]).toMatchObject({ status: 'ready' })
    expect(storedNotes(w)[0]!.previous).toBeUndefined()
    await ui.unmount()
  })

  test('(교차 검토 6) a note a session left while w wrote it again comes back, in the next, as it was before: not failed', async ($, on) => {
    const change = { file: 'src/a.ts', path: '/proj/src/a.ts', tool: 'Edit', kind: 'update', added: 1, removed: 1, diff: '@@ -1,1 +1,1 @@\n-let b = 2\n+const b = 2', isCut: false }
    const left = {
      id: 'n1', turnId: 'n1', at: NOW - 3_600_000, prompt: '요청', answer: '', changes: [change], moreFiles: 0, status: 'writing', text: '', savedAs: 'ready',
      isPast: false, root: '/proj', updatedAt: NOW - 60_000, concepts: [], previous: { status: 'ready', text: NOTE_TEXT },
    }
    // One whose before is anything but a ready note's text reads back as before 1.7.0: failed.
    const odd = { ...left, id: 'n0', turnId: 'n0', at: NOW - 7_200_000, previous: { status: 'ready', text: 5 } }
    const w = world(on, 'ok', null, true, new Map<string, unknown>([['history', { '/proj': { at: NOW, notes: [odd, left] } }]]))
    await start($)
    await w.clock.advance(15 * 60_000)
    const ui = await pane($)
    expect(await ui.find({ type: 'Markdown', text: /let을 const로/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /세션이 끝나 노트를 다 쓰지 못했습니다/ })).toBeUndefined()
    expect((await learn($, '공유')).text).not.toContain('세션이 끝나')
    await ui.press({ key: 'prev' })
    expect(await ui.find({ type: 'Text', text: /세션이 끝나 노트를 다 쓰지 못했습니다/ })).toBeDefined()
    await ui.unmount()
    expect(w.models).toHaveLength(0)
    expect(w.journal()).toHaveLength(0)
  })
})

describe('1.7.0: a question asked back, and one try again (D4)', () => {
  const DAY = 86_400_000
  const NAMES = ['클로저', '구조 분해', 'map']
  /** Concepts quizzed before at step 2, all due by now, the first the longest overdue (as the 1.6.0 review tests have them). */
  const quizzed = () =>
    Object.fromEntries(
      NAMES.map((name, i) => [
        `c:${name}`,
        { name, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step: 2, reviewedAt: NOW - (61 - i) * DAY },
      ]),
    )
  const dueStore = () => new Map<string, unknown>([['stepsFrom', 0], ['concepts', quizzed()], ['steps', ownSteps(quizzed())]])
  const concept = (store: Map<string, unknown>, name: string) =>
    Object.values(store.get('concepts') as Record<string, { name: string; step?: number; reviewedAt?: number; missedAt?: number }>).find(one => one.name === name)!
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
  const HINTED = ['Q1: 문제 하나', 'H1: 바깥을 떠올려 보세요', 'A1: 답 하나', 'Q2: 문제 둘', 'H2: 둘째 힌트', 'A2: 답 둘', 'Q3: 문제 셋', 'A3: 답 셋'].join('\n')
  const PARTLY = ['판정: 거의', '피드백: 적은 대로라면 i가 3일 때도 찍혀야 합니다.', '되묻기: i가 3이 되면 i < 3은 참일까요?'].join('\n')
  const WRONG = ['판정: 틀림', '피드백: 그 값은 바깥 변수가 아닙니다.', '되묻기: 안쪽 함수가 다시 불릴 때 count는 어디에 남아 있을까요?'].join('\n')
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'

  async function quizIn($: Engine, w: World, props = PANE_PROPS) {
    w.answer = HINTED
    const ui = await pane($, 'terminal', props)
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    return ui
  }

  test('a first answer partly right is asked back instead of shown the answer; right on the try again, its step stays (되짚어 맞힘)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w, { ...PANE_PROPS, isFocused: true })
    w.answer = PARTLY
    await ui.input({ key: mineKey(store, 0), text: '0 1 2 3' })
    await w.clock.settle()
    expect(w.models).toHaveLength(2)
    expect(w.models[1]).toContain('되묻기: (거의·틀림일 때만 질문 한 문장')
    // In the question's place: how far it got, the answer typed, the feedback and the question asked back; no answer.
    expect((await ui.find({ type: 'Text', text: '△ 아직입니다 · 방향은 맞습니다' }))?.props.color).toBe('yellow')
    expect(await ui.find({ type: 'Text', text: '내 답: 0 1 2 3' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '적은 대로라면 i가 3일 때도 찍혀야 합니다.' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '**되묻기:** i가 3이 되면 i < 3은 참일까요?' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '답 하나' })).toBeUndefined()
    // An empty field of its own holds the keys; the hint gives way to the question asked back.
    const again = `${mineKey(store, 0)}-again`
    const field = await ui.find({ type: 'Input', key: again })
    expect(field?.props).toMatchObject({ label: '내 답 (한 번 더)', value: '', autoFocus: true })
    // In one row of a narrow pane, as the other fields (see FIELD_CELLS).
    const { label, placeholder, submitLabel } = field!.props as { label: string; placeholder: string; submitLabel: string }
    expect(cells(`${label}: ${placeholder} ⏎ ${submitLabel}`)).toBeLessThanOrEqual(FIELD_CELLS)
    expect(await ui.find({ type: 'Input', key: mineKey(store, 0) })).toBeUndefined()
    expect(focusesOf(w).at(-1)).toBe(again)
    expect(await ui.find({ type: 'Text', text: 'Enter: 다시 채점 · Tab: 버튼으로 (a 정답 · f 맞았는데요)' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Esc: 대화로 돌아가기 · 답은 한/영 상관없이, 버튼의 글자 키는 영문 상태에서' })).toBeDefined()
    expect((await ui.find({ type: 'Button', key: 'quiz-flip' }))?.props.label).toBe('맞았는데요')
    expect(await ui.find({ type: 'Button', key: 'quiz-answer' })).toBeDefined()
    for (const key of ['quiz-hint', 'quiz-right', 'quiz-wrong']) expect(await ui.find({ type: 'Button', key })).toBeUndefined()
    // Nothing graded yet: no mark, no count; the try is kept, and the question still waits (s asks first).
    expect(concept(store, '클로저')).toMatchObject({ step: 2, reviewedAt: NOW - 61 * DAY })
    expect(store.get('activity')).toEqual({})
    expect(quizItems(store)[0]).toMatchObject({ firstTry: { mine: '0 1 2 3', verdict: 'partial', nudge: 'i가 3이 되면 i < 3은 참일까요?', at: NOW } })
    expect(quizItems(store)[0]!.result).toBeUndefined()
    await ui.press({ key: 'quiz-new' })
    expect(await ui.find({ type: 'Text', text: '풀던 문제 3개가 남았습니다 · s를 한 번 더 누르면 새 문제를 받습니다' })).toBeDefined()

    // The try again carries the first, and asks for nothing back: it is the last.
    w.answer = RIGHT
    await ui.input({ key: again, text: '0 1 2' })
    await w.clock.settle()
    const asked = w.models.at(-1)!
    expect(asked).toContain('## 학습자의 첫 답과 받은 되묻기\n첫 답: 0 1 2 3\n첫 판정: 거의\n받은 피드백: 적은 대로라면 i가 3일 때도 찍혀야 합니다.\n받은 되묻기: i가 3이 되면 i < 3은 참일까요?\n## 학습자의 답\n0 1 2')
    expect(asked).toContain('마지막 시도다. 되묻기는 쓰지 않는다.')
    expect(asked).not.toContain('되묻기: (')
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저 · 되짚어 맞힘 · 방금 채점$/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '**맞혔습니다.** 정확합니다.' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '답 하나' })).toBeDefined()
    // Recalled after a question asked back: its step stays, as after a hint; one answer counted, the first try kept with it.
    expect(concept(store, '클로저')).toMatchObject({ step: 2, reviewedAt: NOW })
    expect(quizItems(store)[0]).toMatchObject({ result: 'right', verdict: 'right', mine: '0 1 2', firstTry: { mine: '0 1 2 3' } })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 1, wrong: 0 } })
    expect(focusesOf(w).at(-1)).toBe(mineKey(store, 1))
    expect(w.models).toHaveLength(3)
    // A grade may write a line more than before: 480 tokens; the quiz's own is 1.9.0's (3400, raised by its sample).
    expect(w.budgets).toEqual([3400, 480, 480])
    // Turned wrong with f and back right: still right after a question asked back, its step where that left it.
    await ui.press({ key: 'quiz-flip' })
    expect(concept(store, '클로저')).toMatchObject({ step: 0, missedAt: NOW })
    await ui.press({ key: 'quiz-flip' })
    expect(concept(store, '클로저')).toMatchObject({ step: 2, reviewedAt: NOW })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 1, wrong: 0 } })
    await ui.unmount()
  })

  test('partly right twice is △ a step back; wrong then partly right is ✗; a after a first try grades it as Claude did, with no o or x', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    w.answer = PARTLY
    await ui.input({ key: mineKey(store, 0), text: '0 1 2 3' })
    await w.clock.settle()
    w.answer = '판정: 거의\n피드백: 아직 끝 값이 빠졌어요.'
    await ui.input({ key: `${mineKey(store, 0)}-again`, text: '0 1 2 3 아마' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: /^△ 거의 맞음 1\. 클로저 · 방금 채점$/ })).toBeDefined()
    expect(concept(store, '클로저')).toMatchObject({ step: 1, reviewedAt: NOW })
    expect(concept(store, '클로저').missedAt).toBeUndefined()

    w.answer = WRONG
    await ui.input({ key: mineKey(store, 1), text: '전역 변수' })
    await w.clock.settle()
    expect((await ui.find({ type: 'Text', text: '✗ 아직입니다 · 한 번 더 떠올려 보세요' }))?.props.color).toBe('red')
    // The question asked back stands in for the one graded before: only its own f is drawn.
    expect(await ui.findAll({ type: 'Button', key: 'quiz-flip' })).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: /^△ 거의 맞음 1\. 클로저$/ })).toBeDefined()
    w.answer = '판정: 거의\n피드백: 가까워요.'
    await ui.input({ key: `${mineKey(store, 1)}-again`, text: '함수 안쪽 어딘가' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: /^✗ 틀림 2\. 구조 분해 · 방금 채점$/ })).toBeDefined()
    expect(concept(store, '구조 분해')).toMatchObject({ step: 0, missedAt: NOW })

    w.answer = PARTLY
    await ui.input({ key: mineKey(store, 2), text: '0 1 2 3' })
    await w.clock.settle()
    const calls = w.models.length
    await ui.press({ key: 'quiz-answer' })
    expect(w.models).toHaveLength(calls)
    expect(await ui.find({ type: 'Text', text: /^△ 거의 맞음 3\. map · 방금 채점$/ })).toBeDefined()
    // The last one graded: the keys go to s, as after any grade.
    expect(focusesOf(w).at(-1)).toBe('quiz-new')
    expect(await ui.find({ type: 'Markdown', text: '답 셋' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'quiz-right' })).toBeUndefined()
    expect(concept(store, 'map')).toMatchObject({ step: 1, reviewedAt: NOW })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 3 } })
    expect(await ui.find({ type: 'Text', text: /^3문제 중 0개 맞혔습니다 · 틀린 개념은 다음 퀴즈에 먼저 나옵니다/ })).toBeDefined()
    // Graded with no try again, it is kept as an answer graded at once: f turns it right a step on, as in 1.6.
    expect(quizItems(store)[2]).toMatchObject({ result: 'wrong', verdict: 'partial', mine: '0 1 2 3' })
    expect(quizItems(store)[2]!.firstTry).toBeUndefined()
    await ui.press({ key: 'quiz-flip' })
    expect(concept(store, 'map')).toMatchObject({ step: 3, reviewedAt: NOW })
    await ui.unmount()
  })

  test('"모르겠어요" calls no model: the hint in the place of a question asked back, then the answer graded wrong; with the hint seen, or none, the answer at once', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w, { ...PANE_PROPS, isFocused: true })
    await ui.input({ key: mineKey(store, 0), text: '모르겠어요' })
    await w.clock.settle()
    expect(w.models).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: '힌트를 보고 한 번 더 떠올려 보세요' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '**힌트:** 바깥을 떠올려 보세요' })).toBeDefined()
    // Shown once, in that place; not taken back with f; no h left.
    expect(await ui.find({ type: 'Text', text: /^힌트$/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^내 답: / })).toBeUndefined()
    for (const key of ['quiz-flip', 'quiz-hint']) expect(await ui.find({ type: 'Button', key })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'Enter: 다시 채점 · Tab: 버튼으로 (a 정답)' })).toBeDefined()
    expect(quizItems(store)[0]).toMatchObject({ isHinted: true, firstTry: { mine: '모르겠어요', verdict: 'wrong', feedback: '', nudge: '바깥을 떠올려 보세요' } })
    // Right with the hint: its step stays, said as a hint seen; the grade is told the learner did not know.
    w.answer = RIGHT
    await ui.input({ key: `${mineKey(store, 0)}-again`, text: '바깥 변수를 기억해서' })
    await w.clock.settle()
    expect(w.models.at(-1)).toContain('첫 답: (모르겠다고 했다)\n받은 힌트: 바깥을 떠올려 보세요')
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저 · 힌트 봄 · 방금 채점$/ })).toBeDefined()
    expect(concept(store, '클로저')).toMatchObject({ step: 2, reviewedAt: NOW })

    // The hint seen with h: "?" shows the answer, graded wrong.
    await ui.press({ key: 'quiz-hint' })
    await ui.input({ key: mineKey(store, 1), text: '?' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: /^✗ 틀림 2\. 구조 분해 · 힌트 봄 · 방금 채점$/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '**아쉽지만 틀렸습니다.** 정답을 읽어 보고, 다음에 이 개념이 나오면 다시 떠올려 보세요.' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '답 둘' })).toBeDefined()
    // No hint to show: the answer at once.
    await ui.input({ key: mineKey(store, 2), text: '잘 모르겠어요' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: /^✗ 틀림 3\. map · 방금 채점$/ })).toBeDefined()
    expect(concept(store, 'map')).toMatchObject({ step: 0, missedAt: NOW })
    expect(w.models).toHaveLength(2)
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 1, wrong: 2 } })
    await ui.unmount()
  })

  test('a question asked back that gives the answer away is dropped: graded at once, as before 1.7.0', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    w.answer = '판정: 틀림\n피드백: 아닙니다.\n되묻기: 답 하나라고 생각해 보면 어떨까요?'
    await ui.input({ key: mineKey(store, 0), text: '답 둘' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: /^✗ 틀림 1\. 클로저 · 방금 채점$/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '답 하나' })).toBeDefined()
    expect(quizItems(store)[0]!.firstTry).toBeUndefined()
    expect(focusesOf(w).at(-1)).toBe(mineKey(store, 1))
    await ui.unmount()
  })

  test('f under a first try (맞았는데요) grades it right as the learner says: a step on, as if right at once', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    w.answer = WRONG
    await ui.input({ key: mineKey(store, 0), text: '바깥 count' })
    await w.clock.settle()
    await ui.press({ key: 'quiz-flip' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저 · 방금 채점$/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /\(내가 맞힘으로 바꿈\)/ })).toBeDefined()
    expect(concept(store, '클로저')).toMatchObject({ step: 3, reviewedAt: NOW })
    expect(quizItems(store)[0]).toMatchObject({ result: 'right', verdict: 'wrong', mine: '바깥 count', isLearnerGraded: true })
    expect(quizItems(store)[0]!.firstTry).toBeUndefined()
    expect(focusesOf(w).at(-1)).toBe(mineKey(store, 1))
    // Turned back with f once graded: wrong in full, as the learner's own word always is.
    await ui.press({ key: 'quiz-flip' })
    await w.clock.settle()
    expect(concept(store, '클로저')).toMatchObject({ step: 0, missedAt: NOW })
    await ui.unmount()
  })

  test('/learn 퀴즈 n 답 asks back in three lines; the try again goes the same way, and 정답 n · 틀림 n · 맞음 n grade a first try', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = HINTED
    await learn($, 'quiz')
    const name = (i: number) => quizItems(store)[i]!.name as string
    w.answer = PARTLY
    expect((await learn($, 'quiz 2 0 1 2 3')).text).toBe(
      '2번 △ 아직입니다 · 방향은 맞습니다 · 적은 대로라면 i가 3일 때도 찍혀야 합니다.\n되묻기: i가 3이 되면 i < 3은 참일까요?\n한 번 더: /learn 퀴즈 2 새 답 · 정답: /learn 퀴즈 정답 2',
    )
    // The reply's own placeholder, sent as it stands, is not graded.
    const calls = w.models.length
    expect((await learn($, 'quiz 2 새 답')).text).toBe("'새 답' 자리에 떠올린 답을 적어 보내 주세요: /learn 퀴즈 2 (떠올린 답)")
    expect((await learn($, 'quiz 새 답')).text).toContain('쓰는 법')
    expect(w.models).toHaveLength(calls)
    const listed = (await learn($, 'quiz 문제')).text
    expect(listed).toContain('2. 한 번 더 · 문제 둘')
    expect(listed).toContain('답을 적어 채점받기: /learn 퀴즈 1 내 답')
    // 정답 2: the answer, graded as Claude graded the first try; nothing left to grade by hand, and the keys left in the prompt.
    const moves = focusesOf(w).length
    const shown = (await learn($, 'quiz 정답 2')).text
    expect(focusesOf(w)).toHaveLength(moves)
    expect(shown).toBe(`2번 정답\n\n답 둘\n(개념: ${name(1)} · △ 거의 맞음)\n\n다음 문제: /learn 퀴즈 1 내 답`)
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 1 } })

    // "모르겠어요" in the conversation: the hint, with no model call; right after it, a hint seen.
    expect((await learn($, 'quiz 1 모르겠어요')).text).toBe('1번 힌트를 보고 한 번 더 떠올려 보세요\n힌트: 바깥을 떠올려 보세요\n한 번 더: /learn 퀴즈 1 새 답 · 정답: /learn 퀴즈 정답 1')
    expect(w.models).toHaveLength(calls)
    w.answer = RIGHT
    const right = (await learn($, 'quiz 1 바깥 변수를 기억해서')).text
    expect(right).toContain('1번 ✓ 맞힘 · 힌트 봄 · 맞혔습니다. 정확합니다.')
    expect(right).toContain('정답\n답 하나')

    // 맞음 over a first try: right as the learner says, its interval longer.
    w.answer = WRONG
    expect((await learn($, 'quiz 3 아무 생각')).text).toContain('3번 ✗ 아직입니다 · 한 번 더 떠올려 보세요 · 그 값은 바깥 변수가 아닙니다.\n되묻기: ')
    expect((await learn($, 'quiz 맞음')).text).toBe(`맞힌 것으로 적었습니다: 3. ${name(2)}. 다음 복습까지 간격이 늘어납니다.`)
    expect(concept(store, name(2))).toMatchObject({ step: 3, reviewedAt: NOW })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 2, wrong: 1 } })
  })

  test('the learner\'s own 틀림 over a first try is wrong in full; a try again by command after it is graded is refused', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = HINTED
    await learn($, 'quiz')
    w.answer = PARTLY
    await learn($, 'quiz 1 0 1 2 3')
    expect((await learn($, 'quiz 틀림 1')).text).toContain('틀린 것으로 적었습니다: 1. 클로저')
    expect(concept(store, '클로저')).toMatchObject({ step: 0, missedAt: NOW })
    expect((await learn($, 'quiz 1 0 1 2')).text).toContain('1번은 이미 채점했습니다 (✗ 틀림)')
  })

  test('a first try left waiting is graded as Claude graded it once a new quiz replaces its quiz, or on a later day, counted on its own day', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    w.answer = PARTLY
    await ui.input({ key: mineKey(store, 0), text: '0 1 2 3' })
    await w.clock.settle()
    // Two s: a new quiz, the first try graded partly right (a step back) on its way out.
    w.answer = HINTED
    await w.clock.advance(60_000)
    await ui.press({ key: 'quiz-new' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(concept(store, '클로저')).toMatchObject({ step: 1, reviewedAt: NOW })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 1 } })
    expect(quizItems(store).every(one => one.firstTry === undefined && one.result === undefined)).toBe(true)

    // A first try of this quiz, then a day later: graded wrong on the day it was tried, before anything else.
    const triedAt = w.clock.now()
    const first = quizItems(store)[0]!.name as string
    w.answer = WRONG
    await ui.input({ key: mineKey(store, 0), text: '전역 변수' })
    await w.clock.settle()
    await ui.unmount()
    await w.clock.advance(DAY)
    await start($)
    expect(concept(store, first)).toMatchObject({ step: 0, missedAt: triedAt })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 2 } })
    expect(quizItems(store)[0]).toMatchObject({ result: 'wrong', verdict: 'wrong', gradedAt: triedAt, mine: '전역 변수' })
    expect(quizItems(store)[0]!.firstTry).toBeUndefined()
  })

  test('a first try is kept for the next session; the mobile app shows it with a and f and no field, and a grades it', async ($, on) => {
    const store = dueStore()
    const item = { key: 'c:클로저', name: '클로저', question: '문제 하나', answer: '답 하나' }
    store.set('quiz', {
      at: NOW,
      isRevealed: false,
      items: [
        { ...item, firstTry: { mine: '0 1 2 3', verdict: 'wrong', feedback: '아닙니다.', nudge: '다시 볼까요?', at: NOW } },
        // Not a first try this build reads (a verdict of right): the question as it was.
        { ...item, key: 'c:map', name: 'map', question: '문제 둘', answer: '답 둘', firstTry: { mine: 'x', verdict: 'right', feedback: '', nudge: '?', at: NOW } },
      ],
    })
    const w = world(on, 'ok', null, true, store)
    await start($)
    const terminal = await pane($)
    await terminal.press({ key: 'view-quiz' })
    expect(await terminal.find({ type: 'Input', key: `quiz-mine-${NOW}-0-again` })).toBeDefined()
    expect(focusesOf(w).at(-1)).toBe(`quiz-mine-${NOW}-0-again`)
    await terminal.unmount()
    const ui = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    expect(await ui.find({ type: 'Text', text: '✗ 아직입니다 · 한 번 더 떠올려 보세요' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '**되묻기:** 다시 볼까요?' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '한 번 더: /learn 퀴즈 1 새 답' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'quiz-flip' })).toBeDefined()
    await ui.press({ key: 'quiz-answer' })
    expect(await ui.find({ type: 'Text', text: /^✗ 틀림 1\. 클로저 · 방금 채점$/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '답 하나' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'quiz-wrong' })).toBeUndefined()
    // The second question: no first try read (and none written back), so a and o · x as before on this surface.
    expect(quizItems(store)[1]!.firstTry).toBeUndefined()
    await ui.press({ key: 'quiz-answer' })
    expect(await ui.find({ type: 'Button', key: 'quiz-right' })).toBeDefined()
    await ui.unmount()
  })

  /** A first try left in the pane yesterday, this window open since: no session start in between. */
  async function leftYesterday($: Engine, on: On) {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const triedAt = w.clock.now()
    w.answer = WRONG
    await ui.input({ key: mineKey(store, 0), text: '전역 변수' })
    await w.clock.settle()
    await w.clock.advance(DAY)
    return { store, w, ui, triedAt }
  }
  /** That first try graded as Claude graded it, on the day it was tried, once. */
  function settledOnItsDay(store: Map<string, unknown>, triedAt: number) {
    expect(concept(store, '클로저')).toMatchObject({ step: 0, missedAt: triedAt })
    expect(quizItems(store)[0]).toMatchObject({ result: 'wrong', verdict: 'wrong', gradedAt: triedAt, mine: '전역 변수' })
    expect(quizItems(store)[0]!.firstTry).toBeUndefined()
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 1 } })
  }
  const SETTLED = '날이 바뀌어 한 번 더를 기다리던 1번 (✗ 틀림)은 첫 답의 판정대로 매겼습니다.'

  test('a day gone by with the window open: 4 settles a first try left waiting, on its own day (review)', async ($, on) => {
    const { store, w, ui, triedAt } = await leftYesterday($, on)
    // 4 from another view (in the quiz view it is the view shown, no key).
    await ui.press({ key: 'view-concepts' })
    await ui.press({ key: 'view-quiz' })
    await w.clock.settle()
    settledOnItsDay(store, triedAt)
    expect(await ui.find({ type: 'Input', key: `${mineKey(store, 0)}-again` })).toBeUndefined()
    expect(focusesOf(w).at(-1)).toBe(mineKey(store, 1))
    await ui.unmount()
  })

  test('a day gone by with the window open: q settles it, and keeps the quiz for the questions still open (review)', async ($, on) => {
    const { store, w, ui, triedAt } = await leftYesterday($, on)
    const calls = w.models.length
    // q from another view (the quiz view draws none while a quiz is answered).
    await ui.press({ key: 'view-concepts' })
    await ui.press({ key: 'review' })
    await w.clock.settle()
    settledOnItsDay(store, triedAt)
    expect(w.models).toHaveLength(calls)
    await ui.unmount()
  })

  test('a day gone by with the window open: /learn 퀴즈 settles it and says so first (review)', async ($, on) => {
    const { store, w, ui, triedAt } = await leftYesterday($, on)
    const listed = (await learn($, 'quiz')).text ?? ''
    expect(listed.split('\n\n')[0]).toBe(SETTLED)
    expect(listed).toContain('1. ✗ 틀림 · 문제 하나')
    settledOnItsDay(store, triedAt)
    // Said once: the next reply has nothing to say of it.
    expect((await learn($, 'quiz')).text).not.toContain('날이 바뀌어')
    await ui.unmount()
  })

  test('a day gone by with the window open: /learn 복습 settles it and says so (review)', async ($, on) => {
    const { store, w, ui, triedAt } = await leftYesterday($, on)
    const reply = (await learn($, '복습')).text ?? ''
    expect(reply.split('\n\n')[0]).toBe(SETTLED)
    settledOnItsDay(store, triedAt)
    await w.clock.settle()
    await ui.unmount()
  })

  test('(교차 검토 5) Enter in a try again another window\'s session start graded meanwhile: no call, nothing counted again, that grade shown', async ($, on) => {
    const { store, w, ui, triedAt } = await leftYesterday($, on)
    // Another window's session start today grades the first try as Claude graded it, on its own day (settleFirstTries).
    const q = store.get('quiz') as { at: number; isRevealed: boolean; items: Record<string, unknown>[] }
    const { firstTry, ...rest } = q.items[0] as { firstTry: { mine: string; verdict: string; feedback: string; at: number } } & Record<string, unknown>
    const graded = { ...rest, mine: firstTry.mine, verdict: firstTry.verdict, feedback: firstTry.feedback, isShown: true, result: 'wrong', gradedAt: firstTry.at }
    store.set('quiz', { ...q, items: q.items.map((one, j) => (j === 0 ? graded : one)) })
    const index = store.get('concepts') as Record<string, Record<string, unknown>>
    const key = Object.keys(index).find(one => index[one]!.name === '클로저')!
    store.set('concepts', { ...index, [key]: { ...index[key], step: 0, missedAt: triedAt } })
    store.set('activity', { '2026-10-03': { notes: 0, right: 0, wrong: 1 } })
    settledOnItsDay(store, triedAt)
    // This window, open since yesterday, still shows the try again's field.
    const again = `${mineKey(store, 0)}-again`
    expect(await ui.find({ type: 'Input', key: again })).toBeDefined()
    const calls = w.models.length
    w.answer = RIGHT
    await ui.input({ key: again, text: '바깥 함수의 변수 환경' })
    await w.clock.settle()
    expect(w.models).toHaveLength(calls)
    settledOnItsDay(store, triedAt)
    expect(await ui.find({ type: 'Text', text: '이 문제는 다른 창에서 이미 채점했습니다.' })).toBeDefined()
    expect(await ui.find({ type: 'Input', key: again })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^✗ 틀림 1\. 클로저/ })).toBeDefined()
    expect(focusesOf(w).at(-1)).toBe(mineKey(store, 1))
    await ui.unmount()
  })

  test('a try again sent in the conversation after midnight: the first try was settled, and the reply says why (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = HINTED
    await learn($, 'quiz')
    w.answer = WRONG
    await learn($, 'quiz 1 전역 변수')
    await w.clock.advance(23 * 3_600_000 + 10 * 60_000)
    w.answer = RIGHT
    const calls = w.models.length
    expect((await learn($, 'quiz 1 바깥 함수의 변수')).text).toBe(`${SETTLED}\n\n1번은 이미 채점했습니다 (✗ 틀림). 새 문제: /learn 퀴즈 새로`)
    expect(w.models).toHaveLength(calls)
  })

  test('(교차 검토) a first try left yesterday, settled at the next session start, is said once in the transcript', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = HINTED
    await learn($, 'quiz')
    w.answer = WRONG
    await learn($, 'quiz 1 전역 변수')
    await $.session.end({ reason: 'prompt_input_exit', sessionId: 's1', resume: { id: 's1' } })
    // The same day, a new session: it waits still, and nothing is said.
    await start($)
    expect(w.transcript.filter(line => line.includes('날이 바뀌어'))).toEqual([])
    await w.clock.advance(DAY)
    // The next day's session (or yesterday's resumed) grades it as Claude did, and says so, dim, before anything is asked.
    await start($)
    expect(quizItems(store)[0]).toMatchObject({ result: 'wrong', mine: '전역 변수' })
    expect(w.transcript.filter(line => line.includes('날이 바뀌어'))).toEqual([SETTLED])
    // The try again sent then is answered as before; the reason was said above.
    w.answer = RIGHT
    const calls = w.models.length
    expect((await learn($, 'quiz 1 바깥 함수의 변수')).text).toBe('1번은 이미 채점했습니다 (✗ 틀림). 새 문제: /learn 퀴즈 새로')
    expect(w.models).toHaveLength(calls)
    // Once: a later start has nothing more to say.
    await start($)
    expect(w.transcript.filter(line => line.includes('날이 바뀌어'))).toEqual([SETTLED])
  })

  test('a try again Claude is grading is not settled meanwhile by 4, q or /learn 복습: its grade stands (review)', async ($, on) => {
    const { store, w, ui } = await leftYesterday($, on)
    w.model = 'hold'
    w.answer = RIGHT
    await ui.input({ key: `${mineKey(store, 0)}-again`, text: '바깥 함수의 변수 환경' })
    expect(await ui.find({ type: 'Text', text: '채점하는 중입니다…' })).toBeDefined()
    await ui.press({ key: 'view-concepts' })
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'view-concepts' })
    await ui.press({ key: 'review' })
    await learn($, '복습')
    expect(quizItems(store)[0]!.result).toBeUndefined()
    w.release()
    await w.clock.settle()
    expect(quizItems(store)[0]).toMatchObject({ result: 'right', verdict: 'right', mine: '바깥 함수의 변수 환경' })
    expect(await ui.find({ type: 'Text', text: /이미 채점했습니다/ })).toBeUndefined()
    expect(concept(store, '클로저')).toMatchObject({ step: 2 })
    expect(store.get('activity')).toEqual({ '2026-10-04': { notes: 0, right: 1, wrong: 0 } })
    await ui.unmount()
  })

  test('a try again waiting is listed with the answer typed and the question asked back, in the conversation and away (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = HINTED
    await learn($, 'quiz')
    w.answer = WRONG
    await learn($, 'quiz 1 전역 변수')
    const nudged = '1. 한 번 더 · 문제 하나\n   내 답: 전역 변수\n   되묻기: 안쪽 함수가 다시 불릴 때 count는 어디에 남아 있을까요?'
    expect((await learn($, 'quiz')).text).toContain(nudged)
    expect((await learn($, 'quiz 다음')).text).toContain(nudged)
    const away = await $.command.run({ command: 'learn', args: '복습', origin: { kind: 'channel', server: 'slack' }, presentation: { isFullscreen: true, columns: 160 } })
    expect(away.text).toContain(nudged)
    expect(away.text).toContain('한 번 더: /learn 퀴즈 1 새 답 · 정답: /learn 퀴즈 정답 1')
    // After "모르겠어요": the hint in that place, and no answer of the learner's to repeat.
    await learn($, 'quiz 2 모르겠어요')
    const listed = (await learn($, 'quiz 문제')).text ?? ''
    expect(listed).toContain('2. 한 번 더 · 문제 둘\n   힌트: 둘째 힌트')
    expect(listed).not.toContain('내 답: 모르겠어요')
  })

  test('what comes next after a grade or an answer seen is a try again when one waits there, not a new answer and the hint (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = HINTED
    await learn($, 'quiz')
    w.answer = WRONG
    await learn($, 'quiz 1 전역 변수')
    w.answer = RIGHT
    const graded = (await learn($, 'quiz 2 맞는 답')).text ?? ''
    expect(graded.split('\n').at(-1)).toBe('한 번 더: /learn 퀴즈 1 새 답 · 정답: /learn 퀴즈 정답 1')
    expect(graded).not.toContain('막히면')
    const shown = (await learn($, 'quiz 정답 3')).text ?? ''
    expect(shown.split('\n').at(-1)).toBe('스스로 채점: /learn 퀴즈 맞음 3 · /learn 퀴즈 틀림 3 · 한 번 더: /learn 퀴즈 1 새 답 · 정답: /learn 퀴즈 정답 1')
  })

  test('"모르겠어요" sent with no number is taken, not said to be graded (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = HINTED
    await learn($, 'quiz')
    const calls = w.models.length
    const reply = (await learn($, 'quiz 모르겠어요')).text ?? ''
    expect(reply.split('\n')[0]).toBe('1번 답으로 받았습니다')
    expect(reply).toContain('1번 힌트를 보고 한 번 더 떠올려 보세요')
    expect(w.models).toHaveLength(calls)
    // An answer Claude grades still says so (here the try again of the question still being answered).
    w.answer = RIGHT
    expect(((await learn($, 'quiz 바깥 변수')).text ?? '').split('\n')[0]).toBe('1번 답으로 채점했습니다')
    expect(w.models).toHaveLength(calls + 1)
  })

  test('a try again\'s field is drawn empty though a failed grade left the first answer behind (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w, { ...PANE_PROPS, isFocused: true })
    w.replies = [{ status: 500, error: 'api_error' }]
    await ui.input({ key: mineKey(store, 0), text: '처음 적은 답' })
    await w.clock.settle()
    expect((await ui.find({ type: 'Input', key: mineKey(store, 0) }))?.props.value).toBe('처음 적은 답')
    w.answer = WRONG
    await learn($, 'quiz 1 처음 적은 답')
    expect((await ui.find({ type: 'Input', key: `${mineKey(store, 0)}-again` }))?.props.value).toBe('')
    await ui.unmount()
  })

  test('an answer turned away while another is graded stays in its field, with no answer to see before a try (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w, { ...PANE_PROPS, isFocused: true })
    w.model = 'hold'
    w.answer = RIGHT
    const chat = learn($, 'quiz 2 아무 답')
    await w.clock.settle()
    await ui.input({ key: mineKey(store, 0), text: '아무 생각' })
    expect(await ui.find({ type: 'Text', text: /다른 답을 채점하고 있습니다/ })).toBeDefined()
    expect((await ui.find({ type: 'Input', key: mineKey(store, 0) }))?.props.value).toBe('아무 생각')
    expect(await ui.find({ type: 'Button', key: 'quiz-answer' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /a 정답/ })).toBeUndefined()
    w.release()
    await chat
    await w.clock.settle()
    await ui.unmount()
  })

  test('after "모르겠어요" and the hint, a partly right answer is △, as partly right after h is (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    await ui.input({ key: mineKey(store, 0), text: '모르겠어요' })
    await w.clock.settle()
    w.answer = PARTLY
    await ui.input({ key: `${mineKey(store, 0)}-again`, text: '0 1 2 3' })
    await w.clock.settle()
    expect(quizItems(store)[0]).toMatchObject({ result: 'wrong', verdict: 'partial', mine: '0 1 2 3' })
    expect(await ui.find({ type: 'Text', text: /^△ 거의 맞음 1\. 클로저 · 힌트 봄 · 방금 채점$/ })).toBeDefined()
    expect(concept(store, '클로저')).toMatchObject({ step: 1, reviewedAt: NOW })
    expect(concept(store, '클로저').missedAt).toBeUndefined()
    await ui.unmount()
  })

  test('"??" is JavaScript\'s own operator, an answer to grade; "?" alone is not (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const calls = w.models.length
    w.answer = RIGHT
    await ui.input({ key: mineKey(store, 0), text: '??' })
    await w.clock.settle()
    expect(w.models).toHaveLength(calls + 1)
    expect(quizItems(store)[0]).toMatchObject({ result: 'right', mine: '??' })
    await ui.unmount()
  })

  test('another window\'s grade is not done again here: 4 in a window open since yesterday leaves the store as that window left it (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const oldAt = (store.get('quiz') as { at: number }).at
    w.answer = WRONG
    await ui.input({ key: mineKey(store, 0), text: '전역 변수' })
    await w.clock.settle()
    // Window A, the next day: settled the first try, made today's quiz and got that concept right.
    await w.clock.advance(DAY)
    const today = w.clock.now()
    const index = store.get('concepts') as Record<string, Record<string, unknown>>
    const key = Object.keys(index).find(one => index[one]!.name === '클로저')!
    const { missedAt: _, ...rest } = index[key]!
    index[key] = { ...rest, step: 1, reviewedAt: today }
    const newer = { at: today, isRevealed: false, items: [{ key, name: '클로저', question: 'A의 새 문제', answer: 'A의 답', result: 'right', gradedAt: today, mine: '맞는 답', verdict: 'right', isShown: true }] }
    store.set('quiz', newer)
    store.set('activity', { '2026-10-03': { notes: 0, right: 0, wrong: 1 }, '2026-10-04': { notes: 0, right: 1, wrong: 0 } })
    // Window B, open since yesterday: 3, then 4.
    await ui.press({ key: 'view-concepts' })
    await ui.press({ key: 'view-quiz' })
    await w.clock.settle()
    expect(concept(store, '클로저')).toMatchObject({ step: 1, reviewedAt: today })
    expect(concept(store, '클로저').missedAt).toBeUndefined()
    expect(store.get('quiz')).toEqual(newer)
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 1 }, '2026-10-04': { notes: 0, right: 1, wrong: 0 } })
    // The try again it showed is no more: the quiz the store holds is drawn.
    expect(await ui.find({ type: 'Input', key: `quiz-mine-${oldAt}-0-again` })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: 'A의 새 문제' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저/ })).toBeDefined()
    await ui.unmount()
  })

  test('a new quiz made here settles a first try another window left in the store, though this window never saw it (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = HINTED
    await learn($, 'quiz')
    // Window A's quiz, with a first try waiting, took the store's place since.
    await w.clock.advance(60_000)
    const triedAt = w.clock.now()
    const index = store.get('concepts') as Record<string, { name: string }>
    const key = Object.keys(index).find(one => index[one]!.name === 'map')!
    store.set('quiz', {
      at: triedAt,
      isRevealed: false,
      items: [{ key, name: 'map', question: 'A의 문제', answer: 'A의 답', firstTry: { mine: '틀린 답', verdict: 'partial', feedback: '거의', nudge: '끝은요?', at: triedAt } }],
    })
    await w.clock.advance(60_000)
    w.answer = HINTED
    await learn($, 'quiz 새로')
    expect(concept(store, 'map')).toMatchObject({ step: 1, reviewedAt: triedAt })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 1 } })
    expect((store.get('quiz') as { at: number }).at).not.toBe(triedAt)
  })

  test('the question screen says "모르겠어요" is the way out, with no hint or none left; the help keeps o and x (review)', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w, { ...PANE_PROPS, isFocused: true })
    expect(await ui.find({ type: 'Text', text: "답 칸에서 Enter: 채점 · 모르면 '모르겠어요' · Tab: 버튼으로 (h 힌트 · 1~4 보기)" })).toBeDefined()
    // The third question has no hint: the way out is still said.
    w.answer = RIGHT
    await ui.input({ key: mineKey(store, 0), text: '답 하나' })
    await w.clock.settle()
    await ui.input({ key: mineKey(store, 1), text: '답 둘' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: "답 칸에서 Enter: 채점 · 모르면 '모르겠어요' · Tab: 버튼으로 (1~4 보기)" })).toBeDefined()
    await ui.unmount()
    // o and x are still keys (the mobile app, an answer seen with /learn 퀴즈 정답, a grade that did not come back).
    expect((await learn($, '도움말')).text).toContain('`o`·`x`')
  })

  /** Another window's first try, asked back (its slip named), as that window keeps it on the quiz every window shares. */
  const THEIRS = {
    mine: '전역 변수',
    verdict: 'wrong',
    feedback: '그 값은 바깥 변수가 아닙니다.',
    nudge: '안쪽 함수가 다시 불릴 때 값은 어디에 남아 있을까요?',
    at: NOW,
    slip: '바깥 변수를 전역으로 봄',
    slipType: 'scope',
  }
  /** The quiz the store holds, with another window's first try at question `i` on it: this window, which read it before, never saw it. */
  function triedThere(store: Map<string, unknown>, i: number, first: Record<string, unknown> = THEIRS) {
    const kept = JSON.parse(JSON.stringify(store.get('quiz'))) as { items: Record<string, unknown>[] }
    kept.items[i] = { ...kept.items[i], firstTry: first }
    store.set('quiz', kept)
  }
  const missedNames = (store: Map<string, unknown>) =>
    Object.values(store.get('concepts') as Record<string, { name: string; missedAt?: number }>).flatMap(one => (one.missedAt !== undefined ? [one.name] : [])).sort()

  test('(교차 검토) a first try another window kept stays when this window shows a hint: the next quiz grades it, its miss and slip kept', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const at = (store.get('quiz') as { at: number }).at
    const second = quizItems(store)[1]!.name as string
    triedThere(store, 1)
    // h on question 1 here writes the quiz back as every window has it, not as this window read it.
    await ui.press({ key: 'quiz-hint' })
    expect(quizItems(store)[0]).toMatchObject({ isHinted: true })
    expect(quizItems(store)[1]).toMatchObject({ firstTry: THEIRS })
    // A new quiz grades it as Claude graded it: a miss on the day it was tried, its slip kept, counted wrong.
    w.answer = HINTED
    await w.clock.advance(60_000)
    await ui.press({ key: 'quiz-new' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect((store.get('quiz') as { at: number }).at).not.toBe(at)
    expect(concept(store, second)).toMatchObject({ step: 0, missedAt: NOW })
    expect(Object.values(store.get('slips') as Record<string, { what: string }>).map(one => one.what)).toEqual([THEIRS.slip])
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 1 } })
    await ui.unmount()
  })

  test('(교차 검토) first tries another window kept stay when this window grades another question, by /learn 퀴즈 힌트 or an answer typed in the pane', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const names = quizItems(store).map(one => one.name as string)
    // Another window tried question 2: this window's hint by command keeps that try.
    triedThere(store, 1)
    expect((await learn($, '퀴즈 힌트 1')).text).toContain('1번 힌트\n\n바깥을 떠올려 보세요')
    expect(quizItems(store)[0]).toMatchObject({ isHinted: true })
    expect(quizItems(store)[1]).toMatchObject({ firstTry: THEIRS })
    // Then question 3, partly right with no slip named: this window's answer to question 1, right, keeps that try too.
    const third = { ...THEIRS, mine: '0 1 2 3', verdict: 'partial', nudge: 'i가 3이 되면 i < 3은 참일까요?', slip: undefined, slipType: undefined }
    triedThere(store, 2, JSON.parse(JSON.stringify(third)))
    w.answer = RIGHT
    await ui.input({ key: mineKey(store, 0), text: '답 하나' })
    await w.clock.settle()
    expect(quizItems(store)[0]).toMatchObject({ result: 'right', isHinted: true })
    expect(quizItems(store)[1]).toMatchObject({ firstTry: THEIRS })
    expect(quizItems(store)[2]).toMatchObject({ firstTry: { mine: '0 1 2 3', verdict: 'partial' } })
    expect(quizItems(store).slice(1).every(one => one.result === undefined)).toBe(true)
    // A new quiz grades both as Claude graded them, wrong and partly right: each counted once.
    w.answer = HINTED
    await w.clock.advance(60_000)
    await ui.press({ key: 'quiz-new' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(missedNames(store)).toEqual([names[1]!])
    expect(concept(store, names[2]!)).toMatchObject({ step: 1, reviewedAt: NOW })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 1, wrong: 2 } })
    await ui.unmount()
  })

  test('(교차 검토) a try again after another window settled it and made a new quiz is not graded here: that quiz, the marks and the day\'s count stay as that window left them', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const oldAt = (store.get('quiz') as { at: number }).at
    const first = quizItems(store)[0]!.name as string
    w.answer = WRONG
    await ui.input({ key: mineKey(store, 0), text: '전역 변수' })
    await w.clock.settle()
    // Another window, minutes later: two s graded the first try as Claude did, and kept a quiz of its own.
    await w.clock.advance(3 * 60_000)
    const index = store.get('concepts') as Record<string, Record<string, unknown>>
    const key = Object.keys(index).find(one => index[one]!.name === first)!
    index[key] = { ...index[key], step: 0, reviewedAt: NOW, missedAt: NOW }
    store.set('concepts', index)
    const newer = { at: w.clock.now(), isRevealed: false, items: [{ key, name: first, question: 'B의 새 문제', answer: 'B의 답', hint: 'B의 힌트' }] }
    store.set('quiz', newer)
    store.set('activity', { '2026-10-03': { notes: 0, right: 0, wrong: 1 } })
    const marks = JSON.stringify(store.get('concepts'))
    // Here the try again is still on show: right, it is graded over nothing.
    w.answer = RIGHT
    await ui.input({ key: `quiz-mine-${oldAt}-0-again`, text: '답 하나' })
    await w.clock.settle()
    expect(store.get('quiz')).toEqual(newer)
    expect(JSON.stringify(store.get('concepts'))).toBe(marks)
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 1 } })
    expect(await ui.find({ type: 'Text', text: '그사이 새 퀴즈가 나와 이 답은 채점하지 않았습니다.' })).toBeDefined()
    // The quiz every window has is the one on show now.
    expect(await ui.find({ type: 'Input', key: `quiz-mine-${oldAt}-0-again` })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: 'B의 새 문제' })).toBeDefined()
    await ui.unmount()
  })

  test('(교차 검토) h, /learn 퀴즈 힌트 or 정답 in a window still showing a quiz another window replaced: that quiz shows, kept as it is', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const [key, one] = Object.entries(store.get('concepts') as Record<string, { name: string }>)[0]!
    const theirs = (question: string) => ({ at: w.clock.now(), isRevealed: false, items: [{ key, name: one.name, question, answer: 'B의 답', hint: 'B의 힌트' }] })
    await w.clock.advance(60_000)
    const newer = theirs('B의 새 문제')
    store.set('quiz', newer)
    await ui.press({ key: 'quiz-hint' })
    expect(store.get('quiz')).toEqual(newer)
    expect(await ui.find({ type: 'Markdown', text: 'B의 새 문제' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1/ })).toBeDefined()
    // Once more, with nothing waiting for a try again here: the conversation says a new quiz came, and keeps it.
    await w.clock.advance(60_000)
    const newest = theirs('B의 또 다른 문제')
    store.set('quiz', newest)
    expect((await learn($, '퀴즈 힌트 1')).text).toBe('그사이 다른 창에서 새 퀴즈가 나왔습니다. 지금 문제: /learn 퀴즈')
    expect(store.get('quiz')).toEqual(newest)
    // And the answer asked for: none shown, no grade offered for a question that is another now.
    await w.clock.advance(60_000)
    const last = theirs('B의 마지막 문제')
    store.set('quiz', last)
    expect((await learn($, '퀴즈 정답 1')).text).toBe('그사이 다른 창에서 새 퀴즈가 나왔습니다. 지금 문제: /learn 퀴즈')
    expect(store.get('quiz')).toEqual(last)
    await ui.unmount()
  })

  test('(교차 검토) an answer here to a question another window tried meanwhile is not kept over that try: its try again shows, nothing graded', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const at = (store.get('quiz') as { at: number }).at
    const marks = JSON.stringify(store.get('concepts'))
    triedThere(store, 0)
    // A first answer short of right here: not kept over theirs.
    w.answer = PARTLY
    await ui.input({ key: mineKey(store, 0), text: '0 1 2 3' })
    await w.clock.settle()
    expect(quizItems(store)[0]!.firstTry).toEqual(THEIRS)
    expect(await ui.find({ type: 'Text', text: '이 문제는 그사이 다른 창에서 먼저 답했습니다. 한 번 더 적어 보세요.' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: `**되묻기:** ${THEIRS.nudge}` })).toBeDefined()
    expect(await ui.find({ type: 'Input', key: `quiz-mine-${at}-0-again` })).toBeDefined()
    // A first answer right, sent in the conversation, to a question tried there since: not graded as a first answer.
    triedThere(store, 1)
    w.answer = RIGHT
    expect((await learn($, '퀴즈 2 답 둘')).text).toBe('이 문제는 그사이 다른 창에서 먼저 답했습니다. 한 번 더 적어 보세요.')
    expect(quizItems(store)[1]).toMatchObject({ firstTry: THEIRS })
    expect(quizItems(store)[1]!.result).toBeUndefined()
    expect(JSON.stringify(store.get('concepts'))).toBe(marks)
    expect(store.get('activity')).toEqual({})
    await ui.unmount()
  })

  test('(교차 검토) f here keeps another window\'s first try, and a grade turned stays turned once the quiz is written back from the store', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const at = (store.get('quiz') as { at: number }).at
    w.answer = RIGHT
    await ui.input({ key: mineKey(store, 0), text: '답 하나' })
    await w.clock.settle()
    triedThere(store, 1)
    await ui.press({ key: 'quiz-flip' })
    expect(quizItems(store)[0]).toMatchObject({ result: 'wrong', verdict: 'right', isLearnerGraded: true })
    expect(quizItems(store)[1]).toMatchObject({ firstTry: THEIRS })
    // That try's try again here, right: graded on the quiz read back from the store, the grade turned as it was.
    await ui.input({ key: `quiz-mine-${at}-1-again`, text: '답 둘' })
    await w.clock.settle()
    expect(quizItems(store)[1]).toMatchObject({ result: 'right', firstTry: THEIRS })
    expect(quizItems(store)[0]).toMatchObject({ result: 'wrong', verdict: 'right', isLearnerGraded: true })
    await ui.unmount()
  })

  test('(교차 검토) a first try a window of an older build wrote the quiz back without is still this window\'s: right on its try again, 되짚어 맞힘', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const at = (store.get('quiz') as { at: number }).at
    const before = JSON.parse(JSON.stringify(store.get('quiz')))
    w.answer = PARTLY
    await ui.input({ key: mineKey(store, 0), text: '0 1 2 3' })
    await w.clock.settle()
    // A 1.6 window (which reads no first try) writes its copy back: question 1 is open there, and still waits here.
    store.set('quiz', before)
    w.answer = RIGHT
    await ui.input({ key: `quiz-mine-${at}-0-again`, text: '0 1 2' })
    await w.clock.settle()
    expect(quizItems(store)[0]).toMatchObject({ result: 'right', firstTry: { mine: '0 1 2 3', verdict: 'partial' } })
    expect(concept(store, '클로저')).toMatchObject({ step: 2, reviewedAt: NOW })
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저 · 되짚어 맞힘/ })).toBeDefined()
    await ui.unmount()
  })

  test('(교차 검토) /learn 퀴즈 정답 for another question keeps another window\'s first try too', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    triedThere(store, 0)
    expect((await learn($, '퀴즈 정답 2')).text).toContain('답 둘')
    expect(quizItems(store)[1]).toMatchObject({ isShown: true })
    expect(quizItems(store)[0]).toMatchObject({ firstTry: THEIRS })
    await ui.unmount()
  })

  test('(교차 검토) a quiz older than this window\'s, written back by a window of an older build, gives way to this window\'s at the next grade', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const older = JSON.parse(JSON.stringify(store.get('quiz')))
    w.answer = HINTED
    await w.clock.advance(60_000)
    await ui.press({ key: 'quiz-new' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    const at = (store.get('quiz') as { at: number }).at
    expect(at).not.toBe(older.at)
    store.set('quiz', older)
    w.answer = RIGHT
    await ui.input({ key: `quiz-mine-${at}-0`, text: '답 하나' })
    await w.clock.settle()
    expect(store.get('quiz')).toMatchObject({ at })
    expect(quizItems(store)[0]).toMatchObject({ result: 'right' })
    expect(await ui.find({ type: 'Text', text: '그사이 새 퀴즈가 나와 이 답은 채점하지 않았습니다.' })).toBeUndefined()
    // A first try here, the older quiz written back again: the next quiz still grades this window's try.
    const second = quizItems(store)[1]!.name as string
    w.answer = WRONG
    await ui.input({ key: `quiz-mine-${at}-1`, text: '전역 변수' })
    await w.clock.settle()
    store.set('quiz', older)
    w.answer = HINTED
    await w.clock.advance(60_000)
    await ui.press({ key: 'quiz-new' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(concept(store, second)).toMatchObject({ step: 0, missedAt: at })
    await ui.unmount()
  })

  test('(교차 검토 3) a try again entered while two s make a new quiz is turned away: the new quiz grades its first try as Claude did, with no grade call', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const again = `${mineKey(store, 0)}-again`
    w.answer = WRONG
    await ui.input({ key: mineKey(store, 0), text: '전역 변수' })
    await w.clock.settle()
    // Two s, the new quiz's call held: the old question and its try again's field are still drawn meanwhile.
    await w.clock.advance(60_000)
    w.answer = HINTED
    w.model = 'hold'
    await ui.press({ key: 'quiz-new' })
    await ui.press({ key: 'quiz-new' })
    expect(await ui.find({ type: 'Text', text: '문제를 만드는 중입니다…' })).toBeDefined()
    expect(await ui.find({ type: 'Input', key: again })).toBeDefined()
    const calls = w.models.length
    await ui.input({ key: again, text: '1' })
    expect(w.models).toHaveLength(calls)
    expect((await ui.find({ type: 'Text', text: '새 문제를 만들고 있습니다. 문제가 나온 뒤 답하세요.' }))?.props.color).toBe('red')
    w.release()
    await w.clock.settle()
    // The new quiz graded the first try wrong, on its own day: the miss and the day's count kept, nothing said of a lost answer.
    expect(concept(store, '클로저')).toMatchObject({ step: 0, missedAt: NOW })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 0, right: 0, wrong: 1 } })
    expect(quizItems(store).every(one => one.firstTry === undefined && one.result === undefined)).toBe(true)
    expect(w.models).toHaveLength(calls)
    expect(await ui.find({ type: 'Text', text: '그사이 새 퀴즈가 나와 이 답은 채점하지 않았습니다.' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: '새 문제를 만들고 있습니다. 문제가 나온 뒤 답하세요.' })).toBeUndefined()
    await ui.unmount()
  })

  test('(교차 검토 3) the same while /learn 퀴즈 새로 makes it: the answer stays in its field, and the line goes once the call is over', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const again = `${mineKey(store, 0)}-again`
    w.answer = WRONG
    await ui.input({ key: mineKey(store, 0), text: '전역 변수' })
    await w.clock.settle()
    // The new quiz's call held, and then nothing in it read as a question: the quiz and its first try stay.
    w.answer = '문제를 낼 수 없습니다'
    w.model = 'hold'
    const before = w.models.length
    const reply = learn($, '퀴즈 새로')
    await w.clock.settle()
    expect(w.models).toHaveLength(before + 1)
    const calls = w.models.length
    await ui.input({ key: again, text: '바깥 함수의 변수' })
    expect(w.models).toHaveLength(calls)
    expect(await ui.find({ type: 'Text', text: '새 문제를 만들고 있습니다. 문제가 나온 뒤 답하세요.' })).toBeDefined()
    w.release()
    expect((await reply).text).toContain('퀴즈를 내지 못했습니다')
    await w.clock.settle()
    expect(w.models).toHaveLength(calls)
    expect(await ui.find({ type: 'Text', text: '새 문제를 만들고 있습니다. 문제가 나온 뒤 답하세요.' })).toBeUndefined()
    expect((await ui.find({ type: 'Input', key: again }))?.props.value).toBe('바깥 함수의 변수')
    expect(quizItems(store)[0]).toMatchObject({ firstTry: { mine: '전역 변수', verdict: 'wrong' } })
    expect(quizItems(store)[0]!.result).toBeUndefined()
    await ui.unmount()
  })

  test('(교차 검토 3) a try again waiting on the last question left keeps the quiz from q, /learn 복습 and one s, as an open question does', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    w.answer = RIGHT
    await ui.input({ key: mineKey(store, 0), text: '답 하나' })
    await w.clock.settle()
    await ui.input({ key: mineKey(store, 1), text: '답 둘' })
    await w.clock.settle()
    w.answer = WRONG
    await ui.input({ key: mineKey(store, 2), text: '전역 변수' })
    await w.clock.settle()
    const calls = w.models.length
    const at = (store.get('quiz') as { at: number }).at
    const isKept = () => {
      expect(w.models).toHaveLength(calls)
      expect((store.get('quiz') as { at: number }).at).toBe(at)
      expect(quizItems(store)[2]).toMatchObject({ firstTry: { mine: '전역 변수', verdict: 'wrong' } })
      expect(quizItems(store)[2]!.result).toBeUndefined()
    }
    isKept()
    // Only that try again is left: the quiz is still being answered, so no q in its view.
    expect(await ui.find({ type: 'Button', key: 'review' })).toBeUndefined()
    await ui.press({ key: 'view-concepts' })
    await ui.press({ key: 'review' })
    await w.clock.settle()
    isKept()
    await learn($, '복습')
    await w.clock.settle()
    isKept()
    // One s asks first, as with any question left.
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    isKept()
    expect(await ui.find({ type: 'Text', text: '풀던 문제 1개가 남았습니다 · s를 한 번 더 누르면 새 문제를 받습니다' })).toBeDefined()
    expect(await ui.find({ type: 'Input', key: `${mineKey(store, 2)}-again` })).toBeDefined()
    await ui.unmount()
  })

  for (const surface of ['desktop', 'vscode'] as const) {
    test(`(교차 검토 3) ${surface} draws the answer field as the terminal does: no a before the first answer, and a field of its own for the try again`, async ($, on) => {
      const store = dueStore()
      const w = world(on, 'ok', null, true, store)
      await start($)
      w.answer = HINTED
      const ui = await pane($, surface)
      await ui.press({ key: 'view-quiz' })
      await ui.press({ key: 'quiz-new' })
      await w.clock.settle()
      expect(await ui.find({ type: 'Input', key: mineKey(store, 0) })).toBeDefined()
      expect(await ui.find({ type: 'Button', key: 'quiz-answer' })).toBeUndefined()
      w.answer = PARTLY
      await ui.input({ key: mineKey(store, 0), text: '0 1 2 3' })
      await w.clock.settle()
      expect(await ui.find({ type: 'Input', key: `${mineKey(store, 0)}-again` })).toBeDefined()
      expect(quizItems(store)[0]).toMatchObject({ firstTry: { verdict: 'partial' } })
      await ui.unmount()
    })
  }

  test('(교차 검토 8) a quiz kept from before says the way out on its question where no Tab line is drawn: the desktop app, VS Code, a pane without the keys', async ($, on) => {
    const WAY_OUT = "모르면 '모르겠어요'라고 적고 Enter"
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    // The quiz is made first (as for anyone past their first quiz, or up from 1.6.x): no empty quiz screen says it.
    const term = await quizIn($, w, { ...PANE_PROPS, isFocused: true })
    expect(await term.find({ type: 'Text', text: /^답 칸에서 Enter: 채점 · 모르면 '모르겠어요' · Tab: 버튼으로 \(/ })).toBeDefined()
    expect(await term.find({ type: 'Text', text: WAY_OUT })).toBeUndefined()
    await term.unmount()
    const views: [('terminal' | 'desktop' | 'vscode'), typeof PANE_PROPS][] = [
      ['desktop', PANE_PROPS],
      ['vscode', PANE_PROPS],
      ['terminal', { ...PANE_PROPS, isFocused: false }],
    ]
    for (const [surface, props] of views) {
      const ui = await pane($, surface, props)
      expect(await ui.find({ type: 'Input', key: mineKey(store, 0) })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: WAY_OUT })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /Tab: 버튼으로/ })).toBeUndefined()
      await ui.unmount()
    }
    // It costs no call there either: the hint comes back.
    const desk = await pane($, 'desktop')
    await desk.input({ key: mineKey(store, 0), text: '모르겠어요' })
    await w.clock.settle()
    expect(w.models).toHaveLength(1)
    expect(await desk.find({ type: 'Input', key: `${mineKey(store, 0)}-again` })).toBeDefined()
    await desk.unmount()
  })
})

describe('1.7.0: what a quiz found wrong, asked again in other code (오답 노트, D5)', () => {
  const DAY = 86_400_000
  const NAMES = ['클로저', '구조 분해', 'map']
  /** Concepts quizzed before at step 2, all due by now, the first the longest overdue (as the D4 tests have them). */
  const quizzed = () =>
    Object.fromEntries(
      NAMES.map((name, i) => [
        `c:${name}`,
        { name, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step: 2, reviewedAt: NOW - (61 - i) * DAY } as Record<string, unknown>,
      ]),
    )
  const dueStore = (more: [string, unknown][] = []) => new Map<string, unknown>([['stepsFrom', 0], ['concepts', quizzed()], ['steps', ownSteps(quizzed() as never)], ...more])
  const WHAT = '함수가 끝나면 바깥 변수도 사라진다고 봄'
  /** A slip on 클로저 a quiz found `ago` before now, its concept missed then (so it leads the next quiz). */
  const slipStore = (ago: number, what = WHAT) => {
    const concepts = quizzed()
    concepts['c:클로저'] = { ...concepts['c:클로저'], step: 0, reviewedAt: NOW - ago, missedAt: NOW - ago }
    return new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', concepts],
      ['steps', ownSteps(concepts as never)],
      ['slips', { 'c:클로저': { what, type: 'scope', question: '지난 문제의 코드', mine: '전역 변수', at: NOW - ago, times: 1 } }],
    ])
  }
  const QUESTIONS = ['Q1: 문제 하나', 'H1: 바깥을 떠올려 보세요', 'A1: 답 하나', 'Q2: 문제 둘', 'A2: 답 둘', 'Q3: 문제 셋', 'A3: 답 셋'].join('\n')
  const SLIPPED = ['판정: 틀림', '피드백: 그 값은 바깥 변수가 아닙니다.', '되묻기: 안쪽 함수가 다시 불릴 때 count는 어디에 남아 있을까요?', `헷갈린 점: ${WHAT}`, '유형: 변수 범위'].join('\n')
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const slipsOf = (store: Map<string, unknown>) => (store.get('slips') ?? {}) as Record<string, { what: string; type: string; question: string; mine: string; at: number; times: number; fixedAt?: number }>
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items

  async function quizIn($: Engine, w: World, answer = QUESTIONS) {
    w.answer = answer
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    return ui
  }
  async function answer(ui: Awaited<ReturnType<typeof pane>>, w: World, key: string, text: string, reply: string) {
    w.answer = reply
    await ui.input({ key, text })
    await w.clock.settle()
  }

  test('a try again missed too keeps what the first answer showed, dim under the feedback; f takes it back and gives it back', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    await answer(ui, w, mineKey(store, 0), '전역 변수', SLIPPED)
    // The first grade asked for the slip; nothing is shown of it, nor kept, while the try again waits.
    expect(w.models[1]).toContain('헷갈린 점: (거의·틀림일 때만 한 문장. 맞음이면 이 줄을 쓰지 않는다)\n유형: (거의·틀림일 때만 위 갈래 중 하나)')
    expect(await ui.find({ type: 'Text', text: /헷갈린 점/ })).toBeUndefined()
    expect(store.get('slips')).toBeUndefined()
    expect(quizItems(store)[0]).toMatchObject({ firstTry: { slip: WHAT, slipType: 'scope' } })

    await answer(ui, w, `${mineKey(store, 0)}-again`, '함수 안쪽 어딘가', '판정: 틀림\n피드백: 아직 아닙니다.')
    // The try again asks for no slip: the first answer's is kept.
    expect(w.models[2]).not.toContain('헷갈린 점')
    expect(w.models).toHaveLength(3)
    const line = await ui.find({ type: 'Text', text: `헷갈린 점: ${WHAT} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })
    expect(line?.props.dimColor).toBe(true)
    expect(slipsOf(store)).toEqual({ 'c:클로저': { what: WHAT, type: 'scope', question: '문제 하나', mine: '전역 변수', at: NOW, times: 1 } })
    expect(quizItems(store)[0]).toMatchObject({ result: 'wrong', slipBefore: null })

    // Turned right: as if right then, the slip goes; turned back wrong, it is there again.
    await ui.press({ key: 'quiz-flip' })
    expect(slipsOf(store)).toEqual({})
    expect(await ui.find({ type: 'Text', text: /헷갈린 점/ })).toBeUndefined()
    await ui.press({ key: 'quiz-flip' })
    expect(slipsOf(store)['c:클로저']).toEqual({ what: WHAT, type: 'scope', question: '문제 하나', mine: '전역 변수', at: NOW, times: 1 })
    expect(await ui.find({ type: 'Text', text: `헷갈린 점: ${WHAT} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })).toBeDefined()
    expect(w.models).toHaveLength(3)
    await ui.unmount()
  })

  test('right on the try again is mended at once and asked again another day; "모르겠어요" is kept as nothing recalled; a reply with no slip keeps none', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    await answer(ui, w, mineKey(store, 0), '전역 변수', SLIPPED)
    await answer(ui, w, `${mineKey(store, 0)}-again`, '안쪽 함수가 기억하는 바깥 변수', RIGHT)
    expect(await ui.find({ type: 'Text', text: '헷갈린 점을 바로 고쳤습니다 · 다른 날 다른 코드로 한 번 더 확인합니다' })).toBeDefined()
    expect(slipsOf(store)['c:클로저']).toMatchObject({ what: WHAT, mine: '전역 변수', at: NOW, times: 1 })
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()

    // The second question has no hint: "모르겠어요" is graded wrong at once, with no model call.
    const calls = w.models.length
    await answer(ui, w, mineKey(store, 1), '모르겠어요', RIGHT)
    expect(w.models).toHaveLength(calls)
    expect(await ui.find({ type: 'Text', text: '떠오르지 않았습니다 · 다음 퀴즈에서 다시 풉니다' })).toBeDefined()
    expect(slipsOf(store)[conceptKey('구조 분해')]).toEqual({ what: '', type: 'blank', question: '문제 둘', mine: '모르겠어요', at: NOW, times: 1 })

    // A grade with no slip line (or one that said 없음), graded at once: no slip, no line, as in 1.6.1.
    await answer(ui, w, mineKey(store, 2), '아마도 새 배열', '판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: 없음')
    expect(await ui.find({ type: 'Text', text: /^✗ 틀림 3\. map · 방금 채점$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /헷갈린 점|떠오르지 않았습니다/ })).toBeUndefined()
    expect(slipsOf(store)['c:map']).toBeUndefined()
    await ui.unmount()
  })

  test('the next quiz asks it again: told the slip, titled 다시 도전, the slip unseen before an answer; right on another day mends it', async ($, on) => {
    const store = slipStore(2 * DAY)
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    expect(w.models[0]).toContain(`1. 클로저 — 클로저 설명\n   지난번 문제 '지난 문제의 코드' · 학습자 답 '전역 변수' · 헷갈린 점: ${WHAT}\n`)
    expect(w.models[0]).toContain('"지난번" 줄이 붙은 개념은 같은 헷갈림이 드러나는 다른 코드나 값으로 묻는다.')
    expect(quizItems(store).map(one => one.isRetry)).toEqual([true, undefined, undefined])
    expect(await ui.find({ type: 'Text', text: '문제 1/3 · 다시 도전' })).toBeDefined()
    // The slip is not shown before an answer, in the pane or the conversation.
    expect(await ui.find({ type: 'Text', text: /사라진다고/ })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /사라진다고/ })).toBeUndefined()
    const listed = (await learn($, '퀴즈')).text
    expect(listed).toContain('1. (다시 도전) 문제 하나')
    expect(listed).not.toContain('사라진다고')

    await answer(ui, w, mineKey(store, 0), '안쪽 함수가 바깥 count를 기억해 이어서 셉니다', RIGHT)
    expect(w.models.at(-1)).toContain(`## 이 학습자가 지난번에 헷갈린 점\n${WHAT}\n`)
    expect(w.models.at(-1)).toContain('이번 답이 지난번에 헷갈린 점을 바로잡았으면 피드백에서 한 마디로 짚는다.')
    const fixed = await ui.find({ type: 'Text', text: '✓ 지난번 헷갈린 점을 바로잡았습니다' })
    expect(fixed?.props.color).toBe('green')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ what: WHAT, fixedAt: NOW })
    await ui.unmount()

    // Mended: the next quiz asks it as any other.
    await w.clock.advance(5 * DAY)
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).not.toContain('지난번')
  })

  test('asked again the same day: right is not mended yet; missed again says so, with where its note is', async ($, on) => {
    const store = slipStore(60_000)
    const both = slipsOf(store)
    store.set('slips', { ...both, [conceptKey('구조 분해')]: { ...both['c:클로저']!, what: '배열을 복사한다고 봄', type: 'reference' }, 'c:map': { ...both['c:클로저']!, what: '원래 배열을 바꾼다고 봄', type: 'state' } })
    const w = world(on, 'ok', null, true, store)
    // Worked examples on as 1.8.0 shipped them, whatever their constant (교차 검토 2 turned them off by its sample): in
    // both branches (1.10.0 G1), as these concepts were met in no code.
    w.harness = WORKED_BOTH
    await start($)
    const ui = await quizIn($, w)
    expect(quizItems(store).map(one => one.isRetry)).toEqual([true, true, true])
    await answer(ui, w, mineKey(store, 0), '안쪽 함수가 바깥 count를 기억해 이어서 셉니다', RIGHT)
    expect(await ui.find({ type: 'Text', text: '바로 다시 맞혔습니다 · 다음 복습에서 한 번 더 확인합니다' })).toBeDefined()
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()

    // Missed again, the same kind: counted once more; no note in this pane taught it, so no n.
    await answer(ui, w, mineKey(store, 1), '복사본이 생겨요', '판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: 꺼내면 복사된다고 봄\n유형: 값과 참조')
    // Missed twice running: 1.8.0 (E3) says the next review quiz shows a worked example first.
    expect(await ui.find({ type: 'Text', text: '같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다' })).toBeDefined()
    expect(slipsOf(store)[conceptKey('구조 분해')]).toMatchObject({ what: '배열을 복사한다고 봄', mine: '복사본이 생겨요', times: 2, at: NOW })
    await ui.unmount()

    // In the conversation: no note taught it when the quiz was made, so none is named (one that did is found by its
    // name: the D6 review tests).
    w.answer = '판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: 원래 배열을 바꾼다고 봄\n유형: 상태가 바뀌는 때'
    const reply = (await learn($, '퀴즈 3 원래 배열이 바뀝니다')).text
    expect(reply).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다\n')
    expect(reply).not.toContain('/learn 찾기')
  })

  test('missed again in the pane, where the note that taught it is: n to that note, r there to walk it through', async ($, on) => {
    // A second concept to fill the quiz (withFiller): a worked example of 클로저 alone is none a quiz asks (1.10.0 G1, D33
    // (3)), and the line under its grade promises none then (4/7 검토).
    const store = withFiller(new Map<string, unknown>([['slips', { 'c:클로저': { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 1 } }]]))
    const w = world(on, 'ok', null, true, store)
    w.harness = { workedAfterTimes: 2 }
    await start($)
    // Met in a.ts, its words quoting a line of it: the code branch's worked example (1.10.0 G1).
    w.answer = QUOTED_NOTE(['클로저'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await quizIn($, w, 'Q1: 문제 하나\nA1: 답 하나')
    expect(await ui.find({ type: 'Text', text: '문제 1/1 · 다시 도전' })).toBeDefined()
    await answer(ui, w, mineKey(store, 0), '전역에 남아요', `판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${WHAT}\n유형: 변수 범위`)
    // 1.8.0 (E3): missed twice running, the next review quiz shows a worked example first, said in place of r there.
    expect(await ui.find({ type: 'Text', text: '같은 곳을 또 헷갈렸습니다 · n: 이 개념을 배운 노트 · 다음 복습 퀴즈는 풀이부터 보여 줍니다' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'quiz-note' })).toBeDefined()
    await ui.unmount()
  })

  test('asked again and right on another day after its hint: recalled with help, so not mended yet', async ($, on) => {
    const store = slipStore(2 * DAY)
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    await ui.press({ key: 'quiz-hint' })
    await answer(ui, w, mineKey(store, 0), '안쪽 함수가 바깥 count를 기억해 이어서 셉니다', RIGHT)
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저 · 힌트 봄 · 방금 채점$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /바로잡았습니다|바로 다시 맞혔습니다/ })).toBeUndefined()
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()
    await ui.unmount()
  })

  test('a question that says the slip itself is no retry: no 다시 도전, and right on another day mends nothing', async ($, on) => {
    const store = slipStore(2 * DAY)
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w, QUESTIONS.replace('Q1: 문제 하나', `Q1: 흔히 ${WHAT}. 이 코드는?`))
    expect(quizItems(store)[0]!.isRetry).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /다시 도전/ })).toBeUndefined()
    await answer(ui, w, mineKey(store, 0), '안쪽 함수가 바깥 count를 기억해 이어서 셉니다', RIGHT)
    expect(await ui.find({ type: 'Text', text: /바로잡았습니다/ })).toBeUndefined()
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()
    await ui.unmount()
  })

  test('the concepts view says what was got wrong in place of the date, cut to its cells; /learn 안다 mends it and no quiz asks it again', async ($, on) => {
    const long = `${WHAT}, 그래서 다음 호출에서 count가 처음부터 다시 시작한다고 봄`
    const store = slipStore(2 * DAY, long)
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await pane($)
    await ui.press({ key: 'view-concepts' })
    const row = await ui.find({ type: 'Text', text: /클로저 · 헷갈린 점: / })
    const text = row?.text ?? ''
    expect(text.startsWith(`  클로저 · 헷갈린 점: ${WHAT.slice(0, 10)}`)).toBe(true)
    expect(text.endsWith('…')).toBe(true)
    expect(cells(text.trimStart())).toBeLessThanOrEqual(56)
    expect(await ui.find({ type: 'Text', text: /퀴즈 틀림 10-01/ })).toBeUndefined()
    // The others as before.
    expect(await ui.find({ type: 'Text', text: /구조 분해 · \d+일 지남/ })).toBeDefined()
    await ui.unmount()

    expect((await learn($, '안다 클로저')).text).toContain('아는 개념으로 표시했습니다: 클로저')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ what: long, fixedAt: NOW })
    await learn($, '모른다 클로저')
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).not.toContain('지난번')
  })

  test('a 1.6 window writing the concepts leaves the slips; a recap says them; the learner grading by hand keeps none', async ($, on) => {
    const store = slipStore(60_000)
    const w = world(on, 'ok', null, true, store)
    await start($)
    // A 1.6 session still open writes the index back, with no slips key of its own.
    store.set('concepts', { ...(store.get('concepts') as object) })
    w.answer = CONCEPT_NOTE(['클로저'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(slipsOf(store)['c:클로저']).toBeDefined()

    w.answer = '### 한 일\n- 고쳤다'
    await learn($, '정리')
    const recap = w.models.at(-1)!
    expect(recap).toContain(`클로저 (헷갈린 점: ${WHAT})`)
    expect(recap).toContain('(위에 적힌 학습자의 헷갈린 점만 1~2개, "개념: 헷갈린 점" 꼴로 한 줄씩. 노트만 보고 짐작한 것은 쓰지 않는다)')

    // On the mobile app the answer is seen and graded by hand: nothing typed, no slip kept or mended.
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    const sets = w.sets.filter(key => key === 'slips').length
    const ui = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-answer' })
    await ui.press({ key: 'quiz-wrong' })
    await ui.press({ key: 'quiz-answer' })
    await ui.press({ key: 'quiz-right' })
    expect(w.sets.filter(key => key === 'slips').length).toBe(sets)
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()
    await ui.unmount()
  })

  test('a first try graded as Claude graded it (a, a new quiz, a day gone by) keeps its slip, on the day it was tried', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    await answer(ui, w, mineKey(store, 0), '전역 변수', SLIPPED)
    await ui.press({ key: 'quiz-answer' })
    expect(await ui.find({ type: 'Text', text: `헷갈린 점: ${WHAT} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })).toBeDefined()
    expect(slipsOf(store)['c:클로저']).toMatchObject({ what: WHAT, at: NOW })
    // In the conversation: 정답 n over a first try says it too.
    await answer(ui, w, mineKey(store, 1), '복사본', SLIPPED.replace(WHAT, '꺼내면 복사된다고 봄').replace('변수 범위', '값과 참조'))
    const reply = (await learn($, '퀴즈 정답 2')).text
    expect(reply).toContain('헷갈린 점: 꺼내면 복사된다고 봄 · 다음 퀴즈에서 다른 코드로 다시 묻습니다')
    // Left waiting a day: graded on the day it was tried.
    const triedAt = w.clock.now()
    await answer(ui, w, mineKey(store, 2), '원본이 바뀜', SLIPPED.replace(WHAT, '원래 배열을 바꾼다고 봄').replace('변수 범위', '상태가 바뀌는 때'))
    await ui.unmount()
    await w.clock.advance(DAY)
    await start($)
    expect(slipsOf(store)['c:map']).toMatchObject({ what: '원래 배열을 바꾼다고 봄', type: 'state', at: triedAt })
  })

  // What the batch's two reviews found (5/8 검토).
  /** Six concepts quizzed before at step 2, all due by now, 클로저 the longest overdue: enough that a quiz needs no filler. */
  const sixStore = () => {
    const six = ['클로저', '구조 분해', 'map', '프로미스', '옵셔널 체이닝', '스프레드']
    const concepts = Object.fromEntries(
      six.map((name, i) => [
        conceptKey(name),
        { name, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step: 2, reviewedAt: NOW - (61 - i) * DAY },
      ]),
    )
    return new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)]])
  }

  test('거의 keeps a slip with no miss marked: the next quiz still asks it again, as its line said; right again the same day waits for its review', async ($, on) => {
    const store = sixStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    const partly = ['판정: 거의', '피드백: 방향은 맞습니다.', '되묻기: count는 어디에 남을까요?', `헷갈린 점: ${WHAT}`, '유형: 변수 범위'].join('\n')
    await answer(ui, w, mineKey(store, 0), '바깥 변수를 쓴다', partly)
    await answer(ui, w, `${mineKey(store, 0)}-again`, '바깥 변수를 쓰는데 사라진다', '판정: 거의\n피드백: 아직입니다.')
    expect(await ui.find({ type: 'Text', text: `헷갈린 점: ${WHAT} · 다음 퀴즈에서 다른 코드로 다시 묻습니다` })).toBeDefined()
    await ui.unmount()
    // A step back and no miss: its review is days off, and five others are due.
    expect((store.get('concepts') as Record<string, { missedAt?: number }>)['c:클로저']!.missedAt).toBeUndefined()
    w.answer = QUESTIONS
    const listed = (await learn($, '퀴즈 새로')).text
    expect(w.models.at(-1)).toContain(`1. 클로저 — 클로저 설명\n   지난번 문제 '문제 하나' · 학습자 답 '바깥 변수를 쓴다' · 헷갈린 점: ${WHAT}\n`)
    expect(listed).toContain('1. (다시 도전) 문제 하나')

    // Right again the same day: not mended yet; the quiz after it waits for its review to ask it.
    await w.clock.advance(60_000)
    w.answer = RIGHT
    expect((await learn($, '퀴즈 1 안쪽 함수가 바깥 count를 기억해 이어서 셉니다')).text).toContain('바로 다시 맞혔습니다 · 다음 복습에서 한 번 더 확인합니다')
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).not.toContain('클로저')
  })

  test('right after the question asked back: no quiz asks it again that day; the next day\'s does, and right then mends it', async ($, on) => {
    const store = sixStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    await answer(ui, w, mineKey(store, 0), '전역 변수', SLIPPED)
    await answer(ui, w, `${mineKey(store, 0)}-again`, '안쪽 함수가 기억하는 바깥 변수', RIGHT)
    expect(await ui.find({ type: 'Text', text: '헷갈린 점을 바로 고쳤습니다 · 다른 날 다른 코드로 한 번 더 확인합니다' })).toBeDefined()
    expect(slipsOf(store)['c:클로저']).toMatchObject({ what: WHAT, at: NOW, isRight: true })
    await ui.unmount()
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).not.toContain('클로저')

    await w.clock.advance(DAY)
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain(`1. 클로저 — 클로저 설명\n   지난번 문제 '문제 하나' · 학습자 답 '전역 변수' · 헷갈린 점: ${WHAT}\n`)
    w.answer = RIGHT
    const reply = (await learn($, '퀴즈 1 안쪽 함수가 바깥 count를 기억해 이어서 셉니다')).text
    expect(reply).toContain('✓ 지난번 헷갈린 점을 바로잡았습니다')
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBe(w.clock.now())
  })

  test('a real answer too short to read a slip from ("10") is kept blank, but never said to be not recalled', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w, QUESTIONS.replace('Q1: 문제 하나', 'Q1: `let a = 3; console.log(a * 4)`는 무엇을 출력할까요?').replace('A1: 답 하나', 'A1: 12'))
    await answer(ui, w, mineKey(store, 0), '10', ['판정: 틀림', '피드백: 10이 아닙니다.', '되묻기: a에 무엇이 들어 있나요?', '헷갈린 점: 곱셈을 덧셈으로 봄', '유형: 기타'].join('\n'))
    await answer(ui, w, `${mineKey(store, 0)}-again`, '7', '판정: 틀림\n피드백: 아직 아닙니다.')
    expect(await ui.find({ type: 'Text', text: '답이 짧아 헷갈린 점은 적지 않았습니다 · 다음 퀴즈에서 다시 풉니다' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /떠오르지 않았습니다/ })).toBeUndefined()
    expect(slipsOf(store)['c:클로저']).toMatchObject({ what: '', type: 'blank', mine: '10' })
    await ui.unmount()
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain("학습자 답 '10' · 답이 짧아 헷갈린 점을 알 수 없다")
    expect(w.models.at(-1)).not.toContain('떠올리지 못했다')
  })

  test('asked again and not recalled ("모르겠어요" twice): the slip it asked about keeps its words, counted once more', async ($, on) => {
    const store = slipStore(2 * DAY)
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    expect(await ui.find({ type: 'Text', text: '문제 1/3 · 다시 도전' })).toBeDefined()
    const calls = w.models.length
    await answer(ui, w, mineKey(store, 0), '모르겠어요', RIGHT)
    await answer(ui, w, `${mineKey(store, 0)}-again`, '모르겠어요', RIGHT)
    expect(w.models).toHaveLength(calls)
    expect(await ui.find({ type: 'Text', text: '같은 곳을 또 헷갈렸습니다' })).toBeDefined()
    expect(slipsOf(store)['c:클로저']).toEqual({ what: WHAT, type: 'scope', question: '지난 문제의 코드', mine: '전역 변수', at: NOW, times: 2 })
    await ui.press({ key: 'view-concepts' })
    expect(await ui.find({ type: 'Text', text: /^ {2}클로저 · 헷갈린 점: 함수가 끝나면/ })).toBeDefined()
    await ui.unmount()
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    expect(w.models.at(-1)).toContain(`지난번 문제 '지난 문제의 코드' · 학습자 답 '전역 변수' · 헷갈린 점: ${WHAT}\n`)
  })

  test('asked again and answered in two characters, whatever Claude named: the slip keeps its words', async ($, on) => {
    const store = slipStore(2 * DAY)
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    await answer(ui, w, mineKey(store, 0), '3', `판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: 다른 말로 쓴 헷갈린 점\n유형: 변수 범위`)
    expect(slipsOf(store)['c:클로저']).toMatchObject({ what: WHAT, type: 'scope', times: 2, at: NOW })
    expect(await ui.find({ type: 'Text', text: '같은 곳을 또 헷갈렸습니다' })).toBeDefined()
    await ui.unmount()
  })

  test('a first try left waiting when a new quiz is made: its slip is kept after the quiz was made, so the grade there tells none', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    w.answer = SLIPPED
    await learn($, '퀴즈 1 전역 변수')
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    expect(slipsOf(store)['c:클로저']).toMatchObject({ what: WHAT })
    const items = quizItems(store)
    const n = items.findIndex(one => one.name === '클로저') + 1
    expect(n).toBeGreaterThan(0)
    expect(items[n - 1]!.isRetry).toBeUndefined()
    w.answer = RIGHT
    const reply = (await learn($, `퀴즈 ${n} 안쪽 함수가 바깥 count를 기억해 이어서 셉니다`)).text
    // No retry, so no mend: the grade is not told the slip, and names none.
    expect(w.models.at(-1)).not.toContain('지난번에 헷갈린 점')
    expect(reply).not.toContain('바로잡았습니다')
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBeUndefined()
  })

  test('/learn 퀴즈 틀림 over a first try says what it kept, as the pane does; over two, each by its number', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = QUESTIONS
    await learn($, '퀴즈 새로')
    w.answer = SLIPPED
    await learn($, '퀴즈 1 전역 변수')
    const reply = (await learn($, '퀴즈 틀림 1')).text
    expect(reply).toBe(`틀린 것으로 적었습니다: 1. 클로저. 복습할 개념 맨 앞에 올라 다음 퀴즈에 먼저 나옵니다.\n헷갈린 점: ${WHAT} · 다음 퀴즈에서 다른 코드로 다시 묻습니다`)
    w.answer = SLIPPED.replace(WHAT, '꺼내면 복사된다고 봄').replace('변수 범위', '값과 참조')
    await learn($, '퀴즈 2 복사본')
    w.answer = SLIPPED.replace(WHAT, '원래 배열을 바꾼다고 봄').replace('변수 범위', '상태가 바뀌는 때')
    await learn($, '퀴즈 3 원본이 바뀜')
    const both = (await learn($, '퀴즈 틀림 2 3')).text
    expect(both).toContain('\n2번: 헷갈린 점: 꺼내면 복사된다고 봄 · 다음 퀴즈에서 다른 코드로 다시 묻습니다\n3번: 헷갈린 점: 원래 배열을 바꾼다고 봄 · 다음 퀴즈에서 다른 코드로 다시 묻습니다')
  })

  test('missed where the note that taught it is in the pane: the next field\'s Tab line names n for it', async ($, on) => {
    const w = world(on, 'ok', null, true)
    await start($)
    w.answer = CONCEPT_NOTE(['클로저', 'map'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await quizIn($, w, 'Q1: 문제 하나\nA1: 답 하나\nQ2: 문제 둘\nA2: 답 둘')
    expect(await ui.find({ type: 'Text', text: "답 칸에서 Enter: 채점 · 모르면 '모르겠어요' · Tab: 버튼으로 (1~4 보기)" })).toBeDefined()
    await answer(ui, w, mineKey(w.store, 0), '전역에 남아요', '판정: 틀림\n피드백: 아닙니다.')
    expect(await ui.find({ type: 'Button', key: 'quiz-note' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: "답 칸에서 Enter: 채점 · 모르면 '모르겠어요' · Tab: 버튼으로 (n 배운 노트 · 1~4 보기)" })).toBeDefined()
    await ui.unmount()
  })

  test('another window\'s slip, kept after this one loaded, stays when this one keeps its own', async ($, on) => {
    const store = dueStore()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await quizIn($, w)
    store.set('slips', { 'c:map': { what: '원래 배열을 바꾼다고 봄', type: 'state', question: 'q', mine: '원본이 바뀜', at: NOW - DAY, times: 1 } })
    await answer(ui, w, mineKey(store, 0), '전역 변수에 남아요', `판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${WHAT}\n유형: 변수 범위`)
    expect(Object.keys(slipsOf(store)).sort()).toEqual(['c:map', 'c:클로저'])
    // And /learn 안다 there too.
    store.set('slips', { ...slipsOf(store), 'c:구조 분해': { what: '복사된다고 봄', type: 'reference', question: 'q', mine: '복사본', at: NOW - DAY, times: 1 } })
    await learn($, '안다 클로저')
    expect(Object.keys(slipsOf(store)).sort()).toEqual(['c:map', 'c:구조 분해', 'c:클로저'])
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBe(NOW)
    await ui.unmount()
  })

  test('a quiz read back from the store keeps 다시 도전 and the slip before each grade: f takes back what its grade kept, right mends', async ($, on) => {
    const store = slipStore(2 * DAY)
    store.set('quiz', {
      at: NOW - 60_000,
      isRevealed: false,
      items: [
        { key: 'c:구조 분해', name: '구조 분해', question: '문제 둘', answer: '답 둘', isShown: true, result: 'wrong', gradedAt: NOW - 30_000, mine: '복사돼요 아마', verdict: 'wrong', feedback: '아닙니다.', slip: '꺼내면 복사된다고 봄', slipType: 'reference', slipBefore: null },
        { key: 'c:클로저', name: '클로저', question: '새 코드의 클로저 문제', answer: '답 하나', isRetry: true },
      ],
    })
    store.set('slips', { ...slipsOf(store), 'c:구조 분해': { what: '꺼내면 복사된다고 봄', type: 'reference', question: '문제 둘', mine: '복사돼요 아마', at: NOW - 30_000, times: 1 } })
    const w = world(on, 'ok', null, true, store)
    await start($)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: '문제 2/2 · 다시 도전' })).toBeDefined()
    await ui.press({ key: 'quiz-flip' })
    await w.clock.settle()
    expect(slipsOf(store)['c:구조 분해']).toBeUndefined()
    await answer(ui, w, mineKey(store, 1), '안쪽 함수가 바깥 count를 기억해 이어서 셉니다', RIGHT)
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBe(NOW)
    await ui.unmount()
  })

  test('graduating mends the slip open on its concept, with no question asked again', async ($, on) => {
    const concepts = quizzed()
    // At the last step and the longest overdue, so its question comes first.
    concepts['c:클로저'] = { ...concepts['c:클로저'], step: 5, reviewedAt: NOW - 150 * DAY }
    const store = new Map<string, unknown>([
      ['stepsFrom', 0],
      ['concepts', concepts],
      ['steps', ownSteps(concepts as never)],
      ['slips', { 'c:클로저': { what: WHAT, type: 'scope', question: '지난 문제의 코드', mine: '전역 변수', at: NOW - 150 * DAY, times: 1 } }],
    ])
    const w = world(on, 'ok', null, true, store)
    await start($)
    // The question says the slip itself: no retry, so only graduating mends it.
    const ui = await quizIn($, w, QUESTIONS.replace('Q1: 문제 하나', `Q1: 흔히 ${WHAT}. 이 코드는?`))
    expect(quizItems(store)[0]!.isRetry).toBeUndefined()
    await answer(ui, w, mineKey(store, 0), '안쪽 함수가 바깥 count를 기억해 이어서 셉니다', RIGHT)
    expect((store.get('concepts') as Record<string, { knownAt?: number }>)['c:클로저']!.knownAt).toBe(NOW)
    expect(slipsOf(store)['c:클로저']!.fixedAt).toBe(NOW)
    await ui.unmount()
  })
})

describe('1.7.0: team-term practice from the team file\'s ## 용어 (D6)', () => {
  const DAY = 86_400_000
  const TEAM_PATH = '/proj/.claude/learn-notes.md'
  const FETCHER_PATH = '/proj/src/lib/fetcher.ts'
  const FETCHER = [
    'import { base } from "./base"',
    '',
    '/** 팀의 API 호출 */',
    'export async function fetcher(url: string) {',
    '  const res = await fetch(base + url)',
    '  if (!res.ok) throw new Error(String(res.status))',
    '  return res.json()',
    '}',
    '',
  ].join('\n')
  const TERMS = [
    '## 규칙',
    '- API 호출은 fetcher로 감쌉니다',
    '## 용어',
    '- **fetcher**: 우리 팀의 API 호출 함수입니다 · `src/lib/fetcher.ts:4-8`',
    '- **캐시 키**: 요청마다 캐시를 나누는 이름입니다',
    '- **페이지네이션 커서**: 다음 쪽을 가리키는 값입니다 · `src/api/list.ts`',
    '',
  ].join('\n')
  const QUESTIONS = ['T1: 왜', 'Q1: 문제 하나', 'A1: 답 하나', 'T2: 예측', 'Q2: 문제 둘', 'A2: 답 둘', 'T3: 왜', 'Q3: 문제 셋', 'A3: 답 셋'].join('\n')
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const WRONG = '판정: 틀림\n피드백: 아직 아닙니다.'
  /** A concept due today: met once five days ago, never quizzed. */
  const due = (name: string) => ({ name, count: 1, firstAt: NOW - 5 * DAY, lastAt: NOW - 5 * DAY, blurb: `${name} 설명`, files: [] })
  /** A concept not due for days yet. */
  const later = (name: string) => ({ name, count: 2, firstAt: NOW - 1000, lastAt: NOW - 1000, blurb: `${name} 설명`, files: [] })
  const conceptsOf = (store: Map<string, unknown>) => (store.get('concepts') ?? {}) as Record<string, { name: string; count: number; blurb: string; files: string[]; reviewedAt?: number; missedAt?: number; step?: number }>
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items

  /** A store an earlier version used (no welcome toast), with these concepts. */
  function storeWith(concepts: Record<string, unknown> = {}, more: [string, unknown][] = []): Map<string, unknown> {
    return new Map<string, unknown>([['welcomed', true], ['concepts', concepts], ...more])
  }
  function withTeam(w: World, terms = TERMS) {
    w.files.set(TEAM_PATH, terms)
    w.files.set(FETCHER_PATH, FETCHER)
  }
  async function answer(ui: Awaited<ReturnType<typeof pane>>, w: World, key: string, text: string, reply: string) {
    w.answer = reply
    await ui.input({ key, text })
    await w.clock.settle()
  }

  test('a pane with no note and no concept offers the team terms: the views, one line for them, and how far in the concepts view', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith())
    withTeam(w)
    await start($)
    const ui = await pane($)
    // The line that the team file was read gives way to the practice it offers (the cut); the views are a key away.
    const line = await ui.find({ type: 'Text', text: '팀 용어 3개로 연습할 수 있습니다 · 4에서 s' })
    expect(line?.props.dimColor).toBe(true)
    expect(await ui.find({ type: 'Text', text: /팀 규칙 파일을 읽었습니다/ })).toBeUndefined()
    expect(await ui.find({ type: 'Button', key: 'view-quiz' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /3으로 보기/ })).toBeUndefined()
    await ui.press({ key: 'view-concepts' })
    expect(await ui.find({ type: 'Text', text: '팀 용어 3개 중 0개 만남 · 4에서 s' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '아직: fetcher · 캐시 키 외 1개' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /아직 모인 개념이 없습니다/ })).toBeDefined()
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^s를 누르면 이 저장소의 팀 용어로 3문제를 냅니다 · 먼저 떠올려 적어 보세요/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: '퀴즈 시작' })).toBeDefined()
    await ui.unmount()
    // /learn opens a pane with keys to use.
    expect((await learn($, '')).text).toContain('패널의 키를 쓰려면 ctrl+x tab')
  })

  test('a team file with rules only, or one read as nothing, says what it said before', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith())
    w.files.set(TEAM_PATH, '## 규칙\n- 바뀌지 않는 값은 const로 선언한다\n## 빼기\n- legacy/**\n')
    await start($)
    const ui = await pane($)
    expect(await ui.find({ type: 'Text', text: '이 저장소의 팀 규칙 파일을 읽었습니다 (규칙 1 · 용어 0 · 빼기 1)' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'view-quiz' })).toBeUndefined()
    await ui.unmount()
    expect((await learn($, 'quiz 팀')).text).toBe('이 저장소에는 팀 용어가 없습니다 · .claude/learn-notes.md의 ## 용어에 적습니다')
    expect(w.models).toHaveLength(0)
    expect(w.toasts.some(toast => toast.includes('팀 용어'))).toBe(false)
  })

  test('the toast comes once per repository, never in the welcome\'s session, never with every term met', async ($, on) => {
    const store = storeWith()
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    expect(w.toasts).toEqual(['이 저장소의 팀 용어 3개로 연습할 수 있습니다 · /learn 퀴즈'])
    expect(store.get('teamNudged')).toEqual([rootTag('/proj')])
  })

  test('a repository whose toast showed before says nothing', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith({}, [['teamNudged', [rootTag('/proj')]]]))
    withTeam(w)
    await start($)
    expect(w.toasts).toEqual([])
  })

  test('a new install\'s first session gets the welcome alone, and keeps the team toast for the next', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    expect(w.toasts).toHaveLength(1)
    expect(w.toasts[0]).toContain('learn-notes가 켜졌습니다')
    expect(store.get('teamNudged')).toBeUndefined()
  })

  test('with three concepts due, the toast names the team\'s own quiz; with every term met, there is none', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith({ 'c:a': due('a'), 'c:b': due('b'), 'c:c': due('c') }))
    withTeam(w)
    await start($)
    expect(w.toasts).toEqual(['이 저장소의 팀 용어 3개로 연습할 수 있습니다 · /learn 퀴즈 팀'])
  })

  test('every term met: no toast', async ($, on) => {
    const met = { [conceptKey('fetcher')]: later('fetcher'), [conceptKey('캐시 키')]: later('캐시 키'), [conceptKey('페이지네이션 커서')]: later('페이지네이션 커서') }
    const store = storeWith(met)
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    expect(w.toasts).toEqual([])
    expect(store.get('teamNudged')).toBeUndefined()
  })

  test('the places the concepts due leave free go to the terms not met, in the file\'s order, asked by the team\'s code; a grade puts each in the concepts', async ($, on) => {
    const store = storeWith({ 'c:클로저': due('클로저'), 'c:구조분해': later('구조 분해') })
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    w.answer = QUESTIONS
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    // One call, as ever: the one concept due, then two team terms in the file's order (not the concept due later).
    expect(w.models).toHaveLength(1)
    const prompt = w.models[0]!
    expect(prompt).toContain('\n1. 클로저 — 클로저 설명\n')
    expect(prompt).toContain('\n2. (팀 용어) fetcher — 우리 팀의 API 호출 함수입니다\n   팀 코드 (fetcher.ts 4~8줄):\n```\nexport async function fetcher(url: string) {\n')
    expect(prompt).toContain('  return res.json()\n}\n```\n3. (팀 용어) 캐시 키 — 요청마다 캐시를 나누는 이름입니다\n\n')
    expect(prompt).toContain('"(팀 용어)"가 붙은 개념은 이 저장소의 팀이 정한 용어다.')
    expect(prompt).not.toContain('구조 분해')
    expect(prompt).not.toContain('페이지네이션')
    // The path itself stays out of the words: the head names the file.
    expect(prompt).not.toContain('src/lib/fetcher.ts')
    expect(quizItems(store)[1]).toMatchObject({ key: 'c:fetcher', name: 'fetcher', team: true, teamCode: { file: 'fetcher.ts', from: 4, to: 8 } })
    expect(quizItems(store)[2]).toMatchObject({ name: '캐시 키', team: true })
    expect(quizItems(store)[2]!.teamCode).toBeUndefined()
    // Nothing is in the concepts until a grade puts it there.
    expect(conceptsOf(store)['c:fetcher']).toBeUndefined()

    await answer(ui, w, mineKey(store, 0), '바깥 변수를 기억해서', RIGHT)
    expect(await ui.find({ type: 'Text', text: '문제 2/3 · 팀 용어 · 예측' })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: '팀 코드 (fetcher.ts 4~8줄)' }))?.props.dimColor).toBe(true)
    // A concept's own question says neither.
    expect(await ui.find({ type: 'Text', text: /팀 용어를 개념 모음에 넣었습니다/ })).toBeUndefined()

    await answer(ui, w, mineKey(store, 1), 'res.json()의 값을 돌려줍니다', RIGHT)
    expect(await ui.find({ type: 'Text', text: '팀 용어를 개념 모음에 넣었습니다' })).toBeDefined()
    expect(conceptsOf(store)['c:fetcher']).toMatchObject({ name: 'fetcher', count: 1, blurb: '우리 팀의 API 호출 함수입니다', files: [], reviewedAt: NOW })
    expect(conceptsOf(store)['c:fetcher']!.missedAt).toBeUndefined()
    expect(store.get('teamTerms')).toEqual({ 'c:fetcher': [rootTag('/proj')] })

    await answer(ui, w, mineKey(store, 2), '캐시를 지우는 함수 이름이요', WRONG)
    expect(await ui.find({ type: 'Text', text: '팀 용어를 개념 모음에 넣었습니다 · 다음 퀴즈 맨 앞에 나옵니다' })).toBeDefined()
    expect(conceptsOf(store)[conceptKey('캐시 키')]).toMatchObject({ name: '캐시 키', count: 1, missedAt: NOW, step: 0 })
    expect(Object.keys(store.get('teamTerms') as object)).toEqual(['c:fetcher', conceptKey('캐시 키')])
    // Kept in concepts.md as any concept is.
    expect(w.writes.filter(one => one.path.endsWith('/concepts.md')).at(-1)!.text).toContain('캐시 키')

    // The concepts view: how far, the one left, and each one that came in as a team term.
    await ui.press({ key: 'view-concepts' })
    expect(await ui.find({ type: 'Text', text: '팀 용어 3개 중 2개 만남 · 4에서 s' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '아직: 페이지네이션 커서' })).toBeDefined()
    // (교차 검토 5) Right after the count, where a docked pane of 56 cells still shows it: the dates after it give way first.
    const row = (await ui.find({ type: 'Text', text: /^fetcher ×1 · 팀 용어 · 다음 복습 / }))?.text ?? ''
    expect(cells(row)).toBeGreaterThan(56)
    expect(cells(row.slice(0, row.indexOf('팀 용어') + '팀 용어'.length))).toBeLessThanOrEqual(56)
    expect(await ui.find({ type: 'Text', text: /팀 용어$/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^클로저 ×1 .*팀 용어/ })).toBeUndefined()

    // The next quiz: the term missed first (asked as a team term), then the one left, its file not there (its words alone).
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(w.models).toHaveLength(5)
    expect(w.models[4]).toContain('\n1. (팀 용어) 캐시 키 — 요청마다 캐시를 나누는 이름입니다\n')
    expect(w.models[4]).toContain('\n2. (팀 용어) 페이지네이션 커서 — 다음 쪽을 가리키는 값입니다\n')
    expect(w.models[4]).not.toContain('팀 코드 (list.ts')
    await ui.unmount()
  })

  test('a team term graded in the conversation says so too; f turns it as any grade', async ($, on) => {
    const store = storeWith()
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    w.answer = QUESTIONS
    const made = (await learn($, 'quiz')).text
    // No concept yet: the team terms fill all three places, each marked, the first with where its lines are.
    expect(made).toContain('1. (팀 용어 · 팀 코드 fetcher.ts 4~8줄) 문제 하나')
    expect(made).toContain('2. (팀 용어) 문제 둘')
    w.answer = WRONG
    const graded = (await learn($, 'quiz 1 fetch를 감싼 함수')).text
    expect(graded).toContain('1번 ✗ 틀림 · 아쉽지만 틀렸습니다. 아직 아닙니다.\n팀 용어를 개념 모음에 넣었습니다 · 다음 퀴즈 맨 앞에 나옵니다\n')
    expect(conceptsOf(store)['c:fetcher']).toMatchObject({ count: 1, missedAt: NOW })
    // Turned right, as any grade: its miss is gone, the term stays in the concepts.
    const turned = (await learn($, 'quiz 맞음 1')).text
    expect(turned).toContain('맞힌 것으로 적었습니다: 1. fetcher.')
    expect(turned).toContain('\n팀 용어를 개념 모음에 넣었습니다')
    expect(conceptsOf(store)['c:fetcher']!.missedAt).toBeUndefined()
    expect(conceptsOf(store)['c:fetcher']!.count).toBe(1)
    // Seen and graded by the learner, a team term goes in the same way.
    await learn($, 'quiz 정답 2')
    expect((await learn($, 'quiz 맞음 2')).text).toContain('\n팀 용어를 개념 모음에 넣었습니다')
    expect(conceptsOf(store)[conceptKey('캐시 키')]).toMatchObject({ count: 1, reviewedAt: NOW })
  })

  test('/learn 퀴즈 팀 asks the team terms alone: the ones not met first, then the ones met, due first', async ($, on) => {
    const store = storeWith({ 'c:클로저': due('클로저'), 'c:a': due('a'), 'c:b': due('b'), [conceptKey('캐시 키')]: due('캐시 키'), 'c:fetcher': later('fetcher') })
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    w.answer = QUESTIONS
    // Three concepts due fill a review quiz: none of the team terms gets in.
    await learn($, 'quiz')
    expect(w.models[0]).not.toContain('(팀 용어)')
    const made = (await learn($, 'quiz 팀')).text
    expect(made).toMatch(/^팀 용어 퀴즈 · 3문제\n/)
    const prompt = w.models[1]!
    expect(prompt).toContain('\n1. (팀 용어) 페이지네이션 커서 — ')
    expect(prompt).toContain('\n2. (팀 용어) 캐시 키 — 요청마다 캐시를 나누는 이름입니다\n')
    // One met and not due fills the last place, asked by the team's code as a team term of this repository.
    expect(prompt).toContain('\n3. (팀 용어) fetcher — 우리 팀의 API 호출 함수입니다\n   팀 코드 (fetcher.ts 4~8줄):')
    expect(prompt).not.toContain('클로저')
    expect(quizItems(store).every(item => item.team === true)).toBe(true)
    // Its other words ask for it too.
    w.answer = QUESTIONS
    expect((await learn($, 'quiz 팀 용어')).text).toMatch(/^팀 용어 퀴즈/)
  })

  test('/learn 퀴즈 팀 with every term known asks nothing, and says how to take one back', async ($, on) => {
    const known = (name: string) => ({ ...later(name), knownAt: NOW - DAY })
    const w = world(on, 'ok', null, true, storeWith({ 'c:fetcher': known('fetcher'), [conceptKey('캐시 키')]: known('캐시 키'), [conceptKey('페이지네이션 커서')]: known('페이지네이션 커서') }))
    withTeam(w)
    await start($)
    expect((await learn($, 'quiz 팀')).text).toBe('이 저장소의 팀 용어는 모두 아는 개념이라 퀴즈에 낼 것이 없습니다. 되돌리려면 /learn 모른다 개념 이름.')
    expect(w.models).toHaveLength(0)
  })

  test('/learn 복습 with no concept makes no quiz of the team terms unasked; /learn 퀴즈 does', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith())
    withTeam(w)
    await start($)
    const review = (await learn($, '복습')).text
    expect(review).toContain('지금 복습할 개념이 없습니다')
    expect(w.models).toHaveLength(0)
    w.answer = QUESTIONS
    await learn($, 'quiz')
    expect(w.models).toHaveLength(1)
    expect(w.models[0]!.match(/\n\d\. \(팀 용어\)/g)).toHaveLength(3)
  })

  test('a term\'s file is read only inside the repository, when nothing leaves it out; else the term is asked by its words', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith())
    withTeam(
      w,
      [
        '## 용어',
        '- **바깥**: 저장소 밖 · `../outside/a.ts:1-3`',
        '- **링크**: 밖으로 가는 링크 · `src/link.ts`',
        '- **자격 증명**: 비밀 파일 · `config/credentials.json`',
        '## 빼기',
        '- legacy/**',
      ].join('\n'),
    )
    w.files.set('/proj/src/link.ts', 'export const 링크 = 1\n')
    w.links.set('/proj/src/link.ts', '/home/u/private/link.ts')
    w.files.set('/proj/config/credentials.json', '{ "링크": "x", "자격 증명": "y" }\n')
    // The permission rules refuse one file (asked below).
    on('tool.check', { tool: 'Read' }, (_$, e) => ({ decision: String((e.input as { file_path?: string }).file_path).endsWith('denied.ts') ? 'deny' : 'allow' }))
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz 팀')
    expect(w.models[0]).toContain('(팀 용어) 바깥 — 저장소 밖 · `../outside/a.ts:1-3`')
    expect(w.models[0]).not.toContain('팀 코드 (')
    expect(w.models[0]).not.toContain('export const 링크')
    expect(w.models[0]).not.toContain('"y"')

    // Left out by the team file's ## 빼기, too big, refused by the permission rules, or not text: the words alone.
    w.files.set(
      TEAM_PATH,
      ['## 용어', '- **옛 코드**: 옛 방식 · `legacy/old.ts`', '- **큰 파일**: 큰 것 · `src/big.ts`', '- **막힌 파일**: 막힘 · `src/denied.ts`', '## 빼기', '- legacy/**'].join('\n'),
    )
    w.mtimes.set(TEAM_PATH, 1000)
    w.files.set('/proj/legacy/old.ts', 'const 옛코드 = 1\n')
    w.files.set('/proj/src/big.ts', `// 큰 파일\n${'x'.repeat(250_000)}`)
    w.files.set('/proj/src/denied.ts', 'const 막힌 = 1 // 막힌 파일\n')
    w.answer = QUESTIONS
    await learn($, 'quiz 팀')
    expect(w.models[1]).toContain('(팀 용어) 옛 코드 — 옛 방식')
    expect(w.models[1]).not.toContain('팀 코드 (')
    expect(w.models[1]).not.toContain('옛코드 = 1')
    expect(w.models[1]).not.toContain('xxxxxxxxxx')
    expect(w.models[1]).not.toContain('막힌 = 1')
  })

  test('a term\'s file that is not text is not quoted', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith())
    withTeam(w, '## 용어\n- **그림 자료**: 이진 파일 · `src/data.json:1-2`\n')
    w.files.set('/proj/src/data.json', '그림 자료\u0000\u0001\n둘째 줄\n')
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz 팀')
    expect(w.models[0]).toContain('(팀 용어) 그림 자료 — 이진 파일')
    expect(w.models[0]).not.toContain('팀 코드 (')
    expect(w.models[0]).not.toContain('둘째 줄')
  })

  test('a term\'s code goes to the model with its secrets masked', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith())
    withTeam(w, '## 용어\n- **API 키 설정**: 키를 두는 곳 · `src/config.ts:1-2`\n')
    w.files.set('/proj/src/config.ts', 'const API_KEY = "sk-ant-api03-AAAAAAAAAAAAAAAAAAAA"\nexport default API_KEY\n')
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz 팀')
    expect(w.models[0]).toContain('팀 코드 (config.ts 1~2줄):')
    expect(w.models[0]).toContain('export default API_KEY')
    expect(w.models[0]).not.toContain('AAAAAAAAAAAAAAAAAAAA')
  })

  test('(교차 검토 7) a term naming a committed note (.md, D7) is asked by it as the team note: from its top when the name is not in it, 40 lines at most', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith())
    withTeam(w, '## 용어\n- **fetcher**: 우리 팀의 API 호출 함수입니다 · `docs/learn/fetcher.md`\n')
    // A note copied with c and committed: its head is the note's summary, the term's name nowhere in it.
    const note = [
      '**[학습 노트] 응답이 401이면 토큰을 새로 받아 다시 부릅니다**',
      '10-13 · 파일 2개 · 개념: async/await · try/catch',
      ...Array.from({ length: 43 }, (_, i) => `- 줄 ${i + 3}`),
    ]
    w.files.set('/proj/docs/learn/fetcher.md', note.join('\n'))
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz 팀')
    expect(w.models[0]).toContain('\n   팀 노트 (fetcher.md 1~40줄):\n```\n**[학습 노트] 응답이 401이면')
    expect(w.models[0]).toContain('- 줄 20\n')
    expect(w.models[0]).toContain('- 줄 40\n')
    expect(w.models[0]).not.toContain('- 줄 41')
    expect(w.models[0]).not.toContain('팀 코드 (')
  })

  test('(교차 검토) a term naming a local settings file (wp-config.php, appsettings.*.json) is asked by its words: no line of it goes anywhere', async ($, on) => {
    const store = storeWith()
    const w = world(on, 'ok', null, true, store)
    withTeam(
      w,
      [
        '## 용어',
        '- **DB 설정**: 사이트가 DB에 붙는 곳 · `wp-config.php:1-6`',
        '- **연결 문자열**: 앱이 DB를 찾는 곳 · `appsettings.Development.json:1-5`',
        '- **DB 링크**: 설정을 다시 부르는 곳 · `src/db.php:1-5`',
      ].join('\n'),
    )
    // Forms no masking rule catches: PHP's define and a password inside a JSON string.
    const wp = ['<?php', "define( 'DB_NAME', 'site' );", "define( 'DB_PASSWORD', 'Sup3r-S3cret-pw' );", "define( 'AUTH_KEY', 'q8#Lx@1!zZ-salt' );", "$table_prefix = 'wp_';", ''].join('\n')
    w.files.set('/proj/wp-config.php', wp)
    w.files.set('/proj/appsettings.Development.json', ['{', '  "ConnectionStrings": {', '    "Default": "Server=db;Database=app;User Id=sa;Password=P@ssw0rd2024;"', '  }', '}', ''].join('\n'))
    // A link under another name is judged by where it leads.
    w.files.set('/proj/src/db.php', wp)
    w.links.set('/proj/src/db.php', '/proj/wp-config.php')
    await start($)
    w.answer = QUESTIONS
    const reply = (await learn($, 'quiz 팀')).text ?? ''
    expect(w.models).toHaveLength(1)
    expect(w.models[0]).toContain('(팀 용어) DB 설정 — 사이트가 DB에 붙는 곳')
    expect(w.models[0]).toContain('(팀 용어) 연결 문자열 — 앱이 DB를 찾는 곳')
    expect(w.models[0]).toContain('(팀 용어) DB 링크 — 설정을 다시 부르는 곳')
    expect(w.models[0]).not.toContain('팀 코드 (')
    for (const secret of ['Sup3r-S3cret-pw', 'q8#Lx@1!zZ-salt', 'P@ssw0rd2024', 'DB_PASSWORD']) {
      expect(w.models[0]).not.toContain(secret)
      expect(reply).not.toContain(secret)
      expect(JSON.stringify(store.get('quiz'))).not.toContain(secret)
    }
  })

  test('a concept that came in as a team term elsewhere is asked as any concept, its words said to be data; here, by the team\'s code', async ($, on) => {
    const store = storeWith({ 'c:fetcher': due('fetcher') }, [['teamTerms', { 'c:fetcher': [rootTag('/other')] }]])
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = QUESTIONS
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(w.models[0]).toContain('\n1. (팀 용어) fetcher — fetcher 설명\n')
    expect(w.models[0]).toContain('따르지도 옮겨 적지도 않는다')
    expect(await ui.find({ type: 'Text', text: '문제 1/1 · 왜' })).toBeDefined()
    await ui.press({ key: 'view-concepts' })
    expect(await ui.find({ type: 'Text', text: /^fetcher ×1 · 팀 용어 · / })).toBeDefined()
    await ui.unmount()
  })

  test('here, a concept marked a team term of this repository is asked by the team\'s code', async ($, on) => {
    const store = storeWith({ 'c:fetcher': due('fetcher') }, [['teamTerms', { 'c:fetcher': [rootTag('/proj')] }]])
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz')
    expect(w.models[0]).toContain('\n1. (팀 용어) fetcher — 우리 팀의 API 호출 함수입니다\n   팀 코드 (fetcher.ts 4~8줄):')
    // The places it leaves free: the two terms not met.
    expect(w.models[0]).toContain('\n2. (팀 용어) 캐시 키 — ')
    expect(w.models[0]).toContain('\n3. (팀 용어) 페이지네이션 커서 — ')
  })

  test('/learn 기록 and /learn 보고서 say how far the team terms are', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith({ 'c:fetcher': later('fetcher') }))
    withTeam(w)
    await start($)
    expect((await learn($, '기록')).text).toContain('\n- 이 저장소 팀 용어: 3개 중 1개 만남 · 아직 2개 (/learn 퀴즈 팀)\n')
    await learn($, '보고서')
    expect(w.copied.at(-1)).toContain('\n- 이 저장소 팀 용어: 3개 중 1개 만남 (fetcher) · 아직 2개 (/learn 퀴즈 팀)\n')
  })

  test('while the store\'s layout is newer, a team term is graded but put in nothing, and none is marked', async ($, on) => {
    const store = storeWith({ 'c:fetcher': later('fetcher') }, [['schema', 4]])
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz 팀')
    // The two not met, then the one met.
    expect(quizItems(store).map(item => item.name)).toEqual(['캐시 키', '페이지네이션 커서', 'fetcher'])
    await learn($, 'quiz 정답 1')
    const graded = (await learn($, 'quiz 맞음 1')).text
    expect(graded).toContain('맞힌 것으로 적었습니다: 1. 캐시 키.')
    expect(graded).not.toContain('팀 용어를 개념 모음에 넣었습니다')
    // The one met is graded too, and marked a team term nowhere.
    await learn($, 'quiz 정답 3')
    expect((await learn($, 'quiz 맞음 3')).text).toContain('맞힌 것으로 적었습니다: 3. fetcher.')
    for (const key of ['concepts', 'teamTerms']) expect(w.sets).not.toContain(key)
    expect(store.get('teamTerms')).toBeUndefined()
  })

  // The review of 1.7.0 (6/8): what the two reviewers found, held here.

  test('the team quiz asked in other words is made, and never graded as the open question\'s answer', async ($, on) => {
    const store = storeWith({ 'c:클로저': due('클로저') })
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz')
    expect((await learn($, 'quiz 도움말')).text).toContain(' · 팀 (팀 용어만)')
    // The usage's own words, and the ways a learner may say them: the team's quiz each time.
    for (const said of ['팀 용어로', '팀으로', '팀 용어만', '팀용어', '팀 용어 퀴즈 해 줘', 'team terms']) {
      w.answer = QUESTIONS
      expect((await learn($, `quiz ${said}`)).text).toMatch(/^팀 용어 퀴즈 · 3문제\n/)
    }
    expect(w.models).toHaveLength(7)
    // Other words after 팀: no answer either, nothing graded, and the reply says how to answer.
    w.answer = WRONG
    expect((await learn($, 'quiz 팀 용어 문제를 내 줘')).text).toMatch(/^명령 낱말/)
    expect((await learn($, 'quiz team quiz please now')).text).toMatch(/^명령 낱말/)
    expect(w.models).toHaveLength(7)
    expect(quizItems(store)[0]!.firstTry).toBeUndefined()
    expect(quizItems(store)[0]!.result).toBeUndefined()
    // An answer whose first word only starts with 팀 is graded as ever.
    w.answer = RIGHT
    expect((await learn($, 'quiz 팀에서 쓰는 API 호출 함수')).text).toContain('\n1번 ✓')
    expect(w.models).toHaveLength(8)
  })

  test('slips asked again fill a quiz as concepts due do: the pane and the toast send the learner to the team\'s own quiz', async ($, on) => {
    const slipOf = (at: number) => ({ what: '값과 참조를 헷갈림', type: 'reference', question: '지난 문제', mine: '내 답', at, times: 1 })
    const store = storeWith({ 'c:클로저': due('클로저'), 'c:a': later('a'), 'c:b': later('b') }, [['slips', { 'c:a': slipOf(NOW - 500), 'c:b': slipOf(NOW - 400) }]])
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    expect(w.toasts).toEqual(['이 저장소의 팀 용어 3개로 연습할 수 있습니다 · /learn 퀴즈 팀'])
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-concepts' })
    expect(await ui.find({ type: 'Text', text: '팀 용어 3개 중 0개 만남 · /learn 퀴즈 팀' })).toBeDefined()
    await ui.unmount()
    // As it says: the review alone fills /learn 퀴즈, and /learn 퀴즈 팀 asks the terms.
    w.answer = QUESTIONS
    await learn($, 'quiz')
    expect(w.models[0]).not.toContain('(팀 용어)')
    await learn($, 'quiz 팀')
    expect(w.models[1]!.match(/\n\d\. \(팀 용어\)/g)).toHaveLength(3)
  })

  test('with a quiz still open from before, the toast names the team\'s own quiz, which is made at once', async ($, on) => {
    const open = { at: NOW - 3600_000, isRevealed: false, items: [{ key: 'c:클로저', name: '클로저', question: '옛 문제 하나', answer: '옛 답' }] }
    const w = world(on, 'ok', null, true, storeWith({ 'c:클로저': due('클로저') }, [['quiz', open]]))
    withTeam(w)
    await start($)
    expect(w.toasts).toEqual(['이 저장소의 팀 용어 3개로 연습할 수 있습니다 · /learn 퀴즈 팀'])
    w.answer = QUESTIONS
    expect((await learn($, 'quiz 팀')).text).toMatch(/^팀 용어 퀴즈 · 3문제\n/)
    expect(w.models).toHaveLength(1)
  })

  test('missed again where it was asked again: the conversation names a note only when one taught the concept', async ($, on) => {
    const slip = { what: '이름을 함수로 헷갈림', type: 'reference', question: '지난 문제', mine: '내 답', at: NOW - 2 * DAY, times: 1 }
    const seeded = (name: string) => ({ name, count: 1, firstAt: NOW - 2 * DAY, lastAt: NOW - 2 * DAY, blurb: `${name} 설명`, files: [], reviewedAt: NOW - 2 * DAY, missedAt: NOW - 2 * DAY, step: 0 })
    const asked = (key: string, name: string, more: Record<string, unknown>) => ({ key, name, question: `${name} 문제`, answer: `${name} 답`, isRetry: true, ...more })
    const store = storeWith({ [conceptKey('캐시 키')]: seeded('캐시 키'), 'c:클로저': seeded('클로저') }, [
      ['slips', { [conceptKey('캐시 키')]: slip, 'c:클로저': slip }],
      ['teamTerms', { [conceptKey('캐시 키')]: [rootTag('/proj')] }],
      ['quiz', { at: NOW - 1000, isRevealed: false, items: [asked(conceptKey('캐시 키'), '캐시 키', { team: true }), asked('c:클로저', '클로저', { noteId: 'note-1' })] }],
    ])
    const w = world(on, 'ok', null, true, store)
    // Worked examples on as 1.8.0 shipped them, whatever their constant (교차 검토 2 turned them off by its sample): in
    // both branches (1.10.0 G1), as 클로저 was met in no code here.
    w.harness = WORKED_BOTH
    withTeam(w)
    await start($)
    w.answer = '판정: 틀림\n피드백: 아직 아닙니다.\n헷갈린 점: 이름을 함수로 헷갈림\n유형: reference'
    // A team term no note taught: there is no note to find.
    const team = (await learn($, 'quiz 1 캐시를 지우는 함수')).text
    expect(team).toContain('\n같은 곳을 또 헷갈렸습니다\n')
    expect(team).not.toContain('/learn 찾기')
    // One a note taught (the quiz found it in one): found by its name.
    // Missed twice running (1.8.0, E3), it is promised no worked example (1.10.0 G1, 4/7 검토): the only other concept is
    // this repository's team term, so any quiz that holds 클로저 beside it holds a team term too and asks it again (D33).
    expect((await learn($, 'quiz 2 전역 변수')).text).toContain('\n같은 곳을 또 헷갈렸습니다 · 이 개념을 배운 노트: /learn 찾기 클로저\n')
  })

  test('a team file of one term offers one question, and a quiz of team terms alone is called so in the pane and the conversation', async ($, on) => {
    const store = storeWith()
    const w = world(on, 'ok', null, true, store)
    withTeam(w, '## 용어\n- **캐시 키**: 요청마다 캐시를 나누는 이름입니다\n')
    await start($)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^s를 누르면 이 저장소의 팀 용어로 1문제를 냅니다 · / })).toBeDefined()
    w.answer = ['T1: 왜', 'Q1: 문제 하나', 'A1: 답 하나'].join('\n')
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(quizItems(store)).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: /^팀 용어 퀴즈 · / })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^복습 퀴즈/ })).toBeUndefined()
    await ui.unmount()
    // Made by /learn 퀴즈 with no concept learned, the same name.
    expect((await learn($, 'quiz 새로')).text).toMatch(/^팀 용어 퀴즈 · 1문제\n/)
  })

  test('a quiz of concepts and team terms is still the review quiz', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith({ 'c:클로저': due('클로저') }))
    withTeam(w)
    await start($)
    w.answer = QUESTIONS
    expect((await learn($, 'quiz')).text).toMatch(/^복습 퀴즈 · 3문제\n/)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^복습 퀴즈 · / })).toBeDefined()
    await ui.unmount()
  })

  test('(교차 검토 5) concepts none of them due: s says the team terms alone, as the quiz it makes and the concepts view have it', async ($, on) => {
    const store = storeWith({ 'c:map': later('map'), 'c:const': later('const') })
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-concepts' })
    expect(await ui.find({ type: 'Text', text: '팀 용어 3개 중 0개 만남 · 4에서 s' })).toBeDefined()
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^s를 누르면 이 저장소의 팀 용어로 3문제를 냅니다 · 먼저 떠올려 적어 보세요/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /복습할 개념/ })).toBeUndefined()
    w.answer = QUESTIONS
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(quizItems(store).map(item => [item.name, item.team])).toEqual([['fetcher', true], ['캐시 키', true], ['페이지네이션 커서', true]])
    expect(await ui.find({ type: 'Text', text: /^팀 용어 퀴즈 · / })).toBeDefined()
    await ui.unmount()
  })

  test('(교차 검토 5) one concept due: s says the concepts and the team terms, as the quiz it makes has them', async ($, on) => {
    const store = storeWith({ 'c:map': due('map'), 'c:const': later('const') })
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^s를 누르면 복습할 개념과 이 저장소의 팀 용어로 3문제를 냅니다 · 먼저 떠올려 적어 보세요/ })).toBeDefined()
    w.answer = QUESTIONS
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(quizItems(store).map(item => [item.name, item.team === true])).toEqual([['map', false], ['fetcher', true], ['캐시 키', true]])
    expect(await ui.find({ type: 'Text', text: /^복습 퀴즈 · / })).toBeDefined()
    await ui.unmount()
  })

  test('(교차 검토 5) three concepts due fill the quiz: s says the concepts alone, as before', async ($, on) => {
    const store = storeWith({ 'c:map': due('map'), 'c:const': due('const'), 'c:let': due('let') })
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^s를 누르면 복습할 개념으로 내 코드에서 3문제를 냅니다 · / })).toBeDefined()
    w.answer = QUESTIONS
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    expect(quizItems(store).some(item => item.team === true)).toBe(false)
    await ui.unmount()
  })

  test('a team term merged into another concept keeps its · 팀 용어 at once', async ($, on) => {
    const store = storeWith({ 'c:fetcher': later('fetcher'), 'c:api함수': later('API 함수') }, [['teamTerms', { 'c:fetcher': [rootTag('/proj')] }]])
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    expect((await learn($, 'merge fetcher = API 함수')).text).toContain('합쳤습니다')
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-concepts' })
    expect(await ui.find({ type: 'Text', text: /^API 함수 ×\d+ · 팀 용어 · / })).toBeDefined()
    await ui.unmount()
  })

  test('a team question graded in another repository\'s session goes in with the team\'s words, a term of the repository it was asked in', async ($, on) => {
    const store = storeWith()
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    w.answer = QUESTIONS
    expect((await learn($, 'quiz')).text).toContain('1. (팀 용어 · 팀 코드 fetcher.ts 4~8줄) 문제 하나')
    // A first try wrong and asked back: it waits for its try again.
    w.answer = ['판정: 틀림', '피드백: 아직 아닙니다.', '되묻기: fetch는 어디서 불릴까요?'].join('\n')
    expect((await learn($, 'quiz 1 감싼 함수')).text).toContain('한 번 더')
    expect(conceptsOf(store)['c:fetcher']).toBeUndefined()
    // The next day, a session in another repository (no team file there) grades it at its start, as Claude did.
    await w.clock.advance(DAY)
    w.root = '/other'
    await start($)
    expect(conceptsOf(store)['c:fetcher']).toMatchObject({ name: 'fetcher', count: 1, blurb: '우리 팀의 API 호출 함수입니다', missedAt: NOW })
    expect(store.get('teamTerms')).toEqual({ 'c:fetcher': [rootTag('/proj')] })
    // Back in the repository it was asked in, its next quiz asks it by the team's code.
    w.root = '/proj'
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz 새로')
    expect(w.models.at(-1)).toContain('\n1. (팀 용어) fetcher — 우리 팀의 API 호출 함수입니다\n   팀 코드 (fetcher.ts 4~8줄):')
  })

  test('a link inside the repository is judged by where it leads, a folder is never read, and nothing under .git is', async ($, on) => {
    const w = world(on, 'ok', null, true, storeWith())
    withTeam(
      w,
      [
        '## 용어',
        '- **배포 키**: 배포 설정 · `docs/deploy.txt:1-3`',
        '- **막힌 별칭**: 막힌 파일로 가는 링크 · `src/alias.ts:1-2`',
        '- **안내 폴더**: 폴더 · `docs/guide:1-2`',
        '',
      ].join('\n'),
    )
    // A file under another name that leads to a secret one, and one that leads to a file the permission rules refuse.
    w.files.set('/proj/docs/deploy.txt', '[default]\naws_secret_access_key = wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY\n')
    w.links.set('/proj/docs/deploy.txt', '/proj/.aws/credentials')
    w.files.set('/proj/src/alias.ts', 'const 막힌별칭 = 1\n')
    w.links.set('/proj/src/alias.ts', '/proj/src/denied.ts')
    on('tool.check', { tool: 'Read' }, (_$, e) => ({ decision: String((e.input as { file_path?: string }).file_path).endsWith('denied.ts') ? 'deny' : 'allow' }))
    // A path some file lies under is a folder, whatever a read of it would give.
    w.files.set('/proj/docs/guide', '폴더를 읽은 줄\n둘째 줄\n')
    w.files.set('/proj/docs/guide/a.md', '# 안내\n')
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz 팀')
    const prompt = w.models[0]!
    expect(prompt).toContain('(팀 용어) 배포 키 — 배포 설정')
    expect(prompt).not.toMatch(/팀 (?:코드|노트) \(/)
    expect(prompt).not.toContain('wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY')
    expect(prompt).not.toContain('막힌별칭')
    expect(prompt).not.toContain('폴더를 읽은 줄')

    // The repository's own record (.git), named or reached by a link: its config may hold a credential.
    const CONFIG = '[remote "origin"]\n\turl = https://github.com/acme/app.git\n[http "https://github.com/"]\n\textraheader = AUTHORIZATION: basic eC1hY2Nlc3MtdG9rZW46Z2hzXzE2QzdlNDJGMjkyYzY5MjVFMjZhOEJGMjQ5\n'
    w.files.set(TEAM_PATH, ['## 용어', '- **원격 저장소**: 우리 원격 설정 · `.git/config:1-4`', '- **원격 별칭**: 링크 · `docs/remote.cfg:1-4`', '- **훅**: 훅 · `.Git/hooks/pre-commit.sh:1-2`', ''].join('\n'))
    w.mtimes.set(TEAM_PATH, 1000)
    w.files.set('/proj/.git/config', CONFIG)
    w.files.set('/proj/docs/remote.cfg', CONFIG)
    w.links.set('/proj/docs/remote.cfg', '/proj/.git/config')
    w.files.set('/proj/.Git/hooks/pre-commit.sh', 'echo 훅\n')
    w.answer = QUESTIONS
    await learn($, 'quiz 팀')
    expect(w.models[1]).toContain('(팀 용어) 원격 저장소 — 우리 원격 설정')
    expect(w.models[1]).not.toMatch(/팀 (?:코드|노트) \(/)
    expect(w.models[1]).not.toContain('eC1hY2Nlc3MtdG9rZW46')
    expect(w.models[1]).not.toContain('acme/app.git')
  })

  test('no toast, and no repository marked, in a session with no one at its terminal', async ($, on) => {
    const store = storeWith()
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
    expect(w.toasts.filter(toast => toast.includes('팀 용어'))).toEqual([])
    expect(store.get('teamNudged')).toBeUndefined()
  })

  test('no toast, and no repository marked, in a cloud session', async ($, on) => {
    const store = storeWith()
    const w = world(on, 'ok', null, true, store, { CLAUDE_CODE_REMOTE: 'true' })
    withTeam(w)
    await start($)
    expect(w.toasts.filter(toast => toast.includes('팀 용어'))).toEqual([])
    expect(store.get('teamNudged')).toBeUndefined()
  })

  test('a team term met already, graded in the team\'s quiz, keeps its count and its own words', async ($, on) => {
    const store = storeWith({ 'c:fetcher': { ...later('fetcher'), blurb: '내가 배운 fetcher' } })
    const w = world(on, 'ok', null, true, store)
    withTeam(w)
    await start($)
    w.answer = QUESTIONS
    await learn($, 'quiz 팀')
    expect(quizItems(store).map(item => item.name)).toEqual(['캐시 키', '페이지네이션 커서', 'fetcher'])
    w.answer = RIGHT
    expect((await learn($, 'quiz 3 감싼 함수')).text).toContain('3번 ✓')
    expect(conceptsOf(store)['c:fetcher']).toMatchObject({ name: 'fetcher', count: 2, blurb: '내가 배운 fetcher', reviewedAt: NOW })
    expect(store.get('teamTerms')).toEqual({ 'c:fetcher': [rootTag('/proj')] })
  })
})

describe('1.7.0: 직접 해 보기, a note\'s practice on t (D8)', () => {
  const DAY = 86_400_000
  const TOOL = 'mcp__learn-notes__notes'
  const HELLO = ['// 인사', 'function greet(name) {', '  return `안녕하세요, ${name}님!`', '}', ''].join('\n')
  const WRITE_HELLO = { tool: 'Write', tool_use_id: 'h1', file_path: '/proj/src/hello.js', content: HELLO } as const
  const LINE = 'return `안녕하세요, ${name}님!`'
  const EXAMPLE = 'return `안녕하세요, ${name || "손"}님!`'
  const PRACTICE_NOTE = [
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
    `- 고칠 줄: \`\` ${LINE} \`\``,
    '- 확인: `greet("")` → "안녕하세요, 손님!"',
    `- 예시 답: \`\` ${EXAMPLE} \`\``,
  ].join('\n')
  const WRONG = [
    '판정: 틀림',
    '피드백: 그대로면 "안녕하세요, 님!"이 됩니다.',
    '되묻기: name이 빈 문자열이면 무엇이 찍힐까요?',
    '헷갈린 점: 빈 문자열도 이름이 있는 것으로 봄',
    '유형: 없는 값',
  ].join('\n')
  type Kept = { id: string; drill?: Record<string, unknown> }
  const noteOf = (store: Map<string, unknown>) => (store.get('history') as Record<string, { notes: Kept[] }>)['/proj']!.notes.at(-1)!
  const concept = (store: Map<string, unknown>) =>
    Object.values(store.get('concepts') as Record<string, { name: string; step?: number; reviewedAt?: number; missedAt?: number }>).find(one => one.name === '템플릿 리터럴')!

  /** A world with the practice note written; its id. */
  async function written($: Engine, on: On, store: Map<string, unknown>) {
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = PRACTICE_NOTE
    await turn($, () => $.tool.call(WRITE_HELLO))
    await finish(w)
    return { w, id: noteOf(store).id }
  }

  /** As `written`, and the terminal's pane on the note. */
  async function practiced($: Engine, on: On, store = new Map<string, unknown>()) {
    const { w, id } = await written($, on, store)
    return { w, id, ui: await pane($) }
  }

  test('the note shows what to do and how to tell; t opens the line in a field with no model call, the keys in it', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    expect(w.models).toHaveLength(1)
    // What to do and how to tell, under a heading naming the file; never the line to change or the example answer.
    expect(await ui.find({ type: 'Markdown', text: /### 직접 해 보기 · hello\.js\n- 할 일: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요\n- 확인: `greet\(""\)` → "안녕하세요, 손님!"/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /고칠 줄|예시 답|name \|\| "손"/ })).toBeUndefined()
    // In the place of 이 노트 퀴즈 (the key is the same); no field until it is pressed.
    expect((await ui.find({ type: 'Button', key: 'note-drill' }))?.props).toMatchObject({ hotkey: 't', label: '직접 해 보기' })
    expect(await ui.find({ type: 'Button', key: 'note-quiz' })).toBeUndefined()
    expect(await ui.find({ type: 'Input', key: `drill-${id}` })).toBeUndefined()
    await ui.press({ key: 'note-drill' })
    expect(w.models).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: '✎ 연습입니다 · 파일은 바뀌지 않습니다' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '2  function greet(name) {' })).toBeDefined()
    const field = await ui.find({ type: 'Input', key: `drill-${id}` })
    // The line as the code has it, its indent outside the field; numbered as the file is.
    expect(field?.props).toMatchObject({ label: '3', value: LINE, placeholder: '고친 줄', submitLabel: '확인' })
    // The keys go to it first whenever the pane takes them (교차 검토), as to a quiz's answer field: the line is
    // typed into it, never into the note's letter keys.
    expect(field?.props.autoFocus).toBe(true)
    const { label, placeholder, submitLabel } = field!.props as { label: string; placeholder: string; submitLabel: string }
    expect(cells(`${label}: ${placeholder} ⏎ ${submitLabel}`)).toBeLessThanOrEqual(FIELD_CELLS)
    expect(await ui.find({ type: 'Text', text: '4  }' })).toBeDefined()
    // The field holds every letter and number key: how to get back to the buttons (the spec's words first).
    expect(await ui.find({ type: 'Text', text: 'Enter: 확인 · 코드는 영문 상태에서 · Tab: 버튼으로 (1~4 보기)' })).toBeDefined()
    // Over the field (1.7.1): the pane scrolls to the field that holds the keys, and a line under its bottom row is cut off.
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn.indexOf('코드는 영문 상태에서')).toBeGreaterThan(-1)
    expect(drawn.indexOf('코드는 영문 상태에서')).toBeLessThan(drawn.indexOf('"placeholder":"고친 줄"'))
    expect(focusesOf(w).at(-1)).toBe(`drill-${id}`)
    // Before one try there is no example to see.
    expect(await ui.find({ type: 'Button', key: 'note-drill-answer' })).toBeUndefined()
    // No quiz was made, none kept.
    expect(store.get('quiz')).toBeUndefined()
    await ui.unmount()
  })

  test('Enter with the line unchanged, empty, or typed in a Korean input mode says so with no call; the example\'s own line is done with none', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    // What is typed stays in the field when the pane draws again (t once more draws it).
    await ui.input({ key: `drill-${id}`, text: 'return 1', kind: 'change' })
    await ui.press({ key: 'note-drill' })
    expect((await ui.find({ type: 'Input', key: `drill-${id}` }))?.props.value).toBe('return 1')
    await ui.input({ key: `drill-${id}`, text: `  ${LINE};  ` })
    expect((await ui.find({ type: 'Text', text: '아직 바꾼 곳이 없습니다 · 줄을 고친 뒤 Enter' }))?.props.color).toBe('yellow')
    // Over the field too (1.7.1), with the line saying what Enter does: under a field on the pane's bottom row it was cut off.
    const told = JSON.stringify(await ui.drawn())
    expect(told.indexOf('아직 바꾼 곳이 없습니다')).toBeGreaterThan(-1)
    expect(told.indexOf('아직 바꾼 곳이 없습니다')).toBeLessThan(told.indexOf('"placeholder":"고친 줄"'))
    // The line is there while a notice shows, not left out for it.
    expect(told.indexOf('Enter: 확인 · 코드는 영문 상태에서')).toBeGreaterThan(-1)
    expect(told.indexOf('Enter: 확인 · 코드는 영문 상태에서')).toBeLessThan(told.indexOf('"placeholder":"고친 줄"'))
    await ui.input({ key: `drill-${id}`, text: 'ㄱㄷ셔구 ㅜ믇' })
    expect(await ui.find({ type: 'Text', text: '코드는 영문 상태에서 적습니다' })).toBeDefined()
    // Typed in a Korean input mode, the very case the line is for: it is still over the field.
    expect(await ui.find({ type: 'Text', text: 'Enter: 확인 · 코드는 영문 상태에서 · Tab: 버튼으로 (1~4 보기)' })).toBeDefined()
    expect((await ui.find({ type: 'Input', key: `drill-${id}` }))?.props.value).toBe('ㄱㄷ셔구 ㅜ믇')
    await ui.input({ key: `drill-${id}`, text: '  ' })
    expect(await ui.find({ type: 'Text', text: "줄이 비었습니다 · 고친 줄을 적고 Enter · 모르겠으면 '모르겠어요'" })).toBeDefined()
    expect(w.models).toHaveLength(1)
    expect(noteOf(store).drill).toBeUndefined()
    // The example's own line, other quotes and spaces aside: done, no call.
    await ui.input({ key: `drill-${id}`, text: "return `안녕하세요, ${name||'손'}님!`;" })
    expect(w.models).toHaveLength(1)
    expect((await ui.find({ type: 'Text', text: '✓ 해냈습니다' }))?.props.color).toBe('green')
    expect(await ui.find({ type: 'Markdown', text: /^예시 답과 견주기/ })).toBeUndefined()
    // A concept's practice has no team rule to fix by: no line for one under it (1.9.0 F2).
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeUndefined()
    expect(await ui.find({ type: 'Input', key: `drill-${id}` })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: '아직 바꾼 곳이 없습니다 · 줄을 고친 뒤 Enter' })).toBeUndefined()
    expect(focusesOf(w).at(-1)).toBe('note-drill')
    // Gone over: its concept marked, the day's answers counted as a practice (not toward the review), and journaled.
    expect(concept(store).reviewedAt).toBeGreaterThanOrEqual(NOW)
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 1, wrong: 0, drills: 1 } })
    expect(noteOf(store).drill).toMatchObject({ verdict: 'right', mine: "return `안녕하세요, ${name||'손'}님!`;", feedback: '' })
    const journal = w.journal().at(-1)!.text
    expect(journal).toMatch(/## \d{4}-\d{2}-\d{2} 직접 해 보기 \(\d\d:\d\d\)/)
    expect(journal).toContain('**할 일**: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요')
    expect(journal).toContain('**판정**: ✓ 해냈습니다')
    // The note's own section in the journal keeps the line and the example.
    expect(journal).toContain(`- 예시 답: \`\` ${EXAMPLE} \`\``)
    // A practice is no review: the quiz and the bank are untouched.
    expect(store.get('quiz')).toBeUndefined()
    expect(store.get('quizBank')).toBeUndefined()
    await ui.unmount()
  })

  test('a line of the learner\'s own goes to Claude once, with what to do, the check, the example and the lines around it: right, the example beside it', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = '판정: 맞음\n피드백: 이름이 비면 "손"이 들어가 "손님"이 됩니다.'
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name ? name : "손"}님!`' })
    await w.clock.settle()
    expect(w.models).toHaveLength(2)
    const asked = w.models[1]!
    expect(asked).toContain('## 문제\n할 일: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요\n확인: `greet("")` → "안녕하세요, 손님!"\n학습자가 고칠 줄 (hello.js 3행):')
    expect(asked).toContain('```\nfunction greet(name) {\n  return `안녕하세요, ${name}님!`\n}\n```')
    expect(asked).toContain(`## 모범 답\n${EXAMPLE}`)
    expect(asked).toContain('## 학습자의 답\nreturn `안녕하세요, ${name ? name : "손"}님!`')
    expect(asked).toContain('바꿔 보기 문제다.')
    expect(asked).toContain('## 개념\n템플릿 리터럴')
    expect(w.budgets.at(-1)).toBe(480)
    expect(await ui.find({ type: 'Text', text: '✓ 해냈습니다' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: `예시 답과 견주기: \`\` ${EXAMPLE} \`\`` })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '이름이 비면 "손"이 들어가 "손님"이 됩니다.' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '내 줄: return `안녕하세요, ${name ? name : "손"}님!`' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeUndefined()
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 1, wrong: 0, drills: 1 } })
    await ui.unmount()
  })

  test('short of right, Claude asks back and the line stays for one try again; then it is over, its miss kept as a slip; a shows the example', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = WRONG
    const mine = 'return `안녕하세요, ${name}님!!`'
    await ui.input({ key: `drill-${id}`, text: mine })
    await w.clock.settle()
    expect(w.models).toHaveLength(2)
    expect((await ui.find({ type: 'Text', text: '✗ 아직입니다 · 한 번 더 고쳐 보세요' }))?.props.color).toBe('red')
    expect(await ui.find({ type: 'Markdown', text: '그대로면 "안녕하세요, 님!"이 됩니다.' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: '**되묻기:** name이 빈 문자열이면 무엇이 찍힐까요?' })).toBeDefined()
    // The learner's line stays, in a field of its own; a for the example once tried, as in a quiz.
    expect(await ui.find({ type: 'Input', key: `drill-${id}` })).toBeUndefined()
    expect((await ui.find({ type: 'Input', key: `drill-${id}-again` }))?.props.value).toBe(mine)
    expect(focusesOf(w).at(-1)).toBe(`drill-${id}-again`)
    expect((await ui.find({ type: 'Button', key: 'note-drill-answer' }))?.props).toMatchObject({ hotkey: 'a', label: '예시 답' })
    expect(await ui.find({ type: 'Text', text: 'Enter: 다시 확인 · 코드는 영문 상태에서 · Tab: 버튼으로 (a 예시 답)' })).toBeDefined()
    // Nothing graded yet: no mark, no count; the try kept on the note.
    expect(concept(store).reviewedAt).toBeUndefined()
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 0 } })
    expect(noteOf(store).drill).toMatchObject({ firstTry: { mine, verdict: 'wrong', nudge: 'name이 빈 문자열이면 무엇이 찍힐까요?' } })
    // The same line again is no try.
    await ui.input({ key: `drill-${id}-again`, text: mine })
    expect(await ui.find({ type: 'Text', text: '아직 바꾼 곳이 없습니다 · 줄을 고친 뒤 Enter' })).toBeDefined()
    expect(w.models).toHaveLength(2)
    // The try again carries the first, and is the last.
    w.answer = '판정: 거의\n피드백: 빈 문자열일 때 따옴표 안이 비었습니다.'
    await ui.input({ key: `drill-${id}-again`, text: 'return `안녕하세요, ${name || ""}님!`' })
    await w.clock.settle()
    expect(w.models).toHaveLength(3)
    expect(w.models[2]).toContain(`## 학습자의 첫 답과 받은 되묻기\n첫 답: ${mine}\n첫 판정: 틀림`)
    expect(w.models[2]).toContain('마지막 시도다. 되묻기는 쓰지 않는다.')
    // Wrong, then partly right: wrong, as a quiz's; its concept back to the first step, first in the next quiz.
    expect((await ui.find({ type: 'Text', text: '✗ 틀림' }))?.props.color).toBe('red')
    expect(await ui.find({ type: 'Text', text: '내 줄: return `안녕하세요, ${name || ""}님!`' })).toBeDefined()
    expect(await ui.find({ type: 'Input', key: `drill-${id}-again` })).toBeUndefined()
    expect(concept(store)).toMatchObject({ step: 0, missedAt: expect.any(Number) })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 1, drills: 1 } })
    // What the first line showed is kept for the next quiz to ask again in other code, the line as the answer.
    const slips = store.get('slips') as Record<string, { what: string; type: string; question: string; mine: string }>
    expect(Object.values(slips)).toEqual([
      expect.objectContaining({ what: '빈 문자열도 이름이 있는 것으로 봄', type: 'nullish', question: '직접 해 보기: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요', mine }),
    ])
    expect(focusesOf(w).at(-1)).toBe('note-drill-answer')
    await ui.press({ key: 'note-drill-answer' })
    expect(await ui.find({ type: 'Text', text: '✗ 틀림 · 예시 답 봄' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: `**예시 답:** \`\` ${EXAMPLE} \`\`` })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'note-drill-answer' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeUndefined()
    // a was where the keys went, and it is gone: they go to the practice's own place (교차 검토 7).
    expect(focusesOf(w).at(-1)).toBe('note-drill')
    expect(w.models).toHaveLength(3)
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 1, drills: 1 } })
    expect(noteOf(store).drill).toMatchObject({ verdict: 'wrong', isAnswerSeen: true })
    await ui.unmount()
  })

  test('a pressed twice before the first lands (교차 검토 6): the practice is ended once, counted once, journaled once', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = WRONG
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name}님!!`' })
    await w.clock.settle()
    expect(noteOf(store).drill).toMatchObject({ firstTry: { verdict: 'wrong' } })
    const before = w.journal().length
    // Two a's that come in together, as a busy terminal hands a held or batched key on: the second reads the note
    // before the first has stored its example seen.
    await Promise.all([ui.press({ key: 'note-drill-answer' }), ui.press({ key: 'note-drill-answer' })])
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: '✗ 틀림 · 예시 답 봄' })).toBeDefined()
    expect(noteOf(store).drill).toMatchObject({ verdict: 'wrong', isAnswerSeen: true })
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 1, drills: 1 } })
    expect(Object.values(store.get('slips') as Record<string, { times: number }>)).toEqual([expect.objectContaining({ times: 1 })])
    expect(w.journal().length - before).toBe(1)
    expect(w.journal().at(-1)!.text.match(/직접 해 보기 \(\d\d:\d\d\)/g)).toHaveLength(1)
    expect(w.models).toHaveLength(2)
    // Once it has landed, a is no longer there to press.
    expect(await ui.find({ type: 'Button', key: 'note-drill-answer' })).toBeUndefined()
    await ui.unmount()
  })

  test('a after one try ends it with the example seen, its step kept; "모르겠어요" is a try with no call, twice it is over', async ($, on) => {
    const known = { 'c:템플릿리터럴': { name: '템플릿 리터럴', count: 1, firstAt: NOW - 60 * DAY, lastAt: NOW - 60 * DAY, blurb: '', files: [], step: 2, reviewedAt: NOW - 30 * DAY } }
    const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', known], ['steps', ownSteps(known)]])
    const { w, ui, id } = await practiced($, on, store)
    expect(concept(store).step).toBe(2)
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: '모르겠어요' })
    expect(w.models).toHaveLength(1)
    expect((await ui.find({ type: 'Text', text: '힌트를 보고 한 번 더 고쳐 보세요' }))?.props.color).toBe('yellow')
    expect(await ui.find({ type: 'Markdown', text: '**힌트:** 할 일과 확인을 다시 읽고, 이 줄에서 바꿀 곳 한 군데를 찾아보세요' })).toBeDefined()
    // "모르겠어요" is no line: the try again's field holds the line as it was.
    expect((await ui.find({ type: 'Input', key: `drill-${id}-again` }))?.props.value).toBe(LINE)
    await ui.press({ key: 'note-drill-answer' })
    expect(w.models).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: '✗ 틀림 · 예시 답 봄' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: `**예시 답:** \`\` ${EXAMPLE} \`\`` })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^내 줄/ })).toBeUndefined()
    // The example seen after a try: gone over with help, its step kept; not right on the day's record.
    expect(concept(store)).toMatchObject({ step: 2, reviewedAt: expect.any(Number) })
    expect(concept(store).reviewedAt).toBeGreaterThanOrEqual(NOW)
    expect(concept(store).missedAt).toBeUndefined()
    expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 0, wrong: 1, drills: 1 } })
    expect(w.journal().at(-1)!.text).toContain('**판정**: ✗ 틀림 · 예시 답 봄')
    // The field and a are gone with it: the keys go to the practice's own place, never nowhere (교차 검토 7).
    expect(focusesOf(w).at(-1)).toBe('note-drill')
    await ui.unmount()
  })

  test('"모르겠어요" twice is over with no call: wrong, and a for the example', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: '몰라요' })
    await ui.input({ key: `drill-${id}-again`, text: '모르겠어요' })
    expect(w.models).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: '✗ 틀림' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: 'a로 예시 답을 읽어 보고, 다음에 이 개념이 나오면 다시 고쳐 보세요.' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: DRILL_RULE_AFTER })).toBeUndefined()
    expect(await ui.find({ type: 'Button', key: 'note-drill-answer' })).toBeDefined()
    expect(concept(store)).toMatchObject({ step: 0, missedAt: expect.any(Number) })
    // Nothing recalled: kept as such, for the next quiz.
    expect(Object.values(store.get('slips') as Record<string, { type: string }>)).toEqual([expect.objectContaining({ type: 'blank', what: '' })])
    await ui.unmount()
  })

  test('t never touches a quiz still being answered: no call, the quiz as it was', async ($, on) => {
    const store = new Map<string, unknown>([['concepts', THREE_CONCEPTS]])
    const { w, ui, id } = await practiced($, on, store)
    w.answer = THREE_QUESTIONS
    await ui.press({ key: 'view-quiz' })
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    const quiz = JSON.stringify(store.get('quiz'))
    const calls = w.models.length
    await ui.press({ key: 'view-note' })
    await ui.press({ key: 'note-drill' })
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: EXAMPLE })
    expect(w.models).toHaveLength(calls)
    expect(JSON.stringify(store.get('quiz'))).toBe(quiz)
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^복습 퀴즈 · \d\d:\d\d · 3문제 중 0개 채점$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^문제 1\/3/ })).toBeDefined()
    // A practice is no review: today's ten are all still to answer.
    expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 1, wrong: 0, drills: 1 } })
    await ui.unmount()
  })

  test('where no field is drawn (the mobile app): no t, what to do and how to tell, and a for the example with nothing graded', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, id } = await written($, on, store)
    const ui = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /- 할 일: 이름이 비어 있으면/ })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /예시 답/ })).toBeUndefined()
    expect((await ui.find({ type: 'Button', key: 'note-drill-answer' }))?.props).toMatchObject({ hotkey: 'a', label: '예시 답' })
    expect(await ui.find({ type: 'Input', key: `drill-${id}` })).toBeUndefined()
    await ui.press({ key: 'note-drill-answer' })
    expect(await ui.find({ type: 'Markdown', text: `**예시 답:** \`\` ${EXAMPLE} \`\`` })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'note-drill-answer' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: '✎ 연습입니다 · 파일은 바뀌지 않습니다' })).toBeUndefined()
    expect(w.models).toHaveLength(1)
    expect(store.get('activity')).toEqual({ '2026-10-03': { notes: 1, right: 0, wrong: 0 } })
    expect(concept(store).reviewedAt).toBeUndefined()
    expect(noteOf(store).drill).toMatchObject({ isAnswerSeen: true })
    await ui.unmount()
  })

  test('the grade stays with the note into the next session; a copy, the record Claude reads and /learn where no pane shows hide the answer', async ($, on) => {
    const note = {
      id: 'n1',
      turnId: 't1',
      at: NOW - 3_600_000,
      prompt: '인사 함수를 만들어 줘',
      answer: '',
      changes: [{ file: 'src/hello.js', path: '/proj/src/hello.js', tool: 'Write', kind: 'create', added: 4, removed: 0, diff: ['@@ -0,0 +1,4 @@', ...HELLO.trim().split('\n').map(line => `+${line}`)].join('\n'), isCut: false }],
      moreFiles: 0,
      status: 'ready',
      text: PRACTICE_NOTE,
      savedAs: 'ready',
      isPast: false,
      root: '/proj',
      updatedAt: NOW - 3_600_000,
      concepts: ['c:템플릿리터럴'],
      drill: { verdict: 'right', mine: EXAMPLE, feedback: '', isRetried: true, at: NOW - 3_000_000, bogus: 1 },
    }
    const store = new Map<string, unknown>([['history', { '/proj': { at: NOW, notes: [note] } }]])
    const w = world(on, 'ok', null, false, store)
    await start($)
    const ui = await pane($)
    // Drawn as it was left, with no t pressed: done after a question asked back.
    expect(await ui.find({ type: 'Text', text: '✓ 해냈습니다 · 되짚어 맞힘' })).toBeDefined()
    expect(await ui.find({ type: 'Input', key: 'drill-n1' })).toBeUndefined()
    await ui.unmount()
    // Neither the copy for a mentor, nor the record Claude reads, nor /learn where no pane can show, hold the answer.
    await learn($, '공유')
    expect(w.copied.at(-1)).toContain('- 할 일: 이름이 비어 있으면')
    expect(w.copied.at(-1)).not.toContain('name || "손"')
    const told = String((await $.tool.call({ tool: TOOL, action: 'note' })).result)
    expect(told).toContain('### 직접 해 보기\n- 할 일: 이름이 비어 있으면')
    expect(told).not.toContain('예시 답')
    const shown = (await learn($, '')).text ?? ''
    expect(shown).toContain('이 화면에는 패널을 띄울 수 없어')
    expect(shown).not.toContain('고칠 줄')
    expect(shown).not.toContain('name || "손"')
  })

  test('a note before 1.7.0, or one whose change has no line to change, has no t: q goes over its concepts', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = PRACTICE_NOTE.replace(/### 직접 해 보기[\s\S]*$/, '### 직접 해 보기\n- 할 일: 없음')
    await turn($, () => $.tool.call(WRITE_HELLO))
    await finish(w)
    const ui = await pane($)
    expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
    // Nothing to practise is said nowhere in the note.
    expect(await ui.find({ type: 'Markdown', text: /직접 해 보기/ })).toBeUndefined()
    // A line the code does not hold: none either, its words kept as they are.
    w.answer = PRACTICE_NOTE.replace(/고칠 줄: .*$/m, '고칠 줄: `return name`')
    await turn($, () => $.tool.call({ ...WRITE_HELLO, tool_use_id: 'h2' }), 't2')
    await finish(w)
    expect(await ui.find({ type: 'Text', text: /^노트 2\/2/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /### 직접 해 보기\n- 할 일: 이름이 비어 있으면/ })).toBeDefined()
    await ui.unmount()
  })

  test('a note written again has a new practice: the old grade goes with the old text', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: EXAMPLE })
    expect(noteOf(store).drill).toMatchObject({ verdict: 'right' })
    await ui.press({ key: 'write' })
    await w.clock.settle()
    expect(noteOf(store).drill).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: '✓ 해냈습니다' })).toBeUndefined()
    await ui.press({ key: 'note-drill' })
    expect((await ui.find({ type: 'Input', key: `drill-${id}` }))?.props.value).toBe(LINE)
    await ui.unmount()
  })

  test('(검토) the pane not holding the keys says no Tab: the spec\'s words, then how the keys reach the field (교차 검토)', async ($, on) => {
    const { ui } = await practiced($, on)
    await ui.unmount()
    const unfocused = await pane($, 'terminal', { ...PANE_PROPS, isFocused: false })
    await unfocused.press({ key: 'note-drill' })
    expect(await unfocused.find({ type: 'Text', text: 'Enter: 확인 · 코드는 영문 상태에서 · ctrl+x tab: 고칠 줄 칸으로' })).toBeDefined()
    expect(await unfocused.find({ type: 'Text', text: /Tab: 버튼으로/ })).toBeUndefined()
    await unfocused.unmount()
  })

  test('(검토) right on the try again after a question asked back: done, 되짚어 맞힘, its step kept', async ($, on) => {
    const known = { 'c:템플릿리터럴': { name: '템플릿 리터럴', count: 1, firstAt: NOW - 60 * DAY, lastAt: NOW - 60 * DAY, blurb: '', files: [], step: 2, reviewedAt: NOW - 30 * DAY } }
    const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', known], ['steps', ownSteps(known)]])
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = WRONG
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name}님!!`' })
    await w.clock.settle()
    w.answer = '판정: 맞음\n피드백: 이제 이름이 비면 "손님"이 됩니다.'
    const mine = 'return `안녕하세요, ${name ? name : "손"}님!`'
    await ui.input({ key: `drill-${id}-again`, text: mine })
    await w.clock.settle()
    expect(w.models).toHaveLength(3)
    expect((await ui.find({ type: 'Text', text: '✓ 해냈습니다 · 되짚어 맞힘' }))?.props.color).toBe('green')
    expect(await ui.find({ type: 'Markdown', text: `예시 답과 견주기: \`\` ${EXAMPLE} \`\`` })).toBeDefined()
    expect(noteOf(store).drill).toMatchObject({ verdict: 'right', mine, isRetried: true })
    // Gone over with help: its step kept, never a step on; no miss.
    expect(concept(store).step).toBe(2)
    expect(concept(store).reviewedAt).toBeGreaterThanOrEqual(NOW)
    expect(concept(store).missedAt).toBeUndefined()
    expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 1, wrong: 0, drills: 1 } })
    expect(w.journal().at(-1)!.text).toContain('**판정**: ✓ 해냈습니다 · 되짚어 맞힘')
    expect(focusesOf(w).at(-1)).toBe('note-drill')
    await ui.unmount()
  })

  test('(검토) a note written again while its line is checked keeps no grade for that line, and says so', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.model = 'hold'
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name ? name : "손"}님!`' })
    expect(await ui.find({ type: 'Text', text: '확인하는 중입니다…' })).toBeDefined()
    // Written again meanwhile, its call answered at once.
    w.model = 'ok'
    w.answer = PRACTICE_NOTE.replace('이름을 받아 인사하는 함수를 만들었습니다', '이름을 받아 공손하게 인사하는 함수입니다')
    await ui.press({ key: 'write' })
    await w.clock.settle()
    expect(w.models).toHaveLength(3)
    w.answer = '판정: 맞음\n피드백: 좋습니다.'
    w.release()
    await w.clock.settle()
    expect((await ui.find({ type: 'Text', text: '그사이 노트를 다시 써서 이 줄은 확인하지 않았습니다' }))?.props.color).toBe('red')
    expect(await ui.find({ type: 'Text', text: /^✓ 해냈습니다/ })).toBeUndefined()
    expect(noteOf(store).drill).toBeUndefined()
    expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 0, wrong: 0 } })
    expect(concept(store).reviewedAt).toBeUndefined()
    // The new practice's field holds its line as the code has it.
    expect((await ui.find({ type: 'Input', key: `drill-${id}` }))?.props.value).toBe(LINE)
    await ui.unmount()
  })

  test('(검토) one line is checked at a time: Enter under another note meanwhile says so, with no call, and keeps what was typed', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, id } = await written($, on, store)
    await turn($, () => $.tool.call({ ...WRITE_HELLO, tool_use_id: 'h2' }), 't2')
    await finish(w)
    const second = noteOf(store).id
    expect(second).not.toBe(id)
    const ui = await pane($)
    await ui.press({ key: 'note-drill' })
    w.model = 'hold'
    await ui.input({ key: `drill-${second}`, text: 'return `안녕하세요, ${name ? name : "손"}님!`' })
    expect(w.models).toHaveLength(3)
    await ui.press({ key: 'prev' })
    await ui.press({ key: 'note-drill' })
    const typed = 'return `안녕하세요, ${name ?? "손"}님!`'
    await ui.input({ key: `drill-${id}`, text: typed })
    expect(w.models).toHaveLength(3)
    expect((await ui.find({ type: 'Text', text: '다른 줄을 확인하고 있습니다 · 잠시 뒤 다시 Enter' }))?.props.color).toBe('red')
    expect((await ui.find({ type: 'Input', key: `drill-${id}` }))?.props.value).toBe(typed)
    w.answer = '판정: 맞음\n피드백: 좋습니다.'
    w.release()
    await w.clock.settle()
    await ui.unmount()
  })

  test('(검토) a line in a file the team file leaves out now is never sent: said so with no call; the example\'s own line still needs none', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    w.files.set('/proj/.claude/learn-notes.md', '## 빼기\n- src/**\n')
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name ? name : "손"}님!`' })
    await w.clock.settle()
    expect(w.models).toHaveLength(1)
    expect((await ui.find({ type: 'Text', text: '이 줄은 지금 노트에서 빼는 파일에 있어 확인하지 않았습니다' }))?.props.color).toBe('red')
    expect(noteOf(store).drill).toBeUndefined()
    await ui.input({ key: `drill-${id}`, text: EXAMPLE })
    expect(w.models).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: '✓ 해냈습니다' })).toBeDefined()
    await ui.unmount()
  })

  test('(검토) a check a reload cut off is not coming back: the reload\'s session start draws the field again', async ($, on) => {
    // The load the reload ends: the host refuses its last word on the pane's state.
    let isGone = false
    on('state.set', { plugin: 'learn-notes', key: 'drillRun' }, async (_$, e, next) => (isGone && e.value.checking === null ? { deny: 'this load is gone' } : next(e)))
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.model = 'hold'
    w.answer = '읽을 수 없는 답'
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name ? name : "손"}님!`' })
    expect(await ui.find({ type: 'Text', text: '확인하는 중입니다…' })).toBeDefined()
    isGone = true
    w.release()
    await w.clock.settle()
    isGone = false
    // The next load's session start: nothing is checking any more.
    await start($)
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: '확인하는 중입니다…' })).toBeUndefined()
    expect((await ui.find({ type: 'Input', key: `drill-${id}` }))?.props.value).toBe('return `안녕하세요, ${name ? name : "손"}님!`')
    // A session start while a check of this load runs (a call that takes its time) leaves it running.
    w.replies = ['timeout']
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name ? name : "손"}님!`' })
    expect(await ui.find({ type: 'Text', text: '확인하는 중입니다…' })).toBeDefined()
    await start($)
    expect(await ui.find({ type: 'Text', text: '확인하는 중입니다…' })).toBeDefined()
    await w.clock.advance(60_000)
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: '확인하는 중입니다…' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^확인하지 못했습니다/ })).toBeDefined()
    await ui.unmount()
  })

  test('(검토) where no field is drawn, a practice the terminal left wrong has one a, and it shows the example', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: '몰라요' })
    await ui.input({ key: `drill-${id}-again`, text: '모르겠어요' })
    expect(await ui.find({ type: 'Text', text: '✗ 틀림' })).toBeDefined()
    await ui.unmount()
    const phone = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    expect(await phone.findAll({ type: 'Button', key: 'note-drill-answer' })).toHaveLength(1)
    await phone.press({ key: 'note-drill-answer' })
    expect(await phone.find({ type: 'Text', text: '✗ 틀림 · 예시 답 봄' })).toBeDefined()
    expect(await phone.find({ type: 'Markdown', text: `**예시 답:** \`\` ${EXAMPLE} \`\`` })).toBeDefined()
    expect(await phone.findAll({ type: 'Button', key: 'note-drill-answer' })).toHaveLength(0)
    expect(w.models).toHaveLength(1)
    await phone.unmount()
  })

  test('(검토) where no field is drawn, a first try waiting for its try again says where to try it, and a ends it', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = WRONG
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name}님!!`' })
    await w.clock.settle()
    // The terminal says nothing of it: the field is there.
    expect(await ui.find({ type: 'Text', text: '한 번 더는 터미널·데스크톱 패널에서 고칩니다 · a: 예시 답' })).toBeUndefined()
    await ui.unmount()
    const phone = await $.ui.mount({ plugin: 'learn-notes', surface: 'mobile', component: 'Pane', requestId: 'learn-notes', props: PANE_PROPS })
    expect(await phone.find({ type: 'Text', text: '✗ 아직입니다 · 한 번 더 고쳐 보세요' })).toBeDefined()
    expect(await phone.find({ type: 'Markdown', text: '**되묻기:** name이 빈 문자열이면 무엇이 찍힐까요?' })).toBeDefined()
    expect(await phone.find({ type: 'Text', text: '한 번 더는 터미널·데스크톱 패널에서 고칩니다 · a: 예시 답' })).toBeDefined()
    expect(await phone.findAll({ type: 'Button', key: 'note-drill-answer' })).toHaveLength(1)
    await phone.press({ key: 'note-drill-answer' })
    expect(await phone.find({ type: 'Text', text: '✗ 틀림 · 예시 답 봄' })).toBeDefined()
    expect(await phone.find({ type: 'Text', text: '한 번 더는 터미널·데스크톱 패널에서 고칩니다 · a: 예시 답' })).toBeUndefined()
    await phone.unmount()
  })

  test('(검토) /learn where no pane can show says how to do the practice and where its example is', async ($, on) => {
    const note = {
      id: 'n1', turnId: 't1', at: NOW - 3_600_000, prompt: '인사 함수를 만들어 줘', answer: '',
      changes: [{ file: 'src/hello.js', path: '/proj/src/hello.js', tool: 'Write', kind: 'create', added: 4, removed: 0, diff: ['@@ -0,0 +1,4 @@', ...HELLO.trim().split('\n').map(line => `+${line}`)].join('\n'), isCut: false }],
      moreFiles: 0, status: 'ready', text: PRACTICE_NOTE, savedAs: 'ready', isPast: false, root: '/proj', updatedAt: NOW - 3_600_000, concepts: ['c:템플릿리터럴'],
    }
    const store = new Map<string, unknown>([['history', { '/proj': { at: NOW, notes: [note] } }]])
    world(on, 'ok', null, false, store)
    await start($)
    const shown = (await learn($, '')).text ?? ''
    expect(shown).toContain('- 확인: `greet("")` → "안녕하세요, 손님!"\n\n직접 해 보기: 패널에서 t로 고쳐 확인합니다 · 예시 답은 일지 파일에 있습니다')
    expect(shown).not.toContain('name || "손"')
    // The record Claude reads has no such line: it is for the learner.
    const told = String((await $.tool.call({ tool: TOOL, action: 'note' })).result)
    expect(told).not.toContain('패널에서 t로')
  })

  test('(검토) /learn where no pane can show, with notes kept in no file: how to do the practice, no file named', { options: { autoSave: false } }, async ($, on) => {
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, false, store)
    await start($)
    w.answer = PRACTICE_NOTE
    await turn($, () => $.tool.call(WRITE_HELLO))
    await finish(w)
    const shown = (await learn($, '')).text ?? ''
    expect(shown).toContain('\n\n직접 해 보기: 패널에서 t로 고쳐 확인합니다')
    expect(shown).not.toContain('일지 파일')
  })

  test('(교차 검토 5) /learn in a cloud session sends the practice to a pane on a screen one sees, and names no file on the cloud computer', async ($, on) => {
    const note = {
      id: 'n1', turnId: 't1', at: NOW - 3_600_000, prompt: '인사 함수를 만들어 줘', answer: '',
      changes: [{ file: 'src/hello.js', path: '/proj/src/hello.js', tool: 'Write', kind: 'create', added: 4, removed: 0, diff: ['@@ -0,0 +1,4 @@', ...HELLO.trim().split('\n').map(line => `+${line}`)].join('\n'), isCut: false }],
      moreFiles: 0, status: 'ready', text: PRACTICE_NOTE, savedAs: 'ready', isPast: false, root: '/proj', updatedAt: NOW - 3_600_000, concepts: ['c:템플릿리터럴'],
    }
    const store = new Map<string, unknown>([['history', { '/proj': { at: NOW, notes: [note] } }]])
    world(on, 'ok', null, true, store, { CLAUDE_CODE_REMOTE: 'true' })
    await start($)
    const shown = (await learn($, '')).text ?? ''
    expect(shown).toContain('이 세션은 클라우드 컴퓨터에서 돌아, 패널이 지금 보는 화면에 뜨지 않을 수 있습니다.')
    // (1.7.1 검토) Not the person's own terminal: the cloud's notes are not on their computer.
    expect(shown).toContain('- 확인: `greet("")` → "안녕하세요, 손님!"\n\n직접 해 보기: 데스크톱 앱에서 이 세션을 열면 패널에서 t로 고쳐 확인합니다')
    expect(shown).not.toContain('터미널')
    expect(shown).not.toContain('일지 파일')
    expect(shown).not.toContain('name || "손"')
  })

  test('(1.7.1 검토) /learn in a cloud session no surface draws a pane for: the cloud\'s practice line, no journal file named', async ($, on) => {
    const note = {
      id: 'n1', turnId: 't1', at: NOW - 3_600_000, prompt: '인사 함수를 만들어 줘', answer: '',
      changes: [{ file: 'src/hello.js', path: '/proj/src/hello.js', tool: 'Write', kind: 'create', added: 4, removed: 0, diff: ['@@ -0,0 +1,4 @@', ...HELLO.trim().split('\n').map(line => `+${line}`)].join('\n'), isCut: false }],
      moreFiles: 0, status: 'ready', text: PRACTICE_NOTE, savedAs: 'ready', isPast: false, root: '/proj', updatedAt: NOW - 3_600_000, concepts: ['c:템플릿리터럴'],
    }
    const store = new Map<string, unknown>([['history', { '/proj': { at: NOW, notes: [note] } }]])
    const w = world(on, 'ok', null, false, store, { CLAUDE_CODE_REMOTE: 'true' })
    w.surfaces = []
    await start($)
    const shown = (await learn($, '')).text ?? ''
    expect(shown).toContain('이 세션은 클라우드 컴퓨터에서 돌아 지금 보는 화면에는 패널이 없습니다')
    expect(shown).toContain('- 확인: `greet("")` → "안녕하세요, 손님!"\n\n직접 해 보기: 데스크톱 앱에서 이 세션을 열면 패널에서 t로 고쳐 확인합니다')
    expect(shown).not.toContain('터미널')
    expect(shown).not.toContain('일지 파일')
    expect(shown).not.toContain('name || "손"')
  })

  /**
   * A practice tried yesterday in this window, open since, that another window's session start ended today as Claude
   * graded its first try (settleDrillTries): the store holds it over, this window still shows its try again.
   */
  async function endedElsewhere($: Engine, on: On) {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = WRONG
    const mine = 'return `안녕하세요, ${name}님!!`'
    await ui.input({ key: `drill-${id}`, text: mine })
    await w.clock.settle()
    const first = noteOf(store).drill!.firstTry as { at: number; feedback: string }
    await w.clock.advance(DAY)
    const history = store.get('history') as Record<string, { at: number; notes: Record<string, unknown>[] }>
    const ended = { mine, verdict: 'wrong', feedback: first.feedback, at: first.at }
    const notesThere = history['/proj']!.notes.map(one => (one.id === id ? { ...one, drill: ended, updatedAt: w.clock.now() } : one))
    store.set('history', { ...history, '/proj': { ...history['/proj']!, notes: notesThere } })
    const days = (store.get('activity') ?? {}) as Record<string, Record<string, number>>
    const day = days['2026-10-03'] ?? { notes: 0, right: 0, wrong: 0 }
    store.set('activity', { ...days, '2026-10-03': { ...day, wrong: (day.wrong ?? 0) + 1, drills: (day.drills ?? 0) + 1 } })
    return {
      store, w, ui, id, ended,
      activity: JSON.parse(JSON.stringify(store.get('activity'))) as unknown,
      concepts: JSON.stringify(store.get('concepts')),
      journal: w.journal().map(one => one.text),
    }
  }

  test('(교차 검토 5) Enter in a practice\'s try again another window ended meanwhile: no call, nothing counted again, its grade shown', async ($, on) => {
    const { store, w, ui, id, ended, activity, concepts, journal } = await endedElsewhere($, on)
    expect(await ui.find({ type: 'Input', key: `drill-${id}-again` })).toBeDefined()
    const calls = w.models.length
    w.answer = '판정: 맞음\n피드백: 좋습니다.'
    await ui.input({ key: `drill-${id}-again`, text: 'return `안녕하세요, ${name ? name : "손"}님!`' })
    await w.clock.settle()
    expect(w.models).toHaveLength(calls)
    expect(store.get('activity')).toEqual(activity)
    expect(JSON.stringify(store.get('concepts'))).toBe(concepts)
    expect(noteOf(store).drill).toMatchObject(ended)
    expect(w.journal().map(one => one.text)).toEqual(journal)
    expect(await ui.find({ type: 'Text', text: '이 연습은 다른 창에서 이미 매겼습니다' })).toBeDefined()
    expect(await ui.find({ type: 'Input', key: `drill-${id}-again` })).toBeUndefined()
    expect(focusesOf(w).at(-1)).toBe('note-drill-answer')
    await ui.unmount()
  })

  test('(교차 검토 5) a on a practice\'s try again another window ended meanwhile: the example shown, nothing counted again', async ($, on) => {
    const { store, w, ui, activity, concepts, journal } = await endedElsewhere($, on)
    const calls = w.models.length
    await ui.press({ key: 'note-drill-answer' })
    await w.clock.settle()
    expect(w.models).toHaveLength(calls)
    expect(store.get('activity')).toEqual(activity)
    expect(JSON.stringify(store.get('concepts'))).toBe(concepts)
    expect(noteOf(store).drill).toMatchObject({ verdict: 'wrong', isAnswerSeen: true })
    expect(w.journal().map(one => one.text)).toEqual(journal)
    expect(await ui.find({ type: 'Markdown', text: /^\*\*예시 답:\*\* / })).toBeDefined()
    await ui.unmount()
  })

  test('(교차 검토 7) a session start in this window leaves a past day\'s first try another window ended: nothing counted again', async ($, on) => {
    const { store, w, ui, ended, activity, concepts, journal } = await endedElsewhere($, on)
    const slips = JSON.stringify(store.get('slips') ?? null)
    const calls = w.models.length
    await ui.unmount()
    // This window's own copy still waits for the try again (settleDrillTries picks it); the store's is over.
    await start($)
    await w.clock.settle()
    expect(w.models).toHaveLength(calls)
    expect(store.get('activity')).toEqual(activity)
    expect(JSON.stringify(store.get('concepts'))).toBe(concepts)
    expect(JSON.stringify(store.get('slips') ?? null)).toBe(slips)
    expect(noteOf(store).drill).toMatchObject(ended)
    expect(w.journal().map(one => one.text)).toEqual(journal)
  })

  test('(검토) a practice whose change is the quotes, in a language that reads them apart: the example is done with no call', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    await start($)
    const RB = ['def greet(name)', "  puts 'Hello, #{name}!'", 'end', ''].join('\n')
    w.answer = [
      '### 한 줄 요약',
      '인사 함수를 만들었습니다',
      '### 배울 개념',
      '- **문자열 보간**: 문자열 안에 값을 넣습니다 — `#{name}`',
      '### 직접 해 보기',
      '- 할 일: 이름이 실제로 찍히게 바꿔 보세요',
      "- 고칠 줄: `puts 'Hello, #{name}!'`",
      '- 확인: `greet("Kim")` → Hello, Kim!',
      '- 예시 답: `puts "Hello, #{name}!"`',
    ].join('\n')
    await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'r1', file_path: '/proj/greet.rb', content: RB }))
    await finish(w)
    const ui = await pane($)
    const id = noteOf(store).id
    await ui.press({ key: 'note-drill' })
    expect((await ui.find({ type: 'Input', key: `drill-${id}` }))?.props.value).toBe("puts 'Hello, #{name}!'")
    await ui.input({ key: `drill-${id}`, text: 'puts "Hello, #{name}!"' })
    expect(w.models).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: '아직 바꾼 곳이 없습니다 · 줄을 고친 뒤 Enter' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: '✓ 해냈습니다' })).toBeDefined()
    await ui.unmount()
  })

  test('(교차 검토) Tab from the practice field goes where its line says: to the keys, never into the question field', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    /** The pane's focus ring as the engine walks it: its Buttons, Inputs and Selects in document order; Tab the next, round. */
    const ring = async () => (await ui.findAll({})).filter(one => ['Button', 'Input', 'Select'].includes(one.type)).map(one => `${one.type}:${one.key}`)
    const tabFrom = (stops: string[], stop: string) => stops[(stops.indexOf(stop) + 1) % stops.length]
    // A question asked about the note first: its answer is drawn, and the question field stays.
    w.answer = '바뀌지 않는 값이라 const입니다.'
    await ui.input({ key: `ask-${id}`, text: '왜 이렇게 했나요?' })
    await w.clock.settle()
    await ui.press({ key: 'note-drill' })
    expect(await ui.find({ type: 'Text', text: 'Enter: 확인 · 코드는 영문 상태에서 · Tab: 버튼으로 (1~4 보기)' })).toBeDefined()
    const before = await ring()
    expect(before).toContain(`Input:ask-${id}`)
    expect(before).toContain(`Input:drill-${id}`)
    // Back round to the first keys, the row where 1~4 work: a number typed is never a question asked.
    expect(tabFrom(before, `Input:drill-${id}`)).toBe(before[0])
    expect(before[0]).toMatch(/^Button:/)
    expect(before).toContain('Button:view-concepts')
    // The practice still opens under the note's keys, the question's answer and field above it.
    const keys = (await ui.findAll({})).map(one => one.key ?? '')
    expect(keys.indexOf(`ask-${id}`)).toBeLessThan(keys.indexOf(`drill-${id}`))
    // A first try short of right: Tab goes to a, as its line says.
    w.answer = WRONG
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name}님!!`' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: 'Enter: 다시 확인 · 코드는 영문 상태에서 · Tab: 버튼으로 (a 예시 답)' })).toBeDefined()
    expect(tabFrom(await ring(), `Input:drill-${id}-again`)).toBe('Button:note-drill-answer')
    await ui.unmount()
  })

  test('(검토) a first try a past day left waiting is ended at the next session start as Claude graded it, on its own day', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = WRONG
    const mine = 'return `안녕하세요, ${name}님!!`'
    await ui.input({ key: `drill-${id}`, text: mine })
    await w.clock.settle()
    await ui.unmount()
    // The same day: it waits for its try again.
    await start($)
    await w.clock.settle()
    expect(noteOf(store).drill).toMatchObject({ firstTry: { mine } })
    expect(Object.keys((store.get('slips') as Record<string, unknown> | undefined) ?? {})).toHaveLength(0)
    await w.clock.advance(DAY)
    await start($)
    await w.clock.settle()
    expect(noteOf(store).drill).toMatchObject({ verdict: 'wrong', mine })
    expect(noteOf(store).drill?.firstTry).toBeUndefined()
    expect(concept(store)).toMatchObject({ step: 0, missedAt: expect.any(Number) })
    expect(concept(store).missedAt!).toBeLessThan(NOW + DAY)
    expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 0, wrong: 1, drills: 1 } })
    expect(Object.values(store.get('slips') as Record<string, { what: string; mine: string }>)).toEqual([
      expect.objectContaining({ what: '빈 문자열도 이름이 있는 것으로 봄', mine }),
    ])
    expect(w.journal().at(-1)!.text).toContain('**판정**: ✗ 틀림')
    const later = await pane($)
    expect(await later.find({ type: 'Text', text: '✗ 틀림' })).toBeDefined()
    expect(await later.find({ type: 'Button', key: 'note-drill-answer' })).toBeDefined()
    expect(await later.find({ type: 'Input', key: `drill-${id}-again` })).toBeUndefined()
    // Once: a later start grades it no more.
    await start($)
    await w.clock.settle()
    expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 0, wrong: 1, drills: 1 } })
    await later.unmount()
  })

  test('1.7.0: every key the pane draws, at each step of a note, its practice and a quiz, is named in the help', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    // Each button by its key, with the help line and the words there that name it: one letter is another thing in another
    // place (a the example answer under the note and the answer in a quiz; i a question and the answer field; n the next
    // note and the note that taught a concept missed). A button not listed here fails the test until the help names it.
    const PANEL = '- 패널: '
    const NOTE = '- 노트 아래: '
    const QUIZ = '- 퀴즈(`4`): '
    const NAMED: Record<string, readonly [string, string]> = {
      'view-note': [PANEL, '`1` 노트'],
      'view-split': [PANEL, '`2` 전/후'],
      'view-concepts': [PANEL, '`3` 개념 모음'],
      'view-quiz': [PANEL, '`4` 퀴즈'],
      prev: [PANEL, '`p`·`n` 이전·다음 노트'],
      next: [PANEL, '`p`·`n` 이전·다음 노트'],
      review: [PANEL, '`q` 오늘 복습 바로 시작'],
      write: [PANEL, '`w` 노트 쓰기, 다시 쓰기'],
      'note-drill': [NOTE, '`t` 직접 해 보기'],
      'note-drill-answer': [NOTE, '`a` 예시 답'],
      easier: [NOTE, '`e` 더 쉽게'],
      // r's 생각해 보기 named only while r asks for it (IS_THINK_ASKED, set by 1.9.0 F6's samples): 1.7.0's words otherwise.
      trace: [NOTE, IS_THINK_ASKED ? '`r` 예시로 따라가기(끝의 생각해 보기는 `i`로 답하기) · ' : '`r` 예시로 따라가기 · '],
      'ask-type': [NOTE, '`i` 질문하기'],
      share: [NOTE, '`c` 복사'],
      'quiz-new': [QUIZ, '`s` 새 문제'],
      'quiz-hint': [QUIZ, '`h` 힌트'],
      'quiz-type': [QUIZ, '`i` 답 적기'],
      'quiz-answer': [QUIZ, '`a` 정답'],
      'quiz-flip': [QUIZ, '`f` 채점 바꾸기'],
      'quiz-note': [QUIZ, '`n` 틀린 개념을 배운 노트'],
      'quiz-right': [QUIZ, '`o`·`x`로 채점'],
      'quiz-wrong': [QUIZ, '`o`·`x`로 채점'],
    }
    const keys = new Set<string>()
    const drawn = new Map<string, string>()
    const collect = async () => {
      for (const one of await ui.findAll({ type: 'Button' })) {
        if (one.props.hotkey === undefined) continue
        keys.add(String(one.props.hotkey))
        drawn.set(String(one.key), String(one.props.hotkey))
      }
    }
    // The note: its views, its steps, and the row under it (t, e, r, i, c, w).
    await collect()
    // Its practice tried once: a for the example answer.
    await ui.press({ key: 'note-drill' })
    w.answer = WRONG
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name}님!!`' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Button', key: 'note-drill-answer' })).toBeDefined()
    await collect()
    // A quiz: s, its hint and its field's i; a first try short of right (a, f); graded, back to the note (n).
    await ui.press({ key: 'view-quiz' })
    w.answer = ['Q1: 문제 하나', 'H1: 바깥을 떠올려 보세요', 'A1: 답 하나'].join('\n')
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    // As the help says it: no answer before one try where the field is drawn.
    expect(await ui.find({ type: 'Button', key: 'quiz-answer' })).toBeUndefined()
    await collect()
    w.answer = ['판정: 틀림', '피드백: 그 값은 아닙니다.', '되묻기: 이름이 비면 무엇이 찍힐까요?'].join('\n')
    await ui.input({ key: mineKey(store, 0), text: '안녕하세요, 님!' })
    await w.clock.settle()
    await collect()
    // a after the try: graded at once as first judged, with no o or x.
    await ui.press({ key: 'quiz-answer' })
    expect((store.get('quiz') as { items: { result?: string }[] }).items[0]!.result).toBe('wrong')
    expect(await ui.find({ type: 'Button', key: 'quiz-right' })).toBeUndefined()
    expect(await ui.find({ type: 'Button', key: 'quiz-note' })).toBeDefined()
    await collect()
    // A new quiz whose answer was seen first (/learn 퀴즈 정답): o and x.
    w.answer = ['Q1: 문제 둘', 'A1: 답 둘'].join('\n')
    await ui.press({ key: 'quiz-new' })
    await w.clock.settle()
    await seeAnswer($)
    await collect()
    // Back on the note, the concept missed is due: q.
    await ui.press({ key: 'view-note' })
    await collect()
    await ui.unmount()
    expect([...keys].sort()).toEqual(['1', '2', '3', '4', 'a', 'c', 'e', 'f', 'h', 'i', 'n', 'o', 'p', 'q', 'r', 's', 't', 'w', 'x'])
    const help = (await learn($, '도움말')).text ?? ''
    for (const key of keys) expect(help).toContain(`\`${key}\``)
    // Each button on its own line of the help, by its own words, its hotkey among them.
    const lines = help.split('\n')
    for (const [button, hotkey] of drawn) {
      const [head, words] = NAMED[button] ?? ['(not in the help)', button]
      expect(words).toContain(`\`${hotkey}\``)
      expect(lines.find(line => line.startsWith(head)) ?? `${head} (no such line)`).toContain(words)
    }
  })

  test('(교차 검토) a first try waiting, drawn again with no t pressed: its field takes the keys as the pane does, and the line under it says how', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = WRONG
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name}님!!`' })
    await w.clock.settle()
    await ui.unmount()
    // The pane opened again (ctrl+x tab back, /learn, the next session): the try again's field takes the keys first,
    // so a line typed in the English input mode presses none of r, e, w, a, n or p.
    const focused = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    expect((await focused.find({ type: 'Input', key: `drill-${id}-again` }))?.props.autoFocus).toBe(true)
    expect(await focused.find({ type: 'Text', text: 'Enter: 다시 확인 · 코드는 영문 상태에서 · Tab: 버튼으로 (a 예시 답)' })).toBeDefined()
    await focused.unmount()
    const unfocused = await pane($, 'terminal', { ...PANE_PROPS, isFocused: false })
    expect(await unfocused.find({ type: 'Text', text: 'Enter: 다시 확인 · 코드는 영문 상태에서 · ctrl+x tab: 고칠 줄 칸으로' })).toBeDefined()
    await unfocused.unmount()
    // The desktop app has no ctrl+x tab: the spec's words alone.
    const desk = await pane($, 'desktop')
    expect(await desk.find({ type: 'Text', text: 'Enter: 다시 확인 · 코드는 영문 상태에서' })).toBeDefined()
    await desk.unmount()
  })

  test('(교차 검토) with autoSave off a practice graded writes no journal file: its grade is kept on the note alone', { options: { autoSave: false } }, async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = '판정: 틀림\n피드백: 그대로면 1이 나옵니다.'
    await ui.input({ key: `drill-${id}`, text: 'return 1' })
    await w.clock.settle()
    expect(noteOf(store).drill).toMatchObject({ verdict: 'wrong' })
    expect([...w.files.keys()].filter(path => path.startsWith(`${NOTES_DIR}/`))).toEqual([])
    expect(w.writes).toEqual([])
    await ui.unmount()
  })

  /** A key pasted into a practice's line, or into its task: masked wherever the practice is kept. */
  const KEY = 'sk-ant-api03-AAAAAAAAAAAAAAAAAAAA'
  const KEYED_LINE = `return \`안녕하세요, \${name || "${KEY}"}님!\``
  const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length

  test('(교차 검토) a line with a secret graded at once is masked in the note, the store, the slips and the journal; the practice 1KB at most', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = '판정: 틀림\n피드백: 그대로면 키가 이름이 됩니다.\n헷갈린 점: 키를 기본값으로 씀\n유형: 없는 값'
    await ui.input({ key: `drill-${id}`, text: KEYED_LINE })
    await w.clock.settle()
    expect(w.models).toHaveLength(2)
    const drill = noteOf(store).drill
    expect(drill).toMatchObject({ verdict: 'wrong' })
    expect(JSON.stringify(drill)).not.toContain(KEY)
    expect(bytes(drill)).toBeLessThanOrEqual(1024)
    expect(JSON.stringify(store.get('history'))).not.toContain(KEY)
    expect(Object.keys(store.get('slips') as Record<string, unknown>)).toHaveLength(1)
    expect(JSON.stringify(store.get('slips'))).not.toContain(KEY)
    const journal = w.journal().at(-1)!.text
    expect(journal).toMatch(/직접 해 보기 \(\d\d:\d\d\)/)
    expect(journal).not.toContain(KEY)
    await ui.unmount()
  })

  test('(교차 검토) a first try with a secret, asked back, is masked on the note and in the store; the practice 1KB at most', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = WRONG
    await ui.input({ key: `drill-${id}`, text: KEYED_LINE })
    await w.clock.settle()
    expect(w.models).toHaveLength(2)
    const drill = noteOf(store).drill
    expect(drill).toMatchObject({ firstTry: { verdict: 'wrong' } })
    expect(JSON.stringify(drill)).not.toContain(KEY)
    expect(bytes(drill)).toBeLessThanOrEqual(1024)
    expect(JSON.stringify(store.get('history'))).not.toContain(KEY)
    await ui.unmount()
  })

  test('(교차 검토) a task with a secret is masked in the journal\'s practice section', async ($, on) => {
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    await start($)
    w.answer = PRACTICE_NOTE.replace('- 할 일: 이름이 비어 있으면 "손님"에게 인사하게 바꿔 보세요', `- 할 일: 이름이 비어 있으면 "${KEY}"로 인사하게 바꿔 보세요`)
    await turn($, () => $.tool.call(WRITE_HELLO))
    await finish(w)
    const id = noteOf(store).id
    const ui = await pane($)
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: "return `안녕하세요, ${name||'손'}님!`;" })
    await w.clock.settle()
    const journal = w.journal().at(-1)!.text
    expect(journal).toMatch(/직접 해 보기 \(\d\d:\d\d\)/)
    expect(journal).toContain('**할 일**: 이름이 비어 있으면 "«가림»"로')
    expect(journal).not.toContain(KEY)
    await ui.unmount()
  })

  test('(교차 검토 4) partly right, then partly right again, is a step back: no miss, unlike wrong', async ($, on) => {
    const known = { 'c:템플릿리터럴': { name: '템플릿 리터럴', count: 1, firstAt: NOW - 60 * DAY, lastAt: NOW - 60 * DAY, blurb: '', files: [], step: 2, reviewedAt: NOW - 30 * DAY } }
    const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', known], ['steps', ownSteps(known)]])
    const { w, ui, id } = await practiced($, on, store)
    expect(concept(store).step).toBe(2)
    await ui.press({ key: 'note-drill' })
    w.answer = '판정: 거의\n피드백: 방향은 맞습니다.\n되묻기: 빈 문자열이면 무엇이 찍힐까요?'
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name ?? "손"}님!`' })
    await w.clock.settle()
    expect(await ui.find({ type: 'Text', text: '△ 아직입니다 · 방향은 맞습니다' })).toBeDefined()
    w.answer = '판정: 거의\n피드백: 아직 빈 문자열은 그대로입니다.'
    await ui.input({ key: `drill-${id}-again`, text: 'return `안녕하세요, ${name ?? "손님"}님!`' })
    await w.clock.settle()
    expect(w.models).toHaveLength(3)
    expect(await ui.find({ type: 'Text', text: '△ 거의 맞음' })).toBeDefined()
    expect(noteOf(store).drill).toMatchObject({ verdict: 'partial' })
    // A quiz's partly right: one step back, not back to the first nor first in the next quiz.
    expect(concept(store).step).toBe(1)
    expect(concept(store).missedAt).toBeUndefined()
    expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 0, wrong: 1, drills: 1 } })
    await ui.unmount()
  })

  test('(교차 검토 4) a practice on a concept marked known leaves the concept index as it was: only the day and the journal', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await learn($, '안다 템플릿 리터럴')
    const before = JSON.stringify(concept(store))
    expect((concept(store) as { knownAt?: number }).knownAt).toBeDefined()
    await ui.press({ key: 'note-drill' })
    await ui.input({ key: `drill-${id}`, text: '몰라요' })
    await ui.input({ key: `drill-${id}-again`, text: '모르겠어요' })
    expect(w.models).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: '✗ 틀림' })).toBeDefined()
    // Still known: no step, no miss, back in no review; no slip kept for the next quiz.
    expect(JSON.stringify(concept(store))).toBe(before)
    expect(store.get('slips')).toBeUndefined()
    expect(store.get('activity')).toMatchObject({ '2026-10-03': { right: 0, wrong: 1, drills: 1 } })
    await w.clock.settle()
    expect(w.journal().at(-1)!.text).toMatch(/직접 해 보기 \(\d\d:\d\d\)/)
    await ui.unmount()
  })

  test('(교차 검토 4) a question asked back holding the example line is dropped: graded at once, as a quiz\'s', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    await ui.press({ key: 'note-drill' })
    w.answer = `판정: 틀림\n피드백: 아닙니다.\n되묻기: ${EXAMPLE} 처럼 쓰면 어떨까요?`
    await ui.input({ key: `drill-${id}`, text: 'return 1' })
    await w.clock.settle()
    expect(w.models).toHaveLength(2)
    expect(noteOf(store).drill?.firstTry).toBeUndefined()
    expect(noteOf(store).drill?.verdict).toBe('wrong')
    expect(await ui.find({ type: 'Markdown', text: /되묻기/ })).toBeUndefined()
    expect(await ui.find({ type: 'Input', key: `drill-${id}-again` })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: '✗ 틀림' })).toBeDefined()
    await ui.unmount()
  })

  test('1.8.0 (E3): a practice missed, then the quiz asking it again missed too: the next review quiz shows a worked example, in the practice\'s language', async ($, on) => {
    const store = new Map<string, unknown>()
    const { w, ui, id } = await practiced($, on, store)
    const slip = () => Object.values(store.get('slips') as Record<string, { type: string; times: number }>)[0]
    await ui.press({ key: 'note-drill' })
    w.answer = '판정: 틀림\n피드백: 그대로면 "안녕하세요, 님!"이 됩니다.\n헷갈린 점: 빈 문자열도 이름이 있는 것으로 봄\n유형: 없는 값'
    await ui.input({ key: `drill-${id}`, text: 'return `안녕하세요, ${name}님!!`' })
    await w.clock.settle()
    expect(slip()).toMatchObject({ type: 'nullish', times: 1 })
    await ui.unmount()
    // Worked examples on as 1.8.0 shipped them, whatever their constant (교차 검토 2 turned them off by its sample): the
    // code branch (1.10.0 G1), met in hello.js with its words' quote (`${name}`) on a line of it; a quiz of two (D33 (3)).
    w.harness = { workedAfterTimes: 2 }
    withFiller(store)
    await start($)
    w.answer = 'T1: 예측\nQ1: 문제 하나\nA1: 답 하나'
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 하나')
    w.answer = '판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: 빈 문자열도 이름으로 봄\n유형: 없는 값'
    expect((await learn($, '퀴즈 1 안녕하세요, 님!')).text).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다 · 이 개념을 배운 노트: /learn 찾기 템플릿 리터럴\n')
    expect(slip()).toMatchObject({ type: 'nullish', times: 2 })
    w.answer = 'T1: 예측\nQ1: 풀이: `const a = ""; a || "손"`은 "손"입니다. 빈 문자열은 거짓으로 치기 때문입니다.\n이제 풀어 보세요: `const b = "철수"; b || "손"`은?\nA1: "철수"'
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (풀이 보고 풀기) 풀이:')
    expect(w.models.at(-1)).toContain('\n   칸: 풀이 보고 풀기 (js로)\n')
    expect(w.models.at(-1)).not.toContain('function greet(name)')
  })

  for (const surface of ['desktop', 'vscode'] as const) {
    test(`(교차 검토 3) ${surface} draws the question field under a note, and t opens the line in a field, as the terminal does`, async ($, on) => {
      const store = new Map<string, unknown>()
      const { w, id } = await written($, on, store)
      const ui = await pane($, surface)
      expect(await ui.find({ type: 'Input', key: `ask-${id}` })).toBeDefined()
      expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeDefined()
      await ui.press({ key: 'note-drill' })
      expect((await ui.find({ type: 'Input', key: `drill-${id}` }))?.props).toMatchObject({ value: LINE })
      // With a field to type in, the example waits for one try.
      expect(await ui.find({ type: 'Button', key: 'note-drill-answer' })).toBeUndefined()
      expect(w.models).toHaveLength(1)
      await ui.unmount()
    })
  }
})

describe('1.7.1: a pane the desktop app seats a moment late, and where a pane can be opened', () => {
  const DAY = 86_400_000
  const DUE = { 'c:클로저': { name: '클로저', count: 1, firstAt: NOW - 3 * DAY, lastAt: NOW - 3 * DAY, blurb: '', files: [] } }
  const DESKTOP_WAIT = '학습 노트 패널을 여는 중입니다 · 잠시 뒤 오른쪽에 뜹니다. 뜨지 않으면 /learn을 한 번 더 칩니다. 마지막 노트를 여기에도 적습니다.'
  /** The engine's word while no surface is attached at all: VS Code's extension, or before the desktop app's first drawing. */
  const NO_SURFACE = 'no-surface: no client attached'
  /** /learn's first line where no surface is attached even after the wait: the desktop app late, or one that draws none. */
  const NO_SURFACE_TEXT =
    '패널을 그리는 화면이 아직 붙지 않아 마지막 노트를 여기에 적습니다. 데스크톱 앱이면 잠시 뒤 오른쪽에 뜹니다(뜨지 않으면 /learn을 한 번 더) · VS Code 확장처럼 패널을 그리지 않는 화면이면 같은 폴더의 터미널에서 claude를 켜거나 데스크톱 앱에서 이 폴더를 연 뒤 /learn을 칩니다.'
  const UNPLACED = 'learn-notes: 패널을 열지 못했습니다 (unplaced)'
  const KEYS_HERE = '학습 노트 패널을 열었습니다 · 패널의 키를 쓰려면 ctrl+x tab(또는 패널 클릭)'

  /** Lets the plugin's short waits pass, a quarter of a second at a time. */
  async function wait(w: World, ms: number) {
    for (let spent = 0; spent < ms; spent += 250) await w.clock.advance(250)
  }

  /** Asks `/learn args` and lets `ms` of the clock pass: the reply, and how long after the ask it came. */
  async function timed($: Engine, w: World, args: string, ms: number) {
    const t0 = w.clock.now()
    let tookMs = -1
    const asked = learn($, args).then(reply => {
      tookMs = w.clock.now() - t0
      return reply
    })
    await wait(w, ms)
    const reply = await asked
    return { text: reply.text ?? '', tookMs }
  }

  /** Seats the pane `ms` into the clock, as the desktop app does a moment after the open answered undrawn. */
  function seatLater(w: World, seat: { isPlaced: boolean }, ms: number, then: () => void = () => {}) {
    void w.clock.sleep(ms).then(() => {
      seat.isPlaced = true
      then()
    })
  }

  /**
   * Starts the session as the engine starts it under a host with no terminal (the desktop app, VS Code's extension,
   * the SDK and a -p run alike): drawing nowhere yet, no one at a REPL (SessionStartInput).
   */
  function startHost($: Engine) {
    return $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
  }

  /** `/learn` sent from afar: a phone over Remote Control. */
  function learnAway($: Engine) {
    return $.command.run({ command: 'learn', args: '', origin: { kind: 'bridge' }, presentation: { isFullscreen: true, columns: 160 } })
  }

  test('/learn on the desktop app waits for the pane it asked for: seated 200 ms later, it says the pane is open at the first look a quarter second on, and how to give it the keys there', async ($, on) => {
    const seat = { isShown: true, isPlaced: false }
    const w = world(on, 'ok', seat, false)
    w.surfaces = ['desktop']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // Not seated when the plugin first looks: only a wait finds it, a quarter second at a time.
    seatLater(w, seat, 200)
    const shown = await timed($, w, '', 2000)
    expect(shown.text).toBe('학습 노트 패널을 열었습니다 · 패널을 클릭하면 키가 패널로 갑니다')
    expect(shown.tookMs).toBe(250)
    // No ctrl+x tab: the terminal's key.
    expect(shown.text).not.toContain('ctrl+x')
    expect(w.logs.join('\n')).not.toContain('패널을 열지 못했습니다')
  })

  test('never seated in the wait on the desktop app: it says the pane is coming and what to do if not, after 1.5 s, the last note here', async ($, on) => {
    const seat = { isShown: false, isPlaced: false }
    const w = world(on, 'ok', seat, false)
    w.surfaces = ['desktop']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const shown = await timed($, w, '', 2000)
    expect(shown.tookMs).toBe(1500)
    expect(shown.text.startsWith(`${DESKTOP_WAIT}\n\n`)).toBe(true)
    expect(shown.text).toContain('let을 const로')
    expect(shown.text).not.toContain('/tui')
    expect(shown.text).not.toContain('띄울 수 없어')
    // A fault of the pane only once it is still undrawn 10 s after the answer (1.5 s): none at 11.25 s, one by 11.75 s.
    expect(w.logs.join('\n')).not.toContain('패널을 열지 못했습니다')
    await wait(w, 9_250)
    expect(w.logs.join('\n')).not.toContain('패널을 열지 못했습니다')
    await wait(w, 500)
    expect(w.logs.join('\n')).toContain(UNPLACED)
  })

  test('seated later than the wait, near the end of the 10 s after the answer: no fault of the pane is kept', async ($, on) => {
    const seat = { isShown: true, isPlaced: false }
    const w = world(on, 'ok', seat, false)
    w.surfaces = ['desktop']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // 9.5 s after the answer at 1.5 s: a look at the pane sooner than 10 s after would find it undrawn.
    seatLater(w, seat, 11_000)
    expect((await timed($, w, '', 2000)).text.startsWith(DESKTOP_WAIT)).toBe(true)
    await wait(w, 12_000)
    expect(w.logs.join('\n')).not.toContain('패널을 열지 못했습니다')
  })

  test('no surface attached yet when the pane is asked for (the desktop app before its first drawing, started as a host with no terminal): it waits, and the pane seated is open', async ($, on) => {
    const seat = { isShown: true, isPlaced: false }
    const w = world(on, 'ok', seat, false)
    w.surfaces = []
    w.openReason = NO_SURFACE
    // As the engine starts the desktop app's session: no terminal, isInteractive false.
    await startHost($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    seatLater(w, seat, 300, () => {
      w.surfaces = ['desktop']
    })
    const shown = await timed($, w, '', 2000)
    expect(shown.text).toBe('학습 노트 패널을 열었습니다 · 패널을 클릭하면 키가 패널로 갑니다')
    expect(shown.tookMs).toBe(500)
    expect(shown.text).not.toContain('VS Code')
  })

  test('no surface attached even after the wait (the desktop app attaching 2 s in): no word that the pane cannot show, and no fault of a pane seated in the end', async ($, on) => {
    const seat = { isShown: true, isPlaced: false }
    const w = world(on, 'ok', seat, false)
    w.surfaces = []
    w.openReason = NO_SURFACE
    await startHost($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    seatLater(w, seat, 2000, () => {
      w.surfaces = ['desktop']
    })
    const shown = await timed($, w, '', 2000)
    expect(shown.tookMs).toBe(1500)
    // Which host it is, nothing says yet: what to do on each, the desktop app's first.
    expect(shown.text.startsWith(`${NO_SURFACE_TEXT}\n\n`)).toBe(true)
    expect(shown.text).toContain('let을 const로')
    expect(shown.text).not.toContain('띄울 수 없어')
    expect(shown.text).not.toContain('/tui')
    // Kept as a fault only if still undrawn 10 s after: this one was seated half a second after the answer.
    expect(w.logs.join('\n')).not.toContain('패널을 열지 못했습니다')
    await wait(w, 12_000)
    expect(w.logs.join('\n')).not.toContain('패널을 열지 못했습니다')
  })

  test('a host with no surface ever (VS Code\'s extension, a -p run alike): after the wait, where a pane opens and how; a fault of the pane 10 s on', async ($, on) => {
    const seat = { isShown: false, isPlaced: false }
    const w = world(on, 'ok', seat, false)
    w.surfaces = []
    w.openReason = NO_SURFACE
    await startHost($)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const shown = await timed($, w, '', 2000)
    expect(shown.tookMs).toBe(1500)
    expect(shown.text.startsWith(`${NO_SURFACE_TEXT}\n\n`)).toBe(true)
    expect(shown.text).toContain('let을 const로')
    expect(shown.text).not.toContain('/tui')
    expect(w.logs.join('\n')).not.toContain('패널을 열지 못했습니다')
    await wait(w, 10_000)
    expect(w.logs.join('\n')).toContain(UNPLACED)
  })

  test('the terminal answers at once: no wait for a pane it did not seat, no fullscreen advice, and the fault kept at once', async ($, on) => {
    const w = world(on, 'ok', { isShown: false, isPlaced: false }, false)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const shown = (await learn($, '')).text ?? ''
    expect(shown.startsWith('이 화면에는 패널을 띄울 수 없어 마지막 노트를 여기에 적습니다.\n\n')).toBe(true)
    expect(shown).not.toContain('/tui')
    await w.clock.settle()
    expect(w.logs.join('\n')).toContain(UNPLACED)
  })

  test('a phone beside the terminal (Remote Control) seating the pane 300 ms late: waited for as any surface but the terminal', async ($, on) => {
    const seat = { isShown: true, isPlaced: false }
    const w = world(on, 'ok', seat, false)
    w.surfaces = ['terminal', 'mobile']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    seatLater(w, seat, 300)
    const shown = await timed($, w, '', 2000)
    expect(shown.tookMs).toBe(500)
    // Typed at the terminal (composer): its key.
    expect(shown.text).toBe(KEYS_HERE)
    expect(w.logs.join('\n')).not.toContain('패널을 열지 못했습니다')
  })

  test('a phone beside the terminal that never seats it: the answer after 1.5 s, the fault only 10 s on', async ($, on) => {
    const w = world(on, 'ok', { isShown: false, isPlaced: false }, false)
    w.surfaces = ['terminal', 'mobile']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const shown = await timed($, w, '', 2000)
    expect(shown.tookMs).toBe(1500)
    expect(shown.text.startsWith('이 화면에는 패널을 띄울 수 없어 마지막 노트를 여기에 적습니다.\n\n')).toBe(true)
    expect(w.logs.join('\n')).not.toContain('패널을 열지 못했습니다')
    await wait(w, 10_000)
    expect(w.logs.join('\n')).toContain(UNPLACED)
  })

  test('the terminal\'s open pane: ctrl+x tab gives it the keys', async ($, on) => {
    const w = world(on, 'ok', { isShown: true }, true)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect((await learn($, '')).text).toBe(KEYS_HERE)
  })

  test('the keys as each screen hands them over: a phone has none, one asked from afar is not at the terminal, the terminal\'s Enter is the terminal\'s', async ($, on) => {
    const w = world(on, 'ok', { isShown: true }, true)
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    // Asked over Remote Control from the phone beside the person's own terminal: no ctrl+x tab to press there.
    w.surfaces = ['terminal', 'mobile']
    expect((await learnAway($)).text).toBe('학습 노트 패널을 열었습니다')
    // The same screens, typed at the terminal: its key.
    expect((await learn($, '')).text).toBe(KEYS_HERE)
    // The terminal and the desktop app both drawing: typed at the terminal (composer), the terminal's key.
    w.surfaces = ['terminal', 'desktop']
    expect((await learn($, '')).text).toBe(KEYS_HERE)
    // Asked from afar with the desktop app drawing too: the click, never the terminal's key.
    expect((await learnAway($)).text).toBe('학습 노트 패널을 열었습니다 · 패널을 클릭하면 키가 패널로 갑니다')
    // A phone alone: no key and no click to name.
    w.surfaces = ['mobile']
    expect((await learn($, '')).text).toBe('학습 노트 패널을 열었습니다')
  })

  test('a cloud session no surface draws a pane for: what works here, never the person\'s own computer where these notes are not', async ($, on) => {
    const w = world(on, 'ok', null, false, new Map(), { CLAUDE_CODE_REMOTE: 'true' })
    w.surfaces = []
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const shown = (await learn($, '')).text ?? ''
    expect(shown).toContain(
      '이 화면에는 패널을 띄울 수 없어 마지막 노트를 여기에 적습니다. 이 세션은 클라우드 컴퓨터에서 돌아 지금 보는 화면에는 패널이 없습니다 · 여기서는 /learn 복습 · /learn 퀴즈 1 내 답 · /learn 질문으로 대화창에서 배웁니다.',
    )
    expect(shown).not.toContain('내 컴퓨터')
    expect(shown).not.toContain('/tui')
  })

  test('a cloud session on the desktop app, the pane not seated in the wait: as on the desktop app, never that it does not attach', async ($, on) => {
    const seat = { isShown: false, isPlaced: false }
    const w = world(on, 'ok', seat, false, new Map(), { CLAUDE_CODE_REMOTE: 'true' })
    w.surfaces = ['desktop']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const shown = await timed($, w, '', 2000)
    expect(shown.text.startsWith(`${DESKTOP_WAIT}\n\n`)).toBe(true)
    expect(shown.text).not.toContain('붙지 않습니다')
    expect(shown.text).not.toContain('클라우드 컴퓨터')
  })

  test('a cloud session whose pane the desktop app seats is told the pane is open, not that no one sees it', async ($, on) => {
    const w = world(on, 'ok', { isShown: true, isPlaced: true }, true, new Map(), { CLAUDE_CODE_REMOTE: 'true' })
    w.surfaces = ['desktop']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect((await learn($, '')).text).toBe('학습 노트 패널을 열었습니다 · 패널을 클릭하면 키가 패널로 갑니다')
    // Seen on a phone beside the cloud computer's own terminal: open, with no key of the terminal's to give it.
    w.surfaces = ['terminal', 'mobile']
    expect((await learn($, '')).text).toBe('학습 노트 패널을 열었습니다')
    // A phone alone (the mobile app seats panes, isFullscreen false): open, no key and no click to name.
    w.surfaces = ['mobile']
    expect((await learn($, '')).text).toBe('학습 노트 패널을 열었습니다')
    // Its own terminal alone, drawn for no one: as before.
    w.surfaces = ['terminal']
    expect((await learn($, '')).text).toContain('이 세션은 클라우드 컴퓨터에서 돌아, 패널이 지금 보는 화면에 뜨지 않을 수 있습니다.')
  })

  test('/learn 복습 on the desktop app, the pane seated 300 ms late: today\'s review in the pane, the keys asked for again of the drawn pane', async ($, on) => {
    const seat = { isShown: true, isPlaced: false }
    const w = world(on, 'ok', seat, false, new Map<string, unknown>([['concepts', DUE]]))
    w.surfaces = ['desktop']
    await start($)
    w.answer = 'Q1: 문제 하나\nA1: 답 하나'
    seatLater(w, seat, 300)
    const shown = await timed($, w, '복습', 2000)
    expect(shown.text).toBe('학습 노트 패널에서 오늘 복습을 엽니다 · 답을 적고 Enter로 채점받고, Esc로 대화로 돌아갑니다.')
    // The first ask for the keys found an undrawn pane: asked once more once it is drawn.
    expect(w.focused).toEqual([true, true])
    // A new quiz for the pane, not one written into the reply.
    await w.clock.settle()
    expect(w.models).toHaveLength(1)
    expect(shown.text).not.toContain('문제 하나')
  })

  test('/learn 복습 with nothing left today, the desktop app seating the pane late: s in the pane is named', async ($, on) => {
    const seat = { isShown: true, isPlaced: false }
    const done = { 'c:클로저': { ...DUE['c:클로저'], firstAt: NOW, lastAt: NOW } }
    const w = world(on, 'ok', seat, false, new Map<string, unknown>([['concepts', done]]))
    w.surfaces = ['desktop']
    await start($)
    seatLater(w, seat, 300)
    const shown = await timed($, w, '복습', 2000)
    expect(shown.text).toBe('지금 복습할 개념이 없습니다 · 더 풀려면 패널에서 s, 또는 /learn 퀴즈 새로')
    expect(w.focused).toEqual([false])
  })

  test('/learn 복습 on the desktop app with the pane never seated: the quiz in the reply, after the wait', async ($, on) => {
    const w = world(on, 'ok', { isShown: false, isPlaced: false }, false, new Map<string, unknown>([['concepts', DUE]]))
    w.surfaces = ['desktop']
    await start($)
    w.answer = 'Q1: 문제 하나\nA1: 답 하나'
    const shown = await timed($, w, '복습', 2000)
    expect(shown.tookMs).toBeGreaterThanOrEqual(1500)
    expect(shown.text).toContain('문제 하나')
    expect(w.focused).toEqual([true])
  })
})
