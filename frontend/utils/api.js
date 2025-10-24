// frontend/utils/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Lưu Token sau khi đăng nhập thành công
 */
export const setToken = (token) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('crisisAlertToken', token);
    }
};

/**
 * Lấy Token JWT từ Local Storage
 */
export const getToken = () => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('crisisAlertToken');
    // Trả null nếu token không hợp lệ
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
        return null;
    }
    return token;
};

/**
 * Xóa Token khi đăng xuất hoặc token hết hạn
 */
export const clearToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('crisisAlertToken');
    }
};

/**
 * Hàm chung gọi API
 */
export const api = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...options,
        headers,
        body: options.body ? options.body : undefined,
    });

    // Nếu Token không hợp lệ → logout và chuyển hướng
    if (response.status === 401) {
        console.warn('⚠️ Unauthorized! Token invalid or expired.');
        clearToken();
        if (typeof window !== 'undefined') {
            // Dùng replace để không tạo vòng lặp
            window.location.replace('/login');
        }
        throw new Error('Unauthorized (401)');
    }

    // Nếu không có nội dung trả về (204)
    if (response.status === 204) {
        return { message: 'No Content' };
    }

    let data;
    try {
        data = await response.json();
    } catch (err) {
        data = { message: 'Invalid JSON from server' };
    }

    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
};

export const fetcher = (url) => api(url.substring(5));