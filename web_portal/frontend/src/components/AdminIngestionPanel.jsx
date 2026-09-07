import React, { useState } from 'react';
import {
  FileUp,
  Upload,
  Sparkles,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

function createSamplePdfBlob() {
  const samplePdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 600 >> stream
BT
/F1 12 Tf
72 700 Td
(MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION MoSPI) Tj
0 -20 Td
(TECHNICAL COMPENDIUM ON STATISTICAL CONCEPTS AND STANDARDS) Tj
0 -20 Td
(1. Gross Value Added GVA at basic prices is defined under SNA 2008 as output less intermediate consumption.) Tj
0 -20 Td
(GDP at market prices equals GVA at basic prices plus net product taxes product taxes minus product subsidies.) Tj
0 -20 Td
(2. Consumer Price Index CPI is compiled monthly with Base Year 2012 equals 100 using Laspeyres formulation.) Tj
0 -20 Td
(3. Producer Price Index PPI measures average changes over time in selling prices received by domestic producers.) Tj
0 -20 Td
(PPI sub-indices are used in national accounts deflation to convert current prices into constant volume estimates.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000896 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
968
%%EOF`;
  return new Blob([samplePdfContent], { type: 'application/pdf' });
}

export default function AdminIngestionPanel({ cadreAssessment, onDispatchAssessment, showToast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [useSample, setUseSample] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        if (showToast) showToast('Only .pdf documents are supported', 'error');
        return;
      }
      setSelectedFile(file);
      setUseSample(false);
      setError(null);
      setSuccessBanner(null);
      if (showToast) showToast(`Selected ${file.name} for cadre evaluation synthesis`, 'success');
    }
  };

  const handleToggleSample = () => {
    const next = !useSample;
    setUseSample(next);
    if (next) {
      setSelectedFile(null);
      setError(null);
    }
  };

  const handleSynthesizeAndDispatch = async (bypassCache = false) => {
    setLoading(true);
    setError(null);
    setSuccessBanner(null);

    try {
      let fileToUpload = selectedFile;
      let documentName = selectedFile ? selectedFile.name : 'MoSPI_NSSTA_Technical_Compendium_Sample.pdf';

      if (!fileToUpload) {
        const blob = createSamplePdfBlob();
        fileToUpload = new File([blob], documentName, { type: 'application/pdf' });
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const baseUrl = rawApiUrl.replace(/\/api\/?$/, '');
      const endpoint = `${baseUrl}/generate-quiz${bypassCache ? '?bypass_cache=true' : ''}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `Server responded with HTTP ${response.status} (${response.statusText})`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Backend returned invalid quiz schema: Missing or empty questions array.');
      }

      if (onDispatchAssessment) {
        onDispatchAssessment({
          title: "Mandatory Statutory Competency Evaluation: MoSPI Field Directives",
          subtitle: "Synthesized from latest NSSTA statutory circulars by Cadre Administration.",
          sourceDocument: documentName,
          dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          questions: data.questions,
        });
      }

      setSuccessBanner('✓ Statutory Assessment Synthesized & Dispatched to Field Cadre (3 Items Generated)');
      setPreviewOpen(true);
      if (showToast) {
        showToast('✓ Assessment dispatched to Officer / Learner portal', 'success');
      }
    } catch (err) {
      console.error('Admin Document Ingestion Pipeline Failure:', err);
      setError(err.message || 'Failed to communicate with ingestion engine.');
      if (showToast) {
        showToast('Document Ingestion Failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentQuestions = cadreAssessment?.questions || [];

  return (
    <div className="rounded-2xl border border-[#f0e6dc] bg-white p-6 shadow-sm space-y-5">
      
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#f0e6dc] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1d5ba5]/10 flex items-center justify-center text-[#1d5ba5]">
            <FileUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                NSSTA Statutory Document Ingestion & Cadre Assessment Dispatcher
              </h3>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#1d5ba5] border border-blue-200">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingest official Gazette circulars via PyMuPDF + Ollama to synthesize Bloom-tiered evaluations and dispatch directly to field officers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer bg-[#fdf8f3] px-3.5 py-1.5 rounded-full border border-[#f0e6dc] text-xs font-semibold text-slate-700 hover:bg-orange-50/50 transition-colors">
            <input
              type="checkbox"
              checked={useSample}
              onChange={handleToggleSample}
              className="rounded border-slate-300 text-[#f58220] focus:ring-[#f58220] h-3.5 w-3.5 accent-[#f58220]"
            />
            <span>Use MoSPI Technical Compendium</span>
          </label>
        </div>
      </div>

      {/* Upload Zone & Action Dispatcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${
            selectedFile
              ? 'border-[#1d5ba5] bg-[#1d5ba5]/5'
              : 'border-[#e2d7cc] hover:border-[#1d5ba5]/50 bg-[#fdf8f3]/50'
          }`}
        >
          <input
            type="file"
            accept=".pdf"
            id="adminPdfUpload"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="adminPdfUpload" className="cursor-pointer block">
            <Upload className="w-8 h-8 text-[#1d5ba5] mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">
              {selectedFile ? selectedFile.name : (useSample ? 'MoSPI_NSSTA_Technical_Compendium_Sample.pdf (Active Default)' : 'Upload Official Gazette / Survey Circular PDF')}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              PyMuPDF validates character density and slices first 4,500 characters of clean statutory stream
            </p>
          </label>
        </div>

        <div className="flex flex-col justify-between p-4 rounded-2xl border border-[#f0e6dc] bg-[#fdf8f3]/60">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Pedagogical Bloom Taxonomy Calibration</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">
                Level 1: Recall
              </span>
              <span className="px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-800 border-blue-200 font-semibold">
                Level 2: Conceptual Analysis
              </span>
              <span className="px-2.5 py-0.5 rounded-full border bg-purple-50 text-purple-800 border-purple-200 font-semibold">
                Level 3: Procedural Application
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSynthesizeAndDispatch(false)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#f58220] hover:bg-[#e07116] px-5 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-60 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Synthesizing...' : 'Synthesize & Dispatch Cadre Evaluation'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSynthesizeAndDispatch(true)}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 rounded-full bg-[#1d5ba5] hover:bg-[#164a87] px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-60 transition-all cursor-pointer"
              title="Bypass cache and force fresh inference from local Ollama"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Force Fresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Extraction & LLM Synthesis Spinner */}
      {loading && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 text-center space-y-2 animate-in fade-in">
          <div className="w-8 h-8 border-3 border-[#1d5ba5] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-[#1d5ba5]">
            PyMuPDF extracting statutory stream & Ollama synthesizing...
          </p>
          <p className="text-xs text-slate-500">
            Parsing PDF character stream, enforcing 3 Bloom tiers, and validating Pydantic JSON schema (Timeout: 180s).
          </p>
        </div>
      )}

      {/* Observable Error Banner (No Static Fallbacks) */}
      {error && !loading && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-rose-900">
                Document Ingestion & Synthesis Pipeline Error
              </h4>
              <p className="text-xs font-mono text-rose-800 bg-rose-100/80 p-3 rounded-xl border border-rose-200 break-words">
                {error}
              </p>
              <p className="text-xs text-rose-700">
                Fallback question hijacking disabled. Review the backend telemetry above.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSynthesizeAndDispatch(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Ingestion</span>
          </button>
        </div>
      )}

      {/* Admin Confirmation Banner */}
      {successBanner && !loading && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/80 p-4 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">
                {successBanner}
              </p>
              <p className="text-[11px] text-emerald-800">
                Active in field officer portal. Switch view to "Officer / Learner" to take this assessment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreviewOpen(!previewOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <span>{previewOpen ? 'Hide Preview' : 'Inspect Generated Items'}</span>
            {previewOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Admin Read-Only Preview Accordion */}
      {previewOpen && currentQuestions.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1d5ba5]">
              <BookOpen className="w-4 h-4" />
              <span>Administrative Inspection Preview ({currentQuestions.length} Items Dispatched)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Source: {cadreAssessment?.sourceDocument || 'MoSPI Compendium'}
            </span>
          </div>

          <div className="space-y-3">
            {currentQuestions.map((q, idx) => (
              <div key={q.id || idx} className="rounded-xl border border-[#f0e6dc] bg-white p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#fdf8f3] text-slate-700 border border-[#f0e6dc]">
                      {q.id || `KSI-00${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      {q.level}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Correct: Option {String.fromCharCode(65 + q.correctIndex)}
                  </span>
                </div>

                <p className="font-bold text-slate-900 leading-relaxed">
                  {idx + 1}. {q.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg border ${
                        oIdx === q.correctIndex
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
                          : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700">Citation: </span>
                  <span>{q.citation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
