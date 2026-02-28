const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");
const User = require("../models/User");
const { authLimiter } = require("../middleware/auth");

// Generate nonce for wallet signature auth
router.get("/nonce/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    let user = await User.findOne({ walletAddress: address });
    if (!user) {
      return res.json({ nonce: "Connect your wallet to register" });
    }
    res.json({ nonce: user.nonce });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Traditional email/password login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.isLocked) return res.status(423).json({ error: "Account locked. Try again later." });
    const valid = await user.comparePassword(password);
    if (!valid) {
      await user.incLoginAttempts();
      return res.status(401).json({ error: "Invalid credentials" });
    }
    await user.updateOne({ loginAttempts: 0, $unset: { lockUntil: 1 }, lastLoginAt: new Date() });
    const token = jwt.sign({ id: user._id, role: user.role, walletAddress: user.walletAddress }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, walletAddress: user.walletAddress } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wallet signature authentication
router.post("/wallet-auth", authLimiter, async (req, res) => {
  try {
    const { address, signature, message } = req.body;
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }
    let user = await User.findOne({ walletAddress: address.toLowerCase() });
    if (!user) return res.status(404).json({ error: "Wallet not registered" });
    await user.updateOne({ nonce: Math.random().toString(36).substring(2), lastLoginAt: new Date() });
    const token = jwt.sign({ id: user._id, role: user.role, walletAddress: user.walletAddress }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, walletAddress: user.walletAddress } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register new user
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, walletAddress, role } = req.body;
    if (!name || !email || !password || !walletAddress) {
      return res.status(400).json({ error: "All fields required" });
    }
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { walletAddress: walletAddress.toLowerCase() }] });
    if (existing) return res.status(409).json({ error: "Email or wallet already registered" });
    const user = await User.create({
      name, email: email.toLowerCase(),
      passwordHash: password,
      walletAddress: walletAddress.toLowerCase(),
      role: ["user", "ngo"].includes(role) ? role : "user",
    });
    const token = jwt.sign({ id: user._id, role: user.role, walletAddress: user.walletAddress }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
