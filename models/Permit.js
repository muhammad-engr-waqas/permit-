const mongoose = require("mongoose");

/**
 * One document = one permit notice.
 * Field names mirror the sections in the sample PDF:
 * Laborer Information, Provider Information, Beneficiary Information, Permit Information.
 */
const permitSchema = new mongoose.Schema(
  {
    // ----- Laborer Information / بيانات العامل -----
    laborerNameEn: { type: String, required: true, trim: true },
    laborerNameAr: { type: String, trim: true }, // optional Arabic name
    occupationEn: { type: String, required: true, trim: true },
    occupationAr: { type: String, trim: true },
    nationalityEn: { type: String, required: true, trim: true },
    nationalityAr: { type: String, trim: true },
    idNumber: { type: String, required: true, trim: true },

    // ----- Provider Establishment / بيانات مقدم الخدمة -----
    providerNameEn: { type: String, trim: true },
    providerNameAr: { type: String, required: true, trim: true },
    providerEstablishmentNumber: { type: String, required: true, trim: true },

    // ----- Beneficiary Establishment / بيانات المستفيد من الخدمة -----
    beneficiaryNameEn: { type: String, trim: true },
    beneficiaryNameAr: { type: String, required: true, trim: true },
    beneficiaryEstablishmentNumber: { type: String, required: true, trim: true },

    // ----- Permit Reference Code (e.g. TW6617332) -----
    // FIX 4: unique:true ensures DB-level guarantee against duplicate permit codes
    permitCode: { type: String, trim: true, unique: true, sparse: true },

    // ----- Permit Information / بيانات التصريح -----
    permitStartDate: { type: Date, required: true },
    permitEndDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permit", permitSchema);
