import { type FC, useState } from 'react';
import styles from '../../style/usersBadgeStyle.module.scss';
import type { Player } from '../../../../entities/user/model/types';
import { UserBadge } from '../../../../entities/user/ui/UserBadge';
import clsx from 'clsx';
import { Checkbox } from '../../../../shared/ui/Checkbox';

const testUsers = [
  {
    id: 1,
    photo: '',
    name: 'Бешеный Татар',
    isRated: false,
  },
  {
    id: 2,
    photo: '',
    name: 'Лысый Татар',
    isRated: false,
  },
  {
    id: 3,
    photo: '',
    name: 'Крутой Татар',
    isRated: false,
  },
  {
    id: 4,
    photo: '',
    name: 'Бешеный Татар',
    isRated: false,
  },
  {
    id: 5,
    photo: '',
    name: 'Бешеный Татар',
    isRated: false,
  },
  {
    id: 6,
    photo: '',
    name: 'Лысый Татар',
    isRated: false,
  },
];

/**
 * Получаем оценки игроков
 */
export const RateUsersBadge: FC = () => {
  const [rated, setRated] = useState<boolean>(false);

  return (
    <div className={clsx(styles.content, styles.answersContent, styles.limitedBlock, styles.ratePlayers)}>
      {testUsers.map((user: Player) => (
        <div className={styles.playerBlock} key={user.id}>
          <UserBadge
            id={user.id}
            photo={user.photo}
            name={user.name}
            className={styles.userContent}
            isRated={user.isRated}
          />
          <Checkbox onChange={(value: boolean) => setRated(value)} />
        </div>
      ))}
    </div>
  );
};
