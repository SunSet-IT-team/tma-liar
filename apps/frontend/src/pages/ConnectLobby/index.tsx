import { type FC, useEffect, useRef } from 'react';
import styles from './style/connectLobbyStyle.module.scss';
import { Container } from '../../shared/ui/Container';
import { Header } from '../../widgets/Header';
import { Typography } from '../../shared/ui/Typography';
import { TextInput } from '../../shared/ui/TextInput';
import { Button } from '../../shared/ui/Button';
import { UserBadge } from '../../entities/user/ui/UserBadge';
import circleIcon from '/icons/profileCircle.svg';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../app/routes/pages';
import { retrieveLaunchParams } from '@tma.js/sdk';
import { useJoinLobby } from '@features/JoinLobby';

/**
 * Экран присоединения к лобби
 */
export const ConnectLobby: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const autoJoinRef = useRef(false);
  const { user, lobbyCode, isSubmitting, errorText, setLobbyCode, joinLobby, joinLobbyWithCode } = useJoinLobby();

  useEffect(() => {
    if (autoJoinRef.current) return;
    const params = new URLSearchParams(location.search);
    const codeParamFromQuery = params.get('lobbyCode');
    const startParamFromQuery = params.get('tgWebAppStartParam');

    const extractCodeFromStartParam = (raw: string | null): string | null => {
      if (!raw) return null;
      let candidate = raw.trim();
      if (!candidate) return null;

      // Поддержка "key=value", "prefix:value", "prefix_value"
      if (candidate.includes('=')) candidate = candidate.split('=').pop() ?? candidate;
      if (candidate.includes(':')) candidate = candidate.split(':').pop() ?? candidate;
      if (candidate.includes('_')) candidate = candidate.split('_').pop() ?? candidate;

      candidate = candidate.trim();
      if (!candidate) return null;
      return candidate.toUpperCase();
    };

    let codeParam = codeParamFromQuery ?? extractCodeFromStartParam(startParamFromQuery);

    // Если код не в query — пробуем достать payload из launch parameters TMA.
    if (!codeParam) {
      try {
        const lp = retrieveLaunchParams() as any;
        const startParam =
          lp?.startParam ??
          lp?.tgWebAppStartParam ??
          lp?.start_param ??
          (window.Telegram?.WebApp?.initDataUnsafe as any)?.start_param;
        codeParam = extractCodeFromStartParam(startParam);
      } catch {
        // ignore
      }
    }

    if (!codeParam) return;

    autoJoinRef.current = true;
    // Предзаполняем инпут, чтобы код был виден пользователю.
    setLobbyCode(codeParam);
    void joinLobbyWithCode(codeParam);
  }, [joinLobbyWithCode, location.search, setLobbyCode]);

  return (
    <Container>
      <Header />
      <Typography as="h1" variant="titleLarge" className={styles.title}>
        <Typography as="span" variant="titleLarge">
          Код
        </Typography>
        Лобби
      </Typography>
      <TextInput
        placeholder="Введите код лобби"
        className={styles.lobbyInput}
        value={lobbyCode}
        onChange={(event) => setLobbyCode(event.target.value)}
      />
      <Button className={styles.connectBtn} onClick={joinLobby} disabled={isSubmitting}>
        {isSubmitting ? 'Подключаю...' : 'Присоединиться'}
      </Button>

      {errorText && <Typography>{errorText}</Typography>}

      <button onClick={() => navigate(`/${PageRoutes.PROFILE}`)}>
        <UserBadge variant="large" id={1} name={user.nickname} photo={user.profileImg} />
      </button>
      <img src={circleIcon} alt="" className={styles.circleIcon} data-decor="true" />
    </Container>
  );
};
