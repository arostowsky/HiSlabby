import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { api, fmtUSD, fmtPct } from "../lib/api";

export default function Ticker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = () => api.get("/market/ticker").then((r) => setItems(r.data.items)).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  if (!items.length) return null;
  return (
    <div className="border-y border-slate-900 bg-slate-950/80" data-testid="market-ticker">
      <Marquee speed={36} gradient={false} pauseOnHover>
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 px-6 py-2 border-r border-slate-900">
            <span className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{it.label}</span>
            <span className="num text-sm text-white">{fmtUSD(it.price)}</span>
            <span className={`num text-xs ${it.change_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmtPct(it.change_pct)}
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
