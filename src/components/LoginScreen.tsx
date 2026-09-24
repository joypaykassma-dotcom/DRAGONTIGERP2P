import React, { useState, useEffect } from "react";
import { Shield, Sparkles, Coins, ArrowRight, Lock, User, KeyRound, Eye, EyeOff, Gift } from "lucide-react";
import { UserWallet } from "../types";
import { sound } from "../utils/audio";

interface LoginScreenProps {
  onLoginSuccess: (user: UserWallet) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamic Build Time Format: yyyy.MM.dd.HH.mm
  const buildTime = "2026.09.23.14.49";

  useEffect(() => {
    // Check if referral code is in URL search params (e.g. ?ref=APEX_...)
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam) {
      setRefCode(refParam.toUpperCase());
      setMode("signup");
    }
  }, []);

  const handleAIStudioLogin = async () => {
    sound.playButtonClick();
    setError("");
    setLoading(true);

    try {
      const studioUsername = "VIP_HighRoller_Guest";
      // Try logging in, if not found then sign up
      let res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: studioUsername,
          password: "studio_dev_password_2026",
        }),
      });
      let data = await res.json();

      if (!data.success) {
        res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: studioUsername,
            password: "studio_dev_password_2026",
            refCode: refCode.trim() || undefined,
          }),
        });
        data = await res.json();
      }

      if (data.success && data.user) {
        sound.playWinFanfare();
        sound.speak(`Welcome to Apex Dragon Tiger Arena, ${data.user.username}!`);
        onLoginSuccess(data.user);
      } else {
        setError("Failed to initialize session. Please sign up above.");
      }
    } catch {
      setError("High-load gateway connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playButtonClick();
    setError("");

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!password) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          refCode: mode === "signup" && refCode.trim() ? refCode.trim().toUpperCase() : undefined,
        }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        sound.playWinFanfare();
        sound.speak(`Welcome to Dragon Tiger Arena, ${data.user.username}!`);
        onLoginSuccess(data.user);
      } else {
        sound.playLossSound();
        setError(data.error || "Authentication failed. Please try again.");
      }
    } catch {
      setError("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(180,83,9,0.18),rgba(0,0,0,0))] flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden text-neutral-100">
      {/* Top Right Build Versioning */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-2 bg-neutral-900/80 border border-amber-500/30 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-xs font-mono text-amber-400 font-medium">Build: {buildTime}</span>
      </div>

      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full mx-auto my-auto relative z-10 pt-8 pb-4">
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-red-600 to-amber-700 p-1 shadow-2xl shadow-amber-600/30 mb-3 items-center justify-center">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-red-500 bg-clip-text text-transparent">
            DRAGON TIGER P2P ARENA
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1.5">
            Apex live casino platform with provably fair RNG & instant escrow
          </p>
        </div>

        <div className="bg-neutral-900/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-black">
          {/* 1-Click Fast Start for New Users */}
          <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/10 border border-amber-500/40 text-center">
            <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>সহজ ও দ্রুত শুরু (Easy & Instant Play)</span>
            </div>
            <button
              type="button"
              onClick={handleAIStudioLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>⚡ ১-ক্লিকে সরাসরি খেলুন (Instant Play)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-[10px] text-neutral-400 mt-1.5">
              কোনো রেজিস্ট্রেশন লাগবে না · ফ্রি ₹১০,০০০ বোনাস ব্যালেন্স সাথে সাথে
            </div>
          </div>

          <div className="relative flex py-2 items-center mb-3">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-neutral-500">
              অথবা একাউন্ট দিয়ে লগইন করুন
            </span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          {/* Auth Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                setMode("signup");
                setError("");
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Create Account (Sign Up)
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                setMode("signin");
                setError("");
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Sign In (Existing)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
                Username / Player ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. DragonMaster_88"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-neutral-600 text-sm focus:outline-none transition-colors"
                  maxLength={24}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-neutral-600 text-sm focus:outline-none transition-colors"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Referral Code (Optional for Sign Up) */}
            {mode === "signup" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Referral Code (Optional)
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    RevShare Active
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Gift className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    placeholder="e.g. APEX_DRAG_777"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-neutral-600 text-sm focus:outline-none transition-colors font-mono uppercase"
                    maxLength={32}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Fair Play Notice */}
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>
                  {mode === "signup"
                    ? "100% P2P Live Exchange • 0% House Edge"
                    : "Live Casino Dealer Voice & Audio Active"}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {mode === "signup"
                  ? "Fair peer-to-peer 1v1 matching with live players. Instant deposit & withdrawal via bKash, Nagad, Rocket, UPI & Crypto."
                  : "Enjoy authentic live casino audio, realistic dealer calls on wins and losses, and real-time multiplayer duels."}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 hover:from-amber-500 hover:to-red-500 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all group"
            >
              <span>{loading ? "Authenticating Vault..." : mode === "signup" ? "Create Account & Enter" : "Sign In to Casino"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Instant VIP Demo Access */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-800"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-neutral-500">
                  Instant Access
                </span>
                <div className="flex-grow border-t border-neutral-800"></div>
              </div>
              <button
                type="button"
                onClick={handleAIStudioLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>⚡ 1-Click Instant Guest Play (VIP Demo Access)</span>
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <Lock className="w-3.5 h-3.5 text-amber-500/70" />
            <span>256-Bit SSL Encrypted & Provably Fair</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-neutral-600 relative z-10">
        © 2026 Dragon Tiger P2P Arena. Live casino dealer audio enabled. Play responsibly.
      </div>
    </div>
  );
};
