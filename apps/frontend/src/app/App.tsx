import fonts from '../shared/assets/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Static } from './static/Static';
import { WaitingPlayers } from '../pages/WaitingPlayers';
import { AnswerLiar } from '../pages/AnswerLiar';

function App() {
  return (
    <Provider store={store}>
      <Static />
      <AnswerLiar />
    </Provider>
    
  );
}

export default App;
