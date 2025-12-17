import { FC, useEffect, useState } from "react"
import { useDispatch } from "react-redux";
import { setBackgroundMusicIsPlay } from "../../../../entities/appSetting/model/slice";
import musicRed from '../../../../shared/ui/icons/musicRed.svg'
import musicWhite from '../../../../shared/ui/icons/musicWhite.svg'
import styles from '../../style/settingsSoundsStyle.module.scss'
import { useAppSelector } from "../../../../app/store/hook";
import { usePlaySound } from "../../../../shared/lib/sound/usePlaySound";

/** 
 * Функционал включеия и выключения фоновой музыки
*/
export const SettingsMusic: FC = () => {
  // Получаем активность музыки из redux
  const isMusic = useAppSelector((state) => state.appSettings.backgroundMusic)
  const [isMusicPlay, setIsMusicPlay] = useState<boolean>(isMusic)

  const dispatch = useDispatch();
  const playSound = usePlaySound();

  useEffect(() => {
    // Изменяем значение backgroundMusic в redux на активное
    dispatch(setBackgroundMusicIsPlay(isMusicPlay))
  }, [isMusicPlay])

  const changeMusic = () => {
    playSound();
    setIsMusicPlay(!isMusicPlay)
  }
  
  return (
    <button onClick={changeMusic}>
      <img src={isMusicPlay ? musicRed : musicWhite} alt="" className={styles.musicImg} />
    </button>
  )
}