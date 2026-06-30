"""
Converts DESIGN.md to a well-formatted DESIGN.docx.
Run from the project root: python scripts/generate_design_doc.py
Removes any existing DESIGN.docx before writing a fresh copy.
"""

import re
import os
import sys
from pathlib import Path
from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = Path(__file__).parent.parent
SRC  = ROOT / "DESIGN.md"
DEST = ROOT / "DESIGN.docx"


# ── Colour palette ────────────────────────────────────────────────────────────
NAVY      = RGBColor(0x00, 0x09, 0x36)   # #000936
GOLD      = RGBColor(0xFD, 0xC8, 0x00)   # #FDC800
ORANGE    = RGBColor(0xE3, 0x4C, 0x00)   # #E34C00
SKY       = RGBColor(0x56, 0xDB, 0xFF)   # #56DBFF
BLUE      = RGBColor(0x00, 0x66, 0xCB)   # #0066CB
DARK_GRAY = RGBColor(0x1E, 0x29, 0x3B)
MID_GRAY  = RGBColor(0x47, 0x55, 0x69)
LIGHT_BG  = RGBColor(0xF1, 0xF5, 0xF9)
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
CODE_BG   = RGBColor(0xF8, 0xFA, 0xFC)
CODE_FG   = RGBColor(0x0F, 0x17, 0x2A)


def set_cell_bg(cell, hex_color: str):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def set_cell_borders(cell, color="C0C0C0"):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for side in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        tcBorders.append(el)
    tcPr.append(tcBorders)


def set_table_borders(table, color="D1D5DB"):
    tbl = table._tbl
    tblPr = tbl.tblPr
    tblBorders = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        tblBorders.append(el)
    tblPr.append(tblBorders)


def para_spacing(para, before=0, after=0, line=None):
    pPr = para._p.get_or_add_pPr()
    spacing = OxmlElement("w:spacing")
    spacing.set(qn("w:before"), str(before))
    spacing.set(qn("w:after"),  str(after))
    if line:
        spacing.set(qn("w:line"), str(line))
        spacing.set(qn("w:lineRule"), "auto")
    pPr.append(spacing)


def add_page_break(doc):
    para = doc.add_paragraph()
    run  = para.add_run()
    run.add_break(docx_break_type())
    para_spacing(para, 0, 0)


def docx_break_type():
    from docx.oxml.ns import qn as _qn
    from docx.oxml import OxmlElement as _el
    br = _el("w:br")
    br.set(_qn("w:type"), "page")
    return br


def apply_inline(run, text: str):
    """Apply bold/italic/code marks from a single inline run's text."""
    run.text = text


def add_styled_para(doc, text: str, style_name: str, color=None, bold=False,
                    size_pt=None, align=None, space_before=0, space_after=0):
    para = doc.add_paragraph(style=style_name)
    para_spacing(para, space_before, space_after)
    if align:
        para.alignment = align
    run = para.add_run()
    run.text = text
    if color:
        run.font.color.rgb = color
    if bold:
        run.bold = True
    if size_pt:
        run.font.size = Pt(size_pt)
    return para


def render_inline(para, text: str, base_color=None, base_bold=False, base_size=None):
    """
    Parse a markdown inline string and add runs to `para`.
    Handles **bold**, *italic*, `code`, and plain text segments.
    """
    pattern = re.compile(r"(\*\*.*?\*\*|\*.*?\*|`[^`]+`)")
    parts = pattern.split(text)
    for part in parts:
        if not part:
            continue
        run = para.add_run()
        if part.startswith("**") and part.endswith("**"):
            run.text = part[2:-2]
            run.bold = True
        elif part.startswith("*") and part.endswith("*"):
            run.text = part[1:-1]
            run.italic = True
        elif part.startswith("`") and part.endswith("`"):
            run.text = part[1:-1]
            run.font.name = "Courier New"
            run.font.size = Pt(9)
            run.font.color.rgb = CODE_FG
        else:
            run.text = part
            if base_color:
                run.font.color.rgb = base_color
            if base_bold:
                run.bold = True
            if base_size:
                run.font.size = Pt(base_size)
    return para


def parse_md_table(lines: list[str]) -> tuple[list[str], list[list[str]]]:
    """Return (headers, rows) from a markdown table block."""
    headers, rows = [], []
    for i, line in enumerate(lines):
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if i == 0:
            headers = cells
        elif re.match(r"^[\s|:\-]+$", line):
            continue
        else:
            rows.append(cells)
    return headers, rows


