/**
 * Base Payment Gateway Interface
 */
class BaseGateway {
  constructor(name) {
    this.name = name;
  }

  /**
   * Create a payment/deposit request
   * @param {Object} params
   * @param {string} params.reference - Unique reference ID
   * @param {number} params.amount - Amount in IDR
   * @param {string} params.customerName
   * @param {string} params.customerEmail
   * @param {string} params.callbackUrl
   * @param {string} params.returnUrl
   * @returns {Promise<{reference: string, paymentUrl: string, qrUrl: string, expiresAt: Date, gatewayReference: string, fee: number}>}
   */
  async createPayment(params) {
    throw new Error(`${this.name}: createPayment() not implemented`);
  }

  /**
   * Check payment status
   * @param {string} reference
   * @returns {Promise<{status: string, paidAt: Date|null}>}
   */
  async checkStatus(reference) {
    throw new Error(`${this.name}: checkStatus() not implemented`);
  }

  /**
   * Validate webhook signature
   * @param {Object} payload
   * @param {string} signature
   * @returns {boolean}
   */
  validateSignature(payload, signature) {
    throw new Error(`${this.name}: validateSignature() not implemented`);
  }

  /**
   * Parse webhook payload
   * @param {Object} payload
   * @returns {{reference: string, status: string, amount: number, paidAt: Date|null}}
   */
  parseWebhook(payload) {
    throw new Error(`${this.name}: parseWebhook() not implemented`);
  }
}

module.exports = BaseGateway;
