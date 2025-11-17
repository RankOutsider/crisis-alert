// frontend/app/components/EmailTagInput.jsx
'use client';
import { useState, useMemo, useCallback } from 'react';
import {
    Plus, Trash2, Search, Mail, X, AlertCircle,
    Square, CheckSquare
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email) => EMAIL_REGEX.test(email);

/**
 * Component Tag Input chuyên biệt cho Email - Đã tối ưu Mobile
 */
// --- THAY ĐỔI 1: Thêm prop "isLimitReached" (với giá trị mặc định là false) ---
export default function EmailTagInput({ emails, onChange, disabled, isLimitReached = false }) {
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [checkedEmails, setCheckedEmails] = useState(new Set());

    const parseAndNormalizeEmails = (input) => {
        if (!input) return [];
        return input.split(',')
            .map(e => e.trim())
            .filter(e => e !== '');
    };

    const handleAddEmail = (e) => {
        if (e) e.preventDefault();

        // --- THAY ĐỔI 2: Ngăn hàm chạy nếu đã đạt giới hạn ---
        // (Dành cho trường hợp người dùng nhấn "Enter")
        if (!inputValue || disabled || isLimitReached) return;

        const incomingEmails = parseAndNormalizeEmails(inputValue);

        const validNewEmails = incomingEmails
            .filter(e => isValidEmail(e) && !emails.includes(e));

        if (validNewEmails.length > 0) {
            const updatedEmails = [...emails, ...validNewEmails];
            onChange(updatedEmails); // Gửi mảng mới lên cha, cha sẽ check lại lần nữa
            setInputValue('');
        } else if (incomingEmails.length > 0) {
            alert("One or more emails are invalid or already in the list.");
        }
    };

    const handleDeleteSingle = (emailToDelete) => {
        const updatedEmails = emails.filter(e => e !== emailToDelete);
        if (checkedEmails.has(emailToDelete)) {
            const newChecked = new Set(checkedEmails);
            newChecked.delete(emailToDelete);
            setCheckedEmails(newChecked);
        }
        onChange(updatedEmails);
    };

    const handleBulkDelete = () => {
        if (checkedEmails.size === 0) return;
        const updatedEmails = emails.filter(email => !checkedEmails.has(email));
        onChange(updatedEmails);
        setCheckedEmails(new Set());
    };

    const handleToggleCheck = (email) => {
        const newChecked = new Set(checkedEmails);
        if (newChecked.has(email)) {
            newChecked.delete(email);
        } else {
            newChecked.add(email);
        }
        setCheckedEmails(newChecked);
    };

    const handleToggleAll = (currentFilteredEmails) => {
        if (checkedEmails.size === currentFilteredEmails.length) {
            setCheckedEmails(new Set());
        } else {
            const allEmails = new Set(currentFilteredEmails);
            setCheckedEmails(allEmails);
        }
    };

    const filteredEmails = useMemo(() => {
        if (!searchTerm) {
            return emails;
        }
        return emails.filter(email =>
            email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [emails, searchTerm]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            e.stopPropagation();

            if (inputValue.trim() !== '') {
                handleAddEmail();
            }
        }
    };

    const canAddEmail = useMemo(() => {
        const incomingEmails = parseAndNormalizeEmails(inputValue);
        return incomingEmails.some(email => isValidEmail(email) && !emails.includes(email));
    }, [inputValue, emails]);


    return (
        <div className="space-y-4 w-full">
            {/* --- INPUT CHÍNH ĐỂ NHẬP EMAIL --- */}
            <div className="flex items-stretch gap-2 w-full">
                <input
                    type="text"
                    // --- THAY ĐỔI 3: Cập nhật placeholder và disabled ---
                    placeholder={isLimitReached ? "Email limit reached" : "Enter email(s)..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || isLimitReached} // Vô hiệu hóa input khi đạt limit
                    className="flex-1 min-w-0 px-3 sm:px-4 py-2 bg-slate-800/80 border border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-200 placeholder-gray-500 text-sm sm:text-base disabled:opacity-70"
                />
                <button
                    type="button"
                    onClick={handleAddEmail}
                    // --- THAY ĐỔI 4: Vô hiệu hóa nút 'Thêm' khi đạt limit ---
                    disabled={disabled || !canAddEmail || isLimitReached}
                    title={isLimitReached ? "Email limit reached for your plan" : "Add email"}
                    className="shrink-0 px-3 sm:px-4 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* --- THANH TÌM KIẾM & XOÁ --- */}
            <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg border border-slate-600 w-full">
                {/* ... (Phần còn lại giữ nguyên) ... */}
                <Search size={18} className="text-gray-400 shrink-0 ml-1" />
                <input
                    type="text"
                    placeholder={`Search...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-gray-200 placeholder-gray-400 text-sm sm:text-base px-1"
                />
                <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={checkedEmails.size === 0 || disabled} // Thêm disabled check
                    className="shrink-0 px-3 py-1.5 font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 text-xs sm:text-sm"
                    title="Delete selected emails"
                >
                    <Trash2 size={16} className="mr-1" />
                    <span className="hidden sm:inline">Delete </span>
                    <span>({checkedEmails.size})</span>
                </button>
            </div>


            {/* --- DANH SÁCH TAGS --- */}
            <div className="max-h-52 overflow-y-auto space-y-2 p-3 bg-slate-700/30 rounded-lg border border-slate-600 mt-3 w-full">
                <div className="flex items-center justify-between text-sm text-gray-400 pb-2 border-b border-slate-600">
                    <button
                        type="button"
                        onClick={() => handleToggleAll(filteredEmails)}
                        className="flex items-center gap-2 hover:text-white transition-colors disabled:cursor-not-allowed"
                        disabled={filteredEmails.length === 0}
                    >
                        {checkedEmails.size === filteredEmails.length && filteredEmails.length > 0 ?
                            <CheckSquare size={18} className="text-blue-400 shrink-0" /> :
                            <Square size={18} className="shrink-0" />
                        }
                        <span className="truncate">Select All ({filteredEmails.length})</span>
                    </button>
                </div>

                {filteredEmails.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">
                        {emails.length === 0
                            ? "Add emails above to receive alerts."
                            : "No emails match filter."}
                    </p>
                ) : (
                    filteredEmails.map((email) => (
                        <div
                            key={email}
                            className={`flex items-center justify-between p-2 rounded-lg transition-colors duration-150 ${checkedEmails.has(email) ? 'bg-slate-600/50' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                        >
                            <div className="flex items-center min-w-0 flex-1 mr-2">
                                <input
                                    type="checkbox"
                                    checked={checkedEmails.has(email)}
                                    onChange={() => handleToggleCheck(email)}
                                    disabled={disabled} // Vô hiệu hóa checkbox khi đang lưu
                                    className="form-checkbox h-4 w-4 text-blue-600 bg-slate-800 border-slate-500 rounded focus:ring-blue-500 cursor-pointer mr-3 shrink-0"
                                />
                                {isValidEmail(email) ?
                                    <Mail size={16} className="text-green-400 shrink-0" /> :
                                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                                }
                                <span className={`ml-2 truncate text-sm font-medium ${isValidEmail(email) ? 'text-white' : 'text-red-400'}`} title={email}>
                                    {email}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDeleteSingle(email)}
                                disabled={disabled} // Vô hiệu hóa nút xóa khi đang lưu
                                className="shrink-0 p-1.5 rounded-full hover:bg-red-500/20 text-red-400 transition-colors duration-150 disabled:opacity-50"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}