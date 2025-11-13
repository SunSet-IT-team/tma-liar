import { useState } from 'react';
import './App.css';
import Typography from './components/connectFont/Typography';
import fonts from './shared/fonts/fonts.module.scss'

function App() {
  return (
    <div className={fonts.fontFamily}>
      <Typography variant='caption' className={fonts.typographyTestStyle}>
        Какой-то текст
      </Typography>
    </div>
  );
}

export default App;
