import { useRef, type FormEvent } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { VoiceInput } from '../common/VoiceInput'
import { useI18n } from '../../i18n'

type SampleMap = Record<string, [string, string, string, string]>

const SAMPLES: SampleMap = {
  en: [
    '43 grade OPC cement for RCC slab, 28-day compressive strength 43 MPa, low chloride',
    'Cotton sewing thread with high breaking strength and colour fastness to washing',
    'Lithium-ion battery pack safety for portable device, overcharge and short-circuit protection',
    'Packaged drinking water quality limits — pH, turbidity, microbial and arsenic',
  ],
  hi: [
    'RCC स्लैब के लिए 43 ग्रेड OPC सीमेंट, 28-दिन संपीड़न शक्ति 43 MPa, कम क्लोराइड',
    'उच्च ब्रेकिंग स्ट्रेंथ और धुलाई के प्रति रंग स्थायित्व वाला सूती सिलाई धागा',
    'पोर्टेबल डिवाइस के लिए लिथियम-आयन बैटरी पैक सुरक्षा, ओवरचार्ज और शॉर्ट-सर्किट सुरक्षा',
    'पैकेज्ड पेयजल की गुणवत्ता सीमा — pH, टर्बिडिटी, सूक्ष्मजीव और आर्सेनिक',
  ],
  bn: [
    'RCC স্ল্যাবের জন্য 43 গ্রেড OPC সিমেন্ট, 28 দিনের সংকোচন শক্তি 43 MPa, কম ক্লোরাইড',
    'উচ্চ ব্রেকিং শক্তি এবং ধোয়ার ক্ষেত্রে রঙের স্থায়িত্বযুক্ত সুতির সেলাই সুতো',
    'পোর্টেবল ডিভাইসের জন্য লিথিয়াম-আয়ন ব্যাটারি প্যাক নিরাপত্তা, অতিরিক্ত চার্জ ও শর্ট-সার্কিট সুরক্ষা',
    'প্যাকেটজাত পানীয় জলের গুণমানের সীমা — pH, ঘোলাভাব, জীবাণু ও আর্সেনিক',
  ],
  te: [
    'RCC స్లాబ్ కోసం 43 గ్రేడ్ OPC సిమెంట్, 28-రోజుల సంపీడన బలం 43 MPa, తక్కువ క్లోరైడ్',
    'అధిక బ్రేకింగ్ బలం మరియు ఉతికే సమయంలో రంగు స్థిరత్వం కలిగిన కాటన్ కుట్టు దారం',
    'పోర్టబుల్ పరికరం కోసం లిథియం-అయాన్ బ్యాటరీ ప్యాక్ భద్రత, ఓవర్‌చార్జ్ మరియు షార్ట్-సర్క్యూట్ రక్షణ',
    'ప్యాకేజ్డ్ తాగునీటి నాణ్యత పరిమితులు — pH, టర్బిడిటీ, సూక్ష్మజీవులు మరియు ఆర్సెనిక్',
  ],
  mr: [
    'RCC स्लॅबसाठी 43 ग्रेड OPC सिमेंट, 28 दिवसांची संपीडन शक्ती 43 MPa, कमी क्लोराइड',
    'उच्च ब्रेकिंग स्ट्रेंथ आणि धुण्याच्या वेळी रंगाची टिकाऊपणा असलेला कापूस शिवण धागा',
    'पोर्टेबल उपकरणासाठी लिथियम-आयन बॅटरी पॅक सुरक्षा, ओव्हरचार्ज आणि शॉर्ट-सर्किट संरक्षण',
    'पॅकेज्ड पिण्याच्या पाण्याच्या गुणवत्तेच्या मर्यादा — pH, गढूळपणा, सूक्ष्मजीव आणि आर्सेनिक',
  ],
  ta: [
    'RCC ஸ்லாபுக்கான 43 கிரேடு OPC சிமெண்டு, 28 நாள் அழுத்த வலிமை 43 MPa, குறைந்த குளோரைடு',
    'அதிக முறிவு வலிமை மற்றும் கழுவுதலுக்கான நிறத் தாங்குதன்மை கொண்ட பருத்தி தையல் நூல்',
    'கையடக்க சாதனத்திற்கான லித்தியம்-அயன் பேட்டரி பேக் பாதுகாப்பு, அதிக மின்னேற்றம் மற்றும் ஷார்ட்-சர்க்யூட் பாதுகாப்பு',
    'பேக்கேஜ் செய்யப்பட்ட குடிநீரின் தர வரம்புகள் — pH, கலங்கல், நுண்ணுயிரிகள் மற்றும் ஆர்சனிக்',
  ],
  ur: [
    'RCC سلیب کے لیے 43 گریڈ OPC سیمنٹ، 28 دن کی کمپریسیو طاقت 43 MPa، کم کلورائیڈ',
    'زیادہ بریکنگ طاقت اور دھلائی کے دوران رنگ کی پائیداری والا سوتی سلائی دھاگا',
    'پورٹیبل ڈیوائس کے لیے لیتھیم آئن بیٹری پیک کی حفاظت، اوورچارج اور شارٹ سرکٹ سے تحفظ',
    'پیک شدہ پینے کے پانی کے معیار کی حدود — pH، ٹربڈیٹی، مائکروبیل اور آرسینک',
  ],
  gu: [
    'RCC સ્લેબ માટે 43 ગ્રેડ OPC સિમેન્ટ, 28 દિવસની સંકોચન શક્તિ 43 MPa, ઓછું ક્લોરાઇડ',
    'ઉચ્ચ બ્રેકિંગ સ્ટ્રેન્થ અને ધોવા દરમિયાન રંગની સ્થિરતા ધરાવતો કોટન સિલાઈ દોરો',
    'પોર્ટેબલ ઉપકરણ માટે લિથિયમ-આયન બેટરી પેક સલામતી, ઓવરચાર્જ અને શોર્ટ-સર્કિટ સુરક્ષા',
    'પેકેજ્ડ પીવાના પાણીની ગુણવત્તા મર્યાદાઓ — pH, ટર્બિડિટી, માઇક્રોબિયલ અને આર્સેનિક',
  ],
  kn: [
    'RCC ಸ್ಲ್ಯಾಬ್‌ಗಾಗಿ 43 ಗ್ರೇಡ್ OPC ಸಿಮೆಂಟ್, 28 ದಿನಗಳ ಸಂಕುಚನ ಶಕ್ತಿ 43 MPa, ಕಡಿಮೆ ಕ್ಲೋರೈಡ್',
    'ಹೆಚ್ಚಿನ ಬ್ರೇಕಿಂಗ್ ಸಾಮರ್ಥ್ಯ ಮತ್ತು ತೊಳೆಯುವಾಗ ಬಣ್ಣದ ಸ್ಥಿರತೆ ಹೊಂದಿರುವ ಹತ್ತಿ ಹೊಲಿಗೆ ದಾರ',
    'ಪೋರ್ಟಬಲ್ ಸಾಧನಕ್ಕಾಗಿ ಲಿಥಿಯಂ-ಐಯಾನ್ ಬ್ಯಾಟರಿ ಪ್ಯಾಕ್ ಸುರಕ್ಷತೆ, ಓವರ್‌ಚಾರ್ಜ್ ಮತ್ತು ಶಾರ್ಟ್-ಸರ್ಕ್ಯೂಟ್ ರಕ್ಷಣೆ',
    'ಪ್ಯಾಕೇಜ್ ಮಾಡಿದ ಕುಡಿಯುವ ನೀರಿನ ಗುಣಮಟ್ಟದ ಮಿತಿಗಳು — pH, ಟರ್ಬಿಡಿಟಿ, ಸೂಕ್ಷ್ಮಜೀವಿಗಳು ಮತ್ತು ಆರ್ಸೆನಿಕ್',
  ],
  ml: [
    'RCC സ്ലാബിനായി 43 ഗ്രേഡ് OPC സിമന്റ്, 28 ദിവസത്തെ കംപ്രസീവ് ശക്തി 43 MPa, കുറഞ്ഞ ക്ലോറൈഡ്',
    'ഉയർന്ന ബ്രേക്കിംഗ് ശക്തിയും കഴുകുമ്പോൾ നിറത്തിന്റെ സ്ഥിരതയും ഉള്ള കോട്ടൺ തയ്യൽ നൂൽ',
    'പോർട്ടബിൾ ഉപകരണത്തിനായുള്ള ലിഥിയം-അയൺ ബാറ്ററി പാക്ക് സുരക്ഷ, ഓവർചാർജും ഷോർട്ട് സർക്യൂട്ട് സംരക്ഷണവും',
    'പാക്ക് ചെയ്ത കുടിവെള്ളത്തിന്റെ ഗുണനിലവാര പരിധികൾ — pH, ടർബിഡിറ്റി, സൂക്ഷ്മജീവികൾ, ആർസെനിക്',
  ],
  pa: [
    'RCC ਸਲੈਬ ਲਈ 43 ਗ੍ਰੇਡ OPC ਸੀਮੈਂਟ, 28 ਦਿਨਾਂ ਦੀ ਕੰਪ੍ਰੈਸਿਵ ਤਾਕਤ 43 MPa, ਘੱਟ ਕਲੋਰਾਈਡ',
    'ਉੱਚ ਬ੍ਰੇਕਿੰਗ ਤਾਕਤ ਅਤੇ ਧੋਣ ਦੌਰਾਨ ਰੰਗ ਦੀ ਸਥਿਰਤਾ ਵਾਲਾ ਕਪਾਹ ਸਿਲਾਈ ਧਾਗਾ',
    'ਪੋਰਟੇਬਲ ਡਿਵਾਈਸ ਲਈ ਲਿਥੀਅਮ-ਆਇਨ ਬੈਟਰੀ ਪੈਕ ਸੁਰੱਖਿਆ, ਓਵਰਚਾਰਜ ਅਤੇ ਸ਼ਾਰਟ-ਸਰਕਟ ਸੁਰੱਖਿਆ',
    'ਪੈਕ ਕੀਤੇ ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਦੀ ਗੁਣਵੱਤਾ ਸੀਮਾਵਾਂ — pH, ਗੰਦਲਾਪਣ, ਸੂਖਮਜੀਵ ਅਤੇ ਆਰਸੇਨਿਕ',
  ],
  or: [
    'RCC ସ୍ଲାବ୍ ପାଇଁ 43 ଗ୍ରେଡ୍ OPC ସିମେଣ୍ଟ, 28 ଦିନର ସଂକୋଚନ ଶକ୍ତି 43 MPa, କମ୍ କ୍ଲୋରାଇଡ୍',
    'ଉଚ୍ଚ ବ୍ରେକିଂ ଶକ୍ତି ଏବଂ ଧୋଇବା ସମୟରେ ରଙ୍ଗର ସ୍ଥାୟୀତ୍ୱ ଥିବା କପା ସିଲେଇ ସୂତା',
    'ପୋର୍ଟେବଲ୍ ଡିଭାଇସ୍ ପାଇଁ ଲିଥିୟମ୍-ଆୟନ୍ ବ୍ୟାଟେରୀ ପ୍ୟାକ୍ ସୁରକ୍ଷା, ଓଭରଚାର୍ଜ ଏବଂ ଶର୍ଟ-ସର୍କିଟ୍ ସୁରକ୍ଷା',
    'ପ୍ୟାକେଜ୍ ହୋଇଥିବା ପାନୀୟ ଜଳର ଗୁଣବତ୍ତା ସୀମା — pH, ଟର୍ବିଡିଟି, ମାଇକ୍ରୋବିଆଲ୍ ଏବଂ ଆର୍ସେନିକ୍',
  ],
}

