// frontend/app/dashboard/profile/page.jsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearToken } from '@/utils/api';
import {
    Mail, Phone, KeyRound, Save, Loader2, ShieldAlert, X, CheckCircle2,
    User, Building, Image, Users, Calendar, Home, Lock, Clock, CreditCard
} from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import Input from '@/app/components/Input';
import { format } from 'date-fns';

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

// --- ChangePasswordModal ---
function ChangePasswordModal({ onClose, onSuccess }) {
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const {
        values: passwordForm,
        errors: passwordErrors,
        setErrors: setPasswordErrors,
        handleChange: handlePasswordChange,
        validateForm: validatePasswordForm,
        setValues: setPasswordForm
    } = useFormValidation({ currentPassword: '', newPassword: '' }, {
        currentPassword: { required: true },
        newPassword: { required: true, minLength: 6 }
    });

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordErrors({});

        const isValid = validatePasswordForm();
        if (!isValid) return;

        setIsSavingPassword(true);
        try {
            await api('auth/updatepassword', { method: 'PUT', body: JSON.stringify(passwordForm) });
            onSuccess('Password changed successfully!');
            onClose();
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
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50">
                    <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                        <KeyRound size={20} className="text-blue-400" />
                        Change Password
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
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
                                placeholder="Enter current password"
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
                                leftIcon={<Lock size={20} />}
                                className={passwordErrors.newPassword ? 'border-red-500' : 'border-slate-600'}
                                placeholder="Enter new password (min 6 chars)"
                            />
                            {passwordErrors.newPassword && (
                                <p className="mt-1 text-xs text-red-400">{passwordErrors.newPassword}</p>
                            )}
                        </div>

                        {/* --- Footer Actions --- */}
                        <div className="flex justify-end gap-3 pt-2 mt-4 border-t border-slate-700/50">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 font-medium rounded-lg text-slate-300 hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSavingPassword}
                                className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSavingPassword ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
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

// --- Component Chính: ProfilePage ---
export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [toast, setToast] = useState({ type: '', message: '' });
    const [subscription, setSubscription] = useState({ tier: 'Free', expiresAt: null });

    const {
        values: detailsForm,
        errors: detailsErrors,
        setErrors: setDetailsErrors,
        handleChange: handleDetailsChange,
        validateForm: validateDetailsForm,
        setValues: setDetailsForm
    } = useFormValidation({
        email: '',
        phone: '',
        full_name: '',
        company: '',
        avatar_url: '',
        gender: '',
        date_of_birth: '',
        address: ''
    }, detailsSchema);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await api('auth/me');
                setSubscription({
                    tier: userData.subscriptionTier || 'Free',
                    expiresAt: userData.subscriptionExpiresAt
                });
                setDetailsForm({
                    email: userData.email || '',
                    phone: userData.phone || '',
                    full_name: userData.full_name || '',
                    company: userData.company || '',
                    avatar_url: userData.avatar_url || '',
                    gender: userData.gender || '',
                    date_of_birth: userData.date_of_birth || '',
                    address: userData.address || ''
                });
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
            setDetailsErrors({ general: errorMessage });
        } finally {
            setIsSavingDetails(false);
        }
    }, [detailsForm, validateDetailsForm, setDetailsErrors]);

    const handleDeleteAccount = async (password) => {
        await api('auth/me', { method: 'DELETE', body: JSON.stringify({ password }) });
        clearToken();
        setToast({ type: 'success', message: 'Account deleted successfully. Redirecting...' });
        setIsDeleteModalOpen(false);
        setTimeout(() => {
            router.push('/login');
        }, 1000);
    };

    const getPlanColor = (tier) => {
        if (tier === 'VIP') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        if (tier === 'Pro') return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading profile...</div>;

    return (
        <div className="p-4 sm:p-6 md:p-8 text-gray-200 overflow-x-hidden relative"> {/* relative để định vị nút absolute nếu cần */}

            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 scroll-mt-20">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">User Profile</h1>

                {/* Nút Change Password góc trên phải */}
                <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all border border-slate-600 shadow-sm"
                >
                    <KeyRound size={18} />
                    <span>Change Password</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* THẺ HIỂN THỊ GÓI DỊCH VỤ (SUBSCRIPTION CARD) */}
                <div className="lg:col-span-2 bg-gradient-to-r from-slate-800 to-slate-800/80 p-5 sm:p-6 rounded-xl shadow-lg border border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
                                <CreditCard size={20} className="text-blue-400" />
                                Current Plan
                            </h2>

                            <p className="text-slate-400 text-sm">Manage your subscription and billing.</p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto">
                            <div className={`px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2 w-fit ${getPlanColor(subscription.tier)}`}>
                                {subscription.tier.toUpperCase()} PLAN
                            </div>

                            {subscription.expiresAt ? (
                                <div className="text-sm text-red-300 flex items-center gap-1.5 mt-1 bg-red-900/20 px-3 py-1 rounded-md border border-red-500/20">
                                    <Clock size={14} />
                                    <span>Expires: {format(new Date(subscription.expiresAt), 'PPP p')}</span>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 px-2">
                                    <CheckCircle2 size={14} />
                                    <span>No expiration date</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Form Cập nhật Thông tin --- */}
                <div className="bg-slate-800/50 p-5 sm:p-6 rounded-xl shadow-lg lg:col-span-2">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Update Information</h2>
                    {detailsErrors.general && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm">
                            {detailsErrors.general}
                        </div>
                    )}
                    <form onSubmit={handleDetailsSubmit} className="space-y-4" noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                <Input
                                    type="text" name="full_name"
                                    value={detailsForm.full_name} onChange={handleDetailsChange}
                                    leftIcon={<User size={20} />}
                                    className={detailsErrors.full_name ? 'border-red-500' : 'border-slate-600'}
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                                <Input
                                    type="text" name="company"
                                    value={detailsForm.company} onChange={handleDetailsChange}
                                    leftIcon={<Building size={20} />}
                                    className={detailsErrors.company ? 'border-red-500' : 'border-slate-600'}
                                    placeholder="Your company"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                                <Input
                                    type="text" name="email"
                                    value={detailsForm.email} onChange={handleDetailsChange}
                                    leftIcon={<Mail size={20} />}
                                    className={detailsErrors.email ? 'border-red-500' : 'border-slate-600'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                                <Input
                                    type="tel" name="phone"
                                    value={detailsForm.phone} onChange={handleDetailsChange}
                                    leftIcon={<Phone size={20} />}
                                    className={detailsErrors.phone ? 'border-red-500' : 'border-slate-600'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Users size={20} className="text-gray-500" />
                                    </span>
                                    <select
                                        name="gender"
                                        value={detailsForm.gender}
                                        onChange={handleDetailsChange}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
                                <Input
                                    type="date" name="date_of_birth"
                                    value={detailsForm.date_of_birth} onChange={handleDetailsChange}
                                    leftIcon={<Calendar size={20} />}
                                    className={detailsErrors.date_of_birth ? 'border-red-500' : 'border-slate-600'}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                                <Input
                                    type="text" name="address"
                                    value={detailsForm.address} onChange={handleDetailsChange}
                                    leftIcon={<Home size={20} />}
                                    className={detailsErrors.address ? 'border-red-500' : 'border-slate-600'}
                                    placeholder="Your address"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Avatar URL</label>
                                <Input
                                    type="text" name="avatar_url"
                                    value={detailsForm.avatar_url} onChange={handleDetailsChange}
                                    leftIcon={<Image size={20} />}
                                    className={detailsErrors.avatar_url ? 'border-red-500' : 'border-slate-600'}
                                    placeholder="https://... image.png"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSavingDetails}
                                className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingDetails ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSavingDetails ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- Danger Zone --- */}
            <div className="mt-10 p-5 sm:p-6 rounded-xl bg-red-900/20 border border-red-500/30 lg:col-span-2">
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

            {/* --- Modals --- */}
            {isDeleteModalOpen && (
                <DeleteAccountModal onClose={() => setIsDeleteModalOpen(false)} onDelete={handleDeleteAccount} />
            )}

            {isPasswordModalOpen && (
                <ChangePasswordModal
                    onClose={() => setIsPasswordModalOpen(false)}
                    onSuccess={(msg) => setToast({ type: 'success', message: msg })}
                />
            )}

            {/* --- Toast --- */}
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