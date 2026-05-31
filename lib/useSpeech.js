"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech() {
  const voiceRef = useRef(null);
  const announcingRef = useRef(false);
  const [announce, setAnnounce] = useState(null);
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

  const say = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
    if (announcingRef.current) return;
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
    try { window.speechSynthesis.cancel(); } catch {}
    setSpeaking(false);
    setAnnounce(null);
  }, []);

  const primeSpeech = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try { window.speechSynthesis.speak(new SpeechSynthesisUtterance("")); } catch {}
  }, []);

  return { speakOnce, say, startAnnounce, stopAnnounce, announce, speaking, primeSpeech };
}
