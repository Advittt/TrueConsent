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
        name="SubformTitle",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor("#19324a"),
        spaceBefore=4,
        spaceAfter=4,
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
        name="FinePrint",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#3a4147"),
        spaceAfter=3,
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
styles.add(
    ParagraphStyle(
        name="MetaFooter",
        parent=styles["BodyText"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#6b7780"),
        spaceAfter=6,
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


def lettered_clauses(items):
    """Render dense lettered legal blocks: 'A. Heading. body...' for authentic
    contract-style consent paragraphs. body may be a string or list of strings/flowables."""
    out = []
    for letter, heading, body in items:
        body_items = body if isinstance(body, (list, tuple)) else [body]
        first = True
        for item in body_items:
            if isinstance(item, str):
                if first:
                    out.append(p(f"<b>{letter}. {heading}.</b> {item}"))
                    first = False
                else:
                    out.append(p(item))
            else:
                if first:
                    out.append(p(f"<b>{letter}. {heading}.</b>"))
                    first = False
                out.append(item)
    return out


def subform(title: str, body, ack_items=None, sig_label="Patient or Representative Signature"):
    """Render a standalone consent sub-form (e.g., the anesthesia consent that
    rides along with a surgery form). Has its own title bar, body, optional
    ack checklist, and a compact signature row."""
    out = [p(title, "SubformTitle"),
           HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#b7c6d1")),
           Spacer(1, 3)]
    body_items = body if isinstance(body, (list, tuple)) else [body]
    for item in body_items:
        out.append(p(item) if isinstance(item, str) else item)
    if ack_items:
        out.append(Spacer(1, 4))
        out.append(checklist(ack_items))
    out.append(Spacer(1, 6))
    rows = [[sig_label, "Date", "Time"], ["", "", ""]]
    table = Table(rows, colWidths=[3.6 * inch, 1.6 * inch, 1.75 * inch], rowHeights=[0.22 * inch, 0.4 * inch])
    table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#9fb3c1")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef4f7")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    out.append(table)
    return out


def fine_print(paragraphs):
    """Dense 7.5pt paragraphs for the legal small-print block at the bottom of a form."""
    return [p(text, "FinePrint") for text in paragraphs]


def inline_initial(prompt: str):
    """Render a sentence that ends with a blank line and an '(initials)' marker,
    used for clauses requiring per-line patient acknowledgement."""
    return p(f"{prompt} &nbsp;&nbsp;_______ <i>(initials)</i>")


def form_meta_footer(form_num: str, rev_date: str):
    """Render the small 'Form CONS-101 | Rev. 03/2026' tag under the title."""
    return p(f"Form {form_num} &nbsp;&nbsp;|&nbsp;&nbsp; Rev. {rev_date}", "MetaFooter")


def build(form: dict):
    """Single entrypoint. A FORM dict has these keys:
        header   = {title, subtitle, form_num, rev_date}
        filename = output filename
        patient  = field_table rows
        clauses  = list of (letter, heading, body) tuples for the main consent
        extras   = optional list of flowables placed between clauses and subforms
        subforms = optional list of {title, body, ack_items, sig_label} dicts
        fine_print = optional list of dense paragraphs
        checklist = list of acknowledgement strings
    """
    h = form["header"]
    story = [
        p(h["title"], "TitleMain"),
        p(h["subtitle"], "Subtitle"),
        form_meta_footer(h["form_num"], h["rev_date"]),
        field_table(form["patient"]),
        Spacer(1, 9),
    ]
    story += note_box(
        "Demo notice",
        "This fictional document is for product demonstration and OCR testing. It should not be used as a real medical, dental, surgical, legal, or billing document.",
    )

    if form.get("clauses"):
        story += section("Consent Clauses")
        story.extend(lettered_clauses(form["clauses"]))

    for block in form.get("extras", []):
        story.append(block)

    for sf in form.get("subforms", []):
        story.append(Spacer(1, 8))
        story.extend(subform(
            sf["title"],
            sf["body"],
            sf.get("ack_items"),
            sf.get("sig_label", "Patient or Representative Signature"),
        ))

    if form.get("fine_print"):
        story += section("Additional Notices and Fine Print")
        story.extend(fine_print(form["fine_print"]))

    if form.get("checklist"):
        story += section("Patient Acknowledgements")
        story.append(checklist(form["checklist"]))
        story.append(Spacer(1, 10))

    story += section("Signatures")
    story.append(signature_block())
    make_doc(OUT / form["filename"]).build(story)


common_patient = [
    [p("Patient name", "Field"), p("____________________________"), p("DOB", "Field"), p("____ / ____ / ______")],
    [p("Record number", "Field"), p("____________________________"), p("Date of form", "Field"), p("____ / ____ / ______")],
    [p("Clinic/Facility", "Field"), p("____________________________"), p("Primary clinician", "Field"), p("____________________________")],
]


orthodontics_form = {
    "filename": "orthodontics-consent-form.pdf",
    "header": {
        "title": "Orthodontic Treatment Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "CONS-201",
        "rev_date": "03/2026",
    },
    "patient": common_patient,
    "clauses": [
        ("A", "Nature of Orthodontic Treatment",
         [
             "I authorize the orthodontic team to evaluate, diagnose, and provide orthodontic treatment using braces, clear aligners, retainers, expanders, attachments, elastics, bite ramps, temporary anchorage devices when separately discussed, digital scans, photographs, radiographs, and related appliances.",
             "The proposed treatment may include movement of teeth, jaw growth guidance, bite correction, space closure, tooth rotation, correction of crowding or spacing, retention planning, and periodic adjustments. Treatment length is an estimate and may change based on growth, cooperation, missed appointments, appliance breakage, oral hygiene, or biological response.",
             "I understand that orthodontic treatment is elective unless otherwise stated by the clinician. I may ask questions, request clarification, decline treatment, or seek another opinion before signing.",
         ]),
        ("B", "Expected Benefits",
         [
             "Potential benefits may include improved tooth alignment, bite function, dental hygiene access, jaw relationship, speech or chewing comfort, smile appearance, and long-term stability when retainers are worn as instructed.",
             "No specific cosmetic or functional result is guaranteed. Teeth and jaws may respond differently than predicted, and additional treatment may be recommended if the result is incomplete or relapse occurs.",
         ]),
        ("C", "Material Risks and Possible Complications",
         [
             "Risks may include soreness, gum irritation, ulcers, loose brackets, tooth sensitivity, decalcification or white spots, cavities, gum inflammation, root shortening, relapse, jaw joint discomfort, bite changes, allergic reaction to materials, accidental swallowing or aspiration of appliance parts, and the need for additional dental work.",
             "Excellent brushing, flossing, dietary cooperation, and appointment attendance are important. Poor oral hygiene during treatment can lead to permanent marks, cavities, gum disease, or delayed completion.",
             "Root resorption can occur during tooth movement. In rare cases, significant shortening may affect the long-term health of a tooth. The orthodontist may recommend additional radiographs, treatment pauses, or modification of the plan.",
         ]),
        ("D", "Alternatives",
         [
             "Alternatives may include no orthodontic treatment, limited orthodontic treatment, removable appliances, restorative dental options, extraction or non-extraction plans, jaw surgery referral, or delaying treatment until growth or dental development changes.",
             "The risks of no treatment may include continued crowding, bite problems, tooth wear, hygiene difficulty, esthetic concerns, or progression of an existing condition.",
         ]),
        ("E", "Patient Responsibilities",
         [
             "I agree to follow instructions for appliance wear, elastics, aligner timing, retainer use, oral hygiene, food restrictions, and appointment schedules. I understand that broken appliances, missed visits, or failure to wear aligners or retainers can extend treatment or compromise the result.",
             "I will inform the office about changes in medical history, pregnancy, medications, allergies, jaw pain, dental trauma, loose teeth, or new dental work during treatment.",
         ]),
        ("F", "Financial, Privacy, and Records",
         [
             "I understand that fees, insurance estimates, payment plans, missed appointment charges, replacement appliance fees, and records fees may be addressed in separate financial documents. Insurance benefits are not guaranteed and remain the patient's responsibility if denied or reduced.",
             "Clinical photographs, scans, models, and radiographs may be used for diagnosis, treatment planning, referrals, insurance, quality review, and education when appropriately de-identified or separately authorized.",
         ]),
    ],
    "fine_print": [
        "Treatment time estimates are not contractual. Cooperation with elastic wear, aligner change schedules, and retainer use materially affects outcome. Lifetime retention is recommended; relapse following discontinuation of retainers is a known and expected biological tendency.",
        "Photographic, radiographic, and digital intraoral scan records remain the property of the practice and may be retained for the period required by applicable state dental record retention statutes. Copies may be requested in writing and reasonable duplication fees may apply.",
    ],
    "checklist": [
        "I understand the proposed orthodontic treatment, expected benefits, and no-guarantee language.",
        "I understand risks including cavities, gum inflammation, root shortening, relapse, and appliance-related injury.",
        "I agree to follow appliance, aligner, elastic, hygiene, diet, appointment, and retainer instructions.",
        "I understand alternatives, including no treatment, limited treatment, and other dental or surgical options.",
        "I understand separate financial, insurance, privacy, records, and replacement appliance policies may apply.",
    ],
}


surgery_form = {
    "filename": "surgery-consent-form.pdf",
    "header": {
        "title": "Surgical Procedure Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "CONS-301",
        "rev_date": "03/2026",
    },
    "patient": common_patient,
    "clauses": [
        ("A", "Procedure Authorized",
         [
             "I authorize the surgical team to perform the procedure identified by my clinician: ________________________________________________. The procedure may include incision, removal, repair, reconstruction, biopsy, implantation, drainage, cautery, suturing, imaging guidance, pathology submission, and other steps reasonably necessary to complete the planned operation.",
             "I understand that unexpected findings may occur. If an unplanned condition is discovered and delaying care would place me at risk, I authorize the surgeon to perform additional or different procedures judged medically necessary at that time, unless I have written specific limitations below.",
             "Specific limitations or procedures I do not consent to: ________________________________________________________________.",
         ]),
        ("B", "Major Risks and Complications",
         [
             "Possible risks include bleeding, infection, pain, bruising, scarring, poor wound healing, blood clots, damage to nearby organs, vessels, nerves, or tissues, numbness, weakness, recurrence, retained foreign body, implant failure, need for transfusion, need for additional surgery, disability, loss of function, or death.",
             "Results cannot be guaranteed. A successful procedure may not relieve all symptoms, and additional diagnostic tests, medications, rehabilitation, or procedures may be required.",
             "I understand that all medical and surgical treatment has uncertainty. I have been encouraged to discuss my personal risk factors, including age, pregnancy status, diabetes, smoking, medications, blood thinners, implanted devices, allergies, and prior anesthesia problems.",
         ]),
        ("C", "Blood Products, Tissue, and Specimens",
         [
             "If clinically necessary, blood products may be recommended. Risks include fever, allergic reaction, transfusion reaction, infection transmission, and fluid overload. Alternatives may include refusing transfusion, blood conservation methods, or autologous options when available.",
             "Tissue, implants, fluids, or specimens removed during the procedure may be sent to pathology, discarded, stored, photographed, tested, or used for quality control and education as allowed by policy and law.",
             inline_initial("I have read and understand the disposition of removed tissue and specimens."),
         ]),
        ("D", "Alternatives and No Treatment",
         [
             "Alternatives may include observation, medication, therapy, lifestyle changes, injections, less invasive procedures, a different operation, referral to another specialist, or no treatment.",
             "The risks of refusing or delaying the procedure may include worsening symptoms, disease progression, pain, disability, infection, organ damage, emergency surgery, or other complications depending on the condition.",
         ]),
        ("E", "Postoperative Care",
         [
             "I agree to follow discharge instructions, activity restrictions, wound care, medication directions, follow-up appointments, and return precautions. I understand that driving, operating machinery, signing important documents, drinking alcohol, or making major decisions may be unsafe after sedation or anesthesia.",
             "I will seek urgent care if I experience severe pain, heavy bleeding, fever, shortness of breath, chest pain, new weakness, confusion, signs of infection, or other concerning symptoms described by my care team.",
         ]),
    ],
    "subforms": [
        {
            "title": "Anesthesia and Sedation Sub-Consent (Form CONS-310)",
            "body": [
                "Anesthesia care may be provided by an anesthesiologist, certified registered nurse anesthetist, or qualified clinician. The plan may include local anesthesia, regional or peripheral nerve block, monitored anesthesia care, moderate or deep sedation, or general anesthesia, and may be modified intra-operatively as the clinical situation requires.",
                "Common anesthesia risks include nausea, vomiting, sore throat, hoarseness, dental injury, intravenous-site bruising, headache, and short-term memory effects. Less common but serious risks include allergic reaction, aspiration, breathing difficulty, heart rhythm changes, awareness under general anesthesia, peripheral nerve injury, malignant hyperthermia, stroke, heart attack, and death.",
                "I understand that anesthesia risk may be elevated by pregnancy, obesity, sleep apnea, prior anesthesia complications, anticoagulant or GLP-1 medications, recent illness, or undisclosed substance use, and I have disclosed these factors to the anesthesia team.",
            ],
            "ack_items": [
                "I have disclosed allergies, medications, supplements, and prior anesthesia reactions.",
                "I understand that the anesthesia plan may change intra-operatively for my safety.",
                "I understand that I should not drive, operate machinery, or sign legal documents for at least 24 hours after sedation.",
            ],
            "sig_label": "Patient Signature (Anesthesia Sub-Consent)",
        },
    ],
    "fine_print": [
        "This consent does not cover services billed separately by independent providers (e.g., pathology, anesthesia, surgical assistants, durable medical equipment vendors). Such services may be subject to separate financial responsibility documents.",
        "Photographs, video, or imaging captured during the procedure for clinical documentation may be retained in the medical record and used in de-identified form for education, quality assurance, peer review, and required regulatory reporting.",
    ],
    "checklist": [
        "I understand the planned procedure and authorize reasonably necessary additional steps in urgent unexpected circumstances.",
        "I have signed the anesthesia sub-consent on this form and disclosed allergies, medications, prior reactions, and medical conditions.",
        "I understand serious risks including bleeding, infection, organ or nerve injury, transfusion, additional surgery, disability, or death.",
        "I understand alternatives, including no treatment, and the possible risks of refusal or delay.",
        "I agree to follow postoperative instructions and seek urgent care for warning symptoms.",
    ],
}


general_medical_form = {
    "filename": "general-medical-consent-form.pdf",
    "header": {
        "title": "General Medical Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "CONS-101",
        "rev_date": "03/2026",
    },
    "patient": common_patient,
    "clauses": [
        ("A", "General Consent for Evaluation and Treatment",
         [
             "I consent to evaluation, examination, diagnostic testing, routine treatment, nursing care, medication administration, telehealth services when offered, imaging, laboratory services, referrals, and other services ordered by authorized healthcare professionals at this facility.",
             "Treatment may be provided by physicians, advanced practice clinicians, nurses, technicians, students, residents, trainees, contractors, and other personnel under appropriate supervision.",
             "I understand that healthcare involves professional judgment and that outcomes are not guaranteed. I may ask questions and may refuse or withdraw consent for non-emergency care, although refusal may affect my health or treatment options.",
         ]),
        ("B", "Information Sharing and Privacy",
         [
             "I authorize the facility to use and disclose health information for treatment, payment, healthcare operations, care coordination, referrals, quality review, required reporting, and other purposes described in the Notice of Privacy Practices.",
             "Information may be shared with pharmacies, laboratories, imaging centers, insurers, billing vendors, other treating providers, public health agencies, and legally authorized representatives. Some disclosures may occur electronically.",
             "I understand that certain sensitive services, such as behavioral health, reproductive health, substance use treatment, genetic testing, or communicable disease information, may have additional privacy protections under applicable law.",
         ]),
        ("C", "Financial Responsibility",
         [
             "I understand that I am responsible for charges not paid by insurance, including deductibles, co-payments, co-insurance, non-covered services, out-of-network services, missed appointment fees when applicable, supplies, forms, records, and balances denied by my plan.",
             "Insurance verification is not a guarantee of payment. I authorize release of information needed to process claims and assign insurance benefits payable for covered services to the facility or treating provider.",
         ]),
        ("D", "Medications, Tests, and Referrals",
         [
             "I consent to medications, vaccines, injections, laboratory tests, imaging, screenings, and referrals ordered as part of my care. Risks may include side effects, allergic reactions, false positives, false negatives, incidental findings, or need for follow-up testing.",
             "I agree to provide accurate information about medications, supplements, allergies, pregnancy status, medical history, and prior reactions. I understand that incomplete information can increase clinical risk.",
         ]),
        ("E", "Communication Preferences",
         [
             "The facility may contact me by phone, voicemail, text message, email, patient portal, mail, or automated reminder system for scheduling, results, billing, care coordination, surveys, and health-related notices. Message and data rates may apply for text communications.",
             "I may request restrictions or alternate communication methods, but the facility may not be able to honor every request if it interferes with treatment, payment, operations, or legal obligations.",
         ]),
        ("F", "Patient Rights and Responsibilities",
         [
             "I have the right to receive information in a way I can understand, ask questions, request an interpreter, participate in care decisions, review applicable privacy notices, and file a complaint without retaliation.",
             "I agree to treat staff respectfully, provide accurate information, follow agreed care plans, keep appointments or cancel in advance, and ask for clarification if I do not understand instructions.",
         ]),
    ],
    "fine_print": [
        "This general consent does not replace procedure-specific informed consent. Surgical, sedation, imaging-with-contrast, behavioral-health, reproductive-health, and other specialized services may require separate written authorization.",
        "Notice of Privacy Practices is provided separately and is incorporated by reference. The facility's most current Notice may be obtained at the front desk or via the patient portal.",
    ],
    "checklist": [
        "I consent to general evaluation, testing, treatment, medication administration, referrals, and routine healthcare services.",
        "I understand health information may be used and disclosed for treatment, payment, operations, and required reporting.",
        "I understand financial responsibility for amounts not paid by insurance and authorize claim-related information release.",
        "I understand communication may occur by phone, portal, mail, text, email, or automated reminder systems.",
        "I know I may ask questions, request an interpreter, refuse non-emergency care, or seek more information before signing.",
    ],
}


dental_implant_form = {
    "filename": "dental-implant-consent-form.pdf",
    "header": {
        "title": "Dental Implant Procedure Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "CONS-401",
        "rev_date": "03/2026",
    },
    "patient": common_patient,
    "clauses": [
        ("A", "Nature of the Implant Procedure",
         [
             "I authorize the dental team to evaluate my mouth, jaw, and supporting bone and to place one or more dental implants at the location(s) discussed: ________________________________________________. The procedure may include local anesthesia, oral or IV sedation when separately consented, surgical incision of the gum, drilling and shaping of the bone, placement of titanium or zirconia implant fixtures, healing abutments, bone grafting material, membranes, sutures, and temporary or final restorative components.",
             "Treatment is delivered in stages over several months and may include healing periods of 8 to 24 weeks, second-stage uncovery, abutment connection, impressions or digital scans, and delivery of a crown, bridge, or denture supported by the implant(s).",
             inline_initial("I understand that dental implant treatment is elective and reversible only by additional surgery."),
         ]),
        ("B", "Risks and Possible Complications",
         [
             "Risks include pain, swelling, bruising, bleeding, infection, sinus involvement for upper-jaw implants, nerve injury causing temporary or permanent numbness or tingling of the lip, chin, tongue, or cheek, damage to adjacent teeth or restorations, fracture of the jaw bone, failure of the implant to integrate, peri-implantitis, bone or gum recession, esthetic compromise, need for additional grafting or revision surgery, and loss of the implant.",
             "Implant success is not guaranteed. Smoking, uncontrolled diabetes, bisphosphonate or antiresorptive medication history, immunosuppression, bruxism, poor oral hygiene, and radiation therapy to the jaw materially increase the risk of failure.",
         ]),
        ("C", "Bone Grafting and Sinus Procedures",
         [
             "If insufficient bone is identified, bone grafting using autograft, allograft, xenograft, or synthetic materials may be recommended. Sinus floor elevation may be required for upper-jaw implants. Risks include graft rejection, sinus membrane perforation, sinusitis, graft displacement, prolonged healing, and the possibility that the planned implant placement is not achievable.",
         ]),
        ("D", "Alternatives",
         [
             "Alternatives include no treatment, removable partial or full dentures, fixed bridges supported by adjacent teeth, resin-bonded restorations, orthodontic space management, or referral to a specialist for further evaluation.",
             "The risks of no treatment include continued bone loss in the edentulous area, drifting of adjacent teeth, supra-eruption of opposing teeth, esthetic and chewing-function decline, and progression of underlying dental disease.",
         ]),
        ("E", "Materials, Photography, and Records",
         [
             "I consent to the use of titanium or zirconia implant fixtures, abutments, and prosthetic components selected by the dental team. Manufacturer brand and lot information will be retained in my chart in accordance with applicable medical-device traceability requirements.",
             "Pre-operative, intra-operative, and post-operative photographs, intraoral scans, and CBCT or panoramic radiographs may be used for treatment planning, laboratory fabrication, insurance support, peer consultation, and de-identified education.",
         ]),
        ("F", "Financial Responsibility",
         [
             "Implant treatment fees are typically itemized across surgical placement, abutment, restoration, grafting, sedation, and imaging stages. Insurance estimates are not a guarantee of payment, and the patient is financially responsible for amounts not covered, including replacement components if peri-implantitis or fracture occurs outside any applicable warranty period.",
         ]),
    ],
    "fine_print": [
        "Dental implant warranties offered by manufacturers do not cover loss attributable to smoking, untreated periodontal disease, undisclosed medical conditions, missed maintenance visits, or trauma. Replacement of failed implants is generally treated as a new course of care.",
        "Stage-by-stage success rates published in the dental literature are not predictive of any individual outcome. Healing time, integration, and esthetic result vary by site, biology, and patient compliance.",
    ],
    "checklist": [
        "I understand the multi-stage nature of dental implant treatment and the months-long healing schedule.",
        "I understand risks including nerve injury, sinus involvement, implant failure, and the possible need for grafting or revision surgery.",
        "I have disclosed smoking, diabetes, bisphosphonate or antiresorptive history, immunosuppression, and other relevant medical history.",
        "I understand alternatives including dentures, bridges, and no treatment.",
        "I understand fees are itemized by stage and that warranty coverage is limited.",
    ],
}


radiation_dose_table_data = [
    [p("<b>Modality</b>", "Field"), p("<b>Typical effective dose</b>", "Field"),
     p("<b>Approx. equivalent to</b>", "Field"), p("<b>Contrast typically used</b>", "Field")],
    [p("Chest x-ray (1 view)", "Small"), p("0.02 mSv", "Small"),
     p("~3 days of natural background", "Small"), p("None", "Small")],
    [p("CT head (without contrast)", "Small"), p("2 mSv", "Small"),
     p("~8 months of natural background", "Small"), p("None", "Small")],
    [p("CT abdomen/pelvis (with IV contrast)", "Small"), p("10 mSv", "Small"),
     p("~3 years of natural background", "Small"), p("Iodinated IV", "Small")],
    [p("Mammogram (bilateral, 4 views)", "Small"), p("0.4 mSv", "Small"),
     p("~7 weeks of natural background", "Small"), p("None", "Small")],
    [p("MRI (any region)", "Small"), p("0 mSv (no ionizing radiation)", "Small"),
     p("Not applicable", "Small"), p("Gadolinium IV (sometimes)", "Small")],
    [p("Ultrasound", "Small"), p("0 mSv (no ionizing radiation)", "Small"),
     p("Not applicable", "Small"), p("Microbubble (rare)", "Small")],
]


def radiation_dose_table():
    table = Table(radiation_dose_table_data,
                  colWidths=[2.05 * inch, 1.6 * inch, 1.95 * inch, 1.35 * inch])
    table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#b7c6d1")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dbe8ef")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


imaging_form = {
    "filename": "imaging-consent-form.pdf",
    "header": {
        "title": "Diagnostic Imaging and Contrast Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "CONS-501",
        "rev_date": "03/2026",
    },
    "patient": common_patient,
    "clauses": [
        ("A", "Examinations Authorized",
         [
             "I authorize the imaging team to perform the studies ordered by my clinician, which may include radiography, fluoroscopy, computed tomography (CT), magnetic resonance imaging (MRI), ultrasound, mammography, bone densitometry, nuclear medicine, or interventional imaging-guided procedures.",
             "Specific exams ordered today: ________________________________________________________________.",
         ]),
        ("B", "Ionizing Radiation Disclosure",
         [
             "Some studies use ionizing radiation. The dose is kept as low as reasonably achievable (the ALARA principle). The table below describes typical adult effective doses; individual exposure may vary based on body habitus, technique, and clinical indication.",
             radiation_dose_table(),
             Spacer(1, 4),
             "Cumulative radiation dose over a lifetime carries a small theoretical increase in cancer risk. The benefit of an indicated study is generally considered to outweigh this risk, but I have been encouraged to discuss any concerns with my ordering clinician.",
             inline_initial("I understand the radiation dose discussion above."),
         ]),
        ("C", "Iodinated and Gadolinium-Based Contrast",
         [
             "Some examinations require intravenous, oral, or intra-cavitary contrast media. Iodinated contrast (CT) and gadolinium-based contrast (MRI) improve diagnostic detail but carry risks.",
             "Risks of iodinated contrast may include warm sensation, nausea, vomiting, hives, itching, bronchospasm, low blood pressure, and rarely severe allergic-like reaction or contrast-associated kidney injury, especially with reduced kidney function, dehydration, diabetes, or use of certain medications.",
             "Risks of gadolinium-based contrast may include nausea, headache, injection-site reaction, allergic-like reaction, and in patients with severe kidney disease the rare risk of nephrogenic systemic fibrosis. Trace gadolinium retention in tissues has been reported with some agents; long-term clinical significance is not established.",
             inline_initial("I have disclosed kidney disease, prior contrast reactions, asthma, beta-blocker use, and pregnancy/breastfeeding status."),
         ]),
        ("D", "Pregnancy, Breastfeeding, and Implants Screening",
         [
             "If there is any chance of pregnancy, I will inform the technologist before the exam. Some studies, particularly those using ionizing radiation or contrast, may be modified, postponed, or replaced with an alternative. I confirm that I have completed any MRI safety screening for implanted devices, metallic foreign bodies, pacemakers, neurostimulators, cochlear implants, drug pumps, and tattoos as applicable.",
         ]),
        ("E", "Sedation and Interventional Imaging",
         [
             "Certain procedures (biopsies, drainages, vascular access, joint injections, angiography) may use moderate sedation, local anesthesia, or general anesthesia, and may carry additional risks of bleeding, infection, vessel or organ injury, allergic reaction, and the need for further treatment. A separate procedure-specific consent may be required.",
         ]),
        ("F", "Image Use, Storage, and Reporting",
         [
             "Images and reports are stored in the medical record and may be shared with the ordering clinician, treating providers, insurers, regulators, and external imaging archives for continuity of care. De-identified images may be used for quality review, teaching, and protocol optimization.",
             "I understand that radiology interpretations are typically issued by a radiologist after the exam and that a preliminary read at the time of exam is not the final report.",
         ]),
    ],
    "fine_print": [
        "Pregnancy and breastfeeding considerations: when iodinated or gadolinium-based contrast is administered, current professional society guidance generally supports continuation of breastfeeding without interruption; alternative recommendations may apply in specific clinical scenarios. Discuss any concerns with the radiologist.",
        "Incidental findings unrelated to the indication for imaging may be reported. Such findings may require additional follow-up testing, specialist consultation, or short-interval re-imaging at additional cost.",
    ],
    "checklist": [
        "I understand the imaging studies ordered, including any use of ionizing radiation.",
        "I understand the risks of iodinated and gadolinium-based contrast and have disclosed allergies, kidney disease, and pregnancy or breastfeeding status.",
        "I have completed MRI safety screening for implants and metallic foreign bodies if MRI is ordered.",
        "I understand that incidental findings may require additional testing.",
        "I understand that final radiology interpretation is provided after the exam, not at the scanner.",
    ],
}


telehealth_form = {
    "filename": "telehealth-consent-form.pdf",
    "header": {
        "title": "Telehealth Services Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "CONS-601",
        "rev_date": "03/2026",
    },
    "patient": common_patient,
    "clauses": [
        ("A", "Nature of Telehealth Services",
         [
             "I consent to receive healthcare services through telehealth, which uses live audio and video, secure messaging, store-and-forward image or document review, and remote patient-monitoring data to deliver evaluation, diagnosis, treatment recommendations, prescriptions when clinically appropriate, education, behavioral health services, and follow-up care.",
             "Telehealth may be provided by clinicians located in a different city, state, or country, subject to applicable licensure requirements. The clinician will inform me of the state in which they are licensed and from which they are providing care.",
         ]),
        ("B", "Expected Benefits and Limitations",
         [
             "Benefits of telehealth may include reduced travel, faster access to care, and continuity with established clinicians. Limitations include inability to perform a hands-on physical examination, dependence on the patient's description of symptoms, limited ability to perform point-of-care procedures, and reliance on the patient's home environment, devices, and connectivity.",
             "If at any point the clinician determines that an in-person visit, urgent care, or emergency evaluation is needed, the visit may be redirected. Telehealth is not appropriate for emergencies; in an emergency I will call local emergency services.",
         ]),
        ("C", "Connection Failure and Technical Issues",
         [
             "Telehealth depends on internet bandwidth, device functionality, audio and video quality, software updates, and third-party platform availability. Disruptions, dropped connections, audio loss, video freeze, or platform outages may occur.",
             "If the connection drops mid-visit, the clinician will attempt to re-establish connection through the original platform, then by alternate platform or telephone using the contact number on file. If reconnection is not successful within a reasonable time, the visit may be rescheduled or completed by telephone at the clinician's discretion.",
             "I understand that I am responsible for ensuring my device, microphone, camera, and connection are functional before the visit. Technical issues on my side that prevent the visit from being completed may be billable as a missed-visit fee under the practice's standard policy.",
             inline_initial("I have read and understand the connection-failure procedure."),
         ]),
        ("D", "Privacy, Security, and Recording",
         [
             "The telehealth platform is intended to support encryption in transit and reasonable security controls; however, no electronic communication system can be guaranteed against interception, breach, or unauthorized access. I understand that telehealth occurs over the public internet and may carry residual privacy risk despite reasonable safeguards.",
             "I will choose a private location for telehealth visits and acknowledge that the practice cannot control the privacy of my surroundings. Visits will not be recorded by the clinician without my separate written authorization, and I will not record the visit without the clinician's knowledge and consent.",
             "Information shared during telehealth visits is documented in the medical record under the same privacy rules as in-person care.",
         ]),
        ("E", "Prescriptions and Controlled Substances",
         [
             "Prescriptions issued via telehealth are subject to clinical appropriateness and applicable federal and state laws, including controlled-substance regulations that may require an in-person evaluation, identity verification, or use of a specific electronic prescribing system.",
             "I understand that not all prescriptions can be issued by telehealth and that the clinician may decline to prescribe if telehealth evaluation is insufficient.",
         ]),
        ("F", "State Licensing and Cross-State Care",
         [
             "Most states require the treating clinician to be licensed in the state where the patient is physically located at the time of the visit. I will inform the clinician of my physical location at the start of each visit. Care across state lines may not be possible if licensure or interstate compact coverage is not in effect.",
         ]),
        ("G", "Financial Responsibility for Telehealth",
         [
             "Telehealth visits may be billed at the same rate as in-person visits or under separate telehealth codes depending on payer rules. Coverage and patient cost-share for telehealth varies by plan and may change without notice. I am financially responsible for amounts not paid by my insurer.",
         ]),
    ],
    "fine_print": [
        "Telehealth is not a substitute for emergency care. If you experience chest pain, difficulty breathing, signs of stroke, severe bleeding, suicidal thoughts, or other emergencies, call 911 or go to the nearest emergency department immediately.",
        "Continuity of care: telehealth visits become part of your medical record and may be shared with your in-person care team for coordination of care unless you specifically opt out in writing where law allows.",
        "Out-of-state and international travel: regulations may prevent the clinician from rendering care while you are physically located outside their licensed jurisdiction. If you are traveling, please disclose your location at the start of each visit.",
    ],
    "checklist": [
        "I understand telehealth uses live video, audio, messaging, and remote data, and has limitations compared to an in-person visit.",
        "I understand the connection-failure procedure and that visits may be reattempted by phone or rescheduled.",
        "I understand the residual privacy and security risks of telehealth and that visits will not be recorded without separate authorization.",
        "I understand that not all prescriptions, especially controlled substances, can be issued via telehealth.",
        "I understand state licensing rules and will disclose my physical location at the start of each visit.",
        "I understand financial responsibility for amounts not paid by my insurer for telehealth services.",
    ],
}


for form in (general_medical_form, orthodontics_form, surgery_form,
             dental_implant_form, imaging_form, telehealth_form):
    build(form)


print(f"Generated PDFs in {OUT}")
