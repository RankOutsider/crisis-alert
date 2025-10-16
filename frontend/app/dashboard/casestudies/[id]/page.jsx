// frontend/app/dashboard/casestudies/[id]/page.jsx
'use client';

import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowLeft, Clock, MessageSquare, ExternalLink, BarChart3, PieChart, Globe, ShieldCheck, Search } from 'lucide-react';
import { api } from '@/utils/api';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const fetcher = (url) => api(url.substring(5)); // Bỏ tiền tố '/api/'
const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source', 'Sentiment'];
const COLORS = { POSITIVE: '#22c55e', NEGATIVE: '#ef4444', NEUTRAL: '#64748b' };

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

export default function CaseStudyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const caseStudyId = params.id;

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // --- Fetch chi tiết Case Study ---
    const { data: caseStudy, error: caseStudyError, mutate: mutateCaseStudy } = useSWR(`/api/casestudies/${caseStudyId}`, fetcher);

    // --- Logic tìm kiếm Posts ---
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const postsApiUrl = useMemo(() => {
        if (!caseStudyId) return null;
        const params = new URLSearchParams();
        // Mặc định tìm kiếm trong tất cả các trường
        params.set('fields', POST_SEARCH_FIELDS.join(',').toLowerCase());
        if (debouncedSearchTerm) {
            params.set('search', debouncedSearchTerm);
        }
        // Yêu cầu API mới để lấy post theo case study
        return `/api/posts/by-case-study/${caseStudyId}?${params.toString()}`;
    }, [caseStudyId, debouncedSearchTerm]);

    const { data: postsData, error: postsError, isLoading: isPostsLoading } = useSWR(postsApiUrl, fetcher, { keepPreviousData: true });

    // Cập nhật URL khi người dùng gõ tìm kiếm
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearchTerm) {
            params.set('q', debouncedSearchTerm);
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [debouncedSearchTerm, pathname, router]);

    // --- Handlers ---
    const handleToggleStatus = async () => {
        if (!caseStudy || isUpdatingStatus) return;
        setIsUpdatingStatus(true);
        const newStatus = caseStudy.status === 'Resolved' ? 'Unresolved' : 'Resolved';
        try {
            await api(`casestudies/${caseStudy.id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            mutateCaseStudy(); // Báo SWR fetch lại chi tiết case study
        } catch (err) {
            console.error("Failed to update status", err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // --- Phân tích dữ liệu cho biểu đồ (từ postsData) ---
    const sentimentData = useMemo(() => {
        if (!postsData?.posts) return [];
        const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
        postsData.posts.forEach(post => { sentimentCounts[post.sentiment]++; });
        return Object.entries(sentimentCounts).map(([name, value]) => ({ name, value })).filter(entry => entry.value > 0);
    }, [postsData]);

    const timelineData = useMemo(() => {
        if (!postsData?.posts) return [];
        const postsByDate = {};
        postsData.posts.forEach(post => {
            const date = new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!postsByDate[date]) { postsByDate[date] = 0; }
            postsByDate[date]++;
        });
        return Object.entries(postsByDate).map(([name, posts]) => ({ name, posts })).sort((a, b) => new Date(a.name) - new Date(b.name));
    }, [postsData]);

    if (caseStudyError) return <p className="p-8 text-red-400">Failed to fetch case study details.</p>;
    if (!caseStudy) return <div className="p-8 text-center text-gray-400">Loading analysis...</div>;

    return (
        <div className="overflow-x-hidden">
            <Link href="/dashboard/casestudies" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"><ArrowLeft size={20} /> Back</Link>

            {/* Phần Tóm tắt */}
            <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{caseStudy.title}</h1>
                <p className="text-gray-300 mb-6">{caseStudy.summary}</p>
                <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className="text-gray-400" />
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-semibold ${caseStudy.status === 'Resolved' ? 'text-green-400' : 'text-yellow-400'}`}>{caseStudy.status}</span>
                        <button onClick={handleToggleStatus} disabled={isUpdatingStatus} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${caseStudy.status === 'Resolved' ? 'bg-green-500' : 'bg-slate-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${caseStudy.status === 'Resolved' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400"><MessageSquare size={16} /> Total Mentions: <span className="font-semibold text-white">{caseStudy.postCount}</span></div>
                    <div className="flex items-center gap-2 text-gray-400"><Clock size={16} /> Date Range: <span className="font-semibold text-white">{caseStudy.dateRange}</span></div>
                </div>
            </div>

            {/* Biểu đồ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><PieChart size={20} /> Sentiment Breakdown</h2>
                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><RechartsPieChart><Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{sentimentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[entry.name]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} /></RechartsPieChart></ResponsiveContainer></div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={20} /> Crisis Timeline</h2>
                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><RechartsBarChart data={timelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis dataKey="name" tick={{ fill: '#94a3b8' }} /><YAxis tick={{ fill: '#94a3b8' }} /><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} /><Bar dataKey="posts" fill="#3b82f6" /></RechartsBarChart></ResponsiveContainer></div>
                </div>
            </div>

            {/* Danh sách Posts */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">All Mentioned Posts</h2>
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                    <div className="relative w-full">
                        <input type="text" placeholder="Search in these posts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {isPostsLoading && <p className="text-gray-400">Loading posts...</p>}
                {postsError && <p className="text-red-400">Failed to load posts.</p>}
                {postsData && (
                    <div className="space-y-4">
                        {postsData.posts.length > 0 ? postsData.posts.map(post => (
                            <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-lg text-white mb-1">{post.title}</h3>
                                    <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 ml-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">View Source <ExternalLink size={16} /></a>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                                    <span>From: <span className="font-medium">{post.source}</span></span>
                                    <span className="flex items-center gap-1.5"><Globe size={14} />Platform: <span className="font-medium">{post.platform || 'N/A'}</span></span>
                                </div>
                                <p className="text-gray-300 text-base">{post.content}</p>
                                <div className="mt-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${post.sentiment === 'NEGATIVE' && 'bg-red-500/30 text-red-300'} ${post.sentiment === 'POSITIVE' && 'bg-green-500/30 text-green-300'} ${post.sentiment === 'NEUTRAL' && 'bg-gray-500/30 text-gray-300'}`}>{post.sentiment}</span></div>
                            </div>
                        )) : (<p className="text-gray-500 text-center">No posts match your search criteria.</p>)}
                    </div>
                )}
            </div>
        </div>
    );
}