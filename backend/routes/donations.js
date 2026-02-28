const express = require("express");
const router = express.Router();
const { authenticateToken, donationLimiter, generalLimiter } = require("../middleware/auth");
const { getProvider, getContract } = require("../config/blockchain");

// GET donation history for a project (from blockchain events)
router.get("/project/:projectId", generalLimiter, async (req, res) => {
  try {
    const { projectId } = req.params;
    const abi = require("../abis/DonationPlatform.json");
    const provider = getProvider();
    const contract = getContract(process.env.CONTRACT_ADDRESS, abi, provider);
    const donations = await contract.getProjectDonations(projectId);
    res.json(donations.map(d => ({
      donor: d.donor,
      amount: d.amount.toString(),
      timestamp: d.timestamp.toString(),
      message: d.message,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user donation history
router.get("/user/:address", generalLimiter, async (req, res) => {
  try {
    const abi = require("../abis/DonationPlatform.json");
    const provider = getProvider();
    const contract = getContract(process.env.CONTRACT_ADDRESS, abi, provider);
    const projectIds = await contract.getDonorProjects(req.params.address);
    res.json({ projectIds: projectIds.map(id => id.toString()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET transaction verification
router.get("/verify/:txHash", generalLimiter, async (req, res) => {
  try {
    const provider = getProvider();
    const tx = await provider.getTransaction(req.params.txHash);
    const receipt = await provider.getTransactionReceipt(req.params.txHash);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      blockNumber: receipt?.blockNumber,
      status: receipt?.status === 1 ? "confirmed" : "failed",
      confirmations: receipt ? (await provider.getBlockNumber()) - receipt.blockNumber : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
