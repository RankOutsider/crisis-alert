// frontend/next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Xóa dòng output: 'standalone' (Để Vercel tự quản lý)
    // Xóa rewrites (Vì ta đã dùng biến môi trường NEXT_PUBLIC_API_URL trỏ thẳng về Render rồi)

    // Nếu bạn có dùng thẻ <Image> của Next.js để load ảnh từ link ngoài (ví dụ avatar), 
    // bạn cần thêm domain vào đây. Nếu không thì để rỗng object này.
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // Cho phép load ảnh từ mọi nguồn (hoặc cụ thể hóa nếu muốn)
            },
        ],
    },
};

export default nextConfig;

/*

Cấu hình ban đầu dùng khi deploy backend và frontend cùng một Docker Compose (đã bỏ)

*/
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     output: 'standalone',
//     async rewrites() {
//         return [
//             {
//                 source: '/api/:path*', // Khi frontend gọi đường dẫn bắt đầu bằng /api/
//                 // Chuyển hướng sang container Backend (tên service là 'backend' cổng 5000)
//                 destination: 'http://backend:5000/api/:path*',
//             },
//         ];
//     },
// };

// export default nextConfig;