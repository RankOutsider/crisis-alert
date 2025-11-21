// frontend/app/admin/page.jsx
'use client';

// Không cần import AdminSidebar hay AuthGuard nữa (Layout đã lo hết rồi)
import { useEffect, useState } from 'react';
import { getToken } from '@/utils/api';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Decode token đơn giản để lấy tên hiển thị cho vui (không bắt buộc)
        const token = getToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser(payload);
            } catch (e) { }
        }
    }, []);

    return (
        <div className="space-y-6">
            {/* Tiêu đề */}
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>

            {/* Nội dung chính */}
            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
                <h2 className="text-xl font-semibold text-blue-400 mb-2">
                    HELLO ADMIN: {user?.username || 'Admin'}!
                </h2>
                <p className="text-gray-400">
                    Use the sidebar to navigate through admin functionalities such as user management,
                    subscription requests, and system settings.
                </p>
            </div>
        </div>
    );
}