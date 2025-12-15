// frontend/app/admin/alerts/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { swrFetcher, deleteAdminAlert, deleteAdminAlertsBulk } from '@/utils/api';
import {
    Trash2, ChevronLeft, ChevronRight,
    Loader2, User, CheckSquare, Square, Hash,
    Bell, Calendar, AlertTriangle, Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import FilterBar from '@/app/components/FilterBar'; // Import FilterBar
import useDebounce from '@/hooks/useDebounce';     // Import useDebounce

export default function AdminAlerts() {
    // --- FETCH DATA ---
    // Bỏ pagination params
    const endpoint = 'admin/alerts';
    const { data, error, isLoading } = useSWR(endpoint, swrFetcher);

    // Xử lý dữ liệu trả về (giả sử backend trả về { alerts: [...] } hoặc mảng trực tiếp)
    const allAlerts = Array.isArray(data) ? data : (data?.alerts || []);

    // --- STATE UI ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState([]);   // Filter Status
    const [selectedSeverity, setSelectedSeverity] = useState([]); // Filter Severity (Mới)

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const itemsPerPage = 10;

    // --- DEBOUNCE SEARCH ---
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- LOGIC LỌC & PHÂN TRANG CLIENT-SIDE ---

    // Reset trang về 1 khi filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedStatus, selectedSeverity]);

    // Lọc dữ liệu
    const filteredAlerts = useMemo(() => {
        return allAlerts.filter(alert => {
            const title = alert.title?.toLowerCase() || '';
            const email = alert.User?.email?.toLowerCase() || '';
            const search = debouncedSearchTerm.toLowerCase();

            // Tìm theo Title hoặc Email người tạo
            const matchesSearch = title.includes(search) || email.includes(search);

            // Filter theo Status
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(alert.status);

            // Filter theo Severity
            const matchesSeverity = selectedSeverity.length === 0 || selectedSeverity.includes(alert.severity);

            return matchesSearch && matchesStatus && matchesSeverity;
        });
    }, [allAlerts, debouncedSearchTerm, selectedStatus, selectedSeverity]);

    // Cắt trang
    const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAlerts.slice(indexOfFirstItem, indexOfLastItem);

    // Scroll lên đầu khi đổi trang
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // --- CHECKBOX LOGIC ---
    const toggleSelect = (id) => {
        selectedIds.includes(id)
            ? setSelectedIds(prev => prev.filter(item => item !== id))
            : setSelectedIds(prev => [...prev, id]);
    };

    const toggleSelectAll = () => {
        selectedIds.length === filteredAlerts.length && filteredAlerts.length > 0
            ? setSelectedIds([])
            : setSelectedIds(filteredAlerts.map(a => a.id));
    };

    // --- ACTION HANDLERS ---

    // Xóa đơn lẻ
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this alert? This will stop tracking for the user.')) return;

        try {
            await deleteAdminAlert(id);

            const updatedList = allAlerts.filter(a => a.id !== id);
            mutate(endpoint, { ...data, alerts: updatedList }, false);

            toast.success('Alert deleted successfully');
            mutate(endpoint);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete alert');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Delete ${selectedIds.length} alerts?`)) {
            try {
                await deleteAdminAlertsBulk(selectedIds);
                toast.success(`Deleted ${selectedIds.length} alerts successfully.`);
                setSelectedIds([]);
                mutate(endpoint);
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete selected alerts.');
            }
        }
    };

    // Helper Colors
    const getSeverityColor = (sev) => {
        switch (sev) {
            case 'Critical': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'High': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
            case 'Medium': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
            case 'Low': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
            default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
        }
    };

    if (error) return <div className="text-center py-10 text-red-400">Failed to load alerts.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bell className="text-yellow-500" />
                        Alert Management <span className="text-gray-500 text-lg font-normal">({filteredAlerts.length})</span>
                    </h1>
                </div>

                {/* FILTER BAR */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search title, owner email..."

                    // Filter Status
                    statusOptions={['ACTIVE', 'INACTIVE']}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}

                    // Filter Severity
                    severityOptions={['Critical', 'High', 'Medium', 'Low']}
                    selectedSeverity={selectedSeverity}
                    onSeverityChange={setSelectedSeverity}
                />

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-600/10 border border-blue-500/30 p-3 rounded-lg flex items-center justify-between animate-fadeIn">
                        <span className="text-blue-400 font-medium flex items-center gap-2 text-sm">
                            <CheckSquare size={18} /> Selected {selectedIds.length} alerts
                        </span>
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-500/90 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20"
                        >
                            <Trash2 size={16} /> Delete Selected
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-10 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading alerts...</div>
            ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                    No alerts found matching your filters.
                </div>
            ) : (
                /* --- DATA CONTENT --- */
                <>
                    {/* MOBILE VIEW */}
                    <div className="md:hidden flex flex-col gap-4">
                        <div className="flex items-center gap-3 px-1 mb-1">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                                {selectedIds.length === filteredAlerts.length ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                                <span className="text-sm font-medium">Select All</span>
                            </button>
                        </div>
                        {currentItems.map((alert) => {
                            const isSelected = selectedIds.includes(alert.id);
                            return (
                                <div key={alert.id} className={`bg-slate-800 p-5 rounded-xl border shadow-sm flex flex-col gap-4 transition-all ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700 hover:border-slate-600'}`}>

                                    {/* Header: Checkbox + Title + Delete */}
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <button onClick={() => toggleSelect(alert.id)} className="mt-1 text-gray-400 hover:text-white shrink-0">
                                                {isSelected ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-white text-base leading-snug cursor-pointer hover:text-blue-400 transition-colors truncate" onClick={() => toggleSelect(alert.id)}>
                                                    {alert.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                                                    <User size={12} className="shrink-0" />
                                                    <span className="truncate max-w-[150px]">{alert.User?.email || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(alert.id)} className="text-slate-500 hover:text-red-400 p-2 -mr-2 -mt-2 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pl-8">
                                        {alert.keywords?.slice(0, 5).map((kw, idx) => (
                                            <span key={idx} className="px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300 border border-slate-600 flex items-center gap-1">
                                                <Hash size={10} className="opacity-50" /> {kw}
                                            </span>
                                        ))}
                                        {alert.keywords?.length > 5 && (
                                            <span className="text-xs text-gray-500 flex items-center">+{alert.keywords.length - 5} more</span>
                                        )}
                                    </div>
                                    <div className="pl-8 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded font-medium border flex items-center gap-1 ${getSeverityColor(alert.severity)}`}>
                                                <AlertTriangle size={10} /> {alert.severity}
                                            </span>
                                            <span className={`flex items-center gap-1 font-bold ${alert.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-500'}`}>
                                                <Activity size={12} /> {alert.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500">
                                            <Calendar size={12} />
                                            {alert.createdAt ? format(new Date(alert.createdAt), 'MMM dd') : '-'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP VIEW */}
                    <div className="hidden md:block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-300 border-b border-slate-700 text-xs uppercase font-semibold">
                                    <th className="p-4 w-12 text-center">
                                        <button onClick={toggleSelectAll} className="hover:text-white">
                                            {filteredAlerts.length > 0 && selectedIds.length === filteredAlerts.length ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}
                                        </button>
                                    </th>
                                    <th className="p-4 w-[25%]">Alert Details</th>
                                    <th className="p-4 w-[25%]">Keywords</th>
                                    <th className="p-4 w-[12%]">Severity</th>
                                    <th className="p-4 w-[12%]">Status</th>
                                    <th className="p-4 w-[15%]">Created At</th>
                                    <th className="p-4 w-[10%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {currentItems.map((alert) => {
                                    const isSelected = selectedIds.includes(alert.id);
                                    return (
                                        <tr key={alert.id} className={`transition-colors ${isSelected ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-slate-700/30'}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => toggleSelect(alert.id)} className="text-slate-400 hover:text-white transition-colors">
                                                    {isSelected ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-white truncate cursor-pointer hover:text-blue-400 transition-colors" title={alert.title} onClick={() => toggleSelect(alert.id)}>{alert.title}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                                    <User size={12} />
                                                    <span className="truncate">{alert.User?.email || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                                                    {alert.keywords?.slice(0, 4).map((kw, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 border border-slate-600 truncate max-w-[100px] flex items-center gap-0.5">
                                                            <Hash size={8} className="opacity-50" /> {kw}
                                                        </span>
                                                    ))}
                                                    {alert.keywords?.length > 4 && <span className="text-xs text-slate-500 self-center">...</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${getSeverityColor(alert.severity)}`}>
                                                    {alert.severity}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold flex items-center gap-1.5 ${alert.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${alert.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                                                    {alert.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                                                {alert.createdAt ? format(new Date(alert.createdAt), 'MMM dd, yyyy') : '-'}
                                                <div className="text-xs text-slate-600 mt-0.5">
                                                    {alert.createdAt ? format(new Date(alert.createdAt), 'HH:mm') : ''}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(alert.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm" title="Delete Alert">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Pagination Controls */}
            {filteredAlerts.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-700/50">
                    <div className="text-sm text-gray-400">
                        Showing <span className="font-bold text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-white">{Math.min(indexOfLastItem, filteredAlerts.length)}</span> of <span className="font-bold text-white">{filteredAlerts.length}</span> results
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
        </div>
    );
}