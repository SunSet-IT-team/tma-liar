import { FC, JSX, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './style/buttonsStyle.module.scss';

export type ButtonsVariant = 
  | 'buttonUnderline'
  | 'buttonText'

export interface BtnProps {
  /**
    * варианты кнопок: с подчеркиванием или без
  */
  variant?: ButtonsVariant;
  /**
    * отображаемый тег
  */
  as?: keyof JSX.IntrinsicElements;
  children: ReactNode;
  className?: string;
}

/**
  * компонент переиспользуемой кастомной кнопки
*/

export const CustomButton: FC<BtnProps> = ({ className, variant = 'buttonText', as: Component = 'button', children, }) => {
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