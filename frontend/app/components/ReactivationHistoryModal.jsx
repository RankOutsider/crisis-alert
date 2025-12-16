// frontend/app/components/ReactivationHistoryModal.jsx
'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '@/utils/api';
import { Search, Trash2, ChevronLeft, ChevronRight, RefreshCw, User, Calendar, Mail, AlertTriangle } from 'lucide-react';

export default function ReactivationHistoryModal({ isOpen, onClose }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // --- State cho Modal xác nhận xoá ---
    const [deleteItem, setDeleteItem] = useState(null); // Lưu item đang cần xoá
    const [isDeleting, setIsDeleting] = useState(false);

    // --- FETCH HISTORY ---
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '5',
                search: search,
                status: statusFilter
            }).toString();

            const res = await api(`/admin/reactivations/history?${queryParams}`);

            setData(res.data || []);
            setTotalPages(res.pages || 1);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, page, statusFilter]);

    useEffect(() => {
        if (!isOpen) return;
        const timeout = setTimeout(() => {
            setPage(1);
            fetchHistory();
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    // Nút thùng rác mở popup xác nhận, chưa xoá ngay
    const onRequestDelete = (item) => {
        setDeleteItem(item);
    };

    // Bấm YES trong popup
    const confirmDelete = async () => {
        if (!deleteItem) return;

        setIsDeleting(true);
        try {
            await api(`/admin/reactivations/history/${deleteItem.id}`, {
                method: 'DELETE'
            });
            // Xoá thành công
            setDeleteItem(null); // Đóng popup
            fetchHistory(); // Refresh list
        } catch (error) {
            alert('Delete failed: ' + (error.message || 'Unknown error'));
        } finally {
            setIsDeleting(false);
        }
    };

    // Render Badge trạng thái
    const renderStatusBadge = (status) => (
        <span className={`px-2 py-1 rounded text-xs font-bold border ${status === 'approved' || status === 'APPROVED'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
            {status ? status.toUpperCase() : ''}
        </span>
    );

    const renderFooter = (
        <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors w-full sm:w-auto"
        >
            Close
        </button>
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="REACTIVATION HISTORY"
                size="max-w-4xl"
                footer={renderFooter}
            >
                <div className="space-y-4 relative">
                    {/* --- Toolbar --- */}
                    <div className="flex flex-col md:flex-row gap-3">
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
                        <div className="flex gap-2 w-full md:w-auto">
                            <select
                                className="flex-1 md:w-40 bg-slate-900 border border-slate-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-blue-500"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">ALL STATUS</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="REJECTED">REJECTED</option>
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

                    {/* --- Content Area --- */}
                    <div className="min-h-[200px]">
                        {loading ? (
                            <div className="text-center py-10 text-slate-500">Loading data...</div>
                        ) : data.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">No history found.</div>
                        ) : (
                            <>
                                {/* --- MOBILE VIEW: CARDS --- */}
                                <div className="grid grid-cols-1 gap-3 md:hidden">
                                    {data.map((item) => (
                                        <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-col gap-3 relative">
                                            <div className="flex items-start justify-between pr-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white">{item.User?.username || 'Unknown'}</div>
                                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                                            <Mail size={10} /> {item.User?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-px bg-slate-800 w-full"></div>
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Calendar size={14} />
                                                    <span>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</span>
                                                </div>
                                                {renderStatusBadge(item.status)}
                                            </div>
                                            <button
                                                onClick={() => onRequestDelete(item)}
                                                className="absolute top-3 right-3 p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-full transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* --- DESKTOP VIEW: TABLE --- */}
                                <div className="hidden md:block overflow-x-auto border border-slate-700 rounded-lg">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-slate-900 text-slate-400 text-sm uppercase font-semibold">
                                                <th className="p-3 border-b border-slate-700">User</th>
                                                <th className="p-3 border-b border-slate-700">Email</th>
                                                <th className="p-3 border-b border-slate-700">Processed Date</th>
                                                <th className="p-3 border-b border-slate-700">Status</th>
                                                <th className="p-3 border-b border-slate-700 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-200 text-sm">
                                            {data.map((item) => (
                                                <tr key={item.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-700/50 transition-colors">
                                                    <td className="p-3 font-medium text-white">{item.User?.username || 'Unknown'}</td>
                                                    <td className="p-3 text-slate-400">{item.User?.email || 'N/A'}</td>
                                                    <td className="p-3">{new Date(item.updatedAt).toLocaleDateString('en-GB')}</td>
                                                    <td className="p-3">{renderStatusBadge(item.status)}</td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => onRequestDelete(item)}
                                                            className="text-slate-400 hover:text-red-400 hover:bg-slate-700 p-2 rounded transition-colors"
                                                            title="Delete Log"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
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

            {/* --- CONFIRMATION DIALOG (Nằm ngoài Modal chính nhưng có z-index cao hơn) --- */}
            {deleteItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-sm w-full p-6 transform scale-100 transition-all">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Delete Log?</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Are you sure you want to delete the history log for <b>{deleteItem.User?.username}</b>? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setDeleteItem(null)}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    No, Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}