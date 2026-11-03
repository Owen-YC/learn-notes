// The tests of build 1.10.0: a window as a person runs it (the kit, flowkit.ts).
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
  JOURNAL,
  NOW,
  PANE_PROPS,
  QUOTED_NOTE,
  ROUTE_DAY,
  ROUTE_RIGHT,
  type Reply,
  THINK_CHANGES,
  WORKED_BOTH,
  type World,
  finish,
  learn,
  metInCode,
  mineKey,
  ownSteps,
  pane,
  routeCalls,
  routeDay,
  routeQ,
  routeStore,
  start,
  thinkAsked,
  thinkStore,
  turn,
  withFiller,
  world,
} from './flowkit'


describe('1.10.0: 모델별 갈래 (G7): the model setting and level pick the switches, once at session start', () => {
  /** A value that turns each switch on, as a measured route may (a step a whole number). */
  const ON: Readonly<Record<keyof Switches, boolean | number>> = { isRuleDrill: true, isRuleWide: true, rungNewStep: 4, rungChangedStep: 2, workedAfterTimes: 2, workedPlainAfterTimes: 2, isBaseAsked: true, isThinkAsked: true }
  /** Each switch as /learn 진단's harness list names it on (ON). */
  const ON_NAMED: Readonly<Record<keyof Switches, string>> = {
    isRuleDrill: '팀 규칙 연습 켬',
    isRuleWide: '팀 규칙 표지 넓힘 켬',
    rungNewStep: '처음 보는 코드 단계 4',
    rungChangedStep: '비슷한 코드 단계 2',
    workedAfterTimes: '풀이 보고 풀기 오답 수 (코드 개념) 2',
    workedPlainAfterTimes: '풀이 보고 풀기 오답 수 (코드 없는 개념) 2',
    isBaseAsked: '바탕 개념 켬',
    isThinkAsked: '생각해 보기 켬',
  }
  /** Every switch off in a harness's flat keys: a flag false, a step null. */
  const FLAT_OFF = Object.fromEntries(switchKeys().map(key => [key, SWITCH_KINDS[key] === 'flag' ? false : null]))
  const HAIKU_ALIAS = 'ANTHROPIC_DEFAULT_HAIKU_MODEL'
  const SONNET_ALIAS = 'ANTHROPIC_DEFAULT_SONNET_MODEL'
  const SETTINGS_TAIL = ' · 하루 한도 없음 · 일지 켬(기본 폴더) · 패널 자동 열기 켬 · 설명 수준'
  const settingsLine = (diag: string) => diag.split('\n').find(line => line.startsWith('- 설정: '))
  /** The settings line's model and what follows it (a route), up to the daily limit. */
  const modelSaid = (diag: string) => /^- 설정: 자동 노트 켬 · (.*?) · 하루 한도 /.exec(settingsLine(diag) ?? '')?.[1]
  /** A reply whose question is a worked example (a worked rung's mark kept only when the reply holds one). */
  const routeWorked = (n: number) =>
    [`T${n}: 예측`, `Q${n}: 풀이: \`let n = 0; const up = () => ++n; up()\` 뒤 n은 1입니다.`, '이제 풀어 보세요: `let c = 10; const add = () => ++c; add()` 뒤 c는?', `H${n}: 바깥 c`, `A${n}: 11`].join('\n')
  const versionLine = (diag: string) => diag.split('\n').find(line => line.startsWith('- 버전: '))
  const itemsOf = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
  /**
   * `store` with 클로저 met in no file (routeStore met it in counter.js, no note holding it): a worked example of the plain
   * branch (1.10.0 G1), where one seen in a file whose code is found no more is none (its 4/7 review). Only for a test
   * that turns worked examples on: the shipped route's requests (route19.ts) send no concept's files.
   */
  const metInNoFile = (store: Map<string, unknown>) => {
    ;(store.get('concepts') as Record<string, { files: string[] }>)[conceptKey('클로저')]!.files = []
    return store
  }

  /** Each read of an alias variable, caught above the world's env; `refused` names one whose read is refused. Register before `world`. */
  function aliasReads(on: On, refused?: string): string[] {
    const reads: string[] = []
    on('env.get', { name: /^ANTHROPIC_DEFAULT_/ }, (_$, e, next) => {
      reads.push(e.name)
      return e.name === refused ? { deny: 'refused by policy' } : next(e)
    })
    return reads
  }
  /**
   * The switches of the providers under which Claude Code turns `haiku` and `sonnet` to models no sample was run with,
   * no alias variable set (2.1.317, 1.10.0 cross-review), in the order remapState reads them.
   */
  const PROVIDERS = ['CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_USE_FOUNDRY', 'CLAUDE_CODE_USE_ANTHROPIC_AWS', 'CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD', 'CLAUDE_CODE_USE_MANTLE'] as const
  /** Each read of a provider's switch (the gateway's too), caught above the world's env; `refused` names one whose read is refused. Register before `world`. */
  function providerReads(on: On, refused?: string): string[] {
    const reads: string[] = []
    on('env.get', { name: /^CLAUDE_CODE_USE_/ }, (_$, e, next) => {
      reads.push(e.name)
      return e.name === refused ? { deny: 'refused by policy' } : next(e)
    })
    return reads
  }
  /** A settings' `modelOverrides` turning one id to another (fakes: no model id in tests). */
  const OVERRIDES = { modelOverrides: { 'some-model-1': 'override-target-x' } }
  /** What a window whose route read its alias at session start reads by then: once there, once again for each /learn 진단 while the alias is kept (recheckRemap). */
  const readTwice = (name: string) => [name, name]

  // The table as shipped turns 팀 규칙 표지 넓힘 on in both rows (1.10.0 G6, docs/qa/견본.md '모델별 결정'). This day's
  // note brings no rule's name in, so a window still sends what 1.9.0 sent, any level, either model; at beginner it
  // reads its alias variable and /learn 진단 names the route, at another level every switch is off and none is read.
  // Every switch off at beginner (1.9.0's route) is the flat-keys test below.
  for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
    for (const model of ['haiku', 'sonnet'] as const) {
      test(`as shipped, ${model} at ${level}: 1.9.0's requests to the byte with the setting as each call's model; /learn 진단 as 1.9.0 said it but its route; ${level === 'beginner' ? 'its alias, the providers\' switches and the settings read' : 'no alias or settings read'}`, { options: { model, level } }, async ($, on) => {
        const reads = aliasReads(on)
        const flags = providerReads(on)
        const { calls, diag, w } = await routeDay($, on)
        expect(calls).toEqual(ROUTE19_CALLS[level].map(call => ({ model, ...call })))
        const route = level === 'beginner' ? '(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)' : '(설명 수준이 beginner가 아님 · 모델별 기능 모두 끔)'
        const said = ROUTE19_DIAG[`${model}/${level}`]!
        expect(diag).toBe(said.replace(`- 설정: 자동 노트 켬 · ${model} · `, `- 설정: 자동 노트 켬 · ${model}${route} · `))
        expect(settingsLine(diag)).toBe(`- 설정: 자동 노트 켬 · ${model}${route}${SETTINGS_TAIL} ${level}`)
        expect(versionLine(diag)).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
        expect(reads).toEqual(level === 'beginner' ? readTwice(model === 'haiku' ? HAIKU_ALIAS : SONNET_ALIAS) : [])
        expect(flags).toEqual(level === 'beginner' ? [...PROVIDERS, ...PROVIDERS] : [])
        expect(w.settingsReads).toBe(level === 'beginner' ? 2 : 0)
      })
    }
  }

  for (const model of ['haiku', 'sonnet'] as const) {
    test(`${model} with a harness turning every switch off by its flat keys: 1.9.0's requests whatever the table holds`, { options: { model } }, async ($, on) => {
      const { calls } = await routeDay($, on, w => {
        w.harness = { ...FLAT_OFF }
      })
      expect(calls).toEqual(ROUTE19_CALLS.beginner.map(call => ({ model, ...call })))
    })
  }

  test('a route with every switch on (a harness\'s models row) reaches every path the day takes: the note, r, the quiz and its cap', { options: { model: 'sonnet' } }, async ($, on) => {
    const reads = aliasReads(on)
    const { calls, diag } = await routeDay($, on, w => {
      w.harness = { models: { sonnet: { ...ON } } }
      // 클로저 met in counter.js by a note: the code branch's worked example, its base asked before it (1.10.0 G4).
      metInCode(w.store, '클로저')
    })
    const golden = ROUTE19_CALLS.beginner
    // The note's prompt is 1.9.0's whatever the switches (1.10.0 G6), and this one says nothing of a team rule: no
    // call of its own for it. r asks for 생각해 보기; the quiz asks a base and a worked example (4600 from 1.10.0 G2,
    // D12: one budget for every quiz with a trace or code of its own; 3600 in 1.9.0).
    expect(calls[0]).toEqual({ model: 'sonnet', ...golden[0]! })
    expect(calls.some(call => call.system === RULE_DRILL_SYSTEM)).toBe(false)
    expect(calls[1]!.prompt).not.toBe(golden[1]!.prompt)
    expect(calls.filter(call => call.maxTokens === 4600)).toHaveLength(1)
    expect(calls.filter(call => call.maxTokens === 3600)).toHaveLength(0)
    expect(calls.every(call => call.model === 'sonnet' && call.effort === 'low')).toBe(true)
    expect(reads).toEqual(readTwice(SONNET_ALIAS))
    // The route's own table turns 팀 규칙 표지 넓힘 on (1.10.0 G6): the harness's row is named as a test switch where
    // it differs from that table, each one; a cell the shipped row has on already is none.
    expect(settingsLine(diag)).toBe(`- 설정: 자동 노트 켬 · sonnet(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)${SETTINGS_TAIL} beginner`)
    expect(versionLine(diag)).toBe(`- 버전: learn-notes 1.7.0 · Claude Code 2.1.296 · 시험 스위치: ${switchKeys().filter(key => ON[key] !== MODEL_SWITCHES.sonnet[key]).map(key => ON_NAMED[key]).join(' · ')}`)
    expect(versionLine(diag)).not.toContain(ON_NAMED.isRuleWide)
  })

  test('haiku runs its own row: a harness turning sonnet\'s on leaves haiku its shipped row (1.9.0\'s requests this day), its own alias read, /learn 진단 naming its own route', { options: { model: 'haiku' } }, async ($, on) => {
    const reads = aliasReads(on)
    const { calls, diag } = await routeDay($, on, w => {
      w.harness = { models: { sonnet: { ...ON } } }
    })
    expect(calls).toEqual(ROUTE19_CALLS.beginner.map(call => ({ model: 'haiku', ...call })))
    expect(reads).toEqual(readTwice(HAIKU_ALIAS))
    expect(settingsLine(diag)).toBe(`- 설정: 자동 노트 켬 · haiku(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)${SETTINGS_TAIL} beginner`)
    expect(versionLine(diag)).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
  })

  for (const level of ['intermediate', 'advanced'] as const) {
    test(`at ${level} every switch is off for both models, whatever the rows hold: 1.9.0's requests, no alias or provider's switch read, /learn 진단 says why`, { options: { model: 'sonnet', level } }, async ($, on) => {
      const reads = aliasReads(on)
      const flags = providerReads(on)
      const { calls, diag } = await routeDay($, on, w => {
        w.harness = { models: { haiku: { ...ON }, sonnet: { ...ON } } }
      })
      expect(calls).toEqual(ROUTE19_CALLS[level].map(call => ({ model: 'sonnet', ...call })))
      expect(reads).toEqual([])
      expect(flags).toEqual([])
      expect(settingsLine(diag)).toBe(`- 설정: 자동 노트 켬 · sonnet(설명 수준이 beginner가 아님 · 모델별 기능 모두 끔)${SETTINGS_TAIL} ${level}`)
      expect(versionLine(diag)).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
    })
  }

  test('an alias whose variable the environment sets: every switch off, 1.9.0\'s requests, no provider\'s switch read; /learn 진단 says the variable is set, with no value', { options: { model: 'sonnet' } }, async ($, on) => {
    const reads = aliasReads(on)
    const flags = providerReads(on)
    const { calls, diag } = await routeDay(
      $,
      on,
      w => {
        w.harness = { models: { sonnet: { ...ON } } }
      },
      { [SONNET_ALIAS]: 'pinned-model-x' },
    )
    expect(calls).toEqual(ROUTE19_CALLS.beginner.map(call => ({ model: 'sonnet', ...call })))
    // Read once at session start: an alias not kept is not read again (recheckRemap).
    expect(reads).toEqual([SONNET_ALIAS])
    expect(flags).toEqual([])
    expect(settingsLine(diag)).toBe(`- 설정: 자동 노트 켬 · sonnet(별칭 변수를 둠 · 모델별 기능 모두 끔)${SETTINGS_TAIL} beginner`)
    expect(versionLine(diag)).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
    expect(diag).not.toContain('pinned-model-x')
  })

  test('an alias whose variable cannot be read: every switch off, 1.9.0\'s requests; /learn 진단 says it could not be checked', { options: { model: 'sonnet' } }, async ($, on) => {
    const reads = aliasReads(on, SONNET_ALIAS)
    const { calls, diag } = await routeDay($, on, w => {
      w.harness = { models: { sonnet: { ...ON } } }
    })
    expect(calls).toEqual(ROUTE19_CALLS.beginner.map(call => ({ model: 'sonnet', ...call })))
    expect(reads).toEqual([SONNET_ALIAS])
    expect(settingsLine(diag)).toBe(`- 설정: 자동 노트 켬 · sonnet(별칭을 확인하지 못함 · 모델별 기능 모두 끔)${SETTINGS_TAIL} beginner`)
  })

  for (const [what, env] of [
    ['blank', { [SONNET_ALIAS]: '' }],
    ['spaces alone', { [SONNET_ALIAS]: '   ' }],
    ['haiku\'s alone (another alias)', { [HAIKU_ALIAS]: 'pinned-model-x' }],
  ] as const) {
    test(`sonnet's alias variable ${what}: the route stands`, { options: { model: 'sonnet' } }, async ($, on) => {
      const reads = aliasReads(on)
      const { diag } = await routeDay(
        $,
        on,
        w => {
          w.harness = { models: { sonnet: { workedAfterTimes: 2 } } }
        },
        env,
      )
      expect(reads).toEqual(readTwice(SONNET_ALIAS))
      expect(settingsLine(diag)).toBe(`- 설정: 자동 노트 켬 · sonnet(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)${SETTINGS_TAIL} beginner`)
      expect(versionLine(diag)).toContain('· 시험 스위치: 풀이 보고 풀기 오답 수 (코드 개념) 2')
    })
  }

  for (const [env, isKept] of [
    [{ [SONNET_ALIAS]: 'pinned-model-x' }, true],
    [{ [HAIKU_ALIAS]: 'pinned-model-x' }, false],
  ] as const) {
    test(`haiku reads its own alias variable alone: ${isKept ? 'sonnet\'s set, the route stands' : 'its own set, every switch off'}`, { options: { model: 'haiku' } }, async ($, on) => {
      const reads = aliasReads(on)
      const { diag } = await routeDay(
        $,
        on,
        w => {
          w.harness = { models: { haiku: { workedAfterTimes: 2 } } }
        },
        env,
      )
      expect(reads).toEqual(isKept ? readTwice(HAIKU_ALIAS) : [HAIKU_ALIAS])
      expect(settingsLine(diag)).toBe(`- 설정: 자동 노트 켬 · haiku(${isKept ? '이 모델에서 켠 기능: 팀 규칙 표지 넓힘' : '별칭 변수를 둠 · 모델별 기능 모두 끔'})${SETTINGS_TAIL} beginner`)
      expect(versionLine(diag)?.includes('시험 스위치')).toBe(isKept)
    })
  }

  // A provider's switch, no alias variable set (1.10.0 cross-review): Claude Code 2.1.317 turns `haiku` and `sonnet` to
  // models no sample was run with under Bedrock, Vertex, Foundry and the others, so every switch is off there as for an
  // alias variable set (R1–R4: never carried from one model to another). Each window as shipped, no harness.
  for (const [k, name] of PROVIDERS.entries()) {
    const model = k % 2 === 0 ? 'haiku' : 'sonnet'
    test(`${name} set, no alias variable (${model} as shipped): every switch off; /learn 진단 says a provider's switch is set, with no value`, { options: { model } }, async ($, on) => {
      const reads = aliasReads(on)
      const flags = providerReads(on)
      world(on, 'ok', null, true, new Map(), { [name]: 'provider-on-x' })
      await start($)
      const diag = (await learn($, '진단')).text ?? ''
      expect(modelSaid(diag)).toBe(`${model}(제공자 변수를 둠 · 모델별 기능 모두 끔)`)
      expect(versionLine(diag)).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
      expect(diag).not.toContain('provider-on-x')
      expect(reads).toEqual([model === 'haiku' ? HAIKU_ALIAS : SONNET_ALIAS])
      expect(flags).toEqual([...PROVIDERS])
    })
  }

  for (const [what, env, isKept] of [
    ['blank', { CLAUDE_CODE_USE_BEDROCK: '' }, true],
    ['spaces alone', { CLAUDE_CODE_USE_VERTEX: '   ' }, true],
    ["the gateway's alone (its models are Claude Code's own)", { CLAUDE_CODE_USE_GATEWAY: '1' }, true],
    ['"0" (any value not blank is set, as for an alias variable)', { CLAUDE_CODE_USE_BEDROCK: '0' }, false],
  ] as const) {
    test(`a provider's switch ${what}: ${isKept ? 'the route stands' : 'every switch off'}; the gateway's never read`, { options: { model: 'sonnet' } }, async ($, on) => {
      const flags = providerReads(on)
      world(on, 'ok', null, true, new Map(), env)
      await start($)
      const diag = (await learn($, '진단')).text ?? ''
      expect(modelSaid(diag)).toBe(isKept ? 'sonnet(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)' : 'sonnet(제공자 변수를 둠 · 모델별 기능 모두 끔)')
      expect(flags).toEqual(isKept ? [...PROVIDERS, ...PROVIDERS] : [...PROVIDERS])
    })
  }

  test('a provider\'s switch that cannot be read: every switch off, the rest unread; /learn 진단 says the alias could not be checked', { options: { model: 'haiku' } }, async ($, on) => {
    const flags = providerReads(on, 'CLAUDE_CODE_USE_FOUNDRY')
    world(on)
    await start($)
    const diag = (await learn($, '진단')).text ?? ''
    expect(modelSaid(diag)).toBe('haiku(별칭을 확인하지 못함 · 모델별 기능 모두 끔)')
    expect(flags).toEqual(PROVIDERS.slice(0, 3))
  })

  // The settings' `modelOverrides` (1.10.0 cross-review, round 3): Claude Code 2.1.317 turns `haiku` and `sonnet` to the
  // ids it names with no variable set, whichever settings hold it (`--settings`, the user's, the project's; checked on
  // real windows, docs/qa/견본.md), so every switch is off there as for an alias variable set (R1–R4). Read after the
  // variables, only where the route turns a switch on; looked at for being empty alone, never kept, shown or sent.
  for (const model of ['haiku', 'sonnet'] as const) {
    test(`${model} as shipped with modelOverrides in the settings, no variable set: every switch off, 1.9.0's requests; /learn 진단 says the setting is there, with neither id`, { options: { model } }, async ($, on) => {
      const reads = aliasReads(on)
      const flags = providerReads(on)
      const { calls, diag, w } = await routeDay($, on, w => {
        w.settings = { model: 'sonnet', ...OVERRIDES }
      })
      expect(calls).toEqual(ROUTE19_CALLS.beginner.map(call => ({ model, ...call })))
      expect(modelSaid(diag)).toBe(`${model}(modelOverrides 설정을 둠 · 모델별 기능 모두 끔)`)
      expect(versionLine(diag)).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
      expect(diag).not.toContain('some-model-1')
      expect(diag).not.toContain('override-target-x')
      // Read once at session start, after the variables: a route not kept is not read again (recheckRemap).
      expect(reads).toEqual([model === 'haiku' ? HAIKU_ALIAS : SONNET_ALIAS])
      expect(flags).toEqual([...PROVIDERS])
      expect(w.settingsReads).toBe(1)
    })
  }

  for (const [what, settings, isKept] of [
    ['absent (other keys alone)', { model: 'sonnet', env: { SOME_OTHER: '1' } }, true],
    ['an empty object', { modelOverrides: {} }, true],
    ['null', { modelOverrides: null }, true],
    ['one entry whose target is blank (looked at for being empty alone)', { modelOverrides: { 'some-model-1': '' } }, false],
    ['not an object', { modelOverrides: 'override-target-x' }, false],
    ['an array', { modelOverrides: ['override-target-x'] }, false],
  ] as const) {
    test(`modelOverrides ${what}: ${isKept ? 'the route stands, read again by /learn 진단' : 'every switch off'}`, { options: { model: 'sonnet' } }, async ($, on) => {
      const w = world(on)
      w.settings = settings
      await start($)
      const diag = (await learn($, '진단')).text ?? ''
      expect(modelSaid(diag)).toBe(isKept ? 'sonnet(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)' : 'sonnet(modelOverrides 설정을 둠 · 모델별 기능 모두 끔)')
      expect(diag).not.toContain('override-target-x')
      expect(w.settingsReads).toBe(isKept ? 2 : 1)
    })
  }

  test('settings that cannot be read: every switch off; /learn 진단 says the alias could not be checked', { options: { model: 'haiku' } }, async ($, on) => {
    const w = world(on)
    w.settingsFails = true
    await start($)
    const diag = (await learn($, '진단')).text ?? ''
    expect(modelSaid(diag)).toBe('haiku(별칭을 확인하지 못함 · 모델별 기능 모두 끔)')
    expect(w.settingsReads).toBe(1)
  })

  test('an alias variable or a provider\'s switch set: modelOverrides is not read (the first reason found is the one said)', { options: { model: 'sonnet' } }, async ($, on) => {
    const w = world(on, 'ok', null, true, new Map(), { CLAUDE_CODE_USE_BEDROCK: '1' })
    w.settings = { ...OVERRIDES }
    await start($)
    expect(modelSaid((await learn($, '진단')).text ?? '')).toBe('sonnet(제공자 변수를 둠 · 모델별 기능 모두 끔)')
    expect(w.settingsReads).toBe(0)
  })

  // A window whose route turns nothing on reads no settings, modelOverrides there or not: another level, both rows
  // turned off by a harness (1.9.0's reads to the byte; a model string with no row is routeOf's 'unmeasured', route.test.ts).
  for (const [what, options, harness] of [
    ['at intermediate', { model: 'haiku', level: 'intermediate' }, undefined],
    ['at advanced', { model: 'sonnet', level: 'advanced' }, undefined],
    ['with both rows turned all off', { model: 'sonnet', level: 'beginner' }, { models: { haiku: { ...FLAT_OFF }, sonnet: { ...FLAT_OFF } } }],
  ] as const) {
    test(`${what}, modelOverrides in the settings: no settings read, 1.9.0's requests`, { options }, async ($, on) => {
      const { calls, w } = await routeDay($, on, w => {
        w.settings = { ...OVERRIDES }
        w.harness = harness
      })
      expect(calls).toEqual(ROUTE19_CALLS[options.level].map(call => ({ model: options.model, ...call })))
      expect(w.settingsReads).toBe(0)
    })
  }

  test('modelOverrides set in the session (sonnet as shipped): /learn 진단 says every switch off from then on, and so it stays once the setting goes', { options: { model: 'sonnet' } }, async ($, on) => {
    const w = world(on)
    await start($)
    expect(modelSaid((await learn($, '진단')).text ?? '')).toBe('sonnet(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)')
    w.settings = { ...OVERRIDES }
    const diag = (await learn($, '진단')).text ?? ''
    expect(modelSaid(diag)).toBe('sonnet(modelOverrides 설정을 둠 · 모델별 기능 모두 끔)')
    expect(diag).not.toContain('override-target-x')
    w.settings = {}
    expect(modelSaid((await learn($, '진단')).text ?? '')).toBe('sonnet(modelOverrides 설정을 둠 · 모델별 기능 모두 끔)')
    // Read at session start and by the first two /learn 진단; none once the route is off.
    expect(w.settingsReads).toBe(3)
  })

  // The settings' env changed in a session turns the alias with it, and this window's environment too, with no reload
  // (Claude Code 2.1.317, 1.10.0 cross-review): the route session start found kept is read again by /learn 진단 (and
  // where the switch acts, writeNote); one no longer kept is off from then on, never on again.
  for (const [what, name, said] of [
    ['its alias variable', HAIKU_ALIAS, '별칭 변수를 둠 · 모델별 기능 모두 끔'],
    ["a provider's switch", 'CLAUDE_CODE_USE_BEDROCK', '제공자 변수를 둠 · 모델별 기능 모두 끔'],
  ] as const) {
    test(`${what} set in the session (haiku as shipped): /learn 진단 says every switch off from then on, and so it stays once the variable goes`, { options: { model: 'haiku' } }, async ($, on) => {
      const reads = aliasReads(on)
      const flags = providerReads(on)
      const now: Record<string, string> = {}
      on('env.get', { name }, (_$, e, next) => (now[e.name] !== undefined ? { value: now[e.name] } : next(e)))
      world(on)
      await start($)
      expect(modelSaid((await learn($, '진단')).text ?? '')).toBe('haiku(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)')
      now[name] = 'set-in-session-x'
      const diag = (await learn($, '진단')).text ?? ''
      expect(modelSaid(diag)).toBe(`haiku(${said})`)
      expect(versionLine(diag)).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
      expect(diag).not.toContain('set-in-session-x')
      delete now[name]
      expect(modelSaid((await learn($, '진단')).text ?? '')).toBe(`haiku(${said})`)
      // Read at session start and by the first two /learn 진단; none once the route is off.
      expect(reads).toEqual([HAIKU_ALIAS, HAIKU_ALIAS, HAIKU_ALIAS])
      expect(flags).toEqual(name === HAIKU_ALIAS ? [...PROVIDERS, ...PROVIDERS] : [...PROVIDERS, ...PROVIDERS, ...PROVIDERS])
    })
  }

  // A row with no cell on reads no variable (D24, the budget line), whatever is set: a harness turning both rows back
  // off, as a later table may, gives 1.9.0's requests and /learn 진단 as 1.9.0 said it, no route named (routeOf over the
  // table the window runs); the window's own row alone turned off reads none either (1.10.0 cross-review).
  for (const model of ['haiku', 'sonnet'] as const) {
    test(`${model} with both models rows turned all off: 1.9.0's requests and /learn 진단 (no route, its test switch named), no alias, provider's switch or settings read though all three are set`, { options: { model } }, async ($, on) => {
      const reads = aliasReads(on)
      const flags = providerReads(on)
      const { calls, diag, w } = await routeDay(
        $,
        on,
        w => {
          w.harness = { models: { haiku: { ...FLAT_OFF }, sonnet: { ...FLAT_OFF } } }
          w.settings = { ...OVERRIDES }
        },
        { [model === 'haiku' ? HAIKU_ALIAS : SONNET_ALIAS]: 'pinned-model-x', CLAUDE_CODE_USE_BEDROCK: '1' },
      )
      expect(calls).toEqual(ROUTE19_CALLS.beginner.map(call => ({ model, ...call })))
      expect(diag).toBe(ROUTE19_DIAG[`${model}/beginner`]!.replace('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296', '- 버전: learn-notes 1.7.0 · Claude Code 2.1.296 · 시험 스위치: 팀 규칙 표지 넓힘 끔'))
      expect(settingsLine(diag)).toBe(`- 설정: 자동 노트 켬 · ${model}${SETTINGS_TAIL} beginner`)
      expect(reads).toEqual([])
      expect(flags).toEqual([])
      expect(w.settingsReads).toBe(0)
    })
  }

  test('sonnet with its own models row turned all off (haiku\'s as shipped): 1.9.0\'s requests, no alias read even with the alias set', { options: { model: 'sonnet' } }, async ($, on) => {
    const reads = aliasReads(on)
    const flags = providerReads(on)
    const { calls } = await routeDay(
      $,
      on,
      w => {
        w.harness = { models: { sonnet: { ...FLAT_OFF } } }
      },
      { [SONNET_ALIAS]: 'pinned-model-x' },
    )
    expect(calls).toEqual(ROUTE19_CALLS.beginner.map(call => ({ model: 'sonnet', ...call })))
    expect(reads).toEqual([])
    expect(flags).toEqual([])
  })

  // Each switch on its own through a harness's models row: the sonnet window runs it, the haiku window does not (the
  // table's every key, one more included). Both rows as shipped turn 팀 규칙 표지 넓힘 on (1.10.0 G6), so each window
  // reads its own alias variable, and a cell its shipped row has on already is no test switch (G7 1/7 follow-up).
  for (const key of switchKeys()) {
    for (const model of ['haiku', 'sonnet'] as const) {
      const isSwitched = model === 'sonnet' && ON[key] !== MODEL_SWITCHES.sonnet[key]
      test(`models.sonnet turning ${key} on: ${model === 'sonnet' ? `run by the sonnet window, its alias read${isSwitched ? '' : ', no test switch (its shipped row has it on)'}` : 'not run by the haiku window, which reads its own alias for its own row'}`, { options: { model } }, async ($, on) => {
        const reads = aliasReads(on)
        const w = world(on)
        w.harness = { models: { sonnet: { [key]: ON[key] } } }
        await start($)
        const diag = (await learn($, '진단')).text ?? ''
        expect(reads).toEqual(readTwice(model === 'sonnet' ? SONNET_ALIAS : HAIKU_ALIAS))
        expect(versionLine(diag)).toBe(`- 버전: learn-notes 1.7.0 · Claude Code 2.1.296${isSwitched ? ` · 시험 스위치: ${ON_NAMED[key]}` : ''}`)
        expect(modelSaid(diag)).toBe(`${model}(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)`)
      })
    }
  }

  for (const [what, models] of [
    ['an array', [{ workedAfterTimes: 2 }]],
    ['null', null],
    ['a number', 2],
    ['a row under an unknown model', { opus: { workedAfterTimes: 2 } }],
    ['a row under __proto__', JSON.parse('{"__proto__": {"workedAfterTimes": 2}}')],
    ['a __proto__ key in the row', { sonnet: JSON.parse('{"__proto__": {"workedAfterTimes": 2}}') }],
    ['unknown keys and values of the wrong kind', { sonnet: { isWorked: true, workedAfterTimes: -1, rungNewStep: 1.5, rungChangedStep: 'two', isBaseAsked: 'yes', isThinkAsked: 1, isRuleDrill: null } }],
  ] as const) {
    test(`harness.models as ${what} turns nothing more on: the shipped row alone, its alias read, no test switch`, { options: { model: 'sonnet' } }, async ($, on) => {
      const reads = aliasReads(on)
      const w = world(on)
      w.harness = { models }
      await start($)
      const diag = (await learn($, '진단')).text ?? ''
      expect(reads).toEqual(readTwice(SONNET_ALIAS))
      expect(versionLine(diag)).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
      expect(modelSaid(diag)).toBe('sonnet(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)')
    })
  }

  for (const [flat, named] of [
    [3, '풀이 보고 풀기 오답 수 (코드 개념) 3'],
    [null, undefined],
  ] as const) {
    test(`a flat key goes over the models row: workedAfterTimes ${flat} over the row's 2`, { options: { model: 'sonnet' } }, async ($, on) => {
      const w = world(on)
      w.harness = { models: { sonnet: { workedAfterTimes: 2 } }, workedAfterTimes: flat }
      await start($)
      const diag = (await learn($, '진단')).text ?? ''
      expect(versionLine(diag)).toBe(`- 버전: learn-notes 1.7.0 · Claude Code 2.1.296${named === undefined ? '' : ` · 시험 스위치: ${named}`}`)
    })
  }

  for (const model of ['haiku', 'sonnet'] as const) {
    test(`missed twice running, a worked example in the sonnet window alone (models.sonnet); ${model} ${model === 'sonnet' ? 'asks it' : 'asks again (다시 도전) as 1.9.0'}`, { options: { model } }, async ($, on) => {
      const store = metInNoFile(routeStore())
      const w = world(on, 'ok', null, true, store)
      // 클로저 met in no code: both branches in the row (1.10.0 G1).
      w.harness = { models: { sonnet: { ...WORKED_BOTH } } }
      await start($)
      w.answer = [model === 'sonnet' ? routeWorked(1) : routeQ(1), routeQ(2), routeQ(3)].join('\n')
      await learn($, '퀴즈 새로')
      expect(itemsOf(store).map(one => [one.name, one.rung, one.isRetry])[0]).toEqual(model === 'sonnet' ? ['클로저', 'worked', undefined] : ['클로저', undefined, true])
    })
  }

  // The line under a grade that keeps a slip with a base (slipNotice's own, 1.9.0 F5) promises the base first only
  // where the route asks bases: the pane and the conversation each hand it this route's switches (1/7 검토). A try again
  // missed another way keeps a new slip, missed once, so only a route at one miss running says it there (a harness's
  // step 1): at every value a route may ship (2, or off) a second miss running is a question asked again missed again,
  // whose line the callers make (the worked example's tests above and in 1.9.0's 바탕 개념).
  const SLIP_WHAT = '안쪽 함수가 값을 복사해 둔다고 봄'
  /**
   * 클로저 met after 변수 범위, its words naming it (a grade's base candidate), in counter.js by a note that wrote it
   * (metInCode: a worked example of the code branch, 1.10.0 G1, the one a base is asked for, G4); 변수 범위 in
   * counter.js; 클로저's slip kept once two days ago (asked again: 다시 도전).
   */
  function slipStore(): Map<string, unknown> {
    const rows: Record<string, { step: number; ago: number; first: number }> = { 클로저: { step: 1, ago: 3, first: 30 }, '변수 범위': { step: 3, ago: 5, first: 60 } }
    const concepts = Object.fromEntries(
      Object.entries(rows).map(([name, one]) => [
        conceptKey(name),
        { name, count: 2, firstAt: NOW - one.first * ROUTE_DAY, lastAt: NOW - one.first * ROUTE_DAY, blurb: name === '클로저' ? '클로저 설명 — 변수 범위 위에 섭니다' : `${name} 설명`, files: name === '클로저' ? [] : ['counter.js'], step: one.step, reviewedAt: NOW - one.ago * ROUTE_DAY },
      ]),
    )
    const slips = { [conceptKey('클로저')]: { what: '함수가 끝나면 바깥 변수도 사라진다고 봄', type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * ROUTE_DAY, times: 1 } }
    return metInCode(new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)], ['slips', slips]]), '클로저')
  }
  for (const [model, row, tail] of [
    ['sonnet', { workedAfterTimes: 1, workedPlainAfterTimes: 1, isBaseAsked: true }, WORKED_BASE_NEXT],
    ['sonnet', { workedAfterTimes: 1, workedPlainAfterTimes: 1 }, WORKED_NEXT],
    ['haiku', { workedAfterTimes: 1, workedPlainAfterTimes: 1, isBaseAsked: true }, '다음 퀴즈에서 다른 코드로 다시 묻습니다'],
  ] as const) {
    test(`a try again missed another way, models.sonnet ${JSON.stringify(row)}, in the ${model} window: the pane and the conversation both say "${tail}"`, { options: { model } }, async ($, on) => {
      const isBase = model === 'sonnet' && 'isBaseAsked' in row
      const store = slipStore()
      const w = world(on, 'ok', null, true, store)
      w.harness = { models: { sonnet: { ...row } } }
      await start($)
      // Asked again: the reply holds no worked example, so none is kept.
      w.answer = [routeQ(1), routeQ(2)].join('\n')
      await learn($, '퀴즈 새로')
      expect(itemsOf(store).map(one => [one.name, one.isRetry])[0]).toEqual(['클로저', true])
      w.answer = ['판정: 틀림', '피드백: 아닙니다.', `헷갈린 점: ${SLIP_WHAT}`, ...(isBase ? ['바탕 점검: 1 틀림', '바탕 근거: `let a = 1; let b = a; b = 2` → 2 → 1', '바탕: 1'] : []), '유형: 값과 참조'].join('\n')
      const said = (await learn($, '퀴즈 1 안쪽 함수가 값을 복사해요')).text ?? ''
      expect(w.models.at(-1)!.includes('## 학습자가 전에 배운 개념\n1. 변수 범위\n')).toBe(isBase)
      const slip = (store.get('slips') as Record<string, Record<string, unknown>>)[conceptKey('클로저')]!
      expect(slip).toMatchObject({ what: SLIP_WHAT, type: 'reference', times: 1, at: NOW })
      expect(slip.base).toBe(isBase ? conceptKey('변수 범위') : undefined)
      const line = `헷갈린 점: ${SLIP_WHAT} · ${tail}`
      expect(said).toContain(`\n${line}\n`)
      const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
      await ui.press({ key: 'view-quiz' })
      expect(await ui.find({ type: 'Text', text: line })).toBeDefined()
      await ui.unmount()
      expect(itemsOf(store)[0]!.slipBase).toBe(isBase ? conceptKey('변수 범위') : undefined)
      // A window of another route (every switch off) grades the next question: the quiz it writes back keeps the base
      // the grade picked, the slip its own.
      w.harness = undefined
      await start($)
      w.answer = ROUTE_RIGHT
      await learn($, '퀴즈 2 답 2')
      expect(itemsOf(store)[1]!.result).toBe('right')
      expect(itemsOf(store)[0]!.slipBase).toBe(isBase ? conceptKey('변수 범위') : undefined)
      expect((store.get('slips') as Record<string, Record<string, unknown>>)[conceptKey('클로저')]!.base).toBe(isBase ? conceptKey('변수 범위') : undefined)
    })
  }

  test('decided at session start before any call: a reload takes up a cut note after the alias is read; another start runs the route its harness gives', { options: { model: 'sonnet' } }, async ($, on) => {
    const order: string[] = []
    // While set, the alias's read takes a moment on the clock (1/7 검토): the note a reload takes up waits a moment
    // too, so one put on the clock before the route is decided would go out while the read is still under way.
    let isSlowRead = false
    let w: World | undefined
    on('env.get', { name: /^ANTHROPIC_DEFAULT_/ }, async (_$, e, next) => {
      if (isSlowRead && w) await w.clock.advance(10)
      order.push('alias')
      return next(e)
    })
    on('model.complete', { prompt: /[\s\S]/ }, (_$, e, next) => {
      order.push('model')
      return next(e)
    })
    w = world(on)
    w.harness = { models: { sonnet: { workedAfterTimes: 2 } } }
    await start($)
    expect(order).toEqual(['alias'])
    w.replies = ['cut']
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    expect(order).toEqual(['alias', 'model'])
    // The reload: the route decided again (the alias read again) before the note it cut is taken up, the clock moving
    // on while the alias is read.
    order.length = 0
    isSlowRead = true
    await start($)
    expect(order).toEqual(['alias'])
    await w.clock.advance(60_000)
    expect(order).toEqual(['alias', 'model'])
    isSlowRead = false
    expect(versionLine((await learn($, '진단')).text ?? '')).toContain('· 시험 스위치: 풀이 보고 풀기 오답 수 (코드 개념) 2')
    // A start with no harness: the shipped route (팀 규칙 표지 넓힘 on, 1.10.0 G6), its alias read, no test switch.
    w.harness = undefined
    order.length = 0
    await start($)
    expect(order).toEqual(['alias'])
    const diag = (await learn($, '진단')).text ?? ''
    expect(versionLine(diag)).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
    expect(modelSaid(diag)).toBe('sonnet(이 모델에서 켠 기능: 팀 규칙 표지 넓힘)')
  })

  for (const isOnFirst of [true, false]) {
    test(`a store another route wrote (${isOnFirst ? 'on, then off' : 'off, then on'}): its quiz kept as written, rung and base and slip; the next quiz by this route`, { options: { model: 'sonnet' } }, async ($, on) => {
      // Two more concepts due, so the slip's base (변수 범위) is no pick of its own and goes right before the worked
      // example, in the next quiz too once one of them is gone over. 클로저 met in counter.js by a note: the code
      // branch's, the one a base is asked before (1.10.0 G4).
      const store = metInCode(routeStore(), '클로저')
      const concepts = {
        ...(store.get('concepts') as Record<string, unknown>),
        [conceptKey('배열')]: { name: '배열', count: 2, firstAt: NOW - 60 * ROUTE_DAY, lastAt: NOW - 60 * ROUTE_DAY, blurb: '배열 설명', files: ['list.js'], step: 1, reviewedAt: NOW - 3 * ROUTE_DAY },
        [conceptKey('객체')]: { name: '객체', count: 2, firstAt: NOW - 60 * ROUTE_DAY, lastAt: NOW - 60 * ROUTE_DAY, blurb: '객체 설명', files: ['list.js'], step: 1, reviewedAt: NOW - 3 * ROUTE_DAY },
      }
      store.set('concepts', concepts)
      store.set('steps', ownSteps(concepts as never))
      const w = world(on, 'ok', null, true, store)
      const onRow = { models: { sonnet: { ...ON } } }
      w.harness = isOnFirst ? onRow : undefined
      await start($)
      w.answer = [routeQ(1), isOnFirst ? routeWorked(2) : routeQ(2), routeQ(3)].join('\n')
      await learn($, '퀴즈 새로')
      const written = itemsOf(store).map(one => [one.name, one.rung, one.isBase, one.isRetry])
      expect(written.slice(0, 2)).toEqual(
        isOnFirst
          ? [
              ['변수 범위', undefined, true, undefined],
              ['클로저', 'worked', undefined, undefined],
            ]
          : [
              ['클로저', undefined, undefined, true],
              ['for...of 반복문', undefined, undefined, undefined],
            ],
      )
      // The other route's window: the quiz it finds is the one written, its slip's base kept.
      w.harness = isOnFirst ? undefined : onRow
      await start($)
      expect((await learn($, '퀴즈')).text).toContain('1.')
      expect(itemsOf(store).map(one => [one.name, one.rung, one.isBase, one.isRetry])).toEqual(written)
      expect((store.get('slips') as Record<string, { base?: string }>)[conceptKey('클로저')]!.base).toBe(conceptKey('변수 범위'))
      // It grades the last question (1/7 검토): the quiz written back keeps the others as written.
      w.answer = ROUTE_RIGHT
      await learn($, '퀴즈 3 답 3')
      expect(itemsOf(store)[2]!.result).toBe('right')
      expect(itemsOf(store).map(one => [one.name, one.rung, one.isBase, one.isRetry])).toEqual(written)
      expect((store.get('slips') as Record<string, { base?: string }>)[conceptKey('클로저')]!.base).toBe(conceptKey('변수 범위'))
      // Its next quiz is its own route's.
      await w.clock.advance(60_000)
      w.answer = [routeQ(1), isOnFirst ? routeQ(2) : routeWorked(2), routeQ(3)].join('\n')
      await learn($, '퀴즈 새로')
      const next = itemsOf(store).map(one => [one.name, one.rung, one.isBase, one.isRetry])
      expect(next.some(one => one[1] === 'worked' || one[2] === true)).toBe(!isOnFirst)
      expect(next.some(one => one[0] === '클로저' && one[3] === true)).toBe(isOnFirst)
    })
  }

  // The rungs and the team rule's practice a route writes (1/7 검토): with every switch on, a review quiz asks a concept
  // due at its fifth step in code never seen, or one at its second in its code changed, and a note may hold the team
  // rule's practice. A window of the other route reads them as 1.9.0 does and writes them back as written; what it
  // writes itself is its own route's.
  const ROUTE_RULES = ['# 팀', '', '## 규칙', '- API 호출은 `fetch`를 바로 쓰지 말고 `fetcher`를 쓴다', ''].join('\n')
  const ROUTE_API = ['export async function getUser(id) {', '  const res = await fetch(`/u/${id}`)', '  return res.json()', '}', ''].join('\n')
  const ROUTE_RULE_NOTE = [
    '### 한 줄 요약',
    '사용자 정보를 가져오는 함수를 만들었습니다',
    '### 무엇이 바뀌었나',
    '- 전: 없음',
    '- 후: `getUser(1)`이 1번 사용자 정보를 돌려줍니다',
    '### 왜 이렇게 바꿨을까',
    '화면에서 사용자 정보를 보이려고 만들었습니다.',
    '팀 규칙과 다를 수 있음: API 호출은 `fetcher`로 하라는 규칙과 달리 `fetch`를 바로 씁니다',
    '### 배울 개념',
    '- **async/await**: 응답을 기다렸다 씁니다 — `return res.json()`',
    '### 직접 해 보기',
    '- 할 일 (팀 규칙): API 호출을 팀 규칙대로 fetcher로 바꿔 보세요',
    '- 고칠 줄: `` const res = await fetch(`/u/${id}`) ``',
    '- 확인: `getUser(1)` → 같은 사용자 정보가 나옵니다',
    '- 예시 답: `` const res = await fetcher(`/u/${id}`) ``',
  ].join('\n')
  const ROUTE_RULE_ASK = '- 할 일 (팀 규칙): 그 규칙대로 고치는 일 한 문장'
  /** A question in code of its own for question `n`, with the trace of an R line where code never seen is asked. */
  const routeCode = (n: number, isTraced: boolean) =>
    [`T${n}: 예측`, `Q${n}: 아래 코드는 무엇을 찍을까요?`, '```ts', 'const xs = [3, 4]', 'let s = 0', 'for (const x of xs) s += x', 'console.log(s)', '```', `H${n}: 하나씩 더해 보세요`, ...(isTraced ? [`R${n}: s는 3, 다시 7이 됩니다`] : []), `A${n}: 7`].join('\n')
  type RouteNote = { id: string; text: string }
  const notesOf = (store: Map<string, unknown>) => (store.get('history') as Record<string, { notes: RouteNote[] }>)['/proj']!.notes
  for (const [rung, step, label] of [
    ['new', 4, '처음 보는 코드'],
    ['changed', 2, '비슷한 코드'],
  ] as const) {
    for (const isOnFirst of [true, false]) {
      test(`a store another route wrote (${isOnFirst ? 'on, then off' : 'off, then on'}): a question in ${rung === 'new' ? 'code never seen' : 'its code changed'} and a note with the team rule's practice kept as written; what it writes, this route's`, { options: { model: 'sonnet' } }, async ($, on) => {
        // Three concepts due a month on, met in a.ts: one at the rung's step, two at their first (asked in their code).
        const steps: Record<string, number> = { 'for...of 반복문': step, 배열: 1, 객체: 1 }
        const concepts = Object.fromEntries(
          Object.entries(steps).map(([name, at]) => [
            conceptKey(name),
            { name, count: 2, firstAt: NOW - 200 * ROUTE_DAY, lastAt: NOW - 200 * ROUTE_DAY, blurb: `${name} 설명`, files: [], step: at, reviewedAt: NOW - 31 * ROUTE_DAY },
          ]),
        )
        const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)]])
        const w = world(on, 'ok', null, true, store)
        w.files.set('/proj/.claude/learn-notes.md', ROUTE_RULES)
        const onRow = { models: { sonnet: { ...ON } } }
        const isTraced = rung === 'new'
        const quizReply = () => [routeCode(1, isTraced), routeCode(2, isTraced), routeCode(3, isTraced)].join('\n')
        const asked = (store: Map<string, unknown>) => itemsOf(store).map(one => [one.name, one.rung, one.kind, one.question])
        const drillShown = async () => {
          const ui = await pane($)
          const button = await ui.find({ type: 'Button', key: 'note-drill' })
          await ui.unmount()
          return button !== undefined
        }

        // The first window: its concepts' note, the note with the rule's practice, a review quiz.
        w.harness = isOnFirst ? onRow : undefined
        await start($)
        w.answer = CONCEPT_NOTE(Object.keys(steps))
        await turn($, () => $.tool.call(EDIT_A))
        await finish(w)
        w.answer = ROUTE_RULE_NOTE
        const before = w.models.length
        await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'a1', file_path: '/proj/src/api.js', content: ROUTE_API }), 't2')
        await finish(w)
        // The note's prompt asks for no rule practice either way (1.10.0 G6); on, the rule's practice is a call of its own.
        expect(w.models[before]).not.toContain(ROUTE_RULE_ASK)
        expect(w.systems.slice(before)).toEqual(isOnFirst ? [SYSTEM, RULE_DRILL_SYSTEM] : [SYSTEM])
        const practiced = notesOf(store).at(-1)!
        expect(practiced.text).toBe(ROUTE_RULE_NOTE)
        expect(await drillShown()).toBe(isOnFirst)
        w.answer = quizReply()
        await learn($, '퀴즈 새로')
        expect(w.models.at(-1)!.includes(`\n   칸: ${label}`)).toBe(isOnFirst)
        const written = asked(store)
        expect(written.map(one => one[0]).sort()).toEqual(Object.keys(steps).sort())
        for (const one of written) expect(one[1]).toBe(isOnFirst && one[0] === 'for...of 반복문' ? rung : 'mine')
        expect((await learn($, '퀴즈')).text?.includes(`(${label}) `)).toBe(isOnFirst)

        // The other route's window: the quiz and the note as written, each shown as 1.9.0 shows it there.
        w.harness = isOnFirst ? undefined : onRow
        await start($)
        expect(asked(store)).toEqual(written)
        expect((await learn($, '퀴즈')).text?.includes(`(${label}) `)).toBe(isOnFirst)
        expect(await drillShown()).toBe(!isOnFirst)
        // It grades a question of another concept: the quiz written back as it was, that one graded.
        const plain = itemsOf(store).findIndex(one => one.name === '배열')
        w.answer = ROUTE_RIGHT
        await learn($, `퀴즈 ${plain + 1} 7`)
        expect(itemsOf(store)[plain]!.result).toBe('right')
        expect(asked(store)).toEqual(written)
        // It writes a note of its own (its route's prompt); the note with the practice kept as written.
        w.answer = CONCEPT_NOTE(['배열'])
        await turn($, () => $.tool.call({ ...EDIT_A, tool_use_id: 'u2' }), 't3')
        await finish(w)
        expect(w.models.at(-1)).not.toContain(ROUTE_RULE_ASK)
        expect(w.systems.at(-1)).toBe(SYSTEM)
        expect(notesOf(store).find(one => one.id === practiced.id)?.text).toBe(ROUTE_RULE_NOTE)
        // Its next quiz is its own route's.
        await w.clock.advance(60_000)
        w.answer = quizReply()
        await learn($, '퀴즈 새로')
        expect(w.models.at(-1)!.includes(`\n   칸: ${label}`)).toBe(!isOnFirst)
        expect(itemsOf(store).find(one => one.name === 'for...of 반복문')?.rung).toBe(isOnFirst ? 'mine' : rung)
      })
    }
  }
})

