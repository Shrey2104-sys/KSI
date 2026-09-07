import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Clock,
  AlertTriangle,
  Award,
  Send,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { fetchCadreTelemetry } from '../services/api';
import AdminIngestionPanel from './AdminIngestionPanel';

export default function CadreTelemetryView({ showToast, cadreAssessment, onDispatchAssessment }) {
  const [telemetry, setTelemetry] = useState({
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
  });

  const [directiveIssued, setDirectiveIssued] = useState(false);

  useEffect(() => {
    async function loadTelemetry() {
      try {
        const data = await fetchCadreTelemetry();
        if (data && data.records) {
          setTelemetry(data);
        }
      } catch (err) {
        console.warn('Backend unavailable, using seeded telemetry:', err);
      }
    }
    loadTelemetry();
  }, []);

  const handleIssueDirective = () => {
    setDirectiveIssued(true);
    showToast('Cadre Upskilling Directive dispatched to FOD regional directors', 'success');
  };

  // Color cell helper based on score tiers:
  // Emerald >= 75, Amber 55-74, Rose < 55
  const getScoreCellClass = (score) => {
    if (score >= 75) {
      return 'bg-emerald-50 text-emerald-800 font-bold border-emerald-200';
    }
    if (score >= 55) {
      return 'bg-amber-50 text-amber-800 font-semibold border-amber-200';
    }
    return 'bg-rose-50 text-rose-700 font-bold border-rose-200';
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="rounded-2xl border border-[#f0e6dc] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1d5ba5]/10 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-[#1d5ba5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Directorate Cadre Telemetry & Strategic Heatmap
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time institutional oversight across MoSPI field directorates, statistical divisions, and training academies.
            </p>
          </div>
        </div>
      </div>

      {/* Official iGOT Stats Ribbon (Continuous Royal Blue Ribbon) */}
      <div className="rounded-2xl bg-[#1d5ba5] text-white p-6 shadow-md border border-[#164a87]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
          
          {/* KPI 1: Directorates Tracked */}
          <div className="pt-4 sm:pt-0 sm:px-4 first:pl-0">
            <div className="flex items-center justify-between text-blue-100 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Directorates Tracked</span>
              <Building2 className="w-4 h-4 text-[#f58220]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {telemetry.kpis?.directorates_tracked || 4}
              </span>
              <span className="text-xs text-blue-100 font-medium">Divisions</span>
            </div>
            <p className="text-[11px] text-blue-200/80 mt-1">FOD, NAD, PSD, Training</p>
          </div>

          {/* KPI 2: Mean iGOT Hours */}
          <div className="pt-4 sm:pt-0 sm:px-4">
            <div className="flex items-center justify-between text-blue-100 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Mean iGOT Hours</span>
              <Clock className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {telemetry.kpis?.mean_igot_hours ? `${telemetry.kpis.mean_igot_hours} hrs` : '25.6 hrs'}
              </span>
            </div>
            <p className="text-[11px] text-blue-200/80 mt-1">Across active formations</p>
          </div>

          {/* KPI 3: Critical Domain Deficit */}
          <div className="pt-4 sm:pt-0 sm:px-4">
            <div className="flex items-center justify-between text-blue-100 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Critical Domain Deficit</span>
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            </div>
            <div className="mt-1">
              <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-300/30">
                Technical Tools (Python, R, SQL, GIS)
              </span>
            </div>
            <p className="text-[11px] text-rose-200 font-semibold mt-1">
              Cadre avg: {telemetry.kpis?.critical_domain_average || 60.0} pts
            </p>
          </div>

          {/* KPI 4: SSO Benchmark Attainment */}
          <div className="pt-4 sm:pt-0 sm:px-4 last:pr-0">
            <div className="flex items-center justify-between text-blue-100 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">SSO Benchmark Attainment</span>
              <Award className="w-4 h-4 text-[#f58220]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {telemetry.kpis?.sso_benchmark_attainment_pct ? `${telemetry.kpis.sso_benchmark_attainment_pct}%` : '87.6%'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-blue-900/50 rounded-full h-1.5 mt-2 border border-blue-400/20">
              <div
                className="bg-[#f58220] h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, telemetry.kpis?.sso_benchmark_attainment_pct || 87.6)}%` }}
              ></div>
            </div>
          </div>

        </div>
      </div>

      {/* NSSTA Statutory Document Ingestion & Cadre Assessment Dispatcher (Admin Exclusive) */}
      <AdminIngestionPanel
        cadreAssessment={cadreAssessment}
        onDispatchAssessment={onDispatchAssessment}
        showToast={showToast}
      />

      {/* Interactive Directorate Heatmap Table */}
      <div className="rounded-2xl border border-[#f0e6dc] bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#f0e6dc] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-[#1d5ba5]" />
            <h3 className="text-sm font-bold text-slate-900">
              Directorate Competency & Learning Engagement Matrix
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">≥ 75 Target Met</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 font-medium">55–74 Moderate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-600 font-medium">&lt; 55 Critical Deficit</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1d5ba5] text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Directorate / Formation</th>
                <th className="px-5 py-3.5 text-center">Statistical Theory & NA</th>
                <th className="px-5 py-3.5 text-center">Technical Tools (Python/R)</th>
                <th className="px-5 py-3.5 text-center">Digital Governance & Privacy</th>
                <th className="px-5 py-3.5 text-center">Managerial Decision Making</th>
                <th className="px-5 py-3.5 text-center">Mean iGOT Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6dc] text-slate-800">
              {telemetry.records.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#fdf8f3] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {row.division}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md border ${getScoreCellClass(row.statistical_theory)} font-mono`}>
                      {row.statistical_theory.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md border ${getScoreCellClass(row.technical_tools)} font-mono`}>
                      {row.technical_tools.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md border ${getScoreCellClass(row.data_privacy)} font-mono`}>
                      {row.data_privacy.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md border ${getScoreCellClass(row.managerial)} font-mono`}>
                      {row.managerial.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-700">
                    {row.avg_igot_hours.toFixed(1)} hrs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisory Strategic Directives Banner */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>Supervisory Strategic Alert: Field Operations Division (FOD) Bottleneck</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed max-w-3xl">
              FOD registers critical deficits in modern computational tools (<b>48.0 &lt; 55.0</b>) coupled with substandard
              iGOT Karmayogi engagement (<b>18.2 hrs &lt; 20.0 hrs threshold</b>). Immediate upskilling intervention in
              spatial GIS sampling and automated survey validation pipelines is required.
            </p>
          </div>

          <button
            onClick={handleIssueDirective}
            disabled={directiveIssued}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all whitespace-nowrap self-start lg:self-center ${
              directiveIssued
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-[#f58220] hover:bg-[#e07116] text-white'
            }`}
          >
            {directiveIssued ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Directive Dispatched</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Issue Automated Cadre Upskilling Directive</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
