// frontend/app/dashboard/mentions/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
    FileSearch, Search, ExternalLink, AlertCircle, Globe,
    ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { fetcher } from '@/utils/api';
import MultiSelectDropdown from '@/app/components/MultiSelectDropdown';
import FilterBar from '@/app/components/FilterBar';

// --- Hằng số ---
const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source'];
const PLATFORM_OPTIONS = ['Facebook', 'X', 'Instagram', 'News', 'Tiktok', 'Forum', 'Threads', 'Youtube', 'Blog'];
const SENTIMENT_OPTIONS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];
const ITEMS_PER_PAGE = 5; // <-- Định nghĩa số lượng item/trang

// --- useDebounce Hook ---
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function MentionsExplorerPage() {
    // --- STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFields, setSearchFields] = useState({ title: true, content: true, source: true });
    const [selectedSentiments, setSelectedSentiments] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- API URL Construction ---
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: ITEMS_PER_PAGE.toString(), // <-- Dùng hằng số
        });
        const activeFields = Object.keys(searchFields).filter((field) => searchFields[field]);

        if (debouncedSearchTerm && activeFields.length > 0) {
            params.append('search', debouncedSearchTerm);
            params.append('fields', activeFields.join(','));
        }
        if (selectedSentiments.length > 0) {
            params.append('sentiments', selectedSentiments.join(','));
        }
        if (selectedPlatforms.length > 0) {
            params.append('platforms', selectedPlatforms.join(','));
        }
        return `/api/posts/all?${params.toString()}`;
    }, [currentPage, debouncedSearchTerm, searchFields, selectedSentiments, selectedPlatforms]);

    // --- Data Fetching ---
    const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
        keepPreviousData: true,
    });

    // --- Process SWR Data ---
    const posts = data?.posts || [];
    const totalPages = data?.totalPages || 1;

    // --- useEffect Reset Trang ---
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, searchFields, selectedSentiments, selectedPlatforms]);

    // --- HANDLERS ---
    const handleSearchFieldChange = (field) => {
        setSearchFields((prev) => ({ ...prev, [field.toLowerCase()]: !prev[field.toLowerCase()] }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 overflow-x-hidden">
            <h1 className="text-3xl font-bold text-white mb-2">Mentions Explorer</h1>
            <p className="text-gray-400 mb-8">A centralized view of all posts matching your alerts.</p>

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
                sentimentOptions={SENTIMENT_OPTIONS}
                selectedSentiments={selectedSentiments}
                onSentimentChange={setSelectedSentiments}
            />

            {/* --- (THAY ĐỔI) JSX Hiển thị Loading (Skeleton) --- */}
            {isLoading && !data && (
                <div className="space-y-4 py-10">
                    {/* Render số lượng skeleton bằng ITEMS_PER_PAGE */}
                    {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
                        <MentionCardSkeleton key={index} />
                    ))}
                </div>
            )}

            {/* --- JSX Hiển thị Error (Giữ nguyên) --- */}
            {error && (
                <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Data</h3>
                    <p className="mt-1 text-sm text-red-300">{error.message || 'Could not load mentions list.'}</p>
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
            )}

            {/* --- JSX Hiển thị Data / Empty (Giữ nguyên) --- */}
            {!isLoading && !error && (
                <>
                    {posts.length > 0 ? (
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors duration-150">
                                    <div className="flex justify-between items-start gap-4 min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-lg text-white mb-1 truncate" title={post.title}>{post.title}</h3>
                                            {post.Alert && (
                                                <Link
                                                    href={`/dashboard/alerts/${post.Alert.id}`}
                                                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-2"
                                                >
                                                    <AlertCircle size={14} />
                                                    <span className="truncate">Related to: {post.Alert.title}</span>
                                                </Link>
                                            )}
                                        </div>
                                        <a
                                            href={post.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            <ExternalLink size={16} /> View Source
                                        </a>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
                                        <span>
                                            From: <span className="font-medium text-gray-300">{post.source}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Globe size={14} />
                                            Platform: <span className="font-medium text-gray-300">{post.platform || 'N/A'}</span>
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-base line-clamp-3">{post.content}</p>
                                    <div className="mt-3">
                                        <span
                                            className={`text-xs font-semibold px-2 py-1 rounded-full ${post.sentiment === 'NEGATIVE' && 'bg-red-500/30 text-red-300'} ${post.sentiment === 'POSITIVE' && 'bg-green-500/30 text-green-300'} ${post.sentiment === 'NEUTRAL' && 'bg-gray-500/30 text-gray-300'}`}
                                        >
                                            {post.sentiment}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-gray-400 h-80 border-2 border-dashed border-slate-700 rounded-lg">
                            <FileSearch size={48} className="mb-4 text-slate-500" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {searchTerm || selectedSentiments.length > 0 || selectedPlatforms.length > 0
                                    ? "No Mentions Found"
                                    : "No Mentions Yet"
                                }
                            </h3>
                            <p className="text-sm">
                                {searchTerm || selectedSentiments.length > 0 || selectedPlatforms.length > 0
                                    ? "Try adjusting your search terms or filters."
                                    : "When the crawler runs, new posts matching your alerts will appear here."
                                }
                            </p>
                            {(searchTerm || selectedSentiments.length > 0 || selectedPlatforms.length > 0) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedSentiments([]);
                                        setSelectedPlatforms([]);
                                        setSearchFields({ title: true, content: true, source: true });
                                    }}
                                    className="mt-4 inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-600"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Phân trang (Giữ nguyên) */}
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
                </>
            )}
        </div>
    );
}

// --- Skeleton Component cho Mention Card ---
function MentionCardSkeleton() {
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 animate-pulse">
            {/* Skeleton for Header (Title + Link) */}
            <div className="flex justify-between items-start gap-4 mb-2">
                <div className="h-6 bg-slate-700 rounded w-3/5"></div> {/* Title Skeleton */}
                <div className="h-4 bg-slate-700 rounded w-1/5"></div> {/* Link Skeleton */}
            </div>
            {/* Skeleton for Meta (Source + Platform) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-2">
                <div className="h-4 bg-slate-700 rounded w-1/4"></div> {/* Source Skeleton */}
                <div className="h-4 bg-slate-700 rounded w-1/3"></div> {/* Platform Skeleton */}
            </div>
            {/* Skeleton for Content */}
            <div className="space-y-2">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-4/5"></div>
            </div>
            {/* Skeleton for Sentiment Tag */}
            <div className="mt-3">
                <div className="h-5 bg-slate-700 rounded-full w-20"></div>
            </div>
        </div>
    );
}