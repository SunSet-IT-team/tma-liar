import clsx from "clsx";
import { FC } from "react"
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  return (
    <button className={clsx(styles.link, className)} onClick={() => navigate(route)}>
      <img src={icon} alt="" />
    </button>
  )
}