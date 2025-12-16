// frontend/hooks/useFormValidation.js
import { useState } from 'react';

const validate = (values, schema) => {
    let errors = {};
    for (const key in schema) {
        const rules = schema[key];
        const value = values[key];
        const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();

        // Validate Required
        if (rules.required && (value === undefined || value === null || String(value).trim() === '')) {
            errors[key] = rules.message || `${fieldName} is required`;
        }
        // Validate MinLength
        else if (rules.minLength && value && String(value).length < rules.minLength) {
            errors[key] = rules.message || `${fieldName} must be at least ${rules.minLength} characters long`;
        }
        // Validate Pattern (Regex)
        else if (rules.pattern && value && !rules.pattern.test(String(value))) {
            errors[key] = rules.message || `Invalid ${fieldName} format`;
        }
        // Validate Custom
        else if (rules.custom && typeof rules.custom === 'function') {
            const isValid = rules.custom(value, values); // Truyền thêm 'values' để so sánh chéo
            if (!isValid) {
                errors[key] = rules.message || `Invalid value for ${fieldName}`;
            }
        }
    }
    return errors;
};

export const useFormValidation = (initialValues, schema) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prevValues) => ({
            ...prevValues,
            [name]: value,
        }));

        // Xóa lỗi khi người dùng bắt đầu gõ lại
        if (errors[name] || errors.general) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: null,
                general: null
            }));
        }
    };

    const validateForm = () => {
        const validationErrors = validate(values, schema);
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    // Hàm reset form
    const resetForm = () => {
        setValues(initialValues);
        setErrors({});
    };

    return {
        values,
        errors,
        setValues,
        setErrors,
        handleChange,
        validateForm,
        resetForm
    };
};