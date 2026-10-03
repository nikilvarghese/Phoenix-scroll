import mongoose, { Schema, Document } from 'mongoose';

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
  createdAt: Date;
  updatedAt: Date;
}

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
  },
  { timestamps: true }
);

export default mongoose.model<IStory>('Story', StorySchema);
