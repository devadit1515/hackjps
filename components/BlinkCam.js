"use client";

import { useEffect, useRef, useState } from "react";
import { cues } from "@/lib/audio/cues.mjs";

// On-device eye control via MediaPipe FaceLandmarker blendshapes. The whole
// interface is one switch: a deliberate HOLD of the eyes shut. We report when the
// eyes close/open (so a board can freeze its scan mid-blink) and fire ONCE as soon
// as they've been held shut past a short dwell — no upper limit and no dependence
// on the re-open, which is what makes it reliable. A quick, involuntary blink is
// far too short to ever cross the dwell. Video never leaves the device.
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const CLOSE = 0.45;     // eyes considered shut above this (the stronger of the two)
const OPEN = 0.25;      // ...and open again below this (hysteresis kills flicker)
const HOLD_MS = 500;    // hold them shut ~half a second → fires
const REFIRE_MS = 550;  // brief lockout after a fire, so one hold = one action
const DETECT_MS = 45;   // cap inference to ~22fps so the rest of the UI stays smooth

export default function BlinkCam({ onLongBlink, onEyesClosed, onError }) {
  const videoRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [meter, setMeter] = useState(0);
  const [hold, setHold] = useState(0);   // 0..1 dwell progress while held shut
  const [fired, setFired] = useState(false);

  const cb = useRef({ onLongBlink, onEyesClosed, onError });
  cb.current = { onLongBlink, onEyesClosed, onError };

  useEffect(() => {
    let landmarker = null, stream = null, raf = 0, cancelled = false;
    let closed = false, closedStart = 0, didFire = false, lastFire = 0;
    let lastDetect = 0, lastVideoTime = -1, lastMeterPct = -1, lastHoldStep = -1, uiFired = false;

    async function init() {
      try {
        const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
        const fileset = await FilesetResolver.forVisionTasks(WASM);
        landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 360 }, audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setArmed(true);
        loop();
      } catch (e) {
        console.error("[BlinkCam]", e);
        cb.current.onError?.("Couldn't start the camera. You can still use a keyboard or click.");
      }
    }

    function loop() {
      if (cancelled) return;
      const video = videoRef.current;
      const now = performance.now();
      if (video && landmarker && now - lastDetect >= DETECT_MS && video.currentTime !== lastVideoTime && video.readyState >= 2) {
        lastDetect = now; lastVideoTime = video.currentTime;
        const res = landmarker.detectForVideo(video, now);
        const cats = res?.faceBlendshapes?.[0]?.categories;
        if (cats) {
          const g = (n) => cats.find((c) => c.categoryName === n)?.score ?? 0;
          // the STRONGER eye — so one eye lagging never blocks a deliberate close
          const blink = Math.max(g("eyeBlinkLeft"), g("eyeBlinkRight"));
          const pct = Math.round(blink * 100);
          if (Math.abs(pct - lastMeterPct) >= 6) { lastMeterPct = pct; setMeter(blink); }

          if (!closed && blink > CLOSE) {
            // eyes just closed
            closed = true; closedStart = now; didFire = false;
            if (uiFired) { uiFired = false; setFired(false); }
            cb.current.onEyesClosed?.(true);
          } else if (closed && blink < OPEN) {
            // eyes just opened
            closed = false;
            if (lastHoldStep !== 0) { lastHoldStep = 0; setHold(0); }
            if (uiFired) { uiFired = false; setFired(false); }
            cb.current.onEyesClosed?.(false);
          } else if (closed && !didFire) {
            // still shut — count up the dwell
            const held = now - closedStart;
            if (held >= HOLD_MS && now - lastFire >= REFIRE_MS) {
              didFire = true; lastFire = now;
              setHold(1); uiFired = true; setFired(true); lastHoldStep = 10;
              try { cues.select(); } catch { /* ignore */ }
              cb.current.onLongBlink?.();
            } else {
              const step = Math.min(9, Math.round((held / HOLD_MS) * 10));
              if (step !== lastHoldStep) { lastHoldStep = step; setHold(held / HOLD_MS); }
            }
          }
        }
      }
      raf = requestAnimationFrame(loop);
    }

    init();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      try { landmarker?.close?.(); } catch { /* ignore */ }
    };
  }, []);

  const closing = hold > 0 && !fired;
  return (
    <div className={`cam-bubble ${armed ? "armed" : ""} ${closing ? "blinking" : ""} ${fired ? "fired" : ""}`}>
      <div className="eyemeter"><i style={{ width: `${Math.round(meter * 100)}%` }} /></div>
      <div className="cam-hold"><i style={{ width: `${Math.round(hold * 100)}%` }} /></div>
      <video ref={videoRef} muted playsInline />
      <div className="cam-state">
        <span className="ring" />
        {!armed ? "Starting camera…" : fired ? "Got it ✓" : closing ? "Hold…" : "Tracking your eyes"}
      </div>
    </div>
  );
}
