// frontend/app/dashboard/DashboardContent.jsx
'use client';

import { useEffect, useState, useMemo, use } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import StatCard from '@/app/components/StatCard';
import Modal from '@/app/components/Modal';
import { fetcher, api, getToken } from '@/utils/api';
import * as XLSX from 'xlsx';

import MultiSelectDropdown from '../components/MultiSelectDropdown';

import { useAuth } from '@/app/providers.jsx';
import {
    AlertCircle, Newspaper, MessageSquare, RefreshCw, Loader2,
    Download, Lock, Zap, X as XIcon, Plus, Minus, Search
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MainChart = dynamic(() => import('@/app/components/MainChart'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full w-full bg-slate-800/50 rounded-lg">
            <p className="text-gray-400 text-sm">Loading Chart...</p>
        </div>
    )
});

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

const EXPORT_COLUMN_OPTIONS = ['id', 'title', 'content', 'source', 'sourceUrl', 'platform', 'sentiment', 'publishedAt'];

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

    // --- State cho các tùy chọn export ---
    const [sortBy, setSortBy] = useState('publishedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedColumns, setSelectedColumns] = useState(EXPORT_COLUMN_OPTIONS);

    const [chartModalData, setChartModalData] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const [searchDay, setSearchDay] = useState('');
    const [debouncedSearchDay, setDebouncedSearchDay] = useState(searchDay);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchDay(searchDay);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchDay]);

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
                sortField: sortBy,
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

            const filteredData = data.map(row => {
                const filteredRow = {};
                EXPORT_COLUMN_OPTIONS.forEach(columnkey => {
                    if (selectedColumns.includes(columnkey) && row.hasOwnProperty(columnkey)) {
                        filteredRow[columnkey] = row[columnkey];
                    }
                })
                return filteredRow;
            });

            const titleRow = ["Crisis Alert Mentions Export"];
            const dateRangeRow = [`Date Range: ${exportStartDate} to ${exportEndDate}`];
            const blankRow = [];
            const headerAOA = [titleRow, dateRangeRow, blankRow];
            const worksheet = XLSX.utils.aoa_to_sheet(headerAOA);

            XLSX.utils.sheet_add_json(worksheet, filteredData, {
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
                sortField: sortBy,
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

    // Xử lý nút "Xuất" cuối cùng
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

    // --- Hàm xử lý khi click vào cột biểu đồ ---
    const handleBarClick = (data, dataKey) => {
        console.log("3. [Dashboard] Đã nhận được data:", data);
        console.log("4. [Dashboard] Chế độ TimeRange hiện tại:", timeRange);

        // data: { name: "Nov 2025", positive: 25, negative: 25 }
        // dataKey: 'positive' | 'negative'
        // 1. Chỉ thực hiện khi đang xem "6months"
        if (timeRange !== '6months') {
            // Nếu đang xem 7days, chỉ hiện tổng (như cũ)
            setChartModalData({
                name: data.name,
                type: dataKey,
                value: data[dataKey]
            });
            return;
        }

        // 2. Đặt dữ liệu Tổng cho Modal
        setChartModalData({
            name: data.name, // "Nov 2025"
            totalPositive: data.positive,
            totalNegative: data.negative
        });

        // 3. Bắt đầu tải chi tiết
        fetchDetails(data.name);
    };

    // --- Hàm fetch chi tiết (API call) ---
    const fetchDetails = async (monthName) => {
        setIsDetailLoading(true);
        setDetailData(null);
        try {
            const result = await api(`posts/stats-by-day?month=${encodeURIComponent(monthName)}`);
            setDetailData(result.data); // result.data là mảng [ { name: 'Nov 01', ... } ]
        } catch (error) {
            console.error("Failed to fetch chart details:", error);
            setDetailData([]); // Đặt là mảng rỗng để biết là đã fetch xong
        } finally {
            setIsDetailLoading(false);
        }
    };

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
    if (isAuthLoading || !user || (isStatsLoading && !statsData) || (isChartLoading && !chartResponse && chartApiUrl != null)) {
        return (
            <div className="min-h-screen text-gray-200 overflow-x-hidden">
                <main className="p-4 sm:p-6 md:p-8">
                    {/* Skeleton cho Header */}
                    <div className="mb-8 animate-pulse">
                        <div className="h-10 bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/DASHBOARD CONTENT:/3"></div>
                    </div>

                    {/* Skeleton cho STAT CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        <StatCardSkeleton title="Active Alerts" icon={AlertCircle} color="text-red-400" />
                        <StatCardSkeleton title="Total Alert-Triggered Posts" icon={MessageSquare} color="text-blue-400" />
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
                {/* --- HEADER --- */}
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
                        title="Total Alert-Triggered Posts"
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
                    <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-4 mb-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white text-center sm:text-left">
                            {user && user.subscriptionTier === 'Free' ? (
                                'Sentiment Analysis (Upgrade to Unlock)'
                            ) : (
                                <>
                                    Mentions Over Time
                                    <br className="sm:hidden" />
                                    <span className="text-sm md:text-base text-gray-300">
                                        {timeRange === '7days' ? '7 Days' : '6 Months'}
                                    </span>
                                </>
                            )}
                        </h2>

                        {/* --- CẢ KHỐI NÚT BẤM --- */}
                        {user && user.subscriptionTier !== 'Free' && (
                            <div className="flex sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start">
                                {/* Nút Toggle */}
                                <div className="flex bg-slate-700 rounded-lg p-1 w-full sm:w-auto">
                                    <button
                                        onClick={() => setTimeRange('7days')}
                                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${timeRange === '7days'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        7 Days
                                    </button>
                                    <button
                                        onClick={() => setTimeRange('6months')}
                                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${timeRange === '6months'
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
                                    className="px-3 py-2 bg-slate-700 text-green-400 rounded-lg hover:bg-slate-600 flex items-center justify-center transition-colors flex-shrink-0"
                                    title="Export Data"
                                >
                                    <div className="flex items-center justify-center w-6 h-6">
                                        <Download size={20} />
                                    </div>
                                    <span className="text-sm font-medium hidden lg:inline">Export Data</span>
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

                                onBarClick={handleBarClick}
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
                                {isExporting ? <Loader2 size={16}
                                    className="animate-spin" /> :
                                    <Download size={16} />}
                                {isExporting ? 'Exporting...' :
                                    `Export ${exportType.toUpperCase()}`}
                            </button>
                        </>
                    }
                >
                    {/* Children của Modal */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-slate-300">
                                Select a date range and options to export mention posts.
                            </p>

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

                        {/* Tùy chọn 3: Sắp xếp theo Trường */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Sort By</label>
                            <div className="flex bg-slate-700 rounded-lg p-1">
                                <button
                                    onClick={() => setSortBy('publishedAt')}
                                    className={`flex-1 px-3 py-1 rounded-md text-sm font-medium ${sortBy === 'publishedAt' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-600'}`}
                                >
                                    Date
                                </button>

                                <button
                                    onClick={() => setSortBy('id')}
                                    className={`flex-1 px-3 py-1 rounded-md text-sm font-medium ${sortBy === 'id' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-600'}`}
                                >
                                    ID
                                </button>
                            </div>
                        </div>

                        {/* Tùy chọn 4: Sắp xếp theo Thứ tự */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Order</label>
                            <div className="flex bg-slate-700 rounded-lg p-1">
                                <button
                                    onClick={() => setSortOrder('desc')}
                                    className={`flex-1 px-3 py-1 rounded-md text-sm font-medium ${sortOrder === 'desc' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-600'}`}
                                >
                                    Descending
                                </button>

                                <button
                                    onClick={() => setSortOrder('asc')}
                                    className={`flex-1 px-3 py-1 rounded-md text-sm font-medium ${sortOrder === 'asc' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-600'}`}
                                >
                                    Ascending
                                </button>
                            </div>
                        </div>

                        {/* Tùy chọn 5: Chọn ngày bắt đầu */}
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

                        {/* Tùy chọn 6: Chọn ngày kết thúc */}
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

            {chartModalData && (
                <Modal
                    isOpen={!!chartModalData}
                    onClose={() => {
                        setChartModalData(null);
                        setDetailData(null);
                        setSearchDay('');
                    }}
                    title="Chart Data Detail"
                    size="max-w-sm"
                    footer={
                        <button
                            onClick={() => {
                                setChartModalData(null);
                                setDetailData(null);
                                setSearchDay('');
                            }}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                        >
                            Close
                        </button>
                    }
                >
                    <div className="space-y-4 p-2">
                        {/* 1. Thời gian */}
                        <div>
                            <p className="text-sm text-slate-400">Time Range</p>
                            <p className="text-xl font-bold text-white">{chartModalData.name}</p>
                        </div>

                        {/* 2. Logic hiển thị (Đơn giản hay Chi tiết) */}
                        {chartModalData.type && (
                            <div className={`p-4 rounded-lg ${chartModalData.type === 'positive'
                                ? 'bg-green-500/10 border border-green-500/30'
                                : 'bg-red-500/10 border border-red-500/30'
                                }`}>
                                <p className={`text-sm capitalize ${chartModalData.type === 'positive' ? 'text-green-300' : 'text-red-300'
                                    }`}>{chartModalData.type} Mentions</p>
                                <p className="text-3xl font-bold text-white">{chartModalData.value.toLocaleString()}</p>
                            </div>
                        )}

                        {/* B. Nếu là click 6-MONTH (dạng mới) */}
                        {!chartModalData.type && (
                            <>
                                {/* Tổng quan 2 cột */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                        <p className="text-sm text-green-300">Total Positive</p>
                                        <p className="text-2xl font-bold text-white">{(chartModalData.totalPositive || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                        <p className="text-sm text-red-300">Total Negative</p>
                                        <p className="text-2xl font-bold text-white">{(chartModalData.totalNegative || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Phân cách */}
                                <div className="border-t border-slate-700"></div>

                                {/* Chi tiết theo ngày */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-sm text-slate-400">Daily Breakdown</p>
                                    </div>

                                    {/* Ô TÌM KIẾM */}
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search size={14} className="text-slate-400" />
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Filter by day (e.g. 05, 12)..."
                                            className="block w-full pl-9 pr-3 py-2 border border-slate-600 rounded-md leading-5 bg-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-slate-600 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                                            value={searchDay}
                                            onChange={(e) => setSearchDay(e.target.value)}
                                        />
                                    </div>

                                    {/* Loading */}
                                    {isDetailLoading && (
                                        <div className="flex items-center justify-center h-24">
                                            <Loader2 size={24} className="animate-spin text-blue-400" />
                                        </div>
                                    )}

                                    {/* Danh sách hiển thị */}
                                    {detailData && !isDetailLoading && (
                                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">

                                            {/* HIỆU ỨNG LOADING KHI ĐANG GÕ */}
                                            {searchDay !== debouncedSearchDay ? (
                                                <div className="flex items-center justify-center py-4 text-slate-400 text-sm">
                                                    <Loader2 size={16} className="animate-spin mr-2" />
                                                    Searching...
                                                </div>
                                            ) : (
                                                // LOGIC LỌC
                                                (() => {
                                                    const filteredDetailData = detailData.filter(day =>
                                                        day.name.toLowerCase().includes(debouncedSearchDay.toLowerCase())
                                                    );

                                                    if (filteredDetailData.length === 0) {
                                                        return <p className="text-sm text-slate-500 text-center py-4">No days found.</p>;
                                                    }

                                                    return filteredDetailData.map((day) => (
                                                        <div key={day.name} className="flex justify-between items-center text-sm p-2 rounded-md bg-slate-800/60 hover:bg-slate-700/80 transition-colors">
                                                            <span className="font-medium text-slate-200">{day.name}</span>
                                                            <div className="flex gap-3">
                                                                <span className="flex items-center gap-1 text-green-400" title="Positive">
                                                                    <Plus size={12} /> {day.positive}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-red-400" title="Negative">
                                                                    <Minus size={12} /> {day.negative}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            )}

        </div>
    );
}