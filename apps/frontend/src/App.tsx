import fonts from './shared/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Home } from './pages/home/Home';
import { Profile } from './pages/profile/Profile';
import { Settings } from './pages/settings/Settings';
import { CreateLobbi } from './pages/createLobbi/CreateLobbi';
import { NotFound } from './pages/notFound/NotFound';
import { Rules } from './pages/rules/Rules';

function App() {
  return (
    <Provider store={store}>
      <Rules />
    </Provider>
    
  );
}

export default App;
