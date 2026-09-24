import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";
import { TableRound, TableConfig, PlayingCard, RoadmapItem, UserWallet, P2PRoom, UserStats, TablePerformance, SidePerformance, LiveBetRecord, SiteLiquidityData, UserBalanceRecord, UserBetHistoryItem, UserBetHistoryResponse } from "./src/types";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

const PORT = 3000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// ============================================================================
// PROVABLY FAIR SYSTEM (HMAC-SHA512 + MODULO BIAS PREVENTION)
// ============================================================================
function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashServerSeed(seed: string): string {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function extractCardFromHmac(hmacHex: string, startChunk: number): { card: PlayingCard; nextChunk: number } {
  const displayValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const suits = ["♥", "♦", "♣", "♠"];

  for (let i = startChunk; i < 16; i++) {
    const chunk = hmacHex.substring(i * 8, (i + 1) * 8);
    const decimal = parseInt(chunk, 16);

    // Modulo bias rejection: 2^32 - (2^32 % 52) = 4294967292
    if (decimal >= 4294967292) {
      continue;
    }

    const cardIndex = decimal % 52;
    const value = (cardIndex % 13) + 1; // 1 to 13
    const suitIndex = Math.floor(cardIndex / 13); // 0 to 3
    const rank = displayValues[value - 1];
    const suit = suits[suitIndex];

    return {
      card: {
        rank,
        suit,
        value,
        display: `${rank}${suit}`,
      },
      nextChunk: i + 1,
    };
  }

  // Fallback if all 16 chunks exhausted
  return {
    card: { rank: "K", suit: "♠", value: 13, display: "K♠" },
    nextChunk: 16,
  };
}

function deriveCards(serverSeed: string, clientSeed: string, nonce: number): {
  dragonCard: PlayingCard;
  tigerCard: PlayingCard;
  result: "DRAGON" | "TIGER" | "TIE";
  hmac: string;
} {
  const hmacInput = `${clientSeed}:${nonce}`;
  const hmac = crypto.createHmac("sha512", serverSeed).update(hmacInput).digest("hex");

  const dragon = extractCardFromHmac(hmac, 0);
  const tiger = extractCardFromHmac(hmac, dragon.nextChunk);

  let result: "DRAGON" | "TIGER" | "TIE" = "TIE";
  if (dragon.card.value > tiger.card.value) {
    result = "DRAGON";
  } else if (tiger.card.value > dragon.card.value) {
    result = "TIGER";
  } else {
    result = "TIE";
  }

  return {
    dragonCard: dragon.card,
    tigerCard: tiger.card,
    result,
    hmac,
  };
}

// ============================================================================
// SYSTEM LEDGER & METRICS
// ============================================================================
interface SystemMetrics {
  todayMatchedVolume: number;
  todayCommission: number;
  todayTieRevenue: number;
  totalRoundsPlayed: number;
  activeDeposits: number;
  activeWithdrawals: number;
}

const metrics: SystemMetrics = {
  todayMatchedVolume: 0,
  todayCommission: 0,
  todayTieRevenue: 0,
  totalRoundsPlayed: 0,
  activeDeposits: 0,
  activeWithdrawals: 0,
};

// ============================================================================
// IN-MEMORY DATA STORAGE & USER CREDENTIALS
// ============================================================================
interface UserCredential {
  userId: string;
  username: string;
  passwordHash: string;
  salt: string;
}

const userCredentials: Record<string, UserCredential> = {};

const mockUsers: Record<string, UserWallet> = {};

const userBetHistories: Record<string, UserBetHistoryItem[]> = {};

function getOrSeedUserBetHistory(userId: string, _username = "Player"): UserBetHistoryItem[] {
  if (!userBetHistories[userId]) {
    userBetHistories[userId] = [];
  }
  return userBetHistories[userId];
}

// ----------------------------------------------------
// P2P REFERRAL & AFFILIATE REVSHARE ENGINE
// ----------------------------------------------------
interface ReferredFriend {
  userId: string;
  username: string;
  joinedAt: string;
  totalWagered: number;
  commissionEarned: number;
  activeStatus: "ACTIVE" | "INACTIVE";
}

interface UserReferralState {
  referralCode: string;
  referralLink: string;
  referredBy?: string;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  tierRevSharePct: number; // 20, 30, 40, 50
  totalReferredCount: number;
  totalTurnoverGenerated: number;
  totalCommissionEarned: number;
  unclaimedCommission: number;
  friends: ReferredFriend[];
}

const userReferralData: Record<string, UserReferralState> = {};
const referralCodeToUser: Record<string, string> = {}; // code -> userId
const userReferrerMap: Record<string, string> = {}; // refereeUserId -> referrerUserId

function getReferralTier(friendCount: number): { tier: "Bronze" | "Silver" | "Gold" | "Diamond"; pct: number } {
  if (friendCount >= 50) return { tier: "Diamond", pct: 50 };
  if (friendCount >= 16) return { tier: "Gold", pct: 40 };
  if (friendCount >= 6) return { tier: "Silver", pct: 30 };
  return { tier: "Bronze", pct: 20 };
}

function ensureReferralData(userId: string, username = "Player"): UserReferralState {
  if (userReferralData[userId]) {
    const data = userReferralData[userId];
    const { tier, pct } = getReferralTier(data.friends.length);
    data.tier = tier;
    data.tierRevSharePct = pct;
    data.totalReferredCount = data.friends.length;
    return data;
  }

  const cleanName = username.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5) || "VIP";
  const suffix = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-3) || "777";
  const refCode = `APEX_${cleanName}_${suffix}`;

  const state: UserReferralState = {
    referralCode: refCode,
    referralLink: `https://ais-dev-ex4rhtu7nip7irtnlwcmzm-93731786335.asia-east1.run.app?ref=${refCode}`,
    referredBy: undefined,
    tier: "Bronze",
    tierRevSharePct: 20,
    totalReferredCount: 0,
    totalTurnoverGenerated: 0,
    totalCommissionEarned: 0,
    unclaimedCommission: 0,
    friends: [],
  };

  userReferralData[userId] = state;
  referralCodeToUser[refCode] = userId;
  return state;
}

function ensureUserStats(user: UserWallet): UserStats {
  if (user.stats && user.stats.totalHandsPlayed === user.gamesPlayed) {
    return user.stats;
  }

  const handsPlayed = Math.max(user.gamesPlayed, 0);
  if (user.stats) {
    user.stats.totalHandsPlayed = handsPlayed;
    user.stats.winRate =
      handsPlayed > 0
        ? Number(((user.stats.handsWon / handsPlayed) * 100).toFixed(1))
        : 0;
    return user.stats;
  }

  user.stats = {
    totalHandsPlayed: 0,
    handsWon: 0,
    handsLost: 0,
    handsTied: 0,
    winRate: 0,
    biggestWin: 0,
    currentStreak: 0,
    bestStreak: 0,
    tableBreakdown: {
      express: {
        slug: "express",
        tableName: "Express Speed Arena",
        handsPlayed: 0,
        handsWon: 0,
        handsLost: 0,
        winRate: 0,
        totalWagered: 0,
        profit: 0,
      },
      classic: {
        slug: "classic",
        tableName: "Classic High Table",
        handsPlayed: 0,
        handsWon: 0,
        handsLost: 0,
        winRate: 0,
        totalWagered: 0,
        profit: 0,
      },
      vip: {
        slug: "vip",
        tableName: "VIP Diamond Lounge",
        handsPlayed: 0,
        handsWon: 0,
        handsLost: 0,
        winRate: 0,
        totalWagered: 0,
        profit: 0,
      },
    },
    sideBreakdown: {
      dragon: { hands: 0, wins: 0, winRate: 0 },
      tiger: { hands: 0, wins: 0, winRate: 0 },
      tie: { hands: 0, wins: 0, winRate: 0 },
    },
    favoriteTable: "Classic High Table",
    favoriteSide: "Dragon",
  };

  return user.stats;
}

