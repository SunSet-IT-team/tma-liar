import clsx from "clsx";
import { FC } from "react"
import type { UserProps } from "../../entities/user/ui/UserBadge";
import { UserBadge } from "../../entities/user/ui/UserBadge";
import styles from './style/usersStyle.module.scss'

type UsersProps = {
  className?: string;
}

/** 
 * Получаем подключившихся игроков
*/
export const Users: FC<UsersProps> = ({ className }) => {
  const testUsers = [
    {
      id: 1,
      photo: '',
      isLzhets: true,
      isYou: true,
      name: 'Бешеный Татар'
    },
    {
      id: 2,
      photo: '',
      isLzhets: false,
      isYou: false,
      name: 'Лысый Татар'
    },
    {
      id: 3,
      photo: '',
      isLzhets: false,
      isYou: false,
      name: 'Крутой Татар'
    },
    {
      id: 4,
      photo: '',
      isLzhets: false,
      isYou: false,
      name: 'Бешеный Татар'
    },
  ]
  return (
    <div className={clsx(styles.content, className)}>
      {testUsers.map((user: UserProps) => (
        <UserBadge key={user.id} id={user.id} photo={user.photo} name={user.name} isLzhets={user.isLzhets} isYou={user.isYou} className={styles.userContent} />
      ))}
    </div>
  )
}