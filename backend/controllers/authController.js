// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SECRET = process.env.JWT_SECRET;

// @desc    Đăng ký người dùng mới
exports.register = async (req, res) => {
    const { username, email, phone, password } = req.body;
    try {
        const existingUser = await User.findOne({ where: { username: username } });
        if (existingUser) { 
            return res.status(400).json({ message: 'Username already exists' });
        }

        const existingEmail = await User.findOne({ where: { email: email } });
        if (existingEmail) { 
            return res.status(400).json({ message: 'Email is already in use' });
        }

        const exsitingPhone = await User.findOne({ where: { phone: phone } });
        if (exsitingPhone) { 
            return res.status(400).json({ message: 'Phone number is already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({ username, email, phone, password: hashedPassword });
        res.status(201).json({ message: 'Registration successful!' });
    } catch (error) {
        // --- XỬ LÝ LỖI UNIQUE CONSTRAINT TỪ DATABASE ---
        // Bắt lỗi Unique Constraint từ Sequelize
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error("Lỗi Unique Constraint khi đăng ký:", error.fields);
            // Kiểm tra xem trường nào gây lỗi
            if (error.fields && error.fields.includes('phone')) {
                return res.status(409).json({
                    errors: [{ path: 'phone', msg: 'Phone number already exists.' }] // <-- English
                });
            }
            if (error.fields && error.fields.includes('username')) {
                return res.status(409).json({
                    errors: [{ path: 'username', msg: 'Username already exists.' }] // <-- English
                });
            }
            if (error.fields && error.fields.includes('email')) {
                return res.status(409).json({
                    errors: [{ path: 'email', msg: 'Email is already in use.' }] // <-- English
                });
            }
            // Nếu không xác định được trường unique nào
            return res.status(409).json({ message: 'Duplicate data conflict.' }); // <-- English
        }

        // Lỗi không xác định
        console.error("Unknown registration error:", error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};

// @desc    Đăng nhập người dùng
exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter username and password' });
    }
    try {
        const user = await User.findOne({ where: { username: username } });
        if (!user) { return res.status(401).json({ message: 'Invalid username or password' }); }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { return res.status(401).json({ message: 'Invalid username or password' }); }
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '8h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};

// @desc    Lấy thông tin người dùng hiện tại (đã login)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'email', 'phone', 'notificationsEnabled']
        });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Cập nhật chi tiết (email, phone) của người dùng
exports.updateDetails = async (req, res) => {
    try {
        const { email, phone } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        user.email = email || user.email;
        user.phone = phone || user.phone;
        await user.save();
        res.status(200).json({ message: 'Details updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Cập nhật mật khẩu
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Cập nhật cài đặt
exports.updateSettings = async (req, res) => {
    try {
        const { notificationsEnabled } = req.body;
        if (typeof notificationsEnabled !== 'boolean') {
            return res.status(400).json({ message: 'Invalid value for notificationsEnabled' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.notificationsEnabled = notificationsEnabled;
        await user.save();
        res.status(200).json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Xóa tài khoản
exports.deleteAccount = async (req, res) => {
    try {
        // Lấy mật khẩu từ body của request
        const { password } = req.body;
        const userId = req.user.id;

        if (!password) {
            return res.status(400).json({ message: 'Password is required for confirmation' });
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        await user.destroy();

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Server error' });
    }
};