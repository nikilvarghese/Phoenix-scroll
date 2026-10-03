import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  sendOtp,
  forgotPassword,
  resetPassword,
  deleteAccount,
  getMe,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', authenticate, resetPassword);
router.delete('/account', authenticate, deleteAccount);
router.get('/me', authenticate, getMe);

export default router;

