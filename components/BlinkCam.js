"use client";

import { useEffect, useRef, useState } from "react";

// On-device eye control via MediaPipe FaceLandmarker blendshapes.
// Emits gaze DIRECTION (look left/right/up/down to move) and deliberate BLINK
// (to select). All processing stays in the browser — video never leaves.
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// blink
const CLOSE = 0.55, OPEN = 0.35, BLINK_COOLDOWN = 550;
const SHORT_MIN = 150, SHORT_MAX = 600;   // quick blink → select
const LONG_MIN = 850, LONG_MAX = 2800;    // long blink → done / dismiss
// gaze
const GAZE_FIRE = 0.5, GAZE_RECENTER = 0.3, GAZE_COOLDOWN = 420;

export default function BlinkCam({ onBlink, onLongBlink, onGaze, onEyesClosed, onError }) {
  const videoRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [meter, setMeter] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [dir, setDir] = useState(null);

  const cb = useRef({ onBlink, onLongBlink, onGaze, onEyesClosed, onError });
  cb.current = { onBlink, onLongBlink, onGaze, onEyesClosed, onError };

  useEffect(() => {
    let landmarker = null, stream = null, raf = 0, cancelled = false;
    let closed = false, closedStart = 0, lastBlink = 0, lastVideoTime = -1;
    let gazeArmed = true, lastGaze = 0;

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

          // ---- blink (select) ----
          const blink = (g("eyeBlinkLeft") + g("eyeBlinkRight")) / 2;
          setMeter(blink);
          if (!closed && blink > CLOSE) { closed = true; closedStart = now; setBlinking(true); cb.current.onEyesClosed?.(true); }
          else if (closed && blink < OPEN) {
            closed = false; setBlinking(false); cb.current.onEyesClosed?.(false);
            const d = now - closedStart;
            if (now - lastBlink > BLINK_COOLDOWN) {
              if (d >= SHORT_MIN && d <= SHORT_MAX) { lastBlink = now; cb.current.onBlink?.(); }
              else if (d >= LONG_MIN && d <= LONG_MAX) { lastBlink = now; cb.current.onLongBlink?.(); }
            }
          }

          // ---- gaze direction (move) — ignore while eyes are closing ----
          if (!closed && blink < OPEN) {
            const left = (g("eyeLookOutLeft") + g("eyeLookInRight")) / 2;   // looking user's left
            const right = (g("eyeLookInLeft") + g("eyeLookOutRight")) / 2;  // user's right
            const up = (g("eyeLookUpLeft") + g("eyeLookUpRight")) / 2;
            const down = (g("eyeLookDownLeft") + g("eyeLookDownRight")) / 2;
            const scores = { left, right, up, down };
            let best = "left";
            for (const k of ["right", "up", "down"]) if (scores[k] > scores[best]) best = k;
            const val = scores[best];
            if (gazeArmed && val > GAZE_FIRE && now - lastGaze > GAZE_COOLDOWN) {
              gazeArmed = false; lastGaze = now; setDir(best);
              cb.current.onGaze?.(best);
              setTimeout(() => setDir(null), 360);
            } else if (!gazeArmed && val < GAZE_RECENTER) {
              gazeArmed = true;
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
