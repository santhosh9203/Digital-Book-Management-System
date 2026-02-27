import api from './api';

const walletService = {
    getBalance: () => api.get('/wallet/balance'),
    credit: (amount, description) => api.post('/wallet/credit', { amount, description }),
    debit: (amount, description) => api.post('/wallet/debit', { amount, description }),
};

export default walletService;
