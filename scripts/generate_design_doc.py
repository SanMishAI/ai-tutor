"""
Converts DESIGN.md to a branded DESIGN.docx.
Run from the project root: python scripts/generate_design_doc.py
Deletes any existing DESIGN.docx before writing a fresh copy.
"""

import re
import os
import sys
from pathlib import Path
from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT     = Path(__file__).parent.parent
SRC      = ROOT / "DESIGN.md"
DEST     = ROOT / "DESIGN.docx"
LOGO_PNG = ROOT / "scripts" / "logo.png"

# ── Brand palette ─────────────────────────────────────────────────────────────
NAVY      = RGBColor(0x00, 0x09, 0x36)
GOLD      = RGBColor(0xFD, 0xC8, 0x00)
ORANGE    = RGBColor(0xE3, 0x4C, 0x00)
SKY       = RGBColor(0x56, 0xDB, 0xFF)
BLUE      = RGBColor(0x00, 0x66, 0xCB)
TAG_BLUE  = RGBColor(0x1D, 0xA4, 0xF3)
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
DARK_GRAY = RGBColor(0x1E, 0x29, 0x3B)
MID_GRAY  = RGBColor(0x47, 0x55, 0x69)
LIGHT_BG  = RGBColor(0xF1, 0xF5, 0xF9)
CODE_FG   = RGBColor(0x0F, 0x17, 0x2A)
RULE_CLR  = RGBColor(0xE2, 0xE8, 0xF0)


# ── XML helpers ───────────────────────────────────────────────────────────────
def set_cell_shd(cell, fill_hex: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd  = OxmlElement("w:shd")
    shd.set(qn("w:val"),   "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"),  fill_hex)
    tcPr.append(shd)


