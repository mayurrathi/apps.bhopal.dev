import asyncio
import edge_tts
import os
import re

# We will generate two sets of audio for Hindi:
# 1. With Phrases (e.g. "एक - अकेला")
# 2. Without Phrases (e.g. "एक")

hindi_phrases = {
    1: "एक - अकेला", 2: "दो - जोड़ी", 3: "तीन - तिगाड़ा काम बिगाड़ा", 4: "चार - दिशायें", 5: "पांच - पांडव", 
    6: "छह - छक्का", 7: "सात - अजूबे", 8: "आठ - पहर", 9: "नौ - ग्रह", 10: "दस - नंबरी", 
    11: "ग्यारह - प्यारा", 12: "बारह - दर्जन", 13: "तेरह - लकी", 14: "चौदह - रत्न", 15: "पंद्रह - अगस्त", 
    16: "सोलह - श्रृंगार", 17: "सत्रह - खतरा", 18: "अठारह - वोटिंग एज", 19: "उन्नीस - बीस", 20: "बीस - बिस्वा", 
    21: "इक्कीस - तोपों की सलामी", 22: "बाईस - जोड़ी", 23: "तेईस - तेज़", 24: "चौबीस - घंटे", 25: "पच्चीस - जुबली", 
    26: "छब्बीस - जनवरी", 27: "सत्ताईस - नक्षत्र", 28: "अट्ठाईस - राज्य", 29: "उनतीस - दिन", 30: "तीस - मार खां", 
    31: "इकतीस - दिन", 32: "बत्तीस - दांत", 33: "तैंतीस - कोटि", 34: "चौंतीस - चतुर", 35: "पैंतीस - पास", 
    36: "छत्तीस - का आंकड़ा", 37: "सैंतीस - साल", 38: "अड़तीस - अंक", 39: "उनतालीस - दिन", 40: "चालीस - चोर", 
    41: "इकतालीस - एक", 42: "बयालीस - भारत छोड़ो", 43: "तिरालीस - तीन", 44: "चवालीस - चार", 45: "पैंतालीस - आधा", 
    46: "छियालीस - छह", 47: "सैंतालीस - आज़ादी", 48: "अड़तालीस - आठ", 49: "उनचास - पवन", 50: "पचास - अर्धशतक", 
    51: "इक्यावन - शगुन", 52: "बावन - पत्ते", 53: "तिरेपन - तीन", 54: "चौवन - चार", 55: "पचपन - बचपन", 
    56: "छप्पन - भोग", 57: "सत्तावन - क्रांति", 58: "अट्ठावन - आठ", 59: "उनसठ - नौ", 60: "साठ - बुढ़ापा", 
    61: "इकसठ - एक", 62: "बासठ - दो", 63: "तिरसठ - तीन", 64: "चौंसठ - कलाएं", 65: "पैंसठ - पांच", 
    66: "छियासठ - छक्के", 67: "सड़सठ - सात", 68: "अड़सठ - तीरथ", 69: "उनहत्तर - नौ", 70: "सत्तर - साल", 
    71: "इकहत्तर - युद्ध", 72: "बहत्तर - धड़कन", 73: "तिहत्तर - तीन", 74: "चौहत्तर - चार", 75: "पचहत्तर - अमृत", 
    76: "छियाहत्तर - छह", 77: "सतहत्तर - सात", 78: "अठहत्तर - आठ", 79: "उनासी - नौ", 80: "अस्सी - घाट", 
    81: "इक्यासी - एक", 82: "बयासी - दो", 83: "तिरासी - वर्ल्ड कप", 84: "चौरासी - लाख योनियां", 85: "पचासी - पांच", 
    86: "छियासी - छह", 87: "सत्तासी - सात", 88: "अट्ठासी - आठ", 89: "नवासी - नौ", 90: "नब्बे - आखिरी"
}

VOICE = "hi-IN-MadhurNeural"
BASE_DIR = "/Users/mayankrathi/Downloads/Business Idea Prototypes/play-store-apps/apps.bhopal.dev/tambola/public/audio/hi"

os.makedirs(os.path.join(BASE_DIR, "phrases"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "numbers"), exist_ok=True)

async def generate_audio():
    print("Starting generation of 180 Hindi MP3s...")
    
    tasks = []
    
    for num, phrase in hindi_phrases.items():
        # 1. With Phrases
        phrase_path = os.path.join(BASE_DIR, "phrases", f"{num}.mp3")
        phrase_text = phrase.split(' - ')[1] if ' - ' in phrase else phrase
        spoken_phrase = f"{num}... {phrase_text}"
        communicate = edge_tts.Communicate(spoken_phrase, VOICE, rate="+5%")
        tasks.append(communicate.save(phrase_path))
        
        # 2. Without Phrases (Just the number)
        pure_num = phrase.split(' - ')[0]
        num_path = os.path.join(BASE_DIR, "numbers", f"{num}.mp3")
        communicate_num = edge_tts.Communicate(pure_num, VOICE, rate="+5%")
        tasks.append(communicate_num.save(num_path))
        
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(generate_audio())
    print("Done generating all Hindi MP3s!")
