import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const PAPER = "#f5f4ef";
const NAVY = "#0b2a5b";
const EASE = "power3.out";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

// The arrival sequence should always play from the top, even on reload.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

// Wrap each .line's text in an inner span so it can slide up inside the mask.
document.querySelectorAll<HTMLElement>(".line").forEach((line) => {
  const inner = document.createElement("span");
  inner.textContent = line.textContent;
  line.textContent = "";
  line.appendChild(inner);
});

if (reduceMotion) {
  root.classList.remove("js");
} else {
  gsap.registerPlugin(ScrollTrigger);

  // Hidden states are set here, not in CSS, so the page is readable if this script never runs.
  // (The inline critical CSS in index.html holds the same states until this runs.)
  gsap.set(".hero__letter", { opacity: 0, y: "0.35em" });
  gsap.set(".hero__line", { opacity: 0 });
  gsap.set(".line > span", { y: 0, yPercent: 110 });
  gsap.set(".hero__v polygon", { opacity: 1 });

  // Smooth scroll
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Hero: the V draws itself from the tip upward, then the name settles.
  const vClip = document.querySelector<SVGRectElement>(".hero__v-clip")!;
  gsap.set(vClip, { attr: { y: 510, height: 0 } });

  const intro = gsap.timeline({ delay: 0.35 });
  intro
    .to(vClip, {
      attr: { y: 0, height: 510 },
      duration: 1.3,
      ease: "power3.inOut",
    })
    .to(
      ".hero__name .hero__letter",
      { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.045 },
      "-=0.45",
    )
    .to(
      ".hero__the .hero__letter",
      { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.06 },
      "<0.1",
    )
    .to(".hero__line", { opacity: 1, duration: 1.4, ease: "power2.out" }, "-=0.5");

  // Hero drifts up and fades as the reader leaves it. Targets the wrapper, not the
  // tagline, so the intro's own opacity tween is never overwritten on scroll-back.
  gsap.to(".hero__inner", {
    yPercent: -18,
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });

  // The tagline leaves the moment scrolling starts and returns at the top. It lives in
  // its own wrapper so this never fights the intro's fade-in on .hero__line.
  const tagOut = gsap.to(".hero__tag", {
    opacity: 0,
    y: -14,
    duration: 0.45,
    ease: "power2.out",
    paused: true,
  });
  ScrollTrigger.create({
    start: 24,
    end: "max",
    onEnter: () => tagOut.play(),
    onLeaveBack: () => tagOut.reverse(),
  });

  // Paper to navy as the reader crosses the first turn, and back to paper for the
  // close. Both use explicit from/to values so neither depends on what the other
  // has already rendered; otherwise the return trip can get stuck on the wrong colour.
  const paper = { "--bg": PAPER, "--fg": NAVY, "--mark-opacity": 0 };
  const navy = { "--bg": NAVY, "--fg": PAPER, "--mark-opacity": 0.04 };

  gsap.fromTo(root, paper, {
    ...navy,
    ease: "none",
    immediateRender: false,
    scrollTrigger: { trigger: ".turn", start: "top 70%", end: "bottom 40%", scrub: 0.6 },
  });

  gsap.fromTo(root, navy, {
    ...paper,
    ease: "none",
    immediateRender: false,
    scrollTrigger: { trigger: ".turn--back", start: "top 70%", end: "bottom 40%", scrub: 0.6 },
  });

  // The watermark V drifts slower than the page.
  // x/y are zeroed so GSAP doesn't stack on top of the CSS centering transform.
  gsap.fromTo(
    ".watermark",
    { x: 0, y: 0, xPercent: -50, yPercent: -42 },
    {
      yPercent: -58,
      ease: "none",
      scrollTrigger: {
        trigger: "main",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
      },
    },
  );

  // Each movement's lines rise into view once, with their label just ahead.
  document.querySelectorAll<HTMLElement>(".movement, .close").forEach((section) => {
    const label = section.querySelector(".movement__label");
    const lines = section.querySelectorAll(".line > span");

    if (label) gsap.set(label, { opacity: 0, y: 8 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 58%",
        once: true,
      },
    });

    if (label) tl.to(label, { opacity: 0.55, y: 0, duration: 0.9, ease: EASE });
    tl.to(
      lines,
      { yPercent: 0, duration: 1.4, ease: EASE, stagger: 0.12 },
      label ? "-=0.6" : 0,
    );
  });

  // Footer fades in quietly.
  gsap.from(".foot", {
    opacity: 0,
    y: 12,
    duration: 1.2,
    ease: EASE,
    scrollTrigger: { trigger: ".foot", start: "top 90%", once: true },
  });

  // Positions depend on web fonts; refresh once they land.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
