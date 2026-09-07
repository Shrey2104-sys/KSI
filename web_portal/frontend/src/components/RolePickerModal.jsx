import React from 'react';
import { UserCheck, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function RolePickerModal({ currentRole, onSelectRole, onClose, isSwitching = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-[#f0e6dc] bg-[#fdf8f3] p-6 sm:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header & Insignia */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100 text-[#f58220] border border-orange-200 text-xs font-extrabold uppercase tracking-wider">
            <span>🏛️ Prototype View Selector</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Karmayogi Statistical Intelligence (KSI)
          </h1>
          <p className="text-sm font-semibold text-[#1d5ba5]">
            Ministry of Statistics & Programme Implementation (MoSPI) • Government of India
          </p>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto pt-1 font-medium">
            Select how you'd like to view this prototype
          </p>
        </div>

        {/* Dual Selection Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card 1: Officer / Learner */}
          <div
            onClick={() => onSelectRole('officer')}
            className={`group relative rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between ${
              currentRole === 'officer'
                ? 'border-[#f58220] bg-white shadow-md'
                : 'border-[#f0e6dc] bg-white hover:border-[#f58220]/60 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#f58220] border border-orange-200 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Individual Learner
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Continue as Officer / Learner
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Access individual competency profiles, evaluate personal skill radar against promotional benchmarks, and take Bloom-tiered statutory assessments.
              </p>

              <div className="pt-2 space-y-1.5 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Personal Competency Radar & Attainment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cadre Benchmark L2 Vector Gap Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Interactive Statutory Circular Quiz Synthesizer</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('officer');
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#f58220] hover:bg-[#e07116] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <span>Continue as Officer / Learner</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Card 2: Administrator */}
          <div
            onClick={() => onSelectRole('admin')}
            className={`group relative rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between ${
              currentRole === 'admin'
                ? 'border-[#1d5ba5] bg-white shadow-md'
                : 'border-[#f0e6dc] bg-white hover:border-[#1d5ba5]/60 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1d5ba5] border border-blue-200 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Institutional Authority
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Continue as Administrator
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Oversee directorate-level cadre analytics across MoSPI formations (FOD, NAD, PSD), track systemic domain deficits, and issue upskilling directives.
              </p>

              <div className="pt-2 space-y-1.5 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Cadre Directorate Telemetry & Heatmaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Technical Tools Deficit Surveillance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Automated Cadre Upskilling Interventions</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('admin');
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1d5ba5] hover:bg-[#164a87] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <span>Continue as Administrator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>

        {/* Explicit View Selector Notice */}
        <div className="mt-8 pt-4 border-t border-[#f0e6dc] text-center space-y-1">
          <p className="text-xs font-bold text-slate-700">
            VIEW SELECTOR ONLY
          </p>
          <p className="text-[11px] text-slate-500">
            This prototype operates without email, username, or password inputs. Switch views at any time via the top navigation bar.
          </p>
          {isSwitching && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Close and remain in current view
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
