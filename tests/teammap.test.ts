import type { LearnConcept } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  TEAM_MAP_MIN,
  TEAM_MAP_REPORTS,
  conceptKey,
  gatherPath,
  overlapReports,
  readReports,
  recapRange,
  reportMarkdown,
  stamp,
  teamMapText,
  tokenNumber,
  tokenText,
  type ReadReport,
} from '../hooks/notes'

const DAY = 86_400_000
const NOW = Date.UTC(2026, 9, 18, 3)

/** A concept the index holds, met a day ago unless `more` says otherwise. */
const concept = (name: string, more: Partial<LearnConcept> = {}): LearnConcept => ({ name, count: 1, firstAt: NOW - DAY, lastAt: NOW - DAY, blurb: '', files: [], ...more })

type Person = {
  fresh?: readonly string[]
  missed?: readonly string[]
  /** This repository's team terms: how many, and the ones met by name. */
  team?: { total: number; met: readonly string[] }
  notes?: number
  right?: number
  wrong?: number
  calls?: { calls: number; auto: number; input: number; output: number }
  range?: string
  now?: number
}

/**
 * One teammate's /learn 보고서 as reportMarkdown writes it: `fresh` met first in the range (the last one the most
 * recently, so the report lists them backwards), `missed` missed in a quiz (the first one the longest ago).
 */
function report(p: Person = {}): string {
  const now = p.now ?? NOW
  const index: Record<string, LearnConcept> = {}
  ;(p.fresh ?? []).forEach((name, i) => {
    index[conceptKey(name)] = concept(name, { firstAt: now - DAY + i, lastAt: now - DAY + i })
  })
  ;(p.missed ?? []).forEach((name, i) => {
    index[conceptKey(name)] = concept(name, { count: 2, firstAt: now - 40 * DAY, lastAt: now - 40 * DAY, missedAt: now - DAY + i, reviewedAt: now - DAY + i, step: 0 })
  })
  const day = stamp(now - DAY).day
  return reportMarkdown({
    range: recapRange(p.range ?? '최근 7일', now)!,
    activity: { [day]: { notes: p.notes ?? 3, right: p.right ?? 2, wrong: p.wrong ?? 1 } },
    index,
    now,
    usage: { [day]: p.calls ?? { calls: 20, auto: 12, input: 46_000, output: 10_000 } },
    since: now - 100 * DAY,
    ...(p.team ? { team: p.team } : {}),
  })
}

/** The one report a text holds, read back. */
function readOne(text: string): ReadReport {
  const read = readReports(text)
  expect(read.reports).toHaveLength(1)
  return read.reports[0]!
}

