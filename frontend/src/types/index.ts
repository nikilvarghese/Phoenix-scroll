export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'reader';
  avatarUrl?: string;
}

export interface Story {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  authorName: string;
  coverImage?: string;
  visibility: 'private' | 'unlisted' | 'public';
  accessPasscode?: string;
  isPublished: boolean;
  publishedAt?: string;
  readingTimeMinutes: number;
  chapterCount: number;
  genre?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  _id: string;
  storyId: string;
  title: string;
  order: number;
  content: string;
  excerpt?: string;
  illustrationUrl?: string;
  wordCount: number;
  isPrologue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  _id: string;
  clientDeviceId: string;
  storyId: any;
  chapterId: any;
  chapterOrder: number;
  scrollPercentage: number;
  isCompleted?: boolean;
  lastReadAt: string;
}

export type ReaderTheme = 'parchment' | 'night' | 'sepia' | 'paper';
export type ReaderFont = 'garamond' | 'lora' | 'playfair' | 'sans';
export type ReaderWidth = 'narrow' | 'medium' | 'wide';
export type ReaderLayoutMode = 'book' | 'scroll';
export type ReaderPageLayout = 'auto' | 'dual' | 'single';
export type ReaderPageAnimation = 'flip' | 'slide' | 'fade';

export interface ReaderSettings {
  theme: ReaderTheme;
  font: ReaderFont;
  fontSize: number; // 14 to 26
  lineHeight: number; // 1.4 to 2.2
  contentWidth: ReaderWidth;
  layoutMode: ReaderLayoutMode;
  pageLayout: ReaderPageLayout;
  pageAnimation: ReaderPageAnimation;
}
