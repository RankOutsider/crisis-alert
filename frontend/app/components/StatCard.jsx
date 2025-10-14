export default function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg flex items-center gap-6">
            <div className={`bg-slate-700/50 p-4 rounded-full ${color}`}>
                <Icon size={32} />
            </div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <h3 className="text-2xl font-bold text-white">{value}</h3>
            </div>
        </div>
    );
}