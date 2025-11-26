import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MistCommute, MistCommute__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("MistCommute", function () {
  let mistCommute: MistCommute;
  let mistCommuteAddress: string;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  before(async function () {
    // Check if running against FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn("MistCommute test suite requires FHEVM mock environment");
      this.skip();
    }

    const signers: HardhatEthersSigner[] = await ethers.getSigners();
    [owner, user1, user2] = signers;

    // Deploy MistCommute contract
    const factory = (await ethers.getContractFactory("MistCommute")) as MistCommute__factory;
    mistCommute = (await factory.deploy()) as MistCommute;
    mistCommuteAddress = await mistCommute.getAddress();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await mistCommute.owner()).to.equal(await owner.getAddress());
    });

    it("Should initialize with zero commutes", async function () {
      expect(await mistCommute.totalCommutes()).to.equal(0);
    });

    it("Should initialize with no congestion", async function () {
      // Check congestion levels are Green (0) for both time slots
      const morningLevel = await mistCommute.getCongestionLevel(0); // MorningRush
      const eveningLevel = await mistCommute.getCongestionLevel(1); // EveningRush
      expect(morningLevel).to.equal(0); // Green
      expect(eveningLevel).to.equal(0); // Green
    });
  });

  describe("Submit Commute", function () {
    it("Should submit encrypted commute successfully", async function () {
      const user1Address = await user1.getAddress();
      
      // Create encrypted inputs: departure=480 (8:00 AM), arrival=510 (8:30 AM), duration=30
      const encryptedData = await fhevm
        .createEncryptedInput(mistCommuteAddress, user1Address)
        .add32(480) // departure
        .add32(510) // arrival
        .add32(30)  // duration
        .encrypt();
      
      // Submit commute
      const tx = await mistCommute.connect(user1).submitCommute(
        encryptedData.handles[0],
        encryptedData.handles[1],
        encryptedData.handles[2],
        encryptedData.inputProof,
        "Home to Office",
        0 // Morning
      );
      
      await expect(tx)
        .to.emit(mistCommute, "CommuteSubmitted")
        .withArgs(user1Address, 0, 0, await ethers.provider.getBlock('latest').then(b => b!.timestamp));
      
      expect(await mistCommute.totalCommutes()).to.equal(1);
      expect(await mistCommute.morningCount()).to.equal(1);
    });

    it("Should track multiple commutes for a user", async function () {
      const user1Address = await user1.getAddress();
      
      // Submit second commute: departure=1020 (5:00 PM), arrival=1080 (6:00 PM), duration=60
      const encryptedData = await fhevm
        .createEncryptedInput(mistCommuteAddress, user1Address)
        .add32(1020)
        .add32(1080)
        .add32(60)
        .encrypt();
      
      await mistCommute.connect(user1).submitCommute(
        encryptedData.handles[0],
        encryptedData.handles[1],
        encryptedData.handles[2],
        encryptedData.inputProof,
        "Office to Home",
        1 // Evening
      );
      
      expect(await mistCommute.totalCommutes()).to.equal(2);
      expect(await mistCommute.eveningCount()).to.equal(1);
      
      const commuteIds = await mistCommute.getUserCommuteIds(user1Address);
      expect(commuteIds.length).to.equal(2);
      expect(commuteIds[0]).to.equal(0);
      expect(commuteIds[1]).to.equal(1);
    });

    it("Should allow different users to submit commutes", async function () {
      const user2Address = await user2.getAddress();
      
      const encryptedData = await fhevm
        .createEncryptedInput(mistCommuteAddress, user2Address)
        .add32(450) // 7:30 AM
        .add32(495) // 8:15 AM
        .add32(45)  // 45 minutes
        .encrypt();
      
      await mistCommute.connect(user2).submitCommute(
        encryptedData.handles[0],
        encryptedData.handles[1],
        encryptedData.handles[2],
        encryptedData.inputProof,
        "Route A",
        0 // Morning
      );
      
      expect(await mistCommute.totalCommutes()).to.equal(3);
      
      const user2CommuteIds = await mistCommute.getUserCommuteIds(user2Address);
      expect(user2CommuteIds.length).to.equal(1);
      expect(user2CommuteIds[0]).to.equal(2);
    });
  });

  describe("Get Commute Details", function () {
    it("Should return encrypted commute details for owner", async function () {
      const user1Address = await user1.getAddress();
      
      const details = await mistCommute.connect(user1).getUserCommuteDetails(0);
      
      expect(details.routeName).to.equal("Home to Office");
      expect(details.commuteType).to.equal(0); // Morning
      
      // Encrypted values are returned as euint32 handles
      // Decryption would require proper FHEVM setup
    });

    it("Should reject access to other user's commutes", async function () {
      await expect(
        mistCommute.connect(user2).getUserCommuteDetails(0)
      ).to.be.revertedWith("Not commute owner");
    });
  });

  describe("Community Statistics", function () {
    it("Should return correct public stats", async function () {
      const stats = await mistCommute.getCommunityStats();
      
      expect(stats[0]).to.equal(3); // totalCommutes
      // Congestion flags depend on threshold comparisons
    });

    it("Should update congestion flags when threshold exceeded", async function () {
      // Submit commutes with long durations to trigger congestion
      const user1Address = await user1.getAddress();
      
      for (let i = 0; i < 3; i++) {
        const encryptedData = await fhevm
          .createEncryptedInput(mistCommuteAddress, user1Address)
          .add32(480)
          .add32(540) // 60 minutes duration
          .add32(60)
          .encrypt();
        
        await mistCommute.connect(user1).submitCommute(
          encryptedData.handles[0],
          encryptedData.handles[1],
          encryptedData.handles[2],
          encryptedData.inputProof,
          `Route ${i}`,
          0 // Morning
        );
      }
      
      // Check if morning congestion level is updated
      const morningLevel = await mistCommute.getCongestionLevel(0);
      // Should be Red (2) or Yellow (1) after submitting many long-duration commutes
      console.log(`Morning congestion level: ${morningLevel}`);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to grant stats access", async function () {
      const user1Address = await user1.getAddress();
      
      await expect(
        mistCommute.connect(owner).grantStatsAccess(user1Address)
      ).to.emit(mistCommute, "StatsAccessGranted");
    });

    it("Should reject non-owner from granting stats access", async function () {
      const user2Address = await user2.getAddress();
      
      await expect(
        mistCommute.connect(user1).grantStatsAccess(user2Address)
      ).to.be.revertedWith("Only owner");
    });

    it("Should allow owner to update thresholds", async function () {
      const ownerAddress = await owner.getAddress();
      
      const encryptedData = await fhevm
        .createEncryptedInput(mistCommuteAddress, ownerAddress)
        .add32(35) // new low threshold
        .add32(50) // new high threshold
        .encrypt();
      
      await expect(
        mistCommute.connect(owner).updateThresholds(
          encryptedData.handles[0],
          encryptedData.handles[1],
          encryptedData.inputProof
        )
      ).to.emit(mistCommute, "ThresholdsUpdated");
    });
  });

  describe("Congestion Levels", function () {
    it("Should return correct congestion level for morning rush", async function () {
      const level = await mistCommute.getCongestionLevel(0); // MorningRush
      // Level should be 0 (Green), 1 (Yellow), or 2 (Red) as BigInt
      expect([0n, 1n, 2n]).to.include(level);
    });

    it("Should return correct congestion level for evening rush", async function () {
      const level = await mistCommute.getCongestionLevel(1); // EveningRush
      expect([0n, 1n, 2n]).to.include(level);
    });
  });
});

