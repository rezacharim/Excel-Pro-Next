"use client";
import { Dispatch, SetStateAction, useEffect } from "react";
import { NextPage } from "next";
import Slide from "../../molecules/Slide/Slide";
import ArrowButton from "../../atoms/ArrowButton/ArrowButton";
import { usePlayers } from "@/context/PlayerContext/PlayerContext";

interface SliderProps {
  currentSlide: number;
  setCurrentSlide: Dispatch<SetStateAction<number>>;
}

const Slider: NextPage<SliderProps> = ({ currentSlide, setCurrentSlide }) => {
  const players = usePlayers();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % players.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [setCurrentSlide, players.length]);

  // If players are empty, show a default slide
  const hasPlayers = players.length > 0;

  return (
    <div className="relative w-min-full md:w-3/4 h-full min-h-[250px] sm:min-h-[250px] md:min-h-[500px] bg-gray-900 rounded-lg shadow-xl overflow-hidden">
      <div
        className={`flex h-full transition-transform duration-500 ease-in-out -translate-x-[ ${
          currentSlide * 100
        }%]`}
      >
        {hasPlayers ? (
          players.map((player) => <Slide key={player.id} {...player} />)
        ) : (
          <Slide
            key="default"
            player_name="Default Player"
            image_url="/images/billboard/teams2.jpeg"
          />
        )}
      </div>

      {players.length > 1 && (
        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 transform -translate-y-1/2">
          <ArrowButton
            direction="left"
            onClick={() =>
              setCurrentSlide(
                (prev: number) => (prev - 1 + players.length) % players.length
              )
            }
          />
          <ArrowButton
            direction="right"
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % players.length)
            }
          />
        </div>
      )}
    </div>
  );
};

export default Slider;
