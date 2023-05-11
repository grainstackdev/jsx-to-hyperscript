# jsx-to-hyperscript

> A CLI command for converting JSX files into standard JS.

## Usage

### CLI

```
Usage:
    jsx-to-hyperscript <glob> [--write] [--factory='h'] [--flow]
    
Options:
    --write       When set, causes the file to be overwritten in-place.
    --leafsFirst  As a non-standard improvement, `h` calls are nested with arrow functions so that execution order is contextual. If you would like the original behavior, use this leafsFirst flag. See docs. Optional.
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
  factory?: 'h',
  reverse?: false
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
  return h("span", null, [() => (props.value)])
}

const Component = () => h("div", null, [])
const test = h("div", { style: { color: "orange" } }, [
  () => (Component({})),
  () => h(
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
  () => (signs.map(renderSign)),
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
      () => h('span', null, []),
      () => h('span', null, [])
    ]
  )
}
```

## --leafsFirst

hyperscript is usually used like this:

```js
h('div', {className: 'col'}, [
  h('div', null, [
    h('span')
  ])
])
```

However, this would cause the leafs to compute before the root.
Instead, by using arrow functions, the call order can be flipped around so that elements are built from root to leaf:

```js
h('div', {className: () => ('col')}, [
  () => h('div', null, [
    () => h('span')
  ])
])
```

This allows [`grainbox`](https://www.npmjs.com/package/grainbox), along with some slight modifications to hyperscript, to build html with context. For example, when the span above is being created, it is possible to obtain a reference to the parent div. This is useful for setting up fine-grained updates.

Because context is gained in the latter, it is the default. If you need the former, you can set the `--leafsFirst` flag.
