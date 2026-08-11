"use client";
import { useState, useEffect } from "react";
import { NextPage } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { MatchdayType } from "../MatchdaySchedule/types";

interface CalendarViewProps {
  selectedAgeGroup: string;
  searchQuery: string;
  matchdayData?: MatchdayType[];
}

const MatchCalendar: NextPage<CalendarViewProps> = ({
  selectedAgeGroup,
  searchQuery,
  matchdayData = [],
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [processedMatches, setProcessedMatches] = useState<MatchdayType[]>([]);
  const [calendarDays, setCalendarDays] = useState<
    Array<{
      day: number;
      isCurrentMonth: boolean;
      hasU5to8: boolean;
      hasU9to12: boolean;
      hasU13to14: boolean;
      hasU15to18: boolean;
    }>
  >([]);
  const [hasFilteredMatches, setHasFilteredMatches] = useState(true);

  // Process and filter matches when data, filters, or search query changes
  useEffect(() => {
    if (!matchdayData || matchdayData.length === 0) {
      setProcessedMatches([]);
      setHasFilteredMatches(false);
      return;
    }

    const filtered = matchdayData.filter((match) => {
      // Make sure match has all required properties
      if (
        !match ||
        !match.age_category ||
        !match.team1 ||
        !match.team2 ||
        !match.match_date
      ) {
        return false;
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

    console.log("Number of matches after filtering:", filtered.length);
    setProcessedMatches(filtered);
    setHasFilteredMatches(filtered.length > 0);
  }, [matchdayData, searchQuery]);

  // Generate calendar days when month or processed matches change
  useEffect(() => {
    console.log("Generating calendar days...");
    const days = generateCalendar();
    setCalendarDays(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, processedMatches]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Reset to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Check if a match belongs to a specific age group
  const checkAgeGroup = (ageCategory: string) => {
    if (!ageCategory)
      return { isU5to8: false, isU9to12: false, isU13to14: false, isU15to18: false };

    ageCategory = ageCategory.toUpperCase();

    const isU5to8 =
      /U(5|6|7|8)\b/.test(ageCategory) ||
      ageCategory.includes("U5 - U8") ||
      ageCategory.includes("U5-U8");

    const isU9to12 =
      /U(9|10|11|12)\b/.test(ageCategory) ||
      ageCategory.includes("U9 - U12") ||
      ageCategory.includes("U9-U12");

    const isU13to14 =
      /U(13|14)\b/.test(ageCategory) ||
      ageCategory.includes("U13 - U14") ||
      ageCategory.includes("U13-U14");

    const isU15to18 =
      /U(15|16|17|18)\b/.test(ageCategory) ||
      ageCategory.includes("U15 - U18") ||
      ageCategory.includes("U15-U18");

    return { isU5to8, isU9to12, isU13to14, isU15to18 };
  };

  // Generate calendar structure
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    console.log(`Building calendar for ${month + 1}/${year}`);

    // First day of month in week (0 = Sunday, 6 = Saturday)
    const firstDay = new Date(year, month, 1).getDay();

    // Last day of month
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Last day of previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const daysArray: Array<{
      day: number;
      isCurrentMonth: boolean;
      hasU5to8: boolean;
      hasU9to12: boolean;
      hasU13to14: boolean;
      hasU15to18: boolean;
    }> = [];

    // Previous month days that appear in first week
    for (let i = 0; i < firstDay; i++) {
      const day = prevMonthLastDay - firstDay + i + 1;

      // Check for age group matches on this day
      let hasU5to8 = false;
      let hasU9to12 = false;
      let hasU13to14 = false;
      let hasU15to18 = false;

      if (Array.isArray(processedMatches)) {
        processedMatches.forEach((match) => {
          if (!match || !match.match_date || !match.age_category) return;

          try {
            const matchDate = new Date(match.match_date);
            if (
              matchDate.getDate() === day &&
              matchDate.getMonth() === month - 1 &&
              matchDate.getFullYear() === (month === 0 ? year - 1 : year)
            ) {
              const { isU5to8, isU9to12, isU13to14, isU15to18 } = checkAgeGroup(
                match.age_category
              );
              if (isU5to8) hasU5to8 = true;
              if (isU9to12) hasU9to12 = true;
              if (isU13to14) hasU13to14 = true;
              if (isU15to18) hasU15to18 = true;
            }
          } catch (e) {
            console.error("Error parsing date:", e);
          }
        });
      }

      daysArray.push({
        day,
        isCurrentMonth: false,
        hasU5to8,
        hasU9to12,
        hasU13to14,
        hasU15to18,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay; i++) {
      // Check for age group matches on this day
      let hasU5to8 = false;
      let hasU9to12 = false;
      let hasU13to14 = false;
      let hasU15to18 = false;

      if (Array.isArray(processedMatches)) {
        processedMatches.forEach((match) => {
          if (!match || !match.match_date || !match.age_category) return;

          try {
            const matchDate = new Date(match.match_date);
            if (
              matchDate.getDate() === i &&
              matchDate.getMonth() === month &&
              matchDate.getFullYear() === year
            ) {
              const { isU5to8, isU9to12, isU13to14, isU15to18 } = checkAgeGroup(
                match.age_category
              );
              if (isU5to8) hasU5to8 = true;
              if (isU9to12) hasU9to12 = true;
              if (isU13to14) hasU13to14 = true;
              if (isU15to18) hasU15to18 = true;
            }
          } catch (e) {
            console.error("Error parsing date:", e);
          }
        });
      }

      daysArray.push({
        day: i,
        isCurrentMonth: true,
        hasU5to8,
        hasU9to12,
        hasU13to14,
        hasU15to18,
      });
    }

    // Next month days to complete the last week
    const remainingCells = 42 - daysArray.length; // Always show 6 rows (6 * 7 = 42)
    for (let i = 1; i <= remainingCells; i++) {
      // Check for age group matches on this day
      let hasU5to8 = false;
      let hasU9to12 = false;
      let hasU13to14 = false;
      let hasU15to18 = false;

      if (Array.isArray(processedMatches)) {
        processedMatches.forEach((match) => {
          if (!match || !match.match_date || !match.age_category) return;

          try {
            const matchDate = new Date(match.match_date);
            if (
              matchDate.getDate() === i &&
              matchDate.getMonth() === month + 1 &&
              matchDate.getFullYear() === (month === 11 ? year + 1 : year)
            ) {
              const { isU5to8, isU9to12, isU13to14, isU15to18 } = checkAgeGroup(
                match.age_category
              );
              if (isU5to8) hasU5to8 = true;
              if (isU9to12) hasU9to12 = true;
              if (isU13to14) hasU13to14 = true;
              if (isU15to18) hasU15to18 = true;
            }
          } catch (e) {
            console.error("Error parsing date:", e);
          }
        });
      }

      daysArray.push({
        day: i,
        isCurrentMonth: false,
        hasU5to8,
        hasU9to12,
        hasU13to14,
        hasU15to18,
      });
    }

    return daysArray;
  };

  // Format month and year
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Group days into weeks
  const weeks: Array<Array<(typeof calendarDays)[0]>> = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Get today's date to highlight current day
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === currentMonth.getMonth() &&
    today.getFullYear() === currentMonth.getFullYear();
  const currentDay = today.getDate();

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-2xl font-bold">{formatMonthYear(currentMonth)}</h2>
        <div className="flex space-x-2">
          <Button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            onClick={goToCurrentMonth}
            className="px-3 py-1 text-sm rounded-lg"
            aria-label="Current month"
          >
            Today
          </Button>
          <Button
            onClick={goToNextMonth}
            className="p-2 rounded-full"
            aria-label="Next month"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center py-2 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-1">
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="grid grid-cols-7 border-b last:border-b-0"
          >
            {week.map((dayData, dayIndex) => {
              // Determine if this is today
              const isToday =
                isCurrentMonth &&
                dayData.isCurrentMonth &&
                dayData.day === currentDay;

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`relative min-h-[100px] p-1 border-r last:border-r-0 ${
                    !dayData.isCurrentMonth
                      ? "bg-gray-50 text-gray-400"
                      : isToday
                      ? "bg-white"
                      : "bg-white"
                  }`}
                >
                  {/* Day number */}
                  <div className="text-right p-1">
                    {isToday ? (
                      <span className="bg-primary font-bold text-white rounded-full w-7 h-7 inline-flex items-center justify-center">
                        {dayData.day}
                      </span>
                    ) : (
                      dayData.day
                    )}
                  </div>

                  {/* Age group indicators */}
                  <div className="mt-1 space-y-1 text-xs">
                    {dayData.isCurrentMonth && (
                      <>
                        {dayData.hasU5to8 && (
                          <div
                            className={`px-1 py-0.5 rounded ${
                              selectedAgeGroup === "u5-u8" ||
                              selectedAgeGroup === "all"
                                ? "bg-green-100 text-green-800 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            U5-U8
                          </div>
                        )}
                        {dayData.hasU9to12 && (
                          <div
                            className={`px-1 py-0.5 rounded ${
                              selectedAgeGroup === "u9-u12" ||
                              selectedAgeGroup === "all"
                                ? "bg-indigo-100 text-indigo-900 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            U9-U12
                          </div>
                        )}
                        {dayData.hasU13to14 && (
                          <div
                            className={`px-1 py-0.5 rounded ${
                              selectedAgeGroup === "u13-u14" ||
                              selectedAgeGroup === "all"
                                ? "bg-orange-100 text-orange-700 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            U13-U14
                          </div>
                        )}
                        {dayData.hasU15to18 && (
                          <div
                            className={`px-1 py-0.5 rounded ${
                              selectedAgeGroup === "u15-u18" ||
                              selectedAgeGroup === "all"
                                ? "bg-red-100 text-red-700 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            U15-U18
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* No matches notice */}
      {!hasFilteredMatches && (
        <div className="p-4 text-amber-700 bg-amber-50 border-t text-center">
          No matches found for the current filters. Try adjusting your filters.
        </div>
      )}
    </div>
  );
};

export default MatchCalendar;