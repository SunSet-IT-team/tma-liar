import { FC, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "../../../shared/range/Range";
import { setBackgroundMusicIsPlay } from "../../../store/appSlice";
import musicRed from '../../../assets/icons/musicRed.svg'
import musicWhite from '../../../assets/icons/musicWhite.svg'
import styles from '../style/settingsSoundsStyle.module.scss'

export const SettingsMusic: FC = () => {
  // Получаем активность музыки из redux
  const isMusic = useSelector((state: AppState) => state.appSlice.backgroundMusic)
  const [isMusicPlay, setIsMusicPlay] = useState<boolean>(isMusic)

  const dispatch = useDispatch();

  useEffect(() => {
    // Изменяем значение backgroundMusic в redux на активное
    dispatch(setBackgroundMusicIsPlay(isMusicPlay))
  }, [isMusicPlay])
  
  return (
    <button onClick={() => setIsMusicPlay(!isMusicPlay)}>
      <img src={isMusicPlay ? musicRed : musicWhite} alt="" className={styles.musicImg} />
    </button>
  )
}