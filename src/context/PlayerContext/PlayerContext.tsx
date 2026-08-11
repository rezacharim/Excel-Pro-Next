'use client';
import { createContext, useContext, ReactNode } from 'react';
import { Player } from '@/services/getPlayerMonth/types';


const PlayerContext = createContext<Player[]>([]);

export const usePlayers = () => useContext(PlayerContext);

interface PlayerProviderProps {
  players: Player[];
  children: ReactNode;
}

export const PlayerProvider = ({ players, children }: PlayerProviderProps) => {
  return (
    <PlayerContext.Provider value={players || []}>
      {children}
    </PlayerContext.Provider>
  );
};