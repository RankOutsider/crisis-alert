// frontend/app/components/Modal.jsx
'use client';

import { X } from 'lucide-react';
import { useClickAway } from 'react-use'; // Bạn đã cài thư viện này rồi
import { useRef } from 'react';

/**
 * Props:
 * - isOpen: (boolean) Trạng thái đóng/mở
 * - onClose: (function) Hàm được gọi khi bấm 'X' hoặc click ra ngoài
 * - title: (string) Tiêu đề của modal
 * - children: (ReactNode) Nội dung chính của modal (form, text,...)
 * - footer: (ReactNode) Phần chân chứa các nút bấm (OK, Cancel)
 * - size: (string - optional) 'max-w-md' (mặc định), 'max-w-2xl' (cho form),...
 */
export default function Modal({ isOpen, onClose, title, children, footer, size = 'max-w-md' }) {
    const ref = useRef(null);

    // Đóng modal khi click ra ngoài
    useClickAway(ref, onClose);

    if (!isOpen) return null;

    return (
        // Lớp nền mờ
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            {/* Khung modal */}
            <div
                ref={ref}
                className={`bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full ${size} max-h-[90vh] flex flex-col`}
            >
                {/* 1. Tiêu đề */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 2. Nội dung chính (có thể cuộn) */}
                <div className="p-4 sm:p-6 overflow-y-auto">
                    {children}
                </div>

                {/* 3. Chân (Footer) chứa các nút bấm */}
                {footer && (
                    <div className="flex justify-end gap-3 p-4 border-t border-slate-700 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}