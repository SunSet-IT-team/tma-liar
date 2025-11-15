import { JSX, ReactNode } from 'react';
import './style/style.scss'
import clsx from 'clsx';

export type TypographyVariant =
  | 'titleLarge'
  | 'titleMiniLarge'
  | 'titleMedium'
  | 'body'
  | 'caption'
  | 'text';

export interface TypographyProps {
  className?: string;
  variant?: TypographyVariant;
  as?: keyof JSX.IntrinsicElements;
  children: ReactNode;
}

export const Typography = ({ className, variant = 'body', as: Component = 'p', children, }: TypographyProps) => {
  const variantClasses: Record<TypographyVariant, string> = {
    titleLarge: 'titleLarge',
    titleMiniLarge: 'titleMiniLarge',
    titleMedium: 'titleMedium',
    body: 'body',
    text: 'text',
    caption: 'caption',
  };

  return (
    <Component className={clsx(variantClasses[variant], className)}>
      {children}
    </Component>
  );
};

export default Typography;
