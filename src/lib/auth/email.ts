// Email checks shared by the browser and the server (no Node imports here).

/** Trimmed and lower-cased, the form we store and look up. */
export const normalizeEmail = (raw: unknown) => (typeof raw === "string" ? raw.trim().toLowerCase() : "");

// local@domain.tld: no spaces, no leading/trailing/double dots, labels of letters,
// digits and hyphens, and a top-level domain of 2+ letters.
const LOCAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/** A real-looking email address (what a person can type and receive mail at). */
export function isValidEmail(raw: unknown): boolean {
  const email = normalizeEmail(raw);
  if (!email || email.length > 254) return false;
  const at = email.lastIndexOf("@");
  if (at < 1 || at !== email.indexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || !LOCAL.test(local)) return false;
  const labels = domain.split(".");
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l))) return false;
  return /^[a-z]{2,63}$/.test(labels[labels.length - 1]);
}
