// frontend/app/login/page.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setToken, getToken } from '@/utils/api';
import { useFormValidation } from '@/hooks/useFormValidation';
import { User, KeyRound, Loader2 } from 'lucide-react';
import Input from '@/app/components/Input';

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

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const router = useRouter();

    const [unverifiedEmail, setUnverifiedEmail] = useState(null);
    const [resendLoading, setResendLoading] = useState(false);

    const {
        values,
        errors,
        setErrors,
        handleChange,
        validateForm
    } = useFormValidation(initialValues, loginSchema);

    useEffect(() => {
        const token = getToken();
        console.log("🚪 LoginPage check token:", token, "| Kiểu dữ liệu:", typeof token);

        if (token && token !== 'undefined' && token !== 'null') {
            router.replace('/dashboard');
        } else {
            setIsCheckingAuth(false);
        }
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isValid = validateForm();
        if (!isValid) {
            return;
        }

        setLoading(true);
        setUnverifiedEmail(null); // Reset trạng thái "chưa xác thực"
        setErrors({}); // Reset lỗi cũ

        try {
            const data = await api('auth/login', {
                method: 'POST',
                body: JSON.stringify(values),
            });
            setToken(data.token);
            router.replace('/dashboard');

        } catch (err) {
            let errorMessage = "Login failed!";
            let errorEmail = null;

            try {
                // Thử parse lỗi JSON
                const parsedError = JSON.parse(err.message);
                errorMessage = parsedError.message || errorMessage;
                errorEmail = parsedError.email || null; // Lấy email nếu backend trả về
            } catch (parseError) {
                // Nếu không phải JSON, giữ nguyên message
                errorMessage = err.message || errorMessage;
            }

            // Nếu phát hiện có email, lưu nó vào state
            if (errorEmail) {
                setUnverifiedEmail(errorEmail);
            }

            setErrors({ general: errorMessage });

        } finally {
            setLoading(false);
        }
    };

    const handleVerifyClick = async (emailToVerify) => {
        setResendLoading(true);
        setErrors({}); // Xóa lỗi "Account not verified..."
        try {
            // 1. Gọi API "resend-otp" TRƯỚC
            await api("auth/resend-otp", {
                method: "POST",
                body: JSON.stringify({ email: emailToVerify }),
            });

            // 2. SAU KHI GỌI XONG, điều hướng đến trang verify
            router.push(`/verify-otp?email=${encodeURIComponent(emailToVerify)}`);
        } catch (err) {
            // Xử lý nếu GỬI LẠI OTP bị lỗi
            let errorMessage = "Failed to send OTP. Please try again.";

            try {
                const parsedError = JSON.parse(err.message);
                errorMessage = parsedError.message || errorMessage;
            } catch (parseError) {
                errorMessage = err.message || errorMessage;
            }
            setErrors({ general: errorMessage }); // Hiển thị lỗi này ở ô màu đỏ
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

                {/* Lỗi chung */}
                {errors.general && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                        {errors.general}
                    </div>
                )}

                {unverifiedEmail && (
                    <div className="bg-blue-900/50 border border-blue-700 text-blue-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                        Account not verified. <br />
                        <button
                            type="button"
                            disabled={resendLoading} // Vô hiệu hóa khi đang gửi
                            onClick={() => handleVerifyClick(unverifiedEmail)}
                            className="font-bold text-white underline hover:text-blue-200 cursor-pointer bg-transparent border-none p-0 disabled:opacity-50 inline-flex items-center"
                        >
                            {resendLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin mr-2" />
                                    Sending verification email...
                                </>
                            ) : (
                                "Click here to verify your account."
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
                            className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
        </main>
    );
}