import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Key,
  Info,
} from 'lucide-react';
import { AppUser, NotificationTemplate } from '../types';
import {
  adminFetchAllMembers,
  adminGrantRole,
  adminRevokeRole,
  adminFetchNotificationTemplates,
  adminSaveNotificationTemplate,
  adminDeleteNotificationTemplate,
  claimBootstrapAdmin,
  FIRST_ADMIN_EMAIL,
} from '../services/firebaseService';

interface AdminTabProps {
  currentUser: AppUser | null;
  onRefreshUserRole: () => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({ currentUser, onRefreshUserRole }) => {
  const [members, setMembers] = useState<AppUser[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New template form
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isOwnerEmail = currentUser?.email?.toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase();

  const loadData = async () => {
    if (!isAdmin) return;
    setLoadingMembers(true);
    setLoadingTemplates(true);
    try {
      const [m, t] = await Promise.all([
        adminFetchAllMembers(),
        adminFetchNotificationTemplates(),
      ]);
      setMembers(m);
      setTemplates(t);
    } catch (err: unknown) {
      console.error('Error fetching admin data:', err);
      setFeedback({ type: 'error', text: 'Lỗi tải dữ liệu quản trị: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setLoadingMembers(false);
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const handleGrantAdmin = async (target: AppUser) => {
    if (!currentUser) return;
    if (target.role === 'admin') return;

    const ok = window.confirm(`Bạn có chắc chắn muốn cấp quyền Admin cho tài khoản ${target.email}?`);
    if (!ok) return;

    try {
      await adminGrantRole(target.uid, target.email, currentUser.uid);
      setFeedback({ type: 'success', text: `Đã cấp quyền Admin cho ${target.email}` });
      await loadData();
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: 'Lỗi phân quyền: ' + (err instanceof Error ? err.message : String(err)) });
    }
  };

  const handleRevokeAdmin = async (target: AppUser) => {
    if (target.email.toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase()) {
      alert('Không thể thu hồi quyền của Super Admin gốc.');
      return;
    }

    const ok = window.confirm(`Bạn có chắc chắn muốn thu hồi quyền Admin của ${target.email}?`);
    if (!ok) return;

    try {
      await adminRevokeRole(target.uid);
      setFeedback({ type: 'success', text: `Đã chuyển tài khoản ${target.email} về Member` });
      await loadData();
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: 'Lỗi thu hồi quyền: ' + (err instanceof Error ? err.message : String(err)) });
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    setCreatingTemplate(true);
    try {
      const newT: NotificationTemplate = {
        id: 'tpl_' + Date.now(),
        title: newTitle.trim(),
        body: newBody.trim(),
        active: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || 'admin',
      };
      await adminSaveNotificationTemplate(newT);
      setNewTitle('');
      setNewBody('');
      setFeedback({ type: 'success', text: 'Đã thêm mẫu thông báo nhắc nhở mới!' });
      await loadData();
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: 'Lỗi lưu thông báo: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await adminDeleteNotificationTemplate(id);
      setFeedback({ type: 'success', text: 'Đã xóa mẫu thông báo.' });
      await loadData();
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: 'Lỗi xóa thông báo: ' + (err instanceof Error ? err.message : String(err)) });
    }
  };

  const handleBootstrapAdmin = async () => {
    if (!currentUser) return;
    try {
      const success = await claimBootstrapAdmin(currentUser.uid, currentUser.email);
      if (success) {
        setFeedback({ type: 'success', text: 'Chúc mừng! Bạn đã kích hoạt thành công quyền Admin đầu tiên.' });
        onRefreshUserRole();
      } else {
        setFeedback({ type: 'error', text: 'Chỉ email chủ sở hữu ' + FIRST_ADMIN_EMAIL + ' mới được cấp quyền tự động.' });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: 'Lỗi kích hoạt Admin: ' + (err instanceof Error ? err.message : String(err)) });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-sky-500 dark:text-cyan-400" />
            <span>Khu vực Quản trị (Admin Dashboard)</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
            Quản lý thành viên, phân quyền bảo mật Firestore và nội dung thông báo nhắc nhở
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="underline text-[11px] ml-2">
            Đóng
          </button>
        </div>
      )}

