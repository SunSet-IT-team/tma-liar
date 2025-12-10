import fonts from '../shared/assets/fonts/fonts.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';
import { Static } from './static/Static';
import { ResultGame } from '../pages/ResultGame';

function App() {
  return (
    <Provider store={store}>
      <Static />
      <ResultGame />
    </Provider>
    
  );
}

export default App;
