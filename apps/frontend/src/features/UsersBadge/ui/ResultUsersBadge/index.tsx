import { FC, useEffect, useState } from "react"
import styles from '../../style/usersBadgeStyle.module.scss'
import type { Player, PlayerSize } from "../../../../entities/user/model/types";
import { UserBadge } from "../../../../entities/user/ui/UserBadge";
import clsx from "clsx";
import { Typography } from "../../../../shared/ui/Typography";
import type { TypographyVariant } from "../../../../shared/ui/Typography";
import { RESULT_ANIMATION_CONFIG } from "../../config/resultAnimationConfig";
import drumSound from "../../../../shared/assets/sounds/drumroll.mp3";
import { Button } from "../../../../shared/ui/Button";

/** 
 * Отображение мест игроков с анимацией
*/
export const ResultUsersBadge: FC<{ onRevealTask: (task: string) => void }> = ({ onRevealTask }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [task, setTask] = useState<string>("Здесь будет задание...");
  const testUsers = [
    {
      id: 1,
      photo: '',
      name: 'Бешеный Татар',
      points: 300,
      currentPlayer: false,
      task: 'Вылизываем кота'
    },
    {
      id: 2,
      photo: '',
      name: 'Лысый Татар',
      points: 150,
      currentPlayer: false,
      task: 'Пустить бутерброд по кругу'
    },
    {
      id: 3,
      photo: '',
      name: 'Крутой Татар',
      points: 270,
      currentPlayer: false,
      task: 'Съесть носок друга'
    },
    {
      id: 4,
      photo: '',
      name: 'Бешеный Татар',
      points: 130,
      currentPlayer: false,
      task: 'Пустить бутерброд по кругу'
    },
    {
      id: 5,
      photo: '',
      name: 'Бешеный Татар',
      points: 450,
      currentPlayer: false,
      task: 'Вылизываем кота'
    },
    {
      id: 6,
      photo: '',
      name: 'Лысый Татар',
      points: 90,
      currentPlayer: true,
      task: 'Съесть носок друга'
    },
    {
      id: 7,
      photo: '',
      name: 'Бешеный Татар',
      points: 140,
      currentPlayer: false,
      task: 'Вылизываем кота'
    },
    {
      id: 8,
      photo: '',
      name: 'Лысый Татар',
      points: 420,
      currentPlayer: false,
      task: 'Пустить бутерброд по кругу'
    },
  ]

  const sortedUsers = [...testUsers].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

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

    const audio = new Audio(drumSound);

    const showNext = (index: number) => {
      if (index >= sortedUsers.length) {
        // все места показаны → отдаем задание 1-го места
        setTask(sortedUsers[0].task);
        setFinished(true);
        return;
      }

      // запуск барабанной дроби
      audio.currentTime = 0;
      audio.play();

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

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={clsx(styles.content, styles.answersContent, styles.resultsContent)}>
      {sortedUsers.map((user: Player, index) => (
        <div 
          className={clsx(
            styles.playerBlock, 
            styles.resultsBlock, 
            index < visibleCount && styles.show   // класс для анимации
          )} 
          key={user.id}
        >
          <Typography className={styles.resultPlace} variant={getTypographyVariant(index)}>{index + 1}</Typography>
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
      {finished && (
        <Button
          variant="buttonUnderline"
          className={styles.resultTask}
        >
          {task}
        </Button>
      )}
    </div>
  )
}