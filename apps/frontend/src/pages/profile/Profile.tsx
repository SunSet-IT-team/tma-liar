import { FC } from "react"
import styles from './style/profileStyle.module.scss'
import glob from '../../App.module.scss'
import clsx from "clsx"
import circleIcon from '../../assets/icons/homeCircle.svg'
import testPhoto from '../../assets/icons/blackPhoto.svg'
import { TextInput } from "../../shared/TextInput/TextInput"
import logo from '../../assets/icons/homeIcon-lzhets.svg'
import { Header } from "../../widgets/header/Header"

export const Profile: FC = () => {
  return (
    <div className={clsx(glob.container, styles.container)}>
      <img className={styles.circleIcon} src={circleIcon} alt="" />
      <Header className={styles.header} />
      <img src={testPhoto} alt="" className={styles.profilePhoto} />
      <TextInput placeholder="Nickname" className={styles.profileInputWrapper} />
      <img src={logo} alt="" className={styles.logo} />
    </div>
  )
}