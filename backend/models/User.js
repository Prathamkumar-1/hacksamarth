const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  walletAddress:  { type: String, required: true, unique: true, lowercase: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  passwordHash:   { type: String, required: true },
  role:           { type: String, enum: ["user", "ngo", "admin", "auditor"], default: "user" },
  name:           { type: String, required: true, trim: true },
  nonce:          { type: String, default: () => Math.random().toString(36).substring(2) },
  isActive:       { type: Boolean, default: true },
  twoFASecret:    { type: String },
  twoFAEnabled:   { type: Boolean, default: false },
  loginAttempts:  { type: Number, default: 0 },
  lockUntil:      { type: Date },
  createdAt:      { type: Date, default: Date.now },
  lastLoginAt:    { type: Date },
}, { timestamps: true });

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    await this.updateOne({ $unset: { lockUntil: 1 }, $set: { loginAttempts: 1 } });
  } else {
    const updates = { $inc: { loginAttempts: 1 } };
    if (this.loginAttempts + 1 >= 5) updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    await this.updateOne(updates);
  }
};

module.exports = mongoose.model("User", userSchema);
