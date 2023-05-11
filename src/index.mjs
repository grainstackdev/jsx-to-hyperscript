import jsTokens from "js-tokens"
import standardTags from "html-tags"
import hyphenateStyleName from 'hyphenate-style-name'
import prettier from 'prettier'

const rand = Math.random().toString().slice(-2)

const stringTypes = [
  "StringLiteral",
  "NoSubstitutionTemplate",
  "RegularExpressionLiteral",
]
function tokenizeStringLiteralClosed(token) {
  if (stringTypes.includes(token.type) && token.closed) {
    const beginning = token.value[0]
    const end = token.value[token.value.length - 1]

    const allowed = ['"', "'", "`", "/", "}", "{", "<", ">"]

    if (allowed.includes(beginning) && allowed.includes(end)) {
      const toTokens = Array.from(jsTokens(token.value.slice(1, -1)))
      // console.log("toTokensClosed", toTokens)
      return [
        { type: "Punctuator", value: beginning },
        ...toTokens,
        { type: "Punctuator", value: end },
      ].flatMap((t) => {
        if (stringTypes.includes(t.type) && t.closed) {
          return tokenizeStringLiteralClosed(t)
        } else if (stringTypes.includes(t.type) && !t.closed) {
          return tokenizeStringLiteralOpen(t)
        }
        return t
      })
    }
  }
  return [token]
}

function tokenizeStringLiteralOpen(token) {
  if (stringTypes.includes(token.type) && !token.closed) {
    const beginning = token.value[0]

    const allowed = ['"', "'", "`", "/", "}", "{", "<", ">"]

    if (allowed.includes(beginning)) {
      const toTokens = Array.from(jsTokens(token.value.slice(1)))
      // console.log("toTokensOpen", toTokens)
      return [{ type: "Punctuator", value: beginning }, ...toTokens].flatMap(
        (t) => {
          if (stringTypes.includes(t.type) && t.closed) {
            return tokenizeStringLiteralClosed(t)
          } else if (stringTypes.includes(t.type) && !t.closed) {
            return tokenizeStringLiteralOpen(t)
          }
          return t
        }
      )
    }
  }
  return [token]
}

function splitTagEnds(tokens) {
  const out = []

  let i = -1
  for (const token of tokens) {
    i++

    // if (
    //   token.type === "RegularExpressionLiteral" &&
    //   /\/.*>/.test(token.value) &&
    //   !token.closed
    // ) {
    //   const prevToken = tokens[i - 1]
    //   if (prevToken.type === "Punctuator" && prevToken.value === "<") {
    //     // Possible matches:
    //     // /div>
    //     // />
    //     // />);
    //     const match = token.value.match(/\/.*>/)
    //     const extra = token.value.slice(match[0].length)
    //
    //     const extraTokens = Array.from(jsTokens(extra))
    //
    //     out.pop()
    //     if (match[0] === "/>") {
    //       // </>
    //       out.push({ type: "HtmlEnd", value: `</Fragment_${rand}>` })
    //     } else {
    //       // </match0>
    //       out.push({ type: "HtmlEnd", value: prevToken.value + match[0] })
    //     }
    //     extraTokens.forEach((a) => out.push(a))
    //
    //     continue
    //   } else {
    //     out.push({ type: "Punctuator", value: "/" })
    //     const extra = token.value.slice(1)
    //     const extraTokens = Array.from(jsTokens(extra))
    //     extraTokens.forEach((a) => out.push(a))
    //     continue
    //   }
    // }

    const prevToken = tokens[i - 1]
    const isPropValue = prevToken?.value === "=" && token.value[0] === '"'
    if (stringTypes.includes(token.type) && !isPropValue) {
      let extraTokens
      if (token.closed) {
        extraTokens = tokenizeStringLiteralClosed(token)
      } else {
        extraTokens = tokenizeStringLiteralOpen(token)
      }
      extraTokens.forEach((a) => out.push(a))
      continue
    }

    out.push(token)
  }
  return out
}

