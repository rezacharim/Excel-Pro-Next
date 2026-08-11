export const sendOtp = async (phoneNumber: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
    
    const data = await res.json();
  
    if (!res.ok) throw new Error(data.message || "Something went wrong");
    return data;
  };

export const sendEmailOtp = async (email: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/send-email-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Something went wrong");
    return data;
  };
