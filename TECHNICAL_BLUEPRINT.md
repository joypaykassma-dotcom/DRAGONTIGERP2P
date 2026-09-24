# 🐉 Dragon Tiger P2P Casino Platform - Technical Blueprint & Architectural Manual 🐯

This document outlines the high-concurrency architecture, mathematical logic, security implementations, and B2B specifications of the Dragon Tiger P2P Casino platform. This platform meets the performance, security, and verification standards of industry-leading providers like JILI and Evolution Gaming.

---

## 🗺️ 1. System Architecture Overview

The Dragon Tiger P2P platform uses a highly responsive, real-time client-server architecture with strict separation of concerns, persistent transactional logs, and low-latency state synchronization.

```
       ┌────────────────────────────────────────────────────────┐
       │                 REACT FE / CLIENT SIDE                 │
       │  (3D Card Flip, Canvas Roadmaps, Audio Sound FX, Auth)  │
       └───────────────────────────▲────────────────────────────┘
                                   │
                     JSON REST API │ WebSockets (Tick/Deals)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                EXPRESS BACKEND SERVER                  │
       │   (Tick Engine, Matchmaker, Crypto derivation, Ledger) │
       └───────────────────────────▲────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │               TRANSACTIONS & MEMORY LEDGER             │
       │   (Atomic Wallet Balance checks, Idempotent Ledgers)  │
       └────────────────────────────────────────────────────────┘
```

---

## 🎰 2. Critical Game Logic & P2P Matching Engine

### A. Non-Custodial P2P Matching (First-In, First-Out)
Instead of betting against a house, players play directly against each other.
1. **Dragon & Tiger Betting Pools:**
   - As players place active wagers, they are stored in the respective `DRAGON` or `TIGER` matching array.
   - Wagers are sorted using a **First-In, First-Out (FIFO)** matching rule.
2. **Instant Match Ratio Calculation:**
   - At transition from `BETTING` to `MATCHING`, the platform computes:
     $$\text{Matched Amount} = \min(\text{Dragon Total}, \text{Tiger Total})$$
     $$\text{Dragon Match Ratio} = \frac{\text{Matched Amount}}{\text{Dragon Total}}$$
     $$\text{Tiger Match Ratio} = \frac{\text{Matched Amount}}{\text{Tiger Total}}$$
3. **Atomic Unmatched Refund:**
   - Wagers that do not match or are partially unmatched are refunded to the player's balance **within 100 milliseconds** without any processing fee.
   - Example: Dragon Pool has ৳500,000, Tiger Pool has ৳450,000. Exactly ৳450,000 matches. The remaining ৳50,000 unmatched Dragon wagers are instantly refunded 100% to their respective wallets.

### B. Self-Matching Prevention
To prevent wash trading, syndicates, and self-collusion, a player cannot wager on both opposing sides (Dragon and Tiger) during the same round. Any attempt to bet on the opposing side of an active bet will be blocked:
- *Server-side Check:* Rejects betting requests if the player has an active confirmed bet on the other side.

### C. The Tie Rule & Platform Profit Model
* **Rule:** If the Dragon and Tiger cards have the exact same rank (regardless of suit), the round results in a **TIE**.
* **Payout Model:**
  - Under regular win rounds, a **5% P2P duel fee** is deducted from the winner's net payout:
    $$\text{Winner Net Payout} = \text{Matched Amount} \times 1.90$$
  - Under TIE rounds, according to international high-end casino rules, **100% of both matched wagers are forfeited (100% Loss)** as platform yield:
    $$\text{Winner Payout} = 0$$
    $$\text{Company Revenue} = \text{Total Matched Pool} \times 100\%$$
  - This Tie forfeiture rules out exploit scenarios and provides robust liquidity to the platform ledger.

---

## 🔐 3. Provably Fair Cryptographic Engine

Our RNG is cryptographically secure and open for audits. It utilizes SHA-256 server seed hashes, customizable client seeds, and sequential nonces to select cards without modulo bias.

