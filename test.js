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