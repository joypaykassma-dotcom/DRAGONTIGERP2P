import React, { useState, useEffect } from "react";
import {
  X,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Send,
  RefreshCw,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  Globe,
  Search,
  Zap,
  User,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { UserWallet } from "../types";

interface WalletModalProps {
  user: UserWallet;
  onClose: () => void;
  onUpdateWallet: (updatedUser: UserWallet) => void;
  onOpenProfile?: () => void;
  onOpenQuickDeposit?: () => void;
  initialTab?: "deposit" | "withdraw" | "transfer" | "history" | "globalLedger" | "stats";
}

interface GlobalTx {
  id: string;
  txHash: string;
  type: "deposit" | "withdraw" | "transfer" | "tie_refund" | "commission" | "refund";
  username: string;
  userId: string;
  recipientUsername?: string;
  recipientUserId?: string;
  amount: number;
  method: string;
  status: "COMPLETED" | "PROCESSED";
  timestamp: string;
  description: string;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  user,
  onClose,
  onUpdateWallet,
  onOpenProfile,
  onOpenQuickDeposit,
  initialTab = "deposit",
}) => {
  const [activeTab, setActiveTab] = useState<
    "deposit" | "withdraw" | "transfer" | "history" | "globalLedger" | "stats"
  >(initialTab);

  // Deposit State
  const [depositAmount, setDepositAmount] = useState<string>("1000");
  const [depositMethod, setDepositMethod] = useState<string>("bKash (Merchant Pay)");

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState<string>("1000");
  const [withdrawMethod, setWithdrawMethod] = useState<string>("bKash Personal");
  const [withdrawAccountNo, setWithdrawAccountNo] = useState<string>("01700000000");

  // Send Money / P2P Transfer State
  const [transferTargetUser, setTransferTargetUser] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("500");
  const [transferNote, setTransferNote] = useState<string>("");

  // Global Ledger State
  const [globalTxs, setGlobalTxs] = useState<GlobalTx[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState<string>("all");
  const [ledgerSearch, setLedgerSearch] = useState<string>("");
  const [loadingLedger, setLoadingLedger] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Status
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Fetch Global Transactions
  const fetchGlobalLedger = async () => {
    setLoadingLedger(true);
    try {
      let url = `/api/transparency/transactions?limit=100`;
      if (ledgerFilter !== "all") url += `&type=${ledgerFilter}`;
      if (ledgerSearch.trim()) url += `&search=${encodeURIComponent(ledgerSearch.trim())}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) {
          setGlobalTxs(data.transactions);
        }
      }
    } catch {
      // quiet fallback
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    if (activeTab === "globalLedger") {
      fetchGlobalLedger();
      const timer = setInterval(fetchGlobalLedger, 3000);
      return () => clearInterval(timer);
    }
  }, [activeTab, ledgerFilter, ledgerSearch]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // 1. Handle Deposit
  const handleDeposit = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    const num = Number(depositAmount);
    if (isNaN(num) || num < 50) {
      setErrorMsg("সর্বনিম্ন ডিপোজিট ৫০ টাকা / ₹50");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          action: "deposit",
          amount: num,
          method: depositMethod,
          description: `Deposit via ${depositMethod} (Ref: ${Math.floor(Math.random() * 90000000 + 10000000)})`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateWallet(data.user);
        fetchGlobalLedger();
        setSuccessMsg(`৳${num.toLocaleString()} সফলভাবে আপনার ব্যালেন্সে জমা হয়েছে!`);
      } else {
        setErrorMsg(data.error || "ডিপোজিট ব্যর্থ হয়েছে");
      }
    } catch {
      setErrorMsg("Deposit connection error");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Withdraw
  const handleWithdraw = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    const num = Number(withdrawAmount);
    if (isNaN(num) || num < 100) {
      setErrorMsg("সর্বনিম্ন উত্তোলন ১০০ টাকা / ₹100");
      return;
    }
    if (user.balance < num) {
      setErrorMsg("উত্তোলনের জন্য একাউন্টে পর্যাপ্ত ব্যালেন্স নেই");
      return;
    }
    if (!withdrawAccountNo.trim()) {
      setErrorMsg("অনুগ্রহ করে মোবাইল বা একাউন্ট নম্বর লিখুন");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          action: "withdraw",
          amount: num,
          method: withdrawMethod,
          description: `Payout to ${withdrawMethod} (${withdrawAccountNo})`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateWallet(data.user);
        fetchGlobalLedger();
        setSuccessMsg(`৳${num.toLocaleString()} উত্তোলনের আবেদন সফল হয়েছে!`);
      } else {
        setErrorMsg(data.error || "উত্তোলন ব্যর্থ হয়েছে");
      }
    } catch {
      setErrorMsg("Withdrawal connection error");
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle P2P Send Money / Fund Transfer
  const handleSendMoney = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    const num = Number(transferAmount);
    if (!transferTargetUser.trim()) {
      setErrorMsg("প্রাপক খেলোয়াড়ের ইউজারনেম (Username) দিন");
      return;
    }
    if (isNaN(num) || num < 10) {
      setErrorMsg("সর্বনিম্ন ট্রান্সফার ১০ টাকা / ₹10");
      return;
    }
    if (user.balance < num) {
      setErrorMsg("ট্রান্সফারের জন্য আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: user.userId,
          toUsername: transferTargetUser.trim(),
          amount: num,
          note: transferNote.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateWallet(data.user);
        fetchGlobalLedger();
        setSuccessMsg(data.message || `৳${num.toLocaleString()} সফলভাবে ট্রান্সফার করা হয়েছে!`);
        setTransferTargetUser("");
        setTransferNote("");
      } else {
        setErrorMsg(data.error || "ফান্ড ট্রান্সফার ব্যর্থ হয়েছে");
      }
    } catch {
      setErrorMsg("Transfer processing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>P2P Wallet &amp; Public Transparency Vault</span>
              </h2>
              <p className="text-[10px] sm:text-xs text-neutral-400">
                ১০০% উন্মুক্ত ও স্বচ্ছ লেনদেন • Instant bKash, Nagad, Rocket, UPI &amp; P2P Transfer
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

        {/* Balance Status Banner */}
        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-xs text-neutral-400 uppercase font-bold tracking-wider">
              Real Cash Balance (আসল ব্যালেন্স)
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 font-mono">
              ৳{user.balance.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] sm:text-xs text-neutral-400 uppercase font-bold tracking-wider">
              Demo Chips
            </div>
            <div className="text-sm sm:text-base font-bold text-purple-400 mt-0.5 font-mono">
              ৳{user.demoBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="grid grid-cols-5 p-1 sm:p-1.5 bg-neutral-950 border-b border-neutral-800 text-[11px] sm:text-xs font-bold gap-1">
          <button
            onClick={() => {
              setActiveTab("deposit");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center ${
              activeTab === "deposit"
                ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
            <span>Deposit</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("withdraw");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center ${
              activeTab === "withdraw"
                ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span>Withdraw</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("transfer");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center ${
              activeTab === "transfer"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>Send Money</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("globalLedger");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center ${
              activeTab === "globalLedger"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>Public Ledger</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center ${
              activeTab === "history"
                ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>My Ledger</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[62vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. DEPOSIT TAB */}
          {activeTab === "deposit" && (
            <div className="space-y-4 text-xs">
              {onOpenQuickDeposit && (
                <div className="p-3 bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/5 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">১-ট্যাপ কুইক ডিপোজিট চান?</div>
                      <div className="text-[10px] text-neutral-400">স্টার্টার, পপুলার ও ভিআইপি প্যাকেজ বেছে নিন</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQuickDeposit();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition-all shadow-md shrink-0"
                  >
                    Quick Deposit
                  </button>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="text-neutral-300 block mb-1.5 font-bold">ডিপোজিট মেথড সিলেক্ট করুন:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    "bKash (Merchant Pay)",
                    "Nagad (Instant)",
                    "Rocket",
                    "UPI / QR",
                    "USDT (TRC-20)",
                    "Bank Transfer",
                  ].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDepositMethod(m)}
                      className={`p-2 rounded-xl border text-center font-bold transition-all text-xs ${
                        depositMethod === m
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-bold">টাকার পরিমাণ (৳ / ₹):</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt.toString())}
                      className={`py-2 rounded-xl border font-bold text-xs ${
                        depositAmount === amt.toString()
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      ৳{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none"
                />
              </div>

              {/* QR Code & Gateway Info */}
              <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl flex items-center gap-3.5">
                <div className="w-16 h-16 bg-white rounded-xl p-1 flex items-center justify-center shrink-0">
                  <QrCode className="w-full h-full text-neutral-950" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">অটোমেটিক ইন্সট্যান্ট ক্যাশ-ইন</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    লেনদেনের সাথে সাথেই উন্মুক্ত পাবলিক লেজারে রেকর্ড হবে এবং ওয়ালেটে ক্রেডিট হবে।
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% সুরক্ষিত ও অডিটেবল
                  </div>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-xs sm:text-sm"
              >
                {loading
                  ? "গেটওয়ে প্রসেসিং..."
                  : `ডিপোজিট নিশ্চিত করুন: ৳${Number(depositAmount || 0).toLocaleString()}`}
              </button>
            </div>
          )}

          {/* 2. WITHDRAW TAB */}
          {activeTab === "withdraw" && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1.5 font-bold">উত্তোলন মেথড সিলেক্ট করুন:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["bKash Personal", "Nagad Personal", "Rocket", "UPI / Bank Transfer"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawMethod(m)}
                      className={`p-2 rounded-xl border text-center font-bold transition-all text-xs ${
                        withdrawMethod === m
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-bold">উত্তোলনের পরিমাণ (৳):</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  সর্বনিম্ন: ৳১০০ | সর্বোচ্চ: ৳১,০০,০০০ (প্রতি ট্রানজেকশন)
                </span>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-bold">
                  প্রাপক মোবাইল নম্বর / একাউন্ট নম্বর:
                </label>
                <input
                  type="text"
                  value={withdrawAccountNo}
                  onChange={(e) => setWithdrawAccountNo(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none"
                />
              </div>

              <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-xl text-[11px] text-neutral-400 space-y-1">
                <div className="flex items-center justify-between text-neutral-300 font-semibold">
                  <span>উত্তোলন ফি:</span>
                  <span className="text-emerald-400 font-bold">০% (সম্পূর্ণ ফ্রি)</span>
                </div>
                <div className="flex items-center justify-between text-neutral-300 font-semibold">
                  <span>প্রসেসিং সময়:</span>
                  <span className="text-amber-400 font-bold">তাৎক্ষণিক (১-৩ মিনিট)</span>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-amber-600/20 text-xs sm:text-sm"
              >
                {loading
                  ? "উত্তোলন প্রক্রিয়াধীন..."
                  : `টাকা উত্তোলন করুন: ৳${Number(withdrawAmount || 0).toLocaleString()}`}
              </button>
            </div>
          )}

          {/* 3. SEND MONEY / P2P FUND TRANSFER TAB */}
          {activeTab === "transfer" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-neutral-900 to-emerald-500/5 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs sm:text-sm">
                      P2P Send Money (খেলোয়াড় টু খেলোয়াড় ফান্ড ট্রান্সফার)
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      যে কোনো খেলোয়াড়ের ইউজারনেমে সরাসরি টাকা পাঠান। ০% ফি এবং তাৎক্ষণিক সেটেলমেন্ট!
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-bold">
                  প্রাপকের ইউজারনেম (Recipient Username):
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={transferTargetUser}
                    onChange={(e) => setTransferTargetUser(e.target.value)}
                    placeholder="e.g. DragonMaster99, KolkataKnight_9"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-white font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-bold">ট্রান্সফারের পরিমাণ (৳):</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[100, 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTransferAmount(amt.toString())}
                      className={`py-2 rounded-xl border font-bold text-xs ${
                        transferAmount === amt.toString()
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      ৳{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-300 block mb-1 font-bold">নোট বা মেসেজ (Optional):</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Tournament duel winnings, practice loan"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-neutral-300">
                <span>সার্ভিস চার্জ:</span>
                <span className="text-emerald-400 font-bold">৳0 (সম্পূর্ণ ফ্রি)</span>
              </div>

              <button
                onClick={handleSendMoney}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {loading
                    ? "ট্রান্সফার প্রসেসিং..."
                    : `Send ৳${Number(transferAmount || 0).toLocaleString()} to ${transferTargetUser || "Player"}`}
                </span>
              </button>
            </div>
          )}

          {/* 4. GLOBAL PUBLIC TRANSPARENCY LEDGER TAB */}
          {activeTab === "globalLedger" && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs">১০০% উন্মুক্ত ফাইনান্সিয়াল লেজার</h3>
                    <p className="text-[10px] text-neutral-400">
                      সকল ইউজারের ডিপোজিট, উইথড্র ও ট্রান্সফার সর্বজনীনভাবে যাচাইযোগ্য
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchGlobalLedger}
                  disabled={loadingLedger}
                  className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-blue-500 text-blue-400 hover:text-white"
                  title="Refresh Ledger"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLedger ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-1/2">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="ইউজারনেম বা হ্যাশ দিয়ে খুঁজুন..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1 w-full sm:w-1/2 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "All" },
                    { id: "deposit", label: "Deposits" },
                    { id: "withdraw", label: "Withdraws" },
                    { id: "transfer", label: "Transfers" },
                    { id: "refund", label: "Unmatched Refunds" },
                    { id: "tie_refund", label: "Tie Refunds" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setLedgerFilter(f.id)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] shrink-0 border transition-all ${
                        ledgerFilter === f.id
                          ? "bg-blue-600 text-white border-blue-400"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Stream List */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {globalTxs.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">কোনো লেনদেন পাওয়া যায়নি</div>
                ) : (
                  globalTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-neutral-950/90 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${
                              tx.type === "deposit"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : tx.type === "withdraw"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : tx.type === "transfer"
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : tx.type === "refund"
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {tx.type === "deposit"
                              ? "Deposit"
                              : tx.type === "withdraw"
                              ? "Withdraw"
                              : tx.type === "transfer"
                              ? "P2P Transfer"
                              : tx.type === "refund"
                              ? "Unmatched Refund"
                              : "Tie Refund"}
                          </span>
                          <span className="font-bold text-white text-xs">{tx.username}</span>
                          {tx.recipientUsername && (
                            <span className="text-neutral-400 text-[11px]">
                              ➔ <strong className="text-emerald-300">@{tx.recipientUsername}</strong>
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-black font-mono text-xs sm:text-sm ${
                              tx.type === "deposit" || tx.type === "tie_refund" || tx.type === "refund"
                                ? "text-emerald-400"
                                : tx.type === "withdraw"
                                ? "text-red-400"
                                : "text-blue-400"
                            }`}
                          >
                            {tx.type === "deposit" || tx.type === "tie_refund" || tx.type === "refund" ? "+" : "-"}৳
                            {tx.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                        <span className="truncate max-w-[200px] sm:max-w-xs">{tx.description}</span>
                        <span className="text-neutral-500 shrink-0">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="pt-1 border-t border-neutral-900 flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                        <span className="truncate max-w-[200px] sm:max-w-sm">Hash: {tx.txHash}</span>
                        <button
                          onClick={() => handleCopyHash(tx.txHash)}
                          className="flex items-center gap-1 text-neutral-400 hover:text-amber-300 transition-colors shrink-0"
                        >
                          {copiedHash === tx.txHash ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 5. PERSONAL HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-2 text-xs">
              {user.transactions.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">আপনার এখনো কোনো লেনদেন নেই</div>
              ) : (
                user.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">{tx.description}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold font-mono ${
                        tx.type === "win" || tx.type === "deposit" || tx.type === "faucet" || tx.type === "refund" || tx.type === "TIE_REFUND" || tx.type === "tie_refund"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type === "win" || tx.type === "deposit" || tx.type === "faucet" || tx.type === "refund" || tx.type === "TIE_REFUND" || tx.type === "tie_refund" ? "+" : "-"}
                      ৳{tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="text-[10px] text-neutral-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit Provably Fair Cryptographic Ledger</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
