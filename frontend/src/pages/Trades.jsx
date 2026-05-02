import React, { useEffect, useState } from "react";
import { api, fmtUSD } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Loader2, CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import Ticker from "../components/Ticker";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { motion } from "framer-motion";

function statusColor(s) {
  if (s === "pending") return "text-amber-400 border-amber-500/40 bg-amber-500/5";
  if (s === "settled" || s === "accepted") return "text-emerald-400 border-emerald-500/40 bg-emerald-500/5";
  if (s === "rejected" || s === "cancelled") return "text-red-400 border-red-500/40 bg-red-500/5";
  return "text-slate-400 border-slate-700 bg-slate-800/40";
}

function TradeCard({ t, isIncoming, onAccept, onReject, busyId }) {
  const busy = busyId === t.id;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="border border-slate-800 bg-[#0b1220] p-5" data-testid={`trade-${t.id}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="text-slate-500">
          {isIncoming ? "From" : "To"} <span className="text-white">{isIncoming ? t.initiator_name : t.recipient_name}</span>
          <span className="text-slate-600 ml-2">{new Date(t.created_at).toLocaleString()}</span>
        </div>
        <div className={`text-[10px] tracking-[0.2em] uppercase border px-2 py-0.5 ${statusColor(t.status)}`}>{t.status}</div>
      </div>
      <div className="mt-4 grid grid-cols-11 items-center gap-2">
        {/* Offered side */}
        <div className="col-span-5">
          <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-2">{isIncoming ? "They offer" : "You offer"}</div>
          <div className="space-y-2">
            {t.offered_cards.length === 0 && t.cash_amount === 0 && <div className="text-xs text-slate-600">—</div>}
            {t.offered_cards.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <div className="h-8 w-6 border border-slate-800 bg-slate-950 grid place-items-center text-[10px] num text-slate-400">{c.grade}</div>
                <div className="min-w-0">
                  <div className="font-serif truncate">{c.player}</div>
                  <div className="text-[11px] text-slate-500 num">{c.grader} {c.grade} · {fmtUSD(c.est_value)}</div>
                </div>
              </div>
            ))}
            {t.cash_amount > 0 && <div className="text-sm num text-emerald-400">+ {fmtUSD(t.cash_amount)} cash</div>}
          </div>
        </div>
        <div className="col-span-1 grid place-items-center text-slate-600"><ArrowRight className="h-4 w-4" /></div>
        {/* Target side */}
        <div className="col-span-5">
          <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-2">{isIncoming ? "For your" : "For their"}</div>
          {t.target_card && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-6 border border-slate-800 bg-slate-950 grid place-items-center text-[10px] num text-slate-400">{t.target_card.grade}</div>
              <div className="min-w-0">
                <div className="font-serif truncate">{t.target_card.player}</div>
                <div className="text-[11px] text-slate-500 num">{t.target_card.grader} {t.target_card.grade} · {fmtUSD(t.target_card.est_value)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {isIncoming && t.status === "pending" && (
        <div className="mt-5 flex gap-3 border-t border-slate-900 pt-4">
          <button data-testid={`accept-trade-${t.id}`} onClick={() => onAccept(t)} disabled={busy} className="flex-1 text-sm bg-emerald-500 text-slate-950 hover:bg-emerald-400 py-2 rounded-sm disabled:opacity-60 flex items-center justify-center gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Accept & settle</>}
          </button>
          <button data-testid={`reject-trade-${t.id}`} onClick={() => onReject(t)} disabled={busy} className="flex-1 text-sm border border-slate-800 hover:border-red-500/60 text-slate-300 py-2 rounded-sm flex items-center justify-center gap-1.5">
            <XCircle className="h-4 w-4" /> Reject
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function Trades() {
  const { user, setUser } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [i, o] = await Promise.all([api.get("/trades/incoming"), api.get("/trades/outgoing")]);
      setIncoming(i.data); setOutgoing(o.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const accept = async (t) => {
    setBusyId(t.id);
    try {
      await api.post(`/trades/${t.id}/accept`);
      toast.success("Trade settled · Vault-to-vault complete");
      const me = await api.get("/auth/me");
      setUser(me.data);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setBusyId(null); }
  };
  const reject = async (t) => {
    setBusyId(t.id);
    try {
      await api.post(`/trades/${t.id}/reject`);
      toast.success("Offer rejected");
      load();
    } catch { toast.error("Failed"); }
    finally { setBusyId(null); }
  };

  return (
    <div>
      <Ticker />
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10">
        <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400">Escrow Desk</div>
        <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Trade Inbox</h1>

        <Tabs defaultValue="incoming" className="mt-8">
          <TabsList className="bg-slate-950 border border-slate-800 rounded-none p-0 h-auto">
            <TabsTrigger value="incoming" data-testid="tab-incoming" className="rounded-none data-[state=active]:bg-white data-[state=active]:text-slate-950 px-5 py-2 text-xs tracking-[0.2em] uppercase">
              Incoming <span className="ml-2 num">{incoming.length}</span>
            </TabsTrigger>
            <TabsTrigger value="outgoing" data-testid="tab-outgoing" className="rounded-none data-[state=active]:bg-white data-[state=active]:text-slate-950 px-5 py-2 text-xs tracking-[0.2em] uppercase">
              Outgoing <span className="ml-2 num">{outgoing.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-6 space-y-4">
            {loading ? (
              <div className="py-10 flex justify-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : incoming.length === 0 ? (
              <Empty label="No incoming offers yet." />
            ) : incoming.map((t) => <TradeCard key={t.id} t={t} isIncoming onAccept={accept} onReject={reject} busyId={busyId} />)}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-6 space-y-4">
            {loading ? (
              <div className="py-10 flex justify-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : outgoing.length === 0 ? (
              <Empty label="You haven't sent any offers." />
            ) : outgoing.map((t) => <TradeCard key={t.id} t={t} isIncoming={false} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Empty({ label }) {
  return <div className="border border-dashed border-slate-800 p-12 text-center text-slate-500 text-sm">{label}</div>;
}
