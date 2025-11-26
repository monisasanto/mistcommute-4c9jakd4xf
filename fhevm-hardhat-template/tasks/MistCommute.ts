import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:submitCommute")
  .addParam("departure", "Departure time in minutes since midnight")
  .addParam("arrival", "Arrival time in minutes since midnight")
  .addParam("route", "Route name")
  .addParam("type", "Commute type: 0=Morning, 1=Evening, 2=Other")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const MistCommute = await deployments.get("MistCommute");
    const mistCommute = await ethers.getContractAt("MistCommute", MistCommute.address);

    const departure = parseInt(taskArguments.departure);
    const arrival = parseInt(taskArguments.arrival);
    const duration = arrival - departure;
    const routeName = taskArguments.route;
    const commuteType = parseInt(taskArguments.type);

    console.log(`Submitting commute: ${routeName}`);
    console.log(`  Departure: ${departure} minutes (${Math.floor(departure / 60)}:${departure % 60})`);
    console.log(`  Arrival: ${arrival} minutes (${Math.floor(arrival / 60)}:${arrival % 60})`);
    console.log(`  Duration: ${duration} minutes`);

    // In Mock mode with fhevmjs, you would create encrypted input here
    // For now, this is a placeholder showing the structure
    console.log("Note: This task requires FHEVM client setup for encryption");
    console.log("Use the frontend or write a script with fhevmjs for actual submission");
  });

task("task:getCommunityStats").setAction(async function (taskArguments: TaskArguments, hre) {
  const { ethers, deployments } = hre;
  const MistCommute = await deployments.get("MistCommute");
  const mistCommute = await ethers.getContractAt("MistCommute", MistCommute.address);

  const stats = await mistCommute.getCommunityStats();
  
  console.log("\n=== Community Statistics ===");
  console.log(`Total Commutes: ${stats[0]}`);
  console.log(`Morning Congested: ${stats[1] ? "🔴 YES" : "🟢 NO"}`);
  console.log(`Evening Congested: ${stats[2] ? "🔴 YES" : "🟢 NO"}`);
  console.log("===========================\n");
});

task("task:getUserCommutes")
  .addParam("address", "User address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const MistCommute = await deployments.get("MistCommute");
    const mistCommute = await ethers.getContractAt("MistCommute", MistCommute.address);

    const userAddress = taskArguments.address;
    const commuteIds = await mistCommute.getUserCommuteIds(userAddress);

    console.log(`\n=== Commutes for ${userAddress} ===`);
    console.log(`Total: ${commuteIds.length} commutes`);
    
    for (const id of commuteIds) {
      console.log(`  - Commute ID: ${id}`);
    }
    console.log("==========================================\n");
  });

task("task:grantStatsAccess")
  .addParam("recipient", "Address to grant access")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();
    const MistCommute = await deployments.get("MistCommute");
    const mistCommute = await ethers.getContractAt("MistCommute", MistCommute.address);

    const recipient = taskArguments.recipient;
    
    console.log(`Granting stats access to: ${recipient}`);
    const tx = await mistCommute.connect(signer).grantStatsAccess(recipient);
    await tx.wait();
    
    console.log("✅ Access granted!");
  });