type Props = {
  query: string
  onQueryChange: (q: string) => void
  onSubmit: () => void
  loading: boolean
}

export function SpecForm({ query, onQueryChange, onSubmit, loading }: Props) {
  const { t, lang } = useI18n()
  const voiceLanguage: Record<string, string> = {
    en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-IN', te: 'te-IN', mr: 'mr-IN',
    gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN', ur: 'ur-IN',
  }
  const preVoiceQueryRef = useRef<string | null>(null)
  const samples = SAMPLES[lang] ?? SAMPLES.en

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!loading && query.trim()) onSubmit()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="spec" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-500">{t('form.specLabel')}</label>
        <textarea
          id="spec"
          data-testid="spec-input-textarea"
          value={query}
          onChange={(e) => { preVoiceQueryRef.current = null; onQueryChange(e.target.value) }}
          onKeyDown={(e) => {
            if (e.isComposing) return
            if (e.code === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              if (!loading && query.trim()) onSubmit()
            }
          }}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          rows={5}
          placeholder={t('form.placeholder')}
          className="field resize-none font-sans leading-relaxed"
        />
        <div className="mt-2 flex justify-end">
          <VoiceInput
            disabled={loading}
            language={voiceLanguage[lang] ?? 'en-IN'}
            onSessionStart={() => { preVoiceQueryRef.current = query.trim() }}
            onTranscript={(text) => {
              const transcript = text.trim()
              if (!transcript) return
              const base = preVoiceQueryRef.current ?? query.trim()
              onQueryChange(base ? `${base} ${transcript}` : transcript)
            }}
            onSessionEnd={() => { preVoiceQueryRef.current = null }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-600">{t('form.tipRun')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {samples.map((sample, i) => (
          <button
            key={i}
            type="button"
            data-testid={`sample-spec-${i}`}
            onClick={() => onQueryChange(sample)}
            className="rounded-full border border-hairline bg-surface-2/40 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-accent/50 hover:text-slate-200"
          >
            {sample.length > 46 ? `${sample.slice(0, 46)}…` : sample}
          </button>
        ))}
      </div>

      <button type="submit" data-testid="spec-submit-button" disabled={loading || !query.trim()} className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
        <Sparkles className="h-4 w-4" />
        {loading ? t('form.matching') : t('form.submit')}
        {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
      </button>
    </form>
  )
}
