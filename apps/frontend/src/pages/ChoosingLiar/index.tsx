import { type FC } from 'react';
import { Button } from '../../shared/ui/Button';
import { Timer } from '../../shared/ui/Timer';
import styles from './style/choosingLiarStyle.module.scss';
import { Typography } from '../../shared/ui/Typography';
import { Container } from '../../shared/ui/Container';
import { GameProcess } from '../../features/GameProcess';
import { useChooseLiar } from '@features/ChooseLiar';
import { useLiarQuestion } from '@features/LiarQuestion';

/**
 * Страница с выбором вранья лжеца
 */
export const ChoosingLiar: FC = () => {
  const { questionText } = useLiarQuestion();
  const { isSubmitting, errorText, chooseStrategy } = useChooseLiar();

  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <div className={styles.questionBlock}>
          <Typography variant="text" as="h2" className={styles.questionTitle}>
            Вопрос
            <Typography as="span" className={styles.questionTitleAccent} variant="caption">
              ,
            </Typography>
          </Typography>
          <Typography className={styles.questionText} variant="text">
            {questionText}
          </Typography>
        </div>
        <Typography className={styles.title} variant="titleMedium" as="h1">
          Будешь врать?
        </Typography>
        <div className={styles.choosingBtns}>
          <Button onClick={() => void chooseStrategy(true)} disabled={isSubmitting}>
            Да
          </Button>
          <Button onClick={() => void chooseStrategy(false)} disabled={isSubmitting}>
            Нет
          </Button>
        </div>
        {errorText ? <Typography>{errorText}</Typography> : null}
      </div>
      <GameProcess />
      <Timer />
    </Container>
  );
};
