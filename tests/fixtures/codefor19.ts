/**
 * What learn-notes 1.9.0's codeFor (fca5988, its own hooks/notes.ts, sha256 ff4b2cfcbd2bce53…) gives for these
 * changes and concepts' words: the lines a quiz shows of a concept's code. From 1.10.0 (G1) its quote match is shared
 * with workedBranch's isQuoted, rewritten; it must give the same, to the byte (tests/ladder.test.ts). Made by a
 * maintainer's script outside CI (impl110/b4/make_codefor19.mjs), never by hand.
 */
export const CODE_FOR_19: { id: string; diff: string; blurb: string; code: string | null }[] = [
  {
    "id": "small · 0",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 1",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "설명 — `total += n`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 2",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 3",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "설명 — `const b = 2`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 4",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 5",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "네 글자 — `item`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 6",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 7",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "안의 백틱 — `${name}`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 8",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 9",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 10",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "공백 — `const   b   =   2`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 11",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 12",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "없는 것 — `git stash`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 13",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 14",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "닫히지 않은 `total += n",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "small · 15",
    "diff": "@@ -0,0 +1,3 @@\n+let total = 0\n+for (const n of [1, 2]) total += n\n+console.log(total)",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "let total = 0\nfor (const n of [1, 2]) total += n\nconsole.log(total)"
  },
  {
    "id": "edit · 0",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 1",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "설명 — `total += n`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 2",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 3",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "설명 — `const b = 2`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 4",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 5",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "네 글자 — `item`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 6",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 7",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "안의 백틱 — `${name}`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 8",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 9",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 10",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "공백 — `const   b   =   2`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 11",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 12",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "없는 것 — `git stash`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 13",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 14",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "닫히지 않은 `total += n",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "edit · 15",
    "diff": "@@ -1,2 +1,2 @@\n const a = 1\n-let b = 2\n+const b = 2",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "const a = 1\nconst b = 2"
  },
  {
    "id": "twoHunks · 0",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 1",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "설명 — `total += n`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 2",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 3",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "설명 — `const b = 2`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 4",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 5",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "네 글자 — `item`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 6",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 7",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "안의 백틱 — `${name}`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 8",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 9",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 10",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "공백 — `const   b   =   2`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 11",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 12",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "없는 것 — `git stash`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 13",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 14",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "닫히지 않은 `total += n",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "twoHunks · 15",
    "diff": "@@ -1,2 +1,2 @@\n import x from \"y\"\n-let a = 1\n+const a = 1\n@@ -40,2 +40,2 @@\n function f() {\n-  return 1\n+  return items.reduce((s, x) => s + x, 0)",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "import x from \"y\"\nconst a = 1\n…\nfunction f() {\n  return items.reduce((s, x) => s + x, 0)"
  },
  {
    "id": "removeOnly · 0",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 1",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "설명 — `total += n`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 2",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 3",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "설명 — `const b = 2`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 4",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 5",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "네 글자 — `item`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 6",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 7",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "안의 백틱 — `${name}`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 8",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 9",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 10",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "공백 — `const   b   =   2`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 11",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 12",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "없는 것 — `git stash`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 13",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 14",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "닫히지 않은 `total += n",
    "code": "keep()"
  },
  {
    "id": "removeOnly · 15",
    "diff": "@@ -3,3 +3,1 @@\n keep()\n-gone()\n-gone2()",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "keep()"
  },
  {
    "id": "longFile · 0",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 1",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "설명 — `total += n`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 2",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 3",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "설명 — `const b = 2`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 4",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 5",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "네 글자 — `item`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 6",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 7",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "안의 백틱 — `${name}`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 8",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 9",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 10",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "공백 — `const   b   =   2`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 11",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 12",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "없는 것 — `git stash`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 13",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 14",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "닫히지 않은 `total += n",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "longFile · 15",
    "diff": "@@ -0,0 +1,30 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v20 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v21 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v22 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v23 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v24 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v25 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v26 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v27 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v28 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v29 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 0",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 1",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "설명 — `total += n`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 2",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 3",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "설명 — `const b = 2`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 4",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 5",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "네 글자 — `item`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 6",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 7",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "안의 백틱 — `${name}`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 8",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 9",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 10",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "공백 — `const   b   =   2`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 11",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 12",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "없는 것 — `git stash`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 13",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 14",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "닫히지 않은 `total += n",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "wide · 15",
    "diff": "@@ -0,0 +1,20 @@\n+const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v3 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v4 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v5 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v6 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v7 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v8 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v9 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v10 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v11 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v12 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v13 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v14 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v15 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v16 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v17 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v18 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n+const v19 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "const v0 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v1 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nconst v2 = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 0",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 1",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "설명 — `total += n`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 2",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 3",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "설명 — `const b = 2`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 4",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 5",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "네 글자 — `item`",
    "code": "const v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 6",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 7",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "안의 백틱 — `${name}`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 8",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 9",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "const v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 10",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "공백 — `const   b   =   2`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 11",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 12",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "없는 것 — `git stash`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 13",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 14",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "닫히지 않은 `total += n",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "quoteDeep · 15",
    "diff": "@@ -0,0 +1,25 @@\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx\n+const target = items.filter(x => x.ok)\n+const v0 = xxxxxxxxxx\n+const v1 = xxxxxxxxxx\n+const v2 = xxxxxxxxxx\n+const v3 = xxxxxxxxxx\n+const v4 = xxxxxxxxxx\n+const v5 = xxxxxxxxxx\n+const v6 = xxxxxxxxxx\n+const v7 = xxxxxxxxxx\n+const v8 = xxxxxxxxxx\n+const v9 = xxxxxxxxxx\n+const v10 = xxxxxxxxxx\n+const v11 = xxxxxxxxxx",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "const v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx\nconst v3 = xxxxxxxxxx\nconst v4 = xxxxxxxxxx\nconst v5 = xxxxxxxxxx\nconst v6 = xxxxxxxxxx\nconst v7 = xxxxxxxxxx\nconst v8 = xxxxxxxxxx\nconst v9 = xxxxxxxxxx\nconst v10 = xxxxxxxxxx\nconst v11 = xxxxxxxxxx\nconst target = items.filter(x => x.ok)\nconst v0 = xxxxxxxxxx\nconst v1 = xxxxxxxxxx\nconst v2 = xxxxxxxxxx"
  },
  {
    "id": "blank · 0",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "",
    "code": null
  },
  {
    "id": "blank · 1",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "설명 — `total += n`",
    "code": null
  },
  {
    "id": "blank · 2",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": null
  },
  {
    "id": "blank · 3",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "설명 — `const b = 2`",
    "code": null
  },
  {
    "id": "blank · 4",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": null
  },
  {
    "id": "blank · 5",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "네 글자 — `item`",
    "code": null
  },
  {
    "id": "blank · 6",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": null
  },
  {
    "id": "blank · 7",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "안의 백틱 — `${name}`",
    "code": null
  },
  {
    "id": "blank · 8",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": null
  },
  {
    "id": "blank · 9",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": null
  },
  {
    "id": "blank · 10",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "공백 — `const   b   =   2`",
    "code": null
  },
  {
    "id": "blank · 11",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": null
  },
  {
    "id": "blank · 12",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "없는 것 — `git stash`",
    "code": null
  },
  {
    "id": "blank · 13",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": null
  },
  {
    "id": "blank · 14",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "닫히지 않은 `total += n",
    "code": null
  },
  {
    "id": "blank · 15",
    "diff": "@@ -0,0 +1,3 @@\n+\n+   \n+",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": null
  },
  {
    "id": "py · 0",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 1",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "설명 — `total += n`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 2",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 3",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "설명 — `const b = 2`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 4",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 5",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "네 글자 — `item`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 6",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 7",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "안의 백틱 — `${name}`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 8",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 9",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 10",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "공백 — `const   b   =   2`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 11",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 12",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "없는 것 — `git stash`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 13",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 14",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "닫히지 않은 `total += n",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "py · 15",
    "diff": "@@ -0,0 +1,2 @@\n+nums = [1, 2, 3, 4]\n+print([n for n in nums if n % 2 == 0])",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "nums = [1, 2, 3, 4]\nprint([n for n in nums if n % 2 == 0])"
  },
  {
    "id": "ticks · 0",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 1",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "설명 — `total += n`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 2",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 3",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "설명 — `const b = 2`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 4",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 5",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "네 글자 — `item`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 6",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 7",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "안의 백틱 — `${name}`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 8",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 9",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 10",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "공백 — `const   b   =   2`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 11",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 12",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "없는 것 — `git stash`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 13",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 14",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "닫히지 않은 `total += n",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "ticks · 15",
    "diff": "@@ -0,0 +1,2 @@\n+const s = `안녕하세요, ${name}님!`\n+console.log(s)",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "const s = `안녕하세요, ${name}님!`\nconsole.log(s)"
  },
  {
    "id": "css · 0",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 1",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "설명 — `total += n`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 2",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 3",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "설명 — `const b = 2`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 4",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 5",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "네 글자 — `item`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 6",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 7",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "안의 백틱 — `${name}`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 8",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 9",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 10",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "공백 — `const   b   =   2`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 11",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 12",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "없는 것 — `git stash`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 13",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 14",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "닫히지 않은 `total += n",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "css · 15",
    "diff": "@@ -0,0 +1,2 @@\n+.a { color: blue; }\n+.b { margin: 0 auto; }",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": ".a { color: blue; }\n.b { margin: 0 auto; }"
  },
  {
    "id": "deep · 0",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 1",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "설명 — `total += n`",
    "code": "const v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nfor (const n of [1, 2]) total += n\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst b = 2\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "deep · 2",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "const v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nfor (const n of [1, 2]) total += n\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst b = 2\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "deep · 3",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "설명 — `const b = 2`",
    "code": "const v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst b = 2\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\ngone()\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "deep · 4",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 5",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "네 글자 — `item`",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 6",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 7",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "안의 백틱 — `${name}`",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 8",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 9",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 10",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "공백 — `const   b   =   2`",
    "code": "const v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst b = 2\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\ngone()\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "deep · 11",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "const v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\ngone()\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx"
  },
  {
    "id": "deep · 12",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "없는 것 — `git stash`",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 13",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 14",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "닫히지 않은 `total += n",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deep · 15",
    "diff": "@@ -0,0 +1,35 @@\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+const v8 = xxxxxxxx\n+let total = 0\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+for (const n of [1, 2]) total += n\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const b = 2\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+gone()\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "const v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst v8 = xxxxxxxx\nlet total = 0\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx"
  },
  {
    "id": "deepHunks · 0",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 1",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "설명 — `total += n`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 2",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 3",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "설명 — `const b = 2`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 4",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 5",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "네 글자 — `item`",
    "code": "const v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 6",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 7",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "안의 백틱 — `${name}`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 8",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 9",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "const v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 10",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "공백 — `const   b   =   2`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 11",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 12",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "없는 것 — `git stash`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 13",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 14",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "닫히지 않은 `total += n",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "deepHunks · 15",
    "diff": "@@ -1,9 +1,9 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n-let a = 1\n+const a = 1\n@@ -90,10 +90,12 @@\n const v0 = xxxxxxxx\n const v1 = xxxxxxxx\n const v2 = xxxxxxxx\n const v3 = xxxxxxxx\n const v4 = xxxxxxxx\n const v5 = xxxxxxxx\n const v6 = xxxxxxxx\n const v7 = xxxxxxxx\n const v8 = xxxxxxxx\n const v9 = xxxxxxxx\n+const target = items.filter(x => x.ok)\n+console.log(target.length)",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "const v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconst a = 1\n…\nconst v8 = xxxxxxxx\nconst v9 = xxxxxxxx\nconst target = items.filter(x => x.ok)\nconsole.log(target.length)"
  },
  {
    "id": "shortInside · 0",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 1",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "설명 — `total += n`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 2",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 3",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "설명 — `const b = 2`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 4",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 5",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "네 글자 — `item`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 6",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 7",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "안의 백틱 — `${name}`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 8",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 9",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 10",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "공백 — `const   b   =   2`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 11",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 12",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "없는 것 — `git stash`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 13",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 14",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "닫히지 않은 `total += n",
    "code": "total\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx\nconst v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "shortInside · 15",
    "diff": "@@ -0,0 +1,13 @@\n+total\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx\n+const v3 = xxxxxxxx\n+const v4 = xxxxxxxx\n+const v5 = xxxxxxxx\n+const v6 = xxxxxxxx\n+const v7 = xxxxxxxx\n+console.log(total)\n+const v0 = xxxxxxxx\n+const v1 = xxxxxxxx\n+const v2 = xxxxxxxx",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "const v3 = xxxxxxxx\nconst v4 = xxxxxxxx\nconst v5 = xxxxxxxx\nconst v6 = xxxxxxxx\nconst v7 = xxxxxxxx\nconsole.log(total)\nconst v0 = xxxxxxxx\nconst v1 = xxxxxxxx\nconst v2 = xxxxxxxx"
  },
  {
    "id": "deepPy · 0",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 1",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "설명 — `total += n`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 2",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "설명 — `for (const n of [1, 2]) total += n`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 3",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "설명 — `const b = 2`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 4",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "짧은 인용 — `a` · `ab` · `abc`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 5",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "네 글자 — `item`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 6",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "두 겹 — ``const s = `안녕하세요, ${name}님!` ``",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 7",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "안의 백틱 — `${name}`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 8",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "조각 — `items.reduce((s, x) => s + x, 0)`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 9",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "줄 일부 — `const target = items.filter(x => x.ok); console.log(target.length)`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 10",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "공백 — `const   b   =   2`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 11",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "여럿 — `gone()` 그리고 `margin: 0 auto`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 12",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "없는 것 — `git stash`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 13",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "파이썬 — `[n for n in nums if n % 2 == 0]`",
    "code": "v5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx"
  },
  {
    "id": "deepPy · 14",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "닫히지 않은 `total += n",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  },
  {
    "id": "deepPy · 15",
    "diff": "@@ -0,0 +1,21 @@\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx\n+print([n for n in nums if n % 2 == 0])\n+v0 = xxxxxxxx\n+v1 = xxxxxxxx\n+v2 = xxxxxxxx\n+v3 = xxxxxxxx\n+v4 = xxxxxxxx\n+v5 = xxxxxxxx\n+v6 = xxxxxxxx\n+v7 = xxxxxxxx\n+v8 = xxxxxxxx\n+v9 = xxxxxxxx",
    "blurb": "짧은 줄 — `console.log(total)`",
    "code": "v0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx\nv5 = xxxxxxxx\nv6 = xxxxxxxx\nv7 = xxxxxxxx\nv8 = xxxxxxxx\nv9 = xxxxxxxx\nprint([n for n in nums if n % 2 == 0])\nv0 = xxxxxxxx\nv1 = xxxxxxxx\nv2 = xxxxxxxx\nv3 = xxxxxxxx\nv4 = xxxxxxxx"
  }
]
