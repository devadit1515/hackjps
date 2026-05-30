import { composeSentence } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const words = Array.isArray(body?.words) ? body.words.filter(Boolean) : [];
  const history = Array.isArray(body?.history) ? body.history.filter(Boolean) : [];

  if (!words.length) {
    return Response.json({ error: "No words selected." }, { status: 400 });
  }

  try {
    const result = await composeSentence({ words, history });
    return Response.json(result);
  } catch (e) {
    if (e?.message === "NO_KEY") {
      return Response.json({ error: "NO_KEY" }, { status: 503 });
    }
    console.error("[compose] error:", e);
    // Never leave the user voiceless: fall back to speaking the raw words.
    return Response.json({
      primary: words.join(" "),
      alternatives: [],
      fallback: true,
    });
  }
}
