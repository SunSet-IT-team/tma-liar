import { FC, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "../../../shared/range/Range";
import { setSoundsChange } from "../../../store/appSlice";
import soundRed from '../../../assets/icons/soundRed.svg'
import soundWhite from '../../../assets/icons/soundWhite.svg'
import styles from '../style/settingsSoundsStyle.module.scss'

export const SettingsTouches: FC = () => {
  // Получаем активность звуков из redux
  const isSounds = useSelector((state: AppState) => state.appSlice.sounds);
  const [isSoundsPlay, setIsSoundsPlay] = useState<boolean>(isSounds)

  const dispatch = useDispatch();

  useEffect(() => {
    // Изменяем значение sounds в redux на активное
    dispatch(setSoundsChange(isSoundsPlay))
  }, [isSoundsPlay])
  return (
    <button onClick={() => setIsSoundsPlay(!isSoundsPlay)}>
      <img src={isSoundsPlay ? soundRed : soundWhite} alt="" className={styles.soundImg} />
    </button>
  )
}