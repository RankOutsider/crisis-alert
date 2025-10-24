// frontend/app/dashboard/alerts/[id]/page.jsx
'use client';

// --- Imports ---
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react'; // Bỏ useCallback
import Link from 'next/link';
import useSWR from 'swr';
import {
    ArrowLeft, Tag, Globe, ShieldCheck, AlertTriangle, ExternalLink, Search,
    CheckCircle, AlertCircle as AlertIcon, BookOpen, RefreshCw // Thêm RefreshCw
} from 'lucide-react';
import { api, fetcher } from '@/utils/api'; // Import api và fetcher
// Bỏ import MultiSelectDropdown
import FilterBar from '@/app/components/FilterBar'; // <-- THÊM IMPORT NÀY

// --- Constants ---
// Danh sách các trường có thể tìm kiếm trong Posts
const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source'];
// Các lựa chọn cho dropdown Platform
const PLATFORM_OPTIONS = ['Facebook', 'X', 'Instagram', 'News', 'Tiktok', 'Forum', 'Threads', 'Youtube', 'Blog'];
// Các lựa chọn cho dropdown Sentiment
const SENTIMENT_OPTIONS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];

// --- useDebounce Hook ---
// Hook để trì hoãn việc cập nhật giá trị (thường dùng cho ô tìm kiếm)
function useDebounce(value, delay) {
    // State lưu giá trị đã trì hoãn
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        // Tạo timeout để cập nhật giá trị sau 'delay' ms
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        // Hủy timeout nếu 'value' hoặc 'delay' thay đổi trước khi timeout kết thúc
        return () => { clearTimeout(handler); };
    }, [value, delay]); // Chạy lại effect khi value hoặc delay thay đổi
    return debouncedValue; // Trả về giá trị đã trì hoãn
}

