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
    "te": {
        "Civil Engineering": "సివిల్ ఇంజినీరింగ్",
        "Textiles": "వస్త్రాలు",
        "Electronics & IT": "ఎలక్ట్రానిక్స్ & ఐటీ",
        "Food & Agriculture": "ఆహారం & వ్యవసాయం",
    },
    "mr": {
        "Civil Engineering": "स्थापत्य अभियांत्रिकी",
        "Textiles": "वस्त्रोद्योग",
        "Electronics & IT": "इलेक्ट्रॉनिक्स आणि आयटी",
        "Food & Agriculture": "अन्न आणि कृषी",
    },
    "gu": {
        "Civil Engineering": "સિવિલ એન્જિનિયરિંગ",
        "Textiles": "કાપડ",
        "Electronics & IT": "ઇલેક્ટ્રોનિક્સ અને આઈટી",
        "Food & Agriculture": "ખાદ્ય અને કૃષિ",
    },
    "kn": {
        "Civil Engineering": "ಸಿವಿಲ್ ಎಂಜಿನಿಯರಿಂಗ್",
        "Textiles": "ಜವಳಿ",
        "Electronics & IT": "ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಮತ್ತು ಐಟಿ",
        "Food & Agriculture": "ಆಹಾರ ಮತ್ತು ಕೃಷಿ",
    },
    "ml": {
        "Civil Engineering": "സിവിൽ എഞ്ചിനീയറിംഗ്",
        "Textiles": "തുണിത്തരങ്ങൾ",
        "Electronics & IT": "ഇലക്ട്രോണിക്സ് & ഐടി",
        "Food & Agriculture": "ഭക്ഷണവും കൃഷിയും",
    },
    "pa": {
        "Civil Engineering": "ਸਿਵਲ ਇੰਜੀਨੀਅਰਿੰਗ",
        "Textiles": "ਕੱਪੜਾ",
        "Electronics & IT": "ਇਲੈਕਟ੍ਰਾਨਿਕਸ ਅਤੇ ਆਈਟੀ",
        "Food & Agriculture": "ਭੋਜਨ ਅਤੇ ਖੇਤੀਬਾੜੀ",
    },
    "or": {
        "Civil Engineering": "ସିଭିଲ ଇଞ୍ଜିନିୟରିଂ",
        "Textiles": "ବସ୍ତ୍ର",
        "Electronics & IT": "ଇଲେକ୍ଟ୍ରୋନିକ୍ସ ଏବଂ ଆଇଟି",
        "Food & Agriculture": "ଖାଦ୍ୟ ଏବଂ କୃଷି",
    },
    "ur": {
        "Civil Engineering": "سول انجینئرنگ",
        "Textiles": "ٹیکسٹائل",
        "Electronics & IT": "الیکٹرانکس اور آئی ٹی",
        "Food & Agriculture": "خوراک اور زراعت",
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

ASPECT_I18N.update({
    "te": {"Specification": "స్పెసిఫికేషన్", "Methods of Test": "పరీక్షా పద్ధతులు", "Code of Practice": "ఆచరణ నియమావళి"},
    "mr": {"Specification": "विनिर्देश", "Methods of Test": "चाचणी पद्धती", "Code of Practice": "आचारसंहिता"},
    "gu": {"Specification": "વિશિષ્ટતા", "Methods of Test": "પરીક્ષણ પદ્ધતિઓ", "Code of Practice": "આચારસંહિતા"},
    "kn": {"Specification": "ವಿಶೇಷಣ", "Methods of Test": "ಪರೀಕ್ಷಾ ವಿಧಾನಗಳು", "Code of Practice": "ಅಭ್ಯಾಸ ಸಂಹಿತೆ"},
    "ml": {"Specification": "വിവരണം", "Methods of Test": "പരിശോധനാ രീതികൾ", "Code of Practice": "പ്രാക്ടീസ് കോഡ്"},
    "pa": {"Specification": "ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ", "Methods of Test": "ਟੈਸਟ ਦੇ ਤਰੀਕੇ", "Code of Practice": "ਅਭਿਆਸ ਕੋਡ"},
    "or": {"Specification": "ନିର୍ଦ୍ଦିଷ୍ଟକରଣ", "Methods of Test": "ପରୀକ୍ଷଣ ପଦ୍ଧତି", "Code of Practice": "ଅଭ୍ୟାସ ସଂହିତା"},
    "ur": {"Specification": "وضاحت", "Methods of Test": "جانچ کے طریقے", "Code of Practice": "ضابطۂ عمل"},
})


def _from_i18n(std, lang: str, field: str):
    store = std.i18n or {}
    entry = store.get(lang) if isinstance(store, dict) else None
    return entry.get(field) if isinstance(entry, dict) else None


def loc_title(std, lang: str) -> str:
    if lang == "hi" and std.title_hi:
        return std.title_hi or std.title
    return _from_i18n(std, lang, "title") or std.title


def loc_scope(std, lang: str) -> str:
    if lang == "hi":
        return std.scope_hi or std.scope
    return _from_i18n(std, lang, "scope") or std.scope


def loc_requirements(std, lang: str) -> list[str]:
    if lang == "hi":
        return std.requirements_hi or std.requirements
    return _from_i18n(std, lang, "requirements") or std.requirements


def loc_department(department, lang: str):
    if not department:
        return department
    labels = DEPARTMENT_I18N.get(lang, {})
    if department in labels:
        return labels[department]
    normalized = department.strip().upper()
    if normalized.endswith(" DEPARTMENT"):
        short = normalized.removesuffix(" DEPARTMENT").title()
        return labels.get(short, department)
    return department


def loc_aspect(aspect, lang: str):
    return ASPECT_I18N.get(lang, {}).get(aspect, aspect)


def req_map(std, lang: str) -> dict[str, str]:
    if lang == "en":
        return {}
    localized = loc_requirements(std, lang)
    if not localized:
        return {}
    return dict(zip(std.requirements or [], localized))
