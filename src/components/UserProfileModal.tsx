import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel } from '../types';
import { calculateProgressTarget, calculateWaterRange, formatMl } from '../utils/waterMath';

interface UserProfileModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose?: () => void;
  isFirstLaunch?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  initialProfile,
  onSave,
  onClose,
  isFirstLaunch = false,
}) => {
  const [gender, setGender] = useState<Gender>(initialProfile.gender || 'female');
  const [weight, setWeight] = useState<number>(initialProfile.weight || 60);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile.activityLevel || 'moderate'
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const previewTarget = calculateProgressTarget(weight);
  const previewRange = calculateWaterRange(weight);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || weight < 20 || weight > 250) {
      setError('Vui lòng nhập cân nặng hợp lý (từ 20 đến 250 kg).');
      return;
    }

    onSave({
      gender,
      weight: Number(weight),
      activityLevel,
      isConfigured: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 max-h-[92vh] overflow-y-auto transition-colors">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-300 text-white flex items-center justify-center mx-auto mb-3 text-2xl shadow-md shadow-sky-200 dark:shadow-none">
            💧
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {isFirstLaunch ? 'Chào mừng bạn đến với Nhắc Uống Nước' : 'Cập nhật thông tin'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {isFirstLaunch
              ? 'Thiết lập thông tin để tính toán lượng nước khuyến nghị hàng ngày'
              : 'Điều chỉnh cân nặng và mức độ vận động của bạn'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cân nặng (kg) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Cân nặng của bạn (kg) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="20"
                max="250"
                step="0.5"
                required
                value={weight || ''}
                onChange={(e) => {
                  setWeight(parseFloat(e.target.value) || 0);
                  if (error) setError(null);
                }}
                placeholder="Ví dụ: 60"
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 dark:text-slate-400">
                kg
              </span>
            </div>
            {error && <p className="text-xs text-rose-500 mt-1 font-semibold">{error}</p>}
          </div>

          {/* Giới tính */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Giới tính
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'male' as Gender, label: 'Nam' },
                { id: 'female' as Gender, label: 'Nữ' },
                { id: 'other' as Gender, label: 'Khác' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    gender === g.id
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1 font-medium">
              Thông tin hồ sơ tham khảo, không làm biến đổi công thức tính nước.
            </p>
          </div>

          {/* Mức độ vận động */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Mức độ hoạt động
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low' as ActivityLevel, label: 'Ít vận động' },
                { id: 'moderate' as ActivityLevel, label: 'Vừa phải' },
                { id: 'high' as ActivityLevel, label: 'Nhiều' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setActivityLevel(lvl.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    activityLevel === lvl.id
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time preview card */}
          {weight >= 20 && (
            <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-slate-800/90 border border-sky-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200">
              <div className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                Mục tiêu ước tính
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Khoảng tham khảo:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {formatMl(previewRange.min)} – {formatMl(previewRange.max)} ml/ngày
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mục tiêu tiến độ:</span>
                <span className="text-base font-extrabold text-sky-600 dark:text-sky-300">
                  {formatMl(previewTarget)} ml
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 italic leading-relaxed font-medium">
                Lượng nước trên là mức tham khảo chung. Nhu cầu thực tế có thể thay đổi tùy cơ thể, thời tiết, mức độ vận động và tình trạng sức khỏe.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            {!isFirstLaunch && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-sm font-extrabold shadow-md shadow-sky-500/20 transition-all"
            >
              {isFirstLaunch ? 'Bắt đầu sử dụng' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
