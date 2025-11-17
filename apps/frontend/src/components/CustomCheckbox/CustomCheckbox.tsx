import './style/checkboxStyle.scss'

type CheckboxProps = {
  
}

export const CustomCheckbox = (props: CheckboxProps) => {
  return (
    <label className="content">
      <input type="checkbox" id="checkbox__check" className="check" />
      <span className="checkmark"></span>
    </label>
  )
}