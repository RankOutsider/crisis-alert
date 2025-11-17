// frontend/app/providers.jsx
'use client';

import { SWRConfig } from 'swr';
import { HeroUIProvider } from "@heroui/react";
// --- THÊM MỚI ---
import { createContext, useContext, useState, useEffect } from 'react';
import { fetcher, api } from '@/utils/api';
// --- KẾT THÚC THÊM MỚI ---

// --- THÊM MỚI: TẠO AUTH CONTEXT ---
// 1. Tạo Context để lưu trữ thông tin user
const AuthContext = createContext({
    user: null,         // Thông tin user (gồm cả subscriptionTier)
    isLoading: true,    // Trạng thái loading
    refetchUser: () => { } // Hàm để tải lại thông tin user (ví dụ: sau khi nâng cấp gói)
});

// 2. Tạo Provider (Nơi gọi API 'auth/me' và cung cấp dữ liệu)
function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        setIsLoading(true);
        try {
            // Gọi API 'auth/me' mà chúng ta đã sửa ở Bước 6
            // API này giờ đã trả về { id, email, username, subscriptionTier }
            const userData = await api('auth/me');
            setUser(userData);
        } catch (error) {
            // Lỗi (thường là 401 - chưa đăng nhập), user sẽ là null
            // hàm api() trong utils/api.js sẽ tự động xử lý redirect sang /login
            console.warn("Auth Provider:", error.message);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Tải thông tin user ngay khi ứng dụng khởi động
        fetchUser();
    }, []); // Chạy 1 lần duy nhất

    return (
        <AuthContext.Provider value={{ user, isLoading, refetchUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// 3. Tạo Hook (Cách để các component khác lấy dữ liệu)
// Thay vì import useContext và AuthContext ở mọi nơi,
// chúng ta chỉ cần gọi: const { user } = useAuth();
export const useAuth = () => useContext(AuthContext);
// --- KẾT THÚC THÊM MỚI ---


export default function Providers({ children }) {
    return (
        <SWRConfig
            value={{
                fetcher: fetcher,
                refreshInterval: 60000 // Giữ nguyên refresh 1 phút
            }}
        >
            {/* --- THÊM MỚI: BỌC ỨNG DỤNG TRONG AUTHPROVIDER --- */}
            <AuthProvider>
                <HeroUIProvider>
                    {children}
                </HeroUIProvider>
            </AuthProvider>
            {/* --- KẾT THÚC THÊM MỚI --- */}
        </SWRConfig>
    );
}