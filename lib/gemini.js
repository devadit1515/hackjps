import { GoogleGenAI, Type } from "@google/genai";

export const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let client = null;
function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!client) client = new GoogleGenAI({ apiKey: key });
  return client;
}

const SYSTEM = `You are the spoken voice of a person who cannot speak or type easily.
They communicate by selecting a few words/ideas on an assistive board. Your job is to
turn those selections into ONE short, natural, FIRST-PERSON sentence that says what they
most likely mean — as if THEY are speaking aloud to a person near them.

Rules:
- Speak as "I". Never describe them in third person.
- Stay faithful to the selected words. Do NOT invent unrelated needs or facts.
- Be warm and natural, not robotic. Contractions are good.
- Keep it short — usually 1 short sentence. Match urgency (pain/help = direct).
- If the words clearly form a request, phrase it politely ("Could you...", "Please...").
- Output JSON only.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    primary: {
      type: Type.STRING,
      description: "The single best natural sentence they likely want to say.",
    },
    alternatives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Up to 2 alternative phrasings of the same intent.",
    },
  },
  required: ["primary", "alternatives"],
};

export async function composeSentence({ words, history }) {
  const ai = getClient();
  if (!ai) throw new Error("NO_KEY");

  const contextLine =
    history && history.length
      ? `Recent things already said (most recent last), for context:\n${history
          .slice(-4)
          .map((h) => `- "${h}"`)
          .join("\n")}\n\n`
      : "";

  const prompt = `${contextLine}The person selected these words/ideas, in order: ${words
    .map((w) => `"${w}"`)
    .join(", ")}.\n\nWrite the single most likely sentence they want to say right now.`;

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const raw = (res.text || "").trim();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    // tolerate stray code fences or text around the JSON
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("BAD_JSON");
    data = JSON.parse(m[0]);
  }
  if (!data.primary) throw new Error("BAD_JSON");
  if (!Array.isArray(data.alternatives)) data.alternatives = [];
  return { primary: data.primary, alternatives: data.alternatives.slice(0, 2) };
}
