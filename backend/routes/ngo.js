const express = require("express");
const router = express.Router();
const NGO = require("../models/NGO");
const Project = require("../models/Project");
const { authenticateToken, requireRole, generalLimiter } = require("../middleware/auth");

// GET all verified NGOs
router.get("/", generalLimiter, async (req, res) => {
  try {
    const ngos = await NGO.find({ verified: true }).select("-documentsIPFS");
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET NGO profile
router.get("/:id", generalLimiter, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id).select("-documentsIPFS");
    if (!ngo) return res.status(404).json({ error: "NGO not found" });
    const projects = await Project.find({ ngoId: req.params.id });
    res.json({ ...ngo.toObject(), projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REGISTER NGO
router.post("/register", authenticateToken, async (req, res) => {
  try {
    const { name, description, registrationNo, country, website, documentsIPFS } = req.body;
    const existing = await NGO.findOne({ userId: req.user.id });
    if (existing) return res.status(409).json({ error: "NGO already registered for this user" });
    const ngo = await NGO.create({
      userId: req.user.id,
      walletAddress: req.user.walletAddress,
      name, description, registrationNo, country, website, documentsIPFS,
    });
    res.status(201).json(ngo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VERIFY NGO (admin)
router.patch("/:id/verify", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const ngo = await NGO.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
    if (!ngo) return res.status(404).json({ error: "NGO not found" });
    res.json({ message: "NGO verified", ngo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET NGO dashboard stats
router.get("/:id/dashboard", authenticateToken, requireRole("ngo", "admin"), async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) return res.status(404).json({ error: "NGO not found" });
    const projects = await Project.find({ ngoId: req.params.id });
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === "active").length,
      totalRaised: ngo.totalRaised,
      reputationScore: ngo.reputationScore,
      projectsByStatus: projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {}),
    };
    res.json({ ngo, stats, projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
