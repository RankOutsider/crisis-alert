// frontend/utils/search.js
export function filterByQuery(query, data, fields = []) {
    if (!query) return data;

    // Tách theo OR trước (|)
    const orGroups = query.split('|').map(group => group.trim());

    return data.filter(item => {
        // Một item hợp lệ nếu ít nhất một nhóm OR đúng
        return orGroups.some(group => {
            // Trong mỗi nhóm OR, có thể có nhiều điều kiện AND (&)
            const andTerms = group
                .split('&')
                .map(t => t.trim().toLowerCase())
                .filter(Boolean);

            // Tất cả điều kiện AND phải match ít nhất một field
            return andTerms.every(term =>
                fields.some(field => {
                    const value = item[field];
                    if (!value) return false;

                    // Nếu field là mảng (ví dụ keywords), join lại
                    if (Array.isArray(value)) {
                        return value.some(v => String(v).toLowerCase().includes(term));
                    }

                    return String(value).toLowerCase().includes(term);
                })
            );
        });
    });
}