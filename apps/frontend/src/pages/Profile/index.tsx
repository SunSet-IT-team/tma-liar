import { type FC } from 'react';
import styles from './style/profileStyle.module.scss';
import circleIcon from '/icons/profileCircle.svg';
import { TextInput } from '../../shared/ui/TextInput';
import logo from '/icons/homeIcon-lzhets.svg';
import { Header } from '../../widgets/Header';
import { Container } from '../../shared/ui/Container';
import { LoadAvatar } from '../../shared/ui/LoadAvatar';
import { getCurrentTmaUser } from '../../shared/lib/tma/user';

/**
 * Страница профиля пользователя, можно изменить фото профиля или имя
 */
export const Profile: FC = () => {
  const user = getCurrentTmaUser();
  const profileUsername = user.username ?? user.nickname;

  return (
    <Container>
      <img className={styles.circleIcon} src={circleIcon} alt="" />
      <Header className={styles.header} />
      <LoadAvatar />
      <TextInput
        placeholder="Username"
        defaultValue={profileUsername ? `@${profileUsername}` : ''}
        className={styles.profileInputWrapper}
      />
      <img src={logo} alt="" className={styles.logo} />
    </Container>
  );
};
