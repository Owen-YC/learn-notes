import { describe, expect, test } from 'claude-code/testing'

import {
  FEATURE_NAMES,
  IS_BASE_ASKED,
  IS_RULE_DRILL,
  IS_THINK_ASKED,
  MODEL_SWITCHES,
  RUNG_CHANGED_STEP,
  RUNG_NEW_STEP,
  SWITCH_KINDS,
  SWITCH_NAMES,
  SWITCHES_OFF,
  WORKED_AFTER_TIMES,
  diagText,
  harnessStepOf,
  hasOn,
  overlaySwitches,
  routeOf,
  routeOn,
  routeText,
  switchedNames,
  switchesFor,
  switchKeys,
  type DiagInput,
  type MeasuredModel,
  type Switches,
} from '../hooks/notes'

/** A value that turns each switch on, as a measured route may. */
const ON: Readonly<Switches> = { isRuleDrill: true, isRuleWide: true, rungNewStep: 4, rungChangedStep: 2, workedAfterTimes: 2, isBaseAsked: true, isThinkAsked: true }
/** The on values each feature's design may ship for a model (D1, the designs' decision rules). */
const ON_VALUES: Readonly<Record<keyof Switches, readonly (boolean | number)[]>> = {
  isRuleDrill: [true],
  isRuleWide: [true],
  rungNewStep: [4],
  rungChangedStep: [2],
  workedAfterTimes: [2],
  isBaseAsked: [true],
  isThinkAsked: [true],
}
/**
 * MODEL_SWITCHES as it must ship, cell by cell (1.10.0 G7, R6): each value the off one until a feature's decision in
 * docs/qa/견본.md ('모델별 결정') turns that model's cell on, in the commit after it, this table with it.
 */
const SHIPPED: Readonly<Record<MeasuredModel, Switches>> = {
  haiku: { isRuleDrill: false, isRuleWide: false, rungNewStep: Infinity, rungChangedStep: Infinity, workedAfterTimes: Infinity, isBaseAsked: false, isThinkAsked: false },
  sonnet: { isRuleDrill: false, isRuleWide: false, rungNewStep: Infinity, rungChangedStep: Infinity, workedAfterTimes: Infinity, isBaseAsked: false, isThinkAsked: false },
}
/** Two tables a route may run, one model's row unlike the other's. */
const SPLIT: Readonly<Record<MeasuredModel, Readonly<Switches>>> = {
  haiku: { ...SWITCHES_OFF, isThinkAsked: true },
  sonnet: { ...SWITCHES_OFF, workedAfterTimes: 2, isBaseAsked: true },
}
const ALL_OFF: Readonly<Record<MeasuredModel, Readonly<Switches>>> = { haiku: SWITCHES_OFF, sonnet: SWITCHES_OFF }

