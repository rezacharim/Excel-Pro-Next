import { NextPage } from "next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/swiper-bundle.css"; // Make sure the Swiper styles are imported
import Image from "next/image";

interface TeamImages {
  id: string;
  title: string;
  file_name: string;
  storage_filename: string;
  image_url: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  caption: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SliderProps {
  teamImages: TeamImages[];
  spaceBetween?: number;
  slidesPerView?: number | { 640?: number; 768?: number; 1024?: number };
  autoplayDelay?: number;
  loop?: boolean;
}

const TeamSlider: NextPage<SliderProps> = ({ teamImages }) => {
  return (
    <>
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 16 },
          768: { slidesPerView: 3, spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 16 },
        }}
        navigation={false}
        pagination={false}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        loop
        speed={800}
        className="team-swiper py-4"
      >
        {teamImages.map((image, index) => (
          <SwiperSlide key={`team-${image.id}`}>
            <div className="rounded-lg overflow-hidden shadow-md">
              <Image
                src={image.image_url}
                alt={image.title ? image.title : image.file_name}
                width={500}
                height={300}
                className="w-full h-auto"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                loading={index === 0 ? "eager" : "lazy"} // 🔥 این خط اضافه شده
                priority={index === 0} // برای اطمینان بیشتر که عکس اول زودتر لود شه
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
};

export default TeamSlider;
