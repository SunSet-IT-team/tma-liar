import { type FC, ReactNode, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import './style/scroller.scss';
import { usePlaySound } from '../../lib/sound/usePlaySound';
import { Typography } from '../Typography';

export type ReusedScrollerValues = {
  /**
   * Минимальное значение вертикального выбора
   */
  min?: number;
  /**
   * Максимальное значение вертикального выбора
   */
  max?: number;
  /**
   * Промежуток между значениями
   */
  step?: number;
  /**
   * Изначально, отображаемое значение
   */
  defaultValue?: number;
};

type ScrollerProps = {
  /**
   * Классические параметры для вертикального выбора (min, max, step, defaultValue)
   */
  reusedValues: ReusedScrollerValues;
  /**
   * Будет ли зациклен вертикального выбор
   */
  loop?: boolean;
  onChange?: (value: number) => void;
  children?: ReactNode;
};

/**
 * Отображение вертикального выбора
 * Используется для задачи параметров при создании лобби
 */
export const ValueScroller: FC<ScrollerProps> = ({
  reusedValues: { min = 1, max = 100, step = 1, defaultValue = 30 },
  loop = true,
  onChange,
  children,
}) => {
  const [values, setValues] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const initialValue = (defaultValue - step) / step;

  // Получаем массив значений вертикального выбора
  useEffect(() => {
    const arr: number[] = [];
    for (let v = step; v <= max; v += step) {
      arr.push(v);
    }
    setValues(arr);

    const minIndex = arr.findIndex((v) => v === min);
    setCurrentIndex(minIndex >= 0 ? minIndex : 0);
  }, [min, max, step]);

  const playSound = usePlaySound();

  return (
    <div className="scrollerContent">
      <Swiper
        direction={'vertical'}
        className="swiper scrollerSwiper"
        initialSlide={initialValue}
        loop={loop}
        onSwiper={setSwiperInstance}
        onSlideChange={(swiper: SwiperType) => {
          const index = swiper.realIndex;
          onChange?.(values[index]); // realIndex — индекс с учётом loop
          playSound();
        }}
        onClick={() => {
          if (swiperInstance) {
            swiperInstance.slideNext(); // Делаем перелистывание на следующее значение при клике
          }
        }}
      >
        {values.map((value, i) => (
          <SwiperSlide key={i} className="swiperSlide scrollerSwiperSlide">
            <Typography variant="titleMiniLarge">{value}</Typography>
          </SwiperSlide>
        ))}
      </Swiper>
      {children}
    </div>
  );
};
