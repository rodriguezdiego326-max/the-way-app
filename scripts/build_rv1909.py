#!/usr/bin/env python3
"""
SOLAPATH RV1909 (Reina-Valera 1909) Conversion Script

Converts eBible.org RV1909 mobile HTML files into per-book JSON chunks
matching SOLAPATH's WEB Bible format.

Input:  Directory of HTM files (spaRV1909_html.zip extracted)
Output: src/data/bible/rv1909/<book>.json files

Source: https://ebible.org/find/details.php?id=spaRV1909
License: Public Domain
"""

import json
import os
import re
import sys
import glob

# eBible.org book abbreviation -> SOLAPATH canonical book ID
BOOK_MAP = {
    'GEN': 'GEN', 'EXO': 'EXO', 'LEV': 'LEV', 'NUM': 'NUM', 'DEU': 'DEU',
    'JOS': 'JOS', 'JDG': 'JDG', 'RUT': 'RUT', '1SA': '1SA', '2SA': '2SA',
    '1KI': '1KI', '2KI': '2KI', '1CH': '1CH', '2CH': '2CH', 'EZR': 'EZR',
    'NEH': 'NEH', 'EST': 'EST', 'JOB': 'JOB', 'PSA': 'PSA', 'PRO': 'PRO',
    'ECC': 'ECC', 'SNG': 'SNG', 'ISA': 'ISA', 'JER': 'JER', 'LAM': 'LAM',
    'EZK': 'EZK', 'DAN': 'DAN', 'HOS': 'HOS', 'JOL': 'JOL', 'AMO': 'AMO',
    'OBA': 'OBA', 'JON': 'JON', 'MIC': 'MIC', 'NAM': 'NAM', 'HAB': 'HAB',
    'ZEP': 'ZEP', 'HAG': 'HAG', 'ZEC': 'ZEC', 'MAL': 'MAL',
    'MAT': 'MAT', 'MRK': 'MRK', 'LUK': 'LUK', 'JHN': 'JHN', 'ACT': 'ACT',
    'ROM': 'ROM', '1CO': '1CO', '2CO': '2CO', 'GAL': 'GAL', 'EPH': 'EPH',
    'PHP': 'PHP', 'COL': 'COL', '1TH': '1TH', '2TH': '2TH',
    '1TI': '1TI', '2TI': '2TI', 'TIT': 'TIT', 'PHM': 'PHM',
    'HEB': 'HEB', 'JAS': 'JAS', '1PE': '1PE', '2PE': '2PE',
    '1JN': '1JN', '2JN': '2JN', '3JN': '3JN', 'JUD': 'JUD', 'REV': 'REV',
}

# Canonical ID -> Spanish display name
ID_TO_SPANISH = {
    'GEN': 'Génesis', 'EXO': 'Éxodo', 'LEV': 'Levítico', 'NUM': 'Números',
    'DEU': 'Deuteronomio', 'JOS': 'Josué', 'JDG': 'Jueces', 'RUT': 'Rut',
    '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Reyes', '2KI': '2 Reyes',
    '1CH': '1 Crónicas', '2CH': '2 Crónicas', 'EZR': 'Esdras', 'NEH': 'Nehemías',
    'EST': 'Ester', 'JOB': 'Job', 'PSA': 'Salmos', 'PRO': 'Proverbios',
    'ECC': 'Eclesiastés', 'SNG': 'Cantares', 'ISA': 'Isaías', 'JER': 'Jeremías',
    'LAM': 'Lamentaciones', 'EZK': 'Ezequiel', 'DAN': 'Daniel', 'HOS': 'Oseas',
    'JOL': 'Joel', 'AMO': 'Amós', 'OBA': 'Abdías', 'JON': 'Jonás', 'MIC': 'Miqueas',
    'NAM': 'Nahúm', 'HAB': 'Habacuc', 'ZEP': 'Sofonías', 'HAG': 'Hageo',
    'ZEC': 'Zacarías', 'MAL': 'Malaquías', 'MAT': 'Mateo', 'MRK': 'Marcos',
    'LUK': 'Lucas', 'JHN': 'Juan', 'ACT': 'Hechos', 'ROM': 'Romanos',
    '1CO': '1 Corintios', '2CO': '2 Corintios', 'GAL': 'Gálatas', 'EPH': 'Efesios',
    'PHP': 'Filipenses', 'COL': 'Colosenses', '1TH': '1 Tesalonicenses',
    '2TH': '2 Tesalonicenses', '1TI': '1 Timoteo', '2TI': '2 Timoteo',
    'TIT': 'Tito', 'PHM': 'Filemón', 'HEB': 'Hebreos', 'JAS': 'Santiago',
    '1PE': '1 Pedro', '2PE': '2 Pedro', '1JN': '1 Juan', '2JN': '2 Juan',
    '3JN': '3 Juan', 'JUD': 'Judas', 'REV': 'Apocalipsis',
}


