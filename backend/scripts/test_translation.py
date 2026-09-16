"""
scripts/test_translation.py
────────────────────────────
Quick smoke-test for the query translation service.
Run from the backend root:

    cd backend
    python scripts/test_translation.py

Requires TRANSLATION_MODEL + the matching API key to be set in your .env.
"""

import sys
import os

# Load .env so API keys are available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv optional for this script

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.query_translation import needs_translation, translate_query_to_english

TEST_CASES = [
    # (input_query, should_need_translation)
    ("cement strength standard 43 MPa",                   False),  # pure English
    ("सीमेंट की मजबूती मानक",                             True),   # pure Hindi
    ("मुझे lithium battery safety standard चाहिए",         True),   # Hindi + English mix
    ("packaged drinking water pH turbidity",               False),  # English
    ("ஜவுளி தரம் பரிசோதனை முறைகள்",                       True),   # Tamil
    ("cotton thread breaking strength",                    False),  # English
    ("পানীয় জলের গুণমান মান",                              True),   # Bengali
]

print(f"{'Query':<50} {'Needs?':>7}  {'Result'}")
print("-" * 100)

all_passed = True
for query, expected_needs in TEST_CASES:
    detected = needs_translation(query)
    translated = translate_query_to_english(query)

    status = "✓" if detected == expected_needs else "✗"
    if detected != expected_needs:
        all_passed = False

    print(f"{status} {query[:48]:<50} {str(detected):>7}  →  {translated}")

print()
print("All detection tests passed ✓" if all_passed else "Some detection tests FAILED ✗")
