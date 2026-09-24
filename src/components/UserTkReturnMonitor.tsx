import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  Sparkles,
  Layers,
} from "lucide-react";
import { LiveBetRecord, UserWallet } from "../types";
import { sound } from "../utils/audio";

interface UserTkReturnMonitorProps {
  user: UserWallet;
  currentRoundBets: LiveBetRecord[];
  activeConfirmedBet: { side: "DRAGON" | "TIGER" | "TIE"; amount: number; balanceType: "real" | "demo" } | null;
  roundNumber?: number;
  tableName?: string;
  onRefreshWallet: () => void;
  onOpenBetHistory?: () => void;
}

export const UserTkReturnMonitor: React.FC<UserTkReturnMonitorProps> = ({
  user,
  currentRoundBets,
  activeConfirmedBet,
  roundNumber = 1001,
  tableName = "Speed Arena",
  onRefreshWallet,
  onOpenBetHistory,
}) => {
  const [syncing, setSyncing] = useState<boolean>(false);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "RETURNED" | "LOSS">("ALL");

  // User's active bets in the current round
  const userCurrentBets = currentRoundBets.filter(
    (b) => b.userId === user.userId || b.username === user.username
  );

  const handleSync = async () => {
    sound.playButtonClick();
    setSyncing(true);
    try {
      await onRefreshWallet();
      sound.playCoinsClinking();
    } finally {
      setTimeout(() => setSyncing(false), 600);
    }
  };

  // Recent transactions related to bets and returns
  const gameTransactions = (user.transactions || []).filter(
    (tx) => tx.type === "win" || tx.type === "loss" || tx.type === "refund" || tx.type === "p2p_payout"
  );

  // Total calculated returns (wins + refunds)
  const totalReturns = (user.transactions || [])
    .filter((tx) => tx.type === "win" || tx.type === "refund" || tx.type === "p2p_payout")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalActiveInEscrow =
    (activeConfirmedBet ? activeConfirmedBet.amount : 0) +
    userCurrentBets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="bg-neutral-950/95 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 space-y-4 shadow-2xl text-neutral-100 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              Tk Return &amp; Active Bet Audit
            </h3>
            <p className="text-[10px] text-neutral-400">
              টাকা রিটার্ন ও একটিভ স্ট্যাটাস মনিটর (100% Escrow Proof)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenBetHistory && (
            <button
              onClick={onOpenBetHistory}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Open Full Detailed Betting History"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">ইতিহাস</span>
            </button>
          )}

          <button
            onClick={handleSync}
            disabled={syncing}
            title="Sync & Audit Balance"
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-amber-400" : ""}`} />
            <span className="hidden sm:inline">Sync Tk</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Active Bet Escrow Status */}
        <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Status: ACTIVE
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                totalActiveInEscrow > 0 ? "bg-emerald-400 animate-ping" : "bg-neutral-600"
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
              ₹{totalActiveInEscrow.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-400">in escrow</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            {totalActiveInEscrow > 0
              ? `Round #${roundNumber} active - Return on settle`
              : "No current bets in active escrow"}
          </div>
        </div>

        {/* Total Returns Settled */}
        <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Total Tk Returned
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black font-mono text-amber-300">
              ₹{totalReturns.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Credited</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            Current {user.balanceType === "real" ? "Real" : "Demo"}: ₹
            {(user.balanceType === "real" ? user.balance : user.demoBalance).toLocaleString()}
          </div>
        </div>
      </div>

      {/* ACTIVE BET ALERT BANNER */}
      {totalActiveInEscrow > 0 && (
        <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                STATUS: ACTIVE
              </span>
              <span className="text-xs font-bold text-white">Round #{roundNumber}</span>
            </div>
            <span className="text-[10px] text-neutral-400">{tableName}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20">
            <span className="text-neutral-300 font-medium">User Tk Return Status:</span>
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Held in Safe Escrow (Instant Return on Settlement)</span>
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[11px] font-bold">
        <button
          onClick={() => setFilter("ALL")}
          className={`flex-1 py-1 rounded-lg transition-all ${
            filter === "ALL" ? "bg-amber-500 text-neutral-950 font-black" : "text-neutral-400 hover:text-white"
          }`}
        >
          All ({gameTransactions.length + (totalActiveInEscrow > 0 ? 1 : 0)})
        </button>
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`flex-1 py-1 rounded-lg transition-all ${
            filter === "ACTIVE" ? "bg-amber-500 text-neutral-950 font-black" : "text-neutral-400 hover:text-white"
          }`}
        >
          Active ({totalActiveInEscrow > 0 ? 1 : 0})
        </button>
        <button
          onClick={() => setFilter("RETURNED")}
          className={`flex-1 py-1 rounded-lg transition-all ${
            filter === "RETURNED" ? "bg-amber-500 text-neutral-950 font-black" : "text-neutral-400 hover:text-white"
          }`}
        >
          Returned ({gameTransactions.filter((t) => t.type === "win" || t.type === "refund").length})
        </button>
        <button
          onClick={() => setFilter("LOSS")}
          className={`flex-1 py-1 rounded-lg transition-all ${
            filter === "LOSS" ? "bg-amber-500 text-neutral-950 font-black" : "text-neutral-400 hover:text-white"
          }`}
        >
          Settled Loss ({gameTransactions.filter((t) => t.type === "loss").length})
        </button>
      </div>

      {/* Audit List of Bet Returns and Statuses */}
      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {/* Active Bet Item */}
        {totalActiveInEscrow > 0 && (filter === "ALL" || filter === "ACTIVE") && (
          <div className="p-3 bg-neutral-900/90 border border-emerald-500/40 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ACTIVE
                </span>
                <span className="text-xs font-bold text-white">Current Table Stake</span>
              </div>
              <span className="font-mono text-xs font-black text-amber-300">
                ₹{totalActiveInEscrow.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
              <span>Tk Return Verdict:</span>
              <span className="text-emerald-400 font-semibold">
                ⏳ Protected in Escrow → Returns + Payout on Settle
              </span>
            </div>
          </div>
        )}

        {/* Transactions list */}
        {gameTransactions.length === 0 && totalActiveInEscrow === 0 ? (
          <div className="text-center py-6 text-neutral-500 text-xs">
            <Coins className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-amber-400" />
            No previous bets or returns found.
            <p className="text-[10px] text-neutral-600 mt-0.5">
              Place a bet to view real-time settlement &amp; Tk return records.
            </p>
          </div>
        ) : (
          gameTransactions.map((tx) => {
            const isReturn = tx.type === "win" || tx.type === "refund" || tx.type === "p2p_payout";

            if (filter === "ACTIVE") return null;
            if (filter === "RETURNED" && !isReturn) return null;
            if (filter === "LOSS" && isReturn) return null;

            return (
              <div
                key={tx.id}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  isReturn
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : "bg-neutral-950 border-neutral-800/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                        isReturn
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-red-500/20 text-red-400 border border-red-500/40"
                      }`}
                    >
                      {isReturn ? "✓" : "✗"}
                    </div>
                    <div>
                      <div className="font-semibold text-white truncate max-w-[170px] sm:max-w-[220px]">
                        {tx.description}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {new Date(tx.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-black ${
                        isReturn ? "text-emerald-400" : "text-neutral-400"
                      }`}
                    >
                      {isReturn ? `+₹${tx.amount.toLocaleString()}` : `-₹${tx.amount.toLocaleString()}`}
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        tx.type === "refund"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : isReturn
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {tx.type === "refund" ? "UNMATCHED REFUND" : isReturn ? "Tk RETURNED" : "SETTLED"}
                    </span>
                  </div>
                </div>

                {/* Explicit return guarantee audit label */}
                <div className="mt-1.5 pt-1.5 border-t border-neutral-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-neutral-500">Tk Return Status:</span>
                  <span className={tx.type === "refund" ? "text-amber-400 font-bold" : isReturn ? "text-emerald-400 font-bold" : "text-neutral-400"}>
                    {tx.type === "refund"
                      ? `🔄 আনম্যাচড ফুল টাকা ফেরত (+₹${tx.amount.toLocaleString()})`
                      : isReturn
                      ? `✅ টাকা রিটার্ন/উইন ক্রেডিট সম্পন্ন (+₹${tx.amount.toLocaleString()})`
                      : "❌ রাউন্ড লস (নো রিটার্ন)"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Escrow Guarantee & Unmatched Return Footer Note */}
      <div className="p-3 bg-neutral-900/80 border border-emerald-500/30 rounded-xl space-y-1.5 text-[10px] text-neutral-300">
        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>100% P2P Matching &amp; Tk Return Guarantee</span>
        </div>
        <p className="text-neutral-400 leading-relaxed">
          শুধুমাত্র প্রতিপক্ষের সাথে ম্যাচ হওয়া এমাউন্ট দিয়ে খেলা বা বেট হয়। অপোনেন্ট না পেয়ে আনম্যাচড থাকা বাকি টাকা (Unmatched Tk) রাউন্ড ক্লোজ হওয়ার সাথে সাথে ১০০% ইউজারের ওয়ালেটে ফেরত দেওয়া হয়।
        </p>
      </div>
    </div>
  );
};
