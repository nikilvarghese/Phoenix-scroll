import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  purpose: 'registration' | 'forgot_password';
  createdAt: Date;
  expiresAt: Date;
}

const OtpSchema: Schema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    purpose: { type: String, enum: ['registration', 'forgot_password'], required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.model<IOtp>('Otp', OtpSchema);
