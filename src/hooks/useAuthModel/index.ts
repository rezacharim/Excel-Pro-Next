import { create } from "zustand";
import Cookies from 'js-cookie';

interface AuthState {
  loading: boolean;
  error: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const useAuthModel = create<AuthState>((set) => ({
  loading: false,
  error: null,
  token: Cookies.get('auth_token') || null,
  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { token } = await response.json();

      Cookies.set('auth_token', token, {
        expires: 2,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      set({ token, loading: false });

    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'An unexpected error occurred',
        loading: false
      });
    }
  },
  logout: () => {
    Cookies.remove('auth_token', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    set({ token: null, error: null });
  }
}));

export default useAuthModel;