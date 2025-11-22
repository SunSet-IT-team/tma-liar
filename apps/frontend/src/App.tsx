import fonts from './shared/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Home } from './pages/home/Home';
import { Profile } from './pages/profile/Profile';
import { Settings } from './pages/settings/Settings';

function App() {
  return (
    <Provider store={store}>
      <Settings />
    </Provider>
    
  );
}

export default App;
