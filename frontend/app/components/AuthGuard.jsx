// frontend/app/components/AuthGuard.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken } from '@/utils/api';
import { Loader2 } from 'lucide-react';

// Hàm giải mã token để lấy thông tin user
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const AuthGuard = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = getToken();

        // 1. Chưa đăng nhập -> Về login
        if (!token) {
            router.replace('/login');
            return;
        }

        // 2. Giải mã token
        const userPayload = parseJwt(token);

        // 3. LOGIC QUAN TRỌNG: Chặn User thường vào trang Admin
        // Nếu URL bắt đầu bằng /admin VÀ role trong token KHÔNG PHẢI là 'admin'
        if (pathname?.startsWith('/admin') && userPayload?.role !== 'admin') {
            // Đá về Dashboard
            router.replace('/dashboard');
            return;
        }

        // Nếu mọi thứ hợp lệ -> Cho phép hiển thị
        setIsAuthorized(true);

    }, [router, pathname]); // Chạy lại mỗi khi đổi trang

    // Trong lúc đang kiểm tra thì hiện Loading
    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="flex items-center space-x-3 text-blue-400 text-lg">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Checking Permissions...</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthGuard;