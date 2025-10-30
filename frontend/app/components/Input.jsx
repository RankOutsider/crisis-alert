'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
    name,
    value,
    onChange,
    placeholder,
    type = 'text',
    id,
    className = '',
    leftIcon = null
}) {
    const [showPassword, setShowPassword] = useState(false);

    // Xác định xem đây có phải là input password không
    const isPassword = type === 'password';

    // Xác định type hiện tại của input
    const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

    // --- Tự động tính toán padding ---
    let paddingClasses = "";
    if (leftIcon) {
        paddingClasses += " pl-10";
    } else {
        paddingClasses += " px-3 sm:px-4";
    }
    if (isPassword) {
        paddingClasses += " pr-10";
    }

    return (
        <div className="relative w-full">
            {/* 1. Icon bên trái */}
            {leftIcon && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    {/* Chúng ta clone icon và thêm class, 
                      nhưng cách đơn giản hơn là chỉ cần render nó
                    */}
                    {leftIcon}
                </div>
            )}

            {/* 2. Ô input chính */}
            <input
                id={id}
                name={name}
                type={currentType}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full py-2 sm:py-3 bg-gray-800/80 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base placeholder-gray-500 text-white ${paddingClasses} ${className}`}
            />

            {/* 3. Icon "con mắt" bên phải (chỉ hiển thị nếu type="password") */}
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300 hover:text-white cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            )}
        </div>
    );
}