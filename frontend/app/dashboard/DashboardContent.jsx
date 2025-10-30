'use client';

import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import StatCard from '@/app/components/StatCard';
import MainChart from '@/app/components/MainChart';
import { AlertCircle, Newspaper, MessageSquare, RefreshCw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Skeleton Component cho StatCard ---
function StatCardSkeleton({ icon: Icon, color, title }) {
    return (
        <div className="bg-slate-800/50 p-5 rounded-lg flex items-center gap-4 animate-pulse">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-slate-700`}>
                {/* Icon hiển thị để giữ layout */}
                <Icon size={24} className={color} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div> {/* Skeleton for Title */}
                <div className="h-6 bg-slate-700 rounded w-1/2"></div>     {/* Skeleton for Value */}
            </div>
        </div>
    );
}

// --- Skeleton Component cho MainChart ---
function MainChartSkeleton() {
    return (
        <div className="bg-slate-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg h-96 flex items-center justify-center animate-pulse">
            {/* Có thể để trống hoặc dùng spinner nhỏ */}
            <Loader2 size={32} className="animate-spin text-blue-400 opacity-50" />
        </div>
    );
}


export default function DashboardContent() {
    const router = useRouter();

    const { data, error, isLoading, mutate } = useSWR('/api/alerts/stats', fetcher, {
        refreshInterval: 60000,
        onError: (err) => {
            if (err.message.includes('Unauthorized') || err.message.includes('401')) {
                router.replace('/login');
            }
        }
    });

    // --- Khối xử lý Lỗi ---
    if (error && !data) {
        return (
            <main className="p-8 min-h-screen flex items-center justify-center">
                <div className="text-center py-10 px-6 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Dashboard Data</h3>
                    <p className="mt-1 text-sm text-red-300">{error.message || 'Could not load dashboard stats.'}</p>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => mutate()}
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

    // --- Khối xử lý Loading (Skeleton) ---
    if (isLoading && !data) { // Chỉ hiện skeleton khi load lần đầu
        return (
            <div className="min-h-screen text-gray-200 overflow-x-hidden"> {/* Bỏ animate-pulse ở đây */}
                <main className="p-4 sm:p-6 md:p-8">
                    {/* Skeleton cho Header */}
                    <div className="mb-8 animate-pulse"> {/* Thêm animate-pulse vào từng phần */}
                        <div className="h-10 bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                    </div>

                    {/* Skeleton cho STAT CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        {/* Dùng Skeleton Component */}
                        <StatCardSkeleton title="Active Alerts" icon={AlertCircle} color="text-red-400" />
                        <StatCardSkeleton title="Total Alert-Mentioned Posts" icon={MessageSquare} color="text-blue-400" />
                        <StatCardSkeleton title="Total Alerts" icon={Newspaper} color="text-green-400" />
                    </div>

                    {/* Skeleton cho CHART */}
                    <MainChartSkeleton />
                </main>
            </div>
        );
    }

    // --- Khối return chính (khi có data - Giữ nguyên) ---
    return (
        <div className="min-h-screen text-gray-200 overflow-x-hidden">
            <main className="p-4 sm:p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Alerts Dashboard</h1>
                    <p className="text-gray-300">Overview of your brand's current status.</p>
                </div>

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

                <div className="bg-slate-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg">
                    <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Mentions Over Time</h2>
                    <div className="h-80 md:h-96 w-full">
                        {/* Kiểm tra data chart trước khi render */}
                        {data?.chartData ? <MainChart chartData={data.chartData} /> : <div className="text-center text-slate-500">No chart data available.</div>}
                    </div>
                </div>
            </main>
        </div>
    );
}