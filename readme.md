# jsx-convert

A CLI tool for converting JSX files into standard JS.

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
