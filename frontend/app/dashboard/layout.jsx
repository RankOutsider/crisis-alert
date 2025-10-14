'use client';

import { useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import Sidebar from '@/app/components/Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AuthGuard>
            <div className="flex h-screen bg-slate-900 text-gray-300">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="md:hidden flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-white">Crisis Alert</h1>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-md hover:bg-slate-700"
                        >
                            <Menu size={24} className="text-white" />
                        </button>
                    </header>

                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
