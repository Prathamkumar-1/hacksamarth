const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  walletAddress:    { type: String, required: true, unique: true },
  name:             { type: String, required: true },
  description:      { type: String, required: true },
  registrationNo:   { type: String, required: true, unique: true },
  country:          { type: String, required: true },
  website:          { type: String },
  logoUrl:          { type: String },
  documentsIPFS:    { type: String },
  onChainId:        { type: Number },
  verified:         { type: Boolean, default: false },
  reputationScore:  { type: Number, default: 50, min: 0, max: 100 },
  totalRaised:      { type: String, default: "0" },
  totalProjects:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("NGO", ngoSchema);
