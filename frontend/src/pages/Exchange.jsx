import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtUSD, fmtPct } from "../lib/api";
import Ticker from "../components/Ticker";
import { Loader2, Filter, LayoutGrid, List } from "lucide-react";
import CardSlab from "../components/CardSlab";

const SPORTS = ["All", "Basketball", "Baseball", "Football", "Hockey", "Soccer"];

export default function Exchange() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("All");
  const [view, setView] = useState("book"); // "book" | "grid"
  const [sortKey, setSortKey] = useState("est_value");
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = sport !== "All" ? { sport } : {};
    api.get("/cards/listings", { params })
      .then((r) => setListings(r.data))
      .finally(() => setLoading(false));
  }, [sport]);

  const sorted = useMemo(() => {
    const s = [...listings];
    s.sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
    return s;
  }, [listings, sortKey]);

  return (
    <div>
      <Ticker />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400">Open Order Book</div>
            <h1 className="mt-2 font-serif text-4xl lg:text-5xl">Exchange</h1>
            <p className="mt-3 text-sm text-slate-400 max-w-xl">Every listing is already vaulted. Acceptance triggers instant vault-to-vault settlement.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-slate-800 px-3 py-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select value={sport} onChange={(e) => setSport(e.target.value)} data-testid="sport-filter" className="bg-transparent text-sm focus:outline-none">
                {SPORTS.map((s) => <option key={s} className="bg-slate-950">{s}</option>)}
              </select>
            </div>
            <div className="flex border border-slate-800">
              <button onClick={() => setView("book")} data-testid="view-book-btn" className={`p-2 ${view === "book" ? "bg-white text-slate-950" : "text-slate-400"}`}>
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => setView("grid")} data-testid="view-grid-btn" className={`p-2 ${view === "grid" ? "bg-white text-slate-950" : "text-slate-400"}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="mt-12 border border-dashed border-slate-800 p-12 text-center text-slate-500">No listings match your filter.</div>
        ) : view === "book" ? (
          <div className="mt-8 border border-slate-800 overflow-hidden" data-testid="exchange-order-book">
            <div className="grid grid-cols-12 text-[10px] tracking-[0.2em] uppercase text-slate-500 border-b border-slate-800 bg-slate-950/60">
              <div className="col-span-5 px-4 py-3">Card</div>
              <div className="col-span-2 px-4 py-3">Grade</div>
              <div className="col-span-2 px-4 py-3">Seller</div>
              <div className="col-span-2 px-4 py-3 text-right">Mark</div>
              <div className="col-span-1 px-4 py-3"></div>
            </div>
            {sorted.map((c) => (
              <button
                key={c.id}
                data-testid={`book-row-${c.id}`}
                onClick={() => nav(`/exchange/${c.id}`)}
                className="w-full grid grid-cols-12 text-sm items-center border-b border-slate-900 hover:bg-slate-900/50 text-left transition-colors"
              >
                <div className="col-span-5 px-4 py-3 flex items-center gap-3">
                  <div className="h-10 w-8 border border-slate-800 bg-slate-950 grid place-items-center text-[11px] num text-slate-400">{c.grade}</div>
                  <div className="min-w-0">
                    <div className="font-serif text-base truncate">{c.player}</div>
                    <div className="text-[11px] text-slate-500 truncate">{c.year} {c.set_name}</div>
                  </div>
                </div>
                <div className="col-span-2 px-4 py-3 num text-slate-300">{c.grader} <span className="text-white">{c.grade}</span></div>
                <div className="col-span-2 px-4 py-3 text-slate-400">
                  <div className="truncate">{c.owner_name}</div>
                  <div className="num text-[11px] text-emerald-400">★ {c.owner_reputation?.toFixed(1)}</div>
                </div>
                <div className="col-span-2 px-4 py-3 text-right num text-white">{fmtUSD(c.est_value)}</div>
                <div className="col-span-1 px-4 py-3 text-right text-emerald-400 text-xs">View →</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5" data-testid="exchange-grid">
            {sorted.map((c) => (
              <CardSlab key={c.id} card={c} linkTo={`/exchange/${c.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
