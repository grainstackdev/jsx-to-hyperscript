import React from "hyperscript"

const renderRow = () => {
  return (
    <>
      <span />
      <span />
    </>
  )
}

const test = (
  <div>
    <>
      <span />
      <span />
      <span />
    </>
    {renderRow()}
  </div>
)