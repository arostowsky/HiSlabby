import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Vault, ArrowLeftRight, LineChart, Sparkles, Inbox, LogOut, Menu } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "./ui/dropdown-menu";

const NAV = [
  { to: "/vault", label: "Vault", icon: Vault },
  { to: "/exchange", label: "Exchange", icon: ArrowLeftRight },
  { to: "/match", label: "AI Match", icon: Sparkles },
  { to: "/trades", label: "Trades", icon: Inbox },
  { to: "/portfolio", label: "Portfolio", icon: LineChart },
];

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="glass sticky top-0 z-40 border-b border-white/5" data-testid="app-header">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to={user ? "/vault" : "/"} className="flex items-center gap-2.5 group" data-testid="brand-home-link">
          <div className="h-7 w-7 rounded-sm bg-[#d4ff00] grid place-items-center">
            <div className="h-3 w-1 bg-slate-950 skew-x-[-12deg]" />
          </div>
          <span className="display-tight text-[26px] italic tracking-[-0.04em] text-white">SLABBY<span className="text-[#d4ff00]">.</span></span>
          <span className="hidden sm:inline text-[10px] tracking-[0.3em] uppercase text-slate-500 ml-2 border-l border-slate-800 pl-3">EXCHANGE / VAULT</span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to} to={to}
                data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm tracking-tight transition-colors rounded-sm flex items-center gap-1.5 ${
                    isActive ? "text-white bg-white/5" : "text-slate-400 hover:text-white"
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-trigger" className="flex items-center gap-2 text-sm text-slate-300 hover:text-white">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 grid place-items-center text-xs font-mono">
                    {user.display_name?.split(" ").map(s => s[0]).join("").slice(0,2)}
                  </div>
                  <span className="hidden sm:inline">{user.display_name}</span>
                  <Menu className="md:hidden h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800 text-slate-200 min-w-[220px]">
                <div className="px-2 py-2 text-xs text-slate-500">
                  <div className="truncate">{user.email}</div>
                  <div className="mt-1 flex gap-3">
                    <span>Rep <span className="text-emerald-400 num">{user.reputation_score?.toFixed(1)}</span></span>
                    <span>Trades <span className="text-white num">{user.trades_completed}</span></span>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-800" />
                {NAV.map(({to, label}) => (
                  <DropdownMenuItem key={to} onClick={() => nav(to)} className="md:hidden cursor-pointer focus:bg-slate-800 focus:text-white">{label}</DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => nav(`/profile/${user.id}`)} className="cursor-pointer focus:bg-slate-800 focus:text-white" data-testid="menu-profile">My profile</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem onClick={() => { logout(); nav("/"); }} className="cursor-pointer focus:bg-slate-800 focus:text-white" data-testid="menu-logout">
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth" data-testid="header-signin" className="text-sm text-slate-300 hover:text-white">Sign in</Link>
              <Link to="/auth?mode=register" data-testid="header-get-started" className="text-sm bg-white text-slate-950 hover:bg-slate-200 px-4 py-1.5 rounded-sm font-medium">Get access</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
