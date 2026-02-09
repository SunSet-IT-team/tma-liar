import { type FC } from 'react';
import { Popup } from '../../../../shared/ui/Popup';
import developerIcon from '../../../../../public/icons/developerIcon.svg';
import styles from '../../style/popupsStyle.module.scss';
import { Typography } from '../../../../shared/ui/Typography';
import { Button } from '../../../../shared/ui/Button';
import clsx from 'clsx';

type DevelopersPopupProps = {
  /**
   * Изменение показа попапа
   */
  changeShow: (show: boolean) => void;
};

/**
 * Попап разработчиков
 */
export const DevelopersPopup: FC<DevelopersPopupProps> = ({ changeShow }) => {
  return (
    <Popup changeShow={changeShow} className={clsx(styles.developer, styles.red)}>
      <div className={styles.developerBlock}>
        <img src={developerIcon} alt="" className={styles.developerIcon} />
        <div className={styles.developerContent}>
          <Typography as="h2">Александр Антоненко</Typography>
          <Typography variant="caption" className={styles.developerDescr}>
            КТО-ТО ВАЖНЫЙ
          </Typography>
          <Button className={styles.developerLink}>Ссылка на одноклассники</Button>
        </div>
      </div>
      <div className={styles.developerBlock}>
        <img src={developerIcon} alt="" className={styles.developerIcon} />
        <div className={styles.developerContent}>
          <Typography as="h2">Артём Пономарёв</Typography>
          <Typography variant="caption" className={styles.developerDescr}>
            ВСЕ СОБРАВ
          </Typography>
          <Button className={styles.developerLink}>ссылка на фишинговый сайт</Button>
        </div>
      </div>
      <div className={styles.developerBlock}>
        <img src={developerIcon} alt="" className={styles.developerIcon} />
        <div className={styles.developerContent}>
          <Typography as="h2">СТАРЫЙ ДЕД</Typography>
          <Typography variant="caption" className={styles.developerDescr}>
            ВИНОВЕН В КОНЕЧНОМ ВИЗУАЛЬНОМ ОФОРМЛЕНИИ
          </Typography>
          <Button className={styles.developerLink}>ССЫЛКА НА ONLY FANS</Button>
        </div>
      </div>
    </Popup>
  );
};
