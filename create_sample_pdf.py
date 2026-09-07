"""
Utility script to generate a clean, vector-searchable statistical compendium PDF
for MoSPI Subordinate Statistical Service & Karmayogi Statistical Intelligence (KSI).
"""

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_compendium_pdf(output_filename: str = "MoSPI_NSSTA_Technical_Compendium_Sample.pdf"):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1d5ba5'),
        alignment=1, # Center
        spaceAfter=4,
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#f58220'),
        alignment=1, # Center
        spaceAfter=12,
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1d5ba5'),
        spaceBefore=10,
        spaceAfter=4,
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6,
    )
    
    story = []
    
    # Header & Titles
    story.append(Paragraph("MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)", title_style))
    story.append(Paragraph("NATIONAL STATISTICAL SYSTEMS TRAINING ACADEMY (NSSTA) & CENTRAL STATISTICS OFFICE", subtitle_style))
    story.append(Paragraph("<b>STATUTORY TECHNICAL COMPENDIUM ON STATISTICAL METHODOLOGIES & FIDUCIARY NORMS</b>", ParagraphStyle('SubSub', parent=subtitle_style, textColor=colors.HexColor('#334155'), fontSize=9)))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1d5ba5'), spaceAfter=10, spaceBefore=4))
    
    # Section 1: SNA 2008 & GVA
    story.append(Paragraph("1. System of National Accounts (SNA 2008): GVA at Basic Prices vs. Factor Cost", heading_style))
    story.append(Paragraph(
        "Under the System of National Accounts (SNA 2008) harmonized by the National Accounts Division (NAD) of MoSPI, "
        "Gross Value Added (GVA) at basic prices is defined as the total value of gross output produced by resident establishment "
        "units minus the value of intermediate consumption utilized in production. Basic prices measure the amount receivable by "
        "the producer from the purchaser for a unit of a good or service produced as output, minus any tax payable (product tax), "
        "plus any subsidy receivable on that unit as a consequence of its production or sale. It explicitly excludes any transport "
        "charges invoiced separately by the producer. In contrast to the legacy metric of GVA at Factor Cost used prior to the 2011-12 "
        "base year revision, GVA at basic prices incorporates production taxes less production subsidies (such as land revenues, "
        "stamp duties, and municipal taxes that are independent of physical output volume). GDP at market prices is subsequently "
        "derived from GVA at basic prices by adding net product taxes (product taxes minus product subsidies).",
        body_style
    ))
    
    # Section 2: PPI vs CPI
    story.append(Paragraph("2. Price Statistics Methodology: Producer Price Index (PPI) vs. Consumer Price Index (CPI)", heading_style))
    story.append(Paragraph(
        "The Price Statistics Division (PSD) compiles high-frequency price indices that serve distinct macroeconomic purposes. "
        "The Consumer Price Index (CPI) measures the average change over time in retail prices paid by final household consumers for "
        "a fixed basket of consumer goods and services (Base Year 2012 = 100), utilizing Laspeyres expenditure weights sourced from "
        "the Consumer Expenditure Survey (CES). Conversely, the Producer Price Index (PPI) evaluates price shifts from the perspective "
        "of the domestic seller/producer, measuring the average change in net selling prices received by producers for their output at the "
        "factory or farm gate, devoid of retail distribution markups, trade margins, and transport logistics. While CPI captures demand-side "
        "inflation and cost-of-living shocks, the PPI captures supply-side price pressures and cost-push inflation. In national accounts "
        "deflation, industry-specific PPI sub-indices serve as ideal output deflators to convert current price gross output into constant volume estimates.",
        body_style
    ))
    
    # Section 3: FOD Multi-Stage Sampling
    story.append(Paragraph("3. Survey Sampling Methodology: FOD Multi-Stage Stratified Design & Hamlet Formation", heading_style))
    story.append(Paragraph(
        "The Field Operations Division (FOD) administers nationwide socio-economic household surveys (e.g., Periodic Labour Force Survey - PLFS). "
        "The sampling framework employs a two-stage stratified sampling design. First Stage Units (FSUs) comprise Census villages in rural sectors "
        "and Urban Frame Survey (UFS) blocks in urban sectors. Ultimate Stage Units (USUs) are resident households. To control field investigation "
        "workload and minimize clustering design effects in large FSUs, hamlet-group formation (rural) and sub-block formation (urban) is mandatory "
        "whenever the estimated population of an FSU reaches or exceeds 1,200 persons (approximately 300 households). The supervisor divides the "
        "entire FSU into mutually exclusive, geographically contiguous segments with identifiable natural boundaries of roughly equal population sizes. "
        "Two hamlet-groups/sub-blocks are then selected using Simple Random Sampling Without Replacement (SRSWOR), and sampling weights are calibrated "
        "to preserve unbiased Horvitz-Thompson Horvitz estimators.",
        body_style
    ))
    
    # Section 4: Section 8 DPDP Act 2023
    story.append(Paragraph("4. Digital Governance: Statutory Obligations of Data Fiduciaries under Section 8 of DPDP Act 2023", heading_style))
    story.append(Paragraph(
        "Under the Digital Personal Data Protection (DPDP) Act 2023, government statistical directorates and field formations act as statutory "
        "Data Fiduciaries when collecting socio-economic and demographic microdata. Under Section 8 of the Act, a Data Fiduciary is legally obligated "
        "to ensure the accuracy, completeness, and consistency of personal data whenever such data is used to make a decision that affects the data "
        "principal or is disclosed to another Data Fiduciary. Furthermore, Section 8(5) mandates that Data Fiduciaries must implement appropriate "
        "technical and organizational measures (including end-to-end cryptographic encryption, access control logs, and role-based custody) to prevent "
        "personal data breaches. Section 8(7) requires the mandatory erasure of personal data as soon as the specified purpose for which it was collected "
        "is no longer served, subject to statutory retention guidelines under the Collection of Statistics Act 2008.",
        body_style
    ))
    
    doc.build(story)
    print(f"Successfully generated clean vector-searchable PDF: {output_filename}")

if __name__ == "__main__":
    generate_compendium_pdf()
