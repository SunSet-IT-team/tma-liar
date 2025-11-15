import './style/inputStyle.scss'
import clsx from 'clsx';

type Props = {
    placeholder: string;
    className?: string;
}

export const TextInput = ({ placeholder, className }: Props) => {
  return (
    <div className={clsx('wrapper', className)}>
       <input name='text' type='text' className='input' placeholder={placeholder} /> 
    </div>
  )
}