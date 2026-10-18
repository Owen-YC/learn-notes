import type { LearnConcept, LearnSlip } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  OFTEN_CONCEPTS,
  OFTEN_DAYS,
  SLIP_TYPE_LABEL,
  SLIP_TYPE_PLAIN,
  cleanSlips,
  conceptKey,
  noteSlipName,
  oftenRecordLine,
  oftenSlip,
  slipCounts,
} from '../hooks/notes'

const NOW = Date.UTC(2026, 9, 3, 1)
const DAY = 86_400_000

/** A concept first met long ago, `more` over it. */
const concept = (name: string, more: Partial<LearnConcept> = {}): LearnConcept => ({ name, count: 2, firstAt: NOW - 100 * DAY, lastAt: NOW - DAY, blurb: '', files: [], ...more })
/** A slip with words of kind `type`, last missed `ago` before now. */
const slip = (type: LearnSlip['type'], ago: number, more: Partial<LearnSlip> = {}): LearnSlip => ({
  what: type === 'blank' ? '' : '복사된다고 봄',
  type,
  question: '문제',
  mine: '답',
  at: NOW - ago,
  times: 1,
  ...more,
})
/** An index of these concepts by their keys. */
const indexOf = (...list: LearnConcept[]) => Object.fromEntries(list.map(one => [conceptKey(one.name), one]))

