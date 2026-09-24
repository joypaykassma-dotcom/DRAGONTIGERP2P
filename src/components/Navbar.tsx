import React, { useState } from "react";
import {
  Shield,
  Wallet,
  Gamepad2,
  Flame,
  Menu,
  ChevronDown,
  Globe,
} from "lucide-react";
import { UserWallet } from "../types";

interface NavbarProps {
  user: UserWallet;
  activeTab: "game" | "p2p" | "leaderboard";
  setActiveTab: (tab: "game" | "p2p" | "leaderboard") => void;
  selectedTable: "express" | "classic" | "vip";
  onSelectTable: (table: "express" | "classic" | "vip") => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  onOpenWallet: () => void;
  onOpenMenu: () => void;
  onOpenOnlineUsers: () => void;
  onOpenQuickDeposit?: () => void;
  onOpenProfile?: () => void;
  onOpenProvablyFair?: () => void;
  onOpenRoadmap?: () => void;
  onOpenAdmin?: () => void;
  onOpenMerchant?: () => void;
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
  onOpenWallet,
  onOpenMenu,
  onOpenOnlineUsers,
  onToggleBalanceType,
  lang = "bn",
  onToggleLang,
  telemetryPlayerCount = 284592,
}) => {
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
          {/* Clickable Active Online Player Counter */}
          <button
            onClick={onOpenOnlineUsers}
            title={lang === "bn" ? "অনলাইন সক্রিয় প্লেয়ারদের তালিকা দেখতে ক্লিক করুন" : "Click to view all active online players"}
            className="flex items-center gap-1.5 hover:bg-neutral-900/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer group border border-transparent hover:border-emerald-500/30"
          >
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse group-hover:scale-125 transition-transform" />
              <span className="tracking-wide text-[10px] uppercase">{lang === "bn" ? "লাইভ" : "LIVE"}</span>
            </div>
            <span className="text-neutral-700">·</span>
            <span className="text-neutral-300 font-mono text-[11px] tabular-nums group-hover:text-emerald-300 transition-colors">
              <strong className="text-white font-bold underline decoration-dotted decoration-emerald-500/60">{telemetryPlayerCount.toLocaleString()}</strong>{" "}
              <span className="text-neutral-400 font-sans">{lang === "bn" ? "অনলাইন (তালিকা ↗)" : "Online (Active ↗)"}</span>
            </span>
          </button>

          <span className="text-neutral-700 hidden md:inline">·</span>
          <span className="hidden md:inline font-mono text-neutral-400 text-[10px] tabular-nums">
            1,840 TPS · 14ms
          </span>
        </div>

        {/* Right Side: Clean Menu & Language Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
          <button
            onClick={onOpenMenu}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-[11px] font-bold text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400 transition-colors"
          >
            <Menu className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === "bn" ? "মেনু ও সেটিংস" : "Menu & Settings"}</span>
          </button>

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

          {/* Center: Clean Arena indicator or Back-to-Game if in secondary tab */}
          <div className="flex items-center gap-2">
            {activeTab !== "game" ? (
              <button
                onClick={() => setActiveTab("game")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-colors"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>{lang === "bn" ? "← গেমে ফিরুন" : "← Back to Table"}</span>
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#161B26] border border-white/5 text-xs text-neutral-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>P2P Dragon Tiger Live Arena</span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mode Switch (Real vs Demo) */}
            <button
              onClick={onToggleBalanceType}
              className="flex px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase border border-amber-500/30 bg-[#161B26] hover:bg-[#202736] text-amber-300 shrink-0 transition-colors whitespace-nowrap"
              title="Click to toggle Real vs Demo mode"
            >
              {user.balanceType === "real" ? "🟢 Real" : "🟣 Demo"}
            </button>

            {/* Cash Wallet Button */}
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-1 sm:gap-2 bg-[#161B26] hover:bg-[#202736] border border-amber-500/40 hover:border-amber-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-md group shrink-0"
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

            {/* Dedicated Unified Menu & Settings Drawer Trigger Button */}
            <button
              onClick={onOpenMenu}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-[#1a2233] to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl transition-all shadow-md group shrink-0 cursor-pointer"
              aria-label="Open Casino Menu and Settings Drawer"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-wide hidden sm:inline">{lang === "bn" ? "মেনু" : "Menu"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Bar: Clean & Uncluttered */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-amber-500/20 px-3 py-1.5 shadow-2xl safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto text-center">
          <button
            onClick={() => setActiveTab("game")}
            className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all text-xs ${
              activeTab === "game"
                ? "text-amber-400 font-bold bg-amber-500/10"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Live Table</span>
          </button>

          <button
            onClick={onOpenWallet}
            className="py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-all font-bold"
          >
            <Wallet className="w-4 h-4" />
            <span>৳{currentBalance.toLocaleString()}</span>
          </button>

          <button
            onClick={onOpenMenu}
            className="py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-xs text-neutral-300 hover:text-amber-300 transition-all font-bold"
          >
            <Menu className="w-4 h-4 text-amber-400" />
            <span>{lang === "bn" ? "মেনু" : "Menu"}</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