function findClosingHtmlBrace(tokens) {
  // const validPunctuators = ["=", "{", "}", "<", "/", ">", " ", "\n", `"`, "'", "-", "_", "(", ")", ":"]
  const validPunctuators = ["=", "{", "}", "<", "/", ">", " ", "\n"]

  const stackBrace = []

  let i = 0
  for (const token of tokens) {
    if (token.type === "Punctuator" && token.value === "}") {
      stackBrace.pop()
    }
    // if (token.type === "Punctuator" && token.value === '"') {
    //   stackString.pop()
    // }

    const atGlobal = stackBrace.length === 0
    if (atGlobal) {
      // Things that are allowed to be seen at global level, i.e. not in "" or {}
      if (
        !(
          token.type === "IdentifierName" ||
          token.type === "StringLiteral" ||
          token.type === "WhiteSpace" ||
          token.type === "LineTerminatorSequence" ||
          token.type === "MultiLineComment" ||
          token.type === "SingleLineComment" ||
          (token.type === "Punctuator" &&
            (validPunctuators.includes(token.value) || /\s+/.test(token.value)))
        )
      ) {
        // An invalid token was found at the global level between the tag start and end,
        // so this is not an HTML tag.
        return -1
      }
    }

    if (token.type === "Punctuator" && token.value === ">" && atGlobal) {
      return i
    }
    if (token.type === "Punctuator" && token.value === "/>" && atGlobal) {
      return i
    }

    if (token.type === "Punctuator" && token.value === "{") {
      stackBrace.push(true)
    }
    // if (token.type === "Punctuator" && token.value === '"') {
    //   stackString.pop()
    // }

    if (
      token.type === "Punctuator" &&
      (token.value === "{" || token.value === "}")
    ) {
      token.insideOpeningTag = true
    }

    i++
  }

  return -1
}

function findTagEnd(tokens) {
  const validPunctuators = ["=", "{", "}", "<", "/", ">", " ", "\n"]

  const stackBrace = []

  let i = 0
  for (const token of tokens) {
    if (token.type === "Punctuator" && token.value === "}") {
      stackBrace.pop()
    }

    const atGlobal = stackBrace.length === 0

    if (atGlobal) {
      if (
        !(
          token.type === "HtmlStart" ||
          token.type === "HtmlEnd" ||
          token.type === "HtmlStartClosingBrace" ||
          token.type === "IdentifierName" ||
          token.type === "StringLiteral" ||
          token.type === "WhiteSpace" ||
          token.type === "LineTerminatorSequence" ||
          token.type === "MultiLineComment" ||
          token.type === "SingleLineComment" ||
          (token.type === "Punctuator" &&
            (validPunctuators.includes(token.value) || /\s+/.test(token.value)))
        )
      ) {
        // An invalid token was found at the global level between the tag start and end,
        // so this is not an HTML tag.
        return -1
      }
    }

    if (
      token.type === "HtmlStartClosingBrace" &&
      token.value === ">" &&
      atGlobal
    ) {
      return i
    }
    if (token.type === "HtmlEnd" && atGlobal) {
      return i
    }

    if (token.type === "Punctuator" && token.value === "{") {
      stackBrace.push(true)
    }

    i++
  }

  return -1
}

function findCurlyBraceEnd(tokens) {
  const stackBrace = []

  let i = -1
  for (const token of tokens) {
    i++

    if (token.type === "Punctuator" && token.value === "{") {
      stackBrace.push(true)
    }
    if (token.type === "Punctuator" && token.value === "}") {
      stackBrace.pop()
      const atGlobal = stackBrace.length === 0
      if (atGlobal) {
        return i
      }
    }
  }

  return -1
}

