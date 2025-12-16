// frontend/app/components/ReactivationHistoryModal.jsx
'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '@/utils/api'; // Đã sửa import đúng theo project của bạn
import { Search, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function ReactivationHistoryModal({ isOpen, onClose }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Hàm lấy dữ liệu từ API
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/reactivations/history', {
                params: {
                    page,
                    limit: 5,
                    search,
                    status: statusFilter
                }
            });
            setData(res.data.data);
            setTotalPages(res.data.pages);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    // Gọi API khi mở modal hoặc filter thay đổi
    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, page, statusFilter]);

    // Debounce search thủ công
    useEffect(() => {
        if (!isOpen) return;
        const timeout = setTimeout(() => {
            setPage(1);
            fetchHistory();
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    // Hàm xoá lịch sử
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to permanently delete this log?')) return;
        try {
            await api.delete(`/admin/reactivations/history/${id}`);
            fetchHistory(); // Reload lại list
        } catch (error) {
            alert('Delete failed');
        }
    };

    // Footer chỉ chứa nút Close
    const renderFooter = (
        <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors w-full sm:w-auto"
        >
            Close
        </button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="REACTIVATION HISTORY" // Đổi sang tiếng Anh
            size="max-w-4xl" // Size rộng để chứa bảng
            footer={renderFooter}
        >
            <div className="space-y-4">
                {/* --- Toolbar: Mobile First Layout --- */}
                {/* Trên mobile: Flex column (dọc). Trên Desktop (md): Flex row (ngang) */}
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search Box */}
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search user or email..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filter & Refresh Wrapper */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            className="flex-1 md:w-40 bg-slate-900 border border-slate-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-blue-500"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">ALL STATUS</option>
                            <option value="approved">APPROVED</option>
                            <option value="rejected">REJECTED</option>
                        </select>

                        <button
                            onClick={fetchHistory}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white transition-colors shrink-0"
                            title="Refresh"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* --- Table Content --- */}
                {/* overflow-x-auto: QUAN TRỌNG CHO MOBILE - Giúp bảng cuộn ngang thay vì vỡ layout */}
                <div className="overflow-x-auto border border-slate-700 rounded-lg">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-900 text-slate-400 text-xs sm:text-sm uppercase font-semibold">
                                <th className="p-3 border-b border-slate-700">User</th>
                                <th className="p-3 border-b border-slate-700">Email</th>
                                <th className="p-3 border-b border-slate-700">Processed Date</th>
                                <th className="p-3 border-b border-slate-700">Status</th>
                                <th className="p-3 border-b border-slate-700 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-200 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        No history found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-700/50 transition-colors">
                                        <td className="p-3 font-medium text-white">{item.User?.username || 'Unknown'}</td>
                                        <td className="p-3 text-slate-400">{item.User?.email || 'N/A'}</td>
                                        <td className="p-3">{new Date(item.updatedAt).toLocaleDateString('en-GB')}</td> {/* Format ngày kiểu Anh/Việt dd/mm/yyyy */}
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-[10px] sm:text-xs font-bold border ${item.status === 'approved' || item.status === 'Approved'
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {item.status ? item.status.toUpperCase() : ''}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-slate-400 hover:text-red-400 hover:bg-slate-700 p-2 rounded transition-colors"
                                                title="Delete Log"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Pagination --- */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-2">
                    <span className="text-sm text-slate-400 order-2 sm:order-1">
                        Page <span className="text-white font-bold">{page}</span> of {totalPages || 1}
                    </span>
                    <div className="flex gap-2 order-1 sm:order-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-slate-700 rounded hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent text-white transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 border border-slate-700 rounded hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent text-white transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}