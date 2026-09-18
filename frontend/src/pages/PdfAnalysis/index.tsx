import { useEffect, useState } from 'react'
import { AlertTriangle, FileSearch, FileText, Hash, Layers3, ScanText } from 'lucide-react'
import { toast } from 'sonner'
import { PdfUploadZone } from '../../components/recommendation/PdfUploadZone'
import { FilterPanel } from '../../components/recommendation/FilterPanel'
import { ResultsList } from '../../components/recommendation/ResultsList'
import { SemanticMatchChart } from '../../components/recommendation/SemanticMatchChart'
import { SimilarityMap } from '../../components/recommendation/SimilarityMap'
import { Loader } from '../../components/common/Loader'
import { analyzePdf } from '../../services/pdfApi'
import { invalidateSearchHistory } from '../../services/standardsApi'
import { useI18n, type Lang } from '../../i18n'
import type { PdfAnalysisSummary, RecommendationFilters, RecommendationItem, SimilarityMapPoint } from '../../types/recommendation'

const NO_FILTERS: RecommendationFilters = { status: null, department: null, aspect: null }
const PDF_STATE_KEY = 'manak-bis-pdf-analysis-state'

type PdfState = {
  filters: RecommendationFilters
  summary: PdfAnalysisSummary | null
  results: RecommendationItem[]
  similarityMap: SimilarityMapPoint[]
}

