"use client";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

/**
 * ProgramCard Component
 * A card displaying program details such as age group, schedule, and game information.
 * @param {ProgramCardProps} props - Properties passed to ProgramCard component.
 */
interface ProgramCardProps {
  ageGroup: string;
  title?: string;
  backgroundClass: string;
  textColorClass: string;
  schedule: string[];
  gameInfo: string;
  tag: {
    icon: React.ReactNode;
    text: string;
    className: string;
  };
  imageSrc: string;
}

const ProgramCard: NextPage<ProgramCardProps> = ({
  ageGroup,
  backgroundClass,
  textColorClass,
  schedule,
  gameInfo,
  tag,
  imageSrc,
}) => {
  return (
    <div
      className={`relative rounded-3xl overflow-hidden ${backgroundClass} h-96`}
    >
      {/* Tag section: Display the program's label like 'Popular', 'Off', etc. */}
      {tag.text && (
        <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-[#BDBDBD52]">
          {tag.icon}
          <span className="text-sm font-medium">{tag.text}</span>
        </div>
      )}

      <div className="relative h-full">
        <div className="absolute bottom-0 right-0 h-full w-2/3 z-0">
          <div className="relative h-full w-full">
            <Image
              src={imageSrc}
              alt={`${ageGroup} character`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain object-right-bottom"
              loading="lazy"
            />
          </div>
        </div>

        <div className="relative z-10 p-6 h-full flex flex-col justify-between">
          <div></div>
          <div className={textColorClass}>
            <h3 className="text-3xl font-bold mb-4">{ageGroup}</h3>

            {/* Render program schedule dynamically */}
            {schedule.map((line, index) => (
              <p key={index} className="text-md">
                {line}
              </p>
            ))}

            <p className="text-lg">{gameInfo}</p>

            {/* Link to the program's detailed page */}
            <Link
              href={`/program/${ageGroup.toLowerCase().replace(/\s+/g, "")}`}
              aria-label={`Details about ${ageGroup} soccer program`}
              title={`Soccer training program for ${ageGroup}`}
            >
              <button className="mt-6 px-8 py-3 bg-primary text-white rounded-md font-medium hover:bg-[#c9281e] transition-colors">
                Detail
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramCard;
