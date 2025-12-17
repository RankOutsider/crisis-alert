// frontend/app/components/AdminSidebar.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, FileText, Bell,
    BookOpen, LogOut, X, CreditCard, RotateCcw
} from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose }) => {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Reactivations', href: '/admin/reactivations', icon: RotateCcw },
        { name: 'Posts', href: '/admin/posts', icon: FileText },
        { name: 'Alerts', href: '/admin/alerts', icon: Bell },
        { name: 'Case Studies', href: '/admin/casestudies', icon: BookOpen },
        { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    ];

    return (
        <>
            {/* Overlay đen mờ khi mở trên mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={onClose}
                ></div>
            )}

            {/* Sidebar chính */}
            <aside
                className={`
                    fixed top-0 right-0 z-40 w-64 bg-gray-800 border-l border-gray-700 
                    transition-transform duration-300 ease-in-out h-[100dvh]
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'} 
        
                    lg:transition-none 
                    lg:transform-none 
                    lg:static lg:translate-x-0 lg:block lg:h-full 
                    lg:z-0
    `}
            >
                <div className="p-6 flex items-center justify-between border-b border-gray-700">
                    <h1 className="text-xl font-bold text-blue-500">Admin Panel</h1>
                    {/* Nút đóng chỉ hiện trên mobile */}
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto h-[calc(100vh-160px)]">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => onClose()}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-700 absolute bottom-0 w-full bg-gray-800">
                    <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Exit Admin</span>
                    </Link>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;