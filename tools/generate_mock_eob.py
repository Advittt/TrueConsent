"""Generate a realistic-looking EOB PDF that matches our decoder's expectations.

Run:
    uv run --with reportlab python tools/generate_mock_eob.py
Output: eob-mocks/bluecross-eob-sample.pdf
"""

from __future__ import annotations
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

OUT = Path(__file__).resolve().parent.parent / "eob-mocks" / "bluecross-eob-sample.pdf"
OUT.parent.mkdir(exist_ok=True)

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=18, textColor=colors.HexColor("#003B71"), spaceAfter=4)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=11, textColor=colors.HexColor("#003B71"), spaceBefore=12, spaceAfter=4)
Body = ParagraphStyle("Body", parent=styles["BodyText"], fontSize=9, leading=12)
Small = ParagraphStyle("Small", parent=styles["BodyText"], fontSize=8, textColor=colors.grey, leading=10)
Bold = ParagraphStyle("Bold", parent=Body, fontName="Helvetica-Bold")

doc = SimpleDocTemplate(str(OUT), pagesize=LETTER,
    leftMargin=0.5*inch, rightMargin=0.5*inch,
    topMargin=0.5*inch, bottomMargin=0.5*inch)

story = []

# Header
story.append(Paragraph("BlueCross BlueShield of Illinois", H1))
story.append(Paragraph("Explanation of Benefits — This is NOT a bill", Small))
story.append(Spacer(1, 8))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#003B71")))

# Member info
story.append(Spacer(1, 10))
member = Table([
    ["Member Name", "Jane Q. Smith", "Member ID", "BCB-2204819334"],
    ["Plan", "PPO Gold 1500", "Group Number", "GRP-44218"],
    ["Statement Date", "June 28, 2026", "Claim Number", "48291"],
], colWidths=[1.0*inch, 2.4*inch, 1.0*inch, 2.4*inch])
member.setStyle(TableStyle([
    ("FONT", (0,0), (-1,-1), "Helvetica", 9),
    ("FONT", (0,0), (0,-1), "Helvetica-Bold", 9),
    ("FONT", (2,0), (2,-1), "Helvetica-Bold", 9),
    ("TEXTCOLOR", (0,0), (0,-1), colors.HexColor("#003B71")),
    ("TEXTCOLOR", (2,0), (2,-1), colors.HexColor("#003B71")),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
]))
story.append(member)

# Provider
story.append(Paragraph("PROVIDER &amp; SERVICE", H2))
prov = Table([
    ["Provider", "Memorial Hospital Emergency Department"],
    ["Service Date", "June 14, 2026"],
    ["Admitting Diagnosis", "J18.9 — Pneumonia, unspecified organism"],
], colWidths=[1.4*inch, 5.4*inch])
prov.setStyle(TableStyle([
    ("FONT", (0,0), (-1,-1), "Helvetica", 9),
    ("FONT", (0,0), (0,-1), "Helvetica-Bold", 9),
    ("TEXTCOLOR", (0,0), (0,-1), colors.HexColor("#003B71")),
    ("BOTTOMPADDING", (0,0), (-1,-1), 3),
]))
story.append(prov)

# Service lines table
story.append(Paragraph("SERVICES PROCESSED", H2))
header_row = ["Service", "Code", "Billed", "Plan Paid", "You Owe", "Adj. Code"]
data = [
    header_row,
    ["ER visit, high complexity", "CPT 99285", "$1,847.00", "$0.00", "$0.00", "CO-50 / N130"],
    ["Chest X-ray, 2 views", "CPT 71046", "$612.00", "$489.00", "$76.00", "PR-1"],
    ["Routine venipuncture", "CPT 36415", "$45.00", "$36.00", "$9.00", "PR-1"],
    ["Ceftriaxone injection", "HCPCS J0696", "$280.00", "$0.00", "$0.00", "CO-4 / MA130"],
    ["TOTALS", "", "$2,784.00", "$525.00", "$85.00", ""],
]
tbl = Table(data, colWidths=[1.7*inch, 0.95*inch, 0.85*inch, 0.85*inch, 0.85*inch, 1.2*inch])
tbl.setStyle(TableStyle([
    ("FONT", (0,0), (-1,-1), "Helvetica", 9),
    ("FONT", (0,0), (-1,0), "Helvetica-Bold", 9),
    ("FONT", (0,-1), (-1,-1), "Helvetica-Bold", 9),
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#003B71")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("BACKGROUND", (0,-1), (-1,-1), colors.HexColor("#EAEEF5")),
    ("ALIGN", (2,0), (4,-1), "RIGHT"),
    ("LINEBELOW", (0,0), (-1,0), 0.5, colors.HexColor("#003B71")),
    ("LINEABOVE", (0,-1), (-1,-1), 0.5, colors.HexColor("#003B71")),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS", (0,1), (-1,-2), [colors.white, colors.HexColor("#F7F8FA")]),
    # red text on denied lines
    ("TEXTCOLOR", (5,1), (5,1), colors.HexColor("#B00020")),
    ("TEXTCOLOR", (5,4), (5,4), colors.HexColor("#B00020")),
]))
story.append(tbl)

# Adjustment code glossary
story.append(Paragraph("ADJUSTMENT CODES", H2))
glossary = [
    ["CO-50", "Non-covered services because this is not deemed a 'medical necessity' by the payer."],
    ["CO-4",  "The procedure code is inconsistent with the modifier used or a required modifier is missing."],
    ["PR-1",  "Deductible amount."],
    ["N130",  "Consult plan benefit documents/guidelines for information about restrictions for this service."],
    ["MA130", "Your claim contains incomplete and/or invalid information."],
]
gtbl = Table(glossary, colWidths=[0.7*inch, 6.1*inch])
gtbl.setStyle(TableStyle([
    ("FONT", (0,0), (-1,-1), "Helvetica", 8),
    ("FONT", (0,0), (0,-1), "Helvetica-Bold", 8),
    ("TEXTCOLOR", (0,0), (0,-1), colors.HexColor("#B00020")),
    ("BOTTOMPADDING", (0,0), (-1,-1), 3),
    ("TOPPADDING", (0,0), (-1,-1), 3),
]))
story.append(gtbl)

# Appeal rights
story.append(Paragraph("YOUR APPEAL RIGHTS", H2))
story.append(Paragraph(
    "If you disagree with this decision, you have the right to file an internal appeal "
    "within 180 days of the denial date. You also have the right to request the name, "
    "license number, and specialty of the physician who reviewed and denied any service "
    "marked 'not medically necessary'. Send written appeals to: BlueCross BlueShield of "
    "Illinois, Appeals Department, PO Box 805107, Chicago, IL 60680. "
    "Appeals phone: 1-800-676-2583.",
    Body
))

story.append(Spacer(1, 12))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
story.append(Paragraph(
    "This sample EOB contains synthetic data and is for demonstration purposes only. "
    "No real patient information is represented.",
    Small
))

doc.build(story)
print(f"Wrote {OUT}")