describe('1.10.0: 팀 규칙 연습 (G6): the note\'s prompt 1.9.0\'s, a team rule\'s practice by a call of its own, a wider label, both per model', () => {
  const TEAM_MD = INPUT_RULE19.teamMd
  const TEAM = parseTeamFile(TEAM_MD)
  const NAMES = ruleNamesOf(TEAM.rules)
  const SAID = OUTPUT_RULE19.drill.rule!
  const RULE_LINE = `팀 규칙과 다를 수 있음: ${SAID}`
  const RULE_TEXT = INPUT_RULE19.note.text
  /** The note up to its practice, and its rule practice: the four lines the rule practice's call writes. */
  const HEAD = RULE_TEXT.slice(0, RULE_TEXT.indexOf('\n### 직접 해 보기')).split('\n')
  const RULE_LINES = RULE_TEXT.split('\n').slice(HEAD.length + 1)
  const REPLY = RULE_LINES.join('\n')
  const TASK = RULE_LINES[0]!.slice('- 할 일 (팀 규칙): '.length)
  const LINE = 'const res = await fetch(`/users/${id}`)'
  const EXAMPLE = 'const res = await apiRequest(`/users/${id}`)'
  /** The note as its own call writes it: a practice of its concept. */
  const CONCEPT_TASK = '응답을 기다리지 않고 Promise 그대로 돌려주게 바꿔 보세요'
  const OWN = [...HEAD, '### 직접 해 보기', `- 할 일: ${CONCEPT_TASK}`, '- 고칠 줄: `return res.json()`', '- 확인: `loadUser(1)` → Promise가 나옵니다', '- 예시 답: `return res`'].join('\n')
  /** Its own practice bringing the rule's name in, unmarked (what isRuleWide marks), and as marked. */
  const PLAIN_TASK = '서버 요청을 인증이 붙는 함수로 바꿔 보세요'
  const PLAIN = [...HEAD, '### 직접 해 보기', `- 할 일: ${PLAIN_TASK}`, ...RULE_LINES.slice(1)].join('\n')
  const PLAIN_KEPT = [...HEAD, '### 직접 해 보기', `- 할 일 (팀 규칙): ${PLAIN_TASK}`, ...RULE_LINES.slice(1)].join('\n')
  const USER_JS = ["import { apiRequest } from './api/apiRequest.js'", '', 'export async function loadUser(id) {', `  ${LINE}`, '  return res.json()', '}', ''].join('\n')
  const WRITE_USER = { tool: 'Write', tool_use_id: 'w1', file_path: '/proj/src/user.js', content: USER_JS } as const
  const ON = { isRuleDrill: true, isRuleWide: true }
  const OFF = { isRuleDrill: false, isRuleWide: false }
  const BUSY: Reply = { status: 529, error: 'overloaded' }
  const notesIn = (store: Map<string, unknown>) => (store.get('history') as Record<string, { notes: LearnNote[] }>)['/proj']!.notes
  const usageOf = (store: Map<string, unknown>) => Object.values(store.get('usage') as Record<string, { calls: number; auto: number }>)[0]
  const escape = (text: string) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const SHOWN = escape(`### 직접 해 보기 · user.js\n${RULE_LINES[0]}\n${RULE_LINES[2]}`)

  /**
   * A world with the team file of the rules, its harness `harness`, a turn's end writing the note for a new user.js:
   * the answered calls' texts `texts`, the calls' replies `replies` first, the environment `env`. Its calls, store, and
   * the note as stored.
   */
  async function wrote($: Engine, on: On, harness: Record<string, unknown> | undefined, texts: string[], replies: Reply[] = [], env: Record<string, string> = {}, settings?: Record<string, unknown>) {
    const calls = routeCalls(on)
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store, env)
    w.files.set('/proj/.claude/learn-notes.md', TEAM_MD)
    w.harness = harness
    w.settings = settings
    await start($)
    w.texts = [...texts]
    w.replies = [...replies]
    await turn($, () => $.tool.call(WRITE_USER))
    await finish(w)
    return { w, calls, store, note: () => notesIn(store).at(-1)! }
  }

  test('on: a note with a "다를 수 있음" line in a repository with rules has a second call, the rule practice\'s own (system, prompt, cap, time limit, effort, the setting\'s model); its four lines are the practice; the pane shows its task and check; the journal keeps it', async ($, on) => {
    const { w, calls, note } = await wrote($, on, ON, [OWN, REPLY])
    expect(calls.map(call => call.system)).toEqual([SYSTEM, RULE_DRILL_SYSTEM])
    expect(calls[0]!.prompt).not.toContain('(팀 규칙)')
    expect(calls[0]!.maxTokens).toBe(3500)
    expect(calls[1]).toEqual({ model: 'haiku', effort: 'low', system: RULE_DRILL_SYSTEM, prompt: ruleDrillPrompt(screenNote(note()), TEAM.rules, SAID), maxTokens: RULE_DRILL_TOKENS, timeoutMs: 90_000 })
    // The code the note's own call was sent, the team's rules and the note's line.
    expect(calls[1]!.prompt).toContain(`+  ${LINE}\n`)
    expect(calls[1]!.prompt).toContain(`\n## 노트가 짚은 줄\n${RULE_LINE}\n`)
    expect(calls[1]!.prompt).not.toContain('세션 토큰')
    expect(note()).toMatchObject({ status: 'ready', text: RULE_TEXT })
    const ui = await pane($)
    expect(await ui.find({ type: 'Markdown', text: SHOWN })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /고칠 줄|예시 답|apiRequest\(`/ })).toBeUndefined()
    expect((await ui.find({ type: 'Button', key: 'note-drill' }))?.props).toMatchObject({ hotkey: 't', label: '직접 해 보기' })
    await ui.press({ key: 'note-drill' })
    expect((await ui.find({ type: 'Input', key: `drill-${note().id}` }))?.props).toMatchObject({ value: LINE })
    await ui.input({ key: `drill-${note().id}`, text: '모르겠어요' })
    expect(await ui.find({ type: 'Markdown', text: `**힌트:** ${RULE_LINE} · 이 줄에서 바꿀 곳 한 군데를 찾아보세요` })).toBeDefined()
    await ui.unmount()
    expect(w.models).toHaveLength(2)
    const journal = w.journal().at(-1)!.text
    expect(journal).toContain(`- 할 일 (팀 규칙): ${TASK}`)
    expect(journal).toContain(`- 예시 답: \`\` ${EXAMPLE} \`\``)
  })

  test('on, a note a turn\'s end wrote by itself: the usage record counts two calls and one automatic note; with dailyAutoNotes 2, two such notes go before the limit', { options: { dailyAutoNotes: 2 } }, async ($, on) => {
    const { w, store } = await wrote($, on, ON, [OWN, REPLY])
    expect(usageOf(store)).toMatchObject({ calls: 2, auto: 1 })
    w.texts = [OWN, REPLY]
    await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
    await finish(w)
    expect(usageOf(store)).toMatchObject({ calls: 4, auto: 2 })
    expect(notesIn(store).map(one => [one.status, one.text])).toEqual([['ready', RULE_TEXT], ['ready', RULE_TEXT]])
    expect(w.toasts.filter(text => text.includes('한도'))).toEqual([])
    await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w3' }), 't3')
    await finish(w)
    expect(w.models).toHaveLength(4)
    expect(w.toasts.filter(text => text.includes('한도'))).toEqual(['학습 노트: 오늘 자동 노트 한도(2개)에 닿았습니다 · 패널에서 w를 누르면 씁니다'])
  })

  for (const [label, text] of [
    ['no "다를 수 있음" line', OWN.replace(`${RULE_LINE}\n`, '')],
    ['a 팀 규칙: line alone', OWN.replace(RULE_LINE, '팀 규칙: 서버 요청은 apiRequest로 합니다')],
    ['a "다를 수 있음" line that says none', OWN.replace(SAID, '없음')],
  ] as const) {
    test(`on: a note with ${label} has one call, its text the off build's to the byte for the same reply`, async ($, on) => {
      const { w, calls, store } = await wrote($, on, ON, [text])
      expect(calls.map(call => call.system)).toEqual([SYSTEM])
      w.harness = OFF
      await start($)
      w.texts = [text]
      await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
      await finish(w)
      expect(calls.map(call => call.system)).toEqual([SYSTEM, SYSTEM])
      expect(notesIn(store).map(one => one.text)).toEqual([text, text])
    })
  }

  test('on, a team file with terms alone or none: one call, a "다를 수 있음" line or not', async ($, on) => {
    const calls = routeCalls(on)
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    w.harness = ON
    w.files.set('/proj/.claude/learn-notes.md', '## 용어\n- **세션 토큰**: 로그인한 사용자를 알아보는 값입니다\n')
    await start($)
    w.texts = [OWN]
    await turn($, () => $.tool.call(WRITE_USER))
    await finish(w)
    w.files.delete('/proj/.claude/learn-notes.md')
    await start($)
    w.texts = [OWN]
    await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
    await finish(w)
    expect(calls.map(call => call.system)).toEqual([SYSTEM, SYSTEM])
    expect(notesIn(store).map(one => one.text)).toEqual([OWN, OWN])
  })

  const FAILS: [string, string[], Reply[], number][] = [
    ['a server error', [OWN], ['ok', { status: 500, error: 'api_error' }], 0],
    ['its own time limit', [OWN], ['ok', 'timeout'], 90_000],
    ['an empty reply', [OWN, ''], [], 0],
    ['"할 일: 없음"', [OWN, '- 할 일: 없음'], [], 0],
    ['a reply withRuleDrill does not take (the example the line itself)', [OWN, REPLY.replace(EXAMPLE, LINE)], [], 0],
    ['a reply with no check', [OWN, RULE_LINES.filter(line => !line.startsWith('- 확인')).join('\n')], [], 0],
  ]
  for (const [label, texts, replies, wait] of FAILS) {
    test(`on, the rule practice's call failing (${label}): the note is ready with its own practice, the text the off build keeps`, async ($, on) => {
      const { w, calls, note } = await wrote($, on, ON, texts, replies)
      if (wait > 0) {
        await w.clock.advance(wait)
        await w.clock.settle()
      }
      expect(calls.map(call => call.system)).toEqual([SYSTEM, RULE_DRILL_SYSTEM])
      expect(note()).toMatchObject({ status: 'ready', text: OWN })
      expect(w.journal().at(-1)!.text).toContain(`- 할 일: ${CONCEPT_TASK}`)
      const ui = await pane($)
      expect((await ui.find({ type: 'Button', key: 'note-drill' }))?.props).toMatchObject({ hotkey: 't' })
      expect(await ui.find({ type: 'Markdown', text: escape(`- 할 일: ${CONCEPT_TASK}`) })).toBeDefined()
      await ui.unmount()
      // A failed call is a fault of the note's area, though the note was written.
      if (replies.length > 0) expect((await learn($, '진단')).text).toContain('노트 쓰기 · ')
    })
  }

  test('on, the rule practice\'s call cut short (a reload): the note stays being written, nothing journaled; the next load takes it up through both calls', async ($, on) => {
    const { w, calls, note } = await wrote($, on, ON, [OWN, OWN, REPLY], ['ok', 'cut'])
    await w.clock.advance(60_000)
    expect(calls.map(call => call.system)).toEqual([SYSTEM, RULE_DRILL_SYSTEM])
    expect(note().status).toBe('writing')
    expect(w.journal()).toHaveLength(0)
    await start($)
    await w.clock.advance(5)
    await w.clock.settle()
    expect(calls.map(call => call.system)).toEqual([SYSTEM, RULE_DRILL_SYSTEM, SYSTEM, RULE_DRILL_SYSTEM])
    expect(note()).toMatchObject({ status: 'ready', text: RULE_TEXT })
    expect(w.journal()).toHaveLength(1)
  })

  test('on: w writing the note again, and a turn\'s end note\'s one try again after a busy server, go through both calls', async ($, on) => {
    const { w, calls, store, note } = await wrote($, on, ON, [OWN, REPLY])
    const ui = await pane($)
    w.texts = [OWN, REPLY.replace(TASK, `${TASK}.`)]
    await ui.press({ key: 'write' })
    await w.clock.settle()
    await ui.unmount()
    expect(calls.map(call => call.system)).toEqual([SYSTEM, RULE_DRILL_SYSTEM, SYSTEM, RULE_DRILL_SYSTEM])
    expect(note().text).toBe(RULE_TEXT.replace(TASK, `${TASK}.`))
    expect(usageOf(store)).toMatchObject({ calls: 4, auto: 1 })
    // A busy server on a turn's end: the try again half a minute on, then its rule practice.
    w.texts = [OWN, REPLY]
    w.replies = [BUSY, 'ok', 'ok']
    await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
    await finish(w)
    expect(calls.map(call => call.system)).toHaveLength(5)
    await w.clock.advance(35_000)
    await w.clock.settle()
    expect(calls.map(call => call.system).slice(4)).toEqual([SYSTEM, SYSTEM, RULE_DRILL_SYSTEM])
    expect(note()).toMatchObject({ status: 'ready', text: RULE_TEXT })
    expect(usageOf(store)).toMatchObject({ calls: 7, auto: 2 })
  })

  test('on: a file the team file leaves out after the note was written (## 빼기) reaches neither call when w writes it again: the rule practice\'s prompt is the screened note\'s, the file named, its code never sent (2/7 검토)', async ($, on) => {
    const PRICING = { tool: 'Write', tool_use_id: 'k1', file_path: '/proj/src/pricing.js', content: 'export const MARGIN = 0.4231 // INTERNALONLY\n' } as const
    const calls = routeCalls(on)
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    w.files.set('/proj/.claude/learn-notes.md', TEAM_MD)
    w.harness = ON
    await start($)
    w.texts = [OWN, REPLY]
    await turn($, async () => {
      await $.tool.call(WRITE_USER)
      await $.tool.call(PRICING)
    })
    await finish(w)
    // Not left out yet: both calls carry it, as 1.9.0's note call did.
    expect(calls.map(call => call.system)).toEqual([SYSTEM, RULE_DRILL_SYSTEM])
    expect(calls[0]!.prompt).toContain('INTERNALONLY')
    expect(calls[1]!.prompt).toContain('INTERNALONLY')
    w.files.set('/proj/.claude/learn-notes.md', `${TEAM_MD}\n## 빼기\n- src/pricing.js\n`)
    const ui = await pane($)
    w.texts = [OWN, REPLY]
    await ui.press({ key: 'write' })
    await w.clock.settle()
    await ui.unmount()
    expect(calls.map(call => call.system)).toEqual([SYSTEM, RULE_DRILL_SYSTEM, SYSTEM, RULE_DRILL_SYSTEM])
    const note = notesIn(store).at(-1)!
    expect(note).toMatchObject({ status: 'ready', text: RULE_TEXT })
    // The note as stored still holds the file's code: only screening keeps it out of what is sent.
    expect(JSON.stringify(note.changes)).toContain('INTERNALONLY')
    for (const call of calls.slice(2)) expect(call.prompt).not.toContain('INTERNALONLY')
    expect(calls[3]!.prompt).toContain('pricing.js — 설정으로 빼서 내용을 싣지 않음')
    expect(calls[3]!.prompt).toBe(ruleDrillPrompt(screenNote(note, ['src/pricing.js']), TEAM.rules, SAID))
  })

  test('on, in a -p run, the rule practice\'s call cut short: no later load of this process takes the note up, so it is saved at once with its own practice, journaled; the next session calls nothing more (2/7 검토)', async ($, on) => {
    const calls = routeCalls(on)
    const store = new Map<string, unknown>()
    const w = world(on, 'ok', null, true, store)
    w.files.set('/proj/.claude/learn-notes.md', TEAM_MD)
    w.harness = ON
    await $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
    w.texts = [OWN, REPLY]
    w.replies = ['ok', 'cut']
    await turn($, () => $.tool.call(WRITE_USER))
    await finish(w)
    expect(calls.map(call => call.system)).toEqual([SYSTEM, RULE_DRILL_SYSTEM])
    expect(notesIn(store).at(-1)).toMatchObject({ status: 'ready', text: OWN })
    expect(w.journal()).toHaveLength(1)
    expect(w.journal()[0]!.text).toContain(`- 할 일: ${CONCEPT_TASK}`)
    // The next session, at a terminal: the note is written, nothing to take up.
    await start($)
    await w.clock.advance(60_000)
    await w.clock.settle()
    expect(calls).toHaveLength(2)
    expect(notesIn(store).at(-1)).toMatchObject({ status: 'ready', text: OWN })
    expect(w.journal()).toHaveLength(1)
  })

  // As shipped (docs/qa/견본.md '모델별 결정'): isRuleWide on and isRuleDrill off in both rows.
  for (const model of ['haiku', 'sonnet'] as const) {
    test(`as shipped (${model}, no harness): one call however the note reads; a practice bringing the rule's name in under a rule line kept marked (no t), one that does not kept as 1.9.0 kept it`, { options: { model } }, async ($, on) => {
      const { calls, note, w } = await wrote($, on, undefined, [PLAIN, REPLY])
      expect(calls.map(call => [call.model, call.system])).toEqual([[model, SYSTEM]])
      expect(note().text).toBe(PLAIN_KEPT)
      expect(w.texts).toEqual([REPLY])
      // The journal keeps the note's own line; the bold one is a practice's record, never made with no practice (2/7 검토).
      expect(w.journal().at(-1)!.text).toContain(`- 할 일 (팀 규칙): ${PLAIN_TASK}`)
      expect(w.journal().at(-1)!.text).not.toContain('**할 일 (팀 규칙)**')
      let ui = await pane($)
      expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
      await ui.unmount()
      w.texts = [OWN]
      await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
      await finish(w)
      expect(calls.map(call => call.system)).toEqual([SYSTEM, SYSTEM])
      expect(note().text).toBe(OWN)
      ui = await pane($)
      expect((await ui.find({ type: 'Button', key: 'note-drill' }))?.props).toMatchObject({ hotkey: 't' })
      await ui.unmount()
    })

    test(`as shipped (${model}): a harness's flat isRuleWide false is a test switch and keeps the note as 1.9.0 kept it; true, as the row has it, is none`, { options: { model } }, async ($, on) => {
      const { note, w } = await wrote($, on, { isRuleWide: false }, [PLAIN])
      expect(note().text).toBe(PLAIN)
      const versionLine = (diag: string) => diag.split('\n').find(line => line.startsWith('- 버전: '))
      expect(versionLine((await learn($, '진단')).text ?? '')).toContain('· 시험 스위치: 팀 규칙 표지 넓힘 끔')
      w.harness = { isRuleWide: true }
      await start($)
      w.texts = [PLAIN]
      await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
      await finish(w)
      expect(note().text).toBe(PLAIN_KEPT)
      expect(versionLine((await learn($, '진단')).text ?? '')).not.toContain('시험 스위치')
    })
  }

  /** The note's t, the concept's, and its task shown in the pane: a practice kept as 1.9.0 kept it. */
  async function conceptT($: Engine) {
    const ui = await pane($)
    expect((await ui.find({ type: 'Button', key: 'note-drill' }))?.props).toMatchObject({ hotkey: 't' })
    expect(await ui.find({ type: 'Markdown', text: escape(`- 할 일: ${PLAIN_TASK}`) })).toBeDefined()
    await ui.unmount()
  }

  // As shipped with every switch off for the window, no harness (1.10.0 cross-review): the alias's variable set or
  // unreadable, a provider's switch set (Claude Code turns the alias to a model no sample was run with), a level other
  // than beginner. The one cell shipped on reaches nothing: the note kept as 1.9.0 kept it, its t the concept's.
  for (const model of ['haiku', 'sonnet'] as const) {
    const alias = model === 'haiku' ? 'ANTHROPIC_DEFAULT_HAIKU_MODEL' : 'ANTHROPIC_DEFAULT_SONNET_MODEL'
    for (const [why, env, level] of [
      ['its alias variable set', { [alias]: 'pinned-model-x' }, 'beginner'],
      ['its alias variable unreadable', {}, 'beginner'],
      [`a provider's switch set (${model === 'haiku' ? 'Bedrock' : 'Vertex'}), no alias variable`, { [model === 'haiku' ? 'CLAUDE_CODE_USE_BEDROCK' : 'CLAUDE_CODE_USE_VERTEX']: '1' }, 'beginner'],
      ['at intermediate', {}, 'intermediate'],
      ['at advanced', {}, 'advanced'],
    ] as const) {
      test(`as shipped (${model}, no harness), ${why}: every switch off, a practice bringing the rule's name in under a rule line kept as 1.9.0 kept it, its t the concept's`, { options: { model, level } }, async ($, on) => {
        if (why.endsWith('unreadable')) on('env.get', { name: alias }, () => ({ deny: 'refused by policy' }))
        const { calls, note, w } = await wrote($, on, undefined, [PLAIN], [], env)
        expect(calls.map(call => [call.model, call.system])).toEqual([[model, SYSTEM]])
        expect(note().text).toBe(PLAIN)
        expect(w.journal().at(-1)!.text).toContain(`- 할 일: ${PLAIN_TASK}`)
        await conceptT($)
        expect((await learn($, '진단')).text ?? '').not.toContain('시험 스위치')
      })
    }
  }

  // The alias's variable or a provider's switch set in the session (1.10.0 cross-review): Claude Code turns the alias
  // with the settings' env, no reload; the window reads them again before a note its switch would keep otherwise.
  for (const [model, name] of [
    ['haiku', 'ANTHROPIC_DEFAULT_HAIKU_MODEL'],
    ['sonnet', 'CLAUDE_CODE_USE_FOUNDRY'],
  ] as const) {
    test(`as shipped (${model}), ${name} set in the session: the next note is kept as every switch off keeps it, its t the concept's; the one before stays marked`, { options: { model } }, async ($, on) => {
      const now: Record<string, string> = {}
      on('env.get', { name }, (_$, e, next) => (now[e.name] !== undefined ? { value: now[e.name] } : next(e)))
      const { note, w, store } = await wrote($, on, undefined, [PLAIN])
      expect(note().text).toBe(PLAIN_KEPT)
      now[name] = 'set-in-session-x'
      w.texts = [PLAIN]
      await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
      await finish(w)
      expect(note().text).toBe(PLAIN)
      expect(notesIn(store).map(one => one.text)).toEqual([PLAIN_KEPT, PLAIN])
      await conceptT($)
      expect((await learn($, '진단')).text ?? '').toContain(name === 'ANTHROPIC_DEFAULT_HAIKU_MODEL' ? '(별칭 변수를 둠 · 모델별 기능 모두 끔)' : '(제공자 변수를 둠 · 모델별 기능 모두 끔)')
    })
  }

  // The settings' modelOverrides (1.10.0 cross-review, round 3): Claude Code turns the alias to the id it names with no
  // variable set, so the one cell shipped on reaches nothing there either, at session start or once set in the session.
  const OVERRIDDEN = { modelOverrides: { 'some-model-1': 'override-target-x' } }
  for (const model of ['haiku', 'sonnet'] as const) {
    test(`as shipped (${model}, no harness), modelOverrides in the settings: every switch off, a practice bringing the rule's name in under a rule line kept as 1.9.0 kept it, its t the concept's`, { options: { model } }, async ($, on) => {
      const { calls, note, w } = await wrote($, on, undefined, [PLAIN], [], {}, OVERRIDDEN)
      expect(calls.map(call => [call.model, call.system])).toEqual([[model, SYSTEM]])
      expect(note().text).toBe(PLAIN)
      expect(w.journal().at(-1)!.text).toContain(`- 할 일: ${PLAIN_TASK}`)
      await conceptT($)
      const diag = (await learn($, '진단')).text ?? ''
      expect(diag).toContain(`· ${model}(modelOverrides 설정을 둠 · 모델별 기능 모두 끔) ·`)
      expect(diag).not.toContain('시험 스위치')
    })
  }

  test('as shipped (haiku), modelOverrides set in the session: the next note is kept as every switch off keeps it, its t the concept\'s; the one before stays marked', { options: { model: 'haiku' } }, async ($, on) => {
    const { note, w, store } = await wrote($, on, undefined, [PLAIN])
    expect(note().text).toBe(PLAIN_KEPT)
    w.settings = OVERRIDDEN
    w.texts = [PLAIN]
    await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
    await finish(w)
    expect(note().text).toBe(PLAIN)
    expect(notesIn(store).map(one => one.text)).toEqual([PLAIN_KEPT, PLAIN])
    await conceptT($)
    expect((await learn($, '진단')).text ?? '').toContain('(modelOverrides 설정을 둠 · 모델별 기능 모두 끔)')
  })

  // Every rule's names, not the first's alone (the notes above bring apiRequest in): a practice bringing in the name of
  // a later rule under that rule's line is kept marked too (1.10.0 cross-review).
  test('as shipped (haiku, no harness): a practice bringing in a later rule\'s name (log.info, toDateText, config) under its rule line is kept marked', { options: { model: 'haiku' } }, async ($, on) => {
    const later = [
      ['기록은 `log.info`로 남기라는 규칙과 달리 `console.log`를 씁니다', 'console.log(user)', 'log.info(user)'],
      ['날짜는 `toDateText`로 보이라는 규칙과 달리 직접 만듭니다', 'const day = d.toISOString().slice(0, 10)', 'const day = toDateText(d)'],
      ['설정은 `config`에서 읽으라는 규칙과 달리 `process.env`를 바로 읽습니다', 'const url = process.env.API_URL', 'const url = config.API_URL'],
    ] as const
    const noteOf = ([said, line, example]: readonly [string, string, string], task: string) =>
      [...HEAD.map(one => (one === RULE_LINE ? `팀 규칙과 다를 수 있음: ${said}` : one)), '### 직접 해 보기', `- 할 일: ${task}`, `- 고칠 줄: \`${line}\``, '- 확인: `loadUser(1)` → 같은 사용자 정보가 나옵니다', `- 예시 답: \`${example}\``].join('\n')
    const kept = (one: readonly [string, string, string]) => noteOf(one, PLAIN_TASK).replace(`- 할 일: ${PLAIN_TASK}`, `- 할 일 (팀 규칙): ${PLAIN_TASK}`)
    const { w, note } = await wrote($, on, undefined, [noteOf(later[0], PLAIN_TASK)])
    expect(note().text).toBe(kept(later[0]))
    for (const [k, one] of later.slice(1).entries()) {
      w.texts = [noteOf(one, PLAIN_TASK)]
      await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: `w${k + 2}` }), `t${k + 2}`)
      await finish(w)
      expect(note().text).toBe(kept(one))
    }
  })

  test('isRuleWide on alone: a practice bringing the rule\'s name in under a rule line is kept marked: no t, left out of the pane, a question and the copy; the journal keeps it', async ($, on) => {
    const { w, calls, note } = await wrote($, on, { isRuleWide: true }, [PLAIN])
    expect(calls.map(call => call.system)).toEqual([SYSTEM])
    expect(note().text).toBe(PLAIN_KEPT)
    const ui = await pane($)
    expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /직접 해 보기/ })).toBeUndefined()
    await ui.press({ key: 'share' })
    expect(w.copied.at(-1)).not.toContain('직접 해 보기')
    w.answer = '쉬운 말로 다시 쓴 답'
    await ui.press({ key: 'easier' })
    await w.clock.settle()
    await ui.unmount()
    expect(w.models.at(-1)).not.toContain('직접 해 보기')
    expect(w.models.at(-1)).not.toContain(PLAIN_TASK)
    expect(w.journal().find(one => one.text.includes(PLAIN_TASK))!.text).toContain(`- 할 일 (팀 규칙): ${PLAIN_TASK}`)
    expect(w.journal().map(one => one.text).join('\n')).not.toContain('**할 일 (팀 규칙)**')
    // A 팀 규칙: line that says something marks it too; none over it, never.
    w.texts = [PLAIN.replace(RULE_LINE, '팀 규칙: 서버 요청은 apiRequest로 합니다'), PLAIN.replace(`${RULE_LINE}\n`, '')]
    await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
    await finish(w)
    expect(note().text).toBe(PLAIN_KEPT.replace(RULE_LINE, '팀 규칙: 서버 요청은 apiRequest로 합니다'))
    await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w3' }), 't3')
    await finish(w)
    expect(note().text).toBe(PLAIN.replace(`${RULE_LINE}\n`, ''))
  })

  test('per model (G7): haiku\'s row on, the sonnet window makes one call and keeps the note as its own row says (isRuleWide on as shipped, isRuleDrill off): marked, no t', { options: { model: 'sonnet' } }, async ($, on) => {
    const { calls, note } = await wrote($, on, { models: { haiku: ON } }, [PLAIN, REPLY])
    expect(calls.map(call => [call.model, call.system])).toEqual([['sonnet', SYSTEM]])
    expect(note().text).toBe(PLAIN_KEPT)
    const ui = await pane($)
    expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /직접 해 보기/ })).toBeUndefined()
    await ui.unmount()
  })

  test('per model (G7): haiku\'s row on, a sonnet window with its row turned back off (models.sonnet) keeps the note as 1.9.0 did; its t is the concept\'s', { options: { model: 'sonnet' } }, async ($, on) => {
    const { calls, note } = await wrote($, on, { models: { haiku: ON, sonnet: OFF } }, [PLAIN, REPLY])
    expect(calls.map(call => [call.model, call.system])).toEqual([['sonnet', SYSTEM]])
    expect(note().text).toBe(PLAIN)
    const ui = await pane($)
    expect((await ui.find({ type: 'Button', key: 'note-drill' }))?.props).toMatchObject({ hotkey: 't' })
    expect(await ui.find({ type: 'Markdown', text: escape(`- 할 일: ${PLAIN_TASK}`) })).toBeDefined()
    await ui.unmount()
  })

  test('per model (G7): haiku\'s row on, the haiku window marks and asks; started again on haiku\'s shipped row (isRuleDrill off, as any other window reads it), no practice', { options: { model: 'haiku' } }, async ($, on) => {
    const { w, calls, note } = await wrote($, on, { models: { haiku: ON } }, [PLAIN, '- 할 일: 없음'])
    expect(calls.map(call => [call.model, call.system])).toEqual([['haiku', SYSTEM], ['haiku', RULE_DRILL_SYSTEM]])
    expect(note().text).toBe(PLAIN_KEPT)
    let ui = await pane($)
    expect((await ui.find({ type: 'Button', key: 'note-drill' }))?.props).toMatchObject({ hotkey: 't' })
    expect(await ui.find({ type: 'Markdown', text: escape(`- 할 일 (팀 규칙): ${PLAIN_TASK}`) })).toBeDefined()
    await ui.unmount()
    w.harness = { models: { sonnet: ON } }
    await start($)
    ui = await pane($)
    expect(await ui.find({ type: 'Button', key: 'note-drill' })).toBeUndefined()
    expect(await ui.find({ type: 'Markdown', text: /직접 해 보기/ })).toBeUndefined()
    await ui.unmount()
    expect(note().text).toBe(PLAIN_KEPT)
  })

  test('a question, r and e under a note with the rule practice send what the switch off sends (D31), the practice left out: the same bytes on and off', async ($, on) => {
    const { w, calls, note } = await wrote($, on, ON, [OWN, REPLY])
    expect(note().text).toBe(RULE_TEXT)
    /** r, a question after it and e under the newest note: their calls. */
    const asked = async () => {
      const from = calls.length
      const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
      w.answer = '1. `loadUser(1)`: 1번 사용자 정보를 가져옵니다.\n\n**생각해 보기:** `loadUser(2)`를 부르면 무엇이 나올까요?'
      await ui.press({ key: 'trace' })
      await w.clock.settle()
      w.answer = '2번 사용자 정보가 나옵니다.'
      const key = String((await ui.find({ type: 'Input' }))!.props.key)
      await ui.input({ key, text: '2번 사용자요' })
      await w.clock.settle()
      w.answer = '쉬운 말로 다시 쓴 답'
      await ui.press({ key: 'easier' })
      await w.clock.settle()
      await ui.unmount()
      return calls.slice(from)
    }
    const onAsks = await asked()
    expect(onAsks.map(call => call.system)).toEqual([ASK_SYSTEM, ASK_SYSTEM, ASK_SYSTEM])
    for (const call of onAsks) {
      expect(call.prompt).not.toContain('직접 해 보기')
      expect(call.prompt).not.toContain(TASK)
      expect(call.prompt).toContain(RULE_LINE)
    }
    // The same note again (nothing asked under it yet), asked where the switch is off.
    w.texts = [OWN, REPLY]
    await turn($, () => $.tool.call({ ...WRITE_USER, tool_use_id: 'w2' }), 't2')
    await finish(w)
    expect(note().text).toBe(RULE_TEXT)
    w.harness = OFF
    await start($)
    expect(await asked()).toEqual(onAsks)
  })
})

