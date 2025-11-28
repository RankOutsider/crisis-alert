// frontend/app/dashboard/settings/page.jsx
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { api, fetcher, clearToken } from '@/utils/api';
import { useRouter } from 'next/navigation';

import {
    Mail, Save, Loader2, Settings,
    CheckCircle2, ShieldAlert, X, Lock, LogOut, AlertTriangle
} from 'lucide-react';

import EmailTagInput from '@/app/components/EmailTagInput';

// --- CÁC HÀM CHUYỂN ĐỔI DỮ LIỆU ---
const stringToArray = (str) => {
    if (!str) return [];
    return str.split(',')
        .map(e => e.trim())
        .filter(e => e !== '');
};

const arrayToString = (arr) => {
    return arr.join(', ');
};

// --- COMPONENT TOAST ---
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div
            className={`fixed bottom-6 right-6 left-6 sm:left-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 text-sm ${type === 'success'
                ? 'bg-green-600/95 text-white'
                : 'bg-red-600/95 text-white'
                } animate-fadeIn`}
        >
            {type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <ShieldAlert size={20} className="shrink-0" />}
            <span className="break-words line-clamp-2">{message}</span>
            <button onClick={onClose} className="ml-auto hover:opacity-75 shrink-0">
                <X size={16} />
            </button>
        </div>
    );
}

