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

// Chỉ cho phép đúng những domain này gọi API
const allowedOrigins = [
    "http://localhost:3000",                                      // Localhost
    "https://crisis-alert-theta.vercel.app",                      // Domain Production XỊN
    "https://crisis-alert-git-master-rankoutsiders-projects.vercel.app" // Domain nhánh Master (phòng hờ)
];

// Cấu hình CORS cho Express
const corsOptions = {
    origin: function (origin, callback) {
        // !origin: Cho phép request từ Postman hoặc Server-to-Server không có origin
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("🚫 CORS Blocked:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // Cho phép nhận cookie/token
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

const httpServer = http.createServer(app);

// ============================================================
// 🔌 CẤU HÌNH SOCKET.IO
// ============================================================
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins, // Dùng chung danh sách allowedOrigins ở trên
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
    res.send('CrisisAlert API is Running (Production Mode)!');
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