"use client";
import { useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import MatchCard from "@/components/molecules/MatchCard/MatchCard";
import { Search, Calendar, List } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import MatchCalendar from "../MatchCalendar/MatchCalendar";
import AnimatedCard from "@/components/atoms/AnimatedCard/AnimatedCard";
import { MatchdayType } from "./types";

interface MatchdayScheduleProps {
  matchdayData: MatchdayType[];
}

const MatchdaySchedule: NextPage<MatchdayScheduleProps> = ({
  matchdayData,
}) => {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarMode, setCalendarMode] = useState(false);
  const router = useRouter();

  // Updated age group filter options
  const ageGroups = [
    { id: "all", label: "View all" },
    { id: "u5-u8", label: "U5 - U8" },
    { id: "u9-u12", label: "U9 - U12" },
    { id: "u13-u14", label: "U13 - U14" },
    { id: "u15-u18", label: "U15 - U18" },
  ];

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return (
      date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  // Filter matches based on selected age group and search query
  const filteredMatches = matchdayData.filter((match) => {
    // Filter by age group
    if (selectedAgeGroup !== "all") {
      const ageCategory = match.age_category.toUpperCase();

      if (selectedAgeGroup === "u5-u8") {
        // Check if the age category contains numbers between 5-8 or the range text
        const hasU5to8 =
          /U(5|6|7|8)\b/.test(ageCategory) ||
          ageCategory.includes("U5 - U8") ||
          ageCategory.includes("U5-U8");
        if (!hasU5to8) return false;
      }

      if (selectedAgeGroup === "u9-u12") {
        // Check if the age category contains numbers between 9-12 or the range text
        const hasU9to12 =
          /U(9|10|11|12)\b/.test(ageCategory) ||
          ageCategory.includes("U9 - U12") ||
          ageCategory.includes("U9-U12");
        if (!hasU9to12) return false;
      }

      if (selectedAgeGroup === "u13-u14") {
        // Check if the age category contains U13 or U14 or the range text
        const hasU13to14 =
          /U(13|14)\b/.test(ageCategory) ||
          ageCategory.includes("U13 - U14") ||
          ageCategory.includes("U13-U14");
        if (!hasU13to14) return false;
      }

      if (selectedAgeGroup === "u15-u18") {
        // Check if the age category contains numbers between 15-18 or the range text
        const hasU15to18 =
          /U(15|16|17|18)\b/.test(ageCategory) ||
          ageCategory.includes("U15 - U18") ||
          ageCategory.includes("U15-U18");
        if (!hasU15to18) return false;
      }
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      const team1 = (match.team1 || "").toLowerCase();
      const team2 = (match.team2 || "").toLowerCase();
      const location = (match.location || "").toLowerCase();
      const address = (match.address || "").toLowerCase();

      // Check if any of the fields contain the search query
      const matchesSearch =
        team1.includes(query) ||
        team2.includes(query) ||
        location.includes(query) ||
        address.includes(query);

      if (!matchesSearch) return false;
    }

    return true;
  });

  const toggleCalendarMode = () => {
    setCalendarMode(!calendarMode);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Filter Section */}
      <section className="mb-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {ageGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedAgeGroup(group.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedAgeGroup === group.id
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search teams, location, or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <Button
            onClick={toggleCalendarMode}
            className="flex items-center justify-center gap-2 rounded-lg"
          >
            {calendarMode ? (
              <>
                <List className="h-5 w-5" />
                <span>Show list mode</span>
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5" />
                <span>Show calendar mode</span>
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Matches Section */}
      <section className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {calendarMode ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <MatchCalendar
                selectedAgeGroup={selectedAgeGroup}
                searchQuery={searchQuery}
                matchdayData={matchdayData}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4 }}
            >
              {filteredMatches.length === 0 ? (
                <motion.div
                  key="no-matches-list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-10"
                >
                  <p className="text-lg text-gray-500">
                    No matches found. Try adjusting your filters.
                  </p>
                </motion.div>
              ) : (
                filteredMatches.map((match) => (
                  <AnimatedCard key={match.id}>
                    <div className="my-10 mx-5">
                      <MatchCard
                        ageGroup={match.age_category}
                        location={match.location}
                        teams={[match.team1, match.team2]}
                        date={formatDate(match.match_date)}
                        address={match.address}
                        id={match.id}
                      />
                    </div>
                  </AnimatedCard>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Contact Us Section */}
      <section className="mt-16 bg-gray-50 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
        <p className="text-gray-600 mb-6">
          Have questions about the schedule or need to report a change? Get in
          touch with our team.
        </p>
        <Button
          className="rounded-lg"
          onClick={() => router.push("contact-us")}
        >
          Contact Support
        </Button>
      </section>
    </div>
  );
};

export default MatchdaySchedule;
