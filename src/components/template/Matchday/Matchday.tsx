import { fetchMatchs } from "@/services/getAllMatch";
import MatchdaySchedule from "@/components/organisms/MatchdaySchedule/MatchdaySchedule";

const Matchday = async () => {
  const matchdayData = await fetchMatchs();

  return (
    <div className="py-40 flex items-center flex-col gap-10">
      <MatchdaySchedule matchdayData={matchdayData} />
    </div>
  );
};

export default Matchday;
