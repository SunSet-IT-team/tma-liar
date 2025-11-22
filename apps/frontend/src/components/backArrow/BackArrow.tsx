import whiteArrow from '../../assets/icons/whiteArrow.svg';
import redArrow from '../../assets/icons/redArrow.svg';
import blackArrow from '../../assets/icons/blackArrow.svg';
import './style/arrowStyle.scss'
import { ButtonHTMLAttributes, FC } from 'react';

type BackArrowVariant = 'white' | 'red' | 'black';

type BackArrowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BackArrowVariant;  
  onClick?: () => void;
};

export const BackArrow: FC<BackArrowProps> = ({
  variant = 'black',
  onClick,
  ...rest
}: BackArrowProps) => {
  const srcMap: Record<BackArrowVariant, string> = {
    white: whiteArrow,
    red: redArrow,
    black: blackArrow,
  };

  const src = srcMap[variant];

  return (
    <button onClick={onClick} {...rest}>
      <img src={src} className='backArrow' />
    </button>
  );
};
