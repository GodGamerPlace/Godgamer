export type Emotion = 'idle' | 'thinking' | 'happy' | 'confused' | 'confident' | 'celebrate';

export type GameState = 'start' | 'playing' | 'won' | 'lost' | 'error' | 'reveal';

export type UserRole = 'user' | 'owner';

export interface User {
  username: string;
  passwordHash: string; // Simple hash for privacy
  role: UserRole;
  score: number;
  gamesPlayed: number;
  isBanned: boolean;
  createdAt: number;
}

export interface GameResponse {
  type: 'question' | 'guess';
  content: string;
  emotion: Emotion;
  thinking?: string; // Optional internal thought process
  confidence?: number; // 0-100 percentage
  options?: string[]; // Dynamic options for the user to choose from
}

export interface HistoryItem {
  role: 'user' | 'model';
  text: string;
}