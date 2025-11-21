// frontend/app/admin/users/page.jsx
'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { swrFetcher, updateAdminUser, deleteAdminUsersBulk } from '@/utils/api';
import {
    Search, Edit, X, Save,
    ChevronLeft, ChevronRight, Loader2,
    CheckSquare, Square, Trash2
} from 'lucide-react';
import Portal from '@/components/Portal.jsx';

// --- COMPONENT NÚT TOGGLE RIÊNG ---
const UserStatusToggle = ({ isActive, onClick, isLoading }) => {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${isActive ? 'bg-green-500' : 'bg-gray-600'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`${isActive ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
        </button>
    );
};

export default function AdminUsers() {
    // State UI
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // State Edit
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ role: '', subscriptionTier: '' });

    // Loading state cho toggle
    const [togglingId, setTogglingId] = useState(null);

    // --- 1. SWR SETUP (Thay thế cho fetchUsers & useEffect) ---
    const endpoint = `admin/users?page=${page}&limit=10&search=${search}`;

    const { data, error, isLoading } = useSWR(endpoint, swrFetcher, {
        keepPreviousData: true, // Giữ data cũ khi chuyển trang để ko bị giật
    });

    // Parse dữ liệu từ SWR (nếu chưa có thì lấy mặc định)
    const users = data?.users || [];
    const totalPages = data?.pages || 1;
    const totalUsers = data?.totalUsers || 0;

    // Scroll lên đầu khi chuyển trang
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    // --- LOGIC CHECKBOX ---
    const toggleSelect = (id) => {
        selectedIds.includes(id)
            ? setSelectedIds(prev => prev.filter(item => item !== id))
            : setSelectedIds(prev => [...prev, id]);
    };

    const toggleSelectAll = () => {
        selectedIds.length === users.length && users.length > 0
            ? setSelectedIds([])
            : setSelectedIds(users.map(u => u.id));
    };

    // --- LOGIC ACTIONS (Cập nhật dùng mutate) ---

    // 1. Bulk Delete
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const confirmMsg = `WARNING: Delete ${selectedIds.length} users? Cannot undo.`;

        if (window.confirm(confirmMsg)) {
            try {
                await deleteAdminUsersBulk(selectedIds);
                alert(`Deleted successfully.`);
                setSelectedIds([]);
                mutate(endpoint); // Refresh lại data
            } catch (error) {
                console.error(error);
                alert('Failed to delete.');
            }
        }
    };

    // 2. Toggle Status
    const handleStatusChange = async (user) => {
        if (togglingId === user.id) return;

        const newStatus = !user.is_active;
        setTogglingId(user.id);

        try {
            await updateAdminUser(user.id, { isActive: newStatus });

            // Optimistic Update (Cập nhật UI ngay lập tức)
            await mutate(endpoint, {
                ...data,
                users: users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u)
            }, false);

        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        } finally {
            setTogglingId(null);
        }
    };

    // 3. Edit User
    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({ role: user.role, subscriptionTier: user.subscriptionTier });
    };

    const handleSave = async () => {
        if (!editingUser) return;
        try {
            await updateAdminUser(editingUser.id, formData);
            alert('User updated successfully!');
            setEditingUser(null);
            mutate(endpoint); // Refresh lại data
        } catch (error) {
            console.error(error);
            alert('Error updating user');
        }
    };

    // Helpers Colors
    const getTierColor = (tier) => {
        switch (tier) {
            case 'VIP': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            case 'Pro': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            default: return 'bg-gray-600/20 text-gray-400 border-gray-600/50';
        }
    };

    const getRoleColor = (role) => role === 'admin'
        ? 'bg-red-500/20 text-red-400 border-red-500/50'
        : 'bg-green-500/20 text-green-400 border-green-500/50';

    // Component Pagination
    const Pagination = () => (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:inline">Page {page} of {totalPages}</span>
            <div className="flex space-x-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"><ChevronLeft size={20} /></button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"><ChevronRight size={20} /></button>
            </div>
        </div>
    );

    // Error State
    if (error) return <div className="text-center py-10 text-red-400">Failed to load users.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Search */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold">User Management ({totalUsers})</h1>

                    <div className="flex flex-col-reverse md:flex-row gap-4 w-full md:w-auto items-end md:items-center">
                        <Pagination />
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                </div>

                {/* BULK ACTION BAR */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-600/20 border border-blue-500/50 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <span className="text-blue-400 font-medium flex items-center gap-2">
                            <CheckSquare size={20} />
                            Selected {selectedIds.length} users
                        </span>
                        <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20">
                            <Trash2 size={16} /> Delete Selected
                        </button>
                    </div>
                )}
            </div>

            {/* LOADING STATE (SWR isLoading) */}
            {isLoading ? (
                <div className="flex justify-center py-8 text-gray-400">
                    <Loader2 className="animate-spin mr-2" /> Loading data...
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-xl border border-gray-700">No users found.</div>
            ) : (
                /* --- TABLE CONTENT --- */
                <>
                    {/* MOBILE VIEW */}
                    <div className="md:hidden flex flex-col gap-3">
                        <div className="flex items-center gap-3 px-2 mb-1">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white flex items-center gap-2">
                                {selectedIds.length === users.length ? <CheckSquare className="text-blue-500" size={22} /> : <Square size={22} />}
                                <span className="text-sm font-medium text-gray-300">Select All</span>
                            </button>
                        </div>
                        {users.map((user) => {
                            const isSelected = selectedIds.includes(user.id);
                            return (
                                <div key={user.id} className={`bg-gray-800 p-4 rounded-xl border shadow-sm flex flex-col gap-3 ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/50 bg-blue-900/10' : 'border-gray-700'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <button onClick={() => toggleSelect(user.id)} className="mt-1 text-gray-400 hover:text-white">
                                                {isSelected ? <CheckSquare className="text-blue-500" size={22} /> : <Square size={22} />}
                                            </button>
                                            <div>
                                                <div className="font-bold text-white text-lg" onClick={() => toggleSelect(user.id)}>{user.username}</div>
                                                <div className="text-sm text-gray-400 break-all">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <UserStatusToggle
                                                isActive={user.is_active !== false} // Handle null as true
                                                isLoading={togglingId === user.id}
                                                onClick={() => handleStatusChange(user)}
                                            />
                                            <button onClick={() => handleEditClick(user)} className="p-2 bg-blue-600/20 text-blue-400 rounded-lg"><Edit size={18} /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm pl-9">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleColor(user.role)}`}>{user.role.toUpperCase()}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getTierColor(user.subscriptionTier)}`}>{user.subscriptionTier}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP VIEW */}
                    <div className="hidden md:block bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-700/50 text-gray-300 border-b border-gray-700">
                                    <th className="p-4 w-12"><button onClick={toggleSelectAll}>{users.length > 0 && selectedIds.length === users.length ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}</button></th>
                                    <th className="p-4">User Info</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Subscription</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 whitespace-nowrap">Joined</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {users.map((user) => {
                                    const isSelected = selectedIds.includes(user.id);
                                    return (
                                        <tr key={user.id} className={`transition-colors ${isSelected ? 'bg-blue-900/20' : 'hover:bg-gray-700/30'}`}>
                                            <td className="p-4"><button onClick={() => toggleSelect(user.id)} className="text-gray-400">{isSelected ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}</button></td>
                                            <td className="p-4 max-w-[200px]">
                                                <div className="font-semibold text-white truncate">{user.username}</div>
                                                <div className="text-sm text-gray-400 truncate">{user.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs border whitespace-nowrap ${getRoleColor(user.role)}`}>
                                                    {user.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs border whitespace-nowrap ${getTierColor(user.subscriptionTier)}`}>
                                                {user.subscriptionTier}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <UserStatusToggle
                                                    isActive={user.is_active !== false}
                                                    isLoading={togglingId === user.id}
                                                    onClick={() => handleStatusChange(user)}
                                                />
                                            </td>
                                            <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right text-right">
                                                <button onClick={() => handleEditClick(user)} className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors">
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Bottom Pagination */}
            <div className="flex justify-end"><Pagination /></div>

            {/* EDIT MODAL */}
            {editingUser && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Edit User</h3>
                                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                            </div>
                            <div className="space-y-4">
                                <div><label className="block text-sm text-gray-400 mb-1">User</label><input disabled value={editingUser.email} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-gray-400" /></div>
                                <div><label className="block text-sm text-gray-300 mb-1">Role</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"><option value="user">User</option><option value="admin">Admin</option></select></div>
                                <div><label className="block text-sm text-gray-300 mb-1">Subscription</label><select value={formData.subscriptionTier} onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"><option value="Free">Free</option><option value="VIP">VIP</option><option value="Pro">Pro</option></select></div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-300 hover:bg-gray-700">Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 flex items-center space-x-2"><Save size={18} /><span>Save</span></button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}