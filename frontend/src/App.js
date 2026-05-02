import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Vault from "@/pages/Vault";
import Exchange from "@/pages/Exchange";
import CardDetail from "@/pages/CardDetail";
import Trades from "@/pages/Trades";
import Portfolio from "@/pages/Portfolio";
import Match from "@/pages/Match";
import Profile from "@/pages/Profile";

function App() {
  return (
    <div className="App min-h-screen bg-background text-foreground">
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/exchange" element={<Exchange />} />
            <Route path="/exchange/:id" element={<CardDetail />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/vault" element={<RequireAuth><Vault /></RequireAuth>} />
            <Route path="/trades" element={<RequireAuth><Trades /></RequireAuth>} />
            <Route path="/portfolio" element={<RequireAuth><Portfolio /></RequireAuth>} />
            <Route path="/match" element={<RequireAuth><Match /></RequireAuth>} />
          </Routes>
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: { background: "#0b1220", border: "1px solid #1e293b", color: "#f8fafc" },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
