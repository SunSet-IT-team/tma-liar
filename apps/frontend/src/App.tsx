import fonts from './shared/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Rules } from './pages/rules/Rules';
import { CreateLobbi } from './pages/createLobbi/CreateLobbi';
import { WaitingLobbi } from './pages/waitingLobbi/WaitingLobbi';
import { WaitingPlayers } from './pages/waitingPlayers/WaitingPlayers';
import { ChoosingLiar } from './pages/choosingLiar/ChoosingLiar';
import { Home } from './pages/home/Home';
import { NotFound } from './pages/notFound/NotFound';
import { Profile } from './pages/profile/Profile';
import { Settings } from './pages/settings/Settings';

function App() {
  return (
    <Provider store={store}>
      <WaitingPlayers />
    </Provider>
    
  );
}

export default App;
