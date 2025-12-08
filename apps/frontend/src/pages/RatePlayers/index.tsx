import { FC } from "react"
import { RateUsersBadge } from "../../features/UsersBadge/ui/RateUsersBadge"
import { Container } from "../../shared/ui/Container"
import { Typography } from "../../shared/ui/Typography"
import { Header } from "../../widgets/Header"
import styles from './style/ratePlayersStyle.module.scss'

/** 
 * Экран с оценкой других игроков
*/
export const RatePlayers: FC = () => {
  return (
    <Container>
      <Header />
      <Typography as="h1" variant="titleLarge" className={styles.title}>Оцени!</Typography>
      <Typography className={styles.subtitle}>Других игроков в раунде</Typography>
      <RateUsersBadge />
    </Container>
  )
}