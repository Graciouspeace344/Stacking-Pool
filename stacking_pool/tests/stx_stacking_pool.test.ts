import { describe, expect, it, beforeEach, vi } from "vitest";

// Mock implementations of the contract functions
const mockContract = {
  poolActive: false,
  totalStacked: 0,
  cycleStartBlock: 0,
  cycleEndBlock: 0,
  stackingUnlocked: false,
  rewardsReceived: 0,
  feesCollected: 0,
  currentBlock: 10000,
  minParticipationAmount: 50_000_000, // 50 STX in micro-STX
  platformFeePercent: 5, // 5%
  cycleLength: 2100, // blocks
  
  // Maps
  userDeposits: new Map<string, number>(),
  userShares: new Map<string, number>(),
  lastUserRewards: new Map<string, number>(),
  rewardsClaimed: new Map<string, boolean>(),
  
  // Contract owner
  contractOwner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  
  // Oracles
  oracles: ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"],
  
  // Functions
  initializePool(sender: string, startBlock: number, btcRewardAddr: string, minStx: number) {
    if (sender !== this.contractOwner) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }
    
    if (this.poolActive) {
      return { success: false, error: "ERR-POOL-ACTIVE" };
    }
    
    this.poolActive = true;
    this.cycleStartBlock = startBlock;
    this.cycleEndBlock = startBlock + this.cycleLength;
    this.stackingUnlocked = false;
    this.rewardsReceived = 0;
    
    return { success: true };
  },
  
  deposit(sender: string, amount: number) {
    if (!this.poolActive) {
      return { success: false, error: "ERR-POOL-INACTIVE" };
    }
    
    if (amount < this.minParticipationAmount) {
      return { success: false, error: "ERR-MIN-AMOUNT-REQUIRED" };
    }
    
    if (amount <= 0) {
      return { success: false, error: "ERR-INVALID-AMOUNT" };
    }
    
    const currentDeposit = this.userDeposits.get(sender) || 0;
    const newDepositAmount = currentDeposit + amount;
    
    this.userDeposits.set(sender, newDepositAmount);
    this.userShares.set(sender, newDepositAmount);
    this.totalStacked += amount;
    
    return { success: true, value: newDepositAmount };
  },
  
  getPoolStatus() {
    return {
      active: this.poolActive,
      totalStacked: this.totalStacked,
      cycleStartBlock: this.cycleStartBlock,
      cycleEndBlock: this.cycleEndBlock,
      stackingUnlocked: this.stackingUnlocked,
      rewardsReceived: this.rewardsReceived
    };
  },
  
  getUserDeposit(user: string) {
    return this.userDeposits.get(user) || 0;
  },
  
  getUserShares(user: string) {
    return this.userShares.get(user) || 0;
  },
  
  getUserSharePercentage(user: string) {
    const userDeposit = this.userDeposits.get(user) || 0;
    
    if (userDeposit === 0 || this.totalStacked === 0) {
      return 0;
    }
    
    // Return basis points (1/100 of 1%)
    return Math.floor((userDeposit * 10000) / this.totalStacked);
  },
  
  startStacking(sender: string, poxAddr: any) {
    if (sender !== this.contractOwner) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }
    
    if (!this.poolActive) {
      return { success: false, error: "ERR-POOL-INACTIVE" };
    }
    
    // Simulate successful stacking
    return { success: true };
  },
  
  unlockStacking(sender: string) {
    if (sender !== this.contractOwner) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }
    
    if (!this.poolActive) {
      return { success: false, error: "ERR-POOL-INACTIVE" };
    }
    
    if (this.currentBlock < this.cycleEndBlock) {
      return { success: false, error: "ERR-STILL-LOCKED" };
    }
    
    if (this.stackingUnlocked) {
      return { success: false, error: "ERR-POOL-INACTIVE" };
    }
    
    this.stackingUnlocked = true;
    return { success: true };
  },
  
  depositRewards(sender: string, amount: number) {
    if (sender !== this.contractOwner) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }
    
    if (!this.poolActive) {
      return { success: false, error: "ERR-POOL-INACTIVE" };
    }
    
    if (amount <= 0) {
      return { success: false, error: "ERR-INVALID-AMOUNT" };
    }
    
    this.rewardsReceived += amount;
    return { success: true, value: amount };
  },
  
  getUserPendingRewards(user: string) {
    const sharePercentage = this.getUserSharePercentage(user);
    
    if (sharePercentage === 0) {
      return 0;
    }
    
    const userPortion = (this.rewardsReceived * sharePercentage) / 10000;
    const feeAmount = (userPortion * this.platformFeePercent) / 100;
    return userPortion - feeAmount;
  },
  
  hasClaimedRewards(user: string) {
    const key = `${user}-${this.cycleStartBlock}`;
    return this.rewardsClaimed.get(key) || false;
  },
  
  claimRewards(sender: string) {
    if (!this.poolActive) {
      return { success: false, error: "ERR-POOL-INACTIVE" };
    }
    
    const userRewards = this.getUserPendingRewards(sender);
    if (userRewards <= 0) {
      return { success: false, error: "ERR-NO-FUNDS-TO-WITHDRAW" };
    }
    
    const key = `${sender}-${this.cycleStartBlock}`;
    if (this.rewardsClaimed.get(key)) {
      return { success: false, error: "ERR-ALREADY-CLAIMED" };
    }
    
    // Mark as claimed
    this.rewardsClaimed.set(key, true);
    
    // Update fees collected
    const feeAmount = (userRewards * this.platformFeePercent) / 100;
    this.feesCollected += feeAmount;
    
    // Save last claimed rewards
    this.lastUserRewards.set(sender, userRewards);
    
    return { success: true, value: userRewards };
  },
  
  withdraw(sender: string) {
    if (!this.stackingUnlocked) {
      return { success: false, error: "ERR-STILL-LOCKED" };
    }
    
    const userDeposit = this.userDeposits.get(sender) || 0;
    if (userDeposit <= 0) {
      return { success: false, error: "ERR-NO-FUNDS-TO-WITHDRAW" };
    }
    
    // Reset user deposit and shares
    this.userDeposits.set(sender, 0);
    this.userShares.set(sender, 0);
    
    return { success: true, value: userDeposit };
  },
  
  withdrawFees(sender: string) {
    if (sender !== this.contractOwner) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }
    
    if (this.feesCollected <= 0) {
      return { success: false, error: "ERR-NO-FUNDS-TO-WITHDRAW" };
    }
    
    const feeAmount = this.feesCollected;
    this.feesCollected = 0;
    
    return { success: true, value: feeAmount };
  },
  
  emergencyShutdown(sender: string) {
    if (sender !== this.contractOwner) {
      return { success: false, error: "ERR-NOT-AUTHORIZED" };
    }
    
    this.poolActive = false;
    this.stackingUnlocked = true;
    
    return { success: true };
  },
  
  // Helper for tests to advance blockchain
  advanceBlocks(count: number) {
    this.currentBlock += count;
  }
};

