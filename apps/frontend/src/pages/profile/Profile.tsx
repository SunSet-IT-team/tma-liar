import { FC } from "react"
import styles from './style/profileStyle.module.scss'
import glob from '../../App.module.scss'
import clsx from "clsx"
import circleIcon from '../../assets/icons/homeCircle.svg'
import { BackArrow } from "../../components/backArrow/BackArrow"
import { Settings } from "../../components/settings/Settings"
import testPhoto from '../../assets/icons/blackPhoto.svg'
import { TextInput } from "../../components/TextInput/TextInput"
import logo from '../../assets/icons/homeIcon-lzhets.svg'

export const Profile: FC = () => {
  return (
    <div className={clsx(glob.container, styles.container)}>
      <img className={styles.circleIcon} src={circleIcon} alt="" />
      <div className={styles.header}>
        <BackArrow />
        <Settings />
      </div>
      <img src={testPhoto} alt="" className={styles.profilePhoto} />
      <TextInput placeholder="Nickname" className={styles.profileInputWrapper} />
      <img src={logo} alt="" className={styles.logo} />
    </div>
  )
}