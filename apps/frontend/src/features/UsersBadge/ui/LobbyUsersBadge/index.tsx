import clsx from 'clsx';
import { type FC } from 'react';
import { UserBadge } from '../../../../entities/user/ui/UserBadge';
import { Typography } from '../../../../shared/ui/Typography';
import styles from '../../style/usersBadgeStyle.module.scss';

type UsersProps = {
  className?: string;
  playersClassName?: string;
  players?: Array<{
    id: string;
    nickname: string;
    profileImg?: string;
    isReady?: boolean;
    loserTask?: string | null;
  }>;
  currentUserId?: string;
};

const fallbackUsers = [
  {
    id: '1',
    profileImg: '',
    nickname: 'Игрок 1',
    isReady: false,
    loserTask: null,
  },
  {
    id: '2',
    profileImg: '',
    nickname: 'Игрок 2',
    isReady: false,
    loserTask: null,
  },
];

/**
 * Получаем подключившихся игроков в лобби
 */
export const LobbyUsersBadge: FC<UsersProps> = ({
  className,
  playersClassName,
  players,
  currentUserId,
}) => {
  const source = players && players.length > 0 ? players : fallbackUsers;

  return (
    <div className={clsx(styles.content, styles.lobbyContent, playersClassName)}>
      {source.map((user, index) => {
        const numericId = Number(user.id);

        return (
          <div key={user.id} className={clsx(styles.userCard, styles.userContent, className)}>
            <UserBadge
              id={Number.isNaN(numericId) ? index + 1 : numericId}
              photo={user.profileImg}
              name={user.nickname}
              currentPlayer={currentUserId === user.id}
            />
            <Typography className={clsx(styles.statusText, user.isReady && styles.readyText)}>
              {user.isReady ? 'Готов' : 'Не готов'}
            </Typography>
            {user.loserTask ? <Typography className={styles.taskText}>{user.loserTask}</Typography> : null}
          </div>
        );
      })}
    </div>
  );
};
