import { useContext, useEffect, useRef, useState, type FC } from 'react';
import styles from './style/profileStyle.module.scss';
import circleIcon from '/icons/profileCircle.svg';
import { TextInput } from '../../shared/ui/TextInput';
import logo from '/icons/homeIcon-lzhets.svg';
import { Header } from '../../widgets/Header';
import { Container } from '../../shared/ui/Container';
import { LoadAvatar } from '../../shared/ui/LoadAvatar';
import {
  getCurrentUser,
  isGuestUser,
  setTmaUserOverrides,
} from '../../shared/lib/tma/user';
import {
  findUserByTelegramId,
  purchaseSubscription,
  updateUserNickname,
  updateUserProfileImgFile,
} from '../../shared/services/api/user.api';
import { uploadGuestAvatarFile } from '../../shared/services/api/guest-avatar.api';
import { AuthContext } from '../../app/providers/Auth/AuthProvider';
import { Button } from '../../shared/ui/Button';

const SUBSCRIPTION_PRICE_RUB = 75;

async function compressImageToFile(file: File): Promise<File> {
  const sourceUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_DECODE_ERROR'));
    img.src = sourceUrl;
  });

  const maxSide = 768;
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('CANVAS_CONTEXT_ERROR');
  }

  ctx.drawImage(image, 0, 0, width, height);

  const compressedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('IMAGE_COMPRESSION_ERROR'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.82,
    );
  });

  return new File([compressedBlob], 'profile.jpg', { type: 'image/jpeg' });
}

/**
 * Страница профиля пользователя, можно изменить фото профиля или имя
 */
