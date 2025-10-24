// frontend/app/dashboard/alerts/page.jsx
'use client';

// --- Imports ---
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
    PlusCircle, Trash2, Edit, X, Tag, Search, CheckCircle,
    AlertCircle as AlertIcon, ChevronLeft, ChevronRight, FilePlus, RefreshCw, Globe
} from 'lucide-react';
import { api, fetcher } from '@/utils/api'; // Import api và fetcher chung
import Modal from '@/app/components/Modal';
import FilterBar from '@/app/components/FilterBar'; // Import FilterBar

// --- Constants ---
const PLATFORM_OPTIONS = [
    'Facebook', 'Instagram', 'News', 'Forum', 'Threads', 'TikTok', 'X', 'Youtube', 'Blog'
];
// Đổi tên hằng số cho rõ ràng hơn (dùng cho Alert, không phải Post)
const ALERT_SEARCH_FIELDS = ['Title', 'Description', 'Keywords'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const inputClasses = 'w-full px-4 py-2 bg-slate-700/80 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors break-words';

// --- useDebounce Hook ---
// Hook để trì hoãn việc cập nhật giá trị
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

// --- EditAlertModal Component ---
// Component modal sửa Alert (sử dụng Modal chung)
function EditAlertModal({ alert, onClose, onSave }) {
    if (!alert) return null;
    const [formData, setFormData] = useState({ ...alert });
    const [currentKeyword, setCurrentKeyword] = useState('');
    const handleChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
    const handlePlatformChange = (platform) => { const currentPlatforms = formData.platforms || []; setFormData((prev) => ({ ...prev, platforms: currentPlatforms.includes(platform) ? currentPlatforms.filter((p) => p !== platform) : [...(currentPlatforms), platform], })); };
    const handleAddKeyword = () => { const trimmed = currentKeyword.trim(); if (trimmed && !(formData.keywords || []).includes(trimmed)) { setFormData((prev) => ({ ...prev, keywords: [...(prev.keywords || []), trimmed], })); } setCurrentKeyword(''); };
    const handleRemoveKeyword = (kw) => { setFormData((prev) => ({ ...prev, keywords: (prev.keywords || []).filter((k) => k !== kw), })); };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData.id, formData); };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Edit Alert" 
            size="max-w-2xl"
            footer={
                <div> {/* Sửa thành div */}
                    <button type="button" onClick={onClose} className="px-4 py-2 font-semibold rounded-full bg-slate-600 hover:bg-slate-700 transition-all mr-2">Cancel</button> 
                    <button type="submit" form="edit-form" className="px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all">Save Changes</button> 
                </div>
            }
        >
            <form onSubmit={handleSubmit} id="edit-form" className="space-y-4">
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Title</label><input name="title" type="text" value={formData.title || ''} onChange={handleChange} className={inputClasses} required /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Description</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Keywords</label><div className="flex items-center gap-2"><input type="text" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }} placeholder="Add a keyword..." className={inputClasses} /><button type="button" onClick={handleAddKeyword} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0"><PlusCircle size={20} /></button></div><div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">{(formData.keywords || []).map((kw) => (<span key={kw} className="flex items-center gap-1 bg-slate-600 text-sm px-2 py-1 rounded-md">{kw}<button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-gray-400 hover:text-white"><X size={14} /></button></span>))}</div></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Platforms</label><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">{PLATFORM_OPTIONS.map((p) => (<label key={p} className="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" checked={(formData.platforms || []).includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-600" />{p}</label>))}</div></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Severity</label><select name="severity" value={formData.severity || 'Medium'} onChange={handleChange} className={inputClasses}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
            </form>
        </Modal>
    );
}

// --- CreateAlertModal Component ---
// Component modal tạo Alert (sử dụng Modal chung)
function CreateAlertModal({
    isOpen, onClose, handleCreateAlert, title, setTitle, description, setDescription, severity, setSeverity, keywords, setKeywords, currentKeyword, setCurrentKeyword, platforms, setPlatforms, formError
}) {
    const handleAddKeyword = () => { const trimmed = currentKeyword.trim(); if (trimmed && !keywords.includes(trimmed)) { setKeywords([...keywords, trimmed]); } setCurrentKeyword(''); };
    const handleRemoveKeyword = (kw) => setKeywords(keywords.filter((k) => k !== kw));
    const handlePlatformChange = (p) => setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Alert" 
            size="max-w-2xl"
            footer={
                <div> {/* Sửa thành div */}
                    <button type="button" onClick={onClose} className="px-4 py-2 font-semibold rounded-full bg-slate-600 hover:bg-slate-700 transition-all mr-2">Cancel</button> 
                    <button type="submit" form="create-form" className="flex items-center gap-2 px-5 py-2.5 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all"><PlusCircle size={20} /> Create Alert</button> 
                </div>
            }
        >
            <form onSubmit={handleCreateAlert} id="create-form" className="space-y-4">
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Title</label><input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Brand Mention Spike" className={inputClasses} required /></div> 
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the conditions for this alert" className={inputClasses} /></div> 
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Keywords</label><div className="flex items-center gap-2"><input type="text" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }} placeholder="Type a keyword and press Enter..." className={inputClasses} /><button type="button" onClick={handleAddKeyword} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0"><PlusCircle size={20} /></button></div><div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">{keywords.map((kw) => (<span key={kw} className="flex items-center gap-1 bg-slate-700 text-sm px-2 py-1 rounded-md">{kw}<button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-gray-400 hover:text-white"><X size={14} /></button></span>))}</div></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Platforms</label><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">{PLATFORM_OPTIONS.map((p) => (<label key={p} className="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" checked={platforms.includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600" />{p}</label>))}</div></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Severity</label><select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputClasses}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
                {formError && (<p className="text-red-400 text-sm">{formError}</p>)}
            </form>
        </Modal>
    );
}

// --- Main Page Component ---
// Component chính hiển thị trang quản lý Alerts
export default function AlertsPage() {
    // --- States ---
    const [currentPage, setCurrentPage] = useState(1);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    // Đổi tên state cho rõ ràng (filter Alert, không phải Post)
    const [alertSearchFields, setAlertSearchFields] = useState({ title: true, description: false, keywords: true });
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [selectedSeverity, setSelectedSeverity] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Modal states (Giữ nguyên)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('Medium');
    const [keywords, setKeywords] = useState([]);
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [platforms, setPlatforms] = useState([]);
    const [formError, setFormError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);
    const [selectedAlerts, setSelectedAlerts] = useState([]);
    const [isCreatingBulk, setIsCreatingBulk] = useState(false);
    const [bulkMessage, setBulkMessage] = useState({ type: '', text: '' });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // --- API URL Construction ---
    // Tính toán URL API cho SWR dựa trên các state filter
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: '5',
        });
        // Dùng state alertSearchFields
        const activeFields = Object.keys(alertSearchFields).filter(field => alertSearchFields[field]);
        if (debouncedSearchTerm && activeFields.length > 0) {
            params.append('search', debouncedSearchTerm);
            params.append('fields', activeFields.join(','));
        }
        if (selectedStatus.length > 0) params.append('statuses', selectedStatus.join(','));
        if (selectedSeverity.length > 0) params.append('severities', selectedSeverity.join(','));
        if (selectedPlatforms.length > 0) params.append('platforms', selectedPlatforms.join(','));

        return `/api/alerts?${params.toString()}`;
    }, [currentPage, debouncedSearchTerm, alertSearchFields, selectedStatus, selectedSeverity, selectedPlatforms]); // Cập nhật dependencies

    // --- Data Fetching with useSWR ---
    // Fetch dữ liệu alerts bằng SWR
    const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
        keepPreviousData: true,
    });

    // --- Process SWR Data ---
    // Lấy dữ liệu từ SWR (hoặc giá trị mặc định)
    const alerts = data?.alerts || [];
    const totalPages = data?.totalPages || 1;

    // --- useEffect Reset Trang ---
    // Chuyển về trang 1 khi filter thay đổi
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, alertSearchFields, selectedStatus, selectedSeverity, selectedPlatforms]); // Cập nhật dependencies

    // --- Handlers ---

    // Handler cho checkbox fields (Cập nhật tên state)
    const handleAlertSearchFieldChange = (field) => { // Đổi tên handler
        // Nhận field name từ FilterBar (vd: "Title")
        setAlertSearchFields((prev) => ({ ...prev, [field.toLowerCase()]: !prev[field.toLowerCase()] }));
    };

    // Hàm thực hiện xóa Alert sau khi xác nhận
    const executeDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api(`alerts/${confirmDeleteId}`, { method: 'DELETE' });
            mutate();
            if (alerts.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (err) {
            console.error('Error deleting alert:', err);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    // Hàm xử lý việc lưu thay đổi khi sửa Alert
    const handleUpdateAlert = async (id, updatedData) => {
        try {
            await api(`alerts/${id}`, { method: 'PUT', body: JSON.stringify(updatedData) });
            mutate();
            handleCloseEditModal();
        } catch (error) {
            console.error('Error updating alert:', error);
        }
    };

    // Hàm xử lý việc tạo Alert mới
    const handleCreateAlert = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!title || keywords.length === 0 || platforms.length === 0) {
            setFormError('Title, at least one keyword, and one platform are required.'); 
            return;
        }
        try {
            const newAlert = { title, description, severity, keywords, platforms };
            await api('alerts', { method: 'POST', body: JSON.stringify(newAlert) });
            setTitle(''); setDescription(''); setSeverity('Medium'); setKeywords([]); setCurrentKeyword(''); setPlatforms([]);
            setIsCreateModalOpen(false);
            if (currentPage !== 1) setCurrentPage(1);
            mutate();
        } catch (err) {
            console.error("Error creating alert:", err);
            const message = err.errors?.[0]?.msg || err.message || 'Failed to create alert.'; 
            setFormError(message);
        }
    };

    // Hàm xử lý việc quét tất cả posts
    const handleScanAll = async () => {
        setIsScanning(true);
        setScanMessage({ type: '', text: '' });
        try {
            const res = await api('alerts/scan-all', { method: 'POST' });
            setScanMessage({ type: 'success', text: res.message || 'Scan completed!', }); 
            mutate();
        } catch (err) {
            setScanMessage({ type: 'error', text: err.message || 'Scan failed.', }); 
        } finally {
            setIsScanning(false);
            setTimeout(() => setScanMessage({ type: '', text: '' }), 5000);
        }
    };

    // Các handlers khác
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
            const message = err.errors?.[0]?.msg || err.message || 'Failed to create one or more case studies.'; 
            setBulkMessage({ type: 'error', text: message });
        } finally {
            setIsCreatingBulk(false);
            setTimeout(() => setBulkMessage({ type: '', text: '' }), 7000);
        }
    };
    const handleClearSelection = () => setSelectedAlerts([]);

    // --- JSX ---
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden"> {/* Added overflow-x-hidden */}
            {/* Header và Nút Actions */}
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

            {/* Thanh Bulk Actions */}
            {selectedAlerts.length > 0 && (
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center bg-slate-700/50 p-4 rounded-lg sticky top-4 z-10 backdrop-blur-sm border border-slate-600 gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-white font-semibold">{selectedAlerts.length} alert(s) selected</span> 
                        <button onClick={handleClearSelection} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
                            <X size={16} /> Clear selection 
                        </button>
                    </div>
                    <button onClick={handleBulkCreateCaseStudies} disabled={isCreatingBulk} className="flex items-center gap-2 px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center">
                        <FilePlus size={20} />
                        {isCreatingBulk ? 'Creating...' : 'Create Case Studies'} 
                    </button>
                </div>
            )}

            {/* Thông báo */}
            {bulkMessage.text && (<div className={`p-4 rounded-lg mb-6 flex items-center gap-3 text-sm ${bulkMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : bulkMessage.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}><AlertIcon size={20} /><span>{bulkMessage.text}</span></div>)}
            {scanMessage.text && (<div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${scanMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}><CheckCircle size={20} /><span>{scanMessage.text}</span></div>)}

            {/* Khung nội dung chính */}
            <div className="bg-slate-800/50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Existing Alerts</h2> 

                {/* --- SỬ DỤNG FilterBar --- */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search alerts (title, description, keywords)..." 

                    availableFields={ALERT_SEARCH_FIELDS} // Dùng hằng số mới
                    activeFields={alertSearchFields} // Dùng state mới
                    onFieldChange={handleAlertSearchFieldChange} // Dùng handler mới

                    platformOptions={PLATFORM_OPTIONS} // Có dropdown Platform
                    selectedPlatforms={selectedPlatforms}
                    onPlatformChange={setSelectedPlatforms}

                    statusOptions={STATUS_OPTIONS} // Có dropdown Status
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}

                    severityOptions={SEVERITY_OPTIONS} // Có dropdown Severity
                    selectedSeverity={selectedSeverity}
                    onSeverityChange={setSelectedSeverity}

                // Không truyền props cho Sentiment -> nó sẽ không hiển thị
                />
                {/* --- KẾT THÚC FilterBar --- */}


                {/* Hiển thị Loading / Error / Data / Empty */}
                {isLoading && !data && (
                    <p className="text-center text-gray-400 py-10">Loading alerts...</p> 
                )}
                {error && (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                        <AlertIcon className="mx-auto h-12 w-12 text-red-400" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Data</h3> 
                        <p className="mt-1 text-sm text-red-300">{error.message || 'Could not load alerts list.'}</p> 
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => mutate()}
                                className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry 
                            </button>
                        </div>
                    </div>
                )}
                {!isLoading && !error && (
                    <>
                        {/* Danh sách Alerts */}
                        <div className="space-y-4">
                            {alerts.length > 0 ? (alerts.map((a) => (
                                // --- Thẻ Alert ---
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
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${a.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-400'}`}>{a.status}</span>
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
                                                    {a.platforms?.length > 0 ? a.platforms.slice(0, 5).map((p) => (<span key={p} className="bg-slate-600 px-2 py-0.5 rounded text-white">{p}</span>)) : <span className="text-xs text-slate-500 italic">No platforms specified</span>} 
                                                    {a.platforms?.length > 5 && <span className="text-xs text-slate-500">...</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                // --- Hết Thẻ Alert ---
                            ))) : (
                                // --- Trạng thái rỗng ---
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
                                // --- Hết Trạng thái rỗng ---
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
                title={title} setTitle={setTitle}
                description={description} setDescription={setDescription}
                severity={severity} setSeverity={setSeverity}
                keywords={keywords} setKeywords={setKeywords}
                currentKeyword={currentKeyword} setCurrentKeyword={setCurrentKeyword}
                platforms={platforms} setPlatforms={setPlatforms}
                formError={formError}
            />
            {isEditModalOpen && editingAlert && (<EditAlertModal alert={editingAlert} onClose={handleCloseEditModal} onSave={handleUpdateAlert} />)}
            {confirmDeleteId && (
                <Modal
                    isOpen={!!confirmDeleteId}
                    onClose={() => setConfirmDeleteId(null)}
                    title="Delete Alert" 
                    footer={
                        <div>
                            <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 font-semibold rounded-full bg-slate-600 hover:bg-slate-700 transition-all mr-2">Cancel</button> 
                            <button type="button" onClick={executeDelete} className="px-4 py-2 font-semibold rounded-full text-white bg-red-600 hover:bg-red-700 transition-all">
                            Delete
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
        </div>
    );
}