import clsx from "clsx";
import { FC, ReactNode } from "react"
import styles from './style/containerStyle.module.scss'

type ContainerProps = {
  className?: string;
  children: ReactNode;
}

/** 
 * Общий контейнер для всех страниц
*/
export const Container: FC<ContainerProps> = ({ className, children }) => {
  return (
    <div className={clsx(className, styles.container, 'container')}>
      {children}
    </div>
  )
}