describe('1.10.0: 모델별 갈래 (G7): the switches each model setting runs with', () => {
  test('switchesFor: haiku and sonnet exactly, at beginner, their own rows; any other string or level every switch off', () => {
    expect(switchesFor('haiku', 'beginner')).toBe(MODEL_SWITCHES.haiku)
    expect(switchesFor('sonnet', 'beginner')).toBe(MODEL_SWITCHES.sonnet)
    for (const model of ['opus', '', 'Haiku', 'SONNET', ' sonnet', 'sonnet ', 'haiku\n', 'sonnet[1m]', 'some-model-1', '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'haiku,sonnet']) {
      expect(switchesFor(model, 'beginner')).toBe(SWITCHES_OFF)
      expect(switchesFor(model, 'beginner', SPLIT)).toBe(SWITCHES_OFF)
    }
    // A table whose two rows differ: each model its own row, never the other's.
    expect(switchesFor('haiku', 'beginner', SPLIT)).toBe(SPLIT.haiku)
    expect(switchesFor('sonnet', 'beginner', SPLIT)).toBe(SPLIT.sonnet)
    // The level the features were measured at alone (D17).
    for (const level of ['intermediate', 'advanced', '', 'Beginner', ' beginner']) {
      for (const model of ['haiku', 'sonnet']) expect(switchesFor(model, level, SPLIT)).toBe(SWITCHES_OFF)
    }
  })

  test('SWITCHES_OFF is 1.9.0\'s constants, every one off and frozen; the constants stay off', () => {
    expect(SWITCHES_OFF).toEqual({ isRuleDrill: false, isRuleWide: false, rungNewStep: Infinity, rungChangedStep: Infinity, workedAfterTimes: Infinity, isBaseAsked: false, isThinkAsked: false })
    expect([IS_RULE_DRILL, RUNG_NEW_STEP, RUNG_CHANGED_STEP, WORKED_AFTER_TIMES, IS_BASE_ASKED, IS_THINK_ASKED]).toEqual([false, Infinity, Infinity, Infinity, false, false])
    expect(Object.isFrozen(SWITCHES_OFF)).toBe(true)
    expect(Object.isFrozen(MODEL_SWITCHES)).toBe(true)
    expect(Object.isFrozen(MODEL_SWITCHES.haiku)).toBe(true)
    expect(Object.isFrozen(MODEL_SWITCHES.sonnet)).toBe(true)
    expect(Object.isFrozen(SWITCH_KINDS)).toBe(true)
    expect(Object.isFrozen(FEATURE_NAMES)).toBe(true)
    // A write has no effect (in a module, a throw).
    expect(() => {
      ;(MODEL_SWITCHES.sonnet as Switches).workedAfterTimes = 2
    }).toThrow()
    expect(MODEL_SWITCHES.sonnet.workedAfterTimes).toBe(Infinity)
    expect(() => {
      ;(SWITCHES_OFF as Switches).isBaseAsked = true
    }).toThrow()
    expect(SWITCHES_OFF.isBaseAsked).toBe(false)
  })

  test('SWITCH_KINDS, SWITCHES_OFF, FEATURE_NAMES, SWITCH_NAMES and each row hold the same keys; each off value of its kind', () => {
    const keys = switchKeys()
    expect(keys).toEqual(['isRuleDrill', 'isRuleWide', 'rungNewStep', 'rungChangedStep', 'workedAfterTimes', 'isBaseAsked', 'isThinkAsked'])
    for (const table of [SWITCHES_OFF, FEATURE_NAMES, SWITCH_NAMES, MODEL_SWITCHES.haiku, MODEL_SWITCHES.sonnet, ON, ON_VALUES]) expect(Object.keys(table)).toEqual(keys)
    for (const key of keys) {
      if (SWITCH_KINDS[key] === 'flag') expect(SWITCHES_OFF[key]).toBe(false)
      else expect(SWITCHES_OFF[key]).toBe(Infinity)
    }
    expect(Object.keys(MODEL_SWITCHES)).toEqual(['haiku', 'sonnet'])
  })

  test('MODEL_SWITCHES is the table it must ship, cell by cell; each cell off or an on value its feature may ship', () => {
    for (const model of ['haiku', 'sonnet'] as const) {
      expect({ ...MODEL_SWITCHES[model] }).toEqual(SHIPPED[model])
      for (const key of switchKeys()) expect([SWITCHES_OFF[key], ...ON_VALUES[key]]).toContain(MODEL_SWITCHES[model][key])
    }
  })

  test('a row with the team rule\'s practice on has its wider labelling on too (1.10.0 G6, D18): the shipped table and the one it must ship', () => {
    for (const table of [MODEL_SWITCHES, SHIPPED]) {
      for (const model of ['haiku', 'sonnet'] as const) if (table[model].isRuleDrill) expect(table[model].isRuleWide).toBe(true)
    }
    // isRuleWide is the second key, right after isRuleDrill, named as the design names it.
    expect(switchKeys().indexOf('isRuleWide')).toBe(switchKeys().indexOf('isRuleDrill') + 1)
    expect(SWITCH_KINDS.isRuleWide).toBe('flag')
    expect([FEATURE_NAMES.isRuleWide, SWITCH_NAMES.isRuleWide]).toEqual(['팀 규칙 표지 넓힘', '팀 규칙 표지 넓힘'])
  })

  test('hasOn and routeOn read every key of the table: each switch on alone is named, in the table\'s order, once', () => {
    expect(hasOn(SWITCHES_OFF)).toBe(false)
    expect(routeOn(SWITCHES_OFF)).toEqual([])
    for (const key of switchKeys()) {
      const one = { ...SWITCHES_OFF, [key]: ON[key] }
      expect(hasOn(one)).toBe(true)
      expect(routeOn(one)).toEqual([FEATURE_NAMES[key]])
    }
    expect(routeOn(ON)).toEqual(['팀 규칙 연습', '팀 규칙 표지 넓힘', '처음 보는 코드', '비슷한 코드', '풀이 보고 풀기', '바탕 개념', '생각해 보기'])
    // A step on at 0 is on; a flag's off value is false alone.
    expect(hasOn({ ...SWITCHES_OFF, rungChangedStep: 0 })).toBe(true)
  })

  test('overlaySwitches lays a harness\'s row over: each key of its kind, a step whole from 0 or null for off; nothing else', () => {
    for (const key of switchKeys()) {
      expect(overlaySwitches(SWITCHES_OFF, { [key]: ON[key] })).toEqual({ ...SWITCHES_OFF, [key]: ON[key] })
      expect(overlaySwitches(ON, { [key]: SWITCH_KINDS[key] === 'flag' ? false : null })).toEqual({ ...ON, [key]: SWITCHES_OFF[key] })
      // Values of the wrong kind leave it as it was.
      const wrong = SWITCH_KINDS[key] === 'flag' ? [1, 'true', null, 0] : [-1, 1.5, '2', true, Number.NaN, Infinity]
      for (const value of wrong) expect(overlaySwitches(SWITCHES_OFF, { [key]: value })).toEqual(SWITCHES_OFF)
    }
    expect(overlaySwitches(SWITCHES_OFF, { rungNewStep: 0 })).toEqual({ ...SWITCHES_OFF, rungNewStep: 0 })
    for (const raw of [undefined, null, 2, 'workedAfterTimes', [{ workedAfterTimes: 2 }], { isWorked: true }]) expect(overlaySwitches(SWITCHES_OFF, raw)).toEqual(SWITCHES_OFF)
    // Its own keys alone: an inherited one, or a __proto__ JSON gives, is none.
    expect(overlaySwitches(SWITCHES_OFF, Object.create({ workedAfterTimes: 2 }))).toEqual(SWITCHES_OFF)
    expect(overlaySwitches(SWITCHES_OFF, JSON.parse('{"__proto__": {"workedAfterTimes": 2}}'))).toEqual(SWITCHES_OFF)
    // A copy: the row laid over is never written.
    const base = { ...SWITCHES_OFF }
    overlaySwitches(base, { workedAfterTimes: 2 })
    expect(base).toEqual(SWITCHES_OFF)
    expect([harnessStepOf(null), harnessStepOf(0), harnessStepOf(3), harnessStepOf(-1), harnessStepOf(2.5), harnessStepOf('3')]).toEqual([Infinity, 0, 3, undefined, undefined, undefined])
  })

  test('switchedNames names what a harness turned against the route\'s own switches, never a cell the route turns on', () => {
    expect(switchedNames(SWITCHES_OFF, SWITCHES_OFF)).toEqual([])
    // A route that turns two on, run as it is: nothing named.
    expect(switchedNames(SPLIT.sonnet, SPLIT.sonnet)).toEqual([])
    // A harness turning one of them off and another on.
    expect(switchedNames({ ...SPLIT.sonnet, workedAfterTimes: Infinity, rungChangedStep: 2 }, SPLIT.sonnet)).toEqual(['비슷한 코드 단계 2', '풀이 보고 풀기 오답 수 끔'])
    expect(switchedNames(ON, SWITCHES_OFF)).toEqual(['팀 규칙 연습 켬', '팀 규칙 표지 넓힘 켬', '처음 보는 코드 단계 4', '비슷한 코드 단계 2', '풀이 보고 풀기 오답 수 2', '바탕 개념 켬', '생각해 보기 켬'])
    expect(switchedNames(SWITCHES_OFF, ON)).toEqual(['팀 규칙 연습 끔', '팀 규칙 표지 넓힘 끔', '처음 보는 코드 단계 끔', '비슷한 코드 단계 끔', '풀이 보고 풀기 오답 수 끔', '바탕 개념 끔', '생각해 보기 끔'])
  })

  test('routeOf: none while no row turns anything on, whatever the model, level or alias; else unmeasured, level, the alias, then the features on', () => {
    for (const model of ['haiku', 'sonnet', 'some-model-1', '']) {
      for (const level of ['beginner', 'advanced']) {
        for (const remap of ['kept', 'remapped', 'unreadable'] as const) expect(routeOf(model, level, remap, SWITCHES_OFF, ALL_OFF)).toBeUndefined()
      }
    }
    expect(routeOf('haiku', 'beginner', 'kept', SWITCHES_OFF)).toBeUndefined()
    expect(routeOf('sonnet', 'beginner', 'kept', SPLIT.sonnet, SPLIT)).toEqual({ on: ['풀이 보고 풀기', '바탕 개념'] })
    expect(routeOf('haiku', 'beginner', 'kept', SPLIT.haiku, SPLIT)).toEqual({ on: ['생각해 보기'] })
    // One row on is enough to name every window's route, the other model's none.
    const one = { haiku: SWITCHES_OFF, sonnet: SPLIT.sonnet }
    expect(routeOf('haiku', 'beginner', 'kept', SWITCHES_OFF, one)).toEqual({ on: [] })
    // In order: the model string, then the level, then the alias.
    expect(routeOf('opus', 'advanced', 'unreadable', SWITCHES_OFF, SPLIT)).toBe('unmeasured')
    expect(routeOf('some-model-1', 'beginner', 'kept', SWITCHES_OFF, SPLIT)).toBe('unmeasured')
    expect(routeOf('sonnet', 'advanced', 'remapped', SWITCHES_OFF, SPLIT)).toBe('level')
    expect(routeOf('sonnet', 'beginner', 'remapped', SWITCHES_OFF, SPLIT)).toBe('remapped')
    expect(routeOf('sonnet', 'beginner', 'unreadable', SWITCHES_OFF, SPLIT)).toBe('unreadable')
    // The features named are the released ones, never a harness's.
    expect(routeOf('sonnet', 'beginner', 'kept', SWITCHES_OFF, SPLIT)).toEqual({ on: [] })
  })

  /** /learn 진단 with every setting as a test world has it, but the model, the lock and the route. */
  const diagOf = (model: string, route: DiagInput['settings']['route'], locked: readonly string[] = []) =>
    diagText({
      now: Date.UTC(2026, 9, 3, 1),
      version: '1.10.0',
      engine: '2.1.312',
      surfaces: ['terminal'],
      pane: 'closed',
      isPaneFocused: false,
      apps: [],
      settings: {
        isAutoNote: true,
        model,
        dailyAutoNotes: 0,
        level: 'beginner',
        isAutoSave: true,
        isAutoOpen: true,
        saveDir: 'default',
        excluded: 0,
        locked,
        ...(route !== undefined ? { route } : {}),
      },
      today: { notes: 0, calls: 0 },
      faults: [],
    })
  const lineOf = (text: string) => text.split('\n').find(line => line.startsWith('- 설정: '))

  test('/learn 진단\'s settings line: with no route 1.9.0\'s bytes; each route right after the model, before the lock', () => {
    expect(lineOf(diagOf('haiku', undefined))).toBe('- 설정: 자동 노트 켬 · haiku · 하루 한도 없음 · 일지 켬(기본 폴더) · 패널 자동 열기 켬 · 설명 수준 beginner')
    expect(lineOf(diagOf('sonnet', undefined, ['model']))).toBe('- 설정: 자동 노트 켬 · sonnet(관리자 잠금) · 하루 한도 없음 · 일지 켬(기본 폴더) · 패널 자동 열기 켬 · 설명 수준 beginner')
    const cases: [string, DiagInput['settings']['route'], string][] = [
      ['sonnet', { on: ['풀이 보고 풀기', '바탕 개념'] }, 'sonnet(이 모델에서 켠 기능: 풀이 보고 풀기 · 바탕 개념)'],
      ['haiku', { on: [] }, 'haiku(이 모델에서 켠 기능 없음)'],
      ['some-model-1', 'unmeasured', 'some-model-1(잰 적 없는 모델 · 모델별 기능 모두 끔)'],
      ['?', 'unmeasured', '?(잰 적 없는 모델 · 모델별 기능 모두 끔)'],
      ['haiku', 'level', 'haiku(설명 수준이 beginner가 아님 · 모델별 기능 모두 끔)'],
      ['sonnet', 'remapped', 'sonnet(별칭을 다른 모델로 바꿔 둠 · 모델별 기능 모두 끔)'],
      ['sonnet', 'unreadable', 'sonnet(별칭을 확인하지 못함 · 모델별 기능 모두 끔)'],
    ]
    for (const [model, route, said] of cases) {
      expect(lineOf(diagOf(model, route))).toBe(`- 설정: 자동 노트 켬 · ${said} · 하루 한도 없음 · 일지 켬(기본 폴더) · 패널 자동 열기 켬 · 설명 수준 beginner`)
      expect(lineOf(diagOf(model, route, ['model']))).toBe(`- 설정: 자동 노트 켬 · ${said}(관리자 잠금) · 하루 한도 없음 · 일지 켬(기본 폴더) · 패널 자동 열기 켬 · 설명 수준 beginner`)
    }
    expect(routeText(undefined)).toBe('')
    // Only the route's line changes: the rest of the text is the same with a route or none.
    const plain = diagOf('sonnet', undefined).split('\n')
    const routed = diagOf('sonnet', { on: ['바탕 개념'] }).split('\n')
    expect(routed.filter(line => !line.startsWith('- 설정: '))).toEqual(plain.filter(line => !line.startsWith('- 설정: ')))
  })
})
