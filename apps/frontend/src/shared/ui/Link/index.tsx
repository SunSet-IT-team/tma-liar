import clsx from "clsx";
import { FC } from "react"
import styles from './style/linkStyle.module.scss'

type LinkProps = {
  /**  
   * Иконка сыслки
  */
  icon: any;
  /**  
   * Путь, для перехода на страницу
  */
  route: string;
  className?: string;
}

/** 
 * Ссылка для перехода страниц
*/
export const Link: FC<LinkProps> = ({ icon, route, className }) => {
  return (
    <a href="#" className={clsx(styles.link, className)}>
      <img src={icon} alt="" />
    </a>
  )
}