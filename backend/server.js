// backend/server.js
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser'); // Import đã cài

const { connectDB, sequelize } = require('./config/db');
const { runScanJob } = require('./utils/scan_job');

// === LOAD CÁC MODEL VÀ MỐI QUAN HỆ ===
require('./models/associations');

// === CONFIG ===
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Định nghĩa CLIENT_URL ngay tại đây
const CLIENT_URL = "http://localhost:3000";

// Tạo HTTP server từ Express app
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO server
const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// === MIDDLEWARES ===
// Cấu hình CORS
app.use(cors({
    origin: CLIENT_URL, // Dùng biến đã định nghĩa
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Middleware để nhúng 'io' vào mọi request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// === SOCKET.IO CONNECTION LOGIC ===
io.on('connection', (socket) => {
    console.log(`🔌 [Socket.IO] A client has connected: ${socket.id}`);
    socket.on('join_user_room', (userId) => {
        if (userId) {
            console.log(`🚪 [Socket.IO] Client ${socket.id} entered user_${userId}'s room`);
            socket.join(`user_${userId}`);
        }
    });
    socket.on('disconnect', () => {
        console.log(`🔌 [Socket.IO] Client has disconnected: ${socket.id}`);
    });
});
// --- Kết thúc Socket.IO Logic ---

// === KÍCH HOẠT CÁC ROUTES ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/casestudies', require('./routes/casestudies'));

app.get('/', (req, res) => {
    res.send('API for CrisisAlert is running!');
});

// === KHỞI ĐỘNG SERVER ===
const startServer = async () => {
    try {
        await connectDB();

        httpServer.listen(PORT, () => {
            console.log(`🚀 Backend (with Socket.IO) is running at: http://localhost:${PORT}`);

            console.log("⏰ [node-cron] Scheduled to run once every minute.");
            cron.schedule('*/1 * * * *', () => {
                runScanJob(io).catch(err => {
                    console.error("❌ Lỗi nghiêm trọng khi chạy cronjob:", err);
                });
            });
        });

    } catch (error) {
        console.error("❌ Could not start server:", error);
        process.exit(1);
    }
}

startServer();