"use client";

import { useEffect, useRef, useState } from "react";

// On-device eye control via MediaPipe FaceLandmarker blendshapes.
// The whole interface is one switch: a deliberate LONG blink. We report when the
// eyes close/open (so the board can freeze its scan mid-blink) and fire once on a
// long blink. A quick, involuntary blink does nothing. Video never leaves the device.
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const CLOSE = 0.55, OPEN = 0.35, BLINK_COOLDOWN = 550;
const LONG_MIN = 850, LONG_MAX = 2800; // hold eyes shut ~0.85–2.8s → select / dismiss

export default function BlinkCam({ onLongBlink, onEyesClosed, onError }) {
  const videoRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [meter, setMeter] = useState(0);
  const [blinking, setBlinking] = useState(false);

  const cb = useRef({ onLongBlink, onEyesClosed, onError });
  cb.current = { onLongBlink, onEyesClosed, onError };

  useEffect(() => {
    let landmarker = null, stream = null, raf = 0, cancelled = false;
    let closed = false, closedStart = 0, lastBlink = 0, lastVideoTime = -1;
    let lastMeterPct = -1; // only re-render the meter when it visibly moves

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
      if (video && landmarker && video.currentTime !== lastVideoTime && video.readyState >= 2) {
        lastVideoTime = video.currentTime;
        const res = landmarker.detectForVideo(video, performance.now());
        const cats = res?.faceBlendshapes?.[0]?.categories;
        if (cats) {
          const g = (n) => cats.find((c) => c.categoryName === n)?.score ?? 0;
          const now = performance.now();

          const blink = (g("eyeBlinkLeft") + g("eyeBlinkRight")) / 2;
          const pct = Math.round(blink * 100);
          if (Math.abs(pct - lastMeterPct) >= 4) { lastMeterPct = pct; setMeter(blink); }

          if (!closed && blink > CLOSE) {
            closed = true; closedStart = now; setBlinking(true); cb.current.onEyesClosed?.(true);
          } else if (closed && blink < OPEN) {
            closed = false; setBlinking(false); cb.current.onEyesClosed?.(false);
            const d = now - closedStart;
            // only a deliberate long blink does anything — quick blinks are ignored
            if (now - lastBlink > BLINK_COOLDOWN && d >= LONG_MIN && d <= LONG_MAX) {
              lastBlink = now; cb.current.onLongBlink?.();
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
      try { landmarker?.close?.(); } catch {}
    };
  }, []);

  return (
    <div className={`cam-bubble ${armed ? "armed" : ""} ${blinking ? "blinking" : ""}`}>
      <div className="eyemeter"><i style={{ width: `${Math.round(meter * 100)}%` }} /></div>
      <video ref={videoRef} muted playsInline />
      <div className="cam-state">
        <span className="ring" />
        {armed ? (blinking ? "Hold to choose…" : "Tracking your eyes") : "Starting camera…"}
      </div>
    </div>
  );
}
