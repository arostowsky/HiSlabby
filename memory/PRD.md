# Slabby — PRD

## Original Problem Statement
Build a venture-scale business plan, product requirements document, and startup roadmap for SlabX — a premium exchange, vault, and credit platform for graded sports cards and collectibles ($250+). Combines (1) Card Exchange with AI-powered trade matching and Fair Trade valuation, (2) Digital Vault / Custody with instant vault-to-vault settlement, (3) Card-Backed Credit Line (Phase 2). Vision: "Schwab meets StockX for collectibles." Target: serious collectors, dealers, high-end investors.

User chose:
- **Deliverable**: functional MVP web app
- **Brand name**: Slabby
- **Design**: Schwab-meets-StockX institutional (navy, serif, data-dense)
- **AI**: Claude Sonnet 4.5 for Fair Trade Score and AI Trade Matching

## Architecture
- **Backend**: FastAPI + MongoDB (motor) + JWT auth + bcrypt + emergentintegrations (Claude Sonnet 4.5)
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + framer-motion + recharts + react-fast-marquee
- **Fonts**: Playfair Display (headings) / Outfit (body) / IBM Plex Mono (data)

## User Personas
1. **Serious Collector** — holds 10-100 graded cards $500-$50K, wants to trade without shipping risk
2. **Card Dealer** — holds inventory, needs liquidity, needs portfolio analytics
3. **High-End Investor** — treats cards as asset class, wants mark-to-market and future credit line

## What's Been Implemented (v0.1 — Feb 2026)
- JWT auth (register/login/me), bcrypt hashing, route protection
- Digital Vault: add cards ($250 minimum), list/unlist on exchange
- Exchange: order-book and grid views, sport filter, live per-seller reputation
- Card detail with comps (AI-generated) and offer builder (cards + cash)
- AI Fair Trade Score via Claude Sonnet 4.5 (0-100 + verdict + reasoning + value deltas)
- AI Trade Matching — ranked trade candidates for any owned card
- Trade inbox — accept/reject with instant vault-to-vault ownership swap; auto-cancels stale offers
- Portfolio analytics — total MTM, 30-day P&L, allocation pie (by sport), area chart
- Ticker with live price/change display
- Auto-seeded demo data (2 users, 12 cards) on first run
- Dark institutional theme — navy ink background, emerald accent, grain/glass/hairline details

## Core Requirements (static)
- Minimum card value $250
- Vault custody as default (ownership = vault registry entry)
- Escrow-first trading (no shipping during MVP; ownership swap is the "shipment")
- Reputation persisted and displayed on every listing
- AI evaluations must degrade gracefully to heuristic fallback on LLM failure

## Prioritized Backlog

### P0 — Immediate polish
- Counter-offer flow in Trades inbox (reject+counter)
- Market comps caching (currently regenerated each click)
- Search by player name in Exchange
- Seed idempotency for more demo listings

### P1 — Phase 2 (Credit)
- Card-Backed Credit Line: LTV calculator, line origination, interest accrual
- Trade-up financing: "finance the gap" button in offer builder
- Dealer inventory financing

### P2 — Phase 3
- Fractional ownership / index products tied to cards
- Instant liquidity pools
- Prime brokerage dashboard (per-dealer P&L, positioning)
- Full KYC/AML onboarding for secured lending (regulatory)
- Real comp-data integration (PWCC, Goldin, eBay sold)
- Real insurance underwriting
- Mobile apps

## Business Model (for investor narrative)
- Exchange fees (bps on trade value)
- Vault storage fees (monthly per slab)
- Authentication / intake fees
- Premium subscription (analytics + early listings)
- Lending spread (Phase 2)
- Dealer financing origination + spread
- Market data API subscription

## Next Tasks
1. Counter-offer workflow
2. Comps caching
3. Exchange search
4. Phase 2 LTV module
