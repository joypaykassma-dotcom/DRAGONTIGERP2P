# 🐉 APEX P2P Dragon Tiger - Complete System Architecture & Coding Logic

## 1. Executive Summary & Non-Custodial P2P Model
APEX Dragon Tiger is an online, peer-to-peer (P2P) live gaming exchange. Unlike conventional house-banked online casinos where players bet against the house (which creates an inherent conflict of interest), APEX operates on a **100% Peer-to-Peer Order-Matching Engine**:
- **Zero Bot Policy & Pristine Database (0 Base):** All automated bots, simulated betting loops, and mock player pools are completely deleted and purged. All databases, tables, user balances, histories, metrics, and room pools start at **0**. 100% of wagers, challenges, and chat interactions originate from authentic human players.
- **P2P Matching Engine Logic:** If one player bets ৳1,000 on Dragon and an opponent bets ৳800 on Tiger, ৳800 is matched 1v1. The remaining unmatched ৳200 is automatically refunded to the bettor's balance immediately upon betting close.
- The company acts exclusively as an escrow & cryptographic verification mediator, taking an industry-standard 5% platform commission solely on the net winning side of matched bets.

---

## 2. Mathematical Integrity & Provably Fair Cryptography
Every game round guarantees cryptographic transparency using standard SHA-256 commit-reveal mechanics:
1. **Server Seed Commit:** Prior to betting opening, the server generates a cryptographically secure random string (`serverSeed`) and calculates:
   $$\text{Seed Hash} = \text{SHA-256}(\text{serverSeed} + \text{roundId})$$
   This hash is broadcast to all clients in real-time before any card is cut.
2. **Card Determination:** 
   $$\text{Combined RNG Seed} = \text{SHA-256}(\text{serverSeed} + \text{clientSeed} + \text{nonce})$$
   The first 8 bytes determine the Dragon card index $(0..51)$, and the next 8 bytes determine the Tiger card index $(0..51)$.
3. **Card Rules & Rankings:**
   - Rank: $A=1, 2, 3, 4, 5, 6, 7, 8, 9, 10, J=11, Q=12, K=13$.
   - Suit Tie-Breakers: Spades $(\text{♠}) > \text{Hearts} (\text{♥}) > \text{Clubs} (\text{♣}) > \text{Diamonds} (\text{♦})$.
   - If both ranks are identical, a Tie outcome is declared.
4. **Non-Bettable Tie & 50% Tie Refund Rule:**
   - **Tie-তে বাজি সম্পূর্ণ নিষিদ্ধ (Strictly Non-Bettable):** Players cannot place bets on Tie. Only Dragon vs Tiger wagers are accepted across all lobbies, quick bets, duels, and interfaces.
   - **৫০% রিফান্ড বাস্তবায়ন:** When a Tie occurs, **50% of each player's wager is directly refunded back to their balance**, while 50% is routed to the audited company liquidity reserve fund.
   - **Zero House Edge / Zero Side-Bet Exploits:** Eliminating Tie bets completely removes manipulative side-bet house edges and preserves pure 1v1 P2P integrity.

---

## 3. Account Balances, Zero-Bonus Policy & Complete Financial Transparency
1. **Zero Database & Clean Slate Architecture:**
   - All user collections, credentials, bet logs, referral commissions, metrics, and room pools start at `0`.
   - Dynamic zero reset endpoint `POST /api/database/reset` provides immediate wiping of all user records, transaction logs, and balances.
2. **No Welcome Bonuses:**
   - No fake faucet credits or welcome gifts on registration or referral joining to preserve genuine cash accounting.
   - All balances represent actual deposited funds or peer-to-peer winnings.
