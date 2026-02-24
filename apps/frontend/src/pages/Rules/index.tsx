import { type FC } from 'react';
import styles from './style/rulesStyle.module.scss';
import rulesIcon from '../../../public/icons/rulesIcon.svg';
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
          Много
        </Typography>
        <Typography className={styles.subtitle} as="h2">
          Очень много
        </Typography>
        <Typography className={styles.rulesText}>
          Здесь будут правила. <br /> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Integer posuere erat a ante. Здесь будут правила. <br /> Lorem ipsum dolor sit amet,
          consectetur adipiscing elit. Integer posuere erat a ante. Здесь будут правила. <br />{' '}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.
          Здесь будут правила. <br /> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Integer posuere erat a ante. Здесь будут правила. <br /> Lorem ipsum dolor sit amet,
          consectetur adipiscing elit. Integer posuere erat a ante. Здесь будут правила. <br />{' '}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.
        </Typography>
      </div>
      <div className={styles.rulesIconBlock}>
        <img src={rulesIcon} alt="" className={styles.rulesIcon} />
      </div>
    </Container>
  );
};
