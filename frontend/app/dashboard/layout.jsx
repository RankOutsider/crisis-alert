// frontend/app/dashboard/layout.jsx
'use client';

import { useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import Sidebar from '@/app/components/Sidebar';
import { Menu } from 'lucide-react';
import PullToRefreshLayout from '../components/PullToRefreshLayout';

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AuthGuard>
            <div className="flex h-[100dvh] bg-slate-900 text-gray-300 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex-1 ml-0 transition-all duration-300">
                    <PullToRefreshLayout>
                        {/* Content area */}
                        <div className="flex-1 flex flex-col min-w-0 relative">
                            {/* Header chỉ hiện trên mobile */}
                            <header className="md:hidden flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold text-white">Crisis Alert</h1>
                                </div>
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                                >
                                    <Menu size={24} />
                                </button>
                            </header>

                            {/* Main content */}
                            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 scroll-smooth">
                                <div className="max-w-7xl mx-auto">
                                    {children}
                                </div>
                            </main>
                        </div>
                    </PullToRefreshLayout>
                </div>
            </div>
        </AuthGuard>
    );
}