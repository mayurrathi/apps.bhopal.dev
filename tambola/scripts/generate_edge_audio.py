import asyncio
import edge_tts
import os

EN_PHRASES = {
    1: "Number one, son of a gun", 2: "Me and you, just us two", 3: "Cup of tea",
    4: "Knock at the door", 5: "Man alive", 6: "Half a dozen",
    7: "Lucky number seven", 8: "Garden gate", 9: "Doctor's orders",
    10: "A perfect ten", 11: "Legs eleven", 12: "A full dozen",
    13: "Unlucky for some", 14: "Valentine's Day", 15: "Young and keen",
    16: "Sweet sixteen", 17: "Dancing queen", 18: "Coming of age",
    19: "Goodbye teens", 20: "Getting older", 21: "Key to the door",
    22: "Double ducks", 23: "Thee and me", 24: "Double dozen",
    25: "Silver Jubilee", 26: "Pick and mix", 27: "Gateway to heaven",
    28: "Duck and its mate", 29: "Rise and shine", 30: "Catch a birdie",
    31: "Get up and run", 32: "Buckle my shoe", 33: "All the threes",
    34: "Ask for more", 35: "Jump and jive", 36: "Triple dozen",
    37: "Angels from heaven", 38: "Christmas cake", 39: "Steps",
    40: "Life begins at forty", 41: "Time for fun", 42: "Winnie the Pooh",
    43: "Down on your knees", 44: "All the fours", 45: "Halfway there",
    46: "Up to tricks", 47: "Year of Independence", 48: "Grab your mate",
    49: "Prime time", 50: "Half a century", 51: "Tweak of the thumb",
    52: "Weeks in a year", 53: "Stuck in the tree", 54: "Clean the floor",
    55: "All the fives", 56: "Pick up sticks", 57: "Heinz varieties",
    58: "Make them wait", 59: "Brighton line", 60: "Golden years",
    61: "Bakers bun", 62: "Turn the screw", 63: "Tickle me",
    64: "Red raw", 65: "Retirement age", 66: "Clickety click",
    67: "Made in heaven", 68: "Saving grace", 69: "Either way up",
    70: "Platinum years", 71: "Bang on the drum", 72: "Par for the course",
    73: "Queen bee", 74: "Hit the floor", 75: "Diamond Jubilee",
    76: "Trombones", 77: "Sunset strip", 78: "Heaven's gate",
    79: "One more time", 80: "Stay out late", 81: "Stop and run",
    82: "Straight on through", 83: "Time for tea", 84: "Always wanting more",
    85: "Staying alive", 86: "Between the sticks", 87: "Torquay in Devon",
    88: "Giant snowmen", 89: "Nearly there", 90: "Top of the house"
}

