// frontend/hooks/useFormValidation.js
import { useState } from 'react';

const validate = (values, schema) => {
    let errors = {};
    for (const key in schema) {
        const rules = schema[key];
        const value = values[key];
        const fieldName = key.charAt(0).toUpperCase() + key.slice(1);

        if (rules.required && (value === undefined || value === null || String(value).trim() === '')) {
            errors[key] = `${fieldName} is required`;
        }
        else if (rules.minLength && value && String(value).length < rules.minLength) {
            errors[key] = `${fieldName} must be at least ${rules.minLength} characters long`;
        }
        else if (rules.pattern && value && !rules.pattern.test(String(value))) {
            errors[key] = rules.message || `Invalid ${key} format`;
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

    return {
        values,
        errors,
        setValues,
        setErrors,
        handleChange,
        validateForm
    };
};