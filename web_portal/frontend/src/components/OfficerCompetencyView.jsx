import React, { useState, useEffect } from 'react';
import {
  User,
  Sliders,
  Save,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  TrendingDown,
  Shield,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import RadarChartComponent from './RadarChartComponent';
import {
  fetchOfficerProfile,
  saveOfficerScores,
  fetchBenchmarks,
  computeCompetencyGap,
  inferDossierScores,
  enrollCourse,
  DOMAINS,
  DEFAULT_OFFICER_ID,
} from '../services/api';

const DEFAULT_DOSSIER_PREFILL = `CONFIDENTIAL ADMINISTRATIVE CADRE DOSSIER
MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)
GOVERNMENT OF INDIA - SUBORDINATE STATISTICAL SERVICE / INDIAN STATISTICAL SERVICE

OFFICER IDENTIFIER: ISS-2026-9042
FULL NAME: Shreyas Suresh Attavar
CADRE: Indian Statistical Service (ISS)
DESIGNATION: Junior Statistical Officer (JSO)
CURRENT POSTING / DIVISION: Field Operations Division (FOD), Regional Office

ACADEMIC QUALIFICATIONS:
- Master of Science (M.Sc.) in Statistics (Specialization in Sampling Theory and Econometrics)

ADMINISTRATIVE POSTINGS & FIELD EXPERIENCE:
- Supervised primary data scrutiny across 48 First Stage Units (FSUs) for Periodic Labour Force Survey (PLFS).
- Factory audit schedules and input-output verification for Annual Survey of Industries (ASI).

IDENTIFIED TRAINING DEFICITS & COMPETENCY GAPS:
- NO formal production training in modern computational pipelines using Python, R, or SQL databases.
- No exposure to geospatial tools (GIS, GeoPandas) for Small Area Estimation (SAE).
- Needs statutory compliance training on DPDP Act 2023 for survey microdata custody.`;

export default function OfficerCompetencyView({ showToast }) {
  const [officer, setOfficer] = useState(null);
  const [scores, setScores] = useState({
    'Statistical Theory & National Accounts': 62,
    'Technical Tools (Python, R, SQL, GIS)': 48,
    'Digital Governance & Data Privacy': 65,
    'Managerial & Public Decision Making': 55,
  });
  const [selectedRole, setSelectedRole] = useState('Senior Statistical Officer (SSO)');
  const [benchmarks, setBenchmarks] = useState({
    'Statistical Theory & National Accounts': 85,
    'Technical Tools (Python, R, SQL, GIS)': 80,
    'Digital Governance & Data Privacy': 75,
    'Managerial & Public Decision Making': 70,
  });
  const [gapMatrix, setGapMatrix] = useState({});
  const [l2Deficit, setL2Deficit] = useState(29.22);
  const [recommendations, setRecommendations] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState(['NSSTA-NAS-2024']);

  // Drawer & loading states
  const [dossierOpen, setDossierOpen] = useState(false);
  const [dossierText, setDossierText] = useState(DEFAULT_DOSSIER_PREFILL);
  const [inferring, setInferring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);

  // Load officer profile and benchmarks on initial render
  useEffect(() => {
    async function loadInitialData() {
      try {
        const officerData = await fetchOfficerProfile(DEFAULT_OFFICER_ID);
        setOfficer(officerData);
        if (officerData.scores) {
          setScores(officerData.scores);
        }
        if (officerData.completed_courses) {
          setEnrolledCourses(officerData.completed_courses);
        }

        const bData = await fetchBenchmarks(selectedRole);
        if (bData.benchmarks) {
          setBenchmarks(bData.benchmarks);
        }
      } catch (err) {
        console.warn('Backend unavailable, using initial state:', err);
      }
    }
    loadInitialData();
  }, []);

  // Update benchmarks whenever role changes
  useEffect(() => {
    async function updateRoleBenchmarks() {
      try {
        const bData = await fetchBenchmarks(selectedRole);
        if (bData.benchmarks) {
          setBenchmarks(bData.benchmarks);
        }
      } catch (err) {
        console.warn('Failed to fetch benchmarks for role:', selectedRole, err);
      }
    }
    updateRoleBenchmarks();
  }, [selectedRole]);

  // Recalculate gap and recommendations whenever scores or benchmarks change
  useEffect(() => {
    async function recalculateGap() {
      try {
        const result = await computeCompetencyGap(scores, benchmarks);
        if (result.gap_matrix) setGapMatrix(result.gap_matrix);
        if (typeof result.l2_deficit === 'number') setL2Deficit(result.l2_deficit);
        if (result.recommendations) setRecommendations(result.recommendations);
      } catch (err) {
        // Fallback calculation
        let sumSq = 0;
        const newGap = {};
        DOMAINS.forEach((d) => {
          const s = scores[d] || 0;
          const b = benchmarks[d] || 0;
          const deficit = Math.max(0, b - s);
          newGap[d] = {
            'Current Score': s,
            'Benchmark Target': b,
            'Calculated Deficit': deficit,
          };
          sumSq += deficit * deficit;
        });
        setGapMatrix(newGap);
        setL2Deficit(Math.sqrt(sumSq));
      }
    }
    recalculateGap();
  }, [scores, benchmarks]);

  const handleScoreChange = (domain, newValue) => {
    setScores((prev) => ({
      ...prev,
      [domain]: parseInt(newValue, 10),
    }));
  };

  const handlePersistScores = async () => {
    setSaving(true);
    try {
      await saveOfficerScores(DEFAULT_OFFICER_ID, scores);
      showToast('Scores persisted to SQLite disk (ksi_master.db)', 'success');
    } catch (err) {
      showToast('Failed to persist scores to database', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInferDossier = async () => {
    setInferring(true);
    try {
      const result = await inferDossierScores(dossierText);
      if (result.inferred_scores) {
        setScores(result.inferred_scores);
        showToast('Profile inferred and scores calibrated via local LLM', 'success');
      }
    } catch (err) {
      showToast('Dossier inference failed, check local Ollama service', 'error');
    } finally {
      setInferring(false);
    }
  };

  const handleEnrollCourse = async (courseId, courseTitle) => {
    setEnrollingId(courseId);
    try {
      await enrollCourse(DEFAULT_OFFICER_ID, courseId);
      setEnrolledCourses((prev) => [...new Set([...prev, courseId])]);
      showToast(`Enrolled in ${courseTitle} (${courseId}) on iGOT`, 'success');
    } catch (err) {
      setEnrolledCourses((prev) => [...new Set([...prev, courseId])]);
      showToast(`Enrolled in ${courseId} (Local Session)`, 'success');
    } finally {
      setEnrollingId(null);
    }
  };

  const radarData = DOMAINS.map((domain) => {
    let shortName = domain;
    if (domain.includes('Statistical Theory')) shortName = 'Statistical Theory';
    else if (domain.includes('Technical Tools')) shortName = 'Technical Tools';
    else if (domain.includes('Digital Governance')) shortName = 'Digital Governance';
    else if (domain.includes('Managerial')) shortName = 'Managerial Skills';

    const current = scores[domain] || 0;
    const benchmark = benchmarks[domain] || 0;
    const deficit = Math.max(0, benchmark - current);

    return {
      domain,
      shortName,
      current,
      benchmark,
      deficit,
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Official Headline Accent Mantra */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
          Competency Framework & Learning Pathways
        </h1>
        <p className="text-xs sm:text-base font-bold text-[#f58220] mt-1 break-words">
          Transitioning MoSPI from 'Rule-based' to 'Role-based' Statistical Governance
        </p>
      </div>

      {/* 1. Header Profile Card with iGOT Blue Accent Strip */}
      <div className="rounded-2xl border border-[#f0e6dc] border-t-4 border-t-[#1d5ba5] bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Officer Details */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1d5ba5] border border-blue-200 font-bold text-xl shadow-xs">
              <User className="w-7 h-7 text-[#1d5ba5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">
                  {officer ? officer.name : 'Shreyas Suresh Attavar'}
                </h2>
                <span className="inline-flex items-center rounded-md bg-[#fdf8f3] px-2.5 py-0.5 text-xs font-semibold text-[#1d5ba5] border border-[#f0e6dc] font-mono">
                  {officer ? officer.officer_id : 'ISS-2026-9042'}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Active Cadre Standing
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cadre: <b>{officer ? officer.cadre : 'Indian Statistical Service (ISS)'}</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Designation: <b>{officer ? officer.designation : 'Junior Statistical Officer (JSO)'}</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Division: <b>{officer ? officer.division : 'Field Operations Division (FOD)'}</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* Role Selector Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[#fdf8f3] p-3.5 rounded-xl border border-[#f0e6dc]">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Target Cadre Role:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-lg border border-[#f0e6dc] bg-white px-3.5 py-1.5 text-xs font-bold text-[#1d5ba5] shadow-xs focus:border-[#f58220] focus:outline-none focus:ring-1 focus:ring-[#f58220] cursor-pointer"
            >
              <option value="Senior Statistical Officer (SSO)">Senior Statistical Officer (SSO)</option>
              <option value="Junior Statistical Officer (JSO)">Junior Statistical Officer (JSO)</option>
              <option value="Assistant Director (NAD / FOD)">Assistant Director (NAD / FOD)</option>
            </select>
          </div>

        </div>

        {/* 2. Expandable Dossier Inference Drawer */}
        <div className="mt-5 border-t border-[#f0e6dc] pt-4">
          <button
            onClick={() => setDossierOpen(!dossierOpen)}
            className="flex items-center justify-between w-full text-left text-xs font-bold text-[#1d5ba5] hover:text-[#f58220] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f58220]" />
              <span>📄 Administrative Dossier Ingestion (Automated Profile Inference)</span>
            </span>
            {dossierOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {dossierOpen && (
            <div className="mt-3.5 p-4 rounded-xl bg-[#fdf8f3] border border-[#f0e6dc] space-y-3">
              <p className="text-xs text-slate-600">
                The local air-gapped LLM (<code>qwen2.5:7b</code>) evaluates administrative postings, field surveys, and identified skill gaps to dynamically calibrate baseline scores.
              </p>
              <textarea
                value={dossierText}
                onChange={(e) => setDossierText(e.target.value)}
                rows={7}
                className="w-full rounded-xl border border-[#f0e6dc] bg-white p-3.5 font-mono text-xs text-slate-800 focus:border-[#f58220] focus:outline-none focus:ring-1 focus:ring-[#f58220]"
                placeholder="Paste administrative cadre dossier text..."
              />
              <div className="flex justify-end">
                <button
                  onClick={handleInferDossier}
                  disabled={inferring}
                  className="flex items-center gap-2 rounded-full bg-[#1d5ba5] hover:bg-[#15457e] px-5 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${inferring ? 'animate-spin' : ''}`} />
                  <span>{inferring ? 'Inferring Competencies via Local LLM...' : 'Auto-Infer Competency Profile via Local LLM'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 3. Main 2-Column Grid (5 cols / 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (5 cols): Sliders, Persist Button, Metric Card & Radar Chart */}
        <div className="lg:col-span-5 space-y-6">

          {/* Sliders Card */}
          <div className="rounded-2xl border border-[#f0e6dc] bg-white p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e6dc]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#f58220]" />
                <h3 className="text-sm font-bold text-slate-900">Competency Vector Calibration</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Live Scale (0–100)</span>
            </div>

            <div className="space-y-4">
              {DOMAINS.map((domain) => {
                const current = scores[domain] || 0;
                const bench = benchmarks[domain] || 0;
                const deficit = Math.max(0, bench - current);

                let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (current < 55) {
                  badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                } else if (deficit > 0) {
                  badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                }

                return (
                  <div key={domain} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 pr-2">{domain}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Target: {bench}</span>
                        <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs border ${badgeColor}`}>
                          {current}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={current}
                      onChange={(e) => handleScoreChange(domain, e.target.value)}
                      className="w-full h-2 bg-[#fdf8f3] border border-[#f0e6dc] rounded-lg appearance-none cursor-pointer accent-[#f58220]"
                    />
                  </div>
                );
              })}
            </div>

            {/* Prominent Karmayogi Saffron Pill Button */}
            <button
              onClick={handlePersistScores}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#f58220] hover:bg-[#e07116] px-5 py-3 text-xs font-bold text-white shadow-sm disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 text-white" />
              <span>{saving ? 'Persisting to SQLite...' : 'Persist Calibrated Scores'}</span>
            </button>
          </div>

          {/* Metric Card: Aggregate L2 Deficit */}
          <div className="rounded-2xl border border-[#f0e6dc] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Aggregate L2 Competency Deficit
                </p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">
                    {l2Deficit.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Euclidean Distance</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200 text-[#f58220]">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-[#f0e6dc] flex items-center justify-between text-xs text-slate-600">
              <span>Target Role: <b className="text-[#1d5ba5]">{selectedRole}</b></span>
              <span className={l2Deficit === 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                {l2Deficit === 0 ? 'Benchmark Attained' : 'Deficit Exists'}
              </span>
            </div>
          </div>

          {/* Interactive Recharts Radar Chart */}
          <div className="rounded-2xl border border-[#f0e6dc] bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0e6dc]">
              <h3 className="text-sm font-bold text-slate-900">Multi-Domain Vector Geometry</h3>
              <span className="text-[11px] font-semibold text-[#1d5ba5] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Recharts Radar
              </span>
            </div>
            <RadarChartComponent chartData={radarData} roleName={selectedRole} />
          </div>

        </div>

        {/* RIGHT COLUMN (7 cols): Prioritized iGOT Course Recommendations */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#f0e6dc] bg-white p-6 shadow-sm">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#f0e6dc]">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#1d5ba5]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Prioritized iGOT Karmayogi Learning Pathways
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered descending by domain deficit to eliminate critical operational bottlenecks.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50 text-[#f58220] border border-orange-200">
                {recommendations.length} Recommended
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {recommendations.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">No Competency Deficit Detected</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Officer exceeds benchmark thresholds for {selectedRole}.
                  </p>
                </div>
              ) : (
                recommendations.map((rec) => {
                  const isEnrolled = enrolledCourses.includes(rec.course_id);
                  const isCritical = rec.domain_deficit >= 20;

                  return (
                    <div
                      key={rec.course_id}
                      className="rounded-xl border border-[#f0e6dc] bg-white overflow-hidden hover:border-[#f58220]/50 hover:shadow-md transition-all"
                    >
                      {/* Top Card Header Strip with Subtle Cream Accent */}
                      <div className="bg-[#fdf8f3] px-4 py-2.5 border-b border-[#f0e6dc] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-[#1d5ba5] border border-blue-200">
                            {rec.course_id}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#1d5ba5] border border-blue-200">
                            {rec.provider}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-50 text-[#f58220] border border-orange-200">
                            {rec.level}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            isCritical
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          Deficit: -{rec.domain_deficit} pts
                        </span>
                      </div>

                      {/* Course Body */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {rec.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            <b>Target Competency Domain:</b> {rec.domain}
                          </p>
                        </div>

                        {/* Duration & Gain bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2.5 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-4 text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <b>{rec.duration_hours} hrs</b>
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <Award className="w-3.5 h-3.5 text-emerald-500" />
                              +{rec.competency_gain} pts Gain
                            </span>
                          </div>

                          {/* Enroll via iGOT SSO Rounded Pill Button */}
                          <button
                            onClick={() => handleEnrollCourse(rec.course_id, rec.title)}
                            disabled={isEnrolled || enrollingId === rec.course_id}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isEnrolled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                                : 'bg-[#f58220] text-white hover:bg-[#e07116] shadow-sm'
                            }`}
                          >
                            {isEnrolled ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Enrolled & Synced</span>
                              </>
                            ) : (
                              <>
                                <span>{enrollingId === rec.course_id ? 'Enrolling...' : 'Enroll via iGOT SSO'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
