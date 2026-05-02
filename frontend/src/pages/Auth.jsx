import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
  const [form, setForm] = useState({ email: "", password: "", display_name: "" });
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.email, form.password, form.display_name || form.email.split("@")[0]);
      toast.success("Welcome to Slabby");
      nav("/vault");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Authentication failed");
    } finally { setBusy(false); }
  };

  const prefill = () => setForm({ email: "demo@slabby.com", password: "slabby123", display_name: "" });

  const fieldCls = "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:outline-none px-3 py-3 text-sm text-white placeholder:text-slate-600";
  const labelCls = "text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-1 block";

  return (
    <div className="min-h-[80vh] grid lg:grid-cols-2 relative overflow-hidden">
      <div className="relative hidden lg:block border-r border-slate-900 slab-gradient">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#050912]/60 via-transparent to-[#050912]" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <div>
            <div className="font-serif text-3xl">Slabby</div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400 mt-1">Exchange · Vault · Credit</div>
          </div>
          <div className="max-w-md">
            <div className="font-serif text-3xl leading-tight">
              "Treat cards <br/>like an asset class."
            </div>
            <div className="mt-4 text-sm text-slate-400">
              The first institutional exchange for graded sports cards. Instant vault-to-vault settlement. AI-verified fairness. Collateralized credit.
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:p-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">{mode === "login" ? "Access your vault" : "Open an account"}</div>
          <h1 className="mt-2 font-serif text-4xl">{mode === "login" ? "Sign in" : "Create account"}</h1>

          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="auth-form">
            {mode === "register" && (
              <div>
                <label className={labelCls}>Display name</label>
                <input data-testid="auth-name-input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className={fieldCls} placeholder="e.g. Alex Vance" />
              </div>
            )}
            <div>
              <label className={labelCls}>Email</label>
              <input data-testid="auth-email-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldCls} placeholder="you@firm.com" />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input data-testid="auth-password-input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={fieldCls} placeholder="••••••••" />
            </div>
            <button type="submit" data-testid="auth-submit-btn" disabled={busy} className="w-full bg-white text-slate-950 hover:bg-slate-200 py-3 text-sm font-medium rounded-sm disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <button data-testid="toggle-auth-mode" onClick={() => setMode(mode === "login" ? "register" : "login")} className="hover:text-white">
              {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign in"}
            </button>
            <button data-testid="use-demo-btn" onClick={prefill} className="hover:text-emerald-400">Use demo account</button>
          </div>
          <div className="mt-10 text-[11px] text-slate-600 border-t border-slate-900 pt-4 leading-relaxed">
            By continuing you agree Slabby may hold your graded cards in institutional custody under insured chain-of-custody controls.
          </div>
          <Link to="/" className="mt-6 inline-block text-xs text-slate-500 hover:text-white">← Back</Link>
        </motion.div>
      </div>
    </div>
  );
}