// --- Component Chính ---
export default function AlertDetailPage() {
    // --- Hooks ---
    // Lấy các tham số từ URL và router
    const params = useParams(); // Lấy tham số động từ URL (vd: [id])
    const router = useRouter(); // Dùng để điều hướng
    const pathname = usePathname(); // Lấy đường dẫn hiện tại (vd: /dashboard/alerts/123)
    const searchParams = useSearchParams(); // Lấy các tham số query từ URL (vd: ?q=abc&page=2)
    const alertId = params.id; // Lấy ID của alert từ URL

    // --- State ---
    // Các state quản lý trạng thái UI phụ (không phải dữ liệu chính)
    const [isUpdating, setIsUpdating] = useState(false); // Trạng thái loading khi cập nhật status
    const [isScanning, setIsScanning] = useState(false); // Trạng thái loading khi scan posts
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' }); // Thông báo kết quả scan
    const [isCreatingCaseStudy, setIsCreatingCaseStudy] = useState(false); // Trạng thái loading khi tạo case study
    const [caseStudyStatus, setCaseStudyStatus] = useState({ type: '', text: '' }); // Thông báo kết quả tạo case study

    // State cho ô tìm kiếm trong FilterBar
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || ''); // Lấy giá trị ban đầu từ URL param 'q'
    // Giá trị tìm kiếm đã được trì hoãn
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- Derived State from URL (Tính toán state từ URL cho FilterBar) ---
    // Tính toán trạng thái các checkbox 'Search in' dựa trên URL param 'fields'
    const activeFields = useMemo(() => {
        const fieldsParam = searchParams.get('fields');
        // Mặc định: Nếu không có param 'fields', tất cả đều được chọn
        if (fieldsParam === null) {
            return { title: true, content: true, source: true };
        }
        // Nếu param 'fields' là chuỗi rỗng, không có gì được chọn
        if (fieldsParam === '') {
            return { title: false, content: false, source: false };
        }
        // Parse chuỗi fields thành Set để kiểm tra hiệu quả
        const urlFields = new Set(fieldsParam.split(','));
        // Trả về object trạng thái cho từng field
        return {
            title: urlFields.has('title'),
            content: urlFields.has('content'),
            source: urlFields.has('source'),
        };
    }, [searchParams]); // Chạy lại khi searchParams thay đổi

    // Lấy danh sách platforms đã chọn từ URL param 'platforms'
    const selectedPlatforms = useMemo(() => {
        // Lấy param, tách chuỗi bằng dấu ',', lọc bỏ phần tử rỗng, trả về mảng hoặc mảng rỗng
        return searchParams.get('platforms')?.split(',').filter(Boolean) || [];
    }, [searchParams]); // Chạy lại khi searchParams thay đổi

    // Lấy danh sách sentiments đã chọn từ URL param 'sentiments'
    const selectedSentiments = useMemo(() => {
        return searchParams.get('sentiments')?.split(',').filter(Boolean) || [];
    }, [searchParams]); // Chạy lại khi searchParams thay đổi

    // --- API URL Construction (Tính toán URL API cho SWR) ---
    // URL để fetch chi tiết Alert
    const alertApiUrl = useMemo(() => alertId ? `/api/alerts/${alertId}` : null, [alertId]); // Chỉ tạo URL khi có alertId
    // URL để fetch danh sách Posts
    const postsApiUrl = useMemo(() => {
        if (!alertId) return null; // Không fetch nếu chưa có alertId
        // Lấy các tham số hiện tại từ URL làm cơ sở
        const params = new URLSearchParams(searchParams.toString());
        // Xóa các tham số không cần thiết hoặc sẽ được đặt lại
        params.delete('q');       // 'q' chỉ dùng để hiển thị trên URL, API dùng 'search'
        params.delete('search');  // Xóa 'search' cũ (nếu có)
        params.delete('fields');  // Xóa 'fields' cũ (sẽ đặt lại dựa trên activeFields)

        // Lấy danh sách các key của field đang được active (true)
        const activeFieldKeys = Object.keys(activeFields).filter(field => activeFields[field]);

        // Thêm tham số 'search' và 'fields' vào URL nếu có từ khóa và field được chọn
        if (debouncedSearchTerm && activeFieldKeys.length > 0) {
            params.set('search', debouncedSearchTerm); // Dùng giá trị đã debounce
            params.set('fields', activeFieldKeys.join(','));
        }
        // Các tham số 'platforms' và 'sentiments' đã có sẵn trong 'params' (lấy từ searchParams ban đầu)

        // Trả về URL hoàn chỉnh cho API
        return `/api/posts/by-alert/${alertId}?${params.toString()}`;
    }, [alertId, debouncedSearchTerm, activeFields, searchParams]); // Chạy lại khi các giá trị này thay đổi

    // --- Data Fetching (Lấy dữ liệu bằng SWR) ---
    // Fetch chi tiết Alert
    const {
        data: alertData,          // Dữ liệu trả về (đổi tên để tránh trùng)
        error: alertError,        // Lỗi (đổi tên)
        isLoading: isAlertLoading,// Trạng thái loading (đổi tên)
        mutate: mutateAlert       // Hàm để trigger fetch lại dữ liệu alert
    } = useSWR(alertApiUrl, fetcher); // Gọi SWR với URL và fetcher
    const alert = alertData; // Gán dữ liệu vào biến 'alert' để sử dụng trong component

    // Fetch danh sách Posts
    const {
        data: postsData,          // Dữ liệu trả về
        error: postsError,        // Lỗi
        isLoading: isPostsLoading,// Trạng thái loading
        mutate: mutatePosts       // Hàm để trigger fetch lại dữ liệu posts
    } = useSWR(postsApiUrl, fetcher, { keepPreviousData: true }); // Giữ dữ liệu cũ hiển thị khi đang fetch mới
    const posts = postsData?.posts || []; // Lấy mảng posts từ data (hoặc mảng rỗng nếu chưa có)

    // --- useEffects ---
    // Đồng bộ URL param 'q' -> state 'searchTerm' (Khi người dùng bấm nút back/forward)
    useEffect(() => {
        const searchTermFromUrl = searchParams.get('q') || '';
        // Chỉ cập nhật state nếu giá trị trên URL khác state hiện tại
        if (searchTermFromUrl !== searchTerm) {
            setSearchTerm(searchTermFromUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]); // Chạy lại khi searchParams thay đổi

    // Đồng bộ state 'debouncedSearchTerm' -> URL param 'q' (Sau khi người dùng ngừng gõ)
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentQ = params.get('q') || '';
        // Chỉ cập nhật URL nếu giá trị đã debounce khác giá trị 'q' hiện tại trên URL
        if (debouncedSearchTerm !== currentQ) {
            if (debouncedSearchTerm) {
                params.set('q', debouncedSearchTerm); // Đặt giá trị mới
            } else {
                params.delete('q'); // Xóa 'q' nếu ô tìm kiếm rỗng
            }
            // Không cần reset page ở đây, SWR sẽ tự fetch URL mới
            // Thay thế URL hiện tại mà không tạo entry mới trong history
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearchTerm, pathname, router, searchParams]); // Chạy lại khi debounce hoặc URL thay đổi


    // --- HANDLERS (Các hàm xử lý sự kiện) ---

    // Handler cho checkbox 'Search in' (cập nhật URL param 'fields')
    const handlePostSearchFieldChange = (field) => { // Tham số 'field' là 'Title', 'Content', hoặc 'Source'
        const fieldKey = field.toLowerCase(); // Chuyển sang key viết thường
        // Tạo object trạng thái mới dựa trên trạng thái cũ
        const newFieldsState = { ...activeFields, [fieldKey]: !activeFields[fieldKey] };
        // Lấy danh sách các key đang active
        const activeFieldKeys = Object.keys(newFieldsState).filter(f => newFieldsState[f]);

        // Cập nhật URL
        const params = new URLSearchParams(searchParams.toString());
        if (activeFieldKeys.length === POST_SEARCH_FIELDS.length) {
            // Nếu tất cả được chọn (là trạng thái mặc định), xóa param 'fields' khỏi URL
            params.delete('fields');
        } else {
            // Ngược lại, set param 'fields' (có thể là chuỗi rỗng nếu không có gì được chọn)
            params.set('fields', activeFieldKeys.join(','));
        }
        // Cập nhật URL bằng router.push để SWR nhận biết sự thay đổi
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Handler cho dropdown Platforms (cập nhật URL param 'platforms')
    const handlePlatformChange = (newSelection) => { // newSelection là mảng các platform mới được chọn
        const params = new URLSearchParams(searchParams.toString());
        if (newSelection.length > 0) {
            params.set('platforms', newSelection.join(',')); // Set param nếu có lựa chọn
        } else {
            params.delete('platforms'); // Xóa param nếu không có lựa chọn nào
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false }); // Cập nhật URL
    };

    // Handler cho dropdown Sentiments (cập nhật URL param 'sentiments')
    const handleSentimentChange = (newSelection) => { // newSelection là mảng các sentiment mới được chọn
        const params = new URLSearchParams(searchParams.toString());
        if (newSelection.length > 0) {
            params.set('sentiments', newSelection.join(',')); // Set param nếu có lựa chọn
        } else {
            params.delete('sentiments'); // Xóa param nếu không có lựa chọn nào
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false }); // Cập nhật URL
    };

    // Handler quét posts cho alert hiện tại
    const handleScan = async () => {
        if (!alertId || isScanning) return; // Kiểm tra điều kiện
        setIsScanning(true); // Bắt đầu loading
        setScanMessage({ type: '', text: '' }); // Reset thông báo
        try {
            // Gọi API scan
            const result = await api(`alerts/${alertId}/scan`, { method: 'POST' });
            setScanMessage({ type: 'success', text: result.message || 'Scan completed!' }); // Thông báo thành công 
            mutatePosts(); // Báo SWR fetch lại danh sách posts
            mutateAlert(); // Báo SWR fetch lại chi tiết alert (postCount có thể thay đổi)
        } catch (err) {
            setScanMessage({ type: 'error', text: err.message || 'Scan failed.' }); // Thông báo lỗi 
        } finally {
            setIsScanning(false); // Kết thúc loading
            setTimeout(() => setScanMessage({ type: '', text: '' }), 5000); // Tự ẩn thông báo
        }
    };

    // Handler bật/tắt status của Alert
    const handleToggleStatus = async () => {
        if (!alert || isUpdating) return; // Kiểm tra điều kiện
        setIsUpdating(true); // Bắt đầu loading
        const newStatus = alert.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'; // Xác định status mới
        try {
            // Gọi API cập nhật status
            await api(`alerts/${alert.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            // Báo SWR fetch lại chi tiết alert để cập nhật UI
            mutateAlert();
        } catch (err) {
            console.error("Failed to update status:", err); // Log lỗi
            mutateAlert(); // Fetch lại để đảm bảo UI đồng bộ (có thể revert nếu dùng optimistic update)
        } finally {
            setIsUpdating(false); // Kết thúc loading
        }
    };

    // Handler tạo Case Study từ Alert hiện tại
    const handleCreateCaseStudy = async () => {
        if (!alert || isCreatingCaseStudy) return; // Kiểm tra điều kiện
        setIsCreatingCaseStudy(true); // Bắt đầu loading
        setCaseStudyStatus({ type: 'info', text: 'Creating Case Study...' }); // Thông báo đang xử lý 
        try {
            // Chuẩn bị dữ liệu gửi đi (chỉ gửi ID và thông tin cần thiết)
            const payload = { alertId: alert.id, title: `Case Study: ${alert.title}`, description: alert.description || `Analysis for: ${alert.title}` };
            // Gọi API tạo case study
            await api(`casestudies`, { method: 'POST', body: JSON.stringify(payload) });
            // Thông báo thành công và chuẩn bị chuyển hướng
            setCaseStudyStatus({ type: 'success', text: 'Case Study created! Redirecting...' }); // Thông báo 
            // Chuyển hướng sau 1.5 giây
            setTimeout(() => router.push('/dashboard/casestudies'), 1500);
        } catch (err) {
            // Hiển thị lỗi validation từ backend hoặc lỗi chung
            const message = err.errors?.[0]?.msg || err.message || 'Failed to create Case Study.'; // Thông báo lỗi 
            setCaseStudyStatus({ type: 'error', text: message });
            // Tự ẩn thông báo lỗi sau 5 giây
            setTimeout(() => setCaseStudyStatus({ type: '', text: '' }), 5000);
        } finally {
            setIsCreatingCaseStudy(false); // Kết thúc loading
        }
    };

    // --- Xử lý Loading/Error ban đầu cho chi tiết Alert ---
    // Hiển thị loading nếu SWR đang fetch chi tiết alert lần đầu
    if (isAlertLoading) return <div className="p-8 text-center text-gray-400">Loading alert details...</div>; // Text 
    // Hiển thị lỗi nếu fetch chi tiết alert thất bại
    if (alertError) return (
        <div className="p-8 text-center text-red-400">
            <p>Error loading alert details.</p> {/* Text  */}
            {/* Nút thử lại */}
            <button onClick={() => mutateAlert()} className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">Retry</button> {/* Text  */}
        </div>
    );
    // Hiển thị nếu không tìm thấy alert (ví dụ: ID sai, lỗi 404)
    if (!alert) return <div className="p-8 text-center text-gray-400">Alert not found.</div>; // Text 

    // --- JSX ---
    // Phần render giao diện chính
    return (
        <div className="p-4 md:p-6 lg:p-8 text-gray-200 overflow-x-hidden"> {/* Đã thêm overflow-x-hidden */}
            {/* Nút Back */}
            <Link href="/dashboard/alerts" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
                <ArrowLeft size={20} />
                Back to All Alerts {/* Text  */}
            </Link>

            {/* Header: Title và Nút Create Case Study */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">{alert.title}</h1>
                <button onClick={handleCreateCaseStudy} disabled={isCreatingCaseStudy} className="flex-shrink-0 flex items-center gap-2 px-6 py-2 text-base font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isCreatingCaseStudy ? 'Creating...' : <><BookOpen size={20} /> Create Case Study</>} {/* Text  */}
                </button>
            </div>
            {/* Thông báo trạng thái tạo Case Study */}
            {caseStudyStatus.text && (
                <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${caseStudyStatus.type === 'success' ? 'bg-green-500/20 text-green-300' : caseStudyStatus.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {caseStudyStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertIcon size={18} />}
                    <span>{caseStudyStatus.text}</span>
                </div>
            )}

            {/* Phần hiển thị chi tiết Alert */}
            <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg mb-8">
                <p className="text-gray-400 mb-6">{alert.description || <span className="italic text-slate-500">No description provided.</span>}</p> {/* Text  */}
                {/* Status và Severity */}
                <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8">
                    {/* Status Toggle */}
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Status</p> {/* Label  */}
                            <span className={`font-semibold ${alert.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-500'}`}>{alert.status}</span>
                        </div>
                        <button onClick={handleToggleStatus} disabled={isUpdating} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 ${alert.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${alert.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    {/* Severity */}
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Severity</p> {/* Label  */}
                            <span className={`font-semibold ${alert.severity === 'Critical' && 'text-red-400'} ${alert.severity === 'High' && 'text-orange-400'} ${alert.severity === 'Medium' && 'text-yellow-400'} ${alert.severity === 'Low' && 'text-green-400'}`}>{alert.severity}</span>
                        </div>
                    </div>
                </div>
                {/* Keywords & Platforms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Tag size={20} /> Keywords</h2> {/* Title  */}
                        <div className="flex flex-wrap gap-2">{alert.keywords?.length > 0 ? alert.keywords.map(kw => (<span key={kw} className="bg-slate-700 text-gray-300 px-3 py-1 rounded-full text-sm">{kw}</span>)) : <span className="italic text-slate-500">No keywords specified.</span>}</div> {/* Text  */}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Globe size={20} /> Platforms</h2> {/* Title  */}
                        <div className="flex flex-wrap gap-2">{alert.platforms?.length > 0 ? alert.platforms.map(p => (<span key={p} className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm">{p}</span>)) : <span className="italic text-slate-500">No platforms specified.</span>}</div> {/* Text  */}
                    </div>
                </div>
            </div>

            {/* Phần hiển thị danh sách Posts */}
            <div className="mt-8">
                {/* Header và Nút Scan */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                    <h2 className="text-2xl font-bold text-white">Mentioned Posts</h2> {/* Title  */}
                    <button onClick={handleScan} disabled={isScanning || alert.status !== 'ACTIVE'} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Search size={16} />
                        {/* Button Text  */}
                        {isScanning ? 'Scanning...' : (alert.status !== 'ACTIVE' ? 'Alert must be active to scan' : 'Scan For Posts')}
                    </button>
                </div>
                {/* Thông báo kết quả Scan */}
                {scanMessage.text && (
                    <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${scanMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {scanMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertIcon size={18} />}
                        <span>{scanMessage.text}</span>
                    </div>
                )}

                {/* Thanh Filter cho Posts (Sử dụng component FilterBar) */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in mentioned posts..." // Placeholder 

                    availableFields={POST_SEARCH_FIELDS} // Fields cho Posts
                    activeFields={activeFields} // State đọc từ URL
                    onFieldChange={handlePostSearchFieldChange} // Handler cập nhật URL

                    platformOptions={PLATFORM_OPTIONS}
                    selectedPlatforms={selectedPlatforms} // State đọc từ URL
                    onPlatformChange={handlePlatformChange} // Handler cập nhật URL

                    sentimentOptions={SENTIMENT_OPTIONS}
                    selectedSentiments={selectedSentiments} // State đọc từ URL
                    onSentimentChange={handleSentimentChange} // Handler cập nhật URL
                />

                {/* Hiển thị danh sách Posts hoặc trạng thái Loading/Error/Empty */}
                {/* Trạng thái Loading (chỉ khi load lần đầu) */}
                {isPostsLoading && !postsData && (
                    <p className="text-center text-gray-400 py-10">Loading posts...</p> // Loading Text 
                )}
                {/* Trạng thái Lỗi */}
                {postsError && (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-red-900/50 rounded-lg bg-red-900/10">
                        <AlertIcon className="mx-auto h-12 w-12 text-red-400" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Error Loading Posts</h3> {/* Error Title  */}
                        <p className="mt-1 text-sm text-red-300">{postsError.message || 'Could not load posts for this alert.'}</p> {/* Error Message  */}
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => mutatePosts()} // Trigger fetch lại posts
                                className="inline-flex items-center rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry {/* Button Text */}
                            </button>
                        </div>
                    </div>
                )}
                {/* Trạng thái Hiển thị Dữ liệu hoặc Rỗng */}
                {!isPostsLoading && !postsError && (
                    <div className="space-y-4">
                        {posts.length > 0 ? posts.map(post => (
                            // --- Thẻ Post ---
                            <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors duration-150 overflow-hidden">
                                <div className="flex justify-between items-start gap-2 min-w-0">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-lg text-white mb-1 truncate" title={post.title}>{post.title}</h3>
                                    </div>
                                    <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                                        <ExternalLink size={16} /> View Source {/* Link Text  */}
                                    </a>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
                                    <span>From: <span className="font-medium text-gray-300 break-words">{post.source}</span></span>
                                    {post.platform && (
                                        <span className="flex items-center gap-1.5">
                                            <Globe size={14} />Platform: <span className="font-medium text-blue-300 capitalize">{post.platform}</span>
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-300 text-base line-clamp-3">{post.content}</p>
                                <div className="mt-3">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${post.sentiment === 'NEGATIVE' && 'bg-red-500/30 text-red-300'} ${post.sentiment === 'POSITIVE' && 'bg-green-500/30 text-green-300'} ${post.sentiment === 'NEUTRAL' && 'bg-gray-500/30 text-gray-300'}`}>
                                        {post.sentiment || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            // --- Hết Thẻ Post ---
                        )) : (
                            // --- Trạng thái rỗng cho Posts ---
                            <div className="text-center py-16 px-4 border-2 border-dashed border-slate-700 rounded-lg">
                                <Search size={48} className="mx-auto h-12 w-12 text-slate-500" />
                                <h3 className="mt-2 text-lg font-semibold text-white">No Matching Posts Found</h3> {/* Title  */}
                                <p className="mt-1 text-sm text-slate-400">
                                    {/* Message  */}
                                    {searchTerm || selectedPlatforms.length > 0 || selectedSentiments.length > 0
                                        ? "No posts associated with this alert match your current filters."
                                        : "No posts have been linked to this alert yet. Try scanning for posts."
                                    }
                                </p>
                                {/* Nút Clear Filters (nếu đang lọc) */}
                                {(searchTerm || selectedPlatforms.length > 0 || selectedSentiments.length > 0) && (
                                    <button
                                        onClick={() => {
                                            // Xóa các tham số filter khỏi URL
                                            const params = new URLSearchParams(searchParams.toString());
                                            params.delete('q');
                                            params.delete('fields');
                                            params.delete('platforms');
                                            params.delete('sentiments');
                                            router.push(`${pathname}?${params.toString()}`, { scroll: false });
                                            setSearchTerm(''); // Reset state input search
                                        }}
                                        className="mt-4 inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-600"
                                    >
                                        Clear Filters {/* Button Text  */}
                                    </button>
                                )}
                            </div>
                            // --- Hết Trạng thái rỗng ---
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}