"""Generate Aetna EOB mock — mental health prior-auth denial + partial approval.

Run:
    uv run --with reportlab python tools/generate_mock_eob_aetna.py
Output: eob-mocks/aetna-eob-sample.pdf
"""

from __future__ import annotations
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

OUT = Path(__file__).resolve().parent.parent / "eob-mocks" / "aetna-eob-sample.pdf"
OUT.parent.mkdir(exist_ok=True)

AETNA_BLUE = colors.HexColor("#C8102E")
AETNA_DARK = colors.HexColor("#231F20")

styles = getSampleStyleSheet()
H1   = ParagraphStyle("H1",   parent=styles["Heading1"],  fontSize=18, textColor=AETNA_BLUE, spaceAfter=4)
H2   = ParagraphStyle("H2",   parent=styles["Heading2"],  fontSize=11, textColor=AETNA_DARK, spaceBefore=12, spaceAfter=4)
Body = ParagraphStyle("Body", parent=styles["BodyText"],  fontSize=9,  leading=12)
Small= ParagraphStyle("Small",parent=styles["BodyText"],  fontSize=8,  textColor=colors.grey, leading=10)

doc = SimpleDocTemplate(str(OUT), pagesize=LETTER,
    leftMargin=0.5*inch, rightMargin=0.5*inch,
    topMargin=0.5*inch, bottomMargin=0.5*inch)

story = []

story.append(Paragraph("Aetna", H1))
story.append(Paragraph("Explanation of Benefits — This is NOT a bill", Small))
story.append(Spacer(1, 8))
story.append(HRFlowable(width="100%", thickness=1, color=AETNA_BLUE))

story.append(Spacer(1, 10))
member = Table([
    ["Member Name", "Marcus A. Rivera",    "Member ID",    "AET-8834021"],
    ["Plan",        "Aetna Choice POS II", "Group Number", "GRP-22915"],
    ["Statement Date", "May 12, 2026",     "Claim Number", "73910"],
], colWidths=[1.0*inch, 2.4*inch, 1.0*inch, 2.4*inch])
member.setStyle(TableStyle([
    ("FONT",         (0,0), (-1,-1), "Helvetica",      9),
    ("FONT",         (0,0), ( 0,-1), "Helvetica-Bold", 9),
    ("FONT",         (2,0), ( 2,-1), "Helvetica-Bold", 9),
    ("TEXTCOLOR",    (0,0), ( 0,-1), AETNA_BLUE),
    ("TEXTCOLOR",    (2,0), ( 2,-1), AETNA_BLUE),
    ("BOTTOMPADDING",(0,0), (-1,-1), 4),
]))
story.append(member)

story.append(Paragraph("PROVIDER &amp; SERVICE", H2))
prov = Table([
    ["Provider",    "Sunrise Behavioral Health, LLC"],
    ["Service Dates","April 2 – April 30, 2026"],
    ["Diagnosis",   "F33.1 — Major depressive disorder, recurrent, moderate"],
], colWidths=[1.4*inch, 5.4*inch])
prov.setStyle(TableStyle([
    ("FONT",         (0,0), (-1,-1), "Helvetica",      9),
    ("FONT",         (0,0), ( 0,-1), "Helvetica-Bold", 9),
    ("TEXTCOLOR",    (0,0), ( 0,-1), AETNA_BLUE),
    ("BOTTOMPADDING",(0,0), (-1,-1), 3),
]))
story.append(prov)

story.append(Paragraph("SERVICES PROCESSED", H2))
header_row = ["Service", "Code", "Billed", "Plan Paid", "You Owe", "Adj. Code"]
data = [
    header_row,
    ["Psych eval, 60 min",       "CPT 90792", "$350.00", "$280.00", "$70.00",   "PR-1"],
    ["Individual therapy, 45 min","CPT 90834", "$175.00", "$140.00", "$35.00",  "PR-1"],
    ["Individual therapy, 45 min","CPT 90834", "$175.00", "$140.00", "$35.00",  "PR-1"],
    ["Individual therapy, 45 min","CPT 90834", "$175.00", "$0.00",   "$0.00",   "CO-97 / N372"],
    ["Individual therapy, 45 min","CPT 90834", "$175.00", "$0.00",   "$0.00",   "CO-97 / N372"],
    ["TOTALS",                   "",          "$1,050.00","$560.00", "$140.00", ""],
]
tbl = Table(data, colWidths=[1.7*inch, 0.95*inch, 0.85*inch, 0.85*inch, 0.85*inch, 1.2*inch])
tbl.setStyle(TableStyle([
    ("FONT",         (0,0), (-1,-1), "Helvetica",      9),
    ("FONT",         (0,0), (-1, 0), "Helvetica-Bold", 9),
    ("FONT",         (0,-1),(-1,-1), "Helvetica-Bold", 9),
    ("BACKGROUND",   (0,0), (-1, 0), AETNA_BLUE),
    ("TEXTCOLOR",    (0,0), (-1, 0), colors.white),
    ("BACKGROUND",   (0,-1),(-1,-1), colors.HexColor("#F5E6E8")),
    ("ALIGN",        (2,0), ( 4,-1), "RIGHT"),
    ("LINEBELOW",    (0,0), (-1, 0), 0.5, AETNA_BLUE),
    ("LINEABOVE",    (0,-1),(-1,-1), 0.5, AETNA_BLUE),
    ("BOTTOMPADDING",(0,0), (-1,-1), 6),
    ("TOPPADDING",   (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS",(0,1),(-1,-2), [colors.white, colors.HexColor("#FDF8F8")]),
    ("TEXTCOLOR",    (5,4), (5,4),  colors.HexColor("#B00020")),
    ("TEXTCOLOR",    (5,5), (5,5),  colors.HexColor("#B00020")),
]))
story.append(tbl)

story.append(Paragraph("ADJUSTMENT CODES", H2))
glossary = [
    ["CO-97",  "Payment adjusted because the benefit for this service is included in the payment/allowance for another service already adjudicated (prior authorization required)."],
    ["PR-1",   "Deductible amount — patient responsibility."],
    ["N372",   "Services beyond the authorized number of visits require a new prior authorization request before rendering."],
]
gtbl = Table(glossary, colWidths=[0.7*inch, 6.1*inch])
gtbl.setStyle(TableStyle([
    ("FONT",         (0,0), (-1,-1), "Helvetica",      8),
    ("FONT",         (0,0), ( 0,-1), "Helvetica-Bold", 8),
    ("TEXTCOLOR",    (0,0), ( 0,-1), colors.HexColor("#B00020")),
    ("BOTTOMPADDING",(0,0), (-1,-1), 3),
    ("TOPPADDING",   (0,0), (-1,-1), 3),
]))
story.append(gtbl)

story.append(Paragraph("YOUR APPEAL RIGHTS", H2))
story.append(Paragraph(
    "You have the right to appeal this decision within 180 days of the date of this notice. "
    "Sessions marked CO-97 were denied because the original prior authorization (PA-2026-0331) "
    "covered only 3 visits. To request continued care, submit a new prior authorization through "
    "your provider's office or call Aetna Behavioral Health at 1-800-424-4047. "
    "You also have the right to request a copy of the clinical criteria used to make this decision.",
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
