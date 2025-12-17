import { ButtonHTMLAttributes, FC } from "react"
import styles from './style/settingsStyle.module.scss'
import whiteSettings from '../icons/whiteSettings.svg'
import blackSettings from '../icons/settingsIcon.svg'
import { useNavigate } from "react-router-dom"
import { PageRoutes } from "../../../app/routes/pages"
import { usePlaySound } from "../../lib/sound/usePlaySound"

export type SettingsVariant = 'black' | 'white'

type SettingsProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
    * Варианты цветов настроек (белый, черный)
  */
  variant?: SettingsVariant;
  onClick?: () => void;
}

/** 
 * Кнопка настроек будет производить переход на страницу настроек
 * Чаще всего используется в шапке (header)
*/
export const SettingIcon: FC<SettingsProps> = ({ variant = 'black', onClick, ...rest }) => {
  const navigate = useNavigate();
  const srcMap: Record<SettingsVariant, string> = {
    white: whiteSettings,
    black: blackSettings,
  };

  const src = srcMap[variant];
  const playSound = usePlaySound();

  const onSetting = () => {
    playSound();
    navigate(`/${PageRoutes.SETTINGS}`)
    if (onClick) onClick()
  }

  return (
    <button onClick={onSetting} {...rest}>
      <img src={src} alt="" className={styles.settingsIcon} />
    </button>
  )
}