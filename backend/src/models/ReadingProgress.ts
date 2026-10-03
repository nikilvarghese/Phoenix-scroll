import mongoose, { Schema, Document } from 'mongoose';

export interface IReadingProgress extends Document {
  clientDeviceId: string;
  userId?: mongoose.Types.ObjectId;
  storyId: mongoose.Types.ObjectId;
  chapterId: mongoose.Types.ObjectId;
  chapterOrder: number;
  scrollPercentage: number;
  isCompleted: boolean;
  lastReadAt: Date;
}

const ReadingProgressSchema: Schema = new Schema(
  {
    clientDeviceId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    chapterOrder: { type: Number, default: 1 },
    scrollPercentage: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ReadingProgressSchema.index({ userId: 1, storyId: 1 }, { sparse: true });
ReadingProgressSchema.index({ clientDeviceId: 1, storyId: 1 });

export default mongoose.model<IReadingProgress>('ReadingProgress', ReadingProgressSchema);
