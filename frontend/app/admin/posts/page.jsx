// frontend/app/admin/posts/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import {
    swrFetcher,
    deleteAdminPost,
    deleteAdminPostsBulk
} from '@/utils/api';
import {
    Trash2, ChevronLeft, ChevronRight,
    Loader2, ExternalLink, Calendar, Layers,
    CheckSquare, Square, MessageCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import FilterBar from '@/app/components/FilterBar'; // 1. Import FilterBar
import useDebounce from '@/hooks/useDebounce';     // 2. Import useDebounce

export default function AdminPosts() {
    // --- 1. FETCH DATA (Lấy toàn bộ) ---
    // Bỏ pagination params
    const endpoint = 'admin/posts';
    const { data, error, isLoading } = useSWR(endpoint, swrFetcher);

    // Xử lý dữ liệu trả về (giả sử backend trả về { posts: [...] } hoặc mảng trực tiếp)
    const allPosts = Array.isArray(data) ? data : (data?.posts || []);

    // --- STATE UI ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSentiment, setSelectedSentiment] = useState([]); // Filter Sentiment
    const [selectedPlatform, setSelectedPlatform] = useState([]);   // Filter Platform

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const itemsPerPage = 10;

    // --- DEBOUNCE SEARCH ---
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- LOGIC LỌC & PHÂN TRANG CLIENT-SIDE ---

    // Reset trang về 1 khi filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedSentiment, selectedPlatform]);

    // 1. Lọc dữ liệu
    const filteredPosts = useMemo(() => {
        return allPosts.filter(post => {
            const title = post.title?.toLowerCase() || '';
            const content = post.content?.toLowerCase() || '';
            const source = post.source?.toLowerCase() || '';
            const search = debouncedSearchTerm.toLowerCase();

            // Tìm theo Title, Content hoặc Source
            const matchesSearch = title.includes(search) || content.includes(search) || source.includes(search);

            // Filter theo Sentiment
            const matchesSentiment = selectedSentiment.length === 0 ||
                (post.sentiment && selectedSentiment.includes(post.sentiment.toUpperCase()));

            // Filter theo Platform
            const matchesPlatform = selectedPlatform.length === 0 ||
                (post.platform && selectedPlatform.includes(post.platform));

            return matchesSearch && matchesSentiment && matchesPlatform;
        });
    }, [allPosts, debouncedSearchTerm, selectedSentiment, selectedPlatform]);

    // 2. Cắt trang
    const totalPages = Math.ceil(filteredPosts.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPosts.slice(indexOfFirstItem, indexOfLastItem);

    // Scroll lên đầu khi đổi trang
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // --- LOGIC CHECKBOX ---
    const toggleSelect = (id) => {
        selectedIds.includes(id)
            ? setSelectedIds(prev => prev.filter(item => item !== id))
            : setSelectedIds(prev => [...prev, id]);
    };

    const toggleSelectAll = () => {
        selectedIds.length === filteredPosts.length && filteredPosts.length > 0
            ? setSelectedIds([])
            : setSelectedIds(filteredPosts.map(post => post.id));
    };

    // --- LOGIC ACTIONS ---
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await deleteAdminPost(id);
            
            const updatedList = allPosts.filter(p => p.id !== id);
            mutate(endpoint, { ...data, posts: updatedList }, false);

            toast.success('Post deleted successfully');
            mutate(endpoint);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete post');
        }
    };

    // 2. Xóa hàng loạt
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (window.confirm(`Are you sure you want to DELETE ${selectedIds.length} selected posts? This cannot be undone.`)) {
            try {
                await deleteAdminPostsBulk(selectedIds);
                toast.success(`Deleted ${selectedIds.length} posts successfully.`);
                setSelectedIds([]);
                mutate(endpoint);
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete selected posts.');
            }
        }
    };

    // Helper Styles
    const getSentimentColor = (sentiment) => {
        const s = sentiment ? sentiment.toUpperCase() : 'NEUTRAL';
        switch (s) {
            case 'POSITIVE': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'NEGATIVE': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'NEUTRAL': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-gray-600/20 text-gray-400 border-gray-600/50';
        }
    };

    if (error) return <div className="text-center py-10 text-red-400">Failed to load posts.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MessageCircle className="text-blue-500" />
                        Post Management <span className="text-gray-500 text-lg font-normal">({filteredPosts.length})</span>
                    </h1>
                </div>

                {/* FILTER BAR (Đầy đủ options) */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search title, content, source..."

                    // Filter Sentiment
                    sentimentOptions={['POSITIVE', 'NEGATIVE', 'NEUTRAL']}
                    selectedSentiments={selectedSentiment}
                    onSentimentChange={setSelectedSentiment}

                    // Filter Platform (Bạn có thể thêm các platform khác nếu cần)
                    platformOptions={['Facebook', 'Twitter', 'Reddit', 'Instagram', 'Web']}
                    selectedPlatforms={selectedPlatform}
                    onPlatformChange={setSelectedPlatform}
                />

                {/* BULK ACTION BAR */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-600/10 border border-blue-500/30 p-3 rounded-lg flex items-center justify-between animate-fadeIn">
                        <span className="text-blue-400 font-medium flex items-center gap-2 text-sm">
                            <CheckSquare size={18} />
                            Selected {selectedIds.length} posts
                        </span>
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-500/90 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20"
                        >
                            <Trash2 size={16} /> Delete Selected
                        </button>
                    </div>
                )}
            </div>

            {/* LOADING STATE */}
            {isLoading ? (
                <div className="flex justify-center py-10 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading posts...</div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                    No posts found matching your filters.
                </div>
            ) : (
                <>
                    {/* MOBILE VIEW (Cards) */}
                    <div className="md:hidden flex flex-col gap-4">
                        <div className="flex items-center gap-3 px-1 mb-1">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                                {selectedIds.length === filteredPosts.length ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                                <span className="text-sm font-medium">Select All</span>
                            </button>
                        </div>

                        {currentItems.map((post) => {
                            const isSelected = selectedIds.includes(post.id);
                            return (
                                <div key={post.id} className={`bg-slate-800 p-5 rounded-xl border shadow-sm flex flex-col gap-3 transition-all ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex items-start gap-3 w-full">
                                            <button onClick={() => toggleSelect(post.id)} className="mt-1 text-gray-400 hover:text-white shrink-0">
                                                {isSelected ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <h3
                                                    className="font-bold text-white text-base leading-snug cursor-pointer hover:text-blue-400 transition-colors line-clamp-2"
                                                    onClick={() => toggleSelect(post.id)}
                                                >
                                                    {post.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider ${getSentimentColor(post.sentiment)}`}>
                                                        {post.sentiment}
                                                    </span>
                                                    <span className="text-xs text-gray-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">
                                                        {post.platform}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(post.id)} className="text-slate-500 hover:text-red-400 p-2 -mr-2 -mt-2 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="pl-8">
                                        <p className="text-sm text-slate-300 line-clamp-3 mb-3 leading-relaxed">
                                            {post.content}
                                        </p>
                                        <div className="flex flex-col gap-2 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 truncate max-w-[60%]">
                                                    <Layers size={12} /> {post.source}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={12} />
                                                    {post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : 'N/A'}
                                                </span>
                                            </div>
                                            {post.sourceUrl && (
                                                <a
                                                    href={post.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 w-fit"
                                                >
                                                    View Post <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP VIEW (Table) */}
                    <div className="hidden md:block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-300 border-b border-slate-700 text-xs uppercase font-semibold">
                                    <th className="p-4 w-12 text-center">
                                        <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                                            {filteredPosts.length > 0 && selectedIds.length === filteredPosts.length ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}
                                        </button>
                                    </th>
                                    <th className="p-4 w-[40%]">Post Content</th>
                                    <th className="p-4">Sentiment</th>
                                    <th className="p-4">Platform</th>
                                    <th className="p-4">Published</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {currentItems.map((post) => {
                                    const isSelected = selectedIds.includes(post.id);
                                    return (
                                        <tr key={post.id} className={`transition-colors ${isSelected ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-slate-700/30'}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => toggleSelect(post.id)} className="text-slate-400 hover:text-white transition-colors">
                                                    {isSelected ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-white line-clamp-1 mb-1 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => toggleSelect(post.id)}>
                                                    {post.title}
                                                </div>
                                                <p className="text-sm text-slate-400 line-clamp-2 mb-1.5">{post.content}</p>
                                                <div className="text-xs text-slate-500 flex items-center gap-3">
                                                    <span className="flex items-center gap-1 bg-slate-700/50 px-1.5 py-0.5 rounded border border-slate-600/50">
                                                        <Layers size={10} /> {post.source}
                                                    </span>
                                                    {post.sourceUrl && (
                                                        <a href={post.sourceUrl} target="_blank" className="text-blue-400 hover:underline flex items-center gap-1 transition-colors">
                                                            Original Link <ExternalLink size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${getSentimentColor(post.sentiment)}`}>
                                                    {post.sentiment || 'NEUTRAL'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-slate-300 text-sm">{post.platform || 'Web'}</div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                                                {post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : '-'}
                                                <div className="text-xs text-slate-600 mt-0.5">
                                                    {post.publishedAt ? format(new Date(post.publishedAt), 'HH:mm') : ''}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm"
                                                    title="Delete Post"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Pagination Controls */}
            {filteredPosts.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-700/50">
                    <div className="text-sm text-gray-400">
                        Showing <span className="font-bold text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-white">{Math.min(indexOfLastItem, filteredPosts.length)}</span> of <span className="font-bold text-white">{filteredPosts.length}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 border border-slate-700 text-gray-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}