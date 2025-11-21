// frontend/app/providers.jsx
'use client';

import { SWRConfig, useSWRConfig } from 'swr';
import { HeroUIProvider } from "@heroui/react";
import { createContext, useContext, useState, useEffect } from 'react';
import { fetcher, api } from '@/utils/api';
import { io } from 'socket.io-client';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext({
    user: null,
    isLoading: true,
    refetchUser: () => { },
    logout: () => { }
});

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const { mutate } = useSWRConfig();

    const fetchUser = async () => {
        if (!user) setIsLoading(true);
        try {
            const userData = await api('auth/me');
            setUser(userData);
        } catch (error) {
            console.warn("Auth Provider:", error.message);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('crisisAlertToken');
        setUser(null);
        mutate(() => true, undefined, { revalidate: false });
        router.push('/login');
    };

    // Tải user lúc đầu chạy mỗi khi đường dẫn thay đổi
    useEffect(() => {
        const token = localStorage.getItem('crisisAlertToken');

        if (token) {
            fetchUser();
        } else if (!token) {
            setUser(null);
            setIsLoading(false);
        }
    }, [pathname]);

    // Kết nối Socket.IO khi đã có User
    useEffect(() => {
        // Chỉ kết nối khi user đã đăng nhập
        if (!user) return;

        // Lấy URL backend (hoặc mặc định localhost:5000)
        const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket']
        });

        socket.on('connect', () => {
            console.log("🟢 Socket Connected:", socket.id);
            // Gia nhập phòng riêng của user để nhận thông báo cá nhân
            socket.emit('join_user_room', user.id);
        });

        // --- LẮNG NGHE SỰ KIỆN NÂNG CẤP GÓI ---
        socket.on('subscription_updated', (data) => {
            console.log("✨ Subscription Updated:", data);

            if (window.location.pathname.startsWith('/admin')) return;

            // 1. Thông báo cho người dùng
            alert(data.message);

            // 2. Tự động tải lại thông tin User (để UI cập nhật từ Free -> VIP)
            fetchUser();
        });

        socket.on('user_updated', (data) => {
            console.log("🔄 Admin updated profile:", data);

            if (window.location.pathname.startsWith('/admin')) {
                fetchUser();
                // Nếu đang ở trang admin, không cần thông báo gì thêm
                return;
            }

            alert(data.message); 

            fetchUser();
        });

        // Lắng nghe sự kiện bị từ chối (nếu có)
        socket.on('subscription_rejected', (data) => {
            if (window.location.pathname.startsWith('/admin')) return;
            
            alert(data.message || 'Your subscription request was rejected.');
        });

        // Cleanup: Ngắt kết nối khi user logout hoặc component unmount
        return () => {
            console.log("🔴 Socket Disconnecting...");
            socket.disconnect();
        };
    }, [user?.id]); // Chạy lại khi user ID thay đổi (login/logout)

    return (
        <AuthContext.Provider value={{ user, isLoading, refetchUser: fetchUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

export default function Providers({ children }) {
    return (
        <SWRConfig
            value={{
                fetcher: fetcher,
                refreshInterval: 60000
            }}
        >
            <AuthProvider>
                <HeroUIProvider>
                    {children}
                </HeroUIProvider>
            </AuthProvider>
        </SWRConfig>
    );
}