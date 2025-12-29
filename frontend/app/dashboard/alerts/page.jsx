// frontend/app/dashboard/alerts/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import {
    PlusCircle, Trash2, Search, CheckCircle, AlertCircle as AlertIcon,
    ChevronLeft, ChevronRight, FilePlus, RefreshCw, X, Loader2, Lock
} from 'lucide-react';
import Link from 'next/link';
import { api, fetcher } from '@/utils/api';
import { useAuth } from '@/app/providers.jsx';
import { TIER_PLANS } from '@/utils/subscriptionPlans';

import Modal from '@/app/components/Modal';
import FilterBar from '@/app/components/FilterBar';
import AlertCard, { AlertCardSkeleton } from '@/app/components/AlertCard';
import AlertModal from '@/app/components/AlertModal';
import useDebounce from '@/hooks/useDebounce';

const PLATFORM_OPTIONS = ['Facebook', 'Instagram', 'News', 'Forum', 'Threads', 'Tiktok', 'X', 'Youtube', 'Blog'];
const ALERT_SEARCH_FIELDS = ['Title', 'Description', 'Keywords'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const ITEMS_PER_PAGE = 5;

export default function AlertsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const isFreeTier = user && user.subscriptionTier === 'Free';
    const { mutate: globalMutate } = useSWRConfig();
    const { data: statsData, isLoading: isStatsLoading } = useSWR(user ? '/api/alerts/stats' : null, fetcher);

    // Tính toán giới hạn
    const { alertLimit, keywordLimit, currentAlertCount, hasReachedAlertLimit } = useMemo(() => {
        if (!user) return { hasReachedAlertLimit: true };
        const plan = TIER_PLANS[user.subscriptionTier] || {};
        const limit = plan.limits?.alerts || 0;
        const current = statsData?.totalAlerts || 0;
        return {
            alertLimit: limit,
            keywordLimit: plan.limits?.keywords || 0,
            currentAlertCount: current,
            hasReachedAlertLimit: current >= limit
        };
    }, [user, statsData]);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [searchFields, setSearchFields] = useState({ title: true, description: false, keywords: true });
    const [filters, setFilters] = useState({ status: [], severity: [], platforms: [] });

    // States cho chức năng chính
    const [isScanning, setIsScanning] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    // States cho Modal & Form
    const [modalState, setModalState] = useState({ isOpen: false, type: 'create', data: null });
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [modalErrors, setModalErrors] = useState({});

    const [selectedAlerts, setSelectedAlerts] = useState([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // API Query
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams({ page: currentPage.toString(), limit: ITEMS_PER_PAGE.toString() });
        const activeFields = Object.keys(searchFields).filter(f => searchFields[f]);
        if (debouncedSearchTerm && activeFields.length > 0) {
            params.append('search', debouncedSearchTerm);
            params.append('fields', activeFields.join(','));
        }
        if (filters.status.length) params.append('statuses', filters.status.join(','));
        if (filters.severity.length) params.append('severities', filters.severity.join(','));
        if (filters.platforms.length) params.append('platforms', filters.platforms.join(','));
        return `/api/alerts?${params.toString()}`;
    }, [currentPage, debouncedSearchTerm, searchFields, filters]);

    const { data, error, isLoading: isSWRLoading, mutate } = useSWR(apiUrl, fetcher, { keepPreviousData: true });
    const alerts = data?.alerts || [];
    const totalPages = data?.totalPages || 1;
    const isLoading = (isSWRLoading && !data) || isAuthLoading || isStatsLoading;

    useEffect(() => { if (currentPage !== 1) setCurrentPage(1); }, [debouncedSearchTerm, searchFields, filters]);

    const showMessage = (type, text) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
    };

    const handleOpenModal = (type, data = null) => {
        setModalErrors({});
        setIsModalLoading(false);
        setModalState({ isOpen: true, type, data });
    };
    const handleCloseModal = () => setModalState({ isOpen: false, type: 'create', data: null });

    const handleModalSubmit = async (formData) => {
        setIsModalLoading(true);
        setModalErrors({});

        try {
            let message = '';
            if (modalState.type === 'create') {
                const payload = {
                    title: formData.title,
                    description: formData.description,
                    keywords: formData.keywords,
                    platforms: formData.platforms,
                    severity: formData.severity
                };
                await api('alerts', { method: 'POST', body: JSON.stringify(payload) });
                message = `Alert "${formData.title}" created successfully!`;
                if (currentPage !== 1) setCurrentPage(1);
            } else {
                await api(`alerts/${formData.id}`, { method: 'PUT', body: JSON.stringify(formData) });
                message = `Alert "${formData.title}" updated successfully!`;
            }

            handleCloseModal();
            showMessage('success', message);
            mutate();
            globalMutate('/api/alerts/stats');

        } catch (err) {
            console.error("Submit Failed:", err);
            const msg = err.message || "Operation failed";
            try {
                const parsed = JSON.parse(msg);
                if (parsed.errors) {
                    const backendErrors = {};
                    parsed.errors.forEach(e => backendErrors[e.path] = e.msg);
                    setModalErrors(backendErrors);
                } else {
                    setModalErrors({ general: parsed.message || msg });
                }
            } catch {
                setModalErrors({ general: msg });
            }
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId || isProcessing) return;
        setIsProcessing(true);
        try {
            await api(`alerts/${confirmDeleteId}`, { method: 'DELETE' });
            mutate();
            globalMutate('/api/alerts/stats');
            if (alerts.length === 1 && currentPage > 1) setCurrentPage(curr => curr - 1);
            showMessage('success', 'Alert deleted successfully.');
        } catch (err) { console.error(err); showMessage('error', 'Failed to delete alert.'); }
        finally { setIsProcessing(false); setConfirmDeleteId(null); }
    };

    const handleSelectAlert = (id) => setSelectedAlerts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const handleBulkAction = async (action) => {
        if (!selectedAlerts.length || isProcessing) return;
        setIsProcessing(true);
        showMessage('info', 'Processing bulk action...');
        try {
            if (action === 'delete') {
                const res = await api('alerts/bulk-delete', { method: 'DELETE', body: JSON.stringify({ alertIds: selectedAlerts }) });
                showMessage('success', res.message || 'Selected alerts deleted.');
                setSelectedAlerts([]);
                mutate();
                globalMutate('/api/alerts/stats');
            } else if (action === 'create_case_study') {
                const res = await api('casestudies/bulk-create', { method: 'POST', body: JSON.stringify({ alertIds: selectedAlerts }) });
                showMessage('success', res.message || 'Case studies created.');
                setSelectedAlerts([]);
            }
        } catch (err) { showMessage('error', err.message || 'Action failed'); }
        finally { setIsProcessing(false); setConfirmBulkDelete(false); }
    };

    const handleScanAll = async () => {
        setIsScanning(true);
        try {
            const res = await api('alerts/scan-all', { method: 'POST' });
            showMessage('success', res.message || 'Scan completed!');
            mutate();
        } catch (err) { showMessage('error', err.message || 'Scan failed.'); }
        finally { setIsScanning(false); }
    };

    return (
        <div className="container mx-auto p-3 sm:p-6 lg:p-8 py-6 overflow-x-hidden min-h-screen">
            {/* Header & Main Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Manage Alerts</h1>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {/* Create Button */}
                    <button
                        onClick={() => handleOpenModal('create')}
                        disabled={hasReachedAlertLimit || isLoading}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 h-12 rounded-lg text-white font-semibold transition-all ${hasReachedAlertLimit
                            ? 'bg-slate-700 opacity-70 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {hasReachedAlertLimit ? <Lock size={20} /> : <PlusCircle size={20} />}
                        Create New Alert
                    </button>

                    {/* Scan Button */}
                    <button onClick={handleScanAll} disabled={isScanning} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 h-12 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 font-semibold transition-all">
                        {isScanning ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />} {isScanning ? 'Scanning...' : 'Scan All Posts'}
                    </button>
                </div>
            </div>

            {/* --- ALERT LIMIT WARNING --- */}
            {hasReachedAlertLimit && !isLoading && (
                <div className="mb-6 animate-fade-in-down">
                    <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="bg-red-500/20 p-2 rounded-full flex-shrink-0">
                                <Lock size={18} className="text-red-400" />
                            </div>
                            <div>
                                <h4 className="text-red-200 font-semibold text-sm">Limit Reached</h4>
                                <p className="text-red-300/80 text-xs sm:text-sm mt-0.5">
                                    You have used{" "}
                                    <strong>
                                        {currentAlertCount}/{alertLimit}
                                    </strong>
                                    {" "}Alerts allowed in your current plan.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/buy"
                            className="w-full sm:w-auto text-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap"
                        >
                            Upgrade Plan
                        </Link>
                    </div>
                </div>
            )}

            {/* Notification Area */}
            {statusMessage.text && (
                <div className={`fixed top-4 right-4 z-[9999] shadow-2xl min-w-[300px] p-4 rounded-lg flex items-center gap-3 text-sm animate-fade-in-down ${statusMessage.type === 'success' ? 'bg-green-800 text-green-100 border border-green-600' : statusMessage.type === 'error' ? 'bg-red-800 text-red-100 border border-red-600' : 'bg-blue-800 text-blue-100'}`}>
                    {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertIcon size={20} />}
                    <span className="font-medium">{statusMessage.text}</span>
                </div>
            )}

            {/* Bulk Actions Banner */}
            {selectedAlerts.length > 0 && (
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center bg-slate-700/50 p-4 rounded-lg sticky top-4 z-10 backdrop-blur-sm border border-slate-600 gap-4">
                    <div className="flex items-center gap-4 text-white font-semibold">
                        <span>
                            {selectedAlerts.length} alert(s) selected
                        </span>
                        <button
                            onClick={() => setSelectedAlerts([])}
                            className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                            <X size={16} />
                            Clear
                        </button>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => handleBulkAction('create_case_study')}
                            disabled={isProcessing || isFreeTier}
                            className={`flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg w-full sm:w-auto font-semibold ${isFreeTier ? 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {isFreeTier ? <Lock size={18} /> : <FilePlus size={20} />}
                            Create Case Studies
                        </button>

                        <button
                            onClick={() => setConfirmBulkDelete(true)}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 w-full sm:w-auto font-semibold">
                            <Trash2 size={20} />
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-slate-800/50 p-3 sm:p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Existing Alerts</h2>
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search alerts..."
                    availableFields={ALERT_SEARCH_FIELDS}
                    activeFields={searchFields}
                    onFieldChange={f => setSearchFields(p => ({
                        ...p, [f.toLowerCase()]: !p[f.toLowerCase()]
                    }))}
                    platformOptions={PLATFORM_OPTIONS}
                    selectedPlatforms={filters.platforms}
                    onPlatformChange={p => setFilters(prev => ({
                        ...prev, platforms: p
                    }))}
                    statusOptions={STATUS_OPTIONS}
                    selectedStatus={filters.status}
                    onStatusChange={s => setFilters(prev => ({
                        ...prev, status: s
                    }))}
                    severityOptions={SEVERITY_OPTIONS}
                    selectedSeverity={filters.severity}
                    onSeverityChange={s => setFilters(prev => ({
                        ...prev, severity: s
                    }))}
                />

                {isLoading ? <div
                    className="space-y-4 py-10">{[
                        ...Array(ITEMS_PER_PAGE)
                    ].map((_, i) =>
                        <AlertCardSkeleton key={i} />)}
                </div> : error ?
                    <div
                        className="text-center py-10 text-red-300">
                        Error loading alerts.
                        <button onClick={() => mutate()}
                            className="underline">
                            Retry
                        </button>
                    </div> : alerts.length > 0 ?
                        <div className="space-y-4">
                            {alerts.map(alert =>
                                <AlertCard key={alert.id}
                                    alert={alert}
                                    isSelected={selectedAlerts.includes(alert.id)}
                                    onSelect={handleSelectAlert}
                                    onEdit={() => handleOpenModal('edit', alert)}
                                    onDelete={() => setConfirmDeleteId(alert.id)}
                                />)}
                        </div> :
                        <div
                            className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-700 rounded-lg">
                            <AlertIcon
                                className="mx-auto h-12 w-12 text-slate-500 mb-2" />
                            <h3>
                                No Alerts Found
                            </h3>
                            <button
                                onClick={() => handleOpenModal('create')}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
                                Create New Alert
                            </button>
                        </div>}

                {!isLoading && totalPages > 1 &&
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button
                            onClick={() => setCurrentPage(c => c - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-slate-700 rounded text-white disabled:opacity-50">
                            Prev
                        </button>
                        <span
                            className="text-sm text-gray-400">
                            Page {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(c => c + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-slate-700 rounded text-white disabled:opacity-50">
                            Next
                        </button>
                    </div>}
            </div>

            {/* Modal & Dialogs */}
            {modalState.isOpen && (
                <AlertModal
                    isOpen={modalState.isOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleModalSubmit}
                    initialData={modalState.data}
                    keywordLimit={keywordLimit}
                    isLoading={isModalLoading}
                    serverErrors={modalErrors}
                />
            )}
            {confirmDeleteId &&
                <Modal
                    isOpen={true}
                    onClose={() => setConfirmDeleteId(null)}
                    title="Delete Alert"
                    footer={<div
                        className="flex justify-end gap-3">
                        <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 bg-slate-600 rounded text-white">
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-red-600 rounded text-white">
                            Delete
                        </button>
                    </div>}>
                    <p
                        className="text-slate-300">
                        Are you sure?
                    </p>
                </Modal>}
                
            {confirmBulkDelete &&
                <Modal
                    isOpen={true}
                    onClose={() => setConfirmBulkDelete(false)}
                    title="Bulk Delete"
                    footer={<div
                        className="flex justify-end gap-3">
                        <button
                            onClick={() => setConfirmBulkDelete(false)}
                            className="px-4 py-2 bg-slate-600 rounded text-white">
                            Cancel
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-red-600 rounded text-white">
                            Delete All
                        </button>
                    </div>}>
                    <p
                        className="text-slate-300">
                        Delete {selectedAlerts.length} items?
                    </p>
                </Modal>}
        </div>
    );
}