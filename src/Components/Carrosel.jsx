// src/components/Carrossel.jsx
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

function Carrossel() {
  return (
    <Swiper spaceBetween={10} slidesPerView={1} autoplay loop style={{ height: '300px' }}>
      <SwiperSlide><img src="https://source.unsplash.com/800x300/?church" alt="Slide 1" /></SwiperSlide>
      <SwiperSlide><img src="https://source.unsplash.com/800x300/?bible" alt="Slide 2" /></SwiperSlide>
      <SwiperSlide><img src="https://source.unsplash.com/800x300/?worship" alt="Slide 3" /></SwiperSlide>
    </Swiper>
  );
}

export default Carrossel;
