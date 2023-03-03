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
  <div style={{color: 'orange', flexDirection: 'column'}}>
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