describe('1.10.0: 비슷한 코드 (G2) behind its switch: what a quiz sends with it on, and 1.9.0\'s bytes with it off', () => {
  const DAY = 86_400_000
  const CART = '/proj/src/cart.js'
  const EVENS = '/proj/app/evens.py'
  const CART_BEFORE = 'function total(items) {\n  return items.reduce((sum, item) => sum + item.price, 0)\n}\nconsole.log(total([{ price: 3, qty: 2 }]))\n'
  const CART_AFTER = 'function total(items) {\n  return items.reduce((sum, item) => sum + item.price * item.qty, 0)\n}\nconsole.log(total([{ price: 3, qty: 2 }]))\n'
  const EVENS_TEXT = 'nums = [1, 2, 3, 4]\nevens = [n for n in nums if n % 2 == 0]\nprint(evens)\n'
  const REDUCE = 'reduce'
  const ARROW = '화살표 함수'
  const COMP = '리스트 컴프리헨션'
  const NOTE_CART = [
    '### 한 줄 요약',
    '합계에 수량을 곱했습니다',
    '### 배울 개념',
    `- **${REDUCE}**: 배열을 값 하나로 모읍니다 — \`items.reduce((sum, item) => sum + item.price * item.qty, 0)\``,
    `- **${ARROW}**: 짧게 쓰는 함수입니다 — \`(sum, item) => sum + item.price * item.qty\``,
    '### 직접 확인해 볼 것',
    '- 실행해 보기',
  ].join('\n')
  const NOTE_EVENS = ['### 한 줄 요약', '짝수만 골랐습니다', '### 배울 개념', `- **${COMP}**: 조건에 맞는 것만 모아 새 리스트를 만듭니다 — \`[n for n in nums if n % 2 == 0]\``, '### 직접 확인해 볼 것', '- 실행해 보기'].join('\n')
  /** A reply whose first question shows code changed, its trace on its R line. */
  const REPLY = [
    'T1: 예측',
    'Q1: 아래 코드는 무엇을 찍을까요?',
    '```js',
    'function total(items) {',
    '  return items.reduce((sum, item) => sum + item.price * item.qty, 10)',
    '}',
    'console.log(total([{ price: 3, qty: 2 }]))',
    '```',
    'H1: 처음 값을 보세요',
    'R1: sum은 10에서 시작해 6을 더해 16',
    'A1: 16',
  ].join('\n')
  const CHANGED_TRACE = 'R1: (칸이 "비슷한 코드"인 문제만: 보인 코드를 한 줄씩 따라간 과정)'
  const NEW_TRACE = 'R1: (칸이 "처음 보는 코드"인 문제만: 코드를 한 줄씩 따라간 과정)'
  /** The three concepts at their steps (the third by default), a week and a day after their last review, `more` over each. */
  const storeOf = (steps: Partial<Record<string, number>> = {}, more: Partial<Record<string, Record<string, unknown>>> = {}) => {
    const concepts = Object.fromEntries(
      [REDUCE, ARROW, COMP].map(name => [
        conceptKey(name),
        { name, count: 1, firstAt: NOW - 60 * DAY, lastAt: NOW - 60 * DAY, blurb: `${name} 설명`, files: [], step: steps[name] ?? 2, reviewedAt: NOW - 8 * DAY, ...(more[name] ?? {}) },
      ]),
    )
    return new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)]])
  }
  /**
   * A world on `store` whose notes met REDUCE and ARROW in an edit to CART and COMP in EVENS written whole, its build run
   * with `harness` (none: as shipped); `setup` before it starts. Its quiz's model calls, and the reads of CART and
   * EVENS from the quiz on.
   */
  async function quizWorld($: Engine, on: On, harness: Record<string, unknown> | null, store = storeOf(), setup: (w: World) => void = () => {}) {
    const calls = routeCalls(on)
    const reads = { cart: 0, evens: 0, isArmed: false }
    on('fs.read', { path: /\/proj\/(src\/cart\.js|app\/evens\.py)$/ }, (_$, e, next) => {
      if (reads.isArmed) reads[e.path === CART ? 'cart' : 'evens'] += 1
      return next(e)
    })
    on('tool.call', { tool: 'Edit' }, (_$, e) => ({
      result: {
        filePath: e.file_path,
        oldString: e.old_string,
        newString: e.new_string,
        originalFile: CART_BEFORE,
        structuredPatch: [{ oldStart: 1, oldLines: 3, newStart: 1, newLines: 3, lines: [' function total(items) {', '-  return items.reduce((sum, item) => sum + item.price, 0)', '+  return items.reduce((sum, item) => sum + item.price * item.qty, 0)', ' }'] }],
        userModified: false,
        replaceAll: false,
      },
    }))
    const w = world(on, 'ok', null, true, store)
    if (harness) w.harness = harness
    w.files.set(CART, CART_AFTER)
    setup(w)
    await start($)
    w.answer = NOTE_CART
    await turn($, () => $.tool.call({ tool: 'Edit', tool_use_id: 'u1', file_path: CART, old_string: 'item.price, 0', new_string: 'item.price * item.qty, 0' }))
    await finish(w)
    w.answer = NOTE_EVENS
    await turn($, () => $.tool.call({ tool: 'Write', tool_use_id: 'u2', file_path: EVENS, content: EVENS_TEXT }), 't2')
    await finish(w)
    w.files.set(EVENS, EVENS_TEXT)
    reads.isArmed = true
    const before = calls.length
    w.answer = REPLY
    const listed = (await learn($, '퀴즈 새로')).text ?? ''
    return { w, store, calls: calls.slice(before), reads, listed }
  }
  const itemsOf = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items

  test('on (a harness\'s 2): the request pinned, made outside the plugin as the design\'s preview makes it; the trace dropped; the edited file read for its imports, the one written whole not; /learn 진단 names the switch', async ($, on) => {
    const { w, store, calls, reads, listed } = await quizWorld($, on, { rungChangedStep: 2 })
    expect(calls).toEqual([CHANGED_QUIZ_ON])
    expect(CHANGED_QUIZ_ON.maxTokens).toBe(4600)
    expect(CHANGED_QUIZ_ON.prompt).toContain(`\nH1: (힌트 한 문장)\n${CHANGED_TRACE}\nA1: (답 한두 문장)\n`)
    expect(CHANGED_QUIZ_ON.prompt.split('   칸: 비슷한 코드\n').length).toBe(4)
    // Read on this device for its imports, once a concept met in it (two here); a file written whole never (its diff
    // has every line from the top). Nothing of it is sent: the code sent is the note's.
    expect(reads).toMatchObject({ cart: 2, evens: 0 })
    expect(CHANGED_QUIZ_ON.prompt).not.toContain('console.log(total([{ price: 3, qty: 2 }]))')
    expect(itemsOf(store)[0]).toMatchObject({ name: COMP, rung: 'changed', kind: 'predict', hint: '처음 값을 보세요', answer: '16' })
    expect(JSON.stringify(store.get('quiz'))).not.toContain('6을 더해')
    expect(listed).toContain('\n1. (비슷한 코드) 아래 코드는 무엇을 찍을까요?')
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 비슷한 코드 · 예측$/ })).toBeDefined()
    await ui.unmount()
    const version = ((await learn($, '진단')).text ?? '').split('\n').find(line => line.startsWith('- 버전: '))
    expect(version).toContain('시험 스위치: 비슷한 코드 단계 2')
    expect(w.budgets.at(-1)).toBe(4600)
  })

  for (const harness of [{ rungChangedStep: null }, null]) {
    test(`off (${harness ? 'a harness\'s null' : 'as shipped, no harness'}): 1.9.0's request to the byte, made outside the plugin by fca5988's own notes.ts; no file read; the R line the hint's as in 1.9.0`, async ($, on) => {
      const { store, calls, reads } = await quizWorld($, on, harness)
      expect(calls).toEqual([CHANGED_QUIZ_OFF])
      expect(CHANGED_QUIZ_OFF.maxTokens).toBe(3400)
      expect(CHANGED_QUIZ_OFF.prompt).not.toContain('비슷한 코드')
      expect(CHANGED_QUIZ_OFF.prompt).not.toContain('R1:')
      expect(reads).toMatchObject({ cart: 0, evens: 0 })
      expect(itemsOf(store)[0]).toMatchObject({ rung: 'mine', hint: '처음 값을 보세요\nR1: sum은 10에서 시작해 6을 더해 16' })
    })
  }

  test('before its step (the second review): each in its own code, no file read, 1.9.0\'s request', async ($, on) => {
    const { calls, reads } = await quizWorld($, on, { rungChangedStep: 2 }, storeOf({ [REDUCE]: 1, [ARROW]: 1, [COMP]: 1 }))
    expect(calls).toEqual([CHANGED_QUIZ_OFF])
    expect(reads).toMatchObject({ cart: 0, evens: 0 })
  })

  for (const model of ['haiku', 'sonnet'] as const) {
    test(`(G7) ${model} with only sonnet's row turning it on: ${model === 'haiku' ? '1.9.0\'s request and no file read' : 'the request pinned, sent as sonnet'}`, { options: { model } }, async ($, on) => {
      const { calls, reads } = await quizWorld($, on, { models: { sonnet: { rungChangedStep: 2 } } })
      expect(calls).toEqual([{ ...(model === 'haiku' ? CHANGED_QUIZ_OFF : CHANGED_QUIZ_ON), model }])
      expect(reads.cart).toBe(model === 'haiku' ? 0 : 2)
    })
  }

  test('beside code never seen (a harness\'s 4) or a worked example, code changed is asked in its own code: no sentence or R line of its own, the quiz\'s cap the other rung\'s', async ($, on) => {
    // COMP due at its fifth step: code never seen (EVENS written whole, no import).
    const fresh = await quizWorld($, on, { rungNewStep: 4, rungChangedStep: 2 }, storeOf({ [COMP]: 4 }, { [COMP]: { reviewedAt: NOW - 31 * DAY } }))
    const prompt = fresh.calls[0]!.prompt
    expect(prompt).toContain(`1. ${COMP} — 조건에 맞는 것만 모아 새 리스트를 만듭니다\n   칸: 처음 보는 코드 (py로)\n`)
    expect(prompt.split('   칸: 내 코드\n').length).toBe(3)
    expect(prompt).not.toContain('비슷한 코드')
    expect(prompt).toContain(NEW_TRACE)
    expect(prompt).not.toContain(CHANGED_TRACE)
    expect(fresh.calls[0]!.maxTokens).toBe(4600)
  })

  test('beside a worked example (a harness\'s 2 misses), code changed is asked in its own code too', async ($, on) => {
    const slip = { what: '조건이 거짓인 것도 남는다고 봄', type: 'boundary', question: '지난 문제', mine: '[1, 2, 3, 4]', at: NOW - 2 * DAY, times: 2 }
    const store = storeOf()
    store.set('slips', { [conceptKey(COMP)]: slip })
    const { calls } = await quizWorld($, on, { workedAfterTimes: 2, rungChangedStep: 2 }, store)
    const prompt = calls[0]!.prompt
    expect(prompt).toContain('   칸: 풀이 보고 풀기 (py로)\n')
    expect(prompt.split('   칸: 내 코드\n').length).toBe(3)
    expect(prompt).not.toContain('비슷한 코드')
    expect(prompt).not.toContain('R1:')
    expect(calls[0]!.maxTokens).toBe(4600)
  })

  /** CART with a line bringing code in (`top`) far above the lines a note quotes: in no snippet, in the file alone. */
  const cartUnder = (top: string) => `${top}\n${Array.from({ length: 12 }, (_, i) => `// line ${i + 1}`).join('\n')}\n${CART_AFTER}`

  test('(3/7 검토) an edit to a file that imports by a path far above the lines quoted: each concept met in it in its own code, the file read; the one written whole with none, code changed', async ($, on) => {
    const { calls, reads } = await quizWorld($, on, { rungChangedStep: 2 }, storeOf(), w => w.files.set(CART, cartUnder("import { sum } from './math'")))
    const prompt = calls[0]!.prompt
    expect(prompt.split(/^\d+\. /m).length - 1).toBe(3)
    expect(prompt.split('   칸: 내 코드\n   학습자가 만든 코드 (cart.js)').length - 1).toBe(2)
    expect(prompt).toContain('   칸: 비슷한 코드\n   학습자가 만든 코드 (evens.py)')
    expect(prompt).not.toContain("from './math'")
    expect(reads).toMatchObject({ cart: 2, evens: 0 })
    expect(calls[0]!.maxTokens).toBe(4600)
  })

  test('(3/7 검토) a concept filling the quiz at its step, not due, met in an edit to a file that imports a library: read for it all the same, asked in its own code', async ($, on) => {
    // REDUCE gone over a day ago (not due at its third step): it fills the quiz's third place.
    const store = storeOf({}, { [REDUCE]: { reviewedAt: NOW - DAY } })
    const { calls, reads } = await quizWorld($, on, { rungChangedStep: 2 }, store, w => w.files.set(CART, cartUnder("import { sum } from 'lodash'")))
    const prompt = calls[0]!.prompt
    expect(prompt.split(/^\d+\. /m).length - 1).toBe(3)
    expect(prompt).toContain(`${REDUCE} — `)
    expect([reads.cart, prompt.includes('   칸: 비슷한 코드\n   학습자가 만든 코드 (cart.js)')]).toEqual([2, false])
    expect(prompt).toContain('   칸: 비슷한 코드\n   학습자가 만든 코드 (evens.py)')
  })

  test('(3/7 검토) a base concept found past the concepts the quiz looks through (1.9.0 F5): its file read for its imports as any pick\'s, asked in its own code right before the worked example', async ($, on) => {
    // 클로저 missed twice running, its base REDUCE (met in CART, which imports a library) gone over three days ago, so
    // not due; five concepts due before it fill the six the quiz looks through. ARROW at its second step, so read for
    // nothing: CART is read for the base alone.
    const X = '클로저'
    const store = storeOf({ [ARROW]: 1 }, { [REDUCE]: { reviewedAt: NOW - 3 * DAY } })
    const concepts = store.get('concepts') as Record<string, unknown>
    for (const [i, name] of [X, '문자열', '조건문', '반복문', '객체', '함수'].entries()) {
      concepts[conceptKey(name)] = { name, count: 1, firstAt: NOW - (40 + i) * DAY, lastAt: NOW - (40 + i) * DAY, blurb: `${name} 설명`, files: [], step: i === 0 ? 1 : 2, reviewedAt: NOW - (i === 0 ? 3 : 8) * DAY }
    }
    store.set('steps', ownSteps(concepts as never))
    store.set('slips', { [conceptKey(X)]: { what: '함수가 끝나면 바깥 변수도 사라진다고 봄', type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 2, base: conceptKey(REDUCE) } })
    // 클로저 met in counter.js by a note (metInCode): the code branch's worked example, the one a base is asked before
    // (1.10.0 G4; met in no code until then, the plain branch's, which G4 asks no base before).
    metInCode(store, X)
    const { calls, reads } = await quizWorld($, on, { isBaseAsked: true, ...WORKED_BOTH, rungChangedStep: 2 }, store, w => w.files.set(CART, cartUnder("import { sum } from 'lodash'")))
    const prompt = calls[0]!.prompt
    const place = (name: string) => prompt.search(new RegExp(`^\\d+\\. ${name} — `, 'm'))
    const base = place(REDUCE)
    expect(base).toBeGreaterThan(-1)
    expect(prompt.slice(base).split(/\n\d+\. /)[0]).toContain('   칸: 내 코드\n   학습자가 만든 코드 (cart.js)')
    expect(place(X)).toBeGreaterThan(base)
    expect(prompt).toContain('   칸: 풀이 보고 풀기')
    expect(prompt).not.toContain('비슷한 코드')
    expect(reads).toMatchObject({ cart: 1, evens: 0 })
  })

  /** The quiz this world sends with code changed on, then (the harness turned off, a minute on) off: each request. */
  async function onThenOff($: Engine, on: On, store: Map<string, unknown>, setup: (w: World) => void = () => {}) {
    const { w, calls } = await quizWorld($, on, { rungChangedStep: 2 }, store, setup)
    w.harness = { rungChangedStep: null }
    await start($)
    await w.clock.advance(60_000)
    const count = w.budgets.length
    w.answer = REPLY
    await learn($, '퀴즈 새로')
    expect(w.budgets.length).toBe(count + 1)
    return { on: calls[0]!, off: { prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1)! } }
  }

  test('(D33) a quiz of three with a team term in it: each concept in its own code, the prompt and cap those of it off to the byte', async ($, on) => {
    // ARROW not due: the place it leaves goes to the team's term not met yet.
    const store = storeOf({}, { [ARROW]: { reviewedAt: NOW } })
    const team = ['## 용어', '- **캐시 키**: 요청마다 캐시를 나누는 이름입니다', ''].join('\n')
    const both = await onThenOff($, on, store, w => w.files.set('/proj/.claude/learn-notes.md', team))
    expect(both.on.prompt).toContain('(팀 용어) 캐시 키')
    expect(both.on.prompt.split(/^\d+\. /m).length - 1).toBe(3)
    expect(both.on.prompt).not.toContain('비슷한 코드')
    expect({ prompt: both.on.prompt, maxTokens: both.on.maxTokens }).toEqual(both.off)
    expect(both.off.maxTokens).toBe(3400)
  })

  for (const [what, known] of [['two', [ARROW]], ['one', [ARROW, COMP]]] as const) {
    test(`(D33) a quiz of ${what}: each concept in its own code, the prompt and cap those of it off to the byte`, async ($, on) => {
      const store = storeOf({}, Object.fromEntries(known.map(name => [name, { knownAt: NOW - DAY }])))
      store.set('known', Object.fromEntries(known.map(name => [conceptKey(name), NOW - DAY])))
      const both = await onThenOff($, on, store)
      expect(both.on.prompt.split(/^\d+\. /m).length - 1).toBe(what === 'two' ? 2 : 1)
      expect(both.on.prompt).not.toContain('비슷한 코드')
      expect({ prompt: both.on.prompt, maxTokens: both.on.maxTokens }).toEqual(both.off)
      expect(both.off.maxTokens).toBe(3400)
    })
  }
})

