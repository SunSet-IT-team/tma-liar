import clsx from "clsx";
import { FC } from "react"
import type { Player } from "../../../../entities/user/model/types";
import { UserBadge } from "../../../../entities/user/ui/UserBadge";
import styles from '../../style/usersBadgeStyle.module.scss'

type UsersProps = {
  className?: string;
}

/** 
 * Получаем подключившихся игроков в лобби
*/
export const LobbyUsersBadge: FC<UsersProps> = ({ className }) => {
  const testUsers = [
    {
      id: 1,
      photo: '',
      isLzhets: true,
      currentPlayer: true,
      name: 'Бешеный Татар',
    },
    {
      id: 2,
      photo: '',
      isLzhets: false,
      currentPlayer: false,
      name: 'Лысый Татар',
    },
    {
      id: 3,
      photo: '',
      isLzhets: false,
      currentPlayer: false,
      name: 'Крутой Татар',
    },
    {
      id: 4,
      photo: '',
      isLzhets: false,
      currentPlayer: false,
      name: 'Бешеный Татар',
    },
  ]
  return (
    <div className={clsx(styles.content, styles.lobbyContent)}>
      {testUsers.map((user: Player) => (
        <UserBadge key={user.id} id={user.id} photo={user.photo} name={user.name} isLzhets={user.isLzhets} currentPlayer={user.currentPlayer} className={styles.userContent} />
      ))}
    </div>
  )
}