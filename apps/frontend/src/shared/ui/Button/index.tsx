import { FC, JSX, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './style/buttonsStyle.module.scss';
import { usePlaySound } from '../../lib/sound/usePlaySound';

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
  onClick?: () => void;
}

/**
  * Компонент переиспользуемой кастомной кнопки
*/
export const Button: FC<BtnProps> = ({ className, variant = 'buttonText', as: Component = 'button', children, onClick }) => {
  const playSound = usePlaySound();

  const handleClick = () => {
    playSound();
    onClick?.();
  };

  return (
    <Component className={clsx(
      styles.buttonBase,
      styles[variant],
      className,
      )} 
      onClick={handleClick}>
      {children}
    </Component>
  )
}