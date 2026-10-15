import { describe, expect, test } from 'claude-code/testing'

import { CHECK_SYSTEM, checkPrompt, isBlankAnswer, keptNudge, parseCheck, secondVerdict } from '../hooks/notes'

const ITEM = { name: '반복문 조건', question: '`for (let i = 0; i < 3; i++) console.log(i)`는 무엇을 찍을까요?', answer: '0 1 2', kind: 'predict' as const }

describe('1.7.0: a question asked back, and one try again (D4)', () => {
  test('a grade reads each labelled line on its own: the feedback ends where the question asked back begins', () => {
    const reply = ['판정: 거의', '피드백: 적은 대로라면 i가 3일 때도 찍혀야 합니다.', '되묻기: i가 3이 되면 `i < 3`은 참일까요?'].join('\n')
    expect(parseCheck(reply)).toEqual({ verdict: 'partial', feedback: '적은 대로라면 i가 3일 때도 찍혀야 합니다.', nudge: 'i가 3이 되면 `i < 3`은 참일까요?' })
    // Bold labels, a feedback on two lines, and the lines a later grade adds (헷갈린 점 · 유형) end it too.
    const more = ['**판정:** 틀림', '**피드백:** 첫 줄입니다.', '둘째 줄입니다.', '**되묻기:** 마지막 값은 무엇일까요?', '헷갈린 점: 끝 조건', '유형: 경계값'].join('\n')
    expect(parseCheck(more)).toEqual({ verdict: 'wrong', feedback: '첫 줄입니다.\n둘째 줄입니다.', nudge: '마지막 값은 무엇일까요?' })
    expect(parseCheck(['판정: 틀림', '피드백: 아쉬워요.', '헷갈린 점: 끝 조건'].join('\n'))).toEqual({ verdict: 'wrong', feedback: '아쉬워요.' })
    // As a JSON object too.
    expect(parseCheck('{"verdict": "wrong", "feedback": "아닙니다", "nudge": "i가 3이면요?"}')).toEqual({ verdict: 'wrong', feedback: '아닙니다', nudge: 'i가 3이면요?' })
  })

  test('a reply with no question asked back grades as before 1.7.0; a right one, or "없음", carries none', () => {
    expect(parseCheck('판정: 거의\n피드백: 순서 이야기가 빠졌어요.')).toEqual({ verdict: 'partial', feedback: '순서 이야기가 빠졌어요.' })
    expect(parseCheck('판정: 맞음\n피드백: 정확합니다.\n되묻기: 왜 그럴까요?')).toEqual({ verdict: 'right', feedback: '정확합니다.' })
    for (const none of ['없음', '(없음)', '-', '해당 없음', '']) {
      expect(parseCheck(`판정: 틀림\n피드백: 아닙니다.\n되묻기: ${none}`)).toEqual({ verdict: 'wrong', feedback: '아닙니다.' })
    }
    // A second 피드백 line is not read into the first.
    expect(parseCheck('판정: 틀림\n피드백: 하나\n피드백: 둘\n덧붙임')?.feedback).toBe('하나')
  })

  test('a question asked back that holds the model answer is dropped; one that quotes a single character is kept', () => {
    expect(keptNudge('0 1 2 다음에도 찍힐까요?', '0 1 2')).toBeUndefined()
    expect(keptNudge('`i <= 2`로 바꾸면 어떨까요?', '`i <= 2`')).toBeUndefined()
    expect(keptNudge('바깥 변수를 기억해서다.', '바깥 변수를 기억해서다')).toBeUndefined()
    expect(keptNudge('i가 3이 되면 i < 3은 참일까요?', '3')).toBe('i가 3이 되면 i < 3은 참일까요?')
    expect(keptNudge('i가 3이 되면 i < 3은 참일까요?', '0 1 2')).toBe('i가 3이 되면 i < 3은 참일까요?')
    expect(keptNudge(undefined, '0 1 2')).toBeUndefined()
  })

  test('"모르겠어요" and the like, or question marks alone, are no answer; an answer that only begins so is one', () => {
    for (const blank of ['모르겠어요', '모르겠습니다', '몰라', '몰라요', '잘 모르겠어요', '잘 모르겠어요ㅠㅠ', '모르겠어요.', '모르겠어요?', '?', '？？', '  몰라요!  ', 'idk', "I don't know"]) {
      expect(isBlankAnswer(blank)).toBe(true)
    }
    for (const answer of ['모르겠어요 아마 3?', '0 1 2', '몰라서 i를 3까지 찍어요', '틀린 것 같은데 모르겠어요', '', '3?']) {
      expect(isBlankAnswer(answer)).toBe(false)
    }
  })

  test('the first grade asks for the question asked back and says how to give feedback; the try again carries the first and asks for none', () => {
    const first = checkPrompt(ITEM, '0 1 2 3', 'beginner')
    expect(first).toContain('학습자의 답대로라면 무엇이 되는지(값이나 동작)를 먼저 짚고, 맞은 점 하나를 인정한다')
    expect(first).toContain('되묻기는 판정이 거의나 틀림일 때만 쓰는 질문 한 문장이다')
    expect(first).toContain('답·고칠 코드·개념 이름은 말하지 않는다')
    expect(first).toMatch(/피드백: \(한두 문장\)\n되묻기: \(거의·틀림일 때만 질문 한 문장\. 맞음이면 이 줄을 쓰지 않는다\)$/)
    expect(first).not.toContain('## 학습자의 첫 답과 받은 되묻기')

    const again = checkPrompt(ITEM, '0 1 2', 'beginner', { mine: '0 1 2 3', verdict: 'partial', feedback: '적은 대로라면 i가 3일 때도 찍혀야 합니다.', nudge: 'i가 3이 되면 i < 3은 참일까요?' })
    expect(again).toContain(
      '## 모범 답\n0 1 2\n## 학습자의 첫 답과 받은 되묻기\n첫 답: 0 1 2 3\n첫 판정: 거의\n받은 피드백: 적은 대로라면 i가 3일 때도 찍혀야 합니다.\n받은 되묻기: i가 3이 되면 i < 3은 참일까요?\n## 학습자의 답\n0 1 2',
    )
    expect(again).toContain('마지막 시도다. 되묻기는 쓰지 않는다.')
    expect(again).not.toContain('되묻기: (')
    expect(again).toMatch(/피드백: \(한두 문장\)$/)

    // After "모르겠어요" the try again was asked with the hint: said as such.
    const hinted = checkPrompt(ITEM, '0 1 2', 'beginner', { mine: '모르겠어요', verdict: 'wrong', feedback: '', nudge: '조건이 거짓이 되는 때를 떠올려 보세요' })
    expect(hinted).toContain('## 학습자의 첫 답과 받은 되묻기\n첫 답: (모르겠다고 했다)\n받은 힌트: 조건이 거짓이 되는 때를 떠올려 보세요\n## 학습자의 답')
    expect(CHECK_SYSTEM).not.toContain('되묻기')
  })

  test('a try again is right when it is right, partly right only when both tries were, else wrong', () => {
    expect(secondVerdict('partial', 'right')).toBe('right')
    expect(secondVerdict('wrong', 'right')).toBe('right')
    expect(secondVerdict('partial', 'partial')).toBe('partial')
    expect(secondVerdict('wrong', 'partial')).toBe('wrong')
    expect(secondVerdict('partial', 'wrong')).toBe('wrong')
    expect(secondVerdict('wrong', 'wrong')).toBe('wrong')
  })
})
