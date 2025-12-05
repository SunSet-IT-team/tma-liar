import fonts from '../shared/assets/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Static } from './static/Static';
import { AnswersPlayers } from '../pages/AnswersPlayers';

function App() {
  return (
    <Provider store={store}>
      <Static />
      <AnswersPlayers />
    </Provider>
    
  );
}

export default App;
