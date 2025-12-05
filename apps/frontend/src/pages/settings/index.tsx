import { FC } from "react"
import styles from './style/settingsStyle.module.scss'
import clsx from "clsx"
import { BackArrow } from "../../shared/ui/BackArrow"
import { Button } from "../../shared/ui/Button"
import { Range } from "../../shared/ui/Range"
import settingsBg from '../../../public/icons/settings-bgIcon.svg'
import { SettingsTouches } from "../../features/SettingsSounds/ui/SettingsTouches"
import { SettingsMusic } from "../../features/SettingsSounds/ui/SettingsMusic"
import { Container } from "../../shared/ui/Container"
import { Typography } from "../../shared/ui/Typography"

/** 
 * Страница настроек игры
*/
export const Settings: FC = () => {
  return (
    <Container className={styles.container}>
      <div className={styles.header}>
        <BackArrow variant="red"  />
      </div>
      <div className={clsx(styles.content, styles.contentStyle)}>
         <div className={clsx(styles.sounds, styles.contentStyle)}>
            <SettingsTouches />
            <SettingsMusic />
          </div>
          <div className={styles.languageBlock}>
            <Typography className={styles.settingsText}>Язык</Typography>
            <Button className={styles.settingsText}>
              Русский
            </Button>
          </div>
          <div className={styles.volume}>
            <Typography className={styles.settingsText}>Язык</Typography>
            <Range />
          </div>
          <Button className={clsx(styles.settingsText, styles.helpBtn)}>
            Тех. Поддержка
          </Button>
          <Button className={styles.settingsText}>
            Разработчики
          </Button>
      </div>
      <img src={settingsBg} alt="" className={styles.settingsBg} />
    </Container>
  )
}