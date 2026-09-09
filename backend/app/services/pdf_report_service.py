from __future__ import annotations

import json
import re
from datetime import datetime
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.schemas.standard import StandardDetail


PRIMARY = colors.HexColor("#2563eb")
DARK = colors.HexColor("#111827")
MUTED = colors.HexColor("#64748b")
LINE = colors.HexColor("#dbe3ef")
LIGHT = colors.HexColor("#f8fafc")
WHITE = colors.white


def _text(value: object, default: str = "-") -> str:
    if value is None or value == "":
        return default

    if isinstance(value, (list, tuple, dict)):
        value = json.dumps(value, ensure_ascii=False, indent=2)

    value = str(value)
    value = value.replace("\u2014", "-")
    value = value.replace("\u2013", "-")
    value = value.replace("\u2212", "-")
    return value


def _paragraph(value: object, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(_text(value)).replace("\n", "<br/>"), style)


def _list_text(values: object) -> list[str]:
    if not isinstance(values, list):
        return []

    result: list[str] = []
    for value in values:
        if isinstance(value, dict):
            for key in (
                "name",
                "title",
                "is_number",
                "standard",
                "id",
                "value",
            ):
                if value.get(key) not in (None, ""):
                    result.append(_text(value[key]))
                    break
            else:
                result.append(_text(value))
        else:
            result.append(_text(value))

    return [item for item in result if item.strip()]


def _date(value: str | None) -> str:
    return _text(value)


def _safe_filename(is_number: str) -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", is_number).strip("._")
    return name or "standard"


def _metadata_table(
    items: list[tuple[str, object]],
    label_style: ParagraphStyle,
    value_style: ParagraphStyle,
) -> Table:
    rows = []
    for label, value in items:
        rows.append(
            [
                Paragraph(escape(label), label_style),
                _paragraph(value, value_style),
            ]
        )

    table = Table(rows, colWidths=[48 * mm, 127 * mm], repeatRows=0)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def _section_title(
    title: str,
    section_style: ParagraphStyle,
) -> Paragraph:
    return Paragraph(escape(title), section_style)


