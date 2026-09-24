import React, { useState } from "react";
import {
  X,
  Radio,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Headphones,
  Users,
  ShieldCheck,
  Scale,
  TrendingUp,
  History,
  Coins,
  BookOpen,
  Gift,
  Code2,
  ShieldAlert,
  LogOut,
  Gamepad2,
  Swords,
  Trophy,
  Globe,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { UserWallet } from "../types";
import { useSoundManager } from "../utils/useSoundManager";

interface SideNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWallet;
  activeTab: "game" | "p2p" | "leaderboard";
  setActiveTab: (tab: "game" | "p2p" | "leaderboard") => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenWallet: () => void;
  onOpenProfile: () => void;
  onOpenProvablyFair: () => void;
  onOpenRoadmap: () => void;
  onOpenAdmin: () => void;
  onOpenMerchant: () => void;
  onOpenSiteLiquidity: () => void;
  onOpenBetHistory: () => void;
  onOpenRules: () => void;
  onOpenTransparency: () => void;
  onOpenPublicUsers: () => void;
  onOpenReferral: () => void;
  onToggleRegulatoryFooter: () => void;
  showRegulatoryFooter: boolean;
  onLogout: () => void;
  onToggleBalanceType: () => void;
  lang?: "bn" | "en";
  onToggleLang?: () => void;
  dealerCommentary?: string;
}

