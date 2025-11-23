import { FC, useEffect, useState } from "react"
import './style/decksStyle.scss'
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from "swiper";
import deckIcon from '../../assets/icons/blackPhoto.svg'

import 'swiper/css';

type DecksProps = {
  count?: number;
  loop?: boolean;
}

export const DecksBlock: FC<DecksProps> = ({ count = 10, loop = true }) => {
  const [decksArr, setDecksArr] = useState<number[]>([]);

  useEffect(() => {
    const arr: number[] = [];

    for (let i = 0; i < count; i++) {
      arr.push(i + 1);
    }

    setDecksArr(arr);
  }, [])

  return (
    <div className="content">
      <Swiper
        direction={'horizontal'}
        slidesPerView={2.1}
        centeredSlides={true}
        spaceBetween={70}
        className="swiper deckSwiper"
        loop={loop}
      >
        {decksArr.map((value, i) => (
          <SwiperSlide key={i} className="swiperSlide deckSwiperSlide">
            <div className="deskSlideItem">
              <img src={deckIcon} alt="" className="deckIcon" />  
            </div>  
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
      
  )
}