import clsx from "clsx";
import { FC, useState } from "react"
import { BackArrow } from "../../shared/ui/BackArrow";
import type { BackArrowVariant } from "../../shared/ui/BackArrow";
import { SettingIcon } from "../../shared/ui/SettingIcon";
import type { SettingsVariant } from "../../shared/ui/SettingIcon";
import styles from './style/headerStyle.module.scss'
import { LeavePopup } from "../../entities/popups/ui/LeavePopup";
import type { PopupStyle } from "../../entities/popups/ui/LeavePopup";

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
   * Находится ли в игре игрок
  */
  inGame?: boolean;
  popupStyle?: PopupStyle;
}

/** 
 * Шапка для всех экранов
*/
export const Header: FC<HeaderProps> = ({ variantArrow, variantSettings, className, inGame, popupStyle }) => {
  const [leaveLobby, setLeaveLobbi] = useState<boolean>(false)

  return (
    <>
      <div className={clsx(styles.header, className)}>
        <BackArrow variant={variantArrow} leaveLobby={(value: boolean) => setLeaveLobbi(value)} inGame={inGame} />
        <SettingIcon variant={variantSettings} />
      </div>
    
      {leaveLobby &&
        <LeavePopup changeShow={(show: boolean) => setLeaveLobbi(show)} popupStyle={popupStyle} />
      }
    </>
  )
}