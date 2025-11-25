import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMainVolume } from "../../store/appSlice";
import styles from './style/rangeStyle.module.scss'

type RangeProps = {
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

export type AppState = {
  appSlice: {
    user: {
      id: number,
      photo: string;
      name: string;
    }
    sounds: boolean;
    backgroundMusic: boolean;
    volume: number;
  };
}

export const Range: FC<RangeProps> = ({ min = 1, max = 100, step = 1, onChange }) => {
  const initialVolume = useSelector((state: AppState) => state.appSlice.volume);
  const [value, setValue] = useState<number>(initialVolume ?? min);
  const dispatch = useDispatch()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
    onChange?.(newValue);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setMainVolume(value));
    }, 500); 

    return () => {
      clearTimeout(timer); 
    };
  }, [value, dispatch]);

  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className={styles.rangeSlider}>
      <div className={styles.rangeSlider__track}>
        <div className={styles.rangeSlider__trackBg} />
        <div
          className={styles.rangeSlider__trackFill}
          style={{ width: `${percent}%` }}
        />
        <div
          className={styles.rangeSlider__thumb}
          style={{ left: `${percent}%` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className={styles.rangeSlider__input}
        onChange={handleChange}
      />
    </div>
  )
}