import { useEffect, useState } from 'react';
import { BackArrow } from './components/backArrow/BackArrow';
import { CustomButton } from './components/CustomButton/CustomButton';
import { Typography } from './components/Typography/Typography';
import { CustomCheckbox } from './components/CustomCheckbox/CustomCheckbox';
import { TextInput } from './components/TextInput/TextInput';
import { Range } from './components/range/Range';
import { ValueScroller } from './components/ValueScroller/ValueScroller';
import fonts from './shared/fonts/fonts.module.scss'
import cl from './App.module.scss'
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  const [activeValue, setActiveValue] = useState<number>(0);
  const [value, setValue] = useState<number>(20);
  
  return (
    <Provider store={store}>
      <div className={cl.container}>
        <Typography variant='caption' className={cl.typographyTestStyle}>
          Какой-то текст
        </Typography>
        <CustomButton variant='buttonUnderline'>
          <span>Кнопка с подчеркиванием</span>
        </CustomButton>
        <CustomButton >
          <span>Кнопка без подчеркивания</span>
        </CustomButton>
        <TextInput placeholder='Task' />
        <TextInput placeholder='Вылизываем кота !' className={cl.wrapperStyle} inputClassName={cl.inputStyle}/>
        <BackArrow />
        <ValueScroller min={5} max={60} step={5} onChange={(value) => setActiveValue(value)} />
        <Range step={1} onChange={setValue} />
        <CustomCheckbox />
      </div>
    </Provider>
    
  );
}

export default App;
