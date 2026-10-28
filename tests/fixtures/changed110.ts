/**
 * The quiz requests learn-notes 1.10.0 sends for one store (tests/flow.test.ts, '1.10.0: 비슷한 코드 (G2)'): REDUCE and
 * ARROW met in an edit to cart.js, COMP in evens.py written whole, all three at their third step and due. Caught from the
 * plugin test harness by a maintainer's script outside CI (capture sha256 f608c6924cc1ac0a…) and checked there to the
 * byte against a rebuild outside the plugin: with 비슷한 코드 on (a harness's 2) the G2 design's own preview of the
 * prompt (fca5988 with its patches, written before this build), with it off fca5988's own notes.ts (1.9.0). Made again
 * by the script, never by hand.
 */
export type CaughtCall = { model: string; effort: string; system: string; prompt: string; maxTokens: number; timeoutMs: number }

export const CHANGED_QUIZ_ON: CaughtCall = {
  "model": "haiku",
  "effort": "low",
  "system": "너는 바이브코딩(AI 코딩 도우미에게 코드를 맡기면서 배우는 방식)을 하는 사람의 코딩 튜터다. 그 사람이 전에 배운 개념을 스스로 떠올려 보게 하는 짧은 문제를 한국어로 낸다. 주어진 설명과 코드 안에서만 묻는다. 정답이 하나로 정해지는 문제를 낸다. 문제에 보여 줄 코드가 두 줄 이상이면 줄을 살려 ``` 코드 블록으로 보여 준다. 한 줄짜리 코드 조각만 백틱(`)으로 감싸고, 코드 안에 백틱이 들어 있으면 그 인용은 백틱 두 개(`` … ``)로 감싼다. 굵게(**…**)가 괄호·따옴표·백틱으로 끝나면 닫는 ** 바로 뒤에 조사 같은 글자를 붙이지 않는다(띄어쓰기나 쌍점·쉼표·마침표는 괜찮다). 붙이면 굵게가 풀려 별표가 그대로 보인다. 예: \"**누적(쌓아올리기)**하는\"이 아니라 \"**누적**(쌓아올리기)하는\", \"**`const`**는\"이 아니라 \"`const`는\".",
  "prompt": "읽는 사람은 코딩을 막 배우는 입문자다. 전문 용어는 처음 나올 때 괄호 안에 쉬운 말로 풀어 쓰고, 비유를 하나쯤 써도 좋다.\n\n## 개념\n1. 리스트 컴프리헨션 — 조건에 맞는 것만 모아 새 리스트를 만듭니다 — `[n for n in nums if n % 2 == 0]`\n   칸: 비슷한 코드\n   학습자가 만든 코드 (evens.py):\n```\nnums = [1, 2, 3, 4]\nevens = [n for n in nums if n % 2 == 0]\nprint(evens)\n```\n2. reduce — 배열을 값 하나로 모읍니다 — `items.reduce((sum, item) => sum + item.price * item.qty, 0)`\n   칸: 비슷한 코드\n   학습자가 만든 코드 (cart.js):\n```\nfunction total(items) {\n  return items.reduce((sum, item) => sum + item.price * item.qty, 0)\n}\n```\n3. 화살표 함수 — 짧게 쓰는 함수입니다 — `(sum, item) => sum + item.price * item.qty`\n   칸: 비슷한 코드\n   학습자가 만든 코드 (cart.js):\n```\nfunction total(items) {\n  return items.reduce((sum, item) => sum + item.price * item.qty, 0)\n}\n```\n\n개념마다 문제 하나씩, 위 순서대로 3개를 낸다. 문제에 개념 이름을 그대로 쓰지 말고, 코드나 상황을 보여 주고 묻는다.\n비슷한 코드: 학습자 코드에서 값·조건·순서 중 한 곳을 바꾼 코드를 코드 블록 하나로 보여 주고, 그 코드가 찍는 것을 예측으로 묻는다. 다른 문제와 유형이 겹쳐도 이 칸은 예측으로 낸다. 원래 코드의 답으로는 맞힐 수 없게 바꾼다. 그 블록만 따로 돌려도 그대로 실행되게 쓴다: 쓰는 변수·함수·클래스는 모두 블록 안에서 정의하고(학습자 코드에 정의가 보이지 않으면 짧게 새로 쓴다), 찍는 줄이 없으면 결과를 console.log나 print로 찍는 줄을 더한다. 출력은 3줄 이하로 둔다. A 바로 앞에 같은 번호의 R 줄(예: R2:)을 두어 그 코드를 한 줄씩 따라간 과정을 쓰고, A에는 찍히는 글자만 줄마다 그대로 쓴다(설명을 붙이지 않는다). 오류로 멈추는 코드면 A에 그 앞까지 찍힌 글자와 오류 이름(예: TypeError)을 쓴다. 문제(Q)와 힌트(H)에는 출력값이나 따라간 과정을 쓰지 않는다.\n문제 유형: 예측은 코드를 보여 주고 출력이나 값을 맞히게 한다. 바꿔 보기는 바라는 동작을 말하고 어느 줄을 어떻게 바꿀지 묻는다. 왜는 어떤 줄을 빼거나 바꾸면 어떻게 되는지, 왜 그렇게 썼는지 묻는다.\n코드가 붙었거나 칸이 붙은 개념은 예측(코드만으로 출력이나 값이 하나로 정해질 때만) 또는 바꿔 보기로, 칸도 코드도 없는 개념은 왜로 낸다. 한 퀴즈 안에서는 되도록 서로 다른 유형으로 낸다.\n답은 예측이면 출력이나 값을, 바꿔 보기면 바꾼 코드와 그 까닭을, 왜면 무엇이 달라지는지를 쓴다.\n힌트는 막힌 학습자가 답을 떠올리게 돕는 실마리 한 문장이다. 답이나 개념 이름을 그대로 말하지 않는다.\n정확히 아래 형식만 쓴다. 다른 말은 쓰지 않는다.\nT1: (예측 · 왜 · 바꿔 보기 중 하나)\nQ1: (문제 한두 문장)\nH1: (힌트 한 문장)\nR1: (칸이 \"비슷한 코드\"인 문제만: 보인 코드를 한 줄씩 따라간 과정)\nA1: (답 한두 문장)\nT2: …\nQ2: …\nH2: …\nA2: …",
  "maxTokens": 4600,
  "timeoutMs": 90000
}

