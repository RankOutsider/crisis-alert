// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { Op } = require('sequelize');

const {
    sendVerificationEmail,
    sendPasswordResetEmail
} = require('../utils/emailService');


const SECRET = process.env.JWT_SECRET;

// @desc    Đăng ký người dùng mới
exports.register = async (req, res) => {
    const { username, email, phone, password } = req.body;
    try {
        // 1. Kiểm tra username đã tồn tại
        let existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        // 2. Kiểm tra SĐT đã tồn tại
        existingUser = await User.findOne({ where: { phone } });
        if (existingUser) {
            return res.status(400).json({ message: 'Phone number is already in use.' });
        }

        // 3. Kiểm tra email đã tồn tại VÀ ĐÃ XÁC THỰC
        existingUser = await User.findOne({ where: { email, is_verified: true } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already in use.' });
        }

        // 4. Xử lý email đã đăng ký nhưng CHƯA XÁC THỰC
        existingUser = await User.findOne({ where: { email, is_verified: false } });
        if (existingUser) {
            await Otp.destroy({ where: { email } });
            await User.destroy({ where: { id: existingUser.id } });
        }

        // 5. Băm mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Tạo user mới với is_verified = false
        const newUser = await User.create({
            username,
            email,
            phone,
            password: hashedPassword,
            is_verified: false,
            // subscriptionTier sẽ tự động được set là 'Free' (nhờ Bước 1)
        });

        // 7. Tạo mã OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Mã 6 số
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Hết hạn sau 10 phút

        // 8. Lưu OTP vào database
        await Otp.create({
            email: newUser.email,
            otp_code: otpCode,
            expires_at: expiresAt,
        });

        // 9. Gửi email xác thực (dùng hàm Gmail)
        await sendVerificationEmail(newUser.email, otpCode);

        // 10. Trả về thông báo thành công (bằng tiếng Anh)
        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.'
        });

    } catch (error) {
        console.error("Lỗi khi đăng ký:", error);
        res.status(500).json({ message: 'Internal server error, please try again' });
    }
};

// @desc    Đăng nhập người dùng
exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter username and password' });
    }
    try {
        const user = await User.findOne({ where: { username: username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        if (!user.is_verified) {
            return res.status(403).json({
                message: 'Account not verified. Please check your email.',
                email: user.email
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '8h' });
        res.json({ message: 'Login successful', token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};

// @desc    Lấy thông tin người dùng hiện tại (đã login)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: [
                'id',
                'username',
                'email',
                'phone',
                'notificationsEnabled',
                'full_name',
                'company',
                'avatar_url',
                'gender',
                'date_of_birth',
                'address',
                'cc_emails',
                'subscriptionTier'
            ]
        });
        if (!user) { return res.status(404).json({ message: 'User not found' }); }
        res.status(200).json(user);
    } catch (error) {
        console.error("GetMe Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Cập nhật chi tiết hồ sơ người dùng
exports.updateDetails = async (req, res) => {
    try {
        const {
            email,
            phone,
            full_name,
            company,
            avatar_url,
            gender,
            date_of_birth,
            address
        } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.full_name = full_name || user.full_name;
        user.company = company || user.company;
        user.avatar_url = avatar_url || user.avatar_url;
        user.gender = gender || user.gender;
        user.date_of_birth = date_of_birth || user.date_of_birth;
        user.address = address || user.address;

        await user.save();
        res.status(200).json({ message: 'Profile details updated successfully' });

    } catch (error) {
        console.error("UpdateDetails Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Cập nhật mật khẩu
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

// @desc    Cập nhật cài đặt
exports.updateSettings = async (req, res) => {
    try {
        const { notificationsEnabled, cc_emails } = req.body;
        if (notificationsEnabled !== undefined && typeof notificationsEnabled !== 'boolean') {
            return res.status(400).json({ message: 'Invalid value for notificationsEnabled' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (notificationsEnabled !== undefined) {
            user.notificationsEnabled = notificationsEnabled;
        }
        if (cc_emails !== undefined) {
            user.cc_emails = cc_emails;
        }

        await user.save();
        res.status(200).json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error("UpdateSettings Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Xóa tài khoản
exports.deleteAccount = async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;
    try {
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

// @desc    Xác thực tài khoản bằng OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    try {
        const validOtp = await Otp.findOne({
            where: {
                email,
                otp_code: otp,
                expires_at: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!validOtp) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.is_verified = true;
        await user.save();
        await Otp.destroy({ where: { email } });
        res.status(200).json({ message: 'Account verified successfully!' });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Gửi lại mã OTP mới
exports.resendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const user = await User.findOne({
            where: {
                email,
                is_verified: false
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Account not found or is already verified.' });
        }

        await Otp.destroy({ where: { email } });
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.create({
            email: user.email,
            otp_code: otpCode,
            expires_at: expiresAt,
        });
        await sendVerificationEmail(user.email, otpCode);
        res.status(200).json({ message: 'A new OTP has been sent to your email.' });

    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Gửi OTP để quên mật khẩu
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        // Tìm user bằng email
        const user = await User.findOne({ where: { email } });

        // Bảo mật: Kể cả khi không tìm thấy user, vẫn trả về 200
        // để tránh lộ thông tin email nào đã đăng ký.
        if (!user) {
            return res.status(200).json({ message: 'If an account with that email exists, a reset OTP has been sent.' });
        }

        // 2. Xóa tất cả OTP cũ của email này để tránh nhầm lẫn
        await Otp.destroy({ where: { email } });

        // 3. Tạo mã OTP mới (10 phút)
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 4. Lưu OTP mới vào database
        await Otp.create({
            email: user.email,
            otp_code: otpCode,
            expires_at: expiresAt,
        });

        // 5. Gửi email "Password Reset"
        await sendPasswordResetEmail(user.email, otpCode);

        // 6. Trả về thông báo thành công
        res.status(200).json({ message: 'Password reset OTP sent to your email.' });

    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Đặt lại mật khẩu bằng OTP
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    try {
        // 1. Tìm OTP hợp lệ
        const validOtp = await Otp.findOne({
            where: {
                email,
                otp_code: otp,
                expires_at: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!validOtp) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // 2. Tìm thấy OTP hợp lệ -> Tìm user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 3. Băm mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Cập nhật user
        user.password = hashedPassword;
        user.is_verified = true; // Tự động xác thực tài khoản
        await user.save();

        // 5. Xóa OTP đã sử dụng
        await Otp.destroy({ where: { email } });

        res.status(200).json({ message: 'Password has been reset successfully. You can now login.' });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};