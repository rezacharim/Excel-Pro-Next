
import { Player } from "./types";

export const fetchAllPlayerMonth = async (): Promise<Player[]> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/player_month`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 30,
        },
      }
    );

    const data: Player[] = await response.json();
    if (!Array.isArray(data)) return [];
    // The API returns oldest first, and the home page shows players[0].
    // Sort newest first so a freshly added Player of the Month appears
    // straight away instead of the very first one ever uploaded.
    return [...data].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error("Error fetching player", error);
    return [];
  }
};
