export interface BedAnalysisResult {
  score: number;
  feedback: string;
  // Structured breakdown returned by the server
  neatness?: number; // 0-100
  corners?: number; // 0-100
  pillows?: number; // 0-100
  confidence?: number; // 0.0-1.0
}

export interface RoutineItem {
  id: string;
  label: string;
  icon: string; // Icon name for display logic
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  bedScore: number;
  bedFeedback: string;
  completedRoutines: string[]; // IDs of completed routines
  totalRoutines: number;
  // Breakdown scores (optional for backwards compatibility)
  neatness?: number;
  corners?: number;
  pillows?: number;
  confidence?: number;
}

export interface CommunityShareData {
  nickname: string;
  score: number;
  feedback: string;
  routine_progress: string;
  date: string;
}

export enum AppState {
  HOME = 'HOME',
  BED_ANALYSIS = 'BED_ANALYSIS',
  ROUTINE_CHECK = 'ROUTINE_CHECK',
  SUMMARY = 'SUMMARY',
}
