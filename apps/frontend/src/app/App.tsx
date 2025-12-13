import fonts from '../shared/assets/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Static } from './static/Static';
import { AppRouter } from './routes/AppRouter';
import { BrowserRouter } from 'react-router-dom';

function App() {
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
