import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type RegisterStepStore = {
  step: number;
  setStep: (step: number) => void;
};

export const useRegisterStepStore = create<RegisterStepStore>()(
  persist(
    (set) => ({
      step: 1,
      setStep: (step) => set({ step }),
    }),
    {
      name: 'register-step-storage',
    }
  )
);