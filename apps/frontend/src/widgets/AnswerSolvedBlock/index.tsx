import clsx from 'clsx';
import { type FC } from 'react';
import { Button } from '../../shared/ui/Button';
import styles from './style/answerSolvedBlockStyle.module.scss';

type SolvedBlockProps = {
  believe: boolean | null;
  fixed: boolean;
  onSelectBelieve: (value: boolean) => void;
  onFix: () => void;
  disabled?: boolean;
};

/**
 * Блок выбора ответа решало
 */
export const AnswerSolvedBlock: FC<SolvedBlockProps> = ({
  believe,
  fixed,
  onSelectBelieve,
  onFix,
  disabled = false,
}) => {
  return (
    <>
      <div className={styles.answersBtns}>
        <Button
          className={clsx(styles.answersBtn, believe === false && styles.answersBtnActive)}
          onClick={() => !fixed && !disabled && onSelectBelieve(false)}
          disabled={disabled}
        >
          Не верю
        </Button>
        <Button
          className={clsx(styles.answersBtn, believe === true && styles.answersBtnActive)}
          onClick={() => !fixed && !disabled && onSelectBelieve(true)}
          disabled={disabled}
        >
          Верю
        </Button>
      </div>
      {believe !== null ? (
        <Button className={styles.fixAnswerBtn} onClick={onFix} disabled={fixed || disabled}>
          {fixed ? 'Ответ зафиксирован' : 'Зафиксировать'}
        </Button>
      ) : null}
    </>
  );
};
