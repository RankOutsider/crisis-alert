// frontend/app/dashboard/alerts/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import Link from 'next/link';
import {
    PlusCircle,
    Trash2,
    Edit,
    X,
    Tag,
    Search,
    CheckCircle,
    AlertCircle as AlertIcon,
    ChevronLeft,
    ChevronRight,
    FilePlus
} from 'lucide-react';

const PLATFORM_OPTIONS = [
    'Facebook', 'Instagram', 'News', 'Forum', 'Threads', 'TikTok', 'X',
];
const SEARCH_FIELDS = ['Title', 'Description', 'Keywords', 'Platforms'];
const inputClasses = 'w-full px-4 py-2 bg-slate-700/80 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors break-words';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

function EditAlertModal({ alert, onClose, onSave }) {
    if (!alert) return null;
    const [formData, setFormData] = useState({ ...alert });
    const [currentKeyword, setCurrentKeyword] = useState('');
    const handleChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
    const handlePlatformChange = (platform) => { const currentPlatforms = formData.platforms || []; setFormData((prev) => ({ ...prev, platforms: currentPlatforms.includes(platform) ? currentPlatforms.filter((p) => p !== platform) : [...currentPlatforms, platform], })); };
    const handleAddKeyword = () => { const trimmed = currentKeyword.trim(); if (trimmed && !formData.keywords.includes(trimmed)) { setFormData((prev) => ({ ...prev, keywords: [...prev.keywords, trimmed], })); } setCurrentKeyword(''); };
    const handleRemoveKeyword = (kw) => { setFormData((prev) => ({ ...prev, keywords: prev.keywords.filter((k) => k !== kw), })); };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData.id, formData); };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md sm:max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-700"><h2 className="text-lg sm:text-xl font-semibold text-white">Edit Alert</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700"><X size={20} /></button></div>
                <form onSubmit={handleSubmit} id="edit-form" className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Title</label><input name="title" type="text" value={formData.title} onChange={handleChange} className={inputClasses} /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={inputClasses} /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Keywords</label><div className="flex items-center gap-2"><input type="text" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }} placeholder="Add a keyword" className={inputClasses} /><button type="button" onClick={handleAddKeyword} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0"><PlusCircle size={20} /></button></div><div className="flex flex-wrap gap-2 mt-2 overflow-x-auto">{formData.keywords?.map((kw) => (<span key={kw} className="flex items-center gap-1 bg-slate-600 text-sm px-2 py-1 rounded-md">{kw}<button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-gray-400 hover:text-white"><X size={14} /></button></span>))}</div></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Platforms</label><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">{PLATFORM_OPTIONS.map((p) => (<label key={p} className="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" checked={formData.platforms?.includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-600" />{p}</label>))}</div></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Severity</label><select name="severity" value={formData.severity} onChange={handleChange} className={inputClasses}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
                </form>
                <div className="flex justify-end gap-3 p-4 border-t border-slate-700"><button type="button" onClick={onClose} className="px-4 py-2 font-semibold rounded-full bg-slate-600 hover:bg-slate-700 transition-all">Cancel</button><button type="submit" form="edit-form" className="px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all">Save Changes</button></div>
            </div>
        </div>
    );
}

// ===================================
// COMPONENT MỚI: CreateAlertModal
// ===================================
function CreateAlertModal({
    isOpen,
    onClose,
    handleCreateAlert,
    title, setTitle,
    description, setDescription,
    severity, setSeverity,
    keywords, setKeywords,
    currentKeyword, setCurrentKeyword,
    platforms, setPlatforms,
    formError
}) {
    if (!isOpen) return null;

    const handleAddKeyword = () => { const trimmed = currentKeyword.trim(); if (trimmed && !keywords.includes(trimmed)) { setKeywords([...keywords, trimmed]); } setCurrentKeyword(''); };
    const handleRemoveKeyword = (kw) => setKeywords(keywords.filter((k) => k !== kw));
    const handlePlatformChange = (p) => setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md sm:max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg sm:text-xl font-semibold text-white">Create New Alert</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700"><X size={20} /></button>
                </div>
                <form onSubmit={handleCreateAlert} id="create-form" className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Title</label><input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Brand Mention Spike" className={inputClasses} /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the conditions for this alert" className={inputClasses} /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Keywords</label><div className="flex items-center gap-2"><input type="text" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }} placeholder="Type a keyword and press Enter" className={inputClasses} /><button type="button" onClick={handleAddKeyword} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0"><PlusCircle size={20} /></button></div><div className="flex flex-wrap gap-2 mt-2">{keywords.map((kw) => (<span key={kw} className="flex items-center gap-1 bg-slate-700 text-sm px-2 py-1 rounded-md">{kw}<button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-gray-400 hover:text-white"><X size={14} /></button></span>))}</div></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Platforms</label><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">{PLATFORM_OPTIONS.map((p) => (<label key={p} className="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" checked={platforms.includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600" />{p}</label>))}</div></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Severity</label><select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputClasses}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
                    {formError && (<p className="text-red-400 text-sm">{formError}</p>)}
                </form>
                <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 font-semibold rounded-full bg-slate-600 hover:bg-slate-700 transition-all">Cancel</button>
                    <button type="submit" form="create-form" className="flex items-center gap-2 px-5 py-2.5 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all"><PlusCircle size={20} /> Create Alert</button>
                </div>
            </div>
        </div>
    );
}

