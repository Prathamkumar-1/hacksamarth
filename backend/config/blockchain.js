const { ethers } = require("ethers");

const NETWORKS = {
  localhost: { chainId: 31337, rpc: "http://127.0.0.1:8545" },
  sepolia:   { chainId: 11155111, rpc: process.env.SEPOLIA_RPC_URL },
  mainnet:   { chainId: 1, rpc: process.env.MAINNET_RPC_URL },
};

const getProvider = (network = process.env.NETWORK || "localhost") => {
  const net = NETWORKS[network];
  if (!net) throw new Error("Unknown network: " + network);
  return new ethers.JsonRpcProvider(net.rpc);
};

const getSigner = (network = process.env.NETWORK || "localhost") => {
  const provider = getProvider(network);
  if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY not set");
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
};

const getContract = (address, abi, signerOrProvider) =>
  new ethers.Contract(address, abi, signerOrProvider);

module.exports = { getProvider, getSigner, getContract, NETWORKS };
