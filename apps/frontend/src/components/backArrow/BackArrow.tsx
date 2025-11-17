import whiteArrow from '../../assets/whiteArrow.svg';
import redArrow from '../../assets/redArrow.svg';
import blackArrow from '../../assets/blackArrow.svg';
import './style/arrowStyle.scss'

type BackArrowVariant = 'white' | 'red' | 'black';

type BackArrowProps = {
  variant?: BackArrowVariant;  
  onClick?: () => void;
};

export const BackArrow = ({
  variant = 'black',
  onClick,
}: BackArrowProps) => {
  const srcMap: Record<BackArrowVariant, string> = {
    white: whiteArrow,
    red: redArrow,
    black: blackArrow,
  };

  const src = srcMap[variant];

  return (
    <button onClick={onClick}>
      <img src={src} className='backArrow' />
    </button>
  );
};
