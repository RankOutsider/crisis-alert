// frontend/app/components/FilterBar.jsx
'use client';

import { Search } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown'; // Đảm bảo import đúng

/**
 * Props chung cho Filter Bar linh hoạt
 */
export default function FilterBar({
    // Props cho ô Search
    searchTerm,
    onSearchChange,
    placeholder = "Search...",

    // Props cho Checkbox "Search in"
    availableFields = [], // Mảng tên các trường: ['Title', 'Content', 'Source']
    activeFields = {},   // Object trạng thái: { title: true, content: false, source: true }
    onFieldChange,       // Function(fieldName: string)

    // Props TÙY CHỌN cho các Dropdowns
    platformOptions,      // Mảng options cho Platform
    selectedPlatforms,    // Mảng giá trị Platform đã chọn
    onPlatformChange,     // Function(newSelection: string[])

    sentimentOptions,     // Mảng options cho Sentiment
    selectedSentiments,   // Mảng giá trị Sentiment đã chọn
    onSentimentChange,    // Function(newSelection: string[])

    statusOptions,        // Mảng options cho Status
    selectedStatus,       // Mảng giá trị Status đã chọn
    onStatusChange,       // Function(newSelection: string[])

    severityOptions,      // Mảng options cho Severity
    selectedSeverity,     // Mảng giá trị Severity đã chọn
    onSeverityChange,     // Function(newSelection: string[])

    // ... Thêm props cho các loại dropdown khác nếu cần trong tương lai
}) {
    // --- Logic kiểm tra xem nên hiển thị phần nào ---
    const showSearchInput = searchTerm !== undefined && onSearchChange;
    const showFieldsSection = availableFields && availableFields.length > 0 && activeFields && onFieldChange;

    const showPlatformDropdown = platformOptions && selectedPlatforms && onPlatformChange;
    const showSentimentDropdown = sentimentOptions && selectedSentiments && onSentimentChange;
    const showStatusDropdown = statusOptions && selectedStatus && onStatusChange;
    const showSeverityDropdown = severityOptions && selectedSeverity && onSeverityChange;

    // Có ít nhất 1 dropdown được hiển thị không?
    const hasAnyDropdown = showPlatformDropdown || showSentimentDropdown || showStatusDropdown || showSeverityDropdown;
    // Có cần hiển thị vạch ngăn cách không? (Khi có cả Fields và Dropdowns)
    const showDivider = showFieldsSection && hasAnyDropdown;
    // Có cần hiển thị hàng filter thứ 2 không? (Khi có Fields hoặc Dropdowns)
    const showSecondRow = showFieldsSection || hasAnyDropdown;

    return (
        <div className="bg-slate-700/50 p-4 rounded-lg mb-6 space-y-4">
            {/* 1. Ô tìm kiếm (Luôn hiển thị nếu có props) */}
            {showSearchInput && (
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={onSearchChange}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            )}

            {/* 2. Hàng Filter thứ 2 (Fields và Dropdowns) */}
            {showSecondRow && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-slate-300">
                    {/* Phần Checkbox Fields */}
                    {showFieldsSection && (
                        <>
                            <span>Search in:</span>
                            {availableFields.map((field) => (
                                <label key={field} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        // Dùng !! để đảm bảo giá trị là boolean (true/false)
                                        checked={!!activeFields[field.toLowerCase()]}
                                        onChange={() => onFieldChange(field)} // Truyền tên field hoa/thường như trong availableFields
                                        className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-600 focus:ring-offset-slate-800"
                                    />
                                    {field} {/* Hiển thị tên field */}
                                </label>
                            ))}
                        </>
                    )}

                    {/* Vạch ngăn cách */}
                    {showDivider && (
                        <div className="h-5 w-px bg-slate-600 hidden md:block mx-2"></div>
                    )}

                    {/* Phần Dropdowns (Render có điều kiện) */}
                    {showPlatformDropdown && (
                        <MultiSelectDropdown
                            title="Platform"
                            options={platformOptions}
                            selectedOptions={selectedPlatforms}
                            onChange={onPlatformChange}
                        />
                    )}
                    {showSentimentDropdown && (
                        <MultiSelectDropdown
                            title="Sentiment"
                            options={sentimentOptions}
                            selectedOptions={selectedSentiments}
                            onChange={onSentimentChange}
                        />
                    )}
                    {showStatusDropdown && (
                        <MultiSelectDropdown
                            title="Status"
                            options={statusOptions}
                            selectedOptions={selectedStatus}
                            onChange={onStatusChange}
                        />
                    )}
                    {showSeverityDropdown && (
                        <MultiSelectDropdown
                            title="Severity"
                            options={severityOptions}
                            selectedOptions={selectedSeverity}
                            onChange={onSeverityChange}
                        />
                    )}
                    {/* ... Thêm render có điều kiện cho các dropdown khác ... */}
                </div>
            )}
        </div>
    );
}