// frontend/app/dashboard/DashboardContent.jsx
'use client';

// --- Imports ---
import { useState } from 'react';
import useSWR from 'swr';
import StatCard from '@/app/components/StatCard';
import MainChart from '@/app/components/MainChart';
import Modal from '@/app/components/Modal';
import { fetcher, api } from '@/utils/api'; // <-- 1. IMPORT THÊM HÀM 'api'
import * as XLSX from 'xlsx';
import { AlertCircle, Newspaper, MessageSquare, RefreshCw, Loader2, Download } from 'lucide-react';
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

// --- Component Chính ---
export default function DashboardContent() {
    const router = useRouter();

    // --- STATE ---
    const [timeRange, setTimeRange] = useState('7days');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    // --- SWR Hook cho STAT CARDS ---
    const {
        data: statsData,
        error: statsError,
        isLoading: isStatsLoading,
        mutate: mutateStats
    } = useSWR('/api/alerts/stats', fetcher, { // Đã thêm 'fetcher'
        refreshInterval: 60000,
        onError: (err) => {
            if (err.message.includes('Unauthorized') || err.message.includes('401')) {
                // Hàm 'api' trong fetcher sẽ tự động xử lý redirect
            }
        }
    });

    // --- SWR Hook cho BIỂU ĐỒ ---
    const chartApiUrl = `/api/posts/over-time?range=${timeRange}`;

    const {
        data: chartResponse,
        error: chartError,
        isLoading: isChartLoading,
        mutate: mutateChart
    } = useSWR(chartApiUrl, fetcher, {
        refreshInterval: 60000
    });

    const chartData = chartResponse?.data || [];

    // --- 2. HÀM EXPORT ĐÃ ĐƯỢC VIẾT LẠI HOÀN TOÀN ---
    const handleExport = async () => {
        if (!exportStartDate || !exportEndDate) {
            alert("Please select both start and end dates.");
            return;
        }

        setIsExporting(true);

        try {
            // Xây dựng endpoint (giống hệt SWR, bỏ /api/ đi)
            const endpoint = `posts/export?startDate=${exportStartDate}&endDate=${exportEndDate}`;

            // Dùng hàm 'api'
            // Nó sẽ tự động thêm Base URL và Header Authorization
            // Nó trả về JSON data (nếu thành công) hoặc ném lỗi (nếu thất bại)
            const data = await api(endpoint, {
                method: 'GET'
            });

            if (!data || data.length === 0) {
                alert("No data available for the selected date range.");
                setIsExporting(false);
                return;
            }

            // 2. Tạo các hàng Tiêu đề và Hàng trống
            const titleRow = ["Crisis Alert Mentions Export"];
            const dateRangeRow = [`Date Range: ${exportStartDate} to ${exportEndDate}`];
            const blankRow = []; // Hàng trống

            // Gom các hàng tiêu đề lại thành một mảng của các mảng (AOA)
            const headerAOA = [titleRow, dateRangeRow, blankRow];

            // 3. Tạo một worksheet MỚI từ mảng tiêu đề (AOA)
            // Thao tác này sẽ đặt "Crisis Alert..." vào ô A1
            // và "Date Range..." vào ô A2
            const worksheet = XLSX.utils.aoa_to_sheet(headerAOA);

            // 4. Thêm dữ liệu JSON vào worksheet đã có
            // Chúng ta bảo nó bắt đầu thêm từ ô "A4" (vì A1, A2, A3 đã được dùng)
            XLSX.utils.sheet_add_json(worksheet, data, {
                origin: "A4",       // Bắt đầu từ ô A4
                skipHeader: false   // Giữ nguyên hàng header (id, title, content...)
            });

            // 5. Tạo workbook và tải file (giữ nguyên)
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Mentions");

            XLSX.writeFile(workbook, `CrisisAlert_Mentions_${exportStartDate}_to_${exportEndDate}.xlsx`);

            setIsModalOpen(false);
            setExportStartDate('');
            setExportEndDate('');

        } catch (error) {
            // Hàm 'api' của bạn sẽ ném lỗi (đã bao gồm 'message')
            console.error("Error when expoerting:", error);
            let errorMsg = error.message || 'Unknown error occurred during export.';

            // Hàm 'api' của bạn đã tự xử lý redirect nếu lỗi 401
            // Chúng ta chỉ cần hiển thị thông báo
            if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
                alert('Your session has expired. You will be returned to the login page.');
            } else {
                alert(`Error occured: ${errorMsg}`);
            }
        } finally {
            setIsExporting(false);
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
    if ((isStatsLoading && !statsData) || (isChartLoading && !chartResponse && timeRange === '7days')) {
        return (
            <div className="min-h-screen text-gray-200 overflow-x-hidden">
                <main className="p-4 sm:p-6 md:p-8">
                    {/* Skeleton cho Header */}
                    <div className="mb-8 animate-pulse">
                        <div className="h-10 bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/K"></div>
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

                {/* --- CHART SECTION (ĐÃ CẬP NHẬT) --- */}
                <div className="bg-slate-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg">

                    {/* --- TIÊU ĐỀ, TOGGLE, VÀ NÚT EXPORT --- */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">
                            Mentions Over Time (Last {timeRange === '7days' ? '7 Days' : '6 Months'})
                        </h2>

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
                                onClick={() => setIsModalOpen(true)}
                                className="p-2 bg-slate-700 text-green-400 rounded-lg hover:bg-slate-600"
                                title="Export Data"
                            >
                                <Download size={20} />
                            </button>
                        </div>
                    </div>

                    {/* --- MAIN CHART --- */}
                    <div className="h-80 md:h-96 w-full">
                        <MainChart
                            chartData={chartData}
                            isLoading={isChartLoading}
                            error={chartError}
                            onRetry={() => mutateChart()}
                        />
                    </div>
                </div>
            </main>

            {/* --- EXPORT MODAL --- */}
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
                            onClick={handleExport}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                            disabled={!exportStartDate || !exportEndDate || isExporting}
                        >
                            {isExporting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            {isExporting ? 'Exporting...' : 'Export'}
                        </button>
                    </>
                }
            >
                {/* Children của Modal */}
                <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                        Select a date range to export all mention posts (Positive and Negative).
                    </p>
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
        </div>
    );
}