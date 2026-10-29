import type { LearnConcept } from '../types'
import { describe, expect, test } from 'claude-code/testing'

import {
  OLD_WRITES_MAX,
  WRITER_MARK,
  cleanConcepts,
  cleanMarkedConcepts,
  cleanOldWrites,
  conceptKey,
  indexPrint,
  isMarkedIndex,
  knownMarks,
  markFor,
  markHelped,
  markPartial,
  markWrong,
  markedConcepts,
  recallSteps,
  stepMarks,
  storedConcepts,
  withKnownMarks,
} from '../hooks/notes'
import { COEXIST_CASES, COEXIST_MIXED, COEXIST_NOW, type CoexistStore } from './fixtures/coexist19'
import { QUIZ_OUTPUT_18 } from './fixtures/quiz18'
import { QUIZ_OUTPUT_110_ON } from './fixtures/quiz19'
import { WORKED_OUTPUT_110 } from './fixtures/worked110'

const NOW = COEXIST_NOW
const DAY = 86_400_000
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** A concept as the store holds one. */
const concept = (name: string, more: Partial<LearnConcept> = {}): LearnConcept => ({ name, count: 2, firstAt: NOW - 60 * DAY, lastAt: NOW - 40 * DAY, blurb: `${name} 설명`, files: [], ...more })
/** An index as 1.9.0 holds one: read back from concept records (cleanConcepts), merges followed. */
const indexOf = (rows: LearnConcept[], aliases: Record<string, string> = {}) => cleanConcepts(Object.fromEntries(rows.map(one => [conceptKey(one.name), one])), aliases)
/** What 1.9.0's storeIndex leaves for `index`: the copies, then the index with the writer's mark, as JSON. */
const written = (index: Record<string, LearnConcept>, at: number) => json({ known: knownMarks(index), steps: stepMarks(index), concepts: markedConcepts(index, at) })
/** The index read through the copies, as 1.6.0 to 1.8.0 read every one and 1.9.0 reads one with no mark. */
const throughCopies = (store: Record<string, unknown>, aliases: Record<string, string> = {}) =>
  recallSteps(withKnownMarks(cleanConcepts(store.concepts, aliases), store.known, aliases), store.steps, aliases)
/** 1.9.0's read of the store (indexOf): the marked index alone, any other through its copies. */
const read19 = (store: CoexistStore, aliases: Record<string, string>) => (isMarkedIndex(store.concepts) ? cleanMarkedConcepts(store.concepts, aliases) : throughCopies(store, aliases))
const hasMark = (raw: unknown) => Object.prototype.hasOwnProperty.call(raw, WRITER_MARK)

