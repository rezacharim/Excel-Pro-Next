export const verifyOtp = async (phone: string, otp: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phone, otp }),
    });
  
    if (!response.ok) throw new Error("Invalid or expired OTP");
  
    return await response.json();
  };

export const verifyEmailOtp = async (email: string, otp: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/verify-email-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) throw new Error("Invalid or expired code");

    return await response.json();
  };
