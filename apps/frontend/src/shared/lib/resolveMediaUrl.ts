/**
 * Полный URL для картинок с API (`/uploads/...`) при отдельном origin от фронта.
 */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (url == null || url === '') {
    return '';
  }
  const t = url.trim();
  if (t.startsWith('data:') || /^https?:\/\//i.test(t)) {
    return t;
  }
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  if (t.startsWith('/')) {
    return `${base}${t}`;
  }
  return `${base}/${t}`;
}
