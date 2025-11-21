// frontend/app/admin/layout.jsx
'use client';

import { useState } from 'react';
import AdminSidebar from '@/app/components/AdminSidebar';
import AuthGuard from '@/app/components/AuthGuard';
import PullToRefreshLayout from '@/app/components/PullToRefreshLayout';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-900 text-white">

        {/* Sidebar Component */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* --- MOBILE HEADER --- */}
          <div className="lg:hidden p-4 bg-gray-800 border-b border-gray-700 flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
            >
              <Menu size={24} />
            </button>
            <span className="ml-4 font-bold text-lg">Admin Dashboard</span>
          </div>

          {/* Nội dung chính */}
          <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
            <PullToRefreshLayout>
              {children}
            </PullToRefreshLayout>
          </main>

        </div>
      </div>
    </AuthGuard>
  );
}