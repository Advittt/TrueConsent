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
styles.add(
    ParagraphStyle(
        name="SubformTitle",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#19324a"),
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="MetaFooter",
        parent=styles["BodyText"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#6b7780"),
        alignment=TA_CENTER,
        spaceBefore=10,
    )
)


def make_footer(form_num: str, rev_date: str):
    label = f"Form {form_num} - Rev. {rev_date}  |  Mock demo for TrueConsent testing only - not a real medical, dental, surgical, legal, or billing document"

    def _footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor("#6b7780"))
        canvas.drawString(0.72 * inch, 0.45 * inch, label)
        canvas.drawRightString(7.78 * inch, 0.45 * inch, f"Page {doc.page}")
        canvas.restoreState()

    return _footer


def make_doc(path: Path, form_num: str, rev_date: str):
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
    doc.addPageTemplates(
        [PageTemplate(id="normal", frames=[frame], onPage=make_footer(form_num, rev_date))]
    )
    return doc


def p(text, style="BodyTight"):
    return Paragraph(text, styles[style])


def section(title: str):
    return [
        p(title, "Section"),
        HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#b7c6d1")),
        Spacer(1, 4),
    ]


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
    rows = []
    for letter, heading, body in items:
        rows.append(
            [
                p(f"<b>{letter}.</b>", "BodyTight"),
                p(f"<b>{heading}.</b> {body}", "BodyTight"),
            ]
        )
    table = Table(rows, colWidths=[0.32 * inch, 6.63 * inch])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return [table]


def subform(title: str, body, ack=None, sig_line: bool = False):
    inner = [p(title, "SubformTitle")]
    for para in body:
        inner.append(p(para, "Small"))
    if ack:
        for item in ack:
            inner.append(p(f"[ ]&nbsp;&nbsp;{item}", "Small"))
    if sig_line:
        inner.append(Spacer(1, 4))
        inner.append(
            p(
                "Patient/Representative signature: ____________________________"
                "&nbsp;&nbsp; Date: ____ / ____ / ______"
                "&nbsp;&nbsp; Witness initials: ______",
                "Small",
            )
        )
    table = Table(
        [[inner]],
        colWidths=[6.85 * inch],
    )
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#7891a3")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f6f9fb")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return [Spacer(1, 4), KeepTogether(table), Spacer(1, 8)]


def fine_print(paragraphs):
    return [p(text, "Small") for text in paragraphs]


def inline_initial(text: str):
    return [p(f"{text}&nbsp;&nbsp;_______ <i>(initials)</i>", "BodyTight")]


def form_meta_footer(form_num: str, rev_date: str):
    return [p(f"Form {form_num} &nbsp;&nbsp;|&nbsp;&nbsp; Rev. {rev_date}", "MetaFooter")]


def render_block(item):
    if isinstance(item, str):
        return [p(item)]
    if isinstance(item, tuple) and len(item) == 2:
        kind, payload = item
        if kind == "clauses":
            return lettered_clauses(payload)
        if kind == "fine_print":
            return fine_print(payload)
        if kind == "initial":
            return inline_initial(payload)
        if kind == "subform":
            return subform(**payload)
        raise ValueError(f"Unknown block kind: {kind}")
    if isinstance(item, list):
        return list(item)
    raise TypeError(f"Unsupported section item: {type(item).__name__}")


def build(form: dict):
    story = [
        p(form["title"], "TitleMain"),
        p(form["subtitle"], "Subtitle"),
        field_table(form["patient"]),
        Spacer(1, 9),
    ]
    story += note_box(
        "Demo notice",
        "This fictional document is for product demonstration and OCR testing. It should not be used as a real medical, dental, surgical, legal, or billing document.",
    )
    for heading, blocks in form["sections"]:
        story += section(heading)
        for item in blocks:
            story.extend(render_block(item))
    story += section("Patient Acknowledgements")
    story.append(checklist(form["checklist"]))
    story.append(Spacer(1, 10))
    story += section("Signatures")
    story.append(signature_block())
    story += form_meta_footer(form["form_num"], form["rev_date"])
    make_doc(OUT / form["filename"], form["form_num"], form["rev_date"]).build(story)


