"use client";
import { useState } from "react";
import Slider from "../Slider/Slider";
import RezaCard from "../../molecules/RezaCard/RezaCard";
import IndicatorDots from "../../molecules/IndicatorDots/IndicatorDots";
import { motion } from "framer-motion";
import { usePlayers } from "@/context/PlayerContext/PlayerContext";
// import { sliderData } from "../Slider/data";

const Billboard = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const players = usePlayers();
  const slideCount = players.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 11 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="flex flex-col md:flex-row md:space-x-6 w-full h-[500px] relative">
        <Slider currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} />
        <RezaCard />
      </div>
      <div className="flex justify-center">
        <IndicatorDots
          slideCount={slideCount}
          currentSlide={currentSlide}
          goToSlide={setCurrentSlide}
        />
      </div>
    </motion.div>
  );
};

export default Billboard;
