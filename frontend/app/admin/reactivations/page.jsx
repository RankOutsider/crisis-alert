// frontend/app/admin/reactivations/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { swrFetcher, api } from '@/utils/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
    CheckCircle, XCircle, Loader2, Clock,
    User, Mail, MessageSquare, AlertCircle,
    ChevronLeft, ChevronRight, History
} from 'lucide-react';
import Modal from '@/app/components/Modal';
import FilterBar from '@/app/components/FilterBar';
import useDebounce from '@/hooks/useDebounce';
import ReactivationHistoryModal from '@/app/components/ReactivationHistoryModal';

export default function ReactivationRequestsPage() {
    // --- FETCH DATA ---
    const endpoint = '/admin/reactivation-requests';
    const { data, error, isLoading } = useSWR(endpoint, swrFetcher);

    // Xử lý dữ liệu trả về
    const allRequests = Array.isArray(data) ? data : (data?.requests || []);

    // --- STATE UI ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- State cho Modal Xử lý ---
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [adminReason, setAdminReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // --- State cho Modal Lịch sử ---
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // --- DEBOUNCE SEARCH ---
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- LOGIC LỌC ---
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedStatus]);

    const filteredRequests = useMemo(() => {
        return allRequests.filter(req => {
            const username = req.User?.username?.toLowerCase() || '';
            const email = req.User?.email?.toLowerCase() || '';
            const search = debouncedSearchTerm.toLowerCase();
            const matchesSearch = username.includes(search) || email.includes(search);
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(req.status);
            return matchesSearch && matchesStatus;
        });
    }, [allRequests, debouncedSearchTerm, selectedStatus]);

    // --- PHÂN TRANG ---
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // --- HANDLERS ---
    const openModal = (request, type) => {
        setSelectedRequest(request);
        setActionType(type);
        setAdminReason('');
    };

    const handleSubmit = async () => {
        if (!selectedRequest || !actionType) return;
        setIsProcessing(true);
        try {
            const apiEndpoint = `admin/reactivation-requests/${selectedRequest.id}/${actionType}`;
            await api(apiEndpoint, {
                method: 'PUT',
                body: JSON.stringify({ adminReason })
            });

            const updatedRequests = allRequests.map(req =>
                req.id === selectedRequest.id
                    ? { ...req, status: actionType === 'approve' ? 'APPROVED' : 'REJECTED' }
                    : req
            );

            mutate(endpoint, { ...data, requests: updatedRequests }, false);
            toast.success(`Request ${actionType}ed successfully!`);
            mutate(endpoint);
            setSelectedRequest(null);
        } catch (err) {
            toast.error(err.message || "Failed to process request");
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        }
    };

    if (isLoading) return <div className="flex justify-center py-10 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading requests...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Failed to load requests</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Clock className="text-yellow-500" />
                            Reactivations <span className="text-gray-500 text-lg font-normal">({filteredRequests.length})</span>
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">Manage account unlocking requests</p>
                    </div>

                    {/* NÚT MỞ LỊCH SỬ */}
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-slate-600 shadow-sm"
                    >
                        <History size={18} />
                        <span>History Log</span>
                    </button>
                </div>

                {/* FILTER BAR */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by username or email..."
                    statusOptions={['PENDING', 'APPROVED', 'REJECTED']}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                />
            </div>

            {/* CONTENT */}
            {filteredRequests.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl p-10 text-center border border-slate-700 border-dashed flex flex-col items-center gap-3">
                    <CheckCircle size={40} className="text-green-500/50" />
                    <p className="text-gray-400">No pending requests found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentItems.map((req) => (
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
                                <span className={`text-xs px-2 py-1 rounded border font-medium shrink-0 ${getStatusBadge(req.status)}`}>
                                    {req.status}
                                </span>
                            </div>

                            <div className="mb-4 p-3 bg-slate-900/50 rounded-lg text-sm text-gray-300 border border-slate-700/50 flex-grow">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                    <Clock size={12} /> Requested: {req.createdAt ? format(new Date(req.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                                </p>
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
                                    <span className="italic text-gray-400">
                                        {req.reason ? `"${req.reason}"` : "Requesting account reactivation due to admin lock."}
                                    </span>
                                </div>
                            </div>

                            {req.status === 'PENDING' && (
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
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
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

            {/* MODAL LỊCH SỬ */}
            <ReactivationHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
            />
        </div>
    );
}