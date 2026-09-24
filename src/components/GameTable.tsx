import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  Shield,
  Trophy,
  RotateCcw,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Headphones,
  Radio,
  ShieldCheck,
  TrendingUp,
  Users,
  CheckCircle2,
  Coins,
  BookOpen,
  Clock,
  Scale,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Award,
} from "lucide-react";
import { UserWallet, TableRound, RoadmapItem, PlayingCard, LiveBetRecord } from "../types";
import { useSoundManager } from "../utils/useSoundManager";
import { LiveChat } from "./LiveChat";
import { LiveBetFeed } from "./LiveBetFeed";
import { LiveAction } from "./LiveAction";
import { UserTkReturnMonitor } from "./UserTkReturnMonitor";

interface GameTableProps {
  user: UserWallet;
  selectedTableSlug: "express" | "classic" | "vip";
  onUpdateWallet: (updatedUser: UserWallet) => void;
  onOpenProvablyFair: () => void;
  onOpenRoadmap: () => void;
  onOpenBetHistory?: () => void;
  onOpenRules?: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  user,
  selectedTableSlug,
  onUpdateWallet,
  onOpenProvablyFair,
  onOpenRoadmap,
  onOpenBetHistory,
  onOpenRules,
}) => {
  // SoundManager Hook
  const soundManager = useSoundManager();

  // Easy / Beginner Mode Toggle
  const [isEasyMode, setIsEasyMode] = useState<boolean>(false);
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(false);

  // Betting state
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [dragonBet, setDragonBet] = useState<number>(0);
  const [tigerBet, setTigerBet] = useState<number>(0);
  const [lastPlacedBet, setLastPlacedBet] = useState<{ dragon: number; tiger: number } | null>(null);
  const [autoBetActive, setAutoBetActive] = useState<boolean>(false);
  const [autoBetRoundsCount, setAutoBetRoundsCount] = useState<number>(0);
  const [activeConfirmedBet, setActiveConfirmedBet] = useState<{ side: "DRAGON" | "TIGER"; amount: number } | null>(null);

  // Live Table Round State from Server
  const [currentRound, setCurrentRound] = useState<TableRound | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [currentRoundBets, setCurrentRoundBets] = useState<LiveBetRecord[]>([]);
  const [recentSettledBets, setRecentSettledBets] = useState<LiveBetRecord[]>([]);
  const [dealerCommentary, setDealerCommentary] = useState<string>(
    "Welcome to the VIP Dragon Tiger Arena. Place your stakes before the timer expires!"
  );
  const [sidebarTab, setSidebarTab] = useState<"liveAction" | "returns" | "chat" | "roadmap" | "guide">("guide");
  const [showAudioControls, setShowAudioControls] = useState<boolean>(false);
  const [tieRefundBanner, setTieRefundBanner] = useState<{ amount: number; roundNumber: number } | null>(null);
  const [streakCelebration, setStreakCelebration] = useState<{ streak: number; roundNumber: number } | null>(null);

  const activeBalance = user.balanceType === "real" ? user.balance : user.demoBalance;
  const totalStagedBet = dragonBet + tigerBet;

  // Chips configuration
  const chips = [10, 50, 100, 500, 1000, 5000, 10000];

  // Fetch initial roadmap, round info, and transparent live bets
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const safeFetchJson = async (url: string) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return null;
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) return null;
            return await res.json();
          } catch {
            return null;
          }
        };

        const [tablesData, roadData, betsData] = await Promise.all([
          safeFetchJson("/api/tables"),
          safeFetchJson(`/api/tables/${selectedTableSlug}/roadmap`),
          safeFetchJson(`/api/tables/${selectedTableSlug}/bets`),
        ]);

        if (Array.isArray(tablesData)) {
          const match = tablesData.find((t: { config: { slug: string } }) => t.config.slug === selectedTableSlug);
          if (match) {
            setCurrentRound(match.currentRound);
          }
        }
        if (Array.isArray(roadData)) {
          setRoadmap(roadData);
        }
        if (betsData) {
          if (Array.isArray(betsData.currentRoundBets)) {
            setCurrentRoundBets(betsData.currentRoundBets);
          }
          if (Array.isArray(betsData.recentSettledBets)) {
            setRecentSettledBets(betsData.recentSettledBets);
          }
        }
      } catch (e) {
        console.error("Error fetching table data:", e);
      }
    };

    fetchTableData();
  }, [selectedTableSlug]);

  // WebSocket Live Subscription
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "TIMER_TICK" && data.tableSlug === selectedTableSlug) {
          setCurrentRound((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              secondsRemaining: data.secondsRemaining,
              dragonPool: data.dragonPool,
              tigerPool: data.tigerPool,
              matchedAmount: data.matchedAmount,
            };
          });
          if (data.secondsRemaining === 5) {
            soundManager.playLastBets();
          }
          if (data.secondsRemaining <= 5 && data.secondsRemaining > 0) {
            soundManager.playTick(data.secondsRemaining);
          }
        } else if (data.type === "ROUND_PHASE" && data.tableSlug === selectedTableSlug) {
          setCurrentRound((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: data.status,
              matchedAmount: data.matchedAmount,
              dragonPool: data.dragonPool !== undefined ? data.dragonPool : prev.dragonPool,
              tigerPool: data.tigerPool !== undefined ? data.tigerPool : prev.tigerPool,
            };
          });
          if (data.status === "MATCHING" || data.status === "DEALING") {
            soundManager.playBetsClosed();
            const dPool = data.dragonPool || 0;
            const tPool = data.tigerPool || 0;
            const mAmount = data.matchedAmount || 0;
            const returnedTotal = Math.max(0, (dPool + tPool) - (mAmount * 2));
            soundManager.announceMatchingPools(dPool, tPool, mAmount, returnedTotal);
            // Instantly refresh wallet upon matching so unmatched refunds appear immediately
            fetch(`/api/wallet/${user.userId}`)
              .then((r) => r.json())
              .then((updated) => onUpdateWallet(updated))
              .catch(() => {});
          }
        } else if (data.type === "ROUND_DEALING" && data.tableSlug === selectedTableSlug) {
          soundManager.triggerCardFlip();
          setCurrentRound((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: "DEALING",
              dragonCard: data.dragonCard,
              tigerCard: data.tigerCard,
              result: data.result,
            };
          });
        } else if (data.type === "NEW_BET" && data.tableSlug === selectedTableSlug) {
          if (data.bet) {
            setCurrentRoundBets((prev) => {
              if (prev.some((b) => b.id === data.bet.id)) return prev;
              return [data.bet, ...prev].slice(0, 60);
            });
          }
        } else if (data.type === "ROUND_RESULT" && data.tableSlug === selectedTableSlug) {
          setCurrentRound(data.round);
          setRoadmap(data.roadmap);
          if (Array.isArray(data.settledBets)) {
            setRecentSettledBets((prev) => [...data.settledBets, ...prev].slice(0, 80));
          }

          const winner = data.round.result;
          if (winner) {
            const dRank = data.round.dragonCard?.display || "Card";
            const tRank = data.round.tigerCard?.display || "Card";
            let payout = 0;
            let tieRefund = 0;

            if (activeConfirmedBet) {
              if (activeConfirmedBet.side === winner) {
                payout = winner === "TIE"
                  ? Math.floor(activeConfirmedBet.amount * 8)
                  : Math.floor(activeConfirmedBet.amount * 1.9);
              } else if (winner === "TIE" && (activeConfirmedBet.side === "DRAGON" || activeConfirmedBet.side === "TIGER")) {
                // 50% Tie Refund Rule!
                tieRefund = Math.floor(activeConfirmedBet.amount * 0.5);
                setTieRefundBanner({ amount: tieRefund, roundNumber: data.round.roundNumber });
              }
            }

            // Detailed announcements including card values, winner, payout, and tie refund
            soundManager.announceDetailedCardsAndResult(winner, dRank, tRank, payout, tieRefund);

            // Win or Loss sound & dealer voice based on active confirmed bet
            if (activeConfirmedBet) {
              if (activeConfirmedBet.side === winner) {
                soundManager.triggerWinningState(payout);
              } else if (winner === "TIE" && (activeConfirmedBet.side === "DRAGON" || activeConfirmedBet.side === "TIGER")) {
                soundManager.triggerCoinsClinking();
                soundManager.announceTieRefund(tieRefund);
              } else {
                soundManager.triggerLosingState(activeConfirmedBet.amount);
              }
            } else {
              soundManager.triggerCoinsClinking();
            }
          }

          // Fetch fresh wallet info and announce win streak if player won
          fetch(`/api/wallet/${user.userId}`)
            .then((r) => r.json())
            .then((updated) => {
              onUpdateWallet(updated);
              if (updated?.stats?.currentStreak && updated.stats.currentStreak >= 2 && activeConfirmedBet?.side === winner) {
                setStreakCelebration({ streak: updated.stats.currentStreak, roundNumber: data.round.roundNumber });
                soundManager.announceWinStreak(updated.stats.currentStreak);
              }
            })
            .catch(() => {});

          // AI Dealer Commentary
          fetch("/api/ai-dealer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lastWinner: data.round.result,
              tableSlug: selectedTableSlug,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.commentary) setDealerCommentary(d.commentary);
            })
            .catch(() => {});
        } else if (data.type === "NEW_ROUND" && data.tableSlug === selectedTableSlug) {
          setCurrentRound(data.round);
          setCurrentRoundBets([]);
          soundManager.triggerRoundInitiation();
          setActiveConfirmedBet(null);
          setTieRefundBanner(null);
          setStreakCelebration(null);

          // Handle Auto-Betting
          if (autoBetActive && lastPlacedBet) {
            setAutoBetRoundsCount((c) => c + 1);
            executePlaceBet(lastPlacedBet.dragon, lastPlacedBet.tiger);
          } else {
            setDragonBet(0);
            setTigerBet(0);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    return () => socket.close();
  }, [selectedTableSlug, autoBetActive, lastPlacedBet, user.userId, activeConfirmedBet]);

  const handleChipSelect = (amt: number) => {
    soundManager.playChip(1.2);
    setSelectedChip(amt);
  };

  const handleAddBet = (side: "dragon" | "tiger") => {
    if (!user || !user.userId) {
      alert("Every player must be logged in to bet. Please log in.");
      return;
    }
    if (!currentRound || currentRound.status !== "BETTING") return;
    if (activeBalance < totalStagedBet + selectedChip) {
      alert("Insufficient balance for this bet.");
      return;
    }

    soundManager.playChipStack();
    if (side === "dragon") setDragonBet((prev) => prev + selectedChip);
    if (side === "tiger") setTigerBet((prev) => prev + selectedChip);
  };

  const handleFollowBet = (side: "dragon" | "tiger" | "tie", amount: number) => {
    if (!user || !user.userId) {
      alert("Every player must be logged in to follow bets. Please log in.");
      return;
    }
    if (!currentRound || currentRound.status !== "BETTING") {
      alert("Betting is closed for this round.");
      return;
    }
    if (side === "tie") {
      alert("Tie-তে বাজি ধরা যায় না। শুধুমাত্র Dragon বা Tiger বেছে নিন।");
      return;
    }
    const currentStaged = dragonBet + tigerBet;
    const maxAvailable = activeBalance - currentStaged;
    if (maxAvailable <= 0) {
      alert("Insufficient balance to follow this bet.");
      return;
    }
    const addAmt = Math.min(amount, maxAvailable);
    soundManager.triggerCoinsClinking();
    if (side === "dragon") setDragonBet((p) => p + addAmt);
    else if (side === "tiger") setTigerBet((p) => p + addAmt);
  };

  const handleClearBets = () => {
    soundManager.playButtonClick();
    setDragonBet(0);
    setTigerBet(0);
  };

  const handleDoubleBet = () => {
    soundManager.playChipStack();
    if (activeBalance < totalStagedBet * 2) {
      alert("Insufficient balance to double bet.");
      return;
    }
    setDragonBet((p) => p * 2);
    setTigerBet((p) => p * 2);
  };

  const handleRepeatBet = () => {
    if (!lastPlacedBet) return;
    const needed = lastPlacedBet.dragon + lastPlacedBet.tiger;
    if (activeBalance < needed) {
      alert("Insufficient balance to repeat previous bet.");
      return;
    }
    soundManager.playChipStack();
    setDragonBet(lastPlacedBet.dragon);
    setTigerBet(lastPlacedBet.tiger);
  };

  const executePlaceBet = async (d: number, t: number) => {
    if (!user || !user.userId) {
      alert("Every player must be logged in to place a bet. Please log in.");
      return;
    }
    const total = d + t;
    if (total === 0) return;
    const primarySide: "dragon" | "tiger" = d >= t ? "dragon" : "tiger";

    try {
      const res = await fetch("/api/game/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          tableSlug: selectedTableSlug,
          side: primarySide,
          amount: total,
          balanceType: user.balanceType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        soundManager.triggerCoinsClinking();
        setLastPlacedBet({ dragon: d, tiger: t });
        setActiveConfirmedBet({
          side: primarySide.toUpperCase() as "DRAGON" | "TIGER",
          amount: total,
        });
        soundManager.announceBetAmount(total, primarySide.toUpperCase());
        if (data.bet) {
          setCurrentRoundBets((prev) => [data.bet, ...prev.filter((b) => b.id !== data.bet.id)]);
        }
        fetch(`/api/wallet/${user.userId}`)
          .then((r) => r.json())
          .then((updated) => onUpdateWallet(updated));
      } else {
        alert(data.error || "Failed to confirm bet");
      }
    } catch {
      alert("Network error placing bet");
    }
  };

  const handleConfirmBet = () => {
    if (totalStagedBet === 0) return;
    soundManager.triggerCoinsClinking();
    executePlaceBet(dragonBet, tigerBet);
  };

  // Timer visualization
  const maxTimer = currentRound?.totalDuration || 30;
  const timeLeft = currentRound?.secondsRemaining ?? maxTimer;
  const strokeDash = 283;
  const strokeDashoffset = strokeDash - (strokeDash * timeLeft) / maxTimer;

  return (
    <div className="space-y-4">
      {/* Top Banner, Live Croupier Commentary & Audio Manager Controls */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-md">
        <div className="flex items-center gap-2.5 truncate w-full sm:w-auto">
          <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-red-500/40 flex items-center justify-center text-red-500 flex-shrink-0 relative">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="truncate">
            <div className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 truncate">
              <span className="text-red-400 font-black">● LIVE HD</span>
              <span>·</span>
              <span className="text-amber-300 truncate">ELENA S. (STUDIO 4)</span>
            </div>
            <p className="text-xs text-neutral-200 font-medium italic truncate">
              "{dealerCommentary}"
            </p>
          </div>
        </div>

        {/* Casino Sound & Voice Controls + Modal Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          {/* Sound FX Toggle */}
          <button
            onClick={() => {
              soundManager.toggleSfx();
              soundManager.playButtonClick();
            }}
            title={soundManager.sfxEnabled ? "Casino Sound FX: Active" : "Casino Sound FX: Muted"}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              soundManager.sfxEnabled
                ? "bg-neutral-800 border-neutral-700 text-emerald-400 hover:bg-neutral-700"
                : "bg-neutral-950 border-neutral-800 text-neutral-500"
            }`}
          >
            {soundManager.sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{soundManager.sfxEnabled ? "SFX On" : "Muted"}</span>
          </button>

          {/* Croupier Voice Toggle */}
          <button
            onClick={() => {
              soundManager.toggleVoice();
              soundManager.playButtonClick();
            }}
            title={soundManager.voiceEnabled ? "Live Croupier Voice: Active" : "Live Croupier Voice: Muted"}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              soundManager.voiceEnabled
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25"
                : "bg-neutral-950 border-neutral-800 text-neutral-500"
            }`}
          >
            {soundManager.voiceEnabled ? <Mic className="w-3.5 h-3.5 text-amber-400" /> : <MicOff className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{soundManager.voiceEnabled ? "Voice On" : "Muted"}</span>
          </button>

          {/* Audio Suite Quick Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowAudioControls(!showAudioControls)}
              title="Casino Sound & Voice Studio"
              className="px-2 py-1.5 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors flex items-center gap-1"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Audio</span>
            </button>

            {/* Audio Studio Popup Dropdown */}
            {showAudioControls && (
              <div className="absolute right-0 top-11 z-50 w-72 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    Casino Sound Manager
                  </span>
                  <button
                    onClick={() => setShowAudioControls(false)}
                    className="text-neutral-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Ambient Crowd Volume Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Crowd Noise Volume</span>
                    <span className="font-mono text-cyan-400">
                      {Math.round(soundManager.ambientVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundManager.ambientVolume}
                    onChange={(e) => soundManager.setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Sound Test Triggers */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] text-neutral-500 uppercase font-semibold">
                    Test Casino Audio Effects
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => soundManager.triggerCoinsClinking()}
                      className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-medium text-left"
                    >
                      🪙 Clink Coins
                    </button>
                    <button
                      onClick={() => soundManager.triggerCardFlip()}
                      className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-medium text-left"
                    >
                      🃏 Flip Card
                    </button>
                    <button
                      onClick={() => soundManager.announceBetAmount(500, "Dragon")}
                      className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-medium text-left"
                    >
                      🎙️ Bet Voice
                    </button>
                    <button
                      onClick={() => soundManager.triggerWinningState(950)}
                      className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-medium text-left"
                    >
                      🏆 Win Fanfare
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Guide Toggle */}
          <button
            onClick={() => setShowQuickGuide(!showQuickGuide)}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
              showQuickGuide
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white"
            }`}
            title="Toggle Quick Guide"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {onOpenRules && (
            <button
              onClick={onOpenRules}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-colors"
              title="Official Rules & Payout Rates"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Rules</span>
            </button>
          )}

          {onOpenBetHistory && (
            <button
              onClick={onOpenBetHistory}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
              title="My Bet History & P&L"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">History</span>
            </button>
          )}

          <button
            onClick={onOpenProvablyFair}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Fairness</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Arena (3 cols) */}
        <div className="lg:col-span-3 space-y-3 sm:space-y-4">
          {/* 3-Step Easy Beginner Guide (Only shown if toggled active) */}
          {showQuickGuide && (
            <div className="bg-gradient-to-r from-amber-500/10 via-neutral-900/90 to-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-amber-300">
                      ৩টি সহজ ধাপে খেলুন ও জিতুন (How to Play in 3 Easy Steps)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickGuide(false)}
                  className="text-neutral-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800"
                >
                  <span>বন্ধ করুন</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1 text-xs">
                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    totalStagedBet === 0
                      ? "bg-amber-500/15 border-amber-500/50 shadow-sm"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <span className="text-amber-300">চিপ বেছে নিন (৳{selectedChip})</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-snug">
                    নিচের চিপ তালিকা থেকে বাজি ধরার পরিমাণ (যেমন: ৳১০, ৳৫০, ৳১০০) সিলেক্ট করুন।
                  </p>
                </div>

                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    totalStagedBet > 0 && !activeConfirmedBet
                      ? "bg-blue-500/15 border-blue-500/50 shadow-sm"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <span className="text-blue-300">ড্রাগন বা টাইগারে চাপুন</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-snug">
                    যেকোনো একটি সাইডে ক্লিক করুন। যার কার্ড বড় হবে সে জিতবে (১.৯ গুণ রিটার্ন)!
                  </p>
                </div>

                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    totalStagedBet > 0
                      ? "bg-emerald-500/20 border-emerald-500/60 shadow-md ring-1 ring-emerald-400 animate-pulse"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center text-[10px] font-black">
                      3
                    </span>
                    <span className="text-emerald-300">'Confirm Bet' চাপুন</span>
                  </div>
                  <p className="text-[11px] text-emerald-300 font-medium leading-snug">
                    কনফার্ম চাপলেই বাজি কার্যকর হবে। অমিল থাকলে সম্পূর্ণ টাকা সাথে সাথে ফেরত পাবেন!
                  </p>
                </div>
              </div>
            </div>
          )}

            {/* Card Rank Hierarchy strip */}
            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between text-[10px] sm:text-[11px] text-neutral-400 gap-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-bold">কার্ডের ক্রম:</span>
                <span className="text-white font-mono font-bold">
                  K (১৩, বড়) &gt; Q &gt; J &gt; 10 &gt; 9 ... &gt; 2 &gt; A (১, ছোট)
                </span>
              </div>
              <div className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>আনম্যাচ টাকা তাৎক্ষণিক রিফান্ড (০% ফি)</span>
              </div>
            </div>

          {/* Card Table Felt */}
          <div className="relative bg-gradient-to-b from-[#0e1626] via-[#09101c] to-[#040811] border-2 border-amber-500/30 rounded-2xl sm:rounded-3xl p-3 sm:p-5 lg:p-6 shadow-2xl overflow-hidden min-h-[380px] sm:min-h-[440px] flex flex-col justify-between">
            {/* Ambient Felt Pattern & Table Badge */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-neutral-800/60 sm:border-0 sm:pb-0 sm:mb-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-amber-500/20">
                  {currentRound?.tableName || "Dragon Tiger"}
                </span>
                <span className="text-[10px] sm:text-xs text-neutral-400 font-mono">
                  #{currentRound?.roundNumber || "1001"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* In-Game Win Streak Indicator */}
                {user?.stats && (
                  <div
                    title={`বর্তমান উইন স্ট্রিক: ${user.stats.currentStreak} রাউন্ড (সর্বোচ্চ: ${user.stats.bestStreak || user.stats.currentStreak})`}
                    className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl text-[11px] sm:text-xs font-black border transition-all shadow-md ${
                      (user.stats.currentStreak || 0) >= 7
                        ? "bg-rose-500/25 border-rose-400 text-rose-200 shadow-rose-950/50 animate-pulse"
                        : (user.stats.currentStreak || 0) >= 5
                        ? "bg-orange-500/20 border-orange-400 text-orange-200 shadow-orange-950/40"
                        : (user.stats.currentStreak || 0) >= 3
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-neutral-900/90 border-neutral-800 text-neutral-300"
                    }`}
                  >
                    <Flame className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${(user.stats.currentStreak || 0) >= 3 ? "text-amber-400 fill-amber-400 animate-bounce" : "text-neutral-400"}`} />
                    <span>🔥 {user.stats.currentStreak || 0} Streak</span>
                    {(user.stats.bestStreak || 0) > 0 && (
                      <span className="text-[10px] text-neutral-400 hidden sm:inline border-l border-neutral-700 pl-1.5 ml-0.5 font-normal">
                        Best: {user.stats.bestStreak}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-400 bg-neutral-900/80 px-2 py-0.5 sm:py-1 rounded-lg border border-neutral-800">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                  <span>
                    {(currentRound?.dragonPlayers || 0) + (currentRound?.tigerPlayers || 0)} Players
                  </span>
                </div>
              </div>
            </div>

            {/* Circular Countdown Timer */}
            <div className="flex flex-col items-center justify-center my-2 sm:my-4">
              <div className="relative w-18 h-18 sm:w-24 sm:h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="45"
                    stroke="#1E293B"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="45"
                    stroke={
                      timeLeft <= 5 ? "#EF4444" : timeLeft <= 10 ? "#F59E0B" : "#10B981"
                    }
                    strokeWidth="6"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span
                    className={`text-xl sm:text-2xl font-black ${
                      timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"
                    }`}
                  >
                    {currentRound?.status === "BETTING" ? timeLeft : "0"}
                  </span>
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-neutral-400">
                    {currentRound?.status || "WAITING"}
                  </span>
                </div>
              </div>

              {/* Matching Status */}
              <div className="mt-1.5 sm:mt-2 text-center px-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/90 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold text-amber-300 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>P2P Matched Volume: ৳{(currentRound?.matchedAmount || 0).toLocaleString()} (In-Play)</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1">
                  <span>🛡️ শুধুমাত্র ম্যাচড এমাউন্ট বেট হবে — আনম্যাচড বাকি টাকা সাথে সাথে ইউজার ব্যালেন্সে রিফান্ড হবে</span>
                </div>
              </div>

              {/* In-Game Tie 50% Refund Alert Banner */}
              {tieRefundBanner && (
                <div className="mt-2 p-3 rounded-2xl bg-gradient-to-r from-amber-500/25 via-emerald-500/20 to-amber-500/25 border-2 border-amber-400/60 shadow-xl shadow-amber-950/50 flex items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 text-base shrink-0">
                      ⚖️
                    </div>
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-black text-amber-200 flex items-center gap-2">
                        <span>টাই রেজাল্ট — ৫০% রিফান্ড ক্রেডিট হয়েছে!</span>
                        <span className="text-[10px] bg-emerald-500 text-neutral-950 font-black px-1.5 py-0.5 rounded">
                          +৳{tieRefundBanner.amount.toLocaleString()} ফেরত
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-neutral-300 mt-0.5 leading-snug">
                        নিয়ম অনুযায়ী টাই হওয়ায় বাজির ৫০% টাকা আপনার একাউন্টে ফেরত দেওয়া হয়েছে এবং বাকি ৫০% কোম্পানি ফান্ডে জমা হয়েছে।
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* In-Game Win Streak Celebration Banner */}
              {streakCelebration && (
                <div className="mt-2 p-3 rounded-2xl bg-gradient-to-r from-orange-500/30 via-rose-500/30 to-amber-500/30 border-2 border-orange-400 shadow-2xl shadow-orange-950/60 flex items-center justify-between gap-3 text-white animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/30 border border-orange-400/60 flex items-center justify-center text-orange-300 text-base shrink-0">
                      🔥
                    </div>
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-black text-orange-200 flex items-center gap-2">
                        <span>টানা {streakCelebration.streak} রাউন্ড জয়! আপনি অন-ফায়ার!</span>
                        <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded uppercase">
                          {streakCelebration.streak >= 7 ? "Unstoppable" : streakCelebration.streak >= 5 ? "On Fire" : "Hot Streak"}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-neutral-200 mt-0.5">
                        টানা জয়ের ধারা বজায় রেখে লিডারবোর্ডের শীর্ষে উঠুন এবং অতিরিক্ত ভিআইপি সুবিধা উপভোগ করুন!
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black text-amber-300">
                      🔥 x{streakCelebration.streak}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Action Quick Broadcast Ticker */}
            {currentRoundBets.length > 0 && (
              <div className="mb-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between text-xs backdrop-blur-md">
                <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                  <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500 animate-pulse shrink-0" />
                  <span className="text-[9px] sm:text-[10px] text-amber-400 shrink-0 font-black uppercase tracking-wider">
                    Live Action:
                  </span>
                  <span className="truncate text-neutral-300 font-medium text-[11px] sm:text-xs">
                    <strong className="text-white font-bold">{currentRoundBets[0].username}</strong> bet{" "}
                    <strong className="text-amber-400 font-mono font-bold">
                      ৳{currentRoundBets[0].amount.toLocaleString()}
                    </strong>{" "}
                    on{" "}
                    <strong
                      className={
                        currentRoundBets[0].side === "DRAGON"
                          ? "text-blue-400 font-bold"
                          : "text-red-400 font-bold"
                      }
                    >
                      {currentRoundBets[0].side}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleFollowBet(
                      currentRoundBets[0].side.toLowerCase() as "dragon" | "tiger",
                      currentRoundBets[0].amount
                    )
                  }
                  className="ml-2 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shrink-0"
                >
                  Follow Bet
                </button>
              </div>
            )}

            {/* Cards & Battle Sides: Vertical Stack Layout on Mobile, 2-Column Grid on Desktop */}
            <div className="flex flex-col md:grid md:grid-cols-2 gap-3 sm:gap-6 my-2 relative">
              {/* DRAGON SIDE */}
              <div
                onClick={() => handleAddBet("dragon")}
                className={`cursor-pointer group relative rounded-2xl p-3 sm:p-5 border-2 transition-all flex flex-col items-center justify-between min-h-[160px] sm:min-h-[185px] ${
                  currentRound?.result === "DRAGON"
                    ? "bg-blue-600/30 border-blue-400 shadow-xl shadow-blue-500/40 scale-[1.01]"
                    : "bg-blue-950/20 border-blue-600/40 hover:border-blue-400 hover:bg-blue-950/40 active:scale-[0.99]"
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-blue-400 text-sm sm:text-base tracking-wider uppercase">
                      DRAGON
                    </span>
                    <span className="text-[11px] sm:text-xs text-blue-300 font-medium">(ড্রাগন)</span>
                  </div>
                  <span className="text-blue-300 font-bold bg-blue-500/20 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs border border-blue-500/30">
                    1.9x গুণ
                  </span>
                </div>

                {/* Card Display */}
                <div className="my-2">
                  {currentRound?.dragonCard ? (
                    <div className="w-16 h-22 sm:w-18 sm:h-26 bg-white rounded-xl shadow-2xl border border-neutral-300 flex flex-col items-center justify-between p-2 transform hover:scale-105 transition-transform animate-card-flip">
                      <span className="text-xs sm:text-sm font-black text-neutral-900 self-start">
                        {currentRound.dragonCard.rank}
                      </span>
                      <span className="text-2xl sm:text-3xl text-red-600">
                        {currentRound.dragonCard.suit}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-neutral-900 self-end">
                        {currentRound.dragonCard.rank}
                      </span>
                    </div>
                  ) : (
                    <div className="w-16 h-22 sm:w-18 sm:h-26 rounded-xl border-2 border-dashed border-blue-500/40 bg-blue-950/40 flex flex-col items-center justify-center text-blue-400/80 font-mono text-xs">
                      <span className="font-bold text-xs">DRAGON</span>
                      <span className="text-[10px] text-blue-300/70 mt-0.5">১ম কার্ড</span>
                    </div>
                  )}
                </div>

                {/* Current Pool & Staged Bet */}
                <div className="w-full text-center">
                  <div className="text-[10px] sm:text-xs text-neutral-400 flex items-center justify-center gap-1">
                    <span>পুল:</span>
                    <span className="text-white font-mono font-bold">৳{(currentRound?.dragonPool || 0).toLocaleString()}</span>
                  </div>
                  {dragonBet > 0 ? (
                    <div className="mt-1 px-3 py-1 rounded-xl bg-blue-500 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5">
                      <span>৳{dragonBet.toLocaleString()}</span>
                      <span className="text-[10px] sm:text-xs text-blue-100">➔ ৳{Math.floor(dragonBet * 1.9).toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="mt-1 py-0.5 px-2 rounded-lg text-blue-400 font-semibold text-xs group-hover:text-blue-300 transition-colors">
                      +৳{selectedChip}
                    </div>
                  )}
                </div>
              </div>

              {/* TIGER SIDE */}
              <div
                onClick={() => handleAddBet("tiger")}
                className={`cursor-pointer group relative rounded-2xl p-3 sm:p-5 border-2 transition-all flex flex-col items-center justify-between min-h-[160px] sm:min-h-[185px] ${
                  currentRound?.result === "TIGER"
                    ? "bg-red-600/30 border-red-400 shadow-xl shadow-red-500/40 scale-[1.01]"
                    : "bg-red-950/20 border-red-600/40 hover:border-red-400 hover:bg-red-950/40 active:scale-[0.99]"
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-red-400 text-sm sm:text-base tracking-wider uppercase">
                      TIGER
                    </span>
                    <span className="text-[11px] sm:text-xs text-red-300 font-medium">(টাইগার)</span>
                  </div>
                  <span className="text-red-300 font-bold bg-red-500/20 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs border border-red-500/30">
                    1.9x গুণ
                  </span>
                </div>

                {/* Card Display */}
                <div className="my-2">
                  {currentRound?.tigerCard ? (
                    <div className="w-16 h-22 sm:w-18 sm:h-26 bg-white rounded-xl shadow-2xl border border-neutral-300 flex flex-col items-center justify-between p-2 transform hover:scale-105 transition-transform animate-card-flip">
                      <span className="text-xs sm:text-sm font-black text-neutral-900 self-start">
                        {currentRound.tigerCard.rank}
                      </span>
                      <span className="text-2xl sm:text-3xl text-neutral-900">
                        {currentRound.tigerCard.suit}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-neutral-900 self-end">
                        {currentRound.tigerCard.rank}
                      </span>
                    </div>
                  ) : (
                    <div className="w-16 h-22 sm:w-18 sm:h-26 rounded-xl border-2 border-dashed border-red-500/40 bg-red-950/40 flex flex-col items-center justify-center text-red-400/80 font-mono text-xs">
                      <span className="font-bold text-xs">TIGER</span>
                      <span className="text-[10px] text-red-300/70 mt-0.5">২য় কার্ড</span>
                    </div>
                  )}
                </div>

                {/* Current Pool & Staged Bet */}
                <div className="w-full text-center">
                  <div className="text-[10px] sm:text-xs text-neutral-400 flex items-center justify-center gap-1">
                    <span>পুল:</span>
                    <span className="text-white font-mono font-bold">৳{(currentRound?.tigerPool || 0).toLocaleString()}</span>
                  </div>
                  {tigerBet > 0 ? (
                    <div className="mt-1 px-3 py-1 rounded-xl bg-red-500 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5">
                      <span>৳{tigerBet.toLocaleString()}</span>
                      <span className="text-[10px] sm:text-xs text-red-100">➔ ৳{Math.floor(tigerBet * 1.9).toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="mt-1 py-0.5 px-2 rounded-lg text-red-400 font-semibold text-xs group-hover:text-red-300 transition-colors">
                      +৳{selectedChip}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tie Outcome & 50% Refund Rule Bar (Non-Bettable) */}
            <div
              className={`rounded-xl p-2 sm:p-2.5 border transition-all flex flex-col sm:flex-row items-center justify-between gap-2 px-3 ${
                currentRound?.result === "TIE"
                  ? "bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border-emerald-400 text-white shadow-xl ring-2 ring-emerald-400/50 animate-pulse"
                  : "bg-neutral-950/60 border-neutral-800 text-neutral-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  <span>TIE</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 uppercase">
                    50% Refund
                  </span>
                </div>
              </div>
              
              <div className="text-[10px] sm:text-[11px] text-neutral-400 text-center sm:text-right">
                {currentRound?.result === "TIE" ? (
                  <span className="text-emerald-300 font-black">
                    🎉 টাই ফলাফল — বাজির ৫০% টাকা ফেরত প্রদান করা হয়েছে!
                  </span>
                ) : (
                  <span>
                    উভয় কার্ড সমান হলে ৫০% টাকা একাউন্টে ফেরত পাওয়া যাবে।
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Chips Selector & Action Bar */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 sm:p-4 space-y-3">
            {/* Chip denominations */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div className="text-[11px] font-bold text-amber-400 uppercase shrink-0 flex items-center gap-1 tracking-wider">
                <span>SELECT CHIP:</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleChipSelect(c)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-black text-xs border-2 transition-all flex items-center justify-center shadow-lg shrink-0 active:scale-95 ${
                      selectedChip === c
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 border-white scale-105 shadow-amber-500/40 ring-2 ring-amber-400/50"
                        : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-amber-400"
                    }`}
                  >
                    {c >= 1000 ? `${c / 1000}k` : c}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: 2x Double, Repeat, Auto-Bet, Clear, Confirm */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 pt-1.5 border-t border-neutral-800">
              <button
                onClick={handleRepeatBet}
                disabled={!lastPlacedBet}
                className="min-h-[46px] py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 disabled:opacity-40 text-neutral-300 border border-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Repeat Bet</span>
              </button>

              <button
                onClick={handleDoubleBet}
                disabled={totalStagedBet === 0}
                className="min-h-[46px] py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 disabled:opacity-40 text-neutral-300 border border-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>2x Double</span>
              </button>

              <button
                onClick={() => setAutoBetActive(!autoBetActive)}
                className={`min-h-[46px] py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  autoBetActive
                    ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-500/30"
                    : "bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 text-neutral-300 border-neutral-800"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{autoBetActive ? `Auto (${autoBetRoundsCount})` : "Auto Bet"}</span>
              </button>

              <button
                onClick={handleClearBets}
                disabled={totalStagedBet === 0}
                className="min-h-[46px] py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 disabled:opacity-40 text-red-400 border border-neutral-800 text-xs font-bold transition-all flex items-center justify-center"
              >
                <span>Clear Bets</span>
              </button>

              <button
                onClick={handleConfirmBet}
                disabled={totalStagedBet === 0 || currentRound?.status !== "BETTING"}
                className={`col-span-2 sm:col-span-2 lg:col-span-1 min-h-[50px] sm:min-h-[46px] py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                  totalStagedBet > 0
                    ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-neutral-950 shadow-amber-500/50 scale-[1.01] ring-2 ring-amber-400"
                    : "bg-neutral-800 text-neutral-500 border border-neutral-700"
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${totalStagedBet > 0 ? "text-neutral-950" : "text-neutral-500"}`} />
                <span>{totalStagedBet > 0 ? `Confirm ৳${totalStagedBet.toLocaleString()}` : "Confirm Bet"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar (1 col): Live Action Feed, Chat, Guide, Tk Return or Shoe Roadmap */}
        <div className="space-y-3">
          {/* Tab Selection Bar */}
          <div className="flex items-center bg-[#161B26] p-1.5 rounded-xl border border-white/10 text-xs font-semibold shadow-inner gap-1 overflow-x-auto">
            <button
              onClick={() => {
                setSidebarTab("guide");
                soundManager.playButtonClick();
              }}
              className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all shrink-0 ${
                sidebarTab === "guide"
                  ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                  : "text-neutral-300 hover:text-white hover:bg-[#202736]"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0 text-neutral-950 font-bold" />
              <span className="truncate">Guide</span>
            </button>

            <button
              onClick={() => {
                setSidebarTab("liveAction");
                soundManager.playButtonClick();
              }}
              className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all shrink-0 ${
                sidebarTab === "liveAction"
                  ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                  : "text-neutral-300 hover:text-white hover:bg-[#202736]"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
              <span className="truncate">Action</span>
              {currentRoundBets.length > 0 && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                    sidebarTab === "liveAction"
                      ? "bg-neutral-950 text-amber-300"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  {currentRoundBets.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setSidebarTab("returns");
                soundManager.playButtonClick();
              }}
              className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all relative shrink-0 ${
                sidebarTab === "returns"
                  ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                  : "text-neutral-300 hover:text-white hover:bg-[#202736]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap truncate">Tk Return</span>
              {activeConfirmedBet && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
              )}
            </button>

            <button
              onClick={() => {
                setSidebarTab("chat");
                soundManager.playButtonClick();
              }}
              className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all shrink-0 ${
                sidebarTab === "chat"
                  ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                  : "text-neutral-300 hover:text-white hover:bg-[#202736]"
              }`}
            >
              <span className="truncate">Chat</span>
            </button>

            <button
              onClick={() => {
                setSidebarTab("roadmap");
                soundManager.playButtonClick();
              }}
              className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all shrink-0 ${
                sidebarTab === "roadmap"
                  ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                  : "text-neutral-300 hover:text-white hover:bg-[#202736]"
              }`}
            >
              <span className="truncate">Trend</span>
            </button>
          </div>

          {/* Tab Content Display */}
          {sidebarTab === "guide" && (
            <div className="bg-[#161B26] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-xl text-neutral-200">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white tracking-wide">সহজ গাইড ও নিয়মাবলী</h3>
                    <p className="text-[10px] text-neutral-400">Beginner Quick Rules</p>
                  </div>
                </div>
                {onOpenRules && (
                  <button
                    onClick={onOpenRules}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <span>সম্পূর্ণ চার্টার</span>
                    <span>➔</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#0B0E14] border border-blue-500/30 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                    <span className="font-bold text-white">DRAGON (ড্রাগন)</span>
                  </div>
                  <span className="font-black text-blue-400 font-mono tabular-nums">১.৯ গুণ রিটার্ন</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0B0E14] border border-red-500/30 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                    <span className="font-bold text-white">TIGER (টাইগার)</span>
                  </div>
                  <span className="font-black text-red-400 font-mono tabular-nums">১.৯ গুণ রিটার্ন</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0B0E14] border border-emerald-500/30 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50" />
                    <span className="font-bold text-white truncate">TIE (উভয় কার্ড সমান)</span>
                  </div>
                  <span className="font-black text-emerald-400 font-mono text-right text-[11px] shrink-0 pl-2">৫০% বাজি অটো ফেরত (বাজি নিষিদ্ধ)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0E14] border border-amber-500/20 text-[11px] space-y-1.5 shadow-sm">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>কোন কার্ডটি জিতবে?</span>
                </div>
                <p className="text-neutral-300 leading-snug">
                  কিং (King) হলো সর্বোচ্চ পয়েন্টের কার্ড (১৩) এবং টেক্কা (Ace) হলো সর্বনিম্ন (১)। বড় কার্ড যে সাইডে আসবে সে সাইড বিজয়ী হবে।
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0E14] border border-emerald-500/20 text-[11px] space-y-1.5 shadow-sm">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>১০০% আনম্যাচ টাকা রিফান্ড গ্যারান্টি</span>
                </div>
                <p className="text-neutral-300 leading-snug">
                  আমাদের সাইটে কোনো হাউজ এজ বা লুকানো চার্জ নেই। অপরপক্ষের খেলোয়াড়ের সাথে বাজি ম্যাচ না হলে আপনার পুরো টাকা সাথে সাথে ব্যালেন্সে ফেরত চলে আসে।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {onOpenRules && (
                  <button
                    onClick={onOpenRules}
                    className="py-2 px-3 rounded-xl bg-[#0B0E14] hover:bg-[#202736] border border-white/10 text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>খেলার নিয়মাবলী</span>
                  </button>
                )}
                {onOpenBetHistory && (
                  <button
                    onClick={onOpenBetHistory}
                    className="py-2 px-3 rounded-xl bg-[#0B0E14] hover:bg-[#202736] border border-white/10 text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>আমার বাজি হিস্ট্রি</span>
                  </button>
                )}
              </div>
            </div>
          )}
          {sidebarTab === "liveAction" && (
            <LiveAction
              currentRoundBets={currentRoundBets}
              currentUser={user}
              roundNumber={currentRound?.roundNumber}
              onFollowBet={handleFollowBet}
            />
          )}

          {sidebarTab === "returns" && (
            <UserTkReturnMonitor
              user={user}
              currentRoundBets={currentRoundBets}
              activeConfirmedBet={
                activeConfirmedBet
                  ? {
                      ...activeConfirmedBet,
                      balanceType: user.balanceType,
                    }
                  : null
              }
              roundNumber={currentRound?.roundNumber}
              tableName={currentRound?.tableName}
              onOpenBetHistory={onOpenBetHistory}
              onRefreshWallet={async () => {
                try {
                  const res = await fetch(`/api/wallet/${user.userId}`);
                  if (res.ok) {
                    const data = await res.json();
                    onUpdateWallet(data);
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
            />
          )}

          {sidebarTab === "chat" && (
            <LiveChat username={user.username} vipTier={user.vipTier} />
          )}

          {sidebarTab === "roadmap" && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Shoe Trend Ticker
                  </span>
                </div>
                <button
                  onClick={onOpenRoadmap}
                  className="text-[10px] text-amber-400 hover:underline font-semibold"
                >
                  Full Roadmap
                </button>
              </div>

              {/* Bead Mini Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {roadmap.slice(0, 25).map((r, i) => (
                  <div
                    key={i}
                    className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                      r.result === "DRAGON"
                        ? "bg-blue-600/30 text-blue-400 border-blue-500/40"
                        : r.result === "TIGER"
                        ? "bg-red-600/30 text-red-400 border-red-500/40"
                        : "bg-emerald-600/30 text-emerald-400 border-emerald-500/40"
                    }`}
                  >
                    {r.result.charAt(0)}
                  </div>
                ))}
              </div>

              {/* Table limits */}
              <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
                <div className="text-[10px] text-neutral-500 uppercase font-semibold">Table Parameters</div>
                <div className="flex justify-between text-neutral-400">
                  <span>Minimum Stake:</span>
                  <span className="text-white font-bold">
                    {selectedTableSlug === "vip" ? "₹1,000" : selectedTableSlug === "classic" ? "₹100" : "₹10"}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Maximum Stake:</span>
                  <span className="text-white font-bold">
                    {selectedTableSlug === "vip" ? "₹1,00,000" : selectedTableSlug === "classic" ? "₹10,000" : "₹1,000"}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Round Speed:</span>
                  <span className="text-amber-400 font-bold">
                    {selectedTableSlug === "express" ? "15s Speed" : "30s Standard"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Bet Transparency & Real-Time History Feed */}
      <LiveBetFeed
        currentRoundBets={currentRoundBets}
        recentSettledBets={recentSettledBets}
        currentUser={user}
        roundNumber={currentRound?.roundNumber}
      />
    </div>
  );
};
