'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import {
    BarChart3, Clock, MessageSquare, ExternalLink, Search,
    ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Trash2,
    CheckCircle2, ShieldAlert, X,
    Lock
} from 'lucide-react';
import { api, fetcher } from '@/utils/api';
import FilterBar from '@/app/components/FilterBar';
import Modal from '@/app/components/Modal';
import { useAuth } from '@/app/providers.jsx';

// HOOK useDebounce
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// Hằng số
const CASE_STUDY_SEARCH_FIELDS = ['Title', 'Summary'];
const ITEMS_PER_PAGE = 6; // Số skeleton cards

export default function CaseStudiesPage() {
    // Hooks
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // --- Lấy thông tin User ---
    const { user, isLoading: isAuthLoading } = useAuth();
    const isFreeTier = user && user.subscriptionTier === 'Free';

    // State
    const searchTermFromUrl = searchParams.get('q') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTermFromUrl);
    const debouncedSearchTerm = useDebounce(localSearchTerm, 500);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // --- activeFields ---
    const activeFields = useMemo(() => {
        const fieldsParam = searchParams.get('fields');
        if (fieldsParam === null) return { title: true, summary: true };
        if (fieldsParam === '') return { title: false, summary: false };
        const urlFields = new Set(fieldsParam.split(','));
        return {
            title: urlFields.has('title'),
            summary: urlFields.has('summary'),
        };
    }, [searchParams]);

    // API URL Construction
    const apiUrl = useMemo(() => {
        // --- CẬP NHẬT: Không gọi API nếu là Free hoặc đang chờ Auth ---
        if (isAuthLoading) return null; // Chờ biết user là ai
        if (isFreeTier) return null; // Không fetch nếu là free

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', currentPage.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());

        const fieldsParam = searchParams.get('fields');
        const fields = (fieldsParam === null) ? 'title,summary' : fieldsParam;

        params.delete('q');
        params.delete('fields');
        params.delete('search');

        if (debouncedSearchTerm && fields) {
            params.set('search', debouncedSearchTerm);
            params.set('fields', fields);
        }

        return `/api/casestudies?${params.toString()}`;
    }, [debouncedSearchTerm, currentPage, searchParams, isAuthLoading, isFreeTier]); // <-- Thêm dependencies

    // Data Fetching
    const { data, error, isLoading: isLoadingSWR, mutate } = useSWR(apiUrl, fetcher, { keepPreviousData: true });

    // --- CẬP NHẬT: Logic loading tổng ---
    const isLoading = (isLoadingSWR && !data) || (isAuthLoading && !data);

    // --- Process SWR Data ---
    const caseStudies = data?.caseStudies || [];
    const totalPages = data?.totalPages || 1;

    // useEffects
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentUrlQuery = params.get('q') || '';
        if (debouncedSearchTerm !== currentUrlQuery) {
            if (debouncedSearchTerm) { params.set('q', debouncedSearchTerm); } else { params.delete('q'); }
            params.delete('page');
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearchTerm, pathname, router, searchParams]);

    useEffect(() => {
        const currentSearchTermFromUrl = searchParams.get('q') || '';
        if (currentSearchTermFromUrl !== localSearchTerm) { setLocalSearchTerm(currentSearchTermFromUrl); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);


    // --- Handlers ---
    const handleFieldChange = (field) => {
        const fieldKey = field.toLowerCase();
        const newFieldsState = { ...activeFields, [fieldKey]: !activeFields[fieldKey] };
        const activeFieldKeys = Object.keys(newFieldsState).filter(f => newFieldsState[f]);
        const params = new URLSearchParams(searchParams.toString());
        if (activeFieldKeys.length === CASE_STUDY_SEARCH_FIELDS.length) { params.delete('fields'); } else { params.set('fields', activeFieldKeys.join(',')); }
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', newPage.toString());
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    };

    const handleDeleteCaseStudy = async () => {
        if (!confirmDeleteId || isDeleting) return;
        setIsDeleting(true);
        try {
            await api(`casestudies/${confirmDeleteId}`, { method: 'DELETE' });
            setConfirmDeleteId(null);
            mutate();
            setNotification({ message: 'Case study deleted successfully.', type: 'success' });
        } catch (err) {
            console.error('Error deleting case study:', err);
            setNotification({ message: 'Error deleting case study. Please try again.', type: 'error' });
            setConfirmDeleteId(null);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 overflow-x-hidden">
            <h1 className="text-3xl font-bold text-white mb-2">Case Studies</h1>
            <p className="text-gray-300 mb-8">Analyze important alert cases and their impact.</p>

            {/* --- FilterBar --- */}
            <FilterBar
                searchTerm={localSearchTerm}
                onSearchChange={(e) => setLocalSearchTerm(e.target.value)}
                placeholder="Search by Title or Summary..."
                availableFields={CASE_STUDY_SEARCH_FIELDS}
                activeFields={activeFields}
                onFieldChange={handleFieldChange}
                // CẬP NHẬT: Vô hiệu hoá thanh search nếu bị khoá
                disabled={isFreeTier}
            />

            {/* --- 
            CẬP NHẬT LOGIC RENDER CHÍNH 
            Hiển thị 1 trong 4 trạng thái: Loading, Locked, Error, Data
            --- 
            */}

            {/* --- 1. Loading State (Skeleton) --- */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-10">
                    {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
                        <CaseStudyCardSkeleton key={index} />
                    ))}
                </div>
            ) :

                /* --- 2. Trạng thái Bị Khóa (Free Tier) --- */
                isFreeTier ? (
                    <div className="text-center py-16 px-4 border-2 border-dashed border-yellow-900/50 rounded-lg bg-yellow-900/10 mt-6">
                        <Lock className="mx-auto h-12 w-12 text-yellow-400" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Feature Locked</h3>
                        <p className="mt-1 text-sm text-yellow-300">
                            Case Study generation and analysis are available for VIP and Pro users.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/buy"
                                className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-600 hover:to-cyan-600"
                            >
                                Upgrade Your Plan
                            </Link>
                        </div>
                    </div>
                ) :

                    /* --- 3. Error State (Chỉ cho user trả phí nếu API lỗi) --- */
                    error ? (
                        <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10 mt-6">
                            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                            <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Data</h3>
                            <p className="mt-1 text-sm text-red-300">{error.message || 'Could not load case studies.'}</p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => mutate()}
                                    className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) :

                        /* --- 4. Data / Empty State (Chỉ cho user trả phí) --- */
                        (data) && (
                            <>
                                {/* Danh sách Case Studies */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                    {caseStudies.length > 0 ? (caseStudies.map((study) => (
                                        // --- Card Case Study ---
                                        <div key={study.id} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col hover:border-blue-500 transition-colors overflow-hidden">
                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                <Link href={`/dashboard/casestudies/${study.id}`} className="block flex-1 min-w-0 group">
                                                    <h2 className="text-xl font-bold text-white truncate group-hover:text-blue-400 transition-colors" title={study.title}>{study.title}</h2>
                                                </Link>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${study.status === 'Resolved' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                                        {study.status}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(study.id); }}
                                                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                                        title="Delete Case Study"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-3">{study.summary}</p>
                                            <div className="border-t border-slate-700 pt-4 space-y-2 text-sm">
                                                <div className="flex justify-between text-gray-400"><span className="flex items-center gap-2"><MessageSquare size={16} /> Total Mentions:</span><span className="font-semibold text-white">{study.postCount || 0}</span></div>
                                                <div className="flex justify-between text-gray-400"><span className="flex items-center gap-2"><Clock size={16} /> Date Range:</span><span className="font-semibold text-white">{study.dateRange || 'N/A'}</span></div>
                                            </div>
                                            <Link href={`/dashboard/casestudies/${study.id}`} className="mt-6 w-full text-center px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                                View Analysis <ExternalLink size={16} />
                                            </Link>
                                        </div>
                                    ))) : (
                                        // --- Empty State ---
                                        <div className="md:col-span-2 lg:col-span-3 text-center py-16 px-4 border-2 border-dashed border-slate-700 rounded-lg">
                                            <BarChart3 className="mx-auto h-12 w-12 text-slate-500" />
                                            <h3 className="mt-2 text-lg font-semibold text-white">No Case Studies Found</h3>
                                            <p className="mt-1 text-sm text-slate-400">
                                                {localSearchTerm
                                                    ? "No case studies match your search term."
                                                    : "You haven't created any case studies yet."
                                                }
                                            </p>
                                            {localSearchTerm && (
                                                <button
                                                    onClick={() => setLocalSearchTerm('')}
                                                    className="mt-4 inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-600"
                                                >
                                                    Clear Search
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* --- Phân trang --- */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-4 mt-8">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft size={16} /> Previous
                                        </button>
                                        <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

            {/* --- Modals and Toast --- */}
            <Modal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Confirm Delete Case Study"
                footer={
                    <div>
                        <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 font-semibold rounded-full bg-slate-600 hover:bg-slate-700 transition-all mr-2"
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteCaseStudy}
                            className="px-4 py-2 font-semibold rounded-full text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                }
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-500/20">
                        <AlertCircle size={24} className="text-red-400" />
                    </div>
                    <div className="flex-grow">
                        <p className="text-slate-300 mt-1 text-sm">
                            Are you sure you want to delete this case study?
                        </p>
                        <p className="text-slate-400 mt-2 text-xs">
                            This will only delete the analysis and its link to the posts. The original posts will not be deleted.
                        </p>
                    </div>
                </div>
            </Modal>

            {notification.message && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ message: '', type: '' })}
                />
            )}
        </div>
    );
}

// --- Toast Component ---
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => { onClose(); }, 5000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 text-sm sm:text-base ${type === 'success' ? 'bg-green-600/90 text-white' : 'bg-red-600/90 text-white'} animate-fadeIn`}
        >
            {type === 'success' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-75">
                <X size={16} />
            </button>
        </div>
    );
}

// --- Skeleton Component ---
function CaseStudyCardSkeleton() {
    return (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col animate-pulse overflow-hidden">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start mb-3 gap-2">
                <div className="h-6 bg-slate-700 rounded w-3/5"></div> {/* Title */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="h-6 bg-slate-700 rounded-full w-16"></div> {/* Status */}
                    <div className="h-6 w-6 bg-slate-700 rounded-full"></div> {/* Delete */}
                </div>
            </div>
            {/* Summary Skeleton */}
            <div className="space-y-2 mb-4 flex-grow">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            </div>
            {/* Stats Skeleton */}
            <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between">
                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                </div>
                <div className="flex justify-between">
                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                </div>
            </div>
            {/* Button Skeleton */}
            <div className="mt-6 h-10 bg-slate-700 rounded-full w-full"></div>
        </div>
    );
}