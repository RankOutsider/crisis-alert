'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '@/utils/api';
import { Loader2 } from 'lucide-react';

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
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                setIsLoading(true);
                const data = await api('posts/all?limit=1000');
                if (data && Array.isArray(data.posts)) {
                    setPosts(data.posts);
                }
            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchChartData();
    }, []);

    const chartData = useMemo(() => {
        const dayCounts = new Map();
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
                if (post.sentiment === 'POSITIVE') dayData.positive += 1;
                else if (post.sentiment === 'NEGATIVE') dayData.negative += 1;
            }
        });

        return Array.from(dayCounts.values());
    }, [posts]);

    if (isLoading) {
        return (
            <div className="bg-slate-800/50 p-4 sm:p-6 rounded-lg h-64 sm:h-80 md:h-96 flex flex-col items-center justify-center">
                <Loader2 size={28} className="animate-spin text-blue-400 mb-3 sm:mb-4" />
                <p className="text-gray-400 text-sm sm:text-base">Loading Chart Data...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 p-4 sm:p-6 md:p-6 rounded-lg h-64 sm:h-80 md:h-96 w-full overflow-x-hidden">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-3 sm:mb-4">Mentions Over Time (Last 7 Days)</h2>

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
                        wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    />
                    <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="positive" stackId="a" fill="#22c55e" name="Positive" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}