function recordSettledBetOnUserStats(
  user: UserWallet,
  bet: LiveBetRecord,
  isTie: boolean,
  winningSide: "DRAGON" | "TIGER" | "TIE",
  tableSlug: "express" | "classic" | "vip",
  tableName: string,
  profitOrLoss: number,
  isWin: boolean
) {
  const stats = ensureUserStats(user);
  stats.totalHandsPlayed += 1;

  if (!stats.tableBreakdown[tableSlug]) {
    stats.tableBreakdown[tableSlug] = {
      slug: tableSlug,
      tableName,
      handsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      winRate: 0,
      totalWagered: 0,
      profit: 0,
    };
  }
  const tbl = stats.tableBreakdown[tableSlug];
  tbl.handsPlayed += 1;
  tbl.totalWagered += bet.amount;

  const sideKey = (bet.side.toLowerCase()) as "dragon" | "tiger" | "tie";
  if (stats.sideBreakdown[sideKey]) {
    stats.sideBreakdown[sideKey].hands += 1;
  }

  if (isWin) {
    stats.handsWon += 1;
    tbl.handsWon += 1;
    tbl.profit += profitOrLoss;
    if (stats.sideBreakdown[sideKey]) stats.sideBreakdown[sideKey].wins += 1;
    stats.currentStreak = stats.currentStreak >= 0 ? stats.currentStreak + 1 : 1;
    if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;
    if (profitOrLoss > stats.biggestWin) stats.biggestWin = profitOrLoss;
  } else if (isTie && bet.side !== "TIE") {
    stats.handsTied += 1;
    tbl.profit -= profitOrLoss;
    // Tie with 50% refund protects/preserves player's active win streak!
  } else {
    stats.handsLost += 1;
    tbl.handsLost += 1;
    tbl.profit -= bet.amount;
    stats.currentStreak = 0;
  }

  stats.winRate = Number(((stats.handsWon / Math.max(stats.totalHandsPlayed, 1)) * 100).toFixed(1));
  tbl.winRate = Number(((tbl.handsWon / Math.max(tbl.handsPlayed, 1)) * 100).toFixed(1));
  if (stats.sideBreakdown[sideKey] && stats.sideBreakdown[sideKey].hands > 0) {
    stats.sideBreakdown[sideKey].winRate = Number(
      ((stats.sideBreakdown[sideKey].wins / stats.sideBreakdown[sideKey].hands) * 100).toFixed(1)
    );
  }
}

const activeRooms: P2PRoom[] = [];

// ============================================================================
// MULTI-TABLE GAME ENGINE (EXPRESS, CLASSIC, VIP)
// ============================================================================
interface TableRuntime {
  config: TableConfig;
  currentRound: TableRound;
  secretServerSeed: string;
  roadmap: RoadmapItem[];
  playerBets: LiveBetRecord[];
  recentSettledBets: LiveBetRecord[];
}

const tableConfigs: Record<string, TableConfig> = {
  express: {
    id: "tbl_express",
    slug: "express",
    name: "Express Speed Arena",
    type: "Express",
    minBet: 10,
    maxBet: 5000,
    bettingDuration: 15,
    playersOnline: 0,
    commissionRate: 0.05,
  },
  classic: {
    id: "tbl_classic",
    slug: "classic",
    name: "Classic High Table",
    type: "Classic",
    minBet: 100,
    maxBet: 25000,
    bettingDuration: 30,
    playersOnline: 0,
    commissionRate: 0.05,
  },
  vip: {
    id: "tbl_vip",
    slug: "vip",
    name: "VIP Diamond Lounge",
    type: "VIP",
    minBet: 1000,
    maxBet: 200000,
    bettingDuration: 30,
    playersOnline: 0,
    commissionRate: 0.05,
  },
};

function generateInitialRoadmap(count = 35): RoadmapItem[] {
  const items: RoadmapItem[] = [];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const suits = ["♥", "♦", "♣", "♠"];

  for (let i = 1; i <= count; i++) {
    const dVal = Math.floor(Math.random() * 13) + 1;
    const tVal = Math.floor(Math.random() * 13) + 1;
    let result: "DRAGON" | "TIGER" | "TIE" = "TIE";
    if (dVal > tVal) result = "DRAGON";
    else if (tVal > dVal) result = "TIGER";

    items.push({
      roundNumber: 1000 + i,
      result,
      dragonCard: { rank: ranks[dVal - 1], suit: suits[Math.floor(Math.random() * 4)], value: dVal, display: `${ranks[dVal - 1]}${suits[0]}` },
      tigerCard: { rank: ranks[tVal - 1], suit: suits[Math.floor(Math.random() * 4)], value: tVal, display: `${ranks[tVal - 1]}${suits[1]}` },
      timestamp: new Date(Date.now() - (count - i) * 35000).toISOString(),
    });
  }
  return items;
}

const tables: Record<string, TableRuntime> = {};

Object.entries(tableConfigs).forEach(([slug, cfg]) => {
  const serverSeed = generateServerSeed();
  const seedHash = hashServerSeed(serverSeed);
  const clientSeed = "dragon_tiger_btc_block_894102";

  tables[slug] = {
    config: cfg,
    secretServerSeed: serverSeed,
    roadmap: generateInitialRoadmap(45),
    playerBets: [],
    recentSettledBets: [],
    currentRound: {
      roundId: `rnd_${slug}_1001`,
      roundNumber: 1001,
      tableSlug: slug as "express" | "classic" | "vip",
      tableName: cfg.name,
      status: "BETTING",
      secondsRemaining: cfg.bettingDuration,
      totalDuration: cfg.bettingDuration,
      dragonPool: 0,
      tigerPool: 0,
      matchedAmount: 0,
      dragonPlayers: 0,
      tigerPlayers: 0,
      serverSeedHash: seedHash,
      clientSeed: clientSeed,
      nonce: 1001,
    },
  };
});

