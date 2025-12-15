// frontend/app/admin/subscriptions/page.jsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { swrFetcher, handleAdminSubRequest, deleteAdminSubRequest } from '@/utils/api';
import {
    CheckCircle, XCircle, Loader2, CreditCard,
    User, Clock, Trash2, MessageSquare,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Modal from '@/app/components/Modal';
import FilterBar from '@/app/components/FilterBar'; // Import FilterBar có sẵn

export default function AdminSubscriptions() {
    // Endpoint lấy danh sách
    const endpoint = 'subscription/admin/list';
    const { data: requests, error, isLoading } = useSWR(endpoint, swrFetcher);

    // --- State cho Modal Xử lý ---
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState(null); // 'APPROVE' | 'REJECT'
    const [adminNote, setAdminNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // --- State cho Filter & Pagination ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState([]); // Mảng trạng thái (cho MultiSelect)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- Logic Lọc & Phân trang ---

    // 1. Reset về trang 1 khi filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus]);

    // 2. Tính toán danh sách đã lọc
    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        return requests.filter(req => {
            const email = req.User?.email?.toLowerCase() || '';
            const search = searchTerm.toLowerCase();

            // Lọc theo từ khóa (Email)
            const matchesSearch = email.includes(search);

            // Lọc theo Status (MultiSelect)
            // Nếu mảng rỗng -> Coi như chọn tất cả (All)
            // Nếu mảng có giá trị -> Chỉ lấy item có status nằm trong mảng
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(req.status);

            return matchesSearch && matchesStatus;
        });
    }, [requests, searchTerm, selectedStatus]);

    // 3. Cắt danh sách theo trang hiện tại
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

    // --- Handlers ---

    const openModal = (request, type) => {
        setSelectedRequest(request);
        setActionType(type);
        setAdminNote('');
    };

    // Gọi API xử lý (Approve/Reject)
    const handleSubmit = async () => {
        if (!selectedRequest || !actionType) return;

        setIsProcessing(true);
        try {
            // Gọi API
            await handleAdminSubRequest(selectedRequest.id, actionType, adminNote);

            // Optimistic Update
            if (requests) {
                mutate(endpoint, requests.map(req =>
                    req.id === selectedRequest.id ? { ...req, status: actionType, adminNote: adminNote } : req
                ), false);
            }

            toast.success(`Request ${actionType.toLowerCase()}ed successfully!`);
            mutate(endpoint);
            setSelectedRequest(null);

        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to process request');
        } finally {
            setIsProcessing(false);
        }
    };

    // Xử lý Xóa
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this history permanently?")) return;

        try {
            await deleteAdminSubRequest(id);
            // Update ngay lập tức
            if (requests) {
                mutate(endpoint, requests.filter(req => req.id !== id), false);
            }
            toast.success("Deleted successfully!");
            mutate(endpoint);
        } catch (error) {
            console.error(error);
            toast.error("Error deleting: " + error.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'text-green-400 bg-green-500/10 border-green-500/50';
            case 'REJECTED': return 'text-red-400 bg-red-500/10 border-red-500/50';
            default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50';
        }
    };

    if (isLoading) return <div className="flex justify-center py-10 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading requests...</div>;
    if (error) return <div className="text-center py-10 text-red-400">Failed to load requests.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="text-blue-500" />
                        Subscription Requests
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Manage VIP/Pro upgrade requests</p>
                </div>
            </div>

            {/* --- FILTER BAR (Tích hợp component có sẵn) --- */}
            <FilterBar
                // Search props
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email..."

                // Status Filter props
                statusOptions={['PENDING', 'APPROVED', 'REJECTED']}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
            />

            {/* --- LIST VIEW --- */}
            {(!filteredRequests || filteredRequests.length === 0) ? (
                <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                    No requests found matching your filters.
                </div>
            ) : (
                <>
                    {/* MOBILE VIEW (Cards) */}
                    <div className="md:hidden flex flex-col gap-4">
                        {currentItems.map((req) => (
                            <div key={req.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm flex flex-col gap-4 hover:border-slate-600 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-white truncate text-base">{req.User?.email || 'Unknown'}</h3>
                                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                <span>Current: <span className="text-gray-300 font-medium">{req.User?.subscriptionTier || 'N/A'}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider ${getStatusColor(req.status)}`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="pl-12 space-y-3">
                                    <div className="flex items-center justify-between text-sm bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                        <span className="text-gray-400">Requested Plan:</span>
                                        <span className="text-blue-400 font-bold text-base">{req.plan}</span>
                                    </div>

                                    {/* Admin Note */}
                                    {req.adminNote && (
                                        <div className="flex items-start gap-2 text-xs text-gray-400 bg-slate-700/30 p-2 rounded">
                                            <MessageSquare size={14} className="shrink-0 mt-0.5 text-yellow-500" />
                                            <span><span className="text-yellow-500 font-medium">Note:</span> {req.adminNote}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Clock size={12} />
                                        {req.createdAt ? format(new Date(req.createdAt), 'MMM dd, yyyy HH:mm') : '-'}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                                    {req.status === 'PENDING' ? (
                                        <>
                                            <button
                                                onClick={() => openModal(req, 'APPROVE')}
                                                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={16} /> Approve
                                            </button>
                                            <button
                                                onClick={() => openModal(req, 'REJECT')}
                                                className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-600/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={16} /> Reject
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleDelete(req.id)}
                                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP VIEW (Table) */}
                    <div className="hidden md:block bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto shadow-sm">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-300 border-b border-slate-700 text-xs uppercase font-semibold">
                                    <th className="p-4 w-[25%] min-w-[200px]">User Info</th>
                                    <th className="p-4 w-[12%]">Current Plan</th>
                                    <th className="p-4 w-[12%]">Req. Plan</th>
                                    <th className="p-4 w-[12%]">Status</th>
                                    <th className="p-4 w-[15%]">Date</th>
                                    <th className="p-4 w-[24%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {currentItems.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-white break-all">{req.User?.email || 'Unknown'}</div>
                                            {req.adminNote && (
                                                <div className="text-xs text-yellow-500/80 mt-1 truncate max-w-[200px]" title={req.adminNote}>
                                                    Note: {req.adminNote}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-400">{req.User?.subscriptionTier || 'N/A'}</td>
                                        <td className="p-4 font-bold text-blue-400">{req.plan}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                                            {req.createdAt ? format(new Date(req.createdAt), 'MMM dd, yyyy HH:mm') : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {req.status === 'PENDING' ? (
                                                    <>
                                                        <button onClick={() => openModal(req, 'APPROVE')} className="px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded transition-colors flex items-center gap-1" title="Approve">
                                                            <CheckCircle size={16} /> <span className="hidden lg:inline">Approve</span>
                                                        </button>
                                                        <button onClick={() => openModal(req, 'REJECT')} className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors flex items-center gap-1" title="Reject">
                                                            <XCircle size={16} /> <span className="hidden lg:inline">Reject</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => handleDelete(req.id)} className="px-3 py-1.5 bg-gray-700 text-gray-400 hover:bg-red-500 hover:text-white rounded transition-colors flex items-center gap-1" title="Delete">
                                                        <Trash2 size={16} /> <span className="hidden lg:inline">Delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* --- PAGINATION CONTROLS --- */}
                    {filteredRequests.length > 0 && (
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-700/50">
                            <div className="text-sm text-gray-400">
                                Showing <span className="font-bold text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-white">{Math.min(indexOfLastItem, filteredRequests.length)}</span> of <span className="font-bold text-white">{filteredRequests.length}</span> results
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
                </>
            )}

            {/* MODAL APPROVE / REJECT */}
            {selectedRequest && (
                <Modal
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    title={actionType === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
                >
                    <div className="space-y-4">
                        <div className={`p-3 rounded-lg border ${actionType === 'APPROVE' ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                            <p className={`text-sm ${actionType === 'APPROVE' ? 'text-green-300' : 'text-red-300'}`}>
                                You are about to <b>{actionType}</b> the subscription request for <b>{selectedRequest.User?.email}</b> to plan <b>{selectedRequest.plan}</b>.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                                <MessageSquare size={16} />
                                Admin Note (Optional)
                            </label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Enter a message for the user..."
                                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none text-sm placeholder-gray-600"
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isProcessing}
                                className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 text-sm disabled:opacity-50 ${actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                                    }`}
                            >
                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : null}
                                Confirm {actionType === 'APPROVE' ? 'Approval' : 'Rejection'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}