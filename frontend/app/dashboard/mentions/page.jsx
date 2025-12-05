// frontend/app/dashboard/mentions/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AlertCircle, RefreshCw, Lock, Zap, FileSearch, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetcher } from '@/utils/api';
import { useAuth } from '@/app/providers.jsx';

// --- COMPONENTS ---
import FilterBar from '@/app/components/FilterBar';
import SearchableSelect from '@/app/components/SearchableSelect'; // Component mới
import MentionCard from '@/app/components/MentionCard'; // Component mới
import useDebounce from '@/hooks/useDebounce'; // Hook mới

// --- HẰNG SỐ ---
const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source'];
const PLATFORM_OPTIONS = ['Facebook', 'X', 'Instagram', 'News', 'Tiktok', 'Forum', 'Threads', 'Youtube', 'Blog'];
const SENTIMENT_OPTIONS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];
const ITEMS_PER_PAGE = 5;

export default function MentionsExplorerPage() {
    // --- LẤY THÔNG TIN USER ---
    const { user, isLoading: isAuthLoading } = useAuth();
    const isFreeTier = user && user.subscriptionTier === 'Free';

    // --- STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFields, setSearchFields] = useState({ title: true, content: true, source: true });
    const [selectedSentiments, setSelectedSentiments] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [selectedAlerts, setSelectedAlerts] = useState(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- API URL Construction ---
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: ITEMS_PER_PAGE.toString(),
        });
        const activeFields = Object.keys(searchFields).filter((field) => searchFields[field]);

        if (debouncedSearchTerm && activeFields.length > 0) {
            params.append('search', debouncedSearchTerm);
            params.append('fields', activeFields.join(','));
        }
        if (selectedSentiments.length > 0) params.append('sentiments', selectedSentiments.join(','));
        if (selectedPlatforms.length > 0) params.append('platforms', selectedPlatforms.join(','));
        if (selectedAlerts) params.append('alertId', selectedAlerts.value);

        return `/api/posts/all?${params.toString()}`;
    }, [currentPage, debouncedSearchTerm, searchFields, selectedSentiments, selectedPlatforms, selectedAlerts]);

    // --- DATA FETCHING ---
    const { data, error, isLoading: isSWRLoading, mutate } = useSWR(apiUrl, fetcher, { keepPreviousData: true });
    const { data: alertsData } = useSWR('/api/alerts', fetcher);

    const alertOptions = useMemo(() => {
        return alertsData?.alerts?.map(alert => ({ value: alert.id, label: alert.title })) || [];
    }, [alertsData]);

    const posts = data?.posts || [];
    const totalPages = data?.totalPages || 1;
    const isLoading = (isSWRLoading && !data) || isAuthLoading;

    // --- EFFECTS & HANDLERS ---
    useEffect(() => {
        if (currentPage !== 1) setCurrentPage(1);
    }, [debouncedSearchTerm, searchFields, selectedSentiments, selectedPlatforms, selectedAlerts]);

    const handleSearchFieldChange = (field) => {
        setSearchFields((prev) => ({ ...prev, [field.toLowerCase()]: !prev[field.toLowerCase()] }));
    };

    const resetAllFilters = () => {
        setSearchTerm('');
        setSelectedSentiments([]);
        setSelectedPlatforms([]);
        setSearchFields({ title: true, content: true, source: true });
        setSelectedAlerts(null);
    };

    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden min-h-screen">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Mentions Explorer</h1>
            <p className="text-gray-400 mb-6 text-sm sm:text-base">A centralized view of all posts matching your alerts.</p>

            {/* --- FILTER THEO ALERT --- */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Alert</label>
                <SearchableSelect
                    options={alertOptions}
                    value={selectedAlerts}
                    onChange={setSelectedAlerts}
                    placeholder="Search and select an alert..."
                    isLoading={!alertsData}
                />
            </div>

            {/* --- THANH LỌC CHÍNH (FilterBar) --- */}
            <FilterBar
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search across all posts..."
                availableFields={POST_SEARCH_FIELDS}
                activeFields={searchFields}
                onFieldChange={handleSearchFieldChange}
                platformOptions={PLATFORM_OPTIONS}
                selectedPlatforms={selectedPlatforms}
                onPlatformChange={setSelectedPlatforms}
                sentimentOptions={!isFreeTier ? SENTIMENT_OPTIONS : undefined}
                selectedSentiments={!isFreeTier ? selectedSentiments : undefined}
                onSentimentChange={!isFreeTier ? setSelectedSentiments : undefined}
            />

            {/* --- VIP/PRO FEATURE ALERT --- */}
            {isFreeTier && (
                <div className="mt-4 mb-6 p-4 rounded-lg bg-yellow-900/50 border border-yellow-700/60 text-yellow-300 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Lock size={18} className="flex-shrink-0 mt-0.5" />
                        <span> Basic Sentiment analysis is one of VIP/Pro subscription features. Upgrade to view the analysis of the posts.</span>
                    </div>
                    <Link href="/buy" className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all text-xs sm:text-sm">
                        <Zap size={16} />
                        Unlock Feature
                    </Link>
                </div>
            )}

            {/* --- KẾT QUẢ --- */}
            <div className="mt-6">
                {isLoading ? (
                    <div className="space-y-4 py-10">
                        {[...Array(ITEMS_PER_PAGE)].map((_, i) => <MentionCardSkeleton key={i} />)}
                    </div>
                ) : error ? (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Data</h3>
                        <p className="mt-1 text-sm text-red-300">{error.message || 'Could not load mentions list.'}</p>
                        <button onClick={() => mutate()} className="mt-6 inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-600">
                            <RefreshCw className="w-4 h-4 mr-2" /> Retry
                        </button>
                    </div>
                ) : posts.length > 0 ? (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <MentionCard key={post.id} post={post} isFreeTier={isFreeTier} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        hasFilter={searchTerm || selectedSentiments.length > 0 || selectedPlatforms.length > 0 || selectedAlerts}
                        onReset={resetAllFilters}
                    />
                )}

                {/* --- PHÂN TRANG ĐƠN GIẢN --- */}
                {!isLoading && !error && posts.length > 0 && totalPages > 1 && (
                    <div className="flex justify-between sm:justify-center items-center gap-4 mt-8">
                        <button onClick={() => setCurrentPage(c => Math.max(c - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 bg-slate-700 rounded-md disabled:opacity-50 text-white flex items-center gap-2">
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <span className="text-gray-400 text-sm">Page {currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-2 bg-slate-700 rounded-md disabled:opacity-50 text-white flex items-center gap-2">
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Component phụ trợ nhỏ để hiển thị trạng thái trống
function EmptyState({ hasFilter, onReset }) {
    return (
        <div className="flex flex-col items-center justify-center text-center text-gray-400 h-60 sm:h-80 border-2 border-dashed border-slate-700 rounded-lg p-4">
            <FileSearch size={40} className="mb-4 text-slate-500" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                {hasFilter ? "No Mentions Found" : "No Mentions Yet"}
            </h3>
            <p className="text-sm">
                {hasFilter ? "Try adjusting your search terms or filters." : "When the crawler runs, new posts will appear here."}
            </p>
            {hasFilter && (
                <button onClick={onReset} className="mt-4 inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-600">
                    Clear Filters
                </button>
            )}
        </div>
    );
}

function MentionCardSkeleton() {
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 animate-pulse space-y-3">
            <div className="flex justify-between gap-4"><div className="h-6 bg-slate-700 rounded w-3/5"></div><div className="h-4 bg-slate-700 rounded w-1/5"></div></div>
            <div className="flex gap-4"><div className="h-4 bg-slate-700 rounded w-1/4"></div><div className="h-4 bg-slate-700 rounded w-1/3"></div></div>
            <div className="space-y-2"><div className="h-4 bg-slate-700 rounded w-full"></div><div className="h-4 bg-slate-700 rounded w-4/5"></div></div>
        </div>
    );
}