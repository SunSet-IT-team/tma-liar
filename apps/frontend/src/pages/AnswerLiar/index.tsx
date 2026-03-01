import { type FC } from 'react';
import { GameProcess } from '../../features/GameProcess';
import { Container } from '../../shared/ui/Container';
import { Timer } from '../../shared/ui/Timer';
import { Typography } from '../../shared/ui/Typography';
import { Header } from '../../widgets/Header';
import styles from './style/answerLiarStyle.module.scss';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';

/**
 * Экран с вопросом для лжеца
 */
export const AnswerLiar: FC = () => {
  const session = lobbySessionService.get();
  const questionText = session?.currentQuestionText ?? 'Ожидаем вопрос...';

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
