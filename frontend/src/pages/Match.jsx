import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fmtUSD } from "../lib/api";
import Ticker from "../components/Ticker";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Match() {
  const [myCards, setMyCards] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/cards/mine").then((r) => {
      setMyCards(r.data);
      if (r.data.length) setSelected(r.data[0].id);
    });
  }, []);

  const run = async () => {
    if (!selected) return;
    setLoading(true); setMatches([]);
    try {
      const r = await api.post("/ai/match", { my_card_id: selected, limit: 6 });
      setMatches(r.data);
      if (!r.data.length) toast.info("No live listings matched. Try listing more cards.");
    } catch (e) { toast.error(e?.response?.data?.detail || "Match failed"); }
    finally { setLoading(false); }
  };

  const selCard = myCards.find((c) => c.id === selected);

  return (
    <div>
      <Ticker />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400 flex items-center gap-2">
          <Sparkles className="h-3 w-3" /> AI Matching · Claude Sonnet 4.5
        </div>
        <h1 className="mt-2 display-tight uppercase italic text-5xl lg:text-7xl">Find a Trade.</h1>
        <p className="mt-3 text-sm text-slate-400 max-w-2xl">Our valuation engine scans live listings and ranks the best cross-demand matches for any card in your vault.</p>

        <div className="mt-8 grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 border border-slate-800 p-5">
            <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-3">Pick a card to match</div>
            {myCards.length === 0 ? (
              <div className="text-sm text-slate-500">Vault a card first.</div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                {myCards.map((c) => (
                  <button
                    key={c.id}
                    data-testid={`match-pick-${c.id}`}
                    onClick={() => setSelected(c.id)}
                    className={`w-full flex items-center gap-3 p-2 border text-left transition-colors ${selected === c.id ? "border-emerald-500/60 bg-emerald-500/5" : "border-slate-800 hover:border-slate-700"}`}
                  >
                    <div className="h-12 w-9 border border-slate-800 bg-slate-950 grid place-items-center font-serif num text-emerald-400/90">{c.grade}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-sm truncate">{c.player}</div>
                      <div className="text-[11px] text-slate-500 num">{c.grader} {c.grade} · {fmtUSD(c.est_value)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={run} data-testid="run-match-btn" disabled={!selected || loading} className="mt-4 w-full bg-white text-slate-950 hover:bg-slate-200 py-2.5 text-sm rounded-sm disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Find matches</>}
            </button>
          </div>

          <div className="lg:col-span-8">
            {selCard && (
              <div className="text-xs text-slate-500 mb-3">
                Matching for <span className="text-white">{selCard.year} {selCard.player}</span> · <span className="num">{fmtUSD(selCard.est_value)}</span>
              </div>
            )}
            {loading ? (
              <div className="py-24 flex justify-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : matches.length === 0 ? (
              <div className="border border-dashed border-slate-800 p-12 text-center text-sm text-slate-500" data-testid="match-empty-state">
                Select a card and run the AI match engine to see ranked trade candidates.
              </div>
            ) : (
              <div className="space-y-3" data-testid="match-results">
                {matches.map((m, i) => (
                  <motion.div
                    key={m.card.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="border border-slate-800 bg-[#0b1220] p-4 flex items-center gap-4"
                    data-testid={`match-result-${m.card.id}`}
                  >
                    <div className={`num text-4xl font-serif ${m.match_score >= 80 ? "text-emerald-400" : m.match_score >= 60 ? "text-amber-400" : "text-slate-400"}`}>
                      {m.match_score}
                    </div>
                    <div className="h-20 w-14 border border-slate-800 bg-slate-950 grid place-items-center font-serif num text-emerald-400/90 text-2xl">{m.card.grade}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">{m.card.sport} · {m.card.grader} {m.card.grade}</div>
                      <div className="font-serif text-lg truncate">{m.card.player}</div>
                      <div className="text-xs text-slate-400 mt-1 line-clamp-2">{m.rationale}</div>
                    </div>
                    <div className="text-right">
                      <div className="num text-white">{fmtUSD(m.card.est_value)}</div>
                      <Link to={`/exchange/${m.card.id}`} data-testid={`match-go-${m.card.id}`} className="mt-2 inline-block text-xs bg-[#d4ff00] text-slate-950 hover:bg-[#bfe800] px-3 py-1.5 rounded-sm font-bold uppercase tracking-wider">Propose →</Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
