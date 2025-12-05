// backend/server.js
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import sequelize từ config/db để dùng lệnh sync
const { connectDB, sequelize } = require('./config/db');
const { runScanJob } = require('./utils/scan_job');

const { initCronJobs } = require('./utils/cron_job');

// === LOAD CÁC MODEL VÀ MỐI QUAN HỆ ===
// Dòng này rất quan trọng để Sequelize biết về các models trước khi sync
require('./models/associations');

// === CONFIG ===
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Định nghĩa CLIENT_URL
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

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
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Middleware chèn io vào req để dùng ở Controller
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

// === KÍCH HOẠT CÁC ROUTES ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/casestudies', require('./routes/casestudies'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.send('API for CrisisAlert is running!');
});

// === KHỞI ĐỘNG SERVER ===
const startServer = async () => {
    try {
        // Kết nối DB
        await connectDB();

        // Đồng bộ các model với database (nếu cần)
        // console.log("🔄 Syncing database models...");
        // await sequelize.sync({ alter: true });

        console.log("✅ Database synced and connected successfully!");

        // Khởi động Server
        httpServer.listen(PORT, () => {
            console.log(`🚀 Backend (with Socket.IO) is running at: http://localhost:${PORT}`);

            initCronJobs();

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