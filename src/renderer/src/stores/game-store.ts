import { create } from 'zustand';
import type { PublicGameState } from '@shared/schemas/ipc-schemas';

type GameStore = {
  gameState: PublicGameState;
  setGameState: (state: PublicGameState) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  gameState: { status: 'waiting' },
  setGameState: (state) => set({ gameState: state }),
}));

let unsubscribe: (() => void) | undefined;

/** Call once, near app startup. Idempotent. */
export function connectGameStateSubscription(): void {
  if (unsubscribe) return;
  unsubscribe = window.advisor.subscribeToGameState((state) => {
    useGameStore.getState().setGameState(state);
  });
}
