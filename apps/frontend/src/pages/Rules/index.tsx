import { type FC } from 'react';
import styles from './style/rulesStyle.module.scss';
import rulesIcon from '/icons/rulesIcon.svg';
import { Header } from '../../widgets/Header';
import { Container } from '../../shared/ui/Container';
import { Typography } from '../../shared/ui/Typography';

/**
 * Страница с правилами игры
 */
export const Rules: FC = () => {
  return (
    <Container className={styles.container}>
      <Header variantSettings="white" className={styles.header} />
      <div className={styles.content}>
        <Typography variant="titleLarge" as="h1">
          Правила
        </Typography>
        <Typography className={styles.subtitle} as="h2">
          Как играть в «Лжеца»
        </Typography>
        <div className={styles.rulesText}>
          <section className={styles.section}>
            <Typography as="p" className={styles.paragraph}>
              Вычисляй корыстного лжеца или сам будь легендарным вруншикой. Убеди как можно больше
              людей верить тебе, отвечая на вопросы. Но будь осторожен: самого доверчивого ждёт
              наказание, а какое именно решают друзья.
            </Typography>
          </section>

          <section className={styles.section}>
            <Typography as="h3" variant="text" className={styles.sectionTitle}>
              Основной цикл игры
            </Typography>
            <ol className={styles.list}>
              <li>Админ создаёт лобби, остальные игроки подключаются по коду.</li>
              <li>Перед стартом каждый игрок вводит задание для проигравшего.</li>
              <li>Игра состоит из раундов по вопросам выбранной колоды.</li>
              <li>
                В каждом раунде выбирается один лжец. Он решает, будет врать или говорить правду.
              </li>
              <li>
                Лжец отвечает на вопрос, а остальные игроки пытаются определить, врёт он или нет.
              </li>
              <li>Каждый решала фиксирует ответ: «верю» или «не верю».</li>
              <li>После ответа можно поставить лайк игрокам за сильную игру.</li>
              <li>Раунды повторяются, пока не закончатся вопросы.</li>
              <li>В конце строится рейтинг по очкам.</li>
              <li>Игрок на последнем месте получает задание от игрока на первом месте.</li>
            </ol>
          </section>

          <section className={styles.section}>
            <Typography as="h3" variant="text" className={styles.sectionTitle}>
              Термины
            </Typography>
            <ul className={styles.list}>
              <li>
                <strong>Лобби</strong> - комната для одной партии, от 3 до 10 игроков.
              </li>
              <li>
                <strong>Лжец</strong> - игрок, который отвечает на вопрос в текущем раунде.
              </li>
              <li>
                <strong>Решалы</strong> - все остальные игроки, которые определяют, врёт лжец или
                нет.
              </li>
              <li>
                <strong>Колода</strong> - набор вопросов определённой тематики.
              </li>
              <li>
                <strong>Сессия</strong> - полная игра от первого вопроса до итогового рейтинга.
              </li>
              <li>
                <strong>Лайк</strong> - благодарность игроку за раунд.
              </li>
              <li>
                <strong>Наказание</strong> - задание, которое выполняет проигравший.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <Typography as="h3" variant="text" className={styles.sectionTitle}>
              Как начисляются очки
            </Typography>
            <ul className={styles.list}>
              <li>Лжец получает 100 очков за каждого, кого обманул.</li>
              <li>Лжец получает 50 очков за каждого, кто не дал чёткий ответ.</li>
              <li>Решала получает 200 очков, если правильно определил ложь или правду.</li>
              <li>Каждый полученный лайк даёт игроку 10 очков.</li>
            </ul>
            <Typography as="p" className={styles.paragraph}>
              До конца матча очки и места скрыты. Итоговая таблица открывается только на финальном
              экране.
            </Typography>
          </section>

          <section className={styles.section}>
            <Typography as="h3" variant="text" className={styles.sectionTitle}>
              Колоды и вопросы
            </Typography>
            <Typography as="p" className={styles.paragraph}>
              Вопросы выбираются случайно из ещё не использованных в лобби. Когда все вопросы в
              выбранной колоде заканчиваются, список автоматически сбрасывается и колода снова
              становится полной.
            </Typography>
            <Typography as="p" className={styles.paragraph}>
              Посещённые вопросы хранятся на уровне лобби, пока лобби существует. Это позволяет
              играть несколько сессий подряд с меньшим количеством повторов.
            </Typography>
          </section>

          <section className={styles.section}>
            <Typography as="h3" variant="text" className={styles.sectionTitle}>
              Как выбирается лжец
            </Typography>
            <ul className={styles.list}>
              <li>Для каждого игрока в лобби хранится число раундов, где он уже был лжецом.</li>
              <li>Следующим лжецом выбирается игрок с минимальным значением этого счётчика.</li>
              <li>Если таких игроков несколько, система выбирает случайно одного из них.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <Typography as="h3" variant="text" className={styles.sectionTitle}>
              Примеры
            </Typography>
            <ul className={styles.list}>
              <li>Пример задания: «Выложи в историю в MAX третью фотографию из галереи».</li>
              <li>Пример вопроса: «Расскажи о своём первом поцелуе».</li>
            </ul>
          </section>
        </div>
      </div>
      <div className={styles.rulesIconBlock}>
        <img src={rulesIcon} alt="" className={styles.rulesIcon} />
      </div>
    </Container>
  );
};
