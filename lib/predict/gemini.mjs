// Client-side facade for the optional Gemini upgrade. Calls our own server route
// (the key lives there, never in the browser). Returns suggestion objects shaped
// like the on-device ones, or null on any failure / missing key — the caller then
// just keeps the on-device suggestions. Never throws.
// Once we learn there's no key (or the route is unreachable), stop probing for the
// rest of the session so we never spam the network or the console.
let disabled = false;

export async function geminiSuggest(text, { signal } = {}) {
  if (disabled) return null;
  try {
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });
    if (!res.ok) return null; // 502 = call failed → fall back silently
    const data = await res.json();
    if (data?.disabled) { disabled = true; return null; } // no server key configured
    if (!Array.isArray(data?.suggestions)) return null;
    return data.suggestions
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => {
        const t = s.trim();
        return { label: t, text: /\s$/.test(t) ? t : t + " " };
      });
  } catch {
    return null; // includes AbortError when a newer keystroke supersedes this one
  }
}
