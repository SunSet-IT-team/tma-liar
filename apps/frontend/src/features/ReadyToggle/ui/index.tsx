import type { FC } from 'react';
import { Button } from '../../../shared/ui/Button';

type ReadyToggleProps = {
  ready: boolean;
  onToggle: () => void;
  className?: string;
  disabled?: boolean;
  readyText?: string;
  notReadyText?: string;
};

/**
 * Кнопка переключения готовности игрока в лобби.
 */
export const ReadyToggle: FC<ReadyToggleProps> = ({
  ready,
  onToggle,
  className,
  disabled,
  readyText = 'Я не готов',
  notReadyText = 'Я готов',
}) => {
  return (
    <Button className={className} onClick={onToggle} disabled={disabled}>
      {ready ? readyText : notReadyText}
    </Button>
  );
};
