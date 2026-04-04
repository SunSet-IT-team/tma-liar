import { type FC } from 'react';
import styles from './style/settingsStyle.module.scss';
import clsx from 'clsx';
import { BackArrow } from '../../shared/ui/BackArrow';
import { Button } from '../../shared/ui/Button';
import { Range } from '../../shared/ui/Range';
import settingsBg from '/icons/settings-bgIcon.svg';
import { SettingsTouches } from '../../features/SettingsSounds/ui/SettingsTouches';
import { SettingsMusic } from '../../features/SettingsSounds/ui/SettingsMusic';
import { Container } from '../../shared/ui/Container';
import { Typography } from '../../shared/ui/Typography';

const SUNSET_IT_AGENCY_URL = 'https://sunset-it.agency/';

function openSunsetItAgency() {
  try {
    const webApp = window.Telegram?.WebApp as
      | { openLink?: (url: string) => void }
      | undefined;
    if (typeof webApp?.openLink === 'function') {
      webApp.openLink(SUNSET_IT_AGENCY_URL);
      return;
    }
  } catch {
    // ignore
  }
  window.open(SUNSET_IT_AGENCY_URL, '_blank', 'noopener,noreferrer');
}

/**
 * Страница настроек игры
 */
export const Settings: FC = () => {
  return (
    <Container className={styles.container}>
      <div className={styles.header}>
        <BackArrow variant="red" />
      </div>
      <div className={clsx(styles.content, styles.contentStyle)}>
        <div className={clsx(styles.sounds, styles.contentStyle)}>
          <SettingsTouches />
          <SettingsMusic />
        </div>
        <div className={styles.languageBlock}>
          <Typography className={styles.settingsText}>Язык</Typography>
          <Button className={styles.settingsText}>Русский</Button>
        </div>
        <div className={styles.volume}>
          <Typography className={styles.settingsText}>Язык</Typography>
          <Range />
        </div>
        <Button className={clsx(styles.settingsText, styles.helpBtn)} onClick={openSunsetItAgency}>
          Тех. Поддержка
        </Button>
        <Button className={styles.settingsText} onClick={openSunsetItAgency}>
          Разработчики
        </Button>
      </div>
      <img src={settingsBg} alt="" className={styles.settingsBg} data-decor="true" />
    </Container>
  );
};
