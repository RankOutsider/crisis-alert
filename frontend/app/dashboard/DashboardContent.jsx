// frontend/app/dashboard/DashboardContent.jsx
'use client';

import useSWR from 'swr';
import { api } from '@/utils/api';
import StatCard from '@/app/components/StatCard';
import MainChart from '@/app/components/MainChart';
import { AlertCircle, Newspaper, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Vẫn cần useRouter để điều hướng nếu có lỗi

// fetcher cho SWR
const fetcher = async (url) => {
    try {
        return await api(url.substring(5)); // Bỏ tiền tố '/api/'
    } catch (error) {
        // Ném lỗi để SWR có thể bắt được
        throw error;
    }
};

export default function DashboardContent() {
    const router = useRouter();

    // Dùng SWR để fetch dữ liệu stats, nó sẽ tự động cập nhật
    const { data, error, isLoading } = useSWR('/api/alerts/stats', fetcher, {
        refreshInterval: 60000, // Tùy chọn: Tự động cập nhật lại sau mỗi 60 giây
        onError: (err) => {
            // Nếu lỗi là do chưa đăng nhập, chuyển về trang login
            if (err.message.includes('Unauthorized') || err.message.includes('401')) {
                router.replace('/login');
            }
        }
    });

    if (error && !data) {
        return (
            <main className="p-8 min-h-screen flex items-center justify-center">
                <div className="text-red-400 text-center text-lg">Failed to load dashboard data.</div>
            </main>
        );
    }

    return (
        <div className="min-h-screen text-gray-200 overflow-x-hidden">
            <main className="p-4 sm:p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Alerts Dashboard</h1>
                    <p className="text-gray-300">Overview of your brand's current status.</p>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <StatCard
                        title="Active Alerts"
                        value={isLoading ? '...' : (data?.activeAlerts ?? 0).toString()}
                        icon={AlertCircle}
                        color="text-red-400"
                    />
                    <StatCard
                        title="Total Alert-Mentioned Posts"
                        value={isLoading ? '...' : (data?.totalMentionedPosts ?? 0).toLocaleString()}
                        icon={MessageSquare}
                        color="text-blue-400"
                    />
                    <StatCard
                        title="Total Alerts"
                        value={isLoading ? '...' : `${data?.totalAlerts ?? 0} Alerts`}
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