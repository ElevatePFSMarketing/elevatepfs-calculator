/**
 * Gate + calculator + Salesforce hand-off, all server-side.
 *
 * Why this exists: the savings math and the lead capture used to run entirely
 * in the browser, which means a "gate" would only be cosmetic (anyone could
 * read the numbers out of the JavaScript bundle or the dev tools). Here the
 * results are only returned once the visitor has supplied valid contact
 * details, and the lead is pushed to Salesforce from the server.
 *
 * Environment variables (Netlify > Site configuration > Environment variables):
 *   GATE_SECRET          Required. Long random string used to sign unlock tokens.
 *   SF_OID               Required for Salesforce. Your org's 15/18-character ID
 *                        (from Setup > Web-to-Lead > Create Web-to-Lead Form).
 *   SF_WEBTOLEAD_URL     Optional. Defaults to production. For a sandbox use
 *                        https://test.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8
 *   SF_LEAD_SOURCE       Optional. Defaults to "Web". Must be a valid Lead Source value.
 *   SF_CAMPAIGN_ID       Optional. Adds the lead to a Campaign.
 *   SF_CUSTOM_FIELDS     Optional. JSON map of calculator values -> Salesforce custom
 *                        field IDs, e.g. {"chemoChairs":"00N5e00000AbCdE", ...}.
 *                        Valid keys: chemoChairs, oncologists, beds, edVisits, state,
 *                        is340B, totalSavings, additionalRevenue, hospitalSavings.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { calculateSavings } from '../../services/calculatorService';
import { validateCalculatorInputs, validateLead } from '../../services/validation';
import { STATES } from '../../constants';
import type { CalculationResult, CrmStatus, FormData, LeadInfo } from '../../types';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 6; // unlock lasts 6 hours

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// ---------- unlock token (HMAC-signed, no database needed) ----------

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url');

function issueToken(secret: string): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function tokenIsValid(token: unknown, secret: string): boolean {
  if (typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

// ---------- Salesforce Web-to-Lead ----------

const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

async function sendToSalesforce(
  lead: LeadInfo,
  formData: FormData,
  results: CalculationResult,
  pageUrl: string
): Promise<CrmStatus> {
  const oid = process.env.SF_OID;
  if (!oid) {
    console.error('[calculate] SF_OID is not set. Lead was NOT sent to Salesforce.');
    return 'skipped';
  }

  const stateName = STATES.find((s) => s.value === formData.state)?.name ?? formData.state;

  const params = new URLSearchParams();
  params.set('oid', oid);
  params.set('first_name', lead.firstName.trim());
  params.set('last_name', lead.lastName.trim());
  params.set('email', lead.email.trim());
  params.set('company', lead.company.trim());
  params.set('title', lead.title.trim());
  params.set('lead_source', process.env.SF_LEAD_SOURCE || 'Web');
  if (process.env.SF_CAMPAIGN_ID) {
    params.set('Campaign_ID', process.env.SF_CAMPAIGN_ID);
    params.set('member_status', 'Responded');
  }

  // The standard Description field works with zero Salesforce setup. Custom
  // fields (below) are optional and better for reporting.
  params.set(
    'description',
    [
      'Source: ElevatePFS Hospital Savings Calculator',
      pageUrl ? `Page: ${pageUrl}` : '',
      '',
      'Inputs',
      `  State: ${stateName}`,
      `  Chemo/infusion chairs: ${formData.chemoChairs}`,
      `  Medical oncologists: ${formData.oncologists}`,
      `  Beds: ${formData.beds}`,
      `  Annual ED visits: ${formData.edVisits}`,
      `  340B eligible: ${formData.is340B === 'yes' ? 'Yes' : 'No'}`,
      '',
      'Estimate shown to visitor',
      `  Total estimated annual savings: ${usd(results.total)}`,
      `  Additional hospital revenue: ${usd(results.additionalRevenue)}`,
      `  Hospital savings: ${usd(results.hospitalSavings)}`,
    ]
      .filter((l) => l !== undefined)
      .join('\n')
  );

  // Optional custom-field mapping
  try {
    const map: Record<string, string> = JSON.parse(process.env.SF_CUSTOM_FIELDS || '{}');
    const values: Record<string, string> = {
      chemoChairs: formData.chemoChairs,
      oncologists: formData.oncologists,
      beds: formData.beds,
      edVisits: formData.edVisits,
      state: stateName,
      is340B: formData.is340B === 'yes' ? 'Yes' : 'No',
      totalSavings: String(results.total),
      additionalRevenue: String(results.additionalRevenue),
      hospitalSavings: String(results.hospitalSavings),
    };
    for (const [key, fieldId] of Object.entries(map)) {
      if (fieldId && key in values) params.set(fieldId, values[key]);
    }
  } catch (err) {
    console.error('[calculate] SF_CUSTOM_FIELDS is not valid JSON; skipping custom fields.', err);
  }

  const url =
    process.env.SF_WEBTOLEAD_URL || 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: params.toString(),
      redirect: 'manual', // Salesforce answers with a redirect on success
    });
    // Web-to-Lead does not return a detailed success/failure body. Anything
    // below 400 means Salesforce accepted the request.
    if (res.status < 400) return 'ok';
    console.error('[calculate] Salesforce Web-to-Lead returned status', res.status);
    return 'failed';
  } catch (err) {
    console.error('[calculate] Salesforce Web-to-Lead request failed', err);
    return 'failed';
  }
}

// ---------- handler ----------

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });

  const secret = process.env.GATE_SECRET;
  if (!secret) {
    console.error('[calculate] GATE_SECRET is not set.');
    return json(500, { error: 'The calculator is not configured yet. Please try again later.' });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid request.' });
  }

  // Honeypot: real visitors never see or fill this field.
  if (typeof body?.website === 'string' && body.website.trim() !== '') {
    return json(400, { error: 'Invalid request.' });
  }

  const formData: FormData = {
    chemoChairs: String(body?.inputs?.chemoChairs ?? ''),
    oncologists: String(body?.inputs?.oncologists ?? ''),
    beds: String(body?.inputs?.beds ?? ''),
    edVisits: String(body?.inputs?.edVisits ?? ''),
    state: String(body?.inputs?.state ?? ''),
    is340B: body?.inputs?.is340B === 'no' ? 'no' : 'yes',
  };

  const inputErrors = validateCalculatorInputs(formData);
  if (Object.keys(inputErrors).length) return json(422, { fieldErrors: inputErrors });

  const unlocked = tokenIsValid(body?.token, secret);
  let crm: CrmStatus = 'not_needed';
  let token: string = unlocked ? (body.token as string) : '';

  const state = STATES.find((s) => s.value === formData.state)!;
  const results = calculateSavings({
    chemoChairs: Math.floor(Math.abs(Number(formData.chemoChairs))),
    oncologists: Math.floor(Math.abs(Number(formData.oncologists))),
    bedCount: Math.floor(Math.abs(Number(formData.beds))),
    edVisits: Math.floor(Math.abs(Number(formData.edVisits))),
    is340b: formData.is340B === 'yes',
    isMedicaidExpanded: state.isMedicaidExpanded,
  });

  if (!unlocked) {
    const lead: LeadInfo = {
      firstName: String(body?.lead?.firstName ?? ''),
      lastName: String(body?.lead?.lastName ?? ''),
      email: String(body?.lead?.email ?? ''),
      company: String(body?.lead?.company ?? ''),
      title: String(body?.lead?.title ?? ''),
    };
    const leadErrors = validateLead(lead);
    if (Object.keys(leadErrors).length) return json(422, { leadErrors });

    const pageUrl = String(body?.pageUrl ?? '').slice(0, 300);
    crm = await sendToSalesforce(lead, formData, results, pageUrl);
    token = issueToken(secret);
  }

  return json(200, { results, token, crm });
};