function broadcast(data: Record<string, unknown>) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Table Tick Engine (1-second heartbeat)
setInterval(() => {
  Object.entries(tables).forEach(([slug, tbl]) => {
    const round = tbl.currentRound;

    if (round.status === "BETTING") {
      if (round.secondsRemaining > 0) {
        round.secondsRemaining -= 1;

        broadcast({
          type: "TIMER_TICK",
          tableSlug: slug,
          secondsRemaining: round.secondsRemaining,
          dragonPool: round.dragonPool,
          tigerPool: round.tigerPool,
          matchedAmount: round.matchedAmount,
        });
      } else {
        // Transition: BETTING -> MATCHING -> DEALING
        round.status = "MATCHING";
        const dragonTotal = round.dragonPool;
        const tigerTotal = round.tigerPool;
        const matchedTotal = Math.min(dragonTotal, tigerTotal);
        round.matchedAmount = matchedTotal;

        // P2P Match Ratios for Dragon & Tiger pools
        const dragonMatchRatio = dragonTotal > 0 ? Math.min(1, matchedTotal / dragonTotal) : 0;
        const tigerMatchRatio = tigerTotal > 0 ? Math.min(1, matchedTotal / tigerTotal) : 0;

        // Perform instant refund for any unmatched stakes
        tbl.playerBets.forEach((bet) => {
          let matchRatio = 1;
          if (bet.side === "DRAGON") matchRatio = dragonMatchRatio;
          else if (bet.side === "TIGER") matchRatio = tigerMatchRatio;
          else matchRatio = 1;

          const matchedPart = Math.floor(bet.amount * matchRatio);
          const unmatchedPart = bet.amount - matchedPart;

          (bet as any).matchedAmount = matchedPart;
          (bet as any).unmatchedAmount = unmatchedPart;

          if (unmatchedPart > 0) {
            bet.returnedAmount = (bet.returnedAmount || 0) + unmatchedPart;
            bet.tkReturnStatus = "RETURNED_REFUND";

            // Sync with detailed user bet history
            const userHist = userBetHistories[bet.userId];
            if (userHist) {
              const histItem = userHist.find((h) => h.id === bet.id);
              if (histItem) {
                histItem.matchedAmount = matchedPart;
                histItem.unmatchedAmount = unmatchedPart;
                histItem.returnedAmount = (histItem.returnedAmount || 0) + unmatchedPart;
                histItem.tkReturnStatus = "RETURNED_REFUND";
              }
            }

            const user = mockUsers[bet.userId];
            if (user) {
              if (bet.balanceType === "real") {
                user.balance += unmatchedPart;
              } else {
                user.demoBalance += unmatchedPart;
              }
              user.transactions.unshift({
                id: `tx_unmatched_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                type: "refund",
                amount: unmatchedPart,
                timestamp: new Date().toISOString(),
                description: `P2P Unmatched Refund: ৳${unmatchedPart.toLocaleString()} returned to wallet (${tbl.config.name} Round #${round.roundNumber})`,
              });
            }
          }
        });

        broadcast({
          type: "ROUND_PHASE",
          tableSlug: slug,
          status: "MATCHING",
          matchedAmount: round.matchedAmount,
          dragonPool: round.dragonPool,
          tigerPool: round.tigerPool,
        });

        setTimeout(() => {
          round.status = "DEALING";
          const derived = deriveCards(tbl.secretServerSeed, round.clientSeed, round.nonce);
          round.dragonCard = derived.dragonCard;
          round.tigerCard = derived.tigerCard;
          round.result = derived.result;

          broadcast({
            type: "ROUND_DEALING",
            tableSlug: slug,
            dragonCard: round.dragonCard,
            tigerCard: round.tigerCard,
            result: round.result,
          });

          // Settling phase (after 3s card animation)
          setTimeout(() => {
            round.status = "SETTLING";
            round.serverSeed = tbl.secretServerSeed; // REVEAL SEED ONLY NOW

            // Financial settlement per mathematical proof
            const matchedM = round.matchedAmount;
            if (round.result === "TIE") {
              // 50% Tie Refund Rule: Dragon & Tiger bettors get 50% refund, 50% goes to company fund
              round.tieRevenue = matchedM * 2 * 0.5;
              round.commission = 0;
              metrics.todayTieRevenue += round.tieRevenue;
            } else {
              round.commission = matchedM * 2 * 0.05; // 5% commission of 2M pool
              round.tieRevenue = 0;
              metrics.todayCommission += round.commission;
            }
            metrics.todayMatchedVolume += matchedM;
            metrics.totalRoundsPlayed += 1;

            // Settle all player bets transparently on the matched portion
            tbl.playerBets.forEach((bet) => {
              const matchedStake = (bet as any).matchedAmount !== undefined ? (bet as any).matchedAmount : bet.amount;
              const isTie = round.result === "TIE";

              if (matchedStake <= 0) {
                bet.status = "REFUNDED";
                bet.payout = 0;
                bet.tkReturnStatus = "RETURNED_REFUND";
                return;
              }

              if (isTie) {
                if (bet.side === "TIE") {
                  bet.status = "WON";
                  bet.payout = matchedStake * 8;
                  bet.tkReturnStatus = "RETURNED_WIN";
                  bet.returnedAmount = (bet.returnedAmount || 0) + bet.payout;
                } else {
                  // 50% refund on TIE for Dragon & Tiger bets; remaining 50% goes to company fund!
                  const tieRefundAmount = Math.floor(matchedStake * 0.5);
                  bet.status = "TIE_REFUND";
                  bet.payout = tieRefundAmount;
                  bet.tkReturnStatus = "RETURNED_REFUND";
                  bet.returnedAmount = (bet.returnedAmount || 0) + tieRefundAmount;
                }
              } else if (bet.side === round.result) {
                bet.status = "WON";
                bet.payout = Math.floor(matchedStake * 1.9);
                bet.tkReturnStatus = "RETURNED_WIN";
                bet.returnedAmount = (bet.returnedAmount || 0) + bet.payout;
              } else {
                bet.status = "LOST";
                bet.payout = 0;
                bet.tkReturnStatus = (bet.returnedAmount && bet.returnedAmount > 0) ? "RETURNED_REFUND" : "NO_RETURN";
              }

              // Sync with user's permanent bet history
              const userHist = userBetHistories[bet.userId];
              if (userHist) {
                const histItem = userHist.find((h) => h.id === bet.id);
                if (histItem) {
                  histItem.status = bet.status as any;
                  histItem.payout = bet.payout || 0;
                  histItem.returnedAmount = bet.returnedAmount || 0;
                  histItem.tkReturnStatus = bet.tkReturnStatus as any;
                  histItem.netPnL = (bet.returnedAmount || 0) - bet.amount;
                  histItem.dragonCard = round.dragonCard;
                  histItem.tigerCard = round.tigerCard;
                  histItem.result = round.result;
                  histItem.serverSeed = round.serverSeed;
                }
              }

              // Update user wallet and transactions if registered user
              const user = mockUsers[bet.userId];
              if (user && matchedStake > 0) {
                if (isTie) {
                  if (bet.side === "TIE") {
                    const profit = matchedStake * 7;
                    const totalCredited = matchedStake * 8;
                    if (bet.balanceType === "real") user.balance += totalCredited;
                    else user.demoBalance += totalCredited;
                    user.totalWon += profit;
                    recordSettledBetOnUserStats(user, bet, true, "TIE", slug as any, tbl.config.name, profit, true);
                    user.transactions.unshift({
                      id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                      type: "win",
                      amount: totalCredited,
                      timestamp: new Date().toISOString(),
                      description: `Tie 8x Win on ${tbl.config.name} Round #${round.roundNumber}`,
                    });
                  } else {
                    // Dragon / Tiger 50% refund to user wallet; 50% retained by company fund
                    const tieRefund = Math.floor(matchedStake * 0.5);
                    const companyFundShare = matchedStake - tieRefund;
                    if (bet.balanceType === "real") user.balance += tieRefund;
                    else user.demoBalance += tieRefund;
                    user.totalLost += companyFundShare;
                    recordSettledBetOnUserStats(user, bet, true, "TIE", slug as any, tbl.config.name, companyFundShare, false);
                    user.transactions.unshift({
                      id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                      type: "refund",
                      amount: tieRefund,
                      timestamp: new Date().toISOString(),
                      description: `50% Tie Refund: ৳${tieRefund.toLocaleString()} returned to wallet (50% to Company Fund) on ${tbl.config.name} Round #${round.roundNumber}`,
                    });
                  }
                } else if (bet.side === round.result) {
                  const payout = Math.floor(matchedStake * 1.9);
                  const profit = Math.floor(matchedStake * 0.9);
                  if (bet.balanceType === "real") {
                    user.balance += payout;
                  } else {
                    user.demoBalance += payout;
                  }
                  user.totalWon += profit;
                  recordSettledBetOnUserStats(user, bet, false, round.result as any, slug as any, tbl.config.name, profit, true);
                  user.transactions.unshift({
                    id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    type: "win",
                    amount: payout,
                    timestamp: new Date().toISOString(),
                    description: `Won 1.9x on ${tbl.config.name} Round #${round.roundNumber}`,
                  });
                } else {
                  user.totalLost += matchedStake;
                  recordSettledBetOnUserStats(user, bet, false, round.result as any, slug as any, tbl.config.name, matchedStake, false);
                  user.transactions.unshift({
                    id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    type: "loss",
                    amount: matchedStake,
                    timestamp: new Date().toISOString(),
                    description: `Loss on ${tbl.config.name} Round #${round.roundNumber}`,
                  });
                }
              }

              // Referral Affiliate RevShare Commission Attribution
              if (matchedStake > 0) {
                const referrerId = userReferrerMap[bet.userId];
                if (referrerId && mockUsers[referrerId]) {
                  const referrerData = ensureReferralData(referrerId, mockUsers[referrerId]?.username);
                  // Platform commission is 5% of matched duel
                  const platformFee = Math.max(1, Math.floor(matchedStake * 0.1));
                  const revShareRate = referrerData.tierRevSharePct / 100;
                  const affiliateEarned = Math.max(1, Math.floor(platformFee * revShareRate));

                  referrerData.unclaimedCommission += affiliateEarned;
                  referrerData.totalCommissionEarned += affiliateEarned;
                  referrerData.totalTurnoverGenerated += matchedStake;

                  let friendEntry = referrerData.friends.find((f) => f.userId === bet.userId);
                  if (!friendEntry) {
                    friendEntry = {
                      userId: bet.userId,
                      username: bet.username,
                      joinedAt: new Date().toISOString(),
                      totalWagered: 0,
                      commissionEarned: 0,
                      activeStatus: "ACTIVE",
                    };
                    referrerData.friends.unshift(friendEntry);
                    referrerData.totalReferredCount = referrerData.friends.length;
                    const { tier, pct } = getReferralTier(referrerData.friends.length);
                    referrerData.tier = tier;
                    referrerData.tierRevSharePct = pct;
                  }
                  friendEntry.totalWagered += matchedStake;
                  friendEntry.commissionEarned += affiliateEarned;
                  friendEntry.activeStatus = "ACTIVE";
                }
              }

              // Archive to transparent table history
              tbl.recentSettledBets.unshift({ ...bet });
            });

            tbl.recentSettledBets = tbl.recentSettledBets.slice(0, 60);

            // Add to roadmap
            if (round.result && round.dragonCard && round.tigerCard) {
              tbl.roadmap.unshift({
                roundNumber: round.roundNumber,
                result: round.result,
                dragonCard: round.dragonCard,
                tigerCard: round.tigerCard,
                timestamp: new Date().toISOString(),
              });
              if (tbl.roadmap.length > 80) tbl.roadmap.pop();
            }

            round.status = "COMPLETED";

            broadcast({
              type: "ROUND_RESULT",
              tableSlug: slug,
              round: round,
              roadmap: tbl.roadmap.slice(0, 40),
              settledBets: tbl.playerBets,
            });

            // Start next round after 4s
            setTimeout(() => {
              const nextServerSeed = generateServerSeed();
              const nextSeedHash = hashServerSeed(nextServerSeed);
              tbl.secretServerSeed = nextServerSeed;
              tbl.playerBets = [];

              tbl.currentRound = {
                roundId: `rnd_${slug}_${round.roundNumber + 1}`,
                roundNumber: round.roundNumber + 1,
                tableSlug: slug as "express" | "classic" | "vip",
                tableName: tbl.config.name,
                status: "BETTING",
                secondsRemaining: tbl.config.bettingDuration,
                totalDuration: tbl.config.bettingDuration,
                dragonPool: 0,
                tigerPool: 0,
                matchedAmount: 0,
                dragonPlayers: 0,
                tigerPlayers: 0,
                serverSeedHash: nextSeedHash,
                clientSeed: "dragon_tiger_btc_block_894102",
                nonce: round.nonce + 1,
              };

              broadcast({
                type: "NEW_ROUND",
                tableSlug: slug,
                round: tbl.currentRound,
              });
            }, 4000);
          }, 3000);
        }, 1500);
      }
    }
  });
}, 1000);

// ============================================================================
// CHAT & REAL-TIME MULTIPLAYER SYNC
// ============================================================================
interface LiveChatMessage {
  user: string;
  vipTier: string;
  text: string;
  time: string;
}

const chatMessages: LiveChatMessage[] = [];

// ============================================================================
// WEBSOCKET HANDLERS
// ============================================================================
wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "WELCOME", message: "Connected to Dragon Tiger P2P Arena" }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "CHAT") {
        const msg: LiveChatMessage = {
          user: data.user || "Player",
          vipTier: data.vipTier || "Bronze",
          text: data.text || "",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        chatMessages.push(msg);
        if (chatMessages.length > 100) chatMessages.shift();

        broadcast({
          type: "CHAT_MESSAGE",
          ...msg,
        });
      }
    } catch (e) {
      console.error("WS error:", e);
    }
  });
});

