"use client";

import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import {
  Activity as ActivityIcon,
  Ban,
  Loader2,
  PauseCircle,
  RefreshCw,
  Settings,
  UserCog,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  ActivityCategory,
  ActivityCategoryKey,
  ActivityEntry,
  ActivityGroup,
  ActivityResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const PAGE_SIZE = 50;
const SESSION_EXPIRED = "Your session expired — please sign in again.";

/** "Everyone" is an empty value so it can be dropped from the query string. */
const EVERYONE = "";

const CATEGORIES: ActivityCategory[] = [
  { key: "all", label: "All activity", prefix: "" },
  // Payments are a single action, so the filter uses the full action key.
  { key: "payments", label: "Payments", prefix: "membership.record-payment" },
  { key: "memberships", label: "Memberships", prefix: "membership" },
  { key: "admins", label: "Admin accounts", prefix: "admin" },
  { key: "settings", label: "Settings", prefix: "settings" },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date): number => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

/** Whole calendar days between a date and today (0 = today, 1 = yesterday). */
const daysAgo = (date: Date): number =>
  Math.round((startOfDay(new Date()) - startOfDay(date)) / MS_PER_DAY);

const parseDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const date = new Date(iso);
  return isNaN(date.getTime()) ? null : date;
};

/** "just now", "5 minutes ago", "3 hours ago", "yesterday", "12 Aug 2026". */
const timeAgo = (iso: string | null | undefined): string => {
  const date = parseDate(iso);
  if (!date) return "";
  // A negative difference means the server clock is slightly ahead of the
  // browser; that should read as "just now", not as a date in the future.
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "just now";

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const days = daysAgo(date);
  if (days === 0) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (days === 1) return "yesterday";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** Full timestamp shown in brackets after the relative time. */
const exactDateTime = (iso: string | null | undefined): string => {
  const date = parseDate(iso);
  if (!date) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const groupLabel = (date: Date): string => {
  const days = daysAgo(date);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

interface EntryIcon {
  icon: JSX.Element;
  bg: string;
}

const iconForAction = (action: string): EntryIcon => {
  const key = (action || "").toLowerCase();
  if (key.includes("payment")) {
    return {
      icon: <Wallet className="w-4 h-4 text-green-600" />,
      bg: "bg-green-100",
    };
  }
  if (key.includes("hold")) {
    return {
      icon: <PauseCircle className="w-4 h-4 text-amber-600" />,
      bg: "bg-amber-100",
    };
  }
  if (
    key.includes("suspend") ||
    key.includes("stop") ||
    key.includes("delete") ||
    key.includes("disable")
  ) {
    return { icon: <Ban className="w-4 h-4 text-red-600" />, bg: "bg-red-100" };
  }
  if (key.startsWith("admin")) {
    return {
      icon: <UserCog className="w-4 h-4 text-indigo-600" />,
      bg: "bg-indigo-100",
    };
  }
  if (key.startsWith("settings")) {
    return {
      icon: <Settings className="w-4 h-4 text-gray-500" />,
      bg: "bg-gray-100",
    };
  }
  return {
    icon: <ActivityIcon className="w-4 h-4 text-blue-600" />,
    bg: "bg-blue-100",
  };
};

/** Falls back to a readable version of the action key when details are empty. */
const headlineFor = (entry: ActivityEntry): string => {
  const details = (entry.details || "").trim();
  if (details) return details;
  const readable = (entry.action || "").replace(/[._-]+/g, " ").trim();
  const base = readable
    ? readable.charAt(0).toUpperCase() + readable.slice(1)
    : "Activity recorded";
  const target = (entry.targetName || "").trim();
  return target ? `${base} — ${target}` : base;
};

const Activity: NextPage = () => {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [actors, setActors] = useState<string[]>([]);
  const [adminFilter, setAdminFilter] = useState<string>(EVERYONE);
  const [categoryKey, setCategoryKey] = useState<ActivityCategoryKey>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const savedToken = Cookies.get("auth_token");

  const fetchActors = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/activity/actors`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!response.ok) return;
      const data: unknown = await response.json();
      setActors(
        Array.isArray(data)
          ? data.filter((name): name is string => typeof name === "string")
          : []
      );
    } catch (error) {
      // The dropdown simply falls back to "Everyone" — not worth an error state.
      console.error("Error fetching activity actors:", error);
    }
  }, [savedToken]);

  useEffect(() => {
    fetchActors();
  }, [fetchActors]);

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setLoadError(null);
        }

        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        if (adminFilter) params.set("admin", adminFilter);
        const prefix =
          CATEGORIES.find((category) => category.key === categoryKey)?.prefix ||
          "";
        if (prefix) params.set("action", prefix);

        const response = await fetch(`${API_URL}/activity?${params}`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (response.status === 401) {
          setLoadError(SESSION_EXPIRED);
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch activity");
        }

        const data: Partial<ActivityResponse> = await response.json();
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        const nextTotal =
          typeof data?.total === "number" && isFinite(data.total)
            ? data.total
            : offset + nextItems.length;

        setTotal(nextTotal);
        setItems((previous) => {
          if (!append) return nextItems;
          // New entries can be written while paging, which would otherwise
          // push a duplicate id into the list.
          const seen = new Set(previous.map((entry) => entry.id));
          return [
            ...previous,
            ...nextItems.filter((entry) => !seen.has(entry.id)),
          ];
        });
      } catch (error) {
        console.error("Error fetching activity:", error);
        setLoadError("Failed to load the activity log. Please try again.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [adminFilter, categoryKey, savedToken]
  );

  // Changing a filter starts the list again from the first page.
  useEffect(() => {
    setIsLoading(true);
    setItems([]);
    loadPage(0, false);
  }, [loadPage]);

  const groups = useMemo<ActivityGroup[]>(() => {
    const result: ActivityGroup[] = [];
    const byKey = new Map<string, ActivityGroup>();

    items.forEach((entry) => {
      const date = parseDate(entry.createdAt);
      const key = date ? String(startOfDay(date)) : "unknown";
      let group = byKey.get(key);
      if (!group) {
        group = {
          key,
          label: date ? groupLabel(date) : "Earlier",
          entries: [],
        };
        byKey.set(key, group);
        result.push(group);
      }
      group.entries.push(entry);
    });

    return result;
  }, [items]);

  const hasMore = items.length < total;
  const hasFilters = adminFilter !== EVERYONE || categoryKey !== "all";

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen rounded-lg">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Activity Log</h1>
          <p className="text-gray-500 text-sm md:text-base">
            Everything that has been changed in the dashboard, and who changed
            it.
          </p>
        </div>
        <button
          onClick={() => {
            setIsLoading(true);
            setItems([]);
            loadPage(0, false);
          }}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-60 shrink-0"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-64">
          <label
            htmlFor="activity-admin-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Admin
          </label>
          <select
            id="activity-admin-filter"
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value={EVERYONE}>Everyone</option>
            {actors.map((actor) => (
              <option key={actor} value={actor}>
                {actor}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-64">
          <label
            htmlFor="activity-category-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Activity
          </label>
          <select
            id="activity-category-filter"
            value={categoryKey}
            onChange={(e) =>
              setCategoryKey(e.target.value as ActivityCategoryKey)
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            {CATEGORIES.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading activity...</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <XCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-gray-700 mb-4">{loadError}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                loadPage(0, false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] text-sm"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <ActivityIcon className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500">
              {hasFilters
                ? "No activity matches these filters."
                : "No activity recorded yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 md:p-6">
              {groups.map((group) => (
                <div key={group.key} className="mb-6 last:mb-0">
                  <h2 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {group.label}
                  </h2>
                  <ol className="relative">
                    {group.entries.map((entry, index) => {
                      const { icon, bg } = iconForAction(entry.action);
                      const isLast = index === group.entries.length - 1;
                      const relative = timeAgo(entry.createdAt);
                      const exact = exactDateTime(entry.createdAt);
                      return (
                        <li key={entry.id} className="flex gap-3">
                          {/* Icon column doubles as the timeline rail */}
                          <div className="flex flex-col items-center shrink-0">
                            <div
                              className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center`}
                              aria-hidden="true"
                            >
                              {icon}
                            </div>
                            {!isLast && (
                              <div className="w-px flex-1 bg-gray-200 my-1" />
                            )}
                          </div>
                          <div className={isLast ? "pb-0" : "pb-5"}>
                            <p className="text-sm md:text-base text-gray-800">
                              {headlineFor(entry)}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                              {entry.adminUsername || "system"}
                              {relative ? ` · ${relative}` : ""}
                              {exact ? ` (${exact})` : ""}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>

            <div className="p-3 md:p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-gray-500 text-xs md:text-sm">
                Showing {items.length} of {total}
              </span>
              {hasMore && (
                <button
                  onClick={() => loadPage(items.length, true)}
                  disabled={isLoadingMore}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] transition-colors text-sm font-medium disabled:opacity-60"
                >
                  {isLoadingMore && (
                    <Loader2 className="animate-spin" size={16} />
                  )}
                  Load more
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Activity;
