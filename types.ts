declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export interface FormData {
    chemoChairs: string;
    beds: string;
    state: string;
    oncologists: string;
    edVisits: string;
    is340B: 'yes' | 'no';
}

export interface CalculationInput {
    chemoChairs: number;
    oncologists: number;
    bedCount: number;
    edVisits: number;
    is340b: boolean;
    isMedicaidExpanded: boolean;
}

export interface ServiceLineBreakdown {
    medicalOncology: number;
    infusion: number;
    emergencyDepartment: number;
    inpatient: number;
}

export interface CalculationResult {
    total: number;
    additionalRevenue: number;
    hospitalSavings: number;
    breakdown: ServiceLineBreakdown;
}

/** Contact details collected by the gate before results are shown. */
export interface LeadInfo {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    title: string;
}

export interface State {
    name: string;
    value: string;
    isMedicaidExpanded: boolean;
}

export type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';

export type FieldErrors = Record<string, string>;

/** Outcome of the Salesforce hand-off, reported back by the server function. */
export type CrmStatus = 'ok' | 'failed' | 'skipped' | 'not_needed';
