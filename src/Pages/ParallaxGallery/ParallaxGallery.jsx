/*
 * Full-screen photo panels with scroll parallax, adapted from
 * "Infinite Scroll with Parallax" by Joe Ben Taylor (MIT).
 * https://github.com/joebentaylor1995/infinite-scroll-with-parallax
 */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import studioPortrait from "./assets/portrait-studio.jpg";
import "./gallery.css";

gsap.registerPlugin(ScrollTrigger);

// `position` is the object-position used to keep the face in frame when cropped
const PHOTOS = [
  { src: studioPortrait, alt: "Yasiru Induwara, studio portrait", title: "Yasiru", position: "50% 35%" },
];

// Values while a panel travels from the bottom of the screen to the top
const IMAGE_SHIFT = { from: -50, to: 50 }; // yPercent
const TITLE_SCALE = { from: 1.5, to: 0.5 };

export default function ParallaxGallery() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const ctx = gsap.context(() => {
      gsap.utils.toArray(".gallery__panel").forEach((panel) => {
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: panel,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          })
          .fromTo(panel.querySelector(".gallery__image"), { yPercent: IMAGE_SHIFT.from }, { yPercent: IMAGE_SHIFT.to }, 0)
          .fromTo(panel.querySelector(".gallery__title"), { scale: TITLE_SCALE.from }, { scale: TITLE_SCALE.to }, 0);
      });
    }, sectionRef);

    // Images above this section load after mount and push it down, so re-measure
    const resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="home" className="gallery" aria-label="Photos of Yasiru Induwara">
      {PHOTOS.map((photo) => (
        <div key={photo.title} className="gallery__panel">
          <img
            src={photo.src}
            alt={photo.alt}
            className="gallery__image"
            style={{ objectPosition: photo.position }}
            loading="lazy"
            decoding="async"
          />
          <p className="gallery__title" aria-hidden="true">
            {photo.title}
          </p>
        </div>
      ))}
    </section>
  );
}
