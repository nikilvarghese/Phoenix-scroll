import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import Story from '../models/Story.js';
import Chapter from '../models/Chapter.js';
import ReadingProgress from '../models/ReadingProgress.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { sendOtpEmail } from '../utils/emailService.js';
import { getJwtSecret } from '../config/jwt.js';
import axios from 'axios';

export const AUTHOR_EMAIL = 'nikiledwin6@gmail.com';
const OTP_RESEND_COOLDOWN = Number(process.env.OTP_RESEND_COOLDOWN) || 120000; // 120,000ms = 2 mins

// Send OTP for Registration or Forgot Password
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email, purpose } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const targetPurpose = purpose === 'forgot_password' ? 'forgot_password' : 'registration';
    const cleanEmail = email.toLowerCase().trim();

    // Check purpose specific constraints
    if (targetPurpose === 'registration') {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        if (existingUser.authProvider === 'google') {
          return res.status(400).json({
            message: 'This email is already registered using Google Sign-In. Please click "Continue with Google" to log in.',
            isGoogleAccount: true,
          });
        }
        return res.status(400).json({ message: 'An account with this email address already exists. Please sign in.' });
      }
    } else if (targetPurpose === 'forgot_password') {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (!existingUser) {
        return res.status(404).json({
          message: 'Mail is not registered with Phoenix-Scroll. Please click below to create an account.',
          notRegistered: true,
        });
      }
      if (existingUser.authProvider === 'google') {
        return res.status(400).json({
          message: 'This account was created using Google Sign-In. Password reset is not applicable. Please log in using Google.',
          isGoogleAccount: true,
        });
      }
    }

    // Cooldown check
    const existingOtp = await Otp.findOne({ email: cleanEmail, purpose: targetPurpose });
    if (existingOtp) {
      const timeElapsed = Date.now() - new Date(existingOtp.createdAt).getTime();
      if (timeElapsed < 30000) {
        const waitSec = Math.ceil((30000 - timeElapsed) / 1000);
        return res.status(429).json({ message: `Please wait ${waitSec} second(s) before requesting a new OTP.` });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_RESEND_COOLDOWN);

    // Save to Otp model (clears old ones)
    await Otp.deleteMany({ email: cleanEmail, purpose: targetPurpose });
    await Otp.create({
      email: cleanEmail,
      otp,
      purpose: targetPurpose,
      expiresAt,
    });

    // Send Email
    await sendOtpEmail(cleanEmail, otp, targetPurpose);

    res.json({
      success: true,
      message: `OTP sent successfully to ${cleanEmail}. Valid for 2 minutes.`,
      cooldownMs: OTP_RESEND_COOLDOWN,
    });
  } catch (err: any) {
    console.error('Error in sendOtp:', err);
    res.status(500).json({ message: err.message || 'Failed to send OTP email.' });
  }
};

