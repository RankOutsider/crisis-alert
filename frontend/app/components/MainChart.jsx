// frontend/app/components/MainChart.jsx
'use client';

import { useMemo } from 'react';
import useSWR from 'swr'; // Thêm useSWR
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetcher } from '@/utils/api';
import { Loader2, AlertCircle } from 'lucide-react';

// Hằng số API URL cho dữ liệu biểu đồ
const CHART_API_URL = '/api/posts/all?limit=100&fields=title,content,source&search='; // Chỉ lấy posts với limit 1000 và filter theo sentiment (giúp backend query nhanh hơn)

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/80 backdrop-blur-sm p-3 rounded-md border border-slate-700 text-sm sm:text-base">
                <p className="label text-white font-bold">{`${label}`}</p>
                {payload.map((pld, index) => (
                    <p key={index} style={{ color: pld.fill }}>{`${pld.name}: ${pld.value}`}</p>
                ))}
            </div>
        );
    }
    return null;
};

export default function MainChart() {
    // --- 1. Thay thế useState/useEffect fetch thủ công bằng useSWR ---
    const {
        data,
        error,
        isLoading,
        mutate
    } = useSWR(CHART_API_URL, fetcher, {
        // Thiết lập tự động revalidate sau mỗi 5 phút (nếu cần)
        refreshInterval: 300000
    });

    // Lấy mảng posts từ data (nếu có)
    const posts = data?.posts || [];

    // --- 2. Logic tính toán dữ liệu biểu đồ ---
    const chartData = useMemo(() => {
        const dayCounts = new Map();
        // Khởi tạo các ngày trong 7 ngày qua
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dayCounts.set(dayLabel, { name: dayLabel, negative: 0, positive: 0 });
        }

        posts.forEach(post => {
            const postDate = new Date(post.publishedAt);
            const dayLabel = postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (dayCounts.has(dayLabel)) {
                const dayData = dayCounts.get(dayLabel);
                // Bỏ qua sentiment NEUTRAL trong biểu đồ này (chỉ đếm positive/negative)
                if (post.sentiment === 'POSITIVE') dayData.positive += 1;
                else if (post.sentiment === 'NEGATIVE') dayData.negative += 1;
            }
        });

        return Array.from(dayCounts.values());
    }, [posts]); // Chạy lại khi mảng posts từ SWR thay đổi

    // --- 3. Sửa JSX hiển thị Loading/Error ---
    if (error) {
        return (
            <div className="bg-slate-800/50 p-4 sm:p-6 rounded-lg h-64 sm:h-80 md:h-96 flex flex-col items-center justify-center">
                <AlertCircle size={28} className="text-red-400 mb-3 sm:mb-4" />
                <p className="text-red-400 text-sm sm:text-base">Error loading chart data.</p>
                <button onClick={() => mutate()} className="mt-3 text-sm text-white bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">Retry</button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-slate-800/50 p-4 sm:p-6 rounded-lg h-64 sm:h-80 md:h-96 flex flex-col items-center justify-center">
                <Loader2 size={28} className="animate-spin text-blue-400 mb-3 sm:mb-4" />
                <p className="text-gray-400 text-sm sm:text-base">Loading Chart Data...</p>
            </div>
        );
    }

    // --- 4. JSX chính ---
    return (
        <div className="w-full h-full">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-3 sm:mb-4">Posts Mentions (Last 7 Days)</h2>

            <ResponsiveContainer width="100%" height="85%">
                <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 15, left: -10, bottom: 35 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        angle={-45}
                        textAnchor="end"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        interval={0}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
                    <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    />
                    <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="positive" stackId="a" fill="#22c55e" name="Positive" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}