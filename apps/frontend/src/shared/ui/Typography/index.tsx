import { FC, JSX, ReactNode } from 'react';
import styles from './style/typographyStyle.module.scss';
import clsx from 'clsx';

/**
  * Вариманты размеров текста
*/
export type TypographyVariant =
  | 'titleLarge'
  | 'titleMiniLarge'
  | 'titleMedium'
  | 'body'
  | 'caption'
  | 'text';

export interface TypographyProps {
  className?: string;
  /**
    * Вариманты размеров текста
  */
  variant?: TypographyVariant;
  /**
    * Отображаемый тег
  */
  as?: keyof JSX.IntrinsicElements;
  children: ReactNode;
}

/** 
 * Отображение кастомного текста с вариантами размеров текста
*/
export const Typography: FC<TypographyProps> = ({ className, variant = 'body', as: Component = 'p', children, }: TypographyProps) => {
  return (
    <Component className={clsx(
      styles.typographyBase,
      styles[variant],
      className,
    )}>
      {children}
    </Component>
  );
};
