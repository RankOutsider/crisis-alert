// frontend/app/components/Sidebar.jsx
"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, AlertCircle, LogOut, X, Settings,
    FileSearch, Book, User as UserIcon, Zap, Shield
} from 'lucide-react';
import { useEffect } from 'react';
import { getToken } from '@/utils/api';
import { useSWRConfig } from 'swr';
import { toast } from 'react-toastify';
import { socket } from '@/utils/socket';
import { useAuth } from '@/app/providers';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Alert Configurations', href: '/dashboard/alerts', icon: AlertCircle },
    { name: 'Mentions Explorer', href: '/dashboard/mentions', icon: FileSearch },
    { name: 'Case Studies', href: '/dashboard/casestudies', icon: Book },
];

export default function Sidebar({ isOpen, onClose }) {
    const pathname = usePathname();
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const { user, logout } = useAuth();

    const userId = user?.id;
    const username = user?.username || user?.name;

    useEffect(() => {
        console.log("🧠 useEffect ran — setting up socket listeners...");
    }, []);

    useEffect(() => {
        if (!userId) return;
        if (socket.connected) {
            console.log("⚡ Socket đã kết nối, bỏ qua connect lại.");
            return;
        }

        console.log("🧠 Socket test starting...");
        socket.connect();

        function onConnect() {
            console.log("🔌 [Socket.IO] Connected to the server.");
            socket.emit("join_user_room", userId);
        }

        function onNewMatch(data) {
            console.log("🎉 [Socket.IO] Received signal for new post(s)", data);

            toast.success(
                `Alert "${data.alertTitle}" found ${data.newPostCount} new post(s)!`,
                {
                    toastId: `new_match_${data.alertId}_${Date.now()}`,
                    containerId: "dashboard-toast"
                }
            );

            // Gọi hàm 'mutate' toàn cục của SWR
            mutate('/api/alerts/stats');

            mutate((key) => key.startsWith('/api/posts/over-time'));
        }

        socket.on("connect", onConnect);
        socket.on("new_match", onNewMatch);

        return () => {
            console.log("🧹 [Socket.IO] Cleaning up listeners...");
            socket.off("connect", onConnect);
            socket.off("new_match", onNewMatch);
        };
    }, [userId, mutate]);

    const handleLogout = () => {
        if (socket.connected) {
            socket.disconnect();
        }
        logout();
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            ></div>

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-slate-800/80 backdrop-blur-md border-r border-slate-700/50
                    transform transition-transform duration-300 ease-in-out flex flex-col h-full
                    md:static md:translate-x-0 md:w-64
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Header (Logo + Close Btn) */}
                <div className="flex items-center justify-between p-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
                            <AlertCircle className="text-white" size={22} />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Crisis Alert</h1>
                    </div>
                    {/* Nút X chỉ hiện trên Mobile */}
                    <button
                        onClick={onClose}
                        className="p-2 md:hidden text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* User Info */}
                {username && (
                    <div className="px-6 pb-4 shrink-0">
                        <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-1">HELLO USER</p>
                            <p className="font-medium text-white truncate">{username}</p>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                    {/* Admin Panel */}
                    {user?.role === 'admin' && (
                        <Link
                            href="/admin"
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-2 group border border-purple-500/30 ${pathname.startsWith('/admin')
                                    ? 'bg-purple-600/20 text-purple-300 shadow-md shadow-purple-900/20'
                                    : 'text-purple-400 hover:bg-purple-600/10'
                                }`}
                        >
                            <Shield size={20} />
                            <span className="text-sm font-bold">Admin Panel</span>
                        </Link>
                    )}

                    {/* Menu Items */}
                    {menuItems.map((item) => {
                        const isActive = (item.href === '/dashboard')
                            ? pathname === item.href
                            : pathname.startsWith(item.href);

                        const isFreeTier = user?.subscriptionTier === 'Free';
                        const isCaseStudyLink = item.name === 'Case Studies';

                        if (isCaseStudyLink && isFreeTier) {
                            return (
                                <div key={item.name} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 cursor-not-allowed opacity-70">
                                    <item.icon size={20} />
                                    <span className="text-sm font-medium">{item.name}</span>
                                    <span className="ml-auto text-[10px] border border-slate-600 px-1 rounded text-slate-500">PRO</span>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer (Upgrade + Settings + Logout) */}
                <div className="p-4 border-t border-slate-700/50 shrink-0 bg-slate-800/30">
                    {/* Nút Upgrade nổi bật */}
                    <Link
                        href="/buy"
                        onClick={onClose}
                        className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-semibold text-sm sm:text-base shadow-lg"
                    >
                        <Zap size={18}/>
                        <span>Subscription Plan</span>
                    </Link>

                    <div className="grid grid-cols-3 gap-2">
                        {/* Nút vào Profile */}
                        <Link
                            href="/dashboard/profile"
                            onClick={onClose}
                            className="flex flex-col items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            title="Profile"
                        >
                            <UserIcon size={20} />
                            <span className="text-[10px] mt-1">Profile</span>
                        </Link>

                        {/* Nút vào Setting */}
                        <Link
                            href="/dashboard/settings"
                            onClick={onClose}
                            className="flex flex-col items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            title="Settings"
                        >
                            <Settings size={20} />
                            <span className="text-[10px] mt-1">Settings</span>
                        </Link>

                        {/* Nút Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex flex-col items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                            <span className="text-[10px] mt-1">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}