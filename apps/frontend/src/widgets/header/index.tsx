import clsx from "clsx";
import { FC } from "react"
import { BackArrow } from "../../shared/ui/BackArrow";
import type { BackArrowVariant } from "../../shared/ui/BackArrow";
import { SettingIcon } from "../../shared/ui/SettingIcon";
import type { SettingsVariant } from "../../shared/ui/SettingIcon";
import styles from './style/headerStyle.module.scss'

type HeaderProps = {
  /**
    * Варианты цветов стрелки (белый, красный, черный)
  */
  variantArrow?: BackArrowVariant;
  /**
    * Варианты цветов настроек (белый, черный)
  */
  variantSettings?: SettingsVariant;
  className?: string;
  /** 
   * Изменение показа попапа лобби
  */
  leaveLobby: (value: boolean) => void;
}

/** 
 * Шапка для всех экранов
*/
export const Header: FC<HeaderProps> = ({ variantArrow, variantSettings, className, leaveLobby }) => {
  return (
    <div className={clsx(styles.header, className)}>
      <BackArrow variant={variantArrow} leaveLobby={leaveLobby} />
      <SettingIcon variant={variantSettings} />
    </div>
  )
}