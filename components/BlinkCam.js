"use client";

import { useEffect, useRef, useState } from "react";

// Deliberate-blink detection via MediaPipe FaceLandmarker blendshapes.
// All on-device — the video never leaves the browser.
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const CLOSE = 0.55; // blendshape score: eyes considered closed above this
const OPEN = 0.35; // ...and open again below this (hysteresis)
const MIN_CLOSED = 220; // ms — longer than a natural blink (deliberate)
const MAX_CLOSED = 1400; // ms — ignore "resting eyes closed"
const COOLDOWN = 650; // ms between accepted blinks

export default function BlinkCam({ onBlink, onError }) {
  const videoRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [meter, setMeter] = useState(0);
  const [blinking, setBlinking] = useState(false);

  const cbRef = useRef({ onBlink, onError });
  cbRef.current = { onBlink, onError };

  useEffect(() => {
    let landmarker = null;
    let stream = null;
    let raf = 0;
    let cancelled = false;

    let closed = false;
    let closedStart = 0;
    let lastBlink = 0;
    let lastVideoTime = -1;

    async function init() {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const { FilesetResolver, FaceLandmarker } = vision;
        const fileset = await FilesetResolver.forVisionTasks(WASM);
        landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 360 },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setArmed(true);
        loop();
      } catch (e) {
        console.error("[BlinkCam]", e);
        cbRef.current.onError?.(
          "Couldn't start blink detection. Use Space or click instead."
        );
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
          const l = cats.find((c) => c.categoryName === "eyeBlinkLeft")?.score ?? 0;
          const r = cats.find((c) => c.categoryName === "eyeBlinkRight")?.score ?? 0;
          const score = (l + r) / 2;
          setMeter(score);
          const now = performance.now();

          if (!closed && score > CLOSE) {
            closed = true;
            closedStart = now;
            setBlinking(true);
          } else if (closed && score < OPEN) {
            closed = false;
            setBlinking(false);
            const dur = now - closedStart;
            if (dur >= MIN_CLOSED && dur <= MAX_CLOSED && now - lastBlink > COOLDOWN) {
              lastBlink = now;
              cbRef.current.onBlink?.();
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
        {armed ? (blinking ? "Blink…" : "Watching your eyes") : "Starting camera…"}
      </div>
    </div>
  );
}
