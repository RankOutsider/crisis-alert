// frontend/utils/socket.js
import { io } from 'socket.io-client';

// URL của backend (phải là URL của server Node.js)
// Nó sẽ tự động lấy từ file .env
const URL = process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '');

// Tạo một đối tượng socket (chưa kết nối)
// autoConnect: false -> Chúng ta sẽ kết nối thủ công khi user đăng nhập
export const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    path: '/socket.io/',
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 20000,
});

// Các sự kiện chung của socket
socket.on('connect', () => {
    console.log('🔌 [Socket.IO] client connected. id=', socket.id);
});

socket.on('connect_error', (err) => {
    console.error('❌ [Socket.IO] connect_error:', err);
});

socket.on('disconnect', (reason) => {
    console.log('❗ [Socket.IO] disconnected. reason=', reason);
});