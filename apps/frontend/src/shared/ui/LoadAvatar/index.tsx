import { ChangeEvent, type FC, useRef, useState } from 'react';
import styles from './style/loadAvatarStyle.module.scss';
import noPhoto from '../../../../public/icons/blackPhoto.svg';
import { Typography } from '../Typography';
import { usePlaySound } from '../../lib/sound/usePlaySound';

type LoadAvatarProps = {
  onChange?: (file: File | null) => void;
};

const MAX_SIZE_MB = 15;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

/**
 * Загрузка фото профиля
 */
export const LoadAvatar: FC<LoadAvatarProps> = ({ onChange }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tg = window.Telegram?.WebApp;
  const telegramUser = tg?.initDataUnsafe?.user;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const playSound = usePlaySound();

  const handleClick = () => {
    playSound();
    fileInputRef.current?.click(); // Открываем диалог выбора файла
  };

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Разрешены только JPG, PNG, SVG и WEBP');
      setPreview(null);
      onChange?.(null);
      return;
    }

    // Проверка размера
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError('Максимальный размер изображения — 15 МБ');
      setPreview(null);
      onChange?.(null);
      return;
    }

    setError(null);

    // Создание превью
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    onChange?.(file);
  };

  return (
    <div className={styles.wrapper}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleUpload}
        className={styles.input}
      />

      {/* Кликабельный аватар */}
      <img src={preview || telegramUser?.photo_url} alt="avatar" className={styles.avatar} onClick={handleClick} />

      {error && (
        <Typography variant="caption" className={styles.error}>
          {error}
        </Typography>
      )}
    </div>
  );
};