3. **100% Financial & Account Transparency (Public User Directory & Ledger):**
   - **Public User Directory API (`GET /api/transparency/users`):** Every registered account, real balance, demo balance, locked escrow, games played, win rate, VIP tier, and referral state is 100% open and publicly viewable.
   - **Public User Detailed Inspection API (`GET /api/transparency/users/:targetUserId`):** Any user can inspect any other registered user's entire wagering history, round-by-round Provably Fair card records, complete financial ledger (deposits, withdrawals, P2P transfers sent/received, tie refunds), and referral network.
   - **Public Logged Transaction Types:**
     - `DEPOSIT`: User deposits via bKash, Nagad, Rocket, or Bank.
     - `WITHDRAW`: User cashouts and withdrawal records.
     - `TRANSFER_SENT` & `TRANSFER_RECEIVED`: Peer-to-peer fund transfers between users.
     - `TIE_REFUND`: Automatic 50% stake refunds on Tie game rounds.
     - `UNMATCHED_REFUND`: Automatic 100% wallet credit for unmatched P2P wager amounts when opponent pools differ.
   - **Bet History, Result & Payout Badge Tracking:** Every unmatched portion (`unmatchedAmount > 0`) is explicitly rendered directly inside the **Result / Payout column** alongside Win/Lost badges (e.g. `WIN +৳540` + `+৳400 UNMATCHED REFUND`), with dedicated filter tabs (`"অনম্যাচড ফেরত / UNMATCHED"`), cyan badges, and positive `+৳` wallet credit entries in Personal/Public Ledgers across Bet History, Live Bet Feed, and Public User Inspection drawers.
   - Accessible via **Top Header ("পাবলিক ইউজার লিস্ট")**, **Wallet Modal (Public Ledger Tab)**, and the **Transparency Charter Modal (Public User Registry Tab)**.

---

## 4. Peer-to-Peer (P2P) Fund Transfer Engine ("Send Money")
- **Endpoint:** `POST /api/wallet/transfer`
- **Validation:**
  - Sender must have sufficient balance (`balance >= amount`).
  - Target recipient identified by Username or User ID.
  - Prevents self-transfers (`recipient !== sender`).
- **Atomic Execution:**
  - Deducts `amount` from sender's balance.
  - Adds `amount` to recipient's balance.
  - Generates transaction logs in sender history, recipient history, and platform-wide public ledger.

---

## 5. Real-Time Synchronous Multiplayer Betting & Dual-Channel Live Chat
1. **Synchronous Multi-User Betting:**
   - All connected players place wagers simultaneously in real-time.
   - Every round's orderbook aggregates live Dragon vs Tiger stakes in milliseconds.
   - The **Live Transparency & Bet Feed** streams bets from all active players immediately.
2. **Dual-Channel Live Player Lounge Chat:**
   - Hybrid **WebSocket + REST Polling Sync** (`/api/chat/messages` and `/api/chat/send`) ensures zero dropped messages, even across firewalled or iframed browser environments.
   - Chat broadcasts player actions, streaks, and user messages with VIP badges.

---

## 6. Responsive UI & Mobile Vertical Stack Layout
1. **Mobile Vertical Stack Layout (`GameTable`):**
   - On mobile devices (`< md`), Dragon and Tiger arenas stack vertically (`flex flex-col md:grid md:grid-cols-2`), giving each side full touch width.
   - High-contrast card displays with flip animations.
   - Distinct Pool volume counters and oversized interactive bet zones.
2. **Anti-Overlap & Accessible Controls:**
   - Chip selectors formatted in horizontal scrollable containers with 44px+ touch targets.
   - Action buttons (Repeat Bet, 2x Double, Auto Bet, Clear Bets, Confirm Bet) configured in a responsive 2x2 grid + full-width Confirm button on mobile.
   - Zero overlapping buttons or truncated balance displays.
3. **Adaptive Header, Responsive Micro-Layout & Zero-Overflow Engine:**
   - Header container uses `w-full max-w-full overflow-hidden bg-[#0B0E14]/95 backdrop-blur-xl` with sticky placement and fluid gaps (`gap-1 sm:gap-3`).
   - Mobile Viewports (`< 640px`): Automatically compresses header elements by showing compact balance numbers (`৳10,000`), icon-based quick deposit (`⚡ Deposit`), truncated table drop-down (`⚡ Express ▾`), and placing sub-nav links inside the slide-down drawer (`< lg`).
   - Tablet & Small Laptop Viewports (`640px–1024px`): Shows main navigation tabs (`Live Arena`, `1v1 Duels`, `Leaderboard`) at `lg:flex` (1024px+), while user profile stats hide gracefully on smaller screens.
   - Large Desktop Viewports (`1280px+`): Displays full user profile card, active streak counter, and quick action tools (Provably Fair, Shoe Roadmap, Mute/Voice, Bet History, Site Liquidity) without line wraps or side-scrolling.

---

## 7. P2P Referral & Affiliate RevShare Engine
### Mathematical RevShare Formulation
Since the house does not take losses from players, referral commissions are funded directly out of the platform's 5% duel commission:
- **Platform Fee:** $F = \text{Matched Stake} \times 5\%$
- **Affiliate RevShare Rate ($R$):** Determined by Tier:
  - **Bronze (1–5 friends):** $20\%$ of company fee ($1.0\%$ of matched stake)
  - **Silver (6–15 friends):** $30\%$ of company fee ($1.5\%$ of matched stake)
  - **Gold (16–50 friends):** $40\%$ of company fee ($2.0\%$ of matched stake)
  - **Diamond (50+ friends):** $50\%$ of company fee ($2.5\%$ of matched stake)
