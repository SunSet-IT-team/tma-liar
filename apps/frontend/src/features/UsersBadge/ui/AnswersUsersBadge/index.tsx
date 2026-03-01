import clsx from 'clsx';
import type { FC } from 'react';
import type { Player } from '../../../../entities/user/model/types';
import { UserBadge } from '../../../../entities/user/ui/UserBadge';
import { Typography } from '../../../../shared/ui/Typography';
import styles from '../../style/usersBadgeStyle.module.scss';

type Props = {
  className?: string;
  players?: Array<{
    id: string;
    nickname: string;
    profileImg?: string;
    answer?: number | null;
  }>;
};

/**
 * Получаем ответы игроков
 */

const testUsers = [
  {
    id: 1,
    photo: '',
    name: 'Бешеный Татар',
    isBelieve: true,
  },
  {
    id: 2,
    photo: '',
    name: 'Лысый Татар',
    isBelieve: false,
  },
  {
    id: 3,
    photo: '',
    name: 'Крутой Татар',
    isBelieve: false,
  },
  {
    id: 4,
    photo: '',
    name: 'Бешеный Татар',
    isBelieve: true,
  },
  {
    id: 5,
    photo: '',
    name: 'Бешеный Татар',
    isBelieve: false,
  },
  {
    id: 6,
    photo: '',
    name: 'Лысый Татар',
    isBelieve: true,
  },
];

/**
 * Получаем ответы игроков
 */
export const AnswersUserBadge: FC<Props> = ({ className, players }) => {
  const source =
    players && players.length > 0
      ? players.map((player) => ({
          id: Number(player.id) || 0,
          photo: player.profileImg ?? '',
          name: player.nickname,
          isBelieve: player.answer === 1,
          answer: player.answer,
        }))
      : testUsers;

  const resolveAnswerText = (answer?: number | null, isBelieve?: boolean) => {
    if (answer === 1) return 'Верит';
    if (answer === 0) return 'Не верит';
    if (answer === 2 || answer === null || answer === undefined) return 'Не определился';
    return isBelieve ? 'Верит' : 'Не верит';
  };

  return (
    <div className={clsx(styles.content, styles.answersContent, className)}>
      {source.map((user: Player & { answer?: number | null }) => (
        <div key={user.id} className={styles.playerBlock}>
          <UserBadge id={user.id} photo={user.photo} name={user.name} isBelieve={user.isBelieve} />
          <Typography className={user.answer === 1 ? styles.believeText : ''}>
            {resolveAnswerText(user.answer, user.isBelieve)}
          </Typography>
        </div>
      ))}
    </div>
  );
};
