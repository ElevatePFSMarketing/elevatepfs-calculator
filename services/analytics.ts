// Google Tag Manager loader. The old site loaded Qualify Health's container
// (GTM-PL7TJPDC); that is gone. Set VITE_GTM_ID in Netlify to your own
// container (e.g. GTM-XXXXXXX) to turn analytics on. No ID = no tracking.

export function initAnalytics(): void {
  const id = import.meta.env.VITE_GTM_ID as string | undefined;
  if (!id) return;
  if (['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

export function track(event: string, payload: Record<string, unknown> = {}): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}
