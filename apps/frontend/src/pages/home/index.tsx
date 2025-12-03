import { FC } from "react"
import styles from './style/homeStyle.module.scss'
import homeCircle from '../../../public/icons/homeCircle.svg'
import { SettingIcon } from "../../shared/ui/SettingIcon"
import homeLogo from '../../../public/icons/homeIcon-lzhets.svg'
import { Button } from "../../shared/ui/Button"
import bgIcon from '../../../public/icons/homeIcon-bg.svg'
import { Container } from "../../shared/ui/Container"

/** 
 * Главная страница, при открытии приложения показывается именно она
*/
export const Home: FC = () => {
  return (
    <Container>
      <img className={styles.circleIcon} src={homeCircle} alt="" />
      <SettingIcon className={styles.settingsBtn} />
      <img src={homeLogo} alt="" className={styles.logo} />
      <Button variant="buttonUnderline" className={styles.homeBtn}>
        Создать
      </Button>
      <Button className={styles.homeBtn}>Присоедениться</Button>
      <img src={bgIcon} alt="" className={styles.bgImage} />
    </Container>
  )
}