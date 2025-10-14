'use client';

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { BarChart3, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CaseStudiesPage() {
    // State để lưu dữ liệu và trạng thái tải
    const [caseStudies, setCaseStudies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Hàm lấy dữ liệu từ backend
    useEffect(() => {
        const fetchCaseStudies = async () => {
            try {
                setIsLoading(true);
                const data = await api('casestudies'); // Gọi API GET /api/casestudies
                setCaseStudies(data);
            } catch (err) {
                setError('Failed to fetch case studies.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCaseStudies();
    }, []);

    // Hàm render nội dung chính
    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-gray-400">Loading case studies...</p>;
        }

        if (error) {
            return <p className="text-center text-red-400">{error}</p>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {caseStudies.map((study) => (
                    <div key={study.id} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col hover:border-blue-500 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            {/* Tiêu đề của Case Study bây giờ sẽ lấy từ dữ liệu thật */}
                            <h2 className="text-xl font-bold text-white">{study.title}</h2>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full
                                ${study.status === 'Resolved' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                {study.status}
                            </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-4 flex-grow">
                            {study.summary}
                        </p>

                        <div className="border-t border-slate-700 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-400">
                                <span className="flex items-center gap-2"><MessageSquare size={16} /> Total Mentions:</span>
                                <span className="font-semibold text-white">{study.postCount}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span className="flex items-center gap-2"><Clock size={16} /> Date Range:</span>
                                <span className="font-semibold text-white">{study.dateRange || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Link đến trang chi tiết (sẽ làm ở bước sau) */}
                        <Link href={`/dashboard/casestudies/${study.id}`} className="mt-6 w-full text-center px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                            View Analysis <ExternalLink size={16} />
                        </Link>
                    </div>
                ))}

                {/* Thẻ placeholder chỉ hiện khi không có case study nào */}
                {caseStudies.length === 0 && (
                    <div className="md:col-span-2 lg:col-span-3 bg-slate-800/50 p-6 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-center text-gray-500">
                        <BarChart3 size={40} className="mb-4" />
                        <h3 className="text-lg font-semibold text-white">No Case Studies Found</h3>
                        <p className="text-sm">You can create a case study from an alert's detail page.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Case Studies</h1>
            <p className="text-gray-400 mb-8">Analyze important alert cases and their impact.</p>
            {renderContent()}
        </div>
    );
}