import styles from './style/inputStyle.module.scss';
import clsx from 'clsx';
import { type FC, InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  placeholder: string;
  /**
   * класс, который будет применяться к wrapper
   */
  className?: string;
  /**
   * Класс, который будет применяться к input
   */
  inputClassName?: string;
  /** 
   * Значение поля ввода
  */
  value?: string;
};

/**
 * Кастомный инпут
 * Будет выполнять отправку данных из поля ввода на сервер
 */
export const TextInput: FC<InputProps> = ({ placeholder, className, inputClassName, value, ...rest }) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      <input
        name="text"
        type="text"
        value={value}
        className={clsx(styles.input, inputClassName)}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  );
};
