import React, { useState } from 'react';
import Navbar from './components/Navbar';
import OfficerCompetencyView from './components/OfficerCompetencyView';
import StatutoryAssessment from './components/StatutoryAssessment';
import CadreTelemetryView from './components/CadreTelemetryView';
import RolePickerModal from './components/RolePickerModal';
import Toast from './components/Toast';

const INITIAL_CADRE_ASSESSMENT = {
  title: "Mandatory Statutory Competency Evaluation: MoSPI Field Directives",
  subtitle: "Synthesized from latest NSSTA statutory circulars by Cadre Administration.",
  sourceDocument: "MoSPI_NSSTA_Technical_Compendium_Sample.pdf",
  dispatchedAt: "Active Session",
  questions: [
    {
      id: "KSI-001",
      level: "Level 1: Recall",
      domain: "Statistical Theory & National Accounts",
      question: "What does Gross Value Added (GVA) at basic prices measure according to the System of National Accounts (SNA 2008) adopted by MoSPI?",
      options: [
        "A) The value of output produced less intermediate consumption, incorporating production taxes less production subsidies.",
        "B) The retail market value of household consumption purchases including all distribution markups and transit costs.",
        "C) The aggregate factor cost of labour and capital inputs excluding all indirect taxes and subsidies.",
        "D) The total volume of physical output unadjusted for intermediate raw material consumption."
      ],
      correctIndex: 0,
      citation: "SNA 2008 / NAD: GVA at basic prices is defined as gross output minus intermediate consumption, incorporating production taxes less production subsidies."
    },
    {
      id: "KSI-002",
      level: "Level 2: Conceptual Analysis",
      domain: "Price Statistics",
      question: "How does the Producer Price Index (PPI) conceptually differ from the Consumer Price Index (CPI) in macroeconomic compilation and deflation?",
      options: [
        "A) PPI measures selling prices from the domestic producer perspective at the factory gate, serving as output deflators, whereas CPI measures retail buyer prices.",
        "B) PPI evaluates retail consumer baskets in metropolitan zones while CPI tracks agricultural farmgate transactions.",
        "C) PPI excludes all industrial manufacturing goods while CPI monitors raw mining output exclusively.",
        "D) PPI is calculated without Laspeyres expenditure weighting while CPI uses geometric unweighted averaging."
      ],
      correctIndex: 0,
      citation: "Price Statistics Division: CPI measures retail prices paid by consumers, whereas PPI evaluates price shifts from the perspective of domestic sellers at the factory gate."
    },
    {
      id: "KSI-003",
      level: "Level 3: Procedural Application",
      domain: "Field Operations & Survey Sampling",
      question: "Under FOD sampling methodology for PLFS, when is a supervisor procedurally required to form hamlet-groups in a rural First Stage Unit (FSU)?",
      options: [
        "A) Whenever the estimated population of the FSU reaches or exceeds 1,200 persons (approx. 300 households).",
        "B) Exclusively when satellite imagery indicates non-contiguous agricultural boundaries.",
        "C) Only if the total number of enterprise units in the village exceeds 500 establishments.",
        "D) Whenever the simple random sampling without replacement (SRSWOR) variance exceeds 5%."
      ],
      correctIndex: 0,
      citation: "FOD Survey Sampling Manual: Hamlet-group formation (rural) and sub-block formation (urban) is mandatory whenever the estimated population reaches or exceeds 1,200 persons."
    }
  ]
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto my-8 bg-rose-50 border border-rose-200 rounded-2xl text-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-rose-700 mb-2">Notice: Component Recovery</h2>
          <p className="text-xs text-slate-600 mb-4">
            {this.state.error?.message || 'An unexpected rendering issue occurred on this view.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-[#f58220] text-white font-bold text-xs rounded-full shadow-xs hover:bg-orange-600 cursor-pointer"
          >
            Retry View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Priority 1: View Selector State ('picker', 'officer', 'admin')
  const [role, setRole] = useState(null); // null means landing picker view is shown
  const [activeTab, setActiveTab] = useState('competency');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Shared Cadre Assessment Dispatched by Admin to Officer Portal
  const [cadreAssessment, setCadreAssessment] = useState(() => {
    try {
      const saved = localStorage.getItem('ksi_cadre_assessment');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return INITIAL_CADRE_ASSESSMENT;
  });

  const handleDispatchAssessment = (newAssessment) => {
    setCadreAssessment(newAssessment);
    try {
      localStorage.setItem('ksi_cadre_assessment', JSON.stringify(newAssessment));
    } catch (_) {}
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setShowRoleModal(false);
    if (selectedRole === 'officer') {
      setActiveTab('competency');
      showToast('Switched view to: Officer / Learner (SSO/JSO)', 'info');
    } else if (selectedRole === 'admin') {
      setActiveTab('telemetry');
      showToast('Switched view to: Administrator (Cadre Telemetry & Dispatcher)', 'info');
    }
  };

  // Priority 1: Full-screen landing view before main portal tabs load
  if (!role) {
    return (
      <RolePickerModal
        currentRole={role}
        onSelectRole={handleSelectRole}
        isSwitching={false}
      />
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#fdf8f3] flex flex-col selection:bg-orange-100 selection:text-orange-900 font-sans text-slate-800">
      
      {/* Sticky Sovereign Navigation Bar with viewMode and compact switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={role}
        onSwitchView={() => setShowRoleModal(true)}
      />

      {/* Main View Container bounded to max-w-7xl with ErrorBoundary */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ErrorBoundary>
          {activeTab === 'competency' && <OfficerCompetencyView showToast={showToast} />}
          {activeTab === 'synthesizer' && (
            <StatutoryAssessment
              showToast={showToast}
              cadreAssessment={cadreAssessment}
            />
          )}
          {activeTab === 'telemetry' && role === 'admin' && (
            <CadreTelemetryView
              showToast={showToast}
              cadreAssessment={cadreAssessment}
              onDispatchAssessment={handleDispatchAssessment}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Institutional Sovereign Footer */}
      <footer className="border-t border-[#f0e6dc] bg-white py-4 sm:py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-slate-700 font-medium">
            <span>🇮🇳 Government of India</span>
            <span className="text-[#f58220]">•</span>
            <span>Ministry of Statistics and Programme Implementation (MoSPI)</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-[11px] text-slate-400">
            <span>Mission Karmayogi Bharat</span>
            <span>•</span>
            <span>DPDP 2023 Aligned</span>
            <span>•</span>
            <span className="font-semibold text-slate-600">SIH26101 Final Architecture</span>
          </div>
        </div>
      </footer>

      {/* Role Switcher Modal when toggled from header */}
      {showRoleModal && (
        <RolePickerModal
          currentRole={role}
          onSelectRole={handleSelectRole}
          onClose={() => setShowRoleModal(false)}
          isSwitching={true}
        />
      )}

      {/* Active Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
