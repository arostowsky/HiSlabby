import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Loader2 } from "lucide-react";

const SPORTS = ["Baseball", "Basketball", "Football", "Hockey", "Soccer", "Other"];
const GRADERS = ["PSA", "BGS", "SGC", "CGC"];
const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1642692704110-1bcf24bb5689?crop=entropy&cs=srgb&fm=jpg&w=800",
  "https://images.unsplash.com/photo-1642692704112-80f6ba7f6aa3?crop=entropy&cs=srgb&fm=jpg&w=800",
  "https://images.unsplash.com/photo-1609358905581-e5381612486e?crop=entropy&cs=srgb&fm=jpg&w=800",
];

export default function AddCardDialog({ open, onOpenChange, onAdded }) {
  const [form, setForm] = useState({
    player: "", year: new Date().getFullYear() - 5, set_name: "",
    grader: "PSA", grade: 10, sport: "Basketball", est_value: 500,
    image_url: SAMPLE_IMAGES[0], listed_for_trade: false, accepting_cash: true, listing_note: ""
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.est_value < 250) { toast.error("Minimum vaulted value is $250."); return; }
    setSaving(true);
    try {
      const r = await api.post("/cards", { ...form, grade: Number(form.grade), year: Number(form.year), est_value: Number(form.est_value) });
      toast.success("Card vaulted.");
      onAdded?.(r.data);
      onOpenChange(false);
      setForm({ ...form, player: "", set_name: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to vault card");
    } finally { setSaving(false); }
  };

  const fieldCls = "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:outline-none px-3 py-2 text-sm text-white placeholder:text-slate-600";
  const labelCls = "text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-1 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0b1220] border-slate-800 text-white max-w-2xl" data-testid="add-card-dialog">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Vault a Card</DialogTitle>
          <p className="text-xs text-slate-500">Graded cards $250+ only. Once vaulted, your card is trade-ready.</p>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4 mt-2">
          <div className="col-span-2">
            <label className={labelCls}>Player</label>
            <input data-testid="card-player-input" required value={form.player} onChange={(e) => set("player", e.target.value)} className={fieldCls} placeholder="e.g. Mike Trout" />
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <input data-testid="card-year-input" type="number" required value={form.year} onChange={(e) => set("year", e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Sport</label>
            <select data-testid="card-sport-input" value={form.sport} onChange={(e) => set("sport", e.target.value)} className={fieldCls}>
              {SPORTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Set</label>
            <input data-testid="card-set-input" required value={form.set_name} onChange={(e) => set("set_name", e.target.value)} className={fieldCls} placeholder="e.g. Topps Chrome Refractor" />
          </div>
          <div>
            <label className={labelCls}>Grader</label>
            <select data-testid="card-grader-input" value={form.grader} onChange={(e) => set("grader", e.target.value)} className={fieldCls}>
              {GRADERS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Grade</label>
            <input data-testid="card-grade-input" type="number" step="0.5" min="1" max="10" value={form.grade} onChange={(e) => set("grade", e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Est. Value (USD)</label>
            <input data-testid="card-value-input" type="number" min="250" value={form.est_value} onChange={(e) => set("est_value", e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Slab Image</label>
            <select data-testid="card-image-input" value={form.image_url} onChange={(e) => set("image_url", e.target.value)} className={fieldCls}>
              {SAMPLE_IMAGES.map((u, i) => <option key={u} value={u}>Preset {i+1}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" data-testid="card-listed-toggle" checked={form.listed_for_trade} onChange={(e) => set("listed_for_trade", e.target.checked)} className="accent-emerald-500" />
              List immediately on Exchange
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.accepting_cash} onChange={(e) => set("accepting_cash", e.target.checked)} className="accent-emerald-500" />
              Accept card+cash offers
            </label>
          </div>
          {form.listed_for_trade && (
            <div className="col-span-2">
              <label className={labelCls}>Listing note (what you're seeking)</label>
              <input value={form.listing_note} onChange={(e) => set("listing_note", e.target.value)} className={fieldCls} placeholder="e.g. Open to modern rookie RCs" />
            </div>
          )}
          <div className="col-span-2 flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} data-testid="submit-add-card-btn" className="px-5 py-2 text-sm bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-60 rounded-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vault card"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
