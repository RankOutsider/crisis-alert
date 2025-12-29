// frontend/app/components/MultiSelectDropdown.jsx
'use client';

import { useState, useRef } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { useClickAway } from 'react-use';

/**
 * Props:
 * - title: "Platform" | "Sentiment"
 * - options: Mảng các chuỗi
 * - selectedOptions: Mảng các chuỗi đã chọn
 * - onChange: Hàm (newSelected) => {}
 * - showOrder: (Boolean) Có hiện số thứ tự chọn hay không (Mặc định: false)
 */
export default function MultiSelectDropdown({ title, options, selectedOptions, onChange, showOrder = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useClickAway(ref, () => {
        setIsOpen(false);
    });

    const handleSelect = (option) => {
        let newSelected;
        if (selectedOptions.includes(option)) {
            // Logic cũ: Bỏ chọn
            newSelected = selectedOptions.filter(item => item !== option);
        } else {
            // Logic cũ: Thêm vào cuối (giữ thứ tự click)
            newSelected = [...selectedOptions, option];
        }
        onChange(newSelected);
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange([]);
        setIsOpen(false);
    };

    const selectAll = () => {
        onChange([...options]);
    };

    const getButtonText = () => {
        if (selectedOptions.length === 0) return title;
        if (selectedOptions.length === 1) return selectedOptions[0];
        return `${title} (${selectedOptions.length})`;
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-md hover:bg-slate-700 w-full min-w-[140px] text-white transition-colors"
            >
                <span className="truncate font-medium">{getButtonText()}</span>
                <div className="flex items-center gap-1">
                    {selectedOptions.length > 0 && (
                        <div onClick={clearSelection} className="p-0.5 hover:bg-slate-600 rounded-full cursor-pointer transition-colors">
                            <X size={14} className="text-slate-400 hover:text-white" />
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-[9999] top-full left-0 mt-2 w-full min-w-[220px] max-h-80 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                    <div className="sticky top-0 bg-slate-900 p-2 border-b border-slate-700 flex justify-between z-10">
                        <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 hover:bg-slate-800 rounded">
                            Select All
                        </button>
                        <button onClick={(e) => clearSelection(e)} className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 hover:bg-slate-800 rounded">
                            Clear
                        </button>
                    </div>

                    <div className="p-1 space-y-0.5">
                        {options.map(option => {
                            const selectedIndex = selectedOptions.indexOf(option);
                            const isSelected = selectedIndex !== -1;
                            // Chỉ tính số thứ tự nếu prop showOrder = true
                            const displayOrder = (showOrder && isSelected) ? selectedIndex + 1 : null;

                            return (
                                <div
                                    key={option}
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer text-sm transition-all
                                        ${isSelected
                                            ? 'bg-blue-900/30 text-blue-100 hover:bg-blue-900/50'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-5 h-5 rounded border flex items-center justify-center transition-all duration-200
                                            ${isSelected
                                                ? 'bg-blue-600 border-blue-600 shadow-sm'
                                                : 'bg-slate-800 border-slate-600 group-hover:border-slate-500'}
                                        `}>
                                            {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <span className="capitalize">{option}</span>
                                    </div>

                                    {/* Chỉ hiển thị số nếu showOrder = true */}
                                    {displayOrder && (
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-sm">
                                            {displayOrder}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}