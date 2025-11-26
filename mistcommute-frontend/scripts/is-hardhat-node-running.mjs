import { ethers } from "ethers";

async function checkIfHardhatNodeIsRunning() {
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");

  try {
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    console.log(`✅ Hardhat node is running on chainId ${network.chainId}`);
    console.log(`   Current block number: ${blockNumber}`);
  } catch {
    console.error("\n");
    console.error("===============================================================================");
    console.error(" 💥❌ Local Hardhat Node is NOT running!");
    console.error("");
    console.error("   To start Hardhat Node:");
    console.error("   ----------------------");
    console.error("   ✅ 1. Open a new terminal window");
    console.error("   ✅ 2. Navigate to: fhevm-hardhat-template/");
    console.error("   ✅ 3. Run: npx hardhat node --verbose");
    console.error("");
    console.error("===============================================================================\n");
    process.exit(1);
  }
}

checkIfHardhatNodeIsRunning();

