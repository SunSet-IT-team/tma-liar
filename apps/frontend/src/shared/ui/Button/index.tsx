import { FC, JSX, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './style/buttonsStyle.module.scss';

export type ButtonsVariant = 
  | 'buttonUnderline'
  | 'buttonText'

export interface BtnProps {
  /**
    * Варианты кнопок: с подчеркиванием или без
  */
  variant?: ButtonsVariant;
  /**
    * Отображаемый тег
  */
  as?: keyof JSX.IntrinsicElements;
  children: ReactNode;
  className?: string;
}

/**
  * Компонент переиспользуемой кастомной кнопки
*/
export const Button: FC<BtnProps> = ({ className, variant = 'buttonText', as: Component = 'button', children, }) => {
  return (
    <Component className={clsx(
      styles.buttonBase,
      styles[variant],
      className,
    )}>
      {children}
    </Component>
  )
}