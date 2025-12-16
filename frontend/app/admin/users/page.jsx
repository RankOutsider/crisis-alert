// frontend/app/admin/users/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { swrFetcher, updateAdminUser, deleteAdminUsersBulk, api } from '@/utils/api';
import {
    Search, Edit, X, Save,
    ChevronLeft, ChevronRight, Loader2,
    CheckSquare, Square, Trash2, Lock, Unlock,
    User, Mail, Calendar, Clock
} from 'lucide-react';
import Portal from '@/app/components/Portal';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import FilterBar from '@/app/components/FilterBar'; // Import FilterBar
import useDebounce from '@/hooks/useDebounce';     // Import useDebounce

// --- COMPONENT NÚT TOGGLE RIÊNG ---
const UserStatusToggle = ({ isActive, onClick, isLoading, disabled, title }) => {
    return (
        <button
            onClick={onClick}
            disabled={isLoading || disabled}
            title={title}
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
    // --- FETCH DATA ---
    // Bỏ pagination params để lấy hết về client
    const endpoint = 'admin/users';
    const { data, error, isLoading } = useSWR(endpoint, swrFetcher);
    const { data: currentUser } = useSWR('auth/me', swrFetcher);

    // Xử lý dữ liệu trả về
    const allUsers = Array.isArray(data) ? data : (data?.users || []);

    // --- STATE UI ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState([]); // Filter Role
    const [selectedTier, setSelectedTier] = useState([]); // Filter Subscription Tier

    // Thêm Filter Status (Active, Locked, Admin Locked)
    const [selectedStatus, setSelectedStatus] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const itemsPerPage = 10;

    // State Edit
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ role: '', subscriptionTier: '', subscriptionExpiresAt: '' });

    // Loading state cho toggle
    const [togglingId, setTogglingId] = useState(null);
    const [adminTogglingId, setAdminTogglingId] = useState(null);

    // --- DEBOUNCE SEARCH ---
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- LOGIC LỌC & PHÂN TRANG CLIENT-SIDE ---

    // Reset trang về 1 khi filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedRole, selectedTier, selectedStatus]);

    // Lọc dữ liệu
    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => {
            const username = user.username?.toLowerCase() || '';
            const email = user.email?.toLowerCase() || '';
            const search = debouncedSearchTerm.toLowerCase();

            // Tìm theo Username hoặc Email
            const matchesSearch = username.includes(search) || email.includes(search);

            // Filter Role
            const matchesRole = selectedRole.length === 0 || selectedRole.includes(user.role);

            // Filter Tier
            const matchesTier = selectedTier.length === 0 || selectedTier.includes(user.subscriptionTier);

            // Filter Status (Logic phức tạp hơn chút)
            // Options: 'Active' (is_active=true), 'User Locked' (is_active=false), 'Admin Locked' (is_active_admin=false)
            let matchesStatus = true;
            if (selectedStatus.length > 0) {
                matchesStatus = selectedStatus.some(status => {
                    if (status === 'Active') return user.is_active && user.is_active_admin;
                    if (status === 'User Locked') return !user.is_active;
                    if (status === 'Admin Locked') return !user.is_active_admin;
                    return false;
                });
            }

            return matchesSearch && matchesRole && matchesTier && matchesStatus;
        });
    }, [allUsers, debouncedSearchTerm, selectedRole, selectedTier, selectedStatus]);

    // Cắt trang
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    // Scroll lên đầu khi đổi trang
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // --- LOGIC CHECKBOX ---
    const toggleSelect = (id) => {
        selectedIds.includes(id)
            ? setSelectedIds(prev => prev.filter(item => item !== id))
            : setSelectedIds(prev => [...prev, id]);
    };

    const toggleSelectAll = () => {
        selectedIds.length === filteredUsers.length && filteredUsers.length > 0
            ? setSelectedIds([])
            : setSelectedIds(filteredUsers.map(u => u.id));
    };

    // --- LOGIC ACTIONS ---

    // Bulk Delete
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (currentUser && selectedIds.includes(currentUser.id)) {
            toast.error("You cannot delete the currently logged-in account.");
            return;
        }

        const confirmMsg = `WARNING: Delete ${selectedIds.length} users? Cannot undo.`;

        if (window.confirm(confirmMsg)) {
            try {
                await deleteAdminUsersBulk(selectedIds);
                toast.success(`Deleted ${selectedIds.length} users successfully.`);
                setSelectedIds([]);
                mutate(endpoint); // Fetch lại data mới
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete selected users.');
            }
        }
    };

    // Toggle User Active Status
    const handleStatusChange = async (user) => {
        if (currentUser && user.id === currentUser.id) {
            toast.warning("You cannot deactivate the currently logged-in account from the Admin Dashboard.");
            return;
        }

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
            const updatedUsers = allUsers.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u);
            mutate(endpoint, { ...data, users: updatedUsers }, false);

            toast.success(`User ${newStatus ? 'activated' : 'deactivated'}.`);
            mutate(endpoint); // Re-fetch chuẩn
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.message || "Failed to update status");
        } finally {
            setTogglingId(null);
        }
    };

    // Toggle Admin Lock Status
    const handleToggleAdminLock = async (user) => {
        if (currentUser && user.id === currentUser.id) {
            toast.warning("Security Alert: You cannot Admin-Lock your own ADMIN account.");
            return;
        }
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

            // Optimistic Update
            const updatedUsers = allUsers.map(u => {
                if (u.id === user.id) {
                    return {
                        ...u,
                        is_active_admin: newStatus,
                        is_active: newStatus ? u.is_active : false // Nếu khóa admin -> active cũng false
                    };
                }
                return u;
            });

            mutate(endpoint, { ...data, users: updatedUsers }, false);
            toast.success(newStatus ? `Unlocked user ${user.username}` : `Locked user ${user.username}`);
            mutate(endpoint); // Re-fetch

        } catch (error) {
            console.error("Admin Lock Error:", error);
            toast.error(error.message || "Failed to toggle admin lock");
        } finally {
            setAdminTogglingId(null);
        }
    };

    // Edit User
    const handleEditClick = (user) => {
        setEditingUser(user);

        // Format cần thiết: YYYY-MM-DDTHH:mm
        let formattedDate = '';

        if (user.subscriptionExpiresAt) {
            const date = new Date(user.subscriptionExpiresAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        setFormData({
            role: user.role,
            subscriptionTier: user.subscriptionTier,
            subscriptionExpiresAt: formattedDate
        });
    };

    const handleSave = async () => {
        if (!editingUser) return;
        try {
            let finalDate = null;
            if (formData.subscriptionExpiresAt) {
                const localDate = new Date(formData.subscriptionExpiresAt);
                finalDate = localDate.toISOString();
            }

            const payload = {
                role: formData.role,
                subscriptionTier: formData.subscriptionTier,
                subscriptionExpiresAt: finalDate
            };

            await updateAdminUser(editingUser.id, payload);

            // Optimistic Update (Optional)
            const updatedList = allUsers.map(u => u.id === editingUser.id ? { ...u, ...payload } : u);
            mutate(endpoint, { ...data, users: updatedList }, false);

            toast.success('User updated successfully!');
            setEditingUser(null);
            mutate(endpoint); // Re-fetch
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

    if (error) return <div className="text-center py-10 text-red-400">Failed to load users.</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Search */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <User className="text-blue-500" />
                        User Management <span className="text-gray-500 text-lg font-normal">({filteredUsers.length})</span>
                    </h1>
                </div>

                {/* FILTER BAR */}
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search username, email..."

                    // Filter Status
                    statusOptions={['Active', 'User Locked', 'Admin Locked']}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}


                    roleOptions={['admin', 'user']}
                    selectedRoles={selectedRole}
                    onRoleChange={setSelectedRole}

                    tierOptions={['Free', 'VIP', 'Pro']}
                    selectedTiers={selectedTier}
                    onTierChange={setSelectedTier}
                />

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
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700/50 border-dashed">
                    No users found matching your filters.
                </div>
            ) : (
                <>
                    {/* DESKTOP VIEW */}
                    <div className="hidden md:block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-300 border-b border-slate-700 text-xs uppercase font-semibold">
                                    <th className="p-4 w-12 text-center">
                                        <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                                            {filteredUsers.length > 0 && selectedIds.length === filteredUsers.length ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}
                                        </button>
                                    </th>
                                    <th className="p-4">User Info</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Subscription</th>
                                    <th className="p-4">Expires At</th>
                                    <th className="p-4 text-center">User Active</th>
                                    <th className="p-4 text-center">Admin Lock</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {currentItems.map((user) => {
                                    const isSelected = selectedIds.includes(user.id);
                                    const isAdminUser = user.role === 'admin';
                                    const isSelf = currentUser && currentUser.id === user.id;

                                    return (
                                        <tr key={user.id} className={`transition-colors ${isSelected ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-slate-700/30'}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => toggleSelect(user.id)} className="text-slate-400 hover:text-white transition-colors">
                                                    {isSelected ? <CheckSquare className="text-blue-500" size={18} /> : <Square size={18} />}
                                                </button>
                                            </td>

                                            <td className="p-4 max-w-[200px]">
                                                <div className="font-semibold text-white truncate">{user.username} {isSelf && <span className="text-xs text-blue-400 ml-1">(You)</span>}</div>
                                                <div className="text-sm text-slate-400 truncate">{user.email}</div>
                                                <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                                                    <Calendar size={10} /> Joined: {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${getRoleColor(user.role)}`}>
                                                    {user.role.toUpperCase()}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${getTierColor(user.subscriptionTier)}`}>
                                                    {user.subscriptionTier}
                                                </span>
                                            </td>

                                            <td className="p-4 text-sm">
                                                {user.subscriptionExpiresAt ? (
                                                    <span className="text-slate-300 flex items-center gap-1">
                                                        <Clock size={12} className="text-slate-500" />
                                                        {format(new Date(user.subscriptionExpiresAt), 'MMM dd, yyyy')}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 italic text-xs">Forever / None</span>
                                                )}
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <UserStatusToggle
                                                        isActive={user.is_active}
                                                        isLoading={togglingId === user.id}
                                                        disabled={(!isAdminUser && !user.is_active_admin) || isSelf}
                                                        title={isSelf ? "You cannot deactivate yourself here" : ""}
                                                        onClick={() => handleStatusChange(user)}
                                                    />
                                                    <span className="text-[10px] text-gray-500">
                                                        {user.is_active ? 'On' : 'Off'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onClick={() => handleToggleAdminLock(user)}
                                                        disabled={adminTogglingId === user.id || isAdminUser || isSelf}
                                                        className={`p-1.5 rounded-md transition-colors ${isAdminUser || isSelf
                                                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                                            : user.is_active_admin
                                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                            }`}
                                                        title={isSelf ? 'Cannot lock yourself' : (isAdminUser ? 'Cannot lock an Administrator' : (user.is_active_admin ? 'Account Unlocked (Click to Lock)' : 'Account Locked by Admin (Click to Unlock)'))}
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
                        <div className="flex items-center gap-3 px-1 mb-1">
                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                                {selectedIds.length === filteredUsers.length ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                                <span className="text-sm font-medium">Select All</span>
                            </button>
                        </div>

                        {currentItems.map((user) => {
                            const isSelected = selectedIds.includes(user.id);
                            const isAdminUser = user.role === 'admin';
                            const isSelf = currentUser && currentUser.id === user.id;

                            return (
                                <div key={user.id} className={`bg-slate-800 p-5 rounded-xl border shadow-sm flex flex-col gap-3 transition-all ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-white text-lg truncate pr-2">
                                                {user.username} {isSelf && <span className="text-xs text-blue-400 ml-1">(You)</span>}
                                            </div>
                                            <div className="text-sm text-slate-400 break-all">{user.email}</div>
                                            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                                <Calendar size={10} /> Joined: {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}
                                            </div>
                                            {user.subscriptionExpiresAt && (
                                                <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                                    <Clock size={10} /> Exp: {format(new Date(user.subscriptionExpiresAt), 'MMM dd, yyyy')}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleToggleAdminLock(user)}
                                                disabled={isAdminUser || isSelf}
                                                className={`p-2 rounded-lg transition-colors ${isAdminUser || isSelf
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
                                                isLoading={togglingId === user.id}
                                                disabled={(!isAdminUser && !user.is_active_admin) || isSelf}
                                                onClick={() => handleStatusChange(user)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Bottom Pagination */}
            {filteredUsers.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-700/50">
                    <div className="text-sm text-gray-400">
                        Showing <span className="font-bold text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-white">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of <span className="font-bold text-white">{filteredUsers.length}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 border border-slate-700 text-gray-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

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
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Expires At (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.subscriptionExpiresAt}
                                        onChange={(e) => setFormData({ ...formData, subscriptionExpiresAt: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors [color-scheme:dark]"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Leave empty to set as "Never Expires" (Free) or auto-set 30 days (VIP/Pro).</p>
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