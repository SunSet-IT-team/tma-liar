import clsx from 'clsx'
import { FC } from 'react'
import { Button } from '../../../../shared/ui/Button'
import { Popup } from "../../../../shared/ui/popup"
import { Typography } from "../../../../shared/ui/Typography"
import styles from '../../style/popupsStyle.module.scss'

/** 
 * Варианты стиля попапа
*/
type PopupStyle = | 'white' | 'red'

type LeavePopupProps = {
  popupStyle?: PopupStyle;
  changeShow: (show: boolean) => void
}

/** 
 * Попап выхода из лобби
*/
export const LeavePopup: FC<LeavePopupProps> = ({ popupStyle = 'white', changeShow }) => {
  return (
    <Popup changeShow={changeShow} className={clsx(styles.leavePopupContent, styles[popupStyle])}>
      <Typography className={styles.leaveText}>уверенно покинуть</Typography>
      <Typography className={clsx(styles.title, styles.leaveTitle)} variant='titleLarge'>лобби?</Typography>
      <div className={styles.leaveBtns}>
        <Button>Да</Button>
        <Button>Нет</Button>
      </div>
    </Popup>
  )
}