// frontend/app/components/AlertCard.jsx
import Link from 'next/link';
import { Edit, Trash2, Tag, Globe } from 'lucide-react';

export default function AlertCard({ alert, isSelected, onSelect, onEdit, onDelete }) {
    return (
        <div className={`p-4 rounded-lg transition-colors duration-200 ${isSelected ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-slate-700/60 hover:bg-slate-700'}`}>
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Checkbox */}
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(alert.id)}
                    className="mt-1.5 h-5 w-5 flex-shrink-0 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-600 cursor-pointer"
                />

                <div className="flex-grow min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        {/* Content */}
                        <div className="min-w-0 flex-1">
                            <Link href={`/dashboard/alerts/${alert.id}`} className="block group">
                                <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-blue-400 transition-colors cursor-pointer break-words line-clamp-1" title={alert.title}>
                                    {alert.title}
                                </h3>
                            </Link>
                            <p className="text-sm text-gray-400 break-words mt-1 line-clamp-2" title={alert.description}>
                                {alert.description || <span className="italic text-slate-500">No description</span>}
                            </p>
                        </div>

                        {/* Actions & Badges */}
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap mt-2 sm:mt-0">
                            <SeverityBadge severity={alert.severity} />
                            <StatusBadge status={alert.status} />

                            <button onClick={() => onEdit(alert)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-full transition-colors">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => onDelete(alert.id)} className="p-2 text-red-500 hover:text-red-400 hover:bg-slate-600 rounded-full transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Footer: Keywords & Platforms */}
                    <div className="mt-3 border-t border-slate-600/50 pt-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Tag size={16} className="text-gray-400 flex-shrink-0 mr-1" />
                            {alert.keywords?.length > 0 ? (
                                <>
                                    {alert.keywords.slice(0, 7).map(kw => (
                                        <span key={kw} className="bg-slate-600 text-xs px-2 py-0.5 rounded">{kw}</span>
                                    ))}
                                    {alert.keywords.length > 7 && <span className="text-xs text-slate-500">...</span>}
                                </>
                            ) : <span className="text-xs text-slate-500 italic">No keywords</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                            <Globe size={16} className="text-gray-400 flex-shrink-0 mr-1" />
                            {alert.platforms?.length > 0 ? (
                                <>
                                    {alert.platforms.slice(0, 5).map(p => (
                                        <span key={p} className="bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded text-white">{p}</span>
                                    ))}
                                    {alert.platforms.length > 5 && <span className="text-xs text-slate-500">...</span>}
                                </>
                            ) : <span className="text-xs text-slate-500 italic">No platforms</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SeverityBadge({ severity }) {
    const colors = {
        Critical: 'bg-red-500/20 text-red-300',
        High: 'bg-orange-500/20 text-orange-300',
        Medium: 'bg-yellow-500/20 text-yellow-300',
        Low: 'bg-green-500/20 text-green-300'
    };
    return <span className={`text-xs font-semibold px-3 py-1 rounded-full ${colors[severity] || colors.Low}`}>{severity}</span>;
}

function StatusBadge({ status }) {
    return (
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-slate-600/50 text-slate-400'}`}>
            {status}
        </span>
    );
}

export function AlertCardSkeleton() {
    return (
        <div className="bg-slate-700/60 p-4 rounded-lg animate-pulse">
            <div className="flex gap-4">
                <div className="h-5 w-5 bg-slate-600 rounded"></div>
                <div className="flex-grow space-y-3">
                    <div className="flex justify-between">
                        <div className="w-2/3 space-y-2">
                            <div className="h-5 bg-slate-600 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-600 rounded w-full"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-6 w-16 bg-slate-600 rounded-full"></div>
                            <div className="h-8 w-8 bg-slate-600 rounded-full"></div>
                        </div>
                    </div>
                    <div className="h-4 bg-slate-600 rounded w-1/3"></div>
                </div>
            </div>
        </div>
    );
}