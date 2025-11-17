'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import StatCard from '@/app/components/StatCard';
import MainChart from '@/app/components/MainChart';
import Modal from '@/app/components/Modal';
import { fetcher, api, getToken } from '@/utils/api';
import * as XLSX from 'xlsx';

import MultiSelectDropdown from '../components/MultiSelectDropdown';

import { useAuth } from '@/app/providers.jsx';
import {
    AlertCircle, Newspaper, MessageSquare, RefreshCw, Loader2, Download, Lock,
    Zap
} from 'lucide-react';

import { useRouter } from 'next/navigation';

// --- Skeleton Component cho StatCard ---
function StatCardSkeleton({ icon: Icon, color, title }) {
    return (
        <div className="bg-slate-800/50 p-5 rounded-lg flex items-center gap-4 animate-pulse">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-slate-700`}>
                <Icon size={24} className={color} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-slate-700 rounded w-1/2"></div>
            </div>
        </div>
    );
}

// --- Skeleton Component cho MainChart ---
function MainChartSkeleton() {
    return (
        <div className="bg-slate-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg h-96 flex items-center justify-center animate-pulse">
            <Loader2 size={32} className="animate-spin text-blue-400 opacity-50" />
        </div>
    );
}

const EXPORT_COLUMN_OPTIONS = ['title', 'content', 'sourceUrl', 'platform', 'sentiment', 'scannedAt'];

// --- Component Chính ---
export default function DashboardContent() {
    const router = useRouter();

    // --- Lấy thông tin User từ Context ---
    const { user, isLoading: isAuthLoading } = useAuth();

    // --- STATE ---
    const [timeRange, setTimeRange] = useState('7days');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportType, setExportType] = useState('excel');

    // --- State cho các tùy chọn export mới ---
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedColumns, setSelectedColumns] = useState(EXPORT_COLUMN_OPTIONS);

    // --- SWR Hook cho STAT CARDS ---
    const {
        data: statsData,
        error: statsError,
        isLoading: isStatsLoading,
        mutate: mutateStats
    } = useSWR('/api/alerts/stats', fetcher, {
        refreshInterval: 60000,
        onError: (err) => {
            if (err.message.includes('Unauthorized') || err.message.includes('401')) {
                // Hàm 'api' trong fetcher sẽ tự động xử lý redirect
            }
        }
    });

    // --- SWR Hook cho BIỂU ĐỒ ---
    const chartApiUrl = (user && user.subscriptionTier !== 'Free')
        ? `/api/posts/over-time?range=${timeRange}`
        : null;

    const {
        data: chartResponse,
        error: chartError,
        isLoading: isChartLoading,
        mutate: mutateChart
    } = useSWR(chartApiUrl, fetcher, {
        refreshInterval: 60000
    });

    const chartData = chartResponse?.data || [];

    // --- HÀM EXPORT EXCEL ---
    const handleExportExcel = async () => {
        if (!exportStartDate || !exportEndDate) {
            alert("Please select both start and end dates.");
            return;
        }

        setIsExporting(true);

        try {
            const params = new URLSearchParams({
                startDate: exportStartDate,
                endDate: exportEndDate,
                sortOrder: sortOrder,
                columns: selectedColumns.join(','),
                format: 'json'
            });
            const endpoint = `posts/export?${params.toString()}`;

            const data = await api(endpoint, { method: 'GET' });

            if (!data || data.length === 0) {
                alert("No data available for the selected date range.");
                setIsExporting(false);
                return;
            }

            const titleRow = ["Crisis Alert Mentions Export"];
            const dateRangeRow = [`Date Range: ${exportStartDate} to ${exportEndDate}`];
            const blankRow = [];
            const headerAOA = [titleRow, dateRangeRow, blankRow];
            const worksheet = XLSX.utils.aoa_to_sheet(headerAOA);

            XLSX.utils.sheet_add_json(worksheet, data, {
                origin: "A4",
                skipHeader: false
            });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Mentions");
            XLSX.writeFile(workbook, `CrisisAlert_Mentions_${exportStartDate}_to_${exportEndDate}.xlsx`);

            setIsModalOpen(false);
            setExportStartDate('');
            setExportEndDate('');

        } catch (error) {
            console.error("Error when exporting EXCEL:", error);
            let errorMsg = error.message || 'Unknown error occurred during export.';
            if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
                alert('Your session has expired. You will be returned to the login page.');
            } else if (errorMsg.includes('403') || errorMsg.includes('Access denied')) {
                alert('Access Denied: Excel export is a Pro feature. Please upgrade your plan.');
            } else {
                alert(`Error occured: ${errorMsg}`);
            }
        } finally {
            setIsExporting(false);
        }
    };

    // --- HÀM EXPORT PDF ---
    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams({
                startDate: exportStartDate,
                endDate: exportEndDate,
                sortOrder: sortOrder,
                columns: selectedColumns.join(',')
            });
            const apiUrl = `/api/posts/export-pdf?${params.toString()}`;
            console.log("Calling API:", apiUrl);

            const token = getToken();
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                console.warn("Warning: No token found in 'crisisAlertToken'. Request may fail.");
            }

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: headers,
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Token used:", token ? "Yes" : "None");
                if (response.status === 403) {
                    throw new Error('Access Denied: PDF export is a VIP/Pro feature. Please upgrade your plan.');
                }
                throw new Error(`Lỗi máy chủ (${response.status}): ${errorText.substring(0, 100)}`);
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            const disposition = response.headers.get('Content-Disposition');
            const filenameMatch = disposition && disposition.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : `CrisisAlert_Mentions_${exportStartDate}_to_${exportEndDate}.pdf`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
            setIsModalOpen(false);
            setExportStartDate("");
            setExportEndDate("");
        } catch (err) {
            console.error("PDF Export Error:", err);
            alert(`Lỗi Export PDF: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleFinalExport = () => {
        if (!exportStartDate || !exportEndDate) {
            alert("Please select both start and end dates.");
            return;
        }
        if (exportType === 'excel') {
            handleExportExcel();
        } else if (exportType === 'pdf') {
            handleExportPdf();
        }
    }

    // --- Khối xử lý Lỗi (cho Stats) ---
    if (statsError && !statsData) {
        return (
            <main className="p-8 min-h-screen flex items-center justify-center">
                <div className="text-center py-10 px-6 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Dashboard Data</h3>
                    <p className="mt-1 text-sm text-red-300">{statsError.message || 'Could not load dashboard stats.'}</p>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => mutateStats()}
                            className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // --- Khối xử lý Loading (Skeleton) ---
    if (isAuthLoading || (isStatsLoading && !statsData) || (isChartLoading && !chartResponse && chartApiUrl != null)) {
        return (
            <div className="min-h-screen text-gray-200 overflow-x-hidden">
                <main className="p-4 sm:p-6 md:p-8">
                    {/* Skeleton cho Header */}
                    <div className="mb-8 animate-pulse">
                        <div className="h-10 bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/DASHBOARD CONTENT (WITH EXPORT OPTIONS):/3"></div>
                    </div>

                    {/* Skeleton cho STAT CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        <StatCardSkeleton title="Active Alerts" icon={AlertCircle} color="text-red-400" />
                        <StatCardSkeleton title="Total Alert-Mentioned Posts" icon={MessageSquare} color="text-blue-400" />
                        <StatCardSkeleton title="Total Alerts" icon={Newspaper} color="text-green-400" />
                    </div>

                    {/* Skeleton cho CHART */}
                    <MainChartSkeleton />
                </main>
            </div>
        );
    }

    // --- Khối return chính (khi có data) ---
    return (
        <div className="min-h-screen text-gray-200 overflow-x-hidden">
            <main className="p-4 sm:p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Alerts Dashboard</h1>
                    <p className="text-gray-300">Overview of your brand's current status.</p>
                </div>

                {/* --- STAT CARDS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <StatCard
                        title="Active Alerts"
                        value={(statsData?.activeAlerts ?? 0).toString()}
                        icon={AlertCircle}
                        color="text-red-400"
                    />
                    <StatCard
                        title="Total Alert-Mentioned Posts"
                        value={(statsData?.totalMentionedPosts ?? 0).toLocaleString()}
                        icon={MessageSquare}
                        color="text-blue-400"
                    />
                    <StatCard
                        title="Total Alerts"
                        value={`${statsData?.totalAlerts ?? 0} Alerts`}
                        icon={Newspaper}
                        color="text-green-400"
                    />
                </div>

                {/* --- CHART SECTION --- */}
                <div className="bg-slate-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg">

                    {/* --- TIÊU ĐỀ, TOGGLE, VÀ NÚT EXPORT --- */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">
                            {user && user.subscriptionTier === 'Free'
                                ? 'Sentiment Analysis (Upgrade to Unlock)'
                                : `Mentions Over Time (Last ${timeRange === '7days' ? '7 Days' : '6 Months'})`
                            }
                        </h2>

                        {/* --- CẢ KHỐI NÚT BẤM --- */}
                        {user && user.subscriptionTier !== 'Free' && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Nút Toggle */}
                                <div className="flex bg-slate-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setTimeRange('7days')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${timeRange === '7days'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        7 Days
                                    </button>
                                    <button
                                        onClick={() => setTimeRange('6months')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${timeRange === '6months'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        6 Months
                                    </button>
                                </div>

                                {/* Nút Export */}
                                <button
                                    onClick={() => {
                                        if (user && user.subscriptionTier === 'Pro') {
                                            setExportType('excel');
                                        } else {
                                            setExportType('pdf');
                                        }
                                        setIsModalOpen(true);
                                    }}
                                    className="p-2 bg-slate-700 text-green-400 rounded-lg hover:bg-slate-600"
                                    title="Export Data"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* --- MAIN CHART --- */}
                    {/* Nếu là Free, hiện component "Khóa" */}
                    {user && user.subscriptionTier === 'Free' ? (
                        <div className="h-80 md:h-96 w-full flex flex-col items-center justify-center text-center p-4">
                            <Lock className="mx-auto h-12 w-12 text-yellow-500 opacity-50" />
                            <h3 className="mt-4 text-xl font-semibold text-white">Sentiment Analysis is Locked</h3>
                            <p className="mt-2 text-slate-400">Upgrade to VIP or Pro to unlock this feature.</p>

                            <Link
                                href="/buy"
                                className="mt-6 flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all text-sm"
                            >
                                <Zap size={16} />
                                Unlock Feature
                            </Link>

                        </div>
                    ) : (
                        // Nếu là VIP/Pro, hiện Chart
                        <div className="h-80 md:h-96 w-full">
                            <MainChart
                                chartData={chartData}
                                isLoading={isChartLoading}
                                error={chartError}
                                onRetry={() => mutateChart()}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* --- EXPORT MODAL --- */}
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Export Mentions Data"
                    size="max-w-md"
                    footer={
                        <>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFinalExport}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                                disabled={!exportStartDate || !exportEndDate || isExporting}
                            >
                                {isExporting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                {isExporting ? 'Exporting...' : `Export ${exportType.toUpperCase()}`}
                            </button>
                        </>
                    }
                >
                    {/* Children của Modal */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Export Format
                            </label>
                            <div className="flex bg-slate-700 rounded-lg p-1">

                                {/* --- NÚT EXCEL --- */}
                                {user && user.subscriptionTier === 'Pro' && (
                                    <button
                                        onClick={() => setExportType('excel')}
                                        className={`flex-1 px-3 py-1 rounded-md text-sm font-medium ${exportType === 'excel'
                                            ? 'bg-green-500 text-white'
                                            : 'text-gray-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        Excel (.xlsx)
                                    </button>
                                )}

                                {/* --- NÚT PDF --- */}
                                {user && (user.subscriptionTier === 'VIP' || user.subscriptionTier === 'Pro') && (
                                    <button
                                        onClick={() => setExportType('pdf')}
                                        className={`flex-1 px-3 py-1 rounded-md text-sm font-medium ${exportType === 'pdf'
                                            ? 'bg-red-500 text-white'
                                            : 'text-gray-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        PDF (.pdf)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tùy chọn 2: Chọn cột */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Export Columns
                            </label>
                            {/* Dùng component MultiSelectDropdown có sẵn */}
                            <MultiSelectDropdown
                                title={selectedColumns.length === EXPORT_COLUMN_OPTIONS.length
                                    ? "All Columns"
                                    : `${selectedColumns.length} Columns Selected`
                                }
                                options={EXPORT_COLUMN_OPTIONS}
                                selectedOptions={selectedColumns}
                                onChange={setSelectedColumns}
                            />
                        </div>

                        {/* Tùy chọn 3: Sắp xếp */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Sort Order (by Date)
                            </label>

                            <div className="flex bg-slate-700 rounded-lg p-1">
                                <button
                                    onClick={() => setSortOrder('desc')}
                                    className={`flex-1 px-3 py-1 rounded-md text-sm font-medium ${sortOrder === 'desc'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-300 hover:bg-slate-600'
                                        }`}
                                >
                                    Newest First
                                </button>

                                <button
                                    onClick={() => setSortOrder('asc')}
                                    className={`flex-1 px-3 py-1 rounded-md text-sm font-medium ${sortOrder === 'asc'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-300 hover:bg-slate-600'
                                        }`}
                                >
                                    Oldest First
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                value={exportStartDate}
                                onChange={(e) => setExportStartDate(e.target.value)}
                                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md p-2 text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                value={exportEndDate}
                                onChange={(e) => setExportEndDate(e.target.value)}
                                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md p-2 text-white"
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}