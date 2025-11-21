// frontend/app/components/MainChart.jsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';

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

export default function MainChart({ chartData, isLoading, error, onRetry, onBarClick }) {
    if (error) {
        return (
            <div className="bg-slate-800/50 p-4 sm:p-6 rounded-lg h-full flex flex-col items-center justify-center">
                <AlertCircle size={28} className="text-red-400 mb-3 sm:mb-4" />
                <p className="text-red-400 text-sm sm:text-base">Error loading chart data.</p>
                {onRetry && (
                    <button onClick={onRetry} className="mt-3 text-sm text-white bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">
                        Retry
                    </button>
                )}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-slate-800/50 p-4 sm:p-6 rounded-lg h-full flex flex-col items-center justify-center">
                <Loader2 size={28} className="animate-spin text-blue-400 mb-3 sm:mb-4" />
                <p className="text-gray-400 text-sm sm:text-base">Loading Chart Data...</p>
            </div>
        );
    }

    // --- Hàm xử lý click nội bộ của Recharts ---
    const handleChartClick = (data) => {
        if (!onBarClick || !data) return;

        // Cách 1: Click trúng thanh màu (Recharts trả về activePayload)
        if (data.activePayload && data.activePayload.length > 0) {
            const barData = data.activePayload[0].payload;
            onBarClick(barData);
            return;
        }

        // Cách 2 (FALLBACK): Click vào nhãn hoặc khoảng trắng của cột (Recharts trả về activeLabel)
        if (data.activeLabel) {
            // Tìm lại data gốc dựa trên cái nhãn (ví dụ: "Nov 2025")
            const foundData = chartData.find(item => item.name === data.activeLabel);
            if (foundData) {
                onBarClick(foundData);
            }
        }
    };

    // --- JSX chính ---
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                margin={{ top: 5, right: 15, left: -10, bottom: 35 }}

                // --- Gắn sự kiện click ---
                onClick={handleChartClick}
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
                <Bar dataKey="negative" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} />
                <Bar dataKey="positive" fill="#22c55e" name="Positive" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}