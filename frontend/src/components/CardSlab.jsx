import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fmtUSD, fmtPct } from "../lib/api";
import { ShieldCheck } from "lucide-react";

// Deterministic accent from card id/player so each slab feels unique without photos
function accent(seed = "") {
  const hues = ["160 84% 39%", "43 96% 56%", "199 89% 48%", "280 65% 60%", "340 82% 52%"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return hues[h % hues.length];
}

export default function CardSlab({ card, linkTo, rightSlot, footerSlot, compact = false }) {
  const hsl = accent(card.id || card.player);
  const content = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden card-border bg-[#0b1220] hairline group"
      data-testid={`card-slab-${card.id}`}
    >
      {/* Typographic slab — no photo */}
      <div className="relative aspect-[3/4] overflow-hidden"
           style={{ background: `radial-gradient(130% 80% at 50% 0%, hsl(${hsl} / 0.22), transparent 60%), linear-gradient(180deg, #0b1220 0%, #040810 100%)` }}>
        {/* grid guides */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* grade badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase bg-slate-950/80 border border-slate-800 text-slate-300 num">
            {card.grader}
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500">{card.sport}</div>
        </div>
        <div className="absolute top-3 right-3 p-1 bg-slate-950/80 border border-emerald-500/40">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
        </div>

        {/* Big grade numeral */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="anton num leading-none" style={{ fontSize: "clamp(4rem, 11vw, 8rem)", color: `hsl(${hsl})` }}>
              {card.grade}
            </div>
            <div className="mt-2 text-[10px] tracking-[0.4em] uppercase text-slate-400 font-bold">{card.grader}</div>
          </div>
        </div>

        {/* Year + corner mono */}
        <div className="absolute bottom-3 left-3 num text-xs text-slate-400">{card.year}</div>
        <div className="absolute bottom-3 right-3 num text-[10px] text-slate-500 tracking-[0.15em]">
          #{(card.id || "").slice(0, 6).toUpperCase()}
        </div>

        {card.listed_for_trade && (
          <div className="absolute top-1/2 -translate-y-1/2 -right-1 text-[9px] tracking-[0.3em] uppercase text-emerald-400 bg-emerald-950/70 border-l-2 border-emerald-500 px-1.5 py-0.5">
            Listed
          </div>
        )}
      </div>
      <div className={`${compact ? "p-3" : "p-4"}`}>
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 flex items-center justify-between">
          <span>{card.set_name?.length > 22 ? card.set_name.slice(0, 22) + "…" : card.set_name}</span>
        </div>
        <div className="mt-1 display-tight uppercase tracking-[-0.02em] text-base text-white truncate">{card.player}</div>
        <div className="mt-3 flex items-end justify-between">
          <div className="num text-lg text-white">{fmtUSD(card.est_value)}</div>
          {typeof card.market_change_24h === "number" && card.market_change_24h !== 0 && (
            <div className={`num text-xs ${card.market_change_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmtPct(card.market_change_24h)}
            </div>
          )}
          {rightSlot}
        </div>
        {card.owner_name && !compact && (
          <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate">{card.owner_name}</span>
            <span className="num text-emerald-400">★ {card.owner_reputation?.toFixed(1)}</span>
          </div>
        )}
        {footerSlot && <div className="mt-3">{footerSlot}</div>}
      </div>
    </motion.div>
  );
  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
}