describe('1.10.0: 풀이 보고 풀기 (G1) by branch behind its switches: what a quiz sends with a branch on, and 1.9.0\'s with both off', () => {
  const DAY = 86_400_000
  const WHAT = '함수가 끝나면 바깥 변수도 사라진다고 봄'
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const missed = (what = WHAT) => `판정: 틀림\n피드백: 아닙니다.\n헷갈린 점: ${what}\n유형: 변수 범위`
  const plainQ = (n: number) => [`T${n}: 예측`, `Q${n}: 문제 ${n}`, `A${n}: 답 ${n}`].join('\n')
  /** A worked example for question `n`, its plan on a P line before Q as G1's format asks; `lang` its block's language. */
  const workedP = (n: number, lang = 'ts') =>
    [
      `T${n}: 예측`,
      `P${n}: 2 → 15`,
      `Q${n}: 풀이: \`let n = 0; n += 2\` 뒤 n은 2입니다. 더한 값이 남습니다.`,
      '이제 풀어 보세요: 아래 코드는 무엇을 찍을까요?',
      '```' + lang,
      'let c = 10',
      'c += 5',
      'console.log(c)',
      '```',
      `H${n}: 처음 값을 보세요`,
      `A${n}: 15`,
    ].join('\n')
  const ASKED = '아래 코드는 무엇을 찍을까요?\n```ts\nlet c = 10\nc += 5\nconsole.log(c)\n```'
  type Row = { what: string; type: string; question: string; mine: string; at: number; times: number; base?: string }
  const slipsOf = (store: Map<string, unknown>) => (store.get('slips') ?? {}) as Record<string, Row>
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
  const historyReads = (w: World) => w.gets.filter(key => key === 'history').length
  const versionLine = (diag: string) => diag.split('\n').find(line => line.startsWith('- 버전: '))
  async function quizIn($: Engine, w: World, reply: string) {
    w.answer = reply
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
  /** Concepts met in no note, at step 0 gone over three days ago, each with its slip missed `times` running two days ago; and a second concept to fill a quiz (withFiller). */
  const plainStore = (names: string[], times: number, more: Partial<Row> = {}) => {
    const concepts = Object.fromEntries(names.map(name => [conceptKey(name), { name, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step: 0, reviewedAt: NOW - 3 * DAY }]))
    const slips = Object.fromEntries(names.map(name => [conceptKey(name), { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times, ...more }]))
    return withFiller(new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', {}], ['slips', slips]]))
  }
  /** A world with 클로저 met in a.ts by a note of this pane, its words quoting a line of it, its slip kept once two days ago. */
  async function metInTs($: Engine, on: On, harness: Record<string, unknown> | undefined) {
    const store = withFiller(new Map<string, unknown>([['slips', { 'c:클로저': { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 1 } }]]))
    const w = world(on, 'ok', null, true, store)
    w.harness = harness
    await start($)
    w.answer = QUOTED_NOTE(['클로저'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    return { w, store }
  }

  test('the code branch on (a harness\'s workedAfterTimes 2): met in ts code holding its quote, missed twice running, the line promises it; the next quiz is one in ts with TURN, CODE and a P line, 4600; the P line kept nowhere; · 풀이 봄; the card the question alone', async ($, on) => {
    const { w, store } = await metInTs($, on, { workedAfterTimes: 2 })
    const ui = await quizIn($, w, plainQ(1))
    expect(await ui.find({ type: 'Text', text: /^문제 1\/1 · 다시 도전 · 예측$/ })).toBeDefined()
    expect(w.models.at(-1)).toContain('   학습자가 만든 코드 (a.ts):')
    for (const line of [WORKED_TURN_ASK, WORKED_CODE_ASK, WORKED_PLAIN_ASK, WORKED_PLAN_LINE]) expect(w.models.at(-1)).not.toContain(line)
    expect(w.budgets.at(-1)).toBe(3400)
    await answer(ui, w, mineKey(store, 0), '전역에 남아요', missed())
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2 })
    expect(await ui.find({ type: 'Text', text: '같은 곳을 또 헷갈렸습니다 · n: 이 개념을 배운 노트 · 다음 복습 퀴즈는 풀이부터 보여 줍니다' })).toBeDefined()
    await ui.unmount()

    await w.clock.advance(60_000)
    w.answer = [workedP(1), plainQ(2)].join('\n')
    const listed = (await learn($, '퀴즈 새로')).text ?? ''
    expect(listed).toContain('\n1. (풀이 보고 풀기) 풀이:')
    const prompt = w.models.at(-1)!
    expect(prompt).toContain('\n   칸: 풀이 보고 풀기 (ts로)\n2. 채움 — 채움 설명\n')
    expect(prompt).not.toContain('학습자가 만든 코드')
    expect(prompt).toContain(`힌트에서 풀이를 되풀이하지 않는다.\n${WORKED_TURN_ASK}\n${WORKED_CODE_ASK}\n'처음 보는 코드'·'풀이 보고 풀기' 칸은`)
    expect(prompt).not.toContain(WORKED_PLAIN_ASK)
    expect(prompt).toContain(`\nT1: (예측 · 왜 · 바꿔 보기 중 하나)\n${WORKED_PLAN_LINE}\nQ1: (문제 한두 문장)\n`)
    expect(w.systems.at(-1)).toBe(QUIZ_SYSTEM)
    expect(w.budgets.at(-1)).toBe(4600)
    // The P line read as a marker and dropped: nothing of it in the question, the hint, the answer, the bank.
    expect(quizItems(store)[0]).toMatchObject({ rung: 'worked', kind: 'predict', hint: '처음 값을 보세요', answer: '15' })
    expect(JSON.stringify(store.get('quiz'))).not.toMatch(/P1|2 → 15/)
    expect((store.get('quizBank') as { question: string }[]).map(one => one.question)).toContain(ASKED)
    expect(JSON.stringify(store.get('quizBank'))).not.toMatch(/P1|풀이:/)
    const next = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    expect(await next.find({ type: 'Text', text: /^문제 1\/2 · 풀이 보고 풀기 · 예측$/ })).toBeDefined()
    await answer(next, w, mineKey(store, 0), '15', RIGHT)
    expect(await next.find({ type: 'Text', text: /^✓ 맞힘 1\. 클로저 · 풀이 봄 · 방금 채점$/ })).toBeDefined()
    await next.unmount()
    await learn($, '안키')
    const file = w.files.get('/home/u/.claude/learning-notes/learn-notes-anki.txt')!
    expect(file).toContain('아래 코드는 무엇을 찍을까요?')
    expect(file).not.toMatch(/풀이:|P1|2 → 15/)
  })

  test('the code branch alone leaves a concept met in no code asked again with no promise; the plain branch on (workedPlainAfterTimes) asks it by a worked example told TURN and PLAIN, and promises one after a miss', async ($, on) => {
    const store = plainStore(['git push'], 1)
    const w = world(on, 'ok', null, true, store)
    w.harness = { workedAfterTimes: 2 }
    await start($)
    const ui = await quizIn($, w, plainQ(1))
    await answer(ui, w, mineKey(store, 0), '올라가요', missed('커밋하지 않은 수정도 올라간다고 봄'))
    expect(slipsOf(store)[conceptKey('git push')]).toMatchObject({ times: 2 })
    expect(await ui.find({ type: 'Text', text: '같은 곳을 또 헷갈렸습니다' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터/ })).toBeUndefined()
    await ui.unmount()
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    expect(w.models.at(-1)).not.toContain('풀이 보고 풀기')
    expect(w.budgets.at(-1)).toBe(3400)
    w.answer = missed('커밋하지 않은 수정도 올라간다고 봄')
    const again = (await learn($, '퀴즈 1 올라가요')).text ?? ''
    expect(again).toContain('\n같은 곳을 또 헷갈렸습니다\n')
    expect(again).not.toContain('풀이부터')

    // The plain branch on: a worked example of it, its line the one for no language.
    w.harness = { workedPlainAfterTimes: 2 }
    await start($)
    await w.clock.advance(60_000)
    w.answer = [workedP(1, ''), plainQ(2)].join('\n')
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (풀이 보고 풀기) 풀이:')
    const prompt = w.models.at(-1)!
    expect(prompt).toContain('\n   칸: 풀이 보고 풀기\n2. 채움')
    expect(prompt).toContain(`${WORKED_TURN_ASK}\n${WORKED_PLAIN_ASK}\n'처음 보는 코드'·'풀이 보고 풀기' 칸은`)
    expect(prompt).not.toContain(WORKED_CODE_ASK)
    expect(w.budgets.at(-1)).toBe(4600)
    w.answer = missed('커밋하지 않은 수정도 올라간다고 봄')
    expect((await learn($, '퀴즈 1 올라가요')).text).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다\n')
  })

  test('both branches on: a concept met in jsx, and a tool\'s concept met beside a ts change that holds no line of its words, missed twice running, asked again with no promise (neither branch\'s)', async ($, on) => {
    const store = withFiller(new Map<string, unknown>([
      ['slips', Object.fromEntries(['상태 훅', 'git restore'].map(name => [conceptKey(name), { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 2 }]))],
    ]))
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = ['### 한 줄 요약', '버튼을 만들었다', '### 배울 개념', '- **상태 훅**: 값을 기억합니다 — `useState(0)`', '- **git restore**: 고친 파일을 되돌립니다 — `git restore`', '### 직접 확인해 볼 것', '- 실행해 보기'].join('\n')
    await turn($, async () => {
      await $.tool.call({ tool: 'Write', tool_use_id: 'j1', file_path: '/proj/src/App.jsx', content: 'export function App() {\n  const [n, setN] = useState(0)\n  return <button onClick={() => setN(n + 1)}>{n}</button>\n}\n' })
      await $.tool.call(EDIT_A)
    })
    await finish(w)
    w.answer = [plainQ(1), plainQ(2)].join('\n')
    const listed = (await learn($, '퀴즈 새로')).text ?? ''
    expect(listed).toContain('\n1. (다시 도전) 문제 1')
    expect(listed).toContain('\n2. (다시 도전) 문제 2')
    expect(w.models.at(-1)).not.toContain('풀이 보고 풀기')
    expect(w.budgets.at(-1)).toBe(3400)
    for (const n of [1, 2]) {
      w.answer = missed()
      const reply = (await learn($, `퀴즈 ${n} 전역에 남아요`)).text ?? ''
      expect(reply).toContain('\n같은 곳을 또 헷갈렸습니다')
      expect(reply).not.toContain('풀이부터')
    }
  })

  for (const harness of [undefined, { workedAfterTimes: 2 }]) {
    test(`the grade's code is looked for once a grade, again after a turn starts; ${harness ? 'only for a miss that reaches a branch\'s count' : 'never with both branches off (no read of the notes)'}`, async ($, on) => {
      const { w, store } = await metInTs($, on, harness)
      const ui = await quizIn($, w, [plainQ(1), plainQ(2)].join('\n'))
      /** The pane drawn anew on the quiz (a window opened again): the line under each grade drawn again. */
      const redraw = async () => {
        const at = historyReads(w)
        const again = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
        await again.unmount()
        return historyReads(w) - at
      }
      // 클로저 missed twice running in the pane (the code branch's count), then 채움 missed once in the conversation (no branch's).
      let at = historyReads(w)
      await answer(ui, w, mineKey(store, 0), '전역에 남아요', missed())
      const second = historyReads(w) - at
      await ui.unmount()
      const cachedRedraw = await redraw()
      at = historyReads(w)
      w.answer = missed('채운다고 봄')
      await learn($, '퀴즈 2 틀린 답')
      const first = historyReads(w) - at
      const plainRedraw = await redraw()
      await turn($, async () => {}, 't9', '아무것도 고치지 않음')
      const afterTurn = await redraw()
      const turnRedraw = await redraw()
      // A session start (a reload) forgets it too.
      await start($)
      const afterStart = await redraw()
      // The notes are read (history) only by the look for the code: once for the grade that reached the count, kept
      // while the pane is drawn again, once more after a turn or a start; none for a first miss, none at all with both off.
      const reads = { second, cachedRedraw, first, plainRedraw, afterTurn, turnRedraw, afterStart }
      expect(reads).toEqual(harness ? { second: 1, cachedRedraw: 0, first: 0, plainRedraw: 0, afterTurn: 1, turnRedraw: 0, afterStart: 1 } : { second: 0, cachedRedraw: 0, first: 0, plainRedraw: 0, afterTurn: 0, turnRedraw: 0, afterStart: 0 })
    })
  }

  test('/learn 진단: a test switch names its branch; both differently, both; the release none; a base counted only before a worked example of the code branch, while it is on (1.10.0 G4)', async ($, on) => {
    const store = plainStore(['상대 경로'], 2, { base: conceptKey('변수 범위') })
    const w = world(on, 'ok', null, true, store)
    const diag = async () => (await learn($, '진단')).text ?? ''
    await start($)
    expect(versionLine(await diag())).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296')
    w.harness = { workedAfterTimes: 2 }
    await start($)
    expect(versionLine(await diag())).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296 · 시험 스위치: 풀이 보고 풀기 오답 수 (코드 개념) 2')
    w.harness = { workedAfterTimes: 2, workedPlainAfterTimes: 3 }
    await start($)
    expect(versionLine(await diag())).toBe('- 버전: learn-notes 1.7.0 · Claude Code 2.1.296 · 시험 스위치: 풀이 보고 풀기 오답 수 (코드 개념) 2 · 풀이 보고 풀기 오답 수 (코드 없는 개념) 3')
    // Bases asked (a harness's): 상대 경로 met in no code, so the code branch on alone asks no base before it, and the
    // plain branch's worked example none either (1.10.0 G4: a base before the code branch's alone; 1.9.0 and G1 counted it).
    w.harness = { workedAfterTimes: 2, isBaseAsked: true }
    await start($)
    expect(await diag()).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 0\n')
    w.harness = { workedPlainAfterTimes: 2, isBaseAsked: true }
    await start($)
    const plain = await diag()
    expect(plain).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 0\n')
    expect(plain).not.toContain('상대 경로')
  })

  test('(1.10.0 G4) /learn 진단 counts a base before the code branch\'s worked example alone: 클로저 met in code by a note, 상대 경로 in none, each missed twice running with a base', async ($, on) => {
    const store = metInCode(plainStore(['상대 경로', '클로저'], 2, { base: conceptKey('변수 범위') }), '클로저')
    const w = world(on, 'ok', null, true, store)
    const diag = async () => (await learn($, '진단')).text ?? ''
    for (const [harness, based] of [
      [{ workedAfterTimes: 2, isBaseAsked: true }, 1],
      [{ ...WORKED_BOTH, isBaseAsked: true }, 1],
      [{ workedPlainAfterTimes: 2, isBaseAsked: true }, 0],
      [{ workedAfterTimes: 3, isBaseAsked: true }, 0],
    ] as const) {
      w.harness = harness
      await start($)
      const said = await diag()
      expect([harness, said.includes(`· 열린 채 두 번 이상 2 · 바탕 개념 ${based}\n`)]).toEqual([harness, true])
      expect(said).not.toContain('클로저')
    }
    // Bases not asked: no count said, none looked for.
    w.harness = { workedAfterTimes: 2 }
    await start($)
    expect(await diag()).toContain('· 열린 채 두 번 이상 2\n')
  })

  for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
    test(`a models row turning both branches on, at ${level}: ${level === 'beginner' ? 'a worked example' : 'the quiz of the window with no harness, to the byte (D17)'}`, { options: { model: 'haiku', level } }, async ($, on) => {
      // 클로저 met in a.ts, its quote on a line of it, missed twice running already.
      const store = withFiller(new Map<string, unknown>([['slips', { 'c:클로저': { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 2 } }]]))
      const w = world(on, 'ok', null, true, store)
      w.harness = { models: { haiku: { ...WORKED_BOTH } } }
      await start($)
      w.answer = QUOTED_NOTE(['클로저'])
      await turn($, () => $.tool.call(EDIT_A))
      await finish(w)
      w.answer = [plainQ(1), plainQ(2)].join('\n')
      await learn($, '퀴즈 새로')
      const row = { prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1)! }
      w.harness = undefined
      await start($)
      await w.clock.advance(60_000)
      await learn($, '퀴즈 새로')
      const none = { prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1)! }
      expect(none.prompt).not.toContain('풀이 보고 풀기')
      expect(none.maxTokens).toBe(3400)
      if (level === 'beginner') {
        expect(row.prompt).toContain('\n   칸: 풀이 보고 풀기 (ts로)\n')
        expect(row.maxTokens).toBe(4600)
      } else expect(row).toEqual(none)
    })
  }

  /** The quiz this store makes with both branches on, then (a minute on, the harness off) the one it makes off: each request. */
  async function onThenOff($: Engine, on: On, store: Map<string, unknown>, setup: (w: World) => void = () => {}) {
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    setup(w)
    await start($)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    const first = { prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1)! }
    w.harness = undefined
    await start($)
    await w.clock.advance(60_000)
    await learn($, '퀴즈 새로')
    return { on: first, off: { prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1)! } }
  }

  test('(D33) a quiz with a team term in it: its worked example asked again, the prompt and cap those of both branches off to the byte', async ($, on) => {
    const team = ['## 용어', '- **캐시 키**: 요청마다 캐시를 나누는 이름입니다', ''].join('\n')
    const both = await onThenOff($, on, plainStore(['클로저'], 2), w => w.files.set('/proj/.claude/learn-notes.md', team))
    expect(both.on.prompt).toContain('(팀 용어) 캐시 키')
    expect(both.on.prompt).not.toContain('풀이 보고 풀기')
    expect(both.on).toEqual(both.off)
    expect(both.off.maxTokens).toBe(3400)
  })

  test('(D33) a quiz of one concept: its worked example asked again, the prompt and cap those of both branches off to the byte', async ($, on) => {
    // The filler known, so the quiz is of one.
    const store = plainStore(['클로저'], 2)
    store.set('known', { [conceptKey('채움')]: NOW - DAY })
    const both = await onThenOff($, on, store)
    expect(both.on.prompt.split(/^\d+\. /m).length - 1).toBe(1)
    expect(both.on.prompt).not.toContain('풀이 보고 풀기')
    expect(both.on).toEqual(both.off)
  })

  test('(D33) a quiz of two, the shape its samples measured: the worked example asked, 4600; off, asked again', async ($, on) => {
    const both = await onThenOff($, on, plainStore(['클로저'], 2))
    expect(both.on.prompt.split(/^\d+\. /m).length - 1).toBe(2)
    expect(both.on.prompt).toContain('\n   칸: 풀이 보고 풀기\n')
    expect(both.on.maxTokens).toBe(4600)
    expect(both.off.prompt).not.toContain('풀이 보고 풀기')
    expect(both.off.maxTokens).toBe(3400)
  })

  test('a quiz 1.8.0 made with a worked example, in a window with both branches off: read and graded as 1.8.0 did (· 풀이 봄, its step kept); missed, it promises none, and the next quiz asks it again', async ($, on) => {
    const store = plainStore(['상대 경로', '쿼리 문자열'], 2)
    const example = (name: string) => `풀이: \`cd ../a\` 뒤 위치는 한 칸 위의 a입니다.\n이제 풀어 보세요: ${name}에서 \`cd ./b\` 뒤 위치는?`
    store.set('quiz', {
      at: NOW - 60_000,
      isRevealed: false,
      items: [
        { key: conceptKey('상대 경로'), name: '상대 경로', question: example('상대 경로'), answer: '지금 폴더 안의 b', hint: '점 하나', kind: 'predict', rung: 'worked' },
        { key: conceptKey('쿼리 문자열'), name: '쿼리 문자열', question: example('쿼리 문자열'), answer: 'b', kind: 'predict', rung: 'worked' },
      ],
    })
    const w = world(on, 'ok', null, true, store)
    await start($)
    expect((await learn($, '퀴즈')).text).toContain('\n1. (풀이 보고 풀기) 풀이: `cd ../a`')
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^문제 1\/2 · 풀이 보고 풀기 · 예측$/ })).toBeDefined()
    await answer(ui, w, mineKey(store, 0), '지금 폴더 안의 b', RIGHT)
    expect(await ui.find({ type: 'Text', text: /^✓ 맞힘 1\. 상대 경로 · 풀이 봄 · 방금 채점$/ })).toBeDefined()
    expect((store.get('concepts') as Record<string, { step?: number }>)[conceptKey('상대 경로')]).toMatchObject({ step: 0 })
    await answer(ui, w, mineKey(store, 1), 'a', missed())
    expect(slipsOf(store)[conceptKey('쿼리 문자열')]).toMatchObject({ times: 3, at: NOW })
    expect(await ui.find({ type: 'Text', text: '같은 곳을 또 헷갈렸습니다' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터/ })).toBeUndefined()
    await ui.unmount()
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    expect(w.models.at(-1)).not.toContain('풀이 보고 풀기')
  })

  // 4/7 review: the line under a grade promises a worked example only where a quiz of a shape its samples measured can
  // ask one (D33), a quiz asks one worked example at most, and a concept met in a file whose code is gone is asked again.
  test('(4/7 검토) both branches on: a concept marked a team term of another repository is promised no worked example, its quizzes ask it again (D33 (1)); its mark gone, the worked example and the promise come back', async ($, on) => {
    const store = plainStore(['캐시 키'], 1)
    store.set('teamTerms', { [conceptKey('캐시 키')]: [rootTag('/other')] })
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    for (let round = 1; round <= 3; round += 1) {
      await w.clock.advance(60_000)
      w.answer = [plainQ(1), plainQ(2)].join('\n')
      expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
      expect(w.models.at(-1)).not.toContain('풀이 보고 풀기')
      expect(w.budgets.at(-1)).toBe(3400)
      w.answer = missed()
      const reply = (await learn($, '퀴즈 1 틀린 답')).text ?? ''
      expect([round, slipsOf(store)[conceptKey('캐시 키')]?.times]).toEqual([round, round + 1])
      expect(reply).toContain('\n같은 곳을 또 헷갈렸습니다\n')
      expect(reply).not.toContain('풀이부터')
    }
    // The pane's line for that grade: none promised either.
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    expect(await ui.find({ type: 'Text', text: /^같은 곳을 또 헷갈렸습니다/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터/ })).toBeUndefined()
    await ui.unmount()
    // Its mark gone (a store no repository marked it in): asked by a worked example, and promised one after a miss.
    store.set('teamTerms', {})
    await start($)
    await w.clock.advance(60_000)
    w.answer = [workedP(1, ''), plainQ(2)].join('\n')
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (풀이 보고 풀기) 풀이:')
    w.answer = missed()
    expect((await learn($, '퀴즈 1 틀린 답')).text).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다\n')
  })

  test('(4/7 검토) both branches on, /learn 진단: no base counted before a concept marked a team term of any repository (its worked example never asked)', async ($, on) => {
    const store = plainStore(['상대 경로'], 2, { base: conceptKey('변수 범위') })
    store.set('teamTerms', { [conceptKey('상대 경로')]: [rootTag('/other')] })
    const w = world(on, 'ok', null, true, store)
    w.harness = { workedPlainAfterTimes: 2, isBaseAsked: true }
    await start($)
    expect((await learn($, '진단')).text).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 0\n')
  })

  test('(4/7 검토) both branches on: a concept with no other concept a quiz could ask beside it (the rest known) is promised no worked example, its quiz of one asks it again (D33 (3)); another concept met since, the worked example and the promise come back', async ($, on) => {
    const store = plainStore(['클로저'], 1)
    store.set('known', { [conceptKey('채움')]: NOW - DAY })
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    w.answer = missed()
    const first = (await learn($, '퀴즈 1 틀린 답')).text ?? ''
    expect(slipsOf(store)[conceptKey('클로저')]).toMatchObject({ times: 2 })
    expect(first).toContain('\n같은 곳을 또 헷갈렸습니다\n')
    expect(first).not.toContain('풀이부터')
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    expect(w.budgets.at(-1)).toBe(3400)
    // Another concept met since (a note teaching it): a quiz of two asks the worked example, and a miss of it promises one again.
    w.answer = CONCEPT_NOTE(['둘째'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    await w.clock.advance(60_000)
    w.answer = [workedP(1, ''), plainQ(2)].join('\n')
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (풀이 보고 풀기) 풀이:')
    w.answer = missed()
    expect((await learn($, '퀴즈 1 틀린 답')).text).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다\n')
  })

  test('(4/7 검토) both branches on: a concept met in a file (src/a.ts) whose note no longer holds it is asked again, never by the plain branch\'s worked example, and promised none', async ($, on) => {
    const store = plainStore(['클로저'], 1)
    const concepts = store.get('concepts') as Record<string, { files: string[]; blurb: string }>
    concepts[conceptKey('클로저')]!.files = ['src/a.ts']
    concepts[conceptKey('클로저')]!.blurb = '함수가 바깥 변수를 기억합니다 — `const b = 2`'
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = [plainQ(1), plainQ(2)].join('\n')
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    w.answer = missed()
    const reply = (await learn($, '퀴즈 1 틀린 답')).text ?? ''
    expect(slipsOf(store)[conceptKey('클로저')]).toMatchObject({ times: 2 })
    expect(reply).toContain('\n같은 곳을 또 헷갈렸습니다\n')
    expect(reply).not.toContain('풀이부터')
    await w.clock.advance(60_000)
    w.answer = [plainQ(1), plainQ(2)].join('\n')
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    for (const line of [WORKED_TURN_ASK, WORKED_PLAIN_ASK, WORKED_CODE_ASK, '칸: 풀이 보고 풀기']) expect(w.models.at(-1)).not.toContain(line)
    expect(w.budgets.at(-1)).toBe(3400)
  })

  test('(4/7 검토) both branches on: two concepts each missed twice running come to one quiz: the first asked by a worked example, the other asked again (one a quiz, as its samples measured)', async ($, on) => {
    const store = plainStore(['git push', 'git fetch'], 2)
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = [workedP(1, ''), plainQ(2), plainQ(3)].join('\n')
    const listed = (await learn($, '퀴즈 새로')).text ?? ''
    expect(listed).toContain('\n1. (풀이 보고 풀기) 풀이:')
    expect(listed).toContain('\n2. (다시 도전) 문제 2')
    const prompt = w.models.at(-1)!
    expect(prompt.split('칸: 풀이 보고 풀기').length - 1).toBe(1)
    expect(prompt).toContain('1. git push — git push 설명\n')
    expect(prompt).toContain('\n   칸: 풀이 보고 풀기\n2. git fetch — git fetch 설명\n')
    expect(w.budgets.at(-1)).toBe(4600)
  })

  test('(4/7 검토) a miss at a branch\'s count whose notes cannot be read when its line is drawn: the grade and its line as with none promised, in the pane and drawn again', async ($, on) => {
    // metInTs's world, the notes' read refused once the quiz is made.
    const store = withFiller(new Map<string, unknown>([['slips', { 'c:클로저': { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 1 } }]]))
    let isUnread = false
    on('store.get', { key: 'history' }, (_$, e, next) => (isUnread ? { deny: 'learn-notes: $.store.get: the store could not be read' } : next(e)))
    const w = world(on, 'ok', null, true, store)
    w.harness = { workedAfterTimes: 2 }
    await start($)
    w.answer = QUOTED_NOTE(['클로저'])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    const ui = await quizIn($, w, [plainQ(1), plainQ(2)].join('\n'))
    isUnread = true
    await answer(ui, w, mineKey(store, 0), '전역에 남아요', missed())
    expect(slipsOf(store)['c:클로저']).toMatchObject({ times: 2 })
    expect(await ui.find({ type: 'Text', text: /^같은 곳을 또 헷갈렸습니다/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /풀이부터/ })).toBeUndefined()
    await ui.unmount()
    const again = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    expect(await again.find({ type: 'Text', text: /^같은 곳을 또 헷갈렸습니다/ })).toBeDefined()
    expect(await again.find({ type: 'Text', text: /풀이부터/ })).toBeUndefined()
    await again.unmount()
    // In the conversation too: the second question missed (no branch's count), then read again.
    w.answer = missed('채운다고 봄')
    expect((await learn($, '퀴즈 2 틀린 답')).text).toContain('2번 ✗ 틀림')
  })

  test('(4/7 검토) /learn 진단 with the notes unreadable: no base counted before a worked example, the rest of it as ever', async ($, on) => {
    let isUnread = false
    on('store.get', { key: 'history' }, (_$, e, next) => (isUnread ? { deny: 'learn-notes: $.store.get: the store could not be read' } : next(e)))
    // 클로저 met in counter.js by a note (1.10.0 G4: a base counted before the code branch's worked example alone).
    const store = metInCode(plainStore(['클로저'], 2, { base: conceptKey('변수 범위') }), '클로저')
    const w = world(on, 'ok', null, true, store)
    w.harness = { workedAfterTimes: 2, isBaseAsked: true }
    await start($)
    expect((await learn($, '진단')).text).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 1\n')
    isUnread = true
    expect((await learn($, '진단')).text).toContain('· 열린 채 두 번 이상 1 · 바탕 개념 0\n')
  })

  test('(4/7 검토) a concept the index no longer holds: a miss at a branch\'s count promises no worked example, and /learn 진단 counts no base before it', async ($, on) => {
    const store = plainStore(['상대 경로'], 1, { base: conceptKey('변수 범위') })
    const w = world(on, 'ok', null, true, store)
    w.harness = { ...WORKED_BOTH, isBaseAsked: true }
    await start($)
    w.answer = [plainQ(1), plainQ(2)].join('\n')
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    // Gone from the index (another window's note rewritten without it), then missed: its slip kept, nothing promised.
    const { [conceptKey('상대 경로')]: gone, ...rest } = store.get('concepts') as Record<string, unknown>
    expect(gone).toBeDefined()
    store.set('concepts', rest)
    await start($)
    w.answer = missed()
    const reply = (await learn($, '퀴즈 1 틀린 답')).text ?? ''
    expect(slipsOf(store)[conceptKey('상대 경로')]).toMatchObject({ times: 2 })
    expect(reply).not.toContain('풀이부터')
    const diag = (await learn($, '진단')).text ?? ''
    expect(diag).toContain('· 바탕 개념 0\n')
  })

  test('(4/7 검토) each grade\'s line found for that grade: a concept graded again in the same turn, its quiz since of one (the rest known), is promised no worked example the second time', async ($, on) => {
    const store = plainStore(['클로저'], 1)
    const w = world(on, 'ok', null, true, store)
    w.harness = WORKED_BOTH
    await start($)
    w.answer = [plainQ(1), plainQ(2)].join('\n')
    await learn($, '퀴즈 새로')
    w.answer = missed()
    expect((await learn($, '퀴즈 1 틀린 답')).text).toContain('\n같은 곳을 또 헷갈렸습니다 · 다음 복습 퀴즈는 풀이부터 보여 줍니다\n')
    // No turn between: the filler known, the next quiz is of 클로저 alone (asked again, D33 (3)), and its miss promises none.
    expect((await learn($, '안다 채움')).text).toContain('채움')
    await w.clock.advance(60_000)
    w.answer = plainQ(1)
    expect((await learn($, '퀴즈 새로')).text).toContain('\n1. (다시 도전) 문제 1')
    w.answer = missed()
    const second = (await learn($, '퀴즈 1 틀린 답')).text ?? ''
    expect(slipsOf(store)[conceptKey('클로저')]).toMatchObject({ times: 3 })
    expect(second).toContain('\n같은 곳을 또 헷갈렸습니다\n')
    expect(second).not.toContain('풀이부터')
  })
})

