"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Shared speech for the whole app — one source of truth for both the boards and
// the speller. Picks a natural voice, speaks single utterances, and drives the
// full-screen looping "announce" (repeats until dismissed). `announce` carries a
// `returnTo` so the caller knows which screen to restore when it's dismissed.
export function useSpeech() {
  const voiceRef = useRef(null);
  const announcingRef = useRef(false);
  const [announce, setAnnounce] = useState(null); // { text, urgent, returnTo } | null
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const pick = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) return;
      voiceRef.current =
        v.find((x) => /Google US English/i.test(x.name)) ||
        v.find((x) => /Natural/i.test(x.name) && /^en/i.test(x.lang)) ||
        v.find((x) => x.lang === "en-US") ||
        v.find((x) => /^en/i.test(x.lang)) || v[0];
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  }, []);

  const speakOnce = useCallback((text, onend) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) { onend && onend(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 1; u.pitch = 1;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onstart = () => setSpeaking(true);
    u.onend = () => { setSpeaking(false); onend && onend(); };
    u.onerror = () => { setSpeaking(false); onend && onend(); };
    window.speechSynthesis.speak(u);
  }, []);

  // Speak once, quietly, without taking over the screen (e.g. echo a letter).
  const say = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
    if (announcingRef.current) return; // don't fight a running announcement
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 1.05;
    if (voiceRef.current) u.voice = voiceRef.current;
    window.speechSynthesis.speak(u);
  }, []);

  const startAnnounce = useCallback((text, opts = {}) => {
    if (!text) return;
    setAnnounce({ text, urgent: !!opts.urgent, returnTo: opts.returnTo || "home" });
    announcingRef.current = true;
    const loop = () => {
      if (!announcingRef.current) return;
      speakOnce(text, () => { if (announcingRef.current) setTimeout(loop, 550); });
    };
    loop();
  }, [speakOnce]);

  const stopAnnounce = useCallback(() => {
    announcingRef.current = false;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setSpeaking(false);
    setAnnounce(null);
  }, []);

  // Prime speech on the first user gesture (browsers gate audio until then).
  const primeSpeech = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try { window.speechSynthesis.speak(new SpeechSynthesisUtterance("")); } catch { /* ignore */ }
  }, []);

  return { speakOnce, say, startAnnounce, stopAnnounce, announce, speaking, primeSpeech };
}
