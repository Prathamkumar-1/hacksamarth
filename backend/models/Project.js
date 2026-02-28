const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema({
  title:         String,
  description:   String,
  targetAmount:  String,
  deadline:      Date,
  completed:     { type: Boolean, default: false },
  proofIPFS:     String,
});

const projectSchema = new mongoose.Schema({
  ngoId:           { type: mongoose.Schema.Types.ObjectId, ref: "NGO", required: true },
  onChainId:       { type: Number },
  title:           { type: String, required: true },
  description:     { type: String, required: true },
  descriptionIPFS: { type: String },
  category:        { type: String, enum: ["Education","Health","Environment","Poverty","Disaster","Other"], required: true },
  goalAmount:      { type: String, required: true },
  raisedAmount:    { type: String, default: "0" },
  currency:        { type: String, default: "ETH" },
  images:          [String],
  milestones:      [milestoneSchema],
  deadline:        { type: Date, required: true },
  status:          { type: String, enum: ["pending","active","completed","suspended","rejected"], default: "pending" },
  donorCount:      { type: Number, default: 0 },
  featured:        { type: Boolean, default: false },
}, { timestamps: true });

projectSchema.index({ status: 1, category: 1 });
projectSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Project", projectSchema);