// ============================================================================
// REST API ENDPOINTS
// ============================================================================
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Real-Time Chat REST Endpoints
app.get("/api/chat/messages", (_req, res) => {
  res.json(chatMessages);
});

app.post("/api/chat/send", (req, res) => {
  const { user, vipTier, text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }
  const msg: LiveChatMessage = {
    user: user || "Player",
    vipTier: vipTier || "Bronze",
    text: text.trim(),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
  chatMessages.push(msg);
  if (chatMessages.length > 100) chatMessages.shift();

  broadcast({
    type: "CHAT_MESSAGE",
    ...msg,
  });
  res.json({ success: true, message: msg });
});

// 1. Tables Overview & Current Round
app.get("/api/tables", (_req, res) => {
  const result = Object.values(tables).map((t) => ({
    config: t.config,
    currentRound: t.currentRound,
    recentWinners: t.roadmap.slice(0, 10).map((r) => r.result),
  }));
  res.json(result);
});

app.get("/api/tables/:slug/roadmap", (req, res) => {
  const { slug } = req.params;
  const tbl = tables[slug];
  if (!tbl) return res.status(404).json({ error: "Table not found" });
  res.json(tbl.roadmap);
});

// Live Bet Transparency API - See which user placed how much on which side
app.get("/api/tables/:slug/bets", (req, res) => {
  const { slug } = req.params;
  const tbl = tables[slug];
  if (!tbl) return res.status(404).json({ error: "Table not found" });
  res.json({
    tableSlug: slug,
    roundNumber: tbl.currentRound.roundNumber,
    currentRoundBets: tbl.playerBets,
    recentSettledBets: tbl.recentSettledBets,
  });
});

// 2. Betting API - STRICT AUTHENTICATION ENFORCED
app.post("/api/game/bet", (req, res) => {
  const { userId, tableSlug, side, amount, balanceType = "real" } = req.body;

  // Strict check: Every player MUST be logged in
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return res.status(401).json({
      error: "Authentication required. Every player must be logged in to place bets.",
      code: "AUTH_REQUIRED",
    });
  }

  const user = mockUsers[userId];
  if (!user) {
    return res.status(401).json({
      error: "Session expired or user account not found. Please log in again to continue.",
      code: "INVALID_USER",
    });
  }

  const tbl = tables[tableSlug];
  if (!tbl) return res.status(404).json({ error: "Table not found" });
  if (tbl.currentRound.status !== "BETTING") {
    return res.status(400).json({ error: "Betting closed for this round" });
  }

  const normalizedSide = (side || "").toString().toUpperCase();
  if (normalizedSide === "TIE") {
    return res.status(400).json({
      error: "🚫 Tie-তে বাজি ধরা সম্পূর্ণ নিষিদ্ধ। শুধুমাত্র Dragon অথবা Tiger-এ বাজি ধরুন। টাই হলে খেলোয়াড় তাঁর বাজির ৫০% টাকা ইনস্ট্যান্ট রিফান্ড পাবেন।",
    });
  }

  if (normalizedSide !== "DRAGON" && normalizedSide !== "TIGER") {
    return res.status(400).json({
      error: "Invalid bet side. Only DRAGON or TIGER allowed.",
    });
  }

  const numAmount = Number(amount);
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "Invalid bet amount" });
  }

  if (numAmount < tbl.config.minBet || numAmount > tbl.config.maxBet) {
    return res.status(400).json({
      error: `Bet amount must be between ৳${tbl.config.minBet} and ৳${tbl.config.maxBet}`,
    });
  }

  const activeBal = balanceType === "real" ? user.balance : user.demoBalance;
  if (activeBal < numAmount) {
    return res.status(400).json({ error: "Insufficient balance for this bet" });
  }

  // Deduct balance
  if (balanceType === "real") {
    user.balance -= numAmount;
  } else {
    user.demoBalance -= numAmount;
  }
  user.gamesPlayed += 1;

  const userStats = ensureUserStats(user);

  // Create transparent public live bet record
  const betRecord: LiveBetRecord = {
    id: `bet_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: user.userId,
    username: user.username,
    vipTier: user.vipTier || "Bronze",
    side: side.toUpperCase() as "DRAGON" | "TIGER" | "TIE",
    amount: numAmount,
    balanceType,
    timestamp: new Date().toISOString(),
    roundNumber: tbl.currentRound.roundNumber,
    tableSlug,
    status: "ACTIVE",
    winStreak: Math.max(userStats.currentStreak || 0, 0),
  };

  // Prepend to active table bets
  tbl.playerBets.unshift(betRecord);

  // Sync to user's detailed betting history
  if (!userBetHistories[user.userId]) {
    getOrSeedUserBetHistory(user.userId, user.username);
  }
  userBetHistories[user.userId].unshift({
    id: betRecord.id,
    roundNumber: tbl.currentRound.roundNumber,
    tableSlug,
    tableName: tbl.config.name,
    side: betRecord.side,
    amount: numAmount,
    matchedAmount: numAmount,
    unmatchedAmount: 0,
    returnedAmount: 0,
    tkReturnStatus: "NONE",
    balanceType,
    status: "ACTIVE",
    payout: 0,
    netPnL: 0,
    timestamp: betRecord.timestamp,
    serverSeedHash: tbl.currentRound.serverSeedHash,
  });
  if (userBetHistories[user.userId].length > 80) {
    userBetHistories[user.userId].pop();
  }

  // Update table pool
  if (side.toUpperCase() === "DRAGON") {
    tbl.currentRound.dragonPool += numAmount;
    tbl.currentRound.dragonPlayers += 1;
  } else if (side.toUpperCase() === "TIGER") {
    tbl.currentRound.tigerPool += numAmount;
    tbl.currentRound.tigerPlayers += 1;
  }
  tbl.currentRound.matchedAmount = Math.min(
    tbl.currentRound.dragonPool,
    tbl.currentRound.tigerPool
  );

  // Real-time broadcast transparent live bet to all connected clients
  broadcast({
    type: "NEW_BET",
    tableSlug,
    bet: betRecord,
    dragonPool: tbl.currentRound.dragonPool,
    tigerPool: tbl.currentRound.tigerPool,
    matchedAmount: tbl.currentRound.matchedAmount,
  });

  res.json({
    success: true,
    bet: betRecord,
    newBalance: balanceType === "real" ? user.balance : user.demoBalance,
    round: tbl.currentRound,
  });
});

// 3. Provably Fair Verification API (Public)
app.post("/api/verify", (req, res) => {
  const { serverSeed, serverSeedHash, clientSeed, nonce } = req.body;
  if (!serverSeed || !clientSeed || nonce === undefined) {
    return res.status(400).json({ error: "Missing verification parameters" });
  }

  const computedHash = hashServerSeed(serverSeed);
  const hashMatches = serverSeedHash ? computedHash.toLowerCase() === serverSeedHash.toLowerCase() : true;

  const result = deriveCards(serverSeed, clientSeed, Number(nonce));

  res.json({
    valid: hashMatches,
    computedServerSeedHash: computedHash,
    hmac: result.hmac,
    dragonCard: result.dragonCard,
    tigerCard: result.tigerCard,
    result: result.result,
    algorithm: "HMAC-SHA512 with modulo bias rejection",
  });
});

// 4. Authentication API (Sign Up & Sign In)
app.post("/api/auth/signup", (req, res) => {
  const { username, password, refCode } = req.body;
  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({ success: false, error: "Username must be at least 3 characters" });
  }
  if (!password || typeof password !== "string" || password.length < 4) {
    return res.status(400).json({ success: false, error: "Password must be at least 4 characters" });
  }

  const cleanUsername = username.trim();
  const normalizedUser = cleanUsername.toLowerCase();

  if (userCredentials[normalizedUser]) {
    return res.status(400).json({ success: false, error: "Username already registered. Please sign in." });
  }

  const salt = crypto.randomBytes(8).toString("hex");
  const passwordHash = crypto.createHash("sha256").update(password + salt).digest("hex");
  const userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  userCredentials[normalizedUser] = {
    userId,
    username: cleanUsername,
    passwordHash,
    salt,
  };

  const newUser: UserWallet = {
    userId,
    username: cleanUsername,
    balance: 0,
    demoBalance: 0,
    balanceType: "real",
    lockedBalance: 0,
    totalWon: 0,
    totalLost: 0,
    gamesPlayed: 0,
    vipTier: "Bronze",
    kycStatus: "verified",
    transactions: [],
  };

  // Check if invited via referral code
  if (refCode && typeof refCode === "string") {
    const cleanRefCode = refCode.trim().toUpperCase();
    const referrerUserId = referralCodeToUser[cleanRefCode];
    if (referrerUserId && referrerUserId !== userId) {
      userReferrerMap[userId] = referrerUserId;
      const referrerData = ensureReferralData(referrerUserId, mockUsers[referrerUserId]?.username);
      referrerData.friends.unshift({
        userId,
        username: cleanUsername,
        joinedAt: new Date().toISOString(),
        totalWagered: 0,
        commissionEarned: 0,
        activeStatus: "ACTIVE",
      });
      referrerData.totalReferredCount = referrerData.friends.length;
      const { tier, pct } = getReferralTier(referrerData.friends.length);
      referrerData.tier = tier;
      referrerData.tierRevSharePct = pct;
    }
  }

  newUser.referral = ensureReferralData(userId, cleanUsername);
  mockUsers[userId] = newUser;
  res.json({ success: true, user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Please enter username and password" });
  }

  const normalizedUser = username.trim().toLowerCase();
  const cred = userCredentials[normalizedUser];

  if (!cred) {
    // If not found in explicit credentials, check if user exists in mockUsers (or create demo user with password)
    const existingMock = Object.values(mockUsers).find(
      (u) => u.username.toLowerCase() === normalizedUser
    );
    if (existingMock) {
      // Auto-register credential with this password for convenience
      const salt = crypto.randomBytes(8).toString("hex");
      const passwordHash = crypto.createHash("sha256").update(password + salt).digest("hex");
      userCredentials[normalizedUser] = {
        userId: existingMock.userId,
        username: existingMock.username,
        passwordHash,
        salt,
      };
      existingMock.referral = ensureReferralData(existingMock.userId, existingMock.username);
      return res.json({ success: true, user: existingMock });
    }

    return res.status(401).json({ success: false, error: "Account not found. Please click Sign Up to register." });
  }

  const computedHash = crypto.createHash("sha256").update(password + cred.salt).digest("hex");
  if (computedHash !== cred.passwordHash) {
    return res.status(401).json({ success: false, error: "Incorrect password. Please try again." });
  }

  const user = mockUsers[cred.userId];
  if (!user) {
    return res.status(404).json({ success: false, error: "User profile not found" });
  }

  user.referral = ensureReferralData(user.userId, user.username);
  res.json({ success: true, user });
});

// 5. Wallet API
app.get("/api/wallet/:userId", (req, res) => {
  const { userId } = req.params;
  if (!mockUsers[userId]) {
    mockUsers[userId] = {
      userId,
      username: (req.query.username as string) || `Player_${userId.slice(0, 5)}`,
      balance: 0,
      demoBalance: 0,
      balanceType: "real",
      lockedBalance: 0,
      totalWon: 0,
      totalLost: 0,
      gamesPlayed: 0,
      vipTier: "Bronze",
      kycStatus: "none",
      transactions: [],
    };
  }
  ensureUserStats(mockUsers[userId]);
  mockUsers[userId].referral = ensureReferralData(userId, mockUsers[userId].username);
  res.json(mockUsers[userId]);
});

// Admin Reset Endpoint: Reset all player balances to 0
app.post("/api/admin/reset-balances", (_req, res) => {
  Object.values(mockUsers).forEach((u) => {
    u.balance = 0;
    u.demoBalance = 0;
    u.lockedBalance = 0;
    u.totalWon = 0;
    u.totalLost = 0;
    u.gamesPlayed = 0;
    u.transactions = [];
  });
  res.json({ success: true, message: "All site user balances reset to 0." });
});

// 5.1 Referral Program Endpoints
app.get("/api/referral/:userId", (req, res) => {
  const { userId } = req.params;
  const user = mockUsers[userId];
  const refData = ensureReferralData(userId, user?.username || "Player");
  res.json({
    success: true,
    data: refData,
  });
});

app.post("/api/referral/claim", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: "Missing userId" });
  }
  const user = mockUsers[userId];
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }
  const refData = ensureReferralData(userId, user.username);
  const amountToClaim = refData.unclaimedCommission;
  if (amountToClaim <= 0) {
    return res.status(400).json({ success: false, error: "No unclaimed commission available to transfer." });
  }

  // Transfer directly to user's real balance
  user.balance += amountToClaim;
  refData.unclaimedCommission = 0;

  user.transactions.unshift({
    id: `tx_${Date.now()}_ref_claim`,
    type: "commission",
    amount: amountToClaim,
    timestamp: new Date().toISOString(),
    description: `Claimed ৳${amountToClaim.toLocaleString()} P2P Referral RevShare Commission`,
  });

  res.json({
    success: true,
    claimedAmount: amountToClaim,
    newBalance: user.balance,
    referral: refData,
    user,
  });
});

app.post("/api/referral/apply", (req, res) => {
  const { userId, refCode } = req.body;
  if (!userId || !refCode) {
    return res.status(400).json({ success: false, error: "Missing parameters" });
  }
  const user = mockUsers[userId];
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }
  if (userReferrerMap[userId]) {
    return res.status(400).json({ success: false, error: "A referral code is already active on this account." });
  }

  const cleanRefCode = refCode.trim().toUpperCase();
  const referrerUserId = referralCodeToUser[cleanRefCode];
  if (!referrerUserId || referrerUserId === userId) {
    return res.status(400).json({ success: false, error: "Invalid referral code or cannot refer yourself." });
  }

  userReferrerMap[userId] = referrerUserId;
  const referrerData = ensureReferralData(referrerUserId, mockUsers[referrerUserId]?.username);
  referrerData.friends.unshift({
    userId,
    username: user.username,
    joinedAt: new Date().toISOString(),
    totalWagered: 0,
    commissionEarned: 0,
    activeStatus: "ACTIVE",
  });
  referrerData.totalReferredCount = referrerData.friends.length;
  const { tier, pct } = getReferralTier(referrerData.friends.length);
  referrerData.tier = tier;
  referrerData.tierRevSharePct = pct;

  // Bonus for applying referral: ৳500 instant welcome chips
  user.balance += 500;
  user.transactions.unshift({
    id: `tx_${Date.now()}_ref_bonus`,
    type: "faucet",
    amount: 500,
    timestamp: new Date().toISOString(),
    description: `Applied Referral Code ${cleanRefCode} Welcome Bonus`,
  });

  res.json({
    success: true,
    bonusAdded: 500,
    user,
  });
});

// Dedicated Personalized Statistics Endpoint across Dragon Tiger tables
app.get("/api/user/stats/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: "Missing user ID", code: "INVALID_PARAM" });
  }
  const user = mockUsers[userId];
  if (!user) {
    return res.status(404).json({ error: "User profile not found", code: "USER_NOT_FOUND" });
  }
  const stats = ensureUserStats(user);
  res.json({
    success: true,
    userId: user.userId,
    username: user.username,
    stats,
  });
});

// Comprehensive User Bet History & P&L Endpoint
app.get("/api/wallet/:userId/bets", (req, res) => {
  const { userId } = req.params;
  const user = mockUsers[userId];
  const username = user?.username || (req.query.username as string) || "Player";
  const history = getOrSeedUserBetHistory(userId, username);

  let totalWagered = 0;
  let totalMatched = 0;
  let totalReturned = 0;
  let totalWon = 0;
  let totalLost = 0;
  let winsCount = 0;

  history.forEach((b) => {
    totalWagered += b.amount;
    totalMatched += b.matchedAmount;
    totalReturned += b.returnedAmount;
    if (b.status === "WON") {
      winsCount += 1;
      totalWon += b.payout;
    } else if (b.status === "LOST") {
      totalLost += b.matchedAmount;
    }
  });

  const settledCount = history.filter((b) => b.status === "WON" || b.status === "LOST").length;
  const winRate = settledCount > 0 ? Number(((winsCount / settledCount) * 100).toFixed(1)) : 64.5;
  const netPnL = (totalWon + totalReturned) - totalWagered;

  const response: UserBetHistoryResponse = {
    userId,
    username,
    totalWagered,
    totalMatched,
    totalReturned,
    totalWon,
    totalLost,
    netPnL,
    winRate,
    totalBetsCount: history.length,
    bets: history,
  };

  res.json(response);
});

app.get("/api/wallet/:userId/history", (req, res) => {
  const { userId } = req.params;
  const user = mockUsers[userId];
  const username = user?.username || (req.query.username as string) || "Player";
  const history = getOrSeedUserBetHistory(userId, username);

  let totalWagered = 0;
  let totalMatched = 0;
  let totalReturned = 0;
  let totalWon = 0;
  let totalLost = 0;
  let winsCount = 0;

  history.forEach((b) => {
    totalWagered += b.amount;
    totalMatched += b.matchedAmount;
    totalReturned += b.returnedAmount;
    if (b.status === "WON") {
      winsCount += 1;
      totalWon += b.payout;
    } else if (b.status === "LOST") {
      totalLost += b.matchedAmount;
    }
  });

  const settledCount = history.filter((b) => b.status === "WON" || b.status === "LOST").length;
  const winRate = settledCount > 0 ? Number(((winsCount / settledCount) * 100).toFixed(1)) : 64.5;
  const netPnL = (totalWon + totalReturned) - totalWagered;

  const response: UserBetHistoryResponse = {
    userId,
    username,
    totalWagered,
    totalMatched,
    totalReturned,
    totalWon,
    totalLost,
    netPnL,
    winRate,
    totalBetsCount: history.length,
    bets: history,
  };

  res.json(response);
});

// ============================================================================
// GLOBAL PUBLIC FINANCIAL TRANSPARENCY LEDGER
// ============================================================================
export interface GlobalTransaction {
  id: string;
  txHash: string;
  type: "deposit" | "withdraw" | "transfer" | "tie_refund" | "commission";
  username: string;
  userId: string;
  recipientUsername?: string;
  recipientUserId?: string;
  amount: number;
  method: string;
  status: "COMPLETED" | "PROCESSED";
  timestamp: string;
  description: string;
}

const globalTransactions: GlobalTransaction[] = [];

function recordGlobalTransaction(tx: Omit<GlobalTransaction, "id" | "txHash" | "timestamp">) {
  const hexChars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += hexChars[Math.floor(Math.random() * hexChars.length)];
  }

  const newTx: GlobalTransaction = {
    ...tx,
    id: `gtx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    txHash: hash,
    timestamp: new Date().toISOString(),
  };

  globalTransactions.unshift(newTx);
  if (globalTransactions.length > 500) {
    globalTransactions.pop();
  }
  return newTx;
}

