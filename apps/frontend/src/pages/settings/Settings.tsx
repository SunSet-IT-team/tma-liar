import { FC } from "react"
import styles from './style/settingsStyle.module.scss'
import glob from '../../App.module.scss'
import clsx from "clsx"
import { BackArrow } from "../../shared/backArrow/BackArrow"
import { CustomButton } from "../../shared/CustomButton/CustomButton"
import { Range } from "../../shared/range/Range"
import settingsBg from '../../assets/icons/settings-bgIcon.svg'
import { SettingsTouches } from "../../features/SettingsSounds/ui/SettingsTouches"
import { SettingsMusic } from "../../features/SettingsSounds/ui/SettingsMusic"

/** 
 * Страница настроек игры
*/
export const Settings: FC = () => {
  return (
    <div className={clsx(styles.container, glob.container)}>
      <div className={styles.header}>
        <BackArrow variant="red"  />
      </div>
      <div className={clsx(styles.content, styles.contentStyle)}>
         <div className={clsx(styles.sounds, styles.contentStyle)}>
            <SettingsTouches />
            <SettingsMusic />
          </div>
          <div className={styles.languageBlock}>
            <span className={styles.settingsText}>Язык</span>
            <CustomButton className={styles.settingsText}>
              Русский
            </CustomButton>
          </div>
          <div className={styles.volume}>
            <span className={styles.settingsText}>Звук</span>
            <Range />
          </div>
          <CustomButton className={clsx(styles.settingsText, styles.helpBtn)}>
            Тех. Поддержка
          </CustomButton>
          <CustomButton className={styles.settingsText}>
            Разработчики
          </CustomButton>
      </div>
      <img src={settingsBg} alt="" className={styles.settingsBg} />
    </div>
  )
}