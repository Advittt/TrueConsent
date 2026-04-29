"""Generate UnitedHealthcare EOB mock — out-of-network ER + timely filing denial.

Run:
    uv run --with reportlab python tools/generate_mock_eob_uhc.py
Output: eob-mocks/uhc-eob-sample.pdf
"""

from __future__ import annotations
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

OUT = Path(__file__).resolve().parent.parent / "eob-mocks" / "uhc-eob-sample.pdf"
OUT.parent.mkdir(exist_ok=True)

UHC_GOLD = colors.HexColor("#FFB500")
UHC_DARK = colors.HexColor("#002677")

styles = getSampleStyleSheet()
H1   = ParagraphStyle("H1",   parent=styles["Heading1"],  fontSize=18, textColor=UHC_DARK,  spaceAfter=4)
H2   = ParagraphStyle("H2",   parent=styles["Heading2"],  fontSize=11, textColor=UHC_DARK,  spaceBefore=12, spaceAfter=4)
Body = ParagraphStyle("Body", parent=styles["BodyText"],  fontSize=9,  leading=12)
Small= ParagraphStyle("Small",parent=styles["BodyText"],  fontSize=8,  textColor=colors.grey, leading=10)

doc = SimpleDocTemplate(str(OUT), pagesize=LETTER,
    leftMargin=0.5*inch, rightMargin=0.5*inch,
    topMargin=0.5*inch, bottomMargin=0.5*inch)

story = []

story.append(Paragraph("UnitedHealthcare", H1))
story.append(Paragraph("Explanation of Benefits — This is NOT a bill", Small))
story.append(Spacer(1, 8))
story.append(HRFlowable(width="100%", thickness=2, color=UHC_GOLD))

story.append(Spacer(1, 10))
member = Table([
    ["Member Name",    "Priya K. Nair",          "Member ID",    "UHC-5571039"],
    ["Plan",           "UHC Choice Plus EPO",    "Group Number", "GRP-88342"],
    ["Statement Date", "March 18, 2026",          "Claim Number", "29104"],
], colWidths=[1.0*inch, 2.4*inch, 1.0*inch, 2.4*inch])
member.setStyle(TableStyle([
    ("FONT",         (0,0), (-1,-1), "Helvetica",      9),
    ("FONT",         (0,0), ( 0,-1), "Helvetica-Bold", 9),
    ("FONT",         (2,0), ( 2,-1), "Helvetica-Bold", 9),
    ("TEXTCOLOR",    (0,0), ( 0,-1), UHC_DARK),
    ("TEXTCOLOR",    (2,0), ( 2,-1), UHC_DARK),
    ("BOTTOMPADDING",(0,0), (-1,-1), 4),
]))
story.append(member)

story.append(Paragraph("PROVIDER &amp; SERVICE", H2))
prov = Table([
    ["Provider",    "Riverside Medical Center (OUT-OF-NETWORK)"],
    ["Service Date","January 3, 2026"],
    ["Diagnosis",   "S52.501A — Unspecified fracture of lower end of radius, initial encounter"],
], colWidths=[1.4*inch, 5.4*inch])
prov.setStyle(TableStyle([
    ("FONT",         (0,0), (-1,-1), "Helvetica",      9),
    ("FONT",         (0,0), ( 0,-1), "Helvetica-Bold", 9),
    ("TEXTCOLOR",    (0,0), ( 0,-1), UHC_DARK),
    ("BOTTOMPADDING",(0,0), (-1,-1), 3),
]))
story.append(prov)

story.append(Paragraph("SERVICES PROCESSED", H2))
header_row = ["Service", "Code", "Billed", "Plan Paid", "You Owe", "Adj. Code"]
data = [
    header_row,
    ["ER visit, moderate complexity", "CPT 99284", "$1,240.00", "$620.00", "$310.00", "CO-100"],
    ["Radiology, wrist 3 views",      "CPT 73100", "$390.00",   "$195.00", "$97.50",  "CO-100"],
    ["Closed reduction, radius fx",   "CPT 25600", "$2,100.00", "$0.00",   "$0.00",   "CO-29"],
    ["Short arm fiberglass cast",     "HCPCS A4570","$185.00",  "$92.50",  "$46.25",  "CO-100"],
    ["TOTALS",                        "",          "$3,915.00", "$907.50", "$453.75", ""],
]
tbl = Table(data, colWidths=[1.7*inch, 0.95*inch, 0.85*inch, 0.85*inch, 0.85*inch, 1.2*inch])
tbl.setStyle(TableStyle([
    ("FONT",         (0,0), (-1,-1), "Helvetica",      9),
    ("FONT",         (0,0), (-1, 0), "Helvetica-Bold", 9),
    ("FONT",         (0,-1),(-1,-1), "Helvetica-Bold", 9),
    ("BACKGROUND",   (0,0), (-1, 0), UHC_DARK),
    ("TEXTCOLOR",    (0,0), (-1, 0), colors.white),
    ("BACKGROUND",   (0,-1),(-1,-1), colors.HexColor("#E8EBF5")),
    ("ALIGN",        (2,0), ( 4,-1), "RIGHT"),
    ("LINEBELOW",    (0,0), (-1, 0), 0.5, UHC_DARK),
    ("LINEABOVE",    (0,-1),(-1,-1), 0.5, UHC_DARK),
    ("BOTTOMPADDING",(0,0), (-1,-1), 6),
    ("TOPPADDING",   (0,0), (-1,-1), 6),
    ("ROWBACKGROUNDS",(0,1),(-1,-2), [colors.white, colors.HexColor("#F4F6FB")]),
    ("TEXTCOLOR",    (5,3), (5,3),  colors.HexColor("#B00020")),
]))
story.append(tbl)

story.append(Paragraph("ADJUSTMENT CODES", H2))
glossary = [
    ["CO-100", "Payment adjusted because the benefit for this service/claim is denied when performed/billed by this out-of-network provider. Emergency services are covered at 60% of allowed amount."],
    ["CO-29",  "The time limit for filing has expired. Claim for CPT 25600 was received 74 days after the filing deadline of 90 days from date of service."],
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
    "You have the right to appeal this decision within 180 days. "
    "For the CO-29 (timely filing) denial of CPT 25600, you may appeal if you can provide "
    "documentation showing the claim was submitted within the required timeframe or that a "
    "delay was caused by circumstances beyond your control. "
    "For out-of-network cost-sharing disputes, you may be eligible for Independent Dispute "
    "Resolution under the No Surprises Act (Pub. L. 116-260) if the provider is subject to "
    "federal surprise billing protections. Call UHC Member Services at 1-866-892-2552.",
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
