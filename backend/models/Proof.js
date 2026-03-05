const mongoose = require("mongoose");

const proofSchema = new mongoose.Schema({
  // Reference to donation
  donationId:      { type: String, required: true },  // On-chain donation ID
  projectId:       { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  ngoId:           { type: mongoose.Schema.Types.ObjectId, ref: "NGO", required: true },
  donorAddress:    { type: String, required: true },  // Donor wallet address
  ngoAddress:      { type: String, required: true },  // NGO wallet address
  donationAmount:  { type: String, required: true },  // Wei
  
  // Proof details
  proofType:       { type: String, enum: ["receipt", "video", "document"], required: true },
  proofIPFS:       { type: String, required: true },  // IPFS hash of proof
  description:     { type: String, required: true },  // What they did with the money
  
  // Timeline
  submittedAt:     { type: Date, default: Date.now },
  expiresAt:       { type: Date, required: true },    // 30 days from donation
  
  // Status tracking
  status:          { 
    type: String, 
    enum: ["pending", "submitted", "verified", "rejected", "released", "refunded"], 
    default: "submitted" 
  },
  
  // Verification data
  verifiedAt:      { type: Date },
  verifiedBy:      { type: String },  // Auditor address
  verificationReason: { type: String },  // If rejected, why?
  verificationNotes: String,
  
  // Transaction references
  releaseTransactionHash: String,
  refundTransactionHash: String,
  onChainVerified: { type: Boolean, default: false },
  
}, { timestamps: true });

// Index for quick lookups
proofSchema.index({ projectId: 1, status: 1 });
proofSchema.index({ ngoId: 1, status: 1 });
proofSchema.index({ donorAddress: 1, status: 1 });
proofSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("Proof", proofSchema);
