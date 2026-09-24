import React, { useState } from "react";
import {
  Shield,
  Wallet,
  Trophy,
  Swords,
  Gamepad2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ShieldCheck,
  TrendingUp,
  Code2,
  ShieldAlert,
  LogOut,
  Sparkles,
  User,
  Menu,
  X,
  ChevronDown,
  Settings2,
  Zap,
  Coins,
  Globe,
  BookOpen,
  History,
  Scale,
  Flame,
  Users,
} from "lucide-react";
import { UserWallet } from "../types";

interface NavbarProps {
  user: UserWallet;
  activeTab: "game" | "p2p" | "leaderboard";
  setActiveTab: (tab: "game" | "p2p" | "leaderboard") => void;
  selectedTable: "express" | "classic" | "vip";
  onSelectTable: (table: "express" | "classic" | "vip") => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenWallet: () => void;
  onOpenQuickDeposit?: () => void;
  onOpenProfile: () => void;
  onOpenProvablyFair: () => void;
  onOpenRoadmap: () => void;
  onOpenAdmin: () => void;
  onOpenMerchant: () => void;
  onOpenSiteLiquidity?: () => void;
  onOpenBetHistory?: () => void;
  onOpenRules?: () => void;
  onOpenTransparency?: () => void;
  onOpenPublicUsers?: () => void;
  onOpenReferral?: () => void;
  onLogout: () => void;
  onToggleBalanceType: () => void;
  lang?: "bn" | "en";
  onToggleLang?: () => void;
  telemetryPlayerCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  selectedTable,
  onSelectTable,
  soundEnabled,
  onToggleSound,
  voiceEnabled,
  onToggleVoice,
  onOpenWallet,
  onOpenQuickDeposit,
  onOpenProfile,
  onOpenProvablyFair,
  onOpenRoadmap,
  onOpenAdmin,
  onOpenMerchant,
  onOpenSiteLiquidity,
  onOpenBetHistory,
  onOpenRules,
  onOpenTransparency,
  onOpenPublicUsers,
  onOpenReferral,
  onLogout,
  onToggleBalanceType,
  lang = "bn",
  onToggleLang,
  telemetryPlayerCount = 284592,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [tableDropdownOpen, setTableDropdownOpen] = useState<boolean>(false);

  const tableNames = {
    express: "⚡ Express (89.4K)",
    classic: "🎯 Classic (142.3K)",
    vip: "👑 VIP (38.9K)",
  };

  const currentBalance = user.balanceType === "real" ? user.balance : user.demoBalance;

  return (
    <>
      {/* High-Performance Top Utility Bar */}
      <div className="bg-[#080B11] border-b border-white/5 px-2 sm:px-4 lg:px-6 py-1 flex items-center justify-between text-[11px] text-neutral-400 select-none w-full max-w-full overflow-x-auto no-scrollbar whitespace-nowrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide text-[10px] uppercase">{lang === "bn" ? "লাইভ" : "LIVE"}</span>
          </div>
          <span className="text-neutral-700">·</span>
          <span className="text-neutral-300 font-mono text-[11px] tabular-nums">
            <strong className="text-white font-bold">{telemetryPlayerCount.toLocaleString()}</strong>{" "}
            <span className="text-neutral-400 font-sans">{lang === "bn" ? "অনলাইন" : "Online"}</span>
          </span>
          <span className="text-neutral-700 hidden md:inline">·</span>
          <span className="hidden md:inline font-mono text-neutral-400 text-[10px] tabular-nums">
            1,840 TPS · 14ms
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
          {/* Transparency Charter Trigger */}
          {onOpenTransparency && (
            <button
              onClick={onOpenTransparency}
              className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-neutral-300 hover:text-emerald-400 transition-colors whitespace-nowrap"
              title="100% Transparency & Anti-Cheating Charter"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lang === "bn" ? "স্বচ্ছতা চার্টার" : "Transparency"}</span>
            </button>
          )}

