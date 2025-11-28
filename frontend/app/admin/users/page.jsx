// frontend/app/admin/users/page.jsx
'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { swrFetcher, updateAdminUser, deleteAdminUsersBulk, api } from '@/utils/api';
import {
    Search, Edit, X, Save,
    ChevronLeft, ChevronRight, Loader2,
    CheckSquare, Square, Trash2, Lock, Unlock,
    User, Mail, Calendar, Shield
} from 'lucide-react';
import Portal from '@/app/components/Portal';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// --- COMPONENT NÚT TOGGLE RIÊNG (Cho User Active) ---
const UserStatusToggle = ({ isActive, onClick, isLoading, disabled }) => {
    return (
        <button
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${isActive ? 'bg-green-500' : 'bg-gray-600'
                } ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
    const [adminTogglingId, setAdminTogglingId] = useState(null);

    // --- 1. SWR SETUP ---
    const endpoint = `admin/users?page=${page}&limit=10&search=${search}`;

    const { data, error, isLoading } = useSWR(endpoint, swrFetcher, {
        keepPreviousData: true,
    });

    const users = data?.users || [];
    const totalPages = data?.pages || 1;
    const totalUsers = data?.totalUsers || 0;

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

    // --- LOGIC ACTIONS ---

    // 1. Bulk Delete
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const confirmMsg = `WARNING: Delete ${selectedIds.length} users? Cannot undo.`;

        if (window.confirm(confirmMsg)) {
            try {
                await deleteAdminUsersBulk(selectedIds);
                toast.success(`Deleted ${selectedIds.length} users successfully.`);
                setSelectedIds([]);
                mutate(endpoint);
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete selected users.');
            }
        }
    };

    // 2. Toggle User Active Status (Is Active)
    const handleStatusChange = async (user) => {
        // Nếu không phải Admin VÀ đang bị Admin khóa -> Không cho bật lại
        if (user.role !== 'admin' && !user.is_active_admin) {
            toast.warning("Cannot activate this user because they are locked by Admin.");
            return;
        }

        if (togglingId === user.id) return;

        const newStatus = !user.is_active;
        setTogglingId(user.id);

        try {
            await updateAdminUser(user.id, { is_active: newStatus });
            // Optimistic Update
            mutate(endpoint, {
                ...data,
                users: users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u)
            }, false);

            toast.success(`User ${newStatus ? 'activated' : 'deactivated'}.`);
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.message || "Failed to update status");
        } finally {
            setTogglingId(null);
        }
    };

    // 3. Toggle Admin Lock Status (Is Active Admin)
    const handleToggleAdminLock = async (user) => {
        if (user.role === 'admin') {
            toast.error("Security Alert: You cannot Admin-Lock another Administrator account.");
            return;
        }

        if (adminTogglingId === user.id) return;
        setAdminTogglingId(user.id);

        const newStatus = !user.is_active_admin;

        try {
            await api(`admin/users/${user.id}/admin-lock`, {
                method: 'PUT',
                body: JSON.stringify({ is_active_admin: newStatus })
            });

            // Optimistic Update: Update both admin lock and active status
            const updatedUsers = users.map(u => {
                if (u.id === user.id) {
                    return {
                        ...u,
                        is_active_admin: newStatus,
                        is_active: newStatus ? u.is_active : false
                    };
                }
                return u;
            });

            mutate(endpoint, { ...data, users: updatedUsers }, false);
            toast.success(newStatus ? `Unlocked user ${user.username}` : `Locked user ${user.username}`);

        } catch (error) {
            console.error("Admin Lock Error:", error);
            toast.error(error.message || "Failed to toggle admin lock");
        } finally {
            setAdminTogglingId(null);
        }
    };

    // 4. Edit User
    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({ role: user.role, subscriptionTier: user.subscriptionTier });
    };

    const handleSave = async () => {
        if (!editingUser) return;
        try {
            await updateAdminUser(editingUser.id, formData);
            toast.success('User updated successfully!');
            setEditingUser(null);
            mutate(endpoint);
        } catch (error) {
            console.error(error);
            toast.error('Error updating user');
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

    const Pagination = () => (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:inline">Page {page} of {totalPages}</span>
            <div className="flex space-x-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 transition-colors"><ChevronLeft size={20} /></button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 transition-colors"><ChevronRight size={20} /></button>
            </div>
        </div>
    );

    if (error) return <div className="text-center py-10 text-red-400">Failed to load users.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Search */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <User className="text-blue-500" />
                        User Management <span className="text-gray-500 text-lg font-normal">({totalUsers})</span>
                    </h1>

                    <div className="flex flex-col-reverse md:flex-row gap-4 w-full md:w-auto items-end md:items-center">
                        <Pagination />
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search username, email..."
                                className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 text-sm transition-all"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                </div>

                {/* BULK ACTION BAR */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-600/10 border border-blue-500/30 p-3 rounded-lg flex items-center justify-between animate-fadeIn">
                        <span className="text-blue-400 font-medium flex items-center gap-2 text-sm">
                            <CheckSquare size={18} />
                            Selected {selectedIds.length} users
                        </span>
                        <button onClick={handleBulkDelete} className="bg-red-500/90 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20">
                            <Trash2 size={16} /> Delete Selected
                        </button>
                    </div>
                )}
            </div>

            {/* LOADING STATE */}
            {isLoading ? (
                <div className="flex justify-center py-10 text-gray-400">
                    <Loader2 className="animate-spin mr-2" /> Loading users...
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                    No users found.
                </div>
            ) : (
                <>
                    {/* DESKTOP VIEW */}
                    <div className="hidden md:block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-300 border-b border-slate-700 text-xs uppercase font-semibold">
                                    <th className="p-4 w-12 text-center"><button onClick={toggleSelectAll} className="hover:text-white transition-colors">{users.length > 0 && selectedIds.length === users.length ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}</button></th>
                                    <th className="p-4">User Info</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Subscription</th>
                                    <th className="p-4 text-center">User Active</th>
                                    <th className="p-4 text-center">Admin Lock</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {users.map((user) => {
                                    const isSelected = selectedIds.includes(user.id);
                                    const isAdminUser = user.role === 'admin';

                                    return (
                                        <tr key={user.id} className={`transition-colors ${isSelected ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-slate-700/30'}`}>
                                            <td className="p-4 text-center"><button onClick={() => toggleSelect(user.id)} className="text-slate-400 hover:text-white transition-colors">{isSelected ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}</button></td>
                                            <td className="p-4 max-w-[200px]">
                                                <div className="font-semibold text-white truncate">{user.username}</div>
                                                <div className="text-sm text-slate-400 truncate">{user.email}</div>
                                                <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                                                    <Calendar size={10} /> {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${getRoleColor(user.role)}`}>
                                                    {user.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${getTierColor(user.subscriptionTier)}`}>
                                                {user.subscriptionTier}</span>
                                            </td>

                                            {/* Cột User Active */}
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <UserStatusToggle
                                                        isActive={user.is_active}
                                                        isLoading={togglingId === user.id}
                                                        disabled={!isAdminUser && !user.is_active_admin}
                                                        onClick={() => handleStatusChange(user)}
                                                    />
                                                    <span className="text-[10px] text-gray-500">
                                                        {user.is_active ? 'On' : 'Off'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Cột Admin Lock */}
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onClick={() => handleToggleAdminLock(user)}
                                                        disabled={adminTogglingId === user.id || isAdminUser}
                                                        className={`p-1.5 rounded-md transition-colors ${isAdminUser
                                                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                                                : user.is_active_admin
                                                                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                                    : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                            }`}
                                                        title={isAdminUser ? 'Cannot lock an Administrator' : (user.is_active_admin ? 'Account Unlocked (Click to Lock)' : 'Account Locked by Admin (Click to Unlock)')}
                                                    >
                                                        {adminTogglingId === user.id ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : user.is_active_admin || isAdminUser ? (
                                                            <Unlock size={18} />
                                                        ) : (
                                                            <Lock size={18} />
                                                        )}
                                                    </button>
                                                    <span className={`text-[10px] font-bold ${isAdminUser ? 'text-slate-500' : (user.is_active_admin ? 'text-green-600' : 'text-red-500')}`}>
                                                        {isAdminUser ? 'PROTECTED' : (user.is_active_admin ? 'UNLOCKED' : 'LOCKED')}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-right">
                                                <button onClick={() => handleEditClick(user)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all shadow-sm">
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE VIEW */}
                    <div className="md:hidden flex flex-col gap-4">
                        {users.map((user) => {
                            const isSelected = selectedIds.includes(user.id);
                            const isAdminUser = user.role === 'admin';

                            return (
                                <div key={user.id} className={`bg-slate-800 p-5 rounded-xl border shadow-sm flex flex-col gap-3 transition-all ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-white text-lg truncate pr-2">{user.username}</div>
                                            <div className="text-sm text-slate-400 break-all">{user.email}</div>
                                            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                                <Calendar size={10} /> Joined: {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleToggleAdminLock(user)}
                                                disabled={isAdminUser}
                                                className={`p-2 rounded-lg transition-colors ${isAdminUser
                                                        ? 'bg-slate-700 text-slate-500 opacity-50 cursor-not-allowed'
                                                        : user.is_active_admin
                                                            ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                                                            : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                                    }`}
                                            >
                                                {(user.is_active_admin || isAdminUser) ? <Unlock size={18} /> : <Lock size={18} />}
                                            </button>
                                            <button onClick={() => handleEditClick(user)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"><Edit size={18} /></button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm border-t border-slate-700/50 pt-3 mt-1">
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide ${getRoleColor(user.role)}`}>{user.role.toUpperCase()}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide ${getTierColor(user.subscriptionTier)}`}>{user.subscriptionTier}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">Active:</span>
                                            <UserStatusToggle
                                                isActive={user.is_active}
                                                onClick={() => handleStatusChange(user)}
                                                disabled={!isAdminUser && !user.is_active_admin}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Bottom Pagination */}
            <div className="flex justify-end pt-4"><Pagination /></div>

            {/* EDIT MODAL */}
            {editingUser && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Edit User</h3>
                                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">User Account</label>
                                    <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-400 text-sm flex items-center gap-2">
                                        <Mail size={16} /> {editingUser.email}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Subscription Tier</label>
                                    <select
                                        value={formData.subscriptionTier}
                                        onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="Free">Free</option>
                                        <option value="VIP">VIP</option>
                                        <option value="Pro">Pro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-700">
                                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 flex items-center space-x-2 rounded-lg font-medium transition-colors text-sm">
                                    <Save size={16} /><span>Save Changes</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}