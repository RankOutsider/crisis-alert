'use client';

import PullToRefresh from 'react-simple-pull-to-refresh';
import { useSWRConfig } from 'swr';
import { Loader2 } from 'lucide-react';

export default function PullToRefreshLayout({ children, onManualRefresh }) {
    const { mutate } = useSWRConfig();

    // Hàm xử lý khi người dùng kéo xuống
    const handleRefresh = async () => {
        try {
            if (onManualRefresh) {
                await onManualRefresh();
            }
            else {
                await mutate(
                    () => true,
                    undefined,
                    { revalidate: true }
                );
            }

            return Promise.resolve();
        } catch (error) {
            console.error("Refresh failed:", error);
            return Promise.resolve();
        }
    };

    // Tùy chỉnh Icon Loading khi kéo
    const CustomSpinner = () => (
        <div className="flex items-center justify-center p-4 text-blue-500">
            <Loader2 className="animate-spin" size={24} />
        </div>
    );

    return (
        <PullToRefresh
            onRefresh={handleRefresh}
            refreshingContent={<CustomSpinner />}
            pullingContent={<div className="text-center p-4 text-gray-400 text-sm">⬇️ Pull down to refresh</div>}
            maxPullDownDistance={95} // Khoảng cách kéo tối đa
            resistance={2.5} // Độ nặng khi kéo
        >
            {/* Nội dung trang web sẽ nằm trong này */}
            {children}
        </PullToRefresh>
    );
}