describe('1.10.0: 바탕 개념 (G4) behind its switch: each concept marked first, only at a code-branch concept\'s first grade asked again, never in a quiz shape its samples did not measure', () => {
  const DAY = 86_400_000
  const WHAT = '함수가 끝나면 바깥 변수도 사라진다고 봄'
  const X = '클로저'
  const B = '변수 범위'
  const D = '비동기'
  const F = '배열'
  /** The concepts a grade of X lists (1.9.0 F5, baseCandidates): each sharing counter.js with it, the latest met first. */
  const LIST = `## 학습자가 전에 배운 개념\n1. ${D}\n2. ${F}\n3. ${B}\n`
  const MARKS = '바탕 점검: 1 없음, 2 없음, 3 틀림'
  /** A grade short of right with no question asked back, its base the third listed (변수 범위), each concept marked by `marks`. */
  const graded = (marks = MARKS, said = '3') =>
    ['판정: 틀림', '피드백: 아닙니다.', `헷갈린 점: ${WHAT}`, ...(marks !== '' ? [marks] : []), '바탕 근거: `let c = 1; { let c = 2 }; console.log(c)` → 2 → 1', `바탕: ${said}`, '유형: 변수 범위'].join('\n')
  const plainQ = (n: number, text = '문제') => [`T${n}: 예측`, `Q${n}: ${text} ${n}`, `A${n}: 답 ${n}`].join('\n')
  const hinted = (n: number) => [`T${n}: 예측`, `Q${n}: 문제 ${n}`, `H${n}: 힌트 ${n}`, `A${n}: 답 ${n}`].join('\n')
  const worked = (n: number) =>
    [`T${n}: 예측`, `Q${n}: 풀이: \`let n = 0; const up = () => ++n; up()\` 뒤 n은 1입니다.`, '이제 풀어 보세요: `let c = 10; const add = () => ++c; add()` 뒤 c는?', `H${n}: 바깥 c`, `A${n}: 11`].join('\n')
  type Row = { what: string; type: string; question: string; mine: string; at: number; times: number; base?: string }
  const slipsOf = (store: Map<string, unknown>) => (store.get('slips') ?? {}) as Record<string, Row>
  const quizItems = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
  /** The code branch at two, bases asked (a harness's flat keys: no level looked at, the route's job). */
  const ON = { workedAfterTimes: 2, isBaseAsked: true }
  /**
   * X met after B, D and F, all in counter.js, X by a note that wrote it, its words quoting a line of it (metInCode, the
   * code branch) unless `inCode` is false (met in no note, `file` none) or `file` names another file; X gone over three
   * days ago, its slip kept two days ago (asked again: 다시 도전), D due, F in six days, B in nine.
   */
  const storeOf = (slip: Partial<Row> = {}, { inCode = true, file = 'counter.js', more = {} as Record<string, { step: number; ago: number; first: number }> } = {}) => {
    const rows: Record<string, { step: number; ago: number; first: number }> = {
      [X]: { step: 1, ago: 3, first: 30 },
      [B]: { step: 3, ago: 5, first: 60 },
      [D]: { step: 0, ago: 2, first: 40 },
      [F]: { step: 2, ago: 1, first: 50 },
      ...more,
    }
    const concepts = Object.fromEntries(
      Object.entries(rows).map(([name, one]) => [
        conceptKey(name),
        { name, count: 2, firstAt: NOW - one.first * DAY, lastAt: NOW - one.first * DAY, blurb: name === X ? `${X} 설명 — ${D} · ${F} · ${B}와 함께 씁니다` : `${name} 설명`, files: name === X ? [] : ['counter.js'], step: one.step, reviewedAt: NOW - one.ago * DAY },
      ]),
    )
    const slips = { [conceptKey(X)]: { what: WHAT, type: 'scope', question: '지난 문제', mine: '전역 변수', at: NOW - 2 * DAY, times: 1, ...slip } }
    const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)], ['slips', slips]])
    return inCode ? metInCode(store, X, file) : store
  }
  /** A world on `store` started with `harness` (null: none, as shipped). */
  async function opened($: Engine, on: On, store: Map<string, unknown>, harness: Record<string, unknown> | null = ON) {
    const w = world(on, 'ok', null, true, store)
    w.harness = harness ?? undefined
    await start($)
    return w
  }
  /** The first grade of X asked again (the quiz's first question): its prompt and budget. */
  async function gradeX($: Engine, w: World, reply = graded(), mine = '전역에 남아요') {
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(w.store)[0]).toMatchObject({ name: X, isRetry: true })
    w.answer = reply
    const said = (await learn($, `퀴즈 1 ${mine}`)).text ?? ''
    return { said, prompt: w.models.at(-1)!, budget: w.budgets.at(-1)! }
  }
  /** A grade sent as 1.9.0 sends it with bases off: no list, no 바탕 lines, 480. */
  const asOff = (grade: { prompt: string; budget: number }) => {
    expect(grade.prompt).not.toContain('전에 배운 개념')
    expect(grade.prompt).not.toContain('바탕')
    expect(grade.budget).toBe(480)
  }

  for (const [marks, isKept] of [
    [MARKS, true],
    ['바탕 점검: 1 없음, 2 없음, 3 바름', false],
    ['바탕 점검: 1 없음, 2 없음, 3 없음', false],
    ['바탕 점검: 1 틀림, 2 없음, 3 없음', false],
    ['', false],
  ] as const) {
    test(`on (the code branch at two, bases asked): its grade lists the concepts with 880; 변수 범위 picked, ${marks || 'no 바탕 점검'}: ${isKept ? 'kept, promised, asked right before the worked example' : 'not kept nor promised, the worked example with no base'}`, async ($, on) => {
      const store = storeOf()
      const w = await opened($, on, store)
      const grade = await gradeX($, w, graded(marks))
      expect(grade.prompt).toContain(`## 이 학습자가 지난번에 헷갈린 점\n${WHAT}\n${LIST}## 학습자의 답\n`)
      expect(grade.prompt).toContain('\n바탕 점검: (위 번호마다 번호 다음에 틀림·바름·없음 중 하나를 써서 쉼표로 잇는다)\n')
      expect(grade.budget).toBe(880)
      expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 2 })
      expect(slipsOf(store)[conceptKey(X)]?.base).toBe(isKept ? conceptKey(B) : undefined)
      expect(quizItems(store)[0]!.slipBase).toBe(isKept ? conceptKey(B) : undefined)
      expect(grade.said).toContain(`\n같은 곳을 또 헷갈렸습니다 · ${isKept ? WORKED_BASE_NEXT : WORKED_NEXT}`)
      expect(grade.said).not.toContain(B)
      // The marks are kept nowhere: not in the quiz, the slips nor the bank.
      expect(JSON.stringify([store.get('quiz'), store.get('slips'), store.get('quizBank')])).not.toMatch(/바탕 점검|틀림, 2|→ 2 → 1/)
      await w.clock.advance(60_000)
      w.answer = isKept ? [plainQ(1, '바탕'), worked(2), plainQ(3)].join('\n') : [worked(1), plainQ(2), plainQ(3)].join('\n')
      await learn($, '퀴즈 새로')
      expect(quizItems(store).map(one => [one.name, one.isBase, one.rung])).toEqual(
        isKept
          ? [
              [B, true, undefined],
              [X, undefined, 'worked'],
              [D, undefined, undefined],
            ]
          : [
              [X, undefined, 'worked'],
              [D, undefined, undefined],
              [F, undefined, undefined],
            ],
      )
      expect(w.models.at(-1)).toContain('   칸: 풀이 보고 풀기 (js로)')
      expect(w.budgets.at(-1)).toBe(4600)
    })
  }

  test('a grade asked back first: the list and 880 on the first try, its marks read there; the try again 1.9.0\'s with 480, the first try\'s base kept', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store)
    const asked = ['판정: 거의', '피드백: 가까워요.', '되묻기: 안쪽 함수가 다시 불릴 때 c는 어디에 있을까요?', `헷갈린 점: ${WHAT}`, MARKS, '바탕 근거: `{ let c = 2 }` 밖의 c → 2 → 1', '바탕: 3', '유형: 변수 범위'].join('\n')
    const first = await gradeX($, w, asked)
    expect(first.prompt).toContain(LIST)
    expect(first.budget).toBe(880)
    expect(quizItems(store)[0]).toMatchObject({ firstTry: { slip: WHAT, slipBase: conceptKey(B) } })
    w.answer = '판정: 틀림\n피드백: 아직 아닙니다.'
    await learn($, '퀴즈 1 함수 안쪽 어딘가')
    asOff({ prompt: w.models.at(-1)!, budget: w.budgets.at(-1)! })
    expect(slipsOf(store)[conceptKey(X)]).toMatchObject({ times: 2, base: conceptKey(B) })
  })

  test('no list after "모르겠어요" (its hint shown, no call): the answer after it graded with the first try\'s lines, as 1.9.0, 480', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store)
    w.answer = [hinted(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    const calls = w.models.length
    await learn($, '퀴즈 1 모르겠어요')
    expect(w.models).toHaveLength(calls)
    w.answer = graded()
    await learn($, '퀴즈 1 전역에 남아요')
    expect(w.models.at(-1)).toContain('첫 답: (모르겠다고 했다)')
    asOff({ prompt: w.models.at(-1)!, budget: w.budgets.at(-1)! })
    expect(slipsOf(store)[conceptKey(X)]).not.toHaveProperty('base')
  })

  test('no list with the slip mended in another window since the quiz was made (none to read), nor for a slip with no words', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    store.set('slips', { [conceptKey(X)]: { ...slipsOf(store)[conceptKey(X)]!, fixedAt: NOW } })
    w.answer = graded()
    await learn($, '퀴즈 1 전역에 남아요')
    asOff({ prompt: w.models.at(-1)!, budget: w.budgets.at(-1)! })
    // A slip with no words (kept after "모르겠어요" last time), asked again the next minute: no list.
    store.set('slips', { [conceptKey(X)]: { what: '', type: 'blank', question: '지난 문제', mine: '모르겠어요', at: NOW - DAY, times: 1 } })
    await w.clock.advance(60_000)
    asOff(await gradeX($, w))
  })

  test('no list for a concept met in no code (the plain branch\'s worked example, on here too), nor in jsx (no branch\'s): and no base promised', async ($, on) => {
    const store = storeOf({}, { inCode: false })
    const w = await opened($, on, store, { ...WORKED_BOTH, isBaseAsked: true })
    const grade = await gradeX($, w)
    asOff(grade)
    expect(grade.said).toContain(`\n같은 곳을 또 헷갈렸습니다 · ${WORKED_NEXT}`)
  })

  test('no list for a concept met in a .jsx file (no branch\'s worked example)', async ($, on) => {
    const w = await opened($, on, storeOf({}, { file: 'Counter.jsx' }), { ...WORKED_BOTH, isBaseAsked: true })
    const grade = await gradeX($, w)
    asOff(grade)
    expect(grade.said).not.toContain('풀이부터')
  })

  test('the code branch off (G1\'s Infinity), bases asked all the same: no list, no promise; a slip with a base from another window asked again with no base before it', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store, { isBaseAsked: true })
    const grade = await gradeX($, w)
    asOff(grade)
    expect(grade.said).not.toContain('풀이부터')
    store.set('slips', { [conceptKey(X)]: { ...slipsOf(store)[conceptKey(X)]!, base: conceptKey(B) } })
    await w.clock.advance(60_000)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isBase, one.rung, one.isRetry])[0]).toEqual([X, undefined, undefined, true])
    expect(quizItems(store).some(one => one.isBase)).toBe(false)
  })

  for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
    test(`a models row with the code branch and bases on, at ${level}: ${level === 'beginner' ? 'the list and 880' : 'no list, 480 (the route turns every switch off, D17)'}`, { options: { model: 'haiku', level } }, async ($, on) => {
      const w = await opened($, on, storeOf(), { models: { haiku: { ...ON } } })
      const grade = await gradeX($, w)
      if (level === 'beginner') {
        expect(grade.prompt).toContain(LIST)
        expect(grade.budget).toBe(880)
      } else {
        asOff(grade)
      }
    })
  }

  for (const model of ['haiku', 'sonnet'] as const) {
    test(`as shipped (${model}, no harness): a question asked again graded as 1.9.0 grades it, 480, no base kept though the reply names one with its mark`, { options: { model } }, async ($, on) => {
      const store = storeOf()
      const w = await opened($, on, store, null)
      const grade = await gradeX($, w)
      asOff(grade)
      expect(slipsOf(store)[conceptKey(X)]).not.toHaveProperty('base')
      expect(grade.said).not.toContain('풀이부터')
    })
  }

  test('both branches on, its words\' quote gone from its code after the promise (another note\'s words): the next quiz asks it again with no base, the promise missed once; /learn 진단 counts no base', async ($, on) => {
    const store = storeOf()
    const w = await opened($, on, store, { ...WORKED_BOTH, isBaseAsked: true })
    const grade = await gradeX($, w)
    expect(grade.budget).toBe(880)
    expect(grade.said).toContain(`\n같은 곳을 또 헷갈렸습니다 · ${WORKED_BASE_NEXT}`)
    expect((await learn($, '진단')).text).toContain('· 바탕 개념 1\n')
    // A note of this turn teaches it again in words that quote no line of its change (a.ts): no branch's worked example
    // (met in files, so not the plain one), the code the promise was made on found no more.
    w.answer = CONCEPT_NOTE([X])
    await turn($, () => $.tool.call(EDIT_A))
    await finish(w)
    await w.clock.advance(60_000)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    expect(quizItems(store).map(one => [one.name, one.isBase, one.rung, one.isRetry])[0]).toEqual([X, undefined, undefined, true])
    expect(quizItems(store).some(one => one.isBase)).toBe(false)
    expect((await learn($, '진단')).text).toContain('· 바탕 개념 0\n')
  })

  /** The quiz this world sends with `harness`, then with bases off and the rest as it was (a minute on): each request. */
  async function onThenOff($: Engine, on: On, store: Map<string, unknown>, harness: Record<string, unknown>) {
    const w = await opened($, on, store, harness)
    w.answer = [plainQ(1), plainQ(2), plainQ(3)].join('\n')
    await learn($, '퀴즈 새로')
    const first = { prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1)!, items: quizItems(store).map(one => [one.name, one.isBase]) }
    w.harness = { ...harness, isBaseAsked: false }
    await start($)
    await w.clock.advance(60_000)
    await learn($, '퀴즈 새로')
    return { on: first, off: { prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1)!, items: quizItems(store).map(one => [one.name, one.isBase]) } }
  }

  test('(D33 (4)) a team term left in the quiz with the base (비동기 a team term of another repository): no base, the worked example asked again; the request that of bases off to the byte', async ($, on) => {
    const store = storeOf({ times: 2, base: conceptKey(B) })
    store.set('teamTerms', { [conceptKey(D)]: [rootTag('/other')] })
    const both = await onThenOff($, on, store, ON)
    expect(both.on.items).toEqual([
      [X, undefined],
      [D, undefined],
      [F, undefined],
    ])
    expect(both.on.prompt).not.toContain('풀이 보고 풀기')
    expect({ prompt: both.on.prompt, maxTokens: both.on.maxTokens }).toEqual({ prompt: both.off.prompt, maxTokens: both.off.maxTokens })
    expect(both.on.maxTokens).toBe(3400)
  })

  test('(D33 (4)) another worked example first in the quiz (its slip older, missed three times): the base dropped, 클로저 asked again; the request that of bases off to the byte', async ($, on) => {
    // 함수: met in no code, missed three times running a week ago, no base: the plain branch's worked example, first.
    const store = storeOf({ times: 2, base: conceptKey(B) }, { more: { 함수: { step: 1, ago: 9, first: 70 } } })
    ;(store.get('concepts') as Record<string, { files: string[] }>)[conceptKey('함수')]!.files = []
    store.set('slips', { ...slipsOf(store), [conceptKey('함수')]: { what: '함수는 한 번만 부른다고 봄', type: 'other', question: '지난 문제', mine: '한 번', at: NOW - 7 * DAY, times: 3 } })
    const both = await onThenOff($, on, store, { ...WORKED_BOTH, isBaseAsked: true })
    expect(both.on.items).toEqual([
      ['함수', undefined],
      [X, undefined],
      [D, undefined],
    ])
    expect(both.on.prompt.split('   칸: 풀이 보고 풀기').length - 1).toBe(1)
    expect({ prompt: both.on.prompt, maxTokens: both.on.maxTokens }).toEqual({ prompt: both.off.prompt, maxTokens: both.off.maxTokens })
    expect(both.on.maxTokens).toBe(4600)
  })

  test('(D33 (4)) the shape its samples measured, beside it: the base right before the worked example; bases off, none', async ($, on) => {
    const both = await onThenOff($, on, storeOf({ times: 2, base: conceptKey(B) }), ON)
    expect(both.on.items).toEqual([
      [B, true],
      [X, undefined],
      [D, undefined],
    ])
    expect(both.on.prompt).toContain('   칸: 풀이 보고 풀기 (js로)')
    expect(both.off.items).toEqual([
      [X, undefined],
      [D, undefined],
      [F, undefined],
    ])
    expect(both.off.prompt).toContain('   칸: 풀이 보고 풀기 (js로)')
  })

  /**
   * `grade` (a grade of X: its request) in a world on `store` started with `harness` (and `team` as this repository's
   * team file), then again on the store as it was before, with bases off and the rest as it was: each grade's request,
   * the slip it left and the question as kept.
   */
  async function gradedThenOff(
    $: Engine,
    on: On,
    store: Map<string, unknown>,
    harness: Record<string, unknown>,
    grade: (w: World) => Promise<{ said?: string; prompt: string; budget: number }>,
    team?: string,
  ) {
    const was = JSON.stringify([...store])
    const w = world(on, 'ok', null, true, store)
    if (team !== undefined) w.files.set('/proj/.claude/learn-notes.md', team)
    const kept = async () => ({ ...(await grade(w)), slip: slipsOf(store)[conceptKey(X)], item: quizItems(store)[0] })
    w.harness = harness
    await start($)
    const first = await kept()
    store.clear()
    for (const [key, value] of JSON.parse(was) as [string, unknown][]) store.set(key, value)
    w.harness = { ...harness, isBaseAsked: false }
    await start($)
    return { on: first, off: await kept() }
  }

  test('(5/7 검토) a concept this repository\'s team file names as a term, met in code, no team mark for it in the store, asked again in /learn 퀴즈 팀 (team: true): no list, 480, its request and reading those of bases off to the byte; no base kept', async ($, on) => {
    const team = `# 팀\n\n## 용어\n- **${X}**: 우리 팀이 세는 함수에 쓰는 말\n`
    const both = await gradedThenOff(
      $,
      on,
      storeOf(),
      ON,
      async w => {
        w.answer = plainQ(1)
        await learn($, '퀴즈 팀')
        expect(quizItems(w.store)[0]).toMatchObject({ name: X, team: true, isRetry: true })
        // No team mark for it in the store: its code branch's count is found (aftersNow), so only the question's own team
        // keeps the list off.
        expect(w.store.get('teamTerms') ?? {}).toEqual({})
        w.answer = graded()
        await learn($, '퀴즈 1 전역에 남아요')
        return { prompt: w.models.at(-1)!, budget: w.budgets.at(-1)! }
      },
      team,
    )
    asOff(both.on)
    expect(both.on).toEqual(both.off)
    expect(both.on.slip).toMatchObject({ times: 2 })
    expect(both.on.slip).not.toHaveProperty('base')
  })

  test('(5/7 검토) no concept learned before it to list (met before every other), every other condition holding: no list, 480, its request and reading (바탕 lines in the reply too) those of bases off to the byte; no base kept', async ($, on) => {
    const store = storeOf()
    ;(store.get('concepts') as Record<string, { firstAt: number }>)[conceptKey(X)]!.firstAt = NOW - 100 * DAY
    const both = await gradedThenOff($, on, store, ON, w => gradeX($, w))
    asOff(both.on)
    expect(both.on).toEqual(both.off)
    // Read as 1.8.0 reads a reply it asked no base of: the 바탕 lines are the question's slip's words, no base, no mark kept.
    expect(both.on.item?.slip).toContain(MARKS)
    expect(both.on.slip).not.toHaveProperty('base')
    expect(both.on.item).not.toHaveProperty('slipBase')
    expect(both.on.said).toContain(`\n같은 곳을 또 헷갈렸습니다 · ${WORKED_NEXT}`)
  })
})

