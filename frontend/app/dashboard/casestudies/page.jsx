// frontend/app/dashboard/casestudies/page.jsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import {
    BarChart3, Clock, MessageSquare, ExternalLink, Search,
    ChevronLeft, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { fetcher } from '@/utils/api';
import FilterBar from '@/app/components/FilterBar';

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

export default function CaseStudiesPage() {
    // Hooks
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State
    const searchTermFromUrl = searchParams.get('q') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTermFromUrl);
    const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

    // --- 2. TÍNH TOÁN activeFields TỪ URL ---
    // (Cần cho FilterBar)
    const activeFields = useMemo(() => {
        const fieldsParam = searchParams.get('fields');
        // Mặc định là true nếu param không tồn tại
        if (fieldsParam === null) {
            return { title: true, summary: true };
        }
        // False hết nếu param là chuỗi rỗng
        if (fieldsParam === '') {
            return { title: false, summary: false };
        }
        // Parse từ chuỗi
        const urlFields = new Set(fieldsParam.split(','));
        return {
            title: urlFields.has('title'),
            summary: urlFields.has('summary'),
        };
    }, [searchParams]);

    // API URL Construction (Giữ nguyên logic SWR)
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams(searchParams.toString());
        // Đảm bảo page là số
        params.set('page', currentPage.toString());

        const fieldsParam = searchParams.get('fields');
        const fields = (fieldsParam === null) ? 'title,summary' : fieldsParam;

        // Xóa các param cũ liên quan đến search
        params.delete('q');
        params.delete('fields');
        params.delete('search');

        // Thêm search/fields nếu có term và fields được chọn
        if (debouncedSearchTerm && fields) {
            params.set('search', debouncedSearchTerm);
            params.set('fields', fields);
        }

        return `/api/casestudies?${params.toString()}`;
    }, [debouncedSearchTerm, currentPage, searchParams]);

    // Data Fetching (Thêm mutate)
    const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, { keepPreviousData: true });

    // --- Process SWR Data ---
    const caseStudies = data?.caseStudies || [];
    const totalPages = data?.totalPages || 1;

    // useEffects Đồng bộ State <-> URL
    useEffect(() => {
        // Đồng bộ Debounce -> URL param 'q'
        const params = new URLSearchParams(searchParams.toString());
        const currentUrlQuery = params.get('q') || '';
        if (debouncedSearchTerm !== currentUrlQuery) {
            if (debouncedSearchTerm) {
                params.set('q', debouncedSearchTerm);
            } else {
                params.delete('q');
            }
            params.delete('page'); // Reset về trang 1
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearchTerm, pathname, router, searchParams]);

    useEffect(() => {
        // Đồng bộ URL param 'q' -> State localSearchTerm
        const currentSearchTermFromUrl = searchParams.get('q') || '';
        if (currentSearchTermFromUrl !== localSearchTerm) {
            setLocalSearchTerm(currentSearchTermFromUrl);
        }
        // Đồng bộ URL param 'page' -> State currentPage (nếu cần, nhưng thường dùng trực tiếp từ searchParams)
        const currentPageFromUrl = parseInt(searchParams.get('page') || '1', 10);
        // setCurrentPage(currentPageFromUrl); // Bỏ dòng này nếu dùng currentPage trực tiếp từ URL
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]); // Chạy khi URL thay đổi


    // --- 3. THÊM HANDLER CHO CHECKBOX ---
    // (Cần cho FilterBar)
    const handleFieldChange = (field) => { // field là 'Title' hoặc 'Summary'
        const fieldKey = field.toLowerCase();
        // Tính toán trạng thái mới
        const newFieldsState = { ...activeFields, [fieldKey]: !activeFields[fieldKey] };
        // Lấy các key đang active
        const activeFieldKeys = Object.keys(newFieldsState).filter(f => newFieldsState[f]);

        const params = new URLSearchParams(searchParams.toString());
        // Cập nhật URL param 'fields'
        if (activeFieldKeys.length === CASE_STUDY_SEARCH_FIELDS.length) {
            params.delete('fields'); // Xóa nếu tất cả được chọn (mặc định)
        } else {
            params.set('fields', activeFieldKeys.join(',')); // Set chuỗi rỗng nếu không có gì được chọn
        }
        params.delete('page'); // Reset về trang 1
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };


    // Handler cho phân trang (Cập nhật currentPage từ URL)
    const handlePageChange = (newPage) => {
        // Đảm bảo newPage nằm trong giới hạn
        if (newPage >= 1 && newPage <= totalPages) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', newPage.toString()); // Cập nhật tham số 'page' trên URL
            router.push(`${pathname}?${params.toString()}`, { scroll: false }); // Điều hướng tới URL mới
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 overflow-x-hidden"> {/* Thêm overflow-x-hidden */}
            <h1 className="text-3xl font-bold text-white mb-2">Case Studies</h1>
            <p className="text-gray-300 mb-8">Analyze important alert cases and their impact.</p>

            {/* --- Sử dụng FilterBar --- */}
            <FilterBar
                searchTerm={localSearchTerm}
                onSearchChange={(e) => setLocalSearchTerm(e.target.value)}
                placeholder="Search by Title or Summary..."

                availableFields={CASE_STUDY_SEARCH_FIELDS} // ['Title', 'Summary']
                activeFields={activeFields} // State tính từ URL
                onFieldChange={handleFieldChange} // Handler mới

            // Không có dropdown cho trang này
            />
            {/* --- Hết FilterBar --- */}


            {/* Hiển thị nội dung */}
            {/* Loading State */}
            {isLoading && !data && (
                <p className="text-center text-gray-400 py-10">Loading case studies...</p>
                // Có thể thêm Skeleton Loader ở đây
            )}
            {/* Error State */}
            {error && (
                <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Data</h3>
                    <p className="mt-1 text-sm text-red-300">{error.message || 'Could not load case studies.'}</p>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => mutate()} // Trigger SWR retry
                            className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </button>
                    </div>
                </div>
            )}
            {/* Data / Empty State */}
            {!isLoading && !error && data && (
                <>
                    {/* Danh sách Case Studies */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {caseStudies.length > 0 ? (caseStudies.map((study) => (
                            // --- Card Case Study ---
                            <div key={study.id} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col hover:border-blue-500 transition-colors overflow-hidden">
                                <div className="flex justify-between items-start mb-3 gap-2">
                                    <h2 className="text-xl font-bold text-white truncate flex-1 min-w-0" title={study.title}>{study.title}</h2>
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${study.status === 'Resolved' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                        {study.status}
                                    </span>
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
                            // --- Hết Card ---
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
                            // --- Hết Empty State ---
                        )}
                    </div>

                    {/* --- PHẦN PHÂN TRANG ĐẦY ĐỦ --- */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)} // Dùng currentPage từ URL
                                disabled={currentPage === 1} // Dùng currentPage từ URL
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed" // Thêm disabled:cursor-not-allowed
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span> {/* Dùng currentPage từ URL */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)} // Dùng currentPage từ URL
                                disabled={currentPage === totalPages} // Dùng currentPage từ URL
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed" // Thêm disabled:cursor-not-allowed
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}