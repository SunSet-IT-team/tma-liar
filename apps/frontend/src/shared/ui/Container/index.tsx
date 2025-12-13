import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { FC, ReactNode } from "react"
import { useLocation } from "react-router-dom";
import styles from './style/containerStyle.module.scss'

type ContainerProps = {
  className?: string;
  children: ReactNode;
}

/** 
 * Общий контейнер с анимацией появления для всех страниц
*/
export const Container: FC<ContainerProps> = ({ className, children }) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname}
        initial={{ opacity: 0, scale: 0.98 }}   // начало: ниже + прозрачность
        animate={{ opacity: 1, scale: 1 }}    // появление: подъём + проявление
        exit={{ opacity: 0, y: -5 }}     // уход: вверх + исчезновение
        transition={{ duration: 0.1, ease: "easeOut" }}
        className={clsx(className, styles.container, 'container')}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}