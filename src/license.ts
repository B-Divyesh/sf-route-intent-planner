export const LICENSE_KEY = 'sb_license:route-intent-planner';
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const DAY = 86_400_000;
// Production is the safe default. Staging can opt into the pilot endpoint at
// build time; public releases must never advertise a pilot checkout.
const API_BASE = import.meta.env.VITE_BILLING_API || 'https://api.sociobot.in';
export const billingEnabled = import.meta.env.VITE_BILLING_ENABLED === 'true';

interface Verdict { valid: boolean; checkedAt: number }

export function captureLicense(): string | null {
  const url = new URL(location.href);
  const queryLicense = url.searchParams.get('license');
  if (queryLicense) {
    localStorage.setItem(LICENSE_KEY, queryLicense);
    url.searchParams.delete('license');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return queryLicense ?? localStorage.getItem(LICENSE_KEY);
}

export function cachedUnlock(token: string | null): boolean {
  if (!token) return false;
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) || 'null') as Verdict | null;
    return verdict?.valid === true;
  } catch { return false; }
}

export async function verifyLicense(token: string, force = false): Promise<boolean> {
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) || 'null') as Verdict | null;
    if (!force && cached && Date.now() - cached.checkedAt < DAY) return cached.valid;
  } catch { /* verify fresh */ }
  const response = await fetch(`${API_BASE}/api/v1/products/route-intent-planner/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service unavailable');
  const data = await response.json() as { valid: boolean };
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: data.valid, checkedAt: Date.now() }));
  return data.valid;
}

export function storeLicense(token: string): void {
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function checkoutUrl(): string {
  return `${API_BASE}/api/v1/products/route-intent-planner/checkout`;
}