common_patient = [
    [p("Patient name", "Field"), p("____________________________"), p("DOB", "Field"), p("____ / ____ / ______")],
    [p("Record number", "Field"), p("____________________________"), p("Date of form", "Field"), p("____ / ____ / ______")],
    [p("Clinic/Facility", "Field"), p("____________________________"), p("Primary clinician", "Field"), p("____________________________")],
]


FORMS = [
    {
        "filename": "orthodontics-consent-form.pdf",
        "title": "Orthodontic Treatment Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "ORTHO-204",
        "rev_date": "03/2026",
        "patient": common_patient,
        "sections": [
            ("Nature of Orthodontic Treatment", [
                "I authorize the orthodontic team to evaluate, diagnose, and provide orthodontic treatment using braces, clear aligners, retainers, expanders, attachments, elastics, bite ramps, temporary anchorage devices when separately discussed, digital scans, photographs, radiographs, and related appliances.",
                ("clauses", [
                    ("A", "Scope of treatment", "The proposed treatment may include movement of teeth, jaw growth guidance, bite correction, space closure, tooth rotation, correction of crowding or spacing, retention planning, and periodic adjustments."),
                    ("B", "Treatment timeline", "Treatment length is an estimate and may change based on growth, cooperation, missed appointments, appliance breakage, oral hygiene, or biological response. The orthodontist may modify or extend the plan as needed."),
                    ("C", "Right to decline", "I understand that orthodontic treatment is elective unless otherwise stated by the clinician. I may ask questions, request clarification, decline treatment, or seek another opinion before signing."),
                ]),
            ]),
            ("Expected Benefits", [
                "Potential benefits may include improved tooth alignment, bite function, dental hygiene access, jaw relationship, speech or chewing comfort, smile appearance, and long-term stability when retainers are worn as instructed.",
                "No specific cosmetic or functional result is guaranteed. Teeth and jaws may respond differently than predicted, and additional treatment may be recommended if the result is incomplete or relapse occurs.",
            ]),
            ("Material Risks and Possible Complications", [
                ("clauses", [
                    ("A", "Soft-tissue and tooth-level risks", "Risks may include soreness, gum irritation, ulcers, loose brackets, tooth sensitivity, decalcification or white spots, cavities, gum inflammation, allergic reaction to materials, and accidental swallowing or aspiration of small appliance parts."),
                    ("B", "Root and bone risks", "Root resorption can occur during tooth movement. In rare cases, significant shortening may affect the long-term health of a tooth. The orthodontist may recommend additional radiographs, treatment pauses, or modification of the plan."),
                    ("C", "Functional and joint risks", "Some patients experience temporary or persistent jaw joint discomfort, bite changes, or muscle soreness during treatment. Pre-existing jaw joint conditions may be aggravated by orthodontic forces."),
                    ("D", "Relapse", "Teeth and jaws have a tendency to return toward their original position after appliances are removed. Lifelong retainer wear, as instructed, is the most reliable way to maintain the achieved result."),
                ]),
                ("initial", "I have had the opportunity to ask questions about each of the lettered risk categories above."),
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
                ("fine_print", [
                    "Clinical photographs, scans, models, and radiographs may be used for diagnosis, treatment planning, referrals, insurance review, internal quality review, and de-identified educational use as permitted by applicable privacy regulations and the office's Notice of Privacy Practices.",
                    "Replacement appliances (lost retainers, broken expanders, lost aligner trays, transfer records, and replacement bonded retainers) are billed at the schedule posted in the financial agreement. Replacement fees are not covered by insurance unless specifically negotiated in writing.",
                    "Estimated treatment fees do not include emergency visits, repair of breakage caused by non-compliance, additional records, treatment performed outside the originally scoped plan, or fees charged by referring or restorative dentists for adjunctive procedures.",
                ]),
            ]),
        ],
        "checklist": [
            "I understand the proposed orthodontic treatment, expected benefits, and no-guarantee language.",
            "I understand risks including cavities, gum inflammation, root shortening, relapse, and appliance-related injury.",
            "I agree to follow appliance, aligner, elastic, hygiene, diet, appointment, and retainer instructions.",
            "I understand alternatives, including no treatment, and the risks of refusing treatment.",
            "I understand separate financial, insurance, privacy, records, and replacement appliance policies may apply.",
        ],
    },
    {
        "filename": "surgery-consent-form.pdf",
        "title": "Surgical Procedure Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "SURG-310",
        "rev_date": "03/2026",
        "patient": common_patient,
        "sections": [
            ("Procedure Authorized", [
                "I authorize the surgical team to perform the procedure identified by my clinician: ________________________________________________. The procedure may include incision, removal, repair, reconstruction, biopsy, implantation, drainage, cautery, suturing, imaging guidance, pathology submission, and other steps reasonably necessary to complete the planned operation.",
                "I understand that unexpected findings may occur. If an unplanned condition is discovered and delaying care would place me at risk, I authorize the surgeon to perform additional or different procedures judged medically necessary at that time, unless I have written specific limitations below.",
                "Specific limitations or procedures I do not consent to: ________________________________________________________________.",
                ("initial", "I have reviewed the planned procedure, the unexpected-findings clause, and any specific limitations recorded above."),
            ]),
            ("Anesthesia and Sedation", [
                "I understand that anesthesia may include local anesthesia, regional block, monitored anesthesia care, moderate sedation, deep sedation, or general anesthesia, depending on the procedure and the anesthesiology assessment.",
                ("subform", {
                    "title": "Anesthesia Sub-Consent",
                    "body": [
                        "I have been informed that the type and depth of anesthesia will be selected by the anesthesiologist or qualified anesthesia provider, in consultation with the surgical team, based on the planned procedure, my medical history, my airway assessment, and intra-operative needs. The plan may change during surgery if a deeper level becomes necessary.",
                        "Material anesthesia risks include nausea, vomiting, sore throat, dental injury, allergic reaction, aspiration, medication side effects, breathing problems, heart rhythm changes, awareness under anesthesia, nerve injury, stroke, heart attack, and death. Anesthesia risks may be elevated for patients with certain cardiac, pulmonary, neurologic, hepatic, renal, or metabolic conditions.",
                        "If a regional block or neuraxial technique is used, additional specific risks include block failure, prolonged numbness, motor weakness, post-dural-puncture headache, infection at the injection site, and rare nerve injury.",
                    ],
                    "ack": [
                        "I have disclosed all current prescription medications, over-the-counter medications, herbal or dietary supplements, recreational substances, allergies, and prior anesthesia reactions to the anesthesia team.",
                        "I understand and have followed the fasting (NPO) instructions, and have not eaten or had non-clear liquids in violation of those instructions.",
                        "I understand that, after sedation or general anesthesia, I may not drive, operate machinery, sign legal documents, or be alone with dependents for the time period instructed by the anesthesia team.",
                    ],
                    "sig_line": True,
                }),
            ]),
            ("Major Risks and Complications", [
                ("clauses", [
                    ("A", "Bleeding and infection", "Possible risks include bleeding requiring transfusion or reoperation, hematoma, surgical-site infection, deep infection involving implants or hardware, sepsis, and delayed wound healing."),
                    ("B", "Damage to surrounding structures", "Adjacent organs, blood vessels, nerves, ducts, or tissues can be injured during the procedure. Such injury may cause numbness, weakness, loss of function, organ dysfunction, or the need for additional surgery to repair the injury."),
                    ("C", "Thrombosis and embolism", "Surgery and immobility increase the risk of deep vein thrombosis and pulmonary embolism. Preventive measures may include early mobilization, mechanical compression, and medications, each with their own risks."),
                    ("D", "Implants and devices", "If an implant, mesh, hardware, or device is used, additional risks include implant failure, malposition, breakage, migration, infection of the implant, foreign body reaction, and the need for revision or removal."),
                    ("E", "Outcome and need for further care", "A successful procedure may not relieve all symptoms, and additional diagnostic tests, medications, rehabilitation, or further procedures may be required. Disability, loss of function, or death are rare but possible."),
                ]),
                "I have been encouraged to discuss my personal risk factors, including age, pregnancy status, diabetes, smoking, medications, blood thinners, implanted devices, allergies, and prior anesthesia problems.",
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
                ("fine_print", [
                    "If pathology returns unexpected findings, the office will attempt to contact me using the contact information on file. It is my responsibility to keep contact information current and to respond to messages from the surgical team promptly.",
                    "Photographs and intra-operative images may be taken for the medical record and, in de-identified form, used for peer review, surgical education, and quality improvement, consistent with applicable privacy laws.",
                ]),
            ]),
        ],
        "checklist": [
            "I understand the planned procedure and authorize reasonably necessary additional steps in urgent unexpected circumstances.",
            "I understand anesthesia or sedation risks and have disclosed allergies, medications, prior reactions, and medical conditions.",
            "I understand serious risks including bleeding, infection, organ or nerve injury, transfusion, additional surgery, disability, or death.",
            "I understand alternatives, including no treatment, and the possible risks of refusal or delay.",
            "I agree to follow postoperative instructions and seek urgent care for warning symptoms.",
        ],
    },
    {
        "filename": "general-medical-consent-form.pdf",
        "title": "General Medical Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "GEN-101",
        "rev_date": "03/2026",
        "patient": common_patient,
        "sections": [
            ("General Consent for Evaluation and Treatment", [
                "I consent to evaluation, examination, diagnostic testing, routine treatment, nursing care, medication administration, telehealth services when offered, imaging, laboratory services, referrals, and other services ordered by authorized healthcare professionals at this facility.",
                "Treatment may be provided by physicians, advanced practice clinicians, nurses, technicians, students, residents, trainees, contractors, and other personnel under appropriate supervision.",
                "I understand that healthcare involves professional judgment and that outcomes are not guaranteed. I may ask questions and may refuse or withdraw consent for non-emergency care, although refusal may affect my health or treatment options.",
            ]),
            ("Information Sharing and Privacy", [
                ("clauses", [
                    ("A", "Routine uses", "I authorize the facility to use and disclose health information for treatment, payment, healthcare operations, care coordination, referrals, quality review, accreditation, required reporting, and other purposes described in the Notice of Privacy Practices."),
                    ("B", "External recipients", "Information may be shared with pharmacies, laboratories, imaging centers, insurers, billing vendors, other treating providers, public health agencies, and legally authorized representatives. Some disclosures may occur electronically through participating health information exchanges."),
                    ("C", "Sensitive information", "Certain sensitive services, such as behavioral health, reproductive health, substance use treatment, genetic testing, or communicable disease information, may have additional privacy protections under applicable law and may require separate written authorization for release."),
                ]),
            ]),
            ("Financial Responsibility", [
                "I understand that I am responsible for charges not paid by insurance, including deductibles, co-payments, co-insurance, non-covered services, out-of-network services, missed appointment fees when applicable, supplies, forms, records, and balances denied by my plan.",
                "Insurance verification is not a guarantee of payment. I authorize release of information needed to process claims and assign insurance benefits payable for covered services to the facility or treating provider.",
                ("initial", "I have been offered a copy of the financial responsibility policy and the Notice of Privacy Practices."),
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
                ("fine_print", [
                    "This general consent does not authorize procedures, surgeries, or treatments for which a separate, specific written consent is required by facility policy or applicable law. Such procedures will be addressed in a procedure-specific consent form before they are performed.",
                    "This consent is effective for the duration of the current treatment relationship and any related episodes of care, unless I withdraw it in writing. Withdrawal of consent does not apply retroactively to care that has already been provided.",
                ]),
            ]),
        ],
        "checklist": [
            "I consent to general evaluation, testing, treatment, medication administration, referrals, and routine healthcare services.",
            "I understand health information may be used and disclosed for treatment, payment, operations, and required reporting.",
            "I understand financial responsibility for amounts not paid by insurance and authorize claim-related information release.",
            "I understand communication may occur by phone, portal, mail, text, email, or automated reminder systems.",
            "I know I may ask questions, request an interpreter, refuse non-emergency care, or seek more information before signing.",
        ],
    },
    {
        "filename": "imaging-consent-form.pdf",
        "title": "Diagnostic Imaging and Contrast Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "IMG-118",
        "rev_date": "04/2026",
        "patient": common_patient,
        "sections": [
            ("Imaging Studies Authorized", [
                "I authorize the imaging team to perform the diagnostic study or studies ordered by my clinician, including any of the following modalities as indicated: plain film radiography (X-ray), computed tomography (CT), magnetic resonance imaging (MRI), ultrasound, fluoroscopy, mammography, bone density (DEXA), nuclear medicine, and positron emission tomography (PET).",
                "I understand that the technologist or radiologist may modify the technique or imaging protocol, take additional views, or request a delayed series if needed to obtain diagnostic-quality images, and that some studies may take longer than initially scheduled.",
                ("initial", "I have been informed of the modality and approximate duration of the imaging study scheduled today."),
            ]),
            ("Ionizing Radiation Disclosure", [
                "Studies that use ionizing radiation (X-ray, CT, fluoroscopy, mammography, nuclear medicine, PET) deliver a measurable dose of radiation. Radiation dose is balanced against the diagnostic benefit of the study, and the imaging team follows As-Low-As-Reasonably-Achievable (ALARA) principles.",
                ("clauses", [
                    ("A", "Cumulative exposure", "Repeated imaging over a lifetime adds to cumulative radiation exposure. I have been encouraged to share prior imaging history with my care team so that unnecessary repeat studies can be avoided when clinically appropriate."),
                    ("B", "Pregnancy and reproductive considerations", "Ionizing radiation may pose risks to a developing fetus. I have been asked, if applicable, whether I am pregnant, may be pregnant, or am breastfeeding, and I understand that I should disclose any change in pregnancy status before the study begins."),
                    ("C", "Pediatric considerations", "Children are more radiation-sensitive than adults. Pediatric imaging protocols are weight-based and use the lowest dose consistent with diagnostic image quality, and a parent or guardian may be asked to remain in the room during the study."),
                ]),
                ("initial", "If applicable, I have disclosed my pregnancy status before the study begins."),
            ]),
            ("Contrast Media", [
                "Some studies require iodinated contrast (CT), gadolinium-based contrast (MRI), microbubble contrast (ultrasound), or oral contrast. Contrast improves image quality and supports more accurate diagnosis but introduces additional risks.",
                ("subform", {
                    "title": "Contrast Media Sub-Consent",
                    "body": [
                        "Iodinated contrast risks include warmth, metallic taste, nausea, hives, bronchospasm, severe allergic reaction (anaphylaxis), extravasation at the injection site, and contrast-associated kidney injury, particularly in patients with reduced kidney function, dehydration, multiple myeloma, or certain medications including metformin.",
                        "Gadolinium-based contrast agents are generally well tolerated. Rare risks include allergic reaction, gadolinium retention in tissues, and, in patients with severe kidney impairment, nephrogenic systemic fibrosis. The radiologist may select a lower-risk macrocyclic agent based on kidney function.",
                        "Pre-medication with steroids and antihistamines may be recommended for patients with prior contrast reactions. Pre-medication reduces but does not eliminate the risk of repeat reaction.",
                    ],
                    "ack": [
                        "I have disclosed any prior contrast reaction, asthma, kidney disease, diabetes, metformin use, hyperthyroidism, sickle cell disease, or pregnancy.",
                        "I understand that intravenous access will be placed and that extravasation, although uncommon, may cause swelling, pain, blistering, or skin injury.",
                        "I authorize the team to administer pre-medication or to substitute an alternative contrast agent if I am at elevated risk of reaction.",
                    ],
                    "sig_line": True,
                }),
            ]),
            ("MRI Safety Screening", [
                "MRI uses a strong magnetic field and radio waves; it does not use ionizing radiation. The magnetic field can interact with metallic implants, electronic devices, and conductive materials.",
                "I confirm that I have completed an MRI safety screening, removed magnetic and conductive items from my person, and disclosed any pacemaker, defibrillator, neurostimulator, cochlear implant, drug pump, aneurysm clip, metallic foreign body, recent surgery, or implanted hardware. I will inform the technologist if I feel heat, tingling, or pain at any time during the scan.",
            ]),
            ("Results, Records, and Privacy", [
                "Final image interpretation is performed by a radiologist and may not be available immediately after the study. Preliminary technologist comments are not a final diagnosis and should not be acted on as one.",
                ("fine_print", [
                    "Imaging studies, written reports, and incidental findings are part of the medical record and may be released to my treating clinicians, referring providers, insurers, and other parties as authorized by law or in the facility's Notice of Privacy Practices.",
                    "De-identified images and reports may be used internally for quality review, peer review, technologist training, and protocol optimization. External research use of identifiable imaging requires separate written authorization.",
                    "Images are stored in the picture archiving and communication system (PACS) for the period required by applicable retention laws. Copies of images and reports may be requested through Medical Records, which may charge a reasonable fee for fulfillment.",
                ]),
            ]),
        ],
        "checklist": [
            "I authorize the ordered imaging study and understand the modality, approximate duration, and general purpose.",
            "I understand ionizing radiation considerations and have disclosed pregnancy status if applicable.",
            "I have disclosed allergies, prior contrast reactions, kidney status, and implanted devices that affect MRI safety.",
            "I understand contrast media risks, including rare severe allergic reactions and contrast-associated kidney injury.",
            "I understand image storage, sharing, and use of de-identified records for quality review and training.",
        ],
    },
    {
        "filename": "telehealth-consent-form.pdf",
        "title": "Telehealth Services Consent Form",
        "subtitle": "Fictional comprehensive sample for TrueConsent upload and explanation demos",
        "form_num": "TEL-077",
        "rev_date": "04/2026",
        "patient": common_patient,
        "sections": [
            ("Nature of Telehealth Services", [
                "I consent to receive healthcare services delivered through telehealth, which may include video visits, audio-only telephone consultations, secure messaging, store-and-forward image or document review, and remote patient monitoring devices.",
                ("clauses", [
                    ("A", "Equivalence to in-person care", "Telehealth visits may be used in place of, or in addition to, in-person visits. Some clinical questions cannot be answered over telehealth and may require an in-person evaluation, examination, or testing."),
                    ("B", "Clinician identification", "The treating clinician will identify themselves at the start of each visit. I understand additional staff (nurse, scribe, supervising physician, interpreter) may join with my consent."),
                    ("C", "Right to refuse or end a visit", "I may decline a telehealth visit, request an in-person visit instead, or end a telehealth visit at any time without affecting my future right to care, subject to applicable scheduling and payment terms."),
                ]),
            ]),
            ("Connection, Quality, and Failure", [
                "Telehealth depends on functioning hardware, software, and a stable internet or telephone connection. Connection problems may degrade audio or video quality, freeze or interrupt the visit, or prevent the visit from completing.",
                ("subform", {
                    "title": "Connection-Failure and Fallback Plan",
                    "body": [
                        "If the video connection fails, the clinician will attempt to reconnect twice. If reconnection is unsuccessful, the clinician will call the patient on the phone number on file to complete the visit by audio, where clinically appropriate, or to reschedule the visit at no additional charge.",
                        "If audio cannot be re-established and the clinical situation may be urgent, the clinician will follow the facility's escalation protocol, which may include calling emergency contacts, contacting local emergency services, or requesting an in-person evaluation.",
                        "Visits that cannot be completed due to a connection failure will be documented in the medical record. A new visit will be scheduled if the clinical question was not resolved.",
                    ],
                    "ack": [
                        "I confirm the call-back phone number on file is current and reachable during scheduled telehealth visits.",
                        "I understand that audio-only fallback may not be appropriate for every clinical question, and the clinician may end the visit and reschedule.",
                        "I understand that, in an emergency, I should call local emergency services rather than waiting for a telehealth callback.",
                    ],
                    "sig_line": False,
                }),
                ("initial", "I have reviewed the connection-failure plan and the emergency-services language above."),
            ]),
            ("Privacy, Recording, and Cross-Jurisdictional Care", [
                "Telehealth visits use platforms that are intended to protect health information. No transmission method is perfectly secure. The facility uses encryption, access controls, and audit logs to reduce risk.",
                ("clauses", [
                    ("A", "Recording", "The clinician may record portions of the visit (audio, video, screen, chat) for documentation, quality, or care-coordination purposes only with my consent. I will not record the visit without the clinician's consent."),
                    ("B", "Privacy at the patient location", "I am responsible for participating from a private space and for managing who is present at my end of the call. The clinician may pause the visit if privacy or safety concerns are observed at my location."),
                    ("C", "Cross-state licensure", "Clinicians may only provide care in states or jurisdictions where they are licensed. If I travel during ongoing care, I must inform the office, which may need to reschedule, transfer care, or limit the scope of telehealth services."),
                ]),
            ]),
            ("Prescribing, Referrals, and Lab Orders", [
                "Telehealth clinicians may evaluate, diagnose, prescribe medications, order lab or imaging studies, and refer to other clinicians, subject to clinical appropriateness and applicable law. Some medications, including certain controlled substances, may require an in-person visit before they can be prescribed.",
                "Lab and imaging orders may be sent to a facility convenient to me. I understand that I am responsible for completing ordered tests and following up on the results in the manner described by the clinician.",
            ]),
            ("Billing and Insurance", [
                "Coverage for telehealth services varies by insurer and plan. Some payers require modality-specific coding (video vs. audio-only) and may not cover all telehealth services.",
                ("fine_print", [
                    "I am financially responsible for charges not paid by my insurance, including deductibles, co-payments, co-insurance, non-covered telehealth services, missed-appointment fees when applicable, and balances denied by my plan after appeal.",
                    "Authorization or pre-certification, if required by my plan, is my responsibility unless I have separately delegated this to the facility. Failure to obtain required authorization may result in full out-of-pocket charges.",
                    "If I am traveling or temporarily located outside my normal coverage area, my plan may apply out-of-network rules to telehealth services, and balance billing may apply. I will inform the office before a scheduled telehealth visit if I will be out of my home state.",
                ]),
            ]),
        ],
        "checklist": [
            "I consent to receive healthcare services through telehealth and understand its limits.",
            "I have reviewed the connection-failure plan and understand the emergency-services language.",
            "I will not record the telehealth visit and understand recording by the clinician requires my consent.",
            "I understand cross-state licensure and that I must notify the office when I am traveling during care.",
            "I understand telehealth coverage varies by payer and that I am responsible for non-covered charges.",
        ],
    },
]


for form in FORMS:
    build(form)


print(f"Generated PDFs in {OUT}")
