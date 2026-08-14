const mongoose = require("mongoose");

/**
 * PaymentTransaction — one document per callback/event received from the gateway.
 * Used for audit trail and idempotency checking.
 * NEVER store raw card data here.
 */
const paymentTransactionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, index: true },
    gateway: { type: String, required: true, default: "UBL" },
    transactionId: { type: String, default: null }, // gateway-assigned transaction ID
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
    status: { type: String, required: true }, // e.g. 'SUCCESS', 'FAILED', 'PENDING'
    // Sanitized gateway response — no card numbers, CVV, or secret keys
    gatewayResponse: { type: Object, default: {} },
    source: { type: String, default: "callback" }, // 'callback' | 'return' | 'manual'
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
