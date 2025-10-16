export default function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-slate-800/50 min-w-0 p-4 sm:p-5 md:p-6 rounded-lg shadow-lg flex items-center gap-3 sm:gap-4 md:gap-6 flex-wrap sm:flex-nowrap">
            <div className={`bg-slate-700/50 p-3 sm:p-4 md:p-4 rounded-full flex-shrink-0 ${color}`}>
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </div>
            <div className="min-w-0">
                <p className="text-gray-400 text-xs sm:text-sm md:text-sm truncate">{title}</p>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">{value}</h3>
            </div>
        </div>
    );
}