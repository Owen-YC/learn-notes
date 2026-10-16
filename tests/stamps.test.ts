import { describe, expect, test } from 'claude-code/testing'

import {
  BEHIND_TAIL,
  STAMP_KEPT_MS,
  STAMP_LIVE_MS,
  STAMPS_KEPT,
  STORE_SCHEMA,
  agoText,
  cleanStamps,
  compareVersions,
  isSchemaAhead,
  jsonBytes,
  newerBuild,
  newerText,
  otherStamps,
  versionParts,
  withStamp,
} from '../hooks/notes'

const NOW = new Date(2026, 9, 14, 9, 30).getTime()
const MINUTE = 60_000

describe('1.7.0: the version stamp and the schema guard', () => {
  test('versions compare by major, minor and patch as numbers; anything else compares as the same', () => {
    expect(versionParts('1.7.10')).toEqual([1, 7, 10])
    expect(versionParts('1.7.0-beta.1')).toEqual([1, 7, 0])
    expect(versionParts('1.7')).toBeUndefined()
    expect(versionParts('v1.7.0')).toBeUndefined()
    expect(compareVersions('1.7.10', '1.7.9')).toBeGreaterThan(0)
    expect(compareVersions('1.10.0', '1.9.9')).toBeGreaterThan(0)
    expect(compareVersions('1.7.0', '1.7.1')).toBeLessThan(0)
    expect(compareVersions('1.7.0', '1.7.0')).toBe(0)
    expect(compareVersions('nope', '1.7.0')).toBe(0)
  })

  test('the stamps keep the newest 8 well-formed ones of the last day, each window once', () => {
    const many = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`s${i}`, { v: '1.7.0', at: NOW - i * MINUTE }]))
    const kept = cleanStamps({ ...many, old: { v: '1.7.1', at: NOW - STAMP_KEPT_MS }, bad: { v: 'x', at: NOW }, odd: 'yes', far: { v: '1.7.1', at: NOW + STAMP_KEPT_MS } }, NOW)
    expect(Object.keys(kept)).toEqual(['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'])
    expect(Object.keys(kept)).toHaveLength(STAMPS_KEPT)
    expect(cleanStamps(null, NOW)).toEqual({})
    expect(cleanStamps([{ v: '1.7.0', at: NOW }], NOW)).toEqual({})
    // A reload keeps its session's id: its stamp is written over, never added beside the old one.
    const mine = withStamp(many, 's5', '1.7.1', NOW + MINUTE)
    expect(Object.keys(mine)).toHaveLength(STAMPS_KEPT)
    expect(mine.s5).toEqual({ v: '1.7.1', at: NOW + MINUTE })
    expect(Object.keys(mine)[0]).toBe('s5')
    // Under 1KB however long the ids.
    expect(jsonBytes(withStamp(Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`${'x'.repeat(36)}${i}`, { v: '10.20.30', at: NOW }])), 'me', '1.7.0', NOW))).toBeLessThan(1024)
  })

  test('a newer build counts while another window stamped it within 30 minutes; this window and older builds never do', () => {
    const stamps = cleanStamps(
      {
        me: { v: '1.9.0', at: NOW },
        a: { v: '1.7.1', at: NOW - 3 * MINUTE },
        b: { v: '1.8.0', at: NOW - STAMP_LIVE_MS },
        c: { v: '1.6.1', at: NOW - MINUTE },
      },
      NOW,
    )
    expect(newerBuild(stamps, 'me', '1.7.0', NOW)).toBe('1.7.1')
    expect(newerBuild(stamps, 'me', '1.7.1', NOW)).toBeUndefined()
    expect(newerBuild(stamps, 'a', '1.7.0', NOW)).toBe('1.9.0')
    expect(newerBuild(stamps, 'me', '1.7.0', NOW + 2 * 3_600_000)).toBeUndefined()
    expect(otherStamps(stamps, 'me')).toEqual([
      { v: '1.6.1', at: NOW - MINUTE },
      { v: '1.7.1', at: NOW - 3 * MINUTE },
      { v: '1.8.0', at: NOW - STAMP_LIVE_MS },
    ])
  })

  test('the notice names both versions and how to update; the guard adds what this window leaves alone', () => {
    expect(newerText('1.7.1', '1.7.0', false)).toBe('learn-notes 새 버전(1.7.1)이 다른 창에서 쓰이고 있습니다 · 이 창은 1.7.0입니다 · /reload-plugins로 바꿉니다')
    expect(newerText('1.8.0', '1.7.0', true)).toBe(
      'learn-notes 새 버전(1.8.0)이 다른 창에서 쓰이고 있습니다 · 이 창은 1.7.0입니다 · /reload-plugins로 바꿉니다 · 다시 불러올 때까지 이 창은 개념 모음과 복습 단계를 고치지 않습니다(노트와 일지는 그대로)',
    )
    // The store newer with no newer window stamped lately: said all the same, since the concepts stop changing here;
    // and a way on (교차 검토 4), since a newer build rolled back leaves no newer one to load.
    const stuck = '다시 불러와도 계속되면 /learn 진단을 담당자에게 보내 주세요'
    expect(newerText(undefined, '1.7.0', true)).toBe(`learn-notes 새 버전이 다른 창에서 학습 기록을 새 구조로 썼습니다 · 이 창은 1.7.0입니다 · /reload-plugins로 바꿉니다 · ${BEHIND_TAIL} · ${stuck}`)
    expect(newerText(undefined, undefined, true)).toBe(`learn-notes 새 버전이 다른 창에서 학습 기록을 새 구조로 썼습니다 · /reload-plugins로 바꿉니다 · ${BEHIND_TAIL} · ${stuck}`)
    expect(newerText(undefined, '1.7.0', false)).toBeUndefined()
    expect(newerText('1.7.1', undefined, false)).toBeUndefined()
  })

  test('the guard turns on only for a whole number above this build\'s layout', () => {
    expect(STORE_SCHEMA).toBe(3)
    expect(isSchemaAhead(4)).toBe(true)
    expect(isSchemaAhead(3)).toBe(false)
    expect(isSchemaAhead(2)).toBe(false)
    expect(isSchemaAhead(undefined)).toBe(false)
    expect(isSchemaAhead('4')).toBe(false)
    expect(isSchemaAhead(3.5)).toBe(false)
  })

  test('how long ago, as the diagnosis says it', () => {
    expect(agoText(NOW - 20_000, NOW)).toBe('방금')
    expect(agoText(NOW - 3 * MINUTE, NOW)).toBe('3분 전')
    expect(agoText(NOW - 125 * MINUTE, NOW)).toBe('2시간 전')
    expect(agoText(NOW - 25 * 60 * MINUTE, NOW)).toBe('1일 전')
    expect(agoText(NOW + MINUTE, NOW)).toBe('방금')
  })
})
