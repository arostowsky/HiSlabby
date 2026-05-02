"""Comprehensive backend tests for Slabby MVP API."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://card-credit-hub-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@slabby.com"
MARCUS_EMAIL = "marcus@slabby.com"
PWD = "slabby123"


@pytest.fixture(scope="session")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": PWD}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def marcus_token():
    r = requests.post(f"{API}/auth/login", json={"email": MARCUS_EMAIL, "password": PWD}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- AUTH ----------
class TestAuth:
    def test_register_new_user(self):
        email = f"test_{uuid.uuid4().hex[:8]}@slabby.io"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "pw12345", "display_name": "TEST User"
        }, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str)
        assert data["user"]["email"] == email
        assert data["user"]["display_name"] == "TEST User"

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={
            "email": DEMO_EMAIL, "password": "x", "display_name": "x"
        }, timeout=20)
        assert r.status_code == 400

    def test_login_demo(self, demo_token):
        assert demo_token

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"}, timeout=20)
        assert r.status_code == 401

    def test_me_with_token(self, demo_token):
        r = requests.get(f"{API}/auth/me", headers=_h(demo_token), timeout=20)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL
        assert r.json()["display_name"] == "Alex Vance"

    def test_cards_mine_unauth(self):
        r = requests.get(f"{API}/cards/mine", timeout=20)
        assert r.status_code == 401


# ---------- MARKET ----------
class TestMarket:
    def test_ticker(self):
        r = requests.get(f"{API}/market/ticker", timeout=20)
        assert r.status_code == 200
        items = r.json()["items"]
        assert isinstance(items, list) and len(items) > 0
        for it in items:
            assert "id" in it and "label" in it and "price" in it and "change_pct" in it


# ---------- CARDS ----------
class TestCards:
    def test_my_cards_demo(self, demo_token):
        r = requests.get(f"{API}/cards/mine", headers=_h(demo_token), timeout=20)
        assert r.status_code == 200
        cards = r.json()
        assert len(cards) >= 5, f"Expected at least 5 demo cards, got {len(cards)}"
        # All owned by demo
        for c in cards:
            assert c["owner_name"] == "Alex Vance"

    def test_add_card_low_value_rejected(self, demo_token):
        r = requests.post(f"{API}/cards", headers=_h(demo_token), json={
            "player": "TEST Lowvalue", "year": 2020, "set_name": "Topps",
            "grader": "PSA", "grade": 9, "sport": "Baseball", "est_value": 100
        }, timeout=20)
        assert r.status_code == 400

    def test_add_card_valid(self, demo_token):
        r = requests.post(f"{API}/cards", headers=_h(demo_token), json={
            "player": "TEST Player", "year": 2020, "set_name": "Topps Chrome",
            "grader": "PSA", "grade": 10, "sport": "Baseball", "est_value": 500,
            "listed_for_trade": False
        }, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["est_value"] == 500
        assert data["owner_name"] == "Alex Vance"
        # Verify GET
        cid = data["id"]
        r2 = requests.get(f"{API}/cards/{cid}", timeout=20)
        assert r2.status_code == 200
        assert r2.json()["player"] == "TEST Player"

    def test_listings(self):
        r = requests.get(f"{API}/cards/listings", timeout=20)
        assert r.status_code == 200
        cards = r.json()
        assert all(c["listed_for_trade"] for c in cards)
        assert len(cards) >= 5

    def test_listings_filter_sport(self):
        r = requests.get(f"{API}/cards/listings", params={"sport": "Basketball"}, timeout=20)
        assert r.status_code == 200
        cards = r.json()
        assert all(c["sport"] == "Basketball" for c in cards)

    def test_patch_card_only_owner(self, demo_token, marcus_token):
        # demo's cards
        mine = requests.get(f"{API}/cards/mine", headers=_h(demo_token), timeout=20).json()
        # find one not currently listed
        candidate = next((c for c in mine if not c["listed_for_trade"]), mine[0])
        cid = candidate["id"]
        original_listed = candidate["listed_for_trade"]
        # marcus tries to patch -> 404
        r_bad = requests.patch(f"{API}/cards/{cid}", headers=_h(marcus_token), json={"listed_for_trade": True}, timeout=20)
        assert r_bad.status_code == 404
        # demo patches -> ok (toggle)
        r_ok = requests.patch(f"{API}/cards/{cid}", headers=_h(demo_token), json={"listed_for_trade": not original_listed}, timeout=20)
        assert r_ok.status_code == 200
        assert r_ok.json()["listed_for_trade"] == (not original_listed)
        # revert
        requests.patch(f"{API}/cards/{cid}", headers=_h(demo_token), json={"listed_for_trade": original_listed}, timeout=20)


# ---------- TRADES ----------
class TestTrades:
    def test_full_trade_accept_flow(self, demo_token, marcus_token):
        # demo = initiator; marcus = recipient
        # find a marcus listed card (not the MJ — use a cheaper one)
        listings = requests.get(f"{API}/cards/listings", timeout=20).json()
        marcus_id = requests.get(f"{API}/auth/me", headers=_h(marcus_token), timeout=20).json()["id"]
        demo_id = requests.get(f"{API}/auth/me", headers=_h(demo_token), timeout=20).json()["id"]
        marcus_listed = [c for c in listings if c["owner_id"] == marcus_id]
        # pick lowest value to settle small trade (Ja Morant or Giannis)
        target = sorted(marcus_listed, key=lambda c: c["est_value"])[0]

        my = requests.get(f"{API}/cards/mine", headers=_h(demo_token), timeout=20).json()
        # offer one of demo's own cards
        offered_card = my[-1]  # smallest/last

        r = requests.post(f"{API}/trades", headers=_h(demo_token), json={
            "target_card_id": target["id"],
            "offered_card_ids": [offered_card["id"]],
            "cash_amount": 200.0
        }, timeout=20)
        assert r.status_code == 200, r.text
        trade = r.json()
        assert trade["status"] == "pending"
        assert trade["initiator_id"] == demo_id
        assert trade["recipient_id"] == marcus_id

        tid = trade["id"]

        # incoming for marcus
        r_in = requests.get(f"{API}/trades/incoming", headers=_h(marcus_token), timeout=20)
        assert r_in.status_code == 200
        assert any(t["id"] == tid for t in r_in.json())

        # outgoing for demo
        r_out = requests.get(f"{API}/trades/outgoing", headers=_h(demo_token), timeout=20)
        assert r_out.status_code == 200
        assert any(t["id"] == tid for t in r_out.json())

        # demo cannot accept (not recipient)
        r_bad = requests.post(f"{API}/trades/{tid}/accept", headers=_h(demo_token), timeout=20)
        assert r_bad.status_code == 404

        # snapshot trades_completed
        u_demo_before = requests.get(f"{API}/users/{demo_id}/profile", timeout=20).json()["trades_completed"]
        u_marcus_before = requests.get(f"{API}/users/{marcus_id}/profile", timeout=20).json()["trades_completed"]

        # marcus accepts
        r_acc = requests.post(f"{API}/trades/{tid}/accept", headers=_h(marcus_token), timeout=20)
        assert r_acc.status_code == 200, r_acc.text
        assert r_acc.json()["status"] == "settled"
        assert r_acc.json()["settled_at"]

        # verify ownership swap
        target_now = requests.get(f"{API}/cards/{target['id']}", timeout=20).json()
        assert target_now["owner_id"] == demo_id
        assert target_now["listed_for_trade"] is False
        offered_now = requests.get(f"{API}/cards/{offered_card['id']}", timeout=20).json()
        assert offered_now["owner_id"] == marcus_id

        # trades_completed increments
        u_demo_after = requests.get(f"{API}/users/{demo_id}/profile", timeout=20).json()["trades_completed"]
        u_marcus_after = requests.get(f"{API}/users/{marcus_id}/profile", timeout=20).json()["trades_completed"]
        assert u_demo_after == u_demo_before + 1
        assert u_marcus_after == u_marcus_before + 1

    def test_reject_trade(self, demo_token, marcus_token):
        # Set up a fresh trade. Use any remaining marcus-listed card.
        listings = requests.get(f"{API}/cards/listings", timeout=20).json()
        marcus_id = requests.get(f"{API}/auth/me", headers=_h(marcus_token), timeout=20).json()["id"]
        marcus_listed = [c for c in listings if c["owner_id"] == marcus_id]
        if not marcus_listed:
            pytest.skip("No marcus listed cards remaining")
        target = marcus_listed[0]
        r = requests.post(f"{API}/trades", headers=_h(demo_token), json={
            "target_card_id": target["id"],
            "offered_card_ids": [],
            "cash_amount": 300.0,
        }, timeout=20)
        assert r.status_code == 200, r.text
        tid = r.json()["id"]

        r_rej = requests.post(f"{API}/trades/{tid}/reject", headers=_h(marcus_token), timeout=20)
        assert r_rej.status_code == 200
        assert r_rej.json()["status"] == "rejected"


# ---------- AI ----------
class TestAI:
    def test_fair_score(self, demo_token, marcus_token):
        # demo offers a card+cash for one of marcus's listed cards
        listings = requests.get(f"{API}/cards/listings", timeout=20).json()
        marcus_id = requests.get(f"{API}/auth/me", headers=_h(marcus_token), timeout=20).json()["id"]
        marcus_listed = [c for c in listings if c["owner_id"] == marcus_id]
        if not marcus_listed:
            pytest.skip("No marcus listings")
        # Pick a high value card (e.g. MJ or LeBron)
        target = sorted(marcus_listed, key=lambda c: -c["est_value"])[0]

        my = requests.get(f"{API}/cards/mine", headers=_h(demo_token), timeout=20).json()
        offered_ids = [my[0]["id"]] if my else []

        r = requests.post(f"{API}/ai/fair-score", headers=_h(demo_token), json={
            "target_card_id": target["id"],
            "offered_card_ids": offered_ids,
            "cash_amount": 1000.0,
        }, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert 0 <= data["score"] <= 100
        assert "verdict" in data and isinstance(data["verdict"], str)
        assert "reasoning" in data
        assert data["target_value"] > 0
        assert "delta" in data

    def test_ai_match(self, demo_token):
        my = requests.get(f"{API}/cards/mine", headers=_h(demo_token), timeout=20).json()
        if not my:
            pytest.skip("No cards")
        r = requests.post(f"{API}/ai/match", headers=_h(demo_token), json={
            "my_card_id": my[0]["id"], "limit": 5
        }, timeout=120)
        assert r.status_code == 200, r.text
        results = r.json()
        assert isinstance(results, list)
        assert len(results) > 0
        for m in results:
            assert "card" in m and "match_score" in m and "rationale" in m
            assert 0 <= m["match_score"] <= 100

    def test_ai_comps(self, demo_token):
        my = requests.get(f"{API}/cards/mine", headers=_h(demo_token), timeout=20).json()
        if not my:
            pytest.skip("No cards")
        r = requests.post(f"{API}/ai/comps/{my[0]['id']}", timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["card_id"] == my[0]["id"]
        assert isinstance(data["comps"], list)
        assert len(data["comps"]) >= 1
        assert data["average"] > 0
        assert data["median"] > 0
        assert isinstance(data["summary"], str)


# ---------- PORTFOLIO + USERS ----------
class TestPortfolio:
    def test_analytics(self, demo_token):
        r = requests.get(f"{API}/portfolio/analytics", headers=_h(demo_token), timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["total_value"] > 0
        assert data["card_count"] > 0
        assert "pnl_30d" in data
        assert isinstance(data["allocation_by_sport"], list)
        assert len(data["history"]) == 30

    def test_user_profile(self, demo_token):
        uid = requests.get(f"{API}/auth/me", headers=_h(demo_token), timeout=20).json()["id"]
        r = requests.get(f"{API}/users/{uid}/profile", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "reputation_score" in data
        assert "trades_completed" in data
