import { create } from "zustand";
import { persist } from "zustand/middleware";

type RegisterStepStore = {
  isFirstTime: boolean;
  setIsFirstTime: (value: boolean) => void;
};

export const useIsFirstRegister = create<RegisterStepStore>()(
  persist(
    (set) => ({
      isFirstTime: true,
      setIsFirstTime: (value) => set({ isFirstTime: value }),
    }),
    {
      name: "register-step-storage",
    }
  )
);
