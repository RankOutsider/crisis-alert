// frontend/app/dashboard/page.jsx
'use client';

import { useEffect } from 'react';
import DashboardContent from './DashboardContent'; // Import component cũ của bạn

const DashboardPage = () => {

    useEffect(() => {
        console.log('--- DashboardPage useEffect BẮT ĐẦU ---');
        const token = localStorage.getItem('crisisAlertToken');
        console.log('DashboardPage: Token ngay lập tức:', token);
    }, []);

    // Hiển thị lại nội dung cũ
    return <DashboardContent />;
};

export default DashboardPage;