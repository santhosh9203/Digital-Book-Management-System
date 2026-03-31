import api from './api';

export const authService = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

export const bookService = {
    getAll: (params) => api.get('/books', { params }),
    getById: (id) => api.get(`/books/${id}`),
    getCategories: () => api.get('/books/categories'),
    getCoverUrl: (id) => `/api/books/${id}/cover`,
};

export const orderService = {
    createOrder: (data) => api.post('/orders/create-order', data),
    verifyPayment: (data) => api.post('/orders/verify', data),
    getMyOrders: () => api.get('/orders/my-orders'),
    cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
    returnOrder: (id) => api.patch(`/orders/${id}/return`),
};

export const adminService = {
    getDashboard: () => api.get('/admin/dashboard'),
    getUsers: () => api.get('/admin/users'),
    getOrders: () => api.get('/admin/orders'),
    getBooks: () => api.get('/admin/books'),
    updateOrderStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
    addBook: (formData) =>
        api.post('/admin/books', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateBook: (id, formData) =>
        api.put(`/admin/books/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteBook: (id) => api.delete(`/admin/books/${id}`),
};

export const walletService = {
    getBalance: () => api.get('/wallet/balance'),
    getTransactions: () => api.get('/wallet/transactions'),
    credit: (amount, description, password) => api.post('/wallet/credit', { amount, description, password }),
    debit: (amount, description) => api.post('/wallet/debit', { amount, description }),
};

export const notificationService = {
    getNotifications: () => api.get('/notifications'),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
};

export const userService = {
    getTransactionPasswordStatus: () => api.get('/users/transaction-password/status'),
    setTransactionPassword: (data) => api.put('/users/transaction-password', data),
    requestTransactionPasswordReset: () => api.post('/users/transaction-password/forgot'),
    resetTransactionPassword: (data) => api.post('/users/transaction-password/reset', data),
};

export const reviewService = {
    getBookReviews: (bookId) => api.get(`/reviews/book/${bookId}`),
    getEligibility: (bookId) => api.get(`/reviews/eligibility/${bookId}`),
    createReview: (data) => api.post('/reviews', data),
};
