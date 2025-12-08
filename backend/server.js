// backend/server.js
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { connectDB, sequelize } = require('./config/db');
const { runScanJob } = require('./utils/scan_job');
const { initCronJobs } = require('./utils/cron_job');

require('./models/associations');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// 🔒 CẤU HÌNH BẢO MẬT CORS (LINH HOẠT & AN TOÀN)
// ============================================================

// 1. Danh sách các domain CỐ ĐỊNH (Localhost, Domain chính)
const fixedOrigins = [
    "http://localhost:3000",
    "https://crisis-alert.vercel.app", // (Ví dụ nếu bạn có domain ngắn này)
];

// 2. Biểu thức chính quy (Regex) cho các domain ĐỘNG
// Ý nghĩa: Chấp nhận mọi domain bắt đầu bằng "https://crisis-alert" và kết thúc bằng ".vercel.app"
// Ví dụ khớp: https://crisis-alert-12345.vercel.app, https://crisis-alert-git-main.vercel.app
const vercelPreviewPattern = /^https:\/\/crisis-alert.*\.vercel\.app$/;

// 3. Hàm kiểm tra xem Origin có hợp lệ không
const isOriginAllowed = (origin) => {
    // Cho phép request không có origin (như Postman, Server-to-Server)
    if (!origin) return true;

    // Kiểm tra trong danh sách cố định
    if (fixedOrigins.includes(origin)) return true;

    // Kiểm tra theo mẫu (Regex) cho Vercel Preview
    if (vercelPreviewPattern.test(origin)) return true;

    return false;
};

// Cấu hình cho Express
const corsOptions = {
    origin: function (origin, callback) {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            console.log("🚫 CORS Blocked:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

const httpServer = http.createServer(app);

// ============================================================
// 🔌 CẤU HÌNH SOCKET.IO (DÙNG CHUNG LOGIC TRÊN)
// ============================================================
const io = new Server(httpServer, {
    cors: {
        origin: function (origin, callback) {
            // Socket.io đôi khi gửi origin là "null" hoặc undefined trong một số trường hợp handshake
            if (isOriginAllowed(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Áp dụng CORS cho Express
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket logic
io.on('connection', (socket) => {
    console.log(`🔌 [Socket.IO] Connected: ${socket.id}`);
    socket.on('join_user_room', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
        }
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/casestudies', require('./routes/casestudies'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.send('CrisisAlert API is Running with Dynamic CORS!');
});

// Start Server
const startServer = async () => {
    try {
        await connectDB();
        console.log("✅ Database connected.");
        httpServer.listen(PORT, () => {
            console.log(`🚀 Backend running at: http://localhost:${PORT}`);
            initCronJobs();
            console.log("⏰ Cron jobs started.");
            cron.schedule('*/1 * * * *', () => {
                runScanJob(io).catch(err => console.error("❌ Cron error:", err));
            });
        });
    } catch (error) {
        console.error("❌ Startup error:", error);
        process.exit(1);
    }
}

startServer();