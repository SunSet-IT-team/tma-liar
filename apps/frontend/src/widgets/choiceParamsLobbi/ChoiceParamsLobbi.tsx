import clsx from "clsx";
import { FC } from "react"
import { ValueScroller } from "../../shared/ValueScroller/ValueScroller";
import styles from './style/choiceStyle.module.scss'

type ChoiceProps = {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  choiceText: string;
  choiceType: string;
}

export const ChoiceParamsLobbi: FC<ChoiceProps> = ({ min, max, step, defaultValue, choiceText, choiceType }) => {
  return (
    <div className={styles.lobbiStyle}>
      <span className={clsx(styles.lobbiText, styles.questionsText)}>{choiceText}</span>
      <ValueScroller min={min} max={max} step={step} defaultValue={defaultValue}>
        <span className={clsx(styles.lobbiText, styles.scrollerType)}>{choiceType}</span>
      </ValueScroller>
    </div>
  )
}