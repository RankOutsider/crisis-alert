'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/utils/api';
import Link from 'next/link';
import { PlusCircle, Trash2, Edit, X, Tag, Search, CheckCircle, AlertCircle as AlertIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// ... (Component EditAlertModal và các hằng số giữ nguyên)
const PLATFORM_OPTIONS = ["Facebook", "Instagram", "News", "Forum", "Threads", "TikTok", "X"];
const SEARCH_FIELDS = ['Title', 'Description', 'Keywords', 'Platforms'];
const inputClasses = "w-full px-4 py-2 bg-slate-700/80 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors";

function EditAlertModal({ alert, onClose, onSave }) {
    if (!alert) return null;
    const [formData, setFormData] = useState({ ...alert });
    const [currentKeyword, setCurrentKeyword] = useState('');
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handlePlatformChange = (platform) => {
        const currentPlatforms = formData.platforms || [];
        setFormData(prev => ({
            ...prev,
            platforms: currentPlatforms.includes(platform)
                ? currentPlatforms.filter(p => p !== platform)
                : [...currentPlatforms, platform]
        }));
    };
    const handleAddKeyword = () => {
        const trimmedKeyword = currentKeyword.trim();
        const currentKeywords = formData.keywords || [];
        if (trimmedKeyword && !currentKeywords.includes(trimmedKeyword)) {
            setFormData(prev => ({ ...prev, keywords: [...currentKeywords, trimmedKeyword] }));
        }
        setCurrentKeyword('');
    };
    const handleRemoveKeyword = (keywordToRemove) => {
        setFormData(prev => ({
            ...prev,
            keywords: formData.keywords.filter(kw => kw !== keywordToRemove)
        }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData.id, formData);
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white">Edit Alert</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} id="edit-form" className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="title-edit" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                        <input id="title-edit" name="title" type="text" value={formData.title} onChange={handleChange} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="description-edit" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea id="description-edit" name="description" value={formData.description} onChange={handleChange} rows={3} className={inputClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Keywords</label>
                        <div className="flex items-center gap-2">
                            <input type="text" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }} placeholder="Add a keyword" className={inputClasses} />
                            <button type="button" onClick={handleAddKeyword} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0"><PlusCircle size={20} /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.keywords?.map(kw => (<span key={kw} className="flex items-center gap-1 bg-slate-600 text-sm px-2 py-1 rounded-md">{kw}<button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-gray-400 hover:text-white"><X size={14} /></button></span>))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Platforms</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                            {PLATFORM_OPTIONS.map(platform => (<label key={platform} className="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" checked={formData.platforms?.includes(platform)} onChange={() => handlePlatformChange(platform)} className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-blue-500 focus:ring-blue-600" />{platform}</label>))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="severity-edit" className="block text-sm font-medium text-slate-300 mb-1">Severity</label>
                        <select id="severity-edit" name="severity" value={formData.severity} onChange={handleChange} className={inputClasses}>
                            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                        </select>
                    </div>
                </form>
                <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 font-semibold rounded-full bg-slate-600 hover:bg-slate-700 transition-all">Cancel</button>
                    <button type="submit" form="edit-form" onClick={handleSubmit} className="px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all">Save Changes</button>
                </div>
            </div>
        </div>
    );
}

// === COMPONENT TRANG CHÍNH ===
export default function AlertsPage() {
    // State
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // === STATE MỚI CHO PHÂN TRANG ===
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // State cho Form tạo mới
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('Medium');
    const [keywords, setKeywords] = useState([]);
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [platforms, setPlatforms] = useState([]);
    const [formError, setFormError] = useState('');

    // State cho Modal sửa
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);

    // State cho chức năng quét
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' });

    // State cho tìm kiếm nâng cao
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFields, setSearchFields] = useState({
        title: true,
        description: false,
        keywords: true,
        platforms: true,
    });

    // === HÀM LẤY DỮ LIỆU ĐÃ ĐƯỢC CẬP NHẬT ===
    const fetchAlerts = async (page = 1) => {
        try {
            setIsLoading(true);
            // Gửi yêu cầu lấy dữ liệu cho trang cụ thể
            const data = await api(`alerts?page=${page}&limit=5`); // Hiển thị 5 alert mỗi trang
            setAlerts(data.alerts);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);
        } catch (err) {
            setError('Failed to fetch alerts.');
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect sẽ gọi fetchAlerts cho trang đầu tiên
    useEffect(() => {
        fetchAlerts(1);
    }, []);

    // Logic lọc alerts nâng cao (giữ nguyên)
    const filteredAlerts = useMemo(() => {
        // Lưu ý: Logic tìm kiếm này chỉ hoạt động trên dữ liệu của trang hiện tại.
        // Để tìm kiếm trên toàn bộ database, chúng ta cần nâng cấp API sau.
        const searchTerms = searchTerm.toLowerCase().split('|').map(t => t.trim()).filter(Boolean);
        if (searchTerms.length === 0) return alerts;
        const activeFields = Object.keys(searchFields).filter(field => searchFields[field]);
        if (activeFields.length === 0) return alerts;

        return alerts.filter(alert => {
            return searchTerms.some(term => {
                return activeFields.some(field => {
                    const fieldValue = alert[field.toLowerCase()];
                    if (Array.isArray(fieldValue)) return fieldValue.some(item => item.toLowerCase().includes(term));
                    if (typeof fieldValue === 'string') return fieldValue.toLowerCase().includes(term);
                    return false;
                });
            });
        });
    }, [alerts, searchTerm, searchFields]);

    // === HÀM ĐỂ CHUYỂN TRANG ===
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchAlerts(newPage);
        }
    };


    // ... (toàn bộ các hàm xử lý khác giữ nguyên)
    const handleSearchFieldChange = (field) => { setSearchFields(prev => ({ ...prev, [field.toLowerCase()]: !prev[field.toLowerCase()] })); };
    const handleScanAll = async () => { setIsScanning(true); setScanMessage({ type: '', text: '' }); try { const response = await api('alerts/scan-all', { method: 'POST' }); setScanMessage({ type: 'success', text: response.message || 'Scan completed successfully!' }); await fetchAlerts(currentPage); } catch (err) { setScanMessage({ type: 'error', text: err.message || 'An error occurred during the scan.' }); } finally { setIsScanning(false); setTimeout(() => setScanMessage({ type: '', text: '' }), 5000); } };
    const handleAddKeyword = () => { const trimmedKeyword = currentKeyword.trim(); if (trimmedKeyword && !keywords.includes(trimmedKeyword)) { setKeywords([...keywords, trimmedKeyword]); } setCurrentKeyword(''); };
    const handleRemoveKeyword = (keywordToRemove) => { setKeywords(keywords.filter(keyword => keyword !== keywordToRemove)); };
    const handlePlatformChange = (platform) => { setPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]); };
    const handleCreateAlert = async (e) => { e.preventDefault(); if (!title || keywords.length === 0 || platforms.length === 0) { setFormError('Title, at least one keyword, and one platform are required.'); return; } setFormError(''); try { const newAlertData = { title, description, severity, keywords, platforms }; await api('alerts', { method: 'POST', body: JSON.stringify(newAlertData), }); setTitle(''); setDescription(''); setSeverity('Medium'); setKeywords([]); setPlatforms([]); await fetchAlerts(1); } catch (err) { setFormError('Failed to create alert.'); } };
    const handleDeleteAlert = async (alertId) => { if (confirm('Are you sure you want to delete this alert?')) { try { await api(`alerts/${alertId}`, { method: 'DELETE' }); await fetchAlerts(currentPage); } catch (err) { setError('Failed to delete alert.'); } } };
    const handleOpenEditModal = (alert) => { setEditingAlert(alert); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingAlert(null); };
    const handleUpdateAlert = async (alertId, updatedData) => { try { await api(`alerts/${alertId}`, { method: 'PUT', body: JSON.stringify(updatedData) }); setAlerts(alerts.map(a => a.id === alertId ? { ...a, ...updatedData } : a)); handleCloseModal(); } catch (error) { console.error("Failed to update alert:", error); } };

    return (
        <div>
            {/* ... (Phần header và form giữ nguyên) ... */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Manage Alerts</h1>
                <button onClick={handleScanAll} disabled={isScanning} className="flex items-center gap-2 px-4 py-2 font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:bg-indigo-400 disabled:cursor-not-allowed"><Search size={20} />{isScanning ? 'Scanning...' : 'Scan All Posts'}</button>
            </div>
            {scanMessage.text && (<div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${scanMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{scanMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertIcon size={20} />}<span>{scanMessage.text}</span></div>)}
            <div className="bg-slate-800/50 p-6 rounded-lg mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Create New Alert</h2>
                <form onSubmit={handleCreateAlert} className="space-y-4">
                    <div><label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Title</label><input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Brand Mention Spike" className={inputClasses} /></div>
                    <div><label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the conditions for this alert" className={inputClasses} /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Keywords</label><div className="flex items-center gap-2"><input type="text" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }} placeholder="Type a keyword and press Enter" className={inputClasses} /><button type="button" onClick={handleAddKeyword} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0"><PlusCircle size={20} /></button></div><div className="flex flex-wrap gap-2 mt-2">{keywords.map(kw => (<span key={kw} className="flex items-center gap-1 bg-slate-700 text-sm px-2 py-1 rounded-md">{kw}<button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-gray-400 hover:text-white"><X size={14} /></button></span>))}</div></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-1">Platforms</label><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">{PLATFORM_OPTIONS.map(platform => (<label key={platform} className="flex items-center gap-2 text-slate-300 cursor-pointer"><input type="checkbox" checked={platforms.includes(platform)} onChange={() => handlePlatformChange(platform)} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600" />{platform}</label>))}</div></div>
                    <div><label htmlFor="severity" className="block text-sm font-medium text-slate-300 mb-1">Severity</label><select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputClasses}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
                    {formError && <p className="text-red-400 text-sm">{formError}</p>}
                    <button type="submit" className="flex items-center gap-2 px-5 py-2.5 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all"><PlusCircle size={20} /> Create Alert</button>
                </form>
            </div>

            {/* DANH SÁCH ALERTS */}
            <div className="bg-slate-800/50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Existing Alerts</h2>
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                    <div className="relative w-full"><input type="text" placeholder="Search terms separated by '|' (e.g., apple | facebook)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500" /><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /></div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-slate-300"><span>Search in:</span>{SEARCH_FIELDS.map(field => (<label key={field} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={searchFields[field.toLowerCase()]} onChange={() => handleSearchFieldChange(field)} className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500" />{field}</label>))}</div>
                </div>

                {isLoading ? <p>Loading alerts...</p> : error ? <p className="text-red-400">{error}</p> : (
                    <>
                        <div className="space-y-4">
                            {filteredAlerts.length > 0 ? filteredAlerts.map(alert => (
                                <div key={alert.id} className="bg-slate-700/60 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div><Link href={`/dashboard/alerts/${alert.id}`}><h3 className="font-bold text-lg text-white hover:text-blue-400 transition-colors cursor-pointer">{alert.title}</h3></Link><p className="text-sm text-gray-400 max-w-lg">{alert.description}</p></div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4"><span className={`text-xs font-semibold px-3 py-1 rounded-full ${alert.severity === 'Critical' && 'bg-red-500/20 text-red-300'} ${alert.severity === 'High' && 'bg-orange-500/20 text-orange-300'} ${alert.severity === 'Medium' && 'bg-yellow-500/20 text-yellow-300'} ${alert.severity === 'Low' && 'bg-green-500/20 text-green-300'}`}>{alert.severity}</span><span className={`text-xs font-semibold px-3 py-1 rounded-full ${alert.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-400'}`}>{alert.status}</span><button onClick={() => handleOpenEditModal(alert)} className="p-2 hover:bg-slate-600 rounded-full"><Edit size={18} /></button><button onClick={() => handleDeleteAlert(alert.id)} className="p-2 hover:bg-slate-600 rounded-full text-red-400 hover:text-red-300"><Trash2 size={18} /></button></div>
                                    </div>
                                    <div className="mt-3 border-t border-slate-600/50 pt-3"><div className="flex flex-wrap items-center gap-2"><Tag size={16} className="text-gray-400" />{alert.keywords?.map(kw => (<span key={kw} className="bg-slate-600 text-xs px-2 py-0.5 rounded">{kw}</span>))}</div><div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-2"><span>Platforms:</span>{alert.platforms?.join(', ')}</div></div>
                                </div>
                            )) : <p className="text-gray-400">No alerts found, or none match your search criteria.</p>}
                        </div>

                        {/* === KHUNG ĐIỀU KHIỂN PHÂN TRANG MỚI === */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <span className="text-sm text-gray-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {isModalOpen && editingAlert && (<EditAlertModal alert={editingAlert} onClose={handleCloseModal} onSave={handleUpdateAlert} />)}
        </div>
    );
}