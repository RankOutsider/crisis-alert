"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, AlertCircle, LogOut, X, Settings, FileSearch, Book, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { clearToken, getToken } from '@/utils/api';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Alert Configurations', href: '/dashboard/alerts', icon: AlertCircle },
    { name: 'Mentions Explorer', href: '/dashboard/mentions', icon: FileSearch },
    { name: 'Case Studies', href: '/dashboard/casestudies', icon: Book },
];

export default function Sidebar({ isOpen, onClose }) {
    const pathname = usePathname();
    const router = useRouter();
    const [username, setUsername] = useState('');

    useEffect(() => {
        const token = getToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUsername(payload.username);
            } catch (error) {
                console.error("Sidebar: Failed to decode token.", error);
            }
        }
    }, []);

    const handleLogout = () => {
        clearToken();
        router.push('/login');
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-slate-800/80 backdrop-blur-md p-6 flex flex-col
                            transform transition-transform duration-300 ease-in-out z-50
                            md:static md:translate-x-0 
                            ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2 rounded-lg">
                            <AlertCircle className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Crisis Alert</h1>
                    </div>
                    <button onClick={onClose} className="p-2 md:hidden rounded-md hover:bg-slate-700">
                        <X size={24} className="text-white" />
                    </button>
                </div>

                {username && (
                    <div className="mt-4 p-2">
                        <p className="text-sm text-gray-400">Welcome,</p>
                        <p className="font-semibold text-gray-200">{username}</p>
                    </div>
                )}

                <nav className="flex flex-col gap-2 mt-8">
                    {menuItems.map((item) => {
                        // === LOGIC MỚI ĐỂ XÁC ĐỊNH TRANG HIỆN TẠI ===
                        const isActive = (item.href === '/dashboard')
                            ? pathname === item.href // So sánh chính xác cho Dashboard
                            : pathname.startsWith(item.href); // So sánh tiền tố cho các trang khác

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : 'hover:bg-slate-700/50 text-gray-400'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-4 border-t border-slate-700/50">
                    <Link
                        href="/dashboard/profile"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors mb-2 ${pathname === '/dashboard/profile'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'hover:bg-slate-700/50 text-gray-400'
                            }`}
                    >
                        <UserIcon size={20} />
                        <span>Profile</span>
                    </Link>

                    <Link
                        href="/dashboard/settings"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${pathname === '/dashboard/settings'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'hover:bg-slate-700/50 text-gray-400'
                            }`}
                    >
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full mt-2 flex items-center gap-3 px-4 py-2 rounded-md transition-colors bg-red-500/20 hover:bg-red-500/40 text-red-300"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}