const axios = require('axios');
const BaseGateway = require('./BaseGateway');
const logger = require('../utils/logger');

class PakasirGateway extends BaseGateway {
  constructor(project, netKey, mode = 'sandbox') {
    super('pakasir');
    this.project = project;
    this.netKey = netKey;
    this.baseUrl = 'https://app.pakasir.com/api/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
    this.mode = mode;
  }

  async createPayment({ reference, amount, customerName, customerEmail, callbackUrl, returnUrl }) {
    try {
      const { data } = await this.client.post('/transaction/create', {
        project: this.project,
        order_id: reference,
        amount,
        net_key: this.netKey,
      });

      const trx = data.payment || data.data || data;
      return {
        reference,
        paymentUrl: trx.payment_url || trx.checkout_url || '',
        qrUrl: trx.qr_url || trx.qr_string || '',
        expiresAt: trx.expires_at
          ? new Date(trx.expires_at)
          : new Date(Date.now() + 3600000),
        gatewayReference: trx.transaction_id || trx.id || reference,
        fee: trx.fee || 0,
      };
    } catch (error) {
      logger.error({ err: error }, 'Pakasir: createPayment failed');
      throw new Error(
        `Pakasir createPayment error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async checkStatus(reference) {
    try {
      const { data } = await this.client.get('/transaction/detail', {
        params: {
          project: this.project,
          order_id: reference,
          net_key: this.netKey,
        },
      });

      const trx = data.transaction || data.data || data;
      return {
        status: this._mapStatus(trx.status),
        paidAt: trx.payment_at ? new Date(trx.payment_at) : null,
      };
    } catch (error) {
      logger.error({ err: error, reference }, 'Pakasir: checkStatus failed');
      throw new Error(`Pakasir checkStatus error: ${error.message}`);
    }
  }

  validateSignature(payload, signature) {
    if (!payload || !payload.order_id) return false;
    return true;
  }

  parseWebhook(payload) {
    return {
      reference: payload.order_id,
      status: this._mapStatus(payload.status),
      amount: payload.amount,
      paidAt: payload.payment_at ? new Date(payload.payment_at) : null,
    };
  }

  async cancelTransaction(reference) {
    try {
      const { data } = await this.client.post('/transaction/cancel', {
        project: this.project,
        order_id: reference,
        net_key: this.netKey,
      });
      return { success: data.success !== false, message: data.message || 'Transaction cancelled' };
    } catch (error) {
      logger.error({ err: error, reference }, 'Pakasir: cancelTransaction failed');
      throw new Error(`Pakasir cancelTransaction error: ${error.message}`);
    }
  }

  async simulatePayment(reference) {
    if (this.mode !== 'sandbox') {
      throw new Error('Payment simulation is only available in sandbox mode');
    }

    try {
      const { data } = await this.client.post('/payment/simulate', {
        project: this.project,
        order_id: reference,
        net_key: this.netKey,
      });
      return { success: data.success !== false, message: data.message || 'Payment simulated' };
    } catch (error) {
      logger.error({ err: error, reference }, 'Pakasir: simulatePayment failed');
      throw new Error(`Pakasir simulatePayment error: ${error.message}`);
    }
  }

  _mapStatus(status) {
    const normalized = (status || '').toLowerCase();
    const statusMap = {
      unpaid: 'pending',
      pending: 'pending',
      completed: 'paid',
      paid: 'paid',
      success: 'paid',
      expired: 'expired',
      failed: 'failed',
      cancelled: 'failed',
      refunded: 'refunded',
    };
    return statusMap[normalized] || 'pending';
  }
}

module.exports = PakasirGateway;
