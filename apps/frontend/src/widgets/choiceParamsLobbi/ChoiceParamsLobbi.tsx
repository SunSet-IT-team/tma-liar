import clsx from "clsx";
import { FC } from "react"
import { ValueScroller } from "../../shared/ValueScroller/ValueScroller";
import type { ReusedScrollerValues } from "../../shared/ValueScroller/ValueScroller";
import styles from './style/choiceStyle.module.scss'

type ChoiceProps = {
  /**
    * классические параметры для вертикального выбора (min, max, step, defaultValue)
  */
  reusedValues: ReusedScrollerValues
  choiceText: string;
  choiceType: string;
}

export const ChoiceParamsLobbi: FC<ChoiceProps> = ({ reusedValues, choiceText, choiceType }) => {
  return (
    <div className={styles.lobbiStyle}>
      <span className={clsx(styles.lobbiText, styles.questionsText)}>{choiceText}</span>
      <ValueScroller reusedValues={reusedValues}>
        <span className={clsx(styles.lobbiText, styles.scrollerType)}>{choiceType}</span>
      </ValueScroller>
    </div>
  )
}