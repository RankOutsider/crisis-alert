// frontend/app/reset-password/page.jsx
"use client";
import { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/utils/api';

import { Mail, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import Input from '@/app/components/Input';

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. Lấy email từ URL
    // Người dùng sẽ phải tự vào link này,
    // hoặc chúng ta có thể làm cho trang "forgot-password" chuyển hướng
    // nhưng hiện tại, chúng ta sẽ đọc email từ URL (nếu có)
    useEffect(() => {
        const emailFromUrl = searchParams.get('email');
        if (emailFromUrl) {
            setEmail(emailFromUrl);
        }
        // Chúng ta không chuyển hướng nếu thiếu,
        // để người dùng có thể nhập email bằng tay
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email || !otp || !newPassword) {
            setError("Email, OTP, and new password are required.");
            return;
        }
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }

        setLoading(true);

        try {
            // 2. Gọi API 'reset-password' chúng ta đã tạo
            const data = await api("auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ email, otp, newPassword }),
            });

            // 3. Xử lý thành công
            setSuccess(data.message || "Password has been reset successfully! Redirecting to login...");
            setTimeout(() => {
                router.push('/login');
            }, 3000); // Cho 3s để đọc

        } catch (err) {
            // 4. Xử lý lỗi (ví dụ: OTP sai)
            const errorMessage = err.message || "An error occurred.";
            try {
                const parsedError = JSON.parse(errorMessage);
                setError(parsedError.message || "Could not reset password.");
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
                    <ShieldCheck size={48} className="text-blue-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
                    Reset Your Password
                </h1>
                <p className="text-center text-gray-300 text-sm sm:text-base mb-6">
                    Enter your email, the OTP you received, and your new password.
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
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<Mail size={20} />}
                            className={error.includes('Email') ? 'border-red-500' : 'border-gray-700'}
                        />
                    </div>

                    {/* --- Ô nhập OTP --- */}
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1">Verification Code (OTP)</label>
                        <Input
                            name="otp"
                            type="tel"
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            leftIcon={<KeyRound size={20} />}
                            className={error.includes('OTP') ? 'border-red-500' : 'border-gray-700'}
                        />
                    </div>

                    {/* --- Ô nhập Mật khẩu MỚI --- */}
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1">New Password</label>
                        <Input
                            name="newPassword"
                            type="password"
                            placeholder="Enter your new password (min. 6)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            leftIcon={<KeyRound size={20} />}
                            className={error.includes('password') ? 'border-red-500' : 'border-gray-700'}
                        />
                    </div>

                    <div className="pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin mr-2" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset Password & Login'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}