/**
 * tambolaPhrases.js
 * Complete Tambola/Housie number phrases for 20 languages.
 *
 * Each language has:
 *   - label: Display name
 *   - code: BCP 47 voice code for Web Speech API
 *   - fallbackCodes: Alternative voice codes to try
 *   - phrases: Map of number → phrase (culturally relevant to that language)
 *
 * Web Speech API voice availability:
 *   Chrome: bn-IN, en-IN, gu-IN, hi-IN, kn-IN, ml-IN, mr-IN, or-IN, pa-IN, ta-IN, te-IN, ur-IN
 *   Safari: hi-IN, en-IN, id-ID, ms-MY, th-TH, vi-VN
 *   Edge:   All Chrome voices + more
 *   Fallback: Any voice matching the language prefix (e.g. hi*)
 */

export const LANGUAGES = {
    en: {
        label: 'English',
        flag: '🇬🇧',
        code: 'en-IN',
        fallbackCodes: ['en-GB', 'en-US'],
        phrases: {
            1: "Kelly's eye", 2: "One little duck", 3: "Cup of tea",
            4: "Knock at the door", 5: "Man alive", 6: "Half a dozen",
            7: "Lucky seven", 8: "Garden gate", 9: "Doctor's orders",
            10: "Downing Street", 11: "Legs eleven", 12: "One dozen",
            13: "Unlucky for some", 14: "Valentine's Day", 15: "Young and keen",
            16: "Sweet sixteen", 17: "Dancing queen", 18: "Coming of age",
            19: "Goodbye teens", 20: "One score", 21: "Royal salute",
            22: "Two little ducks", 23: "Thee and me", 24: "Two dozen",
            25: "Silver Jubilee", 26: "Pick and mix", 27: "Gateway to heaven",
            28: "Over weight", 29: "Rise and shine", 30: "Dirty Gertie",
            31: "Get up and run", 32: "Buckle my shoe", 33: "All the threes",
            34: "Ask for more", 35: "Jump and jive", 36: "Three dozen",
            37: "More than eleven", 38: "Christmas cake", 39: "Steps",
            40: "Naughty forty", 41: "Time for fun", 42: "Winnie the Pooh",
            43: "Down on your knees", 44: "All the fours", 45: "Halfway there",
            46: "Up to tricks", 47: "Four and seven", 48: "Four dozen",
            49: "PC", 50: "Half century", 51: "Tweak of the thumb",
            52: "Danny La Rue", 53: "Stuck in the tree", 54: "Clean the floor",
            55: "All the fives", 56: "Was she worth it", 57: "Heinz varieties",
            58: "Make them wait", 59: "Brighton line", 60: "Five dozen",
            61: "Bakers bun", 62: "Turn the screw", 63: "Tickle me",
            64: "Red raw", 65: "Old age pension", 66: "Clickety click",
            67: "Made in heaven", 68: "Saving grace", 69: "Either way up",
            70: "Three score ten", 71: "Bang on the drum", 72: "Six dozen",
            73: "Queen bee", 74: "Hit the floor", 75: "Diamond Jubilee",
            76: "Trombones", 77: "Sunset strip", 78: "Heaven's gate",
            79: "One more time", 80: "Eight and blank", 81: "Stop and run",
            82: "Straight on through", 83: "Time for tea", 84: "Seven dozen",
            85: "Staying alive", 86: "Between the sticks", 87: "Torquay in Devon",
            88: "Two fat ladies", 89: "Nearly there", 90: "Top of the shop"
        }
    },
    es: {
        label: 'Español',
        flag: '🇪🇸',
        code: 'es-ES',
        fallbackCodes: ['es-MX', 'es-US'],
        phrases: {
            1: "El primero", 7: "Siete de la suerte", 10: "Diez dedos",
            11: "Las dos piernas", 15: "Quince", 22: "Los dos patitos",
            33: "Treinta y tres", 50: "Medio siglo", 69: "Arriba y abajo",
            77: "Las dos banderas", 88: "Los dos gorditos", 90: "El abuelo"
        }
    },
    fr: {
        label: 'Français',
        flag: '🇫🇷',
        code: 'fr-FR',
        fallbackCodes: ['fr-CA'],
        phrases: {
            1: "Le premier", 7: "Sept chanceux", 10: "Dix doigts",
            11: "Les jambes", 22: "Les deux canards", 50: "Un demi-siècle",
            69: "La tête en bas", 88: "Les deux gros", 90: "Le dernier"
        }
    },
    de: {
        label: 'Deutsch',
        flag: '🇩🇪',
        code: 'de-DE',
        fallbackCodes: ['de-AT', 'de-CH'],
        phrases: {
            1: "Die Eins", 7: "Glückssieben", 10: "Zehn Finger",
            11: "Schnapszahl", 22: "Zwei Enten", 50: "Halbes Jahrhundert",
            69: "Kopfüber", 88: "Zwei Dicke", 90: "Der Opa"
        }
    },
    hi: {
        label: 'हिन्दी',
        flag: '🇮🇳',
        code: 'hi-IN',
        fallbackCodes: [],
        phrases: {
            1: "सबसे आगे एक नंबर", 2: "काला धन", 3: "तीन तिगाड़ा काम बिगाड़ा",
            4: "मुर्गी चोर", 5: "हम पांच", 6: "बॉटम हैवी", 7: "लकी सात",
            8: "बिग फैट लेडी", 9: "तू जाने", 10: "दस नंबरी", 11: "दो टांगें",
            12: "दो दर्जन", 13: "तेरा मेरा साथ", 14: "वैलेंटाइन डे",
            15: "पंद्रह अगस्त", 16: "सोलह बरस की", 17: "खतरा",
            18: "वोटिंग एज", 19: "आखिरी टीन", 20: "ब्लाइंड स्कोर",
            21: "प्रेसिडेंट सलूट", 22: "दो बतख", 23: "तू और मैं",
            24: "चौबीस कैरेट", 25: "पच्चीस सिल्वर जुबली", 26: "गणतंत्र दिवस",
            27: "स्वर्ग का रास्ता", 28: "बत्तख और उसका साथी", 29: "प्राइम नंबर",
            30: "फ्लर्टी थर्टी", 31: "बासकिन रॉबिन्स", 32: "बत्तीसी दिखाओ",
            33: "सारे तीन", 34: "दिल मांगे मोर", 35: "आंटी जी",
            36: "छत्तीस का आंकड़ा", 37: "मिक्स्ड लक", 38: "ओवरसाइज़",
            39: "कमर देखो", 40: "नॉटी फोर्टी", 41: "ज़िंदगी शुरू",
            42: "भारत छोड़ो", 43: "पेड़ पे चढ़ो", 44: "चोर चोर",
            45: "आधा रास्ता", 46: "चोक", 47: "आज़ादी", 48: "चार दर्जन",
            49: "राइज़ एंड शाइन", 50: "अर्धशतक", 51: "शगुन",
            52: "ताश की गड्डी", 53: "जोकर वाली गड्डी", 54: "बांस का घर",
            55: "दोनो पांच", 56: "छप्पन भोग", 57: "बनेगी बात",
            58: "रिटायरमेंट एज", 59: "जस्ट रिटायर्ड", 60: "साठिया",
            61: "बेकर्स बन", 62: "क्लिक द टू", 63: "कड़ून",
            64: "चोर पकड़ो", 65: "ओल्ड एज पेंशन", 66: "छक्का छक्का",
            67: "मेड इन हेवन", 68: "वजन चेक करो", 69: "उल्टा पुल्टा",
            70: "लकी ब्लाइंड", 71: "डूबता सूरज", 72: "लकी टू",
            73: "सावित्री", 74: "और चाहिए", 75: "डायमंड जुबली",
            76: "छक्के", 77: "दो साथी", 78: "स्वर्ग का दरवाज़ा",
            79: "एक और बार", 80: "गांधीजी का नाश्ता", 81: "इक्यासी",
            82: "मोटी औरत बत्तख के साथ", 83: "इंडिया वर्ल्ड कप जीता",
            84: "आखिरी चोर", 85: "दादी माँ", 86: "आखिरी छक्का",
            87: "दादी माँ स्वर्ग में", 88: "दो मोटे", 89: "बस पहुँचने वाले",
            90: "सबसे बड़ा नंबर"
        }
    },
    mr: {
        label: 'मराठी',
        flag: '🇮🇳',
        code: 'mr-IN',
        fallbackCodes: ['hi-IN'],
        phrases: {
            1: "पहिला नंबर", 5: "पाच बोटे", 7: "लकी सात",
            10: "दहा नंबरी", 11: "दोन पाय", 13: "तेरा साथ",
            15: "पंधरा ऑगस्ट", 22: "दोन बदक", 25: "सिल्वर ज्युबिली",
            26: "प्रजासत्ताक दिन", 32: "बत्तिशी दाखवा", 36: "छत्तीसचा आकडा",
            42: "भारत छोडो", 44: "चोर चोर", 50: "अर्धशतक",
            56: "छप्पन भोग", 69: "उलटा पुलटा", 75: "डायमंड ज्युबिली",
            83: "इंडिया विश्वचषक", 88: "दोन जाड", 90: "सगळ्यात मोठा"
        }
    },
    ta: {
        label: 'தமிழ்',
        flag: '🇮🇳',
        code: 'ta-IN',
        fallbackCodes: [],
        phrases: {
            1: "முதல் எண்", 5: "ஐந்து விரல்கள்", 7: "அதிர்ஷ்ட ஏழு",
            10: "பத்து ரூபாய்", 11: "இரு கால்கள்", 13: "அமாவாசை",
            15: "சுதந்திர தினம்", 18: "வாக்களிக்கும் வயது", 22: "இரு வாத்துகள்",
            25: "வெள்ளி விழா", 26: "குடியரசு தினம்", 36: "முப்பத்தாறு",
            44: "நான்கு நான்கு", 50: "அரை சதம்", 56: "ஐம்பத்தாறு",
            69: "தலைகீழ்", 75: "வைர விழா", 77: "இரு ஹாக்கி",
            88: "இரு பருத்தவர்", 90: "மிகப்பெரிய எண்"
        }
    },
    te: {
        label: 'తెలుగు',
        flag: '🇮🇳',
        code: 'te-IN',
        fallbackCodes: [],
        phrases: {
            1: "మొదటి నంబర్", 5: "ఐదు వేళ్ళు", 7: "అదృష్ట ఏడు",
            10: "పది రూపాయలు", 11: "రెండు కాళ్ళు", 13: "అమావాస్య",
            15: "స్వాతంత్ర్య దినం", 22: "రెండు బాతులు", 25: "రజత వేడుక",
            26: "గణతంత్ర దినం", 44: "నాలుగు నాలుగు", 50: "సగం సెంచరీ",
            69: "తలకిందులు", 75: "వజ్ర వేడుక", 88: "ఇద్దరు బొద్దు",
            90: "అతి పెద్ద సంఖ్య"
        }
    },
    bn: {
        label: 'বাংলা',
        flag: '🇮🇳',
        code: 'bn-IN',
        fallbackCodes: ['bn-BD'],
        phrases: {
            1: "এক নম্বর", 5: "পাঁচ আঙুল", 7: "লাকি সাত",
            10: "দশ নম্বরি", 11: "দুই পা", 13: "অমাবস্যা",
            15: "স্বাধীনতা দিবস", 22: "দুই হাঁস", 25: "রৌপ্য জয়ন্তী",
            26: "প্রজাতন্ত্র দিবস", 36: "ছত্রিশের আঁকড়া", 44: "চোর চোর",
            50: "অর্ধশতক", 69: "উলটা পুলটা", 75: "হীরক জয়ন্তী",
            83: "বিশ্বকাপ জয়", 88: "দুই মোটা", 90: "সবচেয়ে বড় নম্বর"
        }
    },
    gu: {
        label: 'ગુજરાતી',
        flag: '🇮🇳',
        code: 'gu-IN',
        fallbackCodes: [],
        phrases: {
            1: "પહેલો નંબર", 5: "પાંચ આંગળીઓ", 7: "શુભ સાત",
            10: "દસ નંબરી", 11: "બે પગ", 13: "તેરો-મેરો સાથ",
            15: "સ્વતંત્રતા દિવસ", 22: "બે બતક", 25: "સિલ્વર જ્યુબિલી",
            26: "પ્રજાસત્તાક દિવસ", 36: "છત્રીસની રકમ", 44: "ચાર ચાર",
            50: "અર્ધ સદી", 56: "છપ્પન ભોગ", 69: "ઊંધું ચત્તું",
            75: "હીરક જ્યુબિલી", 88: "બે જાડા", 90: "સૌથી મોટો નંબર"
        }
    },
    kn: {
        label: 'ಕನ್ನಡ',
        flag: '🇮🇳',
        code: 'kn-IN',
        fallbackCodes: [],
        phrases: {
            1: "ಮೊದಲ ಸಂಖ್ಯೆ", 5: "ಐದು ಬೆರಳುಗಳು", 7: "ಅದೃಷ್ಟ ಏಳು",
            10: "ಹತ್ತು ನಂಬರಿ", 11: "ಎರಡು ಕಾಲುಗಳು", 13: "ಅಮಾವಾಸ್ಯೆ",
            15: "ಸ್ವಾತಂತ್ರ್ಯ ದಿನ", 22: "ಎರಡು ಬಾತುಕೋಳಿ", 25: "ಬೆಳ್ಳಿ ಹಬ್ಬ",
            26: "ಗಣರಾಜ್ಯ ದಿನ", 50: "ಅರ್ಧ ಶತಕ", 69: "ತಲೆಕೆಳಗು",
            75: "ವಜ್ರ ಮಹೋತ್ಸವ", 88: "ಇಬ್ಬರು ದಪ್ಪ", 90: "ಅತಿ ದೊಡ್ಡ ಸಂಖ್ಯೆ"
        }
    },
    ml: {
        label: 'മലയാളം',
        flag: '🇮🇳',
        code: 'ml-IN',
        fallbackCodes: [],
        phrases: {
            1: "ഒന്നാം നമ്പർ", 5: "അഞ്ച് വിരലുകൾ", 7: "ഭാഗ്യ ഏഴ്",
            10: "പത്ത് നമ്പർ", 11: "രണ്ട് കാലുകൾ", 13: "അമാവാസി",
            15: "സ്വാതന്ത്ര്യ ദിനം", 22: "രണ്ട് താറാവ്", 25: "വെള്ളി ജൂബിലി",
            26: "റിപ്പബ്ലിക് ദിനം", 50: "അർദ്ധ സെഞ്ചുറി", 69: "തലകീഴായി",
            75: "വജ്ര ജൂബിലി", 88: "രണ്ട് തടിയൻ", 90: "ഏറ്റവും വലിയ നമ്പർ"
        }
    },
    pa: {
        label: 'ਪੰਜਾਬੀ',
        flag: '🇮🇳',
        code: 'pa-IN',
        fallbackCodes: [],
        phrases: {
            1: "ਸਭ ਤੋਂ ਪਹਿਲਾ", 5: "ਪੰਜ ਉਂਗਲੀਆਂ", 7: "ਲੱਕੀ ਸੱਤ",
            10: "ਦਸ ਨੰਬਰੀ", 11: "ਦੋ ਲੱਤਾਂ", 13: "ਤੇਰਾ ਮੇਰਾ ਸਾਥ",
            15: "ਅਜ਼ਾਦੀ ਦਿਵਸ", 22: "ਦੋ ਬੱਤਖ", 25: "ਸਿਲਵਰ ਜੁਬਲੀ",
            26: "ਗਣਤੰਤਰ ਦਿਵਸ", 36: "ਛੱਤੀ ਦਾ ਅੰਕੜਾ", 44: "ਚੋਰ ਚੋਰ",
            50: "ਅੱਧਾ ਸੈਂਕੜਾ", 56: "ਛੱਪਨ ਭੋਗ", 69: "ਉਲਟਾ ਪੁਲਟਾ",
            75: "ਹੀਰਾ ਜੁਬਲੀ", 88: "ਦੋ ਮੋਟੇ", 90: "ਸਭ ਤੋਂ ਵੱਡਾ"
        }
    },
    or: {
        label: 'ଓଡ଼ିଆ',
        flag: '🇮🇳',
        code: 'or-IN',
        fallbackCodes: [],
        phrases: {
            1: "ପ୍ରଥମ ସଂଖ୍ୟା", 5: "ପାଞ୍ଚ ଆଙ୍ଗୁଳି", 7: "ଲକି ସାତ",
            10: "ଦଶ ନମ୍ବରୀ", 11: "ଦୁଇ ଗୋଡ଼", 15: "ସ୍ୱାଧୀନତା ଦିବସ",
            22: "ଦୁଇ ବତକ", 25: "ରୂପା ଜୟନ୍ତୀ", 26: "ଗଣତନ୍ତ୍ର ଦିବସ",
            50: "ଅର୍ଦ୍ଧ ଶତକ", 69: "ଓଲଟା ପୁଲଟା", 88: "ଦୁଇ ମୋଟା",
            90: "ସବୁଠାରୁ ବଡ଼ ସଂଖ୍ୟା"
        }
    },
    as: {
        label: 'অসমীয়া',
        flag: '🇮🇳',
        code: 'as-IN',
        fallbackCodes: ['bn-IN'],
        phrases: {
            1: "প্ৰথম নম্বৰ", 5: "পাঁচটা আঙুলি", 7: "ভাগ্যশালী সাত",
            10: "দহ নম্বৰ", 11: "দুটা ভৰি", 15: "স্বাধীনতা দিৱস",
            22: "দুটা হাঁহ", 25: "ৰূপৰ জয়ন্তী", 50: "অৰ্ধশতক",
            69: "ওলোটা পালোটা", 88: "দুজন শকত", 90: "আটাইতকৈ ডাঙৰ"
        }
    },
    ur: {
        label: 'اردو',
        flag: '🇵🇰',
        code: 'ur-PK',
        fallbackCodes: ['ur-IN', 'hi-IN'],
        phrases: {
            1: "سب سے پہلا نمبر", 5: "پانچ انگلیاں", 7: "لکی سات",
            10: "دس نمبری", 11: "دو ٹانگیں", 13: "تیرا میرا ساتھ",
            15: "یوم آزادی", 22: "دو بطخ", 25: "چاندی کی جوبلی",
            26: "یوم جمہوریہ", 42: "ہندوستان چھوڑو", 44: "چور چور",
            50: "نصف صدی", 56: "چھپن بھوگ", 69: "الٹا پلٹا",
            75: "ہیرے کی جوبلی", 88: "دو موٹے", 90: "سب سے بڑا نمبر"
        }
    },
    ne: {
        label: 'नेपाली',
        flag: '🇳🇵',
        code: 'ne-NP',
        fallbackCodes: ['hi-IN'],
        phrases: {
            1: "पहिलो नम्बर", 5: "पाँच औंला", 7: "भाग्यमानी सात",
            10: "दस नम्बरी", 11: "दुई खुट्टा", 15: "स्वतन्त्रता दिवस",
            22: "दुई हाँस", 25: "रजत जयन्ती", 26: "गणतन्त्र दिवस",
            50: "अर्ध शतक", 69: "उल्टो पुल्टो", 88: "दुई मोटा",
            90: "सबैभन्दा ठूलो"
        }
    },
    si: {
        label: 'සිංහල',
        flag: '🇱🇰',
        code: 'si-LK',
        fallbackCodes: [],
        phrases: {
            1: "පළමු අංකය", 7: "වාසනාවන්ත හත",
            10: "දහයයි", 22: "තාරාවෝ දෙදෙනා", 50: "අර්ධ ශතකය",
            88: "මහත්වරු දෙදෙනා", 90: "ලොකුම අංකය"
        }
    },
    id: {
        label: 'Bahasa Indonesia',
        flag: '🇮🇩',
        code: 'id-ID',
        fallbackCodes: ['ms-MY'],
        phrases: {
            1: "Nomor pertama", 7: "Angka keberuntungan",
            10: "Sepuluh jari", 11: "Dua kaki", 13: "Tiga belas sial",
            22: "Dua bebek", 25: "Jubilee perak", 44: "Empat empat",
            50: "Setengah abad", 69: "Terbalik", 77: "Dua tongkat",
            88: "Dua gendut", 90: "Nomor terbesar"
        }
    },
    ms: {
        label: 'Bahasa Melayu',
        flag: '🇲🇾',
        code: 'ms-MY',
        fallbackCodes: ['id-ID'],
        phrases: {
            1: "Nombor pertama", 7: "Tuah tujuh",
            10: "Sepuluh jari", 11: "Dua kaki", 13: "Tiga belas sial",
            22: "Dua itik", 25: "Jubli perak", 44: "Empat empat",
            50: "Setengah abad", 69: "Terbalik", 77: "Dua tongkat",
            88: "Dua gemuk", 90: "Nombor terbesar"
        }
    },
    th: {
        label: 'ไทย',
        flag: '🇹🇭',
        code: 'th-TH',
        fallbackCodes: [],
        phrases: {
            1: "หมายเลขแรก", 7: "เจ็ดโชคดี",
            9: "เก้าเก้า", 10: "สิบนิ้ว", 13: "สิบสามอาถรรพ์",
            22: "เป็ดสองตัว", 50: "ครึ่งศตวรรษ", 69: "กลับหัว",
            77: "ไม้ฮอกกี้คู่", 88: "สองอ้วน", 90: "เลขที่ใหญ่ที่สุด"
        }
    },
    vi: {
        label: 'Tiếng Việt',
        flag: '🇻🇳',
        code: 'vi-VN',
        fallbackCodes: [],
        phrases: {
            1: "Số đầu tiên", 7: "Bảy may mắn",
            10: "Mười ngón tay", 11: "Hai chân", 13: "Mười ba xui",
            22: "Hai con vịt", 50: "Nửa thế kỷ", 69: "Lộn ngược",
            77: "Hai gậy khúc côn cầu", 88: "Hai ông béo", 90: "Số lớn nhất"
        }
    },
    fil: {
        label: 'Filipino',
        flag: '🇵🇭',
        code: 'fil-PH',
        fallbackCodes: ['tl-PH', 'en-US'],
        phrases: {
            1: "Unang numero", 7: "Maswerteng pito",
            10: "Sampung daliri", 11: "Dalawang binti", 13: "Trese malas",
            22: "Dalawang pato", 50: "Kalahating siglo", 69: "Baligtad",
            77: "Dalawang hockey", 88: "Dalawang mataba", 90: "Pinakamalaking numero"
        }
    },
};

