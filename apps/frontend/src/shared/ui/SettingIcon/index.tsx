import { ButtonHTMLAttributes, FC } from "react"
import styles from './style/settingsStyle.module.scss'
import whiteSettings from '../icons/whiteSettings.svg'
import blackSettings from '../icons/settingsIcon.svg'

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
  const srcMap: Record<SettingsVariant, string> = {
    white: whiteSettings,
    black: blackSettings,
  };

  const src = srcMap[variant];

  return (
    <button onClick={onClick} {...rest}>
      <img src={src} alt="" className={styles.settingsIcon} />
    </button>
  )
}