describe('1.9.0: the writer\'s mark in the concept index, read with no copy (F1)', () => {
  test('cleanConcepts passes over the mark, a number or a string; markedConcepts is storedConcepts with the mark beside', () => {
    const index = indexOf([concept('map', { step: 3, reviewedAt: NOW - DAY }), concept('화살표 함수 (짧게 쓰는 함수 표현식)', { knownAt: NOW - 3 * DAY })])
    const stored = storedConcepts(index)
    expect(markedConcepts(index, NOW)).toEqual({ ...stored, '#w': NOW })
    expect(Object.keys(markedConcepts(index, NOW)).at(-1)).toBe('#w')
    // The name as it was stored (fullName), as storedConcepts keeps it.
    expect((markedConcepts(index, NOW)[conceptKey('화살표 함수')] as LearnConcept).name).toBe('화살표 함수 (짧게 쓰는 함수 표현식)')
    for (const mark of [NOW, 'x', 0, null]) expect(cleanConcepts({ ...stored, '#w': mark })).toEqual(cleanConcepts(stored))
    // No concept's key is the mark's: every one begins `c:`.
    expect(Object.keys(index).every(key => key.startsWith('c:'))).toBe(true)
    expect(WRITER_MARK.startsWith('c:')).toBe(false)
  })

  test('isMarkedIndex: a finite number under the mark alone', () => {
    const stored = storedConcepts(indexOf([concept('map')]))
    expect(isMarkedIndex({ ...stored, '#w': NOW })).toBe(true)
    expect(isMarkedIndex({ '#w': 0 })).toBe(true)
    for (const mark of [Number.NaN, Number.POSITIVE_INFINITY, String(NOW), null, {}, [NOW], true]) expect(isMarkedIndex({ ...stored, '#w': mark })).toBe(false)
    expect(isMarkedIndex(stored)).toBe(false)
    expect(isMarkedIndex({})).toBe(false)
    for (const raw of [undefined, null, NOW, 'concepts', [{ '#w': NOW }]]) expect(isMarkedIndex(raw)).toBe(false)
    // Only its own: never one an object inherits.
    expect(isMarkedIndex(Object.create({ '#w': NOW }))).toBe(false)
  })

  test('cleanMarkedConcepts reads as cleanConcepts does, but a step past the first with no time given as 1, as its copies would', () => {
    const raw = { ...storedConcepts(indexOf([concept('map', { step: 3, reviewedAt: NOW - DAY }), concept('filter', { step: 2 }), concept('reduce', { step: 1 })])), '#w': NOW }
    const read = cleanMarkedConcepts(raw)
    expect(read[conceptKey('map')]).toMatchObject({ step: 3, reviewedAt: NOW - DAY })
    expect(read[conceptKey('filter')]!.step).toBe(1)
    expect(read[conceptKey('reduce')]!.step).toBe(1)
    expect(Object.keys(read)).toEqual(Object.keys(cleanConcepts(raw)))
  })

  test('every index 1.9.0 writes reads the same through its copies as alone: known marks, a miss after one, steps 0 to 5, a step with no time, full names, merges', () => {
    const MERGES = { 'c:destructuring': 'c:구조분해할당' }
    const cases: { what: string; rows: LearnConcept[]; aliases?: Record<string, string>; isTimeless?: true }[] = [
      { what: '안다 표시', rows: [concept('클로저', { knownAt: NOW - 5 * DAY }), concept('map')] },
      { what: 'knownAt 뒤의 missedAt', rows: [concept('filter', { knownAt: NOW - 10 * DAY, missedAt: NOW - 2 * DAY, step: 0 })] },
      {
        what: '단계 0~5',
        rows: [0, 1, 2, 3, 4, 5].map(step => concept(`s${step}`, { step, reviewedAt: NOW - (step + 1) * DAY, ...(step === 0 ? { missedAt: NOW - DAY } : {}) })),
      },
      { what: 'reviewedAt 없는 단계 2', rows: [concept('no-time', { step: 2 }), concept('map', { step: 2, reviewedAt: NOW - DAY })], isTimeless: true },
      { what: 'fullName', rows: [concept('화살표 함수 (짧게 쓰는 함수 표현식)', { step: 3, reviewedAt: NOW - 7 * DAY, knownAt: NOW - 3 * DAY })] },
      { what: '합치기 별칭', rows: [concept('Destructuring', { count: 3, step: 2, reviewedAt: NOW - 8 * DAY, knownAt: NOW - 4 * DAY }), concept('구조 분해 할당')], aliases: MERGES },
      { what: '빈 개념 모음', rows: [] },
    ]
    for (const one of cases) {
      const aliases = one.aliases ?? {}
      const index = indexOf(one.rows, aliases)
      const store = written(index, NOW)
      expect(isMarkedIndex(store.concepts)).toBe(true)
      const alone = json(cleanMarkedConcepts(store.concepts, aliases))
      expect(json(throughCopies(store, aliases))).toEqual(alone)
      // Read alone, it is cleanConcepts' own read, but for a step past the first with no time given.
      if (one.isTimeless) expect(alone[conceptKey('no-time')]!.step).toBe(1)
      else expect(alone).toEqual(json(cleanConcepts(store.concepts, aliases)))
    }
  })

  test('cleanOldWrites: a since alone is needed; a count kept whole, 0 to 9999, and 1 at least once one was seen', () => {
    expect(cleanOldWrites({ since: NOW, n: 0 })).toEqual({ since: NOW, n: 0 })
    expect(cleanOldWrites({ since: NOW, last: NOW + DAY, n: 3 })).toEqual({ since: NOW, last: NOW + DAY, n: 3 })
    expect(cleanOldWrites({ since: NOW, last: NOW + DAY, n: 0 })).toEqual({ since: NOW, last: NOW + DAY, n: 1 })
    expect(cleanOldWrites({ since: NOW, n: 2.7 })).toEqual({ since: NOW, n: 2 })
    expect(cleanOldWrites({ since: NOW, n: 99_999 })).toEqual({ since: NOW, n: OLD_WRITES_MAX })
    expect(cleanOldWrites({ since: NOW, n: -4 })).toEqual({ since: NOW, n: 0 })
    expect(cleanOldWrites({ since: NOW, last: 'x', n: 'y' })).toEqual({ since: NOW, n: 0 })
    for (const raw of [undefined, null, NOW, [], { n: 3 }, { since: 'x', n: 1 }, { since: Number.NaN, n: 1 }]) expect(cleanOldWrites(raw)).toBeUndefined()
    // The last write's print (review of 1/5): beside a last time alone, and only as indexPrint makes one.
    const w = indexPrint({ [conceptKey('map')]: concept('map') })
    expect(cleanOldWrites({ since: NOW, last: NOW + DAY, n: 3, w })).toEqual({ since: NOW, last: NOW + DAY, n: 3, w })
    expect(cleanOldWrites({ since: NOW, n: 0, w })).toEqual({ since: NOW, n: 0 })
    for (const bad of ['', 'ABC', 'a-b', '12345678', 7, null]) expect(cleanOldWrites({ since: NOW, last: NOW + DAY, n: 3, w: bad })).toEqual({ since: NOW, last: NOW + DAY, n: 3 })
    // Under 100 bytes at its longest.
    expect(JSON.stringify({ since: NOW, last: NOW, n: OLD_WRITES_MAX, w: 'zzzzzzz' }).length).toBeLessThan(100)
  })

  test('indexPrint: the same index the same print, seven characters of base 36 at most; a change to any concept another', () => {
    const stored = storedConcepts(indexOf([concept('클로저', { knownAt: NOW - DAY }), concept('map', { step: 2, reviewedAt: NOW - 3 * DAY })]))
    const print = indexPrint(stored)
    expect(print).toMatch(/^[0-9a-z]{1,7}$/)
    expect(indexPrint(json(stored))).toBe(print)
    const map = stored[conceptKey('map')] as LearnConcept
    const changed = [
      { ...stored, [conceptKey('map')]: { ...map, count: map.count + 1 } },
      { ...stored, [conceptKey('map')]: { ...map, step: 3 } },
      { ...stored, [conceptKey('클로저')]: { ...(stored[conceptKey('클로저')] as LearnConcept), knownAt: undefined } },
      { ...stored, [conceptKey('for')]: concept('for') },
    ]
    for (const other of changed) expect(indexPrint(json(other))).not.toBe(print)
    expect(new Set(changed.map(other => indexPrint(json(other)))).size).toBe(changed.length)
  })
})