      {/* ACCESS CONTROL CHECK */}
      {!isAdmin && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Quyền truy cập bị giới hạn
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto leading-relaxed font-medium">
              Bạn đang đăng nhập với vai trò <strong>Member</strong>. Chỉ tài khoản có quyền <strong>Admin</strong> trong cơ sở dữ liệu Firestore mới có thể truy cập trang quản trị.
            </p>
          </div>

          {/* Bootstrap First Admin Guide */}
          {isOwnerEmail ? (
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 max-w-md mx-auto text-left space-y-2.5">
              <div className="flex items-center gap-2 text-sky-800 dark:text-cyan-300 font-bold text-xs">
                <Key className="w-4 h-4" />
                <span>Kích hoạt Admin đầu tiên</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                Tài khoản của bạn ({currentUser?.email}) khớp với email chủ sở hữu hệ thống. Bấm nút dưới để cấp quyền Admin an toàn vào Firestore:
              </p>
              <button
                onClick={handleBootstrapAdmin}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Kích hoạt quyền Admin cho tài khoản này</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-800 dark:text-slate-100 block mb-1">
                Hướng dẫn tạo Admin đầu tiên an toàn:
              </span>
              1. Đăng ký tài khoản với email chủ sở hữu: <strong className="text-sky-600 dark:text-cyan-300">{FIRST_ADMIN_EMAIL}</strong><br />
              2. Hệ thống sẽ tự động kích hoạt tài khoản này thành Admin.<br />
              3. Từ đó, Admin có thể cấp quyền Admin cho các tài khoản thành viên khác ngay tại giao diện này.
            </div>
          )}
        </div>
      )}

      {/* ADMIN CONTENT (VISIBLE ONLY TO CONFIRMED ADMINS) */}
      {isAdmin && (
        <>
          {/* Stats overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs font-bold">
                <span>Tổng thành viên</span>
                <Users className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {members.length}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs font-bold">
                <span>Số lượng Admin</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {members.filter((m) => m.role === 'admin').length}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs font-bold">
                <span>Mẫu câu nhắc trendy</span>
                <Bell className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {templates.length}
              </div>
            </div>
          </div>

          {/* 1. Members Management Section */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-500 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Danh sách thành viên & Phân quyền
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-300 font-semibold">
                {loadingMembers ? 'Đang tải...' : `${members.length} tài khoản`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Tên / Email</th>
                    <th className="py-2.5 px-3">Cân nặng</th>
                    <th className="py-2.5 px-3">Vai trò</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {members.map((m) => {
                    const isSelf = m.uid === currentUser?.uid;
                    const isRoot = m.email.toLowerCase() === FIRST_ADMIN_EMAIL.toLowerCase();

                    return (
                      <tr key={m.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {m.displayName || 'Thành viên'}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] font-bold text-sky-700 dark:text-cyan-300 bg-sky-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-sky-200 dark:border-slate-700">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                            {m.email}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-semibold">
                          {m.weight || 60} kg
                        </td>

                        <td className="py-3 px-3">
                          {m.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              Member
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {isRoot ? (
                            <span className="text-[11px] text-slate-400 italic">Super Admin</span>
                          ) : m.role === 'admin' ? (
                            <button
                              onClick={() => handleRevokeAdmin(m)}
                              className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              Gỡ quyền Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGrantAdmin(m)}
                              className="py-1 px-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-extrabold transition-colors shadow-xs"
                            >
                              Cấp Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Notification Templates Management */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-500 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Quản lý nội dung thông báo nhắc nhở (Trendy)
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-300 font-semibold">
                {templates.length} câu nhắc
              </span>
            </div>

            {/* Form to add template */}
            <form onSubmit={handleCreateTemplate} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Thêm mẫu thông báo mới:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Tiêu đề (VD: 💧 Alooo, uống nước đi bà!)"
                  className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Nội dung (VD: Cơ thể đang réo tên bạn đó 😭 Đi làm một ngụm ngay đi!)"
                  className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={creatingTemplate}
                  className="py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lưu mẫu câu nhắc</span>
                </button>
              </div>
            </form>

            {/* Template List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {templates.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-4">
                  Chưa có mẫu câu thông báo tùy chỉnh nào được lưu trong Firestore.
                </p>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {tpl.title}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 mt-0.5 font-medium leading-relaxed">
                        {tpl.body}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                      title="Xóa mẫu thông báo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
