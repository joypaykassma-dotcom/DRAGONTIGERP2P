import React, { useState, useEffect } from "react";
import { UserWallet, TableRound, RoadmapItem, HighLoadTelemetry } from "./types";
import { LoginScreen } from "./components/LoginScreen";
import { Navbar } from "./components/Navbar";
import { GameTable } from "./components/GameTable";
import { P2PLobby } from "./components/P2PLobby";
import { Leaderboard } from "./components/Leaderboard";
import { WalletModal } from "./components/WalletModal";
import { QuickDepositModal } from "./components/QuickDepositModal";
import { ProvablyFairModal } from "./components/ProvablyFairModal";
import { RoadmapModal } from "./components/RoadmapModal";
import { AdminModal } from "./components/AdminModal";
import { MerchantModal } from "./components/MerchantModal";
import { UserProfileModal } from "./components/UserProfileModal";
import { SiteLiquidityModal } from "./components/SiteLiquidityModal";
import { RegulatoryFooter } from "./components/RegulatoryFooter";
import { UserBetHistoryModal } from "./components/UserBetHistoryModal";
import { GameRulesModal } from "./components/GameRulesModal";
import { TransparencyCharterModal } from "./components/TransparencyCharterModal";
import { ReferralModal } from "./components/ReferralModal";
import { sound } from "./utils/audio";