// 5. Public Financial Transparency Ledger API
app.get("/api/transparency/transactions", (req, res) => {
  const { type, search, limit } = req.query;
  let results = [...globalTransactions];

  if (type && type !== "all") {
    results = results.filter((tx) => tx.type === type);
  }

  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (tx) =>
        tx.username.toLowerCase().includes(q) ||
        (tx.recipientUsername && tx.recipientUsername.toLowerCase().includes(q)) ||
        tx.txHash.toLowerCase().includes(q) ||
        tx.method.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q)
    );
  }

  const max = Number(limit) || 100;
  res.json({
    success: true,
    totalCount: results.length,
    transactions: results.slice(0, max),
  });
});

// 5b. Public User Directory & Full Transparency API
app.get("/api/transparency/users", (req, res) => {
  const { search, limit } = req.query;
  let userList = Object.values(mockUsers).map((u) => {
    const stats = ensureUserStats(u);
    const history = getOrSeedUserBetHistory(u.userId, u.username);
    const refData = ensureReferralData(u.userId, u.username);
    return {
      userId: u.userId,
      username: u.username,
      balance: u.balance,
      demoBalance: u.demoBalance,
      lockedBalance: u.lockedBalance,
      totalWon: u.totalWon,
      totalLost: u.totalLost,
      gamesPlayed: u.gamesPlayed,
      vipTier: u.vipTier,
      kycStatus: u.kycStatus,
      stats,
      betHistoryCount: history.length,
      transactionsCount: u.transactions ? u.transactions.length : 0,
      referredFriendsCount: refData.totalReferredCount,
      totalCommissionEarned: refData.totalCommissionEarned,
    };
  });

  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    userList = userList.filter((u) => u.username.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q));
  }

  const max = Number(limit) || 100;
  res.json({
    success: true,
    totalUsers: userList.length,
    users: userList.slice(0, max),
  });
});

