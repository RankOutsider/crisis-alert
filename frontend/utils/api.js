// frontend/utils/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Lưu Token sau khi đăng nhập thành công
export const setToken = (token) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('crisisAlertToken', token);
    }
};

// Lấy Token JWT từ Local Storage
export const getToken = () => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('crisisAlertToken');
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
        return null;
    }
    return token;
};

// Xóa Token khi đăng xuất hoặc token hết hạn
export const clearToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('crisisAlertToken');
    }
};

// Hàm chung gọi API
export const api = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Xử lý endpoint để tránh double slash nếu endpoint bắt đầu bằng /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    const response = await fetch(`${API_BASE_URL}/${cleanEndpoint}`, {
        ...options,
        headers,
        body: options.body ? options.body : undefined,
    });

    if (response.status === 401) {
        console.warn('⚠️ Unauthorized! Token invalid or expired.');
        clearToken();

        let errorData = { message: 'Unauthorized (401)' };
        try {
            errorData = await response.json();
        } catch (e) {
            // Bỏ qua nếu body không phải JSON
        }

        if (typeof window !== 'undefined') {
            // Chỉ redirect nếu không phải đang ở trang login để tránh loop
            if (window.location.pathname !== '/login') {
                window.location.replace('/login');
            }
        }

        // Ném lỗi cụ thể
        throw new Error(errorData.message);
    }
    // --- KẾT THÚC SỬA 401 ---

    // Nếu không có nội dung trả về (204)
    if (response.status === 204) {
        return { message: 'No Content' };
    }

    // Đọc JSON data từ response
    let data;
    try {
        data = await response.json();
    } catch (err) {
        console.error("Invalid JSON response from server", err);
        throw new Error('Invalid response from server.');
    }

    if (!response.ok) {
        // Ưu tiên lấy message từ server trả về, nếu không thì lấy stringify của cả data
        const errorMessage = data.message || JSON.stringify(data);

        const error = new Error(errorMessage);

        // Gán thêm các thuộc tính khác cho việc debug
        if (data.code) error.code = data.code;
        if (data.email) error.email = data.email;

        throw error;
    }
    return data;
};

// -------------------------------------------------------------
// Hàm Fetcher chung cho SWR
export const fetcher = (url) => api(url.substring(5));

// --- ADMIN API HELPERS ---
export const swrFetcher = (endpoint) => api(endpoint);


// Lấy danh sách user (Admin only)
export const getAdminUsers = async (page = 1, limit = 10, search = '') => {
    const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search || ''
    }).toString();

    return api(`admin/users?${query}`, {
        method: 'GET'
    });
};

// Admin cập nhật User (đổi Role/Subscription)
export const updateAdminUser = async (id, data) => {
    return api(`admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

// Xóa nhiều Users
export const deleteAdminUsersBulk = async (ids) => {
    return api('admin/users/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids }) // Gửi body: { ids: [1, 2, 3] }
    });
};

// Lấy danh sách Post
export const getAdminPosts = async (page = 1, limit = 10, search = '') => {
    const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search || ''
    }).toString();

    return api(`admin/posts?${query}`, { method: 'GET' });
};

// Xóa Post
export const deleteAdminPost = async (id) => {
    return api(`admin/posts/${id}`, { method: 'DELETE' });
};

// Xóa nhiều Posts
export const deleteAdminPostsBulk = async (ids) => {
    return api('admin/posts/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids })
    });
};

// Lấy danh sách Alert
export const getAdminAlerts = async (page = 1, limit = 10, search = '') => {
    const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search || ''
    }).toString();
    return api(`admin/alerts?${query}`, { method: 'GET' });
};

// Xóa 1 Alert
export const deleteAdminAlert = async (id) => {
    return api(`admin/alerts/${id}`, { method: 'DELETE' });
};

// Xóa nhiều Alerts
export const deleteAdminAlertsBulk = async (ids) => {
    return api('admin/alerts/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids })
    });
};

// Lấy danh sách Case Studies
export const getAdminCaseStudies = async (page = 1, limit = 10, search = '') => {
    const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search || ''
    }).toString();
    return api(`admin/casestudies?${query}`, { method: 'GET' });
};

// Xóa 1 Case Study
export const deleteAdminCaseStudy = async (id) => {
    return api(`admin/casestudies/${id}`, { method: 'DELETE' });
};

// Xóa nhiều Case Studies
export const deleteAdminCaseStudiesBulk = async (ids) => {
    return api('admin/casestudies/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids })
    });
};

// User gửi yêu cầu
export const createSubRequest = async (data) => {
    return api('subscription/request', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

// Admin lấy danh sách
export const getAdminSubRequests = async () => {
    return api('subscription/admin/list', { method: 'GET' });
};

// Admin xử lý (Approve/Reject)
export const handleAdminSubRequest = async (id, status, adminNote = '') => {
    return api(`subscription/admin/${id}/handle`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNote })
    });
};

// Admin xóa yêu cầu
export const deleteAdminSubRequest = async (id) => {
    // Sử dụng hàm api chung thay vì fetch thủ công để tận dụng logic xử lý lỗi/token
    return api(`subscription/admin/${id}`, {
        method: 'DELETE'
    });
};