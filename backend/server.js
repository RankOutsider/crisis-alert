require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { connectDB, sequelize } = require('./config/db');

// === LOAD CÁC MODEL VÀ MỐI QUAN HỆ ===
const User = require('./models/User');
const Alert = require('./models/Alert');
const Post = require('./models/Post');
const CaseStudy = require('./models/CaseStudy');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// === KÍCH HOẠT CÁC "BẢNG CHỈ ĐƯỜNG" ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/casestudies', require('./routes/casestudies'));

app.get('/', (req, res) => {
    res.send('API for CrisisAlert is running!');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync();
        console.log("Database synchronized.");

        app.listen(PORT, () => console.log(`Backend running at: http://localhost:${PORT}`));

    } catch (error) {
        console.error("Could not start server:", error);
        process.exit(1);
    }
}

startServer();