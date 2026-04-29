from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "consent-form-mocks"


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="TitleMain",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=19,
        leading=23,
        alignment=TA_CENTER,
        spaceAfter=8,
        textColor=colors.HexColor("#19324a"),
    )
)
styles.add(
    ParagraphStyle(
        name="Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#4c5f6b"),
        spaceAfter=12,
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#19324a"),
        spaceBefore=13,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyTight",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        alignment=TA_LEFT,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="Small",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="Box",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#2d3338"),
    )
)
styles.add(
    ParagraphStyle(
        name="Field",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#19324a"),
    )
)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#6b7780"))
    canvas.drawString(0.72 * inch, 0.45 * inch, "Mock demo consent form - fictional sample for TrueConsent testing only")
    canvas.drawRightString(7.78 * inch, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def make_doc(path: Path):
    doc = BaseDocTemplate(
        str(path),
        pagesize=LETTER,
        leftMargin=0.72 * inch,
        rightMargin=0.72 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.7 * inch,
        title=path.stem,
        author="TrueConsent mock generator",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="normal", frames=[frame], onPage=footer)])
    return doc


def p(text, style="BodyTight"):
    return Paragraph(text, styles[style])


def section(title: str):
    return [p(title, "Section"), HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#b7c6d1")), Spacer(1, 4)]


def note_box(title: str, body: str):
    table = Table(
        [[p(f"<b>{title}</b><br/>{body}", "Box")]],
        colWidths=[6.95 * inch],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eef4f7")),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#8ba4b5")),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        ),
    )
    return [table, Spacer(1, 7)]


