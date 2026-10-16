import React, { useState, useRef, useCallback, useEffect } from 'react';
import CalculatorForm from './components/CalculatorForm';
import LeadGate from './components/LeadGate';
import ResultsDisplay from './components/ResultsDisplay';
import { BRAND } from './config';
import { STATES } from './constants';
import { validateCalculatorInputs, validateLead } from './services/validation';
import { requestEstimate } from './services/leadService';
import { logToNetlify } from './services/netlifyService';
import { track } from './services/analytics';
import type { FormData, CalculationResult, SubmissionStatus, FieldErrors, LeadInfo } from './types';

// When the calculator is shown inside an iframe on elevatepfs.com (or loaded
// with ?embed=1) the page already has its own header and footer.
const isEmbedded =
  typeof window !== 'undefined' &&
  (window.self !== window.top || new URLSearchParams(window.location.search).get('embed') === '1');

function App() {
  const [formData, setFormData] = useState<FormData>({
    chemoChairs: '',
    beds: '',
    state: '',
    oncologists: '',
    edVisits: '',
    is340B: 'yes',
  });

  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Gate state. `token` is issued by the server after a successful lead
  // submission, so later recalculations in the same visit do not ask again.
  const [token, setToken] = useState<string | null>(null);
  const [showGate, setShowGate] = useState<boolean>(false);
  const [gateStatus, setGateStatus] = useState<SubmissionStatus>('idle');
  const [gateError, setGateError] = useState<string>('');
  const [gateFieldErrors, setGateFieldErrors] = useState<FieldErrors>({});
  const [lead, setLead] = useState<LeadInfo | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Rate-limit friendly unique ID that ties a calculation to its lead record
  const newCalculationId = () => `calc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const scrollToResults = () => {
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      if (error) setError('');
    },
    [error]
  );

  const handleRadioChange = useCallback((value: 'yes' | 'no') => {
    setFormData((prev) => ({ ...prev, is340B: value }));
  }, []);

  const pushRunEvent = (calcId: string, savings: CalculationResult) => {
    const selectedState = STATES.find((s) => s.value === formData.state);
    track('savings_calculator_run', {
      calculator_id: calcId,
      chemo_chairs: Number(formData.chemoChairs),
      oncologists: Number(formData.oncologists),
      beds: Number(formData.beds),
      ed_visits: Number(formData.edVisits),
      state: formData.state,
      medicaid_expanded: selectedState?.isMedicaidExpanded,
      is_340b: formData.is340B,
      total_savings: savings.total,
      additional_revenue: savings.additionalRevenue,
      hospital_savings: savings.hospitalSavings,
    });
  };

  // Step 1: visitor fills in facility details and clicks Calculate
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateCalculatorInputs(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError('Please check the form for errors and try again.');
      return;
    }
    setError('');

    // Not unlocked yet: show the gate instead of results.
    if (!token) {
      setResults(null);
      setShowGate(true);
      setTimeout(() => document.getElementById('lead-gate')?.scrollIntoView({ behavior: 'smooth' }), 100);
      return;
    }

    // Already unlocked this visit: recalculate with the saved token.
    setIsLoading(true);
    const res = await requestEstimate({ inputs: formData, token });
    setIsLoading(false);

    if (!res.ok) {
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      // An expired token falls back to the gate
      setError(res.message);
      setToken(null);
      setShowGate(true);
      return;
    }

    const calcId = newCalculationId();
    setResults(res.results);
    pushRunEvent(calcId, res.results);
    logToNetlify('Recalculation', calcId, formData, res.results, 'not_needed', lead ?? undefined);
    scrollToResults();
  };

  // Step 2: visitor submits the gate form
  const handleGateSubmit = async (leadInfo: LeadInfo, honeypot: string) => {
    const leadErrors = validateLead(leadInfo);
    setGateFieldErrors(leadErrors);
    if (Object.keys(leadErrors).length) {
      setGateError('Please check the highlighted fields and try again.');
      setGateStatus('error');
      return;
    }

    setGateStatus('loading');
    setGateError('');

    const res = await requestEstimate({ inputs: formData, lead: leadInfo, token, honeypot });

    if (!res.ok) {
      if (res.leadErrors) setGateFieldErrors(res.leadErrors);
      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors);
        setShowGate(false);
        setError('Please check the form for errors and try again.');
      }
      setGateError(res.message);
      setGateStatus('error');
      return;
    }

    const calcId = newCalculationId();
    setLead(leadInfo);
    setToken(res.token);
    setResults(res.results);
    setShowGate(false);
    setGateStatus('success');

    pushRunEvent(calcId, res.results);
    track('savings_calculator_conversion', { calculator_id: calcId, conversion_type: 'lead_capture' });

    // Backup copy of the lead (also records whether Salesforce accepted it)
    logToNetlify('Lead Captured', calcId, formData, res.results, res.crm, leadInfo);
    scrollToResults();
  };

  return (
    <div className={`${isEmbedded ? 'bg-transparent' : 'bg-foundation-50 min-h-screen'} font-sans text-foundation-800`}>
      {!isEmbedded && (
        <header className="bg-white py-3 px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <a href={BRAND.homeUrl} aria-label={`${BRAND.fullName} home`}>
              <img src={BRAND.logoSrc} alt={BRAND.fullName} className="h-14 w-auto" />
            </a>
          </div>
        </header>
      )}

      <main className={`${isEmbedded ? 'pt-2 pb-2 px-2' : 'pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8'}`}>
        <div className={`${isEmbedded ? 'w-full' : 'max-w-4xl'} mx-auto ${isEmbedded ? 'mb-2' : 'mb-16'}`}>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-summit-700 p-8 text-white">
              <h1 className="text-2xl font-bold">Hospital Savings Calculator</h1>
              <p className="text-summit-100 mt-1">
                Estimate your potential annual savings with {BRAND.fullName}
              </p>
            </div>
            <CalculatorForm
              formData={formData}
              fieldErrors={fieldErrors}
              onInputChange={handleInputChange}
              onRadioChange={handleRadioChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />
          </div>

          <div ref={resultsRef}>
            {showGate && !results && (
              <LeadGate status={gateStatus} error={gateError} fieldErrors={gateFieldErrors} onSubmit={handleGateSubmit} />
            )}
            {results && !isLoading && <ResultsDisplay results={results} />}
          </div>
        </div>

      </main>

      {!isEmbedded && (
        <footer className="bg-summit-800 text-white mt-16">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm font-medium text-summit-100">
              <a href={BRAND.homeUrl} className="hover:text-white transition-colors">Home</a>
              <a href={BRAND.blogUrl} className="hover:text-white transition-colors">Blog</a>
              <a href={BRAND.privacyUrl} className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
            <div className="text-center text-sm text-summit-200 border-t border-summit-700 pt-8">
              <p>&copy; {new Date().getFullYear()} {BRAND.fullName}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
