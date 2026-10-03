import mongoose, { Schema, Document } from 'mongoose';

export interface IEmbeddedChapter {
  _id: mongoose.Types.ObjectId;
  title: string;
  order: number;
  content: string;
  excerpt?: string;
  illustrationUrl?: string;
  wordCount: number;
  isPrologue?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStory extends Document {
  title: string;
  subtitle?: string;
  description: string;
  authorName: string;
  coverImage?: string;
  visibility: 'private' | 'unlisted' | 'public';
  accessPasscode?: string;
  isPublished: boolean;
  publishedAt?: Date;
  readingTimeMinutes: number;
  chapterCount: number;
  ownerId: mongoose.Types.ObjectId;
  genre?: string;
  chapters: mongoose.Types.DocumentArray<IEmbeddedChapter & Document>;
  createdAt: Date;
  updatedAt: Date;
}

export const ChapterSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 1 },
    content: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    illustrationUrl: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },
    isPrologue: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const StorySchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    description: { type: String, required: true, trim: true },
    authorName: { type: String, required: true, trim: true },
    coverImage: { type: String, default: '' },
    visibility: {
      type: String,
      enum: ['private', 'unlisted', 'public'],
      default: 'private',
    },
    accessPasscode: { type: String, default: '' },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    readingTimeMinutes: { type: Number, default: 0 },
    chapterCount: { type: Number, default: 0 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    genre: { type: String, default: 'Fiction' },
    chapters: [ChapterSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IStory>('Story', StorySchema);
