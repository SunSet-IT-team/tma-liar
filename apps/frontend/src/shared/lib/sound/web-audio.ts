const audioBufferCache = new Map<string, AudioBuffer>();
const loadingCache = new Map<string, Promise<AudioBuffer | null>>();

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  if (!audioContext) {
    audioContext = new Ctx();
  }

  return audioContext;
}

async function loadBuffer(src: string): Promise<AudioBuffer | null> {
  const cached = audioBufferCache.get(src);
  if (cached) return cached;

  const loading = loadingCache.get(src);
  if (loading) return loading;

  const context = getAudioContext();
  if (!context) return null;

  const promise = fetch(src)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer.slice(0)))
    .then((buffer) => {
      audioBufferCache.set(src, buffer);
      loadingCache.delete(src);
      return buffer;
    })
    .catch(() => {
      loadingCache.delete(src);
      return null;
    });

  loadingCache.set(src, promise);
  return promise;
}

export async function preloadWebAudio(src: string): Promise<void> {
  await loadBuffer(src);
}

/**
 * Быстрое воспроизведение через Web Audio API.
 * Возвращает true, если воспроизведение инициировано/запланировано.
 */
export function playWebAudio(src: string, volume: number): boolean {
  const context = getAudioContext();
  if (!context) return false;

  const playNow = (buffer: AudioBuffer) => {
    const gainNode = context.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(context.destination);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    source.start(0);
  };

  const cached = audioBufferCache.get(src);

  if (context.state === 'suspended') {
    void context.resume().then(() => {
      if (cached) {
        playNow(cached);
        return;
      }

      void loadBuffer(src).then((buffer) => {
        if (!buffer) return;
        playNow(buffer);
      });
    });

    return true;
  }

  if (cached) {
    playNow(cached);
    return true;
  }

  void loadBuffer(src).then((buffer) => {
    if (!buffer) return;
    playNow(buffer);
  });

  return true;
}

