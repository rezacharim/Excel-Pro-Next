import { NextPage } from "next";
import Image from "next/image";

interface SlideProps {
  player_name?: string;
  image_url?: string;
}

const Slide: NextPage<SlideProps> = ({ player_name, image_url }) => {
  // Check if player_name exists and is not "Default" or "Default Player"
  const shouldShowPlayerName = player_name && 
    player_name !== "Default" && 
    player_name !== "Default Player";
  
  return (
    <div className="min-w-full h-full relative flex-shrink-0">
      <Image
        src={image_url ? `${image_url}` : "/images/billboard/teams2.jpeg"}
        alt={shouldShowPlayerName ? `${player_name} player image` : "Team image"}
        quality="100"
        fill={true}
        priority={true}
      />
      {shouldShowPlayerName && (
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6">
          <h2 className="text-white text-3xl font-bold drop-shadow-lg">
            {player_name}
          </h2>
        </div>
      )}
    </div>
  );
};

export default Slide;