describe('1.9.0: the stores the four old builds left over one 1.9.0 wrote, by their own functions (coexist19)', () => {
  test('each fixture store 1.9.0 wrote is what this build writes for its index: made again by the probe when it changes', () => {
    for (const one of [...COEXIST_CASES, COEXIST_MIXED]) {
      const store = written(one.index, one.at)
      expect(one.before.concepts).toEqual(store.concepts)
      expect(one.before.known).toEqual(store.known)
      expect(one.before.steps).toEqual(store.steps)
      expect(one.before.oldWrites).toEqual({ since: one.at, n: 0 })
      expect(isMarkedIndex(one.before.concepts)).toBe(true)
    }
  })

  test('every old build\'s write leaves the mark out, and 1.9.0 reads it as 1.8.0\'s own functions did', () => {
    expect(COEXIST_CASES.map(one => one.by)).toEqual(['1.5.1', '1.5.1', '1.6.0', '1.8.0', '1.7.0'])
    for (const one of COEXIST_CASES) {
      expect(hasMark(one.after.concepts)).toBe(false)
      expect(isMarkedIndex(one.after.concepts)).toBe(false)
      expect(json(read19(one.after, one.aliases))).toEqual(one.read18)
    }
    const [ga, na, da, ra, ba] = COEXIST_CASES.map(one => read19(one.after, one.aliases))
    // (가) No known mark: 1.5.1 counts a note, leaving no trace but the mark's going; the steps by their copy.
    expect(ga![conceptKey('map')]).toMatchObject({ step: 3, count: 3 })
    expect(ga![conceptKey('클로저')]!.count).toBe(2)
    expect(ga![conceptKey('for...of 반복문')]!.count).toBe(1)
    // (나) 1.5.1's quiz gave a step from the notes met: read as 1.
    expect((COEXIST_CASES[1]!.after.concepts[conceptKey('map')] as LearnConcept).step).toBeGreaterThan(1)
    expect(na![conceptKey('map')]!.step).toBe(1)
    // (다) 1.6.0's /learn 모른다: the mark stays off.
    expect(da![conceptKey('클로저')]!.knownAt).toBeUndefined()
    // (라) 1.8.0's grade gave step 2: 2.
    expect(ra![conceptKey('map')]!.step).toBe(2)
    // (바) 1.7.0's /learn 안다: the mark kept, and the step.
    expect(ba![conceptKey('클로저')]!.knownAt).toBe(NOW - 3_600_000)
    expect(ba![conceptKey('map')]!.step).toBe(2)
  })

  test('(마) a 1.9.0 store: each old build reads it as a 1.8.0 one, 1.6.0 to 1.8.0 read what 1.9.0 does, and none of their writes keeps the mark', () => {
    const { aliases, before, reads, rewrites, rereads18 } = COEXIST_MIXED
    const seen = json(read19(before, aliases))
    expect(Object.keys(reads)).toEqual(['1.5.1', '1.6.0', '1.7.0', '1.8.0'])
    for (const [v, read] of Object.entries(reads)) {
      expect(read.of19).toEqual(read.of18)
      expect(hasMark(read.of19)).toBe(false)
      if (v !== '1.5.1') expect(read.of19).toEqual(seen)
    }
    // 1.5.1 knows no known mark and no short name; every other field it reads as 1.9.0 does, the step with no time given aside.
    for (const [key, one] of Object.entries(seen)) {
      const old = reads['1.5.1']!.of19[key]!
      expect(old).toMatchObject({ count: one.count, firstAt: one.firstAt, lastAt: one.lastAt, name: one.fullName ?? one.name })
      expect(old.reviewedAt).toBe(one.reviewedAt)
      if (one.reviewedAt !== undefined) expect(old.step).toBe(one.step)
    }
    expect(seen[conceptKey('no-time')]!.step).toBe(1)
    expect(seen[conceptKey('구조 분해 할당')]).toMatchObject({ name: 'Destructuring', knownAt: NOW - 4 * DAY, step: 2 })
    for (const v of Object.keys(reads)) {
      expect(hasMark(rewrites[v]!.concepts)).toBe(false)
      expect(json(read19(rewrites[v]!, aliases))).toEqual(rereads18[v])
    }
  })
})