describe('1.8.0: slipped concepts shown by name and counted, never their words (E2)', () => {
  test('a kind slipped on with three concepts or more is named, however few times each; two concepts are not enough', () => {
    expect([OFTEN_DAYS, OFTEN_CONCEPTS]).toEqual([30, 3])
    const index = indexOf(concept('const 선언'), concept('배열 복사'), concept('객체 비교'))
    // Two concepts, five times each: still no line (times is no measure).
    const two = { [conceptKey('const 선언')]: slip('reference', DAY, { times: 5 }), [conceptKey('배열 복사')]: slip('reference', 2 * DAY, { times: 5 }) }
    expect(oftenSlip(two, index, {}, NOW)).toBeUndefined()
    // Three, once each: 값과 참조, the latest slipped first.
    const three = {
      [conceptKey('객체 비교')]: slip('reference', 3 * DAY),
      [conceptKey('const 선언')]: slip('reference', DAY),
      [conceptKey('배열 복사')]: slip('reference', 2 * DAY),
    }
    expect(oftenSlip(three, index, {}, NOW)).toEqual({ type: 'reference', label: '값과 참조', names: ['const 선언', '배열 복사', '객체 비교'], concepts: 3, lastAt: NOW - DAY })
  })

  test('no words, 기타, a slip past 30 days, a concept the index lacks or one known (a 1.6 window\'s mark too) are not counted; merged keys count once; mended ones count', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    // A 1.6 window's /learn 안다: knownAt on the concept, the slip left open.
    const index = indexOf(...names.map(name => concept(name)), concept('known', { knownAt: NOW - DAY }))
    const base = { [conceptKey('a')]: slip('scope', DAY), [conceptKey('b')]: slip('scope', DAY + 60_000) }
    const one = (more: Record<string, LearnSlip>) => oftenSlip({ ...base, ...more }, index, {}, NOW)
    expect(one({ [conceptKey('c')]: slip('blank', DAY) })).toBeUndefined()
    expect(one({ [conceptKey('c')]: slip('scope', DAY, { what: '' }) })).toBeUndefined()
    expect(one({ [conceptKey('c')]: slip('other', DAY) })).toBeUndefined()
    expect(oftenSlip(Object.fromEntries(['a', 'b', 'c'].map(name => [conceptKey(name), slip('other', DAY)])), index, {}, NOW)).toBeUndefined()
    expect(one({ [conceptKey('c')]: slip('scope', (OFTEN_DAYS + 1) * DAY) })).toBeUndefined()
    // Exactly 30 days ago is still in.
    expect(one({ [conceptKey('c')]: slip('scope', OFTEN_DAYS * DAY) })?.concepts).toBe(3)
    expect(one({ [conceptKey('gone')]: slip('scope', DAY) })).toBeUndefined()
    expect(one({ [conceptKey('known')]: slip('scope', DAY) })).toBeUndefined()
    // Mended counts: it was slipped on all the same.
    expect(one({ [conceptKey('c')]: slip('scope', DAY + 120_000, { fixedAt: NOW }) })?.names).toEqual(['a', 'b', 'c'])
    // c merged into a (/learn 합치기): one concept, not two.
    const merged = { [conceptKey('c')]: conceptKey('a') }
    expect(oftenSlip({ ...base, [conceptKey('c')]: slip('scope', 3 * DAY) }, index, merged, NOW)).toBeUndefined()
    expect(oftenSlip({ ...base, [conceptKey('c')]: slip('scope', 3 * DAY), [conceptKey('d')]: slip('scope', 4 * DAY) }, index, merged, NOW)?.names).toEqual(['a', 'b', 'd'])
  })

  test('of two kinds: more concepts first, then the one slipped on last, then SLIP_TYPE_LABEL\'s order', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const index = indexOf(...names.map(name => concept(name)))
    const kind = (type: LearnSlip['type'], keys: string[], ago: number) => Object.fromEntries(keys.map((name, i) => [conceptKey(name), slip(type, ago + i * 60_000)]))
    // Four of 상태 against three of 변수 범위 slipped on later: more concepts win.
    expect(oftenSlip({ ...kind('scope', ['a', 'b', 'c'], DAY), ...kind('state', ['d', 'e', 'f', 'g'], 5 * DAY) }, index, {}, NOW)?.type).toBe('state')
    // Three each: the one slipped on last.
    expect(oftenSlip({ ...kind('state', ['a', 'b', 'c'], 5 * DAY), ...kind('scope', ['d', 'e', 'f'], DAY) }, index, {}, NOW)?.type).toBe('scope')
    // Three each, the same last time: the order the kinds are listed in (변수 범위 before 상태가 바뀌는 때).
    const same = { ...kind('state', ['a', 'b', 'c'], DAY), ...kind('scope', ['d', 'e', 'f'], DAY) }
    expect(Object.keys(SLIP_TYPE_LABEL).indexOf('scope')).toBeLessThan(Object.keys(SLIP_TYPE_LABEL).indexOf('state'))
    expect(oftenSlip(same, index, {}, NOW)?.type).toBe('scope')
  })

  test('the record\'s line: three names at most, the rest counted, the kind in plain words', () => {
    const line = oftenRecordLine({ type: 'reference', label: '값과 참조', names: ['const 선언', '배열 복사', '객체 비교', '얕은 복사'], concepts: 4, lastAt: NOW })
    expect(line).toBe('- 최근 30일 같은 종류로 헷갈린 개념 4개: const 선언, 배열 복사, 객체 비교 외 1개 · 값과 참조(복사본인지, 같은 것을 가리키는지)')
    expect(oftenRecordLine({ type: 'scope', label: '변수 범위', names: ['a', 'b', 'c'], concepts: 3, lastAt: NOW })).toBe(
      `- 최근 30일 같은 종류로 헷갈린 개념 3개: a, b, c · 변수 범위(${SLIP_TYPE_PLAIN.scope})`,
    )
    // Every kind but 기타 has its plain words, and each is the one asked for.
    expect(Object.keys(SLIP_TYPE_PLAIN).sort()).toEqual(Object.keys(SLIP_TYPE_LABEL).filter(type => type !== 'other').sort())
    expect(SLIP_TYPE_PLAIN).toEqual({
      order: '무엇이 먼저 실행되고 무엇을 기다리는지',
      reference: '복사본인지, 같은 것을 가리키는지',
      scope: '변수가 어디서 보이고 언제 사라지는지',
      coercion: '숫자·글자 같은 종류가 바뀌는 때',
      boundary: '처음·끝, 같음과 큼이 갈리는 곳',
      nullish: 'null·undefined·빈 값을 다룰 때',
      output: '함수가 돌려주는 값과 화면에 찍히는 값',
      state: '값이 언제 바뀌고 화면이 언제 다시 그려지는지',
    })
  })

  test('the line under a note: a concept it met again whose open slip has words and came before it; the latest slipped of several', () => {
    const index = indexOf(concept('클로저'), concept('map'), concept('새 개념', { firstAt: NOW }), concept('known', { knownAt: NOW - DAY }))
    const note = (...names: string[]) => ({ at: NOW, concepts: names.map(conceptKey) })
    const slips = (more: Record<string, LearnSlip>) => more
    const k = conceptKey
    expect(noteSlipName(note('클로저', 'map'), index, {}, slips({ [k('클로저')]: slip('scope', 2 * DAY) }))).toBe('클로저')
    // Of two, the one slipped on last.
    expect(noteSlipName(note('클로저', 'map'), index, {}, slips({ [k('클로저')]: slip('scope', 2 * DAY), [k('map')]: slip('state', DAY) }))).toBe('map')
    // None: a concept first met in this note, no words, mended, known, slipped on after the note, or no slip at all.
    expect(noteSlipName(note('새 개념'), index, {}, slips({ [k('새 개념')]: slip('scope', 2 * DAY) }))).toBeUndefined()
    expect(noteSlipName(note('클로저'), index, {}, slips({ [k('클로저')]: slip('blank', 2 * DAY) }))).toBeUndefined()
    expect(noteSlipName(note('클로저'), index, {}, slips({ [k('클로저')]: slip('scope', 2 * DAY, { fixedAt: NOW - DAY }) }))).toBeUndefined()
    expect(noteSlipName(note('known'), index, {}, slips({ [k('known')]: slip('scope', 2 * DAY) }))).toBeUndefined()
    expect(noteSlipName(note('클로저'), index, {}, slips({ [k('클로저')]: slip('scope', -60_000) }))).toBeUndefined()
    expect(noteSlipName(note('클로저'), index, {}, slips({ [k('클로저')]: slip('scope', 0) }))).toBeUndefined()
    expect(noteSlipName(note('클로저'), index, {}, {})).toBeUndefined()
    // A key the note wrote before a merge reads as the concept it went into; the slips as cleanSlips gives them.
    const map = { [k('closure')]: k('클로저') }
    const kept = cleanSlips({ [k('closure')]: slip('scope', 2 * DAY) }, map, NOW)
    expect(noteSlipName({ at: NOW, concepts: [k('closure'), k('클로저')] }, index, map, kept)).toBe('클로저')
  })

  test('the slips counted: open and mended, 기타 and no words by kind, open after two misses or more (열린 채 두 번 이상)', () => {
    expect(slipCounts({})).toEqual({ all: 0, open: 0, mended: 0, other: 0, blank: 0, againOpen: 0 })
    const counted = slipCounts({
      a: slip('scope', DAY, { times: 2 }),
      b: slip('other', DAY, { times: 3, fixedAt: NOW }),
      c: slip('blank', DAY, { times: 2, isRight: true }),
      d: slip('state', DAY),
      e: slip('blank', DAY, { times: 1 }),
    })
    expect(counted).toEqual({ all: 5, open: 4, mended: 1, other: 1, blank: 2, againOpen: 2 })
    // The commonest way there: missed on the try again, then right after being asked back. Still open, missed twice:
    // counted, whatever the next quiz makes of it (the name says what is counted, and the plan's 바탕 개념 reads it so).
    expect(slipCounts({ a: slip('scope', DAY, { times: 2, isRight: true }), b: slip('scope', DAY, { times: 3, isRight: true }) }).againOpen).toBe(2)
    // Mended or missed once: not counted.
    expect(slipCounts({ a: slip('scope', DAY, { times: 4, fixedAt: NOW }), b: slip('scope', DAY, { times: 1 }) }).againOpen).toBe(0)
  })
})
