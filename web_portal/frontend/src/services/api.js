/**
 * REST API client for Karmayogi Statistical Intelligence (KSI) backend.
 * Connects to FastAPI service on import.meta.env.VITE_API_BASE_URL or http://127.0.0.1:8000/api.
 * Includes seamless mock fallback for standalone Vercel cloud previews.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const DEFAULT_OFFICER_ID = 'ISS-2026-9042';

export const DOMAINS = [
  'Statistical Theory & National Accounts',
  'Technical Tools (Python, R, SQL, GIS)',
  'Digital Governance & Data Privacy',
  'Managerial & Public Decision Making',
];

const SEED_OFFICER = {
  officer_id: 'ISS-2026-9042',
  name: 'Thejas B K Shetty',
  cadre: 'Indian Statistical Service (ISS)',
  designation: 'Junior Statistical Officer (JSO)',
  division: 'Field Operations Division (FOD), Regional Office',
  scores: {
    'Statistical Theory & National Accounts': 62,
    'Technical Tools (Python, R, SQL, GIS)': 48,
    'Digital Governance & Data Privacy': 65,
    'Managerial & Public Decision Making': 55,
  },
  completed_courses: ['NSSTA-NAS-2024'],
};

const SEED_BENCHMARKS = {
  'Senior Statistical Officer (SSO)': {
    'Statistical Theory & National Accounts': 85,
    'Technical Tools (Python, R, SQL, GIS)': 80,
    'Digital Governance & Data Privacy': 75,
    'Managerial & Public Decision Making': 70,
  },
  'Assistant Director (AD)': {
    'Statistical Theory & National Accounts': 88,
    'Technical Tools (Python, R, SQL, GIS)': 82,
    'Digital Governance & Data Privacy': 80,
    'Managerial & Public Decision Making': 85,
  },
  'Deputy Director (DD)': {
    'Statistical Theory & National Accounts': 90,
    'Technical Tools (Python, R, SQL, GIS)': 85,
    'Digital Governance & Data Privacy': 85,
    'Managerial & Public Decision Making': 90,
  },
};

const SEED_COURSES = [
  {
    course_id: 'NSSTA-NAS-2024',
    title: 'Compilation of National Accounts Statistics & GCF (SNA 2008 Guidelines)',
    domain: 'Statistical Theory & National Accounts',
    provider: 'NSSTA',
    duration_hours: 36,
    level: 'Advanced',
    competency_gain: 25,
  },
  {
    course_id: 'NSSTA-MIS-78',
    title: 'Sampling Methodology & Standard Error Estimation in NSS 78th Round (MIS)',
    domain: 'Statistical Theory & National Accounts',
    provider: 'NSSTA',
    duration_hours: 24,
    level: 'Intermediate',
    competency_gain: 20,
  },
  {
    course_id: 'MOSPI-PY-GIS',
    title: 'Small Area Estimation (SAE) & Spatial Modeling using Python & GeoPandas',
    domain: 'Technical Tools (Python, R, SQL, GIS)',
    provider: 'Computer Centre MoSPI',
    duration_hours: 30,
    level: 'Intermediate',
    competency_gain: 25,
  },
  {
    course_id: 'NIC-R-SURVEY',
    title: 'Automated Data Validation & Imputation Pipelines with R & PostgreSQL',
    domain: 'Technical Tools (Python, R, SQL, GIS)',
    provider: 'NIC',
    duration_hours: 20,
    level: 'Intermediate',
    competency_gain: 20,
  },
  {
    course_id: 'MEITY-DPDP-2023',
    title: 'Statutory Data Fiduciary Obligations under the DPDP Act 2023',
    domain: 'Digital Governance & Data Privacy',
    provider: 'NeGD',
    duration_hours: 12,
    level: 'Foundational',
    competency_gain: 15,
  },
  {
    course_id: 'ISTM-TPAC-GFR',
    title: 'Public Procurement & Contract Management for Field Surveys (GFR 2017)',
    domain: 'Managerial & Public Decision Making',
    provider: 'ISTM',
    duration_hours: 16,
    level: 'Intermediate',
    competency_gain: 15,
  },
];

const SEED_MCQS = [
  {
    question_id: 'KSI-LIVE-001',
    stem: 'Under official price statistics standards, what does the Producer Price Index (PPI) primarily measure?',
    options: [
      'Average change over time in selling prices received by domestic producers for their output',
      'Retail price changes experienced by final household consumers in urban markets',
      'Tariff and customs duty adjustments on imported intermediate goods',
      'Weighted volume changes in manufacturing output across consecutive financial quarters',
    ],
    correct_answer: 'Average change over time in selling prices received by domestic producers for their output',
    rationale: 'The Producer Price Index measures the average change over time in selling prices received by domestic producers for their output.',
    bloom_level: 'Level 1: Recall',
  },
  {
    question_id: 'KSI-LIVE-002',
    stem: 'How does the Producer Price Index (PPI) conceptually differ from the Consumer Price Index (CPI) in macroeconomic monitoring?',
    options: [
      'PPI measures price changes from the seller perspective while CPI measures from the buyer perspective',
      'PPI is compiled exclusively from administrative tax filings while CPI relies on satellite imagery',
      'PPI excludes manufactured goods while CPI excludes agricultural and food commodities',
      'PPI is compiled on an unweighted basis while CPI utilizes Laspeyres expenditure weights',
    ],
    correct_answer: 'PPI measures price changes from the seller perspective while CPI measures from the buyer perspective',
    rationale: 'PPI measures price change from the perspective of the seller (producer prices), whereas CPI measures from the perspective of the purchaser/buyer (consumer prices including retail markups and taxes).',
    bloom_level: 'Level 2: Conceptual Analysis',
  },
  {
    question_id: 'KSI-LIVE-003',
    stem: 'When compiling constant-price Gross Value Added (GVA) by economic activity, how should a statistical officer procedurally utilize the PPI?',
    options: [
      'Apply activity-specific PPI sub-indices as output deflators to convert current price output to constant prices',
      'Multiply current output by the inverse of consumer expenditure weights',
      'Substitute PPI directly for intermediate consumption without volume deflation',
      'Aggregate raw producer price quotations across unstratified factory samples',
    ],
    correct_answer: 'Apply activity-specific PPI sub-indices as output deflators to convert current price output to constant prices',
    rationale: 'National accounts compilation standards recommend deflating gross output at current basic prices by the corresponding Producer Price Index to obtain constant price gross output.',
    bloom_level: 'Level 3: Procedural Application',
  },
];

const SEED_TELEMETRY = {
  records: [
    {
      division: 'FOD (Field Operations)',
      statistical_theory: 64.0,
      technical_tools: 48.0,
      data_privacy: 55.0,
      managerial: 68.0,
      avg_igot_hours: 18.2,
    },
    {
      division: 'NAD (National Accounts)',
      statistical_theory: 88.0,
      technical_tools: 62.0,
      data_privacy: 70.0,
      managerial: 74.0,
      avg_igot_hours: 34.5,
    },
    {
      division: 'PSD (Price Statistics)',
      statistical_theory: 82.0,
      technical_tools: 71.0,
      data_privacy: 68.0,
      managerial: 62.0,
      avg_igot_hours: 27.8,
    },
    {
      division: 'Coordination & Training',
      statistical_theory: 70.0,
      technical_tools: 59.0,
      data_privacy: 82.0,
      managerial: 80.0,
      avg_igot_hours: 22.0,
    },
  ],
  kpis: {
    directorates_tracked: 4,
    mean_igot_hours: 25.6,
    critical_domain_deficit: 'Technical Tools (Python, R, SQL, GIS)',
    critical_domain_average: 60.0,
    sso_benchmark_attainment_pct: 87.6,
  },
};

export async function fetchOfficerProfile(officerId = DEFAULT_OFFICER_ID) {
  try {
    const response = await fetch(`${API_BASE_URL}/officer/${encodeURIComponent(officerId)}`);
    if (response.ok) return await response.json();
  } catch (err) {
    console.warn('[Vercel Cloud Mode] Using seed officer data:', err);
  }
  return SEED_OFFICER;
}

export async function saveOfficerScores(officerId = DEFAULT_OFFICER_ID, scores) {
  try {
    const response = await fetch(`${API_BASE_URL}/officer/${encodeURIComponent(officerId)}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores }),
    });
    if (response.ok) return await response.json();
  } catch (err) {
    console.warn('[Vercel Cloud Mode] Saving scores locally:', err);
  }
  return { status: 'success', message: 'Scores saved (Demo Mode)', scores };
}

export async function enrollCourse(officerId = DEFAULT_OFFICER_ID, courseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/officer/${encodeURIComponent(officerId)}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId }),
    });
    if (response.ok) return await response.json();
  } catch (err) {
    console.warn('[Vercel Cloud Mode] Enrolling course locally:', err);
  }
  return { status: 'success', message: `Enrolled in ${courseId} (Demo Mode)` };
}

export async function fetchBenchmarks(roleName = 'Senior Statistical Officer (SSO)') {
  try {
    const response = await fetch(`${API_BASE_URL}/benchmarks/${encodeURIComponent(roleName)}`);
    if (response.ok) return await response.json();
  } catch (err) {
    console.warn('[Vercel Cloud Mode] Using seed benchmarks:', err);
  }
  return {
    role_name: roleName,
    benchmarks: SEED_BENCHMARKS[roleName] || SEED_BENCHMARKS['Senior Statistical Officer (SSO)'],
  };
}

export async function computeCompetencyGap(currentScores, benchmarkScores) {
  try {
    const response = await fetch(`${API_BASE_URL}/compute-gap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_scores: currentScores,
        benchmark_scores: benchmarkScores,
      }),
    });
    if (response.ok) return await response.json();
  } catch (err) {
    console.warn('[Vercel Cloud Mode] Computing vector math locally:', err);
  }

  // Pure JavaScript deterministic Euclidean L2 gap calculation
  const gapMatrix = {};
  let sumSq = 0;
  DOMAINS.forEach((domain) => {
    const cur = currentScores[domain] || 0;
    const tgt = benchmarkScores[domain] || 0;
    const deficit = Math.max(0, tgt - cur);
    gapMatrix[domain] = {
      'Current Score': cur,
      'Benchmark Target': tgt,
      'Calculated Deficit': deficit,
    };
    sumSq += deficit * deficit;
  });
  const l2 = parseFloat(Math.sqrt(sumSq).toFixed(2));

  // Match recommendations by highest deficit
  const recs = SEED_COURSES.map((c) => ({
    ...c,
    domain_deficit: gapMatrix[c.domain]?.['Calculated Deficit'] || 0,
  })).sort((a, b) => b.domain_deficit - a.domain_deficit);

  return { gap_matrix: gapMatrix, l2_deficit: l2, recommendations: recs };
}

export async function inferDossierScores(dossierText) {
  try {
    const response = await fetch(`${API_BASE_URL}/infer-dossier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dossier_text: dossierText }),
    });
    if (response.ok) return await response.json();
  } catch (err) {
    console.warn('[Vercel Cloud Mode] Inferred scores fallback:', err);
  }
  return {
    status: 'success',
    inferred_scores: {
      'Statistical Theory & National Accounts': 65,
      'Technical Tools (Python, R, SQL, GIS)': 42,
      'Digital Governance & Data Privacy': 58,
      'Managerial & Public Decision Making': 60,
    },
  };
}

export async function synthesizeMCQs({ pdfFile = null, rawText = '' }) {
  try {
    const formData = new FormData();
    if (pdfFile) formData.append('pdf_file', pdfFile);
    if (rawText) formData.append('raw_text', rawText);

    const response = await fetch(`${API_BASE_URL}/synthesize-mcqs`, {
      method: 'POST',
      body: formData,
    });
    if (response.ok) return await response.json();
  } catch (err) {
    console.warn('[Vercel Cloud Mode] Synthesizing seed MCQs fallback:', err);
  }
  return SEED_MCQS;
}

export async function fetchCadreTelemetry() {
  try {
    const response = await fetch(`${API_BASE_URL}/telemetry`);
    if (response.ok) return await response.json();
  } catch (err) {
    console.warn('[Vercel Cloud Mode] Using seed telemetry:', err);
  }
  return SEED_TELEMETRY;
}
