import type { Lang } from './index'

type Map = Record<string, Record<string, string>>

const DEPARTMENT: Map = {
  hi: {
    'Civil Engineering': 'सिविल इंजीनियरिंग',
    Textiles: 'वस्त्र',
    'Electronics & IT': 'इलेक्ट्रॉनिकी एवं आईटी',
    'Food & Agriculture': 'खाद्य एवं कृषि',
  },
  ta: {
    'Civil Engineering': 'கட்டட பொறியியல்',
    Textiles: 'ஜவுளி',
    'Electronics & IT': 'மின்னணுவியல் & ஐடி',
    'Food & Agriculture': 'உணவு & விவசாயம்',
  },
  bn: {
    'Civil Engineering': 'সিভিল ইঞ্জিনিয়ারিং',
    Textiles: 'বস্ত্র',
    'Electronics & IT': 'ইলেকট্রনিক্স ও আইটি',
    'Food & Agriculture': 'খাদ্য ও কৃষি',
  },
}

const ASPECT: Map = {
  hi: { Specification: 'विनिर्देश', 'Methods of Test': 'परीक्षण विधियाँ', 'Code of Practice': 'आचरण संहिता' },
  ta: { Specification: 'விவரக்குறிப்பு', 'Methods of Test': 'சோதனை முறைகள்', 'Code of Practice': 'நடைமுறை விதி' },
  bn: { Specification: 'স্পেসিফিকেশন', 'Methods of Test': 'পরীক্ষা পদ্ধতি', 'Code of Practice': 'অনুশীলন বিধি' },
}

const STATUS: Map = {
  hi: { Active: 'सक्रिय', Withdrawn: 'वापस लिया', Draft: 'मसौदा', Superseded: 'अधिक्रमित' },
  ta: { Active: 'செயலில்', Withdrawn: 'திரும்பப் பெறப்பட்டது', Draft: 'வரைவு', Superseded: 'மாற்றப்பட்டது' },
  bn: { Active: 'সক্রিয়', Withdrawn: 'প্রত্যাহৃত', Draft: 'খসড়া', Superseded: 'প্রতিস্থাপিত' },
}

const MAPS = { statuses: STATUS, departments: DEPARTMENT, aspects: ASPECT }

// Localized label for a value while the underlying value stays English (matching intact).
export function labelFor(kind: 'statuses' | 'departments' | 'aspects', value: string, lang: Lang): string {
  return MAPS[kind]?.[lang]?.[value] ?? value
}
