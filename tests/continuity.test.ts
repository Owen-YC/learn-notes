import { describe, expect, test } from 'claude-code/testing'

import {
  QUOTA_YIELD,
  RESUME_MS,
  RETRY_JITTER_MS,
  RETRY_MS,
  failureText,
  faultLabel,
  isResumable,
  journalSection,
  modelCode,
  noteFailText,
  quotaOver,
  quotaWhy,
  retryText,
  transientOf,
} from '../hooks/notes'
import type { LearnNote } from '../types'

const NOW = Date.UTC(2026, 9, 3, 1)

describe('1.7.0: notes that do not get lost (D3)', () => {
  test('a busy server, a server error, a dropped connection and the call\'s own time limit are worth one try again', () => {
    expect(transientOf({ reason: 'api-error', status: 529, error: 'overloaded' })).toBe('overloaded')
    // A 529 the engine could not name is still a busy server.
    expect(transientOf({ reason: 'api-error', status: 529, error: 'unknown' })).toBe('overloaded')
    expect(transientOf({ reason: 'api-error', status: 500, error: 'server_error' })).toBe('server')
    expect(transientOf({ reason: 'api-error', status: 503, error: 'unknown' })).toBe('server')
    expect(transientOf({ reason: 'api-error', status: null, error: 'unknown' })).toBe('network')
    expect(transientOf({ reason: 'aborted', isTimeout: true })).toBe('timeout')
  })

  test('the shared request limit, a login, a bill, a bad request, a missing model, an empty reply or a cut call are not', () => {
    for (const error of ['rate_limit', 'authentication_failed', 'oauth_org_not_allowed', 'billing_error', 'account_on_hold', 'invalid_request', 'model_not_found', 'max_output_tokens']) {
      expect(transientOf({ reason: 'api-error', status: 500, error })).toBeUndefined()
      expect(transientOf({ reason: 'api-error', status: null, error })).toBeUndefined()
    }
    expect(transientOf({ reason: 'api-error', status: 429, error: 'rate_limit' })).toBeUndefined()
    expect(transientOf({ reason: 'api-error', status: 400, error: 'unknown' })).toBeUndefined()
    expect(transientOf({ reason: 'empty-reply' })).toBeUndefined()
    // Cut before its time ran out: a reload unloaded the call (the next load takes the note up instead).
    expect(transientOf({ reason: 'aborted' })).toBeUndefined()
  })

  test('the note says why it waits, and that w writes it at once', () => {
    expect(retryText('overloaded')).toBe('서버가 붐벼 30초 뒤 한 번 더 씁니다… · w로 바로 쓰기')
    expect(retryText('server')).toBe('서버 오류로 30초 뒤 한 번 더 씁니다… · w로 바로 쓰기')
    expect(retryText('network')).toBe('연결이 끊겨 30초 뒤 한 번 더 씁니다… · w로 바로 쓰기')
    expect(retryText('timeout')).toBe('시간이 너무 걸려 30초 뒤 한 번 더 씁니다… · w로 바로 쓰기')
    expect(RETRY_MS).toBe(30_000)
    expect(RETRY_JITTER_MS).toBeLessThanOrEqual(5_000)
  })

  test('a note that failed for good says its cause and what to do next', () => {
    const say = (fail: Parameters<typeof noteFailText>[0], model = 'haiku') => noteFailText(fail, model)
    expect(say({ reason: 'api-error', status: 529, error: 'overloaded' })).toBe('서버가 붐빕니다 · w로 다시 쓰기')
    expect(say({ reason: 'api-error', status: 502, error: 'server_error' })).toBe('서버 오류입니다 (502) · w로 다시 쓰기')
    expect(say({ reason: 'api-error', status: null, error: 'unknown' })).toBe('인터넷 연결을 확인하세요 · 연결되면 w로 다시 쓰기')
    expect(say({ reason: 'api-error', status: 429, error: 'rate_limit' })).toBe('요청 한도에 걸렸습니다 · 잠시 뒤 w로 다시 쓰기')
    expect(say({ reason: 'api-error', status: 401, error: 'authentication_failed' })).toBe('로그인이 필요합니다 (/login) · 로그인 뒤 w로 다시 쓰기')
    expect(say({ reason: 'api-error', status: 402, error: 'billing_error' })).toBe('계정의 사용 한도나 결제 문제입니다 · 관리자에게 알려 주세요')
    expect(say({ reason: 'api-error', status: 404, error: 'model_not_found' }, 'sonnet')).toBe("이 계정에서 'sonnet' 모델을 쓸 수 없습니다 · /config에서 haiku를 골라 보세요")
    // Haiku itself missing: another one.
    expect(say({ reason: 'api-error', status: 404, error: 'model_not_found' })).toBe("이 계정에서 'haiku' 모델을 쓸 수 없습니다 · /config에서 다른 모델을 골라 보세요")
    expect(say({ reason: 'api-error', status: 400, error: 'invalid_request' })).toBe('모델이 이 요청을 받지 않았습니다 · 계속되면 /learn 진단을 담당자에게 보내 주세요')
    expect(say({ reason: 'api-error', status: 418, error: 'unknown' })).toBe('API 오류 418 · w로 다시 쓰기')
    expect(say({ reason: 'empty-reply' })).toBe('모델이 빈 답을 보냈습니다 · w로 다시 쓰기')
    expect(say({ reason: 'aborted', isTimeout: true })).toBe('시간이 너무 걸려 멈췄습니다 · w로 다시 쓰기')
    expect(say({ reason: 'aborted' })).toBe('중간에 끊겨 멈췄습니다 · w로 다시 쓰기')
  })

  test('a quiz, a grade or a question that failed names the new causes too, in the words they had', () => {
    expect(failureText({ reason: 'api-error', status: 402, error: 'billing_error' })).toBe('계정의 사용 한도나 결제 문제입니다. 관리자에게 알려 주세요')
    expect(failureText({ reason: 'api-error', status: 404, error: 'model_not_found' }, 'sonnet')).toBe("이 계정에서 'sonnet' 모델을 쓸 수 없습니다. /config에서 haiku를 골라 보세요")
    expect(failureText({ reason: 'api-error', status: 404, error: 'model_not_found' })).toBe('이 계정에서 고른 모델을 쓸 수 없습니다. /config에서 haiku를 골라 보세요')
    expect(failureText({ reason: 'api-error', status: 400, error: 'invalid_request' })).toBe('모델이 이 요청을 받지 않았습니다. 계속되면 /learn 진단을 담당자에게 보내 주세요')
    expect(failureText({ reason: 'api-error', status: null, error: 'unknown' })).toBe('서버에 닿지 못했습니다. 인터넷 연결을 확인하세요')
    expect(failureText({ reason: 'api-error', status: 503, error: 'unknown' })).toBe('서버 오류입니다 (503). 잠시 뒤 다시 해 보세요')
    expect(failureText({ reason: 'api-error', status: 529, error: 'overloaded' })).toBe('서버가 붐빕니다. 잠시 뒤 다시 해 보세요')
    expect(failureText({ reason: 'aborted', isTimeout: true })).toBe('시간이 너무 걸려 멈췄습니다')
    expect(failureText({ reason: 'aborted' })).toBe('시간이 너무 걸리거나 중간에 끊겨 멈췄습니다')
  })

  test('a call its own time limit cut is kept as `timeout`, and /learn 진단 says so', () => {
    expect(modelCode({ reason: 'aborted', isTimeout: true })).toBe('timeout')
    expect(modelCode({ reason: 'aborted' })).toBe('aborted')
    expect(faultLabel('timeout')).toBe('시간 초과')
    expect(faultLabel('aborted')).toBe('시간 초과·끊김')
  })

  test('a reload takes up a note it left being written: this session\'s, once, within ten minutes of its turn', () => {
    const note = { status: 'writing' as const, isPast: false, at: NOW }
    expect(isResumable(note, NOW + 1000)).toBe(true)
    expect(isResumable(note, NOW + RESUME_MS - 1)).toBe(true)
    expect(isResumable(note, NOW + RESUME_MS)).toBe(false)
    expect(isResumable({ ...note, resumed: true }, NOW + 1000)).toBe(false)
    // One the store brought back is another session's, its write long over.
    expect(isResumable({ ...note, isPast: true }, NOW + 1000)).toBe(false)
    for (const status of ['ready', 'failed', 'off'] as const) expect(isResumable({ ...note, status }, NOW + 1000)).toBe(false)
    expect(RESUME_MS).toBe(10 * 60_000)
  })

  test('the automatic note yields past 90% of the five-hour window or 95% of the seven-day one; an API key has none', () => {
    expect(QUOTA_YIELD).toEqual({ five_hour: 90, seven_day: 95 })
    expect(quotaOver([{ kind: 'five_hour', percentUsed: 93 }])).toBe('five_hour')
    expect(quotaOver([{ kind: 'five_hour', percentUsed: 90 }])).toBe('five_hour')
    expect(quotaOver([{ kind: 'five_hour', percentUsed: 89.9 }])).toBeUndefined()
    expect(quotaOver([{ kind: 'five_hour', percentUsed: 40 }, { kind: 'seven_day', percentUsed: 96 }])).toBe('seven_day')
    expect(quotaOver([{ kind: 'seven_day', percentUsed: 94.9 }])).toBeUndefined()
    // Both past their marks: the five-hour one is named.
    expect(quotaOver([{ kind: 'seven_day', percentUsed: 99 }, { kind: 'five_hour', percentUsed: 99 }])).toBe('five_hour')
    // A gateway's spend limit is not one of these windows.
    expect(quotaOver([{ kind: 'spend_limit', percentUsed: 120 }])).toBeUndefined()
    expect(quotaOver([])).toBeUndefined()
    expect(quotaOver(undefined)).toBeUndefined()
    expect(quotaOver([null, 'x', { kind: 'five_hour' }, { kind: 'five_hour', percentUsed: '95' }])).toBeUndefined()
  })

  test('the note names the window it yielded to; an unknown one reads as the five-hour', () => {
    expect(quotaWhy('five_hour')).toBe('Claude 사용 한도(5시간)를 90% 넘게 써서 자동 노트를 미뤘습니다')
    expect(quotaWhy('seven_day')).toBe('Claude 사용 한도(7일)를 95% 넘게 써서 자동 노트를 미뤘습니다')
    expect(quotaWhy(undefined)).toBe('Claude 사용 한도(5시간)를 90% 넘게 써서 자동 노트를 미뤘습니다')
  })

  test('the journal says why a yielded note holds the code alone', () => {
    const note: LearnNote = {
      id: 'n1',
      turnId: 't1',
      at: NOW,
      prompt: '요청',
      answer: '',
      changes: [],
      moreFiles: 0,
      status: 'off',
      skip: 'quota',
      quota: 'five_hour',
      text: '',
      savedAs: null,
      isPast: false,
      concepts: [],
      root: '/proj',
      updatedAt: NOW,
    }
    expect(journalSection(note)).toContain('_Claude 사용 한도를 거의 다 써서 노트 없이 전후 코드만 남겼다._')
  })
})