describe('1.10.0 (G2): a question in code changed asked with it on is the record 1.8.0 wrote for one, graded as 1.8.0 graded it', () => {
  test('every quiz of quiz18.ts that keeps code changed on (a harness\'s 2): each such question the same record, field for field, as 1.8.0 (3690021) read back from the same reply', () => {
    const keys = Object.keys(QUIZ_OUTPUT_110_ON)
    expect(keys.length).toBeGreaterThan(0)
    let changed = 0
    for (const key of keys) {
      const was = QUIZ_OUTPUT_18[key.split(' ')[0]!]!
      QUIZ_OUTPUT_110_ON[key]!.items.forEach((item, i) => {
        if (item.rung !== 'changed') return
        changed += 1
        // The fields every window from 1.7.0 reads (key, name, question, hint, answer, kind, noteId) and 1.8.0's rung.
        expect([key, item]).toEqual([key, was.items[i]])
        expect(Object.keys(item).every(field => ['key', 'name', 'question', 'hint', 'answer', 'kind', 'noteId', 'rung'].includes(field))).toBe(true)
      })
    }
    expect(changed).toBeGreaterThan(0)
  })

  test('its grade marks the concept as a 1.8.0 question in code changed: wrong to the first step, 거의 one back, right as any', () => {
    const index = { [conceptKey('map')]: concept('map', { step: 3, reviewedAt: NOW - 8 * DAY }) }
    const after = (mark: ReturnType<typeof markFor>) => mark(index, [conceptKey('map')], NOW)[conceptKey('map')]!
    expect(markFor('wrong', undefined, false, 'changed')).toBe(markWrong)
    expect(markFor('wrong', 'partial', false, 'changed')).toBe(markPartial)
    expect(after(markFor('wrong', undefined, false, 'changed'))).toEqual(after(markFor('wrong', undefined, false, undefined)))
    expect(after(markFor('wrong', 'partial', false, 'changed'))).toEqual(after(markFor('wrong', 'partial', false, undefined)))
    expect(after(markFor('wrong', undefined, false, 'changed')).step).toBe(0)
    expect(after(markFor('wrong', 'partial', false, 'changed')).step).toBe(2)
    expect(after(markFor('right', 'right', false, 'changed'))).toEqual(after(markFor('right', 'right', false, undefined)))
  })
})

