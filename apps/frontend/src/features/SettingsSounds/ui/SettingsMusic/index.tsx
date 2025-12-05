import { FC, useEffect, useState } from "react"
import { useDispatch } from "react-redux";
import { setBackgroundMusicIsPlay } from "../../../../entities/appSetting/model/slice";
import musicRed from '../../../../shared/ui/icons/musicRed.svg'
import musicWhite from '../../../../shared/ui/icons/musicWhite.svg'
import styles from '../../style/settingsSoundsStyle.module.scss'
import { useAppSelector } from "../../../../app/store/hook";

/** 
 * Функционал включеия и выключения фоновой музыки
*/
export const SettingsMusic: FC = () => {
  // Получаем активность музыки из redux
  const isMusic = useAppSelector((state) => state.appSettings.backgroundMusic)
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