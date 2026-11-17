import mongoose, { Schema, Document } from 'mongoose';

export interface IChapter extends Document {
  storyId: mongoose.Types.ObjectId;
  title: string;
  order: number;
  content: string;
  excerpt?: string;
  illustrationUrl?: string;
  wordCount: number;
  isPrologue?: boolean;
  arc?: string;
  arcNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema: Schema = new Schema(
  {
    storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    content: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    illustrationUrl: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },
    isPrologue: { type: Boolean, default: false },
    arc: { type: String, trim: true, default: '' },
    arcNumber: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<IChapter>('Chapter', ChapterSchema);
