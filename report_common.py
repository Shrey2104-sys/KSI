import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# ==============================================================================
# COLOR PALETTE (Official iGOT Karmayogi Bharat Theme)
# ==============================================================================
C_NAVY        = colors.HexColor("#0f172a") # Deep institutional slate
C_ROYAL_BLUE  = colors.HexColor("#1d5ba5") # Official iGOT Royal Blue
C_SAFFRON     = colors.HexColor("#f58220") # Official Karmayogi Saffron
C_SAFFRON_DK  = colors.HexColor("#d96b10") # Darker saffron for text contrast
C_EMERALD     = colors.HexColor("#10b981") # Success / verified green
C_EMERALD_BG  = colors.HexColor("#ecfdf5") # Pastel emerald
C_ROSE        = colors.HexColor("#e11d48") # Critical deficit / alert
C_ROSE_BG     = colors.HexColor("#fff1f2") # Pastel rose
C_PURPLE      = colors.HexColor("#6366f1") # Level 3 Procedural / AI accent
C_CANVAS_BG   = colors.HexColor("#fdf8f3") # Warm cream / parchment
C_CARD_BG     = colors.HexColor("#f8fafc") # Clean slate card surface
C_BORDER_SOFT = colors.HexColor("#e2d7cc") # Warm soft border
C_TEXT_DARK   = colors.HexColor("#1e293b") # High contrast body text
C_TEXT_MUTED  = colors.HexColor("#64748b") # Secondary metadata text
C_WHITE       = colors.HexColor("#ffffff")
C_CODE_BG     = colors.HexColor("#1e293b") # Dark code block surface

# ==============================================================================
# NUMBERED CANVAS WITH HEADER & FOOTER
# ==============================================================================
class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that dynamically counts total pages and draws running headers
    and footers with official Ministry & Team CodeVanta branding.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        page_w, page_h = letter
        
        # Don't draw top header on cover / page 1
        if self._pageNumber > 1:
            # Top Running Header Bar
            self.setFillColor(C_ROYAL_BLUE)
            self.rect(36, page_h - 28, page_w - 72, 1.5, fill=True, stroke=False)
            
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(C_ROYAL_BLUE)
            self.drawString(36, page_h - 22, "KARMAYOGI STATISTICAL INTELLIGENCE (KSI)  |  MoSPI SIH26101")
            
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(C_SAFFRON_DK)
            self.drawRightString(page_w - 36, page_h - 22, "MISSION KARMAYOGI BHARAT")

        # Bottom Running Footer Bar (All pages)
        self.setFillColor(C_BORDER_SOFT)
        self.rect(36, 32, page_w - 72, 1.0, fill=True, stroke=False)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(C_TEXT_MUTED)
        self.drawString(36, 20, "Government of India - Ministry of Statistics and Programme Implementation (MoSPI)")

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(C_SAFFRON_DK)
        self.drawRightString(page_w - 36, 20, f"Team CodeVanta  |  Page {self._pageNumber} of {total_pages}")
        
        self.restoreState()


# ==============================================================================
# TYPOGRAPHY & STYLES GENERATOR
# ==============================================================================
def create_report_styles():
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=C_ROYAL_BLUE,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=C_SAFFRON_DK,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=C_ROYAL_BLUE,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=C_NAVY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=C_TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=C_TEXT_DARK
    )

    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#38bdf8") # Light blue code text
    )

    badge_style = ParagraphStyle(
        'BadgeText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=C_WHITE,
        alignment=1 # Center
    )

    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'h1': h1_style,
        'h2': h2_style,
        'body': body_style,
        'bullet': bullet_style,
        'callout': callout_style,
        'code': code_style,
        'badge': badge_style
    }

# ==============================================================================
# UI HELPER: COLORED CALLOUT BOXES
# ==============================================================================
def make_callout(title_text, body_text, accent_color=C_ROYAL_BLUE, bg_color=C_CARD_BG, icon=">>>"):
    """
    Creates a colorful rounded callout box (e.g. 'ELI20', 'Pro-Tip', 'Statutory Mandate')
    """
    prefix = f"{icon} " if icon else ""
    p_title = Paragraph(f"<b>{prefix}{title_text.upper()}</b>", ParagraphStyle(
        'CTitle', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=accent_color
    ))
    p_body = Paragraph(body_text, ParagraphStyle(
        'CBody', fontName='Helvetica', fontSize=8.8, leading=12.5, textColor=C_TEXT_DARK
    ))
    
    t = Table([[p_title], [p_body]], colWidths=[540])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('BOX', (0, 0), (-1, -1), 1.2, accent_color),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t

def make_code_box(code_text, title="CODE SNIPPET"):
    """
    Creates a dark terminal-style code snippet block
    """
    header_p = Paragraph(f"<b>[CODE] {title}</b>", ParagraphStyle(
        'CodeH', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=C_SAFFRON
    ))
    clean_code = code_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    code_p = Paragraph(clean_code.replace("\n", "<br/>").replace(" ", "&nbsp;"), ParagraphStyle(
        'CodeB', fontName='Courier', fontSize=7.2, leading=9.8, textColor=colors.HexColor("#38bdf8")
    ))
    t = Table([[header_p], [code_p]], colWidths=[540])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_CODE_BG),
        ('BOX', (0, 0), (-1, -1), 1.0, C_SAFFRON),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t

print("[SUCCESS] ReportLab shared infrastructure loaded.")
