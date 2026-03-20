import { type FC } from 'react';
import './style/decksStyle.scss';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Mousewheel } from 'swiper/modules';
import fallbackDeckCover from '/icons/blackPhoto.svg';
import type { Deck } from '@shared/types/deck';

import 'swiper/css';

type DecksProps = {
  decks: Deck[];
  loop?: boolean;
  onChangeActiveDeck?: (index: number) => void;
};

export const DecksBlock: FC<DecksProps> = ({ decks, loop = true, onChangeActiveDeck }) => {
  const safeLoop = loop && decks.length > 2;
  const safeRewind = !safeLoop && decks.length > 1;

  return (
    <div className="content">
      <Swiper
        modules={[Mousewheel]}
        direction="horizontal"
        slidesPerView={2.1}
        centeredSlides
        spaceBetween={70}
        touchEventsTarget="container"
        mousewheel={{ forceToAxis: true, releaseOnEdges: true }}
        className="swiper deckSwiper"
        loop={safeLoop}
        rewind={safeRewind}
        onSlideChange={(swiper: SwiperType) => {
          onChangeActiveDeck?.(swiper.realIndex);
        }}
      >
        {decks.map((deck, i) => (
          <SwiperSlide
            key={`${deck.id ?? i}-${deck.cover ?? 'no-cover'}`}
            className="swiperSlide deckSwiperSlide"
          >
            <div className="deckSlideItem">
              <img
                src={deck.cover || fallbackDeckCover}
                alt={`Deck cover ${i + 1}`}
                className="deckIcon"
                onError={(event) => {
                  event.currentTarget.src = fallbackDeckCover;
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
