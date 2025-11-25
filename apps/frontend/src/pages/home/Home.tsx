import { FC } from "react"
import styles from './style/homeStyle.module.scss'
import homeCircle from '../../assets/icons/homeCircle.svg'
import { Settings } from "../../shared/settings/Settings"
import homeLogo from '../../assets/icons/homeIcon-lzhets.svg'
import { CustomButton } from "../../shared/CustomButton/CustomButton"
import bgIcon from '../../assets/icons/homeIcon-bg.svg'
import glob from '../../App.module.scss'
import clsx from "clsx"

export const Home: FC = () => {
  return (
    <div className={clsx(glob.container, styles.container)}>
      <img className={styles.circleIcon} src={homeCircle} alt="" />
      <Settings className={styles.settingsBtn} />
      <img src={homeLogo} alt="" className={styles.logo} />
      <CustomButton variant="buttonUnderline" className={styles.homeBtn}>
        Создать
      </CustomButton>
      <CustomButton className={styles.homeBtn}>Присоедениться</CustomButton>
      <img src={bgIcon} alt="" className={styles.bgImage} />
    </div>
  )
}