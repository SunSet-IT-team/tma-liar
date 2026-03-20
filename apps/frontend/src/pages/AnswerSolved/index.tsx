import { type FC } from 'react';
import { UserBadge } from '../../entities/user/ui/UserBadge';
import { GameProcess } from '../../features/GameProcess';
import { Container } from '../../shared/ui/Container';
import { Timer } from '../../shared/ui/Timer';
import { Typography } from '../../shared/ui/Typography';
import { AnswerSolvedBlock } from '../../widgets/AnswerSolvedBlock';
import { Header } from '../../widgets/Header';
import styles from './style/answerSolvedStyle.module.scss';
import { useSolverAnswer } from '@features/SolverAnswer';

/**
 * Экран с вариантами ответов для решало
 */
export const AnswerSolved: FC = () => {
  const { liarPlayer, believe, fixed, isSubmitting, errorText, sendVote, secureVote, session } =
    useSolverAnswer();
  const liarNumericId = liarPlayer?.id ? Number(liarPlayer.id) : Number.NaN;
  const liarName = liarPlayer?.nickname ?? 'Игрок';
  const liarPhoto = liarPlayer?.profileImg ?? '';
  const questionText = session?.currentQuestionText ?? 'Ожидаем вопрос...';

  return (
    <Container>
      <Header className={styles.header} inGame />
      <div className={styles.content} data-relative="true">
        <Typography as="h1" variant="titleLarge">
          Лжец
          <Typography as="span" variant="titleLarge" className={styles.titleItem}>
            ?
          </Typography>
        </Typography>
        <UserBadge
          id={Number.isNaN(liarNumericId) ? 1 : liarNumericId}
          name={liarName}
          photo={liarPhoto}
          className={styles.liarPlayer}
        />
        <Typography className={styles.questionLiar}>{questionText}</Typography>
      </div>
      <AnswerSolvedBlock
        believe={believe}
        fixed={fixed}
        onSelectBelieve={sendVote}
        onFix={secureVote}
        disabled={isSubmitting}
      />
      {errorText ? <Typography>{errorText}</Typography> : null}
      <Timer />
      <GameProcess isFixed={fixed} />
    </Container>
  );
};