export default function AlertsPage() {
    // --- STATES ---
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFields, setSearchFields] = useState({ title: true, description: false, keywords: true, platforms: true });
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // States for Create Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('Medium');
    const [keywords, setKeywords] = useState([]);
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [platforms, setPlatforms] = useState([]);
    const [formError, setFormError] = useState('');

    // States for Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);

    // States for Bulk Actions
    const [selectedAlerts, setSelectedAlerts] = useState([]);
    const [isCreatingBulk, setIsCreatingBulk] = useState(false);
    const [bulkMessage, setBulkMessage] = useState({ type: '', text: '' });

    const fetchAlerts = useCallback(async () => {
        try {
            setIsLoading(true);
            const activeFields = Object.keys(searchFields).filter(field => searchFields[field]);
            let url = `alerts?page=${currentPage}&limit=5`;
            if (debouncedSearchTerm && activeFields.length > 0) {
                url += `&search=${encodeURIComponent(debouncedSearchTerm)}&fields=${activeFields.join(',')}`;
            }
            const data = await api(url);
            setAlerts(data.alerts);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);
        } catch (err) {
            setError('Failed to fetch alerts.');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, searchFields]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [debouncedSearchTerm, searchFields]);

    // --- HANDLERS ---
    const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) { setCurrentPage(newPage); } };
    const handleSearchFieldChange = (f) => setSearchFields((p) => ({ ...p, [f.toLowerCase()]: !p[f.toLowerCase()] }));
    const handleScanAll = async () => { setIsScanning(true); setScanMessage({ type: '', text: '' }); try { const res = await api('alerts/scan-all', { method: 'POST' }); setScanMessage({ type: 'success', text: res.message || 'Scan completed!', }); fetchAlerts(); } catch (err) { setScanMessage({ type: 'error', text: err.message || 'Scan failed.', }); } finally { setIsScanning(false); setTimeout(() => setScanMessage({ type: '', text: '' }), 5000); } };

    const handleCreateAlert = async (e) => {
        e.preventDefault();
        if (!title || keywords.length === 0 || platforms.length === 0) {
            setFormError('Title, at least one keyword, and one platform are required.');
            return;
        }
        try {
            const newAlert = { title, description, severity, keywords, platforms };
            await api('alerts', { method: 'POST', body: JSON.stringify(newAlert) });
            // Reset form and close modal on success
            setTitle(''); setDescription(''); setSeverity('Medium'); setKeywords([]); setCurrentKeyword(''); setPlatforms([]); setFormError('');
            setIsCreateModalOpen(false);
            await fetchAlerts();
        } catch {
            setFormError('Failed to create alert.');
        }
    };

    const handleDeleteAlert = async (id) => { if (confirm('Are you sure?')) { try { await api(`alerts/${id}`, { method: 'DELETE' }); await fetchAlerts(); } catch { setError('Failed to delete alert.'); } } };
    const handleOpenEditModal = (alert) => { setEditingAlert(alert); setIsEditModalOpen(true); };
    const handleCloseEditModal = () => { setIsEditModalOpen(false); setEditingAlert(null); };
    const handleUpdateAlert = async (id, updatedData) => { try { await api(`alerts/${id}`, { method: 'PUT', body: JSON.stringify(updatedData) }); await fetchAlerts(); handleCloseEditModal(); } catch (error) { console.error('Failed to update alert:', error); } };
    const handleSelectAlert = (alertId) => { setSelectedAlerts(prev => prev.includes(alertId) ? prev.filter(id => id !== alertId) : [...prev, alertId]); };
    const handleBulkCreateCaseStudies = async () => { if (selectedAlerts.length === 0 || isCreatingBulk) return; setIsCreatingBulk(true); setBulkMessage({ type: 'info', text: 'Creating case studies...' }); try { const response = await api('casestudies/bulk-create', { method: 'POST', body: JSON.stringify({ alertIds: selectedAlerts }) }); setBulkMessage({ type: 'success', text: response.message }); setSelectedAlerts([]); } catch (err) { setBulkMessage({ type: 'error', text: err.message || 'Failed to create one or more case studies.' }); } finally { setIsCreatingBulk(false); setTimeout(() => setBulkMessage({ type: '', text: '' }), 7000); } };
    const handleClearSelection = () => setSelectedAlerts([]);

    return (
        <div className="overflow-x-hidden container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Manage Alerts</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all">
                        <PlusCircle size={20} /> Create New Alert
                    </button>
                    <button onClick={handleScanAll} disabled={isScanning} className="flex items-center gap-2 px-4 py-2 font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:bg-indigo-400 disabled:cursor-not-allowed">
                        <Search size={20} />{isScanning ? 'Scanning...' : 'Scan All Posts'}
                    </button>
                </div>
            </div>

            {selectedAlerts.length > 0 && (
                <div className="mb-6 flex justify-between items-center bg-slate-700/50 p-4 rounded-lg sticky top-4 z-10 backdrop-blur-sm border border-slate-600">
                    <div className="flex items-center gap-4">
                        <span className="text-white font-semibold">{selectedAlerts.length} alert(s) selected</span>
                        <button onClick={handleClearSelection} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
                            <X size={16} /> Clear selection
                        </button>
                    </div>
                    <button onClick={handleBulkCreateCaseStudies} disabled={isCreatingBulk} className="flex items-center gap-2 px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed">
                        <FilePlus size={20} />
                        {isCreatingBulk ? 'Creating...' : 'Create Case Studies'}
                    </button>
                </div>
            )}

            {bulkMessage.text && (<div className={`p-4 rounded-lg mb-6 flex items-center gap-3 text-sm ${bulkMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : bulkMessage.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}><AlertIcon size={20} /><span>{bulkMessage.text}</span></div>)}
            {scanMessage.text && (<div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${scanMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}><CheckCircle size={20} /><span>{scanMessage.text}</span></div>)}

            <div className="bg-slate-800/50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Existing Alerts</h2>
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                    <div className="relative w-full"><input type="text" placeholder="Search terms separated by '|'..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500" /><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /></div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-slate-300"><span>Search in:</span>{SEARCH_FIELDS.map((f) => (<label key={f} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={searchFields[f.toLowerCase()]} onChange={() => handleSearchFieldChange(f)} className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500" />{f}</label>))}</div>
                </div>

                {isLoading ? <p className="text-center text-gray-400">Loading alerts...</p> : error ? <p className="text-center text-red-400">{error}</p> : (
                    <>
                        <div className="space-y-4">
                            {alerts.length > 0 ? (alerts.map((a) => (
                                <div key={a.id} className={`p-4 rounded-lg transition-colors duration-200 ${selectedAlerts.includes(a.id) ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-slate-700/60'}`}>
                                    <div className="flex items-start gap-4">
                                        <input type="checkbox" checked={selectedAlerts.includes(a.id)} onChange={() => handleSelectAlert(a.id)} className="mt-1.5 h-5 w-5 flex-shrink-0 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500 cursor-pointer" />
                                        <div className="flex-grow min-w-0">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                                <div className="min-w-0">
                                                    <Link href={`/dashboard/alerts/${a.id}`}>
                                                        <h3 className="font-bold text-lg text-white hover:text-blue-400 transition-colors cursor-pointer break-words">{a.title}</h3>
                                                    </Link>
                                                    <p className="text-sm text-gray-300 break-words">{a.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${a.severity === 'Critical' ? 'bg-red-500/20 text-red-300' : a.severity === 'High' ? 'bg-orange-500/20 text-orange-300' : a.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>{a.severity}</span>
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${a.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-400'}`}>{a.status}</span>
                                                    <button onClick={() => handleOpenEditModal(a)} className="p-2 hover:bg-slate-600 rounded-full"><Edit size={18} /></button>
                                                    <button onClick={() => handleDeleteAlert(a.id)} className="p-2 hover:bg-slate-600 rounded-full text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                            <div className="mt-3 border-t border-slate-600/50 pt-3">
                                                <div className="flex flex-wrap items-center gap-2 break-words whitespace-normal max-w-full">
                                                    <Tag size={16} className="text-gray-400" />
                                                    {a.keywords?.map((kw) => (<span key={kw} className="bg-slate-600 text-xs px-2 py-0.5 rounded">{kw}</span>))}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-2">
                                                    <span>Platforms:</span>
                                                    {a.platforms?.map((p, i) => (<span key={i} className="bg-slate-600 px-2 py-0.5 rounded text-white">{p}</span>))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))) : (<p className="text-center text-gray-500">No alerts found, or none match your search criteria.</p>)}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8 flex-wrap">
                                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /> Previous</button>
                                <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">Next <ChevronRight size={16} /></button>
                            </div>
                        )}
                    </>
                )}
            </div>

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
        </div>
    );
}