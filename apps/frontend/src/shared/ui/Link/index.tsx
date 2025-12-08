import clsx from "clsx";
import { FC } from "react"
import styles from './style/linkStyle.module.scss'

type LinkProps = {
  icon: any;
  route: string;
  className?: string;
}

export const Link: FC<LinkProps> = ({ icon, route, className }) => {
  return (
    <a href="#" className={clsx(styles.link, className)}>
      <img src={icon} alt="" />
    </a>
  )
}