import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fmtUSD, fmtPct } from "../lib/api";
import { ShieldCheck } from "lucide-react";

export default function CardSlab({ card, linkTo, rightSlot, footerSlot, compact = false }) {
  const content = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden card-border bg-[#0b1220] hairline group"
      data-testid={`card-slab-${card.id}`}
    >
      <div className="relative aspect-[3/4] slab-gradient overflow-hidden">
        {card.image_url ? (
          <img src={card.image_url} alt={card.player} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050912] via-transparent to-transparent" />
        <div className="absolute top-2 left-2 px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase bg-slate-950/80 border border-slate-800 text-slate-300">
          {card.grader} {card.grade}
        </div>
        <div className="absolute top-2 right-2 p-1 bg-slate-950/80 border border-emerald-500/40">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
        </div>
        {card.listed_for_trade && (
          <div className="absolute bottom-2 left-2 text-[10px] tracking-[0.2em] uppercase text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-2 py-0.5">
            Listed
          </div>
        )}
      </div>
      <div className={`p-3 ${compact ? "" : "p-4"}`}>
        <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 flex items-center justify-between">
          <span>{card.sport}</span>
          <span>{card.year}</span>
        </div>
        <div className="mt-1 font-serif text-lg leading-tight text-white truncate">{card.player}</div>
        <div className="text-xs text-slate-400 truncate">{card.set_name}</div>
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
