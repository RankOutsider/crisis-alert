// frontend/app/dashboard/profile/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearToken } from '@/utils/api';
import { Mail, Phone, KeyRound, Save, Loader2, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import Input from '@/app/components/Input';

// --- Toast Component ---
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

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

// --- DeleteAccountModal ---
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
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg sm:text-xl font-semibold text-red-400 flex items-center gap-2">
                        <ShieldAlert size={22} />
                        Delete Account
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
                        <X size={20} />
                    </button>
                </div>
                {/* Body */}
                <div className="p-5 space-y-4 text-sm sm:text-base">
                    <p className="text-slate-200 leading-relaxed">
                        This action is irreversible. Please confirm your password below.
                    </p>
                    <div>
                        <label htmlFor="password-confirm" className="block text-sm font-medium text-slate-300 mb-1">
                            Password
                        </label>
                        {/* Dùng component Input ở đây cũng được, nhưng vì nó đơn giản nên giữ input thường cũng OK */}
                        <input
                            id="password-confirm"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/80 border rounded-lg focus:ring-red-500 focus:border-red-500 text-sm sm:text-base placeholder-gray-500 ${error ? 'border-red-500' : 'border-slate-600'}`}
                            required
                        />
                    </div>
                    {error && <p className="text-red-300 text-sm">{error}</p>}
                </div>
                {/* Footer */}
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
                        className="px-4 py-2 font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete My Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Schemas ---
const detailsSchema = {
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Invalid email format."
    },
    phone: {
        required: true,
        pattern: /^0\d{9}$/,
        message: "Invalid phone format (e.g., 09xxxxxxxx)."
    }
};

const passwordSchema = {
    currentPassword: {
        required: true
    },
    newPassword: {
        required: true,
        minLength: 6
    }
};

// --- Component Chính: ProfilePage ---
export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [toast, setToast] = useState({ type: '', message: '' });

    const {
        values: detailsForm,
        errors: detailsErrors,
        setErrors: setDetailsErrors,
        handleChange: handleDetailsChange,
        validateForm: validateDetailsForm,
        setValues: setDetailsForm
    } = useFormValidation({ email: '', phone: '' }, detailsSchema);

    const {
        values: passwordForm,
        errors: passwordErrors,
        setErrors: setPasswordErrors,
        handleChange: handlePasswordChange,
        validateForm: validatePasswordForm,
        setValues: setPasswordForm
    } = useFormValidation({ currentPassword: '', newPassword: '' }, passwordSchema);

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
    }, [setDetailsForm]);

    const handleDetailsSubmit = useCallback(async (e) => {
        e.preventDefault();
        setDetailsErrors({});
        setToast({ type: '', message: '' });

        const isValid = validateDetailsForm();
        if (!isValid) return;

        setIsSavingDetails(true);
        try {
            await api('auth/updatedetails', { method: 'PUT', body: JSON.stringify(detailsForm) });
            setToast({ type: 'success', message: 'Information updated successfully!' });
        } catch (err) {
            const errorMessage = err.message || "Failed to update information.";
            let backendErrors = {};
            try {
                const parsedError = JSON.parse(errorMessage);
                if (parsedError.errors && Array.isArray(parsedError.errors)) {
                    parsedError.errors.forEach(error => { backendErrors[error.path] = error.msg; });
                } else if (parsedError.message) {
                    backendErrors = { general: parsedError.message };
                }
            } catch (parseError) {
                backendErrors = { general: errorMessage };
            }
            if (Object.keys(backendErrors).length > 0) {
                setDetailsErrors(backendErrors);
            } else {
                setDetailsErrors({ general: errorMessage });
            }
        } finally {
            setIsSavingDetails(false);
        }
    }, [detailsForm, validateDetailsForm, setDetailsErrors]);

    const handlePasswordSubmit = useCallback(async (e) => {
        e.preventDefault();
        setPasswordErrors({});
        setToast({ type: '', message: '' });

        const isValid = validatePasswordForm();
        if (!isValid) return;

        setIsSavingPassword(true);
        try {
            await api('auth/updatepassword', { method: 'PUT', body: JSON.stringify(passwordForm) });
            setToast({ type: 'success', message: 'Password changed successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '' });
        } catch (err) {
            const errorMessage = err.message || "Failed to change password.";
            let backendErrors = {};
            try {
                const parsedError = JSON.parse(errorMessage);
                if (parsedError.errors && Array.isArray(parsedError.errors)) {
                    parsedError.errors.forEach(error => { backendErrors[error.path] = error.msg; });
                } else if (parsedError.message) {
                    backendErrors = { general: parsedError.message };
                }
            } catch (parseError) {
                backendErrors = { general: errorMessage };
            }
            if (Object.keys(backendErrors).length > 0) {
                setPasswordErrors(backendErrors);
            } else {
                setPasswordErrors({ general: errorMessage });
            }
        } finally {
            setIsSavingPassword(false);
        }
    }, [passwordForm, validatePasswordForm, setPasswordErrors, setPasswordForm]);

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

                {/* --- Form Cập nhật Thông tin --- */}
                <div className="bg-slate-800/50 p-5 sm:p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Update Information</h2>
                    {detailsErrors.general && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm">
                            {detailsErrors.general}
                        </div>
                    )}
                    <form onSubmit={handleDetailsSubmit} className="space-y-4" noValidate>
                        {/* --- Email --- */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                            <Input
                                id="email"
                                type="text"
                                name="email"
                                value={detailsForm.email}
                                onChange={handleDetailsChange}
                                leftIcon={<Mail size={20} />}
                                className={detailsErrors.email ? 'border-red-500' : 'border-slate-600'}
                            />
                            {detailsErrors.email && (
                                <p className="mt-1 text-xs text-red-400">{detailsErrors.email}</p>
                            )}
                        </div>

                        {/* --- Phone --- */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                            <Input
                                id="phone"
                                type="tel"
                                name="phone"
                                value={detailsForm.phone}
                                onChange={handleDetailsChange}
                                leftIcon={<Phone size={20} />}
                                className={detailsErrors.phone ? 'border-red-500' : 'border-slate-600'}
                            />
                            {detailsErrors.phone && (
                                <p className="mt-1 text-xs text-red-400">{detailsErrors.phone}</p>
                            )}
                        </div>

                        {/* --- Button Submit --- */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSavingDetails}
                                className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingDetails ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSavingDetails ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- Form Đổi Mật khẩu --- */}
                <div className="bg-slate-800/50 p-5 sm:p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Change Password</h2>
                    {passwordErrors.general && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm">
                            {passwordErrors.general}
                        </div>
                    )}
                    <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
                        {/* --- Current Password --- */}
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                            <Input
                                id="currentPassword"
                                type="password"
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                leftIcon={<KeyRound size={20} />}
                                className={passwordErrors.currentPassword ? 'border-red-500' : 'border-slate-600'}
                            />
                            {passwordErrors.currentPassword && (
                                <p className="mt-1 text-xs text-red-400">{passwordErrors.currentPassword}</p>
                            )}
                        </div>

                        {/* --- New Password --- */}
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                            <Input
                                id="newPassword"
                                type="password"
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                leftIcon={<KeyRound size={20} />}
                                className={passwordErrors.newPassword ? 'border-red-500' : 'border-slate-600'}
                            />
                            {passwordErrors.newPassword && (
                                <p className="mt-1 text-xs text-red-400">{passwordErrors.newPassword}</p>
                            )}
                        </div>

                        {/* --- Button Submit --- */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSavingPassword}
                                className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSavingPassword ? 'Saving...' : 'Change'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- Danger Zone --- */}
            <div className="mt-10 p-5 sm:p-6 rounded-xl bg-red-900/20 border border-red-500/30">
                <h2 className="text-lg sm:text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
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

            {/* --- Modal Xóa --- */}
            {isDeleteModalOpen && (
                <DeleteAccountModal onClose={() => setIsDeleteModalOpen(false)} onDelete={handleDeleteAccount} />
            )}

            {/* --- TOAST --- */}
            {toast.message && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ type: '', message: '' })}
                />
            )}
        </div>
    );
}