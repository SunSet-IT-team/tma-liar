import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC, ReactNode } from 'react';
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
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const onChangeRef = useRef(onChange);
  const lastReportedIndexRef = useRef<number | null>(null);
  const suppressSlideSoundRef = useRef(false);
  const userInteractionRef = useRef(false);
  const normalizedMin = Math.min(min, max);
  const normalizedMax = Math.max(min, max);
  const values = useMemo(() => {
    const arr: number[] = [];
    for (let v = normalizedMin; v <= normalizedMax; v += step) {
      arr.push(v);
    }
    return arr;
  }, [normalizedMin, normalizedMax, step]);

  const initialValue = useMemo(() => {
    if (values.length === 0) return 0;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    values.forEach((value, index) => {
      const distance = Math.abs(value - defaultValue);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }, [values, defaultValue]);
  const isLoopEnabled = loop && values.length > 2;

  const playSound = usePlaySound();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!swiperInstance || values.length === 0) return;

    suppressSlideSoundRef.current = true;
    if (isLoopEnabled) {
      swiperInstance.slideToLoop(initialValue, 0, false);
    } else {
      swiperInstance.slideTo(initialValue, 0, false);
    }
    requestAnimationFrame(() => {
      suppressSlideSoundRef.current = false;
    });

    const selected = values[initialValue];
    if (selected !== undefined) {
      lastReportedIndexRef.current = initialValue;
      onChangeRef.current?.(selected);
    }
  }, [swiperInstance, values, initialValue, isLoopEnabled]);

  return (
    <div className="scrollerContent">
      <Swiper
        onMouseDown={() => {
          userInteractionRef.current = true;
        }}
        direction={'vertical'}
        className="swiper scrollerSwiper"
        initialSlide={initialValue}
        slidesPerView={1}
        centeredSlides={true}
        speed={250}
        loop={isLoopEnabled}
        onSwiper={setSwiperInstance}
        onSlideChange={(swiper: SwiperType) => {
          const index = swiper.realIndex;
          if (lastReportedIndexRef.current === index) return;
          const selected = values[index];
          if (selected === undefined) return;
          lastReportedIndexRef.current = index;
          onChangeRef.current?.(selected); // realIndex — индекс с учётом loop
          if (!suppressSlideSoundRef.current && userInteractionRef.current) {
            playSound();
            userInteractionRef.current = false;
          }
        }}
        onTouchStart={() => {
          userInteractionRef.current = true;
        }}
        onSliderMove={() => {
          userInteractionRef.current = true;
        }}
      >
        {values.map((value, i) => (
          <SwiperSlide key={i} className="swiperSlide scrollerSwiperSlide">
            <Typography variant="titleMiniLarge" className="scrollerValue">
              {value}
            </Typography>
          </SwiperSlide>
        ))}
      </Swiper>
      {children}
    </div>
  );
};
