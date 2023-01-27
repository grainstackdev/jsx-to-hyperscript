// Instances of React are transform as well
import React from "hyperscript"

const signs = [{ value: "+" }, { value: "-" }]

const renderSign = (props) => {
  return (
    <span>{props.value}</span>
  )
}

const Component = (props) => (<div>{props.prop}</div>)
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