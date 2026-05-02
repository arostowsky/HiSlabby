import React, { useEffect, useState } from "react";
import { api, fmtUSD, fmtPct } from "../lib/api";
import Ticker from "../components/Ticker";
import { Loader2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#a855f7", "#14b8a6"];

export default function Portfolio() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/portfolio/analytics").then((r) => setData(r.data)); }, []);

  if (!data) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /></div>;

  return (
    <div>
      <Ticker />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400">Prime Brokerage</div>
        <h1 className="mt-2 display-tight uppercase italic text-5xl lg:text-7xl">Portfolio.</h1>

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-900">
          <Stat k="MTM Total" v={fmtUSD(data.total_value)} />
          <Stat k="Slabs" v={data.card_count} />
          <Stat k="30-Day P&L" v={fmtUSD(data.pnl_30d)} emerald={data.pnl_30d >= 0} negative={data.pnl_30d < 0} />
          <Stat k="Return" v={fmtPct(data.pnl_pct_30d)} emerald={data.pnl_pct_30d >= 0} negative={data.pnl_pct_30d < 0} />
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-slate-800 p-6">
            <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">30-Day Valuation</div>
            <div className="h-72 mt-4" data-testid="portfolio-chart">
              <ResponsiveContainer>
                <AreaChart data={data.history}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" hide />
                  <YAxis domain={["dataMin", "dataMax"]} hide />
                  <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1e293b", fontSize: 12 }} itemStyle={{ color: "#fff" }} formatter={(v) => fmtUSD(v)} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.5} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-slate-800 p-6">
            <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">Allocation by Sport</div>
            {data.allocation_by_sport.length === 0 ? (
              <div className="text-sm text-slate-500 mt-6">No allocation data.</div>
            ) : (
              <div className="h-56 mt-4">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={data.allocation_by_sport} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {data.allocation_by_sport.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1e293b", fontSize: 12 }} formatter={(v) => fmtUSD(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 space-y-1.5">
              {data.allocation_by_sport.map((a, i) => (
                <div key={a.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-400">{a.name}</span>
                  </div>
                  <span className="num text-white">{fmtUSD(a.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase 2 teaser */}
        <div className="mt-10 border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400">Coming · Phase 2</div>
            <div className="mt-2 font-serif text-2xl">Card-backed credit line</div>
            <p className="mt-1 text-sm text-slate-400 max-w-xl">Borrow up to 50% LTV against your vaulted portfolio. Finance the gap on your next grail without liquidating.</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">Est. Line</div>
            <div className="num text-3xl text-emerald-400">{fmtUSD(data.total_value * 0.5)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v, emerald, negative }) {
  const color = negative ? "text-red-400" : emerald ? "text-emerald-400" : "text-white";
  return (
    <div className="bg-[#050912] p-6">
      <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">{k}</div>
      <div className={`mt-2 num text-3xl ${color}`}>{v}</div>
    </div>
  );
}
