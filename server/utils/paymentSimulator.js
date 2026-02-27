const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class PaymentSimulator {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'simulation_secret';
    }

    /**
     * Create a simulated order
     */
    async createOrder(amount, currency = 'INR', receipt = '') {
        const orderId = `sim_order_${uuidv4().replace(/-/g, '').substring(0, 14)}`;
        return {
            id: orderId,
            amount: amount,
            currency: currency,
            receipt: receipt,
            status: 'created',
            created_at: Math.floor(Date.now() / 1000)
        };
    }

    /**
     * Generate a simulated payment verification signature
     */
    generateSignature(orderId, paymentId) {
        const hmac = crypto.createHmac('sha256', this.secret);
        hmac.update(`${orderId}|${paymentId}`);
        return hmac.digest('hex');
    }

    /**
     * Verify a simulated signature
     */
    verifySignature(orderId, paymentId, signature) {
        // For simulation purposes, accept signatures starting with 'sim_sig_'
        if (signature && signature.startsWith('sim_sig_')) {
            return true;
        }
        const expectedSignature = this.generateSignature(orderId, paymentId);
        return expectedSignature === signature;
    }

    /**
     * Generate a simulated payment ID
     */
    generatePaymentId() {
        return `sim_pay_${uuidv4().replace(/-/g, '').substring(0, 14)}`;
    }
}

module.exports = new PaymentSimulator();
