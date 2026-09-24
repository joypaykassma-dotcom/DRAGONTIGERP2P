import React, { useState, useEffect } from 'react';
import { Swords, Plus, Shield, Users, Trophy, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { UserWallet, P2PRoom } from '../types';

interface P2PLobbyProps {
  user: UserWallet;
  onUpdateWallet: (updatedUser: UserWallet) => void;
}

export const P2PLobby: React.FC<P2PLobbyProps> = ({ user, onUpdateWallet }) => {
  const [rooms, setRooms] = useState<P2PRoom[]>([]);
  const [amount, setAmount] = useState<string>('1000');
  const [choice, setChoice] = useState<'dragon' | 'tiger'>('dragon');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [resolvedRoom, setResolvedRoom] = useState<P2PRoom | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(data);
    } catch (e) {
      console.error('Failed to fetch rooms:', e);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 100) {
      setErrorMsg('Minimum challenge stake is 100 chips');
      return;
    }

    if (user.balance < numAmount) {
      setErrorMsg('Insufficient balance to create challenge stake');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          username: user.username,
          amount: numAmount,
          choice
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateWallet(data.user);
        setRooms(prev => [data.room, ...prev]);
        setSuccessMsg('Successfully created P2P challenge room!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to create room');
      }
    } catch (err) {
      setErrorMsg('Network error connecting to P2P server');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRoom = async (roomId: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/rooms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          userId: user.userId,
          username: user.username
        })
      });
      const data = await res.json();
      if (data.success) {
        setResolvedRoom(data.room);
        // Refresh wallet
        const walletRes = await fetch(`/api/wallet/${user.userId}`);
        const walletData = await walletRes.json();
        onUpdateWallet(walletData);
        fetchRooms();
      } else {
        setErrorMsg(data.error || 'Failed to accept duel');
      }
    } catch (err) {
      setErrorMsg('Network error accepting challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRoom = async (roomId: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/rooms/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          userId: user.userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Challenge cancelled! ₹${data.refundedAmount?.toLocaleString()} refunded 100% to your wallet.`);
        if (data.user) {
          onUpdateWallet(data.user);
        } else {
          const walletRes = await fetch(`/api/wallet/${user.userId}`);
          const walletData = await walletRes.json();
          onUpdateWallet(walletData);
        }
        fetchRooms();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to cancel challenge');
      }
    } catch (err) {
      setErrorMsg('Network error cancelling challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900 border border-amber-500/30 rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <Swords className="w-4 h-4" /> Peer-to-Peer Escrow Arena
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-white">Challenge Real Players</h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Create custom stakes on Dragon or Tiger. Other players match your stake in escrow, cards are dealt instantly with provably fair RNG, and the winner takes the pot!
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>P2P Unmatched Return Guarantee: Unmatched or cancelled stakes are 100% refunded to your Tk wallet</span>
          </div>
        </div>
        <div className="bg-neutral-950 border border-amber-500/30 rounded-2xl p-4 text-center">
          <div className="text-xs text-neutral-400">Platform Escrow Fee</div>
          <div className="text-xl font-bold text-amber-400 mt-1">2% Low Rate</div>
        </div>
      </div>

      {/* Duel Resolution Modal Popup if just played */}
      {resolvedRoom && (
        <div className="bg-neutral-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> P2P Duel Results ({resolvedRoom.id})
            </h3>
            <button
              onClick={() => setResolvedRoom(null)}
              className="text-xs text-neutral-400 hover:text-white bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl text-center">
              <div className="text-xs text-neutral-400">Creator: {resolvedRoom.creatorName}</div>
              <div className="text-sm font-bold text-white mt-1">Bet: {resolvedRoom.choice.toUpperCase()}</div>
              {resolvedRoom.dragonCard && (
                <div className="mt-3 inline-block bg-white text-neutral-950 font-bold px-4 py-3 rounded-xl border border-red-500">
                  🐉 Dragon: {resolvedRoom.dragonCard.rank} {resolvedRoom.dragonCard.suit}
                </div>
              )}
            </div>
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl text-center">
              <div className="text-xs text-neutral-400">Challenger: {resolvedRoom.acceptorName}</div>
              <div className="text-sm font-bold text-white mt-1">Bet: {resolvedRoom.choice === 'dragon' ? 'TIGER' : 'DRAGON'}</div>
              {resolvedRoom.tigerCard && (
                <div className="mt-3 inline-block bg-white text-neutral-950 font-bold px-4 py-3 rounded-xl border border-amber-500">
                  🐅 Tiger: {resolvedRoom.tigerCard.rank} {resolvedRoom.tigerCard.suit}
                </div>
              )}
            </div>
          </div>
          <div className="bg-neutral-950/80 p-4 rounded-2xl text-center border border-neutral-800">
            <div className="text-xs text-neutral-400 uppercase tracking-wider">Winner</div>
            <div className="text-2xl font-black text-amber-400 mt-1 uppercase">
              {resolvedRoom.winner === 'tie' ? 'Tie Game (Stake Refunded)' : `${resolvedRoom.winner} Wins the ${(resolvedRoom.amount * 2).toLocaleString()} Chip Pot!`}
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout: Create Room Form + Open Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Challenge Form */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl h-fit">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" /> Create P2P Challenge
          </h3>

          {successMsg && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2.5 rounded-xl flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Stake Amount (Chips)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 font-bold text-sm"
                step="500"
                min="100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Your Side
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChoice('dragon')}
                  className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${
                    choice === 'dragon'
                      ? 'bg-red-600/20 border-red-500 text-red-400 shadow-lg shadow-red-600/20'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  🐉 Dragon
                </button>
                <button
                  type="button"
                  onClick={() => setChoice('tiger')}
                  className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${
                    choice === 'tiger'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-600/20'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  🐅 Tiger
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-sm mt-2"
            >
              {loading ? 'Creating Challenge...' : 'Post Challenge to Lobby'}
            </button>
          </form>
        </div>

        {/* Open Rooms List */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Open Challenge Lobbies
            </h3>
            <span className="text-xs font-semibold text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
              {rooms.filter(r => r.status === 'open').length} Active Lobbies
            </span>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {rooms.filter(r => r.status === 'open').length === 0 ? (
              <div className="text-center py-16 bg-neutral-950 rounded-2xl border border-neutral-800/80">
                <Swords className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-400">No open challenge rooms right now.</p>
                <p className="text-xs text-neutral-600 mt-1">Create one using the form to start a duel!</p>
              </div>
            ) : (
              rooms.filter(r => r.status === 'open').map((room) => (
                <div
                  key={room.id}
                  className="bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-amber-400 text-sm">
                      {room.creatorName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{room.creatorName}</div>
                      <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>Challenging on:</span>
                        <span className={`font-bold ${room.choice === 'dragon' ? 'text-red-400' : 'text-amber-400'}`}>
                          {room.choice === 'dragon' ? '🐉 Dragon' : '🐅 Tiger'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-semibold text-neutral-400">Stake Pot</div>
                      <div className="text-sm font-black text-amber-400">
                        {room.amount.toLocaleString()} <span className="text-xs font-normal text-neutral-400">CHIPS</span>
                      </div>
                    </div>
                    {room.creatorId === user.userId ? (
                      <button
                        onClick={() => handleCancelRoom(room.id)}
                        disabled={loading}
                        className="bg-neutral-800 hover:bg-red-600/80 text-red-300 hover:text-white border border-red-500/30 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                        title="Cancel this challenge and get 100% refund returned to your wallet"
                      >
                        <span>Cancel & Refund</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAcceptRoom(room.id)}
                        disabled={loading}
                        className="bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all"
                      >
                        Accept Duel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
