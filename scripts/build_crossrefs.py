#!/usr/bin/env python3
"""
SOLAPATH Cross-Reference Conversion Script

Converts the OpenBible.info cross-reference dataset (CC-BY licensed)
into per-book JSON chunks for SOLAPATH offline use.

Input:  cross_references.txt (tab-separated: From Verse, To Verse, Votes)
Output: src/data/crossrefs/<BOOKID>.json files

Source: https://www.openbible.info/labs/cross-references
License: Creative Commons Attribution (CC-BY)
"""

import json
import os
import sys
from collections import defaultdict

# OpenBible abbreviation -> SOLAPATH canonical book ID
# Based on actual abbreviations found in the source dataset
BOOK_MAP = {
    'Gen': 'GEN', 'Exod': 'EXO', 'Lev': 'LEV', 'Num': 'NUM', 'Deut': 'DEU',
    'Josh': 'JOS', 'Judg': 'JDG', 'Ruth': 'RUT', '1Sam': '1SA', '2Sam': '2SA',
    '1Kgs': '1KI', '2Kgs': '2KI', '1Chr': '1CH', '2Chr': '2CH', 'Ezra': 'EZR',
    'Neh': 'NEH', 'Esth': 'EST', 'Job': 'JOB', 'Ps': 'PSA', 'Prov': 'PRO',
    'Eccl': 'ECC', 'Song': 'SNG', 'Isa': 'ISA', 'Jer': 'JER', 'Lam': 'LAM',
    'Ezek': 'EZK', 'Dan': 'DAN', 'Hos': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO',
    'Obad': 'OBA', 'Jonah': 'JON', 'Mic': 'MIC', 'Nah': 'NAM', 'Hab': 'HAB',
    'Zeph': 'ZEP', 'Hag': 'HAG', 'Zech': 'ZEC', 'Mal': 'MAL',
    'Matt': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
    'Rom': 'ROM', '1Cor': '1CO', '2Cor': '2CO', 'Gal': 'GAL', 'Eph': 'EPH',
    'Phil': 'PHP', 'Col': 'COL', '1Thess': '1TH', '2Thess': '2TH',
    '1Tim': '1TI', '2Tim': '2TI', 'Titus': 'TIT', 'Phlm': 'PHM',
    'Heb': 'HEB', 'Jas': 'JAS', '1Pet': '1PE', '2Pet': '2PE',
    '1John': '1JN', '2John': '2JN', '3John': '3JN', 'Jude': 'JUD', 'Rev': 'REV',
}

# Reverse map: SOLAPATH book name -> canonical ID
# (for display in the app, not used by this script)
BOOK_NAME_TO_ID = {
    'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
    'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
    '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
    '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
    'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Psalms': 'PSA',
    'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG',
    'Isaiah': 'ISA', 'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK',
    'Daniel': 'DAN', 'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO',
    'Obadiah': 'OBA', 'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAM',
    'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC',
    'Malachi': 'MAL', 'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK',
    'John': 'JHN', 'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO',
    '2 Corinthians': '2CO', 'Galatians': 'GAL', 'Ephesians': 'EPH',
    'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH',
    '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
    'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS',
    '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN',
    '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV',
}

# Canonical ID -> SOLAPATH display name (English)
ID_TO_NAME = {v: k for k, v in BOOK_NAME_TO_ID.items() if v != 'PSA' or k == 'Psalms'}

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


def parse_ref(ref_str):
    """Parse a reference like 'Gen.1.1' or 'John.1.1-John.1.3' into (book_id, chapter, verse, end_chapter, end_verse)"""
    # Check for range
    if '-' in ref_str:
        parts = ref_str.split('-')
        start = parse_single_ref(parts[0].strip())
        end = parse_single_ref(parts[1].strip())
        if start and end:
            return (start[0], start[1], start[2], end[1], end[2])
        return None
    else:
        result = parse_single_ref(ref_str)
        if result:
            return (result[0], result[1], result[2], result[1], result[2])
        return None


def parse_single_ref(ref_str):
    """Parse 'Gen.1.1' -> (book_id, chapter, verse)"""
    parts = ref_str.strip().split('.')
    if len(parts) != 3:
        return None
    book_abbr = parts[0]
    book_id = BOOK_MAP.get(book_abbr)
    if not book_id:
        return None
    try:
        chapter = int(parts[1])
        verse = int(parts[2])
    except ValueError:
        return None
    return (book_id, chapter, verse)


def format_target(book_id, chapter, verse, end_chapter, end_verse):
    """Format a target reference for display."""
    name = ID_TO_NAME.get(book_id, book_id)
    if end_chapter != chapter or end_verse != verse:
        if end_chapter != chapter:
            return f"{name} {chapter}:{verse}-{end_chapter}:{end_verse}"
        else:
            return f"{name} {chapter}:{verse}-{end_verse}"
    return f"{name} {chapter}:{verse}"


