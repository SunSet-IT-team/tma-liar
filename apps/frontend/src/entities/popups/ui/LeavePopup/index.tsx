import clsx from 'clsx';
import { type FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../../app/store/hook';
import { lobbySessionService } from '../../../../shared/services/lobby/lobby-session.service';
import { leaveLobbyBySocket } from '../../../../shared/services/socket/lobby.socket';
import { Button } from '../../../../shared/ui/Button';
import { Popup } from '../../../../shared/ui/Popup';
import { Typography } from '../../../../shared/ui/Typography';
import { resetTimer } from '../../../game/model/timerSlice';
import styles from '../../style/popupsStyle.module.scss';

/**
 * Варианты стиля попапа
 */
export type PopupStyle = 'white' | 'red';

type LeavePopupProps = {
  popupStyle?: PopupStyle;
  /**
   * Изменение показа попапа
   */
  changeShow: (show: boolean) => void;
};

/**
 * Попап выхода из лобби
 */
export const LeavePopup: FC<LeavePopupProps> = ({ popupStyle = 'red', changeShow }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const leaveGame = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    setLeaveError(null);
    const session = lobbySessionService.get();

    try {
      if (session) {
        await leaveLobbyBySocket({
          lobbyCode: session.lobbyCode,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'LEAVE_LOBBY_ERROR';
      setLeaveError(`Ошибка выхода (${message}). Повторите попытку.`);
      setIsLeaving(false);
      return;
    }

    lobbySessionService.clear();
    setTimeout(() => {
      dispatch(resetTimer());
    }, 0);

    navigate('/', { replace: true });
  };

  return (
    <Popup changeShow={changeShow} className={clsx(styles.leavePopupContent, styles[popupStyle])}>
      <Typography className={styles.leaveText}>уверенно покинуть</Typography>
      <Typography className={clsx(styles.title, styles.leaveTitle)} variant="titleLarge">
        лобби?
      </Typography>
      <div className={styles.leaveBtnsWrapper}>
        <div className={styles.leaveBtns}>
          <Button onClick={leaveGame} disabled={isLeaving}>
            {isLeaving ? 'Выход...' : 'Да'}
          </Button>
          <Button onClick={() => changeShow(false)} disabled={isLeaving}>
            Нет
          </Button>
        </div>
        {leaveError ? <Typography>{leaveError}</Typography> : null}
      </div>
    </Popup>
  );
};
