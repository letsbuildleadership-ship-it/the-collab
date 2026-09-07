#!/usr/bin/env python3
"""Converts real product .docx files (sourced from Google Drive) into the
HTML body fragments used by scripts/generate-pdfs.mjs. Run once per doc:

    python3 scripts/convert-drive-docx.py <source.docx> <output.html.fragment>

Uses mammoth for docx->HTML (preserves headings/lists/bold/images), then
remaps tags onto the site's existing PDF CSS classes (doc-h2, doc-h3,
doc-list, lead) so the real content renders inside the same branded
template/cover already used for the rest of the catalog.
"""
import sys
import mammoth
from bs4 import BeautifulSoup


def convert(src_path: str) -> str:
    with open(src_path, "rb") as f:
        result = mammoth.convert_to_html(f)
    html = result.value
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all(["h1", "h2"]):
        tag.name = "h2"
        tag["class"] = "doc-h2"
    for tag in soup.find_all("h3"):
        tag["class"] = "doc-h3"
    for tag in soup.find_all("h4"):
        tag.name = "h3"
        tag["class"] = "doc-h3"
    for tag in soup.find_all(["ul", "ol"]):
        existing = tag.get("class", [])
        tag["class"] = existing + ["doc-list"]
    # The source docs embed the same Co.LLab logo/wordmark image once or
    # twice as a section divider; our own cover page already carries that
    # branding moment, so drop embedded images rather than duplicate it.
    for tag in soup.find_all("img"):
        tag.decompose()
    # Drop empty anchor targets mammoth emits for heading bookmarks.
    for tag in soup.find_all("a", attrs={"id": True}):
        if not tag.get_text(strip=True):
            tag.decompose()

    return str(soup)


if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    html = convert(src)
    with open(out, "w") as f:
        f.write(html)
    print(f"wrote {len(html)} chars -> {out}")
