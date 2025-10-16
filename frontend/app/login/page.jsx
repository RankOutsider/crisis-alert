// frontend/app/login/page.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setToken, getToken } from '@/utils/api';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const router = useRouter();

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
        setError('');
        setLoading(true);

        try {
            const data = await api('auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            setToken(data.token);
            router.replace('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-blue-400 text-lg">Checking authentication...</div>
            </div>
        );
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-200 px-4 sm:px-6 md:px-8 overflow-x-hidden">
            <div className="w-full max-w-sm sm:max-w-md bg-gray-900/60 p-6 sm:p-8 md:p-12 rounded-xl shadow-2xl backdrop-blur-sm border border-gray-700 scroll-mt-20">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-6 sm:mb-8">
                    Login to Crisis Alert
                </h1>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm sm:text-base">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm sm:text-base font-medium text-gray-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Enter your username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 placeholder-gray-500 text-gray-200 text-sm sm:text-base"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 placeholder-gray-500 text-gray-200 text-sm sm:text-base"
                        />
                    </div>

                    <div className="pt-3 sm:pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
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