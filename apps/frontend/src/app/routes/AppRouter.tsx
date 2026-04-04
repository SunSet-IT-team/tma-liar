import { lazy, Suspense, type ReactElement } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { PageRoutes } from './pages';
import { useBackgroundMusic } from '../providers/BackgroundMusicProvider';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './appRouterStyle.module.scss';

const Home = lazy(() => import('@pages/Home').then((module) => ({ default: module.Home })));
const Profile = lazy(() =>
  import('@pages/Profile').then((module) => ({ default: module.Profile })),
);
const AnswerLiar = lazy(() =>
  import('@pages/AnswerLiar').then((module) => ({ default: module.AnswerLiar })),
);
const AnswerSolved = lazy(() =>
  import('@pages/AnswerSolved').then((module) => ({ default: module.AnswerSolved })),
);
const AnswersPlayers = lazy(() =>
  import('@pages/AnswersPlayers').then((module) => ({ default: module.AnswersPlayers })),
);
const ChoosingLiar = lazy(() =>
  import('@pages/ChoosingLiar').then((module) => ({ default: module.ChoosingLiar })),
);
const ConnectLobby = lazy(() =>
  import('@pages/ConnectLobby').then((module) => ({ default: module.ConnectLobby })),
);
const CreateLobby = lazy(() =>
  import('@pages/CreateLobby').then((module) => ({ default: module.CreateLobby })),
);
const EndGame = lazy(() =>
  import('@pages/EndGame').then((module) => ({ default: module.EndGame })),
);
const RatePlayers = lazy(() =>
  import('@pages/RatePlayers').then((module) => ({ default: module.RatePlayers })),
);
const ResultGame = lazy(() =>
  import('@pages/ResultGame').then((module) => ({ default: module.ResultGame })),
);
const Rules = lazy(() => import('@pages/Rules').then((module) => ({ default: module.Rules })));
const Settings = lazy(() =>
  import('@pages/Settings').then((module) => ({ default: module.Settings })),
);
const LobbyAdmin = lazy(() =>
  import('@pages/Lobby/LobbyAdmin').then((module) => ({ default: module.LobbyAdmin })),
);
const LobbyPlayer = lazy(() =>
  import('@pages/Lobby/LobbyPlayer').then((module) => ({ default: module.LobbyPlayer })),
);
const WaitingPlayers = lazy(() =>
  import('@pages/WaitingPlayers').then((module) => ({ default: module.WaitingPlayers })),
);
const NotFound = lazy(() =>
  import('@pages/NotFound').then((module) => ({ default: module.NotFound })),
);

export const AppRouter = () => {
  useBackgroundMusic();
  const location = useLocation();

  const withTransition = (element: ReactElement) => (
    <motion.div
      className={styles.routeTransition}
      initial={{ opacity: 0, y: 12, scale: 0.985, pointerEvents: 'none' }}
      animate={{ opacity: 1, y: 0, scale: 1, pointerEvents: 'auto' }}
      exit={{ opacity: 0, y: -10, scale: 0.985, pointerEvents: 'none' }}
      transition={{
        duration: 0.22,
        ease: 'easeOut',
        pointerEvents: { duration: 0 },
      }}
    >
      {element}
    </motion.div>
  );

  return (
    <Suspense fallback={null}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={withTransition(<Home />)} />
          <Route path={`/${PageRoutes.PROFILE}`} element={withTransition(<Profile />)} />
          <Route path={`/${PageRoutes.ANSWER_LIAR}`} element={withTransition(<AnswerLiar />)} />
          <Route path={`/${PageRoutes.ANSWER_SOLVED}`} element={withTransition(<AnswerSolved />)} />
          <Route
            path={`/${PageRoutes.ANSWERS_PLAYERS}`}
            element={withTransition(<AnswersPlayers />)}
          />
          <Route path={`/${PageRoutes.CHOOSING_LIAR}`} element={withTransition(<ChoosingLiar />)} />
          <Route path={`/${PageRoutes.CONNECT_LOBBY}`} element={withTransition(<ConnectLobby />)} />
          <Route path={`/${PageRoutes.CREATE_LOBBY}`} element={withTransition(<CreateLobby />)} />
          <Route path={`/${PageRoutes.END_GAME}`} element={withTransition(<EndGame />)} />
          <Route path={`/${PageRoutes.RATE_PLAYERS}`} element={withTransition(<RatePlayers />)} />
          <Route path={`/${PageRoutes.RESULT_GAME}`} element={withTransition(<ResultGame />)} />
          <Route path={`/${PageRoutes.RULES}`} element={withTransition(<Rules />)} />
          <Route path={`/${PageRoutes.SETTINGS}`} element={withTransition(<Settings />)} />
          <Route path={`/${PageRoutes.LOBBY_ADMIN}`} element={withTransition(<LobbyAdmin />)} />
          <Route path={`/${PageRoutes.LOBBY_PLAYER}`} element={withTransition(<LobbyPlayer />)} />
          <Route
            path={`/${PageRoutes.WAITING_PLAYERS}`}
            element={withTransition(<WaitingPlayers />)}
          />
          <Route path="*" element={withTransition(<NotFound />)} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};
