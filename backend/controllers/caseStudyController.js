// backend/controllers/caseStudyController.js
const { Op } = require('sequelize');
const { CaseStudy, Alert, Post } = require('../models/associations');

// @desc    Lấy tất cả Case Studies của người dùng (có tìm kiếm và phân trang)
exports.getAllCaseStudies = async (req, res) => {
    try {
        const userId = req.user.id;
        const { search, fields, page = 1, limit = 6 } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const whereCondition = { userId: userId };

        if (search && fields) {
            const searchTerm = search.toLowerCase().trim();
            const searchFields = fields.split(',');
            if (searchTerm && searchFields.length > 0) {
                const validFields = ['title', 'summary'];
                const orConditions = searchFields
                    .filter(field => validFields.includes(field))
                    .map(field => ({ [field]: { [Op.like]: `%${searchTerm}%` } }));
                if (orConditions.length > 0) {
                    whereCondition[Op.or] = orConditions;
                }
            }
        }

        const { count, rows } = await CaseStudy.findAndCountAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit, 10),
            offset: offset,
        });

        res.status(200).json({
            caseStudies: rows,
            totalPages: Math.ceil(count / parseInt(limit, 10)),
            currentPage: parseInt(page, 10)
        });
    } catch (error) {
        console.error("Error fetching case studies:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Lấy chi tiết một Case Study
exports.getCaseStudyById = async (req, res) => {
    try {
        const caseStudy = await CaseStudy.findOne({
            where: { id: req.params.id, userId: req.user.id },
            include: [
                { model: Alert, attributes: ['id', 'keywords'] },
                {
                    model: Post,
                    through: { attributes: [] }, // Quan trọng
                    order: [['publishedAt', 'DESC']]
                }
            ]
        });
        if (!caseStudy) return res.status(404).json({ message: "Case study not found" });
        res.status(200).json(caseStudy);
    } catch (error) {
        console.error("Error fetching case study details:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Tạo một Case Study mới từ một Alert
exports.createCaseStudyFromAlert = async (req, res) => {
    const { alertId, title, description } = req.body;
    const userId = req.user.id;
    if (!alertId) return res.status(400).json({ message: "Alert ID is required" });

    try {
        const alert = await Alert.findOne({
            where: { id: alertId, userId: userId },
            include: Post // Lấy luôn các post liên quan
        });
        if (!alert) return res.status(404).json({ message: "Alert not found" });

        const existingCaseStudy = await CaseStudy.findOne({ where: { alertId: alertId } });
        if (existingCaseStudy) return res.status(400).json({ message: "Case study already exists" });

        const posts = alert.Posts || [];
        let dateRange = 'N/A';
        if (posts.length > 0) {
            const sortedPosts = [...posts].sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
            const startDate = new Date(sortedPosts[0].publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const endDate = new Date(sortedPosts[sortedPosts.length - 1].publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            dateRange = (startDate === endDate) ? startDate : `${startDate} - ${endDate}`;
        }

        const newCaseStudy = await CaseStudy.create({
            title: title || alert.title,
            summary: description || alert.description,
            postCount: posts.length,
            dateRange: dateRange,
            userId: userId,
            alertId: alertId
        });

        // Liên kết các posts vào case study mới
        if (posts.length > 0) {
            await newCaseStudy.addPosts(posts);
        }

        res.status(201).json({ message: 'Case Study created successfully!', caseStudy: newCaseStudy });
    } catch (error) {
        console.error("Error creating case study:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateCaseStudyStatus = async (req, res) => {
    const { status } = req.body;
    const caseStudyId = req.params.id;
    const userId = req.user.id;

    if (!status || !['Resolved', 'Unresolved'].includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
    }
    try {
        const caseStudy = await CaseStudy.findOne({ where: { id: caseStudyId, userId: userId } });
        if (!caseStudy) {
            return res.status(404).json({ message: "Case study not found." });
        }
        caseStudy.status = status;
        await caseStudy.save();
        res.status(200).json(caseStudy);
    } catch (error) {
        console.error("Error updating case study status:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteCaseStudy = async (req, res) => {
    try {
        const caseStudy = await CaseStudy.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!caseStudy) {
            return res.status(404).json({ message: "Case study not found" });
        }
        await caseStudy.destroy();
        res.status(200).json({ message: "Case study deleted successfully" });
    } catch (error) {
        console.error("Error deleting case study:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Tạo nhiều Case Study từ một danh sách Alert ID
exports.createBulkCaseStudies = async (req, res) => {
    const { alertIds } = req.body;
    const userId = req.user.id;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
        return res.status(400).json({ message: "An array of alertIds is required." });
    }

    let createdCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const alertId of alertIds) {
        try {
            // Kiểm tra xem case study đã tồn tại chưa
            const existingCaseStudy = await CaseStudy.findOne({ where: { alertId: alertId } });
            if (existingCaseStudy) {
                skippedCount++;
                continue; // Bỏ qua nếu đã tồn tại
            }

            const alert = await Alert.findOne({
                where: { id: alertId, userId: userId },
                include: Post
            });

            if (!alert) {
                errors.push(`Alert with ID ${alertId} not found or permission denied.`);
                continue;
            }

            const posts = alert.Posts || [];
            let dateRange = 'N/A';
            if (posts.length > 0) {
                const sortedPosts = [...posts].sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
                const startDate = new Date(sortedPosts[0].publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                const endDate = new Date(sortedPosts[sortedPosts.length - 1].publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                dateRange = (startDate === endDate) ? startDate : `${startDate} - ${endDate}`;
            }

            const newCaseStudy = await CaseStudy.create({
                title: `Case Study: ${alert.title}`,
                summary: alert.description,
                postCount: posts.length,
                dateRange: dateRange,
                userId: userId,
                alertId: alertId
            });

            if (posts.length > 0) {
                await newCaseStudy.addPosts(posts);
            }
            createdCount++;
        } catch (error) {
            errors.push(`Failed to create case study for Alert ID ${alertId}: ${error.message}`);
        }
    }

    res.status(201).json({
        message: `Process complete. Created: ${createdCount}, Skipped: ${skippedCount}.`,
        errors: errors
    });
};