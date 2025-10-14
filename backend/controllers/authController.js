const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SECRET = 'day_la_mot_cai_key_sieu_bi_mat_khong_ai_doan_duoc_123';

// === REGISTER LOGIC ===
exports.register = async (req, res) => {
    const { username, email, phone, password } = req.body;
    if (!username || !email || !phone || !password) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }
    try {
        const existingUser = await User.findOne({ where: { username: username } });
        if (existingUser) { return res.status(400).json({ message: 'Username already exists' }); }
        const existingEmail = await User.findOne({ where: { email: email } });
        if (existingEmail) { return res.status(400).json({ message: 'Email is already in use' }); }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.create({ username, email, phone, password: hashedPassword });
        res.status(201).json({ message: 'Registration successful!' });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};
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
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) { return res.status(401).json({ message: 'Incorrect current password' }); }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateSettings = async (req, res) => {
    try {
        const { notificationsEnabled } = req.body;
        if (typeof notificationsEnabled !== 'boolean') {
            return res.status(400).json({ message: 'Invalid value for notificationsEnabled' });
        }
        const user = await User.findByPk(req.user.id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        user.notificationsEnabled = notificationsEnabled;
        await user.save();
        res.status(200).json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


// === HÀM MỚI: XÓA TÀI KHOẢN ===
// @desc    Delete user account
// @route   DELETE /api/auth/me
// @access  Private
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