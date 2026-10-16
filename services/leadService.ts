import type { CalculationResult, CrmStatus, FieldErrors, FormData, LeadInfo } from '../types';

export type CalculateResponse =
  | { ok: true; results: CalculationResult; token: string; crm: CrmStatus }
  | { ok: false; message: string; fieldErrors?: FieldErrors; leadErrors?: FieldErrors };

/**
 * Asks the server for the estimate. The server only returns results if either
 * (a) valid lead details are supplied (it then creates the Salesforce lead), or
 * (b) a valid unlock token from an earlier submission is supplied.
 */
export async function requestEstimate(args: {
  inputs: FormData;
  lead?: LeadInfo;
  token?: string | null;
  honeypot?: string;
}): Promise<CalculateResponse> {
  try {
    const res = await fetch('/.netlify/functions/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: args.inputs,
        lead: args.lead,
        token: args.token ?? undefined,
        website: args.honeypot ?? '',
        pageUrl: document.referrer || window.location.href,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return { ok: true, results: data.results, token: data.token, crm: data.crm };
    }
    return {
      ok: false,
      message: data.error || 'Something went wrong. Please try again.',
      fieldErrors: data.fieldErrors,
      leadErrors: data.leadErrors,
    };
  } catch (err) {
    console.error('Estimate request failed:', err);
    return { ok: false, message: 'We could not reach the calculator. Please check your connection and try again.' };
  }
}
