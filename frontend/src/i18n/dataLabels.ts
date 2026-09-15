import type { Lang } from './index'

type Map = Record<string, Record<string, string>>

const DEPARTMENT: Map = {
  hi: {
    'AYUSH DEPARTMENT': 'आयुष विभाग',
    'CHEMICAL DEPARTMENT': 'रसायन विभाग',
    'CIVIL ENGINEERING DEPARTMENT': 'सिविल इंजीनियरिंग विभाग',
    'ELECTRONICS AND INFORMATION TECHNOLOGY DEPARTMENT': 'इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी विभाग',
    'ELECTROTECHNICAL DEPARTMENT': 'इलेक्ट्रोटेक्निकल विभाग',
    'ENVIRONMENT AND ECOLOGY DEPARTMENT': 'पर्यावरण और पारिस्थितिकी विभाग',
    'FOOD AND AGRICULTURE DEPARTMENT': 'खाद्य और कृषि विभाग',
    'MANAGEMENT SYSTEM DEPARTMENT': 'प्रबंधन प्रणाली विभाग',
    'MECHANICAL ENGINEERING DEPARTMENT': 'मैकेनिकल इंजीनियरिंग विभाग',
    'MEDICAL EQUIPMENT AND HOSPITAL PLANNING DEPARTMENT': 'चिकित्सा उपकरण और अस्पताल नियोजन विभाग',
    'METALLURGICAL ENGINEERING DEPARTMENT': 'धातुकर्म इंजीनियरिंग विभाग',
    'PETROLEUM, COAL AND RELATED PRODUCTS DEPARTMENT': 'पेट्रोलियम, कोयला और संबंधित उत्पाद विभाग',
    'PRODUCTION AND GENERAL ENGINEERING DEPARTMENT': 'उत्पादन और सामान्य इंजीनियरिंग विभाग',
    'SERVICE SECTOR DEPARTMENT': 'सेवा क्षेत्र विभाग',
    'TEXTILE DEPARTMENT': 'वस्त्र विभाग',
    'TRANSPORT ENGINEERING DEPARTMENT': 'परिवहन इंजीनियरिंग विभाग',
    'WATER RESOURCES DEPARTMENT': 'जल संसाधन विभाग',

    // Existing legacy/demo values
    'Civil Engineering': 'सिविल इंजीनियरिंग',
    Textiles: 'वस्त्र',
    'Electronics & IT': 'इलेक्ट्रॉनिकी एवं आईटी',
    'Food & Agriculture': 'खाद्य एवं कृषि',
  },

  ta: {
    'AYUSH DEPARTMENT': 'ஆயுஷ் துறை',
    'CHEMICAL DEPARTMENT': 'இரசாயனத் துறை',
    'CIVIL ENGINEERING DEPARTMENT': 'சிவில் பொறியியல் துறை',
    'ELECTRONICS AND INFORMATION TECHNOLOGY DEPARTMENT': 'மின்னணுவியல் மற்றும் தகவல் தொழில்நுட்பத் துறை',
    'ELECTROTECHNICAL DEPARTMENT': 'மின்னியல் பொறியியல் துறை',
    'ENVIRONMENT AND ECOLOGY DEPARTMENT': 'சுற்றுச்சூழல் மற்றும் சூழலியல் துறை',
    'FOOD AND AGRICULTURE DEPARTMENT': 'உணவு மற்றும் வேளாண்மைத் துறை',
    'MANAGEMENT SYSTEM DEPARTMENT': 'மேலாண்மை அமைப்பு துறை',
    'MECHANICAL ENGINEERING DEPARTMENT': 'இயந்திர பொறியியல் துறை',
    'MEDICAL EQUIPMENT AND HOSPITAL PLANNING DEPARTMENT': 'மருத்துவ உபகரணங்கள் மற்றும் மருத்துவமனை திட்டமிடல் துறை',
    'METALLURGICAL ENGINEERING DEPARTMENT': 'உலோகவியல் பொறியியல் துறை',
    'PETROLEUM, COAL AND RELATED PRODUCTS DEPARTMENT': 'பெட்ரோலியம், நிலக்கரி மற்றும் தொடர்புடைய தயாரிப்புகள் துறை',
    'PRODUCTION AND GENERAL ENGINEERING DEPARTMENT': 'உற்பத்தி மற்றும் பொது பொறியியல் துறை',
    'SERVICE SECTOR DEPARTMENT': 'சேவைத் துறை',
    'TEXTILE DEPARTMENT': 'ஜவுளித் துறை',
    'TRANSPORT ENGINEERING DEPARTMENT': 'போக்குவரத்து பொறியியல் துறை',
    'WATER RESOURCES DEPARTMENT': 'நீர்வளத் துறை',
  },

  bn: {
    'AYUSH DEPARTMENT': 'আয়ুষ বিভাগ',
    'CHEMICAL DEPARTMENT': 'রাসায়নিক বিভাগ',
    'CIVIL ENGINEERING DEPARTMENT': 'সিভিল ইঞ্জিনিয়ারিং বিভাগ',
    'ELECTRONICS AND INFORMATION TECHNOLOGY DEPARTMENT': 'ইলেকট্রনিক্স ও তথ্যপ্রযুক্তি বিভাগ',
    'ELECTROTECHNICAL DEPARTMENT': 'ইলেকট্রোটেকনিক্যাল বিভাগ',
    'ENVIRONMENT AND ECOLOGY DEPARTMENT': 'পরিবেশ ও প্রতিবেশ বিভাগ',
    'FOOD AND AGRICULTURE DEPARTMENT': 'খাদ্য ও কৃষি বিভাগ',
    'MANAGEMENT SYSTEM DEPARTMENT': 'ম্যানেজমেন্ট সিস্টেম বিভাগ',
    'MECHANICAL ENGINEERING DEPARTMENT': 'মেকানিক্যাল ইঞ্জিনিয়ারিং বিভাগ',
    'MEDICAL EQUIPMENT AND HOSPITAL PLANNING DEPARTMENT': 'চিকিৎসা সরঞ্জাম ও হাসপাতাল পরিকল্পনা বিভাগ',
    'METALLURGICAL ENGINEERING DEPARTMENT': 'ধাতুবিদ্যা প্রকৌশল বিভাগ',
    'PETROLEUM, COAL AND RELATED PRODUCTS DEPARTMENT': 'পেট্রোলিয়াম, কয়লা ও সংশ্লিষ্ট পণ্য বিভাগ',
    'PRODUCTION AND GENERAL ENGINEERING DEPARTMENT': 'উৎপাদন ও সাধারণ প্রকৌশল বিভাগ',
    'SERVICE SECTOR DEPARTMENT': 'পরিষেবা ক্ষেত্র বিভাগ',
    'TEXTILE DEPARTMENT': 'বস্ত্র বিভাগ',
    'TRANSPORT ENGINEERING DEPARTMENT': 'পরিবহন প্রকৌশল বিভাগ',
    'WATER RESOURCES DEPARTMENT': 'জলসম্পদ বিভাগ',
  },
}

