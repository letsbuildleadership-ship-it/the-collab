"""Finds the drawn write-in lines and empty table cells in a flat PDF and prints them as JSON
form-field specs for make-static-pdfs-fillable.mjs.

Used for the Blueprint™ series PDFs, which were designed outside the HTML
templates and have no source to tag. A write-in line there is drawn either
as one thin filled rectangle or as a dashed run of tiny ones; both are
merged into a single line per row. A write-in table is drawn as rules split
at each column boundary; every empty cell between two such rules becomes a
multi-line field. Usage: python3 detect-write-lines.py FILE
"""
import json
import sys

import pdfplumber

MIN_LINE_WIDTH = 60  # pt; shorter rules are decoration, not answer space
MAX_THICKNESS = 1.6  # pt
DASH_GAP = 4  # pt between dashes that still counts as one line
# Write-in lines are drawn in the design's mid grey; title underlines, table
# of contents separators and accent rules are near-black or orange.
WRITE_LINE_GREY = (0.4, 0.7)
FIELD_HEIGHT = 16  # pt of typing room above each line


def detect(path):
    fields = []
    with pdfplumber.open(path) as pdf:
        for page_index, page in enumerate(pdf.pages):
            # Leave the running header/footer rules alone.
            top_limit, bottom_limit = page.height * 0.12, page.height * 0.89
            rows = {}
            for r in page.rects:
                if r['bottom'] - r['top'] > MAX_THICKNESS:
                    continue
                if not top_limit < r['top'] < bottom_limit:
                    continue
                color = r.get('non_stroking_color') or ()
                if len(color) != 3 or not all(WRITE_LINE_GREY[0] <= c <= WRITE_LINE_GREY[1] for c in color):
                    continue
                rows.setdefault(round(r['top']), []).append((r['x0'], r['x1']))

            words = page.extract_words()
            for y, segs in sorted(rows.items()):
                segs.sort()
                merged = [list(segs[0])]
                for x0, x1 in segs[1:]:
                    if x0 - merged[-1][1] <= DASH_GAP:
                        merged[-1][1] = max(merged[-1][1], x1)
                    else:
                        merged.append([x0, x1])
                for x0, x1 in merged:
                    if x1 - x0 < MIN_LINE_WIDTH:
                        continue
                    # Don't let the field reach up over the prompt text.
                    above = [w['bottom'] for w in words
                             if w['bottom'] <= y + 1 and w['bottom'] > y - FIELD_HEIGHT - 2
                             and w['x1'] > x0 and w['x0'] < x1]
                    ceiling = max(above, default=y - FIELD_HEIGHT - 1) + 1
                    h = max(min(FIELD_HEIGHT, y - ceiling), 10)
                    fields.append({'type': 'text', 'page': page_index,
                                   'x': x0, 'y': y - h, 'w': x1 - x0, 'h': h, 'fontSize': 10})
        for page_index, page in enumerate(pdf.pages):
            fields.extend(detect_table_cells(page, page_index))
    return fields


def detect_table_cells(page, page_index):
    """Empty cells of tables whose rows are rules split per column."""
    rows = {}
    for r in page.rects:
        if r['bottom'] - r['top'] <= MAX_THICKNESS and r['x1'] - r['x0'] >= 20:
            rows.setdefault(round(r['top'], 1), []).append((round(r['x0']), round(r['x1'])))
    words = page.extract_words()
    cells = []
    ruled = sorted((y, tuple(sorted(segs))) for y, segs in rows.items() if len(segs) >= 2)
    for (y0, cols0), (y1, cols1) in zip(ruled, ruled[1:]):
        if cols0 != cols1 or y1 - y0 > 120:
            continue
        for x0, x1 in cols0:
            if any(w['x0'] < x1 and w['x1'] > x0 and w['top'] < y1 and w['bottom'] > y0 for w in words):
                continue
            cells.append({'type': 'text', 'page': page_index, 'x': x0 + 2, 'y': y0 + 2,
                          'w': x1 - x0 - 4, 'h': y1 - y0 - 4, 'fontSize': 9, 'multiline': True})
    return cells


if __name__ == '__main__':
    json.dump(detect(sys.argv[1]), sys.stdout)
