# jsx-transform-modern-cli

A CLI tool for converting JSX files into standard JS.

This script looks for JSX code and isolates it before performing a transform using `jsx-transform` on it. This allows it to support modern JS language features which might not be supported by the underlying `jsx-transform` package.

This script will not transform code inside a prop's value. It ignores the contents of a prop. It does this by first converting the prop's value into a backtick-string, escaping any backticks inside the value. This turns the value into a string which `jsx-transform` can handle in all cases. Then the transformed code is converted back into the original value.

Usage:

```
npx jsx-convert <glob> [--write] [--factory='h']
or
node ./node_modules/jsx-transform-modern-cli/src/index.mjs <glob> [--write] [--factory='h']
```

Some examples of what `<glob>` can be:
```
build/**/*.js
build/**/*{.js,.jsx}
file.js
```

### Example

Input:

```jsx
// Instaces of React are transform as well
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
    <button onClick={() => {
      const el = <div/>
      console?.log(el)
    }} />
    <Component />
    <Component prop={"asda"} />
    {signs.map(renderSign)}
  </div>
)
```

Output:

```js
function Fragment_94(_, children) {
  return () => children
}
// Instaces of h are transform as well
import h from 'hyperscript'

const Component = () => (h('div', null, []))
const test = (
  h('div', null, [h('button', {onClick: () => console.log('click')}, []), Component(null), Component({props: 'asda'}), Fragment_94(h('span', null, []), h('span', null, []), h('span', null, []))])
)
```
