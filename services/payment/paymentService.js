/**
 * paymentService.js — Gateway factory & orchestration layer.
 *
 * Usage:
 *   const { getPaymentGateway } = require('./paymentService');
 *   const gateway = getPaymentGateway(); // returns active gateway
 *   const { paymentUrl } = await gateway.createPayment(order);
 *
 * To add HBL or Safepay later:
 *   1. Create HBLPaymentGateway in hblPaymentService.js
 *   2. Register it here in the GATEWAYS map
 *   3. Set PAYMENT_GATEWAY=HBL in .env
 */

const UBLPaymentGateway = require("./ublPaymentService");

// ── Registry of available gateways ──────────────────────────────────────────
// Add new gateway classes here as they become available
const GATEWAYS = {
  UBL: UBLPaymentGateway,
  // HBL: HBLPaymentGateway,       // Uncomment when HBL integration is ready
  // SAFEPAY: SafepayPaymentGateway, // Uncomment when Safepay is ready
};

// ── Price configuration ──────────────────────────────────────────────────────
const PRICE_PER_PERSON = parseFloat(process.env.PRICE_PER_PERSON) || 22.35;
const PAYMENT_CURRENCY = process.env.PAYMENT_CURRENCY || "SAR";

/**
 * Returns an instantiated gateway based on PAYMENT_GATEWAY env var.
 * Defaults to UBL.
 * @returns {import('./paymentGateway')} Gateway instance
 */
function getPaymentGateway(name) {
  const gatewayName = (name || process.env.PAYMENT_GATEWAY || "UBL").toUpperCase();
  const GatewayClass = GATEWAYS[gatewayName];
  if (!GatewayClass) {
    throw new Error(`Payment gateway "${gatewayName}" is not registered. Available: ${Object.keys(GATEWAYS).join(", ")}`);
  }
  return new GatewayClass();
}

/**
 * Backend-side price calculation.
 * ALWAYS use this — never trust amounts from frontend.
 * @param {number} numberOfPersons
 * @returns {{ totalAmount: number, pricePerPerson: number, currency: string }}
 */
function calculateOrderAmount(numberOfPersons) {
  if (!numberOfPersons || numberOfPersons < 1) {
    throw new Error("Number of persons must be at least 1");
  }
  const totalAmount = Math.round(numberOfPersons * PRICE_PER_PERSON * 100) / 100;
  return {
    totalAmount,
    pricePerPerson: PRICE_PER_PERSON,
    currency: PAYMENT_CURRENCY,
  };
}

module.exports = { getPaymentGateway, calculateOrderAmount, PRICE_PER_PERSON, PAYMENT_CURRENCY };
