/**
 * Returns the URL only if it has an http(s) scheme; otherwise null.
 * Prevents javascript:, data:, vbscript: URIs from being rendered in
 * anchor href attributes or passed to window.open.
 */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
