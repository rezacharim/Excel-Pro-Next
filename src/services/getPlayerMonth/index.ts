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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching player", error);
    return [];
  }
};