          {/* Public Users Directory Button */}
          {onOpenPublicUsers && (
            <button
              onClick={onOpenPublicUsers}
              className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-neutral-300 hover:text-amber-400 transition-colors whitespace-nowrap"
              title="Public User Accounts & Balances Directory"
            >
              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{lang === "bn" ? "পাবলিক লিস্ট" : "Public Users"}</span>
            </button>
          )}

          {/* Game Rules Trigger */}
          {onOpenRules && (
            <button
              onClick={onOpenRules}
              className="hidden md:flex items-center gap-1 text-[11px] font-semibold text-neutral-300 hover:text-amber-400 transition-colors whitespace-nowrap"
              title="Dragon Tiger Official Rules & Payout Table"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{lang === "bn" ? "নিয়মাবলী" : "Rules"}</span>
            </button>
          )}

          {/* Language Toggle */}
          {onToggleLang && (
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900/90 hover:bg-neutral-800 text-[10px] font-semibold text-neutral-200 border border-neutral-800 hover:border-amber-500/40 transition-colors shrink-0"
            >
              <Globe className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{lang === "bn" ? "BN" : "EN"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Navigation Header */}
      <header className="bg-[#0B0E14]/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2.5 shadow-xl transition-all w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-3 w-full min-w-0">
          
          {/* Brand Logo & Desktop Table Selector */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-md shadow-amber-500/10 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-xs sm:text-base font-black tracking-wider text-white font-sans flex items-center gap-0.5 sm:gap-1">
                  <span>APEX</span>
                  <span className="text-amber-400 font-serif italic hidden sm:inline">CASINO</span>
                </div>
              </div>
            </div>

            {/* Desktop Table Switcher with live player counts */}
            <div className="hidden lg:flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs shrink-0">
              <button
                onClick={() => onSelectTable("express")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  selectedTable === "express"
                    ? "bg-amber-500 text-neutral-950 shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span>⚡ Express</span>
                <span className={`text-[10px] font-mono ${selectedTable === "express" ? "text-neutral-900 font-black" : "text-neutral-500"}`}>89.4K</span>
              </button>
              <button
                onClick={() => onSelectTable("classic")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  selectedTable === "classic"
                    ? "bg-amber-500 text-neutral-950 shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span>🎯 Classic</span>
                <span className={`text-[10px] font-mono ${selectedTable === "classic" ? "text-neutral-900 font-black" : "text-neutral-500"}`}>142.3K</span>
              </button>
              <button
                onClick={() => onSelectTable("vip")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  selectedTable === "vip"
                    ? "bg-amber-500 text-neutral-950 shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span>👑 VIP</span>
                <span className={`text-[10px] font-mono ${selectedTable === "vip" ? "text-neutral-900 font-black" : "text-neutral-500"}`}>38.9K</span>
              </button>
            </div>

            {/* Mobile / Tablet Compact Table Dropdown Trigger */}
            <div className="relative lg:hidden shrink-0">
              <button
                onClick={() => setTableDropdownOpen(!tableDropdownOpen)}
                className="hidden min-[360px]:flex items-center gap-1 px-1.5 py-1 sm:px-2 sm:py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] sm:text-[11px] font-bold text-amber-300 hover:border-amber-500/40 transition-all shrink-0"
              >
                <span className="truncate max-w-[60px] sm:max-w-none">{tableNames[selectedTable]}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
              </button>

              {tableDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-36 bg-neutral-900 border border-amber-500/30 rounded-xl shadow-2xl py-1 z-50">
                  <button
                    onClick={() => {
                      onSelectTable("express");
                      setTableDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between ${
                      selectedTable === "express" ? "bg-amber-500/20 text-amber-400" : "text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    <span>⚡ Express</span>
                    <span className="text-[10px] text-neutral-500">10s</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectTable("classic");
                      setTableDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between ${
                      selectedTable === "classic" ? "bg-amber-500/20 text-amber-400" : "text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    <span>🎯 Classic</span>
                    <span className="text-[10px] text-neutral-500">15s</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectTable("vip");
                      setTableDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between ${
                      selectedTable === "vip" ? "bg-amber-500/20 text-amber-400" : "text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    <span>👑 VIP</span>
                    <span className="text-[10px] text-neutral-500">20s</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-[#161B26] p-1 rounded-xl border border-white/10 text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveTab("game")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap font-bold ${
                activeTab === "game"
                  ? "bg-amber-500 text-neutral-950 shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-[#202736]"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Live Arena</span>
            </button>
            <button
              onClick={() => setActiveTab("p2p")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap font-bold ${
                activeTab === "p2p"
                  ? "bg-amber-500 text-neutral-950 shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-[#202736]"
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>1v1 Duels</span>
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap font-bold ${
                activeTab === "leaderboard"
                  ? "bg-amber-500 text-neutral-950 shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-[#202736]"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>

            {onOpenBetHistory && (
              <button
                onClick={onOpenBetHistory}
                title="View Detailed Bet History & P&L"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-amber-300 hover:text-amber-200 hover:bg-[#202736] border border-amber-500/30 transition-all font-bold shrink-0 whitespace-nowrap"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === "bn" ? "বাজি হিস্ট্রি" : "Bet History"}</span>
              </button>
            )}

            {onOpenSiteLiquidity && (
              <button
                onClick={onOpenSiteLiquidity}
                title="View Full Site Liquidity & All User Balances"
                className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-[#202736] border border-emerald-500/30 transition-all font-bold shrink-0 whitespace-nowrap"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>Site Liquidity</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}
          </div>

          {/* Right Controls (Responsive & Compact) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Desktop Quick Tools */}
            <div className="hidden 2xl:flex items-center gap-1 bg-[#161B26]/80 p-1 rounded-xl border border-white/5 shrink-0">
              <button
                onClick={onOpenProvablyFair}
                title="Provably Fair Verifier"
                className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-[#202736] rounded-lg transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenRoadmap}
                title="Shoe Roadmap & Bead Road"
                className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-[#202736] rounded-lg transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <button
                onClick={onToggleSound}
                title={soundEnabled ? "Casino Sound Effects: ON" : "Casino Sound Effects: OFF"}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#202736] rounded-lg transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
              </button>
              <button
                onClick={onToggleVoice}
                title={voiceEnabled ? "Live Casino Dealer Voice: ON" : "Live Casino Dealer Voice: OFF"}
                className={`p-1.5 rounded-lg transition-colors ${
                  voiceEnabled ? "text-amber-400 bg-amber-500/10" : "text-neutral-500 hover:bg-[#202736]"
                }`}
              >
                {voiceEnabled ? <Mic className="w-4 h-4 text-amber-400" /> : <MicOff className="w-4 h-4 text-neutral-500" />}
              </button>
            </div>

            {/* Mode Switch (Real vs Demo) */}
            <button
              onClick={onToggleBalanceType}
              className="hidden xs:flex px-1.5 sm:px-2 py-1 rounded-lg text-[10px] font-bold uppercase border border-amber-500/30 bg-[#161B26] hover:bg-[#202736] text-amber-300 shrink-0 transition-colors whitespace-nowrap"
              title="Click to toggle Real vs Demo mode"
            >
              {user.balanceType === "real" ? "🟢 Real" : "🟣 Demo"}
            </button>

            {/* Cash Wallet Button */}
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-1 sm:gap-2 bg-[#161B26] hover:bg-[#202736] border border-amber-500/40 hover:border-amber-400 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-md group shrink-0"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="text-left flex flex-col justify-center leading-none">
                <span className="text-[8px] sm:text-[9px] text-neutral-400 font-bold uppercase tracking-wider hidden sm:block">
                  {user.balanceType === "real" ? "BALANCE" : "DEMO"}
                </span>
                <span className="text-[11px] sm:text-sm font-black text-amber-300 font-mono tabular-nums sm:mt-0.5 whitespace-nowrap">
                  {lang === "bn" ? "৳" : "₹"}{currentBalance.toLocaleString()}
                </span>
              </div>
            </button>

            {/* Quick Deposit Button */}
            {onOpenQuickDeposit && (
              <button
                onClick={onOpenQuickDeposit}
                title="Quick 1-Tap Deposit"
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 text-xs shrink-0 whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                <span className="font-bold hidden xs:inline">Deposit</span>
              </button>
            )}

            {/* User Profile Button */}
            <button
              onClick={onOpenProfile}
              title="View Personalized Statistics & Profile"
              className="hidden sm:flex items-center gap-1.5 sm:gap-2 bg-[#161B26] hover:bg-[#202736] border border-white/10 hover:border-amber-500/50 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all group shrink-0"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-red-500 p-0.5 flex items-center justify-center text-white shadow-sm shrink-0">
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <div className="text-left hidden 2xl:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-[80px] lg:max-w-[110px]">
                    {user.username}
                  </span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1 rounded uppercase border border-amber-500/30">
                    {user.vipTier}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono tabular-nums">
                  <span className="text-emerald-400 font-bold">
                    {user.stats?.winRate ?? 64.8}%
                  </span>
                  <span className="text-neutral-600">•</span>
                  <span>{user.gamesPlayed || user.stats?.totalHandsPlayed || 0}h</span>
                </div>
              </div>
            </button>

            {/* In-Game Win Streak Badge */}
            {user.stats && user.stats.currentStreak > 0 && (
              <div
                title={`Active Win Streak: ${user.stats.currentStreak}`}
                className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black shadow-sm transition-all select-none ${
                  user.stats.currentStreak >= 7
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-950/40 animate-pulse"
                    : user.stats.currentStreak >= 5
                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-orange-950/30"
                    : user.stats.currentStreak >= 3
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-[#161B26] text-neutral-300 border-white/10"
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${user.stats.currentStreak >= 3 ? "fill-current" : ""}`} />
                <span>🔥 {user.stats.currentStreak} Streak</span>
              </div>
            )}

            {/* Desktop Logout Button */}
            <button
              onClick={onLogout}
              title="Logout"
              className="hidden lg:flex p-2 text-neutral-400 hover:text-red-400 hover:bg-[#202736] rounded-xl transition-colors border border-transparent hover:border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile / Tablet Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-300 hover:text-white bg-[#161B26] hover:bg-[#1E2535] rounded-xl border border-white/10 hover:border-amber-500/40 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 shrink-0 shadow-sm"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer for Quick Navigation & Account Management */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 pt-3 border-t border-white/10 bg-[#0F131C] rounded-2xl p-3.5 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
            {/* Account Quick Banner */}
            <div className="p-3 bg-[#181D29] border border-white/10 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 p-0.5 flex items-center justify-center text-white shadow-md">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{user.username}</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1 rounded uppercase border border-amber-500/30">
                      {user.vipTier}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5 tabular-nums">
                    <span className="text-emerald-400 font-semibold">{user.stats?.winRate ?? 64.8}% Win Rate</span>
                    <span>•</span>
                    <span>{user.gamesPlayed || user.stats?.totalHandsPlayed || 0} Hands</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onOpenQuickDeposit && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenQuickDeposit();
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-neutral-950 rounded-lg shadow-md hover:bg-amber-400 transition-colors"
                  >
                    ⚡ Deposit
                  </button>
                )}
              </div>
            </div>

            {/* Quick Game Mode Selector */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                {lang === "bn" ? "গেম রুম নির্বাচন" : "Select Game Arena"}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    onSelectTable("express");
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    selectedTable === "express"
                      ? "bg-amber-500 text-neutral-950 border-amber-400 font-black shadow-sm"
                      : "bg-[#181D29] border-white/5 text-neutral-300 hover:text-white"
                  }`}
                >
                  <span>⚡ Express</span>
                  <span className="text-[9px] opacity-80 font-mono">10s (89.4K)</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTable("classic");
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    selectedTable === "classic"
                      ? "bg-amber-500 text-neutral-950 border-amber-400 font-black shadow-sm"
                      : "bg-[#181D29] border-white/5 text-neutral-300 hover:text-white"
                  }`}
                >
                  <span>🎯 Classic</span>
                  <span className="text-[9px] opacity-80 font-mono">15s (142K)</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTable("vip");
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    selectedTable === "vip"
                      ? "bg-amber-500 text-neutral-950 border-amber-400 font-black shadow-sm"
                      : "bg-[#181D29] border-white/5 text-neutral-300 hover:text-white"
                  }`}
                >
                  <span>👑 VIP</span>
                  <span className="text-[9px] opacity-80 font-mono">20s (38.9K)</span>
                </button>
              </div>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              {onOpenReferral && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenReferral();
                  }}
                  className="col-span-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#181D29] to-emerald-500/15 border border-amber-500/30 text-amber-300 hover:border-amber-400 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 font-bold">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>{lang === "bn" ? "রেফার ও আয় (৫০% রিভশেয়ার)" : "Refer & Earn (50% RevShare)"}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                    Cash Claim
                  </span>
                </button>
              )}

              {onOpenBetHistory && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBetHistory();
                  }}
                  className="p-2.5 rounded-xl bg-[#181D29] hover:bg-[#202736] border border-white/5 text-neutral-200 flex items-center gap-2"
                >
                  <History className="w-4 h-4 text-amber-400" />
                  <span>{lang === "bn" ? "বাজি হিস্ট্রি" : "Bet History"}</span>
                </button>
              )}

              {onOpenSiteLiquidity && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSiteLiquidity();
                  }}
                  className="p-2.5 rounded-xl bg-[#181D29] hover:bg-[#202736] border border-white/5 text-neutral-200 flex items-center gap-2"
                >
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>{lang === "bn" ? "সাইট লিকুইডিটি" : "Site Liquidity"}</span>
                </button>
              )}

              {onOpenTransparency && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTransparency();
                  }}
                  className="p-2.5 rounded-xl bg-[#181D29] hover:bg-[#202736] border border-white/5 text-neutral-200 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{lang === "bn" ? "স্বচ্ছতা চার্টার" : "Transparency"}</span>
                </button>
              )}

              {onOpenRules && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenRules();
                  }}
                  className="p-2.5 rounded-xl bg-[#181D29] hover:bg-[#202736] border border-white/5 text-neutral-200 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>{lang === "bn" ? "নিয়মাবলী" : "Rules & Payouts"}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProvablyFair();
                }}
                className="p-2.5 rounded-xl bg-[#181D29] hover:bg-[#202736] border border-white/5 text-neutral-200 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Provably Fair</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRoadmap();
                }}
                className="p-2.5 rounded-xl bg-[#181D29] hover:bg-[#202736] border border-white/5 text-neutral-200 flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Shoe Roadmap</span>
              </button>
            </div>

            {/* Audio & Settings Control */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <button
                onClick={onToggleSound}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  soundEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-[#181D29] border-white/5 text-neutral-400"
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
                <span>Sound: {soundEnabled ? "ON" : "OFF"}</span>
              </button>

              <button
                onClick={onToggleVoice}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  voiceEnabled
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-[#181D29] border-white/5 text-neutral-400"
                }`}
              >
                {voiceEnabled ? <Mic className="w-4 h-4 text-amber-400" /> : <MicOff className="w-4 h-4 text-neutral-500" />}
                <span>Dealer Voice: {voiceEnabled ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* Session Logout */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </header>

      {/* App-Like Mobile Bottom Navigation Bar (< md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-amber-500/20 px-2 py-1.5 shadow-2xl safe-area-pb">
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto text-center">
          <button
            onClick={() => setActiveTab("game")}
            className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === "game"
                ? "text-amber-400 font-bold bg-amber-500/10"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Arena</span>
          </button>

          <button
            onClick={() => setActiveTab("p2p")}
            className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === "p2p"
                ? "text-amber-400 font-bold bg-amber-500/10"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Swords className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Duels</span>
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeTab === "leaderboard"
                ? "text-amber-400 font-bold bg-amber-500/10"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Ranks</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="py-1.5 px-1 rounded-xl flex flex-col items-center justify-center text-neutral-400 hover:text-amber-400 transition-all"
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Stats</span>
          </button>

          <button
            onClick={onOpenWallet}
            className="py-1.5 px-1 rounded-xl flex flex-col items-center justify-center text-amber-400 hover:text-amber-300 transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Wallet</span>
          </button>
        </div>
      </nav>
    </>
  );
};