def build_doc(md_text: str) -> Document:
    doc = Document()

    # ── Page setup ────────────────────────────────────────────────────────────
    section = doc.sections[0]
    section.page_width  = Inches(8.5)
    section.page_height = Inches(11)
    section.left_margin   = Inches(1.1)
    section.right_margin  = Inches(1.1)
    section.top_margin    = Inches(1.0)
    section.bottom_margin = Inches(1.0)

    # ── Define styles ─────────────────────────────────────────────────────────
    styles = doc.styles

    def ensure_style(name, base="Normal"):
        if name in [s.name for s in styles]:
            return styles[name]
        st = styles.add_style(name, 1)  # WD_STYLE_TYPE.PARAGRAPH = 1
        st.base_style = styles[base]
        return st

    # Normal
    normal = styles["Normal"]
    normal.font.name  = "Calibri"
    normal.font.size  = Pt(10.5)
    normal.font.color.rgb = DARK_GRAY

    # Heading 1
    h1 = styles["Heading 1"]
    h1.font.name  = "Calibri"
    h1.font.size  = Pt(22)
    h1.font.bold  = True
    h1.font.color.rgb = NAVY
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after  = Pt(6)

    # Heading 2
    h2 = styles["Heading 2"]
    h2.font.name  = "Calibri"
    h2.font.size  = Pt(15)
    h2.font.bold  = True
    h2.font.color.rgb = BLUE
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after  = Pt(4)

    # Heading 3
    h3 = styles["Heading 3"]
    h3.font.name  = "Calibri"
    h3.font.size  = Pt(12)
    h3.font.bold  = True
    h3.font.color.rgb = MID_GRAY
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after  = Pt(2)

    # Bullet
    bullet_style = ensure_style("MD Bullet", "Normal")
    bullet_style.font.name = "Calibri"
    bullet_style.font.size = Pt(10.5)
    bullet_style.paragraph_format.left_indent  = Cm(0.8)
    bullet_style.paragraph_format.space_before = Pt(1)
    bullet_style.paragraph_format.space_after  = Pt(1)

    # Code block
    code_style = ensure_style("MD Code", "Normal")
    code_style.font.name  = "Courier New"
    code_style.font.size  = Pt(8.5)
    code_style.font.color.rgb = CODE_FG
    code_style.paragraph_format.left_indent  = Cm(0.6)
    code_style.paragraph_format.space_before = Pt(1)
    code_style.paragraph_format.space_after  = Pt(1)

    # Italic note
    note_style = ensure_style("MD Note", "Normal")
    note_style.font.name   = "Calibri"
    note_style.font.size   = Pt(9.5)
    note_style.font.italic = True
    note_style.font.color.rgb = MID_GRAY

    # ── Cover page ────────────────────────────────────────────────────────────
    cover = doc.add_paragraph()
    cover.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(cover, 1440, 72)  # ~1 inch before
    r = cover.add_run("SelectEd")
    r.font.name  = "Calibri"
    r.font.size  = Pt(40)
    r.font.bold  = True
    r.font.color.rgb = NAVY

    tagline = doc.add_paragraph()
    tagline.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(tagline, 0, 72)
    rt = tagline.add_run("Design & Architecture Document")
    rt.font.name  = "Calibri"
    rt.font.size  = Pt(18)
    rt.font.color.rgb = BLUE

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(sub, 0, 576)
    rs = sub.add_run("AI-powered exam preparation for Australian & international competitions")
    rs.font.name   = "Calibri"
    rs.font.size   = Pt(12)
    rs.font.italic = True
    rs.font.color.rgb = MID_GRAY

    # divider
    div = doc.add_paragraph()
    div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(div, 0, 288)
    rd = div.add_run("─" * 42)
    rd.font.color.rgb = SKY
    rd.font.size = Pt(13)

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(meta, 0, 0)
    rm = meta.add_run("Santrupta Mishra (San)  ·  Founder, SelectEd  ·  June 2026")
    rm.font.name  = "Calibri"
    rm.font.size  = Pt(10)
    rm.font.color.rgb = MID_GRAY

    doc.add_page_break()

    # ── Parse markdown ────────────────────────────────────────────────────────
    lines = md_text.splitlines()
    i = 0
    in_code = False
    code_buf: list[str] = []

    while i < len(lines):
        line = lines[i]

        # ── Code fence ────────────────────────────────────────────────────────
        if line.strip().startswith("```"):
            if not in_code:
                in_code = True
                code_buf = []
                i += 1
                continue
            else:
                in_code = False
                # Render code block with light background shading
                for cl in code_buf:
                    cp = doc.add_paragraph(style="MD Code")
                    para_spacing(cp, 0, 0)
                    cp.add_run(cl if cl else " ")
                    # shade via XML
                    pPr = cp._p.get_or_add_pPr()
                    shd = OxmlElement("w:shd")
                    shd.set(qn("w:val"), "clear")
                    shd.set(qn("w:color"), "auto")
                    shd.set(qn("w:fill"), "F1F5F9")
                    pPr.append(shd)
                i += 1
                doc.add_paragraph()  # breathing room
                continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        # ── HR ────────────────────────────────────────────────────────────────
        if re.match(r"^-{3,}$", line.strip()) or re.match(r"^_{3,}$", line.strip()):
            hr = doc.add_paragraph()
            para_spacing(hr, 72, 72)
            hr.alignment = WD_ALIGN_PARAGRAPH.CENTER
            rr = hr.add_run("─" * 55)
            rr.font.color.rgb = RGBColor(0xE2, 0xE8, 0xF0)
            rr.font.size = Pt(9)
            i += 1
            continue

        # ── Headings ─────────────────────────────────────────────────────────
        m = re.match(r"^(#{1,3})\s+(.*)", line)
        if m:
            level = len(m.group(1))
            text  = m.group(2).strip()
            style_map = {1: "Heading 1", 2: "Heading 2", 3: "Heading 3"}
            para = doc.add_paragraph(style=style_map.get(level, "Heading 3"))
            render_inline(para, text)
            i += 1
            continue

        # ── Markdown table ────────────────────────────────────────────────────
        if line.strip().startswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            headers, rows = parse_md_table(table_lines)
            if not headers:
                continue
            ncols = len(headers)
            tbl = doc.add_table(rows=1 + len(rows), cols=ncols)
            tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
            set_table_borders(tbl)
            tbl.style = "Table Grid"

            # Header row
            hdr_cells = tbl.rows[0].cells
            for ci, h in enumerate(headers):
                hdr_cells[ci].text = ""
                p = hdr_cells[ci].paragraphs[0]
                r = p.add_run(h)
                r.bold = True
                r.font.color.rgb = WHITE
                r.font.size = Pt(9.5)
                r.font.name = "Calibri"
                set_cell_bg(hdr_cells[ci], "000936")
                set_cell_borders(hdr_cells[ci], "000936")

            # Data rows
            for ri, row in enumerate(rows):
                row_cells = tbl.rows[ri + 1].cells
                bg = "F8FAFC" if ri % 2 == 0 else "FFFFFF"
                for ci, cell_text in enumerate(row):
                    if ci >= ncols:
                        break
                    row_cells[ci].text = ""
                    p = row_cells[ci].paragraphs[0]
                    render_inline(p, cell_text.strip(),
                                  base_color=DARK_GRAY, base_size=9)
                    p.runs[0].font.size = Pt(9) if p.runs else None
                    set_cell_bg(row_cells[ci], bg)
                    set_cell_borders(row_cells[ci], "E2E8F0")

            doc.add_paragraph()  # breathing room after table
            continue

        # ── Bullet list ───────────────────────────────────────────────────────
        m_bullet = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)", line)
        if m_bullet:
            indent = len(m_bullet.group(1))
            text   = m_bullet.group(3)
            is_num = bool(re.match(r"\d+\.", m_bullet.group(2)))
            bp = doc.add_paragraph(style="MD Bullet")
            if is_num:
                bp.style = doc.styles["List Number"]
            else:
                bp.style = doc.styles["List Bullet"]
            bp.paragraph_format.left_indent = Cm(0.8 + indent * 0.4)
            render_inline(bp, text, base_color=DARK_GRAY)
            i += 1
            continue

        # ── Italic/note line (starts with *) ─────────────────────────────────
        if line.strip().startswith("*") and line.strip().endswith("*") and not line.strip().startswith("**"):
            np = doc.add_paragraph(style="MD Note")
            para_spacing(np, 4, 4)
            np.add_run(line.strip().strip("*"))
            i += 1
            continue

        # ── Blank line ────────────────────────────────────────────────────────
        if not line.strip():
            i += 1
            continue

        # ── Normal paragraph ──────────────────────────────────────────────────
        pp = doc.add_paragraph(style="Normal")
        para_spacing(pp, 2, 4)
        render_inline(pp, line.strip(), base_color=DARK_GRAY)
        i += 1

    return doc


def main():
    if not SRC.exists():
        print(f"ERROR: {SRC} not found")
        sys.exit(1)

    # Remove old version
    if DEST.exists():
        DEST.unlink()
        print(f"Removed old {DEST.name}")

    md_text = SRC.read_text(encoding="utf-8")
    doc = build_doc(md_text)
    doc.save(str(DEST))
    print(f"Saved {DEST.name}  ({DEST.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
