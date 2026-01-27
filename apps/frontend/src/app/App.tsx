import fonts from '../shared/assets/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Static } from './static/Static';
import { AppRouter } from './routes/AppRouter';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
  
    if (!tg) return;
  
    tg.ready();
  
    const topInset = tg.safeAreaInset?.top ?? 0;
  
    document.documentElement.style.setProperty(
      '--tg-safe-area-top',
      `${topInset}px`
    );
  }, []);
  return (
    <BrowserRouter>
      <Provider store={store}>
        <Static />
        <AppRouter />
      </Provider>
    </BrowserRouter>
    
    
  );
}

export default App;
