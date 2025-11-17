import { useEffect, useState } from "react";
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
}

export const ValueScroller = ({ min = 1, max = 100, step = 1, loop = true, onChange }: ScrollerProps) => {
  const [values, setValues] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

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
    <Swiper
        direction={'vertical'}
        className="swiper"
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
          <SwiperSlide key={i} className="swiperSlide">
            <span className="slideItem">{value}</span>  
          </SwiperSlide>
        ))}
      </Swiper>
  )
}