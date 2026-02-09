import { useEffect, useRef, useState, type FC } from 'react';
import styles from './style/profileStyle.module.scss';
import circleIcon from '../../../public/icons/profileCircle.svg';
import { TextInput } from '../../shared/ui/TextInput';
import logo from '../../../public/icons/homeIcon-lzhets.svg';
import { Header } from '../../widgets/Header';
import { Container } from '../../shared/ui/Container';
import { LoadAvatar } from '../../shared/ui/LoadAvatar';
import { userService } from '../../shared/services/user/user.service';
import { updateUser } from '../../shared/services/user/api/updateUser.api';

/**
 * Страница профиля пользователя, можно изменить фото профиля или имя
 */
export const Profile: FC = () => {
  const tg = window.Telegram?.WebApp;
  const telegramUser = tg?.initDataUnsafe?.user;

  const user = userService.getUser();

  const [nickname, setNickname] = useState<string>('');
  const initialNickname = useRef<string>('');

  useEffect(() => {
    if (!user) return;

    setNickname(user.nickname ?? '');
    initialNickname.current = user.nickname ?? '';
  }, [telegramUser]);

  const handleBlur = async () => {
    if (!telegramUser?.id) return;

    if (nickname === initialNickname.current) return;

    try {
      await updateUser(telegramUser.id, nickname);

      userService.setUser({
        ...user!,
        nickname,
      });

      initialNickname.current = nickname;
    } catch (e) {
      alert(`Ошибка сохранения ника, ${e}`);
      setNickname(initialNickname.current); // откат
    }
  };

  return (
    <Container>
      <img className={styles.circleIcon} src={circleIcon} alt="" />
      <Header className={styles.header} />
      <LoadAvatar />
      <TextInput
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onBlur={handleBlur}
        placeholder="NICKNAME"
        className={styles.profileInputWrapper}
      />
      <img src={logo} alt="" className={styles.logo} />
    </Container>
  );
};
