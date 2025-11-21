// frontend/app/components/Portal.jsx
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Chỉ render khi đã mount (để tránh lỗi hydration)
    // Đưa nội dung ra thẳng document.body
    return mounted
        ? createPortal(children, document.body)
        : null;
};

export default Portal;