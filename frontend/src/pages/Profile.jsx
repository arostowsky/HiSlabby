import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import Ticker from "../components/Ticker";
import { Loader2, Star, ShieldCheck, TrendingUp } from "lucide-react";

export default function Profile() {
  const { id } = useParams();
  const [u, setU] = useState(null);
  useEffect(() => { api.get(`/users/${id}/profile`).then((r) => setU(r.data)); }, [id]);
  if (!u) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /></div>;

  const initials = u.display_name.split(" ").map(s => s[0]).join("").slice(0, 2);
  return (
    <div>
      <Ticker />
      <div className="max-w-[1000px] mx-auto px-6 lg:px-10 py-16">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-slate-900 border border-slate-800 grid place-items-center font-serif text-2xl">{initials}</div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400">Trader</div>
            <h1 className="mt-2 font-serif text-4xl">{u.display_name}</h1>
            <div className="mt-1 text-xs text-slate-500">{u.email}</div>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-px bg-slate-900">
          <Stat icon={Star} k="Reputation" v={u.reputation_score.toFixed(1)} emerald />
          <Stat icon={TrendingUp} k="Trades Completed" v={u.trades_completed} />
          <Stat icon={ShieldCheck} k="Vault Since" v={new Date(u.created_at).toLocaleDateString()} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: I, k, v, emerald }) {
  return (
    <div className="bg-[#050912] p-6">
      <I className="h-4 w-4 text-emerald-400" />
      <div className="mt-4 text-[10px] tracking-[0.25em] uppercase text-slate-500">{k}</div>
      <div className={`mt-1 num text-2xl ${emerald ? "text-emerald-400" : "text-white"}`}>{v}</div>
    </div>
  );
}
