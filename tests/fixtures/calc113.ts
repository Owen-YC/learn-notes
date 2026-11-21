// 1.13.0 G5e: expressions with their results as node 22 and python3 3.11 showed them (gates/diff truth files),
// frozen; calc must agree on each one it does not refuse.
export const CALC113: Readonly<Record<'js' | 'py', readonly { expr: string; truth: string }[]>> = {
 "js": [
  {
   "expr": "[1.5, 2.25, -3].join(\"-\")",
   "truth": "RETURN \"1.5-2.25--3\""
  },
  {
   "expr": "(1234.5678).toFixed(0)",
   "truth": "RETURN \"1235\""
  },
  {
   "expr": "(31.25).toFixed(2)",
   "truth": "RETURN \"31.25\""
  },
  {
   "expr": "[...[], 0]",
   "truth": "RETURN [0]"
  },
  {
   "expr": "isNaN([1, 2, 3])",
   "truth": "RETURN true"
  },
  {
   "expr": "[3, 1, 2].filter((x, i) => i % 2 === 0)",
   "truth": "RETURN [3,2]"
  },
  {
   "expr": "'Hello World'.substring(4, 1)",
   "truth": "RETURN \"ell\""
  },
  {
   "expr": "[1.5, 2.25, -3].at(-1)",
   "truth": "RETURN -3"
  },
  {
   "expr": "([1, 2, 3]) ?? (0.1)",
   "truth": "RETURN [1,2,3]"
  },
  {
   "expr": "`<${7}>`",
   "truth": "RETURN \"<7>\""
  },
  {
   "expr": "JSON.stringify([])",
   "truth": "RETURN \"[]\""
  },
  {
   "expr": "[10, 9, 100].map(String)",
   "truth": "RETURN [\"10\",\"9\",\"100\"]"
  },
  {
   "expr": "Math.trunc(99.995)",
   "truth": "RETURN 99"
  },
  {
   "expr": "-(0)",
   "truth": "RETURN 0"
  },
  {
   "expr": "('  x ') - (0)",
   "truth": "RETURN null"
  },
  {
   "expr": "Boolean([1, 2, 3])",
   "truth": "RETURN true"
  },
  {
   "expr": "[10, 9, 100].length",
   "truth": "RETURN 3"
  },
  {
   "expr": "String([3, 1, 2])",
   "truth": "RETURN \"3,1,2\""
  },
  {
   "expr": "(true) === (-3)",
   "truth": "RETURN false"
  },
  {
   "expr": "`<${'  x '}>`",
   "truth": "RETURN \"<  x >\""
  },
  {
   "expr": "([]) == (0.2)",
   "truth": "RETURN false"
  },
  {
   "expr": "'  pad me  '.split('')",
   "truth": "RETURN [\" \",\" \",\"p\",\"a\",\"d\",\" \",\"m\",\"e\",\" \",\" \"]"
  },
  {
   "expr": "[].at(-1)",
   "truth": "RETURN undefined"
  },
  {
   "expr": "[].lastIndexOf(2)",
   "truth": "RETURN -1"
  },
  {
   "expr": "(1.005).toFixed(0)",
   "truth": "RETURN \"1\""
  },
  {
   "expr": "''.split(\" \")",
   "truth": "RETURN [\"\"]"
  },
  {
   "expr": "Math.round(12.345 * 100) / 100",
   "truth": "RETURN 12.35"
  },
  {
   "expr": "(false) == (0)",
   "truth": "RETURN true"
  },
  {
   "expr": "[[1, 2], [3]].filter((x, i) => i % 2 === 0)",
   "truth": "RETURN [[1,2]]"
  },
  {
   "expr": "Math.round(0)",
   "truth": "RETURN 0"
  },
  {
   "expr": "'3:05'.indexOf('s')",
   "truth": "RETURN -1"
  },
  {
   "expr": "[3, 1, 2].every(x => x > 0)",
   "truth": "RETURN true"
  },
  {
   "expr": "String(2.5)",
   "truth": "RETURN \"2.5\""
  },
  {
   "expr": "Number([1, 2, 3])",
   "truth": "RETURN null"
  },
  {
   "expr": "(0) ?? ('4:25')",
   "truth": "RETURN 0"
  },
  {
   "expr": "(0.2) - (0.2)",
   "truth": "RETURN 0"
  },
  {
   "expr": "(1) + \"\"",
   "truth": "RETURN \"1\""
  },
  {
   "expr": "Boolean(-0.5)",
   "truth": "RETURN true"
  },
  {
   "expr": "parseFloat(['b', 'a'])",
   "truth": "RETURN null"
  },
  {
   "expr": "[].some(x => x > 2)",
   "truth": "RETURN false"
  },
  {
   "expr": "-(null)",
   "truth": "RETURN 0"
  },
  {
   "expr": "`<${0.1}>`",
   "truth": "RETURN \"<0.1>\""
  },
  {
   "expr": "parseInt('4:25')",
   "truth": "RETURN 4"
  },
  {
   "expr": "String([[1, 2], [3]])",
   "truth": "RETURN \"1,2,3\""
  },
  {
   "expr": "[1.5, 2.25, -3].filter(x => x)",
   "truth": "RETURN [1.5,2.25,-3]"
  },
  {
   "expr": "'  pad me  '.replaceAll('s', '')",
   "truth": "RETURN \"  pad me  \""
  },
  {
   "expr": "JSON.stringify(true)",
   "truth": "RETURN \"true\""
  },
  {
   "expr": "({}) + \"\"",
   "truth": "RETURN \"[object Object]\""
  },
  {
   "expr": "'x-y-z'.match(/s+/g)",
   "truth": "RETURN null"
  },
  {
   "expr": "(false) ?? ([])",
   "truth": "RETURN false"
  },
  {
   "expr": "[[]].length",
   "truth": "RETURN 1"
  },
  {
   "expr": "typeof (-3)",
   "truth": "RETURN \"number\""
  },
  {
   "expr": "typeof ('3')",
   "truth": "RETURN \"string\""
  },
  {
   "expr": "'3:05'.length",
   "truth": "RETURN 4"
  },
  {
   "expr": "'Hello World'.charCodeAt(0)",
   "truth": "RETURN 72"
  },
  {
   "expr": "({a: 1}) < (['b', 'a'])",
   "truth": "RETURN true"
  },
  {
   "expr": "Math.round(0.1)",
   "truth": "RETURN 0"
  },
  {
   "expr": "[3, 1, 2].toString()",
   "truth": "RETURN \"3,1,2\""
  },
  {
   "expr": "Math.round([1, 2, 3])",
   "truth": "RETURN null"
  },
  {
   "expr": "(0.1 + 0.2).toPrecision(3)",
   "truth": "RETURN \"0.300\""
  },
  {
   "expr": "(1.45).toFixed(1)",
   "truth": "RETURN \"1.4\""
  },
  {
   "expr": "Boolean(0)",
   "truth": "RETURN false"
  },
  {
   "expr": "'Mississippi'.search(/o/)",
   "truth": "RETURN -1"
  },
  {
   "expr": "[1e21].length",
   "truth": "RETURN 1"
  },
  {
   "expr": "(2.5) == (1)",
   "truth": "RETURN false"
  },
  {
   "expr": "'  pad me  '.replace('s', 'S')",
   "truth": "RETURN \"  pad me  \""
  },
  {
   "expr": "'a,b,,c'.repeat(2)",
   "truth": "RETURN \"a,b,,ca,b,,c\""
  },
  {
   "expr": "'3:05'.search(/o/)",
   "truth": "RETURN -1"
  },
  {
   "expr": "('  x ') + \"\"",
   "truth": "RETURN \"  x \""
  },
  {
   "expr": "Math.ceil(7.25)",
   "truth": "RETURN 8"
  },
  {
   "expr": "''.includes('ss')",
   "truth": "RETURN false"
  },
  {
   "expr": "(0) / (0.1)",
   "truth": "RETURN 0"
  },
  {
   "expr": "'  pad me  '.toLowerCase()",
   "truth": "RETURN \"  pad me  \""
  },
  {
   "expr": "parseInt(\"12px\")",
   "truth": "RETURN 12"
  },
  {
   "expr": "({a: 1}) - ([1, 2, 3])",
   "truth": "RETURN null"
  },
  {
   "expr": "'Hello World'.repeat(2)",
   "truth": "RETURN \"Hello WorldHello World\""
  },
  {
   "expr": "''.endsWith('c')",
   "truth": "RETURN false"
  },
  {
   "expr": "(['b', 'a']) * (-3)",
   "truth": "RETURN null"
  },
  {
   "expr": "[3, 1, 2].map(Number)",
   "truth": "RETURN [3,1,2]"
  },
  {
   "expr": "(2.675).toFixed(1)",
   "truth": "RETURN \"2.7\""
  },
  {
   "expr": "({}) / (1)",
   "truth": "RETURN null"
  },
  {
   "expr": "['pear', 'Apple', 'fig'].flat()",
   "truth": "RETURN [\"pear\",\"Apple\",\"fig\"]"
  },
  {
   "expr": "'a,b,,c'.split(\" \")",
   "truth": "RETURN [\"a,b,,c\"]"
  },
  {
   "expr": "({}) || (null)",
   "truth": "RETURN {}"
  },
  {
   "expr": "(0.1 + 0.2).toFixed(2)",
   "truth": "RETURN \"0.30\""
  },
  {
   "expr": "'  pad me  '.indexOf('s')",
   "truth": "RETURN -1"
  },
  {
   "expr": "'Hello World'.split(/,+/)",
   "truth": "RETURN [\"Hello World\"]"
  },
  {
   "expr": "''.slice(-2)",
   "truth": "RETURN \"\""
  },
  {
   "expr": "(2.5) ** (0.2)",
   "truth": "RETURN 1.2011244339814313"
  },
  {
   "expr": "(0.2) === ({})",
   "truth": "RETURN false"
  },
  {
   "expr": "(99.995).toFixed(1)",
   "truth": "RETURN \"100.0\""
  },
  {
   "expr": "[[1, 2], [3]].map(x => x * 2)",
   "truth": "RETURN [null,6]"
  },
  {
   "expr": "'a,b,,c'.slice(1, 4)",
   "truth": "RETURN \",b,\""
  },
  {
   "expr": "'  pad me  '.search(/o/)",
   "truth": "RETURN -1"
  },
  {
   "expr": "''.length",
   "truth": "RETURN 0"
  },
  {
   "expr": "(-0.5) - (-3)",
   "truth": "RETURN 2.5"
  },
  {
   "expr": "`<${{}}>`",
   "truth": "RETURN \"<[object Object]>\""
  },
  {
   "expr": "typeof ('ab')",
   "truth": "RETURN \"string\""
  },
  {
   "expr": "'Hello World'.slice(1, 4)",
   "truth": "RETURN \"ell\""
  },
  {
   "expr": "'Mississippi'.match(/s+/g)",
   "truth": "RETURN [\"ss\",\"ss\"]"
  },
  {
   "expr": "parseFloat(undefined)",
   "truth": "RETURN null"
  },
  {
   "expr": "(7) + \"\"",
   "truth": "RETURN \"7\""
  },
  {
   "expr": "Number(-0.5)",
   "truth": "RETURN -0.5"
  },
  {
   "expr": "('3') * ({a: 1})",
   "truth": "RETURN null"
  },
  {
   "expr": "'abc'.split(\" \")",
   "truth": "RETURN [\"abc\"]"
  },
  {
   "expr": "\"b\" > \"a\"",
   "truth": "RETURN true"
  },
  {
   "expr": "(0.1) - (0.1)",
   "truth": "RETURN 0"
  },
  {
   "expr": "isNaN('3')",
   "truth": "RETURN false"
  },
  {
   "expr": "isNaN([])",
   "truth": "RETURN false"
  },
  {
   "expr": "(7.25).toFixed(0)",
   "truth": "RETURN \"7\""
  },
  {
   "expr": "Number(-3)",
   "truth": "RETURN -3"
  },
  {
   "expr": "Math.round('4:25')",
   "truth": "RETURN null"
  },
  {
   "expr": "[].find(x => x > 1)",
   "truth": "RETURN undefined"
  },
  {
   "expr": "(0.1 + 0.2).toFixed(0)",
   "truth": "RETURN \"0\""
  },
  {
   "expr": "Math.floor({})",
   "truth": "RETURN null"
  },
  {
   "expr": "!('4:25')",
   "truth": "RETURN false"
  },
  {
   "expr": "Boolean(false)",
   "truth": "RETURN false"
  },
  {
   "expr": "''.padStart(8, \"0\")",
   "truth": "RETURN \"00000000\""
  },
  {
   "expr": "!([1, 2, 3])",
   "truth": "RETURN false"
  },
  {
   "expr": "[{a: 1}].length",
   "truth": "RETURN 1"
  },
  {
   "expr": "[].filter(x => x)",
   "truth": "RETURN []"
  },
  {
   "expr": "(0) - (undefined)",
   "truth": "RETURN null"
  },
  {
   "expr": "[10, 9, 100].reverse()",
   "truth": "RETURN [100,9,10]"
  },
  {
   "expr": "'Hello World'.includes('ss')",
   "truth": "RETURN false"
  },
  {
   "expr": "Math.round(99.995)",
   "truth": "RETURN 100"
  },
  {
   "expr": "/l+/.test('3:05')",
   "truth": "RETURN false"
  },
  {
   "expr": "(undefined) - ([])",
   "truth": "RETURN null"
  },
  {
   "expr": "Math.round(31.25 * 100) / 100",
   "truth": "RETURN 31.25"
  },
  {
   "expr": "(2.5) ** (0.1)",
   "truth": "RETURN 1.0959582263852172"
  },
  {
   "expr": "'Mississippi'.startsWith('H')",
   "truth": "RETURN false"
  },
  {
   "expr": "(['b', 'a']) || ('  x ')",
   "truth": "RETURN [\"b\",\"a\"]"
  },
  {
   "expr": "Number((1234.5678).toFixed(1))",
   "truth": "RETURN 1234.6"
  },
  {
   "expr": "Number.isInteger(5.0)",
   "truth": "RETURN true"
  },
  {
   "expr": "('4:25') === (7)",
   "truth": "RETURN false"
  },
  {
   "expr": "['pear', 'Apple', 'fig'].map(Number)",
   "truth": "RETURN [null,null,null]"
  },
  {
   "expr": "Math.round(undefined)",
   "truth": "RETURN null"
  },
  {
   "expr": "('4:25') - (2.5)",
   "truth": "RETURN null"
  },
  {
   "expr": "'a,b,,c'.toLowerCase()",
   "truth": "RETURN \"a,b,,c\""
  },
  {
   "expr": "[10, 9, 100].at(-1)",
   "truth": "RETURN 100"
  },
  {
   "expr": "[[1, 2], [3]].concat([4])",
   "truth": "RETURN [[1,2],[3],4]"
  },
  {
   "expr": "([]) - (['b', 'a'])",
   "truth": "RETURN null"
  },
  {
   "expr": "'Hello World'.replace(/[aeiou]/g, \"*\")",
   "truth": "RETURN \"H*ll* W*rld\""
  },
  {
   "expr": "Math.round(2.5 * 100) / 100",
   "truth": "RETURN 2.5"
  },
  {
   "expr": "[[1, 2], [3]].slice().sort().reverse()",
   "truth": "RETURN [[3],[1,2]]"
  },
  {
   "expr": "typeof []",
   "truth": "RETURN \"object\""
  },
  {
   "expr": "10 < 9",
   "truth": "RETURN false"
  },
  {
   "expr": "JSON.stringify({a: 1})",
   "truth": "RETURN \"{\\\"a\\\":1}\""
  },
  {
   "expr": "(0) == (7)",
   "truth": "RETURN false"
  },
  {
   "expr": "parseFloat(1)",
   "truth": "RETURN 1"
  },
  {
   "expr": "('') + ({a: 1})",
   "truth": "RETURN \"[object Object]\""
  },
  {
   "expr": "(0.1) && ('  x ')",
   "truth": "RETURN \"  x \""
  },
  {
   "expr": "String(['b', 'a'])",
   "truth": "RETURN \"b,a\""
  },
  {
   "expr": "'3:05'.replace('s', 'S')",
   "truth": "RETURN \"3:05\""
  },
  {
   "expr": "'abc'.includes('ss')",
   "truth": "RETURN false"
  },
  {
   "expr": "parseInt(0.2)",
   "truth": "RETURN 0"
  },
  {
   "expr": "Math.floor(0)",
   "truth": "RETURN 0"
  },
  {
   "expr": "Math.round(31.25)",
   "truth": "RETURN 31"
  },
  {
   "expr": "(1e21) < (undefined)",
   "truth": "RETURN false"
  },
  {
   "expr": "(true) ?? (-3)",
   "truth": "RETURN true"
  },
  {
   "expr": "({a: 1}) + \"\"",
   "truth": "RETURN \"[object Object]\""
  },
  {
   "expr": "({}) || ([1, 2, 3])",
   "truth": "RETURN {}"
  },
  {
   "expr": "/l+/.test('Hello World')",
   "truth": "RETURN true"
  },
  {
   "expr": "('3') % ([1, 2, 3])",
   "truth": "RETURN null"
  },
  {
   "expr": "Math.round(7)",
   "truth": "RETURN 7"
  },
  {
   "expr": "[...[1.5, 2.25, -3], 0]",
   "truth": "RETURN [1.5,2.25,-3,0]"
  },
  {
   "expr": "('3') ** (undefined)",
   "truth": "RETURN null"
  },
  {
   "expr": "(7) * (0)",
   "truth": "RETURN 0"
  },
  {
   "expr": "-('  x ')",
   "truth": "RETURN null"
  },
  {
   "expr": "(1e21) === (1)",
   "truth": "RETURN false"
  },
  {
   "expr": "[10, 9, 100].map(parseInt)",
   "truth": "RETURN [10,null,4]"
  },
  {
   "expr": "(1.005).toFixed(2)",
   "truth": "RETURN \"1.00\""
  },
  {
   "expr": "-7 % 3",
   "truth": "RETURN -1"
  },
  {
   "expr": "Math.round(null)",
   "truth": "RETURN 0"
  },
  {
   "expr": "JSON.stringify(1e21)",
   "truth": "RETURN \"1e+21\""
  },
  {
   "expr": "Number({})",
   "truth": "RETURN null"
  },
  {
   "expr": "Boolean(0.1)",
   "truth": "RETURN true"
  },
  {
   "expr": "({a: 1}) % ('3')",
   "truth": "RETURN null"
  },
  {
   "expr": "Math.trunc(2.5)",
   "truth": "RETURN 2"
  },
  {
   "expr": "(0) == ({a: 1})",
   "truth": "RETURN false"
  },
  {
   "expr": "5 + \"2\"",
   "truth": "RETURN \"52\""
  },
  {
   "expr": "Math.round(1.005)",
   "truth": "RETURN 1"
  },
  {
   "expr": "Math.floor(1e21)",
   "truth": "RETURN 1e+21"
  },
  {
   "expr": "-(0.2)",
   "truth": "RETURN -0.2"
  },
  {
   "expr": "new Set(\"hello\").size",
   "truth": "RETURN 4"
  },
  {
   "expr": "Number('3')",
   "truth": "RETURN 3"
  },
  {
   "expr": "(0) % ([1, 2, 3])",
   "truth": "RETURN null"
  },
  {
   "expr": "'3:05'.replace(/[aeiou]/g, \"*\")",
   "truth": "RETURN \"3:05\""
  },
  {
   "expr": "'3:05'.toLowerCase()",
   "truth": "RETURN \"3:05\""
  },
  {
   "expr": "(0.2) * ([])",
   "truth": "RETURN 0"
  },
  {
   "expr": "'  pad me  '.repeat(2)",
   "truth": "RETURN \"  pad me    pad me  \""
  },
  {
   "expr": "(['b', 'a']) ?? (0)",
   "truth": "RETURN [\"b\",\"a\"]"
  },
  {
   "expr": "(2.5).toFixed(2)",
   "truth": "RETURN \"2.50\""
  },
  {
   "expr": "'3:05'.lastIndexOf('s')",
   "truth": "RETURN -1"
  },
  {
   "expr": "Boolean('  x ')",
   "truth": "RETURN true"
  },
  {
   "expr": "(true) + \"\"",
   "truth": "RETURN \"true\""
  },
  {
   "expr": "[['b', 'a']].length",
   "truth": "RETURN 1"
  },
  {
   "expr": "parseInt(true)",
   "truth": "RETURN null"
  },
  {
   "expr": "[0].length",
   "truth": "RETURN 1"
  },
  {
   "expr": "(7) * (2.5)",
   "truth": "RETURN 17.5"
  },
  {
   "expr": "'a,b,,c'.replaceAll('s', '')",
   "truth": "RETURN \"a,b,,c\""
  },
  {
   "expr": "Number(0)",
   "truth": "RETURN 0"
  },
  {
   "expr": "(-3) === ({a: 1})",
   "truth": "RETURN false"
  },
  {
   "expr": "[3, 1, 2].find(x => x > 1)",
   "truth": "RETURN 3"
  },
  {
   "expr": "parseFloat(\"0.1 + 0.2\")",
   "truth": "RETURN 0.1"
  },
  {
   "expr": "'Mississippi'.includes('ss')",
   "truth": "RETURN true"
  },
  {
   "expr": "(0.2) || (1e21)",
   "truth": "RETURN 0.2"
  },
  {
   "expr": "'a,b,,c'.trimEnd()",
   "truth": "RETURN \"a,b,,c\""
  },
  {
   "expr": "[1.5, 2.25, -3].findIndex(x => x > 1)",
   "truth": "RETURN 0"
  },
  {
   "expr": "Math.floor(['b', 'a'])",
   "truth": "RETURN null"
  },
  {
   "expr": "('3') === (1e21)",
   "truth": "RETURN false"
  },
  {
   "expr": "!(true)",
   "truth": "RETURN false"
  },
  {
   "expr": "`<${true}>`",
   "truth": "RETURN \"<true>\""
  },
  {
   "expr": "'  pad me  '.slice(-2)",
   "truth": "RETURN \"  \""
  },
  {
   "expr": "'Hello World'.replaceAll('s', '')",
   "truth": "RETURN \"Hello World\""
  },
  {
   "expr": "(2.5).toPrecision(3)",
   "truth": "RETURN \"2.50\""
  },
  {
   "expr": "Number(true)",
   "truth": "RETURN 1"
  },
  {
   "expr": "(-0.5) < (true)",
   "truth": "RETURN true"
  },
  {
   "expr": "`<${[1, 2, 3]}>`",
   "truth": "RETURN \"<1,2,3>\""
  },
  {
   "expr": "9007199254740993",
   "truth": "RETURN 9007199254740992"
  },
  {
   "expr": "[1.5, 2.25, -3].map(Number)",
   "truth": "RETURN [1.5,2.25,-3]"
  },
  {
   "expr": "JSON.stringify(false)",
   "truth": "RETURN \"false\""
  },
  {
   "expr": "('ab') % (['b', 'a'])",
   "truth": "RETURN null"
  },
  {
   "expr": "`<${false}>`",
   "truth": "RETURN \"<false>\""
  },
  {
   "expr": "([]) ** ('')",
   "truth": "RETURN 1"
  },
  {
   "expr": "\"5\" + 2",
   "truth": "RETURN \"52\""
  },
  {
   "expr": "'Hello World'.replace('s', 'S')",
   "truth": "RETURN \"Hello World\""
  },
  {
   "expr": "(7) && (0.1)",
   "truth": "RETURN 0.1"
  },
  {
   "expr": "('ab') || (1e21)",
   "truth": "RETURN \"ab\""
  },
  {
   "expr": "(0.2) || (['b', 'a'])",
   "truth": "RETURN 0.2"
  },
  {
   "expr": "(null) ** (-0.5)",
   "truth": "RETURN null"
  },
  {
   "expr": "typeof (true)",
   "truth": "RETURN \"boolean\""
  },
  {
   "expr": "JSON.stringify(['b', 'a'])",
   "truth": "RETURN \"[\\\"b\\\",\\\"a\\\"]\""
  },
  {
   "expr": "['pear', 'Apple', 'fig'].sort()",
   "truth": "RETURN [\"Apple\",\"fig\",\"pear\"]"
  },
  {
   "expr": "'Hello World'.split('').reverse().join('')",
   "truth": "RETURN \"dlroW olleH\""
  },
  {
   "expr": "Number((99.995).toFixed(1))",
   "truth": "RETURN 100"
  },
  {
   "expr": "('3') * ('')",
   "truth": "RETURN 0"
  },
  {
   "expr": "'abc'.split(/,+/)",
   "truth": "RETURN [\"abc\"]"
  },
  {
   "expr": "['pear', 'Apple', 'fig'].filter(x => x)",
   "truth": "RETURN [\"pear\",\"Apple\",\"fig\"]"
  },
  {
   "expr": "Array.from([], x => [x])",
   "truth": "RETURN []"
  },
  {
   "expr": "(7) * (null)",
   "truth": "RETURN 0"
  },
  {
   "expr": "(1) * ('ab')",
   "truth": "RETURN null"
  },
  {
   "expr": "(1e21) % (1e21)",
   "truth": "RETURN 0"
  },
  {
   "expr": "[[1, 2], [3]].sort((a, b) => a - b)",
   "truth": "RETURN [[1,2],[3]]"
  },
  {
   "expr": "parseInt(\"0x1f\")",
   "truth": "RETURN 31"
  },
  {
   "expr": "!([])",
   "truth": "RETURN false"
  },
  {
   "expr": "parseInt(-0.5)",
   "truth": "RETURN 0"
  },
  {
   "expr": "Math.round('')",
   "truth": "RETURN 0"
  },
  {
   "expr": "Boolean(true)",
   "truth": "RETURN true"
  },
  {
   "expr": "(-0.5) == ({a: 1})",
   "truth": "RETURN false"
  },
  {
   "expr": "[...'3:05']",
   "truth": "RETURN [\"3\",\":\",\"0\",\"5\"]"
  },
  {
   "expr": "Boolean('ab')",
   "truth": "RETURN true"
  },
  {
   "expr": "String('  x ')",
   "truth": "RETURN \"  x \""
  },
  {
   "expr": "'3:05'.match(/s+/g)",
   "truth": "RETURN null"
  },
  {
   "expr": "'3:05'.split(\" \")",
   "truth": "RETURN [\"3:05\"]"
  },
  {
   "expr": "[[1, 2], [3]].every(x => x > 0)",
   "truth": "RETURN false"
  },
  {
   "expr": "Math.max(...[])",
   "truth": "RETURN null"
  },
  {
   "expr": "'Mississippi'.concat(\"!\")",
   "truth": "RETURN \"Mississippi!\""
  },
  {
   "expr": "(-0.5) ** ('4:25')",
   "truth": "RETURN null"
  },
  {
   "expr": "String(undefined)",
   "truth": "RETURN \"undefined\""
  },
  {
   "expr": "parseFloat(-3)",
   "truth": "RETURN -3"
  },
  {
   "expr": "(1e21) && (null)",
   "truth": "RETURN null"
  },
  {
   "expr": "(2.5).toFixed(0)",
   "truth": "RETURN \"3\""
  },
  {
   "expr": "'a,b,,c'.split('')",
   "truth": "RETURN [\"a\",\",\",\"b\",\",\",\",\",\"c\"]"
  },
  {
   "expr": "('ab') ** (true)",
   "truth": "RETURN null"
  },
  {
   "expr": "'Hello World'.split(\" \")",
   "truth": "RETURN [\"Hello\",\"World\"]"
  },
  {
   "expr": "typeof (2.5)",
   "truth": "RETURN \"number\""
  },
  {
   "expr": "Number(null)",
   "truth": "RETURN 0"
  },
  {
   "expr": "-(true)",
   "truth": "RETURN -1"
  },
  {
   "expr": "(0) < (-0.5)",
   "truth": "RETURN false"
  },
  {
   "expr": "parseInt('3')",
   "truth": "RETURN 3"
  },
  {
   "expr": "parseFloat(\"2.675\")",
   "truth": "RETURN 2.675"
  },
  {
   "expr": "String([10, 9, 100])",
   "truth": "RETURN \"10,9,100\""
  },
  {
   "expr": "(-3) + \"\"",
   "truth": "RETURN \"-3\""
  },
  {
   "expr": "'Mississippi'.endsWith('c')",
   "truth": "RETURN false"
  },
  {
   "expr": "String('')",
   "truth": "RETURN \"\""
  },
  {
   "expr": "`<${'3'}>`",
   "truth": "RETURN \"<3>\""
  },
  {
   "expr": "'abc'.lastIndexOf('s')",
   "truth": "RETURN -1"
  },
  {
   "expr": "-(2.5)",
   "truth": "RETURN -2.5"
  },
  {
   "expr": "(7) === (null)",
   "truth": "RETURN false"
  },
  {
   "expr": "[true].length",
   "truth": "RETURN 1"
  },
  {
   "expr": "'Hello World'.endsWith('c')",
   "truth": "RETURN false"
  },
  {
   "expr": "(-3) || (undefined)",
   "truth": "RETURN -3"
  },
  {
   "expr": "(1e21) / (undefined)",
   "truth": "RETURN null"
  },
  {
   "expr": "([1, 2, 3]) + \"\"",
   "truth": "RETURN \"1,2,3\""
  },
  {
   "expr": "''.split(/,+/)",
   "truth": "RETURN [\"\"]"
  },
  {
   "expr": "parseInt({})",
   "truth": "RETURN null"
  },
  {
   "expr": "(undefined) * (true)",
   "truth": "RETURN null"
  },
  {
   "expr": "(1) - ('4:25')",
   "truth": "RETURN null"
  },
  {
   "expr": "[10, 9, 100].map(x => x * 2)",
   "truth": "RETURN [20,18,200]"
  },
  {
   "expr": "(undefined) / (['b', 'a'])",
   "truth": "RETURN null"
  },
  {
   "expr": "-(-3)",
   "truth": "RETURN 3"
  },
  {
   "expr": "'Mississippi'.split(\" \")",
   "truth": "RETURN [\"Mississippi\"]"
  },
  {
   "expr": "(['b', 'a']) + \"\"",
   "truth": "RETURN \"b,a\""
  },
  {
   "expr": "Math.round(1)",
   "truth": "RETURN 1"
  },
  {
   "expr": "[...'']",
   "truth": "RETURN []"
  },
  {
   "expr": "parseFloat(\"1.005\")",
   "truth": "RETURN 1.005"
  },
  {
   "expr": "(-3) < (undefined)",
   "truth": "RETURN false"
  },
  {
   "expr": "(['b', 'a']) && (undefined)",
   "truth": "RETURN undefined"
  },
  {
   "expr": "[-3].length",
   "truth": "RETURN 1"
  },
  {
   "expr": "String(-0)",
   "truth": "RETURN \"0\""
  },
  {
   "expr": "('3') + \"\"",
   "truth": "RETURN \"3\""
  },
  {
   "expr": "''.search(/o/)",
   "truth": "RETURN -1"
  },
  {
   "expr": "JSON.stringify('4:25')",
   "truth": "RETURN \"\\\"4:25\\\"\""
  },
  {
   "expr": "'x-y-z'.charCodeAt(0)",
   "truth": "RETURN 120"
  },
  {
   "expr": "['pear', 'Apple', 'fig'].filter((x, i) => i % 2 === 0)",
   "truth": "RETURN [\"pear\",\"fig\"]"
  },
  {
   "expr": "(0.2) + ('3')",
   "truth": "RETURN \"0.23\""
  },
  {
   "expr": "['pear', 'Apple', 'fig'].reverse()",
   "truth": "RETURN [\"fig\",\"Apple\",\"pear\"]"
  },
  {
   "expr": "parseFloat('4:25')",
   "truth": "RETURN 4"
  },
  {
   "expr": "Boolean('')",
   "truth": "RETURN false"
  },
  {
   "expr": "'3:05'.charAt(2)",
   "truth": "RETURN \"0\""
  },
  {
   "expr": "JSON.stringify('')",
   "truth": "RETURN \"\\\"\\\"\""
  },
  {
   "expr": "('3') ?? (1e21)",
   "truth": "RETURN \"3\""
  },
  {
   "expr": "(true) * (0.2)",
   "truth": "RETURN 0.2"
  },
  {
   "expr": "'x-y-z'.includes('ss')",
   "truth": "RETURN false"
  },
  {
   "expr": "parseFloat({})",
   "truth": "RETURN null"
  },
  {
   "expr": "Number((-2.5).toFixed(1))",
   "truth": "RETURN -2.5"
  },
  {
   "expr": "'3:05'.trim()",
   "truth": "RETURN \"3:05\""
  },
  {
   "expr": "(1234.5678).toFixed(2)",
   "truth": "RETURN \"1234.57\""
  },
  {
   "expr": "'a,b,,c'.charAt(2)",
   "truth": "RETURN \"b\""
  },
  {
   "expr": "'Mississippi'.trim()",
   "truth": "RETURN \"Mississippi\""
  },
  {
   "expr": "(false) < (-3)",
   "truth": "RETURN false"
  },
  {
   "expr": "Boolean(['b', 'a'])",
   "truth": "RETURN true"
  },
  {
   "expr": "parseFloat('ab')",
   "truth": "RETURN null"
  },
  {
   "expr": "Math.round(99.995 * 10) / 10",
   "truth": "RETURN 100"
  },
  {
   "expr": "('3') % (true)",
   "truth": "RETURN 0"
  },
  {
   "expr": "Math.round(['b', 'a'])",
   "truth": "RETURN null"
  },
  {
   "expr": "'Hello World'.slice(-2)",
   "truth": "RETURN \"ld\""
  },
  {
   "expr": "[[1, 2], [3]].map(String)",
   "truth": "RETURN [\"1,2\",\"3\"]"
  },
  {
   "expr": "typeof ({a: 1})",
   "truth": "RETURN \"object\""
  },
  {
   "expr": "[] + {}",
   "truth": "RETURN \"[object Object]\""
  }
 ],
 "py": [
  {
   "expr": "f'{0.2!r}'",
   "truth": "RETURN '0.2'"
  },
  {
   "expr": "'  pad me  '.count('s')",
   "truth": "RETURN 0"
  },
  {
   "expr": "(0.2) or (10**20)",
   "truth": "RETURN 0.2"
  },
  {
   "expr": "sorted(0.1)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "max('')",
   "truth": "ERROR ValueError"
  },
  {
   "expr": "('4:25') in (3.0)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "{i: x for i, x in enumerate([[1, 2], [3]])}",
   "truth": "RETURN {0: [1, 2], 1: [3]}"
  },
  {
   "expr": "repr('Hello World')",
   "truth": "RETURN \"'Hello World'\""
  },
  {
   "expr": "round(3.5, 1)",
   "truth": "RETURN 3.5"
  },
  {
   "expr": "f'{False}'",
   "truth": "RETURN 'False'"
  },
  {
   "expr": "f'{3.0:,}'",
   "truth": "RETURN '3.0'"
  },
  {
   "expr": "('4:25') // (-0.5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "('') * ('')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "list(0)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "round([1, 2, 3])",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "round(12.345, 2)",
   "truth": "RETURN 12.35"
  },
  {
   "expr": "sorted('Hello World')",
   "truth": "RETURN [' ', 'H', 'W', 'd', 'e', 'l', 'l', 'l', 'o', 'o', 'r']"
  },
  {
   "expr": "f'{''!r}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "float(' x y ')",
   "truth": "ERROR ValueError"
  },
  {
   "expr": "f'{{'a': 1}:.1%}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "max([])",
   "truth": "ERROR ValueError"
  },
  {
   "expr": "'abc'[::-1]",
   "truth": "RETURN 'cba'"
  },
  {
   "expr": "f'{[]:.1%}'",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "bool(())",
   "truth": "RETURN False"
  },
  {
   "expr": "tuple([(2, \"b\"), (1, \"a\")])",
   "truth": "RETURN ((2, 'b'), (1, 'a'))"
  },
  {
   "expr": "f'{['b', 'a']:>6}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "([]) ** (0)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'3:05'.partition(':')",
   "truth": "RETURN ('3', ':', '05')"
  },
  {
   "expr": "f'{{}:,}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "(-3) == (0.2)",
   "truth": "RETURN False"
  },
  {
   "expr": "len([])",
   "truth": "RETURN 0"
  },
  {
   "expr": "(10**20) == (-3)",
   "truth": "RETURN False"
  },
  {
   "expr": "({'a': 1}) * (None)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'Hello World'.rjust(9)",
   "truth": "RETURN 'Hello World'"
  },
  {
   "expr": "int(True)",
   "truth": "RETURN 1"
  },
  {
   "expr": "'x-y-z'.center(11, \"*\")",
   "truth": "RETURN '***x-y-z***'"
  },
  {
   "expr": "('3') % (-3)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(7) / (3.0)",
   "truth": "RETURN 2.3333333333333335"
  },
  {
   "expr": "abs(10**20)",
   "truth": "RETURN 100000000000000000000"
  },
  {
   "expr": "(3.0) and (None)",
   "truth": "RETURN None"
  },
  {
   "expr": "(False) or (' x y ')",
   "truth": "RETURN ' x y '"
  },
  {
   "expr": "3.5 / 7",
   "truth": "RETURN 0.5"
  },
  {
   "expr": "round(3.5, 2)",
   "truth": "RETURN 3.5"
  },
  {
   "expr": "(2.5) % (['b', 'a'])",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "''.capitalize()",
   "truth": "RETURN ''"
  },
  {
   "expr": "len('abc')",
   "truth": "RETURN 3"
  },
  {
   "expr": "''.startswith('H')",
   "truth": "RETURN False"
  },
  {
   "expr": "([]) % (['b', 'a'])",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "not 'ab'",
   "truth": "RETURN False"
  },
  {
   "expr": "(()) - (1)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(False) * ('3')",
   "truth": "RETURN ''"
  },
  {
   "expr": "'abc'.title()",
   "truth": "RETURN 'Abc'"
  },
  {
   "expr": "'Hello World'.split(',')",
   "truth": "RETURN ['Hello World']"
  },
  {
   "expr": "{1: 'x', 2: 'y'}.get(\"z\", 0)",
   "truth": "RETURN 0"
  },
  {
   "expr": "('ab') // (None)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "float(10**20)",
   "truth": "RETURN 1e+20"
  },
  {
   "expr": "[[1, 2], [3]] * 2",
   "truth": "RETURN [[1, 2], [3], [1, 2], [3]]"
  },
  {
   "expr": "(3.0) / (-3)",
   "truth": "RETURN -1.0"
  },
  {
   "expr": "[1.5, 2.25, -3][-1]",
   "truth": "RETURN -3"
  },
  {
   "expr": "(7) // (7)",
   "truth": "RETURN 1"
  },
  {
   "expr": "int(10**20)",
   "truth": "RETURN 100000000000000000000"
  },
  {
   "expr": "(2.5) / (1e-5)",
   "truth": "RETURN 249999.99999999997"
  },
  {
   "expr": "(7) % ((1, 2))",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "f'{()!r}'",
   "truth": "RETURN '()'"
  },
  {
   "expr": "'Hello World'.split()",
   "truth": "RETURN ['Hello', 'World']"
  },
  {
   "expr": "(1) or ('3')",
   "truth": "RETURN 1"
  },
  {
   "expr": "(7) ** ('4:25')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "f'{-0.5!r}'",
   "truth": "RETURN '-0.5'"
  },
  {
   "expr": "([1, 2, 3]) and (())",
   "truth": "RETURN ()"
  },
  {
   "expr": "f'{0:.1%}'",
   "truth": "RETURN '0.0%'"
  },
  {
   "expr": "list(filter(None, [[1, 2], [3]]))",
   "truth": "RETURN [[1, 2], [3]]"
  },
  {
   "expr": "('') in ('ab')",
   "truth": "RETURN True"
  },
  {
   "expr": "'Mississippi'.isdigit()",
   "truth": "RETURN False"
  },
  {
   "expr": "f'{1.005:.2f}'",
   "truth": "RETURN '1.00'"
  },
  {
   "expr": "('ab') in (2.5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "f'{0:05d}'",
   "truth": "RETURN '00000'"
  },
  {
   "expr": "(None) or (['b', 'a'])",
   "truth": "RETURN ['b', 'a']"
  },
  {
   "expr": "(1e-5) % ('')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(0.2) - (())",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "[x for x in [(2, \"b\"), (1, \"a\")] if x]",
   "truth": "RETURN [(2, 'b'), (1, 'a')]"
  },
  {
   "expr": "repr(10**20)",
   "truth": "RETURN '100000000000000000000'"
  },
  {
   "expr": "bool(-0.5)",
   "truth": "RETURN True"
  },
  {
   "expr": "-(3.0)",
   "truth": "RETURN -3.0"
  },
  {
   "expr": "(-0.5) ** (-0.5)",
   "truth": "RETURN (8.659560562354934e-17-1.4142135623730951j)"
  },
  {
   "expr": "list(reversed([[1, 2], [3]]))",
   "truth": "RETURN [[3], [1, 2]]"
  },
  {
   "expr": "str(0.1)",
   "truth": "RETURN '0.1'"
  },
  {
   "expr": "([1, 2, 3]) + ([])",
   "truth": "RETURN [1, 2, 3]"
  },
  {
   "expr": "f'{0.5:.1f}'",
   "truth": "RETURN '0.5'"
  },
  {
   "expr": "f'{0!r}'",
   "truth": "RETURN '0'"
  },
  {
   "expr": "round('ab')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'  pad me  '.rfind('s')",
   "truth": "RETURN -1"
  },
  {
   "expr": "list('4:25')",
   "truth": "RETURN ['4', ':', '2', '5']"
  },
  {
   "expr": "'x-y-z'.partition(':')",
   "truth": "RETURN ('x-y-z', '', '')"
  },
  {
   "expr": "(False) - (7)",
   "truth": "RETURN -7"
  },
  {
   "expr": "'abc'.count('s')",
   "truth": "RETURN 0"
  },
  {
   "expr": "(1e-5) % (2.5)",
   "truth": "RETURN 1e-05"
  },
  {
   "expr": "f'{2.675:.2f}'",
   "truth": "RETURN '2.67'"
  },
  {
   "expr": "max(1)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'x-y-z'.rjust(9)",
   "truth": "RETURN '    x-y-z'"
  },
  {
   "expr": "(2.5) / ({})",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "isinstance(3, float)",
   "truth": "RETURN False"
  },
  {
   "expr": "(-3) or ((1, 2))",
   "truth": "RETURN -3"
  },
  {
   "expr": "f'{{}:.2f}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "list(reversed([1.5, 2.25, -3]))",
   "truth": "RETURN [-3, 2.25, 1.5]"
  },
  {
   "expr": "'Mississippi'.ljust(9, \".\")",
   "truth": "RETURN 'Mississippi'"
  },
  {
   "expr": "f'{'ab':05d}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "'Mississippi'.zfill(8)",
   "truth": "RETURN 'Mississippi'"
  },
  {
   "expr": "all([3, 1, 2])",
   "truth": "RETURN True"
  },
  {
   "expr": "all([(2, \"b\"), (1, \"a\")])",
   "truth": "RETURN True"
  },
  {
   "expr": "str(7)",
   "truth": "RETURN '7'"
  },
  {
   "expr": "(True) in ((1, 2))",
   "truth": "RETURN True"
  },
  {
   "expr": "int(2.5)",
   "truth": "RETURN 2"
  },
  {
   "expr": "f'{0.125:.2f}'",
   "truth": "RETURN '0.12'"
  },
  {
   "expr": "bool(-3)",
   "truth": "RETURN True"
  },
  {
   "expr": "'-'.join('a,b,,c')",
   "truth": "RETURN 'a-,-b-,-,-c'"
  },
  {
   "expr": "repr(1e-5)",
   "truth": "RETURN '1e-05'"
  },
  {
   "expr": "f'{7.25:.1f}'",
   "truth": "RETURN '7.2'"
  },
  {
   "expr": "sum(0.1)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(0) % ({})",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "('ab') or (-3)",
   "truth": "RETURN 'ab'"
  },
  {
   "expr": "([]) or (3.0)",
   "truth": "RETURN 3.0"
  },
  {
   "expr": "len(7)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'Mississippi'[5]",
   "truth": "RETURN 's'"
  },
  {
   "expr": "not -3",
   "truth": "RETURN False"
  },
  {
   "expr": "'3:05'.isalpha()",
   "truth": "RETURN False"
  },
  {
   "expr": "len(0)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "sum(())",
   "truth": "RETURN 0"
  },
  {
   "expr": "sorted([[1, 2], [3]], key=len)",
   "truth": "RETURN [[3], [1, 2]]"
  },
  {
   "expr": "'3:05'.upper()",
   "truth": "RETURN '3:05'"
  },
  {
   "expr": "'  pad me  '.split()",
   "truth": "RETURN ['pad', 'me']"
  },
  {
   "expr": "({}) or ({})",
   "truth": "RETURN {}"
  },
  {
   "expr": "-('Hello World')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(()) ** (3.0)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "('') < (())",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(' x y ') * (0.1)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(3.0) * (0.2)",
   "truth": "RETURN 0.6000000000000001"
  },
  {
   "expr": "(0.1) % (1)",
   "truth": "RETURN 0.1"
  },
  {
   "expr": "sorted(None)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "round(99.995, 1)",
   "truth": "RETURN 100.0"
  },
  {
   "expr": "min(False)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "repr(-0.5)",
   "truth": "RETURN '-0.5'"
  },
  {
   "expr": "'a,b,,c'.upper()",
   "truth": "RETURN 'A,B,,C'"
  },
  {
   "expr": "(0.2) == ('')",
   "truth": "RETURN False"
  },
  {
   "expr": "abs(' x y ')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "f'{['b', 'a']:,}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "abs(7)",
   "truth": "RETURN 7"
  },
  {
   "expr": "f'{2.5:.1%}'",
   "truth": "RETURN '250.0%'"
  },
  {
   "expr": "float(\"1e3\")",
   "truth": "RETURN 1000.0"
  },
  {
   "expr": "float(['b', 'a'])",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'-'.join('  pad me  ')",
   "truth": "RETURN ' - -p-a-d- -m-e- - '"
  },
  {
   "expr": "sum('Hello World')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "f'{2.5:05d}'",
   "truth": "ERROR ValueError"
  },
  {
   "expr": "({}) / (10**20)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "[1.5, 2.25, -3] + [0]",
   "truth": "RETURN [1.5, 2.25, -3, 0]"
  },
  {
   "expr": "'Hello World'.replace('s', '', 1)",
   "truth": "RETURN 'Hello World'"
  },
  {
   "expr": "f'{2.675:.1f}'",
   "truth": "RETURN '2.7'"
  },
  {
   "expr": "f'{0.2}'",
   "truth": "RETURN '0.2'"
  },
  {
   "expr": "{'a': 1, 'b': 2}.get(\"z\", 0)",
   "truth": "RETURN 0"
  },
  {
   "expr": "'Hello World'[-2]",
   "truth": "RETURN 'l'"
  },
  {
   "expr": "({}) < ('ab')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "min([(2, \"b\"), (1, \"a\")], default=0)",
   "truth": "RETURN (1, 'a')"
  },
  {
   "expr": "round(-0.05, 2)",
   "truth": "RETURN -0.05"
  },
  {
   "expr": "int(7)",
   "truth": "RETURN 7"
  },
  {
   "expr": "len('4:25')",
   "truth": "RETURN 4"
  },
  {
   "expr": "''.zfill(8)",
   "truth": "RETURN '00000000'"
  },
  {
   "expr": "min(2.5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(-3) or (-0.5)",
   "truth": "RETURN -3"
  },
  {
   "expr": "not ''",
   "truth": "RETURN True"
  },
  {
   "expr": "f'{7:,}'",
   "truth": "RETURN '7'"
  },
  {
   "expr": "(()) - (2.5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "float(0.1)",
   "truth": "RETURN 0.1"
  },
  {
   "expr": "'  pad me  '.center(11, \"*\")",
   "truth": "RETURN '*  pad me  '"
  },
  {
   "expr": "'abc'.removeprefix('He')",
   "truth": "RETURN 'abc'"
  },
  {
   "expr": "'Mississippi'.rjust(9)",
   "truth": "RETURN 'Mississippi'"
  },
  {
   "expr": "12.345 * 3",
   "truth": "RETURN 37.035000000000004"
  },
  {
   "expr": "'x-y-z'.title()",
   "truth": "RETURN 'X-Y-Z'"
  },
  {
   "expr": "'Mississippi'.count('s')",
   "truth": "RETURN 4"
  },
  {
   "expr": "({}) in (1e-5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "sorted([[1, 2], [3]], reverse=True)",
   "truth": "RETURN [[3], [1, 2]]"
  },
  {
   "expr": "repr(0.2)",
   "truth": "RETURN '0.2'"
  },
  {
   "expr": "f'{1e-5}'",
   "truth": "RETURN '1e-05'"
  },
  {
   "expr": "('ab') < ([])",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "('3') ** (())",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(' x y ') * (1e-5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'a,b,,c'.title()",
   "truth": "RETURN 'A,B,,C'"
  },
  {
   "expr": "([1, 2, 3]) % ({})",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'-'.join('3:05')",
   "truth": "RETURN '3-:-0-5'"
  },
  {
   "expr": "len(0.1)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "f'{99.995:,.2f}'",
   "truth": "RETURN '100.00'"
  },
  {
   "expr": "(-0.5) - (3.0)",
   "truth": "RETURN -3.5"
  },
  {
   "expr": "({'a': 1}) // (' x y ')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "99.995 // 0.1",
   "truth": "RETURN 999.0"
  },
  {
   "expr": "list([])",
   "truth": "RETURN []"
  },
  {
   "expr": "f'{2.5!r}'",
   "truth": "RETURN '2.5'"
  },
  {
   "expr": "'Mississippi'.isalpha()",
   "truth": "RETURN True"
  },
  {
   "expr": "'abc'.partition(':')",
   "truth": "RETURN ('abc', '', '')"
  },
  {
   "expr": "not {}",
   "truth": "RETURN True"
  },
  {
   "expr": "(-0.5) - ({'a': 1})",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "3.5 % 0.3",
   "truth": "RETURN 0.20000000000000012"
  },
  {
   "expr": "(0.1) < (2.5)",
   "truth": "RETURN True"
  },
  {
   "expr": "list(1)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "f'{3.0!r}'",
   "truth": "RETURN '3.0'"
  },
  {
   "expr": "not 0.1",
   "truth": "RETURN False"
  },
  {
   "expr": "round(1.005, 2)",
   "truth": "RETURN 1.0"
  },
  {
   "expr": "('4:25') == (2.5)",
   "truth": "RETURN False"
  },
  {
   "expr": "int(1e-5)",
   "truth": "RETURN 0"
  },
  {
   "expr": "abs(None)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(3.0) and ('4:25')",
   "truth": "RETURN '4:25'"
  },
  {
   "expr": "(' x y ') in (0.1)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(7) * (0)",
   "truth": "RETURN 0"
  },
  {
   "expr": "f'{-0.5:>6}'",
   "truth": "RETURN '  -0.5'"
  },
  {
   "expr": "len([])",
   "truth": "RETURN 0"
  },
  {
   "expr": "'Hello World'[5]",
   "truth": "RETURN ' '"
  },
  {
   "expr": "'Mississippi'.replace('s', '', 1)",
   "truth": "RETURN 'Misissippi'"
  },
  {
   "expr": "len({'a': 1})",
   "truth": "RETURN 1"
  },
  {
   "expr": "'Hello World'.upper()",
   "truth": "RETURN 'HELLO WORLD'"
  },
  {
   "expr": "(0) - ('ab')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "min(1e-5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "list('3:05')",
   "truth": "RETURN ['3', ':', '0', '5']"
  },
  {
   "expr": "(3.0) // (0.1)",
   "truth": "RETURN 29.0"
  },
  {
   "expr": "'Hello World'.count('s')",
   "truth": "RETURN 0"
  },
  {
   "expr": "('Hello World') * ('3')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'3:05'.zfill(8)",
   "truth": "RETURN '00003:05'"
  },
  {
   "expr": "(7) in (None)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "31.25 % 0.3",
   "truth": "RETURN 0.050000000000001155"
  },
  {
   "expr": "(1e-5) < ('4:25')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "{'a': 1, 'b': 2} == {'a': 1, 'b': 2}",
   "truth": "RETURN True"
  },
  {
   "expr": "'  pad me  '.split(',')",
   "truth": "RETURN ['  pad me  ']"
  },
  {
   "expr": "'a,b,,c'.capitalize()",
   "truth": "RETURN 'A,b,,c'"
  },
  {
   "expr": "list(map(str, ['pear', 'Apple', 'fig']))",
   "truth": "RETURN ['pear', 'Apple', 'fig']"
  },
  {
   "expr": "'3:05'.endswith(('d', 'c'))",
   "truth": "RETURN False"
  },
  {
   "expr": "'3:05'.replace('s', 'S')",
   "truth": "RETURN '3:05'"
  },
  {
   "expr": "(0.1) % (0)",
   "truth": "ERROR ZeroDivisionError"
  },
  {
   "expr": "({}) * (1)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "{i: x for i, x in enumerate([1.5, 2.25, -3])}",
   "truth": "RETURN {0: 1.5, 1: 2.25, 2: -3}"
  },
  {
   "expr": "round('3')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "list({1: 'x', 2: 'y'}.values())",
   "truth": "RETURN ['x', 'y']"
  },
  {
   "expr": "([]) % ('Hello World')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'a,b,,c'.startswith('H')",
   "truth": "RETURN False"
  },
  {
   "expr": "list({}.keys())",
   "truth": "RETURN []"
  },
  {
   "expr": "f'{-0.05:.1f}'",
   "truth": "RETURN '-0.1'"
  },
  {
   "expr": "repr([1, 2, 3])",
   "truth": "RETURN '[1, 2, 3]'"
  },
  {
   "expr": "int(\"  42 \")",
   "truth": "RETURN 42"
  },
  {
   "expr": "1.5 % 0.3",
   "truth": "RETURN 5.551115123125783e-17"
  },
  {
   "expr": "((1, 2)) in (True)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(0.2) * ('ab')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "f'{'3':.2f}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "(0.2) == (' x y ')",
   "truth": "RETURN False"
  },
  {
   "expr": "('') + (False)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(-0.5) or (['b', 'a'])",
   "truth": "RETURN -0.5"
  },
  {
   "expr": "0.375 % 0.3",
   "truth": "RETURN 0.07500000000000001"
  },
  {
   "expr": "\"x\" * -1",
   "truth": "RETURN ''"
  },
  {
   "expr": "(()) or (0.2)",
   "truth": "RETURN 0.2"
  },
  {
   "expr": "max('3')",
   "truth": "RETURN '3'"
  },
  {
   "expr": "f'{' x y ':,}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "f'{{'a': 1}!r}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "round(1, 1)",
   "truth": "RETURN 1"
  },
  {
   "expr": "f'{7!r}'",
   "truth": "RETURN '7'"
  },
  {
   "expr": "({'a': 1}) % (0)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "list(filter(None, ['pear', 'Apple', 'fig']))",
   "truth": "RETURN ['pear', 'Apple', 'fig']"
  },
  {
   "expr": "f'{-3}'",
   "truth": "RETURN '-3'"
  },
  {
   "expr": "'Mississippi'.split(',')",
   "truth": "RETURN ['Mississippi']"
  },
  {
   "expr": "'  pad me  '.isalpha()",
   "truth": "RETURN False"
  },
  {
   "expr": "f'{1}'",
   "truth": "RETURN '1'"
  },
  {
   "expr": "(True) ** (False)",
   "truth": "RETURN 1"
  },
  {
   "expr": "f'{-1.5:.2f}'",
   "truth": "RETURN '-1.50'"
  },
  {
   "expr": "f'{'3':,}'",
   "truth": "ERROR SyntaxError"
  },
  {
   "expr": "(-3) ** (7)",
   "truth": "RETURN -2187"
  },
  {
   "expr": "(True) ** (())",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'Mississippi'.endswith(('d', 'c'))",
   "truth": "RETURN False"
  },
  {
   "expr": "('3') + (2.5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "int('')",
   "truth": "ERROR ValueError"
  },
  {
   "expr": "str(-0.5)",
   "truth": "RETURN '-0.5'"
  },
  {
   "expr": "max(' x y ')",
   "truth": "RETURN 'y'"
  },
  {
   "expr": "0.5 // 0.1",
   "truth": "RETURN 4.0"
  },
  {
   "expr": "1.5 * 3",
   "truth": "RETURN 4.5"
  },
  {
   "expr": "{1: 'x', 2: 'y'}.items()",
   "truth": "RETURN dict_items([(1, 'x'), (2, 'y')])"
  },
  {
   "expr": "(False) or ([])",
   "truth": "RETURN []"
  },
  {
   "expr": "round(0.1, 1)",
   "truth": "RETURN 0.1"
  },
  {
   "expr": "(-3) < (None)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(-0.5) / (-3)",
   "truth": "RETURN 0.16666666666666666"
  },
  {
   "expr": "('Hello World') + (10**20)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "dict({1: 'x', 2: 'y'}, c=3)",
   "truth": "RETURN {1: 'x', 2: 'y', 'c': 3}"
  },
  {
   "expr": "sum(-0.5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "([1, 2, 3]) // (' x y ')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "-(-3)",
   "truth": "RETURN 3"
  },
  {
   "expr": "bool('4:25')",
   "truth": "RETURN True"
  },
  {
   "expr": "-(' x y ')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "('') // ({'a': 1})",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(0.2) + ({})",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "('') / (-3)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "('4:25') % (' x y ')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(()) or (['b', 'a'])",
   "truth": "RETURN ['b', 'a']"
  },
  {
   "expr": "((1, 2)) + ({})",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "sorted([])",
   "truth": "RETURN []"
  },
  {
   "expr": "round(-0.5)",
   "truth": "RETURN 0"
  },
  {
   "expr": "sorted([1, 2, 3])",
   "truth": "RETURN [1, 2, 3]"
  },
  {
   "expr": "f'{2.5:.1f}'",
   "truth": "RETURN '2.5'"
  },
  {
   "expr": "len({})",
   "truth": "RETURN 0"
  },
  {
   "expr": "(' x y ') ** (2.5)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(-0.5) / (())",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "(1) % (-0.5)",
   "truth": "RETURN -0.0"
  },
  {
   "expr": "str(0.2)",
   "truth": "RETURN '0.2'"
  },
  {
   "expr": "tuple(['pear', 'Apple', 'fig'])",
   "truth": "RETURN ('pear', 'Apple', 'fig')"
  },
  {
   "expr": "sorted([(2, \"b\"), (1, \"a\")])",
   "truth": "RETURN [(1, 'a'), (2, 'b')]"
  },
  {
   "expr": "(2.5) == (())",
   "truth": "RETURN False"
  },
  {
   "expr": "f'{7.25:,.2f}'",
   "truth": "RETURN '7.25'"
  },
  {
   "expr": "'3:05'.count('s')",
   "truth": "RETURN 0"
  },
  {
   "expr": "[(2, \"b\"), (1, \"a\")][1:]",
   "truth": "RETURN [(1, 'a')]"
  },
  {
   "expr": "sum((1, 2))",
   "truth": "RETURN 3"
  },
  {
   "expr": "'abc'.replace('s', '', 1)",
   "truth": "RETURN 'abc'"
  },
  {
   "expr": "round(0.125, 1)",
   "truth": "RETURN 0.1"
  },
  {
   "expr": "(' x y ') - ('3')",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "'x-y-z'.split()",
   "truth": "RETURN ['x-y-z']"
  },
  {
   "expr": "\"a\" in {1: 'x', 2: 'y'}",
   "truth": "RETURN False"
  },
  {
   "expr": "float(7)",
   "truth": "RETURN 7.0"
  },
  {
   "expr": "(7) and (10**20)",
   "truth": "RETURN 100000000000000000000"
  },
  {
   "expr": "f'{3.0:.2f}'",
   "truth": "RETURN '3.00'"
  },
  {
   "expr": "sorted({1: 'x', 2: 'y'})",
   "truth": "RETURN [1, 2]"
  },
  {
   "expr": "'  pad me  '.upper()",
   "truth": "RETURN '  PAD ME  '"
  },
  {
   "expr": "f'{99.995:.1f}'",
   "truth": "RETURN '100.0'"
  },
  {
   "expr": "'abc'.index('b')",
   "truth": "RETURN 1"
  },
  {
   "expr": "bool(0.2)",
   "truth": "RETURN True"
  },
  {
   "expr": "max(0)",
   "truth": "ERROR TypeError"
  },
  {
   "expr": "len([[1, 2], [3]])",
   "truth": "RETURN 2"
  },
  {
   "expr": "sorted([3, 1, 2], key=str)",
   "truth": "RETURN [1, 2, 3]"
  },
  {
   "expr": "float('3')",
   "truth": "RETURN 3.0"
  },
  {
   "expr": "not 7",
   "truth": "RETURN False"
  },
  {
   "expr": "list({})",
   "truth": "RETURN []"
  },
  {
   "expr": "31.25 // 0.1",
   "truth": "RETURN 312.0"
  }
 ]
}
