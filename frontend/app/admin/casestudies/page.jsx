'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr'; // 1. Import SWR
import { swrFetcher, deleteAdminCaseStudy, deleteAdminCaseStudiesBulk } from '@/utils/api'; // 2. Import fetcher
import { Search, Trash2, ChevronLeft, ChevronRight, Loader2, User, CheckSquare, Square, FileText } from 'lucide-react';

export default function AdminCaseStudies() {
    // State UI
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // --- 1. SWR FETCH DATA ---
    const endpoint = `admin/casestudies?page=${page}&limit=10&search=${search}`;

    const { data, error, isLoading } = useSWR(endpoint, swrFetcher, {
        keepPreviousData: true,
    });

    // Parse dữ liệu
    const caseStudies = data?.caseStudies || [];
    const totalPages = data?.pages || 1;
    const totalItems = data?.totalCaseStudies || 0;

    // Scroll lên đầu khi đổi trang
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    // --- CHECKBOX LOGIC ---
    const toggleSelect = (id) => {
        selectedIds.includes(id)
            ? setSelectedIds(prev => prev.filter(item => item !== id))
            : setSelectedIds(prev => [...prev, id]);
    };

    const toggleSelectAll = () => {
        selectedIds.length === caseStudies.length && caseStudies.length > 0
            ? setSelectedIds([])
            : setSelectedIds(caseStudies.map(cs => cs.id));
    };

    // --- ACTION HANDLERS (Dùng mutate) ---

    // 1. Xóa đơn lẻ
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this Case Study?')) return;

        try {
            await deleteAdminCaseStudy(id);

            // Optimistic Update: Xóa ngay trên UI
            mutate(endpoint, {
                ...data,
                caseStudies: caseStudies.filter(c => c.id !== id)
            }, false);

            mutate(endpoint); // Refresh lại data thật
            alert('Case Study deleted');
        } catch (error) {
            alert('Failed to delete');
        }
    };

    // 2. Xóa hàng loạt
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (window.confirm(`Delete ${selectedIds.length} Case Studies?`)) {
            try {
                await deleteAdminCaseStudiesBulk(selectedIds);

                mutate(endpoint); // Refresh data
                setSelectedIds([]); // Reset chọn

                alert(`Deleted ${selectedIds.length} items.`);
            } catch (error) {
                console.error(error);
                alert('Failed to delete selected items.');
            }
        }
    };

    const getStatusColor = (status) => {
        return status === 'Resolved'
            ? 'text-green-400 border-green-500/50 bg-green-500/10'
            : 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
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

    if (error) return <div className="text-center py-10 text-red-400">Failed to load case studies.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold">Case Study Management ({totalItems})</h1>

                    <div className="flex flex-col-reverse md:flex-row gap-4 w-full md:w-auto items-end md:items-center">
                        <Pagination />
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search title..."
                                className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-600/20 border border-blue-500/50 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <span className="text-blue-400 font-medium flex items-center gap-2">
                            <CheckSquare size={20} /> Selected {selectedIds.length} items
                        </span>
                        <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20">
                            <Trash2 size={16} /> Delete Selected
                        </button>
                    </div>
                )}
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className="flex justify-center py-8 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading...</div>
            ) : caseStudies.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-xl border border-gray-700">No Case Studies found.</div>
            ) : (
                /* --- DATA CONTENT --- */
                <>
                    {/* MOBILE VIEW */}
                    <div className="md:hidden flex flex-col gap-3">
                        <div className="flex items-center gap-3 px-2 mb-1">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white flex items-center gap-2">
                                {selectedIds.length === caseStudies.length ? <CheckSquare className="text-blue-500" size={22} /> : <Square size={22} />}
                                <span className="text-sm font-medium text-gray-300">Select All</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {caseStudies.map((cs) => {
                                const isSelected = selectedIds.includes(cs.id);
                                return (
                                    <div key={cs.id} className={`bg-gray-800 p-4 rounded-xl border shadow-sm flex flex-col gap-3 transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/50 bg-blue-900/10' : 'border-gray-700'}`}>
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <button onClick={() => toggleSelect(cs.id)} className="mt-1 text-gray-400 hover:text-white shrink-0">
                                                    {isSelected ? <CheckSquare className="text-blue-500" size={22} /> : <Square size={22} />}
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-white text-base cursor-pointer truncate" onClick={() => toggleSelect(cs.id)}>{cs.title}</h3>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 break-all">
                                                        <User size={12} className="shrink-0" />
                                                        {cs.User?.email || 'Unknown User'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDelete(cs.id)} className="text-red-400 hover:text-red-300 p-1 shrink-0 ml-2"><Trash2 size={18} /></button>
                                        </div>

                                        <div className="pl-9 space-y-2">
                                            <p className="text-sm text-gray-400 line-clamp-2">{cs.summary || 'No summary provided.'}</p>
                                            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700/50">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <FileText size={14} /> {cs.postCount} posts
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(cs.status)}`}>{cs.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* DESKTOP VIEW */}
                    <div className="hidden md:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-gray-700/50 text-gray-300 border-b border-gray-700">
                                    <th className="p-4 w-12"><button onClick={toggleSelectAll}>{caseStudies.length > 0 && selectedIds.length === caseStudies.length ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}</button></th>
                                    <th className="p-4 font-medium w-[20%]">Title & Summary</th>
                                    <th className="p-4 font-medium w-[20%]">Owner</th>
                                    <th className="p-4 font-medium w-[10%]">Posts</th>
                                    <th className="p-4 font-medium w-[15%]">Date Range</th>
                                    <th className="p-4 font-medium w-[15%]">Status</th>
                                    <th className="p-4 font-medium w-[10%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {caseStudies.map((cs) => {
                                    const isSelected = selectedIds.includes(cs.id);
                                    return (
                                        <tr key={cs.id} className={`transition-colors ${isSelected ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'hover:bg-gray-700/30'}`}>
                                            <td className="p-4"><button onClick={() => toggleSelect(cs.id)} className="text-gray-400 hover:text-white flex items-center">{isSelected ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}</button></td>
                                            <td className="p-4 cursor-pointer" onClick={() => toggleSelect(cs.id)}>
                                                <div className="font-semibold text-white truncate" title={cs.title}>{cs.title}</div>
                                                <div className="text-sm text-gray-500 truncate" title={cs.summary}>{cs.summary}</div>
                                            </td>
                                            <td className="p-4 overflow-hidden">
                                                <div className="text-sm text-white font-medium truncate">{cs.User?.username}</div>
                                                <div className="text-xs text-gray-500 truncate" title={cs.User?.email}>{cs.User?.email}</div>
                                            </td>
                                            <td className="p-4 text-gray-400">{cs.postCount}</td>
                                            <td className="p-4 text-xs text-gray-500 truncate">{cs.dateRange}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold border whitespace-nowrap ${getStatusColor(cs.status)}`}>{cs.status}</span></td>
                                            <td className="p-4 text-right"><button onClick={() => handleDelete(cs.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors"><Trash2 size={16} /></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <div className="flex justify-end"><Pagination /></div>
        </div>
    );
}