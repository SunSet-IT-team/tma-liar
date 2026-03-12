import styles from './style/inputStyle.module.scss';
import clsx from 'clsx';
import type { FC, FocusEvent, InputHTMLAttributes } from 'react';

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
};

/**
 * Кастомный инпут
 * Будет выполнять отправку данных из поля ввода на сервер
 */
export const TextInput: FC<InputProps> = ({ placeholder, className, inputClassName, ...rest }) => {
  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    rest.onFocus?.(event);
    if (event.defaultPrevented) return;

    const target = event.currentTarget;
    // На мобильных после открытия клавиатуры прокручиваем поле в видимую область.
    window.setTimeout(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
  };

  return (
    <div className={clsx(styles.wrapper, className)}>
      <input
        name="text"
        type="text"
        className={clsx(styles.input, inputClassName)}
        placeholder={placeholder}
        {...rest}
        onFocus={handleFocus}
      />
    </div>
  );
};
