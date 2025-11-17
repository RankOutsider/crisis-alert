// backend/config/subscriptionPlans.js

// Tên gói, PHẢI KHỚP với ENUM trong User.js
const TIER_NAMES = {
    FREE: 'Free',
    VIP: 'VIP',
    PRO: 'Pro',
};

// Cấu hình chi tiết
const TIER_PLANS = {
    [TIER_NAMES.FREE]: {
        name: 'Free',
        limits: {
            alerts: 5,
            keywords: 10, // 10 keywords mỗi alert
        },
        features: {
            sentimentAnalysis: false,
            caseStudyCreation: false,
            realtimeEmailAlerts: false, // Dựa theo landing page
            pdfExport: false,
            excelExport: false,
        }
    },
    [TIER_NAMES.VIP]: {
        name: 'VIP',
        limits: {
            alerts: 50,
            keywords: 150, // 150 keywords mỗi alert
        },
        features: {
            sentimentAnalysis: true,
            caseStudyCreation: true,
            realtimeEmailAlerts: true,
            pdfExport: true,
            excelExport: false,
        }
    },
    [TIER_NAMES.PRO]: {
        name: 'Pro',
        limits: {
            alerts: 500,
            keywords: 2500, // 2500 keywords mỗi alert
        },
        features: {
            sentimentAnalysis: true,
            caseStudyCreation: true,
            realtimeEmailAlerts: true,
            pdfExport: true,
            excelExport: true,
        }
    }
};

// Sử dụng module.exports thay vì export
module.exports = {
    TIER_NAMES,
    TIER_PLANS,
};