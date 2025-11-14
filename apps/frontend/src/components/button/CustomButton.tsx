import { JSX, ReactNode } from 'react';
import clsx from 'clsx';
import './style/buttonsStyle.scss'

export type ButtonsVariant = 
  | 'buttonUnderline'
  | 'buttonText'

export interface BtnProps {
  variant?: ButtonsVariant;
  as?: keyof JSX.IntrinsicElements;
  children: ReactNode;
  className?: string;
}

export const CustomButton = ({ className, variant = 'buttonUnderline', as: Component = 'button', children, }: BtnProps) => {
  const buttonClasses: Record<ButtonsVariant, string> = {
    buttonUnderline: 'buttonUnderline',
    buttonText: 'buttonText',
  };

  return (
    <Component className={clsx(buttonClasses[variant], className)}>
      {children}
    </Component>
  )
}