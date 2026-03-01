import { type FC } from 'react';
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
export const RateUsersBadge: FC<{
  players?: Array<{
    id: string;
    nickname: string;
    profileImg?: string;
    isRated?: boolean;
  }>;
  selectedIds?: string[];
  onToggle?: (playerId: string) => void;
}> = ({ players, selectedIds = [], onToggle }) => {
  const source =
    players && players.length > 0
      ? players.map((player) => ({
          id: Number(player.id) || 0,
          rawId: player.id,
          photo: player.profileImg ?? '',
          name: player.nickname,
          isRated: selectedIds.includes(player.id),
        }))
      : testUsers.map((player) => ({ ...player, rawId: String(player.id) }));

  return (
    <div className={clsx(styles.content, styles.answersContent, styles.limitedBlock, styles.ratePlayers)}>
      {source.map((user: Player & { rawId: string }) => (
        <div className={styles.playerBlock} key={user.id}>
          <UserBadge
            id={user.id}
            photo={user.photo}
            name={user.name}
            className={styles.userContent}
            isRated={user.isRated}
          />
          <Checkbox
            checked={Boolean(user.isRated)}
            onChange={() => {
              onToggle?.(user.rawId);
            }}
          />
        </div>
      ))}
    </div>
  );
};
