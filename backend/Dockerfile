# Sử dụng base image Node.js 18 (bản Alpine nhỏ gọn)
FROM node:18-alpine

# Đặt thư mục làm việc bên trong container
WORKDIR /app

# Copy file package.json và package-lock.json trước
# Dấu * để copy cả 2 file
COPY package*.json ./

# Cài đặt dependencies (npm ci dùng package-lock.json, nhanh và an toàn hơn)
RUN npm ci

# Copy toàn bộ code còn lại của backend vào
COPY . .

# Thông báo cho Docker biết container sẽ lắng nghe ở cổng 5000
# (Giá trị này nên khớp với biến PORT trong docker-compose.yml)
EXPOSE 5000

# Lệnh để chạy ứng dụng của bạn (file server.js)
CMD [ "node", "server.js" ]