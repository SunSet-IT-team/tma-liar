import fonts from '../shared/assets/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Static } from './static/Static';
import { AppRouter } from './routes/AppRouter';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './providers/Auth/AuthProvider';

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
