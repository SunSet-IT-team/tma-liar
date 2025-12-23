import clsx from 'clsx'
import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../../../app/store/hook'
import { Button } from '../../../../shared/ui/Button'
import { Popup } from "../../../../shared/ui/Popup"
import { Typography } from "../../../../shared/ui/Typography"
import { resetTimer } from '../../../game/model/timerSlice'
import styles from '../../style/popupsStyle.module.scss'

/** 
 * Варианты стиля попапа
*/
export type PopupStyle = | 'white' | 'red'

type LeavePopupProps = {
  popupStyle?: PopupStyle;
  /** 
   * Изменение показа попапа
  */
  changeShow: (show: boolean) => void
}

/** 
 * Попап выхода из лобби
*/
export const LeavePopup: FC<LeavePopupProps> = ({ popupStyle = 'red', changeShow }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const leaveGame = () => {
    setTimeout(() => {
      dispatch(resetTimer());
    }, 0);

    navigate('/', { replace: true });
  }

  return (
    <Popup changeShow={changeShow} className={clsx(styles.leavePopupContent, styles[popupStyle])}>
      <Typography className={styles.leaveText}>уверенно покинуть</Typography>
      <Typography className={clsx(styles.title, styles.leaveTitle)} variant='titleLarge'>лобби?</Typography>
      <div className={styles.leaveBtns}>
        <Button onClick={leaveGame}>Да</Button>
        <Button onClick={() => changeShow(false)}>Нет</Button>
      </div>
    </Popup>
  )
}