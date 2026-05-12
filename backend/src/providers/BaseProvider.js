/**
 * Base OTP Provider Interface
 * All providers must implement these methods.
 */
class BaseProvider {
  constructor(name, apiKey, baseUrl) {
    this.name = name;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Get available balance from provider
   * @returns {Promise<{balance: number, currency: string}>}
   */
  async getBalance() {
    throw new Error(`${this.name}: getBalance() not implemented`);
  }

  /**
   * List available services/products
   * @param {string} countryCode
   * @returns {Promise<Array<{code: string, name: string, price: number, stock: number}>>}
   */
  async listServices(countryCode) {
    throw new Error(`${this.name}: listServices() not implemented`);
  }

  /**
   * Create a new OTP order
   * @param {string} countryCode
   * @param {string} serviceCode
   * @param {string} [operatorCode]
   * @returns {Promise<{orderId: string, phoneNumber: string, status: string}>}
   */
  async createOrder(countryCode, serviceCode, operatorCode) {
    throw new Error(`${this.name}: createOrder() not implemented`);
  }

  /**
   * Get order status and OTP if available
   * @param {string} orderId
   * @returns {Promise<{status: string, otpCode: string|null, phoneNumber: string}>}
   */
  async getOrderStatus(orderId) {
    throw new Error(`${this.name}: getOrderStatus() not implemented`);
  }

  /**
   * Cancel an order
   * @param {string} orderId
   * @returns {Promise<{success: boolean, status: string}>}
   */
  async cancelOrder(orderId) {
    throw new Error(`${this.name}: cancelOrder() not implemented`);
  }

  /**
   * Resend OTP (if provider supports it)
   * @param {string} orderId
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async resendOtp(orderId) {
    throw new Error(`${this.name}: resendOtp() not implemented`);
  }
}

module.exports = BaseProvider;
