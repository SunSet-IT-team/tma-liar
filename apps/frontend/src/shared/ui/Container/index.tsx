import clsx from 'clsx';
import type { FC, ReactNode } from 'react';
import styles from './style/containerStyle.module.scss';

type ContainerProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Общий контейнер с анимацией появления для всех страниц
 */
export const Container: FC<ContainerProps> = ({ className, children }) => {
  return (
    <div className={clsx(className, styles.container, 'container')}>
      {children}
    </div>
  );
};
