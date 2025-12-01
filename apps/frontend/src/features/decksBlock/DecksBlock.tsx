import { FC, useEffect, useState } from "react"
import './style/decksStyle.scss'
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from "swiper";
import deckIcon from '../../assets/icons/blackPhoto.svg'

import 'swiper/css';

type DecksProps = {
  /**
    * количество колод
  */
  count?: number;
  /**
    * будет ли зациклен слайдер с колодами
  */
  loop?: boolean;
}

/** 
 * отображение подключившихся игроков
 * используется на странице ожидания игроков в лобби
 * @see WaitingLobbi
*/

export const DecksBlock: FC<DecksProps> = ({ count = 10, loop = true }) => {
  const [decksArr, setDecksArr] = useState<number[]>([]);

  // useEffect тут нужен, чтобы цикл производился один раз на момент создания компонента
  useEffect(() => {
    // Тестовый массив, в котором хранится количество колод 
    const arr: number[] = [];

    // Цикл, через который в массив попадает количество колод, указанное в count
    for (let i = 0; i < count; i++) {
      arr.push(i + 1);
    }

    // Записываем массив arr в desksArr, чтобы использовать его вне useEffect
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