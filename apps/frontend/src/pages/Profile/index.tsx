import { useContext, useEffect, useState, type FC } from 'react';
import styles from './style/profileStyle.module.scss';
import circleIcon from '/icons/profileCircle.svg';
import { TextInput } from '../../shared/ui/TextInput';
import logo from '/icons/homeIcon-lzhets.svg';
import { Header } from '../../widgets/Header';
import { Container } from '../../shared/ui/Container';
import { LoadAvatar } from '../../shared/ui/LoadAvatar';
import { getCurrentUser, isGuestUser, setTmaUserOverrides } from '../../shared/lib/tma/user';
import {
  findUserByTelegramId,
  updateUserNickname,
  updateUserProfileImgFile,
} from '../../shared/services/api/user.api';
import { AuthContext } from '../../app/providers/Auth/AuthProvider';
import { Typography } from '@shared/ui/Typography';

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
  const canUploadProfile = mode === 'full' && !isGuestUser(user);
  const [avatarSrc, setAvatarSrc] = useState<string>(user.profileImg ?? '');
  const [statusText, setStatusText] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>(
    profileUsername ? `@${profileUsername}` : '',
  );

  useEffect(() => {
    if (!canUploadProfile) {
      return;
    }

    void findUserByTelegramId(user.telegramId)
      .then((serverUser) => {
        console.log(serverUser);
        const nextProfileImg = serverUser.profileImg ?? '';
        setAvatarSrc(nextProfileImg);
        setTmaUserOverrides(user.telegramId, { profileImg: nextProfileImg });
      })
      .catch(() => {
        // silently ignore: fallback to local profile image
      });
  }, [canUploadProfile, user.telegramId]);

  useEffect(() => {
    return () => {
      const raw = displayName.trim();
      const normalized = raw.replace(/^@+/, '');

      if (!normalized || normalized === profileUsername) {
        return;
      }

      setTmaUserOverrides(user.telegramId, {
        nickname: normalized,
        username: normalized,
      });

      if (canUploadProfile) {
        void updateUserNickname(user.telegramId, normalized).catch(() => {
          // ignore nickname update errors here, локальный override уже применён
        });
      }
    };
  }, [canUploadProfile, displayName, profileUsername, user.telegramId]);

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;

    if (!canUploadProfile) {
      setStatusText('Загрузка фото доступна только после входа через Telegram');
      throw new Error('TELEGRAM_AUTH_REQUIRED');
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
        helperText={
          canUploadProfile
            ? 'Нажмите на аватар, чтобы загрузить новое фото'
            : 'Чтобы изменить фото профиля, войдите через Telegram'
        }
        onChange={handleAvatarUpload}
      />
      {statusText ? <span className={styles.status}>{statusText}</span> : null}

      <TextInput
        placeholder="Username"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        className={styles.profileInputWrapper}
      />
      <img src={logo} alt="" className={styles.logo} />
    </Container>
  );
};
