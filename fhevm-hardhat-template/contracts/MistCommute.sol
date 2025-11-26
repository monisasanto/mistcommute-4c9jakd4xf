// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title MistCommute
 * @notice Privacy-preserving commute time & route evaluation using FHEVM
 * @dev All commute times are stored encrypted; only aggregated stats revealed
 */
contract MistCommute is ZamaEthereumConfig {
    // ============ Enums ============
    
    enum CommuteType {
        Morning,
        Evening,
        Other
    }
    
    enum CongestionLevel {
        Green,   // Low congestion
        Yellow,  // Moderate congestion
        Red      // High congestion
    }
    
    enum TimeSlot {
        MorningRush,   // 6-9 AM
        EveningRush,   // 5-8 PM
        Other
    }
    
    // ============ Structs ============
    
    struct Commute {
        euint32 departure;      // Minutes since midnight (encrypted)
        euint32 arrival;        // Minutes since midnight (encrypted)
        euint32 duration;       // Duration in minutes (encrypted)
        string routeName;       // Route identifier (plaintext)
        CommuteType commuteType;
        uint256 timestamp;      // Block timestamp
        address user;
    }
    
    // ============ State Variables ============
    
    // Commute storage
    mapping(uint256 => Commute) private commutes;
    mapping(address => uint256[]) private userCommuteIds;
    uint256 public totalCommutes;
    
    // Aggregated statistics (encrypted)
    euint32 private totalDurationSum;       // Sum of all durations
    euint32 private morningDurationSum;     // Sum of morning commutes
    euint32 private eveningDurationSum;     // Sum of evening commutes
    uint256 public morningCount;
    uint256 public eveningCount;
    
    // Congestion thresholds (encrypted)
    euint32 private lowThreshold;           // Green/Yellow boundary (minutes)
    euint32 private highThreshold;          // Yellow/Red boundary (minutes)
    
    // Public congestion counters for transparent calculation
    // Note: We use plaintext counters to determine congestion publicly
    // Individual commute times remain encrypted
    
    // Access control
    address public owner;
    
    // ============ Events ============
    
    event CommuteSubmitted(
        address indexed user,
        uint256 indexed commuteId,
        CommuteType commuteType,
        uint256 timestamp
    );
    
    event CongestionUpdated(
        TimeSlot slot,
        CongestionLevel level,
        uint256 timestamp
    );
    
    event ThresholdsUpdated(uint256 timestamp);
    
    event StatsAccessGranted(address indexed recipient, uint256 timestamp);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        
        // Initialize thresholds (30 min for low, 45 min for high)
        lowThreshold = FHE.asEuint32(30);
        highThreshold = FHE.asEuint32(45);
        
        // Allow contract to use thresholds internally
        FHE.allowThis(lowThreshold);
        FHE.allowThis(highThreshold);
        
        // Initialize encrypted sums to zero
        totalDurationSum = FHE.asEuint32(0);
        morningDurationSum = FHE.asEuint32(0);
        eveningDurationSum = FHE.asEuint32(0);
        
        FHE.allowThis(totalDurationSum);
        FHE.allowThis(morningDurationSum);
        FHE.allowThis(eveningDurationSum);
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Submit encrypted commute data
     * @param encryptedDeparture Encrypted departure time (minutes since midnight)
     * @param encryptedArrival Encrypted arrival time (minutes since midnight)
     * @param encryptedDuration Encrypted duration (minutes)
     * @param inputProof Proof for encrypted inputs
     * @param routeName Route identifier (plaintext)
     * @param commuteType Type of commute (Morning/Evening/Other)
     * @return commuteId Unique ID for this commute
     */
    function submitCommute(
        externalEuint32 encryptedDeparture,
        externalEuint32 encryptedArrival,
        externalEuint32 encryptedDuration,
        bytes calldata inputProof,
        string calldata routeName,
        CommuteType commuteType
    ) external returns (uint256 commuteId) {
        // Convert encrypted inputs to euint32
        euint32 departure = FHE.fromExternal(encryptedDeparture, inputProof);
        euint32 arrival = FHE.fromExternal(encryptedArrival, inputProof);
        euint32 duration = FHE.fromExternal(encryptedDuration, inputProof);
        
        // Store commute
        commuteId = totalCommutes;
        commutes[commuteId] = Commute({
            departure: departure,
            arrival: arrival,
            duration: duration,
            routeName: routeName,
            commuteType: commuteType,
            timestamp: block.timestamp,
            user: msg.sender
        });
        
        // Update user's commute list
        userCommuteIds[msg.sender].push(commuteId);
        totalCommutes++;
        
        // Update aggregated statistics
        totalDurationSum = FHE.add(totalDurationSum, duration);
        FHE.allowThis(totalDurationSum); // Re-allow after update
        
        if (commuteType == CommuteType.Morning) {
            morningDurationSum = FHE.add(morningDurationSum, duration);
            FHE.allowThis(morningDurationSum); // Re-allow after update
            morningCount++;
        } else if (commuteType == CommuteType.Evening) {
            eveningDurationSum = FHE.add(eveningDurationSum, duration);
            FHE.allowThis(eveningDurationSum); // Re-allow after update
            eveningCount++;
        }
        
        // Allow user to decrypt their own data
        FHE.allow(departure, msg.sender);
        FHE.allow(arrival, msg.sender);
        FHE.allow(duration, msg.sender);
        
        // Allow contract to use these values for comparisons
        FHE.allowThis(departure);
        FHE.allowThis(arrival);
        FHE.allowThis(duration);
        
        emit CommuteSubmitted(msg.sender, commuteId, commuteType, block.timestamp);
    }
    
    /**
     * @notice Get all commute IDs for a user
     * @param user User address
     * @return Array of commute IDs
     */
    function getUserCommuteIds(address user) external view returns (uint256[] memory) {
        return userCommuteIds[user];
    }
    
    /**
     * @notice Get encrypted commute details (only owner can decrypt)
     * @param commuteId Commute ID
     * @return departure Encrypted departure time
     * @return arrival Encrypted arrival time
     * @return duration Encrypted duration
     * @return routeName Route name (plaintext)
     * @return commuteType Type of commute
     * @return timestamp Submission timestamp
     */
    function getUserCommuteDetails(uint256 commuteId)
        external
        view
        returns (
            euint32 departure,
            euint32 arrival,
            euint32 duration,
            string memory routeName,
            CommuteType commuteType,
            uint256 timestamp
        )
    {
        Commute storage c = commutes[commuteId];
        require(c.user == msg.sender, "Not commute owner");
        
        return (
            c.departure,
            c.arrival,
            c.duration,
            c.routeName,
            c.commuteType,
            c.timestamp
        );
    }
    
    /**
     * @notice Get congestion level for a time slot
     * @param slot Time slot to check
     * @return Congestion level (Green/Yellow/Red)
     * @dev Uses plaintext count as proxy: high count = high congestion
     */
    function getCongestionLevel(TimeSlot slot) external view returns (CongestionLevel) {
        if (slot == TimeSlot.MorningRush) {
            // Simple heuristic: if > 10 commutes in morning, consider it congested
            if (morningCount > 10) {
                return CongestionLevel.Red;
            } else if (morningCount > 5) {
                return CongestionLevel.Yellow;
            }
            return CongestionLevel.Green;
        } else if (slot == TimeSlot.EveningRush) {
            if (eveningCount > 10) {
                return CongestionLevel.Red;
            } else if (eveningCount > 5) {
                return CongestionLevel.Yellow;
            }
            return CongestionLevel.Green;
        }
        return CongestionLevel.Green;
    }
    
    /**
     * @notice Get public community statistics
     * @return _totalCommutes Total number of commutes
     * @return _morningCount Morning commute count
     * @return _eveningCount Evening commute count
     */
    function getCommunityStats()
        external
        view
        returns (
            uint256 _totalCommutes,
            uint256 _morningCount,
            uint256 _eveningCount
        )
    {
        return (totalCommutes, morningCount, eveningCount);
    }
    
    /**
     * @notice Get encrypted aggregated statistics (admin only after grant)
     * @return _totalDurationSum Encrypted sum of all durations
     * @return _morningDurationSum Encrypted sum of morning durations
     * @return _eveningDurationSum Encrypted sum of evening durations
     * @return _morningCount Count of morning commutes
     * @return _eveningCount Count of evening commutes
     */
    function getEncryptedStats()
        external
        view
        returns (
            euint32 _totalDurationSum,
            euint32 _morningDurationSum,
            euint32 _eveningDurationSum,
            uint256 _morningCount,
            uint256 _eveningCount
        )
    {
        return (
            totalDurationSum,
            morningDurationSum,
            eveningDurationSum,
            morningCount,
            eveningCount
        );
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update congestion thresholds
     * @param newLowThreshold New low threshold (encrypted)
     * @param newHighThreshold New high threshold (encrypted)
     * @param inputProof Proof for encrypted inputs
     */
    function updateThresholds(
        externalEuint32 newLowThreshold,
        externalEuint32 newHighThreshold,
        bytes calldata inputProof
    ) external onlyOwner {
        lowThreshold = FHE.fromExternal(newLowThreshold, inputProof);
        highThreshold = FHE.fromExternal(newHighThreshold, inputProof);
        
        // Re-allow after update
        FHE.allowThis(lowThreshold);
        FHE.allowThis(highThreshold);
        
        emit ThresholdsUpdated(block.timestamp);
    }
    
    /**
     * @notice Grant access to encrypted statistics
     * @param recipient Address to grant access
     */
    function grantStatsAccess(address recipient) external onlyOwner {
        FHE.allow(totalDurationSum, recipient);
        FHE.allow(morningDurationSum, recipient);
        FHE.allow(eveningDurationSum, recipient);
        FHE.allow(lowThreshold, recipient);
        FHE.allow(highThreshold, recipient);
        
        emit StatsAccessGranted(recipient, block.timestamp);
    }
}

