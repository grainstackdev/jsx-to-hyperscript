// @flow

import { h as React } from "../imports.js"

const TextareaField: any = (props) => {
  const { label, rows, disabled, ref, ...passProps } = props

  return (
    <div className="flex field text-field">
      <span>{label}</span>
      <textarea
        className="textarea"
        rows={rows}
        disabled={disabled}
        ref={ref}
        {...passProps}
      />
    </div>
  )
}

export default TextareaField
