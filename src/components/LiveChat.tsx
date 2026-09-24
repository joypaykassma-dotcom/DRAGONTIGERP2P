import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";

interface ChatMessage {
  user: string;
  vipTier: string;
  text: string;
  time: string;
}

interface LiveChatProps {
  username: string;
  vipTier: string;
  onInspectUser?: (username: string) => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({ username, vipTier, onInspectUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { user: "Rajesh_VIP", vipTier: "Platinum", text: "Dragon is on a 4-round streak! Riding it!", time: "10:52" },
    { user: "CasinoWhale_9", vipTier: "Diamond", text: "Big 10k on Tiger this round 🐅", time: "10:54" },
    { user: "Aarav_Pro", vipTier: "Gold", text: "P2P matched in 40ms, zero slippage 🔥", time: "10:55" },
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of chat history
    const fetchChat = async () => {
      try {
        const res = await fetch("/api/chat/messages");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMessages(data);
          }
        }
      } catch (e) {
        // quiet fallback
      }
    };

    fetchChat();
    const pollInterval = setInterval(fetchChat, 2000);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(`${protocol}//${window.location.host}`);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "CHAT_MESSAGE") {
            setMessages((prev) => {
              if (prev.some((m) => m.time === data.time && m.user === data.user && m.text === data.text)) {
                return prev;
              }
              return [...prev.slice(-60), data];
            });
          }
        } catch (e) {
          console.error(e);
        }
      };
      setWs(socket);
    } catch {
      // ws unsupported or blocked
    }

    return () => {
      clearInterval(pollInterval);
      if (socket) socket.close();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const trimmed = inputText.trim();
    const newMsg: ChatMessage = {
      user: username,
      vipTier,
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // 1. Send via WebSocket if open
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "CHAT", ...newMsg }));
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Dual send via REST API to persist in server and broadcast to all HTTP-polling players
    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });
    } catch (e) {
      console.error("Failed to push chat via REST", e);
    }
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col h-[400px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Live Player Lounge</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
          Live Connected
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onInspectUser && onInspectUser(m.user)}
                  className="font-bold text-amber-300 hover:text-amber-200 hover:underline cursor-pointer transition-colors text-left"
                  title="ইউজারের পাবলিক ব্যালেন্স ও হিস্ট্রি দেখুন"
                >
                  {m.user}
                </button>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-semibold flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> {m.vipTier}
                </span>
              </div>
              <span className="text-neutral-500">{m.time}</span>
            </div>
            <p className="text-neutral-300 break-words">{m.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-2 border-t border-neutral-800 bg-neutral-900/50 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send message to table..."
          maxLength={120}
          className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
