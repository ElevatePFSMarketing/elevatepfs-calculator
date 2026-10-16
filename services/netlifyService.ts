import type { CalculationResult, CrmStatus, FormData, LeadInfo } from '../types';

/**
 * Backup copy of every captured lead in Netlify Forms (Forms > calculator_logs).
 * If the Salesforce hand-off ever fails, the lead is still recoverable here.
 * Field names must match public/__forms.html.
 */
export const logToNetlify = async (
  action: 'Lead Captured' | 'Recalculation',
  calculationId: string,
  formData: FormData,
  results: CalculationResult,
  crmStatus: CrmStatus,
  lead?: LeadInfo
): Promise<void> => {
  const body = new URLSearchParams();
  body.append('form-name', 'calculator_logs');
  body.append('calculationId', calculationId);
  body.append('action', action);
  body.append('timestamp', new Date().toISOString());
  body.append('crmStatus', crmStatus);

  if (lead) {
    body.append('firstName', lead.firstName);
    body.append('lastName', lead.lastName);
    body.append('email', lead.email);
    body.append('hospitalName', lead.company);
    body.append('jobTitle', lead.title);
  }

  body.append('chemoChairs', formData.chemoChairs);
  body.append('oncologists', formData.oncologists);
  body.append('beds', formData.beds);
  body.append('edVisits', formData.edVisits);
  body.append('state', formData.state);
  body.append('is340B', formData.is340B);

  body.append('totalSavings', results.total.toString());
  body.append('additionalRevenue', results.additionalRevenue.toString());
  body.append('hospitalSavings', results.hospitalSavings.toString());

  try {
    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (error) {
    console.warn('Failed to log to Netlify:', error);
  }
};
