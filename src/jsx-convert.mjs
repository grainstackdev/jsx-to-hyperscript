import glob from "glob"
import fs from "fs"
import jsx from "jsx-transform"
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))
const pattern = args._[0]
const writeFlag = args.write
const factory = args.factory || 'h'

// function transform(str) {
//   let lines = str.split("\n")
//
//   const pairs /*: Array<{line: number, col: number}>*/ = []
//   const stack = []
//
//   let insideHtmlTag = false
//   let insideJsx = false
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i]
//     let htmlOpened = /html.*`/.test(line)
//     if (htmlOpened) {
//       insideHtmlTag = true
//       // console.log('insideHtmlTag', insideHtmlTag)
//     }
//     if (insideHtmlTag && /(?<!\\)`/.test(line) && !htmlOpened) {
//       insideHtmlTag = false
//       // console.log('insideHtmlTag', insideHtmlTag)
//     }
//
//     if (!insideHtmlTag) {
//       let opened = false
//       // const
//       // const isInRegexp = (/\/.*<.*\//).test(line)
//       // const isInString = (/("|').*<.*("|')/).test(line)
//       // if (!insideJsx && line.includes("<") && !isInRegexp && !isInString) {
//       const tagOpened = (/(=|:)([^<=:>]*)<[a-zA-Z]/).test(line)
//       // console.log('line', line)
//       // console.log('tagOpened', tagOpened)
//       if (!insideJsx && tagOpened) {
//         insideJsx = true
//         opened = true
//       }
//
//       if (insideJsx) {
//         const opens = line.match(/<(?!\/)/g)?.length ?? 0
//         const closes =
//           (line.match(/\/>/g)?.length ?? 0) +
//           (line.match(/<\/(?!>)/g)?.length ?? 0)
//
//         let count = opens - closes
//
//         if (count > 0) {
//           while (count > 0) {
//             stack.push(null)
//             count--
//           }
//         } else {
//           while (count < 0) {
//             stack.pop()
//             count++
//           }
//         }
//       }
//
//       if (insideJsx && stack.length === 0) {
//         if (opened) {
//           // single line jsx:
//           const start = line.indexOf("<")
//           const end = line.indexOf(">")
//           pairs.push([
//             { line: i, col: start },
//             { line: i, col: end + 1 },
//           ])
//         }
//         insideJsx = false
//       }
//     }
//
//     const lastPair = pairs[pairs.length - 1] ?? [null, null]
//     if (insideJsx && lastPair.length === 2) {
//       const start = line.indexOf("<")
//       pairs.push([{ line: i, col: start }])
//     } else if (!insideJsx && lastPair.length === 1) {
//       const end = line.indexOf(">")
//       lastPair.push({ line: i, col: end + 1 })
//     }
//
//     // console.log('line', line)
//     // console.log('pairs[pairs.length - 1]', pairs[pairs.length - 1])
//   }
//
//   // console.log('pairs', pairs)
//
//   const jsxSections = []
//   for (const pair of pairs) {
//     if (pair[0].line === pair[1].line) {
//       // single line jsx:
//       jsxSections.push(lines[pair[0].line].slice(pair[0].col, pair[1].col))
//       continue
//     }
//     const jsxLines = lines.slice(pair[0].line, pair[1].line + 1)
//     const endIndex =
//       jsxLines
//         .map((line, i) => (i < jsxLines.length - 1 ? line.length : 0))
//         .reduce((acc, cur) => acc + cur, 0) + pair[1].col + (jsxLines.length - 1)
//     const joinedLines = jsxLines.join("\n")
//     jsxSections.push(joinedLines.slice(pair[0].col, endIndex))
//   }
//
//   console.log('jsxSections', jsxSections)
//   const hCode = jsxSections.map(_transform)
//   console.log("hCode", hCode)
//
//   const sections = []
//   for (let i = 0; i < pairs.length; i++) {
//     const prevPair = pairs[i - 1]
//     const pair = pairs[i]
//
//     const prevLine = prevPair?.[1]?.line ?? 0
//     const currentLine = pair[0].line
//
//     const prevLineStart = prevPair?.[1]?.col ?? 0
//
//     const normalLines = lines.slice(prevLine, currentLine + 1)
//     const endIndex = normalLines
//       .map((line, i) => (i < normalLines.length - 1 ? line.length : 0))
//       .reduce((acc, cur) => acc + cur, 0) + pair[0].col + (normalLines.length - 1)
//     const joinedLines = normalLines.join("\n")
//     sections.push(joinedLines.slice(prevLineStart, endIndex))
//   }
//
//   // last line:
//   const lastLine = pairs?.[pairs.length - 1]?.[1]?.line ?? 0
//   const lastLineEnd = pairs?.[pairs.length - 1]?.[1]?.col ?? 0
//   const joinedLines = lines.slice(lastLine).join('\n')
//   sections.push(joinedLines.slice(lastLineEnd))
//   // console.log("sections", sections)
//
//   const final = []
//   let argIndex = 0;
//   for (let i = 0; i < sections.length; i++) {
//     final.push(sections[i])
//     final.push(hCode[argIndex])
//     argIndex++
//   }
//
//   return final.join('')
// }