/** A small seeded random source, so the cases are the same on every run. */
function random(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

describe('1.8.0: /learn 보고서 모으기 reads the reports back (E5)', () => {
  test('a report reads back to what it was written from: twenty cases of names, counts, team terms and calls', () => {
    const next = random(18)
    const int = (max: number) => Math.floor(next() * (max + 1))
    // Names as concepts are named: a table bar, brackets, a colon, underscores, Korean and English.
    const nameOf = (i: number, tag: string) => [`${tag}개념 ${i}`, `타입 | 유니언 ${tag}${i}`, `useEffect${tag}${i}(정리 함수)`, `a: b ${tag}${i} 매핑`, `__init__${tag}${i}`, `Promise.all ${tag}${i}`][i % 6]!
    for (let c = 0; c < 20; c++) {
      const fresh = Array.from({ length: int(20) }, (_, i) => nameOf(i, 'n'))
      const missed = Array.from({ length: int(7) }, (_, i) => nameOf(i, 'm'))
      const total = int(20)
      const terms = Array.from({ length: total }, (_, i) => (i % 3 === 0 ? `fetch(재시도 ${i})` : `팀 용어 ${i}`))
      const met = terms.filter(() => next() < 0.6)
      const right = int(9)
      const wrong = int(9)
      const notes = 1 + int(30)
      // Tokens over every size tokenText says: plain, 천, 만, 억.
      const tokens = () => Math.floor(10 ** (next() * 9))
      const calls = int(3) === 0 ? { calls: 0, auto: 0, input: 0, output: 0 } : { calls: 1 + int(200), auto: int(50), input: tokens(), output: tokens() }
      const text = report({ fresh, missed, team: total > 0 ? { total, met } : undefined, notes, right, wrong, calls })
      const one = readOne(text)
      expect(one.from).toBe(recapRange('최근 7일', NOW)!.days[0]!)
      expect(one.to).toBe(stamp(NOW).day)
      expect(one.days).toBe(1)
      expect(one.notes).toBe(notes)
      expect(one.quiz).toEqual(right + wrong > 0 ? { graded: right + wrong, right } : undefined)
      // The report lists the most recent first, fifteen at most (its 외 N개 left off), and five missed, the oldest miss first.
      expect(one.fresh).toEqual([...fresh].reverse().slice(0, 15))
      expect(one.missed).toEqual(missed.slice(0, 5))
      expect(one.team).toEqual(total > 0 ? { total, met: met.slice(0, 15) } : undefined)
      expect(one.calls?.calls).toBe(calls.calls)
      expect(one.calls?.auto).toBe(calls.calls > 0 ? calls.auto : 0)
      expect(tokenText(one.calls!.input)).toBe(tokenText(calls.input))
      expect(tokenText(one.calls!.output)).toBe(tokenText(calls.output))
    }
  })

  test('a long line a paste broke is read in a time that grows with it: a calls line with no end', () => {
    const text = report({ fresh: ['클로저'] })
    // A calls line cut before its ' 토큰', with ' · 출력 ' many times over: a lazy match tried at each would take minutes.
    const broken = `- 학습 노트의 모델 호출 1번 · 입력 ${' · 출력 x'.repeat(30_000)}`
    const pasted = text.replace('\n\n## 이번 기간에', `\n${broken}\n\n## 이번 기간에`)
    expect(pasted).toContain(broken)
    const started = Date.now()
    expect(readOne(pasted)).toEqual(readOne(text))
    expect(Date.now() - started).toBeLessThan(1000)
  })

  test('a quiz line saying more right than asked counts as all right, never more', () => {
    const text = report({ right: 2, wrong: 1 })
    expect(text).toContain('\n- 퀴즈 3문제 중 2개 맞힘 (67%)\n')
    expect(readOne(text.replace('- 퀴즈 3문제 중 2개 맞힘', '- 퀴즈 3문제 중 5개 맞힘')).quiz).toEqual({ graded: 3, right: 3 })
  })

  test('a KakaoTalk export: the sender and time before a report\'s heading are dropped, and never read', () => {
    const text = report({ fresh: ['클로저', 'async/await'], missed: ['Promise 체이닝'] })
    const file = readOne(text)
    const [head, ...rest] = text.split('\n')
    // The PC app's: a heading of the chat, the day's line, then `[이름] [시간] ` before each message's first line.
    const pc = ['김철수 님과 카카오톡 대화', '저장한 날짜 : 2026-10-18 15:20:01', '', '--------------- 2026년 10월 18일 일요일 ---------------', `[김철수] [오후 3:12] ${head}`, ...rest, '[이영희] [오후 3:15] 잘 받았습니다']
    expect(readOne(pc.join('\r\n'))).toEqual(file)
    // The phones': iOS's and Android's.
    expect(readOne([`2026. 10. 18. 오후 3:12, 김철수 : ${head}`, ...rest].join('\n'))).toEqual(file)
    expect(readOne([`2026년 10월 18일 오후 3:12, 김철수 : ${head}`, ...rest].join('\n'))).toEqual(file)
    // Only before a heading: a message naming a report's days starts none.
    expect(readReports('[김철수] [오후 3:12] 학습 보고 · 2026-10-12 보냈습니다\n- 학습 노트 3개\n').reports).toEqual([])
    const three = [3, 4, 5].map((notes, i) => {
      const [first, ...lines] = report({ fresh: ['클로저'], notes }).split('\n')
      return [`[${['김철수', '이영희', '박민수'][i]}] [오후 3:1${i}] ${first}`, ...lines].join('\n')
    })
    const map = teamMapText(readReports(three.join('\n')).reports, undefined, {})
    expect(map).toContain('- 여럿이 새로 배운 개념: 클로저 (3)')
    for (const leak of ['김철수', '이영희', '박민수', '오후', '[']) expect(map).not.toContain(leak)
  })

  test('a token count as said reads back as a number, and other words as none', () => {
    expect(tokenNumber('약 1.2만')).toBe(12_000)
    expect(tokenNumber('약 3천')).toBe(3000)
    expect(tokenNumber('850')).toBe(850)
    expect(tokenNumber('약 18만')).toBe(180_000)
    expect(tokenNumber('약 1.1억')).toBe(110_000_000)
    expect(tokenNumber('많음')).toBeUndefined()
    expect(tokenNumber('')).toBeUndefined()
  })

  test('a 1.6.1 report reads with no team line, and a Slack paste reads to the same values as the file', () => {
    const text = report({ fresh: ['클로저', 'async/await', '구조 분해 할당'], missed: ['Promise 체이닝'], team: { total: 4, met: ['fetcher', '캐시 키'] } })
    const file = readOne(text)
    // 1.6.1 wrote the level setting above the calls, and had no team line.
    const old = text.replace(/^- 이 저장소 팀 용어: .*\n/m, '').replace('- 학습 노트의 모델 호출', '- 설명 수준 beginner\n- 학습 노트의 모델 호출')
    expect(old).toContain('- 설명 수준 beginner')
    const { team, ...rest } = file
    expect(team).toEqual({ total: 4, met: ['fetcher', '캐시 키'] })
    expect(readOne(old)).toEqual(rest)
    // A Slack message: who sent it and when, the heading as bold, its bullets as •, a full-width colon, CRLF and a
    // byte order mark, and (편집됨) after its last line.
    const lines = text.replace(/\n+$/, '').split('\n')
    const slack =
      '\uFEFF김철수  오후 3:12\r\n' +
      lines
        .map(line => line.replace('# 학습 보고', '*학습 보고*').replace(/^- /, '• ').replace('개념 3개: ', '개념 3개： '))
        .join('\r\n') +
      ' (편집됨)\r\n'
    expect(slack).toContain('*학습 보고* · ')
    expect(slack).toContain('• 새로 배운 개념 3개： ')
    expect(readOne(slack)).toEqual(file)
    // Bold where a chat made it so, a quote's >, and the same values still.
    const bold = text.replace('- 학습 노트 3개', '> - **학습 노트 3개**').replace(/^- 퀴즈 (.*)$/m, '- *퀴즈 $1*')
    expect(bold).toContain('> - **학습 노트 3개**')
    expect(readOne(bold)).toEqual(file)
    // A line edited in the chat ends in its mark, in Korean or English.
    const edited = text.replace('- 학습 노트 3개', '- 학습 노트 3개 (편집됨)').replace(/^(- 새로 배운 개념 .*)$/m, '$1 (edited)')
    expect(edited).toContain('- 학습 노트 3개 (편집됨)\n')
    expect(readOne(edited)).toEqual(file)
  })

  test('the own-words line and all under it, and who sent a report, never reach the map', () => {
    const own = (name: string) =>
      report({ fresh: ['클로저', 'async/await'] }).replace(
        '## 이번 기간에 배운 것을 내 말로 한 줄\n\n- ',
        `## 이번 기간에 배운 것을 내 말로 한 줄\n\n- ${name} 대리님 덕분에 클로저를 이해했습니다\n- 새로 배운 개념 1개: ${name} 대리님 코드 리뷰\n- 학습 노트 99개`,
      )
    const text = [`김철수  오후 3:12`, own('홍길동'), '이영희  오후 3:20', own('홍길동').replace('클로저를', '클로저 를'), '박민수  오후 4:01', own('홍길동').replace('클로저를', '클로저도')].join('\n\n')
    const read = readReports(text)
    // The three copies are one report (only their own words differ).
    expect(read.reports).toHaveLength(1)
    expect(read.repeated).toBe(2)
    expect(read.reports[0]!.notes).toBe(3)
    expect(read.reports[0]!.fresh).toEqual(['async/await', '클로저'])
    // Three teammates whose own words name the same person: none of it is read.
    const three = [0, 1, 2].map(i => own('홍길동').replace('- 학습 노트 3개', `- 학습 노트 ${3 + i}개`))
    const map = teamMapText(readReports(['김철수  오후 3:12', ...three].join('\n\n')).reports, undefined, {})
    expect(map).toContain('- 여럿이 새로 배운 개념: 클로저 (3) · async/await (3)')
    for (const leak of ['홍길동', '대리님', '김철수', '코드 리뷰', '99', '오후']) expect(map).not.toContain(leak)
  })

  test('a copy from a chat, from the file and with its own words changed count once; a block with no notes line is left out', () => {
    const text = report({ fresh: ['클로저'] })
    const slack = text.split('\n').map(line => line.replace(/^- /, '• ')).join('\n')
    const edited = text.replace('## 이번 기간에 배운 것을 내 말로 한 줄\n\n- ', '## 이번 기간에 배운 것을 내 말로 한 줄\n\n- 클로저가 어려웠다 (고침)')
    const broken = text.replace(/^- 학습 노트 3개\n/m, '')
    const read = readReports(['# 학습 보고 아님', '- 학습 노트 7개', '그냥 잡담 # 학습 보고 · 2026-10-01', text, slack, edited, broken].join('\n\n'))
    expect(read.reports).toHaveLength(1)
    expect(read.repeated).toBe(2)
    expect(read.odd).toBe(1)
    // Neither of the lines before the first report started one: no date, or words before it.
    expect(read.reports[0]!.notes).toBe(3)
    // Another count is another report.
    expect(readReports([text, text.replace('- 학습 노트 3개', '- 학습 노트 4개')].join('\n')).reports).toHaveLength(2)
  })

  test('only reports holding one day together count: one person\'s three weeks are one, three last-7-days on different days are three', () => {
    const weeks = [0, 7, 14].map(ago => readOne(report({ now: NOW - ago * DAY })))
    const apart = overlapReports(weeks)
    expect(apart.kept).toEqual([weeks[0]!])
    expect(apart.apart).toBe(2)
    const days = [0, 1, 2].map(ago => readOne(report({ now: NOW - ago * DAY })))
    expect(overlapReports(days)).toEqual({ kept: days, apart: 0 })
    // The day the most hold, the latest of two held by as many: another week's report and the earliest left out.
    expect(overlapReports([weeks[1]!, days[1]!, days[0]!]).kept).toEqual([days[1]!, days[0]!])
    expect(overlapReports([])).toEqual({ kept: [], apart: 0 })
    // A report whose first day is past its last (none read so) holds none, nor moves the day kept: two of the 5th and
    // two of the 1st, the later kept.
    const span = (from: string, to: string, notes: number): ReadReport => ({ ...days[0]!, from, to, notes })
    const pairs = [span('2026-10-05', '2026-10-05', 1), span('2026-10-05', '2026-10-05', 2), span('2026-10-01', '2026-10-01', 3), span('2026-10-01', '2026-10-01', 4)]
    expect(overlapReports([...pairs, span('2026-10-09', '2026-10-03', 5)])).toEqual({ kept: pairs.slice(0, 2), apart: 3 })
    expect(TEAM_MAP_REPORTS).toBe(300)
  })

  test('a file of tens of thousands of reports, each of another day, is sorted out in time', () => {
    const base = readOne(report({}))
    const dayOf = (i: number) => new Date(Date.UTC(1990, 0, 1) + i * DAY).toISOString().slice(0, 10)
    const many: ReadReport[] = Array.from({ length: 40_000 }, (_, i) => ({ ...base, from: dayOf(i), to: dayOf(i) }))
    // Three more of one day in the middle: those and the one of that day are the ones kept.
    const held = [0, 1, 2].map(i => ({ ...base, notes: 10 + i, from: dayOf(19_999), to: dayOf(19_999) }))
    const started = Date.now()
    const out = overlapReports([...many.slice(0, 20_000), ...held, ...many.slice(20_000)])
    expect(Date.now() - started).toBeLessThan(1000)
    expect(out.kept).toEqual([many[19_999]!, ...held])
    expect(out.apart).toBe(39_999)
  })
})

describe('1.8.0: the team learning map, with no line per person (E5)', () => {
  /** Reports read back: one per entry. */
  const read = (...people: Person[]) => people.map(p => readOne(report(p)))

  test('the map of five reports: a concept named only where three reports or more name it', () => {
    const terms = ['fetcher', '페이지 커서', '캐시 키', '재시도 정책', '기능 플래그', '로그 레벨'].map(name => ({ name, blurb: '' }))
    const reports = read(
      { fresh: ['클로저', 'async/await', '구조 분해 할당'], missed: ['Promise 체이닝'], team: { total: 6, met: ['fetcher', '페이지 커서'] } },
      { fresh: ['클로저', 'async/await'], missed: ['Promise 체이닝', '클로저 스코프'], team: { total: 6, met: ['fetcher'] } },
      { fresh: ['async/await', 'useEffect(정리 함수)'], missed: ['Promise 체이닝'], team: { total: 6, met: ['fetcher', '캐시 키'] } },
      { fresh: ['클로저', 'Async/Await'], missed: ['기본 for문'], team: { total: 6, met: [] } },
      { fresh: ['클로저', 'Promise'], missed: ['Promise 체이닝', '클로저 스코프', '기본 for문'], team: { total: 6, met: ['fetcher', '캐시 키'] } },
    )
    const map = teamMapText(reports, terms, {})
    const head = `# 팀 학습 지도 · ${recapRange('최근 7일', NOW)!.days[0]} ~ ${stamp(NOW).day} · 보고서 5개`
    expect(map).toBe(
      [
        head,
        '',
        '사람별 줄은 만들지 않습니다. 사람 이름 · 코드 · 요청 · 각자 쓴 한 줄은 넣지 않았습니다. 개념은 보고서 3개 이상에 나온 것만 이름을 적고, 괄호 안 숫자는 그 보고서 수입니다.',
        '',
        '- 학습 노트 15개 · 보고서마다 평균 1일 학습',
        '- 퀴즈 15문제 중 10개 맞힘 (67%)',
        '- 여럿이 새로 배운 개념: 클로저 (4) · async/await (4)',
        '- 여럿이 다시 볼 개념(퀴즈에서 틀림): Promise 체이닝 (4)',
        '- 보고서 3개 미만에 나온 개념 5개는 이름을 적지 않았습니다',
        '- 팀 용어 6개 · 이 저장소 팀 용어 줄이 있는 보고서 5개',
        '  - 여럿이 만남: fetcher (4)',
        '  - 덜 만남(보고서 3개 미만): 페이지 커서 · 캐시 키 · 재시도 정책 · 기능 플래그 · 로그 레벨',
        '- 모델 호출 100번 (자동 노트 60) · 입력 약 23만 · 출력 약 5만 토큰 · 보고서마다 평균 20번',
        '',
        '## 팀 파일 후보',
        '',
        '여럿이 퀴즈에서 틀렸지만 팀 용어에 없는 개념입니다. `.claude/learn-notes.md`의 `## 용어`에 우리 팀 코드로 설명을 적으면 팀원의 퀴즈가 그 설명으로 묻습니다. 설명 끝에 `src/api/client.ts:10-30`처럼 경로를 백틱으로 적으면 그 코드로 묻습니다.',
        '',
        '- **Promise 체이닝**: ',
        '',
      ].join('\n'),
    )
    // Under three, a name is only counted: 클로저 스코프 and 기본 for문 were missed in two reports.
    for (const hidden of ['클로저 스코프', '기본 for문', '구조 분해', 'useEffect', 'Promise (']) expect(map).not.toContain(hidden)
    expect(TEAM_MAP_MIN).toBe(3)
  })

  test('two reports keep a name hidden, three name it; a name differing in case or merged counts as one', () => {
    const two = teamMapText(read({ fresh: ['클로저'] }, { fresh: ['클로저'] }, { fresh: ['map'] }), undefined, {})
    expect(two).toContain('- 여럿이 새로 배운 개념: 없습니다')
    expect(two).toContain('- 보고서 3개 미만에 나온 개념 2개는 이름을 적지 않았습니다')
    expect(two).not.toContain('클로저')
    const three = teamMapText(read({ fresh: ['클로저'] }, { fresh: ['클로저'] }, { fresh: ['클로저'] }), undefined, {})
    expect(three).toContain('- 여럿이 새로 배운 개념: 클로저 (3)')
    expect(three).not.toContain('미만에 나온 개념')
    // Its spelling the one written most.
    const cased = teamMapText(read({ fresh: ['Async/Await'] }, { fresh: ['async/await'] }, { fresh: ['async/await'] }), undefined, {})
    expect(cased).toContain('- 여럿이 새로 배운 개념: async/await (3)')
    // A merge (/learn 합치기) followed: Destructuring counts as 구조 분해 할당.
    const aliases = { [conceptKey('Destructuring')]: conceptKey('구조 분해 할당') }
    const merged = teamMapText(read({ missed: ['Destructuring'] }, { missed: ['구조 분해 할당'] }, { missed: ['구조 분해 할당'] }), undefined, aliases)
    expect(merged).toContain('- 여럿이 다시 볼 개념(퀴즈에서 틀림): 구조 분해 할당 (3)')
    expect(teamMapText(read({ missed: ['Destructuring'] }, { missed: ['구조 분해 할당'] }, { missed: ['구조 분해 할당'] }), undefined, {})).toContain('다시 볼 개념(퀴즈에서 틀림): 없습니다')
    // Twice in one report (a list read twice, a spelling of each) is once.
    const [base] = read({})
    const once = teamMapText([{ ...base!, fresh: ['클로저', 'Closure', '클로저'] }, { ...base!, notes: 4, fresh: ['클로저'] }, { ...base!, notes: 5, fresh: ['map'] }], undefined, {
      [conceptKey('Closure')]: conceptKey('클로저'),
    })
    expect(once).toContain('- 여럿이 새로 배운 개념: 없습니다')
    // With no quiz graded, and the same order whatever the order of the reports.
    const quiet = read({ fresh: ['b', '나'], right: 0, wrong: 0 }, { fresh: ['나', 'b'], right: 0, wrong: 0 }, { fresh: ['b', '나'], right: 0, wrong: 0 })
    expect(teamMapText(quiet, undefined, {})).toContain('- 퀴즈: 채점한 문제가 없습니다\n- 여럿이 새로 배운 개념: 나 (3) · b (3)\n')
    expect(teamMapText([...quiet].reverse(), undefined, {})).toBe(teamMapText(quiet, undefined, {}))
  })

  test('the team terms count only the reports made with this repository\'s terms', () => {
    const terms = ['fetcher', '캐시 키', '페이지 커서'].map(name => ({ name, blurb: '' }))
    // Another repository's team file had four terms: that report is not in the count.
    const mixed = read(
      { team: { total: 3, met: ['fetcher', '캐시 키'] } },
      { team: { total: 3, met: ['fetcher'] } },
      { team: { total: 4, met: ['fetcher', '캐시 키'] } },
      {},
    )
    expect(teamMapText(mixed, terms, {})).toContain('- 팀 용어 3개: 이 저장소 팀 용어 줄이 있는 보고서가 3개보다 적어 세지 않았습니다\n')
    const same = read({ team: { total: 3, met: ['fetcher', '캐시 키'] } }, { team: { total: 3, met: ['fetcher'] } }, { team: { total: 3, met: ['Fetcher', '캐시 키'] } }, {})
    const map = teamMapText(same, terms, {})
    expect(map).toContain('- 팀 용어 3개 · 이 저장소 팀 용어 줄이 있는 보고서 3개\n  - 여럿이 만남: fetcher (3)\n  - 덜 만남(보고서 3개 미만): 캐시 키 · 페이지 커서\n')
    expect(map).not.toContain('15개까지')
    // No team terms here, no line; nor with no team file.
    expect(teamMapText(same, [], {})).not.toContain('팀 용어')
    expect(teamMapText(same, undefined, {})).not.toContain('팀 용어')
    // Sixteen terms or more: a report names fifteen of those met, so the ones after may be undercounted.
    const many = Array.from({ length: 16 }, (_, i) => ({ name: `용어 ${i}`, blurb: '' }))
    const all = many.map(term => term.name)
    const wide = teamMapText(read({ team: { total: 16, met: all } }, { team: { total: 16, met: all } }, { team: { total: 16, met: all } }), many, {})
    expect(wide).toContain('  - 여럿이 만남: 용어 0 (3) · 용어 1 (3) · ')
    expect(wide).toContain('  - 덜 만남(보고서 3개 미만): 용어 15\n  - 보고서마다 만난 용어를 15개까지 적어, 팀 파일 뒤쪽 용어는 덜 셀 수 있습니다\n')
    // Ten of the ones met less at most, the rest counted.
    const thirteen = many.slice(0, 13)
    const few = teamMapText(read({ team: { total: 13, met: ['용어 0'] } }, { team: { total: 13, met: ['용어 0'] } }, { team: { total: 13, met: ['용어 0'] } }), thirteen, {})
    expect(few).toContain('  - 여럿이 만남: 용어 0 (3)\n  - 덜 만남(보고서 3개 미만): 용어 1 · 용어 2 · 용어 3 · 용어 4 · 용어 5 · 용어 6 · 용어 7 · 용어 8 · 용어 9 · 용어 10 외 2개\n')
  })

  test('the team file\'s candidates: missed in three reports, no team term, ten at most; another sentence with no team file', () => {
    const missed = Array.from({ length: 12 }, (_, i) => `틀림 ${String(i).padStart(2, '0')}`)
    // Three reports each missing the same five (a report names five), one of them a team term.
    const reports = [3, 4, 5].map(notes => readOne(report({ notes, missed: ['fetcher', '캐시 키', ...missed.slice(0, 3)] })))
    const terms = [{ name: 'fetcher', blurb: '' }]
    const map = teamMapText(reports, terms, {})
    expect(map).toContain('\n## 팀 파일 후보\n\n여럿이 퀴즈에서 틀렸지만 팀 용어에 없는 개념입니다. ')
    expect(map.split('## 팀 파일 후보')[1]).toContain('\n\n- **캐시 키**: \n- **틀림 00**: \n- **틀림 01**: \n- **틀림 02**: \n')
    expect(map.split('## 팀 파일 후보')[1]).not.toContain('fetcher')
    expect(teamMapText(reports, undefined, {})).toContain(
      '\n## 팀 파일 후보\n\n여럿이 퀴즈에서 틀린 개념입니다. 저장소에 `.claude/learn-notes.md`를 만들고 `## 용어` 아래에 우리 팀 코드로 설명을 적으면 팀원의 퀴즈가 그 설명으로 묻습니다.\n\n- **캐시 키**: ',
    )
    expect(teamMapText(reports, undefined, {})).toContain('\n- **틀림 02**: \n- **fetcher**: \n')
    // Ten at most, the missed list named ten too (the reports name five each: a list read longer is still cut).
    const wide: ReadReport[] = [0, 1, 2].map(i => ({ ...reports[0]!, notes: i + 1, missed }))
    const picks = teamMapText(wide, [], {}).split('## 팀 파일 후보')[1]!.split('\n').filter(line => line.startsWith('- **'))
    expect(picks).toHaveLength(10)
    expect(teamMapText(wide, [], {})).toContain(' · 틀림 09 (3) 외 2개\n')
    // None missed by three: no section.
    expect(teamMapText(read({ missed: ['a'] }, { missed: ['a'] }, {}), undefined, {})).not.toContain('팀 파일 후보')
  })

  test('the head names the days of all the reports, and how many periods when they differ', () => {
    const same = teamMapText(read({}, {}, {}), undefined, {})
    expect(same.split('\n')[0]).toBe(`# 팀 학습 지도 · ${recapRange('최근 7일', NOW)!.days[0]} ~ ${stamp(NOW).day} · 보고서 3개`)
    const mixed = teamMapText(read({}, {}, { now: NOW - DAY }), undefined, {})
    expect(mixed.split('\n')[0]).toBe(`# 팀 학습 지도 · ${recapRange('최근 7일', NOW - DAY)!.days[0]} ~ ${stamp(NOW).day} · 보고서 3개 (기간 2가지)`)
    // A report of one day says it once.
    const day = teamMapText(read({ range: '오늘' }, { range: '오늘' }, { range: '오늘' }), undefined, {})
    expect(day.split('\n')[0]).toBe(`# 팀 학습 지도 · ${stamp(NOW).day} · 보고서 3개`)
    // No calls counted anywhere: no calls line.
    const none = { calls: 0, auto: 0, input: 0, output: 0 }
    expect(teamMapText(read({ calls: none }, { calls: none }, { calls: none }), undefined, {})).not.toContain('모델 호출')
  })
})

describe('1.8.0: the file /learn 보고서 모으기 names (E5)', () => {
  test('quotes off, a dropped file\'s escapes read, ~ as home, a relative path under the root, a network location never', () => {
    expect(gatherPath('"/home/u/Downloads/팀 보고서.txt"', '/home/u', '/proj')).toBe('/home/u/Downloads/팀 보고서.txt')
    expect(gatherPath("'/home/u/a.md'", '/home/u', '/proj')).toBe('/home/u/a.md')
    expect(gatherPath('`~/a.md`', '/home/u', '/proj')).toBe('/home/u/a.md')
    expect(gatherPath('“/home/u/a.md”', '/home/u', '/proj')).toBe('/home/u/a.md')
    expect(gatherPath('"/home/u/a.md\'', '/home/u', '/proj')).toBe('/proj/"/home/u/a.md\'')
    expect(gatherPath('/Users/kim/Downloads/팀보고서\\ \\(1\\).txt', '/Users/kim', '/proj')).toBe('/Users/kim/Downloads/팀보고서 (1).txt')
    expect(gatherPath('~/Downloads/팀보고서.txt', '/home/u', '/proj')).toBe('/home/u/Downloads/팀보고서.txt')
    expect(gatherPath('~\\Documents\\보고서 42주.txt', 'C:\\Users\\김 대리', 'C:\\proj')).toBe('C:\\Users\\김 대리\\Documents\\보고서 42주.txt')
    expect(gatherPath('~', '/home/u', '/proj')).toBe('/home/u')
    expect(gatherPath('~/a.md', undefined, '/proj')).toBeUndefined()
    // A Windows path keeps every backslash.
    expect(gatherPath('C:\\Users\\김 대리\\Documents\\보고서 42주.txt', undefined, 'C:\\proj')).toBe('C:\\Users\\김 대리\\Documents\\보고서 42주.txt')
    expect(gatherPath('"C:\\Users\\kim\\보고서 (1).txt"', undefined, 'C:\\proj')).toBe('C:\\Users\\kim\\보고서 (1).txt')
    expect(gatherPath('팀.md', '/home/u', '/proj')).toBe('/proj/팀.md')
    expect(gatherPath('./docs/팀.md', '/home/u', '/proj/')).toBe('/proj/docs/팀.md')
    expect(gatherPath('docs\\팀.md', undefined, 'C:\\proj')).toBe('C:\\proj/docs\\팀.md')
    expect(gatherPath('\\\\server\\share\\팀.md', '/home/u', '/proj')).toBe('network')
    expect(gatherPath('"\\\\server\\share\\팀.md"', '/home/u', '/proj')).toBe('network')
    expect(gatherPath('//server/share/팀.md', '/home/u', '/proj')).toBe('network')
    expect(gatherPath('""', '/home/u', '/proj')).toBeUndefined()
  })

  test('an @ mention from the composer\'s file picker, and a Windows path told by its root or home keeps its backslashes', () => {
    expect(gatherPath('@팀.md', '/Users/kim', '/proj')).toBe('/proj/팀.md')
    expect(gatherPath('@"팀 보고서.md"', '/Users/kim', '/proj')).toBe('/proj/팀 보고서.md')
    expect(gatherPath('@~/Downloads/팀.txt', '/Users/kim', '/proj')).toBe('/Users/kim/Downloads/팀.txt')
    expect(gatherPath('@', '/Users/kim', '/proj')).toBeUndefined()
    // A relative path, one from the drive's root and one under ~/ with a bracket after a separator: no escape there.
    expect(gatherPath('보고서\\(42주)\\팀.md', undefined, 'C:\\proj')).toBe('C:\\proj/보고서\\(42주)\\팀.md')
    expect(gatherPath('\\Users\\kim\\[팀]\\보고서.md', 'C:\\Users\\kim', 'C:\\proj')).toBe('\\Users\\kim\\[팀]\\보고서.md')
    expect(gatherPath('~/Downloads\\(1)\\팀.txt', 'C:\\Users\\kim', 'C:\\proj')).toBe('C:\\Users\\kim/Downloads\\(1)\\팀.txt')
    // On macOS a dropped file's escapes are read still, relative or under ~.
    expect(gatherPath('팀\\ 보고서\\ \\(1\\).txt', '/Users/kim', '/Users/kim/proj')).toBe('/Users/kim/proj/팀 보고서 (1).txt')
    expect(gatherPath('~/팀\\ 보고서.txt', '/Users/kim', '/Users/kim/proj')).toBe('/Users/kim/팀 보고서.txt')
  })
})
