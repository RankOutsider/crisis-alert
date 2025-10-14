'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearToken } from '@/utils/api';
import { User, KeyRound, Mail, Phone, Save, Loader2, ShieldAlert, X } from 'lucide-react';

// Class dùng chung cho các ô input
const inputClasses = "w-full px-4 py-2 bg-slate-700/80 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors";


// === COMPONENT CON: MODAL XÓA TÀI KHOẢN ===
function DeleteAccountModal({ onClose, onDelete }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError('');
        try {
            await onDelete(password);
            // Component cha sẽ xử lý việc đóng modal và chuyển hướng
        } catch (err) {
            setError(err.message || 'Failed to delete account.');
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-red-500/50 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-red-400 flex items-center gap-2">
                        <ShieldAlert size={24} />
                        Delete Account
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-300">This action is irreversible. All your data, including alerts and case studies, will be permanently deleted.</p>
                    <p className="text-slate-300">To confirm, please enter your current password.</p>
                    <div>
                        <label htmlFor="password-confirm" className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
                        <input
                            id="password-confirm"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-700/80 border border-slate-600 rounded-lg focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>
                <div className="flex justify-end gap-3 p-4 bg-slate-900/50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 font-semibold rounded-full bg-slate-600 hover:bg-slate-700 transition-all">Cancel</button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || !password}
                        className="px-4 py-2 font-semibold rounded-full text-white bg-red-600 hover:bg-red-700 transition-all disabled:bg-red-400 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete My Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}


// === COMPONENT TRANG CHÍNH ===
export default function ProfilePage() {
    const router = useRouter();

    // State cho việc tải dữ liệu ban đầu
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State cho form cập nhật thông tin
    const [detailsForm, setDetailsForm] = useState({ email: '', phone: '' });
    const [detailsMessage, setDetailsMessage] = useState({ type: '', text: '' });
    const [isSavingDetails, setIsSavingDetails] = useState(false);

    // State cho form đổi mật khẩu
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // === STATE MỚI CHO MODAL XÓA ===
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Lấy dữ liệu người dùng khi trang được tải
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await api('auth/me');
                setDetailsForm({
                    email: userData.email || '',
                    phone: userData.phone || ''
                });
            } catch (err) {
                setError('Failed to load user data.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    // Hàm xử lý thay đổi input
    const handleDetailsChange = (e) => setDetailsForm({ ...detailsForm, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

    // Hàm submit form cập nhật thông tin
    const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        setIsSavingDetails(true);
        setDetailsMessage({ type: '', text: '' });
        try {
            await api('auth/updatedetails', {
                method: 'PUT',
                body: JSON.stringify(detailsForm)
            });
            setDetailsMessage({ type: 'success', text: 'Information updated successfully!' });
        } catch (err) {
            setDetailsMessage({ type: 'error', text: err.message || 'Failed to update information.' });
        } finally {
            setIsSavingDetails(false);
        }
    };

    // Hàm submit form đổi mật khẩu
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            setPasswordMessage({ type: 'error', text: 'All password fields are required.' });
            return;
        }
        setIsSavingPassword(true);
        setPasswordMessage({ type: '', text: '' });
        try {
            await api('auth/updatepassword', {
                method: 'PUT',
                body: JSON.stringify(passwordForm)
            });
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '' }); // Reset form
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    // === HÀM MỚI ĐỂ XỬ LÝ XÓA TÀI KHOẢN ===
    const handleDeleteAccount = async (password) => {
        await api('auth/me', {
            method: 'DELETE',
            body: JSON.stringify({ password: password })
        });

        // Nếu API thành công, nó sẽ không ném lỗi
        alert('Account deleted successfully.');
        clearToken();
        router.push('/login');
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Loading profile...</div>;
    }
    if (error) {
        return <div className="p-8 text-center text-red-400">{error}</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">User Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- FORM CẬP NHẬT THÔNG TIN --- */}
                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">Update Information</h2>
                    <form onSubmit={handleDetailsSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="email" id="email" name="email" value={detailsForm.email} onChange={handleDetailsChange} className={`${inputClasses} pl-10`} required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                            <div className="relative">
                                <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="tel" id="phone" name="phone" value={detailsForm.phone} onChange={handleDetailsChange} className={`${inputClasses} pl-10`} required />
                            </div>
                        </div>
                        {detailsMessage.text && (
                            <p className={`text-sm ${detailsMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{detailsMessage.text}</p>
                        )}
                        <div className="flex justify-end">
                            <button type="submit" disabled={isSavingDetails} className="flex items-center gap-2 px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:bg-blue-400">
                                {isSavingDetails ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                {isSavingDetails ? 'Saving...' : 'Save Details'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- FORM ĐỔI MẬT KHẨU --- */}
                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                            <div className="relative">
                                <KeyRound size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="password" id="currentPassword" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} className={`${inputClasses} pl-10`} required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                            <div className="relative">
                                <KeyRound size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="password" id="newPassword" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} className={`${inputClasses} pl-10`} required />
                            </div>
                        </div>
                        {passwordMessage.text && (
                            <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{passwordMessage.text}</p>
                        )}
                        <div className="flex justify-end">
                            <button type="submit" disabled={isSavingPassword} className="flex items-center gap-2 px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:bg-blue-400">
                                {isSavingPassword ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                {isSavingPassword ? 'Saving...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* === PHẦN MỚI: DANGER ZONE === */}
            <div className="mt-12 p-6 rounded-lg bg-red-900/20 border border-red-500/30">
                <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
                <p className="text-slate-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 font-semibold rounded-full text-white bg-red-600 hover:bg-red-700 transition-all"
                >
                    Delete Account
                </button>
            </div>

            {/* === MODAL XÓA SẼ HIỆN RA Ở ĐÂY === */}
            {isDeleteModalOpen && (
                <DeleteAccountModal
                    onClose={() => setIsDeleteModalOpen(false)}
                    onDelete={handleDeleteAccount}
                />
            )}
        </div>
    );
}