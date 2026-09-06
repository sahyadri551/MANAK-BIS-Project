from __future__ import annotations

DEPARTMENT_I18N = {
    "hi": {
        "Civil Engineering": "सिविल इंजीनियरिंग",
        "Textiles": "वस्त्र",
        "Electronics & IT": "इलेक्ट्रॉनिकी एवं आईटी",
        "Food & Agriculture": "खाद्य एवं कृषि",
    },
    "ta": {
        "Civil Engineering": "கட்டட பொறியியல்",
        "Textiles": "ஜவுளி",
        "Electronics & IT": "மின்னணுவியல் & ஐடி",
        "Food & Agriculture": "உணவு & விவசாயம்",
    },
    "bn": {
        "Civil Engineering": "সিভিল ইঞ্জিনিয়ারিং",
        "Textiles": "বস্ত্র",
        "Electronics & IT": "ইলেকট্রনিক্স ও আইটি",
        "Food & Agriculture": "খাদ্য ও কৃষি",
    },
}

ASPECT_I18N = {
    "hi": {
        "Specification": "विनिर्देश",
        "Methods of Test": "परीक्षण विधियाँ",
        "Code of Practice": "आचरण संहिता",
    },
    "ta": {
        "Specification": "விவரக்குறிப்பு",
        "Methods of Test": "சோதனை முறைகள்",
        "Code of Practice": "நடைமுறை விதி",
    },
    "bn": {
        "Specification": "স্পেসিফিকেশন",
        "Methods of Test": "পরীক্ষা পদ্ধতি",
        "Code of Practice": "অনুশীলন বিধি",
    },
}


def _from_i18n(std, lang: str, field: str):
    store = std.i18n or {}
    entry = store.get(lang) if isinstance(store, dict) else None
    return entry.get(field) if entry else None


def loc_title(std, lang: str) -> str:
    if lang == "hi":
        return std.title_hi or std.title
    if lang in ("ta", "bn"):
        return _from_i18n(std, lang, "title") or std.title
    return std.title


def loc_scope(std, lang: str) -> str:
    if lang == "hi":
        return std.scope_hi or std.scope
    if lang in ("ta", "bn"):
        return _from_i18n(std, lang, "scope") or std.scope
    return std.scope


def loc_requirements(std, lang: str) -> list[str]:
    if lang == "hi":
        return std.requirements_hi or std.requirements
    if lang in ("ta", "bn"):
        return _from_i18n(std, lang, "requirements") or std.requirements
    return std.requirements


def loc_department(department, lang: str):
    return DEPARTMENT_I18N.get(lang, {}).get(department, department)


def loc_aspect(aspect, lang: str):
    return ASPECT_I18N.get(lang, {}).get(aspect, aspect)


def req_map(std, lang: str) -> dict[str, str]:
    if lang == "en":
        return {}
    localized = loc_requirements(std, lang)
    if not localized:
        return {}
    return dict(zip(std.requirements or [], localized))
