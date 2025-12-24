import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initAboutHorizontalScroll(
  containerEl: HTMLElement,
  trackEl: HTMLElement
) {
  const ctx = gsap.context(() => {
    const getDistance = () => {
      const total = trackEl.scrollWidth;
      const viewport = window.innerWidth;
      return Math.max(0, total - viewport);
    };

    const distance = getDistance();
    if (distance === 0) return;

    gsap.to(trackEl, {
      x: () => -getDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: containerEl,
        start: "top top",
        end: () => `+=${getDistance()}`,
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, containerEl);

  return () => ctx.revert();
}
