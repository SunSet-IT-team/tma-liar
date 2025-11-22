import { ButtonHTMLAttributes, FC } from "react"
import styles from './style/settingsStyle.module.scss'
import whiteSettings from '../../assets/icons/whiteSettings.svg'
import blackSettings from '../../assets/icons/settingsIcon.svg'

type SettingsVariant = 'black' | 'white'

type SettingsProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: SettingsVariant;
  onClick?: () => void;
}

export const Settings: FC<SettingsProps> = ({ variant = 'black', onClick, ...rest }) => {
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