function* get(str) {
  let i = 0
  let remainder = str
  while (remainder) {
    console.log('remainder', remainder)
    // const matches = remainder.match(/<.*>/)
    const matches = remainder.match(/<[a-zA-Z_][a-zA-Z_0-9-]*>/)
    if (matches) {
      const index = matches.index
      remainder = remainder.slice(index + matches[0].length)
      i = i + index
      yield i
    } else {
      remainder = ''
    }
  }
}


// Which context started at which index?
function* htmlContextEntryAndExit(str) {
  let i = 0
  let remainder = str

  let inRegexp = false
  let inSingleQuote = false
  let inDoubleQuote = false
  let inBackTick = false
  let inParen = false
  let inBrace = false
  let inSingleComment = false
  let inBlockComment = false
  let inHtml = false

  const stack = []

  while (remainder) {
    // console.log('remainder', remainder)
    // console.log('inRegexp', inRegexp)
    // console.log('inSingleQuote', inSingleQuote)
    // console.log('inDoubleQuote', inDoubleQuote)
    // console.log('inBackTick', inBackTick)
    // console.log('inParen', inParen)
    // console.log('inBrace', inBrace)
    // console.log('inSingleComment', inSingleComment)
    // console.log('inBlockComment', inBlockComment)
    // console.log('inHtml', inHtml)

    const inStringLike = inRegexp || inSingleQuote || inDoubleQuote || inBackTick
    const inComment = inSingleComment || inBlockComment

    // console.log('inStringLike', inStringLike)
    // console.log('inComment', inComment)

    const nextRegexp = !inComment && (!inStringLike || inRegexp) && remainder.match(/(?<!\/)\/(?!\/)/)
    const nextSingleQuote = !inComment && (!inStringLike || inSingleQuote) && remainder.match(/'/)
    const nextDoubleQuote = !inComment && (!inStringLike || inDoubleQuote) && remainder.match(/"/)
    const nextBackTick = !inComment && (!inStringLike || inBackTick) && remainder.match(/`/)
    const nextParen = !inComment && !inStringLike && remainder.match(/(\(|\))/)
    const nextBrace = !inComment && !inStringLike && remainder.match(/({|})/)
    const nextSingleComment = !inComment && !inStringLike && remainder.match(/\/\//) || (inSingleComment && remainder.match(/\n/))
    const nextBlockComment = !inComment && !inStringLike && remainder.match(/\/\*/) || (inBlockComment && remainder.match(/\*\//))
///////////////////////////////////      \s*
    const htmlTag = remainder.match(/<\/?[a-zA-Z_][a-zA-Z_0-9-]*\s*([a-zA-Z_][a-zA-Z_0-9-]*=?.*?\s*\n?)*(?<!=)>/s)
    let startHtml = !htmlTag?.[0]?.startsWith('</') ? htmlTag : null
    let endHtml = (htmlTag?.[0]?.startsWith('</') || htmlTag?.[0]?.endsWith('/>')) ? htmlTag : null
    startHtml = !inComment && !inStringLike && startHtml
    endHtml = !inComment && !inStringLike && endHtml
    // const startHtml = !inComment && !inStringLike && remainder.match(/<[a-zA-Z_][a-zA-Z_0-9-]*\s*.*?(?<!=)>/s)
    // const endHtml = !inComment && !inStringLike && (remainder.match(/<([a-zA-Z_])+\s*\/>/s) ?? remainder.match(/<\/\s*([a-zA-Z_])+>/s))
    const startHtmlIndex = (startHtml?.index ?? 0)
    const endHtmlIndex = (endHtml?.index ?? 0)
    const nextHtml = !inComment && !inStringLike && startHtmlIndex < endHtmlIndex ? (startHtml ?? endHtml) : (endHtml ?? startHtml)

    // console.log('nextRegexp.index', nextRegexp?.index)
    // console.log('startHtml', startHtml?.index)
    // console.log('endHtml', endHtml?.index)
    // console.log('nextHtml?.index', nextHtml?.index)

    const matches = [
      nextRegexp,
      nextSingleQuote,
      nextDoubleQuote,
      nextBackTick,
      nextParen,
      nextBrace,
      nextSingleComment,
      nextBlockComment,
      nextHtml,
    ].filter(a => !!a)

    matches.sort((a, b) => {
      const aIndex = a?.index ?? 0
      const bIndex = b?.index ?? 0
      if (aIndex < bIndex) {
        return -1
      }
      if (bIndex < aIndex) {
        return 1
      }

      if (a[0] === '/' && b[0] === '/*') {
        return 1
      } else if (b[0] === '/' && a[0] === '/*') {
        return -1
      }

      return 0
    })

    // console.log('matches', matches)

    const match = matches[0]

    if (match) {
      i += match.index
      const htmlStarted = startHtml?.index === match?.index
      const htmlEnded = endHtml?.index === match?.index
      if (htmlStarted && !htmlEnded) {
        // if (stack.length === 0) {
          yield {match: match[0], i, type: 'entry', stack: stack.length}
        // }
        // push
        stack.push(null)
      }
      if (htmlEnded && !htmlStarted) {
        // pop
        stack.pop()
        // if (stack.length === 0) {
          yield {match: match[0], i, type: 'exit', stack: stack.length}
        // }
      }
      if (htmlEnded && htmlStarted) {
        yield {match: match[0], i, type: 'singular', stack: stack.length}
      }

      // console.log('match', match)
      // console.log('match[0]', match[0], i)
      // console.log('match.index', match.index + match[0].length)
      // console.log('startHtml', startHtml?.index, startHtml === match)
      // console.log('endHtml', endHtml?.index, endHtml === match)

      remainder = remainder.slice(match.index + match[0].length)
      i += match[0].length

      if (nextRegexp === match) inRegexp = !inRegexp
      if (nextSingleQuote === match) inSingleQuote = !inSingleQuote
      if (nextDoubleQuote === match) inDoubleQuote = !inDoubleQuote
      if (nextBackTick === match) inBackTick = !inBackTick
      if (nextParen === match) inParen = !inParen
      if (nextBrace === match) inBrace = !inBrace
      if (nextSingleComment === match) inSingleComment = !inSingleComment
      if (nextBlockComment === match) inBlockComment = !inBlockComment
      if (nextHtml === match) inHtml = !inHtml
    } else {
      remainder = ''
    }
  }
}

function* getAttributeNames(str) {
  let i = 0
  let remainder = str

  let inRegexp = false
  let inSingleQuote = false
  let inDoubleQuote = false
  let inBackTick = false
  let inParen = false
  let inBrace = false
  let inSingleComment = false
  let inBlockComment = false

  const stack = []

  while (remainder) {
    // console.log('remainder', remainder)
    // console.log('inRegexp', inRegexp)
    // console.log('inSingleQuote', inSingleQuote)
    // console.log('inDoubleQuote', inDoubleQuote)
    // console.log('inBackTick', inBackTick)
    // console.log('inParen', inParen)
    // console.log('inBrace', inBrace)
    // console.log('inSingleComment', inSingleComment)
    // console.log('inBlockComment', inBlockComment)

    const inStringLike = inRegexp || inSingleQuote || inDoubleQuote || inBackTick
    const inComment = inSingleComment || inBlockComment
    const atGlobal = !inRegexp &&
      !inSingleQuote &&
      !inDoubleQuote &&
      !inBackTick &&
      !inParen &&
      !inBrace &&
      !inSingleComment &&
      !inBlockComment

    // console.log('inStringLike', inStringLike)
    // console.log('inComment', inComment)

    const nextRegexp = !inComment && (!inStringLike || inRegexp) && remainder.match(/(?<!\/)\/(?!\/)/)
    const nextSingleQuote = !inComment && (!inStringLike || inSingleQuote) && remainder.match(/'/)
    const nextDoubleQuote = !inComment && (!inStringLike || inDoubleQuote) && remainder.match(/"/)
    const nextBackTick = !inComment && (!inStringLike || inBackTick) && remainder.match(/`/)
    const nextParen = !inComment && !inStringLike && remainder.match(/(\(|\))/)
    const nextBrace = !inComment && !inStringLike && remainder.match(/({|})/)
    const nextSingleComment = !inComment && !inStringLike && remainder.match(/\/\//) || (inComment && remainder.match(/\n/))
    const nextBlockComment = !inComment && !inStringLike && remainder.match(/\/\*/) || (inComment && remainder.match(/\*\/\//))
    let nextAttribute = atGlobal && remainder.match(/(?<!<\/?[^ ]*)[^<"{} =\n>]+/)
    // console.log('remainder', remainder)
    // console.log('atGlobal', atGlobal)
    // console.log('nextAttribute', nextAttribute)



    // console.log('nextDoubleQuote', nextDoubleQuote)


    // console.log('nextRegexp.index', nextRegexp?.index)
    // console.log('startHtml', startHtml?.index)
    // console.log('endHtml', endHtml?.index)
    // console.log('nextHtml?.index', nextHtml?.index)

    const matches = [
      nextRegexp,
      nextSingleQuote,
      nextDoubleQuote,
      nextBackTick,
      nextParen,
      nextBrace,
      nextSingleComment,
      nextBlockComment,
      nextAttribute
    ].filter(a => !!a)

    const m = [
      nextRegexp,
      nextSingleQuote,
      nextDoubleQuote,
      nextBackTick,
      nextParen,
      nextBrace,
      nextSingleComment,
      nextBlockComment,
      nextAttribute
    ]
    // console.log('m', m)

    matches.sort((a, b) => {
      const aIndex = a?.index ?? 0
      const bIndex = b?.index ?? 0
      if (aIndex < bIndex) {
        return -1
      }
      if (bIndex < aIndex) {
        return 1
      }
      return 0
    })


    const match = matches[0]
    // console.log('match', match)

    if (match) {
      i += match.index
      if (nextAttribute?.index === match?.index) {
        yield {match: match[0], i}
      }

      // console.log('match[0]', match[0], i)

      remainder = remainder.slice(match.index + match[0].length)
      i += match[0].length

      if (nextRegexp === match) inRegexp = !inRegexp
      if (nextSingleQuote === match) inSingleQuote = !inSingleQuote
      if (nextDoubleQuote === match) inDoubleQuote = !inDoubleQuote
      if (nextBackTick === match) inBackTick = !inBackTick
      if (nextParen === match) inParen = !inParen
      if (nextBrace === match) inBrace = !inBrace
      if (nextSingleComment === match) inSingleComment = !inSingleComment
      if (nextBlockComment === match) inBlockComment = !inBlockComment
    } else {
      remainder = ''
    }
  }
}

// .match().index
// .match().index + match[0].length
// yield {}
//


//                 f0123456789abcde
// <button checked id="send-button" className="button" onInput={send} disabled>
//                   ^             ^
//                   ||------------|
// <button checked id className onmount disabled>
// 0       8       f012
//                   f0

// <button checked={true} id className onInput={send} disabled={true}>
// <button checked={true} id="send-button" className="button" oninput={send} disabled={true}>


// <button checked id="send-button" className="button" onInput={send} disabled>
//  ^

function normalizeAttributeNames(html) {
  // for (const tagData of htmlContextEntryAndExit(html)) {
  //   const tag = tagData.match
  //   const attrs = Array.from(getAttributeNames(tag))
  //   console.log('tagData.match', tagData.match)
  //   console.log('attrs', attrs)
  //   for (const attr of attrs) {
  //     if (tag) {
  //       const a = tag.slice(attr.i, attr.i + attr.match.length + 1)
  //       console.log('a', a)
  //     }
  //   }
  // }
  return html
}

// asdjhaksjdh askjdhkasjdajsd \n (<div><span/></div>) \n askjdhasjhkd \n (<div></div>)
//                                 ^                 ^                     ^          ^
//                                 _transform
//                                 h('div',null,[h('span'),h('span')])
//                                                   ^                ^ = diff
// asdjhaksjdh askjdhkasjdajsd \n (h('div',null,[h('span'),h('span')])) \n askjdhasjhkd \n (<div></div>)
//                                                                                          ^          ^

function transform(str) {
  let final = str
  let diff = 0
  let entry = null
  for (const context of htmlContextEntryAndExit(str)) {
    // console.log(...Object.values(context))
    if ((context.type === 'entry' || context.type === 'singular') && context.stack === 0) {
      entry = context
    }
    if (context.stack === 0 && (context.type === 'exit' || context.type === 'singular')) {
      const html = final.slice(entry.i + diff, context.i + context.match.length + diff)
      const base = _transform(html)
      const originalStart = (entry.i + diff)
      const originalEnd = (context.i + diff) + context.match.length
      const first = final.slice(0, originalStart)
      const last = final.slice(originalEnd)
      final = first + base + last
      const difference = base.length - html.length
      diff += difference
    }
  }

  return final
}

function _transform(str) {
  // console.log('str', str)
  str = normalizeAttributeNames(str)
  let output = jsx.fromString(str, {
    factory,
  })
  output = output.replace(/\/\/# sourceMappingURL.*$/m, "")
  output = output.replace(/\n\n\n$/, "")
  return output
}

function replaceReact(str) {
  return str.replace(/(?<!\.)React/g, factory)
}

glob(pattern, {}, async (err, files) => {
  // console.log('files', files)
  for (const file of files) {
    console.log('convert', file)
    let str = fs.readFileSync(file, {encoding: 'utf8'})
    // const standard = prettier.format(str, {})
    // console.log('standard', standard)

    let out
    if (factory !== 'React') {
      out = replaceReact(str)
    }

    out = transform(out)

    if (writeFlag) {
      fs.writeFileSync(file, out, 'utf8')
    } else {
      console.log(out)
    }
  }
})

