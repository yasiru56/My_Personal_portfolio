import { useEffect, useRef, useState } from "react";
import "./waveBackground.css";

// The effect follows the mouse and is heavy on the GPU, so touch screens and
// reduced-motion users keep the static CSS background behind it instead
const canShowWaves = () =>
  window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function WaveBackground() {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canShowWaves()) return undefined;

    let isCancelled = false;
    let scene = null;

    const loadScene = async () => {
      try {
        // Loaded on demand so three.js stays out of the main bundle
        const { default: WaveScene } = await import("./wave/WaveScene");
        if (isCancelled) return;
        scene = new WaveScene(containerRef.current);
        setIsReady(true);
      } catch (error) {
        if (!isCancelled) console.warn("Wave background unavailable, keeping the static background.", error);
      }
    };
    void loadScene(); // errors are handled inside

    return () => {
      isCancelled = true;
      scene?.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`wave-background${isReady ? " wave-background--ready" : ""}`}
      aria-hidden="true"
    />
  );
}
