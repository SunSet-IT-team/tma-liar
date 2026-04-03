import type { FC, JSX, ReactNode } from 'react';
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

  /**
   * Относительное позиционирование
   */
  relative?: boolean;
}

/**
 * Отображение кастомного текста с вариантами размеров текста
 */
export const Typography: FC<TypographyProps> = ({
  className,
  variant = 'body',
  relative = true,
  as: Component = 'p',
  children,
}: TypographyProps) => {
  return (
    <Component
      className={clsx(styles.typographyBase, styles[variant], className)}
      data-relative={relative}
    >
      {children}
    </Component>
  );
};