// --- MODAL XÁC NHẬN VÔ HIỆU HÓA ---
function DisableAccountModal({ onConfirm, onClose, isProcessing }) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-800 border border-yellow-600/50 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="p-5 border-b border-yellow-600/30 bg-yellow-900/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={24} className="text-yellow-500 shrink-0" />
                        <h3 className="text-xl font-bold text-white">Disable Account?</h3>
                    </div>
                    <button onClick={onClose} disabled={isProcessing} className="text-slate-400 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4">
                    <p className="text-lg font-medium text-yellow-100">Warning: You will be logged out immediately!</p>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Are you sure you want to disable your account? You can reactivate it anytime by logging in again.
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 flex flex-col sm:flex-row gap-2">
                    {/* Nút Confirm */}
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="w-full sm:flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors bg-red-600 hover:bg-red-500 text-white disabled:bg-slate-600 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                    >
                        {isProcessing ? (
                            <><Loader2 size={18} className="animate-spin" /> Processing...</>
                        ) : (
                            <><LogOut size={18} />Disable & Logout</>
                        )}
                    </button>
                    {/* Nút Cancel */}
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full sm:flex-1 py-3 rounded-lg font-semibold text-sm transition-colors text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function SettingsPage() {
    const router = useRouter(); // Khai báo useRouter

    // --- KHAI BÁO STATE CHÍNH ---
    const [formValues, setFormValues] = useState({ notificationsEnabled: true, ccEmailsArray: [] });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isToggleSaving, setIsToggleSaving] = useState(false);
    const [toast, setToast] = useState({ type: '', message: '' });

    // Quản lý Modal Disable
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [isDisabling, setIsDisabling] = useState(false);

    // --- LẤY DỮ LIỆU USER ---
    const { data: userData, error: swrError, mutate } = useSWR('/api/auth/me', fetcher);
    // Lấy trạng thái hoạt động hiện tại (is_active)
    const isAccountActive = userData?.is_active ?? true;
    // Kiểm tra xem có bị Admin khóa không (chỉ Admin mới có thể khóa Admin Lock)
    const isLockedByAdmin = userData?.is_active_admin === false;

    const ccEmailLimit = useMemo(() => {
        if (!userData) return 5;
        switch (userData.subscriptionTier) {
            case 'Pro': return 500;
            case 'VIP': return 50;
            case 'Free':
            default: return 5;
        }
    }, [userData]);

    const hasReachedLimit = useMemo(() => {
        return formValues.ccEmailsArray.length >= ccEmailLimit;
    }, [formValues.ccEmailsArray, ccEmailLimit]);


    useEffect(() => {
        if (userData) {
            setFormValues({
                notificationsEnabled: userData.notificationsEnabled ?? true,
                ccEmailsArray: stringToArray(userData.cc_emails)
            });
            setIsLoading(false);
        } else if (swrError) {
            setIsLoading(false);
            setError('Failed to load initial settings.');
        }
    }, [userData, swrError]);

    // --- HANDLERS ---
    const handleCcEmailsChange = (newEmailsArray) => {
        if (newEmailsArray.length > ccEmailLimit) {
            setToast({ type: 'error', message: `Your plan limit is ${ccEmailLimit} CC emails.` });
            return;
        }
        setFormValues(prev => ({ ...prev, ccEmailsArray: newEmailsArray }));
    };

    const handleToggleNotificationsClick = async () => {
        const newSetting = !formValues.notificationsEnabled;
        setFormValues(prev => ({ ...prev, notificationsEnabled: newSetting }));
        setIsToggleSaving(true);
        setToast({ type: '', message: '' });

        try {
            await api('auth/settings', {
                method: 'PUT',
                body: JSON.stringify({ notificationsEnabled: newSetting }),
            });
            setToast({ type: 'success', message: newSetting ? 'Notifications enabled!' : 'Notifications disabled.' });
        } catch (err) {
            setFormValues(prev => ({ ...prev, notificationsEnabled: !newSetting }));
            setToast({ type: 'error', message: 'Failed to save notification setting.' });
        } finally {
            setIsToggleSaving(false);
        }
    };

    const handleSubmitCcEmails = useCallback(async (e) => {
        e.preventDefault();
        if (formValues.ccEmailsArray.length > ccEmailLimit) {
            setToast({ type: 'error', message: `Cannot save. Your plan limit is ${ccEmailLimit} CC emails.` });
            return;
        }

        setIsSaving(true);
        setToast({ type: '', message: '' });

        const ccEmailsString = arrayToString(formValues.ccEmailsArray);

        try {
            await api('auth/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    cc_emails: ccEmailsString
                }),
            });

            mutate();
            setToast({ type: 'success', message: 'CC Email list updated successfully!' });

        } catch (err) {
            const errorMessage = err.message || "Failed to save CC emails.";
            setToast({ type: 'error', message: errorMessage });
        } finally {
            setIsSaving(false);
        }
    }, [formValues, mutate, ccEmailLimit]);


    // Xử lý Tắt/Bật Tài khoản
    const handleAccountToggle = useCallback(async (newIsActive) => {
        if (isLockedByAdmin && newIsActive === true) {
            // Không cho phép bật nếu bị Admin khóa
            setToast({ type: 'error', message: 'Cannot reactivate. This account is locked by the Administrator.' });
            return;
        }

        if (!newIsActive) {
            // Nếu người dùng chọn TẮT (disable), hiện modal xác nhận trước
            setShowDisableModal(true);
            return;
        }

        // --- Logic tái kích hoạt (Reactivate) ---
        setIsDisabling(true);
        setToast({ type: '', message: '' });

        try {
            await api('auth/settings', {
                method: 'PUT',
                body: JSON.stringify({ is_active: true }),
            });

            await mutate();
            setToast({ type: 'success', message: 'Account reactivated successfully!' });

        } catch (err) {
            setToast({ type: 'error', message: 'Failed to reactivate account.' });
        } finally {
            setIsDisabling(false);
        }

    }, [isLockedByAdmin, mutate]);

    // Logic Xử lý Xác nhận Disable & Logout
    const handleDisableConfirm = useCallback(async () => {
        setIsDisabling(true);
        setToast({ type: '', message: '' });

        try {
            await api('auth/settings', {
                method: 'PUT',
                body: JSON.stringify({ is_active: false }),
            });

            // Sau khi vô hiệu hóa thành công, xóa token và chuyển hướng ngay tức thì
            clearToken();
            router.replace('/login');

            // Hiện toast (sẽ bị mất sau redirect, nhưng nên có cho log)
            console.log("Account disabled successfully. Redirecting...");

        } catch (err) {
            setIsDisabling(false);
            setShowDisableModal(false);
            setToast({ type: 'error', message: 'Failed to disable account. Please try again.' });
        }
    }, [router]);

    if (isLoading || !userData) return <div className="p-8 text-center text-gray-400 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

    return (
        // Đảm bảo layout co dãn tốt trên màn hình nhỏ
        <div className="w-full max-w-full text-gray-200 box-border">
            <div className="max-w-3xl mx-auto w-full">

                <header className="mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Settings className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
                        <span>Settings</span>
                    </h1>
                    <p className="text-gray-300 text-xs sm:text-base">
                        Manage your notification preferences and account status.
                    </p>
                </header>

                {/* --- CARD 1: Account Status --- */}
                <div className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/30 mb-6 w-full overflow-hidden">
                    <h2 className="text-base sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                        <Lock size={20} className="text-blue-400" />
                        Account Status
                    </h2>

                    {/* Khối hiển thị trạng thái chính */}
                    <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border w-full transition-colors 
                        ${isLockedByAdmin
                            ? 'bg-red-900/20 border-red-800' // Giao diện khi bị Admin khóa
                            : isAccountActive
                                ? 'bg-green-900/20 border-green-800' // Giao diện khi Active
                                : 'bg-slate-700/40 border-slate-600' // Giao diện khi User tự tắt
                        }`}>

                        <div className="flex items-start gap-3 flex-1 min-w-0 mr-4">
                            <div className={`mt-1 p-1.5 rounded-full shrink-0 ${isAccountActive ? 'bg-green-500/20' : 'bg-slate-600/30'}`}>
                                {isLockedByAdmin ? (
                                    <ShieldAlert size={18} className="text-red-500" />
                                ) : (
                                    <CheckCircle2 size={18} className={isAccountActive ? 'text-green-500' : 'text-slate-400'} />
                                )}
                            </div>

                            <div className="flex flex-col min-w-0">
                                <span className="font-medium text-white text-sm sm:text-base flex items-center gap-2">
                                    {isLockedByAdmin
                                        ? 'Account Locked'
                                        : isAccountActive ? 'Active' : 'Disabled'}
                                    {isDisabling && <Loader2 size={14} className="animate-spin text-blue-300" />}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-400 leading-snug break-words mt-0.5">
                                    {isLockedByAdmin
                                        ? 'Restricted by Administrator.'
                                        : isAccountActive
                                            ? 'Your account is visible and active.'
                                            : 'You have disabled your account.'}
                                </span>
                            </div>
                        </div>

                        {/* Nút Toggle Switch */}
                        <label htmlFor="toggle-active" className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                id="toggle-active"
                                checked={isAccountActive}
                                onChange={() => handleAccountToggle(!isAccountActive)}
                                className="sr-only peer"
                                // KHÓA toggle nếu đang bị Admin Lock HOẶC đang xử lý
                                disabled={isLockedByAdmin || isDisabling}
                            />
                            {/* Style cho Track */}
                            <div className={`w-12 h-7 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 transition-colors
                                ${isLockedByAdmin
                                    ? 'bg-red-900/50 cursor-not-allowed opacity-60'
                                    : 'bg-slate-600 peer-checked:bg-green-600 cursor-pointer'
                                }`}></div>

                            {/* Style cho Thumb */}
                            <div className={`absolute top-1 left-1 bg-white border-gray-300 border rounded-full h-5 w-5 transition-all 
                                peer-checked:translate-x-5 
                                ${isLockedByAdmin ? 'opacity-50' : ''}`}></div>
                        </label>
                    </div>

                    {/* Hướng dẫn chi tiết khi bị Admin khóa */}
                    {isLockedByAdmin && (
                        <div className="mt-3 p-3 bg-red-950/40 border border-red-900/50 rounded-lg flex gap-3 items-start">
                            <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
                            <div className="text-xs sm:text-sm text-red-200">
                                <p className="font-semibold mb-1">Action Required</p>
                                <p>Your account has been locked by an administrator due to a policy violation or review request.
                                    Please log out and check the login screen to submit a <b>Reactivation Request</b>.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- CARD 2: Cài đặt Notification --- */}
                <div className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/30 mb-6 w-full overflow-hidden">
                    <h2 className="text-base sm:text-xl font-semibold text-white mb-3 sm:mb-4">Notifications</h2>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-700/40 rounded-lg border border-slate-600 w-full">
                        <div className="flex items-start gap-3 flex-1 min-w-0 mr-2">
                            <Mail className="text-blue-300 mt-1 shrink-0 w-5 h-5" />
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium text-white text-sm sm:text-base flex items-center flex-wrap gap-2">
                                    Email Notifications
                                    {isToggleSaving && <Loader2 size={14} className="animate-spin text-blue-300" />}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-400 leading-snug break-words">
                                    Receive alerts to your primary email.
                                </span>
                            </div>
                        </div>
                        <label htmlFor="toggle-notifications" className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                id="toggle-notifications"
                                checked={formValues.notificationsEnabled}
                                onChange={handleToggleNotificationsClick}
                                className="sr-only peer"
                                disabled={isToggleSaving}
                            />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                {/* --- CARD 3: Cài đặt CC Email --- */}
                <form onSubmit={handleSubmitCcEmails} className="space-y-6 w-full mb-10">
                    <div className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/30 w-full overflow-hidden">

                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 mb-3 sm:mb-4">
                            <h2 className="text-base sm:text-xl font-semibold text-white">CC Emails</h2>
                            <span className={`text-sm font-semibold ${hasReachedLimit ? 'text-red-400' : 'text-gray-400'}`}>
                                {formValues.ccEmailsArray.length} / {ccEmailLimit} used
                            </span>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-400 mb-4">
                            Secondary emails to receive alert copies.
                        </p>

                        <div className="w-full max-w-full overflow-hidden">
                            <EmailTagInput
                                emails={formValues.ccEmailsArray}
                                onChange={handleCcEmailsChange}
                                disabled={isSaving}
                                isLimitReached={hasReachedLimit}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>

                {toast.message && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast({ type: '', message: '' })}
                    />
                )}
            </div>

            {/* HIỂN THỊ MODAL XÁC NHẬN VÔ HIỆU HÓA */}
            {showDisableModal && (
                <DisableAccountModal
                    onConfirm={handleDisableConfirm}
                    onClose={() => setShowDisableModal(false)}
                    isProcessing={isDisabling}
                />
            )}
        </div>
    );
}