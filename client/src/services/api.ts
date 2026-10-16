import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';
import type {
  StudentProfile,
  Program,
  ProgramImage,
  ExecutionResult,
  OCRResult,
  AIAnalysis,
  AIExplanation,
  Lesson,
  LearningProgress,
  ExplanationMode,
  AdminStats,
} from '../types';

import { Capacitor } from '@capacitor/core';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const savedCustomUrl = localStorage.getItem('codesaathi_custom_api_url');
    if (savedCustomUrl) return savedCustomUrl;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (Capacitor.isNativePlatform()) {
    return 'http://10.123.131.122:4000/api';
  }
  return '/api';
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Failed to get Supabase session for API request', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && data.session?.access_token) {
          originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        console.error('Session refresh failed', refreshErr);
      }
    }

    const data = error.response?.data as any;
    let message = 'An unexpected error occurred';

    if (data) {
      if (typeof data === 'string') {
        message = data;
      } else if (data.error) {
        if (typeof data.error === 'string') {
          message = data.error;
        } else if (typeof data.error.message === 'string') {
          message = data.error.message;
        } else if (Array.isArray(data.error.details) && data.error.details.length > 0) {
          message = data.error.details.map((d: any) => d.message || d).join(', ');
        }
      } else if (typeof data.message === 'string') {
        message = data.message;
      }
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export const api = {
  auth: {
    signup: async (email: string, password: string, display_name?: string): Promise<{ success: boolean; data: { user: any; session: any } }> => {
      const res = await apiClient.post('/auth/signup', { email, password, display_name });
      return res.data;
    },
    login: async (email: string, password: string): Promise<{ success: boolean; data: { user: any; session: any } }> => {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    },
  },

  profile: {
    get: async (): Promise<StudentProfile> => {
      const res = await apiClient.get<StudentProfile>('/profile');
      return res.data;
    },
    create: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
      const res = await apiClient.post<StudentProfile>('/profile', data);
      return res.data;
    },
    update: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
      const res = await apiClient.put<StudentProfile>('/profile', data);
      return res.data;
    },
  },

  programs: {
    list: async (params?: { search?: string; topic?: string; language?: string }): Promise<Program[]> => {
      const res = await apiClient.get<Program[]>('/programs', { params });
      return res.data;
    },
    get: async (id: string): Promise<Program> => {
      const res = await apiClient.get<Program>(`/programs/${id}`);
      return res.data;
    },
    create: async (data: Partial<Program>): Promise<Program> => {
      const res = await apiClient.post<Program>('/programs', data);
      return res.data;
    },
    update: async (id: string, data: Partial<Program>): Promise<Program> => {
      const res = await apiClient.put<Program>(`/programs/${id}`, data);
      return res.data;
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      const res = await apiClient.delete<{ success: boolean }>(`/programs/${id}`);
      return res.data;
    },
    uploadImages: async (id: string, files: File[]): Promise<ProgramImage[]> => {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      const res = await apiClient.post<ProgramImage[]>(`/programs/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    getImages: async (id: string): Promise<ProgramImage[]> => {
      const res = await apiClient.get<ProgramImage[]>(`/programs/${id}/images`);
      return res.data;
    },
    getExecutions: async (id: string): Promise<ExecutionResult[]> => {
      const res = await apiClient.get<ExecutionResult[]>(`/programs/${id}/executions`);
      return res.data;
    },
  },

  execute: {
    run: async (data: {
      code: string;
      language: string;
      input?: string;
      program_id?: string;
    }): Promise<ExecutionResult> => {
      const res = await apiClient.post<ExecutionResult>('/execute', {
        ...data,
        source_code: data.code,
      });
      return res.data;
    },
    languages: async (): Promise<Array<{ id: string; name: string; version: string; monacoLang?: string }>> => {
      const res = await apiClient.get<Array<{ id: string; name: string; version: string }>>('/execute/languages');
      return res.data;
    },
  },

  ai: {
    analyze: async (data: {
      code: string;
      language: string;
      error_message?: string;
    }): Promise<AIAnalysis> => {
      const res = await apiClient.post<AIAnalysis>('/ai/analyze', {
        ...data,
        source_code: data.code,
        compiler_output: data.error_message,
      });
      return res.data;
    },
    explain: async (data: {
      code: string;
      language: string;
      mode: ExplanationMode;
    }): Promise<AIExplanation> => {
      const res = await apiClient.post<AIExplanation>('/ai/explain', {
        ...data,
        source_code: data.code,
      });
      return res.data;
    },
  },

  ocr: {
    process: async (files: File[]): Promise<OCRResult> => {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      const res = await apiClient.post<OCRResult>('/ocr/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  },

  lessons: {
    list: async (params?: { class_level?: number; board?: string; language?: string }): Promise<Lesson[]> => {
      const res = await apiClient.get<Lesson[]>('/lessons', { params });
      return res.data;
    },
    get: async (id: string): Promise<Lesson> => {
      const res = await apiClient.get<Lesson>(`/lessons/${id}`);
      return res.data;
    },
    complete: async (id: string): Promise<{ success: boolean; progress: LearningProgress }> => {
      const res = await apiClient.post<{ success: boolean; progress: LearningProgress }>(`/lessons/${id}/complete`);
      return res.data;
    },
    progress: async (): Promise<LearningProgress[]> => {
      const res = await apiClient.get<LearningProgress[]>('/lessons/progress');
      return res.data;
    },
  },

  admin: {
    stats: async (): Promise<AdminStats> => {
      const res = await apiClient.get<AdminStats>('/admin/stats');
      return res.data;
    },
    createLesson: async (data: Partial<Lesson>): Promise<Lesson> => {
      const res = await apiClient.post<Lesson>('/admin/lessons', data);
      return res.data;
    },
    deleteLesson: async (id: string): Promise<{ success: boolean }> => {
      const res = await apiClient.delete<{ success: boolean }>(`/admin/lessons/${id}`);
      return res.data;
    },
    uploadCurriculum: async (data: { board: string; class_level: number; file: File }): Promise<{ success: boolean; count: number }> => {
      const formData = new FormData();
      formData.append('board', data.board);
      formData.append('class_level', String(data.class_level));
      formData.append('file', data.file);
      const res = await apiClient.post<{ success: boolean; count: number }>('/admin/curriculum', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  },
};
