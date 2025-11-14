import { CustomButton } from './components/button/CustomButton';
import Typography from './components/connectFont/Typography';
import fonts from './shared/fonts/fonts.module.scss'

function App() {
  return (
    <div className={fonts.fontFamily}>
      <Typography variant='caption' className={fonts.typographyTestStyle}>
        Какой-то текст
      </Typography>
      <CustomButton variant='buttonUnderline'>
        <span>Кнопка с подчеркиванием</span>
      </CustomButton>
    </div>
  );
}

export default App;
