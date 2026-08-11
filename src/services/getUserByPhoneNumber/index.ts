

export const getUserByPhoneNumber = async (phone_number: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/phone/${phone_number}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    const data = await res.json();
  
    if (!res.ok) throw new Error(data.message || "Something went wrong");
    return data;
  };