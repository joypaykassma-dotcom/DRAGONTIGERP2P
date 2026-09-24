import React, { useEffect, useState } from "react";

interface PlayingCardProps {
  card: {
    rank: string;
    suit: string;
    value: number;
    display: string;
  } | null;
  side: "DRAGON" | "TIGER";
  isWinner?: boolean;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({ card, side, isWinner = false }) => {
  const [flipped, setFlipped] = useState<boolean>(false);

  // Trigger flip animation 200ms after the card is provided (deals state)
  useEffect(() => {
    if (card) {
      const timer = setTimeout(() => {
        setFlipped(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setFlipped(false);
    }
  }, [card]);

  const isRed = card?.suit === "♥" || card?.suit === "♦";

  return (
    <div className="relative w-16 h-22 sm:w-18 sm:h-26 perspective-[1000px] select-none">
      {/* CSS 3D Card Animation Styles */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      <div
        className={`w-full h-full duration-700 preserve-3d transition-all ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        {/* CARD BACK (JILI / Evolution Diamond Gold Pattern) */}
        <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-neutral-900 via-amber-950 to-neutral-950 border-2 border-amber-500/40 shadow-xl flex flex-col items-center justify-center p-1.5 backface-hidden">
          <div className="w-full h-full rounded-lg border border-amber-500/10 flex flex-col items-center justify-center relative overflow-hidden bg-neutral-950/40">
            {/* Geometric golden lines */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:12px_12px]" />
            <span className={`text-sm sm:text-base font-black tracking-widest ${
              side === "DRAGON" ? "text-blue-400" : "text-red-400"
            }`}>
              {side === "DRAGON" ? "🐉" : "🐯"}
            </span>
            <span className="text-[7px] sm:text-[8px] font-bold text-amber-500/60 uppercase tracking-widest mt-1">
              APEX P2P
            </span>
          </div>
        </div>

        {/* CARD FRONT (Fully Revealed Suit & Rank) */}
        <div className={`absolute inset-0 w-full h-full rounded-xl bg-white border-2 shadow-2xl flex flex-col justify-between p-2 sm:p-2.5 rotate-y-180 backface-hidden ${
          isWinner 
            ? "border-amber-400 ring-4 ring-amber-400/50 animate-pulse shadow-amber-500/50" 
            : "border-neutral-300"
        }`}>
          {/* Top Rank + Suit */}
          <div className="flex flex-col items-start leading-none">
            <span className={`text-xs sm:text-sm font-black ${isRed ? "text-red-600" : "text-neutral-900"}`}>
              {card?.rank}
            </span>
            <span className={`text-xs sm:text-sm ${isRed ? "text-red-600" : "text-neutral-900"}`}>
              {card?.suit}
            </span>
          </div>

          {/* Large Center Suit Graphic with 3D Pop */}
          <div className="self-center flex items-center justify-center">
            <span className={`text-2xl sm:text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] ${isRed ? "text-red-600" : "text-neutral-900"}`}>
              {card?.suit}
            </span>
          </div>

          {/* Bottom Rank + Suit (Inverted) */}
          <div className="flex flex-col items-end leading-none transform rotate-180">
            <span className={`text-xs sm:text-sm font-black ${isRed ? "text-red-600" : "text-neutral-900"}`}>
              {card?.rank}
            </span>
            <span className={`text-xs sm:text-sm ${isRed ? "text-red-600" : "text-neutral-900"}`}>
              {card?.suit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