const PDF_COPY: Record<Lang, Record<string, string>> = {
  en: { pageLabel: 'BIS Intelligence', title: 'PDF Analysis', description: 'Upload a specification or technical PDF to extract its structure, identify {copy(lang, 'refs')}, and find semantically relevant standards.', source: 'Source document', sourceHint: 'Text is extracted page-by-page before semantic matching.', analysis: '{copy(lang, 'analysis')}', pages: '{copy(lang, 'pages')}', readable: '{copy(lang, 'readable')}', words: '{copy(lang, 'words')}', refs: 'BIS references', notes: '{copy(lang, 'notes')}', detected: '{copy(lang, 'detected')}', none: '{copy(lang, 'none')}', sections: '{copy(lang, 'sections')}', noSections: '{copy(lang, 'noSections')}', referenced: '{copy(lang, 'referenced')}', noRefs: '{copy(lang, 'noRefs')}', details: '{copy(lang, 'details')}', ready: 'Ready for document analysis', readyDesc: 'The analysis will inspect the PDF text layer, page coverage, BIS numbers, standard sections, references, and semantic similarity.', recommended: 'Recommended standards', recommendedDesc: 'Matches generated from the extracted PDF content, detected references, and document structure.', matches: 'matches', pdfFailed: 'PDF analysis failed', standardsMatched: 'BIS standards matched', page: 'Page' },
  hi: { pageLabel: 'बीआईएस इंटेलिजेंस', title: 'पीडीएफ विश्लेषण', description: 'संरचना निकालने, BIS संदर्भ पहचानने और अर्थपूर्ण रूप से प्रासंगिक मानक खोजने के लिए विनिर्देश या तकनीकी PDF अपलोड करें।', source: 'स्रोत दस्तावेज़', sourceHint: 'सिमेंटिक मिलान से पहले पाठ को पृष्ठ-दर-पृष्ठ निकाला जाता है।', analysis: 'दस्तावेज़ विश्लेषण', pages: 'पृष्ठ', readable: 'पठनीय पृष्ठ', words: 'निकाले गए शब्द', refs: 'BIS संदर्भ', notes: 'निष्कर्षण टिप्पणियाँ', detected: 'पहचाने गए BIS मानक', none: 'कोई नहीं मिला', sections: 'दस्तावेज़ अनुभाग', noSections: 'मानक अनुभाग शीर्षक नहीं मिले', referenced: 'संदर्भित मानक', noRefs: 'कोई IS संदर्भ नहीं मिला', details: 'पृष्ठ निष्कर्षण विवरण', ready: 'दस्तावेज़ विश्लेषण के लिए तैयार', readyDesc: 'विश्लेषण PDF टेक्स्ट लेयर, पृष्ठ कवरेज, BIS नंबर, मानक अनुभाग, संदर्भ और सिमेंटिक समानता की जाँच करेगा।', recommended: 'अनुशंसित मानक', recommendedDesc: 'निकाले गए PDF कंटेंट, पहचाने गए संदर्भों और दस्तावेज़ संरचना से मिलान तैयार किए गए हैं।', matches: 'मिलान', pdfFailed: 'PDF विश्लेषण विफल हुआ', standardsMatched: 'BIS मानक मिले', page: 'पृष्ठ' },
  ta: { pageLabel: 'BIS நுண்ணறிவு', title: 'PDF பகுப்பாய்வு', description: 'கட்டமைப்பை பிரித்தெடுக்கவும், BIS குறிப்புகளை அடையாளம் காணவும், பொருத்தமான தரநிலைகளைக் கண்டறியவும் PDF ஐ பதிவேற்றவும்.', source: 'மூல ஆவணம்', sourceHint: 'சொற்பொருள் பொருத்தத்திற்கு முன் உரை ஒவ்வொரு பக்கமாக பிரித்தெடுக்கப்படுகிறது.', analysis: 'ஆவண பகுப்பாய்வு', pages: 'பக்கங்கள்', readable: 'படிக்கக்கூடிய பக்கங்கள்', words: 'பிரித்தெடுக்கப்பட்ட சொற்கள்', refs: 'BIS குறிப்புகள்', notes: 'பிரித்தெடுப்பு குறிப்புகள்', detected: 'கண்டறியப்பட்ட BIS தரநிலைகள்', none: 'எதுவும் கண்டறியப்படவில்லை', sections: 'ஆவணப் பிரிவுகள்', noSections: 'தரநிலைப் பிரிவு தலைப்புகள் எதுவும் கண்டறியப்படவில்லை', referenced: 'குறிப்பிடப்பட்ட தரநிலைகள்', noRefs: 'IS குறிப்புகள் எதுவும் கண்டறியப்படவில்லை', details: 'பக்கப் பிரித்தெடுப்பு விவரங்கள்', ready: 'ஆவணப் பகுப்பாய்வுக்குத் தயார்', readyDesc: 'PDF உரை அடுக்கு, பக்கக் கவரேஜ், BIS எண்கள், பிரிவுகள், குறிப்புகள் மற்றும் சொற்பொருள் ஒற்றுமையை பகுப்பாய்வு செய்யும்.', recommended: 'பரிந்துரைக்கப்பட்ட தரநிலைகள்', recommendedDesc: 'பிரித்தெடுக்கப்பட்ட PDF உள்ளடக்கம் மற்றும் கண்டறியப்பட்ட குறிப்புகளிலிருந்து பொருத்தங்கள் உருவாக்கப்பட்டன.', matches: 'பொருத்தங்கள்', pdfFailed: 'PDF பகுப்பாய்வு தோல்வியடைந்தது', standardsMatched: 'BIS தரநிலைகள் பொருந்தின', page: 'பக்கம்' },
  bn: { pageLabel: 'BIS ইন্টেলিজেন্স', title: 'PDF বিশ্লেষণ', description: 'কাঠামো বের করতে, BIS রেফারেন্স শনাক্ত করতে এবং প্রাসঙ্গিক মান খুঁজতে PDF আপলোড করুন।', source: 'উৎস নথি', sourceHint: 'সেমান্টিক মিলের আগে প্রতি পৃষ্ঠা থেকে পাঠ্য বের করা হয়।', analysis: 'নথি বিশ্লেষণ', pages: 'পৃষ্ঠা', readable: 'পাঠযোগ্য পৃষ্ঠা', words: 'নিষ্কাশিত শব্দ', refs: 'BIS রেফারেন্স', notes: 'নিষ্কাশন নোট', detected: 'শনাক্ত BIS মান', none: 'কিছু পাওয়া যায়নি', sections: 'নথির বিভাগ', noSections: 'মানের বিভাগ শিরোনাম শনাক্ত হয়নি', referenced: 'উল্লেখিত মান', noRefs: 'কোনও IS রেফারেন্স শনাক্ত হয়নি', details: 'পৃষ্ঠা নিষ্কাশন বিবরণ', ready: 'নথি বিশ্লেষণের জন্য প্রস্তুত', readyDesc: 'PDF টেক্সট স্তর, পৃষ্ঠা কভারেজ, BIS নম্বর, বিভাগ, রেফারেন্স এবং সেমান্টিক সাদৃশ্য পরীক্ষা করবে।', recommended: 'প্রস্তাবিত মান', recommendedDesc: 'নিষ্কাশিত PDF বিষয়বস্তু ও শনাক্ত রেফারেন্স থেকে মিল তৈরি হয়েছে।', matches: 'মিল', pdfFailed: 'PDF বিশ্লেষণ ব্যর্থ হয়েছে', standardsMatched: 'BIS মান মিলে গেছে', page: 'পৃষ্ঠা' },
  te: { pageLabel: 'BIS ఇంటెలిజెన్స్', title: 'PDF విశ్లేషణ', description: 'నిర్మాణాన్ని వెలికితీయడానికి, BIS సూచనలను గుర్తించడానికి మరియు సంబంధిత ప్రమాణాలను కనుగొనడానికి PDF ను అప్‌లోడ్ చేయండి.', source: 'మూల పత్రం', sourceHint: 'సెమాంటిక్ మ్యాచ్‌కు ముందు ప్రతి పేజీ నుంచి వచనం వెలికితీయబడుతుంది.', analysis: 'పత్ర విశ్లేషణ', pages: 'పేజీలు', readable: 'చదవగల పేజీలు', words: 'వెలికితీసిన పదాలు', refs: 'BIS సూచనలు', notes: 'వెలికితీత గమనికలు', detected: 'గుర్తించిన BIS ప్రమాణాలు', none: 'ఏవీ గుర్తించబడలేదు', sections: 'పత్ర విభాగాలు', noSections: 'ప్రమాణ విభాగ శీర్షికలు గుర్తించబడలేదు', referenced: 'సూచించిన ప్రమాణాలు', noRefs: 'IS సూచనలు ఏవీ గుర్తించబడలేదు', details: 'పేజీ వెలికితీత వివరాలు', ready: 'పత్ర విశ్లేషణకు సిద్ధం', readyDesc: 'PDF టెక్స్ట్ లేయర్, పేజీ కవరేజ్, BIS సంఖ్యలు, విభాగాలు, సూచనలు మరియు సెమాంటిక్ సారూప్యతను పరిశీలిస్తుంది.', recommended: 'సిఫార్సు చేసిన ప్రమాణాలు', recommendedDesc: 'వెలికితీసిన PDF కంటెంట్ మరియు గుర్తించిన సూచనల నుంచి మ్యాచ్‌లు రూపొందించబడ్డాయి.', matches: 'మ్యాచ్‌లు', pdfFailed: 'PDF విశ్లేషణ విఫలమైంది', standardsMatched: 'BIS ప్రమాణాలు సరిపోలాయి', page: 'పేజీ' },
  mr: { pageLabel: 'BIS इंटेलिजन्स', title: 'PDF विश्लेषण', description: 'रचना काढण्यासाठी, BIS संदर्भ ओळखण्यासाठी आणि संबंधित मानके शोधण्यासाठी PDF अपलोड करा.', source: 'स्रोत दस्तऐवज', sourceHint: 'सिमेंटिक जुळणीपूर्वी मजकूर प्रत्येक पानातून काढला जातो.', analysis: 'दस्तऐवज विश्लेषण', pages: 'पाने', readable: 'वाचनीय पाने', words: 'काढलेले शब्द', refs: 'BIS संदर्भ', notes: 'निष्कर्षण नोंदी', detected: 'आढळलेली BIS मानके', none: 'काहीही आढळले नाही', sections: 'दस्तऐवज विभाग', noSections: 'मानक विभागांची शीर्षके आढळली नाहीत', referenced: 'संदर्भित मानके', noRefs: 'IS संदर्भ आढळले नाहीत', details: 'पान निष्कर्षण तपशील', ready: 'दस्तऐवज विश्लेषणासाठी तयार', readyDesc: 'PDF मजकूर स्तर, पानांचे कव्हरेज, BIS क्रमांक, विभाग, संदर्भ आणि सिमेंटिक साम्य तपासेल.', recommended: 'शिफारस केलेली मानके', recommendedDesc: 'काढलेल्या PDF मजकुरातून आणि आढळलेल्या संदर्भांमधून जुळण्या तयार केल्या आहेत.', matches: 'जुळण्या', pdfFailed: 'PDF विश्लेषण अयशस्वी झाले', standardsMatched: 'BIS मानके जुळली', page: 'पान' },
  gu: { pageLabel: 'BIS ઇન્ટેલિજન્સ', title: 'PDF વિશ્લેષણ', description: 'રચના કાઢવા, BIS સંદર્ભો ઓળખવા અને સંબંધિત ધોરણો શોધવા માટે PDF અપલોડ કરો.', source: 'સ્ત્રોત દસ્તાવેજ', sourceHint: 'સેમેન્ટિક મેચિંગ પહેલાં દરેક પાનામાંથી ટેક્સ્ટ કાઢવામાં આવે છે.', analysis: 'દસ્તાવેજ વિશ્લેષણ', pages: 'પૃષ્ઠો', readable: 'વાંચી શકાય તેવા પૃષ્ઠો', words: 'કાઢેલા શબ્દો', refs: 'BIS સંદર્ભો', notes: 'નિષ્કર્ષણ નોંધો', detected: 'ઓળખાયેલા BIS ધોરણો', none: 'કંઈ મળ્યું નથી', sections: 'દસ્તાવેજ વિભાગો', noSections: 'ધોરણ વિભાગના શીર્ષકો મળ્યા નથી', referenced: 'સંદર્ભિત ધોરણો', noRefs: 'કોઈ IS સંદર્ભ મળ્યો નથી', details: 'પૃષ્ઠ નિષ્કર્ષણ વિગતો', ready: 'દસ્તાવેજ વિશ્લેષણ માટે તૈયાર', readyDesc: 'PDF ટેક્સ્ટ સ્તર, પૃષ્ઠ કવરેજ, BIS નંબરો, વિભાગો, સંદર્ભો અને સેમેન્ટિક સમાનતા તપાસશે.', recommended: 'ભલામણ કરેલ ધોરણો', recommendedDesc: 'કાઢેલા PDF વિષયવસ્તુ અને ઓળખાયેલા સંદર્ભોમાંથી મેચ તૈયાર કરવામાં આવ્યા છે.', matches: 'મેચ', pdfFailed: 'PDF વિશ્લેષણ નિષ્ફળ થયું', standardsMatched: 'BIS ધોરણો મળ્યા', page: 'પૃષ્ઠ' },
  kn: { pageLabel: 'BIS ಇಂಟೆಲಿಜೆನ್ಸ್', title: 'PDF ವಿಶ್ಲೇಷಣೆ', description: 'ರಚನೆಯನ್ನು ಹೊರತೆಗೆಯಲು, BIS ಉಲ್ಲೇಖಗಳನ್ನು ಗುರುತಿಸಲು ಮತ್ತು ಸಂಬಂಧಿತ ಮಾನದಂಡಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು PDF ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.', source: 'ಮೂಲ ದಾಖಲೆ', sourceHint: 'ಸೆಮ್ಯಾಂಟಿಕ್ ಹೊಂದಾಣಿಕೆಯ ಮೊದಲು ಪ್ರತಿ ಪುಟದಿಂದ ಪಠ್ಯವನ್ನು ಹೊರತೆಗೆಯಲಾಗುತ್ತದೆ.', analysis: 'ದಾಖಲೆ ವಿಶ್ಲೇಷಣೆ', pages: 'ಪುಟಗಳು', readable: 'ಓದಬಹುದಾದ ಪುಟಗಳು', words: 'ಹೊರತೆಗೆಯಲಾದ ಪದಗಳು', refs: 'BIS ಉಲ್ಲೇಖಗಳು', notes: 'ಹೊರತೆಗೆಯುವ ಟಿಪ್ಪಣಿಗಳು', detected: 'ಪತ್ತೆಯಾದ BIS ಮಾನದಂಡಗಳು', none: 'ಯಾವುದೂ ಪತ್ತೆಯಾಗಿಲ್ಲ', sections: 'ದಾಖಲೆ ವಿಭಾಗಗಳು', noSections: 'ಮಾನದಂಡ ವಿಭಾಗದ ಶೀರ್ಷಿಕೆಗಳು ಪತ್ತೆಯಾಗಿಲ್ಲ', referenced: 'ಉಲ್ಲೇಖಿತ ಮಾನದಂಡಗಳು', noRefs: 'ಯಾವುದೇ IS ಉಲ್ಲೇಖಗಳು ಪತ್ತೆಯಾಗಿಲ್ಲ', details: 'ಪುಟ ಹೊರತೆಗೆಯುವ ವಿವರಗಳು', ready: 'ದಾಖಲೆ ವಿಶ್ಲೇಷಣೆಗೆ ಸಿದ್ಧ', readyDesc: 'PDF ಪಠ್ಯ ಪದರ, ಪುಟ ವ್ಯಾಪ್ತಿ, BIS ಸಂಖ್ಯೆಗಳು, ವಿಭಾಗಗಳು, ಉಲ್ಲೇಖಗಳು ಮತ್ತು ಸೆಮ್ಯಾಂಟಿಕ್ ಸಾಮ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ.', recommended: 'ಶಿಫಾರಸು ಮಾಡಿದ ಮಾನದಂಡಗಳು', recommendedDesc: 'ಹೊರತೆಗೆಯಲಾದ PDF ವಿಷಯ ಮತ್ತು ಪತ್ತೆಯಾದ ಉಲ್ಲೇಖಗಳಿಂದ ಹೊಂದಾಣಿಕೆಗಳನ್ನು ರಚಿಸಲಾಗಿದೆ.', matches: 'ಹೊಂದಾಣಿಕೆಗಳು', pdfFailed: 'PDF ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ', standardsMatched: 'BIS ಮಾನದಂಡಗಳು ಹೊಂದಿಕೆಯಾಗಿವೆ', page: 'ಪುಟ' },
  ml: { pageLabel: 'BIS ഇന്റലിജൻസ്', title: 'PDF വിശകലനം', description: 'ഘടന പുറത്തെടുക്കാനും BIS റഫറൻസുകൾ തിരിച്ചറിയാനും പ്രസക്തമായ മാനദണ്ഡങ്ങൾ കണ്ടെത്താനും PDF അപ്‌ലോഡ് ചെയ്യുക.', source: 'ഉറവിട രേഖ', sourceHint: 'സെമാന്റിക് പൊരുത്തത്തിന് മുമ്പ് ഓരോ പേജിൽ നിന്നും ടെക്സ്റ്റ് പുറത്തെടുക്കുന്നു.', analysis: 'രേഖാ വിശകലനം', pages: 'പേജുകൾ', readable: 'വായിക്കാവുന്ന പേജുകൾ', words: 'പുറത്തെടുത്ത വാക്കുകൾ', refs: 'BIS റഫറൻസുകൾ', notes: 'എക്സ്ട്രാക്ഷൻ കുറിപ്പുകൾ', detected: 'കണ്ടെത്തിയ BIS മാനദണ്ഡങ്ങൾ', none: 'ഒന്നും കണ്ടെത്തിയില്ല', sections: 'രേഖാ വിഭാഗങ്ങൾ', noSections: 'മാനദണ്ഡ വിഭാഗ തലക്കെട്ടുകളൊന്നും കണ്ടെത്തിയില്ല', referenced: 'പരാമർശിച്ച മാനദണ്ഡങ്ങൾ', noRefs: 'IS റഫറൻസുകളൊന്നും കണ്ടെത്തിയില്ല', details: 'പേജ് എക്സ്ട്രാക്ഷൻ വിശദാംശങ്ങൾ', ready: 'രേഖാ വിശകലനത്തിന് തയ്യാറാണ്', readyDesc: 'PDF ടെക്സ്റ്റ് ലെയർ, പേജ് കവറേജ്, BIS നമ്പറുകൾ, വിഭാഗങ്ങൾ, റഫറൻസുകൾ, സെമാന്റിക് സാമ്യം എന്നിവ പരിശോധിക്കും.', recommended: 'ശുപാർശ ചെയ്ത മാനദണ്ഡങ്ങൾ', recommendedDesc: 'എക്സ്ട്രാക്റ്റ് ചെയ്ത PDF ഉള്ളടക്കത്തിൽ നിന്നും കണ്ടെത്തിയ റഫറൻസുകളിൽ നിന്നും പൊരുത്തങ്ങൾ സൃഷ്ടിച്ചു.', matches: 'പൊരുത്തങ്ങൾ', pdfFailed: 'PDF വിശകലനം പരാജയപ്പെട്ടു', standardsMatched: 'BIS മാനദണ്ഡങ്ങൾ പൊരുത്തപ്പെട്ടു', page: 'പേജ്' },
  pa: { pageLabel: 'BIS ਇੰਟੈਲੀਜੈਂਸ', title: 'PDF ਵਿਸ਼ਲੇਸ਼ਣ', description: 'ਢਾਂਚਾ ਕੱਢਣ, BIS ਹਵਾਲਿਆਂ ਦੀ ਪਛਾਣ ਕਰਨ ਅਤੇ ਸੰਬੰਧਿਤ ਮਿਆਰ ਲੱਭਣ ਲਈ PDF ਅਪਲੋਡ ਕਰੋ।', source: 'ਸਰੋਤ ਦਸਤਾਵੇਜ਼', sourceHint: 'ਸੈਮੈਂਟਿਕ ਮਿਲਾਣ ਤੋਂ ਪਹਿਲਾਂ ਹਰ ਪੰਨੇ ਤੋਂ ਪਾਠ ਕੱਢਿਆ ਜਾਂਦਾ ਹੈ।', analysis: 'ਦਸਤਾਵੇਜ਼ ਵਿਸ਼ਲੇਸ਼ਣ', pages: 'ਪੰਨੇ', readable: 'ਪੜ੍ਹਨਯੋਗ ਪੰਨੇ', words: 'ਕੱਢੇ ਗਏ ਸ਼ਬਦ', refs: 'BIS ਹਵਾਲੇ', notes: 'ਨਿਕਾਸ ਨੋਟਸ', detected: 'ਪਛਾਣੇ ਗਏ BIS ਮਿਆਰ', none: 'ਕੁਝ ਨਹੀਂ ਮਿਲਿਆ', sections: 'ਦਸਤਾਵੇਜ਼ ਭਾਗ', noSections: 'ਮਿਆਰੀ ਭਾਗਾਂ ਦੇ ਸਿਰਲੇਖ ਨਹੀਂ ਮਿਲੇ', referenced: 'ਹਵਾਲਾ ਦਿੱਤੇ ਮਿਆਰ', noRefs: 'ਕੋਈ IS ਹਵਾਲਾ ਨਹੀਂ ਮਿਲਿਆ', details: 'ਪੰਨਾ ਨਿਕਾਸ ਵੇਰਵੇ', ready: 'ਦਸਤਾਵੇਜ਼ ਵਿਸ਼ਲੇਸ਼ਣ ਲਈ ਤਿਆਰ', readyDesc: 'PDF ਟੈਕਸਟ ਲੇਅਰ, ਪੰਨਾ ਕਵਰੇਜ, BIS ਨੰਬਰ, ਭਾਗ, ਹਵਾਲੇ ਅਤੇ ਸੈਮੈਂਟਿਕ ਸਮਾਨਤਾ ਦੀ ਜਾਂਚ ਕਰੇਗਾ।', recommended: 'ਸਿਫ਼ਾਰਸ਼ ਕੀਤੇ ਮਿਆਰ', recommendedDesc: 'ਕੱਢੀ PDF ਸਮੱਗਰੀ ਅਤੇ ਪਛਾਣੇ ਹਵਾਲਿਆਂ ਤੋਂ ਮੇਲ ਬਣਾਏ ਗਏ ਹਨ।', matches: 'ਮੇਲ', pdfFailed: 'PDF ਵਿਸ਼ਲੇਸ਼ਣ ਅਸਫਲ ਰਿਹਾ', standardsMatched: 'BIS ਮਿਆਰ ਮਿਲੇ', page: 'ਪੰਨਾ' },
  or: { pageLabel: 'BIS ଇଣ୍ଟେଲିଜେନ୍ସ', title: 'PDF ବିଶ୍ଳେଷଣ', description: 'ଗଠନ ବାହାର କରିବା, BIS ସନ୍ଦର୍ଭ ଚିହ୍ନଟ କରିବା ଏବଂ ସମ୍ପର୍କିତ ମାନକ ଖୋଜିବା ପାଇଁ PDF ଅପଲୋଡ କରନ୍ତୁ।', source: 'ମୂଳ ଦଲିଲ', sourceHint: 'ସେମାଣ୍ଟିକ ମେଳ ପୂର୍ବରୁ ପ୍ରତ୍ୟେକ ପୃଷ୍ଠାରୁ ପାଠ୍ୟ ବାହାର କରାଯାଏ।', analysis: 'ଦଲିଲ ବିଶ୍ଳେଷଣ', pages: 'ପୃଷ୍ଠା', readable: 'ପଢ଼ିହେବା ପୃଷ୍ଠା', words: 'ବାହାର କରାଯାଇଥିବା ଶବ୍ଦ', refs: 'BIS ସନ୍ଦର୍ଭ', notes: 'ନିଷ୍କାଷଣ ଟିପ୍ପଣୀ', detected: 'ଚିହ୍ନଟ BIS ମାନକ', none: 'କିଛି ମିଳିଲା ନାହିଁ', sections: 'ଦଲିଲ ବିଭାଗ', noSections: 'ମାନକ ବିଭାଗ ଶୀର୍ଷକ ଚିହ୍ନଟ ହୋଇନାହିଁ', referenced: 'ସନ୍ଦର୍ଭିତ ମାନକ', noRefs: 'କୌଣସି IS ସନ୍ଦର୍ଭ ଚିହ୍ନଟ ହୋଇନାହିଁ', details: 'ପୃଷ୍ଠା ନିଷ୍କାଷଣ ବିବରଣୀ', ready: 'ଦଲିଲ ବିଶ୍ଳେଷଣ ପାଇଁ ପ୍ରସ୍ତୁତ', readyDesc: 'PDF ଟେକ୍ସଟ୍ ଲେୟର, ପୃଷ୍ଠା କଭରେଜ୍, BIS ନମ୍ବର, ବିଭାଗ, ସନ୍ଦର୍ଭ ଏବଂ ସେମାଣ୍ଟିକ ସାମ୍ୟତା ଯାଞ୍ଚ କରିବ।', recommended: 'ସୁପାରିଶ କରାଯାଇଥିବା ମାନକ', recommendedDesc: 'ବାହାର କରାଯାଇଥିବା PDF ବିଷୟବସ୍ତୁ ଏବଂ ଚିହ୍ନଟ ସନ୍ଦର୍ଭରୁ ମେଳ ସୃଷ୍ଟି ହୋଇଛି।', matches: 'ମେଳ', pdfFailed: 'PDF ବିଶ୍ଳେଷଣ ବିଫଳ', standardsMatched: 'BIS ମାନକ ମେଳିଲା', page: 'ପୃଷ୍ଠା' },
  ur: { pageLabel: 'BIS انٹیلی جنس', title: 'PDF تجزیہ', description: 'ساخت نکالنے، BIS حوالہ جات کی شناخت اور معنوی طور پر متعلقہ معیارات تلاش کرنے کے لیے وضاحتی یا تکنیکی PDF اپ لوڈ کریں۔', source: 'ماخذ دستاویز', sourceHint: 'معنوی مطابقت سے پہلے متن صفحہ بہ صفحہ نکالا جاتا ہے۔', analysis: 'دستاویز کا تجزیہ', pages: 'صفحات', readable: 'قابلِ مطالعہ صفحات', words: 'اخذ کردہ الفاظ', refs: 'BIS حوالہ جات', notes: 'اخذ کرنے کے نوٹس', detected: 'شناخت شدہ BIS معیارات', none: 'کچھ نہیں ملا', sections: 'دستاویز کے حصے', noSections: 'معیاری حصوں کے عنوانات نہیں ملے', referenced: 'حوالہ دیے گئے معیارات', noRefs: 'کوئی IS حوالہ نہیں ملا', details: 'صفحہ وار اخراج کی تفصیلات', ready: 'دستاویز کے تجزیے کے لیے تیار', readyDesc: 'تجزیہ PDF ٹیکسٹ لیئر، صفحہ کوریج، BIS نمبرز، معیاری حصوں، حوالہ جات اور معنوی مماثلت کا جائزہ لے گا۔', recommended: 'تجویز کردہ معیارات', recommendedDesc: 'اخذ کردہ PDF مواد، شناخت شدہ حوالہ جات اور دستاویز کی ساخت سے مماثلتیں تیار کی گئی ہیں۔', matches: 'مماثلتیں', pdfFailed: 'PDF تجزیہ ناکام ہوگیا', standardsMatched: 'BIS معیارات ملے', page: 'صفحہ' },
}
function copy(lang: Lang, key: string): string {
  return PDF_COPY[lang][key] ?? PDF_COPY.en[key] ?? key
}


function Stat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-2/30 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </div>
      <div className="mt-2 font-display text-xl font-semibold text-slate-100">{value}</div>
    </div>
  )
}

function AnalysisSummary({ summary, lang }: { summary: PdfAnalysisSummary; lang: Lang }) {
  return (
    <div className="panel space-y-5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <FileSearch className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-slate-100">Document analysis</h2>
          <p className="mt-1 truncate font-mono text-xs text-slate-500">{summary.file_name}</p>
          {summary.document_title && <p className="mt-2 text-sm text-slate-300">{summary.document_title}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={FileText} label="Pages" value={summary.page_count} />
        <Stat icon={ScanText} label="Readable pages" value={`${summary.readable_pages}/${summary.page_count}`} />
        <Stat icon={Hash} label="Words extracted" value={summary.word_count.toLocaleString()} />
        <Stat icon={Layers3} label="BIS references" value={summary.detected_references.length} />
      </div>
      {summary.extraction_warnings.length > 0 && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300"><AlertTriangle className="h-4 w-4" /> Extraction notes</div>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">{summary.extraction_warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-hairline bg-surface-2/20 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Detected BIS standards</h3>
          <div className="mt-3 flex flex-wrap gap-2">{summary.detected_is_numbers.length ? summary.detected_is_numbers.map((item) => <span key={item} className="rounded-md border border-accent/20 bg-accent/5 px-2 py-1 font-mono text-[11px] text-accent">{item}</span>) : <span className="text-xs text-slate-600">None detected</span>}</div>
        </div>
        <div className="rounded-xl border border-hairline bg-surface-2/20 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Document sections</h3>
          <div className="mt-3 flex flex-wrap gap-2">{summary.detected_sections.length ? summary.detected_sections.map((item) => <span key={item} className="rounded-md border border-hairline bg-surface px-2 py-1 text-[11px] text-slate-300">{item}</span>) : <span className="text-xs text-slate-600">No standard section headings detected</span>}</div>
        </div>
        <div className="rounded-xl border border-hairline bg-surface-2/20 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Referenced standards</h3>
          <div className="mt-3 flex flex-wrap gap-2">{summary.detected_references.length ? summary.detected_references.map((item) => <span key={item} className="rounded-md border border-hairline bg-surface px-2 py-1 font-mono text-[11px] text-slate-300">{item}</span>) : <span className="text-xs text-slate-600">No IS references detected</span>}</div>
        </div>
      </div>
      {summary.pages.length > 0 && (
        <details className="group rounded-xl border border-hairline bg-surface-2/20">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-300">Page extraction details</summary>
          <div className="border-t border-hairline px-4 pb-4"><div className="divide-y divide-hairline">{summary.pages.map((page) => <div key={page.page} className="grid gap-2 py-3 md:grid-cols-[80px_100px_1fr]"><span className="text-xs font-semibold text-slate-400">{copy(lang, 'page')} {page.page}</span><span className="font-mono text-[11px] text-slate-600">{page.characters.toLocaleString()} chars</span><span className="text-xs leading-5 text-slate-500">{page.preview}</span></div>)}</div></div>
        </details>
      )}
    </div>
  )
}

export default function PdfAnalysis() {
  const { t, lang } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [filters, setFilters] = useState<RecommendationFilters>(NO_FILTERS)
  const [summary, setSummary] = useState<PdfAnalysisSummary | null>(null)
  const [results, setResults] = useState<RecommendationItem[]>([])
  const [similarityMap, setSimilarityMap] = useState<SimilarityMapPoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PDF_STATE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as PdfState
      setFilters(saved.filters || NO_FILTERS)
      setSummary(saved.summary || null)
      setResults(saved.results || [])
      setSimilarityMap(saved.similarityMap || [])
    } catch {
      sessionStorage.removeItem(PDF_STATE_KEY)
    }
  }, [])

  async function runAnalysis() {
    if (!file) return
    setLoading(true)
    setSummary(null)
    setResults([])
    setSimilarityMap([])
    try {
      const response = await analyzePdf(file, filters, lang)
      setSummary(response.pdf_analysis ?? null)
      setResults(response.recommendations ?? [])
      setSimilarityMap(response.similarity_map ?? [])
      try { sessionStorage.setItem(PDF_STATE_KEY, JSON.stringify({ filters, summary: response.pdf_analysis ?? null, results: response.recommendations ?? [], similarityMap: response.similarity_map ?? [] })) } catch {}
      invalidateSearchHistory()
      toast.success(`${response.recommendations.length} ${copy(lang, 'standardsMatched')}`)
    } catch (error) {
      console.error(error)
      toast.error(copy(lang, 'pdfFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-testid="pdf-analysis-page" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{copy(lang, 'pageLabel')}</p><h1 className="mt-2 font-display text-2xl font-bold text-slate-100">{copy(lang, 'title')}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{copy(lang, 'description')}</p></div></div>
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-5"><div className="panel space-y-4 p-5"><div><h2 className="font-display text-sm font-semibold text-slate-200">{copy(lang, "source")}</h2><p className="mt-1 text-xs text-slate-600">{copy(lang, "sourceHint")}</p></div><PdfUploadZone file={file} onFileChange={setFile} onAnalyze={runAnalysis} analyzing={loading} /><FilterPanel value={filters} onChange={setFilters} /></div></div>
        <div className="min-w-0 space-y-5">
          {loading ? <Loader label={t('form.matching')} /> : summary ? <><AnalysisSummary summary={summary} lang={lang} />{results.length > 0 && <SemanticMatchChart items={results} />}<div className="panel p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold text-slate-100">{copy(lang, "recommended")}</h2><p className="mt-1 text-xs text-slate-500">{copy(lang, "recommendedDesc")}</p></div><span className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 font-mono text-xs text-accent">{results.length} {copy(lang, "matches")}</span></div><div className="mt-4"><ResultsList items={results} selectedIds={new Set()} onToggleCompare={() => undefined} /></div></div><SimilarityMap points={similarityMap} /></> : <div className="panel flex min-h-[420px] flex-col items-center justify-center p-8 text-center"><FileSearch className="h-10 w-10 text-accent/60" /><h2 className="mt-4 font-display text-xl font-semibold text-slate-200">{copy(lang, "ready")}</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{copy(lang, "readyDesc")}</p></div>}
        </div>
      </div>
    </div>
  )
}
