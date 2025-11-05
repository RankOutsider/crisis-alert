// frontend/app/providers.jsx
'use client';

import { SWRConfig } from 'swr';
import { HeroUIProvider } from "@heroui/react";
import { fetcher } from '@/utils/api';

export default function Providers({ children }) {
    return (
        <SWRConfig
            value={{
                fetcher: fetcher,
                refreshInterval: 60000 // Giữ nguyên refresh 1 phút
            }}
        >
            <HeroUIProvider>
                {children}
            </HeroUIProvider>
        </SWRConfig>
    );
}