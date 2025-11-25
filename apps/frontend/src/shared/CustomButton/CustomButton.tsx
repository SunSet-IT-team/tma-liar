import { FC, JSX, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './style/buttonsStyle.module.scss';

export type ButtonsVariant = 
  | 'buttonUnderline'
  | 'buttonText'

export interface BtnProps {
  variant?: ButtonsVariant;
  as?: keyof JSX.IntrinsicElements;
  children: ReactNode;
  className?: string;
}

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