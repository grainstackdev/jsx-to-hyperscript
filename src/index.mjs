import jsTokens from "js-tokens"
import standardTags from "html-tags"

const rand = Math.random().toString().slice(-2)

function splitTagEnds(tokens) {
  const out = []
  let i = -1
  for (const token of tokens) {
    i++

    if (
      token.type === "RegularExpressionLiteral" &&
      /\/.*>/.test(token.value) &&
      !token.closed
    ) {
      const prevToken = tokens[i - 1]
      if (prevToken.type === "Punctuator" && prevToken.value === "<") {
        // Possible matches:
        // /div>
        // />
        // />);
        const match = token.value.match(/\/.*>/)
        const extra = token.value.slice(match[0].length)

        const extraTokens = Array.from(jsTokens(extra))

        out.pop()
        if (match[0] === "/>") {
          // </>
          out.push({ type: "HtmlEnd", value: `</Fragment_${rand}>` })
        } else {
          // </match0>
          out.push({ type: "HtmlEnd", value: prevToken.value + match[0] })
        }
        extraTokens.forEach((a) => out.push(a))

        continue
      }
    }

    out.push(token)
  }
  return out
}

function findClosingHtmlBrace(tokens) {
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
  const tokens = splitTagEnds(Array.from(jsTokens(str), (token) => token))

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
        value: token.value + "Fragment_" + rand + nextToken.value,
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
      nextToken.type === "RegularExpressionLiteral" &&
      /^\/.*>/.test(nextToken.value)
    ) {
      // </div>
      htmlTokens.push({ type: "HtmlEnd", value: token.value + nextToken.value })
      _skip()
    } else {
      htmlTokens.push(tokens[i])
    }

    i += 1 + skip
  }

  const result = extendContext(htmlTokens)
  return result
}

function extendContext(tokens) {
  const stackBackTick = []
  const stackParen = []
  const stackBrace = []
  const stackHtml = []

  const result = []

  let i = -1
  for (const token of tokens) {
    i++

    if (token.type === "TemplateTail") {
      stackBackTick.pop()
    }
    if (token.value === ")") {
      stackParen.pop()
    }
    if (token.value === "}") {
      stackBrace.pop()
    }
    let htmlStart
    if (token.type === "HtmlEnd") {
      const isSelfClosing = token.htmlStart?.selfClosing
      if (!isSelfClosing) {
        const popToken = stackHtml.pop()
        htmlStart = popToken.htmlStart
      }
    }

    const forward = {
      ...token,
      context: {
        stackBackTick: stackBackTick.length,
        stackParen: stackParen.length,
        stackBrace: stackBrace.length,
        stackHtml: stackHtml.length,
      },
    }
    if (htmlStart) {
      forward.htmlStart = htmlStart
    }
    result.push(forward)

    if (token.type === "TemplateHead") {
      stackBackTick.push(true)
    }
    if (token.value === "(") {
      stackParen.push(true)
    }
    if (token.value === "{") {
      stackBrace.push(true)
    }
    if (token.type === "HtmlStart" && token.value === `<Fragment_${rand}>`) {
      stackHtml.push(token)
    }
    if (token.type === "HtmlStartClosingBrace" && token.value === ">") {
      stackHtml.push(token)
    }
  }

  return result
}

function transform(str, factory) {
  let tokens = getTokens(str)
  tokens = extendContext(tokens)

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
      const html = clip.map((t) => t.value).join("")
      const base = _transform(html, factory)
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

function getProps(tokens, factory) {
  const props = {}

  let stackBraceOffset = 0
  let stackHtmlOffset = 0

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
        props[propName] = propValue
      }
      if (
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
        const o = transform(propValue, factory)
        props[propName] = o
      }
    }
  }

  return props
}

// input is nested HTML in the form of tokens
function _transform(str, factory) {
  let tokens = getTokens(str)
  tokens = extendContext(tokens)

  let lines = ""
  let stackOffsetBrace = 0

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
        let props
        const isFragment = tagName === `Fragment_${rand}`

        let tagEndIndex
        if (!tagName.endsWith(">")) {
          tagEndIndex = findTagEnd(tokens.slice(i))
          props = getProps(tokens.slice(i, i + tagEndIndex + 1), factory)
        } else {
          tagEndIndex = 0
          props = null
        }
        if (!Object.keys(props).length) {
          props = null
        }

        const propsAsString = !props
          ? "null"
          : `{${Object.keys(props)
              .map((p) => `${p}: ${props[p]}`)
              .join(", ")}}`

        const isStandard = standardTags.includes(tagName)
        let line
        if (isStandard) {
          line = `${factory}('${tagName}', ${propsAsString}, [`
        } else {
          if (isFragment) {
            line = `[`
          } else {
            if (propsAsString !== 'null') {
              line = `${tagName}(${propsAsString})`
            } else {
              line = `${tagName}()`
            }
          }
        }

        if (lines.slice(-1) === ")" || lines.slice(-1) === "]") {
          lines += ", "
        }
        lines += line
      }
      if (
        token.type === "Punctuator" &&
        token.value === "{" &&
        !token.insideOpeningTag
      ) {
        const index = findCurlyBraceEnd(tokens.slice(i))
        const code = tokens
          .slice(i + 1, i + index)
          .map((t) => t.value)
          .join("")

        if (lines.slice(-1) === ")" || lines.slice(-1) === "]") {
          lines += ", "
        }
        lines += code
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

export default function parseJsx(str, options) {
  const factory = options.factory || "h"
  let out
  if (factory !== "React") {
    out = replaceReact(str, factory)
  }
  out = transform(out, factory)
  // out = addFragmentFunction(out)

  return out
}
