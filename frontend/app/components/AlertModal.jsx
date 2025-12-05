// frontend/app/components/AlertModal.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Save, PlusCircle, X } from 'lucide-react';
import Modal from '@/app/components/Modal';

const PLATFORM_OPTIONS = ['Facebook', 'Instagram', 'News', 'Forum', 'Threads', 'Tiktok', 'X', 'Youtube', 'Blog'];
const INPUT_CLASSES = 'w-full px-4 py-2 bg-slate-700/80 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed';

export default function AlertModal({ isOpen, onClose, onSubmit, initialData = null, keywordLimit = 0, isLoading = false, serverErrors = {} }) {
    const isEditMode = !!initialData;
    const [formData, setFormData] = useState({ title: '', description: '', severity: 'Medium', keywords: [], platforms: [], status: 'ACTIVE' });
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [clientErrors, setClientErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({ ...initialData, keywords: initialData.keywords || [], platforms: initialData.platforms || [] });
            } else {
                setFormData({ title: '', description: '', severity: 'Medium', keywords: [], platforms: [], status: 'ACTIVE' });
            }
            setClientErrors({});
            setCurrentKeyword('');
        }
    }, [isOpen, initialData]);

    const hasReachedKeywordLimit = useMemo(() => keywordLimit > 0 && (formData.keywords || []).length >= keywordLimit, [formData.keywords, keywordLimit]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (clientErrors[name]) setClientErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleAddKeyword = () => {
        if (hasReachedKeywordLimit) return;

        const trimmed = currentKeyword.trim();
        if (trimmed && !formData.keywords.includes(trimmed)) setFormData(prev => ({ ...prev, keywords: [...prev.keywords, trimmed] }));
        setCurrentKeyword('');
    };
    const handleRemoveKeyword = (kw) => setFormData(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }));
    const handlePlatformChange = (p) => setFormData(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setClientErrors({});

        // Validate Client-side
        let newErrors = {};
        if (!formData.title?.trim()) newErrors.title = "Title is required.";
        if (formData.keywords.length === 0) newErrors.keywords = "At least one keyword is required.";
        if (formData.platforms.length === 0) newErrors.platforms = "At least one platform is required.";

        if (Object.keys(newErrors).length > 0) {
            setClientErrors(newErrors);
            return;
        }

        // Gửi data ra ngoài cho cha xử lý (không async/await ở đây nữa)
        onSubmit(formData);
    };

    // Merge lỗi từ client và server để hiển thị
    const errors = { ...clientErrors, ...serverErrors };

    return (
        <Modal
            isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Alert" : "Create New Alert"} size="max-w-2xl"
            footer={
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 font-semibold rounded-lg bg-slate-600 hover:bg-slate-700 w-full sm:w-auto text-white transition-colors">
                        Cancel
                    </button>

                    <button
                        type="submit"
                        form="alert-form"
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto transition-colors disabled:opacity-50">

                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : isEditMode ? <Save size={18} /> : <PlusCircle size={18} />}

                        {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Alert'}
                    </button>
                </div>
            }
        >
            <form id="alert-form" onSubmit={handleSubmit} className="space-y-4">
                {errors.general && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-sm text-center">{errors.general}</div>}

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Title
                    </label>

                    <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Brand Mention Spike" className={`${INPUT_CLASSES} ${errors.title ? 'border-red-500' : ''}`} />
                    {errors.title && <p className="mt-1 text-xs text-red-400">
                        {errors.title}
                    </p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Description (Optional)
                    </label>

                    <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className={INPUT_CLASSES} />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-300">Keywords</label>
                        {keywordLimit > 0 && (
                            <span className={`text-xs ${hasReachedKeywordLimit ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                                {formData.keywords.length} / {keywordLimit} Keywords Used
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            value={currentKeyword}
                            onChange={e => setCurrentKeyword(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                            placeholder={hasReachedKeywordLimit ? "Limit reached" : "Add keyword..."}
                            disabled={hasReachedKeywordLimit}
                            className={`${INPUT_CLASSES} ${errors.keywords ? 'border-red-500' : ''}`}

                        />
                        <button
                            type="button"
                            onClick={handleAddKeyword}
                            disabled={hasReachedKeywordLimit}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-600"
                        >
                            <PlusCircle size={20} />
                        </button>
                    </div>

                    {/* Dòng thông báo đỏ khi max limit */}
                    {hasReachedKeywordLimit && (
                        <p className="mt-2 text-xs text-red-400 flex items-center gap-1 animate-pulse">
                            <X size={12} /> You have reached the maximum limit of {keywordLimit} keywords. Please remove some to add new ones.
                        </p>
                    )}

                    {errors.keywords && <p className="mt-1 text-xs text-red-400">{errors.keywords}</p>}

                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                        {formData.keywords.map(kw => (
                            <span key={kw} className="flex items-center gap-1 bg-slate-600 text-slate-200 text-sm px-2 py-1 rounded-md border border-slate-500 group hover:border-red-500/50 transition-colors">
                                {kw}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveKeyword(kw)}
                                    className="text-gray-400 hover:text-red-400 rounded-full p-0.5 transition-colors">
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Platforms
                    </label>
                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 border p-2 rounded-lg ${errors.platforms ? 'border-red-500' : 'border-slate-700'}`}>
                        {PLATFORM_OPTIONS.map(p => (<label
                            key={p}
                            className="flex items-center gap-2 text-slate-300 cursor-pointer p-1">
                            <input
                                type="checkbox"
                                checked={formData.platforms.includes(p)}
                                onChange={() => handlePlatformChange(p)}
                                className="rounded bg-slate-700 border-slate-600 text-blue-500" />
                            <span className="text-sm">
                                {p}
                            </span>
                        </label>))}
                    </div>
                    {errors.platforms &&
                        <p className="mt-1 text-xs text-red-400">{errors.platforms}</p>
                    }
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Severity
                    </label>
                    <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleChange}
                        className={INPUT_CLASSES}>
                        <option value="Low">
                            Low
                        </option>

                        <option value="Medium">
                            Medium
                        </option>

                        <option value="High">
                            High
                        </option>
                        
                        <option value="Critical">
                            Critical
                        </option>
                    </select>
                </div>
            </form>
        </Modal>
    );
}