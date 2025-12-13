import { FC } from "react"
import { PageRoutes } from "../../app/routes/pages"
import { GameProcess } from "../../features/GameProcess"
import { ResultUsersBadge } from "../../features/UsersBadge/ui/ResultUsersBadge"
import { Container } from "../../shared/ui/Container"
import { Header } from "../../widgets/Header"

/** 
 * Экран, отображение результатов игры
*/
export const ResultGame: FC = () => {
  return (
    <Container>
      <Header inGame />
      <ResultUsersBadge />
      <GameProcess route={`/${PageRoutes.END_GAME}`} />
    </Container>
  )
}