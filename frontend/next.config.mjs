// frontend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        return [
            {
                source: '/api/:path*', // Khi frontend gọi đường dẫn bắt đầu bằng /api/
                // Chuyển hướng sang container Backend (tên service là 'backend' cổng 5000)
                destination: 'http://backend:5000/api/:path*',
            },
        ];
    },
};

export default nextConfig;