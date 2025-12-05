import { FC } from "react"
import styles from './style/profileStyle.module.scss'
import circleIcon from '../../../public/icons/homeCircle.svg'
import testPhoto from '../../../public/icons/blackPhoto.svg'
import { TextInput } from "../../shared/ui/TextInput"
import logo from '../../../public/icons/homeIcon-lzhets.svg'
import { Header } from "../../widgets/Header"
import { Container } from "../../shared/ui/Container"

/** 
 * Страница профиля пользователя, можно изменить фото профиля или имя
*/
export const Profile: FC = () => {
  return (
    <Container>
      <img className={styles.circleIcon} src={circleIcon} alt="" />
      <Header className={styles.header} />
      <img src={testPhoto} alt="" className={styles.profilePhoto} />
      <TextInput placeholder="Nickname" className={styles.profileInputWrapper} />
      <img src={logo} alt="" className={styles.logo} />
    </Container>
  )
}