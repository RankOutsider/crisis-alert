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

// Thay đổi lớn: MainChart giờ nhận props
export default function MainChart({ chartData, isLoading, error, onRetry }) {
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

    // --- JSX chính ---
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData} // Sử dụng chartData từ props
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
    );
}