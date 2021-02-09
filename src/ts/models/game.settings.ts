export interface GameSettings {
  threshold: number | 'default';
  asyncPlay: boolean;
  oGuessTime: number;
  dGuessTime: number;
  trackStats: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  threshold: 'default',
  asyncPlay: true,
  oGuessTime: 180 * 1000,
  dGuessTime: 120 * 1000,
  trackStats: true
};
