// frontend/app/components/AuthGuard.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/utils/api';

const AuthGuard = ({ children }) => {
    const router = useRouter();
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.replace('/login');
        } else {
            setIsVerified(true);
        }
    }, []); // Dependency rỗng là chính xác

    if (!isVerified) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-blue-400 text-lg">Verifying session...</div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthGuard;