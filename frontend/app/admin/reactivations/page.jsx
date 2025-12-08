// frontend/app/admin/reactivations/page.jsx
'use client';
import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { swrFetcher, api } from '@/utils/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
    CheckCircle, XCircle, Loader2, Clock,
    User, Mail, MessageSquare, AlertCircle,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import Modal from '@/app/components/Modal';

export default function ReactivationRequestsPage() {
    const [page, setPage] = useState(1);

    // --- State cho Modal Xử lý ---
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
    const [adminReason, setAdminReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch requests
    const endpoint = `/admin/reactivation-requests?page=${page}&limit=10`;

    // Thêm keepPreviousData để chuyển trang mượt hơn
    const { data, error, isLoading } = useSWR(endpoint, swrFetcher, {
        keepPreviousData: true,
    });

    // Scroll lên đầu khi đổi trang
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const totalPages = data?.pages || 1;

    // Mở Modal
    const openModal = (request, type) => {
        setSelectedRequest(request);
        setActionType(type);
        setAdminReason(''); // Reset lý do
    };

    // Gọi API xử lý
    const handleSubmit = async () => {
        if (!selectedRequest || !actionType) return;

        setIsProcessing(true);
        try {
            const apiEndpoint = `admin/reactivation-requests/${selectedRequest.id}/${actionType}`;

            await api(apiEndpoint, {
                method: 'PUT',
                body: JSON.stringify({ adminReason })
            });

            toast.success(`Request ${actionType}ed successfully!`);
            mutate(endpoint); // Refresh lại danh sách
            setSelectedRequest(null); // Đóng modal

        } catch (err) {
            toast.error(err.message || "Failed to process request");
        } finally {
            setIsProcessing(false);
        }
    };

    // Pagination Component
    const Pagination = () => (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:inline">Page {page} of {totalPages}</span>
            <div className="flex space-x-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 transition-colors"><ChevronLeft size={20} /></button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 transition-colors"><ChevronRight size={20} /></button>
            </div>
        </div>
    );

    if (error) return <div className="p-10 text-center text-red-500">Failed to load requests</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Clock className="text-yellow-500" />
                        Reactivation Requests
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Manage account unlocking requests</p>
                </div>

                {/* Top Pagination */}
                <Pagination />
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex justify-center py-10 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading requests...</div>
            ) : data?.requests?.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl p-10 text-center border border-slate-700 border-dashed flex flex-col items-center gap-3">
                    <CheckCircle size={40} className="text-green-500/50" />
                    <p className="text-gray-400">All caught up! No pending requests.</p>
                </div>
            ) : (
                /* Grid Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data?.requests?.map((req) => (
                        <div key={req.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors shadow-sm flex flex-col h-full animate-fadeIn">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-white truncate" title={req.User?.username}>{req.User?.username || 'Unknown'}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 truncate">
                                            <Mail size={12} className="shrink-0" /> <span className="truncate">{req.User?.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500/20 font-medium shrink-0">
                                    Pending
                                </span>
                            </div>

                            <div className="mb-4 p-3 bg-slate-900/50 rounded-lg text-sm text-gray-300 border border-slate-700/50 flex-grow">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                    <Clock size={12} /> Requested: {req.createdAt ? format(new Date(req.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                                </p>
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
                                    <span className="italic text-gray-400">"Requesting account reactivation due to admin lock."</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto pt-3 border-t border-slate-700/50">
                                <button
                                    onClick={() => openModal(req, 'approve')}
                                    className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                                <button
                                    onClick={() => openModal(req, 'reject')}
                                    className="flex-1 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-800/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle size={16} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Pagination */}
            <div className="flex justify-end pt-4"><Pagination /></div>

            {/* MODAL APPROVE / REJECT */}
            {selectedRequest && (
                <Modal
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    title={actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                >
                    <div className="space-y-4">
                        <div className={`p-3 rounded-lg border ${actionType === 'approve' ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                            <p className={`text-sm ${actionType === 'approve' ? 'text-green-300' : 'text-red-300'}`}>
                                You are about to <b>{actionType}</b> the reactivation request for user <b>{selectedRequest.User?.username}</b>.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                                <MessageSquare size={16} />
                                {actionType === 'approve' ? 'Admin Note (Optional)' : 'Reason for Rejection (Optional)'}
                            </label>
                            <textarea
                                value={adminReason}
                                onChange={(e) => setAdminReason(e.target.value)}
                                placeholder={actionType === 'approve' ? "Welcome back! Your account is active." : "Optional: Enter reason (e.g. Violation of terms)."}
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
                                className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 text-sm disabled:opacity-50 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                                    }`}
                            >
                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : null}
                                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}