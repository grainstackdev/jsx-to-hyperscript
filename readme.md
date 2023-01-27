# jsx-convert

A CLI tool for converting JSX files into standard JS.

Usage:

```
npx jsx-convert <glob> [--write] [--factory='h']
or
node ./node_modules/jsx-convert/src/cli.mjs <glob> [--write] [--factory='h']
```

Some examples of what `<glob>` can be:
```
build/**/*.js
build/**/*{.js,.jsx}
file.js
```

### Examples

Input:

```jsx
// Instances of React are transform as well
import React from "hyperscript"

const signs = [{ value: "+" }, { value: "-" }]

const renderSign = (props) => {
  return (
    <span>{props.value}</span>
  )
}

const Component = () => (<div></div>)
const test = (
  <div style={{color: 'orange'}}>
    <Component />
    <button onClick={() => {
      const el = <div/>
      console?.log(el)
    }} />
    {signs.map(renderSign)}
  </div>
)
```

Output:

```js
// Instances of h are transform as well
import h from "hyperscript"

const signs = [{ value: "+" }, { value: "-" }]

const renderSign = (props) => {
  return h("span", null, [props.value])
}

const Component = () => h("div", null, [])
const test = h("div", { style: { color: "orange" } }, [
  Component(),
  h(
    "button",
    {
      onClick: () => {
        const el = h("div", null, [])
        console?.log(el)
      },
    },
    []
  ),
  signs.map(renderSign),
])
```

Fragments are supported, too:

```js
// input
function renderRow() {
  return (
    <>
      <span/>
      <span/>
    </>
  )
}
```

```js
// output
function renderRow() {
  return (
    [
      h('span', null, []), 
      h('span', null, [])
    ]
  )
}
```