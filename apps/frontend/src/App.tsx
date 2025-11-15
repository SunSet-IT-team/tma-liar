import { CustomButton } from './components/button/CustomButton';
import Typography from './components/connectFont/Typography';
import { TextInput } from './components/input/TextInput';
import fonts from './shared/fonts/fonts.module.scss'
import cl from './shared/UI/Aboba/index.module.scss'

function App() {
  return (
    <div className={fonts.fontFamily}>
      <Typography variant='caption' className={cl.typographyTestStyle}>
        Какой-то текст
      </Typography>
      <CustomButton variant='buttonUnderline'>
        <span>Кнопка с подчеркиванием</span>
      </CustomButton>
      <CustomButton variant='buttonText'>
        <span>Кнопка без подчеркиния</span>
      </CustomButton>
      <TextInput placeholder='Task' />
      <TextInput placeholder='Вылизываем кота !' className={cl.inputStyle} />
    </div>
  );
}

export default App;
