import test from 'tape'
import jsxConvert from "../src/index.mjs";
import fs from 'fs'
import path from 'path'

const fragmentsAnswer = `function renderRow() {
  return (
    [h('span', null, []), h('span', null, [])]
  )
}`

const componentsAnswer = `// Instances of h are transform as well
import h from "hyperscript"

const signs = [{ value: "+" }, { value: "-" }]

const renderSign = (props) => {
  return (
    h('span', null, [props.value])
  )
}

const Component = () => (h('div', null, []))
const test = (
  h('div', {style: {"color":"orange","flex-direction":"column"}}, [Component({}), h('button', {onClick: () => {
        const el = h('div', null, [])
        console?.log(el)
      }, ...passProps}, []), signs.map(renderSign)])
)`

test('components', (t) => {
  const str = fs.readFileSync(path.resolve(process.cwd(), 'tests/component.test.js'), {encoding: 'utf8'})

  const out = jsxConvert(str, {
    factory: 'h'
  })

  t.equal(out, componentsAnswer)

  t.end()
})

test('fragments', (t) => {
  const str = fs.readFileSync(path.resolve(process.cwd(), 'tests/fragment.test.js'), {encoding: 'utf8'})

  const out = jsxConvert(str, {
    factory: 'h'
  })

  t.equal(out, fragmentsAnswer)

  t.end()
})