export default function App() {
  const [user, setUser] = useState<UserWallet | null>(null);
  const [activeTab, setActiveTab] = useState<"game" | "p2p" | "leaderboard">("game");
  const [selectedTable, setSelectedTable] = useState<"express" | "classic" | "vip">("classic");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [telemetry, setTelemetry] = useState<HighLoadTelemetry | null>(null);

  // Modals state
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isQuickDepositOpen, setIsQuickDepositOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isProvablyFairOpen, setIsProvablyFairOpen] = useState<boolean>(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isMerchantOpen, setIsMerchantOpen] = useState<boolean>(false);
  const [isLiquidityOpen, setIsLiquidityOpen] = useState<boolean>(false);
  const [isBetHistoryOpen, setIsBetHistoryOpen] = useState<boolean>(false);
  const [isGameRulesOpen, setIsGameRulesOpen] = useState<boolean>(false);
  const [isTransparencyOpen, setIsTransparencyOpen] = useState<boolean>(false);
  const [transparencyTab, setTransparencyTab] = useState<"charter" | "comparison" | "proofOfReserves" | "liveLedger" | "publicUsers">("charter");
  const [isReferralOpen, setIsReferralOpen] = useState<boolean>(false);

  // Active round reference for Provably Fair modal
  const [activeRound, setActiveRound] = useState<TableRound | null>(null);
  const [tableRoadmap, setTableRoadmap] = useState<RoadmapItem[]>([]);

  // Telemetry periodic fetch for high-load state
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/system/telemetry");
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data);
        }
      } catch {
        // Fallback default high-load values
      }
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  // Check localStorage for saved user session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem("dt_user_id");
    const savedUsername = localStorage.getItem("dt_username");
    if (savedUserId && savedUsername) {
      fetchUser(savedUserId, savedUsername);
    }
  }, []);

  // Real-time balance and user state polling loop (every 2.5s)
  useEffect(() => {
    if (!user?.userId) return;
    const interval = setInterval(() => {
      fetchUser(user.userId, user.username);
    }, 2500);
    return () => clearInterval(interval);
  }, [user?.userId, user?.username]);

  const fetchUser = async (userId: string, username: string) => {
    if (!userId || userId === "undefined" || userId.trim() === "") {
      handleLogout();
      return;
    }
    try {
      const res = await fetch(`/api/wallet/${userId}?username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        throw new Error(`HTTP status error: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON format");
      }
      const data = await res.json();
      if (data && data.userId) {
        setUser(data);
        localStorage.setItem("dt_user_id", userId);
        localStorage.setItem("dt_username", username);
      } else {
        throw new Error("Invalid user profile payload");
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
      // If profile fails persistently or returns HTML, clear session to prevent sticking
      handleLogout();
    }
  };

  const handleLoginSuccess = (loggedInUser: UserWallet) => {
    setUser(loggedInUser);
    localStorage.setItem("dt_user_id", loggedInUser.userId);
    localStorage.setItem("dt_username", loggedInUser.username);
  };

  const handleLogout = () => {
    localStorage.removeItem("dt_user_id");
    localStorage.removeItem("dt_username");
    setUser(null);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.sfxEnabled = next;
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    sound.voiceEnabled = next;
  };

  const handleToggleBalanceType = () => {
    if (!user) return;
    const newType = user.balanceType === "real" ? "demo" : "real";
    setUser({ ...user, balanceType: newType });
  };

  const handleOpenRoadmap = async () => {
    try {
      const res = await fetch(`/api/tables/${selectedTable}/roadmap`);
      const data = await res.json();
      setTableRoadmap(data);
    } catch (e) {
      console.error(e);
    }
    setIsRoadmapOpen(true);
  };

  const handleOpenProvablyFair = async () => {
    try {
      const res = await fetch("/api/tables");
      const tables = await res.json();
      const match = tables.find((t: { config: { slug: string } }) => t.config.slug === selectedTable);
      if (match) setActiveRound(match.currentRound);
    } catch (e) {
      console.error(e);
    }
    setIsProvablyFairOpen(true);
  };

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950 overflow-x-hidden w-full max-w-full">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenQuickDeposit={() => setIsQuickDepositOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenProvablyFair={handleOpenProvablyFair}
        onOpenRoadmap={handleOpenRoadmap}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenMerchant={() => setIsMerchantOpen(true)}
        onOpenSiteLiquidity={() => setIsLiquidityOpen(true)}
        onOpenBetHistory={() => setIsBetHistoryOpen(true)}
        onOpenRules={() => setIsGameRulesOpen(true)}
        onOpenTransparency={() => {
          setTransparencyTab("charter");
          setIsTransparencyOpen(true);
        }}
        onOpenPublicUsers={() => {
          setTransparencyTab("publicUsers");
          setIsTransparencyOpen(true);
        }}
        onOpenReferral={() => setIsReferralOpen(true)}
        onLogout={handleLogout}
        onToggleBalanceType={handleToggleBalanceType}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === "bn" ? "en" : "bn"))}
        telemetryPlayerCount={telemetry?.totalActivePlayers || 284592}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 pb-24 md:pb-6">
        {activeTab === "game" && (
          <GameTable
            user={user}
            selectedTableSlug={selectedTable}
            onUpdateWallet={setUser}
            onOpenProvablyFair={handleOpenProvablyFair}
            onOpenRoadmap={handleOpenRoadmap}
            onOpenBetHistory={() => setIsBetHistoryOpen(true)}
            onOpenRules={() => setIsGameRulesOpen(true)}
          />
        )}
        {activeTab === "p2p" && <P2PLobby user={user} onUpdateWallet={setUser} />}
        {activeTab === "leaderboard" && (
          <Leaderboard
            onOpenLiquidity={() => setIsLiquidityOpen(true)}
            currentUser={user}
          />
        )}
      </main>

      {/* Official Regulatory & High-Load Distributed Architecture Footer */}
      <RegulatoryFooter
        lang={lang}
        telemetry={telemetry}
        onOpenProvablyFair={handleOpenProvablyFair}
        onOpenLiquidity={() => setIsLiquidityOpen(true)}
        onOpenTransparency={() => setIsTransparencyOpen(true)}
        onOpenRules={() => setIsGameRulesOpen(true)}
        onOpenReferral={() => setIsReferralOpen(true)}
      />

      {/* MODALS */}
      {isReferralOpen && (
        <ReferralModal
          isOpen={isReferralOpen}
          onClose={() => setIsReferralOpen(false)}
          currentUser={user}
          onUpdateUser={setUser}
        />
      )}

      {isBetHistoryOpen && (
        <UserBetHistoryModal
          user={user}
          isOpen={isBetHistoryOpen}
          onClose={() => setIsBetHistoryOpen(false)}
          lang={lang}
        />
      )}

      {isGameRulesOpen && (
        <GameRulesModal
          isOpen={isGameRulesOpen}
          onClose={() => setIsGameRulesOpen(false)}
          lang={lang}
        />
      )}

      {isTransparencyOpen && (
        <TransparencyCharterModal
          isOpen={isTransparencyOpen}
          onClose={() => setIsTransparencyOpen(false)}
          lang={lang}
          onOpenProvablyFair={handleOpenProvablyFair}
          onOpenLiquidity={() => setIsLiquidityOpen(true)}
          initialTab={transparencyTab}
        />
      )}

      {isLiquidityOpen && (
        <SiteLiquidityModal
          isOpen={isLiquidityOpen}
          onClose={() => setIsLiquidityOpen(false)}
          currentUserId={user.userId}
        />
      )}

      {isProfileOpen && (
        <UserProfileModal
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onOpenWallet={() => {
            setIsProfileOpen(false);
            setIsWalletOpen(true);
          }}
          onUpdateWallet={setUser}
          onOpenReferral={() => setIsReferralOpen(true)}
        />
      )}

      {isWalletOpen && (
        <WalletModal
          user={user}
          onClose={() => setIsWalletOpen(false)}
          onUpdateWallet={setUser}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenQuickDeposit={() => {
            setIsWalletOpen(false);
            setIsQuickDepositOpen(true);
          }}
        />
      )}

      {isQuickDepositOpen && (
        <QuickDepositModal
          user={user}
          onClose={() => setIsQuickDepositOpen(false)}
          onUpdateWallet={setUser}
        />
      )}

      {isProvablyFairOpen && (
        <ProvablyFairModal
          currentRound={activeRound}
          onClose={() => setIsProvablyFairOpen(false)}
        />
      )}

      {isRoadmapOpen && (
        <RoadmapModal
          tableName={selectedTable.toUpperCase()}
          roadmap={tableRoadmap}
          onClose={() => setIsRoadmapOpen(false)}
        />
      )}

      {isAdminOpen && <AdminModal onClose={() => setIsAdminOpen(false)} />}

      {isMerchantOpen && <MerchantModal onClose={() => setIsMerchantOpen(false)} />}
    </div>
  );
}
