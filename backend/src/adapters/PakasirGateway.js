const axios = require('axios');
const BaseGateway = require('./BaseGateway');
const logger = require('../utils/logger');

class PakasirGateway extends BaseGateway {
  constructor(apiKey, slug) {
    super('pakasir');
    this.apiKey = apiKey;
    this.slug = slug;
    this.baseUrl = 'https://app.pakasir.com/api';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createPayment({ reference, amount, customerName, customerEmail, callbackUrl, returnUrl }) {
    try {
      const { data } = await this.client.post('/transactioncreate/qris', {
        project: this.slug,
        order_id: reference,
        amount: Math.round(amount),
        api_key: this.apiKey,
      });

      const payment = data.payment || data;
      return {
        reference,
        paymentUrl: `https://app.pakasir.com/pay/${this.slug}/${Math.round(amount)}?order_id=${reference}&qris_only=1${returnUrl ? '&redirect=' + encodeURIComponent(returnUrl) : ''}`,
        qrUrl: payment.payment_number || '',
        expiresAt: payment.expired_at ? new Date(payment.expired_at) : new Date(Date.now() + 3600000),
        gatewayReference: payment.order_id || reference,
        fee: payment.fee || 0,
      };
    } catch (error) {
      logger.error({ err: error }, 'Pakasir: createPayment failed');
      throw new Error(
        `Pakasir createPayment error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async checkStatus(reference, amount) {
    try {
      const { data } = await this.client.get('/transactiondetail', {
        params: {
          project: this.slug,
          order_id: reference,
          amount: Math.round(amount),
          api_key: this.apiKey,
        },
      });

      const transaction = data.transaction || data;
      return {
        status: this._mapStatus(transaction.status),
        paidAt: transaction.completed_at ? new Date(transaction.completed_at) : null,
      };
    } catch (error) {
      logger.error({ err: error, reference }, 'Pakasir: checkStatus failed');
      throw new Error(`Pakasir checkStatus error: ${error.message}`);
    }
  }

  async cancelPayment(reference, amount) {
    try {
      await this.client.post('/transactioncancel', {
        project: this.slug,
        order_id: reference,
        amount: Math.round(amount),
        api_key: this.apiKey,
      });
      return { success: true };
    } catch (error) {
      logger.error({ err: error, reference }, 'Pakasir: cancelPayment failed');
      throw new Error(`Pakasir cancelPayment error: ${error.message}`);
    }
  }

  validateSignature(payload, signature) {
    if (!payload || !payload.order_id || !payload.amount) {
      return false;
    }
    return payload.project === this.slug;
  }

  parseWebhook(payload) {
    return {
      reference: payload.order_id,
      status: this._mapStatus(payload.status),
      amount: payload.amount,
      paidAt: payload.completed_at ? new Date(payload.completed_at) : null,
    };
  }

  _mapStatus(status) {
    const normalized = (status || '').toLowerCase();
    const statusMap = {
      pending: 'pending',
      waiting: 'pending',
      completed: 'paid',
      success: 'paid',
      paid: 'paid',
      expired: 'expired',
      failed: 'failed',
      cancelled: 'failed',
      refunded: 'refunded',
    };
    return statusMap[normalized] || 'pending';
  }
}

module.exports = PakasirGateway;
