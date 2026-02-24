import { type FC, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store/hook';
import { setMainVolume } from '../../../entities/appSetting/model/slice';
import styles from './style/rangeStyle.module.scss';

type RangeProps = {
  /**
   * Минимальное значение диапазона
   */
  min?: number;
  /**
   * Максимальное значение диапазона
   */
  max?: number;
  /**
   * Шаг, с которым будет изменяться значение громкости
   */
  step?: number;
  onChange?: (value: number) => void;
};

/**
 * Компонент для регулировки громкости звуков и музыки в игре
 */
export const Range: FC<RangeProps> = ({ min = 1, max = 100, step = 1, onChange }) => {
  // Получаем начальное значение громкости
  const initialVolume = useAppSelector((state) => state.appSettings.volume);
  const [value, setValue] = useState<number>(initialVolume ?? min);
  const dispatch = useAppDispatch();

  // Функция выполняет изменение значения громкости
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
    onChange?.(newValue);
  };

  // Каждые пол секунды обновляем значение в redux
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
        <div className={styles.rangeSlider__trackFill} style={{ width: `${percent}%` }} />
        <div className={styles.rangeSlider__thumb} style={{ left: `${percent}%` }} />
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
  );
};
