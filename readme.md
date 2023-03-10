# jsx-to-hyperscript

> A CLI command for converting JSX files into standard JS.

Usage:

```
npx jsx-to-hyperscript <glob> [--write] [--factory='h'] [--flow]
```

Example:

```
// package.json
{
  "scripts": {
    "build": "jsx-to-hyperscript 'build/**/*.{js,mjs}' --write"
  }
}
```

Some examples of what `<glob>` can be:
```
build/**/*.js
build/**/*{.js,.jsx}
file.js
```

### CLI Flags

* `--write` - Causes the files matching the glob to be overwritten by the output, otherwise output goes to stdout.
* `--factory='h'` - By default the factory function is `h`. Use this to change it.
* `--flow` - Passes the input through `flow-remove-types` before transforming.

### Examples

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