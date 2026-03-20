import clsx from 'clsx';
import type { FC } from 'react';
import { UserBadge } from '@entities/user';
import { Typography } from '@shared/ui/Typography';
import { lobbySessionService } from '@shared/services/lobby/lobby-session.service';
import { getCurrentUser, getCurrentUserId } from '@shared/lib/tma/user';
import styles from '@features/UsersBadge/style/usersBadgeStyle.module.scss';

type UsersProps = {
  className?: string;
  playersClassName?: string;
  players?: Array<{
    id: string;
    nickname: string;
    profileImg?: string;
    score?: number;
  }>;
  currentUserId?: string;
};

/**
 * Список игроков с очками.
 * Используется только на странице `EndGame`, чтобы `UserBadge` оставался общим компонентом.
 */
export const EndGameUsersBadgeWithPoints: FC<UsersProps> = ({
  className,
  playersClassName,
  players,
  currentUserId,
}) => {
  const session = lobbySessionService.get();
  const me = getCurrentUser();
  const resolvedCurrentUserId = currentUserId ?? getCurrentUserId(me);

  const source = players && players.length > 0 ? players : (session?.gamePlayers ?? []);
  const sortedUsers = [...source].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div
      className={clsx(styles.content, styles.lobbyContent, playersClassName)}
      data-relative="true"
    >
      {sortedUsers.map((user, index) => {
        const numericId = Number(user.id);
        const id = Number.isNaN(numericId) ? index + 1 : numericId;

        return (
          <div key={user.id} className={clsx(styles.userCard, styles.userContent, className)}>
            <UserBadge
              id={id}
              photo={user.profileImg}
              name={user.nickname}
              currentPlayer={resolvedCurrentUserId === user.id}
            />
            <Typography className={styles.statusText}>{user.score ?? 0} очков</Typography>
          </div>
        );
      })}
    </div>
  );
};
