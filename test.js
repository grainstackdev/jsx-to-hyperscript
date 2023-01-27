// @flow

import { h as React } from "../imports.js"

type RadioItem = {
  id: string,
  value: any,
  checked?: boolean,
  disabled?: boolean,
}

type RadioItemProps = {
  item: RadioItem,
  groupName: string,
  onChange: () => void,
}

type RadioFieldProps = {
  onChange: () => void,
  groupName: string,
  items: Array<RadioItem>,
}

function renderInput(props: RadioItemProps) {
  return (
    <div>
      <input
        checked={props.item.checked}
        disabled={props.item.disabled}
        type="radio"
        id={props.item.id}
        name={props.groupName}
        value={props.item.id}
        onChange={props.onChange}
      />
      <span>{props.item.value}</span>
    </div>
  )
}

const RadioField: (RadioFieldProps) => HTMLElement = ({
  onChange,
  groupName,
  items,
}) => (
  <div className="flex row spaced radio-field">
    {items.map((item) => renderInput({ groupName, item, onChange }))}
  </div>
)

export default RadioField