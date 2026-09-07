import React from 'react';
import { UserCheck, FileText, LayoutDashboard, ShieldCheck, Cpu, ArrowLeftRight } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, viewMode = 'officer', onSwitchView }) {
  const allTabs = [
    { id: 'competency', label: 'Officer Competency & Pathways', shortLabel: 'Competency', icon: UserCheck },
    { id: 'synthesizer', label: 'Statutory Assessment Synthesizer', shortLabel: 'Assessment', icon: FileText },
    { id: 'telemetry', label: 'Directorate Cadre Telemetry', shortLabel: 'Telemetry', icon: LayoutDashboard },
  ];

  // Priority 1: If "Officer / Learner": Render ONLY "Competency & Pathways" and "Assessment Synthesizer"; hide Telemetry
  const tabs = viewMode === 'officer'
    ? allTabs.filter((t) => t.id !== 'telemetry')
    : allTabs;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#f0e6dc] bg-white/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Responsive Navbar Bar */}
        <div className="flex flex-col sm:flex-row sm:h-20 sm:items-center sm:justify-between py-2.5 sm:py-0 gap-2.5 sm:gap-4">
          
          {/* Left Brand with iGOT Karmayogi Bharat Motif */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2.5">
              {/* Emblem Badge */}
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1d5ba5] to-[#15457e] text-white font-serif font-bold text-base sm:text-xl shadow-sm border border-[#1d5ba5] shrink-0">
                <span className="text-amber-400">🏛️</span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight">
                    <span className="sm:hidden">KSI - MoSPI</span>
                    <span className="hidden sm:inline">Karmayogi Statistical Intelligence (KSI) - MoSPI</span>
                  </span>
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-[#f58220] border border-orange-200">
                    iGOT Bharat
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                  Ministry of Statistics & Programme Implementation • Official Cadre Portal
                </p>
              </div>
            </div>

            {/* Mobile Switch View and micro badge */}
            <div className="sm:hidden flex items-center gap-1.5">
              <button
                type="button"
                onClick={onSwitchView}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fdf8f3] text-[#f58220] border border-orange-200 text-[10px] font-bold"
                title="Switch View"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Switch View</span>
              </button>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>DPDP 2023 Aligned</span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs (Pill style, horizontally scrollable on small mobile screens) */}
          <nav className="flex items-center gap-1 bg-[#fdf8f3] p-1 rounded-full border border-[#f0e6dc] overflow-x-auto max-w-full no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm rounded-full transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#f58220] text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-[#f58220] hover:bg-orange-50/70 font-medium'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="hidden lg:inline">{tab.label}</span>
                  <span className="lg:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Far-Right Controls: Seamless View Switcher & System Telemetry Badges */}
          <div className="hidden sm:flex items-center gap-2.5 text-xs">
            {/* Priority 1: Compact Switch View button */}
            <button
              type="button"
              onClick={onSwitchView}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fdf8f3] hover:bg-orange-50 text-[#1d5ba5] hover:text-[#f58220] border border-[#f0e6dc] hover:border-orange-300 font-bold transition-all shadow-xs cursor-pointer"
              title="Switch role view without reloading"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#f58220]" />
              <span>Switch View ({viewMode === 'admin' ? 'Admin' : 'Officer'})</span>
            </button>

            {/* Priority 4: DPDP Header Badge strictly "DPDP 2023 Aligned" */}
            <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-emerald-800 border border-emerald-200 shadow-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>DPDP 2023 Aligned</span>
            </div>

            <div className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-amber-800 border border-amber-200 shadow-xs font-mono text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-[#1d5ba5]" />
              <span>qwen2.5:7b (Local Air-Gapped)</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
