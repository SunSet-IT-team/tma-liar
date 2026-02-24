import { type FC, useState } from 'react';
import { usePlaySound } from '../../lib/sound/usePlaySound';
import styles from './style/checkboxStyle.module.scss';

type CheckboxProps = {
  onChange: (value: boolean) => void;
};

/**
 * Чекбокс с кастомной иконкой
 * Будет использоваться в оценке других игроков
 */
export const Checkbox: FC<CheckboxProps> = ({ onChange }) => {
  const [checked, setChecked] = useState<boolean>(false);
  const playSound = usePlaySound();

  const onCheckbox = () => {
    playSound();
    onChange(!checked);
  };
  return (
    <label className={styles.content} onClick={onCheckbox}>
      <input type="checkbox" className={styles.check} />
      <span className={styles.checkmark}></span>
    </label>
  );
};
