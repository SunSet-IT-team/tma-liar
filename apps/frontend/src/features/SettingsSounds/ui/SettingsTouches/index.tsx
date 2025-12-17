import { FC, useEffect, useState } from "react"
import { useDispatch } from "react-redux";
import { setSoundsChange } from "../../../../entities/appSetting/model/slice";
import soundRed from '../../../../shared/ui/icons/soundRed.svg'
import soundWhite from '../../../../shared/ui/icons/soundWhite.svg'
import styles from '../../style/settingsSoundsStyle.module.scss'
import { useAppSelector } from "../../../../app/store/hook";
import { usePlaySound } from "../../../../shared/lib/sound/usePlaySound";

/** 
 * Функционал включеия и выключения звуков в игре
*/
export const SettingsTouches: FC = () => {
  // Получаем активность звуков из redux
  const isSounds = useAppSelector((state) => state.appSettings.sounds);
  const [isSoundsPlay, setIsSoundsPlay] = useState<boolean>(isSounds)

  const dispatch = useDispatch();
  const playSound = usePlaySound();

  useEffect(() => {
    // Изменяем значение sounds в redux на активное
    dispatch(setSoundsChange(isSoundsPlay))
  }, [isSoundsPlay])

  const changeSound = () => {
    playSound();
    setIsSoundsPlay(!isSoundsPlay)
  }
  return (
    <button onClick={changeSound}>
      <img src={isSoundsPlay ? soundRed : soundWhite} alt="" className={styles.soundImg} />
    </button>
  )
}