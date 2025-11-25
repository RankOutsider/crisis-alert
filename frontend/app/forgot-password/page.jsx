// frontend/app/forgot-password/page.jsx
"use client";
import { useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

import { Mail, Loader2, Send } from 'lucide-react';
import Input from '@/app/components/Input';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) {
            setError("Email is required.");
            return;
        }

        setLoading(true);

        try {
            // 1. Gọi API 'forgot-password'
            const data = await api("auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
            });

            // 2. Hiển thị thông báo thành công / lỗi
            setSuccess((data.message || "OTP sent successfully!") + " Redirecting...");

            // 3. Tự động chuyển hướng sau 2 giây
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
            
        } catch (err) {
            // 3. Xử lý lỗi (ví dụ: lỗi server)
            const errorMessage = err.message || "An error occurred.";
            try {
                const parsedError = JSON.parse(errorMessage);
                setError(parsedError.message || "Could not send reset link.");
            } catch (parseError) {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-200 px-4 sm:px-6 md:px-8">
            <div className="w-full max-w-sm sm:max-w-md bg-gray-900/60 p-6 sm:p-8 md:p-12 rounded-xl shadow-2xl backdrop-blur-sm border border-gray-700">
                <div className="flex justify-center mb-6">
                    <Send size={48} className="text-blue-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
                    Forgot Password
                </h1>
                <p className="text-center text-gray-300 text-sm sm:text-base mb-6">
                    Enter your email address and we will send you an OTP to reset your password.
                </p>

                {/* Lỗi và success messages */}
                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-900/50 border border-green-700 text-green-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* --- Ô nhập Email --- */}
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1">Email</label>
                        <Input
                            name="email"
                            type="email"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<Mail size={20} />}
                            className={error ? 'border-red-500' : 'border-gray-700'}
                        />
                    </div>

                    <div className="pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading || success} // Vô hiệu hóa khi đang gửi hoặc đã gửi thành công
                            className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin mr-2" />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset OTP'
                            )}
                        </button>
                    </div>
                </form>

                <p className="text-center text-xs sm:text-sm text-gray-300 mt-6">
                    Remembered your password?{' '}
                    <Link href="/login">
                        <span className="text-blue-400 hover:text-blue-300 font-medium">
                            Login
                        </span>
                    </Link>
                </p>
            </div>
        </main>
    );
}