const ASPECT: Map = {
  hi: {
    Specification: 'विनिर्देश',
    'Product Specification': 'उत्पाद विनिर्देश',
    'Methods of Test': 'परीक्षण विधियाँ',
    'Methods of tests': 'परीक्षण विधियाँ',
    'Methods of Tests': 'परीक्षण विधियाँ',
    'Code of Practice': 'आचार संहिता',
    'Service Specification': 'सेवा विनिर्देश',
    'Process Specification': 'प्रक्रिया विनिर्देश',
    'System Standard': 'प्रणाली मानक',
    Terminology: 'पारिभाषिकी',
    Dimensions: 'आयाम',
    'Safety Standard': 'सुरक्षा मानक',
    Others: 'अन्य',
    unknown: 'अज्ञात',
  },

  ta: {
    Specification: 'விவரக்குறிப்பு',
    'Product Specification': 'தயாரிப்பு விவரக்குறிப்பு',
    'Methods of Test': 'சோதனை முறைகள்',
    'Methods of tests': 'சோதனை முறைகள்',
    'Methods of Tests': 'சோதனை முறைகள்',
    'Code of Practice': 'நடைமுறை விதி',
    'Service Specification': 'சேவை விவரக்குறிப்பு',
    'Process Specification': 'செயல்முறை விவரக்குறிப்பு',
    'System Standard': 'அமைப்பு தரநிலை',
    Terminology: 'சொற்றொடரியல்',
    Dimensions: 'பரிமாணங்கள்',
    'Safety Standard': 'பாதுகாப்பு தரநிலை',
    Others: 'மற்றவை',
    unknown: 'தெரியாதது',
  },

  bn: {
    Specification: 'স্পেসিফিকেশন',
    'Product Specification': 'পণ্য স্পেসিফিকেশন',
    'Methods of Test': 'পরীক্ষা পদ্ধতি',
    'Methods of tests': 'পরীক্ষা পদ্ধতি',
    'Methods of Tests': 'পরীক্ষা পদ্ধতি',
    'Code of Practice': 'অনুশীলন বিধি',
    'Service Specification': 'পরিষেবা স্পেসিফিকেশন',
    'Process Specification': 'প্রক্রিয়া স্পেসিফিকেশন',
    'System Standard': 'সিস্টেম মান',
    Terminology: 'পরিভাষা',
    Dimensions: 'মাত্রা',
    'Safety Standard': 'নিরাপত্তা মান',
    Others: 'অন্যান্য',
    unknown: 'অজানা',
  },
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
