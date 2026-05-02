"""Slabby — premium exchange, vault, and credit platform for graded sports cards.

Backend: FastAPI + MongoDB + JWT auth + Claude Sonnet 4.5 (Fair Trade Score, AI Match, Comps).
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import uuid
import json
import logging
import asyncio
import jwt

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret')
JWT_ALG = 'HS256'
JWT_EXP_DAYS = 30

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Slabby API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
log = logging.getLogger("slabby")

# =========================
# MODELS
# =========================

class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    reputation_score: float = 5.0
    trades_completed: int = 0
    created_at: datetime

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    display_name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    token: str
    user: UserOut

class CardIn(BaseModel):
    player: str
    year: int
    set_name: str
    grader: Literal["PSA", "BGS", "SGC", "CGC"]
    grade: float
    sport: Literal["Baseball", "Basketball", "Football", "Hockey", "Soccer", "Other"]
    est_value: float
    image_url: Optional[str] = None
    listed_for_trade: bool = False
    listing_note: Optional[str] = None
    accepting_cash: bool = True

class CardOut(CardIn):
    id: str
    owner_id: str
    owner_name: Optional[str] = None
    owner_reputation: Optional[float] = None
    market_change_24h: float = 0.0  # percent
    vaulted_at: datetime

class CardPatch(BaseModel):
    listed_for_trade: Optional[bool] = None
    listing_note: Optional[str] = None
    accepting_cash: Optional[bool] = None
    est_value: Optional[float] = None

class TradeIn(BaseModel):
    target_card_id: str            # card I want
    offered_card_ids: List[str] = []  # my cards I'm offering
    cash_amount: float = 0.0       # positive = initiator pays additional cash

class TradeOut(BaseModel):
    id: str
    initiator_id: str
    initiator_name: str
    recipient_id: str
    recipient_name: str
    target_card_id: str
    target_card: Optional[CardOut] = None
    offered_card_ids: List[str]
    offered_cards: List[CardOut] = []
    cash_amount: float
    status: Literal["pending", "accepted", "rejected", "settled", "cancelled"]
    fair_trade_score: Optional[int] = None
    fair_trade_reasoning: Optional[str] = None
    created_at: datetime
    settled_at: Optional[datetime] = None

class FairScoreOut(BaseModel):
    score: int
    verdict: str
    reasoning: str
    offered_value: float
    target_value: float
    delta: float

class MatchOut(BaseModel):
    card: CardOut
    match_score: int
    rationale: str

class CompsOut(BaseModel):
    card_id: str
    comps: List[dict]
    average: float
    median: float
    summary: str

# =========================
# HELPERS
# =========================

def _now():
    return datetime.now(timezone.utc)

def _iso(dt):
    return dt.isoformat() if isinstance(dt, datetime) else dt

def _parse_dt(v):
    if isinstance(v, str):
        try:
            return datetime.fromisoformat(v)
        except Exception:
            return _now()
    return v or _now()

def _user_out(doc) -> UserOut:
    return UserOut(
        id=doc['id'],
        email=doc['email'],
        display_name=doc['display_name'],
        avatar_url=doc.get('avatar_url'),
        reputation_score=doc.get('reputation_score', 5.0),
        trades_completed=doc.get('trades_completed', 0),
        created_at=_parse_dt(doc.get('created_at')),
    )

async def _card_out(doc) -> CardOut:
    owner = await db.users.find_one({"id": doc['owner_id']}, {"_id": 0, "display_name": 1, "reputation_score": 1})
    return CardOut(
        id=doc['id'],
        owner_id=doc['owner_id'],
        owner_name=(owner or {}).get('display_name'),
        owner_reputation=(owner or {}).get('reputation_score', 5.0),
        player=doc['player'],
        year=doc['year'],
        set_name=doc['set_name'],
        grader=doc['grader'],
        grade=doc['grade'],
        sport=doc['sport'],
        est_value=doc['est_value'],
        image_url=doc.get('image_url'),
        listed_for_trade=doc.get('listed_for_trade', False),
        listing_note=doc.get('listing_note'),
        accepting_cash=doc.get('accepting_cash', True),
        market_change_24h=doc.get('market_change_24h', 0.0),
        vaulted_at=_parse_dt(doc.get('vaulted_at')),
    )

def _make_token(uid: str) -> str:
    payload = {"sub": uid, "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": uid}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# =========================
# AUTH
# =========================

@api.post("/auth/register", response_model=TokenOut)
async def register(inp: RegisterIn):
    existing = await db.users.find_one({"email": inp.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "email": inp.email.lower(),
        "password_hash": pwd.hash(inp.password),
        "display_name": inp.display_name,
        "avatar_url": None,
        "reputation_score": 5.0,
        "trades_completed": 0,
        "created_at": _now().isoformat(),
    }
    await db.users.insert_one(doc)
    return TokenOut(token=_make_token(uid), user=_user_out(doc))

@api.post("/auth/login", response_model=TokenOut)
async def login(inp: LoginIn):
    doc = await db.users.find_one({"email": inp.email.lower()}, {"_id": 0})
    if not doc or not pwd.verify(inp.password, doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenOut(token=_make_token(doc['id']), user=_user_out(doc))

@api.get("/auth/me", response_model=UserOut)
async def me(user=Depends(current_user)):
    return _user_out(user)

# =========================
# CARDS / VAULT
# =========================

@api.get("/cards/mine", response_model=List[CardOut])
async def my_cards(user=Depends(current_user)):
    docs = await db.cards.find({"owner_id": user['id']}, {"_id": 0}).sort("vaulted_at", -1).to_list(500)
    return [await _card_out(d) for d in docs]

@api.post("/cards", response_model=CardOut)
async def add_card(inp: CardIn, user=Depends(current_user)):
    if inp.est_value < 250:
        raise HTTPException(status_code=400, detail="Minimum card value is $250")
    cid = str(uuid.uuid4())
    doc = inp.model_dump()
    doc.update({
        "id": cid,
        "owner_id": user['id'],
        "vaulted_at": _now().isoformat(),
        "market_change_24h": 0.0,
    })
    await db.cards.insert_one(doc)
    return await _card_out(doc)

@api.get("/cards/listings", response_model=List[CardOut])
async def listings(sport: Optional[str] = None, min_val: Optional[float] = None, max_val: Optional[float] = None):
    q = {"listed_for_trade": True}
    if sport:
        q["sport"] = sport
    if min_val is not None or max_val is not None:
        q["est_value"] = {}
        if min_val is not None:
            q["est_value"]["$gte"] = min_val
        if max_val is not None:
            q["est_value"]["$lte"] = max_val
    docs = await db.cards.find(q, {"_id": 0}).sort("est_value", -1).to_list(500)
    return [await _card_out(d) for d in docs]

@api.get("/cards/{card_id}", response_model=CardOut)
async def get_card(card_id: str):
    doc = await db.cards.find_one({"id": card_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Card not found")
    return await _card_out(doc)

@api.patch("/cards/{card_id}", response_model=CardOut)
async def patch_card(card_id: str, patch: CardPatch, user=Depends(current_user)):
    doc = await db.cards.find_one({"id": card_id}, {"_id": 0})
    if not doc or doc['owner_id'] != user['id']:
        raise HTTPException(status_code=404, detail="Card not found")
    updates = {k: v for k, v in patch.model_dump(exclude_unset=True).items() if v is not None}
    if updates:
        await db.cards.update_one({"id": card_id}, {"$set": updates})
        doc.update(updates)
    return await _card_out(doc)

# =========================
# PORTFOLIO
# =========================

@api.get("/portfolio/analytics")
async def portfolio_analytics(user=Depends(current_user)):
    docs = await db.cards.find({"owner_id": user['id']}, {"_id": 0}).to_list(500)
    total = sum(d.get('est_value', 0) for d in docs)
    by_sport = {}
    by_grader = {}
    for d in docs:
        by_sport[d['sport']] = by_sport.get(d['sport'], 0) + d.get('est_value', 0)
        by_grader[d['grader']] = by_grader.get(d['grader'], 0) + 1
    # Mock 30-day history ramping to current total
    history = []
    import random
    random.seed(user['id'])
    base = total * 0.85 if total else 0
    for i in range(30):
        v = base + (total - base) * (i / 29.0) + random.uniform(-0.02, 0.02) * total
        history.append({"day": i, "value": round(max(v, 0), 2)})
    pnl_30d = round(total - (history[0]['value'] if history else 0), 2)
    pnl_pct = round((pnl_30d / history[0]['value']) * 100, 2) if history and history[0]['value'] else 0.0
    return {
        "total_value": round(total, 2),
        "card_count": len(docs),
        "pnl_30d": pnl_30d,
        "pnl_pct_30d": pnl_pct,
        "allocation_by_sport": [{"name": k, "value": round(v, 2)} for k, v in by_sport.items()],
        "allocation_by_grader": [{"name": k, "value": v} for k, v in by_grader.items()],
        "history": history,
    }

# =========================
# TRADES
# =========================

async def _trade_out(doc) -> TradeOut:
    initiator = await db.users.find_one({"id": doc['initiator_id']}, {"_id": 0, "display_name": 1})
    recipient = await db.users.find_one({"id": doc['recipient_id']}, {"_id": 0, "display_name": 1})
    target = await db.cards.find_one({"id": doc['target_card_id']}, {"_id": 0})
    offered = await db.cards.find({"id": {"$in": doc.get('offered_card_ids', [])}}, {"_id": 0}).to_list(50)
    return TradeOut(
        id=doc['id'],
        initiator_id=doc['initiator_id'],
        initiator_name=(initiator or {}).get('display_name', 'Unknown'),
        recipient_id=doc['recipient_id'],
        recipient_name=(recipient or {}).get('display_name', 'Unknown'),
        target_card_id=doc['target_card_id'],
        target_card=(await _card_out(target)) if target else None,
        offered_card_ids=doc.get('offered_card_ids', []),
        offered_cards=[await _card_out(o) for o in offered],
        cash_amount=doc.get('cash_amount', 0.0),
        status=doc['status'],
        fair_trade_score=doc.get('fair_trade_score'),
        fair_trade_reasoning=doc.get('fair_trade_reasoning'),
        created_at=_parse_dt(doc.get('created_at')),
        settled_at=_parse_dt(doc.get('settled_at')) if doc.get('settled_at') else None,
    )

@api.post("/trades", response_model=TradeOut)
async def create_trade(inp: TradeIn, user=Depends(current_user)):
    target = await db.cards.find_one({"id": inp.target_card_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Target card not found")
    if target['owner_id'] == user['id']:
        raise HTTPException(status_code=400, detail="Cannot trade for your own card")
    if not target.get('listed_for_trade'):
        raise HTTPException(status_code=400, detail="Card is not listed for trade")
    if inp.offered_card_ids:
        mine = await db.cards.find({"id": {"$in": inp.offered_card_ids}, "owner_id": user['id']}, {"_id": 0}).to_list(50)
        if len(mine) != len(inp.offered_card_ids):
            raise HTTPException(status_code=400, detail="One or more offered cards are not in your vault")
    tid = str(uuid.uuid4())
    doc = {
        "id": tid,
        "initiator_id": user['id'],
        "recipient_id": target['owner_id'],
        "target_card_id": inp.target_card_id,
        "offered_card_ids": inp.offered_card_ids,
        "cash_amount": inp.cash_amount,
        "status": "pending",
        "fair_trade_score": None,
        "fair_trade_reasoning": None,
        "created_at": _now().isoformat(),
        "settled_at": None,
    }
    await db.trades.insert_one(doc)
    return await _trade_out(doc)

@api.get("/trades/incoming", response_model=List[TradeOut])
async def trades_incoming(user=Depends(current_user)):
    docs = await db.trades.find({"recipient_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [await _trade_out(d) for d in docs]

@api.get("/trades/outgoing", response_model=List[TradeOut])
async def trades_outgoing(user=Depends(current_user)):
    docs = await db.trades.find({"initiator_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [await _trade_out(d) for d in docs]

@api.post("/trades/{tid}/accept", response_model=TradeOut)
async def accept_trade(tid: str, user=Depends(current_user)):
    doc = await db.trades.find_one({"id": tid}, {"_id": 0})
    if not doc or doc['recipient_id'] != user['id']:
        raise HTTPException(status_code=404, detail="Trade not found")
    if doc['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Trade not pending")
    # Settle: swap ownership
    initiator_id = doc['initiator_id']
    recipient_id = doc['recipient_id']
    # Target card -> initiator
    await db.cards.update_one({"id": doc['target_card_id']},
                              {"$set": {"owner_id": initiator_id, "listed_for_trade": False}})
    # Offered cards -> recipient
    if doc.get('offered_card_ids'):
        await db.cards.update_many({"id": {"$in": doc['offered_card_ids']}},
                                   {"$set": {"owner_id": recipient_id, "listed_for_trade": False}})
    # Cancel any other pending trades referencing these cards
    all_ids = [doc['target_card_id']] + doc.get('offered_card_ids', [])
    await db.trades.update_many(
        {"id": {"$ne": tid}, "status": "pending",
         "$or": [{"target_card_id": {"$in": all_ids}}, {"offered_card_ids": {"$in": all_ids}}]},
        {"$set": {"status": "cancelled"}}
    )
    # Update reputation counts
    for uid in (initiator_id, recipient_id):
        await db.users.update_one({"id": uid}, {"$inc": {"trades_completed": 1}})
    settled_at = _now().isoformat()
    await db.trades.update_one({"id": tid}, {"$set": {"status": "settled", "settled_at": settled_at}})
    doc['status'] = 'settled'
    doc['settled_at'] = settled_at
    return await _trade_out(doc)

@api.post("/trades/{tid}/reject", response_model=TradeOut)
async def reject_trade(tid: str, user=Depends(current_user)):
    doc = await db.trades.find_one({"id": tid}, {"_id": 0})
    if not doc or doc['recipient_id'] != user['id']:
        raise HTTPException(status_code=404, detail="Trade not found")
    if doc['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Trade not pending")
    await db.trades.update_one({"id": tid}, {"$set": {"status": "rejected"}})
    doc['status'] = 'rejected'
    return await _trade_out(doc)

# =========================
# AI — Claude Sonnet 4.5
# =========================

def _llm() -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"slabby-{uuid.uuid4()}",
        system_message=(
            "You are Slabby's institutional valuation AI for graded sports cards. "
            "Respond ONLY with valid JSON (no markdown fences). Be concise, analytical, and authoritative."
        ),
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start:end+1]
    return json.loads(text)

def _card_summary(c: dict) -> str:
    return f"{c.get('year')} {c.get('set_name')} {c.get('player')} — {c.get('grader')} {c.get('grade')} ({c.get('sport')}) — est ${c.get('est_value'):,.0f}"

class FairScoreIn(BaseModel):
    target_card_id: str
    offered_card_ids: List[str] = []
    cash_amount: float = 0.0

@api.post("/ai/fair-score", response_model=FairScoreOut)
async def fair_score(inp: FairScoreIn, user=Depends(current_user)):
    target = await db.cards.find_one({"id": inp.target_card_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Target card not found")
    offered = await db.cards.find({"id": {"$in": inp.offered_card_ids}}, {"_id": 0}).to_list(50) if inp.offered_card_ids else []
    offered_value = sum(o['est_value'] for o in offered) + max(inp.cash_amount, 0)
    target_value = target['est_value'] + max(-inp.cash_amount, 0)
    delta = offered_value - target_value

    prompt = f"""Evaluate this proposed trade on Slabby.

TARGET CARD (what initiator wants):
- {_card_summary(target)}

OFFERED BY INITIATOR:
{chr(10).join('- ' + _card_summary(o) for o in offered) or '- (no cards)'}
- Cash from initiator: ${inp.cash_amount:,.2f}

Compute a Fair Trade Score 0-100 where:
- 90-100 = elite fair (value parity + strong demand alignment)
- 70-89 = fair
- 50-69 = lopsided but workable
- below 50 = unfair / reject

Factors: raw value parity, grade scarcity, player demand, sport liquidity, set premium, grading company, vintage vs modern.

Return JSON only: {{"score": <int>, "verdict": "<one short phrase>", "reasoning": "<2-3 sentences, analytical>"}}"""

    try:
        resp = await _llm().send_message(UserMessage(text=prompt))
        data = _extract_json(resp)
        score = int(data.get("score", 50))
    except Exception as e:
        log.exception("Fair score LLM failed")
        # Fallback heuristic
        ratio = offered_value / target_value if target_value else 1.0
        score = int(max(0, min(100, 100 - abs(1 - ratio) * 120)))
        data = {"score": score, "verdict": "Heuristic fallback", "reasoning": f"Offered value ${offered_value:,.0f} vs target ${target_value:,.0f}."}

    return FairScoreOut(
        score=max(0, min(100, score)),
        verdict=data.get("verdict", "Evaluated"),
        reasoning=data.get("reasoning", ""),
        offered_value=round(offered_value, 2),
        target_value=round(target_value, 2),
        delta=round(delta, 2),
    )

class MatchIn(BaseModel):
    my_card_id: str
    limit: int = 5

@api.post("/ai/match", response_model=List[MatchOut])
async def ai_match(inp: MatchIn, user=Depends(current_user)):
    my = await db.cards.find_one({"id": inp.my_card_id, "owner_id": user['id']}, {"_id": 0})
    if not my:
        raise HTTPException(status_code=404, detail="Card not in your vault")
    listings = await db.cards.find(
        {"listed_for_trade": True, "owner_id": {"$ne": user['id']}},
        {"_id": 0}
    ).to_list(200)
    if not listings:
        return []

    catalog = "\n".join(f"[{c['id']}] {_card_summary(c)}" for c in listings)
    prompt = f"""I own: {_card_summary(my)}

