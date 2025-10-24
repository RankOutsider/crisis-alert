// frontend/app/dashboard/profile/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearToken } from '@/utils/api';
import { Mail, Phone, KeyRound, Save, Loader2, ShieldAlert, X, CheckCircle2 } from 'lucide-react';

const inputClasses =
    'w-full px-4 py-2 bg-slate-700/80 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400';

function Toast({ message, type, onClose }) {
    if (!message) return null;
    return (
        <div
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 text-sm sm:text-base ${type === 'success'
                    ? 'bg-green-600/90 text-white'
                    : 'bg-red-600/90 text-white'
                } animate-fadeIn`}
        >
            {type === 'success' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-75">
                <X size={16} />
            </button>
        </div>
    );
}

function DeleteAccountModal({ onClose, onDelete }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError('');
        try {
            await onDelete(password);
        } catch (err) {
            setError(err.message || 'Failed to delete account.');
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-red-500/50 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg sm:text-xl font-semibold text-red-400 flex items-center gap-2">
                        <ShieldAlert size={22} />
                        Delete Account
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5 space-y-4 text-sm sm:text-base">
                    <p className="text-slate-200 leading-relaxed">
                        This action is irreversible. Please confirm your password below.
                    </p>
                    <div>
                        <label htmlFor="password-confirm" className="block text-sm font-medium text-slate-300 mb-1">
                            Password
                        </label>
                        <input
                            id="password-confirm"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`${inputClasses} focus:ring-red-500 focus:border-red-500`}
                        />
                    </div>
                    {error && <p className="text-red-300 text-sm">{error}</p>}
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 bg-slate-900/50 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 font-semibold rounded-lg bg-slate-600 hover:bg-slate-700 transition-all text-white w-full sm:w-auto"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || !password}
                        className="px-4 py-2 font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all disabled:bg-red-400 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete My Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [detailsForm, setDetailsForm] = useState({ email: '', phone: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [toast, setToast] = useState({ type: '', message: '' });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await api('auth/me');
                setDetailsForm({ email: userData.email || '', phone: userData.phone || '' });
            } catch {
                setToast({ type: 'error', message: 'Failed to load user data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleDetailsSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsSavingDetails(true);
        try {
            await api('auth/updatedetails', { method: 'PUT', body: JSON.stringify(detailsForm) });
            setToast({ type: 'success', message: 'Information updated successfully!' });
        } catch (err) {
            setToast({ type: 'error', message: err.message || 'Failed to update information.' });
        } finally {
            setIsSavingDetails(false);
        }
    }, [detailsForm]);

    const handlePasswordSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            return setToast({ type: 'error', message: 'All password fields are required.' });
        }
        setIsSavingPassword(true);
        try {
            await api('auth/updatepassword', { method: 'PUT', body: JSON.stringify(passwordForm) });
            setToast({ type: 'success', message: 'Password changed successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '' });
        } catch (err) {
            setToast({ type: 'error', message: err.message || 'Failed to change password.' });
        } finally {
            setIsSavingPassword(false);
        }
    }, [passwordForm]);

    const handleDeleteAccount = async (password) => {
        await api('auth/me', { method: 'DELETE', body: JSON.stringify({ password }) });
        clearToken();
        alert('Account deleted successfully.');
        router.push('/login');
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading profile...</div>;

    return (
        <div className="p-4 sm:p-6 md:p-8 text-gray-200 overflow-x-hidden">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 scroll-mt-20">User Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Update Info */}
                <div className="bg-slate-800/50 p-5 sm:p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Update Information</h2>
                    <form onSubmit={handleDetailsSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                            <div className="relative min-w-0">
                                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={detailsForm.email}
                                    onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                                    className={`${inputClasses} pl-10`}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                            <div className="relative min-w-0">
                                <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={detailsForm.phone}
                                    onChange={(e) => setDetailsForm({ ...detailsForm, phone: e.target.value })}
                                    className={`${inputClasses} pl-10`}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSavingDetails}
                                className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:bg-blue-400"
                            >
                                {isSavingDetails ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSavingDetails ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-slate-800/50 p-5 sm:p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Change Password</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                            <div className="relative min-w-0">
                                <KeyRound size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className={`${inputClasses} pl-10`}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                            <div className="relative min-w-0">
                                <KeyRound size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className={`${inputClasses} pl-10`}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSavingPassword}
                                className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:bg-blue-400"
                            >
                                {isSavingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSavingPassword ? 'Saving...' : 'Change'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-10 p-5 sm:p-6 rounded-xl bg-red-900/20 border border-red-500/30">
                <h2 className="text-lg sm:text-xl font-semibold text-red-400 mb-2">Warning</h2>
                <p className="text-slate-300 mb-4 text-sm sm:text-base">
                    Once you delete your account, there is no going back.
                </p>
                <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all w-full sm:w-auto"
                >
                    Delete Account
                </button>
            </div>

            {isDeleteModalOpen && (
                <DeleteAccountModal onClose={() => setIsDeleteModalOpen(false)} onDelete={handleDeleteAccount} />
            )}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ type: '', message: '' })}
            />
        </div>
    );
}