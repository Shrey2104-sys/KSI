import React, { useState } from 'react';
import {
  FileText,
  FileCheck2,
  CheckCircle2,
  XCircle,
  BookOpen,
  Award,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  Clock,
} from 'lucide-react';

export default function StatutoryAssessment({ cadreAssessment, showToast }) {
  const [answers, setAnswers] = useState({}); // { [questionId]: optionIndex }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState({});

  const questions = cadreAssessment?.questions || [];
  const moduleTitle = cadreAssessment?.title || "Mandatory Statutory Competency Evaluation: MoSPI Field Directives";
  const moduleSubtitle = cadreAssessment?.subtitle || "Synthesized from latest NSSTA statutory circulars by Cadre Administration.";
  const sourceDoc = cadreAssessment?.sourceDocument || "MoSPI_NSSTA_Technical_Compendium_Sample.pdf";
  const dispatchedTime = cadreAssessment?.dispatchedAt || "Active Session";

  const handleSelectOption = (questionId, optionIndex) => {
    if (isSubmitted) return; // Locked once submitted
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const toggleCitation = (questionId) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Master submission action
  const handleSubmitAssessment = () => {
    if (questions.length === 0) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      if (showToast) {
        showToast(`Please respond to all ${questions.length} statutory evaluation items before submitting`, 'error');
      }
      return;
    }

    setIsSubmitted(true);

    // Expand statutory citation accordion for every question
    const allExpanded = {};
    questions.forEach((q) => {
      allExpanded[q.id] = true;
    });
    setExpandedCitations(allExpanded);

    const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;
    if (showToast) {
      showToast(`Evaluation completed: ${correctCount}/${questions.length} correct responses verified`, 'success');
    }
  };

  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;

  const getBloomBadgeStyle = (levelStr = '') => {
    const lower = levelStr.toLowerCase();
    if (lower.includes('level 1') || lower.includes('recall')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    }
    if (lower.includes('level 2') || lower.includes('analysis') || lower.includes('concept')) {
      return 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
    }
    return 'bg-purple-50 text-purple-800 border-purple-300 font-bold';
  };

  return (
    <div className="space-y-6">
      
      {/* Module Header Card (Assigned Statutory Module) */}
      <div className="rounded-2xl border border-[#f0e6dc] bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#1d5ba5]/10 flex items-center justify-center text-[#1d5ba5]">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {moduleTitle}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-[#f58220] border border-orange-200">
                    Assigned Module
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {moduleSubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fdf8f3] text-slate-700 border border-[#f0e6dc] font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#1d5ba5]" />
              <span className="truncate max-w-[200px]">Doc: {sourceDoc}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fdf8f3] text-slate-700 border border-[#f0e6dc] font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dispatched: {dispatchedTime}</span>
            </div>
          </div>
        </div>

        {/* Cadre Directive Information Strip */}
        <div className="mt-4 p-3.5 rounded-xl border border-[#f0e6dc] bg-[#fdf8f3]/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#1d5ba5]" />
            <span>Target Cadre: <b>Indian Statistical Service (ISS) / Subordinate Statistical Service (SSS)</b></span>
          </div>
          <div className="text-[11px] text-slate-500">
            Psychometric Bloom Validation: <b>Recall (L1) • Analysis (L2) • Application (L3)</b>
          </div>
        </div>
      </div>

      {/* Holding State: If no assessment has been dispatched */}
      {questions.length === 0 ? (
        <div className="rounded-2xl border border-[#f0e6dc] bg-white p-12 text-center text-slate-500 space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No Pending Evaluations Dispatched
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Check back once NSSTA Cadre Administration publishes new gazette directives or dispatches an assessment from the Administrator portal.
          </p>
        </div>
      ) : (
        /* Interactive Assessment Question Cards */
        <div className="space-y-5">
          
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1d5ba5]" />
              <span>Interactive Statutory Competency Assessment</span>
            </h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-[#f58220] border border-orange-200">
              {questions.length} Items Assigned
            </span>
          </div>

          {/* Question Cards */}
          {questions.map((q, qIndex) => {
            const chosenIndex = answers[q.id];
            const isAnswered = chosenIndex !== undefined;
            const isCorrect = isSubmitted && chosenIndex === q.correctIndex;
            const isCitationOpen = !!expandedCitations[q.id];

            return (
              <div
                key={q.id || qIndex}
                className={`rounded-2xl border bg-white p-6 shadow-sm transition-all space-y-4 ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-rose-200 bg-rose-50/10'
                    : 'border-[#f0e6dc]'
                }`}
              >
                {/* Question Header & Bloom Tier */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#fdf8f3] text-slate-700 border border-[#f0e6dc]">
                      {q.id || `KSI-00${qIndex + 1}`}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getBloomBadgeStyle(q.level)}`}>
                      {q.level}
                    </span>
                    {q.domain && (
                      <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">
                        • {q.domain}
                      </span>
                    )}
                  </div>

                  {/* Submission Status Pill */}
                  {isSubmitted && (
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
                  {qIndex + 1}. {q.question}
                </h4>

                {/* Radio Options Group */}
                <div className="space-y-2.5">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = chosenIndex === optIndex;
                    const isOptionCorrect = q.correctIndex === optIndex;

                    let optionClasses = 'border-[#f0e6dc] bg-[#fdf8f3]/30 text-slate-700 hover:border-slate-300';

                    if (isSubmitted) {
                      if (isOptionCorrect) {
                        optionClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold shadow-xs';
                      } else if (isSelected && !isOptionCorrect) {
                        optionClasses = 'border-rose-500 bg-rose-50 text-rose-950 font-semibold shadow-xs';
                      } else {
                        optionClasses = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                      }
                    } else if (isSelected) {
                      optionClasses = 'border-[#f58220] bg-orange-50/60 text-slate-900 font-semibold shadow-xs';
                    }

                    return (
                      <label
                        key={optIndex}
                        onClick={() => handleSelectOption(q.id, optIndex)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs transition-all ${
                          isSubmitted ? 'cursor-default' : 'cursor-pointer'
                        } ${optionClasses}`}
                      >
                        <input
                          type="radio"
                          name={`quiz_${q.id}`}
                          value={optIndex}
                          checked={isSelected}
                          disabled={isSubmitted}
                          onChange={() => handleSelectOption(q.id, optIndex)}
                          className="mt-0.5 h-4 w-4 text-[#f58220] border-slate-300 focus:ring-[#f58220] accent-[#f58220] disabled:opacity-75"
                        />
                        <span className="flex-1 leading-relaxed">{opt}</span>
                        {isSubmitted && isOptionCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {isSubmitted && isSelected && !isOptionCorrect && (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Citation Accordion */}
                <div className="pt-2 border-t border-[#f0e6dc]">
                  <button
                    type="button"
                    onClick={() => toggleCitation(q.id)}
                    className="flex items-center justify-between w-full text-xs font-bold text-[#1d5ba5] hover:text-[#164a87] cursor-pointer"
                  >
                    <span>📜 Statutory Citation & Compendium Rationale</span>
                    {isCitationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isCitationOpen && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-[#fdf8f3] border border-[#f0e6dc] text-xs text-slate-700 leading-relaxed">
                      <p className="font-semibold text-slate-900 mb-1">Source Citation:</p>
                      <p>{q.citation}</p>
                      {isSubmitted && (
                        <p className="mt-2 font-bold text-emerald-800">
                          Verified Correct Choice: Option {String.fromCharCode(65 + q.correctIndex)} — {q.options[q.correctIndex]}
                        </p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}

          {/* Master Submission Button */}
          {!isSubmitted && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSubmitAssessment}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#1d5ba5] hover:bg-[#164a87] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-blue-200" />
                <span>Submit Competency Assessment</span>
              </button>
            </div>
          )}

          {/* Completion Summary Card */}
          {isSubmitted && (
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-6 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-emerald-950">
                      Assessment Complete — {correctCount}/{questions.length} Verified
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                      Psychometric statutory evaluation verified against MoSPI compendium standards.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-emerald-900">
                    {Math.round((correctCount / questions.length) * 100)}%
                  </span>
                  <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                    Score Attainment
                  </p>
                </div>
              </div>

              {/* Itemized Bloom-Tier Breakdown */}
              <div className="border-t border-emerald-200/80 pt-3 space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                  Itemized Bloom-Tier Breakdown:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {questions.map((q, idx) => {
                    const isQCorrect = answers[q.id] === q.correctIndex;
                    return (
                      <div
                        key={q.id || idx}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          isQCorrect
                            ? 'bg-white border-emerald-300 text-emerald-900'
                            : 'bg-white border-rose-300 text-rose-900'
                        }`}
                      >
                        <span className="font-bold">{q.level}</span>
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${
                            isQCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isQCorrect ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Correct</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Incorrect</span>
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
