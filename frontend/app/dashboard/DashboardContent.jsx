'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearToken } from '@/utils/api';
import StatCard from '@/app/components/StatCard';
import MainChart from '@/app/components/MainChart';
import { AlertCircle, Newspaper, MessageSquare } from 'lucide-react';

export default function DashboardContent() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchAlerts = async () => {
            setLoading(true);
            try {
                // API bây giờ trả về một object: { alerts: [...], ... }
                const data = await api('alerts');
                console.log("✅ Dashboard data fetched:", data);

                // === DÒNG ĐÃ SỬA ===
                // Chúng ta chỉ lấy mảng 'alerts' từ bên trong object data
                if (data && Array.isArray(data.alerts)) {
                    setAlerts(data.alerts);
                }

            } catch (error) {
                console.error("❌ Error fetching alerts:", error.message);
                if (error.message.includes('Unauthorized') || error.message.includes('401')) {
                    clearToken();
                    router.replace('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, [router]);

    // Các phép tính toán bây giờ sẽ hoạt động bình thường
    const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;
    const totalMentions = alerts.reduce((sum, alert) => sum + (alert.postCount || 0), 0);

    if (loading) {
        return (
            <main className="p-8">
                <div className="p-8 text-center text-gray-400">Loading Dashboard Data...</div>
            </main>
        );
    }

    return (
        <div className="min-h-screen text-gray-200">
            <main className="p-4 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Alerts Dashboard</h1>
                    <p className="text-gray-400">Overview of your brand's current status.</p>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Active Alerts"
                        value={activeAlerts.toString()}
                        icon={AlertCircle}
                        color="text-red-400"
                    />
                    <StatCard
                        title="Total Alert-Mentioned Posts"
                        value={totalMentions.toLocaleString()}
                        icon={MessageSquare}
                        color="text-blue-400"
                    />
                    <StatCard
                        title="Total Alerts"
                        value={`${alerts.length} Alerts`}
                        icon={Newspaper}
                        color="text-green-400"
                    />
                </div>

                {/* BIỂU ĐỒ */}
                <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">Mentions Over Time</h2>
                    <div className="h-96">
                        <MainChart />
                    </div>
                </div>
            </main>
        </div>
    );
}