// Register with OTP Verification (Email/Password Auth)
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, otp, acceptedTerms } = req.body;
    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Name, email, password, and OTP are required.' });
    }

    if (acceptedTerms === false) {
      return res.status(400).json({ message: 'You must read and accept the Terms & Conditions and Privacy Policy to register.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify OTP
    const validOtp = await Otp.findOne({ email: cleanEmail, otp, purpose: 'registration' });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please enter the latest 6-digit code sent to your email.' });
    }

    if (new Date() > new Date(validOtp.expiresAt)) {
      await Otp.deleteMany({ email: cleanEmail, purpose: 'registration' });
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      if (existingUser.authProvider === 'google') {
        return res.status(400).json({
          message: 'This email is already registered using Google Sign-In. Please click "Continue with Google" to log in.',
          isGoogleAccount: true,
        });
      }
      return res.status(400).json({ message: 'User with this email already exists. Please sign in.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const assignedRole = cleanEmail === AUTHOR_EMAIL ? 'owner' : 'reader';
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || (req.headers['x-client-device-id'] as string) || '';

    const user = await User.create({
      name,
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
      authProvider: 'email',
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
      acceptedTermsIp: clientIp,
    });

    // Clear used OTP
    await Otp.deleteMany({ email: cleanEmail, purpose: 'registration' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error during registration.' });
  }
};

// Login with Email & Password
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check if account was created via Google Sign-In
    if (user.authProvider === 'google') {
      return res.status(400).json({
        message: 'This account was created using Google Sign-In. Please click "Continue with Google" to log in.',
        isGoogleAccount: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (cleanEmail === AUTHOR_EMAIL && user.role !== 'owner') {
      user.role = 'owner';
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error during login.' });
  }
};

// Google OAuth Login & Registration (Separate Auth Method)
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, accessToken, email, name, avatarUrl } = req.body;

    let userEmail: string | undefined;
    let userName: string | undefined;
    let userAvatar: string | undefined;

    // 1. Verify ID Token if provided
    if (idToken) {
      try {
        const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const data = googleRes.data;
        const expectedClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

        const isVerifiedEmail = data?.email_verified === true || data?.email_verified === 'true';
        const matchesAudience = !expectedClientId || data?.aud === expectedClientId || data?.azp === expectedClientId;

        if (data && data.email && isVerifiedEmail && matchesAudience) {
          userEmail = data.email;
          userName = data.name || name;
          userAvatar = data.picture || avatarUrl;
        }
      } catch (err: any) {
        console.warn('⚠️ Google ID token verification failed:', err.message);
      }
    }

    // 2. Verify Access Token if provided and ID Token verification didn't succeed
    if (!userEmail && accessToken) {
      try {
        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = googleRes.data;
        const isVerifiedEmail = data?.email_verified === true || data?.email_verified === 'true';

        if (data && data.email && isVerifiedEmail) {
          // Optionally verify tokeninfo for access token audience
          try {
            const tokenInfo = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
            const expectedClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
            const matchesAudience = !expectedClientId || tokenInfo.data?.aud === expectedClientId || tokenInfo.data?.azp === expectedClientId;
            if (!matchesAudience) {
              console.warn('⚠️ Google Access token audience mismatch.');
              userEmail = undefined;
            } else {
              userEmail = data.email;
              userName = data.name || name;
              userAvatar = data.picture || avatarUrl;
            }
          } catch {
            userEmail = data.email;
            userName = data.name || name;
            userAvatar = data.picture || avatarUrl;
          }
        }
      } catch (err: any) {
        console.warn('⚠️ Google Access token verification failed:', err.message);
      }
    }

    // If token verification failed or no token was provided, reject authentication
    if (!userEmail) {
      return res.status(401).json({
        message: 'Google authentication failed. Invalid or expired Google token.',
      });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // Reject Google login if account was registered via Email/Password
      if (user.authProvider === 'email') {
        return res.status(400).json({
          message: 'This account was created with email and password. Please enter your email and password to log in.',
          isEmailAccount: true,
        });
      }
      if (userAvatar && !user.avatarUrl) {
        user.avatarUrl = userAvatar;
        await user.save();
      }
    } else {
      const assignedRole = cleanEmail === AUTHOR_EMAIL ? 'owner' : 'reader';
      const randomPassword = await bcrypt.hash('google_oauth_' + Math.random().toString(36), 10);

      user = await User.create({
        name: userName || 'Google User',
        email: cleanEmail,
        passwordHash: randomPassword,
        role: assignedRole,
        avatarUrl: userAvatar || '',
        authProvider: 'google',
        acceptedTerms: true,
        acceptedTermsAt: new Date(),
      });
      console.log(`👤 New user created via Google Sign-In: ${cleanEmail}`);
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
      },
    });
  } catch (err: any) {
    console.error('Google login error:', err);
    res.status(500).json({ message: err.message || 'Google Sign-In failed.' });
  }
};


// Forgot Password with OTP
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const validOtp = await Otp.findOne({ email: cleanEmail, otp, purpose: 'forgot_password' });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP code.' });
    }

    if (new Date() > new Date(validOtp.expiresAt)) {
      await Otp.deleteMany({ email: cleanEmail, purpose: 'forgot_password' });
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    await Otp.deleteMany({ email: cleanEmail, purpose: 'forgot_password' });

    res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reset password.' });
  }
};

// Reset Password
export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update password.' });
  }
};

// Delete Account
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const userStories = await Story.find({ ownerId: userId });
    const storyIds = userStories.map((s) => s._id);

    await Chapter.deleteMany({ storyId: { $in: storyIds } });
    await ReadingProgress.deleteMany({
      $or: [{ storyId: { $in: storyIds } }, { userId: userId }],
    });
    await Story.deleteMany({ ownerId: userId });
    await Otp.deleteMany({ email: user.email });

    if (mongoose.connection.db) {
      try {
        await mongoose.connection.db.collection('login').deleteOne({ email: user.email });
      } catch {
        // ignore
      }
    }

    await user.deleteOne();

    console.log(`🗑️ Account deleted permanently: ${user.email}`);

    res.json({
      success: true,
      message: 'Your account and all associated stories, chapters, and data have been permanently deleted from the database.',
    });
  } catch (err: any) {
    console.error('Error in deleteAccount:', err);
    res.status(500).json({ message: err.message || 'Failed to delete account.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error fetching user.' });
  }
};