def set_cell_borders(cell, color="E2E8F0"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcB  = OxmlElement("w:tcBorders")
    for side in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"),   "single")
        el.set(qn("w:sz"),    "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        tcB.append(el)
    tcPr.append(tcB)


def set_table_borders(table, color="D1D5DB"):
    tbl    = table._tbl
    tblPr  = tbl.tblPr
    tblB   = OxmlElement("w:tblBorders")
    for side in ("top","left","bottom","right","insideH","insideV"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"),   "single")
        el.set(qn("w:sz"),    "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        tblB.append(el)
    tblPr.append(tblB)


def para_spacing(para, before=0, after=0, line=None):
    pPr = para._p.get_or_add_pPr()
    sp  = OxmlElement("w:spacing")
    sp.set(qn("w:before"), str(before))
    sp.set(qn("w:after"),  str(after))
    if line:
        sp.set(qn("w:line"),     str(line))
        sp.set(qn("w:lineRule"), "auto")
    pPr.append(sp)


def set_para_shd(para, fill_hex: str):
    pPr = para._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"),   "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"),  fill_hex)
    pPr.append(shd)


def add_header_footer(doc):
    """Add a branded header with logo + wordmark and a footer with page numbers."""
    section = doc.sections[0]

    # ── Running header ────────────────────────────────────────────────────────
    header = section.header
    header.is_linked_to_previous = False
    # Clear default
    for p in header.paragraphs:
        p.clear()

    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    para_spacing(hp, 0, 80)

    # Small inline logo
    if LOGO_PNG.exists():
        run_logo = hp.add_run()
        run_logo.add_picture(str(LOGO_PNG), width=Inches(0.32))

    # Wordmark text beside logo
    run_select = hp.add_run("  Select")
    run_select.font.name  = "Calibri"
    run_select.font.bold  = True
    run_select.font.size  = Pt(11)
    run_select.font.color.rgb = SKY

    run_ed = hp.add_run("Ed")
    run_ed.font.name  = "Calibri"
    run_ed.font.bold  = True
    run_ed.font.size  = Pt(11)
    run_ed.font.color.rgb = GOLD

    run_title = hp.add_run("  ·  Design & Architecture Document")
    run_title.font.name  = "Calibri"
    run_title.font.size  = Pt(9)
    run_title.font.color.rgb = MID_GRAY

    # Thin gold bottom border on header paragraph via pBdr
    pPr = hp._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"),   "single")
    bottom.set(qn("w:sz"),    "6")
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), "FDC800")
    pBdr.append(bottom)
    pPr.append(pBdr)

    # ── Footer with page number ───────────────────────────────────────────────
    footer = section.footer
    footer.is_linked_to_previous = False
    for p in footer.paragraphs:
        p.clear()

    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(fp, 60, 0)

    fp.add_run("SelectEd  ·  Confidential  ·  Page ").font.color.rgb = MID_GRAY
    fp.runs[-1].font.size = Pt(8)
    fp.runs[-1].font.name = "Calibri"

    # PAGE field
    fld = OxmlElement("w:fldChar")
    fld.set(qn("w:fldCharType"), "begin")
    fp._p.append(fld)
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fp._p.append(instr)
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "end")
    fp._p.append(fld2)

    r_of = fp.add_run("  of  ")
    r_of.font.color.rgb = MID_GRAY
    r_of.font.size = Pt(8)
    r_of.font.name = "Calibri"

    fld3 = OxmlElement("w:fldChar")
    fld3.set(qn("w:fldCharType"), "begin")
    fp._p.append(fld3)
    instr2 = OxmlElement("w:instrText")
    instr2.set(qn("xml:space"), "preserve")
    instr2.text = " NUMPAGES "
    fp._p.append(instr2)
    fld4 = OxmlElement("w:fldChar")
    fld4.set(qn("w:fldCharType"), "end")
    fp._p.append(fld4)

    # Top border on footer
    pPr2 = fp._p.get_or_add_pPr()
    pBdr2 = OxmlElement("w:pBdr")
    top = OxmlElement("w:top")
    top.set(qn("w:val"),   "single")
    top.set(qn("w:sz"),    "4")
    top.set(qn("w:space"), "4")
    top.set(qn("w:color"), "E2E8F0")
    pBdr2.append(top)
    pPr2.append(pBdr2)


# ── Inline markdown renderer ──────────────────────────────────────────────────
def render_inline(para, text: str, base_color=None, base_bold=False, base_size=None):
    pattern = re.compile(r"(\*\*.*?\*\*|\*.*?\*|`[^`]+`)")
    for part in pattern.split(text):
        if not part:
            continue
        run = para.add_run()
        if part.startswith("**") and part.endswith("**"):
            run.text = part[2:-2]
            run.bold = True
            if base_color:
                run.font.color.rgb = base_color
        elif part.startswith("*") and part.endswith("*") and not part.startswith("**"):
            run.text  = part[1:-1]
            run.italic = True
            if base_color:
                run.font.color.rgb = base_color
        elif part.startswith("`") and part.endswith("`"):
            run.text           = part[1:-1]
            run.font.name      = "Courier New"
            run.font.size      = Pt(9)
            run.font.color.rgb = CODE_FG
        else:
            run.text = part
            if base_color:
                run.font.color.rgb = base_color
            if base_bold:
                run.bold = True
            if base_size:
                run.font.size = Pt(base_size)


def parse_md_table(lines):
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


# ── Document builder ──────────────────────────────────────────────────────────
def build_doc(md_text: str) -> Document:
    doc = Document()

    # Page setup
    section = doc.sections[0]
    section.page_width    = Inches(8.5)
    section.page_height   = Inches(11)
    section.left_margin   = Inches(1.1)
    section.right_margin  = Inches(1.1)
    section.top_margin    = Inches(1.1)
    section.bottom_margin = Inches(0.9)

    # ── Base styles ───────────────────────────────────────────────────────────
    styles = doc.styles

    def ensure_style(name, base="Normal"):
        if name in [s.name for s in styles]:
            return styles[name]
        st = styles.add_style(name, 1)
        st.base_style = styles[base]
        return st

    normal = styles["Normal"]
    normal.font.name      = "Calibri"
    normal.font.size      = Pt(10.5)
    normal.font.color.rgb = DARK_GRAY

    h1 = styles["Heading 1"]
    h1.font.name      = "Calibri"
    h1.font.size      = Pt(20)
    h1.font.bold      = True
    h1.font.color.rgb = NAVY
    h1.paragraph_format.space_before = Pt(20)
    h1.paragraph_format.space_after  = Pt(6)

    h2 = styles["Heading 2"]
    h2.font.name      = "Calibri"
    h2.font.size      = Pt(14)
    h2.font.bold      = True
    h2.font.color.rgb = BLUE
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after  = Pt(4)

    h3 = styles["Heading 3"]
    h3.font.name      = "Calibri"
    h3.font.size      = Pt(11.5)
    h3.font.bold      = True
    h3.font.color.rgb = MID_GRAY
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after  = Pt(2)

    bullet_st = ensure_style("MD Bullet", "Normal")
    bullet_st.font.name = "Calibri"
    bullet_st.font.size = Pt(10.5)
    bullet_st.paragraph_format.left_indent  = Cm(0.8)
    bullet_st.paragraph_format.space_before = Pt(1)
    bullet_st.paragraph_format.space_after  = Pt(1)

    code_st = ensure_style("MD Code", "Normal")
    code_st.font.name      = "Courier New"
    code_st.font.size      = Pt(8.5)
    code_st.font.color.rgb = CODE_FG
    code_st.paragraph_format.left_indent  = Cm(0.6)
    code_st.paragraph_format.space_before = Pt(0)
    code_st.paragraph_format.space_after  = Pt(0)

    note_st = ensure_style("MD Note", "Normal")
    note_st.font.name      = "Calibri"
    note_st.font.size      = Pt(9.5)
    note_st.font.italic    = True
    note_st.font.color.rgb = MID_GRAY

    # ── Cover page ────────────────────────────────────────────────────────────
    # Logo centred
    if LOGO_PNG.exists():
        logo_para = doc.add_paragraph()
        logo_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        para_spacing(logo_para, 720, 120)
        logo_run = logo_para.add_run()
        logo_run.add_picture(str(LOGO_PNG), width=Inches(2.0))

    # "SelectEd" wordmark
    wm = doc.add_paragraph()
    wm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(wm, 0, 40)
    r_sel = wm.add_run("Select")
    r_sel.font.name      = "Calibri"
    r_sel.font.size      = Pt(42)
    r_sel.font.bold      = True
    r_sel.font.color.rgb = SKY
    r_ed = wm.add_run("Ed")
    r_ed.font.name      = "Calibri"
    r_ed.font.size      = Pt(42)
    r_ed.font.bold      = True
    r_ed.font.color.rgb = GOLD

    # Tagline
    tag = doc.add_paragraph()
    tag.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(tag, 0, 40)
    t1 = tag.add_run("Sharpen")
    t1.font.name = "Calibri"; t1.font.size = Pt(13); t1.font.bold = True; t1.font.color.rgb = GOLD
    t2 = tag.add_run("  ·  ")
    t2.font.name = "Calibri"; t2.font.size = Pt(13); t2.font.color.rgb = MID_GRAY
    t3 = tag.add_run("Sit")
    t3.font.name = "Calibri"; t3.font.size = Pt(13); t3.font.bold = True; t3.font.color.rgb = TAG_BLUE
    t4 = tag.add_run("  ·  ")
    t4.font.name = "Calibri"; t4.font.size = Pt(13); t4.font.color.rgb = MID_GRAY
    t5 = tag.add_run("Succeed.")
    t5.font.name = "Calibri"; t5.font.size = Pt(13); t5.font.bold = True; t5.font.color.rgb = ORANGE

    # Subtitle
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(sub, 20, 60)
    rs = sub.add_run("AI-powered exam preparation for Australian & international competitions")
    rs.font.name      = "Calibri"
    rs.font.size      = Pt(12)
    rs.font.italic    = True
    rs.font.color.rgb = MID_GRAY

    # Gold rule
    rule = doc.add_paragraph()
    rule.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(rule, 0, 40)
    rr = rule.add_run("━" * 38)
    rr.font.color.rgb = GOLD
    rr.font.size      = Pt(12)

    # Document subtitle
    dsub = doc.add_paragraph()
    dsub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(dsub, 0, 20)
    rd = dsub.add_run("Design & Architecture Document")
    rd.font.name      = "Calibri"
    rd.font.size      = Pt(16)
    rd.font.bold      = True
    rd.font.color.rgb = NAVY

    # Meta line
    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para_spacing(meta, 0, 720)
    rm = meta.add_run("Santrupta Mishra (San)  ·  Founder, SelectEd  ·  June 2026")
    rm.font.name      = "Calibri"
    rm.font.size      = Pt(10)
    rm.font.color.rgb = MID_GRAY

    doc.add_page_break()

    # ── Add running header/footer (must be after first page break) ─────────────
    add_header_footer(doc)

    # ── Parse and render markdown ─────────────────────────────────────────────
    lines    = md_text.splitlines()
    i        = 0
    in_code  = False
    code_buf: list[str] = []

    while i < len(lines):
        line = lines[i]

        # Code fence
        if line.strip().startswith("```"):
            if not in_code:
                in_code  = True
                code_buf = []
            else:
                in_code = False
                for cl in code_buf:
                    cp = doc.add_paragraph(style="MD Code")
                    para_spacing(cp, 0, 0)
                    cp.add_run(cl if cl else " ")
                    set_para_shd(cp, "F1F5F9")
                doc.add_paragraph()
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^[-_]{3,}$", line.strip()):
            hr = doc.add_paragraph()
            para_spacing(hr, 60, 60)
            hr.alignment = WD_ALIGN_PARAGRAPH.CENTER
            rr = hr.add_run("━" * 50)
            rr.font.color.rgb = GOLD
            rr.font.size      = Pt(9)
            i += 1
            continue

        # Headings
        m = re.match(r"^(#{1,3})\s+(.*)", line)
        if m:
            level = len(m.group(1))
            text  = m.group(2).strip()
            smap  = {1: "Heading 1", 2: "Heading 2", 3: "Heading 3"}
            para  = doc.add_paragraph(style=smap.get(level, "Heading 3"))
            # H1: add a left accent bar via paragraph border
            if level == 1:
                pPr = para._p.get_or_add_pPr()
                pBdr = OxmlElement("w:pBdr")
                left = OxmlElement("w:left")
                left.set(qn("w:val"),   "single")
                left.set(qn("w:sz"),    "24")
                left.set(qn("w:space"), "12")
                left.set(qn("w:color"), "FDC800")
                pBdr.append(left)
                pPr.append(pBdr)
            render_inline(para, text)
            i += 1
            continue

        # Markdown table
        if line.strip().startswith("|"):
            tbl_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                tbl_lines.append(lines[i])
                i += 1
            headers, rows = parse_md_table(tbl_lines)
            if not headers:
                continue
            ncols = len(headers)
            tbl   = doc.add_table(rows=1 + len(rows), cols=ncols)
            tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
            set_table_borders(tbl)

            # Header row — navy background, white text
            hdr_cells = tbl.rows[0].cells
            for ci, h in enumerate(headers):
                hdr_cells[ci].text = ""
                p = hdr_cells[ci].paragraphs[0]
                r = p.add_run(h)
                r.bold            = True
                r.font.color.rgb  = WHITE
                r.font.size       = Pt(9.5)
                r.font.name       = "Calibri"
                set_cell_shd(hdr_cells[ci], "000936")
                set_cell_borders(hdr_cells[ci], "000936")

            # Data rows — alternating light/white
            for ri, row in enumerate(rows):
                row_cells = tbl.rows[ri + 1].cells
                bg = "F8FAFC" if ri % 2 == 0 else "FFFFFF"
                for ci, cell_text in enumerate(row):
                    if ci >= ncols:
                        break
                    row_cells[ci].text = ""
                    p = row_cells[ci].paragraphs[0]
                    para_spacing(p, 30, 30)
                    render_inline(p, cell_text.strip(), base_color=DARK_GRAY, base_size=9)
                    set_cell_shd(row_cells[ci], bg)
                    set_cell_borders(row_cells[ci], "E2E8F0")

            doc.add_paragraph()
            continue

        # Bullet / numbered list
        m_bullet = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)", line)
        if m_bullet:
            indent  = len(m_bullet.group(1))
            is_num  = bool(re.match(r"\d+\.", m_bullet.group(2)))
            text    = m_bullet.group(3)
            bp = doc.add_paragraph(style="List Number" if is_num else "List Bullet")
            bp.paragraph_format.left_indent = Cm(0.8 + indent * 0.4)
            render_inline(bp, text, base_color=DARK_GRAY)
            i += 1
            continue

        # Italic note line
        stripped = line.strip()
        if stripped.startswith("*") and stripped.endswith("*") and not stripped.startswith("**"):
            np = doc.add_paragraph(style="MD Note")
            para_spacing(np, 4, 4)
            np.add_run(stripped.strip("*"))
            i += 1
            continue

        # Blank line
        if not stripped:
            i += 1
            continue

        # Normal paragraph
        pp = doc.add_paragraph(style="Normal")
        para_spacing(pp, 2, 4)
        render_inline(pp, stripped, base_color=DARK_GRAY)
        i += 1

    return doc


def main():
    if not SRC.exists():
        print(f"ERROR: {SRC} not found")
        sys.exit(1)

    if not LOGO_PNG.exists():
        print("WARNING: scripts/logo.png not found — run node scripts/svg_to_png.js first")

    if DEST.exists():
        DEST.unlink()
        print(f"Removed old {DEST.name}")

    md_text = SRC.read_text(encoding="utf-8")
    doc     = build_doc(md_text)
    doc.save(str(DEST))
    size_kb = DEST.stat().st_size // 1024
    print(f"Saved {DEST.name}  ({size_kb} KB)")


if __name__ == "__main__":
    main()
