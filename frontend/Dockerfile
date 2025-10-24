# Sử dụng base image Node.js 18
FROM node:18-alpine

# Đặt thư mục làm việc
WORKDIR /app

# Copy file package.json và package-lock.json
COPY package*.json ./

# Cài đặt tất cả dependencies (bao gồm cả devDependencies)
RUN npm ci

# Vẫn cần tham số này cho Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy phần còn lại của code (chỉ cần cho lần build đầu tiên)
COPY . .

# Mở cổng 3000
EXPOSE 3000

# Lệnh mặc định là chạy server DEV (thay vì "node server.js")
CMD [ "npm", "run", "dev" ]