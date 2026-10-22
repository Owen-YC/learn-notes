/**
 * Stores learn-notes 1.5.1, 1.6.0, 1.7.0 and 1.8.0 left over one 1.9.0 wrote (1.9.0 F1, the writer's mark), made by
 * their own functions: each release's hooks/notes.ts (1.5.1 1fd938b, 1.6.0 c2eb62b, 1.7.0 3f2b4fb, 1.8.0 3690021)
 * run by a maintainer's probe outside CI, each window's read, change and write as its register.tsx does them. CI
 * reads this file alone (tests/coexist.test.ts, tests/flow.test.ts). Made again by the probe, never by hand.
 */
import type { LearnConcept } from '../../types'

/** A store as JSON: the concept index and its copies. */
export type CoexistStore = Record<string, unknown> & { concepts: Record<string, unknown> }
/** One old window's work over a store 1.9.0 wrote. */
export type CoexistCase = {
  id: string
  what: string
  by: '1.5.1' | '1.6.0' | '1.7.0' | '1.8.0'
  aliases: Record<string, string>
  /** The index 1.9.0 held, written at `at` into `before`. */
  index: Record<string, LearnConcept>
  at: number
  before: CoexistStore
  /** The store after the old window's write. */
  after: CoexistStore
  /** The index 1.8.0's own functions read from `after`. */
  read18: Record<string, LearnConcept>
}
/** (마): a 1.9.0 store read by each old build, and written over by each. */
export type CoexistMixed = {
  id: string
  what: string
  aliases: Record<string, string>
  index: Record<string, LearnConcept>
  at: number
  before: CoexistStore
  /** The store 1.8.0's storeIndex writes for the same index. */
  as18: CoexistStore
  /** Each build's read of `before` (of19) and of `as18` (of18). */
  reads: Record<string, { of19: Record<string, LearnConcept>; of18: Record<string, LearnConcept> }>
  /** Each build's write after counting a note over `before`, and 1.8.0's read of it. */
  rewrites: Record<string, CoexistStore>
  rereads18: Record<string, Record<string, LearnConcept>>
}

/** When 1.9.0 wrote, and when the old window did; the tests' clock stands at NOW. */
export const COEXIST_NOW = 1790989200000

