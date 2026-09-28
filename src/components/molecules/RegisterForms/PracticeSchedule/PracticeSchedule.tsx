import {
  ACADEMY_GROUPS,
  CURRENT_SEASON,
  VENUE,
  scheduleLines,
} from "@/data/academy";

/** Training times shown on the register form — same source as /program. */
const PracticeSchedule = () => {
  return (
    <div className="mt-6 mb-4">
      <h2 className="text-lg font-semibold mb-3">
        Practice Days and Schedule Time
      </h2>
      <p className="mb-2">
        Location: {VENUE.name}, {VENUE.address}
      </p>
      <p className="mb-4">
        {CURRENT_SEASON.name} starts {CURRENT_SEASON.startsOn} — two sessions
        a week for every age group
      </p>

      <div className="border rounded-lg shadow-sm overflow-hidden">
        {ACADEMY_GROUPS.map((g) => (
          <div key={g.key}>
            <div className="bg-gray-100 p-3 border-b">
              <h3 className="font-medium">Group {g.label}</h3>
            </div>
            <div className="p-3 border-b">
              {scheduleLines(g).map((line) => (
                <p key={line} className="mb-1">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-gray-100 p-3">
          <h3 className="font-medium">Games Day</h3>
        </div>
        <div className="p-3">
          <p>League schedules are provided to each team — hours may vary.</p>
        </div>
      </div>
    </div>
  );
};

export default PracticeSchedule;
