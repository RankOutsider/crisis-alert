// frontend/app/admin/casestudies/page.jsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { swrFetcher, deleteAdminCaseStudy, deleteAdminCaseStudiesBulk } from '@/utils/api';
import {
    Trash2, ChevronLeft, ChevronRight,
    Loader2, CheckSquare, Square, FileText,
    BookOpen, Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import FilterBar from '@/app/components/FilterBar'; // 1. Import FilterBar
import useDebounce from '@/hooks/useDebounce';     // 2. Import useDebounce

export default function AdminCaseStudies() {
    // --- 1. FETCH DATA (Lấy toàn bộ danh sách) ---
    // Bỏ pagination param để lấy hết list về client xử lý
    const endpoint = 'admin/casestudies';
    const { data, error, isLoading } = useSWR(endpoint, swrFetcher);

    // Xử lý dữ liệu trả về từ API (tùy backend trả về array trực tiếp hay object { caseStudies: [...] })
    // Nếu backend vẫn trả về dạng phân trang, bạn có thể cần sửa backend hoặc chấp nhận lấy trang 1 với limit cực lớn
    // Giả sử ở đây data trả về là { caseStudies: [...] } hoặc mảng [...]
    const allCaseStudies = Array.isArray(data) ? data : (data?.caseStudies || []);

    // --- STATE UI ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState([]); // Filter theo Status
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const itemsPerPage = 10;

    // --- DEBOUNCE SEARCH ---
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- LOGIC LỌC & PHÂN TRANG CLIENT-SIDE ---

    // Reset về trang 1 khi filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedStatus]);

    // 1. Lọc dữ liệu
    const filteredCaseStudies = useMemo(() => {
        return allCaseStudies.filter(cs => {
            const title = cs.title?.toLowerCase() || '';
            const summary = cs.summary?.toLowerCase() || '';
            const search = debouncedSearchTerm.toLowerCase();

            // Tìm theo Title hoặc Summary
            const matchesSearch = title.includes(search) || summary.includes(search);

            // Filter theo Status (nếu có)
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(cs.status);

            return matchesSearch && matchesStatus;
        });
    }, [allCaseStudies, debouncedSearchTerm, selectedStatus]);

    // 2. Cắt trang
    const totalPages = Math.ceil(filteredCaseStudies.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCaseStudies.slice(indexOfFirstItem, indexOfLastItem);

    // Scroll lên đầu khi đổi trang
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // --- CHECKBOX LOGIC ---
    const toggleSelect = (id) => {
        selectedIds.includes(id)
            ? setSelectedIds(prev => prev.filter(item => item !== id))
            : setSelectedIds(prev => [...prev, id]);
    };

    const toggleSelectAll = () => {
        // Chỉ select những item đang hiển thị (filtered) hoặc select tất cả (tùy logic bạn muốn)
        // Ở đây mình chọn select tất cả items hiện có trong list filtered
        selectedIds.length === filteredCaseStudies.length && filteredCaseStudies.length > 0
            ? setSelectedIds([])
            : setSelectedIds(filteredCaseStudies.map(cs => cs.id));
    };

    // --- ACTION HANDLERS ---

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this Case Study?')) return;
        try {
            await deleteAdminCaseStudy(id);
            // Optimistic update
            const updatedList = allCaseStudies.filter(c => c.id !== id);
            // Cập nhật lại cache SWR
            mutate(endpoint, { ...data, caseStudies: updatedList }, false);

            toast.success('Case Study deleted successfully');
            mutate(endpoint); // Re-fetch chuẩn
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete case study');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Delete ${selectedIds.length} Case Studies?`)) {
            try {
                await deleteAdminCaseStudiesBulk(selectedIds);
                toast.success(`Deleted ${selectedIds.length} items successfully.`);
                setSelectedIds([]);
                mutate(endpoint);
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete selected items.');
            }
        }
    };

    const getStatusColor = (status) => {
        return status === 'Resolved'
            ? 'text-green-400 border-green-500/50 bg-green-500/10'
            : 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    };

    if (error) return <div className="text-center py-10 text-red-400">Failed to load case studies.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-blue-500" />
                        Case Studies <span className="text-gray-500 text-lg font-normal">({filteredCaseStudies.length})</span>
                    </h1>
                </div>

                {/* FILTER BAR */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or summary..."

                    // Thêm filter Status cho Case Study (nếu cần)
                    statusOptions={['Active', 'Resolved', 'Pending']}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                />

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-600/10 border border-blue-500/30 p-3 rounded-lg flex items-center justify-between animate-fadeIn">
                        <span className="text-blue-400 font-medium flex items-center gap-2 text-sm">
                            <CheckSquare size={18} /> Selected {selectedIds.length} items
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

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-10 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading...</div>
            ) : filteredCaseStudies.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                    No Case Studies found matching your filters.
                </div>
            ) : (
                <>
                    {/* MOBILE VIEW */}
                    <div className="md:hidden flex flex-col gap-4">
                        <div className="flex items-center gap-3 px-1 mb-1">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                                {selectedIds.length === filteredCaseStudies.length ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                                <span className="text-sm font-medium">Select All</span>
                            </button>
                        </div>
                        {currentItems.map((cs) => {
                            const isSelected = selectedIds.includes(cs.id);
                            return (
                                <div key={cs.id} className={`bg-slate-800 p-5 rounded-xl border shadow-sm flex flex-col gap-4 transition-all ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <button onClick={() => toggleSelect(cs.id)} className="mt-1 text-gray-400 hover:text-white shrink-0">
                                                {isSelected ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-white text-base leading-snug cursor-pointer hover:text-blue-400 transition-colors truncate" onClick={() => toggleSelect(cs.id)}>
                                                    {cs.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                                                    <span className="truncate max-w-[150px]">{cs.User?.email || 'Unknown User'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(cs.id)} className="text-slate-500 hover:text-red-400 p-2 -mr-2 -mt-2 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="pl-8">
                                        <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/30 p-2 rounded border border-slate-700/50">
                                            {cs.summary || 'No summary provided.'}
                                        </p>
                                    </div>
                                    <div className="pl-8 pt-2 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded font-medium border ${getStatusColor(cs.status)}`}>
                                                {cs.status}
                                            </span>
                                            <span className="flex items-center gap-1 text-slate-400">
                                                <FileText size={12} /> {cs.postCount}
                                            </span>
                                        </div>
                                        <div className="text-gray-500 flex items-center gap-1">
                                            <Calendar size={12} />
                                            {cs.createdAt ? format(new Date(cs.createdAt), 'MMM dd') : '-'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP VIEW */}
                    <div className="hidden md:block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-300 border-b border-slate-700 text-xs uppercase font-semibold">
                                    <th className="p-4 w-12 text-center">
                                        <button onClick={toggleSelectAll} className="hover:text-white">
                                            {filteredCaseStudies.length > 0 && selectedIds.length === filteredCaseStudies.length ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}
                                        </button>
                                    </th>
                                    <th className="p-4 w-[25%]">Title & Summary</th>
                                    <th className="p-4 w-[20%]">Owner</th>
                                    <th className="p-4 w-[10%] text-center">Posts</th>
                                    <th className="p-4 w-[15%]">Date Created</th>
                                    <th className="p-4 w-[15%]">Status</th>
                                    <th className="p-4 w-[10%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {currentItems.map((cs) => {
                                    const isSelected = selectedIds.includes(cs.id);
                                    return (
                                        <tr key={cs.id} className={`transition-colors ${isSelected ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-slate-700/30'}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => toggleSelect(cs.id)} className="text-slate-400 hover:text-white transition-colors">
                                                    {isSelected ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-white truncate cursor-pointer hover:text-blue-400 transition-colors" title={cs.title} onClick={() => toggleSelect(cs.id)}>{cs.title}</div>
                                                <div className="text-xs text-slate-500 mt-1 truncate" title={cs.summary}>{cs.summary || 'No summary'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-300 font-medium truncate">{cs.User?.username || 'N/A'}</div>
                                                <div className="text-xs text-slate-500 truncate">{cs.User?.email}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300 border border-slate-600">
                                                    {cs.postCount}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">
                                                {cs.createdAt ? format(new Date(cs.createdAt), 'MMM dd, yyyy') : '-'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${getStatusColor(cs.status)}`}>
                                                    {cs.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(cs.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm" title="Delete Case Study">
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
            {filteredCaseStudies.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-700/50">
                    <div className="text-sm text-gray-400">
                        Showing <span className="font-bold text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-white">{Math.min(indexOfLastItem, filteredCaseStudies.length)}</span> of <span className="font-bold text-white">{filteredCaseStudies.length}</span> results
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