// frontend/app/dashboard/layout.jsx
'use client';

import { useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import Sidebar from '@/app/components/Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AuthGuard>
            <div className="flex flex-col md:flex-row h-screen bg-slate-900 text-gray-300">
                {/* Sidebar */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Content area */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Header chỉ hiện trên mobile */}
                    <header className="md:hidden z-10 flex items-center justify-between p-2 bg-slate-800/50 border-b border-slate-700">
                        <h1 className="text-lg font-bold text-white">Crisis Alert</h1>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-md hover:bg-slate-700"
                        >
                            <Menu size={24} className="text-white" />
                        </button>
                    </header>

                    {/* Main content */}
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 scroll-mt-20">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}