export const SideNavDrawer: React.FC<SideNavDrawerProps> = ({
  isOpen,
  onClose,
  user,
  activeTab,
  setActiveTab,
  soundEnabled,
  onToggleSound,
  voiceEnabled,
  onToggleVoice,
  onOpenWallet,
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
  onToggleRegulatoryFooter,
  showRegulatoryFooter,
  onLogout,
  onToggleBalanceType,
  lang = "bn",
  onToggleLang,
  dealerCommentary = "Welcome to the VIP Dragon Tiger Arena. Place your stakes before the timer expires!",
}) => {
  const soundManager = useSoundManager();
  const [showAudioTestMenu, setShowAudioTestMenu] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0C1019] border-l border-white/10 shadow-2xl flex flex-col h-full text-neutral-200">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-[#101622] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-md">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-wide">
                  {lang === "bn" ? "ক্যাসিনো মেনু ও সেটিংস" : "Menu & Settings Suite"}
                </h2>
                <p className="text-[10px] text-neutral-400 font-mono">
                  {user.username} ({user.vipTier})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* LIVE DEALER DIV (MOVED FROM HOME PAGE) */}
            <div className="bg-[#121826] border border-amber-500/20 rounded-2xl p-3.5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-red-500/40 flex items-center justify-center text-red-500 flex-shrink-0 relative">
                  <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-red-400 font-black">● LIVE DEALER</span>
                    <span>·</span>
                    <span className="text-amber-300 truncate">ELENA S. (STUDIO 4)</span>
                  </div>
                  <p className="text-xs text-neutral-200 font-medium italic mt-0.5 leading-tight truncate">
                    "{dealerCommentary}"
                  </p>
                </div>
              </div>

              {/* Sound & Voice Controls */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                <button
                  onClick={() => {
                    soundManager.toggleSfx();
                    onToggleSound();
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    soundEnabled
                      ? "bg-neutral-800 border-neutral-700 text-emerald-400"
                      : "bg-neutral-950/40 border-neutral-800 text-neutral-500"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{soundEnabled ? "SFX On" : "SFX Muted"}</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.toggleVoice();
                    onToggleVoice();
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    voiceEnabled
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : "bg-neutral-950/40 border-neutral-800 text-neutral-500"
                  }`}
                >
                  {voiceEnabled ? <Mic className="w-4 h-4 text-amber-400" /> : <MicOff className="w-4 h-4" />}
                  <span>{voiceEnabled ? "Voice On" : "Voice Muted"}</span>
                </button>
              </div>

              {/* Crowd Noise Volume Slider */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{lang === "bn" ? "ক্রাউড নয়েজ ভলিউম" : "Crowd Noise Volume"}</span>
                  </span>
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

              {/* Sound Test Effects Dropdown */}
              <div className="pt-1">
                <button
                  onClick={() => setShowAudioTestMenu(!showAudioTestMenu)}
                  className="text-[11px] font-bold text-neutral-400 hover:text-amber-300 flex items-center justify-between w-full py-1"
                >
                  <span>{lang === "bn" ? "ক্যাসিনো সাউন্ড টেস্ট করুন" : "Test Casino Audio FX"}</span>
                  <span>{showAudioTestMenu ? "▲" : "▼"}</span>
                </button>
                {showAudioTestMenu && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                    <button
                      onClick={() => soundManager.triggerCoinsClinking()}
                      className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[11px] text-neutral-300 font-medium text-left border border-neutral-800"
                    >
                      🪙 Clink Coins
                    </button>
                    <button
                      onClick={() => soundManager.triggerCardFlip()}
                      className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[11px] text-neutral-300 font-medium text-left border border-neutral-800"
                    >
                      🃏 Flip Card
                    </button>
                    <button
                      onClick={() => soundManager.announceBetAmount(500, "Dragon")}
                      className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[11px] text-neutral-300 font-medium text-left border border-neutral-800"
                    >
                      🎙️ Bet Voice
                    </button>
                    <button
                      onClick={() => soundManager.triggerWinningState(950)}
                      className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[11px] text-neutral-300 font-medium text-left border border-neutral-800"
                    >
                      🏆 Win Fanfare
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PRIMARY ARENA NAVIGATION */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                {lang === "bn" ? "গেমিং সেকশন" : "Gaming Arenas"}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => {
                    setActiveTab("game");
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === "game"
                      ? "bg-amber-500 text-neutral-950 font-black shadow-md"
                      : "bg-[#141A26] hover:bg-[#1A2232] text-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Gamepad2 className="w-4 h-4" />
                    <span>{lang === "bn" ? "ড্রাগন টাইগার লাইভ টেবিল (হোম)" : "Dragon Tiger Live Table"}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab("p2p");
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === "p2p"
                      ? "bg-amber-500 text-neutral-950 font-black shadow-md"
                      : "bg-[#141A26] hover:bg-[#1A2232] text-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Swords className="w-4 h-4" />
                    <span>{lang === "bn" ? "১ বনাম ১ পি২পি ডুয়েল (1v1 Duels)" : "1v1 P2P Duels Arena"}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab("leaderboard");
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === "leaderboard"
                      ? "bg-amber-500 text-neutral-950 font-black shadow-md"
                      : "bg-[#141A26] hover:bg-[#1A2232] text-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4" />
                    <span>{lang === "bn" ? "টপ উইনার লিডারবোর্ড" : "Leaderboard & High Rollers"}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>
              </div>
            </div>

            {/* PUBLIC TRANSPARENCY & DATA (MOVED FROM HOME PAGE) */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                {lang === "bn" ? "স্বচ্ছতা ও পাবলিক ডাটা" : "Transparency & Public Data"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Public Users Directory (পাবলিক লিস্ট) */}
                <button
                  onClick={() => {
                    onOpenPublicUsers();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex flex-col items-start gap-1 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {lang === "bn" ? "পাবলিক লিস্ট" : "Public Users"}
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    {lang === "bn" ? "সকল প্লেয়ারের প্রোফাইল ও ব্যালেন্স" : "Public directory"}
                  </span>
                </button>

                {/* Transparency Charter (স্বচ্ছতা চার্টার) */}
                <button
                  onClick={() => {
                    onOpenTransparency();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex flex-col items-start gap-1 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {lang === "bn" ? "স্বচ্ছতা চার্টার" : "Transparency"}
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    {lang === "bn" ? "১০০% অ্যান্টি-চিট প্রমাণ" : "Audit proof"}
                  </span>
                </button>

                {/* Provably Fair */}
                <button
                  onClick={() => {
                    onOpenProvablyFair();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex flex-col items-start gap-1 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {lang === "bn" ? "প্রুভলি ফেয়ার" : "Provably Fair"}
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    {lang === "bn" ? "SHA-256 বীজ যাচাই" : "Cryptographic proof"}
                  </span>
                </button>

                {/* Site Liquidity */}
                <button
                  onClick={() => {
                    onOpenSiteLiquidity();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex flex-col items-start gap-1 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {lang === "bn" ? "সাইট লিকুইডিটি" : "Site Liquidity"}
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    {lang === "bn" ? "রিজার্ভ ও ক্যাশ ফ্লো" : "Proof of reserves"}
                  </span>
                </button>
              </div>
            </div>

            {/* GAMEPLAY TOOLS & CHARTERS */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                {lang === "bn" ? "গেম টুলস ও রেকর্ডস" : "Tools & Records"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenRules();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex items-center gap-2.5 text-left transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    {lang === "bn" ? "খেলার নিয়মাবলী" : "Rules & Rates"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onOpenBetHistory();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex items-center gap-2.5 text-left transition-colors"
                >
                  <History className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    {lang === "bn" ? "বাজি হিস্ট্রি" : "Bet History"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onOpenRoadmap();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex items-center gap-2.5 text-left transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    {lang === "bn" ? "ট্রেন্ড রোডম্যাপ" : "Roadmap"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onOpenReferral();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex items-center gap-2.5 text-left transition-colors"
                >
                  <Gift className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    {lang === "bn" ? "রেফার ও আর্ন" : "Refer & Earn"}
                  </span>
                </button>
              </div>
            </div>

            {/* REGULATORY CHARTER TOGGLE */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                {lang === "bn" ? "লাইসেন্স ও রেগুলেটরি ফুটার" : "Compliance & Regulatory"}
              </div>
              <button
                onClick={() => {
                  onToggleRegulatoryFooter();
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
                  showRegulatoryFooter
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-[#141A26] border-white/5 text-neutral-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>
                    {showRegulatoryFooter
                      ? (lang === "bn" ? "✓ রেগুলেটরি ফুটার দৃশ্যমান" : "✓ Regulatory Footer Visible")
                      : (lang === "bn" ? "রেগুলেটরি ফুটার প্রদর্শন করুন" : "Show Regulatory Footer")}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-neutral-900 px-2 py-0.5 rounded">
                  {showRegulatoryFooter ? "ACTIVE" : "TOGGLE"}
                </span>
              </button>
            </div>

            {/* ADMIN & MERCHANT SUITE */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                {lang === "bn" ? "অ্যাডমিন ও মার্চেন্ট" : "Administration & B2B"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAdmin();
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex items-center gap-2 text-left transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-xs font-bold text-neutral-300">Admin Panel</span>
                </button>

                <button
                  onClick={() => {
                    onOpenMerchant();
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/5 flex items-center gap-2 text-left transition-colors"
                >
                  <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold text-neutral-300">Merchant API</span>
                </button>
              </div>
            </div>

            {/* PREFERENCES & LOGOUT */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleBalanceType}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <span>{user.balanceType === "real" ? "🟢 Real Mode" : "🟣 Demo Mode"}</span>
                </button>

                {onToggleLang && (
                  <button
                    onClick={onToggleLang}
                    className="py-2 px-3 rounded-xl bg-[#141A26] hover:bg-[#1A2232] border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === "bn" ? "EN" : "BN"}</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === "bn" ? "লগআউট করুন" : "Logout"}</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
