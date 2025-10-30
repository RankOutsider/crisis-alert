'use client';

// --- Imports ---
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
    ArrowLeft, Clock, MessageSquare, ExternalLink, BarChart3, PieChart,
    Globe, ShieldCheck, Search, AlertCircle as AlertIcon, RefreshCw, // Giữ các icon cần thiết
    ChevronLeft, ChevronRight // Icon phân trang
} from 'lucide-react';
import { api, fetcher } from '@/utils/api';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import FilterBar from '@/app/components/FilterBar';

// --- Hằng số ---
const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source']; // Các trường tìm kiếm post
const COLORS = { POSITIVE: '#22c55e', NEGATIVE: '#ef4444', NEUTRAL: '#64748b' }; // Màu cho biểu đồ
const PLATFORM_OPTIONS = ['Facebook', 'X', 'Instagram', 'News', 'Tiktok', 'Forum', 'Threads', 'Youtube', 'Blog']; // Lựa chọn platform
const SENTIMENT_OPTIONS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE']; // Lựa chọn sentiment
const POSTS_SKELETON_COUNT = 5; // Số lượng skeleton cho post list
const ITEMS_PER_PAGE = 5; // Số lượng post trên mỗi trang (phải khớp với limit backend)

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

// --- Skeleton cho Case Study Summary ---
function CaseStudySummarySkeleton() {
    return (
        <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg mb-8 animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-3/4 mb-3"></div>
            <div className="space-y-2 mb-6">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
                <div className="h-6 bg-slate-700 rounded w-28"></div>
                <div className="h-6 bg-slate-700 rounded w-36"></div>
                <div className="h-6 bg-slate-700 rounded w-48"></div>
            </div>
        </div>
    );
}

// --- Skeleton cho Biểu đồ ---
function ChartSkeleton() {
    return (
        <div className="bg-slate-800/50 p-6 rounded-lg h-80 flex flex-col animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="flex-grow bg-slate-700 rounded"></div>
        </div>
    );
}

// --- Skeleton cho mục Post ---
function PostItemSkeleton() {
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 animate-pulse">
            <div className="flex justify-between items-start gap-4 mb-2">
                <div className="h-6 bg-slate-700 rounded w-3/5"></div>
                <div className="h-4 bg-slate-700 rounded w-1/5"></div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-2">
                <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                <div className="h-4 bg-slate-700 rounded w-1/3"></div>
            </div>
            <div className="space-y-2">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-4/5"></div>
            </div>
            <div className="mt-3">
                <div className="h-5 bg-slate-700 rounded-full w-20"></div>
            </div>
        </div>
    );
}

