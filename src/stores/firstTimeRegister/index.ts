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
      // NOTE: this used to share "register-step-storage" with the step store,
      // so the two stores kept overwriting each other's saved state (one cause
      // of the wizard jumping straight to the payment page). Own key now.
      name: "first-time-register-storage",
    }
  )
);