describe('Stacking Pool Contract Test Suite', () => {
  const CONTRACT_OWNER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
  const USER1 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
  const USER2 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";
  const USER3 = "ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND";
  
  // Helper function to convert STX to micro-STX
  const stx = (amount: number) => amount * 1_000_000;
  
  beforeEach(() => {
    // Reset contract state before each test
    mockContract.poolActive = false;
    mockContract.totalStacked = 0;
    mockContract.cycleStartBlock = 0;
    mockContract.cycleEndBlock = 0;
    mockContract.stackingUnlocked = false;
    mockContract.rewardsReceived = 0;
    mockContract.feesCollected = 0;
    mockContract.currentBlock = 10000;
    mockContract.userDeposits = new Map();
    mockContract.userShares = new Map();
    mockContract.lastUserRewards = new Map();
    mockContract.rewardsClaimed = new Map();
  });

  it('Contract owner should be able to initialize the pool', () => {
    const startBlock = 10000;
    const btcAddress = "0x0123456789abcdef";
    const minStx = stx(80000);
    
    const result = mockContract.initializePool(CONTRACT_OWNER, startBlock, btcAddress, minStx);
    expect(result.success).toBe(true);
    
    const poolStatus = mockContract.getPoolStatus();
    expect(poolStatus.active).toBe(true);
    expect(poolStatus.cycleStartBlock).toBe(startBlock);
    expect(poolStatus.cycleEndBlock).toBe(startBlock + mockContract.cycleLength);
    expect(poolStatus.stackingUnlocked).toBe(false);
    expect(poolStatus.rewardsReceived).toBe(0);
  });
  
  it('User should be able to deposit STX to the pool', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // User 1 deposits 100 STX
    const depositAmount = stx(100);
    const result = mockContract.deposit(USER1, depositAmount);
    
    expect(result.success).toBe(true);
    expect(result.value).toBe(depositAmount);
    
    // Verify user deposit
    const userDeposit = mockContract.getUserDeposit(USER1);
    expect(userDeposit).toBe(depositAmount);
    
    // Verify user shares
    const userShares = mockContract.getUserShares(USER1);
    expect(userShares).toBe(depositAmount);
  });
  
  it('Should fail if deposit amount is below minimum', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // Try to deposit 40 STX (below minimum of 50)
    const depositAmount = stx(40);
    const result = mockContract.deposit(USER1, depositAmount);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('ERR-MIN-AMOUNT-REQUIRED');
  });
  
  it('Multiple users can deposit and get correct share percentages', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // User 1 deposits 100 STX
    mockContract.deposit(USER1, stx(100));
    
    // User 2 deposits 200 STX
    mockContract.deposit(USER2, stx(200));
    
    // User 3 deposits 300 STX
    mockContract.deposit(USER3, stx(300));
    
    // Check total stacked
    const poolStatus = mockContract.getPoolStatus();
    expect(poolStatus.totalStacked).toBe(stx(600)); // 100 + 200 + 300 = 600 STX
    
    // Check user 1 percentage (should be 16.67% = 1667 basis points)
    const user1Percentage = mockContract.getUserSharePercentage(USER1);
    expect(user1Percentage).toBeGreaterThanOrEqual(1666);
    expect(user1Percentage).toBeLessThanOrEqual(1667);
    
    // Check user 2 percentage (should be 33.33% = 3333 basis points)
    const user2Percentage = mockContract.getUserSharePercentage(USER2);
    expect(user2Percentage).toBeGreaterThanOrEqual(3333);
    expect(user2Percentage).toBeLessThanOrEqual(3334);
    
    // Check user 3 percentage (should be 50% = 5000 basis points)
    const user3Percentage = mockContract.getUserSharePercentage(USER3);
    expect(user3Percentage).toBe(5000); // Exactly 50%
  });
  
  it('Contract owner should be able to start stacking', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // Users deposit enough STX to meet minimum
    mockContract.deposit(USER1, stx(40000));
    mockContract.deposit(USER2, stx(40000));
    
    // Start stacking
    const poxAddress = { version: "0x01", hashbytes: "0x1234567890abcdef" };
    const result = mockContract.startStacking(CONTRACT_OWNER, poxAddress);
    
    expect(result.success).toBe(true);
  });
  
  it('Users should be able to claim rewards', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // User deposits
    mockContract.deposit(USER1, stx(50000));
    mockContract.deposit(USER2, stx(50000));
    
    // Start stacking
    const poxAddress = { version: "0x01", hashbytes: "0x1234567890abcdef" };
    mockContract.startStacking(CONTRACT_OWNER, poxAddress);
    
    // Advance blocks to end of stacking period
    mockContract.advanceBlocks(mockContract.cycleLength + 1);
    
    // Unlock stacking
    mockContract.unlockStacking(CONTRACT_OWNER);
    
    // Deposit rewards (100 STX as mock BTC rewards)
    mockContract.depositRewards(CONTRACT_OWNER, stx(100));
    
    // Check user1's pending rewards
    const pendingRewards = mockContract.getUserPendingRewards(USER1);
    
    // User1 should get 50% of rewards minus 5% fee
    // 50 STX - 2.5 STX fee = 47.5 STX
    const expectedRewards = stx(47.5);
    expect(pendingRewards).toBe(expectedRewards);
    
    // User1 claims rewards
    const claimResult = mockContract.claimRewards(USER1);
    expect(claimResult.success).toBe(true);
    
    // User1 should not be able to claim twice
    const secondClaimResult = mockContract.claimRewards(USER1);
    expect(secondClaimResult.success).toBe(false);
    expect(secondClaimResult.error).toBe('ERR-ALREADY-CLAIMED');
  });
  
  it('Users should be able to withdraw after stacking period', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // User deposits
    const depositAmount = stx(50000);
    mockContract.deposit(USER1, depositAmount);
    
    // Start stacking
    const poxAddress = { version: "0x01", hashbytes: "0x1234567890abcdef" };
    mockContract.startStacking(CONTRACT_OWNER, poxAddress);
    
    // Try to withdraw before unlock (should fail)
    const earlyWithdrawResult = mockContract.withdraw(USER1);
    expect(earlyWithdrawResult.success).toBe(false);
    expect(earlyWithdrawResult.error).toBe('ERR-STILL-LOCKED');
    
    // Advance blocks to end of stacking period
    mockContract.advanceBlocks(mockContract.cycleLength + 1);
    
    // Unlock stacking
    mockContract.unlockStacking(CONTRACT_OWNER);
    
    // Now withdraw should succeed
    const withdrawResult = mockContract.withdraw(USER1);
    expect(withdrawResult.success).toBe(true);
    expect(withdrawResult.value).toBe(depositAmount);
    
    // User deposit should be reset
    const userDeposit = mockContract.getUserDeposit(USER1);
    expect(userDeposit).toBe(0);
  });
  
  it('Contract owner should be able to withdraw fees', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // User deposits
    mockContract.deposit(USER1, stx(50000));
    mockContract.deposit(USER2, stx(50000));
    
    // Start stacking
    const poxAddress = { version: "0x01", hashbytes: "0x1234567890abcdef" };
    mockContract.startStacking(CONTRACT_OWNER, poxAddress);
    
    // Advance blocks to end of stacking period
    mockContract.advanceBlocks(mockContract.cycleLength + 1);
    
    // Unlock stacking
    mockContract.unlockStacking(CONTRACT_OWNER);
    
    // Deposit rewards (100 STX as mock BTC rewards)
    mockContract.depositRewards(CONTRACT_OWNER, stx(100));
    
    // Users claim rewards to generate fees
    mockContract.claimRewards(USER1);
    mockContract.claimRewards(USER2);
    
    // Owner withdraws fees
    const withdrawFeesResult = mockContract.withdrawFees(CONTRACT_OWNER);
    expect(withdrawFeesResult.success).toBe(true);
    
    // Should have collected 5% of 100 STX = 5 STX in fees
    const expectedFees = stx(5);
    expect(withdrawFeesResult.value).toBe(expectedFees);
  });
  
  it('Emergency shutdown should work', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // User deposits
    mockContract.deposit(USER1, stx(50000));
    
    // Emergency shutdown
    const shutdownResult = mockContract.emergencyShutdown(CONTRACT_OWNER);
    expect(shutdownResult.success).toBe(true);
    
    // Pool should be inactive but unlocked
    const poolStatus = mockContract.getPoolStatus();
    expect(poolStatus.active).toBe(false);
    expect(poolStatus.stackingUnlocked).toBe(true);
    
    // User should be able to withdraw
    const withdrawResult = mockContract.withdraw(USER1);
    expect(withdrawResult.success).toBe(true);
  });
  
  it('Should prevent non-owners from initializing the pool', () => {
    const result = mockContract.initializePool(USER1, 10000, "0x0123456789abcdef", stx(80000));
    expect(result.success).toBe(false);
    expect(result.error).toBe('ERR-NOT-AUTHORIZED');
  });
  
  it('Should prevent deposits when pool is inactive', () => {
    // Don't initialize the pool
    const result = mockContract.deposit(USER1, stx(100));
    expect(result.success).toBe(false);
    expect(result.error).toBe('ERR-POOL-INACTIVE');
  });
  
  it('Should calculate fees correctly for different reward amounts', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // Setup: one user with all shares
    mockContract.deposit(USER1, stx(100000));
    
    // Start stacking
    mockContract.startStacking(CONTRACT_OWNER, { version: "0x01", hashbytes: "0x1234567890abcdef" });
    
    // Advance blocks and unlock
    mockContract.advanceBlocks(mockContract.cycleLength + 1);
    mockContract.unlockStacking(CONTRACT_OWNER);
    
    // Test with 100 STX rewards
    mockContract.depositRewards(CONTRACT_OWNER, stx(100));
    let pendingRewards = mockContract.getUserPendingRewards(USER1);
    expect(pendingRewards).toBe(stx(95)); // 100 STX - 5% fee = 95 STX
    
    // Reset and test with 1000 STX
    mockContract.rewardsReceived = 0;
    mockContract.depositRewards(CONTRACT_OWNER, stx(1000));
    pendingRewards = mockContract.getUserPendingRewards(USER1);
    expect(pendingRewards).toBe(stx(950)); // 1000 STX - 5% fee = 950 STX
  });
  
  it('Should handle edge case of zero shares correctly', () => {
    // Initialize pool
    mockContract.initializePool(CONTRACT_OWNER, 10000, "0x0123456789abcdef", stx(80000));
    
    // Check share percentage for user with no deposit
    const sharePercentage = mockContract.getUserSharePercentage(USER1);
    expect(sharePercentage).toBe(0);
    
    // Check pending rewards for user with no deposit
    const pendingRewards = mockContract.getUserPendingRewards(USER1);
    expect(pendingRewards).toBe(0);
  });
});