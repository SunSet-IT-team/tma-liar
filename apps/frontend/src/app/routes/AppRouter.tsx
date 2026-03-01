import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom"
import { PageRoutes } from "./pages"
import { useBackgroundMusic } from "../providers/BackgroundMusicProvider"

const Home = lazy(() => import("@pages/Home").then((module) => ({ default: module.Home })));
const Profile = lazy(() => import("@pages/Profile").then((module) => ({ default: module.Profile })));
const AnswerLiar = lazy(() => import("@pages/AnswerLiar").then((module) => ({ default: module.AnswerLiar })));
const AnswerSolved = lazy(() => import("@pages/AnswerSolved").then((module) => ({ default: module.AnswerSolved })));
const AnswersPlayers = lazy(() => import("@pages/AnswersPlayers").then((module) => ({ default: module.AnswersPlayers })));
const ChoosingLiar = lazy(() => import("@pages/ChoosingLiar").then((module) => ({ default: module.ChoosingLiar })));
const ConnectLobby = lazy(() => import("@pages/ConnectLobby").then((module) => ({ default: module.ConnectLobby })));
const CreateLobby = lazy(() => import("@pages/CreateLobby").then((module) => ({ default: module.CreateLobby })));
const EndGame = lazy(() => import("@pages/EndGame").then((module) => ({ default: module.EndGame })));
const RatePlayers = lazy(() => import("@pages/RatePlayers").then((module) => ({ default: module.RatePlayers })));
const ResultGame = lazy(() => import("@pages/ResultGame").then((module) => ({ default: module.ResultGame })));
const Rules = lazy(() => import("@pages/Rules").then((module) => ({ default: module.Rules })));
const Settings = lazy(() => import("@pages/Settings").then((module) => ({ default: module.Settings })));
const LobbyAdmin = lazy(() => import("@pages/Lobby/LobbyAdmin").then((module) => ({ default: module.LobbyAdmin })));
const LobbyPlayer = lazy(() => import("@pages/Lobby/LobbyPlayer").then((module) => ({ default: module.LobbyPlayer })));
const WaitingPlayers = lazy(() => import("@pages/WaitingPlayers").then((module) => ({ default: module.WaitingPlayers })));
const NotFound = lazy(() => import("@pages/NotFound").then((module) => ({ default: module.NotFound })));

export const AppRouter = () => {  
  useBackgroundMusic();

  return (
    <Suspense fallback={null}>
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
    </Suspense>
  )
}