export const Profile: FC = () => {
  const { mode } = useContext(AuthContext);
  const user = getCurrentUser();
  const profileUsername = user.username ?? user.nickname;
  const canSyncToServer = mode === 'full' && !isGuestUser(user);
  const [avatarSrc, setAvatarSrc] = useState<string>(user.profileImg ?? '');
  const [statusText, setStatusText] = useState<string>('');
  const [economyStatus, setEconomyStatus] = useState<string>('');
  const [balanceRub, setBalanceRub] = useState<number | null>(null);
  const [subscriptionUntilIso, setSubscriptionUntilIso] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [displayName, setDisplayName] = useState<string>(profileUsername ?? '');

  const displayNameRef = useRef(displayName);
  displayNameRef.current = displayName;

  const initialNicknameRef = useRef<string | null>(null);
  if (initialNicknameRef.current === null) {
    initialNicknameRef.current = (user.username ?? user.nickname) || '';
  }

  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (!canSyncToServer) {
      return;
    }

    void findUserByTelegramId(user.telegramId)
      .then((serverUser) => {
        const nextProfileImg = serverUser.profileImg ?? '';
        setAvatarSrc(nextProfileImg);
        setTmaUserOverrides(user.telegramId, { profileImg: nextProfileImg });
        setBalanceRub(serverUser.balanceRub);
        setSubscriptionUntilIso(serverUser.subscriptionUntil);
        setHasActiveSubscription(serverUser.hasActiveSubscription);
      })
      .catch(() => {
        // silently ignore: fallback to local profile image
      });
  }, [canSyncToServer, user.telegramId]);

  const handleBuySubscription = async () => {
    if (!canSyncToServer || subscriptionBusy) return;
    setEconomyStatus('');
    setSubscriptionBusy(true);
    try {
      const next = await purchaseSubscription();
      setBalanceRub(next.balanceRub);
      setSubscriptionUntilIso(next.subscriptionUntil);
      setHasActiveSubscription(next.hasActiveSubscription);
      setEconomyStatus('Подписка оформлена на месяц');
    } catch (error) {
      const status = (error as { response?: { status?: number; data?: { errorCode?: string } } })
        .response?.status;
      const code = (error as { response?: { data?: { errorCode?: string } } }).response?.data
        ?.errorCode;
      if (status === 402 || code === 'INSUFFICIENT_BALANCE') {
        setEconomyStatus(`Недостаточно средств (нужно ${SUBSCRIPTION_PRICE_RUB} ₽)`);
      } else {
        setEconomyStatus('Не удалось оформить подписку');
      }
    } finally {
      setSubscriptionBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      const raw = displayNameRef.current.trim();
      const normalized = raw.replace(/^@+/, '');
      const initial = initialNicknameRef.current ?? '';

      if (!normalized || normalized === initial) {
        return;
      }

      const u = getCurrentUser();
      setTmaUserOverrides(u.telegramId, {
        nickname: normalized,
        username: normalized,
      });

      if (modeRef.current === 'full' && !isGuestUser(u)) {
        void updateUserNickname(u.telegramId, normalized).catch(() => {
          // локальный override уже применён
        });
      }
    };
  }, []);

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;

    if (!canSyncToServer) {
      try {
        const compressedFile = await compressImageToFile(file);
        const u = getCurrentUser();
        const profileImgPath = await uploadGuestAvatarFile(u.telegramId, compressedFile);
        setAvatarSrc(profileImgPath);
        setTmaUserOverrides(u.telegramId, { profileImg: profileImgPath });
        setStatusText('Фото профиля обновлено');
      } catch {
        setStatusText('Не удалось обновить фото профиля');
        throw new Error('GUEST_AVATAR_UPDATE_FAILED');
      }
      return;
    }

    try {
      const compressedFile = await compressImageToFile(file);
      const updatedUser = await updateUserProfileImgFile(user.telegramId, compressedFile);
      const nextProfileImg = updatedUser.profileImg ?? '';

      setAvatarSrc(nextProfileImg);
      setTmaUserOverrides(user.telegramId, { profileImg: nextProfileImg });
      setStatusText('Фото профиля обновлено');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const axiosLikeError = error as {
        response?: {
          status?: number;
          data?: { errorCode?: string };
        };
      };
      const errorCode = axiosLikeError.response?.data?.errorCode;
      const status = axiosLikeError.response?.status;

      if (
        status === 413 ||
        errorCode === 'PROFILE_IMAGE_TOO_LARGE' ||
        errorCode === 'PAYLOAD_TOO_LARGE' ||
        message.includes('413') ||
        message.includes('too large')
      ) {
        setStatusText('Фото слишком большое, выберите менее тяжелое изображение');
        throw new Error('Фото слишком большое, выберите менее тяжелое изображение');
      }

      setStatusText('Не удалось обновить фото профиля');
      throw error;
    }
  };

  return (
    <Container>
      <img className={styles.circleIcon} src={circleIcon} alt="" data-decor="true" />
      <Header className={styles.header} />
      <LoadAvatar
        initialImage={avatarSrc}
        helperText="Нажмите на аватар, чтобы загрузить новое фото"
        onChange={handleAvatarUpload}
      />
      {statusText ? (
        <span className={styles.status} data-relative="true">
          {statusText}
        </span>
      ) : null}

      {canSyncToServer && balanceRub !== null ? (
        <div className={styles.economyBlock}>
          <span className={styles.balanceLine}>Баланс: {balanceRub} ₽</span>
          <span className={styles.subscriptionLine}>
            Подписка:{' '}
            {hasActiveSubscription && subscriptionUntilIso
              ? `активна до ${new Date(subscriptionUntilIso).toLocaleString()}`
              : 'нет'}
          </span>
          <Button
            variant="buttonUnderline"
            onClick={() => void handleBuySubscription()}
            disabled={subscriptionBusy || balanceRub < SUBSCRIPTION_PRICE_RUB}
          >
            {subscriptionBusy
              ? 'Оформляем...'
              : `Купить подписку (${SUBSCRIPTION_PRICE_RUB} ₽ / мес.)`}
          </Button>
          {economyStatus ? <span className={styles.economyStatus}>{economyStatus}</span> : null}
        </div>
      ) : null}

      <TextInput
        placeholder="Имя"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        className={styles.profileInputWrapper}
      />
      <img src={logo} alt="" className={styles.logo} />
    </Container>
  );
};
