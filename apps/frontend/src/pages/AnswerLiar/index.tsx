import { type FC, useEffect, useMemo } from 'react';
import { GameProcess } from '../../features/GameProcess';
import { Container } from '../../shared/ui/Container';
import { Timer } from '../../shared/ui/Timer';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/answerLiarStyle.module.scss';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../app/routes/pages';
import { getCurrentTmaUser } from '../../shared/lib/tma/user';

/**
 * Экран с вопросом для лжеца
 */
export const AnswerLiar: FC = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentTmaUser(), []);
  const session = lobbySessionService.get();
  const questionText = session?.currentQuestionText ?? 'Ожидаем вопрос...';
  const isLiar = session?.currentLiarId === user.telegramId;

  useEffect(() => {
    if (!session?.currentStage) return;

    if (session.currentStage === 'liar_chooses') {
      navigate(`/${isLiar ? PageRoutes.CHOOSING_LIAR : PageRoutes.WAITING_PLAYERS}`, { replace: true });
      return;
    }

    if (!isLiar && session.currentStage === 'question_to_liar') {
      navigate(`/${PageRoutes.ANSWER_SOLVED}`, { replace: true });
    }
  }, [isLiar, navigate, session?.currentStage]);

  return (
    <Container>
      <Header className={styles.header} inGame />
      <div className={styles.content}>
        <Typography variant="titleLarge" as="h1" className={styles.title}>
          Вопрос
          <Typography as="span" className={styles.titleItem} variant="titleLarge">
            ,
          </Typography>
        </Typography>
        <Typography>{questionText}</Typography>
      </div>
      <GameProcess />
      <Timer />
    </Container>
  );
};
