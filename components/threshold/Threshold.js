"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// The iris is heavy-ish and purely decorative — lazy-load it, never block paint.
const IrisLight = dynamic(() => import("./IrisLight"), { ssr: false, loading: () => null });

// THE THRESHOLD — the cinematic landing / story. Audience: judges, caregivers,
// the person setting it up. Heavy motion lives HERE and nowhere else. One CTA:
// "Begin with your eyes" → a light-settling transition into the Sanctuary.
export default function Threshold({ onBegin }) {
  const scrollRef = useRef(null);
  const [leaving, setLeaving] = useState(false);
  const [dwell, setDwell] = useState(false);

  // Reveal story sections as they scroll into view (robust, no scroll-lib).
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const els = root.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.25, root }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const begin = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onBegin, 650); // let the "settle" transition play
  };

  // Deliberate keyboard start (Enter) — won't fire on Space/arrows used to scroll.
  useEffect(() => {
    const f = (e) => { if (e.key === "Enter") begin(); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  const BeginButton = () => (
    <button
      className="th-begin"
      onMouseEnter={() => setDwell(true)}
      onMouseLeave={() => setDwell(false)}
      onClick={begin}
    >
      Begin with your eyes
      {dwell && <span className="dwell-bar" onAnimationEnd={begin} />}
    </button>
  );

  return (
    <div className={`threshold ${leaving ? "leaving" : ""}`} ref={scrollRef}>
      <div className="th-iris-fallback" aria-hidden />
      <IrisLight scrollEl={scrollRef} />
      <div className="th-grain" aria-hidden />

      <section className="th-hero">
        <h1 className="th-mark">Aloud<span className="dot">.</span></h1>
        <p className="th-tag">A voice for anyone who can speak only with their eyes.</p>
        <BeginButton />
        <span className="th-scrollcue"><span className="cue" />Scroll</span>
      </section>

      <section className="th-story" data-reveal>
        <span className="th-kicker">The reality</span>
        <h2 className="th-line">Wide awake.<br /><em>Unable to speak.</em></h2>
        <p className="th-body">
          Hundreds of thousands of people — with ALS, locked-in syndrome, cerebral palsy,
          late-stage Parkinson&apos;s or paralysis — are fully present in the room, yet
          can&apos;t carry a single word out of their body.
        </p>
      </section>

      <section className="th-story" data-reveal>
        <span className="th-kicker">The promise</span>
        <h2 className="th-line teal">A voice, with only a <em>blink</em>.</h2>
        <p className="th-body">
          Aloud watches one deliberate blink and turns it into speech. On-device AI reads
          your eyes; generative AI writes your words. No hands, no typing, no waiting to be
          understood.
        </p>
      </section>

      <section className="th-cta" data-reveal>
        <span className="th-kicker">Begin</span>
        <h2 className="th-line">Everyone deserves<br />a <em>voice</em>.</h2>
        <BeginButton />
        <span className="th-helper">A helper taps once to turn on the camera. After that, it&apos;s <b>eyes only</b>.</span>
      </section>
    </div>
  );
}
