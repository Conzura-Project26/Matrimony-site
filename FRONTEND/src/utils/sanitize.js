// Basic XSS prevention without external dependencies
export const sanitize = {
    // Sanitize HTML content - Strips all tags for safety in this version
    html: (dirty) => {
        if (!dirty) return '';
        return dirty.replace(/<[^>]*>?/gm, '');
    },

    // Sanitize simple text input
    text: (input) => {
        if (typeof input !== 'string') return input;
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    // Validate Email
    isValidEmail: (email) => {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase());
    },

    // Validate Phone (Indian format)
    isValidPhone: (phone) => {
        const re = /^[6-9]\d{9}$/;
        return re.test(String(phone));
    }
};

export default sanitize;
