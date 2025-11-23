import { FC, ReactNode, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from "swiper";

import 'swiper/css';
import './style/scroller.scss';

type ScrollerProps = {
  min?: number;
  max?: number;
  step?: number;
  loop?: boolean;
  onChange?: (value: number) => void;
  children?: ReactNode;
  defaultValue?: number;
}

export const ValueScroller: FC<ScrollerProps> = ({ min = 1, max = 100, step = 1, loop = true, onChange, children, defaultValue = 30 }) => {
  const [values, setValues] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const initialValue = (defaultValue - step) / step;

  useEffect(() => {
    const arr: number[] = [];
    for (let v = step; v <= max; v += step) {
      arr.push(v);
    }
    setValues(arr);

    const minIndex = arr.findIndex(v => v === min);
    setCurrentIndex(minIndex >= 0 ? minIndex : 0);
  }, [min, max, step]);

  
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
        }}
        onClick={() => {
          if (swiperInstance) {
            swiperInstance.slideNext();
          }
        }}
      >
        {values.map((value, i) => (
          <SwiperSlide key={i} className="swiperSlide scrollerSwiperSlide">
            <span className="slideItem">{value}</span>  
          </SwiperSlide>
        ))}
      </Swiper>
      {children}
    </div>
  )
}