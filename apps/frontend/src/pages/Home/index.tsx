import { useEffect, type FC } from 'react';
import styles from './style/homeStyle.module.scss';
import homeCircle from '../../../public/icons/homeCircle.svg';
import { SettingIcon } from '../../shared/ui/SettingIcon';
import homeLogo from '../../../public/icons/homeIcon-lzhets.svg';
import { Button } from '../../shared/ui/Button';
import bgIcon from '../../../public/icons/homeIcon-bg.svg';
import { Container } from '../../shared/ui/Container';
import { Link } from '../../shared/ui/Link';
import rulesIcon from '../../shared/ui/icons/rulesIcon.svg';
import profileIcon from '../../shared/ui/icons/profileIcon.svg';
import { PageRoutes } from '../../app/routes/pages';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../shared/services/auth/auth.service';
import { getUser } from '../../shared/services/user/api/getUser.api';
import axios from 'axios';
import { userService } from '../../shared/services/user/user.service';
import { updateUser } from '../../shared/services/user/api/updateUser.api';

/**
 * Главная страница, при открытии приложения показывается именно она
 */
export const Home: FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <img className={styles.circleIcon} src={homeCircle} alt="" />
      <SettingIcon className={styles.settingsBtn} />
      <img src={homeLogo} alt="" className={styles.logo} />
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
      <div className={styles.bgBlock}>
        <img src={bgIcon} alt="" className={styles.bgImage} />
        <Link icon={profileIcon} route={`/${PageRoutes.PROFILE}`} className={styles.profileLink} />
        <Link icon={rulesIcon} route={`/${PageRoutes.RULES}`} className={styles.rulesLink} />
      </div>
    </Container>
  );
};
