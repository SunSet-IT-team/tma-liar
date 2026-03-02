type SoundMap = Map<string, HTMLAudioElement[]>;

const sounds: SoundMap = new Map();
const MAX_INSTANCES_PER_SOUND = 6;

function createAudio(src: string): HTMLAudioElement {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.setAttribute('playsinline', 'true');
  return audio;
}

export function getSound(src: string): HTMLAudioElement {
  const cachedPool = sounds.get(src);
  if (cachedPool?.[0]) return cachedPool[0];

  const audio = createAudio(src);
  sounds.set(src, [audio]);
  return audio;
}

function getSoundPool(src: string): HTMLAudioElement[] {
  const cached = sounds.get(src);
  if (cached) return cached;
  const first = createAudio(src);
  const pool = [first];
  sounds.set(src, pool);
  return pool;
}

function pickPlayableAudio(src: string, loop: boolean): HTMLAudioElement {
  const pool = getSoundPool(src);

  // Лупы (музыка/тик) всегда играем на одном инстансе.
  if (loop) {
    return pool[0];
  }

  const available = pool.find((audio) => audio.paused || audio.ended);
  if (available) return available;

  if (pool.length < MAX_INSTANCES_PER_SOUND) {
    const audio = createAudio(src);
    pool.push(audio);
    return audio;
  }

  // Если пул заполнен, переиспользуем самый старый инстанс.
  return pool[0];
}

export function playCachedSound(src: string, volume: number, loop = false) {
  const audio = pickPlayableAudio(src, loop);
  audio.loop = loop;
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => undefined);
  return audio;
}

export function stopCachedSound(src: string) {
  const pool = sounds.get(src);
  if (!pool) return;
  for (const audio of pool) {
    audio.pause();
    audio.currentTime = 0;
  }
}
