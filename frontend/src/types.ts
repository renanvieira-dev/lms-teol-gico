export type CourseLevel = 'basico' | 'intermediario' | 'avancado';

export interface Lesson {
  id: number;
  telegram_msg_id: number;
  level: CourseLevel;
  module: string;
  title: string;
  raw_title?: string;
  description: string;
  file_name: string;
  duration_seconds: number;
  duration_formatted: string;
  size_mb: number;
  date: string | null;
}

export interface WatchProgress {
  currentTime: number;
  duration: number;
  lastWatchedAt: number;
  percentage: number;
}