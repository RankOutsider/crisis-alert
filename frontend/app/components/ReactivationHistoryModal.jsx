// frontend/app/components/ReactivationHistoryModal.jsx
'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal'; // Import Modal dùng chung
import api from '@/utils/api'; // Đường dẫn api của bạn
import { Search, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function ReactivationHistoryModal({ isOpen, onClose }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Hàm lấy dữ liệu
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
            // Giả sử API trả về structure: { data: [], pages: 10 }
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

    // Hàm xoá
    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xoá vĩnh viễn log này?')) return;
        try {
            await api.delete(`/admin/reactivations/history/${id}`);
            fetchHistory(); // Reload lại list
        } catch (error) {
            alert('Xoá thất bại: ' + (error.response?.data?.message || error.message));
        }
    };

    // Nội dung Footer (Nút đóng)
    const renderFooter = (
        <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
        >
            Đóng
        </button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="LỊCH SỬ DUYỆT TÀI KHOẢN"
            size="max-w-5xl"
            footer={renderFooter}
        >
            <div className="space-y-4">
                {/* --- Toolbar: Mobile First Layout --- */}
                {/* Mobile: Search dòng 1, Filter + Refresh dòng 2 */}
                {/* Desktop (md): Tất cả 1 dòng */}
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search Box: Full width mobile, Flex-1 desktop */}
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm username hoặc email..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Group Filter + Refresh: Chia dòng trên mobile */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            className="flex-1 md:w-auto bg-slate-900 border border-slate-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-blue-500"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">TẤT CẢ</option>
                            <option value="approved">APPROVED</option>
                            <option value="rejected">REJECTED</option>
                        </select>

                        <button
                            onClick={fetchHistory}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white transition-colors shrink-0"
                            title="Làm mới"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* --- Table Content --- */}
                {/* overflow-x-auto giúp bảng không vỡ trên mobile mà sẽ cuộn ngang */}
                <div className="overflow-x-auto border border-slate-700 rounded-lg">
                    <table className="w-full text-left border-collapse whitespace-nowrap"> {/* whitespace-nowrap giúp text không bị xuống dòng lộn xộn trong bảng mobile */}
                        <thead>
                            <tr className="bg-slate-900 text-slate-400 text-sm uppercase">
                                <th className="p-3 border-b border-slate-700">User</th>
                                <th className="p-3 border-b border-slate-700">Email</th>
                                <th className="p-3 border-b border-slate-700">Ngày xử lý</th>
                                <th className="p-3 border-b border-slate-700">Trạng thái</th>
                                <th className="p-3 border-b border-slate-700 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-200">
                            {/* ... (phần body bảng giữ nguyên như cũ) ... */}
                            {/* Nhớ copy lại đoạn map data ở tin nhắn trước vào đây nhé */}
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Đang tải...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Không có dữ liệu.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-700/50 transition-colors">
                                        <td className="p-3 font-medium text-white">{item.User?.username || 'Unknown'}</td>
                                        <td className="p-3 text-slate-400">{item.User?.email || 'N/A'}</td>
                                        <td className="p-3 text-sm">{new Date(item.updatedAt).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${item.status === 'approved'
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {item.status ? item.status.toUpperCase() : ''}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-400 hover:bg-slate-700 p-2 rounded">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Pagination --- */}
                {/* Giữ nguyên như cũ */}
                <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-slate-400">
                        Trang <span className="text-white font-bold">{page}</span> / {totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-slate-700 rounded hover:bg-slate-700 disabled:opacity-50 text-white">
                            <ChevronLeft size={18} />
                        </button>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-slate-700 rounded hover:bg-slate-700 disabled:opacity-50 text-white">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}