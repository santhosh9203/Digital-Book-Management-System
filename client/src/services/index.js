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
    download: (id) =>
        api.get(`/books/${id}/download`, { responseType: 'blob' }),
};

export const orderService = {
    createOrder: (book_id) => api.post('/orders/create-order', { book_id }),
    verifyPayment: (data) => api.post('/orders/verify', data),
    getMyOrders: () => api.get('/orders/my-orders'),
};

export const adminService = {
    getDashboard: () => api.get('/admin/dashboard'),
    getUsers: () => api.get('/admin/users'),
    getOrders: () => api.get('/admin/orders'),
    getBooks: () => api.get('/admin/books'),
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
    credit: (amount, description) => api.post('/wallet/credit', { amount, description }),
    debit: (amount, description) => api.post('/wallet/debit', { amount, description }),
};
