const axios = require('axios');
const crypto = require('crypto');
const BaseGateway = require('./BaseGateway');
const logger = require('../utils/logger');

class TripayGateway extends BaseGateway {
  constructor(apiKey, privateKey, merchantCode, mode = 'sandbox') {
    super('tripay');
    this.apiKey = apiKey;
    this.privateKey = privateKey;
    this.merchantCode = merchantCode;
    this.baseUrl =
      mode === 'production'
        ? 'https://tripay.co.id/api'
        : 'https://tripay.co.id/api-sandbox';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      timeout: 30000,
    });
  }

  async createPayment({ reference, amount, customerName, customerEmail, callbackUrl, returnUrl }) {
    try {
      const signature = crypto
        .createHmac('sha256', this.privateKey)
        .update(this.merchantCode + reference + amount)
        .digest('hex');

      const { data } = await this.client.post('/transaction/create', {
        method: 'QRIS',
        merchant_ref: reference,
        amount,
        customer_name: customerName,
        customer_email: customerEmail,
        order_items: [
          {
            name: 'Deposit Saldo',
            price: amount,
            quantity: 1,
          },
        ],
        callback_url: callbackUrl,
        return_url: returnUrl,
        expired_time: Math.floor(Date.now() / 1000) + 3600,
        signature,
      });

      const trx = data.data;
      return {
        reference,
        paymentUrl: trx.checkout_url,
        qrUrl: trx.qr_url,
        expiresAt: new Date(trx.expired_time * 1000),
        gatewayReference: trx.reference,
        fee: trx.total_fee || 0,
      };
    } catch (error) {
      logger.error({ err: error }, 'Tripay: createPayment failed');
      throw new Error(
        `Tripay createPayment error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async checkStatus(reference) {
    try {
      const { data } = await this.client.get('/transaction/detail', {
        params: { reference },
      });

      const trx = data.data;
      return {
        status: this._mapStatus(trx.status),
        paidAt: trx.paid_at ? new Date(trx.paid_at * 1000) : null,
      };
    } catch (error) {
      logger.error({ err: error, reference }, 'Tripay: checkStatus failed');
      throw new Error(`Tripay checkStatus error: ${error.message}`);
    }
  }

  validateSignature(payload, signature) {
    const computedSignature = crypto
      .createHmac('sha256', this.privateKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    return computedSignature === signature;
  }

  parseWebhook(payload) {
    return {
      reference: payload.merchant_ref,
      status: this._mapStatus(payload.status),
      amount: payload.total_amount,
      paidAt: payload.paid_at ? new Date(payload.paid_at * 1000) : null,
    };
  }

  _mapStatus(status) {
    const statusMap = {
      UNPAID: 'pending',
      PAID: 'paid',
      EXPIRED: 'expired',
      FAILED: 'failed',
      REFUND: 'refunded',
    };
    return statusMap[status] || 'pending';
  }
}

module.exports = TripayGateway;
