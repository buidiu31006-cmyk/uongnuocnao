import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AppUser, Gender, ActivityLevel } from '../types';
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  sendResetPassword,
} from '../services/firebaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AppUser) => void;
  initialMode?: 'login' | 'register';
  defaultWeight?: number;
  defaultGender?: Gender;
  defaultActivity?: ActivityLevel;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  defaultWeight = 60,
  defaultGender = 'female',
  defaultActivity = 'moderate',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [weight, setWeight] = useState(defaultWeight);
  const [gender, setGender] = useState<Gender>(defaultGender);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(defaultActivity);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleLoading(true);

    try {
      const user = await loginWithGoogle(weight, gender, activityLevel);
      onSuccess(user);
      onClose();
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/popup-closed-by-user')) {
        setErrorMessage('Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.');
      } else if (msg.includes('auth/cancelled-popup-request')) {
        setErrorMessage('Yêu cầu đăng nhập đã bị hủy.');
      } else if (msg.includes('auth/popup-blocked')) {
        setErrorMessage('Trình duyệt đã chặn cửa sổ đăng nhập Google. Vui lòng cho phép popup để tiếp tục.');
      } else if (msg.includes('auth/operation-not-allowed')) {
        setErrorMessage('Phương thức đăng nhập bằng Google chưa được bật trong Firebase Console.');
      } else if (msg.includes('auth/network-request-failed')) {
        setErrorMessage('Lỗi kết nối mạng, vui lòng kiểm tra đường truyền.');
      } else {
        setErrorMessage('Lỗi đăng nhập Google: ' + msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Vui lòng nhập đầy đủ email và mật khẩu.');
        }
        const user = await loginWithEmail(email, password);
        onSuccess(user);
        onClose();
      } else if (mode === 'register') {
        if (!email.trim() || !password) {
          throw new Error('Vui lòng nhập đầy uppercase email và mật khẩu.');
        }
        if (password.length < 6) {
          throw new Error('Mật khẩu cần có ít nhất 6 ký tự.');
        }
        const user = await registerWithEmail(
          email,
          password,
          displayName,
          weight,
          gender,
          activityLevel
        );
        onSuccess(user);
        onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Vui lòng nhập địa chỉ email đã đăng ký.');
        }
        await sendResetPassword(email);
        setSuccessMessage('Đã gửi email liên kết khôi phục mật khẩu. Vui lòng kiểm tra hộp thư!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setErrorMessage('Email hoặc mật khẩu không chính xác.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setErrorMessage('Email này đã được đăng ký. Vui lòng chọn Đăng nhập.');
      } else if (msg.includes('auth/invalid-email')) {
        setErrorMessage('Địa chỉ email không đúng định dạng.');
      } else if (msg.includes('auth/user-not-found')) {
        setErrorMessage('Không tìm thấy tài khoản với email này.');
      } else if (msg.includes('auth/weak-password')) {
        setErrorMessage('Mật khẩu quá ngắn, vui lòng nhập ít nhất 6 ký tự.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Đóng popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center mx-auto mb-3 text-2xl shadow-md shadow-sky-200 dark:shadow-none">
            💧
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {mode === 'login'
              ? 'Đăng nhập tài khoản'
              : mode === 'register'
              ? 'Tạo tài khoản mới'
              : 'Khôi phục mật khẩu'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-200 mt-1 font-medium">
            {mode === 'login'
              ? 'Đồng bộ dữ liệu nước, mục tiêu và lịch sử trên mọi thiết bị'
              : mode === 'register'
              ? 'Bắt đầu theo dõi và bảo vệ sức khỏe cùng Nhắc Uống Nước'
              : 'Nhập email để nhận liên kết đặt lại mật khẩu của bạn'}
          </p>
        </div>

        {/* Google Sign-in Section (visible for login and register) */}
        {mode !== 'forgot' && (
          <div className="mb-4 space-y-4">
            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <span className="animate-spin text-base">⏳</span>
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Đang mở đăng nhập...' : 'Đăng nhập bằng Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink mx-3 text-slate-400 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Hoặc bằng Email
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Họ và tên hoặc Biệt danh
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Long"
                  className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@gmail.com"
                className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Mật khẩu
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-semibold text-sky-600 dark:text-cyan-300 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* Registration Extra Personalization */}
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Cân nặng (kg)
                </label>
                <input
                  type="number"
                  min="20"
                  max="250"
                  required
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Giới tính
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold"
                >
                  <option value="female">Nữ</option>
                  <option value="male">Nam</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-sm font-extrabold shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin text-lg">⏳</span>
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? 'Đăng nhập với Email'
                    : mode === 'register'
                    ? 'Hoàn tất đăng ký Email'
                    : 'Gửi email khôi phục'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode links */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-600 dark:text-slate-300">
          {mode === 'login' ? (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-extrabold text-sky-600 dark:text-cyan-300 hover:underline"
              >
                Đăng ký thành viên
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-extrabold text-sky-600 dark:text-cyan-300 hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          ) : (
            <p>
              Nhớ mật khẩu rồi?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-extrabold text-sky-600 dark:text-cyan-300 hover:underline"
              >
                Quay lại Đăng nhập
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
