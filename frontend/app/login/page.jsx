// frontend/app/login/page.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api, setToken, getToken } from '@/utils/api';
import { useFormValidation } from '@/hooks/useFormValidation';
import Input from '@/app/components/Input';
import { toast } from 'react-toastify';
import { User, KeyRound, Loader2, Lock, Mail, CheckCircle, X, AlertTriangle } from 'lucide-react';

const loginSchema = {
    username: {
        required: true,
        minLength: 3
    },
    password: {
        required: true
    }
};

const initialValues = {
    username: '',
    password: ''
};

// --- MODAL YÊU CẦU KÍCH HOẠT LẠI (ADMIN LOCK) - SỬ DỤNG YES/NO ---
const ReactivationRequestModal = ({ userEmail, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Gửi yêu cầu kích hoạt lại tài khoản
    const handleSendRequest = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setErrorMsg('');

        try {
            await api('auth/reactivation-request', {
                method: 'POST',
                body: JSON.stringify({ email: userEmail })
            });

            setIsSent(true); // Thông báo thành công qua Toastify
            toast.success("Reactivation request sent successfully!", {
                containerId: "dashboard-toast"
            });

        } catch (error) {
            console.error("Reactivation Request Error:", error);
            const message = error.message || "Failed to send request.";
            setErrorMsg(message);
            toast.error(message, { containerId: 'dashboard-toast' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-800 border border-red-700/50 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="p-5 border-b border-red-700/50 bg-red-900/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Lock size={24} className="text-red-400 shrink-0" />
                        <h3 className="text-xl font-bold text-white">Account Disabled</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4 text-center">
                    {isSent ? (
                        <>
                            <CheckCircle size={48} className="text-green-500 mx-auto" />
                            <p className="text-lg font-semibold text-white">Request Sent!</p>
                            <p className="text-slate-400 text-sm">
                                We have received your request for the account with the email: <b>{userEmail}</b>. The Administrators will review it shortly.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-semibold text-red-300">Access Denied</p>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Your account has been disabled by the Administrator.
                            </p>
                            <p className="text-slate-400 text-sm font-medium">
                                Do you want to send a reactivation request to the Admin?
                            </p>
                        </>
                    )}
                </div>

                {/* Footer Actions - YES/NO */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 flex flex-col sm:flex-row gap-4">
                    {isSent ? (
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-lg font-semibold text-sm transition-colors text-white bg-slate-700 hover:bg-slate-600"
                        >
                            Close
                        </button>
                    ) : (
                        <>
                            {/* Nút YES */}
                            <button
                                onClick={handleSendRequest}
                                disabled={isLoading}
                                className="w-full sm:flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors bg-green-600 hover:bg-green-500 text-white disabled:bg-slate-600 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            >
                                {isLoading ?
                                    <Loader2 size={18} className="animate-spin" /> :
                                    <Mail size={18} />
                                }
                                Send Request
                            </button>
                            {/* Nút NO */}
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full sm:flex-1 py-3 rounded-lg font-semibold text-sm transition-colors text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MODAL 2: TỰ KÍCH HOẠT BẰNG OTP (DÀNH CHO USER SELF-LOCK) ---
const UserSelfLockModal = ({ userEmail, onClose, router }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async () => {
        setIsLoading(true);
        try {
            // Gọi API resend-otp để lấy mã kích hoạt
            await api('auth/resend-otp', {
                method: 'POST',
                body: JSON.stringify({ email: userEmail })
            });

            toast.success("OTP Sent! Redirecting...", { containerId: 'dashboard-toast' });

            // Chuyển hướng sang trang nhập OTP
            setTimeout(() => {
                router.push(`/verify-otp?email=${encodeURIComponent(userEmail)}`);
            }, 1000);

        } catch (error) {
            console.error("Send OTP Error:", error);
            const message = error.message || "Failed to send OTP.";
            toast.error(message, { containerId: 'dashboard-toast' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-800 border border-yellow-600/50 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                {/* Header vàng cho User Lock */}
                <div className="p-5 border-b border-yellow-600/30 bg-yellow-900/10 flex items-center gap-3">
                    <AlertTriangle size={24} className="text-yellow-500 shrink-0" />
                    <h3 className="text-xl font-bold text-white">Account Paused</h3>
                </div>

                <div className="p-6 space-y-4 text-center">
                    <p className="text-slate-300 text-sm leading-relaxed">
                        You previously disabled your account. To reactivate it securely, we need to verify your email address.
                    </p>
                    <p className="text-slate-400 text-sm font-medium">
                        Send an OTP code to <b>{userEmail}</b>?
                    </p>
                </div>

                <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="w-full sm:flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors bg-yellow-600 hover:bg-yellow-500 text-white disabled:bg-slate-600 text-sm whitespace-nowrap"
                    >
                        {isLoading ? (
                            <><Loader2 size={18} className="animate-spin" /> Sending...</>
                        ) : (
                            <><Mail size={18} /> Send OTP</>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:flex-1 py-3 rounded-lg font-semibold text-sm transition-colors text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT LOGIN PAGE ---
export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const router = useRouter();

    const [unverifiedEmail, setUnverifiedEmail] = useState(null);
    const [resendLoading, setResendLoading] = useState(false);

    // Quản lý Modal cho tài khoản bị khóa
    const [disabledAccountEmail, setDisabledAccountEmail] = useState(null);
    const [isUserDisabled, setIsUserDisabled] = useState(false);

    const {
        values,
        errors,
        setErrors,
        handleChange,
        validateForm
    } = useFormValidation(initialValues, loginSchema);

    useEffect(() => {
        const token = getToken();
        console.log("LoginPage check token:", token, "| Data Type:", typeof token);

        if (token && token !== 'undefined' && token !== 'null') {
            router.replace('/dashboard');
        } else {
            setIsCheckingAuth(false);
        }
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isValid = validateForm();
        if (!isValid) return;

        setLoading(true);
        setUnverifiedEmail(null);
        setDisabledAccountEmail(null);
        setIsUserDisabled(false);
        setErrors({});

        try {
            const data = await api('auth/login', {
                method: 'POST',
                body: JSON.stringify(values),
            });
            setToken(data.token);
            toast.success("Login successful!", { containerId: 'dashboard-toast' });
            router.replace('/dashboard');

        } catch (err) {
            let errorMessage =  err.message || "Login failed!";
            let errorEmail = err.email;
            let errorCode = err.code;

            // --- LOGIC HIỂN THỊ MODAL DỰA TRÊN ERROR CODE ---
            if (errorCode === 'ADMIN_DISABLED') {
                // Khóa bởi Admin: Hiện Modal Reactivation Request (YES/NO)
                setDisabledAccountEmail(errorEmail);
                setIsUserDisabled(false);

            } else if (errorCode === 'USER_DISABLED') {
                // Khóa bởi User: Hiện Modal thông báo tự kích hoạt lại
                setDisabledAccountEmail(errorEmail);
                setIsUserDisabled(true);

            } else if (errorCode === 'EMAIL_UNVERIFIED') {
                // Khóa do chưa xác thực email (logic cũ)
                if (errorEmail) setUnverifiedEmail(errorEmail);

                setErrors({ general: errorMessage });
            } else {
                // Lỗi khác (Sai mật khẩu/tên đăng nhập)
                setErrors({ general: errorMessage });
                toast.error(errorMessage, { containerId: 'dashboard-toast' });
            }

        } finally {
            setLoading(false);
        }
    };

    const handleVerifyClick = async (emailToVerify) => {
        setResendLoading(true);
        setErrors({});
        try {
            // 1. Gọi API "resend-otp" TRƯỚC
            await api("auth/resend-otp", {
                method: "POST",
                body: JSON.stringify({ email: emailToVerify }),
            });

            // 2. GỌI XONG -> điều hướng đến trang verify
            toast.success("OTP resent! Redirecting...", { containerId: 'dashboard-toast' });
            setTimeout(() => {
                router.push(`/verify-otp?email=${encodeURIComponent(emailToVerify)}`);
            }, 1000);

        } catch (err) {
            const errorMessage = err.message || "Failed to send OTP.";
            setErrors({ general: errorMessage });
            toast.error(errorMessage, { containerId: 'dashboard-toast' });
        } finally {
            setResendLoading(false);
        }
    };

    // JSX kiểm tra auth
    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="flex items-center gap-3 text-blue-400 text-lg">
                    <Loader2 size={24} className="animate-spin" />
                    Checking Authentication
                </div>
            </div>
        );
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-200 px-4 sm:px-6 md:px-8 overflow-x-hidden">
            <div className="w-full max-w-sm sm:max-w-md bg-gray-900/60 p-6 sm:p-8 md:p-12 rounded-xl shadow-2xl backdrop-blur-sm border border-gray-700 scroll-mt-20">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-6 sm:mb-8">
                    Login to Crisis Alert
                </h1>

                {/* Error Box */}
                {errors.general && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                        {errors.general}
                    </div>
                )}

                {/* Unverified Email Alert */}
                {unverifiedEmail && (
                    <div className="bg-blue-900/50 border border-blue-700 text-blue-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                        Account not verified. <br />
                        <button
                            type="button"
                            disabled={resendLoading}
                            onClick={() => handleVerifyClick(unverifiedEmail)}
                            className="font-bold text-white underline hover:text-blue-200 cursor-pointer bg-transparent border-none p-0 disabled:opacity-50 inline-flex items-center mt-1"
                        >
                            {resendLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin mr-2" />
                                    Sending verification email...
                                </>
                            ) : (
                                "Click here to verify."
                            )}
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
                    {/* --- Username --- */}
                    <div>
                        <label htmlFor="username" className="block text-sm sm:text-base font-medium text-gray-300 mb-1">
                            Username
                        </label>
                        <Input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Enter your username"
                            value={values.username}
                            onChange={handleChange}
                            leftIcon={<User size={20} />}
                            className={errors.username ? 'border-red-500' : 'border-gray-700'}
                        />
                        {errors.username && (
                            <p className="mt-1 text-xs text-red-400">{errors.username}</p>
                        )}
                    </div>

                    {/* --- Password --- */}
                    <div>
                        <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-300 mb-1">
                            Password
                        </label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            value={values.password}
                            onChange={handleChange}
                            leftIcon={<KeyRound size={20} />}
                            className={errors.password ? 'border-red-500' : 'border-gray-700'}
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                        )}
                        <div className="text-right mt-2">
                            <Link href="/forgot-password">
                                <span className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium transition duration-300 cursor-pointer">
                                    Forgot Password?
                                </span>
                            </Link>
                        </div>
                    </div>

                    <div className="pt-3 sm:pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto h-10 sm:h-12 px-6 sm:px-8 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin mr-2" />
                                    Logging In
                                </>
                            ) : ('Login')}
                        </button>
                    </div>
                </form>

                <p className="text-center text-xs sm:text-sm text-gray-400 mt-4 sm:mt-6">
                    Don&apos;t have an account?{' '}
                    <Link href="/register">
                        <span className="text-blue-400 hover:text-blue-300 font-medium transition duration-300 cursor-pointer">
                            Register
                        </span>
                    </Link>
                </p>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700 flex justify-center">
                    <Link href="/">
                        <span className="flex items-center justify-center h-10 sm:h-11 px-4 sm:px-6 font-semibold rounded-full text-white bg-transparent border-2 border-blue-400 hover:bg-blue-400/20 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base cursor-pointer">
                            Go to Home
                        </span>
                    </Link>
                </div>
            </div>

            {/* --- MODAL REACTIVATION REQUEST (ADMIN LOCK) --- */}
            {disabledAccountEmail && !isUserDisabled && (
                <ReactivationRequestModal
                    userEmail={disabledAccountEmail}
                    onClose={() => setDisabledAccountEmail(null)}
                />
            )}

            {/* --- MODAL USER DISABLED (TỰ KÍCH HOẠT LẠI) --- */}
            {disabledAccountEmail && isUserDisabled && (
                <UserSelfLockModal
                    userEmail={disabledAccountEmail}
                    onClose={() => setDisabledAccountEmail(null)}
                    router={router}
                />
            )}
        </main>
    );
}