def field_table(rows):
    table = Table(rows, colWidths=[1.28 * inch, 2.22 * inch, 1.18 * inch, 2.27 * inch])
    table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#b7c6d1")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fbfcfd")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def checklist(items):
    rows = [[p("Box", "Field"), p("Consent item", "Field"), p("Initials", "Field")]]
    rows.extend([[p("[  ]", "BodyTight"), p(item, "Small"), p("_____", "BodyTight")] for item in items])
    table = Table(rows, colWidths=[0.45 * inch, 5.65 * inch, 0.85 * inch], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dbe8ef")),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#b7c6d1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def signature_block():
    rows = [
        ["Patient/Legal Representative Signature", "Date", "Time"],
        ["", "", ""],
        ["Printed Name", "Relationship to Patient", "Witness Initials"],
        ["", "", ""],
        ["Clinician Signature", "Date", "Interpreter ID, if used"],
        ["", "", ""],
    ]
    table = Table(rows, colWidths=[3.1 * inch, 1.6 * inch, 2.25 * inch], rowHeights=[0.22 * inch, 0.42 * inch] * 3)
    table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#9fb3c1")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef4f7")),
                ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#eef4f7")),
                ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#eef4f7")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def build(title, subtitle, filename, patient_fields, sections, check_items):
    story = [
        p(title, "TitleMain"),
        p(subtitle, "Subtitle"),
        field_table(patient_fields),
        Spacer(1, 9),
    ]
    story += note_box(
        "Demo notice",
        "This fictional document is for product demonstration and OCR testing. It should not be used as a real medical, dental, surgical, legal, or billing document.",
    )
    for heading, paragraphs in sections:
        story += section(heading)
        for para in paragraphs:
            if isinstance(para, list):
                story.extend(para)
            else:
                story.append(p(para))
    story += section("Patient Acknowledgements")
    story.append(checklist(check_items))
    story.append(Spacer(1, 10))
    story += section("Signatures")
    story.append(signature_block())
    make_doc(OUT / filename).build(story)


common_patient = [
    [p("Patient name", "Field"), p("____________________________"), p("DOB", "Field"), p("____ / ____ / ______")],
    [p("Record number", "Field"), p("____________________________"), p("Date of form", "Field"), p("____ / ____ / ______")],
    [p("Clinic/Facility", "Field"), p("____________________________"), p("Primary clinician", "Field"), p("____________________________")],
]


orthodontic_sections = [
    ("Nature of Orthodontic Treatment", [
        "I authorize the orthodontic team to evaluate, diagnose, and provide orthodontic treatment using braces, clear aligners, retainers, expanders, attachments, elastics, bite ramps, temporary anchorage devices when separately discussed, digital scans, photographs, radiographs, and related appliances.",
        "The proposed treatment may include movement of teeth, jaw growth guidance, bite correction, space closure, tooth rotation, correction of crowding or spacing, retention planning, and periodic adjustments. Treatment length is an estimate and may change based on growth, cooperation, missed appointments, appliance breakage, oral hygiene, or biological response.",
        "I understand that orthodontic treatment is elective unless otherwise stated by the clinician. I may ask questions, request clarification, decline treatment, or seek another opinion before signing.",
    ]),
    ("Expected Benefits", [
        "Potential benefits may include improved tooth alignment, bite function, dental hygiene access, jaw relationship, speech or chewing comfort, smile appearance, and long-term stability when retainers are worn as instructed.",
        "No specific cosmetic or functional result is guaranteed. Teeth and jaws may respond differently than predicted, and additional treatment may be recommended if the result is incomplete or relapse occurs.",
    ]),
    ("Material Risks and Possible Complications", [
        "Risks may include soreness, gum irritation, ulcers, loose brackets, tooth sensitivity, decalcification or white spots, cavities, gum inflammation, root shortening, relapse, jaw joint discomfort, bite changes, allergic reaction to materials, accidental swallowing or aspiration of appliance parts, and the need for additional dental work.",
        "Excellent brushing, flossing, dietary cooperation, and appointment attendance are important. Poor oral hygiene during treatment can lead to permanent marks, cavities, gum disease, or delayed completion.",
        "Root resorption can occur during tooth movement. In rare cases, significant shortening may affect the long-term health of a tooth. The orthodontist may recommend additional radiographs, treatment pauses, or modification of the plan.",
    ]),
    ("Alternatives", [
        "Alternatives may include no orthodontic treatment, limited orthodontic treatment, removable appliances, restorative dental options, extraction or non-extraction plans, jaw surgery referral, or delaying treatment until growth or dental development changes.",
        "The risks of no treatment may include continued crowding, bite problems, tooth wear, hygiene difficulty, esthetic concerns, or progression of an existing condition.",
    ]),
    ("Patient Responsibilities", [
        "I agree to follow instructions for appliance wear, elastics, aligner timing, retainer use, oral hygiene, food restrictions, and appointment schedules. I understand that broken appliances, missed visits, or failure to wear aligners or retainers can extend treatment or compromise the result.",
        "I will inform the office about changes in medical history, pregnancy, medications, allergies, jaw pain, dental trauma, loose teeth, or new dental work during treatment.",
    ]),
    ("Financial, Privacy, and Records", [
        "I understand that fees, insurance estimates, payment plans, missed appointment charges, replacement appliance fees, and records fees may be addressed in separate financial documents. Insurance benefits are not guaranteed and remain the patient's responsibility if denied or reduced.",
        "Clinical photographs, scans, models, and radiographs may be used for diagnosis, treatment planning, referrals, insurance, quality review, and education when appropriately de-identified or separately authorized.",
    ]),
]


surgery_sections = [
    ("Procedure Authorized", [
        "I authorize the surgical team to perform the procedure identified by my clinician: ________________________________________________. The procedure may include incision, removal, repair, reconstruction, biopsy, implantation, drainage, cautery, suturing, imaging guidance, pathology submission, and other steps reasonably necessary to complete the planned operation.",
        "I understand that unexpected findings may occur. If an unplanned condition is discovered and delaying care would place me at risk, I authorize the surgeon to perform additional or different procedures judged medically necessary at that time, unless I have written specific limitations below.",
        "Specific limitations or procedures I do not consent to: ________________________________________________________________.",
    ]),
    ("Anesthesia and Sedation", [
        "I understand that anesthesia may include local anesthesia, regional block, monitored anesthesia care, moderate sedation, deep sedation, or general anesthesia, depending on the procedure and anesthesiology assessment.",
        "Risks may include nausea, vomiting, sore throat, dental injury, allergic reaction, aspiration, medication side effects, breathing problems, heart rhythm changes, awareness under anesthesia, nerve injury, stroke, heart attack, or death. Anesthesia risks may be higher with certain medical conditions.",
    ]),
    ("Major Risks and Complications", [
        "Possible risks include bleeding, infection, pain, bruising, scarring, poor wound healing, blood clots, damage to nearby organs, vessels, nerves, or tissues, numbness, weakness, recurrence, retained foreign body, implant failure, need for transfusion, need for additional surgery, disability, loss of function, or death.",
        "Results cannot be guaranteed. A successful procedure may not relieve all symptoms, and additional diagnostic tests, medications, rehabilitation, or procedures may be required.",
        "I understand that all medical and surgical treatment has uncertainty. I have been encouraged to discuss my personal risk factors, including age, pregnancy status, diabetes, smoking, medications, blood thinners, implanted devices, allergies, and prior anesthesia problems.",
    ]),
    ("Blood Products, Tissue, and Specimens", [
        "If clinically necessary, blood products may be recommended. Risks include fever, allergic reaction, transfusion reaction, infection transmission, and fluid overload. Alternatives may include refusing transfusion, blood conservation methods, or autologous options when available.",
        "Tissue, implants, fluids, or specimens removed during the procedure may be sent to pathology, discarded, stored, photographed, tested, or used for quality control and education as allowed by policy and law.",
    ]),
    ("Alternatives and No Treatment", [
        "Alternatives may include observation, medication, therapy, lifestyle changes, injections, less invasive procedures, a different operation, referral to another specialist, or no treatment.",
        "The risks of refusing or delaying the procedure may include worsening symptoms, disease progression, pain, disability, infection, organ damage, emergency surgery, or other complications depending on the condition.",
    ]),
    ("Postoperative Care", [
        "I agree to follow discharge instructions, activity restrictions, wound care, medication directions, follow-up appointments, and return precautions. I understand that driving, operating machinery, signing important documents, drinking alcohol, or making major decisions may be unsafe after sedation or anesthesia.",
        "I will seek urgent care if I experience severe pain, heavy bleeding, fever, shortness of breath, chest pain, new weakness, confusion, signs of infection, or other concerning symptoms described by my care team.",
    ]),
]


general_sections = [
    ("General Consent for Evaluation and Treatment", [
        "I consent to evaluation, examination, diagnostic testing, routine treatment, nursing care, medication administration, telehealth services when offered, imaging, laboratory services, referrals, and other services ordered by authorized healthcare professionals at this facility.",
        "Treatment may be provided by physicians, advanced practice clinicians, nurses, technicians, students, residents, trainees, contractors, and other personnel under appropriate supervision.",
        "I understand that healthcare involves professional judgment and that outcomes are not guaranteed. I may ask questions and may refuse or withdraw consent for non-emergency care, although refusal may affect my health or treatment options.",
    ]),
    ("Information Sharing and Privacy", [
        "I authorize the facility to use and disclose health information for treatment, payment, healthcare operations, care coordination, referrals, quality review, required reporting, and other purposes described in the Notice of Privacy Practices.",
        "Information may be shared with pharmacies, laboratories, imaging centers, insurers, billing vendors, other treating providers, public health agencies, and legally authorized representatives. Some disclosures may occur electronically.",
        "I understand that certain sensitive services, such as behavioral health, reproductive health, substance use treatment, genetic testing, or communicable disease information, may have additional privacy protections under applicable law.",
    ]),
    ("Financial Responsibility", [
        "I understand that I am responsible for charges not paid by insurance, including deductibles, co-payments, co-insurance, non-covered services, out-of-network services, missed appointment fees when applicable, supplies, forms, records, and balances denied by my plan.",
        "Insurance verification is not a guarantee of payment. I authorize release of information needed to process claims and assign insurance benefits payable for covered services to the facility or treating provider.",
    ]),
    ("Medications, Tests, and Referrals", [
        "I consent to medications, vaccines, injections, laboratory tests, imaging, screenings, and referrals ordered as part of my care. Risks may include side effects, allergic reactions, false positives, false negatives, incidental findings, or need for follow-up testing.",
        "I agree to provide accurate information about medications, supplements, allergies, pregnancy status, medical history, and prior reactions. I understand that incomplete information can increase clinical risk.",
    ]),
    ("Communication Preferences", [
        "The facility may contact me by phone, voicemail, text message, email, patient portal, mail, or automated reminder system for scheduling, results, billing, care coordination, surveys, and health-related notices. Message and data rates may apply for text communications.",
        "I may request restrictions or alternate communication methods, but the facility may not be able to honor every request if it interferes with treatment, payment, operations, or legal obligations.",
    ]),
    ("Patient Rights and Responsibilities", [
        "I have the right to receive information in a way I can understand, ask questions, request an interpreter, participate in care decisions, review applicable privacy notices, and file a complaint without retaliation.",
        "I agree to treat staff respectfully, provide accurate information, follow agreed care plans, keep appointments or cancel in advance, and ask for clarification if I do not understand instructions.",
    ]),
]


build(
    "Orthodontic Treatment Consent Form",
    "Fictional comprehensive sample for TrueConsent upload and explanation demos",
    "orthodontics-consent-form.pdf",
    common_patient,
    orthodontic_sections,
    [
        "I understand the proposed orthodontic treatment, expected benefits, and no-guarantee language.",
        "I understand risks including cavities, gum inflammation, root shortening, relapse, and appliance-related injury.",
        "I agree to follow appliance, aligner, elastic, hygiene, diet, appointment, and retainer instructions.",
        "I understand alternatives, including no treatment, limited treatment, and other dental or surgical options.",
        "I understand separate financial, insurance, privacy, records, and replacement appliance policies may apply.",
    ],
)

build(
    "Surgical Procedure Consent Form",
    "Fictional comprehensive sample for TrueConsent upload and explanation demos",
    "surgery-consent-form.pdf",
    common_patient,
    surgery_sections,
    [
        "I understand the planned procedure and authorize reasonably necessary additional steps in urgent unexpected circumstances.",
        "I understand anesthesia or sedation risks and have disclosed allergies, medications, prior reactions, and medical conditions.",
        "I understand serious risks including bleeding, infection, organ or nerve injury, transfusion, additional surgery, disability, or death.",
        "I understand alternatives, including no treatment, and the possible risks of refusal or delay.",
        "I agree to follow postoperative instructions and seek urgent care for warning symptoms.",
    ],
)

build(
    "General Medical Consent Form",
    "Fictional comprehensive sample for TrueConsent upload and explanation demos",
    "general-medical-consent-form.pdf",
    common_patient,
    general_sections,
    [
        "I consent to general evaluation, testing, treatment, medication administration, referrals, and routine healthcare services.",
        "I understand health information may be used and disclosed for treatment, payment, operations, and required reporting.",
        "I understand financial responsibility for amounts not paid by insurance and authorize claim-related information release.",
        "I understand communication may occur by phone, portal, mail, text, email, or automated reminder systems.",
        "I know I may ask questions, request an interpreter, refuse non-emergency care, or seek more information before signing.",
    ],
)

print(f"Generated PDFs in {OUT}")
