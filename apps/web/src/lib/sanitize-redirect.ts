/**
 * Sanitise a user-supplied redirect path to prevent open-redirect attacks.
 *
 * Only allows paths that start with a single "/" (root-relative paths).
 * Rejects protocol-relative URLs ("//evil.com"), absolute URLs with schemes,
 * and any other value that could redirect off-origin.
 *
 * Returns `fallback` (default "/") when the input is unsafe.
 */
export function sanitizeRedirectPath(raw: string, fallback = "/"): string {
  let decoded: string;

  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }

  // Must start with exactly one "/" — reject "//…", scheme:…, or relative paths
  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return fallback;
  }

  // Extra safety: resolve against a dummy base and verify the origin is unchanged
  try {
    const base = "https://localhost";
    const resolved = new URL(decoded, base);

    if (resolved.origin !== base) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return decoded;
}

const INVITE_RETURN_TO = /^\/invite\/[A-Za-z0-9_-]+$/;

/** Allow only `/invite/<token>` as a post-login return path. */
export function sanitizeInviteReturnTo(raw: string | undefined): string | null {
  if (!raw) return null;

  const path = sanitizeRedirectPath(raw, "");
  if (!path) return null;

  const pathname = path.split("?")[0]?.split("#")[0] ?? "";
  if (!INVITE_RETURN_TO.test(pathname)) return null;

  return pathname;
}

