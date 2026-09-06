import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { synthesizeMCQs } from '../services/api';

const SAMPLE_COMPENDIUM = `MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)
GOVERNMENT OF INDIA - NSSTA & CENTRAL STATISTICS OFFICE (CSO)
TECHNICAL COMPENDIUM ON STATISTICAL CONCEPTS, STANDARDS, AND METHODOLOGIES

1. GROSS VALUE ADDED (GVA) AT BASIC PRICES
Statutory Definition: Under the System of National Accounts (SNA 2008) adopted by MoSPI / National Accounts Division (NAD), Gross Value Added (GVA) is defined as the value of output of goods and services produced less the value of intermediate consumption used in production. GVA at basic prices measures the contribution of individual resident producer units to the economy.
GDP at market prices = GVA at basic prices + Net Product Taxes (Product Taxes - Product Subsidies).

2. CONSUMER PRICE INDEX (CPI)
Statutory Definition: Compiled monthly by the Price Statistics Division (PSD) using the modified Laspeyres' price index formula with Base Year 2012 = 100. Weights derived from Consumer Expenditure Survey (CES).

3. INDEX OF INDUSTRIAL PRODUCTION (IIP)
Statutory Definition: Compiled using Laspeyres' base-weighted formulation with Base Year 2011-12 = 100. Weights: Manufacturing (77.63%), Mining (14.37%), Electricity (7.99%).

4. MULTI-STAGE STRATIFIED SAMPLING & SAMPLING VARIANCE
Statutory Definition: In PLFS administered by FOD, Census villages (rural) and UFS blocks (urban) form First Stage Units (FSUs). Clustered sampling induces positive intra-cluster correlation (Design Effect Deff > 1), making Simple Random Sampling (SRS) standard error formulas severely underestimate true variance.

5. INTERMEDIATE CONSUMPTION (IC)
Statutory Definition: SNA 2008 para 6.64: Value of goods and services consumed as inputs, excluding fixed assets whose wear and tear is recorded as Consumption of Fixed Capital (CFC).`;

