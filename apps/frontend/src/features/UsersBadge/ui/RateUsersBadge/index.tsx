import { FC, useState } from "react"
import styles from '../../style/usersBadgeStyle.module.scss'
import type { Player } from "../../../../entities/user/model/types";
import { UserBadge } from "../../../../entities/user/ui/UserBadge";
import clsx from "clsx";
import { Checkbox } from "../../../../shared/ui/Checkbox";

type Props = {}

/** 
 * Получаем оценки игроков
*/
export const RateUsersBadge: FC = (props: Props) => {
  const [rated, setRated] = useState<boolean>(false)
  
  const testUsers = [
    {
      id: 1,
      photo: '',
      name: 'Бешеный Татар',
      isRated: rated,
    },
    {
      id: 2,
      photo: '',
      name: 'Лысый Татар',
      isRated: rated,
    },
    {
      id: 3,
      photo: '',
      name: 'Крутой Татар',
      isRated: rated,
    },
    {
      id: 4,
      photo: '',
      name: 'Бешеный Татар',
      isRated: rated,
    },
    {
      id: 5,
      photo: '',
      name: 'Бешеный Татар',
      isRated: rated,
    },
    {
      id: 6,
      photo: '',
      name: 'Лысый Татар',
      isRated: rated,
    },
  ]
  return (
    <div className={clsx(styles.content, styles.answersContent)}>
      {testUsers.map((user: Player) => (
        <div className={styles.playerBlock} key={user.id}>
          <UserBadge id={user.id} photo={user.photo} name={user.name} className={styles.userContent} isRated={user.isRated} />
          <Checkbox onChange={(value: boolean) => setRated(value)} />
        </div>
      ))}
    </div>
  )
}