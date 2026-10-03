import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'reader';
  avatarUrl?: string;
  authProvider: 'email' | 'google';
  acceptedTerms: boolean;
  acceptedTermsAt: Date;
  acceptedTermsIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['owner', 'reader'], default: 'reader' },
    avatarUrl: { type: String, default: '' },
    authProvider: { type: String, enum: ['email', 'google'], default: 'email' },
    acceptedTerms: { type: Boolean, required: true, default: true },
    acceptedTermsAt: { type: Date, default: Date.now },
    acceptedTermsIp: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
