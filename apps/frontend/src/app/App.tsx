import fonts from '../shared/assets/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Settings } from '../pages/Settings';
import { Static } from './static/Static';
import { ChoosingLiar } from '../pages/ChoosingLiar';
import { CreateLobby } from '../pages/CreateLobby';
import { Home } from '../pages/Home';
import { NotFound } from '../pages/NotFound';
import { Profile } from '../pages/Profile';
import { Rules } from '../pages/Rules';
import { WaitingLobby } from '../pages/WaitingLobby';
import { WaitingPlayers } from '../pages/WaitingPlayers';

function App() {
  return (
    <Provider store={store}>
      <Static />
      <WaitingPlayers />
    </Provider>
    
  );
}

export default App;
