// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const User = require('../models/User');
const Otp = require('../models/Otp');
const ReactivationRequest = require('../models/ReactivationRequest');

const { sequelize } = require('../config/db');

const {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendReactivationRequestNotification
} = require('../utils/emailService');

const SECRET = process.env.JWT_SECRET;

// @desc    Đăng ký người dùng mới
exports.register = async (req, res) => {
    const { username, email, phone, password } = req.body;
    const t = await sequelize.transaction();

    try {
        // 1. Kiểm tra username đã tồn tại
        let existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: 'Username already exists.' });
        }

        // 2. Kiểm tra SĐT đã tồn tại
        existingUser = await User.findOne({ where: { phone } });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: 'Phone number is already in use.' });
        }

        // 3. Kiểm tra email đã tồn tại VÀ ĐÃ XÁC THỰC
        existingUser = await User.findOne({ where: { email, is_verified: true } });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: 'Email is already in use.' });
        }

        // 4. Xử lý email đã đăng ký nhưng CHƯA XÁC THỰC
        existingUser = await User.findOne({ where: { email, is_verified: false } });
        if (existingUser) {
            await Otp.destroy({ where: { email }, transaction: t });
            await User.destroy({ where: { id: existingUser.id }, transaction: t });
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
        }, { transaction: t });

        // 7. Tạo mã OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Mã 6 số
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Hết hạn sau 10 phút

        // 8. Lưu OTP vào database
        await Otp.create({
            email: newUser.email,
            otp_code: otpCode,
            expires_at: expiresAt,
        }, { transaction: t });

        // 9. Cam kết giao dịch (dùng hàm Gmail)
        await t.commit();

        // 10. Trả về thông báo thành công
        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.'
        });

        sendVerificationEmail(newUser.email, otpCode).catch(err => {
            console.error(`⚠️ Background email sending error (Register) for ${newUser.email}:`, err.message);
        });


    } catch (error) {
        // Chỉ rollback nếu transaction chưa hoàn tất
        if (!t.finished) {
            await t.rollback();
        }
        console.error("Error during registration:", error);
        res.status(500).json({ message: 'Internal server error, please try again' });
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
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // KIỂM TRA TRẠNG THÁI XÁC THỰC EMAIL
        if (!user.is_verified) {
            return res.status(403).json({
                message: 'Account not verified. Please check your email.',
                code: 'EMAIL_UNVERIFIED', // Mã lỗi tùy chỉnh để Frontend xử lý
                email: user.email
            });
        }

        // KIỂM TRA TRẠNG THÁI ACTIVE
        if (!user.is_active_admin) {
            // Cả hai cột đều false (user không thể tự bật lại)
            return res.status(403).json({
                message: 'Your account has been disabled by the Administrator.',
                code: 'ADMIN_DISABLED', // Mã lỗi cho Admin Lock
                email: user.email
            });
        }

        // Tài khoản bị User tự khóa (is_active: false nhưng is_active_admin: true)
        if (!user.is_active) {
            return res.status(403).json({
                message: 'Your account is currently disabled. Please reactivate it through OTP verification or contact support.',
                code: 'USER_DISABLED', // Mã lỗi cho User Lock
                email: user.email
            });
        }

        // Nếu Active -> Đăng nhập thành công
        const token = jwt.sign({
            id: user.id,
            username: user.username,
            role: user.role
        }, SECRET, { expiresIn: '8h' });
        res.json({ message: 'Login successful', token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};

// @desc      Gửi yêu cầu kích hoạt lại tài khoản
exports.createReactivationRequest = async (req, res) => {
    const { email } = req.body;

    try {
        // Tìm user bằng email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Kiểm tra nếu user không bị khóa bởi admin thì không cần gửi yêu cầu

        if (user.is_active_admin) {
            return res.status(400).json({ message: 'Account is currently active or locked by user.' });
        }

        // Kiểm tra yêu cầu Pending đã tồn tại chưa

        const existingRequest = await ReactivationRequest.findOne({
            where: {
                userId: user.id,
                status: 'Pending'
            }
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'A pending reactivation request already exists for this account.' });
        }

        // Tạo yêu cầu mới
        await ReactivationRequest.create({
            userId: user.id,
            username: user.username,
        });

        // Gửi email thông báo cho Admin
        res.status(201).json({ message: 'Reactivation request sent successfully to the administrator.' });
        sendReactivationRequestNotification(user.username).catch(err => {
            console.error(`⚠️ Background email sending error (Reactivation Request) for ${user.username}:`, err.message);
        });
    } catch (error) {
        console.error("Error creating reactivation request:", error);
        res.status(500).json({ message: 'Internal server error. Could not send request.' });
    }
};

// @desc    Lấy thông tin người dùng hiện tại
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
                'subscriptionTier',
                'subscriptionExpiresAt',
                'role',
                'is_active',
                'is_active_admin'
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

// @desc 	Cập nhật cài đặt
exports.updateSettings = async (req, res) => {
    try {
        const { notificationsEnabled, cc_emails, is_active } = req.body;

        // Validation cho is_active
        if (is_active !== undefined && typeof is_active !== 'boolean') {
            return res.status(400).json({ message: 'Invalid value for is_active' });
        }
        // Validation cho notificationsEnabled
        if (notificationsEnabled !== undefined && typeof notificationsEnabled !== 'boolean') {
            return res.status(400).json({ message: 'Invalid value for notificationsEnabled' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Kiểm tra logic: Chỉ cho phép tự bật lại (is_active = true) nếu không bị Admin khóa
        if (is_active === true && user.is_active_admin === false) {
            return res.status(403).json({ message: 'Cannot reactivate. Account is currently locked by admin.' });
        }

        if (notificationsEnabled !== undefined) {
            user.notificationsEnabled = notificationsEnabled;
        }
        if (cc_emails !== undefined) {
            user.cc_emails = cc_emails;
        }

        // LOGIC CẬP NHẬT is_active (Self-disable/Reactivate)
        if (is_active !== undefined) {
            // Khi người dùng gửi is_active=false hoặc is_active=true (chỉ khi is_active_admin=true)
            user.is_active = is_active;
        }

        await user.save();
        // Trả về cả trạng thái mới (quan trọng cho Frontend)
        res.status(200).json({
            message: 'Settings updated successfully',
            is_active: user.is_active,
            is_active_admin: user.is_active_admin
        });
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

// @desc    Xác thực tài khoản bằng OTP (cả verify tài khoản mới và tái kích hoạt tài khoản đã tồn tại)
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

        // Xác thực email nếu chưa xác thực
        if (!user.is_verified) {
            user.is_verified = true;
        }

        // Kích hoạt lại tài khoản nếu đang bị tự khóa (is_active = false)
        if (user.is_active === false) {
            if (user.is_active_admin === true) {
                user.is_active = true;
            } else {
                return res.status(403).json({ message: 'Account verification successful, but your account is locked by Administrator.' });
            }
        }

        await user.save();
        await Otp.destroy({ where: { email } });

        const token = jwt.sign({
            id: user.id,
            username: user.username,
            role: user.role
        }, SECRET, { expiresIn: '8h' });

        res.status(200).json({
            message: 'Account verified and activated successfully!',
            token, // Frontend sẽ lưu token này và redirect vào Dashboard
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

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
                [Op.or]: [
                    // Trường hợp 1: Chưa verified
                    { is_verified: false },

                    // Trường hợp 2: Đã verified nhưng bị TỰ KHÓA (active=false, active_admin=true)
                    {
                        is_verified: true,
                        is_active: false,
                        is_active_admin: true
                    }
                ]
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Unable to send OTP. Account may be active or permanently locked.' });
        }

        await Otp.destroy({ where: { email } });
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.create({
            email: user.email,
            otp_code: otpCode,
            expires_at: expiresAt,
        });
        res.status(200).json({ message: 'A new OTP is being sent to your email.' });
        sendVerificationEmail(user.email, otpCode).catch(err => {
            console.error(`⚠️ Background Mail Error (ResendOTP) for ${user.email}:`, err.message);
        });
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


        // 5. Trả về thông báo thành công
        res.status(200).json({ message: 'Password reset OTP sent to your email.' });

        // 6. Gửi email chứa OTP
        sendPasswordResetEmail(user.email, otpCode).catch(err => {
            console.error(`⚠️ Background Mail Error (ForgotPassword) for ${user.email}:`, err.message);
        });
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
        user.is_verified = true;

        if (user.is_active === false && user.is_active_admin === true){
            user.is_active = true;
        }

        await user.save();

        // 5. Xóa OTP đã sử dụng
        await Otp.destroy({ where: { email } });

        res.status(200).json({ message: 'Password has been reset successfully. You can now login.' });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};