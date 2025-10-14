const CaseStudy = require('../models/CaseStudy');
const Alert = require('../models/Alert');
const Post = require('../models/Post');

// @desc    Lấy tất cả Case Studies của người dùng
// @route   GET /api/casestudies
// @access  Private
exports.getAllCaseStudies = async (req, res) => {
    try {
        const caseStudies = await CaseStudy.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json(caseStudies);
    } catch (error) {
        console.error("Error fetching case studies:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Tạo một Case Study mới từ một Alert
// @route   POST /api/casestudies
// @access  Private
exports.createCaseStudyFromAlert = async (req, res) => {
    const { alertId, summary } = req.body; // Bỏ 'status' ra khỏi đây
    const userId = req.user.id;

    if (!alertId) {
        return res.status(400).json({ message: "Alert ID is required" });
    }

    try {
        const alert = await Alert.findOne({ where: { id: alertId, userId: userId } });
        if (!alert) {
            return res.status(404).json({ message: "Alert not found or you don't have permission" });
        }

        const existingCaseStudy = await CaseStudy.findOne({ where: { alertId: alertId } });
        if (existingCaseStudy) {
            return res.status(400).json({ message: "A case study for this alert already exists" });
        }

        const posts = await Post.findAll({
            where: { alertId: alertId },
            order: [['publishedAt', 'ASC']],
            attributes: ['publishedAt']
        });

        let dateRange = 'N/A';
        if (posts.length > 0) {
            const startDate = new Date(posts[0].publishedAt);
            const endDate = new Date(posts[posts.length - 1].publishedAt);

            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            const formattedStartDate = startDate.toLocaleDateString('en-US', options);
            const formattedEndDate = endDate.toLocaleDateString('en-US', options);

            if (formattedStartDate === formattedEndDate) {
                dateRange = formattedStartDate;
            } else {
                dateRange = `${formattedStartDate} - ${formattedEndDate}`;
            }
        }

        const newCaseStudy = await CaseStudy.create({
            title: alert.title,
            summary: summary || alert.description,
            postCount: alert.postCount,
            dateRange: dateRange,
            // Không cần 'status' ở đây nữa, model sẽ tự động đặt là 'Unresolved'
            userId: userId,
            alertId: alertId
        });

        res.status(201).json(newCaseStudy);

    } catch (error) {
        console.error("Error creating case study:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// === HÀM MỚI ĐỂ CẬP NHẬT TRẠNG THÁI ===
// @desc    Cập nhật trạng thái của một Case Study
// @route   PUT /api/casestudies/:id/status
// @access  Private
exports.updateCaseStudyStatus = async (req, res) => {
    const { status } = req.body;
    const caseStudyId = req.params.id;
    const userId = req.user.id;

    if (!status || (status !== 'Resolved' && status !== 'Unresolved')) {
        return res.status(400).json({ message: "Invalid status. Must be 'Resolved' or 'Unresolved'." });
    }

    try {
        const caseStudy = await CaseStudy.findOne({ where: { id: caseStudyId, userId: userId } });

        if (!caseStudy) {
            return res.status(404).json({ message: "Case study not found or you don't have permission." });
        }

        caseStudy.status = status;
        await caseStudy.save();

        res.status(200).json(caseStudy);
    } catch (error) {
        console.error("Error updating case study status:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// @desc    Lấy chi tiết một Case Study
// @route   GET /api/casestudies/:id
// @access  Private
exports.getCaseStudyById = async (req, res) => {
    try {
        const caseStudy = await CaseStudy.findOne({
            where: { id: req.params.id, userId: req.user.id },
            include: {
                model: Alert,
                attributes: ['id', 'keywords', 'platforms']
            }
        });

        if (!caseStudy) {
            return res.status(404).json({ message: "Case study not found" });
        }

        const posts = await Post.findAll({
            where: { alertId: caseStudy.alertId },
            order: [['publishedAt', 'DESC']]
        });

        const result = { ...caseStudy.toJSON(), posts };
        res.status(200).json(result);

    } catch (error) {
        console.error("Error fetching case study details:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Xóa một Case Study
// @route   DELETE /api/casestudies/:id
// @access  Private
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