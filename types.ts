
export type KanaType = 'hiragana' | 'katakana' | 'mixed';
export type GameMode = 'single' | 'multi';
export type KanaFont = 'sans' | 'serif' | 'rounded' | 'hand' | 'digital' | 'future';
export type DistributionMode = 'random' | 'frequency';

export interface KanaChar {
  char: string;
  romaji: string[];
  type: 'hiragana' | 'katakana';
  parts?: KanaChar[]; // Component characters for multi-char questions
}

export interface GameConfig {
  mode: GameMode;
  kanaType: KanaType;
  questionCount: number | 'all';
  timeLimitSeconds: number | null;
  autoCheck: boolean;
  selectedGroups: string[]; // IDs of groups to include
  font: KanaFont;
  distribution: DistributionMode;
}

export interface QuestionResult {
  char: KanaChar;
  timeTaken: number;
  mistakes: number;
}

export interface GameStats {
  totalQuestions: number;
  correctCount: number;
  totalMistakes: number;
  totalTime: number;
  results: QuestionResult[];
}