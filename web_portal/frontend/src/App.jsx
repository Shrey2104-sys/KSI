import React, { useState } from 'react';
import Navbar from './components/Navbar';
import OfficerCompetencyView from './components/OfficerCompetencyView';
import MCQSynthesizerView from './components/MCQSynthesizerView';
import CadreTelemetryView from './components/CadreTelemetryView';
import Toast from './components/Toast';

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
  const [activeTab, setActiveTab] = useState('competency');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#fdf8f3] flex flex-col selection:bg-orange-100 selection:text-orange-900 font-sans text-slate-800">
      
      {/* Sticky Sovereign Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Container bounded to max-w-7xl with ErrorBoundary */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ErrorBoundary>
          {activeTab === 'competency' && <OfficerCompetencyView showToast={showToast} />}
          {activeTab === 'synthesizer' && <MCQSynthesizerView showToast={showToast} />}
          {activeTab === 'telemetry' && <CadreTelemetryView showToast={showToast} />}
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
            <span>DPDP Act 2023 Certified</span>
            <span>•</span>
            <span className="font-semibold text-slate-600">SIH26101 Final Architecture</span>
          </div>
        </div>
      </footer>

      {/* Active Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
