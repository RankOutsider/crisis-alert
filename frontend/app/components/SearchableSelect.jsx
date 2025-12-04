// frontend/app/components/SearchableSelect.jsx
import Select from 'react-select';

// Đưa styles vào trong component này để tái sử dụng
const darkSelectStyles = {
    control: (styles, { isFocused }) => ({
        ...styles,
        backgroundColor: '#1f2937', // bg-gray-800
        borderColor: isFocused ? '#3b82f6' : '#374151',
        color: '#f3f4f6',
        boxShadow: isFocused ? '0 0 0 1px #3b82f6' : 'none',
        '&:hover': { borderColor: '#4b5563' },
    }),
    menu: (styles) => ({
        ...styles,
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        zIndex: 50
    }),
    option: (styles, { isDisabled, isFocused, isSelected }) => ({
        ...styles,
        backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#374151' : 'transparent',
        color: isSelected ? 'white' : '#f3f4f6',
        cursor: isDisabled ? 'not-allowed' : 'default',
        '&:active': { backgroundColor: '#2563eb' },
    }),
    singleValue: (styles) => ({ ...styles, color: '#f3f4f6' }),
    input: (styles) => ({ ...styles, color: '#f3f4f6' }),
    placeholder: (styles) => ({ ...styles, color: '#6b7280' }),
    multiValue: (styles) => ({ ...styles, backgroundColor: '#374151' }),
    multiValueLabel: (styles) => ({ ...styles, color: '#f3f4f6' }),
    multiValueRemove: (styles) => ({
        ...styles,
        color: '#9ca3af',
        '&:hover': { backgroundColor: '#ef4444', color: 'white' },
    }),
    clearIndicator: (styles) => ({ ...styles, color: '#9ca3af', '&:hover': { color: '#f3f4f6' } }),
    dropdownIndicator: (styles) => ({ ...styles, color: '#9ca3af', '&:hover': { color: '#f3f4f6' } }),
};

export default function SearchableSelect({ options, value, onChange, placeholder, isLoading, isClearable = true }) {
    return (
        <Select
            instanceId={`select-${placeholder}`}
            options={options}
            value={value}
            onChange={onChange}
            isClearable={isClearable}
            isSearchable
            placeholder={placeholder}
            isLoading={isLoading}
            styles={darkSelectStyles}
        />
    );
}