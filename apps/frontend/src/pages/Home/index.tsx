import { type FC } from 'react';
import styles from './style/homeStyle.module.scss';
import { SettingIcon } from '../../shared/ui/SettingIcon';
import { Button } from '../../shared/ui/Button';
import { Container } from '../../shared/ui/Container';
import { Link } from '../../shared/ui/Link';
import rulesIcon from '../../shared/ui/icons/rulesIcon.svg';
import profileIcon from '../../shared/ui/icons/profileIcon.svg';
import { PageRoutes } from '../../app/routes/pages';
import { useNavigate } from 'react-router-dom';

/**
 * Главная страница, при открытии приложения показывается именно она
 */
export const Home: FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <div className={styles.circleIcon} data-decor="true" />
      <SettingIcon className={styles.settingsBtn} />
      <div className={styles.logo} />
      <Button
        variant="buttonUnderline"
        className={styles.homeBtn}
        onClick={() => navigate(`/${PageRoutes.CREATE_LOBBY}`)}
      >
        Создать
      </Button>
      <Button className={styles.homeBtn} onClick={() => navigate(`/${PageRoutes.CONNECT_LOBBY}`)}>
        Присоедениться
      </Button>
      <div className={styles.bgBlock} data-decor="true">
        <Link icon={profileIcon} route={`/${PageRoutes.PROFILE}`} className={styles.profileLink} />
        <Link icon={rulesIcon} route={`/${PageRoutes.RULES}`} className={styles.rulesLink} />
      </div>
    </Container>
  );
};
