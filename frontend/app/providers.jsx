// frontend/app/providers.jsx
"use client";

import { SWRConfig, useSWRConfig } from "swr";
import { HeroUIProvider } from "@heroui/react";
import { createContext, useContext, useState, useEffect } from "react";
import { fetcher, api } from "@/utils/api";
import { io } from "socket.io-client";
import { useRouter, usePathname } from "next/navigation";

/* 
  AuthContext: Lưu trữ thông tin user dùng trong toàn ứng dụng.
  - user: dữ liệu người dùng (null nếu chưa đăng nhập)
  - isLoading: trạng thái đang tải user
  - refetchUser: hàm tải lại thông tin user
  - logout: hàm đăng xuất
*/
const AuthContext = createContext({
    user: null,
    isLoading: true,
    refetchUser: () => { },
    logout: () => { },
});

function AuthProvider({ children }) {
    // Trạng thái user
    const [user, setUser] = useState(null);

    // Trạng thái loading khi kiểm tra token hoặc lấy thông tin user
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();
    const pathname = usePathname();
    const { mutate } = useSWRConfig();

    /* 
      Hàm fetchUser: gọi API lấy dữ liệu user.
      Dùng khi:
      - Login xong
      - Refresh
      - Socket báo có thay đổi thông tin
    */
    const fetchUser = async () => {
        if (!user) setIsLoading(true);
        try {
            const userData = await api("auth/me");
            setUser(userData);
        } catch (error) {
            console.warn("Auth Provider:", error.message);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    /* 
      Hàm logout:
      - Xóa token
      - Xoá cache SWR
      - Chuyển hướng về login
    */
    const logout = () => {
        localStorage.removeItem("crisisAlertToken");
        setUser(null);

        // Xoá cache SWR để tránh hiển thị dữ liệu cũ
        mutate(() => true, undefined, { revalidate: false });

        router.push("/login");
    };

    /* 
      Kiểm tra token mỗi khi chuyển trang:
      - Nếu có token → gọi fetchUser
      - Nếu không có token → set user = null
    */
    useEffect(() => {
        const token = localStorage.getItem("crisisAlertToken");

        if (token) {
            fetchUser();
        } else {
            setUser(null);
            setIsLoading(false);
        }
    }, [pathname]);

    /* 
      Kết nối Socket.IO khi user đã đăng nhập.
      - Nhận thông báo cập nhật subscription
      - Nhận thông báo admin sửa user
      - Nhận thông báo subscription bị từ chối
      - Tự join "room riêng" theo user.id
    */
    useEffect(() => {
        if (!user) return; // Không kết nối nếu chưa đăng nhập

        // Backend URL từ biến môi trường (fallback localhost)
        const SOCKET_URL =
            process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
            "http://localhost:5000";

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket"],
        });

        socket.on("connect", () => {
            console.log("🟢 Socket Connected:", socket.id);

            // Join room riêng theo user.id để nhận thông báo cá nhân
            socket.emit("join_user_room", user.id);
        });

        // Khi gói subscription được nâng cấp
        socket.on("subscription_updated", (data) => {
            console.log("✨ Subscription Updated:", data);

            if (!window.location.pathname.startsWith("/admin")) {
                alert(data.message);
                fetchUser(); // Tự động cập nhật UI
            }
        });

        // Khi admin chỉnh sửa profile user
        socket.on("user_updated", (data) => {
            console.log("🔄 Admin updated profile:", data);

            if (!window.location.pathname.startsWith("/admin")) {
                alert(data.message);
            }

            fetchUser();
        });

        // Khi subscription bị từ chối
        socket.on("subscription_rejected", (data) => {
            if (!window.location.pathname.startsWith("/admin")) {
                alert(data.message || "Your subscription request was rejected.");
            }
        });

        // Cleanup: ngắt kết nối socket
        return () => {
            console.log("🔴 Socket Disconnecting...");
            socket.disconnect();
        };
    }, [user?.id]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                refetchUser: fetchUser,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Hook tiện dùng trong toàn ứng dụng
export const useAuth = () => useContext(AuthContext);

/* 
  Providers: Bao toàn bộ ứng dụng bằng các provider:
  - SWRConfig: cấu hình SWR fetcher + refresh interval
  - AuthProvider: quản lý trạng thái đăng nhập
  - HeroUIProvider: UI framework 
*/
export default function Providers({ children }) {
    return (
        <SWRConfig
            value={{
                fetcher,
                refreshInterval: 60000,
            }}
        >
            <AuthProvider>
                <HeroUIProvider>{children}</HeroUIProvider>
            </AuthProvider>
        </SWRConfig>
    );
}
