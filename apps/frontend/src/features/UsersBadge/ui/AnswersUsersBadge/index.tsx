import clsx from 'clsx';
import { type FC } from 'react';
import type { Player } from '../../../../entities/user/model/types';
import { UserBadge } from '../../../../entities/user/ui/UserBadge';
import { Typography } from '../../../../shared/ui/Typography';
import styles from '../../style/usersBadgeStyle.module.scss';

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
export const AnswersUserBadge: FC = () => {
  return (
    <div className={clsx(styles.content, styles.answersContent)}>
      {testUsers.map((user: Player) => (
        <div key={user.id} className={styles.playerBlock}>
          <UserBadge id={user.id} photo={user.photo} name={user.name} isBelieve={user.isBelieve} />
          <Typography className={user.isBelieve ? styles.believeText : ''}>
            {user.isBelieve ? 'Верит' : 'Не верит'}
          </Typography>
        </div>
      ))}
    </div>
  );
};
