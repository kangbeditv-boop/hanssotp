const axios = require('axios');
const crypto = require('crypto');
const BaseGateway = require('./BaseGateway');
const logger = require('../utils/logger');

class QrispyGateway extends BaseGateway {
  constructor(apiKey, merchantId) {
    super('qrispy');
    this.apiKey = apiKey;
    this.merchantId = merchantId;
    this.baseUrl = 'https://api.qrispy.com/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createPayment({ reference, amount, customerName, customerEmail, callbackUrl, returnUrl }) {
    try {
      const { data } = await this.client.post('/payment/create', {
        merchant_id: this.merchantId,
        reference,
        amount,
        customer_name: customerName,
        customer_email: customerEmail,
        payment_method: 'QRIS',
        callback_url: callbackUrl,
        return_url: returnUrl,
        expiry_minutes: 60,
      });

      const payment = data.data || data;
      return {
        reference,
        paymentUrl: payment.payment_url || payment.checkout_url || '',
        qrUrl: payment.qr_url || payment.qr_image || '',
        expiresAt: payment.expires_at ? new Date(payment.expires_at) : new Date(Date.now() + 3600000),
        gatewayReference: payment.transaction_id || payment.id || '',
        fee: payment.fee || 0,
      };
    } catch (error) {
      logger.error({ err: error }, 'QRISPY: createPayment failed');
      throw new Error(
        `QRISPY createPayment error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async checkStatus(reference) {
    try {
      const { data } = await this.client.get(`/payment/status/${reference}`);
      const payment = data.data || data;
      return {
        status: this._mapStatus(payment.status),
        paidAt: payment.paid_at ? new Date(payment.paid_at) : null,
      };
    } catch (error) {
      logger.error({ err: error, reference }, 'QRISPY: checkStatus failed');
      throw new Error(`QRISPY checkStatus error: ${error.message}`);
    }
  }

  validateSignature(payload, signature) {
    const computedSignature = crypto
      .createHmac('sha256', this.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    return computedSignature === signature;
  }

  parseWebhook(payload) {
    return {
      reference: payload.reference || payload.merchant_ref,
      status: this._mapStatus(payload.status),
      amount: payload.amount || payload.total_amount,
      paidAt: payload.paid_at ? new Date(payload.paid_at) : null,
    };
  }

  _mapStatus(status) {
    const normalized = (status || '').toLowerCase();
    const statusMap = {
      pending: 'pending',
      unpaid: 'pending',
      paid: 'paid',
      success: 'paid',
      expired: 'expired',
      failed: 'failed',
      refunded: 'refunded',
    };
    return statusMap[normalized] || 'pending';
  }
}

module.exports = QrispyGateway;