describe('1.10.0: 처음 보는 코드 (G3) behind its switch: its prediction graded line by line by a window whose rung is on, 1.9.0\'s grade in any other; its own code check; a 1.8 or 1.9 window keeps it off', () => {
  const DAY = 86_400_000
  const NAME = CHECK_ITEM_110.name
  const OTHER = '구조 분해'
  const MINE = CHECK_MINE_110
  const HINT = '하나씩 더해 보세요'
  const NEW_MISS = '처음 보는 코드는 틀려도 한 단계만 내려갑니다'
  const RIGHT = '판정: 맞음\n피드백: 정확합니다.'
  const WRONG_FIRST = CHECK_FIRSTS_110.wrong!
  const PARTIAL_FIRST = CHECK_FIRSTS_110.partial!
  /** A grade of the prediction as an exact grade is asked for it: its 대조 line, then 거의 (which it does not offer) and a question back. */
  const NUDGED = ['대조: 1줄 같음, 2줄 다름', '판정: 거의', `피드백: ${WRONG_FIRST.feedback}`, `되묻기: ${WRONG_FIRST.nudge}`, '헷갈린 점: 배열 길이를 마지막 값으로 봄', '유형: 경계값'].join('\n')
  const OTHER_Q = '아래 코드의 b는 무엇일까요?\n```js\nconst { a, b } = { a: 1, b: 2 }\nconsole.log(b)\n```'
  const conceptOf = (store: Map<string, unknown>, name: string) => (store.get('concepts') as Record<string, { step?: number; missedAt?: number }>)[conceptKey(name)]!
  const itemsOf = (store: Map<string, unknown>) => (store.get('quiz') as { items: Record<string, unknown>[] }).items
  /**
   * NAME at its fifth step a month on, OTHER at its second; a quiz another window made (or this one, before): NAME's
   * question in code never seen as a prediction (CHECK_ITEM_110; or of `kind`, none for null), OTHER's in its own code.
   */
  const storeOf = (kind: 'predict' | 'why' | 'modify' | null = 'predict') => {
    const concepts = {
      [conceptKey(NAME)]: { name: NAME, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${NAME} 설명`, files: ['a.ts'], step: 4, reviewedAt: NOW - 31 * DAY },
      [conceptKey(OTHER)]: { name: OTHER, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${OTHER} 설명`, files: ['b.js'], step: 1, reviewedAt: NOW - 3 * DAY },
    }
    const quiz = {
      at: NOW - 60_000,
      isRevealed: false,
      items: [
        { key: conceptKey(NAME), name: NAME, question: CHECK_ITEM_110.question, answer: CHECK_ITEM_110.answer, hint: HINT, ...(kind ? { kind } : {}), rung: 'new' },
        { key: conceptKey(OTHER), name: OTHER, question: OTHER_Q, answer: '2', hint: '중괄호 안을 보세요', kind: 'predict', rung: 'mine' },
      ],
    }
    return new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)], ['quiz', quiz]])
  }
  /** A window on storeOf(kind) whose build runs with `harness` (none: as shipped), its model calls caught. */
  async function opened($: Engine, on: On, harness: Record<string, unknown> | null, kind: 'predict' | 'why' | 'modify' | null = 'predict') {
    const calls = routeCalls(on)
    const store = storeOf(kind)
    const w = world(on, 'ok', null, true, store)
    if (harness) w.harness = harness
    await start($)
    return { w, store, calls }
  }

  test('on (a harness\'s 4): the prediction graded line by line, the design\'s preview to the byte at 480 and 60000; 거의 with a question back read 틀림: the head red ✗, not △; the 대조 line kept nowhere; the same quiz\'s 내 코드 question 1.9.0\'s', async ($, on) => {
    const { w, store, calls } = await opened($, on, { rungNewStep: 4 })
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    await ui.press({ key: 'view-quiz' })
    w.answer = NUDGED
    await ui.input({ key: mineKey(store, 0), text: MINE })
    await w.clock.settle()
    expect(calls.at(-1)).toEqual({ model: 'haiku', effort: 'low', system: CHECK_SYSTEM, prompt: NEW_EXACT_110['none · beginner'], maxTokens: 480, timeoutMs: 60_000 })
    expect((await ui.find({ type: 'Text', text: '✗ 아직입니다 · 한 번 더 떠올려 보세요' }))?.props.color).toBe('red')
    expect(await ui.find({ type: 'Text', text: '△ 아직입니다 · 방향은 맞습니다' })).toBeUndefined()
    expect(itemsOf(store)[0]!.firstTry).toMatchObject({ mine: MINE, verdict: 'wrong', feedback: WRONG_FIRST.feedback, nudge: WRONG_FIRST.nudge })
    expect(JSON.stringify(store.get('quiz'))).not.toContain('2줄 다름')
    // Its try again, right: the preview's prompt with the first try 틀림; right, its step as it was.
    w.answer = RIGHT
    await ui.input({ key: `${mineKey(store, 0)}-again`, text: MINE })
    await w.clock.settle()
    expect(calls.at(-1)!.prompt).toBe(NEW_EXACT_110['wrong · beginner'])
    expect(itemsOf(store)[0]).toMatchObject({ result: 'right', rung: 'new' })
    expect(conceptOf(store, NAME).step).toBe(4)
    // The 내 코드 question of the same quiz: 1.9.0's grade, no 대조.
    w.answer = RIGHT
    await ui.input({ key: mineKey(store, 1), text: '2요' })
    await w.clock.settle()
    const other = itemsOf(store)[1]! as { name: string; question: string; answer: string; kind: 'predict' }
    expect(calls.at(-1)).toEqual({ model: 'haiku', effort: 'low', system: CHECK_SYSTEM, prompt: checkPrompt(other, '2요', 'beginner'), maxTokens: 480, timeoutMs: 60_000 })
    expect(calls.at(-1)!.prompt).not.toContain('대조')
    expect(calls.at(-1)!.prompt).toContain('판정은 셋 중 하나다.')
    await ui.unmount()
  })

  test('on: 거의 both times, read 틀림 each time: one step back, no missedAt, the sentence for code never seen; the try again\'s prompt the preview\'s', async ($, on) => {
    const { w, store, calls } = await opened($, on, { rungNewStep: 4 })
    w.answer = NUDGED
    expect((await learn($, `퀴즈 1 ${MINE}`)).text).toContain('1번 ✗ 아직입니다 · 한 번 더 떠올려 보세요 · ')
    w.answer = '대조: 1줄 같음, 2줄 다름\n판정: 거의\n피드백: 둘째 줄이 아직 다릅니다.'
    await learn($, `퀴즈 1 ${MINE}`)
    expect(calls.at(-1)!.prompt).toBe(NEW_EXACT_110['wrong · beginner'])
    expect(itemsOf(store)[0]).toMatchObject({ result: 'wrong', verdict: 'wrong', rung: 'new' })
    expect(conceptOf(store, NAME).step).toBe(3)
    expect(conceptOf(store, NAME).missedAt).toBeUndefined()
    w.answer = RIGHT
    expect((await learn($, '퀴즈 2 2요')).text).toContain(`${NEW_MISS}.`)
  })

  test('on: 모르겠어요, its hint, then an answer: graded line by line with the hint said and no question back (the preview\'s, to the byte)', async ($, on) => {
    const { w, store, calls } = await opened($, on, { rungNewStep: 4 })
    const count = calls.length
    expect((await learn($, '퀴즈 1 모르겠어요')).text).toContain(`힌트: ${HINT}`)
    expect(calls).toHaveLength(count)
    w.answer = '대조: 1줄 같음, 2줄 다름\n판정: 틀림\n피드백: 둘째 줄이 다릅니다.\n헷갈린 점: 배열 길이를 마지막 값으로 봄\n유형: 경계값'
    await learn($, `퀴즈 1 ${MINE}`)
    expect(calls.at(-1)!.prompt).toBe(NEW_EXACT_110['hint · beginner'])
    expect(itemsOf(store)[0]).toMatchObject({ result: 'wrong', rung: 'new' })
  })

  // D28: a window whose code never seen is off grades a question in it another window made as 1.9.0 graded it.
  for (const [what, options, harness] of [
    ['haiku as shipped (its row has it off)', { model: 'haiku' }, null],
    ['sonnet with only haiku\'s row turning it on', { model: 'sonnet' }, { models: { haiku: { rungNewStep: 4 } } }],
    ['haiku at intermediate, both rows turning it on', { model: 'haiku', level: 'intermediate' }, { models: { haiku: { rungNewStep: 4 }, sonnet: { rungNewStep: 4 } } }],
  ] as const) {
    test(`(D28) off, ${what}: a stored prediction in code never seen graded as 1.9.0 (fca5988) to the byte; 거의 kept as 거의, its head △ and one step back as in 1.9.0`, { options }, async ($, on) => {
      const level = 'level' in options ? options.level : 'beginner'
      const { w, store, calls } = await opened($, on, harness)
      w.answer = ['판정: 거의', `피드백: ${PARTIAL_FIRST.feedback}`, `되묻기: ${PARTIAL_FIRST.nudge}`].join('\n')
      expect((await learn($, `퀴즈 1 ${MINE}`)).text).toContain('1번 △ 아직입니다 · 방향은 맞습니다 · ')
      expect(calls.at(-1)).toEqual({ model: options.model, effort: 'low', system: CHECK_SYSTEM, prompt: CHECK_19[`predict · none · none · ${level}`], maxTokens: 480, timeoutMs: 60_000 })
      expect(itemsOf(store)[0]!.firstTry).toMatchObject({ mine: MINE, verdict: 'partial' })
      w.answer = '판정: 거의\n피드백: 둘째 줄이 아직 다릅니다.'
      await learn($, `퀴즈 1 ${MINE}`)
      expect(calls.at(-1)!.prompt).toBe(CHECK_19[`predict · partial · none · ${level}`])
      expect(itemsOf(store)[0]).toMatchObject({ result: 'wrong', verdict: 'partial', rung: 'new' })
      expect(conceptOf(store, NAME).step).toBe(3)
      expect(conceptOf(store, NAME).missedAt).toBeUndefined()
    })
  }

  test('(6/7 검토) its first try graded 거의 by a window with it off (haiku as shipped), its try again in one with it on (a harness\'s 4): the measured try again\'s request to the byte, its first try said 틀림 and 거의 said once; 거의 again read 틀림: one step back', async ($, on) => {
    const { w, store, calls } = await opened($, on, null)
    w.answer = ['판정: 거의', `피드백: ${WRONG_FIRST.feedback}`, `되묻기: ${WRONG_FIRST.nudge}`].join('\n')
    expect((await learn($, `퀴즈 1 ${MINE}`)).text).toContain('1번 △ 아직입니다 · 방향은 맞습니다 · ')
    expect(calls.at(-1)!.prompt).toBe(CHECK_19['predict · none · none · beginner'])
    expect(itemsOf(store)[0]!.firstTry).toMatchObject({ mine: MINE, verdict: 'partial', feedback: WRONG_FIRST.feedback, nudge: WRONG_FIRST.nudge })
    // The same store in a window whose code never seen is on (another model's, or after /config): the try again.
    w.harness = { rungNewStep: 4 }
    await start($)
    w.answer = '대조: 1줄 같음, 2줄 다름\n판정: 거의\n피드백: 둘째 줄이 아직 다릅니다.'
    await learn($, `퀴즈 1 ${MINE}`)
    expect(calls.at(-1)).toEqual({ model: 'haiku', effort: 'low', system: CHECK_SYSTEM, prompt: NEW_EXACT_110['wrong · beginner'], maxTokens: 480, timeoutMs: 60_000 })
    expect(calls.at(-1)!.prompt.match(/거의/g)).toHaveLength(1)
    expect(itemsOf(store)[0]).toMatchObject({ result: 'wrong', verdict: 'wrong', rung: 'new' })
    expect(JSON.stringify(store.get('quiz'))).not.toContain('2줄 다름')
    expect(conceptOf(store, NAME).step).toBe(3)
    expect(conceptOf(store, NAME).missedAt).toBeUndefined()
  })

  // Only a prediction is graded line by line (isExactGrade): one in code never seen asked otherwise, in a window with it on, as 1.9.0.
  for (const kind of ['why', 'modify', null] as const) {
    test(`(6/7 검토) on (a harness's 4), a stored question in code never seen asked ${kind ?? 'with no kind'}: graded and read as 1.9.0 (fca5988) to the byte; 거의 kept as 거의, its head △; a 대조: line the feedback's`, async ($, on) => {
      const { w, store, calls } = await opened($, on, { rungNewStep: 4 }, kind)
      w.answer = ['판정: 거의', `피드백: ${WRONG_FIRST.feedback}`, '대조: 1줄 같음, 2줄 다름', `되묻기: ${WRONG_FIRST.nudge}`].join('\n')
      expect((await learn($, `퀴즈 1 ${MINE}`)).text).toContain('1번 △ 아직입니다 · 방향은 맞습니다 · ')
      expect(calls.at(-1)).toEqual({ model: 'haiku', effort: 'low', system: CHECK_SYSTEM, prompt: CHECK_19[`${kind ?? 'none'} · none · none · beginner`], maxTokens: 480, timeoutMs: 60_000 })
      expect(itemsOf(store)[0]!.firstTry).toMatchObject({ mine: MINE, verdict: 'partial', feedback: `${WRONG_FIRST.feedback}\n대조: 1줄 같음, 2줄 다름`, nudge: WRONG_FIRST.nudge })
      // Its try again: 1.9.0's, the first try 거의; 거의 again kept as 거의 (both tries short of right), one step back.
      w.answer = '판정: 거의\n피드백: 둘째 줄이 아직 다릅니다.'
      await learn($, `퀴즈 1 ${MINE}`)
      expect(calls.at(-1)!.prompt).toBe(checkPrompt(itemsOf(store)[0] as never, MINE, 'beginner', { mine: MINE, verdict: 'partial', feedback: `${WRONG_FIRST.feedback}\n대조: 1줄 같음, 2줄 다름`, nudge: WRONG_FIRST.nudge }))
      expect(calls.at(-1)!.prompt).toContain('\n첫 판정: 거의\n')
      expect(itemsOf(store)[0]).toMatchObject({ result: 'wrong', verdict: 'partial', rung: 'new' })
      expect(conceptOf(store, NAME).step).toBe(3)
    })
  }

  /** A quiz reply whose first question shows code: its rung kept as asked (one with no code is a why, as in 1.9.0). */
  const QUIZ_REPLY = ['T1: 예측', 'Q1: 아래 코드는 무엇을 찍을까요?', '```js', 'let s = 0', 'for (const x of [3, 4]) s += x', 'console.log(s)', '```', 'H1: 하나씩 더해 보세요', 'R1: s는 3, 다시 7', 'A1: 7'].join('\n')
  /** Two concepts met in no note and not due for weeks: they fill a quiz to three picks (D33). */
  const FILLERS = ['채움 하나', '채움 둘']
  /** NAME due at its fifth step, met in a note's code (a.ts by EDIT_A, or `write` a file of its own), with `fillers`; the quiz this world sends. */
  async function quizOf($: Engine, on: On, harness: Record<string, unknown> | null, setup: (w: World, store: Map<string, unknown>) => void = () => {}, fillers = FILLERS, write?: { path: string; content: string }) {
    const concepts = Object.fromEntries([
      [conceptKey(NAME), { name: NAME, count: 2, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${NAME} 설명 — \`for (const n of nums)\``, files: [], step: 4, reviewedAt: NOW - 31 * DAY }],
      ...fillers.map(name => [conceptKey(name), { name, count: 1, firstAt: NOW - 200 * DAY, lastAt: NOW - 200 * DAY, blurb: `${name} 설명`, files: [], step: 3, reviewedAt: NOW }]),
    ])
    const store = new Map<string, unknown>([['stepsFrom', 0], ['concepts', concepts], ['steps', ownSteps(concepts as never)]])
    const w = world(on, 'ok', null, true, store)
    if (harness) w.harness = harness
    setup(w, store)
    await start($)
    w.answer = CONCEPT_NOTE([NAME])
    await turn($, () => (write ? $.tool.call({ tool: 'Write', tool_use_id: 'w1', file_path: write.path, content: write.content }) : $.tool.call(EDIT_A)))
    await finish(w)
    w.answer = QUIZ_REPLY
    await learn($, '퀴즈 새로')
    return { w, store, prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1)! }
  }

  for (const [v, isOpen] of [
    ['1.9.0', true],
    ['1.8.0', true],
    ['1.10.0', false],
  ] as const) {
    test(`on, a ${v} window stamped 20 minutes ago: ${isOpen ? 'asked in its own code, no sentence for code never seen (NEW_GRADER_SINCE)' : 'nothing kept off, asked in code never seen'}`, async ($, on) => {
      const { prompt, maxTokens } = await quizOf($, on, { rungNewStep: 4 }, (_w, store) => store.set('sessions', { 'session-other': { v, at: NOW - 20 * 60_000 } }))
      expect(prompt.includes('   칸: 처음 보는 코드 (ts로)')).toBe(!isOpen)
      expect(prompt.includes('처음 보는 코드:')).toBe(!isOpen)
      expect(prompt.includes(`1. ${NAME} — `)).toBe(true)
      expect(prompt.includes('\n   칸: 내 코드\n   학습자가 만든 코드 (a.ts):')).toBe(isOpen)
      expect(maxTokens).toBe(isOpen ? 3400 : 4600)
    })
  }

  /** The quiz this world sends again with code never seen off (the harness's null), a minute on: its prompt and cap. */
  async function offAgain($: Engine, w: World) {
    w.harness = { rungNewStep: null }
    await start($)
    await w.clock.advance(60_000)
    const count = w.budgets.length
    w.answer = QUIZ_REPLY
    await learn($, '퀴즈 새로')
    expect(w.budgets.length).toBe(count + 1)
    return { prompt: w.models.at(-1)!, maxTokens: w.budgets.at(-1)! }
  }

  for (const [what, picks] of [
    ['of three with a team term in it', 3],
    ['of two', 2],
  ] as const) {
    test(`(D33) on (a harness's 4), a quiz ${what}: each in its own code, the prompt and cap those of it off to the byte`, async ($, on) => {
      const team = ['## 용어', '- **캐시 키**: 요청마다 캐시를 나누는 이름입니다', ''].join('\n')
      const setup = (w: World) => (picks === 3 ? w.files.set('/proj/.claude/learn-notes.md', team) : undefined)
      const onRun = await quizOf($, on, { rungNewStep: 4 }, setup, picks === 3 ? FILLERS : FILLERS.slice(0, 1))
      expect(onRun.prompt.split(/^\d+\. /m).length - 1).toBe(picks)
      expect(onRun.prompt.includes('(팀 용어) 캐시 키')).toBe(picks === 3)
      expect(onRun.prompt).not.toContain('처음 보는 코드')
      const offRun = await offAgain($, onRun.w)
      expect({ prompt: onRun.prompt, maxTokens: onRun.maxTokens }).toEqual(offRun)
      expect(offRun.maxTokens).toBe(3400)
    })
  }

  const LINES = ['const nums = [1, 2]', 'for (const n of nums) console.log(n)', ...Array.from({ length: 14 }, (_, i) => `// line ${i + 1}`)]
  for (const isFetched of [true, false]) {
    test(`on: a concept due at its fifth step met in a file written whole ${isFetched ? 'whose lines call fetch( far from the lines quoted: asked in its own code (NEW_UNRUNNABLE, the change read whole)' : 'with no such call: asked in code never seen'}`, async ($, on) => {
      const last = isFetched ? "fetch('/log')" : "console.log('/log')"
      const { store, prompt } = await quizOf($, on, { rungNewStep: 4 }, () => {}, FILLERS, { path: '/proj/src/a.js', content: [...LINES, last, ''].join('\n') })
      expect(prompt.includes('\n   칸: 내 코드\n   학습자가 만든 코드 (a.js):')).toBe(isFetched)
      expect(prompt.includes('   칸: 처음 보는 코드 (js로)')).toBe(!isFetched)
      expect(prompt).not.toContain(last)
      expect(itemsOf(store)[0]!.rung).toBe(isFetched ? 'mine' : 'new')
    })
  }
})

