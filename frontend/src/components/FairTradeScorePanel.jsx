import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import { fmtUSD } from "../lib/api";

function scoreColor(s) {
  if (s == null) return "text-slate-400";
  if (s >= 80) return "text-[#d4ff00]";
  if (s >= 60) return "text-amber-400";
  return "text-red-400";
}
function scoreBand(s) {
  if (s == null) return { label: "—", bg: "bg-slate-800" };
  if (s >= 80) return { label: "Fair", bg: "bg-[#d4ff00]/10 border-[#d4ff00]/50" };
  if (s >= 60) return { label: "Workable", bg: "bg-amber-500/10 border-amber-500/40" };
  return { label: "Unfair", bg: "bg-red-500/10 border-red-500/40" };
}

export default function FairTradeScorePanel({ data, loading, onCompute, compact = false }) {
  const band = scoreBand(data?.score);
  return (
    <div className={`border border-slate-800 bg-slate-950/60 ${compact ? "p-4" : "p-6"}`} data-testid="fair-trade-score-panel">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">Fair Trade Score</div>
          <div className="font-bold text-xl mt-1 text-white flex items-center gap-2 uppercase tracking-tight">
            <Sparkles className="h-4 w-4 text-[#d4ff00]" />
            Fair Trade · AI
          </div>
        </div>
        {onCompute && (
          <button
            onClick={onCompute}
            disabled={loading}
            data-testid="compute-fair-score-btn"
            className="text-xs px-3 py-1.5 bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-60 rounded-sm"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Compute"}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-6 py-10 flex flex-col items-center text-slate-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs tracking-[0.2em] uppercase">Evaluating trade...</span>
          </motion.div>
        ) : data ? (
          <motion.div key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mt-6 flex items-center gap-6">
              <div className={`anton num leading-none ${scoreColor(data.score)}`} style={{ fontSize: "clamp(5rem, 9vw, 8rem)" }} data-testid="fair-trade-score-value">
                {data.score}
              </div>
              <div className="flex-1">
                <div className={`inline-block text-[10px] tracking-[0.25em] uppercase border px-2 py-1 ${band.bg}`}>
                  {band.label} · {data.verdict}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500 uppercase tracking-[0.15em] text-[10px]">Offered</div>
                    <div className="num text-white">{fmtUSD(data.offered_value)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 uppercase tracking-[0.15em] text-[10px]">Target</div>
                    <div className="num text-white">{fmtUSD(data.target_value)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 uppercase tracking-[0.15em] text-[10px]">Delta</div>
                    <div className={`num ${data.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {data.delta >= 0 ? "+" : ""}{fmtUSD(data.delta)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-300 border-t border-slate-900 pt-4">
              {data.reasoning}
            </p>
          </motion.div>
        ) : (
          <motion.div key="e" className="mt-6 text-sm text-slate-500">
            Submit a trade composition to receive an institutional-grade fairness evaluation.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
