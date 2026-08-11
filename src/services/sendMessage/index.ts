// src/services/sendMessage.ts

interface MessageData {
    name: string;
    email: string;
    subject: string;
    message: string;
  }
  
  interface MessageResponse {
    success: boolean;
    data?: MessageData;
    error?: string;
  }
  
  /**
   * Sends a message to the API
   * @param messageData The message data to send
   * @returns A promise that resolves to the response with success status
   */
  export const sendMessage = async (messageData: MessageData): Promise<MessageResponse> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }