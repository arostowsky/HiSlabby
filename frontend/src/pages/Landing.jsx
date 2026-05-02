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
              <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-[#d4ff00] border border-[#d4ff00]/40 bg-[#d4ff00]/5 px-3 py-1">
                <span className="h-1.5 w-1.5 bg-[#d4ff00] rounded-full animate-pulse" /> Live · invite waitlist
              </div>
              <h1 className="mt-6 display-tight uppercase italic text-white" style={{ fontSize: "clamp(3.25rem, 9vw, 8rem)" }}>
                Trade slabs<br/>
                <span className="text-[#d4ff00]">like assets.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base text-slate-300 leading-relaxed">
                Slabby is the institutional-grade exchange, vault, and credit line for graded sports cards $250+.
                Card-for-card. Card + cash. Instant vault-to-vault settlement — zero shipping.
                <span className="text-white"> StockX speed. Schwab trust.</span>
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to={cta} data-testid="hero-cta-primary" className="bg-[#d4ff00] text-slate-950 hover:bg-[#bfe800] text-sm font-bold uppercase tracking-wider px-7 py-3.5 rounded-sm flex items-center gap-2">
                  Open vault <span>→</span>
                </Link>
                <Link to="/exchange" data-testid="hero-cta-secondary" className="border border-slate-700 hover:border-white text-sm uppercase tracking-wider px-7 py-3.5 rounded-sm text-white font-semibold">
                  View exchange
                </Link>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-5 mt-16 lg:mt-0">
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="relative border border-slate-800 bg-[#0b1220]/80 hairline overflow-hidden">
              <div className="relative aspect-[4/5] slab-gradient">
                <div className="absolute inset-0 opacity-[0.08]" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
                  backgroundSize: '48px 48px'
                }} />
                <div className="absolute inset-0 p-8 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] tracking-[0.3em] uppercase text-[#d4ff00]">Vault · Ledger</div>
                    <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 num">0x9F4C…A271</div>
                  </div>
                  <div className="mt-10 display-tight num text-white" style={{ fontSize: "clamp(3rem, 6.5vw, 5.5rem)" }}>$284,712</div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                    <span>42 SLABS</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span>3 SPORTS</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span>PSA · BGS</span>
                    <span className="ml-auto num text-[#d4ff00] font-bold">+4.82% 30D</span>
                  </div>
                  <div className="mt-auto">
                    <svg viewBox="0 0 200 60" className="w-full h-20">
                      <defs>
                        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d4ff00" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#d4ff00" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,48 L20,44 L40,40 L60,45 L80,32 L100,28 L120,34 L140,20 L160,23 L180,12 L200,8 L200,60 L0,60 Z" fill="url(#lg)" />
                      <polyline fill="none" stroke="#d4ff00" strokeWidth="1.4"
                        points="0,48 20,44 40,40 60,45 80,32 100,28 120,34 140,20 160,23 180,12 200,8" />
                    </svg>
                    <div className="mt-3 grid grid-cols-3 border-t border-slate-800 text-[10px] tracking-[0.2em] uppercase">
                      <div className="py-3 border-r border-slate-800"><div className="text-slate-500">Listed</div><div className="mt-1 text-[#d4ff00] num normal-case font-bold">12</div></div>
                      <div className="py-3 border-r border-slate-800 pl-3"><div className="text-slate-500">P&amp;L 30D</div><div className="mt-1 text-white num normal-case">+$13,148</div></div>
                      <div className="py-3 pl-3"><div className="text-slate-500">LTV cap</div><div className="mt-1 text-white num normal-case">50%</div></div>
                    </div>
                  </div>
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
                <div className="display-tight text-4xl text-white num">{s.k}</div>
                <div className="mt-2 text-xs text-slate-500 tracking-[0.15em] uppercase">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#d4ff00]">The stack</div>
          <h2 className="mt-3 display-tight uppercase italic" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}>Six rails.<br/>One asset class.</h2>
          <p className="mt-4 text-slate-400 max-w-xl">Built for serious capital — collectors, dealers, and portfolio investors operating in cards from $250 to $250K.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-900">
          {FEATURES.map(({ icon: I, title, body }) => (
            <div key={title} className="bg-[#050912] p-8 hover:bg-[#0b1220] transition-colors">
              <I className="h-5 w-5 text-[#d4ff00]" />
              <h3 className="mt-5 display-tight uppercase text-xl text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24 border-t border-slate-900">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="display-tight uppercase italic" style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}>The terminal<br/><span className="text-[#d4ff00]">for slabs.</span></h2>
            <p className="mt-6 text-slate-400 max-w-lg">Portfolio-grade analytics. Institutional custody. AI-verified trades. Collateralized credit. Everything the modern card investor has been forced to stitch together — now one platform.</p>
            <Link to={cta} data-testid="footer-cta" className="mt-8 inline-flex items-center gap-2 bg-[#d4ff00] text-slate-950 hover:bg-[#bfe800] text-sm font-bold uppercase tracking-wider px-7 py-3.5 rounded-sm">
              Request access →
            </Link>
          </div>
          <div className="border border-slate-800 p-8 bg-[#0b1220]">
            <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">Sample · Fair Trade Score</div>
            <div className="mt-3 flex items-baseline gap-4">
              <div className="display-tight text-7xl text-[#d4ff00] num">87</div>
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
