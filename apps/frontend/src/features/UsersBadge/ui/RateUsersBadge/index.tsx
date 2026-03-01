import { type FC } from 'react';
import styles from '../../style/usersBadgeStyle.module.scss';
import type { Player } from '../../../../entities/user/model/types';
import { UserBadge } from '../../../../entities/user/ui/UserBadge';
import clsx from 'clsx';
import { Checkbox } from '../../../../shared/ui/Checkbox';

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
  onToggle?: (playerId: string, checked: boolean) => void;
}> = ({ players, selectedIds = [], onToggle }) => {
  const source = (players ?? []).map((player, index) => ({
    id: Number.isFinite(Number(player.id)) && Number(player.id) > 0 ? Number(player.id) : index + 1,
    rawId: player.id,
    photo: player.profileImg ?? '',
    name: player.nickname,
    isRated: selectedIds.includes(player.id),
  }));

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
            onChange={(checked) => {
              onToggle?.(user.rawId, checked);
            }}
          />
        </div>
      ))}
      {source.length === 0 ? <div className={styles.playerBlock}>Нет доступных игроков для оценки</div> : null}
    </div>
  );
};