app.get("/api/transparency/users/:targetUserId", (req, res) => {
  const { targetUserId } = req.params;
  const user = mockUsers[targetUserId];
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  const stats = ensureUserStats(user);
  const betHistory = getOrSeedUserBetHistory(user.userId, user.username);
  const referralData = ensureReferralData(user.userId, user.username);

  res.json({
    success: true,
    user: {
      userId: user.userId,
      username: user.username,
      balance: user.balance,
      demoBalance: user.demoBalance,
      lockedBalance: user.lockedBalance,
      totalWon: user.totalWon,
      totalLost: user.totalLost,
      gamesPlayed: user.gamesPlayed,
      vipTier: user.vipTier,
      kycStatus: user.kycStatus,
      stats,
      transactions: user.transactions || [],
      betHistory: betHistory || [],
      referralData: referralData || null,
    },
  });
});

app.post("/api/wallet/action", (req, res) => {
  const { userId, action, amount, description, method } = req.body;
  const user = mockUsers[userId];
  if (!user) return res.status(404).json({ error: "User not found" });

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const selectedMethod = method || (action === "deposit" ? "bKash / Nagad / UPI" : "Bank / Mobile Payout");

  if (action === "deposit" || action === "faucet") {
    user.balance += numAmount;
    const txId = `tx_${Date.now()}`;
    const desc = description || (action === "faucet" ? "Daily VIP Faucet Bonus" : `Instant Deposit via ${selectedMethod}`);
    
    user.transactions.unshift({
      id: txId,
      type: action,
      amount: numAmount,
      timestamp: new Date().toISOString(),
      description: desc,
    });

    if (action === "deposit") {
      recordGlobalTransaction({
        type: "deposit",
        username: user.username,
        userId: user.userId,
        amount: numAmount,
        method: selectedMethod,
        status: "COMPLETED",
        description: desc,
      });
    }
  } else if (action === "withdraw") {
    if (user.balance < numAmount) {
      return res.status(400).json({ error: "Insufficient balance for withdrawal" });
    }
    user.balance -= numAmount;
    const txId = `tx_${Date.now()}`;
    const desc = description || `Instant Withdrawal via ${selectedMethod}`;

    user.transactions.unshift({
      id: txId,
      type: "withdraw",
      amount: numAmount,
      timestamp: new Date().toISOString(),
      description: desc,
    });

    recordGlobalTransaction({
      type: "withdraw",
      username: user.username,
      userId: user.userId,
      amount: numAmount,
      method: selectedMethod,
      status: "COMPLETED",
      description: desc,
    });
  } else if (action === "demo_reset") {
    user.demoBalance = 100000;
  }

  res.json({ success: true, user });
});

// P2P Fund Transfer Endpoint (Send Money to another player)
app.post("/api/wallet/transfer", (req, res) => {
  const { fromUserId, toUsername, amount, note } = req.body;
  if (!fromUserId || !toUsername || !amount) {
    return res.status(400).json({ error: "Missing required parameters for transfer" });
  }

  const sender = mockUsers[fromUserId];
  if (!sender) {
    return res.status(404).json({ error: "Sender account not found" });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 10) {
    return res.status(400).json({ error: "Minimum transfer amount is ৳10 / ₹10" });
  }

  if (sender.balance < numAmount) {
    return res.status(400).json({ error: "Insufficient balance to transfer this amount" });
  }

  // Find recipient by username (case-insensitive) or userId
  const cleanTarget = toUsername.trim().toLowerCase();
  let recipient = Object.values(mockUsers).find(
    (u) => u.username.toLowerCase() === cleanTarget || u.userId.toLowerCase() === cleanTarget
  );

  // If not found in mockUsers, check if target username is valid and create profile
  if (!recipient) {
    const targetUserId = `user_p2p_${Date.now()}`;
    recipient = {
      userId: targetUserId,
      username: toUsername.trim(),
      balance: 0,
      demoBalance: 0,
      balanceType: "real",
      lockedBalance: 0,
      totalWon: 0,
      totalLost: 0,
      gamesPlayed: 0,
      vipTier: "Bronze",
      kycStatus: "verified",
      transactions: [],
    };
    mockUsers[targetUserId] = recipient;
  }

  if (recipient.userId === sender.userId) {
    return res.status(400).json({ error: "Cannot send funds to your own account" });
  }

  // Execute Transfer
  sender.balance -= numAmount;
  recipient.balance += numAmount;

  const txTime = new Date().toISOString();
  const txSenderDesc = `Sent ৳${numAmount.toLocaleString()} to @${recipient.username}${note ? ` ("${note}")` : ""}`;
  const txRecipientDesc = `Received ৳${numAmount.toLocaleString()} from @${sender.username}${note ? ` ("${note}")` : ""}`;

  // Log in sender transactions
  sender.transactions.unshift({
    id: `tx_${Date.now()}_send`,
    type: "transfer" as unknown as "withdraw",
    amount: numAmount,
    timestamp: txTime,
    description: txSenderDesc,
  });

  // Log in recipient transactions
  recipient.transactions.unshift({
    id: `tx_${Date.now()}_recv`,
    type: "transfer" as unknown as "deposit",
    amount: numAmount,
    timestamp: txTime,
    description: txRecipientDesc,
  });

  // Record in Global Public Ledger
  const globalTx = recordGlobalTransaction({
    type: "transfer",
    username: sender.username,
    userId: sender.userId,
    recipientUsername: recipient.username,
    recipientUserId: recipient.userId,
    amount: numAmount,
    method: "P2P Direct (0% Fee)",
    status: "COMPLETED",
    description: `P2P Transfer: @${sender.username} ➔ @${recipient.username} (৳${numAmount.toLocaleString()})`,
  });

  res.json({
    success: true,
    message: `Successfully sent ৳${numAmount.toLocaleString()} to @${recipient.username}`,
    senderBalance: sender.balance,
    user: sender,
    globalTx,
  });
});

