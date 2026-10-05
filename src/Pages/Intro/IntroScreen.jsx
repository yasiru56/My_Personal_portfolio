import { useEffect, useRef, useState } from "react";
import "./intro.css";

const NAME = "YASIRU INDUWARA";
const DISSOLVE_DURATION = 5; // seconds
const FADE_OUT_MS = 1200;

/**
 * Full-screen intro: the name dissolves into petals and dust, then the
 * overlay fades out over the portfolio.
 *
 * onReveal: the dissolve is done, mount the portfolio underneath.
 * onFinish: the overlay has faded out and can be unmounted.
 */
export default function IntroScreen({ onReveal, onFinish }) {
  const canvasContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const finishTimerRef = useRef(null);
  // loading -> ready -> dissolving -> leaving
  const [status, setStatus] = useState("loading");
  // True when WebGPU/WebGL is unavailable and the name is shown as plain text
  const [isStatic, setIsStatic] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let scene = null;

    const loadScene = async () => {
      try {
        // Loaded on demand so three.js stays out of the main bundle
        const { default: GommageScene } = await import("./gommage/GommageScene");
        if (isCancelled) return;
        scene = new GommageScene();
        sceneRef.current = scene;
        await scene.init(canvasContainerRef.current, NAME);
        if (!isCancelled) setStatus("ready");
      } catch (error) {
        if (isCancelled) return;
        console.warn("Intro animation unavailable, showing the static intro instead.", error);
        sceneRef.current = null;
        setIsStatic(true);
        setStatus("ready");
      }
    };
    void loadScene(); // errors are handled inside

    return () => {
      isCancelled = true;
      scene?.dispose();
      sceneRef.current = null;
      clearTimeout(finishTimerRef.current);
    };
  }, []);

  // Keep the page behind the overlay from scrolling
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const reveal = () => {
    onReveal();
    setStatus("leaving");
    finishTimerRef.current = setTimeout(onFinish, FADE_OUT_MS);
  };

  const handleEnter = () => {
    if (!sceneRef.current) {
      reveal();
      return;
    }
    setStatus("dissolving");
    sceneRef.current.dissolve(DISSOLVE_DURATION).then(reveal);
  };

  const className = `intro intro--${status}${isStatic ? " intro--static" : ""}`;

  return (
    <div className={className} style={{ "--intro-fade-duration": `${FADE_OUT_MS}ms` }}>
      <div ref={canvasContainerRef} className="intro__canvas" aria-hidden="true" />
      <span className="intro__loader" aria-hidden="true" />
      <h1 className="intro__name">{NAME}</h1>
      <button type="button" className="intro__button" onClick={handleEnter} disabled={status !== "ready"}>
        Go to Portfolio
      </button>
    </div>
  );
}
