'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, MessageSquare, ExternalLink, BarChart3, PieChart, Globe, ShieldCheck } from 'lucide-react';
import { api } from '@/utils/api';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = {
    POSITIVE: '#22c55e', // green-500
    NEGATIVE: '#ef4444', // red-500
    NEUTRAL: '#64748b',  // slate-500
};

export default function CaseStudyDetailPage() {
    const params = useParams();
    const caseStudyId = params.id;

    const [caseStudy, setCaseStudy] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false); // State để tránh nhấn nút nhiều lần

    useEffect(() => {
        if (!caseStudyId) return;

        const fetchCaseStudyDetails = async () => {
            try {
                setIsLoading(true);
                const data = await api(`casestudies/${caseStudyId}`);
                setCaseStudy(data);
            } catch (err) {
                setError('Failed to fetch case study details.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCaseStudyDetails();
    }, [caseStudyId]);

    // === HÀM MỚI ĐỂ THAY ĐỔI TRẠNG THÁI ===
    const handleToggleStatus = async () => {
        if (!caseStudy || isUpdating) return;
        setIsUpdating(true);

        const newStatus = caseStudy.status === 'Resolved' ? 'Unresolved' : 'Resolved';

        // Cập nhật UI ngay lập tức
        setCaseStudy(prev => ({ ...prev, status: newStatus }));

        try {
            // Gọi API để lưu thay đổi
            await api(`casestudies/${caseStudy.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            // Nếu có lỗi, quay lại trạng thái cũ
            setCaseStudy(prev => ({ ...prev, status: caseStudy.status }));
            console.error("Failed to update status", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const sentimentData = useMemo(() => {
        if (!caseStudy?.posts) return [];
        const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
        caseStudy.posts.forEach(post => { sentimentCounts[post.sentiment]++; });
        return Object.entries(sentimentCounts).map(([name, value]) => ({ name, value })).filter(entry => entry.value > 0);
    }, [caseStudy]);

    const timelineData = useMemo(() => {
        if (!caseStudy?.posts) return [];
        const postsByDate = {};
        caseStudy.posts.forEach(post => {
            const date = new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!postsByDate[date]) { postsByDate[date] = 0; }
            postsByDate[date]++;
        });
        return Object.entries(postsByDate).map(([name, posts]) => ({ name, posts }));
    }, [caseStudy]);


    if (isLoading) return <div className="p-8 text-center text-gray-400">Loading analysis...</div>;
    if (error) return <p className="p-8 text-red-400">{error}</p>;
    if (!caseStudy) return null;

    return (
        <div>
            <Link href="/dashboard/casestudies" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
                <ArrowLeft size={20} />
                Back to All Case Studies
            </Link>

            {/* Phần Tóm tắt */}
            <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{caseStudy.title}</h1>
                <p className="text-gray-400 mb-6">{caseStudy.summary}</p>
                <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
                    {/* === PHẦN ĐƯỢC CẬP NHẬT === */}
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className="text-gray-400" />
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-semibold ${caseStudy.status === 'Resolved' ? 'text-green-400' : 'text-yellow-400'}`}>{caseStudy.status}</span>
                        <button onClick={handleToggleStatus} disabled={isUpdating}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${caseStudy.status === 'Resolved' ? 'bg-green-500' : 'bg-slate-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${caseStudy.status === 'Resolved' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <MessageSquare size={16} /> Total Mentions: <span className="font-semibold text-white">{caseStudy.postCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={16} /> Date Range: <span className="font-semibold text-white">{caseStudy.dateRange}</span>
                    </div>
                </div>
            </div>

            {/* Phần Phân tích với Biểu đồ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><PieChart size={20} /> Sentiment Breakdown</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                    {sentimentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[entry.name]} />))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={20} /> Crisis Timeline</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={timelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                                <YAxis tick={{ fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                <Bar dataKey="posts" fill="#3b82f6" />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Danh sách các bài post liên quan */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">All Mentioned Posts in this Case</h2>
                <div className="space-y-4">
                    {caseStudy.posts && caseStudy.posts.length > 0 ? caseStudy.posts.map(post => (
                        <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-lg text-white mb-1">{post.title}</h3>
                                <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex-shrink-0 ml-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                                    View Source <ExternalLink size={16} />
                                </a>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <span>From: <span className="font-medium text-gray-300">{post.source}</span></span>
                                <span className="flex items-center gap-1.5"><Globe size={14} />Platform: <span className="font-medium text-gray-300">{post.platform || 'N/A'}</span></span>
                            </div>
                            <p className="text-gray-300 text-base">{post.content}</p>
                            <div className="mt-3">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full
                                    ${post.sentiment === 'NEGATIVE' && 'bg-red-500/30 text-red-300'}
                                    ${post.sentiment === 'POSITIVE' && 'bg-green-500/30 text-green-300'}
                                    ${post.sentiment === 'NEUTRAL' && 'bg-gray-500/30 text-gray-300'}`}>
                                    {post.sentiment}
                                </span>
                            </div>
                        </div>
                    )) : (<p className="text-gray-500">No posts found for this case study.</p>)}
                </div>
            </div>
        </div>
    );
}