# STX Stacking Pool

A Stacks smart contract that enables users to pool their STX tokens together to participate in Bitcoin yield farming through the Proof of Transfer (PoX) mechanism.

## Overview

The Stacking Pool contract allows STX holders to join forces to meet the minimum STX requirements for participating in Stacking cycles. By pooling resources, users who individually might not have enough STX to participate can collectively earn Bitcoin rewards proportionate to their contributed STX amount.

## Features

- **Pooled Stacking**: Combine STX tokens from multiple users to meet minimum requirements
- **Proportional Rewards**: Distribute BTC rewards based on each user's contribution percentage
- **Cycle Management**: Support for automated stacking cycle management
- **Fee Structure**: 5% platform fee on rewards for maintaining the pool
- **User Controls**: Deposit, withdraw, and claim rewards with full transparency
- **Admin Functions**: Contract owner can initialize cycles, start stacking, and handle rewards distribution

## How It Works

1. **Pool Initialization**: The contract owner initializes a new stacking cycle with parameters like start block
2. **User Deposits**: Users deposit STX to participate in the cycle (minimum 50 STX required)
3. **Stacking Activation**: When sufficient STX is pooled, the owner activates stacking through the PoX contract
4. **Reward Collection**: After the cycle completes, BTC rewards are collected (simulated with STX in this implementation)
5. **Reward Distribution**: Users can claim their share of rewards minus the platform fee
6. **Withdrawal**: After the cycle ends and stacking is unlocked, users can withdraw their original STX deposits

## Contract Functions

### Admin Functions

- `initialize-pool`: Start a new stacking cycle
- `start-stacking`: Begin the stacking process once sufficient STX is pooled
- `unlock-stacking`: Unlock stacking after a cycle ends
- `deposit-rewards`: Deposit rewards collected from stacking
- `withdraw-fees`: Withdraw collected platform fees
- `end-cycle`: Close the current stacking cycle
- `emergency-shutdown`: Emergency function to unlock funds in case of issues

### User Functions

- `deposit`: Deposit STX to participate in stacking
- `claim-rewards`: Claim proportional rewards after a cycle completes
- `withdraw`: Withdraw deposited STX after stacking unlocks

### Read-Only Functions

- `get-user-deposit`: Get a user's deposited amount
- `get-user-shares`: Get a user's shares in the pool
- `get-pool-status`: Get current status of the stacking pool
- `get-user-share-percentage`: Calculate user's percentage of the pool
- `get-user-pending-rewards`: Calculate user's pending rewards
- `has-claimed-rewards`: Check if user has claimed rewards for the current cycle
- `is-stacking-locked`: Check if stacking is currently locked

## Error Codes

- `ERR-NOT-AUTHORIZED` (u100): User not authorized for operation
- `ERR-POOL-INACTIVE` (u101): Pool is currently inactive
- `ERR-POOL-ACTIVE` (u102): Pool is already active
- `ERR-INVALID-AMOUNT` (u103): Invalid amount specified
- `ERR-TRANSFER-FAILED` (u104): STX transfer failed
- `ERR-STACKING-FAILED` (u105): Stacking operation failed
- `ERR-NO-FUNDS-TO-WITHDRAW` (u106): No funds available to withdraw
- `ERR-STILL-LOCKED` (u107): Funds are still locked in stacking
- `ERR-NOT-ELIGIBLE` (u108): User not eligible for operation
- `ERR-MIN-AMOUNT-REQUIRED` (u109): Minimum amount requirement not met
- `ERR-REWARDS-CLAIM-FAILED` (u110): Rewards claim failed
- `ERR-DISTRIBUTION-FAILED` (u111): Rewards distribution failed
- `ERR-ALREADY-CLAIMED` (u112): Rewards already claimed

## Development

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet): Development environment for Clarity smart contracts
- [Stacks CLI](https://docs.stacks.co/stacks-101/cli): Command-line interface for interacting with the Stacks blockchain

### Setup

1. Clone this repository
2. Install Clarinet and Stacks CLI
3. Run `clarinet integrate` to start a local development environment

### Testing

```bash
clarinet test
```

### Deployment

To deploy to Testnet:

```bash
clarinet deploy --testnet
```

To deploy to Mainnet:

```bash
clarinet deploy --mainnet
```

## Usage Examples

### Initialize a new stacking cycle

```clarity
(contract-call? .stacking-pool initialize-pool u100000 0x01234567890abcdef... u80000000)
```

### Deposit STX to the pool

```clarity
(contract-call? .stacking-pool deposit u50000000) ;; Deposit 50 STX
```

### Start stacking

```clarity
(contract-call? .stacking-pool start-stacking {version: 0x01, hashbytes: 0x1234567890abcdef...})
```

### Claim rewards

```clarity
(contract-call? .stacking-pool claim-rewards)
```

### Withdraw deposit after cycle ends

```clarity
(contract-call? .stacking-pool withdraw)
```

## Security Considerations

- The contract owner has significant control over the pool operations
- Funds are locked during active stacking periods
- The emergency shutdown function exists to handle unexpected issues
- No external contracts should be able to interact with this contract except the official PoX contract

## License

[Specify your license here]

## Disclaimer

This contract is provided as an example and should undergo thorough security auditing before being used in production.