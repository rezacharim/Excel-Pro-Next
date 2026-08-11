import { NextPage } from "next";


// ProgramInfo Component (Molecule that groups program details such as age group, schedule, and game info)
export const ProgramInfo: NextPage<{ ageGroup: string; schedule: string[]; gameInfo: string }> = ({
    ageGroup,
    schedule,
    gameInfo,
  }) => {
    return (
      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        <h3 className="text-3xl font-bold mb-4">{ageGroup}</h3>
        {schedule.map((line, index) => (
          <p key={index} className="text-md">{line}</p>
        ))}
        <p className="text-lg">{gameInfo}</p>
      </div>
    );
  };
  