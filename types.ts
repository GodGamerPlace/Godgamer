export type Emotion = 'idle' | 'thinking' | 'happy' | 'confused' | 'confident' | 'celebrate';

export type GameState = 'start' | 'playing' | 'won' | 'lost' | 'error' | 'reveal';

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
