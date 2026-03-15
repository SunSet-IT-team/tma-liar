import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import styles from './notifyStyle.module.scss';

type NotificationType = 'info' | 'success' | 'error';

type Notification = {
  id: number;
  type: NotificationType;
  message: string;
};

type NotifyContextValue = {
  notify: (type: NotificationType, message: string) => void;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
  notifyInfo: (message: string) => void;
};

const NotifyContext = createContext<NotifyContextValue | null>(null);

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>([]);

  const push = useCallback((type: NotificationType, message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const notify = useCallback(
    (type: NotificationType, message: string) => {
      if (!message) return;
      push(type, message);
    },
    [push],
  );

  const notifyError = useCallback(
    (message: string) => {
      notify('error', message);
    },
    [notify],
  );

  const notifySuccess = useCallback(
    (message: string) => {
      notify('success', message);
    },
    [notify],
  );

  const notifyInfo = useCallback(
    (message: string) => {
      notify('info', message);
    },
    [notify],
  );

  return (
    <NotifyContext.Provider value={{ notify, notifyError, notifySuccess, notifyInfo }}>
      {children}
      <div className={styles.container}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`${styles.toast} ${
              item.type === 'error'
                ? styles.error
                : item.type === 'success'
                  ? styles.success
                  : styles.info
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </NotifyContext.Provider>
  );
}

export function useNotify(): NotifyContextValue {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error('useNotify must be used within NotifyProvider');
  }
  return ctx;
}