function getTokens(str) {
  const tokens = splitTagEnds(Array.from(jsTokens(str)))

  const htmlTokens = []
  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]
    const nextToken = tokens[i + 1] ?? {}

    token.i = i

    let skip = 0
    function _skip() {
      skip++
    }

    // <d...>
    // <div prop="<>"/>
    // </>
    // </div>

    if (
      token.type === "Punctuator" &&
      token.value === "<" &&
      nextToken.type === "IdentifierName"
    ) {
      const index = findClosingHtmlBrace(tokens.slice(i))

      const hasTagEnd = index !== -1
      if (hasTagEnd) {
        htmlTokens.push({
          type: "HtmlStart",
          value: token.value + nextToken.value,
          i,
        })
        _skip()

        if (tokens[i + index - 1].value !== "/") {
          // tokens[i + index] is a '>'
          tokens[i + index].type = "HtmlStartClosingBrace"
          htmlTokens[htmlTokens.length - 1].selfClosing = false
        } else {
          // is self-closing
          htmlTokens[htmlTokens.length - 1].selfClosing = true
        }
        // In both cases, self-closing or not, htmlStart is attached to the '>' token.
        tokens[i + index].htmlStart = htmlTokens[htmlTokens.length - 1]
      } else {
        htmlTokens.push(tokens[i])
      }
    } else if (
      token.type === "Punctuator" &&
      token.value === "<" &&
      nextToken.type === "Punctuator" &&
      nextToken.value === ">"
    ) {
      // <>
      htmlTokens.push({
        type: "HtmlStart",
        value: token.value + "Fragment_" + rand,
        selfClosing: true,
      })
      htmlTokens.push({
        type: "HtmlStartClosingBrace",
        value: ">",
        htmlStart: htmlTokens[htmlTokens.length - 1],
      })
      _skip()
    } else if (
      token.type === "Punctuator" &&
      token.value === "/" &&
      nextToken.type === "Punctuator" &&
      nextToken.value === ">"
    ) {
      // />
      const pushToken = {
        type: "HtmlEnd",
        value: token.value + nextToken.value,
      }
      if (nextToken.htmlStart) {
        pushToken.htmlStart = nextToken.htmlStart
      }
      htmlTokens.push(pushToken)
      _skip()
    } else if (
      token.type === "Punctuator" &&
      token.value === "<" &&
      nextToken.type === "Punctuator" &&
      nextToken.value === "/"
    ) {
      // </div>
      const closingIndex = findClosingHtmlBrace(tokens.slice(i))
      if (closingIndex !== -1) {
        const endTagTokens = tokens.slice(i, i + closingIndex + 1)
        htmlTokens.push({
          type: "HtmlEnd",
          value: endTagTokens.map((t) => t.value).join(""),
        })
        endTagTokens.forEach((_, i) => {
          if (i <= endTagTokens.length - 2) {
            _skip()
          }
        })
      }
    } else {
      htmlTokens.push(tokens[i])
    }

    i += 1 + skip
  }

  // for (const token of htmlTokens) {
  //   console.log('token', token)
  // }
  const result = extendContext(htmlTokens)
  // for (const token of result) {
  //   console.log('token2', token)
  // }
  return result
}

