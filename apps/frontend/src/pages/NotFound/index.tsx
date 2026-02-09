import { type FC } from 'react';
import styles from './style/notFoundStyle.module.scss';
import notFoundIcon from '../../../public/icons/notFoundIcon.svg';
import { Header } from '../../widgets/Header';
import { Container } from '../../shared/ui/Container';
import { Typography } from '../../shared/ui/Typography';

/**
 * Экран 404, он будет показываться когда пользователь попадет на несуществующий путь (route)
 */
export const NotFound: FC = () => {
  return (
    <Container className={styles.container}>
      <Header variantArrow="white" variantSettings="white" />
      <div className={styles.errorBlock}>
        <Typography variant="titleLarge" className={styles.title} as="h1">
          404
        </Typography>
        <Typography className={styles.errorText}>Досадная ошибка</Typography>
      </div>
      <div className={styles.notFoundBlock}>
        <Typography className={styles.notFoundText}>
          Ну а <br /> я что ?
        </Typography>
        <img className={styles.notFoundIcon} src={notFoundIcon} alt="" />
        <div className={styles.emptyBlock}></div>
      </div>
    </Container>
  );
};
