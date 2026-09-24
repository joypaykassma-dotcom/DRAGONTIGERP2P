import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Users,
  Coins,
  TrendingUp,
  Award,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Gift,
  ExternalLink,
  DollarSign,
  Zap,
} from "lucide-react";
import { UserWallet, ReferralData } from "../types";
import { sound } from "../utils/audio";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserWallet;
  onUpdateUser: (updatedUser: UserWallet) => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData | null>(
    currentUser.referral || null
  );
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // Calculator state
  const [calcTurnover, setCalcTurnover] = useState<number>(50000);

  useEffect(() => {
    if (isOpen && currentUser.userId) {
      fetchReferralData();
    }
  }, [isOpen, currentUser.userId]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/referral/${currentUser.userId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setReferralData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch referral data", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const referralCode =
    referralData?.referralCode ||
    `APEX_${currentUser.username.slice(0, 4).toUpperCase()}_${currentUser.userId.slice(-3)}`;
  const referralLink =
    referralData?.referralLink ||
    `${window.location.origin}?ref=${referralCode}`;

  const currentTier = referralData?.tier || "Bronze";
  const tierRevSharePct = referralData?.tierRevSharePct || 20;
  const unclaimed = referralData?.unclaimedCommission || 0;
  const totalEarned = referralData?.totalCommissionEarned || 0;
  const totalTurnover = referralData?.totalTurnoverGenerated || 0;
  const friendCount = referralData?.totalReferredCount || referralData?.friends.length || 0;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    sound.playChipStack();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    sound.playChipStack();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `🔥 Apex Dragon Tiger অ্যারেনায় ১০০% ফেয়ার P2P বাজি খেলুন! আমার রেফারেল লিঙ্ক দিয়ে জয়েন করে সাথে সাথে ৫০০ টাকা বোনাস চিপস পান: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTelegram = () => {
    const text = `🔥 Apex Dragon Tiger ১০০% P2P প্ল্যাটফর্ম! রেফারেল বোনাস পেতে জয়েন করুন:`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleClaimCommission = async () => {
    if (unclaimed <= 0 || claiming) return;
    setClaiming(true);
    setClaimSuccess(null);
    try {
      sound.playButtonClick();
      const res = await fetch("/api/referral/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.userId }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playWinFanfare();
        sound.speak(`Congratulations! ₹${data.claimedAmount.toLocaleString()} referral commission transferred to your wallet balance.`);
        setClaimSuccess(`সফলভাবে ৳${data.claimedAmount.toLocaleString()} আপনার ওয়ালেটে জমা হয়েছে!`);
        if (data.referral) {
          setReferralData(data.referral);
        }
        if (data.user) {
          onUpdateUser(data.user);
        }
        setTimeout(() => setClaimSuccess(null), 5000);
      }
    } catch {
      setClaimSuccess("দাবি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setClaiming(false);
    }
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyCode.trim() || applying) return;
    setApplying(true);
    setApplyError(null);
    setApplySuccess(null);
    try {
      const res = await fetch("/api/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          refCode: applyCode.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playWinFanfare();
        sound.speak("Referral code activated! 500 bonus chips added.");
        setApplySuccess("রেফারেল কোড সফলভাবে যুক্ত হয়েছে এবং ৳৫০০ বোনাস চিপস পেয়েছেন!");
        if (data.user) {
          onUpdateUser(data.user);
        }
        setApplyCode("");
        fetchReferralData();
      } else {
        setApplyError(data.error || "অবৈধ রেফারেল কোড");
      }
    } catch {
      setApplyError("সার্ভার কানেকশন ত্রুটি");
    } finally {
      setApplying(false);
    }
  };

  // Calculator estimated daily & monthly revshare
  // Platform fee = 5% on winning side (effective 2.5% of total turnover)
  // Affiliate gets tierRevSharePct% of company commission
  const estimatedCompanyFee = calcTurnover * 0.025;
  const estimatedAffiliateDaily = Math.round(estimatedCompanyFee * (tierRevSharePct / 100));
  const estimatedAffiliateMonthly = estimatedAffiliateDaily * 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-amber-300">
                  🤝 P2P রেফার ও অ্যাফিলিয়েট প্রোগ্রাম
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ২০% - ৫০% রিভশেয়ার
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                বন্ধুদের আমন্ত্রণ জানিয়ে তাঁদের প্রতিটি খেলায় কোম্পানি কমিশন থেকে লাইভ ক্যাশ উপার্জন করুন!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
          
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Unclaimed Commission */}
            <div className="bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-500/40 rounded-xl p-3.5 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 text-[11px] font-medium">
                <span>দাবিহীন কমিশন</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-1 text-lg sm:text-xl font-black font-mono text-amber-400">
                ৳{unclaimed.toLocaleString()}
              </div>
              <button
                onClick={handleClaimCommission}
                disabled={unclaimed <= 0 || claiming}
                className={`mt-2 w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 ${
                  unclaimed > 0
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 active:scale-95 cursor-pointer font-black"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {claiming ? "জমা হচ্ছে..." : "ওয়ালেটে নিন ➔"}
              </button>
            </div>

            {/* Total Commission Earned */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-400 text-[11px] font-medium">
                <span>সর্বমোট আয়</span>
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 text-lg sm:text-xl font-black font-mono text-emerald-400">
                ৳{totalEarned.toLocaleString()}
              </div>
              <span className="text-[10px] text-neutral-500 mt-2 block">
                আজীবন মোট কমিশন
              </span>
            </div>

            {/* Friends Invited */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-400 text-[11px] font-medium">
                <span>আমন্ত্রিত বন্ধু</span>
                <Users className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="mt-1 text-lg sm:text-xl font-black font-mono text-cyan-400">
                {friendCount} জন
              </div>
              <span className="text-[10px] text-neutral-500 mt-2 block">
                সক্রিয় রেফারেল
              </span>
            </div>

            {/* Tier & RevShare % */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-neutral-400 text-[11px] font-medium">
                <span>বর্তমান টিয়ার</span>
                <Award className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="mt-1 text-lg sm:text-xl font-black font-mono text-purple-300 flex items-center gap-1.5">
                <span>{currentTier}</span>
                <span className="text-xs bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-300">
                  {tierRevSharePct}%
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-2 block">
                কোম্পানি কমিশনের শেয়ার
              </span>
            </div>
          </div>

          {claimSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{claimSuccess}</span>
            </div>
          )}

          {/* Unique Referral Link & Code Generator */}
          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-400" />
                  আপনার ইউনিক রেফারেল লিংক ও কোড
                </h3>
                <p className="text-[11px] text-neutral-400">
                  এই লিংক বা কোড দিয়ে কেউ রেজিস্ট্রেশন করলে তিনি পাবেন ৳৫০০ ফ্রি বোনাস এবং আপনি পাবেন তাঁর আজীবন কমিশনের ভাগ!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <span>WhatsApp Share</span>
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Telegram</span>
                </button>
              </div>
            </div>

            {/* Link Copy Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 flex items-center bg-neutral-950 rounded-xl border border-neutral-800 p-1.5 px-3">
                <span className="text-xs text-neutral-400 truncate flex-1 font-mono select-all">
                  {referralLink}
                </span>
                <button
                  onClick={handleCopyLink}
                  className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    copiedLink
                      ? "bg-emerald-500 text-neutral-950"
                      : "bg-amber-500 hover:bg-amber-400 text-neutral-950"
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      কপি হয়েছে!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      লিংক কপি
                    </>
                  )}
                </button>
              </div>

              {/* Code Copy Box */}
              <div className="flex items-center justify-between bg-neutral-950 rounded-xl border border-neutral-800 p-1.5 px-3">
                <div className="text-left">
                  <span className="text-[9px] text-neutral-500 uppercase block font-bold">কোড</span>
                  <span className="text-xs font-mono font-black text-amber-400">{referralCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    copiedCode
                      ? "bg-emerald-500 text-neutral-950"
                      : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                  }`}
                >
                  {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedCode ? "কপি!" : "কোড কপি"}
                </button>
              </div>
            </div>
          </div>

          {/* EXACT QUESTION ANSWER & TRANSPARENT P2P REVSHARE FORMULA */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-300">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold">
                💡 P2P বেটিংয়ে রেফার ও অ্যাফিলিয়েট টাকা কীভাবে এবং কত দেওয়া হয়? (স্বচ্ছ গাণিতিক মডেল)
              </h3>
            </div>

            <p className="text-neutral-300 text-xs leading-relaxed">
              যেহেতু এটি ১০০% খেলোয়াড় বনাম খেলোয়াড় (P2P) প্ল্যাটফর্ম, কোম্পানি কারও হারের বিপরীতে টাকা নেয় না। 
              বরং ম্যাচ হওয়া জেতা বাজি থেকে কোম্পানি যে <strong>৫% প্ল্যাটফর্ম ফি (Duel Commission)</strong> গ্রহণ করে, 
              <strong> সেই ৫% কমিশন থেকেই কোম্পানি সরাসরি ২০% থেকে ৫০% টাকা আপনাকে রেফারেল রিভশেয়ার হিসেবে দেয়!</strong>
            </p>

            {/* Formula breakdown card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 block uppercase">১. বন্ধু বাজি জিতল</span>
                <span className="text-white font-bold text-sm">৳১,০০০ বাজি</span>
                <p className="text-[10px] text-neutral-400 font-sans">
                  ড্রাগন বা টাইগারে ১,০০০ টাকা ম্যাচ হয়ে জয়ী হলে লাভ ৳৯০০ এবং কোম্পানি ফি ৳৫০।
                </p>
              </div>

              <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 block uppercase">২. প্ল্যাটফর্ম কমিশন</span>
                <span className="text-amber-400 font-bold text-sm">৳৫০ ফি (৫%)</span>
                <p className="text-[10px] text-neutral-400 font-sans">
                  কোম্পানি কোনো রিস্ক ছাড়া এই ৫০ টাকা সার্ভিস চার্জ হিসেবে আয় করে।
                </p>
              </div>

              <div className="bg-neutral-900 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                <span className="text-[10px] text-emerald-400 block uppercase font-bold">৩. আপনার রেফারেল আয়</span>
                <span className="text-emerald-400 font-bold text-sm">৳১০ - ৳২৫ ইনস্ট্যান্ট</span>
                <p className="text-[10px] text-neutral-400 font-sans">
                  কোম্পানির ৫০ টাকার ২০%-৫০% অংশ সাথে সাথে আপনার রেফারেল একাউন্টে জমা হয়!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>১০০% সলভেন্সি গ্যারান্টি:</strong> কোম্পানি তার নিজস্ব অর্জিত ফি ভাগ করে দেয়, ফলে কোম্পানি কখনোই লোকসানে পড়ে না এবং আপনার উপার্জিত কমিশন সম্পূর্ণ নিরাপদ ও ইনস্ট্যান্ট উইথড্রযোগ্য!
              </span>
            </div>
          </div>

          {/* Tier Progression Ladder */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              ৪-ধাপের অ্যাফিলিয়েট টিয়ার ল্যাডার (Tier Progression)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              {/* Bronze */}
              <div className={`p-3 rounded-xl border transition-all ${
                currentTier === "Bronze"
                  ? "bg-amber-950/30 border-amber-500 text-white ring-1 ring-amber-500"
                  : "bg-neutral-950/60 border-neutral-800 text-neutral-400"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">🥉 Bronze</span>
                  <span className="font-mono text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded">১-৫ জন</span>
                </div>
                <div className="mt-2 text-base font-black font-mono text-white">২০% রিভশেয়ার</div>
                <span className="text-[10px] text-neutral-500 block mt-1">কমিশনের ১/৫ অংশ</span>
              </div>

              {/* Silver */}
              <div className={`p-3 rounded-xl border transition-all ${
                currentTier === "Silver"
                  ? "bg-cyan-950/30 border-cyan-500 text-white ring-1 ring-cyan-500"
                  : "bg-neutral-950/60 border-neutral-800 text-neutral-400"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">🥈 Silver</span>
                  <span className="font-mono text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded">৬-১৫ জন</span>
                </div>
                <div className="mt-2 text-base font-black font-mono text-white">৩০% রিভশেয়ার</div>
                <span className="text-[10px] text-neutral-500 block mt-1">কমিশনের ১/৩ অংশ</span>
              </div>

              {/* Gold */}
              <div className={`p-3 rounded-xl border transition-all ${
                currentTier === "Gold"
                  ? "bg-amber-950/30 border-amber-400 text-white ring-1 ring-amber-400"
                  : "bg-neutral-950/60 border-neutral-800 text-neutral-400"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">🥇 Gold</span>
                  <span className="font-mono text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded">১৬-৫০ জন</span>
                </div>
                <div className="mt-2 text-base font-black font-mono text-white">৪০% রিভশেয়ার</div>
                <span className="text-[10px] text-neutral-500 block mt-1">কমিশনের ২/৫ অংশ</span>
              </div>

              {/* Diamond */}
              <div className={`p-3 rounded-xl border transition-all ${
                currentTier === "Diamond"
                  ? "bg-purple-950/40 border-purple-400 text-white ring-1 ring-purple-400 shadow-md"
                  : "bg-neutral-950/60 border-neutral-800 text-neutral-400"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">💎 Diamond</span>
                  <span className="font-mono text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded">৫০+ জন</span>
                </div>
                <div className="mt-2 text-base font-black font-mono text-purple-300">৫০% রিভশেয়ার</div>
                <span className="text-[10px] text-neutral-500 block mt-1">অর্ধেক কোম্পানির লাভ!</span>
              </div>
            </div>
          </div>

          {/* Interactive Earnings Calculator */}
          <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                ইন্টারেক্টিভ ইনকাম ক্যালকুলেটর (আয় কত হতে পারে?)
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                {tierRevSharePct}% টিয়ারে
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">আপনার সকল বন্ধুদের দৈনিক মোট বাজি (Turnover):</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  ৳{calcTurnover.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={calcTurnover}
                onChange={(e) => setCalcTurnover(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
              />
              <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                <span>৳৫,০০০</span>
                <span>৳১,০০,০০০</span>
                <span>৳২,৫০,০০০</span>
                <span>৳৫,০০,০০০+</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase block font-medium">দৈনিক প্যাসিভ আয়</span>
                <span className="text-lg sm:text-xl font-black font-mono text-emerald-400">
                  +৳{estimatedAffiliateDaily.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">প্রতিদিন সরাসরি ওয়ালেটে</span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-emerald-500/30 text-center">
                <span className="text-[10px] text-emerald-400 uppercase block font-bold">মাসিক অনুমিত আয়</span>
                <span className="text-lg sm:text-xl font-black font-mono text-amber-300">
                  +৳{estimatedAffiliateMonthly.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">৩০ দিনে নিশ্চিত লাভ</span>
              </div>
            </div>
          </div>

          {/* Referred Friends Table */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                আপনার আমন্ত্রিত বন্ধুদের তালিকা ({referralData?.friends.length || 0})
              </h3>
              <span className="text-[11px] text-neutral-500">লাইভ আপডেট</span>
            </div>

            {(!referralData?.friends || referralData.friends.length === 0) ? (
              <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-neutral-400" />
                <p className="text-xs">এখনও কোনো বন্ধু জয়েন করেননি।</p>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  উপরের লিংক শেয়ার করে বন্ধুদের ইনভাইট করুন এবং কমিশন আয় শুরু করুন!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">বন্ধুর নাম</th>
                      <th className="py-2.5 px-3">জয়েন তারিখ</th>
                      <th className="py-2.5 px-3 text-right">মোট বাজি (Turnover)</th>
                      <th className="py-2.5 px-3 text-right">আপনার কমিশন</th>
                      <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40">
                    {referralData.friends.map((f, i) => (
                      <tr key={f.userId || i} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2 px-3 whitespace-nowrap font-bold text-neutral-200">
                          {f.username}
                        </td>
                        <td className="py-2 px-3 text-neutral-400 text-[11px]">
                          {new Date(f.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-right text-neutral-300">
                          ৳{f.totalWagered.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-emerald-400">
                          +৳{f.commissionEarned.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {f.activeStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Apply Referral Code Form (For New Users) */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                কারও রেফারেল কোড আছে?
              </h4>
              <p className="text-[11px] text-neutral-400">
                বন্ধুর রেফারেল কোড বসালে আপনি সাথে সাথে ৳৫০০ বোনাস চিপস উপহার পাবেন!
              </p>
            </div>

            <form onSubmit={handleApplyReferral} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={applyCode}
                onChange={(e) => setApplyCode(e.target.value)}
                placeholder="রেফারেল কোড (যেমন APEX_...)"
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-full sm:w-48 font-mono uppercase"
              />
              <button
                type="submit"
                disabled={!applyCode.trim() || applying}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 text-neutral-950 font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                {applying ? "..." : "যুক্ত করুন"}
              </button>
            </form>
          </div>

          {applySuccess && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{applySuccess}</span>
            </div>
          )}

          {applyError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {applyError}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>১০০% স্বচ্ছ ও ক্রিপ্টোগ্রাফিক্যালি অডিটেড P2P রিভশেয়ার</span>
          </div>

          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
