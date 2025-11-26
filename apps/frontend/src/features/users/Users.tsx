import clsx from "clsx";
import { FC } from "react"
import type { UserProps } from "../../entities/user/ui/User";
import { User } from "../../entities/user/ui/User";
import styles from './style/usersStyle.module.scss'

type UsersProps = {
  className?: string;
}

export const Users: FC<UsersProps> = ({ className }) => {
  const testUsers = [
    {
      photo: '',
      isLzhets: true,
      isYou: true,
      name: 'Бешеный Татар'
    },
    {
      photo: '',
      isLzhets: false,
      isYou: false,
      name: 'Лысый Татар'
    },
    {
      photo: '',
      isLzhets: false,
      isYou: false,
      name: 'Крутой Татар'
    },
    {
      photo: '',
      isLzhets: false,
      isYou: false,
      name: 'Бешеный Татар'
    },
  ]
  return (
    <div className={clsx(styles.content, className)}>
      {testUsers.map((user: UserProps, i: number) => (
        <User key={i} photo={user.photo} name={user.name} isLzhets={user.isLzhets} isYou={user.isYou} className={styles.userContent} />
      ))}
    </div>
  )
}