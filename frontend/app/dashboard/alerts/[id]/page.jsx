// frontend/app/dashboard/alerts/[id]/page.jsx
'use client';

import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Tag, Globe, ShieldCheck, AlertTriangle, ExternalLink, Search, CheckCircle, AlertCircle as AlertIcon, BookOpen } from 'lucide-react';
import { api } from '@/utils/api';
import useSWR from 'swr'; // THÊM useSWR

// Các trường có thể tìm kiếm trong Post
const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source', 'Sentiment'];

// fetcher cho SWR
const fetcher = (url) => api(url.substring(5));

// Custom hook để "debounce" (giống như trang alerts)
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

export default function AlertDetailPage() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const alertId = params.id;

    // --- STATE CHO CHI TIẾT ALERT (KHÔNG THAY ĐỔI) ---
    const [alert, setAlert] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' });
    const [isCreatingCaseStudy, setIsCreatingCaseStudy] = useState(false);
    const [caseStudyStatus, setCaseStudyStatus] = useState({ type: '', text: '' });

    // --- THAY ĐỔI 1: LẤY TRẠNG THÁI TÌM KIẾM TỪ URL ---
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Lấy các trường tìm kiếm từ URL, mặc định chọn tất cả nếu không có
    const activeFields = useMemo(() => {
        const fieldsParam = searchParams.get('fields');
        if (!fieldsParam) {
            return { title: true, content: true, source: true, sentiment: true };
        }
        const urlFields = new Set(fieldsParam.split(','));
        return POST_SEARCH_FIELDS.reduce((acc, field) => {
            acc[field.toLowerCase()] = urlFields.has(field.toLowerCase());
            return acc;
        }, {});
    }, [searchParams]);

    // --- THAY ĐỔI 2: SỬ DỤNG useSWR ĐỂ FETCH POSTS ---
    // Xây dựng URL động cho API, SWR sẽ tự động fetch lại khi URL này thay đổi
    const postsApiUrl = useMemo(() => {
        if (!alertId) return null;
        const params = new URLSearchParams();
        const activeFieldKeys = Object.keys(activeFields).filter(field => activeFields[field]);

        if (debouncedSearchTerm && activeFieldKeys.length > 0) {
            params.set('search', debouncedSearchTerm);
            params.set('fields', activeFieldKeys.join(','));
        }
        // Lưu ý: Backend của bạn trong `getPostsByAlert` dùng `search`, không phải `q`
        return `/api/posts/by-alert/${alertId}?${params.toString()}`;
    }, [alertId, debouncedSearchTerm, activeFields]);

    const { data: postsData, error: postsError, isLoading: isPostsLoading, mutate: mutatePosts } = useSWR(postsApiUrl, fetcher, {
        keepPreviousData: true, // Giữ lại dữ liệu cũ trong khi tải dữ liệu mới
    });

    // Hàm fetch chi tiết alert ban đầu
    useEffect(() => {
        const fetchAlertDetail = async () => {
            if (!alertId) return;
            try {
                setIsLoading(true);
                const data = await api(`alerts/${alertId}`);
                setAlert(data);
            } catch (err) {
                setError('Failed to fetch alert details.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAlertDetail();
    }, [alertId]);

    // --- THAY ĐỔI 3: CẬP NHẬT URL KHI TÌM KIẾM ---
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const activeFieldKeys = Object.keys(activeFields).filter(field => activeFields[field]);

        if (debouncedSearchTerm) {
            params.set('q', debouncedSearchTerm); // 'q' để hiển thị trên URL
        } else {
            params.delete('q');
        }

        if (activeFieldKeys.length < POST_SEARCH_FIELDS.length) {
            params.set('fields', activeFieldKeys.join(','));
        } else {
            params.delete('fields'); // Xóa nếu tất cả được chọn
        }

        // Dùng `replace` để không tạo lịch sử trình duyệt mới
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [debouncedSearchTerm, activeFields, pathname, router]);


    // --- HANDLERS (Một số được cập nhật) ---
    const handlePostSearchFieldChange = (field) => {
        const newFields = {
            ...activeFields,
            [field.toLowerCase()]: !activeFields[field.toLowerCase()]
        };
        // Cập nhật URL trực tiếp
        const params = new URLSearchParams(searchParams.toString());
        const activeFieldKeys = Object.keys(newFields).filter(f => newFields[f]);
        if (activeFieldKeys.length < POST_SEARCH_FIELDS.length) {
            params.set('fields', activeFieldKeys.join(','));
        } else {
            params.delete('fields');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleScan = async () => {
        if (!alertId || isScanning) return;
        setIsScanning(true);
        setScanMessage({ type: '', text: '' });
        try {
            const result = await api(`alerts/${alertId}/scan`, { method: 'POST' });
            setScanMessage({ type: 'success', text: result.message });
            mutatePosts(); // Báo SWR fetch lại dữ liệu posts
        } catch (err) {
            setScanMessage({ type: 'error', text: err.message || 'Scan failed.' });
        } finally {
            setIsScanning(false);
            setTimeout(() => setScanMessage({ type: '', text: '' }), 5000);
        }
    };

    // Các handlers còn lại (toggleStatus, createCaseStudy) không thay đổi
    const handleToggleStatus = async () => {
        if (!alert || isUpdating) return;
        setIsUpdating(true);
        const newStatus = alert.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            const updatedAlert = await api(`alerts/${alert.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            setAlert(updatedAlert.alert);
        } catch (err) {
            console.error("Failed to update status:", err);
            // Rollback UI if needed, but SWR can handle this better
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCreateCaseStudy = async () => {
        if (!alert || isCreatingCaseStudy) return;
        setIsCreatingCaseStudy(true);
        setCaseStudyStatus({ type: 'info', text: 'Creating Case Study...' });
        try {
            const payload = { alertId: alert.id, title: `Case Study: ${alert.title}`, description: `Analysis for: ${alert.title}`, sourceAlert: alert };
            await api(`casestudies`, { method: 'POST', body: JSON.stringify(payload) });
            setCaseStudyStatus({ type: 'success', text: 'Case Study created! Redirecting...' });
            setTimeout(() => router.push('/dashboard/casestudies'), 1500);
        } catch (err) {
            setCaseStudyStatus({ type: 'error', text: err.message || 'Failed to create Case Study.' });
        } finally {
            setIsCreatingCaseStudy(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Loading alert details...</div>;
    if (error) return <p className="p-8 text-red-400">{error}</p>;
    if (!alert) return null;

    return (
        <div className="p-4 md:p-8 text-gray-200">
            {/* Phần tiêu đề và chi tiết Alert (giữ nguyên) */}
            <Link href="/dashboard/alerts" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
                <ArrowLeft size={20} />
                Back to All Alerts
            </Link>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">{alert.title}</h1>
                <button onClick={handleCreateCaseStudy} disabled={isCreatingCaseStudy} className="flex-shrink-0 flex items-center gap-2 px-6 py-2 text-base font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-500">
                    {isCreatingCaseStudy ? 'Creating...' : <><BookOpen size={20} /> Create Case Study</>}
                </button>
            </div>
            {caseStudyStatus.text && (
                <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${caseStudyStatus.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {caseStudyStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertIcon size={18} />}
                    <span>{caseStudyStatus.text}</span>
                </div>
            )}
            <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg">
                <p className="text-gray-400 mb-6">{alert.description}</p>
                <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Status</p>
                            <span className={`font-semibold ${alert.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-500'}`}>{alert.status}</span>
                        </div>
                        <button onClick={handleToggleStatus} disabled={isUpdating} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${alert.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${alert.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Severity</p>
                            <span className={`font-semibold ${alert.severity === 'Critical' && 'text-red-400'} ${alert.severity === 'High' && 'text-orange-400'} ${alert.severity === 'Medium' && 'text-yellow-400'} ${alert.severity === 'Low' && 'text-green-400'}`}>{alert.severity}</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Tag size={20} /> Keywords</h2>
                        <div className="flex flex-wrap gap-2">{alert.keywords.map(kw => (<span key={kw} className="bg-slate-700 text-gray-300 px-3 py-1 rounded-full text-sm">{kw}</span>))}</div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Globe size={20} /> Platforms</h2>
                        <div className="flex flex-wrap gap-2">{alert.platforms.map(p => (<span key={p} className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm">{p}</span>))}</div>
                    </div>
                </div>
            </div>

            {/* PHẦN HIỂN THỊ POSTS */}
            <div className="mt-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Mentioned Posts</h2>
                    <button onClick={handleScan} disabled={isScanning || alert.status !== 'ACTIVE'} className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-500">
                        <Search size={16} />
                        {isScanning ? 'Scanning...' : 'Scan For Posts'}
                    </button>
                </div>
                {scanMessage.text && (
                    <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${scanMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {scanMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertIcon size={18} />}
                        <span>{scanMessage.text}</span>
                    </div>
                )}

                {/* --- KHUNG TÌM KIẾM ĐÃ CẬP NHẬT --- */}
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search in mentioned posts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} // Cập nhật state, debounce và useEffect sẽ lo phần còn lại
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-slate-300">
                        <span>Search in:</span>
                        {POST_SEARCH_FIELDS.map(field => (
                            <label key={field} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFields[field.toLowerCase()]}
                                    onChange={() => handlePostSearchFieldChange(field)}
                                    className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500"
                                />
                                {field}
                            </label>
                        ))}
                    </div>
                </div>

                {/* --- HIỂN THỊ KẾT QUẢ TỪ SWR --- */}
                {isPostsLoading && <p className="text-gray-400">Loading posts...</p>}
                {postsError && <p className="text-red-400">Failed to load posts.</p>}
                {postsData && (
                    <div className="space-y-4">
                        {postsData.posts.length > 0 ? postsData.posts.map(post => (
                            <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-lg text-white mb-1">{post.title}</h3>
                                    <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 ml-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                                        View Source <ExternalLink size={16} />
                                    </a>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">From: <span className="font-medium text-gray-300">{post.source}</span></p>
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
                        )) : (
                            <div className="bg-slate-800/50 p-6 rounded-lg text-center text-gray-500">
                                <p>No mentioned posts found for this alert, or none match your search criteria.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}