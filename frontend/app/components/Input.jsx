'use client';

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
    // --- Tự động tính toán padding ---
    let paddingClasses = "";
    if (leftIcon) {
        paddingClasses += " pl-10";
    } else {
        paddingClasses += " px-3 sm:px-4";
    }

    return (
        <div className="relative w-full">
            {/* 1. Icon bên trái */}
            {leftIcon && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    {leftIcon}
                </div>
            )}

            {/* 2. Ô input chính */}
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`
                    w-full
                    py-2 sm:py-3
                    bg-slate-700
                    border border-gray-300 rounded-lg
                    focus:ring-blue-500
                    focus:border-blue-500
                    text-sm sm:text-base
                    placeholder-gray-500
                    text-white
                    ${paddingClasses}
                    ${className}`}
            />
        </div>
    );
}