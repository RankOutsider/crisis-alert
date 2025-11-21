'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import {
    swrFetcher,
    deleteAdminPost,
    deleteAdminPostsBulk
} from '@/utils/api';
import {
    Search, Trash2, ChevronLeft, ChevronRight,
    Loader2, ExternalLink, Calendar, Layers,
    CheckSquare, Square
} from 'lucide-react';

export default function AdminPosts() {
    // State UI
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // --- 1. SWR FETCH DATA ---
    const endpoint = `admin/posts?page=${page}&limit=10&search=${search}`;

    const { data, error, isLoading } = useSWR(endpoint, swrFetcher, {
        keepPreviousData: true, // Giữ data cũ khi chuyển trang cho mượt
    });

    // Parse dữ liệu
    const posts = data?.posts || [];
    const totalPages = data?.pages || 1;
    const totalPosts = data?.totalPosts || 0;

    // Scroll lên đầu khi chuyển trang
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    // --- LOGIC CHECKBOX ---
    const toggleSelect = (id) => {
        selectedIds.includes(id)
            ? setSelectedIds(prev => prev.filter(item => item !== id))
            : setSelectedIds(prev => [...prev, id]);
    };

    const toggleSelectAll = () => {
        selectedIds.length === posts.length && posts.length > 0
            ? setSelectedIds([])
            : setSelectedIds(posts.map(post => post.id));
    };

    // --- LOGIC ACTIONS (Dùng mutate) ---

    // 1. Xóa đơn lẻ
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await deleteAdminPost(id);

            // Optimistic Update: Xóa ngay trên UI trước
            mutate(endpoint, {
                ...data,
                posts: posts.filter(p => p.id !== id)
            }, false);

            // Sau đó fetch lại để chắc chắn
            mutate(endpoint);
            alert('Post deleted successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to delete post');
        }
    };

    // 2. Xóa hàng loạt
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (window.confirm(`Are you sure you want to DELETE ${selectedIds.length} selected posts? This cannot be undone.`)) {
            try {
                await deleteAdminPostsBulk(selectedIds);

                // Refresh lại dữ liệu từ server
                mutate(endpoint);

                alert(`Deleted ${selectedIds.length} posts successfully.`);
                setSelectedIds([]); // Reset lựa chọn
            } catch (error) {
                console.error(error);
                alert('Failed to delete selected posts.');
            }
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'POSITIVE': return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'NEGATIVE': return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-gray-600/20 text-gray-400 border-gray-600/50';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const Pagination = () => (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:inline">Page {page} of {totalPages}</span>
            <div className="flex space-x-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"><ChevronLeft size={20} /></button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"><ChevronRight size={20} /></button>
            </div>
        </div>
    );

    // Error State
    if (error) return <div className="text-center py-10 text-red-400">Failed to load posts.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold">Post Management ({totalPosts})</h1>

                    <div className="flex flex-col-reverse md:flex-row gap-4 w-full md:w-auto items-end md:items-center">
                        <Pagination />
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search content..."
                                className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                </div>

                {/* BULK ACTION BAR */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-600/20 border border-blue-500/50 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <span className="text-blue-400 font-medium flex items-center gap-2">
                            <CheckSquare size={20} />
                            Selected {selectedIds.length} posts
                        </span>
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20"
                        >
                            <Trash2 size={16} />
                            Delete Selected
                        </button>
                    </div>
                )}
            </div>

            {/* LOADING STATE */}
            {isLoading ? (
                <div className="flex justify-center py-8 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading posts...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-xl border border-gray-700">No posts found.</div>
            ) : (
                /* --- TABLE CONTENT --- */
                <>
                    {/* MOBILE VIEW (Cards) */}
                    <div className="md:hidden flex flex-col gap-3">
                        <div className="flex items-center gap-3 px-2 mb-1">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white flex items-center gap-2">
                                {selectedIds.length === posts.length ? <CheckSquare className="text-blue-500" size={22} /> : <Square size={22} />}
                                <span className="text-sm font-medium text-gray-300">Select All</span>
                            </button>
                        </div>

                        {posts.map((post) => {
                            const isSelected = selectedIds.includes(post.id);
                            return (
                                <div key={post.id} className={`bg-gray-800 p-4 rounded-xl border shadow-sm flex flex-col gap-3 ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/50 bg-blue-900/10' : 'border-gray-700'}`}>
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex items-start gap-3">
                                            <button onClick={() => toggleSelect(post.id)} className="mt-1 text-gray-400 hover:text-white">
                                                {isSelected ? <CheckSquare className="text-blue-500" size={22} /> : <Square size={22} />}
                                            </button>
                                            <h3 className="font-bold text-white text-base line-clamp-2 cursor-pointer" onClick={() => toggleSelect(post.id)}>
                                                {post.title}
                                            </h3>
                                        </div>
                                        <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:text-red-300 p-1 shrink-0"><Trash2 size={18} /></button>
                                    </div>

                                    <div className="pl-9">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSentimentColor(post.sentiment)}`}>{post.sentiment || 'NEUTRAL'}</span>
                                            <span className="px-2 py-0.5 rounded text-xs font-medium border bg-blue-500/20 text-blue-400 border-blue-500/50">{post.platform || 'Web'}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-3 mb-2">{post.content}</p>
                                        <div className="flex flex-col gap-1 pt-2 border-t border-gray-700/50 text-xs text-gray-500">
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1"><Layers size={12} /> {post.source}</span>
                                                {post.sourceUrl && <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">Link <ExternalLink size={10} /></a>}
                                            </div>
                                            <div className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.publishedAt)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP VIEW (Table) */}
                    <div className="hidden md:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-700/50 text-gray-300 border-b border-gray-700">
                                    <th className="p-4 w-12">
                                        <button onClick={toggleSelectAll}>{posts.length > 0 && selectedIds.length === posts.length ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}</button>
                                    </th>
                                    <th className="p-4 font-medium w-1/3">Content Details</th>
                                    <th className="p-4 font-medium">Sentiment</th>
                                    <th className="p-4 font-medium">Platform</th>
                                    <th className="p-4 font-medium">Published At</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {posts.map((post) => {
                                    const isSelected = selectedIds.includes(post.id);
                                    return (
                                        <tr key={post.id} className={`transition-colors ${isSelected ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'hover:bg-gray-700/30'}`}>
                                            <td className="p-4">
                                                <button onClick={() => toggleSelect(post.id)} className="text-gray-400 hover:text-white">{isSelected ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}</button>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-white line-clamp-1 mb-1 cursor-pointer" onClick={() => toggleSelect(post.id)}>{post.title}</div>
                                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                                    <span className="bg-gray-700 px-1 rounded">{post.source}</span>
                                                    {post.sourceUrl && <a href={post.sourceUrl} target="_blank" className="text-blue-400 hover:underline flex items-center gap-1">Open Link <ExternalLink size={10} /></a>}
                                                </div>
                                                <p className="text-sm text-gray-400 line-clamp-2">{post.content}</p>
                                            </td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium border ${getSentimentColor(post.sentiment)}`}>{post.sentiment || 'NEUTRAL'}</span></td>
                                            <td className="p-4"><div className="flex items-center gap-2 text-gray-300">{post.platform || 'Web'}</div></td>
                                            <td className="p-4 text-sm text-gray-400 whitespace-nowrap">{formatDate(post.publishedAt)}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(post.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Bottom Pagination */}
            <div className="flex justify-end">
                <Pagination />
            </div>
        </div>
    );
}