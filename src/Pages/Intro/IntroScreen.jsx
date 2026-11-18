import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./intro.css";

const NAME = "YASIRU INDUWARA";
const ROLE = "Full Stack Engineer";

// The last word fades from the site's sky blue to ice blue, like the hero heading
const GRADIENT_FROM = [96, 165, 250];
const GRADIENT_TO = [199, 224, 255];
const ICE = "rgb(199, 224, 255)";

const SHUTTER_COUNT = 5;
const COUNT_DURATION = 2.4; // seconds the counter takes to reach 100
const EXIT_AT = 2.9; // seconds into the timeline when the exit starts
const FONT_WAIT_MS = 1500; // never wait longer than this for the web font
const SKIP_SPEED = 4;

const words = NAME.split(" ");

const gradientColor = (t) =>
  `rgb(${GRADIENT_FROM.map((from, i) => Math.round(from + (GRADIENT_TO[i] - from) * t)).join(", ")})`;

/**
 * Full-screen intro: a counter runs to 100 while the name rises into place,
 * then the letters leave and five shutters lift away over the portfolio.
 *
 * onReveal: the shutters start lifting, mount the portfolio underneath.
 * onFinish: the shutters are gone and the overlay can be unmounted.
 */
export default function IntroScreen({ onReveal, onFinish }) {
  const rootRef = useRef(null);
  const spotRef = useRef(null);
  const counterRef = useRef(null);
  const timelineRef = useRef(null);
  // Always the latest callbacks, so the animation effect only has to run once
  const callbacksRef = useRef({ onReveal, onFinish });
  callbacksRef.current = { onReveal, onFinish };
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let isRevealed = false;
    const root = rootRef.current;
    const counterEl = counterRef.current;
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const reveal = () => {
      if (isRevealed) return;
      isRevealed = true;
      callbacksRef.current.onReveal();
    };
    const finish = () => {
      reveal();
      callbacksRef.current.onFinish();
    };

    const writeCounter = (value) => {
      counterEl.textContent = String(Math.round(value)).padStart(3, "0");
    };

    const moveSpotlight = () => {
      spotRef.current.style.setProperty("--mx", `${pointer.x}px`);
      spotRef.current.style.setProperty("--my", `${pointer.y}px`);
    };
    const handlePointerMove = (event) => {
      gsap.to(pointer, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.8,
        ease: "power3.out",
        overwrite: true,
        onUpdate: moveSpotlight,
      });
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      timelineRef.current = timeline;

      if (reducedMotion) {
        // No movement: show the finished intro for a moment, then fade it out
        gsap.set(".intro__char", { yPercent: 0, y: 0 });
        gsap.set(".intro__meta", { autoAlpha: 1 });
        writeCounter(100);
        timeline
          .add(reveal, 0.8)
          .to(root, { autoAlpha: 0, duration: 0.5, ease: "power1.inOut" }, 0.8)
          .add(finish);
        return;
      }

      const counter = { value: 0 };
      timeline
        // Entrance: labels fade up, the name rises through its masks, the counter runs
        .fromTo(".intro__meta", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0)
        .fromTo(
          ".intro__char",
          { yPercent: 115, y: 0, rotate: 6 },
          { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.05 },
          0.2
        )
        .fromTo(
          ".intro__progress-fill",
          { scaleX: 0 },
          { scaleX: 1, duration: COUNT_DURATION, ease: "power2.inOut" },
          0.2
        )
        .to(
          counter,
          { value: 100, duration: COUNT_DURATION, ease: "power2.inOut", onUpdate: () => writeCounter(counter.value) },
          0.2
        )
        .to(counterEl, { color: ICE, duration: 0.5, ease: "power2.out" }, 0.2 + COUNT_DURATION)
        // Exit: letters fly out upwards, then the shutters lift away in a wave
        .addLabel("exit", EXIT_AT)
        .to(".intro__char", { yPercent: -115, rotate: -6, duration: 0.8, ease: "expo.in", stagger: 0.03 }, "exit")
        .to(".intro__meta", { autoAlpha: 0, y: -10, duration: 0.5, ease: "power2.in", stagger: 0.04 }, "exit")
        .addLabel("lift", "exit+=0.7")
        .add(reveal, "lift")
        .to(".intro__stage", { autoAlpha: 0, duration: 0.6, ease: "power1.inOut" }, "lift")
        .to(
          ".intro__shutter",
          { yPercent: -100, duration: 1.1, ease: "expo.inOut", stagger: { each: 0.08, from: "center" } },
          "lift"
        )
        .add(finish);

      moveSpotlight();
      root.addEventListener("pointermove", handlePointerMove);
    }, root);

    // Start once the heading font is ready, so the name doesn't pop from a fallback font
    const fontReady = document.fonts ? document.fonts.load('700 100px "Space Grotesk"') : Promise.resolve();
    Promise.race([fontReady, new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS))])
      .catch(() => {})
      .then(() => {
        if (!isCancelled) timelineRef.current?.play();
      });

    return () => {
      isCancelled = true;
      root.removeEventListener("pointermove", handlePointerMove);
      gsap.killTweensOf(pointer);
      ctx.revert();
      timelineRef.current = null;
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

  // Skipping just plays the rest of the timeline much faster, so every step still runs
  const handleSkip = () => {
    setSkipped(true);
    timelineRef.current?.timeScale(SKIP_SPEED);
  };

  return (
    <div className="intro" ref={rootRef}>
      <div className="intro__shutters" aria-hidden="true">
        {Array.from({ length: SHUTTER_COUNT }, (_, i) => (
          <span className="intro__shutter" key={i} />
        ))}
      </div>

      <div className="intro__stage">
        <div className="intro__bg" aria-hidden="true">
          <span className="intro__orb intro__orb--1" />
          <span className="intro__orb intro__orb--2" />
          <span className="intro__grid" />
          <span className="intro__spot" ref={spotRef} />
        </div>

        <div className="intro__top">
          <span className="intro__label intro__meta">Portfolio &middot; {new Date().getFullYear()}</span>
          <button type="button" className="intro__skip intro__meta" onClick={handleSkip} disabled={skipped}>
            Skip intro
          </button>
        </div>

        <h1 className="intro__name" aria-label={NAME}>
          {words.map((word, w) => (
            <span className="intro__word" key={word} aria-hidden="true">
              {[...word].map((char, i) => (
                <span className="intro__mask" key={i}>
                  <span
                    className="intro__char"
                    style={w === words.length - 1 ? { color: gradientColor(i / (word.length - 1)) } : undefined}
                  >
                    {char}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h1>

        <div className="intro__progress intro__meta" aria-hidden="true">
          <span className="intro__progress-fill" />
        </div>

        <div className="intro__bottom">
          <div className="intro__meta">
            <p className="intro__role">{ROLE}</p>
            <p className="intro__label intro__loading">
              <span className="intro__dot" aria-hidden="true" />
              Loading experience
            </p>
          </div>
          <p className="intro__counter intro__meta" ref={counterRef} aria-hidden="true">
            000
          </p>
        </div>
      </div>
    </div>
  );
}
