import test from 'tape'
import jsxConvert from "../src/index.mjs";
import fs from 'fs'
import path from 'path'

const restAnswer = `const a = (props) => (
  j('div', props, [() => j('span', null, [])])
)`

const mapAnswer = `j('div', null, [() => (a.map((props) => (<span>{props.value}</span>)))])`
const mapReverse = `h('div', null, [a.map((props) => (<span>{props.value}</span>))])`

const fragmentsAnswer = `function renderRow() {
  return (
    [() => j('span', null, []), () => j('span', null, [])]
  )
}`
const fragmentsAnswerReverse = `function renderRow() {
  return (
    [h('span', null, []), h('span', null, [])]
  )
}`

const componentsAnswer = `// Instances of j are transform as well
import j from "hyperscript"

const signs = [{ value: "+" }, { value: "-" }]

const renderSign = (props) => {
  return (
    j('span', null, [() => (props.value)])
  )
}

const Component = () => (j('div', null, []))
const test = (
  j('div', {style: () => ({"color":"orange","flex-direction":"column"})}, [() => (Component({})), () => j('button', {onClick: () => (() => {
        const el = j('div', null, [])
        console?.log(el)
      }), ...passProps}, []), () => (signs.map(renderSign))])
)`
const componentsAnswerReverse = `// Instances of h are transform as well
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

  const out = jsxConvert(str)

  t.equal(out, componentsAnswer)

  const outReverse = jsxConvert(str, {
    leafsFirst: true
  })

  t.equal(outReverse, componentsAnswerReverse)

  t.end()
})

test('fragments', (t) => {
  const str = fs.readFileSync(path.resolve(process.cwd(), 'tests/fragment.test.js'), {encoding: 'utf8'})

  const out = jsxConvert(str)

  t.equal(out, fragmentsAnswer)

  const outReverse = jsxConvert(str, {
    leafsFirst: true
  })

  t.equal(outReverse, fragmentsAnswerReverse)

  t.end()
})

test('map', (t) => {
  const str = fs.readFileSync(path.resolve(process.cwd(), 'tests/map.test.js'), {encoding: 'utf8'})

  const out = jsxConvert(str)

  t.equal(out, mapAnswer)

  const outReverse = jsxConvert(str, {
    leafsFirst: true
  })

  t.equal(outReverse, mapReverse)

  t.end()
})

test('rest', (t) => {
  const str = fs.readFileSync(path.resolve(process.cwd(), 'tests/rest.test.js'), {encoding: 'utf8'})

  const out = jsxConvert(str)

  t.equal(out, restAnswer)

  t.end()
})