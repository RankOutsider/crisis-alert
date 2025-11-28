// frontend/app/admin/posts/page.jsx
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
    CheckSquare, Square, MessageCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function AdminPosts() {
    // State UI
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // --- 1. SWR FETCH DATA ---
    // Thêm debouncing cho search nếu cần, ở đây dùng trực tiếp
    const endpoint = `admin/posts?page=${page}&limit=10&search=${search}`;

    const { data, error, isLoading } = useSWR(endpoint, swrFetcher, {
        keepPreviousData: true,
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

    // --- LOGIC ACTIONS ---

    // 1. Xóa đơn lẻ
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await deleteAdminPost(id);

            // Optimistic Update
            mutate(endpoint, {
                ...data,
                posts: posts.filter(p => p.id !== id)
            }, false);

            toast.success('Post deleted successfully');
            // Fetch lại để đồng bộ
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
                mutate(endpoint); // Refresh lại
                toast.success(`Deleted ${selectedIds.length} posts successfully.`);
                setSelectedIds([]);
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

    const Pagination = () => (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:inline">Page {page} of {totalPages}</span>
            <div className="flex space-x-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 transition-colors"><ChevronLeft size={20} /></button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 transition-colors"><ChevronRight size={20} /></button>
            </div>
        </div>
    );

    if (error) return <div className="text-center py-10 text-red-400">Failed to load posts.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MessageCircle className="text-blue-500" />
                        Post Management <span className="text-gray-500 text-lg font-normal">({totalPosts})</span>
                    </h1>

                    <div className="flex flex-col-reverse md:flex-row gap-4 w-full md:w-auto items-end md:items-center">
                        <Pagination />
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search title, content..."
                                className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 text-sm transition-all"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                </div>

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
            ) : posts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                    No posts found matching your search.
                </div>
            ) : (
                <>
                    {/* MOBILE VIEW (Cards) */}
                    <div className="md:hidden flex flex-col gap-4">
                        <div className="flex items-center gap-3 px-1 mb-1">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                                {selectedIds.length === posts.length ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                                <span className="text-sm font-medium">Select All</span>
                            </button>
                        </div>

                        {posts.map((post) => {
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
                                            {posts.length > 0 && selectedIds.length === posts.length ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}
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
                                {posts.map((post) => {
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

            {/* Bottom Pagination */}
            <div className="flex justify-end pt-4">
                <Pagination />
            </div>
        </div>
    );
}