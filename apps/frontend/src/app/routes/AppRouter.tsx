import { Routes, Route } from "react-router-dom"
import { AnswerLiar } from "../../pages/AnswerLiar"
import { AnswerSolved } from "../../pages/AnswerSolved"
import { AnswersPlayers } from "../../pages/AnswersPlayers"
import { ChoosingLiar } from "../../pages/ChoosingLiar"
import { ConnectLobby } from "../../pages/ConnectLobby"
import { CreateLobby } from "../../pages/CreateLobby"
import { EndGame } from "../../pages/EndGame"
import { Home } from "../../pages/Home"
import { NotFound } from "../../pages/NotFound"
import { Profile } from "../../pages/Profile"
import { RatePlayers } from "../../pages/RatePlayers"
import { ResultGame } from "../../pages/ResultGame"
import { Rules } from "../../pages/Rules"
import { Settings } from "../../pages/Settings"
import { LobbyAdmin } from "../../pages/Lobby/LobbyAdmin"
import { WaitingPlayers } from "../../pages/WaitingPlayers"
import { PageRoutes } from "./pages"
import { LobbyPlayer } from "../../pages/Lobby/LobbyPlayer"
import { useBackgroundMusic } from "../providers/BackgroundMusicProvider"

export const AppRouter = () => {  
  useBackgroundMusic();

  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path={`/${PageRoutes.PROFILE}`} element={<Profile />} />
        <Route path={`/${PageRoutes.ANSWER_LIAR}`} element={<AnswerLiar />} />
        <Route path={`/${PageRoutes.ANSWER_SOLVED}`} element={<AnswerSolved />} />
        <Route path={`/${PageRoutes.ANSWERS_PLAYERS}`} element={<AnswersPlayers />} />
        <Route path={`/${PageRoutes.CHOOSING_LIAR}`} element={<ChoosingLiar />} />
        <Route path={`/${PageRoutes.CONNECT_LOBBY}`} element={<ConnectLobby />} />
        <Route path={`/${PageRoutes.CREATE_LOBBY}`} element={<CreateLobby />} />
        <Route path={`/${PageRoutes.END_GAME}`} element={<EndGame />} />
        <Route path={`/${PageRoutes.RATE_PLAYERS}`} element={<RatePlayers />} />
        <Route path={`/${PageRoutes.RESULT_GAME}`} element={<ResultGame />} />
        <Route path={`/${PageRoutes.RULES}`} element={<Rules />} />
        <Route path={`/${PageRoutes.SETTINGS}`} element={<Settings />} />
        <Route path={`/${PageRoutes.LOBBY_ADMIN}`} element={<LobbyAdmin />} />
        <Route path={`/${PageRoutes.LOBBY_PLAYER}`} element={<LobbyPlayer />} />
        <Route path={`/${PageRoutes.WAITING_PLAYERS}`} element={<WaitingPlayers />} />

        {/* Резервный маршрут 404 */}
        <Route path='*' element={<NotFound />} />
      </Routes>
  )
}