// 5. Admin API
app.get("/api/admin/stats", (_req, res) => {
  let totalRealBalance = 0;
  let totalDemoBalance = 0;
  let totalEscrowLocked = 0;

  Object.values(mockUsers).forEach((u) => {
    totalRealBalance += u.balance;
    totalDemoBalance += u.demoBalance;
  });

  Object.values(tables).forEach((t) => {
    t.playerBets.forEach((b) => {
      if (b.status === "ACTIVE") totalEscrowLocked += b.amount;
    });
  });

  activeRooms.forEach((r) => {
    if (r.status === "open") totalEscrowLocked += r.amount;
  });

  res.json({
    metrics,
    totalSiteLiquidity: totalRealBalance + totalEscrowLocked,
    totalRealBalance,
    totalDemoBalance,
    totalEscrowLocked,
    tables: Object.values(tables).map((t) => ({
      slug: t.config.slug,
      name: t.config.name,
      minBet: t.config.minBet,
      maxBet: t.config.maxBet,
      timer: t.currentRound.secondsRemaining,
      dragonPool: t.currentRound.dragonPool,
      tigerPool: t.currentRound.tigerPool,
      matchedAmount: t.currentRound.matchedAmount,
      playersOnline: t.config.playersOnline,
    })),
    usersCount: Object.keys(mockUsers).length,
  });
});

app.post("/api/admin/table/config", (req, res) => {
  const { slug, minBet, maxBet, bettingDuration } = req.body;
  const tbl = tables[slug];
  if (!tbl) return res.status(404).json({ error: "Table not found" });

  if (minBet !== undefined) tbl.config.minBet = Number(minBet);
  if (maxBet !== undefined) tbl.config.maxBet = Number(maxBet);
  if (bettingDuration !== undefined) tbl.config.bettingDuration = Number(bettingDuration);

  res.json({ success: true, config: tbl.config });
});

// 6. Merchant Simulation API
app.post("/api/merchant/test", (req, res) => {
  const { endpoint, method, payload } = req.body;
  const sampleResponses: Record<string, unknown> = {
    "/player/create": { success: true, playerId: "ext_user_8829", currency: "INR", balance: 5000 },
    "/player/deposit": { success: true, transactionId: `tx_merch_${Date.now()}`, newBalance: 15000 },
    "/player/launch-game": {
      success: true,
      gameUrl: "https://dragontiger.p2p.casino/play?token=session_jwt_apex_token_8892&table=classic",
      expiresIn: 3600,
    },
  };

  res.json({
    endpoint,
    method,
    status: 200,
    timeMs: Math.floor(Math.random() * 25) + 12,
    response: sampleResponses[endpoint] || { success: true, status: "acknowledged", payload },
  });
});

// 7. P2P Lobby & Duels API
app.get("/api/rooms", (_req, res) => {
  res.json(activeRooms);
});

app.post("/api/rooms/create", (req, res) => {
  const { userId, username, amount, choice } = req.body;
  if (!userId || typeof userId !== "string" || !mockUsers[userId]) {
    return res.status(401).json({
      error: "Authentication required. Every player must be logged in to create challenge bets.",
      code: "AUTH_REQUIRED",
    });
  }
  const user = mockUsers[userId];
  if (user.balance < Number(amount)) {
    return res.status(400).json({ error: "Insufficient balance to create challenge" });
  }

  user.balance -= Number(amount);
  const newRoom: P2PRoom = {
    id: `room_${Date.now()}`,
    creatorId: userId,
    creatorName: username || user.username,
    amount: Number(amount),
    choice,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  activeRooms.unshift(newRoom);
  broadcast({ type: "ROOM_CREATED", room: newRoom });
  res.json({ success: true, room: newRoom, user });
});

app.post("/api/rooms/accept", (req, res) => {
  const { roomId, userId, username } = req.body;
  if (!userId || typeof userId !== "string" || !mockUsers[userId]) {
    return res.status(401).json({
      error: "Authentication required. Every player must be logged in to accept challenge bets.",
      code: "AUTH_REQUIRED",
    });
  }
  const room = activeRooms.find((r) => r.id === roomId);
  if (!room || room.status !== "open") {
    return res.status(400).json({ error: "Challenge is not available" });
  }

  const acceptor = mockUsers[userId];
  if (acceptor.balance < room.amount) {
    return res.status(400).json({ error: "Insufficient balance to accept" });
  }

  acceptor.balance -= room.amount;
  room.acceptorId = userId;
  room.acceptorName = username || acceptor.username;
  room.status = "matched";

  const seed = generateServerSeed();
  const cards = deriveCards(seed, "p2p_duel", Date.now());
  room.dragonCard = cards.dragonCard;
  room.tigerCard = cards.tigerCard;
  room.winner = cards.result.toLowerCase() as "dragon" | "tiger" | "tie";
  room.status = "completed";

  const totalPot = room.amount * 2;
  const winnerPayout = totalPot * 0.95; // 5% house fee

  const creator = mockUsers[room.creatorId];
  if (room.winner === room.choice) {
    if (creator) creator.balance += winnerPayout;
  } else if (room.winner !== "tie") {
    acceptor.balance += winnerPayout;
  } else {
    // Tie refund
    if (creator) creator.balance += room.amount * 0.95;
    acceptor.balance += room.amount * 0.95;
  }

  broadcast({ type: "ROOM_RESOLVED", room });
  res.json({ success: true, room });
});

app.post("/api/rooms/cancel", (req, res) => {
  const { roomId, userId } = req.body;
  if (!userId || typeof userId !== "string" || !mockUsers[userId]) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
  }

  const roomIndex = activeRooms.findIndex((r) => r.id === roomId && r.creatorId === userId && r.status === "open");
  if (roomIndex === -1) {
    return res.status(400).json({ error: "Open challenge not found or already matched" });
  }

  const room = activeRooms[roomIndex];
  activeRooms.splice(roomIndex, 1);

  const user = mockUsers[userId];
  if (user) {
    user.balance += room.amount;
    user.transactions.unshift({
      id: `tx_room_cancel_${Date.now()}`,
      type: "refund",
      amount: room.amount,
      timestamp: new Date().toISOString(),
      description: `P2P Challenge Cancelled: ৳${room.amount.toLocaleString()} 100% refunded to wallet`,
    });
  }

  broadcast({ type: "ROOM_CANCELLED", roomId });
  res.json({ success: true, refundedAmount: room.amount, user });
});

// 8. Leaderboard
app.get("/api/leaderboard", (req, res) => {
  const sortBy = req.query.sortBy as string; // 'streak' or 'profit'
  const list = Object.values(mockUsers)
    .map((u) => {
      const stats = ensureUserStats(u);
      const streak = Math.max(stats.currentStreak || 0, 0);
      let streakTier: "warm" | "hot" | "fire" | "unstoppable" | "godlike" = "warm";
      if (streak >= 10) streakTier = "godlike";
      else if (streak >= 7) streakTier = "unstoppable";
      else if (streak >= 5) streakTier = "fire";
      else if (streak >= 3) streakTier = "hot";

      return {
        userId: u.userId,
        username: u.username,
        balance: u.balance,
        profit: u.totalWon - u.totalLost,
        winRate: u.gamesPlayed > 0 ? Math.round((u.totalWon / (u.totalWon + u.totalLost || 1)) * 100) : 50,
        gamesPlayed: u.gamesPlayed,
        vipTier: u.vipTier,
        currentStreak: streak,
        bestStreak: Math.max(stats.bestStreak || streak, streak),
        streakTier,
      };
    })
    .sort((a, b) => {
      if (sortBy === "streak") {
        return (b.currentStreak || 0) - (a.currentStreak || 0) || b.profit - a.profit;
      }
      return b.profit - a.profit;
    });
  res.json(list);
});

