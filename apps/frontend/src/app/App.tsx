import { Provider } from 'react-redux';
import { store } from './store';
import { Static } from './static/Static';
import { AppRouter } from './routes/AppRouter';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/Auth/AuthProvider';
import { PresenceHeartbeat } from './providers/PresenceHeartbeat';
import { SessionRehydration } from './providers/SessionRehydration';
import { NotifyProvider } from '../shared/lib/notify/notify';
import '../shared/assets/fonts/fonts.scss';

function App() {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <AuthProvider>
          <PresenceHeartbeat />
          <NotifyProvider>
            <SessionRehydration />
            <Static />
            <AppRouter />
          </NotifyProvider>
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  );
}

export default App;
