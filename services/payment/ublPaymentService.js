/**
 * UBLPaymentService.js — UBL E-Commerce Payment Gateway implementation.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  IMPORTANT — INTEGRATION STUB                                           ║
 * ║                                                                          ║
 * ║  The exact API endpoint, authentication method (HMAC/signature scheme), ║
 * ║  request payload fields, and callback parameters MUST be taken from     ║
 * ║  the OFFICIAL UBL merchant integration documentation provided after      ║
 * ║  merchant onboarding.                                                   ║
 * ║                                                                          ║
 * ║  Methods marked [STUB — REPLACE WITH REAL UBL API] below contain        ║
 * ║  placeholder logic. Replace each one with the real UBL API calls        ║
 * ║  once you receive:                                                       ║
 * ║    • Merchant credentials (MerchantID, APIKey, SecretKey, TerminalID)  ║
 * ║    • Official API reference / Postman collection                        ║
 * ║    • Sandbox test card numbers                                           ║
 * ║                                                                          ║
 * ║  Environment variables required (set in .env):                          ║
 * ║    UBL_MERCHANT_ID, UBL_API_KEY, UBL_SECRET_KEY, UBL_TERMINAL_ID       ║
 * ║    UBL_RETURN_URL, UBL_CALLBACK_URL, UBL_ENVIRONMENT, UBL_GATEWAY_URL  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * UBL officially supports:
 *  - International Visa/Mastercard payments
 *  - 3D Secure (3DS)
 *  - REST API integration
 *  - Redirect / inline checkout
 */

const PaymentGateway = require("./paymentGateway");
const crypto = require("crypto");

class UBLPaymentGateway extends PaymentGateway {
  constructor() {
    super();
    this.merchantId = process.env.UBL_MERCHANT_ID;
    this.apiKey = process.env.UBL_API_KEY;
    this.secretKey = process.env.UBL_SECRET_KEY;
    this.terminalId = process.env.UBL_TERMINAL_ID;
    this.returnUrl = process.env.UBL_RETURN_URL;
    this.callbackUrl = process.env.UBL_CALLBACK_URL;
    this.environment = process.env.UBL_ENVIRONMENT || "sandbox";
    this.gatewayUrl = process.env.UBL_GATEWAY_URL || "";
  }

  /**
   * [STUB — REPLACE WITH REAL UBL API]
   *
   * Generate a HMAC-SHA256 signature for the request payload.
   * The exact signature algorithm (field order, separator, key) MUST be taken
   * from the official UBL integration guide.
   *
   * @param {Object} fields - Key-value pairs to sign (order matters per UBL docs)
   * @returns {string} hex signature
   */
  _generateSignature(fields) {
    const signString = Object.values(fields).join("|") + "|" + this.secretKey;
    return crypto.createHmac("sha256", this.secretKey || "stub-secret").update(signString).digest("hex");
  }

  /**
   * [STUB — REPLACE WITH REAL UBL API]
   *
   * Create a payment session with UBL and return the checkout URL.
   *
   * Real implementation should:
   *   POST to UBL_GATEWAY_URL/payment/initiate (or actual UBL endpoint from docs)
   *   with merchantId, orderId, amount, currency, returnUrl, callbackUrl, signature
   *   and receive a sessionId / paymentUrl in response.
   *
   * @param {Object} order - Order mongoose document
   * @returns {Promise<{ paymentUrl: string, sessionId: string }>}
   */
  async createPayment(order) {
    console.log(`[UBL] createPayment called for order: ${order.orderId}, amount: ${order.totalAmount} ${order.currency}`);

    // ── SANDBOX STUB ─────────────────────────────────────────────────────────
    // In sandbox mode, return the UBL card details checkout page
    if (this.environment === "sandbox" || !this.gatewayUrl) {
      console.warn("[UBL] SANDBOX MODE — Using UBL checkout experience page. Replace with real UBL API.");
      const stubSessionId = "stub-session-" + Date.now();
      const paymentUrl = `/payment-checkout.html?orderId=${order.orderId}&sessionId=${stubSessionId}&amount=${order.totalAmount}&currency=${order.currency}`;
      return { paymentUrl, sessionId: stubSessionId };
    }

    // ── REAL UBL API CALL ──────────────────────────────────────────────────
    // TODO: Replace with actual UBL API call per official documentation.
    throw new Error("[UBL] Real gateway URL not configured. Set UBL_GATEWAY_URL in .env with the official UBL endpoint.");
  }

  /**
   * [STUB — REPLACE WITH REAL UBL API]
   *
   * Verify a payment transaction by calling UBL's server-side status/inquiry API.
   * This MUST be called server-side — never trust browser redirect params alone.
   *
   * @param {string} transactionId - Transaction ID from UBL callback
   * @param {Object} order - Order document
   * @returns {Promise<{ verified: boolean, amount: number, currency: string, status: string, raw: Object }>}
   */
  async verifyPayment(transactionId, order) {
    console.log(`[UBL] verifyPayment called for transactionId: ${transactionId}, order: ${order.orderId}`);

    // ── SANDBOX STUB ─────────────────────────────────────────────────────────
    if (this.environment === "sandbox") {
      console.warn("[UBL] SANDBOX MODE — Auto-approving payment verification. Replace with real UBL inquiry API.");
      return {
        verified: true,
        amount: order.totalAmount,
        currency: order.currency,
        status: "SUCCESS",
        raw: { sandbox: true, transactionId, orderId: order.orderId },
      };
    }

    // ── REAL UBL INQUIRY API ───────────────────────────────────────────────
    throw new Error("[UBL] Real verification not configured. Implement using official UBL inquiry API.");
  }

  /**
   * [STUB — REPLACE WITH REAL UBL API]
   *
   * Parse the server-to-server callback (webhook) POST from UBL.
   * The exact field names in the payload MUST be taken from the UBL integration docs.
   *
   * @param {Object} payload - Raw POST body from UBL
   * @returns {Promise<{ orderId: string, transactionId: string, status: string, amount: number, currency: string, raw: Object }>}
   */
  async handleCallback(payload) {
    console.log("[UBL] handleCallback called with payload:", JSON.stringify(payload));

    if (this.environment === "sandbox") {
      return {
        orderId: payload.orderId,
        transactionId: payload.transactionId || ("TXN-" + Date.now()),
        status: payload.status || "SUCCESS",
        amount: parseFloat(payload.amount || 0),
        currency: payload.currency || "SAR",
        raw: payload,
      };
    }

    throw new Error("[UBL] Real callback parsing not implemented. Implement using official UBL callback field specification.");
  }

  /**
   * [STUB — REPLACE WITH REAL UBL API]
   * Initiate a refund for a paid transaction.
   */
  async refundPayment(transactionId, amount, reason) {
    console.log(`[UBL] refundPayment called: ${transactionId}, amount: ${amount}`);
    throw new Error("[UBL] Refund not implemented. Implement using official UBL refund API.");
  }
}

module.exports = UBLPaymentGateway;
