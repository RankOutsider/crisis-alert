# backend/Dockerfile (ĐÃ SỬA)

# Sử dụng base image Node.js Slim (dễ cài đặt thư viện hơn Alpine)
FROM node:18-slim 

# Đặt thư mục làm việc bên trong container
WORKDIR /app

# Copy file package.json và package-lock.json trước
COPY package*.json ./

# Cài đặt dependencies Node.js
RUN npm ci

# 1. CÀI ĐẶT CÁC THƯ VIỆN HỆ THỐNG CẦN THIẾT CHO CHROMIUM/PUPPETEER
# Bao gồm các font cơ bản và thư viện liên quan đến X-server/GUI
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    fonts-noto \ 
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy toàn bộ code còn lại của backend vào
COPY . .

# Thông báo cho Docker biết container sẽ lắng nghe ở cổng 5000
EXPOSE 5000

# Lệnh để chạy ứng dụng của bạn (file server.js)
CMD [ "node", "server.js" ]