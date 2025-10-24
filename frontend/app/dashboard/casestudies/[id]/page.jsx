// frontend/app/dashboard/casestudies/[id]/page.jsx
'use client';

// --- Imports ---
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
    ArrowLeft, Clock, MessageSquare, ExternalLink, BarChart3, PieChart,
    Globe, ShieldCheck, Search, AlertCircle as AlertIcon, RefreshCw // Thêm RefreshCw và AlertIcon
} from 'lucide-react';
import { api, fetcher } from '@/utils/api'; // Import api và fetcher
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import FilterBar from '@/app/components/FilterBar'; // <-- THÊM IMPORT NÀY

// --- Constants ---
const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source']; // Bỏ 'Sentiment'
const COLORS = { POSITIVE: '#22c55e', NEGATIVE: '#ef4444', NEUTRAL: '#64748b' };
const PLATFORM_OPTIONS = ['Facebook', 'X', 'Instagram', 'News', 'Tiktok', 'Forum', 'Threads', 'Youtube', 'Blog'];
const SENTIMENT_OPTIONS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];

// --- useDebounce Hook ---
// Hook để trì hoãn việc cập nhật giá trị
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

export default function CaseStudyDetailPage() {
    // --- Hooks ---
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const caseStudyId = params.id;

    // --- State ---
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    // State cho ô tìm kiếm
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- Derived State from URL (Tính state từ URL) ---
    // Tính toán activeFields từ URL
    const activeFields = useMemo(() => {
        const fieldsParam = searchParams.get('fields');
        if (fieldsParam === null) return { title: true, content: true, source: true };
        if (fieldsParam === '') return { title: false, content: false, source: false };
        const urlFields = new Set(fieldsParam.split(','));
        return {
            title: urlFields.has('title'),
            content: urlFields.has('content'),
            source: urlFields.has('source'),
        };
    }, [searchParams]);

    // Lấy selectedPlatforms từ URL
    const selectedPlatforms = useMemo(() => {
        return searchParams.get('platforms')?.split(',').filter(Boolean) || [];
    }, [searchParams]);

    // Lấy selectedSentiments từ URL
    const selectedSentiments = useMemo(() => {
        return searchParams.get('sentiments')?.split(',').filter(Boolean) || [];
    }, [searchParams]);


    // --- API URL Construction ---
    // URL fetch chi tiết Case Study
    const caseStudyApiUrl = useMemo(() => caseStudyId ? `/api/casestudies/${caseStudyId}` : null, [caseStudyId]);
    // URL fetch Posts
    const postsApiUrl = useMemo(() => {
        if (!caseStudyId) return null;
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        params.delete('search');
        params.delete('fields');

        const activeFieldKeys = Object.keys(activeFields).filter(field => activeFields[field]);

        if (debouncedSearchTerm && activeFieldKeys.length > 0) {
            params.set('search', debouncedSearchTerm);
            params.set('fields', activeFieldKeys.join(','));
        }

        return `/api/posts/by-case-study/${caseStudyId}?${params.toString()}`;
    }, [caseStudyId, debouncedSearchTerm, activeFields, searchParams]);

    // --- Data Fetching ---
    // Fetch chi tiết Case Study
    const {
        data: caseStudy, // Đổi tên data
        error: caseStudyError,
        isLoading: isCaseStudyLoading, // Đổi tên isLoading
        mutate: mutateCaseStudy
    } = useSWR(caseStudyApiUrl, fetcher);

    // Fetch Posts
    const {
        data: postsData,
        error: postsError,
        isLoading: isPostsLoading,
        mutate: mutatePosts
    } = useSWR(postsApiUrl, fetcher, { keepPreviousData: true });
    // Lấy mảng posts từ data (an toàn)
    const posts = postsData?.posts || [];

    // --- useEffects (Đồng bộ State và URL) ---
    // Đồng bộ URL -> searchTerm input
    useEffect(() => {
        const searchTermFromUrl = searchParams.get('q') || '';
        if (searchTermFromUrl !== searchTerm) {
            setSearchTerm(searchTermFromUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Đồng bộ debouncedSearchTerm -> URL param 'q'
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentQ = params.get('q') || '';
        if (debouncedSearchTerm !== currentQ) {
            if (debouncedSearchTerm) {
                params.set('q', debouncedSearchTerm);
            } else {
                params.delete('q');
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearchTerm, pathname, router, searchParams]);


    // --- HANDLERS ---
    // Handler cho checkbox 'Search in'
    const handlePostSearchFieldChange = (field) => {
        const fieldKey = field.toLowerCase();
        const newFieldsState = { ...activeFields, [fieldKey]: !activeFields[fieldKey] };
        const activeFieldKeys = Object.keys(newFieldsState).filter(f => newFieldsState[f]);
        const params = new URLSearchParams(searchParams.toString());
        if (activeFieldKeys.length === POST_SEARCH_FIELDS.length) {
            params.delete('fields');
        } else {
            params.set('fields', activeFieldKeys.join(','));
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Handler cho dropdown Platforms
    const handlePlatformChange = (newSelection) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newSelection.length > 0) {
            params.set('platforms', newSelection.join(','));
        } else {
            params.delete('platforms');
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Handler cho dropdown Sentiments
    const handleSentimentChange = (newSelection) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newSelection.length > 0) {
            params.set('sentiments', newSelection.join(','));
        } else {
            params.delete('sentiments');
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Handler cập nhật status Case Study (Code đầy đủ)
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
            // Có thể thêm thông báo lỗi cho người dùng
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // --- Phân tích dữ liệu cho biểu đồ (Code đầy đủ + Sửa lỗi) ---
    const sentimentData = useMemo(() => {
        // Trả về mảng rỗng nếu chưa có data
        if (!postsData?.posts) return [];
        const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
        postsData.posts.forEach(post => {
            // Thêm kiểm tra an toàn
            if (post && post.sentiment && sentimentCounts.hasOwnProperty(post.sentiment)) {
                sentimentCounts[post.sentiment]++;
            }
        });
        return Object.entries(sentimentCounts).map(([name, value]) => ({ name, value })).filter(entry => entry.value > 0);
    }, [postsData]); // Phụ thuộc vào postsData

    const timelineData = useMemo(() => {
        // Trả về mảng rỗng nếu chưa có data
        if (!postsData?.posts) return [];
        const postsByDate = {};
        postsData.posts.forEach(post => {
            // Thêm kiểm tra an toàn
            if (post && post.publishedAt) {
                const date = new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (!postsByDate[date]) { postsByDate[date] = 0; }
                postsByDate[date]++;
            }
        });
        return Object.entries(postsByDate).map(([name, posts]) => ({ name, posts })).sort((a, b) => new Date(a.name) - new Date(b.name));
    }, [postsData]); // Phụ thuộc vào postsData

    // --- Xử lý Loading/Error ban đầu cho Case Study ---
    if (isCaseStudyLoading) return <div className="p-8 text-center text-gray-400">Loading analysis...</div>;
    if (caseStudyError) return (
        <div className="p-8 text-center text-red-400">
            <p>Failed to fetch case study details.</p>
            <button onClick={() => mutateCaseStudy()} className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">Retry</button>
        </div>
    );
    if (!caseStudy) return <div className="p-8 text-center text-gray-400">Case study not found.</div>;

    // --- JSX ---
    return (
        <div className="p-4 md:p-6 lg:p-8 text-gray-200 overflow-x-hidden">
            {/* Nút Back */}
            <Link href="/dashboard/casestudies" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"><ArrowLeft size={20} /> Back to Case Studies</Link>

            {/* Phần Tóm tắt Case Study (Giữ nguyên JSX) */}
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
                    <div className="flex items-center gap-2 text-gray-400"><MessageSquare size={16} /> Total Mentions: <span className="font-semibold text-white">{caseStudy.postCount || 0}</span></div>
                    <div className="flex items-center gap-2 text-gray-400"><Clock size={16} /> Date Range: <span className="font-semibold text-white">{caseStudy.dateRange || 'N/A'}</span></div>
                </div>
            </div>

            {/* Biểu đồ (Giữ nguyên JSX) */}
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

            {/* Phần Danh sách Posts */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">All Mentioned Posts</h2>

                {/* --- SỬ DỤNG FilterBar --- */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in these posts..."

                    availableFields={POST_SEARCH_FIELDS} // Fields cho Posts
                    activeFields={activeFields} // State đọc từ URL
                    onFieldChange={handlePostSearchFieldChange} // Handler cập nhật URL

                    platformOptions={PLATFORM_OPTIONS}
                    selectedPlatforms={selectedPlatforms} // State đọc từ URL
                    onPlatformChange={handlePlatformChange} // Handler cập nhật URL

                    sentimentOptions={SENTIMENT_OPTIONS}
                    selectedSentiments={selectedSentiments} // State đọc từ URL
                    onSentimentChange={handleSentimentChange} // Handler cập nhật URL
                />

                {/* Hiển thị Loading / Error / Data / Empty cho Posts */}
                {isPostsLoading && !postsData && (
                    <p className="text-center text-gray-400 py-10">Loading posts...</p>
                )}
                {postsError && (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                        <AlertIcon className="mx-auto h-12 w-12 text-red-400" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Posts</h3>
                        <p className="mt-1 text-sm text-red-300">{postsError.message || 'Could not load posts.'}</p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => mutatePosts()}
                                className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </button>
                        </div>
                    </div>
                )}
                {!isPostsLoading && !postsError && postsData && (
                    <div className="space-y-4">
                        {posts.length > 0 ? posts.map(post => (
                            // --- Thẻ Post ---
                            <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors duration-150 overflow-hidden">
                                <div className="flex justify-between items-start gap-2 min-w-0">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-lg text-white mb-1 truncate" title={post.title}>{post.title}</h3>
                                    </div>
                                    <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                                        <ExternalLink size={16} /> View Source
                                    </a>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
                                    <span>From: <span className="font-medium text-gray-300 break-words">{post.source}</span></span>
                                    {post.platform && (
                                        <span className="flex items-center gap-1.5">
                                            <Globe size={14} />Platform: <span className="font-medium text-blue-300 capitalize">{post.platform}</span>
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-300 text-base line-clamp-3">{post.content}</p>
                                <div className="mt-3">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${post.sentiment === 'NEGATIVE' && 'bg-red-500/30 text-red-300'} ${post.sentiment === 'POSITIVE' && 'bg-green-500/30 text-green-300'} ${post.sentiment === 'NEUTRAL' && 'bg-gray-500/30 text-gray-300'}`}>
                                        {post.sentiment || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            // --- Hết Thẻ Post ---
                        )) : (
                            // --- Trạng thái rỗng cho Posts ---
                            <div className="text-center py-16 px-4 border-2 border-dashed border-slate-700 rounded-lg">
                                <Search size={48} className="mx-auto h-12 w-12 text-slate-500" />
                                <h3 className="mt-2 text-lg font-semibold text-white">No Matching Posts Found</h3>
                                <p className="mt-1 text-sm text-slate-400">
                                    {searchTerm || selectedPlatforms.length > 0 || selectedSentiments.length > 0
                                        ? "No posts related to this case study match your current filters."
                                        : "No posts have been linked to this case study yet."
                                    }
                                </p>
                                {(searchTerm || selectedPlatforms.length > 0 || selectedSentiments.length > 0) && (
                                    <button
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams.toString());
                                            params.delete('q');
                                            params.delete('fields');
                                            params.delete('platforms');
                                            params.delete('sentiments');
                                            router.push(`${pathname}?${params.toString()}`, { scroll: false });
                                            setSearchTerm('');
                                        }}
                                        className="mt-4 inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-600"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}