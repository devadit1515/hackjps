"use client";

import { useEffect, useRef } from "react";

// The Threshold centerpiece: a luminous iris of light rendered on a 2D canvas.
// Amber radial striations breathe around a glowing pupil, with drifting motes and
// a faint teal halo. It reacts to the pointer (parallax) and dims as you scroll
// into the story. Lazy-loaded, and it freezes to a single still frame under
// prefers-reduced-motion. No dependencies — pure Canvas.
export default function IrisLight({ scrollEl }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1, raf = 0, running = true;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let scrollFade = 1;

    // Pre-seed the iris striations and the floating motes so they stay stable.
    const RAYS = 170;
    const rays = Array.from({ length: RAYS }, (_, i) => ({
      a: (i / RAYS) * Math.PI * 2,
      len: 0.5 + Math.random() * 0.95,
      w: 0.6 + Math.random() * 1.7,
      ph: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 0.9,
    }));
    const motes = Array.from({ length: 46 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.35 + Math.random() * 1.5,
      sp: 0.015 + Math.random() * 0.05,
      sz: 0.6 + Math.random() * 1.9,
      ph: Math.random() * Math.PI * 2,
    }));

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function onMove(e) { pointer.tx = e.clientX / window.innerWidth; pointer.ty = e.clientY / window.innerHeight; }
    const sc = scrollEl && scrollEl.current;
    function onScroll() {
      if (!sc) return;
      const v = sc.scrollTop / Math.max(1, window.innerHeight);
      scrollFade = Math.max(0, 1 - v * 1.15);
    }

    function draw(t) {
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      ctx.clearRect(0, 0, w, h);
      const alpha = scrollFade;
      if (alpha > 0.01) {
        const cx = w / 2 + (pointer.x - 0.5) * 44;
        const cy = h * 0.44 + (pointer.y - 0.5) * 32;
        const base = Math.min(w, h);
        const breathe = 1 + Math.sin(t * 0.0006) * 0.05;
        const pupilR = base * 0.085 * breathe;
        const innerR = pupilR * 1.5;
        const outerR = base * 0.34 * breathe;
        const rot = t * 0.00004;

        ctx.globalCompositeOperation = "lighter";

        // soft bloom field
        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR * 1.6);
        bloom.addColorStop(0, `rgba(245,177,76,${0.22 * alpha})`);
        bloom.addColorStop(0.4, `rgba(245,177,76,${0.06 * alpha})`);
        bloom.addColorStop(1, "rgba(245,177,76,0)");
        ctx.fillStyle = bloom; ctx.fillRect(0, 0, w, h);

        // iris striations
        ctx.lineCap = "round";
        for (const ray of rays) {
          const flick = 0.6 + 0.4 * Math.sin(t * 0.001 * ray.sp + ray.ph);
          const a = ray.a + rot;
          const r1 = innerR + (outerR - innerR) * ray.len;
          const x0 = cx + Math.cos(a) * innerR, y0 = cy + Math.sin(a) * innerR;
          const x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1;
          const g = ctx.createLinearGradient(x0, y0, x1, y1);
          g.addColorStop(0, `rgba(255,200,116,${0.5 * flick * alpha})`);
          g.addColorStop(0.5, `rgba(245,177,76,${0.2 * flick * alpha})`);
          g.addColorStop(1, "rgba(245,177,76,0)");
          ctx.strokeStyle = g; ctx.lineWidth = ray.w;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }

        // pupil glow
        const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR * 2.5);
        pg.addColorStop(0, `rgba(255,238,206,${0.95 * alpha})`);
        pg.addColorStop(0.25, `rgba(255,200,116,${0.55 * alpha})`);
        pg.addColorStop(0.7, `rgba(245,177,76,${0.1 * alpha})`);
        pg.addColorStop(1, "rgba(245,177,76,0)");
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(cx, cy, innerR * 2.5, 0, Math.PI * 2); ctx.fill();

        // dark pupil so it reads as an eye
        ctx.globalCompositeOperation = "source-over";
        const dark = ctx.createRadialGradient(cx, cy, 0, cx, cy, pupilR);
        dark.addColorStop(0, `rgba(7,8,11,${0.88 * alpha})`);
        dark.addColorStop(0.7, `rgba(7,8,11,${0.42 * alpha})`);
        dark.addColorStop(1, "rgba(7,8,11,0)");
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.arc(cx, cy, pupilR, 0, Math.PI * 2); ctx.fill();

        ctx.globalCompositeOperation = "lighter";
        // inner gold ring (pupil edge)
        ctx.strokeStyle = `rgba(255,212,142,${0.5 * alpha})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2); ctx.stroke();
        // faint teal outer halo
        ctx.strokeStyle = `rgba(91,208,187,${0.12 * alpha})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, outerR * 1.12, 0, Math.PI * 2); ctx.stroke();

        // floating motes
        for (const m of motes) {
          m.a += m.sp * 0.01;
          const tw = 0.4 + 0.6 * Math.sin(t * 0.002 + m.ph);
          const rr = innerR + (outerR - innerR) * m.r;
          const x = cx + Math.cos(m.a) * rr;
          const y = cy + Math.sin(m.a) * rr * 0.96;
          ctx.fillStyle = `rgba(255,212,142,${0.5 * tw * alpha})`;
          ctx.beginPath(); ctx.arc(x, y, m.sz, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }
      if (running && !reduce) raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    if (sc) sc.addEventListener("scroll", onScroll, { passive: true });

    if (reduce) draw(900); // single still frame
    else raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      if (sc) sc.removeEventListener("scroll", onScroll);
    };
  }, [scrollEl]);

  return <canvas className="th-iris" ref={ref} aria-hidden />;
}
