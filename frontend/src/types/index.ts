// TypeScript types for the entire application

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'admin' | 'user';
  is_verified: boolean;
  is_active: boolean;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  log_count: number;
}

export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UploadedLog {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: UploadStatus;
  total_lines: number;
  parsed_lines: number;
  error_message: string | null;
  user_id: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'UNKNOWN';

export interface ParsedLog {
  id: string;
  upload_id: string;
  timestamp: string | null;
  level: LogLevel;
  source: string | null;
  module: string | null;
  ip_address: string | null;
  status_code: number | null;
  response_time: number | null;
  message: string;
  raw_line: string;
  line_number: number;
  created_at: string;
}

export interface DashboardSummary {
  total_uploads: number;
  total_parsed_logs: number;
  total_errors: number;
  total_warnings: number;
  total_critical: number;
  total_info: number;
  total_debug: number;
  total_projects: number;
  recent_uploads: UploadedLog[];
}

export interface TrendPoint {
  date: string;
  errors: number;
  warnings: number;
  info: number;
  critical: number;
  debug: number;
  total: number;
}

export interface LevelDistribution {
  level: string;
  count: number;
  percentage: number;
}

export interface TopError {
  message: string;
  count: number;
  percentage: number;
}

export interface AnalyticsTrends {
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: TrendPoint[];
  level_distribution: LevelDistribution[];
  top_errors: TopError[];
  top_sources: { source: string; count: number }[];
  top_ips: { ip: string; count: number }[];
}

// API response envelopes
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// Filter types
export interface LogFilters {
  level?: LogLevel;
  source?: string;
  ip_address?: string;
  status_code?: number;
  keyword?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}
