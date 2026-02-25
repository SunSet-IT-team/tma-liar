import { Provider } from 'react-redux';
import { store } from './store';
import { Static } from './static/Static';
import { AppRouter } from './routes/AppRouter';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/Auth/AuthProvider';
import '../shared/assets/fonts/fonts.module.scss';

function App() {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <AuthProvider>
          <Static />
          <AppRouter />
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  );
}

export default App;
