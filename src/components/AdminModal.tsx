import React, { useState, useEffect } from "react";
import { X, ShieldAlert, BarChart3, Users, DollarSign, Settings, RefreshCw, CheckCircle, Trash2, AlertTriangle } from "lucide-react";

interface AdminModalProps {
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ onClose }) => {
  const [stats, setStats] = useState<{
    metrics: {
      todayMatchedVolume: number;
      todayCommission: number;
      todayTieRevenue: number;
      totalRoundsPlayed: number;
    };
    totalSiteLiquidity?: number;
    totalRealBalance?: number;
    totalDemoBalance?: number;
    totalEscrowLocked?: number;
    tables: {
      slug: string;
      name: string;
      minBet: number;
      maxBet: number;
      timer: number;
      dragonPool: number;
      tigerPool: number;
      matchedAmount: number;
      playersOnline: number;
    }[];
    usersCount: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to load admin stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateTable = async (slug: string, minBet: number, maxBet: number) => {
    try {
      const res = await fetch("/api/admin/table/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, minBet, maxBet }),
      });
      if (res.ok) {
        setSaveSuccess(`Updated ${slug} table limits`);
        setTimeout(() => setSaveSuccess(null), 3000);
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("⚠️ ARE YOU SURE? This will permanently delete and wipe all databases, registered users, bets, transaction histories, and reset all metrics and pools to 0!")) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/database/reset", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess("Database completely cleaned and reset to 0!");
        setTimeout(() => setSaveSuccess(null), 4000);
        fetchStats();
      } else {
        alert("Failed to reset database: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error resetting database");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Executive Admin Console — God View
              </h2>
              <p className="text-xs text-neutral-400">
                Live monitoring of all game rooms, total site liquidity, and financial ledgers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Site Liquidity & Total Balances Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-3.5 rounded-xl border border-amber-500/20">
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-400">মোট প্ল্যাটফর্ম লিকুইডিটি</div>
              <div className="text-lg sm:text-xl font-mono font-black text-white">
                ৳{(stats?.totalSiteLiquidity || 0).toLocaleString()}
              </div>
              <div className="text-[9px] text-neutral-400">Real + Active Escrow</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-400">সকল ইউজারের ব্যালেন্স</div>
              <div className="text-lg sm:text-xl font-mono font-black text-emerald-400">
                ৳{(stats?.totalRealBalance || 0).toLocaleString()}
              </div>
              <div className="text-[9px] text-neutral-400">Across {stats?.usersCount || 0} Registered Users</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-400">লকড ইন-প্লে এসক্রো</div>
              <div className="text-lg sm:text-xl font-mono font-black text-blue-400">
                ৳{(stats?.totalEscrowLocked || 0).toLocaleString()}
              </div>
              <div className="text-[9px] text-neutral-400">Active Live Wagers</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-purple-400">মোট ডেমো ব্যালেন্স</div>
              <div className="text-lg sm:text-xl font-mono font-black text-purple-300">
                ৳{(stats?.totalDemoBalance || 0).toLocaleString()}
              </div>
              <div className="text-[9px] text-neutral-400">Practice Accounts</div>
            </div>
          </div>

          {/* Revenue & Ledger KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-xl">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Today's Matched Volume
              </div>
              <div className="text-xl font-bold text-amber-300 mt-1">
                ৳{stats?.metrics.todayMatchedVolume.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 font-medium">100% P2P Balanced</div>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-xl">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Platform Commission (5%)
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                ৳{stats?.metrics.todayCommission.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 font-medium">House revenue</div>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-xl">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Tie Retention Fund
              </div>
              <div className="text-xl font-bold text-blue-400 mt-1">
                ৳{stats?.metrics.todayTieRevenue.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 font-medium">50% pool retained on tie</div>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-xl">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Rounds Completed
              </div>
              <div className="text-xl font-bold text-purple-400 mt-1">
                {stats?.metrics.totalRoundsPlayed.toLocaleString() || "0"}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 font-medium">Across 3 tables</div>
            </div>
          </div>

          {/* Database Zero Reset Danger Zone */}
          <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/20 text-red-400 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider">Database Purge & Zero Reset</h4>
                <p className="text-[11px] text-neutral-400">
                  Delete all user databases, transaction records, history, chat messages, and reset all metrics to 0.
                </p>
              </div>
            </div>
            <button
              onClick={handleResetDatabase}
              disabled={isResetting}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-red-900/30 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              {isResetting ? "Purging All DB..." : "Wipe & Make DB 0"}
            </button>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {saveSuccess}
            </div>
          )}

          {/* Live Table Monitor */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Live Table State Machine & Pools
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats?.tables.map((tbl) => (
                <div key={tbl.slug} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{tbl.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                      ⏱ {tbl.timer}s Left
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-400">
                      <span>Dragon Pool:</span>
                      <span className="text-blue-400 font-bold">৳{tbl.dragonPool.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Tiger Pool:</span>
                      <span className="text-red-400 font-bold">৳{tbl.tigerPool.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Matched P2P Amount:</span>
                      <span className="text-emerald-400 font-bold">৳{tbl.matchedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Players in Room:</span>
                      <span className="text-white font-medium">{tbl.playersOnline} players</span>
                    </div>
                  </div>

                  {/* Limits config */}
                  <div className="pt-2 border-t border-neutral-800 space-y-2">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase">Betting Limits</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-neutral-500">Min Bet (৳)</label>
                        <input
                          type="number"
                          defaultValue={tbl.minBet}
                          onBlur={(e) => handleUpdateTable(tbl.slug, Number(e.target.value), tbl.maxBet)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-500">Max Bet (৳)</label>
                        <input
                          type="number"
                          defaultValue={tbl.maxBet}
                          onBlur={(e) => handleUpdateTable(tbl.slug, tbl.minBet, Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