def build_standard_pdf(standard: StandardDetail) -> tuple[bytes, str]:
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"BIS Standard Report - {standard.is_number}",
        author="BIS Standard Recommender",
        subject="BIS Standard Information Report",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=DARK,
        alignment=TA_LEFT,
        spaceAfter=5,
    )

    number_style = ParagraphStyle(
        "StandardNumber",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=PRIMARY,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=MUTED,
        spaceAfter=6,
    )

    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=14,
        textColor=DARK,
        spaceBefore=8,
        spaceAfter=6,
    )

    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=MUTED,
    )

    value_style = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=DARK,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=13,
        textColor=DARK,
        spaceAfter=5,
    )

    small_style = ParagraphStyle(
        "Small",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=11,
        textColor=MUTED,
    )

    requirement_style = ParagraphStyle(
        "Requirement",
        parent=body_style,
        leftIndent=8,
        firstLineIndent=-8,
    )

    story = []

    # Header
    story.append(Paragraph("BIS STANDARD INFORMATION REPORT", subtitle_style))
    story.append(Paragraph(escape(standard.is_number), number_style))
    story.append(Paragraph(escape(_text(standard.title)), title_style))

    if standard.short_title:
        story.append(
            Paragraph(
                f"Short title: {escape(_text(standard.short_title))}",
                subtitle_style,
            )
        )

    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY))
    story.append(Spacer(1, 5))

    # Overview
    story.append(_section_title("Overview", section_style))
    story.append(
        _metadata_table(
            [
                ("Status", standard.status),
                ("Department", standard.department_name or standard.department),
                ("Department Alias", standard.department_alias),
                ("Aspect", standard.aspect),
                ("Domain", standard.domain),
                ("Year", standard.year),
                ("Language", standard.language),
            ],
            label_style,
            value_style,
        )
    )

    # Classification
    story.append(_section_title("Classification", section_style))
    story.append(
        _metadata_table(
            [
                ("Group Classification", standard.group_classification),
                ("Group", standard.group),
                ("Sub Group", standard.sub_group),
                ("Sub Sub Group", standard.sub_sub_group),
            ],
            label_style,
            value_style,
        )
    )

    # Publication and revision
    story.append(_section_title("Publication, Validity & Revision", section_style))
    story.append(
        _metadata_table(
            [
                ("Published On", _date(standard.published_on)),
                ("Valid Upto", _date(standard.valid_upto)),
                ("Review On", _date(standard.review_on)),
                ("Reaffirmation Year", standard.reaffirmation_year),
                ("No. of Revision", standard.no_of_revision),
                ("Amendment Count", standard.amendment_count),
                ("Latest Version", standard.latest_version),
                ("Standard Base", standard.standard_base),
            ],
            label_style,
            value_style,
        )
    )

    # Technical and organization
    story.append(_section_title("Technical & Organization", section_style))
    story.append(
        _metadata_table(
            [
                ("ICS Code", standard.ics_code),
                ("Degree of Equivalence", standard.degree_of_equivalence),
                ("Ministry", standard.ministry),
                ("Committee", standard.committee_name),
                ("Member Secretary", standard.member_secretary),
                ("Certification", standard.certification),
                ("QCO Gazette", standard.has_qco_gazette),
            ],
            label_style,
            value_style,
        )
    )

    # Description
    if standard.description:
        story.append(_section_title("Description", section_style))
        story.append(_paragraph(standard.description, body_style))

    # Scope
    if standard.scope:
        story.append(_section_title("Scope", section_style))
        story.append(_paragraph(standard.scope, body_style))

    # Requirements
    requirements = standard.requirements or []
    if requirements:
        story.append(_section_title("Requirements", section_style))
        for index, requirement in enumerate(requirements, start=1):
            story.append(
                Paragraph(
                    f"<b>{index}.</b> {escape(_text(requirement))}",
                    requirement_style,
                )
            )

    # Keywords
    keywords = standard.keywords or []
    if keywords:
        story.append(_section_title("Keywords", section_style))
        story.append(_paragraph(", ".join(keywords), body_style))

    # SDG
    sdg_goals = _list_text(standard.sdg_goals)
    if sdg_goals:
        story.append(_section_title("SDG Goals", section_style))
        story.append(_paragraph(", ".join(sdg_goals), body_style))

    # References
    reference_groups = [
        ("Cross References", _list_text(standard.cross_references)),
        ("Referenced By", _list_text(standard.referenced_by)),
        ("Supersedes", _list_text(standard.supersedes)),
        ("Superseded By", _list_text(standard.superseded_by)),
    ]

    if any(values for _, values in reference_groups):
        story.append(_section_title("References & Relationships", section_style))
        for label, values in reference_groups:
            if values:
                story.append(
                    Paragraph(f"<b>{escape(label)}</b>", value_style)
                )
                story.append(_paragraph("; ".join(values), body_style))

    # Hindi / i18n
    if standard.title_hi or standard.scope_hi or standard.requirements_hi:
        story.append(_section_title("Hindi / Internationalization", section_style))

        if standard.title_hi:
            story.append(Paragraph("<b>Hindi Title</b>", value_style))
            story.append(_paragraph(standard.title_hi, body_style))

        if standard.scope_hi:
            story.append(Paragraph("<b>Hindi Scope</b>", value_style))
            story.append(_paragraph(standard.scope_hi, body_style))

        hindi_requirements = _list_text(standard.requirements_hi)
        if hindi_requirements:
            story.append(Paragraph("<b>Hindi Requirements</b>", value_style))
            story.append(_paragraph("; ".join(hindi_requirements), body_style))

    # Source
    story.append(_section_title("Source Information", section_style))
    story.append(
        _metadata_table(
            [
                ("Source Standard ID", standard.source_standard_id),
                ("Source Standard Enc ID", standard.source_standard_enc_id),
                ("Source Department ID", standard.source_department_id),
                ("Source Committee ID", standard.source_committee_id),
                ("Raw IS Status", standard.raw_is_status),
            ],
            label_style,
            value_style,
        )
    )

    # Related standards
    if standard.related_standards:
        story.append(_section_title("Related Standards", section_style))
        related_rows = [
            [
                Paragraph("IS Number", label_style),
                Paragraph("Title", label_style),
                Paragraph("Status", label_style),
                Paragraph("Relationship", label_style),
            ]
        ]

        for related in standard.related_standards:
            related_rows.append(
                [
                    _paragraph(related.is_number, value_style),
                    _paragraph(related.title, value_style),
                    _paragraph(related.status, value_style),
                    _paragraph(related.relationship_type, value_style),
                ]
            )

        related_table = Table(
            related_rows,
            colWidths=[30 * mm, 88 * mm, 27 * mm, 30 * mm],
            repeatRows=1,
        )
        related_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                    ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(related_table)

    # Footer callback
    generated = datetime.now().strftime("%d %b %Y %H:%M")

    def draw_footer(canvas, _doc):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.line(20 * mm, 12 * mm, 190 * mm, 12 * mm)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(
            20 * mm,
            7 * mm,
            f"BIS Standard Recommender | Generated {generated}",
        )
        canvas.drawRightString(
            190 * mm,
            7 * mm,
            f"Page {canvas.getPageNumber()}",
        )
        canvas.restoreState()

    doc.build(
        story,
        onFirstPage=draw_footer,
        onLaterPages=draw_footer,
    )

    filename = f"BIS_Standard_Report_{_safe_filename(standard.is_number)}.pdf"
    return buffer.getvalue(), filename
