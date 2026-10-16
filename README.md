# ElevatePFS Hospital Savings Calculator

A gated hospital savings calculator for elevatepfs.com. Visitors enter facility details, submit their contact information, and then see their estimate. The page contains only the calculator, so it is designed to be embedded in a page on elevatepfs.com. Each submission creates a Lead in Salesforce.

Built with React, Vite, and Tailwind CSS. Hosted on Netlify (static site plus one serverless function).

## How the gate works

1. The visitor fills in the calculator and clicks **Calculate Potential Savings**.
2. A short form appears (first name, last name, work email, hospital, job title). Personal email domains are rejected.
3. The form posts to `netlify/functions/calculate.ts`. **The server runs the savings math and returns results only after the contact details validate.** The multipliers are no longer in the browser bundle, so the gate cannot be bypassed from dev tools.
4. The same function sends the lead to Salesforce (Web-to-Lead) and returns a signed "unlocked" token, so the visitor can recalculate during the same visit without being asked again (token lasts 6 hours; a page reload asks again).
5. A backup copy of every lead is written to Netlify Forms (`calculator_logs`), including whether Salesforce accepted it (`crmStatus`).

If Salesforce is down or misconfigured, the visitor still sees their results (we do not punish them for our outage), the error is logged in the Netlify function logs, and the lead is preserved in Netlify Forms with `crmStatus = failed`. Check that form regularly after launch.

## Setup

### 1. Netlify environment variables

Site configuration > Environment variables. See `.env.example`.

| Variable | Required | Notes |
|---|---|---|
| `GATE_SECRET` | Yes | Random string, 32+ characters (`openssl rand -hex 32`). Signs unlock tokens. |
| `SF_OID` | Yes (for Salesforce) | Your org ID. See below. |
| `SF_LEAD_SOURCE` | No | Defaults to `Web`. Must be an existing Lead Source value. |
| `SF_CAMPAIGN_ID` | No | Adds each lead to a Campaign. |
| `SF_CUSTOM_FIELDS` | No | JSON map of calculator values to Salesforce custom field IDs (see below). |
| `SF_WEBTOLEAD_URL` | No | Use `https://test.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8` for a sandbox. |
| `VITE_GTM_ID` | No | Your Google Tag Manager container. Blank = no analytics. |

### 2. Salesforce Web-to-Lead

1. In Salesforce: **Setup > Web-to-Lead** and make sure it is enabled.
2. Click **Create Web-to-Lead Form**, pick the fields, and read the `oid` value from the generated HTML. That value is `SF_OID`.
3. The calculator sends: First Name, Last Name, Email, Company, Title, Lead Source, and a **Description** containing every input and the estimate shown. That works with no further setup.
4. Optional, for reporting: create custom Lead fields (for example `Chemo Chairs`, `Estimated Annual Savings`), add them to the Web-to-Lead form to get their IDs (`00N...`), then set `SF_CUSTOM_FIELDS`:

```json
{"chemoChairs":"00N...","oncologists":"00N...","beds":"00N...","edVisits":"00N...","state":"00N...","is340B":"00N...","totalSavings":"00N...","additionalRevenue":"00N...","hospitalSavings":"00N..."}
```

Limits to know about: Web-to-Lead allows 500 leads per 24 hours, and Salesforce does not return a detailed error body, so a mis-typed custom field ID can fail quietly. Test with a real submission and confirm the Lead appears. If volume or reliability becomes a concern, the function can be switched to the Salesforce REST API (OAuth Connected App) without changing anything else.

### 3. Deploy

Push to the `main` branch. Netlify builds with `npm run build` and deploys `netlify/functions` automatically (settings are in `netlify.toml`).

Local development: the gate needs the serverless function, so use `npm run dev:netlify` (requires the Netlify CLI), not plain `npm run dev`.

## Embedding on elevatepfs.com

Two options.

**A. Subdomain (simplest).** Point `calculator.elevatepfs.com` at this Netlify site (Domain management) and link to it from the elevatepfs.com page.

**B. iframe on a page.** `netlify.toml` already restricts framing to elevatepfs.com. When framed, the calculator hides its own header and footer so it sits cleanly inside your page. Add this to the page (WordPress "Custom HTML" block):

```html
<iframe id="pfs-calc" src="https://YOUR-SITE.netlify.app/" title="Hospital Savings Calculator"
        style="width:100%;border:0;min-height:500px" loading="lazy"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'elevatepfs-calculator:height') {
      document.getElementById('pfs-calc').style.height = e.data.height + 'px';
    }
  });
</script>
```

If you use option B, consider adding a `noindex` meta tag in `index.html` so the Netlify URL does not compete with the elevatepfs.com page in search results.

## Content you can edit without touching code

| What | Where |
|---|---|
| Brand URLs, consent text, estimate disclaimer | `config.ts` |
| Overall size of the calculator | `index.css` (the two `font-size` percentages at the top) |
| Brand colors | `tailwind.config.js` |
| Logo and favicons | `public/brand/` |
| Savings multipliers | `services/calculatorService.ts` |

## Before launch checklist

- [ ] **Validate the savings math.** The multipliers in `services/calculatorService.ts` and the "Excludes retroactive" statement were inherited from the original Qualify calculator. They need to be confirmed (or replaced) with ElevatePFS-verified figures before this goes in front of clients.
- [ ] Legal review of the consent text in `config.ts` and the disclaimer.
- [ ] Marketing review (brand@elevatepfs.com) of copy, colors, and logo placement.
- [ ] The logo in `public/brand/elevatepfs-logo.svg` is the supplied full-color SVG, used unaltered. If Marketing prefers the horizontal version in the header, drop it in at the same path.
- [ ] Submit a test lead and confirm it appears in Salesforce and in Netlify Forms.
- [ ] Add your own GTM container ID if you want analytics.
