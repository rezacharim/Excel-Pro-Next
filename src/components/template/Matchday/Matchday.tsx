import Link from "next/link";
import SubscribeCalendar from "@/components/molecules/SubscribeCalendar/SubscribeCalendar";
import {
  fixtureDay,
  fixtureDayNumber,
  fixtureMonthShort,
  fixtureTime,
  getRecentFixtures,
  getTeams,
  getUpcomingFixtures,
  kickoffDate,
  teamName,
  type Fixture,
  type Team,
} from "@/services/fixtures";

/** Games grouped under the day they are played. */
const byDay = (fixtures: Fixture[]) => {
  const groups = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const key = kickoffDate(f.kickoff).toDateString();
    const list = groups.get(key);
    if (list) list.push(f);
    else groups.set(key, [f]);
  }
  return Array.from(groups.entries());
};

const resultTone = (f: Fixture): { label: string; className: string } => {
  if (f.ourScore == null || f.theirScore == null) {
    return { label: "Played", className: "bg-gray-100 text-gray-600" };
  }
  if (f.ourScore > f.theirScore) {
    return { label: "Won", className: "bg-green-50 text-green-700" };
  }
  if (f.ourScore < f.theirScore) {
    return { label: "Lost", className: "bg-red-50 text-red-700" };
  }
  return { label: "Drew", className: "bg-amber-50 text-amber-700" };
};

const Row = ({ fixture, teams }: { fixture: Fixture; teams: Team[] }) => (
  <li className="flex items-center gap-4 border-b border-gray-100 px-4 py-3.5 last:border-b-0 sm:px-6">
    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#020022] text-white">
      <span className="text-base font-extrabold leading-none">
        {fixtureDayNumber(fixture.kickoff)}
      </span>
      <span className="text-[9px] uppercase tracking-[0.09em] opacity-85">
        {fixtureMonthShort(fixture.kickoff)}
      </span>
    </span>

    <span className="min-w-0 flex-1">
      <span className="block text-[15px] font-bold text-[#020022]">
        <span className="mr-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-extrabold text-gray-600">
          {fixture.ageGroup}
        </span>
        {teamName(fixture.ageGroup, teams, fixture.teamId)}{" "}
        <span className="font-normal text-gray-400">
          {fixture.isHome ? "vs" : "at"}
        </span>{" "}
        {fixture.opponent}
      </span>
      <span className="mt-0.5 block text-xs text-gray-500">
        {fixtureTime(fixture.kickoff)} · {fixture.venue || "Venue TBD"}
        {fixture.competition ? ` · ${fixture.competition}` : ""}
      </span>
    </span>

    {fixture.ourScore != null && fixture.theirScore != null ? (
      <span className="shrink-0 text-right">
        <span className="block text-lg font-extrabold text-[#020022]">
          {fixture.ourScore}&ndash;{fixture.theirScore}
        </span>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
            resultTone(fixture).className
          }`}
        >
          {resultTone(fixture).label}
        </span>
      </span>
    ) : (
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${
          fixture.isHome
            ? "bg-green-50 text-green-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {fixture.isHome ? "HOME" : "AWAY"}
      </span>
    )}
  </li>
);

const Matchday = async () => {
  const [upcoming, recent, teams] = await Promise.all([
    getUpcomingFixtures(),
    getRecentFixtures(12),
    getTeams(),
  ]);

  const groups = byDay(upcoming);

  return (
    <section className="bg-gray-50">
      <div className="bg-[#020022] text-white">
        <div className="mx-auto max-w-4xl px-4 pb-14 pt-8 sm:px-6">
          <div className="mb-6 flex items-center text-sm text-gray-400">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-[#E43125]">Matchday</span>
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
            Excel Pro Soccer Academy
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Fixtures &amp; results</h1>
          <p className="mt-3 max-w-2xl text-gray-300">
            Every game across our teams. Times and fields come from the league
            and can change late in the week — we update them as they do.
          </p>
          {/* Offered right under that warning on purpose: a subscribed
              calendar is how a parent finds out a kick-off moved without
              having to remember to come back and look. */}
          <SubscribeCalendar teams={teams} />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        {upcoming.length === 0 && recent.length === 0 ? (
          <div className="mt-10 rounded-xl border border-gray-200 bg-white px-4 py-16 text-center text-gray-600 shadow-sm">
            No fixtures published yet — check back once the season schedule is
            out.
          </div>
        ) : (
          <>
            {groups.length > 0 && (
              <div className="-mt-8">
                {groups.map(([day, games]) => (
                  <div key={day} className="mb-6">
                    <p className="mb-2 px-1 text-sm font-bold uppercase tracking-[0.1em] text-gray-500">
                      {fixtureDay(games[0].kickoff)}
                    </p>
                    <ul className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                      {games.map((f) => (
                        <Row key={f.id} fixture={f} teams={teams} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {recent.length > 0 && (
              <div className={groups.length > 0 ? "mt-12" : "mt-10"}>
                <h2 className="mb-4 text-2xl font-bold text-[#020022]">
                  Recent results
                </h2>
                <ul className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                  {recent.map((f) => (
                    <Row key={f.id} fixture={f} teams={teams} />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Matchday;