Rank the top {inp.limit} best trade matches from this catalog based on: value proximity, cross-demand, sport liquidity, grade equivalence, and trade attractiveness.

CATALOG:
{catalog}

Return JSON only: {{"matches": [{{"id": "<card_id>", "match_score": <0-100 int>, "rationale": "<1 sentence>"}}]}}"""

    try:
        resp = await _llm().send_message(UserMessage(text=prompt))
        data = _extract_json(resp)
        ranked = data.get("matches", [])[:inp.limit]
    except Exception:
        log.exception("AI match failed")
        my_v = my['est_value']
        ranked = sorted(listings, key=lambda c: abs(c['est_value'] - my_v))[:inp.limit]
        ranked = [{"id": c['id'], "match_score": max(0, 100 - int(abs(c['est_value'] - my_v) / my_v * 100)), "rationale": "Closest value match."} for c in ranked]

    by_id = {c['id']: c for c in listings}
    results = []
    for m in ranked:
        c = by_id.get(m.get("id"))
        if not c:
            continue
        results.append(MatchOut(
            card=await _card_out(c),
            match_score=int(m.get("match_score", 50)),
            rationale=m.get("rationale", ""),
        ))
    return results

@api.post("/ai/comps/{card_id}", response_model=CompsOut)
async def comps(card_id: str):
    card = await db.cards.find_one({"id": card_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    prompt = f"""Generate 6 realistic recent sale comps for:
{_card_summary(card)}

