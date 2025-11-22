import styles from './style/inputStyle.module.scss'
import clsx from 'clsx';
import { FC, InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    placeholder: string;
    className?: string;
    inputClassName?: string;
}

export const TextInput: FC<InputProps> = ({ placeholder, className, inputClassName, ...rest }) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
       <input name='text' type='text' className={clsx(styles.input, inputClassName)} placeholder={placeholder} {...rest} /> 
    </div>
  )
}