def main():
    input_file = sys.argv[1] if len(sys.argv) > 1 else '/tmp/crossrefs_raw/cross_references.txt'
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'src/data/crossrefs'

    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found", file=sys.stderr)
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    # Parse all lines
    # Format: From Verse\tTo Verse\tVotes
    # Skip header line
    book_data = defaultdict(lambda: defaultdict(list))
    seen_pairs = set()
    unmapped_abbrs = set()
    total_lines = 0
    total_relationships = 0
    duplicates = 0

    with open(input_file, 'r', encoding='utf-8') as f:
        header = f.readline()  # Skip header
        for line in f:
            total_lines += 1
            parts = line.strip().split('\t')
            if len(parts) < 3:
                continue

            from_str = parts[0]
            to_str = parts[1]
            votes = parts[2]

            try:
                votes_int = int(votes)
            except ValueError:
                continue

            # Parse source reference (may be a range)
            from_parsed = parse_ref(from_str)
            if not from_parsed:
                # Check for unmapped abbreviation
                abbr = from_str.split('.')[0]
                if abbr not in BOOK_MAP:
                    unmapped_abbrs.add(abbr)
                continue

            # Parse target reference (may be a range)
            to_parsed = parse_ref(to_str)
            if not to_parsed:
                abbr = to_str.split('.')[0]
                if abbr not in BOOK_MAP:
                    unmapped_abbrs.add(abbr)
                continue

            src_book, src_ch, src_v, src_end_ch, src_end_v = from_parsed
            tgt_book, tgt_ch, tgt_v, tgt_end_ch, tgt_end_v = to_parsed

            # Format target for display
            target_label = format_target(tgt_book, tgt_ch, tgt_v, tgt_end_ch, tgt_end_v)

            # Index against every source verse in the range
            if src_end_ch == src_ch and src_end_v == src_v:
                # Single verse
                key = f"{src_ch}.{src_v}"
                dedup_key = (src_book, src_ch, src_v, target_label)
                if dedup_key in seen_pairs:
                    duplicates += 1
                    # Keep the one with higher votes
                    existing = book_data[src_book][key]
                    for i, item in enumerate(existing):
                        if item['target'] == target_label:
                            if votes_int > item['rank']:
                                item['rank'] = votes_int
                            break
                    continue
                seen_pairs.add(dedup_key)
                book_data[src_book][key].append({'target': target_label, 'rank': votes_int})
                total_relationships += 1
            else:
                # Range: index against each verse in the range
                if src_end_ch == src_ch:
                    for v in range(src_v, src_end_v + 1):
                        key = f"{src_ch}.{v}"
                        dedup_key = (src_book, src_ch, v, target_label)
                        if dedup_key in seen_pairs:
                            duplicates += 1
                            continue
                        seen_pairs.add(dedup_key)
                        book_data[src_book][key].append({'target': target_label, 'rank': votes_int})
                        total_relationships += 1
                else:
                    # Multi-chapter range - just index first verse for simplicity
                    key = f"{src_ch}.{src_v}"
                    dedup_key = (src_book, src_ch, src_v, target_label)
                    if dedup_key not in seen_pairs:
                        seen_pairs.add(dedup_key)
                        book_data[src_book][key].append({'target': target_label, 'rank': votes_int})
                        total_relationships += 1

    # Sort each verse's references by rank (highest first)
    for book_id, verses in book_data.items():
        for key, refs in verses.items():
            refs.sort(key=lambda x: x['rank'], reverse=True)

    # Write output files
    file_count = 0
    for book_id, verses in book_data.items():
        output_path = os.path.join(output_dir, f"{book_id}.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(verses, f, ensure_ascii=False, separators=(',', ':'))
        file_count += 1

    # Also write book map metadata
    meta = {
        'source': 'OpenBible.info cross-reference dataset',
        'license': 'Creative Commons Attribution (CC-BY)',
        'source_url': 'https://www.openbible.info/labs/cross-references',
        'generated': '2026-09-01',
        'total_relationships': total_relationships,
        'total_source_verses': sum(len(v) for v in book_data.values()),
        'book_files': file_count,
        'duplicates_removed': duplicates,
    }
    meta_path = os.path.join(output_dir, '_meta.json')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)

    # Report
    print(f"INPUT LINES: {total_lines}")
    print(f"OUTPUT FILES: {file_count}")
    print(f"SOURCE VERSES WITH REFERENCES: {sum(len(v) for v in book_data.values())}")
    print(f"TOTAL UNIQUE RELATIONSHIPS: {total_relationships}")
    print(f"DUPLICATES REMOVED: {duplicates}")
    print(f"UNMAPPED ABBREVIATIONS: {len(unmapped_abbrs)}")
    if unmapped_abbrs:
        print(f"UNMAPPED: {sorted(unmapped_abbrs)}")
    else:
        print("UNMAPPED: 0 (all book abbreviations recognized)")


if __name__ == '__main__':
    main()
