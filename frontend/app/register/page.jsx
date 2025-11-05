"use client";
import { useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useFormValidation } from '@/hooks/useFormValidation';

import { User, Mail, Phone, KeyRound, Loader2 } from 'lucide-react';
import Input from '@/app/components/Input';

const registerSchema = {
    username: {
        required: true,
        minLength: 3
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Please enter a valid email address."
    },
    phone: {
        required: true,
        pattern: /^0\d{9}$/,
        message: "Invalid phone number format (must be 10 digits starting with 0)."
    },
    password: {
        required: true,
        minLength: 6
    }
};

const initialValues = {
    username: "",
    email: "",
    phone: "",
    password: ""
};

export default function RegisterPage() {
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const {
        values,
        errors,
        setErrors,
        handleChange,
        validateForm
    } = useFormValidation(initialValues, registerSchema);

    const handleRegister = async (e) => {
        e.preventDefault();
        setSuccess('');

        const isValid = validateForm();
        if (!isValid) {
            return;
        }

        setLoading(true);

        try {
            await api("auth/register", {
                method: "POST",
                body: JSON.stringify(values),
            });

            setSuccess("Registration successful! Redirecting to login...");
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            const errorMessage = err.message || "Registration failed!";
            let backendErrors = {};
            try {
                const parsedError = JSON.parse(errorMessage);
                if (parsedError.errors && Array.isArray(parsedError.errors)) {
                    parsedError.errors.forEach(error => {
                        backendErrors[error.path] = error.msg;
                    });
                } else if (parsedError.message) {
                    backendErrors = { general: parsedError.message };
                }
            } catch (parseError) {
                backendErrors = { general: errorMessage };
            }

            if (Object.keys(backendErrors).length > 0) {
                setErrors(backendErrors);
            } else {
                setErrors({ general: errorMessage });
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-200 px-4 sm:px-6 md:px-8 overflow-x-hidden">
            <div className="w-full max-w-sm sm:max-w-md bg-gray-900/60 p-6 sm:p-8 md:p-12 rounded-xl shadow-2xl backdrop-blur-sm border border-gray-700 scroll-mt-20">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-6 sm:mb-8">
                    Create Account
                </h1>

                {/* Lỗi general và success */}
                {errors.general && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                        {errors.general}
                    </div>
                )}
                {success && (
                    <div className="bg-green-900/50 border border-green-700 text-green-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                        {success}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4 sm:space-y-6" noValidate>
                    {/* --- Username --- */}
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1">Username</label>
                        <Input
                            name="username"
                            type="text"
                            placeholder="Create your username"
                            value={values.username}
                            onChange={handleChange}
                            leftIcon={<User size={20} />}
                            className={errors.username ? 'border-red-500' : 'border-gray-700'}
                        />
                        {errors.username && (
                            <p className="mt-1 text-xs text-red-400">{errors.username}</p>
                        )}
                    </div>

                    {/* --- Email --- */}
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1">Email</label>
                        <Input
                            name="email"
                            type="text"
                            placeholder="Enter your email address"
                            value={values.email}
                            onChange={handleChange}
                            leftIcon={<Mail size={20} />}
                            className={errors.email ? 'border-red-500' : 'border-gray-700'}
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                        )}
                    </div>

                    {/* --- Phone Number --- */}
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1">Phone Number</label>
                        <Input
                            name="phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={values.phone}
                            onChange={handleChange}
                            leftIcon={<Phone size={20} />}
                            className={errors.phone ? 'border-red-500' : 'border-gray-700'}
                        />
                        {errors.phone && (
                            <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                        )}
                    </div>

                    {/* --- Password --- */}
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1">Password</label>
                        <Input
                            name="password"
                            type="password"
                            placeholder="Enter your password (min. 6 characters)"
                            value={values.password}
                            onChange={handleChange}
                            leftIcon={<KeyRound size={20} />}
                            className={errors.password ? 'border-red-500' : 'border-gray-700'}
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                        )}
                    </div>


                    <div className="pt-3 sm:pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin mr-2" />
                                    Signing Up
                                </>
                            ) : (
                                'Sign Up'
                            )}
                        </button>
                    </div>
                </form>

                <p className="text-center text-xs sm:text-sm text-gray-300 mt-4 sm:mt-6">
                    Already have an account?{' '}
                    <Link href="/login">
                        <span className="text-blue-400 hover:text-blue-300 font-medium">
                            Login
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