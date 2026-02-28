const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy Treasury
  console.log("\nDeploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddress);

  // Deploy DonationPlatform
  console.log("\nDeploying DonationPlatform...");
  const DonationPlatform = await ethers.getContractFactory("DonationPlatform");
  const platform = await DonationPlatform.deploy(treasuryAddress);
  await platform.waitForDeployment();
  const platformAddress = await platform.getAddress();
  console.log("DonationPlatform deployed to:", platformAddress);

  // Grant auditor role to deployer (can be changed later)
  const AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE"));
  await platform.grantRole(AUDITOR_ROLE, deployer.address);
  console.log("\nAuditor role granted to:", deployer.address);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    contracts: {
      Treasury: { address: treasuryAddress },
      DonationPlatform: { address: platformAddress },
    },
    deployer: deployer.address,
  };
  fs.writeFileSync("./deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✅ Deployment info saved to deployment.json");
  console.log("\n🔧 Update your .env files:");
  console.log(`CONTRACT_ADDRESS=${platformAddress}`);
  console.log(`REACT_APP_CONTRACT_ADDRESS=${platformAddress}`);
}

main().catch(err => { console.error(err); process.exit(1); });
