// frontend/app/layout.jsx

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import GlobalToast from "@/app/components/GlobalToast";

// Khai báo font Geist Sans
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Khai báo font Geist Mono
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata phục vụ SEO của Next.js
export const metadata = {
  title: "CrisisAlert",
  description: "Monitor and alert brand crises",
};

// Root Layout: Bao toàn bộ ứng dụng bằng cấu trúc HTML chung
export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        {/* Viewport giúp UI hiển thị chuẩn trên mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>

      {/* Áp dụng font cho toàn bộ ứng dụng */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Providers bao bọc toàn app để dùng các context */}
        <Providers>
          {/* Render nội dung của từng trang */}
          {children}

          {/* GlobalToast: component hiển thị toast notifications */}
          <GlobalToast />
        </Providers>
      </body>
    </html>
  );
}
