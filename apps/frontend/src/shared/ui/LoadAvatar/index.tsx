import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import styles from './style/loadAvatarStyle.module.scss';
import noPhoto from '/icons/blackPhoto.svg';
import { Typography } from '../Typography';
import { usePlaySound } from '../../lib/sound/usePlaySound';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';

type LoadAvatarProps = {
  initialImage?: string;
  disabled?: boolean;
  helperText?: string;
  onChange?: (file: File | null) => void | Promise<void>;
};

const MAX_SIZE_MB = 15;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export const LoadAvatar: FC<LoadAvatarProps> = ({
  initialImage,
  disabled = false,
  helperText,
  onChange,
}) => {
  const [preview, setPreview] = useState<string | null>(initialImage ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const playSound = usePlaySound();

  useEffect(() => {
    setPreview(initialImage ?? null);
  }, [initialImage]);

  const handleClick = () => {
    if (disabled || isUploading) {
      return;
    }
    fileInputRef.current?.click(); // Открываем диалог выбора файла
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
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

    if (!onChange) return;

    try {
      setIsUploading(true);
      await onChange(file);
    } catch (error) {
      const message = error instanceof Error ? error.message.trim() : '';
      setError(message || 'Не удалось загрузить фото');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.wrapper} data-relative="true">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleUpload}
        className={styles.input}
      />

      {/* Кликабельный аватар */}
      <img
        src={preview ? resolveMediaUrl(preview) : noPhoto}
        alt="avatar"
        className={styles.avatar}
        onPointerDown={() => playSound()}
        onClick={handleClick}
      />

      {helperText && (
        <Typography variant="caption" className={styles.helper}>
          {helperText}
        </Typography>
      )}

      {isUploading && (
        <Typography variant="caption" className={styles.helper}>
          Загружаем фото...
        </Typography>
      )}

      {error && (
        <Typography variant="caption" className={styles.error}>
          {error}
        </Typography>
      )}
    </div>
  );
};