export default function MCQSynthesizerView({ showToast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [useSample, setUseSample] = useState(true);
  const [documentText, setDocumentText] = useState(SAMPLE_COMPENDIUM);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [verifiedAnswers, setVerifiedAnswers] = useState({});

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showToast('Only PDF files are supported', 'error');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast('File exceeds 15MB size limit', 'error');
        return;
      }
      setSelectedFile(file);
      setUseSample(false);
      showToast(`Selected ${file.name} for extraction`, 'success');
    }
  };

  const handleToggleSample = () => {
    const next = !useSample;
    setUseSample(next);
    if (next) {
      setSelectedFile(null);
      setDocumentText(SAMPLE_COMPENDIUM);
    }
  };

  const handleSynthesize = async () => {
    setLoading(true);
    try {
      let result;
      if (selectedFile) {
        result = await synthesizeMCQs({ pdfFile: selectedFile });
      } else {
        result = await synthesizeMCQs({ rawText: documentText });
      }

      if (Array.isArray(result) && result.length > 0) {
        setQuestions(result);
        setSelectedAnswers({});
        setVerifiedAnswers({});
        showToast(`Synthesized ${result.length} Bloom-tiered MCQs`, 'success');
      } else {
        showToast('No MCQs returned from engine', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error synthesizing questions from local LLM', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleVerifyAnswer = (questionId) => {
    const chosen = selectedAnswers[questionId];
    if (!chosen) {
      showToast('Please select an option first', 'error');
      return;
    }
    setVerifiedAnswers((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const getBadgeStyle = (bloomLevel = '') => {
    const lower = bloomLevel.toLowerCase();
    if (lower.includes('recall') || lower.includes('level 1')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    }
    if (lower.includes('concept') || lower.includes('level 2')) {
      return 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
    }
    return 'bg-purple-50 text-purple-800 border-purple-300 font-bold';
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-[#f0e6dc] bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1d5ba5]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#1d5ba5]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Statutory Circular MCQ Synthesizer (PyMuPDF)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated parsing of Gazette notifications, NSS manuals, and statistical circulars into Bloom-tiered evaluation questions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-[#fdf8f3] px-4 py-2 rounded-full border border-[#f0e6dc] text-xs font-semibold text-slate-700 hover:bg-orange-50/50 transition-colors">
              <input
                type="checkbox"
                checked={useSample}
                onChange={handleToggleSample}
                className="rounded border-slate-300 text-[#f58220] focus:ring-[#f58220] h-4 w-4 accent-[#f58220]"
              />
              <span>Use MoSPI NSSTA Technical Compendium</span>
            </label>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              id="pdfUpload"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="pdfUpload" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-[#1d5ba5] mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Upload Statutory Circular / Gazette PDF'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PyMuPDF extracts text and collapses redundant whitespace (Max 15MB)
              </p>
            </label>
          </div>

          <div className="flex flex-col justify-between p-4 rounded-2xl border border-[#f0e6dc] bg-[#fdf8f3]/60">
            <div>
              <p className="text-xs font-bold text-slate-800 mb-1">Pedagogical Bloom Taxonomy Mapping</p>
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

            <button
              onClick={handleSynthesize}
              disabled={loading}
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#f58220] hover:bg-[#e07116] px-5 py-2.5 text-xs font-bold text-white shadow-sm focus:outline-none disabled:opacity-60 transition-all"
            >
              <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Synthesizing Questions via Local LLM...' : 'Synthesize Bloom-Tiered Evaluation'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Accordion: View Ingested Statutory Text */}
        <div className="mt-5 border-t border-[#f0e6dc] pt-3">
          <button
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>📜 View Ingested Statutory Text ({documentText.length} characters)</span>
            {accordionOpen ? <ChevronUp className="w-4 h-4 text-[#f58220]" /> : <ChevronDown className="w-4 h-4 text-[#1d5ba5]" />}
          </button>

          {accordionOpen && (
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              rows={8}
              className="mt-2 w-full rounded-xl border border-[#f0e6dc] bg-[#fdf8f3]/40 p-3 font-mono text-xs text-slate-800 focus:border-[#1d5ba5] focus:outline-none"
            />
          )}
        </div>

      </div>

      {/* Assessment Question Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1d5ba5]" />
            <span>Interactive Statutory Knowledge Validation</span>
          </h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-[#f58220] border border-orange-200">
            {questions.length} Items Loaded
          </span>
        </div>

        {loading ? (
          /* Loading Skeletons */
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[#f0e6dc] bg-white p-5 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-3.5 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border border-[#f0e6dc] bg-white p-12 text-center text-slate-500">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Assessment Synthesized Yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Synthesize Bloom-Tiered Evaluation" above to extract psychometric questions from statutory text.
            </p>
          </div>
        ) : (
          questions.map((q, qIndex) => {
            const chosen = selectedAnswers[q.question_id];
            const isVerified = verifiedAnswers[q.question_id];

            // Normalize checking
            const isCorrect = isVerified && (
              chosen === q.correct_answer ||
              chosen?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim()
            );

            return (
              <div
                key={q.question_id}
                className="rounded-2xl border border-[#f0e6dc] bg-white p-6 shadow-sm space-y-4"
              >
                {/* Badge & Question ID */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#fdf8f3] text-slate-700 border border-[#f0e6dc]">
                      {q.question_id || `Q-${qIndex + 1}`}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getBadgeStyle(q.bloom_level)}`}>
                      {q.bloom_level}
                    </span>
                  </div>

                  {isVerified && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{isCorrect ? 'Correct Response' : 'Incorrect Response'}</span>
                    </span>
                  )}
                </div>

                {/* Question Stem */}
                <h4 className="text-sm font-bold text-slate-900 leading-relaxed">
                  {qIndex + 1}. {q.stem}
                </h4>

                {/* Radio Options Group */}
                <div className="space-y-2">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = chosen === opt;
                    return (
                      <label
                        key={optIndex}
                        onClick={() => handleSelectOption(q.question_id, opt)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#f58220] bg-orange-50/40 text-slate-900 font-semibold shadow-xs'
                            : 'border-[#f0e6dc] hover:border-slate-300 bg-[#fdf8f3]/30 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`group_${q.question_id}`}
                          value={opt}
                          checked={isSelected}
                          onChange={() => handleSelectOption(q.question_id, opt)}
                          className="h-4 w-4 text-[#f58220] border-slate-300 focus:ring-[#f58220] accent-[#f58220]"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Verify Button & High-Contrast Explanation Card */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#f0e6dc]">
                  <button
                    onClick={() => handleVerifyAnswer(q.question_id)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1d5ba5] text-white text-xs font-bold hover:bg-[#164a87] transition-all shadow-sm self-start"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-blue-200" />
                    <span>Verify Answer</span>
                  </button>

                  {isVerified && (
                    <div className="w-full mt-2 sm:mt-0 p-4 rounded-xl border border-[#f0e6dc] bg-[#fdf8f3] text-xs text-slate-800 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-slate-900">
                        <span>Statutory Citation & Rationale:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{q.rationale}</p>
                      <p className="text-slate-800 font-semibold pt-1">
                        <b>Correct Option:</b> {q.correct_answer}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
