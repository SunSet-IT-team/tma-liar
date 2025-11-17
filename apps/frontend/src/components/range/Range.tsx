import { useState } from "react";
import './style/rangeStyle.scss'

type RangeProps = {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
}

export const Range = ({ min = 1, max = 100, step = 1, defaultValue, onChange }: RangeProps) => {
  const [value, setValue] = useState<number>(defaultValue ?? min);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
    onChange?.(newValue);
  };

  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="range-slider">
      <div className="range-slider__track">
        <div className="range-slider__track-bg" />
        <div
          className="range-slider__track-fill"
          style={{ width: `${percent}%` }}
        />
        <div
          className="range-slider__thumb"
          style={{ left: `${percent}%` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="range-slider__input"
        onChange={handleChange}
      />
    </div>
  )
}