function extendContext(tokens) {
  const stackBackTick = []
  const stackParen = []
  const stackBrace = []
  const stackHtml = []
  const stackHtmlStart = []

  const result = []

  let startClip = null
  function endClip(endI) {
    if (startClip === null) return
    const clip = tokens.slice(startClip, endI)
    startClip = null

    // now that I have the clips of string literals between closing braces > and curly braces {,
    // what do I do with them?
    // I want to join them all together as a single token, and then label it with isHtmlStringLiteral
    // result stopped pushing tokens when the clip started.

    result.push({
      type: "HtmlStringLiteral",
      value: clip.map((t) => t.value).join(""),
      context: {
        stackBackTick: stackBackTick.length,
        stackParen: stackParen.length,
        stackBrace: stackBrace.length,
        stackHtml: stackHtml.length,
      },
    })
    result.push({
      ...tokens[endI],
      context: {
        stackBackTick: stackBackTick.length,
        stackParen: stackParen.length,
        stackBrace: stackBrace.length,
        stackHtml: stackHtml.length,
      },
    })
  }

  let i = -1
  for (const token of tokens) {
    i++

    let startClipFlag = false

    // The top of the stack should be the last HtmlStart element seen.
    // The relative difference between the current stackBrace and the HtmlStart's stackBrace
    // tells whether or not we are currently in a prop value.
    // Being inside a prop value {} should be treated the same as being inside a prop value "",
    // This is an escaped context. There should be no stack increases happening in here.
    const lastHtmlStart = stackHtmlStart[stackHtmlStart.length - 1]
    const inOpeningTag = !!lastHtmlStart
    // The current stackBrace is greater than what it was when the current html context started:
    const inValueBrace = (stackBrace.length - (stackHtml[stackHtml.length - 1]?.context.stackBrace ?? 0)) > 0

    // console.log('token', token)

    if (startClip === null && token.type === "TemplateTail") {
      stackBackTick.pop()
    }
    if (startClip === null && token.value === ")") {
      stackParen.pop()
    }
    // todo:
    //  If JSX is used inside of value braces, then in the current implementation,
    //  when that JSX is existed, it starts a new clip, and this causes the following line to be skipped:
    if (startClip === null && token.value === "}") {
      if (!token.insideOpeningTag && !inOpeningTag && stackHtml.length > 0 && !inValueBrace) {
        startClipFlag = true
      }
      stackBrace.pop()
    }
    let htmlStart
    if (token.type === "HtmlEnd") {
      const isSelfClosing = token.htmlStart?.selfClosing
      if (!isSelfClosing) {
        const popToken = stackHtml.pop()
        // todo
        if (!popToken) {
          htmlStart = lastHtmlStart
        } else {
          htmlStart = popToken.htmlStart
        }
      } else if (isSelfClosing) {
        stackHtmlStart.pop()
      }

      if (stackHtml.length > 0) {
        // HtmlStringLiteral clip should start when still inside an
        // html context after encountering HtmlEnd.
        const updatedInValueBrace = (stackBrace.length - (stackHtml[stackHtml.length - 1]?.context.stackBrace ?? 0)) > 0
        if (!inOpeningTag && !updatedInValueBrace) {
          startClipFlag = true
        }
      }
      if (startClip !== null) {
        endClip(i)
        // pop because endClip adds this token.
        // If endClip is called before the result.push, then a pop must proceed it.
        result.pop()
      }
    }

    token.context = {
      stackBackTick: stackBackTick.length,
      stackParen: stackParen.length,
      stackBrace: stackBrace.length,
      stackHtml: stackHtml.length,
    }
    if (htmlStart) {
      token.htmlStart = htmlStart
    }
    if (startClip === null) {
      result.push(token)
    }

    if (startClip === null && token.type === "TemplateHead") {
      stackBackTick.push(true)
    }
    if (startClip === null && token.value === "(") {
      stackParen.push(true)
    }
    if (token.value === "{") {
      endClip(i)
      stackBrace.push(true)
    }
    if (token.type === "HtmlStart") {
      endClip(i)
      stackHtmlStart.push(token)
    }
    if (
      startClip === null &&
      token.type === "HtmlStart" &&
      token.value === `<Fragment_${rand}>`
    ) {
      stackHtml.push(token)
    }
    if (
      startClip === null &&
      token.type === "HtmlStartClosingBrace" &&
      token.value === ">"
    ) {
      stackHtmlStart.pop()
      const lastHtmlStart = stackHtmlStart[stackHtmlStart.length - 1]
      const inOpeningTag = !!lastHtmlStart
      if (!inOpeningTag && !inValueBrace) {
        startClipFlag = true
      }
      stackHtml.push(token)
    }

    if (startClipFlag) {
      startClip = i + 1
    }
  }

  return result
}

