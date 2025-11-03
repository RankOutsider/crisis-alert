// frontend/app/dashboard/alerts/page.jsx
'use client';

// --- Imports ---
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
    PlusCircle, Trash2, Edit, X, Tag, Search, CheckCircle,
    AlertCircle as AlertIcon, ChevronLeft, ChevronRight, FilePlus, RefreshCw, Globe,
    Save, Loader2 // Giữ các icon cần thiết cho UI và Modal
} from 'lucide-react';
import { api, fetcher } from '@/utils/api';
import Modal from '@/app/components/Modal';
import FilterBar from '@/app/components/FilterBar';

// --- Constants ---
const PLATFORM_OPTIONS = ['Facebook', 'Instagram', 'News', 'Forum', 'Threads', 'Tiktok', 'X', 'Youtube', 'Blog'];
const ALERT_SEARCH_FIELDS = ['Title', 'Description', 'Keywords'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const inputClasses = 'w-full px-4 py-2 bg-slate-700/80 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors break-words';
const ITEMS_PER_PAGE = 5;

// --- useDebounce Hook ---
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

// --- AlertCardSkeleton Component ---
function AlertCardSkeleton() {
    return (
        <div className="bg-slate-700/60 p-4 rounded-lg transition-colors duration-200 animate-pulse">
            <div className="flex items-start gap-4">
                {/* Checkbox Skeleton */}
                <div className="mt-1.5 h-5 w-5 rounded bg-slate-600 flex-shrink-0"></div>
                <div className="flex-grow min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        {/* Title & Description Skeleton */}
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-5 bg-slate-600 rounded w-3/4"></div> {/* Title */}
                            <div className="h-4 bg-slate-600 rounded w-full"></div> {/* Description line 1 */}
                        </div>
                        {/* Buttons/Tags Skeleton */}
                        <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
                            <div className="h-6 bg-slate-600 rounded-full w-16"></div> {/* Severity */}
                            <div className="h-6 bg-slate-600 rounded-full w-16"></div> {/* Status */}
                            <div className="h-8 w-8 bg-slate-600 rounded-full"></div> {/* Edit button */}
                            <div className="h-8 w-8 bg-slate-600 rounded-full"></div> {/* Delete button */}
                        </div>
                    </div>
                    {/* Keywords & Platforms Skeleton */}
                    <div className="mt-3 border-t border-slate-600/50 pt-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                            <div className="h-4 bg-slate-600 rounded w-20"></div>
                            <div className="h-4 bg-slate-600 rounded w-16"></div>
                            <div className="h-4 bg-slate-600 rounded w-20"></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="h-4 bg-slate-600 rounded w-24"></div>
                            <div className="h-4 bg-slate-600 rounded w-20"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- EditAlertModal Component ---
function EditAlertModal({ alert, onClose, onSave }) {
    if (!alert) return null;

    const [formData, setFormData] = useState({ ...alert });
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (errors.general) setErrors(prev => ({ ...prev, general: null }));
    };
    const handlePlatformChange = (platform) => {
        const currentPlatforms = formData.platforms || [];
        setFormData((prev) => ({
            ...prev,
            platforms: currentPlatforms.includes(platform)
                ? currentPlatforms.filter((p) => p !== platform)
                : [...(currentPlatforms || []), platform],
        }));
        if (errors.platforms) setErrors(prev => ({ ...prev, platforms: null }));
    };
    const handleAddKeyword = () => {
        const trimmed = currentKeyword.trim();
        if (trimmed && !(formData.keywords || []).includes(trimmed)) {
            setFormData((prev) => ({ ...prev, keywords: [...(prev.keywords || []), trimmed], }));
            if (errors.keywords) setErrors(prev => ({ ...prev, keywords: null }));
        }
        setCurrentKeyword('');
    };
    const handleRemoveKeyword = (kw) => {
        setFormData((prev) => ({ ...prev, keywords: (prev.keywords || []).filter((k) => k !== kw), }));
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.title || formData.title.trim() === '') newErrors.title = "Title is required.";
        if (!formData.keywords || formData.keywords.length === 0) newErrors.keywords = "At least one keyword is required.";
        if (!formData.platforms || formData.platforms.length === 0) newErrors.platforms = "At least one platform is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (validateForm()) {
            setIsSaving(true);
            try {
                await onSave(formData.id, formData);
            } catch (err) {
                const errorMessage = err.message || "Failed to update alert.";
                let backendErrors = {};
                try {
                    const parsedError = JSON.parse(errorMessage);
                    if (parsedError.errors && Array.isArray(parsedError.errors)) {
                        parsedError.errors.forEach(error => {
                            backendErrors[error.path] = error.msg;
                        });
                    } else if (parsedError.message) {
                        backendErrors = { general: parsedError.message };
                    }
                } catch (parseError) {
                    backendErrors = { general: errorMessage };
                }
                setErrors(backendErrors);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Edit Alert"
            size="max-w-2xl"
            footer={
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 font-semibold rounded-lg bg-slate-600 hover:bg-slate-700 transition-all disabled:opacity-50 w-full sm:w-auto">Cancel</button>
                    <button type="submit" form="edit-form" disabled={isSaving} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 w-full sm:w-auto">
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} id="edit-form" className="space-y-4" noValidate>
                {errors.general && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-center text-sm">
                        {errors.general}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                    <input name="title" type="text" value={formData.title || ''} onChange={handleChange}
                        className={`${inputClasses} ${errors.title ? 'border-red-500' : 'border-slate-600'}`} />
                    {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className={inputClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Keywords</label>
                    <div className="flex items-center gap-2">
                        <input type="text" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                            placeholder="Add a keyword..."
                            className={`${inputClasses} ${errors.keywords ? 'border-red-500' : 'border-slate-600'}`} />
                        <button type="button" onClick={handleAddKeyword} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0"><PlusCircle size={20} /></button>
                    </div>
                    {errors.keywords && <p className="mt-1 text-xs text-red-400">{errors.keywords}</p>}
                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                        {(formData.keywords || []).map((kw) => (<span key={kw} className="flex items-center gap-1 bg-slate-600 text-sm px-2 py-1 rounded-md">{kw}<button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-gray-400 hover:text-white"><X size={14} /></button></span>))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Platforms</label>
                    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2 p-3 rounded-lg border ${errors.platforms ? 'border-red-500' : 'border-transparent'}`}>
                        {PLATFORM_OPTIONS.map((p) => (<label key={p} className="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" checked={(formData.platforms || []).includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-600" />{p}</label>))}
                    </div>
                    {errors.platforms && <p className="mt-1 text-xs text-red-400">{errors.platforms}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Severity</label>
                    <select name="severity" value={formData.severity || 'Medium'} onChange={handleChange} className={inputClasses}>
                        <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                    </select>
                </div>
            </form>
        </Modal>
    );
}

// --- CreateAlertModal Component ---
function CreateAlertModal({ isOpen, onClose, handleCreateAlert }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        severity: 'Medium',
        keywords: [],
        platforms: []
    });
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [errors, setErrors] = useState({});
    const [isCreating, setIsCreating] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (errors.general) setErrors(prev => ({ ...prev, general: null }));
    };
    const handleAddKeyword = () => {
        const trimmed = currentKeyword.trim();
        if (trimmed && !formData.keywords.includes(trimmed)) {
            setFormData(prev => ({ ...prev, keywords: [...prev.keywords, trimmed] }));
            if (errors.keywords) setErrors(prev => ({ ...prev, keywords: null }));
        }
        setCurrentKeyword('');
    };
    const handleRemoveKeyword = (kw) => {
        setFormData(prev => ({ ...prev, keywords: formData.keywords.filter((k) => k !== kw) }));
    };
    const handlePlatformChange = (p) => {
        setFormData(prev => ({
            ...prev,
            platforms: formData.platforms.includes(p)
                ? formData.platforms.filter((x) => x !== p)
                : [...formData.platforms, p]
        }));
        if (errors.platforms) setErrors(prev => ({ ...prev, platforms: null }));
    };

    const resetForm = () => {
        setFormData({
            title: '', description: '', severity: 'Medium', keywords: [], platforms: []
        });
        setCurrentKeyword('');
        setErrors({});
        setIsCreating(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateAndSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        let newErrors = {};
        if (!formData.title || formData.title.trim() === '') newErrors.title = "Title is required.";
        if (formData.keywords.length === 0) newErrors.keywords = "At least one keyword is required.";
        if (formData.platforms.length === 0) newErrors.platforms = "At least one platform is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsCreating(true);
        try {
            await handleCreateAlert(formData, setErrors);
            resetForm();
            onClose();
        } catch (err) {
            setIsCreating(false);
        }
        setIsCreating(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Alert"
            size="max-w-2xl"
            footer={
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button type="button" onClick={handleClose} disabled={isCreating} className="px-4 py-2 font-semibold rounded-lg bg-slate-600 hover:bg-slate-700 transition-all disabled:opacity-50 w-full sm:w-auto">Cancel</button>
                    <button type="submit" form="create-form" disabled={isCreating} className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 w-full sm:w-auto">
                        {isCreating ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={20} />}
                        {isCreating ? 'Creating...' : 'Create Alert'}
                    </button>
                </div>
            }
        >
            <form onSubmit={validateAndSubmit} id="create-form" className="space-y-4" noValidate>
                {errors.general && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-center text-sm">
                        {errors.general}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                    <input id="title" name="title" type="text" value={formData.title} onChange={handleChange}
                        placeholder="e.g., Brand Mention Spike"
                        className={`${inputClasses} ${errors.title ? 'border-red-500' : 'border-slate-600'}`} />
                    {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3}
                        placeholder="Describe the conditions for this alert"
                        className={inputClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Keywords</label>
                    <div className="flex items-center gap-2">
                        <input type="text" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                            placeholder="Type a keyword and press Enter..."
                            className={`${inputClasses} ${errors.keywords ? 'border-red-500' : 'border-slate-600'}`} />
                        <button type="button" onClick={handleAddKeyword} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0"><PlusCircle size={20} /></button>
                    </div>
                    {errors.keywords && <p className="mt-1 text-xs text-red-400">{errors.keywords}</p>}
                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                        {formData.keywords.map((kw) => (<span key={kw} className="flex items-center gap-1 bg-slate-700 text-sm px-2 py-1 rounded-md">{kw}<button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-gray-400 hover:text-white"><X size={14} /></button></span>))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Platforms</label>
                    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2 p-3 rounded-lg border ${errors.platforms ? 'border-red-500' : 'border-transparent'}`}>
                        {PLATFORM_OPTIONS.map((p) => (<label key={p} className="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" checked={formData.platforms.includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600" />{p}</label>))}
                    </div>
                    {errors.platforms && <p className="mt-1 text-xs text-red-400">{errors.platforms}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Severity</label>
                    <select id="severity" name="severity" value={formData.severity} onChange={handleChange} className={inputClasses}>
                        <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                    </select>
                </div>
            </form>
        </Modal>
    );
}

// --- Main Page Component ---
export default function AlertsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [alertSearchFields, setAlertSearchFields] = useState({ title: true, description: false, keywords: true });
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [selectedSeverity, setSelectedSeverity] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);
    const [selectedAlerts, setSelectedAlerts] = useState([]);
    const [isCreatingBulk, setIsCreatingBulk] = useState(false);
    const [bulkMessage, setBulkMessage] = useState({ type: '', text: '' });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

    const apiUrl = useMemo(() => {
        const params = new URLSearchParams({ page: currentPage.toString(), limit: ITEMS_PER_PAGE.toString() });
        const activeFields = Object.keys(alertSearchFields).filter(field => alertSearchFields[field]);
        if (debouncedSearchTerm && activeFields.length > 0) {
            params.append('search', debouncedSearchTerm);
            params.append('fields', activeFields.join(','));
        }
        if (selectedStatus.length > 0) params.append('statuses', selectedStatus.join(','));
        if (selectedSeverity.length > 0) params.append('severities', selectedSeverity.join(','));
        if (selectedPlatforms.length > 0) params.append('platforms', selectedPlatforms.join(','));
        return `/api/alerts?${params.toString()}`;
    }, [currentPage, debouncedSearchTerm, alertSearchFields, selectedStatus, selectedSeverity, selectedPlatforms]);

    const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, { keepPreviousData: true });
    const alerts = data?.alerts || [];
    const totalPages = data?.totalPages || 1;

    useEffect(() => {
        if (currentPage !== 1) setCurrentPage(1);
    }, [debouncedSearchTerm, alertSearchFields, selectedStatus, selectedSeverity, selectedPlatforms]);

    const handleAlertSearchFieldChange = (field) => {
        setCurrentPage(1);
        setAlertSearchFields((prev) => ({ ...prev, [field.toLowerCase()]: !prev[field.toLowerCase()] }));
    };

    const handleDeleteAlert = (id) => { setConfirmDeleteId(id); };

    const executeDelete = async () => {
        if (!confirmDeleteId || isDeleting) return;
        setIsDeleting(true);
        try {
            await api(`alerts/${confirmDeleteId}`, { method: 'DELETE' });
            mutate();
            if (alerts.length === 1 && currentPage > 1) { setCurrentPage(currentPage - 1); }
        } catch (err) { console.error('Error deleting alert:', err); }
        finally { setIsDeleting(false); setConfirmDeleteId(null); }
    };

    const handleUpdateAlert = async (id, updatedData) => {
        await api(`alerts/${id}`, { method: 'PUT', body: JSON.stringify(updatedData) });
        mutate();
        handleCloseEditModal();
    };

    const handleCreateAlert = async (formData, setErrors) => {
        try {
            await api('alerts', { method: 'POST', body: JSON.stringify(formData) });
            if (currentPage !== 1) setCurrentPage(1);
            mutate();
        } catch (err) {
            console.error("Error creating alert:", err);
            const errorMessage = err.message || "Failed to create alert.";
            let backendErrors = {};
            try {
                const parsedError = JSON.parse(errorMessage);
                if (parsedError.errors && Array.isArray(parsedError.errors)) {
                    parsedError.errors.forEach(error => { backendErrors[error.path] = error.msg; });
                } else if (parsedError.message) { backendErrors = { general: parsedError.message }; }
            } catch (parseError) { backendErrors = { general: errorMessage }; }
            setErrors(backendErrors);
            throw err;
        }
    };

    const handleScanAll = async () => {
        setIsScanning(true);
        setScanMessage({ type: '', text: '' });
        try {
            const res = await api('alerts/scan-all', { method: 'POST' });
            setScanMessage({ type: 'success', text: res.message || 'Scan completed!' });
            mutate();
        } catch (err) {
            setScanMessage({ type: 'error', text: err.message || 'Scan failed.', });
        } finally {
            setIsScanning(false);
            setTimeout(() => setScanMessage({ type: '', text: '' }), 5000);
        }
    };

    const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) { setCurrentPage(newPage); } };
    const handleOpenEditModal = (alert) => { setEditingAlert(alert); setIsEditModalOpen(true); };
    const handleCloseEditModal = () => { setIsEditModalOpen(false); setEditingAlert(null); };
    const handleSelectAlert = (alertId) => { setSelectedAlerts(prev => prev.includes(alertId) ? prev.filter(id => id !== alertId) : [...prev, alertId]); };
    const handleBulkCreateCaseStudies = async () => {
        if (selectedAlerts.length === 0 || isCreatingBulk) return;
        setIsCreatingBulk(true);
        setBulkMessage({ type: 'info', text: 'Creating case studies...' });
        try {
            const response = await api('casestudies/bulk-create', { method: 'POST', body: JSON.stringify({ alertIds: selectedAlerts }) });
            setBulkMessage({ type: 'success', text: response.message || 'Case studies created successfully.' });
            setSelectedAlerts([]);
        } catch (err) {
            const errorMessage = err.message || 'Failed to create one or more case studies.';
            try {
                const parsedError = JSON.parse(errorMessage);
                if (parsedError.message) {
                    setBulkMessage({ type: 'error', text: parsedError.message });
                } else {
                    setBulkMessage({ type: 'error', text: errorMessage });
                }
            } catch (parseError) {
                setBulkMessage({ type: 'error', text: errorMessage });
            }
        } finally {
            setIsCreatingBulk(false);
            setTimeout(() => setBulkMessage({ type: '', text: '' }), 7000);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedAlerts.length === 0 || isBulkDeleting) return;
        setIsBulkDeleting(true);
        setBulkMessage({ type: '', text: '' });
        try {
            const response = await api('alerts/bulk-delete', {
                method: 'DELETE',
                body: JSON.stringify({ alertIds: selectedAlerts })
            });
            setBulkMessage({ type: 'success', text: response.message || 'Selected alerts deleted.' });
            setSelectedAlerts([]);
            mutate();
        } catch (err) {
            const errorMessage = err.message || 'Failed to delete selected alerts.';
            setBulkMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsBulkDeleting(false);
            setConfirmBulkDelete(false);
            setTimeout(() => setBulkMessage({ type: '', text: '' }), 7000);
        }
    };

    const handleClearSelection = () => setSelectedAlerts([]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Manage Alerts</h1>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all">
                        <PlusCircle size={20} /> Create New Alert
                    </button>
                    <button onClick={handleScanAll} disabled={isScanning} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <Search size={20} />{isScanning ? 'Scanning...' : 'Scan All Posts'}
                    </button>
                </div>
            </div>

            {/* Bulk Actions & Thông báo */}
            {selectedAlerts.length > 0 && (
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center bg-slate-700/50 p-4 rounded-lg sticky top-4 z-10 backdrop-blur-sm border border-slate-600 gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-white font-semibold">{selectedAlerts.length} alert(s) selected</span>
                        <button onClick={handleClearSelection} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
                            <X size={16} /> Clear selection
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleBulkCreateCaseStudies}
                            disabled={isCreatingBulk || isBulkDeleting}
                            className="flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        >
                            <FilePlus size={20} />
                            {isCreatingBulk ? 'Creating...' : 'Create Case Studies'}
                        </button>
                        <button
                            onClick={() => setConfirmBulkDelete(true)}
                            disabled={isCreatingBulk || isBulkDeleting}
                            className="flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        >
                            <Trash2 size={20} />
                            {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                        </button>
                    </div>
                </div>
            )}
            {bulkMessage.text && (<div className={`p-4 rounded-lg mb-6 flex items-center gap-3 text-sm ${bulkMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : bulkMessage.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}><AlertIcon size={20} /><span>{bulkMessage.text}</span></div>)}
            {scanMessage.text && (<div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${scanMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}><CheckCircle size={20} /><span>{scanMessage.text}</span></div>)}

            {/* Khung nội dung chính */}
            <div className="bg-slate-800/50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Existing Alerts</h2>

                {/* FilterBar */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search alerts (title, description, keywords)..."
                    availableFields={ALERT_SEARCH_FIELDS}
                    activeFields={alertSearchFields}
                    onFieldChange={handleAlertSearchFieldChange}
                    platformOptions={PLATFORM_OPTIONS}
                    selectedPlatforms={selectedPlatforms}
                    onPlatformChange={setSelectedPlatforms}
                    statusOptions={STATUS_OPTIONS}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    severityOptions={SEVERITY_OPTIONS}
                    selectedSeverity={selectedSeverity}
                    onSeverityChange={setSelectedSeverity}
                />

                {/* --- Loading State (Skeleton) --- */}
                {isLoading && !data && (
                    <div className="space-y-4 py-10">
                        {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
                            <AlertCardSkeleton key={index} />
                        ))}
                    </div>
                )}

                {/* --- Error State --- */}
                {error && (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                        <AlertIcon className="mx-auto h-12 w-12 text-red-400" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Data</h3>
                        <p className="mt-1 text-sm text-red-300">{error.message || 'Could not load alerts list.'}</p>
                        <div className="mt-6">
                            <button type="button" onClick={() => mutate()} className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* --- Data / Empty State --- */}
                {!isLoading && !error && (
                    <>
                        <div className="space-y-4">
                            {alerts.length > 0 ? (alerts.map((a) => (
                                <div key={a.id} className={`p-4 rounded-lg transition-colors duration-200 ${selectedAlerts.includes(a.id) ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-slate-700/60 hover:bg-slate-700'}`}>
                                    <div className="flex items-start gap-4">
                                        <input type="checkbox" checked={selectedAlerts.includes(a.id)} onChange={() => handleSelectAlert(a.id)} className="mt-1.5 h-5 w-5 flex-shrink-0 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-600 focus:ring-offset-slate-800 cursor-pointer" aria-label={`Select alert ${a.title}`} />
                                        <div className="flex-grow min-w-0">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <Link href={`/dashboard/alerts/${a.id}`} className="block group">
                                                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors cursor-pointer break-words line-clamp-1" title={a.title}>{a.title}</h3>
                                                    </Link>
                                                    <p className="text-sm text-gray-400 break-words mt-1 line-clamp-2" title={a.description}>{a.description || <span className="italic text-slate-500">No description</span>}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap mt-2 sm:mt-0">
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${a.severity === 'Critical' ? 'bg-red-500/20 text-red-300' : a.severity === 'High' ? 'bg-orange-500/20 text-orange-300' : a.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>{a.severity}</span>
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${a.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-slate-600/50 text-slate-400'}`}>{a.status}</span>
                                                    <button onClick={() => handleOpenEditModal(a)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-full transition-colors" aria-label="Edit Alert"><Edit size={18} /></button>
                                                    <button onClick={() => handleDeleteAlert(a.id)} className="p-2 text-red-500 hover:text-red-400 hover:bg-slate-600 rounded-full transition-colors" aria-label="Delete Alert"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                            <div className="mt-3 border-t border-slate-600/50 pt-3">
                                                <div className="flex flex-wrap items-center gap-2 break-words whitespace-normal max-w-full mb-2">
                                                    <Tag size={16} className="text-gray-400 flex-shrink-0 mr-1" />
                                                    {a.keywords?.length > 0 ? a.keywords.slice(0, 7).map((kw) => (<span key={kw} className="bg-slate-600 text-xs px-2 py-0.5 rounded">{kw}</span>)) : <span className="text-xs text-slate-500 italic">No keywords</span>}
                                                    {a.keywords?.length > 7 && <span className="text-xs text-slate-500">...</span>}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                                    <Globe size={16} className="text-gray-400 flex-shrink-0 mr-1" />
                                                    {a.platforms?.length > 0 ? a.platforms.slice(0, 5).map((p) => (<span key={p} className="bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded text-white">{p}</span>)) : <span className="text-xs text-slate-500 italic">No platforms specified</span>}
                                                    {a.platforms?.length > 5 && <span className="text-xs text-slate-500">...</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))) : (
                                <div className="text-center py-16 px-4 border-2 border-dashed border-slate-700 rounded-lg">
                                    <AlertIcon className="mx-auto h-12 w-12 text-slate-500" />
                                    <h3 className="mt-2 text-lg font-semibold text-white">No Alerts Found</h3>
                                    <p className="mt-1 text-sm text-slate-400">
                                        {searchTerm || selectedStatus.length > 0 || selectedSeverity.length > 0 || selectedPlatforms.length > 0
                                            ? "No alerts match your current filters."
                                            : "Get started by creating your first alert."
                                        }
                                    </p>
                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="inline-flex items-center rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                        >
                                            <PlusCircle className="-ml-0.5 mr-1.5 h-5 w-5" />
                                            Create New Alert
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Phân trang */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8 flex-wrap">
                                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /> Previous</button>
                                <span className="text-sm text-gray-400">Page {currentPage} / {totalPages}</span>
                                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">Next <ChevronRight size={16} /></button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <CreateAlertModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                handleCreateAlert={handleCreateAlert}
            />
            {isEditModalOpen && editingAlert && (
                <EditAlertModal
                    alert={editingAlert}
                    onClose={handleCloseEditModal}
                    onSave={handleUpdateAlert}
                />
            )}
            {confirmDeleteId && (
                <Modal
                    isOpen={!!confirmDeleteId}
                    onClose={() => setConfirmDeleteId(null)}
                    title="Delete Alert"
                    footer={
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <button type="button" onClick={() => setConfirmDeleteId(null)} disabled={isDeleting} className="px-4 py-2 font-semibold rounded-lg bg-slate-600 hover:bg-slate-700 transition-all disabled:opacity-50 w-full sm:w-auto">Cancel</button>
                            <button type="button" onClick={executeDelete} disabled={isDeleting} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 w-full sm:w-auto">
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : null}
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    }
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-500/20"><AlertIcon size={24} className="text-red-400" /></div>
                        <div className="flex-grow"><p className="text-slate-300 mt-1 text-sm">Are you sure you want to delete this alert? This action cannot be undone.</p></div>
                    </div>
                </Modal>
            )}

            {/* --- BULK DELETE MODAL --- */}
            {confirmBulkDelete && (
                <Modal
                    isOpen={true}
                    onClose={() => setConfirmBulkDelete(false)}
                    title="Bulk Delete Alerts"
                    footer={
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <button type="button" onClick={() => setConfirmBulkDelete(false)} disabled={isBulkDeleting} className="px-4 py-2 font-semibold rounded-lg bg-slate-600 hover:bg-slate-700 transition-all disabled:opacity-50 w-full sm:w-auto">Cancel</button>
                            <button type="button" onClick={handleBulkDelete} disabled={isBulkDeleting} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 w-full sm:w-auto">
                                {isBulkDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                {isBulkDeleting ? 'Deleting...' : `Delete ${selectedAlerts.length} Alerts`}
                            </button>
                        </div>
                    }
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-500/20">
                            <AlertIcon size={24} className="text-red-400" />
                        </div>
                        <div className="flex-grow">
                            <p className="text-slate-300 mt-1 text-sm">
                                Are you sure you want to delete the **{selectedAlerts.length}** selected alerts?
                            </p>
                            <p className="text-slate-400 mt-2 text-xs">
                                This action cannot be undone. All associated data (like case studies) will also be deleted.
                            </p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}