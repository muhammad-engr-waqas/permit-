const mongoose = require("mongoose");

/**
 * OrderPerson — embedded in Order.
 * Each person has their own form data and their own Permit document ID
 * after successful payment + PDF generation.
 */
const orderPersonSchema = new mongoose.Schema(
  {
    personNumber: { type: Number, required: true },
    formData: { type: Object, required: true },
    permitId: { type: mongoose.Schema.Types.ObjectId, ref: "Permit", default: null },
    pdfStatus: {
      type: String,
      enum: ["LOCKED", "GENERATING", "READY", "FAILED"],
      default: "LOCKED",
    },
  },
  { _id: false }
);

/**
 * Order — one order = one payment = one or more persons.
 * The backend ALWAYS calculates totalAmount = numberOfPersons × pricePerPerson.
 * Frontend-supplied amounts are NEVER trusted.
 */
const orderSchema = new mongoose.Schema(
  {
    // Human-readable order reference, e.g. ORD-20260814-AB3F9
    orderId: { type: String, required: true, unique: true },

    // Optional customer contact (not required for purchase)
    customerEmail: { type: String, trim: true },
    customerPhone: { type: String, trim: true },

    // Persons in this order
    persons: { type: [orderPersonSchema], required: true },
    numberOfPersons: { type: Number, required: true },

    // Pricing — always set by backend
    pricePerPerson: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "SAR" },

    // Payment
    paymentGateway: { type: String, default: "UBL" },
    paymentTransactionId: { type: String, default: null },
    gatewaySessionId: { type: String, default: null },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "EXPIRED", "REFUNDED"],
      default: "PENDING",
    },

    // Overall PDF status for the order
    pdfStatus: {
      type: String,
      enum: ["LOCKED", "GENERATING", "READY", "FAILED"],
      default: "LOCKED",
    },

    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