describe('1.10.0: 생각해 보기 (G5) behind its switch: the line only under code with a run to follow and only in its closed form, the check\'s walk-through never kept, a bare value guessed; 1.9.0\'s requests with it off', () => {
  const HINT = 'i(영문 상태): 질문 칸에 답 적기 · 넘어가도 됩니다'
  const SHUT = '궁금한 것을 적고 Enter'
  const STEPS = '1. `itemTotal(1000, 2)`를 부르면 `qty`가 2라 검사를 지나고 2000을 돌려줍니다.'
  const SHAPED_Q = '`qty`를 `-1`로 바꾸면 최종 결과는 무엇이 될까요?'
  const SHAPED = `${STEPS}\n\n**생각해 보기:** ${SHAPED_Q}`
  const FREE = `${STEPS}\n\n**생각해 보기:** 수량이 음수면 어느 줄에서 멈출까요?`
  const TRACE_170 = traceQuestion(false)
  /** r's prompt under the code note while the switch is on: 1.9.0's with the line asked for after its words. */
  const CODE_ON = THINK19_R.code!.replace(`## 학습자의 질문\n${TRACE_170}\n`, `## 학습자의 질문\n${TRACE_170} ${THINK_ASK}\n`)
  type Ui = Awaited<ReturnType<typeof pane>>
  const hintsOf = async (ui: Pick<Ui, 'findAll'>) => (await ui.findAll({ type: 'Text' })).filter(one => one.text === HINT).map(one => one.text)
  const asksOf = (store: Map<string, unknown>) => (store.get('history') as Record<string, { notes: { asks?: { question: string; answer: string; at: number }[] }[] }>)['/proj']!.notes[0]!.asks ?? []

  for (const kind of Object.keys(THINK_CHANGES)) {
    test(`off (no harness) and on, r under a ${kind} note: 1.9.0's request to the byte${kind === 'code' ? ' off; on, the line asked for after its words' : ' in either state'}`, async ($, on) => {
      expect(await thinkAsked($, on, kind)).toEqual({ system: THINK19_SYSTEM, prompt: THINK19_R[kind], maxTokens: 900 })
    })
    test(`on (a harness), r under a ${kind} note: ${kind === 'code' ? 'the line asked for after 1.9.0\'s words, nothing else changed' : '1.9.0\'s request to the byte (no run to follow)'}`, async ($, on) => {
      const got = await thinkAsked($, on, kind, { isThinkAsked: true })
      expect(got).toEqual({ system: THINK19_SYSTEM, prompt: kind === 'code' ? CODE_ON : THINK19_R[kind], maxTokens: 900 })
    })
  }

  test('CODE_ON differs from 1.9.0\'s in the question alone', () => {
    expect(CODE_ON).not.toBe(THINK19_R.code)
    expect(CODE_ON.replace(` ${THINK_ASK}`, '')).toBe(THINK19_R.code)
  })

  for (const harness of [undefined, { isThinkAsked: true }]) {
    test(`the words '예시로 따라가기' typed in the field (${harness ? 'on' : 'off'}): sent as typed, as 1.9.0 sent them, never rebuilt as r's`, async ($, on) => {
      expect(await thinkAsked($, on, 'code', harness, '예시로 따라가기')).toEqual({ system: THINK19_SYSTEM, prompt: THINK19_TYPED, maxTokens: 900 })
    })
  }

  test('sonnet with only haiku\'s row turned on runs 1.9.0\'s r (its own row off)', { options: { model: 'sonnet' } }, async ($, on) => {
    expect(await thinkAsked($, on, 'code', { models: { haiku: { isThinkAsked: true } } })).toEqual({ system: THINK19_SYSTEM, prompt: THINK19_R.code, maxTokens: 900 })
  })

  test('haiku with its row turned on (a harness\'s models row) asks for the line under code; sonnet\'s row on leaves haiku 1.9.0\'s', { options: { model: 'haiku' } }, async ($, on) => {
    expect((await thinkAsked($, on, 'code', { models: { haiku: { isThinkAsked: true } } })).prompt).toBe(CODE_ON)
  })

  test('haiku with only sonnet\'s row turned on runs 1.9.0\'s r', { options: { model: 'haiku' } }, async ($, on) => {
    expect((await thinkAsked($, on, 'code', { models: { sonnet: { isThinkAsked: true } } })).prompt).toBe(THINK19_R.code)
  })

  /** A window on THINK_CHANGES' note `kind`, the pane up with the keys in it. */
  async function opened($: Engine, on: On, kind: string, harness?: Record<string, unknown>, asks?: { question: string; answer: string; at: number }[]) {
    const store = thinkStore(kind, asks)
    const w = world(on, 'ok', null, true, store)
    if (harness) w.harness = harness
    await start($)
    const ui = await pane($, 'terminal', { ...PANE_PROPS, isFocused: true })
    const trace = async (answer: string) => {
      w.answer = answer
      await ui.press({ key: 'trace' })
      await w.clock.settle()
    }
    const typed = async (text: string, reply: string) => {
      w.answer = reply
      await ui.input({ key: `ask-think-${kind}`, text })
      await w.clock.settle()
    }
    return { w, ui, store, trace, typed }
  }

  test('on: under code a free 생각해 보기 line is not kept (no dim line, a guess after it a plain question headed 질문); one in its closed form is kept and opens', async ($, on) => {
    const { w, ui, store, trace, typed } = await opened($, on, 'code', { isThinkAsked: true })
    await trace(FREE)
    expect(asksOf(store).at(-1)!.answer).toBe(STEPS)
    expect(await ui.find({ type: 'Markdown', text: STEPS })).toBeDefined()
    expect(await hintsOf(ui)).toEqual([])
    expect((await ui.find({ type: 'Input' }))!.props.placeholder).toBe(SHUT)
    await typed('2000이요', '네.')
    expect(w.systems.at(-1)).toBe(ASK_SYSTEM)
    expect(w.models.at(-1)).not.toContain("## 바로 앞 '예시로 따라가기'")
    expect(await ui.find({ type: 'Text', text: '질문 · 2000이요' })).toBeDefined()
    expect(w.files.get(JOURNAL) ?? '').not.toContain('(생각해 보기 뒤)')
    expect(w.files.get(JOURNAL) ?? '').not.toContain('어느 줄에서 멈출까요')
    await trace(SHAPED)
    expect(asksOf(store).at(-1)!.answer).toBe(SHAPED)
    expect(await hintsOf(ui)).toEqual([HINT])
    await ui.unmount()
  })

  test('on: under a stylesheet r\'s 생각해 보기 line goes, whatever its form', async ($, on) => {
    const { w, ui, store, trace } = await opened($, on, 'css', { isThinkAsked: true })
    await trace(SHAPED)
    expect(w.models.at(-1)).toBe(THINK19_R.css)
    expect(asksOf(store).at(-1)!.answer).toBe(STEPS)
    expect(await hintsOf(ui)).toEqual([])
    await ui.unmount()
  })

  test('off (a harness): r\'s answer is kept as it came, a free line too, and opens as in 1.9.0', async ($, on) => {
    const { ui, store, trace } = await opened($, on, 'code', { isThinkAsked: false })
    await trace(FREE)
    expect(asksOf(store).at(-1)!.answer).toBe(FREE)
    expect(await hintsOf(ui)).toEqual([HINT])
    await ui.unmount()
  })

  test('on: a bare value guessed is checked (THINK_SYSTEM, 900), its walk-through first in the form and never shown, kept or journaled; a question with a word is a question (ASK_SYSTEM, 900, the rule that the learner ran nothing)', async ($, on) => {
    const { w, ui, store, trace, typed } = await opened($, on, 'code', { isThinkAsked: true })
    await trace(SHAPED)
    const walk = '따라가기: `qty`가 -1이라 `qty < 0`이 참이 되어 에러를 던집니다.'
    await typed('97.5인가요?', `${walk}\n바른 결과: \`Error: 수량은 0 이상이어야 합니다\`\n판정: 틀림\n피드백: 음수 수량은 검사에서 멈춥니다.`)
    expect(w.systems.at(-1)).toBe(THINK_SYSTEM)
    expect(w.budgets.at(-1)).toBe(900)
    const prompt = w.models.at(-1)!
    expect(prompt).toContain(`## 생각해 보기 물음\n${SHAPED_Q}\n`)
    expect(prompt).toContain('## 학습자의 짐작\n97.5인가요?\n')
    expect(prompt).toContain('먼저 따라가기 줄에, 물음대로 입력을 바꿔 지금의 바뀐 코드를 위 따라가기처럼 한 단계씩 따라간 과정을 한 줄로 쓴다')
    expect(prompt.endsWith('따라가기: (바꾼 입력으로 한 단계씩, 한 줄)\n바른 결과: (값이나 동작 한 줄)\n판정: (맞음 · 거의 · 틀림 · 질문 중 하나)\n피드백: (두 문장 이내, 질문이면 세 문장 이내)')).toBe(true)
    const shown = '**아쉽지만 틀렸습니다.** 음수 수량은 검사에서 멈춥니다.\n\n바른 결과: `Error: 수량은 0 이상이어야 합니다`'
    expect(asksOf(store).at(-1)!.answer).toBe(shown)
    expect(await ui.find({ type: 'Markdown', text: shown })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '이어서 · 97.5인가요?' })).toBeDefined()
    // A reply out of form: shown as it came, its walk-through taken out; one that is all walk-through, as it came.
    await trace(SHAPED)
    await typed('2000?', `음수면 에러가 납니다.\n${walk}`)
    expect(w.systems.at(-1)).toBe(THINK_SYSTEM)
    expect(asksOf(store).at(-1)!.answer).toBe('음수면 에러가 납니다.')
    await trace(SHAPED)
    await typed('2000 나오나요?ㅠ', walk)
    expect(asksOf(store).at(-1)!.answer).toBe(walk)
    const journal = w.files.get(JOURNAL) ?? ''
    expect(journal.split('따라가기:')).toHaveLength(2)
    expect(journal).toContain(`**물음** (생각해 보기 뒤): 97.5인가요?\n\n${shown}\n`)
    // A question with a question word: a question, as 1.9.0 F6 answered one.
    await trace(SHAPED)
    await typed('꼭 0이어야 해요?', '아니요, 0 이상이면 됩니다.')
    expect(w.systems.at(-1)).toBe(ASK_SYSTEM)
    expect(w.budgets.at(-1)).toBe(900)
    expect(w.models.at(-1)).toContain(`생각해 보기: ${SHAPED_Q}\n학습자의 질문 칸 글은 이 생각해 보기 뒤에 적은 질문이다. 학습자는 이 코드를 실행하지 않았다.`)
    expect(asksOf(store).at(-1)!.answer).toBe('아니요, 0 이상이면 됩니다.')
    await ui.unmount()
  })

  for (const [isOn, head] of [[false, '이어서'], [true, '질문']] as const) {
    test(`a store with r's free line kept young (1.9.0 F6's kind), ${isOn ? 'on' : 'off'}: a question after it is headed ${head}, the asks as they were${isOn ? ', no dim line' : ''}`, async ($, on) => {
      const kept = [{ question: '예시로 따라가기', answer: FREE, at: NOW - 5 * 60_000 }, { question: '2000이요', answer: '맞습니다.', at: NOW - 4 * 60_000 }]
      const { ui, store } = await opened($, on, 'code', { isThinkAsked: isOn }, kept)
      expect(await ui.find({ type: 'Text', text: `${head} · 2000이요` })).toBeDefined()
      expect(asksOf(store)).toEqual(kept)
      await ui.unmount()
    })
    test(`a store with r's free line its last, kept young, ${isOn ? 'on: no dim line, a guess after it a plain question' : 'off: open to a guess, as 1.9.0'}`, async ($, on) => {
      const kept = [{ question: '예시로 따라가기', answer: FREE, at: NOW - 5 * 60_000 }]
      const { w, ui, typed } = await opened($, on, 'code', { isThinkAsked: isOn }, kept)
      expect(await hintsOf(ui)).toEqual(isOn ? [] : [HINT])
      await typed('2000이요', '맞습니다.')
      expect(w.models.at(-1)!.includes("## 바로 앞 '예시로 따라가기'")).toBe(!isOn)
      expect(await ui.find({ type: 'Text', text: `${head} · 2000이요` })).toBeDefined()
      await ui.unmount()
    })
  }
})
