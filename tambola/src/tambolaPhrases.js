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
        code: 'en-US', // Doesn't matter, we use MP3s now
        fallbackCodes: [],
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
    }
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
