/**
 * PaymentGateway — Abstract base class.
 *
 * All payment gateways (UBL, HBL, Safepay, etc.) MUST implement this interface.
 * This ensures the order/PDF system is never tightly coupled to a single provider.
 *
 * To add a new gateway:
 *   1. Create a new file in services/payment/ (e.g. hblPaymentService.js)
 *   2. Extend this class and implement all methods
 *   3. Register in paymentService.js getPaymentGateway()
 */
class PaymentGateway {
  /**
   * Create a payment session with the gateway.
   * @param {Object} order - The Order mongoose document
   * @returns {Promise<{ paymentUrl: string, sessionId: string }>}
   */
  async createPayment(order) {
    throw new Error("createPayment() must be implemented by subclass");
  }

  /**
   * Verify a payment transaction with the gateway's server-side API.
   * This must NEVER rely solely on the redirect/callback payload from the browser.
   * @param {string} transactionId - Gateway-issued transaction ID
   * @param {Object} order - The Order mongoose document
   * @returns {Promise<{ verified: boolean, amount: number, currency: string, status: string, raw: Object }>}
   */
  async verifyPayment(transactionId, order) {
    throw new Error("verifyPayment() must be implemented by subclass");
  }

  /**
   * Parse and validate a server-to-server callback payload from the gateway.
   * @param {Object} payload - Raw POST body from the gateway webhook
   * @returns {Promise<{ orderId: string, transactionId: string, status: string, amount: number, currency: string, raw: Object }>}
   */
  async handleCallback(payload) {
    throw new Error("handleCallback() must be implemented by subclass");
  }

  /**
   * Initiate a refund for a paid transaction. (Optional — implement per gateway)
   * @param {string} transactionId
   * @param {number} amount
   * @param {string} reason
   * @returns {Promise<{ success: boolean, refundId: string }>}
   */
  async refundPayment(transactionId, amount, reason) {
    throw new Error("refundPayment() must be implemented by subclass");
  }
}

module.exports = PaymentGateway;
