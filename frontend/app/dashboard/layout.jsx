// frontend/app/dashboard/layout.jsx
'use client';

import { useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import Sidebar from '@/app/components/Sidebar';
import { Menu } from 'lucide-react';
import PullToRefreshLayout from '@/app/components/PullToRefreshLayout';

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AuthGuard>

            {/* Wrapper dùng 100svh cho mobile-first */}
            <div className="flex h-[100svh] bg-slate-900 text-gray-300">

                {/* Sidebar giữ nguyên logic */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-900 transition-all duration-300">

                    {/* Mobile Header */}
                    <header className="md:hidden flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 flex-shrink-0">
                        <h1 className="text-lg font-bold text-white">Crisis Alert</h1>

                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                    </header>

                    {/* Container cho pull-to-refresh + scroll */}
                    <div className="flex-1 min-h-0 relative">
                        <PullToRefreshLayout>

                            {/* Scrollable area */}
                            <main className="h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 scroll-smooth">
                                <div className="max-w-7xl mx-auto">
                                    {children}
                                </div>
                            </main>

                        </PullToRefreshLayout>
                    </div>

                </div>
            </div>
        </AuthGuard>
    );
}