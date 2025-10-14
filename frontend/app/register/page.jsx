"use client";
import { useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api'; // Import a helper 'api'

export default function RegisterPage() {
    const [form, setForm] = useState({
        username: "",
        email: "",
        phone: "",
        password: ""
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        try {
            await api("auth/register", {
                method: "POST",
                body: JSON.stringify(form),
            });

            setSuccess("Registration successful! Redirecting to login...");
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err) {
            setError(err.message || "Registration failed!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-200 p-8">
            <div className="bg-gray-900/60 p-8 md:p-12 rounded-xl shadow-2xl backdrop-blur-sm border border-gray-700 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-8">
                    Create Account
                </h1>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-900/50 border border-green-700 text-green-300 p-3 rounded-lg mb-4 text-center">
                        {success}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <input
                            name="username"
                            placeholder="Create your username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="Enter your email address"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                        <input
                            name="phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={form.phone}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            name="password"
                            placeholder="Create a strong password (min. 6 characters)"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-10 px-6 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                        >
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Already have an account?{' '}
                    <Link href="/login">
                        <span className="text-blue-400 hover:text-blue-300 font-medium">
                            Login
                        </span>
                    </Link>
                </p>

                <div className="mt-8 pt-6 border-t border-gray-700 flex justify-center">
                    <Link href="/">
                        <span className="flex items-center justify-center h-10 px-6 font-semibold rounded-full text-white bg-transparent border-2 border-blue-400 hover:bg-blue-400/20 transition-all">
                            Go to Home
                        </span>
                    </Link>
                </div>
            </div>
        </main>
    );
}