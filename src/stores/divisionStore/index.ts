import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DivisionState {
  division: string | null
  setDivision: (division: string) => void
  clearDivision: () => void
}

export const useDivisionStore = create<DivisionState>()(
  persist(
    (set) => ({
      division: null,
      setDivision: (division) => set({ division }),
      clearDivision: () => set({ division: null }),
    }),
    {
      name: 'division-store',
    }
  )
)