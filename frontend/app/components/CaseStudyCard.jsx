// frontend/app/components/CaseStudyCard.jsx
import Link from 'next/link';
import { Clock, MessageSquare, ExternalLink, Trash2 } from 'lucide-react';

export default function CaseStudyCard({ study, onDelete }) {
    const isResolved = study.status === 'Resolved';

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col hover:border-blue-500 transition-colors overflow-hidden group">
            {/* Header */}
            <div className="flex justify-between items-start mb-3 gap-2">
                <Link href={`/dashboard/casestudies/${study.id}`} className="block flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white truncate group-hover:text-blue-400 transition-colors" title={study.title}>
                        {study.title}
                    </h2>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${isResolved ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                        {study.status}
                    </span>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(study.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                        title="Delete Case Study"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Summary */}
            <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-3">
                {study.summary}
            </p>

            {/* Footer / Stats */}
            <div className="border-t border-slate-700 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                    <span className="flex items-center gap-2">
                        <MessageSquare size={16} /> Total Mentions:
                    </span>
                    <span className="font-semibold text-white">{study.postCount || 0}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                    <span className="flex items-center gap-2">
                        <Clock size={16} /> Date Range:
                    </span>
                    <span className="font-semibold text-white">{study.dateRange || 'N/A'}</span>
                </div>

                <Link
                    href={`/dashboard/casestudies/${study.id}`}
                    className="mt-6 w-full text-center px-4 py-2 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                    View Analysis <ExternalLink size={16} />
                </Link>
            </div>
        </div>
    );
}

// Export Skeleton luôn ở đây để dễ import
export function CaseStudySkeleton() {
    return (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col animate-pulse overflow-hidden">
            <div className="flex justify-between items-start mb-3 gap-2">
                <div className="h-6 bg-slate-700 rounded w-3/5"></div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="h-6 bg-slate-700 rounded-full w-16"></div>
                    <div className="h-6 w-6 bg-slate-700 rounded-full"></div>
                </div>
            </div>
            <div className="space-y-2 mb-4 flex-grow">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            </div>
            <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between"><div className="h-4 bg-slate-700 rounded w-1/3"></div><div className="h-4 bg-slate-700 rounded w-1/4"></div></div>
                <div className="flex justify-between"><div className="h-4 bg-slate-700 rounded w-1/3"></div><div className="h-4 bg-slate-700 rounded w-1/4"></div></div>
            </div>
            <div className="mt-6 h-10 bg-slate-700 rounded-full w-full"></div>
        </div>
    );
}