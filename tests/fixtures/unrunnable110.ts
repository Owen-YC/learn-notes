/**
 * What learn-notes 1.10.0 before G3 (1b7d0af, its own hooks/notes.ts) gives for code of the five patterns G3 adds for
 * code never seen (1.10.0 G3, D29: jQuery `$(`, a decorator of an object or a capital, the network, `process.`, a Node
 * I/O module by `node:`): isUnrunnableCode, isUnrunnableChange (a file made whole, and an edit with the file as its
 * lines), workedBranch, and rungOf with code changed at 2 and code never seen off. G3 reads the five for code never
 * seen alone (NEW_UNRUNNABLE), so every value here stays (tests/ladder.test.ts). Made by a maintainer's script
 * outside CI (impl110/b6/make_unrunnable110.mjs), never by hand.
 */
export type UnrunnableRow = {
  id: string
  shape: string
  file: string
  text: string
  blurb: string
  isUnrunnableCode: boolean
  isUnrunnableChangeCreate: boolean
  isUnrunnableChangeEdit: boolean
  workedBranch: 'code' | 'plain' | null
  rungOf: 'worked' | 'mine' | 'changed' | 'new' | null
}

export const UNRUNNABLE_110: UnrunnableRow[] = [
  {
    "id": "jquery · 0",
    "shape": "jquery",
    "file": "form.js",
    "text": "const email = $('#email').val()\nconsole.log(email)",
    "blurb": "설명 — `const email = $('#email').val()`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "jquery · 1",
    "shape": "jquery",
    "file": "a.js",
    "text": "const v = $(\"#a\")\nconsole.log(v.length)",
    "blurb": "설명 — `const v = $(\"#a\")`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "decorator · 2",
    "shape": "decorator",
    "file": "app.py",
    "text": "@app.route(\"/users/<name>\")\ndef user(name):\n    return name",
    "blurb": "설명 — `@app.route(\"/users/<name>\")`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "decorator · 3",
    "shape": "decorator",
    "file": "views.py",
    "text": "@bp.route(\"/\")\ndef home():\n    return \"ok\"",
    "blurb": "설명 — `@bp.route(\"/\")`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "decorator · 4",
    "shape": "decorator",
    "file": "api.ts",
    "text": "@router.get(\"/\")\nlist() { return [] }",
    "blurb": "설명 — `@router.get(\"/\")`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "decorator · 5",
    "shape": "decorator",
    "file": "test_a.py",
    "text": "@pytest.fixture\ndef nums():\n    return [1, 2]",
    "blurb": "설명 — `@pytest.fixture`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "decorator · 6",
    "shape": "decorator",
    "file": "a.component.ts",
    "text": "@Component({ selector: \"x\" })\nexport class A {}",
    "blurb": "설명 — `@Component({ selector: \"x\" })`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "decorator · 7",
    "shape": "decorator",
    "file": "a.service.ts",
    "text": "@Injectable()\nexport class A {}",
    "blurb": "설명 — `@Injectable()`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "network · 8",
    "shape": "network",
    "file": "users.js",
    "text": "fetch('/api/users').then(r => r.json()).then(xs => console.log(xs.length))",
    "blurb": "설명 — `fetch('/api/users').then(r => r.json()).then(xs => console.log(xs.length))`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "mine"
  },
  {
    "id": "network · 9",
    "shape": "network",
    "file": "live.js",
    "text": "const ws = new WebSocket(url)\nws.onmessage = e => console.log(e.data)",
    "blurb": "설명 — `const ws = new WebSocket(url)`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "network · 10",
    "shape": "network",
    "file": "feed.ts",
    "text": "const es = new EventSource(url)\nes.onmessage = e => console.log(e.data)",
    "blurb": "설명 — `const es = new EventSource(url)`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "network · 11",
    "shape": "network",
    "file": "old.js",
    "text": "const req = new XMLHttpRequest()\nreq.open('GET', '/a')",
    "blurb": "설명 — `const req = new XMLHttpRequest()`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "mine"
  },
  {
    "id": "process · 12",
    "shape": "process",
    "file": "config.js",
    "text": "const key = process.env.API_KEY\nconsole.log(key.length)",
    "blurb": "설명 — `const key = process.env.API_KEY`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "mine"
  },
  {
    "id": "process · 13",
    "shape": "process",
    "file": "args.ts",
    "text": "const name = process .argv[2]\nconsole.log(name)",
    "blurb": "설명 — `const name = process .argv[2]`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "changed"
  },
  {
    "id": "node-io · 14",
    "shape": "node-io",
    "file": "read.js",
    "text": "const fs = require('node:fs')\nconsole.log(fs.readFileSync('a.txt', 'utf8'))",
    "blurb": "설명 — `const fs = require('node:fs')`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "mine"
  },
  {
    "id": "node-io · 15",
    "shape": "node-io",
    "file": "read.mjs",
    "text": "import { readFile } from 'node:fs/promises'\nconsole.log(await readFile('a.txt', 'utf8'))",
    "blurb": "설명 — `import { readFile } from 'node:fs/promises'`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "mine"
  },
  {
    "id": "node-io · 16",
    "shape": "node-io",
    "file": "serve.js",
    "text": "import http from 'node:http'\nhttp.createServer().listen(3000)",
    "blurb": "설명 — `import http from 'node:http'`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "mine"
  },
  {
    "id": "node-io · 17",
    "shape": "node-io",
    "file": "ask.js",
    "text": "const rl = require(`node:readline`)\nconsole.log(typeof rl)",
    "blurb": "설명 — `const rl = require(`node:readline`)`",
    "isUnrunnableCode": false,
    "isUnrunnableChangeCreate": false,
    "isUnrunnableChangeEdit": false,
    "workedBranch": "code",
    "rungOf": "mine"
  }
]
