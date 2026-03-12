import type { FC, JSX, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './style/buttonsStyle.module.scss';
import { usePlaySound } from '../../lib/sound/usePlaySound';

export type ButtonsVariant = 'buttonUnderline' | 'buttonText';

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
  disabled?: boolean;
  soundTrigger?: 'pointerdown' | 'click';
}

/**
 * Компонент переиспользуемой кастомной кнопки
 */
export const Button: FC<BtnProps> = ({
  className,
  variant = 'buttonText',
  as: Component = 'button',
  children,
  onClick,
  disabled,
  soundTrigger = 'pointerdown',
}) => {
  const playSound = usePlaySound();

  const handleClick = () => {
    if (soundTrigger === 'click') {
      playSound();
    }
    onClick?.();
  };

  return (
    <Component
      className={clsx(styles.buttonBase, styles[variant], className)}
      onPointerDown={soundTrigger === 'pointerdown' ? () => playSound() : undefined}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </Component>
  );
};
