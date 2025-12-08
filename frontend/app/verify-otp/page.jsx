// frontend/app/verify-otp/page.jsx
"use client";
import { useState, useEffect, Suspense } from "react";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/utils/api';

import { KeyRound, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import Input from '@/app/components/Input';

// --- 1. Tách logic chính ra Component con ---
function VerifyOtpContent() {
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- State thông báo ---
    const [verifySuccess, setVerifySuccess] = useState('');
    const [resendSuccess, setResendSuccess] = useState('');

    const [resendLoading, setResendLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const emailFromUrl = searchParams.get('email');
        if (emailFromUrl) {
            setEmail(emailFromUrl);
        } else {
            // Nếu không có email trên URL, đẩy về login cho an toàn
            router.push('/login');
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => {
            setCooldown(cooldown - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setVerifySuccess('');
        setResendSuccess('');

        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            setError("OTP must be a 6-digit number.");
            return;
        }

        setLoading(true);

        try {
            await api("auth/verify-otp", {
                method: "POST",
                body: JSON.stringify({ email, otp }),
            });

            setVerifySuccess("Account verified & activated! Redirecting to login...");
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err) {
            const errorMessage = err.message || "Verification failed!";
            let finalError = "Verification failed!";
            try {
                const parsedError = JSON.parse(errorMessage);
                finalError = parsedError.message || "Invalid or expired OTP.";
            } catch (parseError) {
                finalError = errorMessage;
            }
            if (finalError.includes("Invalid or expired")) {
                setError("Invalid or expired OTP. Please try resending a new one.");
            } else {
                setError(finalError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setVerifySuccess('');
        setResendSuccess('');
        setResendLoading(true);

        try {
            await api("auth/resend-otp", {
                method: "POST",
                body: JSON.stringify({ email }),
            });

            setResendSuccess("A new OTP has been sent to your email.");
            setCooldown(30);

        } catch (err) {
            const errorMessage = err.message || "Resend failed!";
            try {
                const parsedError = JSON.parse(errorMessage);
                setError(parsedError.message || "Could not resend OTP.");
            } catch (parseError) {
                setError(errorMessage);
            }
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm sm:max-w-md bg-gray-900/60 p-6 sm:p-8 md:p-12 rounded-xl shadow-2xl backdrop-blur-sm border border-gray-700">
            <div className="flex justify-center mb-6">
                <ShieldCheck size={48} className="text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
                Verify Your Account
            </h1>
            <p className="text-center text-gray-300 text-sm sm:text-base mb-6">
                We sent a 6-digit code to <br />
                <span className="font-medium text-cyan-300">{email}</span>.
                <br />
                Please check your email (and spam folder).
            </p>

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                    {error}
                </div>
            )}

            {/* Success Messages */}
            {resendSuccess && (
                <div className="bg-green-900/50 border border-green-700 text-green-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                    {resendSuccess}
                </div>
            )}
            {verifySuccess && (
                <div className="bg-green-900/50 border border-green-700 text-green-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                    {verifySuccess}
                </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6" noValidate>
                {/* OTP Input */}
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
                        className={error ? 'border-red-500' : 'border-gray-700'}
                    />
                </div>

                {/* Verify Button */}
                <div className="pt-4 flex justify-center">
                    <button
                        type="submit"
                        disabled={loading || verifySuccess}
                        className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin mr-2" />
                                Verifying
                            </>
                        ) : (
                            'Verify Account'
                        )}
                    </button>
                </div>
            </form>

            {/* Resend Button */}
            <div className="text-center mt-6">
                <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || resendLoading || verifySuccess}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                >
                    {resendLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Sending...
                        </>
                    ) : cooldown > 0 ? (
                        `Resend OTP in ${cooldown}s`
                    ) : (
                        <>
                            <RefreshCw size={16} className="mr-2" />
                            Did not receive code? Resend OTP
                        </>
                    )}
                </button>
            </div>

            <p className="text-center text-xs sm:text-sm text-gray-300 mt-6">
                Wrong email?{' '}
                <Link href="/register">
                    <span className="text-blue-400 hover:text-blue-300 font-medium">
                        Register again
                    </span>
                </Link>
            </p>
        </div>
    );
}

// --- 2. Component chính bọc Suspense ---
// Đây là yêu cầu bắt buộc của Next.js khi dùng useSearchParams
export default function VerifyOtpPage() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-200 px-4 sm:px-6 md:px-8">
            <Suspense fallback={
                <div className="flex flex-col items-center text-blue-400">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <p>Loading verification...</p>
                </div>
            }>
                <VerifyOtpContent />
            </Suspense>
        </main>
    );
}