import { useEffect, useState } from 'react';
import { BackArrow } from './components/backArrow/BackArrow';
import { CustomButton } from './components/button/CustomButton';
import Typography from './components/connectFont/Typography';
import { TextInput } from './components/input/TextInput';
import { ValueScroller } from './components/ValueScroller/ValueScroller';
import fonts from './shared/fonts/fonts.module.scss'
import cl from './shared/UI/Aboba/index.module.scss'

function App() {
  const [activeValue, setActiveValue] = useState<number>(0);
  
  return (
    <div className={fonts.fontFamily}>
      <Typography variant='caption' className={cl.typographyTestStyle}>
        Какой-то текст
      </Typography>
      <CustomButton variant='buttonUnderline'>
        <span>Кнопка с подчеркиванием</span>
      </CustomButton>
      <CustomButton variant='buttonText'>
        <span>Кнопка без подчеркивания</span>
      </CustomButton>
      <TextInput placeholder='Task' />
      <TextInput placeholder='Вылизываем кота !' className={cl.inputStyle} />
      <BackArrow />
      <ValueScroller min={5} max={60} step={5} onChange={(value) => setActiveValue(value)} />
    </div>
  );
}

export default App;
