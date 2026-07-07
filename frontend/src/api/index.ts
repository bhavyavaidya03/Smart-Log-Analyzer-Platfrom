import apiClient from './client';
import type {
  ApiResponse, PaginatedResponse, TokenResponse, User,
  Project, UploadedLog, ParsedLog, LogFilters,
  DashboardSummary, AnalyticsTrends,
} from '@/types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    email: string; username: string; full_name: string; password: string; confirm_password: string;
  }) => apiClient.post<ApiResponse<User>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<TokenResponse>>('/auth/login', data),

  refresh: (refresh_token: string) =>
    apiClient.post<ApiResponse<{ access_token: string }>>('/auth/refresh', { refresh_token }),

  verifyEmail: (data: { email: string; otp_code: string }) =>
    apiClient.post<ApiResponse<User>>('/auth/verify-email', data),

  resendOtp: (email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/resend-otp', { email }),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (data: {
    email: string; otp_code: string; new_password: string; confirm_password: string;
  }) => apiClient.post<ApiResponse<null>>('/auth/reset-password', data),

  changePassword: (data: {
    current_password: string; new_password: string; confirm_password: string;
  }) => apiClient.post<ApiResponse<null>>('/auth/change-password', data),

  me: () => apiClient.get<ApiResponse<User>>('/auth/me'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () => apiClient.get<ApiResponse<User>>('/users/me'),

  updateProfile: (data: { full_name?: string; username?: string; bio?: string }) =>
    apiClient.patch<ApiResponse<User>>('/users/me', data),

  uploadAvatar: (formData: FormData) =>
    apiClient.post<ApiResponse<User>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  listUsers: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params: { page, page_size: pageSize } }),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResponse<Project>>('/projects', { params: { page, page_size: pageSize } }),

  create: (data: { name: string; description?: string }) =>
    apiClient.post<ApiResponse<Project>>('/projects', data),

  get: (id: string) =>
    apiClient.get<ApiResponse<Project>>(`/projects/${id}`),

  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/projects/${id}`),
};

// ── Logs ──────────────────────────────────────────────────────────────────────
export const logsApi = {
  upload: (formData: FormData, projectId?: string) =>
    apiClient.post<ApiResponse<UploadedLog>>(
      `/logs/upload${projectId ? `?project_id=${projectId}` : ''}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  listUploads: (page = 1, pageSize = 20, projectId?: string) =>
    apiClient.get<PaginatedResponse<UploadedLog>>('/logs/uploads', {
      params: { page, page_size: pageSize, project_id: projectId },
    }),

  getUpload: (id: string) =>
    apiClient.get<ApiResponse<UploadedLog>>(`/logs/uploads/${id}`),

  deleteUpload: (id: string) =>
    apiClient.delete(`/logs/uploads/${id}`),

  getParsedLogs: (uploadId: string, filters: LogFilters = {}) =>
    apiClient.get<PaginatedResponse<ParsedLog>>(`/logs/uploads/${uploadId}/parsed`, {
      params: filters,
    }),

  search: (keyword: string, level?: string, page = 1, pageSize = 50) =>
    apiClient.get<PaginatedResponse<ParsedLog>>('/logs/search', {
      params: { keyword, level, page, page_size: pageSize },
    }),

  exportCsv: (uploadId: string) =>
    apiClient.get(`/logs/uploads/${uploadId}/export/csv`, { responseType: 'blob' }),

  exportPdf: (uploadId: string) =>
    apiClient.get(`/logs/uploads/${uploadId}/export/pdf`, { responseType: 'blob' }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getSummary: () =>
    apiClient.get<ApiResponse<DashboardSummary>>('/analytics/summary'),

  getTrends: () =>
    apiClient.get<ApiResponse<AnalyticsTrends>>('/analytics/trends'),
};