// --- Component Chính ---
export default function CaseStudyDetailPage() {
    // --- Hooks ---
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const caseStudyId = params.id;

    // --- State ---
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(1); // State trang hiện tại

    // --- State tính toán từ URL ---
    const activeFields = useMemo(() => {
        const fieldsParam = searchParams.get('fields');
        if (fieldsParam === null) return { title: true, content: true, source: true };
        if (fieldsParam === '') return { title: false, content: false, source: false };
        const urlFields = new Set(fieldsParam.split(','));
        return {
            title: urlFields.has('title'), content: urlFields.has('content'), source: urlFields.has('source'),
        };
    }, [searchParams]);
    const selectedPlatforms = useMemo(() => searchParams.get('platforms')?.split(',').filter(Boolean) || [], [searchParams]);
    const selectedSentiments = useMemo(() => searchParams.get('sentiments')?.split(',').filter(Boolean) || [], [searchParams]);

    // --- Xây dựng URL API ---
    const caseStudyApiUrl = useMemo(() => caseStudyId ? `/api/casestudies/${caseStudyId}` : null, [caseStudyId]);
    const postsApiUrl = useMemo(() => {
        if (!caseStudyId) return null;
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q'); params.delete('search'); params.delete('fields');

        // Thêm tham số phân trang
        params.set('page', currentPage.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());

        const activeFieldKeys = Object.keys(activeFields).filter(field => activeFields[field]);
        if (debouncedSearchTerm && activeFieldKeys.length > 0) {
            params.set('search', debouncedSearchTerm);
            params.set('fields', activeFieldKeys.join(','));
        }
        return `/api/posts/by-case-study/${caseStudyId}?${params.toString()}`;
    }, [caseStudyId, debouncedSearchTerm, activeFields, searchParams, currentPage]);

    // --- Fetch Dữ liệu ---
    const { data: caseStudy, error: caseStudyError, isLoading: isCaseStudyLoading, mutate: mutateCaseStudy } = useSWR(caseStudyApiUrl, fetcher);
    const { data: postsData, error: postsError, isLoading: isPostsLoading, mutate: mutatePosts } = useSWR(postsApiUrl, fetcher, { keepPreviousData: true });
    const posts = postsData?.posts || [];
    const totalPages = postsData?.totalPages || 1; // Lấy totalPages từ postsData

    // --- useEffects đồng bộ State và URL ---
    useEffect(() => { const searchTermFromUrl = searchParams.get('q') || ''; if (searchTermFromUrl !== searchTerm) { setSearchTerm(searchTermFromUrl); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [searchParams]);
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString()); const currentQ = params.get('q') || '';
        if (debouncedSearchTerm !== currentQ) {
            if (debouncedSearchTerm) { params.set('q', debouncedSearchTerm); } else { params.delete('q'); }
            setCurrentPage(1); // Reset trang 1 khi search thay đổi
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearchTerm, pathname, router, searchParams]);

    // --- Handlers ---
    const handlePostSearchFieldChange = (field) => {
        setCurrentPage(1); // Reset trang 1 khi filter thay đổi
        const fieldKey = field.toLowerCase(); const newFieldsState = { ...activeFields, [fieldKey]: !activeFields[fieldKey] }; const activeFieldKeys = Object.keys(newFieldsState).filter(f => newFieldsState[f]); const params = new URLSearchParams(searchParams.toString()); if (activeFieldKeys.length === POST_SEARCH_FIELDS.length) { params.delete('fields'); } else { params.set('fields', activeFieldKeys.join(',')); } router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };
    const handlePlatformChange = (newSelection) => {
        setCurrentPage(1); // Reset trang 1 khi filter thay đổi
        const params = new URLSearchParams(searchParams.toString()); if (newSelection.length > 0) { params.set('platforms', newSelection.join(',')); } else { params.delete('platforms'); } router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };
    const handleSentimentChange = (newSelection) => {
        setCurrentPage(1); // Reset trang 1 khi filter thay đổi
        const params = new URLSearchParams(searchParams.toString()); if (newSelection.length > 0) { params.set('sentiments', newSelection.join(',')); } else { params.delete('sentiments'); } router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };
    const handleToggleStatus = async () => { if (!caseStudy || isUpdatingStatus) return; setIsUpdatingStatus(true); const newStatus = caseStudy.status === 'Resolved' ? 'Unresolved' : 'Resolved'; try { await api(`casestudies/${caseStudy.id}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) }); mutateCaseStudy(); } catch (err) { console.error("Failed to update status", err); } finally { setIsUpdatingStatus(false); } };

    // Handler cho phân trang
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Xử lý dữ liệu biểu đồ ---
    const sentimentData = useMemo(() => { if (!postsData?.posts) return []; const counts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 }; postsData.posts.forEach(p => { if (p?.sentiment && counts.hasOwnProperty(p.sentiment)) counts[p.sentiment]++; }); return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(e => e.value > 0); }, [postsData]);
    const timelineData = useMemo(() => { if (!postsData?.posts) return []; const byDate = {}; postsData.posts.forEach(p => { if (p?.publishedAt) { const date = new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); if (!byDate[date]) byDate[date] = 0; byDate[date]++; } }); return Object.entries(byDate).map(([name, posts]) => ({ name, posts })).sort((a, b) => new Date(a.name) - new Date(b.name)); }, [postsData]);

    // --- Xử lý Loading/Error ban đầu cho Case Study ---
    if (isCaseStudyLoading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 text-gray-200 overflow-x-hidden">
                <div className="h-6 bg-slate-700 rounded w-40 mb-6 animate-pulse"></div>
                <CaseStudySummarySkeleton />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
                <div>
                    <div className="h-8 bg-slate-700 rounded w-1/3 mb-4 animate-pulse"></div>
                    <div className="h-16 bg-slate-800/50 rounded-lg mb-6 animate-pulse"></div>
                    <div className="space-y-4">
                        {[...Array(POSTS_SKELETON_COUNT)].map((_, index) => (
                            <PostItemSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    if (caseStudyError) {
        return (
            <div className="p-8 text-center">
                <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10 max-w-lg mx-auto">
                    <AlertIcon className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Case Study</h3>
                    <p className="mt-1 text-sm text-red-300">{caseStudyError.message || 'Could not load case study details.'}</p>
                    <div className="mt-6">
                        <button type="button" onClick={() => mutateCaseStudy()} className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    if (!caseStudy) return <div className="p-8 text-center text-gray-400">Case study not found.</div>;

    // --- JSX Render Chính ---
    return (
        <div className="p-4 md:p-6 lg:p-8 text-gray-200 overflow-x-hidden">
            {/* Nút Back */}
            <Link href="/dashboard/casestudies" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"><ArrowLeft size={20} /> Back to Case Studies</Link>

            {/* Phần Tóm tắt Case Study */}
            <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{caseStudy.title}</h1>
                <p className="text-gray-300 mb-6">{caseStudy.summary || <span className="italic text-slate-500">No summary provided.</span>}</p>
                <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
                    {/* Status Toggle */}
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className="text-gray-400" />
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-semibold ${caseStudy.status === 'Resolved' ? 'text-green-400' : 'text-yellow-400'}`}>{caseStudy.status}</span>
                        <button onClick={handleToggleStatus} disabled={isUpdatingStatus} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${caseStudy.status === 'Resolved' ? 'bg-green-500' : 'bg-slate-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${caseStudy.status === 'Resolved' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    {/* Các thông số khác */}
                    <div className="flex items-center gap-2 text-gray-400"><MessageSquare size={16} /> Total Mentions: <span className="font-semibold text-white">{caseStudy.postCount || 0}</span></div>
                    <div className="flex items-center gap-2 text-gray-400"><Clock size={16} /> Date Range: <span className="font-semibold text-white">{caseStudy.dateRange || 'N/A'}</span></div>
                </div>
            </div>

            {/* Biểu đồ */}
            {isPostsLoading && !postsData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Biểu đồ tròn Sentiment */}
                    <div className="bg-slate-800/50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><PieChart size={20} /> Sentiment Breakdown</h2>
                        <div className="h-64">
                            {sentimentData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                            {sentimentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[entry.name]} />))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            ) : (<p className='text-center text-slate-500 mt-16'>No sentiment data available for these posts.</p>)}
                        </div>
                    </div>
                    {/* Biểu đồ cột Timeline */}
                    <div className="bg-slate-800/50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={20} /> Crisis Timeline</h2>
                        <div className="h-64">
                            {timelineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={timelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                        <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} interval="auto" />
                                        <YAxis tick={{ fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                        <Bar dataKey="posts" fill="#3b82f6" />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            ) : (<p className='text-center text-slate-500 mt-16'>No timeline data available for these posts.</p>)}
                        </div>
                    </div>
                </div>
            )}


            {/* Phần Danh sách Posts */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">All Mentioned Posts</h2>
                {/* FilterBar */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in these posts..."
                    availableFields={POST_SEARCH_FIELDS}
                    activeFields={activeFields}
                    onFieldChange={handlePostSearchFieldChange}
                    platformOptions={PLATFORM_OPTIONS}
                    selectedPlatforms={selectedPlatforms}
                    onPlatformChange={handlePlatformChange}
                    sentimentOptions={SENTIMENT_OPTIONS}
                    selectedSentiments={selectedSentiments}
                    onSentimentChange={handleSentimentChange}
                />

                {/* Loading / Error / Data / Empty cho Posts */}
                {isPostsLoading && !postsData && ( // Skeleton chỉ khi load lần đầu
                    <div className="space-y-4 py-10">
                        {[...Array(POSTS_SKELETON_COUNT)].map((_, index) => (
                            <PostItemSkeleton key={index} />
                        ))}
                    </div>
                )}
                {postsError && ( // Lỗi fetch posts
                    <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                        <AlertIcon className="mx-auto h-12 w-12 text-red-400" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Posts</h3>
                        <p className="mt-1 text-sm text-red-300">{postsError.message || 'Could not load posts.'}</p>
                        <div className="mt-6">
                            <button type="button" onClick={() => mutatePosts()} className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </button>
                        </div>
                    </div>
                )}
                {/* Render danh sách posts hoặc trạng thái rỗng */}
                {!isPostsLoading && !postsError && postsData && (
                    <div className="space-y-4">
                        {posts.length > 0 ? posts.map(post => (
                            // --- Thẻ Post ---
                            <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors duration-150 overflow-hidden">
                                <div className="flex justify-between items-start gap-2 min-w-0">
                                    <div className="min-w-0 flex-1"><h3 className="font-semibold text-lg text-white mb-1 truncate" title={post.title}>{post.title}</h3></div>
                                    <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"><ExternalLink size={16} /> View Source</a>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
                                    <span>From: <span className="font-medium text-gray-300 break-words">{post.source}</span></span>
                                    {post.platform && (<span className="flex items-center gap-1.5"><Globe size={14} />Platform: <span className="font-medium text-blue-300 capitalize">{post.platform}</span></span>)}
                                </div>
                                <p className="text-gray-300 text-base line-clamp-3">{post.content}</p>
                                <div className="mt-3">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${post.sentiment === 'NEGATIVE' && 'bg-red-500/30 text-red-300'} ${post.sentiment === 'POSITIVE' && 'bg-green-500/30 text-green-300'} ${post.sentiment === 'NEUTRAL' && 'bg-gray-500/30 text-gray-300'}`}>{post.sentiment || 'N/A'}</span>
                                </div>
                            </div>
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
                                    <button onClick={() => { const params = new URLSearchParams(searchParams.toString()); params.delete('q'); params.delete('fields'); params.delete('platforms'); params.delete('sentiments'); router.push(`${pathname}?${params.toString()}`, { scroll: false }); setSearchTerm(''); }} className="mt-4 inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-600">
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- PHẦN PHÂN TRANG --- */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span className="text-sm text-gray-400">
                            Page {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}