// Optional Gemini upgrade for "Spell it out" suggestions. The key lives only on
// the server (never shipped to the browser). If there's no key we return 503 and
// the client silently keeps its instant on-device predictions — the app never
// depends on the network.
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(request) {
  let text = "";
  try { ({ text } = await request.json()); } catch { /* bad body → empty */ }
  text = (text || "").toString().slice(0, 280);

  const key = process.env.GEMINI_API_KEY;
  // No key → respond 200 with a `disabled` flag so the client quietly stops asking
  // (a 503 would show as a red console error even though it's expected).
  if (!key) return Response.json({ suggestions: [], disabled: true });
  if (!text.trim()) return Response.json({ suggestions: [] });

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents:
        `A person who can only move their eyes is composing a message a few letters or ` +
        `words at a time and has entered so far:\n"${text}"\n\n` +
        `This may be terse or keyword-style (e.g. "cold water" → "Could I please have ` +
        `some cold water?"). Reply with up to 4 short, COMPLETE, natural first-person ` +
        `sentences they most likely want to SAY out loud — turning sparse input into ` +
        `fluent speech, not merely predicting the next word. Each suggestion must express ` +
        `a genuinely DIFFERENT need or idea — never two rewordings of the same thing. ` +
        `Prioritise everyday care and communication needs, and keep each distinct and brief.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.4,
        maxOutputTokens: 256,
      },
    });
    const parsed = JSON.parse(res.text);
    const suggestions = Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string" && s.trim()).slice(0, 4)
      : [];
    return Response.json({ suggestions });
  } catch {
    return Response.json({ error: "failed" }, { status: 502 });
  }
}
