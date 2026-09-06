"""Backend tests for BIS Standard Recommender."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://standard-suggest.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health ---
def test_health(client):
    r = client.get(f"{API}/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["database"] == "up"


# --- Standards ---
def test_list_standards(client):
    r = client.get(f"{API}/standards", params={"limit": 100})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 20, f"Expected ~21 standards, got {len(data)}"


def test_standards_filter_department(client):
    r = client.get(f"{API}/standards", params={"department": "Textiles", "limit": 50})
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    for s in data:
        assert s["department"] == "Textiles"


def test_standards_filter_domain(client):
    r = client.get(f"{API}/standards", params={"domain": "cement"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    for s in data:
        assert s["domain"] == "cement"


def test_standards_search(client):
    r = client.get(f"{API}/standards", params={"search": "cement"})
    assert r.status_code == 200
    assert len(r.json()) > 0


def test_standard_detail(client):
    r = client.get(f"{API}/standards", params={"limit": 1})
    sid = r.json()[0]["id"]
    r2 = client.get(f"{API}/standards/{sid}")
    assert r2.status_code == 200
    d = r2.json()
    assert "related_standards" in d
    assert "id" in d and d["id"] == sid


def test_standard_detail_404(client):
    r = client.get(f"{API}/standards/999999")
    assert r.status_code == 404


def test_stats_overview(client):
    r = client.get(f"{API}/standards/stats/overview")
    assert r.status_code == 200
    d = r.json()
    assert "total" in d
    assert "by_domain" in d
    assert "by_status" in d
    assert "by_department" in d
    assert d["total"] >= 20


def test_meta_filters(client):
    r = client.get(f"{API}/standards/meta/filters")
    assert r.status_code == 200
    d = r.json()
    for k in ("statuses", "departments", "aspects", "domains"):
        assert k in d
        assert isinstance(d[k], list)


# --- Recommend ---
def test_recommend_cement(client):
    payload = {
        "query": "43 grade cement for RCC 43 MPa",
        "document_name": None,
        "filters": {"status": None, "department": None, "aspect": None},
    }
    r = client.post(f"{API}/recommend", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("request_id", "query", "recommendations"):
        assert k in d
    recs = d["recommendations"]
    assert len(recs) > 0
    # Check IS 8112:2013 highly ranked (top 3)
    top_is = [rec["is_number"] for rec in recs[:3]]
    assert "IS 8112:2013" in top_is, f"IS 8112:2013 not in top 3: {top_is}"
    # Check contract fields
    for rec in recs:
        for k in ("standard_id", "is_number", "title", "score", "status",
                  "department", "aspect", "matched_requirements", "reason",
                  "evidence", "related_standards"):
            assert k in rec, f"Missing field {k}"
        assert isinstance(rec["score"], (int, float))
        assert 0 <= rec["score"] <= 1
        assert isinstance(rec["evidence"], list)


def test_recommend_filter_textiles(client):
    payload = {
        "query": "cotton fabric",
        "document_name": None,
        "filters": {"status": None, "department": "Textiles", "aspect": None},
    }
    r = client.post(f"{API}/recommend", json=payload)
    assert r.status_code == 200
    d = r.json()
    for rec in d["recommendations"]:
        assert rec["department"] == "Textiles"


# --- Search history ---
def test_search_history(client):
    # Trigger a recommend first
    client.post(f"{API}/recommend", json={
        "query": "test history query cement",
        "document_name": None,
        "filters": {"status": None, "department": None, "aspect": None},
    })
    r = client.get(f"{API}/search/history")
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d, list) or (isinstance(d, dict) and "items" in d)


# --- Language / Hindi localization ---
DEV_RE = __import__("re").compile(r"[\u0900-\u097F]")


def _has_devanagari(s):
    return bool(s) and bool(DEV_RE.search(s))


def test_standards_lang_hi(client):
    r = client.get(f"{API}/standards", params={"lang": "hi", "limit": 100})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 20
    # find IS 10500:2012
    target = next((s for s in data if s.get("is_number") == "IS 10500:2012"), None)
    assert target is not None, "IS 10500:2012 not found"
    assert _has_devanagari(target["title"]), f"Hindi title expected, got: {target['title']}"
    # department & aspect Hindi
    hi_dept = any(_has_devanagari(s.get("department", "")) for s in data)
    hi_asp = any(_has_devanagari(s.get("aspect", "")) for s in data)
    assert hi_dept and hi_asp, "Expected Hindi department/aspect"


def test_standards_lang_en_default(client):
    r = client.get(f"{API}/standards", params={"limit": 5})
    for s in r.json():
        assert not _has_devanagari(s["title"]), f"English default expected, got: {s['title']}"


def test_standard_detail_lang_hi(client):
    r = client.get(f"{API}/standards", params={"limit": 100})
    sid = next(s["id"] for s in r.json() if s["is_number"] == "IS 10500:2012")
    r2 = client.get(f"{API}/standards/{sid}", params={"lang": "hi"})
    assert r2.status_code == 200
    d = r2.json()
    assert _has_devanagari(d["title"])
    assert _has_devanagari(d.get("scope", "")) or _has_devanagari(d.get("description", ""))
    reqs = d.get("requirements", [])
    if reqs:
        # requirements may be list of strings or list of dicts
        joined = " ".join([r_ if isinstance(r_, str) else str(r_) for r_ in reqs])
        assert _has_devanagari(joined), f"Hindi requirements expected: {joined[:200]}"
    for rel in d.get("related_standards", []):
        assert _has_devanagari(rel.get("title", "")), f"Related std title not Hindi: {rel}"


def test_recommend_lang_hi(client):
    payload = {"query": "43 grade cement for RCC 43 MPa", "document_name": None,
               "filters": {"status": None, "department": None, "aspect": None}}
    r = client.post(f"{API}/recommend", params={"lang": "hi"}, json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    recs = d["recommendations"]
    assert len(recs) > 0
    top_is = [rec["is_number"] for rec in recs[:3]]
    assert "IS 8112:2013" in top_is, f"IS 8112:2013 not in top 3: {top_is}"
    for rec in recs[:3]:
        assert _has_devanagari(rec["title"]), f"Non-Hindi title: {rec['title']}"
        assert _has_devanagari(rec["department"])
        assert _has_devanagari(rec["aspect"])
        mreq = rec.get("matched_requirements", [])
        if mreq:
            joined = " ".join([m if isinstance(m, str) else str(m) for m in mreq])
            assert _has_devanagari(joined), f"matched_requirements not Hindi: {joined}"
        # is_number & status unchanged (ASCII)
        assert not _has_devanagari(rec["is_number"])
        assert not _has_devanagari(rec["status"])
        assert isinstance(rec["score"], (int, float))


def test_recommend_lang_en(client):
    payload = {"query": "43 grade cement for RCC 43 MPa", "document_name": None,
               "filters": {"status": None, "department": None, "aspect": None}}
    r = client.post(f"{API}/recommend", json=payload)
    assert r.status_code == 200
    for rec in r.json()["recommendations"][:3]:
        assert not _has_devanagari(rec["title"])



# --- Tamil (ta) & Bengali (bn) localization ---
TA_RE = __import__("re").compile(r"[\u0B80-\u0BFF]")
BN_RE = __import__("re").compile(r"[\u0980-\u09FF]")


def _has_tamil(s):
    return bool(s) and bool(TA_RE.search(s))


def _has_bengali(s):
    return bool(s) and bool(BN_RE.search(s))


def _find_id_by_isnum(client, isnum):
    r = client.get(f"{API}/standards", params={"search": isnum.split(":")[0].replace("IS ", "")})
    for s in r.json():
        if s["is_number"] == isnum:
            return s["id"]
    return None


@pytest.mark.parametrize("lang,checker,name", [("ta", _has_tamil, "Tamil"), ("bn", _has_bengali, "Bengali")])
def test_standards_lang_ta_bn(client, lang, checker, name):
    r = client.get(f"{API}/standards", params={"lang": lang, "limit": 100})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 20
    assert any(checker(s.get("title", "")) for s in data), f"Expected {name} titles"
    assert any(checker(s.get("department", "")) for s in data), f"Expected {name} department"
    assert any(checker(s.get("aspect", "")) for s in data), f"Expected {name} aspect"


@pytest.mark.parametrize("lang,checker,name", [("ta", _has_tamil, "Tamil"), ("bn", _has_bengali, "Bengali")])
def test_standard_detail_lang_ta_bn(client, lang, checker, name):
    sid = _find_id_by_isnum(client, "IS 8112:2013")
    assert sid is not None, "IS 8112:2013 not found via search"
    r = client.get(f"{API}/standards/{sid}", params={"lang": lang})
    assert r.status_code == 200
    d = r.json()
    assert checker(d["title"]), f"{name} title expected, got: {d['title']}"
    assert checker(d.get("scope", "")) or checker(d.get("description", "")), f"{name} scope expected"
    reqs = d.get("requirements", [])
    if reqs:
        joined = " ".join([x if isinstance(x, str) else str(x) for x in reqs])
        assert checker(joined), f"{name} requirements expected: {joined[:200]}"
    for rel in d.get("related_standards", []):
        assert checker(rel.get("title", "")), f"Related std title not {name}: {rel}"


@pytest.mark.parametrize("lang,checker,name", [("ta", _has_tamil, "Tamil"), ("bn", _has_bengali, "Bengali")])
def test_recommend_lang_ta_bn(client, lang, checker, name):
    payload = {"query": "43 grade cement for RCC 43 MPa", "document_name": None,
               "filters": {"status": None, "department": None, "aspect": None}}
    r = client.post(f"{API}/recommend", params={"lang": lang}, json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    recs = d["recommendations"]
    assert len(recs) > 0
    top_is = [rec["is_number"] for rec in recs[:3]]
    assert "IS 8112:2013" in top_is, f"IS 8112:2013 not in top 3 ({lang}): {top_is}"
    for rec in recs[:3]:
        assert checker(rec["title"]), f"Non-{name} title: {rec['title']}"
        assert checker(rec["department"]), f"Non-{name} dept: {rec['department']}"
        assert checker(rec["aspect"]), f"Non-{name} aspect: {rec['aspect']}"
        mreq = rec.get("matched_requirements", [])
        if mreq:
            joined = " ".join([m if isinstance(m, str) else str(m) for m in mreq])
            assert checker(joined), f"matched_requirements not {name}: {joined}"
        # is_number & status unchanged (ASCII)
        assert not checker(rec["is_number"])
        assert not checker(rec["status"])
