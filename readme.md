# jsx-convert

A CLI tool for converting JSX files into standard JS.

This script looks for JSX code and isolates it before performing a transform using `jsx-transform` on it. This allows it to support modern JS language features which might not be supported by the underlying `jsx-transform` package.

This script will not transform code inside a prop's value. It ignores the contents of a prop. It does this by first converting the prop's value into a backtick-string, escaping any backticks inside the value. This turns the value into a string which `jsx-transform` can handle in all cases. Then the transformed code is converted back into the original value.

Usage:

```
jsx-convert <glob> [--write] [--factory='h']
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
import React from 'hyperscript'

const Component = () => (<div/>)
const test = (
  <div>
    <button onClick={() => console.log('click')}/>
    <Component />
  </div>
)
```

Output:

```js
// Instaces of React are transform as well
import h from 'hyperscript'

const Component = () => (h('div'))
const test = (
  h('div', null, [
    h('button', {onClick: () => console.log('click')}),
    Component()
  ])
)
```
