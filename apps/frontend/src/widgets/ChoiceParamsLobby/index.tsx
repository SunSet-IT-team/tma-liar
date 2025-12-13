import clsx from "clsx";
import { FC, useState } from "react"
import { ValueScroller } from "../../shared/ui/ValueScroller";
import type { ReusedScrollerValues } from "../../shared/ui/ValueScroller";
import styles from './style/choiceStyle.module.scss'
import { Typography } from "../../shared/ui/Typography";

type ChoiceProps = {
  /**
    * Классические параметры для вертикального выбора (min, max, step, defaultValue)
  */
  reusedValues: ReusedScrollerValues
  /** 
   * текст выбора
  */
  choiceText: string;
  /** 
   * тип выбора (секунды, вопросы и т.д.)
  */
  choiceType: string;
  onChangeValue?: (value: number) => void
}

/** 
 * Отображение блока с вертикальным выбором и параметрами
*/
export const ChoiceParamsLobby: FC<ChoiceProps> = ({ reusedValues, choiceText, choiceType, onChangeValue }) => {
  


  return (
    <div className={styles.lobbyStyle}>
      <Typography className={styles.questionsText}>{choiceText}</Typography>
      <ValueScroller reusedValues={reusedValues} onChange={onChangeValue}>
        <Typography className={styles.scrollerType}>{choiceType}</Typography>
      </ValueScroller>
    </div>
  )
}