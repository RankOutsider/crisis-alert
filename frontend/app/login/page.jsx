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
    // TRẠNG THÁI MỚI: Mặc định là true để chặn render form cho đến khi Token được kiểm tra
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = getToken();

        // === ĐẢM BẢO DÒNG DEBUG NÀY CÓ ===
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

            // Lưu Token và chuyển hướng
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
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-200 p-8">
            <div className="bg-gray-900/60 p-8 md:p-12 rounded-xl shadow-2xl backdrop-blur-sm border border-gray-700 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-8">
                    Login to Crisis Alert
                </h1>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
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
                            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 placeholder-gray-500 text-gray-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
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
                            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 placeholder-gray-500 text-gray-200"
                        />
                    </div>

                    <div className="pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading} // Vô hiệu hóa nút khi đang tải
                            className="h-10 px-6 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-lg text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Don&apos;t have an account?{' '}
                    <Link href="/register">
                        <span className="text-blue-400 hover:text-blue-300 font-medium transition duration-300 cursor-pointer">
                            Register
                        </span>
                    </Link>
                </p>
                <div className="mt-8 pt-6 border-t border-gray-700 flex justify-center">
                    <Link href="/">
                        <span className="flex items-center justify-center h-10 px-6 font-semibold rounded-full text-white bg-transparent border-2 border-blue-400 hover:bg-blue-400/20 transition-all duration-300 transform hover:scale-105 text-base cursor-pointer">
                            Go to Home
                        </span>
                    </Link>
                </div>
            </div>
        </main>
    );
}