// frontend/app/dashboard/settings/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { Bell, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        notificationsEnabled: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

    // 📥 Lấy dữ liệu người dùng
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                const userData = await api('auth/me');
                if (userData) {
                    setSettings({
                        notificationsEnabled: userData.notificationsEnabled,
                    });
                }
            } catch {
                setError('Failed to load settings.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // 💾 Lưu cài đặt khi người dùng bật/tắt
    const handleToggleNotifications = async () => {
        const newSetting = !settings.notificationsEnabled;
        setSettings(prev => ({ ...prev, notificationsEnabled: newSetting }));
        setSaveStatus({ type: '', message: '' });

        try {
            await api('auth/settings', {
                method: 'PUT',
                body: JSON.stringify({ notificationsEnabled: newSetting }),
            });
            setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
        } catch {
            setSettings(prev => ({ ...prev, notificationsEnabled: !newSetting }));
            setSaveStatus({ type: 'error', message: 'Failed to save settings.' });
        } finally {
            setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
        }
    };

    // 🌀 Trạng thái tải / lỗi
    if (isLoading) {
        return (
            <main className="p-6 sm:p-8 min-h-screen flex items-center justify-center">
                <div className="text-gray-400 text-center text-base sm:text-lg">Loading settings...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="p-6 sm:p-8 min-h-screen flex items-center justify-center">
                <div className="text-red-400 text-center text-base sm:text-lg">{error}</div>
            </main>
        );
    }

    return (
        <main className="p-4 sm:p-6 md:p-8 min-h-screen text-gray-200 bg-gray-900/80 overflow-x-hidden">
            <div className="max-w-3xl mx-auto scroll-mt-20">
                <header className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Settings</h1>
                    <p className="text-gray-300 text-sm sm:text-base">
                        Manage your notification preferences.
                    </p>
                </header>

                <section className="bg-slate-800/50 backdrop-blur-md p-5 sm:p-6 rounded-xl shadow-lg border border-slate-700/30">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-5 flex items-center gap-3">
                        <Bell size={22} className="text-blue-400" />
                        Notification Settings
                    </h2>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-700/40 rounded-lg">
                        <div className="flex items-start gap-3 min-w-0">
                            <Mail size={20} className="text-blue-300 mt-1" />
                            <div>
                                <h3 className="font-medium text-white">Email Notifications</h3>
                                <p className="text-sm text-slate-400 leading-snug">
                                    Receive an email for every new post that matches your active alerts.
                                </p>
                            </div>
                        </div>

                        {/* Nút bật/tắt */}
                        <button
                            onClick={handleToggleNotifications}
                            className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300
                                ${settings.notificationsEnabled ? 'bg-blue-600' : 'bg-slate-600'}
                            `}
                        >
                            <span
                                className={`inline-block w-6 h-6 transform bg-white rounded-full shadow transition-transform duration-300
                                    ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}
                                `}
                            />
                        </button>
                    </div>

                    {/* Thông báo lưu thành công/thất bại */}
                    {saveStatus.message && (
                        <div
                            className={`mt-5 flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-all duration-300
                                ${saveStatus.type === 'success'
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'}
                            `}
                        >
                            {saveStatus.type === 'success' ? (
                                <CheckCircle size={18} />
                            ) : (
                                <AlertCircle size={18} />
                            )}
                            <span>{saveStatus.message}</span>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}