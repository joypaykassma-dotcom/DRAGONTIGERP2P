export interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "win" | "loss" | "p2p_stake" | "p2p_payout" | "faucet" | "refund" | "commission" | "tie_refund" | "TIE_REFUND";
  amount: number;
  timestamp: string;
  description: string;
  balanceBefore?: number;
  balanceAfter?: number;
  referenceId?: string;
}

export interface TablePerformance {
  slug: "express" | "classic" | "vip";
  tableName: string;
  handsPlayed: number;
  handsWon: number;
  handsLost: number;
  winRate: number; // in percentage, e.g. 65.5
  totalWagered: number;
  profit: number;
}

export interface SidePerformance {
  hands: number;
  wins: number;
  winRate: number;
}

export interface UserStats {
  totalHandsPlayed: number;
  handsWon: number;
  handsLost: number;
  handsTied: number;
  winRate: number; // overall percentage (0-100)
  biggestWin: number;
  currentStreak: number;
  bestStreak: number;
  tableBreakdown: {
    express: TablePerformance;
    classic: TablePerformance;
    vip: TablePerformance;
  };
  sideBreakdown: {
    dragon: SidePerformance;
    tiger: SidePerformance;
    tie: SidePerformance;
  };
  favoriteTable: string;
  favoriteSide: string;
}

export interface ReferredFriend {
  userId: string;
  username: string;
  joinedAt: string;
  totalWagered: number;
  commissionEarned: number;
  activeStatus: "ACTIVE" | "INACTIVE";
}

export interface ReferralData {
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

export interface UserWallet {
  userId: string;
  username: string;
  balance: number; // Real or active balance
  demoBalance: number;
  balanceType: "real" | "demo";
  lockedBalance: number;
  totalWon: number;
  totalLost: number;
  gamesPlayed: number;
  vipTier: string;
  kycStatus: "none" | "pending" | "verified";
  transactions: Transaction[];
  stats?: UserStats;
  referral?: ReferralData;
}

export interface PlayingCard {
  rank: string;
  suit: string;
  value: number; // 1 (Ace) to 13 (King)
  display: string;
}

export interface TableRound {
  roundId: string;
  roundNumber: number;
  tableSlug: "express" | "classic" | "vip";
  tableName: string;
  status: "BETTING" | "MATCHING" | "DEALING" | "SETTLING" | "COMPLETED";
  secondsRemaining: number;
  totalDuration: number;
  dragonPool: number;
  tigerPool: number;
  matchedAmount: number;
  dragonPlayers: number;
  tigerPlayers: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  serverSeed?: string; // Revealed after settlement
  dragonCard?: PlayingCard;
  tigerCard?: PlayingCard;
  result?: "DRAGON" | "TIGER" | "TIE";
  tieRevenue?: number;
  commission?: number;
}

export interface TableConfig {
  id: string;
  slug: "express" | "classic" | "vip";
  name: string;
  type: "Express" | "Classic" | "VIP";
  minBet: number;
  maxBet: number;
  bettingDuration: number;
  playersOnline: number;
  commissionRate: number;
}

export interface RoadmapItem {
  roundNumber: number;
  result: "DRAGON" | "TIGER" | "TIE";
  dragonCard: PlayingCard;
  tigerCard: PlayingCard;
  timestamp: string;
}

export interface LiveBetRecord {
  id: string;
  userId: string;
  username: string;
  vipTier: string;
  side: "DRAGON" | "TIGER" | "TIE";
  amount: number;
  balanceType: "real" | "demo";
  timestamp: string;
  roundNumber: number;
  tableSlug: string;
  status: "ACTIVE" | "WON" | "LOST" | "PUSH" | "REFUNDED" | "TIE_REFUND";
  payout?: number;
  matchedAmount?: number;
  unmatchedAmount?: number;
  tkReturnStatus?: "IN_ESCROW" | "RETURNED_WIN" | "RETURNED_REFUND" | "NO_RETURN";
  returnedAmount?: number;
  winStreak?: number;
}

export interface P2PRoom {
  id: string;
  creatorId: string;
  creatorName: string;
  amount: number;
  choice: "dragon" | "tiger";
  status: "open" | "matched" | "completed";
  acceptorId?: string;
  acceptorName?: string;
  winner?: "dragon" | "tiger" | "tie";
  dragonCard?: PlayingCard;
  tigerCard?: PlayingCard;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  balance: number;
  profit: number;
  winRate: number;
  gamesPlayed: number;
  vipTier: string;
  currentStreak?: number;
  bestStreak?: number;
  streakTier?: "warm" | "hot" | "fire" | "unstoppable" | "godlike";
}

export interface AdminStats {
  onlinePlayers: number;
  todayRevenue: number;
  todayMatchedVolume: number;
  todayCommission: number;
  todayTieRevenue: number;
  totalRoundsToday: number;
  pendingWithdrawals: number;
  systemHealth: string;
}

export interface UserBalanceRecord {
  userId: string;
  username: string;
  vipTier: string;
  balance: number;
  demoBalance: number;
  lockedBalance: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  gamesPlayed: number;
  kycStatus: "none" | "pending" | "verified";
  isOnline: boolean;
  status: "ACTIVE" | "IN_GAME" | "IDLE";
  lastActive: string;
}

export interface HighLoadTelemetry {
  totalActivePlayers: number;
  tps: number;
  latencyMs: number;
  activeNode: string;
  shoeRemainingCards: number;
  shoeTotalCards: number;
  burnCardsCount: number;
  dealerName: string;
  dealerTableCode: string;
  betsPerSecond: number;
  todayGlobalTurnover: number;
}

export interface SiteLiquidityData {
  totalSiteLiquidity: number;
  totalRealBalance: number;
  totalDemoBalance: number;
  totalEscrowLocked: number;
  totalUsersCount: number;
  activeOnlineCount: number;
  todayMatchedVolume: number;
  todayCommission: number;
  todayTieRevenue: number;
  telemetry?: HighLoadTelemetry;
  tableLiquidity: {
    express: { pool: number; matched: number; players: number };
    classic: { pool: number; matched: number; players: number };
    vip: { pool: number; matched: number; players: number };
  };
  users: UserBalanceRecord[];
  timestamp: string;
}

export interface UserBetHistoryItem {
  id: string;
  roundNumber: number;
  tableSlug: "express" | "classic" | "vip";
  tableName: string;
  side: "DRAGON" | "TIGER" | "TIE";
  amount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  returnedAmount: number;
  tkReturnStatus?: "NONE" | "RETURNED_REFUND" | "RETURNED_WIN" | "NO_RETURN";
  balanceType: "real" | "demo";
  status: "WON" | "LOST" | "REFUNDED" | "ACTIVE" | "TIE_REFUND";
  payout: number;
  netPnL: number;
  dragonCard?: PlayingCard;
  tigerCard?: PlayingCard;
  result?: "DRAGON" | "TIGER" | "TIE";
  timestamp: string;
  serverSeedHash?: string;
  serverSeed?: string;
}

export interface UserBetHistoryResponse {
  userId: string;
  username: string;
  totalWagered: number;
  totalMatched: number;
  totalReturned: number;
  totalWon: number;
  totalLost: number;
  netPnL: number;
  winRate: number;
  totalBetsCount: number;
  bets: UserBetHistoryItem[];
}

