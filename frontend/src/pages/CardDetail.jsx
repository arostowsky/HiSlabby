import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, fmtUSD, fmtPct } from "../lib/api";
import Ticker from "../components/Ticker";
import { Loader2, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import FairTradeScorePanel from "../components/FairTradeScorePanel";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CardDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [card, setCard] = useState(null);
  const [myCards, setMyCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [cash, setCash] = useState(0);
  const [comps, setComps] = useState(null);
  const [loadingComps, setLoadingComps] = useState(false);
  const [score, setScore] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/cards/${id}`).then((r) => setCard(r.data)).catch(() => toast.error("Card not found"));
    if (user) api.get("/cards/mine").then((r) => setMyCards(r.data));
  }, [id, user]);

  const offerValue = useMemo(() => {
    const cards = myCards.filter((c) => selected.includes(c.id));
    return cards.reduce((s, c) => s + c.est_value, 0) + Math.max(Number(cash) || 0, 0);
  }, [myCards, selected, cash]);

  const toggleSel = (cid) => {
    setSelected((s) => s.includes(cid) ? s.filter((x) => x !== cid) : [...s, cid]);
  };

  const loadComps = async () => {
    setLoadingComps(true);
    try {
      const r = await api.post(`/ai/comps/${id}`);
      setComps(r.data);
    } catch { toast.error("Comps failed"); }
    finally { setLoadingComps(false); }
  };

  const computeScore = async () => {
    if (!selected.length && !cash) {
      toast.error("Add at least one card or cash");
      return;
    }
    setLoadingScore(true);
    try {
      const r = await api.post("/ai/fair-score", {
        target_card_id: id,
        offered_card_ids: selected,
        cash_amount: Number(cash) || 0,
      });
      setScore(r.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Scoring failed");
    } finally { setLoadingScore(false); }
  };

  const submitOffer = async () => {
    setSubmitting(true);
    try {
      await api.post("/trades", {
        target_card_id: id,
        offered_card_ids: selected,
        cash_amount: Number(cash) || 0,
      });
      toast.success("Trade offer submitted");
      nav("/trades");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not submit offer");
    } finally { setSubmitting(false); }
  };

  if (!card) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /></div>;

  const isMine = user && card.owner_id === user.id;

  return (
    <div>
      <Ticker />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        <button data-testid="back-btn" onClick={() => nav(-1)} className="text-xs text-slate-500 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>

        <div className="mt-6 grid lg:grid-cols-12 gap-10">
          {/* Left: slab */}
          <div className="lg:col-span-5">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border border-slate-800 bg-[#0b1220] slab-gradient overflow-hidden">
              <div className="aspect-[3/4] relative">
                <div className="absolute inset-0 opacity-[0.08]" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
                <div className="absolute top-3 left-3 text-[10px] tracking-[0.2em] uppercase bg-slate-950/80 border border-slate-800 px-2 py-0.5">{card.grader}</div>
                <div className="absolute top-3 right-3 p-1 bg-slate-950/80 border border-emerald-500/40"><ShieldCheck className="h-3 w-3 text-emerald-400" /></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="anton num text-[#d4ff00] leading-none" style={{ fontSize: "clamp(6rem, 17vw, 11rem)" }}>{card.grade}</div>
                    <div className="mt-3 text-[11px] tracking-[0.4em] uppercase text-slate-400 font-bold">{card.grader} · {card.sport}</div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 num text-xs text-slate-400">{card.year}</div>
                <div className="absolute bottom-3 right-3 num text-[10px] text-slate-500 tracking-[0.2em]">#{(card.id || "").slice(0,6).toUpperCase()}</div>
              </div>
            </motion.div>
            <div className="mt-5 border border-slate-800 p-5">
              <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">Market Comps</div>
              {!comps ? (
                <button data-testid="load-comps-btn" onClick={loadComps} disabled={loadingComps} className="mt-3 w-full text-sm border border-slate-700 hover:border-emerald-500/60 py-2 flex items-center justify-center gap-2 disabled:opacity-60">
                  {loadingComps ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 text-emerald-400" /> Pull recent comps</>}
                </button>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-6">
                    <div><div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Avg</div><div className="num text-white">{fmtUSD(comps.average)}</div></div>
                    <div><div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Median</div><div className="num text-white">{fmtUSD(comps.median)}</div></div>
                  </div>
                  <div className="divide-y divide-slate-900 text-xs">
                    {comps.comps.map((c, i) => (
                      <div key={i} className="py-2 flex items-center justify-between">
                        <span className="text-slate-400">{c.date} · {c.venue}</span>
                        <span className="num text-white">{fmtUSD(c.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 border-t border-slate-900 pt-2">{comps.summary}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right: details + offer builder */}
          <div className="lg:col-span-7">
            <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400">{card.sport} · {card.year}</div>
            <h1 className="mt-2 display-tight uppercase italic" style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}>{card.player}.</h1>
            <div className="mt-2 text-slate-400">{card.set_name}</div>
            <div className="mt-6 grid grid-cols-4 gap-6 pb-6 border-b border-slate-800">
              <Metric k="Mark" v={fmtUSD(card.est_value)} />
              <Metric k="Grade" v={`${card.grader} ${card.grade}`} />
              <Metric k="Seller" v={card.owner_name} sub={`★ ${card.owner_reputation?.toFixed(1)}`} />
              <Metric k="Status" v={card.listed_for_trade ? "Listed" : "Not Listed"} emerald={card.listed_for_trade} />
            </div>
            {card.listing_note && (
              <div className="mt-4 text-sm text-slate-300 italic border-l-2 border-emerald-500/40 pl-3">"{card.listing_note}"</div>
            )}

            {isMine ? (
              <div className="mt-8 border border-slate-800 p-6 text-slate-400 text-sm">This is your card. Toggle listing status from the Vault.</div>
            ) : !card.listed_for_trade ? (
              <div className="mt-8 border border-slate-800 p-6 text-slate-400 text-sm">Not currently listed for trade.</div>
            ) : !user ? (
              <div className="mt-8 border border-slate-800 p-6 text-slate-400 text-sm">Sign in to submit an offer.</div>
            ) : (
              <div className="mt-8 space-y-6">
                <div className="border border-slate-800 p-5">
                  <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-3">Select cards from your vault to offer</div>
                  {myCards.length === 0 ? (
                    <div className="text-sm text-slate-500">Your vault is empty. Vault a card first.</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {myCards.map((c) => (
                        <button
                          key={c.id}
                          data-testid={`offer-toggle-${c.id}`}
                          onClick={() => toggleSel(c.id)}
                          className={`text-left border p-2 transition-colors ${selected.includes(c.id) ? "border-emerald-500/60 bg-emerald-500/5" : "border-slate-800 hover:border-slate-700"}`}
                        >
                          <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em]">{c.grader} {c.grade}</div>
                          <div className="font-serif text-sm leading-tight truncate">{c.player}</div>
                          <div className="num text-xs text-white mt-1">{fmtUSD(c.est_value)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-4 border-t border-slate-900 pt-4">
                    <label className="text-[10px] tracking-[0.25em] uppercase text-slate-500">+ Cash</label>
                    <input data-testid="cash-amount-input" type="number" min="0" value={cash} onChange={(e) => setCash(e.target.value)} className="bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:outline-none px-3 py-1.5 text-sm w-40 num" />
                    <div className="ml-auto text-xs text-slate-400">Offer value: <span className="num text-white">{fmtUSD(offerValue)}</span></div>
                  </div>
                </div>

                <FairTradeScorePanel data={score} loading={loadingScore} onCompute={computeScore} />

                <button
                  data-testid="submit-offer-btn"
                  onClick={submitOffer}
                  disabled={submitting || (!selected.length && !cash)}
                  className="w-full bg-[#d4ff00] text-slate-950 hover:bg-[#bfe800] text-sm font-bold uppercase tracking-wider py-3.5 rounded-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit trade offer →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ k, v, sub, emerald }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">{k}</div>
      <div className={`mt-1 num ${emerald ? "text-emerald-400" : "text-white"}`}>{v}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
