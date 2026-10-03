import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/api';
import { X, Lock, Trash2, Shield, UserCheck, AlertTriangle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PasswordRequirementsChecklist } from './PasswordRequirementsChecklist';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, deleteAccount, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Password reset section states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'change' | 'forgot'>('change');

  // Change Password inputs
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password OTP inputs
  const [otp, setOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete account modal stage
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSendForgotOtp = async () => {
    setPasswordError('');
    setPasswordMessage('');
    try {
      setSendingOtp(true);
      const res = await authService.sendOtp(user.email, 'forgot_password');
      setOtpSent(true);
      setCooldownSec(120);
      setPasswordMessage(res.message || 'OTP sent to your email!');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (!otp || !forgotNewPassword) {
      setPasswordError('OTP and new password are required.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await authService.forgotPassword(user.email, otp, forgotNewPassword);
      setPasswordMessage('Password reset successfully! Please sign in with your new password.');
      setTimeout(() => {
        logout();
        onClose();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (!oldPassword || !newPassword) {
      setPasswordError('Both current and new passwords are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await authService.resetPassword(oldPassword, newPassword);
      setPasswordMessage(res.message || 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
      onClose();
      navigate('/');
      showSuccess('Your account and all associated profile data have been permanently deleted.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl space-y-6 border border-stone-200 overflow-y-auto max-h-[90vh] relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h3 className="font-playfair text-2xl font-bold text-stone-900">Account Settings</h3>
            <p className="text-xs text-stone-500 font-sans">Manage credentials and profile security</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Badge */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="font-bold text-stone-900 text-sm">{user.name}</h4>
            <p className="text-xs text-stone-500 font-mono">{user.email}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1 ${
              user.role === 'owner' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {user.role === 'owner' ? <Shield className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            <span>{user.role === 'owner' ? 'Author' : 'Reader'}</span>
          </span>
        </div>

        {/* Change / Reset Password UI Section */}
        <div className="space-y-4 pt-1 border-t border-stone-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-amber-800" />
              <h4 className="font-bold text-stone-800 text-sm">Security & Password</h4>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                setPasswordMode('change');
                setPasswordMessage('');
                setPasswordError('');
              }}
              className="px-3 py-1.5 bg-amber-900/10 hover:bg-amber-900/20 text-amber-900 rounded-lg text-xs font-bold transition flex items-center space-x-1"
            >
              {showPasswordSection ? (
                <span className="p-1 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition" title="Close Password UI">
                  <X className="w-4 h-4" />
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-amber-900/10 hover:bg-amber-900/20 text-amber-900 rounded-lg text-xs font-bold transition">
                  Reset Password
                </span>
              )}
            </button>
          </div>

          {passwordMessage && (
            <div className="flex items-center space-x-2 text-emerald-800 bg-emerald-50 p-2.5 rounded-xl text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-2.5 rounded-xl text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {showPasswordSection && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-4">
              {passwordMode === 'change' ? (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                        Current Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordMode('forgot');
                          setPasswordError('');
                          setPasswordMessage('');
                        }}
                        className="text-[11px] text-amber-900 hover:underline font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter old password"
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <PasswordRequirementsChecklist password={newPassword} />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                    >
                      {savingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Forgot Password with OTP Mode inside Modal */
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                    <span className="text-xs font-bold text-stone-800">Forgot Password OTP Recovery</span>
                    <button
                      type="button"
                      onClick={() => setPasswordMode('change')}
                      className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold"
                    >
                      Back to Old Password
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Account Email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="flex-1 px-3.5 py-2 bg-stone-200 text-stone-600 rounded-lg text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSendForgotOtp}
                        disabled={sendingOtp || cooldownSec > 0}
                        className="px-3 py-2 bg-amber-900 hover:bg-amber-950 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50 flex-shrink-0"
                      >
                        {sendingOtp ? 'Sending...' : cooldownSec > 0 ? `${cooldownSec}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      6-Digit Email OTP *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold tracking-widest text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <PasswordRequirementsChecklist password={forgotNewPassword} />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                    >
                      {savingPassword ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="border-t border-stone-200 pt-5 space-y-3">
          <h4 className="font-bold text-red-700 text-xs uppercase tracking-wider">Danger Zone</h4>
          <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-stone-900 text-xs">Delete Account</h5>
              <p className="text-[11px] text-stone-600">
                Permanently delete your account profile, credentials, and personal reading progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Sub-modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-red-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-playfair text-xl font-bold text-stone-900">Delete Account Permanently?</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete your account (<span className="font-bold text-stone-900">{user.email}</span>)?
              All your account credentials, preferences, and personal reading history will be <span className="font-bold text-red-600">permanently deleted</span>.
            </p>
            <div className="pt-2 flex justify-center space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountConfirm}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {deleting ? 'Deleting Account...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
