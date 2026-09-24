import React, { useState } from "react";
import { X, Zap, ArrowDownRight, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, Wallet } from "lucide-react";
import { UserWallet } from "../types";
import { sound } from "../utils/audio";

interface QuickDepositModalProps {
  user: UserWallet;
  onClose: () => void;
  onUpdateWallet: (updated: UserWallet) => void;
}

const PRESET_AMOUNTS = [
  { amount: 500, label: "Starter", bonus: 0, tag: "Standard" },
  { amount: 1000, label: "Popular", bonus: 0, tag: "Fast Match" },
  { amount: 2500, label: "Gold", bonus: 100, tag: "+₹100 Bonus" },
  { amount: 5000, label: "VIP Club", bonus: 350, tag: "+₹350 Bonus" },
  { amount: 10000, label: "High Roller", bonus: 1000, tag: "+10% Extra" },
  { amount: 25000, label: "Apex Whale", bonus: 3000, tag: "+12% Extra" },
];

export const QuickDepositModal: React.FC<QuickDepositModalProps> = ({
  user,
  onClose,
  onUpdateWallet,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "crypto" | "card">("upi");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const selectedPreset = PRESET_AMOUNTS.find((p) => p.amount === selectedAmount);
  const bonus = selectedPreset?.bonus || 0;
  const totalCredited = selectedAmount + bonus;

  const handleDeposit = async () => {
    sound.playButtonClick();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          amount: totalCredited,
          method: `Quick ${paymentMethod.toUpperCase()}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        sound.playWinFanfare();
        sound.speak(`₹${totalCredited.toLocaleString()} credited successfully to your wallet!`);
        setSuccess(`Successfully deposited ₹${totalCredited.toLocaleString()}! Balance updated.`);
        onUpdateWallet(data.user);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || "Deposit transaction could not be completed.");
      }
    } catch {
      setError("Network connectivity error during transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-red-500 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Quick Deposit
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Instant Credit
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                1-Tap Fast Funding with instant escrow clearing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Current Balance Bar */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>Current {user.balanceType === "real" ? "Real" : "Demo"} Balance:</span>
            </div>
            <div className="text-base font-black text-amber-300 font-mono">
              ₹{(user.balanceType === "real" ? user.balance : user.demoBalance).toLocaleString()}
            </div>
          </div>

          {/* Feedback messages */}
          {success && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Preset Amount Grid */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              Select Deposit Amount:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_AMOUNTS.map((p) => {
                const isSelected = selectedAmount === p.amount;
                return (
                  <button
                    key={p.amount}
                    type="button"
                    onClick={() => {
                      sound.playChip();
                      setSelectedAmount(p.amount);
                    }}
                    className={`p-3 rounded-2xl border transition-all text-left relative flex flex-col justify-between min-h-[76px] ${
                      isSelected
                        ? "bg-gradient-to-br from-amber-500/20 to-neutral-900 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30"
                        : "bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-850"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black text-white font-mono">
                        ₹{p.amount.toLocaleString()}
                      </span>
                      {p.bonus > 0 && (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-neutral-400">{p.label}</span>
                      <span className={p.bonus > 0 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                        {p.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              Payment Gateway:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === "upi"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-black"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                ⚡ UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === "card"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-black"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                💳 Debit/Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("crypto")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === "crypto"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-black"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                🪙 Crypto (USDT)
              </button>
            </div>
          </div>

          {/* Breakdown Summary */}
          <div className="p-3.5 bg-neutral-950/90 border border-neutral-800 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Deposit Principle:</span>
              <span className="font-mono text-white">₹{selectedAmount.toLocaleString()}</span>
            </div>
            {bonus > 0 && (
              <div className="flex items-center justify-between text-emerald-400 font-medium">
                <span>VIP Match Bonus:</span>
                <span className="font-mono">+₹{bonus.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-neutral-800 pt-1.5 flex items-center justify-between font-bold">
              <span className="text-white">Total Credited:</span>
              <span className="text-amber-400 font-mono text-sm font-black">
                ₹{totalCredited.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeposit}
            disabled={loading}
            className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Processing Transfer...</span>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4" />
                <span>Instant Deposit ₹{totalCredited.toLocaleString()}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
