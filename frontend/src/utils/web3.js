import { ethers } from "ethers";
import DonationPlatformABI from "../abis/DonationPlatform.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export const getProvider = () => {
  if (!window.ethereum) throw new Error("MetaMask not detected. Please install MetaMask.");
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  return provider.getSigner();
};

export const getContract = async (withSigner = false) => {
  const provider = getProvider();
  const signerOrProvider = withSigner ? await provider.getSigner() : provider;
  return new ethers.Contract(CONTRACT_ADDRESS, DonationPlatformABI, signerOrProvider);
};

export const connectWallet = async () => {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accounts[0];
};

export const getWalletBalance = async (address) => {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
};

export const donate = async (projectId, amountEth, message = "") => {
  const contract = await getContract(true);
  const tx = await contract.donate(projectId, message, {
    value: ethers.parseEther(amountEth.toString()),
  });
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
};

export const requestFundRelease = async (projectId, milestoneIndex, amountEth, proofHash) => {
  const contract = await getContract(true);
  const tx = await contract.requestFundRelease(
    projectId, milestoneIndex, ethers.parseEther(amountEth.toString()), proofHash
  );
  return tx.wait();
};

export const claimRefund = async (projectId) => {
  const contract = await getContract(true);
  const tx = await contract.claimRefund(projectId);
  return tx.wait();
};

export const getProjectOnChain = async (projectId) => {
  const contract = await getContract();
  return contract.getProject(projectId);
};

export const formatAddress = (address) =>
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

export const formatEth = (wei) =>
  wei ? parseFloat(ethers.formatEther(wei)).toFixed(4) : "0.0000";

export const listenToEvents = (contract, eventName, callback) => {
  contract.on(eventName, callback);
  return () => contract.off(eventName, callback);
};
