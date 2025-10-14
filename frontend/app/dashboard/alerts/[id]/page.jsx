'use client';

import { useParams, useRouter } from 'next/navigation'; // THÊM useRouter
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Tag, Globe, ShieldCheck, AlertTriangle, ExternalLink, Search, CheckCircle, AlertCircle as AlertIcon, BookOpen } from 'lucide-react'; // THÊM BookOpen
import { api } from '@/utils/api';

// Các trường có thể tìm kiếm trong Post
const POST_SEARCH_FIELDS = ['Title', 'Content', 'Source', 'Sentiment'];

export default function AlertDetailPage() {
    const params = useParams();
    const router = useRouter(); // SỬ DỤNG useRouter
    const alertId = params.id;

    // States for alert details
    const [alert, setAlert] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // States for posts
    const [posts, setPosts] = useState([]);
    const [isPostsLoading, setIsPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState('');

    // State cho chức năng quét
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState({ type: '', text: '' });

    // THÊM STATE CHO CASE STUDY
    const [isCreatingCaseStudy, setIsCreatingCaseStudy] = useState(false);
    const [caseStudyStatus, setCaseStudyStatus] = useState({ type: '', text: '' });

    // State cho tìm kiếm nâng cao của posts
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFields, setSearchFields] = useState({
        title: true,
        content: true,
        source: true,
        sentiment: false,
    });

    const fetchAlertDetail = async () => {
        if (!alertId) return;
        try {
            setIsLoading(true);
            const data = await api(`alerts/${alertId}`);
            setAlert(data);
        } catch (err) {
            setError('Failed to fetch alert details.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPosts = async () => {
        if (!alertId) return;
        try {
            setIsPostsLoading(true);
            const postsData = await api(`posts/by-alert/${alertId}`);
            setPosts(postsData);
        } catch (err) {
            setPostsError('Failed to fetch mentioned posts.');
            console.error(err);
        } finally {
            setIsPostsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlertDetail();
        fetchPosts();
    }, [alertId]);

    const handleToggleStatus = async () => {
        if (!alert || isUpdating) return;
        setIsUpdating(true);
        const newStatus = alert.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            setAlert(prev => ({ ...prev, status: newStatus }));
            await api(`alerts/${alert.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (err) {
            console.error("Failed to update status:", err);
            setAlert(prev => ({ ...prev, status: alert.status })); // Rollback on error
        } finally {
            setIsUpdating(false);
        }
    };

    const handleScan = async () => {
        if (!alertId || isScanning) return;
        setIsScanning(true);
        setScanMessage({ type: '', text: '' });
        try {
            const result = await api(`alerts/${alertId}/scan`, { method: 'POST' });
            setScanMessage({ type: 'success', text: result.message });
            await fetchPosts();
        } catch (err) {
            setScanMessage({ type: 'error', text: err.message || 'Scan failed.' });
        } finally {
            setIsScanning(false);
            setTimeout(() => setScanMessage({ type: '', text: '' }), 5000);
        }
    };

    // HÀM XỬ LÝ TẠO CASE STUDY MỚI
    const handleCreateCaseStudy = async () => {
        if (!alert || isCreatingCaseStudy) return;

        setIsCreatingCaseStudy(true);
        setCaseStudyStatus({ type: 'info', text: 'Creating Case Study...' });

        try {
            // TẠO TIÊU ĐỀ/MÔ TẢ MẶC ĐỊNH DỰA TRÊN ALERT
            const payload = {
                alertId: alert.id, // Giả định ID alert là alert.id
                title: `Case Study: ${alert.title}`,
                description: `Deep analysis related to alert: ${alert.title}. Initial keywords: ${alert.keywords.join(', ')}.`,
                sourceAlert: alert,
            };

            // Gọi API POST mới (/api/casestudies)
            const result = await api(`casestudies`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            setCaseStudyStatus({ type: 'success', text: result.message || 'Case Study created successfully! Redirecting...' });

            // Tự động chuyển hướng sau 1.5 giây
            setTimeout(() => {
                router.push('/dashboard/casestudies');
            }, 1500);

        } catch (err) {
            console.error("Case Study Creation Failed:", err);
            setCaseStudyStatus({ type: 'error', text: err.message || 'Failed to create Case Study.' });
        } finally {
            setIsCreatingCaseStudy(false);
            // Xóa thông báo lỗi sau 5 giây nếu không chuyển hướng
            if (caseStudyStatus.type !== 'success') {
                setTimeout(() => setCaseStudyStatus({ type: '', text: '' }), 5000);
            }
        }
    };

    const filteredPosts = useMemo(() => {
        const searchTerms = searchTerm.toLowerCase().split('|').map(t => t.trim()).filter(Boolean);
        if (searchTerms.length === 0) {
            return posts;
        }

        const activeFields = Object.entries(searchFields)
            .filter(([, isActive]) => isActive)
            .map(([fieldName]) => fieldName);

        if (activeFields.length === 0) {
            return posts;
        }

        return posts.filter(post => {
            return searchTerms.some(term => {
                return activeFields.some(field => {
                    const fieldValue = post[field.toLowerCase()]; // Đảm bảo sử dụng tên trường là chữ thường
                    if (typeof fieldValue === 'string') {
                        return fieldValue.toLowerCase().includes(term);
                    }
                    // Xử lý trường hợp đặc biệt cho sentiment (được lưu là chữ hoa)
                    if (field.toLowerCase() === 'sentiment') {
                        return post.sentiment && post.sentiment.toLowerCase().includes(term);
                    }
                    return false;
                });
            });
        });
    }, [posts, searchTerm, searchFields]);

    const handlePostSearchFieldChange = (field) => {
        setSearchFields(prev => ({ ...prev, [field.toLowerCase()]: !prev[field.toLowerCase()] }));
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Loading alert details...</div>;
    if (error) return <p className="p-8 text-red-400">{error}</p>;
    if (!alert) return null;

    return (
        <div className="p-4 md:p-8 text-gray-200">
            <Link href="/dashboard/alerts" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
                <ArrowLeft size={20} />
                Back to All Alerts
            </Link>

            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                {/* Tiêu đề chính */}
                <h1 className="text-3xl font-bold text-white mb-2">{alert.title}</h1>

                {/* NÚT TẠO CASE STUDY */}
                <button
                    onClick={handleCreateCaseStudy}
                    disabled={isCreatingCaseStudy}
                    className="flex-shrink-0 flex items-center gap-2 px-6 py-2 text-base font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg"
                >
                    {isCreatingCaseStudy ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Creating...</span>
                        </>
                    ) : (
                        <>
                            <BookOpen size={20} />
                            Create Case Study
                        </>
                    )}
                </button>
            </div>

            {/* THÔNG BÁO CASE STUDY STATUS */}
            {caseStudyStatus.text && (
                <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${caseStudyStatus.type === 'success' ? 'bg-green-500/20 text-green-300' :
                        caseStudyStatus.type === 'error' ? 'bg-red-500/20 text-red-300' :
                            'bg-blue-500/20 text-blue-300' // Info
                    }`}>
                    {caseStudyStatus.type === 'success' ? <CheckCircle size={18} /> :
                        caseStudyStatus.type === 'error' ? <AlertIcon size={18} /> :
                            <AlertIcon size={18} />}
                    <span>{caseStudyStatus.text}</span>
                </div>
            )}


            <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg">
                <p className="text-gray-400 mb-6">{alert.description}</p>
                <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8">
                    {/* Status Toggle */}
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Status</p>
                            <span className={`font-semibold ${alert.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-500'}`}>{alert.status}</span>
                        </div>
                        <button onClick={handleToggleStatus} disabled={isUpdating}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${alert.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${alert.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    {/* Severity */}
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-400">Severity</p>
                            <span className={`font-semibold 
                                ${alert.severity === 'Critical' && 'text-red-400'}
                                ${alert.severity === 'High' && 'text-orange-400'}
                                ${alert.severity === 'Medium' && 'text-yellow-400'}
                                ${alert.severity === 'Low' && 'text-green-400'}`}>
                                {alert.severity}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Tag size={20} /> Keywords</h2>
                        <div className="flex flex-wrap gap-2">{alert.keywords.map(kw => (<span key={kw} className="bg-slate-700 text-gray-300 px-3 py-1 rounded-full text-sm">{kw}</span>))}</div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Globe size={20} /> Platforms</h2>
                        <div className="flex flex-wrap gap-2">{alert.platforms.map(p => (<span key={p} className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm">{p}</span>))}</div>
                    </div>
                </div>
            </div>

            {/* PHẦN HIỂN THỊ POSTS */}
            <div className="mt-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Mentioned Posts</h2>
                    <button
                        onClick={handleScan}
                        disabled={isScanning || alert.status !== 'ACTIVE'}
                        className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        <Search size={16} />
                        {isScanning ? 'Scanning...' : 'Scan Existing Posts'}
                    </button>
                </div>
                {scanMessage.text && (
                    <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${scanMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {scanMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertIcon size={18} />}
                        <span>{scanMessage.text}</span>
                    </div>
                )}

                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search terms separated by '|' (e.g., apple | samsung)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-slate-300">
                        <span>Search in:</span>
                        {POST_SEARCH_FIELDS.map(field => (
                            <label key={field} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={searchFields[field.toLowerCase()]}
                                    onChange={() => handlePostSearchFieldChange(field)}
                                    className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500"
                                />
                                {field}
                            </label>
                        ))}
                    </div>
                </div>


                {isPostsLoading ? <p className="text-gray-400">Loading posts...</p> : postsError ? <p className="text-red-400">{postsError}</p> : (
                    <div className="space-y-4">
                        {filteredPosts.length > 0 ? filteredPosts.map(post => (
                            <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-lg text-white mb-1">{post.title}</h3>
                                    <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex-shrink-0 ml-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                                        View Source <ExternalLink size={16} />
                                    </a>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">From: <span className="font-medium text-gray-300">{post.source}</span></p>
                                <p className="text-gray-300 text-base">{post.content}</p>
                                <div className="mt-3">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full
                                        ${post.sentiment === 'NEGATIVE' && 'bg-red-500/30 text-red-300'}
                                        ${post.sentiment === 'POSITIVE' && 'bg-green-500/30 text-green-300'}
                                        ${post.sentiment === 'NEUTRAL' && 'bg-gray-500/30 text-gray-300'}`}>
                                        {post.sentiment}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-slate-800/50 p-6 rounded-lg text-center text-gray-500">
                                <p>No mentioned posts found for this alert, or none match your search criteria.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}