Return JSON only: {{"comps": [{{"venue": "<platform>", "date": "<YYYY-MM-DD within last 180 days>", "price": <float>, "grade_note": "<short>"}}], "summary": "<one-sentence market read>"}}

Prices should cluster realistically around the estimated value with natural variance."""
    try:
        resp = await _llm().send_message(UserMessage(text=prompt))
        data = _extract_json(resp)
        comps_list = data.get("comps", [])
        summary = data.get("summary", "")
    except Exception:
        log.exception("Comps AI failed")
        import random
        random.seed(card_id)
        comps_list = [
            {"venue": v, "date": (_now() - timedelta(days=random.randint(5, 170))).date().isoformat(),
             "price": round(card['est_value'] * random.uniform(0.88, 1.12), 2),
             "grade_note": f"{card['grader']} {card['grade']}"}
            for v in ["Goldin", "PWCC", "eBay", "Heritage", "Goldin", "eBay"]
        ]
        summary = "Heuristic comps — stable market."

    prices = [c['price'] for c in comps_list if isinstance(c.get('price'), (int, float))]
    avg = sum(prices) / len(prices) if prices else card['est_value']
    srt = sorted(prices)
    med = srt[len(srt) // 2] if srt else card['est_value']
    return CompsOut(card_id=card_id, comps=comps_list, average=round(avg, 2), median=round(med, 2), summary=summary)

# =========================
# USERS
# =========================

@api.get("/users/{uid}/profile", response_model=UserOut)
async def user_profile(uid: str):
    doc = await db.users.find_one({"id": uid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_out(doc)

# =========================
# TICKER (live mock)
# =========================

@api.get("/market/ticker")
async def ticker():
    import random
    docs = await db.cards.find({}, {"_id": 0}).sort("est_value", -1).limit(12).to_list(12)
    items = []
    for d in docs:
        change = round(random.uniform(-3.5, 4.2), 2)
        items.append({
            "id": d['id'],
            "label": f"{d['year']} {d['player']} {d['grader']}{int(d['grade']) if d['grade'] == int(d['grade']) else d['grade']}",
            "price": d['est_value'],
            "change_pct": change,
        })
    return {"items": items}

# =========================
# SEED
# =========================

SEED_CARDS = [
    # Demo user 1 (demo@slabby.com) cards
    {"player": "Mike Trout", "year": 2011, "set_name": "Topps Update", "grader": "PSA", "grade": 10, "sport": "Baseball", "est_value": 9200, "image_url": "https://images.unsplash.com/photo-1642692704110-1bcf24bb5689?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": True, "listing_note": "Open to Jordan rookies or LeBron RCs", "accepting_cash": True},
    {"player": "Shohei Ohtani", "year": 2018, "set_name": "Topps Chrome Refractor", "grader": "PSA", "grade": 10, "sport": "Baseball", "est_value": 1850, "image_url": "https://images.unsplash.com/photo-1642692704112-80f6ba7f6aa3?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": False, "accepting_cash": True},
    {"player": "Luka Doncic", "year": 2018, "set_name": "Prizm Silver", "grader": "BGS", "grade": 9.5, "sport": "Basketball", "est_value": 2400, "image_url": "https://images.unsplash.com/photo-1609358905581-e5381612486e?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": True, "listing_note": "Seeking modern rookies", "accepting_cash": True},
    {"player": "Patrick Mahomes", "year": 2017, "set_name": "Panini Prizm", "grader": "PSA", "grade": 10, "sport": "Football", "est_value": 4100, "image_url": "https://images.unsplash.com/photo-1642692704110-1bcf24bb5689?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": False, "accepting_cash": True},
    {"player": "Wayne Gretzky", "year": 1979, "set_name": "O-Pee-Chee", "grader": "PSA", "grade": 8, "sport": "Hockey", "est_value": 6800, "image_url": "https://images.unsplash.com/photo-1642692704112-80f6ba7f6aa3?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": True, "listing_note": "Premier vintage hockey", "accepting_cash": True},
    # Demo user 2 cards
    {"player": "Michael Jordan", "year": 1986, "set_name": "Fleer", "grader": "PSA", "grade": 9, "sport": "Basketball", "est_value": 28500, "image_url": "https://images.unsplash.com/photo-1609358905581-e5381612486e?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": True, "listing_note": "Grail card — cash + top modern RC considered", "accepting_cash": True},
    {"player": "LeBron James", "year": 2003, "set_name": "Topps Chrome Refractor", "grader": "BGS", "grade": 9.5, "sport": "Basketball", "est_value": 18900, "image_url": "https://images.unsplash.com/photo-1642692704110-1bcf24bb5689?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": True, "listing_note": "Seeking vintage baseball HOF'ers", "accepting_cash": True},
    {"player": "Tom Brady", "year": 2000, "set_name": "Bowman Chrome", "grader": "PSA", "grade": 9, "sport": "Football", "est_value": 7600, "image_url": "https://images.unsplash.com/photo-1642692704112-80f6ba7f6aa3?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": True, "listing_note": "", "accepting_cash": True},
    {"player": "Ken Griffey Jr.", "year": 1989, "set_name": "Upper Deck", "grader": "PSA", "grade": 10, "sport": "Baseball", "est_value": 3200, "image_url": "https://images.unsplash.com/photo-1609358905581-e5381612486e?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": False, "accepting_cash": True},
    {"player": "Giannis Antetokounmpo", "year": 2013, "set_name": "Prizm", "grader": "PSA", "grade": 10, "sport": "Basketball", "est_value": 1750, "image_url": "https://images.unsplash.com/photo-1642692704110-1bcf24bb5689?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": True, "listing_note": "", "accepting_cash": True},
    {"player": "Lionel Messi", "year": 2004, "set_name": "Panini Mega Cracks RC", "grader": "PSA", "grade": 9, "sport": "Soccer", "est_value": 14500, "image_url": "https://images.unsplash.com/photo-1642692704112-80f6ba7f6aa3?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": True, "listing_note": "GOAT rookie", "accepting_cash": True},
    {"player": "Ja Morant", "year": 2019, "set_name": "Prizm Silver", "grader": "PSA", "grade": 10, "sport": "Basketball", "est_value": 780, "image_url": "https://images.unsplash.com/photo-1609358905581-e5381612486e?crop=entropy&cs=srgb&fm=jpg&w=800", "listed_for_trade": True, "listing_note": "", "accepting_cash": True},
]

@app.on_event("startup")
async def seed():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.cards.create_index("id", unique=True)
    await db.cards.create_index("owner_id")
    await db.cards.create_index("listed_for_trade")
    await db.trades.create_index("id", unique=True)

    # Seed demo users + cards if not present
    demo = await db.users.find_one({"email": "demo@slabby.com"}, {"_id": 0})
    if demo:
        return

    u1 = {
        "id": str(uuid.uuid4()), "email": "demo@slabby.com", "password_hash": pwd.hash("slabby123"),
        "display_name": "Alex Vance", "avatar_url": "https://images.unsplash.com/photo-1762290965691-e74072600c03?crop=entropy&cs=srgb&fm=jpg&w=200",
        "reputation_score": 4.9, "trades_completed": 42, "created_at": _now().isoformat(),
    }
    u2 = {
        "id": str(uuid.uuid4()), "email": "marcus@slabby.com", "password_hash": pwd.hash("slabby123"),
        "display_name": "Marcus Thorne", "avatar_url": "https://images.unsplash.com/photo-1762291629616-3e2c044c79a0?crop=entropy&cs=srgb&fm=jpg&w=200",
        "reputation_score": 4.8, "trades_completed": 61, "created_at": _now().isoformat(),
    }
    await db.users.insert_many([u1, u2])

    for i, c in enumerate(SEED_CARDS):
        owner = u1 if i < 5 else u2
        doc = dict(c)
        doc.update({
            "id": str(uuid.uuid4()),
            "owner_id": owner['id'],
            "vaulted_at": _now().isoformat(),
            "market_change_24h": 0.0,
        })
        await db.cards.insert_one(doc)
    log.info("Seed complete: 2 users, %d cards", len(SEED_CARDS))

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
