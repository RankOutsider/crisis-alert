// frontend/app/dashboard/DashboardContent.jsx
'use client';

import useSWR from 'swr';
import { fetcher } from '@/utils/api'; // Đã import fetcher chung
import StatCard from '@/app/components/StatCard';
import MainChart from '@/app/components/MainChart';
// 1. Thêm RefreshCw (cho nút retry) và Loader2 (cho skeleton loading)
import { AlertCircle, Newspaper, MessageSquare, RefreshCw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardContent() {
    const router = useRouter();

    // Sử dụng SWR để fetch dữ liệu dashboard
    const { data, error, isLoading, mutate } = useSWR('/api/alerts/stats', fetcher, {
        refreshInterval: 60000, // Tự động cập nhật lại sau mỗi 60 giây
        onError: (err) => {
            // Nếu lỗi là do chưa đăng nhập, chuyển về trang login
            if (err.message.includes('Unauthorized') || err.message.includes('401')) {
                router.replace('/login');
            }
        }
    });

    // Khối xử lý Lỗi (với nút Retry)
    if (error && !data) { // Hiển thị lỗi chỉ khi không có data cũ
        return (
            <main className="p-8 min-h-screen flex items-center justify-center">
                <div className="text-center py-10 px-6 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Dashboard Data</h3>
                    <p className="mt-1 text-sm text-red-300">{error.message || 'Could not load dashboard stats.'}</p>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => mutate()} // Nút Retry gọi SWR mutate
                            className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // 4. THÊM Khối xử lý Loading (Skeleton)
    if (isLoading && !data) { // Hiển thị skeleton chỉ khi load lần đầu
        return (
            <div className="min-h-screen text-gray-200 overflow-x-hidden animate-pulse">
                <main className="p-4 sm:p-6 md:p-8">
                    <div className="mb-8">
                        {/* Skeleton cho H1 và P */}
                        <div className="h-10 bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                    </div>
                    {/* Skeleton cho STAT CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        {/* Dùng StatCard để hiển thị skeleton */}
                        <StatCard title="Active Alerts" value="..." icon={AlertCircle} color="text-red-400" />
                        <StatCard title="Total Alert-Mentioned Posts" value="..." icon={MessageSquare} color="text-blue-400" />
                        <StatCard title="Total Alerts" value="..." icon={Newspaper} color="text-green-400" />
                    </div>
                    {/* Skeleton cho CHART */}
                    <div className="bg-slate-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg h-96 flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-blue-400" />
                    </div>
                </main>
            </div>
        );
    }

    // 5. Khối return chính (khi có data)
    return (
        <div className="min-h-screen text-gray-200 overflow-x-hidden">
            <main className="p-4 sm:p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Alerts Dashboard</h1>
                    <p className="text-gray-300">Overview of your brand's current status.</p>
                </div>

                {/* STAT CARDS (Bỏ logic 'isLoading ? ...' vì đã xử lý ở trên) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <StatCard
                        title="Active Alerts"
                        value={(data?.activeAlerts ?? 0).toString()}
                        icon={AlertCircle}
                        color="text-red-400"
                    />
                    <StatCard
                        title="Total Alert-Mentioned Posts"
                        value={(data?.totalMentionedPosts ?? 0).toLocaleString()}
                        icon={MessageSquare}
                        color="text-blue-400"
                    />
                    <StatCard
                        title="Total Alerts"
                        value={`${data?.totalAlerts ?? 0} Alerts`}
                        icon={Newspaper}
                        color="text-green-400"
                    />
                </div>

                {/* CHART */}
                <div className="bg-slate-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg">
                    <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Mentions Over Time</h2>
                    <div className="h-80 md:h-96 w-full">
                        <MainChart />
                    </div>
                </div>
            </main>
        </div>
    );
}