/**
 * Get available languages filtered to those that have browser voice support.
 * Returns all languages but marks which ones have a voice available.
 */
export const getLanguagesWithVoiceStatus = () => {
    const voices = window.speechSynthesis?.getVoices() || [];
    return Object.entries(LANGUAGES).map(([key, lang]) => {
        const allCodes = [lang.code, ...(lang.fallbackCodes || [])];
        const hasVoice = allCodes.some(code =>
            voices.some(v => v.lang === code || v.lang.startsWith(code.split('-')[0]))
        );
        return { key, ...lang, hasVoice };
    });
};

/**
 * Find the best available voice for a language.
 */
export const getBestVoice = (langKey) => {
    const lang = LANGUAGES[langKey];
    if (!lang) return null;
    const voices = window.speechSynthesis?.getVoices() || [];
    const allCodes = [lang.code, ...(lang.fallbackCodes || [])];

    for (const code of allCodes) {
        // Exact match first
        const exact = voices.find(v => v.lang === code);
        if (exact) return exact;
        // Prefix match
        const prefix = code.split('-')[0];
        const partial = voices.find(v => v.lang.startsWith(prefix));
        if (partial) return partial;
    }
    return null;
};

/**
 * Get the phrase for a number in the given language.
 * Returns null if no phrase is defined for that number.
 */
export const getPhrase = (langKey, num) => {
    return LANGUAGES[langKey]?.phrases[num] || null;
};
