import { type FC, useEffect, useRef, useState } from 'react';
import styles from '../../style/usersBadgeStyle.module.scss';
import type { Player, PlayerSize } from '../../../../entities/user/model/types';
import { UserBadge } from '../../../../entities/user/ui/UserBadge';
import clsx from 'clsx';
import { Typography } from '../../../../shared/ui/Typography';
import type { TypographyVariant } from '../../../../shared/ui/Typography';
import { RESULT_ANIMATION_CONFIG } from '../../config/resultAnimationConfig';
import drumSound from '../../../../shared/assets/sounds/drumroll.mp3';
import { Button } from '../../../../shared/ui/Button';
import { lobbySessionService } from '../../../../shared/services/lobby/lobby-session.service';
import { getCurrentTmaUser } from '../../../../shared/lib/tma/user';

/**
 * Отображение мест игроков с анимацией
 */
export const ResultUsersBadge: FC = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [task, setTask] = useState<string>('Здесь будет задание...');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const session = lobbySessionService.get();
  const me = getCurrentTmaUser();

  const sortedUsers =
    session?.gamePlayers && session.gamePlayers.length > 0
      ? [...session.gamePlayers]
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .map((player, index) => ({
            id: Number.isFinite(Number(player.id)) && Number(player.id) > 0 ? Number(player.id) : index + 1,
            keyId: player.id,
            photo: player.profileImg ?? '',
            name: player.nickname,
            points: player.score ?? 0,
            currentPlayer: player.id === me.telegramId,
            task: player.loserTask ?? '',
          }))
      : [];

  const getSizeByPlace = (index: number): PlayerSize => {
    if (index === 0) return 'large';
    if (index === 1) return 'medium';
    return 'default';
  };

  const getTypographyVariant = (index: number): TypographyVariant => {
    if (index === 0) return 'titleLarge';
    if (index === 1) return 'titleMedium';
    if (index === 2) return 'body';
    return 'caption';
  };

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    audioRef.current = new Audio(drumSound);
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => undefined);

    const showNext = (index: number) => {
      if (index >= sortedUsers.length || sortedUsers.length === 0) {
        // все места показаны → отдаем задание 1-го места
        setTask(session?.currentLoserTask ?? sortedUsers[0]?.task ?? 'Задание не задано');
        setFinished(true);
        return;
      }

      // показываем текущий элемент
      setVisibleCount(index + 1);

      // задержка перед (пред)последним элементом
      const isBeforeLast = index === sortedUsers.length - 3;

      const delay = isBeforeLast
        ? RESULT_ANIMATION_CONFIG.lastPlaceDelay
        : RESULT_ANIMATION_CONFIG.betweenPlacesDelay;

      timeout = setTimeout(() => {
        showNext(index + 1);
      }, delay);
    };

    // стартуем цепочку
    showNext(0);

    return () => {
      clearTimeout(timeout);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className={clsx(styles.content, styles.answersContent, styles.resultsContent)}>
      <div className={clsx(styles.resultPlayers, styles.limitedBlock)}>
        {sortedUsers.map((user: Player & { keyId?: string }, index) => (
          <div
            className={clsx(
              styles.playerBlock,
              styles.resultsBlock,
              index < visibleCount && styles.show, // класс для анимации
            )}
            key={user.keyId ?? String(user.id)}
          >
            <Typography className={styles.resultPlace} variant={getTypographyVariant(index)}>
              {index + 1}
            </Typography>
            <UserBadge
              id={user.id}
              photo={user.photo}
              name={user.name}
              variant={getSizeByPlace(index)}
              points={user.points}
              currentPlayer={user.currentPlayer}
            />
          </div>
        ))}
      </div>
      {finished && (
        <Button variant="buttonUnderline" className={styles.resultTask}>
          {task}
        </Button>
      )}
    </div>
  );
};
