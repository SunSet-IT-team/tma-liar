import { useState, type FC } from 'react';
import { Button } from '../../shared/ui/Button';
import styles from './style/createLobbyStyle.module.scss';
import lobbyCircle from '../../../public/icons/lobbyCircle.svg';
import { Header } from '../../widgets/Header';
import { ChoiceParamsLobby } from '../../widgets/ChoiceParamsLobby';
import { Typography } from '../../shared/ui/Typography';
import { Container } from '../../shared/ui/Container';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../app/routes/pages';
import { useAppDispatch } from '../../app/store/hook';
import { startTimer } from '../../entities/game/model/timerSlice';
import { LobbyDeck } from '../../widgets/LobbyDeck';

/**
 * Экран создания лобби
 */
export const CreateLobby: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeValue, setActiveValue] = useState<number>(20);

  const createLobby = () => {
    dispatch(startTimer(activeValue));

    navigate(`/${PageRoutes.LOBBY_ADMIN}`);
  };

  return (
    <Container className={styles.container}>
      <Header />
      <Typography variant="titleLarge" as="h1" className={styles.lobbyTitle}>
        Лобби
      </Typography>
      <ChoiceParamsLobby
        reusedValues={{ min: 10, max: 200, step: 5, defaultValue: 30 }}
        choiceText="Кол-во вопросов"
        choiceType="В"
      />
      <ChoiceParamsLobby
        reusedValues={{ min: 5, max: 60, step: 5, defaultValue: activeValue }}
        choiceText="Таймер"
        choiceType="С"
        onChangeValue={(value: number) => setActiveValue(value)}
      />
      <LobbyDeck />
      <Button variant="buttonUnderline" onClick={createLobby}>
        Создать
      </Button>
      <img src={lobbyCircle} alt="" className={styles.lobbyCircle} />
    </Container>
  );
};
