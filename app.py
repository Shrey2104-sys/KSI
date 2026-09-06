"""
Karmayogi Statistical Intelligence (KSI) - Presentation Layer
Ministry of Statistics and Programme Implementation (MoSPI) | SIH26101

Three Functional Views:
1. Officer Competency Matrix & iGOT Recommender
2. Statutory Circular MCQ Synthesizer (PyMuPDF)
3. Cadre Admin Analytics & Heatmap
"""

from __future__ import annotations

import streamlit as st
import pandas as pd
from streamlit_echarts import st_echarts

import db
import engine
from models import OfficerProfile, iGOTCourse, SynthesizedMCQ, BLOOM_LEVELS

# ==============================================================================
# 1. UI CONFIGURATION & DARK-FRIENDLY STYLING
# ==============================================================================

st.set_page_config(
    page_title="Karmayogi Statistical Intelligence | MoSPI",
    page_icon="🇮🇳",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom dark-friendly modern styling
st.markdown(
    """
    <style>
    /* Metric Card Styling */
    div[data-testid="stMetric"] {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85));
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 10px;
        padding: 16px 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    div[data-testid="stMetric"] label {
        color: #94a3b8 !important;
        font-weight: 600;
        font-size: 0.88rem;
    }
    div[data-testid="stMetric"] div[data-testid="stMetricValue"] {
        color: #f8fafc !important;
        font-weight: 700;
        font-size: 1.75rem;
    }

    /* Course & MCQ Cards */
    .ksi-card {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7));
        border: 1px solid rgba(100, 116, 139, 0.25);
        border-radius: 10px;
        padding: 18px;
        margin-bottom: 16px;
        transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .ksi-card:hover {
        border-color: rgba(56, 189, 248, 0.5);
        transform: translateY(-2px);
    }

    /* Badges */
    .badge-recall {
        background-color: rgba(16, 185, 129, 0.2);
        color: #34d399;
        border: 1px solid #059669;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .badge-conceptual {
        background-color: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        border: 1px solid #2563eb;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .badge-procedural {
        background-color: rgba(139, 92, 246, 0.2);
        color: #a78bfa;
        border: 1px solid #7c3aed;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .badge-generic {
        background-color: rgba(148, 163, 184, 0.15);
        color: #cbd5e1;
        border: 1px solid #475569;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    /* Header Accent */
    .header-accent {
        color: #38bdf8;
        font-weight: 800;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Sidebar Navigation
with st.sidebar:
    st.image("https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg", width=64)
    st.title("🇮🇳 MoSPI KSI")
    st.caption("Karmayogi Statistical Intelligence\nSIH26101 • Subordinate Statistical Service")
    st.markdown("---")

    nav_choice = st.radio(
        "Navigation",
        [
            "Officer Competency Matrix & iGOT Recommender",
            "Statutory Circular MCQ Synthesizer (PyMuPDF)",
            "Cadre Admin Analytics & Heatmap",
        ],
        index=0,
    )

    st.markdown("---")
    st.markdown(
        """
        <div style='font-size: 0.8rem; color: #94a3b8; line-height: 1.4;'>
        <b>Operational Standards:</b><br>
        • NSSTA / MoSPI Curriculum<br>
        • SNA 2008 & GCF Accounting<br>
        • DPDP Act 2023 Compliance<br>
        • Local Ollama: <code>qwen2.5:7b</code>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ==============================================================================
# VIEW 1: COMPETENCY MATRIX & iGOT RECOMMENDER
# ==============================================================================

if nav_choice == "Officer Competency Matrix & iGOT Recommender":
    st.title("🎯 Officer Competency Matrix & iGOT Recommender")
    st.markdown("Multi-dimensional vector assessment of statistical competencies and prioritized learning paths.")

    # 1. Load Officer Record & Cold-Start State Seeding
    officer = db.get_officer("ISS-2026-9042")
    if officer is None:
        db.init_db()
        officer = db.get_officer("ISS-2026-9042")

    # COLD-START SEEDING: Before declaring slider widgets
    if "officer_scores" not in st.session_state:
        st.session_state["officer_scores"] = dict(officer.scores if officer else {})

    # Officer Cadre Header Information
    st.markdown(
        f"""
        <div class="ksi-card" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div>
                    <h3 style="margin: 0; color: #f8fafc;">{officer.name}</h3>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 0.9rem;">
                        <b>Officer ID:</b> <code>{officer.officer_id}</code> | 
                        <b>Cadre:</b> {officer.cadre} | 
                        <b>Designation:</b> {officer.designation} | 
                        <b>Division:</b> {officer.division}
                    </p>
                </div>
                <div>
                    <span class="badge-generic">Enrolled Courses: {len(officer.completed_courses)}</span>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 2. Target Role Selectbox
    top_col1, top_col2 = st.columns([1, 1])
    with top_col1:
        target_role = st.selectbox(
            "Select Target Cadre Role / Benchmark",
            [
                "Senior Statistical Officer (SSO)",
                "Junior Statistical Officer (JSO)",
                "Assistant Director (NAD / FOD)",
            ],
            index=0,
        )
    with top_col2:
        st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
        st.info(f"Targeting competency thresholds for **{target_role}** across official MoSPI domains.")

    benchmarks = db.get_role_benchmark(target_role)

    # 3. Administrative Dossier Ingestion Expander
    with st.expander("📄 Administrative Dossier Ingestion (Automated Profile Inference)", expanded=False):
        st.markdown(
            "Paste an official confidential administrative cadre dossier below. "
            "The localized Ollama engine parses qualifications, field experience, and identified gaps to infer calibrated domain scores."
        )
        dossier_text = st.text_area(
            "Confidential Cadre Dossier Content",
            value=db.DEFAULT_OFFICER_DOSSIER,
            height=180,
            key="dossier_input_area",
        )
        if st.button("Auto-Infer Competency Profile via Local LLM", type="secondary"):
            with st.spinner("Analyzing administrative dossier via local Ollama LLM..."):
                inferred = engine.infer_competency_from_dossier(dossier_text)
                st.session_state["officer_scores"] = inferred
                for d, val in inferred.items():
                    st.session_state[f"slider_{d}"] = val
                st.toast("Dossier parsed! Competency scores updated.", icon="🎯")
                st.rerun()

    # Layout: Left Column (Sliders + Radar) & Right Column (iGOT Courses)
    col_left, col_right = st.columns([1, 1], gap="large")

    with col_left:
        st.subheader("⚙️ Calibrated Competency Vector")

        # Interactive Sliders for the 4 Statutory Domains
        for domain in db.DOMAINS:
            current_val = st.session_state["officer_scores"].get(domain, 50)
            val = st.slider(
                domain,
                min_value=0,
                max_value=100,
                value=current_val,
                key=f"slider_{domain}",
            )
            st.session_state["officer_scores"][domain] = val

        # Explicit Persist Button (Zero Write-Hammering)
        if st.button("💾 Persist Calibrated Scores", type="primary", use_container_width=True):
            db.update_officer_scores("ISS-2026-9042", st.session_state["officer_scores"])
            st.toast("Scores persisted to SQLite disk.", icon="💾")
            st.success("Competency scores successfully committed to persistent SQLite disk (`ksi_master.db`).")

        # Vector Gap Math
        gap_matrix, l2, recs = engine.calculate_vector_competency_gap(
            st.session_state["officer_scores"],
            benchmarks,
        )

        st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)
        st.metric(
            label="Aggregate L2 Competency Deficit",
            value=f"{l2:.2f}",
            delta=f"-{l2:.2f} pts from benchmark" if l2 > 0 else "Benchmark Attained",
            delta_color="inverse" if l2 > 0 else "normal",
        )

        # Radar Chart comparing Officer vs Benchmark
        st.markdown("#### 📡 Multi-Dimensional Competency Radar")
        radar_options = {
            "title": {
                "text": f"Vector Gap vs {target_role}",
                "textStyle": {"color": "#cbd5e1", "fontSize": 13, "fontWeight": "normal"},
            },
            "tooltip": {"trigger": "item"},
            "legend": {
                "data": ["Current Competency Vector", "Target Cadre Benchmark"],
                "textStyle": {"color": "#94a3b8"},
                "bottom": 0,
            },
            "radar": {
                "indicator": [
                    {"name": "Statistical Theory & NA", "max": 100},
                    {"name": "Technical Tools (Python/R)", "max": 100},
                    {"name": "Digital Governance & Privacy", "max": 100},
                    {"name": "Managerial Decision Making", "max": 100},
                ],
                "splitArea": {
                    "show": True,
                    "areaStyle": {"color": ["rgba(30, 41, 59, 0.7)", "rgba(15, 23, 42, 0.7)"]},
                },
                "axisLine": {"lineStyle": {"color": "#475569"}},
                "splitLine": {"lineStyle": {"color": "#334155"}},
            },
            "series": [
                {
                    "name": "Competency Profile",
                    "type": "radar",
                    "data": [
                        {
                            "value": [st.session_state["officer_scores"].get(d, 0) for d in db.DOMAINS],
                            "name": "Current Competency Vector",
                            "itemStyle": {"color": "#38bdf8"},
                            "areaStyle": {"opacity": 0.35, "color": "#38bdf8"},
                        },
                        {
                            "value": [benchmarks.get(d, 0) for d in db.DOMAINS],
                            "name": "Target Cadre Benchmark",
                            "itemStyle": {"color": "#f87171"},
                            "areaStyle": {"opacity": 0.25, "color": "#f87171"},
                        },
                    ],
                }
            ],
        }
        st_echarts(options=radar_options, height="380px")

    with col_right:
        st.subheader("📚 Prioritized iGOT Karmayogi Courses")
        st.markdown(
            "Courses prioritized descending by domain deficit to bridge the officer's highest operational bottlenecks."
        )

        current_officer_fresh = db.get_officer("ISS-2026-9042")
        completed_set = set(current_officer_fresh.completed_courses if current_officer_fresh else [])

        if not recs:
            st.success("🎉 **Benchmark Attained:** Officer meets or exceeds all competency standards for this target role!")
        else:
            for rec in recs:
                cid = rec["course_id"]
                ctitle = rec["title"]
                cdomain = rec["domain"]
                cprovider = rec["provider"]
                cduration = rec["duration_hours"]
                clevel = rec["level"]
                cgain = rec["competency_gain"]
                cdeficit = rec["domain_deficit"]
                is_enrolled = cid in completed_set

                with st.container():
                    st.markdown(
                        f"""
                        <div class="ksi-card">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <span class="badge-generic" style="color: #38bdf8; border-color: #0284c7;">{cid}</span>
                                <span class="badge-generic" style="color: #f87171; border-color: #ef4444;">Deficit: -{cdeficit} pts</span>
                            </div>
                            <h4 style="margin: 10px 0 6px 0; color: #f8fafc;">{ctitle}</h4>
                            <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #94a3b8;">
                                <b>Domain:</b> {cdomain}<br>
                                <b>Provider:</b> {cprovider} • <b>Duration:</b> {cduration} hrs • <b>Level:</b> {clevel}
                            </p>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                                <span class="badge-generic" style="color: #34d399; border-color: #10b981;">Target Gain: +{cgain} pts</span>
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                    if is_enrolled:
                        st.button(f"✅ Enrolled in {cid}", key=f"btn_{cid}", disabled=True)
                    else:
                        if st.button(f"Enroll via iGOT Course Catalog", key=f"btn_{cid}"):
                            db.enroll_officer_course("ISS-2026-9042", cid)
                            st.toast(f"Successfully enrolled in {cid}!", icon="🎓")
                            st.success(f"Enrolled in {ctitle} ({cid}) on iGOT Karmayogi.")
                            st.rerun()


# ==============================================================================
# VIEW 2: STATUTORY CIRCULAR MCQ SYNTHESIZER
# ==============================================================================

elif nav_choice == "Statutory Circular MCQ Synthesizer (PyMuPDF)":
    st.title("📜 Statutory Circular MCQ Synthesizer (PyMuPDF)")
    st.markdown(
        "Ingest gazette notifications, survey manuals, and statutory circulars. "
        "The engine parses the document with PyMuPDF and synthesizes deduplicated psychometric MCQs across Bloom's Taxonomy."
    )

    # Multi-modal Ingestion: File Uploader or Fallback Sample Manual
    up_col1, up_col2 = st.columns([1, 1])
    with up_col1:
        uploaded_file = st.file_uploader(
            "Upload Statutory Circular / Gazette PDF",
            type=["pdf"],
            help="Extracts clean text using PyMuPDF and collapses redundant whitespace.",
        )

    doc_text: str = ""
    if uploaded_file is not None:
        try:
            pdf_bytes = uploaded_file.read()
            extracted = engine.extract_text_from_pdf(pdf_bytes)
            st.success(f"Extracted {len(extracted)} characters from **{uploaded_file.name}** via PyMuPDF.")
            doc_text = extracted
        except Exception as e:
            st.error(f"Error reading PDF file: {e}")
            doc_text = db.SAMPLE_STATISTICAL_MANUAL
    else:
        with up_col2:
            st.info("💡 No PDF uploaded. Preloaded with authentic MoSPI NSSTA Technical Compendium.")
        doc_text = db.SAMPLE_STATISTICAL_MANUAL

    source_text = st.text_area(
        "Document Text Content (Ingested / Verified Manual)",
        value=doc_text,
        height=220,
    )

    # Synthesize Button
    if st.button("Synthesize Bloom-Tiered Evaluation (Local LLM)", type="primary"):
        with st.spinner("Synthesizing psychometric MCQs mapped to Bloom's tiers via local Ollama..."):
            questions = engine.synthesize_mcqs_from_document(source_text)
            st.session_state["synthesized_mcqs"] = questions
            st.toast(f"Synthesized {len(questions)} evaluation items!", icon="📝")

    st.markdown("---")
    st.subheader("📝 Synthesized Psychometric Assessment")

    mcq_list = st.session_state.get("synthesized_mcqs", [])
    if not mcq_list:
        st.info("Click **'Synthesize Bloom-Tiered Evaluation (Local LLM)'** above to generate interactive questions.")
    else:
        for idx, q in enumerate(mcq_list, start=1):
            # Badge style selection based on Bloom's level
            bloom = q.bloom_level
            if "recall" in bloom.lower() or "level 1" in bloom.lower():
                badge_html = f'<span class="badge-recall">{bloom}</span>'
            elif "concept" in bloom.lower() or "level 2" in bloom.lower():
                badge_html = f'<span class="badge-conceptual">{bloom}</span>'
            else:
                badge_html = f'<span class="badge-procedural">{bloom}</span>'

            with st.container():
                st.markdown(
                    f"""
                    <div class="ksi-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span class="badge-generic">{q.question_id}</span>
                            {badge_html}
                        </div>
                        <h4 style="margin: 6px 0 14px 0; color: #f8fafc;">Q{idx}. {q.stem}</h4>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                choice_key = f"radio_q_{q.question_id}"
                selected_option = st.radio(
                    f"Select Answer for Question {idx}:",
                    q.options,
                    key=choice_key,
                    label_visibility="collapsed",
                )

                val_btn_key = f"val_btn_{q.question_id}"
                if st.button(f"Validate Response #{idx}", key=val_btn_key):
                    # Check option correctness
                    user_clean = engine.clean_term(selected_option).lower()
                    ans_clean = engine.clean_term(q.correct_answer).lower()

                    if user_clean == ans_clean or selected_option == q.correct_answer:
                        st.success(f"✅ **Correct!**\n\n**Statutory Rationale:** {q.rationale}")
                    else:
                        st.error(f"❌ **Incorrect.**\n\n**Correct Answer:** {q.correct_answer}")
                        st.info(f"📘 **Statutory Rationale:** {q.rationale}")

                st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)


# ==============================================================================
# VIEW 3: CADRE ADMIN ANALYTICS & HEATMAP
# ==============================================================================

elif nav_choice == "Cadre Admin Analytics & Heatmap":
    st.title("📊 Cadre Administration & Directorate Telemetry Heatmap")
    st.markdown("Macro-level oversight across MoSPI field formations and statistical directorates.")

    telemetry_df = db.get_cadre_analytics()

    # Derived Mathematical KPIs (Zero hardcoded strings)
    # KPI 1: Directorates Tracked
    kpi1_val = f"{len(telemetry_df)}"

    # KPI 2: Mean iGOT Hours
    kpi2_val = f"{telemetry_df['avg_igot_hours'].mean():.1f} hrs"

    # KPI 3: Critical Domain Deficit (Domain with the lowest mean score across directorates)
    domain_col_map = {
        "statistical_theory": "Statistical Theory & National Accounts",
        "technical_tools": "Technical Tools (Python, R, SQL, GIS)",
        "data_privacy": "Digital Governance & Data Privacy",
        "managerial": "Managerial & Public Decision Making",
    }
    domain_averages = {
        name: telemetry_df[col].mean()
        for col, name in domain_col_map.items()
    }
    critical_domain_name = min(domain_averages, key=domain_averages.get)
    kpi3_val = f"{domain_averages[critical_domain_name]:.1f}"

    # KPI 4: SSO Cadre Benchmark Attainment
    sso_benchmark = db.get_role_benchmark("Senior Statistical Officer (SSO)")
    domain_means = {
        "Statistical Theory & National Accounts": telemetry_df["statistical_theory"].mean(),
        "Technical Tools (Python, R, SQL, GIS)": telemetry_df["technical_tools"].mean(),
        "Digital Governance & Data Privacy": telemetry_df["data_privacy"].mean(),
        "Managerial & Public Decision Making": telemetry_df["managerial"].mean(),
    }
    attainment_ratios = [
        (domain_means[d] / sso_benchmark[d]) * 100
        for d in domain_means
        if d in sso_benchmark and sso_benchmark[d] > 0
    ]
    avg_attainment = sum(attainment_ratios) / len(attainment_ratios) if attainment_ratios else 0.0
    kpi4_val = f"{avg_attainment:.1f}%"

    # Display KPI Metrics Row
    m_col1, m_col2, m_col3, m_col4 = st.columns(4)
    with m_col1:
        st.metric(label="Directorates Tracked", value=kpi1_val)
    with m_col2:
        st.metric(label="Mean iGOT Learning Hours", value=kpi2_val)
    with m_col3:
        st.metric(
            label="Critical Domain Deficit",
            value=kpi3_val,
            delta=critical_domain_name,
            delta_color="inverse",
        )
    with m_col4:
        st.metric(label="SSO Cadre Benchmark Attainment", value=kpi4_val)

    st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)

    # Directorate Competency Heatmap using st.dataframe
    st.subheader("🗺️ Directorate Competency Heatmap")
    st.markdown("Field formation scores across official domains styled with background color gradients.")

    display_df = telemetry_df.copy()
    display_df.rename(
        columns={
            "division": "Division / Formation",
            "statistical_theory": "Statistical Theory & NA",
            "technical_tools": "Technical Tools (Python/R)",
            "data_privacy": "Digital Governance & Privacy",
            "managerial": "Managerial Decision Making",
            "avg_igot_hours": "Avg iGOT Hours",
        },
        inplace=True,
    )

    domain_columns = [
        "Statistical Theory & NA",
        "Technical Tools (Python/R)",
        "Digital Governance & Privacy",
        "Managerial Decision Making",
    ]

    styled_heatmap = display_df.style.background_gradient(
        subset=domain_columns,
        cmap="Blues",
        vmin=40,
        vmax=100,
    ).format(
        {
            "Statistical Theory & NA": "{:.1f}",
            "Technical Tools (Python/R)": "{:.1f}",
            "Digital Governance & Privacy": "{:.1f}",
            "Managerial Decision Making": "{:.1f}",
            "Avg iGOT Hours": "{:.1f} hrs",
        }
    )

    st.dataframe(styled_heatmap, use_container_width=True, height=220)

    st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)

    # Dynamic Alert Banners
    st.subheader("⚠️ Operational Deficit & Engagement Flags")
    st.markdown(
        "Automated supervisory warnings flagging directorates scoring below 55 points in technical tools or under 20 mean iGOT hours."
    )

    flagged_any = False
    for _, row in telemetry_df.iterrows():
        div_name = row["division"]
        tech_score = float(row["technical_tools"])
        igot_hours = float(row["avg_igot_hours"])
        reasons = []

        if tech_score < 55.0:
            reasons.append(f"Critical technical tools deficit (**{tech_score:.1f}** < 55.0 threshold)")
        if igot_hours < 20.0:
            reasons.append(f"Low iGOT learning engagement (**{igot_hours:.1f} hrs** < 20.0 hrs threshold)")

        if reasons:
            flagged_any = True
            st.warning(f"⚠️ **{div_name}**: {' | '.join(reasons)}")

    if not flagged_any:
        st.success("✅ All active directorates meet minimum technical thresholds and iGOT engagement baselines.")
