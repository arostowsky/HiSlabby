import React, { useEffect, useState } from "react";
import { api, fmtUSD, fmtPct } from "../lib/api";
import CardSlab from "../components/CardSlab";
import AddCardDialog from "../components/AddCardDialog";
import { motion } from "framer-motion";
import { Plus, ShieldCheck, Loader2 } from "lucide-react";
import Ticker from "../components/Ticker";
import { toast } from "sonner";

export default function Vault() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/cards/mine")
      .then((r) => setCards(r.data))
      .catch(() => toast.error("Failed to load vault"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (c) => {
    try {
      const r = await api.patch(`/cards/${c.id}`, { listed_for_trade: !c.listed_for_trade });
      setCards((cs) => cs.map((x) => x.id === c.id ? r.data : x));
      toast.success(r.data.listed_for_trade ? "Listed on Exchange" : "Unlisted");
    } catch { toast.error("Failed"); }
  };

  const total = cards.reduce((s, c) => s + (c.est_value || 0), 0);
  const listed = cards.filter(c => c.listed_for_trade).length;

  return (
    <div>
      <Ticker />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Institutional Custody
            </div>
            <h1 className="mt-2 display-tight uppercase italic text-5xl lg:text-7xl">Your Vault.</h1>
            <div className="mt-3 text-sm text-slate-400">Graded slabs in secure Slabby custody. Ready for vault-to-vault settlement.</div>
          </div>
          <div className="flex items-center gap-10">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">MTM Value</div>
              <div className="num text-2xl text-white">{fmtUSD(total)}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">Slabs</div>
              <div className="num text-2xl text-white">{cards.length}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500">Listed</div>
              <div className="num text-2xl text-emerald-400">{listed}</div>
            </div>
            <button data-testid="open-add-card-btn" onClick={() => setOpen(true)} className="bg-white text-slate-950 hover:bg-slate-200 text-sm px-4 py-2 rounded-sm flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Vault a card
            </button>
          </div>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="py-24 flex justify-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : cards.length === 0 ? (
            <div className="border border-dashed border-slate-800 p-16 text-center">
              <div className="font-serif text-2xl">Your vault is empty</div>
              <p className="mt-2 text-sm text-slate-500">Add your first graded slab to start trading.</p>
              <button data-testid="empty-vault-add-btn" onClick={() => setOpen(true)} className="mt-6 bg-white text-slate-950 hover:bg-slate-200 text-sm px-5 py-2.5 rounded-sm">Vault a card</button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5" data-testid="vault-grid">
              {cards.map((c) => (
                <CardSlab key={c.id} card={c}
                  footerSlot={
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => { e.preventDefault(); toggle(c); }}
                        data-testid={`vault-toggle-list-${c.id}`}
                        className={`text-[10px] tracking-[0.2em] uppercase px-2 py-1 border ${c.listed_for_trade ? "border-emerald-500/40 text-emerald-400" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                      >
                        {c.listed_for_trade ? "Unlist" : "List for trade"}
                      </button>
                    </div>
                  }
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <AddCardDialog open={open} onOpenChange={setOpen} onAdded={(c) => setCards((cs) => [c, ...cs])} />
    </div>
  );
}
