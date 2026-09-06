export const LICENSE_KEY = 'sb_license:route-intent-planner';
const licenseKey = (demo: boolean) => demo ? `demo:${LICENSE_KEY}` : LICENSE_KEY;
const verdictKey = (demo: boolean) => `${licenseKey(demo)}:verdict`;
const DAY = 86_400_000;
// Production is the safe default. Staging can opt into the pilot endpoint at
// build time; public releases must never advertise a pilot checkout.
const API_BASE = import.meta.env.VITE_BILLING_API || 'https://api.sociobot.in';
export const billingEnabled = import.meta.env.VITE_BILLING_ENABLED === 'true';

interface Verdict { valid: boolean; checkedAt: number }

export function captureLicense(demo = false): string | null {
  const url = new URL(location.href);
  const queryLicense = url.searchParams.get('license');
  if (queryLicense) {
    localStorage.setItem(licenseKey(demo), queryLicense);
    url.searchParams.delete('license');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return queryLicense ?? localStorage.getItem(licenseKey(demo));
}

export function cachedUnlock(token: string | null, demo = false): boolean {
  if (!token) return false;
  try {
    const verdict = JSON.parse(localStorage.getItem(verdictKey(demo)) || 'null') as Verdict | null;
    return verdict?.valid === true;
  } catch { return false; }
}

export async function verifyLicense(token: string, force = false, demo = false): Promise<boolean> {
  try {
    const cached = JSON.parse(localStorage.getItem(verdictKey(demo)) || 'null') as Verdict | null;
    if (!force && cached && Date.now() - cached.checkedAt < DAY) return cached.valid;
  } catch { /* verify fresh */ }
  const response = await fetch(`${API_BASE}/api/v1/products/route-intent-planner/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service unavailable');
  const data = await response.json() as { valid: boolean };
  localStorage.setItem(verdictKey(demo), JSON.stringify({ valid: data.valid, checkedAt: Date.now() }));
  return data.valid;
}

export function storeLicense(token: string, demo = false): void {
  localStorage.setItem(licenseKey(demo), token.trim());
  localStorage.removeItem(verdictKey(demo));
}

export function clearDemoLicense(): void {
  localStorage.removeItem(licenseKey(true));
  localStorage.removeItem(verdictKey(true));
}

export function checkoutUrl(): string {
  return `${API_BASE}/api/v1/products/route-intent-planner/checkout`;
}
