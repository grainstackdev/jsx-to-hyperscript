# jsx-to-hyperscript

> A CLI command for converting JSX files into standard JS.

## Usage

### CLI

```
Usage:
    jsx-to-hyperscript <glob> [--write] [--factory='h'] [--flow]
    
Options:
    --write       When set, causes the file to be overwritten in-place.
    --factory     By default 'h'. The factory function. Optional.
    --flow        If you use flowtype, removes type annotations.
```

```json5
// package.json
{
  "scripts": {
    "build": "jsx-to-hyperscript 'build/**/*.{js,mjs}' --write"
  }
}
```

### Import

```ts
import convertJsx from 'jsx-to-hyperscript'

type options = {
  factory?: 'h'
}

convertJsx(fileContents[, options])
```

___

## Examples

Input:

```jsx
// Instances of React are transformed as well
import {h as React} from "grainbox"

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
    <button
      onClick={() => {
        const el = <div/>
        console?.log(el)
      }}
      {...passProps}
    />
    {signs.map(renderSign)}
  </div>
)
```

Output:

```js
// Instances of h are transformed as well
import {h as h} from "grainbox"

const signs = [{ value: "+" }, { value: "-" }]

const renderSign = (props) => {
  return h("span", null, [props.value])
}

const Component = () => h("div", null, [])
const test = h("div", { style: { color: "orange" } }, [
  Component({}),
  h(
    "button",
    {
      onClick: () => {
        const el = h("div", null, [])
        console?.log(el)
      },
      ...passProps,
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