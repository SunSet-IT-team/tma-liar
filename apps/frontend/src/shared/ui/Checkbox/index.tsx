import { type FC, useEffect, useState } from 'react';
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
  const [localChecked, setLocalChecked] = useState<boolean>(checked ?? false);
  const playSound = usePlaySound();

  useEffect(() => {
    if (typeof checked === 'boolean') {
      setLocalChecked(checked);
    }
  }, [checked]);

  const onCheckbox = () => {
    const next = !localChecked;
    setLocalChecked(next);
    playSound();
    onChange(next);
  };
  return (
    <label className={styles.content} onClick={onCheckbox}>
      <input type="checkbox" className={styles.check} checked={localChecked} readOnly />
      <span className={styles.checkmark}></span>
    </label>
  );
};
