export const getUserByEmail = async (email: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/email/${encodeURIComponent(
      email
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};