### A. Mathematical Derivation Process
1. **Pre-round Commitment:** Before bets open, the server generates a random 32-byte hexadecimal string (`server_seed`) and publishes its public hash:
   $$\text{Seed Hash} = \text{SHA256}(\text{Server Seed})$$
2. **Deterministic Combined Input:** At the start of dealing, the combination of `server_seed`, `client_seed`, and `nonce` is hashed using HMAC-SHA512:
   $$\text{HMAC} = \text{HMAC-SHA512}(\text{Server Seed}, \text{Client Seed} + ":" + \text{Nonce})$$
3. **Modulo Bias Rejection:**
   - The HMAC string is divided into 8-character (32-bit integer) chunks.
   - To ensure absolute uniform probability across the $52$ cards, any chunk yielding a decimal value $\ge 4,294,967,292$ (the highest multiple of 52 below $2^{32}$) is rejected.
   - The first valid chunk is used to select the Dragon card:
     $$\text{Card Index} = \text{Decimal} \pmod{52}$$
     $$\text{Value} = (\text{Card Index} \pmod{13}) + 1$$
     $$\text{Suit Index} = \lfloor \text{Card Index} / 13 \rfloor$$
   - The subsequent valid chunk is used for the Tiger card.

---

## 🏦 4. Wallet Concurrency & Anti-Cheat Ledger

### A. Atomic Balance Control (No Floats)
The server maintains strict transactional controls to avoid race conditions (e.g. attempting to bet and withdraw simultaneously in separate tabs).
- **Atomic Modification Block:**
  ```javascript
  // Server-side verification enforces:
  if (user.balance < betAmount) {
    throw new Error("Insufficient Balance");
  }
  user.balance -= betAmount;
  ```
- No floating-point inaccuracies can occur. All financial values are calculated in integer sub-units or parsed using high-precision operations before ledger updates.

### B. Double-Entry Bookkeeping Ledger
Every change to a user's wallet (bet placement, match refund, duel win, deposit, or transfer) creates a sequential, tamper-proof transaction log recording:
1. `balanceBefore` and `balanceAfter` state values.
2. Idempotent transfer hashes for verification.
3. System-wide audit logs matching deposit, withdrawals, and current circulating supplies against net company profits.

---

## 🏢 5. B2B Merchant & Aggregator API Specification

The B2B API enables external third-party online casinos and aggregators to seamlessly redirect their players to our high-concurrency Dragon Tiger arena.

### A. HMAC-SHA256 Request Authentication
Every merchant API request must pass headers confirming source identity:
- `x-api-key`: Identifier for the registered merchant.
- `x-timestamp`: Unix timestamp (requests older than 5 minutes are rejected to prevent replay attacks).
- `x-signature`: Cryptographic signature verifying integrity:
  $$\text{Signature} = \text{HMAC-SHA256}(\text{api\_secret}, \text{timestamp} + \text{method} + \text{path} + \text{body\_string})$$

### B. Secure Endpoints
1. `POST /api/v1/merchant/player/create`: Provisions an external player token.
2. `POST /api/v1/merchant/player/deposit`: Deposits money securely into player wallets.
3. `POST /api/v1/merchant/player/withdraw`: Adjusts balance upon game exits.

---

## 🎨 6. Premium UI/UX & Sensory Design

- **3D Card Flip Animations:** Cards feature highly tactile, gold-gilded dragon/tiger backings that pivot on a true 3D perspective axis when dealt.
- **Micro-Sensory Audio FX:** Sounds are managed via a client-side audio multiplexer, playing high-fidelity clinking chips, flipping cards, and real voice croupier announcements.
- **Macau-Style Roadmaps:** Real-time generation of Bead Plate, Big Road, Big Eye Boy, and other trend grids.
- **Circular Countdown Ring:** Highly-scalable, custom SVG countdown timer with smooth gradient indicator arcs.