function transform(str, options) {
  let tokens = getTokens(str)
  // tokens = extendContext(tokens)

  // console.log('tokens', tokens)

  const transformedTokens = []
  let startClip = null
  let i = -1
  for (const token of tokens) {
    i++

    if (token.context.stackHtml === 0 && token.type === "HtmlStart") {
      startClip = i
    }

    if (
      token.context.stackHtml === 0 &&
      token.type === "HtmlEnd" &&
      startClip !== null
    ) {
      const endClip = i + 1

      const clip = tokens.slice(startClip, endClip)
      const base = _transform(clip, options)
      const baseTokens = Array.from(jsTokens(base))
      baseTokens.forEach((t) => transformedTokens.push(t))
      startClip = null
      continue
    }

    if (startClip === null) {
      transformedTokens.push(token)
    }
  }

  return transformedTokens.map((t) => t.value).join("")
}

function getProps(tokens, options) {
  const props = new Map()

  let stackBraceOffset = 0
  let stackHtmlOffset = 0

  let passPropIndex = 0

  let i = -1
  for (const token of tokens) {
    i++

    if (i === 0 && tokens[0].type === "HtmlStart") {
      stackBraceOffset = -tokens[0].context.stackBrace
      stackHtmlOffset = -tokens[0].context.stackHtml
    }

    const atGlobal =
      token.context.stackBrace + stackBraceOffset === 0 &&
      token.context.stackHtml + stackHtmlOffset === 0
    const equalToken = tokens[i + 1]
    const valueToken = tokens[i + 2]

    if (atGlobal) {
      if (
        token.type === "IdentifierName" &&
        equalToken.type === "Punctuator" &&
        equalToken.value === "=" &&
        valueToken.type === "StringLiteral"
      ) {
        const propName = token.value
        const propValue = valueToken.value
        props.set(propName, propValue)
      } else if (
        token.type === "IdentifierName" &&
        equalToken.type === "Punctuator" &&
        equalToken.value === "=" &&
        valueToken.type === "Punctuator" &&
        valueToken.value === "{"
      ) {
        const propName = token.value
        const endBraceIndex = findCurlyBraceEnd(tokens.slice(i))
        const propValue = tokens
          .slice(i + 3, i + endBraceIndex)
          .map((t) => t.value)
          .join("")
        if (propValue) {
          const o = transform(propValue, options)
          props.set(propName, o)
        }
      } else if (
        token.type === 'IdentifierName'
      ) {
        // A prop with no `=` sign after it is `true` by default.
        const propName = token.value
        const propValue = 'true'
        props.set(propName, propValue)
      } else if (
        token.type === "Punctuator" &&
        token.value === "{" &&
        ((tokens[i + 1].type === "Punctuator" &&
          tokens[i + 1].value === "...") ||
          (tokens[i + 1].type === "WhiteSpace" &&
            tokens[i + 2].type === "Punctuator" &&
            tokens[i + 2].value === "..."))
      ) {
        let identifier
        if (tokens[i + 1].type !== "WhiteSpace") {
          identifier = tokens[i + 2]
        } else {
          identifier = tokens[i + 3]
        }
        const propName = passPropIndex.toString()
        passPropIndex++
        const propValue = `...${identifier.value}`
        props.set(propName, propValue)
      }
    }
  }

  if (props.size) {
    return props
  } else {
    return null
  }
}

