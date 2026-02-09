import { type FC, useEffect } from 'react';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/waitingPlayersStyle.module.scss';
import waitingIcon from '../../../public/icons/waitingIcon.svg';
import waitingCircle from '../../../public/icons/waitingCircle.svg';
import { Container } from '../../shared/ui/Container';
import { useAppDispatch, useAppSelector } from '../../app/store/hook';
import { useLocation, useNavigate } from 'react-router-dom';
import { playTimer, tick, updateTimer } from '../../entities/game/model/timerSlice';

/**
 * Экран показывается решало, когда лжец делает выбор
 */
export const WaitingPlayers: FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === '/waiting-players';

  // Маршрут для следующего перехода
  const nextRoute = location.state?.nextRoute;

  const { tickSeconds, time, isRunning } = useAppSelector((state) => state.timer);

  // тик
  useEffect(() => {
    if (tickSeconds !== null && time > tickSeconds) {
      dispatch(playTimer());
    }
    if (!isRunning) return;
    if (!isActive) return;

    const interval = setInterval(() => {
      dispatch(tick());
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, dispatch]);

  // переход
  useEffect(() => {
    if (tickSeconds === 0 && nextRoute) {
      dispatch(updateTimer());
      navigate(nextRoute);
    }
  }, [tickSeconds, nextRoute, navigate]);

  return (
    <Container className={styles.container}>
      <Header className={styles.header} inGame popupStyle="white" />
      <Typography className={styles.title} variant="titleLarge">
        Ждем!
      </Typography>
      <Typography>Других игроков</Typography>
      <img src={waitingIcon} alt="" className={styles.waitingIcon} />
      <img src={waitingCircle} alt="" className={styles.waitingCircle} />
      <Typography className={styles.waitingText}>Уже скоро?</Typography>
    </Container>
  );
};
