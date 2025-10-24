// frontend/app/components/MultiSelectDropdown.jsx
'use client';

import { useState, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useClickAway } from 'react-use';

/**
 * Props:
 * - title: "Platform" | "Sentiment"
 * - options: Mảng các chuỗi, vd: ['Facebook', 'X', 'Forum']
 * - selectedOptions: Mảng các chuỗi đã chọn, vd: ['Facebook']
 * - onChange: Hàm (newSelected) => {} được gọi khi lựa chọn thay đổi
 */
export default function MultiSelectDropdown({ title, options, selectedOptions, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    // Sử dụng hook này để đóng dropdown khi click ra ngoài
    useClickAway(ref, () => {
        setIsOpen(false);
    });

    const handleSelect = (option) => {
        let newSelected;
        if (selectedOptions.includes(option)) {
            // Nếu đã chọn -> Bỏ chọn
            newSelected = selectedOptions.filter(item => item !== option);
        } else {
            // Nếu chưa chọn -> Thêm vào
            newSelected = [...selectedOptions, option];
        }
        onChange(newSelected); // Cập nhật state ở component cha
    };

    const clearSelection = (e) => {
        e.stopPropagation(); // Ngăn việc mở/đóng dropdown
        onChange([]);
        setIsOpen(false);
    };

    // Hiển thị text trên nút
    const getButtonText = () => {
        if (selectedOptions.length === 0) return title;
        if (selectedOptions.length === 1) return selectedOptions[0];
        return `${title} (${selectedOptions.length})`;
    };

    return (
        <div className={`relative ${isOpen ? 'z-[9999]' : 'z-10'}`} ref={ref}>
            {/* Nút bấm để mở/đóng */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-md hover:bg-slate-700 min-w-[120px]"
            >
                <span className="truncate">{getButtonText()}</span>

                {/* Nút 'X' để xóa nhanh */}
                {selectedOptions.length > 0 && (
                    <X size={14} onClick={clearSelection} className="hover:text-white flex-shrink-0" />
                )}
                <ChevronDown size={16} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Danh sách checkbox */}
            {isOpen && (
                <div className="absolute z-[9999] top-full left-0 mt-2 
                                w-full sm:w-56 max-h-60 overflow-y-auto 
                                bg-slate-800 border border-slate-600 
                                rounded-lg shadow-lg">
                    <div className="p-2 space-y-1">
                        {options.map(option => (
                            <label
                                key={option}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-700 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedOptions.includes(option)}
                                    onChange={() => handleSelect(option)}
                                    className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500"
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}