// input is nested HTML in the form of tokens
function _transform(tokens, options) {
  // let tokens = getTokens(str)
  // tokens = extendContext(tokens)
  const {factory, leafsFirst} = options || {}

  let lines = ""
  let stackOffsetBrace = 0
  let started = false // started becomes true when the first [ is added to lines.

  function addComma() {
    if (
      lines.slice(-1) === ")" ||
      lines.slice(-1) === "]" ||
      lines.slice(-1) === "'" ||
      lines.slice(-1) === `"` ||
      (lines.slice(-2, -1) === `*` && lines.slice(-1) === `/`)
    ) {
      lines += ", "
    }
  }

  let i = -1
  for (const token of tokens) {
    i++

    if (i === 0 && token.type === "HtmlStart") {
      stackOffsetBrace = -token.context.stackBrace
    }
    const atGlobal = token.context.stackBrace + stackOffsetBrace === 0

    if (atGlobal) {
      if (token.type === "HtmlStart") {
        const tagName = tokens[i].value.replace(/[<>\/]/g, "")
        const isFragment = tagName === `Fragment_${rand}`

        const tagEndIndex = findTagEnd(tokens.slice(i))
        if (tagEndIndex === -1) {
          throw new Error(`Unable to find end of tag character '>'`)
        }
        const propsMap = getProps(tokens.slice(i, i + tagEndIndex + 1), options)

        if (propsMap?.has('style')) {
          propsMap.set('style', transformStyle(propsMap.get('style')))
        }

        let propsAsString = !propsMap
          ? "null"
          : `{${Array.from(propsMap.keys())
            .map((key) => {
              if (!/^\d/.test(key)) {
                const value = propsMap.get(key)
                if (leafsFirst) {
                  if (key === value) {
                    return `${key}`
                  } else {
                    return `${key}: ${value}` 
                  }  
                } else {
                  return `${key}: () => (${value})`
                }
              } else {
                // spread props
                return `${propsMap.get(key)}`
              }  
              
            })
            .join(", ")}}`

        const onlySpread = propsAsString.match(/^{\.\.\.([^,]+)}$/)
        if (onlySpread) {
          propsAsString = onlySpread[1]
        }

        const isStandard = standardTags.includes(tagName)
        let line
        if (isStandard) {
          if (!leafsFirst && started) {
            line = `() => ${factory}('${tagName}', ${propsAsString}, [`
          } else {
            line = `${factory}('${tagName}', ${propsAsString}, [`
          }
        } else {
          if (isFragment) {
            line = `[`
          } else {
            if (propsAsString !== "null") {
              line = leafsFirst ? `${tagName}(${propsAsString})` : `() => (${tagName}(${propsAsString}))`
            } else {
              line = leafsFirst ? `${tagName}({})` : `() => (${tagName}({}))`
            }
          }
        }

        if (line.endsWith('[')) {
          started = true
        }

        addComma()
        lines += line
      }
      if (token.type === "HtmlStringLiteral") {
        const value = token.value.replace(/^\s+/g, "").replace(/\s+$/g, "")
        if (value) {
          addComma()
          lines += `${JSON.stringify(value)}`
        }
      }
      if (
        token.type === "Punctuator" &&
        token.value === "{" &&
        !token.insideOpeningTag
      ) {
        // There is an expression between curly braces which needs to be
        // added as an element in the array of children.
        const index = findCurlyBraceEnd(tokens.slice(i))
        if (index === -1) {
          throw new Error(`Unable to find matching curly brace '}'`)
        }
        const curlyCode = tokens
          .slice(i + 1, i + index)
          .map((t) => t.value)
          .join("")
        addComma()

        lines += leafsFirst ? `${curlyCode}` : `() => (${curlyCode})`
      }
      if (token.type === "HtmlEnd") {
        const tagName = tokens[i]?.htmlStart?.value?.replace(/[<>\/]/g, "")
        const isFragment = tagName === `Fragment_${rand}`

        const isStandard = standardTags.includes(tagName)
        if (isStandard) {
          lines += "])"
        } else if (isFragment) {
          lines += "]"
        }
      }
    }
  }

  return lines
}

function replaceReact(str, factory) {
  return str.replace(/(?<!\.)React/g, factory)
}

function addFragmentFunction(str) {
  const f = `function Fragment_${rand}(...nodes) {
  return nodes
}
`
  return f + str
}

export default function convertJsx(str, options) {
  options = options || {}
  if (!options.factory) {
    options.factory = options?.leafsFirst ? 'h' : 'j'
  }
  let out
  if (options.factory !== "React") {
    out = replaceReact(str, options.factory)
  }
  out = transform(out, options)
  // out = addFragmentFunction(out)

  return out
}

function transformStyle(styleObjectString) {
  styleObjectString = prettier.format(styleObjectString, {parser: 'json'})
  const style = JSON.parse(styleObjectString)
  const result = {}
  for (const key of Object.keys(style)) {
    if (typeof style[key] !== 'string') continue

    result[hyphenateStyleName(key)] = style[key]
  }
  return JSON.stringify(result)
}