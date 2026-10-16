import React from 'react';
import type { CalculationResult } from '../types';
import { ESTIMATE_DISCLAIMER } from '../config';
import AnimatedNumber from './AnimatedNumber';

interface ResultsDisplayProps {
  results: CalculationResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const serviceLines = [
    { label: 'Medical Oncology Savings', value: results.breakdown.medicalOncology },
    { label: 'Infusion Services Savings', value: results.breakdown.infusion },
    { label: 'Emergency Department Savings', value: results.breakdown.emergencyDepartment },
    { label: 'Inpatient Services Savings', value: results.breakdown.inpatient },
  ];

  return (
    <div className="mt-8 sm:mt-12 p-6 sm:p-10 bg-white rounded-2xl shadow-2xl animate-fade-in-up">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-summit-700 tracking-wide uppercase">Your Estimated Annual Savings</h3>
        <p className="mt-4 text-6xl font-extrabold text-advocacy-600 tracking-tight">
          <AnimatedNumber value={results.total} />
        </p>
        <p className="mt-3 text-sm text-foundation-600">
          Estimated annual recovery on new patient volume. Excludes retroactive.
        </p>
      </div>

      <div className="mt-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceLines.map((line) => (
            <div key={line.label} className="bg-foundation-50 p-6 rounded-xl border border-foundation-200">
              <h4 className="text-sm font-medium text-foundation-600">{line.label}</h4>
              <p className="mt-2 text-3xl font-bold text-foundation-800">
                <AnimatedNumber value={line.value} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs text-center text-foundation-600 max-w-2xl mx-auto">{ESTIMATE_DISCLAIMER}</p>

    </div>
  );
};

export default ResultsDisplay;
