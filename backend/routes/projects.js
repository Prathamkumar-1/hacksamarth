const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const { authenticateToken, requireRole, generalLimiter } = require("../middleware/auth");

// GET all active projects with filtering
router.get("/", generalLimiter, async (req, res) => {
  try {
    const { category, status = "active", search, page = 1, limit = 12, sort = "-createdAt" } = req.query;
    const query = { status };
    if (category) query.category = category;
    if (search) query.$text = { $search: search };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [projects, total] = await Promise.all([
      Project.find(query).populate("ngoId", "name logoUrl reputationScore verified")
        .sort(sort).skip(skip).limit(parseInt(limit)),
      Project.countDocuments(query),
    ]);
    res.json({ projects, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project
router.get("/:id", generalLimiter, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("ngoId", "name logoUrl reputationScore verified country website");
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE project (NGO only)
router.post("/", authenticateToken, requireRole("ngo"), async (req, res) => {
  try {
    const { title, description, category, goalAmount, deadline, milestones, images } = req.body;
    if (!title || !description || !category || !goalAmount || !deadline) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const project = await Project.create({
      ngoId: req.user.ngoId,
      title, description, category, goalAmount: goalAmount.toString(),
      deadline: new Date(deadline), milestones: milestones || [], images: images || [],
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE project status (admin)
router.patch("/:id/status", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["pending","active","completed","suspended","rejected"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const project = await Project.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET featured projects
router.get("/featured/list", generalLimiter, async (req, res) => {
  try {
    const projects = await Project.find({ featured: true, status: "active" })
      .populate("ngoId", "name logoUrl verified").limit(6);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
