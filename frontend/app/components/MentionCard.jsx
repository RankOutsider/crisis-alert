// frontend/app/components/MentionCard.jsx
import Link from 'next/link';
import { ExternalLink, AlertCircle, Globe } from 'lucide-react';

export default function MentionCard({ post, isFreeTier }) {
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors duration-150">
            {/* Header: Title + View Source */}
            <div className="flex justify-between items-start gap-3 mb-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-white truncate" title={post.title}>
                        {post.title}
                    </h3>
                </div>
                <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs sm:text-sm text-blue-400 hover:text-blue-300">
                    <ExternalLink size={14} />
                    <span className="hidden sm:inline">View Source</span>
                </a>
            </div>

            {/* Sub-Header: Alert */}
            {post.Alert && (
                <Link href={`/dashboard/alerts/${post.Alert.id}`}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-2.5">
                    <AlertCircle size={14} />
                    <span className="truncate">Related to: {post.Alert.title}</span>
                </Link>
            )}

            {/* Meta: Source + Platform */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-400 mb-2.5">
                <span>From: <span className="font-medium text-gray-300">{post.source}</span></span>
                <span className="flex items-center gap-1.5">
                    <Globe size={14} />
                    Platform: <span className="font-medium text-gray-300">{post.platform || 'N/A'}</span>
                </span>
            </div>

            {/* Content */}
            <p className="text-gray-300 text-sm sm:text-base line-clamp-3">{post.content}</p>

            {/* Footer: Sentiment */}
            {!isFreeTier && (
                <div className="mt-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full 
                        ${post.sentiment === 'NEGATIVE' && 'bg-red-500/30 text-red-300'} 
                        ${post.sentiment === 'POSITIVE' && 'bg-green-500/30 text-green-300'} 
                        ${post.sentiment === 'NEUTRAL' && 'bg-gray-500/30 text-gray-300'}`}>
                        {post.sentiment}
                    </span>
                </div>
            )}
        </div>
    );
}