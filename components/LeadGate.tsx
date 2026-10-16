import React, { useState } from 'react';
import type { FieldErrors, LeadInfo, SubmissionStatus } from '../types';
import { BRAND, CONSENT_TEXT } from '../config';
import { SpinnerIcon } from './icons';

interface LeadGateProps {
  status: SubmissionStatus;
  error: string;
  fieldErrors: FieldErrors;
  onSubmit: (lead: LeadInfo, honeypot: string) => void;
}

const baseInput =
  'w-full px-4 py-3 bg-white border-2 rounded-lg transition focus:ring-summit-500 focus:border-summit-500 text-foundation-900 placeholder-foundation-400 disabled:opacity-50';

const Field: React.FC<{
  id: keyof LeadInfo;
  label: string;
  type?: string;
  autoComplete?: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (v: string) => void;
}> = ({ id, label, type = 'text', autoComplete, value, error, disabled, onChange }) => (
  <div>
    <label htmlFor={`gate-${id}`} className="block text-sm font-medium text-foundation-700 mb-1">
      {label}
    </label>
    <input
      id={`gate-${id}`}
      name={id}
      type={type}
      autoComplete={autoComplete}
      required
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseInput} ${error ? 'border-red-500' : 'border-foundation-200'}`}
    />
    {error && <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>}
  </div>
);

const LeadGate: React.FC<LeadGateProps> = ({ status, error, fieldErrors, onSubmit }) => {
  const [lead, setLead] = useState<LeadInfo>({ firstName: '', lastName: '', email: '', company: '', title: '' });
  const [honeypot, setHoneypot] = useState('');
  const loading = status === 'loading';

  const set = (key: keyof LeadInfo) => (v: string) => setLead((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        firstName: lead.firstName.trim(),
        lastName: lead.lastName.trim(),
        email: lead.email.trim(),
        company: lead.company.trim(),
        title: lead.title.trim(),
      },
      honeypot
    );
  };

  return (
    <div className="mt-8 sm:mt-12 bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up" id="lead-gate">
      <div className="bg-summit-700 px-6 py-6 sm:px-10 text-white text-center">
        <h3 className="text-2xl font-bold">Your estimate is ready</h3>
        <p className="mt-1 text-summit-100">Tell us a little about you to view your results.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-10" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <Field id="firstName" label="First name" autoComplete="given-name" value={lead.firstName} error={fieldErrors.firstName} disabled={loading} onChange={set('firstName')} />
          <Field id="lastName" label="Last name" autoComplete="family-name" value={lead.lastName} error={fieldErrors.lastName} disabled={loading} onChange={set('lastName')} />
          <div className="sm:col-span-2">
            <Field id="email" label="Work email" type="email" autoComplete="email" value={lead.email} error={fieldErrors.email} disabled={loading} onChange={set('email')} />
          </div>
          <Field id="company" label="Hospital or health system" autoComplete="organization" value={lead.company} error={fieldErrors.company} disabled={loading} onChange={set('company')} />
          <Field id="title" label="Job title" autoComplete="organization-title" value={lead.title} error={fieldErrors.title} disabled={loading} onChange={set('title')} />
        </div>

        {/* Honeypot: hidden from people, tempting to bots */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
          <label htmlFor="gate-website">Website</label>
          <input id="gate-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center font-medium" role="alert">
            {error}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center bg-advocacy-500 text-white text-lg font-bold py-4 px-10 rounded-xl hover:bg-advocacy-600 transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
          >
            {loading ? <SpinnerIcon className="animate-spin h-6 w-6 text-white" /> : 'View my estimate'}
          </button>
          <p className="mt-4 text-xs text-foundation-600 max-w-xl mx-auto">
            {CONSENT_TEXT}{' '}
            <a href={BRAND.privacyUrl} target="_blank" rel="noopener noreferrer" className="underline text-summit-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LeadGate;
