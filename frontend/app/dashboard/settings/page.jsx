'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { api, fetcher } from '@/utils/api';

import {
    Mail, Save, Loader2, Settings,
    CheckCircle2, ShieldAlert, X
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

export default function SettingsPage() {
    // --- KHAI BÁO STATE CHÍNH ---
    const [formValues, setFormValues] = useState({ notificationsEnabled: true, ccEmailsArray: [] });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isToggleSaving, setIsToggleSaving] = useState(false);
    const [toast, setToast] = useState({ type: '', message: '' });

    // --- LẤY DỮ LIỆU USER ---
    const { data: userData, error: swrError, mutate } = useSWR('/api/auth/me', fetcher);

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
            try {
                const parsedError = JSON.parse(errorMessage);
                setToast({ type: 'error', message: parsedError.message || 'Invalid data was sent.' });
            } catch (parseError) {
                setToast({ type: 'error', message: errorMessage });
            }
        } finally {
            setIsSaving(false);
        }
    }, [formValues, mutate, ccEmailLimit]);

    if (isLoading || !userData) return <div className="p-8 text-center text-gray-400 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

    return (
        // 👇 ĐÃ SỬA: Đổi main -> div, Bỏ padding (p-3 sm:p-6...) để tránh padding kép với Layout
        <div className="w-full max-w-full text-gray-200 box-border">
            <div className="max-w-3xl mx-auto w-full">

                <header className="mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Settings className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
                        <span>Notification Settings</span>
                    </h1>
                    <p className="text-gray-300 text-xs sm:text-base">
                        Manage your notification preferences and secondary email list.
                    </p>
                </header>

                {/* --- CARD 1: Cài đặt chung --- */}
                <div className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/30 mb-6 w-full overflow-hidden">
                    <h2 className="text-base sm:text-xl font-semibold text-white mb-3 sm:mb-4">General Notification</h2>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-700/40 rounded-lg border border-slate-600 w-full">
                        <div className="flex items-start gap-3 flex-1 min-w-0 mr-2">
                            <Mail className="text-blue-300 mt-1 shrink-0 w-5 h-5" />
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium text-white text-sm sm:text-base flex items-center flex-wrap gap-2">
                                    Enable Email Notifications
                                    {isToggleSaving && <Loader2 size={14} className="animate-spin text-blue-300" />}
                                </span>
                                {/* break-words để email dài tự xuống dòng */}
                                <span className="text-xs sm:text-sm text-gray-400 leading-snug break-words">
                                    Receive alerts to ({userData.email}).
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

                {/* --- CARD 2: Cài đặt CC Email --- */}
                <form onSubmit={handleSubmitCcEmails} className="space-y-6 w-full">
                    <div className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/30 w-full overflow-hidden">

                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 mb-3 sm:mb-4">
                            <h2 className="text-base sm:text-xl font-semibold text-white">CC Email List (Carbon Copy)</h2>
                            <span className={`text-sm font-semibold ${hasReachedLimit ? 'text-red-400' : 'text-gray-400'}`}>
                                Email count: {formValues.ccEmailsArray.length} / {ccEmailLimit}
                            </span>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-400 mb-4">
                            Secondary emails to receive alert copies. Your plan allows up to {ccEmailLimit} emails.
                        </p>

                        {/* Thêm overflow-hidden cho container này */}
                        <div className="w-full max-w-full overflow-hidden">
                            <EmailTagInput
                                emails={formValues.ccEmailsArray}
                                onChange={handleCcEmailsChange}
                                disabled={isSaving}
                                isLimitReached={hasReachedLimit}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isSaving ? 'Saving...' : 'Save CC List'}
                        </button>
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
        </div>
    );
}