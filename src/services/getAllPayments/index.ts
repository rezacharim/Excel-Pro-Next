// services/getAllPayments.ts

export interface Payment {
    amount: number;
    currency: string;
    status: "succeeded" | "pending" | "failed";
    phone_number: string;
    fullname: string;
    userEmail: string;
    subscriptionPlan: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export const getAllPayments = async (token: string): Promise<Payment[]> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Make sure we handle date objects correctly
      const payments = data.map((payment: Payment) => ({
        ...payment,
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
      }));
      
      return payments;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  };