HI_PHRASES = {
    1: "सबका मालिक एक", 2: "हम दो हमारे दो", 3: "तीन तिगाड़ा काम बिगाड़ा",
    4: "चार कदम", 5: "पांडव पांच", 6: "लगाओ छक्का", 7: "लकी सात",
    8: "गोल मटोल", 9: "नवरत्न", 10: "बस कर पगले", 11: "सुंदर टांगें",
    12: "पूरा दर्जन", 13: "मेरा तेरा साथ", 14: "वैलेंटाइन डे",
    15: "स्वतंत्रता दिवस", 16: "सोलह आने सच", 17: "सतरा पे खतरा",
    18: "वोटिंग एज", 19: "आखिरी टीन", 20: "बिना देखे बीस",
    21: "इक्कीस तोपों की सलामी", 22: "जुड़वा बतख", 23: "तू और मैं",
    24: "दिन रात चालू", 25: "सिल्वर जुबली", 26: "गणतंत्र दिवस",
    27: "स्वर्ग का रास्ता", 28: "बत्तख और सेठ", 29: "उठो और जागो",
    30: "तीस मार खां", 31: "मस्ती शुरू", 32: "बत्तीसी मत दिखा",
    33: "तोता मैना", 34: "दिल मांगे मोर", 35: "थका हारा",
    36: "छत्तीस का आंकड़ा", 37: "स्वर्ग की सीढ़ी", 38: "मोटा पेट",
    39: "आखिरी थर्टी", 40: "चालाक चालीस", 41: "ज़िंदगी शुरू",
    42: "भारत छोड़ो आंदोलन", 43: "पेड़ पे चढ़ो", 44: "जोर का झटका",
    45: "आधा रास्ता", 46: "बाउंड्री पार", 47: "आज़ादी मिली", 48: "बाजार से लाओ",
    49: "नया सवेरा", 50: "हाफ सेंचुरी", 51: "शगुन का इक्यावन",
    52: "साल के हफ्ते", 53: "पेड़ में फंसा", 54: "साफ करो फर्श",
    55: "बचपन के दिन", 56: "छप्पन भोग", 57: "बनेगी बात",
    58: "रिटायरमेंट का डर", 59: "जस्ट रिटायर्ड", 60: "साठिया गए हो",
    61: "मीठा बन", 62: "जूते के फीते", 63: "पेड़ के नीचे",
    64: "चोर पकड़ो", 65: "पेंशन शुरू", 66: "छक्का छक्का",
    67: "मेड इन हेवन", 68: "मोटापा कम करो", 69: "उल्टा पुल्टा",
    70: "सत्तर", 71: "डूबता सूरज", 72: "बढ़ती उम्र",
    73: "सावित्री", 74: "और चाहिए", 75: "डायमंड जुबली",
    76: "हवा में छक्के", 77: "सच्चे साथी", 78: "स्वर्ग का दरवाज़ा",
    79: "बुढ़ापा आया", 80: "अस्सी घाट", 81: "रुको और भागो",
    82: "सीधे चलते रहो", 83: "पहला वर्ल्ड कप",
    84: "हमेशा की भूख", 85: "दादी माँ", 86: "आखिरी छक्का",
    87: "स्वर्ग में दादी", 88: "मोटे सेठ", 89: "मंजिल के पास",
    90: "बम्पर फुल हाउस"
}

EN_VOICE = "en-US-AriaNeural"
HI_VOICE = "hi-IN-SwaraNeural"

base_path = "/Users/mayankrathi/Downloads/Business Idea Prototypes/play-store-apps/apps.bhopal.dev/tambola/public/audio"

def ensure_dir_exists(path):
    if not os.path.exists(path):
        os.makedirs(path)

ensure_dir_exists(f"{base_path}/en/numbers")
ensure_dir_exists(f"{base_path}/en/phrases")
ensure_dir_exists(f"{base_path}/hi/numbers")
ensure_dir_exists(f"{base_path}/hi/phrases")

async def generate_audio(text, voice, filepath):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filepath)

async def main():
    print("Generating 360 audio files sequentially with Edge TTS...")
    
    for i in range(1, 91):
        # 1. English Numbers
        await generate_audio(str(i), EN_VOICE, f"{base_path}/en/numbers/{i}.mp3")
        
        # 2. English Phrases
        phr_en_text = f"{i}... {EN_PHRASES[i]}"
        await generate_audio(phr_en_text, EN_VOICE, f"{base_path}/en/phrases/{i}.mp3")
        
        # 3. Hindi Numbers
        await generate_audio(str(i), HI_VOICE, f"{base_path}/hi/numbers/{i}.mp3")
        
        # 4. Hindi Phrases
        phr_hi_text = f"{i}... {HI_PHRASES[i]}"
        await generate_audio(phr_hi_text, HI_VOICE, f"{base_path}/hi/phrases/{i}.mp3")

        print(f"[{i}/90] EN & HI Generated")

    print("All 360 audio files successfully generated!")

if __name__ == "__main__":
    asyncio.run(main())
