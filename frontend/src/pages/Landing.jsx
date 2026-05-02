import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRightLeft, Landmark, TrendingUp, Sparkles, Lock } from "lucide-react";
import Ticker from "../components/Ticker";
import { useAuth } from "../lib/auth";

const FEATURES = [
  { icon: ShieldCheck, title: "Institutional Vault", body: "Insured custody of graded cards $250+. Chain of custody, immutable intake audit, and cryptographic slab receipts." },
  { icon: ArrowRightLeft, title: "Vault-to-Vault Settlement", body: "Instant ownership transfer without shipping. Trades settle in seconds — not two-week USPS purgatory." },
  { icon: Sparkles, title: "Fair Trade Score", body: "Every proposed trade is evaluated by Claude-powered valuation AI. 0–100 fairness, comp-backed reasoning." },
  { icon: Landmark, title: "Card-Backed Credit", body: "Phase 2: Revolving lines of credit against your vaulted collection. Finance the gap on your next grail." },
  { icon: TrendingUp, title: "Portfolio Analytics", body: "Mark-to-market valuation, 30-day P&L, allocation by sport and era. Treat cards like the asset class they are." },
  { icon: Lock, title: "Escrow-First Exchange", body: "No ghosted shipments, no mail theft, no scammed packages. Every trade is escrowed at the vault layer." },
];

const STATS = [
  { k: "$47B", v: "2024 graded card market TAM" },
  { k: "$250+", v: "Minimum vaulted value" },
  { k: "24/7", v: "Global exchange, always open" },
  { k: "0", v: "Shipments required to trade" },
];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? "/vault" : "/auth?mode=register";

  return (
    <div className="min-h-screen">
      <Ticker />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 slab-gradient" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }} />
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 pt-20 pb-24 lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-emerald-400 border border-emerald-500/40 bg-emerald-500/5 px-3 py-1">
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" /> Now open · Invite waitlist
              </div>
              <h1 className="mt-6 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                Financial infrastructure <br/>
                <span className="italic text-slate-400">for collectibles.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base text-slate-300 leading-relaxed">
                Slabby is the institutional exchange, vault, and credit line for graded sports cards.
                Trade card-for-card. Borrow against your portfolio. Settle instantly, vault to vault.
                Schwab meets StockX — for the asset class Wall Street forgot.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to={cta} data-testid="hero-cta-primary" className="bg-white text-slate-950 hover:bg-slate-200 text-sm font-medium px-6 py-3 rounded-sm flex items-center gap-2">
                  Open a vault account <span className="text-slate-500">→</span>
                </Link>
                <Link to="/exchange" data-testid="hero-cta-secondary" className="border border-slate-700 hover:border-slate-500 text-sm px-6 py-3 rounded-sm text-slate-200">
                  View the Exchange
                </Link>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-5 mt-16 lg:mt-0">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="relative border border-slate-800 bg-[#0b1220]/80 hairline overflow-hidden">
              <img src="https://images.unsplash.com/photo-1609358905581-e5381612486e?crop=entropy&cs=srgb&fm=jpg&w=900"
                   alt="Vault" className="w-full aspect-[4/5] object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050912] via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="text-[10px] tracking-[0.25em] uppercase text-emerald-400">Vault · MTM</div>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <div className="num text-3xl text-white">$284,712</div>
                    <div className="text-xs text-slate-400 mt-1">42 slabs · 3 sports · PSA/BGS</div>
                  </div>
                  <div className="num text-emerald-400 text-sm">+4.82% 30D</div>
                </div>
                <div className="mt-4 h-10 relative">
                  <svg viewBox="0 0 200 40" className="w-full h-full">
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.5"
                      points="0,30 20,27 40,25 60,28 80,20 100,18 120,22 140,15 160,17 180,10 200,8" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* STATS */}
        <div className="relative border-t border-slate-900 bg-slate-950/50">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-900">
            {STATS.map((s) => (
              <div key={s.k} className="px-6 py-8">
                <div className="font-serif text-3xl text-white num">{s.k}</div>
                <div className="mt-1 text-xs text-slate-500 tracking-[0.15em] uppercase">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400">Primitives</div>
          <h2 className="mt-3 font-serif text-4xl lg:text-5xl leading-tight">Six rails. One asset class.</h2>
          <p className="mt-4 text-slate-400">Every line of Slabby is designed for serious capital — collectors, dealers, and portfolio investors operating in cards at the $250-to-$250K level.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-900">
          {FEATURES.map(({ icon: I, title, body }) => (
            <div key={title} className="bg-[#050912] p-8 hover:bg-[#0b1220] transition-colors">
              <I className="h-5 w-5 text-emerald-400" />
              <h3 className="mt-5 font-serif text-xl">{title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24 border-t border-slate-900">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-serif text-4xl lg:text-5xl">The Bloomberg terminal <br/><em className="text-slate-500">for collectibles.</em></h2>
            <p className="mt-6 text-slate-400 max-w-lg">Portfolio-grade analytics. Institutional custody. AI-verified trades. Collateralized credit. Everything the modern card investor has been forced to stitch together — now one platform.</p>
            <Link to={cta} data-testid="footer-cta" className="mt-8 inline-flex items-center gap-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-sm font-medium px-6 py-3 rounded-sm">
              Request vault access →
            </Link>
          </div>
          <div className="border border-slate-800 p-8 bg-[#0b1220]">
            <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">Sample Fair Trade Score</div>
            <div className="mt-3 flex items-baseline gap-4">
              <div className="font-serif text-6xl text-emerald-400 num">87</div>
              <div className="text-xs text-slate-400 uppercase tracking-[0.2em]">Fair · parity +2.1%</div>
            </div>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              "Offered bundle of two PSA 10 modern RCs clears parity on nominal value. Mahomes + Luka pairing offsets Jordan '86 Fleer grade premium within 2% — recommended accept."
            </p>
            <div className="mt-5 text-[10px] tracking-[0.25em] uppercase text-slate-500">Powered by Claude Sonnet 4.5</div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600">
        Slabby is a demo product. Not financial advice. © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
