// frontend/app/dashboard/casestudies/page.jsx
'use client';

import { useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { BarChart3, Clock, MessageSquare, ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/utils/api';

// fetcher cho SWR
const fetcher = (url) => api(url.substring(5)); // Bỏ tiền tố '/api/'

const CASE_STUDY_SEARCH_FIELDS = ['Title', 'Summary'];

export default function CaseStudiesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Lấy state từ URL
    const searchTerm = searchParams.get('q') || '';
    const currentPage = searchParams.get('page') || '1';

    // Xây dựng URL cho SWR để tự động fetch data khi params thay đổi
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', currentPage);
        if (searchTerm) {
            params.set('search', searchTerm);
            // Mặc định tìm kiếm trong tất cả các trường
            params.set('fields', CASE_STUDY_SEARCH_FIELDS.join(',').toLowerCase());
        }
        return `/api/casestudies?${params.toString()}`;
    }, [searchTerm, currentPage]);

    const { data, error, isLoading } = useSWR(apiUrl, fetcher, { keepPreviousData: true });

    // Handler để cập nhật URL khi tìm kiếm
    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        params.set('q', newSearchTerm);
        params.delete('page'); // QUAN TRỌNG: Reset về trang 1 khi tìm kiếm
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Handler cho phân trang
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= (data?.totalPages || 1)) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', newPage);
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    };

    return (
        <div className="overflow-x-hidden">
            <h1 className="text-3xl font-bold text-white mb-2">Case Studies</h1>
            <p className="text-gray-300 mb-8">Analyze important alert cases and their impact.</p>

            {/* Thanh tìm kiếm */}
            <div className="bg-slate-800/50 p-4 rounded-lg mb-8">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Search by Title or Summary..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* Hiển thị nội dung */}
            {isLoading && <p className="text-center text-gray-400">Loading case studies...</p>}
            {error && <p className="text-center text-red-400">Failed to fetch case studies.</p>}
            {data && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.caseStudies?.map((study) => (
                            <div key={study.id} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col hover:border-blue-500 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="text-xl font-bold text-white">{study.title}</h2>
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${study.status === 'Resolved' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                        {study.status}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm mb-4 flex-grow">{study.summary}</p>
                                <div className="border-t border-slate-700 pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-400"><span className="flex items-center gap-2"><MessageSquare size={16} /> Total Mentions:</span><span className="font-semibold text-white">{study.postCount || 0}</span></div>
                                    <div className="flex justify-between text-gray-400"><span className="flex items-center gap-2"><Clock size={16} /> Date Range:</span><span className="font-semibold text-white">{study.dateRange || 'N/A'}</span></div>
                                </div>
                                <Link href={`/dashboard/casestudies/${study.id}`} className="mt-6 w-full text-center px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                    View Analysis <ExternalLink size={16} />
                                </Link>
                            </div>
                        ))}
                        {data.caseStudies?.length === 0 && (
                            <div className="md:col-span-2 lg:col-span-3 bg-slate-800/50 p-6 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-center text-gray-500">
                                <BarChart3 size={40} className="mb-4" />
                                <h3 className="text-lg font-semibold text-white">No Case Studies Found</h3>
                                <p className="text-sm">No results match your search, or you haven't created any case studies yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Phân trang */}
                    {data.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button onClick={() => handlePageChange(data.currentPage - 1)} disabled={data.currentPage === 1} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50">
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="text-sm text-gray-400">Page {data.currentPage} of {data.totalPages}</span>
                            <button onClick={() => handlePageChange(data.currentPage + 1)} disabled={data.currentPage === data.totalPages} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50">
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}