- **Commission Formula:**
  $$\text{Affiliate Commission} = F \times R = (\text{Matched Stake} \times 0.05) \times R$$

### Solvency Guarantee
Because commission is a fixed subset of collected revenue ($20\% - 50\%$ of $5\%$), the platform maintains a 100% mathematical surplus with zero risk of deficit.

---

## 8. Total Company Profit & Real-Time Rake Accounting Engine
1. **Mathematical Profit Sources:**
   - **5% P2P Match Fee:** Collected strictly on net winning side of matched wagers:
     $$\text{Match Revenue} = \text{Matched Pool} \times 2 \times 5\%$$
   - **50% Tie Fund Retention:** When cards tie, 50% is refunded to players and 50% is routed to company reserve:
     $$\text{Tie Revenue} = \text{Matched Pool} \times 2 \times 50\%$$
   - **Total Company Profit:**
     $$\text{Total Profit} = \text{Match Revenue} + \text{Tie Revenue}$$
2. **Real-Time Visibility:**
   - Exposed via `/api/site/liquidity` (`todayCommission`, `todayTieRevenue`, `todayMatchedVolume`).
   - Rendered live in **Site Liquidity Modal (`SiteLiquidityModal.tsx`)** and **Transparency Charter Modal (`TransparencyCharterModal.tsx`)**.

---

## 9. Dynamic Build Versioning
- **Format:** `yyyy.MM.dd.HH.mm` (e.g. `2026.09.23.13.54`)
- Displayed prominently in the top right corner of the Login Screen.
- Auto-updated upon every successful deployment and compile.

---

## 10. Minimalist High-End Arena UI & Zero-Clutter Layout Engine
1. **Collapsed Onboarding Banners:**
   - The bulky 3-Step Beginner Guide box has been removed from the main arena hero view (`showQuickGuide` defaults to `false`). Full guides and rules are accessible via the right sidebar "Guide" tab and the top "Rules" modal.
2. **Decluttered Battle Zone & Clean Affordances:**
   - Removed intrusive helper text cues (`👉 চাপুন: ...`, `👉 ধাপ ৩: ...`) across betting cards and action bars.
   - Cleaned up Dragon & Tiger pools to show concise wager multipliers (`+৳100`, `৳100 ➔ ৳190`).
   - Simplified the Tie outcome alert bar into an elegant, non-obtrusive status badge (`TIE | 50% Refund`).
3. **Streamlined Chip & Action Dock:**
   - Formatted the chip selection toolbar with high contrast `SELECT CHIP:` label and circular touch chips.
   - Action buttons (Repeat, 2x Double, Auto Bet, Clear, Confirm) organized in a dark glass dock with zero clutter.
4. **Targeted Focused Elements Decluttering:**
   - Top Croupier Live Banner condensed into a single slim 1-line bar, moving voice/SFX toggles into icon buttons and Audio modal dropdown.
   - Beginner 3-step guide box strictly hidden when inactive (`showQuickGuide === false`), freeing full vertical viewport for live card dealing table.
   - Sidebar tab selection dock refined with high-contrast active tabs (`Guide`, `Action`, `Tk Return`, `Chat`, `Trend`).
5. **Responsive Dropdown Overflow Protection:**
   - Modified the mobile/tablet compact table dropdown trigger button (`selectedTable` switcher in header) to use modern adaptive styling `hidden min-[360px]:flex lg:hidden` with strict character-based content truncating (`max-w-[60px]`). This completely prevents physical layout overlaps and side-scrolling on ultra-narrow mobile viewports (e.g. <360px) while maintaining access through the drawer menu.

---

## 11. Robust Session Integrity & API Error Resilience
1. **Content-Type & Payload Validation:**
   - Frontend `fetchUser` polling now strictly validates response headers for `application/json` and verifies that the payload contains a valid `userId`.
   - Prevents JSON parsing exceptions (`Unexpected token '<'`) caused by unhandled route redirection returning fallback HTML (`index.html`) in Express or Vite middleware.
2. **Graceful Failover Routing:**
   - Any corrupt or empty session states (`userId === "undefined"`) automatically trigger `handleLogout` to reset the active viewport.
   - Server-side auto-generation maps user profiles dynamically on mount even across system restarts or server refreshes.
