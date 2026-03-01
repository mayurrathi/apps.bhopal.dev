import asyncio
import edge_tts
import os

english_phrases = {
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

VOICE = "en-US-GuyNeural"
BASE_DIR = "/Users/mayankrathi/Downloads/Business Idea Prototypes/play-store-apps/apps.bhopal.dev/tambola/public/audio/en"

os.makedirs(os.path.join(BASE_DIR, "phrases"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "numbers"), exist_ok=True)

async def generate_audio():
    print("Starting generation of 180 English MP3s...")
    
    tasks = []
    
    for num, phrase in english_phrases.items():
        # 1. With Phrases
        phrase_path = os.path.join(BASE_DIR, "phrases", f"{num}.mp3")
        spoken_phrase = f"{num}... {phrase}"
        communicate = edge_tts.Communicate(spoken_phrase, VOICE, rate="+5%")
        tasks.append(communicate.save(phrase_path))
        
        # 2. Without Phrases (Just the number)
        pure_num = str(num)
        num_path = os.path.join(BASE_DIR, "numbers", f"{num}.mp3")
        communicate_num = edge_tts.Communicate(pure_num, VOICE, rate="+5%")
        tasks.append(communicate_num.save(num_path))
        
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(generate_audio())
    print("Done generating all English MP3s!")
