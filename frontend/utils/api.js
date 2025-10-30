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
        throw new Error(JSON.stringify(data));
    }
    return data;
};

/**
 * Hàm Fetcher chung cho SWR
 */
export const fetcher = (url) => api(url.substring(5));