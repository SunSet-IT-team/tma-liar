import { type FC } from 'react';
import { Button } from '../../shared/ui/Button';
import { Timer } from '../../shared/ui/Timer';
import styles from './style/choosingLiarStyle.module.scss';
import { Typography } from '../../shared/ui/Typography';
import { Container } from '../../shared/ui/Container';
import { GameProcess } from '../../features/GameProcess';
import { PageRoutes } from '../../app/routes/pages';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/store/hook';
import { updateTimer } from '../../entities/game/model/timerSlice';

/**
 * Страница с выбором вранья лжеца
 */
export const ChoosingLiar: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const route = `/${PageRoutes.ANSWER_LIAR}`;
  const choosingLiar = () => {
    dispatch(updateTimer());
    navigate(route);
  };

  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <Typography className={styles.title} variant="titleLarge" as="h1">
          Будешь врать?
        </Typography>
        <div className={styles.choosingBtns}>
          <Button onClick={choosingLiar}>Да</Button>
          <Button onClick={choosingLiar}>нет</Button>
        </div>
      </div>
      <GameProcess route={route} />
      <Timer />
    </Container>
  );
};
