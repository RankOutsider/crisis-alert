'use client';

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { Bell, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        notificationsEnabled: true, // Giá trị mặc định ban đầu
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

    // 1. Lấy cài đặt hiện tại của người dùng khi trang được tải
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                const userData = await api('auth/me'); // API này giờ đã trả về 'notificationsEnabled'
                if (userData) {
                    setSettings({
                        notificationsEnabled: userData.notificationsEnabled,
                    });
                }
            } catch (err) {
                setError('Failed to load settings.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // 2. Hàm xử lý khi người dùng nhấn nút bật/tắt
    const handleToggleNotifications = async () => {
        const newSetting = !settings.notificationsEnabled;

        // Cập nhật giao diện ngay lập tức để người dùng thấy phản hồi
        setSettings(prev => ({ ...prev, notificationsEnabled: newSetting }));
        setSaveStatus({ type: '', message: '' }); // Reset thông báo

        try {
            // Gọi API để lưu thay đổi
            await api('auth/settings', {
                method: 'PUT',
                body: JSON.stringify({ notificationsEnabled: newSetting }),
            });
            setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
        } catch (err) {
            // Nếu có lỗi, trả lại trạng thái cũ trên giao diện
            setSettings(prev => ({ ...prev, notificationsEnabled: !newSetting }));
            setSaveStatus({ type: 'error', message: 'Failed to save settings.' });
        } finally {
            // Tự động ẩn thông báo sau 3 giây
            setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-400">Loading settings...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400">{error}</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400 mb-8">Manage your notification preferences.</p>

            <div className="bg-slate-800/50 p-6 rounded-lg max-w-2xl">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <Bell size={24} />
                    Notification Settings
                </h2>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-4">
                        <Mail size={20} className="text-slate-400" />
                        <div>
                            <h3 className="font-medium text-white">Email Notifications</h3>
                            <p className="text-sm text-slate-400">Receive an email for every new post that matches your active alerts.</p>
                        </div>
                    </div>
                    {/* Nút bật/tắt */}
                    <button
                        onClick={handleToggleNotifications}
                        className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors flex-shrink-0 ${settings.notificationsEnabled ? 'bg-blue-600' : 'bg-slate-600'
                            }`}
                    >
                        <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                </div>

                {/* Khung thông báo lưu thành công/thất bại */}
                {saveStatus.message && (
                    <div className={`mt-4 p-3 rounded-md flex items-center gap-2 text-sm ${saveStatus.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                        {saveStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {saveStatus.message}
                    </div>
                )}
            </div>
        </div>
    );
}