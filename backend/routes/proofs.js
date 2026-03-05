const express = require("express");
const router = express.Router();
const { authenticateToken, generalLimiter } = require("../middleware/auth");
const { getProvider, getContract } = require("../config/blockchain");
const Proof = require("../models/Proof");
const Project = require("../models/Project");
const NGO = require("../models/NGO");
const User = require("../models/User");

// @route   GET /api/proofs/donation-status/:projectId/:donationId
// @desc    Get donation status and proof verification details
// @access  Public
router.get("/donation-status/:projectId/:donationId", generalLimiter, async (req, res) => {
  try {
    const { projectId, donationId } = req.params;
    const abi = require("../abis/DonationPlatform.json");
    const provider = getProvider();
    const contract = getContract(process.env.CONTRACT_ADDRESS, abi, provider);

    // Get donation from blockchain
    const projectDonations = await contract.getProjectDonations(projectId);
    if (!projectDonations[donationId]) {
      return res.status(404).json({ error: "Donation not found" });
    }

    const donation = projectDonations[donationId];
    
    // Get proof from DB
    const proof = await Proof.findOne({
      projectId,
      donationId: donationId.toString(),
    }).select("proofType status verifiedAt releaseTransactionHash refundTransactionHash verificationReason submittedAt expiresAt");

    // Get donation balance from contract
    const balance = await contract.getDonationBalance(projectId, donationId);

    res.json({
      donation: {
        id: donationId,
        amount: donation.amount ? donation.amount.toString() : "0",
        status: donation.status || "Pending",
        timestamp: donation.timestamp ? donation.timestamp.toString() : "0",
        message: donation.message || "",
        escrowUntil: donation.escrowUntil ? donation.escrowUntil.toString() : "0",
        verifiedAt: donation.verifiedAt ? donation.verifiedAt.toString() : "0",
      },
      proof: proof ? {
        type: proof.proofType,
        status: proof.status,
        submittedAt: proof.submittedAt,
        expiresAt: proof.expiresAt,
        verifiedAt: proof.verifiedAt,
        releaseTransactionHash: proof.releaseTransactionHash,
        refundTransactionHash: proof.refundTransactionHash,
        verificationReason: proof.verificationReason,
      } : null,
      escrowBalance: balance ? balance.toString() : "0",
    });
  } catch (err) {
    console.error("Error fetching donation status:", err);
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/proofs/project/:projectId
// @desc    Get all proofs for a project with status
// @access  Public
router.get("/project/:projectId", generalLimiter, async (req, res) => {
  try {
    const { projectId } = req.params;

    const proofs = await Proof.find({ projectId })
      .select("donationId proofType status submittedAt verifiedAt expiresAt verificationReason")
      .sort({ submittedAt: -1 });

    res.json({
      total: proofs.length,
      verified: proofs.filter(p => p.status === "verified").length,
      pending: proofs.filter(p => p.status === "pending" || p.status === "submitted").length,
      rejected: proofs.filter(p => p.status === "rejected").length,
      proofs: proofs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/proofs/donor/:address
// @desc    Get all proofs submitted by donor (for verification)
// @access  Public
router.get("/donor/:address", generalLimiter, async (req, res) => {
  try {
    const { address } = req.params;

    const proofs = await Proof.find({ donorAddress: address.toLowerCase() })
      .select("projectId donationId proofType status submittedAt verifiedAt expiresAt donationAmount")
      .sort({ submittedAt: -1 });

    res.json({
      total: proofs.length,
      verified: proofs.filter(p => p.status === "verified").length,
      pending: proofs.filter(p => p.status === "pending" || p.status === "submitted").length,
      proofs: proofs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/proofs/ngo/:ngoId
// @desc    Get all proofs for an NGO (for submission management)
// @access  Private (NGO only)
router.get("/ngo/:ngoId", authenticateToken, async (req, res) => {
  try {
    const { ngoId } = req.params;

    // Verify user is the NGO
    const ngo = await NGO.findById(ngoId);
    if (!ngo || ngo.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const proofs = await Proof.find({ ngoId })
      .select("projectId donationId proofType status submittedAt verifiedAt expiresAt donationAmount")
      .sort({ submittedAt: -1 });

    const byStatus = {
      pending: proofs.filter(p => p.status === "pending").length,
      submitted: proofs.filter(p => p.status === "submitted").length,
      verified: proofs.filter(p => p.status === "verified").length,
      rejected: proofs.filter(p => p.status === "rejected").length,
    };

    res.json({
      total: proofs.length,
      byStatus,
      proofs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/proofs/submit/:projectId/:donationId
// @desc    Submit proof of fund usage
// @access  Private (NGO only)
router.post("/submit/:projectId/:donationId", authenticateToken, async (req, res) => {
  try {
    const { projectId, donationId } = req.params;
    const { proofType, proofIPFS, description } = req.body;

    // Validate input
    if (!proofType || !proofIPFS || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["receipt", "video", "document"].includes(proofType)) {
      return res.status(400).json({ error: "Invalid proof type" });
    }

    // Get project and verify NGO
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const ngo = await NGO.findById(project.ngoId);
    if (!ngo || ngo.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if proof already exists
    const existingProof = await Proof.findOne({
      projectId,
      donationId: donationId.toString(),
    });

    if (existingProof && existingProof.status !== "rejected") {
      return res.status(400).json({ error: "Proof already submitted for this donation" });
    }

    // Get blockchain contract
    const abi = require("../abis/DonationPlatform.json");
    const provider = getProvider();
    const contract = getContract(process.env.CONTRACT_ADDRESS, abi, provider);

    // Verify donation exists on blockchain
    const projectDonations = await contract.getProjectDonations(projectId);
    if (!projectDonations[donationId]) {
      return res.status(404).json({ error: "Donation not found on blockchain" });
    }

    const donation = projectDonations[donationId];

    // Create proof record
    const newProof = new Proof({
      projectId,
      donationId: donationId.toString(),
      ngoId: project.ngoId,
      donorAddress: donation.donor.toLowerCase(),
      ngoAddress: ngo.walletAddress.toLowerCase(),
      donationAmount: donation.amount.toString(),
      proofType,
      proofIPFS,
      description,
      status: "submitted",
      expiresAt: new Date(donation.escrowUntil * 1000),
    });

    await newProof.save();

    res.status(201).json({
      message: "Proof submitted successfully",
      proof: {
        id: newProof._id,
        projectId,
        donationId: newProof.donationId,
        proofType: newProof.proofType,
        status: newProof.status,
        submittedAt: newProof.submittedAt,
        expiresAt: newProof.expiresAt,
      },
    });
  } catch (err) {
    console.error("Error submitting proof:", err);
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/proofs/verify/:projectId/:donationId
// @desc    Verify proof (admin/auditor only)
// @access  Private (Admin/Auditor only)
router.post("/verify/:projectId/:donationId", authenticateToken, async (req, res) => {
  try {
    const { projectId, donationId } = req.params;
    const { approve, reason } = req.body;

    // Check if user is admin/auditor
    const user = await User.findById(req.user.id);
    if (!["admin", "auditor"].includes(user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get proof from DB
    const proof = await Proof.findOne({
      projectId,
      donationId: donationId.toString(),
    });

    if (!proof) {
      return res.status(404).json({ error: "Proof not found" });
    }

    if (proof.status !== "submitted") {
      return res.status(400).json({ error: "Proof already verified" });
    }

    // Update proof status
    proof.status = approve ? "verified" : "rejected";
    proof.verifiedAt = new Date();
    proof.verifiedBy = req.user.address || user.walletAddress;
    if (!approve) {
      proof.verificationReason = reason;
    }

    await proof.save();

    res.json({
      message: approve ? "Proof verified successfully" : "Proof rejected successfully",
      proof: {
        id: proof._id,
        status: proof.status,
        verifiedAt: proof.verifiedAt,
        verificationReason: proof.verificationReason,
      },
    });
  } catch (err) {
    console.error("Error verifying proof:", err);
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/proofs/verify-pending
// @desc    Get all pending proofs awaiting verification
// @access  Private (Admin/Auditor only)
router.get("/verify-pending", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin/auditor
    const user = await User.findById(req.user.id);
    if (!["admin", "auditor"].includes(user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const pendingProofs = await Proof.find({
      status: { $in: ["pending", "submitted"] },
    })
      .select("projectId donationId ngoId proofType submittedAt description donationAmount ngoAddress donorAddress")
      .sort({ submittedAt: 1 })
      .limit(50);

    res.json({
      total: pendingProofs.length,
      proofs: pendingProofs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/proofs/sync-blockchain/:projectId/:donationId
// @desc    Sync proof verification status with blockchain
// @access  Private (Admin only)
router.post("/sync-blockchain/:projectId/:donationId", authenticateToken, async (req, res) => {
  try {
    const { projectId, donationId } = req.params;
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const proof = await Proof.findOne({
      projectId,
      donationId: donationId.toString(),
    });

    if (!proof) {
      return res.status(404).json({ error: "Proof not found" });
    }

    const abi = require("../abis/DonationPlatform.json");
    const provider = getProvider();
    const contract = getContract(process.env.CONTRACT_ADDRESS, abi, provider);

    // Get donation status from blockchain
    const projectDonations = await contract.getProjectDonations(projectId);
    const donation = projectDonations[donationId];

    // Update sync status in DB
    proof.onChainVerified = donation.status === 4; // DonationStatus.Verified
    await proof.save();

    res.json({
      message: "Proof status synced with blockchain",
      proof: {
        id: proof._id,
        onChainStatus: donation.status,
        dbStatus: proof.status,
        synced: true,
      },
    });
  } catch (err) {
    console.error("Error syncing proof:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
