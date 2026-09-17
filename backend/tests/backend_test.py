"""Backend tests for BIS Standard Recommender."""

import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_health(client):
    response = client.get(f"{API}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "up"


def test_list_standards(client):
    response = client.get(f"{API}/standards", params={"limit": 100})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 20, f"Expected ~21 standards, got {len(data)}"


def test_standards_filter_department(client):
    response = client.get(f"{API}/standards", params={"department": "Textiles", "limit": 50})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for standard in data:
        assert standard["department"] == "Textiles"


def test_standards_filter_domain(client):
    response = client.get(f"{API}/standards", params={"domain": "cement"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for standard in data:
        assert standard["domain"] == "cement"


def test_standards_search(client):
    response = client.get(f"{API}/standards", params={"search": "cement"})
    assert response.status_code == 200
    assert len(response.json()) > 0


def test_standard_detail(client):
    response = client.get(f"{API}/standards", params={"limit": 1})
    standard_id = response.json()[0]["id"]
    detail = client.get(f"{API}/standards/{standard_id}")
    assert detail.status_code == 200
    data = detail.json()
    assert "related_standards" in data
    assert data["id"] == standard_id


def test_standard_detail_404(client):
    response = client.get(f"{API}/standards/999999")
    assert response.status_code == 404


def test_stats_overview(client):
    response = client.get(f"{API}/standards/stats/overview")
    assert response.status_code == 200
    data = response.json()
    for key in ("total", "by_domain", "by_status", "by_department"):
        assert key in data
    assert data["total"] >= 20


def test_meta_filters(client):
    response = client.get(f"{API}/standards/meta/filters")
    assert response.status_code == 200
    data = response.json()
    for key in ("statuses", "departments", "aspects", "domains"):
        assert key in data
        assert isinstance(data[key], list)


def test_recommend_cement(client):
    payload = {
        "query": "43 grade cement for RCC 43 MPa",
        "document_name": None,
        "filters": {"status": None, "department": None, "aspect": None},
    }
    response = client.post(f"{API}/recommend", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    for key in ("request_id", "query", "recommendations"):
        assert key in data

    recommendations = data["recommendations"]
    assert len(recommendations) > 0
    top_is = [item["is_number"] for item in recommendations[:3]]
    assert "IS 8112:2013" in top_is, f"IS 8112:2013 not in top 3: {top_is}"

    for recommendation in recommendations:
        for key in (
            "standard_id", "is_number", "title", "score", "status", "department",
            "aspect", "matched_requirements", "reason", "evidence", "related_standards",
        ):
            assert key in recommendation, f"Missing field {key}"
        assert isinstance(recommendation["score"], (int, float))
        assert 0 <= recommendation["score"] <= 1
        assert isinstance(recommendation["evidence"], list)


def test_recommend_filter_textiles(client):
    payload = {
        "query": "cotton fabric",
        "document_name": None,
        "filters": {"status": None, "department": "Textiles", "aspect": None},
    }
    response = client.post(f"{API}/recommend", json=payload)
    assert response.status_code == 200
    for recommendation in response.json()["recommendations"]:
        assert recommendation["department"] == "Textiles"


def test_search_history(client):
    client.post(
        f"{API}/recommend",
        json={
            "query": "test history query cement",
            "document_name": None,
            "filters": {"status": None, "department": None, "aspect": None},
        },
    )
    response = client.get(f"{API}/search/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list) or (isinstance(data, dict) and "items" in data)


DEV_RE = __import__("re").compile(r"[\u0900-\u097F]")
TA_RE = __import__("re").compile(r"[\u0B80-\u0BFF]")
BN_RE = __import__("re").compile(r"[\u0980-\u09FF]")


def _has_devanagari(value):
    return bool(value) and bool(DEV_RE.search(value))


def _has_tamil(value):
    return bool(value) and bool(TA_RE.search(value))


def _has_bengali(value):
    return bool(value) and bool(BN_RE.search(value))


def test_standards_lang_hi(client):
    response = client.get(f"{API}/standards", params={"lang": "hi", "limit": 100})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 20
    target = next((item for item in data if item.get("is_number") == "IS 10500:2012"), None)
    assert target is not None, "IS 10500:2012 not found"
    assert _has_devanagari(target["title"])
    assert any(_has_devanagari(item.get("department", "")) for item in data)
    assert any(_has_devanagari(item.get("aspect", "")) for item in data)


def test_standards_lang_en_default(client):
    response = client.get(f"{API}/standards", params={"limit": 5})
    for standard in response.json():
        assert not _has_devanagari(standard["title"])


def test_standard_detail_lang_hi(client):
    response = client.get(f"{API}/standards", params={"limit": 100})
    standard_id = next(item["id"] for item in response.json() if item["is_number"] == "IS 10500:2012")
    detail = client.get(f"{API}/standards/{standard_id}", params={"lang": "hi"})
    assert detail.status_code == 200
    data = detail.json()
    assert _has_devanagari(data["title"])
    assert _has_devanagari(data.get("scope", "")) or _has_devanagari(data.get("description", ""))
    requirements = data.get("requirements", [])
    if requirements:
        joined = " ".join(item if isinstance(item, str) else str(item) for item in requirements)
        assert _has_devanagari(joined)
    for related in data.get("related_standards", []):
        assert _has_devanagari(related.get("title", ""))


def test_recommend_lang_hi(client):
    payload = {
        "query": "43 grade cement for RCC 43 MPa",
        "document_name": None,
        "filters": {"status": None, "department": None, "aspect": None},
    }
    response = client.post(f"{API}/recommend", params={"lang": "hi"}, json=payload)
    assert response.status_code == 200, response.text
    recommendations = response.json()["recommendations"]
    assert len(recommendations) > 0
    top_is = [item["is_number"] for item in recommendations[:3]]
    assert "IS 8112:2013" in top_is
    for recommendation in recommendations[:3]:
        assert _has_devanagari(recommendation["title"])
        assert _has_devanagari(recommendation["department"])
        assert _has_devanagari(recommendation["aspect"])
        matched = recommendation.get("matched_requirements", [])
        if matched:
            assert _has_devanagari(" ".join(item if isinstance(item, str) else str(item) for item in matched))
        assert not _has_devanagari(recommendation["is_number"])
        assert not _has_devanagari(recommendation["status"])
        assert isinstance(recommendation["score"], (int, float))


def test_recommend_lang_en(client):
    payload = {
        "query": "43 grade cement for RCC 43 MPa",
        "document_name": None,
        "filters": {"status": None, "department": None, "aspect": None},
    }
    response = client.post(f"{API}/recommend", json=payload)
    assert response.status_code == 200
    for recommendation in response.json()["recommendations"][:3]:
        assert not _has_devanagari(recommendation["title"])


def _find_id_by_isnum(client, is_number):
    response = client.get(
        f"{API}/standards",
        params={"search": is_number.split(":")[0].replace("IS ", "")},
    )
    for standard in response.json():
        if standard["is_number"] == is_number:
            return standard["id"]
    return None


@pytest.mark.parametrize("lang,checker", [("ta", _has_tamil), ("bn", _has_bengali)])
def test_standards_lang_ta_bn(client, lang, checker):
    response = client.get(f"{API}/standards", params={"lang": lang, "limit": 100})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 20
    assert any(checker(item.get("title", "")) for item in data)
    assert any(checker(item.get("department", "")) for item in data)
    assert any(checker(item.get("aspect", "")) for item in data)


@pytest.mark.parametrize("lang,checker", [("ta", _has_tamil), ("bn", _has_bengali)])
def test_standard_detail_lang_ta_bn(client, lang, checker):
    standard_id = _find_id_by_isnum(client, "IS 8112:2013")
    assert standard_id is not None
    response = client.get(f"{API}/standards/{standard_id}", params={"lang": lang})
    assert response.status_code == 200
    data = response.json()
    assert checker(data["title"])
    assert checker(data.get("scope", "")) or checker(data.get("description", ""))
    requirements = data.get("requirements", [])
    if requirements:
        joined = " ".join(item if isinstance(item, str) else str(item) for item in requirements)
        assert checker(joined)
    for related in data.get("related_standards", []):
        assert checker(related.get("title", ""))


@pytest.mark.parametrize("lang,checker", [("ta", _has_tamil), ("bn", _has_bengali)])
def test_recommend_lang_ta_bn(client, lang, checker):
    payload = {
        "query": "43 grade cement for RCC 43 MPa",
        "document_name": None,
        "filters": {"status": None, "department": None, "aspect": None},
    }
    response = client.post(f"{API}/recommend", params={"lang": lang}, json=payload)
    assert response.status_code == 200, response.text
    recommendations = response.json()["recommendations"]
    assert len(recommendations) > 0
    top_is = [item["is_number"] for item in recommendations[:3]]
    assert "IS 8112:2013" in top_is
    for recommendation in recommendations[:3]:
        assert checker(recommendation["title"])
        assert checker(recommendation["department"])
        assert checker(recommendation["aspect"])
        matched = recommendation.get("matched_requirements", [])
        if matched:
            assert checker(" ".join(item if isinstance(item, str) else str(item) for item in matched))
        assert not checker(recommendation["is_number"])
        assert not checker(recommendation["status"])
