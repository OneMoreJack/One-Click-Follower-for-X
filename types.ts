
export enum SpeedMode {
  FAST = 'fast',
  MEDIUM = 'medium',
  SLOW = 'slow'
}

export interface Account {
  id: string;
  username: string;
  avatar?: string;
  url: string;
  selected: boolean;
  status: 'pending' | 'processing' | 'success' | 'skipped' | 'failed' | 'resting';
  error?: string;
}

export interface TaskStats {
  success: number;
  skipped: number;
  failed: number;
  total: number;
  isResting?: boolean;
}

export enum MessageType {
  START_TASK = 'START_TASK',
  STOP_TASK = 'STOP_TASK',
  UPDATE_PROGRESS = 'UPDATE_PROGRESS',
  TASK_COMPLETE = 'TASK_COMPLETE',
  EXTRACT_ACCOUNTS = 'EXTRACT_ACCOUNTS',
  ACCOUNTS_EXTRACTED = 'ACCOUNTS_EXTRACTED'
}