export const COEXIST_CASES: CoexistCase[] = [{"id":"ga","what":"(가) 안다 표시가 0개인 저장소에서 1.5.1이 노트의 개념을 셈","by":"1.5.1","aliases":{},"index":{"c:map":{"name":"map","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"step":3},"c:클로저":{"name":"클로저","count":1,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"]}},"at":1790982000000,"before":{"stepsFrom":1773709200000,"schema":3,"known":{},"steps":{"c:map":[3,1790902800000]},"concepts":{"c:map":{"name":"map","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"step":3},"c:클로저":{"name":"클로저","count":1,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"]},"#w":1790982000000},"oldWrites":{"since":1790982000000,"n":0}},"after":{"stepsFrom":1773709200000,"schema":3,"known":{},"steps":{"c:map":[3,1790902800000]},"concepts":{"c:map":{"name":"map","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"step":3},"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"클로저 설명","files":["src/a.ts"]},"c:forof반복문":{"name":"for...of 반복문","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"for...of 반복문 설명","files":["src/a.ts"]}},"oldWrites":{"since":1790982000000,"n":0}},"read18":{"c:map":{"name":"map","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"step":3},"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"클로저 설명","files":["src/a.ts"]},"c:forof반복문":{"name":"for...of 반복문","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"for...of 반복문 설명","files":["src/a.ts"]}}},{"id":"na","what":"(나) 1.5.1 퀴즈가 노트 수로 단계를 줌","by":"1.5.1","aliases":{},"index":{"c:map":{"name":"map","count":4,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"]}},"at":1790982000000,"before":{"stepsFrom":1773709200000,"schema":3,"known":{},"steps":{},"concepts":{"c:map":{"name":"map","count":4,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"]},"#w":1790982000000},"oldWrites":{"since":1790982000000,"n":0}},"after":{"stepsFrom":1773709200000,"schema":3,"known":{},"steps":{},"concepts":{"c:map":{"name":"map","count":4,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790985600000,"step":4}},"oldWrites":{"since":1790982000000,"n":0}},"read18":{"c:map":{"name":"map","count":4,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790985600000,"step":1}}},{"id":"da","what":"(다) 1.6.0 /learn 모른다가 안다 표시를 지움","by":"1.6.0","aliases":{},"index":{"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"knownAt":1790557200000}},"at":1790982000000,"before":{"stepsFrom":1773709200000,"schema":3,"known":{"c:클로저":1790557200000},"steps":{},"concepts":{"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"knownAt":1790557200000},"#w":1790982000000},"oldWrites":{"since":1790982000000,"n":0}},"after":{"stepsFrom":1773709200000,"schema":3,"known":{},"steps":{},"concepts":{"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"]}},"oldWrites":{"since":1790982000000,"n":0}},"read18":{"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"]}}},{"id":"ra","what":"(라) 1.8.0 채점이 단계 2를 줌","by":"1.8.0","aliases":{},"index":{"c:map":{"name":"map","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":1}},"at":1790982000000,"before":{"stepsFrom":1773709200000,"schema":3,"known":{},"steps":{},"concepts":{"c:map":{"name":"map","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":1},"#w":1790982000000},"oldWrites":{"since":1790982000000,"n":0}},"after":{"stepsFrom":1773709200000,"schema":3,"known":{},"steps":{"c:map":[2,1790985600000]},"concepts":{"c:map":{"name":"map","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790985600000,"step":2}},"oldWrites":{"since":1790982000000,"n":0}},"read18":{"c:map":{"name":"map","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790985600000,"step":2}}},{"id":"ba","what":"(바) 1.7.0 /learn 안다가 안다 표시를 붙임","by":"1.7.0","aliases":{},"index":{"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"]},"c:map":{"name":"map","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2}},"at":1790982000000,"before":{"stepsFrom":1773709200000,"schema":3,"known":{},"steps":{"c:map":[2,1790298000000]},"concepts":{"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"]},"c:map":{"name":"map","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2},"#w":1790982000000},"oldWrites":{"since":1790982000000,"n":0}},"after":{"stepsFrom":1773709200000,"schema":3,"known":{"c:클로저":1790985600000},"steps":{"c:map":[2,1790298000000]},"concepts":{"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"knownAt":1790985600000},"c:map":{"name":"map","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2}},"oldWrites":{"since":1790982000000,"n":0}},"read18":{"c:클로저":{"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"knownAt":1790985600000},"c:map":{"name":"map","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"map 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2}}}]

export const COEXIST_MIXED: CoexistMixed = {
  "id": "ma",
  "what": "(마) 1.9.0이 쓴 저장소를 네 판이 읽고, 노트의 개념을 세어 다시 씀",
  "aliases": {
    "c:destructuring": "c:구조분해할당"
  },
  "index": {
    "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
    "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
    "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
    "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
    "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
    "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
    "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
    "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
    "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":2},
    "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
    "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000}
  },
  "at": 1790982000000,
  "before": {
    "stepsFrom": 1773709200000,
    "schema": 3,
    "aliases": {
      "c:destructuring": "c:구조분해할당"
    },
    "known": {
      "c:클로저": 1790557200000,
      "c:filter": 1790125200000,
      "c:화살표함수": 1790730000000,
      "c:구조분해할당": 1790643600000
    },
    "steps": {
      "c:클로저": [2,1790211600000],
      "c:s2": [2,1790730000000],
      "c:s3": [3,1790643600000],
      "c:s4": [4,1790557200000],
      "c:s5": [5,1790470800000],
      "c:화살표함수": [3,1790384400000],
      "c:구조분해할당": [2,1790298000000]
    },
    "concepts": {
      "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
      "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
      "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
      "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
      "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
      "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
      "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
      "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
      "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":2},
      "c:화살표함수": {"name":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
      "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000},
      "#w": 1790982000000
    },
    "oldWrites": {
      "since": 1790982000000,
      "n": 0
    }
  },
  "as18": {
    "stepsFrom": 1773709200000,
    "schema": 3,
    "aliases": {
      "c:destructuring": "c:구조분해할당"
    },
    "known": {
      "c:클로저": 1790557200000,
      "c:filter": 1790125200000,
      "c:화살표함수": 1790730000000,
      "c:구조분해할당": 1790643600000
    },
    "steps": {
      "c:클로저": [2,1790211600000],
      "c:s2": [2,1790730000000],
      "c:s3": [3,1790643600000],
      "c:s4": [4,1790557200000],
      "c:s5": [5,1790470800000],
      "c:화살표함수": [3,1790384400000],
      "c:구조분해할당": [2,1790298000000]
    },
    "concepts": {
      "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
      "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
      "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
      "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
      "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
      "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
      "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
      "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
      "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":2},
      "c:화살표함수": {"name":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
      "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000}
    }
  },
  "reads": {
    "1.5.1": {
      "of19": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":2},
        "c:화살표함수": {"name":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2}
      },
      "of18": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":2},
        "c:화살표함수": {"name":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2}
      }
    },
    "1.6.0": {
      "of19": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
        "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000}
      },
      "of18": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
        "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000}
      }
    },
    "1.7.0": {
      "of19": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
        "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000}
      },
      "of18": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
        "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000}
      }
    },
    "1.8.0": {
      "of19": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
        "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000}
      },
      "of18": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
        "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000}
      }
    }
  },
  "rewrites": {
    "1.5.1": {
      "stepsFrom": 1773709200000,
      "schema": 3,
      "aliases": {
        "c:destructuring": "c:구조분해할당"
      },
      "known": {
        "c:클로저": 1790557200000,
        "c:filter": 1790125200000,
        "c:화살표함수": 1790730000000,
        "c:구조분해할당": 1790643600000
      },
      "steps": {
        "c:클로저": [2,1790211600000],
        "c:s2": [2,1790730000000],
        "c:s3": [3,1790643600000],
        "c:s4": [4,1790557200000],
        "c:s5": [5,1790470800000],
        "c:화살표함수": [3,1790384400000],
        "c:구조분해할당": [2,1790298000000]
      },
      "concepts": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":3,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":2},
        "c:화살표함수": {"name":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2},
        "c:map": {"name":"map","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"map 설명","files":["src/a.ts"]}
      },
      "oldWrites": {
        "since": 1790982000000,
        "n": 0
      }
    },
    "1.6.0": {
      "stepsFrom": 1773709200000,
      "schema": 3,
      "aliases": {
        "c:destructuring": "c:구조분해할당"
      },
      "known": {
        "c:클로저": 1790557200000,
        "c:filter": 1790125200000,
        "c:화살표함수": 1790730000000,
        "c:구조분해할당": 1790643600000
      },
      "steps": {
        "c:클로저": [2,1790211600000],
        "c:s2": [2,1790730000000],
        "c:s3": [3,1790643600000],
        "c:s4": [4,1790557200000],
        "c:s5": [5,1790470800000],
        "c:화살표함수": [3,1790384400000],
        "c:구조분해할당": [2,1790298000000]
      },
      "concepts": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":3,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
        "c:화살표함수": {"name":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000},
        "c:map": {"name":"map","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"map 설명","files":["src/a.ts"]}
      },
      "oldWrites": {
        "since": 1790982000000,
        "n": 0
      }
    },
    "1.7.0": {
      "stepsFrom": 1773709200000,
      "schema": 3,
      "aliases": {
        "c:destructuring": "c:구조분해할당"
      },
      "known": {
        "c:클로저": 1790557200000,
        "c:filter": 1790125200000,
        "c:화살표함수": 1790730000000,
        "c:구조분해할당": 1790643600000
      },
      "steps": {
        "c:클로저": [2,1790211600000],
        "c:s2": [2,1790730000000],
        "c:s3": [3,1790643600000],
        "c:s4": [4,1790557200000],
        "c:s5": [5,1790470800000],
        "c:화살표함수": [3,1790384400000],
        "c:구조분해할당": [2,1790298000000]
      },
      "concepts": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":3,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
        "c:화살표함수": {"name":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000},
        "c:map": {"name":"map","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"map 설명","files":["src/a.ts"]}
      },
      "oldWrites": {
        "since": 1790982000000,
        "n": 0
      }
    },
    "1.8.0": {
      "stepsFrom": 1773709200000,
      "schema": 3,
      "aliases": {
        "c:destructuring": "c:구조분해할당"
      },
      "known": {
        "c:클로저": 1790557200000,
        "c:filter": 1790125200000,
        "c:화살표함수": 1790730000000,
        "c:구조분해할당": 1790643600000
      },
      "steps": {
        "c:클로저": [2,1790211600000],
        "c:s2": [2,1790730000000],
        "c:s3": [3,1790643600000],
        "c:s4": [4,1790557200000],
        "c:s5": [5,1790470800000],
        "c:화살표함수": [3,1790384400000],
        "c:구조분해할당": [2,1790298000000]
      },
      "concepts": {
        "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
        "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
        "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
        "c:s1": {"name":"s1","count":3,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
        "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
        "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
        "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
        "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
        "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
        "c:화살표함수": {"name":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
        "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000},
        "c:map": {"name":"map","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"map 설명","files":["src/a.ts"]}
      },
      "oldWrites": {
        "since": 1790982000000,
        "n": 0
      }
    }
  },
  "rereads18": {
    "1.5.1": {
      "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
      "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0},
      "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
      "c:s1": {"name":"s1","count":3,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
      "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
      "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
      "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
      "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
      "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
      "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
      "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000},
      "c:map": {"name":"map","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"map 설명","files":["src/a.ts"]}
    },
    "1.6.0": {
      "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
      "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
      "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
      "c:s1": {"name":"s1","count":3,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
      "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
      "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
      "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
      "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
      "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
      "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
      "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000},
      "c:map": {"name":"map","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"map 설명","files":["src/a.ts"]}
    },
    "1.7.0": {
      "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
      "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
      "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
      "c:s1": {"name":"s1","count":3,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
      "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
      "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
      "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
      "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
      "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
      "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
      "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000},
      "c:map": {"name":"map","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"map 설명","files":["src/a.ts"]}
    },
    "1.8.0": {
      "c:클로저": {"name":"클로저","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"클로저 설명","files":["src/a.ts"],"reviewedAt":1790211600000,"step":2,"knownAt":1790557200000},
      "c:filter": {"name":"filter","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"filter 설명","files":["src/a.ts"],"missedAt":1790816400000,"step":0,"knownAt":1790125200000},
      "c:s0": {"name":"s0","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s0 설명","files":["src/a.ts"],"reviewedAt":1790902800000,"missedAt":1790902800000,"step":0},
      "c:s1": {"name":"s1","count":3,"firstAt":1785805200000,"lastAt":1790985600000,"blurb":"s1 설명","files":["src/a.ts"],"reviewedAt":1790816400000,"step":1},
      "c:s2": {"name":"s2","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s2 설명","files":["src/a.ts"],"reviewedAt":1790730000000,"step":2},
      "c:s3": {"name":"s3","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s3 설명","files":["src/a.ts"],"reviewedAt":1790643600000,"step":3},
      "c:s4": {"name":"s4","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s4 설명","files":["src/a.ts"],"reviewedAt":1790557200000,"step":4},
      "c:s5": {"name":"s5","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"s5 설명","files":["src/a.ts"],"reviewedAt":1790470800000,"step":5},
      "c:notime": {"name":"no-time","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"no-time 설명","files":["src/a.ts"],"step":1},
      "c:화살표함수": {"name":"화살표 함수","fullName":"화살표 함수 (짧게 쓰는 함수 표현식)","count":2,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"화살표 함수 (짧게 쓰는 함수 표현식) 설명","files":["src/a.ts"],"reviewedAt":1790384400000,"step":3,"knownAt":1790730000000},
      "c:구조분해할당": {"name":"Destructuring","count":3,"firstAt":1785805200000,"lastAt":1787533200000,"blurb":"Destructuring 설명","files":["src/a.ts"],"reviewedAt":1790298000000,"step":2,"knownAt":1790643600000},
      "c:map": {"name":"map","count":1,"firstAt":1790985600000,"lastAt":1790985600000,"blurb":"map 설명","files":["src/a.ts"]}
    }
  }
}