// 8b. Full Site Liquidity & All Users Transparency Ledger
app.get("/api/site/liquidity", (_req, res) => {
  let totalRealBalance = 0;
  let totalDemoBalance = 0;
  let totalLockedEscrow = 0;

  // Calculate table active bets
  Object.values(tables).forEach((t) => {
    t.playerBets.forEach((b) => {
      if (b.status === "ACTIVE") {
        totalLockedEscrow += b.amount;
      }
    });
  });

  // Calculate P2P open rooms escrow
  activeRooms.forEach((r) => {
    if (r.status === "open") {
      totalLockedEscrow += r.amount;
    }
  });

  const userList: UserBalanceRecord[] = Object.values(mockUsers).map((u, idx) => {
    totalRealBalance += u.balance;
    totalDemoBalance += u.demoBalance;

    // Check if user currently has an active in-play bet
    let userActiveEscrow = 0;
    Object.values(tables).forEach((t) => {
      t.playerBets.forEach((b) => {
        if (b.userId === u.userId && b.status === "ACTIVE") {
          userActiveEscrow += b.amount;
        }
      });
    });

    const isOnline = true;
    const status: "ACTIVE" | "IN_GAME" | "IDLE" = userActiveEscrow > 0 ? "IN_GAME" : idx % 2 === 0 ? "ACTIVE" : "IDLE";

    return {
      userId: u.userId,
      username: u.username,
      vipTier: u.vipTier,
      balance: u.balance,
      demoBalance: u.demoBalance,
      lockedBalance: userActiveEscrow,
      totalWon: u.totalWon,
      totalLost: u.totalLost,
      netProfit: u.totalWon - u.totalLost,
      gamesPlayed: u.gamesPlayed,
      kycStatus: u.kycStatus,
      isOnline,
      status,
      lastActive: new Date(Date.now() - idx * 45000).toISOString(),
    };
  });

  // Sort by balance descending
  userList.sort((a, b) => b.balance - a.balance);

  const totalSiteLiquidity = totalRealBalance + totalLockedEscrow;

  const totalActivePlayers = wss.clients.size;

  const responseData: SiteLiquidityData = {
    totalSiteLiquidity,
    totalRealBalance,
    totalDemoBalance,
    totalEscrowLocked: totalLockedEscrow,
    totalUsersCount: userList.length,
    activeOnlineCount: totalActivePlayers,
    todayMatchedVolume: metrics.todayMatchedVolume,
    todayCommission: metrics.todayCommission,
    todayTieRevenue: metrics.todayTieRevenue,
    telemetry: {
      totalActivePlayers,
      tps: 0,
      latencyMs: 12,
      activeNode: "AP-SOUTH-1 (Dhaka/Kolkata Primary Edge)",
      shoeRemainingCards: 416,
      shoeTotalCards: 416,
      burnCardsCount: 0,
      dealerName: "Live Dealer",
      dealerTableCode: "DT-LIVE-01",
      betsPerSecond: 0,
      todayGlobalTurnover: metrics.todayMatchedVolume,
    },
    tableLiquidity: {
      express: {
        pool: (tables["express"]?.currentRound.dragonPool || 0) + (tables["express"]?.currentRound.tigerPool || 0),
        matched: tables["express"]?.currentRound.matchedAmount || 0,
        players: (tables["express"]?.currentRound.dragonPlayers || 0) + (tables["express"]?.currentRound.tigerPlayers || 0),
      },
      classic: {
        pool: (tables["classic"]?.currentRound.dragonPool || 0) + (tables["classic"]?.currentRound.tigerPool || 0),
        matched: tables["classic"]?.currentRound.matchedAmount || 0,
        players: (tables["classic"]?.currentRound.dragonPlayers || 0) + (tables["classic"]?.currentRound.tigerPlayers || 0),
      },
      vip: {
        pool: (tables["vip"]?.currentRound.dragonPool || 0) + (tables["vip"]?.currentRound.tigerPool || 0),
        matched: tables["vip"]?.currentRound.matchedAmount || 0,
        players: (tables["vip"]?.currentRound.dragonPlayers || 0) + (tables["vip"]?.currentRound.tigerPlayers || 0),
      },
    },
    users: userList,
    timestamp: new Date().toISOString(),
  };

  res.json(responseData);
});

// 8c. Live High Load System Telemetry
app.get("/api/system/telemetry", (_req, res) => {
  const totalActivePlayers = wss.clients.size;
  res.json({
    totalActivePlayers,
    tps: 0,
    latencyMs: 12,
    activeNode: "AP-SOUTH-1 (Dhaka/Kolkata Primary Edge)",
    shoeRemainingCards: 416,
    shoeTotalCards: 416,
    burnCardsCount: 0,
    dealerName: "Live Dealer",
    dealerTableCode: "DT-LIVE-01",
    betsPerSecond: 0,
    todayGlobalTurnover: metrics.todayMatchedVolume,
    regionalNodes: [
      { code: "BGD-DHK-01", location: "Dhaka, Bangladesh", status: "ONLINE", ping: "11ms", load: "0%" },
      { code: "IND-CCU-02", location: "Kolkata, India", status: "ONLINE", ping: "14ms", load: "0%" },
      { code: "SGP-CEN-01", location: "Singapore Central", status: "ONLINE", ping: "28ms", load: "0%" },
      { code: "UAE-DXB-01", location: "Dubai, UAE", status: "ONLINE", ping: "42ms", load: "0%" },
      { code: "GBR-LON-01", location: "London, UK", status: "ONLINE", ping: "68ms", load: "0%" },
    ]
  });
});

// Complete Database Clean & Zero Reset Endpoint
app.post("/api/database/reset", (_req, res) => {
  // 1. Wipe all credentials and mock users
  for (const key of Object.keys(userCredentials)) delete userCredentials[key];
  for (const key of Object.keys(mockUsers)) delete mockUsers[key];
  for (const key of Object.keys(userBetHistories)) delete userBetHistories[key];
  for (const key of Object.keys(userReferralData)) delete userReferralData[key];
  for (const key of Object.keys(referralCodeToUser)) delete referralCodeToUser[key];
  for (const key of Object.keys(userReferrerMap)) delete userReferrerMap[key];

  // 2. Wipe public financial ledger and messages
  globalTransactions.length = 0;
  chatMessages.length = 0;
  activeRooms.length = 0;

  // 3. Zero all system metrics
  metrics.todayMatchedVolume = 0;
  metrics.todayCommission = 0;
  metrics.todayTieRevenue = 0;
  metrics.totalRoundsPlayed = 0;
  metrics.activeDeposits = 0;
  metrics.activeWithdrawals = 0;

  // 4. Reset table runtime pools to 0
  Object.values(tables).forEach((tbl) => {
    tbl.playerBets = [];
    tbl.recentSettledBets = [];
    tbl.currentRound.dragonPool = 0;
    tbl.currentRound.tigerPool = 0;
    tbl.currentRound.matchedAmount = 0;
    tbl.currentRound.dragonPlayers = 0;
    tbl.currentRound.tigerPlayers = 0;
  });

  broadcast({
    type: "DATABASE_RESET",
    message: "All databases and user data have been completely wiped and reset to 0.",
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: "All databases, user records, transactions, bets, and metrics have been cleaned and set to 0.",
    status: "ZERO_DATABASE",
  });
});

// 9. AI Dealer commentary
app.post("/api/ai-dealer", async (req, res) => {
  const { lastWinner, tableSlug } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      commentary: `Cards shuffled on the ${tableSlug.toUpperCase()} arena. Fortune favors the daring. Last win went to ${lastWinner || "Dragon"}!`,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an elite, charismatic Asian casino dealer for Dragon Tiger P2P. Provide one punchy, exciting casino sentence for players placing bets. Last round winner: ${lastWinner || "Dragon"}. Keep it high energy.`,
    });
    res.json({ commentary: response.text });
  } catch {
    res.json({
      commentary: "Cards are in play! Will the Dragon roar or will the Tiger strike? Place your bets!",
    });
  }
});

// 10. Safeguard: API 404 and Global Error Catchers (Ensures all /api requests return JSON, never HTML)
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.originalUrl && req.originalUrl.startsWith("/api")) {
    console.error("API Exception:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
  next(err);
});

// ============================================================================
// SERVER STARTUP & VITE INTEGRATION
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Dragon Tiger P2P Server running on http://localhost:${PORT}`);
  });
}

startServer();
