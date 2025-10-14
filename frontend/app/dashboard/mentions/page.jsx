'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/utils/api';
import Link from 'next/link';
import { FileSearch, Search, ExternalLink, AlertCircle, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source', 'Sentiment', 'Platform'];

export default function MentionsExplorerPage() {
    // State
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // === STATE MỚI CHO PHÂN TRANG ===
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // State cho tìm kiếm
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFields, setSearchFields] = useState({
        title: true,
        content: true,
        source: true,
        sentiment: false,
        platform: true,
    });

    // === HÀM LẤY DỮ LIỆU ĐÃ ĐƯỢC CẬP NHẬT ===
    const fetchAllPosts = async (page = 1) => {
        try {
            setIsLoading(true);
            // Gửi yêu cầu lấy dữ liệu cho trang cụ thể
            const data = await api(`posts/all?page=${page}&limit=5`); // Hiển thị 5 post mỗi trang
            setPosts(data.posts);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);
        } catch (err) {
            setError('Failed to fetch posts. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllPosts(1); // Tải trang đầu tiên khi component mount
    }, []);

    // Logic lọc (giữ nguyên)
    const filteredPosts = useMemo(() => {
        const searchTerms = searchTerm.toLowerCase().split('|').map(t => t.trim()).filter(Boolean);
        if (searchTerms.length === 0) return posts;
        const activeFields = Object.keys(searchFields).filter(field => searchFields[field]);
        if (activeFields.length === 0) return posts;
        return posts.filter(post => {
            return searchTerms.some(term => {
                return activeFields.some(field => {
                    if (field === 'alertTitle' && post.Alert) {
                        return post.Alert.title.toLowerCase().includes(term);
                    }
                    const fieldValue = post[field];
                    if (typeof fieldValue === 'string') {
                        return fieldValue.toLowerCase().includes(term);
                    }
                    return false;
                });
            });
        });
    }, [posts, searchTerm, searchFields]);

    // Handler cho checkbox tìm kiếm (giữ nguyên)
    const handleSearchFieldChange = (field) => {
        setSearchFields(prev => ({ ...prev, [field.toLowerCase()]: !prev[field.toLowerCase()] }));
    };

    // === HÀM ĐỂ CHUYỂN TRANG ===
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchAllPosts(newPage);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-gray-400 py-10">Loading mentions...</p>;
        }
        if (error) {
            return <p className="text-center text-red-400 py-10">{error}</p>;
        }
        if (posts.length === 0 && searchTerm === '') {
            return (
                <div className="flex flex-col items-center justify-center text-center text-gray-400 h-80 border-2 border-dashed border-slate-700 rounded-lg">
                    <FileSearch size={48} className="mb-4 text-slate-500" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Mentions Yet</h3>
                    <p>When the crawler runs, new posts will appear here.</p>
                </div>
            );
        }
        return (
            <>
                <div className="space-y-4">
                    {filteredPosts.length > 0 ? filteredPosts.map(post => (
                        <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-white mb-1">{post.title}</h3>
                                    {post.Alert && (<Link href={`/dashboard/alerts/${post.Alert.id}`} className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-2"><AlertCircle size={14} /> Related to: {post.Alert.title}</Link>)}
                                </div>
                                <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"><ExternalLink size={16} /> View Source</a>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <span>From: <span className="font-medium text-gray-300">{post.source}</span></span>
                                <span className="flex items-center gap-1.5"><Globe size={14} />Platform: <span className="font-medium text-gray-300">{post.platform || 'N/A'}</span></span>
                            </div>
                            <p className="text-gray-300 text-base">{post.content}</p>
                            <div className="mt-3">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${post.sentiment === 'NEGATIVE' && 'bg-red-500/30 text-red-300'} ${post.sentiment === 'POSITIVE' && 'bg-green-500/30 text-green-300'} ${post.sentiment === 'NEUTRAL' && 'bg-gray-500/30 text-gray-300'}`}>{post.sentiment}</span>
                            </div>
                        </div>
                    )) : (<div className="text-center text-gray-500 py-10"><p>No posts match your search criteria.</p></div>)}
                </div>
                {/* === KHUNG ĐIỀU KHIỂN PHÂN TRANG MỚI === */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /> Previous</button>
                        <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">Next <ChevronRight size={16} /></button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Mentions Explorer</h1>
            <p className="text-gray-400 mb-8">A centralized view of all posts matching your alerts.</p>
            {(posts.length > 0 || searchTerm !== '') && (
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                    <div className="relative w-full"><input type="text" placeholder="Search terms separated by '|'..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500" /><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /></div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-slate-300"><span>Search in:</span>{POST_SEARCH_FIELDS.map(field => (<label key={field} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={searchFields[field.toLowerCase()]} onChange={() => handleSearchFieldChange(field)} className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500" />{field}</label>))}</div>
                </div>
            )}
            {renderContent()}
        </div>
    );
}