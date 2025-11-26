import { FC, useEffect, useState } from "react"
import styles from './style/settingsStyle.module.scss'
import glob from '../../App.module.scss'
import clsx from "clsx"
import { BackArrow } from "../../shared/backArrow/BackArrow"
import soundWhite from '../../assets/icons/soundWhite.svg'
import musicWhite from '../../assets/icons/musicWhite.svg'
import soundRed from '../../assets/icons/soundRed.svg'
import musicRed from '../../assets/icons/musicRed.svg'
import { CustomButton } from "../../shared/CustomButton/CustomButton"
import { Range } from "../../shared/range/Range"
import type { AppState } from "../../shared/range/Range"
import settingsBg from '../../assets/icons/settings-bgIcon.svg'
import { useDispatch, useSelector } from "react-redux"
import appSlice, { setBackgroundMusicIsPlay, setSoundsChange } from "../../store/appSlice"

export const Settings: FC = () => {
  const isSounds = useSelector((state: AppState) => state.appSlice.sounds);
  const isMusic = useSelector((state: AppState) => state.appSlice.backgroundMusic)
  const [isSoundsPlay, setIsSoundsPlay] = useState<boolean>(isSounds)
  const [isMusicPlay, setIsMusicPlay] = useState<boolean>(isMusic)
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setSoundsChange(isSoundsPlay))
  }, [isSoundsPlay])

  useEffect(() => {
    dispatch(setBackgroundMusicIsPlay(isMusicPlay))
  }, [isMusicPlay])
  return (
    <div className={clsx(styles.container, glob.container)}>
      <div className={styles.header}>
        <BackArrow variant="red"  />
      </div>
      <div className={clsx(styles.content, styles.contentStyle)}>
         <div className={clsx(styles.sounds, styles.contentStyle)}>
            <button onClick={() => setIsSoundsPlay(!isSoundsPlay)}>
              <img src={isSoundsPlay ? soundRed : soundWhite} alt="" className={styles.soundImg} />
            </button>
            <button onClick={() => setIsMusicPlay(!isMusicPlay)}>
              <img src={isMusicPlay ? musicRed : musicWhite} alt="" className={styles.musicImg} />
            </button>
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