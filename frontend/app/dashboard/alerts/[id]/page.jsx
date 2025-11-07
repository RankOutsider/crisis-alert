// frontend/app/dashboard/alerts/[id]/page.jsx
'use client';

// --- Imports ---
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
    ArrowLeft, Tag, Globe, ShieldCheck, AlertTriangle, ExternalLink, Search,
    CheckCircle, AlertCircle as AlertIcon, BookOpen, RefreshCw,
    ChevronLeft, ChevronRight // <-- Thêm icon phân trang
} from 'lucide-react';
import { api, fetcher } from '@/utils/api';
// Bỏ import biểu đồ vì file này không dùng
import FilterBar from '@/app/components/FilterBar';

// --- Hằng số ---
const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source'];
const PLATFORM_OPTIONS = ['Facebook', 'X', 'Instagram', 'News', 'Tiktok', 'Forum', 'Threads', 'Youtube', 'Blog'];
const SENTIMENT_OPTIONS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];
const POSTS_SKELETON_COUNT = 5; // Số lượng skeleton cho post list
const ITEMS_PER_PAGE = 5; // <-- Số lượng post trên mỗi trang (khớp với limit backend)

// --- useDebounce Hook ---
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

// --- Skeleton cho Tóm tắt Alert ---
function AlertSummarySkeleton() {
    return (
        <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg mb-8 animate-pulse">
            {/* Skeleton Mô tả */}
            <div className="space-y-2 mb-6">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            </div>
            {/* Skeleton Stats */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8">
                <div className="h-6 bg-slate-700 rounded w-36"></div> {/* Status */}
                <div className="h-6 bg-slate-700 rounded w-28"></div> {/* Severity */}
            </div>
            {/* Skeleton Keywords/Platforms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
                    <div className="flex flex-wrap gap-2">
                        <div className="h-5 bg-slate-700 rounded-full w-20"></div>
                        <div className="h-5 bg-slate-700 rounded-full w-16"></div>
                        <div className="h-5 bg-slate-700 rounded-full w-24"></div>
                    </div>
                </div>
                <div>
                    <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
                    <div className="flex flex-wrap gap-2">
                        <div className="h-5 bg-slate-700 rounded-full w-20"></div>
                        <div className="h-5 bg-slate-700 rounded-full w-24"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Skeleton cho mục Post ---
function PostItemSkeleton() {
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start gap-4 mb-2">
                <div className="h-6 bg-slate-700 rounded w-3/5"></div> {/* Title */}
                <div className="h-4 bg-slate-700 rounded w-1/5"></div> {/* Link */}
            </div>
            {/* Meta Skeleton */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-2">
                <div className="h-4 bg-slate-700 rounded w-1/4"></div> {/* Source */}
                <div className="h-4 bg-slate-700 rounded w-1/3"></div> {/* Platform */}
            </div>
            {/* Content Skeleton */}
            <div className="space-y-2">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-4/5"></div>
            </div>
            {/* Sentiment Skeleton */}
            <div className="mt-3">
                <div className="h-5 bg-slate-700 rounded-full w-20"></div>
            </div>
        </div>
    );
}


// --- Component Chính ---
export default function AlertDetailPage() {
    // --- Hooks ---
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const alertId = params.id;

    // --- State ---
    const [isUpdating, setIsUpdating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' });
    const [isCreatingCaseStudy, setIsCreatingCaseStudy] = useState(false);
    const [caseStudyStatus, setCaseStudyStatus] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(1); // <-- State trang cho posts

    // --- Derived State from URL (Tính toán state từ URL cho FilterBar) ---
    const activeFields = useMemo(() => {
        const fieldsParam = searchParams.get('fields');
        if (fieldsParam === null) { return { title: true, content: true, source: true }; }
        if (fieldsParam === '') { return { title: false, content: false, source: false }; }
        const urlFields = new Set(fieldsParam.split(','));
        return {
            title: urlFields.has('title'),
            content: urlFields.has('content'),
            source: urlFields.has('source'),
        };
    }, [searchParams]);
    const selectedPlatforms = useMemo(() => searchParams.get('platforms')?.split(',').filter(Boolean) || [], [searchParams]);
    const selectedSentiments = useMemo(() => searchParams.get('sentiments')?.split(',').filter(Boolean) || [], [searchParams]);

    // --- API URL Construction (Tính toán URL API cho SWR) ---
    const alertApiUrl = useMemo(() => alertId ? `/api/alerts/${alertId}` : null, [alertId]);

    // URL để fetch danh sách Posts (ĐÃ CẬP NHẬT)
    const postsApiUrl = useMemo(() => {
        if (!alertId) return null;
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
        return `/api/posts/by-alert/${alertId}?${params.toString()}`;
    }, [alertId, debouncedSearchTerm, activeFields, searchParams, currentPage]); // <-- Thêm currentPage

    // --- Data Fetching (Lấy dữ liệu bằng SWR) ---
    const { data: alertData, error: alertError, isLoading: isAlertLoading, mutate: mutateAlert } = useSWR(alertApiUrl, fetcher);
    const alert = alertData;
    const { data: postsData, error: postsError, isLoading: isPostsLoading, mutate: mutatePosts } = useSWR(postsApiUrl, fetcher, { keepPreviousData: true });
    const posts = postsData?.posts || [];
    const totalPages = postsData?.totalPages || 1; // <-- Lấy totalPages

    // --- useEffects ---
    useEffect(() => {
        const searchTermFromUrl = searchParams.get('q') || '';
        if (searchTermFromUrl !== searchTerm) { setSearchTerm(searchTermFromUrl); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentQ = params.get('q') || '';
        if (debouncedSearchTerm !== currentQ) {
            if (debouncedSearchTerm) { params.set('q', debouncedSearchTerm); } else { params.delete('q'); }
            setCurrentPage(1); // <-- Reset trang 1 khi search
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearchTerm, pathname, router, searchParams]);


    // --- HANDLERS (Các hàm xử lý sự kiện) ---
    const handlePostSearchFieldChange = (field) => {
        setCurrentPage(1); // <-- Reset trang 1
        const fieldKey = field.toLowerCase(); const newFieldsState = { ...activeFields, [fieldKey]: !activeFields[fieldKey] }; const activeFieldKeys = Object.keys(newFieldsState).filter(f => newFieldsState[f]); const params = new URLSearchParams(searchParams.toString()); if (activeFieldKeys.length === POST_SEARCH_FIELDS.length) { params.delete('fields'); } else { params.set('fields', activeFieldKeys.join(',')); } router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handlePlatformChange = (newSelection) => {
        setCurrentPage(1); // <-- Reset trang 1
        const params = new URLSearchParams(searchParams.toString()); if (newSelection.length > 0) { params.set('platforms', newSelection.join(',')); } else { params.delete('platforms'); } router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleSentimentChange = (newSelection) => {
        setCurrentPage(1); // <-- Reset trang 1
        const params = new URLSearchParams(searchParams.toString()); if (newSelection.length > 0) { params.set('sentiments', newSelection.join(',')); } else { params.delete('sentiments'); } router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleScan = async () => {
        if (!alertId || isScanning) return;

        setIsScanning(true);
        setScanMessage({ type: '', text: '' });

        try {
            const result = await api(`alerts/${alertId}/scan`, { method: 'POST' });
            setScanMessage({
                type: 'success',
                text: result.message || 'Scan completed!',
            });
            mutatePosts();
            mutateAlert();
        } catch (err) {
            setScanMessage({
                type: 'error',
                text: err.message || 'Scan failed.',
            });
        } finally {
            setIsScanning(false);
            setTimeout(() => setScanMessage({ type: '', text: '' }), 5000);
        }
    };

    const handleToggleStatus = async () => {
        if (!alert || isUpdating) return;

        setIsUpdating(true);
        const newStatus = alert.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        try {
            await api(`alerts/${alert.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            mutateAlert();
        } catch (err) {
            console.error("Failed to update status:", err);
            mutateAlert();
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCreateCaseStudy = async () => {
        if (!alert || isCreatingCaseStudy) return;

        setIsCreatingCaseStudy(true);
        setCaseStudyStatus({ type: 'info', text: 'Creating Case Study...' });

        try {
            const payload = {
                alertId: alert.id,
                title: `${alert.title}`,
                description: alert.description || `Analysis for: ${alert.title}`,
            };

            await api(`casestudies`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setCaseStudyStatus({
                type: 'success',
                text: 'Case Study created! Redirecting...',
            });

            setTimeout(() => router.push('/dashboard/casestudies'), 1500);
        } catch (err) {
            const message =
                err.errors?.[0]?.msg || err.message || 'Failed to create Case Study.';
            setCaseStudyStatus({ type: 'error', text: message });
            setTimeout(() => setCaseStudyStatus({ type: '', text: '' }), 5000);
        } finally {
            setIsCreatingCaseStudy(false);
        }
    };

    // --- Xử lý Loading/Error ban đầu cho chi tiết Alert ---
    if (isAlertLoading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 text-gray-200 overflow-x-hidden">
                {/* Skeleton nút back */}
                <div className="h-6 bg-slate-700 rounded w-40 mb-6 animate-pulse"></div>
                {/* Skeleton Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 animate-pulse">
                    <div className="h-10 bg-slate-700 rounded w-1/2"></div> {/* Title */}
                    <div className="h-11 bg-slate-700 rounded-full w-48"></div> {/* Button */}
                </div>
                {/* Skeleton tóm tắt */}
                <AlertSummarySkeleton />
                {/* Skeleton khu vực posts */}
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
    // Lỗi fetch alert
    if (alertError) {
        return (
            <div className="p-8 text-center">
                <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10 max-w-lg mx-auto">
                    <AlertIcon className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Alert Details</h3>
                    <p className="mt-1 text-sm text-red-300">{alertError.message || 'Could not load alert details.'}</p>
                    <div className="mt-6">
                        <button type="button" onClick={() => mutateAlert()} className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    // Không tìm thấy alert
    if (!alert) return <div className="p-8 text-center text-gray-400">Alert not found.</div>;

    // --- JSX Render Chính (Khi đã có Alert data) ---
    return (
        <div className="p-4 md:p-6 lg:p-8 text-gray-200 overflow-x-hidden">
            {/* Nút Back */}
            <Link href="/dashboard/alerts" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
                <ArrowLeft size={20} />
                Back to All Alerts
            </Link>

            {/* Header: Title và Nút Create Case Study */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">{alert.title}</h1>
                <button onClick={handleCreateCaseStudy} disabled={isCreatingCaseStudy} className="flex-shrink-0 flex items-center gap-2 px-6 py-2 text-base font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isCreatingCaseStudy ? 'Creating...' : <><BookOpen size={20} /> Create Case Study</>}
                </button>
            </div>
            {/* Thông báo trạng thái tạo Case Study */}
            {caseStudyStatus.text && (
                <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${caseStudyStatus.type === 'success' ? 'bg-green-500/20 text-green-300' : caseStudyStatus.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {caseStudyStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertIcon size={18} />}
                    <span>{caseStudyStatus.text}</span>
                </div>
            )}

            {/* Phần hiển thị chi tiết Alert */}
            <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg mb-8">
                <p className="text-gray-400 mb-6">{alert.description || <span className="italic text-slate-500">No description provided.</span>}</p>
                {/* Status và Severity */}
                <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8">
                    {/* Status Toggle */}
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Status</p>
                            <span className={`font-semibold ${alert.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-500'}`}>{alert.status}</span>
                        </div>
                        <button onClick={handleToggleStatus} disabled={isUpdating} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 ${alert.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${alert.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    {/* Severity */}
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Severity</p>
                            <span className={`font-semibold ${alert.severity === 'Critical' && 'text-red-400'} ${alert.severity === 'High' && 'text-orange-400'} ${alert.severity === 'Medium' && 'text-yellow-400'} ${alert.severity === 'Low' && 'text-green-400'}`}>{alert.severity}</span>
                        </div>
                    </div>
                </div>
                {/* Keywords & Platforms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Tag size={20} /> Keywords</h2>
                        <div className="flex flex-wrap gap-2">{alert.keywords?.length > 0 ? alert.keywords.map(kw => (<span key={kw} className="bg-slate-700 text-gray-300 px-3 py-1 rounded-full text-sm">{kw}</span>)) : <span className="italic text-slate-500">No keywords specified.</span>}</div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Globe size={20} /> Platforms</h2>
                        <div className="flex flex-wrap gap-2">{alert.platforms?.length > 0 ? alert.platforms.map(p => (<span key={p} className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm">{p}</span>)) : <span className="italic text-slate-500">No platforms specified.</span>}</div>
                    </div>
                </div>
            </div>

            {/* Phần hiển thị danh sách Posts */}
            <div className="mt-8">
                {/* Header và Nút Scan */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                    <h2 className="text-2xl font-bold text-white">Mentioned Posts</h2>
                    <button onClick={handleScan} disabled={isScanning || alert.status !== 'ACTIVE'} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Search size={16} />
                        {isScanning ? 'Scanning...' : (alert.status !== 'ACTIVE' ? 'Alert must be active to scan' : 'Scan For Posts')}
                    </button>
                </div>
                {/* Thông báo kết quả Scan */}
                {scanMessage.text && (
                    <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${scanMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {scanMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertIcon size={18} />}
                        <span>{scanMessage.text}</span>
                    </div>
                )}

                {/* Thanh Filter cho Posts */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in mentioned posts..."
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
                {isPostsLoading && !postsData && (
                    <div className="space-y-4 py-10">
                        {[...Array(POSTS_SKELETON_COUNT)].map((_, index) => (
                            <PostItemSkeleton key={index} />
                        ))}
                    </div>
                )}
                {postsError && (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                        <AlertIcon className="mx-auto h-12 w-12 text-red-400" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Posts</h3>
                        <p className="mt-1 text-sm text-red-300">{postsError.message || 'Could not load posts for this alert.'}</p>
                        <div className="mt-6">
                            <button type="button" onClick={() => mutatePosts()} className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </button>
                        </div>
                    </div>
                )}
                {/* Render danh sách posts hoặc trạng thái rỗng */}
                {!isPostsLoading && !postsError && (
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
                                        ? "No posts associated with this alert match your current filters."
                                        : "No posts have been linked to this alert yet. Try scanning for posts."
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