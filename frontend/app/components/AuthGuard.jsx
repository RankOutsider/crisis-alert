// frontend/app/components/AuthGuard.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/utils/api';
import { Loader2 } from 'lucide-react';

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
    }, []);

    if (!isVerified) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="flex items-center space-x-3 text-blue-400 text-lg">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Verifying Authentication</span>
                </div>
            </div>
        );
    }
    return <>{children}</>;
};

export default AuthGuard;