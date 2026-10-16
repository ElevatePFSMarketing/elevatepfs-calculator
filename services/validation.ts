// Shared by the browser AND the Netlify function, so the rules the visitor
// sees are exactly the rules the server enforces.
import type { FormData, FieldErrors, LeadInfo } from '../types';
import { FREE_EMAIL_PROVIDERS, STATES } from '../constants';

const intInRange = (raw: string, min: number, max: number): boolean => {
    if (raw === '' || raw == null) return false;
    const n = Number(raw);
    return Number.isInteger(n) && n >= min && n <= max;
};

export function validateCalculatorInputs(formData: FormData): FieldErrors {
    const errors: FieldErrors = {};

    const rules: { key: keyof FormData; min: number; max: number; label: string }[] = [
        { key: 'chemoChairs', min: 1, max: 999, label: '1 and 999' },
        { key: 'oncologists', min: 1, max: 999, label: '1 and 999' },
        { key: 'beds', min: 1, max: 9999, label: '1 and 9,999' },
        { key: 'edVisits', min: 1, max: 999999, label: '1 and 999,999' },
    ];

    for (const { key, min, max, label } of rules) {
        const raw = String(formData[key] ?? '');
        if (!raw) errors[key] = 'This field is required.';
        else if (!intInRange(raw, min, max)) errors[key] = `Enter a whole number between ${label}.`;
    }

    if (!formData.state || !STATES.some((s) => s.value === formData.state)) {
        errors.state = 'Please select your state.';
    }
    if (formData.is340B !== 'yes' && formData.is340B !== 'no') {
        errors.is340B = 'Please choose Yes or No.';
    }
    return errors;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateLead(lead: LeadInfo): FieldErrors {
    const errors: FieldErrors = {};
    const clean = (v: string) => (v ?? '').trim();

    if (clean(lead.firstName).length < 1) errors.firstName = 'Please enter your first name.';
    if (clean(lead.lastName).length < 1) errors.lastName = 'Please enter your last name.';

    const email = clean(lead.email);
    if (!EMAIL_REGEX.test(email)) {
        errors.email = 'Please enter a valid email address.';
    } else {
        const domain = email.split('@')[1]?.toLowerCase();
        if (domain && FREE_EMAIL_PROVIDERS.includes(domain)) {
            errors.email = 'Please use your organizational email address (for example, name@hospital.org).';
        }
    }

    if (clean(lead.company).length < 2) errors.company = 'Please enter your hospital or health system name.';
    if (clean(lead.title).length < 2) errors.title = 'Please enter your job title.';

    // Length caps keep junk (and oversized payloads) out of the CRM.
    (['firstName', 'lastName', 'email', 'company', 'title'] as const).forEach((k) => {
        if (clean(lead[k]).length > 120 && !errors[k]) errors[k] = 'This entry is too long.';
    });
    return errors;
}
