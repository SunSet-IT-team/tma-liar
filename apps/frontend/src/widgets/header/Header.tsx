import clsx from "clsx";
import { FC } from "react"
import { BackArrow } from "../../shared/backArrow/BackArrow";
import type { BackArrowVariant } from "../../shared/backArrow/BackArrow";
import { Settings } from "../../shared/settings/Settings";
import type { SettingsVariant } from "../../shared/settings/Settings";
import styles from './style/headerStyle.module.scss'

type HeaderProps = {
  /**
    * варианты цветов стрелки (белый, красный, черный)
  */
  variantArrow?: BackArrowVariant;
  /**
    * варианты цветов настроек (белый, черный)
  */
  variantSettings?: SettingsVariant;
  className?: string;
}

/** 
 * Шапка для всех экранов
*/

export const Header: FC<HeaderProps> = ({ variantArrow, variantSettings, className }) => {
  return (
    <div className={clsx(styles.header, className)}>
      <BackArrow variant={variantArrow} />
      <Settings variant={variantSettings} />
    </div>
  )
}