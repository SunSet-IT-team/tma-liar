import { type FC, useId } from 'react';
import { usePlaySound } from '../../lib/sound/usePlaySound';
import styles from './style/checkboxStyle.module.scss';

type CheckboxProps = {
  onChange: (value: boolean) => void;
  checked?: boolean;
};

/**
 * Чекбокс с кастомной иконкой
 * Будет использоваться в оценке других игроков
 */
export const Checkbox: FC<CheckboxProps> = ({ onChange, checked }) => {
  const inputId = useId();
  const playSound = usePlaySound();

  const onCheckboxChange = (value: boolean) => {
    onChange(value);
  };

  return (
    <label className={styles.content} htmlFor={inputId} onPointerDown={() => playSound()}>
      <input
        id={inputId}
        type="checkbox"
        className={styles.check}
        checked={Boolean(checked)}
        onChange={(event) => onCheckboxChange(event.target.checked)}
      />
      <span className={styles.checkmark}></span>
    </label>
  );
};
