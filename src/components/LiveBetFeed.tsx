import React, { useState } from "react";
import { ShieldCheck, Eye, TrendingUp, Users, CheckCircle, XCircle, Clock, Filter, Flame, RotateCcw } from "lucide-react";
import { LiveBetRecord, UserWallet } from "../types";

interface LiveBetFeedProps {
  currentRoundBets: LiveBetRecord[];
  recentSettledBets: LiveBetRecord[];
  currentUser: UserWallet;
  roundNumber?: number;
}

export const LiveBetFeed: React.FC<LiveBetFeedProps> = ({
  currentRoundBets,
  recentSettledBets,
  currentUser,
  roundNumber = 1001,
}) => {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [filterSide, setFilterSide] = useState<"ALL" | "DRAGON" | "TIGER" | "MINE">("ALL");

  const betsToDisplay = activeTab === "current" ? currentRoundBets : recentSettledBets;

  const filteredBets = betsToDisplay.filter((bet) => {
    if (filterSide === "MINE") {
      return bet.userId === currentUser.userId;
    }
    if (filterSide !== "ALL") {
      return bet.side === filterSide;
    }
    return true;
  });

  // Calculate live stake sums for transparency
  const currentDragonTotal = currentRoundBets
    .filter((b) => b.side === "DRAGON")
    .reduce((acc, b) => acc + b.amount, 0);

  const currentTigerTotal = currentRoundBets
    .filter((b) => b.side === "TIGER")
    .reduce((acc, b) => acc + b.amount, 0);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "--:--:--";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Diamond":
        return "text-cyan-400 bg-cyan-950/60 border-cyan-800/60";
      case "Platinum":
        return "text-purple-300 bg-purple-950/60 border-purple-800/60";
      case "Gold":
        return "text-amber-300 bg-amber-950/60 border-amber-800/60";
      case "Silver":
        return "text-neutral-300 bg-neutral-800/80 border-neutral-700";
      default:
        return "text-amber-500 bg-amber-950/40 border-amber-900/40";
    }
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-neutral-100 uppercase tracking-wide">
                Live Transparency & Bet Feed
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-600/40 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                100% Real-Time
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Complete transparency: see which user placed how much on Dragon or Tiger.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "current"
                ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Current Round ({currentRoundBets.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "history"
                ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Settled History ({recentSettledBets.length})
          </button>
        </div>
      </div>

      {/* Live Volume Metrics Bar */}
      {activeTab === "current" && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 my-3">
          <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                Dragon Bets
              </span>
              <span className="text-sm sm:text-base font-extrabold text-red-200">
                ₹{currentDragonTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-red-400/80 bg-red-900/40 px-2 py-0.5 rounded-md font-mono">
              {currentRoundBets.filter((b) => b.side === "DRAGON").length} bets
            </span>
          </div>

          <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                Tiger Bets
              </span>
              <span className="text-sm sm:text-base font-extrabold text-blue-200">
                ₹{currentTigerTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-blue-400/80 bg-blue-900/40 px-2 py-0.5 rounded-md font-mono">
              {currentRoundBets.filter((b) => b.side === "TIGER").length} bets
            </span>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 text-xs no-scrollbar">
        <span className="text-neutral-500 text-[11px] font-medium flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {(["ALL", "DRAGON", "TIGER", "MINE"] as const).map((side) => (
          <button
            key={side}
            onClick={() => setFilterSide(side)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
              filterSide === side
                ? "bg-neutral-200 text-neutral-900 font-bold"
                : "bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            {side === "ALL" && "All Bets"}
            {side === "DRAGON" && "🐲 Dragon"}
            {side === "TIGER" && "🐯 Tiger"}
            {side === "MINE" && `👤 My Bets`}
          </button>
        ))}
      </div>

      {/* Bets Table */}
      <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-800 max-h-72 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-neutral-950/95 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
            <tr>
              <th className="py-2.5 px-3">Player / User</th>
              <th className="py-2.5 px-3">VIP Tier</th>
              <th className="py-2.5 px-3">Bet Side</th>
              <th className="py-2.5 px-3 text-right">Stake (₹)</th>
              <th className="py-2.5 px-3 text-right">
                {activeTab === "current" ? "Status" : "Result / Payout"}
              </th>
              <th className="py-2.5 px-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40">
            {filteredBets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-500">
                  {activeTab === "current"
                    ? "No bets placed for this filter yet. Place your bet to see it live!"
                    : "No settled bets found for this filter."}
                </td>
              </tr>
            ) : (
              filteredBets.map((bet) => {
                const isCurrentUser = bet.userId === currentUser.userId;
                const isHighStakes = bet.amount >= 1000;

                return (
                  <tr
                    key={bet.id}
                    className={`hover:bg-neutral-800/40 transition-colors ${
                      isCurrentUser ? "bg-amber-500/5 font-medium" : ""
                    }`}
                  >
                    {/* Username */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCurrentUser
                              ? "bg-amber-500 text-neutral-950"
                              : "bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          {bet.username.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`font-mono text-xs ${
                            isCurrentUser ? "text-amber-400 font-bold" : "text-neutral-200"
                          }`}
                        >
                          {bet.username}
                          {isCurrentUser && (
                            <span className="ml-1 text-[10px] text-amber-500 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-500/30">
                              YOU
                            </span>
                          )}
                          {bet.winStreak && bet.winStreak > 0 ? (
                            <span
                              title={`Active win streak: ${bet.winStreak} wins`}
                              className={`ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                bet.winStreak >= 7
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                                  : bet.winStreak >= 5
                                  ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                                  : bet.winStreak >= 3
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : "bg-neutral-800 text-neutral-300 border-neutral-700"
                              }`}
                            >
                              <Flame className="w-2.5 h-2.5 fill-current text-amber-400" />
                              <span>{bet.winStreak}</span>
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>

                    {/* VIP Tier */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(
                          bet.vipTier || "Bronze"
                        )}`}
                      >
                        {bet.vipTier || "Bronze"}
                      </span>
                    </td>

                    {/* Side */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {bet.side === "DRAGON" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-md">
                          🐲 DRAGON
                        </span>
                      )}
                      {bet.side === "TIGER" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md">
                          🐯 TIGER
                        </span>
                      )}
                      {bet.side === "TIE" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                          🤝 TIE (50% Refund)
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span
                        className={`font-mono font-bold ${
                          isHighStakes ? "text-amber-400 text-sm" : "text-neutral-100"
                        }`}
                      >
                        ₹{bet.amount.toLocaleString()}
                      </span>
                      {isHighStakes && (
                        <span className="inline-block ml-1 text-amber-400" title="High Stake">
                          🔥
                        </span>
                      )}
                    </td>

                    {/* Status or Result */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {activeTab === "current" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-600/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          ACTIVE
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          {bet.status === "WON" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-600/40">
                              <CheckCircle className="w-3 h-3" />
                              WON +৳{(bet.payout || 0).toLocaleString()}
                            </span>
                          ) : bet.status === "REFUNDED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-600/40">
                              <RotateCcw className="w-3 h-3 text-cyan-400" />
                              100% REFUND
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 bg-neutral-800/60 px-2 py-0.5 rounded-md border border-neutral-700/40">
                              <XCircle className="w-3 h-3 text-red-400" />
                              LOST
                            </span>
                          )}

                          {bet.unmatchedAmount !== undefined && bet.unmatchedAmount > 0 && (
                            <span className="text-[10px] font-bold font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                              +৳{bet.unmatchedAmount.toLocaleString()} REFUND
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 px-3 text-right text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                      {formatTime(bet.timestamp)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Every bet is cryptographically hashed & publicly auditable via SHA-512 provably fair HMAC.</span>
        </div>
        <div className="font-mono text-neutral-500">
          Showing {filteredBets.length} of {betsToDisplay.length} bets
        </div>
      </div>
    </div>
  );
};