export const CHANGED_QUIZ_OFF: CaughtCall = {
  "model": "haiku",
  "effort": "low",
  "system": "너는 바이브코딩(AI 코딩 도우미에게 코드를 맡기면서 배우는 방식)을 하는 사람의 코딩 튜터다. 그 사람이 전에 배운 개념을 스스로 떠올려 보게 하는 짧은 문제를 한국어로 낸다. 주어진 설명과 코드 안에서만 묻는다. 정답이 하나로 정해지는 문제를 낸다. 문제에 보여 줄 코드가 두 줄 이상이면 줄을 살려 ``` 코드 블록으로 보여 준다. 한 줄짜리 코드 조각만 백틱(`)으로 감싸고, 코드 안에 백틱이 들어 있으면 그 인용은 백틱 두 개(`` … ``)로 감싼다. 굵게(**…**)가 괄호·따옴표·백틱으로 끝나면 닫는 ** 바로 뒤에 조사 같은 글자를 붙이지 않는다(띄어쓰기나 쌍점·쉼표·마침표는 괜찮다). 붙이면 굵게가 풀려 별표가 그대로 보인다. 예: \"**누적(쌓아올리기)**하는\"이 아니라 \"**누적**(쌓아올리기)하는\", \"**`const`**는\"이 아니라 \"`const`는\".",
  "prompt": "읽는 사람은 코딩을 막 배우는 입문자다. 전문 용어는 처음 나올 때 괄호 안에 쉬운 말로 풀어 쓰고, 비유를 하나쯤 써도 좋다.\n\n## 개념\n1. 리스트 컴프리헨션 — 조건에 맞는 것만 모아 새 리스트를 만듭니다 — `[n for n in nums if n % 2 == 0]`\n   칸: 내 코드\n   학습자가 만든 코드 (evens.py):\n```\nnums = [1, 2, 3, 4]\nevens = [n for n in nums if n % 2 == 0]\nprint(evens)\n```\n2. reduce — 배열을 값 하나로 모읍니다 — `items.reduce((sum, item) => sum + item.price * item.qty, 0)`\n   칸: 내 코드\n   학습자가 만든 코드 (cart.js):\n```\nfunction total(items) {\n  return items.reduce((sum, item) => sum + item.price * item.qty, 0)\n}\n```\n3. 화살표 함수 — 짧게 쓰는 함수입니다 — `(sum, item) => sum + item.price * item.qty`\n   칸: 내 코드\n   학습자가 만든 코드 (cart.js):\n```\nfunction total(items) {\n  return items.reduce((sum, item) => sum + item.price * item.qty, 0)\n}\n```\n\n개념마다 문제 하나씩, 위 순서대로 3개를 낸다. 문제에 개념 이름을 그대로 쓰지 말고, 코드나 상황을 보여 주고 묻는다.\n내 코드: 학습자가 만든 코드를 그대로 보여 주고 묻는다.\n문제 유형: 예측은 코드를 보여 주고 출력이나 값을 맞히게 한다. 바꿔 보기는 바라는 동작을 말하고 어느 줄을 어떻게 바꿀지 묻는다. 왜는 어떤 줄을 빼거나 바꾸면 어떻게 되는지, 왜 그렇게 썼는지 묻는다.\n코드가 붙었거나 칸이 붙은 개념은 예측(코드만으로 출력이나 값이 하나로 정해질 때만) 또는 바꿔 보기로, 칸도 코드도 없는 개념은 왜로 낸다. 한 퀴즈 안에서는 되도록 서로 다른 유형으로 낸다.\n답은 예측이면 출력이나 값을, 바꿔 보기면 바꾼 코드와 그 까닭을, 왜면 무엇이 달라지는지를 쓴다.\n힌트는 막힌 학습자가 답을 떠올리게 돕는 실마리 한 문장이다. 답이나 개념 이름을 그대로 말하지 않는다.\n정확히 아래 형식만 쓴다. 다른 말은 쓰지 않는다.\nT1: (예측 · 왜 · 바꿔 보기 중 하나)\nQ1: (문제 한두 문장)\nH1: (힌트 한 문장)\nA1: (답 한두 문장)\nT2: …\nQ2: …\nH2: …\nA2: …",
  "maxTokens": 3400,
  "timeoutMs": 90000
}
