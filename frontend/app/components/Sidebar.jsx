// frontend/app/components/Sidebar.jsx
"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, AlertCircle, LogOut, X, Settings, FileSearch, Book, User as UserIcon } from 'lucide-react';
import { useEffect } from 'react';
import { clearToken, getToken } from '@/utils/api';
import { useSWRConfig } from 'swr';
import { toast } from 'react-toastify';
import { socket } from '@/utils/socket';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Alert Configurations', href: '/dashboard/alerts', icon: AlertCircle },
    { name: 'Mentions Explorer', href: '/dashboard/mentions', icon: FileSearch },
    { name: 'Case Studies', href: '/dashboard/casestudies', icon: Book },
];

const getUserIdFromToken = () => {
    const token = getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return { username: payload.username, userId: payload.id };
        } catch (error) {
            console.error("Failed to decode token.");
        }
    }
    return { username: '', userId: null };
};

export default function Sidebar({ isOpen, onClose }) {
    const pathname = usePathname();
    const router = useRouter();
    const { username, userId } = getUserIdFromToken();
    const { mutate } = useSWRConfig();


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

            // Gọi hàm 'mutate' toàn cục của SWR, trỏ vào key của API
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
            socket.disconnect(); // Ngắt kết nối khi logout
        }
        clearToken();
        router.push('/login');
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 w-3/4 sm:w-64 bg-slate-800/80 backdrop-blur-md p-6 flex flex-col
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
                        <p className="font-semibold text-gray-200 truncate">{username}</p>
                    </div>
                )}

                <nav className="flex flex-col gap-2 mt-8 overflow-y-auto max-h-[60vh] sm:max-h-[auto]">
                    {menuItems.map((item) => {
                        const isActive = (item.href === '/dashboard')
                            ? pathname === item.href
                            : pathname.startsWith(item.href);

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
                                <span className="text-sm sm:text-base">{item.name}</span>
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
                        <span className="text-sm sm:text-base">Profile</span>
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
                        <span className="text-sm sm:text-base">Settings</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full mt-2 flex items-center gap-3 px-4 py-2 rounded-md transition-colors bg-red-500/20 hover:bg-red-500/40 text-red-300"
                    >
                        <LogOut size={20} />
                        <span className="text-sm sm:text-base">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}