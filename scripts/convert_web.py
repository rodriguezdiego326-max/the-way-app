#!/usr/bin/env python3
"""Convert TehShrike world-english-bible JSON into chapter-level JSON files."""
import json
import os
import re

RAW_DIR = "/tmp/web-raw"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data", "bible", "web")

FILENAME_TO_BOOK = {
    "genesis": "Genesis", "exodus": "Exodus", "leviticus": "Leviticus",
    "numbers": "Numbers", "deuteronomy": "Deuteronomy", "joshua": "Joshua",
    "judges": "Judges", "ruth": "Ruth", "1samuel": "1 Samuel",
    "2samuel": "2 Samuel", "1kings": "1 Kings", "2kings": "2 Kings",
    "1chronicles": "1 Chronicles", "2chronicles": "2 Chronicles",
    "ezra": "Ezra", "nehemiah": "Nehemiah", "esther": "Esther",
    "job": "Job", "psalms": "Psalm", "proverbs": "Proverbs",
    "ecclesiastes": "Ecclesiastes", "songofsolomon": "Song of Solomon",
    "isaiah": "Isaiah", "jeremiah": "Jeremiah", "lamentations": "Lamentations",
    "ezekiel": "Ezekiel", "daniel": "Daniel", "hosea": "Hosea",
    "joel": "Joel", "amos": "Amos", "obadiah": "Obadiah", "jonah": "Jonah",
    "micah": "Micah", "nahum": "Nahum", "habakkuk": "Habakkuk",
    "zephaniah": "Zephaniah", "haggai": "Haggai", "zechariah": "Zechariah",
    "malachi": "Malachi", "matthew": "Matthew", "mark": "Mark",
    "luke": "Luke", "john": "John", "acts": "Acts", "romans": "Romans",
    "1corinthians": "1 Corinthians", "2corinthians": "2 Corinthians",
    "galatians": "Galatians", "ephesians": "Ephesians",
    "philippians": "Philippians", "colossians": "Colossians",
    "1thessalonians": "1 Thessalonians", "2thessalonians": "2 Thessalonians",
    "1timothy": "1 Timothy", "2timothy": "2 Timothy", "titus": "Titus",
    "philemon": "Philemon", "hebrews": "Hebrews", "james": "James",
    "1peter": "1 Peter", "2peter": "2 Peter", "1john": "1 John",
    "2john": "2 John", "3john": "3 John", "jude": "Jude",
    "revelation": "Revelation",
}

HTML_RE = re.compile(r'<[^>]+>')

def clean_text(text):
    text = HTML_RE.sub('', text)
    text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def convert_book(filename):
    key = filename.replace('.json', '')
    book_name = FILENAME_TO_BOOK.get(key)
    if not book_name:
        print(f"  SKIP unknown: {filename}")
        return None

    with open(os.path.join(RAW_DIR, filename), 'r', encoding='utf-8') as f:
        items = json.load(f)

    chapters_map = {}
    for item in items:
        itype = item.get("type")
        if itype not in ("paragraph text", "line text"):
            continue
        ch = item.get("chapterNumber")
        vn = item.get("verseNumber")
        val = item.get("value", "")
        if ch is None or vn is None:
            continue
        ch = int(ch)
        vn = int(vn)
        if ch not in chapters_map:
            chapters_map[ch] = {}
        if vn not in chapters_map[ch]:
            chapters_map[ch][vn] = []
        cleaned = clean_text(val)
        if cleaned:
            chapters_map[ch][vn].append(cleaned)

    chapters = []
    for ch_num in sorted(chapters_map.keys()):
        verses = []
        for vn in sorted(chapters_map[ch_num].keys()):
            text = " ".join(chapters_map[ch_num][vn])
            text = clean_text(text)
            if text:
                verses.append({"verse": vn, "text": text})
        chapters.append({"chapter": ch_num, "verses": verses})

    result = {"translation": "WEB", "book": book_name, "chapters": chapters}
    out_path = os.path.join(OUT_DIR, f"{key}.json")
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, separators=(',', ':'))

    total_verses = sum(len(c["verses"]) for c in chapters)
    print(f"  {book_name}: {len(chapters)} chapters, {total_verses} verses")
    return {"file": key, "book": book_name, "chapters": len(chapters), "verses": total_verses}

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    files = sorted([f for f in os.listdir(RAW_DIR) if f.endswith('.json')])
    print(f"Converting {len(files)} files...")
    index = []
    total_ch = 0
    total_v = 0
    for f in files:
        info = convert_book(f)
        if info:
            index.append(info)
            total_ch += info["chapters"]
            total_v += info["verses"]

    with open(os.path.join(OUT_DIR, "index.json"), 'w', encoding='utf-8') as f:
        json.dump({"translation": "WEB", "books": index}, f, ensure_ascii=False, separators=(',', ':'))

    print(f"\nDone: {len(index)} books, {total_ch} chapters, {total_v} verses")

if __name__ == "__main__":
    main()
