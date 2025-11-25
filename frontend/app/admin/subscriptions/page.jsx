// frontend/app/admin/subscriptions/page.jsx
'use client';

import useSWR, { mutate } from 'swr';
import { swrFetcher, handleAdminSubRequest, deleteAdminSubRequest } from '@/utils/api';
import { CheckCircle, XCircle, Loader2, CreditCard, User, Clock, Trash2, MessageSquare } from 'lucide-react';

export default function AdminSubscriptions() {
    // Endpoint lấy danh sách
    const endpoint = 'subscription/admin/list';

    const { data: requests, error, isLoading } = useSWR(endpoint, swrFetcher);

    // Xử lý Duyệt/Từ chối (Có nhập Note)
    const handleAction = async (id, status) => {
        const actionName = status === 'APPROVED' ? 'APPROVE' : 'REJECT';

        // 1. Hiện hộp thoại nhập lý do (Tùy chọn)
        // Nếu Admin không nhập gì (để trống), Backend sẽ tự lấy câu thông báo mặc định.
        const note = window.prompt(
            `You are about to ${actionName} this request.\n\nEnter a message for the user (Optional):`,
            ""
        );

        // Nếu bấm Cancel (null) thì hủy thao tác
        if (note === null) return;

        try {
            // 2. Gọi API với note vừa nhập
            await handleAdminSubRequest(id, status, note);

            // 3. Optimistic Update (Cập nhật UI ngay lập tức)
            if (requests) {
                mutate(endpoint, requests.map(req =>
                    req.id === id ? { ...req, status: status, adminNote: note } : req
                ), false);
            }

            // Refresh data thật từ server
            mutate(endpoint);
            alert(`Request ${status.toLowerCase()} successfully!`);

        } catch (error) {
            alert(error.message || 'Failed to process request');
        }
    };

    // Xử lý Xóa
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this history permanently?")) return;

        try {
            await deleteAdminSubRequest(id);
            if (requests) {
                mutate(endpoint, requests.filter(req => req.id !== id), false);
            }
            alert("Deleted successfully!");
        } catch (error) {
            console.error(error);
            alert("Error deleting: " + error.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'text-green-400 bg-green-500/10 border-green-500/50';
            case 'REJECTED': return 'text-red-400 bg-red-500/10 border-red-500/50';
            default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50';
        }
    };

    if (isLoading) return <div className="flex justify-center py-8 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
    if (error) return <div className="text-center py-10 text-red-400">Failed to load requests.</div>;

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold">Subscription Requests</h1>

            {(!requests || requests.length === 0) && (
                <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-xl border border-gray-700">No pending requests.</div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {requests && requests.map((req) => (
                    <div key={req.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-600 transition-colors">

                        {/* Info Section */}
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-base md:text-lg text-white break-all">
                                    {req.User?.email || 'Unknown User'}
                                </span>
                                <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(req.status)}`}>
                                    {req.status}
                                </span>
                            </div>

                            <div className="text-sm text-gray-400 flex flex-col sm:flex-row gap-2 sm:gap-6">
                                <span className="flex items-center gap-1">
                                    <User size={14} className="shrink-0" />
                                    Current: {req.User?.subscriptionTier || 'N/A'}
                                </span>
                                <span className="flex items-center gap-1 text-blue-400">
                                    <CreditCard size={14} className="shrink-0" />
                                    Request: {req.plan}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={14} className="shrink-0" />
                                    {new Date(req.createdAt).toLocaleString()}
                                </span>
                            </div>

                            {/* [MỚI] Hiển thị Admin Note nếu có */}
                            {req.adminNote && (
                                <div className="flex items-start gap-2 text-xs text-yellow-100 bg-yellow-500/10 p-2 rounded border border-yellow-500/20 mt-2">
                                    <MessageSquare size={14} className="shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="text-yellow-500">Admin Note:</strong> {req.adminNote}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons Group */}
                        <div className="flex items-center gap-3 self-start md:self-center mt-4 md:mt-0">

                            {/* Nhóm nút PENDING */}
                            {req.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => handleAction(req.id, 'APPROVED')}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors shadow-lg shadow-green-900/20"
                                    >
                                        <CheckCircle size={18} /> <span className="hidden sm:inline">Approve</span>
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-lg shadow-red-900/20"
                                    >
                                        <XCircle size={18} /> <span className="hidden sm:inline">Reject</span>
                                    </button>
                                </>
                            )}

                            {/* Nút Xóa */}
                            {(req.status === 'APPROVED' || req.status === 'REJECTED') && (
                                <button
                                    onClick={() => handleDelete(req.id)}
                                    className="p-2 bg-gray-700 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-lg transition-all border border-gray-600 hover:border-red-500/50"
                                    title="Delete History"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}