describe('1.10.0 (G1): a worked example asked with a branch on is the record 1.8.0 wrote for one, its P line nowhere, graded as 1.8.0 graded it', () => {
  test('every worked example of worked110.ts: the same record, field for field, as 1.8.0 (3690021) read back from the same reply with its P lines taken out', () => {
    let worked = 0
    for (const [key, out] of Object.entries(WORKED_OUTPUT_110)) {
      out.items.forEach((item, i) => {
        if (item.rung !== 'worked') return
        worked += 1
        expect([key, item]).toEqual([key, out.items18[i]])
        // The fields every window from 1.7.0 reads and 1.8.0's rung: no field of its own, no P line's words kept.
        expect(Object.keys(item).every(field => ['key', 'name', 'question', 'hint', 'answer', 'kind', 'noteId', 'isRetry', 'rung'].includes(field))).toBe(true)
        expect(JSON.stringify(item)).not.toMatch(/P\d:|→/)
      })
    }
    expect(worked).toBe(22)
  })

  test('its grade marks the concept as a 1.8.0 worked example: wrong to the first step, right after the example as right with help (its step kept)', () => {
    const index = { [conceptKey('합계')]: concept('합계', { step: 3, reviewedAt: NOW - 8 * DAY }) }
    const after = (mark: ReturnType<typeof markFor>) => mark(index, [conceptKey('합계')], NOW)[conceptKey('합계')]!
    // The example is help (register.tsx isHelpedGrade, 1.8.0): the grade hands markFor isHelped for a worked example.
    expect(markFor('wrong', undefined, false, 'worked')).toBe(markWrong)
    expect(markFor('right', 'right', true, 'worked')).toBe(markHelped)
    expect(after(markFor('wrong', undefined, false, 'worked')).step).toBe(0)
    expect(after(markFor('right', 'right', true, 'worked'))).toMatchObject({ step: 3, reviewedAt: NOW })
  })
})