def parse_htm_file(filepath):
    """Parse an eBible.org HTM file and extract verses."""
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        content = f.read()

    verses = []
    pattern = r'<span class="verse" id="V(\d+)">\d+&#160;</span>(.*?)(?=<span class="verse" id="V\d+">|$)'
    matches = re.findall(pattern, content, re.DOTALL)

    for verse_num, verse_text in matches:
        text = verse_text.strip()
        text = re.sub(r'<[^>]+>', '', text)
        text = text.replace('&#160;', ' ').replace('&amp;', '&')
        text = text.replace('&lt;', '<').replace('&gt;', '>')
        text = text.replace('&ldquo;', '\u201c').replace('&rdquo;', '\u201d')
        text = text.replace('&lsquo;', '\u2018').replace('&rsquo;', '\u2019')
        text = text.replace('&nbsp;', ' ').replace('&mdash;', '\u2014')
        text = text.replace('&ndash;', '\u2013')
        text = re.sub(r'\s+', ' ', text).strip()
        if text:
            verses.append({'verse': int(verse_num), 'text': text})

    return verses


def main():
    input_dir = sys.argv[1] if len(sys.argv) > 1 else '/tmp/rv1909_raw'
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'src/data/bible/rv1909'

    if not os.path.exists(input_dir):
        print(f"Error: Input directory {input_dir} not found", file=sys.stderr)
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    htm_files = glob.glob(os.path.join(input_dir, '*.htm'))
    book_chapters = {}

    for filepath in htm_files:
        filename = os.path.basename(filepath)
        # Only match chapter files like JHN01.htm, 1CH03.htm, etc.
        if not re.match(r'^[A-Z0-9]+\d+\.htm$', filename):
            continue

        # Split into book prefix and chapter number
        # Books starting with digits: 1CH01 -> book=1CH, ch=01
        # Books starting with letters: JHN03 -> book=JHN, ch=03
        match = re.match(r'^([A-Z0-9]+?)(\d+)\.htm$', filename)
        if not match:
            continue
        book_abbr = match.group(1)
        chapter_num = int(match.group(2))

        book_id = BOOK_MAP.get(book_abbr)
        if not book_id:
            print(f"WARNING: Unknown book abbreviation: {book_abbr} ({filename})", file=sys.stderr)
            continue

        if book_id not in book_chapters:
            book_chapters[book_id] = {}

        verses = parse_htm_file(filepath)
        book_chapters[book_id][chapter_num] = verses

    # Write output files
    file_count = 0
    total_verses = 0

    for book_id, chapters in book_chapters.items():
        sorted_chapters = []
        for ch_num in sorted(chapters.keys()):
            sorted_chapters.append({
                'chapter': ch_num,
                'verses': chapters[ch_num],
            })
            total_verses += len(chapters[ch_num])

        output_path = os.path.join(output_dir, f"{book_id.lower()}.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                'book': ID_TO_SPANISH.get(book_id, book_id),
                'book_id': book_id,
                'translation': 'RV1909',
                'chapters': sorted_chapters,
            }, f, ensure_ascii=False, separators=(',', ':'))
        file_count += 1

    # Write index file
    index_data = {
        'translation': 'RV1909',
        'language': 'es',
        'books': {bid: ID_TO_SPANISH.get(bid, bid) for bid in sorted(book_chapters.keys())},
    }
    index_path = os.path.join(output_dir, 'index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"BOOK COUNT: {file_count}")
    print(f"TOTAL VERSES: {total_verses}")
    print(f"OUTPUT DIR: {output_dir}")

    expected = set(BOOK_MAP.values())
    found = set(book_chapters.keys())
    missing = expected - found
    extra = found - expected
    if missing:
        print(f"MISSING BOOKS: {sorted(missing)}")
    if extra:
        print(f"EXTRA BOOKS: {sorted(extra)}")
    if not missing and not extra:
        print("ALL 66 BOOKS PRESENT")


if __name__ == '__main__':
    main()
