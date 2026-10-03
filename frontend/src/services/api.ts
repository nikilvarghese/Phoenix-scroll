import axios from 'axios';
import { Story, Chapter, User, ReadingProgress } from '../types';

const API_BASE_URL = '/api';
const TOKEN_KEY = 'phoenixscroll_token';
const USER_KEY = 'phoenixscroll_user';
const DEVICE_KEY = 'phoenixscroll_device_id';

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const storeTokenAndUser = (token: string, user: User, rememberMe: boolean = true) => {
  const userStr = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, userStr);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, userStr);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-client-device-id'] = getDeviceId();
  return config;
});

export const authService = {
  sendOtp: async (email: string, purpose: 'registration' | 'forgot_password' = 'registration') => {
    const res = await api.post<{ success: boolean; message: string; cooldownMs: number }>('/auth/send-otp', { email, purpose });
    return res.data;
  },
  login: async (email: string, password: string, rememberMe: boolean = true) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    if (res.data.token && res.data.user) {
      storeTokenAndUser(res.data.token, res.data.user, rememberMe);
    }
    return res.data;
  },
  register: async (name: string, email: string, password: string, otp: string, role: 'owner' | 'reader' = 'reader', rememberMe: boolean = true, acceptedTerms: boolean = true) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password, otp, role, acceptedTerms });
    if (res.data.token && res.data.user) {
      storeTokenAndUser(res.data.token, res.data.user, rememberMe);
    }
    return res.data;
  },
  googleLogin: async (data: { idToken?: string; accessToken?: string; email?: string; name?: string; avatarUrl?: string }, rememberMe: boolean = true) => {
    const res = await api.post<{ token: string; user: User }>('/auth/google', data);
    if (res.data.token && res.data.user) {
      storeTokenAndUser(res.data.token, res.data.user, rememberMe);
    }
    return res.data;
  },
  forgotPassword: async (email: string, otp: string, newPassword: string) => {
    const res = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email, otp, newPassword });
    return res.data;
  },
  resetPassword: async (oldPassword: string, newPassword: string) => {
    const res = await api.post<{ success: boolean; message: string }>('/auth/reset-password', { oldPassword, newPassword });
    return res.data;
  },
  deleteAccount: async () => {
    const res = await api.delete<{ success: boolean; message: string }>('/auth/account');
    clearStoredToken();
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data.user;
  },
  logout: () => {
    clearStoredToken();
  },
};

export const storyService = {
  getStories: async () => {
    const res = await api.get<Story[]>('/stories');
    return res.data;
  },
  getStoryById: async (id: string, passcode?: string) => {
    const headers: Record<string, string> = {};
    if (passcode) {
      headers['x-story-passcode'] = passcode;
    }
    const res = await api.get<Story>(`/stories/${id}`, { headers });
    return res.data;
  },
  verifyPasscode: async (id: string, passcode: string) => {
    const res = await api.post<{ success: boolean; message: string }>(`/stories/${id}/passcode`, { passcode });
    return res.data;
  },
  createStory: async (data: Partial<Story>) => {
    const res = await api.post<Story>('/stories', data);
    return res.data;
  },
  updateStory: async (id: string, data: Partial<Story>) => {
    const res = await api.put<Story>(`/stories/${id}`, data);
    return res.data;
  },
  deleteStory: async (id: string) => {
    const res = await api.delete<{ message: string }>(`/stories/${id}`);
    return res.data;
  },
  togglePublish: async (id: string) => {
    const res = await api.patch<Story>(`/stories/${id}/publish`);
    return res.data;
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post<{ url: string; filename: string }>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const chapterService = {
  getChapters: async (storyId: string) => {
    const res = await api.get<Chapter[]>(`/chapters/story/${storyId}`);
    return res.data;
  },
  getChapterById: async (chapterId: string) => {
    const res = await api.get<Chapter>(`/chapters/${chapterId}`);
    return res.data;
  },
  createChapter: async (storyId: string, data: Partial<Chapter>) => {
    const res = await api.post<Chapter>(`/chapters/story/${storyId}`, data);
    return res.data;
  },
  updateChapter: async (chapterId: string, data: Partial<Chapter>) => {
    const res = await api.put<Chapter>(`/chapters/${chapterId}`, data);
    return res.data;
  },
  reorderChapters: async (storyId: string, chapterOrders: { chapterId: string; order: number; title?: string; isPrologue?: boolean }[]) => {
    const res = await api.post<Chapter[]>(`/chapters/story/${storyId}/reorder`, { chapterOrders });
    return res.data;
  },
  deleteChapter: async (chapterId: string) => {
    const res = await api.delete<{ message: string }>(`/chapters/${chapterId}`);
    return res.data;
  },
  importDocument: async (storyId: string, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    const res = await api.post<{ message: string; chapters: Chapter[] }>(`/chapters/story/${storyId}/import-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const progressService = {
  saveProgress: async (storyId: string, data: { chapterId: string; chapterOrder: number; scrollPercentage: number; isCompleted?: boolean }) => {
    const clientDeviceId = getDeviceId();
    const res = await api.post<ReadingProgress>(`/progress/story/${storyId}`, {
      clientDeviceId,
      ...data,
    });
    return res.data;
  },
  getProgress: async (storyId: string) => {
    const clientDeviceId = getDeviceId();
    try {
      const res = await api.get<ReadingProgress>(`/progress/story/${storyId}?clientDeviceId=${clientDeviceId}`);
      return res.data;
    } catch {
      return null;
    }
  },
  getAllProgress: async () => {
    const clientDeviceId = getDeviceId();
    try {
      const res = await api.get<ReadingProgress[]>(`/progress/user-all?clientDeviceId=${clientDeviceId}`);
      return res.data;
    } catch {
      return [];
    }
  },
};
