// frontend/app/admin/alerts/page.jsx
'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { swrFetcher, deleteAdminAlert, deleteAdminAlertsBulk } from '@/utils/api';
import {
    Search, Trash2, ChevronLeft, ChevronRight,
    Loader2, User, CheckSquare, Square, Hash,
    Bell, Calendar, AlertTriangle, Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function AdminAlerts() {
    // State UI
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // --- 1. SWR FETCH DATA ---
    const endpoint = `admin/alerts?page=${page}&limit=10&search=${search}`;

    const { data, error, isLoading } = useSWR(endpoint, swrFetcher, {
        keepPreviousData: true,
    });

    // Parse dữ liệu
    const alerts = data?.alerts || [];
    const totalPages = data?.pages || 1;
    const totalAlerts = data?.totalAlerts || 0;

    // Scroll lên đầu khi chuyển trang
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    // --- CHECKBOX LOGIC ---
    const toggleSelect = (id) => {
        selectedIds.includes(id)
            ? setSelectedIds(prev => prev.filter(item => item !== id))
            : setSelectedIds(prev => [...prev, id]);
    };

    const toggleSelectAll = () => {
        selectedIds.length === alerts.length && alerts.length > 0
            ? setSelectedIds([])
            : setSelectedIds(alerts.map(a => a.id));
    };

    // --- ACTION HANDLERS ---

    // 1. Xóa đơn lẻ
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this alert? This will stop tracking for the user.')) return;

        try {
            await deleteAdminAlert(id);

            // Optimistic update
            mutate(endpoint, {
                ...data,
                alerts: alerts.filter(a => a.id !== id)
            }, false);

            toast.success('Alert deleted successfully');
            mutate(endpoint);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete alert');
        }
    };

    // 2. Xóa hàng loạt
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (window.confirm(`Delete ${selectedIds.length} alerts?`)) {
            try {
                await deleteAdminAlertsBulk(selectedIds);
                mutate(endpoint);
                toast.success(`Deleted ${selectedIds.length} alerts successfully.`);
                setSelectedIds([]);
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

    // Component phân trang
    const Pagination = () => (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:inline">Page {page} of {totalPages}</span>
            <div className="flex space-x-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 transition-colors"><ChevronLeft size={20} /></button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 transition-colors"><ChevronRight size={20} /></button>
            </div>
        </div>
    );

    if (error) return <div className="text-center py-10 text-red-400">Failed to load alerts.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bell className="text-yellow-500" />
                        Alert Management <span className="text-gray-500 text-lg font-normal">({totalAlerts})</span>
                    </h1>

                    <div className="flex flex-col-reverse md:flex-row gap-4 w-full md:w-auto items-end md:items-center">
                        <Pagination />
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search title, owner email..."
                                className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 text-sm transition-all"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                </div>

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

            {/* Loading & Empty */}
            {isLoading ? (
                <div className="flex justify-center py-10 text-gray-400"><Loader2 className="animate-spin mr-2" /> Loading alerts...</div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                    No alerts found.
                </div>
            ) : (
                /* --- DATA CONTENT --- */
                <>
                    {/* MOBILE VIEW (Cards) */}
                    <div className="md:hidden flex flex-col gap-4">
                        <div className="flex items-center gap-3 px-1 mb-1">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                                {selectedIds.length === alerts.length ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                                <span className="text-sm font-medium">Select All</span>
                            </button>
                        </div>

                        {alerts.map((alert) => {
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
                                                <h3
                                                    className="font-bold text-white text-base leading-snug cursor-pointer hover:text-blue-400 transition-colors truncate"
                                                    onClick={() => toggleSelect(alert.id)}
                                                >
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

                                    {/* Keywords */}
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

                                    {/* Footer: Metadata */}
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

                    {/* DESKTOP VIEW (Table) */}
                    <div className="hidden md:block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-300 border-b border-slate-700 text-xs uppercase font-semibold">
                                    <th className="p-4 w-12 text-center"><button onClick={toggleSelectAll} className="hover:text-white">{alerts.length > 0 && selectedIds.length === alerts.length ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}</button></th>
                                    <th className="p-4 w-[25%]">Alert Details</th>
                                    <th className="p-4 w-[25%]">Keywords</th>
                                    <th className="p-4 w-[12%]">Severity</th>
                                    <th className="p-4 w-[12%]">Status</th>
                                    <th className="p-4 w-[15%]">Created At</th>
                                    <th className="p-4 w-[10%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {alerts.map((alert) => {
                                    const isSelected = selectedIds.includes(alert.id);
                                    return (
                                        <tr key={alert.id} className={`transition-colors ${isSelected ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-slate-700/30'}`}>
                                            <td className="p-4 text-center"><button onClick={() => toggleSelect(alert.id)} className="text-slate-400 hover:text-white transition-colors">{isSelected ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}</button></td>
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
                                                <button
                                                    onClick={() => handleDelete(alert.id)}
                                                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm"
                                                    title="Delete Alert"
                                                >
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

            <div className="flex justify-end pt-4"><Pagination /></div>
        </div>
    );
}